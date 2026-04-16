#!/usr/bin/env python3
"""
Apply developer_website_audit_2026-04.json corrections to project files.
Run from repo root: python pipeline/research/apply_audit_corrections.py
"""

import json
import os
import sys
from datetime import date

TODAY = "2026-04-16"
DATA_DIR = "data/projects/bess"
FE_DIR = "frontend/public/data/projects/bess"
INDEX_DATA = "data/projects/index.json"
INDEX_FE = "frontend/public/data/projects/index.json"

changes_log = []

def log(msg):
    changes_log.append(msg)
    print(msg)

def load_project(project_id):
    path = os.path.join(DATA_DIR, f"{project_id}.json")
    if not os.path.exists(path):
        print(f"  WARNING: {path} not found")
        return None, path
    with open(path) as f:
        return json.load(f), path

def save_project(proj, path):
    proj["last_updated"] = TODAY
    proj["last_verified"] = TODAY
    with open(path, 'w') as f:
        json.dump(proj, f, indent=2)
    # Sync to frontend
    fe_path = path.replace("data/projects/", "frontend/public/data/projects/")
    with open(fe_path, 'w') as f:
        json.dump(proj, f, indent=2)

def update_index(project_id, updates):
    """Update a project entry in both index files."""
    for idx_path in [INDEX_DATA, INDEX_FE]:
        with open(idx_path) as f:
            index = json.load(f)
        for p in index:
            if p["id"] == project_id:
                for k, v in updates.items():
                    p[k] = v
                break
        with open(idx_path, 'w') as f:
            json.dump(index, f, indent=2)


# ============================================================
# STATUS CORRECTIONS
# ============================================================

