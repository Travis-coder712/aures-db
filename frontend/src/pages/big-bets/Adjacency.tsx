import { useState } from 'react'
import { Link } from 'react-router-dom'

// ============================================================
// Adjacency — Big Bets Theme 3
// ============================================================

type Maturity = 'commercial' | 'pre-commercial' | 'demonstration' | 'research'
type Conviction = 'high' | 'medium' | 'low'

interface Adjacency {
  id: string
  name: string
  category: string
  description: string
  maturity: Maturity
  conviction: Conviction
  investmentAUD: string
  marketSizeAU: string
  synergies: string[]
  competitors: string[]
  milestones: { date: string; event: string; status: 'done' | 'active' | 'upcoming' }[]
  economics: { label: string; value: string }[]
  risks: string[]
  opportunities: string[]
  policyTailwinds: string[]
}

const MATURITY_CONFIG: Record<Maturity, { label: string; color: string; bg: string }> = {
  commercial: { label: 'Commercial', color: '#22c55e', bg: 'bg-green-500/10' },
  'pre-commercial': { label: 'Pre-Commercial', color: '#3b82f6', bg: 'bg-blue-500/10' },
  demonstration: { label: 'Demonstration', color: '#f59e0b', bg: 'bg-amber-500/10' },
  research: { label: 'Research', color: '#8b5cf6', bg: 'bg-violet-500/10' },
}

const CONVICTION_CONFIG: Record<Conviction, { label: string; color: string; dots: number }> = {
  high: { label: 'High', color: '#22c55e', dots: 3 },
  medium: { label: 'Medium', color: '#f59e0b', dots: 2 },
  low: { label: 'Low', color: '#ef4444', dots: 1 },
}

