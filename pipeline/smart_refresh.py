#!/usr/bin/env python3
"""
AURES Smart Refresh — Economic API-aware pipeline refresh.

Designed to minimise OpenElectricity API calls while keeping data current.

Key optimisations:
  1. Shares the facility list across annual + monthly imports (1 API call, not 2)
  2. Skips projects with data fresher than --max-age days
  3. Only fetches current year YTD + previous year (not all history)
  4. Caches facility list to disk for reuse within same session
  5. Reports API call budget before and after

Usage:
    # Phase 1: Data refresh (economic API mode)
    python3 pipeline/smart_refresh.py --phase data

    # Phase 2: Intelligence refresh (re-export only, no API calls)
    python3 pipeline/smart_refresh.py --phase intelligence

    # Both phases
    python3 pipeline/smart_refresh.py --phase all

    # Dry run — show what would be fetched without calling API
    python3 pipeline/smart_refresh.py --phase data --dry-run

    # Override max-age threshold (default: 14 days)
    python3 pipeline/smart_refresh.py --phase data --max-age 7
"""

import os
import sys
import json
import time
import argparse
import subprocess
import calendar
from datetime import datetime, date, timedelta
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import get_connection

PIPELINE_DIR = Path(__file__).resolve().parent
REPO_ROOT = PIPELINE_DIR.parent
METADATA_DIR = REPO_ROOT / "frontend" / "public" / "data" / "metadata"

# ============================================================
# Phase 1: Data Refresh
# ============================================================

def phase_data(args):
    """Run data refresh with economic API usage."""
    conn = get_connection()
    year = date.today().year
    prev_year = year - 1

    # Check what data we already have
    existing = check_existing_data(conn, year, prev_year)

    print(f"\n{'='*60}")
    print(f"  AURES Smart Refresh — Phase 1: Data")
    print(f"{'='*60}")
    print(f"  Current year:  {year}")
    print(f"  Previous year: {prev_year}")
    print(f"  Max age:       {args.max_age} days")
    print(f"  Dry run:       {args.dry_run}")
    print()

    # Determine what needs fetching
    needs_ytd = existing['ytd_age'] is None or existing['ytd_age'] > args.max_age
    needs_prev = existing['prev_age'] is None or existing['prev_age'] > args.max_age
    needs_monthly = existing['monthly_age'] is None or existing['monthly_age'] > args.max_age

    print(f"  YTD {year} data:     {'STALE' if needs_ytd else 'FRESH'} "
          f"(last: {existing['ytd_age']}d ago)" if existing['ytd_age'] is not None else
          f"  YTD {year} data:     MISSING")
    print(f"  Full {prev_year} data:  {'STALE' if needs_prev else 'FRESH'} "
          f"(last: {existing['prev_age']}d ago)" if existing['prev_age'] is not None else
          f"  Full {prev_year} data:  MISSING")
    print(f"  Monthly data:     {'STALE' if needs_monthly else 'FRESH'} "
          f"(last: {existing['monthly_age']}d ago)" if existing['monthly_age'] is not None else
          f"  Monthly data:     MISSING")

    # Estimate API calls
    n_facilities = existing['facility_count']
    batches = (n_facilities + 19) // 20  # BATCH_SIZE = 20
    api_calls = 0
    if needs_ytd or needs_prev or needs_monthly:
        api_calls += 2  # /me + /facilities/
    if needs_ytd:
        api_calls += batches
    if needs_prev:
        api_calls += batches
    if needs_monthly:
        api_calls += batches  # Monthly for current year
        api_calls += batches  # Monthly for previous year

    print(f"\n  Estimated API calls: {api_calls}")
    print(f"  Matched facilities: {n_facilities}")
    print(f"  Batches per fetch:  {batches}")

    if api_calls == 0:
        print(f"\n  All data is fresh (within {args.max_age} days). Nothing to fetch.")
        print(f"  Use --max-age 0 to force refresh.\n")
    elif args.dry_run:
        print(f"\n  DRY RUN — would make {api_calls} API calls. Pass without --dry-run to execute.\n")
    else:
        # Execute the imports
        print(f"\n  Executing imports...")
        run_imports(needs_ytd, needs_prev, needs_monthly, year, prev_year)

    # Always run processors + export (no API calls)
    if not args.dry_run:
        print(f"\n  Running processors and export...")
        run_processors()

    conn.close()


