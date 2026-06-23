import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, LineChart, Line, Bar,
  ComposedChart,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend,
} from 'recharts'
import { fetchBatteryMarket, fetchNemContractPrices } from '../../lib/dataService'
import { exportElementToPdf } from '../../lib/exportPdf'
import type { BatteryMarketData } from '../../lib/types'
import DataProvenance from '../../components/common/DataProvenance'

// Icons — defined BEFORE const arrays (Vite HMR pattern)
const OverviewIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
const PriceSettingIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
const RevenueIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
const BiddingIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
const CannibIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
const WholesaleIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
const StateIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
const OutlookIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
const ContractIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>

type SectionId = 'overview' | 'price-setting' | 'revenue' | 'bidding' | 'cannibalisation' | 'wholesale' | 'contracts' | 'states' | 'outlook'

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <OverviewIcon /> },
  { id: 'price-setting', label: 'Price Setting', icon: <PriceSettingIcon /> },
  { id: 'revenue', label: 'Revenue', icon: <RevenueIcon /> },
  { id: 'bidding', label: 'Bidding', icon: <BiddingIcon /> },
  { id: 'cannibalisation', label: 'Cannibalisation', icon: <CannibIcon /> },
  { id: 'wholesale', label: 'Wholesale', icon: <WholesaleIcon /> },
  { id: 'contracts', label: 'Contracts', icon: <ContractIcon /> },
  { id: 'states', label: 'By State', icon: <StateIcon /> },
  { id: 'outlook', label: 'Outlook', icon: <OutlookIcon /> },
]

const STATE_COLOURS: Record<string, string> = {
  nsw: '#3b82f6', qld: '#f59e0b', sa: '#ef4444', vic: '#8b5cf6', tas: '#10b981',
}

const TECH_COLOURS: Record<string, string> = {
  battery: '#10b981', gas: '#f59e0b', hydro: '#3b82f6', coal: '#6b7280',
}

const TIER_COLOURS: Record<string, string> = {
  elite: '#10b981', advanced: '#3b82f6', developing: '#f59e0b', early: '#6b7280',
}

const STATE_LABELS: Record<string, string> = { nsw: 'NSW', qld: 'QLD', sa: 'SA', vic: 'VIC', tas: 'TAS' }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contractData, setContractData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [exporting, setExporting] = useState(false)
  const pdfRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([fetchBatteryMarket(), fetchNemContractPrices()]).then(([d, c]) => {
      setData(d); setContractData(c); setLoading(false)
    })
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
            Batteries are now the defining NEM story — price-setting in 32% of intervals, revenue cannibalisation accelerating, and the fleet doubling in 12 months.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPdf} disabled={exporting}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50">
            {exporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Price-Setting" value={`${ps.summary.pct_all}%`} sub={`of all intervals (${ps.summary.period})`} colour="#10b981" />
        <KpiCard label="Revenue" value={`$${rev.nem_avg_k_mw_yr}k`} sub={`/MW/yr (${rev.yoy_change_pct}% YoY)`} colour="#f59e0b" negative />
        <KpiCard label="Fleet" value={`${cap.installed_gw} GW`} sub={`${cap.registered_units} units / ${cap.installed_gwh} GWh`} colour="#3b82f6" />
        <KpiCard label="Pipeline" value={`${cap.pipeline_gw} GW`} sub={`${cap.pipeline_pct_queue}% of connection queue`} colour="#8b5cf6" />
      </div>

      {/* Section nav */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeSection === s.id
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}>
            {s.icon}{s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div ref={pdfRef}>
        {activeSection === 'overview' && <OverviewSection data={data} />}
        {activeSection === 'price-setting' && <PriceSettingSection data={ps} />}
        {activeSection === 'revenue' && <RevenueSection data={rev} />}
        {activeSection === 'bidding' && <BiddingSection data={bid} />}
        {activeSection === 'cannibalisation' && <CannibalisationSection data={can} cap={cap} />}
        {activeSection === 'wholesale' && <WholesaleSection data={wp} />}
        {activeSection === 'contracts' && contractData && <ContractMarketSection data={contractData} />}
        {activeSection === 'states' && <StateSection data={data} />}
        {activeSection === 'outlook' && <OutlookSection data={data} />}
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
          { to: '/intelligence/research', label: 'Research Notes' },
        ].map(link => (
          <Link key={link.to} to={link.to}
            className="px-3 py-1.5 text-xs rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)]/30 transition-colors">
            {link.label} &rarr;
          </Link>
        ))}
      </div>

      <div className="mt-6"><DataProvenance page="battery-market" /></div>
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

