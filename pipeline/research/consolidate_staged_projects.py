#!/usr/bin/env python3
"""
Consolidate staged BESS projects into single files with stages arrays.
Based on verified research from developer_website_audit_2026-04.json.

Run from repo root: python pipeline/research/consolidate_staged_projects.py
"""

import json
import os
import sys

TODAY = "2026-04-16"
DATA_DIR = "data/projects/bess"
FE_DIR = "frontend/public/data/projects/bess"
INDEX_DATA = "data/projects/index.json"
INDEX_FE = "frontend/public/data/projects/index.json"
GUARD_PATH = "pipeline/config/consolidated_projects.json"


def load_project(pid):
    path = os.path.join(DATA_DIR, f"{pid}.json")
    if not os.path.exists(path):
        print(f"  WARNING: {path} not found")
        return None
    with open(path) as f:
        return json.load(f)


def save_project(proj, pid):
    proj["last_updated"] = TODAY
    proj["last_verified"] = TODAY
    path = os.path.join(DATA_DIR, f"{pid}.json")
    with open(path, 'w') as f:
        json.dump(proj, f, indent=2)
    fe_path = os.path.join(FE_DIR, f"{pid}.json")
    with open(fe_path, 'w') as f:
        json.dump(proj, f, indent=2)


def delete_project(pid):
    for d in [DATA_DIR, FE_DIR]:
        path = os.path.join(d, f"{pid}.json")
        if os.path.exists(path):
            os.remove(path)
            print(f"    Deleted {path}")


def update_indices(keep_id, remove_ids, updates):
    """Update index entries: modify the kept project, remove the deleted ones."""
    for idx_path in [INDEX_DATA, INDEX_FE]:
        with open(idx_path) as f:
            index = json.load(f)
        new_index = []
        for p in index:
            if p["id"] in remove_ids:
                continue  # Remove consolidated entries
            if p["id"] == keep_id:
                for k, v in updates.items():
                    p[k] = v
            new_index.append(p)
        with open(idx_path, 'w') as f:
            json.dump(new_index, f, indent=2)


def add_to_guard(aemo_ids_map, slugs_map):
    """Add entries to the consolidation guard config."""
    with open(GUARD_PATH) as f:
        guard = json.load(f)
    for aid, info in aemo_ids_map.items():
        guard["by_aemo_id"][str(aid)] = info
    for slug, info in slugs_map.items():
        guard["by_slug"][slug] = info
    with open(GUARD_PATH, 'w') as f:
        json.dump(guard, f, indent=2)


# ============================================================
# 1. ERARING BATTERY — 700 MW total, 4 stages
# ============================================================
def consolidate_eraring():
    print("\n=== 1. ERARING BATTERY (NSW) — Origin Energy ===")
    primary = load_project("eraring-battery")
    if not primary:
        return

    primary["name"] = "Eraring Battery"
    primary["status"] = "operating"
    primary["capacity_mw"] = 700.0
    primary["storage_mwh"] = 3160.0
    primary["current_developer"] = "Origin Energy"
    primary["current_owner"] = "Origin Energy"
    primary["bess_oem"] = "Wartsila"
    primary["duration_hours"] = 4.5
    primary["data_confidence"] = "good"
    primary["aemo_gen_info_id"] = "1870"
    primary["grid_forming"] = False  # Battery 1 is grid-following; Battery 2 is grid-forming

    primary["stages"] = [
        {
            "stage": 1, "name": "Battery 1 (Stages 1+3)",
            "capacity_mw": 460.0, "storage_mwh": 1770.0,
            "status": "operating", "cod": "2026-01-07",
            "oem": "Wartsila", "grid_forming": False,
            "notes": "Stage 1 (460 MW / 1,070 MWh) + Stage 3 augmentation (+700 MWh). Grid-following inverters. Commercial operations 7 Jan 2026."
        },
        {
            "stage": 2, "name": "Battery 2 (Stages 2+4)",
            "capacity_mw": 240.0, "storage_mwh": 1390.0,
            "status": "construction", "cod": "2027-Q1",
            "oem": "Wartsila", "grid_forming": True,
            "notes": "Stage 2 (240 MW / 1,030 MWh) + Stage 4 augmentation (+360 MWh). Grid-forming inverters. Construction commenced Oct 2025."
        }
    ]

    primary["timeline"] = primary.get("timeline", [])
    primary["timeline"].extend([
        {"date": "2026-01-07", "date_precision": "day", "event_type": "cod",
         "title": "Battery 1 (460 MW / 1,770 MWh) commences commercial operations",
         "detail": "Australia's largest operating battery. Stages 1+3 operational."},
        {"date": "2025-10", "date_precision": "month", "event_type": "construction_start",
         "title": "Battery 2 (240 MW) construction commences",
         "detail": "Stage 2 construction start. Grid-forming inverters. Target COD Q1 2027."},
        {"date": "2025-12", "date_precision": "month", "event_type": "notable",
         "title": "Wartsila announces Stage 4 augmentation — total project reaches 700 MW / 3,160 MWh",
         "detail": "Fourth stage adds 360 MWh storage to Battery 2, extending duration to ~5.8 hours."}
    ])

    primary["sources"] = primary.get("sources", [])
    primary["sources"].extend([
        {"title": "Energy-Storage.News — 1,770 MWh Eraring Battery 1 commences commercial operations",
         "url": "https://www.energy-storage.news/australias-1770mwh-eraring-battery-1-commences-commercial-operations/",
         "date": "2026-01-08", "source_tier": 2},
        {"title": "Wartsila — Fourth stage of Origin's Eraring BESS",
         "url": "https://www.wartsila.com/media/news/11-12-2025-wartsila-sets-new-global-benchmark-with-fourth-stage-of-origin-s-eraring-battery-energy-storage-system-3695204",
         "date": "2025-12-11", "source_tier": 1},
        {"title": "Origin Energy — Eraring Battery project page",
         "url": "https://www.originenergy.com.au/about/who-we-are/what-we-do/generation/eraring-projects/battery/",
         "source_tier": 1}
    ])

    save_project(primary, "eraring-battery")
    delete_project("eraring-big-battery")
    update_indices("eraring-battery", ["eraring-big-battery"], {
        "name": "Eraring Battery", "status": "operating",
        "capacity_mw": 700.0, "storage_mwh": 3160.0,
        "current_developer": "Origin Energy", "data_confidence": "good"
    })
    print("  -> Consolidated: 700 MW / 3,160 MWh (Battery 1 operating, Battery 2 construction)")


