#!/usr/bin/env python3
"""Batch apply notable text to operating projects missing it.

Only updates projects where notable IS NULL or empty.
Never overwrites existing notable text.
"""

import json
import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'aures.db')

# ── BESS notable text (24 projects) ──────────────────────────────────────────

BESS_NOTABLE = [
    {"id": "torrens-island-bess", "notable": "250 MW / 250 MWh BESS at AGL's Torrens Island gas plant site in SA. Wärtsilä-supplied system completed in 18 months, designed for Virtual Synchronous Generator (VSG) grid-forming operation — the largest BESS globally capable of VSG at time of commissioning."},
    {"id": "blyth-bess", "notable": "238.5 MW / 477 MWh BESS developed by Neoen with $17M ARENA grant funding. CATL battery technology with NHOA/Elecnor JV as EPC. Has a 70 MW PPA with BHP to help power Olympic Dam copper-uranium mine in SA."},
    {"id": "greenbank-bess", "notable": "200 MW / 400 MWh BESS using 108 Tesla Megapack 2XL units, A$300M investment by Queensland state-owned CS Energy. Connected to Powerlink's Greenbank substation on Brisbane's southern outskirts, sited to absorb excess rooftop solar from the Gold Coast and Logan regions."},
    {"id": "latrobe-valley-bess", "notable": "200 MW / 196 MWh BESS near Morwell in Victoria's Latrobe Valley, the first project globally to deploy Fluence's complete product ecosystem (Gridstack hardware + Mosaic AI bidding + Nispera asset management). Developed by Tilt Renewables (Mercury NZ) in a region historically dependent on brown coal."},
    {"id": "melbourne-renewable-energy-hub-connection-a1", "notable": "One of three AEMO-registered units forming the 600 MW / 1.6 GWh Melbourne Renewable Energy Hub at Plumpton — one of the largest BESS in the Southern Hemisphere. A$1.1B project jointly developed by Equis Energy and SEC Victoria (A$245M equity). 444 Tesla Megapack units, Samsung C&T / Genus Plus JV as EPC."},
    {"id": "melbourne-renewable-energy-hub-connection-a2", "notable": "Second of three AEMO-registered units comprising the 600 MW / 1.6 GWh Melbourne Renewable Energy Hub at Plumpton. Co-developed by Equis Energy and SEC Victoria. Provides 2-hour duration storage alongside A1, with the combined hub capable of powering 200,000 homes during peak periods."},
    {"id": "melbourne-renewable-energy-hub-connection-a3", "notable": "The 4-hour duration unit within the 600 MW / 1.6 GWh Melbourne Renewable Energy Hub, providing ~801 MWh of storage — the longest-duration component of the Plumpton site. A$1.1B hub co-developed by Equis Energy and SEC Victoria with A$400M debt financing."},
    {"id": "rangebank-bess", "notable": "200 MW / 400 MWh BESS in Cranbourne's Rangebank Business Park, Melbourne's southeast. Developed by Eku Energy (Macquarie/BCI JV) and Shell Energy. Fluence sixth-generation Gridstack technology. Victoria's second-largest battery at time of opening in December 2024."},
    {"id": "koorangie-energy-storage-system", "notable": "185 MW / 370 MWh grid-forming BESS near Kerang in Victoria's Murray River region. A$400M, developed by Edify Energy, owned by Sosteneo. 15-year Shell Energy offtake for full capacity. 20-year AEMO System Support Agreement for 125 MW of system strength services — one of the first large-scale BESS contracted for this function."},
    {"id": "ulinda-park-bess", "notable": "155 MW / 298 MWh BESS in Queensland's Western Downs near Hopeland. Stage 1 of a project approved to reach 350 MW / 1,078 MWh. Developed by Akaysha Energy (BlackRock). Powin battery stacks with Eks Energy inverters. Portfolio financing alongside Brendale BESS was Australia's first multi-project battery financing."},
    {"id": "hazelwood-battery-energy-storage-system-hbess", "notable": "150 MW / 162 MWh BESS — the first utility-scale battery in Australia built on the site of a former coal-fired power station (Hazelwood, closed 2017 after 50 years). First deployment of Fluence sixth-generation GridStack in Australia. ENGIE acquired full ownership from co-developer Eku Energy in early 2026."},
    {"id": "hornsdale-power-reserve-unit-1", "notable": "The 'Tesla Big Battery' — world's largest lithium-ion battery when commissioned in November 2017 at 100 MW / 129 MWh, expanded to 150 MW / 194 MWh in 2020. First large-scale BESS in the NEM. First big battery globally to provide inertia grid services at scale via Tesla Virtual Machine Mode, supplying ~2,000 MWs of equivalent inertia to SA's grid."},
    {"id": "capital-battery", "notable": "100 MW / 200 MWh BESS adjacent to TransGrid's Queanbeyan substation near Canberra. Awarded to Neoen under ACT Government renewables tender. Commissioning delayed nearly a year due to connection compliance issues under Doosan GridTech's EPC scope, resulting in liquidated damages — a landmark outcome for Australian battery contracting."},
    {"id": "chinchilla-bess", "notable": "100 MW / 200 MWh BESS co-located with Kogan Creek Power Station. CS Energy's first BESS in western QLD, using 80 Tesla Megapack 2 units with Downer as EPC. Part of CS Energy's Kogan Creek Clean Energy Hub, reusing the station's existing grid connection and workforce."},
    {"id": "mannum-bess", "notable": "100 MW / 200 MWh BESS ~60 km east of Adelaide, developed by Canadian Solar's Recurrent Energy then sold to SA infrastructure company Epic Energy. Canadian Solar e-STORAGE SolBank technology, CPP as EPC. Integrated with Epic Energy's existing 35 MW Mannum Energy Park solar plants. Habitat Energy manages market optimisation."},
    {"id": "wandoan-south-bess", "notable": "100 MW / 150 MWh BESS — Queensland's largest utility-scale battery at time of commissioning (September 2021). A$120M Stage 1 of Vena Energy's broader 650 MW solar / 450 MW storage Wandoan South Project. Samsung SDI M3 modules with Doosan GridTech Intelligent Controller. AGL holds full operational dispatch rights."},
    {"id": "riverina-energy-storage-system-2", "notable": "65 MW / 130 MWh Tesla Megapack BESS near Darlington Point Solar Farm, NSW. Part of 150 MW / 300 MWh Riverina complex (with ESS 1). Developed by Edify Energy with Federation Asset Management (90% ownership). EnergyAustralia holds 10+ year market control rights. Grid-forming inverters in Virtual Synchronous Generator mode."},
    {"id": "smithfield-bess", "notable": "65 MW / 130 MWh BESS co-located with the 125 MW Smithfield gas peaker in western Sydney — one of few Australian BESS integrated with a peaking gas plant. Iberdrola Australia. Selected via AEMO tender in 2023, achieved COD ahead of schedule in November 2025. ACLE Services as EPC."},
    {"id": "riverina-energy-storage-system-1", "notable": "60 MW / 120 MWh Tesla Megapack BESS co-located with Darlington Point Solar Farm. Edify Energy / Federation Asset Management. Shell Energy holds long-term services agreement for operational access. Grid-forming inverters delivering Virtual Synchronous Generator mode system strength services."},
    {"id": "bouldercombe-battery-project", "notable": "50 MW / 100 MWh Tesla Megapack BESS near Gladstone, QLD. Genex Power's first large-scale BESS, operated under Tesla Autobidder offtake. Two Megapack units damaged in fire during September 2023 commissioning — Tesla bore replacement costs. 40 Megapack 2.0 units. Full COD December 2023."},
    {"id": "wallgrove-grid-battery-project", "notable": "50 MW / 75 MWh — Australia's first transmission-connected battery owned by a network service provider (Transgrid), and the first grid-scale battery in NSW. A$61.9M with ARENA and NSW Government funding. One of the first BESS globally to demonstrate Tesla Virtual Machine Mode for synthetic inertia on a transmission network."},
    {"id": "broken-hill-bess", "notable": "50 MW / 50 MWh BESS permanently configured in grid-forming mode — an ARENA-funded demonstration in one of the weakest and most remote parts of the NEM. Provides system strength services to the Broken Hill network, where high renewable penetration had previously caused frequent curtailment."},
    {"id": "dalrymple-bess", "notable": "30 MW / 8 MWh ESCRI-SA battery, commissioned 2018 as one of SA's earliest grid batteries following the 2016 state-wide blackout. Can island Yorke Peninsula as a 100% renewable microgrid with AGL's 90 MW Wattle Point Wind Farm. ElectraNet returned its ARENA grant in 2021 after the project proved financially successful."},
    {"id": "ballarat-energy-storage-system", "notable": "30 MW / 30 MWh — Victoria's first grid-scale battery and first standalone front-of-meter battery directly connected to a transmission network in Australia (2018). Fluence system owned by AusNet, operated by EnergyAustralia under long-term offtake. Victorian Government Energy Storage Initiative."},
]

