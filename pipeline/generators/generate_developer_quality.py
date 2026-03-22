#!/usr/bin/env python3
"""
Generate developer data quality analysis JSON.

Cross-references hardcoded website research data against AURES project files
and developer-profiles.json to identify discrepancies, JV partnerships,
and SPV corrections.
"""

import json
import os
import glob
from datetime import date

# Paths
FRONTEND = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend'))
DEV_PROFILES = os.path.join(FRONTEND, 'public/data/indexes/developer-profiles.json')
PROJECTS_DIR = os.path.join(FRONTEND, 'public/data/projects')
EIS_ANALYTICS = os.path.join(FRONTEND, 'public/data/analytics/eis-analytics.json')
OUTPUT = os.path.join(FRONTEND, 'public/data/analytics/developer-data-quality.json')

TECH_DIRS = ['wind', 'solar', 'bess', 'hybrid', 'pumped-hydro', 'offshore-wind']


def load_developer_profiles():
    with open(DEV_PROFILES) as f:
        data = json.load(f)
    return {d['slug']: d for d in data['developers']}


def load_all_projects():
    """Load every project JSON into a dict keyed by project id."""
    projects = {}
    for tech in TECH_DIRS:
        tech_dir = os.path.join(PROJECTS_DIR, tech)
        if not os.path.isdir(tech_dir):
            continue
        for fp in glob.glob(os.path.join(tech_dir, '*.json')):
            with open(fp) as f:
                try:
                    p = json.load(f)
                    projects[p['id']] = p
                except (json.JSONDecodeError, KeyError):
                    pass
    return projects


def load_eis_analytics():
    with open(EIS_ANALYTICS) as f:
        return json.load(f)


def fuzzy_match_project(name, projects):
    """Try to find a project by name (case-insensitive, partial)."""
    name_lower = name.lower().strip()
    # Exact id match
    slug_attempt = name_lower.replace(' ', '-').replace("'", '')
    if slug_attempt in projects:
        return slug_attempt

    # Name match
    for pid, p in projects.items():
        if p.get('name', '').lower() == name_lower:
            return pid

    # Partial match
    for pid, p in projects.items():
        pname = p.get('name', '').lower()
        # Check if project name starts with the search name or vice versa
        if name_lower in pname or pname in name_lower:
            return pid

    return None


# ---------------------------------------------------------------------------
# Hardcoded website research data
# ---------------------------------------------------------------------------

