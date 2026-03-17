import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts'
import { fetchBESSCapex } from '../lib/dataService'
import type { BESSCapexData, BESSCapexProject } from '../lib/types'

// ============================================================
// Icons — defined BEFORE const arrays per project pattern
// ============================================================

const ChartIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
  </svg>
)

const TableIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
  </svg>
)

// ============================================================
// OEM colour map
// ============================================================

const OEM_COLOURS: Record<string, string> = {
  'Tesla': '#e74c3c',
  'Fluence': '#3498db',
  'Wartsila': '#2ecc71',
  'CATL': '#f39c12',
  'Canadian Solar e-STORAGE': '#9b59b6',
  'Powin': '#1abc9c',
  'Samsung SDI': '#e67e22',
  'Sungrow': '#e84393',
  'Hithium': '#00b894',
  'Doosan GridTech': '#6c5ce7',
  'Unknown': '#636e72',
}

const getOEMColour = (oem: string) => OEM_COLOURS[oem] || '#636e72'

// ============================================================
// View type
// ============================================================

type ViewMode = 'charts' | 'table'
type CostMetric = 'per_mw' | 'per_mwh'

export default function BESSCapex() {
  const [data, setData] = useState<BESSCapexData | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('charts')
  const [metric, setMetric] = useState<CostMetric>('per_mw')
  const [selectedOEMs, setSelectedOEMs] = useState<string[]>([])

  useEffect(() => {
    fetchBESSCapex().then(d => { setData(d); setLoading(false) })
  }, [])

  function toggleOEM(oem: string) {
    setSelectedOEMs(prev => prev.includes(oem) ? prev.filter(v => v !== oem) : [...prev, oem])
  }

  const filteredProjects = useMemo(() => {
    if (!data) return []
    let projects = data.projects
    if (selectedOEMs.length > 0) {
      projects = projects.filter(p => selectedOEMs.includes(p.bess_oem))
    }
    return projects
  }, [data, selectedOEMs])

  const navigate = useNavigate()

  const oems = useMemo(() => {
    if (!data) return []
    const uniqueOEMs = [...new Set(data.projects.map(p => p.bess_oem))].filter(Boolean)
    return uniqueOEMs.sort()
  }, [data])

  // Navigate to filtered project list
  const navigateToProjects = useCallback((ids: string[], title: string) => {
    const params = new URLSearchParams({
      ids: ids.join(','),
      title,
      from: 'analytics/bess-capex',
      fromLabel: 'Back to BESS Capex',
    })
    navigate(`/projects?${params.toString()}`)
  }, [navigate])

  // Scatter data: x = capex_year, y = $/MW or $/MWh
  const scatterData = useMemo(() => {
    return filteredProjects.map(p => ({
      ...p,
      x: p.capex_year,
      y: metric === 'per_mw' ? p.capex_per_mw : p.capex_per_mwh,
      size: Math.max(Math.sqrt(p.capacity_mw) * 2, 8),
      colour: getOEMColour(p.bess_oem),
    })).filter(p => p.y != null && p.y > 0 && p.y < 10) // filter outliers
  }, [filteredProjects, metric])

  // Year trend bar data
  const yearBarData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.by_year).map(([year, v]) => ({
      year,
      avg_per_mw: v.avg_capex_per_mw,
      avg_per_mwh: v.avg_capex_per_mwh,
      count: v.count,
      total_mw: v.total_mw,
    })).sort((a, b) => a.year.localeCompare(b.year))
  }, [data])

  // OEM comparison bar data
  const oemBarData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.by_oem)
      .filter(([, v]) => v.count >= 1)
      .map(([oem, v]) => ({
        oem,
        avg_per_mw: v.avg_capex_per_mw,
        avg_per_mwh: v.avg_capex_per_mwh,
        count: v.count,
        total_mw: v.total_mw,
        colour: getOEMColour(oem),
      }))
      .sort((a, b) => (b.total_mw) - (a.total_mw))
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-center text-[var(--text-secondary)]">No capex data available</div>
  }

  const metricLabel = metric === 'per_mw' ? 'A$/MW (M)' : 'A$/MWh (M)'
  const metricKey = metric === 'per_mw' ? 'avg_per_mw' : 'avg_per_mwh'

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">BESS Capex Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Capital cost trends for{' '}
          <button
            onClick={() => navigateToProjects(data.projects.map(p => p.id), 'BESS with Capex Data')}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {data.projects.length} grid-scale batteries
          </button>
          {' '}in operation, construction & commissioning
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* View toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          <button
            onClick={() => setView('charts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${view === 'charts' ? 'bg-blue-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
          >
            <ChartIcon /> Charts
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
          >
            <TableIcon /> Table
          </button>
        </div>

        {/* Metric toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          <button
            onClick={() => setMetric('per_mw')}
            className={`px-3 py-1.5 text-sm ${metric === 'per_mw' ? 'bg-blue-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
          >
            $/MW
          </button>
          <button
            onClick={() => setMetric('per_mwh')}
            className={`px-3 py-1.5 text-sm ${metric === 'per_mwh' ? 'bg-blue-600 text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'}`}
          >
            $/MWh
          </button>
        </div>

      </div>

      {/* OEM multi-select chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-12">
          OEM
        </span>
        {oems.map(oem => {
          const isActive = selectedOEMs.includes(oem)
          const colour = getOEMColour(oem)
          return (
            <button
              key={oem}
              onClick={() => toggleOEM(oem)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
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
              {oem}
            </button>
          )
        })}
        {selectedOEMs.length > 0 && (
          <button
            onClick={() => setSelectedOEMs([])}
            className="text-xs text-[var(--color-primary)] hover:underline ml-1"
          >
            Clear ×
          </button>
        )}
      </div>

      {view === 'charts' ? (
        <div className="space-y-6">
          {/* Scatter: Cost over time */}
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              Cost per {metric === 'per_mw' ? 'MW' : 'MWh'} Over Time
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Bubble size = project capacity. Colour = OEM. Year = FID/announcement year.
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="x" type="number" name="Year"
                  domain={[2016, 2025]} tickCount={10}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  label={{ value: 'FID / Announcement Year', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <YAxis
                  dataKey="y" type="number" name={metricLabel}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  label={{ value: `${metricLabel}`, angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12 }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const p = payload[0].payload as BESSCapexProject & { y: number }
                    return (
                      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg p-3 shadow-lg text-sm">
                        <div className="font-semibold text-[var(--text-primary)]">{p.name}</div>
                        <div className="text-[var(--text-secondary)]">{p.bess_oem} — {p.bess_model}</div>
                        <div className="text-[var(--text-secondary)]">{p.capacity_mw} MW / {p.storage_mwh} MWh ({p.duration_hours}h)</div>
                        <div className="text-[var(--text-secondary)]">Capex: A${p.capex_aud_m}M</div>
                        <div className="font-medium text-blue-400">${p.capex_per_mw}M/MW &middot; ${p.capex_per_mwh}M/MWh</div>
                        <div className="text-xs text-[var(--text-secondary)]">{p.current_developer} &middot; {p.state} &middot; {p.status}</div>
                      </div>
                    )
                  }}
                />
                <Scatter
                  data={scatterData}
                  onClick={(data: any) => {
                    if (data?.id) navigate(`/projects/${data.id}?from=analytics/bess-capex&fromLabel=Back to BESS Capex`)
                  }}
                  cursor="pointer"
                  shape={
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ((props: any) => {
                      const { cx, cy, payload } = props
                      return (
                        <circle
                          cx={cx} cy={cy}
                          r={payload.size}
                          fill={payload.colour}
                          fillOpacity={0.7}
                          stroke={payload.colour}
                          strokeWidth={1}
                          className="hover:fill-opacity-100 transition-opacity"
                        />
                      )
                    }) as any
                  }
                />
              </ScatterChart>
            </ResponsiveContainer>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {Object.entries(OEM_COLOURS).filter(([oem]) =>
                data.projects.some(p => p.bess_oem === oem)
              ).map(([oem, colour]) => (
                <button
                  key={oem}
                  onClick={() => toggleOEM(oem)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${selectedOEMs.includes(oem) ? 'border-blue-500 bg-blue-500/20' : 'border-[var(--border)]'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colour }} />
                  <span className="text-[var(--text-secondary)]">{oem}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Two column: Year trend + OEM comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Year trend */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Average Cost by Year
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                {metric === 'per_mw' ? 'A$M per MW' : 'A$M per MWh'} — averaged across projects with that FID year
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearBarData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => [`$${Number(value)?.toFixed(2)}M`, metricLabel]}
                    labelFormatter={(label) => {
                      const yr = yearBarData.find(y => y.year === label)
                      return `${label} (${yr?.count} projects, ${yr?.total_mw?.toLocaleString()} MW)`
                    }}
                  />
                  <Bar
                    dataKey={metricKey} fill="#3b82f6" radius={[4, 4, 0, 0]}
                    cursor="pointer"
                    onClick={(data: any) => {
                      if (!data?.year) return
                      const yearProjects = filteredProjects.filter(p => String(p.capex_year) === String(data.year))
                      navigateToProjects(yearProjects.map(p => p.id), `BESS Capex — FID Year ${data.year}`)
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* OEM comparison */}
            <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                Average Cost by OEM
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                {metric === 'per_mw' ? 'A$M per MW' : 'A$M per MWh'} — averaged across each OEM's projects
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={oemBarData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis type="category" dataKey="oem" width={120} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => [`$${Number(value)?.toFixed(2)}M`, metricLabel]}
                    labelFormatter={(label) => {
                      const o = oemBarData.find(x => x.oem === label)
                      return `${label} (${o?.count} projects, ${o?.total_mw?.toLocaleString()} MW)`
                    }}
                  />
                  <Bar
                    dataKey={metricKey} radius={[0, 4, 4, 0]}
                    cursor="pointer"
                    onClick={(data: any) => {
                      if (!data?.oem) return
                      const oemProjects = filteredProjects.filter(p => p.bess_oem === data.oem)
                      navigateToProjects(oemProjects.map(p => p.id), `BESS Capex — ${data.oem}`)
                    }}
                  >
                    {oemBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.colour} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key insights card */}
          <div className="bg-[var(--bg-secondary)] rounded-xl p-4 border border-[var(--border)]">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Key Observations</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[var(--text-secondary)] font-medium mb-1">Cost Trend</div>
                <p className="text-[var(--text-primary)]">
                  $/MWh costs have fallen significantly as storage duration increases — early batteries (2017) were 1-hour systems at
                  &gt;$1M/MWh, while 2024 projects achieve 4-hour duration at ~$0.50M/MWh.
                </p>
              </div>
              <div>
                <div className="text-[var(--text-secondary)] font-medium mb-1">OEM Market</div>
                <p className="text-[var(--text-primary)]">
                  Tesla dominates with {data.by_oem['Tesla']?.count || 0} projects
                  ({data.by_oem['Tesla']?.total_mw?.toLocaleString() || 0} MW).
                  Fluence and Wartsila are key competitors with {data.by_oem['Fluence']?.count || 0} and {data.by_oem['Wartsila']?.count || 0} projects respectively.
                </p>
              </div>
              <div>
                <div className="text-[var(--text-secondary)] font-medium mb-1">Duration Shift</div>
                <p className="text-[var(--text-primary)]">
                  The market has shifted from 1-hour systems (2017-2020) to 2-hour (2021-2023) and now 4-hour systems (2024+),
                  driven by revenue stacking and grid reliability needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Table view */
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left p-3 text-[var(--text-secondary)] font-medium">Project</th>
                <th className="text-left p-3 text-[var(--text-secondary)] font-medium hidden md:table-cell">Developer</th>
                <th className="text-right p-3 text-[var(--text-secondary)] font-medium">MW</th>
                <th className="text-right p-3 text-[var(--text-secondary)] font-medium">MWh</th>
                <th className="text-right p-3 text-[var(--text-secondary)] font-medium hidden sm:table-cell">Hours</th>
                <th className="text-left p-3 text-[var(--text-secondary)] font-medium hidden lg:table-cell">OEM</th>
                <th className="text-right p-3 text-[var(--text-secondary)] font-medium">Capex A$M</th>
                <th className="text-right p-3 text-[var(--text-secondary)] font-medium">$/MW</th>
                <th className="text-right p-3 text-[var(--text-secondary)] font-medium">$/MWh</th>
                <th className="text-center p-3 text-[var(--text-secondary)] font-medium hidden sm:table-cell">Year</th>
                <th className="text-center p-3 text-[var(--text-secondary)] font-medium hidden md:table-cell">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects
                .sort((a, b) => (a.capex_year || 0) - (b.capex_year || 0))
                .map(p => (
                <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-primary)]/50">
                  <td className="p-3">
                    <Link to={`/projects/${p.id}`} className="text-blue-400 hover:text-blue-300">
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3 text-[var(--text-secondary)] hidden md:table-cell">{p.current_developer}</td>
                  <td className="p-3 text-right text-[var(--text-primary)]">{p.capacity_mw}</td>
                  <td className="p-3 text-right text-[var(--text-primary)]">{p.storage_mwh}</td>
                  <td className="p-3 text-right text-[var(--text-secondary)] hidden sm:table-cell">{p.duration_hours}h</td>
                  <td className="p-3 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getOEMColour(p.bess_oem) }} />
                      <span className="text-[var(--text-primary)]">{p.bess_oem}</span>
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-[var(--text-primary)]">${p.capex_aud_m}</td>
                  <td className="p-3 text-right text-[var(--text-primary)]">${p.capex_per_mw?.toFixed(2)}</td>
                  <td className="p-3 text-right text-[var(--text-primary)]">${p.capex_per_mwh?.toFixed(2)}</td>
                  <td className="p-3 text-center text-[var(--text-secondary)] hidden sm:table-cell">{p.capex_year}</td>
                  <td className="p-3 text-center hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      p.status === 'operating' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'construction' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Source note */}
      <div className="text-xs text-[var(--text-secondary)] italic">
        Capex figures sourced from ARENA, developer press releases, CEFC disclosures, and news reporting.
        Some figures are estimates based on partial disclosure (e.g. debt financing only).
        All values in Australian dollars (nominal). Year = FID or announcement year.
      </div>
    </div>
  )
}
