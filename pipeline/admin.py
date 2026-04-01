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
import json
import subprocess
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))
from db import get_connection

PIPELINE_DIR = os.path.dirname(os.path.abspath(__file__))

# Pipeline steps — each is a (label, script_path, args, source_id_in_db)
# source_id_in_db = None means it's a processor/generator (always run, no import tracking)
STEPS = [
    # ── Data Importers ──
    # NOTE: OpenElectricity API steps run FIRST — free plan has ~500 req/day.
    # Generation Profiles is the heaviest consumer, so it runs last among OE steps.
    ("AEMO Generation Info", "importers/import_aemo_gen_info.py", [], "aemo_generation_info"),
    ("OpenElectricity Performance", "importers/import_openelectricity.py", ["--year", str(datetime.now().year), "--ytd"], "openelectricity_performance"),
    ("OpenElectricity Metadata", "importers/harvest_facility_metadata.py", [], "openelectricity_metadata"),
    ("Coal Generation Monitor", "importers/import_coal_generation.py", [], "coal_generation"),
    ("EPBC Referrals", "importers/import_epbc.py", [], "epbc_referrals"),
    ("AEMO ISP / Grid Connection", "importers/import_aemo_isp.py", [], "aemo_isp"),
    ("News RSS Feed", "importers/import_news_rss.py", [], "news_rss"),
    ("Offtake Research (seed)", "research/research_offtakes.py", ["--seed"], "offtake_research"),
    ("Generation Profiles (heavy API)", "importers/import_generation_profiles.py", [], "generation_profiles"),

    # ── Processors ──
    ("AEMO Enrichment", "processors/enrich_from_aemo.py", [], None),
    ("Confidence Scoring", "processors/compute_confidence.py", [], None),
    ("League Tables", "processors/compute_league_tables.py", [], None),

    # ── Generators (analytics JSON) ──
    ("Data Quality Audit", "generators/generate_data_quality.py", [], None),
    ("Developer Quality Audit", "generators/generate_developer_quality.py", [], None),
    ("Monthly Performance", "generators/generate_monthly_performance.py", [], None),
    ("Wind & Solar Watch", "generate_watch_data.py", [], None),

    # ── Export ──
    ("JSON Export", "exporters/export_json.py", [], None),
]

