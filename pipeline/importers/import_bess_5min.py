"""Import DISPATCHLOAD 5-min data for NEM BESS DUIDs and store daily peaks.

Reads AEMO NEMWEB DISPATCHLOAD (UNIT_SOLUTION table) which has INITIALMW
per DUID per 5-min interval. For BESS:
  INITIALMW > 0  → discharging (generator mode)
  INITIALMW < 0  → charging (load mode)
  INITIALMW = 0  → idle

Stores per-(date, duid) DAILY PEAKS at multiple time windows:
  peak_discharge_mw   — single 5-min interval peak (MW)
  peak_30min_mwh      — max energy in any 30-min window (6 intervals)
  peak_1hr_mwh        — max energy in any 1-hr window (12 intervals)
  (charge equivalents for each)
Table stays compact (~15k rows for 56 DUIDs over 20 months vs 15M+ 5-min rows).

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

# BESS DUIDs to track — supplemented at runtime from aemo_generation_info
BESS_DUIDS = {
    'ERB01', 'MREHA3', 'WDBESS1', 'BLYTHB1', 'VBB1', 'RANGEB1', 'WDBESS2',
    'MREHA1', 'KESSB1', 'GREENB1', 'MREHA2', 'TEMPB1', 'ULPBESS1', 'TIB1',
    'LVES1', 'CAPBES1', 'MANNUMB1', 'HPR1', 'CHBESS1', 'WANDB1', 'HBESS1',
    'RIVNB2', 'SMTHBES1', 'RESS1', 'BBATTERY1', 'WALGRV1', 'BHB1', 'TB2B1',
    'BALB1', 'DALNTH1',
    # Waratah Super Battery
    'WTAHBESS', 'WTAHBSS2', 'WTAHB1',
    # Tarong BESS, Liddell BESS, Orana BESS
    'TARBESS1', 'LDBESS1', 'ORABESS1',
    # Supernode BESS
    'SNB01', 'SNB02',
    # Swanbank F
    'SWANBBF1',
    # Pine Lodge
    'PLODGB1', 'PLODGB2',
    # Eraring stages
    'ERBNBSS2', 'ERBNBSS3', 'ERBNBSS4',
    # Brendale / LaTrobe Valley
    'BRENDB1', 'BRNDBES1', 'LTRVB1',
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
            id                       INTEGER PRIMARY KEY AUTOINCREMENT,
            date                     TEXT NOT NULL,
            duid                     TEXT NOT NULL,
            region                   TEXT,
            peak_discharge_mw        REAL,
            peak_discharge_time      TEXT,
            peak_charge_mw           REAL,
            peak_charge_time         TEXT,
            peak_30min_mwh           REAL,
            peak_30min_start         TEXT,
            peak_30min_charge_mwh    REAL,
            peak_30min_charge_start  TEXT,
            peak_1hr_mwh             REAL,
            peak_1hr_start           TEXT,
            peak_1hr_charge_mwh      REAL,
            peak_1hr_charge_start    TEXT,
            intervals_counted        INTEGER DEFAULT 0,
            created_at               TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(date, duid)
        )
    """)
    # Migrate existing tables by adding new columns if missing
    existing = {row[1] for row in conn.execute("PRAGMA table_info(bess_5min_peaks)")}
    for col, defn in [
        ('peak_30min_mwh',          'REAL'),
        ('peak_30min_start',        'TEXT'),
        ('peak_30min_charge_mwh',   'REAL'),
        ('peak_30min_charge_start', 'TEXT'),
        ('peak_1hr_mwh',            'REAL'),
        ('peak_1hr_start',          'TEXT'),
        ('peak_1hr_charge_mwh',     'REAL'),
        ('peak_1hr_charge_start',   'TEXT'),
    ]:
        if col not in existing:
            conn.execute(f'ALTER TABLE bess_5min_peaks ADD COLUMN {col} {defn}')
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