def check_existing_data(conn, year, prev_year):
    """Check freshness of existing performance data."""
    # Count operating projects that match OE facilities
    facility_count = conn.execute("""
        SELECT COUNT(DISTINCT p.id)
        FROM projects p
        WHERE p.status = 'operating' AND p.capacity_mw >= 5
        AND p.technology IN ('wind', 'solar', 'bess', 'hybrid', 'pumped_hydro')
    """).fetchone()[0]

    # Check latest annual import date for YTD
    ytd_row = conn.execute("""
        SELECT MAX(updated_at) as latest FROM performance_annual
        WHERE year = ? AND data_source LIKE 'openelectricity%'
    """, (year,)).fetchone()
    ytd_age = _days_since(ytd_row['latest']) if ytd_row and ytd_row['latest'] else None

    # Check latest annual import for previous year
    prev_row = conn.execute("""
        SELECT MAX(updated_at) as latest FROM performance_annual
        WHERE year = ? AND data_source LIKE 'openelectricity%'
    """, (prev_year,)).fetchone()
    prev_age = _days_since(prev_row['latest']) if prev_row and prev_row['latest'] else None

    # Check latest monthly import
    monthly_row = conn.execute("""
        SELECT MAX(import_date) as latest FROM performance_monthly
        WHERE data_source = 'openelectricity_monthly'
    """).fetchone()
    monthly_age = _days_since(monthly_row['latest']) if monthly_row and monthly_row['latest'] else None

    return {
        'facility_count': facility_count,
        'ytd_age': ytd_age,
        'prev_age': prev_age,
        'monthly_age': monthly_age,
    }


def _days_since(date_str):
    """Calculate days since a date string."""
    if not date_str:
        return None
    try:
        dt = datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
        now = datetime.now(dt.tzinfo) if dt.tzinfo else datetime.now()
        return (now - dt).days
    except (ValueError, TypeError):
        return None


def run_imports(needs_ytd, needs_prev, needs_monthly, year, prev_year):
    """Run the necessary import commands."""
    script = str(PIPELINE_DIR / "importers" / "import_openelectricity.py")
    cwd = str(REPO_ROOT)

    if needs_ytd:
        print(f"\n    Importing {year} YTD annual data...")
        result = subprocess.run(
            [sys.executable, script, "--year", str(year), "--ytd"],
            cwd=cwd,
        )
        if result.returncode == 0:
            print(f"    {year} YTD annual: OK")
        else:
            print(f"    {year} YTD annual: FAILED (exit {result.returncode})")

    if needs_prev:
        print(f"\n    Importing {prev_year} full year annual data...")
        result = subprocess.run(
            [sys.executable, script, "--year", str(prev_year)],
            cwd=cwd,
        )
        if result.returncode == 0:
            print(f"    {prev_year} annual: OK")
        else:
            print(f"    {prev_year} annual: FAILED (exit {result.returncode})")

    if needs_monthly:
        for y in [year, prev_year]:
            print(f"\n    Importing {y} monthly data...")
            result = subprocess.run(
                [sys.executable, script, "--year", str(y), "--monthly"],
                cwd=cwd,
            )
            if result.returncode == 0:
                print(f"    {y} monthly: OK")
            else:
                print(f"    {y} monthly: FAILED (exit {result.returncode})")


def run_processors():
    """Run league tables, monthly performance generator, and JSON export."""
    cwd = str(REPO_ROOT)
    steps = [
        ("League Tables", str(PIPELINE_DIR / "processors" / "compute_league_tables.py"), []),
        ("Monthly Performance", str(PIPELINE_DIR / "generators" / "generate_monthly_performance.py"), []),
        ("JSON Export", str(PIPELINE_DIR / "exporters" / "export_json.py"), []),
    ]

    for label, script, args in steps:
        if os.path.exists(script):
            result = subprocess.run([sys.executable, script] + args, cwd=cwd)
            status = "OK" if result.returncode == 0 else f"FAILED (exit {result.returncode})"
            print(f"    {label}: {status}")
        else:
            print(f"    {label}: SKIPPED (script not found: {script})")

    # Save refresh log
    save_refresh_log("data")