# ============================================================
# 2. BREMER BATTERY — 850 MW, single project, 4 AEMO DUIDs
# ============================================================
def consolidate_bremer():
    print("\n=== 2. BREMER BATTERY (QLD) — Libra Energy ===")
    primary = load_project("bremer-battery-1")
    if not primary:
        return

    primary["id"] = "bremer-battery"
    primary["name"] = "Bremer Battery"
    primary["capacity_mw"] = 850.0
    primary["storage_mwh"] = 3400.0
    primary["duration_hours"] = 4.0
    primary["current_developer"] = "Libra Energy"
    primary["data_confidence"] = "medium"

    primary["stages"] = [
        {"stage": i, "name": f"DUID {i}", "capacity_mw": 212.0, "storage_mwh": 850.0,
         "status": "development",
         "notes": f"AEMO splits into 4 x 212 MW DUIDs for dispatch. Single project, single planning approval."}
        for i in range(1, 5)
    ]

    primary["timeline"] = [
        {"date": "2025-02-04", "date_precision": "day", "event_type": "notable",
         "title": "AEMO/Powerlink connection enquiry approved",
         "detail": "Connection enquiry approved. Full connection application underway."},
        {"date": "2026-01", "date_precision": "month", "event_type": "notable",
         "title": "Development application withdrawn from Ipswich City Council",
         "detail": "DA declared invalid under new QLD planning rules requiring BESS >50 MW to go through SARA with community benefit agreements. Needs re-lodgement."}
    ]

    primary["sources"] = [
        {"title": "AEMO Generation Information Jan 2026",
         "url": "https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information",
         "date": "2026-01-30", "source_tier": 1},
        {"title": "Bremer Battery project website", "url": "https://www.bremerbattery.com.au/battery", "source_tier": 1},
        {"title": "PV Magazine — Giant 3.4 GWh battery project",
         "url": "https://www.pv-magazine.com/2024/07/31/australian-developer-reveals-plans-for-giant-3-4-gwh-battery-project/",
         "date": "2024-07-31", "source_tier": 2}
    ]

    # Save as new ID, delete old files
    save_project(primary, "bremer-battery")
    # Rename file (primary was bremer-battery-1)
    for old_id in ["bremer-battery-1", "bremer-battery-2", "bremer-battery-3", "bremer-battery-4"]:
        if old_id != "bremer-battery":
            delete_project(old_id)
    # bremer-battery-1.json still exists, remove it too since we saved as bremer-battery
    delete_project("bremer-battery-1")

    update_indices("bremer-battery-1", ["bremer-battery-2", "bremer-battery-3", "bremer-battery-4"], {
        "id": "bremer-battery", "name": "Bremer Battery",
        "capacity_mw": 850.0, "storage_mwh": 3400.0,
        "current_developer": "Libra Energy", "data_confidence": "medium"
    })
    # Also need to update the ID in the index
    for idx_path in [INDEX_DATA, INDEX_FE]:
        with open(idx_path) as f:
            index = json.load(f)
        for p in index:
            if p["id"] == "bremer-battery-1":
                p["id"] = "bremer-battery"
        with open(idx_path, 'w') as f:
            json.dump(index, f, indent=2)

    print("  -> Consolidated: 850 MW / 3,400 MWh (4 AEMO DUIDs merged into 1)")


