#!/usr/bin/env python3
"""
AURES Data Quality Audit

Scans project files and scheme data to detect:
  1. Identity confusion — similar names that may be duplicates or mixed up
  2. Cross-reference mismatches — scheme project_ids pointing to wrong records
  3. Multi-scheme duplicates — same project in multiple rounds (potential double-count)
  4. Status drift — scheme stage doesn't match project file status
  5. Capacity discrepancies — scheme capacity doesn't match project capacity
  6. Orphaned references — scheme project_ids with no matching project file
  7. Name mismatches — scheme name differs significantly from project file name

Output: frontend/public/data/analytics/data-quality.json
"""

import json
import os
import re
import sys
from pathlib import Path
from difflib import SequenceMatcher
from collections import defaultdict
from datetime import datetime

# ── paths ──────────────────────────────────────────────────────────
REPO = Path(__file__).resolve().parent.parent.parent
PUBLIC_DATA = REPO / "frontend" / "public" / "data"
PROJECTS_DIR = PUBLIC_DATA / "projects"
OUTPUT_FILE = PUBLIC_DATA / "analytics" / "data-quality.json"
SCHEME_ROUNDS_TS = REPO / "frontend" / "src" / "data" / "scheme-rounds.ts"
ESG_TRACKER_TS = REPO / "frontend" / "src" / "data" / "esg-tracker-data.ts"


def load_all_projects() -> dict:
    """Load all project JSON files into {project_id: data} dict."""
    projects = {}
    for tech_dir in PROJECTS_DIR.iterdir():
        if not tech_dir.is_dir():
            continue
        for pf in tech_dir.glob("*.json"):
            try:
                data = json.loads(pf.read_text())
                pid = data.get("id", pf.stem)
                projects[pid] = data
            except (json.JSONDecodeError, KeyError):
                pass
    return projects


def parse_scheme_entries_from_ts(filepath: Path) -> list[dict]:
    """
    Extract scheme project entries from TypeScript source files.
    Parses entries like: { name: 'X', projectId: 'y', ... capacityMW: 100, ... }
    or: { name: 'X', ... project_id: 'y', ... capacity_mw: 100, ... }
    """
    if not filepath.exists():
        return []

    text = filepath.read_text()
    entries = []

    # Match object literals that have a name field
    # We look for blocks between { and },
    pattern = re.compile(
        r"\{\s*"
        r"name:\s*['\"]([^'\"]+)['\"]"
        r"(.*?)"
        r"\}",
        re.DOTALL
    )

    for m in pattern.finditer(text):
        name = m.group(1)
        rest = m.group(2)

        entry = {"name": name, "source_file": filepath.name}

        # Extract project_id or projectId
        pid_match = re.search(r"(?:project_id|projectId):\s*['\"]([^'\"]+)['\"]", rest)
        if pid_match:
            entry["project_id"] = pid_match.group(1)

        # Extract capacity
        cap_match = re.search(r"(?:capacity_mw|capacityMW):\s*(\d+(?:\.\d+)?)", rest)
        if cap_match:
            entry["capacity_mw"] = float(cap_match.group(1))

        # Extract storage
        stor_match = re.search(r"(?:storage_mwh|storageMWh):\s*(\d+(?:\.\d+)?)", rest)
        if stor_match:
            entry["storage_mwh"] = float(stor_match.group(1))

        # Extract technology
        tech_match = re.search(r"technology:\s*['\"]([^'\"]+)['\"]", rest)
        if tech_match:
            entry["technology"] = tech_match.group(1)

        # Extract state
        state_match = re.search(r"state:\s*['\"]([^'\"]+)['\"]", rest)
        if state_match:
            entry["state"] = state_match.group(1)

        # Extract stage/status
        stage_match = re.search(r"stage:\s*['\"]([^'\"]+)['\"]", rest)
        if stage_match:
            entry["stage"] = stage_match.group(1)

        # Extract round/roundId
        round_match = re.search(r"roundId:\s*['\"]([^'\"]+)['\"]", rest)
        if round_match:
            entry["round_id"] = round_match.group(1)

        round_name_match = re.search(r"round:\s*['\"]([^'\"]+)['\"]", rest)
        if round_name_match:
            entry["round"] = round_name_match.group(1)

        # Extract developer
        dev_match = re.search(r"developer:\s*['\"]([^'\"]+)['\"]", rest)
        if dev_match:
            entry["developer"] = dev_match.group(1)

        entries.append(entry)

    return entries


def name_similarity(a: str, b: str) -> float:
    """Normalized similarity between two project names."""
    # Strip common suffixes for comparison
    suffixes = [" Wind Farm", " Solar Farm", " BESS", " Battery", " Solar Power Station",
                " Solar Farm and BESS", " Energy Storage System", " Power Station"]
    a_clean, b_clean = a, b
    for s in suffixes:
        a_clean = a_clean.replace(s, "")
        b_clean = b_clean.replace(s, "")
    return SequenceMatcher(None, a_clean.lower(), b_clean.lower()).ratio()


