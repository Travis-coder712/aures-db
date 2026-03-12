// ============================================================
// AURES Core Type Definitions
// ============================================================

export type Technology = 'wind' | 'solar' | 'bess' | 'hybrid' | 'pumped_hydro' | 'offshore_wind' | 'gas'
export type ProjectStatus = 'operating' | 'commissioning' | 'construction' | 'development' | 'withdrawn'
export type State = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT'
export type Confidence = 'high' | 'good' | 'medium' | 'low' | 'unverified'

export type TimelineEventType =
  | 'conceived' | 'planning_submitted' | 'planning_approved' | 'planning_rejected'
  | 'planning_modified' | 'ownership_change' | 'offtake_signed' | 'rez_access'
  | 'connection_milestone' | 'fid' | 'construction_start' | 'equipment_order'
  | 'energisation' | 'commissioning' | 'cod' | 'expansion'
  | 'cod_change' | 'cost_change' | 'capacity_change' | 'stakeholder_issue' | 'notable'

export interface SourceReference {
  title: string
  url: string
  date?: string
  source_tier?: 1 | 2 | 3 | 4 | 5
}

export interface TimelineEvent {
  date: string
  date_precision: 'day' | 'month' | 'quarter' | 'year'
  event_type: TimelineEventType
  title: string
  detail?: string
  sources: SourceReference[]
}

export interface OwnershipRecord {
  period: string
  owner: string
  role: string
  acquisition_value_aud?: number
  transaction_structure?: string
  source_url?: string
}

export interface CODHistoryEntry {
  date: string
  estimate: string
  source: string
  source_url?: string
}

export interface SupplierRecord {
  role: 'wind_oem' | 'bess_oem' | 'inverter' | 'bop' | 'epc' | 'syncon' | 'statcom' | 'harmonic_filter'
  supplier: string
  model?: string
  quantity?: number
  grid_forming?: boolean
  source_url?: string
}

export interface OfftakeRecord {
  party: string
  type: 'PPA' | 'CIS' | 'LTESA' | 'SIPS' | 'FCAS' | 'other'
  term_years?: number
  capacity_mw?: number
  source_url?: string
}

export interface SchemeContract {
  scheme: 'CIS' | 'LTESA'
  round: string
  capacity_mw?: number
  storage_mwh?: number
  contract_type?: string
  source_url?: string
}

export interface MultiSourceValue {
  value: string
  source: string
  source_url?: string
  date: string
  context?: string
  what_this_covers?: string
}

export interface Project {
  id: string
  name: string
  technology: Technology
  status: ProjectStatus
  capacity_mw: number
  storage_mwh?: number | null
  state: State
  rez?: string | null
  lga?: string
  coordinates?: { lat: number; lng: number }

  // Current ownership
  current_developer?: string
  current_operator?: string

  // History
  timeline: TimelineEvent[]
  ownership_history: OwnershipRecord[]
  cod_history: CODHistoryEntry[]

  // Current estimates
  cod_current?: string
  cod_original?: string
  cost_aud_million?: number
  cost_sources?: MultiSourceValue[]

  // Suppliers & equipment
  suppliers: SupplierRecord[]

  // Offtakes & contracts
  offtakes: OfftakeRecord[]
  scheme_contracts: SchemeContract[]

  // Grid connection
  connection_status?: string
  connection_nsp?: string
  grid_forming?: boolean
  has_sips?: boolean
  has_syncon?: boolean
  has_statcom?: boolean
  has_harmonic_filter?: boolean

  // Scores (pre-computed)
  development_score?: number
  performance_score?: number

  // Notable
  notable?: string
  stakeholder_issues?: string[]

  // Metadata
  sources: SourceReference[]
  data_confidence: Confidence
  last_updated: string
  last_verified: string
  aemo_gen_info_id?: string
}

// Performance data (Phase 3 preview — sample data)
export interface AnnualPerformance {
  year: number
  // Wind/Solar/Hybrid
  energy_price_received?: number  // $/MWh volume-weighted average
  curtailment_pct?: number        // % of potential generation curtailed
  capacity_factor_pct?: number    // % capacity utilisation
  // BESS
  avg_charge_price?: number       // $/MWh
  avg_discharge_price?: number    // $/MWh
  utilisation_pct?: number        // % of hours actively cycling
  cycles?: number                 // charge/discharge cycles
}

export interface ProjectPerformance {
  project_id: string
  ytd_price?: number              // $/MWh year-to-date (wind/solar)
  ytd_charge_price?: number       // $/MWh year-to-date (BESS)
  ytd_discharge_price?: number    // $/MWh year-to-date (BESS)
  ytd_period: string              // e.g. "Jan–Mar 2026"
  annual: AnnualPerformance[]
}

// Summary type for list views (lightweight)
export interface ProjectSummary {
  id: string
  name: string
  technology: Technology
  status: ProjectStatus
  capacity_mw: number
  storage_mwh?: number | null
  state: State
  current_developer?: string
  rez?: string | null
  development_score?: number
  performance_score?: number
  data_confidence: Confidence
  confidence_score?: number
}

// CIS/LTESA types
export interface CISRound {
  id: string
  name: string
  type: 'generation' | 'dispatchable'
  market: 'NEM' | 'WEM'
  announced_date: string
  total_capacity_mw: number
  total_storage_mwh?: number
  num_projects: number
  project_ids: string[]
  description: string
  key_changes?: string
  sources: SourceReference[]
}

