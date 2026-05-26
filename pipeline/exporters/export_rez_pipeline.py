"""
Export the REZ Pipeline JSON for the v3.13.0 REZ/Networks intelligence
surface.

Joins three data layers that landed in v3.12.0 and normalises a noisy
set of REZ names into a single canonical key per zone:

  1. projects.rez                  — per-project REZ assignment (61 rows
                                     post-IASR backfill)
  2. aemo_iasr_projects            — AEMO 2025 Inputs & Assumptions
                                     Workbook (146 Committed/Anticipated
                                     entries with REZ Location + REZ ID)
  3. energyco_rez_access           — NSW EnergyCo Access Rights Register
                                     (19 access rights / 10.71 GW —
                                     Central-West Orana + South West)

Output:  frontend/public/data/analytics/intelligence/rez-pipeline.json

Output shape:
{
  "generated_at": "...",
  "totals": { iasr_committed_mw, iasr_anticipated_mw, access_rights_mw,
              project_counts: {...} },
  "rezs": [{
     canonical_id: "central-west-orana",
     display_name: "Central-West Orana",
     state: "NSW", aemo_rez_id: "N3",
     iasr_committed_mw, iasr_anticipated_mw, iasr_total_mw,
     iasr_committed_count, iasr_anticipated_count,
     access_rights_mw, access_rights_count, access_scheme,
     projects: [{ id, name, technology, capacity_mw, status, ... }],
     iasr_unmatched: [{ iasr_id, power_station, capacity_mw, status }]
  }, ...],
  "unmatched_iasr": [...]   // IASR rows that have no project match
                            // AND no rez_location (can't be grouped)
}
"""
import json
import os
import re
import sys
from collections import defaultdict
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'data')
INTEL_DIR = os.path.join(DATA_DIR, 'analytics', 'intelligence')
OUT_PATH = os.path.join(INTEL_DIR, 'rez-pipeline.json')


# ============================================================
# REZ name canonicalisation
# ============================================================
# Maps the *messy* set of REZ names that appear across IASR (e.g.
# 'Central-West Orana', 'Central -West Orana'), projects.rez (e.g.
# 'nsw-central-west-orana'), and EnergyCo schemes (CWO/SW) into a
# single canonical_id + display_name + state.
#
# Each entry: canonical_id -> (display_name, state, aliases tuple)
REZ_CANONICAL = {
    # IDs follow the same `<state>-<rez>` convention as REZ_ZONES.id in
    # frontend/src/data/rez-zones.ts so `/rez/:id` links resolve naturally.
    # NSW
    'nsw-central-west-orana': ('Central-West Orana', 'NSW',
        ('central-west orana', 'central -west orana', 'nsw-central-west-orana',
         'central west orana')),
    'nsw-new-england':        ('New England',        'NSW',
        ('new england', 'nsw-new-england', 'nsw new england')),
    'nsw-south-west':         ('South West NSW',     'NSW',
        ('south west nsw', 'nsw-south-west', 'south west', 'sw nsw')),
    'nsw-hunter-central-coast': ('Hunter-Central Coast', 'NSW',
        ('hunter central coast', 'hunter-central coast', 'nsw-hunter-central-coast')),
    'nsw-wagga-wagga':        ('Wagga Wagga',        'NSW',
        ('wagga wagga', 'nsw-wagga-wagga')),
    'nsw-tumut':              ('Tumut',              'NSW',
        ('tumut', 'nsw-tumut')),
    'nsw-broken-hill':        ('Broken Hill',        'NSW',
        ('broken hill', 'nsw-broken-hill')),
    # VIC
    'vic-south-west':         ('South West VIC',     'VIC',
        ('south west vic', 'south-west vic', 'sw vic')),
    'vic-central-north':      ('Central North VIC',  'VIC',
        ('central north vic',)),
    'vic-north-west':         ('North West VIC',     'VIC',
        ('north west vic',)),
    'vic-gippsland-onshore':  ('Gippsland Onshore',  'VIC',
        ('gippsland onshore',)),
    # QLD
    'qld-darling-downs':      ('Darling Downs',      'QLD',
        ('darling downs', 'qld-darling-downs')),
    'qld-isaac':              ('Isaac',              'QLD',
        ('isaac', 'issac', 'qld-isaac')),                   # 'Issac' typo in IASR
    'qld-fitzroy':            ('Fitzroy',            'QLD',
        ('fitzroy', 'qld-fitzroy')),
    'qld-wide-bay':           ('Wide Bay',           'QLD',
        ('wide bay', 'qld-wide-bay')),
    'qld-northern':           ('Northern QLD',       'QLD',
        ('northern qld', 'northern queensland', 'qld-northern',
         'far north qld', 'far-north-qld')),                 # Far North merged
    'qld-southern-downs':     ('Southern Downs',     'QLD',
        ('southern downs',)),
    'qld-western-downs':      ('Western Downs',      'QLD',
        ('western downs',)),
    # SA
    'sa-mid-north':           ('Mid-North SA',       'SA',
        ('mid-north sa', 'mid north sa', 'sa-mid-north')),
    'sa-south-east':          ('South East SA',      'SA',
        ('south east sa', 'sa-south-east')),
    # TAS
    'tas-central-highlands':  ('Central Highlands',  'TAS',
        ('central highlands', 'tas-central-highlands')),
}


