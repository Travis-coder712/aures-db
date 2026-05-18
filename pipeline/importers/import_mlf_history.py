"""
AEMO Marginal Loss Factor (MLF) Historical Importer
====================================================

Parses AEMO's annual "Marginal Loss Factors: Financial Year YYYY-YY"
PDFs (one PDF covers two years — current + prior), matches the
per-DUID rows to AURES operational wind/solar projects by name +
state, aggregates to per-project per-year MLF (mean across units),
and writes a JSON output the frontend can render.

Source data: pipeline/importers/downloads/mlf/mlf-fy*.pdf
Output:      frontend/public/data/analytics/intelligence/mlf-history.json

Run once when refreshing MLFs:
    python3 pipeline/importers/import_mlf_history.py
"""
import os, re, json, subprocess, sys
from collections import defaultdict
from datetime import datetime

# ============================================================
# Configuration
# ============================================================

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDF_DIR  = os.path.join(ROOT, 'pipeline/importers/downloads/mlf')
PROJECTS = os.path.join(ROOT, 'frontend/public/data/projects/index.json')
PRICES   = os.path.join(ROOT, 'frontend/public/data/analytics/intelligence/market-prices.json')
OUTPUT   = os.path.join(ROOT, 'frontend/public/data/analytics/intelligence/mlf-history.json')

# Map each PDF file to (current_fy, prior_fy) labels
PDF_YEAR_MAP = {
    'mlf-fy21-22.pdf': ('2021-22', '2020-21'),
    'mlf-fy23-24.pdf': ('2023-24', '2022-23'),
    'mlf-fy25-26.pdf': ('2025-26', '2024-25'),
}

# Section markers in the PDF text — generation tables only (skip loads + bidirectional)
GENERATION_SECTION_MARKERS = [
    ('QLD', re.compile(r'^\s*Table\s+\d+\s+Queensland generation\b', re.MULTILINE)),
    ('NSW', re.compile(r'^\s*Table\s+\d+\s+New South Wales generation\b', re.MULTILINE)),
    ('ACT', re.compile(r'^\s*Table\s+\d+\s+ACT generation\b', re.MULTILINE)),
    ('VIC', re.compile(r'^\s*Table\s+\d+\s+Victoria generation\b', re.MULTILINE)),
    ('SA',  re.compile(r'^\s*Table\s+\d+\s+South Australia generation\b', re.MULTILINE)),
    ('TAS', re.compile(r'^\s*Table\s+\d+\s+Tasmania generation\b', re.MULTILINE)),
]
# End-of-section markers — the next table or the start of section 2
END_MARKERS = re.compile(r'^\s*Table\s+\d+\s+|^Section 2\b|^\s*Marginal loss factor variation\b', re.MULTILINE)

# Pattern for a single MLF data row.
# Format (with variable spacing):
#   Generator name (possibly many words)  Voltage(kV)  DUID  ConnectionPoint  TNI  MLF_current  [MLF_prior]
# Examples:
#   "Aldoga Solar Farm                275    ALDGASF1       QLCS1A   QLCS    0.9318   0.9659"
#   "Bouldercombe BESS (Generation)   132    BBATTERY       QBCB1B   QBCB    0.9198"
ROW_RE = re.compile(
    r'^\s*(?P<gen>[A-Za-z][\w\s\-\.\(\)\&–/]+?)\s{2,}'      # name, ≥2 spaces before voltage
    r'(?P<kv>\d{2,3})\s+'                                          # voltage
    r'(?P<duid>[A-Z][A-Z0-9_\-#]{2,})\s+'                          # DUID
    r'(?P<cp>[A-Z0-9_\-]{2,})\s+'                                  # connection point
    r'(?P<tni>[A-Z0-9]{3,4})\s+'                                   # TNI
    r'(?P<mlf1>[01]\.\d{3,4})'                                     # current-year MLF
    r'(?:\s+(?P<mlf2>[01]\.\d{3,4}))?'                             # optional prior-year MLF
    r'\s*$'
)

