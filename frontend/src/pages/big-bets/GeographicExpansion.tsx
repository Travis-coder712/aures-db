import { useState } from 'react'
import { Link } from 'react-router-dom'

// ============================================================
// Geographic Expansion — Big Bets Theme 2
// ============================================================

type MarketReadiness = 'ready' | 'developing' | 'early' | 'exploring'

interface Market {
  id: string
  name: string
  region: string
  readiness: MarketReadiness
  opportunitySizeGW: number
  investmentAUD: string
  entryStrategy: string
  targetSegments: string[]
  regulatoryComplexity: 'Low' | 'Medium' | 'High' | 'Very High'
  competitiveIntensity: 'Low' | 'Medium' | 'High'
  keyPartners: string[]
  timeline: { phase: string; year: string; milestone: string }[]
  strengths: string[]
  challenges: string[]
  marketInsights: string
}

const READINESS_CONFIG: Record<MarketReadiness, { label: string; color: string; bg: string }> = {
  ready: { label: 'Market Ready', color: '#22c55e', bg: 'bg-green-500/10' },
  developing: { label: 'Developing', color: '#3b82f6', bg: 'bg-blue-500/10' },
  early: { label: 'Early Stage', color: '#f59e0b', bg: 'bg-amber-500/10' },
  exploring: { label: 'Exploring', color: '#8b5cf6', bg: 'bg-violet-500/10' },
}

