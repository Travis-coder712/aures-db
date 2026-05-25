"""
Export the Regional Pipeline JSON for the Mansfield-area intelligence page.

Filters all NEM projects to within 100km haversine of Mansfield, VIC
(-37.0556 S, 146.0823 E), joins their per-DUID AEMO Generator Information
status to derive a normalized 7-tier pipeline_tier, and writes:

  frontend/public/data/analytics/intelligence/mansfield-pipeline.json

This is the v3.10.0 proof-of-concept that the broader "Under Construction"
NEM-wide map will eventually be built on top of. The CENTER / RADIUS_KM
constants are the only knobs that need to change to repurpose this script
for another region.

Pipeline tier derivation (highest-applicable wins):
  - operating            : projects.status='operating' OR AEMO 'In Service'
  - construction         : projects.status IN ('construction','commissioning')
                           OR AEMO 'In Commissioning'
  - connection_approved  : AEMO 'Committed' — meets >=5 of 6 commitment criteria
                           (land, planning, finance, EPC, NER 5.3.4, GPS)
  - connection_submitted : AEMO 'Anticipated'
  - planning_approved    : development_stage='epbc_approved'
  - planning_submitted   : development_stage IN ('epbc_submitted','planning_submitted')
  - early_stage          : everything else (early_stage / null)
"""
import json
import math
import os
import sys
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')
INTEL_DIR = os.path.join(DATA_DIR, 'analytics', 'intelligence')
OUT_PATH = os.path.join(INTEL_DIR, 'mansfield-pipeline.json')

# Mansfield, VIC — town centroid.
CENTER_LAT = -37.0556
CENTER_LNG = 146.0823
RADIUS_KM = 100

# AEMO commitment-status progression (most-progressed at top).
# Used to pick the project's most-advanced status across all its DUIDs.
AEMO_STATUS_PRIORITY = [
    'In Service',
    'In Commissioning',
    'Committed',
    'Anticipated',
    'Publicly Announced',
    'Withdrawn',
]


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)


def haversine_km(lat1, lng1, lat2, lng2):
    """Great-circle distance in kilometres between two lat/lng pairs."""
    R = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def aggregate_aemo_status(rows):
    """Pick the most-progressed AEMO status across all DUIDs for a project."""
    if not rows:
        return None
    statuses = {r['status'] for r in rows if r['status']}
    for priority in AEMO_STATUS_PRIORITY:
        if priority in statuses:
            return priority
    # Fallback: return whatever we have if nothing matched the priority list
    return next(iter(statuses)) if statuses else None


def derive_pipeline_tier(project_status, aemo_status, development_stage):
    """Pick the highest-applicable tier per the 7-tier ladder.

    Order is intentional — first match wins, so the project surfaces under
    its most-advanced stage. Operating > Construction > Connection_Approved >
    Connection_Submitted > Planning_Approved > Planning_Submitted > Early_Stage.
    """
    ps = (project_status or '').lower()
    ds = (development_stage or '').lower()

    if ps == 'operating' or aemo_status == 'In Service':
        return 'operating'
    if ps in ('construction', 'commissioning') or aemo_status == 'In Commissioning':
        return 'construction'
    if aemo_status == 'Committed':
        return 'connection_approved'
    if aemo_status == 'Anticipated':
        return 'connection_submitted'
    if ds == 'epbc_approved':
        return 'planning_approved'
    if ds in ('epbc_submitted', 'planning_submitted'):
        return 'planning_submitted'
    return 'early_stage'


def fetch_scheme_summary(conn, project_id):
    """Return a short list of scheme contracts for the project, if any."""
    rows = conn.execute(
        """
        SELECT scheme, round, capacity_mw
        FROM scheme_contracts
        WHERE project_id = ?
        ORDER BY capacity_mw DESC NULLS LAST
        """,
        (project_id,),
    ).fetchall()
    return [
        {
            'scheme': r['scheme'],
            'round': r['round'],
            'capacity_mw': r['capacity_mw'],
        }
        for r in rows
    ]


def export(conn):
    # Pull the per-DUID AEMO status grouped by project_id.
    aemo_by_project = defaultdict(list)
    for r in conn.execute(
        """
        SELECT project_id, duid, status, registered_capacity_mw, fuel_type
        FROM aemo_generation_info
        WHERE project_id IS NOT NULL
        """
    ).fetchall():
        aemo_by_project[r['project_id']].append(dict(r))

    # Pull all projects with coords. Filter to within RADIUS_KM by haversine.
    projects = []
    for r in conn.execute(
        """
        SELECT id, name, technology, capacity_mw, storage_mwh, state, latitude,
               longitude, status, development_stage, current_developer,
               current_operator, cod_current, rez, connection_status,
               connection_nsp
        FROM projects
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        """
    ).fetchall():
        distance = haversine_km(CENTER_LAT, CENTER_LNG, r['latitude'], r['longitude'])
        if distance > RADIUS_KM:
            continue

        aemo_status = aggregate_aemo_status(aemo_by_project.get(r['id'], []))
        tier = derive_pipeline_tier(r['status'], aemo_status, r['development_stage'])
        schemes = fetch_scheme_summary(conn, r['id'])

        projects.append({
            'id': r['id'],
            'name': r['name'],
            'technology': r['technology'],
            'capacity_mw': r['capacity_mw'],
            'storage_mwh': r['storage_mwh'],
            'state': r['state'],
            'lat': r['latitude'],
            'lng': r['longitude'],
            'distance_km': round(distance, 1),
            'pipeline_tier': tier,
            'status': r['status'],
            'aemo_status': aemo_status,
            'development_stage': r['development_stage'],
            'current_developer': r['current_developer'],
            'current_operator': r['current_operator'],
            'cod_current': r['cod_current'],
            'rez': r['rez'],
            'connection_status': r['connection_status'],
            'connection_nsp': r['connection_nsp'],
            'scheme_contracts': schemes,
        })

    # Sort: most-progressed first (so the legend reads operating -> early stage),
    # then by capacity within tier.
    tier_order = {
        'operating': 0,
        'construction': 1,
        'connection_approved': 2,
        'connection_submitted': 3,
        'planning_approved': 4,
        'planning_submitted': 5,
        'early_stage': 6,
    }
    projects.sort(key=lambda p: (tier_order.get(p['pipeline_tier'], 7), -(p['capacity_mw'] or 0)))

    out = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'center': {'lat': CENTER_LAT, 'lng': CENTER_LNG, 'label': 'Mansfield, VIC'},
        'radius_km': RADIUS_KM,
        'project_count': len(projects),
        'total_mw': round(sum(p['capacity_mw'] or 0 for p in projects), 1),
        'projects': projects,
    }
    return out


def main():
    ensure_dir(INTEL_DIR)
    conn = get_connection()
    try:
        out = export(conn)
    finally:
        conn.close()

    with open(OUT_PATH, 'w') as f:
        json.dump(out, f, indent=2, default=str)

    by_tier = defaultdict(int)
    by_tier_mw = defaultdict(float)
    for p in out['projects']:
        by_tier[p['pipeline_tier']] += 1
        by_tier_mw[p['pipeline_tier']] += (p['capacity_mw'] or 0)

    print(f"Wrote {OUT_PATH}")
    print(f"  {out['project_count']} projects within {RADIUS_KM}km of Mansfield · {out['total_mw']:.0f} MW total")
    for tier, count in sorted(by_tier.items(), key=lambda x: (-x[1], x[0])):
        print(f"    {tier:<22} {count:>3} projects · {by_tier_mw[tier]:>7.0f} MW")


if __name__ == '__main__':
    main()