# ============================================================
# 3. SUPERNODE NORTH — 780 MW, single project, 3 AEMO DUIDs
# ============================================================
def consolidate_supernode_north():
    print("\n=== 3. SUPERNODE NORTH BESS (QLD) — Quinbrook ===")
    primary = load_project("supernode-north-bess-1")
    if not primary:
        return

    primary["id"] = "supernode-north-bess"
    primary["name"] = "Supernode North BESS"
    primary["capacity_mw"] = 780.0
    primary["storage_mwh"] = 2200.0
    primary["current_developer"] = "Quinbrook Infrastructure Partners"
    primary["current_owner"] = "Quinbrook Infrastructure Partners"
    primary["data_confidence"] = "good"
    primary["lga"] = "Townsville City Council"

    primary["stages"] = [
        {"stage": i, "name": f"Module {i}", "capacity_mw": 260.0, "storage_mwh": 733.0,
         "status": "development",
         "notes": "3 x 260 MW modules at Lansdown Eco-Industrial Precinct, Woodstock (45 km S of Townsville). Supports $8B polysilicon factory."}
        for i in range(1, 4)
    ]

    primary["timeline"] = [
        {"date": "2026-03-17", "date_precision": "day", "event_type": "planning_approved",
         "title": "EPBC Act clearance granted — 'not controlled action'",
         "detail": "Federal environmental approval in 41 days."},
        {"date": "2025-12-23", "date_precision": "day", "event_type": "planning_rejected",
         "title": "Townsville City Council rejects DA",
         "detail": "Rejected due to QLD planning rule changes requiring community benefit agreements before lodging. Council itself supports the project. Needs re-lodgement via SARA."}
    ]

    primary["sources"] = [
        {"title": "AEMO Generation Information Jan 2026",
         "url": "https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information",
         "date": "2026-01-30", "source_tier": 1},
        {"title": "Energy-Storage.News — Quinbrook bags EPBC approval for 780 MW Supernode North",
         "url": "https://www.energy-storage.news/quinbrook-bags-epbc-act-approval-for-780mw-supernode-north-bess-in-australia/",
         "source_tier": 2},
        {"title": "Quinbrook — Supernode BESS project page",
         "url": "https://www.quinbrook.com/projects/supernode-bess/", "source_tier": 1}
    ]

    save_project(primary, "supernode-north-bess")
    for old_id in ["supernode-north-bess-1", "supernode-north-bess-2", "supernode-north-bess-3"]:
        delete_project(old_id)

    update_indices("supernode-north-bess-1", ["supernode-north-bess-2", "supernode-north-bess-3"], {
        "id": "supernode-north-bess", "name": "Supernode North BESS",
        "capacity_mw": 780.0, "storage_mwh": 2200.0,
        "current_developer": "Quinbrook Infrastructure Partners", "data_confidence": "good"
    })
    for idx_path in [INDEX_DATA, INDEX_FE]:
        with open(idx_path) as f:
            index = json.load(f)
        for p in index:
            if p["id"] == "supernode-north-bess-1":
                p["id"] = "supernode-north-bess"
        with open(idx_path, 'w') as f:
            json.dump(index, f, indent=2)

    print("  -> Consolidated: 780 MW / 2,200 MWh (3 AEMO DUIDs merged)")


# ============================================================
# 4. BLACKSTONE BESS — 500 MW / 1,000 MWh, Octopus Australia
# ============================================================
def consolidate_blackstone():
    print("\n=== 4. BLACKSTONE BESS (QLD) — Octopus Australia ===")
    primary = load_project("blackstone-bess")
    if not primary:
        return

    primary["name"] = "Blackstone Battery"
    primary["capacity_mw"] = 500.0
    primary["storage_mwh"] = 1000.0
    primary["duration_hours"] = 2.0
    # IMPORTANT: Octopus bought from Firm Power BEFORE AGL acquired Firm Power
    primary["current_developer"] = "Octopus Australia"
    primary["current_owner"] = "Octopus Australia"
    primary["data_confidence"] = "good"

    primary["stages"] = [
        {"stage": 1, "name": "Stage 1", "capacity_mw": 250.0, "storage_mwh": 500.0,
         "status": "development", "notes": "Two AEMO connection entries for single 500 MW project."},
        {"stage": 2, "name": "Stage 2", "capacity_mw": 250.0, "storage_mwh": 500.0,
         "status": "development", "notes": "AEMO KCI entry for second connection tranche."}
    ]

    primary["timeline"] = [
        {"date": "2023-10", "date_precision": "month", "event_type": "notable",
         "title": "Octopus Australia acquires Blackstone BESS from Firm Power",
         "detail": "Purchased before AGL's acquisition of Firm Power (Aug 2024). Backed by Hostplus, Rest Super, CEFC."},
        {"date": "2024-07", "date_precision": "month", "event_type": "planning_approved",
         "title": "Planning approval from Ipswich City Council",
         "detail": "DA approved for 500 MW / 1,000 MWh battery at Swanbank."}
    ]

    primary["ownership_history"] = [
        {"date": "2023-10", "owner": "Octopus Australia",
         "event": "Acquired from Firm Power. Backed by Hostplus, Rest Super, CEFC."}
    ]

    primary["sources"] = [
        {"title": "AEMO Generation Information Jan 2026",
         "url": "https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information",
         "date": "2026-01-30", "source_tier": 1},
        {"title": "PV Magazine — 500 MW / 1 GWh battery gets planning approval",
         "url": "https://www.pv-magazine-australia.com/2024/07/10/queenslands-biggest-500-mw-1-gwh-battery-gets-planning-approval/",
         "date": "2024-07-10", "source_tier": 2},
        {"title": "Energy-Storage.News — Octopus buys 1,000 MWh BESS project",
         "url": "https://www.energy-storage.news/octopus-buys-1000mwh-bess-project-to-back-renewable-energy-ppas-in-queensland-australia/",
         "source_tier": 2},
        {"title": "Blackstone Battery official website",
         "url": "https://blackstonebattery.com.au/the-project/", "source_tier": 1}
    ]

    save_project(primary, "blackstone-bess")
    delete_project("blackstone-bess-2-kci")
    update_indices("blackstone-bess", ["blackstone-bess-2-kci"], {
        "name": "Blackstone Battery", "capacity_mw": 500.0, "storage_mwh": 1000.0,
        "current_developer": "Octopus Australia", "data_confidence": "good"
    })
    print("  -> Consolidated: 500 MW / 1,000 MWh. Owner corrected: Octopus Australia (not AGL)")


