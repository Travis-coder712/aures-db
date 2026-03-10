import { useParams, Link } from 'react-router-dom'
import { useREZDetail } from '../hooks/useREZData'
import { TECHNOLOGY_CONFIG } from '../lib/types'

const STATUS_COLORS: Record<string, string> = {
  declared: '#22c55e',
  'in-flight': '#84cc16',
  draft: '#f59e0b',
  approved: '#3b82f6',
  candidate: '#8b5cf6',
  planning: '#6b7280',
}

const STATUS_LABELS: Record<string, string> = {
  declared: 'Declared',
  'in-flight': 'In-Flight',
  draft: 'Draft',
  approved: 'Approved',
  candidate: 'Candidate',
  planning: 'Planning',
}

const STATE_COLORS: Record<string, string> = {
  NSW: '#3b82f6',
  VIC: '#8b5cf6',
  QLD: '#f59e0b',
  SA: '#ef4444',
  TAS: '#14b8a6',
}

const TX_STATUS_LABELS: Record<string, string> = {
  operating: 'Operating',
  construction: 'Under Construction',
  approved: 'Approved',
  planning: 'Planning',
  conceptual: 'Conceptual',
}

export default function REZDetail() {
  const { id } = useParams<{ id: string }>()
  const { zone, projects, loading } = useREZDetail(id)

  if (!zone) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <Link to="/rez" className="text-sm text-[var(--color-primary)] hover:underline mb-4 inline-block">
          ← All REZ Zones
        </Link>
        <p className="text-[var(--color-text-muted)]">REZ zone not found.</p>
      </div>
    )
  }

  const totalProjectCapacity = projects.reduce((s, p) => s + p.capacity_mw, 0)

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Back Link */}
      <Link to="/rez" className="text-sm text-[var(--color-primary)] hover:underline inline-block">
        ← All REZ Zones
      </Link>

      {/* Header */}
      <section>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded"
            style={{ color: STATE_COLORS[zone.state], backgroundColor: STATE_COLORS[zone.state] + '15' }}
          >
            {zone.state}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ color: STATUS_COLORS[zone.status], backgroundColor: STATUS_COLORS[zone.status] + '15' }}
          >
            {STATUS_LABELS[zone.status]}
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mb-2">
          {zone.name} REZ
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">{zone.status_detail}</p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox
          label="Target Capacity"
          value={zone.target_capacity_gw !== null ? `${zone.target_capacity_gw} GW` : 'TBD'}
          color="var(--color-primary)"
        />
        <StatBox
          label="Registered Projects"
          value={projects.length > 0 ? String(projects.length) : '—'}
        />
        <StatBox
          label="Project Capacity"
          value={
            totalProjectCapacity > 0
              ? totalProjectCapacity >= 1000
                ? `${(totalProjectCapacity / 1000).toFixed(1)} GW`
                : `${totalProjectCapacity} MW`
              : '—'
          }
          color="#22c55e"
        />
        <StatBox
          label="Transmission"
          value={zone.transmission_status ? TX_STATUS_LABELS[zone.transmission_status] : 'N/A'}
          color={
            zone.transmission_status === 'operating'
              ? '#22c55e'
              : zone.transmission_status === 'construction'
              ? '#f59e0b'
              : undefined
          }
        />
      </section>

      {/* Description */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">{zone.description}</p>
        {zone.transmission_project && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              <span className="font-medium text-[var(--color-text)]">Transmission: </span>
              {zone.transmission_project}
            </p>
          </div>
        )}
      </section>

      {/* Projects in this REZ */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">
          Projects in {zone.name}
          {projects.length > 0 && (
            <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">
              ({projects.length})
            </span>
          )}
        </h2>
        {loading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--color-bg-card)] rounded-lg h-14" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              No projects currently linked to this REZ in the database.
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              REZ–project linking will improve as data is enriched.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects
              .sort((a, b) => b.capacity_mw - a.capacity_mw)
              .map((p) => {
                const tech = TECHNOLOGY_CONFIG[p.technology]
                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)]/30 transition-colors group"
                  >
                    <span className="text-base">{tech?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[var(--color-text)] truncate block group-hover:text-[var(--color-primary)] transition-colors">
                        {p.name}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {tech?.label} · {p.status}
                      </span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: tech?.color }}>
                      {p.capacity_mw >= 1000
                        ? `${(p.capacity_mw / 1000).toFixed(1)} GW`
                        : `${p.capacity_mw} MW`}
                    </span>
                  </Link>
                )
              })}
          </div>
        )}
      </section>

      {/* Sources */}
      {zone.sources.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Sources</h2>
          <div className="space-y-2">
            {zone.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
              >
                <span className="text-xs bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded">
                  Tier {s.source_tier ?? '?'}
                </span>
                {s.title}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className="text-lg font-bold" style={{ color: color || 'var(--color-text)' }}>
        {value}
      </p>
    </div>
  )
}
