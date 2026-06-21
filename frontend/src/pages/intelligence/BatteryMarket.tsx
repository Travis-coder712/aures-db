import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ComposedChart,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from 'recharts'
import { fetchBatteryMarket } from '../../lib/dataService'
import { exportElementToPdf } from '../../lib/exportPdf'
import type { BatteryMarketData } from '../../lib/types'
import DataProvenance from '../../components/common/DataProvenance'

// Icons — defined BEFORE const arrays (Vite HMR pattern)
const PriceSettingIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const RevenueIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const BiddingIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
const CannibIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
const WholesaleIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>

type SectionId = 'price-setting' | 'revenue' | 'bidding' | 'cannibalisation' | 'wholesale'

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'price-setting', label: 'Price Setting', icon: <PriceSettingIcon /> },
  { id: 'revenue', label: 'Revenue Trends', icon: <RevenueIcon /> },
  { id: 'bidding', label: 'Bidding Sophistication', icon: <BiddingIcon /> },
  { id: 'cannibalisation', label: 'Cannibalisation', icon: <CannibIcon /> },
  { id: 'wholesale', label: 'Wholesale Prices', icon: <WholesaleIcon /> },
]

const STATE_COLOURS: Record<string, string> = {
  nsw: '#3b82f6',
  qld: '#f59e0b',
  sa: '#ef4444',
  vic: '#8b5cf6',
  tas: '#10b981',
}

const TECH_COLOURS: Record<string, string> = {
  battery: '#10b981',
  gas: '#f59e0b',
  hydro: '#3b82f6',
  coal: '#6b7280',
}

const TIER_COLOURS: Record<string, string> = {
  elite: '#10b981',
  advanced: '#3b82f6',
  developing: '#f59e0b',
  early: '#6b7280',
}

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '-'
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
}

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