WEBSITE_DATA = [
    {
        "developer": "AGL Energy",
        "search_slugs": ["agl-energy-limited", "agl-energy-macquarie", "agl-energy"],
        "website_url": "https://agl.com.au",
        "website_projects": [
            {"name": "Macarthur Wind Farm", "technology": "wind", "capacity_mw": 391, "status": "operating"},
            {"name": "Pottinger Energy Park", "technology": "wind/bess", "capacity_mw": 1800, "status": "development",
             "notes": "JV with Someva Renewables"},
            {"name": "Liddell Battery", "technology": "bess", "capacity_mw": 500, "status": "construction"},
            {"name": "Tomago Battery", "technology": "bess", "capacity_mw": 500, "status": "development"},
            {"name": "Torrens Island BESS", "technology": "bess", "capacity_mw": 250, "status": "construction"},
        ],
    },
    {
        "developer": "Origin Energy",
        "search_slugs": ["origin-energy", "origin-energy-4", "origin-energy-limited"],
        "website_url": "https://originenergy.com.au",
        "website_projects": [
            {"name": "Eraring Battery", "technology": "bess", "capacity_mw": 700, "status": "construction"},
            {"name": "Mortlake Battery", "technology": "bess", "capacity_mw": 300, "status": "development"},
            {"name": "Yanco Delta Wind Farm", "technology": "wind", "capacity_mw": 1500, "status": "development",
             "notes": "Acquired from ViRYA Energy"},
            {"name": "Northern Tablelands Wind Farm", "technology": "wind", "capacity_mw": 638, "status": "development"},
            {"name": "Darling Downs Battery", "technology": "bess", "capacity_mw": 500, "status": "development"},
        ],
    },
    {
        "developer": "Neoen",
        "search_slugs": ["neoen-australia", "neoen"],
        "website_url": "https://australia.neoen.com",
        "website_projects": [
            {"name": "Hornsdale Wind Farm", "technology": "wind", "capacity_mw": 316, "status": "operating"},
            {"name": "Hornsdale Power Reserve", "technology": "bess", "capacity_mw": 150, "status": "operating"},
            {"name": "Coleambally Solar Farm", "technology": "solar", "capacity_mw": 189, "status": "operating"},
            {"name": "Western Downs Green Power Hub", "technology": "solar", "capacity_mw": 460, "status": "operating"},
            {"name": "Culcairn Solar Farm", "technology": "solar", "capacity_mw": 440, "status": "development"},
            {"name": "Goyder South Wind Farm", "technology": "wind", "capacity_mw": 412, "status": "construction"},
            {"name": "Blyth Battery", "technology": "bess", "capacity_mw": 200, "status": "development"},
        ],
    },
    {
        "developer": "Tilt Renewables",
        "search_slugs": ["tilt-renewables-australia", "tilt-renewables"],
        "website_url": "https://tiltrenewables.com",
        "website_projects": [
            {"name": "Coopers Gap Wind Farm", "technology": "wind", "capacity_mw": 453, "status": "operating"},
            {"name": "Rye Park Wind Farm", "technology": "wind", "capacity_mw": 396, "status": "operating"},
            {"name": "Dundonnell Wind Farm", "technology": "wind", "capacity_mw": 336, "status": "operating"},
            {"name": "Silverton Wind Farm", "technology": "wind", "capacity_mw": 199, "status": "operating"},
            {"name": "Nyngan Solar Plant", "technology": "solar", "capacity_mw": 102, "status": "operating"},
            {"name": "Broken Hill Solar Plant", "technology": "solar", "capacity_mw": 53, "status": "operating"},
            {"name": "Latrobe Valley BESS", "technology": "bess", "capacity_mw": 100, "status": "development"},
            {"name": "Palmer Wind Farm", "technology": "wind", "capacity_mw": 288, "status": "development"},
        ],
    },
    {
        "developer": "Acciona Energy",
        "search_slugs": ["acciona-energy-australia-global-2", "acciona-energy", "jv-cathedral-rock-investments-pty-ltd-acciona-energy-australia-global-pty-ltd-and-energyaustralia"],
        "website_url": "https://acciona.com.au",
        "website_projects": [
            {"name": "Waubra Wind Farm", "technology": "wind", "capacity_mw": 192, "status": "operating"},
            {"name": "Mt Gellibrand Wind Farm", "technology": "wind", "capacity_mw": 132, "status": "operating"},
            {"name": "Mortlake South Wind Farm", "technology": "wind", "capacity_mw": 157, "status": "operating"},
            {"name": "MacIntyre Wind Farm", "technology": "wind", "capacity_mw": 923, "status": "construction",
             "notes": "JV with Ark Energy (30%)"},
            {"name": "Aldoga Solar Farm", "technology": "solar", "capacity_mw": 380, "status": "development"},
        ],
    },
    {
        "developer": "Iberdrola",
        "search_slugs": ["iberdrola-australia-development-pty-ltd", "iberdrola"],
        "website_url": "https://iberdrola.com.au",
        "website_projects": [
            {"name": "Capital Wind Farm", "technology": "wind", "capacity_mw": 141, "status": "operating"},
            {"name": "Bodangora Wind Farm", "technology": "wind", "capacity_mw": 113, "status": "operating"},
            {"name": "Port Augusta Renewable Energy Park", "technology": "hybrid", "capacity_mw": 327, "status": "operating"},
            {"name": "Avonlie Solar Farm", "technology": "solar", "capacity_mw": 245, "status": "operating"},
            {"name": "Broadsound Solar Farm", "technology": "solar", "capacity_mw": 360, "status": "development"},
            {"name": "Mount James Wind Farm", "technology": "wind", "capacity_mw": 1000, "status": "development"},
        ],
    },
    {
        "developer": "Goldwind Australia",
        "search_slugs": ["goldwind", "goldwind-australia"],
        "website_url": "https://goldwindaustralia.com",
        "website_projects": [
            {"name": "Moorabool Wind Farm", "technology": "wind", "capacity_mw": 321, "status": "operating"},
            {"name": "Gullen Range Wind Farm", "technology": "wind", "capacity_mw": 166, "status": "operating"},
            {"name": "White Rock Wind Farm", "technology": "wind", "capacity_mw": 175, "status": "operating"},
            {"name": "Cattle Hill Wind Farm", "technology": "wind", "capacity_mw": 148, "status": "operating"},
            {"name": "Coppabella Wind Farm", "technology": "wind", "capacity_mw": 288, "status": "development"},
        ],
    },
    {
        "developer": "ACEN Australia",
        "search_slugs": ["acen-renewables", "acenergy-2"],
        "website_url": "https://acenrenewables.com.au",
        "website_projects": [
            {"name": "New England Solar Farm", "technology": "solar", "capacity_mw": 720, "status": "operating"},
            {"name": "Stubbo Solar Farm", "technology": "solar", "capacity_mw": 400, "status": "construction"},
            {"name": "Robbins Island Wind Farm", "technology": "wind", "capacity_mw": 900, "status": "development"},
            {"name": "Valley of the Winds", "technology": "wind", "capacity_mw": 800, "status": "development"},
        ],
    },
    {
        "developer": "TagEnergy",
        "search_slugs": ["tagenergy-australia", "tagenergy-ingka-group"],
        "website_url": "https://tag-en.com",
        "website_projects": [
            {"name": "Golden Plains Wind Farm", "technology": "wind", "capacity_mw": 1333, "status": "construction",
             "notes": "JV with Ingka Group/IKEA (15%)"},
            {"name": "Golden Plains BESS", "technology": "bess", "capacity_mw": 150, "status": "development"},
        ],
    },
    {
        "developer": "Squadron Energy",
        "search_slugs": ["squadron-energy-services", "squadron-energy-developments"],
        "website_url": "https://squadronenergy.com",
        "website_projects": [
            {"name": "Sapphire Wind Farm", "technology": "wind", "capacity_mw": 270, "status": "operating"},
            {"name": "Bango Wind Farm", "technology": "wind", "capacity_mw": 244, "status": "operating"},
            {"name": "Crudine Ridge Wind Farm", "technology": "wind", "capacity_mw": 135, "status": "operating"},
            {"name": "Murra Warra Wind Farm", "technology": "wind", "capacity_mw": 429, "status": "operating",
             "notes": "Stages I and II"},
            {"name": "Clarke Creek Wind Farm", "technology": "wind", "capacity_mw": 450, "status": "construction"},
            {"name": "Uungula Wind Farm", "technology": "wind", "capacity_mw": 400, "status": "construction"},
        ],
    },
    {
        "developer": "Lightsource bp",
        "search_slugs": ["lightsource-development-services-australia", "lightsource-bp"],
        "website_url": "https://lightsourcebp.com",
        "website_projects": [
            {"name": "Wellington Solar Farm", "technology": "solar", "capacity_mw": 200, "status": "operating"},
            {"name": "Wellington North Solar Farm", "technology": "solar", "capacity_mw": 400, "status": "development"},
            {"name": "Goulburn River Solar Farm", "technology": "solar", "capacity_mw": 585, "status": "development"},
        ],
    },
    {
        "developer": "Edify Energy",
        "search_slugs": ["edify-energy"],
        "website_url": "https://edifyenergy.com",
        "website_projects": [
            {"name": "Daydream Solar Farm", "technology": "solar", "capacity_mw": 180, "status": "operating"},
            {"name": "Darlington Point Solar Farm", "technology": "solar", "capacity_mw": 275, "status": "operating"},
            {"name": "Gannawarra Solar Farm", "technology": "solar", "capacity_mw": 60, "status": "operating"},
        ],
    },
    {
        "developer": "EDF Renewables",
        "search_slugs": ["edf-renewables", "edf"],
        "website_url": "https://australia.edf-powersolutions.com",
        "website_projects": [
            {"name": "Dawson Wind Farm", "technology": "wind", "capacity_mw": 600, "status": "development"},
            {"name": "Banana Range Wind Farm", "technology": "wind", "capacity_mw": 230, "status": "development"},
        ],
        "notes": "Not currently in AURES database",
    },
    {
        "developer": "Engie",
        "search_slugs": ["engie"],
        "website_url": "https://engie.com.au",
        "website_projects": [
            {"name": "Willogoleche Wind Farm", "technology": "wind", "capacity_mw": 119, "status": "operating"},
            {"name": "Canunda Wind Farm", "technology": "wind", "capacity_mw": 46, "status": "operating"},
            {"name": "Hazelwood Battery", "technology": "bess", "capacity_mw": 150, "status": "development"},
            {"name": "Goorambat East Solar Farm", "technology": "solar", "capacity_mw": 250, "status": "development"},
        ],
    },
    {
        "developer": "Akaysha Energy",
        "search_slugs": ["akaysha-energy-blackrock", "akaysha-energy"],
        "website_url": "https://akayshaenergy.com",
        "website_projects": [
            {"name": "Waratah Super Battery", "technology": "bess", "capacity_mw": 850, "status": "construction"},
            {"name": "Orana BESS", "technology": "bess", "capacity_mw": 415, "status": "development"},
            {"name": "Brendale BESS", "technology": "bess", "capacity_mw": 205, "status": "development"},
            {"name": "Elaine BESS", "technology": "bess", "capacity_mw": 300, "status": "development"},
        ],
    },
    {
        "developer": "Ark Energy",
        "search_slugs": ["ark-energy-corporation"],
        "website_url": "https://arkenergy.com.au",
        "website_projects": [
            {"name": "MacIntyre Wind Farm", "technology": "wind", "capacity_mw": 923, "status": "construction",
             "notes": "30% JV partner with Acciona"},
            {"name": "Sun Metals Solar Farm", "technology": "solar", "capacity_mw": 125, "status": "operating"},
            {"name": "Richmond Valley Solar Farm", "technology": "solar", "capacity_mw": 125, "status": "development"},
        ],
    },
    {
        "developer": "FRV",
        "search_slugs": ["frv", "fotowatio-renewable-ventures"],
        "website_url": "https://frv.com",
        "website_projects": [
            {"name": "Walla Walla Solar Farm", "technology": "solar", "capacity_mw": 300, "status": "development"},
            {"name": "Moree Solar Farm", "technology": "solar", "capacity_mw": 56, "status": "operating"},
            {"name": "Winton Solar Farm", "technology": "solar", "capacity_mw": 106, "status": "development"},
            {"name": "Lilyvale Solar Farm", "technology": "solar", "capacity_mw": 125, "status": "operating"},
        ],
    },
    {
        "developer": "Pacific Blue / Pacific Hydro",
        "search_slugs": ["pacific-blue-spic-china", "pacific-hydro-clements-gap", "pacific-hydro-challicum-hills"],
        "website_url": "https://pacificblue.com.au",
        "website_projects": [
            {"name": "Cape Bridgewater Wind Farm", "technology": "wind", "capacity_mw": 58, "status": "operating"},
            {"name": "Clements Gap Wind Farm", "technology": "wind", "capacity_mw": 57, "status": "operating"},
            {"name": "Haughton Solar Farm", "technology": "solar", "capacity_mw": 115, "status": "development"},
            {"name": "Taralga Wind Farm", "technology": "wind", "capacity_mw": 107, "status": "operating"},
        ],
    },
    {
        "developer": "CEP Energy",
        "search_slugs": ["cep-energy", "cep"],
        "website_url": "https://cep.energy",
        "website_projects": [],
        "notes": "Mostly distributed/behind-the-meter projects, not utility-scale",
    },
    {
        "developer": "Vestas (as developer)",
        "search_slugs": ["vestas"],
        "website_url": "https://vestas.com",
        "website_projects": [
            {"name": "Wambo Wind Farm", "technology": "wind", "capacity_mw": 300, "status": "development"},
            {"name": "Lotus Creek Wind Farm", "technology": "wind", "capacity_mw": 285, "status": "development"},
            {"name": "Captains Mountain Wind Farm", "technology": "wind", "capacity_mw": 250, "status": "development"},
        ],
    },
]

