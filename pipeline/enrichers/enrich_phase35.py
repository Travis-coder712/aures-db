#!/usr/bin/env python3
"""Phase 3.5 — Enrich ~50 non-solar construction/development projects.

Populates:
  - timeline_events (milestones with dates)
  - suppliers (OEM, EPC, BoP with source URLs)
  - source_references + project_sources (web sources with links)
  - scheme_contracts (LTESA, CIS, etc.)
  - projects fields (developer, notable, data_confidence, rez)

Data sourced from company websites, OEM announcements, RenewEconomy,
Energy-Storage.News, government sources — March 2026 research.
"""

import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')

# ─── ENRICHMENT DATA ────────────────────────────────────────────────────────

PROJECTS = [
    # ══════════════════════════════════════════════════════════════════════
    # PUMPED HYDRO
    # ══════════════════════════════════════════════════════════════════════
    {
        'id': 'snowy-20',
        'updates': {
            'current_developer': 'Snowy Hydro Ltd',
            'current_operator': 'Snowy Hydro Ltd',
            'notable': 'Largest committed renewable energy project in Australia. Serial cost blowouts from A$2B to A$12B+. ~70% complete.',
            'data_confidence': 'high',
            'latitude': -35.8833,
            'longitude': 148.5000,
        },
        'events': [
            ('2017-03-01', 'month', 'conceived', 'Announced by PM Turnbull', 'Snowy 2.0 pumped hydro expansion announced by Prime Minister Malcolm Turnbull'),
            ('2018-12-12', 'day', 'notable', 'FID — Board approval', 'Snowy Hydro board approved final investment decision'),
            ('2019-02-01', 'month', 'planning_approved', 'NSW planning approval (exploratory works)', None),
            ('2019-04-01', 'month', 'construction_start', 'EPC contract executed with Future Generation JV', 'A$5.11 billion EPC contract with Webuild/Clough/Lane JV'),
        ],
        'suppliers': [
            ('epc', 'Future Generation Joint Venture (Webuild/Clough/Lane)', None, None, 'https://www.futuregenerationjv.com.au/about-us'),
            ('hydro_oem', 'Voith Hydro', 'Reversible Francis pump-turbine', 6, 'https://www.power-technology.com/projects/snowy-2-0-hydropower-project/'),
        ],
        'sources': [
            ('Snowy Hydro — Snowy 2.0 Progress', 'https://www.snowyhydro.com.au/snowy-20/progress/'),
            ('Webuild — Snowy 2.0', 'https://www.webuildgroup.com/en/projects/dams-hydroelectric-plants/snowy-2-0/'),
            ('Future Generation JV', 'https://www.futuregenerationjv.com.au/about-us'),
            ('RenewEconomy — Snowy 2.0 cost blowout', 'https://reneweconomy.com.au/snowy-2-0-pumped-hydro-fiasco-faces-another-major-cost-blowout-analysts-expect-more-delays/'),
            ('Infrastructure Pipeline — Snowy 2.0', 'https://infrastructurepipeline.org/project/snowy-2-0'),
        ],
        'schemes': [],
    },
    {
        'id': 'kidston-pumped-storage-hydro-project-250mw',
        'updates': {
            'current_developer': 'Genex Power',
            'notable': 'First pumped hydro registered in NEM in ~40 years. Former Kidston Gold Mine site. 8-hour storage.',
            'data_confidence': 'high',
            'latitude': -18.8714,
            'longitude': 144.1647,
        },
        'events': [
            ('2017-10-01', 'month', 'notable', 'EPC contractor selected', 'McConnell Dowell / John Holland JV selected'),
            ('2021-05-01', 'month', 'notable', 'Financial close — A$777M', 'Financial close reached; construction NTP issued'),
            ('2021-05-01', 'month', 'construction_start', 'Construction commenced', 'Full notice to proceed issued'),
            ('2025-11-18', 'day', 'notable', 'Registered in NEM', 'First pumped hydro registered in NEM in ~40 years'),
        ],
        'suppliers': [
            ('epc', 'McConnell Dowell / John Holland JV', None, None, 'https://www.mcconnelldowell.com/projects/kidston-pumped-storage-hydro'),
            ('hydro_oem', 'ANDRITZ Hydro', 'Reversible Francis pump-turbine 125 MW', 2, 'https://www.andritz.com/newsroom-en/hydro/2021-04-29-kidston-group'),
        ],
        'sources': [
            ('Genex Power — Kidston Project', 'https://genexpower.com.au/250mw-kidston-pumped-storage-hydro-project/'),
            ('ARENA — Kidston', 'https://arena.gov.au/projects/kidston-pumped-hydro-energy-storage/'),
            ('ANDRITZ — Kidston Order', 'https://www.andritz.com/newsroom-en/hydro/2021-04-29-kidston-group'),
            ('McConnell Dowell — Kidston', 'https://www.mcconnelldowell.com/projects/kidston-pumped-storage-hydro'),
            ('Energy-Storage.News — Kidston enters NEM', 'https://www.energy-storage.news/australia-breaks-40-year-pumped-hydro-drought-as-2gwh-kidston-project-enters-the-nem/'),
        ],
        'schemes': [
            ('ARENA', None, 250, 900, 'grant', 'https://arena.gov.au/projects/kidston-pumped-hydro-energy-storage/'),
            ('NAIF', None, 250, 900, 'loan', 'https://www.naif.gov.au/our-projects/genex-kidston-pumped-hydro-storage-project/'),
        ],
    },
    {
        'id': 'borumba',
        'updates': {
            'current_developer': 'Queensland Hydro',
            'notable': '24-hour storage capacity. A$14-18B estimated cost. Exploratory works phase. Survived QLD government change.',
            'data_confidence': 'high',
            'latitude': -26.5067,
            'longitude': 152.6167,
        },
        'events': [
            ('2023-10-01', 'month', 'planning_approved', 'Declared coordinated project (QLD)', 'Queensland Coordinator-General declaration'),
            ('2025-12-18', 'day', 'notable', 'Commonwealth EPBC approval for exploratory works', '~70 strict environmental conditions'),
        ],
        'suppliers': [
            ('epc', 'AFRY-Aurecon JV (design services)', None, None, 'https://qldhydro.com.au/projects/borumba/'),
            ('epc', 'Water2Wire JV (GHD/Mott MacDonald/Stantec) — dam design', None, None, 'https://qldhydro.com.au/projects/borumba/'),
        ],
        'sources': [
            ('Queensland Hydro — Borumba', 'https://qldhydro.com.au/projects/borumba/'),
            ('Queensland Hydro — Commonwealth Approval', 'https://qldhydro.com.au/commonwealth-approval-for-exploratory-works-on-borumba-pumped-hydro-project/'),
            ('RenewEconomy — Federal green tick for Borumba', 'https://reneweconomy.com.au/huge-queensland-pumped-hydro-project-gets-federal-green-tick-to-begin-stage-one-works/'),
            ('Infrastructure Pipeline — Borumba', 'https://infrastructurepipeline.org/project/borumba-dam-pumped-storage-hydro'),
        ],
        'schemes': [],
    },
    {
        'id': 'mt-rawdon-pumped-hydro-energy-storage-project-kci',
        'updates': {
            'current_developer': 'Mt Rawdon Pumped Hydro Pty Ltd (Evolution Mining / ICA Partners)',
            'notable': 'Former gold mine repurposed. CleanCo QLD committed to invest. EIS phase. A$3.3B estimated.',
            'data_confidence': 'high',
        },
        'events': [
            ('2022-10-01', 'month', 'planning_approved', 'Declared coordinated project (QLD)', 'Queensland Coordinator-General declaration'),
            ('2024-05-01', 'month', 'notable', 'EIS submitted', 'Draft Environmental Impact Statement readied for public review'),
        ],
        'suppliers': [],
        'sources': [
            ('Mt Rawdon Pumped Hydro — Project', 'https://mtrawdonhydro.com.au/'),
            ('Evolution Mining — Case Study', 'https://evolutionmining.com.au/case-study/mro-pumped-hydro/'),
            ('CleanCo Queensland — Mt Rawdon', 'https://cleancoqueensland.com.au/mountrawdonannouncement/'),
        ],
        'schemes': [],
    },
    # ══════════════════════════════════════════════════════════════════════
    # WIND FARMS — CONSTRUCTION
    # ══════════════════════════════════════════════════════════════════════
    {
        'id': 'golden-plains-wind',
        'updates': {
            'current_developer': 'TagEnergy / Ingka Group',
            'notable': 'Largest wind farm in Southern Hemisphere. 215 turbines across two stages. Stage 1 first power delivered Q1 2025.',
            'data_confidence': 'high',
        },
        'events': [
            ('2018-10-01', 'month', 'planning_approved', 'EES assessment concluded / planning permit', 'Victorian Minister for Planning granted permit'),
            ('2022-11-01', 'month', 'notable', 'Stage 1 financial close', 'A$3 billion commitment including Stage 2 development'),
            ('2023-01-01', 'month', 'construction_start', 'Stage 1 construction commenced', '122 Vestas V162-6.2 MW turbines'),
            ('2024-06-01', 'month', 'notable', 'Stage 2 financial close', 'Vestas EPC for 93 turbines / 577 MW Stage 2 West'),
            ('2025-03-01', 'month', 'energisation', 'Stage 1 first power delivered', 'First turbines energised in Q1 2025'),
        ],
        'suppliers': [
            ('epc', 'Vestas (EPC for Stage 1 and Stage 2)', None, None, 'https://tag-en.com/3-billion-victorian-wind-farm-secures-equity-investor-and-epc-contractor/'),
        ],
        'sources': [
            ('Golden Plains Wind Farm — Official', 'https://goldenplainswindfarm.com.au/about-golden-plains-wind-farm/'),
            ('TagEnergy — Stage 2 Financial Close', 'https://tag-en.com/construction-to-begin-as-golden-plains-wind-farm-stage-2-reaches-financial-close/'),
            ('Vestas — 577 MW Stage 2 Order', 'https://www.vestas.com/en/media/company-news/2024/vestas-receives-577-mw-order-in-australia-for-second-st-c4003383'),
            ('EnergyAustralia — PPA', 'https://www.energyaustralia.com.au/about-us/media/news/energyaustralia-take-significant-share-energy-golden-plains-wind-farm-stage-2'),
        ],
        'schemes': [],
    },
    {
        'id': 'golden-plains-wind-farm-west',
        'updates': {
            'current_developer': 'TagEnergy / Ingka Group',
            'notable': 'Stage 2 of Golden Plains. 93 Vestas V162-6.2 MW turbines. Financial close June 2024.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-06-01', 'month', 'notable', 'Financial close for Stage 2', 'Vestas EPC contract; EnergyAustralia PPA for 345 MW'),
            ('2024-07-01', 'month', 'construction_start', 'Stage 2 construction commenced', '93 turbines / 577 MW'),
        ],
        'suppliers': [
            ('wind_oem', 'Vestas', 'V162-6.2 MW', 93, 'https://www.vestas.com/en/media/company-news/2024/vestas-receives-577-mw-order-in-australia-for-second-st-c4003383'),
            ('epc', 'Vestas (EPC)', None, None, None),
        ],
        'sources': [
            ('TagEnergy — Stage 2 Financial Close', 'https://tag-en.com/construction-to-begin-as-golden-plains-wind-farm-stage-2-reaches-financial-close/'),
            ('Vestas — 577 MW Order', 'https://www.vestas.com/en/media/company-news/2024/vestas-receives-577-mw-order-in-australia-for-second-st-c4003383'),
        ],
        'schemes': [],
    },
    {
        'id': 'wambo-wind-farm',
        'updates': {
            'current_developer': 'Cubico Sustainable Investments / Stanwell Corporation (50:50 JV)',
            'notable': '83 Vestas V162-6.2 turbines. First turbines energised May 2025. A$650M finance package.',
            'data_confidence': 'high',
        },
        'events': [
            ('2020-10-01', 'month', 'planning_approved', 'QLD state planning approval (Stage 1)', None),
            ('2022-01-01', 'month', 'notable', 'EPBC federal approval', None),
            ('2023-06-01', 'month', 'construction_start', 'Stage 1 construction commenced', '42 turbines / 252 MW'),
            ('2024-02-01', 'month', 'notable', 'Stage 2 QLD government approval', '41 additional turbines / 254 MW'),
            ('2024-12-01', 'month', 'notable', 'Financial close — A$650M', 'Stages 1 & 2 combined finance; Stanwell backed by A$455M QLD RE&H Jobs Fund'),
            ('2025-05-01', 'month', 'energisation', 'First turbines energised', 'First turbines power up on Western Downs'),
        ],
        'suppliers': [
            ('wind_oem', 'Vestas', 'V162-6.2 MW', 83, 'https://www.wambowindfarm.com.au/'),
            ('epc', 'Vestas (EPC)', None, None, None),
        ],
        'sources': [
            ('Wambo Wind Farm — Official', 'https://www.wambowindfarm.com.au/'),
            ('Cubico — Financial Close', 'https://www.cubicoinvest.com/news/cubico-reaches-financial-close-for-500-mw-wambo-project/'),
            ('Stanwell — Wambo Wind Farm', 'https://www.stanwell.com/wambo-wind-farm'),
            ('Stanwell — First Turbines Power Up', 'https://www.stanwell.com/info-hub/article/wambos-first-turbines-power-up-western-downs'),
        ],
        'schemes': [
            ('QLD RE&H Jobs Fund', None, 500, None, 'fund', 'https://www.stanwell.com/wambo-wind-farm'),
        ],
    },
    {
        'id': 'uungula-wind-farm',
        'updates': {
            'current_developer': 'Squadron Energy (Tattarang)',
            'notable': 'Largest wind farm in NSW. 69 GE Vernova Cypress turbines. Part of A$2.75B GE Vernova alliance. NSW LTESA Round 3.',
            'data_confidence': 'high',
            'rez': 'nsw-central-west-orana',
        },
        'events': [
            ('2021-05-07', 'day', 'planning_approved', 'NSW SSD consent granted', 'SSD-6687 consent by NSW DPHI'),
            ('2024-01-01', 'month', 'notable', 'FID and financial close', 'Part of A$2.75B GE Vernova strategic alliance'),
            ('2024-01-01', 'month', 'construction_start', 'Earthworks commenced', '69 GE Vernova 6.0-164 turbines'),
        ],
        'suppliers': [
            ('wind_oem', 'GE Vernova', '6.0-164 Cypress', 69, 'https://www.gevernova.com/news/press-releases/ge-vernova-announces-1point4-gw-of-onshore-wind-projects-with-squadron-energy-australia'),
            ('epc', 'GE Vernova + NACAP + CCP (consortium)', None, None, None),
        ],
        'sources': [
            ('Squadron Energy — Uungula', 'https://squadronenergy.com/our-projects/uungula-wind-farm/'),
            ('Squadron Energy — Construction Start', 'https://squadronenergy.com/news/squadron-energy-starts-work-on-largest-nsw-wind-farm-commits-to-14gw-renewable-energy-pipeline-powering-six-million-homes/'),
            ('GE Vernova — 1.4 GW Agreement', 'https://www.gevernova.com/news/press-releases/ge-vernova-announces-1point4-gw-of-onshore-wind-projects-with-squadron-energy-australia'),
            ('NSW Planning Portal — SSD-6687', 'https://www.planningportal.nsw.gov.au/major-projects/projects/uungula-wind-farm'),
        ],
        'schemes': [
            ('NSW LTESA', 'Round 3', 414, None, 'ltesa', 'https://aemoservices.com.au/en/tenders/tender-round-3-generation-and-long-duration-storage'),
        ],
    },
    {
        'id': 'lotus-creek-wind-farm',
        'updates': {
            'current_developer': 'CS Energy',
            'notable': '46 Vestas V162-6.2 turbines. A$1.3B total. Acquired from CIP Aug 2024. QLD Energy & Jobs Plan.',
            'data_confidence': 'high',
        },
        'events': [
            ('2022-05-01', 'month', 'planning_approved', 'QLD state planning approval', None),
            ('2022-11-01', 'month', 'notable', 'EPBC federal approval', 'Revised design approved after initial koala habitat rejection'),
            ('2024-08-01', 'month', 'notable', 'CS Energy acquires from CIP', 'Financial close; CS Energy becomes 100% owner'),
            ('2024-10-01', 'month', 'construction_start', 'Early works commenced', None),
        ],
        'suppliers': [
            ('wind_oem', 'Vestas', 'V162-6.2 MW', 46, 'https://www.vestas.com/en/media/company-news/2024/vestas-successfully-develops-lotus-creek-wind-farm-in-a-c4024583'),
            ('bop', 'Zenviron', None, None, 'https://zenviron.com/projects/lotus-creek-wind-farm'),
        ],
        'sources': [
            ('Vestas — 285 MW Order', 'https://www.vestas.com/en/media/company-news/2024/vestas-successfully-develops-lotus-creek-wind-farm-in-a-c4024583'),
            ('CS Energy — Acquisition', 'https://www.csenergy.com.au/news/cs-energy-acquires-lotus-creek-wind-farm'),
            ('Zenviron — Lotus Creek', 'https://zenviron.com/projects/lotus-creek-wind-farm'),
            ('Lotus Creek Wind Farm — Official', 'https://lotuscreekwindfarm.com.au/'),
        ],
        'schemes': [
            ('QLD RE&H Jobs Fund', None, 285, None, 'fund', 'https://www.csenergy.com.au/news/cs-energy-acquires-lotus-creek-wind-farm'),
        ],
    },
    {
        'id': 'carmodys-hill-wind-farm',
        'updates': {
            'current_developer': 'Aula Energy',
            'notable': '42 GE Vernova 6.1 MW turbines. A$900M. CIS Tender 4 winner. Financial close late 2025.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-02-01', 'month', 'notable', 'ECI phase commenced', None),
            ('2025-12-01', 'month', 'notable', 'Financial close — A$900M', 'Aula Energy secured financial close'),
            ('2026-01-01', 'month', 'construction_start', 'Construction commenced', '42 GE Vernova turbines'),
        ],
        'suppliers': [
            ('wind_oem', 'GE Vernova', '6.1 MW-158m', 42, 'https://www.gevernova.com/news/press-releases/ge-vernova-signs-agreement-supply-turbines-australian'),
            ('bop', 'DT Infrastructure', None, None, 'https://www.insideconstruction.com.au/news/latest-news/dt-infrastructure-wins-contract-to-deliver-carmodys-hill-wind-farm'),
        ],
        'sources': [
            ("Carmody's Hill — Financial Close", 'https://carmodyshillwindfarm.com/news/aula-energy-secures-financial-close-for-carmodys-hill-wind-farm-construction-to-start-early-2026'),
            ('GE Vernova — Turbine Supply', 'https://www.gevernova.com/news/press-releases/ge-vernova-signs-agreement-supply-turbines-australian'),
            ('DT Infrastructure — Contract', 'https://www.insideconstruction.com.au/news/latest-news/dt-infrastructure-wins-contract-to-deliver-carmodys-hill-wind-farm'),
        ],
        'schemes': [
            ('CIS', 'Tender 4', 256, None, 'cis', 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme/closed-cis-tenders'),
        ],
    },
    {
        'id': 'boulder-creek-wind-farm',
        'updates': {
            'current_developer': 'Aula Energy / CS Energy (50:50 JV)',
            'notable': '38 GE Vernova Cypress turbines (Stage 1). First split-scope project-financed wind farm in Australia. A$740M.',
            'data_confidence': 'high',
        },
        'events': [
            ('2021-10-01', 'month', 'planning_approved', 'QLD state planning approval', None),
            ('2022-06-01', 'month', 'notable', 'EPBC federal approval', None),
            ('2024-10-01', 'month', 'notable', 'Financial close — A$740M', 'Aula Energy and CS Energy 50:50 JV'),
            ('2024-11-01', 'month', 'construction_start', 'Site preparatory works commenced', None),
        ],
        'suppliers': [
            ('wind_oem', 'GE Vernova', '6 MW-164m Cypress', 38, 'https://www.gevernova.com/news/press-releases/ge-vernova-signs-agreement-supply-turbines-228-mw-boulder-creek-wind-farm-australia'),
            ('bop', 'DT Infrastructure / Gamuda', None, None, 'https://dtinfrastructure.com.au/boulder-creek-wind-farm/'),
        ],
        'sources': [
            ('GE Vernova — Boulder Creek', 'https://www.gevernova.com/news/press-releases/ge-vernova-signs-agreement-supply-turbines-228-mw-boulder-creek-wind-farm-australia'),
            ('Aula Energy — Financial Close', 'https://www.aulaenergy.com/news/aula-energy-and-cs-energy-to-commence-construction-of-boulder-creek-wind-farm'),
            ('CS Energy — Construction Start', 'https://www.csenergy.com.au/news/construction-to-start-on-second-cs-energy-wind-project'),
            ('DT Infrastructure — Boulder Creek', 'https://dtinfrastructure.com.au/boulder-creek-wind-farm/'),
            ('Boulder Creek Wind Farm — Official', 'https://www.bouldercreekwindfarm.com/'),
        ],
        'schemes': [
            ('QLD RE&H Jobs Fund', None, 228, None, 'fund', 'https://www.csenergy.com.au/news/construction-to-start-on-second-cs-energy-wind-project'),
        ],
    },
    # ══════════════════════════════════════════════════════════════════════
    # MAJOR BESS — CONSTRUCTION
    # ══════════════════════════════════════════════════════════════════════
    {
        'id': 'supernode-bess',
        'updates': {
            'current_developer': 'Quinbrook Infrastructure Partners',
            'notable': 'Stage 1 commercial ops Feb 2026. A$1.4B+ for 3 stages. 12-yr Origin tolling. GE Vernova + CATL cells.',
            'data_confidence': 'high',
            'latitude': -27.3167,
            'longitude': 152.9500,
        },
        'events': [
            ('2025-01-01', 'month', 'notable', 'Financial close — A$722M debt', 'Bank of America, CBA, Deutsche Bank, Mizuho, MUFG consortium'),
            ('2025-10-01', 'month', 'energisation', 'Stage 1 grid connection', 'Stage 1 (260 MW / 619 MWh) connected to QLD grid'),
            ('2026-02-01', 'month', 'cod', 'Stage 1 commercial operations', 'First 260 MW / 619 MWh begins commercial operations'),
        ],
        'suppliers': [
            ('inverter', 'GE Vernova', None, None, 'https://www.quinbrook.com/news-insights/supernode-stage-1-commences-commercial-operations/'),
            ('bess_oem', 'CATL', None, None, 'https://www.energy-storage.news/quinbrook-catl-unveil-8-hour-duration-bess-technology-set-for-australia/'),
            ('bop', 'NuEnergy Infrastructure', None, None, 'https://nuenergy.au/nuenergy-landmark-supernode-battery-storage-project/'),
        ],
        'sources': [
            ('Quinbrook — Supernode Stage 1 Ops', 'https://www.quinbrook.com/news-insights/supernode-stage-1-commences-commercial-operations/'),
            ('Quinbrook — Fully Contracts Supernode', 'https://www.quinbrook.com/news-insights/quinbrook-fully-contracts-supernode-battery-storage-project/'),
            ('NuEnergy — Supernode Partnership', 'https://nuenergy.au/nuenergy-landmark-supernode-battery-storage-project/'),
            ('Energy-Storage.News — Stage 1', 'https://www.energy-storage.news/quinbrook-powers-up-619mwh-supernode-stage-one-bess-in-queensland-australia/'),
        ],
        'schemes': [],
    },
    {
        'id': 'liddell-bess',
        'updates': {
            'current_developer': 'AGL Energy',
            'notable': 'Fluence Gridstack with grid-forming inverters. A$750M. ARENA A$35M grant. NSW LTESA Round 2.',
            'data_confidence': 'high',
        },
        'events': [
            ('2023-03-01', 'month', 'planning_approved', 'NSW SSD approval', 'Approved for up to 500 MW / 2,000 MWh'),
            ('2023-12-01', 'month', 'notable', 'FID reached', 'AGL final investment decision'),
            ('2024-01-01', 'month', 'construction_start', 'Construction commenced', 'Fluence Gridstack deployment'),
            ('2025-09-30', 'day', 'notable', 'Registered with AEMO', 'AEMO MMS registration'),
        ],
        'suppliers': [
            ('bess_oem', 'Fluence', 'Gridstack', None, 'https://ir.fluenceenergy.com/news-releases/news-release-details/agl-selects-fluence-deliver-500-mw-liddell-battery-project'),
        ],
        'sources': [
            ('AGL — Liddell Battery', 'https://www.agl.com.au/about-agl/operations/liddell-battery'),
            ('AGL — FID Announcement', 'https://www.agl.com.au/about-agl/news-centre/2023/december/final-investment-decision-reached-on-the-500-mw-liddell-battery-'),
            ('Fluence — Selected for Liddell', 'https://ir.fluenceenergy.com/news-releases/news-release-details/agl-selects-fluence-deliver-500-mw-liddell-battery-project'),
            ('ARENA — Liddell Battery', 'https://arena.gov.au/projects/agl-liddell-large-scale-battery-with-advanced-inverters-deployment-project/'),
        ],
        'schemes': [
            ('ARENA', None, 500, 1000, 'grant', 'https://arena.gov.au/projects/agl-liddell-large-scale-battery-with-advanced-inverters-deployment-project/'),
            ('NSW LTESA', 'Round 2', 500, 1000, 'ltesa', 'https://www.agl.com.au/about-agl/operations/liddell-battery'),
        ],
    },
    {
        'id': 'eraring-battery',
        'updates': {
            'current_developer': 'Origin Energy',
            'notable': "Australia's largest battery. Stage 1 (460 MW/1,770 MWh) operational Jan 2026. Wartsila GridSolv Quantum. 4-stage build to 700 MW/3,160 MWh.",
            'data_confidence': 'high',
        },
        'events': [
            ('2023-04-01', 'month', 'notable', 'FID — A$600M for Stage 1', 'Origin commits A$600M; Wartsila as preferred contractor'),
            ('2023-06-01', 'month', 'construction_start', 'Stage 1 construction commenced', '460 MW / 1,770 MWh'),
            ('2024-07-01', 'month', 'notable', 'Stage 2 approval (240 MW / 1,030 MWh)', 'Grid-forming advanced inverters'),
            ('2026-01-01', 'month', 'cod', 'Stage 1 commercial operations', "Australia's largest battery begins commercial ops"),
        ],
        'suppliers': [
            ('bess_oem', 'Wartsila', 'GridSolv Quantum', None, 'https://www.wartsila.com/media/news/20-04-2023-wartsila-selected-as-the-preferred-contractor-to-deliver-one-of-australia-s-largest-energy-storage-projects-3256698'),
            ('bop', 'Enerven (SA Power Networks)', None, None, 'https://www.enerven.com.au/projects/eraring-battery-energy-storage-system/'),
        ],
        'sources': [
            ('Origin Energy — Eraring Battery', 'https://www.originenergy.com.au/about/who-we-are/what-we-do/generation/eraring-projects/battery/'),
            ('Wartsila — Selected for Eraring', 'https://www.wartsila.com/media/news/20-04-2023-wartsila-selected-as-the-preferred-contractor-to-deliver-one-of-australia-s-largest-energy-storage-projects-3256698'),
            ('Enerven — Eraring BESS', 'https://www.enerven.com.au/projects/eraring-battery-energy-storage-system/'),
            ('Energy-Storage.News — Eraring Ops', 'https://www.energy-storage.news/australias-1770mwh-eraring-battery-1-commences-commercial-operations/'),
        ],
        'schemes': [],
    },
    {
        'id': 'orana-bess',
        'updates': {
            'current_developer': 'Akaysha Energy (BlackRock)',
            'notable': 'Tesla Megapack. A$650M debt financing (largest BESS financing globally at time). NSW LTESA + CIS double winner.',
            'data_confidence': 'high',
            'rez': 'nsw-central-west-orana',
        },
        'events': [
            ('2023-11-01', 'month', 'notable', 'Won NSW LTESA Round 2 + CIS first auction', 'Double government contract win'),
            ('2024-07-01', 'month', 'notable', 'Financial close — A$650M', 'Largest BESS financing globally; ANZ, CBA, Westpac led consortium'),
            ('2024-07-01', 'month', 'construction_start', 'Civil works commenced', 'Tesla Megapack deployment'),
        ],
        'suppliers': [
            ('bess_oem', 'Tesla', 'Megapack', None, 'https://akayshaenergy.com/projects/orana-bess'),
            ('bop', 'Consolidated Power Projects (CPP)', None, None, 'https://akayshaenergy.com/projects/orana-bess'),
        ],
        'sources': [
            ('Akaysha Energy — Orana BESS', 'https://akayshaenergy.com/projects/orana-bess'),
            ('Akaysha — $650M Financing', 'https://akayshaenergy.com/news/akaysha-energy-secures-largest-bess-financing-globally-at-650-million'),
            ('RenewEconomy — Orana Finance', 'https://reneweconomy.com.au/huge-finance-deal-and-off-take-landed-for-one-of-australias-biggest-four-hour-battery-projects/'),
        ],
        'schemes': [
            ('NSW LTESA', 'Round 2', 415, 1662, 'ltesa', 'https://akayshaenergy.com/projects/orana-bess'),
            ('CIS', 'Tender 1', 415, 1662, 'cis', 'https://akayshaenergy.com/projects/orana-bess'),
        ],
    },
    {
        'id': 'bellambi-heights-renewables-project',
        'updates': {
            'current_developer': 'Vena Energy',
            'notable': 'CWO REZ location. Originally 500 MW Gulgong Solar, scaled down to BESS-only. Two stages of 204 MW each.',
            'data_confidence': 'high',
            'rez': 'nsw-central-west-orana',
        },
        'events': [
            ('2024-05-02', 'day', 'planning_approved', 'NSW Ministerial consent', 'Approved for 408 MW / 816 MWh BESS'),
            ('2025-03-01', 'month', 'construction_start', 'Stage 1 construction commenced', '204 MW / 408 MWh'),
            ('2025-12-01', 'month', 'notable', 'Stage 2 construction commenced', '204 MW / 408 MWh'),
        ],
        'suppliers': [],
        'sources': [
            ('Vena Energy — Bellambi Heights', 'https://www.venaenergy.com.au/all_projects/bellambi-heights-bess/'),
            ('NSW Planning Portal — Bellambi Heights', 'https://www.planningportal.nsw.gov.au/major-projects/projects/bellambi-heights-battery-energy-storage-system'),
            ('RenewEconomy — Vena BESS-only pivot', 'https://reneweconomy.com.au/singapores-vena-ditches-huge-big-solar-plans-opts-for-big-battery-only-in-central-nsw/'),
        ],
        'schemes': [],
    },
    {
        'id': 'wooreen-energy-storage-system',
        'updates': {
            'current_developer': 'EnergyAustralia',
            'notable': 'Wartsila Quantum High Energy. A$700M. CIS Round 1 winner. Replaces Yallourn coal (retires mid-2028).',
            'data_confidence': 'high',
        },
        'events': [
            ('2023-02-01', 'month', 'planning_approved', 'Victorian planning approval', None),
            ('2025-02-20', 'day', 'notable', 'Financial close — A$700M', 'EnergyAustralia FID'),
            ('2025-03-01', 'month', 'construction_start', 'Ground-breaking', 'Wartsila Quantum + Zenviron BoP'),
        ],
        'suppliers': [
            ('bess_oem', 'Wartsila', 'Quantum High Energy', None, 'https://www.wartsila.com/media/news/28-02-2025-wartsila-will-provide-a-350-mw-1474-mwh-energy-storage-system-for-one-of-australia-s-largest-energy-providers-3555089'),
            ('bop', 'Zenviron', None, None, 'https://www.energy-storage.news/zenviron-wins-contract-for-350mw-4-hour-bess-in-victoria-australia/'),
        ],
        'sources': [
            ('EnergyAustralia — Wooreen', 'https://www.energyaustralia.com.au/about-us/what-we-do/new-energy-projects/wooreen-energy-storage-system'),
            ('Wartsila — 350 MW / 1,474 MWh', 'https://www.wartsila.com/media/news/28-02-2025-wartsila-will-provide-a-350-mw-1474-mwh-energy-storage-system-for-one-of-australia-s-largest-energy-providers-3555089'),
            ('Zenviron — Wooreen BoP', 'https://www.energy-storage.news/zenviron-wins-contract-for-350mw-4-hour-bess-in-victoria-australia/'),
        ],
        'schemes': [
            ('CIS', 'Round 1', 350, 1474, 'cis', 'https://www.net-zero.gov.au/wooreen-energy-storage-system'),
        ],
    },
    {
        'id': 'elaine-bess',
        'updates': {
            'current_developer': 'Akaysha Energy (BlackRock)',
            'notable': 'Tesla Megapack. A$460M financing. 15-year virtual toll with Snowy Hydro for 220 MW.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-10-01', 'month', 'construction_start', 'Construction commenced', None),
            ('2025-11-01', 'month', 'notable', 'Financial close — A$460M', 'BNP Paribas, CIBC, CBA, ING, Mizuho, MUFG, SMBC, SocGen'),
        ],
        'suppliers': [
            ('bess_oem', 'Tesla', 'Megapack', None, 'https://akayshaenergy.com/news/akaysha-closes-a-460m-construction-financing-and-commences-construction-on-elaine-bess'),
            ('bop', 'Consolidated Power Projects (CPP)', None, None, None),
        ],
        'sources': [
            ('Akaysha — Elaine Financing', 'https://akayshaenergy.com/news/akaysha-closes-a-460m-construction-financing-and-commences-construction-on-elaine-bess'),
            ('Energy-Storage.News — Elaine A$460M', 'https://www.energy-storage.news/akaysha-energy-bags-au460-million-for-1244mwh-bess-in-victoria-australia/'),
        ],
        'schemes': [],
    },
    {
        'id': 'mortlake-battery',
        'updates': {
            'current_developer': 'Origin Energy',
            'notable': 'Fluence Gridstack with SMA grid-forming inverters. A$400M. ARENA A$24M grant.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-01-29', 'day', 'notable', 'FID — A$400M; Fluence contract signed', None),
            ('2024-07-01', 'month', 'construction_start', 'Civil works commenced', 'Fluence Gridstack + SMA inverters'),
        ],
        'suppliers': [
            ('bess_oem', 'Fluence', 'Gridstack', None, 'https://ir.fluenceenergy.com/news-releases/news-release-details/origin-selects-fluence-deliver-300-mw-650-mwh-mortlake-power'),
            ('inverter', 'SMA Solar (grid-forming inverters)', None, None, 'https://www.energy-storage.news/construction-begins-at-origins-650mwh-mortlake-bess-in-victoria-australia/'),
        ],
        'sources': [
            ('Origin — Mortlake Battery', 'https://www.originenergy.com.au/about/who-we-are/what-we-do/generation/mortlake-battery-project/'),
            ('Fluence — Selected for Mortlake', 'https://ir.fluenceenergy.com/news-releases/news-release-details/origin-selects-fluence-deliver-300-mw-650-mwh-mortlake-power'),
            ('ARENA — Mortlake NTP', 'https://arena.gov.au/news/origin-issues-notice-to-proceed-on-300-mw-grid-forming-battery-at-mortlake/'),
        ],
        'schemes': [
            ('ARENA', None, 300, 650, 'grant', 'https://arena.gov.au/news/origin-issues-notice-to-proceed-on-300-mw-grid-forming-battery-at-mortlake/'),
        ],
    },
    {
        'id': 'tarong-bess-stanwell',
        'updates': {
            'current_developer': 'Stanwell Corporation',
            'notable': '164x Tesla Megapack 2XL. A$514M. Commercial ops Feb 2026. Yurika EPC.',
            'data_confidence': 'high',
        },
        'events': [
            ('2023-08-01', 'month', 'construction_start', 'Construction commenced', '164 Tesla Megapack 2XL units'),
            ('2026-02-01', 'month', 'cod', 'Commercial operations commenced', '300 MW / 600 MWh Tarong BESS'),
        ],
        'suppliers': [
            ('bess_oem', 'Tesla', 'Megapack 2XL', 164, 'https://www.stanwell.com/tarong-battery-energy-storage-system'),
            ('epc', 'Yurika (QLD Govt-owned)', None, None, 'https://www.yurika.com.au/mega-boost-for-tarong-battery-project/'),
        ],
        'sources': [
            ('Stanwell — Tarong BESS', 'https://www.stanwell.com/tarong-battery-energy-storage-system'),
            ('Yurika — Tarong Battery', 'https://www.yurika.com.au/mega-boost-for-tarong-battery-project/'),
            ('Energy-Storage.News — Stanwell 600 MWh', 'https://www.energy-storage.news/queenslands-stanwell-opens-600mwh-battery-storage-system-in-australia/'),
        ],
        'schemes': [],
    },
    {
        'id': 'bulabul-bess-1',
        'updates': {
            'current_developer': 'Ampyr Australia (AGP Singapore)',
            'notable': 'Fluence Gridstack. First Nations 5% equity (Wambal Bila). A$340M. InCommodities A$450M deal.',
            'data_confidence': 'high',
            'rez': 'nsw-central-west-orana',
        },
        'events': [
            ('2025-07-08', 'day', 'notable', 'Financial close — A$340M', 'CBA, Bank of China, HSBC, Rabobank, SocGen, UOB'),
            ('2025-08-01', 'month', 'construction_start', 'Bulabul 1 construction commenced', '200 MW / 200 MWh first sub-phase'),
        ],
        'suppliers': [
            ('bess_oem', 'Fluence', 'Gridstack', None, 'https://ir.fluenceenergy.com/news-releases/news-release-details/fluence-chosen-300-mw-600-mwh-wellington-battery-energy-storage'),
        ],
        'sources': [
            ('Ampyr — Bulabul Battery', 'https://www.ampyr.com.au/our-projects/bulabul-battery/'),
            ('Fluence — Wellington BESS', 'https://ir.fluenceenergy.com/news-releases/news-release-details/fluence-chosen-300-mw-600-mwh-wellington-battery-energy-storage'),
            ('Energy-Storage.News — Ampyr Construction', 'https://www.energy-storage.news/ampyr-australia-starts-construction-on-600mwh-bess-in-new-south-wales/'),
        ],
        'schemes': [],
    },
    # ══════════════════════════════════════════════════════════════════════
    # SMALLER BESS — CONSTRUCTION
    # ══════════════════════════════════════════════════════════════════════
    {
        'id': 'gnarwarre-bess-facility',
        'updates': {
            'current_developer': 'FRV Australia (Abdul Latif Jameel / OMERS)',
            'notable': 'Hithium cells + SMA inverters. Samsung C&T EPC. ARENA A$15M grid-forming grant.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-08-04', 'day', 'notable', 'Financial close — part of A$1.2B FRV portfolio', 'Westpac, UOB, Intesa Sanpaolo, KfW, EDC syndicate'),
            ('2025-08-01', 'month', 'construction_start', 'Construction commenced', 'Samsung C&T full-wrap EPC'),
        ],
        'suppliers': [
            ('bess_oem', 'Hithium', '5 MWh containers', 112, 'https://www.energy-storage.news/hithium-fotowatio-renewable-ventures-partner-for-first-time-with-500mwh-grid-forming-bess-in-australia/'),
            ('epc', 'Samsung C&T (turnkey EPC)', None, None, 'https://frv.com/en/frv-australia-completes-financial-close-of-the-250mw-500mwh-gnarwarre-battery-project/'),
            ('inverter', 'SMA Solar (inverters)', None, None, None),
        ],
        'sources': [
            ('FRV — Gnarwarre Financial Close', 'https://frv.com/en/frv-australia-completes-financial-close-of-the-250mw-500mwh-gnarwarre-battery-project/'),
            ('ARENA — Gnarwarre BESS', 'https://arena.gov.au/projects/gnarwarre-bess-project/'),
            ('Gnarwarre BESS — Official', 'https://gnarwarrebess.com/'),
        ],
        'schemes': [
            ('ARENA', None, 250, 500, 'grant', 'https://arena.gov.au/projects/gnarwarre-bess-project/'),
        ],
    },
    {
        'id': 'williamsdale-bess',
        'updates': {
            'current_developer': 'Eku Energy (Macquarie / BCIM)',
            'notable': 'Tesla Megapack. A$400M. ACT Big Canberra Battery. 50% revenue to ACT Government. Grid-forming.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-11-06', 'day', 'notable', 'Financial close — A$400M', 'Westpac, SMBC, MUFG debt'),
            ('2024-11-22', 'day', 'construction_start', 'Ground-breaking ceremony', 'Tesla Megapack deployment; CPP BoP'),
        ],
        'suppliers': [
            ('bess_oem', 'Tesla', 'Megapack', None, 'https://www.ekuenergy.com/news/eku-energy-reaches-financial-close-for-williamsdale-battery-energy-storage-system'),
            ('bop', 'Consolidated Power Projects (CPP)', None, None, None),
        ],
        'sources': [
            ('Eku Energy — Williamsdale', 'https://www.ekuenergy.com/news/eku-energy-reaches-financial-close-for-williamsdale-battery-energy-storage-system'),
            ('ACT Government — Williamsdale', 'https://www.act.gov.au/our-canberra/latest-news/2024/november/work-begins-on-williamsdale-battery-energy-storage-system'),
            ('Energy-Storage.News — Williamsdale', 'https://www.energy-storage.news/eku-energy-reaches-financial-close-on-500mwh-grid-forming-bess-in-the-australian-capital-territory/'),
        ],
        'schemes': [],
    },
    {
        'id': 'mornington-bess',
        'updates': {
            'current_developer': 'Valent Energy (Gaw Capital / BW ESS)',
            'notable': 'CATL batteries + Power Electronics inverters. Construction completed Oct 2025. Commissioning underway.',
            'data_confidence': 'high',
        },
        'events': [
            ('2022-01-01', 'month', 'planning_approved', 'Victoria Minister for Planning approval', None),
            ('2024-10-01', 'month', 'construction_start', 'Construction commenced', 'CATL batteries; ACLE Services BoP'),
            ('2025-10-01', 'month', 'notable', 'Construction completed; commissioning underway', None),
        ],
        'suppliers': [
            ('bess_oem', 'CATL', None, None, 'https://morningtonbess.com.au/'),
            ('inverter', 'Power Electronics (inverters)', None, None, None),
            ('bop', 'ACLE Services', None, None, 'https://www.acle.com.au/our-projects-2/'),
        ],
        'sources': [
            ('Mornington BESS — Official', 'https://morningtonbess.com.au/'),
            ('AusNet — Mornington BESS', 'https://www.ausnetservices.com.au/projects-and-innovation/battery-storage/mornington-battery-energy-storage-system'),
            ('RenewablesNow — Commissioning', 'https://renewablesnow.com/news/valents-240-mw-mornington-battery-enters-commissioning-in-victoria-1283358/'),
        ],
        'schemes': [],
    },
    {
        'id': 'summerfield-bess',
        'updates': {
            'current_developer': 'Copenhagen Infrastructure Partners (CIP)',
            'notable': 'Canadian Solar e-STORAGE SolBank 3.0. 4-hour duration (240 MW / 960 MWh). 10-yr Origin offtake.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-09-01', 'month', 'notable', 'FID reached', None),
            ('2025-01-01', 'month', 'construction_start', 'Construction commenced', 'Canadian Solar e-STORAGE turnkey EPC'),
        ],
        'suppliers': [
            ('bess_oem', 'Canadian Solar e-STORAGE', 'SolBank 3.0', None, 'https://solarquarter.com/2025/02/12/canadian-solars-e-storage-to-deliver-240-mw-960-mwh-battery-storage-project-in-south-australia-with-cip/'),
        ],
        'sources': [
            ('Summerfield Battery — Official', 'https://www.summerfieldbattery.com.au/'),
            ('Energy-Storage.News — CIP 960 MWh', 'https://www.energy-storage.news/copenhagen-infrastructure-partners-kicks-off-960mwh-south-australia-battery-storage-project/'),
        ],
        'schemes': [],
    },
    {
        'id': 'woolooga-bess',
        'updates': {
            'current_developer': 'Lightsource bp',
            'notable': 'Hithium 5 MWh containers (128 units). INTEC EPC. CIS Tender 1 winner.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-10-01', 'month', 'construction_start', 'Construction commenced', 'INTEC Energy Solutions EPC; Hithium supply'),
        ],
        'suppliers': [
            ('bess_oem', 'Hithium', '5 MWh containers', 128, 'https://www.pv-magazine-australia.com/2024/12/19/hithium-to-supply-128-units-of-5-mwh-battery-solutions-for-woolooga-bess/'),
            ('epc', 'INTEC Energy Solutions', None, None, 'https://in-tecenergy.com/news/intec-provides-bess-epc-for-lightsource-bp/'),
        ],
        'sources': [
            ('Lightsource bp — Woolooga', 'https://lightsourcebp.com/news/australia-lightsource-bp-reaches-major-milestone-on-solar-and-battery-projects-to-deliver-firmed-renewable-energy-solutions/'),
            ('INTEC — Woolooga EPC', 'https://in-tecenergy.com/news/intec-provides-bess-epc-for-lightsource-bp/'),
        ],
        'schemes': [
            ('CIS', 'Tender 1', 222, 640, 'cis', 'https://www.energy-storage.news/capacity-investment-scheme-sees-3626mwh-of-energy-storage-awarded-in-south-australia-and-victoria/'),
        ],
    },
    {
        'id': 'brendale-bess',
        'updates': {
            'current_developer': 'Akaysha Energy (BlackRock)',
            'notable': 'Tesla Megapack 2 grid-forming. A$200M. Completed 5 months early (Jan 2026). Gunvor offtake.',
            'data_confidence': 'high',
            'status': 'operating',
        },
        'events': [
            ('2023-12-01', 'month', 'notable', 'FID reached', None),
            ('2024-08-08', 'day', 'construction_start', 'Sod turned; construction commenced', None),
            ('2026-01-01', 'month', 'cod', 'Fully operational — 5 months early', 'Akaysha Brendale BESS operational Jan 2026'),
        ],
        'suppliers': [
            ('bess_oem', 'Tesla', 'Megapack 2', None, 'https://akayshaenergy.com/news/sod-turned-on-akaysha-energys-200m-brendale-bess'),
            ('bop', 'Consolidated Power Projects (CPP)', None, None, None),
        ],
        'sources': [
            ('Akaysha — Brendale Ground-breaking', 'https://akayshaenergy.com/news/sod-turned-on-akaysha-energys-200m-brendale-bess'),
            ('Akaysha — Gunvor Offtake', 'https://akayshaenergy.com/news/akaysha-energy-gunvor-group-sign-offtake-agreement'),
        ],
        'schemes': [],
    },
    {
        'id': 'tailem-bend-stage-3',
        'updates': {
            'current_developer': 'Vena Energy',
            'notable': 'Canadian Solar e-STORAGE SolBank 3.0. ~100 battery containers. CPP BoP.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-12-01', 'month', 'construction_start', 'Construction commenced', 'Canadian Solar e-STORAGE turnkey; CPP BoP'),
        ],
        'suppliers': [
            ('bess_oem', 'Canadian Solar e-STORAGE', 'SolBank 3.0', None, 'https://www.pv-magazine-australia.com/press-releases/e-storage-to-deliver-408-mwh-battery-for-vena-energy-in-south-australia/'),
            ('bop', 'Consolidated Power Projects (CPP)', None, None, None),
        ],
        'sources': [
            ('Vena Energy — Tailem Bend 3', 'https://www.energy-storage.news/vena-energy-builds-408mwh-bess-at-third-phase-of-south-australia-renewable-energy-project/'),
        ],
        'schemes': [],
    },
    {
        'id': 'new-england-solar-farm-bess',
        'updates': {
            'current_developer': 'ACEN Australia / Marubeni (50:50)',
            'notable': 'Energy Vault B-VAULT (first Australian project). Siemens grid-forming inverters. 20-year NSW LTESA.',
            'data_confidence': 'high',
            'rez': 'nsw-new-england',
        },
        'events': [
            ('2025-02-01', 'month', 'construction_start', 'Phase 1 construction commenced (50 MW / 100 MWh)', 'Energy Vault B-VAULT deployment'),
        ],
        'suppliers': [
            ('bess_oem', 'Energy Vault', 'B-VAULT', None, 'https://www.energyvault.com/projects/new-england-bess'),
            ('inverter', 'Siemens (S120 grid-forming inverters)', None, None, None),
        ],
        'sources': [
            ('Energy Vault — New England BESS', 'https://www.energyvault.com/projects/new-england-bess'),
            ('ACEN Australia — New England Solar', 'https://acenrenewables.com.au/project/new-england-solar/'),
        ],
        'schemes': [
            ('NSW LTESA', 'Round 1', 200, 400, 'ltesa', 'https://acenrenewables.com.au/project/new-england-solar/'),
        ],
    },
    {
        'id': 'pelican-point-bess',
        'updates': {
            'current_developer': 'ENGIE',
            'notable': 'Sungrow PowerTitan 2.0. Grid-forming. Elecnor delivery partner.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-12-01', 'month', 'construction_start', 'Construction commenced', 'Sungrow PowerTitan 2.0 + Elecnor delivery'),
        ],
        'suppliers': [
            ('bess_oem', 'Sungrow', 'PowerTitan 2.0', None, 'https://solarquarter.com/2025/12/10/sungrow-begins-construction-of-200-mw-400-mwh-pelican-point-battery-energy-storage-system-to-strengthen-south-australias-grid/'),
            ('bop', 'Elecnor', None, None, 'https://www.power-technology.com/news/construction-engies-pelican-point-bess/'),
        ],
        'sources': [
            ('ENGIE — Pelican Point BESS', 'https://engie.com.au/about-us/our-generation-activities/battery-storage/pelican-point-battery-energy-storage-system'),
            ('Power Technology — Pelican Point', 'https://www.power-technology.com/news/construction-engies-pelican-point-bess/'),
        ],
        'schemes': [],
    },
    {
        'id': 'calala-bess-a1',
        'updates': {
            'current_developer': 'Equis Australia',
            'notable': 'Tesla Megapack. First merchant BESS debt financing in NSW. SmartestEnergy 100% offtake.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-06-28', 'day', 'planning_approved', 'NSW Development Consent granted', None),
            ('2025-03-01', 'month', 'notable', 'Financial close — A$260M', 'Westpac, SocGen, SMBC; first merchant BESS debt in NSW'),
            ('2025-03-01', 'month', 'construction_start', 'Construction commenced', 'Tesla Megapack; CPP BoP'),
        ],
        'suppliers': [
            ('bess_oem', 'Tesla', 'Megapack', 138, 'https://www.energy-storage.news/equis-claims-new-south-wales-first-merchant-bess-debt-financing-for-500mwh-asset/'),
            ('bop', 'Consolidated Power Projects (CPP)', None, None, None),
        ],
        'sources': [
            ('Equis — Calala BESS', 'https://equis.engagementhub.com.au/calala-bess'),
            ('Energy-Storage.News — Merchant BESS', 'https://www.energy-storage.news/equis-claims-new-south-wales-first-merchant-bess-debt-financing-for-500mwh-asset/'),
        ],
        'schemes': [],
    },
    {
        'id': 'calala-bess-a2',
        'updates': {
            'current_developer': 'Equis Australia',
            'notable': 'Tesla Megapack. Merchant operation via Tesla Autobidder with minimum revenue guarantee.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-06-28', 'day', 'planning_approved', 'NSW Development Consent granted', 'Combined A1+A2 consent'),
            ('2025-03-01', 'month', 'construction_start', 'Construction commenced', 'Part of Calala A1+A2 build'),
        ],
        'suppliers': [
            ('bess_oem', 'Tesla', 'Megapack', None, None),
        ],
        'sources': [
            ('Equis — Calala BESS', 'https://equis.engagementhub.com.au/calala-bess'),
        ],
        'schemes': [],
    },
    {
        'id': 'limondale-bess',
        'updates': {
            'current_developer': 'RWE Renewables Australia',
            'notable': "Australia's first 8-hour BESS. 144 Tesla Megapacks. 14-year NSW LTESA. Beon Energy BoP.",
            'data_confidence': 'high',
        },
        'events': [
            ('2023-05-01', 'month', 'notable', 'NSW LTESA awarded (14-year)', "First project under NSW Long Duration Storage tender"),
            ('2024-05-01', 'month', 'notable', 'FID reached', 'RWE final investment decision'),
            ('2024-10-01', 'month', 'construction_start', 'Construction commenced', '144 Tesla Megapacks; Beon Energy BoP'),
            ('2025-09-01', 'month', 'notable', 'Registered with AEMO', "Australia's first 8-hour LDES BESS registered"),
        ],
        'suppliers': [
            ('bess_oem', 'Tesla', 'Megapack', 144, 'https://www.rwe.com/en/press/rwe-renewables-europe-australia/2024-05-28-rwe-to-build-australias-first-eight-hour-battery/'),
            ('bop', 'Beon Energy Solutions', None, None, 'https://beon-es.com.au/project/limondale/'),
        ],
        'sources': [
            ('RWE — Limondale', 'https://www.rwe.com/en/press/rwe-renewables-europe-australia/2024-05-28-rwe-to-build-australias-first-eight-hour-battery/'),
            ('Beon Energy — Limondale', 'https://beon-es.com.au/project/limondale/'),
            ('Energy-Storage.News — AEMO Registration', 'https://www.energy-storage.news/australias-first-8-hour-ldes-battery-energy-storage-system-registered-with-aemo/'),
        ],
        'schemes': [
            ('NSW LTESA', 'Long Duration Storage', 50, 400, 'ltesa', 'https://www.energy-storage.news/rwe-wins-government-contract-for-eight-hour-lithium-bess-in-new-south-wales-australia/'),
        ],
    },
    {
        'id': 'clements-gap-bess',
        'updates': {
            'current_developer': 'Pacific Blue (SPIC China)',
            'notable': 'Trina Storage + SMA inverters. Enzen EPC. CIS Tender 1 winner. >A$100M.',
            'data_confidence': 'high',
        },
        'events': [
            ('2024-02-01', 'month', 'notable', 'Board endorsement / FID', None),
            ('2024-06-12', 'day', 'construction_start', 'Sod-turning ceremony', 'Enzen Australia delivery partner; Trina Storage'),
        ],
        'suppliers': [
            ('bess_oem', 'Trina Storage', None, 50, 'https://www.pacificblue.com.au/our-energy-production/sites-in-development/clements-gap-battery'),
            ('epc', 'Enzen Australia', None, None, 'https://www.energymagazine.com.au/constuction-of-60mw-clements-gap-bess-underway/'),
            ('inverter', 'SMA Solar (inverters)', None, 25, None),
        ],
        'sources': [
            ('Pacific Blue — Clements Gap Battery', 'https://www.pacificblue.com.au/our-energy-production/sites-in-development/clements-gap-battery'),
            ('Energy Magazine — Clements Gap', 'https://www.energymagazine.com.au/constuction-of-60mw-clements-gap-bess-underway/'),
            ('RenewEconomy — Clements Gap', 'https://reneweconomy.com.au/construction-begins-on-new-big-battery-next-to-one-of-australias-oldest-wind-farms/'),
        ],
        'schemes': [
            ('CIS', 'Tender 1', 60, 120, 'cis', 'https://www.energy-storage.news/capacity-investment-scheme-sees-3626mwh-of-energy-storage-awarded-in-south-australia-and-victoria/'),
        ],
    },
    {
        'id': 'pine-lodge-bess',
        'updates': {
            'current_developer': 'Valent Energy (Gaw Capital / BW ESS)',
            'notable': 'Terminal station energised Dec 2025. Late-stage construction/commissioning.',
            'data_confidence': 'high',
        },
        'events': [
            ('2025-12-01', 'month', 'notable', 'AusNet terminal station energised', None),
        ],
        'suppliers': [
            ('bop', 'ACLE Services', None, None, 'https://www.acle.com.au/our-projects-2/'),
        ],
        'sources': [
            ('Pine Lodge BESS — Official', 'https://pinelodgebess.com.au/'),
            ('AusNet — Pine Lodge Terminal Station', 'https://www.ecogeneration.com.au/pine-lodge-terminal-station-big-battery-rollout'),
        ],
        'schemes': [],
    },
]


