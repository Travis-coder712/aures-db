"""
Offtake / PPA Research Pipeline
================================
Populates the offtakes table from:
  1. Known PPAs from public announcements (seed data)
  2. Web research from RenewEconomy and other sources

Usage:
    python3 pipeline/research/research_offtakes.py --seed       # Insert known PPAs
    python3 pipeline/research/research_offtakes.py --search     # Search web for PPAs
    python3 pipeline/research/research_offtakes.py --all        # Both seed + search
    python3 pipeline/research/research_offtakes.py --stats      # Show current stats
"""

import os
import sys
import re
import time
import json
import argparse
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    requests = None
    BeautifulSoup = None

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

# ─── KNOWN PPAs FROM PUBLIC ANNOUNCEMENTS ───────────────────────────────────
# Sources: ASX announcements, press releases, RenewEconomy, AFR, ARENA
# Each entry: (project_id, party, type, term_years, capacity_mw, source_url)
# type: PPA, corporate_ppa, government_ppa, tolling, merchant
KNOWN_OFFTAKES = [
    # ── AGL as offtaker ──
    ('rye-park-wind-farm', 'AGL Energy', 'PPA', 15, None,
     'https://reneweconomy.com.au/rye-park-wind-farm/'),
    ('coopers-gap-wind-farm', 'AGL Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/coopers-gap-wind-farm/'),
    ('macarthur-wind-farm', 'AGL Energy', 'PPA', None, None,
     'https://www.agl.com.au/about-agl/how-we-source-energy/macarthur-wind-farm'),
    ('silverton-wind-farm', 'AGL Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/silverton-wind-farm/'),

    # ── Origin Energy as offtaker ──
    ('stockyard-hill-wind-farm', 'Origin Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/stockyard-hill-wind-farm/'),
    ('darlington-point-solar-farm', 'Origin Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/darlington-point-solar-farm/'),
    ('dundonnell-wind-farm', 'Origin Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/dundonnell-wind-farm/'),
    ('collector', 'Origin Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/collector-wind-farm/'),

    # ── EnergyAustralia as offtaker ──
    ('moorabool-wind-farm', 'EnergyAustralia', 'PPA', None, None,
     'https://reneweconomy.com.au/moorabool-wind-farm/'),
    ('hallett-stage-1-brown-hill', 'EnergyAustralia', 'PPA', None, None,
     'https://reneweconomy.com.au/hallett-wind-farm/'),

    # ── Shell Energy as offtaker ──
    ('berrybank-wind-farm', 'Shell Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/berrybank-wind-farm/'),
    ('stockyard-hill-wind-farm', 'Shell Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/stockyard-hill-wind-farm/'),

    # ── Alinta Energy as offtaker ──

    # ── Corporate PPAs ──
    ('sapphire-wind-farm', 'CBA (Commonwealth Bank)', 'corporate_ppa', 12, None,
     'https://reneweconomy.com.au/commonwealth-bank-signs-ppa-for-sapphire-wind-farm/'),
    ('crowlands-wind-farm', 'NAB (National Australia Bank)', 'corporate_ppa', 10, None,
     'https://reneweconomy.com.au/crowlands-wind-farm/'),
    ('murra-warra-wind-farm-stage-1', 'Telstra', 'corporate_ppa', None, None,
     'https://reneweconomy.com.au/murra-warra-wind-farm/'),
    ('murra-warra-wind-farm-stage-2', 'Telstra', 'corporate_ppa', None, None,
     'https://reneweconomy.com.au/murra-warra-wind-farm/'),
    ('western-downs-green-power-hub-pl', 'CS Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/western-downs-green-power-hub/'),
    ('new-england-solar-farm', 'Snowy Hydro', 'PPA', None, None,
     'https://reneweconomy.com.au/new-england-solar-farm/'),
    ('stubbo-solar-farm', 'Snowy Hydro', 'PPA', 15, None,
     'https://reneweconomy.com.au/stubbo-solar-farm/'),
    ('avonlie-solar-farm', 'Snowy Hydro', 'PPA', None, None,
     'https://reneweconomy.com.au/avonlie-solar-farm/'),

    # ── ACT Government Reverse Auctions ──
    ('hornsdale-wind-farm-stage-1', 'ACT Government', 'government_ppa', 20, None,
     'https://www.environment.act.gov.au/energy/cleaner-energy/renewable-energy-target'),
    ('hornsdale-wind-farm-stage-2', 'ACT Government', 'government_ppa', 20, None,
     'https://www.environment.act.gov.au/energy/cleaner-energy/renewable-energy-target'),
    ('hornsdale-wind-farm-stage-3', 'ACT Government', 'government_ppa', 20, None,
     'https://www.environment.act.gov.au/energy/cleaner-energy/renewable-energy-target'),
    ('ararat-wind-farm', 'ACT Government', 'government_ppa', 20, None,
     'https://www.environment.act.gov.au/energy/cleaner-energy/renewable-energy-target'),
    ('sapphire-wind-farm', 'ACT Government', 'government_ppa', 20, None,
     'https://www.environment.act.gov.au/energy/cleaner-energy/renewable-energy-target'),
    ('crookwell-2-wind-farm', 'ACT Government', 'government_ppa', 20, None,
     'https://www.environment.act.gov.au/energy/cleaner-energy/renewable-energy-target'),

    # ── Snowy Hydro / Red Energy ──
    ('bango-973-wind-farm', 'Snowy Hydro', 'PPA', None, None,
     'https://reneweconomy.com.au/bango-wind-farm/'),

    # ── Queensland Government ──
    ('macintyre-wind-farm', 'CleanCo Queensland', 'government_ppa', None, None,
     'https://reneweconomy.com.au/macintyre-wind-farm/'),
    ('western-downs-battery-stage-1-and-2', 'CleanCo Queensland', 'government_ppa', None, None,
     'https://reneweconomy.com.au/western-downs-battery/'),

    # ── Sun Metals / corporate ──
    ('sun-metals-corporation-solar-farm', 'Sun Metals (Korea Zinc)', 'corporate_ppa', None, 124,
     'https://reneweconomy.com.au/sun-metals-solar-farm/'),

    # ── BHP ──
    ('port-augusta-renewable-energy-park-solar', 'BHP', 'corporate_ppa', None, None,
     'https://reneweconomy.com.au/port-augusta-renewable-energy-park/'),
    ('port-augusta-renewable-energy-park-wind', 'BHP', 'corporate_ppa', None, None,
     'https://reneweconomy.com.au/port-augusta-renewable-energy-park/'),

    # ── Misc known PPAs ──
    ('golden-plains-wind', 'Shell Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/golden-plains-wind-farm/'),
    ('wambo-wind-farm', 'Shell Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/wambo-wind-farm/'),
    ('snowtown-s2-wind-farm', 'Origin Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/snowtown-wind-farm/'),
    ('bulgana-green-power-hub-wind-farm', 'Nectar Farms', 'corporate_ppa', None, None,
     'https://reneweconomy.com.au/bulgana-green-power-hub/'),
    ('victorian-big-battery', 'AEMO (system services)', 'tolling', None, None,
     'https://reneweconomy.com.au/victorian-big-battery/'),
    ('waratah-super-battery', 'NSW Government (EII)', 'government_ppa', None, None,
     'https://reneweconomy.com.au/waratah-super-battery/'),
    ('torrens-island-bess', 'SA Government', 'government_ppa', None, None,
     'https://reneweconomy.com.au/torrens-island-battery/'),

    # ── Alinta / Tilt / Misc ──
    ('walla-walla-solar-farm', 'EnergyAustralia', 'PPA', None, None,
     'https://reneweconomy.com.au/walla-walla-solar-farm/'),
    ('limondale-solar-farm-1', 'EnergyAustralia', 'PPA', None, None,
     'https://reneweconomy.com.au/limondale-solar-farm/'),
    ('culcairn-solar-farm', 'EnergyAustralia', 'PPA', None, None,
     'https://reneweconomy.com.au/culcairn-solar-farm/'),
    ('wellington-north-solar-farm-lightsource', 'EnergyAustralia', 'PPA', None, None,
     'https://reneweconomy.com.au/wellington-north-solar-farm/'),

    # ── Goyder South (Neoen / ActewAGL) ──
    ('goyder-south-wind-farm-1a', 'ActewAGL', 'PPA', None, None,
     'https://reneweconomy.com.au/goyder-south-wind-farm/'),
    ('goyder-south-wind-farm-1b', 'ActewAGL', 'PPA', None, None,
     'https://reneweconomy.com.au/goyder-south-wind-farm/'),

    # ── Clarke Creek ──
    ('clarke-creek-wind-farm', 'CS Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/clarke-creek-wind-farm/'),

    # ── Ryan Corner ──
    ('ryan-corner-wind-farm', 'Alinta Energy', 'PPA', None, None,
     'https://reneweconomy.com.au/ryan-corner-wind-farm/'),
]


