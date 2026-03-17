#!/usr/bin/env python3
"""v182 — Zombie flag detection, notable descriptions, and coordinates enrichment.

Sections:
  A. ZOMBIE PROJECT DETECTION — flag stale/minimal development projects
  B. NOTABLE DESCRIPTIONS — add descriptions for construction/commissioning projects
  C. COORDINATES — add lat/lng for construction/commissioning projects missing them

This script:
  1. Updates the projects table in database/aures.db directly.
  2. Patches corresponding project JSON files under
     frontend/public/data/projects/{tech}/{id}.json so the PWA reflects changes
     immediately.

Run:
    python3 pipeline/enrichers/enrich_v182.py
    python3 pipeline/enrichers/enrich_v182.py --dry-run
"""

import json
import os
import sqlite3
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
DB_PATH = ROOT / 'database' / 'aures.db'
JSON_DIR = ROOT / 'frontend' / 'public' / 'data' / 'projects'

# Map DB technology values to JSON directory names
TECH_DIR_MAP = {
    'bess': 'bess',
    'solar': 'solar',
    'wind': 'wind',
    'hybrid': 'hybrid',
    'offshore_wind': 'offshore-wind',
    'pumped_hydro': 'pumped-hydro',
}


# ─── A. ZOMBIE PROJECT DETECTION ────────────────────────────────────────────

ZOMBIE_STALE = [
    'hallett-bess',
    'liverpool-range-wind-farm',
    'paling-yards-wind-farm',
    'conroys-gap-wf-kci',
    'barn-hill',
    'western-plains-wind-farm',
    'eden-offshore-wind-farm',
    'chinchilla-solar-farm',
    'chances-plain-solar-farm',
    'hills-of-gold-wind-farm',
    'kentbruck-green-power-hub',
]


# ─── B. NOTABLE DESCRIPTIONS ────────────────────────────────────────────────

NOTABLE_UPDATES = {
    # Construction projects
    'tomago-bess': '500 MW / 2 GWh grid-scale battery at former Tomago aluminium smelter site. AGL Energy flagship storage project in the Hunter Valley, NSW.',
    'goulburn-river-solar-farm-and-bess': '450 MW solar + BESS hybrid near Merriwa, NSW. One of the largest solar-storage combinations in Australia.',
    'broadsound-solar-farm': '296 MW solar farm near Marlborough, QLD. Part of the CQ REZ growth corridor.',
    'bungama-solar': '280 MW solar farm near Port Pirie, SA. Contributes to South Australia\'s nation-leading renewable generation mix.',
    'goorambat-east-solar-farm-engie': '250 MW solar farm near Benalla, VIC. Located in the Murray River REZ.',
    'wandoan-south-solar-stage-2': '240 MW Stage 2 expansion of the Wandoan South complex, QLD. Vena Energy development adding to the existing 157 MW Stage 1.',
    'munna-creek-solar-farm': '120 MW solar farm in the Wide Bay region, QLD. Developed by Lightsource bp.',
    'horsham-solar-farm': '119 MW solar farm near Horsham, VIC. Part of the Western Victoria REZ.',
    'bennetts-creek-bess': '110 MW / 220 MWh BESS near Gloucester, NSW. AGL Energy project supporting Hunter Valley grid stability.',
    'terang-bess': '108 MW wind farm near Terang, VIC. Located in the Western Victoria renewable energy zone.',
    'gunsynd-solar-farm': '94 MW solar farm in the Darling Downs region, QLD.',
    'fulham-solar-farm-and-bess': '80 MW solar + BESS near Sale, VIC. Hybrid project in the Gippsland region.',
    'lancaster-solar-farm': '80 MW solar farm near Lancaster, VIC. Part of the Murray River REZ growth.',
    'quorn-park-solar-hybrid': '80 MW solar hybrid near Quorn, SA. Located in the northern Flinders Ranges.',
    'bundaberg-solar-farm': '78 MW solar farm near Bundaberg, QLD. Part of the Wide Bay renewable energy corridor.',
    'banksia-solar-farm': '60 MW solar farm in the Darling Downs, QLD.',
    # Commissioning projects
    'western-downs-battery-stage-1-and-2': '510 MW / 1,020 MWh BESS at Chinchilla, QLD. CleanCo Queensland flagship — one of the largest batteries in the Southern Hemisphere.',
    'wandoan-south-solar-stage-1': '125 MW Stage 1 of the Wandoan South complex, QLD. Vena Energy development.',
    'gangarri-solar-farm': '120 MW solar farm near Miles, QLD. Developed by Acciona Energía.',
    'templers-bess': '111 MW / 222 MWh BESS near Mallala, SA. Nexif Energy project.',
    'tailem-bend-stage-2-solar-project': '87 MW Stage 2 expansion of the Tailem Bend Solar Farm, SA.',
    'wunghnu-solar-farm': '75 MW solar farm near Wunghnu, VIC. X-Elio Energy development.',
    'wagga-north-solar-farm': '49 MW solar farm north of Wagga Wagga, NSW. Lightsource bp project.',
    'tailem-bend-battery-project': '42 MW / 85 MWh BESS co-located with the Tailem Bend solar complex, SA.',
}


