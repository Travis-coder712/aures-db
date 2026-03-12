import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useProjectIndex } from '../hooks/useProjectData'
import { useCODDrift } from '../hooks/useCODDrift'
import { TECHNOLOGY_CONFIG, STATUS_CONFIG, CONFIDENCE_CONFIG } from '../lib/types'
import type { Technology, ProjectStatus, State, Confidence } from '../lib/types'

const STATUS_COLORS: Record<string, string> = {
  operating: '#22c55e',
  construction: '#f59e0b',
  development: '#3b82f6',
}

const TECH_ORDER: Technology[] = ['wind', 'solar', 'bess', 'hybrid', 'offshore_wind', 'pumped_hydro']
const STATE_ORDER: State[] = ['NSW', 'QLD', 'VIC', 'SA', 'TAS', 'WA']
const STATUS_ORDER: ProjectStatus[] = ['operating', 'construction', 'development']
const ACTIVE_STATUSES: ProjectStatus[] = ['operating', 'commissioning', 'construction', 'development']

function toggleInSet<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set)
  if (next.has(item)) next.delete(item)
  else next.add(item)
  return next
}

function parseSet<T extends string>(raw: string | null): Set<T> {
  if (!raw) return new Set()
  return new Set(raw.split(',').filter(Boolean) as T[])
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { projects: allProjects, loading } = useProjectIndex()
  const { data: codDrift } = useCODDrift()

  // Filter state from URL
  const selectedTechs = useMemo(() => parseSet<Technology>(searchParams.get('tech')), [searchParams])
  const selectedStates = useMemo(() => parseSet<State>(searchParams.get('state')), [searchParams])
  const selectedStatuses = useMemo(() => parseSet<ProjectStatus>(searchParams.get('status')), [searchParams])
  const hasFilters = selectedTechs.size > 0 || selectedStates.size > 0 || selectedStatuses.size > 0

  function updateParam(key: string, set: Set<string>) {
    const sp = new URLSearchParams(searchParams)
    if (set.size > 0) sp.set(key, [...set].join(','))
    else sp.delete(key)
    setSearchParams(sp, { replace: true })
  }

  function toggleTech(tech: Technology) {
    updateParam('tech', toggleInSet(selectedTechs, tech) as unknown as Set<string>)
  }
  function toggleState(state: State) {
    updateParam('state', toggleInSet(selectedStates, state) as unknown as Set<string>)
  }
  function toggleStatus(status: ProjectStatus) {
    updateParam('status', toggleInSet(selectedStatuses, status) as unknown as Set<string>)
  }
  function resetFilters() {
    setSearchParams({}, { replace: true })
  }

  // Filter projects
  const filtered = useMemo(() => {
    let result = allProjects.filter((p) => ACTIVE_STATUSES.includes(p.status))
    if (selectedTechs.size > 0) result = result.filter((p) => selectedTechs.has(p.technology))
    if (selectedStates.size > 0) result = result.filter((p) => selectedStates.has(p.state))
    if (selectedStatuses.size > 0) {
      result = result.filter((p) => {
        if (p.status === 'commissioning') return selectedStatuses.has('construction')
        return selectedStatuses.has(p.status)
      })
    }
    return result
  }, [allProjects, selectedTechs, selectedStates, selectedStatuses])

  // Headline stats
  const hs = useMemo(() => {
    const op = filtered.filter((p) => p.status === 'operating')
    const con = filtered.filter((p) => p.status === 'construction' || p.status === 'commissioning')
    const dev = filtered.filter((p) => p.status === 'development')
    return {
      operating_gw: op.reduce((s, p) => s + p.capacity_mw, 0) / 1000,
      construction_gw: con.reduce((s, p) => s + p.capacity_mw, 0) / 1000,
      construction_count: con.length,
      development_gw: dev.reduce((s, p) => s + p.capacity_mw, 0) / 1000,
      storage_gwh: filtered.reduce((s, p) => s + (p.storage_mwh ?? 0), 0) / 1000,
      total: filtered.length,
    }
  }, [filtered])

  // Tech chart data
  const techData = useMemo(() => {
    const techs = selectedTechs.size > 0 ? TECH_ORDER.filter((t) => selectedTechs.has(t)) : TECH_ORDER
    return techs.map((tech) => {
      const tp = filtered.filter((p) => p.technology === tech)
      return {
        technology: tech,
        label: TECHNOLOGY_CONFIG[tech].label,
        operating: tp.filter((p) => p.status === 'operating').reduce((s, p) => s + p.capacity_mw, 0) / 1000,
        construction: tp.filter((p) => p.status === 'construction' || p.status === 'commissioning').reduce((s, p) => s + p.capacity_mw, 0) / 1000,
        development: tp.filter((p) => p.status === 'development').reduce((s, p) => s + p.capacity_mw, 0) / 1000,
      }
    })
  }, [filtered, selectedTechs])

  // State chart data
  const stateData = useMemo(() => {
    const states = selectedStates.size > 0 ? STATE_ORDER.filter((s) => selectedStates.has(s)) : STATE_ORDER
    return states.map((state) => {
      const sp = filtered.filter((p) => p.state === state)
      return {
        state,
        operating: sp.filter((p) => p.status === 'operating').reduce((s, p) => s + p.capacity_mw, 0) / 1000,
        construction: sp.filter((p) => p.status === 'construction' || p.status === 'commissioning').reduce((s, p) => s + p.capacity_mw, 0) / 1000,
        development: sp.filter((p) => p.status === 'development').reduce((s, p) => s + p.capacity_mw, 0) / 1000,
      }
    })
  }, [filtered, selectedStates])

  // Confidence breakdown (tech+state filtered, not status filtered)
  const confData = useMemo(() => {
    let base = allProjects
    if (selectedTechs.size > 0) base = base.filter((p) => selectedTechs.has(p.technology))
    if (selectedStates.size > 0) base = base.filter((p) => selectedStates.has(p.state))
    const tiers: Confidence[] = ['high', 'good', 'medium', 'low']
    return {
      total: base.length,
      items: tiers.map((tier) => {
        const count = base.filter((p) => p.data_confidence === tier).length
        return { tier, count, pct: base.length ? Math.round((count / base.length) * 100) : 0 }
      }),
    }
  }, [allProjects, selectedTechs, selectedStates])

  // Construction pipeline
  const pipeline = useMemo(() => {
    return filtered
      .filter((p) => p.status === 'construction' || p.status === 'commissioning')
      .sort((a, b) => b.capacity_mw - a.capacity_mw)
  }, [filtered])

  // Build visible bar configs
  const showOp = selectedStatuses.size === 0 || selectedStatuses.has('operating')
  const showCon = selectedStatuses.size === 0 || selectedStatuses.has('construction')
  const showDev = selectedStatuses.size === 0 || selectedStatuses.has('development')

  const visibleBars = [
    showOp && { key: 'operating', name: 'Operating' },
    showCon && { key: 'construction', name: 'Construction' },
    showDev && { key: 'development', name: 'Development' },
  ].filter(Boolean) as { key: string; name: string }[]

  // Chart click → navigate to filtered project list
  function drillTech(techKey: string, statusKey: string) {
    const params = new URLSearchParams()
    params.set('tech', techKey)
    params.set('status', statusKey === 'construction' ? 'construction,commissioning' : statusKey)
    if (selectedStates.size > 0) params.set('state', [...selectedStates].join(','))
    params.set('from', 'dashboard')
    navigate(`/projects?${params.toString()}`)
  }

  function drillState(stateKey: string, statusKey: string) {
    const params = new URLSearchParams()
    params.set('state', stateKey)
    params.set('status', statusKey === 'construction' ? 'construction,commissioning' : statusKey)
    if (selectedTechs.size > 0) params.set('tech', [...selectedTechs].join(','))
    params.set('from', 'dashboard')
    navigate(`/projects?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--color-bg-card)] rounded w-48" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[var(--color-bg-card)] rounded-xl h-24" />
            ))}
          </div>
          <div className="bg-[var(--color-bg-card)] rounded-xl h-80" />
        </div>
      </div>
    )
  }

  const totalGW = hs.operating_gw + hs.construction_gw + hs.development_gw

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mb-1">
          NEM Fleet Dashboard
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {hasFilters
            ? `${hs.total.toLocaleString()} projects matching filters · ${totalGW.toFixed(0)} GW`
            : `${hs.total.toLocaleString()} projects tracked · ${totalGW.toFixed(0)} GW total capacity`}
        </p>
      </section>

      {/* Filter Bar */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Filters
          </span>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-[11px] text-[var(--color-primary)] hover:underline"
            >
              Reset all
            </button>
          )}
        </div>

        {/* Tech pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]/60 w-11 flex-shrink-0">
            Tech
          </span>
          {TECH_ORDER.map((tech) => {
            const config = TECHNOLOGY_CONFIG[tech]
            const isActive = selectedTechs.has(tech)
            return (
              <button
                key={tech}
                onClick={() => toggleTech(tech)}
                className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'border-transparent font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
                style={isActive ? { backgroundColor: `${config.color}20`, color: config.color } : undefined}
              >
                {config.icon} {config.label}
              </button>
            )
          })}
        </div>

        {/* State pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]/60 w-11 flex-shrink-0">
            State
          </span>
          {STATE_ORDER.map((state) => {
            const isActive = selectedStates.has(state)
            return (
              <button
                key={state}
                onClick={() => toggleState(state)}
                className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
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

        {/* Status pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]/60 w-11 flex-shrink-0">
            Status
          </span>
          {STATUS_ORDER.map((status) => {
            const config = STATUS_CONFIG[status]
            const isActive = selectedStatuses.has(status)
            return (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'border-transparent font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
                style={isActive ? { backgroundColor: `${config.color}20`, color: config.color } : undefined}
              >
                {config.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Headline Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FleetCard
          label="Operating"
          value={`${hs.operating_gw.toFixed(1)} GW`}
          color={STATUS_COLORS.operating}
        />
        <FleetCard
          label="Under Construction"
          value={`${hs.construction_gw.toFixed(1)} GW`}
          color={STATUS_COLORS.construction}
          sublabel={`${hs.construction_count} projects`}
        />
        <FleetCard
          label="In Development"
          value={`${hs.development_gw.toFixed(1)} GW`}
          color={STATUS_COLORS.development}
        />
        <FleetCard
          label="Total Storage"
          value={`${hs.storage_gwh.toFixed(0)} GWh`}
          color="#8b5cf6"
          sublabel="BESS + pumped hydro"
        />
      </section>

      {/* Capacity by Technology */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Capacity by Technology
          </h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Click bars to view projects
          </span>
        </div>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={techData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                label={{ value: 'GW', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                }}
                formatter={(value) => `${Number(value).toFixed(1)} GW`}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              {visibleBars.map((bar, i) => (
                <Bar
                  key={bar.key}
                  dataKey={bar.key}
                  name={bar.name}
                  stackId="a"
                  fill={STATUS_COLORS[bar.key]}
                  cursor="pointer"
                  onClick={(data) => {
                    const tech = data?.payload?.technology as string | undefined
                    if (tech) drillTech(tech, bar.key)
                  }}
                  radius={i === visibleBars.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Capacity by State */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Capacity by State
          </h2>
          <span className="text-[10px] text-[var(--color-text-muted)]">
            Click bars to view projects
          </span>
        </div>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stateData} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                type="number"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                label={{ value: 'GW', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="state"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#f1f5f9',
                  fontSize: 13,
                }}
                formatter={(value) => `${Number(value).toFixed(1)} GW`}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              {visibleBars.map((bar, i) => (
                <Bar
                  key={bar.key}
                  dataKey={bar.key}
                  name={bar.name}
                  stackId="a"
                  fill={STATUS_COLORS[bar.key]}
                  cursor="pointer"
                  onClick={(data) => {
                    const state = data?.payload?.state as string | undefined
                    if (state) drillState(state, bar.key)
                  }}
                  radius={i === visibleBars.length - 1 ? [0, 4, 4, 0] : undefined}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Data Quality */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Data Quality
        </h2>
        <div className="space-y-2.5">
          {confData.items.map((item) => {
            const config = CONFIDENCE_CONFIG[item.tier]
            const barWidth = confData.total > 0 ? (item.count / confData.total) * 100 : 0
            return (
              <Link
                key={item.tier}
                to={`/projects?confidence=${item.tier}`}
                className="flex items-center gap-3 group"
              >
                <span
                  className="text-xs font-mono w-10 text-right"
                  style={{ color: config.color }}
                >
                  {config.dots}
                </span>
                <span className="text-xs text-[var(--color-text-muted)] w-16 group-hover:text-[var(--color-text)] transition-colors">
                  {config.label.replace(' Confidence', '')}
                </span>
                <div className="flex-1 h-5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: `${config.color}40`,
                      minWidth: item.count > 0 ? '2px' : '0',
                    }}
                  />
                </div>
                <span className="text-xs text-[var(--color-text-muted)] w-20 text-right tabular-nums">
                  {item.count} <span className="text-[10px]">({item.pct}%)</span>
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* COD Drift */}
      {codDrift && codDrift.projects_with_drift > 0 && (
        <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              COD Drift Tracker
            </h2>
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-2 py-1 rounded-full">
              {codDrift.projects_with_drift} projects tracked
            </span>
          </div>
          <div className="space-y-2">
            {codDrift.by_project.map((p) => {
              const tech = TECHNOLOGY_CONFIG[p.technology]
              const isDelayed = p.drift_months > 0
              const isAhead = p.drift_months < 0
              return (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span className="text-base">{tech?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors block">
                      {p.name}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {p.original} → {p.current}
                    </span>
                  </div>
                  <span className={`text-sm font-medium flex-shrink-0 ${
                    isDelayed ? 'text-amber-400' : isAhead ? 'text-emerald-400' : 'text-[var(--color-text-muted)]'
                  }`}>
                    {isDelayed && '+'}{p.drift_months > 0 ? p.drift_months : p.drift_months === 0 ? '0' : p.drift_months} mo
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Construction Pipeline */}
      {pipeline.length > 0 && (
        <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Construction Pipeline
            </h2>
            <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-2 py-1 rounded-full">
              {pipeline.length} projects · {(pipeline.reduce((s, p) => s + p.capacity_mw, 0) / 1000).toFixed(1)} GW
            </span>
          </div>
          <div className="space-y-2">
            {pipeline.map((p) => {
              const tech = TECHNOLOGY_CONFIG[p.technology]
              return (
                <Link
                  key={p.id}
                  to={`/projects/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span className="text-base">{tech?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                        {p.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] flex-shrink-0">
                        {p.state}
                      </span>
                    </div>
                    {p.current_developer && (
                      <span className="text-xs text-[var(--color-text-muted)]">{p.current_developer}</span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-medium" style={{ color: tech?.color }}>
                      {p.capacity_mw >= 1000
                        ? `${(p.capacity_mw / 1000).toFixed(1)} GW`
                        : `${p.capacity_mw} MW`}
                    </span>
                    {p.storage_mwh ? (
                      <div className="text-[10px] text-[var(--color-text-muted)]">
                        {p.storage_mwh >= 1000
                          ? `${(p.storage_mwh / 1000).toFixed(1)} GWh`
                          : `${p.storage_mwh} MWh`}
                      </div>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function FleetCard({
  label,
  value,
  color,
  sublabel,
}: {
  label: string
  value: string | number
  color?: string
  sublabel?: string
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className="text-xl lg:text-2xl font-bold" style={{ color: color || 'var(--color-text)' }}>
        {value}
      </p>
      {sublabel && (
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sublabel}</p>
      )}
    </div>
  )
}
