import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useLeagueTableIndex, useLeagueTable, useFilteredLeagueTable } from '../hooks/usePerformanceData'
import type { LeagueTechnology, LeagueTableEntry, State } from '../lib/types'

const TECH_TABS: { label: string; value: LeagueTechnology }[] = [
  { label: 'Wind', value: 'wind' },
  { label: 'Solar', value: 'solar' },
  { label: 'BESS', value: 'bess' },
]

const STATE_TABS: { label: string; value: State | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'NSW', value: 'NSW' },
  { label: 'VIC', value: 'VIC' },
  { label: 'QLD', value: 'QLD' },
  { label: 'SA', value: 'SA' },
  { label: 'TAS', value: 'TAS' },
  { label: 'WA', value: 'WA' },
]

const QUARTILE_COLORS: Record<number, string> = {
  1: '#22c55e',
  2: '#3b82f6',
  3: '#f59e0b',
  4: '#ef4444',
}

const QUARTILE_LABELS: Record<number, string> = {
  1: 'Q1 — Top 25%',
  2: 'Q2 — Above Median',
  3: 'Q3 — Below Median',
  4: 'Q4 — Bottom 25%',
}

type SortField = 'rank' | 'capacity' | 'cf' | 'price' | 'rev' | 'curtailment' | 'spread' | 'util' | 'cycles'
type SortDir = 'asc' | 'desc'