// ---------- Section: Overview ----------

function OverviewSection({ data }: { data: BatteryMarketData }) {
  const cap = data.capacity_headline
  return (
    <div className="space-y-6">
      {/* Headline narrative */}
      <div className="bg-[var(--color-bg-card)] border border-emerald-500/30 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-emerald-400 mb-2">The Defining NEM Story</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{cap.note}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <MiniStat label="Start of 2025" value={`${cap.capacity_start_2025_gw} GW`} />
          <MiniStat label="End of 2025" value={`${cap.capacity_end_2025_gw} GW`} />
          <MiniStat label="Now (Q1 2026)" value={`${cap.installed_gw} GW`} />
          <MiniStat label="End 2027 (Modo)" value={`${cap.modo_projected_gw_end_2027} GW`} />
        </div>
      </div>

      {/* Fleet milestones timeline */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">Fleet Milestones</h3>
        <div className="space-y-3">
          {data.fleet_milestones.map((m, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="shrink-0 w-16 text-right">
                <span className="text-xs font-mono text-[var(--color-text-muted)]">{m.date}</span>
              </div>
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                {i < data.fleet_milestones.length - 1 && <div className="w-px h-full bg-[var(--color-border)] min-h-[16px]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--color-text)] leading-relaxed">{m.event}</div>
                <div className="text-[10px] text-emerald-400 font-medium">{m.fleet_gw} GW</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStatCard label="Under Construction" value={`${cap.under_construction_gw} GW`} colour="#3b82f6" />
        <MiniStatCard label="Total Pipeline" value={`${cap.pipeline_total_gw} GW`} colour="#8b5cf6" />
        <MiniStatCard label="ISP 2030 Target" value={`${cap.isp_2026_target_gw_2030} GW`} colour="#f59e0b" />
        <MiniStatCard label="Renewables Q1 2026" value={`${cap.renewables_pct_q1_2026}%`} colour="#10b981" />
      </div>
    </div>
  )
}

// ---------- Section: Price Setting ----------

function PriceSettingSection({ data }: { data: BatteryMarketData['price_setting'] }) {
  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Price-Setting Frequency by Technology</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">{data.summary.note}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <CalloutCard value={`${data.summary.pct_all}%`} label="All intervals" colour={TECH_COLOURS.battery} />
        <CalloutCard value={`${data.summary.pct_evening}%`} label="Evening peaks" colour="#f59e0b" />
        <CalloutCard value={`${data.summary.pct_midday_solar}%`} label="Midday solar surplus" colour="#ef4444" />
      </div>

      {/* Time of day detail */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">How Batteries Reshape the Price Curve</h4>
        <div className="space-y-3">
          {Object.entries(data.time_of_day).map(([key, text]) => (
            <div key={key} className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="text-[var(--color-text)] font-medium capitalize">{key.replace(/_/g, ' ').replace(' note', '')}:</span> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Section: Revenue Trends ----------

function RevenueSection({ data }: { data: BatteryMarketData['revenue_trends'] }) {
  return (
    <div className="space-y-6">
      {/* Monthly revenue chart */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Monthly Revenue per MW</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          {data.period_measured}: NEM average fell {Math.abs(data.yoy_change_pct)}% YoY to ${data.nem_avg_k_mw_yr}k/MW/yr. May 2026 hit ${data.may_2026_k_mw_yr}k — all-time low.
        </p>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.by_month}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}k`} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs">
                    <div className="font-medium text-[var(--color-text)]">{d.period}</div>
                    <div className="text-emerald-400 font-medium">${fmt(d.revenue_k)}k/MW/yr</div>
                    {d.note && <div className="text-[var(--color-text-muted)] mt-1 max-w-[200px]">{d.note}</div>}
                  </div>
                )
              }} />
              <Bar dataKey="revenue_k" name="Revenue $k/MW/yr" fill="#10b981" fillOpacity={0.6} radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State breakdown Q1 2026 */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">State Revenue — Q1 2026</h4>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(data.by_state_q1_2026).map(([state, info]) => (
            <div key={state} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="text-xs text-[var(--color-text-muted)] uppercase">{state}</div>
              <div className="text-lg font-bold" style={{ color: STATE_COLOURS[state] || '#6b7280' }}>
                ${fmt(Number(info.revenue_k))}k
              </div>
              <div className={`text-[10px] ${Number(info.yoy_pct) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {Number(info.yoy_pct) > 0 ? '+' : ''}{info.yoy_pct}% YoY
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QLD callout */}
      <div className="bg-[var(--color-bg-card)] border border-amber-500/30 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-amber-400 mb-2">QLD — The Canary</h4>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Energy-only revenues dropped <span className="text-amber-400 font-medium">{data.qld_collapse_detail.energy_only_yoy_drop_pct}%</span> as
          BESS capacity grew <span className="text-amber-400 font-medium">{data.qld_collapse_detail.bess_capacity_growth_factor}x</span>.
          Spreads fell from ${data.qld_collapse_detail.prior_year_spread_per_mwh}/MWh to ${data.qld_collapse_detail.q1_2026_spread_per_mwh}/MWh.
          {' '}{data.qld_collapse_detail.note}
        </p>
      </div>
    </div>
  )
}

// ---------- Section: Bidding Sophistication ----------

function BiddingSection({ data }: { data: BatteryMarketData['bidding_sophistication'] }) {
  return (
    <div className="space-y-6">
      {/* Capture rate leaders */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Q1 2026 Capture Rate Leaders</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          NEM average capture rate: {data.nem_avg_capture_rate_q1_2026_pct}% — {data.capture_rate_note}
        </p>
        <div className="space-y-2">
          {data.top_performers_q1_2026.map((p, i) => (
            <div key={i} className="flex items-center gap-3 bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: TIER_COLOURS[p.tier] + '30', color: TIER_COLOURS[p.tier] }}>
                {p.rank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[var(--color-text)]">{p.entity}</div>
                <div className="text-[10px] text-[var(--color-text-muted)]">{p.state} · {p.capture_rate_note}</div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: TIER_COLOURS[p.tier] + '20', color: TIER_COLOURS[p.tier] }}>
                {p.tier}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trading platforms */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Trading Platforms</h4>
        <div className="space-y-2">
          {data.trading_platforms.map((tp, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <div className="w-24 shrink-0 font-medium text-[var(--color-text)]">{tp.platform}</div>
              <div className="w-16 shrink-0 text-emerald-400">{tp.assets_mw} MW</div>
              <div className="text-[var(--color-text-muted)] flex-1">{tp.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Duration advantage */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Duration Economics</h4>
        <div className="space-y-3">
          {Object.entries(data.duration_advantage).map(([key, text]) => (
            <div key={key} className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="text-[var(--color-text)] font-medium">{key.replace(/_/g, ' ')}:</span> {text}
            </div>
          ))}
        </div>
      </div>

      {/* Rebidding insight */}
      <div className="bg-[var(--color-bg-card)] border border-blue-500/30 rounded-xl p-5">
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{data.rebidding_insight}</p>
      </div>

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
          Pipeline of {cap.pipeline_gw} GW ({cap.pipeline_pct_queue}% of queue). Modo projects {cap.modo_projected_gw_end_2027} GW by end 2027.
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
              <Line yAxisId="right" type="monotone" dataKey="spread_per_mwh" name="Spread $/MWh" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
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
              <div className="text-[10px] text-[var(--color-text-muted)]">{s.installed_gw} GW · ${s.spread_per_mwh}/MWh spread</div>
            </div>
          ))}
        </div>
      </div>

      {/* Is there a floor? */}
      <div className="bg-[var(--color-bg-card)] border border-red-500/30 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-red-400 mb-2">Is There a Floor? {data.is_there_a_floor.answer}</h4>
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-[var(--color-text)] mb-2">Evidence of continued decline:</div>
            <ul className="space-y-1">
              {data.is_there_a_floor.evidence.map((e, i) => (
                <li key={i} className="text-xs text-[var(--color-text-muted)] leading-relaxed flex gap-2">
                  <span className="text-red-400 shrink-0">&#9679;</span>{e}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-medium text-[var(--color-text)] mb-2">Potential stabilisers:</div>
            <ul className="space-y-1">
              {data.is_there_a_floor.potential_stabilisers.map((s, i) => (
                <li key={i} className="text-xs text-[var(--color-text-muted)] leading-relaxed flex gap-2">
                  <span className="text-emerald-400 shrink-0">&#9679;</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-xs text-amber-400/80 leading-relaxed border-t border-[var(--color-border)] pt-3 mt-3">
            {data.is_there_a_floor.wattclarity_battery_correlation_penalty}
          </div>
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
              {Object.keys(STATE_COLOURS).map(s => (
                <Line key={s} type="monotone" dataKey={s} name={STATE_LABELS[s]} stroke={STATE_COLOURS[s]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* April collapse */}
      <div className="bg-[var(--color-bg-card)] border border-red-500/30 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-red-400 mb-2">April 2026 Price Collapse</h4>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          VIC hit ${data.april_2026_collapse.vic}/MWh ({data.april_2026_collapse.vic_yoy_pct}% YoY) — lowest mainland price.
          SA fell to ${data.april_2026_collapse.sa}/MWh ({data.april_2026_collapse.sa_yoy_pct}% YoY).
          NEM average down {Math.abs(data.april_2026_collapse.nem_avg_yoy_pct)}% YoY.
        </p>
      </div>

      {/* Structural drivers */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Structural Drivers</h4>
        <ul className="space-y-1.5">
          {data.structural_drivers.map((d, i) => (
            <li key={i} className="flex gap-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="text-[var(--color-primary)] mt-0.5 shrink-0">&#9679;</span>{d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ---------- Section: By State ----------

function StateSection({ data }: { data: BatteryMarketData }) {
  const [activeState, setActiveState] = useState<string>('nsw')
  const states = Object.entries(data.commissioned_by_state).filter(([, s]) => s.major_projects.length > 0 || s.pipeline.length > 0)

  return (
    <div className="space-y-6">
      {/* State pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {states.map(([key]) => (
          <button key={key} onClick={() => setActiveState(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeState === key
                ? 'text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
            style={activeState === key ? { background: STATE_COLOURS[key] || '#6b7280' } : undefined}>
            {STATE_LABELS[key] || key.toUpperCase()}
          </button>
        ))}
      </div>

      {states.filter(([key]) => key === activeState).map(([key, stateData]) => (
        <div key={key} className="space-y-4">
          {/* State header */}
          <div className="grid grid-cols-2 gap-3">
            <MiniStatCard label="Operating" value={`${fmt(stateData.operating_mw)} MW`} colour={STATE_COLOURS[key] || '#6b7280'} />
            <MiniStatCard label="Storage" value={`${fmt(stateData.operating_mwh)} MWh`} colour={STATE_COLOURS[key] || '#6b7280'} />
          </div>

          {stateData.note && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{stateData.note}</p>
            </div>
          )}

          {stateData.warning && (
            <div className="bg-[var(--color-bg-card)] border border-amber-500/30 rounded-xl p-4">
              <p className="text-xs text-amber-400 leading-relaxed">{stateData.warning}</p>
            </div>
          )}

          {/* Operating projects */}
          {stateData.major_projects.length > 0 && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Operating &amp; Commissioning</h4>
              <div className="space-y-3">
                {stateData.major_projects.map((p, i) => (
                  <div key={i} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--color-text)]">{p.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        p.status === 'operating' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{p.status}</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)] space-y-0.5">
                      <div>{p.mw} MW / {p.mwh} MWh ({p.duration_hours}hr) · {p.developer}</div>
                      <div>Commissioned: {p.date} · Revenue: {p.revenue_model}</div>
                      {p.note && <div className="text-[var(--color-text-muted)]/70 italic">{p.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pipeline */}
          {stateData.pipeline.length > 0 && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Pipeline — Under Construction / Expected</h4>
              <div className="space-y-2">
                {stateData.pipeline.map((p, i) => (
                  <div key={i} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-[var(--color-text)]">{p.name}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">{p.expected}</span>
                    </div>
                    <div className="text-[10px] text-[var(--color-text-muted)]">
                      {p.mw} MW / {p.mwh} MWh · {p.developer}
                      {p.note && <span className="italic"> · {p.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------- Section: Outlook ----------

function OutlookSection({ data }: { data: BatteryMarketData }) {
  const outlook = data.forward_outlook
  const fcas = data.fcas_analysis

  return (
    <div className="space-y-6">
      {/* Structural shift */}
      <div className="bg-[var(--color-bg-card)] border border-emerald-500/30 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-emerald-400 mb-2">The Structural Shift</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{outlook.structural_shift}</p>
      </div>

      {/* NEM-wide investment difficulty */}
      <div className="bg-[var(--color-bg-card)] border-2 border-red-500/30 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-red-400 mb-3">The Difficulty of Investing in NEM Batteries Today</h4>
        <div className="space-y-2 mb-4">
          {[
            'Revenue per MW has collapsed from $118k (Q1 2024) to $29k (May 2026) — the lowest since tracking began. Most project finance structures require $50k+/MW/yr to service debt.',
            'The forward curve shows no recovery: QLD flat at ~$79/MWh through CY29, NSW flat at ~$104/MWh. The market has priced in permanently suppressed volatility.',
            'NEM-wide price spreads compressed 34% in one year ($183→$121/MWh). Every new GW of BESS capacity compresses returns for all participants — the cannibalisation is self-reinforcing.',
            'FCAS is structurally saturated at 9% of total revenue and declining. Cap contract payouts are compressing as the battery fleet absorbs the price spikes that used to drive cap value.',
            'Behind-the-meter batteries (219,000 systems, 4.7 GWh since July 2025 federal subsidy) are compressing grid-scale margins from the demand side — charging from rooftop solar, discharging at the same evening peak that grid-scale batteries target.',
            'CIS contracts underwrite revenue floors but create a moral hazard: government-underwritten capacity erodes merchant returns, potentially requiring even more government intervention to sustain deployment.',
          ].map((point, i) => (
            <div key={i} className="flex gap-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="text-red-400 shrink-0 mt-0.5">&#9679;</span>{point}
            </div>
          ))}
        </div>
      </div>

      {/* State-by-state investment positioning */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">State-by-State Investment Position</h4>
        <div className="space-y-3">
          {[
            { state: 'SA', colour: '#ef4444', position: 'Best positioned', detail: 'Highest spreads ($328/MWh vs QLD $78/MWh), rising forward curve ($88→$94 CY26-29), interconnection constraints create localised BESS opportunity. Limited by connection availability.' },
            { state: 'NSW', colour: '#3b82f6', position: 'Asymmetric opportunity', detail: 'Eraring 2.88 GW retirement (2027-29) is the single largest supply removal in NEM history. Forward curve at ~$104/MWh doesn\'t fully price it. BESS projects that survive the 2026-27 revenue trough benefit from the coming supply shock — but timing risk if closure is delayed.' },
            { state: 'VIC', colour: '#8b5cf6', position: 'Improving with patience', detail: 'Yallourn 1.48 GW retirement (mid 2028) will tighten supply. Forward curve gradually pricing it in ($75→$83 CY26-29). BESS investment case improves over time but requires patience through the trough.' },
            { state: 'QLD', colour: '#f59e0b', position: 'Worst positioned', detail: 'Flat forward curve at ~$79/MWh, smallest coal retirement (Callide B 700 MW vs 2,400+ MW committed BESS arriving same window), most saturated fleet, worst spreads ($78/MWh). Data centre demand less pronounced than NSW/VIC. Last priority for new merchant BESS capital.' },
          ].map(s => (
            <div key={s.state} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold" style={{ color: s.colour }}>{s.state}</span>
                <span className="text-xs text-[var(--color-text)]">{s.position}</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{s.detail}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-amber-400 mt-4 leading-relaxed">
          Investment hierarchy for new BESS capital: SA &gt; NSW &gt; VIC &gt;&gt; QLD.
          Watch the forward peak-to-trough spread on ASX — when it starts widening, the market is pricing in coal retirement scarcity.
        </p>
      </div>

      {/* Coal retirements */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Coal Retirements — Key Revenue Recovery Driver</h4>
        <div className="space-y-3">
          {outlook.coal_retirements.map((cr, i) => (
            <div key={i} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--color-text)]">{cr.plant}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{cr.state}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{cr.date}</span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">{cr.impact}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demand growth */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Demand Growth Drivers</h4>
        <ul className="space-y-1.5">
          {outlook.demand_growth.map((d, i) => (
            <li key={i} className="flex gap-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="text-emerald-400 shrink-0">&#9679;</span>{d}
            </li>
          ))}
        </ul>
      </div>

      {/* FCAS analysis */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-1">FCAS Revenue — {fcas.pct_of_total_revenue}% of Total</h4>
        <p className="text-xs text-amber-400 mb-3">{fcas.trend}</p>
        <ul className="space-y-1.5">
          {fcas.detail.map((d, i) => (
            <li key={i} className="flex gap-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
              <span className="text-amber-400 shrink-0">&#9679;</span>{d}
            </li>
          ))}
        </ul>
      </div>

      {/* Rule changes */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h4 className="text-sm font-semibold text-[var(--color-text)] mb-3">Rule Changes</h4>
        <div className="space-y-2">
          {outlook.rule_changes.map((rc, i) => (
            <div key={i} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-[var(--color-text)]">{rc.change}</span>
                {rc.date && <span className="text-[10px] text-[var(--color-text-muted)]">{rc.date}</span>}
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">{rc.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Section: Contract Market ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ContractMarketSection({ data }: { data: any }) {
  const spots = data.quarterly_spot_prices?.data || []
  const caps = data.cap_contract_prices?.data || []
  const fwd = data.forward_curve?.dec_2025_close || {}
  const fwdMay = data.forward_curve?.may_2026_close || {}
  const spreads = data.spread_analysis?.by_state_q1_2026 || {}
  const hierarchy = data.investment_hierarchy || {}

  const forwardChartData = ['cy26', 'cy27', 'cy28', 'cy29'].map(yr => ({
    year: yr.toUpperCase(),
    nsw: fwd.nsw?.[yr] || null,
    qld: fwd.qld?.[yr] || null,
    vic: fwd.vic?.[yr] || null,
    sa: fwd.sa?.[yr] || null,
    qld_may: fwdMay.qld?.[yr] || null,
  }))

  return (
    <div className="space-y-6">
      {/* Quarterly spot prices by state */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Quarterly Wholesale Spot Prices by State</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Volume-weighted average $/MWh. Source: AEMO QED + AER.</p>
        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={spots}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.keys(STATE_COLOURS).map(s => (
                <Line key={s} type="monotone" dataKey={s} name={STATE_LABELS[s]} stroke={STATE_COLOURS[s]} strokeWidth={2} dot={{ r: 2 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cap contract prices */}
      {caps.length > 0 && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">$300 Cap Contract Settlement Prices</h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            {data.cap_contract_prices?.interpretation}
          </p>
          <div className="h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={caps}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} />
                <Tooltip content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs">
                      <div className="font-medium text-[var(--color-text)] mb-1">{label} — $300 Cap</div>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {payload.filter((p: any) => p.value != null).map((p: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                          <span className="text-[var(--color-text-muted)]">{p.name}:</span>
                          <span className="text-[var(--color-text)] font-medium">${Number(p.value).toFixed(2)}</span>
                        </div>
                      ))}
                      {payload[0]?.payload?.note && (
                        <div className="text-[var(--color-text-muted)] mt-1 max-w-[200px]">{payload[0].payload.note}</div>
                      )}
                    </div>
                  )
                }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="nsw" name="NSW" fill={STATE_COLOURS.nsw} fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                <Bar dataKey="qld" name="QLD" fill={STATE_COLOURS.qld} fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                <Bar dataKey="vic" name="VIC" fill={STATE_COLOURS.vic} fillOpacity={0.7} radius={[2, 2, 0, 0]} />
                <Bar dataKey="sa" name="SA" fill={STATE_COLOURS.sa} fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-3 leading-relaxed">
            {data.cap_contract_prices?.bess_revenue_impact}
          </p>
        </div>
      )}

      {/* Forward curve by state */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">ASX Forward Curve by State (CY26–CY29)</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Calendar-year base futures. Solid lines: Dec 2025 close. Dashed: QLD May 2026 update.</p>
        <div className="h-64 lg:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forwardChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `$${v}`} domain={[60, 120]} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="nsw" name="NSW" stroke={STATE_COLOURS.nsw} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="qld" name="QLD (Dec)" stroke={STATE_COLOURS.qld} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="vic" name="VIC" stroke={STATE_COLOURS.vic} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="sa" name="SA" stroke={STATE_COLOURS.sa} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="qld_may" name="QLD (May update)" stroke={STATE_COLOURS.qld} strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Curve shape analysis */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {Object.entries(data.forward_curve?.curve_shape_analysis || {}).map(([state, analysis]) => (
            <div key={state} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
              <div className="text-xs font-medium mb-1" style={{ color: STATE_COLOURS[state] || '#6b7280' }}>{STATE_LABELS[state] || state.toUpperCase()}</div>
              <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{String(analysis)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spread analysis */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Peak-to-Trough Spread by State (Q1 2026)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(spreads).map(([state, info]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const s = info as any
            return (
              <div key={state} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
                <div className="text-xs text-[var(--color-text-muted)] uppercase">{state}</div>
                <div className="text-xl font-bold" style={{ color: STATE_COLOURS[state] || '#6b7280' }}>
                  ${s.spread}/MWh
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)] mt-1">{s.outlook}</div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-amber-400 mt-4 leading-relaxed">{data.spread_analysis?.investment_signal}</p>
      </div>

      {/* Investment hierarchy */}
      {hierarchy.ranking && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">BESS Investment Hierarchy</h3>
          <div className="flex items-center gap-2 mb-4">
            {hierarchy.ranking.map((state: string, i: number) => (
              <div key={state} className="flex items-center gap-1">
                <span className="text-sm font-bold" style={{ color: STATE_COLOURS[state.toLowerCase()] || '#6b7280' }}>{state}</span>
                {i < hierarchy.ranking.length - 1 && (
                  <span className="text-[var(--color-text-muted)] text-xs">{i === hierarchy.ranking.length - 2 ? ' >>' : ' >'}</span>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Object.entries(hierarchy.rationale || {}).map(([state, rationale]) => (
              <div key={state} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
                <div className="text-xs font-medium mb-1" style={{ color: STATE_COLOURS[state] || '#6b7280' }}>{STATE_LABELS[state] || state.toUpperCase()}</div>
                <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">{String(rationale)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-[var(--color-text)]">{value}</div>
      <div className="text-[10px] text-[var(--color-text-muted)]">{label}</div>
    </div>
  )
}

function MiniStatCard({ label, value, colour }: { label: string; value: string; colour: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3 text-center">
      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
      <div className="text-lg font-bold" style={{ color: colour }}>{value}</div>
    </div>
  )
}
