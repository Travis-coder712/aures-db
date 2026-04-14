"""
AEMO Generation Information Importer
=====================================
Downloads and parses the AEMO NEM Generation Information Excel file,
aggregates unit-level data to site level, and inserts into the AURES
SQLite database.

Usage:
    python3 pipeline/importers/import_aemo_gen_info.py

The importer:
  1. Reads the Excel file (downloads if not present)
  2. Groups unit rows by Site (AEMO Survey ID)
  3. Filters to renewable-relevant technologies (Wind, Solar, BESS, Hydro)
  4. Determines primary technology and hybrid status
  5. Maps to AURES schema and inserts into projects + aemo_generation_info tables
  6. Preserves existing enriched projects (merges, doesn't overwrite)
"""

import os
import sys
import re
import urllib.request
from datetime import datetime, date
from collections import defaultdict

# Add parent to path so we can import db.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection, init_db, DB_PATH

import openpyxl

# ============================================================
# Configuration
# ============================================================

DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), 'downloads')
AEMO_URL = 'https://www.aemo.com.au/-/media/files/electricity/nem/planning_and_forecasting/generation_information/2026/nem-generation-information-jan-2026.xlsx'
MIN_CAPACITY_MW = 30  # Only import sites >= 30 MW

# Map AEMO regions to Australian states
REGION_TO_STATE = {
    'NSW1': 'NSW',
    'QLD1': 'QLD',
    'VIC1': 'VIC',
    'SA1': 'SA',
    'TAS1': 'TAS',
}

# Map AEMO Technology Type to AURES technology
TECH_MAP = {
    'Wind': 'wind',
    'Solar PV': 'solar',
    'Battery Storage': 'bess',
    'Hydro': 'pumped_hydro',
}

# Map AEMO Commitment Status to AURES project status
STATUS_MAP = {
    'In Service': 'operating',
    'In Commissioning': 'commissioning',
    'Committed': 'construction',
    'Committed*': 'construction',
    'Publicly Announced': 'development',
    'Anticipated': 'development',
    'Announced Withdrawal': 'withdrawn',
}

# Status priority (higher = more advanced)
STATUS_PRIORITY = {
    'operating': 5,
    'commissioning': 4,
    'construction': 3,
    'development': 2,
    'withdrawn': 1,
}

# Column indices in the Excel file (0-based, from header row 4)
COL = {
    'survey_id': 0,
    'site_name': 1,
    'kci_id': 2,
    'site_owner': 3,
    'custodian': 4,
    'region': 5,
    'max_site_capacity_ac': 6,
    'gen_info_unit_id': 7,
    'unit_name': 8,
    'tech_type': 9,
    'tech_detail': 10,
    'duid': 12,
    'dispatch_type': 13,
    'unit_count': 14,
    'unit_capacity_dc': 15,
    'unit_capacity_ac': 16,
    'agg_capacity_dc': 17,
    'agg_capacity_ac': 18,
    'agg_storage_mwh': 19,
    'commitment_status': 20,
    'fcud': 21,
    'expected_closure_year': 22,
}

# ============================================================
# Helper functions
# ============================================================

def slugify(name: str) -> str:
    """Convert a project name to a URL-friendly slug."""
    s = name.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '-', s)
    s = s.strip('-')
    return s


def safe_float(val) -> float:
    """Safely convert to float, returning 0.0 on failure."""
    if val is None:
        return 0.0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0


def safe_int(val) -> int:
    """Safely convert to int, returning 0 on failure."""
    if val is None:
        return 0
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


def parse_date(val) -> str:
    """Convert datetime/string to ISO date string."""
    if val is None:
        return ''
    if isinstance(val, datetime):
        return val.strftime('%Y-%m-%d')
    if isinstance(val, date):
        return val.isoformat()
    return str(val).strip()


def determine_primary_tech(techs_with_capacity: dict) -> str:
    """
    Given a dict of {aemo_tech: capacity_mw}, determine AURES technology.
    If multiple renewable techs present, classify as 'hybrid'.
    """
    renewable_techs = {t: c for t, c in techs_with_capacity.items() if t in TECH_MAP}
    if not renewable_techs:
        return None

    mapped = {TECH_MAP[t]: c for t, c in renewable_techs.items()}

    # If multiple distinct AURES techs, it's hybrid
    distinct = set(mapped.keys())
    if len(distinct) > 1:
        # Exception: if one tech is >90% of capacity, use that
        total = sum(mapped.values())
        for tech, cap in mapped.items():
            if total > 0 and cap / total > 0.9:
                return tech
        return 'hybrid'

    return list(distinct)[0]