const MARKETS: Market[] = [
  {
    id: 'sea',
    name: 'Southeast Asia',
    region: 'ASEAN',
    readiness: 'developing',
    opportunitySizeGW: 450,
    investmentAUD: '$400M - $800M',
    entryStrategy: 'Joint ventures with local developers in Vietnam, Philippines, and Indonesia. Leverage Australian project development expertise and international financing relationships.',
    targetSegments: ['Utility-scale solar', 'Onshore wind', 'BESS for grid stability', 'C&I rooftop solar'],
    regulatoryComplexity: 'High',
    competitiveIntensity: 'Medium',
    keyPartners: ['JICA financing', 'Local IPPs', 'Multilateral development banks', 'ASEAN Power Grid'],
    timeline: [
      { phase: 'Entry', year: 'FY26', milestone: 'JV agreements signed in Vietnam & Philippines' },
      { phase: 'Build', year: 'FY27', milestone: 'First 200 MW solar project reaches FID' },
      { phase: 'Scale', year: 'FY28-29', milestone: '1 GW pipeline under development' },
      { phase: 'Establish', year: 'FY30+', milestone: 'Self-sustaining regional platform' },
    ],
    strengths: [
      'Rapidly growing electricity demand (5-7% pa)',
      'Strong policy push for renewables in Vietnam, Philippines',
      'Declining solar/wind LCOE competitive vs gas',
      'AUD financing advantage in local markets',
    ],
    challenges: [
      'Complex land acquisition processes',
      'Currency risk (VND, PHP, IDR)',
      'Grid curtailment in Vietnam',
      'Evolving regulatory frameworks',
    ],
    marketInsights: 'Southeast Asia needs 450+ GW of new renewable capacity by 2050 to meet Paris Agreement targets. Vietnam leads with its revised Power Development Plan VIII targeting 70 GW of renewables. The Philippines has lifted foreign ownership caps on renewable projects, creating a structural entry opportunity.',
  },
  {
    id: 'nz',
    name: 'New Zealand',
    region: 'Oceania',
    readiness: 'ready',
    opportunitySizeGW: 15,
    investmentAUD: '$150M - $300M',
    entryStrategy: 'Acquisition of a mid-tier NZ generation company or development portfolio. Leverage cultural proximity and existing trans-Tasman business relationships.',
    targetSegments: ['Onshore wind', 'Utility-scale solar', 'Grid-scale BESS', 'Green hydrogen (Southland)'],
    regulatoryComplexity: 'Low',
    competitiveIntensity: 'High',
    keyPartners: ['NZ Electricity Authority', 'Transpower', 'Local iwi partnerships', 'NZ Green Investment Finance'],
    timeline: [
      { phase: 'Entry', year: 'FY26', milestone: 'Target identification and due diligence' },
      { phase: 'Acquire', year: 'FY27', milestone: 'Platform acquisition completed' },
      { phase: 'Integrate', year: 'FY27-28', milestone: 'Operational integration and pipeline development' },
      { phase: 'Grow', year: 'FY29+', milestone: 'Organic growth to 500+ MW portfolio' },
    ],
    strengths: [
      'Stable regulatory environment',
      'Similar market design to NEM',
      '100% renewable electricity target by 2030',
      'High wholesale prices supporting new build economics',
    ],
    challenges: [
      'Small market limits scale',
      'Dominant incumbents (Mercury, Meridian, Contact, Genesis)',
      'Resource consent process can be lengthy',
      'Transmission constraints in South Island',
    ],
    marketInsights: 'NZ targets 100% renewable electricity by 2030 (currently ~85% hydro). The retirement of the 380 MW Huntly coal/gas unit and growing data centre demand creates a ~2 GW supply gap. Wind and solar costs are now competitive with new gas peakers.',
  },
  {
    id: 'pacific',
    name: 'Pacific Islands',
    region: 'Oceania',
    readiness: 'early',
    opportunitySizeGW: 5,
    investmentAUD: '$80M - $150M',
    entryStrategy: 'Development-finance backed microgrids and hybrid renewable systems. Position as the partner of choice for Pacific nations transitioning from diesel generation.',
    targetSegments: ['Solar + BESS microgrids', 'Diesel displacement', 'Island grid stabilisation', 'Climate resilient infrastructure'],
    regulatoryComplexity: 'Medium',
    competitiveIntensity: 'Low',
    keyPartners: ['DFAT Pacific Step-up', 'Asian Development Bank', 'Pacific Islands Forum', 'Pacific Community (SPC)'],
    timeline: [
      { phase: 'Pilot', year: 'FY26', milestone: 'First 10 MW microgrid in Fiji/PNG' },
      { phase: 'Replicate', year: 'FY27-28', milestone: 'Standardised microgrid template across 5 nations' },
      { phase: 'Scale', year: 'FY29-30', milestone: '100+ MW deployed across Pacific' },
      { phase: 'Platform', year: 'FY31+', milestone: 'Regional O&M hub established' },
    ],
    strengths: [
      'Extremely high diesel generation costs ($0.40-0.80/kWh)',
      'Strong Australian government development finance support',
      'Limited competition from major international developers',
      'Strategic alignment with Australia foreign policy',
    ],
    challenges: [
      'Small individual project sizes (1-20 MW)',
      'Logistics and supply chain complexity',
      'Sovereign credit risk',
      'Cyclone resilience requirements',
    ],
    marketInsights: 'Pacific Island nations spend 5-10% of GDP on diesel imports for electricity. Solar + BESS microgrids can reduce generation costs by 50-70%. Australia\'s Pacific Step-up initiative provides concessional financing. First-mover advantage is significant given limited competition.',
  },
  {
    id: 'japan',
    name: 'Japan & North Asia',
    region: 'North Asia',
    readiness: 'exploring',
    opportunitySizeGW: 300,
    investmentAUD: '$200M - $500M',
    entryStrategy: 'Strategic partnership with a Japanese trading house (sogo shosha) to co-develop offshore wind and utility-scale solar in Japan and South Korea.',
    targetSegments: ['Offshore wind', 'Utility-scale solar', 'Corporate PPA', 'Green hydrogen export'],
    regulatoryComplexity: 'Very High',
    competitiveIntensity: 'High',
    keyPartners: ['Sogo shosha (Mitsui, Marubeni, JERA)', 'JOGMEC', 'Korean Electric Power', 'Export Finance Australia'],
    timeline: [
      { phase: 'Explore', year: 'FY26-27', milestone: 'MOU with strategic partner signed' },
      { phase: 'Enter', year: 'FY28', milestone: 'First project co-development agreement' },
      { phase: 'Develop', year: 'FY29-30', milestone: 'GW-scale pipeline under development' },
      { phase: 'Harvest', year: 'FY31+', milestone: 'Recurring development fee and equity returns' },
    ],
    strengths: [
      'Massive renewable build-out commitment (GX Transition Bonds)',
      'Premium wholesale electricity prices',
      'Strong appetite for Australian partnerships',
      'Green hydrogen import demand from Japan/Korea',
    ],
    challenges: [
      'Complex business culture requiring local relationships',
      'Lengthy permitting processes',
      'Grid congestion and curtailment',
      'High construction costs',
    ],
    marketInsights: 'Japan has committed $150B+ to its Green Transformation (GX) programme, targeting 36-38% renewables by 2030. Offshore wind alone has a 45 GW target. Japanese companies are actively seeking Australian partners with development track records.',
  },
]

