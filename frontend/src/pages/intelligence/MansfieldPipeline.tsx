/**
 * Mansfield Regional Pipeline (v3.10.0)
 *
 * Proof-of-concept regional view: every renewable project within 100km of
 * Mansfield, VIC, on an interactive map with filters by asset type and a
 * 7-tier pipeline-stage ladder. The eventual NEM-wide "Under Construction"
 * map is expected to be built on top of this same component, with the
 * center / radius constants replaced by a search box.
 *
 * Data comes from `frontend/public/data/analytics/intelligence/mansfield-pipeline.json`
 * (written by `pipeline/exporters/export_regional_pipeline.py`), which already
 * applies the 100km haversine filter and the pipeline_tier derivation server-side.
 */
import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Circle, Popup } from 'react-leaflet'
import { fetchMansfieldPipeline } from '../../lib/dataService'
import { TECHNOLOGY_CONFIG, PIPELINE_TIER_CONFIG } from '../../lib/types'
import type { Technology, PipelineTier, RegionalPipelineData, RegionalPipelineProject } from '../../lib/types'
import DataProvenance from '../../components/common/DataProvenance'
import ScrollableTable from '../../components/common/ScrollableTable'

const MANSFIELD_CENTER: [number, number] = [-37.0556, 146.0823]
const DEFAULT_ZOOM = 8
const RADIUS_METERS = 100_000

// Marker radius in pixels — sized by project capacity. Matches MapView.tsx scale.
function markerRadius(capacity_mw: number | null): number {
  const c = capacity_mw ?? 0
  if (c >= 1000) return 11
  if (c >= 500) return 9
  if (c >= 200) return 7
  if (c >= 50) return 5
  return 4
}

function fmtMW(mw: number): string {
  return mw >= 1000 ? `${(mw / 1000).toFixed(1)} GW` : `${Math.round(mw)} MW`
}

const ALL_TIERS: PipelineTier[] = [
  'operating',
  'construction',
  'connection_approved',
  'connection_submitted',
  'planning_approved',
  'planning_submitted',
  'early_stage',
]

const ALL_TECHS: Technology[] = ['wind', 'solar', 'bess', 'hybrid', 'pumped_hydro', 'offshore_wind']

