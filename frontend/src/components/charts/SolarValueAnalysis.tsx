// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TF = (v: any, n: any) => [string, string]
import { useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ScatterChart, Scatter, Cell,
} from 'recharts'
import { useSolarValueProject } from '../../hooks/useSolarValue'

// ============================================================
// Constants
// ============================================================

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
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

type TabId = 'valuation' | 'monthly' | 'trend' | 'bands' | 'peers'

// ============================================================
// Shared small helpers
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
  highlight?: 'green' | 'yellow' | 'red' | 'blue'
}) {
  const colorMap = { green: '#22c55e', yellow: '#f59e0b', red: '#ef4444', blue: '#3b82f6' }
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

export default function SolarValueAnalysis({ projectId }: Props) {
  const { project, stateAvg, allStateProjects, poolPrices, loading } = useSolarValueProject(projectId)
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
        <p className="text-sm text-[var(--color-text-muted)]">Solar value data not yet available for this project.</p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Run: python3 pipeline/importers/export_solar_value.py</p>
      </div>
    )
  }

  const tabs: { key: TabId; label: string }[] = [
    { key: 'valuation', label: '☀️ Valuation' },
    { key: 'monthly',   label: '📆 Monthly' },
    { key: 'trend',     label: '📈 Trend' },
    { key: 'bands',     label: '📊 Price Bands' },
    { key: 'peers',     label: '🏆 Peers' },
  ]

  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
          <span>☀️</span> Solar Value Analysis
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
      {activeTab === 'monthly'   && <MonthlyTab project={project} />}
      {activeTab === 'trend'     && <TrendTab project={project} poolPrices={poolPrices} />}
      {activeTab === 'bands'     && <BandsTab project={project} />}
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

  const vfHighlight = (vf: number | null) => {
    if (vf == null) return undefined
    return vf >= 0.90 ? 'green' : vf >= 0.75 ? 'yellow' : 'red' as const
  }

  const dimensions = [
    {
      icon: '⚡',
      title: 'Capacity Factor',
      explain: `How much electricity the farm produces vs its rated capacity. Solar CF is typically 18–28%. Higher is better — determined by irradiance, latitude, tracking, and local weather. ${project.name}'s current average is ${vs.avg_cf_pct?.toFixed(1) ?? '—'}%.`,
      value: vs.avg_cf_pct != null ? `${vs.avg_cf_pct.toFixed(1)}%` : '–',
      bench: stateAvg?.avg_cf_pct != null ? `${stateAvg.avg_cf_pct.toFixed(1)}% state avg` : null,
      signal: sr?.cf_percentile != null ? (sr.cf_percentile >= 60 ? 'good' : sr.cf_percentile >= 35 ? 'ok' : 'warn') : 'neutral',
    },
    {
      icon: '📊',
      title: 'Value Factor (Cannibalisation)',
      explain: `The key solar-specific metric. All solar farms generate heavily around midday, competing at the same time and driving spot prices down. Value factor = capture price ÷ pool average. A value of 0.60 means the farm earns 60% of the pool average — the 40% discount is the cannibalisation penalty. This discount grows as more solar enters the region.`,
      value: vs.avg_value_factor != null ? vs.avg_value_factor.toFixed(3) : '–',
      bench: stateAvg?.avg_value_factor != null ? `${stateAvg.avg_value_factor.toFixed(3)} state avg` : null,
      signal: vs.avg_value_factor != null ? (vs.avg_value_factor >= 0.80 ? 'good' : vs.avg_value_factor >= 0.65 ? 'ok' : 'warn') : 'neutral',
    },
    {
      icon: '💵',
      title: 'Capture Price',
      explain: `The average $/MWh received when generating, weighted by output volume. Solar's midday generation profile means it typically receives below-average prices. Best months are autumn/spring when solar output is still reasonable but fewer competitors are at peak.`,
      value: vs.avg_capture_price != null ? `$${vs.avg_capture_price.toFixed(0)}/MWh` : '–',
      bench: stateAvg?.avg_capture_price != null ? `$${stateAvg.avg_capture_price.toFixed(0)}/MWh state avg` : null,
      signal: sr?.capture_price_percentile != null ? (sr.capture_price_percentile >= 60 ? 'good' : sr.capture_price_percentile >= 35 ? 'ok' : 'warn') : 'neutral',
    },
    {
      icon: '📉',
      title: 'Value Factor Trend',
      explain: `Whether cannibalisation is worsening (declining VF) or improving. As more solar enters the market, VF typically declines. An improving trend may reflect strategic curtailment, storage co-location, or favourable regional dynamics.`,
      value: vs.value_factor_trend ? vs.value_factor_trend.charAt(0).toUpperCase() + vs.value_factor_trend.slice(1) : '–',
      bench: null,
      signal: vs.value_factor_trend === 'improving' ? 'good' : vs.value_factor_trend === 'declining' ? 'warn' : 'ok',
    },
    {
      icon: '📅',
      title: 'Best vs Worst Capture Month',
      explain: `The month with the highest and lowest average capture price. Solar projects in the NEM typically earn most in autumn and winter (May–Aug) when solar penetration is lower and prices are firmer. Summer midday prices can turn negative.`,
      value: vs.best_capture_month && vs.worst_capture_month ? `${vs.best_capture_month} best / ${vs.worst_capture_month} worst` : '–',
      bench: null,
      signal: 'neutral' as const,
    },
    {
      icon: '💰',
      title: 'Revenue per MW',
      explain: `Total annual market revenue divided by nameplate capacity. Combines both output volume and price quality. The cannibalisation penalty reduces this significantly for solar farms in high-penetration markets.`,
      value: vs.avg_revenue_per_mw != null ? `$${(vs.avg_revenue_per_mw / 1000).toFixed(0)}k/MW/yr` : '–',
      bench: stateAvg?.avg_revenue_per_mw != null ? `$${(stateAvg.avg_revenue_per_mw / 1000).toFixed(0)}k state avg` : null,
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
          label="Avg CF"
          value={vs.avg_cf_pct != null ? `${vs.avg_cf_pct.toFixed(1)}%` : '–'}
          sub={stateAvg?.avg_cf_pct != null ? `${stateAvg.avg_cf_pct.toFixed(1)}% state` : undefined}
          highlight={sr?.cf_percentile >= 60 ? 'green' : sr?.cf_percentile >= 35 ? 'yellow' : 'red'}
        />
        <MetricCard
          label="Value Factor"
          value={vs.avg_value_factor != null ? vs.avg_value_factor.toFixed(3) : '–'}
          sub={vs.avg_value_factor != null
            ? (vs.avg_value_factor >= 0.80 ? 'low cannibalisation' : vs.avg_value_factor >= 0.65 ? 'moderate' : 'high cannibalisation')
            : undefined}
          highlight={vfHighlight(vs.avg_value_factor)}
        />
        <MetricCard
          label="Rev/MW"
          value={vs.avg_revenue_per_mw != null ? `$${(vs.avg_revenue_per_mw / 1000).toFixed(0)}k` : '–'}
          sub={stateAvg?.avg_revenue_per_mw != null ? `$${(stateAvg.avg_revenue_per_mw / 1000).toFixed(0)}k state` : undefined}
          highlight="blue"
        />
      </div>

      {/* Cannibalisation explainer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
        <p className="text-[11px] font-semibold text-amber-400 mb-1">☀️ The Solar Cannibalisation Problem</p>
        <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
          Solar farms generate most energy around midday — and so does every other solar farm in the region.
          This collective peak floods the market at the same time, pushing the spot price down exactly when
          solar farms need it to be high. The <strong className="text-[var(--color-text)]">value factor</strong> measures
          how much this costs: {vs.avg_value_factor != null
            ? `${project.name} earns ${vs.avg_value_factor.toFixed(0)}/1.0 of the pool average — a ${((1 - vs.avg_value_factor) * 100).toFixed(0)}% cannibalisation discount.`
            : 'a value below 1.0 means earning less than the pool average.'
          } As more solar enters the NEM, this discount grows.
        </p>
      </div>

      {/* Valuation dimensions */}
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
    </div>
  )
}