def canonicalise_rez(raw):
    """Normalise any REZ name variant to the canonical_id. Returns None
    if the raw value doesn't match any known REZ."""
    if raw is None:
        return None
    norm = re.sub(r'\s+', ' ', str(raw).strip().lower())
    norm = norm.replace('_', '-')
    for canonical_id, (_, _, aliases) in REZ_CANONICAL.items():
        if norm == canonical_id or norm in [a.lower() for a in aliases]:
            return canonical_id
    return None


# Maps an EnergyCo scheme code to its canonical REZ id.
ENERGYCO_SCHEME_TO_REZ = {
    'CWO': 'nsw-central-west-orana',
    'SW':  'nsw-south-west',
}


def fetch_rez_pipeline(conn):
    """Build the per-REZ aggregates."""

    # 1) IASR projects grouped by canonical REZ
    iasr_rows = conn.execute("""
        SELECT iasr_id, project_id, power_station, technology_type,
               region, rez_location, rez_id, status, max_capacity_mw,
               storage_mwh
          FROM aemo_iasr_projects
    """).fetchall()

    # 2) EnergyCo access rights
    access_rows = conn.execute("""
        SELECT access_right_id, project_id, rez_scheme, project_name_raw,
               max_capacity_mw, primary_technology, registration_date,
               access_status, allocation_process
          FROM energyco_rez_access
    """).fetchall()

    # 3) Projects with a REZ assignment
    project_rows = conn.execute("""
        SELECT id, name, technology, status, capacity_mw, storage_mwh,
               state, rez, current_developer, cod_current,
               connection_status, development_stage
          FROM projects
         WHERE rez IS NOT NULL AND rez != ''
    """).fetchall()

    # Bucket everything by canonical REZ id
    rez_buckets = defaultdict(lambda: {
        'canonical_id':           None,
        'display_name':           None,
        'state':                  None,
        'aemo_rez_id':            None,
        'iasr_committed_mw':      0,
        'iasr_anticipated_mw':    0,
        'iasr_committed_count':   0,
        'iasr_anticipated_count': 0,
        'access_rights_mw':       0,
        'access_rights_count':    0,
        'access_scheme':          None,
        'projects':               [],
        'projects_seen':          set(),       # de-dupe across IASR + projects.rez paths
        'iasr_unmatched':         [],
        'access_rights_detail':   [],
    })

    # Bucket IASR rows
    iasr_no_rez_match = []
    for row in iasr_rows:
        canonical_id = canonicalise_rez(row['rez_location'])
        if canonical_id is None:
            # No REZ assignment in IASR row — can't group; surface separately
            if not row['project_id']:
                iasr_no_rez_match.append({
                    'iasr_id':         row['iasr_id'],
                    'power_station':   row['power_station'],
                    'technology':      row['technology_type'],
                    'region':          row['region'],
                    'rez_location':    row['rez_location'],
                    'status':          row['status'],
                    'capacity_mw':     row['max_capacity_mw'],
                    'storage_mwh':     row['storage_mwh'],
                })
            continue

        bucket = rez_buckets[canonical_id]
        display_name, state, _ = REZ_CANONICAL[canonical_id]
        bucket['canonical_id'] = canonical_id
        bucket['display_name'] = display_name
        bucket['state']        = state
        if row['rez_id'] and not bucket['aemo_rez_id']:
            bucket['aemo_rez_id'] = row['rez_id']

        mw = row['max_capacity_mw'] or 0
        if row['status'] == 'Committed':
            bucket['iasr_committed_mw']    += mw
            bucket['iasr_committed_count'] += 1
        elif row['status'] == 'Anticipated':
            bucket['iasr_anticipated_mw']    += mw
            bucket['iasr_anticipated_count'] += 1

        if row['project_id']:
            bucket['projects_seen'].add(row['project_id'])
        else:
            bucket['iasr_unmatched'].append({
                'iasr_id':         row['iasr_id'],
                'power_station':   row['power_station'],
                'technology':      row['technology_type'],
                'status':          row['status'],
                'capacity_mw':     mw,
                'storage_mwh':     row['storage_mwh'],
            })

    # Bucket EnergyCo access rights
    for row in access_rows:
        scheme = row['rez_scheme']
        canonical_id = ENERGYCO_SCHEME_TO_REZ.get(scheme)
        if not canonical_id:
            continue
        bucket = rez_buckets[canonical_id]
        # Ensure metadata is set even if IASR didn't populate this REZ
        if not bucket['display_name']:
            display_name, state, _ = REZ_CANONICAL[canonical_id]
            bucket['canonical_id'] = canonical_id
            bucket['display_name'] = display_name
            bucket['state']        = state
        bucket['access_rights_mw']    += row['max_capacity_mw'] or 0
        bucket['access_rights_count'] += 1
        bucket['access_scheme']        = (
            'Central-West Orana Access Scheme' if scheme == 'CWO'
            else 'South West REZ Access Scheme'
        )
        bucket['access_rights_detail'].append({
            'access_right_id':    row['access_right_id'],
            'project_id':         row['project_id'],
            'project_name':       row['project_name_raw'],
            'capacity_mw':        row['max_capacity_mw'],
            'technology':         row['primary_technology'],
            'registration_date':  row['registration_date'],
            'access_status':      row['access_status'],
            'allocation_process': row['allocation_process'],
        })
        if row['project_id']:
            bucket['projects_seen'].add(row['project_id'])

    # Bucket project rows (via projects.rez)
    project_lookup = {p['id']: dict(p) for p in project_rows}
    for row in project_rows:
        canonical_id = canonicalise_rez(row['rez'])
        if canonical_id is None:
            continue
        bucket = rez_buckets[canonical_id]
        if not bucket['display_name']:
            display_name, state, _ = REZ_CANONICAL[canonical_id]
            bucket['canonical_id'] = canonical_id
            bucket['display_name'] = display_name
            bucket['state']        = state
        bucket['projects_seen'].add(row['id'])

    # Now flesh out projects lists from projects_seen
    for canonical_id, bucket in rez_buckets.items():
        project_dicts = []
        for pid in bucket['projects_seen']:
            p = project_lookup.get(pid)
            if not p:
                # Project mentioned by IASR/access-rights but doesn't have
                # a rez set in projects (or is in another REZ in the DB)
                # — fetch it
                pr = conn.execute("""
                    SELECT id, name, technology, status, capacity_mw,
                           storage_mwh, state, current_developer, cod_current,
                           connection_status, development_stage
                      FROM projects
                     WHERE id = ?
                """, (pid,)).fetchone()
                if pr:
                    p = dict(pr)
            if p:
                project_dicts.append({
                    'id':                p['id'],
                    'name':              p['name'],
                    'technology':        p['technology'],
                    'status':            p['status'],
                    'capacity_mw':       p['capacity_mw'],
                    'storage_mwh':       p['storage_mwh'],
                    'state':             p['state'],
                    'current_developer': p['current_developer'],
                    'cod_current':       p['cod_current'],
                    'connection_status': p['connection_status'],
                    'development_stage': p['development_stage'],
                })
        # Order by capacity desc
        project_dicts.sort(key=lambda x: x['capacity_mw'] or 0, reverse=True)
        bucket['projects'] = project_dicts
        bucket['project_count'] = len(project_dicts)
        bucket['iasr_total_mw'] = (
            bucket['iasr_committed_mw'] + bucket['iasr_anticipated_mw']
        )
        # Strip the dedupe set before serialising
        del bucket['projects_seen']

    rezs = sorted(
        rez_buckets.values(),
        key=lambda b: b['iasr_total_mw'] or 0,
        reverse=True,
    )

    # Header totals
    totals = {
        'iasr_committed_mw':      sum(b['iasr_committed_mw']    for b in rezs),
        'iasr_anticipated_mw':    sum(b['iasr_anticipated_mw']  for b in rezs),
        'iasr_committed_count':   sum(b['iasr_committed_count'] for b in rezs),
        'iasr_anticipated_count': sum(b['iasr_anticipated_count'] for b in rezs),
        'access_rights_mw':       sum(b['access_rights_mw']     for b in rezs),
        'access_rights_count':    sum(b['access_rights_count']  for b in rezs),
        'rez_count':              len(rezs),
        'project_count':          sum(b['project_count']        for b in rezs),
        'iasr_unmatched_total':   len(iasr_no_rez_match) + sum(
            len(b['iasr_unmatched']) for b in rezs
        ),
    }

    return {
        'generated_at':   datetime.utcnow().isoformat() + 'Z',
        'totals':         totals,
        'rezs':           rezs,
        'unmatched_iasr': iasr_no_rez_match,
        'methodology':    {
            'sources': [
                'projects.rez (DB, post v3.12.0 IASR backfill)',
                'aemo_iasr_projects (AEMO 2025 IASR Workbook v3.12.0)',
                'energyco_rez_access (EnergyCo NSW Access Rights Register v3.12.0)',
            ],
            'canonicalisation_notes': (
                'REZ names vary across sources (e.g. "Central-West Orana", '
                '"Central -West Orana", "nsw-central-west-orana"). The '
                'exporter normalises via REZ_CANONICAL in '
                'pipeline/exporters/export_rez_pipeline.py. New variants '
                'must be added there. The "Issac" typo in IASR is mapped '
                'to "isaac".'
            ),
        },
    }


