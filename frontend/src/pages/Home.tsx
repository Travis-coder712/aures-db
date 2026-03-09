import { Link } from 'react-router-dom'
import { SAMPLE_PROJECTS, getQuickStats } from '../data/sample-projects'
import { TECHNOLOGY_CONFIG, STATUS_CONFIG } from '../lib/types'
import ProjectCard from '../components/common/ProjectCard'
import StatCard from '../components/common/StatCard'

export default function Home() {
  const stats = getQuickStats()
  const recentProjects = SAMPLE_PROJECTS.slice(0, 4).map((p) => ({
    id: p.id,
    name: p.name,
    technology: p.technology,
    status: p.status,
    capacity_mw: p.capacity_mw,
    storage_mwh: p.storage_mwh,
    state: p.state,
    current_developer: p.current_developer,
    rez: p.rez,
    data_confidence: p.data_confidence,
  }))

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Hero */}
      <section className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mb-2">
          Australian Renewable Energy System
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
          Comprehensive intelligence on every significant renewable energy project in Australia's
          NEM and WEM markets. Sourced from AEMO, AFR, RenewEconomy, and more.
        </p>
      </section>

      {/* Quick Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Projects Tracked"
            value={stats.total}
            sublabel={`${stats.states.length} states`}
          />
          <StatCard
            label="Total Capacity"
            value={`${(stats.totalCapacity / 1000).toFixed(1)} GW`}
            sublabel="Generation + storage"
            color="var(--color-primary)"
          />
          <StatCard
            label="Storage"
            value={`${(stats.totalStorage / 1000).toFixed(1)} GWh`}
            sublabel="BESS + pumped hydro"
            color="var(--color-bess)"
          />
          <StatCard
            label="Operating"
            value={stats.operating}
            sublabel={`${stats.construction} in construction`}
            color="var(--color-operating)"
          />
        </div>
      </section>

      {/* Browse by Technology */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Browse by Technology
          </h2>
          <Link
            to="/projects"
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(['wind', 'solar', 'bess', 'hybrid'] as const).map((tech) => {
            const config = TECHNOLOGY_CONFIG[tech]
            const count = SAMPLE_PROJECTS.filter((p) => p.technology === tech).length
            const capacity = SAMPLE_PROJECTS
              .filter((p) => p.technology === tech)
              .reduce((sum, p) => sum + p.capacity_mw, 0)
            return (
              <Link
                key={tech}
                to={`/projects?tech=${tech}`}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-semibold text-[var(--color-text)]">
                    {config.label}
                  </span>
                </div>
                <p className="text-xl font-bold" style={{ color: config.color }}>
                  {count}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {capacity >= 1000
                    ? `${(capacity / 1000).toFixed(1)} GW`
                    : `${capacity} MW`
                  } capacity
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Browse by Status */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Pipeline Status
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
          {(['operating', 'commissioning', 'construction', 'development', 'withdrawn'] as const).map((status) => {
            const config = STATUS_CONFIG[status]
            const count = SAMPLE_PROJECTS.filter((p) => p.status === status).length
            return (
              <Link
                key={status}
                to={`/projects?status=${status}`}
                className="flex items-center gap-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 hover:border-[var(--color-primary)]/30 transition-all"
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-xs font-medium text-[var(--color-text)]">
                  {config.label}
                </span>
                <span className="ml-auto text-xs font-bold" style={{ color: config.color }}>
                  {count}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Featured Projects
          </h2>
          <Link
            to="/projects"
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {recentProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Data Sources
        </h2>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
            {[
              { name: 'AEMO', tier: 'Tier 1 — Official', desc: 'Generation Information, SCADA, MLFs' },
              { name: 'AFR', tier: 'Tier 2 — Authoritative', desc: 'Deal values, M&A, financing' },
              { name: 'RenewEconomy', tier: 'Tier 2 — Authoritative', desc: 'Project updates, analysis' },
              { name: 'WattClarity', tier: 'Tier 2 — Authoritative', desc: 'Market & grid analysis' },
            ].map((source) => (
              <div key={source.name}>
                <p className="text-sm font-semibold text-[var(--color-text)]">{source.name}</p>
                <p className="text-[10px] text-[var(--color-primary)]">{source.tier}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{source.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {[
            { icon: '🛡️', title: 'CIS Round Tracker', desc: 'Track all CIS tender rounds, winners, and project progress' },
            { icon: '📈', title: 'Performance League', desc: 'Capacity factor rankings for wind, solar, and BESS projects >150MW' },
            { icon: '👁️', title: 'Project Watchlist', desc: 'Monitor COD deadlines, risk scores, and zombie project detection' },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-4 opacity-60"
            >
              <span className="text-lg">{item.icon}</span>
              <h3 className="text-sm font-semibold text-[var(--color-text)] mt-2">{item.title}</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer note */}
      <footer className="text-center py-6 border-t border-[var(--color-border)]">
        <p className="text-xs text-[var(--color-text-muted)]">
          AURES is an open-source project. Data sourced from publicly available records.
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)]/50 mt-1">
          No investment advice. Always verify with primary sources.
        </p>
      </footer>
    </div>
  )
}
