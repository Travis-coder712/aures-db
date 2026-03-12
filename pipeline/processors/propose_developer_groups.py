"""
Propose developer name groupings by analyzing current_developer names in the database.

Outputs pipeline/config/developer_groups_proposed.json for human review.
After review, save the approved version as pipeline/config/developer_groups.json.
"""
import json
import os
import re
import sys
from collections import defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

CONFIG_DIR = os.path.join(os.path.dirname(__file__), '..', 'config')


def normalize(name):
    """Strip legal suffixes and normalize for grouping."""
    s = name.strip()
    # Remove trailing annotations like "(acquired from ...)", "(formerly ...)", "(CANCELLED)"
    s = re.sub(r'\s*\((?:acquired|formerly|cancelled|50:50|JV).*?\)\s*$', '', s, flags=re.IGNORECASE)
    s = s.lower()
    # Strip legal entity suffixes
    for suffix in [
        ' pty ltd', ' pty. ltd.', ' pty limited', ' pte ltd',
        ' limited', ' ltd', ' ltd.', ' p/l', ' pty',
        ' inc', ' llc', ' corp', ' corporation',
        ' as trustee for ', ' as the trustee for ',
    ]:
        idx = s.find(suffix)
        if idx > 0:
            s = s[:idx]
    # Strip _NR suffix (AEMO non-registered marker)
    s = re.sub(r'_nr$', '', s, flags=re.IGNORECASE)
    # Normalize whitespace
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def extract_prefix(normalized, n_words=2):
    """Extract the first N significant words as a grouping key."""
    words = normalized.split()
    # Skip very short prefixes
    if len(words) <= n_words:
        return normalized
    return ' '.join(words[:n_words])


