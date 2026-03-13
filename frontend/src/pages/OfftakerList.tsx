import { useState, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useOfftakerIndex } from '../hooks/useOfftakerData'
import { TECHNOLOGY_CONFIG, OFFTAKE_TYPE_CONFIG, STATUS_CONFIG, type Technology, type State, type ProjectStatus, type OfftakeType } from '../lib/types'

type SortKey = 'capacity' | 'projects' | 'name'

function parseMulti<T extends string>(raw: string | null): T[] {
  if (!raw) return []
  return raw.split(',').filter(Boolean) as T[]
}

export default function OfftakerList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('capacity')
  const [sortDesc, setSortDesc] = useState(true)
  const { data, loading } = useOfftakerIndex()
  const navigate = useNavigate()

  const stateFilters = parseMulti<State>(searchParams.get('state'))
  const techFilters = parseMulti<Technology>(searchParams.get('tech'))
  const statusFilters = parseMulti<ProjectStatus>(searchParams.get('status'))

  const filtered = useMemo(() => {
    if (!data) return []
    let result = [...data.offtakers]

    if (query) {
      const q = query.toLowerCase()
      result = result.filter((o) => o.name.toLowerCase().includes(q))
    }
    if (stateFilters.length) {
      result = result.filter((o) => o.states.some((s) => stateFilters.includes(s as State)))
    }
    if (techFilters.length) {
      result = result.filter((o) => techFilters.some((t) => o.by_technology[t]))
    }
    if (statusFilters.length) {
      result = result.filter((o) => statusFilters.some((s) => o.by_status[s]))
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
  }, [data, query, stateFilters.join(','), techFilters.join(','), statusFilters.join(','), sortBy, sortDesc])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="text-sm text-[var(--color-text-muted)] animate-pulse">Loading offtakers...</div>
      </div>
    )
  }

  function toggleFilter(key: string, value: string) {
    const sp = new URLSearchParams(searchParams)
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

  const activeFilters = [stateFilters.length > 0, techFilters.length > 0, statusFilters.length > 0].filter(Boolean).length
  const totalCapacity = filtered.reduce((s, o) => s + o.total_capacity_mw, 0)

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)] mb-1">
          Offtakers & PPAs
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {filtered.length} offtaker{filtered.length !== 1 ? 's' : ''} ·{' '}
          {totalCapacity >= 1000
            ? `${(totalCapacity / 1000).toFixed(1)} GW`
            : `${Math.round(totalCapacity)} MW`
          } total project capacity
        </p>
      </div>

      {/* Top Offtakers Quick Buttons */}
      {data && data.offtakers.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
              Top
            </span>
            {[...data.offtakers]
              .sort((a, b) => b.project_count - a.project_count)
              .slice(0, 8)
              .map((o) => (
                <Link
                  key={o.slug}
                  to={`/offtakers/${o.slug}`}
                  className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors"
                >
                  {o.name} <span className="opacity-60">{o.project_count}</span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Search + Dropdown */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search offtakers..."
          className="flex-1 min-w-[200px] max-w-md px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)]/50"
        />
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) navigate(`/offtakers/${e.target.value}`)
          }}
          className="px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]/50 max-w-[220px]"
        >
          <option value="">Jump to offtaker...</option>
          {data && [...data.offtakers]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.name} ({o.project_count})
              </option>
            ))}
        </select>
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

      {/* Offtaker Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((offtaker) => (
          <OfftakerCard key={offtaker.slug} offtaker={offtaker} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-[var(--color-text-muted)]">No offtakers match your filters</p>
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

function OfftakerCard({ offtaker }: { offtaker: { slug: string; name: string; project_count: number; total_capacity_mw: number; types: OfftakeType[]; by_technology: Partial<Record<Technology, number>>; states: string[] } }) {
  const techs = Object.entries(offtaker.by_technology)
    .sort(([, a], [, b]) => (b as number) - (a as number))

  return (
    <Link
      to={`/offtakers/${offtaker.slug}`}
      className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all hover:bg-[var(--color-bg-card)]/80 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight">
          {offtaker.name}
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
          {offtaker.project_count} project{offtaker.project_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Type badges */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {offtaker.types.map((type) => {
          const config = OFFTAKE_TYPE_CONFIG[type]
          return (
            <span
              key={type}
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${config.color}15`, color: config.color }}
            >
              {config.label}
            </span>
          )
        })}
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
        <span className="font-medium text-[var(--color-text)]">
          {offtaker.total_capacity_mw >= 1000
            ? `${(offtaker.total_capacity_mw / 1000).toFixed(1)} GW`
            : `${Math.round(offtaker.total_capacity_mw)} MW`}
        </span>
        <span className="truncate max-w-[140px]">{offtaker.states.join(', ')}</span>
      </div>
    </Link>
  )
}
