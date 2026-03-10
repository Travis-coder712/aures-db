"""
League Table Processor
======================
Reads performance_annual data, ranks projects by technology and year,
computes percentiles, quartiles, and composite scores, then writes
to league_table_entries.

Usage:
    python3 pipeline/processors/compute_league_tables.py --year 2025
    python3 pipeline/processors/compute_league_tables.py --year 2025 --tech wind
"""

import os
import sys
import argparse

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

# ============================================================
# Configuration
# ============================================================

# Technologies to process
TECHNOLOGIES = ['wind', 'solar', 'bess', 'hybrid', 'pumped_hydro']

# Map DB technology values to league table groupings
TECH_GROUPS = {
    'wind': 'wind',
    'solar': 'solar',
    'bess': 'bess',
    'hybrid': 'solar',      # Hybrids compete in solar league
    'pumped_hydro': 'bess',  # Pumped hydro in storage league
}


# ============================================================
# Core Processing
# ============================================================

def compute_league_tables(conn, year: int, tech_filter: str = None):
    """Compute league table rankings for a given year."""

    techs_to_process = [tech_filter] if tech_filter else ['wind', 'solar', 'bess']
    total_ranked = 0

    for tech in techs_to_process:
        projects = get_tech_projects(conn, tech, year)
        if not projects:
            print(f"  {tech}: No projects with performance data.")
            continue

        # Rank and score
        ranked = rank_projects(projects, tech)
        total_ranked += len(ranked)

        # Write to database
        write_league_entries(conn, ranked, year, tech)
        print(f"  {tech}: Ranked {len(ranked)} projects.")

        # Update performance_score on projects table
        update_project_scores(conn, ranked)

    conn.commit()
    print(f"\nTotal: {total_ranked} projects ranked for year {year}.")


def get_tech_projects(conn, tech: str, year: int):
    """Get projects with performance data for a technology and year."""
    # Include hybrids in solar, pumped_hydro in bess
    if tech == 'solar':
        tech_clause = "p.technology IN ('solar', 'hybrid')"
    elif tech == 'bess':
        tech_clause = "p.technology IN ('bess', 'pumped_hydro')"
    else:
        tech_clause = f"p.technology = '{tech}'"

    rows = conn.execute(f"""
        SELECT
            p.id, p.name, p.technology, p.capacity_mw, p.storage_mwh, p.state,
            pa.energy_mwh, pa.capacity_factor_pct, pa.curtailment_pct,
            pa.energy_price_received, pa.revenue_aud, pa.revenue_per_mw,
            pa.market_value_aud,
            pa.energy_charged_mwh, pa.energy_discharged_mwh,
            pa.avg_charge_price, pa.avg_discharge_price,
            pa.utilisation_pct, pa.cycles
        FROM performance_annual pa
        JOIN projects p ON pa.project_id = p.id
        WHERE {tech_clause}
        AND pa.year = ?
        AND pa.energy_mwh IS NOT NULL
        ORDER BY p.capacity_mw DESC
    """, (year,)).fetchall()

    return [dict(r) for r in rows]


def rank_projects(projects, tech: str):
    """Rank projects and compute percentiles, quartiles, and composite scores."""
    n = len(projects)
    if n == 0:
        return []

    # Sort by different metrics and assign ranks
    # Capacity factor: higher is better
    by_cf = sorted(projects, key=lambda p: p.get('capacity_factor_pct') or 0, reverse=True)
    cf_ranks = {p['id']: i + 1 for i, p in enumerate(by_cf)}

    # Revenue per MW: higher is better
    by_rev = sorted(projects, key=lambda p: p.get('revenue_per_mw') or 0, reverse=True)
    rev_ranks = {p['id']: i + 1 for i, p in enumerate(by_rev)}

    # Curtailment: lower is better
    by_curt = sorted(projects, key=lambda p: p.get('curtailment_pct') or 100)
    curt_ranks = {p['id']: i + 1 for i, p in enumerate(by_curt)}

    # Compute percentiles and composite scores
    ranked = []
    for project in projects:
        pid = project['id']

        cf_rank = cf_ranks.get(pid, n)
        rev_rank = rev_ranks.get(pid, n)
        curt_rank = curt_ranks.get(pid, n)

        # Percentile (0-100, higher = better)
        cf_pct = ((n - cf_rank) / max(n - 1, 1)) * 100
        rev_pct = ((n - rev_rank) / max(n - 1, 1)) * 100

        # Composite score depends on technology
        if tech == 'bess':
            # BESS: revenue + utilisation + spread + cycles
            rev_score = rev_pct
            util = project.get('utilisation_pct') or 0
            util_score = min(util / 60 * 100, 100)  # Normalize to 0-100 (60% = max)
            spread = (project.get('avg_discharge_price') or 0) - (project.get('avg_charge_price') or 0)
            spread_score = min(max(spread / 200 * 100, 0), 100)  # Normalize
            cycles_val = project.get('cycles') or 0
            cycles_score = min(cycles_val / 500 * 100, 100)  # 500 cycles = max

            composite = 0.3 * rev_score + 0.3 * util_score + 0.2 * spread_score + 0.2 * cycles_score
        else:
            # Wind/Solar: CF + revenue + curtailment
            curt_pct = ((n - curt_rank) / max(n - 1, 1)) * 100
            composite = 0.4 * cf_pct + 0.4 * rev_pct + 0.2 * curt_pct

        composite = round(composite, 1)

        project['rank_capacity_factor'] = cf_rank
        project['rank_revenue_per_mw'] = rev_rank
        project['rank_curtailment'] = curt_rank
        project['percentile_capacity_factor'] = round(cf_pct, 1)
        project['percentile_revenue_per_mw'] = round(rev_pct, 1)
        project['composite_score'] = composite

        ranked.append(project)

    # Sort by composite score (descending) and assign composite rank + quartile
    ranked.sort(key=lambda p: p['composite_score'], reverse=True)
    for i, project in enumerate(ranked):
        project['rank_composite'] = i + 1
        # Quartile: Q1 = top 25%, Q4 = bottom 25%
        project['quartile'] = min(4, (i * 4) // n + 1)

    return ranked


def write_league_entries(conn, ranked, year: int, tech: str):
    """Write ranked projects to league_table_entries."""
    # Delete existing entries for this year+tech
    conn.execute(
        "DELETE FROM league_table_entries WHERE year = ? AND technology = ?",
        (year, tech)
    )

    for p in ranked:
        conn.execute("""
            INSERT INTO league_table_entries (
                project_id, year, technology,
                rank_capacity_factor, rank_revenue_per_mw, rank_curtailment, rank_composite,
                percentile_capacity_factor, percentile_revenue_per_mw,
                quartile, composite_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p['id'], year, tech,
            p['rank_capacity_factor'], p['rank_revenue_per_mw'],
            p['rank_curtailment'], p['rank_composite'],
            p['percentile_capacity_factor'], p['percentile_revenue_per_mw'],
            p['quartile'], p['composite_score'],
        ))


def update_project_scores(conn, ranked):
    """Update performance_score on the projects table."""
    for p in ranked:
        conn.execute(
            "UPDATE projects SET performance_score = ? WHERE id = ?",
            (p['composite_score'], p['id'])
        )


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(description='Compute league table rankings')
    parser.add_argument('--year', type=int, default=2025, help='Year to process')
    parser.add_argument('--tech', type=str, choices=['wind', 'solar', 'bess'], help='Process single technology')
    args = parser.parse_args()

    conn = get_connection()
    print(f"Computing league tables for {args.year}...")
    compute_league_tables(conn, args.year, args.tech)
    conn.close()


if __name__ == '__main__':
    main()
