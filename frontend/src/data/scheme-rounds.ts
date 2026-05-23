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
    total_capacity_mw: 7800,
    total_storage_mwh: 5450,
    num_projects: 19,
    project_ids: [],
    description: 'Largest CIS renewable auction to date. 19 winning projects deliver 7.8 GW against a 5 GW target — wind dominates (4.8 GW wind vs 3.0 GW solar across 10 wind and 9 solar projects), with 8 of the 19 being battery-paired hybrids. NSW filled its 8-project state quota including the country\'s biggest wind project (Origin\'s 1,450 MW Yanco Delta). The 19 winners unlock ~$17B private investment, ~19,000 construction jobs, $1.2B in social-licence commitments and $257M of Australian steel. Only 15 of 19 winners named in the initial RenewEconomy article (2026-05-23) — the remaining 4 await DCCEEW media release.',
    key_changes: 'Largest single CIS auction (7.8 GW awarded). Wind-dominated (10 of 19). 4 of 19 names not yet public. **NSW will be excluded from the next federal CIS generation round (Tender 9)** — NSW wind without a T7 win now competes only in the state Roadmap LTESA Generation tender (Q2 2026, 2.5 GW, hybrid-favoured).',
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
    // NSW (3 wind + 1 solar hybrid + 1 solar — note: NSW filled its 8-project state quota; 3 names of those 8 not in initial RenewEconomy article)
    { name: 'Yanco Delta Wind Farm', developer: 'Origin Energy', technology: 'wind', capacity_mw: 1450, state: 'NSW', location: 'South-West REZ — Jerilderie', project_id: 'yanco-delta-wind-farm', notes: 'Biggest single wind project in Australia. Origin\'s first new renewable since announcing Eraring closure. Full project ~1,460 MW (DB) / 1,450 MW (T7 awarded). SW REZ grid access secured 2025. Targeting FID mid-FY27.' },
    { name: 'Baldin (Baldon Stage 2)', developer: 'Goldwind Australia', technology: 'hybrid', capacity_mw: 346, state: 'NSW', location: 'South-West REZ — Hay Plains', project_id: 'baldon-wind-farm-stage-2', notes: '346 MW wind paired with battery in CIS bid. Project still not planning-approved — Response to Submissions lodged with DPHI May 2025; awaiting Independent Planning Commission determination. Full Baldon project = Stage 1 + Stage 2 (~360 MW Stage 1 + 1,040 MW Stage 2 in DB).' },
    { name: 'Bullewah (Bullawah Stage 1)', developer: 'BayWa r.e.', technology: 'wind', capacity_mw: 283, state: 'NSW', location: 'South-West REZ — south of Hay', project_id: 'bullawah-wind-farm-stage-1', notes: 'Capacity awarded constrained by 283 MW SW REZ access right. Full proposed project ~804 MW (Stages 1 + 2). Stage 1 still planning_submitted. Planning approval not yet granted.' },
    { name: 'Birriwa Solar Farm', developer: 'ACEN Renewables', technology: 'hybrid', capacity_mw: 600, storage_mwh: 2400, state: 'NSW', location: 'Central West Orana REZ', project_id: 'birriwa-solar-farm', notes: 'Largest solar+BESS hybrid awarded in T7.' },
    { name: 'Dinawan Solar (Dinawan Energy Hub)', developer: 'Spark Renewables', technology: 'hybrid', capacity_mw: 0, state: 'NSW', location: 'South-West REZ', project_id: 'dinawan-energy-hub', notes: 'Solar+battery component of the broader Dinawan Energy Hub (separate from the 357 MW Dinawan Stage 1 wind CIS T4 win). Capacity not disclosed in initial article. Project awaiting IPC determination.' },
    { name: 'Kayuga Solar', developer: 'Undisclosed', technology: 'solar', capacity_mw: 0, state: 'NSW', notes: 'Capacity not disclosed in initial RenewEconomy article. Project ID not yet matched in AURES DB. Likely to add battery storage outside CIS parameters.' },
    // QLD (3 — 2 wind, 1 hybrid wind+BESS, 1 solar)
    { name: 'Bungaban Wind + Battery', developer: 'Windlab', technology: 'hybrid', capacity_mw: 1150, storage_mwh: 1450, state: 'QLD', project_id: 'bungaban-wind-farm', notes: '1,150 MW wind + 1,450 MWh battery. Long-term PPA with Rio Tinto for smelter/refinery power; CIS win helps competitive pricing. Full DB project = 1,400 MW (project total).' },
    { name: 'Theodore Wind Farm', developer: 'RWE Renewables', technology: 'wind', capacity_mw: 1000, state: 'QLD', project_id: 'theodore-wind-farm', notes: 'Previously threatened by LNP state government. Full DB project = 1,054 MW.' },
    { name: 'Bullyard Solar Farm', developer: 'European Energy', technology: 'solar', capacity_mw: 0, state: 'QLD', project_id: 'bullyard-solar-farm', notes: 'Capacity not disclosed in initial article. Likely to add battery storage outside CIS parameters. DB has 97 MW listed but T7 award likely covers larger expansion.' },
    // VIC (2 wind)
    { name: 'Willatook Wind Farm', developer: 'Engie', technology: 'wind', capacity_mw: 338, state: 'VIC', project_id: 'willatook', notes: 'Victoria sought only wind projects in T7. DB has full project = 450 MW.' },
    { name: 'Woolsthorpe Wind Farm', developer: 'ICA Partners', technology: 'wind', capacity_mw: 70, state: 'VIC', project_id: 'woolsthorpe-wind-farm' },
    // SA (1 wind)
    { name: 'Whyte Yarcowie Wind Farm', developer: 'EdF Renewables', technology: 'wind', capacity_mw: 0, state: 'SA', project_id: 'whyte-yarcowie', notes: 'South Australia\'s only T7 winner. Capacity not disclosed in initial article. DB has full project = 574 MW.' },
    // TAS (1 wind + 1 solar — Gamuda did both)
    { name: 'Cellars Hill Wind Farm', developer: 'Gamuda', technology: 'wind', capacity_mw: 0, state: 'TAS', notes: 'Project ID not yet matched in AURES DB. Capacity not disclosed. Located near Weasel solar project (also Gamuda).' },
    { name: 'Weasel Solar Farm', developer: 'Gamuda', technology: 'solar', capacity_mw: 0, state: 'TAS', project_id: 'weasel-solar-farm-and-bess-kci', notes: 'Unusual: major solar farm on central highlands. Capacity not disclosed in initial article. DB has 144 MW for Weasel Solar + BESS.' },
    // 4 winners unnamed in RenewEconomy initial article — pending DCCEEW media release
    // Refresh this array once full list lands.
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
    awarded_mw: 1450,
    total_mw: 1460,
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
    awarded_mw: 283,
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
