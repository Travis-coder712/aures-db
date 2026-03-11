import { useMemo } from 'react'
import type { ProjectSummary, Technology, ProjectStatus, State } from '../lib/types'
import { useProjectIndex } from './useProjectData'

export interface TechStatusBreakdown {
  technology: Technology
  label: string
  operating: number
  construction: number
  development: number
  total: number
}

export interface StateStatusBreakdown {
  state: State
  operating: number
  construction: number
  development: number
  total: number
}

export interface PipelineProject {
  id: string
  name: string
  technology: Technology
  capacity_mw: number
  storage_mwh?: number | null
  state: State
  developer?: string
}

export interface NEMStats {
  operating_gw: number
  construction_gw: number
  development_gw: number
  total_storage_gwh: number
  by_technology: TechStatusBreakdown[]
  by_state: StateStatusBreakdown[]
  pipeline: PipelineProject[]
}

const TECH_ORDER: Technology[] = ['wind', 'solar', 'bess', 'hybrid', 'offshore_wind', 'pumped_hydro']
const TECH_LABELS: Record<Technology, string> = {
  wind: 'Wind',
  solar: 'Solar',
  bess: 'BESS',
  hybrid: 'Hybrid',
  pumped_hydro: 'Pumped Hydro',
  offshore_wind: 'Offshore Wind',
  gas: 'Gas',
}

const STATE_ORDER: State[] = ['NSW', 'QLD', 'VIC', 'SA', 'TAS', 'WA']
const ACTIVE_STATUSES: ProjectStatus[] = ['operating', 'construction', 'development']

function sumCapacity(projects: ProjectSummary[], status: ProjectStatus): number {
  return projects
    .filter((p) => p.status === status)
    .reduce((sum, p) => sum + p.capacity_mw, 0)
}

function sumStorage(projects: ProjectSummary[]): number {
  return projects.reduce((sum, p) => sum + (p.storage_mwh ?? 0), 0)
}

export function useNEMStats() {
  const { projects, loading, error } = useProjectIndex()

  const stats = useMemo<NEMStats | null>(() => {
    if (!projects.length) return null

    // Filter out withdrawn
    const active = projects.filter((p) => ACTIVE_STATUSES.includes(p.status))

    // Headline stats
    const operating_gw = sumCapacity(projects, 'operating') / 1000
    const construction_gw =
      (sumCapacity(projects, 'construction') + sumCapacity(projects, 'commissioning')) / 1000
    const development_gw = sumCapacity(projects, 'development') / 1000
    const total_storage_gwh = sumStorage(projects) / 1000

    // By technology
    const by_technology: TechStatusBreakdown[] = TECH_ORDER.map((tech) => {
      const techProjects = active.filter((p) => p.technology === tech)
      return {
        technology: tech,
        label: TECH_LABELS[tech],
        operating: sumCapacity(techProjects, 'operating') / 1000,
        construction:
          (sumCapacity(techProjects, 'construction') +
            sumCapacity(techProjects, 'commissioning')) /
          1000,
        development: sumCapacity(techProjects, 'development') / 1000,
        total: techProjects.reduce((s, p) => s + p.capacity_mw, 0) / 1000,
      }
    })

    // By state
    const by_state: StateStatusBreakdown[] = STATE_ORDER.map((state) => {
      const stateProjects = active.filter((p) => p.state === state)
      return {
        state,
        operating: sumCapacity(stateProjects, 'operating') / 1000,
        construction:
          (sumCapacity(stateProjects, 'construction') +
            sumCapacity(stateProjects, 'commissioning')) /
          1000,
        development: sumCapacity(stateProjects, 'development') / 1000,
        total: stateProjects.reduce((s, p) => s + p.capacity_mw, 0) / 1000,
      }
    })

    // Construction pipeline
    const pipeline: PipelineProject[] = projects
      .filter((p) => p.status === 'construction' || p.status === 'commissioning')
      .sort((a, b) => b.capacity_mw - a.capacity_mw)
      .map((p) => ({
        id: p.id,
        name: p.name,
        technology: p.technology,
        capacity_mw: p.capacity_mw,
        storage_mwh: p.storage_mwh,
        state: p.state,
        developer: p.current_developer,
      }))

    return {
      operating_gw,
      construction_gw,
      development_gw,
      total_storage_gwh,
      by_technology,
      by_state,
      pipeline,
    }
  }, [projects])

  return { stats, loading, error }
}
