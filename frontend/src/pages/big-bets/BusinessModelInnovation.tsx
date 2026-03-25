import { useState } from 'react'
import { Link } from 'react-router-dom'

// ============================================================
// Business Model Innovation — Big Bets Theme 1
// ============================================================

type Phase = 'pilot' | 'scale' | 'mature'
type Status = 'active' | 'planning' | 'exploring' | 'paused'

interface Initiative {
  id: string
  name: string
  description: string
  phase: Phase
  status: Status
  investmentAUD: string
  targetRevenue: string
  irr: string
  timeToBreakeven: string
  keyMetrics: { label: string; value: string }[]
  risks: string[]
  enablers: string[]
  customerSegments: string[]
}

const PHASE_CONFIG: Record<Phase, { label: string; color: string; bg: string }> = {
  pilot: { label: 'Pilot', color: '#f59e0b', bg: 'bg-amber-500/10' },
  scale: { label: 'Scale', color: '#3b82f6', bg: 'bg-blue-500/10' },
  mature: { label: 'Mature', color: '#22c55e', bg: 'bg-green-500/10' },
}

const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  active: { label: 'Active', color: '#22c55e' },
  planning: { label: 'Planning', color: '#3b82f6' },
  exploring: { label: 'Exploring', color: '#f59e0b' },
  paused: { label: 'Paused', color: '#6b7280' },
}

const INITIATIVES: Initiative[] = [
  {
    id: 'eaas',
    name: 'Energy-as-a-Service (EaaS)',
    description: 'Bundled energy solutions for C&I customers including solar, storage, EV charging, and energy management — delivered as a monthly subscription with guaranteed savings.',
    phase: 'scale',
    status: 'active',
    investmentAUD: '$120M',
    targetRevenue: '$45M/yr by FY28',
    irr: '15-18%',
    timeToBreakeven: '3.5 years',
    keyMetrics: [
      { label: 'Customers Onboarded', value: '47' },
      { label: 'Contracted Capacity', value: '85 MW' },
      { label: 'Avg Contract Length', value: '7.2 yrs' },
      { label: 'Customer NPS', value: '+62' },
    ],
    risks: [
      'Customer credit risk on long-term contracts',
      'Technology obsolescence over contract period',
      'Regulatory changes to behind-the-meter treatment',
    ],
    enablers: [
      'Existing C&I customer base of 12,000+',
      'Smart metering infrastructure',
      'Partnerships with solar/BESS OEMs',
    ],
    customerSegments: ['Commercial offices', 'Industrial facilities', 'Shopping centres', 'Local government'],
  },
  {
    id: 'vpp',
    name: 'Virtual Power Plant Platform',
    description: 'Aggregation platform orchestrating distributed energy resources (rooftop solar, home batteries, EV chargers) to participate in wholesale and FCAS markets.',
    phase: 'pilot',
    status: 'active',
    investmentAUD: '$65M',
    targetRevenue: '$20M/yr by FY29',
    irr: '12-16%',
    timeToBreakeven: '4 years',
    keyMetrics: [
      { label: 'Connected Assets', value: '28,400' },
      { label: 'Dispatchable Capacity', value: '142 MW' },
      { label: 'FCAS Revenue (FY25)', value: '$3.8M' },
      { label: 'Avg Response Time', value: '< 200ms' },
    ],
    risks: [
      'AEMO rule changes on DER aggregation',
      'Consumer engagement and retention',
      'Cybersecurity of distributed fleet',
    ],
    enablers: [
      '400,000+ residential customer accounts',
      'Existing demand response capability',
      'AEMO DER integration roadmap alignment',
    ],
    customerSegments: ['Residential solar owners', 'Home battery adopters', 'EV owners', 'Strata communities'],
  },
  {
    id: 'p2p',
    name: 'Peer-to-Peer Energy Trading',
    description: 'Blockchain-enabled platform allowing prosumers to trade surplus solar energy directly with neighbours, with the company earning platform and settlement fees.',
    phase: 'pilot',
    status: 'exploring',
    investmentAUD: '$25M',
    targetRevenue: '$8M/yr by FY30',
    irr: '10-14%',
    timeToBreakeven: '5 years',
    keyMetrics: [
      { label: 'Pilot Participants', value: '1,200' },
      { label: 'Energy Traded (Monthly)', value: '450 MWh' },
      { label: 'Avg Savings to Buyer', value: '18%' },
      { label: 'Platform Fee', value: '2.5c/kWh' },
    ],
    risks: [
      'Regulatory uncertainty on retail exemptions',
      'Network tariff reform may erode value proposition',
      'Consumer willingness to engage with complexity',
    ],
    enablers: [
      'Growing prosumer population (3M+ rooftop solar)',
      'AEMC distribution market model review',
      'Smart meter rollout acceleration',
    ],
    customerSegments: ['Solar prosumers', 'Apartment complexes', 'Community energy groups', 'Regional microgrids'],
  },
  {
    id: 'btm',
    name: 'Behind-the-Meter Commercial Storage',
    description: 'Deploying grid-scale BESS at customer sites (data centres, hospitals, industrial) to provide demand management, backup power, and wholesale market arbitrage.',
    phase: 'scale',
    status: 'active',
    investmentAUD: '$180M',
    targetRevenue: '$55M/yr by FY28',
    irr: '16-20%',
    timeToBreakeven: '3 years',
    keyMetrics: [
      { label: 'Sites Deployed', value: '23' },
      { label: 'Installed Capacity', value: '210 MW / 420 MWh' },
      { label: 'Demand Charge Savings', value: '35-45%' },
      { label: 'Arbitrage Revenue Share', value: '40/60' },
    ],
    risks: [
      'BESS technology cost trajectory uncertainty',
      'Grid connection and export limit constraints',
      'Insurance and warranty management at scale',
    ],
    enablers: [
      'Rising demand charges in NEM',
      'Declining BESS costs (projected -30% by 2028)',
      'Existing large customer relationships',
    ],
    customerSegments: ['Data centres', 'Hospitals', 'Manufacturing', 'Mining operations'],
  },
]

