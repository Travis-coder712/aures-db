"""
OpenElectricity Performance Data Importer
==========================================
Fetches facility-level energy and market value data from the OpenElectricity API
and computes annual performance metrics for each project.

Usage:
    # Import a full year (set OPENELECTRICITY_API_KEY env var):
    python3 pipeline/importers/import_openelectricity.py --year 2024
    python3 pipeline/importers/import_openelectricity.py --year 2025

    # Import year-to-date for current year:
    python3 pipeline/importers/import_openelectricity.py --year 2026 --ytd

    # Generate sample data for frontend development:
    python3 pipeline/importers/import_openelectricity.py --year 2025 --sample
"""

import os
import sys
import argparse
import random
import json
import time
from datetime import datetime, date
from difflib import SequenceMatcher
from urllib.request import Request, urlopen
from urllib.parse import urlencode, quote

# Add parent to path so we can import db.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

# ============================================================
# Configuration
# ============================================================

API_BASE = "https://api.openelectricity.org.au/v4"
BATCH_SIZE = 20  # Facilities per API call (keeps URL length reasonable)

# Technology mappings for sample data generation
TECH_CF_RANGES = {
    'wind': (0.25, 0.45),
    'solar': (0.18, 0.32),
    'bess': (0.05, 0.20),
    'hybrid': (0.20, 0.38),
    'pumped_hydro': (0.08, 0.25),
}

TECH_PRICE_RANGES = {
    'wind': (45, 95),
    'solar': (30, 75),
    'bess': (80, 250),
    'hybrid': (40, 85),
    'pumped_hydro': (70, 200),
}


# ============================================================
# HTTP Helpers
# ============================================================

def api_get(path, api_key, params=None):
    """Make an authenticated GET request to the OpenElectricity API."""
    url = f"{API_BASE}{path}"
    if params:
        # Handle repeated params (e.g., facility_code=A&facility_code=B)
        parts = []
        for k, v in params.items():
            if isinstance(v, list):
                for item in v:
                    parts.append(f"{quote(k)}={quote(str(item))}")
            else:
                parts.append(f"{quote(k)}={quote(str(v))}")
        url += "?" + "&".join(parts)

    req = Request(url, headers={
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "AURES-Pipeline/1.0",
        "Accept": "application/json",
    })
    resp = urlopen(req, timeout=30)
    return json.loads(resp.read().decode())


# ============================================================
# OpenElectricity API Import
# ============================================================

