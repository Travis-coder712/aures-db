/**
 * WattClarity — Battery Correlation Penalty Analysis
 * ====================================================
 * Inspired by WattClarity's April 2026 article "Is a Battery Correlation Penalty Looming?"
 * Uses AURES data to independently replicate and extend the analysis.
 *
 * Charts:
 * 1. Comparative fleet growth: BESS vs Wind vs Solar cumulative capacity over time
 * 2. Arbitrage spread compression: median spread declining as fleet grows
 * 3. Revenue per MW vs fleet size: scatter showing dilution
 * 4. Government scheme underwriting: what proportion of the fleet is publicly backed
 * 5. Fleet performance quartile dispersion: widening gap between top and bottom performers
 */

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell,
} from 'recharts'
import {
  fetchBatteryWatch, fetchWindWatch, fetchSolarWatch,
  fetchRevenueIntel, fetchSchemeTracker, fetchLeagueTable,
} from '../../lib/dataService'
import type {
  BatteryWatchData, CapacityWatchData, RevenueIntelData,
  SchemeTrackerData, LeagueTable,
} from '../../lib/types'

// ============================================================
// Constants
// ============================================================

const TECH_COLOURS: Record<string, string> = {
  bess: '#10b981',
  solar: '#f59e0b',
  wind: '#3b82f6',
}

const SCHEME_COLOURS: Record<string, string> = {
  CIS: '#f59e0b',
  LTESA: '#3b82f6',
  VRET: '#8b5cf6',
  Uncontracted: '#475569',
}

type SectionId = 'thesis' | 'growth' | 'spreads' | 'revenue' | 'schemes' | 'outlook'

const SectionNavIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
)

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'thesis', label: 'The Thesis' },
  { id: 'growth', label: 'Fleet Growth' },
  { id: 'spreads', label: 'Spread Compression' },
  { id: 'revenue', label: 'Revenue Dilution' },
  { id: 'schemes', label: 'Public Risk' },
  { id: 'outlook', label: 'Outlook' },
]

// ============================================================
// Helpers
// ============================================================

function formatGW(mw: number): string {
  if (mw >= 1000) return `${(mw / 1000).toFixed(1)} GW`
  return `${Math.round(mw)} MW`
}

