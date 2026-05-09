"""5-minute price band capture importer for BESS (batteries).

Correlates NEMWEB 5-min DISPATCHPRICE with DISPATCHLOAD to compute,
per battery per month, the distribution of:

  GEN (discharge) — intervals where TOTALCLEARED > 0
    Which price bands does the battery discharge into?
    High-price capture = good arbitrage performance.

  LOAD (charge) — intervals where TOTALCLEARED < 0
    Which price bands does the battery charge from?
    Low/negative price capture = good charge optimisation.

Output: bess_band_capture table (separate from wind/solar price_band_capture).

Usage:
    # Process all months with cached ZIPs (uses same cache as price_band_capture)
    python3 pipeline/importers/import_bess_band_capture.py --all-cached

    # Single month
    python3 pipeline/importers/import_bess_band_capture.py --month 2025-06

    # Date range
    python3 pipeline/importers/import_bess_band_capture.py --months 2024-01 2025-12
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
from datetime import datetime
from urllib.parse import unquote

try:
    import requests
except ImportError:
    print("! The 'requests' library is required: pip install requests")
    sys.exit(1)

ROOT_DIR  = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DB_PATH   = os.path.join(ROOT_DIR, 'database', 'aures.db')
CACHE_DIR = os.path.join(ROOT_DIR, 'data', 'nemweb_cache')

NEMWEB_BASE = 'https://nemweb.com.au'

PRICE_ARCHIVE_URLS = (
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_ARCHIVE%23DISPATCHPRICE%23FILE01%23{{yyyy}}{{mm}}010000.zip',
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_DVD_DISPATCHPRICE_{{yyyy}}{{mm}}010000.zip',
)

LOAD_ARCHIVE_URLS = (
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_ARCHIVE%23DISPATCHLOAD%23FILE01%23{{yyyy}}{{mm}}010000.zip',
    f'{NEMWEB_BASE}/Data_Archive/Wholesale_Electricity/MMSDM/{{yyyy}}/'
    f'MMSDM_{{yyyy}}_{{mm}}/MMSDM_Historical_Data_SQLLoader/DATA/'
    f'PUBLIC_DVD_DISPATCHLOAD_{{yyyy}}{{mm}}010000.zip',
)

NEM_REGIONS = {'NSW1', 'QLD1', 'VIC1', 'SA1', 'TAS1'}

PRICE_BANDS: list[tuple[str, float, float]] = [
    ('negative',   -1_000_000,   0.0),
    ('$0-50',             0.0,  50.0),
    ('$50-100',          50.0, 100.0),
    ('$100-300',        100.0, 300.0),
    ('$300-1000',       300.0, 1_000.0),
    ('$1000+',        1_000.0, 1_000_000.0),
]
BAND_LABELS = [b[0] for b in PRICE_BANDS]


# ============================================================
# Schema
# ============================================================

def ensure_schema(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS bess_band_capture (
            year           INTEGER NOT NULL,
            month          INTEGER NOT NULL,
            duid           TEXT NOT NULL,
            project_id     TEXT,
            region         TEXT NOT NULL,
            direction      TEXT NOT NULL,   -- 'GEN' (discharge) or 'LOAD' (charge)
            band_label     TEXT NOT NULL,
            band_min       REAL NOT NULL,
            band_max       REAL NOT NULL,
            energy_mwh     REAL NOT NULL DEFAULT 0,
            interval_count INTEGER NOT NULL DEFAULT 0,
            energy_pct     REAL,
            avg_price      REAL,
            UNIQUE(year, month, duid, direction, band_label)
        );
        CREATE INDEX IF NOT EXISTS idx_bbc_project
            ON bess_band_capture(project_id, year, month);
        CREATE INDEX IF NOT EXISTS idx_bbc_duid
            ON bess_band_capture(duid, year, month);
    """)
    conn.commit()


# ============================================================
# Download helpers (shared with price_band_capture)
# ============================================================

def _download(url: str, target: str) -> bool:
    if os.path.exists(target) and os.path.getsize(target) > 0:
        return True
    os.makedirs(os.path.dirname(target), exist_ok=True)
    tmp = target + '.tmp'
    try:
        with requests.get(url, stream=True, timeout=180) as r:
            if r.status_code == 404:
                return False
            r.raise_for_status()
            with open(tmp, 'wb') as f:
                for chunk in r.iter_content(chunk_size=1 << 16):
                    f.write(chunk)
        os.replace(tmp, target)
        return True
    except Exception as e:
        print(f'    ! download failed: {e}')
        if os.path.exists(tmp):
            os.remove(tmp)
        return False


