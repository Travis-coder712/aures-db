#!/usr/bin/env python3
"""
AURES Database — Operating Projects Data Quality Audit
Reads all project JSON files, filters to status=operating, scores each project,
then prints a summary table by technology and a "worst 30" list.
"""

import json
import os
import glob
from collections import defaultdict

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE       = "/Users/travishughes/aures-db"
PROJECTS   = os.path.join(BASE, "data/projects")
PERF_DIR   = os.path.join(BASE, "frontend/public/data/performance/monthly")

TECH_DIRS = {
    "bess":         os.path.join(PROJECTS, "bess"),
    "solar":        os.path.join(PROJECTS, "solar"),
    "wind":         os.path.join(PROJECTS, "wind"),
    "pumped_hydro": os.path.join(PROJECTS, "pumped-hydro"),
    "hybrid":       os.path.join(PROJECTS, "hybrid"),
    "gas":          os.path.join(PROJECTS, "gas"),
}

# Performance files that exist on disk (by stem, no extension)
perf_files = {
    os.path.splitext(f)[0]
    for f in os.listdir(PERF_DIR)
    if f.endswith(".json")
}


# ── Field checkers ─────────────────────────────────────────────────────────────

def _list_len(d, key):
    v = d.get(key)
    if isinstance(v, list):
        return len(v)
    return 0

def _has_field(d, key):
    v = d.get(key)
    if v is None or v == "" or v == [] or v == {}:
        return False
    return True

def score_project(p, tech):
    """Return a dict of quality indicators plus an integer quality score."""
    pid = p.get("id", "")

    timeline_count        = _list_len(p, "timeline")
    ownership_count       = _list_len(p, "ownership_history")
    suppliers_count       = _list_len(p, "suppliers")
    scheme_contracts_count= _list_len(p, "scheme_contracts")
    offtakes_count        = _list_len(p, "offtakes")
    cost_sources_count    = _list_len(p, "cost_sources")
    stakeholder_count     = _list_len(p, "stakeholder_issues")
    cod_history_count     = _list_len(p, "cod_history")

    # sources with a url field
    sources_raw = p.get("sources") or []
    sources_with_url = sum(
        1 for s in sources_raw
        if isinstance(s, dict) and s.get("url")
    )

    # coordinates — both lat and lng non-null
    coords = p.get("coordinates") or {}
    if isinstance(coords, dict):
        has_coords = bool(coords.get("lat") is not None and coords.get("lng") is not None)
    else:
        has_coords = False

    notable_raw    = p.get("notable") or ""
    notable_len    = len(str(notable_raw).strip())
    has_notable    = notable_len > 0
    has_connection_nsp   = _has_field(p, "connection_nsp")
    has_current_developer= _has_field(p, "current_developer")
    has_storage_mwh      = tech == "bess" and _has_field(p, "storage_mwh")
    has_perf_file        = pid in perf_files

    # Score: each populated item = 1 point
    # Weighted slightly: timeline, sources important
    score = (
        min(timeline_count, 5)           # up to 5 pts
        + min(ownership_count, 3)        # up to 3
        + min(suppliers_count, 3)        # up to 3
        + min(sources_with_url, 5)       # up to 5
        + min(scheme_contracts_count, 3) # up to 3
        + min(offtakes_count, 3)         # up to 3
        + min(cost_sources_count, 3)     # up to 3
        + int(stakeholder_count > 0)     # 1
        + int(cod_history_count > 0)     # 1
        + int(has_coords)                # 1
        + int(has_notable)               # 1
        + int(has_connection_nsp)        # 1
        + int(has_current_developer)     # 1
        + (int(has_storage_mwh) if tech == "bess" else 0)  # 1 for bess
        + int(has_perf_file)             # 1
    )

    return {
        "id":                    pid,
        "name":                  p.get("name", pid),
        "tech":                  tech,
        "capacity_mw":           p.get("capacity_mw"),
        "timeline_count":        timeline_count,
        "ownership_count":       ownership_count,
        "suppliers_count":       suppliers_count,
        "sources_with_url":      sources_with_url,
        "scheme_contracts_count":scheme_contracts_count,
        "offtakes_count":        offtakes_count,
        "cost_sources_count":    cost_sources_count,
        "stakeholder_count":     stakeholder_count,
        "cod_history_count":     cod_history_count,
        "has_coords":            has_coords,
        "has_notable":           has_notable,
        "notable_len":           notable_len,
        "has_connection_nsp":    has_connection_nsp,
        "has_current_developer": has_current_developer,
        "has_storage_mwh":       has_storage_mwh,
        "has_perf_file":         has_perf_file,
        "score":                 score,
    }