# ── SOLAR notable text (78 projects) ──────────────────────────────────────────

SOLAR_NOTABLE = [
    {"id": "new-england-solar-farm", "notable": "720 MW hybrid solar-BESS project near Uralla, NSW — one of Australia's largest solar farms. Developed by ACEN Australia (formerly UPC\\AC Renewables). Includes a co-located battery storage component. Located in the New England REZ."},
    {"id": "western-downs-green-power-hub-pl", "notable": "400 MW solar farm near Chinchilla, QLD — part of Neoen's Western Downs Green Power Hub. One of Queensland's largest solar installations in the Western Downs energy corridor."},
    {"id": "stubbo-solar-farm", "notable": "400 MW solar farm near Gulgong, NSW. Developed by ACEN Australia. One of the largest solar farms in NSW's Central-West Orana REZ."},
    {"id": "aldoga-solar-farm", "notable": "387 MW solar farm near Gladstone, QLD. Developed by ACCIONA Energía for Ark Energy / Korea Zinc's green hydrogen and renewable energy strategy. Powers Korea Zinc's zinc refinery operations in Townsville."},
    {"id": "culcairn-solar-farm", "notable": "350 MW solar farm in the Riverina region of NSW. Developed by Neoen. One of the largest solar farms in the South-West NSW REZ."},
    {"id": "wellington-north-solar-farm-lightsource", "notable": "330 MW solar farm near Wellington, NSW. Developed by Lightsource BP. One of the largest single-axis tracking solar installations in the Central-West Orana REZ."},
    {"id": "limondale-solar-farm-1", "notable": "306 MW solar farm near Balranald, NSW. Originally developed by Canadian Solar / Recurrent Energy, now owned by RWE/BELECTRIC. One of the largest solar farms in western NSW."},
    {"id": "walla-walla-solar-farm", "notable": "300 MW solar farm in the Riverina, NSW. Has a 15-year PPA with Microsoft — one of the largest corporate renewable energy offtakes in Australia. Developed by FRV (Abdul Latif Jameel)."},
    {"id": "wollar-solar-farm", "notable": "280 MW solar farm near Mudgee, NSW. Developed by Lightsource BP. Located in the Central-West Orana REZ."},
    {"id": "darlington-point-solar-farm", "notable": "275 MW solar farm near Darlington Point, NSW. Developed by Edify Energy. Co-located with the Riverina Energy Storage System (150 MW / 300 MWh BESS). One of the largest solar-plus-storage complexes in Australia."},
    {"id": "coppabella-solar-farm", "notable": "270 MW solar farm in the Riverina, NSW. Developed by Tilt Renewables (Mercury NZ)."},
    {"id": "yarranlea-solar-farm", "notable": "Solar farm near Pittsworth on Queensland's Darling Downs. Developed by Risen Energy. Connected to the Darling Downs energy corridor."},
    {"id": "bluegrass-solar-farm", "notable": "257 MW solar farm near Chinchilla, QLD. Developed by X-ELIO with Stanwell Corporation as offtaker. Located in Queensland's Western Downs energy corridor."},
    {"id": "sunraysia-solar-farm", "notable": "255 MW solar farm near Balranald, NSW. Developed by Maoneng Group using Canadian Solar bifacial modules. One of the first large-scale bifacial solar deployments in Australia. Has a 15-year PPA with the Commonwealth Bank of Australia (CBA)."},
    {"id": "avonlie-solar-farm", "notable": "245 MW solar farm in the Riverina region of NSW. Developed by UPC\\AC Renewables (now ACEN Australia)."},
    {"id": "western-downs-green-power-hub-solar", "notable": "230 MW solar component of Neoen's Western Downs Green Power Hub near Chinchilla, QLD. Part of a co-located wind-solar-battery hybrid complex."},
    {"id": "kaban-green-power-hub-solar", "notable": "Solar component of Neoen's Kaban Green Power Hub in Far North Queensland. Co-located with the 157 MW Kaban wind farm."},
    {"id": "bomen-solar-farm", "notable": "221 MW solar farm near Wagga Wagga, NSW. Developed by Canadian Solar / Recurrent Energy using Canadian Solar BiHiKu bifacial modules. One of the early large-scale bifacial deployments in Australia."},
    {"id": "dunedoo-solar-farm", "notable": "213 MW solar farm near Dunedoo, NSW. Developed by Lightsource BP in the Central-West Orana REZ."},
    {"id": "upper-calliope-solar-farm", "notable": "210 MW solar farm near Gladstone in Central Queensland. Developed by Adani Green Energy Australia."},
    {"id": "daydream-solar-farm", "notable": "180 MW solar farm near Collinsville, QLD. Developed by Edify Energy with EPC by Bouygues Construction. Has a PPA with Origin Energy."},
    {"id": "finniss-river-solar-farm", "notable": "175 MW solar farm south of Adelaide, SA. Developed by Tilt Renewables (Mercury NZ). One of South Australia's largest solar installations."},
    {"id": "sebastopol-solar-farm", "notable": "170 MW solar farm near Wellington, NSW. Developed by Lightsource BP. Located in the Central-West Orana REZ."},
    {"id": "lilyvale-solar-farm", "notable": "170 MW solar farm near Emerald, Central Queensland. Developed by FRV (Abdul Latif Jameel). Holds a PPA with CleanCo Queensland."},
    {"id": "clermont-solar-farm", "notable": "165 MW solar farm near Clermont, Central Queensland. Originally developed by Wirsol, now owned by IGNEO Infrastructure Partners. Has a PPA with Origin Energy."},
    {"id": "sun-metals-solar-farm", "notable": "150 MW solar farm near Townsville, QLD. Developed by Sun Metals Corporation to directly power its adjacent Townsville zinc refinery — one of Australia's first behind-the-meter industrial-scale solar installations."},
    {"id": "moree-solar-farm", "notable": "150 MW solar farm near Moree, NSW. One of the earliest large-scale solar farms in the New England REZ. Now owned by Tilt Renewables."},
    {"id": "balranald-solar-farm", "notable": "148 MW solar farm near Balranald, western NSW. Developed by Lightsource BP."},
    {"id": "metz-solar-farm", "notable": "147 MW solar farm near Armidale, NSW. Developed by Canadian Solar / Recurrent Energy. Located in the New England REZ."},
    {"id": "hillston-solar-farm", "notable": "142 MW solar farm near Hillston in western NSW. Developed by Lightsource BP."},
    {"id": "hayman-solar-farm", "notable": "140 MW solar farm on Queensland's Darling Downs. Developed by Risen Energy. Connected to the Darling Downs energy network."},
    {"id": "columboola-solar-farm", "notable": "135 MW solar farm near Miles, QLD. Developed by Vena Energy. Located in Queensland's Western Downs region."},
    {"id": "haughton-solar-farm-1", "notable": "130 MW solar farm near Townsville, QLD. Developed by FRV (Abdul Latif Jameel). Stage 1 of a larger planned solar precinct in North Queensland."},
    {"id": "rugby-run-solar-farm", "notable": "126 MW solar farm near Chinchilla, QLD. Developed by FRV (Abdul Latif Jameel). Has a PPA with AGL Energy."},
    {"id": "warwick-solar-farm", "notable": "120 MW solar farm near Warwick, QLD. Partly funded through the University of Queensland's renewable energy agreement — one of Australia's first large university-backed solar PPAs."},
    {"id": "ross-river-solar-farm", "notable": "116 MW solar farm near Townsville, QLD. Owned by Palisade Investment Partners. One of the first large-scale solar farms in the Townsville region."},
    {"id": "hamilton-solar-farm", "notable": "115 MW solar farm near Collinsville, QLD. Developed by FRV (Abdul Latif Jameel). Located in North Queensland's Bowen Basin."},
    {"id": "susan-river-solar-farm", "notable": "112 MW solar farm near Maryborough, QLD. Developed by Edify Energy. Holds a PPA with CleanCo Queensland."},
    {"id": "gangarri-solar-farm", "notable": "110 MW solar farm near Wandoan, QLD. Developed and owned by Shell Energy — one of Shell's first utility-scale solar projects in Australia."},
    {"id": "emerald-solar-farm", "notable": "~72 MW solar farm near Emerald, Central Queensland. Holds a PPA with Telstra — one of the first major corporate solar PPAs in Australia. Now owned by Lighthouse Infrastructure / RES Australia."},
    {"id": "beryl-solar-farm", "notable": "103 MW solar farm near Gulgong, NSW. One of the first large-scale solar farms developed by First Solar in Australia, using First Solar thin-film CdTe modules. Originally part of the New Energy Solar portfolio."},
    {"id": "parkes-solar-farm", "notable": "101 MW solar farm near Parkes, NSW. Developed by Neoen. Located in the Central-West Orana REZ."},
    {"id": "childers-solar-farm", "notable": "100 MW solar farm near Childers in Queensland's Wide Bay-Burnett region. Developed by Risen Energy with Edify Energy."},
    {"id": "bungala-two-solar-farm", "notable": "95 MW solar farm near Port Augusta, SA. Stage 2 of the 190 MW Bungala Solar Power Project — SA's largest solar farm at completion. Developed by ENEL Green Power / DIF Capital Partners. Has a PPA with Origin Energy."},
    {"id": "bungala-one-solar-farm", "notable": "95 MW solar farm near Port Augusta, SA. Stage 1 of the 190 MW Bungala Solar Power Project. Developed by ENEL Green Power / DIF Capital Partners. One of the first utility-scale solar projects in the Port Augusta renewable energy precinct."},
    {"id": "collinsville-solar-farm", "notable": "90 MW solar farm near Collinsville, QLD. Developed by RATCH-Australia. Located adjacent to the former Collinsville coal power station site."},
    {"id": "coleambally-solar-farm", "notable": "88 MW solar farm near Coleambally in the Riverina, NSW. Now owned by Octopus Renewables. Has a PPA with EnergyAustralia."},
    {"id": "whitsunday-solar-farm", "notable": "83 MW solar farm in the Whitsunday region, QLD. Developed by Edify Energy. Part of Edify's portfolio of Queensland solar assets."},
    {"id": "susan-river-solar-farm-2", "notable": "77 MW solar farm near Maryborough, QLD. Stage 2 of Edify Energy's Susan River solar development."},
    {"id": "oakey-2-solar-farm", "notable": "75 MW solar farm near Oakey on QLD's Darling Downs. Developed by Canadian Solar."},
    {"id": "broken-hill-solar-plant", "notable": "74 MW solar farm at Broken Hill, NSW. Developed by AGL Energy. Co-located in the same area as the Broken Hill BESS. One of the earliest large-scale solar plants in far western NSW."},
    {"id": "murra-warra-solar-farm", "notable": "72 MW solar farm near Horsham, VIC. Developed by RES Group."},
    {"id": "bannerton-solar-park", "notable": "70 MW solar farm near Robinvale, VIC. Developed by Foresight Group. Uses single-axis tracking technology."},
    {"id": "springdale-solar-farm", "notable": "70 MW solar farm in QLD. Developed by Lightsource BP."},
    {"id": "crookwell-solar-farm", "notable": "69 MW solar farm near Crookwell, NSW. Developed by UPC\\AC Renewables. Located in the NSW Southern Tablelands near one of Australia's earliest wind farms (Crookwell Wind Farm)."},
    {"id": "wandoan-south-solar-farm", "notable": "66 MW solar farm near Wandoan, QLD. Part of Vena Energy's broader Wandoan South renewable energy precinct, co-located with the 100 MW Wandoan South BESS."},
    {"id": "oakey-1-solar-farm", "notable": "65 MW solar farm near Oakey on QLD's Darling Downs. Developed by Canadian Solar. One of the earlier large-scale solar installations in the Darling Downs region."},
    {"id": "hughenden-solar-farm", "notable": "63 MW solar farm near Hughenden in North Queensland. Developed by Neoen."},
    {"id": "clermont-2-solar-farm", "notable": "61 MW solar farm near Clermont, QLD. Extension of the original Clermont Solar Farm. Owned by IGNEO Infrastructure Partners."},
    {"id": "longreach-solar-farm", "notable": "57 MW solar farm near Longreach, QLD. Developed by Risen Energy. One of the most remote large-scale solar farms in the NEM."},
    {"id": "karadoc-solar-farm", "notable": "56 MW solar farm near Red Cliffs, VIC. Developed by Foresight Group. Part of a cluster of solar farms in Victoria's Sunraysia region."},
    {"id": "lilyvale-2-solar-farm", "notable": "55 MW solar farm near Emerald, Central Queensland. Stage 2 of FRV's Lilyvale solar development."},
    {"id": "genex-kidston-solar-farm", "notable": "54 MW solar farm at the former Kidston gold mine, QLD. Developed by Genex Power as Stage 1 of the Kidston Clean Energy Hub, which also includes the 250 MW Kidston Pumped Storage Hydro project — a world-first use of a former mine for pumped hydro."},
    {"id": "yatpool-solar-farm", "notable": "53 MW solar farm near Robinvale, VIC. Developed by Foresight Group. Part of the cluster of solar farms in Victoria's Sunraysia region."},
    {"id": "tailem-bend-solar-project", "notable": "52 MW solar farm near Tailem Bend, SA. Developed by Vena Energy. Located adjacent to The Bend Motorsport Park and the former Tailem Bend gas-fired power station site."},
    {"id": "corowa-solar-farm", "notable": "51 MW solar farm near Corowa, NSW. Developed by Squadron Energy (formerly CWP Renewables)."},
    {"id": "numurkah-solar-farm", "notable": "49 MW solar farm near Numurkah, VIC. Developed by Neoen. One of Neoen's earlier Australian solar projects."},
    {"id": "normanton-solar-farm", "notable": "45 MW solar farm near Normanton in remote Far North Queensland. One of the most northerly grid-connected solar farms in the NEM."},
    {"id": "wemen-solar-farm", "notable": "44 MW solar farm near Wemen in the Victorian Mallee. Developed by Overland Sun Farming."},
    {"id": "dunnstown-solar-farm", "notable": "41 MW solar farm near Ballarat, VIC. Developed by Foresight Group."},
    {"id": "glenrowan-solar-farm", "notable": "41 MW solar farm near Glenrowan, VIC. Developed by RES Group."},
    {"id": "moree-2-solar-farm", "notable": "37 MW solar farm near Moree, NSW. Extension of the original Moree Solar Farm. Now owned by Tilt Renewables."},
    {"id": "winton-solar-farm", "notable": "36 MW solar farm near Winton, QLD. Developed by Origin Energy."},
    {"id": "longreach-2-solar-farm", "notable": "35 MW solar farm near Longreach, QLD. Stage 2 of the Longreach solar development by Risen Energy."},
    {"id": "kidston-solar-farm-2", "notable": "33 MW solar farm at the former Kidston gold mine, QLD. Stage 2 of Genex Power's Kidston Clean Energy Hub."},
    {"id": "nyngan-solar-plant", "notable": "33 MW solar farm at Nyngan, NSW. Developed by AGL Energy with ARENA funding. One of the earliest utility-scale solar farms in Australia when commissioned in 2015."},
    {"id": "manildra-solar-farm", "notable": "32 MW solar farm near Manildra, NSW. Originally developed by Infigen Energy, now operated by Lightsource BP / Iberdrola."},
    {"id": "royalla-solar-farm", "notable": "31 MW solar farm near Royalla, ACT. Developed by FRV (Fotowatio Renewable Ventures). One of the first utility-scale solar farms in the ACT, commissioned under the ACT Government's feed-in tariff scheme."},
]