JV_PARTNERSHIPS = [
    {
        "project_name": "Pottinger Energy Park",
        "partners": ["Someva Renewables", "AGL Energy"],
        "structure": "JV",
        "source": "EIS / developer website",
    },
    {
        "project_name": "MacIntyre Wind Farm",
        "partners": ["Acciona Energy (70%)", "Ark Energy (30%)"],
        "structure": "JV",
        "source": "EIS / developer website",
    },
    {
        "project_name": "Golden Plains Wind Farm",
        "partners": ["TagEnergy (85%)", "Ingka Group/IKEA (15%)"],
        "structure": "JV",
        "source": "EIS / developer website",
    },
    {
        "project_name": "Yanco Delta Wind Farm",
        "partners": ["Origin Energy"],
        "structure": "Acquisition",
        "source": "Acquired from ViRYA Energy",
    },
]


def find_developer_slug(search_slugs, dev_profiles):
    """Find the first matching slug from developer profiles."""
    for s in search_slugs:
        if s in dev_profiles:
            return s
    return None


def get_aures_project_ids(search_slugs, dev_profiles):
    """Collect all project_ids across matching developer slugs."""
    ids = []
    for s in search_slugs:
        if s in dev_profiles:
            ids.extend(dev_profiles[s].get('project_ids', []))
    return list(set(ids))


