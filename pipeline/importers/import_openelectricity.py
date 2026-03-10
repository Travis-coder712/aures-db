"""
OpenElectricity Performance Data Importer
==========================================
Fetches facility-level energy and market value data from the OpenElectricity API
and computes annual performance metrics for each project.

Usage:
    # With API key (set OPENELECTRICITY_API_KEY env var):
    python3 pipeline/importers/import_openelectricity.py --year 2025

    # Generate sample data for frontend development:
    python3 pipeline/importers/import_openelectricity.py --year 2025 --sample

Requirements:
    pip install openelectricity
    (or: uv add openelectricity)
"""

import os
import sys
import argparse
import random
from datetime import datetime

# Add parent to path so we can import db.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

# ============================================================
# Configuration
# ============================================================

# Technology mappings for sample data generation
TECH_CF_RANGES = {
    'wind': (0.25, 0.45),       # Typical AU wind capacity factors
    'solar': (0.18, 0.32),      # Typical AU solar capacity factors
    'bess': (0.05, 0.20),       # BESS utilisation (discharge hours / total hours)
    'hybrid': (0.20, 0.38),     # Hybrid combines solar+BESS
    'pumped_hydro': (0.08, 0.25),
}

TECH_PRICE_RANGES = {
    'wind': (45, 95),           # $/MWh volume-weighted average
    'solar': (30, 75),
    'bess': (80, 250),          # Discharge price
    'hybrid': (40, 85),
    'pumped_hydro': (70, 200),
}

# ============================================================
# OpenElectricity API Import
# ============================================================

def import_from_api(conn, year: int):
    """Import performance data from the OpenElectricity API."""
    try:
        from openelectricity import OEClient, DataMetric
        from openelectricity.types import UnitFueltechType, UnitStatusType
    except ImportError:
        print("ERROR: openelectricity package not installed.")
        print("Install with: pip install openelectricity")
        sys.exit(1)

    api_key = os.environ.get('OPENELECTRICITY_API_KEY')
    if not api_key:
        print("ERROR: OPENELECTRICITY_API_KEY environment variable not set.")
        print("Sign up at https://platform.openelectricity.org.au/sign-up")
        sys.exit(1)

    # Get our operating projects with DUIDs
    projects = get_operating_projects(conn)
    if not projects:
        print("No operating projects found in database.")
        return

    print(f"Found {len(projects)} operating projects to fetch data for.")

    # Build DUID -> project_id mapping from aemo_generation_info
    duid_map = build_duid_map(conn)
    print(f"Mapped {len(duid_map)} DUIDs to projects.")

    # Fetch facility data from OpenElectricity
    client = OEClient(api_key=api_key)

    # Get list of facilities from the API
    facilities = client.get_facilities(
        network_id=["NEM"],
        status_id=[UnitStatusType.OPERATING],
    )

    # Match API facilities to our projects via station_name
    matched = match_facilities(facilities, projects, duid_map)
    print(f"Matched {len(matched)} facilities to AURES projects.")

    # Fetch energy data for matched facilities
    date_start = datetime(year, 1, 1)
    date_end = datetime(year, 12, 31)

    imported = 0
    for facility_code, project_id in matched.items():
        try:
            data = client.get_facility_data(
                facility_code=facility_code,
                metrics=[DataMetric.ENERGY],
                interval="1M",
                date_start=date_start,
                date_end=date_end,
            )

            # Sum monthly energy to annual
            annual_energy = sum_annual_energy(data)
            if annual_energy is None:
                continue

            project = next((p for p in projects if p['id'] == project_id), None)
            if not project:
                continue

            # Compute metrics
            metrics = compute_metrics(project, annual_energy, year)
            upsert_performance(conn, project_id, year, metrics, 'openelectricity')
            imported += 1

        except Exception as e:
            print(f"  Warning: Failed to fetch {facility_code}: {e}")

    conn.commit()
    print(f"Imported performance data for {imported} projects (year {year}).")


def get_operating_projects(conn):
    """Get all operating projects from the database."""
    rows = conn.execute("""
        SELECT id, name, technology, capacity_mw, storage_mwh, state
        FROM projects
        WHERE status = 'operating'
        AND capacity_mw >= 30
        ORDER BY capacity_mw DESC
    """).fetchall()
    return [dict(r) for r in rows]


def build_duid_map(conn):
    """Build a mapping of DUID -> project_id from aemo_generation_info."""
    rows = conn.execute("""
        SELECT duid, project_id, station_name
        FROM aemo_generation_info
        WHERE project_id IS NOT NULL AND duid IS NOT NULL
    """).fetchall()
    return {r['duid']: {'project_id': r['project_id'], 'station_name': r['station_name']} for r in rows}


def match_facilities(facilities, projects, duid_map):
    """Match OpenElectricity facilities to our projects."""
    matched = {}
    project_names = {p['name'].lower(): p['id'] for p in projects}

    # Try matching by station name
    if hasattr(facilities, 'data'):
        for facility in facilities.data:
            code = getattr(facility, 'code', None)
            name = getattr(facility, 'name', '').lower()
            if code and name:
                # Try exact name match
                for pname, pid in project_names.items():
                    if name in pname or pname in name:
                        matched[code] = pid
                        break

    return matched


def sum_annual_energy(data):
    """Sum monthly energy data to annual total in MWh."""
    try:
        total = 0
        if hasattr(data, 'data'):
            for series in data.data:
                if hasattr(series, 'results'):
                    for result in series.results:
                        if result.value is not None:
                            total += result.value
        return total if total > 0 else None
    except Exception:
        return None


def compute_metrics(project, annual_energy_mwh, year):
    """Compute derived performance metrics."""
    capacity_mw = project['capacity_mw']
    hours_in_year = 8760

    capacity_factor = (annual_energy_mwh / (capacity_mw * hours_in_year)) * 100

    return {
        'energy_mwh': annual_energy_mwh,
        'capacity_factor_pct': round(capacity_factor, 2),
    }


# ============================================================
# Sample Data Generation (for frontend development)
# ============================================================

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
    parser.add_argument('--year', type=int, default=2025, help='Year to import (default: 2025)')
    parser.add_argument('--sample', action='store_true', help='Generate sample data instead of API import')
    args = parser.parse_args()

    conn = get_connection()

    if args.sample:
        generate_sample_data(conn, args.year)
    else:
        import_from_api(conn, args.year)

    conn.close()


if __name__ == '__main__':
    main()
