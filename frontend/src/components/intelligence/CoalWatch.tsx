import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  Legend,
} from 'recharts'
import { fetchCoalWatch } from '../../lib/dataService'
import type { CoalWatchData, CoalPlant } from '../../lib/types'

// ============================================================
// Colours & constants
// ============================================================

const PLANT_COLOURS: Record<string, string> = {
  ERARING: '#ef4444',
  BAYSW: '#f59e0b',
  VP: '#8b5cf6',
  MTPIPER: '#3b82f6',
}

const SEASON_LABELS: Record<string, string> = {
  summer: 'Summer (Dec-Feb)',
  autumn: 'Autumn (Mar-May)',
  winter: 'Winter (Jun-Aug)',
  spring: 'Spring (Sep-Nov)',
}

const SEASON_EMOJI: Record<string, string> = {
  summer: '\u2600\uFE0F',
  autumn: '\uD83C\uDF42',
  winter: '\u2744\uFE0F',
  spring: '\uD83C\uDF38',
}

function formatGWh(gwh: number): string {
  if (gwh >= 1000) return `${(gwh / 1000).toFixed(1)} TWh`
  return `${gwh.toLocaleString()} GWh`
}

function formatAUD(m: number): string {
  if (m >= 1000) return `A$${(m / 1000).toFixed(1)}B`
  return `A$${m.toLocaleString()}M`
}

// ============================================================
// Section types
// ============================================================

type SectionId = 'overview' | 'plant-profiles' | 'revenue' | 'seasonal' | 'closure-timeline'

// ============================================================
// Stat Card
// ============================================================

function StatCard({ label, value, sub, colour, trend }: {
  label: string; value: string; sub?: string; colour?: string; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-2xl font-bold" style={{ color: colour ?? '#f1f5f9' }}>{value}</p>
        {trend && (
          <span style={{ color: trend === 'down' ? '#ef4444' : trend === 'up' ? '#10b981' : '#94a3b8' }}>
            {trend === 'down' ? '↓' : trend === 'up' ? '↑' : '→'}
          </span>
        )}
      </div>
      {sub && <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{sub}</p>}
    </div>
  )
}

// ============================================================
// Data notice banner
// ============================================================

function DataNotice({ source }: { source: string }) {
  if (source !== 'sample') return null
  return (
    <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: '#f59e0b15', border: '1px solid #f59e0b30' }}>
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="#f59e0b">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <p className="text-xs" style={{ color: '#f59e0b' }}>
        Displaying illustrative data based on public reports. Real generation and revenue data from Open Electricity API will replace this when imported.
      </p>
    </div>
  )
}

// ============================================================
// Generation Volume Chart — All Plants
// ============================================================

