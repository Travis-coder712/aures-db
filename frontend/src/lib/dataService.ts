/**
 * Data Service — Loads project data from static JSON files.
 *
 * The JSON files are exported by the Python pipeline into public/data/.
 * In production (GitHub Pages), they're served as static files.
 * In development (Vite dev server), they're served from the public/ directory.
 */
import type { ProjectSummary, Project, Technology, ProjectStatus, State, LeagueTable, LeagueTableIndex, LeagueTechnology, DeveloperIndex, OEMIndex, ContractorIndex, OfftakerIndex, MapProject, CODDriftData, DataSourcesIndex, BESSCapexData, ProjectTimelineData } from './types'

const BASE = import.meta.env.BASE_URL + 'data'

// ============================================================
// Cache
// ============================================================

let projectIndexCache: ProjectSummary[] | null = null
let statsCache: QuickStats | null = null

export interface QuickStats {
  total: number
  total_capacity_mw: number
  total_storage_mwh: number
  by_technology: Record<string, { count: number; capacity_mw: number; storage_mwh: number }>
  by_status: Record<string, { count: number; capacity_mw: number }>
  by_state: Record<string, { count: number; capacity_mw: number }>
}

// ============================================================
// Fetchers
// ============================================================

export async function fetchProjectIndex(): Promise<ProjectSummary[]> {
  if (projectIndexCache) return projectIndexCache

  const resp = await fetch(`${BASE}/projects/index.json`)
  if (!resp.ok) throw new Error(`Failed to load project index: ${resp.status}`)
  const data = await resp.json()
  projectIndexCache = data as ProjectSummary[]
  return projectIndexCache
}

// Map technology to folder name (underscores → hyphens for filesystem)
function techFolder(technology: Technology): string {
  const map: Partial<Record<Technology, string>> = {
    pumped_hydro: 'pumped-hydro',
    offshore_wind: 'offshore-wind',
  }
  return map[technology] ?? technology
}

export async function fetchProject(technology: Technology, id: string): Promise<Project | null> {
  try {
    const resp = await fetch(`${BASE}/projects/${techFolder(technology)}/${id}.json`)
    if (!resp.ok) return null
    return (await resp.json()) as Project
  } catch {
    return null
  }
}

export async function fetchStats(): Promise<QuickStats> {
  if (statsCache) return statsCache

  const resp = await fetch(`${BASE}/metadata/stats.json`)
  if (!resp.ok) throw new Error(`Failed to load stats: ${resp.status}`)
  statsCache = (await resp.json()) as QuickStats
  return statsCache
}

// ============================================================
// Derived helpers
// ============================================================

export async function fetchFilteredProjects(filters: {
  tech?: Technology | null
  status?: ProjectStatus | null
  state?: State | null
}): Promise<ProjectSummary[]> {
  const all = await fetchProjectIndex()
  let result = [...all]

  if (filters.tech) result = result.filter((p) => p.technology === filters.tech)
  if (filters.status) result = result.filter((p) => p.status === filters.status)
  if (filters.state) result = result.filter((p) => p.state === filters.state)

  return result
}

/**
 * Find a project by ID from the index. Returns summary + technology
 * so we know which subdirectory to fetch the full detail from.
 */
export async function findProjectSummary(id: string): Promise<ProjectSummary | null> {
  const all = await fetchProjectIndex()
  return all.find((p) => p.id === id) || null
}

/**
 * Fetch a project by ID (first finds its technology from the index,
 * then fetches the full detail JSON).
 */
export async function fetchProjectById(id: string): Promise<Project | null> {
  const summary = await findProjectSummary(id)
  if (!summary) return null
  return fetchProject(summary.technology, id)
}

// ============================================================
// Performance / League Table Fetchers
// ============================================================

let leagueIndexCache: LeagueTableIndex | null = null

export async function fetchLeagueTableIndex(): Promise<LeagueTableIndex | null> {
  if (leagueIndexCache) return leagueIndexCache
  try {
    const resp = await fetch(`${BASE}/performance/league-tables/index.json`)
    if (!resp.ok) return null
    leagueIndexCache = (await resp.json()) as LeagueTableIndex
    return leagueIndexCache
  } catch {
    return null
  }
}

export async function fetchLeagueTable(tech: LeagueTechnology, year: number): Promise<LeagueTable | null> {
  try {
    const resp = await fetch(`${BASE}/performance/league-tables/${tech}-${year}.json`)
    if (!resp.ok) return null
    return (await resp.json()) as LeagueTable
  } catch {
    return null
  }
}

// ============================================================
// Developer Profiles
// ============================================================

let developerIndexCache: DeveloperIndex | null = null

export async function fetchDeveloperIndex(): Promise<DeveloperIndex> {
  if (developerIndexCache) return developerIndexCache
  const resp = await fetch(`${BASE}/indexes/developer-profiles.json`)
  if (!resp.ok) throw new Error(`Failed to load developer profiles: ${resp.status}`)
  developerIndexCache = (await resp.json()) as DeveloperIndex
  return developerIndexCache
}

// ============================================================
// OEM Profiles
// ============================================================

let oemIndexCache: OEMIndex | null = null

