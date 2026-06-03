/**
 * CIS and LTESA Round Data
 *
 * Sourced from DCCEEW, AEMO Services (ASL), RenewEconomy, PV Magazine,
 * Energy Storage News, WattClarity, and Modo Energy.
 */
import type { CISRound, LTESARound } from '../lib/types'

// ============================================================
// CIS ROUNDS
// ============================================================

export const CIS_ROUNDS: CISRound[] = [
  {
    id: 'cis-pilot-nsw',
    name: 'CIS Pilot — NSW',
    type: 'dispatchable',
    market: 'NEM',
    announced_date: '2023-11-23',
    total_capacity_mw: 1075,
    total_storage_mwh: 0,
    num_projects: 6,
    project_ids: [],
    description: 'First CIS tender, co-delivered between the federal and NSW governments under the NSW Electricity Infrastructure Roadmap (LTESA Round 2). Six battery and virtual power plant projects delivering 1+ GW of dispatchable capacity. Note: DCCEEW Senate Estimates testimony (Dec 2025) excluded these 6 projects from the CIS project count of 63, likely because they were structured under the NSW LTESA firming framework rather than the standard CISA mechanism.',
    key_changes: 'First-ever CIS round. Dispatchable only. NSW state partnership.',
    sources: [
      { title: 'Big boost to reliable renewables in NSW', url: 'https://www.nsw.gov.au/media-releases/big-boost-to-reliable-renewables-nsw', date: '2023-11-23', source_tier: 1 },
      { title: 'DCCEEW — Stage 1 CIS', url: 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme/stage-1-capacity-investment-scheme', source_tier: 1 },
    ],
  },
  {
    id: 'cis-pilot-sa-vic',
    name: 'CIS Pilot — SA/VIC',
    type: 'dispatchable',
    market: 'NEM',
    announced_date: '2024-09-04',
    total_capacity_mw: 995,
    total_storage_mwh: 3626,
    num_projects: 6,
    project_ids: [],
    description: 'Second CIS pilot, covering South Australia and Victoria. Six battery projects delivering 995 MW / 3,626 MWh of dispatchable capacity, enough to supply peak demand for a million homes.',
    key_changes: 'Expanded to SA and VIC. Dispatchable/storage focus. Required min 2hr duration.',
    sources: [
      { title: 'CIS supports 6 new projects in Vic and SA', url: 'https://www.dcceew.gov.au/about/news/capacity-investment-scheme-supports-6-new-projects-vic-sa', date: '2024-09-04', source_tier: 1 },
    ],
  },
  {
    id: 'cis-tender-1-nem-gen',
    name: 'CIS Tender 1 — NEM Generation',
    type: 'generation',
    market: 'NEM',
    announced_date: '2024-12-11',
    total_capacity_mw: 6380,
    total_storage_mwh: 3500,
    num_projects: 19,
    project_ids: [],
    description: 'Australia\'s largest ever renewable energy tender. 19 projects selected from 84 bids (4.5× oversubscribed), delivering 6.38 GW across NSW, VIC, QLD, and SA. Included 2.8 GW solar, 3.6 GW wind, and 3.5 GWh battery storage via 8 hybrid projects.',
    key_changes: 'First formal national competitive tender (not a pilot). CfD mechanism. None of the Big 3 gen-tailers won.',
    sources: [
      { title: 'DCCEEW — Closed CIS Tenders', url: 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme/closed-cis-tenders', source_tier: 1 },
      { title: 'CIS Tender 1 delivers 2.75 GW solar (PV Magazine)', url: 'https://www.pv-magazine-australia.com/2024/12/11/cis-generation-tender-1-will-deliver-2-75-gw-of-solar-generation-to-the-nem/', date: '2024-12-11', source_tier: 2 },
      { title: 'Standalone solar and wind dominate (WattClarity)', url: 'https://wattclarity.com.au/articles/2024/12/standalone-solar-and-wind-dominate-list-of-19-successful-projects-from-latest-cis-tender/', date: '2024-12-11', source_tier: 2 },
    ],
  },
  {
    id: 'cis-tender-2-wem-disp',
    name: 'CIS Tender 2 — WEM Dispatchable',
    type: 'dispatchable',
    market: 'WEM',
    announced_date: '2025-03-20',
    total_capacity_mw: 654,
    total_storage_mwh: 2595,
    num_projects: 4,
    project_ids: [],
    description: 'First CIS tender for Western Australia\'s WEM. Four battery projects totalling 654 MW / 2,595 MWh, enough to power 600,000 households during peak summer demand. Attracted bids for 7× more capacity than tendered.',
    key_changes: 'First WEM-specific round. Required SWIS connection. Min 2hr duration, min 30 MW.',
    sources: [
      { title: 'WA CIS tender awards four battery projects (PV Magazine)', url: 'https://www.pv-magazine-australia.com/2025/03/20/western-australia-cis-tender-awards-four-battery-projects-totalling-654-mw/', date: '2025-03-20', source_tier: 2 },
      { title: '2.6 GWh of BESS successful in WA CIS tender (Energy Storage News)', url: 'https://www.energy-storage.news/2-6gwh-of-bess-successful-in-western-australias-first-cis-tender/', date: '2025-03-20', source_tier: 2 },
    ],
  },
  {
    id: 'cis-tender-3-nem-disp',
    name: 'CIS Tender 3 — NEM Dispatchable',
    type: 'dispatchable',
    market: 'NEM',
    announced_date: '2025-09-17',
    total_capacity_mw: 4130,
    total_storage_mwh: 15370,
    num_projects: 16,
    project_ids: [],
    description: 'Australia\'s biggest battery storage tender. 16 lithium-ion battery projects totalling 4.13 GW / 15.37 GWh across NSW, VIC, QLD and SA. Drew 124 bids for ~34 GW (8× oversubscribed). Average duration 3.72 hours. Estimated $3.8B in local content.',
    key_changes: 'Largest battery auction ever. All 16 winners were li-ion BESS. 8× oversubscribed.',
    sources: [
      { title: 'CIS Tender 3 — 16 battery projects (PV Magazine)', url: 'https://www.pv-magazine-australia.com/2025/09/17/cis-tender-supports-16-big-battery-projects-totalling-more-than-15-gwh/', date: '2025-09-17', source_tier: 2 },
      { title: '15.37 GWh of storage (Energy Storage News)', url: 'https://www.energy-storage.news/over-15gwh-of-energy-storage-successful-in-australias-capacity-investment-scheme-tender-3/', date: '2025-09-17', source_tier: 2 },
      { title: 'Bowen names 16 winners (RenewEconomy)', url: 'https://reneweconomy.com.au/bowen-names-16-winners-of-australias-biggest-battery-storage-tender/', date: '2025-09-17', source_tier: 2 },
    ],
  },
  {
    id: 'cis-tender-4-nem-gen',
    name: 'CIS Tender 4 — NEM Generation',
    type: 'generation',
    market: 'NEM',
    announced_date: '2025-10-09',
    total_capacity_mw: 6640,
    total_storage_mwh: 11444,
    num_projects: 20,
    project_ids: [],
    description: '20 projects delivering 6.6 GW of renewable generation plus 11.4 GWh of co-located storage. 56% solar, 44% wind. 12 of 20 are hybrid projects with BESS. Drew 84 bids for 25.6 GW (4× oversubscribed). Includes Tasmania\'s first CIS project. $17B in local investment.',
    key_changes: 'Hybrid solar+BESS projects dominant (12 of 20). First Tasmanian project. $1B Australian steel commitment.',
    sources: [
      { title: 'CIS Tender 4 to deliver 6.6GW (DCCEEW)', url: 'https://www.dcceew.gov.au/about/news/cis-tender-4-deliver-6-6gw-clean-energy', date: '2025-10-09', source_tier: 1 },
      { title: '11.4 GWh of solar-plus-storage (Energy Storage News)', url: 'https://www.energy-storage.news/australias-capacity-investment-scheme-tender-4-sees-11-4gwh-of-solar-plus-storage-awarded/', date: '2025-10-09', source_tier: 2 },
    ],
  },
  {
    id: 'cis-tender-5-6-wem',
    name: 'CIS Tenders 5 & 6 — WEM',
    type: 'generation',
    market: 'WEM',
    announced_date: '',
    total_capacity_mw: 0,
    total_storage_mwh: 0,
    num_projects: 0,
    project_ids: [],
    description: 'WEM generation and dispatchable tenders targeting 1.6 GW generation and 2.4 GWh storage in Western Australia. Results expected March-April 2026.',
    key_changes: 'Combined generation + storage tenders for WA.',
    sources: [
      { title: 'CIS Tenders 5 & 6 in WEM now open (DCCEEW)', url: 'https://www.dcceew.gov.au/about/news/cis-tenders-5-and-6-in-wem-now-open', source_tier: 1 },
    ],
  },
  {
    id: 'cis-tender-7-nem-gen',
    name: 'CIS Tender 7 — NEM Generation',
    type: 'generation',
    market: 'NEM',
    announced_date: '2026-05-23',
    total_capacity_mw: 7828,
    total_storage_mwh: 7885,
    num_projects: 19,
    project_ids: [],
    description: 'Largest CIS renewable auction to date. 19 winning projects deliver 7.83 GW against a 5 GW target — wind dominates (5.58 GW vs 2.24 GW solar across 10 wind and 9 solar projects), with 8 of the 19 being battery-paired hybrids contributing 7.89 GWh of storage. Updated 2026-05-25 with full DCCEEW media-release detail: NSW received 9 projects (1 over the 8-project state quota — Wattle Creek added late), QLD 5, VIC + TAS 2 each, SA 1. The 19 winners unlock ~$17B private investment, ~19,000 construction jobs, $1.2B in social-licence commitments and $257M of Australian steel.',
    key_changes: 'Largest single CIS auction (7.83 GW awarded — 56% above the 5 GW target). Wind-dominated (10 of 19 projects, 71% of capacity). 8 hybrids contribute 7.89 GWh of storage. **NSW will be excluded from the next federal CIS generation round (Tender 9)** — NSW wind without a T7 win now competes only in the state Roadmap LTESA Generation tender (Q2 2026, 2.5 GW, hybrid-favoured). Notable concentration: only 1 of 19 winners is EPBC-approved at award (Yanco Delta) — major planning execution risk.',
    sources: [
      { title: 'Australia\'s biggest wind project and 8 battery hybrids among 19 winners (RenewEconomy)', url: 'https://reneweconomy.com.au/australias-biggest-wind-project-and-8-battery-hybrids-among-19-winners-of-largest-renewable-auction-to-date/', date: '2026-05-23', source_tier: 2 },
      { title: 'Australia opens CIS Tender 7 (PV Tech)', url: 'https://www.pv-tech.org/australia-opens-capacity-investment-scheme-tender-7-seeking-5gw-of-renewables/', source_tier: 2 },
    ],
  },
  {
    id: 'cis-tender-8-nem-disp',
    name: 'CIS Tender 8 — NEM Dispatchable',
    type: 'dispatchable',
    market: 'NEM',
    announced_date: '',
    total_capacity_mw: 0,
    total_storage_mwh: 0,
    num_projects: 0,
    project_ids: [],
    description: 'Seeking ~16 GWh of NEM dispatchable capacity. Will allow aggregated small batteries for the first time. Results expected mid-2026.',
    sources: [
      { title: 'Australia to launch CIS Tender 8 (Energy Storage News)', url: 'https://www.energy-storage.news/australia-to-launch-capacity-investment-scheme-tender-8-seeking-16gwh-energy-storage-in-the-nem/', source_tier: 2 },
    ],
  },
]

// ============================================================
// CIS PROJECT DATA (per-round)
// ============================================================

export interface SchemeProject {
  name: string
  developer: string
  technology: 'wind' | 'solar' | 'bess' | 'hybrid' | 'pumped_hydro' | 'vpp'
  capacity_mw: number
  storage_mwh?: number
  state: string
  location?: string
  project_id?: string // Link to master project record
  notes?: string      // Optional inline caveat — e.g. capacity awarded vs project total, missing data flags
}

export const CIS_PROJECTS: Record<string, SchemeProject[]> = {
  'cis-tender-1-nem-gen': [
    // NSW (7 projects, ~3.7 GW)
    { name: 'Valley of the Winds', developer: 'ACEN Australia', technology: 'wind', capacity_mw: 936, state: 'NSW', project_id: 'valley-of-the-winds' },
    { name: 'Sandy Creek Solar Farm', developer: 'Lightsource bp', technology: 'solar', capacity_mw: 700, state: 'NSW', project_id: 'sandy-creek-solar-farm' },
    { name: 'Spicers Creek Wind Farm', developer: 'Squadron Energy', technology: 'wind', capacity_mw: 700, state: 'NSW', project_id: 'spicers-creek-wind-farm' },
    { name: 'Junction Rivers', developer: 'Windlab', technology: 'hybrid', capacity_mw: 585, storage_mwh: 800, state: 'NSW', project_id: 'junction-rivers-wind-and-bess' },
    { name: 'Goulburn River Solar Farm', developer: 'Lightsource bp', technology: 'solar', capacity_mw: 450, state: 'NSW', project_id: 'goulburn-river-solar-farm-and-bess' },
    { name: 'Thunderbolt Wind Farm', developer: 'Neoen', technology: 'wind', capacity_mw: 230, state: 'NSW', project_id: 'thunderbolt-wind-farm' },
    { name: 'Glanmire Solar Farm', developer: 'Elgin Energy', technology: 'hybrid', capacity_mw: 60, storage_mwh: 104, state: 'NSW', project_id: 'glanmire-solar-farm' },
    // VIC (6 projects, ~1.6 GW)
    { name: 'Kentbruck Wind Farm', developer: 'Neoen', technology: 'wind', capacity_mw: 600, state: 'VIC', project_id: 'kentbruck-green-power-hub' },
    { name: 'West Mokoan Solar Farm', developer: 'Lightsource bp', technology: 'hybrid', capacity_mw: 300, storage_mwh: 560, state: 'VIC', project_id: 'west-mokoan-solar-farm-and-bess' },
    { name: 'Barwon Solar Farm', developer: 'Elgin Energy', technology: 'hybrid', capacity_mw: 250, storage_mwh: 500, state: 'VIC', project_id: 'barwon-solar-farm-and-bess' },
    { name: 'Campbells Forest Solar Farm', developer: 'Risen Energy', technology: 'solar', capacity_mw: 205, state: 'VIC', project_id: 'campbells-forest-solar-farm' },
    { name: 'Elaine Solar Farm', developer: 'Elgin Energy', technology: 'hybrid', capacity_mw: 125, storage_mwh: 250, state: 'VIC', project_id: 'elaine-solar-farm-and-bess' },
    { name: 'Barnawartha Solar Farm', developer: 'Gentari', technology: 'hybrid', capacity_mw: 64, storage_mwh: 139, state: 'VIC', project_id: 'barnawartha-solar-and-energy-storage' },
    // SA (2 projects)
    { name: 'Goyder North Wind Farm', developer: 'Neoen', technology: 'wind', capacity_mw: 300, state: 'SA', project_id: 'goyder-north-wind-farm' },
    { name: 'Palmer Wind Farm', developer: 'Tilt Renewables', technology: 'wind', capacity_mw: 274, state: 'SA', project_id: 'palmer-wind-farm' },
    // QLD (3 projects)
    { name: 'Hopeland Solar Farm', developer: 'ACS', technology: 'solar', capacity_mw: 250, state: 'QLD', project_id: 'hopeland-solar-farm' },
    { name: 'Majors Creek Solar Power Station', developer: 'Edify Energy', technology: 'hybrid', capacity_mw: 150, storage_mwh: 600, state: 'QLD', project_id: 'majors-creek-solar-power-station' },
    { name: 'Ganymirra Solar Power Station', developer: 'Edify Energy', technology: 'hybrid', capacity_mw: 150, storage_mwh: 600, state: 'QLD', project_id: 'ganymirra-solar-power-station' },
    // VIC — 19th project
    { name: 'Mokoan Solar Farm', developer: 'European Energy Australia', technology: 'solar', capacity_mw: 46, state: 'VIC', project_id: 'mokoan-solar-farm' },
  ],
  'cis-pilot-nsw': [
    { name: 'Orana REZ Battery', developer: 'Akaysha Energy', technology: 'bess', capacity_mw: 460, storage_mwh: 920, state: 'NSW', location: 'Wellington', project_id: 'orana-bess' },
    { name: 'Liddell BESS', developer: 'AGL Energy', technology: 'bess', capacity_mw: 500, storage_mwh: 1000, state: 'NSW', location: 'Muswellbrook', project_id: 'liddell-bess' },
    { name: 'Smithfield Sydney Battery', developer: 'Iberdrola Australia', technology: 'bess', capacity_mw: 235, storage_mwh: 470, state: 'NSW', location: 'Smithfield', project_id: 'smithfield-bess' },
    { name: 'Enel X VPP 1', developer: 'Enel X Australia', technology: 'vpp', capacity_mw: 43, state: 'NSW' },
    { name: 'Enel X VPP 2', developer: 'Enel X Australia', technology: 'vpp', capacity_mw: 43, state: 'NSW' },
    { name: 'Enel X VPP 3', developer: 'Enel X Australia', technology: 'vpp', capacity_mw: 44, state: 'NSW' },
  ],
  'cis-pilot-sa-vic': [
    { name: 'Wooreen Battery', developer: 'EnergyAustralia', technology: 'bess', capacity_mw: 350, storage_mwh: 1400, state: 'VIC', location: 'Hazelwood North', project_id: 'wooreen-energy-storage-system' },
    { name: 'Springfield BESS', developer: 'Neoen', technology: 'bess', capacity_mw: 200, storage_mwh: 400, state: 'VIC', location: 'Springfield' },
    { name: 'Mortlake BESS', developer: 'Origin Energy', technology: 'bess', capacity_mw: 135, storage_mwh: 270, state: 'VIC', location: 'Mortlake', project_id: 'mortlake-battery' },
    { name: 'Tailem Bend BESS', developer: 'Iberdrola', technology: 'bess', capacity_mw: 200, storage_mwh: 560, state: 'SA', location: 'Tailem Bend', project_id: 'tailem-bend-stage-3' },
    { name: 'Clements Gap Battery', developer: 'Pacific Blue', technology: 'bess', capacity_mw: 60, storage_mwh: 240, state: 'SA', location: 'Clements Gap', project_id: 'clements-gap-bess' },
    { name: 'Hallett Battery', developer: 'EnergyAustralia', technology: 'bess', capacity_mw: 50, storage_mwh: 756, state: 'SA', location: 'Canownie', project_id: 'hallett-bess' },
  ],
  'cis-tender-2-wem-disp': [
    { name: 'Boddington Giga Battery', developer: 'PGS Energy', technology: 'bess', capacity_mw: 324, storage_mwh: 1296, state: 'WA', location: 'Marradong' },
    { name: 'Merredin Big Battery', developer: 'Atmos Renewables', technology: 'bess', capacity_mw: 100, storage_mwh: 400, state: 'WA', location: 'Merredin' },
    { name: 'Muchea Big Battery', developer: 'Neoen', technology: 'bess', capacity_mw: 150, storage_mwh: 600, state: 'WA', location: 'Muchea' },
    { name: 'Waroona Renewable Energy Project Stage 1', developer: 'Frontier Energy', technology: 'bess', capacity_mw: 80, storage_mwh: 299, state: 'WA', location: 'Waroona' },
  ],
  'cis-tender-3-nem-disp': [
    { name: 'Bulabul 2 BESS', developer: 'AMPYR Australia', technology: 'bess', capacity_mw: 100, storage_mwh: 406, state: 'NSW', location: 'Wuuluman', project_id: 'bulabul-bess-2' },
    { name: 'Swallow Tail BESS', developer: 'AMPYR Australia', technology: 'bess', capacity_mw: 300, storage_mwh: 1218, state: 'NSW', location: 'Bannaby', project_id: 'swallow-tail-bess' },
    { name: 'Calala BESS', developer: 'Equis', technology: 'bess', capacity_mw: 150, storage_mwh: 300, state: 'NSW', location: 'Calala', project_id: 'calala-bess-a1' },
    { name: 'Goulburn River Standalone BESS', developer: 'Lightsource bp', technology: 'bess', capacity_mw: 450, storage_mwh: 1370, state: 'NSW', location: 'Merriwa', project_id: 'goulburn-river-bess' },
    { name: 'Mount Piper BESS Stage 1', developer: 'EnergyAustralia', technology: 'bess', capacity_mw: 250, storage_mwh: 1000, state: 'NSW', location: 'Blackmans Flat', project_id: 'mt-piper-bess' },
    { name: 'Deer Park BESS', developer: 'Akaysha Energy', technology: 'bess', capacity_mw: 275, storage_mwh: 1100, state: 'VIC', location: 'Ravenhall', project_id: 'deer-park-bess-akaysha' },
    { name: 'Joel Joel BESS', developer: 'ACEnergy', technology: 'bess', capacity_mw: 250, storage_mwh: 1000, state: 'VIC', location: 'Joel Joel', project_id: 'joel-joel-bess' },
    { name: 'Kiamal BESS', developer: 'TotalEnergies', technology: 'bess', capacity_mw: 220, storage_mwh: 810, state: 'VIC', location: 'Ouyen', project_id: 'kiamal-bess' },
    { name: 'Little River BESS', developer: 'ACEnergy', technology: 'bess', capacity_mw: 350, storage_mwh: 1400, state: 'VIC', location: 'Little River', project_id: 'little-river-bess' },
    { name: 'Mornington BESS', developer: 'Valent Energy', technology: 'bess', capacity_mw: 240, storage_mwh: 587, state: 'VIC', location: 'Tyabb', project_id: 'mornington-bess' },
    { name: 'Capricorn BESS', developer: 'Potentia Energy', technology: 'bess', capacity_mw: 300, storage_mwh: 1200, state: 'QLD', location: 'Bouldercombe', project_id: 'capricorn-bess' },
    { name: 'Lower Wonga BESS', developer: 'Equis', technology: 'bess', capacity_mw: 200, storage_mwh: 800, state: 'QLD', location: 'Lower Wonga', project_id: 'lower-wonga-bess' },
    { name: 'Teebar BESS', developer: 'Atmos Renewables', technology: 'bess', capacity_mw: 400, storage_mwh: 1600, state: 'QLD', location: 'Gigoomgan', project_id: 'teebar-creek-battery-storage-kci' },
    { name: 'Ulinda Park Expansion', developer: 'Akaysha Energy', technology: 'bess', capacity_mw: 195, storage_mwh: 780, state: 'QLD', location: 'Hopeland', project_id: 'ulinda-park-bess-expansion' },
    { name: 'Koolunga BESS', developer: 'Equis', technology: 'bess', capacity_mw: 200, storage_mwh: 800, state: 'SA', location: 'Koolunga', project_id: 'koolunga-battery-energy-storage-system' },
    { name: 'Reeves Plains BESS', developer: 'Alinta Energy', technology: 'bess', capacity_mw: 250, storage_mwh: 1000, state: 'SA', location: 'Reeves Plains', project_id: 'reeves-plains-power-station-bess' },
  ],
  'cis-tender-4-nem-gen': [
    { name: 'Bell Bay Wind Farm', developer: 'Equis', technology: 'wind', capacity_mw: 224, state: 'TAS', project_id: undefined },
    { name: 'Bendemeer Energy Hub', developer: 'Athena Energy Australia', technology: 'hybrid', capacity_mw: 252, storage_mwh: 300, state: 'NSW', project_id: 'bendemeer-renewable-energy-hub-solar-and-bess' },
    { name: 'Bundey BESS and Solar', developer: 'Genaspi Energy Group', technology: 'hybrid', capacity_mw: 240, storage_mwh: 1200, state: 'SA', project_id: 'bundey-bess-and-solar-project' },
    { name: 'Carmody\'s Hill Wind Farm', developer: 'Aula Energy', technology: 'wind', capacity_mw: 247, state: 'SA', project_id: 'carmodys-hill-wind-farm' },
    { name: 'Corop Solar Farm and BESS', developer: 'BNRG Leeson', technology: 'hybrid', capacity_mw: 230, storage_mwh: 704, state: 'VIC', project_id: 'corop-solar-farm' },
    { name: 'Derby Solar Project', developer: 'Sungrow', technology: 'hybrid', capacity_mw: 95, storage_mwh: 210, state: 'VIC', project_id: 'derby-solar-farm-and-bess' },
    { name: 'Dinawan Wind Farm Stage 1', developer: 'Spark Renewables', technology: 'wind', capacity_mw: 357, state: 'NSW', project_id: 'dinawan-energy-hub' },
    { name: 'Gawara Baya', developer: 'Windlab', technology: 'hybrid', capacity_mw: 399, storage_mwh: 217, state: 'QLD', project_id: 'gawara-baya-wind-and-bess' },
    { name: 'Guthrie\'s Gap Solar Power Station', developer: 'Edify Energy', technology: 'hybrid', capacity_mw: 300, storage_mwh: 1200, state: 'QLD', project_id: 'guthries-gap-solar-power-station' },
    { name: 'Hexham Wind Farm', developer: 'AGL', technology: 'wind', capacity_mw: 600, state: 'VIC', project_id: 'hexham' },
    { name: 'Liverpool Range Wind Stage 1', developer: 'Tilt Renewables', technology: 'wind', capacity_mw: 634, state: 'NSW', project_id: 'liverpool-range-wind-farm' },
    { name: 'Lower Wonga Solar Farm', developer: 'Lightsource bp', technology: 'solar', capacity_mw: 281, state: 'QLD', project_id: 'lower-wonga-solar-farm-and-bess' },
    { name: 'Merino Solar Farm', developer: 'EDPR', technology: 'hybrid', capacity_mw: 450, storage_mwh: 1800, state: 'NSW', project_id: 'merino-solar-farm' },
    { name: 'Middlebrook Solar Farm', developer: 'TotalEnergies', technology: 'hybrid', capacity_mw: 363, storage_mwh: 813, state: 'NSW', project_id: 'middlebrook-solar-and-bess' },
    { name: 'Moah Creek Wind Farm', developer: 'Central Queensland Power', technology: 'wind', capacity_mw: 360, state: 'QLD', project_id: 'moah-creek-wind-farm' },
    { name: 'Nowingi Solar Power Station', developer: 'Edify Energy', technology: 'hybrid', capacity_mw: 300, storage_mwh: 1200, state: 'VIC', project_id: 'nowingi-solar-farm-edify-kci' },
    { name: 'Punchs Creek Solar Farm', developer: 'EDPR', technology: 'hybrid', capacity_mw: 400, storage_mwh: 1600, state: 'QLD' },
    { name: 'Smoky Creek Solar Power Station', developer: 'Edify Energy', technology: 'hybrid', capacity_mw: 300, storage_mwh: 1200, state: 'QLD', project_id: 'smoky-creek-solar-power-station' },
    { name: 'Tallawang Solar Hybrid', developer: 'Potentia Energy', technology: 'hybrid', capacity_mw: 500, storage_mwh: 1000, state: 'NSW', project_id: 'tallawang-solar-and-bess' },
    { name: 'Willogoleche 2 Wind Farm', developer: 'ENGIE / Foresight', technology: 'wind', capacity_mw: 108, state: 'SA', project_id: 'willogoleche-2-wind-farm' },
  ],
  'cis-tender-7-nem-gen': [
    // NSW (9 projects — 3 wind / 1 wind+BESS hybrid / 1 solar / 4 solar+BESS hybrid).
    // Updated 2026-05-25 with full DCCEEW media-release detail.
    { name: 'Yanco Delta Wind Farm', developer: 'Origin Energy', technology: 'wind', capacity_mw: 1498, state: 'NSW', location: 'South-West REZ — Jerilderie', project_id: 'yanco-delta-wind-farm', notes: 'Biggest single wind project in Australia. Origin\'s first new renewable since announcing Eraring closure. SW REZ grid access secured 2025 (full 1,460 MW). Targeting FID mid-FY27.' },
    { name: 'Birriwa Solar Farm', developer: 'ACEN Australia', technology: 'hybrid', capacity_mw: 600, storage_mwh: 2400, state: 'NSW', location: 'Central West Orana REZ', project_id: 'birriwa-solar-farm', notes: 'Largest solar+BESS hybrid awarded in T7.' },
    { name: 'Baldin / Baldon Stage 2', developer: 'Goldwind / Omni', technology: 'hybrid', capacity_mw: 346, storage_mwh: 132, state: 'NSW', location: 'South-West REZ — Hay Plains', project_id: 'baldon-wind-farm-stage-2', notes: '346 MW wind paired with 132 MWh battery. Response to Submissions lodged with DPHI May 2025; awaiting Independent Planning Commission determination.' },
    { name: 'Gundary Solar Hybrid', developer: 'Lightsource bp', technology: 'hybrid', capacity_mw: 320, storage_mwh: 1391, state: 'NSW', project_id: 'gundary-solar-farm-and-bess', notes: 'Solar+BESS hybrid. DB has Gundary Solar Farm and BESS at 300 MW + separate standalone Gundary BESS at 400 MW; T7 covers the integrated 320 MW + 1,391 MWh package.' },
    { name: 'Bullewah / Bullawah Stage 1', developer: 'BayWa r.e.', technology: 'wind', capacity_mw: 300, state: 'NSW', location: 'South-West REZ — south of Hay', project_id: 'bullawah-wind-farm-stage-1', notes: 'Wind-only — DCCEEW awarded 300 MW. Full proposed project ~804 MW (Stages 1 + 2). Stage 1 still planning_submitted.' },
    { name: 'Dinawan Solar Hybrid', developer: 'Spark Renewables', technology: 'hybrid', capacity_mw: 300, storage_mwh: 1200, state: 'NSW', location: 'South-West REZ', project_id: 'dinawan-energy-hub', notes: 'Solar+BESS component of the Dinawan Energy Hub. Separate from the 357 MW Dinawan Stage 1 wind CIS T4 win. Hub\'s solar+BESS approved Apr 2026; wind still awaiting IPC.' },
    { name: 'Gunning Solar Farm Hybrid', developer: 'Zero-E / Grupo Cobra', technology: 'hybrid', capacity_mw: 290, storage_mwh: 542, state: 'NSW', location: 'Lade Vale', notes: 'New project — not yet in AURES DB (Gunning Wind Farm 46 MW is a separate operating asset). Spanish construction conglomerate Grupo Cobra via Zero-E subsidiary.' },
    { name: 'Wattle Creek Solar Hybrid', developer: 'Spark Renewables', technology: 'hybrid', capacity_mw: 180, storage_mwh: 720, state: 'NSW', project_id: 'wattle-creek-energy-hub-solar-bess', notes: 'Solar+BESS component of the Wattle Creek Energy Hub (separate from the 350 MW standalone BESS).' },
    { name: 'Kayuga Solar Farm and BESS', developer: 'European Energy Australia', technology: 'solar', capacity_mw: 85, state: 'NSW', location: 'Kayuga', notes: 'New project — not yet in AURES DB. DCCEEW announcement labels as solar only (no BESS MWh disclosed despite the "and BESS" in project name).' },
    // QLD (5 projects — 2 wind / 1 wind+BESS hybrid / 1 solar / 1 solar+BESS hybrid)
    { name: 'Bungaban Wind Energy Project', developer: 'Windlab', technology: 'hybrid', capacity_mw: 1150, storage_mwh: 1400, state: 'QLD', project_id: 'bungaban-wind-farm', notes: '1,150 MW wind + 1,400 MWh battery. Long-term PPA with Rio Tinto for smelter/refinery power.' },
    { name: 'Theodore Wind Farm', developer: 'Theodore Energy Development', technology: 'wind', capacity_mw: 1022, state: 'QLD', project_id: 'theodore-wind-farm', notes: 'Previously threatened by QLD LNP government. Now backed by a dedicated Theodore Energy Development SPV.' },
    { name: 'Banana Range Wind Farm', developer: 'EDF Power Solutions', technology: 'wind', capacity_mw: 228, state: 'QLD', project_id: 'banana-range-wind-farm', notes: 'EDF Renewables\' second T7 win alongside Whyte Yarcowie (SA).' },
    { name: 'Moranbah Solar Farm', developer: 'Zero-E / Grupo Cobra', technology: 'hybrid', capacity_mw: 171, storage_mwh: 100, state: 'QLD', notes: 'New project — not yet in AURES DB. Grupo Cobra\'s second T7 win (with Gunning Solar Hybrid NSW). Small BESS (100 MWh) relative to gen size — primarily firming the solar shape.' },
    { name: 'Bullyard Solar Farm', developer: 'European Energy Australia', technology: 'solar', capacity_mw: 97, state: 'QLD', project_id: 'bullyard-solar-farm', notes: 'European Energy Australia\'s second T7 win alongside Kayuga (NSW).' },
    // TAS (2 projects — 1 wind / 1 solar)
    { name: 'Cellars Hill Wind Farm', developer: 'Gamuda Renewables / Alternate Path', technology: 'wind', capacity_mw: 341, state: 'TAS', notes: 'New project — not yet in AURES DB. Gamuda + Alternate Path JV; sister project to Weasel Solar.' },
    { name: 'Weasel Solar Farm', developer: 'Gamuda Renewables / Alternate Path', technology: 'solar', capacity_mw: 200, state: 'TAS', project_id: 'weasel-solar-farm-and-bess-kci', notes: 'Unusual: major solar farm on Tasmanian central highlands. DCCEEW announcement labels as solar only; DB has it as Weasel Solar + BESS.' },
    // SA (1 project)
    { name: 'Whyte Yarcowie Wind Farm', developer: 'EDF Power Solutions', technology: 'wind', capacity_mw: 289, state: 'SA', project_id: 'whyte-yarcowie', notes: 'SA\'s only T7 winner. EDF\'s first of two T7 wins (Banana Range QLD the other).' },
    // VIC (2 projects — both wind)
    { name: 'Willatook Wind Farm', developer: 'ENGIE', technology: 'wind', capacity_mw: 338, state: 'VIC', project_id: 'willatook', notes: 'Victoria sought only wind projects in T7. DB has full project = 450 MW.' },
    { name: 'Woolsthorpe Wind Farm', developer: 'ICA Partners', technology: 'wind', capacity_mw: 72, state: 'VIC', project_id: 'woolsthorpe-wind-farm', notes: 'Mexican construction conglomerate ICA Partners — smallest T7 winner.' },
  ],
}

// ============================================================
// LTESA ROUNDS
// ============================================================

export const LTESA_ROUNDS: LTESARound[] = [
  {
    id: 'ltesa-round-1',
    name: 'LTESA Round 1 — Generation + LDS',
    type: 'mixed',
    announced_date: '2023-05-03',
    total_capacity_mw: 1445,
    total_storage_mwh: 400,
    num_projects: 4,
    project_ids: [],
    description: 'First LTESA round under the NSW Electricity Infrastructure Roadmap. Four projects worth $2.5B delivering 1.4 GW of generation plus Australia\'s first long-duration chemical battery. Strike prices ~40% below LCOE — amongst the lowest in any Australian tender.',
    sources: [
      { title: 'ASL — Tender Round 1', url: 'https://asl.org.au/en/tenders/tender-round-1', source_tier: 1 },
      { title: 'First round puts NSW one-third to 12GW goal', url: 'https://www.nsw.gov.au/media-releases/first-round-of-renewable-energy-projects-puts-nsw-one-third-of-way-to-12-gigawatt-renewable-energy-goal', date: '2023-05-01', source_tier: 1 },
    ],
  },
  {
    id: 'ltesa-round-2',
    name: 'LTESA Round 2 — Firming',
    type: 'firming',
    announced_date: '2023-11-22',
    total_capacity_mw: 1075,
    total_storage_mwh: 2790,
    num_projects: 4,
    project_ids: [],
    description: 'Firming-focused tender delivering 1,075 MW of dispatchable capacity including three BESS projects and one virtual power plant portfolio. Capacity to supply 8% of NSW summer peak demand. $1.8B total investment supporting ~400 jobs. All projects operational by December 2025.',
    sources: [
      { title: 'NSW tender for firming capacity exceeds expectations (ASL)', url: 'https://aemoservices.com.au/en/news/media-release/231122-nsw-tender-for-firming-capacity-exceeds-expectations', date: '2023-11-22', source_tier: 1 },
      { title: '2,800 MWh battery projects win NSW firming tender (Energy Storage News)', url: 'https://www.energy-storage.news/2800mwh-of-battery-storage-projects-win-new-south-wales-firming-infrastructure-tender/', date: '2023-11-22', source_tier: 2 },
    ],
  },
  {
    id: 'ltesa-round-3',
    name: 'LTESA Round 3 — Generation + LDS',
    type: 'mixed',
    announced_date: '2023-12-19',
    total_capacity_mw: 1274,
    total_storage_mwh: 4192,
    num_projects: 5,
    project_ids: [],
    description: 'Five energy infrastructure projects selected: 750 MW renewable generation and 524 MW / 4,192 MWh long-duration storage. Included one solar, one wind, two li-ion BESS, and one advanced compressed air energy storage (A-CAES) project. Over $4.2B total investment.',
    sources: [
      { title: 'ASL — Tender Round 3', url: 'https://aemoservices.com.au/en/tenders/tender-round-3-generation-and-long-duration-storage', source_tier: 1 },
    ],
  },
  {
    id: 'ltesa-round-4',
    name: 'LTESA Round 4 — Generation',
    type: 'generation',
    announced_date: '2024-07-01',
    total_capacity_mw: 317,
    total_storage_mwh: 372,
    num_projects: 2,
    project_ids: [],
    description: 'Two projects covering 33% of the 1,150 MW target — only bids demonstrating sufficient merit for NSW customers were awarded. Includes one solar+BESS hybrid and one wind farm. Operational before 2028. 630+ jobs over lifetime.',
    sources: [
      { title: 'ASL — Tender Round 4 Generation', url: 'https://aemoservices.com.au/en/tenders/tender-round-4-generation-infrastructure', source_tier: 1 },
      { title: 'Maryvale solar and storage lands NSW tender support (PV Magazine)', url: 'https://www.pv-magazine-australia.com/2024/07/01/maryvale-solar-and-storage-project-lands-support-in-nsw-tender-round/', date: '2024-07-01', source_tier: 2 },
    ],
  },
  {
    id: 'ltesa-round-5',
    name: 'LTESA Round 5 — Long Duration Storage',
    type: 'lds',
    announced_date: '2025-02-27',
    total_capacity_mw: 1025,
    total_storage_mwh: 13790,
    num_projects: 3,
    project_ids: [],
    description: 'Largest long-duration storage tender to date. Two batteries and the first-ever pumped hydro LTESA (Phoenix, 800 MW / 12 GWh, 15h discharge). Combined 1.03 GW / 13.79 GWh — exceeding the 1 GW target. Contributes 40% toward the 2030 2 GW LDS minimum objective.',
    sources: [
      { title: 'ASL NSW Long Duration Storage tender awards more than 1GW and 13GWh', url: 'https://asl.org.au/news/media-release/250227-asl-nsw-long-duration-storage-tender-awards-more-than-1gw-and-13gwh', date: '2025-02-27', source_tier: 1 },
      { title: 'Two BESS, one pumped hydro project awarded in NSW (ESS News)', url: 'https://www.ess-news.com/2025/02/27/two-bess-one-pumped-hydro-project-awarded-in-nsw-long-duration-storage-tender/', date: '2025-02-27', source_tier: 2 },
    ],
  },
  {
    id: 'ltesa-round-6',
    name: 'LTESA Round 6 — Long Duration Storage',
    type: 'lds',
    announced_date: '2026-02-05',
    total_capacity_mw: 1171,
    total_storage_mwh: 11980,
    num_projects: 6,
    project_ids: [],
    description: 'Australia\'s largest long-duration energy storage tender. Six battery projects totalling 1.17 GW / 11.98 GWh. 117% of the 1 GW indicative target. Storage durations 8.7 to 11.5 hours. Average cap price ~$150k/MW/year — significant reduction from Round 5 (~$185k/MW/year).',
    sources: [
      { title: 'ASL — Tender Round 6 LDS LTESA', url: 'https://asl.org.au/tenders/tender-round-6-long-duration-storage-ltesa', source_tier: 1 },
      { title: 'NSW contracts six battery projects (Energy Storage News)', url: 'https://www.energy-storage.news/australias-biggest-ldes-tender-nsw-contracts-six-battery-storage-projects-totalling-1-17gw-12gwh/', date: '2026-02-05', source_tier: 2 },
    ],
  },
  {
    id: 'ltesa-round-7',
    name: 'LTESA Round 7 — Firming Supply & Demand Response',
    type: 'firming',
    announced_date: '2026-05-15',
    total_capacity_mw: 532,
    total_storage_mwh: 2000,
    num_projects: 2,
    project_ids: [],
    description: 'Second NSW Roadmap firming tender (the first since Tender 2 in late 2023). Two winners across a competitive field of roughly a dozen bids: AGL\'s 500 MW / 2,000 MWh Tomago Battery near Newcastle and Enel X\'s 32 MW Sydney/Newcastle business-customer Virtual Power Plant. Both projects contract to deliver firming services during LOR 2 and LOR 3 reliability events. Commissioning deadline end-November 2027. Average strike materially lower than Tender 2 — battery cost declines mean AGL doubled the storage at Tomago for roughly the same cost as the 500 MW / 1,000 MWh Liddell battery awarded in Tender 2.',
    sources: [
      { title: 'ASL — Tender Round 7 (Firming)', url: 'https://asl.org.au/tenders', source_tier: 1 },
      { title: 'Tomago battery and VPP win first firming tender (RenewEconomy)', url: 'https://reneweconomy.com.au/giant-tomago-battery-and-vpp-win-first-firming-tender-to-fill-gaps-in-supply/', date: '2026-05-15', source_tier: 2 },
      { title: 'Fluence and AGL — 500 MW / 2,000 MWh Tomago BESS', url: 'https://ir.fluenceenergy.com/news-releases/news-release-details/fluence-and-agl-sign-deal-deliver-500-mw-2000-mwh-tomago-battery', source_tier: 2 },
    ],
  },
]

export const LTESA_PROJECTS: Record<string, SchemeProject[]> = {
  'ltesa-round-1': [
    { name: 'New England Solar Farm', developer: 'ACEN Australia', technology: 'solar', capacity_mw: 720, state: 'NSW', location: 'New England REZ', project_id: 'new-england-solar-farm' },
    { name: 'Stubbo Solar Farm', developer: 'ACEN Australia', technology: 'solar', capacity_mw: 400, state: 'NSW', location: 'Central West Orana REZ', project_id: 'stubbo-solar-farm' },
    { name: 'Coppabella Wind Farm', developer: 'Goldwind Australia', technology: 'wind', capacity_mw: 275, state: 'NSW', location: 'Southern Tablelands', project_id: 'coppabella-wind-farm' },
    { name: 'Limondale BESS', developer: 'RWE Renewables Australia', technology: 'bess', capacity_mw: 50, storage_mwh: 400, state: 'NSW', location: 'South West REZ', project_id: 'limondale-bess' },
  ],
  'ltesa-round-2': [
    // Note: Liddell BESS (500 MW), Orana, Smithfield and VPPs are listed under cis-pilot-nsw — these were one combined round
    { name: 'Orana BESS', developer: 'Akaysha Energy', technology: 'bess', capacity_mw: 415, storage_mwh: 1660, state: 'NSW', location: 'Central West Orana REZ', project_id: 'orana-bess' },
    { name: 'Enel X VPP Portfolio', developer: 'Enel X Australia', technology: 'vpp', capacity_mw: 95, state: 'NSW' },
    { name: 'Smithfield BESS', developer: 'Iberdrola', technology: 'bess', capacity_mw: 65, storage_mwh: 130, state: 'NSW', location: 'Smithfield', project_id: 'smithfield-bess' },
  ],
  'ltesa-round-3': [
    { name: 'Uungula Wind Farm', developer: 'Squadron Energy', technology: 'wind', capacity_mw: 400, state: 'NSW', location: 'Central West Orana REZ', project_id: 'uungula-wind-farm' },
    { name: 'Culcairn Solar Farm', developer: 'Neoen', technology: 'solar', capacity_mw: 350, state: 'NSW', location: 'South West Slopes', project_id: 'culcairn-solar-farm' },
    { name: 'Richmond Valley BESS', developer: 'Ark Energy', technology: 'bess', capacity_mw: 275, storage_mwh: 2200, state: 'NSW', location: 'Richmond Valley', project_id: 'richmond-valley-bess' },
    { name: 'Silver City Energy Storage Centre', developer: 'Hydrostor', technology: 'bess', capacity_mw: 200, storage_mwh: 1600, state: 'NSW', location: 'Broken Hill', project_id: 'silver-city-energy-storage' },
    { name: 'Goulburn River BESS', developer: 'Lightsource bp', technology: 'bess', capacity_mw: 49, storage_mwh: 392, state: 'NSW', location: 'Goulburn River', project_id: 'goulburn-river-bess' },
  ],
  'ltesa-round-4': [
    { name: 'Maryvale Solar + BESS', developer: 'Unknown', technology: 'hybrid', capacity_mw: 172, storage_mwh: 372, state: 'NSW', project_id: 'maryvale-solar-and-energy-storage-system' },
    { name: 'Flyers Creek Wind Farm', developer: 'Unknown', technology: 'wind', capacity_mw: 145, state: 'NSW', project_id: 'flyers-creek-wind-farm' },
  ],
  'ltesa-round-5': [
    { name: 'Phoenix Pumped Hydro', developer: 'ACEN Australia', technology: 'pumped_hydro', capacity_mw: 800, storage_mwh: 11990, state: 'NSW', location: 'Lake Burrendong, Central West Orana REZ', project_id: 'phoenix-pumped-hydro-project' },
    { name: 'Stoney Creek BESS', developer: 'Enervest Utility', technology: 'bess', capacity_mw: 125, storage_mwh: 1000, state: 'NSW', location: 'Narrabri, New England REZ', project_id: 'stoney-creek-bess' },
    { name: 'Griffith BESS', developer: 'Eku Energy', technology: 'bess', capacity_mw: 100, storage_mwh: 800, state: 'NSW', location: 'Yoogali, Riverina', project_id: 'griffith-bess' },
  ],
  'ltesa-round-6': [
    { name: 'Great Western Battery', developer: 'Neoen Australia', technology: 'bess', capacity_mw: 330, storage_mwh: 3500, state: 'NSW', project_id: 'great-western-battery-project' },
    { name: 'Bowmans Creek BESS', developer: 'Ark Energy', technology: 'bess', capacity_mw: 250, storage_mwh: 2414, state: 'NSW', project_id: 'bowmans-creek-bess' },
    { name: 'Bannaby BESS', developer: 'BW ESS', technology: 'bess', capacity_mw: 233, storage_mwh: 2676, state: 'NSW', project_id: 'bannaby-bess' },
    { name: 'Armidale East BESS', developer: 'Unknown', technology: 'bess', capacity_mw: 158, storage_mwh: 1440, state: 'NSW', project_id: 'armidale-east-bess' },
    { name: 'Ebor BESS', developer: 'Energy Vault / Bridge Energy', technology: 'bess', capacity_mw: 100, storage_mwh: 870, state: 'NSW', project_id: 'ebor-bess' },
    { name: 'Kingswood BESS', developer: 'Iberdrola Australia', technology: 'bess', capacity_mw: 100, storage_mwh: 1080, state: 'NSW', project_id: 'kingswood-bess' },
  ],
  'ltesa-round-7': [
    { name: 'Tomago Battery', developer: 'AGL Energy', technology: 'bess', capacity_mw: 500, storage_mwh: 2000, state: 'NSW', location: 'Tomago (near Newcastle)', project_id: 'tomago-battery' },
    { name: 'Sydney / Newcastle VPP', developer: 'Enel X Australia', technology: 'vpp', capacity_mw: 32, state: 'NSW', location: 'Sydney + Newcastle (business customers)' },
  ],
}

// ============================================================
// UPCOMING LTESA — NSW Generation Tender (Q2 2026)
// ============================================================
//
// The next NSW Roadmap Generation LTESA round opens Q2 2026 with a 2.5 GW target.
// It is specially designed for solar+BESS hybrids (battery ≤ solar/wind capacity,
// minimum 4-hour storage). Two further long-duration storage tenders are scheduled
// (Q2 2026 + 2027). This round is the only realistic path remaining for NSW wind
// projects that did not win CIS Tender 7 — NSW is excluded from the next federal
// CIS generation round (Tender 9).
//
// `LTESA_R8_CANDIDATES` lists known NSW wind candidates with a qualitative
// High/Medium/Low probability assessment per Travis's directive. Rationales cite
// planning maturity, hybridisation fit, REZ access, developer execution, size fit.

export type LtesaProbabilityBand = 'high' | 'medium' | 'low'

export interface LtesaCandidate {
  project_id: string
  name: string
  developer: string
  capacity_mw: number
  technology: 'wind' | 'hybrid'         // wind-alone vs wind+BESS hybrid
  rez?: string                          // 'south-west' | 'central-west-orana' | etc.
  rez_access_mw?: number                // Awarded REZ grid-access right (where known)
  planning_stage: 'approved' | 'ipc_pending' | 'submitted' | 'pre_planning'
  probability: LtesaProbabilityBand
  rationale: string                     // 2–3 sentence assessment, sourced where possible
  flags?: string[]                      // Optional: ['wind-alone', 'staged', 'mega-scale']
  /** YYYY-MM-DD or YYYY-MM. From projects.cod_current or AURES estimate where DB is null. */
  cod_expected?: string
  /** 'db' (from projects.cod_current) | 'aures-estimate' (derived from planning stage + typical 4-5yr build). */
  cod_basis?: 'db' | 'aures-estimate'
}

export const LTESA_R8_CANDIDATES: LtesaCandidate[] = [
  // ----- HIGH likelihood -----
  {
    project_id: 'pottinger-energy-park-wind-kci',
    name: 'Pottinger Energy Park (Wind)',
    developer: 'Someva Renewables / AGL Energy',
    capacity_mw: 1300,
    technology: 'hybrid',
    rez: 'south-west',
    planning_stage: 'submitted',
    probability: 'high',
    rationale: 'Wind+BESS hybrid in the SW REZ — exactly the configuration the Q2 2026 round was designed for. Pottinger is the only SW REZ access-rights holder that missed a CIS T7 underwriting, so AGL has explicit motivation to bid LTESA. Planning still in DPHI submission, but a Roadmap LTESA can be awarded conditional on approval.',
    flags: ['hybrid'],
    cod_expected: '2031-12',
    cod_basis: 'aures-estimate'
  },
  {
    project_id: 'bookham-wf-and-bess',
    name: 'Bookham Wind Farm + BESS',
    developer: 'Bookham Wind',
    capacity_mw: 1160,
    technology: 'hybrid',
    planning_stage: 'submitted',
    probability: 'high',
    rationale: 'Wind+BESS hybrid sized close to round\'s typical award envelope. Hybrid configuration scores well under the new ≤-solar/wind battery, min-4hr-storage rules. Main risk is planning maturity.',
    flags: ['hybrid'],
    cod_expected: '2032-01',
    cod_basis: 'db'
  },
  {
    project_id: 'hargraves-energy-project-wind-solar-and-bess',
    name: 'Hargraves (Wind + Solar + BESS)',
    developer: 'Energy Estate',
    capacity_mw: 900,
    technology: 'hybrid',
    planning_stage: 'submitted',
    probability: 'high',
    rationale: 'Tri-tech hybrid (wind + solar + BESS) — strongest configuration for a hybrid-favoured round. Energy Estate has executed prior NSW projects. Planning submission progress and grid connection status are the swing factors.',
    flags: ['hybrid'],
    cod_expected: '2031-06',
    cod_basis: 'aures-estimate'
  },
  // ----- MEDIUM likelihood -----
  {
    project_id: 'liverpool-range-wind-farm',
    name: 'Liverpool Range — Stage 2',
    developer: 'Tilt Renewables',
    capacity_mw: 700,
    technology: 'wind',
    rez: 'central-west-orana',
    planning_stage: 'approved',
    probability: 'medium',
    rationale: 'Stage 1 (634 MW) won CIS T4 and is EPBC-approved. Stage 2 is wind-alone in a round explicitly engineered to favour hybrids — that\'s a structural penalty. Mature developer with a proven LTESA track record (Palmer) and CWO REZ position offset some of the disadvantage.',
    flags: ['wind-alone', 'staged'],
    cod_expected: '2030-06',
    cod_basis: 'aures-estimate'
  },
  {
    project_id: 'bullawah-wind-farm-stage-2',
    name: 'Bullawah Wind Farm — Stage 2',
    developer: 'BayWa r.e.',
    capacity_mw: 276,
    technology: 'wind',
    rez: 'south-west',
    planning_stage: 'submitted',
    probability: 'medium',
    rationale: 'Stage 1 (283 MW) just won CIS T7 — BayWa now has SW REZ momentum. Stage 2 is wind-alone in a hybrid-favoured round; smaller scale (276 MW) helps fit into the 2.5 GW envelope. Awaiting Stage 1 IPC outcome will likely gate Stage 2 timing.',
    flags: ['wind-alone', 'staged'],
    cod_expected: '2029-02',
    cod_basis: 'db'
  },
  {
    project_id: 'the-plains',
    name: 'The Plains',
    developer: 'Engie',
    capacity_mw: 2030,
    technology: 'wind',
    planning_stage: 'submitted',
    probability: 'medium',
    rationale: 'Mega-scale wind farm (2 GW+) competing with hybrids on cost. Engie\'s execution credentials are good (Goyder North, Hexham, Willatook T7). Size is the main risk — at 2 GW it consumes most of a 2.5 GW round on its own, so likely a partial award or carve-out at best.',
    flags: ['wind-alone', 'mega-scale'],
    cod_expected: '2030-12',
    cod_basis: 'aures-estimate'
  },
  {
    project_id: 'skye-ridge-wind-farm',
    name: 'Skye Ridge',
    developer: 'Origin Energy',
    capacity_mw: 1300,
    technology: 'wind',
    planning_stage: 'submitted',
    probability: 'medium',
    rationale: 'Origin already won the headline T7 prize (Yanco Delta 1,450 MW) — strategic priority for further wind underwriting may have shifted. Wind-alone in a hybrid-favoured round. Origin\'s Eraring-replacement narrative remains a tailwind.',
    flags: ['wind-alone'],
    cod_expected: '2031-11',
    cod_basis: 'db'
  },
  {
    project_id: 'lake-victoria-energy-park-kci',
    name: 'Lake Victoria Energy Park',
    developer: 'Lake Victoria Wind',
    capacity_mw: 1200,
    technology: 'wind',
    planning_stage: 'submitted',
    probability: 'medium',
    rationale: 'Large wind project but less mature developer track record than majors. EPBC-submitted is mid-pack planning maturity. Wind-alone penalty applies.',
    flags: ['wind-alone'],
    cod_expected: '2030-06',
    cod_basis: 'aures-estimate'
  },
  {
    project_id: 'winterbourne-wind-farm',
    name: 'Winterbourne',
    developer: 'Vestas / CWP Renewables',
    capacity_mw: 732,
    technology: 'wind',
    planning_stage: 'submitted',
    probability: 'medium',
    rationale: 'Mid-scale wind that fits 2.5 GW round arithmetic well. New England region has limited REZ network capacity that could constrain timing. Wind-alone in hybrid-favoured round.',
    flags: ['wind-alone'],
    cod_expected: '2030-12',
    cod_basis: 'aures-estimate'
  },
  // ----- LOW likelihood -----
  {
    project_id: 'bendenine',
    name: 'Bendenine',
    developer: 'Wind Prospect',
    capacity_mw: 720,
    technology: 'wind',
    planning_stage: 'submitted',
    probability: 'low',
    rationale: 'Wind-alone, smaller developer, early-mid planning stage. Less likely to beat better-positioned hybrids on price or readiness.',
    flags: ['wind-alone'],
    cod_expected: '2030-07',
    cod_basis: 'db'
  },
  {
    project_id: 'hills-of-gold-wind-farm',
    name: 'Hills of Gold',
    developer: 'Engie',
    capacity_mw: 420,
    technology: 'wind',
    planning_stage: 'submitted',
    probability: 'low',
    rationale: 'Long-troubled planning history (multiple modifications, community opposition). Wind-alone in hybrid-favoured round. Engie\'s focus likely shifts to Willatook (VIC T7 winner) and The Plains.',
    flags: ['wind-alone'],
    cod_expected: '2029-12',
    cod_basis: 'db'
  },
  {
    project_id: 'piambong-wind-farm-kci',
    name: 'Piambong',
    developer: 'Wind Energy Partners',
    capacity_mw: 583,
    technology: 'wind',
    planning_stage: 'pre_planning',
    probability: 'low',
    rationale: 'Early planning stage — too immature for a Q2 2026 LTESA award.',
    flags: ['wind-alone'],
    cod_expected: '2028-12',
    cod_basis: 'db'
  },
]

// ============================================================
// NSW WIND CIS/LTESA COHORT — cross-cohort detail for the deep-dive tab
// ============================================================
//
// Single source of truth for the Section 2 cohort table on the NSW Wind tab.
// Capacities here are "scheme-awarded MW" — for the project's full nameplate,
// join to projects.capacity_mw via project_id.

export type CohortScheme = 'CIS T1' | 'CIS T4' | 'CIS T7' | 'LTESA R1' | 'LTESA R3' | 'LTESA R4'

export type ExecutionRisk = 'on_track' | 'watch' | 'stalled'

export type FidStatus = 'reached' | 'expected' | 'pending'

/**
 * Connection / commitment stage normalized from AEMO Generator Information `status`
 * plus project-specific TransGrid / EnergyCo updates from news + EIS docs.
 *
 *   - 'operating'          : In Service per AEMO Gen Info
 *   - 'commissioning'      : In Commissioning (between R1/R2 hold points)
 *   - 'committed'          : AEMO "Committed" — meets ≥5 of 6 commitment criteria
 *                            (land · planning · finance · EPC · 5.3.4 enquiry · GPS)
 *   - 'gps_assessment'     : REZ access right + 5.3.4 enquiry submitted, GPS
 *                            (Generator Performance Standards) assessment underway
 *                            with NSP + AEMO — pre-FID engineering
 *   - 'anticipated'        : AEMO "Anticipated" — partial commitment criteria met
 *   - 'connection_enquiry' : 5.3.4 connection enquiry lodged with TransGrid /
 *                            NSP, but limited public detail on progress
 *   - 'proposed'           : AEMO "Publicly Announced" — proposed only, no
 *                            commitment criteria recorded yet
 *   - 'at_risk'            : Material connection blocker (e.g. lost REZ access
 *                            right) makes commitment unlikely
 */
export type ConnectionStatus =
  | 'operating'
  | 'commissioning'
  | 'committed'
  | 'gps_assessment'
  | 'anticipated'
  | 'connection_enquiry'
  | 'proposed'
  | 'at_risk'

export interface NSWWindCohortEntry {
  project_id: string
  name: string
  proponent: string
  scheme: CohortScheme
  awarded_mw: number
  total_mw: number              // Full project nameplate (DB or proposed)
  technology: 'wind' | 'hybrid' // wind alone vs wind+BESS hybrid
  stage_label: string           // 'Full project' | 'Stage 1' | 'Partial (REZ-access constrained)'
  rez?: string                  // Short label, e.g. 'South-West REZ', 'CWO REZ', 'New England'
  rez_access_mw?: number        // EnergyCo SW/CWO access right granted (where known)
  planning_status: 'Operating' | 'Commissioning' | 'Construction' | 'EPBC Approved' | 'EPBC Submitted' | 'Awaiting IPC' | 'Planning Submitted' | 'Early Stage'
  fid_expected?: string         // Free-text annotation (e.g. 'mid-FY27', 'achieved 2022') — surfaced in cohort table
  /**
   * Structured FID year for the Gantt-mode "FID → COD" view. Use:
   *  - 'reached' + year   : FID confirmed (year is the actual FID year — typically when construction started)
   *  - 'expected' + year  : AURES estimate based on planning maturity + scheme award timing. Conservative.
   *  - 'pending'          : Material uncertainty (e.g. pre-IPC, appeals, stalled). Year omitted.
   */
  fid_year?: number
  fid_status?: FidStatus
  /**
   * Connection / commitment stage. Sourced primarily from AEMO Generator
   * Information's `status` field (Operating / In Commissioning / Committed /
   * Anticipated / Publicly Announced), normalized into the ConnectionStatus
   * enum and refined with project-specific TransGrid / EnergyCo announcements
   * where public detail exists.
   */
  connection_status?: ConnectionStatus
  /** Free-text note explaining the connection status — surfaced as a tooltip. */
  connection_notes?: string
  cod_expected?: string         // From projects.cod_current where available
  turbine_oem?: string
  bop?: string
  /**
   * AURES editorial judgement on the *scheme contract* progressing toward execution:
   *  - 'on_track'  : tangible movement under the scheme (construction, operational, recent approvals, FID near).
   *  - 'watch'     : slow but not stalled — long gap since scheme award without FID, or live planning risk.
   *  - 'stalled'   : the **CISA / LTESA contract is more likely than not NOT to go ahead** — execution window
   *                  has effectively closed or material blockers (grid access, planning, etc.) make scheme
   *                  execution very unlikely. The underlying project may still proceed merchant (i.e. without
   *                  scheme support) — "stalled" refers to the scheme contract, not project viability.
   * Refresh as evidence changes. Not a forecast — a qualitative read.
   */
  execution_risk?: ExecutionRisk
  /** Short reason for the risk classification — surfaces as a tooltip / commentary line. */
  risk_rationale?: string
  notes?: string
}

export const NSW_WIND_COHORT: NSWWindCohortEntry[] = [
  // ----- CIS Tender 7 (announced 2026-05-23) -----
  {
    project_id: 'yanco-delta-wind-farm',
    name: 'Yanco Delta',
    proponent: 'Origin Energy',
    scheme: 'CIS T7',
    awarded_mw: 1498,
    total_mw: 1498,
    technology: 'wind',
    stage_label: 'Full project',
    rez: 'South-West REZ',
    rez_access_mw: 1460,
    planning_status: 'EPBC Approved',
    fid_expected: 'mid-FY27',
    fid_year: 2027,
    fid_status: 'expected',
    connection_status: 'gps_assessment',
    connection_notes: 'SW REZ access right secured Apr 2025 (full 1,460 MW). Connecting to TransGrid\'s Dinawan Substation (under construction, due Q1 2026). Origin progressing Generator Performance Standard (GPS) assessments with TransGrid + AEMO ahead of mid-FY27 FID. AEMO Gen Info status: Publicly Announced — likely to advance once GPS work completes.',
    cod_expected: '2029-12',
    execution_risk: 'on_track',
    risk_rationale: 'Approved at both state and federal level, SW REZ access secured, Origin guiding to FID mid-FY27. Modifications under way but no material blocker.',
    notes: 'Australia\'s biggest wind project. NSW consent Dec 2023, EPBC approval Feb 2024 (modifications underway). Origin acquired from Virya Energy. Project\'s 800 MWh battery sits outside CIS scope.',
  },
  {
    project_id: 'baldon-wind-farm-stage-2',
    name: 'Baldin (Baldon Stage 2)',
    proponent: 'Goldwind Australia',
    scheme: 'CIS T7',
    awarded_mw: 346,
    total_mw: 1040,
    technology: 'hybrid',
    stage_label: 'Stage 2 of Baldon Project',
    rez: 'South-West REZ',
    planning_status: 'Awaiting IPC',
    fid_status: 'pending',
    connection_status: 'proposed',
    connection_notes: 'AEMO Gen Info: Publicly Announced. Connection process gated on IPC planning determination; no 5.3.4 enquiry detail publicly disclosed.',
    execution_risk: 'watch',
    risk_rationale: 'Just won T7, but project is pre-approval (RTS lodged May 2025 still pending IPC). CISA execution gated on planning approval — too early to call stalled, but planning slippage is the obvious risk.',
    notes: 'Wind+BESS hybrid bid. Response to Submissions delivered May 2025; awaiting IPC determination.',
  },
  {
    project_id: 'bullawah-wind-farm-stage-1',
    name: 'Bullewah (Bullawah Stage 1)',
    proponent: 'BayWa r.e.',
    scheme: 'CIS T7',
    awarded_mw: 300,
    total_mw: 804,
    technology: 'wind',
    stage_label: 'Partial — REZ-access constrained',
    rez: 'South-West REZ',
    rez_access_mw: 283,
    planning_status: 'Planning Submitted',
    fid_status: 'pending',
    connection_status: 'connection_enquiry',
    connection_notes: 'SW REZ access right held (283 MW — sized to project Stage 1). AEMO Gen Info: Publicly Announced. Connection enquiry through TransGrid expected; substation route likely Dinawan or other SW REZ hub.',
    execution_risk: 'watch',
    risk_rationale: 'Just won T7, but still in development-approval phase — planning not yet granted. CISA execution depends on approval; small (283 MW) so should be tractable if approval lands on time.',
    notes: 'Awarded MW matches the 283 MW SW REZ access right held. Full ~804 MW project (Stage 1 + Stage 2 + additional turbines). Currently in development-approval phase.',
  },
  // ----- CIS Tender 4 (Oct 2025) -----
  {
    project_id: 'dinawan-energy-hub',
    name: 'Dinawan Wind — Stage 1',
    proponent: 'Spark Renewables',
    scheme: 'CIS T4',
    awarded_mw: 357,
    total_mw: 1200,
    technology: 'wind',
    stage_label: 'Stage 1 of 1.2 GW total',
    rez: 'South-West REZ',
    planning_status: 'Awaiting IPC',
    fid_status: 'pending',
    connection_status: 'proposed',
    connection_notes: 'AEMO Gen Info: Publicly Announced for all four components (2× wind, solar PV, BESS). The hub is co-located with TransGrid\'s new Dinawan Substation — substantial site adjacency advantage. Solar+BESS approved Apr 2026; wind connection process gated on IPC determination.',
    cod_expected: '2029-12',
    execution_risk: 'watch',
    risk_rationale: '7 months since T4 award without wind planning approval. The hub\'s solar+BESS component is approved (Apr 2026) — that\'s a positive signal for Spark on the broader site. Wind component still gated on IPC.',
    notes: 'Wind Stage 1 awaiting IPC determination. The hub\'s solar+BESS component (separate CIS T7 win) was approved Apr 2026 — first part of the hub through planning.',
  },
  {
    project_id: 'liverpool-range-wind-farm',
    name: 'Liverpool Range — Stage 1',
    proponent: 'Tilt Renewables',
    scheme: 'CIS T4',
    awarded_mw: 634,
    total_mw: 1300,
    technology: 'wind',
    stage_label: 'Stage 1 of 1.3 GW approved',
    rez: 'CWO REZ',
    planning_status: 'EPBC Approved',
    fid_year: 2027,
    fid_status: 'expected',
    connection_status: 'gps_assessment',
    connection_notes: 'CWO REZ access right secured May 2025 (TransGrid CWO REZ network). EPBC approved Mar 2025. Tilt advancing pre-FID engineering and GPS work. AEMO Gen Info: Publicly Announced — likely to advance once GPS work completes and FID is reached.',
    execution_risk: 'on_track',
    risk_rationale: 'Approved at state and federal level, CWO REZ access secured, Tilt has proven LTESA execution (Palmer). Standard pre-FID engineering activity expected.',
    notes: 'NSW modification approval Oct 2024; EPBC March 2025. Stage 2 (~700 MW) wind-alone candidate for Q2 2026 LTESA round.',
  },
  // ----- CIS Tender 1 (Dec 2024) -----
  {
    project_id: 'valley-of-the-winds',
    name: 'Valley of the Winds',
    proponent: 'ACEN Australia',
    scheme: 'CIS T1',
    awarded_mw: 943,
    total_mw: 919,
    technology: 'wind',
    stage_label: 'Full project',
    rez: 'CWO REZ',
    planning_status: 'EPBC Approved',
    fid_status: 'pending',
    connection_status: 'anticipated',
    connection_notes: 'AEMO Gen Info: **Anticipated** — partial commitment criteria met. CWO REZ project. Connection process gated on Class 1 EPBC merits appeal outcome in the NSW Land and Environment Court.',
    cod_expected: '2029-12',
    execution_risk: 'watch',
    risk_rationale: 'IPC + EPBC approved, but Class 1 merits appeal on EPBC pending in NSW Land and Environment Court. Adverse outcome could materially delay construction start. 17 months since CIS T1 award without FID.',
    notes: 'IPC approval June 2025; EPBC approval Sep 2025 (Class 1 merits appeal pending). Scheme records 936-943 MW range; AEMO Gen Info 919 MW.',
  },
  {
    project_id: 'spicers-creek-wind-farm',
    name: 'Spicers Creek',
    proponent: 'Squadron Energy',
    scheme: 'CIS T1',
    awarded_mw: 700,
    total_mw: 702,
    technology: 'wind',
    stage_label: 'Full project',
    rez: 'CWO REZ',
    planning_status: 'EPBC Approved',
    fid_year: 2026,
    fid_status: 'expected',
    connection_status: 'gps_assessment',
    connection_notes: 'CWO REZ project. EPBC approved Mar 2025, IPC Oct 2024. Squadron Energy advancing pre-FID work — typical CWO REZ TransGrid connection profile. AEMO Gen Info: Publicly Announced.',
    execution_risk: 'on_track',
    risk_rationale: 'Approved at both state and federal level. Squadron Energy / Tattarang has cash + execution muscle.',
    notes: 'IPC Oct 2024; EPBC March 2025.',
  },
  {
    project_id: 'junction-rivers-wind-and-bess',
    name: 'Junction Rivers',
    proponent: 'Windlab (Squadron/Forrest)',
    scheme: 'CIS T1',
    awarded_mw: 585,
    total_mw: 585,
    technology: 'hybrid',
    stage_label: 'Full project',
    planning_status: 'Planning Submitted',
    fid_status: 'pending',
    connection_status: 'at_risk',
    connection_notes: '**Lost SW REZ access rights** — no grid connection path until REZ access is recovered. AEMO Gen Info: Publicly Announced. Until grid access is resolved, the project cannot reach FID.',
    cod_expected: '2032-04',
    execution_risk: 'stalled',
    risk_rationale: 'Two compounding blockers: (1) **lost SW REZ access right** — without grid access the project cannot connect; (2) planning still in pre-approval (EIS / RTS phase). 17 months since CIS T1 award with no FID-readiness signal. The CISA is more likely than not NOT to execute within the federal scheme\'s 14-month window — the underlying project may still proceed under a future scheme or merchant if REZ access is recovered, but the T1 CISA itself is stalled.',
    notes: 'Wind+BESS hybrid (800 MWh storage). EIS lodged; Response to Submissions phase. **Lost SW REZ access rights** — material headwind for CISA execution and FID.',
  },
  {
    project_id: 'thunderbolt-wind-farm',
    name: 'Thunderbolt — Stage 1',
    proponent: 'Neoen Australia',
    scheme: 'CIS T1',
    awarded_mw: 192,
    total_mw: 380,
    technology: 'wind',
    stage_label: 'Stage 1 of ~380 MW hub',
    planning_status: 'EPBC Approved',
    fid_year: 2026,
    fid_status: 'expected',
    connection_status: 'gps_assessment',
    connection_notes: 'New England transmission area. Stage 1 approved at state (IPC May 2024) + federal (EPBC Nov 2024). Neoen advancing pre-FID work — typical New England network connection profile. AEMO Gen Info: Publicly Announced (210 MW).',
    execution_risk: 'on_track',
    risk_rationale: 'Stage 1 approved at both state (IPC May 2024) and federal (EPBC Nov 2024) level. Neoen has proven build track record on similar New England assets.',
    notes: 'IPC approval May 2024 for 192 MW Stage 1; EPBC Nov 2024. Scheme records cite ~230 MW; AEMO Gen Info 210 MW; the broader Neoen hub envisages up to ~380 MW.',
  },
  // ----- LTESA -----
  {
    project_id: 'coppabella-wind-farm',
    name: 'Coppabella',
    proponent: 'Goldwind Australia',
    scheme: 'LTESA R1',
    awarded_mw: 275,
    total_mw: 270,
    technology: 'wind',
    stage_label: 'Full project',
    rez: 'Southern Tablelands',
    planning_status: 'EPBC Approved',
    fid_status: 'pending',
    connection_status: 'anticipated',
    connection_notes: 'AEMO Gen Info: **Anticipated** (290 MW, DUID COPBEL allocated) — connection process advanced but commissioning materially delayed. NSW approved 2016. BESS modification on public exhibition Dec 2025 indicates ongoing redesign rather than build readiness.',
    cod_expected: '2027-09',
    execution_risk: 'stalled',
    risk_rationale: 'LTESA R1 awarded May 2023 — three years on, no FID and no visible construction. BESS modification still on public exhibition Dec 2025 indicates the project is being redesigned, not built. The R1 LTESA execution window has effectively passed; the contract is more likely than not NOT to be executed. The underlying project (approved 2016, Goldwind) may still proceed merchant or under a future scheme, but the R1 LTESA itself is stalled.',
    notes: 'NSW approved 2016; preparing for construction. BESS modification on public exhibition Dec 2025.',
  },
  {
    project_id: 'uungula-wind-farm',
    name: 'Uungula',
    proponent: 'Squadron Energy',
    scheme: 'LTESA R3',
    awarded_mw: 200,
    total_mw: 414,
    technology: 'wind',
    stage_label: 'LTESA covers 200 MW of 414 MW',
    rez: 'CWO REZ',
    planning_status: 'Construction',
    fid_year: 2024,
    fid_status: 'reached',
    connection_status: 'committed',
    connection_notes: 'AEMO Gen Info: **Committed** (414 MW). CWO REZ — Wellington-area TransGrid network. FID reached 2024, currently under construction with COD target Feb 2028. The only NSW wind cohort project physically being built.',
    cod_expected: '2028-02',
    execution_risk: 'on_track',
    risk_rationale: 'Under construction — the only project in the cohort physically being built. COD targeted Feb 2028.',
    notes: 'NSW approved 2021; currently under construction. LTESA R3 contract covers 200 MW; remaining 214 MW of nameplate sits outside the scheme.',
  },
  {
    project_id: 'flyers-creek-wind-farm',
    name: 'Flyers Creek',
    proponent: 'Iberdrola Australia',
    scheme: 'LTESA R4',
    awarded_mw: 145,
    total_mw: 146,
    technology: 'wind',
    stage_label: 'Full project',
    rez: 'Central-West',
    planning_status: 'Operating',
    fid_year: 2021,
    fid_status: 'reached',
    connection_status: 'operating',
    connection_notes: 'AEMO Gen Info: **In Service** (DUID FLYCRKWF, 145.5 MW). Central-West TransGrid network. Connected and operating since 2023; LTESA R4 underwrites a built asset.',
    cod_expected: '2023-09',
    execution_risk: 'on_track',
    risk_rationale: 'Operating asset — LTESA R4 underwrites a built and commissioned project.',
    notes: 'NSW approved 2014; complete and operational. Iberdrola Australia ownership.',
  },
]

// ============================================================
// OPEN ROUNDS — "Current State of Play" (v3.14.0)
// ============================================================
// Live + imminent CIS (federal, DCCEEW) and NSW Roadmap LTESA (ASL)
// tenders, with research-backed "what changed" + strategy cheat sheets.
//
// CRITICAL NAMING NOTE: both the FEDERAL CIS and the NSW ROADMAP have a
// "Tender 8" and "Tender 9" live concurrently in 2026 — they are entirely
// different schemes (CIS = federal cap-and-collar; NSW = state LTESA
// option). The UI must always badge the scheme. `roundCode` carries the
// scheme prefix to keep them unambiguous.
//
// Sourcing (late May 2026): DCCEEW open-CIS-tenders + "changes to future
// tender process"; ASL (AusEnergy Services Ltd, formerly AEMO Services)
// tender pages + T6/T7 market briefing notes; HSF Kramer (10 Jul 2025) +
// Hamilton Locke (20 Aug 2025) CIS-reform notes; Dentons LTESA T8/T9 note
// (26 May 2026); pv-magazine-australia / pv-tech / energy-storage.news
// (15–26 May 2026). Confidence flags carried per-field in `caveats`.

export type OpenRoundScheme = 'CIS' | 'LTESA'
export type OpenRoundStatus = 'open' | 'evaluating' | 'upcoming'
export type RoundConfigFavour = 'hybrid' | 'generation' | 'storage' | 'mixed'

export interface MeritCriterion {
  label: string
  weightPct?: number            // undefined = not publicly disclosed
  tests: string                 // what it assesses
}

export interface OpenRoundChange {
  area: 'Contract' | 'Merit criteria' | 'Eligibility' | 'Target' | 'Process' | 'Region'
  detail: string
}

export interface OpenRound {
  id: string
  scheme: OpenRoundScheme
  /** Unambiguous code incl. scheme prefix, e.g. 'CIS T9', 'NSW T8'. */
  roundCode: string
  name: string
  administrator: string         // 'DCCEEW (Commonwealth)' | 'ASL — AusEnergy Services Ltd (NSW Consumer Trustee)'
  status: OpenRoundStatus
  techFocus: string             // 'NEM Generation', 'Generation + Hybrid', 'Long-Duration Storage', etc.
  region: string                // 'NEM-wide (excl. NSW)', 'NSW', 'WEM', etc.

  // Procurement target
  targetMW?: number
  targetMWh?: number
  targetLabel: string           // human label, e.g. '~5 GW', '~12 GWh / ~1.5 GW (≥8h)'

  // Timeline (ISO dates where known; null where not pinned)
  opened?: string
  registrationsClose?: string
  bidsClose?: string
  resultsExpected?: string      // free text — 'Nov 2026', 'late 2026', 'Jun 2026'
  targetCOD?: string            // free text

  // Mechanism
  contractMechanism: string     // one-liner describing CISA / LTESA structure for this round
  configFavoured: RoundConfigFavour
  meritCriteria: MeritCriterion[]

  // Analyst body
  headline: string              // one-sentence "why this round matters"
  whatChanged: OpenRoundChange[]
  analystRead: string           // 2-4 sentences, advisory voice

  // Operator playbook (punchy imperative callout)
  playbook: string[]            // 3-6 sharp actionable lines

  // Hybrid mechanism detail (where relevant)
  hybridMechanism?: string

  // Can already-committed / FID'd projects bid? (additionality / commitment cutoff)
  commitmentEligibility?: {
    /** One-line answer surfaced as the block headline. */
    summary: string
    /** The commitment cutoff anchor date (free text). */
    cutoffDate?: string
    /** 2-3 sentence explanation of the additionality rule. */
    detail: string
    /** Confidence in the rule as stated for THIS round. */
    confidence: 'confirmed' | 'likely' | 'inferred'
  }

  // -------- v3.15.0: NSW T8 strategy deep-dive (optional, round-specific) --------

  /** What's been decided about the round's product design vs what's still TBD. */
  designStatus?: {
    decided: string[]             // confirmed elements
    openItems: string[]           // still-unresolved elements
  }

  /** Pros / cons of the settlement basis (e.g. net-export for Hybrid LTESA). */
  settlementProsAndCons?: {
    basis: string                 // one-line: "Cash-settled swap on net sent-out exports..."
    pros: string[]
    cons: string[]
    favours: string[]             // project types/circumstances favoured
    disfavours: string[]
  }

  /** Side-by-side comparison of two product designs (e.g. Fixed-Shape vs Generation-following). */
  productComparison?: {
    headline: string              // one-line conclusion
    options: Array<{
      label: string
      mechanic: string
      suits: string
      tradeoff: string
      verdict: 'adopted' | 'not-adopted' | 'available'
    }>
  }

  /** PPA × RRP × Annuity Cap interaction scenarios, presented as two-branch
   *  (if NOR includes PPA vs if it excludes PPA) because that's an open
   *  question per the deep research. */
  ppaScenarios?: {
    headline: string
    norQuestion: string           // the unresolved question framing the two branches
    branches: Array<{
      label: string               // 'If PPA revenue NETS into NOR' vs 'If PPA is OUTSIDE NOR'
      tone: 'cautious' | 'opportunistic'
      scenarios: Array<{
        name: string              // e.g. "PPA below RRP and below Annuity Cap"
        ppaVsRRP: string
        ppaVsCap: string
        outcome: string           // 2-3 sentence walk-through
        trap?: string             // structural trap to watch
      }>
    }>
  }

  /** Hybrid-or-not decision framework for wind+BESS and solar+BESS. */
  hybridDecisionFramework?: {
    headline: string
    dimensions: Array<{ name: string; matters: string }>
    cases: Array<{
      caseLabel: string           // 'Wind farm + BESS' / 'Solar farm + BESS'
      hybridFavoured: string      // when hybrid LTESA wins
      generationFavoured: string  // when standalone Generation LTESA wins
      ratiosToTarget?: string     // gen:storage ratio + duration guidance
    }>
  }

  /** Explicitly-flagged unresolved questions (what's NOT yet in public docs). */
  openQuestions?: string[]

  /** v3.16.4: Bid Parameters + Option Mechanics — variables per asset type, annual options, partial exercise, Exercise Notice timing. */
  bidParamsOptionsDeepDive?: {
    headline: string
    bidVariablesComparison: Array<{
      variable: string                     // e.g. 'Fixed Price (Gen) / Strike Price (Hybrid)'
      genLtesaTreatment: string            // how it works in Gen LTESA
      hybridLtesaTreatment: string         // how it works in Hybrid LTESA
      notes?: string                       // extra detail
    }>
    projectParametersByAssetType: Array<{
      assetType: string                    // e.g. 'Generation Only'
      paramsRequired: string[]             // what Project Parameters you must submit
    }>
    optionStructure: {
      swapPeriod: string                   // confirmed: 1 Jul – 30 Jun
      annualExercise: string               // confirmed
      partialExercise: string              // confirmed Nominated %
      exerciseNoticeTiming: string         // honest — proforma-dependent
      confidence: 'confirmed' | 'likely' | 'inferred'
    }
    partialExerciseExamples: Array<{
      scenario: string                     // e.g. '500 MW project, Contracted % 80%, Nominated % 50%'
      contractedPct: number
      nominatedPct: number
      swapPct: number
      effectMW: number                     // effective MW under swap that year
      interpretation: string
    }>
  }

  /** v3.16.3: Bid Configuration Deep Dive — Project Category vs Contract Product, registration lock-in, Default+Alt combos. */
  bidConfigDeepDive?: {
    headline: string
    keyDistinction: string                  // 'Assessed Hybrid' = Project Category; 'Hybrid LTESA' = Contract Product
    projectCategories: Array<{
      category: string                      // 'Generation Only' | 'Non-Assessed Hybrid' | 'Assessed Hybrid <4hr' | 'Assessed Hybrid ≥4hr'
      whatItIs: string
      genLtesaEligible: boolean
      hybridLtesaEligible: boolean
      mcAssessmentNote: string              // What gets assessed under MC for this Project Category
    }>
    assessmentPaths: Array<{
      pathLabel: string                     // e.g. 'Assessed Hybrid → Gen LTESA'
      mcComponentsAssessed: string          // what WMB / SSC / SSS / NLC consider
      netLtesaCostMechanic: string          // which product's payment mechanics apply
      keyInsight: string                    // why this matters
    }>
    registrationLockIn: string              // Project category fixed at registration
    combinationExamples: Array<{
      scenario: string
      defaultBid: string                    // e.g. 'Gen LTESA, Default Term 20yr'
      alternativeBid?: string               // e.g. 'Hybrid LTESA, Alt Term 15yr'
      strategy: string
    }>
  }

  /** v3.16.2: How a PPA interplays with LTESA bid parameters — plain-English strategy guide. */
  ppaLeverageDeepDive?: {
    headline: string
    mechanism: string                      // why MC1 BCR rewards a lower Net LTESA Cost
    leveragePoints: Array<{
      lever: string                        // e.g. 'Lower Contracted Percentage'
      howItWorks: string                   // plain-English explanation
      mc1Impact: string                    // effect on MC1 BCR scoring
      theLimit: string                     // what stops you going further
    }>
    hardLimits: string[]                   // rules-based constraints
    softLimits: string[]                   // commercial / scoring constraints
    balancingAct: string                   // the trade-off summary
    workedScenario: {                      // before/after PPA bid comparison
      headline: string
      noPpa: { label: string; contractedPct: number; fixedPrice: number; rpt: number; netLtesaCost: string; rationale: string }
      withPpa: { label: string; contractedPct: number; fixedPrice: number; rpt: number; netLtesaCost: string; rationale: string }
    }
  }

  /** v3.16.1: Deep dive on the Hybrid LTESA's 50% price-risk share vs Generation LTESA's full pass-through. */
  riskShareDeepDive?: {
    headline: string
    mechanicsExplainer: string             // what the 50% does, in one paragraph
    whenItApplies: Array<{ context: string; behaviour: string }>  // exercise vs non-exercise; symmetric
    batteryChargingExplainer: string       // how net-export basis handles charging
    whyFiftyPercent: string                // design rationale
    workedExamples: Array<{
      scenario: string                      // e.g. 'Low-spot year ($40/MWh) — exercising'
      spotPrice: number                     // $/MWh
      bidStrike: number                     // Fixed/Strike Price $/MWh
      generationMWh: number                 // assumed gen volume
      genLtesaCashflow: number              // $M — sign convention: + means SFV→Op, − means Op→SFV
      hybridLtesaCashflow: number           // $M
      effectivePriceGen: number             // $/MWh realised
      effectivePriceHybrid: number          // $/MWh realised
      interpretation: string                // 1 sentence on what this shows
    }>
  }

  // ---- End v3.15.0 / v3.16.1 additions ----

  // Honesty
  caveats: string[]             // confidence flags surfaced in UI
  sources: { label: string; url: string }[]
}

export const OPEN_ROUNDS: OpenRound[] = [
  // ---------------------------------------------------------------
  // FEDERAL CIS — Tender 9 (NEM Generation) — OPEN
  // ---------------------------------------------------------------
  {
    id: 'cis-tender-9-nem-gen',
    scheme: 'CIS',
    roundCode: 'CIS T9',
    name: 'CIS Tender 9 — NEM Generation',
    administrator: 'DCCEEW (Commonwealth), tenders run by ASL',
    status: 'open',
    techFocus: 'Renewable generation (hybrids allowed)',
    region: 'NEM-wide — NSW EXCLUDED',
    targetMW: 5000,
    targetLabel: '~5 GW (indicative)',
    opened: '2026-05-25',
    registrationsClose: '2026-07-06',
    bidsClose: '2026-07-20',
    resultsExpected: 'Nov 2026',
    targetCOD: 'Before end-2030',
    contractMechanism: 'CISA "cap & collar" (CfD-style Annual Floor + Annual Ceiling). Up to 15-yr Support Period. Per the gazetted annual cashflow formula (see CIS T8 MC1 briefing §4.5.2 for the canonical version): if NOR < Annual Floor, Government pays min(90% × (Floor − NOR), Annual Payment Cap); if NOR > Annual Ceiling, Operator repays min(50% × (NOR − Ceiling), Annual Payment Cap); between Floor and Ceiling, zero settlement. Floor support % (90%) and ceiling sharing % (50%) are FIXED. Bid variables: Final Support End Date, Annual Floor, Annual Ceiling, Annual Payment Cap — each can be a per-year schedule of nominal $ amounts.',
    configFavoured: 'hybrid',
    meritCriteria: [
      { label: 'Financial value, system reliability & system benefits', tests: 'Net CISA cost to the Commonwealth + benefit to the NEM. The dominant criterion.' },
      { label: 'Project deliverability & timeline', tests: 'Development maturity + credibility of delivering by 2030.' },
      { label: 'Organisational, resource & financing capability', tests: 'Track record, balance-sheet/financing depth, revenue strategy.' },
      { label: 'First Nations participation & benefit sharing', tests: 'Equity and/or revenue sharing — drives the 500 MW set-aside.' },
      { label: 'Social outcomes & community benefit sharing', tests: 'Co-designed community benefit (not unilateral).' },
    ],
    headline: 'The first NEM generation round NSW cannot win — contestable capacity shifts to QLD/SA/VIC/TAS, with a First Nations set-aside and a Victorian solar cap.',
    whatChanged: [
      { area: 'Region', detail: 'NSW EXCLUDED entirely — it hit its maximum CIS allocation across prior rounds (T7 was its last eligible round). NSW developers are redirected to the NSW Roadmap state tenders.' },
      { area: 'Region', detail: 'New state shape: TAS ~300 MW; VIC ~1.6 GW with a 470 MW cap on solar-only Victorian projects (at Victoria’s request); ~3.1 GW contestable/unallocated (indicatively flowing to QLD & SA).' },
      { area: 'Eligibility', detail: 'New First Nations 500 MW set-aside for projects committing to ≥5% First Nations equity and/or revenue sharing.' },
      { area: 'Process', detail: 'Two-stage → single-stage bidding (full merit + financial bid submitted together). Total tender ~9mo → ~6mo, compressing proponent prep to a ~6–8 week window.' },
      { area: 'Merit criteria', detail: 'Consolidated to 5 criteria. Commercial/CISA departures are NO LONGER scored (from Tender 5) — instead, unnecessary departures are an EXCLUSION risk. A credible end-2030 COD is now a hard merit lever.' },
      { area: 'Eligibility', detail: 'New labour/workforce transparency requirement (public disclosure of key labour + major-subcontractor arrangements) and a reserve-list mechanism for meritorious-but-unsuccessful bids.' },
    ],
    analystRead: 'T9 is the round where the federal scheme formally rotates away from NSW toward the rest of the NEM. With NSW out and a Victorian solar cap in place, the ~3.1 GW of unallocated capacity gives Queensland and South Australia generation projects real headroom. Hybrids continue to gain ground (8 of 19 T7 winners were battery-paired) because they score on the system-benefit limb, but the single biggest discriminator is now a credible, financeable pathway to commercial operation before end-2030.',
    commitmentEligibility: {
      summary: 'No — projects identified as committed or existing in the round-specific AEMO Generation Information page are ineligible. T9 anchor date pending Guidelines publication.',
      cutoffDate: 'Round-specific AEMO Generation Information page (TBC for T9 — CIS T8 anchored to the 8 Nov 2024 page; T9 expected to use a more recent page)',
      detail: 'The CIS underwrites *additional* capacity. Per Eligibility Criterion 7 in the gazetted CIS Tender Guidelines, projects identified as committed or existing in a specific AEMO Generation Information page are ineligible. CIS T8 (NEM Dispatchable) anchors to the AEMO "NEM October 2024 Generation Information" page published 8 November 2024. CIS T9 (NEM Generation) is expected to follow the same pattern but anchored to a more recent AEMO Generation Information page — the exact date will be in EC7 of the T9 Tender Guidelines (verify against the gazetted document). Earlier AURES content referenced the 23 Nov 2023 CIS expansion announcement as the anchor date — that has been superseded by the round-specific AEMO Gen Info page mechanism. Pre-FID projects (or those that became committed after the anchor date) can bid; projects committed before cannot.',
      confidence: 'likely',
    },
    playbook: [
      'If you’re a NSW project — don’t bid here; pivot to NSW Roadmap T8 (Generation/Hybrid).',
      'Target QLD or SA generation — that’s where the ~3.1 GW contestable headroom sits.',
      'Pair generation with ~4-hour storage — the de-facto competitive baseline that lifts the system-benefit score.',
      'Bid the lowest credible net-CISA-cost and a connection/planning status that makes a <2030 COD believable.',
      'Submit only strictly necessary CISA departures — unnecessary ones now risk exclusion, not just a lower score.',
      'Chasing the 500 MW First Nations set-aside? Lock a named partner at ≥5% equity/revenue before bidding.',
      'Avoid solar-only in Victoria beyond the 470 MW cap — it will be brutally contested.',
    ],
    caveats: [
      'Merit-criterion numeric weightings are NOT publicly disclosed — they sit in the tender-specific Guidelines and vary by location/technology.',
      'The QLD/SA ~3.1 GW split is indicative/inferred (reported by trade press), not an official state allocation.',
      'No source indicated any change to the CISA floor/ceiling numbers or term for T9 specifically — assumed unchanged but unverified at the parameter level.',
    ],
    sources: [
      { label: 'DCCEEW — Open CIS tenders', url: 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme/open-cis-tenders' },
      { label: 'DCCEEW — Changes to future tender process', url: 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme' },
      { label: 'pv magazine Australia — Australia opens 5 GW generation tender (26 May 2026)', url: 'https://www.pv-magazine-australia.com/2026/05/26/australia-opens-5-gw-renewable-generation-tender-under-cis/' },
      { label: 'HSF Kramer — CIS changes (10 Jul 2025)', url: 'https://www.hsfkramer.com/notes/energy/2025-posts/cis-changes' },
      { label: 'Hamilton Locke — CIS tender reforms (20 Aug 2025)', url: 'https://hamiltonlocke.com.au/cis-tender-reforms-whats-changing-and-when/' },
    ],
  },

  // ---------------------------------------------------------------
  // NSW ROADMAP — Tender 8 (Generation + Hybrid LTESA) — OPEN
  // ---------------------------------------------------------------
  {
    id: 'nsw-roadmap-tender-8-gen-hybrid',
    scheme: 'LTESA',
    roundCode: 'NSW T8',
    name: 'NSW Roadmap Tender 8 — Generation Infrastructure (Generation LTESA + first-ever Hybrid Generation LTESA)',
    administrator: 'ASL — AusEnergy Services Ltd (NSW Consumer Trustee under EII Act 2020). Counterparty is the Scheme Financial Vehicle (SFV), Moody\'s Aa3 rated, with statutory cost-recovery rights via DNSPs.',
    status: 'open',
    techFocus: 'Renewable generation (solar / wind / run-of-river hydro) — standalone, Non-Assessed Hybrid, or Assessed Hybrid. First-ever Hybrid Generation LTESA product available for Assessed Hybrids meeting the ≥4hr storage + gen-export > storage-export gate.',
    region: 'NSW (incl. ACT projects connecting into NSW region of NEM)',
    targetMW: 2500,
    targetLabel: '7,000 GWh p.a. (~2.5 GW installed gen capacity, per 2025 IIO Report)',
    opened: '2026-05-20',
    registrationsClose: '2026-06-22',
    bidsClose: '2026-07-06',
    resultsExpected: 'Nov/Dec 2026',
    targetCOD: 'Credible pathway to COD required (MC2 assessed). COD before 31 Dec 2029 receives more favourable consideration; COD beyond 2030 not preferred but not excluded if pathway is credible.',
    contractMechanism: 'Two product variants, both option-style (annual options to enter 1-year Swap Periods over the contract term; no upfront premium; full/partial/no-exercise allowed per Swap Period). Default Bid term is 20 years (Alternative Bid permits varying term as a Bid Variable). Swap Period reduced to 1 year (was 2 yr in TR4). Cash-settled monthly. **Generation LTESA** (all eligible gen): on exercise, monthly settlement = Σ (Fixed Price − Floating Price) × Notional Quantity, where Notional Quantity = Swap % × Sent-Out Generation × loss factors. Floating Price floored at $0/MWh. Annual Payment Cap = Fixed Price × Contracted % × 100% × forecast P50 annual gen. **Hybrid Generation LTESA** (Assessed Hybrids ≥4hr + gen-export > storage-export at Connection Point in AC): on exercise, monthly settlement = Σ (Strike Price − Floating Price) × Notional Quantity × **50%** (the symmetric price-risk share), where Notional Quantity is based on Sent-Out **Net Exports** (exports minus imports) × Swap % × loss factors. Notional Quantity = 0 in trading intervals with negative spot. Annual Payment Cap = Strike Price × Price Risk Share × forecast P50 annual gen. **Repayment mechanism** (both products, in non-exercise periods and uncontracted portion): if Dispatch-Weighted Floating Price > Repayment Threshold Price, Operator pays 50% × (DWFP − RPT) × Notional Quantity to SFV, capped at Historical Net Payments received from SFV, **AND reduced where the LTES Operator has entered an eligible contract** (this is where a PPA reduces the repayment burden). Bid Variables: Fixed Price (Gen LTESA) or Strike Price (Hybrid), Repayment Threshold Price, COD Target Date, Excluded Periods, Contracted Percentage (allows bidding only a portion of Project capacity), Contract Term (fixed 20yr under Default Bid; bid variable under Alternative Bid). All Bid Prices are nominal $/MWh, NOT indexed to CPI.',
    configFavoured: 'hybrid',
    meritCriteria: [
      { label: 'MC1 — Financial Value and System Benefits', weightPct: 49, tests: 'Gazetted (Table 13). Wholesale Market Benefit-to-Cost Ratio (BCR) is the primary scoring metric. Components: Wholesale Market Benefits ($NPV reduction in load cost); Forecast Net LTESA Cost ($NPV cost to SFV given Bid Variables); System Strength Contribution (lower remediation cost = better); System Security Services (voltage + frequency management). Modelled across Central / Low / High Electricity Market Scenarios under both Perfect Foresight and Always Exercise option-behaviour scenarios.' },
      { label: 'MC2 — Project deliverability and timeline', weightPct: 17, tests: 'Project development plan + schedule; grid connection application progress (Connection Enquiry Response, 5.3.4 letters, AEMO registration, GPS); planning + environmental approvals (incl. EPBC if required); land tenure; FIRB approval for foreign-owned. Later-stage projects expected to score higher; earlier credible COD scores higher.' },
      { label: 'MC3 — Organisational, resource & financing capability', weightPct: 17, tests: 'Contracting model + resourcing (EPC, equipment, technical design); track record (5-yr experience, prior LTESA awards, WHS history); development funding (FC pathway, Performance Security); financing strategy (capital raising track record, offtake/PPA progress).' },
      { label: 'MC4 — Social Value', weightPct: 17, tests: 'Local Needs Analysis (Tabs 1–3: Stakeholder Priorities + Local Needs + Theory of Change); local supply chain (Tab 5); employment + workforce dev (Tab 6); First Nations participation (Tab 7) aligned with NSW First Nations Guidelines + RESB Plan; community shared benefits (Tab 8) incl. CEP. CWO + SW REZ Access Right holders may use existing SLCs from their Access Right PDA.' },
    ],
    headline: 'NSW\'s ~2.5 GW generation tender — first-ever Hybrid Generation LTESA alongside the standard Generation LTESA, with a 20-year Default Bid term and the Generation LTESA Swap Period halved to 1 year.',
    whatChanged: [
      { area: 'Contract', detail: 'First-ever Hybrid Generation LTESA introduced alongside the standard Generation LTESA. Hybrid product is a cash-settled swap on Sent-Out Net Exports (exports minus battery imports) × Swap % × **50% symmetric price-risk share** × (Strike − Floating). Default Bid contract term raised to 20 years (Alternative Bid lets you vary). Swap Period reduced from 2 yr (TR4) to 1 yr for greater operator flexibility. Settlement is monthly within each financial-year Swap Period.' },
      { area: 'Merit criteria', detail: 'Gazetted Table 13: 4 criteria — MC1 Financial Value & System Benefits **49%** / MC2 Deliverability **17%** / MC3 Organisational, resource & financing **17%** / MC4 Social Value **17%**. BCR (Wholesale Market Benefits ÷ Net LTESA Cost) is the primary MC1 scoring metric.' },
      { area: 'Eligibility', detail: 'Hybrid LTESA eligibility (Table 1 + Section 2.5): Assessed Hybrid Project with storage capacity ≥4hr duration at First Option Date AND generation export capacity > storage export capacity measured at the Connection Point **in AC**. Generation-only, Non-Assessed Hybrids, and Assessed Hybrids with <4hr storage can only bid Generation LTESA. An Assessed Hybrid ≥4hr can bid EITHER product.' },
      { area: 'Eligibility', detail: 'EC6 additionality cutoff (Project Eligibility): project must NOT have been identified as committed or existing in the AEMO Generation Information page published 14 November 2019 (with carve-outs for expansion projects and new storage/gen added to existing shared infrastructure). This is the Tender Round 8 gazetted rule — UNCHANGED from prior rounds.' },
      { area: 'Eligibility', detail: 'EC10: Cannot hold both LTESA and CISA simultaneously. Proponents in negotiations with the Australian Government for a CISA must commit to NOT execute the CISA if awarded an LTESA in this Tender Round.' },
      { area: 'Merit criteria', detail: 'NEW MC1 Wholesale Market Benefits zeroing trigger: a Project is assessed as providing NO Wholesale Market Benefits if it had "In Service" status in the AEMO "NEM July 2025 Generation Information" page (the latest version issued before the 2025 IIO Report, Aug 2025). This status persists for Generation + LDS tenders from TR8 onwards until the next IIO Report. Separately, Hybrid LTESA bids are assessed as having NO Wholesale Market Benefits if Contracted SP Storage Capacity at COD reflects less than 4 hours of storage.' },
      { area: 'Target', detail: 'Indicative tender size 7,000 GWh p.a. (~2.5 GW installed generation capacity), per 2025 IIO Report. For Assessed Hybrids, only the generation capacity counts toward the target — a 100 MW solar + 100 MW BESS Hybrid contributes 100 MW (not 200 MW).' },
      { area: 'Process', detail: 'Tender Round 8 (Generation) runs concurrently with NSW Roadmap Tender Round 9 (LDS) — separate Online Portal, separate Tender Process Deed for each. CWO and SW REZ Access Right holders eligible to bid TR8 even if previously awarded an LTESA (carve-out under EC3, subject to Finance and Construction Criteria not yet achieved).' },
    ],
    analystRead: 'T8 is the most-structured NSW Roadmap generation tender to date. The dominant 49% MC1 limb scores on BCR — Wholesale Market Benefits ($NPV reduction in NSW load cost from the project) divided by Net LTESA Cost ($NPV cost to SFV). The competitive recipe: a low Fixed Price (Gen) or Strike Price (Hybrid), a low Repayment Threshold Price, a Contracted Percentage <100% where the project has alternative revenue support, Excluded Periods on years where merchant outperforms the strike, and an evening-peak-aligned generation profile to lift Wholesale Market Benefits. Earlier COD captures more high-price years before competing projects depress prices. Wind, hybrid wind+BESS, and solar+BESS with ≥4hr storage are most favoured; standalone solar faces structural cannibalisation. Note the two-layer additionality test: EC6 is a hard eligibility gate anchored to 14 Nov 2019; the MC1 July 2025 Gen Info "In Service" trigger is a SEPARATE merit-scoring penalty that zeros the Wholesale Market Benefits component. Cannot also hold a CISA — proponents in CIS negotiations must choose.',
    commitmentEligibility: {
      summary: 'TWO LAYERS. (1) ELIGIBILITY (EC6 hard gate): projects committed or existing in the AEMO 14 November 2019 Gen Info page are ineligible — unchanged. (2) MERIT SCORING (MC1): SEPARATELY, projects "In Service" in the AEMO July 2025 Gen Info page are assessed as providing NO Wholesale Market Benefits (zeroes the dominant 49% MC1 numerator).',
      cutoffDate: '14 November 2019 (EC6 eligibility) + 8 November 2025 publication of the "NEM July 2025 Generation Information" page (MC1 Wholesale Market Benefits zeroing trigger)',
      detail: 'EC6 (gazetted T8 Tender Guidelines, Section 4.1.1, Table 10): "Project was not identified as committed or existing in the AEMO Generation Information page published (by AEMO) on 14 November 2019, unless it is an expansion Project to an existing storage or generation asset or the Project involves the addition of new storage or generation assets to existing shared infrastructure." This is the hard eligibility gate — UNCHANGED from prior rounds. (Travis suspected this had been refreshed; per the gazetted T8 Guidelines, it has NOT been refreshed at the EC6 eligibility layer.) SEPARATELY, the gazetted MC1 Tender Guidelines (Section 4.2, p.39-40) and MC1 Market Briefing Note introduce a new scoring penalty: "A Project will be assessed as not providing Wholesale Market Benefits if it had a status of \'In Service\' in the AEMO \'NEM July 2025 Generation Information\' page" — applicable to Generation and LDS Tenders from TR8 onwards until the next IIO Report is issued. This is the actual "refreshed" anchor — but it operates at MC1 scoring, not EC6 eligibility. Net effect: a project committed in 2020 and now "In Service" can technically bid (EC6 satisfied) but will score zero on the dominant 49% MC1 limb (the BCR numerator collapses). A project still pre-FID is the target bidder for both layers. Cannot hold both LTESA + CISA (EC10). **Staged Projects (Stage 1 CISA + Stage 2 LTESA?):** the rule hinges on whether Stage 2 is the SAME Project as Stage 1 or a distinct Project. Under federal CIS T8 EC11, "Existing Project (if it is a Staged Project)" is captured — meaning if Stage 1 has an executed CISA, a related Stage 2 typically cannot also bid CIS T8 because they\'re treated as one Staged Project. Under NSW T8 EC10, you cannot hold both an LTESA and a CISA on the same Project simultaneously. Practical pivot: if Stage 2 has its OWN connection point, its own planning approval, its own SPV (Bid Entity), and independent commercial economics, it can legitimately be a separate Project — and Stage 1 CISA + Stage 2 LTESA becomes workable. If Stage 1 and Stage 2 share connection point, share a single SSD/SEARs planning approval, or are otherwise treated as a Staged Project under the proforma, they are coupled and only one scheme contract is possible. Verify the precise definition of "Project" + "Staged Project" in the proforma CISA / proforma LTESA before committing — this is a legal-review question.',
      confidence: 'confirmed',
    },
    playbook: [
      'Assessed Hybrid ≥4hr + gen-export > storage-export at CP in AC? Bid BOTH the Generation LTESA and the Hybrid Generation LTESA — proponent picks; both assessed on merit. Default to whichever gives the lower Net LTESA Cost.',
      'Use Default Bid (20yr fixed term) + Alternative Bid combinations to flex term. Excluding the last 1-2 Swap Periods may reduce Net LTESA Cost where late-life merchant prices are forecast high.',
      'Bid a Contracted Percentage <100% to reduce Net LTESA Cost. Quoted example: 500 MW project bids Contracted % of 50% (250 MW LTESA), aligned with a 50% offtake — Wholesale Market Benefits still credited on the full 500 MW.',
      'Lowest Fixed Price (Gen LTESA) or Strike Price (Hybrid) has greater leverage on Net LTESA Cost than the Repayment Threshold Price. Push the Fixed/Strike down hard.',
      'Excluded Periods are a competitive lever — nominate Swap Periods where you commit NOT to exercise (e.g. years where merchant outperforms strike). Cuts Net LTESA Cost without reducing project revenue.',
      'Maximise the Wholesale Market Benefits numerator: evening-peak generation profile (wind, hybrid solar+BESS with evening discharge); strong network location near load centres in NSW.',
      'Target COD before 31 Dec 2029 if credible — earlier years capture more high-price periods and have less PV-discounted modelling weight in Wholesale Market Benefits.',
      'If your project was "In Service" on the AEMO July 2025 Gen Info page, MC1 Wholesale Market Benefits scores zero — heavily disadvantaged. Pre-FID projects only for competitive bids.',
      'PPAs reduce the Repayment obligation in non-exercise periods (via the "eligible contract" reduction), but do not enter the swap settlement itself during exercise.',
      'Cannot hold LTESA + CISA simultaneously — proponents in CIS negotiations must commit to not executing a CISA if awarded LTESA.',
      'Submit Community Engagement Plan (EC9) — becomes contractually binding on award.',
      'Process Security Bond: $4,000/MW capped at $1.2M, due within 8 Business Days of bid submission. For Hybrids, applies only to MW of the gen asset.',
    ],
    hybridMechanism: 'Hybrid Generation LTESA eligibility (gazetted Table 1 + Section 2.5): Assessed Hybrid Project with (a) storage capacity reflecting ≥4 hours duration at the First Option Date, AND (b) generation export capacity > storage export capacity, measured at the Connection Point in AC. Contract structure: cash-settled swap; on exercise of an option for a 1-year Swap Period, monthly settlement = Σ (Strike Price − Floating Price) × Notional Quantity × 50% (the symmetric price-risk share), where Notional Quantity is calculated on Sent-Out **Net Exports** (exports minus imports) × Swap Percentage × loss factors. Notional Quantity = 0 in trading intervals with negative spot price. Repayment in non-exercise periods (50% × NQ × (Floating − Repayment Threshold Price)) is reduced where the Operator has entered an eligible contract, capped at Historical Net Payments. Annual Payment Cap = Strike Price × Price Risk Share % × forecast P50 annual generation. An Assessed Hybrid ≥4hr can choose to bid the Hybrid Generation LTESA OR the standard Generation LTESA (or both as separate bids). Configurations that fail the gate (storage <4hr, OR storage export ≥ generation export) bid the standard Generation LTESA — but if storage <4hr at COD, the Hybrid LTESA bid is assessed as having ZERO Wholesale Market Benefits in MC1.',
    caveats: [
      'All material facts above are now sourced from gazetted primary documents (Tender Guidelines, MC1 Briefing, Generation LTESA + Hybrid Gen LTESA fact sheets, all 20 May 2026). Prior AURES content drew on trade-press paraphrase + consultation drafts — superseded by this rebuild.',
      'Bid Variables (Fixed/Strike Price, Repayment Threshold Price, Contracted Percentage, COD Target, Excluded Periods, Contract Term) are bid as flat nominal $ values — not per-year schedules. Alternative Bids can vary the Contract Term as a Bid Variable; Default Bid Contract Term is fixed at 20 years.',
      'The exact definition of "eligible contract" that reduces the Repayment obligation in non-exercise periods is in the proforma Generation LTESA / Hybrid Generation LTESA contract documents (DOCX) — financial-modelling teams should review the proforma directly for the full reduction formula.',
      'The "In Service" status MC1 zeroing trigger anchors to the AEMO "NEM July 2025 Generation Information" page and persists for Generation and LDS Tenders until the next IIO Report is issued — refresh timing not specified.',
      'COD acceleration is "favourable consideration" not a defined numeric bonus — projects with COD before 31 Dec 2029 + credible delivery pathway are "expected to be considered more favourably" per Table 2 (Key Items).',
    ],
    sources: [
      { label: 'ASL — Tender Round 8 Tender Guidelines (20 May 2026, gazetted PDF)', url: 'https://asl.org.au/tenders/tender-round-8' },
      { label: 'ASL — Tender Round 8 MC1 Market Briefing Note (20 May 2026, gazetted PDF)', url: 'https://asl.org.au/tenders/tender-round-8' },
      { label: 'ASL — Generation LTESA Fact Sheet (15 May 2026)', url: 'https://asl.org.au/tenders/tender-round-8' },
      { label: 'ASL — Hybrid Generation LTESA Fact Sheet (15 May 2026)', url: 'https://asl.org.au/tenders/tender-round-8' },
      { label: 'ASL — proforma Generation LTESA (publication version 18 May 2026)', url: 'https://asl.org.au/tenders/tender-round-8' },
      { label: 'ASL — proforma Hybrid Generation LTESA (publication version 18 May 2026)', url: 'https://asl.org.au/tenders/tender-round-8' },
      { label: 'ASL — Tender Round 9 (LDS LTESA, concurrent)', url: 'https://asl.org.au/tenders/tender-round-9' },
      { label: 'NSW EII Act 2020 + EII Regulation 2021 + Tender Rules (statutory basis)', url: 'https://asl.org.au/' },
    ],
    designStatus: {
      decided: [
        'Two LTESA products gazetted: standard **Generation LTESA** (all eligible gen, incl. Non-Assessed Hybrids and Assessed Hybrids <4hr) and the first-ever **Hybrid Generation LTESA** (Assessed Hybrids ≥4hr where gen-export > storage-export at CP in AC).',
        '**Price-risk share = 50% symmetric** for Hybrid Generation LTESA — confirmed in gazetted MC1 Briefing Appendix A: CostEstimate = Σ NotionalQuantity × 50% × (StrikePrice − FloatingPrice). The stakeholder pushback for asymmetric 80% downside was NOT adopted.',
        '**Contract term: Default Bid is 20 years** (fixed). Alternative Bid permits varying the term as a Bid Variable.',
        '**Swap Period: 1 financial year** (1 July – 30 June), reduced from 2 years in TR4. Settlement is monthly within each Swap Period.',
        'Hybrid eligibility gate (gazetted Table 1): storage ≥4hr duration AT FIRST OPTION DATE (not just COD), AND generation export capacity > storage export capacity measured AT CONNECTION POINT IN AC.',
        'Hybrid project bidding flexibility: an Assessed Hybrid ≥4hr can bid **EITHER** Generation LTESA OR Hybrid Generation LTESA (or both as separate Default/Alternative Bids).',
        'Bid Variables (gazetted): Fixed Price (Gen LTESA) / Strike Price (Hybrid), Repayment Threshold Price, Contracted Percentage (allows partial-capacity bid e.g. 250 MW LTESA on 500 MW project), COD Target Date, Excluded Periods, Contract Term (Default 20yr; Alternative variable). All Bid Prices are nominal $/MWh, NOT CPI-indexed.',
        'PPA interaction: the "eligible contract" mechanism in the Repayment formula REDUCES the Repayment obligation in non-exercise periods (the only place PPA enters the LTESA cash flow). The swap settlement itself, on exercise, is on Sent-Out Net Exports — PPA does not enter the swap directly.',
        'EC6 additionality cutoff anchored to AEMO Generation Information page published 14 Nov 2019 — UNCHANGED from prior rounds at the eligibility-gate layer.',
        'NEW MC1 Wholesale Market Benefits zeroing trigger: projects "In Service" in the AEMO July 2025 Gen Info page assessed as having NO Wholesale Market Benefits (zeroes the dominant 49% MC1 numerator).',
        'Hybrid LTESA bids with storage <4hr at COD assessed as having NO Wholesale Market Benefits (Table 2 + MC1 §p.40).',
        'Merit weightings (gazetted Table 13): MC1 49% / MC2 17% / MC3 17% / MC4 17%.',
        'Cannot hold both LTESA + CISA (EC10). Proponents in CIS negotiations must commit to NOT execute CISA if awarded LTESA.',
        'CWO + SW REZ Access Right holders eligible to bid TR8 even if previously awarded an LTESA (carve-out under EC3, subject to Finance and Construction Criteria not yet achieved).',
      ],
      openItems: [
        'Exact "eligible contract" definition that reduces the Repayment Estimate — full formula sits in the proforma Generation LTESA / Hybrid Gen LTESA contract documents (DOCX). Financial-modelling teams should review the proforma directly for the precise reduction mechanic and what qualifies as an "eligible contract" (PPA, offtake agreement, etc.).',
        'Timing of the next AEMO IIO Report — the "In Service" status that zeroes MC1 Wholesale Market Benefits anchors to the July 2025 Gen Info page "until the next IIO Report is issued". When the next IIO Report drops, a more recent Gen Info page becomes the anchor.',
      ],
    },
    settlementProsAndCons: {
      basis: 'Hybrid Generation LTESA settles as a cash-settled swap on sent-out net exports (exports minus battery imports). The dispatch-weighted average price used for settlement is calculated using net exports.',
      pros: [
        'Battery charging from the grid is netted off — so cheap-price charging doesn’t inflate the project’s revenue basis and trigger LTESA repayment unnecessarily.',
        'Operator keeps merchant upside on opportunistic cycling outside the LTESA settlement — the swap settles on net exports, not gross.',
        'Aligns LTESA payout with actual physical contribution to the grid — projects exporting during high-value periods capture the floor; projects that import (charge) reduce their own basis.',
        'Generation-following design avoids the rigidity of Option 1’s fixed time-of-day profiles, so a hybrid that can\'t hit the evening-peak shape isn\'t penalised arbitrarily.',
      ],
      cons: [
        'Net-export basis means that any period spent CHARGING from grid reduces the project’s net export volume in that interval — capping LTESA revenue even when storage operation is value-additive across the day.',
        'Solar+BESS that frequently charges from own-gen during midday cannibalisation may show low net exports during high-price hours (when battery is discharging) but ALSO low net exports earlier (when battery is charging from solar) — making the project look like a worse net-exporter than a standalone solar with PPA.',
        'AC vs DC coupling unresolved — under DC-coupling the battery only charges from own-gen (no grid imports), which is favourable for net-export accounting; AC-coupling exposes the project to grid charging that nets off LTESA settlement.',
        'Multi-DUID configurations behind a single connection point may require netting at the Integrated Resource Provider level — pending T8 Guidelines clarification.',
      ],
      favours: [
        'Wind + BESS where battery cycles primarily from own wind generation (low grid imports), and shifts wind into evening/morning peak windows.',
        'Tri-tech (wind + solar + BESS) where the storage smooths combined output but doesn\'t import heavily from grid.',
        'Long-duration storage (≥4h) that cycles once per day — lower charging-cycle exposure, higher net-export ratio.',
        'Projects in network-constrained REZs where dispatch-weighted prices are volatile and the LTESA floor materially de-risks revenue.',
      ],
      disfavours: [
        'Solar + BESS configured for heavy intra-day cycling, where grid charging is part of the arbitrage strategy — the LTESA settlement basis penalises grid-charged megawatt-hours.',
        'Short-duration BESS (≈2h) bolted onto generation — limited time-shift benefit on the wholesale-benefit numerator, and frequent cycling magnifies the net-export drag.',
        'Hybrid projects where the storage component is sized for grid-arbitrage rather than gen-firming — these are better off bidding the BESS into NSW T9 LDS and the generation into standard Generation LTESA.',
      ],
    },
    productComparison: {
      headline: 'Two gazetted LTESA products available in T8. Assessed Hybrids ≥4hr (gen-export > storage-export at CP in AC) can bid either OR both. Standard Generation LTESA is available to all eligible generation.',
      options: [
        {
          label: 'Generation LTESA (AVAILABLE — all eligible generation)',
          mechanic: 'Cash-settled swap on Sent-Out Generation. On exercise, monthly settlement = Σ (Fixed Price − Floating Price) × Notional Quantity, where Notional Quantity = Swap % × Sent-Out Generation × loss factors. Floating Price floored at $0/MWh in any trading interval. Annual Payment Cap = Fixed Price × Contracted % × 100% × forecast P50 annual gen. Bid Variables: Fixed Price, Repayment Threshold Price, Contracted %, Target COD, Excluded Periods, Contract Term (Default 20yr).',
          suits: 'Standalone solar / wind / run-of-river hydro; Non-Assessed Hybrids; Assessed Hybrids with <4hr storage; Assessed Hybrids ≥4hr that prefer full swap exposure over the 50% price-risk-share structure.',
          tradeoff: 'Operator carries full spot-vs-Fixed exposure on contracted volume during exercise. For solar-only, the daytime cannibalisation drives Wholesale Market Benefits low — competing against hybrids and wind on the dominant MC1 limb is structurally harder.',
          verdict: 'available',
        },
        {
          label: 'Hybrid Generation LTESA (ADOPTED — Assessed Hybrids ≥4hr only)',
          mechanic: 'Cash-settled swap on Sent-Out **Net Exports** (exports minus battery imports). On exercise, monthly settlement = Σ (Strike Price − Floating Price) × Notional Quantity × **50%** (symmetric price-risk share), where Notional Quantity = Swap % × Net Exports × loss factors. Notional Quantity = 0 when spot < $0/MWh. Annual Payment Cap = Strike × PRS% × forecast P50 annual gen. Same Bid Variables as Generation LTESA, but the bid is Strike Price (not Fixed Price). LTES Operator must install sub-meters; Project must register to conform to dispatch at the Connection Point in an aggregate manner.',
          suits: 'Assessed Hybrid Projects (Solar+BESS, Wind+BESS, tri-tech) where storage ≥4hr duration at First Option Date AND gen-export > storage-export at CP in AC. Best for projects that want to retain 50% of dispatch-shape upside while underwriting downside, and whose storage cycles primarily from own-gen.',
          tradeoff: 'Operator retains 50% of price risk vs Strike (smaller payment per $ deviation than Gen LTESA). Net-export basis penalises grid-charged volume; performance rebates (Minimum Generation 75% × P90 + Availability Factor + Storage Capacity) introduce downside risk on operational underperformance.',
          verdict: 'adopted',
        },
        {
          label: 'Default Bid vs Alternative Bid — the structuring lever',
          mechanic: 'Each Proponent submits a Default Bid (Contract Term FIXED at 20 years; all other Bid Variables flexible). Alternative Bids are permitted in addition — these can vary the Contract Term as a Bid Variable (e.g. 15 yr) and can be on the other LTESA product if the project is Assessed Hybrid ≥4hr. Proponents can submit multiple Alternative Bids alongside their Default Bid.',
          suits: 'All Proponents. Particularly valuable for Assessed Hybrids ≥4hr — submit Default Bid on one product (e.g. Hybrid LTESA, 20yr) and Alternative Bid on the other (e.g. Gen LTESA, 15yr). ASL assesses each Bid independently on merit; Proponent gets multiple bites at the cherry.',
          tradeoff: 'Each Bid requires the full MC1-MC4 Returnable Schedule and Project Documents (LTESA + PDA + tripartite deed) in form capable of acceptance. Multiple Bids = multiple Project Document sets. More upfront effort but materially better competitive optionality.',
          verdict: 'available',
        },
      ],
    },
    ppaScenarios: {
      headline: 'How an existing or future PPA interacts with the LTESA Strike/Fixed Price and Repayment Threshold Price — the gazetted mechanic NOW DEFINITIVE: PPA revenue does NOT enter the swap settlement during exercise; the LTESA settles purely on the spot/Floating Price reference. PPAs DO reduce the Repayment obligation in non-exercise periods via the "eligible contract" reduction.',
      norQuestion: 'Definitive mechanic per gazetted MC1 Briefing Appendix A and the fact sheets: settlement on exercise = Σ NotionalQuantity × [50% if Hybrid, else 100%] × (Fixed/Strike − Floating). The Floating Price is the NSW spot price (with $0/MWh floor for Gen LTESA; NQ=0 when negative for Hybrid). PPA revenue does NOT feed into this swap calc. Repayment in non-exercise periods = min(HistoricalNetPayments, Σ 50% × NQ × (Floating − Repayment Threshold Price)) — and this Repayment is reduced where the LTES Operator has entered an "eligible contract" (the only place PPA directly enters the cash flow). The exact eligible-contract reduction formula sits in the proforma LTESA contract document.',
      branches: [
        {
          label: 'CONFIRMED MECHANIC — gazetted T8 Tender Guidelines + MC1 Briefing + proforma LTESAs',
          tone: 'cautious',
          scenarios: [
            {
              name: '1. PPA strike BELOW spot AND PPA < Fixed/Strike Price',
              ppaVsRRP: 'PPA < Spot',
              ppaVsCap: 'PPA < Strike',
              outcome: 'During exercised Swap Periods: LTESA pays Σ NQ × (Fixed − Floating); since Floating ≈ Spot > PPA, the LTESA pays normally based on spot vs Fixed. PPA delivers its (below-spot) revenue on contracted volume independently — Operator nets the PPA + LTESA top-up. Net economic effect: Operator takes the PPA price on the contracted PPA volume, and gets the LTESA fully on top against spot.',
              trap: 'Below-market PPA effectively gives away merchant upside the LTESA otherwise lets you keep on the un-PPA\'d portion. Use Contracted Percentage to size LTESA only to the un-PPA\'d MW (not double-stacking the de-risking on the same MW).',
            },
            {
              name: '2. PPA strike ABOVE spot AND PPA < Fixed/Strike Price',
              ppaVsRRP: 'PPA > Spot',
              ppaVsCap: 'PPA < Strike',
              outcome: 'Same as scenario 1 — the swap settlement is independent of PPA pricing. LTESA pays Σ NQ × (Fixed − Floating) on contracted volume. The Operator captures the above-spot PPA premium AND the LTESA support against spot. Best of both worlds within MC1\'s additionality scrutiny.',
              trap: 'During Bid assessment, ASL\'s MC1 modelling uses forecast spot (PEAR + FCAS) — not your PPA contract. If your bid relies on PPA revenue to ramp up Wholesale Market Benefits, that won\'t register. Wholesale Market Benefits scoring is based on the project\'s impact on NSW load cost in market modelling.',
            },
            {
              name: '3. PPA strike ABOVE spot AND above Repayment Threshold Price (non-exercise year)',
              ppaVsRRP: 'PPA > Spot',
              ppaVsCap: 'PPA > RPT',
              outcome: 'In a non-exercised Swap Period (Operator chose not to exercise OR exercise was partial), Repayment = min(HistoricalNetPayments, Σ 50% × NQ × (Floating − RPT)). The Floating Price drives the repayment, NOT the PPA price. Repayment is REDUCED where the Operator has entered an "eligible contract" — so the PPA materially reduces the Repayment burden in this year. The Operator keeps the PPA premium AND has reduced LTESA repayment.',
              trap: 'The "eligible contract" reduction formula sits in the proforma LTESA contract — review directly. The Repayment cap (Historical Net Payments) means cumulative Repayment can\'t exceed cumulative receipts, so the worst-case is "give back what you got". The "eligible contract" reduction further softens this.',
            },
            {
              name: '4. PPA strike below spot, project doesn\'t exercise LTESA option, spot > RPT',
              ppaVsRRP: 'PPA < Spot',
              ppaVsCap: 'PPA < or > RPT depending on level',
              outcome: 'Operator forgoes the LTESA support for that Swap Period (no payment from SFV). Repayment mechanic STILL applies in non-exercise periods: Σ 50% × NQ × (Floating − RPT), capped at Historical Net Payments AND reduced by eligible contracts (PPA). If the project hasn\'t accumulated material Historical Net Payments yet, the cap is low — Repayment is small. The PPA reduces the Repayment further.',
              trap: 'Don\'t over-exercise: nominating Excluded Periods at Bid time signals you won\'t draw LTESA payments in those years, REDUCING Net LTESA Cost in your MC1 score. This is a known competitive lever per the MC1 Briefing.',
            },
          ],
        },
      ],
    },
    hybridDecisionFramework: {
      headline: 'For an Assessed Hybrid ≥4hr (gen-export > storage-export at CP in AC), should you bid the new Hybrid Generation LTESA, the standard Generation LTESA, or BOTH? Now that the gazetted rules are clear, the recommendation in most cases is BOTH (Default + Alternative Bids).',
      dimensions: [
        { name: 'Hybrid eligibility gate', matters: 'Storage ≥4hr duration AT FIRST OPTION DATE (not just COD) AND gen-export > storage-export measured at the Connection Point IN AC. Fail either and you can only bid Generation LTESA. Storage <4hr at COD means MC1 Wholesale Market Benefits = zero in a Hybrid LTESA bid.' },
        { name: 'Net Export vs Sent-Out Generation', matters: 'Hybrid LTESA settles on Net Exports (exports minus battery imports). Wind+BESS that cycles primarily from own-gen wins here. Solar+BESS that mid-day-charges from grid loses Notional Quantity in those intervals. AC vs DC coupling matters: DC-coupled batteries can\'t charge from grid (favoured); AC-coupled can.' },
        { name: '50% price-risk share (Hybrid) vs 100% (Gen LTESA)', matters: 'Hybrid LTESA settles at 50% × (Strike − Floating); Generation LTESA settles at full (Fixed − Floating). The Operator keeps 50% of dispatch-shape upside under Hybrid, vs 0% under Gen LTESA. For a flexible hybrid that can capture price spikes, the 50% retention is highly valuable.' },
        { name: 'Annual Payment Cap mechanic', matters: 'Hybrid: APC = Strike × PRS% × P50 gen. Generation: APC = Fixed × Contracted % × 100% × P50 gen. For a given Fixed/Strike Price, Hybrid APC is smaller than Gen LTESA APC — limiting the worst-case net cost to SFV (which the MC1 modelling penalises less).' },
        { name: 'Performance rebates (Hybrid only)', matters: 'Hybrid LTESA has 3 rebate triggers (Minimum Generation 75% × P90; Availability Factor; Storage Capacity tested), all capped at year\'s net payments from SFV. Generation LTESA has Minimum Generation rebate only (75% × P90). More operational downside risk under Hybrid.' },
        { name: 'PPA / offtake pre-commitments', matters: 'PPA does NOT enter swap settlement during exercise (in either product) — settlement is on spot. PPA DOES reduce Repayment in non-exercise periods via the eligible-contract reduction. If you have a high-strike PPA, focus on Excluded Periods rather than relying on the PPA to offset Repayment risk.' },
        { name: 'Default Bid vs Alternative Bid structuring', matters: 'Submit Default Bid (20yr term) on one product + Alternative Bid (variable term) on the other. ASL assesses each Bid independently on merit — Proponent has multiple competitive paths to win. Per the MC1 Briefing, lower Contract Term reduces Net LTESA Cost.' },
        { name: 'REZ access', matters: 'CWO + SW REZ Access Right holders can bid even if previously awarded an LTESA (EC3 carve-out, subject to FC criteria). REZ access materially improves MC2 grid-connection scoring.' },
        { name: 'COD timing', matters: 'COD before 31 Dec 2029 expected to be considered more favourably (Table 2). Earlier COD captures more high-price years in Wholesale Market Benefits modelling. Beyond 2030 not preferred but not excluded if pathway credible.' },
        { name: 'AEMO July 2025 Gen Info "In Service" status', matters: 'If your project is "In Service" on that page, MC1 Wholesale Market Benefits = zero. Pre-FID projects only for competitive bids.' },
      ],
      cases: [
        {
          caseLabel: 'Wind farm + BESS (≥4hr, gen-export > storage-export)',
          hybridFavoured: 'Hybrid Generation LTESA is usually preferred for wind+BESS because (a) wind\'s natural overnight/evening generation aligns with the price-shifting BESS use case, (b) wind+BESS cycles primarily from own-gen (low grid imports — net-export basis favourable), (c) wind has a generation profile less correlated with solar peak — the dispatch-shape upside Operator retains under 50% PRS is valuable, (d) the 20-yr Default Bid term improves bankability significantly vs 15yr. Submit Default Bid (Hybrid LTESA, 20yr) + Alternative Bid (Gen LTESA, 20yr or shorter) — let ASL pick the lower Net LTESA Cost.',
          generationFavoured: 'Generation LTESA wins outright when (a) BESS is small relative to wind (e.g. <50 MW on 500 MW wind farm) — the 50% PRS dilutes too much support per MW, (b) BESS is short-duration (<4hr, ineligible for Hybrid), (c) wind project is mature with a near-term COD and full LTESA support against Fixed Price gives the cleanest IRR, (d) PPA is already on the gen side covering 50%+ of capacity — Generation LTESA Contracted Percentage <100% gives clean partial-cover.',
          ratiosToTarget: 'Storage = 60-100% of gen export (must be < gen export), duration 4-6 hr. Sweet spot: ~80% storage:gen ratio at 4-5 hr duration. Lower ratios (≤25%) waste the hybrid optionality. The MC1 Briefing notes wind generation profiles attract higher BCR — leverage this by bidding both products.',
        },
        {
          caseLabel: 'Solar farm + BESS (≥4hr, gen-export > storage-export)',
          hybridFavoured: 'Hybrid Generation LTESA materially improves the case vs standalone solar. Solar-only suffers cannibalisation (low Wholesale Market Benefits in MC1); adding ≥4hr BESS lets you shift output into evening peak where prices are highest. Best when (a) BESS sized at 80-100% of gen export, (b) DC-coupled (own-gen charging only — net-export basis cleaner), (c) evening-peak-optimised dispatch profile, (d) site in network-constrained REZ where evening dispatch-weighted prices are volatile. For the gen-export > storage-export gate at CP in AC, ensure your AC-side metering supports the calc.',
          generationFavoured: 'Generation LTESA wins for solar+BESS only when (a) BESS <4hr (ineligible for Hybrid LTESA, AND assessed as zero Wholesale Market Benefits in a Hybrid bid), (b) BESS > gen export (ineligible) — in this case, consider splitting: bid solar gen into Gen LTESA + bid BESS into NSW T9 LDS LTESA separately, (c) project is solar-only without BESS (Hybrid product not available).',
          ratiosToTarget: 'Storage = 80-100% of gen export, ≥4hr (6hr preferred to fully shift solar into evening peak). Solar+BESS at <50% storage:gen ratio likely scores poorly — too little time-shift to materially lift Wholesale Market Benefits.',
        },
      ],
    },
    openQuestions: [
      'Exact "eligible contract" reduction formula in the proforma LTESA contract documents (DOCX) — financial-modelling teams should review the proforma Generation LTESA + proforma Hybrid Generation LTESA contracts directly for the precise mechanic and what qualifies (PPA, offtake, toll, etc.).',
      'Timing of the next AEMO IIO Report — refreshes the Gen Info page anchor for MC1 Wholesale Market Benefits "In Service" zeroing. Not specified in current Guidelines.',
    ],
    bidParamsOptionsDeepDive: {
      headline: 'The bid variables are structurally the same across Gen LTESA and Hybrid LTESA — same 6 variables, just the price label changes (Fixed Price for Gen, Strike Price for Hybrid). What DIFFERS is the settlement multiplier (100% Gen vs 50% Hybrid PRS), the NotionalQuantity basis (Sent-Out Gen vs Net Exports), and the Project Parameters you must submit. Options are ANNUAL — one option per Swap Period (1 July – 30 June, financial year). Partial exercise is allowed via the Nominated Percentage in the Exercise Notice (e.g. exercise 50% of contracted volume that year). Exact Exercise Notice deadline sits in the proforma LTESA; not in the fact sheets.',
      bidVariablesComparison: [
        {
          variable: 'Fixed Price (Gen LTESA) / Strike Price (Hybrid LTESA)',
          genLtesaTreatment: 'Fixed Price ($/MWh, nominal, NO CPI escalation). On exercise, swap settles at (Fixed − Floating). Pure pass-through swap.',
          hybridLtesaTreatment: 'Strike Price ($/MWh, nominal, NO CPI escalation). On exercise, swap settles at 50% × (Strike − Floating). 50% PRS retains operator upside.',
          notes: 'Per MC1 Briefing: this is the BIGGEST single lever on Net LTESA Cost — push down to lift BCR.',
        },
        {
          variable: 'Repayment Threshold Price (RPT)',
          genLtesaTreatment: '$/MWh, nominal, NO CPI escalation. In non-exercise periods, if DWFP > RPT, Operator pays SFV 50% × NQ × (DWFP − RPT).',
          hybridLtesaTreatment: 'Same RPT mechanic; same 50% Repayment percentage. Applies in non-exercise periods and on uncontracted portion of exercised swap.',
          notes: 'Capped at Historical Net Payments received, AND reduced by "eligible contract" (e.g. PPA) reduction.',
        },
        {
          variable: 'Contracted Percentage',
          genLtesaTreatment: '% of P50 generation that can be covered by the LTESA. Sets the upper bound on swap notional volume.',
          hybridLtesaTreatment: 'Same — % of P50 generation covered. Combined with Nominated % in Exercise Notice gives Swap %.',
          notes: 'Can be bid <100% to reduce Net LTESA Cost (per MC1 Briefing). Useful when stacking with a PPA.',
        },
        {
          variable: 'COD Target Date',
          genLtesaTreatment: 'Target date for commercial operations. Earlier = more high-spot years captured in Wholesale Market Benefits modelling.',
          hybridLtesaTreatment: 'Same. Earlier scores higher in MC2 deliverability and MC1 Wholesale Market Benefits.',
          notes: 'COD before 31 Dec 2029 receives favourable consideration (Eraring-aligned). Beyond 2030 not preferred but credible pathway accepted.',
        },
        {
          variable: 'Excluded Periods',
          genLtesaTreatment: 'Swap Periods (annual) the Operator commits AT BID TIME not to exercise. Reduces Net LTESA Cost on excluded years.',
          hybridLtesaTreatment: 'Same. Useful to align with PPA-covered years or high-forecast-spot years where exercising would be counterproductive.',
          notes: 'Per MC1 Briefing: 1-3 excluded periods signal discipline; too many trigger additionality concerns.',
        },
        {
          variable: 'Contract Term',
          genLtesaTreatment: 'Default Bid: FIXED at 20 years. Alternative Bid: variable as a Bid Variable.',
          hybridLtesaTreatment: 'Same — Default 20yr, Alternative variable.',
          notes: 'Shorter term reduces Net LTESA Cost. Useful as Alternative Bid where PPA term covers the bankable horizon.',
        },
      ],
      projectParametersByAssetType: [
        {
          assetType: 'Generation Only',
          paramsRequired: [
            'Generation capacity (MW)',
            'Generation profile (hourly / interval-level)',
            'Forecast P50 annual generation (MWh)',
            'Operational guarantee life',
            'Network Connection Point',
            'Inverter / connection technology',
            'Loss factors (MLF + DLF)',
          ],
        },
        {
          assetType: 'Non-Assessed Hybrid',
          paramsRequired: [
            'All Generation-Only parameters above',
            'Plus storage capacity (MW + MWh) declared for registration completeness, but NOT used in MC1 assessment',
            'Storage operating profile (treated as own-use; outside LTESA)',
          ],
        },
        {
          assetType: 'Assessed Hybrid (BESS <4hr)',
          paramsRequired: [
            'All Generation-Only parameters above',
            'Storage capacity (MW + MWh)',
            'Storage duration at COD',
            'Round-trip efficiency (RTE)',
            'Charging strategy (own-gen vs grid)',
            'AC vs DC coupling',
            'Joint operational guarantee life',
            'Combined dispatch profile (gen + storage)',
          ],
        },
        {
          assetType: 'Assessed Hybrid (BESS ≥4hr, gen-export > storage-export at CP-AC)',
          paramsRequired: [
            'All Assessed Hybrid <4hr parameters above',
            'Confirmation of gen-export > storage-export measured at CP-AC',
            'Storage duration confirmation at First Option Date',
            'Sub-meter installation details (mandatory for Hybrid LTESA)',
            'Aggregated dispatch conformance plan at Connection Point',
            'Storage Project specifications separately documented (per MC1 Briefing §2.2.1 Path C)',
          ],
        },
      ],
      optionStructure: {
        swapPeriod: 'Each Swap Period runs ONE FINANCIAL YEAR — 1 July to 30 June. Confirmed in the Generation LTESA Fact Sheet Table 1: "The fixed duration of the cash settled swap is one financial year. Swap Periods begin on 1 July and end on the following 30 June." Same for Hybrid LTESA.',
        annualExercise: 'Options are exercised ANNUALLY — one option per Swap Period. The LTES Operator can fully exercise, partially exercise, or NOT exercise the option for each Swap Period independently. Confirmed in Gen LTESA Fact Sheet: "Allows for full exercise, partial exercise or no exercise in a swap period."',
        partialExercise: 'Partial exercise is via the NOMINATED PERCENTAGE specified in each Exercise Notice. Per Gen LTESA Fact Sheet: "Swap Percentage = Contracted Percentage × Nominated Percentage, where the Contracted Percentage is a bid variable and the Nominated Percentage is specified by LTES Operator within each Exercise Notice." So if Contracted % = 80% and Operator nominates 50%, the effective Swap % for that year is 80% × 50% = 40%. The Nominated % can theoretically be any value 0–100% per Exercise Notice (continuous, not discrete 25/50/75 steps — but confirm in proforma).',
        exerciseNoticeTiming: 'Exact Exercise Notice deadline is NOT in the public fact sheets — it sits in the proforma LTESA contract document (DOCX). Based on prior NSW LTESA round precedent (T6/T7), Exercise Notices typically must be submitted **3–6 months prior to the Swap Period commencing on 1 July**. So for the FY2026/27 Swap Period (1 Jul 2026 – 30 Jun 2027), the Exercise Notice would likely be due between 1 January 2027 and 1 April 2027. Critically: NOT 6 months before "January 1" — the Swap Period anchors to the **Australian financial year**, not calendar year. Bidders should review the proforma Hybrid Generation LTESA and proforma Generation LTESA directly for the exact timing — this is one of the open questions flagged for due-diligence review.',
        confidence: 'likely',
      },
      partialExerciseExamples: [
        {
          scenario: 'Full exercise — Contracted % 100%, Nominated % 100%',
          contractedPct: 100,
          nominatedPct: 100,
          swapPct: 100,
          effectMW: 500,
          interpretation: 'Operator covers the full 500 MW under LTESA settlement for this Swap Period. Full hedge protection, no merchant retention.',
        },
        {
          scenario: 'Half exercise — Contracted % 100%, Nominated % 50%',
          contractedPct: 100,
          nominatedPct: 50,
          swapPct: 50,
          effectMW: 250,
          interpretation: 'Operator covers 50% of the 500 MW (250 MW) under LTESA for this Swap Period. Remaining 250 MW left to merchant — Operator captures spot upside on the un-exercised half.',
        },
        {
          scenario: 'Quarter exercise — Contracted % 100%, Nominated % 25%',
          contractedPct: 100,
          nominatedPct: 25,
          swapPct: 25,
          effectMW: 125,
          interpretation: 'Only 125 MW under LTESA. Most useful in years where Operator forecasts merchant prices well above Fixed/Strike — exercise just enough to maintain Historical Net Payments for the Repayment cap, while keeping merchant upside on most volume.',
        },
        {
          scenario: 'Pre-committed Contracted % 50% (PPA stack), Nominated % 100%',
          contractedPct: 50,
          nominatedPct: 100,
          swapPct: 50,
          effectMW: 250,
          interpretation: 'Contracted % bid at 50% (PPA covers other 50% of project). Operator exercises fully — 250 MW under LTESA. The 50% PPA + 50% LTESA = full project hedge. This is the typical PPA-stacking pattern.',
        },
        {
          scenario: 'No exercise — Operator forgoes the option',
          contractedPct: 100,
          nominatedPct: 0,
          swapPct: 0,
          effectMW: 0,
          interpretation: 'Operator forgoes LTESA support this year. Fully merchant exposed for the 500 MW. BUT the Repayment mechanic still applies — if Dispatch-Weighted Floating Price > Repayment Threshold Price, Operator pays SFV 50% × NQ × (DWFP − RPT), capped at Historical Net Payments and reduced by eligible contracts (PPA). Useful in known-high-merchant years if the Repayment exposure is acceptable.',
        },
      ],
    },
    bidConfigDeepDive: {
      headline: '"Assessed Hybrid" ≠ "Hybrid LTESA". The first is a PROJECT CATEGORY (Table 1 of the Tender Guidelines). The second is a CONTRACT PRODUCT. They\'re related but distinct — and the MC1 assessment treatment depends on the COMBINATION you pick. Your Project category is locked at registration; you can\'t register Generation-Only and bid Hybrid LTESA. BUT if your Project IS registered as an Assessed Hybrid ≥4hr (gen-export > storage-export at CP-AC), you CAN submit a Default Bid on one product + Alternative Bid on the other — same Project, two bids, each assessed independently.',
      keyDistinction: 'Two layers to think about: (a) PROJECT CATEGORY — what you register the Project as (Generation Only / Non-Assessed Hybrid / Assessed Hybrid <4hr / Assessed Hybrid ≥4hr); this is fixed at registration based on physical configuration. (b) CONTRACT PRODUCT — which LTESA you bid (Generation LTESA / Hybrid Generation LTESA); some Project Categories let you bid either; others are restricted. MC1 assessment treatment is then a function of the COMBINATION — Project Category × Product = different assessment path.',
      projectCategories: [
        {
          category: 'Generation Only',
          whatItIs: 'Standalone solar, wind, or run-of-river hydro asset with NO co-located storage.',
          genLtesaEligible: true,
          hybridLtesaEligible: false,
          mcAssessmentNote: 'Only the Generation asset is assessed under MC. No storage component exists.',
        },
        {
          category: 'Non-Assessed Hybrid',
          whatItIs: 'Gen + co-located storage, but the storage is NOT submitted for MC assessment — the Proponent elects to bid as if it\'s gen-only. Storage exists physically but doesn\'t factor into MC1 scoring or LTESA contract.',
          genLtesaEligible: true,
          hybridLtesaEligible: false,
          mcAssessmentNote: 'Only the Generation asset is assessed under MC. Storage is "outside" the LTESA — Proponent retains all storage merchant upside but gets no MC credit for it.',
        },
        {
          category: 'Assessed Hybrid (BESS <4hr)',
          whatItIs: 'Gen + co-located storage where the Proponent elects to have BOTH gen and storage assessed under MC. Storage duration is less than 4 hours. INELIGIBLE for Hybrid LTESA because it fails the 4hr gate.',
          genLtesaEligible: true,
          hybridLtesaEligible: false,
          mcAssessmentNote: 'BOTH Generation AND Storage assets assessed under MC (WMB, SSC, SSS). Net LTESA Cost uses Generation LTESA payment mechanics.',
        },
        {
          category: 'Assessed Hybrid (BESS ≥4hr, gen-export > storage-export at CP-AC)',
          whatItIs: 'Gen + co-located storage where (a) storage capacity at First Option Date reflects ≥4 hours, AND (b) generation export capacity exceeds storage export capacity measured at the Connection Point IN AC. This is the ONLY category eligible for the new Hybrid Generation LTESA — and it can ALSO bid the standard Generation LTESA.',
          genLtesaEligible: true,
          hybridLtesaEligible: true,
          mcAssessmentNote: 'BOTH Generation AND Storage assets assessed under MC. Assessment treatment depends on which product is bid — see Assessment Paths below.',
        },
      ],
      assessmentPaths: [
        {
          pathLabel: 'Non-Assessed Hybrid → Generation LTESA',
          mcComponentsAssessed: 'MC1 considers the GENERATION asset only. Wholesale Market Benefits, System Strength Contribution, System Security Services all calculated on gen alone. Storage is invisible to MC1.',
          netLtesaCostMechanic: 'Generation LTESA payment mechanics: full (Fixed Price − max(0, Floating)) swap on Sent-Out Generation.',
          keyInsight: 'You give up MC credit for the storage component. Useful if your storage is small / short-duration / sized for own-use and you don\'t want it complicating the bid.',
        },
        {
          pathLabel: 'Assessed Hybrid → Generation LTESA',
          mcComponentsAssessed: 'MC1 considers BOTH Generation Project AND Associated (Storage) Project for Wholesale Market Benefits, System Strength Contribution, System Security Services. Storage operations contribute to the modelled NSW load-cost reduction.',
          netLtesaCostMechanic: 'Generation LTESA payment mechanics — Net LTESA Cost calculation is aligned with the standard Generation LTESA (NOT the Hybrid LTESA). So you get hybrid uplift on the benefit side, but the cost side is computed as if you were a pure-gen bid.',
          keyInsight: 'This is the "hybrid benefit, simple cost" path. Wholesale Market Benefits get the storage uplift (the battery shifts gen into peaks, raising WMB), but Net LTESA Cost is the simpler Gen LTESA mechanic — useful if you want the BCR boost from storage WMB without the 50% PRS complexity.',
        },
        {
          pathLabel: 'Assessed Hybrid → Hybrid Generation LTESA',
          mcComponentsAssessed: 'MC1 considers BOTH Generation Project AND Storage Project for Wholesale Market Benefits, Net LTESA Cost, System Strength Contribution, System Security Services. Full hybrid integration.',
          netLtesaCostMechanic: 'Hybrid Generation LTESA payment mechanics: 50% × (Strike − Floating) swap on Sent-Out Net Exports. The 50% PRS lowers the modelled Net LTESA Cost per MWh vs Gen LTESA at the same Strike — typically the BCR-winning path.',
          keyInsight: 'This is the BCR-maximising path for an Assessed Hybrid ≥4hr. The Hybrid LTESA\'s 50% PRS structurally lowers Net LTESA Cost (the BCR denominator), while WMB still gets the hybrid benefit on the numerator. Most Assessed Hybrids ≥4hr should bid this — but should ALSO submit an Alternative Bid on Gen LTESA to give ASL optionality.',
        },
      ],
      registrationLockIn: 'The Project Category is determined by the Project\'s physical configuration as REGISTERED. You complete the registration form with the Project\'s gen + storage capacity, AC/DC coupling, Connection Point in AC, etc. The category is then inferred from those parameters. You CANNOT register as Generation Only and later submit an Alternative Bid as a Hybrid — the storage doesn\'t physically exist in the registered Project. Conversely, if you register as an Assessed Hybrid ≥4hr, you have flexibility to bid either product. The registration step happens BEFORE bidding, with Registration Closing Date 22 June 2026 (5pm AEST) and Bid Closing Date 6 July 2026 (10am AEST) — so you have a ~2-week window between confirming Project Category and submitting Bids.',
      combinationExamples: [
        {
          scenario: '500 MW solar + 250 MW / 1,000 MWh BESS (4-hr duration). Gen-export 500 MW, storage-export 250 MW at CP-AC. Assessed Hybrid ≥4hr.',
          defaultBid: 'Hybrid Generation LTESA, Default Bid (Contract Term fixed 20yr), Strike Price $55/MWh, Contracted % 100%, Repayment Threshold Price $130/MWh.',
          alternativeBid: 'Generation LTESA, Alternative Bid (Contract Term 15yr), Fixed Price $70/MWh, Contracted % 50%, Repayment Threshold Price $140/MWh.',
          strategy: 'Two Bids on the same Project. Hybrid LTESA Default targets the BCR-winning path (50% PRS lowers Net LTESA Cost). Generation LTESA Alternative gives ASL optionality — if the Hybrid LTESA bid scores marginally on Net LTESA Cost, the Gen LTESA alternative may slot in at a different bid envelope. ASL assesses each Bid independently on merit.',
        },
        {
          scenario: '300 MW wind + 50 MW / 100 MWh BESS (2-hr duration). Storage <4hr.',
          defaultBid: 'Generation LTESA, Default Bid (Contract Term 20yr), Fixed Price $60/MWh, Contracted % 80%, Repayment Threshold Price $130/MWh.',
          alternativeBid: undefined,
          strategy: 'Storage is <4hr, so Hybrid LTESA is OFF THE TABLE. Only Generation LTESA is bid-able. Proponent must choose: bid as Assessed Hybrid (storage gets MC credit on WMB/SSC/SSS but no Hybrid LTESA), or bid as Non-Assessed Hybrid (storage invisible to MC1). Either way, Net LTESA Cost uses Gen LTESA mechanics.',
        },
        {
          scenario: '400 MW solar (no storage). Generation Only.',
          defaultBid: 'Generation LTESA, Default Bid (Contract Term 20yr), Fixed Price $50/MWh, Contracted % 100%, Repayment Threshold Price $120/MWh.',
          alternativeBid: 'Generation LTESA, Alternative Bid (Contract Term 15yr), Fixed Price $45/MWh, Contracted % 100%, same RPT.',
          strategy: 'No storage — no Hybrid LTESA path. Alternative Bid varies Contract Term as the differentiator. Solar-only bids face structural cannibalisation in WMB (low evening output), so the bid economics are tight.',
        },
      ],
    },
    ppaLeverageDeepDive: {
      headline: 'YES — a PPA gives you real leverage to lower bid parameters. The dominant 49% MC1 limb scores on the Benefit-Cost Ratio: Wholesale Market Benefits ÷ Net LTESA Cost. A PPA covering part of your volume means you don\'t need the LTESA to fully de-risk the whole project — you can bid lower Contracted Percentage, lower Fixed/Strike Price, higher Repayment Threshold, more Excluded Periods, or a shorter Contract Term. Each move lowers Net LTESA Cost (the BCR denominator), lifting your MC1 score. But the limits are real — go too far and you bust financier minima, fail additionality, or trigger MC3 deliverability concerns.',
      mechanism: 'MC1\'s dominant scoring metric is the Benefit-Cost Ratio: Wholesale Market Benefits ($NPV reduction in NSW load cost from your project) divided by Net LTESA Cost ($NPV cost to SFV from your bid). Wholesale Market Benefits depend on your project\'s physical impact on NSW prices — your generation profile, network location, technology — NOT on your bid parameters. Net LTESA Cost depends entirely on your Bid Variables. So the path to a high BCR is: hold the numerator constant (delivered by good project fundamentals) and push the denominator DOWN by bidding tighter parameters. A PPA is the enabler — it provides external revenue certainty that lets you defensibly trim the LTESA support level without compromising bankability. Per the gazetted MC1 Briefing §3 ("Characteristics of high performing Bids"): "A low Net LTESA Cost is a key driver for Bid success."',
      leveragePoints: [
        {
          lever: '1. Lower Contracted Percentage (the biggest single lever)',
          howItWorks: 'If your PPA covers 50% of P50 generation at $90/MWh, you don\'t need LTESA cover on that 50%. Bid Contracted Percentage at 50% (or less) — the LTESA only underwrites the un-PPA\'d volume. The MC1 Briefing explicitly states "A Contracted Percentage of less than 100% can reduce Net LTESA Cost, all else being equal." A 250 MW LTESA on a 500 MW project (50% Contracted) is half the support volume of a 500 MW LTESA on the same project — and Wholesale Market Benefits are still credited on the full 500 MW.',
          mc1Impact: 'Direct cut to Net LTESA Cost denominator → BCR rises ~linearly with Contracted % reduction. Most leverage on MC1 per unit of "give-back".',
          theLimit: 'A low Contracted % paired with a HIGH Fixed/Strike Price doesn\'t help — Net LTESA Cost is calculated on the whole bid package. Per MC1 Briefing: "A low Contracted Percentage would not always lead to a low Net LTESA Cost, for example if a Proponent bids a low Contracted Percentage but comparatively high Fixed Price/Strike Price." Also, financiers may want enough LTESA cover to support the merchant slice — if the un-PPA\'d portion has no LTESA, it\'s pure spot exposure.',
        },
        {
          lever: '2. Lower Fixed Price (Gen LTESA) or Strike Price (Hybrid)',
          howItWorks: 'The PPA absorbs the price-risk on its slice of generation. The LTESA only needs to backstop the un-PPA\'d merchant slice. If your PPA at $90 is locked in and you\'re comfortable with $55-60 as the credit-worthy floor on merchant exposure, you can bid Fixed Price at $55 instead of $75. Per MC1 Briefing: "it is expected that the Fixed/Strike price has a greater influence on Net LTESA Cost and MC1 outcomes (all else being equal), compared with the Repayment Threshold Price." Fixed/Strike is the highest-leverage single price.',
          mc1Impact: 'Strong cut to Net LTESA Cost — lower Fixed/Strike means smaller settlement payments from SFV in low-spot years, which dominates the modelling.',
          theLimit: 'Financier debt-service ratios set a floor on the credit-worthy revenue mix. If the lender requires (PPA $/MWh × PPA volume) + (LTESA floor × LTESA volume) ≥ debt-service target, then Fixed/Strike has a hard minimum. Also, very low Fixed/Strike may trigger MC3 deliverability concerns (does the project genuinely reach FC?).',
        },
        {
          lever: '3. Higher Repayment Threshold Price',
          howItWorks: 'RPT is the spot-price level above which the Operator pays SFV 50% of the excess in non-exercise periods. A higher RPT means a wider "free zone" where the Operator keeps merchant upside. With a PPA giving you solid revenue floor on contracted volume, you can be more comfortable bidding higher RPT — you\'re not exposed if you forgo exercising and prices spike. Per MC1 Briefing: low RPT contributes to competitiveness, but "the Fixed/Strike Price has a greater influence" — so RPT is secondary.',
          mc1Impact: 'Smaller (but real) cut to Net LTESA Cost via reduced expected Repayment cashflows. Less impact than Fixed/Strike or Contracted Percentage but still meaningful.',
          theLimit: 'A very high RPT may not be credibly competitive — ASL\'s modelling assumes both Perfect Foresight and Always Exercise scenarios; if your RPT is so high that the LTESA rarely triggers Repayment, the value to SFV is minimal and your bid\'s "consumer benefit" looks thin.',
        },
        {
          lever: '4. More Excluded Periods (years where you commit NOT to exercise)',
          howItWorks: 'Each Excluded Period is a Swap Period the Operator commits at bid time NOT to exercise — i.e. forgoing LTESA payments in that year. Per MC1 Briefing: "Some Bids have been able to exclude at least one Swap Period. This has indicated that a Project will not be reliant on LTESA payments in that period." A PPA covering early years (when merchant prices forecast high) gives you confidence to exclude years 1-3, signalling you don\'t need the LTESA in those years.',
          mc1Impact: 'Cuts Net LTESA Cost on the excluded years (no payments from SFV). Particularly effective if the excluded years are forecast high-spot — those are exactly the years SFV would otherwise pay nothing (because Spot > Fixed) but you also wouldn\'t be receiving payment. Net effect: signals discipline.',
          theLimit: 'Excluding TOO MANY periods signals the project doesn\'t genuinely need the LTESA — additionality / value-for-money scrutiny. If you can exclude 10 of 20 years, ASL will ask why you need the LTESA at all. Sweet spot: 1-3 excluded years aligned with the highest-merchant-forecast period.',
        },
        {
          lever: '5. Shorter Contract Term (Alternative Bid only)',
          howItWorks: 'Under Default Bid the Contract Term is fixed at 20 years. But Alternative Bid lets you bid Contract Term as a Bid Variable. A long-tenor PPA (e.g. 15-year offtake) might make a 15-year LTESA acceptable to financiers — the LTESA and PPA together cover the bankable horizon. Per MC1 Briefing: "Competitive Projects may reduce their Net LTESA Cost by bidding in a way that the Support Period is shorter."',
          mc1Impact: 'Cuts Net LTESA Cost by removing late-year cashflows from the NPV calc. Particularly effective if late years have unfavourable forecasts.',
          theLimit: 'If the PPA term is shorter than the asset life, you still need long-tail revenue support. Also, a short LTESA term reduces the "additional capacity to consumers" framing — MC1 BCR may not justify if the term is too truncated.',
        },
      ],
      hardLimits: [
        'EC10: Cannot hold both LTESA and CISA on the same Project. If you have a CISA in place (or are in active CIS negotiations), you commit NOT to execute the CISA if awarded an LTESA. There\'s no way around this — it\'s a hard rule.',
        'EC3: Cannot have previously been awarded an LTESA on this Project (carve-outs: terminated prior LTESA by Bid Closing Date; or CWO/SW REZ Access Right holder where the Project has not achieved Finance and Construction Criteria).',
        'EC10 also catches "financial support in the form of Project capital support, periodic payments or revenue underwriting from State or Commonwealth government" — so a State grant supporting >50% of capacity blocks LTESA eligibility (subject to specific carve-outs for non-concessional CEFC, LGCs, etc).',
        'Your PPA contract may have offset / change-of-law / revenue-sharing clauses that interact with the LTESA. A typical "lender-of-last-resort" PPA assumes specific revenue treatment — must be audited against the LTESA settlement formula before stacking.',
      ],
      softLimits: [
        'Financier debt-service requirements set a hard floor on the credit-worthy revenue mix. The (PPA × volume) + (LTESA floor × volume) + (any other contracted revenue) must clear lender DSCR targets across the financing tenor. Strip too much LTESA support and FC becomes unbankable.',
        'MC1 BCR balance: pushing Net LTESA Cost too far down (via low Fixed/Strike + low Contracted % + high RPT + many Excluded Periods) reduces the LTESA hedge value to consumers AND signals to ASL that the project doesn\'t really need the LTESA. The BCR formula rewards LOW cost but the assessment ALSO judges value-for-money holistically.',
        'MC3 deliverability (17%): your bid must show a credible Financial Close pathway. ASL scrutinises whether your financing strategy is robust — if your bid relies on PPA + thin LTESA, expect questions on PPA execution status, counterparty creditworthiness, and FC certainty.',
        'Additionality: if the PPA already fully de-risks the project, ASL may question whether the LTESA is genuinely needed (failing MC1 value-for-money). A partial PPA (30-70% of P50) is the sweet spot where the LTESA is clearly value-adding.',
        'PPA counterparty consent: many PPAs grant the buyer exclusive offtake rights or require notification of revenue-support contracts. Stacking an LTESA on the same volume may need PPA buyer consent or amended PPA terms.',
      ],
      balancingAct: 'The PPA + LTESA stack works best when the PPA covers a partial volume (typically 30-70% of P50 generation), and the LTESA bid is calibrated to: (a) deliver a low enough Net LTESA Cost to win MC1 BCR, (b) provide enough hedge value on the un-PPA\'d volume that financiers will fund FC, and (c) maintain enough MC1 Wholesale Market Benefits visibility that ASL sees clear consumer value. There\'s a Goldilocks zone — too aggressive on bid trimming and you lose MC3 (deliverability) + raise additionality flags; too conservative and your Net LTESA Cost is uncompetitive vs PPA-stacked rivals. The most competitive bids in prior LTESA rounds have used a partial PPA (50% typical) + Contracted % matching the un-PPA\'d portion + Fixed/Strike close to the un-PPA\'d merchant floor + Excluded Periods in the highest-forecast-spot years.',
      workedScenario: {
        headline: 'Same 500 MW wind farm (1,500 GWh P50). NO PPA bid vs WITH-PPA bid (50% PPA @ $90/MWh, 15-yr term). Strike Prices illustrative.',
        noPpa: {
          label: 'NO PPA — Project relies fully on LTESA + merchant',
          contractedPct: 100,
          fixedPrice: 75,
          rpt: 130,
          netLtesaCost: 'HIGH — full notional × full hedge depth',
          rationale: 'Without a PPA, financiers demand high LTESA support to reach FC. Operator bids 100% Contracted (full 1,500 GWh under LTESA), Fixed Price $75/MWh (matches their unhedged break-even), RPT $130 (slightly above forecast mid-spot). LTESA delivers full revenue floor — but Net LTESA Cost is high → BCR mediocre → competitive position weaker.',
        },
        withPpa: {
          label: 'WITH 50% PPA at $90/MWh — Project flexes bid parameters',
          contractedPct: 50,
          fixedPrice: 55,
          rpt: 160,
          netLtesaCost: 'LOW — half notional × shallower hedge',
          rationale: 'With PPA covering 50% (750 GWh at $90/MWh), Operator bids 50% Contracted (only the un-PPA\'d 750 GWh under LTESA). Fixed Price drops to $55/MWh — the financier floor on the merchant slice (un-PPA\'d) is lower because the PPA $90 underpins the project economics. RPT rises to $160 (Operator confident they won\'t exercise in high-spot years; PPA gives revenue floor regardless). Excluded Periods: years 1-3 (PPA years where forecast spot is high). Net LTESA Cost is MUCH lower → BCR materially better → strong competitive position.',
        },
      },
    },
    riskShareDeepDive: {
      headline: 'How the 50% price-risk share works — and why the Hybrid LTESA isn\'t just a half-strength Generation LTESA.',
      mechanicsExplainer: 'Both LTESA products are option-style: each year the Operator chooses whether to exercise the LTESA option for that Swap Period (1 financial year, 1 July – 30 June). On exercise, the products settle differently. **Generation LTESA** is a full pass-through swap: settlement = NotionalQuantity × (Fixed Price − max(0, Floating Price)). The Operator gives up all spot upside above Fixed and is fully insulated from spot downside below Fixed. **Hybrid Generation LTESA** is a 50:50 price-risk share: settlement = NotionalQuantity × 50% × (Strike Price − Floating Price), where NotionalQuantity is computed on Net Exports (exports minus battery imports) and = 0 in negative-spot intervals. The Operator retains 50% of the spot exposure — winning 50% of the upside when spot > Strike, and absorbing 50% of the downside when spot < Strike.',
      whenItApplies: [
        { context: 'Exercise periods (Operator exercises the LTESA option for a Swap Period)', behaviour: 'The 50% multiplier applies to the swap settlement: NQ × 50% × (Strike − Floating). For Generation LTESA, no multiplier (full swap).' },
        { context: 'Non-exercise periods (Operator forgoes the option — also applies to uncontracted portion in exercise years)', behaviour: 'The 50% applies in the OTHER direction — the Repayment mechanic: if Floating > Repayment Threshold Price, Operator pays SFV 50% × NQ × (Floating − RPT), capped at Historical Net Payments. **Same 50% applies to BOTH products in non-exercise periods.** The PPA-as-eligible-contract reduction further softens this.' },
        { context: 'Symmetric design across the year', behaviour: 'The 50% is the universal sharing percentage — exercise periods (50% of upside/downside via swap), non-exercise periods (50% of high-price windfall via Repayment). Operator and SFV share price risk equally in both directions.' },
      ],
      batteryChargingExplainer: 'The Hybrid LTESA settles on **Sent-Out Net Exports** (gross exports minus gross imports, intervalbyinterval). When the battery charges from the grid (AC-coupling) or from co-located gen (DC-coupling), the imports show up as negative components in the Notional Quantity calculation for that interval. Concretely: if the battery charges 100 MW from grid for an hour at $20/MWh spot, that interval has −100 MWh net exports. If the battery then discharges 100 MW for an hour at $200/MWh, that interval has +100 MWh net exports. The LTESA settles on the NET physical flow. Critically: **NotionalQuantity = 0 when spot < $0/MWh** (negative spot intervals), so the Operator isn\'t forced to pay SFV during negative-price periods even if technically dispatching. The net-export basis means the LTESA can\'t be gamed by charging at low prices to inflate the strike-vs-spot delta — the import volume cancels out. DC-coupled hybrids (battery only charges from own gen, never from grid) have a cleaner net-export profile than AC-coupled (which can import from grid). The MC1 Briefing notes that an AC-coupling vs DC-coupling decision is the Proponent\'s — both eligible — but the economics differ via the net-export accounting.',
      whyFiftyPercent: 'ASL designed the 50% PRS to balance three objectives: (1) **Project bankability** — the Operator still gets meaningful price-floor support to reach Financial Close, but at half the per-MWh subsidy of the Generation LTESA, lowering Net LTESA Cost in MC1 scoring. (2) **Operator dispatch incentive** — by retaining 50% of price upside, the Operator is incentivised to dispatch the battery efficiently (charge at low prices, discharge at high prices) rather than running it passively. A full 100% swap would dampen this dispatch incentive. (3) **Consumer value-sharing** — SFV (and ultimately NSW electricity customers via DNSPs) capture 50% of the price-risk-share benefit, which feeds into the lower Net LTESA Cost figure that MC1 rewards. ASL consulted (Jan-Feb 2026) on alternative structures including 80%/20% asymmetric downside protection but settled on symmetric 50% in the gazetted Hybrid Generation LTESA (May 2026). The symmetric design also mirrors the existing 50% Repayment percentage carried through from prior LTESA rounds.',
      workedExamples: [
        {
          scenario: 'Low-spot year ($40/MWh) — exercising',
          spotPrice: 40,
          bidStrike: 65,
          generationMWh: 1_500_000,
          genLtesaCashflow: 37.5,      // 1.5M × (65 − 40) = 37.5M (SFV → Op)
          hybridLtesaCashflow: 18.75,  // 1.5M × 50% × (65 − 40) = 18.75M (SFV → Op)
          effectivePriceGen: 65,       // Op realises: 40 spot + 25 LTESA = 65 (locked-in)
          effectivePriceHybrid: 52.5,  // Op realises: 40 spot + 12.50 LTESA = 52.50
          interpretation: 'Gen LTESA fully de-risks the operator to the Fixed Price. Hybrid LTESA captures half the downside protection — but the operator can use battery flexibility (not modelled here) to time-shift export volume into higher-price intervals, recovering some merchant upside.',
        },
        {
          scenario: 'Mid-spot year ($80/MWh) — exercising',
          spotPrice: 80,
          bidStrike: 65,
          generationMWh: 1_500_000,
          genLtesaCashflow: -22.5,     // 1.5M × (65 − 80) = -22.5M (Op → SFV)
          hybridLtesaCashflow: -11.25, // 1.5M × 50% × (65 − 80) = -11.25M (Op → SFV)
          effectivePriceGen: 65,       // Op realises: 80 spot − 15 LTESA = 65 (locked-in)
          effectivePriceHybrid: 72.5,  // Op realises: 80 spot − 7.50 LTESA = 72.50
          interpretation: 'Spot above Strike — Operator pays SFV under both products. Gen LTESA caps the realised price at Fixed = $65; Hybrid retains 50% of the $15 upside, so the Operator realises $72.50/MWh. The 50% PRS is genuinely valuable here.',
        },
        {
          scenario: 'High-spot year ($150/MWh) — exercising',
          spotPrice: 150,
          bidStrike: 65,
          generationMWh: 1_500_000,
          genLtesaCashflow: -127.5,    // 1.5M × (65 − 150) = -127.5M
          hybridLtesaCashflow: -63.75, // 1.5M × 50% × (65 − 150) = -63.75M
          effectivePriceGen: 65,       // Op realises: $150 − $85 = $65 (locked-in)
          effectivePriceHybrid: 107.5, // Op realises: $150 − $42.50 = $107.50
          interpretation: 'In a high-spot year, the 50% PRS lets the Operator participate substantially in the upside — realised $107.50/MWh vs $65 under Gen LTESA. The Operator should consider NOT exercising the option this year (see next row).',
        },
        {
          scenario: 'High-spot year ($150/MWh) — NOT exercising (Repayment trigger if spot > RPT)',
          spotPrice: 150,
          bidStrike: 65,             // Strike not used; RPT = $120 (illustrative bid)
          generationMWh: 1_500_000,
          genLtesaCashflow: -22.5,     // 1.5M × 50% × (150 − 120) = -22.5M (Repayment) — capped at Historical Net Payments
          hybridLtesaCashflow: -22.5,  // SAME 50% Repayment for both products in non-exercise
          effectivePriceGen: 135,      // Op realises: $150 − $15 Repayment = $135
          effectivePriceHybrid: 135,
          interpretation: 'If the Operator forgoes (or partially forgoes) the LTESA option, the Repayment mechanic applies WHEN spot > Repayment Threshold Price. 50% × (Spot − RPT) flows back to SFV, but capped at Historical Net Payments received. PPA reduces this via "eligible contract" carveout. Operator captures $135/MWh — better than the $107.50 Hybrid-exercise or $65 Gen-exercise outcome.',
        },
        {
          scenario: 'Charging interval (Hybrid only): battery imports 100 MW from grid for 1 hour at $20/MWh',
          spotPrice: 20,
          bidStrike: 65,
          generationMWh: -100,         // NEGATIVE 100 MWh net export for this interval
          genLtesaCashflow: 0,         // Gen LTESA settles on gen, not net export — charging doesn't apply
          hybridLtesaCashflow: -0.00225, // -100 × 50% × (65 − 20) / 1M = -0.00225M (negligible)
          effectivePriceGen: 0,         // N/A for this charging interval
          effectivePriceHybrid: 0,
          interpretation: 'During a battery-charging interval, Hybrid LTESA NQ is NEGATIVE (imports > exports). Settlement = NQ × 50% × (Strike − Floating). With Strike $65 > Floating $20, the product is positive, but NQ is negative — so Op effectively pays SFV a tiny amount for the imported MWh. This prevents the Operator from gaming the LTESA by importing cheap energy to lock in subsidy. Discharge later at $200 gives +100 MWh NQ × 50% × ($65 − $200) = −$6.75k (Op pays SFV the 50% upside) — net of charge/discharge, the Operator captures the arbitrage spread minus the LTESA share.',
        },
      ],
    },
  },

  // ---------------------------------------------------------------
  // NSW ROADMAP — Tender 9 (Long-Duration Storage LTESA) — OPEN
  // ---------------------------------------------------------------
  {
    id: 'nsw-roadmap-tender-9-lds',
    scheme: 'LTESA',
    roundCode: 'NSW T9',
    name: 'NSW Roadmap Tender 9 — Long-Duration Storage LTESA',
    administrator: 'ASL — AusEnergy Services Ltd (NSW Consumer Trustee)',
    status: 'open',
    techFocus: 'Long-Duration Storage (≥8-hour duration)',
    region: 'NSW',
    targetMW: 1500,
    targetMWh: 12000,
    targetLabel: '~12 GWh / ~1.5 GW (≥8h)',
    opened: '2026-05-20',
    registrationsClose: '2026-06-30',
    bidsClose: '2026-07-06',
    resultsExpected: 'late 2026',
    targetCOD: 'Indicative ~2034 horizon; earlier COD scores higher',
    contractMechanism: 'LDS LTESA — option-style annuity, same mechanism as T5/T6. Operator bids an Annuity Cap ($/MW/yr) + Net Revenue Threshold + term (14-yr typical for BESS, up to 40-yr for pumped hydro / A-CAES). 50% revenue-share repayment above threshold, capped at payments received.',
    configFavoured: 'storage',
    meritCriteria: [
      { label: 'Financial value & system benefits', tests: 'Benefit-Cost Ratio + system benefits. Inferred to resemble the T6 LDS framework (MC5+MC6 ~45%), updated — exact T9 weightings table not yet published.' },
      { label: 'System strength & security services', tests: 'NEW emphasis — grid-forming inverters, synchronous operation/inertia, frequency/voltage control, system restart. Favours pumped hydro / A-CAES.' },
      { label: 'Deliverability', tests: 'Planning, connection, financing maturity.' },
      { label: 'Organisational capacity & social value', tests: 'Track record + community/First Nations benefit.' },
    ],
    headline: 'The deep-storage companion to T8 — ≥8-hour duration, with new weight on system-strength services that favours pumped hydro and A-CAES.',
    whatChanged: [
      { area: 'Merit criteria', detail: 'New explicit emphasis on system strength & system-security service provision (grid-forming, inertia, frequency/voltage control, system restart) — favouring pumped hydro / A-CAES as system-strength solutions that defer network cost, alongside 8h+ BESS.' },
      { area: 'Eligibility', detail: '≥8-hour duration, minimum 5 MW.' },
      { area: 'Target', detail: '~12 GWh (~1.5 GW) per the 2025 IIO Report development pathway.' },
    ],
    analystRead: 'T9 LDS rewards genuinely long-duration, system-strengthening assets. The added system-security limb tilts the field toward pumped hydro and A-CAES (which also carry 40-year LTESA terms) and 8-hour-plus BESS, over the 2–4 hour batteries that dominate the federal CIS dispatchable rounds. The competitive lever remains a tight Annuity Cap against a strong, well-located benefit case.',
    commitmentEligibility: {
      summary: 'Targets pre-FID storage — committed-after-14-Nov-2019 additionality; the LTESA exists to get LDS to financial close.',
      cutoffDate: '14 November 2019 (NSW EII Roadmap commitment date)',
      detail: 'Same NSW Roadmap additionality basis as Tender 8: the LDS LTESA targets projects that became committed after 14 November 2019 and is explicitly framed as support for ≥8-hour storage that would not otherwise reach financial close. A project already at FID without needing the support is not the target; a pre-FID pumped-hydro / A-CAES / 8h+ BESS project is. The exact T9 commitment threshold sits in the gazetted Tender Guidelines (not yet public).',
      confidence: 'likely',
    },
    playbook: [
      'Lead with duration: ≥8h is the floor — deeper storage + long asset life lifts the benefit-cost numerator.',
      'Sell system-strength: grid-forming inverters, inertia, system-restart capability now score explicitly.',
      'Pumped hydro / A-CAES: lean into the 40-yr term + network-deferral value — this round is more receptive than any CIS dispatchable round.',
      'Bid the tightest credible Annuity Cap — the T6 benchmark was ~$150k/MW/yr for BESS, ~$155k/MW/yr for PHES/A-CAES.',
      'Strong network location beats raw size — site where you defer transmission/network cost.',
    ],
    caveats: [
      'The T9 LDS merit-criteria weightings table is NOT yet published — the framework is inferred to resemble the T6 LDS structure with added system-strength emphasis.',
      'Target (~12 GWh) is from the 2025 IIO Report development pathway, not a gazetted tender quantum.',
    ],
    sources: [
      { label: 'energy-storage.news — NSW LDS tender (20 May 2026)', url: 'https://www.energy-storage.news/' },
      { label: 'ASL — Tender Round 6 outcomes note (30 Jan 2026, LDS benchmarks)', url: 'https://www.aemoservices.com.au/' },
      { label: 'pv-tech — NSW Tender 8/9 (21 May 2026)', url: 'https://www.pv-tech.org/' },
    ],
  },

  // ---------------------------------------------------------------
  // FEDERAL CIS — Tender 8 (NEM Dispatchable) — EVALUATING
  // ---------------------------------------------------------------
  {
    id: 'cis-tender-8-nem-disp',
    scheme: 'CIS',
    roundCode: 'CIS T8',
    name: 'CIS Tender 8 — NEM Dispatchable',
    administrator: 'DCCEEW (Commonwealth), tenders run by AEMO + ASL (AusEnergy Services Ltd)',
    status: 'evaluating',
    techFocus: 'Clean dispatchable storage (≥2-hour minimum; "4-hour equivalent" capacity conversion for the 16 GWh target)',
    region: 'NEM-wide — NSW + VIC have RETA carve-out allocations (~0.2 + 0.1 GW); remaining ~3.7 GW contestable across NEM',
    targetMW: 4000,
    targetMWh: 16000,
    targetLabel: '4 GW / 16 GWh (4-hr equivalent)',
    opened: '2025-11-28',
    registrationsClose: '2026-01-23',
    bidsClose: '2026-02-06',
    resultsExpected: 'Jun 2026',
    targetCOD: 'Before 31 December 2030 (credible pathway required; earlier COD scores higher under MC2)',
    contractMechanism: 'CISA cap & collar — single-stage bid; up to 15-yr Support Period. Gazetted annual cashflow formula (per MC1 briefing §4.5.2): if Net Operational Revenue (NOR) < Annual Floor, Australian Government pays Annual Support Amount = min(90% × (AF − NOR), Annual Payment Cap). If NOR > Annual Ceiling, Operator repays Annual Revenue Sharing Amount = min(50% × (NOR − AC), Annual Payment Cap). Between Floor and Ceiling: zero settlement. Bid variables: Final Support End Date, Annual Floor ($/yr), Annual Ceiling ($/yr), Annual Payment Cap ($/yr) — each can be a flat nominal $ figure or a year-by-year schedule. Floor support % (90%) and ceiling sharing % (50%) are FIXED by Government, not bid.',
    configFavoured: 'storage',
    meritCriteria: [
      { label: 'MC1 — Financial value, system reliability & system benefits', weightPct: 50, tests: 'Five Components: Reliability Contribution (firm MW), Renewable Energy Contribution (MWh + optional Network Capacity Support multiplier), Wholesale Market Benefits ($NPV via load-cost reduction), System Security Services, Net CISA Cost ($NPV). Scoring Metrics: RCR (MW/$), RECCR (Contribution/$), BCR (Ratio), System Security, Max Liability ($). Modelled across 3 Electricity Market Scenarios (Central / Low / High) + 2 Reliability Scenarios.' },
      { label: 'MC2 — Project deliverability and timeline', weightPct: 12.5, tests: 'Development plan + schedule; network connection approval progress; planning + environmental approvals (incl. EPBC). Earlier credible COD scores higher.' },
      { label: 'MC3 — Organisational, resource & financing capability', weightPct: 12.5, tests: 'Track record, contracting model + resourcing, development funding (incl. Performance Security), financing strategy.' },
      { label: 'MC4 — First Nations participation & benefits sharing', weightPct: 12.5, tests: 'FPIC-aligned engagement, dedicated FN lead, economic participation (NSW FN Guidelines target ≥3%), employment + workforce development.' },
      { label: 'MC5 — Social outcomes & community benefits sharing', weightPct: 12.5, tests: 'Community engagement (IAP2 Collaborate level), co-designed shared benefits, local supply chain (Australian Skills Guarantee), employment + workforce development.' },
    ],
    headline: 'The 4 GW / 16 GWh dispatchable round — bids closed 6 Feb 2026, results due June 2026. Tender Guidelines gazetted Nov 2025; full MC1 briefing now public with the CISA cashflow formula and 5-Component scoring approach.',
    whatChanged: [
      { area: 'Process', detail: 'Single-stage bidding (full merit + financial bid submitted together). 5 merit criteria with gazetted weightings — MC1 50% / MC2-5 each 12.5%.' },
      { area: 'Eligibility', detail: 'NEW round-specific additionality cutoff: 8 November 2024 (AEMO "NEM October 2024 Generation Information" page) — projects identified as committed or existing on that page are ineligible per EC7. Refreshed from the 23 Nov 2023 anchor used in earlier rounds.' },
      { area: 'Eligibility', detail: 'NEW for T8: Aggregated Projects allowed. Standalone facilities ≥5 MW but <30 MW can aggregate as a single Project (same NEM region; aggregate ≥30 MW). Each component must independently satisfy all Project Eligibility Criteria.' },
      { area: 'Eligibility', detail: 'Min Registered Capacity 30 MW (or 5 MW for Aggregated Project components). Min storage duration 2 hours at COD — the "4-hour equivalent" headline is a capacity-counting basis for the 16 GWh target, not a 4-hour minimum.' },
      { area: 'Eligibility', detail: 'EC8 prevents double-dipping with prior long-term (≥5 yr) Commonwealth/State revenue underwriting on ≥50% of capacity. EC11 prevents projects with an executed CISA/LTESA/FERMA — or one awarded under NSW Roadmap T7 / SA FERM T1 / CIS T3 / CIS T4 — from bidding. Hybrid Projects participating in CIS T7 (Generation) cannot also bid T8 (per MC1 briefing §6.0).' },
      { area: 'Region', detail: 'NSW + Victoria have RETA carve-out allocations remaining (~0.2 GW + 0.1 GW respectively). The remaining ~3.7 GW is contestable across the NEM on merit. NSW IS eligible for T8 (the NSW exclusion only applies to CIS T9 NEM Generation).' },
      { area: 'Contract', detail: 'Bid variables can be bid as a per-year schedule of nominal $ amounts (not just a flat figure). This permits structuring around expected NOR profile across the Support Period — e.g. lower Floor in early years when FCAS + PEAR revenue is strong.' },
    ],
    analystRead: 'CIS T8 is the most-structured federal dispatchable round to date. The gazetted MC1 briefing exposes the full assessment machinery: 5 Components modelled across 3 Electricity Market Scenarios + 2 Reliability Scenarios, generating 5 scoring Metrics including the Benefit-Cost Ratio that dominates competitive positioning. The CISA cashflow formula is now public — 90% floor support and 50% ceiling sharing are FIXED parameters, not bid variables; bidders compete on Annual Floor, Annual Ceiling, Annual Payment Cap and Support End Date. The "per-year schedule" option in Table 4 is the under-appreciated structuring lever — proponents can ramp the Floor low in early years (when NOR is volatile and FCAS revenue strong) and higher in later years (when energy arbitrage spreads compress). The MC1 modelled NOR is narrowly scoped to PEAR (spot arbitrage) + FCAS — PPA revenue is not in the modelled scoring basis. T8 results in June 2026 will calibrate competitive pricing for T10.',
    commitmentEligibility: {
      summary: 'No — projects identified as committed or existing in the AEMO "NEM October 2024 Generation Information" page (published 8 Nov 2024) are ineligible.',
      cutoffDate: '8 November 2024 (AEMO "NEM October 2024 Generation Information" page — per EC7 of the gazetted T8 Tender Guidelines)',
      detail: 'Confirmed from gazetted Tender Guidelines (Nov 2025), Eligibility Criterion 7: "The Project, or in the case of an Aggregated Project, each Project Component, must not have been identified as committed or existing in the AEMO \'NEM October 2024 Generation Information\' page published on 8 November 2024." This is a refreshed, T8-specific additionality anchor — moved forward from the 23 Nov 2023 CIS expansion announcement date used in earlier rounds. Pre-FID projects (or those that became committed after 8 Nov 2024) can bid; storage projects committed before that date cannot. CIS T9 and T10 will each anchor to their own AEMO Generation Information page — confirm against the round-specific Guidelines when published.',
      confidence: 'confirmed',
    },
    playbook: [
      'Min storage duration is 2 hours at COD — NOT 4. The 16 GWh / 4 GW target uses a 4-hour-equivalent conversion, but bid storage durations below 4h are eligible.',
      'Bid a per-year schedule for Annual Floor / Ceiling / Payment Cap — match the support profile to expected NOR (PEAR + FCAS) trajectory rather than a flat number.',
      'Lowest Net CISA Cost wins — push Annual Floor + Annual Ceiling + Annual Payment Cap down; exclude high-NOR Support Years from the Support Period via a shorter Final Support End Date.',
      'Earlier COD = more Wholesale Market Benefits modelled = better BCR. Don\'t target end-2030 if you can credibly hit 2028 or 2029.',
      'Network Capacity Support assessment is OPTIONAL but can lift the Renewable Energy Contribution score via a multiplier — needs a credible Reference Document (AEMO/NSP technical report) citing a specific network location + benefit category (Voltage support / Remedial Action Scheme / Grid forming / Time shifting).',
      'For NSW projects in declared REZ subject to access scheme: must have executed Access Rights Agreement (EC9) — no connection-enquiry shortcut.',
      'If you bid CIS T7 (Generation) as a hybrid, you CAN\'T also bid T8 — pick one (EC11 + Hybrid Project rule in MC1 briefing §6.0).',
      'For Aggregated Project bids: every component must independently satisfy all Eligibility Criteria, AND aggregate Registered Capacity must be ≥30 MW. Components in the same NEM region only.',
    ],
    caveats: [
      'Round is closed and under evaluation — full Tender Guidelines (Nov 2025) and MC1 Market Briefing Note are public; results due June 2026.',
      'The MC1 NOR definition for modelling/assessment is narrowly scoped to PEAR (spot market arbitrage) + FCAS — PPA revenue is NOT in the modelled NOR for scoring purposes. The actual proforma CISA settlement basis may be broader; review the proforma CISA directly when modelling settlement outcomes.',
      'The 50% revenue-sharing amount is capped by the Annual Payment Cap each year (per the gazetted cashflow formula), not by cumulative historical net payments — a different mechanic from the NSW LTESA structure.',
      'CIS national target reference: 40 GW (additional capacity) by 2030, per the Nov 2025 Tender Guidelines. Earlier AURES content referenced 32 GW — that was the pre-expansion target; the post-expansion figure is 40 GW.',
    ],
    sources: [
      { label: 'DCCEEW — CIS T8 Tender Guidelines (Nov 2025, gazetted)', url: 'https://asl.org.au/tenders/cis-tender-8-nem-dispatchable' },
      { label: 'DCCEEW — CIS T8 MC1 Market Briefing Note (Nov 2025, gazetted)', url: 'https://asl.org.au/tenders/cis-tender-8-nem-dispatchable' },
      { label: 'DCCEEW — Open CIS tenders', url: 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme/open-cis-tenders' },
      { label: 'DCCEEW — Changes to future tender process (single-stage reform)', url: 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme' },
    ],
  },

  // ---------------------------------------------------------------
  // FEDERAL CIS — Tender 10 (NEM Dispatchable) — UPCOMING
  // ---------------------------------------------------------------
  {
    id: 'cis-tender-10-nem-disp',
    scheme: 'CIS',
    roundCode: 'CIS T10',
    name: 'CIS Tender 10 — NEM Dispatchable',
    administrator: 'DCCEEW (Commonwealth), tenders run by ASL',
    status: 'upcoming',
    techFocus: 'Clean dispatchable storage',
    region: 'NEM-wide (allocation TBA)',
    targetLabel: 'Not yet published',
    resultsExpected: '—',
    targetCOD: 'Before end-2030 (expected)',
    contractMechanism: 'CISA cap & collar (expected, unchanged).',
    configFavoured: 'storage',
    meritCriteria: [],
    headline: 'Expected to open June 2026 — the next dispatchable round. Target and dates not yet published.',
    whatChanged: [
      { area: 'Target', detail: 'Flagged to open ~June 2026; no published target capacity or registration dates yet.' },
    ],
    analystRead: 'On the horizon. Expect the T8 dispatchable playbook to carry over: 4-hour duration baseline, firming/system-reliability value, credible end-2030 COD.',
    commitmentEligibility: {
      summary: 'Expected to use the same per-round AEMO Generation Information page mechanism as CIS T8 — anchor date pending Guidelines publication.',
      cutoffDate: 'TBC — likely a 2025/2026 AEMO Generation Information page per the T8 precedent (EC7)',
      detail: 'CIS T8 set the modern pattern: each CIS round\'s additionality screen is anchored to a specific AEMO Generation Information page (T8 = 8 Nov 2024 page). CIS T10, expected to open ~June 2026, is likely to use a similarly-recent AEMO Gen Info page as its anchor. Confirm against the T10 Tender Guidelines when published.',
      confidence: 'inferred',
    },
    playbook: [
      'Start positioning now if you hold a dispatchable project — expect a June 2026 open.',
      'Assume the T8 playbook carries: 4-hour duration, firming value, <2030 COD.',
    ],
    caveats: [
      'Target capacity and dates are NOT yet published — confirmed only as "expected to open June 2026".',
    ],
    sources: [
      { label: 'DCCEEW — Open CIS tenders', url: 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme/open-cis-tenders' },
    ],
  },
]
