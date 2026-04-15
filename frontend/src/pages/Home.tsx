import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useProjectIndex, useStats } from '../hooks/useProjectData'
import { fetchNews } from '../lib/dataService'
import { TECHNOLOGY_CONFIG, STATUS_CONFIG } from '../lib/types'
import type { NewsArticle } from '../lib/types'
import ProjectCard from '../components/common/ProjectCard'
import StatCard from '../components/common/StatCard'

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  'reneweconomy': { label: 'RE', color: 'bg-emerald-500/20 text-emerald-400' },
  'pv-magazine': { label: 'PV', color: 'bg-amber-500/20 text-amber-400' },
  'energy-storage-news': { label: 'ES', color: 'bg-blue-500/20 text-blue-400' },
}

function daysAgo(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff}d ago`
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`
    return dateStr
  } catch {
    return dateStr
  }
}

export default function Home() {
  const { stats, loading: statsLoading } = useStats()
  const { projects, loading: projectsLoading } = useProjectIndex()
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([])

  useEffect(() => {
    fetchNews().then(data => {
      if (data?.articles?.length) {
        setLatestNews(data.articles.slice(0, 4))
      }
    })
  }, [])

  // Featured: pick enriched projects first (high/good confidence), then by capacity
  const featured = [...projects]
    .sort((a, b) => {
      const confOrder = { high: 0, good: 1, medium: 2, low: 3, unverified: 4 }
      const ca = confOrder[a.data_confidence] ?? 4
      const cb = confOrder[b.data_confidence] ?? 4
      if (ca !== cb) return ca - cb
      return b.capacity_mw - a.capacity_mw
    })
    .slice(0, 4)

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

      {/* Dashboard shortcut — mobile only (desktop has sidebar) */}
      <Link
        to="/dashboard"
        className="flex items-center gap-3 mb-6 lg:hidden bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-3 hover:border-[var(--color-primary)]/30 transition-all"
      >
        <svg className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
        </svg>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-[var(--color-text)]">NEM Dashboard</span>
          <span className="text-xs text-[var(--color-text-muted)] ml-2">Live market overview</span>
        </div>
        <svg className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* Quick Stats */}
      <section className="mb-8">
        {statsLoading || !stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Projects Tracked"
              value={stats.total}
              sublabel={`${Object.keys(stats.by_state).length} states`}
            />
            <StatCard
              label="Total Capacity"
              value={`${(stats.total_capacity_mw / 1000).toFixed(0)} GW`}
              sublabel="Generation + storage"
              color="var(--color-primary)"
            />
            <StatCard
              label="Storage"
              value={`${(stats.total_storage_mwh / 1000).toFixed(0)} GWh`}
              sublabel="BESS + pumped hydro"
              color="var(--color-bess)"
            />
            <StatCard
              label="Operating"
              value={stats.by_status?.operating?.count ?? 0}
              sublabel={`${stats.by_status?.construction?.count ?? 0} in construction`}
              color="var(--color-operating)"
            />
          </div>
        )}
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {(['wind', 'solar', 'bess', 'hybrid', 'offshore_wind', 'pumped_hydro'] as const).map((tech) => {
            const config = TECHNOLOGY_CONFIG[tech]
            const techStats = stats?.by_technology?.[tech]
            const count = techStats?.count ?? 0
            const capacity = techStats?.capacity_mw ?? 0
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
                    : `${Math.round(capacity)} MW`
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
            const count = stats?.by_status?.[status]?.count ?? 0
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
        {projectsLoading ? (
          <div className="animate-pulse text-sm text-[var(--color-text-muted)]">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {featured.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      {/* Latest News */}
      {latestNews.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Latest News
              </h2>
              <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full animate-pulse">
                NEW
              </span>
            </div>
            <Link
              to="/news"
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {latestNews.map((article, idx) => {
              const badge = SOURCE_BADGES[article.source] || { label: '?', color: 'bg-gray-500/20 text-gray-400' }
              return (
                <a
                  key={idx}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3 hover:border-[var(--color-primary)]/20 transition-colors group"
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-lg ${badge.color} flex items-center justify-center font-bold text-[10px] mt-0.5`}>
                    {badge.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-1 font-medium">
                      {article.title}
                    </p>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                      {daysAgo(article.published_date)}
                      {article.matched_project_ids?.length > 0 && (
                        <span className="ml-2 text-[var(--color-primary)]/60">
                          • {article.matched_project_ids.length} project{article.matched_project_ids.length !== 1 ? 's' : ''} linked
                        </span>
                      )}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )
            })}
          </div>
        </section>
      )}

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

      {/* Guides */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            Guides & Documentation
          </h2>
          <Link
            to="/guides"
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            View all →
          </Link>
        </div>
        <Link
          to="/guides"
          className="flex items-center gap-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all"
        >
          <span className="text-3xl">📖</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-0.5">
              Read the AURES Guides
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Project plan, architecture, plain-English overview, build progress, and how this was built.
            </p>
          </div>
          <svg
            className="w-5 h-5 text-[var(--color-text-muted)] flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </section>

      {/* Coming Soon */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Coming Soon
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Link to="/watchlist" className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all block">
            <span className="text-lg">👁️</span>
            <h3 className="text-sm font-semibold text-[var(--color-text)] mt-2">Project Watchlist</h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">Star projects to track, monitor construction progress, and detect zombie projects</p>
          </Link>
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
