#!/usr/bin/env python3
"""
AURES Data Admin — Terminal-based pipeline management tool.

Shows data source status and allows running individual pipeline steps.

Usage:
    python3 pipeline/admin.py          # Interactive menu
    python3 pipeline/admin.py --status # Just show status table
    python3 pipeline/admin.py --run 1  # Run step 1 directly
    python3 pipeline/admin.py --all    # Run all steps in order
"""
import os
import sys
import subprocess
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from db import get_connection

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))

# Pipeline steps — each is a (label, script_path, args, source_id_in_db)
STEPS = [
    ("AEMO Generation Info", "importers/import_aemo_gen_info.py", [], "aemo_generation_info"),
    ("OpenElectricity Performance", "importers/import_openelectricity.py", [], "openelectricity_performance"),
    ("OpenElectricity Metadata", "importers/harvest_facility_metadata.py", [], "openelectricity_metadata"),
    ("EPBC Referrals", "importers/import_epbc.py", [], "epbc_referrals"),
    ("AEMO Enrichment", "processors/enrich_from_aemo.py", [], None),
    ("Confidence Scoring", "processors/compute_confidence.py", [], None),
    ("League Tables", "processors/compute_league_tables.py", [], None),
    ("Offtake Research (seed)", "research/research_offtakes.py", ["--seed"], "offtake_research"),
    ("JSON Export", "exporters/export_json.py", [], None),
]

# Frequency thresholds in days
FREQUENCY_THRESHOLDS = {
    "aemo_generation_info": 35,
    "openelectricity_performance": 35,
    "openelectricity_metadata": 100,
    "epbc_referrals": 35,
    "offtake_research": 35,
}


def get_status():
    """Fetch latest import_runs for each source."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT source, started_at, completed_at, status,
               records_imported, records_updated, records_new, error_message
        FROM import_runs
        WHERE id IN (SELECT MAX(id) FROM import_runs GROUP BY source)
        ORDER BY source
    """).fetchall()
    conn.close()
    return {r['source']: dict(r) for r in rows}


def days_since(date_str):
    """Calculate days since a date string."""
    if not date_str:
        return None
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
        return (now - dt).days
    except (ValueError, TypeError):
        return None


def status_icon(source_id, run_info):
    """Return status icon and label."""
    if not run_info:
        return "🔴", "Never Run"
    if run_info.get('status') == 'failed':
        return "🔴", "Failed"
    if run_info.get('status') == 'running':
        return "🟡", "Running"

    days = days_since(run_info.get('completed_at') or run_info.get('started_at'))
    if days is None:
        return "⚪", "Unknown"

    threshold = FREQUENCY_THRESHOLDS.get(source_id, 999)
    if days <= threshold * 0.7:
        return "🟢", f"{days}d ago"
    elif days <= threshold:
        return "🟡", f"{days}d ago"
    else:
        return "🔴", f"{days}d ago"


def print_status():
    """Print the status table."""
    runs = get_status()

    print()
    print("╔══════════════════════════════════════════════════════════════════╗")
    print("║                      AURES Data Admin                          ║")
    print("╠══════════════════════════════════════════════════════════════════╣")
    print("║  #  Source                        Last Run       Status        ║")
    print("╠══════════════════════════════════════════════════════════════════╣")

    for i, (label, _, _, source_id) in enumerate(STEPS, 1):
        run = runs.get(source_id) if source_id else None
        if source_id:
            icon, status_text = status_icon(source_id, run)
            last_run = run.get('completed_at', run.get('started_at', ''))[:10] if run else 'never'
            records = run.get('records_imported', 0) if run else 0
            line = f"║  {i}.  {label:<30s}  {last_run:<13s}  {icon} {status_text:<10s} ║"
        else:
            line = f"║  {i}.  {label:<30s}  {'(processor)':<13s}  {'⚙️':2s} {'local':<10s} ║"
        print(line)

    print("╠══════════════════════════════════════════════════════════════════╣")
    print("║  [1-9] Run step  [A] Run all  [S] Status  [Q] Quit            ║")
    print("╚══════════════════════════════════════════════════════════════════╝")
    print()


def run_step(step_index):
    """Run a single pipeline step."""
    label, script, args, _ = STEPS[step_index]
    script_path = os.path.join(PIPELINE_DIR, script)

    if not os.path.exists(script_path):
        print(f"  ⚠️  Script not found: {script_path}")
        return False

    print(f"\n{'='*60}")
    print(f"  Running: {label}")
    print(f"  Script:  {script}")
    print(f"{'='*60}\n")

    result = subprocess.run(
        [sys.executable, script_path] + args,
        cwd=os.path.join(PIPELINE_DIR, '..'),
    )

    if result.returncode == 0:
        print(f"\n  ✅ {label} completed successfully")
    else:
        print(f"\n  ❌ {label} failed (exit code {result.returncode})")

    return result.returncode == 0


def run_all():
    """Run all pipeline steps in order."""
    print("\n🚀 Running full pipeline...\n")
    results = []
    for i in range(len(STEPS)):
        success = run_step(i)
        results.append((STEPS[i][0], success))

    print(f"\n{'='*60}")
    print("  Pipeline Summary")
    print(f"{'='*60}")
    for label, success in results:
        icon = "✅" if success else "❌"
        print(f"  {icon} {label}")
    print()


def main():
    import argparse
    parser = argparse.ArgumentParser(description="AURES Data Admin")
    parser.add_argument('--status', action='store_true', help='Show status and exit')
    parser.add_argument('--run', type=int, help='Run step N (1-9)')
    parser.add_argument('--all', action='store_true', help='Run all steps')
    args = parser.parse_args()

    if args.status:
        print_status()
        return

    if args.run:
        if 1 <= args.run <= len(STEPS):
            run_step(args.run - 1)
        else:
            print(f"Invalid step: {args.run}. Must be 1-{len(STEPS)}")
        return

    if args.all:
        run_all()
        return

    # Interactive mode
    while True:
        print_status()
        try:
            choice = input("  Enter choice: ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            print("\n  Bye!")
            break

        if choice == 'q':
            print("  Bye!")
            break
        elif choice == 'a':
            run_all()
        elif choice == 's':
            continue  # Re-print status
        elif choice.isdigit():
            n = int(choice)
            if 1 <= n <= len(STEPS):
                run_step(n - 1)
                input("\n  Press Enter to continue...")
            else:
                print(f"  Invalid step: {n}")
        else:
            print(f"  Unknown command: {choice}")


if __name__ == '__main__':
    main()
