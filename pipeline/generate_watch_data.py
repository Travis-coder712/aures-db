#!/usr/bin/env python3
"""Generate wind-watch.json and solar-watch.json from project data."""

import json
import os
from collections import defaultdict
from datetime import datetime

BASE = "/Users/travishughes/aures-db/frontend/public/data"
PROJECTS_DIR = os.path.join(BASE, "projects")
ANALYTICS_DIR = os.path.join(BASE, "analytics")
TIMELINE_FILE = os.path.join(ANALYTICS_DIR, "project-timeline.json")

# NEM states only
NEM_STATES = ["NSW", "QLD", "VIC", "SA", "TAS"]

def load_timeline_projects(tech):
    """Load projects from project-timeline.json for a given technology."""
    with open(TIMELINE_FILE) as f:
        data = json.load(f)
    return [p for p in data["projects"] if p["technology"] == tech]

def load_project_detail(tech, project_id):
    """Load individual project file for detailed info (sources, timeline)."""
    tech_dir = tech  # 'wind' or 'solar'
    path = os.path.join(PROJECTS_DIR, tech_dir, f"{project_id}.json")
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

def get_primary_source(detail):
    """Extract primary source from project detail."""
    if not detail or "sources" not in detail:
        return "AEMO Generation Information"
    sources = detail.get("sources", [])
    if sources:
        # Prefer tier 1 sources
        tier1 = [s for s in sources if s.get("source_tier") == 1]
        src = tier1[0] if tier1 else sources[0]
        return src.get("title", "AEMO Generation Information")
    return "AEMO Generation Information"

