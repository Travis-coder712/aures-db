import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, Cell,
  PieChart, Pie,
} from 'recharts'
import { fetchEISAnalytics } from '../../lib/dataService'
import type { EISAnalyticsData, EISWindProject, EISBESSProject } from '../../lib/types'
import ScrollableTable from '../../components/common/ScrollableTable'

// ============================================================
// Icons — defined BEFORE const arrays per project pattern
// ============================================================

const WindIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 1.94.831a1 1 0 00.788 0l7-3a1 1 0 000-1.838l-7-3.001z" />
    <path d="M3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
  </svg>
)

const BatteryIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2v-1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1V6a2 2 0 00-2-2H2zm14 2v8H2V6h14z" />
  </svg>
)

const ConnectionIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
)

const SortUpIcon = () => (
  <svg className="w-3 h-3 inline" viewBox="0 0 10 10" fill="currentColor">
    <path d="M5 2L9 8H1L5 2z" />
  </svg>
)

const SortDownIcon = () => (
  <svg className="w-3 h-3 inline" viewBox="0 0 10 10" fill="currentColor">
    <path d="M5 8L1 2H9L5 8z" />
  </svg>
)

// ============================================================
// Colour maps
// ============================================================

const STATE_COLOURS: Record<string, string> = {
  NSW: '#3b82f6', VIC: '#8b5cf6', QLD: '#f59e0b',
  SA: '#10b981', TAS: '#06b6d4', WA: '#ec4899',
}

const STATUS_COLOURS: Record<string, string> = {
  operating: '#10b981', commissioning: '#22d3ee', construction: '#f59e0b',
  development: '#8b5cf6', withdrawn: '#6b7280',
}

const CHEM_COLOURS: Record<string, string> = {
  LFP: '#10b981', NMC: '#f59e0b', 'Flow battery': '#3b82f6',
}

const PCS_COLOURS: Record<string, string> = {
  grid_forming: '#3b82f6', grid_following: '#f59e0b', both: '#8b5cf6',
}

const getStateColour = (s: string) => STATE_COLOURS[s] || '#636e72'
const getStatusColour = (s: string) => STATUS_COLOURS[s] || '#636e72'

// ============================================================
// Tabs
// ============================================================

type TabId = 'wind' | 'bess' | 'connection'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'wind', label: 'Wind', icon: <WindIcon /> },
  { id: 'bess', label: 'BESS', icon: <BatteryIcon /> },
  { id: 'connection', label: 'Grid Connection', icon: <ConnectionIcon /> },
]

// ============================================================
// Formatters
// ============================================================

const fmt = (v: number | null | undefined, dec = 1) =>
  v != null ? v.toFixed(dec) : '—'
const fmtInt = (v: number | null | undefined) =>
  v != null ? Math.round(v).toLocaleString() : '—'

// Custom tooltip
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name?: string; value?: number; color?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-medium text-[var(--color-text)] mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.value}
        </p>
      ))}
    </div>
  )
}

// Custom scatter tooltip
const ScatterTooltip = ({ active, payload }: { active?: boolean; payload?: { payload?: Record<string, unknown> }[] }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as Record<string, unknown> | undefined
  if (!d) return null
  return (
    <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-lg text-xs max-w-[200px]">
      <p className="font-medium text-[var(--color-text)] mb-1 truncate">{d.name as string}</p>
      <p className="text-[var(--color-text-muted)]">{d.state as string} · {fmtInt(d.capacity_mw as number)} MW</p>
      {d.wind_speed_mean_ms != null && (
        <p className="text-[var(--color-text-muted)]">Wind: {fmt(d.wind_speed_mean_ms as number)} m/s</p>
      )}
      {d.assumed_capacity_factor_pct != null && (
        <p className="text-[var(--color-text-muted)]">CF: {fmt(d.assumed_capacity_factor_pct as number)}%</p>
      )}
      {d.hub_height_m != null && (
        <p className="text-[var(--color-text-muted)]">Hub: {fmt(d.hub_height_m as number, 0)}m</p>
      )}
    </div>
  )
}