# ─── C. COORDINATES ─────────────────────────────────────────────────────────

COORDINATE_UPDATES = {
    # Construction projects
    'tomago-bess': (-32.8650, 151.6120),
    'bulabul-bess-1': (-32.3500, 148.7800),
    'carmodys-hill-wind-farm': (-33.5400, 138.5800),
    'gnarwarre-bess-facility': (-38.2200, 144.1100),
    'pine-lodge-bess': (-36.4900, 145.9700),
    'mornington-bess': (-38.2200, 145.0400),
    'summerfield-bess': (-34.1600, 139.4500),
    'boulder-creek-wind-farm': (-20.7700, 148.5300),
    'blind-creek-solar-farm-and-battery-energy-storage-system': (-32.5100, 149.0900),
    'goulburn-river-solar-farm-and-bess': (-32.1500, 150.3600),
    'broadsound-solar-farm': (-22.5600, 149.6800),
    'bungama-solar': (-33.1500, 138.0100),
    'goorambat-east-solar-farm-engie': (-36.6100, 146.0400),
    'wandoan-south-solar-stage-2': (-26.1300, 149.9500),
    'munna-creek-solar-farm': (-25.9200, 151.8300),
    'horsham-solar-farm': (-36.7100, 142.2000),
    'bennetts-creek-bess': (-32.0400, 151.9100),
    'terang-bess': (-38.2400, 142.9200),
    'gunsynd-solar-farm': (-27.5500, 151.1000),
    'fulham-solar-farm-and-bess': (-38.1300, 147.0100),
    'lancaster-solar-farm': (-36.4800, 144.7600),
    'quorn-park-solar-hybrid': (-32.3500, 138.0400),
    'bundaberg-solar-farm': (-24.8700, 152.3500),
    # Commissioning projects
    'western-downs-battery-stage-1-and-2': (-26.7500, 150.6300),
    'wandoan-south-solar-stage-1': (-26.1300, 149.9500),
    'gangarri-solar-farm': (-26.6600, 150.1800),
    'templers-bess': (-34.5500, 138.5100),
    'tailem-bend-stage-2-solar-project': (-35.2600, 139.4400),
    'wunghnu-solar-farm': (-36.1500, 145.6800),
    'wagga-north-solar-farm': (-35.0600, 147.3700),
    'tailem-bend-battery-project': (-35.2600, 139.4400),
}


# ─── HELPERS ─────────────────────────────────────────────────────────────────

def get_json_path(project_id, technology):
    """Return the Path to the project JSON file, or None if not found."""
    tech_dir = TECH_DIR_MAP.get(technology)
    if not tech_dir:
        return None
    p = JSON_DIR / tech_dir / f'{project_id}.json'
    return p if p.exists() else None


def patch_json(json_path, updates):
    """Read a project JSON file, merge updates dict, write back."""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data.update(updates)
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')
    return True


# ─── MAIN ────────────────────────────────────────────────────────────────────

