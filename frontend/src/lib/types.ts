// ============================================================
// AURES Core Type Definitions
// ============================================================

export type Technology = 'wind' | 'solar' | 'bess' | 'hybrid' | 'pumped_hydro' | 'offshore_wind' | 'gas'
export type ProjectStatus = 'operating' | 'commissioning' | 'construction' | 'development' | 'withdrawn'
export type State = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT'
export type Confidence = 'high' | 'good' | 'medium' | 'low' | 'unverified'
export type DevelopmentStage = 'epbc_approved' | 'epbc_submitted' | 'planning_submitted' | 'early_stage'

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

  // Development sub-stage
  development_stage?: DevelopmentStage

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
  development_stage?: DevelopmentStage
  current_operator?: string
  capex_aud_m?: number
  capex_year?: number
  notable?: string
  first_seen?: string
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

// OEM & Contractor profile types (Phase 5)
export type OEMRole = 'wind_oem' | 'bess_oem' | 'hydro_oem' | 'inverter'
export type ContractorRole = 'epc' | 'bop'

export interface OEMDetailBreakdown {
  count: number
  capacity_mw: number
  storage_mwh: number
}

export interface OEMProfile {
  slug: string
  name: string
  project_count: number
  total_capacity_mw: number
  total_storage_mwh: number
  roles: OEMRole[]
  models: string[]
  by_technology: Partial<Record<Technology, number>>
  by_status: Partial<Record<ProjectStatus, number>>
  by_state: Partial<Record<State, number>>
  states: State[]
  project_ids: string[]
  status_detail: Partial<Record<ProjectStatus, OEMDetailBreakdown>>
  state_detail: Partial<Record<State, OEMDetailBreakdown>>
}

export interface OEMIndex {
  oems: OEMProfile[]
  total: number
}

export interface ContractorProfile {
  slug: string
  name: string
  project_count: number
  total_capacity_mw: number
  roles: ContractorRole[]
  by_technology: Partial<Record<Technology, number>>
  by_status: Partial<Record<ProjectStatus, number>>
  states: State[]
  project_ids: string[]
}

export interface ContractorIndex {
  contractors: ContractorProfile[]
  total: number
}

export type OfftakeType = 'PPA' | 'corporate_ppa' | 'government_ppa' | 'tolling' | 'merchant' | 'CIS' | 'LTESA' | 'SIPS' | 'FCAS' | 'other'

export interface OfftakerProfile {
  slug: string
  name: string
  project_count: number
  total_capacity_mw: number
  types: OfftakeType[]
  by_technology: Partial<Record<Technology, number>>
  by_status: Partial<Record<ProjectStatus, number>>
  states: State[]
  project_ids: string[]
}

export interface OfftakerIndex {
  offtakers: OfftakerProfile[]
  total: number
}

export const OFFTAKE_TYPE_CONFIG: Record<OfftakeType, { label: string; color: string }> = {
  PPA: { label: 'PPA', color: '#3b82f6' },
  corporate_ppa: { label: 'Corporate PPA', color: '#8b5cf6' },
  government_ppa: { label: 'Government PPA', color: '#22c55e' },
  tolling: { label: 'Tolling', color: '#f59e0b' },
  merchant: { label: 'Merchant', color: '#6b7280' },
  CIS: { label: 'CIS', color: '#14b8a6' },
  LTESA: { label: 'LTESA', color: '#06b6d4' },
  SIPS: { label: 'SIPS', color: '#ec4899' },
  FCAS: { label: 'FCAS', color: '#f97316' },
  other: { label: 'Other', color: '#6b7280' },
}

export const OEM_ROLE_CONFIG: Record<OEMRole, { label: string; color: string }> = {
  wind_oem: { label: 'Wind OEM', color: '#3b82f6' },
  bess_oem: { label: 'BESS OEM', color: '#8b5cf6' },
  hydro_oem: { label: 'Hydro OEM', color: '#14b8a6' },
  inverter: { label: 'Inverter', color: '#f59e0b' },
}

export const CONTRACTOR_ROLE_CONFIG: Record<ContractorRole, { label: string; color: string }> = {
  epc: { label: 'EPC', color: '#ef4444' },
  bop: { label: 'BoP', color: '#f97316' },
}