def is_known_variant(name1: str, name2: str) -> bool:
    """Check if two similar names are a known legitimate pattern (stages, phases, components)."""
    # Strip to base name for comparison
    n1, n2 = name1.lower(), name2.lower()

    # Pattern: explicit stage/phase/connection numbering (Stage 1 vs Stage 2, etc.)
    stage_pattern = re.compile(r'(stage|phase|connection)\s*\d|[-–]\s*(stage|phase)\s*\d', re.IGNORECASE)
    if stage_pattern.search(n1) and stage_pattern.search(n2):
        return True

    # Pattern: numbered suffixes (BESS 1 vs BESS 2, Farm 1 vs Farm 2)
    num_suffix = re.compile(r'\b(\d+[ab]?)\s*$')
    m1, m2 = num_suffix.search(n1.strip()), num_suffix.search(n2.strip())
    if m1 and m2 and m1.group(1) != m2.group(1):
        # Check if the base (before the number) is the same
        base1 = n1[:m1.start()].strip().rstrip('-– ')
        base2 = n2[:m2.start()].strip().rstrip('-– ')
        if SequenceMatcher(None, base1, base2).ratio() > 0.95:
            return True

    # Pattern: co-located different technologies (Solar + BESS at same site)
    tech_words = {"solar", "bess", "battery", "wind", "storage", "hybrid"}
    words1 = set(re.findall(r'\w+', n1)) & tech_words
    words2 = set(re.findall(r'\w+', n2)) & tech_words
    if words1 != words2 and words1 and words2:
        # Different tech types at likely same location — expected
        base1 = re.sub(r'\b(' + '|'.join(tech_words) + r')\b', '', n1).strip()
        base2 = re.sub(r'\b(' + '|'.join(tech_words) + r')\b', '', n2).strip()
        if SequenceMatcher(None, base1, base2).ratio() > 0.85:
            return True

    # Pattern: "North"/"South"/"East"/"West" variants
    directions = {"north", "south", "east", "west"}
    d1 = set(re.findall(r'\w+', n1)) & directions
    d2 = set(re.findall(r'\w+', n2)) & directions
    if d1 and d2 and d1 != d2:
        return True

    # Pattern: KCI suffix variants
    if '- kci' in n1.replace('(kci)', '- kci') or '- kci' in n2.replace('(kci)', '- kci'):
        base1 = re.sub(r'\s*[-–]\s*kci|\(kci\)', '', n1).strip()
        base2 = re.sub(r'\s*[-–]\s*kci|\(kci\)', '', n2).strip()
        if SequenceMatcher(None, base1, base2).ratio() > 0.85:
            return True

    return False


def find_similar_project_names(projects: dict, threshold: float = 0.80) -> list[dict]:
    """Find pairs of projects with similar names that could be confused.
    Filters out known legitimate patterns (stages, co-located tech, numbered suffixes)."""
    issues = []
    names = [(pid, p.get("name", pid)) for pid, p in projects.items()]

    for i, (pid1, name1) in enumerate(names):
        for pid2, name2 in names[i+1:]:
            if pid1 == pid2:
                continue
            sim = name_similarity(name1, name2)
            if sim >= threshold and sim < 1.0:
                # Skip known legitimate variant patterns
                if is_known_variant(name1, name2):
                    continue

                p1, p2 = projects[pid1], projects[pid2]
                issues.append({
                    "type": "similar_names",
                    "severity": "warning" if sim < 0.9 else "high",
                    "project_a": {"id": pid1, "name": name1, "status": p1.get("status", "unknown"),
                                  "capacity_mw": p1.get("capacity_mw"), "technology": p1.get("technology")},
                    "project_b": {"id": pid2, "name": name2, "status": p2.get("status", "unknown"),
                                  "capacity_mw": p2.get("capacity_mw"), "technology": p2.get("technology")},
                    "similarity": round(sim, 3),
                    "message": f"Similar names: '{name1}' ({p1.get('status')}, {p1.get('capacity_mw')} MW) vs '{name2}' ({p2.get('status')}, {p2.get('capacity_mw')} MW) — verify these are distinct projects"
                })
    return issues