# ── Load all operating projects ────────────────────────────────────────────────

all_projects = []

for tech, directory in TECH_DIRS.items():
    if not os.path.isdir(directory):
        continue
    for filepath in sorted(glob.glob(os.path.join(directory, "*.json"))):
        try:
            with open(filepath) as fh:
                data = json.load(fh)
        except Exception as e:
            print(f"  [WARN] Could not parse {filepath}: {e}")
            continue

        if data.get("status") != "operating":
            continue

        all_projects.append(score_project(data, tech))

print(f"\nTotal operating projects found: {len(all_projects)}\n")


# ── Summary table by technology ────────────────────────────────────────────────

tech_groups = defaultdict(list)
for p in all_projects:
    tech_groups[p["tech"]].append(p)

TECH_ORDER = ["solar", "wind", "bess", "pumped_hydro", "hybrid", "gas"]

print("=" * 100)
print("SUMMARY TABLE — Operating Projects Data Quality by Technology")
print("=" * 100)

# Header
header = (
    f"{'Tech':<14} {'N':>4} {'AvgTL':>6} {'0-TL':>5} {'0-Src':>6} "
    f"{'0-Sup':>6} {'No-XY':>6} {'No-Not':>7} {'No-Perf':>8} "
    f"{'No-Comm':>8} {'AvgScore':>9}"
)
print(header)
print("-" * 100)

totals = defaultdict(int)
total_score_sum = 0

for tech in TECH_ORDER:
    projects = tech_groups.get(tech, [])
    if not projects:
        continue
    n = len(projects)
    avg_tl    = sum(p["timeline_count"] for p in projects) / n
    zero_tl   = sum(1 for p in projects if p["timeline_count"] == 0)
    zero_src  = sum(1 for p in projects if p["sources_with_url"] == 0)
    zero_sup  = sum(1 for p in projects if p["suppliers_count"] == 0)
    no_coords = sum(1 for p in projects if not p["has_coords"])
    no_notable= sum(1 for p in projects if not p["has_notable"])
    no_perf   = sum(1 for p in projects if not p["has_perf_file"])
    no_comm   = sum(
        1 for p in projects
        if p["scheme_contracts_count"] == 0 and p["offtakes_count"] == 0
    )
    avg_score = sum(p["score"] for p in projects) / n

    print(
        f"{tech:<14} {n:>4} {avg_tl:>6.1f} {zero_tl:>5} {zero_src:>6} "
        f"{zero_sup:>6} {no_coords:>6} {no_notable:>7} {no_perf:>8} "
        f"{no_comm:>8} {avg_score:>9.1f}"
    )

    totals["n"]          += n
    totals["zero_tl"]    += zero_tl
    totals["zero_src"]   += zero_src
    totals["zero_sup"]   += zero_sup
    totals["no_coords"]  += no_coords
    totals["no_notable"] += no_notable
    totals["no_perf"]    += no_perf
    totals["no_comm"]    += no_comm
    total_score_sum      += sum(p["score"] for p in projects)

print("-" * 100)
n = totals["n"]
avg_tl_all = sum(p["timeline_count"] for p in all_projects) / n if n else 0
avg_score_all = total_score_sum / n if n else 0
print(
    f"{'TOTAL':<14} {n:>4} {avg_tl_all:>6.1f} "
    f"{totals['zero_tl']:>5} {totals['zero_src']:>6} "
    f"{totals['zero_sup']:>6} {totals['no_coords']:>6} "
    f"{totals['no_notable']:>7} {totals['no_perf']:>8} "
    f"{totals['no_comm']:>8} {avg_score_all:>9.1f}"
)
print()

# Column legend
print("Legend:")
print("  N        = total operating projects")
print("  AvgTL    = average timeline events per project")
print("  0-TL     = projects with 0 timeline events")
print("  0-Src    = projects with 0 sources (URLs)")
print("  0-Sup    = projects with 0 suppliers")
print("  No-XY    = projects missing coordinates")
print("  No-Not   = projects with no notable text")
print("  No-Perf  = projects with no performance/monthly file")
print("  No-Comm  = projects with no scheme_contracts AND no offtakes")
print("  AvgScore = average quality score (higher is better)")
print()


# ── Per-technology detail breakdowns ──────────────────────────────────────────