# ── WIND notable text (45 projects) ──────────────────────────────────────────

WIND_NOTABLE = [
    {"id": "coopers-gap-wind-farm", "notable": "453 MW wind farm — Australia's largest by capacity when completed in 2020. 123 GE turbines (91x GE 3.6-137 + 32x GE 3.8-130). Developed by AGL Energy, sold to Tilt Renewables at financial close; AGL retains long-term PPA. Located in Western Downs / South Burnett, QLD."},
    {"id": "macarthur-wind-farm", "notable": "420 MW, 140 Vestas V112-3.0 MW turbines — largest wind farm in the Southern Hemisphere at commissioning (January 2013). Co-developed by AGL Energy and Meridian Energy as a 50/50 JV, subsequently acquired by Morrison & Co. A$1B project cost. First utility-scale deployment of Vestas V112 globally."},
    {"id": "rye-park-wind-farm", "notable": "396 MW, 66 Vestas EnVentus V162-6.0 MW turbines (200m tip height) — largest wind farm in NSW at commissioning (2023). Developed by Tilt Renewables (Mercury NZ). Located 11 km north of Yass in the NSW Southern Tablelands."},
    {"id": "collector-wind-farm", "notable": "227 MW, 54 Vestas 4.2 MW turbines on the Cullerin Range in NSW Southern Tablelands. Developed by RATCH-Australia (Thai subsidiary). CEFC project debt financing."},
    {"id": "bango-999-wind-farm", "notable": "Part of the two-site Bango Wind Farm complex (~274 MW total) using 46 GE Cypress 5.3 MW turbines — among the first GE Cypress deployments in Australia. Developed by CWP Renewables (now Squadron Energy). Long-term PPA with Snowy Hydro."},
    {"id": "goldwind-moorabool-wind-farm", "notable": "312 MW across South (54 turbines) and North (50 turbines) sections — one of Victoria's largest wind farms. Developed, built and operated by Goldwind Australia using proprietary direct-drive turbines with 169m tip heights. Located ~25 km SE of Ballarat."},
    {"id": "bango-973-wind-farm", "notable": "Part of the Bango Wind Farm complex near Yass, NSW, sharing the 46-turbine GE Cypress 5.3 MW fleet with Bango 999. Developed by CWP Renewables (now Squadron Energy). Long-term PPA with Snowy Hydro. Fully operational 2023."},
    {"id": "dundonnell-wind-farm", "notable": "240 MW, 80 Vestas V150-4.2 MW turbines across 4,500 hectares, 23 km NE of Mortlake in western Victoria. Developed by Tilt Renewables (Mercury NZ). Practical completion June 2022."},
    {"id": "bulgana-green-power-hub-wind-farm", "notable": "204 MW wind farm (56 Siemens Gamesa turbines) co-located with 20 MW / 34 MWh Tesla battery — one of Australia's first large hybrid wind-battery hubs. Developed by Neoen under 15-year Victorian Government support agreement. Full COD December 2021."},
    {"id": "crowlands-wind-farm", "notable": "~80 MW, 39 Senvion MM92 turbines in Victoria's Pyrenees Shire. Owned by Pacific Hydro (State Power Investment Corporation of China). COD January 2019."},
    {"id": "sapphire-wind-farm", "notable": "200 MW, 75 Vestas V126-3.6 MW turbines in the New England region of NSW, 18 km west of Glen Innes. Jointly developed by Tilt Renewables and CWP Renewables; now operated by Squadron Energy. CEFC project debt. COD November 2018."},
    {"id": "murra-warra-wind-farm", "notable": "Stage 1 (226 MW, 61 Senvion 3.7 MW) + Stage 2 (209 MW, 38 GE Cypress 5.5 MW) = 435 MW total near Horsham, VIC. University of Melbourne holds Stage 1 PPA. Developed by RES Group (S1) and Partners Group (S2)."},
    {"id": "crudine-ridge-wind-farm", "notable": "135 MW, 37 GE 3.63 MW turbines, 45 km south of Mudgee, NSW. Developed by CWP Renewables (now Squadron Energy). CEFC debt financing. Zenviron civil/electrical BoP. Fully operational February 2022."},
    {"id": "bodangora-wind-farm", "notable": "113 MW, 33 GE 3.43-130 turbines, 15 km east of Wellington in central NSW. Developed by Iberdrola Australia (formerly Infigen Energy). 60% output PPA with EnergyAustralia through 2030. COD February 2019."},
    {"id": "berrybank-wind-farm", "notable": "Stage 1: 180 MW, 43 Vestas V136-4.2 MW turbines, 14 km east of Lismore, VIC. Developed by Global Power Generation (Naturgy subsidiary). Stage 2: 109 MW, 26 turbines. One of the few large Australian wind farms backed by a European utility."},
    {"id": "lincoln-gap-wind-farm", "notable": "212 MW in two stages (S1: 126 MW, S2: 86 MW) with co-located 10 MW battery, near Port Augusta, SA. Developed by Nexif Energy. Senvion turbines. CEFC debt for Stage 2. One of SA's windiest locations on the Eyre Peninsula."},
    {"id": "mount-mercer-wind-farm", "notable": "131 MW, 64 Senvion MM92 turbines, ~30 km south of Ballarat, VIC. Developed by Meridian Energy (NZ) — Meridian's first Australian wind farm. A$260M. COD May 2014. Transferred to Tilt Renewables on demerger from Trustpower in 2016."},
    {"id": "lal-lal-wind-farm", "notable": "228 MW, 60 Vestas V136-3.8 MW turbines across Yendon and Elaine sites in Moorabool Shire near Ballarat, VIC. Owned by consortium of Northleaf Capital (40%), InfraRed Capital (40%) and Macquarie Capital (20%). 30-year Vestas service agreement."},
    {"id": "hallett-hill-wind-farm", "notable": "Part of AGL's multi-site Hallett Wind Farm complex in SA's Mid North (~180 km north of Adelaide), totalling 351 MW across five stages. Suzlon S88 turbines. One of Australia's largest single-developer wind energy complexes."},
    {"id": "ararat-wind-farm", "notable": "240 MW, 75 GE 3.2-103 turbines, 9-17 km NE of Ararat, VIC. Developed by RES/GE/Partners Group/OPTrust consortium. Third-largest wind farm in Australia at commissioning (June 2017). ARENA grant funded."},
    {"id": "snowtown-2-wind-farm", "notable": "132 MW, 90 Siemens direct-drive turbines (10x SWT-101 + 80x SWT-108) on the Barunga/Hummocks Ranges, SA. Developed by TrustPower, now owned by Palisade Investment Partners consortium. COD October 2014. ~875 GWh/yr."},
    {"id": "white-rock-wind-farm", "notable": "175 MW, 70 Goldwind GW121-2.5 MW turbines in New England Tablelands, 20 km west of Glen Innes, NSW. Jointly owned by Goldwind Australia and CECEP Wind-Power Corporation. One of the first major Goldwind deployments in Australia. COD July 2017."},
    {"id": "bald-hills-wind-farm", "notable": "107 MW, 52 Senvion MM92-2050 turbines in South Gippsland, VIC. Developed by Mitsui & Co; acquired by Infrastructure Capital Group (ICG) in 2017. COD May 2015. One of Victoria's southernmost large wind farms."},
    {"id": "salt-creek-wind-farm", "notable": "54 MW, 15 Vestas V126-3.6 MW turbines in western Victoria. Zenviron-Vestas EPC for Tilt Renewables. 12-year PPA with Meridian Energy. COD July 2018."},
    {"id": "capital-wind-farm", "notable": "141 MW, 67 Suzlon S88 turbines east of Lake George, NSW. Built 2009 by Suzlon for Infigen Energy. One of the first large-scale wind farms in the ACT/NSW Capital Region. Now operated by Iberdrola Australia (2020 Infigen acquisition)."},
    {"id": "hornsdale-1-2-wind-farm", "notable": "~214 MW (Stages 1 & 2 of 315 MW Hornsdale complex), co-located with the Hornsdale Power Reserve (Tesla Big Battery). Developed by Neoen with SA Government renewable energy contract. Part of the iconic wind-plus-storage complex near Jamestown, SA."},
    {"id": "hornsdale-3-wind-farm", "notable": "100 MW — third and final stage of Neoen's 315 MW Hornsdale Wind Farm. Co-located with the Hornsdale Power Reserve (world's first large-scale grid battery at commissioning). Central to Neoen's Australian operations near Jamestown, SA."},
    {"id": "snowtown-wind-farm", "notable": "99 MW, 47 Suzlon S88 + 1 S95 prototype turbine on the Barunga Range, SA. Stage 1 of the Snowtown complex. Developed by TrustPower (now Tilt Renewables). COD September 2008. One of the largest SA wind farms of its era."},
    {"id": "waubra-wind-farm", "notable": "192 MW, 128 ACCIONA Windpower AW-1500 turbines spanning 73 km² — Australia's largest wind farm by both capacity and turbine count at commissioning (July 2009). A$450M. Developed by ACCIONA Energía."},
    {"id": "gullen-range-wind-farm", "notable": "166 MW, 56 Goldwind GRW100-2.5 MW + 17 GW82-1.5 MW turbines in NSW Southern Tablelands. Developed by Goldwind; acquired by BJCE Australia (Beijing Jingneng Clean Energy) in 2014 — BJCE's entry into the Australian market. Hosts ARENA-funded inertia-based fast frequency response trial."},
    {"id": "moorabool-north-wind-farm", "notable": "50-turbine northern section of Goldwind Australia's 312 MW Moorabool Wind Farm complex, ~25 km SE of Ballarat, VIC. Goldwind direct-drive turbines with 169m tip heights. Full complex COD June 2022."},
    {"id": "yaloak-south-wind-farm", "notable": "~29 MW, 14 Senvion MM92 turbines, ~15 km south of Ballan in Moorabool Shire, VIC. Pacific Hydro (SPIC). COD June 2018, completed 25 days ahead of schedule."},
    {"id": "kiata-wind-farm", "notable": "31 MW, 9 Vestas V126-3.45 MW turbines, 50 km NW of Horsham, VIC. Developed by Windlab; now owned by Atmos Renewables. Set a 65% monthly capacity factor record for a Victorian wind farm. COD December 2017."},
    {"id": "wonthaggi-wind-farm", "notable": "12 MW, 6 Senvion MM82 turbines at Wonthaggi in Gippsland, VIC. Operational since December 2005. Operated by EDL Energy. One of Victoria's earliest operational wind farms. Infrastructure occupies <1% of the host cattle grazing property."},
    {"id": "boco-rock-wind-farm", "notable": "113 MW, 67 GE turbines (58x 1.7 MW + 9x 1.62 MW) near Nimmitabel, NSW Snowy Mountains. CWP Renewables / Asia Pacific Renewables. 15-year PPA with EnergyAustralia. Downer EDI as EPC. COD November 2014."},
    {"id": "waterloo-wind-farm", "notable": "111 MW wind farm in Clare Valley, SA. Expanded 2016 with 6 additional Vestas V117-3.3 MW turbines (A$43M). Owned by Northleaf Capital / Palisade Investment Partners."},
    {"id": "musselroe-wind-farm", "notable": "168 MW, 56 Vestas V90-3.0 MW turbines at Cape Portland, NE Tasmania. Woolnorth Renewables. Produces ~5% of Tasmania's electricity. Subject to ARENA-funded eagle detection system trials."},
    {"id": "mortlake-south-wind-farm", "notable": "158 MW, 35 Nordex N149-4.5 MW turbines near Mortlake, VIC. ACCIONA Energía, A$180M+. The 4.5 MW Nordex turbines were the highest individual rated capacity installed in Australia at time of construction. Awarded under Victoria's VCR program. COD July 2024."},
    {"id": "clements-gap-wind-farm", "notable": "57 MW, 27 Suzlon S88 turbines in the Barunga Range near Port Pirie, SA. Pacific Hydro, A$135M. COD August 2009. One turbine destroyed by fire in February 2024. A co-located 60 MW battery has been proposed."},
    {"id": "woodlawn-wind-farm", "notable": "48 MW, 23 Suzlon S88 turbines, ~20 km north of Bungendore, NSW. Developed by Infigen Energy, now operated by Iberdrola Australia. Operational since October 2011. Located near the closed Woodlawn zinc-lead mine."},
    {"id": "cathedral-rocks-wind-farm", "notable": "66 MW, 33 Vestas V80-2.0 MW turbines on the Eyre Peninsula, SA. 50/50 JV between EnergyAustralia and ACCIONA Energy. Construction started 2004; fully operational 2007."},
    {"id": "portland-4-wind-farm", "notable": "~47 MW Stage IV (Cape Sir William Grant) of the Portland Wind Energy Project by Pacific Hydro. 23 turbines at 2.05 MW each. The PWEP is one of Australia's oldest continuously developed wind projects, with stages from 2001 to 2015."},
    {"id": "canunda", "notable": "46 MW, 23 Vestas V80-2.0 MW turbines south of Millicent, SA. Opened March 2005. Operated by ENGIE (72%) and Mitsui (28%). Reached 20-year design lifespan in 2025, operational life extended to 2035."},
    {"id": "hallett-1-wind-farm", "notable": "95 MW, 45 Suzlon S88 turbines, ~180 km north of Adelaide, SA. First stage of AGL's multi-site Hallett complex (351 MW total). COD June 2008. 25-year AGL PPA."},
    {"id": "portland-3-wind-farm", "notable": "44 MW Stage III (Cape Nelson South) of the Portland Wind Energy Project by Pacific Hydro. 22 turbines at 2.0 MW each. Part of one of Australia's longest-running multi-stage wind developments (2001-2015)."},
]

