import { useState, useRef, useCallback, type ReactNode } from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TF = (value: any, name: any) => [string, string]
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend, Cell,
} from 'recharts'
import { useWindValueProject } from '../../hooks/useWindValue'
import type { WindValueProject, WindStateAverage } from '../../lib/types'
import { exportElementToPdf } from '../../lib/exportPdf'

// ============================================================
// Constants
// ============================================================

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`)
const SEASON_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  summer: { label: 'Summer', color: '#f59e0b', icon: '☀️' },
  autumn: { label: 'Autumn', color: '#f97316', icon: '🍂' },
  winter: { label: 'Winter', color: '#3b82f6', icon: '❄️' },
  spring: { label: 'Spring', color: '#22c55e', icon: '🌱' },
}
const YEAR_COLORS: Record<number, string> = {
  2018: '#6366f1', 2019: '#8b5cf6', 2020: '#a855f7', 2021: '#ec4899',
  2022: '#f43f5e', 2023: '#f59e0b', 2024: '#22c55e', 2025: '#3b82f6', 2026: '#06b6d4',
}
const tooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#f1f5f9',
}
const tooltipLabelStyle = { color: '#94a3b8', marginBottom: 2, fontSize: 10 }
const tooltipItemStyle = { color: '#f1f5f9' }

// Info icon with click-to-open popover for chart descriptions
function ChartInfo({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-block ml-1.5 align-middle">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        className="w-4 h-4 rounded-full bg-[#374151] text-[#9ca3af] hover:bg-[#4b5563] hover:text-[#f1f5f9] text-[9px] font-bold inline-flex items-center justify-center transition-colors leading-none"
        aria-label="Chart information"
      >i</button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-5 left-0 w-72 bg-[#111827] border border-[#374151] rounded-lg p-3 shadow-xl"
            style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.6 }}>
            <button onClick={() => setOpen(false)}
              className="absolute top-2 right-2 text-[#6b7280] hover:text-[#f1f5f9] text-xs leading-none">✕</button>
            {children}
          </div>
        </>
      )}
    </span>
  )
}

type TabId = 'explainer' | 'shape' | 'capture' | 'seasonal' | 'trend' | 'peers' | 'nem'

// ============================================================
// Main component
// ============================================================

interface Props { projectId: string; capacityMw?: number }

export default function WindValueAnalysis({ projectId }: Props) {
  const { project, stateAvg, allStateProjects, loading } = useWindValueProject(projectId)
  const [activeTab, setActiveTab] = useState<TabId>('explainer')

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
        <p className="text-sm text-[var(--color-text-muted)]">Wind value data not yet available for this project.</p>
      </div>
    )
  }

  const tabs: { key: TabId; label: string }[] = [
    { key: 'explainer', label: '📋 Valuation' },
    { key: 'shape', label: '⏰ Daily Shape' },
    { key: 'capture', label: '💰 Capture' },
    { key: 'seasonal', label: '🌀 Seasonal' },
    { key: 'trend', label: '📈 Trend' },
    { key: 'peers', label: '🏆 Peers' },
  ]

  return (
    <div className="mt-6 space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)] flex items-center gap-2">
          <span>💨</span> Wind Value Analysis
        </h3>
        <GradeChip grade={project.pros_cons?.grade} score={project.pros_cons?.score} />
      </div>

      {/* Tab bar */}
      <div className="flex gap-0.5 bg-[var(--color-bg-card)] rounded-lg p-0.5 border border-[var(--color-border)] overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-none px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors ${
              activeTab === t.key
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'explainer' && (
        <ExplainerTab project={project} stateAvg={stateAvg} />
      )}
      {activeTab === 'shape' && (
        <DailyShapeTab project={project} />
      )}
      {activeTab === 'capture' && (
        <CaptureTab project={project} stateAvg={stateAvg} />
      )}
      {activeTab === 'seasonal' && (
        <SeasonalTab project={project} stateAvg={stateAvg} />
      )}
      {activeTab === 'trend' && (
        <TrendTab project={project} />
      )}
      {activeTab === 'peers' && (
        <PeersTab project={project} allStateProjects={allStateProjects} />
      )}
    </div>
  )
}

// ============================================================
// Grade chip
// ============================================================

function GradeChip({ grade, score }: { grade?: string; score?: number }) {
  if (!grade) return null
  const color = grade.startsWith('A') ? '#22c55e'
    : grade.startsWith('B') ? '#3b82f6'
    : grade.startsWith('C') ? '#f59e0b'
    : '#ef4444'
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-[var(--color-text-muted)]">Value rating</span>
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {grade}
      </span>
      {score !== undefined && (
        <span className="text-[10px] text-[var(--color-text-muted)]">{score.toFixed(1)}/5.0</span>
      )}
    </div>
  )
}

// ============================================================
// Explainer tab — educational framework + pros/cons
// ============================================================

function ExplainerTab({ project, stateAvg }: { project: WindValueProject; stateAvg: WindStateAverage | null }) {
  const vs = project.value_summary
  const pc = project.pros_cons
  const sr = project.state_rank

  const valuationDimensions = [
    {
      icon: '⚡',
      title: 'Volume (Capacity Factor)',
      explain: 'How much electricity the farm actually produces vs its rated capacity. Higher CF = more MWh sold = more revenue.',
      value: vs.avg_cf_pct != null ? `${vs.avg_cf_pct.toFixed(1)}%` : '–',
      benchmark: stateAvg?.avg_cf_pct != null ? `${stateAvg.avg_cf_pct.toFixed(1)}% state avg` : null,
      signal: signalFromRank(sr?.cf_percentile),
    },
    {
      icon: '💵',
      title: 'Capture Price',
      explain: 'The average $/MWh actually received when selling into the spot market. Wind farms often sell at a discount to the pool average because they generate heavily during the same periods as other wind farms, pushing prices down (cannibalisation).',
      value: vs.avg_capture_price != null ? `$${vs.avg_capture_price.toFixed(0)}/MWh` : '–',
      benchmark: stateAvg?.avg_capture_price != null ? `$${stateAvg.avg_capture_price.toFixed(0)}/MWh state avg` : null,
      signal: signalFromRank(sr?.capture_price_percentile),
    },
    {
      icon: '📊',
      title: 'Value Factor',
      explain: 'Capture price ÷ average pool price. A value factor of 1.0 means the farm earns exactly the pool average. Wind typically scores 0.75–0.95; higher penetration markets (SA) often see 0.60–0.80. Declining over time as wind penetration grows.',
      value: vs.avg_value_factor != null ? vs.avg_value_factor.toFixed(2) : '–',
      benchmark: stateAvg?.avg_value_factor != null ? `${stateAvg.avg_value_factor.toFixed(2)} state avg` : null,
      signal: vs.avg_value_factor != null
        ? (vs.avg_value_factor >= 0.90 ? 'good' : vs.avg_value_factor >= 0.75 ? 'ok' : 'warn')
        : 'neutral',
    },
    {
      icon: '📅',
      title: 'Seasonal Revenue',
      explain: 'Which seasons deliver the most revenue. Wind farms with strong winter output (when prices are high) earn more than those biased to summer. Understanding this shapes PPA structuring and refinancing risk.',
      value: (() => {
        const winter = project.seasonal_averages['winter']
        const summer = project.seasonal_averages['summer']
        if (!winter?.avg_cf_pct || !summer?.avg_cf_pct) return '–'
        return `${winter.avg_cf_pct.toFixed(0)}% winter / ${summer.avg_cf_pct.toFixed(0)}% summer CF`
      })(),
      benchmark: null,
      signal: (() => {
        const winter = project.seasonal_averages['winter']?.avg_cf_pct
        const summer = project.seasonal_averages['summer']?.avg_cf_pct
        if (!winter || !summer) return 'neutral'
        return winter > summer + 6 ? 'good' : winter < summer - 3 ? 'warn' : 'ok'
      })(),
    },
    {
      icon: '📉',
      title: 'CF Trend',
      explain: 'Whether capacity factor is improving or declining over time. Declining CF can indicate equipment ageing, increasing curtailment, or worsening dispatch conditions as more wind enters the region.',
      value: vs.cf_trend.charAt(0).toUpperCase() + vs.cf_trend.slice(1),
      benchmark: vs.data_years > 0 ? `${vs.data_years} years of data` : null,
      signal: vs.cf_trend === 'improving' ? 'good' : vs.cf_trend === 'declining' ? 'warn' : 'ok',
    },
    {
      icon: '📐',
      title: 'Revenue Variability',
      explain: 'How much annual CF varies year-to-year. High variability (±5%+ CF) makes it harder to forecast revenue, increasing lender margin requirements in project finance. Low variability = more bankable cashflows.',
      value: vs.annual_cf_variability != null ? `±${vs.annual_cf_variability.toFixed(1)}% annual CF` : '–',
      benchmark: null,
      signal: vs.annual_cf_variability != null
        ? (vs.annual_cf_variability <= 3 ? 'good' : vs.annual_cf_variability <= 5 ? 'ok' : 'warn')
        : 'neutral',
    },
  ]

  return (
    <div className="space-y-5">
      {/* Headline metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          label="Avg CF"
          value={vs.avg_cf_pct != null ? `${vs.avg_cf_pct.toFixed(1)}%` : '–'}
          sub={stateAvg?.avg_cf_pct != null ? `${stateAvg.avg_cf_pct.toFixed(1)}% state` : undefined}
          highlight={rankHighlight(sr?.cf_percentile)}
        />
        <MetricCard
          label="Capture Price"
          value={vs.avg_capture_price != null ? `$${vs.avg_capture_price.toFixed(0)}` : '–'}
          sub={stateAvg?.avg_capture_price != null ? `$${stateAvg.avg_capture_price.toFixed(0)} state` : undefined}
          highlight={rankHighlight(sr?.capture_price_percentile)}
        />
        <MetricCard
          label="Value Factor"
          value={vs.avg_value_factor != null ? vs.avg_value_factor.toFixed(2) : '–'}
          sub={vs.avg_value_factor != null
            ? (vs.avg_value_factor >= 0.90 ? 'strong' : vs.avg_value_factor >= 0.75 ? 'moderate' : 'discounted')
            : undefined}
          highlight={vs.avg_value_factor != null
            ? (vs.avg_value_factor >= 0.90 ? 'green' : vs.avg_value_factor >= 0.75 ? 'yellow' : 'red')
            : undefined}
        />
      </div>

      {/* Valuation framework */}
      <div>
        <SectionTitle>How to value a wind farm</SectionTitle>
        <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
          Wind farm value = <strong className="text-[var(--color-text)]">Volume × Price × Certainty</strong>.
          Each dimension below shows how {project.name} performs across the key valuation drivers.
        </p>
        <div className="space-y-2">
          {valuationDimensions.map(d => (
            <ValuationRow key={d.title} {...d} />
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
                {pc.pros.map((p, i) => (
                  <li key={i} className="text-[11px] text-[var(--color-text)] leading-relaxed flex gap-2">
                    <span className="text-green-400 mt-0.5 shrink-0">+</span>
                    <span>{p}</span>
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
                {pc.cons.map((c, i) => (
                  <li key={i} className="text-[11px] text-[var(--color-text)] leading-relaxed flex gap-2">
                    <span className="text-red-400 mt-0.5 shrink-0">−</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* State ranking bar */}
      {sr && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
          <SectionTitle>State ranking ({project.state})</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            <RankBar label="Capacity Factor" rank={sr.cf_rank} total={sr.cf_total} percentile={sr.cf_percentile} />
            <RankBar label="Capture Price" rank={sr.capture_price_rank} total={sr.capture_price_total} percentile={sr.capture_price_percentile} />
            <RankBar label="Revenue/MW" rank={sr.revenue_per_mw_rank} total={sr.revenue_per_mw_total} />
          </div>
        </div>
      )}

      <p className="text-[9px] text-[var(--color-text-muted)] italic">
        Analytics from OpenElectricity API performance data {vs.data_first_year}–{vs.data_last_year}.
        Pool prices available Aug 2024 onward (AEMO MMSDM). Value factor calculated where pool price data exists.
      </p>
    </div>
  )
}

function ValuationRow({
  icon, title, explain, value, benchmark, signal,
}: {
  icon: string; title: string; explain: string; value: string
  benchmark: string | null; signal: string
}) {
  const [open, setOpen] = useState(false)
  const dotColor = signal === 'good' ? '#22c55e' : signal === 'ok' ? '#3b82f6' : signal === 'warn' ? '#ef4444' : '#6b7280'
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-sm">{icon}</span>
        <span className="text-xs font-medium text-[var(--color-text)] flex-1">{title}</span>
        <span className="text-xs font-bold" style={{ color: dotColor }}>{value}</span>
        {benchmark && (
          <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:inline ml-1">({benchmark})</span>
        )}
        <span
          className="w-2 h-2 rounded-full ml-1 shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span className="text-[10px] text-[var(--color-text-muted)] ml-1">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 text-[11px] text-[var(--color-text-muted)] leading-relaxed border-t border-[var(--color-border)]">
          <p className="mt-2">{explain}</p>
        </div>
      )}
    </div>
  )
}

function RankBar({ label, rank, total, percentile }: { label: string; rank: number; total: number; percentile?: number }) {
  const pct = percentile ?? Math.round((total - rank) / total * 100)
  const color = pct >= 75 ? '#22c55e' : pct >= 50 ? '#3b82f6' : pct >= 25 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <p className="text-[10px] text-[var(--color-text-muted)] mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
        <span className="text-[10px] font-medium" style={{ color }}>
          #{rank}/{total}
        </span>
      </div>
    </div>
  )
}

// ============================================================
// Daily shape tab
// ============================================================

type ShapeView = 'annual' | string // month "1"-"12" or season key

function DailyShapeTab({ project }: { project: WindValueProject }) {
  const [view, setView] = useState<ShapeView>('annual')
  const [showState] = useState(false)
  const shape = project.hourly_shape

  if (!shape) {
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-6 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">Hourly shape data not yet available.</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Run <code className="bg-white/10 px-1 rounded">import_wind_profiles.py</code> to fetch from OE API.
        </p>
      </div>
    )
  }

  const getProfile = (v: ShapeView): (number | null)[] => {
    if (v === 'annual') return shape.annual
    if (['summer', 'autumn', 'winter', 'spring'].includes(v)) return shape.seasons[v] ?? shape.annual
    return shape.months[v] ?? shape.annual
  }

  const activeProfile = getProfile(view)
  const annualAvg = (() => {
    const vals = shape.annual.filter((v): v is number => v != null)
    return vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : null
  })()

  const chartData = HOURS.map((label, i) => ({
    hour: label,
    cf: activeProfile[i] != null ? Number((activeProfile[i] as number).toFixed(1)) : null,
    flat: annualAvg != null ? Number(annualAvg.toFixed(1)) : null,
  }))

  return (
    <div className="space-y-4">
      {/* Explainer */}
      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text)]">Daily shape</strong> shows average capacity factor by hour of day
          (AEST, UTC+10). Unlike solar, wind generates around the clock — but still has time-of-day patterns
          driven by local meteorology. The flat line is the annual average CF (what you'd expect with zero diurnal pattern).
          {shape.data_period !== 'sample (not real)' && (
            <span className="block mt-1 text-[9px] opacity-70">Data period: {shape.data_period}</span>
          )}
        </p>
      </div>

      {/* View selector */}
      <div className="flex gap-1 flex-wrap">
        <ViewBtn active={view === 'annual'} onClick={() => setView('annual')} label="Annual avg" />
        <span className="text-[var(--color-border)] self-center text-xs">|</span>
        {Object.entries(SEASON_CONFIG).map(([k, s]) => (
          <ViewBtn key={k} active={view === k} onClick={() => setView(k)} label={s.label} color={s.color} />
        ))}
        <span className="text-[var(--color-border)] self-center text-xs">|</span>
        {MONTH_LABELS.map((m, i) => (
          <ViewBtn key={i} active={view === String(i + 1)} onClick={() => setView(String(i + 1))} label={m} small />
        ))}
      </div>

      {/* Line chart */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">
          Hourly CF Profile — {view === 'annual' ? 'Annual Average' : view in SEASON_CONFIG ? SEASON_CONFIG[view].label : `${MONTH_LABELS[parseInt(view) - 1]}`}
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Hourly generation shape</p>
            Average capacity factor % by hour of day (AEST, UTC+10). A flat line would mean equal generation at all hours — deviations reveal time-of-day patterns driven by local wind meteorology.<br/><br/>
            <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> OpenElectricity API facility-level dispatch, covering approximately May 2025–May 2026 (the 367-day free tier window). Built from 12 × 30-day API calls per project.<br/><br/>
            <span style={{color:'#22c55e',fontWeight:600}}>Strong:</span> Directly from AEMO 5-min dispatch, aggregated to hourly. <span style={{color:'#f59e0b',fontWeight:600}}>Caution:</span> Only one year of recent data — longer-run multi-year patterns not captured here.
          </ChartInfo>
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
              interval={3}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              tickFormatter={v => `${v}%`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle}
              formatter={((value, name) => [
                `${value?.toFixed(1)}%`,
                name === 'cf' ? 'Capacity Factor' : 'Annual Avg'
              ]) as TF}
            />
            <Line
              type="monotone"
              dataKey="flat"
              stroke="#6b7280"
              strokeWidth={1}
              strokeDasharray="4 3"
              dot={false}
              name="flat"
            />
            <Line
              type="monotone"
              dataKey="cf"
              stroke={view in SEASON_CONFIG ? SEASON_CONFIG[view].color : '#3b82f6'}
              strokeWidth={2.5}
              dot={false}
              connectNulls
              name="cf"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Seasonal overlay comparison */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">
          All Seasons Compared
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Seasonal shape overlay</p>
            The same hourly CF profile split by meteorological season: <strong style={{color:'#f1f5f9'}}>Summer</strong> (Dec/Jan/Feb), <strong style={{color:'#f1f5f9'}}>Autumn</strong> (Mar/Apr/May), <strong style={{color:'#f1f5f9'}}>Winter</strong> (Jun/Jul/Aug), <strong style={{color:'#f1f5f9'}}>Spring</strong> (Sep/Oct/Nov). Reveals whether the farm's daily generation rhythm changes across seasons.<br/><br/>
            <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> Same May 2025–May 2026 OE API dataset. Some seasons may have slightly more or fewer weeks depending on the exact window.<br/><br/>
            <span style={{color:'#f59e0b',fontWeight:600}}>Caution:</span> ~13 weeks per season — individual weather events can noticeably shift the average shape.
          </ChartInfo>
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={HOURS.map((label, i) => {
              const row: Record<string, string | number | null> = { hour: label }
              Object.keys(SEASON_CONFIG).forEach(s => {
                const v = shape.seasons[s]?.[i]
                row[s] = v != null ? Number(v.toFixed(1)) : null
              })
              return row
            })}
            margin={{ top: 4, right: 8, bottom: 0, left: -14 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} interval={3} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle}
              formatter={((v, name) => [`${v?.toFixed(1)}%`, SEASON_CONFIG[name]?.label ?? name]) as TF}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => SEASON_CONFIG[v]?.label ?? v} />
            {Object.entries(SEASON_CONFIG).map(([k, s]) => (
              <Line key={k} type="monotone" dataKey={k} stroke={s.color} strokeWidth={1.8} dot={false} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {showState && <p className="text-[9px] text-[var(--color-text-muted)] mt-1">State avg overlay coming soon.</p>}
      </div>
    </div>
  )
}

// ============================================================
// Capture price tab
// ============================================================

function CaptureTab({ project, stateAvg }: { project: WindValueProject; stateAvg: WindStateAverage | null }) {
  const [showYear, setShowYear] = useState<number | 'avg'>('avg')
  const vs = project.value_summary

  // Avg energy and revenue per calendar month across all years (for 'avg' view)
  const avgByMonth: Record<number, { energy: number | null; revenue: number | null }> = {}
  for (let mo = 1; mo <= 12; mo++) {
    const withEnergy = project.monthly_data.filter(m => m.month === mo && m.energy_mwh != null)
    const withRevenue = project.monthly_data.filter(m => m.month === mo && m.revenue_aud != null)
    avgByMonth[mo] = {
      energy: withEnergy.length > 0
        ? withEnergy.reduce((s, e) => s + (e.energy_mwh ?? 0), 0) / withEnergy.length
        : null,
      revenue: withRevenue.length > 0
        ? withRevenue.reduce((s, e) => s + (e.revenue_aud ?? 0), 0) / withRevenue.length
        : null,
    }
  }

  // Monthly averaged data (for value factor chart)
  const monthlyAvgData = MONTH_LABELS.map((label, i) => {
    const mo = String(i + 1)
    const avg = project.monthly_averages[mo]
    return {
      month: label,
      capture: avg?.avg_capture_price ?? null,
      value_factor: avg?.avg_value_factor ?? null,
    }
  })

  // Year options
  const yearOptions = [...new Set(project.monthly_data.map(m => m.year))].sort()

  // Per-month chart data including output and revenue
  const yearData = MONTH_LABELS.map((label, i) => {
    const mo = i + 1
    const entry = showYear === 'avg'
      ? null
      : project.monthly_data.find(m => m.year === showYear && m.month === mo)
    const avg = project.monthly_averages[String(mo)]

    const capturePrice = showYear === 'avg' ? (avg?.avg_capture_price ?? null) : (entry?.capture_price ?? null)
    const poolPrice = showYear === 'avg' ? null : (entry?.pool_price ?? null)
    const energyMwh = showYear === 'avg' ? (avgByMonth[mo]?.energy ?? null) : (entry?.energy_mwh ?? null)
    const revenueAud = showYear === 'avg' ? (avgByMonth[mo]?.revenue ?? null) : (entry?.revenue_aud ?? null)
    const flatAud = energyMwh != null && poolPrice != null ? energyMwh * poolPrice : null

    return {
      month: label,
      capture: capturePrice,
      pool: poolPrice,
      vf: showYear === 'avg' ? (avg?.avg_value_factor ?? null) : (entry?.value_factor ?? null),
      energy: energyMwh != null ? Math.round(energyMwh / 1000 * 10) / 10 : null,        // GWh, 1dp
      revenue: revenueAud != null ? Math.round(revenueAud / 1_000_000 * 10) / 10 : null, // $M, 1dp
      flat: flatAud != null ? Math.round(flatAud / 1_000_000 * 10) / 10 : null,          // $M, 1dp
    }
  })

  const hasFlatData = yearData.some(d => d.flat != null)

  return (
    <div className="space-y-4">
      {/* Explainer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text)]">Revenue capture</strong> — a wind farm&apos;s capture price is almost always
          below the pool average. This &quot;value factor discount&quot; comes from <em>cannibalisation</em>: all wind farms
          generate at the same time (windy days), flooding the market and driving prices down.
          The further below 1.0 the value factor, the worse the cannibalisation effect.
        </p>
      </div>

      {/* Headline value metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard
          label="Avg Capture Price"
          value={vs.avg_capture_price != null ? `$${vs.avg_capture_price.toFixed(0)}/MWh` : '–'}
          sub={stateAvg?.avg_capture_price != null ? `$${stateAvg.avg_capture_price.toFixed(0)} state avg` : undefined}
        />
        <MetricCard
          label="Value Factor"
          value={vs.avg_value_factor != null ? vs.avg_value_factor.toFixed(2) : '–'}
          sub="capture ÷ pool avg"
          highlight={vs.avg_value_factor != null
            ? (vs.avg_value_factor >= 0.90 ? 'green' : vs.avg_value_factor >= 0.75 ? 'yellow' : 'red')
            : undefined}
        />
        <MetricCard
          label="Best Month"
          value={vs.best_capture_month ? MONTH_LABELS[vs.best_capture_month - 1] : '–'}
          sub={vs.best_capture_month ? (() => {
            const d = project.monthly_averages[String(vs.best_capture_month)]
            return d?.avg_capture_price ? `$${d.avg_capture_price.toFixed(0)}/MWh avg` : undefined
          })() : undefined}
        />
        <MetricCard
          label="Worst Month"
          value={vs.worst_capture_month ? MONTH_LABELS[vs.worst_capture_month - 1] : '–'}
          sub={vs.worst_capture_month ? (() => {
            const d = project.monthly_averages[String(vs.worst_capture_month)]
            return d?.avg_capture_price ? `$${d.avg_capture_price.toFixed(0)}/MWh avg` : undefined
          })() : undefined}
          highlight="red"
        />
      </div>

      {/* Year toggle */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-medium">View:</span>
        <ViewBtn active={showYear === 'avg'} onClick={() => setShowYear('avg')} label="All Years Avg" />
        {yearOptions.map(y => (
          <ViewBtn key={y} active={showYear === y} onClick={() => setShowYear(y)} label={String(y)} small />
        ))}
      </div>

      {/* 1. Capture price by month */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">
          Monthly Capture Price ($/MWh){showYear !== 'avg' ? ` — ${showYear}` : ' — Multi-Year Average'}
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Capture price by month</p>
            Average $/MWh the farm actually received when it sold into the NEM spot market, per calendar month. Derived from AEMO settlement records: <em>total revenue ÷ total output</em> for that month. The dashed reference line is the all-years average.<br/><br/>
            When a specific year is selected, the grey bar shows the regional pool average for that month (available from Aug 2024 only) — a green bar means the farm beat the market that month.<br/><br/>
            <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> AEMO dispatch/settlement via OpenElectricity. Full operational history (2018+).<br/>
            <span style={{color:'#22c55e',fontWeight:600}}>Strong:</span> Directly from metered settlement records — no estimation.
          </ChartInfo>
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={yearData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle}
              formatter={((v, name) => [
                `$${v?.toFixed(0)}/MWh`,
                name === 'capture' ? 'Capture Price' : 'Pool Price',
              ]) as TF}
            />
            {showYear !== 'avg' && (
              <Bar dataKey="pool" name="pool" fill="#6b728040" radius={[2, 2, 0, 0]} />
            )}
            <Bar dataKey="capture" name="capture" radius={[4, 4, 0, 0]}>
              {yearData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.capture && d.pool
                    ? (d.capture >= d.pool ? '#22c55e' : '#3b82f6')
                    : '#3b82f6'}
                />
              ))}
            </Bar>
            {vs.avg_capture_price != null && (
              <ReferenceLine y={vs.avg_capture_price} stroke="#ffffff50" strokeDasharray="4 3"
                label={{ value: `Avg $${vs.avg_capture_price.toFixed(0)}`, fill: '#9ca3af', fontSize: 9, position: 'right' }} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Monthly output (GWh) */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">
          Monthly Output (GWh){showYear !== 'avg' ? ` — ${showYear}` : ' — Avg Per Month'}
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Monthly generation volume</p>
            Total electricity generated (GWh) per calendar month. In the "All Years Avg" view this is the mean across all years of operation for each month — useful for understanding typical seasonal output.<br/><br/>
            <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> AEMO dispatch records via OpenElectricity. Full operational history.<br/>
            <span style={{color:'#22c55e',fontWeight:600}}>Strong:</span> Directly metered generation — no estimation. Blank months indicate missing records (pre-commissioning or data gaps).
          </ChartInfo>
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={yearData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v}`} unit=" GWh" />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle}
              formatter={((v) => [`${v?.toFixed(1)} GWh`, 'Output']) as TF}
            />
            <Bar dataKey="energy" name="energy" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Monthly revenue vs flat */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wider flex items-center">
          Monthly Revenue vs Flat ($M){showYear !== 'avg' ? ` — ${showYear}` : ' — Avg Per Month'}
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Revenue vs flat — what is "flat"?</p>
            <strong style={{color:'#3b82f6'}}>Actual revenue</strong> = output (MWh) × capture price ($/MWh). This is what the farm actually earned.<br/><br/>
            <strong style={{color:'#6b7280'}}>Flat revenue</strong> = output (MWh) × pool average price ($/MWh). This is a <em>theoretical benchmark</em> — what the farm would have earned if it had captured the regional average price instead of its actual (discounted) price. No real wind farm achieves this.<br/><br/>
            The gap between the two bars is the <strong style={{color:'#f1f5f9'}}>dollar cost of cannibalisation</strong> for that month.<br/><br/>
            <span style={{color:'#f59e0b',fontWeight:600}}>Data limitation:</span> Pool price data is only available from Aug 2024. Select 2024 or 2025 to see both bars — earlier years show actual revenue only.
          </ChartInfo>
        </p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          {hasFlatData
            ? 'Flat = output × pool price. Gap between bars = dollar cost of cannibalisation.'
            : showYear === 'avg'
              ? 'Select 2024 or 2025 to see flat comparison (pool price data from Aug 2024).'
              : 'No pool price data for this year — flat comparison requires 2024+.'}
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={yearData} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}M`} />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle}
              formatter={((v, name) => [
                `$${v?.toFixed(1)}M`,
                name === 'flat' ? 'Flat (at pool price)' : 'Actual Revenue',
              ]) as TF}
            />
            {hasFlatData && <Bar dataKey="flat" name="flat" fill="#6b728070" radius={[4, 4, 0, 0]} />}
            <Bar dataKey="revenue" name="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Value factor by month */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wider flex items-center">
          Monthly Value Factor (avg across years)
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Value factor — price quality</p>
            Value factor = capture price ÷ pool average price. A value of <strong style={{color:'#22c55e'}}>1.0</strong> means the farm matched the market average exactly. Wind farms typically score below 1.0 — they generate simultaneously (windy days), flooding supply and depressing prices exactly when they produce most.<br/><br/>
            Colour: <span style={{color:'#22c55e'}}>green ≥ 1.0</span> · <span style={{color:'#3b82f6'}}>blue 0.80–1.0</span> · <span style={{color:'#ef4444'}}>red &lt; 0.80</span><br/><br/>
            <span style={{color:'#f59e0b',fontWeight:600}}>Data limitation:</span> Pool price data is only available from Aug 2024, so this "average across years" is actually an average of only recent months. Values shown here reflect a high-price, volatile period and may not represent long-run norms.
          </ChartInfo>
        </p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-3">
          &gt;1.0 = captured above pool avg · &lt;1.0 = discount to pool avg
        </p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyAvgData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} domain={[0, 'auto']} tickFormatter={v => v.toFixed(2)} />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle}
              formatter={((v) => [v?.toFixed(3), 'Value Factor']) as TF}
            />
            <ReferenceLine y={1.0} stroke="#ffffff30" strokeDasharray="4 3" />
            <Bar dataKey="value_factor" radius={[4, 4, 0, 0]}>
              {monthlyAvgData.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.value_factor == null ? '#374151' : d.value_factor >= 1.0 ? '#22c55e' : d.value_factor >= 0.80 ? '#3b82f6' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================
// Seasonal tab
// ============================================================

function SeasonalTab({ project }: { project: WindValueProject; stateAvg?: WindStateAverage | null }) {
  const seasons = ['summer', 'autumn', 'winter', 'spring']

  // Seasonal CF bar chart data
  const cfData = seasons.map(s => ({
    season: SEASON_CONFIG[s].label,
    cf: project.seasonal_averages[s]?.avg_cf_pct ?? null,
    capture: project.seasonal_averages[s]?.avg_capture_price ?? null,
    energy_pct: project.seasonal_averages[s]?.pct_of_annual_energy ?? null,
  }))

  return (
    <div className="space-y-4">
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text)]">Seasonal revenue distribution</strong> is critical for project
          finance and PPA design. A farm that earns most of its revenue in winter (when prices are higher in most NEM
          regions) is worth more than one with flat or summer-biased output. The revenue share column shows how much
          of annual energy (and likely revenue) comes from each season.
        </p>
      </div>

      {/* Season cards */}
      <div className="grid grid-cols-2 gap-2">
        {seasons.map(s => {
          const sa = project.seasonal_averages[s]
          const conf = SEASON_CONFIG[s]
          return (
            <div key={s} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{conf.icon}</span>
                <span className="text-xs font-semibold text-[var(--color-text)]">{conf.label}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  ({sa?.months?.map(m => MONTH_LABELS[m - 1]).join('/') ?? ''})
                </span>
              </div>
              <div className="space-y-1.5">
                <StatRow label="Avg CF" value={sa?.avg_cf_pct != null ? `${sa.avg_cf_pct.toFixed(1)}%` : '–'} color={conf.color} />
                <StatRow label="Capture price" value={sa?.avg_capture_price != null ? `$${sa.avg_capture_price.toFixed(0)}/MWh` : '–'} color={conf.color} />
                <StatRow label="Value factor" value={sa?.avg_value_factor != null ? sa.avg_value_factor.toFixed(2) : '–'} color={conf.color} />
                <StatRow label="% annual energy" value={sa?.pct_of_annual_energy != null ? `${sa.pct_of_annual_energy.toFixed(1)}%` : '–'} color="#6b7280" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Seasonal CF bar chart */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">Seasonal CF &amp; Capture Price
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Seasonal performance</p>
            Bars (left axis) = average CF% per season. Translucent line (right axis) = average capture price $/MWh. Together they show which seasons deliver the best combination of volume and price.<br/><br/>
            <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> Derived from full AEMO monthly history (2018+). CF data is strong across all years. <span style={{color:'#f59e0b',fontWeight:600}}>Caution:</span> Capture price and value factor reflect only months with pool price data (Aug 2024+).
          </ChartInfo>
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={cfData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="season" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis yAxisId="cf" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v}%`} />
            <YAxis yAxisId="cp" orientation="right" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle}
              formatter={((v, name) => [
                name === 'cf' ? `${v?.toFixed(1)}%` : `$${v?.toFixed(0)}/MWh`,
                name === 'cf' ? 'Capacity Factor' : 'Capture Price',
              ]) as TF}
            />
            <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v: string) => v === 'cf' ? 'Capacity Factor' : 'Capture Price'} />
            <Bar yAxisId="cf" dataKey="cf" radius={[4, 4, 0, 0]} name="cf">
              {cfData.map((_d, i) => (
                <Cell key={i} fill={Object.values(SEASON_CONFIG)[i]?.color ?? '#3b82f6'} />
              ))}
            </Bar>
            <Bar yAxisId="cp" dataKey="capture" fill="#ffffff30" radius={[4, 4, 0, 0]} name="capture" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Energy distribution doughnut-style bar */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">Annual Energy Share by Season</p>
        <div className="flex h-6 rounded-full overflow-hidden gap-0.5">
          {cfData.map((d, i) => {
            const conf = Object.values(SEASON_CONFIG)[i]
            const w = d.energy_pct ?? 25
            return (
              <div
                key={i}
                className="flex items-center justify-center text-[9px] font-bold text-white"
                style={{ width: `${w}%`, backgroundColor: conf.color }}
                title={`${conf.label}: ${d.energy_pct?.toFixed(1)}%`}
              >
                {w > 12 ? `${d.energy_pct?.toFixed(0)}%` : ''}
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          {cfData.map((d, i) => {
            const conf = Object.values(SEASON_CONFIG)[i]
            return (
              <span key={i} className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: conf.color }} />
                {conf.label} {d.energy_pct?.toFixed(1)}%
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Trend tab
// ============================================================

function TrendTab({ project }: { project: WindValueProject }) {
  const annualData = project.annual_data

  if (annualData.length === 0) {
    return <EmptyState text="Insufficient data for trend analysis" />
  }

  const cfTrendData = annualData.map(a => ({
    year: a.year.toString(),
    cf: a.cf_pct,
    capture: a.capture_price,
    rev_mw: a.revenue_per_mw != null ? Math.round(a.revenue_per_mw / 1000) : null,
    energy: a.energy_mwh != null ? Math.round(a.energy_mwh / 1000) : null,
  }))

  // Month-by-month heatmap data
  const heatmapYears = [...new Set(project.monthly_data.map(m => m.year))].sort()
  const heatmapData = heatmapYears.map(y => {
    const row: Record<string, number | string | null> = { year: String(y) }
    for (let mo = 1; mo <= 12; mo++) {
      const entry = project.monthly_data.find(m => m.year === y && m.month === mo)
      row[`m${mo}`] = entry?.cf_pct ?? null
    }
    return row
  })

  const allCF = project.monthly_data.map(m => m.cf_pct).filter((v): v is number => v != null)
  const minCF = Math.min(...allCF)
  const maxCF = Math.max(...allCF)
  const cfRange = maxCF - minCF || 1

  const cfHeatColor = (v: number | null): string => {
    if (v == null) return 'transparent'
    const t = (v - minCF) / cfRange
    // Blue (low) → green (high)
    const r = Math.round(59 + (34 - 59) * t)
    const g = Math.round(130 + (197 - 130) * t)
    const b = Math.round(246 + (94 - 246) * t)
    return `rgb(${r},${g},${b})`
  }

  return (
    <div className="space-y-4">
      <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text)]">Multi-year trend</strong> — watch for declining CF
          (equipment ageing or curtailment creep) and declining capture prices (cannibalisation). Revenue/MW
          combines both effects and is the cleanest single measure of a wind farm&apos;s economic performance over time.
        </p>
      </div>

      {/* Annual CF + revenue trend */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">Annual Capacity Factor
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Year-over-year CF trend</p>
            Annual capacity factor = total energy generated ÷ (installed capacity × 8,760 hours). A declining trend may indicate equipment ageing, increased curtailment, or worsening dispatch conditions as more wind capacity is added to the state.<br/><br/>
            <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> AEMO dispatch records, full operational history.<br/>
            <span style={{color:'#22c55e',fontWeight:600}}>Strong:</span> Complete calendar years only. The current partial year (2026) will update as data arrives.
          </ChartInfo>
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={cfTrendData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v}%`} domain={['auto', 'auto']} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={((v) => [`${v?.toFixed(1)}%`, 'Capacity Factor']) as TF} />
            <Bar dataKey="cf" radius={[4, 4, 0, 0]}>
              {cfTrendData.map((d, i) => (
                <Cell key={i} fill={YEAR_COLORS[parseInt(d.year)] ?? '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue/MW trend */}
      {cfTrendData.some(d => d.rev_mw != null) && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
          <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">Annual Revenue per MW ($k)
            <ChartInfo>
              <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Revenue intensity ($/MW/year)</p>
              Total annual revenue divided by installed capacity (MW). This normalises for farm size and is the cleanest single measure of economic performance over time — it captures both volume (CF) and price (capture price) in one number.<br/><br/>
              Revenue = sum of monthly (capture price × output). This is gross revenue before O&amp;M, financing costs, or PPA contract adjustments.<br/><br/>
              <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> AEMO settlement records, full history.<br/>
              <span style={{color:'#22c55e',fontWeight:600}}>Strong:</span> Directly derived — no estimation. Partial years not shown.
            </ChartInfo>
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={cfTrendData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}k`} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={((v) => [`$${v}k/MW`, 'Revenue']) as TF} />
              <Bar dataKey="rev_mw" radius={[4, 4, 0, 0]}>
                {cfTrendData.map((d, i) => (
                  <Cell key={i} fill={YEAR_COLORS[parseInt(d.year)] ?? '#22c55e'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly CF heatmap */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">
          Monthly CF Heatmap (blue=low, green=high)
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Month-by-month CF heatmap</p>
            Each cell = one calendar month's capacity factor %. The colour scale is relative to this project's own range (blue = its lowest months, green = its highest) — so it shows relative performance within the farm's own history, not against other farms.<br/><br/>
            Hover any cell to see the exact value. Blank cells = no data (pre-commissioning or missing records).<br/><br/>
            <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> AEMO dispatch records, full operational history.<br/>
            <span style={{color:'#22c55e',fontWeight:600}}>Strong:</span> Raw AEMO data — no estimation or imputation.
          </ChartInfo>
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr>
                <th className="text-left text-[var(--color-text-muted)] font-medium pr-2 w-10">Year</th>
                {MONTH_LABELS.map(m => (
                  <th key={m} className="text-center text-[var(--color-text-muted)] font-medium px-0.5 w-8">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(row => (
                <tr key={row.year}>
                  <td className="text-[var(--color-text-muted)] pr-2 py-0.5 font-mono">{row.year}</td>
                  {MONTH_LABELS.map((_, i) => {
                    const val = row[`m${i + 1}`] as number | null
                    return (
                      <td
                        key={i}
                        className="text-center py-0.5 px-0.5 rounded text-white font-bold"
                        style={{ backgroundColor: cfHeatColor(val) }}
                        title={val != null ? `${val.toFixed(1)}%` : 'No data'}
                      >
                        {val != null ? val.toFixed(0) : ''}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capture price trend */}
      {cfTrendData.some(d => d.capture != null) && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
          <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-3 uppercase tracking-wider flex items-center">Annual Capture Price ($/MWh)
            <ChartInfo>
              <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Annual capture price trend</p>
              Average $/MWh received per year — the price dimension of the value equation. A declining trend alongside flat CF would suggest increasing cannibalisation as the state adds more wind capacity.<br/><br/>
              <span style={{color:'#f59e0b',fontWeight:600}}>Data limitation:</span> Capture price is only available for years where monthly pool price data exists in the pipeline (from Aug 2024). Only ~2 years of data are shown. This period has been characterised by unusually high and volatile NEM prices — not representative of long-run norms.<br/><br/>
              Pre-2024 capture prices exist in the AEMO records but pool price reference data to compute value factor is not yet loaded for those years.
            </ChartInfo>
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={cfTrendData} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle} formatter={((v) => [`$${v?.toFixed(0)}/MWh`, 'Capture Price']) as TF} />
              <Line type="monotone" dataKey="capture" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Peers tab
// ============================================================

function PeersTab({ project, allStateProjects }: { project: WindValueProject; allStateProjects: WindValueProject[] }) {
  const [metric, setMetric] = useState<'cf' | 'capture' | 'rev'>('cf')

  // Sorted peer list for bar chart
  const sortKey: Record<string, (p: WindValueProject) => number> = {
    cf: p => p.value_summary.avg_cf_pct ?? 0,
    capture: p => p.value_summary.avg_capture_price ?? 0,
    rev: p => p.value_summary.latest_revenue_per_mw ?? 0,
  }
  const sorted = [...allStateProjects].sort((a, b) => sortKey[metric](b) - sortKey[metric](a))
  const barData = sorted.map(p => ({
    name: p.name.replace(' Wind Farm', '').replace(' Wind', '').slice(0, 22),
    value: sortKey[metric](p),
    isThis: p.id === project.id,
  }))

  // Scatter: CF vs capture price
  const scatterData = allStateProjects.map(p => ({
    cf: p.value_summary.avg_cf_pct ?? 0,
    capture: p.value_summary.avg_capture_price ?? 0,
    name: p.name.replace(' Wind Farm', '').slice(0, 20),
    isThis: p.id === project.id,
    cap: p.capacity_mw,
  }))

  const metricLabel = { cf: 'Avg CF%', capture: 'Avg Capture $/MWh', rev: 'Revenue/MW $k' }
  const metricFmt: Record<string, (v: number) => string> = {
    cf: v => `${v.toFixed(1)}%`,
    capture: v => `$${v.toFixed(0)}/MWh`,
    rev: v => `$${Math.round(v / 1000)}k/MW`,
  }

  return (
    <div className="space-y-4">
      <div className="bg-teal-500/5 border border-teal-500/20 rounded-lg p-3">
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          <strong className="text-[var(--color-text)]">Peer comparison</strong> across {allStateProjects.length} operating wind
          farms in {project.state}. Highlighted in white below. The scatter plot (CF vs capture price) reveals whether
          a farm&apos;s location produces both volume and value simultaneously.
        </p>
      </div>

      {/* Metric toggle */}
      <div className="flex gap-1">
        {(['cf', 'capture', 'rev'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              metric === m
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)]'
            }`}
          >
            {metricLabel[m]}
          </button>
        ))}
      </div>

      {/* Horizontal bar chart — ranked peers */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-2 uppercase tracking-wider flex items-center">
          {project.state} Wind Farm Rankings — {metricLabel[metric]}
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Peer rankings</p>
            All operating wind farms in {project.state}, ranked by the selected metric. Toggle between Avg CF%, Avg Capture $/MWh, and Revenue/MW $k using the buttons above.<br/><br/>
            Rankings use each farm's multi-year average. <span style={{color:'#f59e0b',fontWeight:600}}>Caution:</span> farms commissioned at different times are compared over different historical periods — a newer farm's shorter history may not reflect its long-run potential.<br/><br/>
            <span style={{color:'#f1f5f9',fontWeight:600}}>Data:</span> Same AEMO dispatch pipeline applied to all {project.state} wind farms. Updated when the import pipeline is re-run (typically monthly).
          </ChartInfo>
        </p>
        <div className="space-y-0.5 max-h-80 overflow-y-auto">
          {barData.map((d, i) => {
            const maxVal = barData[0].value || 1
            const w = Math.round((d.value / maxVal) * 100)
            return (
              <div key={i} className="flex items-center gap-2">
                <span className={`text-[9px] w-4 shrink-0 text-right ${d.isThis ? 'text-white font-bold' : 'text-[var(--color-text-muted)]'}`}>
                  {i + 1}
                </span>
                <div className="flex-1 relative h-5 flex items-center">
                  <div
                    className="absolute inset-y-0.5 left-0 rounded-sm"
                    style={{
                      width: `${w}%`,
                      backgroundColor: d.isThis ? '#ffffff' : '#3b82f640',
                    }}
                  />
                  <span className={`relative z-10 text-[10px] px-1.5 truncate ${d.isThis ? 'font-bold text-[var(--color-bg)]' : 'text-[var(--color-text-muted)]'}`}>
                    {d.name}
                  </span>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ${d.isThis ? 'text-white font-bold' : 'text-[var(--color-text-muted)]'}`}>
                  {metricFmt[metric](d.value)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scatter: CF vs capture price */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3">
        <p className="text-[10px] font-medium text-[var(--color-text-muted)] mb-1 uppercase tracking-wider flex items-center">
          CF vs Capture Price — {project.state} Wind Farms
          <ChartInfo>
            <p style={{color:'#f1f5f9',fontWeight:600,marginBottom:4}}>Volume vs price scatter</p>
            Each dot = one {project.state} wind farm. X-axis = avg CF% (volume), Y-axis = avg capture $/MWh (price). The ideal farm sits in the <strong style={{color:'#22c55e'}}>top-right</strong> — high generation AND high price. <strong style={{color:'#f1f5f9'}}>White dot = this project.</strong><br/><br/>
            A farm in the top-left generates well but sells cheap (strong cannibalisation). Bottom-right generates less but at a premium (possibly better site diversity or contract structure).<br/><br/>
            <span style={{color:'#f59e0b',fontWeight:600}}>Data note:</span> CF data covers full operational history — strong for all farms. Capture price is limited to Aug 2024+ data, so farms with fewer recent months may have less stable positions on the Y-axis.
          </ChartInfo>
        </p>
        <p className="text-[9px] text-[var(--color-text-muted)] mb-2">
          Top-right = best (high CF AND high capture). White dot = this project.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 4, right: 16, bottom: 16, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="cf"
              name="CF"
              type="number"
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
              tickFormatter={v => `${v}%`}
              label={{ value: 'Avg CF%', position: 'insideBottom', offset: -10, fontSize: 9, fill: '#9ca3af' }}
            />
            <YAxis
              dataKey="capture"
              name="Capture"
              type="number"
              tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
              tickFormatter={v => `$${v}`}
              label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={tooltipStyle} labelStyle={tooltipLabelStyle} itemStyle={tooltipItemStyle}
              cursor={{ strokeDasharray: '3 3' }}
              formatter={((v, name) => [
                name === 'cf' ? `${v?.toFixed(1)}%` : `$${v?.toFixed(0)}/MWh`,
                name === 'cf' ? 'Capacity Factor' : 'Capture Price',
              ]) as TF}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div style={tooltipStyle} className="p-2 space-y-0.5">
                    <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 11 }}>{d.name}</p>
                    <p style={tooltipItemStyle}>CF: {d.cf?.toFixed(1)}%</p>
                    <p style={tooltipItemStyle}>Capture: ${d.capture?.toFixed(0)}/MWh</p>
                    <p style={{ color: '#94a3b8', fontSize: 10 }}>{d.cap} MW</p>
                  </div>
                )
              }}
            />
            <Scatter
              data={scatterData.filter(d => !d.isThis)}
              fill="#3b82f660"
              r={4}
            />
            <Scatter
              data={scatterData.filter(d => d.isThis)}
              fill="#ffffff"
              r={7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ============================================================
// Shared helpers
// ============================================================

function MetricCard({ label, value, sub, highlight }: {
  label: string; value: string; sub?: string; highlight?: string
}) {
  const color = highlight === 'green' ? '#22c55e'
    : highlight === 'yellow' ? '#f59e0b'
    : highlight === 'red' ? '#ef4444'
    : 'var(--color-text)'
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-3 py-2">
      <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold text-[var(--color-text)] mb-2 flex items-center gap-1">{children}</h4>
  )
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
      <span className="text-[10px] font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

function ViewBtn({ active, onClick, label, color, small }: {
  active: boolean; onClick: () => void; label: string; color?: string; small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
        active
          ? 'bg-[var(--color-primary)] text-white'
          : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)]'
      } ${small ? 'px-1.5' : ''}`}
      style={active && color ? { backgroundColor: color } : {}}
    >
      {label}
    </button>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-8 text-center">
      <p className="text-sm text-[var(--color-text-muted)]">{text}</p>
    </div>
  )
}

function signalFromRank(percentile?: number): string {
  if (percentile == null) return 'neutral'
  if (percentile >= 70) return 'good'
  if (percentile >= 40) return 'ok'
  return 'warn'
}

function rankHighlight(percentile?: number): string | undefined {
  if (percentile == null) return undefined
  if (percentile >= 70) return 'green'
  if (percentile >= 40) return 'yellow'
  return 'red'
}