def determine_status(statuses: set) -> str:
    """Pick the most advanced status from a set of AEMO commitment statuses."""
    mapped = set()
    for s in statuses:
        if s in STATUS_MAP:
            mapped.add(STATUS_MAP[s])
    if not mapped:
        return 'development'
    return max(mapped, key=lambda x: STATUS_PRIORITY.get(x, 0))


# ============================================================
# Main importer
# ============================================================

def download_file(url: str, dest: str) -> str:
    """Download a file if it doesn't already exist."""
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    if os.path.exists(dest):
        print(f"  File already exists: {dest}")
        return dest
    print(f"  Downloading from AEMO...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 AURES-DB/1.0'})
    resp = urllib.request.urlopen(req, timeout=30)
    data = resp.read()
    with open(dest, 'wb') as f:
        f.write(data)
    print(f"  Downloaded {len(data):,} bytes → {dest}")
    return dest


def parse_excel(filepath: str) -> dict:
    """
    Parse the AEMO Generation Information Excel file.
    Returns a dict of site_id -> site_data aggregated from unit rows.
    """
    print(f"  Parsing {os.path.basename(filepath)}...")
    wb = openpyxl.load_workbook(filepath, read_only=True, data_only=True)
    ws = wb['Generator Information']

    sites = {}

    for row in ws.iter_rows(min_row=5, values_only=True):
        survey_id = row[COL['survey_id']]
        if not survey_id:
            continue

        sid = str(survey_id)

        if sid not in sites:
            sites[sid] = {
                'survey_id': sid,
                'name': str(row[COL['site_name']] or '').strip(),
                'kci_id': str(row[COL['kci_id']] or '').strip(),
                'owner': str(row[COL['site_owner']] or '').strip(),
                'custodian': str(row[COL['custodian']] or '').strip(),
                'region': str(row[COL['region']] or '').strip(),
                'max_site_capacity_ac': safe_float(row[COL['max_site_capacity_ac']]),
                'statuses': set(),
                'techs_capacity': defaultdict(float),
                'total_capacity_ac': 0.0,
                'total_capacity_dc': 0.0,
                'total_storage_mwh': 0.0,
                'fcud': None,
                'expected_closure': None,
                'units': [],
                'duids': [],
            }

        site = sites[sid]

        # Accumulate tech capacities
        tech = row[COL['tech_type']]
        cap_ac = safe_float(row[COL['agg_capacity_ac']])
        cap_dc = safe_float(row[COL['agg_capacity_dc']])
        storage = safe_float(row[COL['agg_storage_mwh']])

        if tech:
            site['techs_capacity'][tech] = max(site['techs_capacity'][tech], cap_ac)

        site['total_capacity_ac'] = max(site['total_capacity_ac'], cap_ac + site['total_capacity_ac'] if cap_ac else site['total_capacity_ac'])
        site['total_storage_mwh'] = max(site['total_storage_mwh'], storage)

        # Statuses
        status = row[COL['commitment_status']]
        if status:
            site['statuses'].add(str(status).strip())

        # Full Commercial Use Date
        fcud = row[COL['fcud']]
        if fcud and not site['fcud']:
            site['fcud'] = parse_date(fcud)

        # Expected closure
        closure = row[COL['expected_closure_year']]
        if closure:
            site['expected_closure'] = str(safe_int(closure)) if safe_int(closure) > 0 else None

        # DUIDs
        duid = row[COL['duid']]
        if duid:
            site['duids'].append(str(duid).strip())

        # Unit details for aemo_generation_info table
        site['units'].append({
            'gen_info_unit_id': str(row[COL['gen_info_unit_id']] or ''),
            'unit_name': str(row[COL['unit_name']] or '').strip(),
            'duid': str(duid or '').strip(),
            'tech_type': str(tech or '').strip(),
            'tech_detail': str(row[COL['tech_detail']] or '').strip(),
            'dispatch_type': str(row[COL['dispatch_type']] or '').strip(),
            'unit_count': safe_int(row[COL['unit_count']]),
            'unit_capacity_ac': safe_float(row[COL['unit_capacity_ac']]),
            'unit_capacity_dc': safe_float(row[COL['unit_capacity_dc']]),
            'agg_capacity_ac': cap_ac,
            'agg_capacity_dc': cap_dc,
            'agg_storage_mwh': storage,
            'commitment_status': str(status or '').strip(),
            'fcud': parse_date(fcud) if fcud else '',
        })

    wb.close()

    # Re-compute total capacity per site using max of site capacity field
    # (the unit-level aggregation can double-count)
    for sid, site in sites.items():
        # Use max_site_capacity_ac as the authoritative site capacity
        if site['max_site_capacity_ac'] > 0:
            site['capacity_mw'] = site['max_site_capacity_ac']
        else:
            site['capacity_mw'] = max(site['techs_capacity'].values()) if site['techs_capacity'] else 0

    print(f"  Parsed {len(sites)} sites from {sum(len(s['units']) for s in sites.values())} unit rows")
    return sites


def filter_sites(sites: dict) -> dict:
    """Filter to renewable-relevant sites above minimum capacity."""
    renewable_techs = set(TECH_MAP.keys())
    filtered = {}

    for sid, site in sites.items():
        # Must have at least one renewable tech
        if not (set(site['techs_capacity'].keys()) & renewable_techs):
            continue

        # Must meet minimum capacity
        if site['capacity_mw'] < MIN_CAPACITY_MW:
            continue

        # Must have a valid NEM region
        if site['region'] not in REGION_TO_STATE:
            continue

        filtered[sid] = site

    print(f"  Filtered to {len(filtered)} renewable sites >= {MIN_CAPACITY_MW} MW")
    return filtered


def import_to_database(sites: dict, source_file: str):
    """Import filtered sites into the AURES database."""
    conn = init_db()

    # Start an import run
    cursor = conn.execute(
        "INSERT INTO import_runs (source, source_file) VALUES (?, ?)",
        ('aemo_generation_info', os.path.basename(source_file))
    )
    run_id = cursor.lastrowid

    # Get existing projects to avoid overwriting enriched data
    existing = {}
    for row in conn.execute("SELECT id, aemo_gen_info_id, data_confidence FROM projects"):
        existing[row['id']] = {
            'aemo_gen_info_id': row['aemo_gen_info_id'],
            'data_confidence': row['data_confidence'],
        }

    # Also index by aemo_gen_info_id for matching
    existing_by_aemo = {}
    for pid, info in existing.items():
        if info['aemo_gen_info_id']:
            existing_by_aemo[info['aemo_gen_info_id']] = pid

    new_count = 0
    updated_count = 0
    skipped_count = 0

    aemo_source_url = 'https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information'

    for sid, site in sites.items():
        tech = determine_primary_tech(dict(site['techs_capacity']))
        if not tech:
            continue

        status = determine_status(site['statuses'])
        state = REGION_TO_STATE.get(site['region'], '')
        if not state:
            continue

        slug = slugify(site['name'])
        final_slug = slug  # Will be updated if needed for new projects

        # Check if project already exists (by aemo_gen_info_id or slug)
        existing_pid = existing_by_aemo.get(sid)
        if not existing_pid and slug in existing:
            existing_pid = slug

        if existing_pid:
            # Project exists — check if it's enriched (don't overwrite enriched data)
            existing_info = existing.get(existing_pid, {})
            confidence = existing_info.get('data_confidence', 'unverified')

            if confidence in ('high', 'good', 'medium'):
                # Only update AEMO-specific fields, preserve everything else
                conn.execute("""
                    UPDATE projects SET
                        aemo_gen_info_id = ?,
                        updated_at = datetime('now')
                    WHERE id = ?
                """, (sid, existing_pid))
                skipped_count += 1
            else:
                # Low/unverified — update with AEMO data, but never downgrade status
                existing_status = existing_info.get('status', 'development')
                existing_priority = STATUS_PRIORITY.get(existing_status, 0)
                new_priority = STATUS_PRIORITY.get(status, 0)
                # Keep the more advanced status — AEMO can lag behind reality
                final_status = status if new_priority >= existing_priority else existing_status

                conn.execute("""
                    UPDATE projects SET
                        technology = ?,
                        status = ?,
                        capacity_mw = ?,
                        storage_mwh = ?,
                        state = ?,
                        current_developer = ?,
                        cod_current = ?,
                        aemo_gen_info_id = ?,
                        data_confidence = 'low',
                        last_updated = date('now'),
                        updated_at = datetime('now')
                    WHERE id = ?
                """, (
                    tech, final_status, site['capacity_mw'],
                    site['total_storage_mwh'] if site['total_storage_mwh'] > 0 else None,
                    state, site['owner'],
                    site['fcud'][:7] if site['fcud'] else None,
                    sid,
                    existing_pid,
                ))
                if final_status != status:
                    print(f"    ⚠ {existing_pid}: kept status '{final_status}' (AEMO says '{status}' but that's a downgrade)")
                updated_count += 1
        else:
            # Handle duplicate slugs
            final_slug = slug
            if final_slug in existing or conn.execute("SELECT 1 FROM projects WHERE id = ?", (final_slug,)).fetchone():
                # Add state suffix
                final_slug = f"{slug}-{state.lower()}"
                if conn.execute("SELECT 1 FROM projects WHERE id = ?", (final_slug,)).fetchone():
                    # Add survey ID
                    final_slug = f"{slug}-{sid}"

            # New project — insert with AEMO data
            conn.execute("""
                INSERT INTO projects (
                    id, name, technology, status, capacity_mw, storage_mwh,
                    state, current_developer, cod_current,
                    data_confidence, aemo_gen_info_id,
                    last_updated, last_verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'low', ?, date('now'), date('now'))
            """, (
                final_slug, site['name'], tech, status, site['capacity_mw'],
                site['total_storage_mwh'] if site['total_storage_mwh'] > 0 else None,
                state, site['owner'],
                site['fcud'][:7] if site['fcud'] else None,
                sid,
            ))

            # Add AEMO as a source
            src_cursor = conn.execute(
                "INSERT OR IGNORE INTO source_references (title, url, date, source_tier) VALUES (?, ?, ?, ?)",
                ('AEMO Generation Information Jan 2026', aemo_source_url, '2026-01-30', 1)
            )
            src_id = src_cursor.lastrowid
            if src_id:
                conn.execute(
                    "INSERT OR IGNORE INTO project_sources (project_id, source_id) VALUES (?, ?)",
                    (final_slug, src_id)
                )

            new_count += 1
            existing[final_slug] = {'aemo_gen_info_id': sid, 'data_confidence': 'low'}

        # Resolve the project slug for raw unit data
        project_slug = existing_pid if existing_pid else final_slug

        for unit in site['units']:
            conn.execute("""
                INSERT INTO aemo_generation_info (
                    station_name, duid, region, fuel_type, technology_type,
                    unit_size_mw, registered_capacity_mw, max_capacity_mw,
                    status, classification, dispatch_type, owner,
                    expected_storage_mwh, full_year_commissioning,
                    project_id, source_file
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                site['name'],
                unit['duid'] or None,
                site['region'],
                unit['tech_type'],
                unit['tech_detail'],
                unit['unit_capacity_ac'],
                unit['agg_capacity_ac'],
                unit['agg_capacity_ac'],
                unit['commitment_status'],
                unit['dispatch_type'],
                unit['dispatch_type'],
                site['owner'],
                unit['agg_storage_mwh'] if unit['agg_storage_mwh'] > 0 else None,
                unit['fcud'] or None,
                project_slug if isinstance(project_slug, str) else slug,
                os.path.basename(source_file),
            ))

    # Complete the import run
    total = new_count + updated_count + skipped_count
    conn.execute("""
        UPDATE import_runs SET
            records_imported = ?,
            records_updated = ?,
            records_new = ?,
            completed_at = datetime('now'),
            status = 'completed'
        WHERE id = ?
    """, (total, updated_count, new_count, run_id))

    conn.commit()

    print(f"\n  Import complete:")
    print(f"    New projects:     {new_count}")
    print(f"    Updated projects: {updated_count}")
    print(f"    Skipped (enriched): {skipped_count}")
    print(f"    Total processed:  {total}")

    # Print summary stats
    stats = conn.execute("""
        SELECT technology, status, COUNT(*) as count
        FROM projects
        GROUP BY technology, status
        ORDER BY technology, status
    """).fetchall()

    print(f"\n  Database summary:")
    for row in stats:
        print(f"    {row['technology']:12s} | {row['status']:15s} | {row['count']:4d}")

    total_projects = conn.execute("SELECT COUNT(*) as c FROM projects").fetchone()['c']
    print(f"\n  Total projects in database: {total_projects}")

    conn.close()
    return new_count, updated_count


# ============================================================
# Entry point
# ============================================================

def main():
    print("=" * 60)
    print("AEMO Generation Information Importer")
    print("=" * 60)

    # Download file
    filename = AEMO_URL.split('/')[-1]
    filepath = os.path.join(DOWNLOAD_DIR, filename)
    print(f"\n[1/4] Checking for Excel file...")
    download_file(AEMO_URL, filepath)

    # Parse
    print(f"\n[2/4] Parsing Excel file...")
    sites = parse_excel(filepath)

    # Filter
    print(f"\n[3/4] Filtering to renewable sites...")
    filtered = filter_sites(sites)

    # Import
    print(f"\n[4/4] Importing to database...")
    import_to_database(filtered, filepath)

    print(f"\n{'=' * 60}")
    print("Done!")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()
