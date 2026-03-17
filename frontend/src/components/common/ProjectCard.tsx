import { Link } from 'react-router-dom'
import type { ProjectSummary } from '../../lib/types'
import TechBadge from './TechBadge'
import StatusBadge from './StatusBadge'
import ConfidenceDots from './ConfidenceDots'

interface ProjectCardProps {
  project: ProjectSummary
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all hover:bg-[var(--color-bg-card)]/80 active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight">
          {project.name}
        </h3>
        <ConfidenceDots confidence={project.data_confidence} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <TechBadge technology={project.technology} />
        <StatusBadge status={project.status} />
        {project.has_eis_data && (
          <span
            title="EIS/EIA technical data available — sourced from planning approval document"
            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/20 tracking-wide"
          >
            EIS
          </span>
        )}
        {project.zombie_flag && (
          <span
            title={project.zombie_flag === 'zombie_stale' ? 'Stale project — first tracked before 2020, no significant progress' : 'Minimal data — low confidence, limited public information'}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20 tracking-wide"
          >
            {project.zombie_flag === 'zombie_stale' ? 'STALE' : 'LOW DATA'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <span>{project.capacity_mw} MW</span>
          {project.storage_mwh && (
            <span>{project.storage_mwh} MWh</span>
          )}
          <span>{project.state}</span>
        </div>
        {project.current_developer && (
          <span className="truncate max-w-[120px]">{project.current_developer}</span>
        )}
      </div>

      {project.rez && (
        <div className="mt-2 text-[10px] text-[var(--color-text-muted)]/70 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
          </svg>
          {project.rez}
        </div>
      )}
    </Link>
  )
}
