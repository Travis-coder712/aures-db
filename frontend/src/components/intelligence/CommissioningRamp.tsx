import { useEffect, useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Line, LineChart, Legend, Cell,
} from 'recharts'
import { fetchCommissioningRamp } from '../../lib/dataService'
import type {
  CommissioningRampData, CommissioningRampAsset, CommissioningRampMonth,
  DataQualityFlag, LifetimeCfBasis,
} from '../../lib/types'
import ChartWrapper from '../common/ChartWrapper'
import DataTable, { type Column } from '../common/DataTable'
import DrillPanel from '../common/DrillPanel'

type MetricKey = 'ramp_days' | 'early_revenue_aud' | 'early_revenue_per_mw' | 'early_output_pct'
type TechFilter = 'all' | 'solar' | 'wind' | 'hybrid'

const TECH_COLOURS: Record<string, string> = {
  solar: '#f59e0b', wind: '#3b82f6', hybrid: '#ec4899',
}

const TECH_LABELS: Record<string, string> = {
  solar: 'Solar', wind: 'Wind', hybrid: 'Hybrid',
}

const METRIC_LABELS: Record<MetricKey, string> = {
  ramp_days: 'Ramp duration (days)',
  early_revenue_aud: 'Early revenue ($)',
  early_revenue_per_mw: 'Early revenue per MW ($)',
  early_output_pct: 'Early output (% of theoretical)',
}

const FLAG_LABELS: Record<DataQualityFlag, string> = {
  'pre-2021-cutoff': 'First gen pre-dates AEMO daily snapshot (2021-01-01) — ramp curve censored.',
  'short-history': 'Less than 9 months of post-stable operation, so lifetime CF baseline is provisional.',
  'no-settled-revenue': 'No rows in performance_monthly — entire revenue figure is modelled.',
  'not-yet-stable': 'Asset has not yet reached 80% of its own lifetime CF, so ramp duration is still open.',
  'no-cod': 'No COD recorded in projects or timeline_events.',
}

const CF_BASIS_LABEL: Record<LifetimeCfBasis, string> = {
  high: '18+ months of operation', medium: '9-17 months', low: '<9 months', no_data: 'no monthly data',
}

const fmtMoney = (v: number | null | undefined) => {
  if (v === null || v === undefined) return '—'
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
  return `$${Math.round(v)}`
}
const fmtPct = (v: number | null | undefined) => v == null ? '—' : `${v.toFixed(1)}%`
const fmtDate = (s: string | null | undefined) => s ? s.slice(0, 10) : '—'

interface Props {
  /** Optional initial project_id to deep-link the drill panel. */
  initialProjectId?: string | null
}