// ============================================================
// Monthly tab — CF% and Value Factor by calendar month
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthlyTab({ project }: { project: any }) {
  const ma = project.monthly_averages ?? {}
  const cfData = MONTH_LABELS.map((label, i) => {
    const entry = ma[String(i + 1)]
    return { month: label, cf: entry?.avg_cf_pct ?? null, vf: entry?.avg_value_factor ?? null }
  }).filter(d => d.cf != null || d.vf != null)

  if (cfData.length === 0) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4">No monthly average data available.</p>
  }

  return (
    <div className="space-y-5">
      {/* CF by month */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Capacity Factor by Month</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Average CF% for each calendar month across all years of operation. Summer months peak, but value factor is often worst then.
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={cfData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={((v: number) => [`${v?.toFixed(1)}%`, 'Avg CF']) as TF} />
            <Bar dataKey="cf" fill="#f59e0b" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Value Factor by month */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Value Factor by Month</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Capture price ÷ pool average by calendar month. Lower in summer (more solar competing at midday); higher in winter/autumn when cannibalisation is weaker.
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={cfData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <YAxis domain={[0, 1.2]} tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => v.toFixed(2)} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={((v: number) => [v?.toFixed(3) ?? '—', 'Value Factor']) as TF} />
            <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 2" label={{ value: 'Pool parity', fill: '#6b7280', fontSize: 9 }} />
            <Line type="monotone" dataKey="vf" stroke="#8b5cf6" strokeWidth={2.5}
              dot={{ r: 3, fill: '#8b5cf6' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[9px] text-[var(--color-text-muted)] mt-2 text-center italic">
          Value factor below the dashed line (1.0) = earning less than the pool average
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Trend tab — annual CF% and value factor over years
// ============================================================

function TrendTab({ project, poolPrices }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  project: any
  poolPrices: Record<string, Record<string, number>>
}) {
  const annualData = useMemo(() => {
    const raw = project.annual_data ?? []
    const state = project.state as string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return raw.map((a: any) => {
      const pool = poolPrices[state]?.[String(a.year)]
      const vf = pool && a.capture_price && pool > 0 ? a.capture_price / pool : null
      return {
        year: String(a.year),
        cf: a.cf_pct ?? null,
        vf: vf != null ? Math.round(vf * 1000) / 1000 : null,
        capture: a.capture_price ?? null,
        revMw: a.revenue_per_mw ? Math.round(a.revenue_per_mw / 1000) : null,
        months: a.months ?? 12,
      }
    }).filter((a: { cf: number | null; vf: number | null }) => a.cf != null || a.vf != null)
  }, [project, poolPrices])

  if (annualData.length === 0) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4">No annual trend data available.</p>
  }

  return (
    <div className="space-y-5">
      {/* Annual CF trend */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Annual Capacity Factor</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          CF% each year. A declining trend may indicate equipment ageing, increasing curtailment, or worsening dispatch conditions.
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={annualData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <YAxis tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => `${v.toFixed(0)}%`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={((v: number, _n: string, p: { payload?: { months?: number } }) => [
                `${v?.toFixed(1)}%${(p.payload?.months ?? 12) < 11 ? ' (partial)' : ''}`, 'CF'
              ]) as TF} />
            <Bar dataKey="cf" radius={[3, 3, 0, 0]}>
              {annualData.map((d: { year: string }) => (
                <Cell key={d.year} fill={YEAR_COLORS[Number(d.year)] ?? '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Annual Value Factor trend */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Annual Value Factor — Cannibalisation Drift</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Capture price ÷ annual pool average per year. A declining trend is the cannibalisation signal — as solar penetration grows, this discount deepens.
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={annualData} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 9 }} />
            <YAxis domain={[0.2, 1.1]} tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => v.toFixed(2)} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle}
              formatter={((v: number) => [v?.toFixed(3) ?? '—', 'Value Factor']) as TF} />
            <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
            <ReferenceLine y={0.7} stroke="rgba(245,158,11,0.25)" strokeDasharray="4 2" label={{ value: '0.70 threshold', fill: '#6b7280', fontSize: 8 }} />
            <Line type="monotone" dataKey="vf" stroke="#8b5cf6" strokeWidth={2.5}
              dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================
// Price Bands tab — where does the energy actually get sold?
// ============================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function BandsTab({ project }: { project: any }) {
  const pbd = project.price_band_data
  const bandData = useMemo(() => {
    if (!pbd?.monthly) return []
    // Aggregate all months into totals per band
    const totals: Record<string, { mwh: number; pct_sum: number; count: number }> = {}
    for (const monthBands of Object.values(pbd.monthly) as any[][]) {
      for (const band of monthBands) {
        if (!totals[band.label]) totals[band.label] = { mwh: 0, pct_sum: 0, count: 0 }
        totals[band.label].mwh += band.gen_mwh ?? 0
        totals[band.label].pct_sum += band.gen_pct ?? 0
        totals[band.label].count++
      }
    }
    const totalMwh = Object.values(totals).reduce((s, v) => s + v.mwh, 0)
    const BAND_ORDER = ['negative', '$0-50', '$50-100', '$100-300', '$300-1000', '$1000+']
    return BAND_ORDER.map(label => ({
      label,
      pct: totalMwh > 0 ? Math.round(totals[label]?.mwh / totalMwh * 1000) / 10 : 0,
      mwh: Math.round(totals[label]?.mwh ?? 0),
      fill: BAND_COLORS[label] ?? '#6b7280',
    })).filter(d => d.pct > 0)
  }, [pbd])

  if (bandData.length === 0) {
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-6 text-center mt-2">
        <p className="text-xs text-[var(--color-text-muted)]">5-minute NEMWEB price band data not yet available.</p>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
          Run: python3 pipeline/importers/import_price_band_capture.py --tech solar --all-cached
        </p>
      </div>
    )
  }

  const negPct = bandData.find(d => d.label === 'negative')?.pct ?? 0
  const lowPct = bandData.find(d => d.label === '$0-50')?.pct ?? 0

  return (
    <div className="space-y-4">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">Generation by Price Band</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Where this farm's output is dispatched relative to the spot price. High proportions at negative or sub-$50 prices
          indicate cannibalisation. Sourced from AEMO 5-minute NEMWEB dispatch data.
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={bandData} layout="vertical" margin={{ top: 4, right: 32, bottom: 0, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 9 }} tickFormatter={(v: number) => `${v}%`} />
            <YAxis type="category" dataKey="label" tick={{ fill: '#9ca3af', fontSize: 9 }} width={56} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={((v: number, _n: string, p: { payload?: { mwh?: number } }) => [
                `${v?.toFixed(1)}% of energy (${p.payload?.mwh?.toLocaleString() ?? 0} MWh total)`,
                'Energy dispatched',
              ]) as TF} />
            <Bar dataKey="pct" radius={[0, 3, 3, 0]}>
              {bandData.map(d => <Cell key={d.label} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Callout insight */}
      {negPct + lowPct > 30 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <p className="text-[10px] text-red-400 font-semibold mb-0.5">⚠️ High cannibalisation exposure</p>
          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            {(negPct + lowPct).toFixed(1)}% of this farm's generation occurs at prices below $50/MWh (including {negPct.toFixed(1)}% at negative prices).
            This significantly depresses average capture price and value factor.
            Battery co-location or time-shifting strategies could improve revenue quality.
          </p>
        </div>
      )}
      {negPct + lowPct <= 15 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <p className="text-[10px] text-green-400 font-semibold mb-0.5">✅ Low cannibalisation exposure</p>
          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            Only {(negPct + lowPct).toFixed(1)}% of generation at prices below $50/MWh. This farm has a relatively favourable dispatch profile compared to the solar fleet average.
          </p>
        </div>
      )}
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
        vf: p.value_summary?.avg_value_factor as number | null,
        cf: p.value_summary?.avg_cf_pct as number | null,
        isSelf: p.id === project.id,
      }))
      .filter(p => p.vf != null && p.cf != null)
      .sort((a, b) => (b.vf ?? 0) - (a.vf ?? 0))
  }, [allStateProjects, project.id])

  if (peers.length <= 1) {
    return <p className="text-xs text-[var(--color-text-muted)] py-4">Not enough peer data available for comparison.</p>
  }

  return (
    <div className="space-y-4">
      {/* VF comparison bar */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">
          Value Factor — {project.state} State Peers
        </p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Average value factor by project in {project.state}. Higher = less cannibalised.
        </p>
        <ResponsiveContainer width="100%" height={Math.max(120, peers.length * 22)}>
          <BarChart data={peers} layout="vertical" margin={{ top: 4, right: 48, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 9 }} domain={[0, 1.1]}
              tickFormatter={(v: number) => v.toFixed(2)} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 8 }} width={120}
              tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 16) + '…' : v} />
            <Tooltip contentStyle={tooltipStyle}
              formatter={((v: number) => [v.toFixed(3), 'Value Factor']) as TF} />
            <ReferenceLine x={1.0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 2" />
            <Bar dataKey="vf" radius={[0, 3, 3, 0]}>
              {peers.map(p => (
                <Cell key={p.id} fill={p.isSelf ? '#f59e0b' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-2 text-[9px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#f59e0b] inline-block" /> This project</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#6366f1] inline-block" /> State peers</span>
        </div>
      </div>

      {/* Scatter: CF vs VF */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-semibold text-[var(--color-text)] mb-0.5">CF% vs Value Factor — State Portfolio</p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          Top-right = high output AND good price capture (best position). Top-left = low CF. Bottom-right = high output but heavily cannibalised.
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" dataKey="cf" name="CF%" tick={{ fill: '#9ca3af', fontSize: 9 }}
              label={{ value: 'CF%', position: 'insideBottomRight', fill: '#6b7280', fontSize: 9, offset: -4 }} />
            <YAxis type="number" dataKey="vf" name="VF" tick={{ fill: '#9ca3af', fontSize: 9 }} domain={[0.3, 1.1]}
              label={{ value: 'Value Factor', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 9 }} />
            <Tooltip contentStyle={tooltipStyle}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ active, payload }: any) => {
                if (!active || !payload?.[0]) return null
                const d = payload[0].payload
                return (
                  <div style={{ ...tooltipStyle, padding: '6px 10px' }}>
                    <p style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 2, fontSize: 11 }}>{d.name}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8' }}>CF: {d.cf?.toFixed(1)}%</p>
                    <p style={{ fontSize: 10, color: '#94a3b8' }}>VF: {d.vf?.toFixed(3)}</p>
                  </div>
                )
              }}
            />
            <ReferenceLine y={1.0} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 2" />
            <Scatter data={peers} name="Projects">
              {peers.map(p => (
                <Cell key={p.id} fill={p.isSelf ? '#f59e0b' : '#6366f1'} opacity={p.isSelf ? 1 : 0.6} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
