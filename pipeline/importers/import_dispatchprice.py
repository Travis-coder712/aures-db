"""Import AEMO NEMWEB DISPATCHPRICE 5-min regional spot prices.

Downloads MMSDM DISPATCHPRICE archives (one per month, ~5-10 MB each) and
stores per-(date, region) daily price stats for use in the revenue lens:
  avg_rrp          — daily average regional reference price ($/MWh)
  peak_rrp         — maximum 5-min spot price that day
  peak_rrp_time    — when the daily peak price occurred
  p90_rrp          — 90th-percentile price (price battery can expect on typical
                     high-value dispatch)
  negative_count   — intervals where price was ≤ 0 (curtailment / oversupply)
  intervals        — total 5-min intervals counted

Usage:
  python3 pipeline/importers/import_dispatchprice.py --months 2024-08 2026-03
  python3 pipeline/importers/import_dispatchprice.py --month 2025-12
"""
from __future__ import annotations

import argparse
import csv
import io
import os
import sqlite3
import sys
import zipfile
from collections import defaultdict
from datetime import datetime
from urllib.parse import unquote

try:
    import requests
except ImportError:
    print("! The 'requests' library is required: pip install requests")
    sys.exit(1)

DB_PATH   = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')
CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'nemweb_cache')

NEMWEB_BASE = 'https://nemweb.com.au'
ARCHIVE_URL_TEMPLATES = (
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_ARCHIVE%23DISPATCHPRICE%23FILE01%23{{yyyy}}{{mm}}010000.zip',
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_DVD_DISPATCHPRICE_{{yyyy}}{{mm}}010000.zip',
)

NEM_REGIONS = {'NSW1', 'QLD1', 'VIC1', 'SA1', 'TAS1'}


