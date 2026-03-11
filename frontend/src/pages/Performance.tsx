import { useState, useMemo, useCallback } from 'react'
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

// ============================================================
// Info Tooltip Definitions
// ============================================================

const InfoIcon = () => (
  <svg className="w-3 h-3 inline-block ml-0.5 opacity-50 hover:opacity-100 transition-opacity" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <text x="8" y="12" textAnchor="middle" fontSize="10" fontWeight="bold">i</text>
  </svg>
)

interface MetricInfo {
  label: string
  description: string
  formula?: string
  source: string
}

const METRIC_INFO: Record<string, MetricInfo> = {
  capacity_factor: {
    label: 'Capacity Factor (CF%)',
    description: 'The ratio of actual energy output to the theoretical maximum output if the plant ran at full capacity 24/7. Higher is better — top wind farms achieve 35-50%, solar 20-30%.',
    formula: 'CF = (Energy MWh) / (Capacity MW × Hours in Period) × 100',
    source: 'Calculated from AEMO dispatch data via OpenElectricity API.',
  },
  revenue_per_mw: {
    label: 'Revenue per MW (Rev/MW)',
    description: 'Total market revenue divided by nameplate capacity. Measures the earning efficiency of each MW installed. Influenced by both output and price captured.',
    formula: 'Rev/MW = Market Value ($) / Capacity (MW)',
    source: 'Market value from AEMO settlement data via OpenElectricity API.',
  },
  price_received: {
    label: 'Price Received ($/MWh)',
    description: 'The average wholesale price received for energy generated, weighted by dispatch interval volume. Varies by time-of-day generation profile.',
    formula: '$/MWh = Market Value ($) / Energy Generated (MWh)',
    source: 'Derived from AEMO dispatch and settlement data via OpenElectricity API.',
  },
  curtailment: {
    label: 'Curtailment (%)',
    description: 'The estimated percentage of potential generation that was curtailed (turned down or off) due to network constraints, negative prices, or AEMO directions. Lower is better.',
    formula: 'Estimated from dispatch data patterns and AEMO constraint equations.',
    source: 'Estimated from AEMO dispatch data. Currently indicative only — precise curtailment data requires NEMWEB constraint analysis.',
  },
  spread: {
    label: 'Price Spread ($/MWh)',
    description: 'The difference between average discharge (selling) price and average charge (buying) price. The core profit driver for BESS — higher spreads mean better arbitrage returns.',
    formula: 'Spread = Avg Discharge Price - Avg Charge Price',
    source: 'Derived from AEMO battery unit dispatch data via OpenElectricity API.',
  },
  cycles: {
    label: 'Annual Cycles',
    description: 'The number of full charge-discharge cycles completed per year. One cycle = fully discharging the battery storage capacity once. Indicates utilisation intensity.',
    formula: 'Cycles = Total Energy Discharged (MWh) / Storage Capacity (MWh)',
    source: 'Calculated from AEMO dispatch data via OpenElectricity API.',
  },
  utilisation: {
    label: 'Utilisation (%)',
    description: 'The percentage of time the battery was actively discharging energy to the grid. Higher utilisation generally means more revenue opportunities captured.',
    formula: 'Utilisation = Energy Discharged / (Capacity MW × Hours in Period) × 100',
    source: 'Approximated from AEMO battery unit dispatch data via OpenElectricity API.',
  },
  discharged: {
    label: 'Energy Discharged',
    description: 'Total energy exported to the grid from the battery during the period. Battery units are tracked separately as charging and discharging in AEMO systems.',
    source: 'AEMO battery discharging unit data via OpenElectricity API.',
  },
  charged: {
    label: 'Energy Charged',
    description: 'Total energy imported from the grid to charge the battery during the period. Typically 10-15% higher than discharged energy due to round-trip efficiency losses.',
    source: 'AEMO battery charging unit data via OpenElectricity API.',
  },
  composite_rank: {
    label: 'Composite Ranking',
    description: 'Overall performance ranking combining multiple metrics. For wind/solar: 40% capacity factor + 40% revenue/MW + 20% curtailment (inverted). For BESS: 30% revenue + 30% utilisation + 20% spread + 20% cycles.',
    source: 'Calculated by AURES from underlying AEMO metrics.',
  },
  quartile: {
    label: 'Performance Quartile',
    description: 'Projects are divided into four equal groups based on composite score. Q1 (top 25%) are the best performers, Q4 (bottom 25%) are the lowest ranked.',
    source: 'Calculated by AURES from composite performance scores.',
  },
}

