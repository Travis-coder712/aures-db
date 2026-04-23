"""Import DISPATCHLOAD 5-min data for NEM BESS DUIDs and store daily peaks.

Reads AEMO NEMWEB DISPATCHLOAD (UNIT_SOLUTION table) which has INITIALMW
per DUID per 5-min interval. For BESS:
  INITIALMW > 0  → discharging (generator mode)
  INITIALMW < 0  → charging (load mode)
  INITIALMW = 0  → idle

Stores only per-(date, duid) DAILY PEAKS — not raw 5-min rows — so the
table stays small (~14k rows for 30 DUIDs over 18 months vs 15M 5-min rows).

Usage:
  # Last 7 days from Next_Day_Dispatch (incremental catch-up)
  python3 pipeline/importers/import_bess_5min.py --days 7

  # Single historical month from MMSDM archive
  python3 pipeline/importers/import_bess_5min.py --month 2025-12

  # Backfill a range of months
  python3 pipeline/importers/import_bess_5min.py --months 2024-08 2026-03
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
from urllib.parse import urljoin, unquote

try:
    import requests
except ImportError:
    print("! The 'requests' library is required: pip install requests")
    sys.exit(1)

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')
CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'nemweb_cache')

NEMWEB_BASE = 'https://nemweb.com.au'
CURRENT_DISPATCH_URL = f'{NEMWEB_BASE}/Reports/Current/Next_Day_Dispatch/'
ARCHIVE_URL_TEMPLATES = (
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_ARCHIVE%23DISPATCHLOAD%23FILE01%23{{yyyy}}{{mm}}010000.zip',
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_DVD_DISPATCHLOAD_{{yyyy}}{{mm}}010000.zip',
)

# BESS DUIDs to track — sourced from aemo_generation_info / generation_daily
BESS_DUIDS = {
    'ERB01', 'MREHA3', 'WDBESS1', 'BLYTHB1', 'VBB1', 'RANGEB1', 'WDBESS2',
    'MREHA1', 'KESSB1', 'GREENB1', 'MREHA2', 'TEMPB1', 'ULPBESS1', 'TIB1',
    'LVES1', 'CAPBES1', 'MANNUMB1', 'HPR1', 'CHBESS1', 'WANDB1', 'HBESS1',
    'RIVNB2', 'SMTHBES1', 'RESS1', 'BBATTERY1', 'WALGRV1', 'BHB1', 'TB2B1',
    'BALB1', 'DALNTH1',
    # Waratah Super Battery DUIDs
    'WTAHBESS', 'WTAHBSS2',
    # Pine Lodge
    'PLODGB1', 'PLODGB2',
    # Eraring stages
    'ERBNBSS2', 'ERBNBSS3', 'ERBNBSS4',
    # LaTrobe Valley / Brendale
    'BRENDB1', 'LTRVB1',
}

# Region mapping for DUIDs (populated from aemo_generation_info at runtime)
_duid_region: dict[str, str] = {}


def load_duid_regions(conn: sqlite3.Connection) -> dict[str, str]:
    rows = conn.execute(
        "SELECT DISTINCT duid, region FROM aemo_generation_info "
        "WHERE fuel_type='Battery Storage'"
    ).fetchall()
    return {r['duid']: r['region'] for r in rows}


def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.execute("""
        CREATE TABLE IF NOT EXISTS bess_5min_peaks (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            date                  TEXT NOT NULL,
            duid                  TEXT NOT NULL,
            region                TEXT,
            peak_discharge_mw     REAL,
            peak_discharge_time   TEXT,
            peak_charge_mw        REAL,
            peak_charge_time      TEXT,
            intervals_counted     INTEGER DEFAULT 0,
            created_at            TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, duid)
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_bess5m_date ON bess_5min_peaks(date)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_bess5m_duid ON bess_5min_peaks(duid)")
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