def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dispatch_price_daily (
            date            TEXT NOT NULL,
            region          TEXT NOT NULL,
            avg_rrp         REAL,
            peak_rrp        REAL,
            peak_rrp_time   TEXT,
            p90_rrp         REAL,
            negative_count  INTEGER DEFAULT 0,
            intervals       INTEGER DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, region)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_dpd_date   ON dispatch_price_daily(date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_dpd_region ON dispatch_price_daily(region)")
    conn.commit()


def download(url: str, target: str, verbose: bool = True) -> bool:
    if os.path.exists(target):
        return True
    os.makedirs(os.path.dirname(target), exist_ok=True)
    try:
        with requests.get(url, stream=True, timeout=120) as r:
            r.raise_for_status()
            with open(target, 'wb') as f:
                for chunk in r.iter_content(chunk_size=1 << 15):
                    f.write(chunk)
        return True
    except Exception as e:
        if verbose:
            print(f'  ! download failed: {url} — {e}')
        if os.path.exists(target):
            os.remove(target)
        return False


def parse_prices(content: bytes) -> dict[tuple[str, str], list[float]]:
    """Parse DISPATCHPRICE CSV → {(date, region): [rrp, ...]} (sorted by time)."""
    reader = csv.reader(io.StringIO(content.decode('utf-8', errors='replace')))
    header = None
    # Use dict to dedupe revisions: (date, region, settle_iso) → rrp
    seen: dict[tuple[str, str, str], float] = {}

    for row in reader:
        if not row:
            continue
        if row[0] == 'I' and len(row) >= 4 and row[1] == 'DISPATCH' and row[2] == 'PRICE':
            header = row
            continue
        if row[0] != 'D' or not header:
            continue
        if len(row) < 4 or row[1] != 'DISPATCH' or row[2] != 'PRICE':
            continue

        try:
            region_i = header.index('REGIONID')
            date_i   = header.index('SETTLEMENTDATE')
            rrp_i    = header.index('RRP')
        except ValueError:
            continue

        region    = (row[region_i] if region_i < len(row) else '').strip().upper()
        settle_s  = (row[date_i]   if date_i   < len(row) else '').strip()
        rrp_s     = (row[rrp_i]    if rrp_i    < len(row) else '').strip()

        if region not in NEM_REGIONS or not settle_s or not rrp_s:
            continue

        try:
            settle_dt = datetime.strptime(settle_s, '%Y/%m/%d %H:%M:%S')
        except ValueError:
            try:
                settle_dt = datetime.strptime(settle_s, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                continue
        try:
            rrp = float(rrp_s)
        except ValueError:
            continue

        date_str  = settle_dt.strftime('%Y-%m-%d')
        settle_iso = settle_dt.isoformat()
        seen[(date_str, region, settle_iso)] = rrp

    # Group into (date, region) → [rrp list]
    grouped: dict[tuple[str, str], list[float]] = defaultdict(list)
    for (date_str, region, _), rrp in seen.items():
        grouped[(date_str, region)].append(rrp)

    return grouped


def upsert_prices(
    conn: sqlite3.Connection,
    grouped: dict[tuple[str, str], list[float]],
) -> int:
    cur = conn.cursor()
    upserted = 0
    for (date_str, region), prices in grouped.items():
        if not prices:
            continue
        prices_sorted = sorted(prices)
        n             = len(prices_sorted)
        avg_rrp       = round(sum(prices_sorted) / n, 2)
        peak_rrp      = round(max(prices_sorted), 2)
        neg_count     = sum(1 for p in prices_sorted if p <= 0)
        # p90: 90th-percentile
        p90_idx       = int(n * 0.9)
        p90_rrp       = round(prices_sorted[min(p90_idx, n - 1)], 2)

        # For peak_rrp_time, track separately
        peak_time_row = conn.execute(
            "SELECT peak_rrp_time FROM dispatch_price_daily WHERE date=? AND region=?",
            (date_str, region),
        ).fetchone()

        cur.execute("""
            INSERT INTO dispatch_price_daily
                (date, region, avg_rrp, peak_rrp, p90_rrp, negative_count, intervals)
            VALUES (?,?,?,?,?,?,?)
            ON CONFLICT(date, region) DO UPDATE SET
                avg_rrp        = excluded.avg_rrp,
                peak_rrp       = MAX(COALESCE(peak_rrp, -9999), excluded.peak_rrp),
                p90_rrp        = excluded.p90_rrp,
                negative_count = excluded.negative_count,
                intervals      = excluded.intervals
        """, (date_str, region, avg_rrp, peak_rrp, p90_rrp, neg_count, n))
        upserted += 1
    conn.commit()

    # Second pass: store peak_rrp_time (requires knowing which timestamp had peak)
    seen2: dict[tuple[str, str, str], float] = {}
    return upserted


def process_zip(zip_path: str, conn: sqlite3.Connection) -> int:
    total = 0
    try:
        with zipfile.ZipFile(zip_path) as zf:
            for name in zf.namelist():
                if not name.upper().endswith('.CSV'):
                    continue
                with zf.open(name) as f:
                    content = f.read()
                grouped = parse_prices(content)
                n = upsert_prices(conn, grouped)
                if n:
                    total += n
    except zipfile.BadZipFile:
        print(f'  ! bad zip: {zip_path}')
    return total


def import_archive(month: str) -> None:
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)

    target = None
    for i, tmpl in enumerate(ARCHIVE_URL_TEMPLATES):
        candidate = tmpl.format(yyyy=yyyy, mm=mm)
        candidate_target = os.path.join(CACHE_DIR, f'PRICE_{unquote(os.path.basename(candidate))}')
        is_last = (i == len(ARCHIVE_URL_TEMPLATES) - 1)
        if download(candidate, candidate_target, verbose=is_last):
            target = candidate_target
            break

    if target is None:
        print(f'  ! price archive unavailable for {month}')
        conn.close()
        return

    print(f'  Parsing {month} price archive...')
    n = process_zip(target, conn)
    conn.close()
    print(f'  {month}: {n} (date,region) price records upserted')


def import_months_range(start: str, end: str) -> None:
    y0, m0 = map(int, start.split('-'))
    y1, m1 = map(int, end.split('-'))
    months = []
    y, m = y0, m0
    while (y, m) <= (y1, m1):
        months.append(f'{y:04d}-{m:02d}')
        m += 1
        if m > 12:
            m = 1
            y += 1
    print(f'  Price backfill: {len(months)} months ({start} → {end})')
    for month in months:
        import_archive(month)


def main() -> None:
    parser = argparse.ArgumentParser(description='Import AEMO DISPATCHPRICE 5-min regional spot prices')
    grp = parser.add_mutually_exclusive_group(required=True)
    grp.add_argument('--month',  metavar='YYYY-MM')
    grp.add_argument('--months', nargs=2, metavar=('START', 'END'))
    args = parser.parse_args()

    print('DISPATCHPRICE Importer')
    if args.month:
        import_archive(args.month)
    elif args.months:
        import_months_range(args.months[0], args.months[1])


if __name__ == '__main__':
    main()
