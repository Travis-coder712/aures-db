import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, BarChart, Bar,
} from 'recharts'
import type { Project, MonthlyPerformanceEntry } from '../../lib/types'
import { useMonthlyPerformance } from '../../hooks/usePerformanceData'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipFormatter = (value: any, name: any) => [string, string]

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const YEAR_COLORS: Record<number, string> = {
  2018: '#6366f1',
  2019: '#8b5cf6',
  2020: '#a855f7',
  2021: '#ec4899',
  2022: '#f43f5e',
  2023: '#f59e0b',
  2024: '#22c55e',
  2025: '#3b82f6',
  2026: '#06b6d4',
}

interface Props {
  project: Project
}

export default function PerformanceTab({ project }: Props) {
  const { data, loading } = useMonthlyPerformance(project.id)
  const [selectedYear, setSelectedYear] = useState<number | 'average'>('average')

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data || data.monthly.length === 0) {
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-8 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          Performance data not yet available for this project
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Monthly data sourced from AEMO dispatch via OpenElectricity
        </p>
      </div>
    )
  }

  const isBess = project.technology === 'bess' || project.technology === 'pumped_hydro'
  const years = [...new Set(data.monthly.map(m => m.year))].sort()

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">View:</span>
        <button
          onClick={() => setSelectedYear('average')}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            selectedYear === 'average'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
          }`}
        >
          All Years
        </button>
        {years.map(y => {
          const monthCount = data.monthly.filter(m => m.year === y).length
          const isCurrentYear = y === new Date().getFullYear()
          return (
            <button
              key={y}
              onClick={() => setSelectedYear(y)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedYear === y
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
              }`}
            >
              {y}{isCurrentYear ? '*' : ''}
              <span className={`ml-1 text-[9px] ${selectedYear === y ? 'text-white/60' : 'text-[var(--color-text-muted)]/40'}`}>
                {monthCount}m
              </span>
            </button>
          )
        })}
      </div>

      {isBess ? (
        <BessMonthlyCharts data={data} years={years} selectedYear={selectedYear} />
      ) : (
        <GenerationMonthlyCharts data={data} years={years} selectedYear={selectedYear} />
      )}

      {/* Source note */}
      <p className="text-[9px] text-[var(--color-text-muted)] italic">
        Monthly data derived from AEMO dispatch records via OpenElectricity API. {years.length} years of operational history ({years[0]}–{years[years.length - 1]}).
      </p>
    </div>
  )
}

// ============================================================
// Wind / Solar / Hybrid Monthly Charts
// ============================================================

