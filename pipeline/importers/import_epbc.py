"""
EPBC Referrals Importer
========================
Fetches renewable energy referrals from the DCCEEW EPBC Referrals
ArcGIS REST API and matches them to projects in the AURES database.

For matched projects:
- Stores the EPBC referral data in epbc_referrals table
- Adds planning_submitted / planning_approved timeline events
- Updates development_stage based on EPBC status
- Adds data_sources entries with EPBC referral URLs

Data source: https://gis.environment.gov.au/gispubmap/rest/services/ogc_services/EPBC_Referrals/MapServer
Category: "Energy Generation and Supply (renewable)"
Updated weekly by DCCEEW.

Usage:
    python3 pipeline/importers/import_epbc.py [--dry-run]
"""

import os
import sys
import json
import re
import argparse
import urllib.request
from datetime import datetime
from difflib import SequenceMatcher

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

API_BASE = (
    'https://gis.environment.gov.au/gispubmap/rest/services/'
    'ogc_services/EPBC_Referrals/MapServer/0/query'
)
CATEGORY = "Energy Generation and Supply (renewable)"
BATCH_SIZE = 500

# EPBC stage/decision → our development_stage mapping
# "Completed" with "Not Controlled Action" = approved (no further EPBC needed)
# "Post-Approval" = approved and conditions set
# "Approval" = approved with conditions
# "Assessment" / "Assessment Approach" = submitted, under review
# "Referral Decision" / "Referral Publication" = just submitted

STAGE_MAP_APPROVED = {
    'Post-Approval',
    'Approval',
    'Completed',  # only if decision is NCA or NCA(PM) — means cleared
}

STAGE_MAP_SUBMITTED = {
    'Assessment',
    'Assessment Approach',
    'Referral Decision',
    'Referral Publication',
    'Guidelines Issued',
    'Proposed Decision',
    'Further Information Request',
}

# Decisions that indicate approval / clearance
DECISION_CLEARED = {
    'Not Controlled Action',
    'Not Controlled Action (Particular Manner)',
}


def fetch_epbc_referrals():
    """Fetch all renewable energy referrals from EPBC ArcGIS REST API."""
    all_features = []
    offset = 0

    while True:
        params = (
            f'?where=CATEGORY=%27{CATEGORY.replace(" ", "+").replace("(", "%28").replace(")", "%29")}%27'
            f'&outFields=REFERENCE_NUMBER,NAME,PRIMARY_JURISDICTION,REFERRAL_DECISION,'
            f'STATUS_DESCRIPTION,STAGE_NAME,YEAR,CATEGORY,REFERRAL_URL'
            f'&returnGeometry=false&f=json'
            f'&resultRecordCount={BATCH_SIZE}&resultOffset={offset}'
        )
        url = API_BASE + params
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.loads(resp.read())

        features = data.get('features', [])
        all_features.extend(features)

        if len(features) < BATCH_SIZE:
            break
        offset += BATCH_SIZE

    print(f"  Fetched {len(all_features)} EPBC renewable energy referrals")
    return [f['attributes'] for f in all_features]