def apply_status_corrections():
    log("\n=== STATUS CORRECTIONS ===\n")

    # 1. Tarong BESS: construction -> operating
    proj, path = load_project("tarong-bess-stanwell")
    if proj:
        log(f"tarong-bess-stanwell: {proj['status']} -> operating")
        proj["status"] = "operating"
        proj["current_developer"] = "Stanwell Corporation"
        proj["data_confidence"] = "good"
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2026-01",
            "date_precision": "month",
            "event_type": "cod",
            "title": "Commercial operations commenced",
            "detail": "Tarong BESS (300 MW / 600 MWh) reached commercial operations early 2026."
        })
        save_project(proj, path)
        update_index("tarong-bess-stanwell", {"status": "operating", "current_developer": "Stanwell Corporation", "data_confidence": "good"})

    # 2. Western Downs Battery S1+S2: commissioning -> operating + capacity fix
    proj, path = load_project("western-downs-battery-stage-1-and-2")
    if proj:
        log(f"western-downs-battery-stage-1-and-2: {proj['status']} -> operating, {proj['capacity_mw']}MW->{540}MW, {proj['storage_mwh']}MWh->{1080}MWh")
        proj["status"] = "operating"
        proj["capacity_mw"] = 540.0
        proj["storage_mwh"] = 1080.0
        proj["duration_hours"] = 2.0
        proj["current_developer"] = "Neoen (Brookfield)"
        proj["current_owner"] = "Neoen"
        proj["data_confidence"] = "good"
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2025-12",
            "date_precision": "month",
            "event_type": "cod",
            "title": "Stages 1 and 2 reach full commercial operations",
            "detail": "Western Downs Battery Stages 1+2 (540 MW / 1,080 MWh) fully operational. Stage 3 (305 MW / 1,220 MWh) under construction for summer 2027/28."
        })
        save_project(proj, path)
        update_index("western-downs-battery-stage-1-and-2", {
            "status": "operating", "capacity_mw": 540.0, "storage_mwh": 1080.0,
            "current_developer": "Neoen (Brookfield)", "data_confidence": "good"
        })

    # 3. Liddell BESS: construction -> commissioning + developer fix
    proj, path = load_project("liddell-bess")
    if proj:
        log(f"liddell-bess: {proj['status']} -> commissioning, dev: {proj.get('current_developer')} -> AGL Energy")
        proj["status"] = "commissioning"
        proj["current_developer"] = "AGL Energy"
        proj["current_owner"] = "AGL Energy"
        proj["data_confidence"] = "good"
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2026-03",
            "date_precision": "month",
            "event_type": "commissioning",
            "title": "First 250 MW tranche begins commissioning",
            "detail": "AGL: First 250 MW commissioning started Mar 2026. Full operations targeted Jun 2026."
        })
        save_project(proj, path)
        update_index("liddell-bess", {"status": "commissioning", "current_developer": "AGL Energy", "data_confidence": "good"})

    # 4. Clements Gap BESS: construction -> commissioning
    proj, path = load_project("clements-gap-bess")
    if proj:
        log(f"clements-gap-bess: {proj['status']} -> commissioning")
        proj["status"] = "commissioning"
        proj["current_developer"] = "Pacific Blue (formerly Pacific Hydro)"
        proj["data_confidence"] = "medium"
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2025-12",
            "date_precision": "month",
            "event_type": "energisation",
            "title": "First energisation achieved",
            "detail": "Pacific Blue: First energisation Dec 2025."
        })
        save_project(proj, path)
        update_index("clements-gap-bess", {"status": "commissioning", "current_developer": "Pacific Blue (formerly Pacific Hydro)", "data_confidence": "medium"})

    # 5. Limondale BESS: construction -> commissioning
    proj, path = load_project("limondale-bess")
    if proj:
        log(f"limondale-bess: {proj['status']} -> commissioning")
        proj["status"] = "commissioning"
        proj["current_developer"] = "RWE Renewables"
        proj["data_confidence"] = "medium"
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2025-09",
            "date_precision": "month",
            "event_type": "commissioning",
            "title": "AEMO registration — commissioning underway",
            "detail": "RWE: AEMO registered Sep 2025. COD expected early 2026."
        })
        save_project(proj, path)
        update_index("limondale-bess", {"status": "commissioning", "current_developer": "RWE Renewables", "data_confidence": "medium"})

    # 6. Stanwell BESS: development -> construction
    proj, path = load_project("stanwell-bess")
    if proj:
        log(f"stanwell-bess: {proj['status']} -> construction")
        proj["status"] = "construction"
        proj["current_developer"] = "Stanwell Corporation"
        proj["data_confidence"] = "good"
        proj["bess_oem"] = "Tesla"
        proj["cod_current"] = "2027-06"
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2026-02",
            "date_precision": "month",
            "event_type": "notable",
            "title": "Construction passes halfway mark — 324 Tesla Megapacks delivered",
            "detail": "Stanwell: Halfway construction milestone reached. 324 Tesla Megapacks delivered to site. Target COD mid-2027 (slipped from Dec 2026)."
        })
        save_project(proj, path)
        update_index("stanwell-bess", {"status": "construction", "current_developer": "Stanwell Corporation", "data_confidence": "good"})

    # 7. Collie Battery: development -> operating + developer fix (WA project)
    proj, path = load_project("collie-battery")
    if proj:
        log(f"collie-battery: {proj['status']} -> operating, dev: {proj.get('current_developer')} -> Neoen")
        proj["status"] = "operating"
        proj["current_developer"] = "Neoen (Brookfield)"
        proj["current_owner"] = "Neoen"
        proj["data_confidence"] = "good"
        if not proj.get("stages"):
            proj["stages"] = [
                {"stage": 1, "name": "Stage 1", "capacity_mw": 219.0, "storage_mwh": 877.0, "status": "operating", "notes": "Operational. Synergy is offtaker, not developer."},
                {"stage": 2, "name": "Stage 2", "capacity_mw": 341.0, "storage_mwh": 1363.0, "status": "operating", "notes": "Operational Jul 2025."}
            ]
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2025-07",
            "date_precision": "month",
            "event_type": "cod",
            "title": "Stage 2 reaches commercial operations — full 560 MW operational",
            "detail": "Neoen: Both Stage 1 (219 MW) and Stage 2 (341 MW) now operational. Total 560 MW / 2,240 MWh. Synergy is offtaker, not developer."
        })
        if not proj.get("ownership_history"):
            proj["ownership_history"] = []
        proj["ownership_history"].append({
            "date": "2025",
            "owner": "Neoen (Brookfield)",
            "event": "Neoen acquired by Brookfield globally. Collie Battery remains under Neoen/Brookfield."
        })
        save_project(proj, path)
        update_index("collie-battery", {"status": "operating", "current_developer": "Neoen (Brookfield)", "data_confidence": "good"})

    # 8. Brendale BESS: construction -> operating
    proj, path = load_project("brendale-bess")
    if proj:
        log(f"brendale-bess: {proj['status']} -> operating")
        proj["status"] = "operating"
        proj["current_developer"] = "Supernode (Quinbrook)"
        proj["current_owner"] = "Quinbrook Infrastructure Partners"
        proj["data_confidence"] = "medium"
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2025-06",
            "date_precision": "month",
            "event_type": "cod",
            "title": "Stage 1 achieves commercial operations",
            "detail": "Supernode/Quinbrook: Brendale BESS Stage 1 achieved commercial operations mid-2025."
        })
        save_project(proj, path)
        update_index("brendale-bess", {"status": "operating", "current_developer": "Supernode (Quinbrook)", "data_confidence": "medium"})

    # 9. New England Solar Farm BESS: construction -> commissioning (Phase 1)
    proj, path = load_project("new-england-solar-farm-bess")
    if proj:
        log(f"new-england-solar-farm-bess: {proj['status']} -> commissioning, storage {proj.get('storage_mwh')} -> 400 MWh")
        proj["status"] = "commissioning"
        proj["storage_mwh"] = 400.0
        proj["duration_hours"] = 2.0
        proj["current_developer"] = "ACEN Australia"
        proj["data_confidence"] = "medium"
        if not proj.get("timeline"):
            proj["timeline"] = []
        proj["timeline"].append({
            "date": "2026-02",
            "date_precision": "month",
            "event_type": "commissioning",
            "title": "Phase 1 (50 MW) registered with AEMO",
            "detail": "ACEN: Phase 1 (50 MW) registered with AEMO Feb 2026. Phase 2 (150 MW) remains under construction."
        })
        save_project(proj, path)
        update_index("new-england-solar-farm-bess", {"status": "commissioning", "storage_mwh": 400.0, "current_developer": "ACEN Australia", "data_confidence": "medium"})


