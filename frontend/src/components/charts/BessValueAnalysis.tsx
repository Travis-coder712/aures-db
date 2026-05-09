// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TF = (v: any, n: any) => [string, string]
import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell,
} from 'recharts'
import { useBessValueProject } from '../../hooks/useBessValue'

// ============================================================
// Constants
// ============================================================

const BAND_COLORS: Record<string, string> = {
  'negative': '#ef4444',
  '$0-50':    '#f59e0b',
  '$50-100':  '#84cc16',
  '$100-300': '#22c55e',
  '$300-1000':'#3b82f6',
  '$1000+':   '#8b5cf6',
}
const YEAR_COLORS: Record<number, string> = {
  2021: '#ec4899', 2022: '#f43f5e', 2023: '#f59e0b',
  2024: '#22c55e', 2025: '#3b82f6', 2026: '#06b6d4',
}
const tooltipStyle = {
  backgroundColor: '#111827', border: '1px solid #374151',
  borderRadius: '8px', fontSize: '11px', color: '#f1f5f9',
}
const tooltipLabelStyle = { color: '#94a3b8', marginBottom: 2, fontSize: 10 }

type TabId = 'valuation' | 'spread' | 'bands' | 'annual' | 'peers'

// ============================================================
// Shared helpers
// ============================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
      {children}
    </p>
  )
}

function MetricCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string
  highlight?: 'green' | 'yellow' | 'red' | 'blue' | 'purple'
}) {
  const colorMap = {
    green: '#22c55e', yellow: '#f59e0b', red: '#ef4444', blue: '#3b82f6', purple: '#8b5cf6',
  }
  const color = highlight ? colorMap[highlight] : 'var(--color-text)'
  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-xl p-3 text-center">
      <p className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-base font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
    </div>
  )
}