function InfoTooltip({ metricKey }: { metricKey: string }) {
  const [show, setShow] = useState(false)
  const info = METRIC_INFO[metricKey]
  if (!info) return null

  return (
    <span className="relative inline-block">
      <button
        onClick={(e) => { e.stopPropagation(); setShow(!show) }}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="appearance-none border-none bg-transparent cursor-help p-0 leading-none"
        aria-label={`Info: ${info.label}`}
      >
        <InfoIcon />
      </button>
      {show && (
        <div
          className="absolute z-50 w-72 p-3 rounded-xl shadow-xl text-left
            bg-[var(--color-bg-elevated)] border border-[var(--color-border)]
            bottom-full left-1/2 -translate-x-1/2 mb-2"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] font-semibold text-[var(--color-text)] mb-1">{info.label}</p>
          <p className="text-[10px] text-[var(--color-text-muted)] mb-2 leading-relaxed">{info.description}</p>
          {info.formula && (
            <p className="text-[10px] text-[var(--color-primary)] font-mono mb-1.5 bg-[var(--color-bg-card)] rounded px-1.5 py-1">
              {info.formula}
            </p>
          )}
          <p className="text-[9px] text-[var(--color-text-muted)] italic border-t border-[var(--color-border)] pt-1.5 mt-1">
            📡 {info.source}
          </p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="w-2 h-2 bg-[var(--color-bg-elevated)] border-r border-b border-[var(--color-border)] rotate-45 -translate-y-1" />
          </div>
        </div>
      )}
    </span>
  )
}

// ============================================================
// Constants
// ============================================================

