"""True 5-minute price band capture importer for wind and solar farms.

Correlates NEMWEB 5-min DISPATCHPRICE (regional spot price) with 5-min
DISPATCHLOAD (per-DUID generation) to compute, per farm per month:

  - Exact weighted-average capture price (cross-validates OpenElectricity values)
  - Distribution of generation across price regime bands (% MWh in each band)

Price bands used ($/MWh):
  negative:    < 0          (curtailment / oversupply conditions)
  $0–50:       0 – 50       (low-price, typically off-peak)
  $50–100:     50 – 100     (mid-market)
  $100–300:    100 – 300    (tight supply / peak)
  $300–1000:   300 – 1,000  (high-price events)
  $1000+:      > 1,000      (scarcity / market cap events)

Data source: NEMWEB MMSDM archives (free, back to 2009).
ZIPs are cached in data/nemweb_cache/ and reused across runs.

Usage:
    # Single month (downloads if not cached)
    python3 pipeline/importers/import_price_band_capture.py --month 2025-06

    # Backfill range
    python3 pipeline/importers/import_price_band_capture.py --months 2022-01 2025-12

    # Process all months that have BOTH price and load ZIPs already cached
    python3 pipeline/importers/import_price_band_capture.py --all-cached

    # Run for solar DUIDs (uses the same cached ZIPs — no re-download)
    python3 pipeline/importers/import_price_band_capture.py --all-cached --tech solar

    # Run for both wind and solar in one pass
    python3 pipeline/importers/import_price_band_capture.py --all-cached --tech all

    # Validate computed capture prices against OpenElectricity reported values
    python3 pipeline/importers/import_price_band_capture.py --validate
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

# Price band regime definitions: (label, min_exclusive, max_inclusive)
# Intervals are assigned to the first band where price < band_max.
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
        CREATE TABLE IF NOT EXISTS price_band_capture (
            year           INTEGER NOT NULL,
            month          INTEGER NOT NULL,
            duid           TEXT NOT NULL,
            project_id     TEXT,
            region         TEXT NOT NULL,
            band_label     TEXT NOT NULL,
            band_min       REAL NOT NULL,
            band_max       REAL NOT NULL,
            gen_mwh        REAL NOT NULL DEFAULT 0,
            interval_count INTEGER NOT NULL DEFAULT 0,
            gen_pct        REAL,
            avg_price      REAL,
            UNIQUE(year, month, duid, band_label)
        );
        CREATE INDEX IF NOT EXISTS idx_pbc_project
            ON price_band_capture(project_id, year, month);
        CREATE INDEX IF NOT EXISTS idx_pbc_duid
            ON price_band_capture(duid, year, month);
    """)
    conn.commit()


# ============================================================
# Download helpers
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


def _cache_path_price(month: str) -> str:
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)
    # Try new format filename first
    return os.path.join(CACHE_DIR, f'PUBLIC_ARCHIVE#DISPATCHPRICE#FILE01#{yyyy}{mm}010000.zip')


def _cache_path_load(month: str) -> str:
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)
    return os.path.join(CACHE_DIR, f'PUBLIC_ARCHIVE#DISPATCHLOAD#FILE01#{yyyy}{mm}010000.zip')


def ensure_price_zip(month: str) -> str | None:
    """Return path to the DISPATCHPRICE zip for month, downloading if needed."""
    yyyy, mm = month.split('-')
    mm = mm.zfill(2)

    # Check both filename variants in cache
    legacy = os.path.join(CACHE_DIR, f'PUBLIC_DVD_DISPATCHPRICE_{yyyy}{mm}010000.zip')
    new    = os.path.join(CACHE_DIR, f'PUBLIC_ARCHIVE#DISPATCHPRICE#FILE01#{yyyy}{mm}010000.zip')
    for p in (new, legacy):
        if os.path.exists(p) and os.path.getsize(p) > 0:
            return p

    # Download
    for tmpl in PRICE_ARCHIVE_URLS:
        url = tmpl.format(yyyy=yyyy, mm=mm)
        target = os.path.join(CACHE_DIR, unquote(os.path.basename(url)))
        print(f'    Downloading DISPATCHPRICE {month}...')
        if _download(url, target):
            return target

    return None


def ensure_load_zip(month: str) -> str | None:
    """Return path to the DISPATCHLOAD zip for month, downloading if needed."""
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
# 5-minute price parsing
# ============================================================