def propose_groups(conn):
    """Analyze developer names and propose groups."""
    rows = conn.execute("""
        SELECT current_developer, COUNT(*) as cnt
        FROM projects
        WHERE current_developer IS NOT NULL AND current_developer != ''
        GROUP BY current_developer
        ORDER BY cnt DESC
    """).fetchall()

    # Build name → project count mapping
    dev_counts = {r['current_developer']: r['cnt'] for r in rows}
    all_names = list(dev_counts.keys())

    # Step 1: Normalize all names
    norm_map = {}  # normalized → [original names]
    for name in all_names:
        n = normalize(name)
        if n not in norm_map:
            norm_map[n] = []
        norm_map[n].append(name)

    # Step 2: Group by exact normalized match (handles Pty Ltd variants)
    exact_groups = {}
    for norm, members in norm_map.items():
        if len(members) > 1:
            # Pick the most common name as canonical
            canonical = max(members, key=lambda m: dev_counts[m])
            exact_groups[norm] = {
                'canonical': canonical,
                'members': sorted(members),
            }

    # Step 3: Prefix-based clustering
    # Group normalized names by their 2-word prefix
    prefix_clusters = defaultdict(set)
    for norm in norm_map:
        prefix = extract_prefix(norm, 2)
        if len(prefix) >= 4:  # skip very short prefixes
            prefix_clusters[prefix].add(norm)

    # Step 4: Known parent company patterns
    # Each keyword is matched as a word-boundary prefix of the normalized name
    # Use '^' prefix for exact-start-of-name matching to avoid false positives
    known_parents = {
        'ACEN': ['^acen'],
        'Acciona Energy': ['^acciona'],
        'AGL Energy': ['^agl', '^firm power', '^firmpow'],
        'Akaysha Energy': ['^akaysha'],
        'Alinta Energy': ['^alinta'],
        'Amp Energy': ['^amp energy', '^ae bess', '^ae solar'],
        'APA Group': ['^apa group', '^apa '],
        'ARK Energy': ['^ark energy'],
        'Atmos Renewables': ['^atmos'],
        'Aula Energy': ['^aula'],
        'BayWa r.e.': ['^baywa'],
        'Biosar': ['^biosar'],
        'BlackRock': ['^blackrock'],
        'Bright Energy': ['^bright energy'],
        'Canadian Solar': ['^canadian solar', '^recurrent energy'],
        'CEP Energy': ['^cep energy'],
        'CleanGen': ['^cleangen'],
        'CWP Renewables': ['^cwp'],
        'Edify Energy': ['^edify'],
        'Elgin Energy': ['^elgin energy'],
        'Enel Green Power': ['^enel'],
        'EnergyAustralia': ['^energyaustralia', '^energy australia'],
        'Energy Estate': ['^energy estate'],
        'Enervest': ['^enervest'],
        'Equis': ['^equis'],
        'FRV (Fotowatio)': ['^frv', '^fotowatio'],
        'Genex Power': ['^genex'],
        'Global Power Generation': ['^global power'],
        'Goldwind': ['^goldwind'],
        'Hydro Tasmania': ['^hydro-electric', '^hydro tasmania'],
        'Iberdrola': ['^iberdrola'],
        'Infigen / Iberdrola': ['^infigen'],
        'JERA': ['^jera'],
        'Lightsource bp': ['^lightsource'],
        'Lyon Group': ['^lyon'],
        'Macquarie': ['^macquarie'],
        'Maoneng': ['^maoneng'],
        'Meridian Energy': ['^meridian'],
        'Naturgy': ['^naturgy'],
        'Neoen': ['^neoen'],
        'NewEn': ['^newen'],
        'Nexif Energy': ['^nexif'],
        'Origin Energy': ['^origin energy', '^origin '],
        'Octopus Energy': ['^octopus'],
        'Pacific Hydro': ['^pacific hydro'],
        'Pacific Partnerships': ['^pacific partnership'],
        'Palisade': ['^palisade'],
        'Photon Energy': ['^photon'],
        'Quinbrook': ['^quinbrook'],
        'Ratch Australia': ['^ratch'],
        'RES Australia': ['^res australia', '^res '],
        'Risen Energy': ['^risen energy'],
        'Samsung C&T': ['^samsung'],
        'Shell Energy': ['^shell energy'],
        'Snowy Hydro': ['^snowy hydro'],
        'Spark Renewables': ['^spark renew'],
        'Squadron Energy': ['^squadron'],
        'Stanwell': ['^stanwell'],
        'TagEnergy': ['^tagenergy', '^tag energy'],
        'Terrain Solar': ['^terrain solar'],
        'Tilt Renewables': ['^tilt'],
        'Total Eren': ['^total eren', '^totalenergies'],
        'UPC Renewables': ['^upc'],
        'Vena Energy': ['^vena'],
        'Vestas': ['^vestas'],
        'Windlab': ['^windlab'],
        'X-Elio': ['^x-elio'],
        'Zen Energy': ['^zen energy'],
        'Eku Energy': ['^eku energy'],
        'European Energy': ['^european energy'],
        'ESCO Pacific': ['^esco pacific'],
        'Elements Green': ['^elements green'],
        'CleanCo Queensland': ['^cleanco'],
        'Corio Generation': ['^corio'],
        'EDPR': ['^edpr'],
        'Libra Energy': ['^libra energy'],
        'BORAL': ['^boral'],
        'Risen Energy': ['^risen energy'],
        'Hanwha Energy': ['^hanwha'],
        'Highland Energy': ['^highland energy'],
    }

    # Step 5: Build final groups
    # Start with known parent matching
    assigned = set()  # track which original names are already grouped
    final_groups = []

    for parent, keywords in known_parents.items():
        members = set()
        for name in all_names:
            if name in assigned:
                continue
            name_lower = name.lower()
            norm = normalize(name)
            # For JV names like "X / Y", also check each partner
            name_parts = [name_lower]
            if ' / ' in name_lower:
                name_parts.extend(p.strip() for p in name_lower.split(' / '))
            norm_parts = [norm]
            if ' / ' in norm:
                norm_parts.extend(p.strip() for p in norm.split(' / '))
            for kw in keywords:
                matched = False
                if kw.startswith('^'):
                    prefix = kw[1:]
                    for part in name_parts + norm_parts:
                        if part.startswith(prefix):
                            matched = True
                            break
                else:
                    if kw in name_lower or kw in norm:
                        matched = True
                if matched:
                    members.add(name)
                    break
        if len(members) >= 1:
            assigned.update(members)
            project_count = sum(dev_counts[m] for m in members)
            final_groups.append({
                'canonical': parent,
                'members': sorted(members),
                'confidence': 'high' if len(members) > 1 else 'medium',
                'project_count': project_count,
            })

    # Step 6: Find remaining groups from exact normalization
    for norm, data in exact_groups.items():
        unassigned_members = [m for m in data['members'] if m not in assigned]
        if len(unassigned_members) > 1:
            assigned.update(unassigned_members)
            project_count = sum(dev_counts[m] for m in unassigned_members)
            final_groups.append({
                'canonical': data['canonical'],
                'members': sorted(unassigned_members),
                'confidence': 'medium',
                'project_count': project_count,
            })

    # Step 7: Find remaining groups from prefix clustering
    for prefix, norms in prefix_clusters.items():
        if len(norms) < 2:
            continue
        # Get all original names for these normalized forms
        cluster_members = set()
        for n in norms:
            for name in norm_map[n]:
                if name not in assigned:
                    cluster_members.add(name)
        if len(cluster_members) >= 2:
            # Pick canonical as the most common
            canonical = max(cluster_members, key=lambda m: dev_counts[m])
            assigned.update(cluster_members)
            project_count = sum(dev_counts[m] for m in cluster_members)
            final_groups.append({
                'canonical': canonical,
                'members': sorted(cluster_members),
                'confidence': 'low',
                'project_count': project_count,
            })

    # Step 8: Remaining ungrouped names become solo groups
    ungrouped = sorted([n for n in all_names if n not in assigned])

    # Sort groups by project count descending
    final_groups.sort(key=lambda g: g['project_count'], reverse=True)

    return final_groups, ungrouped, dev_counts