export default function MansfieldPipeline() {
  const [data, setData] = useState<RegionalPipelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTechs, setSelectedTechs] = useState<Set<Technology>>(() => new Set(ALL_TECHS))
  const [selectedTiers, setSelectedTiers] = useState<Set<PipelineTier>>(() => new Set(ALL_TIERS))

  useEffect(() => {
    fetchMansfieldPipeline()
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [])

  const toggleTech = (t: Technology) =>
    setSelectedTechs(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  const toggleTier = (t: PipelineTier) =>
    setSelectedTiers(prev => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })

  const filtered = useMemo(() => {
    if (!data) return []
    return data.projects.filter(
      p => selectedTechs.has(p.technology) && selectedTiers.has(p.pipeline_tier),
    )
  }, [data, selectedTechs, selectedTiers])

  // Hero stats from the full (unfiltered) dataset — the page header speaks to
  // the whole 100km region. Tier-segment totals respect filters via the chip
  // counters below.
  const heroStats = useMemo(() => {
    if (!data) return { count: 0, operatingMW: 0, constructionMW: 0, pipelineMW: 0 }
    const stats = { count: data.projects.length, operatingMW: 0, constructionMW: 0, pipelineMW: 0 }
    for (const p of data.projects) {
      const mw = p.capacity_mw ?? 0
      if (p.pipeline_tier === 'operating') stats.operatingMW += mw
      else if (p.pipeline_tier === 'construction') stats.constructionMW += mw
      else stats.pipelineMW += mw
    }
    return stats
  }, [data])

  // Per-tier counts for the chip toolbar — reflect what's currently filtered IN
  // (within selected techs) so the chip labels show the active subset.
  const tierCounts = useMemo(() => {
    const counts = new Map<PipelineTier, { n: number; mw: number }>()
    for (const t of ALL_TIERS) counts.set(t, { n: 0, mw: 0 })
    if (!data) return counts
    for (const p of data.projects) {
      if (!selectedTechs.has(p.technology)) continue
      const bucket = counts.get(p.pipeline_tier)
      if (bucket) {
        bucket.n += 1
        bucket.mw += p.capacity_mw ?? 0
      }
    }
    return counts
  }, [data, selectedTechs])

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="text-sm text-[var(--color-text-muted)] animate-pulse">Loading regional pipeline…</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">Mansfield Regional Pipeline</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          No data file available. Run <code className="font-mono">python3 pipeline/exporters/export_regional_pipeline.py</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Mansfield Regional Pipeline</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Renewable projects within {data.radius_km} km of Mansfield, VIC · {data.project_count} projects · {fmtMW(data.total_mw)} total nameplate.
          Proof of concept for the eventual NEM-wide Under-Construction map.
        </p>
        <div className="mt-3">
          <DataProvenance page="mansfield-pipeline" />
        </div>
      </div>

      {/* Hero stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">Projects in radius</div>
          <div className="text-2xl font-bold text-[var(--color-text)] mt-1">{heroStats.count}</div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wide text-emerald-300">Operating</div>
          <div className="text-2xl font-bold text-emerald-200 mt-1">{fmtMW(heroStats.operatingMW)}</div>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/30 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wide text-purple-300">Construction</div>
          <div className="text-2xl font-bold text-purple-200 mt-1">{fmtMW(heroStats.constructionMW)}</div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wide text-amber-300">Pipeline</div>
          <div className="text-2xl font-bold text-amber-200 mt-1">{fmtMW(heroStats.pipelineMW)}</div>
        </div>
      </div>

      {/* Filter strip — technology chips */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-[var(--color-text-muted)] uppercase tracking-wide">Technology:</span>
          {ALL_TECHS.map(tech => {
            const cfg = TECHNOLOGY_CONFIG[tech]
            const on = selectedTechs.has(tech)
            return (
              <button
                key={tech}
                onClick={() => toggleTech(tech)}
                className="px-2 py-0.5 rounded-full border transition-colors"
                style={
                  on
                    ? { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}80`, color: cfg.color }
                    : { backgroundColor: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }
                }
              >
                {on ? '✓ ' : '+ '}{cfg.icon} {cfg.label}
              </button>
            )
          })}
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={() => setSelectedTechs(new Set(ALL_TECHS))}
              className="px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-blue-500 hover:text-blue-300 transition-colors"
            >All techs</button>
            <button
              onClick={() => setSelectedTechs(new Set())}
              className="px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] transition-colors"
            >Clear</button>
          </div>
        </div>

        {/* Filter strip — pipeline tier chips */}
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-[var(--color-text-muted)] uppercase tracking-wide">Stage:</span>
          {ALL_TIERS.map(tier => {
            const cfg = PIPELINE_TIER_CONFIG[tier]
            const on = selectedTiers.has(tier)
            const bucket = tierCounts.get(tier)
            return (
              <button
                key={tier}
                onClick={() => toggleTier(tier)}
                className="px-2 py-0.5 rounded-full border transition-colors"
                title={cfg.description}
                style={
                  on
                    ? { backgroundColor: `${cfg.color}20`, borderColor: `${cfg.color}80`, color: cfg.color }
                    : { backgroundColor: 'transparent', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }
                }
              >
                {on ? '✓ ' : '+ '}{cfg.label} <span className="opacity-70">({bucket?.n ?? 0})</span>
              </button>
            )
          })}
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={() => setSelectedTiers(new Set(['operating', 'construction']))}
              className="px-2 py-0.5 rounded-full border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition-colors"
            >Built / building</button>
            <button
              onClick={() => setSelectedTiers(new Set(['connection_approved', 'connection_submitted', 'planning_approved', 'planning_submitted', 'early_stage']))}
              className="px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 transition-colors"
            >Pipeline only</button>
            <button
              onClick={() => setSelectedTiers(new Set(ALL_TIERS))}
              className="px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-blue-500 hover:text-blue-300 transition-colors"
            >All stages</button>
            <button
              onClick={() => setSelectedTiers(new Set())}
              className="px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)] transition-colors"
            >Clear</button>
          </div>
        </div>

        <div className="text-[10px] text-[var(--color-text-muted)] italic">
          Showing {filtered.length} of {data.project_count} projects · {fmtMW(filtered.reduce((s, p) => s + (p.capacity_mw ?? 0), 0))}
        </div>
      </div>

      {/* Map */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div style={{ height: 520, background: '#0f172a' }}>
          <MapContainer
            center={MANSFIELD_CENTER}
            zoom={DEFAULT_ZOOM}
            className="h-full w-full"
            style={{ background: '#0f172a' }}
            zoomControl={true}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {/* 100km radius ring around Mansfield */}
            <Circle
              center={MANSFIELD_CENTER}
              radius={RADIUS_METERS}
              pathOptions={{ color: '#0ea5e9', weight: 1, opacity: 0.4, fillOpacity: 0.03 }}
            />
            {filtered.map(project => (
              <ProjectMarker key={project.id} project={project} />
            ))}
          </MapContainer>
        </div>
        <div className="px-4 py-2 text-[10px] text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
          Marker radius scales with capacity. Fill colour = pipeline stage; stroke colour = technology. Click a marker for project detail.
        </div>
      </div>

      {/* Project list table */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text)] mb-2 uppercase tracking-wide">Project list</h2>
        <ScrollableTable>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-text-muted)] uppercase tracking-wide text-[10px]">
                <th className="text-left p-2">Project</th>
                <th className="text-left p-2 hidden md:table-cell">Developer</th>
                <th className="text-left p-2">Tech</th>
                <th className="text-right p-2">MW</th>
                <th className="text-left p-2">Stage</th>
                <th className="text-left p-2 hidden lg:table-cell">AEMO status</th>
                <th className="text-right p-2 hidden md:table-cell">Distance</th>
                <th className="text-left p-2 hidden xl:table-cell">COD</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const techCfg = TECHNOLOGY_CONFIG[p.technology]
                const tierCfg = PIPELINE_TIER_CONFIG[p.pipeline_tier]
                return (
                  <tr key={p.id} className="border-b border-[var(--color-border)]/40 hover:bg-white/5">
                    <td className="p-2">
                      <Link to={`/projects/${p.id}`} className="text-blue-400 hover:underline">{p.name}</Link>
                    </td>
                    <td className="p-2 hidden md:table-cell text-[var(--color-text-muted)]">{p.current_developer ?? '—'}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded-full text-[9px]" style={{ backgroundColor: `${techCfg.color}20`, color: techCfg.color }}>
                        {techCfg.icon} {techCfg.label}
                      </span>
                    </td>
                    <td className="p-2 text-right font-medium">{p.capacity_mw ? Math.round(p.capacity_mw).toLocaleString() : '—'}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium" style={{ backgroundColor: `${tierCfg.color}20`, color: tierCfg.color }}>
                        {tierCfg.label}
                      </span>
                    </td>
                    <td className="p-2 hidden lg:table-cell text-[var(--color-text-muted)] text-[10px]">{p.aemo_status ?? '—'}</td>
                    <td className="p-2 text-right hidden md:table-cell text-[var(--color-text-muted)]">{p.distance_km.toFixed(0)} km</td>
                    <td className="p-2 hidden xl:table-cell text-[var(--color-text-muted)] text-[10px]">{p.cod_current ?? '—'}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-[var(--color-text-muted)] italic">
                    No projects match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollableTable>
      </section>

      {/* Data coverage callout */}
      <div className="bg-[var(--color-bg-card)] border border-amber-500/30 rounded-xl p-4 text-xs">
        <div className="font-semibold text-amber-300 mb-1">Data coverage caveat</div>
        <p className="text-[var(--color-text-muted)] leading-relaxed">
          AURES shows {data.project_count} projects in the {data.radius_km}-km radius. ~9 development-stage projects had no lat/lon in our database
          before this release — coordinates were hand-curated from place-name centroids (Strathbogie Ranges, Glenrowan, Goorambat, Winton, Mansfield, West Mokoan)
          and are accurate to within ~10 km. Verified sub-km coordinates exist for the operating + construction cohort. The eventual NEM-wide expansion of this view will need a geocoding pipeline backfill — flagged as a follow-up.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Marker
// ============================================================

function ProjectMarker({ project }: { project: RegionalPipelineProject }) {
  const techCfg = TECHNOLOGY_CONFIG[project.technology]
  const tierCfg = PIPELINE_TIER_CONFIG[project.pipeline_tier]
  return (
    <CircleMarker
      center={[project.lat, project.lng]}
      radius={markerRadius(project.capacity_mw)}
      pathOptions={{
        color: techCfg.color,
        fillColor: tierCfg.color,
        fillOpacity: 0.7,
        weight: 2,
        opacity: 0.9,
      }}
    >
      <Popup>
        <div className="min-w-[200px]" style={{ color: '#f1f5f9' }}>
          <div className="font-semibold text-sm mb-1" style={{ color: '#f1f5f9' }}>{project.name}</div>
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${techCfg.color}20`, color: techCfg.color }}>
              {techCfg.icon} {techCfg.label}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: `${tierCfg.color}20`, color: tierCfg.color }}>
              {tierCfg.label}
            </span>
          </div>
          <div className="text-xs space-y-0.5" style={{ color: '#94a3b8' }}>
            <div>{project.capacity_mw ? fmtMW(project.capacity_mw) : '—'} · {project.state}</div>
            {project.storage_mwh && project.storage_mwh > 0 && (
              <div>{project.storage_mwh >= 1000 ? `${(project.storage_mwh / 1000).toFixed(1)} GWh` : `${project.storage_mwh} MWh`} storage</div>
            )}
            {project.current_developer && <div className="truncate">{project.current_developer}</div>}
            {project.aemo_status && <div className="italic">AEMO: {project.aemo_status}</div>}
            {project.cod_current && <div>COD target: {project.cod_current}</div>}
            <div>{project.distance_km.toFixed(0)} km from Mansfield</div>
          </div>
          <Link to={`/projects/${project.id}`} className="inline-block mt-2 text-xs font-medium" style={{ color: '#0ea5e9' }}>
            View details →
          </Link>
        </div>
      </Popup>
    </CircleMarker>
  )
}