def parse_5min_prices(price_zip: str) -> dict[str, dict[str, float]]:
    """Parse DISPATCHPRICE zip → {region: {settlement_dt_str: rrp}}.

    settlement_dt_str format: 'YYYY-MM-DD HH:MM:SS'
    Revisions are deduplicated — first row per (region, datetime) wins.
    """
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
            region = row[ri].strip().upper() if ri < len(row) else ''
            if region not in NEM_REGIONS:
                continue
            settle_s = row[di].strip() if di < len(row) else ''
            rrp_s    = row[pi].strip() if pi < len(row) else ''
            if not settle_s or not rrp_s:
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
            dt_key = dt.strftime('%Y-%m-%d %H:%M:%S')
            prices[region][dt_key] = rrp

    try:
        with zipfile.ZipFile(price_zip) as zf:
            for name in zf.namelist():
                if name.upper().endswith('.CSV'):
                    _parse_csv(zf.read(name))
    except zipfile.BadZipFile:
        print(f'    ! bad zip: {price_zip}')

    return prices


# ============================================================
# DUID registry
# ============================================================

def load_wind_duids(conn: sqlite3.Connection) -> dict[str, tuple[str, str]]:
    """Return {DUID: (project_id, region)} for operating wind DUIDs."""
    rows = conn.execute("""
        SELECT UPPER(duid) as duid, project_id, region
        FROM aemo_generation_info
        WHERE fuel_type = 'Wind'
          AND status IN ('In Service', 'In Commissioning')
          AND duid IS NOT NULL AND duid != ''
    """).fetchall()
    return {r['duid']: (r['project_id'] or '', r['region'] or '') for r in rows}


def load_solar_duids(conn: sqlite3.Connection) -> dict[str, tuple[str, str]]:
    """Return {DUID: (project_id, region)} for operating solar DUIDs."""
    rows = conn.execute("""
        SELECT UPPER(duid) as duid, project_id, region
        FROM aemo_generation_info
        WHERE (fuel_type LIKE '%Solar%' OR fuel_type LIKE '%PV%')
          AND status IN ('In Service', 'In Commissioning')
          AND duid IS NOT NULL AND duid != ''
    """).fetchall()
    return {r['duid']: (r['project_id'] or '', r['region'] or '') for r in rows}


def load_duids_for_tech(conn: sqlite3.Connection, tech: str) -> dict[str, tuple[str, str]]:
    """Load DUIDs for the given tech: 'wind', 'solar', or 'all'."""
    if tech == 'wind':
        return load_wind_duids(conn)
    if tech == 'solar':
        return load_solar_duids(conn)
    if tech == 'all':
        merged = load_wind_duids(conn)
        merged.update(load_solar_duids(conn))
        return merged
    raise ValueError(f"Unknown tech '{tech}' — use wind, solar, or all")


# ============================================================
# 5-minute generation × price correlation
# ============================================================

def _band_for_price(rrp: float) -> str:
    for label, lo, hi in PRICE_BANDS:
        if lo <= rrp < hi:
            return label
    return PRICE_BANDS[-1][0]   # clamp to top band


def _iter_dispatch_csv(content: bytes):
    """Yield (settlement_dt_str, duid_upper, total_cleared_mw) from a DISPATCHLOAD CSV."""
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
        if not duid or not settle_s:
            continue
        yield settle_s, duid, cleared_s