function formatDollars(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${Math.round(n)}`
}

// ============================================================
// Chart Wrapper
// ============================================================

function ChartWrapper({ title, subtitle, children, source }: {
  title: string; subtitle?: string; children: React.ReactNode; source?: string
}) {
  return (
    <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
      <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>{title}</h3>
      {subtitle && <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>{subtitle}</p>}
      {children}
      {source && (
        <p className="text-xs mt-2 text-right" style={{ color: '#64748b' }}>Source: {source}</p>
      )}
    </div>
  )
}

// ============================================================
// Stat Card
// ============================================================

function StatCard({ label, value, detail, colour }: {
  label: string; value: string; detail?: string; colour?: string
}) {
  return (
    <div className="rounded-lg p-3" style={{ background: '#1e293b', border: '1px solid #334155' }}>
      <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{label}</div>
      <div className="text-xl font-bold" style={{ color: colour || '#f1f5f9' }}>{value}</div>
      {detail && <div className="text-xs mt-0.5" style={{ color: '#64748b' }}>{detail}</div>}
    </div>
  )
}

// ============================================================
// Custom Tooltips
// ============================================================

function GrowthTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg p-3 text-xs shadow-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
      <div className="font-semibold mb-1" style={{ color: '#f1f5f9' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span style={{ color: '#cbd5e1' }}>{p.dataKey === 'bess' ? 'Battery' : p.dataKey === 'wind' ? 'Wind' : 'Solar'}:</span>
          <span className="font-mono" style={{ color: p.color }}>{formatGW(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function SpreadTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { year: number; median_spread: number; fleet_count: number; fleet_mw: number; p25: number; p75: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg p-3 text-xs shadow-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
      <div className="font-semibold mb-1" style={{ color: '#f1f5f9' }}>{d.year}</div>
      <div style={{ color: '#10b981' }}>Median spread: <span className="font-mono">${d.median_spread?.toFixed(0)}/MWh</span></div>
      <div style={{ color: '#94a3b8' }}>P25–P75: <span className="font-mono">${d.p25?.toFixed(0)}–${d.p75?.toFixed(0)}</span></div>
      <div style={{ color: '#94a3b8' }}>Fleet: <span className="font-mono">{d.fleet_count} projects</span></div>
      <div style={{ color: '#94a3b8' }}>Capacity: <span className="font-mono">{formatGW(d.fleet_mw)}</span></div>
    </div>
  )
}

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { year: number; mean_rev: number; median_rev: number; fleet_count: number; p25_rev: number; p75_rev: number } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg p-3 text-xs shadow-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
      <div className="font-semibold mb-1" style={{ color: '#f1f5f9' }}>{d.year}</div>
      <div style={{ color: '#10b981' }}>Median revenue: <span className="font-mono">{formatDollars(d.median_rev)}/MW</span></div>
      <div style={{ color: '#f59e0b' }}>Mean revenue: <span className="font-mono">{formatDollars(d.mean_rev)}/MW</span></div>
      <div style={{ color: '#94a3b8' }}>P25–P75: <span className="font-mono">{formatDollars(d.p25_rev)}–{formatDollars(d.p75_rev)}</span></div>
      <div style={{ color: '#94a3b8' }}>Fleet size: <span className="font-mono">{d.fleet_count} projects</span></div>
    </div>
  )
}

function ProjectSpreadTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; spread: number; capacity_mw: number; state: string } }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg p-3 text-xs shadow-xl" style={{ background: '#0f172a', border: '1px solid #334155' }}>
      <div className="font-semibold mb-1" style={{ color: '#f1f5f9' }}>{d.name}</div>
      <div style={{ color: '#10b981' }}>Spread: <span className="font-mono">${d.spread?.toFixed(0)}/MWh</span></div>
      <div style={{ color: '#94a3b8' }}>Capacity: <span className="font-mono">{d.capacity_mw} MW</span></div>
      <div style={{ color: '#94a3b8' }}>State: {d.state}</div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function WattClarity() {
  const [batteryData, setBatteryData] = useState<BatteryWatchData | null>(null)
  const [windData, setWindData] = useState<CapacityWatchData | null>(null)
  const [solarData, setSolarData] = useState<CapacityWatchData | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueIntelData | null>(null)
  const [schemeData, setSchemeData] = useState<SchemeTrackerData | null>(null)
  const [bessLeague, setBessLeague] = useState<LeagueTable | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('thesis')

  useEffect(() => {
    Promise.all([
      fetchBatteryWatch(),
      fetchWindWatch(),
      fetchSolarWatch(),
      fetchRevenueIntel(),
      fetchSchemeTracker(),
      fetchLeagueTable('bess', 2025),
    ]).then(([batt, wind, solar, rev, scheme, league]) => {
      setBatteryData(batt)
      setWindData(wind)
      setSolarData(solar)
      setRevenueData(rev)
      setSchemeData(scheme)
      setBessLeague(league)
      setLoading(false)
    })
  }, [])

  // ============================================================
  // Derived: Comparative fleet growth data
  // ============================================================

  const growthData = useMemo(() => {
    if (!batteryData || !windData || !solarData) return []

    // Build cumulative timeline for each tech starting from first project
    // We want to show how fast each tech reached various capacity milestones
    const bessProjected = batteryData.nem_wide.projected_capacity_mw || []

    // Build BESS timeline from projected points
    const bessTimeline: { date: string; mw: number }[] = bessProjected.map(p => ({
      date: p.date, mw: p.mw,
    }))

    // Build wind/solar milestones
    const windMilestones = windData.timeline_milestones || []
    const solarMilestones = solarData.timeline_milestones || []

    // Collect all dates and interpolate
    const allDates = new Set<string>()
    bessTimeline.forEach(p => allDates.add(p.date.substring(0, 7))) // YYYY-MM
    windMilestones.forEach(m => allDates.add(m.date.substring(0, 7)))
    solarMilestones.forEach(m => allDates.add(m.date.substring(0, 7)))

    const sorted = [...allDates].sort()

    // Helper: find latest value at or before date
    const findAtDate = (timeline: { date: string; mw: number }[], targetMonth: string) => {
      let last = 0
      for (const pt of timeline) {
        if (pt.date.substring(0, 7) <= targetMonth) last = pt.mw
        else break
      }
      return last
    }

    const windTL = windMilestones.map(m => ({ date: m.date, mw: m.cumulative_mw }))
    const solarTL = solarMilestones.map(m => ({ date: m.date, mw: m.cumulative_mw }))

    return sorted.map(month => ({
      date: month,
      label: new Date(month + '-01').toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
      bess: findAtDate(bessTimeline, month),
      wind: findAtDate(windTL, month),
      solar: findAtDate(solarTL, month),
    })).filter(d => d.bess > 0 || d.wind > 0 || d.solar > 0)
  }, [batteryData, windData, solarData])

  // ============================================================
  // Derived: "Years since reaching X GW" comparison
  // ============================================================

  const rateComparisonData = useMemo(() => {
    if (!batteryData || !windData || !solarData) return []

    const bessProjected = batteryData.nem_wide.projected_capacity_mw || []
    const windMilestones = windData.timeline_milestones || []
    const solarMilestones = solarData.timeline_milestones || []

    // Find when each tech first passed 1GW, 2GW, 3GW, etc.
    const findDateForThreshold = (points: { date: string; mw: number }[], thresholdMW: number): string | null => {
      for (const p of points) {
        if (p.mw >= thresholdMW) return p.date
      }
      return null
    }

    const bessPoints = bessProjected.map(p => ({ date: p.date, mw: p.mw }))
    const windPoints = windMilestones.map(m => ({ date: m.date, mw: m.cumulative_mw }))
    const solarPoints = solarMilestones.map(m => ({ date: m.date, mw: m.cumulative_mw }))

    // Years from first GW to each subsequent milestone
    const bessBase = findDateForThreshold(bessPoints, 1000)
    const windBase = findDateForThreshold(windPoints, 1000)
    const solarBase = findDateForThreshold(solarPoints, 1000)

    if (!bessBase || !windBase || !solarBase) return []

    const yearsSince = (base: string, target: string | null) => {
      if (!target) return null
      const d1 = new Date(base)
      const d2 = new Date(target)
      return Math.round((d2.getTime() - d1.getTime()) / (365.25 * 24 * 60 * 60 * 1000) * 10) / 10
    }

    const thresholds = [1, 2, 3, 5, 7, 10, 12]
    return thresholds.map(gw => ({
      threshold: `${gw} GW`,
      bess: yearsSince(bessBase, findDateForThreshold(bessPoints, gw * 1000)),
      wind: yearsSince(windBase, findDateForThreshold(windPoints, gw * 1000)),
      solar: yearsSince(solarBase, findDateForThreshold(solarPoints, gw * 1000)),
    })).filter(d => d.bess !== null || d.wind !== null || d.solar !== null)
  }, [batteryData, windData, solarData])

  // ============================================================
  // Derived: Spread compression data
  // ============================================================

  const spreadData = useMemo(() => {
    if (!revenueData) return []
    return revenueData.by_technology_year
      .filter(d => d.technology === 'bess' && d.bess_spread)
      .map(d => ({
        year: d.year,
        median_spread: d.bess_spread!.median,
        mean_spread: d.bess_spread!.mean,
        p25: d.bess_spread!.p25,
        p75: d.bess_spread!.p75,
        fleet_count: d.bess_spread!.count,
        fleet_mw: 0, // Will be enriched
        discharge_price: d.discharge_price?.median || 0,
        charge_price: d.charge_price?.median || 0,
      }))
      .sort((a, b) => a.year - b.year)
  }, [revenueData])

  // ============================================================
  // Derived: Revenue per MW over time
  // ============================================================

  const revenueOverTime = useMemo(() => {
    if (!revenueData) return []
    return revenueData.by_technology_year
      .filter(d => d.technology === 'bess' && d.revenue_per_mw)
      .map(d => ({
        year: d.year,
        mean_rev: d.revenue_per_mw.mean,
        median_rev: d.revenue_per_mw.median,
        p25_rev: d.revenue_per_mw.p25,
        p75_rev: d.revenue_per_mw.p75,
        fleet_count: d.revenue_per_mw.count,
      }))
      .sort((a, b) => a.year - b.year)
  }, [revenueData])

  // ============================================================
  // Derived: Individual project spread data (2025)
  // ============================================================

  const projectSpreads = useMemo(() => {
    if (!bessLeague) return []
    return bessLeague.projects
      .filter(p => p.avg_discharge_price && p.avg_charge_price)
      .map(p => ({
        name: p.name.replace(/ BESS| Battery| Energy Storage System/g, ''),
        fullName: p.name,
        id: p.project_id,
        spread: (p.avg_discharge_price || 0) - (p.avg_charge_price || 0),
        discharge: p.avg_discharge_price || 0,
        charge: p.avg_charge_price || 0,
        capacity_mw: p.capacity_mw,
        revenue_per_mw: p.revenue_per_mw,
        state: p.state,
      }))
      .sort((a, b) => b.spread - a.spread)
  }, [bessLeague])

  // ============================================================
  // Derived: Scheme underwriting data
  // ============================================================

  const schemeBreakdown = useMemo(() => {
    if (!schemeData || !batteryData) return null

    let cisMW = 0
    let ltesaMW = 0
    const cisProjects: { name: string; id?: string; capacity_mw: number; state: string; scheme: string; round: string; status: string }[] = []
    const ltesaProjects: typeof cisProjects = []

    for (const round of schemeData.rounds) {
      for (const proj of round.projects) {
        if (proj.technology !== 'bess') continue
        const entry = {
          name: proj.name,
          id: proj.project_id || undefined,
          capacity_mw: proj.capacity_mw,
          state: proj.state,
          scheme: round.scheme,
          round: round.round,
          status: proj.status || proj.stage || 'unknown',
        }
        if (round.scheme === 'CIS') {
          cisMW += proj.capacity_mw
          cisProjects.push(entry)
        } else if (round.scheme === 'LTESA') {
          ltesaMW += proj.capacity_mw
          ltesaProjects.push(entry)
        }
      }
    }

    // Total fleet = operating + construction
    const totalFleetMW = (batteryData.nem_wide.operating.total_mw || 0) +
      (batteryData.nem_wide.construction.total_mw || 0)
    const uncontractedMW = Math.max(0, totalFleetMW - cisMW - ltesaMW)

    return {
      total: totalFleetMW,
      cis: cisMW,
      ltesa: ltesaMW,
      uncontracted: uncontractedMW,
      cisPct: Math.round(cisMW / totalFleetMW * 100),
      ltesaPct: Math.round(ltesaMW / totalFleetMW * 100),
      uncontractedPct: Math.round(uncontractedMW / totalFleetMW * 100),
      cisProjects,
      ltesaProjects,
      allSchemeProjects: [...cisProjects, ...ltesaProjects].sort((a, b) => b.capacity_mw - a.capacity_mw),
    }
  }, [schemeData, batteryData])

  // ============================================================
  // Derived: Fleet dispersion (Q1 vs Q4 performers)
  // ============================================================

  const fleetDispersion = useMemo(() => {
    if (!bessLeague) return null
    const projs = bessLeague.projects
    const q1 = projs.filter(p => p.quartile === 1)
    const q4 = projs.filter(p => p.quartile === 4)
    const q1AvgRev = q1.reduce((s, p) => s + (p.revenue_per_mw || 0), 0) / (q1.length || 1)
    const q4AvgRev = q4.reduce((s, p) => s + (p.revenue_per_mw || 0), 0) / (q4.length || 1)
    return {
      q1Count: q1.length,
      q4Count: q4.length,
      q1AvgRevenue: q1AvgRev,
      q4AvgRevenue: q4AvgRev,
      ratio: Math.round(q1AvgRev / (q4AvgRev || 1) * 10) / 10,
      totalProjects: projs.length,
      fleetAvgRevenue: bessLeague.fleet_avg.revenue_per_mw || 0,
    }
  }, [bessLeague])

  // ============================================================
  // Loading state
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2" style={{ borderColor: '#10b981' }} />
      </div>
    )
  }

  const totalOperating = batteryData?.nem_wide.operating.total_mw || 0
  const totalConstruction = batteryData?.nem_wide.construction.total_mw || 0
  const totalPipeline = totalOperating + totalConstruction

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#10b981' + '20' }}>
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold" style={{ color: '#f1f5f9' }}>
              Is a Battery Correlation Penalty Looming?
            </h2>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>
              An independent analysis using AURES data, inspired by{' '}
              <a
                href="https://wattclarity.com.au/articles/2026/04/is-a-battery-correlation-penalty-looming/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: '#10b981' }}
              >
                WattClarity's April 2026 article
              </a>
              . As more batteries deploy with similar durations and cycling patterns, correlated
              dispatch risks compressing the arbitrage spreads that underpin battery economics.
            </p>
          </div>
        </div>
      </div>

      {/* Section nav */}
      <div className="flex gap-1.5 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
            style={{
              background: activeSection === s.id ? '#10b981' + '20' : '#0f172a',
              color: activeSection === s.id ? '#10b981' : '#94a3b8',
              border: `1px solid ${activeSection === s.id ? '#10b981' + '40' : '#334155'}`,
            }}
          >
            {activeSection === s.id && <SectionNavIcon />}
            {s.label}
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SECTION: The Thesis */}
      {/* ============================================================ */}
      {activeSection === 'thesis' && (
        <div className="space-y-4">
          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Operating Fleet"
              value={formatGW(totalOperating)}
              detail={`${batteryData?.nem_wide.operating.by_state ? Object.values(batteryData.nem_wide.operating.by_state).reduce((s, v) => s + v.projects, 0) : 0} projects across NEM`}
              colour="#10b981"
            />
            <StatCard
              label="Under Construction"
              value={formatGW(totalConstruction)}
              detail="Expected within 24–36 months"
              colour="#3b82f6"
            />
            <StatCard
              label="Combined Pipeline"
              value={formatGW(totalPipeline)}
              detail="Operating + construction"
              colour="#f59e0b"
            />
            <StatCard
              label="2025 Fleet Spread"
              value={`$${spreadData.find(d => d.year === 2025)?.median_spread?.toFixed(0) || '—'}/MWh`}
              detail={`Median arbitrage (${spreadData.find(d => d.year === 2025)?.fleet_count || 0} projects)`}
              colour="#10b981"
            />
          </div>

          {/* The argument */}
          <div className="rounded-lg p-4 space-y-3" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>The Solar Parallel</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
              The "solar correlation penalty" — a term coined by WattClarity in 2018 — described how adding
              more solar capacity in the NEM eroded the very price differentials that early solar farms depended
              on. Every solar farm sits within a narrow band of longitude, producing at the same time. As more
              panels came online, midday prices collapsed from ~$40/MWh (2015) to ~$0/MWh (2025) in Queensland.
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
              A similar dynamic may now be emerging for batteries. The majority of NEM batteries share 1–2 hour
              durations and cycle on a diurnal basis — charging during low-price solar hours and discharging
              during the evening peak. As more storage connects, these correlated dispatch patterns compress the
              very price spreads they depend on.
            </p>

            <div className="rounded-lg p-3 mt-3" style={{ background: '#0f172a', border: '1px solid #334155' }}>
              <h4 className="text-xs font-semibold mb-2" style={{ color: '#f59e0b' }}>Key Evidence from AURES Data</h4>
              <ul className="space-y-1.5">
                {[
                  `Battery fleet has grown from ${spreadData.find(d => d.year === 2018)?.fleet_count || 3} projects in 2018 to ${spreadData.find(d => d.year === 2025)?.fleet_count || 28} in 2025 — with ${formatGW(totalConstruction)} more under construction`,
                  `2024 median spread was $${spreadData.find(d => d.year === 2024)?.median_spread?.toFixed(0) || '240'}/MWh vs $${spreadData.find(d => d.year === 2025)?.median_spread?.toFixed(0) || '188'}/MWh in 2025 — a ${Math.round(((spreadData.find(d => d.year === 2024)?.median_spread || 240) - (spreadData.find(d => d.year === 2025)?.median_spread || 188)) / (spreadData.find(d => d.year === 2024)?.median_spread || 240) * 100)}% decline as fleet nearly doubled`,
                  fleetDispersion ? `Top-quartile batteries earn ${fleetDispersion.ratio}x more revenue per MW than bottom quartile — a widening gap` : '',
                  schemeBreakdown ? `~${schemeBreakdown.cisPct + schemeBreakdown.ltesaPct}% of operating+construction battery capacity holds CIS or LTESA contracts — transferring long-term revenue risk onto public balance sheets` : '',
                  `Battery deployment is outpacing wind and solar at comparable fleet sizes`,
                ].filter(Boolean).map((item, i) => (
                  <li key={i} className="flex gap-2 text-xs" style={{ color: '#94a3b8' }}>
                    <span style={{ color: '#f59e0b' }}>•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Displacement context */}
          {batteryData?.displacement_context && (
            <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#f1f5f9' }}>Market Context</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs p-2 rounded" style={{ background: '#0f172a' }}>
                  <div style={{ color: '#64748b' }}>Evening Peak Share</div>
                  <div className="font-mono font-bold" style={{ color: '#10b981' }}>
                    {batteryData.displacement_context.battery_share_evening_peak_pct}%
                  </div>
                  <div style={{ color: '#64748b' }}>of NEM evening demand</div>
                </div>
                <div className="text-xs p-2 rounded" style={{ background: '#0f172a' }}>
                  <div style={{ color: '#64748b' }}>SA Evening Peak</div>
                  <div className="font-mono font-bold" style={{ color: '#f59e0b' }}>
                    {batteryData.displacement_context.battery_share_evening_peak_sa_pct}%
                  </div>
                  <div style={{ color: '#64748b' }}>world record share</div>
                </div>
                <div className="text-xs p-2 rounded" style={{ background: '#0f172a' }}>
                  <div style={{ color: '#64748b' }}>Negative Price Intervals</div>
                  <div className="font-mono font-bold" style={{ color: '#ef4444' }}>
                    {batteryData.displacement_context.negative_price_intervals_pct}%
                  </div>
                  <div style={{ color: '#64748b' }}>of Q2 2025 dispatches</div>
                </div>
                <div className="text-xs p-2 rounded" style={{ background: '#0f172a' }}>
                  <div style={{ color: '#64748b' }}>2025 Curtailment</div>
                  <div className="font-mono font-bold" style={{ color: '#ef4444' }}>
                    {batteryData.displacement_context.total_curtailment_2025_twh} TWh
                  </div>
                  <div style={{ color: '#64748b' }}>solar + wind</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION: Fleet Growth Comparison */}
      {/* ============================================================ */}
      {activeSection === 'growth' && (
        <div className="space-y-4">
          {/* Rate comparison table */}
          {rateComparisonData.length > 0 && (
            <ChartWrapper
              title="Time to Reach Capacity Milestones"
              subtitle="Years from first reaching 1 GW to each subsequent threshold. Batteries are ramping faster than wind or solar ever did at comparable sizes."
              source="AURES project timeline data"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <th className="text-left py-2 pr-3" style={{ color: '#94a3b8' }}>Milestone</th>
                      <th className="text-right py-2 px-2" style={{ color: TECH_COLOURS.bess }}>Battery</th>
                      <th className="text-right py-2 px-2" style={{ color: TECH_COLOURS.wind }}>Wind</th>
                      <th className="text-right py-2 px-2" style={{ color: TECH_COLOURS.solar }}>Solar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateComparisonData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td className="py-1.5 pr-3 font-mono" style={{ color: '#f1f5f9' }}>{row.threshold}</td>
                        <td className="py-1.5 px-2 text-right font-mono" style={{ color: TECH_COLOURS.bess }}>
                          {row.bess !== null ? `${row.bess} yr` : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono" style={{ color: TECH_COLOURS.wind }}>
                          {row.wind !== null ? `${row.wind} yr` : '—'}
                        </td>
                        <td className="py-1.5 px-2 text-right font-mono" style={{ color: TECH_COLOURS.solar }}>
                          {row.solar !== null ? `${row.solar} yr` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartWrapper>
          )}

          {/* Combined timeline chart */}
          {growthData.length > 0 && (
            <ChartWrapper
              title="NEM Fleet Capacity Growth"
              subtitle="Cumulative capacity for battery, wind and solar fleets. Battery growth trajectory shown from available projected data points."
              source="AURES capacity watch data, AEMO registrations"
            >
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={growthData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="bessGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="windGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    interval="preserveStartEnd"
                    angle={-30}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v: number) => formatGW(v)}
                  />
                  <Tooltip content={<GrowthTooltip />} />
                  <Area type="monotone" dataKey="wind" stroke="#3b82f6" fill="url(#windGrad)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="solar" stroke="#f59e0b" fill="url(#solarGrad)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="bess" stroke="#10b981" fill="url(#bessGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {Object.entries(TECH_COLOURS).map(([k, c]) => (
                  <div key={k} className="flex items-center gap-1.5 text-xs">
                    <span className="w-3 h-1 rounded" style={{ background: c }} />
                    <span style={{ color: '#94a3b8' }}>{k === 'bess' ? 'Battery' : k.charAt(0).toUpperCase() + k.slice(1)}</span>
                  </div>
                ))}
              </div>
            </ChartWrapper>
          )}

          {/* BESS projected buildout */}
          {batteryData?.nem_wide.projected_capacity_mw && (
            <ChartWrapper
              title="Battery Fleet Projected Buildout"
              subtitle="NEM-wide utility-scale battery capacity trajectory with ~7 GW more under construction or at financial close."
              source="AURES battery watch, AEMO registration data"
            >
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={batteryData.nem_wide.projected_capacity_mw.map(p => ({
                    label: p.label,
                    mw: p.mw,
                    date: p.date,
                  }))}
                  margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
                >
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v: number) => formatGW(v)}
                  />
                  <Tooltip
                    formatter={(value) => [formatGW(value as number), 'Capacity']}
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Area type="stepAfter" dataKey="mw" stroke="#10b981" fill="url(#projGrad)" strokeWidth={2} />
                  {/* Today reference line */}
                  <ReferenceLine
                    x={batteryData.nem_wide.projected_capacity_mw.find(p => new Date(p.date) >= new Date())?.label || ''}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                    label={{ value: 'TODAY', position: 'top', fill: '#f1f5f9', fontSize: 10 }}
                  />
                </AreaChart>
              </ResponsiveContainer>

              {/* State breakdown */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {batteryData.nem_wide.operating.by_state && Object.entries(batteryData.nem_wide.operating.by_state)
                  .filter(([, v]) => v.mw > 0)
                  .sort(([, a], [, b]) => b.mw - a.mw)
                  .map(([state, data]) => {
                    const constr = batteryData.nem_wide.construction.by_state?.[state]
                    return (
                      <div key={state} className="text-xs p-2 rounded" style={{ background: '#0f172a' }}>
                        <span className="font-semibold" style={{ color: '#f1f5f9' }}>{state}</span>
                        <span className="ml-2 font-mono" style={{ color: '#10b981' }}>{formatGW(data.mw)}</span>
                        <span className="ml-1" style={{ color: '#64748b' }}>operating</span>
                        {constr && constr.mw > 0 && (
                          <>
                            <span className="ml-1" style={{ color: '#64748b' }}>+</span>
                            <span className="ml-1 font-mono" style={{ color: '#3b82f6' }}>{formatGW(constr.mw)}</span>
                            <span className="ml-1" style={{ color: '#64748b' }}>building</span>
                          </>
                        )}
                      </div>
                    )
                  })}
              </div>
            </ChartWrapper>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION: Spread Compression */}
      {/* ============================================================ */}
      {activeSection === 'spreads' && (
        <div className="space-y-4">
          {/* Year-over-year spread chart */}
          <ChartWrapper
            title="Battery Arbitrage Spread Over Time"
            subtitle="Median discharge-minus-charge price spread ($/MWh) with P25–P75 range. A declining trend as fleet size grows would signal correlation penalty onset."
            source="AURES revenue intelligence, OpenElectricity dispatch data"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={spreadData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip content={<SpreadTooltip />} />
                <Bar dataKey="median_spread" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {spreadData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.year === 2025 || entry.year === 2026 ? '#10b981' : '#10b981' + '80'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Fleet count annotation */}
            <div className="flex justify-between mt-2 px-2">
              {spreadData.map(d => (
                <div key={d.year} className="text-center">
                  <div className="text-[10px] font-mono" style={{ color: '#64748b' }}>{d.fleet_count}</div>
                  <div className="text-[9px]" style={{ color: '#475569' }}>projects</div>
                </div>
              ))}
            </div>
          </ChartWrapper>

          {/* Discharge vs charge price */}
          <ChartWrapper
            title="Charge & Discharge Prices Over Time"
            subtitle="Median prices at which the battery fleet charges and discharges. The gap between these lines is the arbitrage spread."
            source="AURES revenue intelligence"
          >
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={spreadData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(v: number) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
                  formatter={(value, name) => [
                    `$${(value as number).toFixed(0)}/MWh`,
                    name === 'discharge_price' ? 'Discharge' : 'Charge',
                  ]}
                />
                <Line type="monotone" dataKey="discharge_price" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} name="discharge_price" />
                <Line type="monotone" dataKey="charge_price" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} name="charge_price" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-1 rounded" style={{ background: '#ef4444' }} />
                <span style={{ color: '#94a3b8' }}>Discharge price</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-1 rounded" style={{ background: '#3b82f6' }} />
                <span style={{ color: '#94a3b8' }}>Charge price</span>
              </div>
            </div>
          </ChartWrapper>

          {/* Individual project spread (2025) */}
          {projectSpreads.length > 0 && (
            <ChartWrapper
              title="Individual Battery Spreads (2025)"
              subtitle="Discharge-minus-charge price spread for each operating battery, sorted by spread. Wide dispersion indicates early stages of competitive differentiation."
              source="AURES performance league tables, OpenElectricity"
            >
              <ResponsiveContainer width="100%" height={Math.max(300, projectSpreads.length * 22)}>
                <BarChart
                  data={projectSpreads}
                  layout="vertical"
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#94a3b8', fontSize: 9 }}
                    width={110}
                  />
                  <Tooltip content={<ProjectSpreadTooltip />} />
                  <Bar dataKey="spread" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {projectSpreads.map((entry, i) => {
                      const STATE_COLS: Record<string, string> = {
                        NSW: '#3b82f6', QLD: '#f59e0b', VIC: '#8b5cf6', SA: '#ef4444', TAS: '#06b6d4',
                      }
                      return <Cell key={i} fill={STATE_COLS[entry.state] || '#10b981'} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-2">
                {['NSW', 'QLD', 'VIC', 'SA'].map(s => {
                  const cols: Record<string, string> = { NSW: '#3b82f6', QLD: '#f59e0b', VIC: '#8b5cf6', SA: '#ef4444' }
                  return (
                    <div key={s} className="flex items-center gap-1 text-xs">
                      <span className="w-2 h-2 rounded-full" style={{ background: cols[s] }} />
                      <span style={{ color: '#94a3b8' }}>{s}</span>
                    </div>
                  )
                })}
              </div>
            </ChartWrapper>
          )}

          {/* Commentary */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#f1f5f9' }}>What the data suggests</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
              The 2024 to 2025 spread compression (median down from ~$240 to ~$188/MWh as the fleet nearly
              doubled from 17 to 28 tracked projects) is notable. The 2022 spike in spreads coincided with coal
              plant outages and the energy crisis — a transient event that temporarily boosted battery returns.
              The question is whether the underlying trend, once those one-off events are removed, shows
              persistent compression as fleet size grows.
            </p>
            <p className="text-xs leading-relaxed mt-2" style={{ color: '#cbd5e1' }}>
              Critically, there is enormous dispersion in individual project spreads — some batteries earn 5–10x
              more than others. This suggests location, duration, trading strategy and grid services revenue all
              matter significantly, and that the "penalty" will not be felt uniformly.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION: Revenue Dilution */}
      {/* ============================================================ */}
      {activeSection === 'revenue' && (
        <div className="space-y-4">
          {/* Revenue per MW over time */}
          <ChartWrapper
            title="Battery Revenue Per MW Over Time"
            subtitle="Annual median and mean revenue per installed MW. A sustained decline alongside fleet growth would be the strongest signal of correlation penalty."
            source="AURES revenue intelligence, OpenElectricity"
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueOverTime} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 10 }}
                  tickFormatter={(v: number) => formatDollars(v)}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Bar dataKey="median_rev" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={35} name="Median" />
                <Bar dataKey="mean_rev" fill="#10b981" fillOpacity={0.3} radius={[4, 4, 0, 0]} maxBarSize={35} name="Mean" />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded" style={{ background: '#10b981' }} />
                <span style={{ color: '#94a3b8' }}>Median $/MW</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-3 rounded" style={{ background: '#10b981', opacity: 0.3 }} />
                <span style={{ color: '#94a3b8' }}>Mean $/MW</span>
              </div>
            </div>

            {/* Fleet count below */}
            <div className="flex justify-between mt-2 px-2">
              {revenueOverTime.map(d => (
                <div key={d.year} className="text-center">
                  <div className="text-[10px] font-mono" style={{ color: '#64748b' }}>{d.fleet_count}</div>
                  <div className="text-[9px]" style={{ color: '#475569' }}>projects</div>
                </div>
              ))}
            </div>
          </ChartWrapper>

          {/* Fleet performance dispersion */}
          {fleetDispersion && (
            <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: '#f1f5f9' }}>
                Fleet Performance Dispersion (2025)
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center p-2 rounded" style={{ background: '#0f172a' }}>
                  <div className="text-[10px] uppercase" style={{ color: '#64748b' }}>Top Quartile</div>
                  <div className="text-sm font-bold font-mono" style={{ color: '#10b981' }}>
                    {formatDollars(fleetDispersion.q1AvgRevenue)}/MW
                  </div>
                  <div className="text-[10px]" style={{ color: '#64748b' }}>{fleetDispersion.q1Count} projects</div>
                </div>
                <div className="text-center p-2 rounded" style={{ background: '#0f172a' }}>
                  <div className="text-[10px] uppercase" style={{ color: '#64748b' }}>Fleet Average</div>
                  <div className="text-sm font-bold font-mono" style={{ color: '#f59e0b' }}>
                    {formatDollars(fleetDispersion.fleetAvgRevenue)}/MW
                  </div>
                  <div className="text-[10px]" style={{ color: '#64748b' }}>{fleetDispersion.totalProjects} projects</div>
                </div>
                <div className="text-center p-2 rounded" style={{ background: '#0f172a' }}>
                  <div className="text-[10px] uppercase" style={{ color: '#64748b' }}>Bottom Quartile</div>
                  <div className="text-sm font-bold font-mono" style={{ color: '#ef4444' }}>
                    {formatDollars(fleetDispersion.q4AvgRevenue)}/MW
                  </div>
                  <div className="text-[10px]" style={{ color: '#64748b' }}>{fleetDispersion.q4Count} projects</div>
                </div>
              </div>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Top-quartile batteries are earning <span className="font-bold" style={{ color: '#f59e0b' }}>
                {fleetDispersion.ratio}x</span> the revenue of bottom-quartile performers.
                This growing dispersion mirrors the early stages of the solar experience — when the "average" return
                may still look viable, but the spread between winners and losers tells a more nuanced story.
              </p>
            </div>
          )}

          {/* Top and bottom performers table */}
          {bessLeague && (
            <ChartWrapper
              title="2025 Battery Performance Ranking"
              subtitle="Top and bottom performers by revenue per MW. Click any project to see details."
              source="AURES performance league tables"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155' }}>
                      <th className="text-left py-2 pr-2" style={{ color: '#94a3b8' }}>#</th>
                      <th className="text-left py-2 pr-2" style={{ color: '#94a3b8' }}>Project</th>
                      <th className="text-right py-2 px-1" style={{ color: '#94a3b8' }}>MW</th>
                      <th className="text-right py-2 px-1" style={{ color: '#94a3b8' }}>$/MW</th>
                      <th className="text-right py-2 px-1" style={{ color: '#94a3b8' }}>Spread</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Top 5 */}
                    {bessLeague.projects.slice(0, 5).map((p, i) => (
                      <tr key={p.project_id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td className="py-1.5 pr-2 font-mono" style={{ color: '#10b981' }}>{i + 1}</td>
                        <td className="py-1.5 pr-2">
                          <Link to={`/projects/${p.project_id}`} className="hover:underline" style={{ color: '#cbd5e1' }}>
                            {p.name.length > 25 ? p.name.substring(0, 25) + '…' : p.name}
                          </Link>
                          <span className="ml-1 text-[10px]" style={{ color: '#64748b' }}>{p.state}</span>
                        </td>
                        <td className="py-1.5 px-1 text-right font-mono" style={{ color: '#94a3b8' }}>{p.capacity_mw}</td>
                        <td className="py-1.5 px-1 text-right font-mono" style={{ color: '#10b981' }}>{formatDollars(p.revenue_per_mw || 0)}</td>
                        <td className="py-1.5 px-1 text-right font-mono" style={{ color: '#f1f5f9' }}>
                          ${((p.avg_discharge_price || 0) - (p.avg_charge_price || 0)).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                    {/* Separator */}
                    <tr>
                      <td colSpan={5} className="py-1 text-center text-[10px]" style={{ color: '#475569' }}>
                        ⋯ {bessLeague.projects.length - 10} projects ⋯
                      </td>
                    </tr>
                    {/* Bottom 5 */}
                    {bessLeague.projects.slice(-5).map((p, i) => (
                      <tr key={p.project_id} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td className="py-1.5 pr-2 font-mono" style={{ color: '#ef4444' }}>{bessLeague.projects.length - 4 + i}</td>
                        <td className="py-1.5 pr-2">
                          <Link to={`/projects/${p.project_id}`} className="hover:underline" style={{ color: '#cbd5e1' }}>
                            {p.name.length > 25 ? p.name.substring(0, 25) + '…' : p.name}
                          </Link>
                          <span className="ml-1 text-[10px]" style={{ color: '#64748b' }}>{p.state}</span>
                        </td>
                        <td className="py-1.5 px-1 text-right font-mono" style={{ color: '#94a3b8' }}>{p.capacity_mw}</td>
                        <td className="py-1.5 px-1 text-right font-mono" style={{ color: '#ef4444' }}>{formatDollars(p.revenue_per_mw || 0)}</td>
                        <td className="py-1.5 px-1 text-right font-mono" style={{ color: '#f1f5f9' }}>
                          ${((p.avg_discharge_price || 0) - (p.avg_charge_price || 0)).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartWrapper>
          )}

          {/* Note on 2026 data */}
          <div className="rounded-lg p-3" style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <p className="text-xs" style={{ color: '#64748b' }}>
              <span className="font-semibold" style={{ color: '#f59e0b' }}>Note on 2026:</span>{' '}
              Revenue data for 2026 is year-to-date only (Q1) and not directly comparable to full-year figures.
              The apparent drop in mean revenue per MW in 2026 reflects partial-year data, not necessarily a
              permanent decline. However, Q1 is traditionally a weaker quarter for battery returns (milder
              weather, lower demand).
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION: Public Risk / Scheme Underwriting */}
      {/* ============================================================ */}
      {activeSection === 'schemes' && schemeBreakdown && (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#f1f5f9' }}>
              Government Scheme Underwriting of Battery Fleet
            </h3>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              Unlike the early solar buildout (underwritten largely through the private LGC market), a significant
              portion of the current battery pipeline is backed by government revenue contracts — CIS, LTESA and
              VRET. This transfers long-term revenue risk onto public balance sheets.
            </p>

            {/* Stacked bar visual */}
            <div className="mb-4">
              <div className="flex rounded-lg overflow-hidden h-8">
                {schemeBreakdown.cis > 0 && (
                  <div
                    className="flex items-center justify-center text-[10px] font-bold"
                    style={{
                      width: `${schemeBreakdown.cisPct}%`,
                      background: SCHEME_COLOURS.CIS,
                      color: '#0f172a',
                      minWidth: schemeBreakdown.cisPct > 5 ? undefined : 30,
                    }}
                  >
                    {schemeBreakdown.cisPct > 8 ? `CIS ${schemeBreakdown.cisPct}%` : 'CIS'}
                  </div>
                )}
                {schemeBreakdown.ltesa > 0 && (
                  <div
                    className="flex items-center justify-center text-[10px] font-bold"
                    style={{
                      width: `${schemeBreakdown.ltesaPct}%`,
                      background: SCHEME_COLOURS.LTESA,
                      color: '#f1f5f9',
                      minWidth: schemeBreakdown.ltesaPct > 5 ? undefined : 30,
                    }}
                  >
                    {schemeBreakdown.ltesaPct > 8 ? `LTESA ${schemeBreakdown.ltesaPct}%` : 'LTESA'}
                  </div>
                )}
                <div
                  className="flex items-center justify-center text-[10px] font-bold"
                  style={{
                    width: `${schemeBreakdown.uncontractedPct}%`,
                    background: SCHEME_COLOURS.Uncontracted,
                    color: '#94a3b8',
                  }}
                >
                  {schemeBreakdown.uncontractedPct > 15 ? `Uncontracted ${schemeBreakdown.uncontractedPct}%` : ''}
                </div>
              </div>
              <div className="flex justify-between mt-1 text-[10px]" style={{ color: '#64748b' }}>
                <span>0 MW</span>
                <span>{formatGW(schemeBreakdown.total)}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded" style={{ background: '#0f172a' }}>
                <div className="text-[10px] uppercase" style={{ color: '#64748b' }}>CIS</div>
                <div className="text-sm font-bold font-mono" style={{ color: SCHEME_COLOURS.CIS }}>
                  {formatGW(schemeBreakdown.cis)}
                </div>
                <div className="text-[10px]" style={{ color: '#64748b' }}>{schemeBreakdown.cisPct}%</div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: '#0f172a' }}>
                <div className="text-[10px] uppercase" style={{ color: '#64748b' }}>LTESA</div>
                <div className="text-sm font-bold font-mono" style={{ color: SCHEME_COLOURS.LTESA }}>
                  {formatGW(schemeBreakdown.ltesa)}
                </div>
                <div className="text-[10px]" style={{ color: '#64748b' }}>{schemeBreakdown.ltesaPct}%</div>
              </div>
              <div className="text-center p-2 rounded" style={{ background: '#0f172a' }}>
                <div className="text-[10px] uppercase" style={{ color: '#64748b' }}>Merchant</div>
                <div className="text-sm font-bold font-mono" style={{ color: '#94a3b8' }}>
                  {formatGW(schemeBreakdown.uncontracted)}
                </div>
                <div className="text-[10px]" style={{ color: '#64748b' }}>{schemeBreakdown.uncontractedPct}%</div>
              </div>
            </div>
          </div>

          {/* Scheme project list */}
          <ChartWrapper
            title="Battery Projects with Government Contracts"
            subtitle="CIS and LTESA contracted battery projects, sorted by capacity."
            source="AURES scheme tracker"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th className="text-left py-2 pr-2" style={{ color: '#94a3b8' }}>Project</th>
                    <th className="text-right py-2 px-1" style={{ color: '#94a3b8' }}>MW</th>
                    <th className="text-left py-2 px-1" style={{ color: '#94a3b8' }}>Scheme</th>
                    <th className="text-left py-2 px-1" style={{ color: '#94a3b8' }}>State</th>
                    <th className="text-left py-2 px-1" style={{ color: '#94a3b8' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schemeBreakdown.allSchemeProjects.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td className="py-1.5 pr-2">
                        {p.id ? (
                          <Link to={`/projects/${p.id}`} className="hover:underline" style={{ color: '#cbd5e1' }}>
                            {p.name.length > 28 ? p.name.substring(0, 28) + '…' : p.name}
                          </Link>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>{p.name}</span>
                        )}
                      </td>
                      <td className="py-1.5 px-1 text-right font-mono" style={{ color: '#f1f5f9' }}>{p.capacity_mw}</td>
                      <td className="py-1.5 px-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{
                          background: (SCHEME_COLOURS[p.scheme] || '#64748b') + '20',
                          color: SCHEME_COLOURS[p.scheme] || '#64748b',
                        }}>
                          {p.scheme}
                        </span>
                      </td>
                      <td className="py-1.5 px-1" style={{ color: '#94a3b8' }}>{p.state}</td>
                      <td className="py-1.5 px-1">
                        <span className="text-[10px]" style={{
                          color: p.status === 'operating' ? '#10b981' :
                                 p.status === 'construction' ? '#3b82f6' : '#64748b'
                        }}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartWrapper>

          {/* Commentary */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#f1f5f9' }}>Why this matters</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#cbd5e1' }}>
              The early solar buildout was underwritten largely through the Renewable Energy Target's LGC scheme,
              where asset underperformance was almost entirely a private investment problem. The current battery
              buildout is different — CIS and LTESA contracts transfer a portion of long-term revenue risk onto
              public balance sheets. If the correlation penalty compresses merchant battery revenues below the
              strike prices embedded in these contracts, taxpayers and electricity consumers may bear part of
              the cost.
            </p>
            <p className="text-xs leading-relaxed mt-2" style={{ color: '#cbd5e1' }}>
              This isn't necessarily a negative outcome — these schemes were designed to de-risk the transition
              and accelerate deployment. But it does mean the public has more skin in the game this time,
              and the stakes of getting the sizing and pacing right are higher.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION: Outlook */}
      {/* ============================================================ */}
      {activeSection === 'outlook' && (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f1f5f9' }}>Is History Rhyming?</h3>

            {/* Comparison table: Solar penalty vs Battery penalty */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th className="text-left py-2 pr-2" style={{ color: '#94a3b8' }}>Factor</th>
                    <th className="text-left py-2 px-2" style={{ color: '#f59e0b' }}>Solar (2015–2022)</th>
                    <th className="text-left py-2 px-2" style={{ color: '#10b981' }}>Battery (2022–2026+)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      factor: 'Correlation driver',
                      solar: 'Narrow longitude band — all produce at same time',
                      battery: 'Similar durations (1–2hr) — all cycle on same diurnal pattern',
                    },
                    {
                      factor: 'Behind-the-meter',
                      solar: 'Rooftop solar eroded midday prices without facing wholesale exposure',
                      battery: 'Home batteries (4–5 GW installed in 9 months) dispatched before grid-scale',
                    },
                    {
                      factor: 'Buildout rate',
                      solar: 'Gradual ramp over ~10 years',
                      battery: 'Faster ramp — fleet doubling every 12–18 months',
                    },
                    {
                      factor: 'Target window',
                      solar: 'Broad midday belly of duck curve (many hours)',
                      battery: 'Narrow evening peak (2–4 hours) — easier to saturate',
                    },
                    {
                      factor: 'Public risk',
                      solar: 'Mostly private (LGC market)',
                      battery: `~${schemeBreakdown ? schemeBreakdown.cisPct + schemeBreakdown.ltesaPct : 30}% government-contracted (CIS/LTESA)`,
                    },
                    {
                      factor: 'Price impact',
                      solar: 'Midday QLD: $40 → $0/MWh over a decade',
                      battery: 'Evening spreads: early signs of compression in 2025',
                    },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td className="py-2 pr-2 font-medium" style={{ color: '#f1f5f9' }}>{row.factor}</td>
                      <td className="py-2 px-2" style={{ color: '#94a3b8' }}>{row.solar}</td>
                      <td className="py-2 px-2" style={{ color: '#94a3b8' }}>{row.battery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Counterarguments */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#f1f5f9' }}>Counterarguments & Tailwinds</h3>
            <div className="space-y-3">
              {[
                {
                  title: 'Coal closures create step-change opportunities',
                  detail: 'Each coal station exit temporarily boosts battery returns — but in a market adding capacity at the current rate, that relief may be quickly eroded.',
                  colour: '#10b981',
                },
                {
                  title: 'Data centres & electrification add load',
                  detail: 'Significant new demand is coming, but there is genuine uncertainty about timing and scale. The solar experience taught us that structural tailwinds rarely arrive on the same timeline as capital deployment.',
                  colour: '#3b82f6',
                },
                {
                  title: 'Longer-duration batteries change dynamics',
                  detail: `4-hour and 8-hour batteries from 2027+ can access deeper price cycles and are less correlated with the 1-2 hour fleet. The NSW LDES tender alone adds 12 GWh of 8-10 hour storage.`,
                  colour: '#8b5cf6',
                },
                {
                  title: 'Grid services provide revenue diversification',
                  detail: 'FCAS, inertia, system strength and other ancillary services provide non-arbitrage revenue streams — though FCAS market saturation from late 2023 shows this isn\'t immune to the same dynamics.',
                  colour: '#f59e0b',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-1 rounded flex-shrink-0 self-stretch" style={{ background: item.colour }} />
                  <div>
                    <div className="text-xs font-semibold" style={{ color: item.colour }}>{item.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AURES metrics to watch */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: '#f1f5f9' }}>AURES Metrics to Watch</h3>
            <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>
              We'll track these signals across future updates to evaluate whether a battery correlation penalty
              is materialising:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {[
                { metric: 'Median arbitrage spread', current: `$${spreadData.find(d => d.year === 2025)?.median_spread?.toFixed(0) || '—'}/MWh`, direction: 'Watch for sustained decline below $150' },
                { metric: 'Revenue per MW (median)', current: `${formatDollars(revenueOverTime.find(d => d.year === 2025)?.median_rev || 0)}/MW`, direction: 'Below $80k would signal distress for merchant projects' },
                { metric: 'Q1/Q4 revenue ratio', current: `${fleetDispersion?.ratio || '—'}x`, direction: 'Widening ratio = differentiation; compression = uniform penalty' },
                { metric: 'Fleet size', current: `${spreadData.find(d => d.year === 2025)?.fleet_count || 28} → ${batteryData?.nem_wide.operating.by_state ? Object.values(batteryData.nem_wide.operating.by_state).reduce((s, v) => s + v.projects, 0) + Object.values(batteryData.nem_wide.construction.by_state || {}).reduce((s, v) => s + v.projects, 0) : '50+'}`, direction: 'Track revenue trends against fleet additions' },
                { metric: 'Scheme contract coverage', current: `${schemeBreakdown ? schemeBreakdown.cisPct + schemeBreakdown.ltesaPct : '—'}%`, direction: 'Higher = more public risk exposure if spreads compress' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded" style={{ background: '#0f172a' }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium" style={{ color: '#f1f5f9' }}>{item.metric}</div>
                    <div className="text-[10px]" style={{ color: '#64748b' }}>{item.direction}</div>
                  </div>
                  <div className="text-xs font-mono font-bold flex-shrink-0" style={{ color: '#10b981' }}>
                    {item.current}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attribution */}
          <div className="rounded-lg p-3 text-center" style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <p className="text-xs" style={{ color: '#64748b' }}>
              Analysis inspired by{' '}
              <a
                href="https://wattclarity.com.au/articles/2026/04/is-a-battery-correlation-penalty-looming/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: '#10b981' }}
              >
                WattClarity
              </a>
              {' '}— rebuilt independently using AURES data from AEMO registrations, OpenElectricity performance
              data, and government scheme records. Data refreshed with each pipeline run.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
