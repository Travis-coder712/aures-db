import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useREZList } from '../hooks/useREZData'
import type { State } from '../lib/types'
import type { REZZone } from '../data/rez-zones'

const STATE_TABS: { label: string; value: State | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'NSW', value: 'NSW' },
  { label: 'VIC', value: 'VIC' },
  { label: 'QLD', value: 'QLD' },
  { label: 'SA', value: 'SA' },
  { label: 'TAS', value: 'TAS' },
]

const STATUS_COLORS: Record<REZZone['status'], string> = {
  declared: '#22c55e',
  'in-flight': '#84cc16',
  draft: '#f59e0b',
  candidate: '#8b5cf6',
  planning: '#6b7280',
}

const STATUS_LABELS: Record<REZZone['status'], string> = {
  declared: 'Declared',
  'in-flight': 'In-Flight',
  draft: 'Draft',
  candidate: 'Candidate',
  planning: 'Planning',
}

const STATE_COLORS: Record<string, string> = {
  NSW: '#3b82f6',
  VIC: '#8b5cf6',
  QLD: '#f59e0b',
  SA: '#ef4444',
  TAS: '#14b8a6',
  WA: '#f97316',
}

export default function REZList() {
  const [stateFilter, setStateFilter] = useState<State | 'ALL'>('ALL')
  const { zones, totalCapacity, totalZones } = useREZList(stateFilter)

  return (
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mb-2">
          Renewable Energy Zones
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          {totalZones} REZ zones across 5 states. {totalCapacity.toFixed(1)} GW of declared network capacity.
        </p>
      </section>

      {/* Summary Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {(['NSW', 'VIC', 'QLD', 'SA', 'TAS'] as State[]).map((state) => {
          const count = stateFilter === 'ALL'
            ? zones.filter((z) => z.state === state).length
            : stateFilter === state ? zones.length : 0
          if (stateFilter !== 'ALL' && stateFilter !== state) return null
          return (
            <div
              key={state}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3"
            >
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                {state}
              </p>
              <p className="text-lg font-bold" style={{ color: STATE_COLORS[state] }}>
                {count} zones
              </p>
            </div>
          )
        })}
      </section>

      {/* State Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStateFilter(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              stateFilter === tab.value
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* REZ Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {zones.map((zone) => (
          <REZCard key={zone.id} zone={zone} />
        ))}
      </div>

      {zones.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
          No REZ zones found for this filter.
        </p>
      )}
    </div>
  )
}

function REZCard({ zone }: { zone: REZZone }) {
  return (
    <Link
      to={`/rez/${zone.id}`}
      className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-colors group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{
              color: STATE_COLORS[zone.state],
              backgroundColor: STATE_COLORS[zone.state] + '15',
            }}
          >
            {zone.state}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              color: STATUS_COLORS[zone.status],
              backgroundColor: STATUS_COLORS[zone.status] + '15',
            }}
          >
            {STATUS_LABELS[zone.status]}
          </span>
        </div>
        {zone.target_capacity_gw !== null && (
          <span className="text-sm font-bold text-[var(--color-primary)]">
            {zone.target_capacity_gw} GW
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors mb-1">
        {zone.name}
      </h3>

      <p className="text-xs text-[var(--color-text-muted)] line-clamp-2 mb-2">
        {zone.description}
      </p>

      {zone.transmission_project && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-muted)]">
          <span>🔌</span>
          <span className="truncate">{zone.transmission_project}</span>
          {zone.transmission_status && (
            <span
              className="px-1 py-0.5 rounded flex-shrink-0"
              style={{
                color:
                  zone.transmission_status === 'operating'
                    ? '#22c55e'
                    : zone.transmission_status === 'construction'
                    ? '#f59e0b'
                    : '#6b7280',
                backgroundColor:
                  zone.transmission_status === 'operating'
                    ? '#22c55e15'
                    : zone.transmission_status === 'construction'
                    ? '#f59e0b15'
                    : '#6b728015',
              }}
            >
              {zone.transmission_status}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