def compute_price_bands_for_month(
    load_zip: str,
    prices: dict[str, dict[str, float]],
    wind_duids: dict[str, tuple[str, str]],
) -> dict[str, dict[str, dict]]:
    """Correlate DISPATCHLOAD × DISPATCHPRICE for wind DUIDs.

    Returns {duid: {band_label: {'gen_mwh': float, 'interval_count': int,
                                  'price_sum': float, 'price_count': int}}}
    """
    # buckets[duid][band_label]
    BandBucket = lambda: {'gen_mwh': 0.0, 'interval_count': 0, 'price_sum': 0.0, 'price_count': 0}
    buckets: dict[str, dict[str, dict]] = {
        duid: {label: BandBucket() for label in BAND_LABELS}
        for duid in wind_duids
    }
    # Dedupe by (settlement_dt, duid) — DISPATCHLOAD has intervention/rerun duplicates
    seen: set[tuple[str, str]] = set()

    def _process_csv(content: bytes) -> None:
        for settle_s, duid, cleared_s in _iter_dispatch_csv(content):
            if duid not in wind_duids:
                continue
            key = (settle_s, duid)
            if key in seen:
                continue
            seen.add(key)
            # Normalise settlement datetime string
            try:
                dt = datetime.strptime(settle_s, '%Y/%m/%d %H:%M:%S')
            except ValueError:
                try:
                    dt = datetime.strptime(settle_s, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    continue
            dt_key = dt.strftime('%Y-%m-%d %H:%M:%S')
            # Look up regional price
            _, region = wind_duids[duid]
            rrp = prices.get(region, {}).get(dt_key)
            if rrp is None:
                continue   # no matching price interval — skip
            try:
                mw = float(cleared_s)
            except ValueError:
                continue
            if mw <= 0:
                continue   # ignore zero / negative dispatch (curtailment)
            mwh = mw / 12.0   # 5-min interval = 1/12 hour
            band = _band_for_price(rrp)
            b = buckets[duid][band]
            b['gen_mwh']      += mwh
            b['interval_count'] += 1
            b['price_sum']    += rrp * mwh   # value-weighted sum
            b['price_count']  += 1

    try:
        with zipfile.ZipFile(load_zip) as zf:
            for name in zf.namelist():
                if name.upper().endswith('.CSV'):
                    _process_csv(zf.read(name))
                elif name.upper().endswith('.ZIP'):
                    # Some archives have nested zips
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
    buckets: dict[str, dict[str, dict]],
    wind_duids: dict[str, tuple[str, str]],
) -> int:
    rows_written = 0
    for duid, bands in buckets.items():
        project_id, region = wind_duids.get(duid, ('', ''))
        # Total generation for this DUID this month (for gen_pct)
        total_mwh = sum(b['gen_mwh'] for b in bands.values())
        if total_mwh == 0:
            continue   # DUID had no generation this month
        for label, (_, band_min, band_max) in zip(BAND_LABELS, PRICE_BANDS):
            b = bands[label]
            gen_mwh = b['gen_mwh']
            gen_pct = round(gen_mwh / total_mwh * 100, 2) if total_mwh > 0 else 0.0
            avg_price = (round(b['price_sum'] / gen_mwh, 2)
                         if gen_mwh > 0 else None)
            conn.execute("""
                INSERT INTO price_band_capture
                    (year, month, duid, project_id, region,
                     band_label, band_min, band_max,
                     gen_mwh, interval_count, gen_pct, avg_price)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
                ON CONFLICT(year, month, duid, band_label) DO UPDATE SET
                    project_id    = excluded.project_id,
                    region        = excluded.region,
                    gen_mwh       = excluded.gen_mwh,
                    interval_count = excluded.interval_count,
                    gen_pct       = excluded.gen_pct,
                    avg_price     = excluded.avg_price
            """, (
                year, month, duid, project_id or None, region,
                label, band_min, band_max,
                round(gen_mwh, 3), b['interval_count'],
                gen_pct, avg_price,
            ))
            rows_written += 1
    conn.commit()
    return rows_written


# ============================================================
# Per-month orchestration
# ============================================================

def process_month(month: str, conn: sqlite3.Connection, tech: str = 'wind') -> bool:
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

    duids = load_duids_for_tech(conn, tech)
    if not duids:
        print(f'    ! no {tech} DUIDs in aemo_generation_info — run import_aemo_gen_info.py first')
        return False

    print(f'  [{month}] Parsing 5-min prices ({os.path.basename(price_zip)})...')
    prices = parse_5min_prices(price_zip)
    n_intervals = sum(len(v) for v in prices.values())
    print(f'    {n_intervals:,} price intervals loaded ({len(duids)} {tech} DUIDs)')

    print(f'  [{month}] Correlating generation × price ({os.path.basename(load_zip)})...')
    buckets = compute_price_bands_for_month(load_zip, prices, duids)

    active = sum(1 for d, bands in buckets.items() if any(b['gen_mwh'] > 0 for b in bands.values()))
    print(f'    {active}/{len(duids)} DUIDs had generation this month')

    rows = upsert_month(conn, year, mon, buckets, duids)
    print(f'    Wrote {rows} band rows to price_band_capture')
    return True


# ============================================================
# Validation against OpenElectricity capture prices
# ============================================================

