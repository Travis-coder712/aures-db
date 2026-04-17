import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Cell,
  Legend, ScatterChart, Scatter, ZAxis,
} from 'recharts'
import { fetchBessBidding } from '../../lib/dataService'
import { exportElementToPdf } from '../../lib/exportPdf'
import type { BessBiddingData, BessBiddingProfile } from '../../lib/types'
import DataProvenance from '../../components/common/DataProvenance'

// Icons — defined BEFORE const arrays (Vite HMR pattern)
const OverviewIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
const StrategyIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
const TrendsIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
const RebidIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
const SoftwareIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const InsightsIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>

type SectionId = 'overview' | 'strategies' | 'trends' | 'rebids' | 'software' | 'insights'

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Fleet Overview', icon: <OverviewIcon /> },
  { id: 'strategies', label: 'Charging Strategies', icon: <StrategyIcon /> },
  { id: 'trends', label: 'Bid Evolution', icon: <TrendsIcon /> },
  { id: 'rebids', label: 'Rebid Intelligence', icon: <RebidIcon /> },
  { id: 'software', label: 'Trading Platforms', icon: <SoftwareIcon /> },
  { id: 'insights', label: 'Key Insights', icon: <InsightsIcon /> },
]

const STRATEGY_COLORS: Record<string, string> = {
  defensive: '#3b82f6',
  moderate: '#f59e0b',
  aggressive: '#ef4444',
}

const TECH_COLOR = '#10b981'

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '-'
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
}

function fmtK(n: number | null | undefined): string {
  if (n == null) return '-'
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}

function projectSlug(id: string): string {
  return `/projects/${id}`
}