function GenerationMonthlyCharts({
  data,
  years,
  selectedYear,
}: {
  data: { monthly: MonthlyPerformanceEntry[]; capacity_mw: number }
  years: number[]
  selectedYear: number | 'average'
}) {
  // Build year-over-year comparison data (12 months, each year as a line)
  const cfComparison = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const month = i + 1
      const row: Record<string, string | number | null> = { month: label }

      for (const y of years) {
        const entry = data.monthly.find(m => m.year === y && m.month === month)
        row[`y${y}`] = entry?.capacity_factor_pct ?? null
      }

      // Average across years
      const vals = years.map(y => {
        const e = data.monthly.find(m => m.year === y && m.month === month)
        return e?.capacity_factor_pct
      }).filter((v): v is number => v != null)
      row.average = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10 : null

      return row
    })
  }, [data.monthly, years])

  // Annual summary cards
  const annualSummary = useMemo(() => {
    return years.map(y => {
      const entries = data.monthly.filter(m => m.year === y)
      const avgCF = entries.reduce((s, e) => s + (e.capacity_factor_pct ?? 0), 0) / entries.length
      const totalEnergy = entries.reduce((s, e) => s + (e.energy_mwh ?? 0), 0)
      const totalRevenue = entries.reduce((s, e) => s + (e.revenue_aud ?? 0), 0)
      const avgCurt = entries.reduce((s, e) => s + (e.curtailment_pct ?? 0), 0) / entries.length
      return { year: y, avgCF, totalEnergy, totalRevenue, avgCurt, months: entries.length }
    })
  }, [data.monthly, years])

  const hasRevenue = data.monthly.some(m => m.revenue_aud != null && m.revenue_aud > 0)

  const displayYear = selectedYear === 'average' ? null : selectedYear
  const summaryToShow = displayYear ? annualSummary.filter(s => s.year === displayYear) : annualSummary

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryToShow.length === 1 ? (
          <>
            <MetricCard label={`${summaryToShow[0].year} Avg CF`} value={`${summaryToShow[0].avgCF.toFixed(1)}%`} />
            <MetricCard label="Total Energy" value={fmtEnergy(summaryToShow[0].totalEnergy)} />
            <MetricCard label="Total Revenue" value={fmtRevenue(summaryToShow[0].totalRevenue)} />
            <MetricCard label="Avg Curtailment" value={`${summaryToShow[0].avgCurt.toFixed(1)}%`} warn={summaryToShow[0].avgCurt > 5} />
          </>
        ) : (
          <>
            <MetricCard
              label="Avg CF (All Years)"
              value={`${(annualSummary.reduce((s, a) => s + a.avgCF, 0) / annualSummary.length).toFixed(1)}%`}
            />
            <MetricCard
              label="Best Year"
              value={`${annualSummary.reduce((best, a) => a.avgCF > best.avgCF ? a : best).year}`}
              sub={`${annualSummary.reduce((best, a) => a.avgCF > best.avgCF ? a : best).avgCF.toFixed(1)}% CF`}
            />
            <MetricCard
              label="Latest Energy"
              value={fmtEnergy(annualSummary[annualSummary.length - 1].totalEnergy)}
              sub={`${annualSummary[annualSummary.length - 1].year}${annualSummary[annualSummary.length - 1].months < 12 ? ' YTD' : ''}`}
            />
            <MetricCard
              label="CF Trend"
              value={getCFTrend(annualSummary)}
              sub={annualSummary.length >= 2 ? `${annualSummary[0].year}→${annualSummary[annualSummary.length - 1].year}` : ''}
            />
          </>
        )}
      </div>

      {/* Year-over-year CF comparison */}
      <ChartSection title="Monthly Capacity Factor — Year-over-Year">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={cfComparison} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={((value: number, name: string) => [
                `${value?.toFixed(1)}%`,
                name === 'average' ? 'Average' : name.replace('y', ''),
              ]) as TooltipFormatter}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => v === 'average' ? 'Average' : v.replace('y', '')} />
            {selectedYear === 'average' ? (
              <>
                {years.map(y => (
                  <Line
                    key={y}
                    type="monotone"
                    dataKey={`y${y}`}
                    stroke={YEAR_COLORS[y] || '#6b7280'}
                    strokeWidth={1.5}
                    dot={{ r: 2.5 }}
                    connectNulls
                    strokeOpacity={0.7}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#ffffff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff' }}
                  connectNulls
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={`y${selectedYear}`}
                stroke={YEAR_COLORS[selectedYear] || '#3b82f6'}
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Annual CF bar chart */}
      <ChartSection title="Annual Capacity Factor Trend">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={annualSummary.map(a => ({
            year: a.year.toString(),
            cf: Math.round(a.avgCF * 10) / 10,
            curtailment: Math.round(a.avgCurt * 10) / 10,
          }))} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} formatter={((value: number, name: string) => [`${value}%`, name === 'cf' ? 'Capacity Factor' : 'Curtailment']) as TooltipFormatter} />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => v === 'cf' ? 'Capacity Factor' : 'Curtailment'} />
            <Bar dataKey="cf" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="curtailment" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Monthly Revenue — Year-over-Year */}
      {hasRevenue && (
        <RevenueYoYChart data={data} years={years} selectedYear={selectedYear} />
      )}

      {/* Monthly energy output heatmap-style table */}
      <MonthlyTable data={data.monthly} years={years} metric="capacity_factor_pct" label="CF%" format={v => `${v.toFixed(1)}%`} colorFn={cfColor} />
    </>
  )
}

// ============================================================
// BESS Monthly Charts
// ============================================================

