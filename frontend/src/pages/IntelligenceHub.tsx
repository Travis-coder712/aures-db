import { useNavigate } from 'react-router-dom'

const FEATURES = [
  {
    icon: '\u{1F3AF}',
    title: 'CIS / LTESA Scheme Intelligence',
    description: 'Overview, comparison, and milestone tracking for CIS and LTESA rounds',
    route: '/intelligence/scheme-tracker',
  },
  {
    icon: '\u{1F4CA}',
    title: 'COD Drift Analysis',
    description: 'Aggregate delay patterns by technology, state, and developer',
    route: '/intelligence/drift-analysis',
  },
  {
    icon: '\u{1F4A8}',
    title: 'Wind Resource Quality',
    description: 'Predicted capacity factors for development wind projects',
    route: '/intelligence/wind-resource',
  },
  {
    icon: '\u2600\uFE0F',
    title: 'Solar Resource',
    description: 'Solar capacity factor benchmarks by state, REZ, capacity class, and developer. Development pipeline predictions.',
    route: '/intelligence/solar-resource',
  },
  {
    icon: '\u{1F311}',
    title: 'Dunkelflaute Monitor',
    description: 'Low wind + solar periods and BESS adequacy analysis',
    route: '/intelligence/dunkelflaute',
  },
  {
    icon: '\u26A1',
    title: 'Energy Mix Transition',
    description: 'State-by-state generation mix evolution and pipeline projection',
    route: '/intelligence/energy-mix',
  },
  {
    icon: '\u{1F3D7}\uFE0F',
    title: 'Developer Execution',
    description: 'Track record ratings for project delivery reliability',
    route: '/intelligence/developer-scores',
  },
  {
    icon: '\u{1F4B0}',
    title: 'Revenue Intelligence',
    description: 'Revenue benchmarking and market price analysis',
    route: '/intelligence/revenue',
  },
  {
    icon: '\u{1F50C}',
    title: 'Transmission Infrastructure',
    description: 'Major NEM transmission upgrades, grid connection analytics, and REZ congestion',
    route: '/intelligence/transmission-infra',
  },
  {
    icon: '\u{1F4D1}',
    title: 'EIS Technical Specs',
    description: 'Wind resource, BESS chemistry, grid connection data from Environmental Impact Statements',
    route: '/intelligence/eis-technical',
  },
  {
    icon: '\u{1F50B}',
    title: 'Battery Watch',
    description: 'NSW & QLD BESS buildout tracking, milestones, demand context, and coal displacement',
    route: '/intelligence/battery-watch',
  },
  {
    icon: '\u{1F4C8}',
    title: 'BESS Bidding Intelligence',
    description: 'NEMWEB bidding strategy analysis, trading platform identification, and competitive dynamics',
    route: '/intelligence/bess-bidding',
  },
  {
    icon: '\u{1F50B}',
    title: 'BESS Portfolio Intelligence',
    description: 'Duration trends, grid-forming coverage, co-located projects, cell chemistry, and network service contracts across the Australian battery fleet.',
    route: '/intelligence/bess-portfolio',
  },
  {
    icon: '\u{1F4C5}',
    title: 'NEM Activities Timeline',
    description: 'Month-by-month key highlights across development, construction, and operations',
    route: '/intelligence/nem-activities',
  },
  {
    icon: '\u{1F4B5}',
    title: 'BESS Capex',
    description: 'Battery storage capex benchmarking by $/MW, $/MWh, OEM, and state',
    route: '/intelligence/bess-capex',
  },
  {
    icon: '\u{1F5D3}\uFE0F',
    title: 'Project Timeline',
    description: 'Gantt-style development, construction, and operations timeline across the pipeline',
    route: '/intelligence/project-timeline',
  },
  {
    icon: '\u{1F9ED}',
    title: 'Lifecycle Quartile Matrix',
    description: 'State-of-the-nation grid \u2014 every project by tech \u00d7 state \u00d7 stage with quartile scoring.',
    route: '/intelligence/lifecycle-quartile',
  },
  {
    icon: '\u{1F501}',
    title: 'Asset Lifecycle & Repowering',
    description: 'Operating fleet age profile, repowering candidates, aging OEM exposure, and fleet turnover forecast to 2050.',
    route: '/intelligence/asset-lifecycle',
  },
  {
    icon: '\u26A0\uFE0F',
    title: 'Risk & Probability Signals',
    description: 'Supply chain concentration, bankrupt-OEM exposure, dev-OEM chain risks, and scheme win probability scoring for development projects.',
    route: '/intelligence/risk-signals',
  },
] as const

export default function IntelligenceHub() {
  const navigate = useNavigate()

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)] mb-2">
        Intelligence Layer
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Analytical features powered by AURES data. Click any card to explore.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {FEATURES.map((f) => (
          <div
            key={f.route}
            onClick={() => navigate(f.route)}
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 cursor-pointer hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-bg-elevated)] transition-all active:scale-[0.98]"
          >
            <span className="text-3xl block mb-3">{f.icon}</span>
            <h2 className="text-sm font-semibold text-[var(--color-text)] mb-1">
              {f.title}
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[var(--color-text-muted)]/50 mt-8 text-center">
        Intelligence features are computed from project data and refresh with each data export.
      </p>
    </div>
  )
}
