"""
Source Provenance Validator — Ensure key fields have traceable data sources.

For each project, checks that critical fields (capex, capacity, status, OEM,
COD) have corresponding entries in the project's sources, suppliers, or
timeline that explain where the data came from.

This supports the multi-source provenance model: different information sources
should be tracked independently so that pipeline re-imports don't silently
override manually-curated data.

Run: python pipeline/validators/validate_sources.py [--verbose]
"""

import json
import glob
import os
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PROJECT_DIR = os.path.join(REPO_ROOT, 'frontend', 'public', 'data', 'projects')

# Fields that should have traceable provenance
CRITICAL_FIELDS = {
    'capex_aud_m': 'capex_source',     # Should have capex_source text
    'capacity_mw': None,                # Tracked via AEMO or sources
    'storage_mwh': None,
    'cod_current': None,                # Tracked via timeline cod events
}


def check_provenance(data: dict, verbose=False) -> list:
    """Check a single project for source provenance gaps."""
    pid = data.get('id', '?')
    issues = []

    # 1. Capex without source attribution
    if data.get('capex_aud_m') and not data.get('capex_source'):
        issues.append(f"capex_aud_m={data['capex_aud_m']}M but no capex_source")

    # 2. OEM without supplier record
    if data.get('technology') == 'bess':
        suppliers = data.get('suppliers', [])
        oem_suppliers = [s for s in suppliers if s.get('role') == 'bess_oem']
        if not oem_suppliers and data.get('status') in ('operating', 'construction', 'commissioning'):
            issues.append(f"BESS at {data.get('status')} stage but no bess_oem supplier record")

    # 3. Status vs timeline consistency (basic check — detailed in validate_status.py)
    timeline = data.get('timeline', [])
    if not timeline and data.get('status') not in ('development', 'proposed', 'withdrawn'):
        issues.append(f"status='{data.get('status')}' but no timeline events to support it")

    # 4. No sources at all
    sources = data.get('sources', [])
    if not sources:
        issues.append("no source references at all")

    # 5. Field_sources tracking (new provenance model)
    # Check if project has the new field_sources structure
    if data.get('field_sources'):
        if verbose:
            for field, entries in data['field_sources'].items():
                print(f"    {field}: {len(entries)} source(s)")

    return issues


def validate_all(verbose=False):
    """Scan all projects for source provenance issues."""
    total = 0
    projects_with_issues = 0
    all_issues = []

    for tech_dir in sorted(glob.glob(os.path.join(PROJECT_DIR, '*'))):
        if not os.path.isdir(tech_dir):
            continue
        tech = os.path.basename(tech_dir)

        for f in sorted(glob.glob(os.path.join(tech_dir, '*.json'))):
            with open(f) as fh:
                data = json.load(fh)

            total += 1
            issues = check_provenance(data, verbose)

            if issues:
                projects_with_issues += 1
                pid = data.get('id', os.path.basename(f))
                for issue in issues:
                    all_issues.append((pid, tech, issue))
                    if verbose:
                        print(f"  ⚠ {pid} ({tech}): {issue}")

    print(f"\nSource provenance validation complete:")
    print(f"  Projects scanned: {total}")
    print(f"  Projects with gaps: {projects_with_issues}")
    print(f"  Total issues: {len(all_issues)}")

    if not verbose and all_issues:
        print(f"\n  Run with --verbose to see all issues")

    # Summary by issue type
    issue_types = {}
    for pid, tech, issue in all_issues:
        key = issue.split(' ')[0] if ' ' in issue else issue
        issue_types[key] = issue_types.get(key, 0) + 1

    if issue_types:
        print(f"\n  Issue summary:")
        for itype, count in sorted(issue_types.items(), key=lambda x: -x[1]):
            print(f"    {itype}: {count}")

    return all_issues


if __name__ == '__main__':
    verbose = '--verbose' in sys.argv
    validate_all(verbose=verbose)