# ── PUMPED HYDRO notable text (34 projects) ──────────────────────────────────

HYDRO_NOTABLE = [
    {"id": "tumut-3", "notable": "Australia's largest pumped hydro facility at 1,800 MW — six Toshiba turbines (three reversible as pumps at 600 MW combined). Part of the Snowy Mountains Hydroelectric Scheme, commissioned 1973. Located below Talbingo Dam on the Tumut River, NSW."},
    {"id": "murray-1", "notable": "950 MW conventional hydroelectric station, part of the Snowy Mountains Scheme, completed 1967. Ten Boving Francis-type turbines, 460m head from Geehi Reservoir. Located underground near Khancoban, NSW. ~1,413 GWh annually."},
    {"id": "upper-tumut", "notable": "Comprises Tumut 1 (330 MW, 1959) and Tumut 2 (286 MW, 1962) underground stations — Upper Tumut Works of the Snowy Mountains Scheme. Tumut 1 is 366m underground near Cabramurra. Combined ~1,634 GWh annually. Feed water to downstream Tumut 3."},
    {"id": "murray-2", "notable": "625 MW conventional hydro, Snowy Mountains Scheme, completed 1969. Four Hitachi Francis turbines, 264m head, ASEA generators. Located underground near Khancoban, NSW. Receives discharge from Murray 1 upstream."},
    {"id": "wivenhoe", "notable": "Queensland's only pumped storage hydro at 570 MW — two 285 MW Francis turbines (largest hydromachines in Australia). Commissioned 1984, 75 km west of Brisbane. Water cycles between Split Yard Creek Dam and Wivenhoe Dam. Transferred to CleanCo Queensland in 2019. Set a 40-year generation record in Q3 2024."},
    {"id": "gordon", "notable": "Tasmania's largest power station at 432 MW (three 144 MW Francis turbines), 183m underground in western Tasmania. Gordon Dam is a 140m high concrete arch, completed 1974. Supplies ~13% of Tasmania's electricity. Undergoing its most extensive upgrade program in history (commenced 2024)."},
    {"id": "poatina", "notable": "Tasmania's first underground power station, commissioned 1964-65. Six Pelton turbines in cavern 150m underground in the Central Highlands. Historically housed 2,000+ construction workers in dedicated Poatina Village. Currently undergoing major upgrade with Andritz-supplied replacement Pelton turbines."},
    {"id": "bogong-mackay", "notable": "300 MW combined Bogong (140 MW) + McKay Creek (140 MW) stations — fourth and final addition to the Kiewa Hydroelectric Scheme in the Victorian Alps near Mount Beauty. AGL Energy. Commissioned November 2009 after decades of delays. A$240M."},
    {"id": "trevallyn", "notable": "96 MW run-of-river hydro adjacent to the Tamar River north of Launceston, Tasmania. Commissioned 1955, replacing the historic Duck Reach Power Station. A$17.5M machine refurbishment completed ~2019 yielding 5% efficiency improvement. Hydro Tasmania."},
    {"id": "john-butters", "notable": "144 MW conventional hydro in western Tasmania, fed from Lake Burbury via Crotty Dam. Single Fuji Francis turbine. Commissioned 1992 — one of the last major Tasmanian stations before HEC restructuring into Hydro Tasmania. Named after Hydro Tasmania's first general manager."},
    {"id": "tarraleah", "notable": "90 MW heritage-listed underground hydro in Tasmania's Central Highlands, part of the Upper Derwent Scheme. First units 1938, remaining by 1951. Art Deco style. Hydro Tasmania has proposed A$2B+ redevelopment to increase to 190 MW and deliver 30% more energy from the same water."},
    {"id": "liapootah", "notable": "87 MW run-of-river hydro in Tasmania's Central Highlands, first in the lower Derwent scheme cascade. Commissioned 1960 by HEC. Hydro Tasmania."},
    {"id": "tungatinah", "notable": "125 MW hydro in Tasmania's Central Highlands, second station in the Derwent scheme. Five Boving Francis turbines (1953-1956). Water descends 290m through five steel penstocks from Tungatinah Lagoon. Heritage-listed. Hydro Tasmania."},
    {"id": "cethana", "notable": "Underground hydro station in NW Tasmania, fifth in the Mersey-Forth scheme. Single Fuji Francis turbine, ~95 MW. Commissioned 1971 by HEC. Hydro Tasmania has proposed a pumped hydro extension (Cethana Pumped Hydro) at the site."},
    {"id": "wilmot", "notable": "31 MW hydro in the Mersey-Forth catchment, NW Tasmania. Water from Wilmot River stored at Lake Gairdner. Part of Hydro Tasmania's eight-station Mersey-Forth cascade."},
    {"id": "lemonthyme", "notable": "86 MW hydro in NW Tasmania, part of the Mersey-Forth scheme. Near the Lemonthyme Wilderness area. Hydro Tasmania."},
    {"id": "mackintosh", "notable": "81 MW underground hydro at Lake Mackintosh, western Tasmania. Second station in the Pieman River Power Development. Single Fuji Francis turbine. Commissioned 1982 as part of the 1974-1987 Pieman River development. Hydro Tasmania."},
    {"id": "reece", "notable": "238 MW hydro (two Fuji Francis turbines) at Lake Pieman, western Tasmania. Final station in the Pieman River cascade. Commissioned 1986-87 as concluding component of the major 1974-1987 Pieman development. Hydro Tasmania."},
    {"id": "bastyan", "notable": "81 MW underground hydro at Lake Rosebery, western Tasmania. Third station in the Pieman River Power Development. Single Fuji Francis turbine. Commissioned 1983. Hydro Tasmania."},
    {"id": "devils-gate", "notable": "60 MW hydro in NW Tasmania, part of the Mersey-Forth scheme. The Devils Gate Dam (84m high) is one of the thinnest concrete arch dams in the world. Hydro Tasmania."},
    {"id": "fisher", "notable": "58 MW hydro in NW Tasmania, Mersey-Forth scheme. Water from Lake Mackenzie drops 650m — one of the largest head differentials in the scheme. Hydro Tasmania."},
    {"id": "meadowbank", "notable": "50 MW hydro in Tasmania's Central Highlands, part of the Derwent scheme. One of eleven stations in the cascaded Derwent river system. Hydro Tasmania."},
    {"id": "catagunya-liapootah-wayatinah", "notable": "Three cascaded run-of-river stations on Tasmania's lower Derwent: Catagunya (48 MW, 1962), Liapootah (87 MW, 1960), Wayatinah (38 MW, 1957). Combined ~178 MW. Part of the eleven-station Derwent scheme. Hydro Tasmania."},
    {"id": "shoalhaven", "notable": "240 MW pumped hydro comprising Kangaroo Valley and Bendeela stations, ~150 km south of Sydney. Constructed 1977. Origin Energy. ARENA-funded feasibility study (2019) found 235 MW expansion technically feasible but not commercially viable."},
    {"id": "parangana", "notable": "38 MW mini-hydro below Parangana Dam, NW Tasmania. Built 2002 to capture energy from environmental flow releases for downstream Mersey River operations. Late addition to the Mersey-Forth scheme. Hydro Tasmania."},
    {"id": "tribute", "notable": "36 MW hydro in western Tasmania, part of the Pieman River catchment system. Hydro Tasmania."},
    {"id": "burrinjuck", "notable": "~30 MW hydro at heritage-listed Burrinjuck Dam on the Murrumbidgee River, NSW. Dam construction 1907-1928; No. 1 power station commissioned 1927. New 16 MW Unit 5 added 2002. Engineering Heritage Australia landmark. Owned by Meridian Energy Australia."},
    {"id": "rowallan", "notable": "11 MW hydro, first station in the Mersey-Forth scheme, NW Tasmania. Single Maier Francis turbine. Commissioned 1971. Hydro Tasmania."},
    {"id": "paloona", "notable": "31 MW hydro in the Mersey-Forth catchment, NW Tasmania. Part of the eight-station Mersey-Forth cascade. Hydro Tasmania."},
    {"id": "lake-william-hovell", "notable": "30 MW hydro in NE Victoria, part of the Kiewa Hydroelectric Scheme — Victoria's largest hydro scheme and second-largest on the Australian mainland. AGL Energy. Located in the Australian Alps."},
    {"id": "barron-gorge", "notable": "66 MW underground hydro in Barron Gorge National Park, 20 km NW of Cairns, Far North QLD. First commissioned 1963, replacing an 1935 surface station — Queensland's first hydro. CleanCo Queensland (transferred from Stanwell 2019). Severely damaged by Cyclone Jasper December 2023; returned to service mid-2024."},
    {"id": "kareeya", "notable": "88 MW underground run-of-river hydro near Tully, Far North QLD. Four 22 MW Pelton turbines. Commenced 1957. CleanCo Queensland (transferred from Stanwell 2019). Set a new station generation record of ~691,000 MWh in calendar year 2024."},
    {"id": "koombooloomba", "notable": "7 MW hydro at Koombooloomba Dam on the Tully River, Far North QLD. Dam built 1960; power station added 1999 to capture energy from environmental flow releases for downstream Kareeya station. CleanCo Queensland."},
    {"id": "lake-margaret", "notable": "13 MW heritage-listed hydro in western Tasmania, built by Mt Lyell Mining & Railway Company 1912-1914 — one of Australia's earliest hydroelectric schemes. Decommissioned 2006 after flood damage; recommissioned 2009-10 after multimillion-dollar refit. Features original early 20th century machinery. Hydro Tasmania."},
]

