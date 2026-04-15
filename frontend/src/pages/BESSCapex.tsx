import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, ReferenceLine,
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

  // ── Timeline trend: individual projects over time with trend line ──
  const timelineData = useMemo(() => {
    if (!data) return []
    return data.projects
      .filter(p => p.capex_per_mwh != null && p.capex_per_mwh > 0 && p.capex_per_mwh < 5)
      .sort((a, b) => (a.capex_year || 0) - (b.capex_year || 0))
      .map(p => ({
        ...p,
        year: p.capex_year,
        per_mwh: p.capex_per_mwh,
        per_mw: p.capex_per_mw,
        label: p.name.replace(/ BESS| Battery| Energy Storage System| Grid Battery project| Battery project/g, ''),
        isTomago: p.id === 'tomago-bess',
      }))
  }, [data])

  // ── OEM cost evolution: per-OEM trend lines ──
  const oemTimelineData = useMemo(() => {
    if (!data) return { chartData: [], oems: [] as string[] }
    const oemProjects: Record<string, { year: number; per_mwh: number; name: string }[]> = {}
    for (const p of data.projects) {
      if (!p.bess_oem || !p.capex_per_mwh || p.capex_per_mwh >= 5) continue
      if (!oemProjects[p.bess_oem]) oemProjects[p.bess_oem] = []
      oemProjects[p.bess_oem].push({ year: p.capex_year, per_mwh: p.capex_per_mwh, name: p.name })
    }
    // Only include OEMs with 2+ projects
    const multiOems = Object.keys(oemProjects).filter(o => oemProjects[o].length >= 2).sort()
    // Build chart data: one point per year per OEM
    const allYears = [...new Set(data.projects.map(p => p.capex_year).filter(Boolean))].sort()
    const chartData = allYears.map(year => {
      const row: Record<string, number | string | null> = { year }
      for (const oem of multiOems) {
        const pts = oemProjects[oem].filter(p => p.year === year)
        row[oem] = pts.length > 0 ? Math.round(pts.reduce((s, p) => s + p.per_mwh, 0) / pts.length * 100) / 100 : null
      }
      return row
    })
    return { chartData, oems: multiOems }
  }, [data])

  // ── Tomago comparable projects ──
  const tomagoComparables = useMemo(() => {
    if (!data) return null
    const tomago = data.projects.find(p => p.id === 'tomago-bess')
    if (!tomago) return null
    // Find comparable: 4hr duration OR >= 400 MW OR same OEM (Fluence)
    const comparables = data.projects
      .filter(p => p.id !== 'tomago-bess' && p.capex_per_mwh && p.capex_per_mwh > 0 && p.capex_per_mwh < 5)
      .map(p => {
        const perMwh = p.capex_per_mwh!
        const tomagoPerMwh = tomago.capex_per_mwh!
        const premiumPct = ((perMwh - tomagoPerMwh) / tomagoPerMwh) * 100
        const normMwh = 2000 // 500MW * 4hr
        const normPremiumAbs = (perMwh - tomagoPerMwh) * normMwh
        // Comparability score: higher = more comparable
        let score = 0
        if (p.duration_hours && p.duration_hours >= 3.5) score += 3 // same duration class
        if (p.capacity_mw >= 300) score += 2 // similar scale
        if (p.bess_oem === 'Fluence') score += 1 // same OEM
        if (p.capex_year && p.capex_year >= 2023) score += 1 // recent
        return {
          ...p,
          premiumPct: Math.round(premiumPct * 10) / 10,
          normPremiumAbsM: Math.round(normPremiumAbs),
          comparabilityScore: score,
          label: p.name.replace(/ BESS| Battery| Energy Storage System/g, ''),
        }
      })
      .filter(p => p.comparabilityScore >= 2) // at least somewhat comparable
      .sort((a, b) => b.comparabilityScore - a.comparabilityScore || b.premiumPct - a.premiumPct)

    return { tomago, comparables }
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-center text-[var(--color-text-muted)]">No capex data available</div>
  }

  const metricLabel = metric === 'per_mw' ? 'A$/MW (M)' : 'A$/MWh (M)'
  const metricKey = metric === 'per_mw' ? 'avg_per_mw' : 'avg_per_mwh'

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">BESS Capex Analytics</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
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
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
          <button
            onClick={() => setView('charts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${view === 'charts' ? 'bg-blue-600 text-white' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)]'}`}
          >
            <ChartIcon /> Charts
          </button>
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm ${view === 'table' ? 'bg-blue-600 text-white' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)]'}`}
          >
            <TableIcon /> Table
          </button>
        </div>

        {/* Metric toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)]">
          <button
            onClick={() => setMetric('per_mw')}
            className={`px-3 py-1.5 text-sm ${metric === 'per_mw' ? 'bg-blue-600 text-white' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)]'}`}
          >
            $/MW
          </button>
          <button
            onClick={() => setMetric('per_mwh')}
            className={`px-3 py-1.5 text-sm ${metric === 'per_mwh' ? 'bg-blue-600 text-white' : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)]'}`}
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
          <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
              Cost per {metric === 'per_mw' ? 'MW' : 'MWh'} Over Time
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Bubble size = project capacity. Colour = OEM. Year = FID/announcement year.
            </p>
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="x" type="number" name="Year"
                  domain={[2016, 2026]} tickCount={11}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  label={{ value: 'FID / Announcement Year', position: 'insideBottom', offset: -10, fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <YAxis
                  dataKey="y" type="number" name={metricLabel}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                  label={{ value: `${metricLabel}`, angle: -90, position: 'insideLeft', fill: 'var(--color-text-muted)', fontSize: 12 }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const p = payload[0].payload as BESSCapexProject & { y: number }
                    return (
                      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg text-sm">
                        <div className="font-semibold text-[var(--color-text)]">{p.name}</div>
                        <div className="text-[var(--color-text-muted)]">{p.bess_oem} — {p.bess_model}</div>
                        <div className="text-[var(--color-text-muted)]">{p.capacity_mw} MW / {p.storage_mwh} MWh ({p.duration_hours}h)</div>
                        <div className="text-[var(--color-text-muted)]">Capex: A${p.capex_aud_m}M</div>
                        <div className="font-medium text-blue-400">${p.capex_per_mw}M/MW &middot; ${p.capex_per_mwh}M/MWh</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{p.current_developer} &middot; {p.state} &middot; {p.status}</div>
                        {p.capex_source && <div className="text-xs text-[var(--color-text-muted)] italic mt-1">Source: {p.capex_source}</div>}
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
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${selectedOEMs.includes(oem) ? 'border-blue-500 bg-blue-500/20' : 'border-[var(--color-border)]'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colour }} />
                  <span className="text-[var(--color-text-muted)]">{oem}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Two column: Year trend + OEM comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Year trend */}
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                Average Cost by Year
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                {metric === 'per_mw' ? 'A$M per MW' : 'A$M per MWh'} — averaged across projects with that FID year
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearBarData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="year" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--color-text)' }}
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
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                Average Cost by OEM
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                {metric === 'per_mw' ? 'A$M per MW' : 'A$M per MWh'} — averaged across each OEM's projects
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={oemBarData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} />
                  <YAxis type="category" dataKey="oem" width={120} tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--color-text)' }}
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

          {/* ═══════════════════════════════════════════ */}
          {/* (1) Cost Timeline — $/MWh declining over time */}
          {/* ═══════════════════════════════════════════ */}
          <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
              BESS Cost Timeline — $/MWh Declining Over Time
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Each bar represents one project, ordered by FID/announcement year. The green dashed line shows the year average.
              Tomago BESS (2025) sets a new NEM low at $0.40M/MWh.
            </p>
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={timelineData} margin={{ top: 10, right: 10, bottom: 80, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 9 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                  label={{ value: 'A$M / MWh', angle: -90, position: 'insideLeft', fill: 'var(--color-text-muted)', fontSize: 11 }}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const p = payload[0].payload
                    return (
                      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg text-sm">
                        <div className="font-semibold text-[var(--color-text)]">{p.name}</div>
                        <div className="text-[var(--color-text-muted)]">{p.bess_oem} — {p.capacity_mw} MW / {p.storage_mwh} MWh ({p.duration_hours}h)</div>
                        <div className="font-medium text-blue-400">${p.per_mwh?.toFixed(2)}M/MWh &middot; ${p.per_mw?.toFixed(2)}M/MW</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{p.current_developer} &middot; {p.state} &middot; FID {p.year}</div>
                      </div>
                    )
                  }}
                />
                <Bar
                  dataKey="per_mwh"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                  cursor="pointer"
                  onClick={(d: any) => { if (d?.id) navigate(`/projects/${d.id}?from=analytics/bess-capex&fromLabel=Back to BESS Capex`) }}
                >
                  {timelineData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isTomago ? '#10b981' : getOEMColour(entry.bess_oem)}
                      fillOpacity={entry.isTomago ? 1 : 0.7}
                      stroke={entry.isTomago ? '#10b981' : undefined}
                      strokeWidth={entry.isTomago ? 2 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Year average trend annotation */}
            <div className="flex flex-wrap gap-3 mt-2 justify-center text-xs">
              {Object.entries(data.by_year).sort(([a], [b]) => a.localeCompare(b)).map(([year, v]) => (
                <div key={year} className="flex items-center gap-1">
                  <span className="text-[var(--color-text-muted)]">{year}:</span>
                  <span className="font-mono text-[var(--color-text)]">${v.avg_capex_per_mwh?.toFixed(2)}M/MWh</span>
                  <span className="text-[var(--color-text-muted)]">({v.count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════ */}
          {/* (2) OEM Cost Evolution — per-OEM trend lines */}
          {/* ═══════════════════════════════════════════ */}
          {oemTimelineData.oems.length > 0 && (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                OEM Cost Evolution — $/MWh by Supplier Over Time
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                How each OEM's average project cost has changed across announcement years. Only OEMs with 2+ projects shown.
                Fluence's latest (Tomago, 2025) represents a 62% drop from their 2017 entry (Ballarat).
              </p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={oemTimelineData.chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="year" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                    label={{ value: 'A$M / MWh', angle: -90, position: 'insideLeft', fill: 'var(--color-text-muted)', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                    labelStyle={{ color: 'var(--color-text)' }}
                    formatter={(value, name) => [value != null ? `$${Number(value).toFixed(2)}M/MWh` : '—', name]}
                  />
                  {oemTimelineData.oems.map(oem => (
                    <Line
                      key={oem}
                      type="monotone"
                      dataKey={oem}
                      stroke={getOEMColour(oem)}
                      strokeWidth={2}
                      dot={{ fill: getOEMColour(oem), r: 5 }}
                      connectNulls
                      activeDot={{ r: 7, strokeWidth: 2 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {oemTimelineData.oems.map(oem => (
                  <div key={oem} className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-1 rounded" style={{ backgroundColor: getOEMColour(oem) }} />
                    <span className="text-[var(--color-text-muted)]">{oem}</span>
                  </div>
                ))}
              </div>

              {/* OEM reduction summary table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left p-2 text-[var(--color-text-muted)]">OEM</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">Projects</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">Total MW</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">First $/MWh</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">Latest $/MWh</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">Reduction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oemTimelineData.oems.map(oem => {
                      const pts = data.projects
                        .filter(p => p.bess_oem === oem && p.capex_per_mwh && p.capex_per_mwh < 5)
                        .sort((a, b) => (a.capex_year || 0) - (b.capex_year || 0))
                      const first = pts[0]
                      const latest = pts[pts.length - 1]
                      const reduction = first && latest && first.capex_per_mwh && latest.capex_per_mwh
                        ? Math.round((1 - latest.capex_per_mwh / first.capex_per_mwh) * 100)
                        : null
                      return (
                        <tr key={oem} className="border-b border-[var(--color-border)]">
                          <td className="p-2">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getOEMColour(oem) }} />
                              <span className="text-[var(--color-text)] font-medium">{oem}</span>
                            </span>
                          </td>
                          <td className="p-2 text-right text-[var(--color-text)]">{pts.length}</td>
                          <td className="p-2 text-right text-[var(--color-text)]">{pts.reduce((s, p) => s + p.capacity_mw, 0).toLocaleString()}</td>
                          <td className="p-2 text-right text-[var(--color-text-muted)] font-mono">
                            ${first?.capex_per_mwh?.toFixed(2)}M <span className="text-[10px]">({first?.capex_year})</span>
                          </td>
                          <td className="p-2 text-right text-[var(--color-text)] font-mono">
                            ${latest?.capex_per_mwh?.toFixed(2)}M <span className="text-[10px]">({latest?.capex_year})</span>
                          </td>
                          <td className="p-2 text-right font-mono font-medium" style={{ color: reduction && reduction > 0 ? '#10b981' : '#ef4444' }}>
                            {reduction != null ? `${reduction > 0 ? '↓' : '↑'} ${Math.abs(reduction)}%` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════ */}
          {/* (3) Tomago Benchmark — comparable project analysis */}
          {/* ═══════════════════════════════════════════ */}
          {tomagoComparables && (
            <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-1">
                Tomago Benchmark — How It Compares
              </h2>
              <p className="text-xs text-[var(--color-text-muted)] mb-2">
                Tomago BESS (AGL/Fluence, 500 MW / 2,000 MWh, $800M) at <span className="font-bold text-[#10b981]">$0.40M/MWh</span> is
                the lowest-cost utility BESS publicly announced in the NEM. Below are the most comparable projects
                (similar scale, duration, or recency) showing how much more expensive each project is vs Tomago,
                normalised to 500 MW / 4hr (2,000 MWh).
              </p>

              {/* Tomago highlight card */}
              <div className="rounded-lg p-3 mb-4 flex items-center gap-4" style={{ background: '#10b98115', border: '1px solid #10b98140' }}>
                <div className="text-center flex-shrink-0">
                  <div className="text-2xl font-bold font-mono" style={{ color: '#10b981' }}>$0.40M</div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">per MWh</div>
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  <span className="font-semibold text-[var(--color-text)]">Tomago BESS</span> — AGL Energy &middot; Fluence Gridstack Pro &middot;
                  500 MW / 2,000 MWh (4hr) &middot; NSW &middot; FID Jul 2025 &middot; COD H2 2027 &middot; $800M total capex
                </div>
              </div>

              {/* Comparison bar chart */}
              <ResponsiveContainer width="100%" height={Math.max(250, tomagoComparables.comparables.length * 36 + 50)}>
                <BarChart
                  data={tomagoComparables.comparables}
                  layout="vertical"
                  margin={{ top: 5, right: 60, bottom: 5, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                    tickFormatter={(v: number) => `$${v.toFixed(2)}M`}
                    domain={[0, 'auto']}
                    label={{ value: 'A$M per MWh', position: 'insideBottom', offset: -5, fill: 'var(--color-text-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={160}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.length) return null
                      const p = payload[0].payload
                      return (
                        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 shadow-lg text-sm">
                          <div className="font-semibold text-[var(--color-text)]">{p.name}</div>
                          <div className="text-[var(--color-text-muted)]">{p.bess_oem} &middot; {p.capacity_mw} MW / {p.storage_mwh} MWh ({p.duration_hours}h)</div>
                          <div className="text-blue-400 font-mono">${p.capex_per_mwh?.toFixed(2)}M/MWh</div>
                          <div className="mt-1 font-medium" style={{ color: p.premiumPct > 0 ? '#f59e0b' : '#10b981' }}>
                            {p.premiumPct > 0
                              ? `${p.premiumPct.toFixed(1)}% more expensive than Tomago (+$${p.normPremiumAbsM}M on 500MW/4hr basis)`
                              : `${Math.abs(p.premiumPct).toFixed(1)}% cheaper than Tomago`}
                          </div>
                        </div>
                      )
                    }}
                  />
                  <ReferenceLine x={0.40} stroke="#10b981" strokeDasharray="4 4" strokeWidth={2} label={{ value: 'Tomago $0.40M', fill: '#10b981', fontSize: 10, position: 'top' }} />
                  <Bar dataKey="capex_per_mwh" radius={[0, 4, 4, 0]} maxBarSize={24}>
                    {tomagoComparables.comparables.map((entry, i) => (
                      <Cell key={i} fill={getOEMColour(entry.bess_oem)} fillOpacity={0.7} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Detailed comparison table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left p-2 text-[var(--color-text-muted)]">Project</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">MW</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">MWh</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">Hr</th>
                      <th className="text-left p-2 text-[var(--color-text-muted)]">OEM</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">$/MWh</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">Year</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">vs Tomago</th>
                      <th className="text-right p-2 text-[var(--color-text-muted)]">Extra Cost (norm.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Tomago row */}
                    <tr style={{ background: '#10b98115' }} className="border-b border-[var(--color-border)]">
                      <td className="p-2 font-semibold" style={{ color: '#10b981' }}>
                        <Link to="/projects/tomago-bess?from=analytics/bess-capex&fromLabel=Back to BESS Capex" className="hover:underline">
                          Tomago BESS ★
                        </Link>
                      </td>
                      <td className="p-2 text-right font-mono" style={{ color: '#10b981' }}>500</td>
                      <td className="p-2 text-right font-mono" style={{ color: '#10b981' }}>2,000</td>
                      <td className="p-2 text-right font-mono" style={{ color: '#10b981' }}>4.0</td>
                      <td className="p-2" style={{ color: '#10b981' }}>Fluence</td>
                      <td className="p-2 text-right font-mono font-bold" style={{ color: '#10b981' }}>$0.40M</td>
                      <td className="p-2 text-right" style={{ color: '#10b981' }}>2025</td>
                      <td className="p-2 text-right font-mono" style={{ color: '#10b981' }}>— baseline —</td>
                      <td className="p-2 text-right" style={{ color: '#10b981' }}>—</td>
                    </tr>
                    {tomagoComparables.comparables.map((p, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)]">
                        <td className="p-2">
                          <Link to={`/projects/${p.id}?from=analytics/bess-capex&fromLabel=Back to BESS Capex`} className="text-blue-400 hover:text-blue-300">
                            {p.label}
                          </Link>
                          <span className="ml-1 text-[10px] text-[var(--color-text-muted)]">{p.state}</span>
                        </td>
                        <td className="p-2 text-right font-mono text-[var(--color-text)]">{p.capacity_mw}</td>
                        <td className="p-2 text-right font-mono text-[var(--color-text)]">{p.storage_mwh?.toLocaleString()}</td>
                        <td className="p-2 text-right font-mono text-[var(--color-text)]">{p.duration_hours}</td>
                        <td className="p-2">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getOEMColour(p.bess_oem) }} />
                            <span className="text-[var(--color-text)]">{p.bess_oem}</span>
                          </span>
                        </td>
                        <td className="p-2 text-right font-mono text-[var(--color-text)]">${p.capex_per_mwh?.toFixed(2)}M</td>
                        <td className="p-2 text-right text-[var(--color-text-muted)]">{p.capex_year}</td>
                        <td className="p-2 text-right font-mono font-medium" style={{ color: p.premiumPct > 0 ? '#f59e0b' : '#10b981' }}>
                          {p.premiumPct > 0 ? `+${p.premiumPct}%` : `${p.premiumPct}%`}
                        </td>
                        <td className="p-2 text-right font-mono" style={{ color: p.normPremiumAbsM > 0 ? '#f59e0b' : '#10b981' }}>
                          {p.normPremiumAbsM > 0 ? `+$${p.normPremiumAbsM}M` : `-$${Math.abs(p.normPremiumAbsM)}M`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic">
                Extra cost = difference in $/MWh × 2,000 MWh (500 MW / 4hr reference basis).
                Comparability based on: duration ≥3.5hr, capacity ≥300 MW, same OEM, or recent FID (2023+).
              </p>
            </div>
          )}

          {/* Key insights card */}
          <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)]">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-3">Key Observations</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[var(--color-text-muted)] font-medium mb-1">Cost Trend</div>
                <p className="text-[var(--color-text)]">
                  $/MWh costs have fallen significantly as storage duration increases — early batteries (2017) were 1-hour systems at
                  &gt;$1M/MWh, while 2024 projects achieve 4-hour duration at ~$0.50M/MWh.
                </p>
              </div>
              <div>
                <div className="text-[var(--color-text-muted)] font-medium mb-1">OEM Market</div>
                <p className="text-[var(--color-text)]">
                  Tesla dominates with {data.by_oem['Tesla']?.count || 0} projects
                  ({data.by_oem['Tesla']?.total_mw?.toLocaleString() || 0} MW).
                  Fluence and Wartsila are key competitors with {data.by_oem['Fluence']?.count || 0} and {data.by_oem['Wartsila']?.count || 0} projects respectively.
                </p>
              </div>
              <div>
                <div className="text-[var(--color-text-muted)] font-medium mb-1">Duration Shift</div>
                <p className="text-[var(--color-text)]">
                  The market has shifted from 1-hour systems (2017-2020) to 2-hour (2021-2023) and now 4-hour systems (2024+),
                  driven by revenue stacking and grid reliability needs.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Table view */
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Project</th>
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium hidden md:table-cell">Developer</th>
                <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">MW</th>
                <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">MWh</th>
                <th className="text-right p-3 text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Hours</th>
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium hidden lg:table-cell">OEM</th>
                <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">Capex A$M</th>
                <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">$/MW</th>
                <th className="text-right p-3 text-[var(--color-text-muted)] font-medium">$/MWh</th>
                <th className="text-center p-3 text-[var(--color-text-muted)] font-medium hidden sm:table-cell">Year</th>
                <th className="text-center p-3 text-[var(--color-text-muted)] font-medium hidden md:table-cell">Status</th>
                <th className="text-center p-3 text-[var(--color-text-muted)] font-medium hidden lg:table-cell">Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects
                .sort((a, b) => (a.capex_year || 0) - (b.capex_year || 0))
                .map(p => (
                <tr key={p.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)]/50">
                  <td className="p-3">
                    <Link to={`/projects/${p.id}`} className="text-blue-400 hover:text-blue-300">
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3 text-[var(--color-text-muted)] hidden md:table-cell">{p.current_developer}</td>
                  <td className="p-3 text-right text-[var(--color-text)]">{p.capacity_mw}</td>
                  <td className="p-3 text-right text-[var(--color-text)]">{p.storage_mwh}</td>
                  <td className="p-3 text-right text-[var(--color-text-muted)] hidden sm:table-cell">{p.duration_hours}h</td>
                  <td className="p-3 hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getOEMColour(p.bess_oem) }} />
                      <span className="text-[var(--color-text)]">{p.bess_oem}</span>
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-[var(--color-text)]">${p.capex_aud_m}</td>
                  <td className="p-3 text-right text-[var(--color-text)]">${p.capex_per_mw?.toFixed(2)}</td>
                  <td className="p-3 text-right text-[var(--color-text)]">${p.capex_per_mwh?.toFixed(2)}</td>
                  <td className="p-3 text-center text-[var(--color-text-muted)] hidden sm:table-cell">{p.capex_year}</td>
                  <td className="p-3 text-center hidden md:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      p.status === 'operating' ? 'bg-green-500/20 text-green-400' :
                      p.status === 'construction' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-center hidden lg:table-cell">
                    {p.capex_source_url ? (
                      <a href={p.capex_source_url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xs underline">
                        {p.capex_source?.length > 30 ? p.capex_source.substring(0, 30) + '…' : p.capex_source}
                      </a>
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">{p.capex_source}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Source note */}
      <div className="text-xs text-[var(--color-text-muted)] italic">
        Capex figures sourced from ARENA, developer press releases, CEFC disclosures, and news reporting.
        Some figures are estimates based on partial disclosure (e.g. debt financing only).
        All values in Australian dollars (nominal). Year = FID or announcement year.
      </div>
    </div>
  )
}