// Developer profile types (Phase 4)
export interface DeveloperProfile {
  slug: string
  name: string
  aliases?: string[]
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
  grouped_developers: DeveloperProfile[]
  total_grouped: number
  top_developers: { slug: string; name: string; project_count: number }[]
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

export const DEVELOPMENT_STAGE_CONFIG: Record<DevelopmentStage, { label: string; color: string; icon: string }> = {
  epbc_approved: { label: 'EPBC Approved', color: '#22c55e', icon: '✓' },
  epbc_submitted: { label: 'EPBC Submitted', color: '#10b981', icon: '◐' },
  planning_submitted: { label: 'AEMO Announced', color: '#f59e0b', icon: '◐' },
  early_stage: { label: 'Early Stage', color: '#6b7280', icon: '○' },
}

// Data Sources (admin/status page)
export type DataSourceFrequency = 'monthly' | 'quarterly' | 'ad_hoc'

export interface DataSourceInfo {
  id: string
  name: string
  description: string
  url: string
  frequency: DataSourceFrequency
  script: string
  last_run: string | null
  last_status: 'completed' | 'failed' | 'running' | 'never'
  records_imported: number
  records_updated: number
  records_new: number
  error: string | null
}

// BESS Capex Analytics
export interface BESSCapexProject {
  id: string
  name: string
  status: string
  capacity_mw: number
  storage_mwh: number
  capex_aud_m: number
  capex_year: number
  capex_source: string
  state: string
  current_developer: string
  current_operator: string
  bess_oem: string
  bess_model: string
  capex_per_mw: number
  capex_per_mwh: number
  duration_hours: number
}

export interface BESSCapexYearSummary {
  count: number
  total_mw: number
  total_capex_m: number
  avg_capex_per_mw: number | null
  avg_capex_per_mwh: number | null
}

export interface BESSCapexOEMSummary {
  count: number
  total_mw: number
  avg_capex_per_mw: number | null
  avg_capex_per_mwh: number | null
}

export interface BESSCapexData {
  projects: BESSCapexProject[]
  by_year: Record<string, BESSCapexYearSummary>
  by_oem: Record<string, BESSCapexOEMSummary>
  exported_at: string
}

// Project Timeline Analytics
export interface TimelineProject {
  id: string
  name: string
  technology: Technology
  status: ProjectStatus
  capacity_mw: number
  storage_mwh?: number
  state: State
  current_developer?: string
  first_seen?: string
  first_seen_year?: number
  development_stage?: DevelopmentStage
}

export interface TimelineYearBreakdown {
  count: number
  total_mw: number
  by_technology: Record<string, { count: number; capacity_mw: number }>
  by_state: Record<string, { count: number; capacity_mw: number }>
  by_status: Record<string, { count: number; capacity_mw: number }>
}

export interface ProjectTimelineData {
  projects: TimelineProject[]
  by_year: Record<string, TimelineYearBreakdown>
  by_technology: Record<string, { count: number; total_mw: number; with_date: number }>
  by_state: Record<string, { count: number; total_mw: number }>
  total_with_date: number
  total_without_date: number
  exported_at: string
}

export interface DataSourcesIndex {
  sources: DataSourceInfo[]
  database_stats: {
    total_projects: number
    total_offtakes: number
    total_oems_contractors: number
    operating_projects: number
  }
  exported_at: string
}

// ============================================================
// Intelligence Layer Types
// ============================================================

export interface SchemeRiskProject {
  project_id: string; name: string; scheme: string; round: string;
  technology: string; status: string; capacity_mw: number; storage_mwh: number | null;
  developer: string; cod_current: string | null; cod_original: string | null;
  has_fid: boolean; has_construction_start: boolean; has_planning_approval: boolean;
  drift_months: number; risk_score: number; risk_level: 'green' | 'amber' | 'red';
}
export interface SchemeRiskData {
  projects: SchemeRiskProject[];
  summary: { red: number; amber: number; green: number };
  by_scheme: Record<string, { count: number; avg_risk: number; total_mw: number }>;
  total_projects: number;
}

export interface DriftGroup { count: number; mean: number; median: number; p25: number; p75: number }
export interface DriftProject {
  project_id: string; name: string; technology: string; status: string;
  state: string; capacity_mw: number; drift_months: number;
  cod_current: string | null; cod_original: string | null; developer: string;
}
export interface DeveloperDrift {
  developer: string; count: number; mean: number; median: number; p25: number; p75: number; on_time_pct: number;
}
export interface DriftYearTrend { year: number; count: number; mean: number; median: number; p25: number; p75: number }
export interface DriftAnalysisData {
  projects: DriftProject[];
  by_technology: Record<string, DriftGroup>;
  by_state: Record<string, DriftGroup>;
  by_capacity_band: Record<string, DriftGroup>;
  developer_ranking: DeveloperDrift[];
  year_trend: DriftYearTrend[];
  total_projects: number;
  overall: DriftGroup;
}

export interface WindResourceFarm {
  project_id: string; name: string; state: string; capacity_mw: number;
  latitude: number; longitude: number; capacity_factor_pct: number;
  energy_price: number; revenue_per_mw: number; resource_rating: string;
}
export interface WindResourceDev {
  project_id: string; name: string; state: string; capacity_mw: number;
  latitude: number | null; longitude: number | null;
  predicted_cf_pct: number; predicted_rating: string; basis: string;
}
export interface WindResourceData {
  operating_farms: WindResourceFarm[];
  state_benchmarks: Record<string, { count: number; mean: number; median: number; p25: number; p75: number; rating: string }>;
  rez_benchmarks: Record<string, { count: number; mean: number; median: number; p25: number; p75: number; rating: string }>;
  development_projects: WindResourceDev[];
  total_operating: number; total_development: number;
}

export interface StateYearPerformance {
  state: string; year: number; wind_cf_pct: number; solar_cf_pct: number;
  combined_cf_pct: number; wind_mw: number; solar_mw: number;
}
export interface DunkelflaunteData {
  state_year_performance: StateYearPerformance[];
  lowest_cf_periods: StateYearPerformance[];
  bess_coverage: Record<string, { bess_count: number; bess_mw: number; bess_mwh: number; peak_demand_mw_est: number; coverage_hours: number; coverage_rating: string }>;
  bess_pipeline: Record<string, { count: number; mw: number; mwh: number }>;
  peak_demand_estimates: Record<string, number>;
}

export interface EnergyMixData {
  current_mix: Record<string, Record<string, { count: number; mw: number; mwh?: number }>>;
  state_totals: Record<string, { operating_mw: number; technologies: Record<string, { count: number; mw: number }> }>;
  pipeline: Array<{ state: string; technology: string; status: string; cod_year: string; count: number; mw: number }>;
  projection: Record<string, Record<string, number>>;
}

export interface ScoredDeveloper {
  developer: string; project_count: number; total_mw: number; technologies: string[];
  operating: number; withdrawn: number; completion_rate: number;
  avg_drift_months: number; on_time_pct: number;
  execution_score: number; grade: string;
  drift_stats: { count: number; mean: number; median: number };
}
export interface DeveloperScoreData {
  developers: ScoredDeveloper[];
  industry_averages: { avg_drift_months: number; avg_on_time_pct: number; developer_count: number };
  grade_distribution: Record<string, number>;
  total_developers: number;
}

export interface MetricStats { count: number; mean: number; median: number; p25: number; p75: number }
export interface TechYearRevenue {
  technology: string; year: number;
  revenue_per_mw: MetricStats; energy_price: MetricStats; capacity_factor: MetricStats;
}
export interface RevenueIntelData {
  by_technology_year: TechYearRevenue[];
  yoy_trends: Record<string, Array<{ year: number; revenue_per_mw: number; energy_price: number; cf: number }>>;
  technology_comparison_2024: Record<string, { revenue_per_mw: MetricStats; energy_price: MetricStats; capacity_factor: MetricStats }>;
  offtake_comparison: { year: number; with_offtake: { count: number; revenue_per_mw: MetricStats; energy_price: MetricStats }; without_offtake: { count: number; revenue_per_mw: MetricStats; energy_price: MetricStats } };
}

export interface REZSummary {
  rez: string; total_mw: number; operating_mw: number; pipeline_mw: number;
  project_count: number; congestion_score: number; congestion_level: string;
  technologies: Record<string, Record<string, { count: number; mw: number }>>;
}
export interface GridConnectionData {
  rez_summaries: REZSummary[];
  state_summary: Record<string, { rez_count: number; total_mw: number; pipeline_mw: number; rezs: string[] }>;
  connection_status_overall: Record<string, { count: number; mw: number }>;
  total_rez_zones: number;
}