export default function GeographicExpansion() {
  const [selectedMarket, setSelectedMarket] = useState<string>(MARKETS[0].id)
  const active = MARKETS.find((m) => m.id === selectedMarket) ?? MARKETS[0]

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-4">
        <Link to="/big-bets" className="hover:text-[var(--color-text)] transition-colors">Big Bets</Link>
        <span>/</span>
        <span className="text-[var(--color-text)]">Geographic Expansion</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
          <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">Geographic Expansion</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Scaling proven capabilities into new international markets</p>
        </div>
      </div>

      {/* Thesis Box */}
      <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-5 mb-6">
        <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">Investment Thesis</h3>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Australia's renewable energy development capabilities — project origination, grid integration, BESS deployment,
          and stakeholder management — are world-class and transferable. As the Indo-Pacific region accelerates its
          energy transition (770+ GW of new renewables needed by 2050), Australian developers are uniquely positioned
          to export their expertise. Geographic diversification also reduces NEM concentration risk and opens access
          to higher-growth markets with premium returns.
        </p>
      </div>

      {/* Market Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {MARKETS.map((market) => (
          <button
            key={market.id}
            onClick={() => setSelectedMarket(market.id)}
            className={`text-left p-4 rounded-xl border transition-all ${
              selectedMarket === market.id
                ? 'bg-[var(--color-bg-elevated)] border-sky-500/40'
                : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-border)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`${READINESS_CONFIG[market.readiness].bg} px-2 py-0.5 rounded-full text-[10px] font-medium`} style={{ color: READINESS_CONFIG[market.readiness].color }}>
                {READINESS_CONFIG[market.readiness].label}
              </span>
            </div>
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-0.5">{market.name}</h3>
            <p className="text-[10px] text-[var(--color-text-muted)]">{market.region}</p>
            <p className="text-lg font-bold text-sky-400 mt-2">{market.opportunitySizeGW} GW</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Market opportunity</p>
          </button>
        ))}
      </div>

      {/* Selected Market Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Market Insight */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-sm font-bold text-[var(--color-text)] mb-2">{active.name} — Market Intelligence</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">{active.marketInsights}</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[var(--color-bg)]/50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60 mb-1">Opportunity</p>
                <p className="text-sm font-bold text-sky-400">{active.opportunitySizeGW} GW</p>
              </div>
              <div className="bg-[var(--color-bg)]/50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60 mb-1">Regulatory</p>
                <p className="text-sm font-bold text-[var(--color-text)]">{active.regulatoryComplexity}</p>
              </div>
              <div className="bg-[var(--color-bg)]/50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60 mb-1">Competition</p>
                <p className="text-sm font-bold text-[var(--color-text)]">{active.competitiveIntensity}</p>
              </div>
            </div>
          </div>

          {/* Entry Strategy */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-2">Entry Strategy</h3>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">{active.entryStrategy}</p>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {active.targetSegments.map((seg) => (
                <span key={seg} className="px-2 py-1 rounded-md bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300">
                  {seg}
                </span>
              ))}
            </div>

            <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Key Partners</p>
            <div className="flex flex-wrap gap-1.5">
              {active.keyPartners.map((p) => (
                <span key={p} className="px-2 py-1 rounded-md bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[11px] text-[var(--color-text-muted)]">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-4">Execution Roadmap</h3>
            <div className="space-y-3">
              {active.timeline.map((t, i) => (
                <div key={t.phase} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-sky-400">{i + 1}</span>
                    </div>
                    {i < active.timeline.length - 1 && <div className="w-px h-6 bg-[var(--color-border)] mt-1" />}
                  </div>
                  <div className="pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-[var(--color-text)]">{t.phase}</span>
                      <span className="text-[10px] text-sky-400 font-mono">{t.year}</span>
                    </div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{t.milestone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Investment */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[var(--color-text)] mb-3">Investment Range</h3>
            <p className="text-lg font-bold text-sky-400 mb-1">{active.investmentAUD}</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Staged over 5-7 years with gate reviews</p>
          </div>

          {/* Strengths */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[var(--color-text)] mb-3">Market Strengths</h3>
            <div className="space-y-2">
              {active.strengths.map((s) => (
                <div key={s} className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 flex-shrink-0 text-xs">+</span>
                  <span className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Challenges */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-xs font-bold text-[var(--color-text)] mb-3">Key Challenges</h3>
            <div className="space-y-2">
              {active.challenges.map((c) => (
                <div key={c} className="flex items-start gap-2">
                  <span className="text-amber-400 mt-0.5 flex-shrink-0 text-xs">!</span>
                  <span className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Expansion Strategy Summary */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider mb-3">Expansion Principles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-sky-400 mb-1">Partner-Led Entry</p>
            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
              Enter markets through JVs and partnerships with established local players. Avoid greenfield market entry without local knowledge.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-400 mb-1">Capital-Light Start</p>
            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
              Begin with development services and minority equity positions. Scale equity commitment only after proven pipeline and returns.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-400 mb-1">Transferable Expertise</p>
            <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
              Lead with capabilities that differentiate: BESS integration, grid connection management, and large-scale project delivery.
            </p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[var(--color-text-muted)]/50 mt-8 text-center">
        Geographic expansion strategy reviewed bi-annually. Market assessments as of Q1 FY26.
      </p>
    </div>
  )
}