def check_scheme_cross_references(projects: dict, scheme_entries: list[dict]) -> list[dict]:
    """Check scheme entries against project files for mismatches."""
    issues = []

    for entry in scheme_entries:
        pid = entry.get("project_id")
        if not pid:
            continue

        # 1. Orphaned reference
        if pid not in projects:
            issues.append({
                "type": "orphaned_reference",
                "severity": "high",
                "scheme_entry": entry["name"],
                "project_id": pid,
                "source": entry.get("source_file", "unknown"),
                "message": f"Scheme entry '{entry['name']}' references project_id '{pid}' which does not exist"
            })
            continue

        project = projects[pid]

        # 2. Name mismatch
        sim = name_similarity(entry["name"], project.get("name", ""))
        if sim < 0.6:
            issues.append({
                "type": "name_mismatch",
                "severity": "high",
                "scheme_entry": entry["name"],
                "project_id": pid,
                "project_name": project.get("name"),
                "similarity": round(sim, 3),
                "source": entry.get("source_file", "unknown"),
                "message": f"Scheme name '{entry['name']}' doesn't match project name '{project.get('name')}' (similarity: {sim:.0%})"
            })

        # 3. Capacity discrepancy (>20% difference)
        # Note: scheme-contracted capacity can legitimately differ from total project capacity
        # (e.g. Stage 1 of a multi-stage project, or partial capacity contracted)
        scheme_cap = entry.get("capacity_mw")
        project_cap = project.get("capacity_mw")
        if scheme_cap and project_cap and project_cap > 0:
            diff_pct = abs(scheme_cap - project_cap) / project_cap
            if diff_pct > 0.20:
                # If scheme name contains "Stage" and capacity < project, likely legitimate
                is_staged = bool(re.search(r'stage|phase', entry["name"], re.IGNORECASE))
                severity = "info" if (is_staged and scheme_cap < project_cap) else (
                    "warning" if diff_pct < 0.5 else "high"
                )
                issues.append({
                    "type": "capacity_mismatch",
                    "severity": severity,
                    "scheme_entry": entry["name"],
                    "project_id": pid,
                    "scheme_capacity_mw": scheme_cap,
                    "project_capacity_mw": project_cap,
                    "difference_pct": round(diff_pct * 100, 1),
                    "source": entry.get("source_file", "unknown"),
                    "message": f"'{entry['name']}': scheme says {scheme_cap} MW but project file says {project_cap} MW ({diff_pct:.0%} difference)"
                })

        # 4. Status drift
        scheme_stage = entry.get("stage")
        project_status = project.get("status")
        if scheme_stage and project_status:
            # Normalize comparison
            stage_map = {"operating": "operating", "construction": "construction",
                         "development": "development", "commissioning": "commissioning"}
            s_stage = stage_map.get(scheme_stage, scheme_stage)
            p_status = stage_map.get(project_status, project_status)
            if s_stage != p_status:
                issues.append({
                    "type": "status_drift",
                    "severity": "warning",
                    "scheme_entry": entry["name"],
                    "project_id": pid,
                    "scheme_stage": scheme_stage,
                    "project_status": project_status,
                    "source": entry.get("source_file", "unknown"),
                    "message": f"'{entry['name']}': scheme says '{scheme_stage}' but project file says '{project_status}'"
                })

        # 5. Technology mismatch
        scheme_tech = entry.get("technology")
        project_tech = project.get("technology")
        if scheme_tech and project_tech:
            # Allow hybrid to match solar or bess
            tech_compatible = (
                scheme_tech == project_tech or
                (scheme_tech in ("solar", "bess") and project_tech == "hybrid") or
                (project_tech in ("solar", "bess") and scheme_tech == "hybrid")
            )
            if not tech_compatible:
                issues.append({
                    "type": "technology_mismatch",
                    "severity": "warning",
                    "scheme_entry": entry["name"],
                    "project_id": pid,
                    "scheme_technology": scheme_tech,
                    "project_technology": project_tech,
                    "source": entry.get("source_file", "unknown"),
                    "message": f"'{entry['name']}': scheme says '{scheme_tech}' but project file says '{project_tech}'"
                })

    return issues


def check_multi_scheme_duplicates(scheme_entries: list[dict]) -> list[dict]:
    """Find project_ids that appear in multiple scheme rounds."""
    issues = []
    pid_rounds = defaultdict(list)

    for entry in scheme_entries:
        pid = entry.get("project_id")
        if pid:
            round_info = entry.get("round", entry.get("round_id", "unknown"))
            pid_rounds[pid].append({
                "name": entry["name"],
                "round": round_info,
                "capacity_mw": entry.get("capacity_mw"),
                "source": entry.get("source_file", "unknown")
            })

    for pid, rounds in pid_rounds.items():
        if len(rounds) > 1:
            # Check if capacities differ (potential double-count issue)
            capacities = [r["capacity_mw"] for r in rounds if r.get("capacity_mw")]
            names = [r["name"] for r in rounds]
            round_names = [r["round"] for r in rounds]

            severity = "info"
            if len(set(capacities)) > 1:
                severity = "high"  # Different capacities = likely double-count
            elif len(set(names)) > 1:
                severity = "warning"  # Different names = could be confusing

            issues.append({
                "type": "multi_scheme_duplicate",
                "severity": severity,
                "project_id": pid,
                "appearances": rounds,
                "message": f"'{pid}' appears in {len(rounds)} scheme entries: {', '.join(round_names)} — verify not double-counted"
            })

    return issues