export default function CommissioningRamp({ initialProjectId }: Props) {
  const [data, setData] = useState<CommissioningRampData | null>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedYears, setSelectedYears] = useState<Set<number>>(new Set())
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set())
  const [techFilter, setTechFilter] = useState<TechFilter>('all')
  const [metric, setMetric] = useState<MetricKey>('ramp_days')
  const [hideCensored, setHideCensored] = useState(true)

  // Drill panel
  const [drillAsset, setDrillAsset] = useState<CommissioningRampAsset | null>(null)

  useEffect(() => {
    fetchCommissioningRamp().then(d => { setData(d); setLoading(false) })
  }, [])

  // Open drill on initial mount if a deep-link asset is requested
  useEffect(() => {
    if (!initialProjectId || !data) return
    const a = data.assets.find(x => x.project_id === initialProjectId)
    if (a) setDrillAsset(a)
  }, [initialProjectId, data])

  const allYears = useMemo(() => {
    if (!data) return []
    const ys = new Set<number>()
    for (const a of data.assets) if (a.commissioning_year) ys.add(a.commissioning_year)
    return Array.from(ys).sort((a, b) => b - a)
  }, [data])

  const allStates = useMemo(() => {
    if (!data) return []
    const ss = new Set<string>()
    for (const a of data.assets) if (a.state) ss.add(a.state)
    return Array.from(ss).sort()
  }, [data])

  const filteredAssets = useMemo(() => {
    if (!data) return []
    return data.assets.filter(a => {
      if (hideCensored && a.data_quality_flags.includes('pre-2021-cutoff')) return false
      if (techFilter !== 'all' && a.tech !== techFilter) return false
      if (selectedYears.size > 0 && (!a.commissioning_year || !selectedYears.has(a.commissioning_year))) return false
      if (selectedStates.size > 0 && (!a.state || !selectedStates.has(a.state))) return false
      return true
    })
  }, [data, hideCensored, techFilter, selectedYears, selectedStates])

  // Rollup bars: median of selected metric grouped by tech, across the current filter set.
  const rollupBars = useMemo(() => {
    const groups: Record<string, number[]> = { solar: [], wind: [], hybrid: [] }
    for (const a of filteredAssets) {
      const v = a[metric]
      if (v != null && Number.isFinite(v)) groups[a.tech]?.push(v as number)
    }
    return (Object.keys(groups) as Array<keyof typeof groups>)
      .filter(t => groups[t].length > 0)
      .map(t => {
        const vs = groups[t].sort((a, b) => a - b)
        const median = vs[Math.floor(vs.length / 2)]
        return {
          tech: t, label: TECH_LABELS[t], median, count: vs.length,
          colour: TECH_COLOURS[t],
        }
      })
  }, [filteredAssets, metric])

  const toggleYear = (y: number) => {
    setSelectedYears(prev => {
      const next = new Set(prev)
      if (next.has(y)) next.delete(y); else next.add(y)
      return next
    })
  }
  const toggleState = (s: string) => {
    setSelectedStates(prev => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s); else next.add(s)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }
  if (!data) {
    return <div className="p-6 text-center text-[var(--color-text-muted)]">No commissioning-ramp data available</div>
  }

  return (
    <div className="space-y-6">
      {/* Definitions / quality explainer */}
      <details className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <summary className="text-sm font-medium text-[var(--color-text)] cursor-pointer">
          How is commissioning ramp measured? &middot; Data sources &amp; quality
        </summary>
        <div className="mt-3 text-xs text-[var(--color-text-muted)] space-y-3">
          <div>
            <div className="text-[var(--color-text)] font-semibold mb-1">Definitions</div>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(data.definitions).map(([k, v]) => (
                <li key={k}><span className="font-mono text-[11px] text-[var(--color-text)]">{k}</span> — {v}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[var(--color-text)] font-semibold mb-1">Data sources</div>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(data.data_sources).map(([k, v]) => (
                <li key={k}><span className="font-mono text-[11px] text-[var(--color-text)]">{k}</span> — {v}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-[var(--color-text)] font-semibold mb-1">Known gaps</div>
            <ul className="list-disc pl-5 space-y-1">
              {data.known_gaps.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </div>
          <div>
            <div className="text-[var(--color-text)] font-semibold mb-1">Coverage in this dataset</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider opacity-70">Quality flags</div>
                {Object.entries(data.quality_summary.flag_counts).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-[var(--color-text)]">{FLAG_LABELS[k as DataQualityFlag] ?? k}</span><span className="ml-2">{v}</span></div>
                ))}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider opacity-70">Lifetime-CF basis</div>
                {Object.entries(data.quality_summary.lifetime_cf_basis_counts).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span>{CF_BASIS_LABEL[k as LifetimeCfBasis] ?? k}</span><span>{v}</span></div>
                ))}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider opacity-70">COD source</div>
                {Object.entries(data.quality_summary.cod_basis_counts).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="font-mono text-[10px]">{k}</span><span>{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </details>

      {/* Filter row */}
      <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)] space-y-3">
        {/* Tech */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mr-2">Tech</span>
          {(['all', 'solar', 'wind', 'hybrid'] as TechFilter[]).map(t => {
            const active = techFilter === t
            return (
              <button key={t} onClick={() => setTechFilter(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium border ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-blue-500/30'
                }`}>
                {t === 'all' ? 'All' : TECH_LABELS[t]}
              </button>
            )
          })}
        </div>

        {/* Year multi-select */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mr-2">Commissioning year</span>
          {allYears.map(y => {
            const active = selectedYears.has(y)
            return (
              <button key={y} onClick={() => toggleYear(y)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  active
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-emerald-500/30'
                }`}>
                {y}
              </button>
            )
          })}
          {selectedYears.size > 0 && (
            <button onClick={() => setSelectedYears(new Set())} className="text-[11px] text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]">clear</button>
          )}
        </div>

        {/* State multi-select */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mr-2">State</span>
          {allStates.map(s => {
            const active = selectedStates.has(s)
            return (
              <button key={s} onClick={() => toggleState(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  active
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-purple-500/30'
                }`}>
                {s}
              </button>
            )
          })}
          {selectedStates.size > 0 && (
            <button onClick={() => setSelectedStates(new Set())} className="text-[11px] text-[var(--color-text-muted)] underline hover:text-[var(--color-text)]">clear</button>
          )}
        </div>

        {/* Metric + options */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[var(--color-border)]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mr-2">Metric</span>
          {(Object.keys(METRIC_LABELS) as MetricKey[]).map(m => {
            const active = metric === m
            return (
              <button key={m} onClick={() => setMetric(m)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                  active
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                    : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-amber-500/30'
                }`}>
                {METRIC_LABELS[m]}
              </button>
            )
          })}
          <label className="flex items-center gap-1.5 ml-auto text-xs text-[var(--color-text-muted)] cursor-pointer">
            <input type="checkbox" checked={hideCensored} onChange={e => setHideCensored(e.target.checked)} />
            Hide pre-2021 censored assets
          </label>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Assets in view" value={String(filteredAssets.length)} hint={`of ${data.assets.length} total`} />
        <SummaryCard label="Median ramp" value={rollupBars.length > 0 ? `${Math.round(median(rollupBars.flatMap(r => Array(r.count).fill(r.median))))} days` : '—'} hint="across selection" />
        <SummaryCard label="Total early revenue" value={fmtMoney(filteredAssets.reduce((s, a) => s + (a.early_revenue_aud ?? 0), 0))} hint="settled + modelled" />
        <SummaryCard label="Total early energy" value={fmtMoney(filteredAssets.reduce((s, a) => s + (a.early_energy_mwh ?? 0), 0)).replace('$', '') + ' MWh'} hint="ramp-window output" />
      </div>

      {/* Fleet rollup chart */}
      <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-1">
          Median {METRIC_LABELS[metric].toLowerCase()} by technology
        </h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-3">
          {filteredAssets.length} assets in view. Click a row in the table below to see an individual ramp curve.
        </p>
        <ChartWrapper title={`Median ${METRIC_LABELS[metric]} by tech`} data={rollupBars} csvColumns={['label', 'median', 'count']}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rollupBars} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
              <YAxis
                tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                tickFormatter={(v) => formatMetricTick(metric, v as number)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--color-text)' }}
                itemStyle={{ color: 'var(--color-text)' }}
                formatter={(value) => [formatMetric(metric, Number(value)), 'Median']}
                labelFormatter={(label) => {
                  const row = rollupBars.find(r => r.label === label)
                  return `${label} (${row?.count ?? 0} assets)`
                }}
              />
              <Bar dataKey="median" radius={[4, 4, 0, 0]}>
                {rollupBars.map((entry, i) => <Cell key={i} fill={entry.colour} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Ramp curves over time */}
      <RampCurvesChart
        filteredAssets={filteredAssets}
        allAssets={data.assets}
        techFilter={techFilter}
        onAssetClick={setDrillAsset}
      />

      {/* Asset table */}
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Assets</h3>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Click any row to see the monthly ramp curve.</p>
        </div>
        <AssetTable assets={filteredAssets} onRowClick={setDrillAsset} />
      </div>

      <DrillPanel
        open={drillAsset !== null}
        title={drillAsset?.name}
        subtitle={drillAsset ? `${TECH_LABELS[drillAsset.tech]} · ${drillAsset.state ?? '—'} · ${drillAsset.capacity_mw ?? '—'} MW` : undefined}
        onClose={() => setDrillAsset(null)}
        widthClass="lg:w-[640px]"
      >
        {drillAsset && <AssetRampDetail asset={drillAsset} />}
      </DrillPanel>
    </div>
  )
}