def main():
    print("Exporting REZ Pipeline data")
    print("=" * 60)
    os.makedirs(INTEL_DIR, exist_ok=True)
    conn = get_connection()
    data = fetch_rez_pipeline(conn)
    with open(OUT_PATH, 'w') as f:
        json.dump(data, f, indent=2, default=str)
    conn.close()
    t = data['totals']
    print(f"  REZs:                   {t['rez_count']}")
    print(f"  IASR Committed:         {t['iasr_committed_mw']:>7.0f} MW ({t['iasr_committed_count']} projects)")
    print(f"  IASR Anticipated:       {t['iasr_anticipated_mw']:>7.0f} MW ({t['iasr_anticipated_count']} projects)")
    print(f"  EnergyCo Access:        {t['access_rights_mw']:>7.0f} MW ({t['access_rights_count']} rights)")
    print(f"  Total projects in REZs: {t['project_count']}")
    print(f"  Unmatched IASR:         {t['iasr_unmatched_total']}")
    print(f"\n  Top 8 REZs by pipeline:")
    for r in data['rezs'][:8]:
        print(f"    {r['display_name']:24s} | {r['state']:3s} | "
              f"committed {r['iasr_committed_mw']:>7.0f} MW · "
              f"anticipated {r['iasr_anticipated_mw']:>7.0f} MW · "
              f"access {r['access_rights_mw']:>7.0f} MW")
    print(f"\n  Wrote: {OUT_PATH}")
    print("=" * 60)


if __name__ == '__main__':
    main()
