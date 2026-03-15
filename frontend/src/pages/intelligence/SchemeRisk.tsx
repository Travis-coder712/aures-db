import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { fetchSchemeRisk } from '../../lib/dataService'
import type { SchemeRiskData, SchemeRiskProject } from '../../lib/types'
import ScrollableTable from '../../components/common/ScrollableTable'

// ============================================================
// Icons — defined BEFORE const arrays per project pattern
// ============================================================

const ShieldIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 1a1 1 0 01.707.293l5 5A1 1 0 0116 7v5a7 7 0 11-14 0V7a1 1 0 01.293-.707l5-5A1 1 0 0110 1zm-4 6.414V12a4 4 0 108 0V7.414l-4-4-4 4z" clipRule="evenodd" />
  </svg>
)

const SortAscIcon = () => (
  <svg className="w-3 h-3 inline-block ml-0.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
)

const SortDescIcon = () => (
  <svg className="w-3 h-3 inline-block ml-0.5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
)

// ============================================================
// Risk colours
// ============================================================

const RISK_COLOURS: Record<string, string> = {
  red: '#ef4444',
  amber: '#f59e0b',
  green: '#22c55e',
}

const getRiskColour = (level: string) => RISK_COLOURS[level] || '#636e72'

// ============================================================
// Helpers
// ============================================================

/** Safely read drift_months from either field name in the JSON */
function getDrift(p: SchemeRiskProject): number {
  return (p as any).cod_drift_months ?? p.drift_months ?? 0
}