def _rolling_peak(
    mws: list[float], times: list[str], window: int, positive: bool
) -> tuple[float | None, str | None]:
    """Max MWh in any consecutive `window` 5-min intervals.

    positive=True  → discharge windows (INITIALMW > 0)
    positive=False → charge windows    (INITIALMW < 0, abs value)
    Returns (peak_mwh, window_start_iso).
    """
    if len(mws) < window:
        return None, None
    best = 0.0
    best_start: str | None = None
    for i in range(len(mws) - window + 1):
        segment = mws[i:i + window]
        energy = sum((max(0.0, mw) if positive else abs(min(0.0, mw)))
                     for mw in segment) * (5.0 / 60.0)
        if energy > best:
            best = energy
            best_start = times[i]
    return (round(best, 2) if best > 0 else None, best_start)


def parse_csv_to_daily_peaks(
    content: bytes, target_duids: set[str]
) -> dict[tuple[str, str], dict]:
    """Parse DISPATCHLOAD CSV and aggregate to daily peaks per (date, duid).

    Buffers all intervals per (date, duid) then computes:
      - 5-min peak MW (single interval)
      - 30-min peak MWh (best 6-interval window)
      - 1-hr peak MWh (best 12-interval window)
    for both discharge and charge directions.
    """
    reader = csv.reader(io.StringIO(content.decode('utf-8', errors='replace')))
    header: list[str] | None = None

    # Dedupe: last value per (date, duid, settle_iso) wins
    seen: dict[tuple[str, str, str], float] = {}

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

        try:
            duid_i = header.index('DUID')
            date_i = header.index('SETTLEMENTDATE')
            mw_i   = header.index('INITIALMW')
        except ValueError:
            continue

        duid = (row[duid_i] if duid_i < len(row) else '').strip().upper()
        if duid not in target_duids:
            continue

        settle_str = (row[date_i] if date_i < len(row) else '').strip()
        mw_str     = (row[mw_i]   if mw_i   < len(row) else '').strip()
        if not settle_str or not mw_str:
            continue

        try:
            settle_dt = datetime.strptime(settle_str, '%Y/%m/%d %H:%M:%S')
        except ValueError:
            try:
                settle_dt = datetime.strptime(settle_str, '%Y-%m-%d %H:%M:%S')
            except ValueError:
                continue
        try:
            mw = float(mw_str)
        except ValueError:
            continue

        date_str  = settle_dt.strftime('%Y-%m-%d')
        settle_iso = settle_dt.isoformat()
        seen[(date_str, duid, settle_iso)] = mw  # last revision wins

    # Group into sorted per-(date,duid) lists
    buf: dict[tuple[str, str], list[tuple[str, float]]] = defaultdict(list)
    for (date_str, duid, settle_iso), mw in seen.items():
        buf[(date_str, duid)].append((settle_iso, mw))

    # Compute peaks
    daily: dict[tuple[str, str], dict] = {}
    for (date_str, duid), ivs in buf.items():
        ivs.sort(key=lambda x: x[0])
        times = [t for t, _ in ivs]
        mws   = [m for _, m in ivs]

        # 5-min single-interval peak
        pd_mw, pd_time = 0.0, None
        pc_mw, pc_time = 0.0, None
        for t, mw in ivs:
            if mw > 0 and mw > pd_mw:
                pd_mw, pd_time = mw, t
            elif mw < 0 and abs(mw) > pc_mw:
                pc_mw, pc_time = abs(mw), t

        # Rolling windows
        pd_30, pd_30t = _rolling_peak(mws, times, 6,  positive=True)
        pc_30, pc_30t = _rolling_peak(mws, times, 6,  positive=False)
        pd_1h, pd_1ht = _rolling_peak(mws, times, 12, positive=True)
        pc_1h, pc_1ht = _rolling_peak(mws, times, 12, positive=False)

        daily[(date_str, duid)] = {
            'pd_mw':    pd_mw,  'pd_time':  pd_time,
            'pc_mw':    pc_mw,  'pc_time':  pc_time,
            'pd_30min': pd_30,  'pd_30t':   pd_30t,
            'pc_30min': pc_30,  'pc_30t':   pc_30t,
            'pd_1hr':   pd_1h,  'pd_1ht':   pd_1ht,
            'pc_1hr':   pc_1h,  'pc_1ht':   pc_1ht,
            'count':    len(ivs),
        }

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
        pd_mw  = round(rec['pd_mw'],    2) if rec['pd_mw']    else None
        pc_mw  = round(rec['pc_mw'],    2) if rec['pc_mw']    else None
        pd_30  = rec['pd_30min']
        pc_30  = rec['pc_30min']
        pd_1h  = rec['pd_1hr']
        pc_1h  = rec['pc_1hr']
        cur.execute("""
            INSERT INTO bess_5min_peaks
                (date, duid, region,
                 peak_discharge_mw, peak_discharge_time,
                 peak_charge_mw, peak_charge_time,
                 peak_30min_mwh, peak_30min_start,
                 peak_30min_charge_mwh, peak_30min_charge_start,
                 peak_1hr_mwh, peak_1hr_start,
                 peak_1hr_charge_mwh, peak_1hr_charge_start,
                 intervals_counted)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(date, duid) DO UPDATE SET
                region                   = excluded.region,
                peak_discharge_mw        = MAX(COALESCE(peak_discharge_mw,0),      excluded.peak_discharge_mw),
                peak_discharge_time      = CASE WHEN excluded.peak_discharge_mw > COALESCE(peak_discharge_mw,0)
                                           THEN excluded.peak_discharge_time ELSE peak_discharge_time END,
                peak_charge_mw           = MAX(COALESCE(peak_charge_mw,0),         excluded.peak_charge_mw),
                peak_charge_time         = CASE WHEN excluded.peak_charge_mw > COALESCE(peak_charge_mw,0)
                                           THEN excluded.peak_charge_time ELSE peak_charge_time END,
                peak_30min_mwh           = MAX(COALESCE(peak_30min_mwh,0),         COALESCE(excluded.peak_30min_mwh,0)),
                peak_30min_start         = CASE WHEN COALESCE(excluded.peak_30min_mwh,0) > COALESCE(peak_30min_mwh,0)
                                           THEN excluded.peak_30min_start ELSE peak_30min_start END,
                peak_30min_charge_mwh    = MAX(COALESCE(peak_30min_charge_mwh,0),  COALESCE(excluded.peak_30min_charge_mwh,0)),
                peak_30min_charge_start  = CASE WHEN COALESCE(excluded.peak_30min_charge_mwh,0) > COALESCE(peak_30min_charge_mwh,0)
                                           THEN excluded.peak_30min_charge_start ELSE peak_30min_charge_start END,
                peak_1hr_mwh             = MAX(COALESCE(peak_1hr_mwh,0),           COALESCE(excluded.peak_1hr_mwh,0)),
                peak_1hr_start           = CASE WHEN COALESCE(excluded.peak_1hr_mwh,0) > COALESCE(peak_1hr_mwh,0)
                                           THEN excluded.peak_1hr_start ELSE peak_1hr_start END,
                peak_1hr_charge_mwh      = MAX(COALESCE(peak_1hr_charge_mwh,0),    COALESCE(excluded.peak_1hr_charge_mwh,0)),
                peak_1hr_charge_start    = CASE WHEN COALESCE(excluded.peak_1hr_charge_mwh,0) > COALESCE(peak_1hr_charge_mwh,0)
                                           THEN excluded.peak_1hr_charge_start ELSE peak_1hr_charge_start END,
                intervals_counted        = intervals_counted + excluded.intervals_counted
        """, (date_str, duid, region,
              pd_mw, rec['pd_time'], pc_mw, rec['pc_time'],
              pd_30, rec['pd_30t'], pc_30, rec['pc_30t'],
              pd_1h, rec['pd_1ht'], pc_1h, rec['pc_1ht'],
              rec['count']))
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