# ============================================================
# PDF text extraction
# ============================================================

def ensure_text(pdf_path):
    """Run pdftotext if .txt missing, return path to .txt."""
    txt_path = pdf_path.replace('.pdf', '.txt')
    if not os.path.exists(txt_path):
        subprocess.run(['pdftotext', '-layout', pdf_path, txt_path], check=True)
    return txt_path


def parse_pdf(pdf_path, fy_current, fy_prior):
    """Return list of MLF rows from one PDF."""
    txt_path = ensure_text(pdf_path)
    with open(txt_path) as f:
        text = f.read()

    rows = []
    for region, marker_re in GENERATION_SECTION_MARKERS:
        for table_start in marker_re.finditer(text):
            # Find the end of this section
            after = text[table_start.end():]
            end_match = END_MARKERS.search(after)
            section = after[:end_match.start()] if end_match else after
            for line in section.splitlines():
                m = ROW_RE.match(line)
                if not m:
                    continue
                duid = m.group('duid').strip()
                gen = m.group('gen').strip()
                kv = int(m.group('kv'))
                # Skip lines that look obviously wrong (e.g. row-spanning header artefacts)
                if len(gen) < 3 or 'Generator' in gen:
                    continue
                mlf1 = float(m.group('mlf1'))
                rows.append({
                    'region': region, 'station_name': gen, 'duid': duid,
                    'voltage_kv': kv,
                    'connection_point': m.group('cp').strip(),
                    'tni': m.group('tni').strip(),
                    'fy': fy_current, 'mlf': mlf1,
                })
                if m.group('mlf2'):
                    mlf2 = float(m.group('mlf2'))
                    rows.append({
                        'region': region, 'station_name': gen, 'duid': duid,
                        'voltage_kv': kv,
                        'connection_point': m.group('cp').strip(),
                        'tni': m.group('tni').strip(),
                        'fy': fy_prior, 'mlf': mlf2,
                    })
    return rows


# ============================================================
# Project matching
# ============================================================

# Region code → AURES state
REGION_TO_STATE = {'QLD': 'QLD', 'NSW': 'NSW', 'ACT': 'NSW', 'VIC': 'VIC', 'SA': 'SA', 'TAS': 'TAS'}

# Strip these words when matching — they're noise
NAME_NOISE_RE = re.compile(
    r'\b(solar|wind|farm|park|power|station|ps|hub|project|energy|green|hybrid|bess|battery|'
    r'gen(?:eration|erator)?|stage|unit|stages?|hub|the|north|south|east|west|inverter|plant)\b',
    re.IGNORECASE,
)
PUNCT_RE = re.compile(r'[^\w\s]+')
WHITESPACE_RE = re.compile(r'\s+')


def normalise(name):
    """Aggressive normalisation for fuzzy match: lowercase, strip
    punctuation, strip common renewables words."""
    s = name.lower()
    s = PUNCT_RE.sub(' ', s)
    s = NAME_NOISE_RE.sub(' ', s)
    s = WHITESPACE_RE.sub(' ', s).strip()
    # Remove trailing digits that indicate units / stages (e.g. "ararat 1")
    s = re.sub(r'\b\d+\b', '', s).strip()
    return s


def first_word(name):
    """First normalised word — falls back to disambiguate fuzzy matches."""
    n = normalise(name)
    return n.split()[0] if n else ''


def build_project_index(projects):
    """Return dict normalised-name → project (operational wind/solar only)."""
    index = {}
    for p in projects:
        if p.get('status') != 'operating':
            continue
        if p.get('technology') not in ('wind', 'solar', 'hybrid'):
            continue
        key = (normalise(p['name']), p['state'])
        index.setdefault(key, []).append(p)
    return index


