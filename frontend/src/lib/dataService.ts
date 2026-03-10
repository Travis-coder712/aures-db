/**
 * Data Service — Loads project data from static JSON files.
 *
 * The JSON files are exported by the Python pipeline into public/data/.
 * In production (GitHub Pages), they're served as static files.
 * In development (Vite dev server), they're served from the public/ directory.
 */
import type { ProjectSummary, Project, Technology, ProjectStatus, State } from './types'

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

export async function fetchProject(technology: Technology, id: string): Promise<Project | null> {
  try {
    const resp = await fetch(`${BASE}/projects/${technology}/${id}.json`)
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
