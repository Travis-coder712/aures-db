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
    description: 'First CIS pilot round, delivered in partnership with the NSW Government. Selected six battery and virtual power plant projects to deliver 1+ GW of dispatchable capacity.',
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
    announced_date: '',
    total_capacity_mw: 0,
    total_storage_mwh: 0,
    num_projects: 0,
    project_ids: [],
    description: 'Seeking 5 GW of NEM generation capacity. Registrations opened October 2025. Results expected May 2026.',
    sources: [
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
}

export const CIS_PROJECTS: Record<string, SchemeProject[]> = {
  'cis-pilot-nsw': [
    { name: 'Orana REZ Battery', developer: 'Akaysha Energy', technology: 'bess', capacity_mw: 460, storage_mwh: 920, state: 'NSW', location: 'Wellington' },
    { name: 'Liddell Battery', developer: 'AGL Energy', technology: 'bess', capacity_mw: 250, storage_mwh: 500, state: 'NSW', location: 'Muswellbrook' },
    { name: 'Smithfield Sydney Battery', developer: 'Iberdrola Australia', technology: 'bess', capacity_mw: 235, storage_mwh: 470, state: 'NSW', location: 'Smithfield' },
    { name: 'Enel X VPP 1', developer: 'Enel X Australia', technology: 'vpp', capacity_mw: 43, state: 'NSW' },
    { name: 'Enel X VPP 2', developer: 'Enel X Australia', technology: 'vpp', capacity_mw: 43, state: 'NSW' },
    { name: 'Enel X VPP 3', developer: 'Enel X Australia', technology: 'vpp', capacity_mw: 44, state: 'NSW' },
  ],
  'cis-pilot-sa-vic': [
    { name: 'Wooreen Battery', developer: 'EnergyAustralia', technology: 'bess', capacity_mw: 350, storage_mwh: 1400, state: 'VIC', location: 'Hazelwood North' },
    { name: 'Springfield BESS', developer: 'Neoen', technology: 'bess', capacity_mw: 200, storage_mwh: 400, state: 'VIC', location: 'Springfield' },
    { name: 'Mortlake BESS', developer: 'Origin Energy', technology: 'bess', capacity_mw: 135, storage_mwh: 270, state: 'VIC', location: 'Mortlake' },
    { name: 'Tailem Bend BESS', developer: 'Iberdrola', technology: 'bess', capacity_mw: 200, storage_mwh: 560, state: 'SA', location: 'Tailem Bend' },
    { name: 'Clements Gap Battery', developer: 'Pacific Blue', technology: 'bess', capacity_mw: 60, storage_mwh: 240, state: 'SA', location: 'Clements Gap' },
    { name: 'Hallett Battery', developer: 'EnergyAustralia', technology: 'bess', capacity_mw: 50, storage_mwh: 756, state: 'SA', location: 'Canownie' },
  ],
  'cis-tender-2-wem-disp': [
    { name: 'Boddington Giga Battery', developer: 'PGS Energy', technology: 'bess', capacity_mw: 324, storage_mwh: 1296, state: 'WA', location: 'Marradong' },
    { name: 'Merredin Big Battery', developer: 'Atmos Renewables', technology: 'bess', capacity_mw: 100, storage_mwh: 400, state: 'WA', location: 'Merredin' },
    { name: 'Muchea Big Battery', developer: 'Neoen', technology: 'bess', capacity_mw: 150, storage_mwh: 600, state: 'WA', location: 'Muchea' },
    { name: 'Waroona Renewable Energy Project Stage 1', developer: 'Frontier Energy', technology: 'bess', capacity_mw: 80, storage_mwh: 299, state: 'WA', location: 'Waroona' },
  ],
  'cis-tender-3-nem-disp': [
    { name: 'Bulabul 2 BESS', developer: 'AMPYR Australia', technology: 'bess', capacity_mw: 100, storage_mwh: 406, state: 'NSW', location: 'Wuuluman' },
    { name: 'Swallow Tail BESS', developer: 'AMPYR Australia', technology: 'bess', capacity_mw: 300, storage_mwh: 1218, state: 'NSW', location: 'Bannaby' },
    { name: 'Calala BESS', developer: 'Equis', technology: 'bess', capacity_mw: 150, storage_mwh: 300, state: 'NSW', location: 'Calala' },
    { name: 'Goulburn River Standalone BESS', developer: 'Lightsource bp', technology: 'bess', capacity_mw: 450, storage_mwh: 1370, state: 'NSW', location: 'Merriwa' },
    { name: 'Mount Piper BESS Stage 1', developer: 'EnergyAustralia', technology: 'bess', capacity_mw: 250, storage_mwh: 1000, state: 'NSW', location: 'Blackmans Flat' },
    { name: 'Deer Park BESS', developer: 'Akaysha Energy', technology: 'bess', capacity_mw: 275, storage_mwh: 1100, state: 'VIC', location: 'Ravenhall' },
    { name: 'Joel Joel BESS', developer: 'ACEnergy', technology: 'bess', capacity_mw: 250, storage_mwh: 1000, state: 'VIC', location: 'Joel Joel' },
    { name: 'Kiamal BESS', developer: 'TotalEnergies', technology: 'bess', capacity_mw: 220, storage_mwh: 810, state: 'VIC', location: 'Ouyen' },
    { name: 'Little River BESS', developer: 'ACEnergy', technology: 'bess', capacity_mw: 350, storage_mwh: 1400, state: 'VIC', location: 'Little River' },
    { name: 'Mornington BESS', developer: 'Valent Energy', technology: 'bess', capacity_mw: 240, storage_mwh: 587, state: 'VIC', location: 'Tyabb' },
    { name: 'Capricorn BESS', developer: 'Potentia Energy', technology: 'bess', capacity_mw: 300, storage_mwh: 1200, state: 'QLD', location: 'Bouldercombe' },
    { name: 'Lower Wonga BESS', developer: 'Equis', technology: 'bess', capacity_mw: 200, storage_mwh: 800, state: 'QLD', location: 'Lower Wonga' },
    { name: 'Teebar BESS', developer: 'Atmos Renewables', technology: 'bess', capacity_mw: 400, storage_mwh: 1600, state: 'QLD', location: 'Gigoomgan' },
    { name: 'Ulinda Park Expansion', developer: 'Akaysha Energy', technology: 'bess', capacity_mw: 195, storage_mwh: 780, state: 'QLD', location: 'Hopeland' },
    { name: 'Koolunga BESS', developer: 'Equis', technology: 'bess', capacity_mw: 200, storage_mwh: 800, state: 'SA', location: 'Koolunga' },
    { name: 'Reeves Plains BESS', developer: 'Alinta Energy', technology: 'bess', capacity_mw: 250, storage_mwh: 1000, state: 'SA', location: 'Reeves Plains' },
  ],
  'cis-tender-4-nem-gen': [
    { name: 'Bell Bay Wind Farm', developer: 'Equis', technology: 'wind', capacity_mw: 224, state: 'TAS' },
    { name: 'Bendemeer Energy Hub', developer: 'Athena Energy Australia', technology: 'hybrid', capacity_mw: 252, storage_mwh: 300, state: 'NSW' },
    { name: 'Bundey BESS and Solar', developer: 'Genaspi Energy Group', technology: 'hybrid', capacity_mw: 240, storage_mwh: 1200, state: 'SA' },
    { name: 'Carmody\'s Hill Wind Farm', developer: 'Aula Energy', technology: 'wind', capacity_mw: 247, state: 'SA' },
    { name: 'Corop Solar Farm and BESS', developer: 'BNRG Leeson', technology: 'hybrid', capacity_mw: 230, storage_mwh: 704, state: 'VIC' },
    { name: 'Derby Solar Project', developer: 'Sungrow', technology: 'hybrid', capacity_mw: 95, storage_mwh: 210, state: 'VIC' },
    { name: 'Dinawan Wind Farm Stage 1', developer: 'Spark Renewables', technology: 'wind', capacity_mw: 357, state: 'NSW' },
    { name: 'Gawara Baya', developer: 'Windlab', technology: 'hybrid', capacity_mw: 399, storage_mwh: 217, state: 'QLD' },
    { name: 'Guthrie\'s Gap Solar Power Station', developer: 'Edify Energy', technology: 'hybrid', capacity_mw: 300, storage_mwh: 1200, state: 'QLD' },
    { name: 'Hexham Wind Farm', developer: 'AGL', technology: 'wind', capacity_mw: 600, state: 'VIC' },
    { name: 'Liverpool Range Wind Stage 1', developer: 'Tilt Renewables', technology: 'wind', capacity_mw: 634, state: 'NSW' },
    { name: 'Lower Wonga Solar Farm', developer: 'Lightsource bp', technology: 'solar', capacity_mw: 281, state: 'QLD' },
    { name: 'Merino Solar Farm', developer: 'EDPR', technology: 'hybrid', capacity_mw: 450, storage_mwh: 1800, state: 'NSW' },
    { name: 'Middlebrook Solar Farm', developer: 'TotalEnergies', technology: 'hybrid', capacity_mw: 363, storage_mwh: 813, state: 'NSW' },
    { name: 'Moah Creek Wind Farm', developer: 'Central Queensland Power', technology: 'wind', capacity_mw: 360, state: 'QLD' },
    { name: 'Nowingi Solar Power Station', developer: 'Edify Energy', technology: 'hybrid', capacity_mw: 300, storage_mwh: 1200, state: 'VIC' },
    { name: 'Punchs Creek Solar Farm', developer: 'EDPR', technology: 'hybrid', capacity_mw: 400, storage_mwh: 1600, state: 'QLD' },
    { name: 'Smoky Creek Solar Power Station', developer: 'Edify Energy', technology: 'hybrid', capacity_mw: 300, storage_mwh: 1200, state: 'QLD' },
    { name: 'Tallawang Solar Hybrid', developer: 'Potentia Energy', technology: 'hybrid', capacity_mw: 500, storage_mwh: 1000, state: 'NSW' },
    { name: 'Willogoleche 2 Wind Farm', developer: 'ENGIE / Foresight', technology: 'wind', capacity_mw: 108, state: 'SA' },
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
    total_capacity_mw: 1395,
    total_storage_mwh: 0,
    num_projects: 4,
    project_ids: [],
    description: 'First LTESA round under the NSW Electricity Infrastructure Roadmap. Selected projects representing 1,395 MW of renewable generation and one long-duration battery. Strike prices ~40% lower than LCOE, amongst the lowest in any Australian tender.',
    sources: [
      { title: 'ASL — Tender Round 1', url: 'https://asl.org.au/en/tenders/tender-round-1', source_tier: 1 },
    ],
  },
  {
    id: 'ltesa-round-2',
    name: 'LTESA Round 2 — Firming',
    type: 'firming',
    announced_date: '2023-11-01',
    total_capacity_mw: 0,
    total_storage_mwh: 0,
    num_projects: 0,
    project_ids: [],
    description: 'Firming-focused tender to complement generation contracted in Round 1. Focused on dispatchable capacity to support NSW grid reliability.',
    sources: [
      { title: 'NSW Roadmap tenders delivering real progress (ASL)', url: 'https://asl.org.au/en/news/media-release/231219-nsw-roadmap-tenders-delivering-real-progress-to-transforming-our-energy-system', date: '2023-12-19', source_tier: 1 },
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
    total_capacity_mw: 0,
    total_storage_mwh: 0,
    num_projects: 0,
    project_ids: [],
    description: 'Generation-focused round targeting additional wind and solar capacity for NSW.',
    sources: [],
  },
  {
    id: 'ltesa-round-5',
    name: 'LTESA Round 5 — Long Duration Storage',
    type: 'lds',
    announced_date: '2025-02-27',
    total_capacity_mw: 1000,
    total_storage_mwh: 13000,
    num_projects: 3,
    project_ids: [],
    description: 'Largest long-duration storage tender to date at time of announcement. All successful projects can dispatch continuously for at least 8 hours. Included Phoenix Pumped Hydro (~15 hours discharge). Over 1 GW and 13 GWh awarded.',
    sources: [
      { title: 'ASL NSW Long Duration Storage tender awards more than 1GW and 13GWh', url: 'https://asl.org.au/news/media-release/250227-asl-nsw-long-duration-storage-tender-awards-more-than-1gw-and-13gwh', date: '2025-02-27', source_tier: 1 },
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
]

export const LTESA_PROJECTS: Record<string, SchemeProject[]> = {
  'ltesa-round-6': [
    { name: 'Great Western Battery', developer: 'Neoen Australia', technology: 'bess', capacity_mw: 330, storage_mwh: 3500, state: 'NSW' },
    { name: 'Bowmans Creek BESS', developer: 'Ark Energy', technology: 'bess', capacity_mw: 250, storage_mwh: 2414, state: 'NSW' },
    { name: 'Bannaby BESS', developer: 'BW ESS', technology: 'bess', capacity_mw: 233, storage_mwh: 2676, state: 'NSW' },
    { name: 'Armidale East BESS', developer: 'Unknown', technology: 'bess', capacity_mw: 158, storage_mwh: 1440, state: 'NSW' },
    { name: 'Ebor BESS', developer: 'Energy Vault / Bridge Energy', technology: 'bess', capacity_mw: 100, storage_mwh: 870, state: 'NSW' },
    { name: 'Kingswood BESS', developer: 'Iberdrola Australia', technology: 'bess', capacity_mw: 100, storage_mwh: 1080, state: 'NSW' },
  ],
}