# ============================================================
# 5. MOUNT BRITTON BESS — 500 MW / 2,000 MWh, AGL via Firm Power
# ============================================================
def consolidate_mount_britton():
    print("\n=== 5. MOUNT BRITTON BESS (QLD) — AGL (via Firm Power) ===")
    primary = load_project("mount-britton-bess1")
    if not primary:
        return

    primary["id"] = "mount-britton-bess"
    primary["name"] = "Mount Britton BESS"
    primary["capacity_mw"] = 500.0
    primary["storage_mwh"] = 2000.0
    primary["duration_hours"] = 4.0
    primary["current_developer"] = "AGL Energy (via Firm Power)"
    primary["current_owner"] = "AGL Energy"
    primary["data_confidence"] = "medium"

    primary["stages"] = [
        {"stage": 1, "name": "Stage 1", "capacity_mw": 250.0, "storage_mwh": 1000.0,
         "status": "development", "notes": "Adjacent to 275 kV Nebo Substation, Suttor Developmental Rd, Nebo."},
        {"stage": 2, "name": "Stage 2", "capacity_mw": 250.0, "storage_mwh": 1000.0,
         "status": "development", "notes": "AEMO KCI entry for second connection tranche."}
    ]

    primary["sources"] = [
        {"title": "AEMO Generation Information Jan 2026",
         "url": "https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information",
         "date": "2026-01-30", "source_tier": 1},
        {"title": "Firm Power — Mount Britton BESS project page",
         "url": "https://firmpower.com.au/our-projects/mount-britton-bess/", "source_tier": 1}
    ]

    save_project(primary, "mount-britton-bess")
    for old_id in ["mount-britton-bess1", "mount-britton-bess2"]:
        delete_project(old_id)

    update_indices("mount-britton-bess1", ["mount-britton-bess2"], {
        "id": "mount-britton-bess", "name": "Mount Britton BESS",
        "capacity_mw": 500.0, "storage_mwh": 2000.0,
        "current_developer": "AGL Energy (via Firm Power)", "data_confidence": "medium"
    })
    for idx_path in [INDEX_DATA, INDEX_FE]:
        with open(idx_path) as f:
            index = json.load(f)
        for p in index:
            if p["id"] == "mount-britton-bess1":
                p["id"] = "mount-britton-bess"
        with open(idx_path, 'w') as f:
            json.dump(index, f, indent=2)

    print("  -> Consolidated: 500 MW / 2,000 MWh")


# ============================================================
# 6. BOULDERCOMBE BATTERY — 100 MW, S1 operating + S2 development
# ============================================================
def consolidate_bouldercombe():
    print("\n=== 6. BOULDERCOMBE BATTERY (QLD) — Genex/J-POWER ===")
    primary = load_project("bouldercombe-battery-project")
    if not primary:
        return

    primary["name"] = "Bouldercombe Battery"
    primary["capacity_mw"] = 100.0
    primary["storage_mwh"] = 200.0
    primary["duration_hours"] = 2.0
    primary["current_developer"] = "Genex Power (J-POWER)"
    primary["current_owner"] = "J-POWER"
    primary["bess_oem"] = "Tesla"
    primary["data_confidence"] = "good"

    primary["stages"] = [
        {"stage": 1, "name": "Stage 1 (BBP)", "capacity_mw": 50.0, "storage_mwh": 100.0,
         "status": "operating", "cod": "2023-11", "oem": "Tesla",
         "notes": "Tesla Megapack 2.0. Operational since Nov 2023. Autobidder revenue-sharing offtake."},
        {"stage": 2, "name": "Stage 2 (BBP 2)", "capacity_mw": 50.0, "storage_mwh": 100.0,
         "status": "development",
         "notes": "Confirmed in Genex Power pipeline. AEMO KCI entry."}
    ]

    primary["timeline"] = primary.get("timeline", [])
    primary["timeline"].append(
        {"date": "2024-08", "date_precision": "month", "event_type": "notable",
         "title": "J-POWER completes 100% acquisition of Genex Power",
         "detail": "AUD $351M takeover. All Genex projects now under J-POWER ownership."}
    )

    primary["ownership_history"] = primary.get("ownership_history", [])
    primary["ownership_history"].append(
        {"date": "2024-08", "owner": "J-POWER", "event": "J-POWER acquires Genex Power for $351M."}
    )

    primary["sources"] = primary.get("sources", [])
    primary["sources"].extend([
        {"title": "Genex Power — Bouldercombe project page",
         "url": "https://genexpower.com.au/bouldercombe-battery-project/", "source_tier": 1},
        {"title": "Energy-Storage.News — J-POWER completes Genex takeover",
         "url": "https://www.energy-storage.news/j-power-completes-takeover-of-australias-genex-power/",
         "source_tier": 2}
    ])

    save_project(primary, "bouldercombe-battery-project")
    delete_project("bouldercombe-battery-project-stage-2-kci")
    update_indices("bouldercombe-battery-project", ["bouldercombe-battery-project-stage-2-kci"], {
        "name": "Bouldercombe Battery", "capacity_mw": 100.0, "storage_mwh": 200.0,
        "current_developer": "Genex Power (J-POWER)", "data_confidence": "good"
    })
    print("  -> Consolidated: 100 MW / 200 MWh (S1 operating, S2 development)")


