import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend, ReferenceLine, Cell,
} from 'recharts'
import { fetchDunkelflaute } from '../../lib/dataService'
import type { DunkelflaunteData, StateYearPerformance } from '../../lib/types'

// ============================================================
// Icons — defined BEFORE const arrays (Vite HMR issue)
// ============================================================

const WindIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
)

const BoltIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
  </svg>
)

const BatteryIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h15A2.25 2.25 0 0 0 21 15.75v-6a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 1.5 9.75v6A2.25 2.25 0 0 0 3.75 18Z" />
  </svg>
)

const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
)

// ============================================================
// Constants
// ============================================================

const STATE_COLORS: Record<string, string> = {
  NSW: '#3b82f6',
  QLD: '#f59e0b',
  SA: '#10b981',
  TAS: '#06b6d4',
  VIC: '#8b5cf6',
}

const STATE_ORDER = ['NSW', 'QLD', 'VIC', 'SA', 'TAS']

const WIND_COLOR = '#3b82f6'
const SOLAR_COLOR = '#f59e0b'

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--color-bg-primary, #1e293b)',
  border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
  borderRadius: '8px',
  color: 'var(--color-text, #f1f5f9)',
  fontSize: 13,
}

const TICK_STYLE = { fill: 'var(--color-text-muted, #9ca3af)', fontSize: 12 }
const AXIS_STYLE = { stroke: 'rgba(255,255,255,0.1)' }

const COVERAGE_COLORS: Record<string, string> = {
  Low: '#ef4444',
  Moderate: '#f59e0b',
  Good: '#22c55e',
}

// ============================================================
// Helpers
// ============================================================

function fmtPct(v: number | undefined): string {
  if (v == null) return 'N/A'
  return `${v.toFixed(1)}%`
}

function fmtMW(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)} GW`
  return `${v.toLocaleString()} MW`
}

function fmtMWh(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)} GWh`
  return `${v.toLocaleString()} MWh`
}

function fmtHours(v: number): string {
  return `${v.toFixed(2)}h`
}

function getCoverageColor(rating: string): string {
  return COVERAGE_COLORS[rating] || '#636e72'
}

// ============================================================
// Component
// ============================================================

