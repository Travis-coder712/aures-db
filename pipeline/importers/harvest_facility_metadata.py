"""
Facility Metadata Harvester
============================
Reads facility metadata already fetched from the OpenElectricity API
(commencement dates, coordinates, data_first_seen) and populates:
  - timeline_events (COD, construction_start, energisation)
  - projects (latitude, longitude, cod_current)

This script reuses the facilities list from the same API call as the
performance importer — it costs ZERO additional API calls when run after
import_openelectricity.py, or 1 call if run standalone.

Usage:
    python3 pipeline/importers/harvest_facility_metadata.py
    python3 pipeline/importers/harvest_facility_metadata.py --dry-run
"""

import os
import sys
import argparse
import json
from datetime import datetime
from difflib import SequenceMatcher
from urllib.request import Request, urlopen

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

API_BASE = "https://api.openelectricity.org.au/v4"

# Map OE specificity to AURES date_precision
SPECIFICITY_MAP = {
    'day': 'day',
    'month': 'month',
    'quarter': 'quarter',
    'year': 'year',
}


def api_get(path, api_key, params=None):
    """Make an authenticated GET request to the OpenElectricity API."""
    url = f"{API_BASE}{path}"
    if params:
        from urllib.parse import quote
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
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 AURES/2.8",
        "Accept": "application/json",
    })
    resp = urlopen(req, timeout=30)
    return json.loads(resp.read().decode())


def _normalize_name(name):
    """Normalize a facility/project name for matching."""
    n = name.lower()
    for suffix in [' wind farm', ' solar farm', ' solar plant', ' solar park',
                   ' bess', ' battery', ' energy storage system']:
        n = n.replace(suffix, '')
    n = n.replace(' stage ', ' ').replace(' phase ', ' ').replace('_', ' ')
    return n.strip()


def build_project_facility_map(conn, projects, oe_facilities):
    """Match AURES projects to OpenElectricity facility objects."""
    # Build OE unit_code -> facility index
    oe_unit_to_facility = {}
    for f in oe_facilities:
        for u in f.get('units', []):
            oe_unit_to_facility[u['code']] = f

    # Build OE name -> facility index
    oe_by_name = {}
    for f in oe_facilities:
        n = _normalize_name(f['name'])
        oe_by_name[n] = f

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

        facility = None

        # Strategy 1: DUID match
        for duid in project_duids.get(pid, []):
            if duid in oe_unit_to_facility:
                facility = oe_unit_to_facility[duid]
                break

        # Strategy 2: Name match
        if not facility:
            pn = _normalize_name(p['name'])
            if pn in oe_by_name:
                facility = oe_by_name[pn]
            else:
                best_score = 0
                best_fac = None
                for n, fac in oe_by_name.items():
                    score = SequenceMatcher(None, pn, n).ratio()
                    if score > best_score:
                        best_score = score
                        best_fac = fac
                if best_score >= 0.7:
                    facility = best_fac

        if facility:
            matched[pid] = facility

    return matched