# ============================================================
# 7. GOYDER BESS — 500 MW (300+200), Neoen, part of 900 MW envelope
# ============================================================
def consolidate_goyder():
    print("\n=== 7. GOYDER BESS (SA) — Neoen/Brookfield ===")
    primary = load_project("goyder-bess")
    if not primary:
        return

    primary["name"] = "Goyder Battery"
    primary["capacity_mw"] = 500.0
    primary["storage_mwh"] = 1601.0
    primary["current_developer"] = "Neoen (Brookfield)"
    primary["current_owner"] = "Neoen"
    primary["bess_oem"] = "Tesla"
    primary["data_confidence"] = "good"
    primary["cod_current"] = "2028-05"

    primary["stages"] = [
        {"stage": 1, "name": "Stage 1", "capacity_mw": 300.0, "storage_mwh": 801.0,
         "status": "construction", "cod": "2028-05", "oem": "Tesla",
         "notes": "First tranche 226 MW / 866 MWh broke ground Dec 2025. Tesla Megablock technology (first deployment globally). Part of 900 MW approved envelope at Goyder North near Burra, SA."},
        {"stage": 2, "name": "Stage 2", "capacity_mw": 200.0, "storage_mwh": 800.0,
         "status": "development", "cod": "2029-05",
         "notes": "Second tranche within 900 MW approved envelope."}
    ]

    primary["timeline"] = [
        {"date": "2025-12", "date_precision": "month", "event_type": "construction_start",
         "title": "Construction begins on Stage 1 — first Tesla Megablock deployment globally",
         "detail": "Neoen breaks ground on 226 MW / 866 MWh first tranche at Goyder North near Burra, SA."}
    ]

    primary["sources"] = [
        {"title": "AEMO Generation Information Jan 2026",
         "url": "https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information",
         "date": "2026-01-30", "source_tier": 1},
        {"title": "RenewEconomy — Neoen begins construction, first Tesla Megablock deployment",
         "url": "https://reneweconomy.com.au/neoen-begins-construction-of-another-big-battery-first-in-world-to-deploy-tesla-megablock-technology/",
         "source_tier": 2},
        {"title": "Energy-Storage.News — Grid connection readies site for 900 MW battery",
         "url": "https://www.energy-storage.news/grid-connection-for-neoens-south-australia-renewables-hub-readies-site-for-900mw-battery-storage/",
         "source_tier": 2}
    ]

    save_project(primary, "goyder-bess")
    delete_project("goyder-bess-stage-2")
    update_indices("goyder-bess", ["goyder-bess-stage-2"], {
        "name": "Goyder Battery", "capacity_mw": 500.0, "storage_mwh": 1601.0,
        "current_developer": "Neoen (Brookfield)", "data_confidence": "good"
    })
    print("  -> Consolidated: 500 MW / 1,601 MWh (S1 construction, S2 development). 900 MW approved envelope.")


# ============================================================
# 8. NINE MILE ENERGY PARK — 500 MW / 1,500 MWh
# ============================================================
def consolidate_nine_mile():
    print("\n=== 8. NINE MILE ENERGY PARK BESS (VIC) — Pacific Green / Green Switch ===")
    primary = load_project("nine-mile-energy-park-stage-1-bess")
    if not primary:
        return

    primary["id"] = "nine-mile-energy-park-bess"
    primary["name"] = "Nine Mile Energy Park BESS"
    primary["capacity_mw"] = 500.0
    primary["storage_mwh"] = 1500.0
    primary["current_developer"] = "Pacific Green / Green Switch Energy"
    primary["data_confidence"] = "medium"

    primary["stages"] = [
        {"stage": 1, "name": "Stage 1", "capacity_mw": 250.0, "storage_mwh": 500.0,
         "status": "development", "duration_hours": 2.0,
         "notes": "Planning permit PA2504144 lodged with Victoria DTP."},
        {"stage": 2, "name": "Stage 2", "capacity_mw": 250.0, "storage_mwh": 1000.0,
         "status": "development", "duration_hours": 4.0,
         "notes": "Planning permit PA2504148 lodged with Victoria DTP."}
    ]

    primary["sources"] = [
        {"title": "AEMO Generation Information Jan 2026",
         "url": "https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information",
         "date": "2026-01-30", "source_tier": 1},
        {"title": "Nine Mile Energy Park project website",
         "url": "https://ninemile.pacificgreen.com/", "source_tier": 1}
    ]

    save_project(primary, "nine-mile-energy-park-bess")
    for old_id in ["nine-mile-energy-park-stage-1-bess", "nine-mile-energy-park-stage-2-bess"]:
        delete_project(old_id)

    update_indices("nine-mile-energy-park-stage-1-bess", ["nine-mile-energy-park-stage-2-bess"], {
        "id": "nine-mile-energy-park-bess", "name": "Nine Mile Energy Park BESS",
        "capacity_mw": 500.0, "storage_mwh": 1500.0,
        "current_developer": "Pacific Green / Green Switch Energy", "data_confidence": "medium"
    })
    for idx_path in [INDEX_DATA, INDEX_FE]:
        with open(idx_path) as f:
            index = json.load(f)
        for p in index:
            if p["id"] == "nine-mile-energy-park-stage-1-bess":
                p["id"] = "nine-mile-energy-park-bess"
        with open(idx_path, 'w') as f:
            json.dump(index, f, indent=2)

    print("  -> Consolidated: 500 MW / 1,500 MWh (S1 2h, S2 4h)")


# ============================================================
# 9. PLEYSTOWE BESS — 200 MW / 800 MWh, duplicate AEMO entries
# ============================================================
def consolidate_pleystowe():
    print("\n=== 9. PLEYSTOWE BESS (QLD) — Trina Solar ===")
    primary = load_project("pleystowe-bess")
    if not primary:
        return

    primary["name"] = "Pleystowe BESS"
    primary["capacity_mw"] = 200.0
    primary["storage_mwh"] = 800.0
    primary["duration_hours"] = 4.0
    primary["current_developer"] = "Trina Solar (via Pleystowe BESS Pty Ltd)"
    primary["data_confidence"] = "medium"

    primary["timeline"] = [
        {"date": "2026-01", "date_precision": "month", "event_type": "notable",
         "title": "Development application withdrawn",
         "detail": "Trina Solar withdrew DA after QLD Planning Minister called it in following 733 submissions. Trina stated it will continue community engagement but has not re-lodged. Project effectively stalled."}
    ]

    primary["sources"] = [
        {"title": "AEMO Generation Information Jan 2026",
         "url": "https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information",
         "date": "2026-01-30", "source_tier": 1},
        {"title": "Pleystowe BESS project website", "url": "https://pleystowebess.com.au/", "source_tier": 1},
        {"title": "RenewEconomy — China giant scraps plan for big battery called in by state LNP",
         "url": "https://reneweconomy.com.au/fresh-blow-to-queensland-renewables-as-china-giant-scraps-plan-for-big-battery-called-in-by-state-lnp/",
         "source_tier": 2}
    ]

    save_project(primary, "pleystowe-bess")
    delete_project("pleystowe-bess-kci")
    update_indices("pleystowe-bess", ["pleystowe-bess-kci"], {
        "name": "Pleystowe BESS", "capacity_mw": 200.0, "storage_mwh": 800.0,
        "current_developer": "Trina Solar (via Pleystowe BESS Pty Ltd)", "data_confidence": "medium"
    })
    print("  -> Consolidated: 200 MW / 800 MWh (duplicate AEMO entries merged). DA withdrawn — stalled.")


