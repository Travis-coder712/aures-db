"""
Status Validator — Infer correct project status from timeline events.

The AEMO Generation Information file often lags behind reality. A project may
have reached FID, started construction, or even begun commissioning before AEMO
updates its "Commitment Status" field. This validator cross-references timeline
events against the current status field and fixes mismatches.

Run modes:
  --check   : Report mismatches without fixing (default)
  --fix     : Fix mismatches in both data/ and frontend/public/data/ project JSONs
  --fix-db  : Fix mismatches in the SQLite database

Priority order: operating > commissioning > construction > development > withdrawn
"""

import json
import glob
import os
import sys
import sqlite3
from datetime import datetime

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROJECT_DIRS = [
    os.path.join(REPO_ROOT, 'frontend', 'public', 'data', 'projects'),
    os.path.join(REPO_ROOT, 'data', 'projects'),
]
DB_PATH = os.path.join(REPO_ROOT, 'pipeline', 'aures.db')

STATUS_PRIORITY = {
    'operating': 5,
    'commissioning': 4,
    'construction': 3,
    'development': 2,
    'proposed': 1,
    'withdrawn': 0,
}

TODAY = datetime.now().strftime('%Y-%m-%d')


def infer_status_from_timeline(timeline: list, current_status: str) -> tuple:
    """
    Infer the most advanced status a project should have based on its timeline events.
    Returns (inferred_status, reason).
    """
    best_status = current_status
    best_priority = STATUS_PRIORITY.get(current_status, 0)
    reason = None

    for event in timeline:
        event_type = event.get('event_type', '')
        event_date = event.get('date', '9999-12-31')

        # Only consider events that have already occurred
        if event_date > TODAY:
            continue

        inferred = None
        if event_type == 'cod' or event_type == 'first_generation':
            inferred = 'operating'
        elif event_type == 'commissioning_start':
            inferred = 'commissioning'
        elif event_type in ('construction_start', 'fid'):
            inferred = 'construction'

        if inferred:
            priority = STATUS_PRIORITY.get(inferred, 0)
            if priority > best_priority:
                best_status = inferred
                best_priority = priority
                reason = f"timeline event '{event_type}' on {event_date}"

    return best_status, reason


def validate_all(fix=False, fix_db=False):
    """Scan all project JSON files and validate status against timeline events."""
    issues = []
    fixes_applied = 0

    # Collect all project files from the first directory (frontend/public)
    project_files = {}
    for proj_dir in PROJECT_DIRS:
        for tech_dir in glob.glob(os.path.join(proj_dir, '*')):
            if not os.path.isdir(tech_dir):
                continue
            for f in glob.glob(os.path.join(tech_dir, '*.json')):
                pid = os.path.splitext(os.path.basename(f))[0]
                if pid not in project_files:
                    project_files[pid] = []
                project_files[pid].append(f)

    for pid, files in sorted(project_files.items()):
        # Read from the first file
        with open(files[0]) as fh:
            data = json.load(fh)

        current_status = data.get('status', 'development')
        timeline = data.get('timeline', [])

        if not timeline:
            continue

        inferred, reason = infer_status_from_timeline(timeline, current_status)

        if inferred != current_status and STATUS_PRIORITY.get(inferred, 0) > STATUS_PRIORITY.get(current_status, 0):
            issue = {
                'project_id': pid,
                'current_status': current_status,
                'inferred_status': inferred,
                'reason': reason,
                'files': files,
            }
            issues.append(issue)

            if fix:
                for f in files:
                    with open(f) as fh:
                        proj_data = json.load(fh)
                    proj_data['status'] = inferred
                    # Also update development_stage if it exists
                    if 'development_stage' in proj_data:
                        proj_data['development_stage'] = inferred
                    with open(f, 'w') as fh:
                        json.dump(proj_data, fh, indent=2, ensure_ascii=False)
                        fh.write('\n')
                fixes_applied += 1
                print(f"  ✓ FIXED: {pid}: {current_status} → {inferred} ({reason})")
            else:
                print(f"  ⚠ MISMATCH: {pid}: status='{current_status}' but should be '{inferred}' ({reason})")

    # Also check for COD mismatches (past COD but not operating)
    for pid, files in sorted(project_files.items()):
        with open(files[0]) as fh:
            data = json.load(fh)

        cod = data.get('cod_current', '')
        status = data.get('status', '')

        # If COD is in the past and status is construction, flag it
        if cod and cod <= TODAY and status == 'construction':
            print(f"  ℹ COD REVIEW: {pid}: COD={cod} but status='construction' — may be commissioning/operating (check manually)")

    if fix_db and os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        for issue in issues:
            conn.execute(
                "UPDATE projects SET status = ? WHERE id = ?",
                (issue['inferred_status'], issue['project_id'])
            )
        conn.commit()
        conn.close()
        print(f"\n  Database updated: {len(issues)} status changes")

    print(f"\nStatus validation complete:")
    print(f"  Projects scanned: {len(project_files)}")
    print(f"  Mismatches found: {len(issues)}")
    if fix:
        print(f"  Fixes applied: {fixes_applied}")

    return issues


if __name__ == '__main__':
    fix = '--fix' in sys.argv
    fix_db = '--fix-db' in sys.argv
    if fix or fix_db:
        print("Running status validator with FIX mode...\n")
    else:
        print("Running status validator (check only — use --fix to apply corrections)...\n")
    validate_all(fix=fix, fix_db=fix_db)