// ============================================================
// Helpers
// ============================================================

function median(values: number[]): number {
  if (values.length === 0) return 0
  const v = [...values].sort((a, b) => a - b)
  return v[Math.floor(v.length / 2)]
}

function formatMetric(metric: MetricKey, v: number): string {
  switch (metric) {
    case 'ramp_days': return `${Math.round(v)} days`
    case 'early_revenue_aud': return fmtMoney(v)
    case 'early_revenue_per_mw': return fmtMoney(v) + '/MW'
    case 'early_output_pct': return `${v.toFixed(1)}%`
  }
}

function formatMetricTick(metric: MetricKey, v: number): string {
  switch (metric) {
    case 'ramp_days': return `${Math.round(v)}d`
    case 'early_revenue_aud':
    case 'early_revenue_per_mw':
      if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`
      if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`
      return `$${v}`
    case 'early_output_pct': return `${v.toFixed(0)}%`
  }
}

// ============================================================
// Sub-components
// ============================================================

function SummaryCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-xl font-bold text-[var(--color-text)]">{value}</div>
      {hint && <div className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{hint}</div>}
    </div>
  )
}

function AssetTable({ assets, onRowClick }: { assets: CommissioningRampAsset[]; onRowClick: (a: CommissioningRampAsset) => void }) {
  const columns: Column<CommissioningRampAsset>[] = [
    { key: 'name', label: 'Asset', sortable: true,
      render: (_v, row) => (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TECH_COLOURS[row.tech] }} />
          <span className="text-[var(--color-text)] font-medium">{row.name}</span>
        </span>
      ),
    },
    { key: 'state', label: 'State', sortable: true, align: 'left' },
    { key: 'capacity_mw', label: 'MW', sortable: true, format: 'integer', align: 'right' },
    { key: 'cod_declared', label: 'COD', sortable: true, render: (v) => fmtDate(v as string | null) },
    { key: 'first_generation_date', label: 'First gen', sortable: true, render: (v) => fmtDate(v as string) },
    { key: 'stable_output_date', label: 'Stable output', sortable: true, render: (v) => fmtDate(v as string | null), hideOnMobile: true },
    { key: 'ramp_days', label: 'Ramp days', sortable: true, format: 'integer', align: 'right' },
    {
      key: 'early_revenue_aud', label: 'Early revenue', sortable: true, align: 'right',
      render: (_v, row) => {
        const mix = row.early_revenue_basis_mix
        return (
          <span className="inline-flex items-center gap-1 justify-end">
            <span>{fmtMoney(row.early_revenue_aud)}</span>
            {mix && (
              <span
                title={`${(mix.settled * 100).toFixed(0)}% settled / ${(mix.modelled * 100).toFixed(0)}% modelled`}
                className="text-[10px] font-mono px-1 rounded bg-[var(--color-bg)] text-[var(--color-text-muted)]"
              >
                {mix.modelled > 0.5 ? 'mdl' : 'stl'}
              </span>
            )}
          </span>
        )
      },
    },
    { key: 'early_output_pct', label: 'Output %', sortable: true, align: 'right', render: (v) => fmtPct(v as number | null), hideOnMobile: true },
    {
      key: 'data_quality_flags', label: 'Flags', sortable: false,
      render: (v) => {
        const flags = v as DataQualityFlag[]
        if (!flags.length) return <span className="text-[var(--color-text-muted)] text-xs">—</span>
        return (
          <span className="inline-flex flex-wrap gap-1">
            {flags.map(f => (
              <span key={f} title={FLAG_LABELS[f]} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                {f}
              </span>
            ))}
          </span>
        )
      },
    },
  ]
  return (
    <DataTable
      rows={assets}
      columns={columns}
      onRowClick={onRowClick}
      defaultSort={{ key: 'first_generation_date', dir: 'desc' }}
      emptyMessage="No assets match the current filters."
      csvFilename="commissioning-ramp"
    />
  )
}