export default function BatteryMarket() {
  const [data, setData] = useState<BatteryMarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('price-setting')
  const [exporting, setExporting] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBatteryMarket().then(d => { setData(d); setLoading(false) })
  }, [])

  const handleExportPdf = async () => {
    if (!pdfRef.current || exporting) return
    setExporting(true)
    try {
      const sectionLabel = SECTIONS.find(s => s.id === activeSection)?.label || 'All'
      await exportElementToPdf(pdfRef.current, {
        filename: `Battery-Market-Intelligence-${sectionLabel.replace(/\s+/g, '-')}`,
        title: `Battery Market Intelligence — ${sectionLabel}`,
        subtitle: `AURES Intelligence · ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-bg-elevated)] rounded w-1/3" />
          <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-2/3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-[var(--color-bg-elevated)] rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <p className="text-[var(--color-text-muted)]">Failed to load battery market data.</p>
      </div>
    )
  }

  const { capacity_headline: cap, price_setting: ps, revenue_trends: rev, wholesale_prices: wp, cannibalisation: can, bidding_sophistication: bid } = data

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">Battery Market Intelligence</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Batteries are now the defining NEM story — price-setting, revenue cannibalisation, and the widening sophistication gap.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Price-Setting" value={`${ps.summary.pct_all}%`} sub={`of all intervals (${ps.summary.period})`} colour="#10b981" />
        <KpiCard label="Avg Revenue" value={`$${rev.nem_avg_k_mw_yr}k`} sub={`/MW/yr (${rev.yoy_change_pct}% YoY)`} colour="#f59e0b" negative />
        <KpiCard label="Installed" value={`${cap.installed_gw} GW`} sub={`+${cap.capacity_added_since_q1_2025_gw} GW since Q1 2025`} colour="#3b82f6" />
        <KpiCard label="Renewables" value={`${cap.renewables_pct_q1_2026}%`} sub="of NEM supply Q1 2026" colour="#8b5cf6" />
      </div>

      {/* Section nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeSection === s.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div ref={pdfRef}>
        {activeSection === 'price-setting' && <PriceSettingSection data={ps} />}
        {activeSection === 'revenue' && <RevenueSection data={rev} />}
        {activeSection === 'bidding' && <BiddingSection data={bid} />}
        {activeSection === 'cannibalisation' && <CannibalisationSection data={can} cap={cap} />}
        {activeSection === 'wholesale' && <WholesaleSection data={wp} />}
      </div>

      {/* Key Insights */}
      <div className="mt-8 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Key Insights</h3>
        <ul className="space-y-2">
          {data.key_insights.map((insight, i) => (
            <li key={i} className="flex gap-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="text-[var(--color-primary)] mt-0.5 shrink-0">&#9679;</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* Cross-links */}
      <div className="mt-6 flex flex-wrap gap-2">
        {[
          { to: '/intelligence/bess-bidding', label: 'BESS Bidding' },
          { to: '/intelligence/bess-portfolio', label: 'BESS Portfolio' },
          { to: '/intelligence/battery-watch', label: 'Battery Watch' },
          { to: '/intelligence/bess-records', label: 'BESS Records' },
          { to: '/intelligence/bess-capex', label: 'BESS Capex' },
          { to: '/intelligence/revenue', label: 'Revenue Intel' },
        ].map(link => (
          <Link
            key={link.to}
            to={link.to}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/30 transition-colors"
          >
            {link.label} &rarr;
          </Link>
        ))}
      </div>

      {/* Data Provenance */}
      <div className="mt-6">
        <DataProvenance page="battery-market" />
      </div>
    </div>
  )
}

// ---------- KPI Card ----------

function KpiCard({ label, value, sub, colour, negative }: {
  label: string; value: string; sub: string; colour: string; negative?: boolean
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
      <div className="text-xs text-[var(--color-text-muted)] mb-1">{label}</div>
      <div className="text-xl lg:text-2xl font-bold" style={{ color: colour }}>{value}</div>
      <div className={`text-xs mt-1 ${negative ? 'text-red-400' : 'text-[var(--color-text-muted)]'}`}>{sub}</div>
    </div>
  )
}

// ---------- Section: Price Setting ----------

function PriceSettingSection({ data }: { data: BatteryMarketData['price_setting'] }) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Price-Setting Frequency by Technology</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Share of NEM trading intervals where each technology sets the marginal price. Batteries now dominate evening peaks ({data.summary.pct_evening}%) and midday solar surplus ({data.summary.pct_midday_solar}%).
        </p>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.by_quarter}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="battery" name="Battery" stackId="1" fill={TECH_COLOURS.battery} stroke={TECH_COLOURS.battery} fillOpacity={0.7} />
              <Area type="monotone" dataKey="gas" name="Gas" stackId="1" fill={TECH_COLOURS.gas} stroke={TECH_COLOURS.gas} fillOpacity={0.7} />
              <Area type="monotone" dataKey="hydro" name="Hydro" stackId="1" fill={TECH_COLOURS.hydro} stroke={TECH_COLOURS.hydro} fillOpacity={0.7} />
              <Area type="monotone" dataKey="coal" name="Coal" stackId="1" fill={TECH_COLOURS.coal} stroke={TECH_COLOURS.coal} fillOpacity={0.7} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Callout cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <CalloutCard value={`${data.summary.pct_all}%`} label="All intervals" colour={TECH_COLOURS.battery} />
        <CalloutCard value={`${data.summary.pct_evening}%`} label="Evening peaks" colour="#f59e0b" />
        <CalloutCard value={`${data.summary.pct_midday_solar}%`} label="Midday solar surplus" colour="#ef4444" />
      </div>
    </div>
  )
}

// ---------- Section: Revenue Trends ----------

function RevenueSection({ data }: { data: BatteryMarketData['revenue_trends'] }) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Revenue per MW by State</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Quarterly revenue trends ($k/MW/yr). NEM average fell {Math.abs(data.yoy_change_pct)}% YoY to ${data.nem_avg_k_mw_yr}k/MW/yr. May 2026 hit ${data.may_2026_k_mw_yr}k — lowest since Modo began tracking (Jul 2022).
        </p>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.by_quarter}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="nsw" name="NSW" stroke={STATE_COLOURS.nsw} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="qld" name="QLD" stroke={STATE_COLOURS.qld} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sa" name="SA" stroke={STATE_COLOURS.sa} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="vic" name="VIC" stroke={STATE_COLOURS.vic} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QLD callout */}
      <div className="bg-[var(--color-bg-card)] border border-amber-500/30 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-amber-400 mb-2">QLD — The Canary</h4>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          QLD energy-only revenues dropped <span className="text-amber-400 font-medium">{data.qld_energy_only_yoy_drop_pct}%</span> as BESS capacity grew <span className="text-amber-400 font-medium">{data.qld_bess_capacity_growth_factor}x</span>. NSW and VIC are 12-18 months behind on the same curve.
        </p>
      </div>
    </div>
  )
}

// ---------- Section: Bidding Sophistication ----------

function BiddingSection({ data }: { data: BatteryMarketData['bidding_sophistication'] }) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Spread Capture by Entity</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Estimated spread capture as a percentage of theoretical maximum. Elite operators capture roughly 2x the spread of early-stage entrants.
        </p>
        <div className="h-80 lg:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.top_performers} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <YAxis type="category" dataKey="entity" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} width={140} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs max-w-xs">
                      <div className="font-medium text-[var(--color-text)] mb-1">{d.entity}</div>
                      <div className="text-[var(--color-text-muted)]">{d.state} · {d.tier}</div>
                      <div className="text-[var(--color-text)] font-medium mt-1">{d.spread_capture_pct}% spread capture</div>
                      <div className="text-[var(--color-text-muted)] mt-1">{d.note}</div>
                    </div>
                  )
                }}
              />
              <Bar dataKey="spread_capture_pct" name="Spread Capture %"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                shape={(props: any) => {
                  const { x, y, width, height, payload } = props
                  const colour = TIER_COLOURS[payload.tier] || '#6b7280'
                  return <rect x={x} y={y} width={width} height={height} fill={colour} rx={3} />
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {Object.entries(TIER_COLOURS).map(([tier, colour]) => (
            <div key={tier} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: colour }} />
              <span className="capitalize">{tier}</span>
              <span>({'≥'}{data.tier_thresholds[tier]}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Insight */}
      <div className="bg-[var(--color-bg-card)] border border-emerald-500/30 rounded-xl p-5">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{data.insight}</p>
      </div>
    </div>
  )
}

// ---------- Section: Cannibalisation ----------

function CannibalisationSection({ data, cap }: { data: BatteryMarketData['cannibalisation']; cap: BatteryMarketData['capacity_headline'] }) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Installed Capacity vs Revenue per MW</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          NEM-wide: as installed BESS capacity grows, revenue per MW compresses. Pipeline of {cap.pipeline_gw} GW ({cap.pipeline_pct_queue}% of connection queue) suggests further compression ahead. Modo projects {cap.modo_projected_gw_end_2027} GW online by end 2027.
        </p>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.by_quarter}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${v} GW`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="installed_gw" name="Installed GW" fill="#3b82f6" fillOpacity={0.6} radius={[3, 3, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="revenue_k_mw_yr" name="Revenue $k/MW/yr" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State breakdown */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">State Breakdown (Latest)</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {data.by_state_latest.map(s => (
            <div key={s.state} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="text-xs text-[var(--color-text-muted)]">{s.state}</div>
              <div className="text-lg font-bold" style={{ color: STATE_COLOURS[s.state.toLowerCase()] || '#6b7280' }}>
                ${fmt(s.revenue_k_mw_yr)}k
              </div>
              <div className="text-xs text-[var(--color-text-muted)]">{s.installed_gw} GW installed</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Section: Wholesale Prices ----------

function WholesaleSection({ data }: { data: BatteryMarketData['wholesale_prices'] }) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">State-by-State Wholesale Price Trends</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          NEM wholesale averaged ~${data.nem_avg_q1_2026}/MWh in Q1 2026, down {Math.abs(data.yoy_change_pct)}% YoY.
        </p>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.by_quarter}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="nsw" name="NSW" stroke={STATE_COLOURS.nsw} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="qld" name="QLD" stroke={STATE_COLOURS.qld} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="sa" name="SA" stroke={STATE_COLOURS.sa} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="vic" name="VIC" stroke={STATE_COLOURS.vic} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="tas" name="TAS" stroke={STATE_COLOURS.tas} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* May 2026 YoY by state */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">May 2026 — Year-on-Year Change</h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(data.may_2026_yoy_by_state).map(([state, pct]) => (
            <div key={state} className="bg-[var(--color-bg-elevated)] rounded-lg p-3 text-center">
              <div className="text-xs text-[var(--color-text-muted)] uppercase">{state}</div>
              <div className={`text-lg font-bold ${pct < -20 ? 'text-red-400' : pct < -10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {pct > 0 ? '+' : ''}{pct}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Shared ----------

function CalloutCard({ value, label, colour }: { value: string; label: string; colour: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 text-center">
      <div className="text-2xl font-bold" style={{ color: colour }}>{value}</div>
      <div className="text-xs text-[var(--color-text-muted)] mt-1">{label}</div>
    </div>
  )
}