def build_watch_data(tech, colour, display_name):
    """Build watch data structure for a technology."""
    projects = load_timeline_projects(tech)

    # Filter to NEM states
    projects = [p for p in projects if p.get("state") in NEM_STATES]

    # Separate by status
    operating = sorted(
        [p for p in projects if p["status"] == "operating" and p.get("cod_current")],
        key=lambda p: p["cod_current"]
    )
    construction = [p for p in projects if p["status"] == "construction"]
    commissioning = [p for p in projects if p["status"] == "commissioning"]
    development = [p for p in projects if p["status"] == "development"]

    # Build project entries with enriched data
    all_active = operating + commissioning + construction
    project_entries = []

    for p in all_active:
        detail = load_project_detail(tech, p["id"])
        source = get_primary_source(detail)

        entry = {
            "name": p["name"],
            "id": p["id"],
            "developer": p.get("current_developer", "Unknown"),
            "capacity_mw": p["capacity_mw"],
            "status": p["status"],
            "state": p.get("state", "Unknown"),
            "cod": p.get("cod_current", ""),
            "source": source,
        }

        # Add notable info if present
        if detail and detail.get("notable"):
            entry["note"] = detail["notable"]

        project_entries.append(entry)

    # Build timeline milestones from operating projects (since 2022)
    # Group by year for the timeline to not be too cluttered
    milestones = []
    cumulative_mw = 0

    # For wind, start from 2000 (long history) but filter to 2022+ for display
    # For solar, start from 2017 (first utility-scale)
    start_year = 2022  # User requested starting from 2022

    # Calculate cumulative capacity up to start date
    pre_start = [p for p in operating if p["cod_current"] < f"{start_year}-01-01"]
    cumulative_mw = sum(p["capacity_mw"] for p in pre_start)

    if cumulative_mw > 0:
        milestones.append({
            "date": f"{start_year}-01-01",
            "label": f"Pre-{start_year} fleet: {len(pre_start)} projects",
            "cumulative_mw": round(cumulative_mw),
        })

    # Add individual milestones from start_year onwards
    post_start = [p for p in operating if p["cod_current"] >= f"{start_year}-01-01"]

    # If too many projects, group by quarter
    if len(post_start) > 30:
        # Group by quarter
        quarters = defaultdict(list)
        for p in post_start:
            cod = p["cod_current"]
            year = cod[:4]
            month = int(cod[5:7])
            q = (month - 1) // 3 + 1
            qkey = f"{year}-Q{q}"
            quarters[qkey].append(p)

        for qkey in sorted(quarters.keys()):
            qprojects = quarters[qkey]
            added_mw = sum(p["capacity_mw"] for p in qprojects)
            cumulative_mw += added_mw
            year, q = qkey.split("-")
            q_num = int(q[1])
            month = (q_num - 1) * 3 + 2  # Mid-quarter
            date = f"{year}-{month:02d}-15"

            names = [p["name"] for p in qprojects[:3]]
            label = ", ".join(names)
            if len(qprojects) > 3:
                label += f" +{len(qprojects) - 3} more"
            label += f" ({round(added_mw)} MW)"

            milestones.append({
                "date": date,
                "label": label,
                "cumulative_mw": round(cumulative_mw),
            })
    else:
        for p in post_start:
            detail = load_project_detail(tech, p["id"])
            cumulative_mw += p["capacity_mw"]
            milestones.append({
                "date": p["cod_current"],
                "label": f"{p['name']} online ({round(p['capacity_mw'])} MW)",
                "cumulative_mw": round(cumulative_mw),
            })

    # Add construction/commissioning as future milestones
    pipeline = sorted(
        commissioning + construction,
        key=lambda p: p.get("cod_current", "2030-01-01")
    )
    for p in pipeline:
        if p.get("cod_current"):
            cumulative_mw += p["capacity_mw"]
            milestones.append({
                "date": p["cod_current"],
                "label": f"{p['name']} expected ({round(p['capacity_mw'])} MW)",
                "cumulative_mw": round(cumulative_mw),
            })

    # State breakdown
    def state_breakdown(proj_list):
        by_state = {}
        for state in NEM_STATES:
            state_projs = [p for p in proj_list if p.get("state") == state]
            by_state[state] = {
                "mw": round(sum(p["capacity_mw"] for p in state_projs)),
                "projects": len(state_projs),
            }
        return by_state

    op_total_mw = round(sum(p["capacity_mw"] for p in operating))
    con_projs = commissioning + construction
    con_total_mw = round(sum(p["capacity_mw"] for p in con_projs))
    dev_total_mw = round(sum(p["capacity_mw"] for p in development))

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d"),
        "technology": tech,
        "display_name": display_name,
        "colour": colour,
        "summary": {
            "total_operating_mw": op_total_mw,
            "total_operating_projects": len(operating),
            "total_construction_mw": con_total_mw,
            "total_construction_projects": len(con_projs),
            "total_development_mw": dev_total_mw,
            "total_development_projects": len(development),
        },
        "projects": project_entries,
        "timeline_milestones": milestones,
        "by_state": {
            "operating": state_breakdown(operating),
            "construction": state_breakdown(con_projs),
        },
    }


def main():
    wind_data = build_watch_data("wind", "#3b82f6", "Wind")
    solar_data = build_watch_data("solar", "#f59e0b", "Solar")

    wind_path = os.path.join(ANALYTICS_DIR, "wind-watch.json")
    solar_path = os.path.join(ANALYTICS_DIR, "solar-watch.json")

    with open(wind_path, "w") as f:
        json.dump(wind_data, f, indent=2)
    print(f"Generated {wind_path}")
    print(f"  Operating: {wind_data['summary']['total_operating_mw']} MW ({wind_data['summary']['total_operating_projects']} projects)")
    print(f"  Construction: {wind_data['summary']['total_construction_mw']} MW ({wind_data['summary']['total_construction_projects']} projects)")
    print(f"  Milestones: {len(wind_data['timeline_milestones'])}")

    print()

    with open(solar_path, "w") as f:
        json.dump(solar_data, f, indent=2)
    print(f"Generated {solar_path}")
    print(f"  Operating: {solar_data['summary']['total_operating_mw']} MW ({solar_data['summary']['total_operating_projects']} projects)")
    print(f"  Construction: {solar_data['summary']['total_construction_mw']} MW ({solar_data['summary']['total_construction_projects']} projects)")
    print(f"  Milestones: {len(solar_data['timeline_milestones'])}")


if __name__ == "__main__":
    main()
