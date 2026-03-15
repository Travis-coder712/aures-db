import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts'
import { fetchRevenueIntel } from '../../lib/dataService'
import type { RevenueIntelData, MetricStats } from '../../lib/types'

// ============================================================
// Icons — defined BEFORE const arrays per project pattern
// ============================================================

const DollarIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a5.389 5.389 0 01-.421-.821h1.72a1 1 0 100-2H7.734a7.368 7.368 0 010-1h2.302a1 1 0 000-2H8.315c.129-.292.28-.571.421-.821z" />
  </svg>
)

const TrendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
)

const BoltIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
)

const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

// ============================================================
// Tech colours & labels
// ============================================================

const TECH_COLOURS: Record<string, string> = {
  wind: '#3b82f6',
  solar: '#f59e0b',
  bess: '#10b981',
  pumped_hydro: '#8b5cf6',
  hybrid: '#ec4899',
}

const TECH_LABELS: Record<string, string> = {
  wind: 'Wind',
  solar: 'Solar',
  bess: 'BESS',
  pumped_hydro: 'Pumped Hydro',
  hybrid: 'Hybrid',
}

const TECH_ORDER = ['pumped_hydro', 'wind', 'bess', 'solar', 'hybrid']

// ============================================================
// Helpers
// ============================================================

const fmtRevenue = (v: number) => `$${(v / 1000).toFixed(0)}k`
const fmtPrice = (v: number) => `$${v.toFixed(1)}`
const fmtPct = (v: number) => `${v.toFixed(1)}%`

// Access BESS-specific fields from actual JSON (not in TS interface)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getBessField = (row: any, field: string): MetricStats | undefined => row?.[field]

// ============================================================
// Types for year selector
// ============================================================

type SelectedYear = 2024 | 2025