def build_website_comparison(dev_profiles, all_projects):
    comparisons = []

    for entry in WEBSITE_DATA:
        slug = find_developer_slug(entry['search_slugs'], dev_profiles)
        aures_project_ids = get_aures_project_ids(entry['search_slugs'], dev_profiles)

        website_projects_out = []
        matched_aures_ids = set()

        for wp in entry.get('website_projects', []):
            # Try to find this project in AURES
            matched_id = fuzzy_match_project(wp['name'], all_projects)
            in_aures = matched_id is not None

            if in_aures:
                matched_aures_ids.add(matched_id)

            wp_out = {
                "name": wp['name'],
                "technology": wp['technology'],
                "capacity_mw": wp['capacity_mw'],
                "status": wp['status'],
                "in_aures": in_aures,
            }
            if in_aures:
                wp_out["aures_id"] = matched_id
            if 'notes' in wp:
                wp_out["notes"] = wp['notes']

            website_projects_out.append(wp_out)

        website_only_count = sum(1 for wp in website_projects_out if not wp['in_aures'])
        aures_only_ids = [pid for pid in aures_project_ids if pid not in matched_aures_ids]

        comp = {
            "developer": entry['developer'],
            "slug": slug,
            "website_url": entry['website_url'],
            "website_projects": website_projects_out,
            "aures_projects": aures_project_ids,
            "match_count": sum(1 for wp in website_projects_out if wp['in_aures']),
            "website_only_count": website_only_count,
            "aures_only_count": len(aures_only_ids),
        }
        if entry.get('notes'):
            comp["notes"] = entry['notes']

        comparisons.append(comp)

    return comparisons


