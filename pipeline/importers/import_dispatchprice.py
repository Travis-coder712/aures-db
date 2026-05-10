"""Import AEMO NEMWEB DISPATCHPRICE 5-min regional spot prices.

Two zip sources, one schema:

  1. MMSDM DISPATCHPRICE monthly archives — one per month, ~5-10 MB each.
     CSV section: I,DISPATCH,PRICE / D,DISPATCH,PRICE
  2. NEMWEB Reports/Current/Public_Prices/ daily zips — one per day.
     CSV section: I,DREGION / D,DREGION
     (Used to fill the gap since the last MMSDM month-end, which lags ~2 weeks.)

Both sources expose SETTLEMENTDATE / REGIONID / RRP per 5-minute interval; we
aggregate to daily stats per region:
  avg_rrp          — daily average regional reference price ($/MWh)
  peak_rrp         — maximum 5-min spot price that day
  peak_rrp_time    — when the daily peak price occurred
  p90_rrp          — 90th-percentile price (price battery can expect on typical
                     high-value dispatch)
  negative_count   — intervals where price was ≤ 0 (curtailment / oversupply)
  intervals        — total 5-min intervals counted

Usage:
  python3 pipeline/importers/import_dispatchprice.py --days 14
  python3 pipeline/importers/import_dispatchprice.py --month 2025-12
  python3 pipeline/importers/import_dispatchprice.py --months 2024-08 2026-03
"""
from __future__ import annotations

import argparse
import csv
import io
import os
import re
import sqlite3
import sys
import zipfile
from collections import defaultdict
from datetime import datetime, timedelta
from urllib.parse import unquote, urljoin

try:
    import requests
except ImportError:
    print("! The 'requests' library is required: pip install requests")
    sys.exit(1)

DB_PATH   = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')
CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'nemweb_cache')

NEMWEB_BASE = 'https://nemweb.com.au'
CURRENT_PRICES_URL = f'{NEMWEB_BASE}/Reports/Current/Public_Prices/'
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


def parse_prices_dregion(content: bytes) -> dict[tuple[str, str], list[float]]:
    """Parse Public_Prices DREGION CSV → {(date, region): [rrp, ...]}.

    Public_Prices daily zips use a different section name than MMSDM:
      I,DREGION,,2,SETTLEMENTDATE,RUNNO,REGIONID,INTERVENTION,RRP,...
      D,DREGION,,...
    We keep INTERVENTION=0 rows (the actual settled dispatch run).
    """
    reader = csv.reader(io.StringIO(content.decode('utf-8', errors='replace')))
    header = None
    seen: dict[tuple[str, str, str], float] = {}

    for row in reader:
        if not row:
            continue
        if row[0] == 'I' and len(row) >= 2 and row[1] == 'DREGION':
            header = row
            continue
        if row[0] != 'D' or not header:
            continue
        if len(row) < 2 or row[1] != 'DREGION':
            continue

        try:
            region_i = header.index('REGIONID')
            date_i   = header.index('SETTLEMENTDATE')
            rrp_i    = header.index('RRP')
            interv_i = header.index('INTERVENTION')
        except ValueError:
            continue

        region   = (row[region_i] if region_i < len(row) else '').strip().upper()
        settle_s = (row[date_i]   if date_i   < len(row) else '').strip()
        rrp_s    = (row[rrp_i]    if rrp_i    < len(row) else '').strip()
        interv_s = (row[interv_i] if interv_i < len(row) else '').strip()

        if region not in NEM_REGIONS or not settle_s or not rrp_s:
            continue
        # Skip intervention rows; INTERVENTION=0 is the actual dispatch outcome
        if interv_s and interv_s != '0':
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

        date_str   = settle_dt.strftime('%Y-%m-%d')
        settle_iso = settle_dt.isoformat()
        seen[(date_str, region, settle_iso)] = rrp

    grouped: dict[tuple[str, str], list[float]] = defaultdict(list)
    for (date_str, region, _), rrp in seen.items():
        grouped[(date_str, region)].append(rrp)
    return grouped


def process_zip(zip_path: str, conn: sqlite3.Connection,
                source: str = 'mmsdm') -> int:
    """Process a price zip. source='mmsdm' uses DISPATCH/PRICE; 'public' uses DREGION."""
    parser = parse_prices if source == 'mmsdm' else parse_prices_dregion
    total = 0
    try:
        with zipfile.ZipFile(zip_path) as zf:
            for name in zf.namelist():
                if not name.upper().endswith('.CSV'):
                    continue
                with zf.open(name) as f:
                    content = f.read()
                grouped = parser(content)
                n = upsert_prices(conn, grouped)
                if n:
                    total += n
    except zipfile.BadZipFile:
        print(f'  ! bad zip: {zip_path}')
    return total