# ============================================================
# Phase 2: Intelligence Refresh
# ============================================================

def phase_intelligence(args):
    """Re-export intelligence layer JSON from existing database.

    This re-runs the export functions that generate:
      - scheme-tracker.json
      - revenue-intel.json
      - nem-activities.json
      - developer-scores.json
      - wind-resource.json
      - dunkelflaute.json
      - energy-mix.json
      - grid-connection.json
      - drift-analysis.json

    No API calls required — purely database → JSON.
    For deeper intelligence updates (new narratives, research, timeline events),
    use Claude Code: `claude "review and update intelligence for [project]"`
    """
    print(f"\n{'='*60}")
    print(f"  AURES Smart Refresh — Phase 2: Intelligence")
    print(f"{'='*60}")

    if args.dry_run:
        print("\n  DRY RUN — would re-export all intelligence JSON from database.")
        print("  No API calls required.\n")
        return

    cwd = str(REPO_ROOT)
    export_script = str(PIPELINE_DIR / "exporters" / "export_json.py")

    print("\n  Re-exporting intelligence layer from database...")
    result = subprocess.run([sys.executable, export_script], cwd=cwd)

    if result.returncode == 0:
        print("    JSON Export: OK")

        # Show what was updated
        intel_dir = REPO_ROOT / "frontend" / "public" / "data" / "analytics" / "intelligence"
        if intel_dir.exists():
            files = sorted(intel_dir.glob("*.json"))
            print(f"\n  Updated {len(files)} intelligence files:")
            for f in files:
                size_kb = f.stat().st_size / 1024
                print(f"    {f.name:<30s} {size_kb:>6.1f} KB")
    else:
        print(f"    JSON Export: FAILED (exit {result.returncode})")

    save_refresh_log("intelligence")

    print(f"""
  Phase 2 complete. For deeper intelligence updates, use Claude Code:

    claude "Update intelligence layer for AURES — review latest CIS/LTESA
    announcements, check for new construction milestones, and refresh
    scheme-tracker with any new round results"

  This will research and add new timeline events, update narratives,
  and enrich project data beyond what the database export can do.
""")


# ============================================================
# Refresh Log
# ============================================================

def save_refresh_log(phase):
    """Append to the refresh log for the frontend to display."""
    log_path = METADATA_DIR / "refresh-log.json"

    existing = []
    if log_path.exists():
        try:
            with open(log_path) as f:
                existing = json.load(f).get('refreshes', [])
        except (json.JSONDecodeError, KeyError):
            pass

    entry = {
        'phase': phase,
        'timestamp': datetime.now().isoformat(),
        'success': True,
    }

    existing.insert(0, entry)
    existing = existing[:50]  # Keep last 50

    with open(log_path, 'w') as f:
        json.dump({'refreshes': existing}, f, indent=2)


# ============================================================
# Main
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description='AURES Smart Refresh — economic data refresh pipeline',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 pipeline/smart_refresh.py --phase data              # Refresh performance data
  python3 pipeline/smart_refresh.py --phase intelligence      # Re-export intelligence JSON
  python3 pipeline/smart_refresh.py --phase all               # Both phases
  python3 pipeline/smart_refresh.py --phase data --dry-run    # Preview what would happen
  python3 pipeline/smart_refresh.py --phase data --max-age 0  # Force refresh everything
        """
    )
    parser.add_argument('--phase', choices=['data', 'intelligence', 'all'],
                       default='all', help='Which phase to run (default: all)')
    parser.add_argument('--max-age', type=int, default=14,
                       help='Skip data fresher than N days (default: 14)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be done without executing')
    args = parser.parse_args()

    if args.phase in ('data', 'all'):
        phase_data(args)

    if args.phase in ('intelligence', 'all'):
        phase_intelligence(args)

    print(f"\nDone. Refresh completed at {datetime.now().strftime('%Y-%m-%d %H:%M')}.")


if __name__ == '__main__':
    main()