def seed_known_offtakes(conn):
    """Insert known PPAs from public announcements."""
    # Get valid project IDs
    valid_ids = set(r[0] for r in conn.execute("SELECT id FROM projects").fetchall())

    inserted = 0
    skipped_no_project = 0
    skipped_duplicate = 0

    for project_id, party, offtake_type, term_years, capacity_mw, source_url in KNOWN_OFFTAKES:
        if project_id not in valid_ids:
            # Try fuzzy match
            matches = [vid for vid in valid_ids if project_id in vid or vid in project_id]
            if len(matches) == 1:
                project_id = matches[0]
            else:
                print(f"  SKIP (no project): {project_id} → {party}")
                skipped_no_project += 1
                continue

        # Check for duplicate
        existing = conn.execute(
            "SELECT id FROM offtakes WHERE project_id = ? AND party = ?",
            (project_id, party)
        ).fetchone()
        if existing:
            skipped_duplicate += 1
            continue

        conn.execute(
            "INSERT INTO offtakes (project_id, party, type, term_years, capacity_mw, source_url) VALUES (?, ?, ?, ?, ?, ?)",
            (project_id, party, offtake_type, term_years, capacity_mw, source_url)
        )
        inserted += 1

    conn.commit()
    print(f"\nSeed results:")
    print(f"  {inserted} offtakes inserted")
    print(f"  {skipped_duplicate} duplicates skipped")
    print(f"  {skipped_no_project} skipped (project not found)")