def main():
    conn = get_connection()
    groups, ungrouped, dev_counts = propose_groups(conn)

    total_grouped_names = sum(len(g['members']) for g in groups)
    total_projects_grouped = sum(g['project_count'] for g in groups)
    total_projects_ungrouped = sum(dev_counts.get(n, 0) for n in ungrouped)

    result = {
        'groups': groups,
        'ungrouped': ungrouped,
        'summary': {
            'total_developer_names': len(dev_counts),
            'groups_count': len(groups),
            'names_in_groups': total_grouped_names,
            'ungrouped_count': len(ungrouped),
            'projects_in_groups': total_projects_grouped,
            'projects_ungrouped': total_projects_ungrouped,
        }
    }

    os.makedirs(CONFIG_DIR, exist_ok=True)
    output_path = os.path.join(CONFIG_DIR, 'developer_groups_proposed.json')
    with open(output_path, 'w') as f:
        json.dump(result, f, indent=2)

    print(f"Developer grouping proposals:")
    print(f"  {len(dev_counts)} total developer names")
    print(f"  {len(groups)} proposed groups (covering {total_grouped_names} names, {total_projects_grouped} projects)")
    print(f"  {len(ungrouped)} ungrouped names ({total_projects_ungrouped} projects)")
    print(f"  Final entity count: {len(groups) + len(ungrouped)}")
    print(f"\nTop 20 groups:")
    for g in groups[:20]:
        aliases = f" (aliases: {', '.join(g['members'][:3])}{'...' if len(g['members']) > 3 else ''})" if len(g['members']) > 1 else ""
        print(f"  {g['canonical']}: {g['project_count']} projects, {len(g['members'])} names{aliases}")
    print(f"\nOutput: {output_path}")
    print(f"Review and save as pipeline/config/developer_groups.json when ready.")


if __name__ == '__main__':
    main()