def run(dry_run=False):
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')

    stats = {
        'zombie_stale': 0,
        'zombie_minimal': 0,
        'notable_updated': 0,
        'coords_updated': 0,
        'json_patched': 0,
        'json_skipped': 0,
    }

    # ── Add zombie_flag column if not exists ──
    try:
        conn.execute('ALTER TABLE projects ADD COLUMN zombie_flag TEXT')
        conn.commit()
        print('Added zombie_flag column to projects table.')
    except Exception:
        pass  # column already exists

    # ══════════════════════════════════════════════════════════════════════════
    # A. ZOMBIE PROJECT DETECTION
    # ══════════════════════════════════════════════════════════════════════════
    print('\n=== A. ZOMBIE PROJECT DETECTION ===\n')

    # A1. zombie_stale — specific projects
    for pid in ZOMBIE_STALE:
        row = conn.execute('SELECT id, technology FROM projects WHERE id = ?', (pid,)).fetchone()
        if not row:
            print(f'  SKIP {pid} — not found in DB')
            continue

        conn.execute(
            "UPDATE projects SET zombie_flag = 'zombie_stale', updated_at = datetime('now') WHERE id = ?",
            (pid,)
        )
        stats['zombie_stale'] += 1
        print(f'  FLAGGED zombie_stale: {pid}')

        # Patch JSON
        if not dry_run:
            jp = get_json_path(pid, row['technology'])
            if jp:
                patch_json(jp, {'zombie_flag': 'zombie_stale'})
                stats['json_patched'] += 1
                print(f'    PATCHED {jp.name}')
            else:
                stats['json_skipped'] += 1
                print(f'    SKIP JSON — file not found')

    # A2. zombie_minimal — bulk SQL update
    cursor = conn.execute(
        """UPDATE projects SET zombie_flag = 'zombie_minimal', updated_at = datetime('now')
           WHERE status = 'development'
           AND CAST(confidence_score AS INTEGER) <= 15
           AND (first_seen IS NULL OR first_seen = '')
           AND development_stage = 'planning_submitted'
           AND zombie_flag IS NULL""",
    )
    stats['zombie_minimal'] = cursor.rowcount
    print(f'\n  FLAGGED zombie_minimal: {cursor.rowcount} projects (bulk SQL)')

    # Patch JSON for zombie_minimal projects
    if not dry_run:
        minimal_rows = conn.execute(
            """SELECT id, technology FROM projects
               WHERE zombie_flag = 'zombie_minimal'"""
        ).fetchall()
        minimal_patched = 0
        for row in minimal_rows:
            jp = get_json_path(row['id'], row['technology'])
            if jp:
                patch_json(jp, {'zombie_flag': 'zombie_minimal'})
                minimal_patched += 1
        print(f'  Patched {minimal_patched} JSON files for zombie_minimal projects')
        stats['json_patched'] += minimal_patched

    # ══════════════════════════════════════════════════════════════════════════
    # B. NOTABLE DESCRIPTIONS
    # ══════════════════════════════════════════════════════════════════════════
    print('\n=== B. NOTABLE DESCRIPTIONS ===\n')

    for pid, notable in NOTABLE_UPDATES.items():
        row = conn.execute('SELECT id, technology, notable FROM projects WHERE id = ?', (pid,)).fetchone()
        if not row:
            print(f'  SKIP {pid} — not found in DB')
            continue

        # Only update if notable is currently empty/null
        if row['notable'] and row['notable'].strip():
            print(f'  SKIP {pid} — already has notable description')
            continue

        conn.execute(
            "UPDATE projects SET notable = ?, updated_at = datetime('now') WHERE id = ?",
            (notable, pid)
        )
        stats['notable_updated'] += 1
        print(f'  UPDATED notable: {pid}')

        # Patch JSON
        if not dry_run:
            jp = get_json_path(pid, row['technology'])
            if jp:
                patch_json(jp, {'notable': notable})
                stats['json_patched'] += 1
                print(f'    PATCHED {jp.name}')
            else:
                stats['json_skipped'] += 1
                print(f'    SKIP JSON — file not found')

    # ══════════════════════════════════════════════════════════════════════════
    # C. COORDINATES
    # ══════════════════════════════════════════════════════════════════════════
    print('\n=== C. COORDINATES ===\n')

    for pid, (lat, lng) in COORDINATE_UPDATES.items():
        row = conn.execute(
            'SELECT id, technology, latitude, longitude FROM projects WHERE id = ?',
            (pid,)
        ).fetchone()
        if not row:
            print(f'  SKIP {pid} — not found in DB')
            continue

        # Only update if coordinates are currently missing
        if row['latitude'] and row['longitude']:
            print(f'  SKIP {pid} — already has coordinates ({row["latitude"]}, {row["longitude"]})')
            continue

        conn.execute(
            "UPDATE projects SET latitude = ?, longitude = ?, updated_at = datetime('now') WHERE id = ?",
            (lat, lng, pid)
        )
        stats['coords_updated'] += 1
        print(f'  UPDATED coords: {pid} ({lat}, {lng})')

        # Patch JSON
        if not dry_run:
            jp = get_json_path(pid, row['technology'])
            if jp:
                patch_json(jp, {'latitude': lat, 'longitude': lng})
                stats['json_patched'] += 1
                print(f'    PATCHED {jp.name}')
            else:
                stats['json_skipped'] += 1
                print(f'    SKIP JSON — file not found')

    # ── Commit or rollback ──
    if dry_run:
        print('\n--- DRY RUN — no changes committed ---')
        conn.rollback()
    else:
        conn.commit()
        print('\n--- Enrichment committed ---')

    print(f'\nSummary:')
    for k, v in stats.items():
        print(f'  {k}: {v}')

    conn.close()
    return stats


if __name__ == '__main__':
    dry = '--dry-run' in sys.argv
    run(dry_run=dry)