def search_reneweconomy_for_ppas(conn):
    """Search RenewEconomy for PPA/offtake announcements."""
    if not requests or not BeautifulSoup:
        print("Missing dependencies. Run: pip install requests beautifulsoup4")
        return

    # Get projects that don't have offtakes yet
    projects_with_offtakes = set(
        r[0] for r in conn.execute("SELECT DISTINCT project_id FROM offtakes").fetchall()
    )

    # Focus on operating + construction projects without offtakes
    rows = conn.execute("""
        SELECT id, name, technology, status, capacity_mw, current_developer
        FROM projects
        WHERE status IN ('operating', 'commissioning', 'construction')
        AND capacity_mw >= 50
        ORDER BY capacity_mw DESC
    """).fetchall()

    targets = [dict(r) for r in rows if r['id'] not in projects_with_offtakes]
    print(f"\n{len(targets)} projects without offtakes to research (≥50MW, operating/construction)")

    ppa_patterns = [
        re.compile(r'(?:PPA|power\s+purchase\s+agreement|offtake\s+agreement|offtake\s+contract)\s+with\s+([\w\s&\']+?)(?:\.|,|\s+for|\s+to)', re.IGNORECASE),
        re.compile(r'(?:signed|secured|entered|agreed|announced)\s+(?:a\s+)?(?:\d+[\-\s]year\s+)?(?:PPA|offtake|contract|agreement)\s+(?:with|from)\s+([\w\s&\']+?)(?:\.|,)', re.IGNORECASE),
        re.compile(r'(?:contracted|supply|supplying)\s+(?:power|electricity|energy)\s+to\s+([\w\s&\']+?)(?:\.|,)', re.IGNORECASE),
        re.compile(r'(?:offtaker|off-taker|buyer)\s+(?:is|being|was)\s+([\w\s&\']+?)(?:\.|,)', re.IGNORECASE),
        re.compile(r'([\w\s&\']+?)\s+(?:has|have)\s+(?:signed|agreed|secured)\s+(?:a\s+)?(?:PPA|offtake)', re.IGNORECASE),
    ]

    results = []
    searched = 0
    max_search = 100  # Limit per run

    for project in targets[:max_search]:
        name = project['name']
        project_id = project['id']

        # Search RenewEconomy
        search_query = f'{name} PPA offtake site:reneweconomy.com.au'
        try:
            search_url = f'https://reneweconomy.com.au/?s={requests.utils.quote(name + " PPA")}'
            time.sleep(1.5)  # Rate limit
            resp = requests.get(search_url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                continue

            soup = BeautifulSoup(resp.text, 'html.parser')

            # Find article links
            article_links = []
            for a in soup.find_all('a', href=True):
                href = a['href']
                if 'reneweconomy.com.au' in href and '/20' in href:
                    # Looks like an article URL
                    if name.split()[0].lower() in href.lower() or name.split()[0].lower() in (a.text or '').lower():
                        article_links.append(href)

            article_links = list(dict.fromkeys(article_links))[:3]  # Deduplicate, limit to 3

            for article_url in article_links:
                time.sleep(1)
                try:
                    art_resp = requests.get(article_url, headers=HEADERS, timeout=15)
                    if art_resp.status_code != 200:
                        continue

                    art_soup = BeautifulSoup(art_resp.text, 'html.parser')

                    # Extract article text
                    article_el = art_soup.find('article') or art_soup.find('div', class_='entry-content')
                    if not article_el:
                        continue
                    text = article_el.get_text(' ', strip=True)[:10000]

                    # Search for PPA patterns
                    for pattern in ppa_patterns:
                        for match in pattern.finditer(text):
                            party = match.group(1).strip()
                            # Clean up the party name
                            party = re.sub(r'\s+', ' ', party).strip()
                            if len(party) < 3 or len(party) > 60:
                                continue
                            # Skip common false positives
                            if party.lower() in ('the', 'a', 'an', 'its', 'their', 'this', 'that', 'which'):
                                continue

                            # Get context
                            start = max(0, match.start() - 80)
                            end = min(len(text), match.end() + 80)
                            context = text[start:end]

                            results.append({
                                'project_id': project_id,
                                'project_name': name,
                                'party': party,
                                'source_url': article_url,
                                'context': context,
                                'confidence': 'web_research',
                            })

                except Exception as e:
                    continue

            searched += 1
            if searched % 10 == 0:
                print(f"  Searched {searched}/{min(len(targets), max_search)} projects...")

        except Exception as e:
            continue

    # Deduplicate results
    seen = set()
    unique_results = []
    for r in results:
        key = (r['project_id'], r['party'].lower())
        if key not in seen:
            seen.add(key)
            unique_results.append(r)

    # Save results for review
    output_path = os.path.join(os.path.dirname(__file__), 'output', 'offtake_research.json')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w') as f:
        json.dump({
            'searched': searched,
            'results': unique_results,
            'timestamp': datetime.now().isoformat(),
        }, f, indent=2)

    print(f"\nWeb research results:")
    print(f"  Searched {searched} projects")
    print(f"  Found {len(unique_results)} potential offtakes")
    print(f"  Output: {output_path}")

    if unique_results:
        print(f"\nResults (for review):")
        for r in unique_results:
            print(f"  {r['project_name']} → {r['party']}")
            print(f"    Context: ...{r['context'][:120]}...")
            print()

    return unique_results


def show_stats(conn):
    """Show current offtake data stats."""
    total = conn.execute("SELECT COUNT(*) FROM offtakes").fetchone()[0]
    by_type = conn.execute(
        "SELECT type, COUNT(*) FROM offtakes GROUP BY type ORDER BY COUNT(*) DESC"
    ).fetchall()
    by_party = conn.execute(
        "SELECT party, COUNT(*) as cnt FROM offtakes GROUP BY party ORDER BY cnt DESC"
    ).fetchall()
    by_status = conn.execute("""
        SELECT p.status, COUNT(DISTINCT o.project_id) as projects
        FROM offtakes o JOIN projects p ON o.project_id = p.id
        GROUP BY p.status ORDER BY projects DESC
    """).fetchall()

    projects_with = conn.execute("SELECT COUNT(DISTINCT project_id) FROM offtakes").fetchone()[0]
    total_operating = conn.execute("SELECT COUNT(*) FROM projects WHERE status = 'operating'").fetchone()[0]
    total_construction = conn.execute("SELECT COUNT(*) FROM projects WHERE status = 'construction'").fetchone()[0]

    print(f"\n=== Offtake/PPA Database Stats ===")
    print(f"  Total offtake records: {total}")
    print(f"  Projects with offtakes: {projects_with}")
    print(f"  Operating projects: {projects_with}/{total_operating} have offtakes")
    print(f"  Construction projects: (see breakdown below)")

    print(f"\nBy type:")
    for r in by_type:
        print(f"  {r[0]}: {r[1]}")

    print(f"\nTop offtakers:")
    for r in by_party[:15]:
        print(f"  {r[0]}: {r[1]} projects")

    print(f"\nBy project status:")
    for r in by_status:
        print(f"  {r[0]}: {r[1]} projects")


def main():
    parser = argparse.ArgumentParser(description='Offtake/PPA Research Pipeline')
    parser.add_argument('--seed', action='store_true', help='Insert known PPAs')
    parser.add_argument('--search', action='store_true', help='Search web for PPAs')
    parser.add_argument('--all', action='store_true', help='Seed + search')
    parser.add_argument('--stats', action='store_true', help='Show current stats')
    args = parser.parse_args()

    if not any([args.seed, args.search, args.all, args.stats]):
        parser.print_help()
        return

    conn = get_connection()

    if args.stats:
        show_stats(conn)
        return

    if args.seed or args.all:
        print("=== Seeding known offtakes ===")
        seed_known_offtakes(conn)

    if args.search or args.all:
        print("\n=== Searching web for offtakes ===")
        search_reneweconomy_for_ppas(conn)

    show_stats(conn)


if __name__ == '__main__':
    main()