def ensure_price_zip(month: str) -> str | None:
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)
    legacy = os.path.join(CACHE_DIR, f'PUBLIC_DVD_DISPATCHPRICE_{yyyy}{mm}010000.zip')
    new    = os.path.join(CACHE_DIR, f'PUBLIC_ARCHIVE#DISPATCHPRICE#FILE01#{yyyy}{mm}010000.zip')
    for p in (new, legacy):
        if os.path.exists(p) and os.path.getsize(p) > 0:
            return p
    for tmpl in PRICE_ARCHIVE_URLS:
        url = tmpl.format(yyyy=yyyy, mm=mm)
        target = os.path.join(CACHE_DIR, unquote(os.path.basename(url)))
        print(f'    Downloading DISPATCHPRICE {month}...')
        if _download(url, target):
            return target
    return None


def ensure_load_zip(month: str) -> str | None:
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)
    legacy = os.path.join(CACHE_DIR, f'PUBLIC_DVD_DISPATCHLOAD_{yyyy}{mm}010000.zip')
    new    = os.path.join(CACHE_DIR, f'PUBLIC_ARCHIVE#DISPATCHLOAD#FILE01#{yyyy}{mm}010000.zip')
    for p in (new, legacy):
        if os.path.exists(p) and os.path.getsize(p) > 0:
            return p
    for tmpl in LOAD_ARCHIVE_URLS:
        url = tmpl.format(yyyy=yyyy, mm=mm)
        target = os.path.join(CACHE_DIR, unquote(os.path.basename(url)))
        print(f'    Downloading DISPATCHLOAD {month} (~50-200 MB)...')
        if _download(url, target):
            return target
    return None


# ============================================================
# BESS DUID registry
# ============================================================

def load_bess_duids(conn: sqlite3.Connection) -> dict[str, tuple[str, str]]:
    """Return {DUID: (project_id, region)} for operating BESS DUIDs."""
    rows = conn.execute("""
        SELECT UPPER(duid) as duid, project_id, region
        FROM aemo_generation_info
        WHERE (fuel_type LIKE '%Battery%' OR fuel_type LIKE '%BESS%'
               OR fuel_type LIKE '%Storage%')
          AND status IN ('In Service', 'In Commissioning')
          AND duid IS NOT NULL AND duid != ''
    """).fetchall()
    return {r['duid']: (r['project_id'] or '', r['region'] or '') for r in rows}


# ============================================================
# 5-min price parsing
# ============================================================