# Frequency thresholds in days
FREQUENCY_THRESHOLDS = {
    "aemo_generation_info": 35,
    "openelectricity_performance": 35,
    "openelectricity_metadata": 100,
    "coal_generation": 35,
    "generation_profiles": 35,
    "epbc_referrals": 35,
    "aemo_isp": 90,
    "offtake_research": 35,
    "news_rss": 7,
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
    print("╔═══════════════════════════════════════════════════════════════════════╗")
    print("║                      AURES Data Admin  v2.8.0                       ║")
    print("╠═══════════════════════════════════════════════════════════════════════╣")
    print("║  #   Source                        Last Run       Status             ║")
    print("╠═══════════════════════════════════════════════════════════════════════╣")

    for i, (label, _, _, source_id) in enumerate(STEPS, 1):
        if label == "AEMO Enrichment":
            print("║  ── Processors ──────────────────────────────────────────────────  ║")
        elif label == "Data Quality Audit":
            print("║  ── Generators ──────────────────────────────────────────────────  ║")
        elif label == "JSON Export":
            print("║  ── Export ──────────────────────────────────────────────────────  ║")

        run = runs.get(source_id) if source_id else None
        if source_id:
            icon, status_text = status_icon(source_id, run)
            last_run = run.get('completed_at', run.get('started_at', ''))[:10] if run else 'never'
            line = f"║  {i:2d}.  {label:<30s}  {last_run:<13s}  {icon} {status_text:<12s}  ║"
        else:
            line = f"║  {i:2d}.  {label:<30s}  {'(processor)':<13s}  {'⚙️':2s} {'local':<12s}  ║"
        print(line)

    print("╠═══════════════════════════════════════════════════════════════════════╣")
    print("║  [1-17] Run step  [A] Run all  [S] Status  [Q] Quit               ║")
    print("╚═══════════════════════════════════════════════════════════════════════╝")
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
    """Run all pipeline steps in order and save a run log."""
    start_time = datetime.now()
    print("\n🚀 Running full pipeline...\n")
    results = []
    for i in range(len(STEPS)):
        step_start = datetime.now()
        success = run_step(i)
        step_duration = (datetime.now() - step_start).total_seconds()
        results.append((STEPS[i][0], success, step_duration))

    end_time = datetime.now()
    total_duration = (end_time - start_time).total_seconds()

    print(f"\n{'='*60}")
    print("  Pipeline Summary")
    print(f"{'='*60}")
    for label, success, duration in results:
        icon = "✅" if success else "❌"
        print(f"  {icon} {label} ({duration:.0f}s)")
    print(f"\n  Total time: {total_duration:.0f}s")
    print()

    # Save run log to frontend for display in the app
    save_pipeline_log(results, start_time, end_time)


def save_pipeline_log(results, start_time, end_time):
    """Save pipeline run summary to JSON for the frontend to display."""
    log_path = os.path.join(PIPELINE_DIR, '..', 'frontend', 'public', 'data', 'metadata', 'pipeline-log.json')

    # Load existing log (keep last 20 runs)
    existing_runs = []
    if os.path.exists(log_path):
        try:
            with open(log_path) as f:
                existing = json.load(f)
            existing_runs = existing.get('runs', [])
        except (json.JSONDecodeError, KeyError):
            pass

    # Build new run entry
    steps_log = []
    for label, success, duration in results:
        steps_log.append({
            'step': label,
            'success': success,
            'duration_seconds': round(duration, 1),
        })

    succeeded = sum(1 for _, s, _ in results if s)
    failed = sum(1 for _, s, _ in results if not s)

    new_run = {
        'started_at': start_time.isoformat(),
        'completed_at': end_time.isoformat(),
        'total_seconds': round((end_time - start_time).total_seconds(), 1),
        'steps_total': len(results),
        'steps_succeeded': succeeded,
        'steps_failed': failed,
        'steps': steps_log,
    }

    # Prepend and keep last 20
    existing_runs.insert(0, new_run)
    existing_runs = existing_runs[:20]

    with open(log_path, 'w') as f:
        json.dump({'runs': existing_runs}, f, indent=2)

    print(f"  📋 Pipeline log saved to {log_path}")


def run_auto():
    """Run only pipeline steps that are due based on frequency thresholds."""
    print("\n🤖 Auto mode — running only steps that are due...\n")
    runs = get_status()
    results = []

    for i, (label, script, step_args, source_id) in enumerate(STEPS):
        if source_id is None:
            # Always run processors and export
            success = run_step(i)
            results.append((label, success, 'always'))
            continue

        threshold = FREQUENCY_THRESHOLDS.get(source_id, 999)
        run = runs.get(source_id)
        days = days_since(run.get('completed_at') or run.get('started_at')) if run else None

        if days is None or days >= threshold:
            reason = f"never run" if days is None else f"{days}d since last (threshold: {threshold}d)"
            print(f"  📋 {label}: DUE — {reason}")
            success = run_step(i)
            results.append((label, success, reason))
        else:
            print(f"  ⏭️  {label}: skipping — {days}d since last (threshold: {threshold}d)")
            results.append((label, True, 'skipped'))

    print(f"\n{'='*60}")
    print("  Auto Pipeline Summary")
    print(f"{'='*60}")
    for label, success, reason in results:
        if reason == 'skipped':
            print(f"  ⏭️  {label} (skipped — not due)")
        else:
            icon = "✅" if success else "❌"
            print(f"  {icon} {label}")
    print()


def main():
    import argparse
    parser = argparse.ArgumentParser(description="AURES Data Admin")
    parser.add_argument('--status', action='store_true', help='Show status and exit')
    parser.add_argument('--run', type=int, help='Run step N (1-9)')
    parser.add_argument('--all', action='store_true', help='Run all steps')
    parser.add_argument('--auto', action='store_true', help='Run only steps that are due (for cron/automation)')
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

    if args.auto:
        run_auto()
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
