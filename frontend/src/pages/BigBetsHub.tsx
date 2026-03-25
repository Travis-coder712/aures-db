import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ============================================================
// Big Bets Strategy Hub — Australian Energy Company
// Three strategic themes: Business Model Innovation,
// Geographic Expansion, and Adjacency
// ============================================================

const THEMES = [
  {
    id: 'business-model-innovation',
    title: 'Business Model Innovation',
    subtitle: 'Reimagining how we create and capture value',
    color: '#8b5cf6',
    gradient: 'from-violet-600/20 to-violet-900/5',
    borderColor: 'border-violet-500/30',
    hoverBorder: 'hover:border-violet-400/60',
    route: '/big-bets/business-model-innovation',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    highlights: [
      'Energy-as-a-Service (EaaS)',
      'Virtual Power Plants (VPP)',
      'Peer-to-peer energy trading',
      'Behind-the-meter solutions',
    ],
    investmentRange: '$200M - $500M',
    timeHorizon: '3-7 years',
    riskProfile: 'Medium-High',
  },
  {
    id: 'geographic-expansion',
    title: 'Geographic Expansion',
    subtitle: 'Scaling proven capabilities into new markets',
    color: '#0ea5e9',
    gradient: 'from-sky-600/20 to-sky-900/5',
    borderColor: 'border-sky-500/30',
    hoverBorder: 'hover:border-sky-400/60',
    route: '/big-bets/geographic-expansion',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    highlights: [
      'Southeast Asia expansion',
      'Pacific Islands microgrids',
      'New Zealand market entry',
      'North Asian partnerships',
    ],
    investmentRange: '$500M - $1.5B',
    timeHorizon: '5-10 years',
    riskProfile: 'High',
  },
  {
    id: 'adjacency',
    title: 'Adjacency',
    subtitle: 'Leveraging core strengths into adjacent sectors',
    color: '#14b8a6',
    gradient: 'from-teal-600/20 to-teal-900/5',
    borderColor: 'border-teal-500/30',
    hoverBorder: 'hover:border-teal-400/60',
    route: '/big-bets/adjacency',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    highlights: [
      'Green hydrogen production',
      'Critical minerals processing',
      'EV charging infrastructure',
      'Carbon capture & storage',
    ],
    investmentRange: '$300M - $1B',
    timeHorizon: '5-15 years',
    riskProfile: 'High',
  },
] as const

const PORTFOLIO_SUMMARY = {
  totalInvestment: '$1.0B - $3.0B',
  initiatives: 12,
  activeProjects: 8,
  avgIRR: '12-18%',
}

const PRINCIPLES = [
  { title: 'Optionality', desc: 'Stage-gate funding to preserve flexibility and limit downside exposure' },
  { title: 'Leverage Core', desc: 'Build on existing customer relationships, grid assets, and energy expertise' },
  { title: 'Speed to Learn', desc: 'Prioritise pilots that generate market intelligence over perfection' },
  { title: 'Portfolio Balance', desc: 'Mix near-term revenue plays with longer-horizon transformational bets' },
]

export default function BigBetsHub() {
  const navigate = useNavigate()
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null)

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">
              Energy Big Bets
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Strategic growth themes for the Australian energy transition
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Portfolio Investment', value: PORTFOLIO_SUMMARY.totalInvestment, color: 'text-amber-400' },
          { label: 'Strategic Initiatives', value: PORTFOLIO_SUMMARY.initiatives.toString(), color: 'text-violet-400' },
          { label: 'Active Projects', value: PORTFOLIO_SUMMARY.activeProjects.toString(), color: 'text-sky-400' },
          { label: 'Target IRR', value: PORTFOLIO_SUMMARY.avgIRR, color: 'text-teal-400' },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{stat.label}</p>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Theme Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {THEMES.map((theme) => (
          <div
            key={theme.id}
            onClick={() => navigate(theme.route)}
            onMouseEnter={() => setHoveredTheme(theme.id)}
            onMouseLeave={() => setHoveredTheme(null)}
            className={`bg-gradient-to-br ${theme.gradient} bg-[var(--color-bg-card)] border ${theme.borderColor} ${theme.hoverBorder} rounded-xl p-6 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
              hoveredTheme === theme.id ? 'shadow-lg shadow-black/20 -translate-y-0.5' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div style={{ color: theme.color }}>{theme.icon}</div>
              <svg className="w-5 h-5 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
              </svg>
            </div>

            <h2 className="text-base font-bold text-[var(--color-text)] mb-1">{theme.title}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">{theme.subtitle}</p>

            <div className="space-y-1.5 mb-5">
              {theme.highlights.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.color }} />
                  <span className="text-xs text-[var(--color-text-muted)]">{h}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[var(--color-border)]">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60">Investment</p>
                <p className="text-xs font-semibold text-[var(--color-text)]">{theme.investmentRange}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60">Horizon</p>
                <p className="text-xs font-semibold text-[var(--color-text)]">{theme.timeHorizon}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/60">Risk</p>
                <p className="text-xs font-semibold text-[var(--color-text)]">{theme.riskProfile}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Investment Principles */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 mb-8">
        <h3 className="text-sm font-bold text-[var(--color-text)] mb-4">Big Bet Investment Principles</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRINCIPLES.map((p, i) => (
            <div key={p.title} className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-400">{i + 1}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--color-text)] mb-0.5">{p.title}</p>
                <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strategic Context */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <h3 className="text-sm font-bold text-[var(--color-text)] mb-3">Strategic Context</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
          <div>
            <p className="mb-2">
              Australia's energy sector is undergoing a once-in-a-generation transformation. The accelerated closure
              of coal-fired generation, coupled with the Capacity Investment Scheme (CIS) and state-level Renewable
              Energy Zones (REZ), creates a structural opportunity to deploy capital at scale.
            </p>
            <p>
              With 383+ GW of renewable energy in the development pipeline and $100B+ in required grid investment
              over the next decade, incumbents must place strategic bets that go beyond conventional generation.
            </p>
          </div>
          <div>
            <p className="mb-2">
              Our Big Bets framework identifies three vectors for transformational growth. Each theme is evaluated
              on strategic fit, market timing, competitive advantage, and capital efficiency.
            </p>
            <p>
              The portfolio is designed to balance near-term cash generation (business model innovation) with
              longer-horizon optionality (geographic expansion and adjacency), targeting a blended IRR of 12-18%
              across the full investment cycle.
            </p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[var(--color-text-muted)]/50 mt-8 text-center">
        Strategic framework aligned to Australian energy transition. Data informed by AURES project intelligence.
      </p>
    </div>
  )
}