export async function fetchOEMIndex(): Promise<OEMIndex> {
  if (oemIndexCache) return oemIndexCache
  const resp = await fetch(`${BASE}/indexes/oem-profiles.json`)
  if (!resp.ok) throw new Error(`Failed to load OEM profiles: ${resp.status}`)
  oemIndexCache = (await resp.json()) as OEMIndex
  return oemIndexCache
}

// ============================================================
// Contractor Profiles
// ============================================================

let contractorIndexCache: ContractorIndex | null = null

export async function fetchContractorIndex(): Promise<ContractorIndex> {
  if (contractorIndexCache) return contractorIndexCache
  const resp = await fetch(`${BASE}/indexes/contractor-profiles.json`)
  if (!resp.ok) throw new Error(`Failed to load contractor profiles: ${resp.status}`)
  contractorIndexCache = (await resp.json()) as ContractorIndex
  return contractorIndexCache
}

// ============================================================
// Offtaker Data
// ============================================================

let offtakerIndexCache: OfftakerIndex | null = null

export async function fetchOfftakerIndex(): Promise<OfftakerIndex> {
  if (offtakerIndexCache) return offtakerIndexCache
  const resp = await fetch(`${BASE}/indexes/offtaker-profiles.json`)
  if (!resp.ok) throw new Error(`Failed to load offtaker profiles: ${resp.status}`)
  offtakerIndexCache = (await resp.json()) as OfftakerIndex
  return offtakerIndexCache
}

// ============================================================
// Map Data
// ============================================================

let mapDataCache: MapProject[] | null = null

export async function fetchMapData(): Promise<MapProject[]> {
  if (mapDataCache) return mapDataCache
  const resp = await fetch(`${BASE}/indexes/by-coordinates.json`)
  if (!resp.ok) throw new Error(`Failed to load map data: ${resp.status}`)
  mapDataCache = (await resp.json()) as MapProject[]
  return mapDataCache
}

// ============================================================
// COD Drift Data
// ============================================================

let codDriftCache: CODDriftData | null = null

export async function fetchCODDrift(): Promise<CODDriftData | null> {
  if (codDriftCache) return codDriftCache
  try {
    const resp = await fetch(`${BASE}/indexes/cod-drift.json`)
    if (!resp.ok) return null
    codDriftCache = (await resp.json()) as CODDriftData
    return codDriftCache
  } catch {
    return null
  }
}

/**
 * Compute quick stats from the index (fallback if stats.json unavailable).
 */
export function computeStatsFromIndex(projects: ProjectSummary[]): QuickStats {
  const stats: QuickStats = {
    total: projects.length,
    total_capacity_mw: 0,
    total_storage_mwh: 0,
    by_technology: {},
    by_status: {},
    by_state: {},
  }

  for (const p of projects) {
    stats.total_capacity_mw += p.capacity_mw
    stats.total_storage_mwh += p.storage_mwh || 0

    // By tech
    if (!stats.by_technology[p.technology]) {
      stats.by_technology[p.technology] = { count: 0, capacity_mw: 0, storage_mwh: 0 }
    }
    stats.by_technology[p.technology].count++
    stats.by_technology[p.technology].capacity_mw += p.capacity_mw
    stats.by_technology[p.technology].storage_mwh += p.storage_mwh || 0

    // By status
    if (!stats.by_status[p.status]) {
      stats.by_status[p.status] = { count: 0, capacity_mw: 0 }
    }
    stats.by_status[p.status].count++
    stats.by_status[p.status].capacity_mw += p.capacity_mw

    // By state
    if (!stats.by_state[p.state]) {
      stats.by_state[p.state] = { count: 0, capacity_mw: 0 }
    }
    stats.by_state[p.state].count++
    stats.by_state[p.state].capacity_mw += p.capacity_mw
  }

  return stats
}

// ============================================================
// Data Sources Status
// ============================================================

let dataSourcesCache: DataSourcesIndex | null = null

let bessCapexCache: BESSCapexData | null = null

export async function fetchBESSCapex(): Promise<BESSCapexData | null> {
  if (bessCapexCache) return bessCapexCache
  try {
    const resp = await fetch(`${BASE}/analytics/bess-capex.json`)
    if (!resp.ok) return null
    bessCapexCache = (await resp.json()) as BESSCapexData
    return bessCapexCache
  } catch {
    return null
  }
}

let projectTimelineCache: ProjectTimelineData | null = null
export async function fetchProjectTimeline(): Promise<ProjectTimelineData | null> {
  if (projectTimelineCache) return projectTimelineCache
  try {
    const resp = await fetch(`${BASE}/analytics/project-timeline.json`)
    if (!resp.ok) return null
    projectTimelineCache = (await resp.json()) as ProjectTimelineData
    return projectTimelineCache
  } catch {
    return null
  }
}

export async function fetchDataSources(): Promise<DataSourcesIndex | null> {
  if (dataSourcesCache) return dataSourcesCache
  try {
    const resp = await fetch(`${BASE}/metadata/data-sources.json`)
    if (!resp.ok) return null
    dataSourcesCache = (await resp.json()) as DataSourcesIndex
    return dataSourcesCache
  } catch {
    return null
  }
}
