import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useProjectIndex } from '../hooks/useProjectData'
import { TECHNOLOGY_CONFIG, STATUS_CONFIG, CONFIDENCE_CONFIG, DEVELOPMENT_STAGE_CONFIG, type Technology, type ProjectStatus, type State, type Confidence, type DevelopmentStage } from '../lib/types'
import ProjectCard from '../components/common/ProjectCard'

type SortKey = 'name' | 'capacity_mw' | 'state' | 'status'

function parseMulti<T extends string>(raw: string | null): T[] {
  if (!raw) return []
  return raw.split(',').filter(Boolean) as T[]
}

export default function ProjectList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState<SortKey>('capacity_mw')
  const [sortDesc, setSortDesc] = useState(true)
  const { projects: allProjects, loading } = useProjectIndex()

  // Multi-value filter support (comma-separated)
  const techFilters = parseMulti<Technology>(searchParams.get('tech'))
  const statusFilters = parseMulti<ProjectStatus>(searchParams.get('status'))
  const stateFilters = parseMulti<State>(searchParams.get('state'))
  const confidenceFilter = searchParams.get('confidence') as Confidence | null
  const stageFilters = parseMulti<DevelopmentStage>(searchParams.get('stage'))
  const fromDashboard = searchParams.get('from') === 'dashboard'

  const showStageFilter = statusFilters.includes('development') || (!statusFilters.length && !techFilters.length && !stateFilters.length)

  const filtered = useMemo(() => {
    let result = [...allProjects]

    if (techFilters.length) result = result.filter((p) => techFilters.includes(p.technology))
    if (statusFilters.length) result = result.filter((p) => statusFilters.includes(p.status))
    if (stateFilters.length) result = result.filter((p) => stateFilters.includes(p.state))
    if (confidenceFilter) result = result.filter((p) => p.data_confidence === confidenceFilter)
    if (stageFilters.length) result = result.filter((p) => p.development_stage && stageFilters.includes(p.development_stage))

    result.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
        case 'capacity_mw':
          cmp = a.capacity_mw - b.capacity_mw
          break
        case 'state':
          cmp = a.state.localeCompare(b.state)
          break
        case 'status': {
          const statusOrder = { operating: 0, commissioning: 1, construction: 2, development: 3, withdrawn: 4 }
          cmp = statusOrder[a.status] - statusOrder[b.status]
          break
        }
      }
      return sortDesc ? -cmp : cmp
    })

    return result
  }, [allProjects, techFilters.join(','), statusFilters.join(','), stateFilters.join(','), confidenceFilter, stageFilters.join(','), sortBy, sortDesc])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="text-sm text-[var(--color-text-muted)] animate-pulse">Loading projects...</div>
      </div>
    )
  }

  const totalCapacity = filtered.reduce((sum, p) => sum + p.capacity_mw, 0)
  const activeFilters = [techFilters.length > 0, statusFilters.length > 0, stateFilters.length > 0, confidenceFilter, stageFilters.length > 0].filter(Boolean).length

  function clearFilters() {
    setSearchParams({})
  }

  function toggleFilter(key: string, value: string) {
    const sp = new URLSearchParams(searchParams)
    // Remove 'from' when user changes filters
    sp.delete('from')
    const current = sp.get(key) || ''
    const values = current ? current.split(',').filter(Boolean) : []
    const idx = values.indexOf(value)
    if (idx >= 0) {
      values.splice(idx, 1)
    } else {
      values.push(value)
    }
    if (values.length > 0) {
      sp.set(key, values.join(','))
    } else {
      sp.delete(key)
    }
    setSearchParams(sp)
  }

  function isFilterActive(key: string, value: string): boolean {
    const raw = searchParams.get(key) || ''
    return raw.split(',').includes(value)
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Back to Dashboard */}
      {fromDashboard && (
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:underline mb-4"
        >
          ← Back to Dashboard
        </button>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)] mb-1">
          All Projects
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''} ·{' '}
          {totalCapacity >= 1000
            ? `${(totalCapacity / 1000).toFixed(1)} GW`
            : `${totalCapacity} MW`
          } total capacity
        </p>
      </div>

      {/* Filter Chips */}
      <div className="mb-4 space-y-3">
        {/* Technology */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
            Tech
          </span>
          {(['wind', 'solar', 'bess', 'hybrid', 'offshore_wind', 'pumped_hydro'] as const).map((tech) => {
            const config = TECHNOLOGY_CONFIG[tech]
            const isActive = isFilterActive('tech', tech)
            return (
              <button
                key={tech}
                onClick={() => toggleFilter('tech', tech)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'border-transparent font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
                style={
                  isActive
                    ? { backgroundColor: `${config.color}20`, color: config.color }
                    : undefined
                }
              >
                {config.icon} {config.label}
              </button>
            )
          })}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
            Status
          </span>
          {(['operating', 'commissioning', 'construction', 'development'] as const).map((status) => {
            const config = STATUS_CONFIG[status]
            const isActive = isFilterActive('status', status)
            return (
              <button
                key={status}
                onClick={() => toggleFilter('status', status)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'border-transparent font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
                style={
                  isActive
                    ? { backgroundColor: `${config.color}20`, color: config.color }
                    : undefined
                }
              >
                {config.label}
              </button>
            )
          })}
        </div>

        {/* State */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
            State
          </span>
          {(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS'] as const).map((state) => {
            const isActive = isFilterActive('state', state)
            return (
              <button
                key={state}
                onClick={() => toggleFilter('state', state)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'border-transparent bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
              >
                {state}
              </button>
            )
          })}
        </div>

        {/* Confidence */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
            Data
          </span>
          {(['high', 'good', 'medium', 'low'] as const).map((conf) => {
            const config = CONFIDENCE_CONFIG[conf]
            const isActive = confidenceFilter === conf
            return (
              <button
                key={conf}
                onClick={() => {
                  const sp = new URLSearchParams(searchParams)
                  sp.delete('from')
                  if (isActive) sp.delete('confidence')
                  else sp.set('confidence', conf)
                  setSearchParams(sp)
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'border-transparent font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
                style={
                  isActive
                    ? { backgroundColor: `${config.color}20`, color: config.color }
                    : undefined
                }
              >
                <span className="font-mono text-[10px] mr-1" style={{ color: isActive ? config.color : undefined }}>{config.dots}</span>
                {config.label.replace(' Confidence', '')}
              </button>
            )
          })}
        </div>

        {/* Development Stage (only when development status is shown) */}
        {showStageFilter && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
              Stage
            </span>
            {(['planning_approved', 'planning_submitted', 'early_stage'] as const).map((stage) => {
              const config = DEVELOPMENT_STAGE_CONFIG[stage]
              const isActive = isFilterActive('stage', stage)
              return (
                <button
                  key={stage}
                  onClick={() => toggleFilter('stage', stage)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isActive
                      ? 'border-transparent font-medium'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: `${config.color}20`, color: config.color }
                      : undefined
                  }
                >
                  <span className="mr-1">{config.icon}</span>
                  {config.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Active filters / clear */}
        {activeFilters > 0 && (
          <button
            onClick={clearFilters}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''} ×
          </button>
        )}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-3 mb-4 text-xs text-[var(--color-text-muted)]">
        <span>Sort by:</span>
        {([
          { key: 'capacity_mw', label: 'Capacity' },
          { key: 'name', label: 'Name' },
          { key: 'state', label: 'State' },
          { key: 'status', label: 'Status' },
        ] as const).map((option) => (
          <button
            key={option.key}
            onClick={() => {
              if (sortBy === option.key) {
                setSortDesc(!sortDesc)
              } else {
                setSortBy(option.key)
                setSortDesc(true)
              }
            }}
            className={`px-2 py-0.5 rounded transition-colors ${
              sortBy === option.key
                ? 'text-[var(--color-primary)] font-medium'
                : 'hover:text-[var(--color-text)]'
            }`}
          >
            {option.label}
            {sortBy === option.key && (sortDesc ? ' ↓' : ' ↑')}
          </button>
        ))}
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-[var(--color-text-muted)]">No projects match your filters</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-sm text-[var(--color-primary)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