def build_jv_partnerships(all_projects):
    partnerships = []
    for jv in JV_PARTNERSHIPS:
        matched_id = fuzzy_match_project(jv['project_name'], all_projects)
        partnerships.append({
            "project_id": matched_id or "not-found",
            "project_name": jv['project_name'],
            "partners": jv['partners'],
            "structure": jv['structure'],
            "source": jv['source'],
        })
    return partnerships


def build_developer_corrections(all_projects, dev_profiles):
    """Scan for projects with SPV-like developer names."""
    corrections = []
    spv_indicators = ['Pty Ltd', 'Trust', 'P/L', 'as trustee', 'as the trustee', 'Trustee for']

    # Build a set of known top developer names for matching
    top_dev_names = set()
    for entry in WEBSITE_DATA:
        top_dev_names.add(entry['developer'].lower())

    # Also build known profile names
    profile_names = {}
    for slug, prof in dev_profiles.items():
        profile_names[slug] = prof['name']

    for pid, proj in all_projects.items():
        dev = proj.get('current_developer', '')
        if not dev:
            continue

        has_spv_indicator = any(ind.lower() in dev.lower() for ind in spv_indicators)
        if not has_spv_indicator:
            continue

        # Check if this developer is already a known top developer
        dev_lower = dev.lower()
        is_known = False
        for known in top_dev_names:
            if known in dev_lower:
                is_known = True
                break
        if is_known:
            continue

        # Check if it's an SPV - look for project name in the developer name
        proj_name_words = proj.get('name', '').lower().split()
        dev_has_project_name = False
        if len(proj_name_words) >= 2:
            # Check if the first two words of project name appear in developer
            first_words = ' '.join(proj_name_words[:2])
            if first_words in dev_lower:
                dev_has_project_name = True

        # Try to find a parent company from website data by checking
        # if the project appears on any developer's website
        suggested = None
        for entry in WEBSITE_DATA:
            for wp in entry.get('website_projects', []):
                if wp['name'].lower() in proj.get('name', '').lower() or \
                   proj.get('name', '').lower() in wp['name'].lower():
                    suggested = entry['developer']
                    break
            if suggested:
                break

        reason = "SPV name detected"
        confidence = "low"
        if dev_has_project_name:
            reason = f"Project-specific SPV (developer name contains project name)"
            confidence = "medium"
        if suggested:
            reason = f"SPV of {suggested} per website research"
            confidence = "high"

        corrections.append({
            "project_id": pid,
            "project_name": proj.get('name', ''),
            "current_developer": dev,
            "suggested_developer": suggested or "Unknown parent",
            "reason": reason,
            "confidence": confidence,
        })

    # Sort by confidence (high first)
    confidence_order = {"high": 0, "medium": 1, "low": 2}
    corrections.sort(key=lambda x: confidence_order.get(x['confidence'], 3))

    return corrections