# ─── ENRICHMENT ENGINE ──────────────────────────────────────────────────────

def run_enrichment(dry_run=False):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA journal_mode=WAL')

    stats = {
        'projects_updated': 0,
        'events_created': 0,
        'suppliers_created': 0,
        'sources_created': 0,
        'source_links': 0,
        'schemes_created': 0,
    }

    for proj in PROJECTS:
        pid = proj['id']

        # Check project exists
        exists = conn.execute('SELECT id FROM projects WHERE id = ?', (pid,)).fetchone()
        if not exists:
            print(f'  ⚠ Project not found: {pid}')
            continue

        # ── Update project fields ──
        updates = proj.get('updates', {})
        if updates:
            # Handle status change separately
            set_clauses = []
            values = []
            for col, val in updates.items():
                set_clauses.append(f'{col} = ?')
                values.append(val)
            set_clauses.append("updated_at = datetime('now')")
            values.append(pid)
            sql = f"UPDATE projects SET {', '.join(set_clauses)} WHERE id = ?"
            conn.execute(sql, values)
            stats['projects_updated'] += 1

        # ── Insert timeline events (skip duplicates) ──
        for date, precision, etype, title, detail in proj.get('events', []):
            existing = conn.execute(
                'SELECT id FROM timeline_events WHERE project_id = ? AND event_type = ? AND date = ?',
                (pid, etype, date)
            ).fetchone()
            if not existing:
                conn.execute(
                    '''INSERT INTO timeline_events
                       (project_id, date, date_precision, event_type, title, detail, data_source)
                       VALUES (?, ?, ?, ?, ?, ?, 'web_research')''',
                    (pid, date, precision, etype, title, detail)
                )
                stats['events_created'] += 1

        # ── Insert suppliers (skip duplicates by role+supplier) ──
        for role, supplier, model, qty, source_url in proj.get('suppliers', []):
            existing = conn.execute(
                'SELECT id FROM suppliers WHERE project_id = ? AND role = ? AND supplier = ?',
                (pid, role, supplier)
            ).fetchone()
            if not existing:
                conn.execute(
                    '''INSERT INTO suppliers
                       (project_id, role, supplier, model, quantity, source_url)
                       VALUES (?, ?, ?, ?, ?, ?)''',
                    (pid, role, supplier, model, qty, source_url)
                )
                stats['suppliers_created'] += 1

        # ── Insert source references and link to project ──
        for title, url in proj.get('sources', []):
            # Check if source URL already exists
            existing_src = conn.execute(
                'SELECT id FROM source_references WHERE url = ?', (url,)
            ).fetchone()
            if existing_src:
                src_id = existing_src['id']
            else:
                cursor = conn.execute(
                    'INSERT INTO source_references (title, url, source_tier) VALUES (?, ?, ?)',
                    (title, url, 2)
                )
                src_id = cursor.lastrowid
                stats['sources_created'] += 1

            # Link to project (skip duplicates)
            link_exists = conn.execute(
                'SELECT 1 FROM project_sources WHERE project_id = ? AND source_id = ?',
                (pid, src_id)
            ).fetchone()
            if not link_exists:
                conn.execute(
                    'INSERT INTO project_sources (project_id, source_id) VALUES (?, ?)',
                    (pid, src_id)
                )
                stats['source_links'] += 1

        # ── Insert scheme contracts ──
        for scheme, round_name, cap_mw, stor_mwh, ctype, source_url in proj.get('schemes', []):
            existing = conn.execute(
                'SELECT id FROM scheme_contracts WHERE project_id = ? AND scheme = ?',
                (pid, scheme)
            ).fetchone()
            if not existing:
                conn.execute(
                    '''INSERT INTO scheme_contracts
                       (project_id, scheme, round, capacity_mw, storage_mwh, contract_type, source_url)
                       VALUES (?, ?, ?, ?, ?, ?, ?)''',
                    (pid, scheme, round_name or '', cap_mw, stor_mwh, ctype, source_url)
                )
                stats['schemes_created'] += 1

    if dry_run:
        print('\n🔍 DRY RUN — no changes committed')
        conn.rollback()
    else:
        conn.commit()
        print('\n✅ Enrichment committed')

    print(f"\n📊 Enrichment Summary:")
    for k, v in stats.items():
        print(f"  {k}: {v}")

    conn.close()
    return stats


if __name__ == '__main__':
    import sys
    dry = '--dry-run' in sys.argv
    run_enrichment(dry_run=dry)