def list_current_zip_urls() -> list[str]:
    try:
        r = requests.get(CURRENT_DISPATCH_URL, timeout=30)
        r.raise_for_status()
    except Exception as e:
        print(f'  ! Failed to list NEMWEB current dispatch: {e}')
        return []
    hrefs = re.findall(r'href="([^"]+\.zip)"', r.text, re.IGNORECASE)
    return [urljoin(CURRENT_DISPATCH_URL, h) for h in hrefs]


def parse_csv_to_daily_peaks(
    content: bytes, target_duids: set[str]
) -> dict[tuple[str, str], dict]:
    """Parse DISPATCHLOAD CSV and aggregate to daily peaks per (date, duid).

    Returns dict keyed by (settlement_date_ymd, duid) with:
      peak_discharge_mw, peak_discharge_time,
      peak_charge_mw, peak_charge_time, intervals_counted
    """
    reader = csv.reader(io.StringIO(content.decode('utf-8', errors='replace')))
    header: list[str] | None = None
    # (date, duid) → {pd_mw, pd_time, pc_mw, pc_time, count}
    daily: dict[tuple[str, str], dict] = {}

    for row in reader:
        if not row:
            continue
        row_type = row[0]
        if row_type == 'I' and len(row) >= 4 and row[1] == 'DISPATCH' and row[2] == 'UNIT_SOLUTION':
            header = row
            continue
        if row_type != 'D' or not header:
            continue
        if len(row) < 4 or row[1] != 'DISPATCH' or row[2] != 'UNIT_SOLUTION':
            continue

        def col(name: str) -> str | None:
            try:
                return row[header.index(name)]
            except (ValueError, IndexError):
                return None

        duid = (col('DUID') or '').strip().upper()
        if duid not in target_duids:
            continue

        settle_str = (col('SETTLEMENTDATE') or '').strip()
        if not settle_str:
            continue

        # Parse settlement datetime → date string
        try:
            settle_dt = datetime.strptime(settle_str, '%Y/%m/%d %H:%M:%S')
        except ValueError:
            try:
                settle_dt = datetime.strptime(settle_str, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                continue
        date_str = settle_dt.strftime('%Y-%m-%d')
        settle_iso = settle_dt.isoformat()

        def to_float(x: str | None) -> float | None:
            if x is None or x.strip() == '':
                return None
            try:
                return float(x)
            except ValueError:
                return None

        initial_mw = to_float(col('INITIALMW'))
        if initial_mw is None:
            continue

        key = (date_str, duid)
        if key not in daily:
            daily[key] = {
                'pd_mw': 0.0, 'pd_time': None,
                'pc_mw': 0.0, 'pc_time': None,
                'count': 0,
            }
        rec = daily[key]
        rec['count'] += 1

        if initial_mw > 0 and initial_mw > rec['pd_mw']:
            rec['pd_mw'] = initial_mw
            rec['pd_time'] = settle_iso
        elif initial_mw < 0:
            abs_mw = abs(initial_mw)
            if abs_mw > rec['pc_mw']:
                rec['pc_mw'] = abs_mw
                rec['pc_time'] = settle_iso

    return daily


def upsert_daily_peaks(
    conn: sqlite3.Connection,
    daily: dict[tuple[str, str], dict],
    duid_region: dict[str, str],
) -> int:
    cur = conn.cursor()
    upserted = 0
    for (date_str, duid), rec in daily.items():
        region = duid_region.get(duid)
        pd_mw = round(rec['pd_mw'], 2) if rec['pd_mw'] else None
        pc_mw = round(rec['pc_mw'], 2) if rec['pc_mw'] else None
        cur.execute("""
            INSERT INTO bess_5min_peaks
                (date, duid, region, peak_discharge_mw, peak_discharge_time,
                 peak_charge_mw, peak_charge_time, intervals_counted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(date, duid) DO UPDATE SET
                region              = excluded.region,
                peak_discharge_mw   = MAX(COALESCE(peak_discharge_mw, 0), excluded.peak_discharge_mw),
                peak_discharge_time = CASE
                    WHEN excluded.peak_discharge_mw > COALESCE(peak_discharge_mw, 0)
                    THEN excluded.peak_discharge_time ELSE peak_discharge_time END,
                peak_charge_mw      = MAX(COALESCE(peak_charge_mw, 0), excluded.peak_charge_mw),
                peak_charge_time    = CASE
                    WHEN excluded.peak_charge_mw > COALESCE(peak_charge_mw, 0)
                    THEN excluded.peak_charge_time ELSE peak_charge_time END,
                intervals_counted   = intervals_counted + excluded.intervals_counted
        """, (date_str, duid, region, pd_mw, rec['pd_time'], pc_mw, rec['pc_time'], rec['count']))
        upserted += 1
    conn.commit()
    return upserted


def process_zip(zip_path: str, target_duids: set[str],
                conn: sqlite3.Connection, duid_region: dict[str, str]) -> int:
    total = 0
    try:
        with zipfile.ZipFile(zip_path) as zf:
            for name in zf.namelist():
                if not name.upper().endswith('.CSV'):
                    continue
                with zf.open(name) as f:
                    content = f.read()
                daily = parse_csv_to_daily_peaks(content, target_duids)
                n = upsert_daily_peaks(conn, daily, duid_region)
                if n:
                    total += n
    except zipfile.BadZipFile:
        print(f'  ! bad zip: {zip_path}')
    return total


def import_current(days: int) -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    duid_region = load_duid_regions(conn)

    # Merge known DUIDs with any extras from aemo_generation_info
    all_duids = BESS_DUIDS | set(duid_region.keys())
    print(f'  Tracking {len(all_duids)} BESS DUIDs (recent {days} days)')

    urls = list_current_zip_urls()
    if not urls:
        print('  ! No zip URLs discovered. Is NEMWEB reachable?')
        conn.close()
        return

    cutoff = datetime.now() - timedelta(days=days)
    total = 0
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
        n = process_zip(target, all_duids, conn, duid_region)
        if n:
            print(f'  {os.path.basename(target)}: {n} (date,duid) records upserted')
        total += n

    conn.close()
    print(f'  Total (date,duid) records upserted: {total}')


def import_archive(month: str) -> None:
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    duid_region = load_duid_regions(conn)
    all_duids = BESS_DUIDS | set(duid_region.keys())

    target = None
    for i, tmpl in enumerate(ARCHIVE_URL_TEMPLATES):
        candidate = tmpl.format(yyyy=yyyy, mm=mm)
        candidate_target = os.path.join(CACHE_DIR, unquote(os.path.basename(candidate)))
        is_last = (i == len(ARCHIVE_URL_TEMPLATES) - 1)
        if download(candidate, candidate_target, verbose=is_last):
            target = candidate_target
            break

    if target is None:
        print(f'  ! archive unavailable for {month}')
        conn.close()
        return

    print(f'  Parsing {month} archive ({len(all_duids)} BESS DUIDs)...')
    n = process_zip(target, all_duids, conn, duid_region)
    conn.close()
    print(f'  {month}: {n} (date,duid) daily-peak records upserted')


def import_months_range(start: str, end: str) -> None:
    """Process every MMSDM month from start to end inclusive (YYYY-MM)."""
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
    print(f'  Backfill: {len(months)} months ({start} → {end})')
    for month in months:
        import_archive(month)


def main() -> None:
    parser = argparse.ArgumentParser(description='Import BESS 5-min dispatch peaks from NEMWEB')
    grp = parser.add_mutually_exclusive_group(required=True)
    grp.add_argument('--days', type=int, metavar='N',
                     help='Import last N days from Next_Day_Dispatch')
    grp.add_argument('--month', metavar='YYYY-MM',
                     help='Import a single MMSDM archive month')
    grp.add_argument('--months', nargs=2, metavar=('START', 'END'),
                     help='Backfill a range of MMSDM months (YYYY-MM YYYY-MM)')
    args = parser.parse_args()

    print('BESS 5-min Peaks Importer')
    if args.days:
        import_current(args.days)
    elif args.month:
        import_archive(args.month)
    elif args.months:
        import_months_range(args.months[0], args.months[1])


if __name__ == '__main__':
    main()
