import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { TECHNOLOGY_CONFIG, type Project } from '../lib/types'
import { useProject } from '../hooks/useProjectData'
import TechBadge from '../components/common/TechBadge'
import StatusBadge from '../components/common/StatusBadge'
import ConfidenceDots from '../components/common/ConfidenceDots'
import PerformanceTab from '../components/charts/PerformanceTab'

type Tab = 'overview' | 'timeline' | 'technical' | 'performance' | 'sources'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const { project, loading } = useProject(id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="text-sm text-[var(--color-text-muted)] animate-pulse">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] px-4 text-center">
        <span className="text-5xl mb-4">🔌</span>
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">Project Not Found</h1>
        <Link to="/projects" className="text-sm text-[var(--color-primary)] hover:underline">
          ← Back to projects
        </Link>
      </div>
    )
  }

  const techConfig = TECHNOLOGY_CONFIG[project.technology]

  const isOperating = project.status === 'operating' || project.status === 'commissioning'
  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'technical', label: 'Technical' },
    ...(isOperating ? [{ key: 'performance' as Tab, label: 'Performance' }] : []),
    { key: 'sources', label: 'Sources' },
  ]

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/projects" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← All Projects
        </Link>
      </div>

      {/* Project Header */}
      <header className="mb-6">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl mt-0.5">{techConfig.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)] leading-tight mb-1">
              {project.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <TechBadge technology={project.technology} />
              <StatusBadge status={project.status} />
              <ConfidenceDots confidence={project.data_confidence} showLabel />
            </div>
          </div>
        </div>

        {/* Key Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <MetricBox label="Capacity" value={`${project.capacity_mw} MW`} />
          {project.storage_mwh && (
            <MetricBox label="Storage" value={`${project.storage_mwh} MWh`} />
          )}
          <MetricBox label="State" value={project.state} />
          <MetricBox
            label="COD"
            value={project.cod_current || 'TBD'}
            badge={getCODDriftBadge(project)}
          />
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-0.5 mb-6 bg-[var(--color-bg-card)] rounded-lg p-0.5 border border-[var(--color-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab project={project} />}
      {activeTab === 'timeline' && <TimelineTab project={project} />}
      {activeTab === 'technical' && <TechnicalTab project={project} />}
      {activeTab === 'performance' && <PerformanceTab project={project} />}
      {activeTab === 'sources' && <SourcesTab project={project} />}
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function MetricBox({ label, value, badge }: { label: string; value: string; badge?: { text: string; color: string } | null }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-3 py-2">
      <p className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-[var(--color-text)]">{value}</p>
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  )
}

function getCODDriftBadge(project: Project): { text: string; color: string } | null {
  if (!project.cod_original || !project.cod_current) return null
  const origMatch = project.cod_original.match(/(\d{4})/)
  const currMatch = project.cod_current.match(/(\d{4})/)
  if (!origMatch || !currMatch) return null
  const drift = (parseInt(currMatch[1]) - parseInt(origMatch[1])) * 12
  if (drift === 0) return null
  if (drift > 0) return { text: `+${drift} mo`, color: '#f59e0b' }
  return { text: `${drift} mo`, color: '#22c55e' }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3 flex items-center gap-2">
      {children}
    </h3>
  )
}

// ============================================================
// Overview Tab
// ============================================================

function OverviewTab({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      {/* Notable */}
      {project.notable && (
        <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-4">
          <p className="text-sm text-[var(--color-text)]">{project.notable}</p>
        </div>
      )}

      {/* Key Details */}
      <section>
        <SectionTitle>Key Details</SectionTitle>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
          <DetailRow label="Developer" value={project.current_developer || '—'} />
          {project.current_operator && (
            <DetailRow label="Operator" value={project.current_operator} />
          )}
          <DetailRow label="Location" value={`${project.lga || '—'}, ${project.state}`} />
          {project.rez && <DetailRow label="REZ" value={project.rez} />}
          <DetailRow label="Connection NSP" value={project.connection_nsp || '—'} />
          <DetailRow label="Connection Status" value={project.connection_status || '—'} />
          {project.cod_current && <DetailRow label="Expected COD" value={project.cod_current} />}
          {project.cod_original && project.cod_original !== project.cod_current && (
            <DetailRow
              label="Original COD"
              value={project.cod_original}
              highlight="drift"
            />
          )}
        </div>
      </section>

      {/* COD Drift History */}
      {project.cod_history.length > 0 && (
        <section>
          <SectionTitle>COD Drift History</SectionTitle>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="space-y-2">
              {project.cod_history.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono w-20 flex-shrink-0">
                    {entry.date.substring(0, 7)}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
                  <span className="text-[var(--color-text)]">{entry.estimate}</span>
                  <span className="text-[10px] text-[var(--color-text-muted)] ml-auto truncate">
                    {entry.source}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ownership History */}
      {project.ownership_history.length > 0 && (
        <section>
          <SectionTitle>Ownership History</SectionTitle>
          <div className="space-y-2">
            {project.ownership_history.map((record, i) => (
              <div
                key={i}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{record.owner}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {record.role} · {record.period}
                    </p>
                  </div>
                  {record.acquisition_value_aud && (
                    <span className="text-sm font-bold text-[var(--color-accent)]">
                      ${(record.acquisition_value_aud / 1000000).toFixed(0)}M
                    </span>
                  )}
                </div>
                {record.transaction_structure && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    {record.transaction_structure}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Stakeholder Issues */}
      {project.stakeholder_issues && project.stakeholder_issues.length > 0 && (
        <section>
          <SectionTitle>Stakeholder Issues</SectionTitle>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
            <ul className="space-y-1">
              {project.stakeholder_issues.map((issue, i) => (
                <li key={i} className="text-sm text-[var(--color-text)] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <span
        className={`text-sm font-medium ${
          highlight === 'drift'
            ? 'text-[var(--color-accent)] line-through opacity-60'
            : 'text-[var(--color-text)]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

// ============================================================
// Timeline Tab
// ============================================================

function TimelineTab({ project }: { project: Project }) {
  const sorted = [...project.timeline].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  const eventColors: Record<string, string> = {
    conceived: '#6b7280',
    planning_submitted: '#3b82f6',
    planning_approved: '#22c55e',
    planning_rejected: '#ef4444',
    ownership_change: '#f59e0b',
    construction_start: '#f97316',
    cod: '#22c55e',
    commissioning: '#84cc16',
    expansion: '#06b6d4',
    notable: '#8b5cf6',
    rez_access: '#14b8a6',
    capacity_change: '#06b6d4',
    cod_change: '#f59e0b',
  }

  return (
    <div className="space-y-0">
      {sorted.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
          No timeline events recorded yet
        </p>
      )}
      {sorted.map((event, i) => {
        const color = eventColors[event.event_type] || '#6b7280'
        return (
          <div key={i} className="flex gap-4 pb-6 last:pb-0">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mt-1 border-2"
                style={{ borderColor: color, backgroundColor: `${color}40` }}
              />
              {i < sorted.length - 1 && (
                <div className="w-px flex-1 bg-[var(--color-border)] mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <p className="text-sm font-semibold text-[var(--color-text)]">{event.title}</p>
                <span className="text-[10px] text-[var(--color-text-muted)] font-mono flex-shrink-0">
                  {formatDate(event.date, event.date_precision)}
                </span>
              </div>
              <span
                className="inline-block text-[10px] px-1.5 py-0.5 rounded-full mb-1 font-medium"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {event.event_type.replace(/_/g, ' ')}
              </span>
              {event.detail && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                  {event.detail}
                </p>
              )}
              {event.sources.length > 0 && (
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {event.sources.map((src, j) => (
                    <a
                      key={j}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-[var(--color-primary)] hover:underline"
                    >
                      {src.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatDate(date: string, precision: string): string {
  const d = new Date(date)
  switch (precision) {
    case 'day':
      return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    case 'month':
      return d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
    case 'quarter':
      const q = Math.ceil((d.getMonth() + 1) / 3)
      return `Q${q} ${d.getFullYear()}`
    case 'year':
      return d.getFullYear().toString()
    default:
      return date
  }
}

// ============================================================
// Technical Tab
// ============================================================

function TechnicalTab({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      {/* Suppliers */}
      <section>
        <SectionTitle>Equipment & Suppliers</SectionTitle>
        {project.suppliers.length > 0 ? (
          <div className="space-y-2">
            {project.suppliers.map((supplier, i) => (
              <div
                key={i}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{supplier.supplier}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {supplier.role.replace(/_/g, ' ').toUpperCase()}
                      {supplier.model && ` · ${supplier.model}`}
                    </p>
                  </div>
                  {supplier.quantity && (
                    <span className="text-xs text-[var(--color-text-muted)]">
                      ×{supplier.quantity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-6 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              Supplier data not yet verified for this project
            </p>
          </div>
        )}
      </section>

      {/* Grid Connection */}
      <section>
        <SectionTitle>Grid Connection</SectionTitle>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
          <DetailRow label="Connection NSP" value={project.connection_nsp || '—'} />
          <DetailRow label="Connection Status" value={project.connection_status || '—'} />
          {project.has_sips && <DetailRow label="SIPS" value="Yes" />}
          {project.has_syncon && <DetailRow label="SynCon" value="Yes" />}
          {project.has_statcom && <DetailRow label="STATCOM" value="Yes" />}
          {project.has_harmonic_filter && <DetailRow label="Harmonic Filter" value="Yes" />}
          {project.grid_forming && <DetailRow label="Grid Forming" value="Yes" />}
        </div>
      </section>

      {/* Offtakes */}
      <section>
        <SectionTitle>Offtake Agreements</SectionTitle>
        {project.offtakes.length > 0 ? (
          <div className="space-y-2">
            {project.offtakes.map((offtake, i) => (
              <div
                key={i}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">{offtake.party}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {offtake.type}
                      {offtake.term_years && ` · ${offtake.term_years} years`}
                      {offtake.capacity_mw && ` · ${offtake.capacity_mw} MW`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-6 text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              No offtake agreements recorded
            </p>
          </div>
        )}
      </section>

      {/* Cost Sources */}
      {project.cost_sources && project.cost_sources.length > 0 && (
        <section>
          <SectionTitle>Cost Information (Multi-Source)</SectionTitle>
          <div className="space-y-2">
            {project.cost_sources.map((cs, i) => (
              <div
                key={i}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-accent)]">{cs.value}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {cs.source} · {cs.date.substring(0, 7)}
                    </p>
                  </div>
                </div>
                {cs.what_this_covers && (
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
                    {cs.what_this_covers}
                  </p>
                )}
                {cs.context && (
                  <p className="text-[10px] text-[var(--color-primary)]/70 mt-0.5">
                    ⓘ {cs.context}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ============================================================
// Sources Tab
// ============================================================

function SourcesTab({ project }: { project: Project }) {
  return (
    <div className="space-y-6">
      <section>
        <SectionTitle>Data Sources</SectionTitle>
        <div className="space-y-2">
          {project.sources.map((source, i) => (
            <a
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">{source.title}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[250px]">
                  {source.url}
                </p>
              </div>
              {source.source_tier && (
                <span className="text-[10px] bg-[var(--color-bg-elevated)] px-2 py-0.5 rounded-full text-[var(--color-text-muted)]">
                  Tier {source.source_tier}
                </span>
              )}
            </a>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Data Quality</SectionTitle>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-[var(--color-text-muted)]">Overall Confidence</span>
            <ConfidenceDots confidence={project.data_confidence} showLabel />
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-[var(--color-text-muted)]">Last Updated</span>
            <span className="text-sm text-[var(--color-text)]">{project.last_updated}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-[var(--color-text-muted)]">Last Verified</span>
            <span className="text-sm text-[var(--color-text)]">{project.last_verified}</span>
          </div>
          {project.aemo_gen_info_id && (
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-[var(--color-text-muted)]">AEMO Gen Info ID</span>
              <span className="text-sm text-[var(--color-text)] font-mono">{project.aemo_gen_info_id}</span>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
