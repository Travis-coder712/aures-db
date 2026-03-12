"""
Project Enrichment Tool
=======================
Interactive tool to enrich a project with manually verified data.
Shows current data completeness, web research results, and provides
structured prompts for entering PPAs, planning status, COD history, etc.

All data entered requires a source URL for attribution.

Usage:
    python3 pipeline/research/enrich_project.py --project melbourne-renewable-energy-hub-bess
    python3 pipeline/research/enrich_project.py --project coopers-gap-wind --show-research
"""

import os
import sys
import json
import argparse
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from db import get_connection

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'output')


def show_project_completeness(conn, project_id):
    """Show current data completeness for a project."""
    project = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not project:
        return None

    project = dict(project)

    print("\n" + "=" * 60)
    print(f"  {project['name']}")
    print(f"  {project['technology'].upper()} | {project['capacity_mw']} MW | {project['state']} | {project['status']}")
    print("=" * 60)

    # Check field population
    fields = {
        'Developer': project.get('current_developer'),
        'Operator': project.get('current_operator'),
        'COD Current': project.get('cod_current'),
        'COD Original': project.get('cod_original'),
        'REZ': project.get('rez'),
        'LGA': project.get('lga'),
        'Connection Status': project.get('connection_status'),
        'Development Stage': project.get('development_stage'),
        'Notable': project.get('notable'),
        'Data Confidence': project.get('data_confidence'),
    }

    print("\nCore Fields:")
    for field, value in fields.items():
        status = "✓" if value else "✗"
        color = "" if value else " (missing)"
        print(f"  {status} {field}: {value or '—'}{color}")

    # Count related records
    timeline_count = conn.execute(
        "SELECT COUNT(*) FROM timeline_events WHERE project_id = ?", (project_id,)
    ).fetchone()[0]
    offtake_count = conn.execute(
        "SELECT COUNT(*) FROM offtakes WHERE project_id = ?", (project_id,)
    ).fetchone()[0]
    supplier_count = conn.execute(
        "SELECT COUNT(*) FROM suppliers WHERE project_id = ?", (project_id,)
    ).fetchone()[0]
    ownership_count = conn.execute(
        "SELECT COUNT(*) FROM ownership_history WHERE project_id = ?", (project_id,)
    ).fetchone()[0]
    source_count = conn.execute(
        "SELECT COUNT(*) FROM data_sources WHERE project_id = ?", (project_id,)
    ).fetchone()[0]

    print(f"\nRelated Records:")
    print(f"  Timeline events: {timeline_count}")
    print(f"  Offtakes/PPAs:   {offtake_count}")
    print(f"  Suppliers:       {supplier_count}")
    print(f"  Ownership:       {ownership_count}")
    print(f"  Source links:    {source_count}")

    return project


def show_research_results(project_id):
    """Show web research results if available."""
    filepath = os.path.join(OUTPUT_DIR, f"{project_id}.json")
    if not os.path.exists(filepath):
        print(f"\nNo research report found. Run:")
        print(f"  python3 pipeline/research/web_research.py --id {project_id}")
        return None

    with open(filepath) as f:
        report = json.load(f)

    print(f"\nWeb Research ({report.get('researched_at', 'unknown date')}):")
    print(f"  Articles found: {report['summary']['articles_found']}")

    for category in ['cod_mentions', 'ppa_mentions', 'planning_mentions', 'ownership_mentions', 'cost_mentions']:
        items = report['extracted'].get(category, [])
        if items:
            label = category.replace('_mentions', '').replace('_', ' ').title()
            print(f"\n  {label} ({len(items)} mentions):")
            for item in items[:3]:
                print(f"    \"{item['match']}\"")
                if item.get('article_date'):
                    print(f"    Date: {item['article_date']} | Source: {item['source_url'][:60]}...")
                print()

    return report