def extract_facility_dates(facility):
    """Extract key dates from a facility's units.

    Returns dict with earliest commencement_date, data_first_seen, etc.
    Uses the earliest date across all units of the facility.
    """
    dates = {}

    for unit in facility.get('units', []):
        # commencement_date (COD equivalent)
        cd = unit.get('commencement_date')
        cd_spec = unit.get('commencement_date_specificity', 'year')
        if cd:
            if 'commencement_date' not in dates or cd < dates['commencement_date']['date']:
                dates['commencement_date'] = {
                    'date': cd,
                    'precision': SPECIFICITY_MAP.get(cd_spec, 'year'),
                }

        # data_first_seen (first generation)
        dfs = unit.get('data_first_seen')
        if dfs:
            if 'data_first_seen' not in dates or dfs < dates['data_first_seen']['date']:
                dates['data_first_seen'] = {
                    'date': dfs,
                    'precision': 'day',
                }

        # construction_start_date
        csd = unit.get('construction_start_date')
        csd_spec = unit.get('construction_start_date_specificity', 'year')
        if csd:
            if 'construction_start_date' not in dates or csd < dates['construction_start_date']['date']:
                dates['construction_start_date'] = {
                    'date': csd,
                    'precision': SPECIFICITY_MAP.get(csd_spec, 'year'),
                }

        # project_approval_date
        pad = unit.get('project_approval_date')
        pad_spec = unit.get('project_approval_date_specificity', 'year')
        if pad:
            if 'project_approval_date' not in dates or pad < dates['project_approval_date']['date']:
                dates['project_approval_date'] = {
                    'date': pad,
                    'precision': SPECIFICITY_MAP.get(pad_spec, 'year'),
                }

        # expected_closure_date
        ecd = unit.get('expected_closure_date')
        ecd_spec = unit.get('expected_closure_date_specificity', 'year')
        if ecd:
            if 'expected_closure_date' not in dates or ecd < dates['expected_closure_date']['date']:
                dates['expected_closure_date'] = {
                    'date': ecd,
                    'precision': SPECIFICITY_MAP.get(ecd_spec, 'year'),
                }

    return dates


def iso_to_date(iso_str):
    """Convert ISO datetime string to YYYY-MM-DD date."""
    if not iso_str:
        return None
    # Handle both "2021-05-17T14:00:00+10:00" and "2021-05-17"
    return iso_str[:10]


def create_timeline_event(conn, project_id, date, precision, event_type, title, detail=None, dry_run=False):
    """Create a timeline event if it doesn't already exist for this project+type."""
    # Check for existing event of same type from openelectricity
    existing = conn.execute(
        "SELECT id FROM timeline_events WHERE project_id = ? AND event_type = ? AND data_source = 'openelectricity'",
        (project_id, event_type)
    ).fetchone()

    if existing:
        # Update the existing event
        if not dry_run:
            conn.execute(
                "UPDATE timeline_events SET date = ?, date_precision = ?, title = ?, detail = ? WHERE id = ?",
                (date, precision, title, detail, existing['id'])
            )
        return 'updated'

    # Also check if there's a manual event of the same type — don't overwrite
    manual = conn.execute(
        "SELECT id FROM timeline_events WHERE project_id = ? AND event_type = ? AND data_source = 'manual'",
        (project_id, event_type)
    ).fetchone()
    if manual:
        return 'skipped'

    # Insert new
    if not dry_run:
        conn.execute("""
            INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source)
            VALUES (?, ?, ?, ?, ?, ?, 'openelectricity')
        """, (project_id, date, precision, event_type, title, detail))
    return 'created'