const VALUE_CHAIN = [
  { step: 'Generate', desc: 'Utility-scale + distributed generation', color: '#8b5cf6' },
  { step: 'Store', desc: 'Grid-scale and behind-the-meter BESS', color: '#3b82f6' },
  { step: 'Orchestrate', desc: 'VPP, demand response, smart grid', color: '#06b6d4' },
  { step: 'Deliver', desc: 'EaaS, P2P trading, retail innovation', color: '#14b8a6' },
  { step: 'Optimise', desc: 'AI-driven portfolio management', color: '#22c55e' },
]

export default function BusinessModelInnovation() {
  const [selectedInitiative, setSelectedInitiative] = useState<string>(INITIATIVES[0].id)
  const [viewMode, setViewMode] = useState<'detail' | 'comparison'>('detail')

  const active = INITIATIVES.find((i) => i.id === selectedInitiative) ?? INITIATIVES[0]

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-4">
        <Link to="/big-bets" className="hover:text-[var(--color-text)] transition-colors">Big Bets</Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Business Model Innovation</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">Business Model Innovation</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Reimagining how we create and capture value in the energy transition</p>
          </div>
        </div>
      </div>

      {/* Thesis Box */}
      <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-5 mb-6">
        <h3 className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">Investment Thesis</h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          The traditional energy retail model of commodity kWh sales is being disrupted by distributed generation,
          storage, and digital platforms. By investing in new delivery models — EaaS, VPPs, P2P trading, and
          behind-the-meter solutions — we transform from a volume-based commodity seller into a high-margin
          energy services platform. The opportunity is to capture a greater share of the $85B annual Australian
          energy wallet through recurring service revenue with higher customer lifetime value.
        </p>
      </div>

      {/* Value Chain */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-4">Integrated Value Chain</h3>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          {VALUE_CHAIN.map((v, i) => (
            <div key={v.step} className="flex-1 flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-[var(--color-border)] p-3 text-center">
                <p className="text-xs font-bold" style={{ color: v.color }}>{v.step}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{v.desc}</p>
              </div>
              {i < VALUE_CHAIN.length - 1 && (
                <svg className="w-4 h-4 text-[var(--color-text-muted)]/30 hidden sm:block flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode('detail')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'detail'
              ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-transparent'
          }`}
        >
          Detailed View
        </button>
        <button
          onClick={() => setViewMode('comparison')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            viewMode === 'comparison'
              ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-transparent'
          }`}
        >
          Comparison
        </button>
      </div>

      {viewMode === 'comparison' ? (
        /* Comparison Table */
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Initiative</th>
                  <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Phase</th>
                  <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Status</th>
                  <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">Investment</th>
                  <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">Target Revenue</th>
                  <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">IRR</th>
                  <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">Breakeven</th>
                </tr>
              </thead>
              <tbody>
                {INITIATIVES.map((init) => (
                  <tr
                    key={init.id}
                    onClick={() => { setSelectedInitiative(init.id); setViewMode('detail') }}
                    className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-elevated)]/50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-medium text-[var(--color-text)]">{init.name}</td>
                    <td className="p-3">
                      <span className={`${PHASE_CONFIG[init.phase].bg} px-2 py-0.5 rounded-full`} style={{ color: PHASE_CONFIG[init.phase].color }}>
                        {PHASE_CONFIG[init.phase].label}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CONFIG[init.status].color }} />
                        {STATUS_CONFIG[init.status].label}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-[var(--color-text)]">{init.investmentAUD}</td>
                    <td className="p-3 text-right text-[var(--color-text-muted)]">{init.targetRevenue}</td>
                    <td className="p-3 text-right font-mono text-emerald-400">{init.irr}</td>
                    <td className="p-3 text-right text-[var(--color-text-muted)]">{init.timeToBreakeven}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--color-bg-elevated)]/30">
                  <td className="p-3 font-bold text-[var(--color-text)]" colSpan={3}>Total Portfolio</td>
                  <td className="p-3 text-right font-mono font-bold text-[var(--color-text)]">$390M</td>
                  <td className="p-3 text-right font-bold text-[var(--color-text)]">$128M/yr</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">14-17%</td>
                  <td className="p-3 text-right text-[var(--color-text-muted)]">3-5 yrs</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed View */
        <>
          {/* Initiative Selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {INITIATIVES.map((init) => (
              <button
                key={init.id}
                onClick={() => setSelectedInitiative(init.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedInitiative === init.id
                    ? 'bg-[var(--color-bg-elevated)] border border-violet-500/30 text-[var(--color-text)]'
                    : 'border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-border)]'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CONFIG[init.status].color }} />
                  {init.name}
                </span>
              </button>
            ))}
          </div>

          {/* Initiative Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* Main info */}
            <div className="lg:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-base font-bold text-[var(--color-text)]">{active.name}</h2>
                <span className={`${PHASE_CONFIG[active.phase].bg} px-2 py-0.5 rounded-full text-[11px] font-medium`} style={{ color: PHASE_CONFIG[active.phase].color }}>
                  {PHASE_CONFIG[active.phase].label}
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CONFIG[active.status].color }} />
                  <span style={{ color: STATUS_CONFIG[active.status].color }}>{STATUS_CONFIG[active.status].label}</span>
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-5">{active.description}</p>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {active.keyMetrics.map((m) => (
                  <div key={m.label} className="bg-[var(--color-bg)]/50 rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60 mb-1">{m.label}</p>
                    <p className="text-sm font-bold text-[var(--color-text)]">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Customer Segments */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Target Segments</p>
                <div className="flex flex-wrap gap-1.5">
                  {active.customerSegments.map((seg) => (
                    <span key={seg} className="px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-300">
                      {seg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Side panel - financials & risks */}
            <div className="space-y-4">
              {/* Financials */}
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                <h3 className="text-xs font-bold text-[var(--color-text)] mb-3">Financial Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Investment', value: active.investmentAUD },
                    { label: 'Target Revenue', value: active.targetRevenue },
                    { label: 'Target IRR', value: active.irr },
                    { label: 'Time to Breakeven', value: active.timeToBreakeven },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-[var(--color-text-muted)]">{item.label}</span>
                      <span className="text-xs font-semibold text-[var(--color-text)]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risks */}
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                <h3 className="text-xs font-bold text-[var(--color-text)] mb-3">Key Risks</h3>
                <div className="space-y-2">
                  {active.risks.map((r) => (
                    <div key={r} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 flex-shrink-0 text-xs">!</span>
                      <span className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enablers */}
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
                <h3 className="text-xs font-bold text-[var(--color-text)] mb-3">Strategic Enablers</h3>
                <div className="space-y-2">
                  {active.enablers.map((e) => (
                    <div key={e} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0 text-xs">+</span>
                      <span className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{e}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <p className="text-[11px] text-[var(--color-text-muted)]/50 mt-8 text-center">
        Business model innovation initiatives are evaluated quarterly. Data as of Q1 FY26.
      </p>
    </div>
  )
}
