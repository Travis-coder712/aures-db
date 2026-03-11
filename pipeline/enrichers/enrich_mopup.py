#!/usr/bin/env python3
"""Mop-up enrichment — offshore wind, REZ access rights, construction coords,
key development projects.

Data sourced from web research (March 2026):
  - DCCEEW offshore wind feasibility licences & declared areas
  - EnergyCo REZ access rights announcements (CWO May 2025, SW Apr 2025)
  - Project developer websites, RenewEconomy, Energy-Storage.News
  - Global Energy Monitor, 4C Offshore, Infrastructure Pipeline
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')

# ─── OFFSHORE WIND ENRICHMENT ─────────────────────────────────────────────

OFFSHORE_WIND = [
    # ── Star of the South (most advanced) ──
    {
        'id': 'star-of-the-south-wind-farm',
        'updates': {
            'current_developer': 'Southerly Ten (Copenhagen Infrastructure Partners / Cbus Super)',
            'notable': 'Most advanced Australian offshore wind project. Feasibility licence FL-01 granted May 2024 for 586 km2 area 10+ km off Gippsland coast. EIS lodged Dec 2025 under EPBC Act. Targeting first power ~2030. Estimated A$8-10B.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-05-01', 'month', 'approval', 'Feasibility licence FL-01 granted', 'Exclusive feasibility licence for 586 km2 area in Gippsland Offshore Wind Zone'),
            ('2025-10-01', 'month', 'community', 'GLaWAC engagement agreement signed', 'Gunaikurnai Land and Waters Aboriginal Corporation signed engagement agreement'),
            ('2025-12-01', 'month', 'approval', 'EIS lodged under EPBC Act', 'Environmental Impact Statement lodged for primary environmental approval'),
        ],
    },
    # ── Blue Mackerel North (JERA Nex bp — most advanced in Gippsland) ──
    {
        'id': 'blue-mackerel-north-offshore-wind-farm',
        'updates': {
            'current_developer': 'JERA Nex bp (50:50 JV JERA Co. / bp, via Parkwind)',
            'notable': 'First offshore wind management plan approved in Australia (Feb 2025). Major Project Status Dec 2025. EPBC referral Feb 2026. ~70 turbines (15-23 MW each) in 163 km2, ~10 km off Gippsland coast. Target 1 GW by 2032.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-04-01', 'month', 'approval', 'Feasibility licence FL-001 awarded', 'First feasibility licence under Offshore Electricity Infrastructure Act 2021'),
            ('2025-02-28', 'day', 'approval', 'First OIR management plan approved', 'First offshore wind management plan approved in Australia'),
            ('2025-12-11', 'day', 'notable', 'Major Project Status awarded', 'Federal government awarded Major Project Status'),
            ('2026-02-01', 'month', 'approval', 'EPBC referral lodged', 'Applied for federal environmental approval under EPBC Act'),
        ],
    },
    # ── Blue Mackerel North (Off Shore — duplicate AEMO entry, same project) ──
    {
        'id': 'blue-mackerel-north-off-shore-wind-farm',
        'updates': {
            'current_developer': 'JERA Nex bp (50:50 JV JERA Co. / bp, via Parkwind)',
            'notable': 'Likely duplicate AEMO entry for Blue Mackerel North project. See blue-mackerel-north-offshore-wind-farm for primary record.',
            'data_confidence': 'low',
        },
        'events': [],
    },
    # ── Ørsted Gippsland A+B (01) ──
    {
        'id': 'orsted-gippsland-a-and-b-windfarm',
        'updates': {
            'current_developer': 'Ørsted Offshore Australia 1 Pty Ltd',
            'notable': 'Active feasibility licence. 2.8 GW in 700 km2, 56-100 km off Gippsland coast. OIR management plan approved Mar 2025. Geotechnical surveys underway. Part of 4.8 GW Gippsland cluster with Gippsland 02. Target early 2030s.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-05-01', 'month', 'approval', 'Feasibility licence granted (Gippsland 01)', 'Feasibility licence for 700 km2 area in Gippsland Offshore Wind Zone'),
            ('2025-03-27', 'day', 'approval', 'OIR management plan approved', 'Feasibility stage management plan approved by Offshore Infrastructure Regulator'),
        ],
    },
    # ── Ørsted Gippsland C (02) ──
    {
        'id': 'orsted-gippsland-c-windfarm',
        'updates': {
            'current_developer': 'Ørsted Offshore Australia 1 Pty Ltd',
            'notable': 'Active feasibility licence. Up to 2 GW in 490 km2, 56-100 km off Gippsland coast. Joint management plan approved Mar 2025 alongside Gippsland 01.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-07-01', 'month', 'approval', 'Feasibility licence granted (Gippsland 02)', 'Feasibility licence for 490 km2 area in Gippsland Offshore Wind Zone'),
            ('2025-03-27', 'day', 'approval', 'OIR management plan approved', 'Joint management plan approved by OIR for Gippsland 01 and 02'),
        ],
    },
    # ── Great Eastern Offshore Wind (Corio Generation) ──
    {
        'id': 'great-eastern-offshore-wind-kci',
        'updates': {
            'current_developer': 'Corio Generation (Macquarie Green Investment Group)',
            'notable': 'Active feasibility licence. 2.5 GW bottom-fixed, ~22 km off Wellington Shire coast. Feasibility licence Jul 2024. Community engagement events Mar 2025. Part of Corio 4 GW Australian pipeline.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-07-01', 'month', 'approval', 'Feasibility licence granted', 'Feasibility licence for Gippsland Offshore Wind Zone'),
            ('2025-03-01', 'month', 'community', 'Community engagement events', 'Joint community engagement in Port Albert, Golden Beach, Sale, Leongatha'),
        ],
    },
    # ── Greater Southern Offshore Wind (Corio) ──
    {
        'id': 'greater-southern-offshore-wind-kci',
        'updates': {
            'current_developer': 'Corio Generation (Macquarie Green Investment Group)',
            'notable': '1.5 GW fixed-bottom off Gippsland Bass Coast, ~45 km from coast. Did NOT receive Gippsland feasibility licence — declared zone does not extend to Bass Coast. Status uncertain.',
            'data_confidence': 'medium',
        },
        'events': [
            ('2021-11-01', 'month', 'conceived', 'Project announced by GIG/Corio', 'GIG commenced preliminary works on Great Southern off Bass Coast'),
        ],
    },
    # ── Spinifex (Alinta / JERA Nex) — Southern Ocean ──
    {
        'id': 'spinifex-offshore-wind-farm',
        'updates': {
            'current_developer': 'Alinta Energy / JERA Nex (Parkwind)',
            'notable': 'Most advanced Southern Ocean project. First feasibility licence in Southern Ocean zone (Feb 2025). 1.2 GW bottom-fixed, 15-20 km off Warrnambool/Port Fairy. ARENA funding.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-02-01', 'month', 'approval', 'Feasibility licence granted', 'First feasibility licence awarded in Southern Ocean offshore wind zone'),
        ],
    },
    # ── Gippsland Dawn — CANCELLED ──
    {
        'id': 'gippsland-dawn-offshore-wind-project',
        'updates': {
            'current_developer': 'BlueFloat Energy / Energy Estate (CANCELLED)',
            'notable': 'Project abandoned Jul 2025. BlueFloat surrendered feasibility licence FL-07 after parent Quantum Capital Group ceased all global offshore wind operations. Had received Major Project Status Nov 2024.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-07-01', 'month', 'approval', 'Feasibility licence FL-07 granted', 'Received feasibility licence for Gippsland Offshore Wind Zone'),
            ('2024-11-01', 'month', 'notable', 'Major Project Status awarded', 'Federal government awarded Major Project Status'),
            ('2025-07-14', 'day', 'notable', 'CANCELLED — licence surrendered', 'BlueFloat surrendered FL-07 after Quantum Capital ceased global offshore wind operations'),
        ],
    },
    # ── Cape Winds — SHELVED ──
    {
        'id': 'cape-winds-offshore-wind-farm',
        'updates': {
            'current_developer': 'Unknown (Shelved)',
            'notable': 'Shelved/failed proposal. Proposed for Discovery Bay area between Portland VIC and Nelson. Superseded by Spinifex project which holds active Southern Ocean feasibility licence.',
            'data_confidence': 'medium',
        },
        'events': [],
    },
    # ── Southern Winds — CANCELLED ──
    {
        'id': 'southern-winds-offshore-wind',
        'updates': {
            'current_developer': 'BlueFloat Energy / Energy Estate (CANCELLED)',
            'notable': 'Cancelled mid-2025. BlueFloat ceased all global operations after parent Quantum Capital determined offshore wind no longer viable. 1,155 MW proposed 8-20 km off coast between Cape Douglas SA and Nelson VIC.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-07-01', 'month', 'notable', 'CANCELLED — BlueFloat ceases operations', 'Quantum Capital Group ceased funding all BlueFloat offshore wind operations globally'),
        ],
    },
    # ── Eastern Rise — FAILED ──
    {
        'id': 'eastern-rise-offshore-wind',
        'updates': {
            'current_developer': 'BlueFloat Energy / Origin Energy (CANCELLED)',
            'notable': 'Failed to secure feasibility licence. 1,725 MW floating wind 25-45 km off Hunter coast. Lost to Novocastrian in Hunter zone assessment. BlueFloat subsequently ceased all operations mid-2025.',
            'data_confidence': 'high',
        },
        'events': [
            ('2023-12-01', 'month', 'corporate', 'Origin Energy joins as partner', 'BlueFloat and Origin submit joint feasibility licence application for Hunter zone'),
            ('2025-02-01', 'month', 'notable', 'Not selected for feasibility licence', 'Only Novocastrian selected in Hunter zone; Eastern Rise assessed as lower merit'),
        ],
    },
    # ── Illawarra — WITHDRAWN ──
    {
        'id': 'illawarra-offshore-wind-farm',
        'updates': {
            'current_developer': 'Equinor / Oceanex Energy (WITHDRAWN)',
            'notable': 'Equinor/Oceanex withdrew Jun 2024. Illawarra zone declared Jun 2024 but no feasibility licences awarded. Zone now open for R&D licences only (Jan 2026).',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-06-15', 'day', 'approval', 'Illawarra offshore wind area declared', 'Area declared suitable for offshore renewable energy (1,022 km2)'),
            ('2024-06-01', 'month', 'notable', 'Equinor/Oceanex withdraw', 'Shifted focus to Hunter zone Novocastrian project'),
            ('2026-01-01', 'month', 'notable', 'No feasibility licences awarded', 'Government confirmed no applications could be progressed; R&D licences only'),
        ],
    },
    # ── Novocastrian — CANCELLED ──
    {
        'id': 'novocastrian-offshore-wind-farm',
        'updates': {
            'current_developer': 'Equinor / Oceanex Energy (LICENCE DECLINED)',
            'notable': 'Feasibility licence offered Feb 2025 but declined Aug 2025. Only project selected from 8 applicants in Hunter zone. Equinor cited global offshore wind challenges. Hunter zone now has zero active licences.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-02-27', 'day', 'approval', 'Feasibility licence offered', 'Only project offered licence from 8 applicants in Hunter zone'),
            ('2025-08-22', 'day', 'notable', 'CANCELLED — licence declined', 'Equinor declined feasibility licence citing global industry challenges'),
        ],
    },
    # ── Eden — SHELVED ──
    {
        'id': 'eden-offshore-wind-farm',
        'updates': {
            'current_developer': 'Oceanex Energy (Equinor withdrew)',
            'notable': 'Effectively shelved. 2 GW floating wind off Eden NSW south coast. Equinor pulled out 2024-2025. Oceanex lacks capital to proceed alone. Estimated $10B project.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-08-01', 'month', 'notable', 'Equinor-Oceanex partnership dissolved', 'Equinor confirmed exit from all Australian offshore wind projects'),
        ],
    },
    # ── Hunter Central Coast — FAILED ──
    {
        'id': 'hunter-central-coast-offshore-energy-wind',
        'updates': {
            'notable': 'Did not receive Hunter zone feasibility licence. Originally 1.4 GW expanded to 1.65 GW. BlueFloat split from project early 2023. Energy Estate developing independently. Hunter zone has zero active licences.',
            'data_confidence': 'medium',
        },
        'events': [
            ('2022-10-01', 'month', 'notable', 'Capacity expanded to 1.65 GW', 'Project expanded from 1,400 MW to 1,650 MW'),
            ('2025-02-01', 'month', 'notable', 'Not selected for Hunter zone licence', 'Only Novocastrian selected; all other applicants unsuccessful'),
        ],
    },
    # ── Bass Offshore Wind (Tasmania) ──
    {
        'id': 'bass-offshore-wind-energy-project',
        'updates': {
            'current_developer': 'Nexsphere (formerly Brookvale Energy)',
            'notable': 'Proposed 500 MW (scaled to 1.5 GW) bottom-fixed off NE Tasmania in Bass Strait. Equinor withdrew early 2025. Failed to obtain feasibility licence Apr 2025. Nexsphere seeking new partners.',
            'data_confidence': 'medium',
        },
        'events': [
            ('2022-12-01', 'month', 'corporate', 'Equinor joins as majority partner', 'Equinor and Nexsphere collaborate on Bass Strait offshore wind'),
            ('2025-01-01', 'month', 'notable', 'Equinor withdraws', 'Equinor ended collaboration; cited shift to core oil and gas operations'),
            ('2025-04-01', 'month', 'notable', 'Feasibility licence not obtained', 'Failed to obtain licence during application window'),
        ],
    },
    # ── Seaspray (likely Aurora Green / Iberdrola) ──
    {
        'id': 'seaspray-off-shore-wind-farm',
        'updates': {
            'current_developer': 'BayWa r.e. Australia (AEMO-registered developer)',
            'notable': 'AEMO registration only — limited public record. May relate to Aurora Green (Iberdrola, 3 GW in Gippsland zone near Seaspray, feasibility licence Jul 2024).',
            'data_confidence': 'low',
        },
        'events': [],
    },
    # ── Deal 1 West ──
    {
        'id': 'deal-1-west-off-shore-wind-farm',
        'updates': {
            'notable': 'AEMO Generation Information entry only — no public project documentation found. BayWa r.e. Australia is registered developer.',
            'data_confidence': 'low',
        },
        'events': [],
    },
    # ── Deal 2 East ──
    {
        'id': 'deal-2-east-off-shore-wind-farm',
        'updates': {
            'notable': 'AEMO Generation Information entry only — no public project documentation found. BayWa r.e. Australia is registered developer.',
            'data_confidence': 'low',
        },
        'events': [],
    },
    # ── South Pacific (BlueFloat) ──
    {
        'id': 'south-pacific-offshore-wind-project',
        'updates': {
            'current_developer': 'BlueFloat Energy / Energy Estate (LIKELY CANCELLED)',
            'notable': '1,600 MW floating wind off NSW. BlueFloat ceased all global operations mid-2025 after parent Quantum Capital Group wound down offshore wind.',
            'data_confidence': 'medium',
        },
        'events': [
            ('2025-07-01', 'month', 'notable', 'LIKELY CANCELLED — BlueFloat ceases operations', 'Quantum Capital Group ceased funding all BlueFloat offshore wind globally'),
        ],
    },
    # ── Ulladulla ──
    {
        'id': 'ulladulla-offshore-wind-farm',
        'updates': {
            'notable': 'Proposed 2 GW off Ulladulla NSW coast. Oceanex Energy developer. Equinor partnership dissolved. Very early stage — limited public documentation.',
            'data_confidence': 'low',
        },
        'events': [],
    },
]

# ─── REZ ACCESS RIGHTS ENRICHMENT ─────────────────────────────────────────

# CWO REZ — 10 projects awarded access rights, May 2025, total 7.15 GW
CWO_REZ_ACCESS = [
    # Most already have rez='nsw-central-west-orana' from AEMO data.
    # Fill in the missing ones and add access rights events.
    {'id': 'birriwa-bess', 'rez': 'nsw-central-west-orana'},
    {'id': 'cobbora-bess', 'rez': 'nsw-central-west-orana'},
    {'id': 'sandy-creek-standalone-bess', 'rez': 'nsw-central-west-orana'},
]

CWO_REZ_EVENTS = [
    # Add access rights event to all 10 CWO projects
    ('valley-of-the-winds', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 919 MW access rights in Central-West Orana REZ by EnergyCo'),
    ('birriwa-solar-farm', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 600 MW access rights in CWO REZ by EnergyCo'),
    ('birriwa-bess', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 600 MW access rights in CWO REZ by EnergyCo'),
    ('sandy-creek-solar-farm', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 700 MW access rights in CWO REZ by EnergyCo'),
    ('sandy-creek-energy-storage-system', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 700 MW access rights in CWO REZ by EnergyCo'),
    ('cobbora-solar-farm', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 700 MW access rights in CWO REZ by EnergyCo'),
    ('cobbora-bess', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 400 MW access rights in CWO REZ by EnergyCo'),
    ('tallawang-solar-and-bess', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 500 MW access rights in CWO REZ by EnergyCo'),
    ('spicers-creek-wind-farm', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 700 MW access rights in CWO REZ by EnergyCo'),
    ('liverpool-range-wind-farm', '2025-05-08', 'month', 'approval', 'CWO REZ access rights awarded', 'Awarded 1,332 MW access rights in CWO REZ by EnergyCo'),
]

# SW REZ — 4 projects awarded access rights, Apr 2025, total 3.56 GW
SW_REZ_EVENTS = [
    ('yanco-delta-wind-farm', '2025-04-01', 'month', 'approval', 'SW REZ access rights awarded', 'Awarded 1,460 MW transmission access rights in South-West REZ by EnergyCo'),
    ('dinawan-energy-hub', '2025-04-01', 'month', 'approval', 'SW REZ access rights awarded', 'Awarded ~1,007 MW access rights in SW REZ (707 MW wind + 300 MW solar/BESS)'),
    ('bullawah-wind-farm-stage-1', '2025-04-01', 'month', 'approval', 'SW REZ access rights awarded', 'Awarded 262.3 MW access rights in SW REZ by EnergyCo'),
    # Pottinger has 3 entries (wind/solar/battery) — add to wind as primary
    ('pottinger-energy-park-wind-kci', '2025-04-01', 'month', 'approval', 'SW REZ access rights awarded', 'Awarded 831.2 MW access rights in SW REZ by EnergyCo (wind + 400 MW battery)'),
]

# ─── CONSTRUCTION PROJECT COORDINATES ─────────────────────────────────────
# From research agent results + known locations

COORDINATES = [
    # Project ID, latitude, longitude
    ('golden-plains-wind-farm-west', -37.90, 143.70),    # Near Rokewood VIC
    ('liddell-bess', -32.3715, 150.978),                  # Liddell Power Station, Hunter Valley
    ('wambo-wind-farm', -26.648, 151.306),                # Near Jandowae QLD
    ('goulburn-river-solar-farm-and-bess', -32.28, 150.10),  # 28 km S of Merriwa, Upper Hunter
    ('orana-bess', -32.54, 148.95),                       # 2 km NE of Wellington NSW
    ('uungula-wind-farm', -32.50, 149.10),                # Near Wellington/Mudgee NSW
    ('wooreen-energy-storage-system', -38.28, 146.38),    # Near Hazelwood, Latrobe Valley
    ('elaine-bess', -37.75, 144.05),                      # Near Elaine VIC
    ('mortlake-battery', -38.08, 142.78),                 # Near Mortlake VIC
    ('tarong-bess-stanwell', -26.77, 151.92),             # Tarong Power Station QLD
    ('broadsound-solar-farm', -22.30, 149.50),            # Broadsound QLD
    ('lotus-creek-wind-farm', -22.00, 149.20),            # Near Lotus Creek QLD
    ('bungama-solar', -32.85, 138.15),                    # Near Bungama SA
    ('goorambat-east-solar-farm-engie', -36.55, 146.05),  # Near Benalla VIC
    ('williamsdale-bess', -35.45, 149.10),                # Near Williamsdale, south of Canberra
    ('wandoan-south-solar-stage-2', -26.16, 149.97),      # Near Wandoan QLD
    ('woolooga-bess', -26.06, 152.32),                    # Near Woolooga QLD
    ('tailem-bend-stage-3', -35.26, 139.45),              # Near Tailem Bend SA
    ('new-england-solar-farm-bess', -30.60, 151.60),      # Near Uralla NSW
    ('pelican-point-bess', -34.77, 138.53),               # Pelican Point, Adelaide SA
    ('supernode-bess', -27.55, 152.20),                   # Near Ipswich QLD
    ('eraring-battery', -33.07, 151.53),                  # Eraring Power Station NSW
    ('bellambi-heights-renewables-project', -34.37, 150.84),  # Bellambi Heights NSW
]

# ─── KEY DEVELOPMENT PROJECT ENRICHMENT ────────────────────────────────────

KEY_PROJECTS = [
    {
        'id': 'yanco-delta-wind-farm',
        'updates': {
            'current_developer': 'Origin Energy (acquired from Virya Energy)',
            'notable': '1.5 GW wind (208 turbines, 270m tip) + 800 MWh BESS. 33,000 ha site 10 km NW of Jerilderie in SW REZ. ~$4B project. 1,460 MW transmission access secured. FID target mid-FY2027.',
            'data_confidence': 'high',
        },
        'events': [
            ('2023-12-01', 'month', 'approval', 'NSW development approval granted', 'NSW Government development approval received'),
            ('2024-02-01', 'month', 'approval', 'EPBC approval granted', 'Commonwealth environmental approval received'),
            ('2024-05-01', 'month', 'corporate', 'Origin Energy acquisition completed', 'Acquired from Virya Energy for up to $300M'),
        ],
    },
    {
        'id': 'dinawan-energy-hub',
        'updates': {
            'current_developer': 'Spark Renewables (Tenaga Nasional Berhad subsidiary)',
            'notable': 'Hybrid wind+solar+BESS. Access rights: 707 MW wind + 300 MW solar + 300 MW/1,200 MWh BESS. Full vision ~2.5 GW. Adjacent to Transgrid Dinawan Substation. CIP holds option for minority interest. CIS Tender winner.',
            'data_confidence': 'high',
        },
        'events': [],
    },
    {
        'id': 'liverpool-range-wind-farm',
        'updates': {
            'current_developer': 'Tilt Renewables',
            'notable': '1,332 MW wind in CWO REZ. Largest single wind access rights allocation in CWO REZ tender.',
            'data_confidence': 'medium',
        },
        'events': [],
    },
    {
        'id': 'spicers-creek-wind-farm',
        'updates': {
            'current_developer': 'Squadron Energy (Tattarang)',
            'notable': '700 MW wind in CWO REZ. Squadron Energy is Tattarang (Andrew Forrest) subsidiary.',
            'data_confidence': 'medium',
        },
        'events': [],
    },
]

# ─── APPLY ENRICHMENT ──────────────────────────────────────────────────────

def apply_enrichment():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    stats = {'projects_updated': 0, 'events_added': 0, 'coords_added': 0, 'rez_fixed': 0}

    # 1. Offshore wind enrichment
    print("─── Offshore Wind Enrichment ───")
    for proj in OFFSHORE_WIND:
        pid = proj['id']
        updates = proj.get('updates', {})
        events = proj.get('events', [])

        # Check project exists
        c.execute("SELECT id FROM projects WHERE id = ?", (pid,))
        if not c.fetchone():
            print(f"  SKIP: {pid} not found in DB")
            continue

        # Apply updates
        set_clauses = []
        values = []
        for field, value in updates.items():
            set_clauses.append(f"{field} = ?")
            values.append(value)

        if set_clauses:
            values.append(pid)
            sql = f"UPDATE projects SET {', '.join(set_clauses)}, last_updated = date('now') WHERE id = ?"
            c.execute(sql, values)
            stats['projects_updated'] += 1

        # Add events
        for ev in events:
            date_val, precision, ev_type, title, detail = ev
            c.execute("""INSERT OR IGNORE INTO timeline_events
                (project_id, date, date_precision, event_type, title, detail, data_source)
                VALUES (?, ?, ?, ?, ?, ?, 'manual')""",
                (pid, date_val, precision, ev_type, title, detail))
            if c.rowcount > 0:
                stats['events_added'] += 1

        print(f"  ✓ {pid}: updated fields + {len(events)} events")

    # 2. REZ access rights — fill missing REZ values
    print("\n─── REZ Access Rights ───")
    for rez_fix in CWO_REZ_ACCESS:
        c.execute("UPDATE projects SET rez = ? WHERE id = ? AND (rez IS NULL OR rez = '')",
                  (rez_fix['rez'], rez_fix['id']))
        if c.rowcount > 0:
            stats['rez_fixed'] += 1
            print(f"  ✓ {rez_fix['id']}: REZ set to {rez_fix['rez']}")

    # 3. REZ access rights events
    print("\n─── REZ Access Rights Events ───")
    for pid, date_val, precision, ev_type, title, detail in CWO_REZ_EVENTS + SW_REZ_EVENTS:
        c.execute("""INSERT OR IGNORE INTO timeline_events
            (project_id, date, date_precision, event_type, title, detail, data_source)
            VALUES (?, ?, ?, ?, ?, ?, 'manual')""",
            (pid, date_val, precision, ev_type, title, detail))
        if c.rowcount > 0:
            stats['events_added'] += 1
            print(f"  ✓ {pid}: {title}")

    # 4. Coordinates
    print("\n─── Construction Project Coordinates ───")
    for pid, lat, lon in COORDINATES:
        c.execute("UPDATE projects SET latitude = ?, longitude = ? WHERE id = ? AND (latitude IS NULL OR latitude = 0)",
                  (lat, lon, pid))
        if c.rowcount > 0:
            stats['coords_added'] += 1
            print(f"  ✓ {pid}: ({lat}, {lon})")

    # 5. Key development projects
    print("\n─── Key Development Projects ───")
    for proj in KEY_PROJECTS:
        pid = proj['id']
        updates = proj.get('updates', {})
        events = proj.get('events', [])

        c.execute("SELECT id FROM projects WHERE id = ?", (pid,))
        if not c.fetchone():
            print(f"  SKIP: {pid} not found in DB")
            continue

        set_clauses = []
        values = []
        for field, value in updates.items():
            set_clauses.append(f"{field} = ?")
            values.append(value)

        if set_clauses:
            values.append(pid)
            sql = f"UPDATE projects SET {', '.join(set_clauses)}, last_updated = date('now') WHERE id = ?"
            c.execute(sql, values)
            stats['projects_updated'] += 1

        for ev in events:
            date_val, precision, ev_type, title, detail = ev
            c.execute("""INSERT OR IGNORE INTO timeline_events
                (project_id, date, date_precision, event_type, title, detail, data_source)
                VALUES (?, ?, ?, ?, ?, ?, 'manual')""",
                (pid, date_val, precision, ev_type, title, detail))
            if c.rowcount > 0:
                stats['events_added'] += 1

        print(f"  ✓ {pid}: updated")

    conn.commit()
    conn.close()

    print(f"\n═══ Enrichment Complete ═══")
    print(f"  Projects updated: {stats['projects_updated']}")
    print(f"  Events added:     {stats['events_added']}")
    print(f"  Coordinates added: {stats['coords_added']}")
    print(f"  REZ fixes:        {stats['rez_fixed']}")

if __name__ == '__main__':
    apply_enrichment()