function GradeChip({ grade, score }: { grade?: string; score?: number }) {
  if (!grade) return null
  const color = grade.startsWith('A') ? '#22c55e' : grade.startsWith('B') ? '#3b82f6'
    : grade.startsWith('C') ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-[var(--color-text-muted)]">Value rating</span>
      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}20`, color }}>
        {grade}
      </span>
      {score !== undefined && (
        <span className="text-[10px] text-[var(--color-text-muted)]">{score.toFixed(1)}/5.0</span>
      )}
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null
  const cfg: Record<string, { label: string; color: string }> = {
    high:   { label: 'High confidence',   color: '#22c55e' },
    medium: { label: 'Medium confidence', color: '#f59e0b' },
    low:    { label: 'Low confidence',    color: '#ef4444' },
  }
  const c = cfg[confidence] ?? cfg.low
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold border"
      style={{ borderColor: `${c.color}40`, backgroundColor: `${c.color}15`, color: c.color }}>
      {c.label}
    </span>
  )
}

// ============================================================
// Main component
// ============================================================

interface Props { projectId: string }

export default function BessValueAnalysis({ projectId }: Props) {
  const { project, stateAvg, allStateProjects, loading } = useBessValueProject(projectId)
  const [activeTab, setActiveTab] = useState<TabId>('valuation')

  if (loading) {
    return (
      <div className="space-y-3 mt-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }
  if (!project) {
    return (
      <div className="mt-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">BESS value data not yet available for this project.</p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Run: python3 pipeline/importers/export_bess_value.py</p>
      </div>
    )
  }

  const tabs: { key: TabId; label: string }[] = [
    { key: 'valuation', label: '⚡ Valuation' },
    { key: 'spread',    label: '📈 Spread' },
    { key: 'bands',     label: '📊 Dispatch' },
    { key: 'annual',    label: '📅 Annual' },
    { key: 'peers',     label: '🏆 Peers' },
  ]

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
          <span>🔋</span> BESS Value Analysis
        </h3>
        <div className="flex items-center gap-2">
          <ConfidenceBadge confidence={project.value_summary?.data_confidence} />
          <GradeChip grade={project.pros_cons?.grade} score={project.pros_cons?.score} />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 bg-[var(--color-bg-card)] rounded-lg p-0.5 border border-[var(--color-border)] overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex-none px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
              activeTab === t.key
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'valuation' && <ValuationTab project={project} stateAvg={stateAvg} />}
      {activeTab === 'spread'    && <SpreadTab project={project} />}
      {activeTab === 'bands'     && <BandsTab project={project} />}
      {activeTab === 'annual'    && <AnnualTab project={project} />}
      {activeTab === 'peers'     && <PeersTab project={project} allStateProjects={allStateProjects} />}
    </div>
  )
}

// ============================================================
// Valuation tab
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ValuationTab({ project, stateAvg }: { project: any; stateAvg: any }) {
  const vs = project.value_summary ?? {}
  const pc = project.pros_cons
  const sr = project.state_rank

  const spreadHighlight = (spread: number | null) => {
    if (spread == null) return undefined
    return spread >= 200 ? 'green' : spread >= 100 ? 'yellow' : 'red' as const
  }

  const dimensions = [
    {
      icon: '💱',
      title: 'Price Spread',
      explain: `The core BESS profit driver: average discharge (sell) price minus average charge (buy) price. A spread of $100/MWh means the battery earns $100 for every MWh of stored energy cycled. Higher spread = more valuable arbitrage opportunity.`,
      value: vs.avg_spread != null ? `$${vs.avg_spread.toFixed(0)}/MWh` : '–',
      bench: stateAvg?.median_spread != null ? `$${stateAvg.median_spread.toFixed(0)} state median` : null,
      signal: vs.avg_spread != null ? (vs.avg_spread >= 200 ? 'good' : vs.avg_spread >= 100 ? 'ok' : 'warn') : 'neutral',
    },
    {
      icon: '📈',
      title: 'Spread Trend',
      explain: `Whether the arbitrage spread is widening (improving) or compressing (declining). As more batteries enter the market, they reduce the price spikes that BESS profits from. Declining trends indicate increasing competition from storage.`,
      value: vs.spread_trend ? vs.spread_trend.charAt(0).toUpperCase() + vs.spread_trend.slice(1) : '–',
      bench: null,
      signal: vs.spread_trend === 'improving' ? 'good' : vs.spread_trend === 'declining' ? 'warn' : 'ok',
    },
    {
      icon: '⚡',
      title: 'Utilisation',
      explain: `Percentage of time the battery was actively discharging energy to the grid. Higher utilisation means more cycles and more revenue opportunities captured. Low utilisation may indicate FCAS-focused operation or dispatch limitations.`,
      value: vs.avg_utilisation_pct != null ? `${vs.avg_utilisation_pct.toFixed(1)}%` : '–',
      bench: stateAvg?.median_utilisation_pct != null ? `${stateAvg.median_utilisation_pct.toFixed(1)}% state median` : null,
      signal: sr?.utilisation_percentile != null
        ? (sr.utilisation_percentile >= 60 ? 'good' : sr.utilisation_percentile >= 35 ? 'ok' : 'warn') : 'neutral',
    },
    {
      icon: '🔄',
      title: 'Annual Cycles',
      explain: `Full charge-discharge cycles per year. One cycle = fully depleting the battery's storage capacity once. More cycles = more revenue. Note: cycles may appear low if the battery operates in FCAS reserve mode (charging/discharging frequently but in small amounts).`,
      value: vs.avg_cycles_per_year != null ? `${vs.avg_cycles_per_year.toFixed(0)} cycles/yr` : '–',
      bench: null,
      signal: vs.avg_cycles_per_year != null
        ? (vs.avg_cycles_per_year >= 200 ? 'good' : vs.avg_cycles_per_year >= 50 ? 'ok' : 'warn') : 'neutral',
    },
    {
      icon: '💰',
      title: 'Revenue per MW',
      explain: `Annualised market revenue per MW of discharge capacity. Combines both frequency of use (cycles) and spread quality. Comparable across batteries of different sizes. FCAS revenue is not included here — actual revenue may be higher.`,
      value: vs.avg_revenue_per_mw != null ? `$${(vs.avg_revenue_per_mw / 1000).toFixed(0)}k/MW/yr` : '–',
      bench: stateAvg?.median_revenue_per_mw != null ? `$${(stateAvg.median_revenue_per_mw / 1000).toFixed(0)}k state median` : null,
      signal: sr?.revenue_per_mw_rank != null && sr?.revenue_per_mw_total != null
        ? (sr.revenue_per_mw_rank / sr.revenue_per_mw_total < 0.4 ? 'good' : sr.revenue_per_mw_rank / sr.revenue_per_mw_total < 0.7 ? 'ok' : 'warn')
        : 'neutral',
    },
  ]

  const signalDot = (s: string) => ({
    good: '🟢', ok: '🟡', warn: '🔴', neutral: '⚪',
  }[s] ?? '⚪')

  return (
    <div className="space-y-5">
      {/* Headline metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label="Avg Spread"
          value={vs.avg_spread != null ? `$${vs.avg_spread.toFixed(0)}` : '–'}
          sub={stateAvg?.median_spread != null ? `$${stateAvg.median_spread.toFixed(0)} state` : undefined}
          highlight={spreadHighlight(vs.avg_spread)}
        />
        <MetricCard
          label="Utilisation"
          value={vs.avg_utilisation_pct != null ? `${vs.avg_utilisation_pct.toFixed(1)}%` : '–'}
          sub="time discharging"
          highlight="blue"
        />
        <MetricCard
          label="Rev/MW"
          value={vs.avg_revenue_per_mw != null ? `$${(vs.avg_revenue_per_mw / 1000).toFixed(0)}k` : '–'}
          sub="energy revenue only"
          highlight="purple"
        />
      </div>

      {/* BESS value framework */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
        <p className="text-[11px] font-semibold text-blue-400 mb-1">🔋 How BESS Creates Value</p>
        <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
          A battery earns by buying cheap energy (charging when prices are low or negative) and
          selling it at high prices (discharging during demand peaks or constraint events).
          The <strong className="text-[var(--color-text)]">spread</strong> measures this arbitrage margin.
          Revenue is also earned through <strong className="text-[var(--color-text)]">FCAS</strong> (frequency
          regulation) services — which can exceed energy arbitrage revenue for well-positioned batteries —
          though FCAS revenue is not captured in this analysis. Data shown here is wholesale energy market only.
        </p>
      </div>

      {/* Value dimensions */}
      <div>
        <SectionTitle>Value drivers</SectionTitle>
        <div className="space-y-2">
          {dimensions.map(d => (
            <div key={d.title} className="bg-[var(--color-bg-elevated)] rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[var(--color-text)]">
                  {d.icon} {d.title}
                </span>
                <div className="flex items-center gap-2">
                  {d.bench && (
                    <span className="text-[9px] text-[var(--color-text-muted)]">{d.bench}</span>
                  )}
                  <span className="text-xs font-bold text-[var(--color-text)]">{d.value}</span>
                  <span className="text-xs">{signalDot(d.signal)}</span>
                </div>
              </div>
              <p className="text-[9px] text-[var(--color-text-muted)] leading-relaxed">{d.explain}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pros / Cons */}
      {pc && (pc.pros.length > 0 || pc.cons.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {pc.pros.length > 0 && (
            <div className="bg-[var(--color-bg-card)] border border-green-500/20 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-2">
                ✅ Value Strengths
              </p>
              <ul className="space-y-1.5">
                {pc.pros.map((p: string, i: number) => (
                  <li key={i} className="text-[11px] text-[var(--color-text)] leading-relaxed flex gap-2">
                    <span className="text-green-400 shrink-0">+</span><span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pc.cons.length > 0 && (
            <div className="bg-[var(--color-bg-card)] border border-red-500/20 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-2">
                ⚠️ Value Risks
              </p>
              <ul className="space-y-1.5">
                {pc.cons.map((c: string, i: number) => (
                  <li key={i} className="text-[11px] text-[var(--color-text)] leading-relaxed flex gap-2">
                    <span className="text-red-400 shrink-0">−</span><span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-[9px] text-[var(--color-text-muted)] italic">
        ⚠️ Note: FCAS (frequency control ancillary services) revenue is not included in this analysis.
        For many batteries, FCAS contributes significantly to total revenue and may substantially exceed the energy arbitrage figures shown here.
      </p>
    </div>
  )
}

// ============================================================
// Spread tab — monthly spread, discharge and charge prices
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SpreadTab({ project }: { project: any }) {
  const monthlyData = useMemo(() => {
    const raw = project.monthly_data ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((m: any) => ({
      period: `${m.year}-${String(m.month).padStart(2, '0')}`,
      label: `${m.month}/${String(m.year).slice(2)}`,
      discharge: m.avg_discharge_price ?? null,
      charge: m.avg_charge_price ?? null,
      spread: m.spread ?? null,
      pool: m.pool_price ?? null,
    })).filter((m: { spread: number | null }) => m.spread != null)
  }, [project])

  if (monthlyData.length === 0) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4">No monthly spread data available.</p>
  }

  // Show only last 24 months to keep chart readable
  const displayData = monthlyData.slice(-24)

  return (
    <div className="space-y-5">
      {/* Spread over time */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Monthly Price Spread</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Discharge price − charge price per month. Positive = earning. Negative = charging cost exceeded revenue in that month (often due to FCAS strategy or low-cycle months with atypical pricing).
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={displayData} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 8 }}
              interval={Math.floor(displayData.length / 6)} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={((v: number, n: string) => [`$${v?.toFixed(0)}/MWh`, n]) as TF} />
            <Legend wrapperStyle={{ fontSize: 9 }}
              formatter={(v: string) => v === 'discharge' ? 'Discharge price' : v === 'charge' ? 'Charge price' : 'Spread'} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Line type="monotone" dataKey="discharge" stroke="#22c55e" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="charge" stroke="#ef4444" strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="spread" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 2, fill: '#3b82f6' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pool price reference */}
      {displayData.some((d: { pool: number | null }) => d.pool != null) && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Discharge vs Pool Price</p>
          <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
            How the battery's discharge price compares to the regional pool average. A battery discharging above pool price is capturing high-value events — spikes, constraints, evening ramps.
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={displayData} margin={{ top: 4, right: 16, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 8 }}
                interval={Math.floor(displayData.length / 6)} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
                formatter={((v: number, n: string) => [`$${v?.toFixed(0)}/MWh`, n === 'discharge' ? 'Discharge price' : 'Pool price']) as TF} />
              <Legend wrapperStyle={{ fontSize: 9 }}
                formatter={(v: string) => v === 'discharge' ? 'Discharge price' : 'Pool avg'} />
              <Line type="monotone" dataKey="pool" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              <Line type="monotone" dataKey="discharge" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Bands tab — GEN vs LOAD dispatch by price band
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BandsTab({ project }: { project: any }) {
  const bandData = useMemo(() => {
    const bbd = project.bess_band_data
    if (!bbd?.monthly) return null

    const BAND_ORDER = ['negative', '$0-50', '$50-100', '$100-300', '$300-1000', '$1000+']
    const totals: Record<string, { gen: number; load: number }> = {}
    for (const label of BAND_ORDER) totals[label] = { gen: 0, load: 0 }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const monthData of Object.values(bbd.monthly) as any[]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const band of (monthData.GEN ?? []) as any[]) {
        if (totals[band.label]) totals[band.label].gen += band.energy_mwh ?? 0
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const band of (monthData.LOAD ?? []) as any[]) {
        if (totals[band.label]) totals[band.label].load += band.energy_mwh ?? 0
      }
    }

    const totalGen = BAND_ORDER.reduce((s, l) => s + totals[l].gen, 0)
    const totalLoad = BAND_ORDER.reduce((s, l) => s + totals[l].load, 0)

    return BAND_ORDER.map(label => ({
      label,
      gen_pct: totalGen > 0 ? Math.round(totals[label].gen / totalGen * 1000) / 10 : 0,
      load_pct: totalLoad > 0 ? Math.round(totals[label].load / totalLoad * 1000) / 10 : 0,
      fill: BAND_COLORS[label] ?? '#6b7280',
    }))
  }, [project])

  if (!bandData) {
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-6 text-center mt-2">
        <p className="text-xs text-[var(--color-text-muted)]">5-minute dispatch band data not yet available for this battery.</p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
          Run: python3 pipeline/importers/import_bess_band_capture.py --all-cached
        </p>
      </div>
    )
  }

  // Score: ideal BESS dispatches at high price bands and charges at low/negative bands
  const genHighPct = (bandData.find(d => d.label === '$100-300')?.gen_pct ?? 0)
    + (bandData.find(d => d.label === '$300-1000')?.gen_pct ?? 0)
    + (bandData.find(d => d.label === '$1000+')?.gen_pct ?? 0)
  const loadLowPct = (bandData.find(d => d.label === 'negative')?.load_pct ?? 0)
    + (bandData.find(d => d.label === '$0-50')?.load_pct ?? 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Discharge (GEN) by price band */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-green-400 mb-0.5">⬆ Discharge (GEN) by Price Band</p>
          <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
            Where the battery sells energy. More in high-price bands = better arbitrage.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bandData} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => `${v}%`} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#9ca3af', fontSize: 8 }} width={56} />
              <Tooltip contentStyle={tooltipStyle}
                formatter={((v: number) => [`${v?.toFixed(1)}%`, 'Discharge %']) as TF} />
              <Bar dataKey="gen_pct" radius={[0, 3, 3, 0]}>
                {bandData.map(d => <Cell key={d.label} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Charge (LOAD) by price band */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-[11px] font-semibold text-red-400 mb-0.5">⬇ Charge (LOAD) by Price Band</p>
          <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
            Where the battery buys energy. More in low/negative bands = smarter charging.
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bandData} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => `${v}%`} />
              <YAxis type="category" dataKey="label" tick={{ fill: '#9ca3af', fontSize: 8 }} width={56} />
              <Tooltip contentStyle={tooltipStyle}
                formatter={((v: number) => [`${v?.toFixed(1)}%`, 'Charge %']) as TF} />
              <Bar dataKey="load_pct" radius={[0, 3, 3, 0]}>
                {bandData.map(d => <Cell key={d.label} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary insight */}
      <div className={`border rounded-xl p-3 ${genHighPct >= 30 && loadLowPct >= 30 ? 'bg-green-500/10 border-green-500/30' : 'bg-[var(--color-bg-card)] border-[var(--color-border)]'}`}>
        <p className="text-[10px] font-semibold text-[var(--color-text)] mb-1">Dispatch quality</p>
        <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
          {genHighPct.toFixed(1)}% of discharge is at prices above $100/MWh.{' '}
          {loadLowPct.toFixed(1)}% of charging is at prices below $50/MWh or negative.{' '}
          {genHighPct >= 30 && loadLowPct >= 30
            ? 'This battery is effectively capturing high-price discharge and low-price charge opportunities.'
            : genHighPct < 20
            ? 'Relatively low proportion of high-price dispatch — the battery may be missing price spikes or operating primarily in FCAS mode.'
            : 'Moderate dispatch profile.'}
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Annual tab — cycles, utilisation, revenue by year
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AnnualTab({ project }: { project: any }) {
  const annualData = useMemo(() => {
    const raw = project.annual_data ?? []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((a: any) => ({
      year: String(a.year),
      spread: a.spread ?? null,
      cycles: a.cycles ?? null,
      utilisation: a.utilisation_pct ?? null,
      revMw: a.revenue_per_mw != null ? Math.round(a.revenue_per_mw / 1000) : null,
    })).filter((a: { spread: number | null; cycles: number | null }) => a.spread != null || a.cycles != null)
  }, [project])

  if (annualData.length === 0) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4">No annual data available.</p>
  }

  return (
    <div className="space-y-5">
      {/* Annual spread */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Annual Average Spread</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Average discharge minus charge price per year. Shows whether arbitrage margins are widening or compressing as more storage enters.
        </p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={annualData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={((v: number) => [`$${v?.toFixed(0)}/MWh`, 'Spread']) as TF} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" />
            <Bar dataKey="spread" radius={[3, 3, 0, 0]}>
              {annualData.map((d: { year: string; spread: number | null; [k: string]: unknown }) => (
                <Cell key={d.year}
                  fill={(d.spread ?? 0) >= 0 ? (YEAR_COLORS[Number(d.year)] ?? '#22c55e') : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Annual cycles + revenue */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Annual Cycles &amp; Revenue/MW</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Full cycles per year (bars) and revenue per MW in $k (line). Growing cycles indicate the battery is being dispatched more actively as it ramps up operations.
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={annualData} margin={{ top: 4, right: 48, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <YAxis yAxisId="left" tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#9ca3af', fontSize: 9 }}
              tickFormatter={(v: number) => `$${v}k`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={((v: number, n: string) => [
                n === 'cycles' ? `${v?.toFixed(0)} cycles` : `$${v?.toFixed(0)}k/MW`, n,
              ]) as TF} />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Bar yAxisId="left" dataKey="cycles" name="cycles" fill="#3b82f6" radius={[3, 3, 0, 0]} opacity={0.8} />
            <Line yAxisId="right" type="monotone" dataKey="revMw" name="Rev/MW ($k)"
              stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================
// Peers tab — state comparison
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PeersTab({ project, allStateProjects }: { project: any; allStateProjects: any[] }) {
  const peers = useMemo(() => {
    return allStateProjects
      .map(p => ({
        name: p.name as string,
        id: p.id as string,
        spread: p.value_summary?.avg_spread as number | null,
        util: p.value_summary?.avg_utilisation_pct as number | null,
        revMw: p.value_summary?.avg_revenue_per_mw as number | null,
        isSelf: p.id === project.id,
      }))
      .filter(p => p.spread != null)
      .sort((a, b) => (b.spread ?? 0) - (a.spread ?? 0))
  }, [allStateProjects, project.id])

  if (peers.length <= 1) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4">Not enough peer data available.</p>
  }

  return (
    <div className="space-y-4">
      {/* Spread by peer */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">
          Average Spread — {project.state} Peers
        </p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Average discharge − charge price. Higher spread = more valuable arbitrage. Note: FCAS revenue not included.
        </p>
        <ResponsiveContainer width="100%" height={Math.max(120, peers.length * 24)}>
          <BarChart data={peers} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 9 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 8 }} width={130}
              tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 18) + '…' : v} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={((v: number) => [`$${v?.toFixed(0)}/MWh`, 'Avg Spread']) as TF} />
            <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" />
            <Bar dataKey="spread" radius={[0, 3, 3, 0]}>
              {peers.map(p => (
                <Cell key={p.id} fill={p.isSelf ? '#f59e0b' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-2 text-[9px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#f59e0b] inline-block" /> This project</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#3b82f6] inline-block" /> State peers</span>
        </div>
      </div>
    </div>
  )
}
