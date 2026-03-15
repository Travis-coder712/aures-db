import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { fetchGridConnection } from '../../lib/dataService'
import type { GridConnectionData, REZSummary } from '../../lib/types'

// ============================================================
// Icons — defined BEFORE const arrays per project pattern
// ============================================================

const GridIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1z" />
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const ChevronUpIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
)

// ============================================================
// Colours
// ============================================================

const CONGESTION_COLOURS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
}

const TECH_COLOURS: Record<string, string> = {
  wind: '#3b82f6',
  solar: '#f59e0b',
  bess: '#10b981',
  pumped_hydro: '#8b5cf6',
  hybrid: '#ec4899',
}

const STATUS_COLOURS: Record<string, string> = {
  Connected: '#10b981',
  'In progress': '#3b82f6',
  'Pre-application': '#f59e0b',
}

// ============================================================
// Helpers
// ============================================================

/** Convert kebab-case REZ ID to display name, stripping state prefix */
function formatREZName(rez: string): string {
  // Strip state prefix (e.g. "nsw-" or "qld-")
  const withoutState = rez.replace(/^[a-z]{2,3}-/, '')
  return withoutState
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Format technology key for display */
function formatTech(tech: string): string {
  return tech.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Collect all unique technologies across all REZ summaries */
function getAllTechnologies(summaries: REZSummary[]): string[] {
  const techs = new Set<string>()
  for (const rez of summaries) {
    for (const tech of Object.keys(rez.technologies)) {
      techs.add(tech)
    }
  }
  return Array.from(techs).sort()
}

// ============================================================
// Component
// ============================================================

export default function GridConnection() {
  const [data, setData] = useState<GridConnectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedREZ, setExpandedREZ] = useState<string | null>(null)

  useEffect(() => {
    fetchGridConnection().then(d => { setData(d ?? null); setLoading(false) })
  }, [])

  // Total pipeline MW across all REZs
  const totalPipelineMW = useMemo(() => {
    if (!data) return 0
    return data.rez_summaries.reduce((sum, r) => sum + r.pipeline_mw, 0)
  }, [data])

  // Total operating MW
  const totalOperatingMW = useMemo(() => {
    if (!data) return 0
    return data.rez_summaries.reduce((sum, r) => sum + r.operating_mw, 0)
  }, [data])

  // Connection status pie data
  const connectionPieData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.connection_status_overall).map(([status, info]) => ({
      name: status,
      value: info.mw,
      count: info.count,
      fill: STATUS_COLOURS[status] || '#636e72',
    }))
  }, [data])

  // REZ congestion bar data (sorted by total_mw descending)
  const congestionBarData = useMemo(() => {
    if (!data) return []
    return [...data.rez_summaries]
      .sort((a, b) => b.total_mw - a.total_mw)
      .map(r => ({
        name: formatREZName(r.rez),
        rez: r.rez,
        total_mw: r.total_mw,
        operating_mw: r.operating_mw,
        pipeline_mw: r.pipeline_mw,
        congestion_level: r.congestion_level,
        congestion_score: r.congestion_score,
      }))
  }, [data])

  // Technology stacked bar data per REZ
  const techStackData = useMemo(() => {
    if (!data) return { chartData: [] as Record<string, unknown>[], techs: [] as string[] }
    const techs = getAllTechnologies(data.rez_summaries)
    const chartData = [...data.rez_summaries]
      .sort((a, b) => b.total_mw - a.total_mw)
      .map(r => {
        const row: Record<string, unknown> = { name: formatREZName(r.rez) }
        for (const tech of techs) {
          const statuses = r.technologies[tech]
          if (statuses) {
            row[tech] = Object.values(statuses).reduce((sum, s) => sum + s.mw, 0)
          } else {
            row[tech] = 0
          }
        }
        return row
      })
    return { chartData, techs }
  }, [data])

  // ============================================================
  // Render
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!data || data.rez_summaries.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--text-secondary)]">
        <GridIcon />
        <p className="mt-2">No grid connection data available</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Grid Connection Analysis</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          REZ pipeline congestion and connection status across {data.total_rez_zones} Renewable Energy Zones
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)] text-center">
          <div className="text-3xl md:text-4xl font-bold text-blue-400">{data.total_rez_zones}</div>
          <div className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 font-medium">REZ Zones</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)] text-center">
          <div className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
            {(totalOperatingMW + totalPipelineMW).toLocaleString()}
          </div>
          <div className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 font-medium">Total MW</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)] text-center">
          <div className="text-3xl md:text-4xl font-bold text-green-400">{totalOperatingMW.toLocaleString()}</div>
          <div className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 font-medium">Operating MW</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)] text-center">
          <div className="text-3xl md:text-4xl font-bold text-amber-400">{totalPipelineMW.toLocaleString()}</div>
          <div className="text-xs md:text-sm text-[var(--text-secondary)] mt-1 font-medium">Pipeline MW</div>
        </div>
      </div>

      {/* Connection status + REZ congestion row */}
      <div className="grid md:grid-cols-5 gap-4">
        {/* Connection Status PieChart */}
        <div className="md:col-span-2 bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Connection Status</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Overall MW by connection stage
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={connectionPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                paddingAngle={2}
                strokeWidth={0}
              >
                {connectionPieData.map((entry, i) => (
                  <Cell key={`pie-${i}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(value) => [`${Number(value).toLocaleString()} MW`, 'Capacity']}
              />
              <Legend
                formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Status counts below */}
          <div className="flex justify-center gap-4 mt-2">
            {connectionPieData.map(s => (
              <div key={s.name} className="text-center">
                <div className="text-sm font-semibold" style={{ color: s.fill }}>
                  {s.count} projects
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{s.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* REZ Congestion horizontal bar */}
        <div className="md:col-span-3 bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">REZ Congestion</h2>
          <p className="text-xs text-[var(--text-secondary)] mb-3">
            Total capacity by REZ zone. Colour indicates congestion level.
          </p>
          <ResponsiveContainer width="100%" height={Math.max(congestionBarData.length * 70, 200)}>
            <BarChart
              data={congestionBarData}
              layout="vertical"
              margin={{ top: 5, right: 60, bottom: 5, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                labelStyle={{ color: 'var(--text-primary)' }}
                formatter={(value, name) => {
                  const label = name === 'operating_mw' ? 'Operating' : 'Pipeline'
                  return [`${Number(value).toLocaleString()} MW`, label]
                }}
              />
              <Bar dataKey="operating_mw" stackId="cap" name="operating_mw" radius={[0, 0, 0, 0]}>
                {congestionBarData.map((entry, i) => (
                  <Cell key={`op-${i}`} fill={CONGESTION_COLOURS[entry.congestion_level] || '#636e72'} fillOpacity={0.9} />
                ))}
              </Bar>
              <Bar dataKey="pipeline_mw" stackId="cap" name="pipeline_mw" radius={[0, 4, 4, 0]}>
                {congestionBarData.map((entry, i) => (
                  <Cell key={`pip-${i}`} fill={CONGESTION_COLOURS[entry.congestion_level] || '#636e72'} fillOpacity={0.4} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: '#636e72', opacity: 0.9 }} /> Operating
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: '#636e72', opacity: 0.4 }} /> Pipeline
            </span>
            {Object.entries(CONGESTION_COLOURS).map(([level, colour]) => (
              <span key={level} className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: colour }} /> {level.charAt(0).toUpperCase() + level.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Technology Breakdown per REZ — Stacked bar */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Technology Breakdown by REZ</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Capacity (MW) by technology within each Renewable Energy Zone
        </p>
        <ResponsiveContainer width="100%" height={Math.max(techStackData.chartData.length * 70, 200)}>
          <BarChart
            data={techStackData.chartData}
            layout="vertical"
            margin={{ top: 5, right: 60, bottom: 5, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
              labelStyle={{ color: 'var(--text-primary)' }}
              formatter={(value, name) => [`${Number(value).toLocaleString()} MW`, formatTech(String(name))]}
            />
            {techStackData.techs.map(tech => (
              <Bar
                key={tech}
                dataKey={tech}
                stackId="tech"
                name={tech}
                fill={TECH_COLOURS[tech] || '#636e72'}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 justify-center mt-3 text-xs text-[var(--text-secondary)]">
          {techStackData.techs.map(tech => (
            <span key={tech} className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: TECH_COLOURS[tech] || '#636e72' }} />
              {formatTech(tech)}
            </span>
          ))}
        </div>
      </div>

      {/* REZ Detail Cards (expandable) */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">REZ Zone Details</h2>
        <div className="space-y-3">
          {[...data.rez_summaries]
            .sort((a, b) => b.total_mw - a.total_mw)
            .map(rez => {
              const isExpanded = expandedREZ === rez.rez
              const congestionColour = CONGESTION_COLOURS[rez.congestion_level] || '#636e72'
              return (
                <div key={rez.rez} className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-hidden">
                  {/* Card header — always visible */}
                  <button
                    onClick={() => setExpandedREZ(isExpanded ? null : rez.rez)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--bg-primary)]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize shrink-0"
                        style={{ backgroundColor: `${congestionColour}20`, color: congestionColour }}
                      >
                        {rez.congestion_level}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] truncate">
                          {formatREZName(rez.rez)}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {rez.project_count} projects &middot; {rez.total_mw.toLocaleString()} MW total
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-sm text-green-400">{rez.operating_mw.toLocaleString()} MW operating</div>
                        <div className="text-sm text-amber-400">{rez.pipeline_mw.toLocaleString()} MW pipeline</div>
                      </div>
                      <span className="text-[var(--text-secondary)]">
                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      </span>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-[var(--border)] p-4 space-y-4">
                      {/* Congestion score bar */}
                      <div>
                        <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-1">
                          <span>Congestion Score</span>
                          <span className="font-semibold" style={{ color: congestionColour }}>
                            {rez.congestion_score.toFixed(1)} / 10
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(rez.congestion_score * 10, 100)}%`,
                              backgroundColor: congestionColour,
                            }}
                          />
                        </div>
                      </div>

                      {/* Technology breakdown table */}
                      <div>
                        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">Technology Breakdown</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-[var(--border)]">
                                <th className="text-left py-2 pr-4 text-[var(--text-secondary)] font-medium">Technology</th>
                                <th className="text-left py-2 pr-4 text-[var(--text-secondary)] font-medium">Status</th>
                                <th className="text-right py-2 pr-4 text-[var(--text-secondary)] font-medium">Projects</th>
                                <th className="text-right py-2 text-[var(--text-secondary)] font-medium">MW</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(rez.technologies).map(([tech, statuses]) =>
                                Object.entries(statuses).map(([status, info]) => (
                                  <tr key={`${tech}-${status}`} className="border-b border-[var(--border)]/50">
                                    <td className="py-1.5 pr-4">
                                      <span className="flex items-center gap-1.5">
                                        <span
                                          className="inline-block w-2.5 h-2.5 rounded"
                                          style={{ backgroundColor: TECH_COLOURS[tech] || '#636e72' }}
                                        />
                                        <span className="text-[var(--text-primary)]">{formatTech(tech)}</span>
                                      </span>
                                    </td>
                                    <td className="py-1.5 pr-4 text-[var(--text-secondary)] capitalize">{status}</td>
                                    <td className="py-1.5 pr-4 text-right text-[var(--text-primary)]">{info.count}</td>
                                    <td className="py-1.5 text-right text-[var(--text-primary)]">{info.mw.toLocaleString()}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      </div>

      {/* REZ Comparison Table */}
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-x-auto">
        <div className="p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">REZ Comparison</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left p-3 text-[var(--text-secondary)] font-medium">REZ Zone</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium">Total MW</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium hidden sm:table-cell">Operating MW</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium hidden sm:table-cell">Pipeline MW</th>
              <th className="text-center p-3 text-[var(--text-secondary)] font-medium">Congestion</th>
              <th className="text-center p-3 text-[var(--text-secondary)] font-medium hidden md:table-cell">Score</th>
              <th className="text-right p-3 text-[var(--text-secondary)] font-medium">Projects</th>
            </tr>
          </thead>
          <tbody>
            {[...data.rez_summaries]
              .sort((a, b) => b.total_mw - a.total_mw)
              .map(rez => {
                const congestionColour = CONGESTION_COLOURS[rez.congestion_level] || '#636e72'
                return (
                  <tr key={rez.rez} className="border-b border-[var(--border)] hover:bg-[var(--bg-primary)]/50">
                    <td className="p-3 text-[var(--text-primary)] font-medium">{formatREZName(rez.rez)}</td>
                    <td className="p-3 text-right text-[var(--text-primary)]">{rez.total_mw.toLocaleString()}</td>
                    <td className="p-3 text-right text-green-400 hidden sm:table-cell">{rez.operating_mw.toLocaleString()}</td>
                    <td className="p-3 text-right text-amber-400 hidden sm:table-cell">{rez.pipeline_mw.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                        style={{ backgroundColor: `${congestionColour}20`, color: congestionColour }}
                      >
                        {rez.congestion_level}
                      </span>
                    </td>
                    <td className="p-3 text-center hidden md:table-cell">
                      <span className="font-semibold" style={{ color: congestionColour }}>
                        {rez.congestion_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-3 text-right text-[var(--text-primary)]">{rez.project_count}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      {/* Source note */}
      <div className="text-xs text-[var(--text-secondary)] italic">
        Grid connection data sourced from AEMO connection registers, REZ access scheme disclosures, and developer announcements.
        Congestion scores reflect pipeline-to-capacity ratios and known curtailment patterns.
      </div>
    </div>
  )
}
