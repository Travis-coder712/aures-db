"""
AEMO Data Enrichment Processor
===============================
Extracts maximum value from existing AEMO Generation Information data:

1. Development stage classification:
   - planning_approved: has planning_approved timeline event
   - planning_submitted: has planning_submitted event OR AEMO "Publicly Announced"/"Committed"
   - early_stage: AEMO "Anticipated" or no AEMO status

2. COD date population from AEMO full_year_commissioning

3. COD drift detection: compares AEMO COD with stored cod_current

Usage:
    python3 pipeline/processors/enrich_from_aemo.py [--dry-run]
"""

import os
import sys
import argparse
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection


def classify_development_stages(conn, dry_run=False):
    """Classify development projects into planning_approved / planning_submitted / early_stage."""

    # Get all development projects
    dev_projects = conn.execute("""
        SELECT id, name FROM projects WHERE status = 'development'
    """).fetchall()
    print(f"\nClassifying {len(dev_projects)} development projects...")

    # Get projects with planning timeline events
    planning_approved_ids = set(row['project_id'] for row in conn.execute("""
        SELECT DISTINCT project_id FROM timeline_events
        WHERE event_type = 'planning_approved'
    """).fetchall())

    planning_submitted_ids = set(row['project_id'] for row in conn.execute("""
        SELECT DISTINCT project_id FROM timeline_events
        WHERE event_type = 'planning_submitted'
    """).fetchall())

    # Get AEMO commitment statuses per project (most advanced status wins)
    aemo_statuses = {}
    for row in conn.execute("""
        SELECT project_id, status FROM aemo_generation_info
        WHERE project_id IS NOT NULL
    """).fetchall():
        pid = row['project_id']
        status = row['status']
        # Keep the most advanced status
        priority = {'Anticipated': 0, 'Publicly Announced': 1, 'Committed': 2, 'Committed*': 2}
        if pid not in aemo_statuses or priority.get(status, -1) > priority.get(aemo_statuses[pid], -1):
            aemo_statuses[pid] = status

    counts = {'planning_approved': 0, 'planning_submitted': 0, 'early_stage': 0}

    for proj in dev_projects:
        pid = proj['id']

        if pid in planning_approved_ids:
            stage = 'planning_approved'
        elif pid in planning_submitted_ids:
            stage = 'planning_submitted'
        elif aemo_statuses.get(pid) in ('Publicly Announced', 'Committed', 'Committed*'):
            stage = 'planning_submitted'
        else:
            stage = 'early_stage'

        counts[stage] += 1

        if not dry_run:
            conn.execute(
                "UPDATE projects SET development_stage = ? WHERE id = ?",
                (stage, pid)
            )

    print(f"  Planning Approved: {counts['planning_approved']}")
    print(f"  Planning Submitted: {counts['planning_submitted']}")
    print(f"  Early Stage: {counts['early_stage']}")
    return counts


def populate_cod_from_aemo(conn, dry_run=False):
    """Populate cod_current from AEMO full_year_commissioning for projects missing it."""

    # Get projects without cod_current that have AEMO commissioning data
    rows = conn.execute("""
        SELECT p.id, p.name, p.cod_current, a.full_year_commissioning
        FROM projects p
        JOIN aemo_generation_info a ON a.project_id = p.id
        WHERE a.full_year_commissioning IS NOT NULL
          AND a.full_year_commissioning != ''
        GROUP BY p.id
        ORDER BY a.full_year_commissioning DESC
    """).fetchall()

    updated = 0
    new_cod = 0
    for row in rows:
        pid = row['id']
        aemo_cod = str(row['full_year_commissioning']).strip()
        current_cod = row['cod_current']

        # Normalize AEMO COD to YYYY format or YYYY-MM if available
        if not aemo_cod or aemo_cod == 'None':
            continue

        if not current_cod or current_cod == '':
            # No COD at all — set from AEMO
            if not dry_run:
                conn.execute(
                    "UPDATE projects SET cod_current = ? WHERE id = ?",
                    (aemo_cod, pid)
                )
            new_cod += 1
        elif current_cod != aemo_cod:
            # COD changed — update and log
            if not dry_run:
                conn.execute(
                    "UPDATE projects SET cod_current = ? WHERE id = ?",
                    (aemo_cod, pid)
                )
                # Add cod_change timeline event if not already recorded
                existing = conn.execute("""
                    SELECT id FROM timeline_events
                    WHERE project_id = ? AND event_type = 'cod_change'
                    AND detail LIKE ?
                """, (pid, f'%{aemo_cod}%')).fetchone()

                if not existing:
                    conn.execute("""
                        INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail)
                        VALUES (?, date('now'), 'day', 'cod_change', 'COD estimate updated',
                                ?)
                    """, (pid, f'COD changed from {current_cod} to {aemo_cod} (source: AEMO Generation Information)'))
            updated += 1

    print(f"\nCOD Population:")
    print(f"  New COD set: {new_cod} projects")
    print(f"  COD updated (changed): {updated} projects")
    print(f"  Total with AEMO COD data: {len(rows)} projects")
    return new_cod, updated


def populate_cod_original(conn, dry_run=False):
    """For projects that have cod_current but no cod_original, set cod_original = cod_current.
    This establishes a baseline for future drift tracking."""

    rows = conn.execute("""
        SELECT id FROM projects
        WHERE cod_current IS NOT NULL AND cod_current != ''
          AND (cod_original IS NULL OR cod_original = '')
    """).fetchall()

    if not dry_run:
        conn.execute("""
            UPDATE projects
            SET cod_original = cod_current
            WHERE cod_current IS NOT NULL AND cod_current != ''
              AND (cod_original IS NULL OR cod_original = '')
        """)

    print(f"\nCOD Original baseline: set for {len(rows)} projects")
    return len(rows)


def main():
    parser = argparse.ArgumentParser(description='Enrich projects from AEMO data')
    parser.add_argument('--dry-run', action='store_true', help='Show what would change without writing')
    args = parser.parse_args()

    conn = get_connection()
    print("=" * 60)
    print("AEMO Data Enrichment")
    print("=" * 60)

    total_projects = conn.execute("SELECT COUNT(*) FROM projects").fetchone()[0]
    dev_projects = conn.execute("SELECT COUNT(*) FROM projects WHERE status = 'development'").fetchone()[0]
    print(f"Total projects: {total_projects}")
    print(f"Development projects: {dev_projects}")

    if args.dry_run:
        print("\n*** DRY RUN — no changes will be made ***\n")

    # Step 1: Classify development stages
    classify_development_stages(conn, dry_run=args.dry_run)

    # Step 2: Populate COD dates from AEMO
    populate_cod_from_aemo(conn, dry_run=args.dry_run)

    # Step 3: Set cod_original baseline
    populate_cod_original(conn, dry_run=args.dry_run)

    if not args.dry_run:
        conn.commit()
        print("\n✓ All changes committed to database")
    else:
        print("\n(dry run — no changes made)")

    conn.close()


if __name__ == '__main__':
    main()
