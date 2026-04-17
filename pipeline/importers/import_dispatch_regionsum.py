"""Import daily NEM regional demand from NEMWEB MMSDM DISPATCHREGIONSUM.

AEMO publishes per-region 5-min dispatch aggregates in DISPATCHREGIONSUM,
with TOTALDEMAND (scheduled + semi-scheduled + non-scheduled load served)
per region (NSW1 / QLD1 / VIC1 / SA1 / TAS1). We aggregate 5-min MW into
daily MWh to enable YoY demand comparison on the Energy Transition
Scoreboard.

Two entry points:

  # Pull last 7 days (Current/Next_Day_Dispatch)
  python3 pipeline/importers/import_dispatch_regionsum.py --days 7

  # Pull a historical month from MMSDM
  python3 pipeline/importers/import_dispatch_regionsum.py --month 2025-06

  # Backfill a range of months
  python3 pipeline/importers/import_dispatch_regionsum.py --range 2021-01 2025-12

Cached zips land alongside DISPATCHLOAD archives in data/nemweb_cache/.
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
from urllib.parse import unquote

try:
    import requests
except ImportError:
    print("! 'requests' library required. pip install requests")
    sys.exit(1)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DB_PATH = os.path.join(ROOT_DIR, 'database', 'aures.db')
CACHE_DIR = os.path.join(ROOT_DIR, 'data', 'nemweb_cache')

NEMWEB_BASE = 'https://nemweb.com.au'
ARCHIVE_URL_TEMPLATES = (
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_ARCHIVE%23DISPATCHREGIONSUM%23FILE01%23{{yyyy}}{{mm}}010000.zip',
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_DVD_DISPATCHREGIONSUM_{{yyyy}}{{mm}}010000.zip',
)

TARGET_REGIONS = {'NSW1', 'QLD1', 'VIC1', 'SA1', 'TAS1'}


def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS demand_daily (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            date           TEXT NOT NULL,
            region         TEXT NOT NULL,
            demand_mwh     REAL NOT NULL DEFAULT 0,
            peak_demand_mw REAL,
            interval_count INTEGER NOT NULL DEFAULT 0,
            created_at     TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, region)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_demand_date ON demand_daily(date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_demand_region ON demand_daily(region)")
    conn.commit()


def download(url: str, target: str, verbose: bool = True) -> bool:
    if os.path.exists(target):
        return True
    os.makedirs(os.path.dirname(target), exist_ok=True)
    try:
        with requests.get(url, stream=True, timeout=180) as r:
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


def iter_csv_rows(content: bytes):
    header: list[str] | None = None
    text = content.decode('utf-8', errors='replace')
    reader = csv.reader(io.StringIO(text))
    for row in reader:
        if not row:
            continue
        tag = row[0]
        if tag == 'I':
            header = row[4:]
        elif tag == 'D' and header is not None:
            values = row[4:]
            if len(values) < len(header):
                values = values + [''] * (len(header) - len(values))
            yield dict(zip(header, values))


def _accumulate_csv(content, per_day, per_day_peak, seen=None):
    """DISPATCHREGIONSUM rows also have multiple revisions per
    (SETTLEMENTDATE, REGIONID). Dedupe on that key across the batch."""
    if seen is None:
        seen = set()
    for row in iter_csv_rows(content):
        region = (row.get('REGIONID') or '').strip().upper()
        if region not in TARGET_REGIONS:
            continue
        settlement = row.get('SETTLEMENTDATE') or ''
        if len(settlement) < 10:
            continue
        ikey = (settlement, region)
        if ikey in seen:
            continue
        seen.add(ikey)
        date = settlement[:10].replace('/', '-')
        try:
            demand = float(row.get('TOTALDEMAND') or 0)
        except ValueError:
            continue
        key = (date, region)
        per_day[key] += demand / 12.0
        if demand > per_day_peak[key]:
            per_day_peak[key] = demand


def parse_zip(zip_path: str):
    per_day: dict[tuple[str, str], float] = defaultdict(float)
    per_day_peak: dict[tuple[str, str], float] = defaultdict(float)
    intervals: dict[tuple[str, str], int] = defaultdict(int)

    try:
        zf = zipfile.ZipFile(zip_path)
    except zipfile.BadZipFile:
        print(f'  ! bad zip: {os.path.basename(zip_path)}')
        return {}, {}, {}

    seen: set[tuple[str, str]] = set()
    with zf:
        for name in zf.namelist():
            if name.upper().endswith('.CSV'):
                with zf.open(name) as f:
                    content = f.read()
                _accumulate_csv(content, per_day, per_day_peak, seen)
            elif name.upper().endswith('.ZIP'):
                with zf.open(name) as inner:
                    try:
                        izf = zipfile.ZipFile(io.BytesIO(inner.read()))
                    except zipfile.BadZipFile:
                        continue
                    with izf:
                        for iname in izf.namelist():
                            if iname.upper().endswith('.CSV'):
                                with izf.open(iname) as f:
                                    content = f.read()
                                _accumulate_csv(content, per_day, per_day_peak, seen)

    # Interval count derivable from demand / min_demand heuristic — but just
    # leave as 0 for now; it's bookkeeping only.
    return per_day, per_day_peak, intervals


def upsert_daily(conn, per_day, per_day_peak):
    n = 0
    for (date, region), demand_mwh in per_day.items():
        peak = per_day_peak.get((date, region), 0)
        conn.execute("""
            INSERT INTO demand_daily (date, region, demand_mwh, peak_demand_mw)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(date, region) DO UPDATE SET
              demand_mwh = excluded.demand_mwh,
              peak_demand_mw = excluded.peak_demand_mw
        """, (date, region, round(demand_mwh, 3), round(peak, 2)))
        n += 1
    conn.commit()
    return n


def import_month(month: str) -> None:
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)

    conn = sqlite3.connect(DB_PATH)
    ensure_schema(conn)

    target = None
    for i, tmpl in enumerate(ARCHIVE_URL_TEMPLATES):
        candidate = tmpl.format(yyyy=yyyy, mm=mm)
        candidate_target = os.path.join(CACHE_DIR, unquote(os.path.basename(candidate)))
        is_last = (i == len(ARCHIVE_URL_TEMPLATES) - 1)
        if download(candidate, candidate_target, verbose=is_last):
            target = candidate_target
            break

    if target is None:
        print(f'  ! {month} download failed (tried both URL formats)')
        return

    per_day, per_day_peak, _ = parse_zip(target)
    n = upsert_daily(conn, per_day, per_day_peak)
    print(f'  {month}: {n} daily region-rows')
    conn.close()


def import_range(start_month: str, end_month: str) -> None:
    def _expand(a, b):
        y1, m1 = map(int, a.split('-'))
        y2, m2 = map(int, b.split('-'))
        y, m = y1, m1
        while (y, m) <= (y2, m2):
            yield f'{y:04d}-{m:02d}'
            m += 1
            if m > 12:
                m = 1; y += 1
    for month in _expand(start_month, end_month):
        print(f'==== {month} ====')
        import_month(month)


def main() -> None:
    p = argparse.ArgumentParser(description='Import daily NEM regional demand from NEMWEB MMSDM.')
    p.add_argument('--month', help='Pull one historical month (e.g. 2025-06)')
    p.add_argument('--range', nargs=2, metavar=('START', 'END'),
                   help='Pull months inclusive (e.g. --range 2021-01 2025-12)')
    args = p.parse_args()

    if args.month:
        import_month(args.month)
    elif args.range:
        import_range(args.range[0], args.range[1])
    else:
        p.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