def harvest_metadata(conn, dry_run=False):
    """Main harvest function."""
    api_key = os.environ.get('OPENELECTRICITY_API_KEY')
    if not api_key:
        print("ERROR: OPENELECTRICITY_API_KEY environment variable not set.")
        sys.exit(1)

    # Check quota
    me = api_get("/me", api_key)
    remaining = me.get('data', {}).get('meta', {}).get('remaining', 0)
    print(f"API quota remaining: {remaining}")

    # Fetch facilities
    print("Fetching facility list from OpenElectricity...")
    facilities_data = api_get("/facilities/", api_key, {
        "status_id": "operating",
        "network_id": "NEM",
    })
    oe_facilities = facilities_data.get('data', [])
    print(f"  {len(oe_facilities)} NEM operating facilities.")

    # Get our projects
    projects = conn.execute("""
        SELECT id, name, technology, capacity_mw, storage_mwh, state, latitude, longitude, cod_current
        FROM projects
        WHERE status = 'operating' AND capacity_mw >= 5
        ORDER BY capacity_mw DESC
    """).fetchall()
    projects = [dict(r) for r in projects]
    print(f"  {len(projects)} AURES operating projects.")

    # Match
    mapping = build_project_facility_map(conn, projects, oe_facilities)
    print(f"  Matched {len(mapping)} projects to OE facilities.\n")

    # Stats
    stats = {
        'coordinates_updated': 0,
        'cod_updated': 0,
        'events_created': 0,
        'events_updated': 0,
        'events_skipped': 0,
    }

    projects_by_id = {p['id']: p for p in projects}

    for pid, facility in mapping.items():
        project = projects_by_id.get(pid)
        if not project:
            continue

        # --- Coordinates ---
        loc = facility.get('location')
        if loc and loc.get('lat') and loc.get('lng'):
            if not project.get('latitude') or not project.get('longitude'):
                if not dry_run:
                    conn.execute(
                        "UPDATE projects SET latitude = ?, longitude = ? WHERE id = ?",
                        (loc['lat'], loc['lng'], pid)
                    )
                stats['coordinates_updated'] += 1

        # --- Dates ---
        dates = extract_facility_dates(facility)

        # COD from commencement_date
        if 'commencement_date' in dates:
            cod_date = iso_to_date(dates['commencement_date']['date'])
            cod_prec = dates['commencement_date']['precision']
            if cod_date:
                # Update cod_current on project if not already set
                if not project.get('cod_current'):
                    if not dry_run:
                        conn.execute(
                            "UPDATE projects SET cod_current = ? WHERE id = ?",
                            (cod_date, pid)
                        )
                    stats['cod_updated'] += 1

                # Create COD timeline event
                result = create_timeline_event(
                    conn, pid, cod_date, cod_prec, 'cod',
                    f"Commercial operations commenced",
                    f"Commencement date from AEMO registration via OpenElectricity.",
                    dry_run
                )
                stats[f'events_{result}'] += 1

        # First generation from data_first_seen
        if 'data_first_seen' in dates:
            gen_date = iso_to_date(dates['data_first_seen']['date'])
            if gen_date:
                result = create_timeline_event(
                    conn, pid, gen_date, 'day', 'energisation',
                    f"First generation recorded",
                    f"First market dispatch data recorded in AEMO systems.",
                    dry_run
                )
                stats[f'events_{result}'] += 1

        # Construction start
        if 'construction_start_date' in dates:
            cs_date = iso_to_date(dates['construction_start_date']['date'])
            cs_prec = dates['construction_start_date']['precision']
            if cs_date:
                result = create_timeline_event(
                    conn, pid, cs_date, cs_prec, 'construction_start',
                    f"Construction commenced",
                    f"Construction start date from AEMO registration.",
                    dry_run
                )
                stats[f'events_{result}'] += 1

        # Planning approved
        if 'project_approval_date' in dates:
            pa_date = iso_to_date(dates['project_approval_date']['date'])
            pa_prec = dates['project_approval_date']['precision']
            if pa_date:
                result = create_timeline_event(
                    conn, pid, pa_date, pa_prec, 'planning_approved',
                    f"Project approved",
                    f"Planning approval date from AEMO registration.",
                    dry_run
                )
                stats[f'events_{result}'] += 1

    if not dry_run:
        conn.commit()

    prefix = "[DRY RUN] " if dry_run else ""
    print(f"{prefix}Harvest complete:")
    print(f"  Coordinates filled: {stats['coordinates_updated']}")
    print(f"  COD dates set: {stats['cod_updated']}")
    print(f"  Timeline events created: {stats['events_created']}")
    print(f"  Timeline events updated: {stats['events_updated']}")
    print(f"  Timeline events skipped (manual exists): {stats['events_skipped']}")


def main():
    parser = argparse.ArgumentParser(description='Harvest facility metadata from OpenElectricity')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without writing')
    args = parser.parse_args()

    conn = get_connection()
    harvest_metadata(conn, dry_run=args.dry_run)
    conn.close()


if __name__ == '__main__':
    main()
