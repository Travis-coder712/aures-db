"""Import daily per-DUID generation MWh for solar / wind / BESS fleets.

AEMO NEMWEB DISPATCHLOAD (UNIT_SOLUTION) includes EVERY scheduled and semi-
scheduled DUID, not just coal. This importer reads two zip sources:

  1. MMSDM monthly archives in data/nemweb_cache/ (cached by
     import_dispatchload.py)
  2. NEMWEB Reports/Current/Next_Day_Dispatch/ daily zips (for fresh data
     since the last MMSDM month-end — the MMSDM archive lags by ~2 weeks)

It filters to solar / wind / battery DUIDs (via the aemo_generation_info
registry) and aggregates 5-minute dispatch MW into daily MWh per DUID.

Two aggregates are captured per DUID per day:
  - gen_mwh:    sum(max(total_cleared_mw, 0)) / 12     (discharge for BESS)
  - charge_mwh: sum(abs(min(total_cleared_mw, 0))) / 12 (charge for BESS)

Three entry points:

  # Pull the last N days from Next_Day_Dispatch (incremental catch-up)
  python3 pipeline/importers/import_generation_daily.py --days 14

  # Parse all cached MMSDM months for solar/wind/BESS DUIDs
  python3 pipeline/importers/import_generation_daily.py --all-cached

  # Parse a specific cached MMSDM month
  python3 pipeline/importers/import_generation_daily.py --month 2025-12
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
from typing import Iterable
from urllib.parse import urljoin

try:
    import requests
except ImportError:
    print("! The 'requests' library is required: pip install requests")
    sys.exit(1)

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DB_PATH = os.path.join(ROOT_DIR, 'database', 'aures.db')
CACHE_DIR = os.path.join(ROOT_DIR, 'data', 'nemweb_cache')

NEMWEB_BASE = 'https://nemweb.com.au'
CURRENT_DISPATCH_URL = f'{NEMWEB_BASE}/Reports/Current/Next_Day_Dispatch/'

TARGET_FUEL_TYPES = ('Solar PV', 'Wind', 'Battery Storage')


def ensure_schema(conn: sqlite3.Connection) -> None:
    """Create generation_daily table if missing."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS generation_daily (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            date            TEXT NOT NULL,
            duid            TEXT NOT NULL,
            fuel_type       TEXT NOT NULL,
            region          TEXT,
            gen_mwh         REAL NOT NULL DEFAULT 0,
            charge_mwh      REAL NOT NULL DEFAULT 0,
            interval_count  INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, duid)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_gen_daily_date ON generation_daily(date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_gen_daily_duid ON generation_daily(duid)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_gen_daily_fuel ON generation_daily(fuel_type)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_gen_daily_region ON generation_daily(region)")
    conn.commit()


def load_target_duids(conn: sqlite3.Connection) -> dict[str, tuple[str, str]]:
    """Return {DUID → (fuel_type, region)} for solar / wind / BESS DUIDs.

    For solar/wind: includes 'In Service' and 'In Commissioning' only.
    For Battery Storage: also includes 'Committed' and 'Committed*' because
    AEMO's status lags reality — batteries like Waratah, Tarong, Liddell,
    Supernode etc. are actively dispatching in AEMO markets despite showing
    'Committed' status in the generation info registry.
    """
    rows = conn.execute("""
        SELECT DISTINCT UPPER(duid) AS duid, fuel_type, region, status
        FROM aemo_generation_info
        WHERE duid IS NOT NULL AND duid != ''
          AND (
            (fuel_type IN ('Solar PV', 'Wind') AND status IN ('In Service', 'In Commissioning'))
            OR
            (fuel_type = 'Battery Storage' AND status IN (
              'In Service', 'In Commissioning', 'Committed', 'Committed*'
            ))
          )
    """).fetchall()
    out: dict[str, tuple[str, str]] = {}
    for duid, fuel, region, _status in rows:
        if not duid:
            continue
        out[duid] = (fuel, region or '')
    return out


def iter_csv_rows(content: bytes) -> Iterable[dict[str, str]]:
    """Yield dict rows from an NEMWEB SQLLoader CSV (mixed I/D/C lines)."""
    header: list[str] | None = None
    text = content.decode('utf-8', errors='replace')
    reader = csv.reader(io.StringIO(text))
    for row in reader:
        if not row:
            continue
        tag = row[0]
        if tag == 'I':
            # Header line: I,DISPATCH,UNIT_SOLUTION,...,FIELD1,FIELD2,...
            header = row[4:]
        elif tag == 'D' and header is not None:
            # Data line: D,DISPATCH,UNIT_SOLUTION,<version>,...
            values = row[4:]
            # Pad short rows (trailing empty fields)
            if len(values) < len(header):
                values = values + [''] * (len(header) - len(values))
            yield dict(zip(header, values))


def parse_zip_for_duids(
    zip_path: str,
    target_duids: dict[str, tuple[str, str]],
) -> dict[tuple[str, str], dict[str, float | int]]:
    """Parse one MMSDM DISPATCHLOAD zip into daily-aggregated per-DUID MWh.

    Returns {(date, duid): {'gen_mwh': .., 'charge_mwh': .., 'intervals': ..}}
    """
    per_day: dict[tuple[str, str], dict[str, float | int]] = defaultdict(
        lambda: {'gen_mwh': 0.0, 'charge_mwh': 0.0, 'intervals': 0}
    )

    try:
        zf = zipfile.ZipFile(zip_path)
    except zipfile.BadZipFile:
        print(f'  ! bad zip: {os.path.basename(zip_path)}')
        return {}

    # Shared dedupe set for the whole zip — a (SETTLEMENTDATE, DUID) key can
    # appear both in a CSV and in a nested-zip CSV across the same archive.
    seen: set[tuple[str, str]] = set()
    with zf:
        for name in zf.namelist():
            if name.upper().endswith('.CSV'):
                with zf.open(name) as f:
                    content = f.read()
                _accumulate_csv(content, target_duids, per_day, seen)
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
                                _accumulate_csv(content, target_duids, per_day, seen)
    return per_day


def _accumulate_csv(
    content: bytes,
    target_duids: dict[str, tuple[str, str]],
    per_day: dict[tuple[str, str], dict[str, float | int]],
    seen_intervals: set[tuple[str, str]] | None = None,
) -> None:
    """Parse one CSV's D-rows and fold them into per_day.

    DISPATCHLOAD CSVs contain multiple revision rows per (SETTLEMENTDATE, DUID)
    — base case + intervention case + rerun revisions — with the same
    TOTALCLEARED. Accumulating all of them 6× over-counts dispatched energy.
    We dedupe by (settlement_date, duid) across the whole CSV batch: the
    first row for an interval wins. The caller must pass a fresh set per
    batch to avoid state bleed across different zips.
    """
    if seen_intervals is None:
        seen_intervals = set()
    for row in iter_csv_rows(content):
        duid = (row.get('DUID') or '').strip().upper()
        if duid not in target_duids:
            continue
        settlement = row.get('SETTLEMENTDATE') or ''
        if len(settlement) < 10:
            continue
        interval_key = (settlement, duid)
        if interval_key in seen_intervals:
            continue
        seen_intervals.add(interval_key)
        date = settlement[:10].replace('/', '-')
        try:
            cleared = float(row.get('TOTALCLEARED') or 0)
        except ValueError:
            continue
        key = (date, duid)
        bucket = per_day[key]
        if cleared >= 0:
            bucket['gen_mwh'] += cleared / 12.0
        else:
            bucket['charge_mwh'] += (-cleared) / 12.0
        bucket['intervals'] += 1


def upsert_daily(
    conn: sqlite3.Connection,
    per_day: dict[tuple[str, str], dict[str, float | int]],
    target_duids: dict[str, tuple[str, str]],
) -> int:
    """Insert or overwrite daily aggregates. Returns rows touched."""
    n = 0
    for (date, duid), bucket in per_day.items():
        fuel, region = target_duids.get(duid, ('', ''))
        if not fuel:
            continue
        conn.execute("""
            INSERT INTO generation_daily
              (date, duid, fuel_type, region, gen_mwh, charge_mwh, interval_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, duid) DO UPDATE SET
              gen_mwh = excluded.gen_mwh,
              charge_mwh = excluded.charge_mwh,
              interval_count = excluded.interval_count,
              fuel_type = excluded.fuel_type,
              region = excluded.region
        """, (
            date, duid, fuel, region,
            round(bucket['gen_mwh'], 3),
            round(bucket['charge_mwh'], 3),
            int(bucket['intervals']),
        ))
        n += 1
    conn.commit()
    return n


def find_cached_zip(month: str) -> str | None:
    """Return the cached zip path for YYYY-MM, trying both naming formats."""
    yyyy, mm = month.split('-')
    candidates = [
        f'PUBLIC_ARCHIVE#DISPATCHLOAD#FILE01#{yyyy}{mm.zfill(2)}010000.zip',
        f'PUBLIC_DVD_DISPATCHLOAD_{yyyy}{mm.zfill(2)}010000.zip',
    ]
    for name in candidates:
        path = os.path.join(CACHE_DIR, name)
        if os.path.exists(path):
            return path
    return None


def list_cached_months() -> list[str]:
    """Return sorted YYYY-MM of every cached DISPATCHLOAD zip.

    Handles both filename formats:
      PUBLIC_DVD_DISPATCHLOAD_<YYYYMM>010000.zip           (pre-Aug 2024)
      PUBLIC_ARCHIVE#DISPATCHLOAD#FILE01#<YYYYMM>010000.zip (Aug 2024+)
    """
    import re as _re
    pattern = _re.compile(r'DISPATCHLOAD.*?(\d{4})(\d{2})010000\.zip$', _re.IGNORECASE)
    if not os.path.isdir(CACHE_DIR):
        return []
    months: set[str] = set()
    for name in os.listdir(CACHE_DIR):
        m = pattern.search(name)
        if m:
            months.add(f'{m.group(1)}-{m.group(2)}')
    return sorted(months)


def import_month(month: str) -> None:
    zip_path = find_cached_zip(month)
    if not zip_path:
        print(f'  ! no cached zip for {month} — run import_dispatchload.py --month {month} first')
        return
    conn = sqlite3.connect(DB_PATH)
    ensure_schema(conn)
    target_duids = load_target_duids(conn)
    if not target_duids:
        print('  ! no target DUIDs found in aemo_generation_info')
        return
    print(f'  Parsing {month} ({len(target_duids)} target DUIDs)')
    per_day = parse_zip_for_duids(zip_path, target_duids)
    n = upsert_daily(conn, per_day, target_duids)
    print(f'  {month}: {n} daily rows ({len(per_day)} unique (date, DUID) pairs)')
    conn.close()


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


def list_current_zip_urls() -> list[str]:
    """List PUBLIC_NEXT_DAY_DISPATCH zip URLs from NEMWEB Current/Next_Day_Dispatch."""
    try:
        r = requests.get(CURRENT_DISPATCH_URL, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f'  ! failed to list NEMWEB Next_Day_Dispatch: {e}')
        return []
    hrefs = re.findall(r'href="([^"]+\.zip)"', r.text, re.IGNORECASE)
    return [urljoin(CURRENT_DISPATCH_URL, h) for h in hrefs]


def import_current(days: int) -> None:
    """Pull the last N days of NEXT_DAY_DISPATCH zips and import into generation_daily.

    AEMO's trading day starts at 04:00, so a single NEXT_DAY zip spans two
    calendar dates. We accumulate ALL intervals across ALL zips into one
    per_day dict before upserting — otherwise the later-processed zip would
    overwrite the earlier zip's contribution to a shared boundary date.
    """
    conn = sqlite3.connect(DB_PATH)
    ensure_schema(conn)
    target_duids = load_target_duids(conn)
    if not target_duids:
        print('  ! no target DUIDs found in aemo_generation_info')
        conn.close()
        return

    print(f'  Tracking {len(target_duids)} target DUIDs (recent {days} days)')

    urls = list_current_zip_urls()
    if not urls:
        print('  ! no zip URLs discovered. Is NEMWEB reachable?')
        conn.close()
        return

    cutoff = datetime.now() - timedelta(days=days)
    per_day_all: dict[tuple[str, str], dict[str, float | int]] = defaultdict(
        lambda: {'gen_mwh': 0.0, 'charge_mwh': 0.0, 'intervals': 0}
    )
    seen_intervals_all: set[tuple[str, str]] = set()
    processed = 0

    for url in sorted(urls, reverse=True):
        m = re.search(r'(\d{8})', os.path.basename(url))
        if not m:
            continue
        file_date = datetime.strptime(m.group(1), '%Y%m%d')
        if file_date < cutoff:
            break
        target = os.path.join(CACHE_DIR, os.path.basename(url))
        if not download(url, target):
            continue
        try:
            zf = zipfile.ZipFile(target)
        except zipfile.BadZipFile:
            print(f'  ! bad zip: {os.path.basename(target)}')
            continue
        with zf:
            for name in zf.namelist():
                if name.upper().endswith('.CSV'):
                    with zf.open(name) as f:
                        content = f.read()
                    _accumulate_csv(content, target_duids, per_day_all, seen_intervals_all)
        processed += 1
        print(f'  {os.path.basename(target)}: cumulative {len(per_day_all)} (date, DUID) pairs')

    n = upsert_daily(conn, per_day_all, target_duids)
    conn.close()
    print(f'  Total: {n} daily rows upserted from {processed} NEXT_DAY zips '
          f'({len(per_day_all)} unique (date, DUID) pairs)')


def import_all_cached() -> None:
    months = list_cached_months()
    if not months:
        print(f'  ! no cached DISPATCHLOAD zips in {CACHE_DIR}')
        return
    print(f'Found {len(months)} cached months: {months[0]} → {months[-1]}')
    started = datetime.now()
    for i, month in enumerate(months, 1):
        print(f'[{i}/{len(months)}] {month}')
        import_month(month)
    dur = (datetime.now() - started).total_seconds()
    print(f'Done in {dur:.0f}s.')


def main() -> None:
    parser = argparse.ArgumentParser(description='Import daily generation MWh for solar/wind/BESS.')
    grp = parser.add_mutually_exclusive_group(required=True)
    grp.add_argument('--days', type=int, metavar='N',
                     help='Pull last N days from Next_Day_Dispatch')
    grp.add_argument('--month', help='Parse one cached MMSDM month, e.g. 2025-06')
    grp.add_argument('--all-cached', action='store_true',
                     help='Parse every cached MMSDM month')
    args = parser.parse_args()

    if args.days:
        import_current(args.days)
    elif args.month:
        import_month(args.month)
    elif args.all_cached:
        import_all_cached()


if __name__ == '__main__':
    main()