export default function Performance() {
  const { index, loading: indexLoading } = useLeagueTableIndex()
  const [tech, setTech] = useState<LeagueTechnology>('wind')
  const [year, setYear] = useState<number>(2025)
  const [stateFilter, setStateFilter] = useState<State | 'ALL'>('ALL')
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const { table, loading: tableLoading } = useLeagueTable(tech, year)
  const filtered = useFilteredLeagueTable(table, stateFilter)

  // Sort
  const sorted = useMemo(() => {
    if (!filtered?.projects) return []
    const projects = [...filtered.projects]

    const getter = (p: LeagueTableEntry): number => {
      switch (sortField) {
        case 'rank': return p.rank_composite
        case 'capacity': return p.capacity_mw
        case 'cf': return p.capacity_factor_pct ?? 0
        case 'price': return p.energy_price_received ?? 0
        case 'rev': return p.revenue_per_mw ?? 0
        case 'curtailment': return p.curtailment_pct ?? 0
        case 'spread': return (p.avg_discharge_price ?? 0) - (p.avg_charge_price ?? 0)
        case 'util': return p.utilisation_pct ?? 0
        case 'cycles': return p.cycles ?? 0
        default: return p.rank_composite
      }
    }

    projects.sort((a, b) => {
      const va = getter(a)
      const vb = getter(b)
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return projects
  }, [filtered, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'rank' ? 'asc' : 'desc')
    }
  }

  const SortHeader = ({ field, label, className }: { field: SortField; label: string; className?: string }) => (
    <th
      className={`px-2 py-2 text-left cursor-pointer hover:text-[var(--color-text)] select-none ${className ?? ''}`}
      onClick={() => handleSort(field)}
    >
      {label}
      {sortField === field && (
        <span className="ml-0.5 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </th>
  )

  // Quartile distribution for chart
  const quartileData = useMemo(() => {
    if (!filtered?.projects) return []
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 }
    for (const p of filtered.projects) {
      counts[p.quartile] = (counts[p.quartile] || 0) + 1
    }
    return [
      { name: 'Q1', count: counts[1], fill: QUARTILE_COLORS[1] },
      { name: 'Q2', count: counts[2], fill: QUARTILE_COLORS[2] },
      { name: 'Q3', count: counts[3], fill: QUARTILE_COLORS[3] },
      { name: 'Q4', count: counts[4], fill: QUARTILE_COLORS[4] },
    ]
  }, [filtered])

  // No data state
  if (indexLoading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--color-bg-card)] rounded w-64" />
          <div className="h-10 bg-[var(--color-bg-card)] rounded w-48" />
          <div className="h-96 bg-[var(--color-bg-card)] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!index || index.available_years.length === 0) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
        <section>
          <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mb-2">
            Performance League Tables
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Performance data not yet available. Run the pipeline to generate league tables.
          </p>
        </section>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-sm text-[var(--color-text-muted)] mb-2">No performance data loaded yet.</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Run: python3 pipeline/importers/import_openelectricity.py --year 2025 --sample
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mb-2">
          Performance League Tables
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Operational performance rankings across {table?.fleet_avg.count ?? '...'} projects.
          Ranked by capacity factor, revenue, and curtailment.
        </p>
      </section>

      {/* Technology Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TECH_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setTech(tab.value); setSortField('rank'); setSortDir('asc') }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tech === tab.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}

        {/* Year dropdown */}
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="ml-auto px-3 py-2 rounded-lg text-sm bg-[var(--color-bg-card)] text-[var(--color-text)] border border-[var(--color-border)]"
        >
          {index.available_years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Fleet Summary Cards */}
      {table && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Projects Ranked"
            value={String(filtered?.projects.length ?? table.fleet_avg.count)}
            color="var(--color-primary)"
          />
          {tech !== 'bess' && table.fleet_avg.capacity_factor_pct != null && (
            <StatCard
              label="Avg Capacity Factor"
              value={`${table.fleet_avg.capacity_factor_pct.toFixed(1)}%`}
              color="#22c55e"
            />
          )}
          {table.fleet_avg.revenue_per_mw != null && (
            <StatCard
              label="Avg Revenue/MW"
              value={`$${(table.fleet_avg.revenue_per_mw / 1000).toFixed(0)}k`}
              color="#3b82f6"
            />
          )}
          {tech !== 'bess' && table.fleet_avg.curtailment_pct != null && (
            <StatCard
              label="Avg Curtailment"
              value={`${table.fleet_avg.curtailment_pct.toFixed(1)}%`}
              color="#f59e0b"
            />
          )}
        </section>
      )}

      {/* State Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStateFilter(tab.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              stateFilter === tab.value
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* League Table */}
      {tableLoading ? (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-8 bg-[var(--color-bg-elevated)] rounded" />
            ))}
          </div>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No {tech} projects found{stateFilter !== 'ALL' ? ` in ${stateFilter}` : ''}.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                  <SortHeader field="rank" label="#" className="w-10" />
                  <th className="px-2 py-2 text-left">Project</th>
                  <th className="px-2 py-2 text-left w-12">State</th>
                  <SortHeader field="capacity" label="MW" />
                  {tech !== 'bess' ? (
                    <>
                      <SortHeader field="cf" label="CF%" />
                      <SortHeader field="price" label="$/MWh" />
                      <SortHeader field="rev" label="Rev/MW" />
                      <SortHeader field="curtailment" label="Curt%" />
                    </>
                  ) : (
                    <>
                      <SortHeader field="spread" label="Spread" />
                      <SortHeader field="util" label="Util%" />
                      <SortHeader field="cycles" label="Cycles" />
                      <SortHeader field="rev" label="Rev/MW" />
                    </>
                  )}
                  <th className="px-2 py-2 text-left w-12">Q</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((p) => (
                  <LeagueRow key={p.project_id} entry={p} tech={tech} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quartile Distribution */}
      {quartileData.some((d) => d.count > 0) && (
        <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">
            Quartile Distribution
          </h2>
          <div className="flex items-center gap-4 mb-3">
            {[1, 2, 3, 4].map((q) => (
              <div key={q} className="flex items-center gap-1.5 text-[10px]">
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: QUARTILE_COLORS[q] }}
                />
                <span className="text-[var(--color-text-muted)]">{QUARTILE_LABELS[q]}</span>
              </div>
            ))}
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quartileData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 13,
                  }}
                  formatter={(value) => `${value} projects`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {quartileData.map((entry, idx) => (
                    <rect key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  )
}

function LeagueRow({ entry, tech }: { entry: LeagueTableEntry; tech: LeagueTechnology }) {
  const spread = tech === 'bess'
    ? ((entry.avg_discharge_price ?? 0) - (entry.avg_charge_price ?? 0))
    : 0

  return (
    <tr className="border-b border-[var(--color-border)]/50 hover:bg-white/5 transition-colors">
      <td className="px-2 py-2 font-bold text-[var(--color-text-muted)]">
        {entry.rank_composite}
      </td>
      <td className="px-2 py-2">
        <Link
          to={`/projects/${entry.project_id}`}
          className="text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors font-medium truncate block max-w-[200px]"
        >
          {entry.name}
        </Link>
      </td>
      <td className="px-2 py-2 text-[var(--color-text-muted)]">{entry.state}</td>
      <td className="px-2 py-2 text-[var(--color-text)]">
        {entry.capacity_mw >= 1000
          ? `${(entry.capacity_mw / 1000).toFixed(1)}G`
          : entry.capacity_mw}
      </td>
      {tech !== 'bess' ? (
        <>
          <td className="px-2 py-2">
            <span style={{ color: cfColor(entry.capacity_factor_pct) }}>
              {entry.capacity_factor_pct?.toFixed(1) ?? '—'}
            </span>
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            ${entry.energy_price_received?.toFixed(0) ?? '—'}
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            ${entry.revenue_per_mw ? (entry.revenue_per_mw / 1000).toFixed(0) + 'k' : '—'}
          </td>
          <td className="px-2 py-2">
            <span style={{ color: curtColor(entry.curtailment_pct) }}>
              {entry.curtailment_pct?.toFixed(1) ?? '—'}
            </span>
          </td>
        </>
      ) : (
        <>
          <td className="px-2 py-2 text-[var(--color-text)]">
            ${spread.toFixed(0)}
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            {entry.utilisation_pct?.toFixed(0) ?? '—'}%
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            {entry.cycles?.toFixed(0) ?? '—'}
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            ${entry.revenue_per_mw ? (entry.revenue_per_mw / 1000).toFixed(0) + 'k' : '—'}
          </td>
        </>
      )}
      <td className="px-2 py-2">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold"
          style={{
            color: QUARTILE_COLORS[entry.quartile],
            backgroundColor: QUARTILE_COLORS[entry.quartile] + '20',
          }}
        >
          {entry.quartile}
        </span>
      </td>
    </tr>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function cfColor(cf?: number): string {
  if (!cf) return '#6b7280'
  if (cf >= 35) return '#22c55e'
  if (cf >= 25) return '#84cc16'
  if (cf >= 15) return '#f59e0b'
  return '#ef4444'
}

function curtColor(curt?: number): string {
  if (!curt) return '#6b7280'
  if (curt <= 2) return '#22c55e'
  if (curt <= 5) return '#f59e0b'
  return '#ef4444'
}