def parse_5min_prices(price_zip: str) -> dict[str, dict[str, float]]:
    """Parse DISPATCHPRICE zip → {region: {settlement_dt_str: rrp}}."""
    prices: dict[str, dict[str, float]] = {r: {} for r in NEM_REGIONS}
    seen: set[tuple[str, str]] = set()

    def _parse_csv(content: bytes) -> None:
        header = None
        reader = csv.reader(io.StringIO(content.decode('utf-8', errors='replace')))
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
                ri = header.index('REGIONID')
                di = header.index('SETTLEMENTDATE')
                pi = header.index('RRP')
            except ValueError:
                continue
            region   = row[ri].strip().upper() if ri < len(row) else ''
            settle_s = row[di].strip() if di < len(row) else ''
            rrp_s    = row[pi].strip() if pi < len(row) else ''
            if region not in NEM_REGIONS or not settle_s or not rrp_s:
                continue
            key = (region, settle_s)
            if key in seen:
                continue
            seen.add(key)
            try:
                dt = datetime.strptime(settle_s, '%Y/%m/%d %H:%M:%S')
            except ValueError:
                try:
                    dt = datetime.strptime(settle_s, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    continue
            try:
                rrp = float(rrp_s)
            except ValueError:
                continue
            prices[region][dt.strftime('%Y-%m-%d %H:%M:%S')] = rrp

    try:
        with zipfile.ZipFile(price_zip) as zf:
            for name in zf.namelist():
                if name.upper().endswith('.CSV'):
                    _parse_csv(zf.read(name))
    except zipfile.BadZipFile:
        print(f'    ! bad zip: {price_zip}')
    return prices


# ============================================================
# BESS 5-min dispatch × price correlation
# ============================================================

def _band_for_price(rrp: float) -> str:
    for label, lo, hi in PRICE_BANDS:
        if lo <= rrp < hi:
            return label
    return PRICE_BANDS[-1][0]


def _iter_dispatch_csv(content: bytes):
    """Yield (settlement_dt_str, duid_upper, totalcleared_str) from DISPATCHLOAD CSV."""
    header: list[str] | None = None
    reader = csv.reader(io.StringIO(content.decode('utf-8', errors='replace')))
    for row in reader:
        if not row:
            continue
        tag = row[0]
        if tag == 'I':
            header = row[4:] if len(row) > 4 else row
            continue
        if tag != 'D' or header is None:
            continue
        values = row[4:] if len(row) > 4 else row
        if len(values) < len(header):
            values = values + [''] * (len(header) - len(values))
        rec = dict(zip(header, values))
        duid     = (rec.get('DUID') or '').strip().upper()
        settle_s = (rec.get('SETTLEMENTDATE') or '').strip()
        cleared_s = (rec.get('TOTALCLEARED') or '0').strip()
        if duid and settle_s:
            yield settle_s, duid, cleared_s


def compute_bess_bands_for_month(
    load_zip: str,
    prices: dict[str, dict[str, float]],
    bess_duids: dict[str, tuple[str, str]],
) -> dict[str, dict[str, dict[str, dict]]]:
    """Correlate DISPATCHLOAD × DISPATCHPRICE for BESS DUIDs.

    Returns {duid: {'GEN': {band_label: bucket}, 'LOAD': {band_label: bucket}}}
    where bucket = {'energy_mwh', 'interval_count', 'price_sum', 'price_count'}
    """
    def new_bands() -> dict[str, dict]:
        return {lbl: {'energy_mwh': 0.0, 'interval_count': 0,
                      'price_sum': 0.0, 'price_count': 0}
                for lbl in BAND_LABELS}

    buckets: dict[str, dict[str, dict[str, dict]]] = {
        duid: {'GEN': new_bands(), 'LOAD': new_bands()}
        for duid in bess_duids
    }
    seen: set[tuple[str, str]] = set()

    def _process_csv(content: bytes) -> None:
        for settle_s, duid, cleared_s in _iter_dispatch_csv(content):
            if duid not in bess_duids:
                continue
            key = (settle_s, duid)
            if key in seen:
                continue
            seen.add(key)
            try:
                dt = datetime.strptime(settle_s, '%Y/%m/%d %H:%M:%S')
            except ValueError:
                try:
                    dt = datetime.strptime(settle_s, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    continue
            dt_key = dt.strftime('%Y-%m-%d %H:%M:%S')
            _, region = bess_duids[duid]
            rrp = prices.get(region, {}).get(dt_key)
            if rrp is None:
                continue
            try:
                mw = float(cleared_s)
            except ValueError:
                continue
            if mw == 0:
                continue

            mwh = abs(mw) / 12.0  # 5-min interval = 1/12 hour
            direction = 'GEN' if mw > 0 else 'LOAD'
            band = _band_for_price(rrp)
            b = buckets[duid][direction][band]
            b['energy_mwh']    += mwh
            b['interval_count'] += 1
            b['price_sum']     += rrp * mwh
            b['price_count']   += 1

    try:
        with zipfile.ZipFile(load_zip) as zf:
            for name in zf.namelist():
                if name.upper().endswith('.CSV'):
                    _process_csv(zf.read(name))
                elif name.upper().endswith('.ZIP'):
                    try:
                        inner = zipfile.ZipFile(io.BytesIO(zf.read(name)))
                        with inner:
                            for iname in inner.namelist():
                                if iname.upper().endswith('.CSV'):
                                    _process_csv(inner.read(iname))
                    except zipfile.BadZipFile:
                        pass
    except zipfile.BadZipFile:
        print(f'    ! bad zip: {load_zip}')

    return buckets


# ============================================================
# DB persistence
# ============================================================

def upsert_month(
    conn: sqlite3.Connection,
    year: int,
    month: int,
    buckets: dict[str, dict[str, dict[str, dict]]],
    bess_duids: dict[str, tuple[str, str]],
) -> int:
    rows_written = 0
    for duid, directions in buckets.items():
        project_id, region = bess_duids.get(duid, ('', ''))
        for direction, bands in directions.items():
            total_mwh = sum(b['energy_mwh'] for b in bands.values())
            if total_mwh == 0:
                continue
            for label, (_, band_min, band_max) in zip(BAND_LABELS, PRICE_BANDS):
                b = bands[label]
                energy_mwh = b['energy_mwh']
                energy_pct = round(energy_mwh / total_mwh * 100, 2) if total_mwh > 0 else 0.0
                avg_price  = (round(b['price_sum'] / energy_mwh, 2)
                              if energy_mwh > 0 else None)
                conn.execute("""
                    INSERT INTO bess_band_capture
                        (year, month, duid, project_id, region, direction,
                         band_label, band_min, band_max,
                         energy_mwh, interval_count, energy_pct, avg_price)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
                    ON CONFLICT(year, month, duid, direction, band_label) DO UPDATE SET
                        project_id    = excluded.project_id,
                        region        = excluded.region,
                        energy_mwh    = excluded.energy_mwh,
                        interval_count = excluded.interval_count,
                        energy_pct    = excluded.energy_pct,
                        avg_price     = excluded.avg_price
                """, (
                    year, month, duid, project_id or None, region, direction,
                    label, band_min, band_max,
                    round(energy_mwh, 3), b['interval_count'],
                    energy_pct, avg_price,
                ))
                rows_written += 1
    conn.commit()
    return rows_written


# ============================================================
# Month orchestration
# ============================================================

def process_month(month: str, conn: sqlite3.Connection) -> bool:
    yyyy_s, mm_s = month.split('-')
    year, mon = int(yyyy_s), int(mm_s)

    print(f'\n  [{month}] Ensuring price archive...')
    price_zip = ensure_price_zip(month)
    if not price_zip:
        print(f'    ! DISPATCHPRICE not available for {month}')
        return False

    print(f'  [{month}] Ensuring load archive...')
    load_zip = ensure_load_zip(month)
    if not load_zip:
        print(f'    ! DISPATCHLOAD not available for {month}')
        return False

    bess_duids = load_bess_duids(conn)
    if not bess_duids:
        print('    ! no BESS DUIDs in aemo_generation_info — run import_aemo_gen_info.py first')
        return False

    print(f'  [{month}] Parsing 5-min prices...')
    prices = parse_5min_prices(price_zip)
    n_intervals = sum(len(v) for v in prices.values())
    print(f'    {n_intervals:,} price intervals loaded ({len(bess_duids)} BESS DUIDs)')

    print(f'  [{month}] Correlating BESS dispatch × price (GEN + LOAD)...')
    buckets = compute_bess_bands_for_month(load_zip, prices, bess_duids)

    gen_active  = sum(1 for d, dirs in buckets.items()
                      if any(b['energy_mwh'] > 0 for b in dirs['GEN'].values()))
    load_active = sum(1 for d, dirs in buckets.items()
                      if any(b['energy_mwh'] > 0 for b in dirs['LOAD'].values()))
    print(f'    {gen_active} DUIDs discharged, {load_active} DUIDs charged this month')

    rows = upsert_month(conn, year, mon, buckets, bess_duids)
    print(f'    Wrote {rows} band rows to bess_band_capture')
    return True


# ============================================================
# Cache discovery
# ============================================================

def list_months_with_both_cached() -> list[str]:
    if not os.path.isdir(CACHE_DIR):
        return []
    pattern = re.compile(r'(?:DISPATCHPRICE|DISPATCHLOAD).*?(\d{4})(\d{2})010000\.zip$', re.IGNORECASE)
    by_month: dict[str, set[str]] = defaultdict(set)
    for name in os.listdir(CACHE_DIR):
        m = pattern.search(name)
        if m:
            ym = f'{m.group(1)}-{m.group(2)}'
            if 'PRICE' in name.upper():
                by_month[ym].add('price')
            else:
                by_month[ym].add('load')
    return sorted(ym for ym, types in by_month.items() if 'price' in types and 'load' in types)


def month_range(start: str, end: str) -> list[str]:
    y0, m0 = map(int, start.split('-'))
    y1, m1 = map(int, end.split('-'))
    out, y, m = [], y0, m0
    while (y, m) <= (y1, m1):
        out.append(f'{y:04d}-{m:02d}')
        m += 1
        if m > 12:
            m, y = 1, y + 1
    return out


# ============================================================
# Main
# ============================================================

def main() -> None:
    parser = argparse.ArgumentParser(
        description='Import 5-min BESS charge/discharge price band capture from NEMWEB archives'
    )
    grp = parser.add_mutually_exclusive_group(required=True)
    grp.add_argument('--month',      metavar='YYYY-MM', help='Process a single month')
    grp.add_argument('--months',     nargs=2, metavar=('START', 'END'), help='Process a date range')
    grp.add_argument('--all-cached', action='store_true', help='Process all months with both ZIPs cached')
    args = parser.parse_args()

    os.makedirs(CACHE_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)

    if args.month:
        months = [args.month]
    elif args.months:
        months = month_range(args.months[0], args.months[1])
    else:
        months = list_months_with_both_cached()
        if not months:
            print(f'No months with both PRICE and LOAD ZIPs cached in {CACHE_DIR}')
            conn.close()
            return
        print(f'Found {len(months)} months with both ZIPs cached: {months[0]} → {months[-1]}')

    print('=== BESS 5-min Band Capture Importer ===')
    ok = fail = 0
    t0 = datetime.now()
    for month in months:
        if process_month(month, conn):
            ok += 1
        else:
            fail += 1

    elapsed = (datetime.now() - t0).total_seconds()
    print(f'\nDone in {elapsed:.0f}s — {ok} months OK, {fail} failed')
    conn.close()


if __name__ == '__main__':
    main()