def validate_vs_oe(conn: sqlite3.Connection) -> None:
    """Compare 5-min computed capture prices against OE reported values."""
    try:
        rows = conn.execute("""
            SELECT
                pbc.year, pbc.month, pbc.duid, pbc.project_id, pbc.region,
                SUM(pbc.gen_mwh) as total_gen,
                SUM(pbc.gen_mwh * COALESCE(pbc.avg_price, 0)) as revenue
            FROM price_band_capture pbc
            GROUP BY pbc.year, pbc.month, pbc.duid
            HAVING total_gen > 0
        """).fetchall()
    except sqlite3.OperationalError:
        print('  ! price_band_capture table not found — run import first')
        return

    try:
        oe_rows = conn.execute("""
            SELECT pm.project_id, pm.year, pm.month, pm.energy_price_received
            FROM performance_monthly pm
            WHERE pm.energy_price_received IS NOT NULL
        """).fetchall()
        oe_lookup = {(r['project_id'], r['year'], r['month']): r['energy_price_received']
                     for r in oe_rows}
    except sqlite3.OperationalError:
        print('  ! performance_monthly not available for comparison')
        oe_lookup = {}

    if not rows:
        print('  No price_band_capture data to validate.')
        return

    print(f'\n  Validation: computed capture price vs OpenElectricity reported')
    print(f'  {"DUID":12s} {"YM":7s} {"Computed":>10s} {"OE":>10s} {"Diff%":>8s}')
    print(f'  {"-"*12} {"-"*7} {"-"*10} {"-"*10} {"-"*8}')

    diffs = []
    for r in rows[:50]:   # show up to 50 rows
        computed = r['revenue'] / r['total_gen'] if r['total_gen'] > 0 else None
        oe_cp = oe_lookup.get((r['project_id'], r['year'], r['month']))
        ym = f"{r['year']}-{r['month']:02d}"
        if computed and oe_cp:
            diff_pct = (computed - oe_cp) / oe_cp * 100
            diffs.append(abs(diff_pct))
            flag = ' !' if abs(diff_pct) > 15 else ''
            print(f"  {r['duid']:12s} {ym:7s} ${computed:>8.2f}  ${oe_cp:>8.2f}  {diff_pct:>+7.1f}%{flag}")
        elif computed:
            print(f"  {r['duid']:12s} {ym:7s} ${computed:>8.2f}  {'N/A':>10s}  {'—':>8s}")

    if diffs:
        avg_diff = sum(diffs) / len(diffs)
        print(f'\n  Avg abs difference vs OE: {avg_diff:.1f}%')
        if avg_diff < 5:
            print('  ✓ Excellent agreement — 5-min correlation validated')
        elif avg_diff < 15:
            print('  ~ Good agreement (minor differences expected: OE may use SCADA vs AEMO dispatch)')
        else:
            print('  ! High discrepancy — check DUID/region mapping or revision handling')


# ============================================================
# Cache discovery
# ============================================================

def list_months_with_both_cached() -> list[str]:
    """Return YYYY-MM list where both PRICE and LOAD ZIPs are in cache."""
    import re
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
    out = []
    y, m = y0, m0
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
        description='Import true 5-min price band capture for wind/solar farms from NEMWEB archives'
    )
    grp = parser.add_mutually_exclusive_group()
    grp.add_argument('--month',      metavar='YYYY-MM', help='Process a single month')
    grp.add_argument('--months',     nargs=2, metavar=('START', 'END'), help='Process a date range')
    grp.add_argument('--all-cached', action='store_true', help='Process all months with both ZIPs cached')
    parser.add_argument('--tech', choices=['wind', 'solar', 'all'], default='wind',
                        help='Which technology DUIDs to process (default: wind)')
    parser.add_argument('--validate', action='store_true',
                        help='Print comparison table vs OpenElectricity capture prices')
    args = parser.parse_args()

    os.makedirs(CACHE_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)

    if args.validate:
        validate_vs_oe(conn)
        conn.close()
        return

    if args.month:
        months = [args.month]
    elif args.months:
        months = month_range(args.months[0], args.months[1])
    elif args.all_cached:
        months = list_months_with_both_cached()
        if not months:
            print(f'No months with both PRICE and LOAD ZIPs cached in {CACHE_DIR}')
            conn.close()
            return
        print(f'Found {len(months)} months with both ZIPs cached: {months[0]} → {months[-1]}')
    else:
        parser.print_help()
        conn.close()
        sys.exit(1)

    print(f'=== 5-min Price Band Capture Importer — tech={args.tech} ===')
    ok = fail = 0
    t0 = datetime.now()
    for month in months:
        if process_month(month, conn, tech=args.tech):
            ok += 1
        else:
            fail += 1

    elapsed = (datetime.now() - t0).total_seconds()
    print(f'\nDone in {elapsed:.0f}s — {ok} months OK, {fail} failed')
    conn.close()


if __name__ == '__main__':
    main()