function GenerationVolumeChart({ plants }: { plants: CoalPlant[] }) {
  const years = plants[0]?.annual_data.map(d => d.year) ?? []
  const data = years.map(year => {
    const row: Record<string, number | string> = { year: year.toString() }
    plants.forEach(p => {
      const d = p.annual_data.find(a => a.year === year)
      row[p.facility_code] = d?.generation_gwh ?? 0
    })
    return row
  })

  return (
    <div style={{ width: '100%', height: 340 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" tickFormatter={(v) => formatGWh(v as number)} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            formatter={(value) => [formatGWh(value as number)]}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {plants.map(p => (
            <Bar key={p.facility_code} dataKey={p.facility_code} name={p.name.replace(' Power Station', '')}
              fill={PLANT_COLOURS[p.facility_code]} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================
// Capacity Factor Trend
// ============================================================

function CapacityFactorChart({ plants }: { plants: CoalPlant[] }) {
  const years = plants[0]?.annual_data.map(d => d.year) ?? []
  const data = years.map(year => {
    const row: Record<string, number | string> = { year: year.toString() }
    plants.forEach(p => {
      const d = p.annual_data.find(a => a.year === year)
      row[p.facility_code] = d?.capacity_factor_pct ?? 0
    })
    return row
  })

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" domain={[30, 80]}
            tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            formatter={(value) => [`${(value as number).toFixed(1)}%`]}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {plants.map(p => (
            <Line key={p.facility_code} dataKey={p.facility_code} name={p.name.replace(' Power Station', '')}
              stroke={PLANT_COLOURS[p.facility_code]} strokeWidth={2} dot={{ r: 3 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================
// Fleet Revenue Chart
// ============================================================

function FleetRevenueChart({ data: fleetData }: { data: CoalWatchData['revenue_watch']['nsw_fleet_total'] }) {
  const chartData = fleetData.map(d => ({
    year: d.year.toString(),
    revenue: d.est_revenue_b_aud,
    generation: d.generation_twh,
    price: d.avg_price_aud_mwh,
  }))

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#334155" />
          <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155"
            tickFormatter={(v) => `A$${v}B`} />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155"
            tickFormatter={(v) => `${v} TWh`} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            formatter={(value, name) => {
              if (name === 'Revenue') return [`A$${(value as number).toFixed(1)}B`]
              if (name === 'Generation') return [`${(value as number).toFixed(1)} TWh`]
              return [String(value)]
            }}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.8} />
          <Bar yAxisId="right" dataKey="generation" name="Generation" fill="#6b7280" radius={[4, 4, 0, 0]} opacity={0.6} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================
// Coal Share Trend
// ============================================================

function CoalShareChart({ shareData }: { shareData: CoalWatchData['nem_coal_summary']['coal_share_nem_generation_pct'] }) {
  const data = shareData.map(d => ({ year: d.year.toString(), pct: d.pct }))

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="coalShareGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b7280" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#6b7280" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" domain={[30, 70]}
            tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            formatter={(value) => [`${value}%`, 'Coal Share']}
          />
          <Area type="monotone" dataKey="pct" stroke="#6b7280" strokeWidth={2} fill="url(#coalShareGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================
// Seasonal Comparison
// ============================================================

function SeasonalChart({ plants, selectedYear }: { plants: CoalPlant[]; selectedYear: number }) {
  const seasons = ['summer', 'autumn', 'winter', 'spring'] as const
  const data = seasons.map(season => {
    const row: Record<string, number | string> = { season: `${SEASON_EMOJI[season]} ${season.charAt(0).toUpperCase() + season.slice(1)}` }
    plants.forEach(p => {
      const d = p.seasonal_data.find(s => s.year === selectedYear && s.season === season)
      row[p.facility_code] = d?.generation_gwh ?? 0
    })
    return row
  })

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="season" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" tickFormatter={(v) => formatGWh(v as number)} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            formatter={(value) => [formatGWh(value as number)]}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          {plants.map(p => (
            <Bar key={p.facility_code} dataKey={p.facility_code} name={p.name.replace(' Power Station', '')}
              fill={PLANT_COLOURS[p.facility_code]} radius={[2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================
// Seasonal YoY Comparison
// ============================================================

function SeasonalYoYChart({ plants }: { plants: CoalPlant[] }) {
  const seasons = ['summer', 'autumn', 'winter', 'spring'] as const
  const data = seasons.map(season => {
    const row: Record<string, number | string> = {
      season: `${SEASON_EMOJI[season]} ${season.charAt(0).toUpperCase() + season.slice(1)}`,
    }
    // Compute total across all plants for 2024 and 2025
    let total2024 = 0, total2025 = 0
    plants.forEach(p => {
      const d24 = p.seasonal_data.find(s => s.year === 2024 && s.season === season)
      const d25 = p.seasonal_data.find(s => s.year === 2025 && s.season === season)
      total2024 += d24?.generation_gwh ?? 0
      total2025 += d25?.generation_gwh ?? 0
    })
    row['2024'] = total2024
    row['2025'] = total2025
    row['change_pct'] = total2024 > 0 ? Math.round(((total2025 - total2024) / total2024) * 100) : 0
    return row
  })

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="season" tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" tickFormatter={(v) => formatGWh(v as number)} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
            formatter={(value, name) => {
              if (name === '2024' || name === '2025') return [formatGWh(value as number)]
              return [`${value}%`, 'YoY Change']
            }}
          />
          <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
          <Bar dataKey="2024" name="2024" fill="#6b7280" radius={[2, 2, 0, 0]} />
          <Bar dataKey="2025" name="2025" fill="#ef4444" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ============================================================
// Plant Profile Card
// ============================================================

function PlantProfileCard({ plant }: { plant: CoalPlant }) {
  const latest = plant.annual_data[plant.annual_data.length - 1]
  const prev = plant.annual_data[plant.annual_data.length - 2]
  const genChange = prev ? ((latest.generation_gwh - prev.generation_gwh) / prev.generation_gwh * 100) : 0
  const revChange = prev ? ((latest.est_revenue_m_aud - prev.est_revenue_m_aud) / prev.est_revenue_m_aud * 100) : 0
  const cfChange = prev ? (latest.capacity_factor_pct - prev.capacity_factor_pct) : 0

  return (
    <div className="rounded-lg p-4" style={{ background: '#1e293b', border: `1px solid ${PLANT_COLOURS[plant.facility_code]}30` }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{plant.name}</h4>
          <p className="text-xs" style={{ color: '#94a3b8' }}>{plant.owner} &middot; {plant.capacity_mw.toLocaleString()} MW &middot; {plant.units} units</p>
        </div>
        <div className="w-3 h-3 rounded-full" style={{ background: PLANT_COLOURS[plant.facility_code] }} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded p-2" style={{ background: '#0f172a' }}>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Generation</p>
          <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{formatGWh(latest.generation_gwh)}</p>
          <p className="text-xs" style={{ color: genChange < 0 ? '#ef4444' : '#10b981' }}>{genChange.toFixed(1)}% YoY</p>
        </div>
        <div className="rounded p-2" style={{ background: '#0f172a' }}>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Est. Revenue</p>
          <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{formatAUD(latest.est_revenue_m_aud)}</p>
          <p className="text-xs" style={{ color: revChange < 0 ? '#ef4444' : '#10b981' }}>{revChange.toFixed(1)}% YoY</p>
        </div>
        <div className="rounded p-2" style={{ background: '#0f172a' }}>
          <p className="text-xs" style={{ color: '#94a3b8' }}>Capacity Factor</p>
          <p className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{latest.capacity_factor_pct.toFixed(1)}%</p>
          <p className="text-xs" style={{ color: cfChange < 0 ? '#ef4444' : '#10b981' }}>{cfChange > 0 ? '+' : ''}{cfChange.toFixed(1)}pp</p>
        </div>
      </div>

      {/* Closure info */}
      <div className="rounded p-2 mb-2" style={{ background: '#0f172a' }}>
        <div className="flex justify-between items-center">
          <span className="text-xs" style={{ color: '#94a3b8' }}>Closure date</span>
          <span className="text-xs font-mono font-bold" style={{ color: '#ef4444' }}>
            {new Date(plant.closure_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
          </span>
        </div>
        <p className="text-xs mt-1" style={{ color: '#64748b' }}>{plant.closure_note}</p>
      </div>

      {plant.battery_replacement && (
        <div className="rounded p-2" style={{ background: '#10b98110' }}>
          <p className="text-xs" style={{ color: '#10b981' }}>
            <span className="font-semibold">Battery replacement:</span> {plant.battery_replacement}
          </p>
        </div>
      )}

      {latest.note && (
        <p className="text-xs mt-2 italic" style={{ color: '#f59e0b' }}>{latest.note}</p>
      )}
    </div>
  )
}

// ============================================================
// Closure Timeline
// ============================================================

function ClosureTimeline({ closures }: { closures: CoalWatchData['nem_coal_summary']['closure_timeline'] }) {
  const sorted = [...closures].sort((a, b) => {
    const dateA = a.closed ?? a.closing ?? '9999'
    const dateB = b.closed ?? b.closing ?? '9999'
    return dateA.localeCompare(dateB)
  })

  return (
    <div className="space-y-2">
      {sorted.map(c => {
        const date = c.closed ?? c.closing ?? ''
        const isClosed = !!c.closed
        const isNSW = c.state === 'NSW'
        return (
          <div key={c.name} className="flex items-center gap-3 rounded-lg p-3" style={{
            background: isClosed ? '#0f172a' : '#1e293b',
            border: `1px solid ${isNSW ? '#ef444430' : '#33415530'}`,
            opacity: isClosed ? 0.7 : 1,
          }}>
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{
              background: isClosed ? '#6b7280' : isNSW ? '#ef4444' : '#f59e0b',
            }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{c.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{
                  background: isNSW ? '#ef444415' : '#f59e0b15',
                  color: isNSW ? '#ef4444' : '#f59e0b',
                }}>{c.state}</span>
                {isClosed && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#6b728020', color: '#6b7280' }}>Closed</span>}
              </div>
              <p className="text-xs" style={{ color: '#94a3b8' }}>{c.owner} &middot; {c.mw.toLocaleString()} MW</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-mono" style={{ color: isClosed ? '#6b7280' : '#ef4444' }}>
                {new Date(date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================

export default function CoalWatch() {
  const [data, setData] = useState<CoalWatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<SectionId>('overview')
  const [seasonalYear, setSeasonalYear] = useState(2025)

  useEffect(() => {
    fetchCoalWatch().then(d => { setData(d); setLoading(false) })
  }, [])

  const totalGen2025 = useMemo(() =>
    data?.nsw_coal_plants.reduce((sum, p) => sum + (p.annual_data.find(d => d.year === 2025)?.generation_gwh ?? 0), 0) ?? 0,
    [data])

  const totalGen2020 = useMemo(() =>
    data?.nsw_coal_plants.reduce((sum, p) => sum + (p.annual_data.find(d => d.year === 2020)?.generation_gwh ?? 0), 0) ?? 0,
    [data])

  const genDeclinePct = totalGen2020 > 0 ? ((totalGen2025 - totalGen2020) / totalGen2020 * 100) : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#ef4444' }} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg p-8 text-center" style={{ background: '#1e293b', border: '1px solid #334155' }}>
        <p style={{ color: '#94a3b8' }}>Coal Watch data not available.</p>
      </div>
    )
  }

  const SECTIONS: { id: SectionId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'plant-profiles', label: 'Plant Profiles' },
    { id: 'revenue', label: 'Revenue Watch' },
    { id: 'seasonal', label: 'Seasonal' },
    { id: 'closure-timeline', label: 'Closure Timeline' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg p-5" style={{ background: 'linear-gradient(135deg, #450a0a 0%, #1e293b 100%)', border: '1px solid #334155' }}>
        <div className="flex items-center gap-3 mb-2">
          <svg className="w-6 h-6" viewBox="0 0 20 20" fill="#ef4444">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
          <h2 className="text-xl font-bold" style={{ color: '#f1f5f9' }}>Coal Revenue Watch</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#ef444430', color: '#ef4444' }}>
            Updated {data.generated_at}
          </span>
        </div>
        <p className="text-sm" style={{ color: '#94a3b8' }}>
          Tracking the structural decline of NSW coal generation as batteries and renewables reshape the NEM.
          NSW coal output has fallen {Math.abs(genDeclinePct).toFixed(0)}% since 2020, with revenue and capacity factors
          in sustained decline.
        </p>
      </div>

      <DataNotice source={data.data_source} />

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard label="NSW Coal Capacity" value={`${(data.nem_coal_summary.nsw_capacity_mw / 1000).toFixed(1)} GW`} sub={`${data.nsw_coal_plants.length} plants, ${data.nsw_coal_plants.reduce((s, p) => s + p.units, 0)} units`} colour="#ef4444" />
        <StatCard label="2025 Generation" value={formatGWh(totalGen2025)} sub={`Down ${Math.abs(genDeclinePct).toFixed(0)}% from 2020`} colour="#f59e0b" trend="down" />
        <StatCard label="Coal NEM Share" value={`${data.nem_coal_summary.coal_share_nem_generation_pct[data.nem_coal_summary.coal_share_nem_generation_pct.length - 1]?.pct ?? 0}%`} sub="Down from 62% in 2020" colour="#6b7280" trend="down" />
        <StatCard label="BESS vs Coal" value={`${data.battery_vs_coal_context.bess_as_pct_of_coal_2027}%`} sub="NSW BESS as % of coal by 2027" colour="#10b981" trend="up" />
        <StatCard label="Next Closure" value="Eraring" sub="Apr 2029 (2.9 GW)" colour="#ef4444" />
        <StatCard label="Fleet Revenue (2025)" value={formatAUD(data.revenue_watch.nsw_fleet_total.find(d => d.year === 2025)?.est_revenue_b_aud ? data.revenue_watch.nsw_fleet_total.find(d => d.year === 2025)!.est_revenue_b_aud * 1000 : 0)} sub="Down ~33% from 2020" colour="#ef4444" trend="down" />
      </div>

      {/* Section navigation */}
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: activeSection === s.id ? '#ef444420' : '#1e293b',
              color: activeSection === s.id ? '#ef4444' : '#94a3b8',
              border: `1px solid ${activeSection === s.id ? '#ef444440' : '#334155'}`,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─── */}
      {activeSection === 'overview' && (
        <div className="space-y-4">
          {/* Generation volume stacked bar */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>NSW Coal Generation by Plant (Annual)</h3>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              Total generation across NSW's four remaining coal plants showing consistent year-on-year decline.
            </p>
            <GenerationVolumeChart plants={data.nsw_coal_plants} />
          </div>

          {/* Capacity factor trends */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>Capacity Factor Trends</h3>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              Falling capacity factors indicate coal plants are running less often as renewables and batteries take market share.
              Note: outages can distort individual years (e.g., Vales Point 2025).
            </p>
            <CapacityFactorChart plants={data.nsw_coal_plants} />
          </div>

          {/* Coal share of NEM */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>Coal Share of NEM Generation</h3>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              Coal's share of NEM generation has fallen from 62% to 40% in five years — a structural, irreversible trend.
            </p>
            <CoalShareChart shareData={data.nem_coal_summary.coal_share_nem_generation_pct} />
          </div>

          {/* Battery displacement context */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f1f5f9' }}>Battery vs Coal — The Squeeze</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.battery_vs_coal_context.key_dynamics.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#cbd5e1' }}>
                  <span style={{ color: '#ef4444', flexShrink: 0 }}>&#9679;</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── PLANT PROFILES ─── */}
      {activeSection === 'plant-profiles' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.nsw_coal_plants.map(p => (
              <PlantProfileCard key={p.facility_code} plant={p} />
            ))}
          </div>

          {/* Plant comparison table */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f1f5f9' }}>Plant Comparison (2025 Data)</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['Plant', 'Owner', 'MW', 'Gen (GWh)', 'CF%', 'Est. Rev', '$/MWh', 'Closure'].map(h => (
                      <th key={h} style={{ color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px', borderBottom: '1px solid #334155', textAlign: h === 'Plant' || h === 'Owner' ? 'left' : 'right' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.nsw_coal_plants.map(p => {
                    const d = p.annual_data.find(a => a.year === 2025)
                    return (
                      <tr key={p.facility_code} style={{ background: '#1e293b' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#263548')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#1e293b')}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #0f172a', color: '#f1f5f9', fontSize: 13 }}>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: PLANT_COLOURS[p.facility_code] }} />
                            {p.name.replace(' Power Station', '')}
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #0f172a', color: '#94a3b8', fontSize: 13 }}>{p.owner}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #0f172a', color: '#f1f5f9', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.capacity_mw.toLocaleString()}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #0f172a', color: '#f1f5f9', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d?.generation_gwh.toLocaleString() ?? '—'}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #0f172a', color: '#f1f5f9', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d?.capacity_factor_pct.toFixed(1) ?? '—'}%</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #0f172a', color: '#f1f5f9', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{d ? formatAUD(d.est_revenue_m_aud) : '—'}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #0f172a', color: '#94a3b8', fontSize: 13, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>${d?.avg_price_aud_mwh ?? '—'}</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #0f172a', color: '#ef4444', fontSize: 13, textAlign: 'right' }}>
                          {new Date(p.closure_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── REVENUE WATCH ─── */}
      {activeSection === 'revenue' && (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>NSW Coal Fleet — Revenue & Generation</h3>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              Revenue is a function of both volume and price. While 2022 saw extreme prices during the energy crisis,
              the underlying trend is clear: declining volumes are compressing revenue even when prices recover.
              Note: 2022 was an anomaly due to the energy crisis — extreme spot prices inflated revenue despite lower output.
            </p>
            <FleetRevenueChart data={data.revenue_watch.nsw_fleet_total} />
          </div>

          {/* Revenue per plant */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f1f5f9' }}>Revenue by Plant (Excluding 2022 Crisis Year)</h3>
            {(() => {
              const years = [2020, 2021, 2023, 2024, 2025]
              const chartData = years.map(year => {
                const row: Record<string, number | string> = { year: year.toString() }
                data.nsw_coal_plants.forEach(p => {
                  const d = p.annual_data.find(a => a.year === year)
                  row[p.facility_code] = d?.est_revenue_m_aud ?? 0
                })
                return row
              })
              return (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} stroke="#334155" />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} stroke="#334155" tickFormatter={(v) => formatAUD(v as number)} />
                      <Tooltip
                        contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                        formatter={(value) => [formatAUD(value as number)]}
                      />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                      {data.nsw_coal_plants.map(p => (
                        <Bar key={p.facility_code} dataKey={p.facility_code} name={p.name.replace(' Power Station', '')}
                          fill={PLANT_COLOURS[p.facility_code]} radius={[2, 2, 0, 0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            })()}
          </div>

          {/* Who's hurting most */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f1f5f9' }}>Who's Hurting Most? (2020 vs 2025)</h3>
            <div className="space-y-3">
              {data.nsw_coal_plants.map(p => {
                const d2020 = p.annual_data.find(d => d.year === 2020)
                const d2025 = p.annual_data.find(d => d.year === 2025)
                if (!d2020 || !d2025) return null
                const revDrop = ((d2025.est_revenue_m_aud - d2020.est_revenue_m_aud) / d2020.est_revenue_m_aud * 100)
                const genDrop = ((d2025.generation_gwh - d2020.generation_gwh) / d2020.generation_gwh * 100)
                const cfDrop = d2025.capacity_factor_pct - d2020.capacity_factor_pct
                return (
                  <div key={p.facility_code} className="rounded p-3" style={{ background: '#0f172a' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLANT_COLOURS[p.facility_code] }} />
                        <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{p.name.replace(' Power Station', '')}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: '#ef4444' }}>{revDrop.toFixed(0)}% revenue</span>
                    </div>
                    <div className="flex gap-4 text-xs" style={{ color: '#94a3b8' }}>
                      <span>Gen: <span style={{ color: '#ef4444' }}>{genDrop.toFixed(0)}%</span></span>
                      <span>CF: <span style={{ color: '#ef4444' }}>{cfDrop > 0 ? '+' : ''}{cfDrop.toFixed(1)}pp</span></span>
                      <span>{formatAUD(d2020.est_revenue_m_aud)} → {formatAUD(d2025.est_revenue_m_aud)}</span>
                    </div>
                    {/* Revenue drop bar */}
                    <div className="mt-2 rounded-full h-2" style={{ background: '#1e293b' }}>
                      <div className="rounded-full h-2" style={{
                        width: `${Math.max(5, 100 + revDrop)}%`,
                        background: `linear-gradient(90deg, #ef4444, ${PLANT_COLOURS[p.facility_code]})`,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-lg p-4" style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Key Insights</h4>
            <div className="space-y-2">
              {data.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2 text-xs" style={{ color: '#cbd5e1' }}>
                  <span style={{ color: '#ef4444', flexShrink: 0, marginTop: 2 }}>&#9679;</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── SEASONAL ─── */}
      {activeSection === 'seasonal' && (
        <div className="space-y-4">
          {/* Year selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: '#94a3b8' }}>Season view:</span>
            {[2024, 2025].map(y => (
              <button key={y} onClick={() => setSeasonalYear(y)}
                className="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: seasonalYear === y ? '#ef444420' : '#1e293b',
                  color: seasonalYear === y ? '#ef4444' : '#94a3b8',
                  border: `1px solid ${seasonalYear === y ? '#ef444440' : '#334155'}`,
                }}>
                {y}
              </button>
            ))}
          </div>

          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>Generation by Season — {seasonalYear}</h3>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              Seasonal patterns reveal when coal plants are running hardest. Summer peaks (air conditioning) and winter peaks (heating)
              typically drive higher generation, while spring sees the most solar displacement.
            </p>
            <SeasonalChart plants={data.nsw_coal_plants} selectedYear={seasonalYear} />
          </div>

          {/* YoY seasonal comparison */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>Year-on-Year Seasonal Comparison (All Plants)</h3>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              Total NSW coal output by season, comparing 2024 to 2025. Spring shows the largest declines as solar and batteries
              absorb more daytime generation.
            </p>
            <SeasonalYoYChart plants={data.nsw_coal_plants} />
          </div>

          {/* Seasonal price context */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f1f5f9' }}>Average Price by Season ($/MWh)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['summer', 'autumn', 'winter', 'spring'] as const).map(season => {
                const p24 = data.nsw_coal_plants[0]?.seasonal_data.find(s => s.year === 2024 && s.season === season)
                const p25 = data.nsw_coal_plants[0]?.seasonal_data.find(s => s.year === 2025 && s.season === season)
                const priceChange = p24 && p25 ? p25.avg_price_aud_mwh - p24.avg_price_aud_mwh : 0
                return (
                  <div key={season} className="rounded-lg p-3" style={{ background: '#0f172a' }}>
                    <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>{SEASON_EMOJI[season]} {SEASON_LABELS[season]}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold" style={{ color: '#f1f5f9' }}>${p25?.avg_price_aud_mwh ?? '—'}</span>
                      <span className="text-xs" style={{ color: priceChange < 0 ? '#ef4444' : '#10b981' }}>
                        {priceChange > 0 ? '+' : ''}{priceChange}/MWh
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: '#64748b' }}>vs ${p24?.avg_price_aud_mwh ?? '—'} in 2024</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── CLOSURE TIMELINE ─── */}
      {activeSection === 'closure-timeline' && (
        <div className="space-y-4">
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#f1f5f9' }}>NEM Coal Closure Timeline</h3>
            <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
              Scheduled closures for all NEM coal plants. NSW plants highlighted in red. Total NEM coal capacity: {(data.nem_coal_summary.total_capacity_mw / 1000).toFixed(1)} GW.
              Most closures are scheduled between 2028-2035, with battery storage filling the gap.
            </p>
            <ClosureTimeline closures={data.nem_coal_summary.closure_timeline} />
          </div>

          {/* Battery replacement context */}
          <div className="rounded-lg p-4" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#f1f5f9' }}>Battery Replacement Progress</h3>
            <div className="space-y-3">
              {data.nsw_coal_plants.map(p => (
                <div key={p.facility_code} className="flex items-center gap-3 rounded p-3" style={{ background: '#0f172a' }}>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PLANT_COLOURS[p.facility_code] }} />
                  <div className="flex-1">
                    <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{p.name.replace(' Power Station', '')}</span>
                    <span className="text-xs ml-2" style={{ color: '#94a3b8' }}>{p.capacity_mw.toLocaleString()} MW coal</span>
                  </div>
                  <div className="text-right">
                    {p.battery_replacement ? (
                      <span className="text-xs" style={{ color: '#10b981' }}>{p.battery_replacement}</span>
                    ) : (
                      <span className="text-xs" style={{ color: '#ef4444' }}>No battery replacement announced</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="rounded-lg p-4" style={{ background: '#0f172a', border: '1px solid #334155' }}>
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#94a3b8' }}>Sources</h4>
            <div className="flex flex-wrap gap-3">
              {data.sources.map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded hover:opacity-80 transition-opacity"
                  style={{ background: '#1e293b', color: '#3b82f6', border: '1px solid #334155' }}>
                  {s.name} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
