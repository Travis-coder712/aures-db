import { useState, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useOEMIndex } from '../hooks/useOEMData'
import { TECHNOLOGY_CONFIG, OEM_ROLE_CONFIG, STATUS_CONFIG, type Technology, type State, type ProjectStatus, type OEMRole, type OEMProfile } from '../lib/types'
import DataProvenance from '../components/common/DataProvenance'

type SortKey = 'capacity' | 'projects' | 'name'

function parseMulti<T extends string>(raw: string | null): T[] {
  if (!raw) return []
  return raw.split(',').filter(Boolean) as T[]
}

export default function OEMList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('capacity')
  const [sortDesc, setSortDesc] = useState(true)
  const { data, loading } = useOEMIndex()
  const navigate = useNavigate()

  const stateFilters = parseMulti<State>(searchParams.get('state'))
  const techFilters = parseMulti<Technology>(searchParams.get('tech'))
  const statusFilters = parseMulti<ProjectStatus>(searchParams.get('status'))

  const filtered = useMemo(() => {
    if (!data) return []
    let result = [...data.oems]

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
        <div className="text-sm text-[var(--color-text-muted)] animate-pulse">Loading OEMs...</div>
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
          Equipment Suppliers (OEMs)
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {filtered.length} OEM{filtered.length !== 1 ? 's' : ''} ·{' '}
          {totalCapacity >= 1000
            ? `${(totalCapacity / 1000).toFixed(1)} GW`
            : `${Math.round(totalCapacity)} MW`
          } total project capacity
        </p>
        <div className="mt-3">
          <DataProvenance page="oems" />
        </div>
      </div>

      {/* Top OEMs Quick Buttons */}
      {data && data.oems.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
              Top
            </span>
            {[...data.oems]
              .sort((a, b) => b.project_count - a.project_count)
              .slice(0, 8)
              .map((oem) => (
                <Link
                  key={oem.slug}
                  to={`/oems/${oem.slug}`}
                  className="text-xs px-2.5 py-1 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors"
                >
                  {oem.name} <span className="opacity-60">{oem.project_count}</span>
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
          placeholder="Search OEMs..."
          className="flex-1 min-w-[200px] max-w-md px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]/50 focus:outline-none focus:border-[var(--color-primary)]/50"
        />
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) navigate(`/oems/${e.target.value}`)
          }}
          className="px-3 py-2 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]/50 max-w-[220px]"
        >
          <option value="">Jump to OEM...</option>
          {data && [...data.oems]
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

      {/* Market Share Charts */}
      {data && <BESSMarketShare oems={data.oems} stateFilters={stateFilters} statusFilters={statusFilters} navigate={navigate} />}
      {data && <WindMarketShare oems={data.oems} stateFilters={stateFilters} statusFilters={statusFilters} navigate={navigate} />}
      {data && <SolarMarketShare oems={data.oems} stateFilters={stateFilters} statusFilters={statusFilters} navigate={navigate} />}

      {/* OEM Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((oem) => (
          <OEMCard key={oem.slug} oem={oem} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg text-[var(--color-text-muted)]">No OEMs match your filters</p>
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

function OEMCard({ oem }: { oem: { slug: string; name: string; project_count: number; total_capacity_mw: number; roles: OEMRole[]; models: string[]; by_technology: Partial<Record<Technology, number>>; states: string[] } }) {
  const techs = Object.entries(oem.by_technology)
    .sort(([, a], [, b]) => (b as number) - (a as number))

  return (
    <Link
      to={`/oems/${oem.slug}`}
      className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all hover:bg-[var(--color-bg-card)]/80 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight">
          {oem.name}
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] flex-shrink-0">
          {oem.project_count} project{oem.project_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Role badges */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {oem.roles.map((role) => {
          const config = OEM_ROLE_CONFIG[role]
          return (
            <span
              key={role}
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

      {/* Models preview */}
      {oem.models.length > 0 && (
        <p className="text-[10px] text-[var(--color-text-muted)] mb-2 truncate">
          {oem.models.slice(0, 3).join(' · ')}{oem.models.length > 3 ? ` +${oem.models.length - 3}` : ''}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span className="font-medium text-[var(--color-text)]">
          {oem.total_capacity_mw >= 1000
            ? `${(oem.total_capacity_mw / 1000).toFixed(1)} GW`
            : `${Math.round(oem.total_capacity_mw)} MW`}
        </span>
        <span className="truncate max-w-[140px]">{oem.states.join(', ')}</span>
      </div>
    </Link>
  )
}

// ─── Pie Chart Colours ───
const PIE_COLORS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#a855f7',
  '#64748b', '#84cc16', '#e11d48', '#0ea5e9', '#d946ef',
]

type PieMetric = 'projects' | 'mw' | 'mwh'

function BESSMarketShare({
  oems,
  stateFilters,
  statusFilters,
  navigate,
}: {
  oems: OEMProfile[]
  stateFilters: State[]
  statusFilters: ProjectStatus[]
  navigate: (path: string) => void
}) {
  const [metric, setMetric] = useState<PieMetric>('projects')

  const chartData = useMemo(() => {
    const bessOems = oems.filter((o) => o.by_technology.bess)

    return bessOems.map((oem) => {
      let count = 0
      let mw = 0
      let mwh = 0

      if (!stateFilters.length && !statusFilters.length) {
        count = oem.by_technology.bess ?? 0
        mw = oem.total_capacity_mw
        mwh = oem.total_storage_mwh
      } else {
        if (statusFilters.length && !stateFilters.length) {
          for (const s of statusFilters) {
            const d = oem.status_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw; mwh += d.storage_mwh }
          }
        } else if (stateFilters.length && !statusFilters.length) {
          for (const s of stateFilters) {
            const d = oem.state_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw; mwh += d.storage_mwh }
          }
        } else {
          for (const s of statusFilters) {
            const d = oem.status_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw; mwh += d.storage_mwh }
          }
        }
      }

      return { name: oem.name, slug: oem.slug, projects: count, mw: Math.round(mw), mwh: Math.round(mwh) }
    })
      .filter((d) => d[metric] > 0)
      .sort((a, b) => b[metric] - a[metric])
  }, [oems, stateFilters.join(','), statusFilters.join(','), metric])

  const threshold = 0.03
  const total = chartData.reduce((s, d) => s + d[metric], 0)
  const mainSlices: { name: string; value: number; slug?: string }[] = []
  let otherValue = 0

  for (const d of chartData) {
    if (d[metric] / total >= threshold) {
      mainSlices.push({ name: d.name, value: d[metric], slug: d.slug })
    } else {
      otherValue += d[metric]
    }
  }
  if (otherValue > 0) mainSlices.push({ name: 'Other', value: otherValue })

  const metricLabel = metric === 'projects' ? 'Projects' : metric === 'mw' ? 'MW' : 'MWh'
  const filterDesc = [
    stateFilters.length ? stateFilters.join(', ') : '',
    statusFilters.length ? statusFilters.join(', ') : '',
  ].filter(Boolean).join(' · ')

  if (mainSlices.length === 0) return null

  return (
    <section className="mb-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">BESS Market Share</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {chartData.length} OEMs · {total.toLocaleString()} {metricLabel} total
            {filterDesc && ` · ${filterDesc}`} · Click slices to view projects
          </p>
        </div>
        <div className="flex gap-1">
          {([
            { key: 'projects', label: '# Projects' },
            { key: 'mw', label: 'MW' },
            { key: 'mwh', label: 'MWh' },
          ] as const).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMetric(opt.key)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                metric === opt.key
                  ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mainSlices}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              cursor="pointer"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) => {
                const pct = props.percent ?? 0
                return pct > 0.05 ? `${props.name ?? ''} ${(pct * 100).toFixed(0)}%` : ''
              }}
              labelLine={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(_: any, index: number) => {
                const slice = mainSlices[index]
                if (slice?.slug) {
                  navigate(`/oems/${slice.slug}`)
                }
              }}
            >
              {mainSlices.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 13,
              }}
              formatter={(value) => `${Number(value).toLocaleString()} ${metricLabel}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

// ─── Wind Market Share Pie Chart ───
type WindPieMetric = 'projects' | 'mw'

function WindMarketShare({
  oems,
  stateFilters,
  statusFilters,
  navigate,
}: {
  oems: OEMProfile[]
  stateFilters: State[]
  statusFilters: ProjectStatus[]
  navigate: (path: string) => void
}) {
  const [metric, setMetric] = useState<WindPieMetric>('projects')

  const chartData = useMemo(() => {
    const windOems = oems.filter((o) => o.by_technology.wind)

    return windOems.map((oem) => {
      let count = 0
      let mw = 0

      if (!stateFilters.length && !statusFilters.length) {
        count = oem.by_technology.wind ?? 0
        mw = oem.total_capacity_mw
      } else {
        if (statusFilters.length && !stateFilters.length) {
          for (const s of statusFilters) {
            const d = oem.status_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw }
          }
        } else if (stateFilters.length && !statusFilters.length) {
          for (const s of stateFilters) {
            const d = oem.state_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw }
          }
        } else {
          for (const s of statusFilters) {
            const d = oem.status_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw }
          }
        }
      }

      return { name: oem.name, slug: oem.slug, projects: count, mw: Math.round(mw) }
    })
      .filter((d) => d[metric] > 0)
      .sort((a, b) => b[metric] - a[metric])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oems, stateFilters.join(','), statusFilters.join(','), metric])

  const threshold = 0.03
  const total = chartData.reduce((s, d) => s + d[metric], 0)
  const mainSlices: { name: string; value: number; slug?: string }[] = []
  let otherValue = 0

  for (const d of chartData) {
    if (d[metric] / total >= threshold) {
      mainSlices.push({ name: d.name, value: d[metric], slug: d.slug })
    } else {
      otherValue += d[metric]
    }
  }
  if (otherValue > 0) mainSlices.push({ name: 'Other', value: otherValue })

  const metricLabel = metric === 'projects' ? 'Projects' : 'MW'
  const filterDesc = [
    stateFilters.length ? stateFilters.join(', ') : '',
    statusFilters.length ? statusFilters.join(', ') : '',
  ].filter(Boolean).join(' · ')

  if (mainSlices.length === 0) return null

  return (
    <section className="mb-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Wind OEM Market Share</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {chartData.length} OEMs · {total >= 1000 ? `${(total / 1000).toFixed(1)} GW` : `${total.toLocaleString()} MW`} total
            {filterDesc && ` · ${filterDesc}`} · Click slices to view projects
          </p>
        </div>
        <div className="flex gap-1">
          {([
            { key: 'projects' as const, label: '# Projects' },
            { key: 'mw' as const, label: 'MW' },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMetric(opt.key)}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                metric === opt.key
                  ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                  : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mainSlices}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              cursor="pointer"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) => {
                const pct = props.percent ?? 0
                return pct > 0.05 ? `${props.name ?? ''} ${(pct * 100).toFixed(0)}%` : ''
              }}
              labelLine={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(_: any, index: number) => {
                const slice = mainSlices[index]
                if (slice?.slug) {
                  navigate(`/oems/${slice.slug}`)
                }
              }}
            >
              {mainSlices.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 13,
              }}
              formatter={(value) => `${Number(value).toLocaleString()} ${metricLabel}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

// ========================================================================
// SolarMarketShare — pie chart of solar OEM market share (panels + inverters)
// ========================================================================
function SolarMarketShare({
  oems,
  stateFilters,
  statusFilters,
  navigate,
}: {
  oems: OEMProfile[]
  stateFilters: State[]
  statusFilters: ProjectStatus[]
  navigate: (path: string) => void
}) {
  const [metric, setMetric] = useState<WindPieMetric>('projects')
  const [scope, setScope] = useState<'panels' | 'inverters'>('panels')

  const chartData = useMemo(() => {
    // Panels = solar_oem role; Inverters = inverter role with solar projects
    const solarOems = oems.filter((o) => {
      if (scope === 'panels') return o.roles.includes('solar_oem') && o.by_technology.solar
      return o.roles.includes('inverter') && o.by_technology.solar
    })

    return solarOems.map((oem) => {
      let count = 0
      let mw = 0

      if (!stateFilters.length && !statusFilters.length) {
        count = oem.by_technology.solar ?? 0
        mw = oem.total_capacity_mw
      } else {
        if (statusFilters.length && !stateFilters.length) {
          for (const s of statusFilters) {
            const d = oem.status_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw }
          }
        } else if (stateFilters.length && !statusFilters.length) {
          for (const s of stateFilters) {
            const d = oem.state_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw }
          }
        } else {
          for (const s of statusFilters) {
            const d = oem.status_detail[s]
            if (d) { count += d.count; mw += d.capacity_mw }
          }
        }
      }

      return { name: oem.name, slug: oem.slug, projects: count, mw: Math.round(mw) }
    })
      .filter((d) => d[metric] > 0)
      .sort((a, b) => b[metric] - a[metric])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oems, stateFilters.join(','), statusFilters.join(','), metric, scope])

  const threshold = 0.03
  const total = chartData.reduce((s, d) => s + d[metric], 0)
  const mainSlices: { name: string; value: number; slug?: string }[] = []
  let otherValue = 0

  for (const d of chartData) {
    if (d[metric] / total >= threshold) {
      mainSlices.push({ name: d.name, value: d[metric], slug: d.slug })
    } else {
      otherValue += d[metric]
    }
  }
  if (otherValue > 0) mainSlices.push({ name: 'Other', value: otherValue })

  const metricLabel = metric === 'projects' ? 'Projects' : 'MW'
  const filterDesc = [
    stateFilters.length ? stateFilters.join(', ') : '',
    statusFilters.length ? statusFilters.join(', ') : '',
  ].filter(Boolean).join(' · ')

  if (mainSlices.length === 0) return null

  return (
    <section className="mb-6 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Solar {scope === 'panels' ? 'Panel' : 'Inverter'} OEM Market Share
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            {chartData.length} OEMs · {total >= 1000 ? `${(total / 1000).toFixed(1)} GW` : `${total.toLocaleString()} MW`} total
            {filterDesc && ` · ${filterDesc}`} · Click slices to view projects
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex gap-1">
            {([
              { key: 'panels' as const, label: 'Panels' },
              { key: 'inverters' as const, label: 'Inverters' },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setScope(opt.key)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  scope === opt.key
                    ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-[var(--color-border)]">|</span>
          <div className="flex gap-1">
            {([
              { key: 'projects' as const, label: '# Projects' },
              { key: 'mw' as const, label: 'MW' },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setMetric(opt.key)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  metric === opt.key
                    ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={mainSlices}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              cursor="pointer"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) => {
                const pct = props.percent ?? 0
                return pct > 0.05 ? `${props.name ?? ''} ${(pct * 100).toFixed(0)}%` : ''
              }}
              labelLine={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={(_: any, index: number) => {
                const slice = mainSlices[index]
                if (slice?.slug) {
                  navigate(`/oems/${slice.slug}`)
                }
              }}
            >
              {mainSlices.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                color: '#f1f5f9',
                fontSize: 13,
              }}
              formatter={(value) => `${Number(value).toLocaleString()} ${metricLabel}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