# ============================================================
# 10. PACIFIC GREEN LIMESTONE COAST — KEEP SEPARATE (different owners)
# ============================================================
def handle_pacific_green():
    print("\n=== 10. PACIFIC GREEN LIMESTONE COAST (SA) — KEEP SEPARATE ===")
    print("  North: sold to Intera Renewables ($460M). Construction underway, COD Feb 2027.")
    print("  West: retained by Pacific Green. CIS selected. Construction May 2026.")
    print("  Different owners = keep as separate entries. Fixing West storage_mwh.")

    west = load_project("pacific-green-energy-park-limestone-coast-west")
    if west:
        west["storage_mwh"] = 1000.0
        west["duration_hours"] = 4.0
        save_project(west, "pacific-green-energy-park-limestone-coast-west")
        update_indices("pacific-green-energy-park-limestone-coast-west", [], {
            "storage_mwh": 1000.0
        })
        print("  -> West storage_mwh corrected: 500 -> 1,000 MWh")

    north = load_project("pacific-green-energy-park-limestone-coast-north")
    if north:
        north["current_developer"] = "Intera Renewables (Palisade)"
        north["current_owner"] = "Intera Renewables"
        north["status"] = "construction"
        north["duration_hours"] = 2.0
        north["cod_current"] = "2027-02"
        north["data_confidence"] = "good"
        north["ownership_history"] = [
            {"date": "2025-03", "owner": "Intera Renewables",
             "event": "Purchased from Pacific Green for A$460M."}
        ]
        north["suppliers"] = [
            {"role": "bop", "company": "Gransolar"},
            {"role": "battery_modules", "company": "Trina Storage"}
        ]
        save_project(north, "pacific-green-energy-park-limestone-coast-north")
        update_indices("pacific-green-energy-park-limestone-coast-north", [], {
            "current_developer": "Intera Renewables (Palisade)",
            "status": "construction", "data_confidence": "good"
        })
        print("  -> North: owner updated to Intera Renewables, status -> construction")


# ============================================================
# 11. GOLDEN PLAINS BESS — KEEP SEPARATE (KCI entry unverified)
# ============================================================
def handle_golden_plains():
    print("\n=== 11. GOLDEN PLAINS BESS (VIC) — KEEP SEPARATE ===")
    print("  BESS 1 (150 MW): confirmed, financial close late 2025, 168 Tesla Megapack 2XL, COD mid-2027.")
    print("  BESS 2 KCI (150 MW): no public evidence — may be future stage or separate connection enquiry.")
    print("  Keeping separate until TagEnergy clarifies.")

    primary = load_project("golden-plains-bess")
    if primary:
        primary["current_developer"] = "TagEnergy"
        primary["bess_oem"] = "Tesla"
        primary["status"] = "construction"
        primary["storage_mwh"] = 620.0
        primary["duration_hours"] = 4.0
        primary["cod_current"] = "2027-06"
        primary["data_confidence"] = "good"
        primary["timeline"] = [
            {"date": "2025-11", "date_precision": "month", "event_type": "fid",
             "title": "Financial close reached for Golden Plains BESS",
             "detail": "168 Tesla Megapack 2XL units. Construction commenced early 2026. COD mid-2027."},
            {"date": "2026-01", "date_precision": "month", "event_type": "construction_start",
             "title": "Construction commences",
             "detail": "TagEnergy's first Australian BESS project. At Golden Plains Wind Farm."}
        ]
        primary["sources"] = primary.get("sources", [])
        primary["sources"].extend([
            {"title": "TagEnergy — Golden Plains BESS construction announcement",
             "url": "https://tag-en.com/tagenergy-to-start-building-its-first-australian-battery-energy-storage-system-at-golden-plains-wind-farm/",
             "source_tier": 1},
            {"title": "RenewEconomy — Financial close for four-hour big battery",
             "url": "https://reneweconomy.com.au/financial-close-reached-for-four-hour-big-battery-to-be-built-next-to-australias-biggest-wind-farm/",
             "source_tier": 2}
        ])
        save_project(primary, "golden-plains-bess")
        update_indices("golden-plains-bess", [], {
            "current_developer": "TagEnergy", "status": "construction",
            "storage_mwh": 620.0, "data_confidence": "good"
        })
        print("  -> BESS 1 enriched: construction, Tesla Megapack 2XL, COD mid-2027")


