import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useREZDetail } from '../hooks/useREZData'
import { TECHNOLOGY_CONFIG } from '../lib/types'
import type { REZAccessMap, RezPipelineEntry } from '../lib/types'
import { fetchREZAccess, fetchRezPipeline } from '../lib/dataService'

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

type AccessFilter = 'all' | 'secured' | 'not-secured'

export default function REZDetail() {
  const { id } = useParams<{ id: string }>()
  const { zone, projects, loading } = useREZDetail(id)
  const [accessMap, setAccessMap] = useState<REZAccessMap | null>(null)
  const [rezPipelineEntry, setRezPipelineEntry] = useState<RezPipelineEntry | null>(null)
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all')

  // NSW declared REZs have access rights
  const isNSWDeclared = zone?.state === 'NSW' && zone?.status === 'declared'

  useEffect(() => {
    if (isNSWDeclared) {
      fetchREZAccess().then(d => setAccessMap(d))
    }
  }, [isNSWDeclared])

  // Load v3.13.0 REZ Pipeline data and find the matching entry for this REZ id
  useEffect(() => {
    if (!id) return
    fetchRezPipeline().then(d => {
      if (!d) return
      const match = d.rezs.find(r => r.canonical_id === id) ?? null
      setRezPipelineEntry(match)
    })
  }, [id])

  const filteredProjects = (() => {
    if (!accessMap || accessFilter === 'all') return projects
    if (accessFilter === 'secured') return projects.filter(p => accessMap[p.id])
    return projects.filter(p => !accessMap[p.id])
  })()

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

      {/* AEMO IASR Pipeline + EnergyCo Access Rights (v3.13.0) */}
      {rezPipelineEntry && (rezPipelineEntry.iasr_total_mw > 0 || rezPipelineEntry.access_rights_mw > 0) && (
        <RezPipelinePanel entry={rezPipelineEntry} />
      )}

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

        {/* Access filter — only for NSW declared REZs */}
        {isNSWDeclared && accessMap && projects.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Access
            </span>
            {([
              { key: 'all' as AccessFilter, label: 'All' },
              { key: 'secured' as AccessFilter, label: '✓ Secured' },
              { key: 'not-secured' as AccessFilter, label: 'Not Secured' },
            ]).map(opt => (
              <button
                key={opt.key}
                onClick={() => setAccessFilter(opt.key)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  accessFilter === opt.key
                    ? opt.key === 'secured'
                      ? 'border-transparent bg-green-500/20 text-green-400 font-medium'
                      : opt.key === 'not-secured'
                      ? 'border-transparent bg-gray-500/20 text-gray-400 font-medium'
                      : 'border-blue-500 bg-blue-500/20 text-blue-400 font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

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
            {filteredProjects
              .sort((a, b) => b.capacity_mw - a.capacity_mw)
              .map((p) => {
                const tech = TECHNOLOGY_CONFIG[p.technology]
                const hasAccess: boolean | null = isNSWDeclared && accessMap
                  ? (accessMap[p.id] ? true : false)
                  : null
                return (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-primary)]/30 transition-colors group"
                  >
                    <span className="text-base">{tech?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                          {p.name}
                        </span>
                        {hasAccess === true && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium shrink-0">
                            ✓ REZ Access
                          </span>
                        )}
                        {hasAccess === false && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/10 text-[var(--color-text-muted)] shrink-0">
                            Access not secured
                          </span>
                        )}
                      </div>
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
            {filteredProjects.length === 0 && accessFilter !== 'all' && (
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 text-center">
                <p className="text-sm text-[var(--color-text-muted)]">
                  No projects match the selected access filter
                </p>
              </div>
            )}
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

// ============================================================
// RezPipelinePanel (v3.13.0)
// Surfaces AEMO IASR Committed/Anticipated + EnergyCo Access Rights
// data for this REZ. Rendered between the Description and the
// Projects list when there's data to show.
// ============================================================
function RezPipelinePanel({ entry }: { entry: RezPipelineEntry }) {
  const hasIasr = entry.iasr_committed_mw > 0 || entry.iasr_anticipated_mw > 0
  const hasAccess = entry.access_rights_mw > 0 && entry.access_rights_detail.length > 0

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-text)]">
        Pipeline &amp; Access Rights
        <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
          AEMO IASR · EnergyCo
        </span>
      </h2>

      {/* IASR pipeline panel */}
      {hasIasr && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              AEMO 2025 IASR Pipeline
              {entry.aemo_rez_id && (
                <span className="ml-2 text-xs font-normal text-[var(--color-text-muted)]">
                  AEMO ID: {entry.aemo_rez_id}
                </span>
              )}
            </h3>
            <a
              href="https://aemo.com.au/energy-systems/major-publications/integrated-system-plan-isp"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[var(--color-primary)] hover:underline"
            >
              IASR source ↗
            </a>
          </div>

          {/* IASR MW breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="bg-[var(--color-bg)] border border-blue-500/20 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-blue-400 mb-1">Committed</p>
              <p className="text-base font-bold text-[var(--color-text)]">
                {Math.round(entry.iasr_committed_mw).toLocaleString('en-AU')} MW
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {entry.iasr_committed_count} project{entry.iasr_committed_count === 1 ? '' : 's'}
              </p>
            </div>
            <div className="bg-[var(--color-bg)] border border-sky-500/20 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-sky-400 mb-1">Anticipated</p>
              <p className="text-base font-bold text-[var(--color-text)]">
                {Math.round(entry.iasr_anticipated_mw).toLocaleString('en-AU')} MW
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                {entry.iasr_anticipated_count} project{entry.iasr_anticipated_count === 1 ? '' : 's'}
              </p>
            </div>
            <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Total Pipeline</p>
              <p className="text-base font-bold text-[var(--color-text)]">
                {Math.round(entry.iasr_total_mw).toLocaleString('en-AU')} MW
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                Committed + Anticipated
              </p>
            </div>
          </div>

          {/* IASR projects not yet in AURES DB */}
          {entry.iasr_unmatched.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
              <p className="text-[10px] uppercase tracking-wider text-amber-400 mb-2">
                {entry.iasr_unmatched.length} IASR project{entry.iasr_unmatched.length === 1 ? '' : 's'} not yet matched to an AURES record
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                {entry.iasr_unmatched.map(u => (
                  <div key={u.iasr_id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[var(--color-text)] truncate">{u.power_station}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="px-1.5 py-0.5 rounded text-[10px]"
                        style={{
                          background: u.status === 'Committed' ? '#3b82f620' : '#0ea5e920',
                          color: u.status === 'Committed' ? '#60a5fa' : '#38bdf8',
                        }}
                      >
                        {u.status}
                      </span>
                      <span className="text-[var(--color-text-muted)]">{Math.round(u.capacity_mw)} MW</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EnergyCo Access Rights panel */}
      {hasAccess && (
        <div className="bg-[var(--color-bg-card)] border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-baseline justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              {entry.access_scheme}
              <span className="ml-2 text-xs font-normal text-emerald-400">
                {entry.access_rights_count} access right{entry.access_rights_count === 1 ? '' : 's'} · {(entry.access_rights_mw / 1000).toFixed(2)} GW
              </span>
            </h3>
            <a
              href="https://www.energyco.nsw.gov.au/industry/access-schemes"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-[var(--color-primary)] hover:underline"
            >
              EnergyCo source ↗
            </a>
          </div>
          <div className="space-y-1.5">
            {entry.access_rights_detail
              .slice()
              .sort((a, b) => b.capacity_mw - a.capacity_mw)
              .map(a => (
                <div
                  key={a.access_right_id}
                  className="flex items-center justify-between gap-2 px-3 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-emerald-400 font-mono text-[10px] flex-shrink-0">{a.access_right_id}</span>
                    {a.project_id ? (
                      <Link to={`/projects/${a.project_id}`} className="text-[var(--color-primary)] hover:underline truncate">
                        {a.project_name}
                      </Link>
                    ) : (
                      <span className="text-[var(--color-text)] truncate">{a.project_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.technology && (
                      <span className="text-[var(--color-text-muted)]">{a.technology}</span>
                    )}
                    <span className="text-[var(--color-text)] font-medium">{a.capacity_mw} MW</span>
                    {a.registration_date && (
                      <span className="text-[var(--color-text-muted)] text-[10px]">{a.registration_date}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] italic mt-3">
            Access rights granted by EnergyCo entitle the holder to dispatch from the relevant REZ network element up to the maximum capacity for the term of the scheme.
          </p>
        </div>
      )}
    </section>
  )
}