// ============================================================
// Stats card
// ============================================================

function StatCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3">
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">{label}</p>
      <p className="text-lg font-bold text-[var(--color-text)]">
        {value}
        {unit && <span className="text-xs font-normal text-[var(--color-text-muted)] ml-1">{unit}</span>}
      </p>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function EISTechnical() {
  const [data, setData] = useState<EISAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabId>('wind')
  const [windSort, setWindSort] = useState<{ col: keyof EISWindProject; dir: 'asc' | 'desc' }>({ col: 'capacity_mw', dir: 'desc' })
  const [bessSort, setBessSort] = useState<{ col: keyof EISBESSProject; dir: 'asc' | 'desc' }>({ col: 'capacity_mw', dir: 'desc' })

  useEffect(() => {
    fetchEISAnalytics().then((d) => { setData(d); setLoading(false) })
  }, [])

  // ---- Wind derived data ----
  const windScatterData = useMemo(() => {
    if (!data) return []
    return data.wind_projects
      .filter((p) => p.wind_speed_mean_ms != null && p.assumed_capacity_factor_pct != null)
      .map((p) => ({ ...p }))
  }, [data])

  const hubHeightData = useMemo(() => {
    if (!data) return []
    const buckets: Record<string, number> = {}
    data.wind_projects.forEach((p) => {
      if (p.hub_height_m != null) {
        const b = `${Math.floor(p.hub_height_m / 10) * 10}–${Math.floor(p.hub_height_m / 10) * 10 + 9}m`
        buckets[b] = (buckets[b] || 0) + 1
      }
    })
    return Object.entries(buckets)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([range, count]) => ({ range, count }))
  }, [data])

  const rotorDiameterData = useMemo(() => {
    if (!data) return []
    const buckets: Record<string, number> = {}
    data.wind_projects.forEach((p) => {
      if (p.rotor_diameter_m != null) {
        const b = `${Math.floor(p.rotor_diameter_m / 10) * 10}–${Math.floor(p.rotor_diameter_m / 10) * 10 + 9}m`
        buckets[b] = (buckets[b] || 0) + 1
      }
    })
    return Object.entries(buckets)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([range, count]) => ({ range, count }))
  }, [data])

  const turbineOEMData = useMemo(() => {
    if (!data) return []
    const counts: Record<string, number> = {}
    data.wind_projects.forEach((p) => {
      if (p.turbine_model) {
        const brand = p.turbine_model.split(' ')[0] || 'Unknown'
        counts[brand] = (counts[brand] || 0) + 1
      }
    })
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }))
  }, [data])

  const sortedWindProjects = useMemo(() => {
    if (!data) return []
    return [...data.wind_projects].sort((a, b) => {
      const av = a[windSort.col] ?? 0
      const bv = b[windSort.col] ?? 0
      if (typeof av === 'string' && typeof bv === 'string')
        return windSort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return windSort.dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [data, windSort])

  // ---- BESS derived data ----
  const chemistryData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.summary.bess_stats.chemistry_breakdown)
      .map(([name, value]) => ({ name, value }))
  }, [data])

  const pcsTypeData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.summary.bess_stats.pcs_type_breakdown)
      .map(([name, value]) => ({
        name: name === 'grid_forming' ? 'Grid Forming' : name === 'grid_following' ? 'Grid Following' : 'Both',
        value,
        key: name,
      }))
  }, [data])

  const cellSupplierData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.summary.bess_stats.top_cell_suppliers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, count, fullName: name }))
  }, [data])

  const inverterSupplierData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.summary.bess_stats.top_inverter_suppliers)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, count, fullName: name }))
  }, [data])

  const durationData = useMemo(() => {
    if (!data) return []
    const buckets: Record<string, number> = {}
    data.bess_projects.forEach((p) => {
      if (p.duration_hours != null) {
        const h = p.duration_hours
        const label = h <= 1 ? '≤1h' : h <= 2 ? '1–2h' : h <= 4 ? '2–4h' : h <= 8 ? '4–8h' : '>8h'
        buckets[label] = (buckets[label] || 0) + 1
      }
    })
    const order = ['≤1h', '1–2h', '2–4h', '4–8h', '>8h']
    return order.filter((l) => buckets[l]).map((label) => ({ label, count: buckets[label] }))
  }, [data])

  const efficiencyData = useMemo(() => {
    if (!data) return []
    return data.bess_projects
      .filter((p) => p.round_trip_efficiency_pct != null || p.round_trip_efficiency_ac != null)
      .map((p) => ({
        name: p.name.length > 25 ? p.name.slice(0, 23) + '…' : p.name,
        dc: p.round_trip_efficiency_pct,
        ac: p.round_trip_efficiency_ac,
        id: p.id,
      }))
      .sort((a, b) => (b.dc ?? b.ac ?? 0) - (a.dc ?? a.ac ?? 0))
  }, [data])

  const sortedBessProjects = useMemo(() => {
    if (!data) return []
    return [...data.bess_projects].sort((a, b) => {
      const av = a[bessSort.col] ?? 0
      const bv = b[bessSort.col] ?? 0
      if (typeof av === 'string' && typeof bv === 'string')
        return bessSort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      return bessSort.dir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [data, bessSort])

  // ---- Connection derived data ----
  const voltageData = useMemo(() => {
    if (!data) return []
    return Object.entries(data.summary.connection.voltage_breakdown)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([voltage, count]) => ({ voltage, count }))
  }, [data])

  const connectionDistanceData = useMemo(() => {
    if (!data) return []
    const allProjects = [...data.wind_projects, ...data.bess_projects]
    return allProjects
      .filter((p) => p.connection_distance_km != null)
      .map((p) => ({
        name: p.name,
        distance: p.connection_distance_km!,
        capacity_mw: p.capacity_mw,
        state: p.state,
        type: 'wind_speed_mean_ms' in p ? 'Wind' : 'BESS',
        id: p.id,
      }))
      .sort((a, b) => b.distance - a.distance)
  }, [data])

  // ---- Wind sort toggle ----
  function toggleWindSort(col: keyof EISWindProject) {
    setWindSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'desc' }
    )
  }

  function toggleBessSort(col: keyof EISBESSProject) {
    setBessSort((prev) =>
      prev.col === col
        ? { col, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { col, dir: 'desc' }
    )
  }

  function WindSortIcon({ col }: { col: keyof EISWindProject }) {
    if (windSort.col !== col) return null
    return windSort.dir === 'asc' ? <SortUpIcon /> : <SortDownIcon />
  }

  function BessSortIcon({ col }: { col: keyof EISBESSProject }) {
    if (bessSort.col !== col) return null
    return bessSort.dir === 'asc' ? <SortUpIcon /> : <SortDownIcon />
  }

  // ---- Render ----
  if (loading) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-bg-elevated)] rounded w-48" />
          <div className="h-4 bg-[var(--color-bg-elevated)] rounded w-96" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-[var(--color-bg-elevated)] rounded-lg" />)}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold text-[var(--color-text)]">EIS Technical Specs</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">No EIS data available.</p>
      </div>
    )
  }

  const { summary } = data

  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link to="/intelligence" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm">
            ← Intelligence
          </Link>
        </div>
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)]">
          EIS / EIA Technical Specs
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Technical parameters extracted from {summary.total_eis} Environmental Impact Statements.
          {summary.wind} wind · {summary.bess} BESS · {summary.pumped_hydro} pumped hydro projects.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Total EIS Projects" value={summary.total_eis.toString()} />
        <StatCard label="Avg Wind Speed" value={fmt(summary.wind_stats.avg_wind_speed)} unit="m/s" />
        <StatCard label="Avg Hub Height" value={fmt(summary.wind_stats.avg_hub_height, 0)} unit="m" />
        <StatCard label="Avg Capacity Factor" value={fmt(summary.wind_stats.avg_capacity_factor)} unit="%" />
        <StatCard label="Avg BESS Duration" value={fmt(summary.bess_stats.avg_duration)} unit="hrs" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none border-b border-[var(--color-border)]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === t.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {t.icon}
            {t.label}
            <span className="text-xs opacity-60">
              ({t.id === 'wind' ? summary.wind : t.id === 'bess' ? summary.bess : summary.total_eis})
            </span>
          </button>
        ))}
      </div>

      {/* ============================================================ */}
      {/* WIND TAB */}
      {/* ============================================================ */}
      {tab === 'wind' && (
        <div className="space-y-6">
          {/* Wind scatter: wind speed vs capacity factor */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">
              Wind Speed vs Capacity Factor
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  type="number" dataKey="wind_speed_mean_ms" name="Wind Speed"
                  unit=" m/s" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  label={{ value: 'Mean Wind Speed (m/s)', position: 'bottom', offset: 5, style: { fontSize: 11, fill: 'var(--color-text-muted)' } }}
                />
                <YAxis
                  type="number" dataKey="assumed_capacity_factor_pct" name="Capacity Factor"
                  unit="%" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  label={{ value: 'CF %', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: 'var(--color-text-muted)' } }}
                />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter data={windScatterData} fill="#3b82f6">
                  {windScatterData.map((d, i) => (
                    <Cell key={i} fill={getStateColour(d.state)} r={Math.max(4, Math.min(12, d.capacity_mw / 150))} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {Object.entries(STATE_COLOURS).map(([s, c]) => (
                <span key={s} className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c }} />
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Hub height + Rotor diameter bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Hub Height Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hubHeightData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Projects" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Rotor Diameter Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={rotorDiameterData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Projects" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Turbine OEM breakdown */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Turbine OEM (from EIS)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={turbineOEMData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={55} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="value" name="Projects" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Wind project table */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">
              Wind Projects with EIS Data ({data.wind_projects.length})
            </h3>
            <ScrollableTable>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {([
                      ['name', 'Project'],
                      ['state', 'State'],
                      ['capacity_mw', 'MW'],
                      ['status', 'Status'],
                      ['wind_speed_mean_ms', 'Wind m/s'],
                      ['hub_height_m', 'Hub m'],
                      ['rotor_diameter_m', 'Rotor m'],
                      ['assumed_capacity_factor_pct', 'CF %'],
                      ['turbine_model', 'Turbine'],
                      ['connection_distance_km', 'Conn km'],
                    ] as [keyof EISWindProject, string][]).map(([col, label]) => (
                      <th
                        key={col}
                        onClick={() => toggleWindSort(col)}
                        className="px-2 py-2 text-left font-medium text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text)] whitespace-nowrap"
                      >
                        {label} <WindSortIcon col={col} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedWindProjects.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-elevated)]/50">
                      <td className="px-2 py-1.5">
                        <Link to={`/projects/${p.id}`} className="text-[var(--color-primary)] hover:underline whitespace-nowrap">
                          {p.name.length > 30 ? p.name.slice(0, 28) + '…' : p.name}
                        </Link>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: getStateColour(p.state) }} />
                        {p.state}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmtInt(p.capacity_mw)}</td>
                      <td className="px-2 py-1.5">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: getStatusColour(p.status) + '20', color: getStatusColour(p.status) }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(p.wind_speed_mean_ms)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(p.hub_height_m, 0)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(p.rotor_diameter_m, 0)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(p.assumed_capacity_factor_pct)}</td>
                      <td className="px-2 py-1.5 text-[var(--color-text-muted)] whitespace-nowrap">{p.turbine_model ? (p.turbine_model.length > 20 ? p.turbine_model.slice(0, 18) + '…' : p.turbine_model) : '—'}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(p.connection_distance_km)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BESS TAB */}
      {/* ============================================================ */}
      {tab === 'bess' && (
        <div className="space-y-6">
          {/* BESS summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Avg Efficiency (DC)" value={fmt(summary.bess_stats.avg_efficiency_dc)} unit="%" />
            <StatCard label="Avg Efficiency (AC)" value={fmt(summary.bess_stats.avg_efficiency_ac)} unit="%" />
            <StatCard label="Avg Duration" value={fmt(summary.bess_stats.avg_duration)} unit="hrs" />
            <StatCard label="Avg Conn Distance" value={fmt(summary.bess_stats.avg_connection_distance)} unit="km" />
          </div>

          {/* Chemistry + PCS donut charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Cell Chemistry</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chemistryData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={{ stroke: 'var(--color-text-muted)' }}
                  >
                    {chemistryData.map((d, i) => (
                      <Cell key={i} fill={CHEM_COLOURS[d.name] || ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'][i % 4]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">PCS Type (Grid Forming vs Following)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pcsTypeData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={{ stroke: 'var(--color-text-muted)' }}
                  >
                    {pcsTypeData.map((d, i) => (
                      <Cell key={i} fill={PCS_COLOURS[d.key] || ['#3b82f6', '#f59e0b', '#8b5cf6'][i % 3]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cell + Inverter supplier bar charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Cell Suppliers (EIS-sourced)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={cellSupplierData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} width={95} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Projects" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Inverter / PCS Suppliers (EIS-sourced)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={inverterSupplierData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} width={95} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Projects" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Duration distribution + Efficiency comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Storage Duration Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={durationData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Projects" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Round-Trip Efficiency Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={efficiencyData.slice(0, 12)} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: 'var(--color-text-muted)' }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis domain={[75, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="dc" name="DC Efficiency %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ac" name="AC Efficiency %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* BESS project table */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">
              BESS Projects with EIS Data ({data.bess_projects.length})
            </h3>
            <ScrollableTable>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    {([
                      ['name', 'Project'],
                      ['state', 'State'],
                      ['capacity_mw', 'MW'],
                      ['storage_mwh', 'MWh'],
                      ['duration_hours', 'Hrs'],
                      ['cell_chemistry', 'Chemistry'],
                      ['cell_supplier', 'Cell OEM'],
                      ['inverter_supplier', 'Inverter'],
                      ['pcs_type', 'PCS'],
                      ['round_trip_efficiency_pct', 'Eff DC%'],
                      ['connection_distance_km', 'Conn km'],
                    ] as [keyof EISBESSProject, string][]).map(([col, label]) => (
                      <th
                        key={col}
                        onClick={() => toggleBessSort(col)}
                        className="px-2 py-2 text-left font-medium text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-text)] whitespace-nowrap"
                      >
                        {label} <BessSortIcon col={col} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedBessProjects.map((p) => (
                    <tr key={p.id} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-elevated)]/50">
                      <td className="px-2 py-1.5">
                        <Link to={`/projects/${p.id}`} className="text-[var(--color-primary)] hover:underline whitespace-nowrap">
                          {p.name.length > 28 ? p.name.slice(0, 26) + '…' : p.name}
                        </Link>
                      </td>
                      <td className="px-2 py-1.5">
                        <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: getStateColour(p.state) }} />
                        {p.state}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmtInt(p.capacity_mw)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{p.storage_mwh ? fmtInt(p.storage_mwh) : '—'}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(p.duration_hours)}</td>
                      <td className="px-2 py-1.5">
                        {p.cell_chemistry ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: (CHEM_COLOURS[p.cell_chemistry] || '#6b7280') + '20', color: CHEM_COLOURS[p.cell_chemistry] || '#6b7280' }}>
                            {p.cell_chemistry}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-[var(--color-text-muted)] whitespace-nowrap">
                        {p.cell_supplier ? (p.cell_supplier.length > 16 ? p.cell_supplier.slice(0, 14) + '…' : p.cell_supplier) : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-[var(--color-text-muted)] whitespace-nowrap">
                        {p.inverter_supplier ? (p.inverter_supplier.length > 16 ? p.inverter_supplier.slice(0, 14) + '…' : p.inverter_supplier) : '—'}
                      </td>
                      <td className="px-2 py-1.5">
                        {p.pcs_type ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: (PCS_COLOURS[p.pcs_type] || '#6b7280') + '20', color: PCS_COLOURS[p.pcs_type] || '#6b7280' }}>
                            {p.pcs_type === 'grid_forming' ? 'GFM' : p.pcs_type === 'grid_following' ? 'GFL' : 'Both'}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(p.round_trip_efficiency_pct)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{fmt(p.connection_distance_km)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollableTable>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CONNECTION TAB */}
      {/* ============================================================ */}
      {tab === 'connection' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <StatCard label="Avg Connection Distance" value={fmt(summary.connection.avg_distance)} unit="km" />
            <StatCard label="Wind Avg Distance" value={fmt(summary.wind_stats.avg_connection_distance)} unit="km" />
            <StatCard label="BESS Avg Distance" value={fmt(summary.bess_stats.avg_connection_distance)} unit="km" />
          </div>

          {/* Voltage breakdown */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Connection Voltage Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={voltageData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="voltage" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Projects" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {voltageData.map((_, i) => (
                    <Cell key={i} fill={['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#ef4444'][i % 7]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Connection distance ranked */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">
              Connection Distance by Project (km)
            </h3>
            <ResponsiveContainer width="100%" height={Math.max(300, connectionDistanceData.length * 22)}>
              <BarChart data={connectionDistanceData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} unit=" km" />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }}
                  width={115}
                  tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 20) + '…' : v}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0]?.payload as Record<string, unknown>
                    return (
                      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-lg px-3 py-2 shadow-lg text-xs">
                        <p className="font-medium text-[var(--color-text)]">{d.name as string}</p>
                        <p className="text-[var(--color-text-muted)]">{d.state as string} · {d.type as string} · {fmtInt(d.capacity_mw as number)} MW</p>
                        <p className="text-[var(--color-text-muted)]">{fmt(d.distance as number)} km to connection</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="distance" name="Distance km" radius={[0, 4, 4, 0]}>
                  {connectionDistanceData.map((d, i) => (
                    <Cell key={i} fill={d.type === 'Wind' ? '#3b82f6' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#3b82f6' }} /> Wind
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#10b981' }} /> BESS
              </span>
            </div>
          </div>

          {/* NSP breakdown table */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Network Service Providers</h3>
            <NSPTable data={data} />
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-[11px] text-[var(--color-text-muted)]/50 text-center pt-4">
        Data sourced from Environmental Impact Statements (EIS/EIA) and project planning documents.
        Technical parameters may change during construction.
      </p>
    </div>
  )
}

// ============================================================
// NSP summary sub-component
// ============================================================

function NSPTable({ data }: { data: EISAnalyticsData }) {
  const nspCounts = useMemo(() => {
    const counts: Record<string, { wind: number; bess: number; total_mw: number }> = {}
    const addProject = (p: { nsp?: string; capacity_mw: number }, type: 'wind' | 'bess') => {
      if (!p.nsp) return
      if (!counts[p.nsp]) counts[p.nsp] = { wind: 0, bess: 0, total_mw: 0 }
      counts[p.nsp][type]++
      counts[p.nsp].total_mw += p.capacity_mw
    }
    data.wind_projects.forEach((p) => addProject(p, 'wind'))
    data.bess_projects.forEach((p) => addProject(p, 'bess'))
    return Object.entries(counts)
      .sort(([, a], [, b]) => b.total_mw - a.total_mw)
      .map(([name, v]) => ({ name, ...v }))
  }, [data])

  return (
    <ScrollableTable>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="px-2 py-2 text-left font-medium text-[var(--color-text-muted)]">NSP</th>
            <th className="px-2 py-2 text-right font-medium text-[var(--color-text-muted)]">Wind</th>
            <th className="px-2 py-2 text-right font-medium text-[var(--color-text-muted)]">BESS</th>
            <th className="px-2 py-2 text-right font-medium text-[var(--color-text-muted)]">Total MW</th>
          </tr>
        </thead>
        <tbody>
          {nspCounts.map((row) => (
            <tr key={row.name} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-elevated)]/50">
              <td className="px-2 py-1.5 text-[var(--color-text)]">{row.name}</td>
              <td className="px-2 py-1.5 text-right font-mono">{row.wind || '—'}</td>
              <td className="px-2 py-1.5 text-right font-mono">{row.bess || '—'}</td>
              <td className="px-2 py-1.5 text-right font-mono">{fmtInt(row.total_mw)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollableTable>
  )
}