# ============================================================
# 12. PUNCHS CREEK — FLAG SUPERSEDED ENTRY (complex)
# ============================================================
def handle_punchs_creek():
    print("\n=== 12. PUNCHS CREEK HYBRID (QLD) — EDPR/SkyLab ===")
    print("  3 AEMO entries risk triple-counting:")
    print("    punchs-creek-milmerran-bess-new (800 MW) — original SkyLab proponent entry")
    print("    punchs-creek-hybrid-stage-2-kci (200 MW) — EDPR KCI entry")
    print("    punchs-creek-hybrid-stage-3-kci (600 MW) — EDPR KCI entry")
    print("  EDPR acquired Stage 1 from SkyLab Aug 2025. KCI entries supersede the Milmerran entry.")
    print("  Flagging Milmerran as superseded. Consolidating KCI stages into one project.")

    # Consolidate the two KCI entries into one project
    primary = load_project("punchs-creek-hybrid-stage-2-kci")
    if not primary:
        return

    primary["id"] = "punchs-creek-hybrid-bess"
    primary["name"] = "Punchs Creek Hybrid BESS"
    primary["capacity_mw"] = 800.0
    primary["storage_mwh"] = 3200.0
    primary["duration_hours"] = 4.0
    primary["current_developer"] = "EDPR Australia"
    primary["data_confidence"] = "medium"

    primary["stages"] = [
        {"stage": 1, "name": "Stage 1 (EDPR)", "capacity_mw": 400.0, "storage_mwh": 1600.0,
         "status": "development",
         "notes": "EDPR acquired from SkyLab Aug 2025. QIC co-investment. 480 MWp solar + 400 MW BESS. EPBC approved May 2024."},
        {"stage": 2, "name": "Stage 2 (SkyLab retained)", "capacity_mw": 400.0, "storage_mwh": 1600.0,
         "status": "development",
         "notes": "SkyLab retained Stage 2 rights. Additional ~400 MW solar expansion."}
    ]

    primary["timeline"] = [
        {"date": "2024-05", "date_precision": "month", "event_type": "planning_approved",
         "title": "EPBC Act approval for 800 MW solar + battery hybrid",
         "detail": "Federal approval for full site near Millmerran, 64km SW of Toowoomba."},
        {"date": "2025-08", "date_precision": "month", "event_type": "notable",
         "title": "EDPR Australia acquires Stage 1 from SkyLab",
         "detail": "EDPR + QIC partner for Stage 1 (480 MWp solar + 400 MW / 1,600 MWh BESS). SkyLab retains Stage 2."}
    ]

    primary["sources"] = [
        {"title": "AEMO Generation Information Jan 2026",
         "url": "https://aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information",
         "date": "2026-01-30", "source_tier": 1},
        {"title": "EDPR Australia — Punchs Creek project page",
         "url": "https://edp.com/en/asia-pacific/australia/punchs-creek-renewable-energy-project", "source_tier": 1},
        {"title": "Energy-Storage.News — QIC/EDPR 1,600 MWh solar+storage project",
         "url": "https://www.energy-storage.news/qic-edp-partner-for-1600mwh-solar-plus-storage-project-in-queensland-australia/",
         "source_tier": 2}
    ]

    save_project(primary, "punchs-creek-hybrid-bess")
    for old_id in ["punchs-creek-hybrid-stage-2-kci", "punchs-creek-hybrid-stage-3-kci"]:
        delete_project(old_id)

    # Mark the Milmerran entry as superseded
    milmerran = load_project("punchs-creek-milmerran-bess-new")
    if milmerran:
        milmerran["_superseded_by"] = "punchs-creek-hybrid-bess"
        milmerran["_notes"] = "Original SkyLab proponent entry. EDPR acquired Stage 1 Aug 2025. KCI entries (now consolidated into punchs-creek-hybrid-bess) are authoritative. This entry risks double-counting."
        milmerran["data_confidence"] = "low"
        save_project(milmerran, "punchs-creek-milmerran-bess-new")

    update_indices("punchs-creek-hybrid-stage-2-kci", ["punchs-creek-hybrid-stage-3-kci"], {
        "id": "punchs-creek-hybrid-bess", "name": "Punchs Creek Hybrid BESS",
        "capacity_mw": 800.0, "storage_mwh": 3200.0,
        "current_developer": "EDPR Australia", "data_confidence": "medium"
    })
    for idx_path in [INDEX_DATA, INDEX_FE]:
        with open(idx_path) as f:
            index = json.load(f)
        for p in index:
            if p["id"] == "punchs-creek-hybrid-stage-2-kci":
                p["id"] = "punchs-creek-hybrid-bess"
        with open(idx_path, 'w') as f:
            json.dump(index, f, indent=2)

    print("  -> KCI stages consolidated: 800 MW / 3,200 MWh. Milmerran entry flagged as superseded.")


