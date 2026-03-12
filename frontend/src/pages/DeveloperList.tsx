import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDeveloperIndex } from '../hooks/useDeveloperData'
import { TECHNOLOGY_CONFIG, type Technology, type State } from '../lib/types'

type SortKey = 'capacity' | 'projects' | 'name'

export default function DeveloperList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('capacity')
  const [sortDesc, setSortDesc] = useState(true)
  const { data, loading } = useDeveloperIndex()

  const stateFilter = searchParams.get('state') as State | null
  const techFilter = searchParams.get('tech') as Technology | null

  const filtered = useMemo(() => {
    if (!data) return []
    let result = [...data.developers]

    if (query) {
      const q = query.toLowerCase()
      result = result.filter((d) => d.name.toLowerCase().includes(q))
    }
    if (stateFilter) {
      result = result.filter((d) => d.states.includes(stateFilter))
    }
    if (techFilter) {
      result = result.filter((d) => d.by_technology[techFilter])
    }

    result.sort((a, b) => {
      let cmp = 0
      switch (sortBy) {
        case 'capacity':
          cmp = a.total_capacity_mw - b.total_capacity_mw
          break
        case 'projects':
          cmp = a.project_count - b.project_count
          break
        case 'name':
          cmp = a.name.localeCompare(b.name)
          break
      }
      return sortDesc ? -cmp : cmp
    })

    return result
  }, [data, query, stateFilter, techFilter, sortBy, sortDesc])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="text-sm text-[var(--color-text-muted)] animate-pulse">Loading developers...</div>
      </div>
    )
  }

  function toggleFilter(key: string, value: string) {
    const current = searchParams.get(key)
    if (current === value) {
      searchParams.delete(key)
    } else {
      searchParams.set(key, value)
    }
    setSearchParams(searchParams)
  }

  const activeFilters = [stateFilter, techFilter].filter(Boolean).length

  const totalCapacity = filtered.reduce((s, d) => s + d.total_capacity_mw, 0)

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)] mb-1">
          Developers
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {filtered.length} developer{filtered.length !== 1 ? 's' : ''} ·{' '}
          {totalCapacity >= 1000
            ? `${(totalCapacity / 1000).toFixed(1)} GW`
            : `${Math.round(totalCapacity)} MW`
          } total capacity
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search developers..."
          className="w-full max-w-md px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)]/50"
        />
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
            const isActive = techFilter === tech
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

        {/* State */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
            State
          </span>
          {(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS'] as const).map((state) => {
            const isActive = stateFilter === state
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

        {activeFilters > 0 && (
          <button
            onClick={() => setSearchParams({})}
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
          { key: 'capacity', label: 'Capacity' },
          { key: 'projects', label: 'Projects' },
          { key: 'name', label: 'Name' },
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

      {/* Developer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((dev) => (
          <DeveloperCard key={dev.slug} developer={dev} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-[var(--color-text-muted)]">No developers match your filters</p>
          <button
            onClick={() => { setQuery(''); setSearchParams({}) }}
            className="mt-2 text-sm text-[var(--color-primary)] hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}

function DeveloperCard({ developer }: { developer: { slug: string; name: string; project_count: number; total_capacity_mw: number; total_storage_mwh: number; by_technology: Partial<Record<Technology, number>>; states: string[] } }) {
  const techs = Object.entries(developer.by_technology)
    .sort(([, a], [, b]) => b - a)

  return (
    <Link
      to={`/developers/${developer.slug}`}
      className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all hover:bg-[var(--color-bg-card)]/80 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight">
          {developer.name}
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
          {developer.project_count} project{developer.project_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tech breakdown pills */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {techs.map(([tech, count]) => {
          const config = TECHNOLOGY_CONFIG[tech as Technology]
          if (!config) return null
          return (
            <span
              key={tech}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${config.color}15`, color: config.color }}
            >
              {config.icon} {count}
            </span>
          )
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <span className="font-medium text-[var(--color-text)]">
            {developer.total_capacity_mw >= 1000
              ? `${(developer.total_capacity_mw / 1000).toFixed(1)} GW`
              : `${Math.round(developer.total_capacity_mw)} MW`}
          </span>
          {developer.total_storage_mwh > 0 && (
            <span>
              {developer.total_storage_mwh >= 1000
                ? `${(developer.total_storage_mwh / 1000).toFixed(1)} GWh`
                : `${Math.round(developer.total_storage_mwh)} MWh`}
            </span>
          )}
        </div>
        <span className="truncate max-w-[140px]">{developer.states.join(', ')}</span>
      </div>
    </Link>
  )
}