export default function RevenueIntel() {
  const [data, setData] = useState<RevenueIntelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<SelectedYear>(2024)

  useEffect(() => {
    fetchRevenueIntel().then(d => { setData(d); setLoading(false) })
  }, [])

  // ---- Derived data ----

  const techYearRows = useMemo(() => {
    if (!data) return []
    return data.by_technology_year.filter(r => r.year === selectedYear)
  }, [data, selectedYear])

  // Revenue bar chart data
  const revenueBarData = useMemo(() => {
    return TECH_ORDER
      .map(tech => {
        const row = techYearRows.find(r => r.technology === tech)
        if (!row) return null
        return {
          tech,
          label: TECH_LABELS[tech],
          median: row.revenue_per_mw.median,
          p25: row.revenue_per_mw.p25,
          p75: row.revenue_per_mw.p75,
          count: row.revenue_per_mw.count,
          colour: TECH_COLOURS[tech],
        }
      })
      .filter(Boolean) as Array<{ tech: string; label: string; median: number; p25: number; p75: number; count: number; colour: string }>
  }, [techYearRows])

  // YoY trend line data — actual JSON uses median_rpm, not revenue_per_mw
  const yoyLineData = useMemo(() => {
    if (!data) return []
    const years = [2024, 2025, 2026]
    return years.map(year => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const trends = data.yoy_trends as Record<string, Array<any>>
      const point: Record<string, number | string> = { year: String(year) }
      for (const tech of TECH_ORDER) {
        const entry = trends[tech]?.find((e: { year: number }) => e.year === year)
        if (entry) {
          point[tech] = entry.median_rpm ?? entry.revenue_per_mw ?? 0
        }
      }
      return point
    })
  }, [data])

  // BESS arbitrage data
  const bessArbitrageData = useMemo(() => {
    if (!data) return []
    return data.by_technology_year
      .filter(r => r.technology === 'bess' && (r.year === 2024 || r.year === 2025))
      .map(r => {
        const spread = getBessField(r, 'bess_spread')
        const discharge = getBessField(r, 'discharge_price')
        const charge = getBessField(r, 'charge_price')
        return {
          year: String(r.year),
          discharge: discharge?.median ?? 0,
          charge: charge?.median ?? 0,
          spread: spread?.median ?? 0,
        }
      })
  }, [data])

  // Comparison table data for selected year
  const comparisonRows = useMemo(() => {
    return TECH_ORDER
      .map(tech => {
        const row = techYearRows.find(r => r.technology === tech)
        if (!row) return null
        const bessSpread = getBessField(row, 'bess_spread')
        return {
          tech,
          label: TECH_LABELS[tech],
          colour: TECH_COLOURS[tech],
          count: row.revenue_per_mw.count,
          revMedian: row.revenue_per_mw.median,
          revP25: row.revenue_per_mw.p25,
          revP75: row.revenue_per_mw.p75,
          priceMedian: row.energy_price.median,
          priceP25: row.energy_price.p25,
          priceP75: row.energy_price.p75,
          cfMedian: row.capacity_factor.median,
          cfP25: row.capacity_factor.p25,
          cfP75: row.capacity_factor.p75,
          spreadMedian: bessSpread?.median,
        }
      })
      .filter(Boolean) as Array<{
        tech: string; label: string; colour: string; count: number;
        revMedian: number; revP25: number; revP75: number;
        priceMedian: number; priceP25: number; priceP75: number;
        cfMedian: number; cfP25: number; cfP75: number;
        spreadMedian?: number;
      }>
  }, [techYearRows])

  // Summary card values (2024 full year)
  const summaryCards = useMemo(() => {
    if (!data) return null
    const rows2024 = data.by_technology_year.filter(r => r.year === 2024)
    const highest = [...rows2024].sort((a, b) => b.revenue_per_mw.median - a.revenue_per_mw.median)[0]
    const bess2024 = rows2024.find(r => r.technology === 'bess')
    const solar2024 = rows2024.find(r => r.technology === 'solar')
    const wind2024 = rows2024.find(r => r.technology === 'wind')
    const bessSpread = getBessField(bess2024, 'bess_spread')

    return {
      highestTech: highest ? TECH_LABELS[highest.technology] : '-',
      highestRevenue: highest ? highest.revenue_per_mw.median : 0,
      highestColour: highest ? TECH_COLOURS[highest.technology] : '#666',
      bessSpread: bessSpread?.median ?? 0,
      solarPrice: solar2024?.energy_price.median ?? 0,
      windRevenue: wind2024?.revenue_per_mw.median ?? 0,
    }
  }, [data])

  // ---- Render ----

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-center text-[var(--text-secondary)]">No revenue data available</div>
  }

  const offtake = data.offtake_comparison

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Revenue Intelligence</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Revenue and pricing analytics across {data.by_technology_year.length} technology-year combinations
        </p>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Year</span>
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          {([2024, 2025] as SelectedYear[]).map(yr => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 text-sm ${selectedYear === yr ? 'bg-blue-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
            >
              {yr}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--text-secondary)]">
          2026 excluded (partial year)
        </span>
      </div>

      {/* Summary cards */}
      {summaryCards && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
              <DollarIcon />
              <span className="text-xs font-medium uppercase tracking-wider">Top Revenue (2024)</span>
            </div>
            <div className="text-xl font-bold" style={{ color: summaryCards.highestColour }}>
              {fmtRevenue(summaryCards.highestRevenue)}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">{summaryCards.highestTech} median $/MW</div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
              <BoltIcon />
              <span className="text-xs font-medium uppercase tracking-wider">BESS Spread</span>
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {fmtPrice(summaryCards.bessSpread)}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Median $/MWh (2024)</div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
              <TrendIcon />
              <span className="text-xs font-medium uppercase tracking-wider">Solar Price</span>
            </div>
            <div className="text-xl font-bold text-amber-400">
              {fmtPrice(summaryCards.solarPrice)}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Median $/MWh (2024)</div>
          </div>

          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
              <ShieldIcon />
              <span className="text-xs font-medium uppercase tracking-wider">Wind Revenue</span>
            </div>
            <div className="text-xl font-bold text-blue-400">
              {fmtRevenue(summaryCards.windRevenue)}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">Median $/MW (2024)</div>
          </div>
        </div>
      )}

      {/* Revenue by Technology bar chart */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Revenue by Technology ({selectedYear})
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Median revenue per MW by technology. Bar colour indicates technology.
        </p>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={revenueBarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
            <YAxis
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
              labelStyle={{ color: 'var(--text-primary)' }}
              formatter={(value) => [fmtRevenue(Number(value)), 'Median $/MW']}
              labelFormatter={(label) => {
                const row = revenueBarData.find(r => r.label === label)
                return `${label} (${row?.count ?? 0} projects)`
              }}
            />
            <Bar dataKey="median" radius={[4, 4, 0, 0]}>
              {revenueBarData.map((entry, i) => (
                <rect key={i} fill={entry.colour} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Inline legend */}
        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          {revenueBarData.map(r => (
            <div key={r.tech} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.colour }} />
              {r.label}
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: YoY Trends + BESS Arbitrage */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* YoY Revenue Trends */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            Year-over-Year Revenue Trends
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Median revenue per MW by year. 2026 is partial (YTD).
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yoyLineData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(value) => [fmtRevenue(Number(value)), 'Median $/MW']}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => TECH_LABELS[value] ?? value}
              />
              {TECH_ORDER.map(tech => (
                <Line
                  key={tech}
                  type="monotone"
                  dataKey={tech}
                  stroke={TECH_COLOURS[tech]}
                  strokeWidth={2}
                  dot={{ fill: TECH_COLOURS[tech], r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BESS Arbitrage */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
            BESS Arbitrage Pricing
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mb-4">
            Median discharge, charge, and spread prices ($/MWh) for BESS
          </p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bessArbitrageData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(value) => [fmtPrice(Number(value)), '']}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="discharge" name="Discharge Price" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="charge" name="Charge Price" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spread" name="Spread" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Technology Comparison Table */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-x-auto">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Technology Comparison ({selectedYear})
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Median values with interquartile range (P25 - P75)
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-3 text-[var(--text-secondary)] font-medium">Technology</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium">Projects</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium">Revenue/MW</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium hidden sm:table-cell">Rev Range</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium">Energy Price</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium hidden sm:table-cell">Price Range</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium">CF %</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium hidden md:table-cell">CF Range</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map(row => (
              <tr key={row.tech} className="border-b border-[var(--border)] hover:bg-[var(--bg-primary)]/50">
                <td className="p-3">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.colour }} />
                    <span className="text-[var(--text-primary)] font-medium">{row.label}</span>
                  </span>
                </td>
                <td className="p-3 text-right text-[var(--text-secondary)]">{row.count}</td>
                <td className="p-3 text-right font-medium text-[var(--text-primary)]">{fmtRevenue(row.revMedian)}</td>
                <td className="p-3 text-right text-[var(--text-secondary)] text-xs hidden sm:table-cell">
                  {fmtRevenue(row.revP25)} - {fmtRevenue(row.revP75)}
                </td>
                <td className="p-3 text-right font-medium text-[var(--text-primary)]">{fmtPrice(row.priceMedian)}</td>
                <td className="p-3 text-right text-[var(--text-secondary)] text-xs hidden sm:table-cell">
                  {fmtPrice(row.priceP25)} - {fmtPrice(row.priceP75)}
                </td>
                <td className="p-3 text-right font-medium text-[var(--text-primary)]">{fmtPct(row.cfMedian)}</td>
                <td className="p-3 text-right text-[var(--text-secondary)] text-xs hidden md:table-cell">
                  {fmtPct(row.cfP25)} - {fmtPct(row.cfP75)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Offtake Comparison */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Offtake Agreement Impact ({offtake.year})
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Revenue comparison for projects with and without offtake agreements
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* With Offtake */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-emerald-400">With Offtake</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                {offtake.with_offtake.count} projects
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-0.5">Revenue/MW</div>
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {fmtRevenue(offtake.with_offtake.revenue_per_mw.median)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  IQR: {fmtRevenue(offtake.with_offtake.revenue_per_mw.p25)} - {fmtRevenue(offtake.with_offtake.revenue_per_mw.p75)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-0.5">Energy Price</div>
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {fmtPrice(offtake.with_offtake.energy_price.median)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  IQR: {fmtPrice(offtake.with_offtake.energy_price.p25)} - {fmtPrice(offtake.with_offtake.energy_price.p75)}
                </div>
              </div>
            </div>
          </div>

          {/* Without Offtake */}
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-orange-400">Without Offtake</span>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                {offtake.without_offtake.count} projects
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-0.5">Revenue/MW</div>
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {fmtRevenue(offtake.without_offtake.revenue_per_mw.median)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  IQR: {fmtRevenue(offtake.without_offtake.revenue_per_mw.p25)} - {fmtRevenue(offtake.without_offtake.revenue_per_mw.p75)}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-0.5">Energy Price</div>
                <div className="text-lg font-bold text-[var(--text-primary)]">
                  {fmtPrice(offtake.without_offtake.energy_price.median)}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  IQR: {fmtPrice(offtake.without_offtake.energy_price.p25)} - {fmtPrice(offtake.without_offtake.energy_price.p75)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Source note */}
      <div className="text-xs text-[var(--text-secondary)] italic">
        Revenue figures derived from AEMO dispatch and pricing data. Revenue/MW = annual energy revenue
        divided by registered capacity. 2026 figures are year-to-date and not comparable to full-year values.
      </div>
    </div>
  )
}