const TECH_TABS: { label: string; value: LeagueTechnology }[] = [
  { label: 'Wind', value: 'wind' },
  { label: 'Solar', value: 'solar' },
  { label: 'BESS', value: 'bess' },
  { label: 'Hydro', value: 'pumped_hydro' },
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

type SortField = 'rank' | 'capacity' | 'cf' | 'price' | 'rev' | 'curtailment' | 'spread' | 'util' | 'cycles' | 'discharged' | 'charged'
type SortDir = 'asc' | 'desc'

// ============================================================
// Main Component
// ============================================================

export default function Performance() {
  const { index, loading: indexLoading } = useLeagueTableIndex()
  const [tech, setTech] = useState<LeagueTechnology>('wind')
  // Default to latest available year
  const latestYear = index?.available_years?.[index.available_years.length - 1] ?? 2025
  const [year, setYear] = useState<number>(latestYear)
  const [stateFilter, setStateFilter] = useState<State | 'ALL'>('ALL')
  const [sortField, setSortField] = useState<SortField>('rank')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // Sync year when index loads
  const [yearInitialized, setYearInitialized] = useState(false)
  if (index && !yearInitialized) {
    const latest = index.available_years[index.available_years.length - 1]
    if (latest && latest !== year) setYear(latest)
    setYearInitialized(true)
  }

  const { table, loading: tableLoading } = useLeagueTable(tech, year)
  const filtered = useFilteredLeagueTable(table, stateFilter)

  const isYTD = table?.data_source === 'openelectricity_ytd'

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
        case 'discharged': return p.energy_discharged_mwh ?? 0
        case 'charged': return p.energy_charged_mwh ?? 0
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

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'rank' ? 'asc' : 'desc')
    }
  }, [sortField, sortDir])

  const SortHeader = ({ field, label, className, infoKey }: { field: SortField; label: string; className?: string; infoKey?: string }) => (
    <th
      className={`px-2 py-2 text-left cursor-pointer hover:text-[var(--color-text)] select-none ${className ?? ''}`}
      onClick={() => handleSort(field)}
    >
      {label}
      {infoKey && <InfoTooltip metricKey={infoKey} />}
      {sortField === field && (
        <span className="ml-0.5 text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
      )}
    </th>
  )

  // Quartile distribution for chart
  const quartileData = useMemo(() => {
    if (!filtered?.projects) return []
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }
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
            Run: python3 pipeline/importers/import_openelectricity.py --year 2025
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
          <InfoTooltip metricKey="composite_rank" />
        </p>
        {table && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {(table.data_source === 'openelectricity' || table.data_source === 'openelectricity_ytd') ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                AEMO data via OpenElectricity
              </span>
            ) : table.data_source === 'sample' ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Sample data — projected estimates
              </span>
            ) : null}
            {isYTD && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                Year to Date (Jan–Feb)
              </span>
            )}
          </div>
        )}
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
          {[...index.available_years].reverse().map((y) => (
            <option key={y} value={y}>
              {y}{y === new Date().getFullYear() ? ' (YTD)' : ''}
            </option>
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
          {table.fleet_avg.capacity_factor_pct != null && (
            <StatCard
              label={tech === 'bess' ? 'Avg Utilisation' : 'Avg Capacity Factor'}
              value={`${table.fleet_avg.capacity_factor_pct.toFixed(1)}%`}
              color="#22c55e"
              infoKey={tech === 'bess' ? 'utilisation' : 'capacity_factor'}
            />
          )}
          {table.fleet_avg.revenue_per_mw != null && (
            <StatCard
              label={isYTD ? 'Avg Rev/MW (YTD)' : 'Avg Revenue/MW'}
              value={`$${(table.fleet_avg.revenue_per_mw / 1000).toFixed(0)}k`}
              color="#3b82f6"
              infoKey="revenue_per_mw"
            />
          )}
          {tech !== 'bess' && table.fleet_avg.curtailment_pct != null && (
            <StatCard
              label="Avg Curtailment"
              value={`${table.fleet_avg.curtailment_pct.toFixed(1)}%`}
              color="#f59e0b"
              infoKey="curtailment"
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
                  <SortHeader field="rank" label="#" className="w-10" infoKey="composite_rank" />
                  <th className="px-2 py-2 text-left">Project</th>
                  <th className="px-2 py-2 text-left w-12">State</th>
                  <SortHeader field="capacity" label="MW" />
                  {tech === 'bess' ? (
                    <>
                      <SortHeader field="discharged" label="Disch." infoKey="discharged" />
                      <SortHeader field="charged" label="Chg." infoKey="charged" />
                      <SortHeader field="spread" label="Spread" infoKey="spread" />
                      <SortHeader field="cycles" label="Cycles" infoKey="cycles" />
                      <SortHeader field="rev" label="Rev/MW" infoKey="revenue_per_mw" />
                    </>
                  ) : (
                    <>
                      <SortHeader field="cf" label="CF%" infoKey="capacity_factor" />
                      <SortHeader field="price" label="$/MWh" infoKey="price_received" />
                      <SortHeader field="rev" label="Rev/MW" infoKey="revenue_per_mw" />
                      <SortHeader field="curtailment" label="Curt%" infoKey="curtailment" />
                    </>
                  )}
                  <th className="px-2 py-2 text-left w-12">
                    Q<InfoTooltip metricKey="quartile" />
                  </th>
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

      {/* Data Methodology */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-2">
          About This Data
        </h2>
        <div className="space-y-2 text-[10px] text-[var(--color-text-muted)] leading-relaxed">
          <p>
            Performance data is sourced from <strong className="text-[var(--color-text)]">AEMO dispatch and settlement records</strong> via the <a href="https://openelectricity.org.au" target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] hover:underline">OpenElectricity API</a>.
            This covers all NEM-registered generation and storage facilities.
          </p>
          <p>
            <strong className="text-[var(--color-text)]">Capacity factor</strong> is calculated using nameplate capacity and actual energy output.
            <strong className="text-[var(--color-text)]"> Revenue</strong> reflects wholesale market value only — it excludes LGC revenue, contract premiums, and ancillary services.
            <strong className="text-[var(--color-text)]"> Curtailment</strong> is estimated and may not capture all constraint types.
          </p>
          <p>
            Rankings use a composite score: wind/solar weight CF (40%), revenue/MW (40%), and curtailment (20%). BESS weights revenue (30%), utilisation (30%), spread (20%), and cycles (20%).
          </p>
        </div>
      </section>
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
      {tech === 'bess' ? (
        <>
          <td className="px-2 py-2 text-[var(--color-text)]">
            {entry.energy_discharged_mwh ? fmtGWh(entry.energy_discharged_mwh) : '—'}
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            {entry.energy_charged_mwh ? fmtGWh(entry.energy_charged_mwh) : '—'}
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            {spread > 0 ? `$${spread.toFixed(0)}` : '—'}
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            {entry.cycles?.toFixed(0) ?? '—'}
          </td>
          <td className="px-2 py-2 text-[var(--color-text)]">
            ${entry.revenue_per_mw ? (entry.revenue_per_mw / 1000).toFixed(0) + 'k' : '—'}
          </td>
        </>
      ) : (
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

function StatCard({ label, value, color, infoKey }: { label: string; value: string; color: string; infoKey?: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
        {label}
        {infoKey && <InfoTooltip metricKey={infoKey} />}
      </p>
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function fmtGWh(mwh: number): string {
  if (mwh >= 1000) return `${(mwh / 1000).toFixed(1)} GWh`
  return `${Math.round(mwh)} MWh`
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