function AssetRampDetail({ asset }: { asset: CommissioningRampAsset }) {
  const monthly = asset.monthly_ramp
  const chartData = useMemo(() => {
    let cumE = 0
    return monthly.map((m: CommissioningRampMonth) => {
      cumE += m.energy_mwh ?? 0
      const cfTarget = asset.lifetime_cf_pct ?? 0
      const cfPctOfLifetime = cfTarget > 0 && m.cf_pct != null
        ? (100 * (m.cf_pct / cfTarget))
        : null
      return {
        ym: m.ym,
        cf_pct_of_lifetime: cfPctOfLifetime,
        revenue_settled: m.revenue_basis === 'settled' ? (m.revenue_aud ?? 0) : 0,
        revenue_modelled: m.revenue_basis === 'modelled' ? (m.revenue_aud ?? 0) : 0,
        cumulative_mwh: Math.round(cumE),
      }
    })
  }, [monthly, asset.lifetime_cf_pct])

  const settledTotal = monthly.filter(m => m.revenue_basis === 'settled').reduce((s, m) => s + (m.revenue_aud ?? 0), 0)
  const modelledTotal = monthly.filter(m => m.revenue_basis === 'modelled').reduce((s, m) => s + (m.revenue_aud ?? 0), 0)

  return (
    <div className="space-y-4">
      {/* Header facts */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Fact label="First generation" value={fmtDate(asset.first_generation_date)} />
        <Fact label="Stable output" value={fmtDate(asset.stable_output_date)} />
        <Fact label="Ramp duration" value={asset.ramp_days != null ? `${asset.ramp_days} days` : '—'} />
        <Fact label="COD declared" value={`${fmtDate(asset.cod_declared)} (${asset.cod_basis})`} />
        <Fact label="Lifetime CF" value={asset.lifetime_cf_pct != null ? `${asset.lifetime_cf_pct.toFixed(1)}% (${CF_BASIS_LABEL[asset.lifetime_cf_basis]})` : '—'} />
        <Fact label="Early output" value={asset.early_output_pct != null ? `${asset.early_output_pct.toFixed(1)}% of theoretical` : '—'} />
        <Fact label="Early revenue" value={fmtMoney(asset.early_revenue_aud)} />
        <Fact label="Early revenue per MW" value={fmtMoney(asset.early_revenue_per_mw) + '/MW'} />
      </div>

      {asset.data_quality_flags.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-1">
          <div className="text-xs font-semibold text-amber-300">Data quality flags</div>
          {asset.data_quality_flags.map(f => (
            <div key={f} className="text-[11px] text-amber-200">{FLAG_LABELS[f]}</div>
          ))}
        </div>
      )}

      {/* CF as % of lifetime + monthly revenue (composed chart) */}
      <div>
        <div className="text-sm font-medium text-[var(--color-text)] mb-1">Monthly ramp</div>
        <div className="text-[11px] text-[var(--color-text-muted)] mb-2">
          Bars: revenue (settled = green, modelled = orange). Line: monthly CF as % of asset's lifetime CF (100% = stable).
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="ym" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
            <YAxis yAxisId="rev" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={(v) => fmtMoney(v as number)} />
            <YAxis yAxisId="cf" orientation="right" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={(v) => `${Math.round(v as number)}%`} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              labelStyle={{ color: 'var(--color-text)' }}
              itemStyle={{ color: 'var(--color-text)' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar yAxisId="rev" dataKey="revenue_settled" name="Settled $" stackId="r" fill="#10b981" />
            <Bar yAxisId="rev" dataKey="revenue_modelled" name="Modelled $" stackId="r" fill="#f97316" />
            <Line yAxisId="cf" type="monotone" dataKey="cf_pct_of_lifetime" name="% of lifetime CF" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
          <div className="text-emerald-300 font-medium">Settled revenue</div>
          <div className="text-[var(--color-text)] font-mono">{fmtMoney(settledTotal)}</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-2">
          <div className="text-orange-300 font-medium">Modelled revenue</div>
          <div className="text-[var(--color-text)] font-mono">{fmtMoney(modelledTotal)}</div>
        </div>
      </div>

      <a
        href={`/projects/${asset.project_id}`}
        className="block text-center text-sm text-blue-400 hover:text-blue-300 underline"
      >
        Open full project &rarr;
      </a>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--color-bg)] rounded-lg p-2.5 border border-[var(--color-border)]">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      <div className="text-sm text-[var(--color-text)] font-medium mt-0.5">{value}</div>
    </div>
  )
}