// Tooltip wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs">
      <div className="font-medium text-[var(--color-text)] mb-1">{label}</div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[var(--color-text-muted)]">{p.name}:</span>
          <span className="text-[var(--color-text)] font-medium">{typeof p.value === 'number' ? fmt(p.value, 1) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function BessBidding() {
  const [data, setData] = useState<BessBiddingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  const handleExportPdf = async () => {
    if (!pdfRef.current || exporting) return
    setExporting(true)
    try {
      const sectionLabel = SECTIONS.find(s => s.id === activeSection)?.label || 'All'
      await exportElementToPdf(pdfRef.current, {
        filename: `BESS-Bidding-Intelligence-${sectionLabel.replace(/\s+/g, '-')}`,
        title: `BESS Bidding Intelligence — ${sectionLabel}`,
        subtitle: `AURES Intelligence · ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      })
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    fetchBessBidding().then(d => { setData(d); setLoading(false) })
  }, [])

  // Sorted profiles by total bids
  const profiles = useMemo(() => {
    if (!data) return []
    return [...data.profiles].sort((a, b) => b.total_bids - a.total_bids)
  }, [data])

  // Strategy groups
  const strategyGroups = useMemo(() => {
    if (!data) return { defensive: [] as BessBiddingProfile[], moderate: [] as BessBiddingProfile[], aggressive: [] as BessBiddingProfile[] }
    return {
      defensive: data.profiles.filter(p => p.load_strategy === 'defensive'),
      moderate: data.profiles.filter(p => p.load_strategy === 'moderate'),
      aggressive: data.profiles.filter(p => p.load_strategy === 'aggressive'),
    }
  }, [data])

  // Scatter data: rebid pct vs target spread
  const scatterData = useMemo(() => {
    if (!data) return []
    return data.profiles
      .filter(p => p.energy_bids > 100)
      .map(p => ({
        project_id: p.project_id,
        name: p.project_name,
        rebid_pct: p.rebid_pct,
        target_spread: Math.min(p.target_spread, 500), // cap for viz
        capacity: p.capacity_mw || 50,
        strategy: p.load_strategy,
      }))
  }, [data])

  if (loading) return <div className="p-8 text-center text-[var(--color-text-muted)]">Loading BESS bidding data...</div>
  if (!data) return <div className="p-8 text-center text-[var(--color-text-muted)]">No BESS bidding data available. Run the NEMWEB importer first.</div>

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2">
          <Link to="/intelligence" className="hover:text-[var(--color-accent)]">Intelligence</Link>
          <span>/</span>
          <span>BESS Bidding</span>
        </div>
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">BESS Bidding Intelligence</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Analysis of {fmt(data.data_range.total_bids)} daily bid offers across {data.data_range.total_projects} BESS projects ({data.data_range.first_date} to {data.data_range.last_date})
        </p>
        <div className="mt-3">
          <DataProvenance page="bess-bidding" />
        </div>
      </div>

      {/* Section nav */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeSection === s.id
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)] transition-colors disabled:opacity-50 ml-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'Generating PDF…' : 'Download PDF'}
        </button>
      </div>

      <div ref={pdfRef}>
      {/* OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Active BESS" value={String(data.data_range.total_projects)} />
            <StatCard label="Total Bid Rows" value={fmt(data.data_range.total_bids)} />
            <StatCard label="Full FCAS Stack" value={String(data.insights.fcas_full_stack.length)} sub={`/ ${data.data_range.total_projects}`} />
            <StatCard label="Energy Only" value={String(data.insights.fcas_only_energy.length)} sub="no FCAS" />
          </div>

          {/* Fleet growth chart */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Fleet Growth: Active DUIDs by Month</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
                <Bar dataKey="active_duids" fill={TECH_COLOR} name="Active DUIDs" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Project table */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Project Bidding Profiles</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--color-bg-card)] border-b border-[var(--color-border)]">
                    <th className="text-left p-2 text-[var(--color-text-muted)]">Project</th>
                    <th className="text-right p-2 text-[var(--color-text-muted)]">MW</th>
                    <th className="text-center p-2 text-[var(--color-text-muted)]">Strategy</th>
                    <th className="text-right p-2 text-[var(--color-text-muted)]">Bids</th>
                    <th className="text-right p-2 text-[var(--color-text-muted)]">Rebid %</th>
                    <th className="text-right p-2 text-[var(--color-text-muted)]">FCAS</th>
                    <th className="text-right p-2 text-[var(--color-text-muted)]">Spread</th>
                    <th className="text-center p-2 text-[var(--color-text-muted)]">Period</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => (
                    <tr key={p.project_id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)]">
                      <td className="p-2">
                        <Link to={projectSlug(p.project_id)} className="text-[var(--color-accent)] hover:underline font-medium">
                          {p.project_name}
                        </Link>
                        <div className="text-[var(--color-text-muted)]">{p.participant_id} &middot; {p.state}</div>
                      </td>
                      <td className="text-right p-2 text-[var(--color-text)]">{p.capacity_mw ? fmt(p.capacity_mw) : '-'}</td>
                      <td className="text-center p-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium" style={{
                          background: `${STRATEGY_COLORS[p.load_strategy]}20`,
                          color: STRATEGY_COLORS[p.load_strategy],
                        }}>
                          {p.load_strategy.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-right p-2 text-[var(--color-text)]">{fmt(p.total_bids)}</td>
                      <td className="text-right p-2">
                        <span className={p.rebid_pct > 90 ? 'text-green-400' : p.rebid_pct > 50 ? 'text-yellow-400' : 'text-red-400'}>
                          {fmt(p.rebid_pct, 1)}%
                        </span>
                      </td>
                      <td className="text-right p-2 text-[var(--color-text)]">{p.fcas_services > 0 ? `${p.fcas_services} svc` : 'None'}</td>
                      <td className="text-right p-2 text-[var(--color-text)]">{fmtK(p.target_spread)}</td>
                      <td className="text-center p-2 text-[var(--color-text-muted)]">{p.first_date?.substring(5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STRATEGIES */}
      {activeSection === 'strategies' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Charging Strategy Classification</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Based on LOAD (charging) priceband10: Defensive (&lt;$2K cap, charge cheap only),
              Moderate ($2K-$15K), Aggressive (&gt;$15K, willing to pay near-MPC to charge).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['defensive', 'moderate', 'aggressive'] as const).map(strategy => (
                <div key={strategy} className="rounded-lg p-3 border" style={{ borderColor: STRATEGY_COLORS[strategy] + '40' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: STRATEGY_COLORS[strategy] }} />
                    <span className="text-sm font-semibold text-[var(--color-text)] capitalize">{strategy}</span>
                    <span className="text-xs text-[var(--color-text-muted)] ml-auto">{strategyGroups[strategy].length} projects</span>
                  </div>
                  <div className="space-y-1">
                    {strategyGroups[strategy].map(p => (
                      <div key={p.project_id} className="flex items-center justify-between text-xs">
                        <Link to={projectSlug(p.project_id)} className="text-[var(--color-accent)] hover:underline truncate flex-1 mr-2">
                          {p.project_name}
                        </Link>
                        <span className="text-[var(--color-text-muted)] whitespace-nowrap">
                          Load cap: {fmtK(p.load_pricebands[9])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scatter: Rebid % vs Target Spread */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Sophistication Map: Rebid Frequency vs Target Spread</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              High rebid % = constant algorithmic optimisation. High spread = larger targeted arbitrage gap. Bubble size = MW capacity.
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="rebid_pct" name="Rebid %" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} label={{ value: 'Rebid %', position: 'bottom', fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis dataKey="target_spread" name="Target Spread $" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} label={{ value: 'Target Spread $', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <ZAxis dataKey="capacity" range={[40, 400]} name="MW" />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload as typeof scatterData[0]
                  return (
                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs">
                      <div className="font-medium text-[var(--color-text)]">{d.name}</div>
                      <div className="text-[var(--color-text-muted)]">Rebid: {d.rebid_pct}% | Spread: ${d.target_spread}</div>
                      <div className="text-[var(--color-text-muted)]">{d.capacity}MW | {d.strategy}</div>
                    </div>
                  )
                }} />
                <Scatter data={scatterData}>
                  {scatterData.map((d, i) => (
                    <Cell key={i} fill={STRATEGY_COLORS[d.strategy]} fillOpacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Price band shapes */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">GEN Price Band Profiles (Average)</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Each BESS has 10 price bands from floor (PB1) to cap (PB10). The shape reveals strategy type.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profiles.filter(p => p.energy_bids > 500).slice(0, 8).map(p => {
                const bands = p.gen_pricebands.map((v, i) => ({
                  band: `PB${i + 1}`,
                  price: v != null ? Math.min(Math.max(v, -1200), 2000) : 0, // clip for viz
                  raw: v,
                }))
                return (
                  <div key={p.project_id} className="border border-[var(--color-border)] rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <Link to={projectSlug(p.project_id)} className="text-xs text-[var(--color-accent)] hover:underline font-medium truncate">
                        {p.project_name}
                      </Link>
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                        background: `${STRATEGY_COLORS[p.load_strategy]}20`,
                        color: STRATEGY_COLORS[p.load_strategy],
                      }}>{p.load_strategy}</span>
                    </div>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={bands}>
                        <XAxis dataKey="band" tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} />
                        <YAxis tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} domain={[-1200, 2000]} />
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null
                          const d = payload[0].payload as typeof bands[0]
                          return (
                            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded p-2 text-xs shadow-xl">
                              <div>{d.band}: {d.raw != null ? `$${d.raw.toFixed(0)}` : '-'}</div>
                            </div>
                          )
                        }} />
                        <Bar dataKey="price" radius={[1, 1, 0, 0]}>
                          {bands.map((b, i) => (
                            <Cell key={i} fill={(b.raw ?? 0) < 0 ? '#ef4444' : TECH_COLOR} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* TRENDS */}
      {activeSection === 'trends' && (
        <div className="space-y-6">
          {/* Monthly GEN/LOAD midpoint */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Fleet Average GEN vs LOAD Midpoint (PB5)</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              PB5 is the middle price band — where most volume sits. The gap between GEN and LOAD midpoints is the fleet&apos;s average arbitrage target.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="avg_gen_mid" stroke="#10b981" strokeWidth={2} name="GEN Mid $/MWh" dot={false} />
                <Line type="monotone" dataKey="avg_load_mid" stroke="#3b82f6" strokeWidth={2} name="LOAD Mid $/MWh" dot={false} />
                <Line type="monotone" dataKey="target_spread" stroke="#f59e0b" strokeWidth={2} name="Spread $/MWh" dot={false} strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* GEN Cap evolution (MPC) */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">GEN Cap Price Evolution (Market Price Cap)</h3>
            {data.insights.mpc_shift.old_mpc_approx && data.insights.mpc_shift.new_mpc_approx && (
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                MPC increased from ~${fmt(data.insights.mpc_shift.old_mpc_approx)} to ~${fmt(data.insights.mpc_shift.new_mpc_approx)}
                {data.insights.mpc_shift.first_new_mpc_date && ` (first seen ${data.insights.mpc_shift.first_new_mpc_date})`}
              </p>
            )}
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
                <Line type="monotone" dataKey="avg_gen_cap" stroke="#ef4444" strokeWidth={2} name="Avg GEN Cap $" dot={false} />
                <Line type="monotone" dataKey="max_cap" stroke="#8b5cf6" strokeWidth={1} name="Max Cap $" dot={false} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quarterly evolution per project */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Quarterly Target Spread by Project</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              How each key operator&apos;s GEN-LOAD spread has evolved quarter over quarter.
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {Object.keys(data.quarterly_evolution).map(pid => (
                <button
                  key={pid}
                  onClick={() => setSelectedProject(selectedProject === pid ? null : pid)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    selectedProject === pid || selectedProject === null
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
                  }`}
                >
                  {pid.split('-').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>
            {(() => {
              const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1']
              const selectedPids = selectedProject
                ? [selectedProject]
                : Object.keys(data.quarterly_evolution)
              // Build combined data
              const allQuarters = [...new Set(selectedPids.flatMap(pid => data.quarterly_evolution[pid]?.map(q => q.quarter) || []))].sort()
              const chartData = allQuarters.map(q => {
                const row: Record<string, number | string> = { quarter: q }
                selectedPids.forEach(pid => {
                  const entry = data.quarterly_evolution[pid]?.find(e => e.quarter === q)
                  row[pid] = entry?.target_spread ?? 0
                })
                return row
              })
              return (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} label={{ value: '$/MWh', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'var(--color-text-muted)' }} />
                    <Tooltip content={(props) => <ChartTooltip {...props} />} />
                    {selectedPids.map((pid, i) => (
                      <Line
                        key={pid}
                        type="monotone"
                        dataKey={pid}
                        stroke={colors[i % colors.length]}
                        strokeWidth={selectedProject ? 3 : 1.5}
                        name={pid.split('-').slice(0, 2).join(' ')}
                        dot={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )
            })()}
          </div>
        </div>
      )}

      {/* REBIDS */}
      {activeSection === 'rebids' && (
        <div className="space-y-6">
          {/* Rebid frequency ranking */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Rebid Frequency Ranking</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Higher rebid % = more sophisticated algorithmic trading. Top operators rebid 98-99% of intervals.
            </p>
            <ResponsiveContainer width="100%" height={Math.max(300, profiles.filter(p => p.energy_bids > 100).length * 22)}>
              <BarChart data={profiles.filter(p => p.energy_bids > 100).sort((a, b) => b.rebid_pct - a.rebid_pct)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} domain={[0, 100]} />
                <YAxis type="category" dataKey="project_name" width={180} tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
                <Bar dataKey="rebid_pct" name="Rebid %" radius={[0, 2, 2, 0]}>
                  {profiles.filter(p => p.energy_bids > 100).sort((a, b) => b.rebid_pct - a.rebid_pct).map((p, i) => (
                    <Cell key={i} fill={p.rebid_pct > 90 ? '#10b981' : p.rebid_pct > 50 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Rebid reasons */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Rebid Reason Categories</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">
              Why do BESS operators change their bids? Categorised from rebid explanation text.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.rebid_reasons.slice(0, 12)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="reason" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
                <Bar dataKey="count" fill="#8b5cf6" name="Rebid Count" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly rebid % trend */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Fleet Rebid Rate Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.monthly_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} domain={[0, 100]} />
                <Tooltip content={(props) => <ChartTooltip {...props} />} />
                <Line type="monotone" dataKey="rebid_pct" stroke="#f59e0b" strokeWidth={2} name="Rebid %" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SOFTWARE / TRADING PLATFORMS */}
      {activeSection === 'software' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Trading Platform Clusters</h3>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Identified from rebid explanation text signatures, price band fingerprints, and identical bid days.
              Projects using the same trading software produce distinctive explanation patterns.
            </p>
            <div className="space-y-4">
              <SoftwareCluster
                name="Tesla Autobidder"
                confidence="Confirmed"
                color="#10b981"
                evidence="Explicit 'Autobidder' mentions in rebid explanations. SOC management patterns, model failure references."
                projects={['Ballarat BESS (EnergyAustralia)', 'Riverina BESS (EnergyAustralia)', 'Waratah Super Battery (partial)']}
                characteristics={[
                  'Explicit "Autobidder deactivated" / "auto bidder failure" messages',
                  'Detailed SOC deviation reporting ("State of charge was X.XMWh higher/lower than expected")',
                  'Defensive LOAD strategy (cap <$2K) — charge cheap only',
                  'Very high rebid rates (91-94%)',
                ]}
              />
              <SoftwareCluster
                name="Fluence/MONDO Platform"
                confidence="High"
                color="#3b82f6"
                evidence="Region-specific price format ('QLD1 5MIN PD RRP FOR 0430 ($XX.XX)'), 'EXTERNAL PRICE FORECAST' pattern shared across multiple MONDO-operated assets."
                projects={['Hazelwood BESS (MONDO/ENGIE)', 'Pine Lodge BESS (MONDO)', 'Brendale BESS', 'Waratah Super Battery', 'LaTrobe Valley BESS']}
                characteristics={[
                  'Regional price references in rebid explanations (QLD1/NSW1/VIC1/SA1)',
                  '"DUE TO EXTERNAL PRICE FORECAST - SL" standardised messages',
                  'Aggressive LOAD strategy (cap near MPC)',
                  'Highest rebid rates in fleet (94-98%)',
                ]}
              />
              <SoftwareCluster
                name="AGL Trading Platform"
                confidence="High"
                color="#f59e0b"
                evidence="99.6% 'Capability Change' pattern at Torrens Island, 86% at Wandoan, 96% at Broken Hill. All AGL participant IDs."
                projects={['Torrens Island BESS (AGL)', 'Wandoan South BESS (AGL)', 'Broken Hill BESS (AGL/Macquarie)']}
                characteristics={[
                  '"Capability Change ENERGY, LOWER1SEC..." pattern',
                  'Systematic capability-driven rebids rather than price-driven',
                  'Extremely high rebid rates (98-99%)',
                  'Aggressive LOAD strategy',
                ]}
              />
              <SoftwareCluster
                name="Timestamp-P Platform"
                confidence="Medium"
                color="#8b5cf6"
                evidence="Distinctive 'HH:MM:SS P CHANGE IN SOC FORECAST' format shared by Blyth and Capital Battery. Also partially used by Western Downs."
                projects={['Blyth BESS (SA)', 'Capital Battery (ACT)', 'Western Downs Battery (partial)']}
                characteristics={[
                  'Timestamp-prefixed rebid explanations (e.g., "17:58:03 P CHANGE IN SOC FORECAST")',
                  'SOC-centric rebid reasoning',
                  'Mixed LOAD strategies',
                  'Moderate rebid rates (60-65%)',
                ]}
              />
              <SoftwareCluster
                name="Neoen/Shell Trading"
                confidence="Medium"
                color="#ec4899"
                evidence="Shared 'Change in forecast SOC', 'SOE approaching limits', 'Internal price forecast differs from AEMO' patterns. HPR and VBB show very similar bid shapes."
                projects={['Hornsdale Power Reserve (Neoen→HMCA)', 'Victorian Big Battery (Neoen→HMCA)', 'Wallgrove Grid Battery', 'Bouldercombe Battery']}
                characteristics={[
                  '"Internal price forecast expectation differs from the AEMO price" — internal vs AEMO price model',
                  '"Change in forecasted enablement SL" — FCAS enablement tracking',
                  'Aggressive strategy with sophisticated mid-band pricing',
                  'High rebid rates (95-97%)',
                ]}
              />
              <SoftwareCluster
                name="Origin/NS Energy Platform"
                confidence="Medium"
                color="#06b6d4"
                evidence="Eraring and Supernode share 'Plant Conditions - Match traps to unit availability' pattern AND had 17 identical bid days."
                projects={['Eraring Battery (Origin/NS Energy)', 'Supernode BESS (Quinbrook/NS Energy)']}
                characteristics={[
                  '"Plant Conditions - Match traps to unit availability SL" pattern',
                  '17 days of identical GEN ENERGY price bands',
                  'Both rapidly increasing rebid sophistication over time',
                  'Moderate LOAD strategy',
                ]}
              />
              <SoftwareCluster
                name="CS Energy"
                confidence="Confirmed"
                color="#84cc16"
                evidence="Unique 'Update trapezium availability' pattern (77% of rebids). CS Energy participant ID."
                projects={['Chinchilla BESS (CS Energy)']}
                characteristics={[
                  '"Update trapezium availability - rebid to match SCADA or expected" — unique to CS Energy',
                  '"Managing Available Energy - SOC MWh" pattern',
                  'Moderate LOAD strategy',
                  'High rebid rate (91%)',
                ]}
              />
            </div>
          </div>

          {/* Participant changes */}
          {data.insights.participant_changes.length > 0 && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">Trading Entity Changes</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-3">
                Projects where the registered participant ID changed — indicates ownership transfers or corporate restructures.
              </p>
              {data.insights.participant_changes.map(pc => (
                <div key={pc.project_id} className="border border-[var(--color-border)] rounded p-3 mb-2">
                  <Link to={projectSlug(pc.project_id)} className="text-sm text-[var(--color-accent)] hover:underline font-medium">
                    {pc.project_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {pc.changes.map((c, i) => (
                      <span key={i} className="text-xs bg-[var(--color-bg)] px-2 py-1 rounded border border-[var(--color-border)]">
                        <span className="font-medium text-[var(--color-text)]">{c.participant_id}</span>
                        <span className="text-[var(--color-text-muted)]"> ({c.first_seen} to {c.last_seen})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INSIGHTS */}
      {activeSection === 'insights' && (
        <div className="space-y-6">
          <InsightCard
            title="NSW BESS Concentration Risk"
            severity="high"
            detail={`Four mega-batteries (Waratah 850MW, Eraring 700MW, Liddell 500MW, Tomago 560MW = 2,610MW total) will be competing for the same NSW arbitrage opportunity. Current data shows new entrants like Eraring are already rapidly converging toward incumbent bidding strategies — rebid rates jumped from 28% to 98% in just 12 months. As these batteries mature, the arbitrage spread will compress, potentially creating a "winner's curse" where the fleet cannibalises its own revenue.`}
          />
          <InsightCard
            title="Market Price Cap Jump (July 2025)"
            severity="medium"
            detail={`The NEM Market Price Cap increased from ~$18,080 to ~$21,005/MWh in July 2025. All operators immediately adjusted their top price bands upward. This 16% increase in the theoretical maximum discharge price expands the arbitrage envelope. However, prices at the cap are rare — the real impact is psychological, widening the spread operators are willing to target.`}
          />
          <InsightCard
            title="Defensive vs Aggressive: Two BESS Business Models"
            severity="info"
            detail={`${data.insights.strategy_counts.defensive} projects (Ballarat, Dalrymple, Hazelwood, Riverina) cap LOAD bids at <$2,000 — they only charge when prices are very low. This is a "pure arbitrage" model. Meanwhile ${data.insights.strategy_counts.aggressive} projects bid LOAD caps near the MPC ($18-21K). These aggressive chargers may have contractual obligations (FCAS, tolling agreements) that require maintaining state of charge regardless of price.`}
          />
          <InsightCard
            title="Hornsdale's Declining Bid Aggression"
            severity="medium"
            detail={`HPR's GEN midpoint (PB5) peaked at $348/MWh in Q4 2024 and has declined to $122 by Q1 2026 — a 65% drop. The veteran of the NEM BESS fleet is becoming less aggressive as competition intensifies. Its target spread shrank from $307 to $107 over the same period. This is concrete evidence of fleet competition driving individual asset strategy adjustments.`}
          />
          <InsightCard
            title="New Entrant Sophistication Curve"
            severity="info"
            detail={`Eraring Battery and Supernode BESS both show a remarkable sophistication ramp. Eraring: Mar 2025 started with identical GEN/LOAD bids ($4 midpoint, 28% rebid rate) and by Feb 2026 had asymmetric pricing ($59 GEN / $34 LOAD) and 98% rebid rate. This ~12 month maturation cycle suggests new BESS operators need roughly one year to fully optimise their bidding algorithms.`}
          />
          <InsightCard
            title="FCAS Revenue Stacking"
            severity="info"
            detail={`${data.insights.fcas_full_stack.length} of ${data.data_range.total_projects} BESS projects bid into all 8 FCAS services (Raise/Lower x 6sec/60sec/5min + Raise/Lower Reg). ${data.insights.fcas_only_energy.length} projects (${data.insights.fcas_only_energy.join(', ')}) bid energy only — no FCAS. These energy-only projects are newer/smaller and likely haven't yet completed FCAS registration. FCAS stacking is critical for BESS revenue — early evidence suggests it may contribute 30-50% of total revenue.`}
          />
          <InsightCard
            title="Software Platform Convergence"
            severity="info"
            detail={`At least 7 distinct trading platforms identified from rebid explanation patterns. Tesla Autobidder (Ballarat/Riverina) is confirmed directly. The Fluence/MONDO platform shows characteristic regional price references. AGL's proprietary system dominates capability-driven rebids. As the fleet grows, platform choice increasingly influences strategy — platforms with faster rebid cycles and better price forecasting will capture more value.`}
          />
        </div>
      )}
      </div>{/* end pdfRef */}
    </div>
  )
}

// ---- Sub-components ----

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3">
      <div className="text-xs text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-xl font-bold text-[var(--color-text)]">
        {value}
        {sub && <span className="text-sm font-normal text-[var(--color-text-muted)] ml-1">{sub}</span>}
      </div>
    </div>
  )
}

function SoftwareCluster({ name, confidence, color, evidence, projects, characteristics }: {
  name: string; confidence: string; color: string
  evidence: string; projects: string[]; characteristics: string[]
}) {
  return (
    <div className="border border-[var(--color-border)] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-3 h-3 rounded-full" style={{ background: color }} />
        <span className="text-sm font-semibold text-[var(--color-text)]">{name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          confidence === 'Confirmed' ? 'bg-green-500/20 text-green-400' :
          confidence === 'High' ? 'bg-blue-500/20 text-blue-400' :
          'bg-yellow-500/20 text-yellow-400'
        }`}>{confidence}</span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">{evidence}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase mb-1">Projects</div>
          {projects.map((p, i) => <div key={i} className="text-xs text-[var(--color-text)]">{p}</div>)}
        </div>
        <div>
          <div className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase mb-1">Characteristics</div>
          {characteristics.map((c, i) => <div key={i} className="text-xs text-[var(--color-text-muted)]">{c}</div>)}
        </div>
      </div>
    </div>
  )
}

function InsightCard({ title, severity, detail }: { title: string; severity: 'high' | 'medium' | 'info'; detail: string }) {
  const colors = {
    high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400' },
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  }
  const c = colors[severity]
  return (
    <div className={`${c.bg} ${c.border} border rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-sm font-semibold ${c.text}`}>{title}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg} ${c.text}`}>{severity.toUpperCase()}</span>
      </div>
      <p className="text-xs text-[var(--color-text)] leading-relaxed">{detail}</p>
    </div>
  )
}