def main():
    print("Loading developer profiles...")
    dev_profiles = load_developer_profiles()
    print(f"  Found {len(dev_profiles)} developers")

    print("Loading all project files...")
    all_projects = load_all_projects()
    print(f"  Found {len(all_projects)} projects")

    print("Loading EIS analytics...")
    eis = load_eis_analytics()

    print("Building website comparison...")
    website_comparison = build_website_comparison(dev_profiles, all_projects)

    print("Building JV partnerships...")
    jv_partnerships = build_jv_partnerships(all_projects)

    print("Building developer corrections...")
    developer_corrections = build_developer_corrections(all_projects, dev_profiles)

    # Summary stats
    total_discrepancies = sum(c['website_only_count'] + c['aures_only_count'] for c in website_comparison)
    high_confidence_corrections = [c for c in developer_corrections if c['confidence'] == 'high']

    output = {
        "generated": str(date.today()),
        "website_comparison": website_comparison,
        "jv_partnerships": jv_partnerships,
        "developer_corrections": developer_corrections,
        "summary": {
            "developers_audited": len(website_comparison),
            "total_discrepancies": total_discrepancies,
            "jv_projects_found": len(jv_partnerships),
            "spv_corrections_suggested": len(developer_corrections),
            "high_confidence_corrections": len(high_confidence_corrections),
        },
    }

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nOutput written to {OUTPUT}")
    print(f"Summary:")
    print(f"  Developers audited: {output['summary']['developers_audited']}")
    print(f"  Total discrepancies: {output['summary']['total_discrepancies']}")
    print(f"  JV projects found: {output['summary']['jv_projects_found']}")
    print(f"  SPV corrections suggested: {output['summary']['spv_corrections_suggested']}")
    print(f"  High confidence corrections: {output['summary']['high_confidence_corrections']}")


if __name__ == '__main__':
    main()
