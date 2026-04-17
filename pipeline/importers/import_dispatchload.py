"""Import DISPATCHLOAD data from NEMWEB for NEM coal DUIDs.

AEMO publishes per-DUID dispatch data including AVAILABILITY (MW offered),
TOTALCLEARED (MW dispatched), and INITIALMW (MW at start of interval) at
5-minute resolution. This lets us distinguish:

  - OUTAGE: AVAILABILITY << registered capacity (unit unavailable — outage)
  - DISPLACED: AVAILABILITY ≈ capacity, but TOTALCLEARED << AVAILABILITY
    (unit offered but not dispatched — market displacement)
  - DISPATCHED: TOTALCLEARED ≈ AVAILABILITY ≈ capacity (normal operation)

Two entry points:

  # Pull last 7 days from NEMWEB Current/Next_Day_Dispatch
  python3 pipeline/importers/import_dispatchload.py --days 7

  # Pull a historical month archive
  python3 pipeline/importers/import_dispatchload.py --month 2025-12

Requires: a reasonable local network, ~50-500 MB of temporary download space,
and the pipeline/config/coal_stations.json DUID list.

NEMWEB migrates platforms 21 April 2026 — the BASE_URL constants may need to
change after that date. See:
https://www.aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/market-data-nemweb
"""
from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import sqlite3
import sys
import zipfile
from datetime import datetime, timedelta
from urllib.parse import urljoin

try:
    import requests
except ImportError:
    print("! The 'requests' library is required. Install with: pip install requests")
    sys.exit(1)

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'coal_stations.json')
CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'nemweb_cache')

NEMWEB_BASE = 'https://nemweb.com.au'
CURRENT_DISPATCH_URL = f'{NEMWEB_BASE}/Reports/Current/Next_Day_Dispatch/'
# AEMO changed the MMSDM DISPATCHLOAD archive filename from
# PUBLIC_DVD_DISPATCHLOAD_... to PUBLIC_ARCHIVE#DISPATCHLOAD#FILE01#... at
# around August 2024. Try the new format first, fall back to the legacy
# format for older months. Both live in the same DATA/ directory.
ARCHIVE_URL_TEMPLATES = (
    # New format (Aug 2024 onward)
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_ARCHIVE%23DISPATCHLOAD%23FILE01%23{{yyyy}}{{mm}}010000.zip',
    # Legacy format (through July 2024)
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_DVD_DISPATCHLOAD_{{yyyy}}{{mm}}010000.zip',
)


def load_coal_duids() -> set[str]:
    with open(CONFIG_PATH) as f:
        data = json.load(f)
    duids = set()
    for station in data['stations']:
        for duid in station['duids']:
            duids.add(duid.upper())
    return duids


def ensure_schema(conn):
    """Create dispatch_availability table if missing."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dispatch_availability (
            id                INTEGER PRIMARY KEY AUTOINCREMENT,
            settlement_date   TEXT NOT NULL,
            duid              TEXT NOT NULL,
            availability_mw   REAL,
            total_cleared_mw  REAL,
            initial_mw        REAL,
            dispatch_mode     TEXT,
            created_at        TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(settlement_date, duid)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_dispatch_avail_duid ON dispatch_availability(duid)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_dispatch_avail_date ON dispatch_availability(settlement_date)")


def list_current_zip_urls() -> list[str]:
    """Scrape the Next_Day_Dispatch directory for per-day zip files."""
    try:
        r = requests.get(CURRENT_DISPATCH_URL, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f'  ! Failed to list NEMWEB current dispatch: {e}')
        return []
    # Match hrefs ending in .zip, case-insensitive
    hrefs = re.findall(r'href="([^"]+\.zip)"', r.text, re.IGNORECASE)
    return [urljoin(CURRENT_DISPATCH_URL, h) for h in hrefs]


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


def classify_mode(avail_mw, total_cleared_mw, capacity_mw):
    """Label each interval as outage / displaced / dispatched."""
    if avail_mw is None:
        return 'unknown'
    cap = capacity_mw or 0
    if cap <= 0:
        return 'unknown'
    # Unit offering less than 20% of capacity → outage (partial or full)
    if avail_mw < cap * 0.2:
        return 'outage'
    if total_cleared_mw is None:
        return 'unknown'
    # Unit available but dispatched for less than 30% of what's offered
    if total_cleared_mw < max(avail_mw * 0.3, 0.5):
        return 'displaced'
    return 'dispatched'


def duid_capacity_map():
    """Return a dict of duid → unit_size_mw from the config."""
    with open(CONFIG_PATH) as f:
        data = json.load(f)
    out: dict[str, float] = {}
    for s in data['stations']:
        size = s.get('unit_size_mw') or (s['capacity_mw'] / max(s['units'], 1))
        for duid in s['duids']:
            out[duid.upper()] = size
    return out


def parse_nemweb_csv(content: bytes, target_duids: set[str]) -> list[tuple]:
    """Parse a NEMWEB DISPATCHLOAD CSV. Returns list of (settlement_date,
    duid, availability, totalcleared, initial_mw) tuples filtered to
    target_duids."""
    reader = csv.reader(io.StringIO(content.decode('utf-8', errors='replace')))
    rows: list[tuple] = []
    header: list[str] | None = None

    for row in reader:
        if not row:
            continue
        row_type = row[0]
        if row_type == 'I' and len(row) >= 4 and row[1] == 'DISPATCH' and row[2] == 'UNIT_SOLUTION':
            # Column header row: 'I','DISPATCH','UNIT_SOLUTION','<version>','SETTLEMENTDATE','RUNNO','DUID',...
            header = row
            continue
        if row_type != 'D' or not header:
            continue
        if len(row) < 4 or row[1] != 'DISPATCH' or row[2] != 'UNIT_SOLUTION':
            continue

        # Build index for the fields we care about
        def col(name):
            try:
                return row[header.index(name)]
            except (ValueError, IndexError):
                return None

        duid = (col('DUID') or '').strip().upper()
        if duid not in target_duids:
            continue

        settle = (col('SETTLEMENTDATE') or '').strip()
        if not settle:
            continue
        avail = col('AVAILABILITY')
        total_cleared = col('TOTALCLEARED')
        initial_mw = col('INITIALMW')

        def to_float(x):
            if x is None or x == '':
                return None
            try:
                return float(x)
            except ValueError:
                return None

        rows.append((
            settle,
            duid,
            to_float(avail),
            to_float(total_cleared),
            to_float(initial_mw),
        ))
    return rows


def insert_rows(conn, rows: list[tuple], capacity_map: dict[str, float]) -> int:
    inserted = 0
    cur = conn.cursor()
    for settle, duid, avail, total_cleared, initial_mw in rows:
        cap = capacity_map.get(duid)
        mode = classify_mode(avail, total_cleared, cap)
        try:
            cur.execute("""
                INSERT OR IGNORE INTO dispatch_availability
                    (settlement_date, duid, availability_mw, total_cleared_mw, initial_mw, dispatch_mode)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (settle, duid, avail, total_cleared, initial_mw, mode))
            inserted += cur.rowcount
        except sqlite3.Error as e:
            print(f'  ! insert error for {duid} @ {settle}: {e}')
    conn.commit()
    return inserted


