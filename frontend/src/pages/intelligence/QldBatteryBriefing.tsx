import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ComposedChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { exportElementToPdf } from '../../lib/exportPdf'
import DataProvenance from '../../components/common/DataProvenance'

// Icons — defined BEFORE const arrays (Vite HMR pattern)
const ThesisIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
const RevenueIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
const TimelineIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
const AnalysisIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
const ContextIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" /></svg>

type SectionId = 'thesis' | 'revenue' | 'timeline' | 'analysis' | 'context'

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'thesis', label: 'Investment Thesis', icon: <ThesisIcon /> },
  { id: 'revenue', label: 'Revenue Collapse', icon: <RevenueIcon /> },
  { id: 'timeline', label: 'QLD Pipeline', icon: <TimelineIcon /> },
  { id: 'analysis', label: 'Analysis', icon: <AnalysisIcon /> },
  { id: 'context', label: 'NEM Context', icon: <ContextIcon /> },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BriefingData = any

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '-'
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
}

export default function QldBatteryBriefing() {
  const [data, setData] = useState<BriefingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('thesis')
  const [exporting, setExporting] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/analytics/intelligence/qld-battery-briefing.json`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleExportPdf = async () => {
    if (!pdfRef.current || exporting) return
    setExporting(true)
    try {
      await exportElementToPdf(pdfRef.current, {
        filename: 'QLD-Battery-Investment-Briefing',
        title: 'Queensland Battery Investment Briefing',
        subtitle: `AURES Intelligence · ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      })
    } finally { setExporting(false) }
  }

  if (loading) return <div className="p-6 lg:p-8 max-w-6xl mx-auto"><div className="animate-pulse h-8 bg-[var(--color-bg-elevated)] rounded w-1/3" /></div>
  if (!data) return <div className="p-6 lg:p-8 max-w-6xl mx-auto"><p className="text-[var(--color-text-muted)]">Failed to load briefing data.</p></div>

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Investment Memo</span>
            <span className="text-xs text-[var(--color-text-muted)]">{data.metadata.updated}</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">{data.metadata.title}</h1>
          <p className="text-sm text-red-400 font-medium mt-1">{data.metadata.subtitle}</p>
        </div>
        <button onClick={handleExportPdf} disabled={exporting}
          className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50 shrink-0">
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>

      {/* Section nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeSection === s.id ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}>
            {s.icon}{s.label}
          </button>
        ))}
      </div>

      <div ref={pdfRef}>
        {activeSection === 'thesis' && <ThesisSection data={data} />}
        {activeSection === 'revenue' && <RevenueSection data={data} />}
        {activeSection === 'timeline' && <TimelineSection data={data} />}
        {activeSection === 'analysis' && <AnalysisSection data={data} />}
        {activeSection === 'context' && <ContextSection data={data} />}
      </div>

      {/* Sources */}
      <div className="mt-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-xs font-semibold text-[var(--color-text)] mb-3">Sources</h3>
        <div className="space-y-1">
          {data.metadata.sources.map((s: { name: string; url: string }, i: number) => (
            <div key={i} className="text-[10px] text-[var(--color-text-muted)]">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-primary)] transition-colors">{s.name}</a>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/intelligence/battery-market" className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          Battery Market Intelligence &rarr;
        </Link>
        <Link to="/intelligence/research" className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
          Research Notes &rarr;
        </Link>
      </div>

      <div className="mt-6"><DataProvenance page="battery-market" /></div>
    </div>
  )
}

// ---------- Thesis ----------