def list_current_price_zip_urls() -> list[str]:
    """List PUBLIC_PRICES zip URLs from NEMWEB Current/Public_Prices."""
    try:
        r = requests.get(CURRENT_PRICES_URL, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f'  ! failed to list NEMWEB Public_Prices: {e}')
        return []
    hrefs = re.findall(r'href="([^"]+\.zip)"', r.text, re.IGNORECASE)
    return [urljoin(CURRENT_PRICES_URL, h) for h in hrefs]


def import_current(days: int) -> None:
    """Pull last N days of Public_Prices DREGION zips into dispatch_price_daily.

    AEMO's trading day starts at 04:00, so a single Public_Prices zip spans two
    calendar dates. We accumulate raw RRPs from ALL zips into one
    {(date, region): [rrp, ...]} dict before computing daily aggregates and
    upserting — otherwise the later zip's partial-day overwrites the earlier
    zip's full-day contribution.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)

    urls = list_current_price_zip_urls()
    if not urls:
        print('  ! no Public_Prices URLs found. Is NEMWEB reachable?')
        conn.close()
        return

    cutoff = datetime.now() - timedelta(days=days)
    grouped_all: dict[tuple[str, str], list[float]] = defaultdict(list)
    # Cross-zip dedupe keyed by (date, region, settle_iso) — each (region, time)
    # interval has only one RRP, regardless of which trading-day zip surfaces it.
    seen_intervals: dict[tuple[str, str, str], float] = {}
    seen_targets: set[str] = set()
    processed = 0

    for url in sorted(urls, reverse=True):
        m = re.search(r'(\d{8})\d{4}', os.path.basename(url))
        if not m:
            continue
        file_date = datetime.strptime(m.group(1), '%Y%m%d')
        if file_date < cutoff:
            break
        target = os.path.join(CACHE_DIR, os.path.basename(url))
        if target in seen_targets:
            continue
        seen_targets.add(target)
        if not download(url, target):
            continue
        try:
            zf = zipfile.ZipFile(target)
        except zipfile.BadZipFile:
            print(f'  ! bad zip: {os.path.basename(target)}')
            continue
        with zf:
            for name in zf.namelist():
                if not name.upper().endswith('.CSV'):
                    continue
                with zf.open(name) as f:
                    content = f.read()
                _accumulate_dregion(content, seen_intervals)
        processed += 1
        print(f'  {os.path.basename(target)}: cumulative {len(seen_intervals)} intervals')

    # Roll the deduped intervals up into per (date, region) lists
    for (date_str, region, _), rrp in seen_intervals.items():
        grouped_all[(date_str, region)].append(rrp)

    n = upsert_prices(conn, grouped_all)
    conn.close()
    print(f'  Total: {n} (date,region) rows upserted from {processed} Public_Prices zips '
          f'({len(grouped_all)} unique (date, region) pairs)')


def _accumulate_dregion(
    content: bytes,
    seen_intervals: dict[tuple[str, str, str], float],
) -> None:
    """Parse a Public_Prices CSV's DREGION rows into a shared dedupe dict.

    Same matching/filtering logic as parse_prices_dregion, but folds into an
    externally-provided seen_intervals dict so contributions from multiple
    zips for the same (date, region, time) collapse to a single value.
    """
    reader = csv.reader(io.StringIO(content.decode('utf-8', errors='replace')))
    header = None

    for row in reader:
        if not row:
            continue
        if row[0] == 'I' and len(row) >= 2 and row[1] == 'DREGION':
            header = row
            continue
        if row[0] != 'D' or not header:
            continue
        if len(row) < 2 or row[1] != 'DREGION':
            continue

        try:
            region_i = header.index('REGIONID')
            date_i   = header.index('SETTLEMENTDATE')
            rrp_i    = header.index('RRP')
            interv_i = header.index('INTERVENTION')
        except ValueError:
            continue

        region   = (row[region_i] if region_i < len(row) else '').strip().upper()
        settle_s = (row[date_i]   if date_i   < len(row) else '').strip()
        rrp_s    = (row[rrp_i]    if rrp_i    < len(row) else '').strip()
        interv_s = (row[interv_i] if interv_i < len(row) else '').strip()

        if region not in NEM_REGIONS or not settle_s or not rrp_s:
            continue
        if interv_s and interv_s != '0':
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

        date_str   = settle_dt.strftime('%Y-%m-%d')
        settle_iso = settle_dt.isoformat()
        seen_intervals[(date_str, region, settle_iso)] = rrp


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
    grp.add_argument('--days',   type=int, metavar='N',
                     help='Pull last N days from Public_Prices')
    grp.add_argument('--month',  metavar='YYYY-MM')
    grp.add_argument('--months', nargs=2, metavar=('START', 'END'))
    args = parser.parse_args()

    print('DISPATCHPRICE Importer')
    if args.days:
        import_current(args.days)
    elif args.month:
        import_archive(args.month)
    elif args.months:
        import_months_range(args.months[0], args.months[1])


if __name__ == '__main__':
    main()