const ADJACENCIES: Adjacency[] = [
  {
    id: 'hydrogen',
    name: 'Green Hydrogen',
    category: 'Clean Fuels',
    description: 'Production of green hydrogen via electrolysis powered by dedicated renewable energy assets. Targeting export markets (Japan, Korea, Germany) and domestic industrial use (ammonia, steel, heavy transport).',
    maturity: 'demonstration',
    conviction: 'high',
    investmentAUD: '$300M - $600M',
    marketSizeAU: '$50B by 2050',
    synergies: [
      'Leverage existing renewable generation portfolio',
      'Grid connection expertise for electrolyser siting',
      'Relationship with export-oriented Japanese partners',
      'Access to CIS/LTESA renewable energy certificates',
    ],
    competitors: ['Fortescue Future Industries', 'Origin Energy', 'ATCO', 'Stanwell', 'BP Australia'],
    milestones: [
      { date: 'Q2 FY25', event: 'Feasibility study for Pilbara hydrogen hub completed', status: 'done' },
      { date: 'Q4 FY25', event: 'ARENA grant application for 10 MW electrolyser', status: 'done' },
      { date: 'Q2 FY26', event: 'Electrolyser technology partner selection', status: 'active' },
      { date: 'FY27', event: 'Pilot plant commissioning (10 MW)', status: 'upcoming' },
      { date: 'FY29', event: 'Scale-up decision for 200 MW facility', status: 'upcoming' },
      { date: 'FY31', event: 'First commercial export shipment', status: 'upcoming' },
    ],
    economics: [
      { label: 'Current LCOH', value: '$6-8/kg' },
      { label: 'Target LCOH (2030)', value: '$2-3/kg' },
      { label: 'Breakeven vs Grey H2', value: '$2.50/kg' },
      { label: 'Export Price (Japan)', value: '$3.50-4.50/kg' },
    ],
    risks: [
      'Hydrogen cost curve may not decline as projected',
      'Export infrastructure (port, shipping) requires multi-party coordination',
      'Competition from Middle East and South American producers',
      'Water availability constraints in arid production regions',
    ],
    opportunities: [
      'National Hydrogen Strategy provides regulatory certainty',
      'Japan has committed to importing 3Mt H2/yr by 2030',
      'Hydrogen Headstart program offers production credits',
      'Industrial decarbonisation mandates creating domestic demand',
    ],
    policyTailwinds: ['National Hydrogen Strategy', 'Hydrogen Headstart ($2B)', 'ARENA funding', 'Safeguard Mechanism'],
  },
  {
    id: 'minerals',
    name: 'Critical Minerals Processing',
    category: 'Industrial',
    description: 'Co-located critical minerals processing powered by dedicated renewable energy. Focus on lithium hydroxide, rare earths, and nickel sulphate — key inputs for batteries and clean energy technology.',
    maturity: 'pre-commercial',
    conviction: 'medium',
    investmentAUD: '$150M - $400M',
    marketSizeAU: '$30B by 2040',
    synergies: [
      'Renewable energy as competitive advantage for energy-intensive processing',
      'Co-location with renewable generation assets reduces transmission costs',
      'ESG credentials attract premium off-take from EV/battery manufacturers',
      'Grid connection capability applicable to industrial loads',
    ],
    competitors: ['IGO', 'Pilbara Minerals', 'Lynas', 'Iluka', 'BHP'],
    milestones: [
      { date: 'Q3 FY25', event: 'Scoping study for co-located lithium processing', status: 'done' },
      { date: 'Q1 FY26', event: 'MOU with lithium miner for feedstock supply', status: 'active' },
      { date: 'FY27', event: 'Pre-feasibility study completion', status: 'upcoming' },
      { date: 'FY28', event: 'FID on pilot processing facility', status: 'upcoming' },
      { date: 'FY30', event: 'Commercial-scale processing plant operational', status: 'upcoming' },
    ],
    economics: [
      { label: 'Energy as % of Processing Cost', value: '25-35%' },
      { label: 'Renewable Premium Value', value: '15-20%' },
      { label: 'Target IRR', value: '14-18%' },
      { label: 'Contract Structure', value: 'Tolling + equity' },
    ],
    risks: [
      'Commodity price volatility for lithium and rare earths',
      'Processing technology risk for novel configurations',
      'Chinese competition in downstream processing',
      'Long development timelines (5-7 years to commercial)',
    ],
    opportunities: [
      'Critical Minerals Strategy and $4B facility',
      'IRA-equivalent incentives for Australian processing',
      'EV battery makers seeking non-Chinese supply chains',
      'Premium pricing for "green processed" minerals',
    ],
    policyTailwinds: ['Critical Minerals Strategy', 'Critical Minerals Facility ($4B)', 'FIRB foreign investment controls', 'EU CRMA compliance'],
  },
  {
    id: 'ev-charging',
    name: 'EV Charging Infrastructure',
    category: 'Transport',
    description: 'National network of fast-charging hubs co-located with renewable generation and battery storage. Targeting highway corridors, urban hubs, and fleet depots.',
    maturity: 'commercial',
    conviction: 'high',
    investmentAUD: '$100M - $250M',
    marketSizeAU: '$15B by 2035',
    synergies: [
      'Existing retail electricity customer relationships',
      'BESS expertise for charge-rate management',
      'Renewable energy supply for green charging credentials',
      'Grid connection capability for high-power charging sites',
    ],
    competitors: ['AmpCharge', 'Chargefox', 'Tesla Supercharger', 'Evie Networks', 'JOLT'],
    milestones: [
      { date: 'Q1 FY25', event: 'Strategic review of EV charging market completed', status: 'done' },
      { date: 'Q3 FY25', event: 'Pilot partnership with highway rest stop operator', status: 'done' },
      { date: 'Q1 FY26', event: '20 fast-charging hubs operational', status: 'active' },
      { date: 'FY27', event: '100 hubs operational, fleet charging contracts signed', status: 'upcoming' },
      { date: 'FY29', event: '500+ charging points, positive unit economics', status: 'upcoming' },
    ],
    economics: [
      { label: 'Revenue per Charge Point', value: '$35-50k/yr' },
      { label: 'Utilisation Target', value: '>15%' },
      { label: 'Payback Period', value: '4-6 years' },
      { label: 'Margin (mature)', value: '25-35%' },
    ],
    risks: [
      'EV adoption rate may lag projections',
      'Charging technology evolution (CCS vs NACS)',
      'Real estate competition for prime locations',
      'Utility connection costs and timelines',
    ],
    opportunities: [
      'Australian EV sales growing 60%+ YoY',
      'Government co-funding for regional charging',
      'Fleet electrification mandates emerging',
      'Integration with VPP for grid services revenue',
    ],
    policyTailwinds: ['National Electric Vehicle Strategy', 'ARENA EV charging grants', 'State ZEV mandates', 'Fringe benefits tax exemption'],
  },
  {
    id: 'ccs',
    name: 'Carbon Capture & Storage',
    category: 'Decarbonisation',
    description: 'Development of carbon capture solutions for hard-to-abate industrial sectors (cement, steel, chemicals) and direct air capture (DAC) powered by renewable energy.',
    maturity: 'research',
    conviction: 'medium',
    investmentAUD: '$50M - $200M',
    marketSizeAU: '$20B by 2050',
    synergies: [
      'Renewable energy supply for DAC energy requirements',
      'Geological storage expertise transferable from gas industry hires',
      'Relationship with industrial customers for point-source capture',
      'Carbon credit generation and trading capability',
    ],
    competitors: ['Santos', 'Woodside', 'Glencore', 'Carbon Engineering', 'Climeworks'],
    milestones: [
      { date: 'Q4 FY25', event: 'Technology landscape review completed', status: 'done' },
      { date: 'Q2 FY26', event: 'Partnership with DAC technology provider', status: 'active' },
      { date: 'FY28', event: 'Pilot DAC unit (1,000 tpa) operational', status: 'upcoming' },
      { date: 'FY30', event: 'Commercial-scale facility decision', status: 'upcoming' },
      { date: 'FY32+', event: 'Large-scale DAC hub (100,000+ tpa)', status: 'upcoming' },
    ],
    economics: [
      { label: 'Current DAC Cost', value: '$400-600/tCO2' },
      { label: 'Target Cost (2030)', value: '$150-250/tCO2' },
      { label: 'ACCU Price', value: '$30-35/tCO2' },
      { label: 'Voluntary Market Price', value: '$80-150/tCO2' },
    ],
    risks: [
      'DAC technology costs remain prohibitively high',
      'Carbon credit market price uncertainty',
      'Public perception challenges around CCS',
      'Long-term geological storage liability',
    ],
    opportunities: [
      'Growing corporate demand for high-quality carbon removal',
      'Safeguard Mechanism driving industrial demand',
      'Australia has world-class geological storage basins',
      'First-mover in renewable-powered DAC',
    ],
    policyTailwinds: ['Safeguard Mechanism', 'ACCU scheme', 'CCS Method under ERF', 'Net Zero by 2050 target'],
  },
]