# ── HYBRID ────────────────────────────────────────────────────────────────────

HYBRID_NOTABLE = [
    {"id": "new-england-solar", "notable": "720 MW hybrid solar-BESS project near Uralla in the New England REZ, NSW. Developed by ACEN Australia (formerly UPC\\AC Renewables). One of Australia's largest renewable energy projects combining solar generation with battery storage."},
]


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    all_updates = BESS_NOTABLE + SOLAR_NOTABLE + WIND_NOTABLE + HYDRO_NOTABLE + HYBRID_NOTABLE
    print(f"Total notable entries to apply: {len(all_updates)}")

    applied = 0
    skipped_existing = 0
    skipped_not_found = 0

    for entry in all_updates:
        pid = entry['id']
        notable = entry['notable']

        # Check if project exists and current notable state
        row = conn.execute(
            "SELECT id, notable FROM projects WHERE id = ?", (pid,)
        ).fetchone()

        if not row:
            print(f"  NOT FOUND: {pid}")
            skipped_not_found += 1
            continue

        # Never overwrite existing notable text
        if row['notable'] and row['notable'].strip():
            print(f"  SKIP (existing): {pid}")
            skipped_existing += 1
            continue

        conn.execute(
            "UPDATE projects SET notable = ? WHERE id = ?",
            (notable, pid)
        )
        applied += 1

    conn.commit()
    conn.close()

    print(f"\nResults:")
    print(f"  Applied: {applied}")
    print(f"  Skipped (existing notable): {skipped_existing}")
    print(f"  Skipped (not found): {skipped_not_found}")
    print(f"  Total: {applied + skipped_existing + skipped_not_found}")


if __name__ == '__main__':
    main()