# ============================================================
# CAPACITY CORRECTIONS (non-overlapping with status changes above)
# ============================================================

def apply_capacity_corrections():
    log("\n=== CAPACITY CORRECTIONS ===\n")

    corrections = [
        ("hornsdale-power-reserve", {"capacity_mw": 150.0}, "194 -> 150 MW (was conflated with MWh value)"),
        ("birriwa-bess", {"storage_mwh": 1200.0, "duration_hours": 2.0}, "storage 600 -> 1200 MWh"),
        ("latrobe-valley-bess", {"capacity_mw": 100.0, "duration_hours": 2.0}, "200 -> 100 MW (200 is MWh not MW)"),
        ("woodland-bess", {"capacity_mw": 300.0}, "250 -> 300 MW"),
        ("gould-creek-bess", {"capacity_mw": 225.0, "storage_mwh": 450.0, "current_developer": "Maoneng", "duration_hours": 2.0}, "215 -> 225 MW, dev -> Maoneng"),
        ("winton-energy-reserve-1", {"capacity_mw": 200.0, "storage_mwh": 400.0, "duration_hours": 2.0}, "400 -> 200 MW (400 MW was combined BESS+gas)"),
        ("kidston-hybrid-bess", {"capacity_mw": 150.0, "storage_mwh": 600.0, "duration_hours": 4.0, "current_developer": "Genex Power (J-POWER)"}, "200 -> 150 MW"),
        ("culcairn-bess", {"storage_mwh": 904.0}, "800 -> 904 MWh (higher density units)"),
    ]

    for pid, updates, desc in corrections:
        proj, path = load_project(pid)
        if proj:
            log(f"{pid}: {desc}")
            for k, v in updates.items():
                proj[k] = v
            save_project(proj, path)
            # Update index with relevant fields
            idx_updates = {}
            if "capacity_mw" in updates:
                idx_updates["capacity_mw"] = updates["capacity_mw"]
            if "storage_mwh" in updates:
                idx_updates["storage_mwh"] = updates["storage_mwh"]
            if "current_developer" in updates:
                idx_updates["current_developer"] = updates["current_developer"]
            if idx_updates:
                update_index(pid, idx_updates)