def match_project(station_name, region, project_index):
    """Return project dict if confident match, else None."""
    state = REGION_TO_STATE.get(region)
    if not state:
        return None
    key = (normalise(station_name), state)
    matches = project_index.get(key)
    if not matches:
        return None
    # Prefer single match; if multiple, take the largest by capacity
    return max(matches, key=lambda p: p.get('capacity_mw') or 0)


# ============================================================
# Aggregation + export
# ============================================================

def percentile(values, p):
    """Linear-interpolated percentile."""
    if not values:
        return None
    s = sorted(values)
    if len(s) == 1:
        return s[0]
    k = (len(s) - 1) * (p / 100.0)
    f, c = int(k), min(int(k) + 1, len(s) - 1)
    return s[f] + (s[c] - s[f]) * (k - f)


def median(values):
    return percentile(values, 50)


def state_rrp_from_market_prices(prices):
    """Compute median monthly RRP per state from the recent monthly data
    in market-prices.json. Returns dict {state: median_rrp}."""
    out = {}
    for state, rows in prices.get('monthly_trends', {}).items():
        if not rows:
            continue
        rrps = [r.get('avg_price') for r in rows if r.get('avg_price') is not None]
        out[state] = median(rrps)
    return out


def main():
    print('Loading AURES project list…')
    with open(PROJECTS) as f:
        projects = json.load(f)
    project_index = build_project_index(projects)
    print(f'  {len(project_index)} indexed operational wind/solar/hybrid (state-keyed)')

    print('Loading market-prices…')
    try:
        with open(PRICES) as f:
            prices = json.load(f)
        state_rrp = state_rrp_from_market_prices(prices)
        print(f'  state median RRP: {state_rrp}')
    except Exception as e:
        print(f'  WARN: prices unavailable ({e}) — chart will lack RRP overlay')
        state_rrp = {}

    print('Parsing MLF PDFs…')
    all_rows = []
    for pdf_name, (fy_cur, fy_prior) in PDF_YEAR_MAP.items():
        pdf_path = os.path.join(PDF_DIR, pdf_name)
        if not os.path.exists(pdf_path):
            print(f'  SKIP: {pdf_name} not found')
            continue
        rows = parse_pdf(pdf_path, fy_cur, fy_prior)
        print(f'  {pdf_name}: parsed {len(rows):,} rows '
              f'({sum(1 for r in rows if r["fy"]==fy_cur)} for {fy_cur}, '
              f'{sum(1 for r in rows if r["fy"]==fy_prior)} for {fy_prior})')
        all_rows.extend(rows)

    print(f'Total MLF rows: {len(all_rows):,}')

    # Match to AURES projects
    print('Matching to AURES projects…')
    # Group: (project_id, fy) → list of MLF values across units
    project_mlf = defaultdict(lambda: defaultdict(list))   # project_id → fy → [mlf, …]
    project_meta = {}
    duid_unmatched = set()

    for row in all_rows:
        project = match_project(row['station_name'], row['region'], project_index)
        if project is None:
            duid_unmatched.add((row['region'], row['station_name'], row['duid']))
            continue
        pid = project['id']
        project_mlf[pid][row['fy']].append(row['mlf'])
        project_meta[pid] = project

    matched_projects = len(project_mlf)
    total_op = sum(
        1 for p in projects
        if p.get('status') == 'operating' and p.get('technology') in ('wind', 'solar', 'hybrid')
    )
    print(f'  matched: {matched_projects} / {total_op} operational wind/solar/hybrid projects')
    print(f'  unmatched MLF rows (DUIDs not in AURES projects): {len(duid_unmatched):,}')

    # Build per_project output
    fy_list = sorted({r['fy'] for r in all_rows})
    per_project = []
    for pid, by_fy in project_mlf.items():
        p = project_meta[pid]
        mlf_by_year = {fy: round(sum(v) / len(v), 4) for fy, v in by_fy.items()}
        latest_fy = max(mlf_by_year.keys())
        per_project.append({
            'id': pid,
            'name': p['name'],
            'state': p['state'],
            'technology': p['technology'],
            'capacity_mw': p.get('capacity_mw'),
            'mlf_by_year': mlf_by_year,
            'latest_fy': latest_fy,
            'latest_mlf': mlf_by_year[latest_fy],
        })
    per_project.sort(key=lambda x: (x['state'], -x.get('capacity_mw') or 0))

    # Build per-state per-FY summaries — limit to wind/solar (the MLF story projects)
    summary = defaultdict(lambda: defaultdict(list))  # state → fy → [mlf, …]
    for entry in per_project:
        for fy, mlf in entry['mlf_by_year'].items():
            summary[entry['state']][fy].append(mlf)

    state_summaries = []
    for state in sorted(summary.keys()):
        for fy in sorted(summary[state].keys()):
            vals = summary[state][fy]
            state_summaries.append({
                'state': state, 'fy': fy,
                'n': len(vals),
                'p25': round(percentile(vals, 25), 4),
                'median': round(median(vals), 4),
                'p75': round(percentile(vals, 75), 4),
                'min': round(min(vals), 4),
                'max': round(max(vals), 4),
            })

    output = {
        'generated_at': datetime.utcnow().isoformat() + 'Z',
        'fy_list': fy_list,
        'states': sorted(REGION_TO_STATE.values()),
        'per_project': per_project,
        'state_summaries': state_summaries,
        'state_recent_rrp': state_rrp,
        'methodology': {
            'mlf_source': 'AEMO Marginal Loss Factor publications (PDFs), per financial year.',
            'mlf_scope': (
                'Generation MLFs only (load + bidirectional tables excluded). '
                'Where a project has multiple DUIDs the per-year MLF is the simple '
                'mean across units.'
            ),
            'matching': (
                'AEMO station names are matched to AURES project names by aggressive '
                'normalisation (lowercase, strip "farm/park/solar/wind/station/hub", '
                'strip trailing unit numbers) + state. Only operational wind/solar/hybrid '
                'projects are included in this dataset.'
            ),
            'rrp_source': (
                'state_recent_rrp is the median of recent monthly RRPs from the OpenElectricity '
                'feed (last 13 months covered by AURES market-prices). Historical per-state RRP '
                'is not yet in AURES, so the time-series tab plots MLF only.'
            ),
            'caveats': (
                'A small number of AEMO-listed units do not match an AURES project '
                '(decommissioned, name mismatch beyond fuzzy matcher, or AURES coverage gap). '
                'These appear in unmatched logs at import time but not in this output.'
            ),
        },
        'sources': [
            {'fy': '2021-22 + 2020-21', 'title': 'AEMO MLF Report FY2021-22', 'url': 'https://aemo.com.au/-/media/files/electricity/nem/security_and_reliability/loss_factors_and_regional_boundaries/2021-22/marginal-loss-factors-for-the-2021-22-financial-year.pdf'},
            {'fy': '2023-24 + 2022-23', 'title': 'AEMO MLF Report FY2023-24', 'url': 'https://www.aemo.com.au/-/media/files/electricity/nem/security_and_reliability/loss_factors_and_regional_boundaries/2023-24/marginal-loss-factors-for-the-2023-24-financia-year-pdf.pdf'},
            {'fy': '2025-26 + 2024-25', 'title': 'AEMO MLF Report FY2025-26', 'url': 'https://www.aemo.com.au/-/media/files/electricity/nem/security_and_reliability/loss_factors_and_regional_boundaries/2025-26-marginal-loss-factors/marginal-loss-factors-for-the-2025-26-fin-year.pdf'},
        ],
    }

    with open(OUTPUT, 'w') as f:
        json.dump(output, f, indent=2)
    print(f'Wrote {OUTPUT}')
    print(f'  per_project: {len(per_project)} projects')
    print(f'  state_summaries: {len(state_summaries)} state-FY rows')


if __name__ == '__main__':
    main()
