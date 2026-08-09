#!/usr/bin/env python3
"""
AEMO Register of Large Generator Connections importer (per-state).

Under NER 5.18A.2 AEMO publishes a per-state PDF listing every large
generator connected to the transmission network in that region, with:
  - Site Name (power station name)
  - Participant (the entity registered as Generator with AEMO)
  - Technology Type (AEMO's classification e.g. 'Wind Turbine - Onshore',
    'Solar PV - Single axis tracking', 'Storage - Battery')
  - Connection Point (terminal station)
  - Aggregated Nameplate MW
  - Ceasing Date (retired assets)

The value this adds on top of KCI:
  - Retired power stations (KCI covers active/pending applications only)
  - Registered Participant entity (useful for corporate lineage / M&A)
  - AEMO's own technology classification (cross-check)

Idempotency: UNIQUE(state, snapshot, site_name). Same file re-imported
= zero net delta.

Usage:
    python3 pipeline/importers/import_aemo_gen_register.py
    python3 pipeline/importers/import_aemo_gen_register.py --state VIC --snapshot 2026-08
"""

import argparse
import os
import re
import subprocess
import sys
import unicodedata
from collections import Counter

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
REGISTER_ARCHIVE = os.path.join(REPO_ROOT, 'data', 'aemo_registers')

# Per-state PDF layout: default filename convention
STATE_FILE_PATTERNS = {
    'VIC': 'register-of-large-generator-connections-vic-{snapshot}.pdf',
    'NSW': 'register-of-large-generator-connections-nsw-{snapshot}.pdf',
    'QLD': 'register-of-large-generator-connections-qld-{snapshot}.pdf',
    'SA':  'register-of-large-generator-connections-sa-{snapshot}.pdf',
    'TAS': 'register-of-large-generator-connections-tas-{snapshot}.pdf',
}

NULLISH = {'', 'N/A', 'n/a', 'NA', 'Not Provided', 'Not Applicable', '-', '—'}


def norm_text(v):
    if v is None: return None
    s = str(v).strip()
    return None if s in NULLISH else s


def norm_number(v):
    if v is None: return None
    s = str(v).strip().replace(',', '')
    if s in NULLISH: return None
    try:
        return float(s)
    except ValueError:
        return None


def slugify(name):
    if not name: return ''
    s = str(name).lower().strip()
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'[\s-]+', '-', s).strip('-')
    return s