# ============================================================
# UPDATE CONSOLIDATION GUARD
# ============================================================
def update_guard():
    print("\n=== UPDATING CONSOLIDATION GUARD ===")

    aemo_ids = {
        # Eraring (already in guard)
        # Reeves Plains (already in guard)
        # Bremer Battery
        "2979": {"parent_project": "bremer-battery", "reason": "Bremer Battery 2 — AEMO DUID split of single 850 MW project", "consolidated_date": TODAY},
        "2980": {"parent_project": "bremer-battery", "reason": "Bremer Battery 3 — AEMO DUID split of single 850 MW project", "consolidated_date": TODAY},
        "2981": {"parent_project": "bremer-battery", "reason": "Bremer Battery 4 — AEMO DUID split of single 850 MW project", "consolidated_date": TODAY},
        # Supernode North
        "2831": {"parent_project": "supernode-north-bess", "reason": "Supernode North BESS 2 — AEMO DUID split of single 780 MW project", "consolidated_date": TODAY},
        "2832": {"parent_project": "supernode-north-bess", "reason": "Supernode North BESS 3 — AEMO DUID split of single 780 MW project", "consolidated_date": TODAY},
        # Blackstone
        "2741": {"parent_project": "blackstone-bess", "reason": "Blackstone BESS 2 KCI — same 500 MW project, dual AEMO connection entries", "consolidated_date": TODAY},
        # Mount Britton
        "2971": {"parent_project": "mount-britton-bess", "reason": "Mount Britton BESS2 — same 500 MW project, dual AEMO entries", "consolidated_date": TODAY},
        # Bouldercombe
        "2712": {"parent_project": "bouldercombe-battery-project", "reason": "Bouldercombe Stage 2 KCI — expansion of operating 50 MW project", "consolidated_date": TODAY},
        # Goyder
        "3161": {"parent_project": "goyder-bess", "reason": "Goyder BESS Stage 2 — part of 900 MW approved Goyder Battery envelope", "consolidated_date": TODAY},
        # Nine Mile
        "3087": {"parent_project": "nine-mile-energy-park-bess", "reason": "Nine Mile Energy Park Stage 2 BESS — same energy park, staged development", "consolidated_date": TODAY},
        # Pleystowe
        "2836": {"parent_project": "pleystowe-bess", "reason": "Pleystowe BESS KCI — duplicate AEMO entry for same 200 MW project", "consolidated_date": TODAY},
        # Punchs Creek
        "3210": {"parent_project": "punchs-creek-hybrid-bess", "reason": "Punchs Creek Hybrid Stage 3 KCI — consolidated with Stage 2 KCI", "consolidated_date": TODAY},
    }

    slugs = {
        "bremer-battery-1": {"parent_project": "bremer-battery", "reason": "Renamed to bremer-battery (consolidated 4 DUIDs)", "consolidated_date": TODAY},
        "bremer-battery-2": {"parent_project": "bremer-battery", "reason": "Merged into bremer-battery", "consolidated_date": TODAY},
        "bremer-battery-3": {"parent_project": "bremer-battery", "reason": "Merged into bremer-battery", "consolidated_date": TODAY},
        "bremer-battery-4": {"parent_project": "bremer-battery", "reason": "Merged into bremer-battery", "consolidated_date": TODAY},
        "supernode-north-bess-1": {"parent_project": "supernode-north-bess", "reason": "Renamed to supernode-north-bess", "consolidated_date": TODAY},
        "supernode-north-bess-2": {"parent_project": "supernode-north-bess", "reason": "Merged into supernode-north-bess", "consolidated_date": TODAY},
        "supernode-north-bess-3": {"parent_project": "supernode-north-bess", "reason": "Merged into supernode-north-bess", "consolidated_date": TODAY},
        "blackstone-bess-2-kci": {"parent_project": "blackstone-bess", "reason": "Merged into blackstone-bess", "consolidated_date": TODAY},
        "mount-britton-bess1": {"parent_project": "mount-britton-bess", "reason": "Renamed to mount-britton-bess", "consolidated_date": TODAY},
        "mount-britton-bess2": {"parent_project": "mount-britton-bess", "reason": "Merged into mount-britton-bess", "consolidated_date": TODAY},
        "bouldercombe-battery-project-stage-2-kci": {"parent_project": "bouldercombe-battery-project", "reason": "Merged as Stage 2", "consolidated_date": TODAY},
        "goyder-bess-stage-2": {"parent_project": "goyder-bess", "reason": "Merged as Stage 2 of Goyder Battery", "consolidated_date": TODAY},
        "nine-mile-energy-park-stage-1-bess": {"parent_project": "nine-mile-energy-park-bess", "reason": "Renamed to nine-mile-energy-park-bess", "consolidated_date": TODAY},
        "nine-mile-energy-park-stage-2-bess": {"parent_project": "nine-mile-energy-park-bess", "reason": "Merged into nine-mile-energy-park-bess", "consolidated_date": TODAY},
        "pleystowe-bess-kci": {"parent_project": "pleystowe-bess", "reason": "Duplicate AEMO entry for same project", "consolidated_date": TODAY},
        "punchs-creek-hybrid-stage-2-kci": {"parent_project": "punchs-creek-hybrid-bess", "reason": "Renamed + consolidated with Stage 3", "consolidated_date": TODAY},
        "punchs-creek-hybrid-stage-3-kci": {"parent_project": "punchs-creek-hybrid-bess", "reason": "Merged into punchs-creek-hybrid-bess", "consolidated_date": TODAY},
    }

    add_to_guard(aemo_ids, slugs)
    print(f"  Added {len(aemo_ids)} AEMO IDs and {len(slugs)} slugs to consolidation guard")


# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    if not os.path.exists(DATA_DIR):
        print("ERROR: Run from repo root (aures-db/)")
        sys.exit(1)

    consolidate_eraring()        # 1
    consolidate_bremer()         # 2
    consolidate_supernode_north() # 3
    consolidate_blackstone()     # 4
    consolidate_mount_britton()  # 5
    consolidate_bouldercombe()   # 6
    consolidate_goyder()         # 7
    consolidate_nine_mile()      # 8
    consolidate_pleystowe()      # 9
    handle_pacific_green()       # 10 - keep separate, fix data
    handle_golden_plains()       # 11 - keep separate, enrich
    handle_punchs_creek()        # 12 - complex consolidation
    update_guard()

    print("\n=== ALL CONSOLIDATIONS COMPLETE ===")
    print("\nSummary:")
    print("  9 projects consolidated (secondary files deleted)")
    print("  2 projects kept separate (Pacific Green: different owners, Golden Plains: unverified)")
    print("  1 complex case (Punchs Creek: KCI stages consolidated, Milmerran flagged as superseded)")
    print("  Consolidation guard updated with all new entries")