def add_offtake(conn, project_id):
    """Interactively add an offtake/PPA record."""
    print("\n--- Add Offtake/PPA ---")

    counterparty = input("Counterparty (e.g. 'Origin Energy'): ").strip()
    if not counterparty:
        print("Cancelled.")
        return

    offtake_type = input("Type (ppa/tolling/merchant/government) [ppa]: ").strip() or 'ppa'
    volume_mw = input("Volume MW (or press Enter to skip): ").strip()
    duration_years = input("Duration years (or Enter to skip): ").strip()
    start_date = input("Start date (YYYY or YYYY-MM, or Enter to skip): ").strip()
    source_url = input("Source URL (required): ").strip()

    if not source_url:
        print("Source URL required. Cancelled.")
        return

    conn.execute("""
        INSERT INTO offtakes (project_id, counterparty, offtake_type, volume_mw, duration_years, start_date)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        project_id, counterparty, offtake_type,
        float(volume_mw) if volume_mw else None,
        int(duration_years) if duration_years else None,
        start_date or None,
    ))

    # Add source
    conn.execute("""
        INSERT INTO data_sources (project_id, field_name, source_url, source_name, retrieved_date)
        VALUES (?, 'offtake', ?, ?, date('now'))
    """, (project_id, source_url, f"Offtake: {counterparty}"))

    conn.commit()
    print(f"  ✓ Added offtake: {counterparty} ({offtake_type})")


def add_planning_event(conn, project_id):
    """Interactively add a planning timeline event."""
    print("\n--- Add Planning Event ---")

    event_type = input("Type (planning_submitted/planning_approved/planning_rejected) [planning_approved]: ").strip() or 'planning_approved'
    date = input("Date (YYYY-MM-DD or YYYY-MM or YYYY): ").strip()
    if not date:
        print("Date required. Cancelled.")
        return

    precision = 'day' if len(date) > 7 else ('month' if len(date) > 4 else 'year')
    title = input(f"Title (e.g. 'NSW Planning Approval'): ").strip()
    detail = input("Detail (optional): ").strip()
    source_url = input("Source URL (required): ").strip()

    if not source_url:
        print("Source URL required. Cancelled.")
        return

    conn.execute("""
        INSERT INTO timeline_events (project_id, date, date_precision, event_type, title, detail)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (project_id, date, precision, event_type, title or event_type.replace('_', ' ').title(), detail or None))

    # Add source
    conn.execute("""
        INSERT INTO data_sources (project_id, field_name, source_url, source_name, retrieved_date)
        VALUES (?, ?, ?, ?, date('now'))
    """, (project_id, event_type, source_url, title or event_type))

    # Update development_stage if this is a planning event
    if event_type == 'planning_approved':
        conn.execute("UPDATE projects SET development_stage = 'planning_approved' WHERE id = ?", (project_id,))
    elif event_type == 'planning_submitted':
        current_stage = conn.execute("SELECT development_stage FROM projects WHERE id = ?", (project_id,)).fetchone()
        if current_stage and current_stage['development_stage'] != 'planning_approved':
            conn.execute("UPDATE projects SET development_stage = 'planning_submitted' WHERE id = ?", (project_id,))

    conn.commit()
    print(f"  ✓ Added {event_type} event: {title}")


def add_cod_history(conn, project_id):
    """Interactively add a COD history entry."""
    print("\n--- Add COD History Entry ---")

    estimate_date = input("COD estimate (YYYY or YYYY-MM): ").strip()
    if not estimate_date:
        print("Cancelled.")
        return

    reported_date = input("When was this reported? (YYYY-MM-DD or YYYY-MM): ").strip()
    source = input("Source name (e.g. 'AEMO Gen Info Q1 2025'): ").strip()
    source_url = input("Source URL (required): ").strip()

    if not source_url:
        print("Source URL required. Cancelled.")
        return

    conn.execute("""
        INSERT INTO cod_history (project_id, estimate_date, reported_date, source)
        VALUES (?, ?, ?, ?)
    """, (project_id, estimate_date, reported_date or None, source or None))

    # Add source
    conn.execute("""
        INSERT INTO data_sources (project_id, field_name, source_url, source_name, retrieved_date)
        VALUES (?, 'cod_history', ?, ?, date('now'))
    """, (project_id, source_url, source or 'COD history'))

    # Update cod_current if this is newer
    update = input(f"Update cod_current to {estimate_date}? (y/n) [n]: ").strip().lower()
    if update == 'y':
        conn.execute("UPDATE projects SET cod_current = ? WHERE id = ?", (estimate_date, project_id))

    conn.commit()
    print(f"  ✓ Added COD history: {estimate_date}")


def add_notable(conn, project_id):
    """Add a notable fact about the project."""
    print("\n--- Add Notable Fact ---")

    notable = input("Notable fact: ").strip()
    if not notable:
        print("Cancelled.")
        return

    source_url = input("Source URL (required): ").strip()
    if not source_url:
        print("Source URL required. Cancelled.")
        return

    # Append to existing notable text
    current = conn.execute("SELECT notable FROM projects WHERE id = ?", (project_id,)).fetchone()
    existing = current['notable'] or ''
    updated = f"{existing}\n{notable}".strip() if existing else notable

    conn.execute("UPDATE projects SET notable = ? WHERE id = ?", (updated, project_id))

    conn.execute("""
        INSERT INTO data_sources (project_id, field_name, source_url, source_name, retrieved_date)
        VALUES (?, 'notable', ?, 'Notable fact', date('now'))
    """, (project_id, source_url))

    conn.commit()
    print(f"  ✓ Added notable fact")


def main():
    parser = argparse.ArgumentParser(description='Interactively enrich a project')
    parser.add_argument('--project', required=True, help='Project ID (slug)')
    parser.add_argument('--show-research', action='store_true', help='Show web research results')
    args = parser.parse_args()

    conn = get_connection()

    project = show_project_completeness(conn, args.project)
    if not project:
        print(f"Project not found: {args.project}")
        sys.exit(1)

    if args.show_research:
        show_research_results(args.project)

    # Interactive menu
    while True:
        print("\n--- Actions ---")
        print("  1. Add offtake/PPA")
        print("  2. Add planning event")
        print("  3. Add COD history entry")
        print("  4. Add notable fact")
        print("  5. Show research results")
        print("  6. Refresh completeness")
        print("  q. Quit")

        choice = input("\nChoice: ").strip().lower()

        if choice == '1':
            add_offtake(conn, args.project)
        elif choice == '2':
            add_planning_event(conn, args.project)
        elif choice == '3':
            add_cod_history(conn, args.project)
        elif choice == '4':
            add_notable(conn, args.project)
        elif choice == '5':
            show_research_results(args.project)
        elif choice == '6':
            show_project_completeness(conn, args.project)
        elif choice == 'q':
            break

    conn.close()
    print("\nDone. Run export to update JSON:")
    print("  python3 pipeline/exporters/export_json.py")


if __name__ == '__main__':
    main()