function BessMonthlyCharts({
  data,
  years,
  selectedYear,
}: {
  data: { monthly: MonthlyPerformanceEntry[]; capacity_mw: number }
  years: number[]
  selectedYear: number | 'average'
}) {
  // Year-over-year spread comparison
  const spreadComparison = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const month = i + 1
      const row: Record<string, string | number | null> = { month: label }

      for (const y of years) {
        const entry = data.monthly.find(m => m.year === y && m.month === month)
        if (entry?.avg_discharge_price != null && entry?.avg_charge_price != null) {
          row[`y${y}`] = Math.round(entry.avg_discharge_price - entry.avg_charge_price)
        } else {
          row[`y${y}`] = null
        }
      }

      const vals = years.map(y => {
        const e = data.monthly.find(m => m.year === y && m.month === month)
        return e?.avg_discharge_price != null && e?.avg_charge_price != null
          ? e.avg_discharge_price - e.avg_charge_price : undefined
      }).filter((v): v is number => v != null)
      row.average = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : null

      return row
    })
  }, [data.monthly, years])

  // Annual summary
  const annualSummary = useMemo(() => {
    return years.map(y => {
      const entries = data.monthly.filter(m => m.year === y)
      const avgCharge = entries.reduce((s, e) => s + (e.avg_charge_price ?? 0), 0) / entries.length
      const avgDischarge = entries.reduce((s, e) => s + (e.avg_discharge_price ?? 0), 0) / entries.length
      const totalCycles = entries.reduce((s, e) => s + (e.cycles ?? 0), 0)
      const avgUtil = entries.reduce((s, e) => s + (e.utilisation_pct ?? 0), 0) / entries.length
      return { year: y, avgCharge, avgDischarge, spread: avgDischarge - avgCharge, totalCycles, avgUtil, months: entries.length }
    })
  }, [data.monthly, years])

  const displayYear = selectedYear === 'average' ? null : selectedYear
  const summaryToShow = displayYear ? annualSummary.filter(s => s.year === displayYear) : annualSummary

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryToShow.length === 1 ? (
          <>
            <MetricCard label={`${summaryToShow[0].year} Avg Spread`} value={`$${summaryToShow[0].spread.toFixed(0)}/MWh`} />
            <MetricCard label="Charge Price" value={`$${summaryToShow[0].avgCharge.toFixed(0)}/MWh`} />
            <MetricCard label="Discharge Price" value={`$${summaryToShow[0].avgDischarge.toFixed(0)}/MWh`} />
            <MetricCard label="Total Cycles" value={summaryToShow[0].totalCycles.toFixed(0)} />
          </>
        ) : (
          <>
            <MetricCard
              label="Avg Spread (All Years)"
              value={`$${(annualSummary.reduce((s, a) => s + a.spread, 0) / annualSummary.length).toFixed(0)}/MWh`}
            />
            <MetricCard
              label="Best Spread Year"
              value={`${annualSummary.reduce((best, a) => a.spread > best.spread ? a : best).year}`}
              sub={`$${annualSummary.reduce((best, a) => a.spread > best.spread ? a : best).spread.toFixed(0)}/MWh`}
            />
            <MetricCard
              label="Latest Cycles"
              value={annualSummary[annualSummary.length - 1].totalCycles.toFixed(0)}
              sub={`${annualSummary[annualSummary.length - 1].year}${annualSummary[annualSummary.length - 1].months < 12 ? ' YTD' : ''}`}
            />
            <MetricCard
              label="Avg Utilisation"
              value={`${(annualSummary.reduce((s, a) => s + a.avgUtil, 0) / annualSummary.length).toFixed(1)}%`}
            />
          </>
        )}
      </div>

      {/* Year-over-year spread comparison */}
      <ChartSection title="Monthly Price Spread — Year-over-Year">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={spreadComparison} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={((value: number, name: string) => [
                `$${value?.toFixed(0)}/MWh`,
                name === 'average' ? 'Average' : name.replace('y', ''),
              ]) as TooltipFormatter}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => v === 'average' ? 'Average' : v.replace('y', '')} />
            {selectedYear === 'average' ? (
              <>
                {years.map(y => (
                  <Line
                    key={y}
                    type="monotone"
                    dataKey={`y${y}`}
                    stroke={YEAR_COLORS[y] || '#6b7280'}
                    strokeWidth={1.5}
                    dot={{ r: 2.5 }}
                    connectNulls
                    strokeOpacity={0.7}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#ffffff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff' }}
                  connectNulls
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={`y${selectedYear}`}
                stroke={YEAR_COLORS[selectedYear] || '#3b82f6'}
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Annual spread + cycles bar chart */}
      <ChartSection title="Annual Spread & Cycles Trend">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={annualSummary.map(a => ({
            year: a.year.toString(),
            spread: Math.round(a.spread),
            cycles: Math.round(a.totalCycles),
          }))} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <Tooltip contentStyle={tooltipStyle} formatter={((value: number, name: string) => [name === 'spread' ? `$${value}/MWh` : `${value}`, name === 'spread' ? 'Avg Spread' : 'Total Cycles']) as TooltipFormatter} />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => v === 'spread' ? 'Avg Spread ($/MWh)' : 'Total Cycles'} />
            <Bar dataKey="spread" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cycles" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>

      {/* Monthly Revenue — Year-over-Year */}
      {data.monthly.some(m => m.revenue_aud != null && m.revenue_aud > 0) && (
        <RevenueYoYChart data={data} years={years} selectedYear={selectedYear} />
      )}
    </>
  )
}

// ============================================================
// Revenue Year-over-Year Chart (shared by generation & BESS)
// ============================================================

function RevenueYoYChart({
  data,
  years,
  selectedYear,
}: {
  data: { monthly: MonthlyPerformanceEntry[]; capacity_mw: number }
  years: number[]
  selectedYear: number | 'average'
}) {
  const revenueComparison = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const month = i + 1
      const row: Record<string, string | number | null> = { month: label }

      for (const y of years) {
        const entry = data.monthly.find(m => m.year === y && m.month === month)
        row[`y${y}`] = entry?.revenue_aud != null ? Math.round(entry.revenue_aud / 1000) : null
      }

      const vals = years.map(y => {
        const e = data.monthly.find(m => m.year === y && m.month === month)
        return e?.revenue_aud
      }).filter((v): v is number => v != null)
      row.average = vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length / 1000) : null

      return row
    })
  }, [data.monthly, years])

  // Annual revenue totals for bar chart
  const annualRevenue = useMemo(() => {
    return years.map(y => {
      const entries = data.monthly.filter(m => m.year === y)
      const total = entries.reduce((s, e) => s + (e.revenue_aud ?? 0), 0)
      const perMw = data.capacity_mw > 0 ? total / data.capacity_mw : 0
      return { year: y.toString(), revenue_m: Math.round(total / 1_000_000 * 10) / 10, per_mw_k: Math.round(perMw / 1000 * 10) / 10, months: entries.length }
    })
  }, [data.monthly, years, data.capacity_mw])

  return (
    <>
      <ChartSection title="Monthly Revenue — Year-over-Year ($k)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueComparison} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}k`} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={((value: number, name: string) => [
                `$${value?.toLocaleString()}k`,
                name === 'average' ? 'Average' : name.replace('y', ''),
              ]) as TooltipFormatter}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => v === 'average' ? 'Average' : v.replace('y', '')} />
            {selectedYear === 'average' ? (
              <>
                {years.map(y => (
                  <Line
                    key={y}
                    type="monotone"
                    dataKey={`y${y}`}
                    stroke={YEAR_COLORS[y] || '#6b7280'}
                    strokeWidth={1.5}
                    dot={{ r: 2.5 }}
                    connectNulls
                    strokeOpacity={0.7}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#ffffff"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#ffffff' }}
                  connectNulls
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={`y${selectedYear}`}
                stroke={YEAR_COLORS[selectedYear as number] || '#3b82f6'}
                strokeWidth={2.5}
                dot={{ r: 4 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartSection>

      <ChartSection title="Annual Revenue Trend">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={annualRevenue} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}M`} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={((value: number, name: string) => [
              name === 'revenue_m' ? `$${value}M` : `$${value}k/MW`,
              name === 'revenue_m' ? 'Total Revenue' : 'Revenue per MW',
            ]) as TooltipFormatter} />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => v === 'revenue_m' ? 'Total Revenue ($M)' : 'Revenue/MW ($k)'} />
            <Bar yAxisId="left" dataKey="revenue_m" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="per_mw_k" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.6} />
          </BarChart>
        </ResponsiveContainer>
      </ChartSection>
    </>
  )
}

// ============================================================
// Monthly data table (heatmap-style)
// ============================================================

function MonthlyTable({
  data,
  years,
  metric,
  label,
  format,
  colorFn,
}: {
  data: MonthlyPerformanceEntry[]
  years: number[]
  metric: keyof MonthlyPerformanceEntry
  label: string
  format: (v: number) => string
  colorFn: (v: number) => string
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 className="text-xs font-semibold text-[var(--color-text)]">Monthly {label} by Year</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="px-3 py-1.5 text-left text-[var(--color-text-muted)] font-medium">Year</th>
              {MONTH_LABELS.map(m => (
                <th key={m} className="px-1.5 py-1.5 text-center text-[var(--color-text-muted)] font-medium">{m}</th>
              ))}
              <th className="px-2 py-1.5 text-center text-[var(--color-text-muted)] font-semibold">Avg</th>
            </tr>
          </thead>
          <tbody>
            {years.map(y => {
              const entries = data.filter(m => m.year === y)
              const avg = entries.reduce((s, e) => s + ((e[metric] as number) ?? 0), 0) / entries.length
              return (
                <tr key={y} className="border-b border-[var(--color-border)]/50">
                  <td className="px-3 py-1.5 font-semibold text-[var(--color-text)]">{y}</td>
                  {MONTH_LABELS.map((_, i) => {
                    const entry = entries.find(e => e.month === i + 1)
                    const val = entry ? (entry[metric] as number) : null
                    return (
                      <td key={i} className="px-1.5 py-1.5 text-center">
                        {val != null ? (
                          <span className="font-mono" style={{ color: colorFn(val) }}>
                            {format(val)}
                          </span>
                        ) : (
                          <span className="text-[var(--color-text-muted)]/30">—</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-2 py-1.5 text-center font-semibold font-mono" style={{ color: colorFn(avg) }}>
                    {format(avg)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// Shared sub-components & helpers
// ============================================================

const tooltipStyle = {
  background: 'var(--color-bg-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  fontSize: 11,
}

function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-semibold text-[var(--color-text)] mb-2">{title}</h3>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        {children}
      </div>
    </section>
  )
}

function MetricCard({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-2">
      <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-bold ${warn ? 'text-red-500' : 'text-[var(--color-text)]'}`}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--color-text-muted)]">{sub}</p>}
    </div>
  )
}

function fmtEnergy(mwh: number): string {
  if (mwh >= 1_000_000) return `${(mwh / 1_000_000).toFixed(1)} TWh`
  if (mwh >= 1000) return `${(mwh / 1000).toFixed(0)} GWh`
  return `${Math.round(mwh)} MWh`
}

function fmtRevenue(aud: number): string {
  if (aud >= 1_000_000_000) return `$${(aud / 1_000_000_000).toFixed(1)}B`
  if (aud >= 1_000_000) return `$${(aud / 1_000_000).toFixed(0)}M`
  if (aud >= 1000) return `$${(aud / 1000).toFixed(0)}k`
  return `$${Math.round(aud)}`
}

function cfColor(cf: number): string {
  if (cf >= 35) return '#22c55e'
  if (cf >= 25) return '#84cc16'
  if (cf >= 15) return '#f59e0b'
  return '#ef4444'
}

function getCFTrend(summary: { year: number; avgCF: number }[]): string {
  if (summary.length < 2) return '—'
  const first = summary[0].avgCF
  const last = summary[summary.length - 1].avgCF
  const diff = last - first
  if (Math.abs(diff) < 0.5) return 'Stable'
  return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`
}