for tech in TECH_ORDER:
    projects = tech_groups.get(tech, [])
    if not projects:
        continue
    print(f"--- {tech.upper()} breakdown ({len(projects)} operating) ---")
    # Coverage rates
    def pct(count, total): return f"{count}/{total} ({100*count//total}%)"
    n = len(projects)
    has_tl  = sum(1 for p in projects if p["timeline_count"] > 0)
    has_src = sum(1 for p in projects if p["sources_with_url"] > 0)
    has_sup = sum(1 for p in projects if p["suppliers_count"] > 0)
    has_xy  = sum(1 for p in projects if p["has_coords"])
    has_not = sum(1 for p in projects if p["has_notable"])
    has_pf  = sum(1 for p in projects if p["has_perf_file"])
    has_sc  = sum(1 for p in projects if p["scheme_contracts_count"] > 0)
    has_oft = sum(1 for p in projects if p["offtakes_count"] > 0)
    has_cs  = sum(1 for p in projects if p["cost_sources_count"] > 0)
    has_sh  = sum(1 for p in projects if p["stakeholder_count"] > 0)
    has_cod = sum(1 for p in projects if p["cod_history_count"] > 0)
    has_dev = sum(1 for p in projects if p["has_current_developer"])
    has_nsp = sum(1 for p in projects if p["has_connection_nsp"])
    print(f"  Timeline events  : {pct(has_tl, n)}")
    print(f"  Sources w/ URL   : {pct(has_src, n)}")
    print(f"  Suppliers        : {pct(has_sup, n)}")
    print(f"  Coordinates      : {pct(has_xy, n)}")
    print(f"  Notable text     : {pct(has_not, n)}")
    print(f"  Perf file        : {pct(has_pf, n)}")
    print(f"  Scheme contracts : {pct(has_sc, n)}")
    print(f"  Offtakes         : {pct(has_oft, n)}")
    print(f"  Cost sources     : {pct(has_cs, n)}")
    print(f"  Stakeholder issues:{pct(has_sh, n)}")
    print(f"  COD history      : {pct(has_cod, n)}")
    print(f"  Current developer: {pct(has_dev, n)}")
    print(f"  Connection NSP   : {pct(has_nsp, n)}")
    if tech == "bess":
        has_mwh = sum(1 for p in projects if p["has_storage_mwh"])
        print(f"  Storage MWh      : {pct(has_mwh, n)}")
    print()


# ── Worst 30 projects ─────────────────────────────────────────────────────────

print("=" * 100)
print("WORST 30 PROJECTS BY DATA QUALITY SCORE (lowest first)")
print("=" * 100)

worst = sorted(all_projects, key=lambda p: (p["score"], p["name"]))[:30]

print(f"{'#':<3} {'Score':>6} {'Tech':<13} {'MW':>6}  {'Project':<45}  {'TL':>3} {'Src':>4} {'Sup':>4} {'SC':>3} {'OFT':>4} {'XY':>3} {'PF':>3}")
print("-" * 100)

for i, p in enumerate(worst, 1):
    mw = f"{p['capacity_mw']:.0f}" if p["capacity_mw"] is not None else "  ?"
    flags = []
    if not p["has_coords"]:    flags.append("no-xy")
    if not p["has_notable"]:   flags.append("no-notable")
    if not p["has_perf_file"]: flags.append("no-perf")
    if not p["has_current_developer"]: flags.append("no-dev")
    xy  = "Y" if p["has_coords"]    else "N"
    pf  = "Y" if p["has_perf_file"] else "N"
    print(
        f"{i:<3} {p['score']:>6} {p['tech']:<13} {mw:>6}  "
        f"{p['name']:<45}  "
        f"{p['timeline_count']:>3} {p['sources_with_url']:>4} "
        f"{p['suppliers_count']:>4} {p['scheme_contracts_count']:>3} "
        f"{p['offtakes_count']:>4} {xy:>3} {pf:>3}"
    )

print()
print("Column key: TL=timeline events, Src=sources w/URL, Sup=suppliers,")
print("            SC=scheme_contracts, OFT=offtakes, XY=has coordinates, PF=has perf file")
print()


# ── Missing performance files for operating projects ──────────────────────────

no_perf_projects = [p for p in all_projects if not p["has_perf_file"]]
no_perf_projects.sort(key=lambda p: (p["tech"], p["name"]))

print("=" * 100)
print(f"OPERATING PROJECTS WITH NO PERFORMANCE FILE ({len(no_perf_projects)} total)")
print("=" * 100)
for p in no_perf_projects:
    mw = f"{p['capacity_mw']:.0f} MW" if p["capacity_mw"] is not None else "? MW"
    print(f"  [{p['tech']:<13}] {p['name']:<50}  {mw}  id={p['id']}")

print()
print("Done.")