def check_projects_without_coordinates(projects: dict) -> list[dict]:
    """Flag operating/construction projects missing coordinates."""
    issues = []
    for pid, p in projects.items():
        status = p.get("status", "")
        if status in ("operating", "construction", "commissioning"):
            coords = p.get("coordinates")
            if not coords or not coords.get("lat") or not coords.get("lng"):
                issues.append({
                    "type": "missing_coordinates",
                    "severity": "info",
                    "project_id": pid,
                    "name": p.get("name", pid),
                    "status": status,
                    "message": f"'{p.get('name', pid)}' ({status}) has no coordinates — won't appear on map"
                })
    return issues


def check_empty_timelines(projects: dict) -> list[dict]:
    """Flag operating/construction projects with no timeline events."""
    issues = []
    for pid, p in projects.items():
        status = p.get("status", "")
        if status in ("operating", "construction", "commissioning"):
            timeline = p.get("timeline", [])
            if len(timeline) == 0:
                issues.append({
                    "type": "empty_timeline",
                    "severity": "info",
                    "project_id": pid,
                    "name": p.get("name", pid),
                    "status": status,
                    "message": f"'{p.get('name', pid)}' ({status}) has no timeline events"
                })
    return issues


def generate_report(all_issues: list[dict]) -> dict:
    """Generate structured report from all issues."""
    by_type = defaultdict(list)
    by_severity = defaultdict(list)

    for issue in all_issues:
        by_type[issue["type"]].append(issue)
        by_severity[issue["severity"]].append(issue)

    summary = {
        "total_issues": len(all_issues),
        "by_severity": {s: len(issues) for s, issues in by_severity.items()},
        "by_type": {t: len(issues) for t, issues in by_type.items()},
    }

    return {
        "generated_at": datetime.now().isoformat(),
        "summary": summary,
        "issues": sorted(all_issues, key=lambda x: {"high": 0, "warning": 1, "info": 2}.get(x["severity"], 3)),
    }


def main():
    print("AURES Data Quality Audit")
    print("=" * 60)

    # Load projects
    projects = load_all_projects()
    print(f"Loaded {len(projects)} project files")

    # Parse scheme data from TypeScript files
    scheme_entries = []
    for ts_file in [SCHEME_ROUNDS_TS, ESG_TRACKER_TS]:
        entries = parse_scheme_entries_from_ts(ts_file)
        scheme_entries.extend(entries)
        print(f"Parsed {len(entries)} entries from {ts_file.name}")

    all_issues = []

    # Run checks
    print("\n1. Checking for similar project names...")
    similar = find_similar_project_names(projects)
    all_issues.extend(similar)
    print(f"   Found {len(similar)} similar name pairs")

    print("2. Checking scheme cross-references...")
    xref = check_scheme_cross_references(projects, scheme_entries)
    all_issues.extend(xref)
    print(f"   Found {len(xref)} cross-reference issues")

    print("3. Checking for multi-scheme duplicates...")
    dupes = check_multi_scheme_duplicates(scheme_entries)
    all_issues.extend(dupes)
    print(f"   Found {len(dupes)} multi-scheme entries")

    print("4. Checking for missing coordinates...")
    coords = check_projects_without_coordinates(projects)
    all_issues.extend(coords)
    print(f"   Found {len(coords)} projects without coordinates")

    print("5. Checking for empty timelines...")
    timelines = check_empty_timelines(projects)
    all_issues.extend(timelines)
    print(f"   Found {len(timelines)} projects with empty timelines")

    # Generate and write report
    report = generate_report(all_issues)
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(report, indent=2))
    print(f"\n{'=' * 60}")
    print(f"Report written to {OUTPUT_FILE}")
    print(f"\nSummary:")
    print(f"  Total issues: {report['summary']['total_issues']}")
    for sev, count in sorted(report['summary']['by_severity'].items()):
        print(f"  {sev}: {count}")
    print(f"\nBy type:")
    for typ, count in sorted(report['summary']['by_type'].items()):
        print(f"  {typ}: {count}")

    # Print high severity issues
    high = [i for i in all_issues if i["severity"] == "high"]
    if high:
        print(f"\n{'=' * 60}")
        print(f"HIGH SEVERITY ISSUES ({len(high)}):")
        print(f"{'=' * 60}")
        for i, issue in enumerate(high, 1):
            print(f"\n  {i}. [{issue['type']}] {issue['message']}")


if __name__ == "__main__":
    main()