// ============================================================
// Ramp Curves over time — individual asset trajectories
// aligned at "month 0 = first generation", plus optional
// group + fleet average overlays.
// ============================================================

type YMetric = 'cf_pct_of_lifetime' | 'cf_pct' | 'cumulative_pct'

const Y_METRIC_LABELS: Record<YMetric, string> = {
  cf_pct_of_lifetime: 'CF as % of asset lifetime CF',
  cf_pct: 'Monthly capacity factor (%)',
  cumulative_pct: 'Cumulative energy (% of ramp-window total)',
}

const MAX_INDIVIDUAL_LINES = 40
const MAX_MONTHS_X = 30

function RampCurvesChart({
  filteredAssets,
  allAssets,
  techFilter,
  onAssetClick,
}: {
  filteredAssets: CommissioningRampAsset[]
  allAssets: CommissioningRampAsset[]
  techFilter: TechFilter
  onAssetClick: (a: CommissioningRampAsset) => void
}) {
  const [yMetric, setYMetric] = useState<YMetric>('cf_pct_of_lifetime')
  const [showGroupAvg, setShowGroupAvg] = useState(true)
  const [showOverallAvg, setShowOverallAvg] = useState(true)
  const [showIndividual, setShowIndividual] = useState(true)
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null)

  const limitedAssets = useMemo(() => {
    if (filteredAssets.length <= MAX_INDIVIDUAL_LINES) return filteredAssets
    return [...filteredAssets]
      .sort((a, b) => b.first_generation_date.localeCompare(a.first_generation_date))
      .slice(0, MAX_INDIVIDUAL_LINES)
  }, [filteredAssets])

  const overallPool = useMemo(
    () => (techFilter === 'all' ? allAssets : allAssets.filter(a => a.tech === techFilter)),
    [allAssets, techFilter],
  )

  const computeSeries = (asset: CommissioningRampAsset): Array<{ idx: number; y: number | null }> => {
    let cum = 0
    const total = asset.monthly_ramp.reduce((s, m) => s + (m.energy_mwh ?? 0), 0)
    return asset.monthly_ramp.map((m, i) => {
      cum += m.energy_mwh ?? 0
      let y: number | null = null
      if (yMetric === 'cf_pct_of_lifetime') {
        y = (m.cf_pct != null && asset.lifetime_cf_pct && asset.lifetime_cf_pct > 0)
          ? (m.cf_pct / asset.lifetime_cf_pct) * 100
          : null
      } else if (yMetric === 'cf_pct') {
        y = m.cf_pct
      } else if (yMetric === 'cumulative_pct' && total > 0) {
        y = (cum / total) * 100
      }
      return { idx: i, y }
    })
  }

  const chartData = useMemo(() => {
    const rows: Array<Record<string, number | null>> = []
    for (let i = 0; i < MAX_MONTHS_X; i++) rows.push({ monthIdx: i })

    if (showIndividual) {
      for (const a of limitedAssets) {
        const series = computeSeries(a)
        for (const p of series) {
          if (p.idx < MAX_MONTHS_X) rows[p.idx][a.project_id] = p.y
        }
      }
    }
    const buildAverage = (pool: CommissioningRampAsset[], key: string) => {
      const buckets: number[][] = Array.from({ length: MAX_MONTHS_X }, () => [])
      for (const a of pool) {
        const series = computeSeries(a)
        for (const p of series) {
          if (p.idx < MAX_MONTHS_X && p.y != null && Number.isFinite(p.y)) buckets[p.idx].push(p.y)
        }
      }
      for (let i = 0; i < MAX_MONTHS_X; i++) {
        rows[i][key] = buckets[i].length >= 2
          ? buckets[i].reduce((s, v) => s + v, 0) / buckets[i].length
          : null
      }
    }
    if (showGroupAvg && filteredAssets.length > 0) buildAverage(filteredAssets, '__group_avg')
    if (showOverallAvg && overallPool.length > 0) buildAverage(overallPool, '__overall_avg')
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limitedAssets, filteredAssets, overallPool, yMetric, showGroupAvg, showOverallAvg, showIndividual])

  const groupAvgLabel = useMemo(() => {
    const parts: string[] = []
    if (techFilter !== 'all') parts.push(TECH_LABELS[techFilter])
    // Pull states + years from the filtered set for a readable label
    const states = Array.from(new Set(filteredAssets.map(a => a.state).filter(Boolean))) as string[]
    const years = Array.from(new Set(filteredAssets.map(a => a.commissioning_year).filter(Boolean))) as number[]
    if (states.length > 0 && states.length <= 3) parts.push(states.join('+'))
    if (years.length > 0 && years.length <= 4) parts.push(years.sort().join(','))
    return parts.length > 0 ? parts.join(' · ') : 'current filter'
  }, [filteredAssets, techFilter])

  const overallAvgLabel = techFilter === 'all'
    ? 'all assets'
    : `all ${TECH_LABELS[techFilter].toLowerCase()}`

  const yTickFormatter = (v: number) => yMetric === 'cf_pct' ? `${v.toFixed(0)}%` : `${Math.round(v)}%`

  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
      <div className="flex items-start justify-between gap-3 mb-1 flex-wrap">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Ramp curves over time</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Each thin line is one asset, aligned at month 0 = first AEMO generation.
            {filteredAssets.length > MAX_INDIVIDUAL_LINES && (
              <span className="ml-1 text-amber-300">Showing {MAX_INDIVIDUAL_LINES} most-recent of {filteredAssets.length}.</span>
            )}
          </p>
        </div>
        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-text-muted)]">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showIndividual} onChange={e => setShowIndividual(e.target.checked)} />
            Individual assets
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showGroupAvg} onChange={e => setShowGroupAvg(e.target.checked)} />
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-[2px] bg-amber-400" /> Group avg ({groupAvgLabel}, n={filteredAssets.length})
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showOverallAvg} onChange={e => setShowOverallAvg(e.target.checked)} />
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-[2px] border-t border-dashed border-slate-300" /> Fleet avg ({overallAvgLabel}, n={overallPool.length})
            </span>
          </label>
        </div>
      </div>

      {/* Y-metric toggle */}
      <div className="flex flex-wrap items-center gap-2 mt-2 mb-3">
        <span className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">Y-axis</span>
        {(Object.keys(Y_METRIC_LABELS) as YMetric[]).map(m => (
          <button key={m} onClick={() => setYMetric(m)}
            className={`px-2 py-0.5 rounded text-[11px] border ${
              yMetric === m
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-transparent text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-blue-500/30'
            }`}>
            {Y_METRIC_LABELS[m]}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis
            dataKey="monthIdx"
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            label={{ value: 'Months since first generation', position: 'insideBottom', offset: -2, fill: 'var(--color-text-muted)', fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            tickFormatter={yTickFormatter}
            domain={yMetric === 'cf_pct' ? [0, 'auto'] : [0, 120]}
          />
          {yMetric === 'cf_pct_of_lifetime' && (
            // Visual reference: 100% = stable
            <Line dataKey={() => 100} stroke="#475569" strokeDasharray="4 4" dot={false} legendType="none" name="" isAnimationActive={false} />
          )}
          <Tooltip
            content={(props) => (
              <RampTooltip
                props={props}
                groupAvgLabel={groupAvgLabel}
                overallAvgLabel={overallAvgLabel}
                limitedAssets={limitedAssets}
              />
            )}
          />

          {showIndividual && limitedAssets.map(a => (
            <Line
              key={a.project_id}
              dataKey={a.project_id}
              stroke={TECH_COLOURS[a.tech]}
              strokeOpacity={hoveredAsset === a.project_id ? 1 : 0.25}
              strokeWidth={hoveredAsset === a.project_id ? 2 : 1}
              dot={false}
              activeDot={{ r: 4, onClick: () => onAssetClick(a) }}
              connectNulls
              isAnimationActive={false}
              onMouseEnter={() => setHoveredAsset(a.project_id)}
              onMouseLeave={() => setHoveredAsset(null)}
            />
          ))}
          {showGroupAvg && (
            <Line dataKey="__group_avg" stroke="#fbbf24" strokeWidth={3} dot={{ r: 3, fill: '#fbbf24' }} connectNulls isAnimationActive={false} name="__group_avg" />
          )}
          {showOverallAvg && (
            <Line dataKey="__overall_avg" stroke="#e2e8f0" strokeWidth={2.5} strokeDasharray="6 4" dot={false} connectNulls isAnimationActive={false} name="__overall_avg" />
          )}
        </LineChart>
      </ResponsiveContainer>

      <p className="text-[11px] text-[var(--color-text-muted)] mt-2 italic">
        Y-axis: {Y_METRIC_LABELS[yMetric]}. {yMetric === 'cf_pct_of_lifetime' && '100% (dashed grey) = asset has reached its own steady-state CF.'}
        {' '}Click a point on an asset line to open its detail panel.
      </p>
    </div>
  )
}

interface TooltipPayloadItem {
  dataKey?: string | number
  value?: number | string
}

function RampTooltip({
  props,
  groupAvgLabel,
  overallAvgLabel,
  limitedAssets,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: any
  groupAvgLabel: string
  overallAvgLabel: string
  limitedAssets: CommissioningRampAsset[]
}) {
  if (!props.active || !props.payload || props.payload.length === 0) return null
  const payload = props.payload as TooltipPayloadItem[]
  const items = payload.filter(p => p.value != null && Number.isFinite(Number(p.value)))
  if (items.length === 0) return null

  const groupAvg = items.find(p => p.dataKey === '__group_avg')
  const overallAvg = items.find(p => p.dataKey === '__overall_avg')
  const assetItems = items.filter(p => p.dataKey !== '__group_avg' && p.dataKey !== '__overall_avg')
  // Top 5 by absolute y value
  const topAssets = assetItems
    .map(p => ({ id: String(p.dataKey), value: Number(p.value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  return (
    <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-2.5 text-xs shadow-xl min-w-[220px]">
      <div className="text-[var(--color-text)] font-semibold mb-1">Month {props.label}</div>
      {groupAvg && (
        <div className="flex justify-between gap-2 mb-0.5">
          <span className="text-amber-300">Group avg ({groupAvgLabel})</span>
          <span className="font-mono text-[var(--color-text)]">{Number(groupAvg.value).toFixed(0)}%</span>
        </div>
      )}
      {overallAvg && (
        <div className="flex justify-between gap-2 mb-0.5">
          <span className="text-slate-300">Fleet avg ({overallAvgLabel})</span>
          <span className="font-mono text-[var(--color-text)]">{Number(overallAvg.value).toFixed(0)}%</span>
        </div>
      )}
      {topAssets.length > 0 && (
        <>
          {(groupAvg || overallAvg) && <div className="my-1 border-t border-[var(--color-border)]" />}
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5">
            Top {topAssets.length} of {assetItems.length} assets
          </div>
          {topAssets.map(a => {
            const asset = limitedAssets.find(x => x.project_id === a.id)
            return (
              <div key={a.id} className="flex justify-between gap-2">
                <span className="truncate" style={{ color: TECH_COLOURS[asset?.tech ?? 'solar'] }}>
                  {asset?.name ?? a.id}
                </span>
                <span className="font-mono text-[var(--color-text)] shrink-0">{a.value.toFixed(0)}%</span>
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}
