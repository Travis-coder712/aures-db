"""Import daily per-DUID generation MWh for solar / wind / BESS fleets.

AEMO NEMWEB MMSDM DISPATCHLOAD includes EVERY scheduled and semi-scheduled
DUID, not just coal. This importer re-parses the MMSDM archives cached in
data/nemweb_cache/ by import_dispatchload.py, filters to solar / wind /
battery DUIDs (via the aemo_generation_info registry), and aggregates
5-minute dispatch MW into daily MWh per DUID.

Two aggregates are captured per DUID per day:
  - gen_mwh:    sum(max(total_cleared_mw, 0)) / 12     (discharge for BESS)
  - charge_mwh: sum(abs(min(total_cleared_mw, 0))) / 12 (charge for BESS)

For solar / wind these are always 0 / non-zero respectively (no negative
dispatch), but the schema keeps the symmetry so the scoreboard can render
BESS net-discharge = gen_mwh - charge_mwh.

Two entry points:

  # Parse all cached months for solar/wind/BESS DUIDs
  python3 pipeline/importers/import_generation_daily.py --all-cached

  # Parse a specific month (zip must already be in data/nemweb_cache/)
  python3 pipeline/importers/import_generation_daily.py --month 2025-12

Cached zips come from import_dispatchload.py — no separate download needed.
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
from typing import Iterable

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DB_PATH = os.path.join(ROOT_DIR, 'database', 'aures.db')
CACHE_DIR = os.path.join(ROOT_DIR, 'data', 'nemweb_cache')

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
    """Return {DUID → (fuel_type, region)} for in-service solar / wind / BESS DUIDs.

    Deduplicates multiple rows per DUID in aemo_generation_info by preferring
    'In Service' / 'In Commissioning' status. Region is normalised to NSW1 /
    QLD1 / VIC1 / SA1 / TAS1.
    """
    rows = conn.execute("""
        SELECT DISTINCT UPPER(duid) AS duid, fuel_type, region, status
        FROM aemo_generation_info
        WHERE duid IS NOT NULL AND duid != ''
          AND fuel_type IN ('Solar PV', 'Wind', 'Battery Storage')
          AND status IN ('In Service', 'In Commissioning')
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
    parser.add_argument('--month', help='Parse one cached month, e.g. 2025-06')
    parser.add_argument('--all-cached', action='store_true', help='Parse every cached MMSDM month')
    args = parser.parse_args()

    if args.month:
        import_month(args.month)
    elif args.all_cached:
        import_all_cached()
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