# ────────────────────────────────────────────────────────────────────────────
# Schema
# ────────────────────────────────────────────────────────────────────────────

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS aemo_gen_register (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    state                     TEXT NOT NULL,               -- 'VIC' / 'NSW' / 'QLD' / 'SA' / 'TAS'
    snapshot                  TEXT NOT NULL,               -- 'YYYY-MM' publication tag
    site_name                 TEXT NOT NULL,               -- power station name as printed
    project_id                TEXT REFERENCES projects(id),-- fuzzy-matched to AURES

    participant               TEXT,                        -- registered Generator entity
    technology_type           TEXT,                        -- AEMO classification
    technology_norm           TEXT,                        -- normalised (wind / solar / bess / hydro / ocgt / steam / other)
    connection_point          TEXT,                        -- terminal station
    capacity_mw               REAL,                        -- aggregated nameplate MW
    ceasing_date              TEXT,                        -- retirement date (e.g. 'Aug 2015') or NULL

    created_at                TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_aemo_gen_register_natural_key
  ON aemo_gen_register(state, snapshot, site_name);
CREATE INDEX IF NOT EXISTS idx_aemo_gen_register_project ON aemo_gen_register(project_id);
CREATE INDEX IF NOT EXISTS idx_aemo_gen_register_state   ON aemo_gen_register(state);
"""


# ────────────────────────────────────────────────────────────────────────────
# Parser
# ────────────────────────────────────────────────────────────────────────────

def pdftotext(pdf_path):
    result = subprocess.run(
        ['pdftotext', '-layout', pdf_path, '-'],
        capture_output=True, text=True, check=True
    )
    return result.stdout


def parse_register(text):
    """Yield row dicts from the pdftotext -layout output.

    Layout: after the "Site Name / Participant / Technology / Connection Point /
    Max Gen Capacity (MW) / Date of Cessation" header row, each data row is a
    single line with columns separated by 2+ spaces. Some rows (e.g. Bulgana
    Green Power Hub) span two visual lines because they carry stacked
    Technology Types — we detect those as short pure-tech follow-up lines and
    fold them into the preceding row.

    Parsing approach: split each candidate line on runs of 2+ spaces (no
    regex backtracking). A valid row has ≥5 tokens; the last token is the MW
    number, optionally trailed by a "Mon YYYY" cessation date, and the
    preceding tokens are site_name / participant / technology / connection.
    """
    lines = text.splitlines()
    start = None
    for i, line in enumerate(lines):
        if line.strip().startswith('Site Name') and 'Participant' in line:
            start = i + 1
            break
    if start is None:
        raise ValueError('Could not find "Site Name" header row in PDF text.')

    known_techs = {
        'Storage - Battery', 'Wind Turbine - Onshore',
        'Wind Turbine - Offshore',
        'Solar PV - Single axis tracking', 'Solar PV - Fixed tilt',
        'Solar PV - Dual axis tracking',
        'Turbine - Steam Sub Critical', 'Turbine - Steam Super Critical',
        'Turbine - OCGT', 'Turbine - CCGT', 'Turbine - Reciprocating',
        'Hydro - Dam', 'Hydro - Run of River',
        'Hydro - Pumped Storage',
    }
    mw_re = re.compile(r'^([\d,]+\.\d+)$')
    date_re = re.compile(r'^[A-Z][a-z]{2}\s+\d{4}$')

    rows = []
    for line in lines[start:]:
        s = line.rstrip()
        stripped = s.strip()
        if not stripped:
            continue
        # Header page-repeats
        if stripped.startswith('Register of Large Generator') or \
           stripped.startswith('Site Name'):
            continue

        # Continuation: a bare tech name alone on its own line
        if stripped in known_techs:
            if rows:
                rows[-1]['technology_type'] = rows[-1]['technology_type'] + ' + ' + stripped
            continue

        # Split on runs of 2+ spaces
        tokens = re.split(r'\s{2,}', stripped)

        # Right-scan for MW (and optional cessation date)
        last = tokens[-1]
        second_last = tokens[-2] if len(tokens) >= 2 else ''
        ceasing = None
        mw = None

        if date_re.match(last) and mw_re.match(second_last):
            ceasing = last
            mw = float(second_last.replace(',', ''))
            tokens = tokens[:-2]
        elif mw_re.match(last):
            mw = float(last.replace(',', ''))
            tokens = tokens[:-1]
        else:
            # Continuation-only line for the preceding row's wrapped
            # connection point (e.g. Bulgana Green Power Hub's row wraps
            # so the connection point sits alone on the next line).
            if rows and not rows[-1]['connection_point'] and len(tokens) == 1:
                rows[-1]['connection_point'] = stripped
            continue

        if len(tokens) < 3:
            continue

        site_name = tokens[0].strip()
        participant = tokens[1].strip()
        technology_type = tokens[2].strip()
        # Connection point may be missing if the layout wrapped it to the
        # next visual line; if so leave empty and the continuation handler
        # will fill it.
        connection_point = ' '.join(t.strip() for t in tokens[3:]).strip() if len(tokens) > 3 else ''

        rows.append({
            'site_name': site_name,
            'participant': participant,
            'technology_type': technology_type,
            'connection_point': connection_point,
            'capacity_mw': mw,
            'ceasing_date': ceasing,
        })

    return rows


# ────────────────────────────────────────────────────────────────────────────
# Technology normalisation
# ────────────────────────────────────────────────────────────────────────────

def norm_tech(tech):
    """Map AEMO's classification to AURES tech buckets."""
    if not tech: return None
    t = tech.lower()
    has_wind = 'wind' in t
    has_solar = 'solar' in t
    has_battery = 'battery' in t or 'storage' in t
    if has_wind and has_battery and not has_solar:
        return 'wind+bess'
    if has_solar and has_battery and not has_wind:
        return 'hybrid'
    if has_wind and has_solar:
        return 'hybrid'
    if has_wind: return 'wind'
    if has_solar: return 'solar'
    if has_battery: return 'bess'
    if 'hydro' in t: return 'hydro'
    if 'ocgt' in t or 'open cycle' in t: return 'ocgt'
    if 'steam' in t or 'ccgt' in t: return 'thermal'
    return 'other'


# ────────────────────────────────────────────────────────────────────────────
# Fuzzy match to AURES projects
# ────────────────────────────────────────────────────────────────────────────

STOPWORDS = {'the', 'and', 'of', 'a', 'farm', 'wind', 'solar', 'bess',
             'battery', 'energy', 'storage', 'system', 'power', 'station',
             'project', 'facility', 'complex', 'hub'}

SUFFIX_ADDS = ['-solar-farm', '-wind-farm', '-battery', '-bess', '-power-station', '-farm']
SUFFIX_STRIPS = ['-power-station', '-wind-farm', '-solar-farm', '-battery', '-bess', '-farm', '-project']

ALIASES = {
    'hbess': 'hazelwood-battery-energy-storage-system',
}


def try_match(site_name, state, by_slug, by_state_tokens):
    slug = slugify(site_name)
    if not slug: return None
    if slug in ALIASES:
        target = ALIASES[slug]
        if target in by_slug: return by_slug[target]

    # 1. Exact
    if slug in by_slug: return by_slug[slug]

    # 2. Add suffixes
    for suf in SUFFIX_ADDS:
        cand = slug + suf
        if cand in by_slug: return by_slug[cand]

    # 3. Strip suffixes
    for suf in SUFFIX_STRIPS:
        if slug.endswith(suf):
            cand = slug[: -len(suf)].rstrip('-')
            if cand in by_slug: return by_slug[cand]

    # 4. State-scoped token overlap
    tokens = {t for t in slug.split('-') if t and t not in STOPWORDS and len(t) > 2}
    if not tokens: return None
    best = None
    best_score = 0
    for cand_id, cand_tokens in by_state_tokens.get(state, []):
        if not cand_tokens: continue
        overlap = len(tokens & cand_tokens)
        # Require ≥2 significant token match OR one long unique token
        if overlap >= 2 or (overlap >= 1 and any(len(t) >= 6 for t in tokens & cand_tokens)):
            score = overlap / max(len(tokens), len(cand_tokens))
            if score > best_score:
                best_score = score
                best = cand_id
    return best


# ────────────────────────────────────────────────────────────────────────────
# Importer
# ────────────────────────────────────────────────────────────────────────────

def build_project_indexes(conn, state):
    by_slug = {}
    by_state_tokens_all = {}
    project_tech = {}
    for row in conn.execute(
        "SELECT id, name, state, technology FROM projects WHERE state IS NOT NULL"
    ):
        pid, name, pstate, tech = row
        by_slug[pid] = pid
        project_tech[pid] = tech
        # Also index by slugified name for cases where DB id differs
        slug_name = slugify(name) if name else None
        if slug_name and slug_name not in by_slug:
            by_slug[slug_name] = pid
        tokens = {t for t in (slug_name or pid).split('-')
                  if t and t not in STOPWORDS and len(t) > 2}
        by_state_tokens_all.setdefault(pstate, []).append((pid, tokens))
    return by_slug, by_state_tokens_all, project_tech


# Register technologies (from norm_tech) that mean "thermal" — must not
# match against renewable-only AURES projects.
THERMAL_REGISTER_TECHS = {'thermal', 'ocgt'}
RENEWABLE_PROJECT_TECHS = {'wind', 'solar', 'bess', 'hybrid', 'offshore_wind', 'pumped_hydro'}


def tech_compatible(register_tech_norm, project_tech):
    """Reject a match when a retired thermal register-row is being pinned to
    a renewable-only AURES project on the same site (e.g. Hazelwood coal
    plant → Hazelwood BESS)."""
    if not register_tech_norm or not project_tech:
        return True
    if register_tech_norm in THERMAL_REGISTER_TECHS and \
       project_tech in RENEWABLE_PROJECT_TECHS:
        return False
    return True


def ingest_state(state, snapshot, dry_run=False):
    fname = STATE_FILE_PATTERNS[state].format(snapshot=snapshot)
    pdf_path = os.path.join(REGISTER_ARCHIVE, fname)
    if not os.path.exists(pdf_path):
        print(f'ERROR: PDF not found at {pdf_path}')
        print(f'Expected filename pattern: {STATE_FILE_PATTERNS[state]}')
        sys.exit(1)

    print(f'Parsing {pdf_path} …')
    text = pdftotext(pdf_path)
    rows = parse_register(text)
    print(f'  Parsed {len(rows)} rows.')

    if not rows:
        print('  No rows found; check PDF layout.')
        return

    conn = get_connection()
    conn.executescript(SCHEMA_SQL)

    by_slug, by_state_tokens, project_tech = build_project_indexes(conn, state)

    match_counts = Counter()
    inserted = 0
    updated = 0

    for r in rows:
        site_name = r['site_name']
        tech_norm = norm_tech(r['technology_type'])
        project_id = try_match(site_name, state, by_slug, by_state_tokens)
        # Guard: reject cross-technology false-positives (e.g. retired
        # Hazelwood coal plant → active Hazelwood BESS project record)
        if project_id and not tech_compatible(tech_norm, project_tech.get(project_id)):
            project_id = None
        match_counts['matched' if project_id else 'unmatched'] += 1
        params = (
            state, snapshot, site_name, project_id,
            r['participant'], r['technology_type'], tech_norm,
            r['connection_point'], r['capacity_mw'], r['ceasing_date'],
        )
        # For unmatched printing later
        r['_matched_id'] = project_id

        if dry_run:
            continue

        cur = conn.execute(
            """
            INSERT INTO aemo_gen_register
              (state, snapshot, site_name, project_id, participant,
               technology_type, technology_norm, connection_point,
               capacity_mw, ceasing_date)
            VALUES (?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT (state, snapshot, site_name) DO UPDATE SET
              project_id       = excluded.project_id,
              participant      = excluded.participant,
              technology_type  = excluded.technology_type,
              technology_norm  = excluded.technology_norm,
              connection_point = excluded.connection_point,
              capacity_mw      = excluded.capacity_mw,
              ceasing_date     = excluded.ceasing_date
            """,
            params
        )
        if cur.rowcount == 1 and cur.lastrowid:
            inserted += 1
        else:
            updated += 1

    if not dry_run:
        conn.commit()

    print(f'\nMatch results:')
    print(f'  Rows: {len(rows)}')
    print(f'  Matched to AURES project: {match_counts["matched"]}  '
          f'({100.0 * match_counts["matched"] / max(1, len(rows)):.1f}%)')
    print(f'  Unmatched: {match_counts["unmatched"]}')
    print(f'  DB writes: {inserted} inserted / {updated} updated')

    # List unmatched
    unmatched = [r['site_name'] for r in rows if not r.get('_matched_id')]
    if unmatched:
        print(f'\nUnmatched site names (may be retired thermal / outside AURES scope):')
        for name in unmatched:
            print(f'  {name}')

    # Retirements
    retired = [r for r in rows if r['ceasing_date']]
    if retired:
        print(f'\nRetired assets flagged (Ceasing Date):')
        for r in retired:
            pid = r.get('_matched_id')
            print(f'  {r["site_name"]:45s} {r["ceasing_date"]:12s}  '
                  f'→ project_id: {pid or "(unmatched)"}')

    conn.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--state', default='VIC',
                    choices=list(STATE_FILE_PATTERNS.keys()),
                    help='Which state register to ingest (default VIC)')
    ap.add_argument('--snapshot', default='2026-08',
                    help='Publication tag, e.g. 2026-08')
    ap.add_argument('--dry-run', action='store_true')
    args = ap.parse_args()
    ingest_state(args.state, args.snapshot, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