def normalize_name(name):
    """Normalize a project name for fuzzy matching."""
    name = name.lower().strip()
    # Remove common suffixes/prefixes that differ between sources
    name = re.sub(r'\s*-\s*kci$', '', name)
    name = re.sub(r'\s*-\s*mmt$', '', name)
    name = re.sub(r'\s*\(.*?\)\s*', ' ', name)  # remove parentheticals
    name = re.sub(r'\b(proposed|construction of|development of|operation of)\b', '', name)
    name = re.sub(r'\b(and associated infrastructure|and supporting infrastructure)\b', '', name)
    name = re.sub(r'\b(project|stage\s*\d+)\b', '', name)
    # Normalize wind/solar/bess terms
    name = re.sub(r'\bwf\b', 'wind farm', name)
    name = re.sub(r'\bsf\b', 'solar farm', name)
    name = re.sub(r'\bbess\b', 'battery energy storage system', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name


def extract_core_name(name):
    """Extract just the location/project name part, stripping technology suffixes."""
    name = name.lower().strip()
    name = re.sub(r'\s*-\s*kci$', '', name)
    name = re.sub(r'\s*-\s*mmt$', '', name)
    name = re.sub(r'\s*\(.*?\)\s*', ' ', name)
    # Strip technology type suffixes
    name = re.sub(r'\b(wind farm|windfarm|solar farm|solar energy|solar|bess|'
                  r'battery energy storage system|battery energy storage|'
                  r'pumped hydro energy storage|pumped hydro|'
                  r'energy storage system|energy storage|energy hub|energy park|'
                  r'renewable energy hub|renewable energy|off shore|offshore|'
                  r'wind|battery|hybrid)\b', '', name)
    name = re.sub(r'\b(proposed|construction of|development of|operation of)\b', '', name)
    name = re.sub(r'\b(and associated infrastructure|and supporting infrastructure)\b', '', name)
    name = re.sub(r'\b(project|stage\s*\d+)\b', '', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name


def match_referrals_to_projects(referrals, conn):
    """Match EPBC referrals to projects using fuzzy name matching + state."""
    projects = conn.execute("""
        SELECT id, name, technology, state, status, development_stage
        FROM projects
    """).fetchall()

    # Build lookup structures
    proj_by_normalized = {}
    proj_by_core = {}
    for p in projects:
        p = dict(p)
        norm = normalize_name(p['name'])
        core = extract_core_name(p['name'])
        state = p['state']

        key = (norm, state)
        proj_by_normalized[key] = p

        if core:
            core_key = (core, state)
            if core_key not in proj_by_core:
                proj_by_core[core_key] = []
            proj_by_core[core_key].append(p)

    # Map EPBC jurisdiction to our state codes
    jurisdiction_map = {
        'NSW': 'NSW', 'VIC': 'VIC', 'QLD': 'QLD',
        'SA': 'SA', 'WA': 'WA', 'TAS': 'TAS',
        'NT': 'NT', 'ACT': 'ACT',
        'CM': None,  # Commonwealth waters — match by name only
    }

    matches = []
    unmatched = []

    for ref in referrals:
        ref_name = ref['NAME']
        ref_state = jurisdiction_map.get(ref['PRIMARY_JURISDICTION'])
        ref_norm = normalize_name(ref_name)
        ref_core = extract_core_name(ref_name)

        best_match = None
        best_score = 0

        # Strategy 1: Exact normalized match with state
        if ref_state:
            key = (ref_norm, ref_state)
            if key in proj_by_normalized:
                best_match = proj_by_normalized[key]
                best_score = 1.0

        # Strategy 2: Core name match with state
        if not best_match and ref_core and ref_state:
            core_key = (ref_core, ref_state)
            if core_key in proj_by_core:
                candidates = proj_by_core[core_key]
                if len(candidates) == 1:
                    best_match = candidates[0]
                    best_score = 0.95

        # Strategy 3: Fuzzy match against all projects (same state or CM)
        if not best_match:
            for p in projects:
                p = dict(p)
                # State must match (or EPBC is Commonwealth)
                if ref_state and p['state'] != ref_state:
                    continue

                p_norm = normalize_name(p['name'])
                p_core = extract_core_name(p['name'])

                # Try full normalized match
                score = SequenceMatcher(None, ref_norm, p_norm).ratio()

                # Also try core-to-core
                if ref_core and p_core:
                    core_score = SequenceMatcher(None, ref_core, p_core).ratio()
                    score = max(score, core_score)

                # Conservative matching — prefer precision over recall
                # User instruction: "if we aren't sure better off not matching"
                min_threshold = 0.90
                if len(ref_core) <= 5 or len(p_core) <= 5:
                    min_threshold = 0.95  # short names need near-exact match

                # Extra check: first significant word of core name must match
                ref_words = ref_core.split()
                p_words = p_core.split()
                if ref_words and p_words:
                    first_word_match = SequenceMatcher(None, ref_words[0], p_words[0]).ratio()
                    if first_word_match < 0.75:
                        continue  # first words too different — skip

                if score > best_score and score >= min_threshold:
                    best_score = score
                    best_match = p

        if best_match:
            matches.append({
                'referral': ref,
                'project': best_match,
                'score': best_score,
            })
        else:
            unmatched.append(ref)

    return matches, unmatched


def classify_epbc_stage(referral):
    """Determine EPBC planning stage from referral status."""
    stage = referral.get('STAGE_NAME', '')
    decision = referral.get('REFERRAL_DECISION') or ''

    # Completed + cleared = EPBC approved (no further EPBC needed)
    if stage == 'Completed' and decision in DECISION_CLEARED:
        return 'epbc_approved'

    # Completed + "Controlled Action" = was controlled, now completed = approved
    if stage == 'Completed' and decision == 'Controlled Action':
        return 'epbc_approved'

    # Active post-approval or approval stage
    if stage in ('Post-Approval', 'Approval'):
        return 'epbc_approved'

    # Under assessment = EPBC submitted
    if stage in STAGE_MAP_SUBMITTED:
        return 'epbc_submitted'

    # Completed with no decision (withdrawn/lapsed) — at least was submitted
    if stage == 'Completed':
        return 'epbc_submitted'

    return 'epbc_submitted'  # default: was referred = was submitted


def build_referral_url(ref_number):
    """Build a proper EPBC referral URL."""
    return f"https://epbcpublicportal.environment.gov.au/all-referrals/#!/referral/{ref_number.replace('/', '-')}"


def import_epbc(conn, dry_run=False):
    """Main import: fetch, match, and update."""
    print("=" * 60)
    print("EPBC Referrals Import")
    print("=" * 60)

    # Step 1: Fetch
    print("\n1. Fetching from EPBC API...")
    referrals = fetch_epbc_referrals()

    # Step 2: Match
    print("\n2. Matching to AURES projects...")
    matches, unmatched = match_referrals_to_projects(referrals, conn)

    print(f"  Matched: {len(matches)}")
    print(f"  Unmatched: {len(unmatched)}")

    # Show matches
    print("\n  Matched referrals:")
    approved_count = 0
    submitted_count = 0
    upgraded = 0

    for m in sorted(matches, key=lambda x: -x['score']):
        ref = m['referral']
        proj = m['project']
        epbc_stage = classify_epbc_stage(ref)
        score_pct = int(m['score'] * 100)

        if epbc_stage == 'epbc_approved':
            approved_count += 1
        else:
            submitted_count += 1

        # Check if this is an upgrade
        current_stage = proj.get('development_stage', '')
        is_upgrade = (
            epbc_stage == 'epbc_approved' and current_stage not in ('epbc_approved',)
        ) or (
            epbc_stage == 'epbc_submitted' and current_stage not in ('epbc_approved', 'epbc_submitted')
        )
        if is_upgrade:
            upgraded += 1

        marker = " *** UPGRADE" if is_upgrade else ""
        print(f"    [{score_pct}%] {ref['REFERENCE_NUMBER']} \"{ref['NAME'][:45]}\" → {proj['name'][:40]} | {epbc_stage}{marker}")

    print(f"\n  EPBC classification: {approved_count} approved, {submitted_count} submitted")
    print(f"  Stage upgrades: {upgraded}")

    # Show unmatched (for reference)
    if unmatched:
        print(f"\n  Unmatched EPBC referrals ({len(unmatched)}):")
        for ref in unmatched[:20]:
            print(f"    {ref['REFERENCE_NUMBER']} {ref['PRIMARY_JURISDICTION']} \"{ref['NAME'][:60]}\" [{ref['STAGE_NAME']}]")
        if len(unmatched) > 20:
            print(f"    ... and {len(unmatched) - 20} more")

    if dry_run:
        print("\n*** DRY RUN — no changes made ***")
        return matches, unmatched

    # Step 3: Create epbc_referrals table if needed
    conn.execute("""
        CREATE TABLE IF NOT EXISTS epbc_referrals (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            reference_number    TEXT NOT NULL UNIQUE,
            name                TEXT NOT NULL,
            jurisdiction        TEXT,
            referral_decision   TEXT,
            status_description  TEXT,
            stage_name          TEXT,
            year                INTEGER,
            category            TEXT,
            referral_url        TEXT,
            project_id          TEXT,
            match_score         REAL,
            imported_at         TEXT
        )
    """)

    # Step 4: Insert referrals and update projects
    print("\n3. Writing to database...")
    for m in matches:
        ref = m['referral']
        proj = m['project']
        epbc_stage = classify_epbc_stage(ref)
        ref_url = build_referral_url(ref['REFERENCE_NUMBER'])

        # Upsert EPBC referral
        conn.execute("""
            INSERT INTO epbc_referrals (reference_number, name, jurisdiction, referral_decision,
                status_description, stage_name, year, category, referral_url, project_id, match_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(reference_number) DO UPDATE SET
                project_id = excluded.project_id,
                match_score = excluded.match_score,
                stage_name = excluded.stage_name,
                referral_decision = excluded.referral_decision,
                status_description = excluded.status_description
        """, (
            ref['REFERENCE_NUMBER'], ref['NAME'], ref['PRIMARY_JURISDICTION'],
            ref.get('REFERRAL_DECISION'), ref.get('STATUS_DESCRIPTION'),
            ref['STAGE_NAME'], int(ref.get('YEAR') or 0),
            ref.get('CATEGORY'), ref_url, proj['id'], m['score'],
        ))

        # Add timeline event if not already present
        existing_event = conn.execute("""
            SELECT id FROM timeline_events
            WHERE project_id = ? AND event_type IN ('planning_submitted', 'planning_approved')
            AND data_source = 'epbc'
        """, (proj['id'],)).fetchone()

        if not existing_event:
            event_type = 'planning_approved' if epbc_stage == 'planning_approved' else 'planning_submitted'
            year = int(ref.get('YEAR') or 0)
            date_str = f"{year}" if year else datetime.now().strftime('%Y')

            conn.execute("""
                INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail, data_source)
                VALUES (?, ?, 'year', ?, ?, ?, 'epbc')
            """, (
                proj['id'], date_str, event_type,
                f"EPBC Referral {ref['REFERENCE_NUMBER']}",
                f"{ref['NAME']} — {ref.get('REFERRAL_DECISION') or ref['STAGE_NAME']}"
            ))

        # Add source reference link
        existing_source = conn.execute("""
            SELECT sr.id FROM source_references sr
            JOIN project_sources ps ON ps.source_id = sr.id
            WHERE ps.project_id = ? AND sr.url LIKE '%epbc%'
        """, (proj['id'],)).fetchone()

        if not existing_source:
            cursor = conn.execute("""
                INSERT INTO source_references (title, url, date, source_tier)
                VALUES (?, ?, date('now'), 1)
            """, (f"EPBC Referral {ref['REFERENCE_NUMBER']}", ref_url))
            source_id = cursor.lastrowid
            conn.execute("""
                INSERT OR IGNORE INTO project_sources (project_id, source_id)
                VALUES (?, ?)
            """, (proj['id'], source_id))

        # Update development_stage if this is an upgrade
        current_stage = proj.get('development_stage', '')
        stage_priority = {'early_stage': 0, 'planning_submitted': 1, 'epbc_submitted': 2, 'epbc_approved': 3}
        current_priority = stage_priority.get(current_stage or 'early_stage', 0)
        new_priority = stage_priority.get(epbc_stage, 0)
        if new_priority > current_priority:
            conn.execute(
                "UPDATE projects SET development_stage = ? WHERE id = ?",
                (epbc_stage, proj['id'])
            )

    # Also store unmatched referrals for future matching
    for ref in unmatched:
        ref_url = build_referral_url(ref['REFERENCE_NUMBER'])
        conn.execute("""
            INSERT INTO epbc_referrals (reference_number, name, jurisdiction, referral_decision,
                status_description, stage_name, year, category, referral_url, project_id, match_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
            ON CONFLICT(reference_number) DO NOTHING
        """, (
            ref['REFERENCE_NUMBER'], ref['NAME'], ref['PRIMARY_JURISDICTION'],
            ref.get('REFERRAL_DECISION'), ref.get('STATUS_DESCRIPTION'),
            ref['STAGE_NAME'], int(ref.get('YEAR') or 0),
            ref.get('CATEGORY'), ref_url,
        ))

    conn.commit()
    print(f"\n  Stored {len(matches)} matched + {len(unmatched)} unmatched referrals")
    print(f"  Upgraded {upgraded} projects to planning_approved")
    print("  ✓ All changes committed")

    return matches, unmatched


def main():
    parser = argparse.ArgumentParser(description='Import EPBC referrals')
    parser.add_argument('--dry-run', action='store_true', help='Show matches without writing')
    args = parser.parse_args()

    conn = get_connection()
    import_epbc(conn, dry_run=args.dry_run)
    conn.close()


if __name__ == '__main__':
    main()