export default function Dunkelflaute() {
  const [data, setData] = useState<DunkelflaunteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(2024)

  useEffect(() => {
    fetchDunkelflaute().then(d => { setData(d ?? null); setLoading(false) })
  }, [])

  // Available years
  const years = useMemo(() => {
    if (!data) return []
    const s = new Set(data.state_year_performance.map(r => r.year))
    return Array.from(s).sort()
  }, [data])

  // State performance for selected year
  const yearPerformance = useMemo(() => {
    if (!data) return []
    return STATE_ORDER
      .map(st => data.state_year_performance.find(r => r.state === st && r.year === selectedYear))
      .filter((r): r is StateYearPerformance => r != null)
  }, [data, selectedYear])

  // Chart data for year comparison bar chart
  const barChartData = useMemo(() => {
    return yearPerformance.map(r => ({
      state: r.state,
      wind_cf: r.wind_cf_pct,
      solar_cf: r.solar_cf_pct ?? 0,
      combined_cf: r.combined_cf_pct,
    }))
  }, [yearPerformance])

  // Line chart data: combined CF trend per state over years
  const lineChartData = useMemo(() => {
    if (!data) return []
    const byYear: Record<number, Record<string, number>> = {}
    for (const r of data.state_year_performance) {
      if (!byYear[r.year]) byYear[r.year] = {}
      byYear[r.year][r.state] = r.combined_cf_pct
    }
    return Object.entries(byYear)
      .map(([y, states]) => ({ year: Number(y), ...states }))
      .sort((a, b) => a.year - b.year)
  }, [data])

  // BESS coverage chart data
  const coverageChartData = useMemo(() => {
    if (!data) return []
    return STATE_ORDER
      .filter(st => data.bess_coverage[st])
      .map(st => {
        const c = data.bess_coverage[st]
        return {
          state: st,
          coverage_hours: c.coverage_hours,
          rating: c.coverage_rating,
          bess_mw: c.bess_mw,
          bess_mwh: c.bess_mwh,
          peak_demand: c.peak_demand_mw_est,
        }
      })
  }, [data])

  // Pipeline comparison data
  const pipelineData = useMemo(() => {
    if (!data) return []
    return STATE_ORDER
      .filter(st => data.bess_coverage[st] && data.bess_pipeline[st])
      .map(st => {
        const current = data.bess_coverage[st]
        const pipeline = data.bess_pipeline[st]
        const peakDemand = data.peak_demand_estimates[st] || current.peak_demand_mw_est
        const pipelineCoverageHours = peakDemand > 0
          ? (current.bess_mwh + pipeline.mwh) / peakDemand
          : 0
        return {
          state: st,
          current_mwh: current.bess_mwh,
          pipeline_mwh: pipeline.mwh,
          pipeline_mw: pipeline.mw,
          pipeline_count: pipeline.count,
          current_hours: current.coverage_hours,
          potential_hours: pipelineCoverageHours,
        }
      })
  }, [data])

  // Lowest CF period
  const lowestCF = useMemo(() => {
    if (!data || data.lowest_cf_periods.length === 0) return null
    return data.lowest_cf_periods[0]
  }, [data])

  // Avg BESS coverage hours
  const avgCoverage = useMemo(() => {
    if (!data) return 0
    const entries = Object.values(data.bess_coverage)
    if (entries.length === 0) return 0
    return entries.reduce((sum, e) => sum + e.coverage_hours, 0) / entries.length
  }, [data])

  // ── Loading ──
  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
          <span className="ml-3 text-sm text-[var(--color-text-muted)]">Loading dunkelflaute data...</span>
        </div>
      </div>
    )
  }

  // ── Empty state ──
  if (!data) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)] mb-4">Dunkelflaute Monitor</h1>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-8 border border-[var(--border)] text-center">
          <AlertIcon />
          <p className="text-sm text-[var(--color-text-muted)] mt-2">No dunkelflaute data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">Dunkelflaute Monitor</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Wind and solar generation vulnerability and BESS adequacy by state
        </p>
      </div>

      {/* ── 1. Concept Explainer ── */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <div className="flex items-start gap-3">
          <div className="text-amber-400 mt-0.5"><WindIcon /></div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)] mb-1">What is a Dunkelflaute?</h2>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="font-medium text-[var(--color-text)]">Dunkelflaute</span> (German: "dark doldrums") refers to
              extended periods when both wind and solar generation are simultaneously low. These events
              expose the NEM to its greatest reliability risk, as renewable output collapses across multiple
              technologies at once. Capacity factor (CF) measures actual output as a percentage of maximum
              possible output. A combined CF below 25% signals significant stress on the generation fleet
              and heightens the need for dispatchable firming capacity such as BESS.
            </p>
          </div>
        </div>
      </div>

      {/* ── 2. Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Lowest CF */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertIcon />
            <span className="text-xs font-medium uppercase tracking-wide">Lowest Combined CF</span>
          </div>
          {lowestCF ? (
            <>
              <p className="text-2xl font-bold text-[var(--color-text)]">{fmtPct(lowestCF.combined_cf_pct)}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {lowestCF.state} {lowestCF.year} — Wind {fmtPct(lowestCF.wind_cf_pct)}, Solar {fmtPct(lowestCF.solar_cf_pct)}
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">No data</p>
          )}
        </div>

        {/* Avg BESS Coverage */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <BatteryIcon />
            <span className="text-xs font-medium uppercase tracking-wide">Avg BESS Coverage</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text)]">{fmtHours(avgCoverage)}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Across {Object.keys(data.bess_coverage).length} states — target is 4+ hours
          </p>
        </div>

        {/* Pipeline */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <BoltIcon />
            <span className="text-xs font-medium uppercase tracking-wide">BESS Pipeline</span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text)]">
            {fmtMW(Object.values(data.bess_pipeline).reduce((s, p) => s + p.mw, 0))}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {fmtMWh(Object.values(data.bess_pipeline).reduce((s, p) => s + p.mwh, 0))} across{' '}
            {Object.values(data.bess_pipeline).reduce((s, p) => s + p.count, 0)} projects
          </p>
        </div>
      </div>

      {/* ── 3. State Performance by Year ── */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">State Capacity Factor by Resource</h2>
          <div className="flex gap-1">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  selectedYear === y
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barChartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" {...AXIS_STYLE} />
            <XAxis dataKey="state" tick={TICK_STYLE} axisLine={AXIS_STYLE} tickLine={false} />
            <YAxis
              tick={TICK_STYLE}
              axisLine={AXIS_STYLE}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${Number(value).toFixed(1)}%`]}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)' }}
            />
            <Bar dataKey="wind_cf" name="Wind CF" fill={WIND_COLOR} radius={[4, 4, 0, 0]} />
            <Bar dataKey="solar_cf" name="Solar CF" fill={SOLAR_COLOR} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          TAS has no utility-scale solar — Solar CF will show 0% for Tasmania.
        </p>
      </div>

      {/* ── 4. Year Trend by State (Combined CF) ── */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">Combined CF Trend by State</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" {...AXIS_STYLE} />
            <XAxis dataKey="year" tick={TICK_STYLE} axisLine={AXIS_STYLE} tickLine={false} />
            <YAxis
              tick={TICK_STYLE}
              axisLine={AXIS_STYLE}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${Number(value).toFixed(1)}%`]}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)' }} />
            {STATE_ORDER.filter(st =>
              lineChartData.some(d => (d as Record<string, unknown>)[st] != null)
            ).map(st => (
              <Line
                key={st}
                type="monotone"
                dataKey={st}
                stroke={STATE_COLORS[st]}
                strokeWidth={2}
                dot={{ r: 4, fill: STATE_COLORS[st] }}
                activeDot={{ r: 6 }}
              />
            ))}
            <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="6 3" label={{ value: 'Stress threshold (25%)', fill: '#ef4444', fontSize: 11, position: 'insideTopRight' }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Combined CF below 25% indicates significant dunkelflaute risk. The red dashed line marks the stress threshold.
        </p>
      </div>

      {/* ── 5. BESS Coverage ── */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">Current BESS Coverage by State</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={coverageChartData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" {...AXIS_STYLE} />
            <XAxis dataKey="state" tick={TICK_STYLE} axisLine={AXIS_STYLE} tickLine={false} />
            <YAxis
              tick={TICK_STYLE}
              axisLine={AXIS_STYLE}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
              domain={[0, 5]}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${Number(value).toFixed(2)} hours`]}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <ReferenceLine y={4} stroke="#22c55e" strokeDasharray="6 3" label={{ value: '4h target', fill: '#22c55e', fontSize: 11, position: 'insideTopRight' }} />
            <Bar dataKey="coverage_hours" name="Coverage Hours" radius={[4, 4, 0, 0]}>
              {coverageChartData.map((entry, i) => (
                <Cell key={i} fill={getCoverageColor(entry.rating)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* BESS coverage detail cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {coverageChartData.map(entry => (
            <div key={entry.state} className="bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border)]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-[var(--color-text)]">{entry.state}</span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: getCoverageColor(entry.rating) + '22', color: getCoverageColor(entry.rating) }}
                >
                  {entry.rating}
                </span>
              </div>
              <p className="text-lg font-bold text-[var(--color-text)]">{fmtHours(entry.coverage_hours)}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                {fmtMW(entry.bess_mw)} / {fmtMWh(entry.bess_mwh)}
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)]">
                Peak demand: {fmtMW(entry.peak_demand)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 6. Vulnerability Table ── */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">Lowest Combined CF Periods</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-2 text-[var(--color-text-muted)] font-medium">State</th>
                <th className="text-right py-2 px-2 text-[var(--color-text-muted)] font-medium">Year</th>
                <th className="text-right py-2 px-2 text-[var(--color-text-muted)] font-medium">Wind CF</th>
                <th className="text-right py-2 px-2 text-[var(--color-text-muted)] font-medium">Solar CF</th>
                <th className="text-right py-2 px-2 text-[var(--color-text-muted)] font-medium">Combined CF</th>
                <th className="text-right py-2 px-2 text-[var(--color-text-muted)] font-medium">Wind MW</th>
                <th className="text-right py-2 px-2 text-[var(--color-text-muted)] font-medium">Solar MW</th>
              </tr>
            </thead>
            <tbody>
              {data.lowest_cf_periods.map((row, i) => {
                const isStress = row.combined_cf_pct < 25
                return (
                  <tr
                    key={`${row.state}-${row.year}`}
                    className={`border-b border-[var(--border)] ${i % 2 === 0 ? 'bg-[var(--bg-tertiary)]' : ''}`}
                  >
                    <td className="py-2 px-2">
                      <span className="font-medium text-[var(--color-text)]" style={{ color: STATE_COLORS[row.state] }}>
                        {row.state}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2 text-[var(--color-text)]">{row.year}</td>
                    <td className="text-right py-2 px-2 text-[var(--color-text)]">{fmtPct(row.wind_cf_pct)}</td>
                    <td className="text-right py-2 px-2 text-[var(--color-text)]">{fmtPct(row.solar_cf_pct)}</td>
                    <td className="text-right py-2 px-2">
                      <span className={`font-semibold ${isStress ? 'text-red-400' : 'text-[var(--color-text)]'}`}>
                        {fmtPct(row.combined_cf_pct)}
                      </span>
                    </td>
                    <td className="text-right py-2 px-2 text-[var(--color-text)]">{row.wind_mw.toLocaleString()}</td>
                    <td className="text-right py-2 px-2 text-[var(--color-text)]">{row.solar_mw.toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Sorted by combined CF (lowest first). Rows in red indicate periods below the 25% stress threshold.
        </p>
      </div>

      {/* ── 7. Pipeline vs Coverage Comparison ── */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-4">Pipeline vs Current BESS Coverage</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pipelineData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" {...AXIS_STYLE} />
            <XAxis dataKey="state" tick={TICK_STYLE} axisLine={AXIS_STYLE} tickLine={false} />
            <YAxis
              tick={TICK_STYLE}
              axisLine={AXIS_STYLE}
              tickLine={false}
              tickFormatter={(v) => `${v}h`}
              domain={[0, 'auto']}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${Number(value).toFixed(2)} hours`]}
              labelStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)' }} />
            <ReferenceLine y={4} stroke="#22c55e" strokeDasharray="6 3" label={{ value: '4h target', fill: '#22c55e', fontSize: 11, position: 'insideTopRight' }} />
            <Bar dataKey="current_hours" name="Current Coverage" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="potential_hours" name="With Pipeline" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Pipeline detail cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {pipelineData.map(entry => (
            <div key={entry.state} className="bg-[var(--bg-tertiary)] rounded-lg p-3 border border-[var(--border)]">
              <span className="text-xs font-semibold" style={{ color: STATE_COLORS[entry.state] }}>
                {entry.state}
              </span>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--color-text-muted)]">Pipeline</span>
                  <span className="text-[var(--color-text)]">{fmtMW(entry.pipeline_mw)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--color-text-muted)]">Storage</span>
                  <span className="text-[var(--color-text)]">{fmtMWh(entry.pipeline_mwh)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--color-text-muted)]">Projects</span>
                  <span className="text-[var(--color-text)]">{entry.pipeline_count}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1 border-t border-[var(--border)]">
                  <span className="text-[var(--color-text-muted)]">Current</span>
                  <span className="text-red-400 font-medium">{fmtHours(entry.current_hours)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[var(--color-text-muted)]">Potential</span>
                  <span className="text-emerald-400 font-medium">{fmtHours(entry.potential_hours)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
