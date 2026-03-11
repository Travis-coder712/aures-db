"""
Compute data confidence scores for all projects.

Scoring algorithm evaluates data completeness across multiple signals
and assigns a tier (high/good/medium/low) plus numeric score (0-100).

Usage:
    python3 pipeline/processors/compute_confidence.py
    python3 pipeline/processors/compute_confidence.py --dry-run
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

# ── Scoring weights ──────────────────────────────────────────────

MAX_SCORE = 100

def compute_project_score(row: dict) -> int:
    """Compute confidence score (0-100) from data completeness signals."""
    score = 0

    # Timeline events: 3 points each, max 15
    score += min(row['event_count'] * 3, 15)

    # Coordinates: 10 points if present
    if row['has_coords']:
        score += 10

    # Performance data: 10 points if any year exists
    if row['perf_years'] > 0:
        score += 10

    # COD history: 5 points for 1 entry, 10 for 2+
    if row['cod_entries'] >= 2:
        score += 10
    elif row['cod_entries'] >= 1:
        score += 5

    # Ownership history: 5 points if any
    if row['ownership_entries'] > 0:
        score += 5

    # Notable description: 10 points if >50 chars
    if row['notable_len'] > 50:
        score += 10
    elif row['notable_len'] > 0:
        score += 5

    # Has current_developer: 5 points
    if row['has_developer']:
        score += 5

    # Has storage_mwh (relevant for BESS/hybrid): 5 points
    if row['has_storage']:
        score += 5

    # Source references: 5 points per high-tier source (tier 1-2), max 15
    score += min(row['high_tier_sources'] * 5, 15)

    # Any sources at all: 5 points
    if row['total_sources'] > 0:
        score += 5

    # COD fields populated: 5 points if both original and current
    if row['has_cod_original'] and row['has_cod_current']:
        score += 5
    elif row['has_cod_current']:
        score += 2

    return min(score, MAX_SCORE)


def score_to_tier(score: int) -> str:
    """Map numeric score to confidence tier."""
    if score >= 75:
        return 'high'
    elif score >= 50:
        return 'good'
    elif score >= 25:
        return 'medium'
    else:
        return 'low'


def main():
    parser = argparse.ArgumentParser(description='Compute project confidence scores')
    parser.add_argument('--dry-run', action='store_true', help='Show results without updating DB')
    args = parser.parse_args()

    conn = get_connection()
    cur = conn.cursor()

    # ── Gather all signals in one query ──────────────────────────
    query = """
    SELECT
        p.id,
        p.name,
        p.technology,
        p.data_confidence AS current_tier,
        p.confidence_score AS current_score,

        -- Timeline events
        COALESCE(te.cnt, 0) AS event_count,

        -- Coordinates
        CASE WHEN p.latitude IS NOT NULL AND p.longitude IS NOT NULL THEN 1 ELSE 0 END AS has_coords,

        -- Performance data years
        COALESCE(pa.yr_cnt, 0) AS perf_years,

        -- COD history entries
        COALESCE(ch.cnt, 0) AS cod_entries,

        -- Ownership history
        COALESCE(oh.cnt, 0) AS ownership_entries,

        -- Notable description length
        COALESCE(LENGTH(p.notable), 0) AS notable_len,

        -- Has developer
        CASE WHEN p.current_developer IS NOT NULL AND p.current_developer != '' THEN 1 ELSE 0 END AS has_developer,

        -- Has storage
        CASE WHEN p.storage_mwh IS NOT NULL AND p.storage_mwh > 0 THEN 1 ELSE 0 END AS has_storage,

        -- Source references
        COALESCE(sr_high.cnt, 0) AS high_tier_sources,
        COALESCE(sr_all.cnt, 0) AS total_sources,

        -- COD fields
        CASE WHEN p.cod_original IS NOT NULL AND p.cod_original != '' THEN 1 ELSE 0 END AS has_cod_original,
        CASE WHEN p.cod_current IS NOT NULL AND p.cod_current != '' THEN 1 ELSE 0 END AS has_cod_current

    FROM projects p

    LEFT JOIN (
        SELECT project_id, COUNT(*) AS cnt FROM timeline_events GROUP BY project_id
    ) te ON te.project_id = p.id

    LEFT JOIN (
        SELECT project_id, COUNT(DISTINCT year) AS yr_cnt FROM performance_annual GROUP BY project_id
    ) pa ON pa.project_id = p.id

    LEFT JOIN (
        SELECT project_id, COUNT(*) AS cnt FROM cod_history GROUP BY project_id
    ) ch ON ch.project_id = p.id

    LEFT JOIN (
        SELECT project_id, COUNT(*) AS cnt FROM ownership_history GROUP BY project_id
    ) oh ON oh.project_id = p.id

    LEFT JOIN (
        SELECT ps.project_id, COUNT(*) AS cnt
        FROM project_sources ps
        JOIN source_references sr ON sr.id = ps.source_id
        WHERE sr.source_tier <= 2
        GROUP BY ps.project_id
    ) sr_high ON sr_high.project_id = p.id

    LEFT JOIN (
        SELECT project_id, COUNT(*) AS cnt FROM project_sources GROUP BY project_id
    ) sr_all ON sr_all.project_id = p.id

    ORDER BY p.id
    """

    rows = cur.execute(query).fetchall()
    print(f"Computing confidence for {len(rows)} projects...\n")

    # ── Score each project ───────────────────────────────────────
    tier_counts = {'high': 0, 'good': 0, 'medium': 0, 'low': 0}
    changes = []

    for row in rows:
        row_dict = dict(row)
        score = compute_project_score(row_dict)
        tier = score_to_tier(score)
        tier_counts[tier] += 1

        old_tier = row_dict['current_tier']
        old_score = row_dict['current_score']

        if tier != old_tier or score != old_score:
            changes.append((row_dict['id'], row_dict['name'], old_tier, old_score, tier, score))

    # ── Report ───────────────────────────────────────────────────
    print("Confidence Distribution:")
    for t in ['high', 'good', 'medium', 'low']:
        bar = '█' * (tier_counts[t] // 10) + '░' * max(0, 10 - tier_counts[t] // 10)
        print(f"  {t.upper():8s}  {bar}  {tier_counts[t]:4d} projects")
    print()

    upgraded = [c for c in changes if c[4] in ('high', 'good') and c[2] in ('low', 'medium')]
    if upgraded:
        print(f"Notable upgrades ({len(upgraded)}):")
        for pid, name, old_t, old_s, new_t, new_s in upgraded[:15]:
            print(f"  {name[:45]:45s}  {old_t} ({old_s}) → {new_t} ({new_s})")
        if len(upgraded) > 15:
            print(f"  ... and {len(upgraded) - 15} more")
        print()

    print(f"Total changes: {len(changes)} projects")

    if args.dry_run:
        print("\n[DRY RUN] No changes written to database.")
        return

    # ── Update database ──────────────────────────────────────────
    for pid, name, old_t, old_s, new_t, new_s in changes:
        cur.execute(
            "UPDATE projects SET data_confidence = ?, confidence_score = ? WHERE id = ?",
            (new_t, new_s, pid)
        )

    conn.commit()
    conn.close()
    print(f"\n✅ Updated {len(changes)} projects in database.")


if __name__ == '__main__':
    main()