export default function AdjacencyPage() {
  const [selectedAdj, setSelectedAdj] = useState<string>(ADJACENCIES[0].id)
  const [tab, setTab] = useState<'overview' | 'economics' | 'roadmap'>('overview')

  const active = ADJACENCIES.find((a) => a.id === selectedAdj) ?? ADJACENCIES[0]

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-4">
        <Link to="/big-bets" className="hover:text-[var(--color-text)] transition-colors">Big Bets</Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Adjacency</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">Adjacency</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Leveraging core energy strengths into adjacent high-growth sectors</p>
        </div>
      </div>

      {/* Thesis */}
      <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-5 mb-6">
        <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">Investment Thesis</h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          The energy transition is creating entirely new value chains adjacent to electricity generation. Green hydrogen,
          critical minerals, EV infrastructure, and carbon management each represent multi-billion dollar markets where
          energy companies hold structural advantages — access to cheap renewable electricity, grid connection expertise,
          large-scale project delivery capability, and relationships with industrial customers. These adjacencies offer
          diversification while reinforcing the core business.
        </p>
      </div>

      {/* Adjacency Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {ADJACENCIES.map((adj) => (
          <button
            key={adj.id}
            onClick={() => { setSelectedAdj(adj.id); setTab('overview') }}
            className={`text-left p-4 rounded-xl border transition-all ${
              selectedAdj === adj.id
                ? 'bg-[var(--color-bg-elevated)] border-teal-500/40'
                : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-border)]'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`${MATURITY_CONFIG[adj.maturity].bg} px-2 py-0.5 rounded-full text-[10px] font-medium`} style={{ color: MATURITY_CONFIG[adj.maturity].color }}>
                {MATURITY_CONFIG[adj.maturity].label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-0.5">{adj.name}</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{adj.category}</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[var(--color-text-muted)]">Conviction:</span>
              <div className="flex gap-0.5">
                {[1, 2, 3].map((d) => (
                  <div
                    key={d}
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: d <= CONVICTION_CONFIG[adj.conviction].dots
                        ? CONVICTION_CONFIG[adj.conviction].color
                        : 'var(--color-bg-elevated)',
                    }}
                  />
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 mb-4">
        {(['overview', 'economics', 'roadmap'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              tab === t
                ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Description */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
              <h3 className="text-sm font-bold text-[var(--color-text)] mb-2">{active.name}</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">{active.description}</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--color-bg)]/50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60 mb-1">Investment</p>
                  <p className="text-sm font-bold text-teal-400">{active.investmentAUD}</p>
                </div>
                <div className="bg-[var(--color-bg)]/50 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60 mb-1">AU Market Size</p>
                  <p className="text-sm font-bold text-[var(--color-text)]">{active.marketSizeAU}</p>
                </div>
              </div>
            </div>

            {/* Synergies */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
              <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-3">Core Business Synergies</h3>
              <div className="space-y-2">
                {active.synergies.map((s) => (
                  <div key={s} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-6.364-6.364L4.757 8.25a4.5 4.5 0 006.364 6.364l4.5-4.5z" />
                    </svg>
                    <span className="text-xs text-[var(--color-text-muted)] leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Policy Tailwinds */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
              <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-3">Policy Tailwinds</h3>
              <div className="flex flex-wrap gap-2">
                {active.policyTailwinds.map((p) => (
                  <span key={p} className="px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[11px] text-teal-300 font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Opportunities */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[var(--color-text)] mb-3">Opportunities</h3>
              <div className="space-y-2">
                {active.opportunities.map((o) => (
                  <div key={o} className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5 flex-shrink-0 text-xs">+</span>
                    <span className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{o}</span>
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

            {/* Competitors */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-xs font-bold text-[var(--color-text)] mb-3">Competitive Landscape</h3>
              <div className="flex flex-wrap gap-1.5">
                {active.competitors.map((c) => (
                  <span key={c} className="px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'economics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Economics Table */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-4">{active.name} — Unit Economics</h3>
            <div className="space-y-3">
              {active.economics.map((e) => (
                <div key={e.label} className="flex items-center justify-between py-2 border-b border-[var(--color-border)]/50 last:border-0">
                  <span className="text-xs text-[var(--color-text-muted)]">{e.label}</span>
                  <span className="text-sm font-bold text-[var(--color-text)] font-mono">{e.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All Adjacencies Comparison */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-4">Portfolio Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="text-left py-2 text-[var(--color-text-muted)] font-medium">Adjacency</th>
                    <th className="text-left py-2 text-[var(--color-text-muted)] font-medium">Maturity</th>
                    <th className="text-right py-2 text-[var(--color-text-muted)] font-medium">Investment</th>
                    <th className="text-right py-2 text-[var(--color-text-muted)] font-medium">Market</th>
                  </tr>
                </thead>
                <tbody>
                  {ADJACENCIES.map((adj) => (
                    <tr
                      key={adj.id}
                      onClick={() => setSelectedAdj(adj.id)}
                      className={`border-b border-[var(--color-border)]/30 cursor-pointer transition-colors ${
                        adj.id === selectedAdj ? 'bg-teal-500/5' : 'hover:bg-[var(--color-bg-elevated)]/30'
                      }`}
                    >
                      <td className="py-2.5 font-medium text-[var(--color-text)]">{adj.name}</td>
                      <td className="py-2.5">
                        <span className={`${MATURITY_CONFIG[adj.maturity].bg} px-1.5 py-0.5 rounded text-[10px]`} style={{ color: MATURITY_CONFIG[adj.maturity].color }}>
                          {MATURITY_CONFIG[adj.maturity].label}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-[var(--color-text-muted)]">{adj.investmentAUD}</td>
                      <td className="py-2.5 text-right text-[var(--color-text-muted)]">{adj.marketSizeAU}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'roadmap' && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
          <h3 className="text-sm font-bold text-[var(--color-text)] mb-4">{active.name} — Development Roadmap</h3>
          <div className="space-y-4">
            {active.milestones.map((m, i) => (
              <div key={m.event} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                    m.status === 'done'
                      ? 'bg-emerald-500/15 border-emerald-500/30'
                      : m.status === 'active'
                      ? 'bg-teal-500/15 border-teal-500/30'
                      : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)]'
                  }`}>
                    {m.status === 'done' ? (
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : m.status === 'active' ? (
                      <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">{i + 1}</span>
                    )}
                  </div>
                  {i < active.milestones.length - 1 && (
                    <div className={`w-px h-8 mt-1 ${m.status === 'done' ? 'bg-emerald-500/30' : 'bg-[var(--color-border)]'}`} />
                  )}
                </div>
                <div className="pt-1 flex-1">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="text-xs font-mono text-teal-400">{m.date}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      m.status === 'done'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : m.status === 'active'
                        ? 'bg-teal-500/10 text-teal-400'
                        : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
                    }`}>
                      {m.status === 'done' ? 'Complete' : m.status === 'active' ? 'In Progress' : 'Planned'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text)]">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Adjacency Framework */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-3">Adjacency Evaluation Framework</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Strategic Fit', desc: 'How closely does it leverage existing capabilities, assets, and customer relationships?' },
            { title: 'Market Timing', desc: 'Is the market ready for commercial deployment or still in early development?' },
            { title: 'Capital Efficiency', desc: 'Can we achieve attractive returns with staged, optionality-preserving investments?' },
            { title: 'Policy Alignment', desc: 'Does the adjacency benefit from strong and durable government policy support?' },
          ].map((f) => (
            <div key={f.title}>
              <p className="text-xs font-semibold text-teal-400 mb-1">{f.title}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[var(--color-text-muted)]/50 mt-8 text-center">
        Adjacency portfolio reviewed quarterly. Technology and market assessments as of Q1 FY26.
      </p>
    </div>
  )
}