/** Format technology for display */
function formatTech(tech: string): string {
  return tech.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Format status for display */
function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ============================================================
// Sort
// ============================================================

type SortField = 'risk_score' | 'capacity_mw' | 'drift' | 'name'
type SortDir = 'asc' | 'desc'

// ============================================================
// Component
// ============================================================

export default function SchemeRisk() {
  const [data, setData] = useState<SchemeRiskData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>([])
  const [selectedRiskLevels, setSelectedRiskLevels] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('risk_score')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    fetchSchemeRisk().then(d => { setData(d ?? null); setLoading(false) })
  }, [])

  // Unique scheme names
  const schemes = useMemo(() => {
    if (!data) return []
    return Object.keys(data.by_scheme).sort()
  }, [data])

  // Toggle helpers
  function toggleScheme(scheme: string) {
    setSelectedSchemes(prev =>
      prev.includes(scheme) ? prev.filter(s => s !== scheme) : [...prev, scheme]
    )
  }

  function toggleRiskLevel(level: string) {
    setSelectedRiskLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    )
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir(field === 'name' ? 'asc' : 'desc')
    }
  }

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!data) return []
    let projects = data.projects
    if (selectedSchemes.length > 0) {
      projects = projects.filter(p => selectedSchemes.includes(p.scheme))
    }
    if (selectedRiskLevels.length > 0) {
      projects = projects.filter(p => selectedRiskLevels.includes(p.risk_level))
    }
    // Sort
    const sorted = [...projects].sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case 'risk_score': cmp = a.risk_score - b.risk_score; break
        case 'capacity_mw': cmp = a.capacity_mw - b.capacity_mw; break
        case 'drift': cmp = getDrift(a) - getDrift(b); break
        case 'name': cmp = a.name.localeCompare(b.name); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [data, selectedSchemes, selectedRiskLevels, sortField, sortDir])

  // Bar chart data: avg_risk per scheme
  const schemeBarData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.by_scheme)
      .map(([scheme, v]) => ({
        scheme,
        avg_risk: v.avg_risk,
        count: v.count,
        total_mw: v.total_mw,
        risk_level: v.avg_risk >= 50 ? 'red' : v.avg_risk >= 25 ? 'amber' : 'green',
      }))
      .sort((a, b) => b.avg_risk - a.avg_risk)
  }, [data])

  // Key insights
  const insights = useMemo(() => {
    if (!data || schemeBarData.length === 0) return null
    const highest = schemeBarData[0]
    const lowest = schemeBarData[schemeBarData.length - 1]
    const totalMW = Object.values(data.by_scheme).reduce((sum, s) => sum + s.total_mw, 0)
    const driftProjects = data.projects.filter(p => getDrift(p) > 0)
    const avgDrift = driftProjects.length > 0
      ? driftProjects.reduce((sum, p) => sum + getDrift(p), 0) / driftProjects.length
      : 0

    return { highest, lowest, totalMW, driftProjects: driftProjects.length, avgDrift }
  }, [data, schemeBarData])

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

  if (!data || data.projects.length === 0) {
    return (
      <div className="p-6 text-center text-[var(--color-text-muted)]">
        <ShieldIcon />
        <p className="mt-2">No scheme risk data available</p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Scheme Risk Assessment</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Delivery risk tracking across {data.total_projects} projects in government-backed procurement schemes
        </p>
      </div>

      {/* Methodology */}
      <details className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 mb-0">
        <summary className="text-sm font-medium text-[var(--color-text)] cursor-pointer">How is risk calculated?</summary>
        <div className="mt-3 text-xs text-[var(--color-text-muted)] space-y-2">
          <p>Each project receives a <strong className="text-[var(--color-text)]">risk score from 0 to 100</strong> based on four weighted factors: FID (Financial Investment Decision) status, construction progress relative to schedule, COD (Commercial Operation Date) drift in months, and developer track record on prior projects.</p>
          <p><strong className="text-[var(--color-text)]">Traffic light ratings:</strong> <span className="text-green-400 font-semibold">Green (0-20)</span> = low risk, project on track. <span className="text-amber-400 font-semibold">Amber (21-50)</span> = moderate risk, some delays or uncertainty. <span className="text-red-400 font-semibold">Red (51-100)</span> = high risk, significant delays, stalled construction, or no FID.</p>
          <p>This analysis helps identify which government-funded scheme projects (ARENA, NSW LTESA, CIS, etc.) are most at risk of delay or failure, enabling early intervention and portfolio risk management.</p>
        </div>
      </details>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)] text-center">
          <div className="text-3xl md:text-4xl font-bold text-red-500">{data.summary.red}</div>
          <div className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1 font-medium">High Risk</div>
          <div className="w-full h-1 bg-red-500/20 rounded-full mt-2">
            <div
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${data.total_projects > 0 ? (data.summary.red / data.total_projects) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)] text-center">
          <div className="text-3xl md:text-4xl font-bold text-amber-500">{data.summary.amber}</div>
          <div className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1 font-medium">Medium Risk</div>
          <div className="w-full h-1 bg-amber-500/20 rounded-full mt-2">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${data.total_projects > 0 ? (data.summary.amber / data.total_projects) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)] text-center">
          <div className="text-3xl md:text-4xl font-bold text-green-500">{data.summary.green}</div>
          <div className="text-xs md:text-sm text-[var(--color-text-muted)] mt-1 font-medium">Low Risk</div>
          <div className="w-full h-1 bg-green-500/20 rounded-full mt-2">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${data.total_projects > 0 ? (data.summary.green / data.total_projects) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Risk by Scheme bar chart */}
      <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
          Average Risk Score by Scheme
        </h2>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">
          Higher score = greater delivery risk. Bar colour indicates average risk level.
        </p>
        <ResponsiveContainer width="100%" height={Math.max(schemeBarData.length * 50, 200)}>
          <BarChart
            data={schemeBarData}
            layout="vertical"
            margin={{ top: 5, right: 60, bottom: 5, left: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
              label={{ value: 'Risk Score', position: 'insideBottom', offset: -5, fill: 'var(--color-text-muted)', fontSize: 12 }}
            />
            <YAxis
              type="category"
              dataKey="scheme"
              width={120}
              tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
              labelStyle={{ color: 'var(--color-text)' }}
              formatter={(value) => [Number(value).toFixed(1), 'Avg Risk Score']}
              labelFormatter={(label) => {
                const s = schemeBarData.find(x => x.scheme === label)
                return `${label} (${s?.count} projects, ${s?.total_mw?.toLocaleString()} MW)`
              }}
            />
            <Bar dataKey="avg_risk" radius={[0, 4, 4, 0]}>
              {schemeBarData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColour(entry.risk_level)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Filter chips */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Scheme filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-14">
            Scheme
          </span>
          {schemes.map(scheme => {
            const isActive = selectedSchemes.includes(scheme)
            return (
              <button
                key={scheme}
                onClick={() => toggleScheme(scheme)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
              >
                {scheme}
              </button>
            )
          })}
        </div>

        {/* Risk level filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-14">
            Risk
          </span>
          {(['red', 'amber', 'green'] as const).map(level => {
            const isActive = selectedRiskLevels.includes(level)
            const colour = getRiskColour(level)
            return (
              <button
                key={level}
                onClick={() => toggleRiskLevel(level)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                  isActive
                    ? 'border-transparent font-medium'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                }`}
                style={
                  isActive
                    ? { backgroundColor: `${colour}20`, color: colour }
                    : undefined
                }
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: colour }} />
                {level === 'red' ? 'High' : level === 'amber' ? 'Medium' : 'Low'}
              </button>
            )
          })}
        </div>

        {/* Clear filters */}
        {(selectedSchemes.length > 0 || selectedRiskLevels.length > 0) && (
          <button
            onClick={() => { setSelectedSchemes([]); setSelectedRiskLevels([]) }}
            className="text-xs text-blue-400 hover:underline self-center"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Project table */}
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)]">
        <ScrollableTable>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th
                className="text-left p-3 text-[var(--color-text-muted)] font-medium cursor-pointer hover:text-[var(--color-text)]"
                onClick={() => handleSort('name')}
              >
                Project
                {sortField === 'name' && (sortDir === 'asc' ? <SortAscIcon /> : <SortDescIcon />)}
              </th>
              <th className="text-left p-3 text-[var(--color-text-muted)] font-medium hidden md:table-cell">Scheme</th>
              <th className="text-left p-3 text-[var(--color-text-muted)] font-medium hidden lg:table-cell">Technology</th>
              <th className="text-left p-3 text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Status</th>
              <th
                className="text-right p-3 text-[var(--color-text-muted)] font-medium cursor-pointer hover:text-[var(--color-text)]"
                onClick={() => handleSort('capacity_mw')}
              >
                MW
                {sortField === 'capacity_mw' && (sortDir === 'asc' ? <SortAscIcon /> : <SortDescIcon />)}
              </th>
              <th
                className="text-center p-3 text-[var(--color-text-muted)] font-medium cursor-pointer hover:text-[var(--color-text)]"
                onClick={() => handleSort('risk_score')}
              >
                Risk
                {sortField === 'risk_score' && (sortDir === 'asc' ? <SortAscIcon /> : <SortDescIcon />)}
              </th>
              <th className="text-center p-3 text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Level</th>
              <th className="text-center p-3 text-[var(--color-text-muted)] font-medium hidden md:table-cell">COD</th>
              <th
                className="text-right p-3 text-[var(--color-text-muted)] font-medium cursor-pointer hover:text-[var(--color-text)] hidden sm:table-cell"
                onClick={() => handleSort('drift')}
              >
                Drift
                {sortField === 'drift' && (sortDir === 'asc' ? <SortAscIcon /> : <SortDescIcon />)}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(p => {
              const drift = getDrift(p)
              return (
                <tr key={p.project_id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)]/50">
                  <td className="p-3">
                    <Link
                      to={`/projects/${p.technology}/${p.project_id}?from=intelligence/scheme-risk&fromLabel=Back to Scheme Risk`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-[var(--color-text-muted)] md:hidden mt-0.5">{p.scheme}</div>
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)] hidden md:table-cell">{p.scheme}</td>
                  <td className="p-3 text-[var(--color-text-muted)] hidden lg:table-cell">{formatTech(p.technology)}</td>
                  <td className="p-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      p.status === 'operating' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'construction' ? 'bg-blue-500/20 text-blue-400' :
                      p.status === 'commissioning' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {formatStatus(p.status)}
                    </span>
                  </td>
                  <td className="p-3 text-right text-[var(--color-text)]">
                    {p.capacity_mw.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-semibold" style={{ color: getRiskColour(p.risk_level) }}>
                      {p.risk_score}
                    </span>
                  </td>
                  <td className="p-3 text-center hidden sm:table-cell">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                      style={{
                        backgroundColor: `${getRiskColour(p.risk_level)}20`,
                        color: getRiskColour(p.risk_level),
                      }}
                    >
                      {p.risk_level === 'red' ? 'High' : p.risk_level === 'amber' ? 'Medium' : 'Low'}
                    </span>
                  </td>
                  <td className="p-3 text-center text-[var(--color-text-muted)] hidden md:table-cell">
                    {p.cod_current ? new Date(p.cod_current).getFullYear() : '—'}
                  </td>
                  <td className="p-3 text-right hidden sm:table-cell">
                    {drift > 0 ? (
                      <span className="text-amber-400">+{drift}m</span>
                    ) : drift < 0 ? (
                      <span className="text-green-400">{drift}m</span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </ScrollableTable>
        {filteredProjects.length === 0 && (
          <div className="p-6 text-center text-[var(--color-text-muted)]">
            No projects match the selected filters
          </div>
        )}
      </div>

      {/* Key insights */}
      {insights && (
        <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Key Insights</h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[var(--color-text-muted)] font-medium mb-1">Highest Risk Scheme</div>
              <p className="text-[var(--color-text)]">
                <span className="font-semibold" style={{ color: getRiskColour(insights.highest.risk_level) }}>
                  {insights.highest.scheme}
                </span>{' '}
                has the highest average risk score of {insights.highest.avg_risk.toFixed(0)} across{' '}
                {insights.highest.count} projects ({insights.highest.total_mw.toLocaleString()} MW).
              </p>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] font-medium mb-1">Lowest Risk Scheme</div>
              <p className="text-[var(--color-text)]">
                <span className="font-semibold" style={{ color: getRiskColour(insights.lowest.risk_level) }}>
                  {insights.lowest.scheme}
                </span>{' '}
                has the lowest average risk score of {insights.lowest.avg_risk.toFixed(0)} across{' '}
                {insights.lowest.count} projects ({insights.lowest.total_mw.toLocaleString()} MW).
              </p>
            </div>
            <div>
              <div className="text-[var(--color-text-muted)] font-medium mb-1">COD Drift</div>
              <p className="text-[var(--color-text)]">
                {insights.driftProjects > 0 ? (
                  <>
                    {insights.driftProjects} of {data.total_projects} projects have experienced COD drift,
                    averaging {insights.avgDrift.toFixed(1)} months delay. Total portfolio capacity
                    is {insights.totalMW.toLocaleString()} MW.
                  </>
                ) : (
                  <>
                    No projects have experienced COD drift. Total portfolio capacity
                    is {insights.totalMW.toLocaleString()} MW across {data.total_projects} scheme-backed projects.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Source note */}
      <div className="text-xs text-[var(--color-text-muted)] italic">
        Risk scores are calculated from COD drift, FID status, construction progress, and planning approvals.
        Data sourced from ARENA, NSW LTESA, CIS disclosures, and developer announcements.
      </div>
    </div>
  )
}