export interface LTESARound {
  id: string
  name: string
  type: 'generation' | 'firming' | 'lds' | 'mixed'
  announced_date: string
  total_capacity_mw: number
  total_storage_mwh?: number
  num_projects: number
  project_ids: string[]
  description: string
  sources: SourceReference[]
}

export interface REZ {
  id: string
  name: string
  state: State
  target_capacity_gw: number
  status: string
  transmission_provider?: string
  project_ids: string[]
  description: string
  sources: SourceReference[]
}

// League Table types (Phase 3)
export type LeagueTechnology = 'wind' | 'solar' | 'bess' | 'pumped_hydro'

export interface LeagueTableEntry {
  project_id: string
  name: string
  technology: Technology
  capacity_mw: number
  storage_mwh?: number | null
  state: State

  // Performance metrics
  energy_mwh?: number
  capacity_factor_pct?: number
  curtailment_pct?: number
  energy_price_received?: number
  revenue_aud?: number
  revenue_per_mw?: number
  market_value_aud?: number

  // BESS metrics
  energy_charged_mwh?: number
  energy_discharged_mwh?: number
  avg_charge_price?: number
  avg_discharge_price?: number
  utilisation_pct?: number
  cycles?: number

  // Data provenance
  data_source?: 'openelectricity' | 'openelectricity_ytd' | 'sample'

  // Rankings
  rank_composite: number
  rank_capacity_factor?: number
  rank_revenue_per_mw?: number
  rank_curtailment?: number
  quartile: 1 | 2 | 3 | 4
  composite_score: number
  percentile_capacity_factor?: number
  percentile_revenue_per_mw?: number
}

export interface LeagueTable {
  year: number
  technology: LeagueTechnology
  data_source?: 'openelectricity' | 'openelectricity_ytd' | 'sample' | 'mixed'
  fleet_avg: {
    capacity_factor_pct?: number
    revenue_per_mw?: number
    curtailment_pct?: number
    count: number
  }
  projects: LeagueTableEntry[]
}

export interface LeagueTableIndex {
  available_years: number[]
  technologies: LeagueTechnology[]
  tables: { year: number; technology: string; count: number }[]
  last_updated: string
}

export interface QuartileBenchmarks {
  year: number
  technology: LeagueTechnology
  benchmarks: {
    capacity_factor: { q1: number; median: number; q3: number }
    revenue_per_mw: { q1: number; median: number; q3: number }
  }
}

// Developer profile types (Phase 4)
export interface DeveloperProfile {
  slug: string
  name: string
  project_count: number
  total_capacity_mw: number
  total_storage_mwh: number
  by_technology: Partial<Record<Technology, number>>
  by_status: Partial<Record<ProjectStatus, number>>
  states: State[]
  avg_confidence: Confidence
  project_ids: string[]
}

export interface DeveloperIndex {
  developers: DeveloperProfile[]
  total_developers: number
}

// Map data types (Phase 4)
export interface MapProject {
  id: string
  name: string
  technology: Technology
  status: ProjectStatus
  capacity_mw: number
  storage_mwh?: number | null
  state: State
  lat: number
  lng: number
  developer?: string
}

// COD Drift types (Phase 4)
export interface CODDriftProject {
  id: string
  name: string
  technology: Technology
  status: ProjectStatus
  capacity_mw: number
  state: State
  original: string
  current: string
  drift_months: number
}

export interface CODDriftData {
  projects_with_drift: number
  avg_drift_months: Partial<Record<Technology, number>>
  by_project: CODDriftProject[]
  cod_histories: Record<string, { date: string; estimate: string; source?: string }[]>
}

// Technology display helpers
export const TECHNOLOGY_CONFIG: Record<Technology, { label: string; color: string; icon: string }> = {
  wind: { label: 'Wind', color: '#3b82f6', icon: '💨' },
  solar: { label: 'Solar', color: '#f59e0b', icon: '☀️' },
  bess: { label: 'BESS', color: '#8b5cf6', icon: '🔋' },
  hybrid: { label: 'Hybrid', color: '#06b6d4', icon: '⚡' },
  pumped_hydro: { label: 'Pumped Hydro', color: '#14b8a6', icon: '💧' },
  offshore_wind: { label: 'Offshore Wind', color: '#0ea5e9', icon: '🌊' },
  gas: { label: 'Gas', color: '#ef4444', icon: '🔥' },
}

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; icon: string }> = {
  operating: { label: 'Operating', color: '#22c55e', icon: '🟢' },
  commissioning: { label: 'Commissioning', color: '#84cc16', icon: '🟡' },
  construction: { label: 'Construction', color: '#f59e0b', icon: '🏗️' },
  development: { label: 'Development', color: '#3b82f6', icon: '📋' },
  withdrawn: { label: 'Withdrawn', color: '#6b7280', icon: '⬜' },
}

export const CONFIDENCE_CONFIG: Record<Confidence, { label: string; dots: string; color: string }> = {
  high: { label: 'High Confidence', dots: '●●●●', color: '#22c55e' },
  good: { label: 'Good Confidence', dots: '●●●○', color: '#84cc16' },
  medium: { label: 'Medium Confidence', dots: '●●○○', color: '#f59e0b' },
  low: { label: 'Low Confidence', dots: '●○○○', color: '#ef4444' },
  unverified: { label: 'Unverified', dots: '○○○○', color: '#6b7280' },
}