def import_from_api(conn, year: int, ytd: bool = False):
    """Import performance data from the OpenElectricity API.

    Args:
        conn: SQLite connection
        year: Year to import
        ytd: If True, import year-to-date (partial year) and adjust CF calculation
    """
    api_key = os.environ.get('OPENELECTRICITY_API_KEY')
    if not api_key:
        print("ERROR: OPENELECTRICITY_API_KEY environment variable not set.")
        print("Sign up at https://platform.openelectricity.org.au/sign-up")
        sys.exit(1)

    # Check quota
    me = api_get("/me", api_key)
    remaining = me.get('data', {}).get('meta', {}).get('remaining', 0)
    print(f"API quota remaining: {remaining} requests")
    if remaining < 15:
        print("WARNING: Low API quota. Consider waiting for reset.")
        sys.exit(1)

    # Determine date range
    date_start = f"{year}-01-01"
    if ytd:
        # Use end of last complete month for YTD
        today = date.today()
        if today.year > year:
            # Year is complete — just import full year
            date_end = f"{year}-12-31"
            ytd = False
            print(f"Note: {year} is complete — importing full year data.")
        elif today.month == 1:
            print(f"No complete months yet for {year}.")
            return
        else:
            # End of last complete month
            last_month = today.month - 1
            import calendar
            last_day = calendar.monthrange(year, last_month)[1]
            date_end = f"{year}-{last_month:02d}-{last_day:02d}"
            # Calculate hours elapsed for CF adjustment
            from datetime import timedelta
            start_dt = date(year, 1, 1)
            end_dt = date(year, last_month, last_day)
            hours_elapsed = (end_dt - start_dt + timedelta(days=1)).days * 24
            print(f"YTD mode: {date_start} to {date_end} ({hours_elapsed} hours)")
    else:
        date_end = f"{year}-12-31"

    # For full year CF calculation
    hours_in_period = hours_elapsed if ytd else 8760

    # Step 1: Get our operating projects
    projects = get_operating_projects(conn)
    if not projects:
        print("No operating projects found in database.")
        return
    projects_by_id = {p['id']: p for p in projects}
    print(f"Found {len(projects)} operating projects.")

    # Step 2: Fetch all NEM operating facilities from API
    print("Fetching facility list from OpenElectricity...")
    facilities_data = api_get("/facilities/", api_key, {
        "status_id": "operating",
        "network_id": "NEM",
    })
    oe_facilities = facilities_data.get('data', [])
    print(f"  {len(oe_facilities)} NEM operating facilities from API.")

    # Step 3: Build project -> facility_code mapping
    mapping = build_project_facility_map(conn, projects, oe_facilities)
    print(f"Matched {len(mapping)} projects to OE facilities.")

    # Step 4: Fetch energy + market_value in batches
    facility_codes = list(set(mapping.values()))
    # Reverse map: facility_code -> [project_ids]
    code_to_projects = {}
    for pid, fcode in mapping.items():
        code_to_projects.setdefault(fcode, []).append(pid)

    # Pre-build unit_code -> (facility_code, fueltech_id) lookup
    unit_lookup = {}
    for f in oe_facilities:
        for u in f.get('units', []):
            unit_lookup[u['code']] = {
                'facility': f['code'],
                'fueltech': u.get('fueltech_id', ''),
            }

    total_batches = (len(facility_codes) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"\nFetching data for {len(facility_codes)} unique facilities in {total_batches} batches...")

    # Collect results: facility_code -> {energy, market_value, charge_energy, charge_value, discharge_energy, discharge_value}
    facility_results = {}
    EMPTY_RESULT = lambda: {
        'energy_mwh': 0, 'market_value_aud': 0,
        'charge_energy_mwh': 0, 'charge_value_aud': 0,
        'discharge_energy_mwh': 0, 'discharge_value_aud': 0,
    }

    for i in range(0, len(facility_codes), BATCH_SIZE):
        batch = facility_codes[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1

        try:
            data = api_get("/data/facilities/NEM", api_key, {
                "facility_code": batch,
                "metrics": ["energy", "market_value"],
                "interval": "1y",
                "date_start": date_start,
                "date_end": date_end,
            })

            # Parse results — split by unit fueltech for BESS charge/discharge
            for series in data.get('data', []):
                metric = series.get('metric')
                for result in series.get('results', []):
                    unit_code = result.get('columns', {}).get('unit_code', '')
                    values = result.get('data', [])
                    value = values[0][1] if values and len(values[0]) > 1 else None

                    if value is None:
                        continue

                    info = unit_lookup.get(unit_code)
                    if not info:
                        continue

                    fcode = info['facility']
                    fueltech = info['fueltech']

                    if fcode not in facility_results:
                        facility_results[fcode] = EMPTY_RESULT()

                    r = facility_results[fcode]

                    # Accumulate totals
                    if metric == 'energy':
                        r['energy_mwh'] += value
                    elif metric == 'market_value':
                        r['market_value_aud'] += value

                    # Track BESS charge/discharge separately
                    if fueltech == 'battery_discharging':
                        if metric == 'energy':
                            r['discharge_energy_mwh'] += abs(value)
                        elif metric == 'market_value':
                            r['discharge_value_aud'] += value
                    elif fueltech == 'battery_charging':
                        if metric == 'energy':
                            r['charge_energy_mwh'] += abs(value)
                        elif metric == 'market_value':
                            r['charge_value_aud'] += abs(value)

            print(f"  Batch {batch_num}/{total_batches}: OK ({len(batch)} facilities)")
            time.sleep(0.5)  # Be polite to the API

        except Exception as e:
            print(f"  Batch {batch_num}/{total_batches}: FAILED - {e}")

    # Step 5: Compute metrics and upsert
    imported = 0
    skipped = 0
    for fcode, raw in facility_results.items():
        energy = raw['energy_mwh']
        market_value = raw['market_value_aud']

        if energy <= 0:
            continue

        for pid in code_to_projects.get(fcode, []):
            project = projects_by_id.get(pid)
            if not project:
                continue

            capacity_mw = project['capacity_mw']
            tech = project['technology']
            storage_mwh = project.get('storage_mwh')

            cf = (energy / (capacity_mw * hours_in_period)) * 100
            price_received = market_value / energy if energy > 0 else 0
            revenue_per_mw = market_value / capacity_mw if capacity_mw > 0 else 0

            metrics = {
                'energy_mwh': round(energy, 1),
                'capacity_factor_pct': round(min(cf, 100), 2),
                'energy_price_received': round(price_received, 2),
                'revenue_aud': round(market_value, 0),
                'revenue_per_mw': round(revenue_per_mw, 0),
                'market_value_aud': round(market_value, 0),
            }

            # BESS: derive charge/discharge metrics from separate unit data
            if tech == 'bess':
                discharged = raw.get('discharge_energy_mwh', 0)
                charged = raw.get('charge_energy_mwh', 0)
                discharge_val = raw.get('discharge_value_aud', 0)
                charge_val = raw.get('charge_value_aud', 0)

                if discharged > 0 and charged > 0:
                    avg_discharge_price = discharge_val / discharged
                    avg_charge_price = charge_val / charged
                    cycles = discharged / storage_mwh if storage_mwh else None
                    # Utilisation: % of hours the battery was discharging
                    # Approximate: discharged MWh / (capacity_mw * hours_in_period) * 100
                    util = (discharged / (capacity_mw * hours_in_period)) * 100

                    metrics.update({
                        'energy_discharged_mwh': round(discharged, 1),
                        'energy_charged_mwh': round(charged, 1),
                        'avg_discharge_price': round(avg_discharge_price, 2),
                        'avg_charge_price': round(avg_charge_price, 2),
                        'utilisation_pct': round(min(util, 100), 2),
                        'cycles': round(cycles, 1) if cycles else None,
                    })

            source = 'openelectricity_ytd' if ytd else 'openelectricity'
            upsert_performance(conn, pid, year, metrics, source)
            imported += 1

    conn.commit()
    mode = f"YTD (to {date_end})" if ytd else f"full year"
    print(f"\nImported real performance data for {imported} projects ({year} {mode}).")
    print(f"Facilities with data: {len(facility_results)}, Skipped (no energy): {skipped}")


def build_project_facility_map(conn, projects, oe_facilities):
    """Match AURES projects to OpenElectricity facility codes.

    Strategy: 1) DUID match via aemo_generation_info, 2) Name fuzzy match.
    Returns: dict of project_id -> facility_code
    """
    # Build OE unit_code -> facility_code index
    oe_unit_to_facility = {}
    for f in oe_facilities:
        for u in f.get('units', []):
            oe_unit_to_facility[u['code']] = f['code']

    # Build OE name -> facility_code index (normalized)
    oe_by_name = {}
    for f in oe_facilities:
        n = _normalize_name(f['name'])
        oe_by_name[n] = f['code']

    # Get our DUIDs
    duids = conn.execute("""
        SELECT duid, project_id FROM aemo_generation_info
        WHERE project_id IS NOT NULL AND duid IS NOT NULL
    """).fetchall()
    project_duids = {}
    for d in duids:
        project_duids.setdefault(d['project_id'], []).append(d['duid'])

    matched = {}
    for p in projects:
        pid = p['id']
        tech = p['technology']
        if tech not in ('wind', 'solar', 'bess', 'hybrid', 'pumped_hydro'):
            continue

        oe_code = None

        # Strategy 1: DUID match
        for duid in project_duids.get(pid, []):
            if duid in oe_unit_to_facility:
                oe_code = oe_unit_to_facility[duid]
                break

        # Strategy 2: Name match
        if not oe_code:
            pn = _normalize_name(p['name'])
            if pn in oe_by_name:
                oe_code = oe_by_name[pn]
            else:
                best_score = 0
                best_code = None
                for n, code in oe_by_name.items():
                    score = SequenceMatcher(None, pn, n).ratio()
                    if score > best_score:
                        best_score = score
                        best_code = code
                if best_score >= 0.7:
                    oe_code = best_code

        if oe_code:
            matched[pid] = oe_code

    return matched


def _normalize_name(name):
    """Normalize a facility/project name for matching."""
    n = name.lower()
    for suffix in [' wind farm', ' solar farm', ' solar plant', ' solar park',
                   ' bess', ' battery', ' energy storage system']:
        n = n.replace(suffix, '')
    n = n.replace(' stage ', ' ').replace(' phase ', ' ').replace('_', ' ')
    return n.strip()


# ============================================================
# Sample Data Generation (for frontend development)
# ============================================================

def get_operating_projects(conn):
    """Get all operating projects from the database."""
    rows = conn.execute("""
        SELECT id, name, technology, capacity_mw, storage_mwh, state
        FROM projects
        WHERE status = 'operating'
        AND capacity_mw >= 5
        ORDER BY capacity_mw DESC
    """).fetchall()
    return [dict(r) for r in rows]


def generate_sample_data(conn, year: int):
    """Generate realistic sample performance data for all operating projects."""
    projects = get_operating_projects(conn)
    if not projects:
        print("No operating projects found.")
        return

    print(f"Generating sample data for {len(projects)} operating projects...")

    # Use fixed seed for reproducibility
    random.seed(42 + year)

    imported = 0
    for project in projects:
        tech = project['technology']
        capacity_mw = project['capacity_mw']
        storage_mwh = project['storage_mwh']
        state = project['state']

        # Skip technologies we don't have ranges for
        if tech not in TECH_CF_RANGES:
            continue

        cf_range = TECH_CF_RANGES[tech]
        price_range = TECH_PRICE_RANGES[tech]

        # State-based adjustments (SA/QLD solar higher CF, TAS wind higher)
        cf_adj = 1.0
        if tech == 'solar' and state in ('QLD', 'SA'):
            cf_adj = 1.1
        elif tech == 'wind' and state == 'TAS':
            cf_adj = 1.15
        elif tech == 'wind' and state == 'SA':
            cf_adj = 1.08

        # Generate capacity factor with some variance
        cf = random.uniform(cf_range[0], cf_range[1]) * cf_adj
        cf = min(cf, 0.55)  # Cap at realistic maximum

        # Compute energy
        hours_in_year = 8760
        energy_mwh = capacity_mw * hours_in_year * cf

        # Generate price received
        price = random.uniform(price_range[0], price_range[1])

        # Revenue
        revenue_aud = energy_mwh * price
        revenue_per_mw = revenue_aud / capacity_mw

        # Curtailment (higher in congested zones)
        curtailment_base = random.uniform(0.5, 8.0)
        if state == 'QLD' and tech == 'solar':
            curtailment_base *= 1.5  # Higher curtailment in QLD solar
        elif state == 'SA' and tech in ('wind', 'solar'):
            curtailment_base *= 1.3

        metrics = {
            'energy_mwh': round(energy_mwh, 1),
            'capacity_factor_pct': round(cf * 100, 2),
            'curtailment_pct': round(curtailment_base, 2),
            'energy_price_received': round(price, 2),
            'revenue_aud': round(revenue_aud, 0),
            'revenue_per_mw': round(revenue_per_mw, 0),
            'market_value_aud': round(revenue_aud, 0),
        }

        # BESS-specific metrics
        if tech == 'bess' and storage_mwh:
            charge_price = random.uniform(20, 60)
            discharge_price = random.uniform(80, 250)
            utilisation = random.uniform(15, 55)
            cycles_per_year = random.uniform(200, 500)
            energy_discharged = storage_mwh * cycles_per_year / 365 * 365  # rough annual
            energy_charged = energy_discharged * 1.15  # ~85% round-trip efficiency

            metrics.update({
                'energy_charged_mwh': round(energy_charged, 1),
                'energy_discharged_mwh': round(energy_discharged, 1),
                'avg_charge_price': round(charge_price, 2),
                'avg_discharge_price': round(discharge_price, 2),
                'utilisation_pct': round(utilisation, 2),
                'cycles': round(cycles_per_year, 1),
            })

        upsert_performance(conn, project['id'], year, metrics, 'sample')
        imported += 1

    conn.commit()
    print(f"Generated sample performance data for {imported} projects (year {year}).")
    return imported


# ============================================================
# Database Operations
# ============================================================

def upsert_performance(conn, project_id: str, year: int, metrics: dict, source: str):
    """Insert or update a performance_annual row."""
    # Check if row exists
    existing = conn.execute(
        "SELECT id FROM performance_annual WHERE project_id = ? AND year = ?",
        (project_id, year)
    ).fetchone()

    if existing:
        # Update
        sets = ', '.join(f"{k} = ?" for k in metrics.keys())
        values = list(metrics.values()) + [source, project_id, year]
        conn.execute(
            f"UPDATE performance_annual SET {sets}, data_source = ?, updated_at = datetime('now') WHERE project_id = ? AND year = ?",
            values
        )
    else:
        # Insert
        cols = ['project_id', 'year'] + list(metrics.keys()) + ['data_source']
        vals = [project_id, year] + list(metrics.values()) + [source]
        placeholders = ', '.join('?' for _ in cols)
        col_names = ', '.join(cols)
        conn.execute(
            f"INSERT INTO performance_annual ({col_names}) VALUES ({placeholders})",
            vals
        )


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='Import performance data from OpenElectricity API')
    parser.add_argument('--year', type=int, default=2024, help='Year to import (default: 2024)')
    parser.add_argument('--sample', action='store_true', help='Generate sample data instead of API import')
    parser.add_argument('--ytd', action='store_true', help='Import year-to-date (partial year) data')
    args = parser.parse_args()

    conn = get_connection()

    if args.sample:
        generate_sample_data(conn, args.year)
    else:
        import_from_api(conn, args.year, ytd=args.ytd)

    conn.close()


if __name__ == '__main__':
    main()