function ThesisSection({ data }: { data: BriefingData }) {
  const t = data.thesis
  const snap = data.qld_market_snapshot
  return (
    <div className="space-y-6">
      {/* Position statement */}
      <div className="bg-[var(--color-bg-card)] border-2 border-red-500/40 rounded-xl p-6">
        <h3 className="text-base font-bold text-red-400 mb-3">{t.headline}</h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">{t.summary}</p>
        <div className="bg-red-500/10 rounded-lg p-4">
          <p className="text-xs font-medium text-red-400 leading-relaxed">{t.position}</p>
        </div>
      </div>

      {/* QLD market snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="QLD Wholesale" value={`$${snap.wholesale_price_may_2026}`} sub={`/MWh May 2026 (${snap.wholesale_yoy_pct}% YoY)`} colour="#ef4444" />
        <StatCard label="QLD BESS Revenue" value={`$${data.revenue_collapse.qld_q1_2026_revenue_k}k`} sub={`/MW/yr Q1 2026 (${data.revenue_collapse.qld_yoy_drop_pct}% YoY)`} colour="#f59e0b" />
        <StatCard label="QLD Spread" value={`$${data.revenue_collapse.qld_spread_q1_2026}`} sub={`/MWh (was $${data.revenue_collapse.qld_spread_prior_year})`} colour="#8b5cf6" />
        <StatCard label="Forward CY27-29" value={`~$${snap.forward_curve.cy27}`} sub="/MWh — flat, no recovery priced" colour="#6b7280" />
      </div>

      {/* Forward curve commentary */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">The Forward Curve Says It All</h4>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {(['cy27', 'cy28', 'cy29'] as const).map(k => (
            <div key={k} className="bg-[var(--color-bg-elevated)] rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--color-text-muted)] uppercase">{k}</div>
              <div className="text-lg font-bold text-[var(--color-text)]">${snap.forward_curve[k]}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{snap.forward_curve.commentary}</p>
      </div>

      {/* Why now is wrong */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-red-400 mb-3">Why Now Is Wrong</h4>
        <ul className="space-y-2">
          {data.investment_case_analysis.why_now_is_wrong.map((r: string, i: number) => (
            <li key={i} className="flex gap-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="text-red-400 shrink-0 mt-0.5">&#9679;</span>{r}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ---------- Revenue Collapse ----------

function RevenueSection({ data }: { data: BriefingData }) {
  const rev = data.revenue_collapse
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">QLD Monthly BESS Revenue</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">{rev.narrative}</p>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rev.monthly_trajectory}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}k`} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs">
                    <div className="font-medium text-[var(--color-text)]">{d.period}</div>
                    <div className="text-amber-400 font-medium">${fmt(d.revenue_k)}k/MW/yr</div>
                    {d.note && <div className="text-[var(--color-text-muted)] mt-1">{d.note}</div>}
                  </div>
                )
              }} />
              <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Debt service floor', position: 'right', fontSize: 10, fill: '#ef4444' }} />
              <Bar dataKey="revenue_k" name="Revenue $k/MW/yr" fill="#f59e0b" fillOpacity={0.7} radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Generation mix shift */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">QLD Generation Mix Shift (May 2025 → May 2026)</h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Renewables', value: `${data.qld_market_snapshot.generation_mix_may_2026.renewable_pct}%`, prior: `${data.qld_market_snapshot.generation_mix_may_2026.renewable_pct_prior_year}%`, colour: '#10b981' },
            { label: 'Battery Discharge', value: `${data.qld_market_snapshot.generation_mix_may_2026.battery_discharge_gwh} GWh`, change: `+${data.qld_market_snapshot.generation_mix_may_2026.battery_discharge_yoy_pct}%`, colour: '#f59e0b' },
            { label: 'Wind', value: `${data.qld_market_snapshot.generation_mix_may_2026.wind_gwh} GWh`, change: `+${data.qld_market_snapshot.generation_mix_may_2026.wind_yoy_pct}%`, colour: '#3b82f6' },
            { label: 'Solar', value: `${data.qld_market_snapshot.generation_mix_may_2026.solar_gwh} GWh`, change: `+${data.qld_market_snapshot.generation_mix_may_2026.solar_yoy_pct}%`, colour: '#eab308' },
            { label: 'Coal', value: `${data.qld_market_snapshot.generation_mix_may_2026.coal_gwh} GWh`, change: `${data.qld_market_snapshot.generation_mix_may_2026.coal_yoy_pct}%`, colour: '#6b7280' },
            { label: 'Gas', value: `${data.qld_market_snapshot.generation_mix_may_2026.gas_gwh} GWh`, change: `${data.qld_market_snapshot.generation_mix_may_2026.gas_yoy_pct}%`, colour: '#9ca3af' },
          ].map(m => (
            <div key={m.label} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="text-xs text-[var(--color-text-muted)]">{m.label}</div>
              <div className="text-lg font-bold" style={{ color: m.colour }}>{m.value}</div>
              <div className="text-[10px] text-[var(--color-text-muted)]">{m.change || `was ${m.prior}`}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- QLD Pipeline Timeline ----------

function TimelineSection({ data }: { data: BriefingData }) {
  const cap = data.capacity_buildout
  const events = cap.timeline_events

  const EVENT_COLOURS: Record<string, string> = {
    cod: '#10b981', cod_expected: '#3b82f6', construction_start: '#f59e0b',
    fid: '#8b5cf6', energisation: '#06b6d4', coal_exit: '#ef4444',
  }

  return (
    <div className="space-y-6">
      {/* Cumulative capacity chart */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">QLD BESS Cumulative Capacity</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">From 100 MW (2021) to 5,000+ MW committed by 2028. Callide B exit (red line) removes 700 MW of coal — dwarfed by BESS additions.</p>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={events.filter((e: { cumulative_mw: number }) => e.cumulative_mw > 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${(Number(v) / 1000).toFixed(1)} GW`} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs">
                    <div className="font-medium text-[var(--color-text)]">{d.date}</div>
                    <div className="text-emerald-400">{fmt(d.cumulative_mw)} MW cumulative</div>
                    <div className="text-[var(--color-text-muted)] mt-1">{d.event}</div>
                  </div>
                )
              }} />
              <Area type="stepAfter" dataKey="cumulative_mw" name="Cumulative MW" fill="#10b981" stroke="#10b981" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive timeline */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-4">Event Timeline</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(EVENT_COLOURS).map(([type, colour]) => (
            <div key={type} className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
              <span className="w-2 h-2 rounded-full" style={{ background: colour }} />
              {type.replace(/_/g, ' ')}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {events.map((e: { date: string; event: string; type: string; cumulative_mw: number }, i: number) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="shrink-0 w-16 text-right">
                <span className="text-[10px] font-mono text-[var(--color-text-muted)]">{e.date}</span>
              </div>
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: EVENT_COLOURS[e.type] || '#6b7280' }} />
                {i < events.length - 1 && <div className="w-px flex-1 bg-[var(--color-border)] min-h-[12px]" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="text-xs text-[var(--color-text)] leading-relaxed">{e.event}</div>
                <div className="text-[10px]" style={{ color: EVENT_COLOURS[e.type] || '#6b7280' }}>{fmt(e.cumulative_mw)} MW cumulative</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operating projects table */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">QLD Operating BESS ({cap.operating.count} projects, {fmt(cap.operating.total_mw)} MW)</h4>
        <div className="space-y-2">
          {cap.operating.projects.map((p: { name: string; mw: number; mwh: number; developer: string; cod: string; note: string }, i: number) => (
            <div key={i} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-[var(--color-text)]">{p.name}</span>
                <span className="text-[10px] text-emerald-400">{p.mw} MW / {p.mwh} MWh</span>
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)]">
                {p.developer} · COD: {p.cod}
                {p.note && <span className="italic"> · {p.note}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline warning */}
      <div className="bg-[var(--color-bg-card)] border border-amber-500/30 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-amber-400 mb-2">Development Pipeline: {cap.development_pipeline.count} Projects / {fmt(cap.development_pipeline.total_mw)} MW</h4>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{cap.development_pipeline.note}</p>
      </div>
    </div>
  )
}

// ---------- Analysis ----------

function AnalysisSection({ data }: { data: BriefingData }) {
  const analysis = data.investment_case_analysis
  return (
    <div className="space-y-6">
      {/* CIS analysis */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">CIS Does Not Solve the Problem</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3">{analysis.cis_does_not_solve_it.narrative}</p>
        <div className="bg-amber-500/10 rounded-lg p-3">
          <p className="text-xs text-amber-400 leading-relaxed">{analysis.cis_does_not_solve_it.risk}</p>
        </div>
      </div>

      {/* Callide offset */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Callide B Exit — Does Not Restore Scarcity</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <StatCard label="Callide B Exit" value={`-${analysis.callide_offset.callide_exit_mw} MW`} sub="coal removed" colour="#ef4444" />
          <StatCard label="Committed BESS" value={`+${fmt(analysis.callide_offset.committed_bess_arriving_mw)} MW`} sub="arriving 2027-28" colour="#10b981" />
          <StatCard label="Net Change" value={`+${fmt(analysis.callide_offset.net_capacity_change_mw)} MW`} sub="more dispatchable MW" colour="#f59e0b" />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{analysis.callide_offset.narrative}</p>
      </div>

      {/* Resi batteries */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Behind-the-Meter Batteries Eating Lunch</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatCard label="Installed Since Jul 2025" value={fmt(analysis.resi_batteries_eating_lunch.installed_systems_since_jul_2025)} sub="residential systems" colour="#8b5cf6" />
          <StatCard label="Capacity" value={`${analysis.resi_batteries_eating_lunch.installed_gwh} GWh`} sub="behind-the-meter" colour="#8b5cf6" />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{analysis.resi_batteries_eating_lunch.narrative}</p>
      </div>

      {/* Data centres */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Data Centres — Not a QLD Saviour</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3">{analysis.data_centres_not_a_qld_saviour.qld_specific}</p>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{analysis.data_centres_not_a_qld_saviour.how_it_plays_out}</p>
      </div>

      {/* How long */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">How Long Does This Last?</h3>
        <div className="space-y-3">
          {[
            { label: 'Best case', value: analysis.how_long_does_this_last.best_case, colour: '#10b981' },
            { label: 'Base case', value: analysis.how_long_does_this_last.base_case, colour: '#f59e0b' },
            { label: 'Worst case', value: analysis.how_long_does_this_last.worst_case, colour: '#ef4444' },
          ].map(sc => (
            <div key={sc.label} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="text-xs font-medium mb-1" style={{ color: sc.colour }}>{sc.label}</div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{sc.value}</p>
            </div>
          ))}
        </div>
        <div className="bg-[var(--color-bg-elevated)] rounded-lg p-4 mt-4 border border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text)] leading-relaxed font-medium">{analysis.how_long_does_this_last.conclusion}</p>
        </div>
      </div>
    </div>
  )
}

// ---------- NEM Context ----------

function ContextSection({ data }: { data: BriefingData }) {
  const ctx = data.broader_context
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-blue-500/30 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">NSW &amp; VIC — Same Movie, Different Act</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-3">{ctx.nsw_vic_following}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">NSW</h4>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{ctx.nsw_revenue_halved}</p>
        </div>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">VIC</h4>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{ctx.vic_flat}</p>
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">The Key Difference</h4>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          NSW faces Eraring's 2.88 GW exit and VIC faces Yallourn's 1.48 GW exit — both
          much larger than QLD's Callide B (700 MW). These are the coal retirements that will
          create the most material price volatility events in the NEM over the next 3 years.
          QLD, with no comparable exits beyond Callide B, does not get this relief. This makes
          QLD the <span className="text-red-400 font-medium">worst-positioned NEM state for
          merchant BESS investment</span> in the 2026-2028 window.
        </p>
      </div>
    </div>
  )
}

// ---------- Shared ----------

function StatCard({ label, value, sub, colour }: { label: string; value: string; sub: string; colour: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3 text-center">
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="text-lg font-bold" style={{ color: colour }}>{value}</div>
      <div className="text-[10px] text-[var(--color-text-muted)]">{sub}</div>
    </div>
  )
}