def import_current(days: int):
    """Pull the last N days of data from Next_Day_Dispatch."""
    coal_duids = load_coal_duids()
    cap_map = duid_capacity_map()
    conn = sqlite3.connect(DB_PATH)
    ensure_schema(conn)

    print(f'  Loading {len(coal_duids)} coal DUIDs')
    urls = list_current_zip_urls()
    if not urls:
        print('  ! No zip URLs discovered. Is NEMWEB reachable?')
        return

    cutoff = datetime.now() - timedelta(days=days)
    print(f'  Scanning {len(urls)} zip files for dates after {cutoff.date()}')
    total_inserted = 0

    for url in sorted(urls, reverse=True):
        # Filenames look like PUBLIC_NEXT_DAY_DISPATCH_YYYYMMDD_XXXXXXXXX.zip
        m = re.search(r'(\d{8})', os.path.basename(url))
        if not m:
            continue
        file_date = datetime.strptime(m.group(1), '%Y%m%d')
        if file_date < cutoff:
            break  # sorted desc — older files come after
        target = os.path.join(CACHE_DIR, os.path.basename(url))
        if not download(url, target):
            continue
        try:
            with zipfile.ZipFile(target) as zf:
                for name in zf.namelist():
                    if not name.upper().endswith('.CSV'):
                        continue
                    with zf.open(name) as f:
                        content = f.read()
                    rows = parse_nemweb_csv(content, coal_duids)
                    n = insert_rows(conn, rows, cap_map)
                    total_inserted += n
                    if n:
                        print(f'  ingested {n} rows from {os.path.basename(name)}')
        except zipfile.BadZipFile:
            print(f'  ! bad zip: {target}')

    # Reclassify rows where mode was unknown but we now have capacity
    conn.close()
    print(f'  Total rows inserted: {total_inserted}')


def import_archive(month: str):
    """Pull a whole historical month from the MMSDM archive."""
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)
    coal_duids = load_coal_duids()
    cap_map = duid_capacity_map()

    conn = sqlite3.connect(DB_PATH)
    ensure_schema(conn)

    url = None
    target = None
    from urllib.parse import unquote
    for i, tmpl in enumerate(ARCHIVE_URL_TEMPLATES):
        candidate = tmpl.format(yyyy=yyyy, mm=mm)
        candidate_target = os.path.join(CACHE_DIR, unquote(os.path.basename(candidate)))
        # Only print the download failure if this is the last template we try
        is_last = (i == len(ARCHIVE_URL_TEMPLATES) - 1)
        if download(candidate, candidate_target, verbose=is_last):
            url = candidate
            target = candidate_target
            break

    if target is None:
        print(f'  ! archive download failed for {month} (tried both URL formats)')
        return

    print(f'  Parsing archive for {month} ({len(coal_duids)} target DUIDs)')
    total = 0
    try:
        with zipfile.ZipFile(target) as zf:
            for name in zf.namelist():
                if not name.upper().endswith('.CSV'):
                    continue
                with zf.open(name) as f:
                    content = f.read()
                rows = parse_nemweb_csv(content, coal_duids)
                n = insert_rows(conn, rows, cap_map)
                total += n
    except zipfile.BadZipFile:
        print(f'  ! bad archive zip')
    conn.close()
    print(f'  Ingested {total} rows for {month}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    g = parser.add_mutually_exclusive_group(required=True)
    g.add_argument('--days', type=int, help='Pull last N days from current NEMWEB')
    g.add_argument('--month', type=str, help='Pull a historical month archive, format YYYY-MM')
    args = parser.parse_args()

    if args.days is not None:
        import_current(args.days)
    else:
        import_archive(args.month)


if __name__ == '__main__':
    main()
