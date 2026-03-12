import { useParams, Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useOfftaker } from '../hooks/useOfftakerData'
import { useProjectIndex } from '../hooks/useProjectData'
import { TECHNOLOGY_CONFIG, STATUS_CONFIG, OFFTAKE_TYPE_CONFIG } from '../lib/types'
import type { Technology, ProjectStatus, ProjectSummary, OfftakeType } from '../lib/types'
import ProjectCard from '../components/common/ProjectCard'

export default function OfftakerDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { offtaker, loading: offLoading } = useOfftaker(slug)
  const { projects: allProjects, loading: projLoading } = useProjectIndex()

  const loading = offLoading || projLoading

  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[var(--color-bg-card)] rounded w-64" />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--color-bg-card)] rounded-xl h-24" />
            ))}
          </div>
          <div className="bg-[var(--color-bg-card)] rounded-xl h-60" />
        </div>
      </div>
    )
  }

  if (!offtaker) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto text-center py-20">
        <p className="text-lg text-[var(--color-text-muted)]">Offtaker not found</p>
        <Link to="/offtakers" className="mt-2 text-sm text-[var(--color-primary)] hover:underline inline-block">
          Back to offtakers
        </Link>
      </div>
    )
  }

  const projects = offtaker.project_ids
    .map((id) => allProjects.find((p) => p.id === id))
    .filter((p): p is ProjectSummary => !!p)
    .sort((a, b) => b.capacity_mw - a.capacity_mw)

  const techData = Object.entries(offtaker.by_technology)
    .map(([tech, count]) => ({
      tech: tech as Technology,
      label: TECHNOLOGY_CONFIG[tech as Technology]?.label ?? tech,
      count: count as number,
      color: TECHNOLOGY_CONFIG[tech as Technology]?.color ?? '#6b7280',
      capacity: projects
        .filter((p) => p.technology === tech)
        .reduce((s, p) => s + p.capacity_mw, 0),
    }))
    .sort((a, b) => b.capacity - a.capacity)

  const statusData = Object.entries(offtaker.by_status)
    .map(([status, count]) => ({
      status: status as ProjectStatus,
      label: STATUS_CONFIG[status as ProjectStatus]?.label ?? status,
      count: count as number,
      color: STATUS_CONFIG[status as ProjectStatus]?.color ?? '#6b7280',
      capacity: projects
        .filter((p) => p.status === status)
        .reduce((s, p) => s + p.capacity_mw, 0),
    }))
    .sort((a, b) => b.capacity - a.capacity)

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <div className="text-xs text-[var(--color-text-muted)]">
        <Link to="/offtakers" className="hover:text-[var(--color-text)] transition-colors">
          Offtakers
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-[var(--color-text)]">{offtaker.name}</span>
      </div>

      {/* Header */}
      <section>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mb-2">
          {offtaker.name}
        </h1>
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {offtaker.types.map((type: OfftakeType) => {
            const config = OFFTAKE_TYPE_CONFIG[type]
            return (
              <span
                key={type}
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${config.color}20`, color: config.color }}
              >
                {config.label}
              </span>
            )
          })}
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          {offtaker.project_count} projects across {offtaker.states.join(', ')}
        </p>
      </section>

      {/* Stat Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label="Total Capacity"
          value={offtaker.total_capacity_mw >= 1000
            ? `${(offtaker.total_capacity_mw / 1000).toFixed(1)} GW`
            : `${Math.round(offtaker.total_capacity_mw)} MW`}
          color="var(--color-primary)"
        />
        <StatCard
          label="Projects"
          value={offtaker.project_count}
          sublabel={`${Object.keys(offtaker.by_technology).length} technologies`}
        />
        <StatCard
          label="States"
          value={offtaker.states.length}
          sublabel={offtaker.states.join(', ')}
        />
      </section>

      {/* Technology Mix Chart */}
      {techData.length > 1 && (
        <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
            Capacity by Technology
          </h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  label={{
                    value: 'MW',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#6b7280',
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 13,
                  }}
                  formatter={(value) => `${Number(value).toLocaleString()} MW`}
                />
                <Bar dataKey="capacity" radius={[4, 4, 0, 0]}>
                  {techData.map((entry) => (
                    <Cell key={entry.tech} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Status Breakdown */}
      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Pipeline Status
        </h2>
        <div className="space-y-2.5">
          {statusData.map((item) => {
            const barWidth = offtaker.total_capacity_mw > 0
              ? (item.capacity / offtaker.total_capacity_mw) * 100
              : 0
            return (
              <div key={item.status} className="flex items-center gap-3">
                <span className="text-xs w-24 text-right" style={{ color: item.color }}>
                  {item.label}
                </span>
                <div className="flex-1 h-5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: `${item.color}40`,
                      minWidth: item.count > 0 ? '2px' : '0',
                    }}
                  />
                </div>
                <span className="text-xs text-[var(--color-text-muted)] w-28 text-right tabular-nums">
                  {item.count} · {item.capacity >= 1000
                    ? `${(item.capacity / 1000).toFixed(1)} GW`
                    : `${Math.round(item.capacity)} MW`}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Project List */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
          Projects ({projects.length})
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
  sublabel,
}: {
  label: string
  value: string | number
  color?: string
  sublabel?: string
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
        {label}
      </p>
      <p className="text-xl lg:text-2xl font-bold" style={{ color: color || 'var(--color-text)' }}>
        {value}
      </p>
      {sublabel && (
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{sublabel}</p>
      )}
    </div>
  )
}