# ============================================================
# DEVELOPER ATTRIBUTION CORRECTIONS (non-overlapping with above)
# ============================================================

def apply_developer_corrections():
    log("\n=== DEVELOPER ATTRIBUTION CORRECTIONS ===\n")

    corrections = [
        ("koorangie-energy-storage-system", {
            "current_developer": "Edify Energy",
            "current_owner": "Edify Energy (CDPQ)",
            "data_confidence": "good"
        }, "Shell Energy -> Edify Energy (Shell is offtaker not developer)"),
        ("victorian-big-battery", {
            "current_developer": "HMC Capital",
            "current_owner": "HMC Capital",
            "data_confidence": "good"
        }, "Neoen -> HMC Capital (sold Aug 2025, $950M ACCC divestiture)"),
        ("coleambally-bess", {
            "current_developer": "Octopus Australia",
            "current_owner": "Octopus Australia",
        }, "Risen Energy -> Octopus Australia (sold Oct 2025)"),
        ("bungama-bess", {
            "current_developer": "Risen Energy",
        }, "Bungama Bess Trust SPV -> Risen Energy"),
        ("mornington-bess", {
            "current_developer": "Maoneng",
        }, "Mornington BESS Project Pty Ltd SPV -> Maoneng"),
    ]

    for pid, updates, desc in corrections:
        proj, path = load_project(pid)
        if proj:
            old_dev = proj.get("current_developer", "")
            log(f"{pid}: {desc}")
            for k, v in updates.items():
                proj[k] = v
            # Add ownership history for ownership changes
            if pid in ("victorian-big-battery", "coleambally-bess"):
                if not proj.get("ownership_history"):
                    proj["ownership_history"] = []
                if pid == "victorian-big-battery":
                    proj["ownership_history"].append({
                        "date": "2025-08",
                        "owner": "HMC Capital",
                        "event": "Acquired from Neoen/Brookfield as part of ACCC-mandated divestiture of Victorian portfolio. $950M deal."
                    })
                elif pid == "coleambally-bess":
                    proj["ownership_history"].append({
                        "date": "2025-10",
                        "owner": "Octopus Australia",
                        "event": "Acquired from Risen Energy. 100 MW / 400 MWh BESS."
                    })
            save_project(proj, path)
            idx_updates = {"current_developer": updates.get("current_developer", old_dev)}
            if "data_confidence" in updates:
                idx_updates["data_confidence"] = updates["data_confidence"]
            update_index(pid, idx_updates)


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    # Ensure we're in repo root
    if not os.path.exists(DATA_DIR):
        print("ERROR: Run from repo root (aures-db/)")
        sys.exit(1)

    apply_status_corrections()
    apply_capacity_corrections()
    apply_developer_corrections()

    log(f"\n=== COMPLETE: {len(changes_log) - 3} corrections applied ===")

    # Summary
    print("\n--- DEFERRED (complex, needs manual review) ---")
    print("- Eraring Battery consolidation: eraring-battery (460MW) + eraring-big-battery (700MW)")
    print("  → Should be single staged project. Stages 1-3 (460MW) operating, Stage 4 (240MW) construction.")
    print("  → Requires careful merging of two files with different data. Flagged for separate task.")
