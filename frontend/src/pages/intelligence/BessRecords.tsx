import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBessRecordsLeaderboard } from '../../lib/dataService'
import DataProvenance from '../../components/common/DataProvenance'

// ── Types ───────────────────────────────────────────────────────────────────

interface Battery {
  duid: string
  name: string
  region: string
  capacity_mwh: number | null
  days_active: number
  first_date: string
  last_date: string
  peak_discharge_mwh: number
  peak_discharge_date: string
  peak_charge_mwh: number
  peak_charge_date: string
  total_discharge_mwh: number
  total_charge_mwh: number
}

interface FleetRecord {
  value_mwh?: number
  date?: string
  value_mw?: number
  time?: string
}

interface FleetRecords {
  fleet_peak_discharge_day: FleetRecord
  fleet_peak_charge_day: FleetRecord
  peak_5min_discharge_mw?: FleetRecord
  peak_5min_charge_mw?: FleetRecord
}

interface LeaderboardData {
  generated_at: string
  data_through: string
  total_batteries: number
  batteries: Battery[]
  fleet_records: Record<string, FleetRecords>
  top_discharge: Record<string, Battery[]>
  top_charge: Record<string, Battery[]>
}

// ── Constants ────────────────────────────────────────────────────────────────

const SCOPES = [
  { id: 'NEM', label: 'NEM', fullLabel: 'National (NEM)' },
  { id: 'NSW1', label: 'NSW', fullLabel: 'New South Wales' },
  { id: 'VIC1', label: 'VIC', fullLabel: 'Victoria' },
  { id: 'QLD1', label: 'QLD', fullLabel: 'Queensland' },
  { id: 'SA1', label: 'SA', fullLabel: 'South Australia' },
]

const REGION_COLOR: Record<string, string> = {
  NSW1: '#3b82f6',
  VIC1: '#06b6d4',
  QLD1: '#f59e0b',
  SA1:  '#f97316',
  TAS1: '#8b5cf6',
  NEM:  '#10b981',
}

const REGION_BG: Record<string, string> = {
  NSW1: 'bg-blue-500/15 text-blue-300',
  VIC1: 'bg-cyan-500/15 text-cyan-300',
  QLD1: 'bg-amber-500/15 text-amber-300',
  SA1:  'bg-orange-500/15 text-orange-300',
  TAS1: 'bg-purple-500/15 text-purple-300',
}

const RANK_STYLE = [
  { bg: 'bg-amber-500/20', text: 'text-amber-300', icon: '🥇' },
  { bg: 'bg-slate-400/20', text: 'text-slate-300', icon: '🥈' },
  { bg: 'bg-orange-700/20', text: 'text-orange-400', icon: '🥉' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—'
  return n.toLocaleString('en-AU', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: '2-digit' })
}

function fmtTime(s: string | null | undefined): string {
  if (!s) return ''
  const d = new Date(s)
  return d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// ── Sub-components ───────────────────────────────────────────────────────────

function HeroRecord({
  label, value, unit, sub, color,
}: { label: string; value: string; unit: string; sub?: string; color: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color }}>{label}</span>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-3xl font-bold text-[var(--color-text)]">{value}</span>
        <span className="text-sm text-[var(--color-text-muted)]">{unit}</span>
      </div>
      {sub && <span className="text-xs text-[var(--color-text-muted)] mt-0.5">{sub}</span>}
    </div>
  )
}

function RegionChip({ region }: { region: string }) {
  const cls = REGION_BG[region] || 'bg-[var(--color-bg)] text-[var(--color-text-muted)]'
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls}`}>
      {region.replace('1', '')}
    </span>
  )
}

function BarFill({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4
  return (
    <div className="flex-1 bg-[var(--color-bg)] rounded-full h-1.5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function LeaderboardTable({
  title, icon, unit, entries, valueKey, dateKey, accentColor, scope,
}: {
  title: string; icon: string; unit: string
  entries: Battery[]; valueKey: keyof Battery; dateKey: keyof Battery
  accentColor: string; scope: string
}) {
  const maxVal = Math.max(...entries.map(b => (b[valueKey] as number) || 0), 1)

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]"
           style={{ borderLeftWidth: 3, borderLeftColor: accentColor }}>
        <span className="text-base">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {scope === 'NEM' ? 'All NEM batteries' : `${scope.replace('1','')} batteries only`} · peak single day
          </p>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[var(--color-border)]">
        {entries.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] p-4">No data for this scope.</p>
        )}
        {entries.map((b, i) => {
          const val = (b[valueKey] as number) || 0
          const date = b[dateKey] as string
          const rs = RANK_STYLE[i] || null
          const color = REGION_COLOR[b.region] || '#64748b'

          return (
            <div key={b.duid}
                 className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-bg)]/50 transition-colors group">
              {/* Rank */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                              ${rs ? `${rs.bg} ${rs.text}` : 'text-[var(--color-text-muted)]'}`}>
                {rs ? rs.icon : i + 1}
              </div>

              {/* Name + region */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-[var(--color-text)] truncate max-w-[160px]"
                        title={b.name}>
                    {b.name}
                  </span>
                  <RegionChip region={b.region} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <BarFill value={val} max={maxVal} color={color} />
                  <span className="text-[10px] text-[var(--color-text-muted)] whitespace-nowrap">{fmtDate(date)}</span>
                </div>
              </div>

              {/* Value */}
              <div className="text-right flex-shrink-0">
                <span className="text-sm font-bold" style={{ color }}>{fmt(val, 0)}</span>
                <span className="text-[10px] text-[var(--color-text-muted)] ml-0.5">{unit}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FleetRecordRow({ label, record, unit, color }: {
  label: string; record?: FleetRecord; unit: string; color: string
}) {
  if (!record?.value_mwh && !record?.value_mw) return null
  const value = record.value_mwh ?? record.value_mw ?? 0
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
      <span className="text-xs text-[var(--color-text-muted)]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold" style={{ color }}>{fmt(value, 0)}</span>
        <span className="text-xs text-[var(--color-text-muted)] ml-1">{unit}</span>
        {record.date && (
          <span className="text-[10px] text-[var(--color-text-muted)] block">
            {fmtDate(record.date)}{record.time ? ` · ${fmtTime(record.time)}` : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BessRecords() {
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState('NEM')
  const [tab, setTab] = useState<'discharge' | 'charge'>('discharge')

  useEffect(() => {
    fetchBessRecordsLeaderboard().then(d => { setData(d); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--color-bg-card)] rounded w-64" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-[var(--color-bg-card)] rounded-xl" />)}
          </div>
          <div className="h-96 bg-[var(--color-bg-card)] rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 lg:p-8 max-w-6xl">
        <p className="text-sm text-[var(--color-text-muted)]">
          Data unavailable. Run <code className="text-xs bg-[var(--color-bg-card)] px-1 rounded">python3 pipeline/exporters/export_json.py</code> to generate.
        </p>
      </div>
    )
  }

  const fr = data.fleet_records?.[scope] || {}
  const nemFr = data.fleet_records?.['NEM'] || {}
  const dischargeEntries = data.top_discharge?.[scope] || []
  const chargeEntries = data.top_charge?.[scope] || []
  const scopeLabel = SCOPES.find(s => s.id === scope)?.fullLabel || scope
  const accentDischarge = '#10b981'
  const accentCharge = '#8b5cf6'

  // NEM all-time hero stats
  const nemPeakBat = data.top_discharge?.['NEM']?.[0]
  const nemPeakCharge = data.top_charge?.['NEM']?.[0]

  return (
    <div className="p-4 lg:p-8 max-w-6xl space-y-6">
      {/* Page header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] mb-3">
          <Link to="/intelligence" className="hover:text-[var(--color-accent)]">Intelligence</Link>
          <span>/</span>
          <span className="text-[var(--color-text)]">BESS Records Leaderboard</span>
        </nav>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">BESS Records Leaderboard</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          All-time discharge and charge records across {data.total_batteries} grid-scale batteries in the NEM.
          Data from AEMO MMSDM DISPATCHLOAD · {data.data_through ? `Through ${fmtDate(data.data_through)}` : ''}.
        </p>
        <div className="mt-3">
          <DataProvenance sources={['nemweb_dispatchload', 'json_export']} />
        </div>
      </div>

      {/* NEM Hero records — always NEM scope */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
          NEM All-Time Records
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <HeroRecord
            label="Single Battery — Best Discharge Day"
            value={fmt(nemPeakBat?.peak_discharge_mwh)}
            unit="MWh"
            sub={`${nemPeakBat?.name ?? '—'} · ${fmtDate(nemPeakBat?.peak_discharge_date)}`}
            color={accentDischarge}
          />
          <HeroRecord
            label="Single Battery — Best Charge Day"
            value={fmt(nemPeakCharge?.peak_charge_mwh)}
            unit="MWh"
            sub={`${nemPeakCharge?.name ?? '—'} · ${fmtDate(nemPeakCharge?.peak_charge_date)}`}
            color={accentCharge}
          />
          <HeroRecord
            label="Fleet — Peak Discharge Day"
            value={fmt(nemFr.fleet_peak_discharge_day?.value_mwh)}
            unit="MWh"
            sub={`All NEM batteries · ${fmtDate(nemFr.fleet_peak_discharge_day?.date)}`}
            color="#f59e0b"
          />
          {nemFr.peak_5min_discharge_mw ? (
            <HeroRecord
              label="Fleet — Peak 5-min Output"
              value={fmt(nemFr.peak_5min_discharge_mw?.value_mw)}
              unit="MW"
              sub={`${fmtDate(nemFr.peak_5min_discharge_mw?.date)}${nemFr.peak_5min_discharge_mw?.time ? ` · ${fmtTime(nemFr.peak_5min_discharge_mw?.time)}` : ''}`}
              color="#ec4899"
            />
          ) : (
            <HeroRecord
              label="Fleet — Peak Charge Day"
              value={fmt(nemFr.fleet_peak_charge_day?.value_mwh)}
              unit="MWh"
              sub={`All NEM batteries · ${fmtDate(nemFr.fleet_peak_charge_day?.date)}`}
              color={accentCharge}
            />
          )}
        </div>
      </div>

      {/* Scope + tab selectors */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Scope pills */}
        <div className="flex gap-1.5 flex-wrap">
          {SCOPES.map(s => {
            const active = scope === s.id
            const color = REGION_COLOR[s.id] || REGION_COLOR['NEM']
            return (
              <button key={s.id} onClick={() => setScope(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'text-black'
                          : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)]'
                      }`}
                      style={active ? { background: color } : {}}>
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Discharge / Charge tab */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border)] self-start sm:self-auto">
          <button onClick={() => setTab('discharge')}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                    tab === 'discharge'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}>
            ⚡ Discharge
          </button>
          <button onClick={() => setTab('charge')}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-[var(--color-border)] ${
                    tab === 'charge'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  }`}>
            🔋 Charge
          </button>
        </div>
      </div>

      {/* Scope fleet records strip */}
      {(fr.fleet_peak_discharge_day?.value_mwh || fr.peak_5min_discharge_mw?.value_mw) && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-2">
            {scopeLabel} Fleet Records
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6">
            <FleetRecordRow label="Peak fleet discharge day"
              record={fr.fleet_peak_discharge_day} unit="MWh" color={accentDischarge} />
            <FleetRecordRow label="Peak fleet charge day"
              record={fr.fleet_peak_charge_day} unit="MWh" color={accentCharge} />
            <FleetRecordRow label="Peak 5-min discharge"
              record={fr.peak_5min_discharge_mw} unit="MW" color="#f59e0b" />
            <FleetRecordRow label="Peak 5-min charge"
              record={fr.peak_5min_charge_mw} unit="MW" color="#ec4899" />
          </div>
        </div>
      )}

      {/* Main leaderboard */}
      <div>
        {tab === 'discharge' ? (
          <LeaderboardTable
            title={`Top Discharge Days — ${scopeLabel}`}
            icon="⚡"
            unit="MWh"
            entries={dischargeEntries}
            valueKey="peak_discharge_mwh"
            dateKey="peak_discharge_date"
            accentColor={accentDischarge}
            scope={scope}
          />
        ) : (
          <LeaderboardTable
            title={`Top Charge Days — ${scopeLabel}`}
            icon="🔋"
            unit="MWh"
            entries={chargeEntries}
            valueKey="peak_charge_mwh"
            dateKey="peak_charge_date"
            accentColor={accentCharge}
            scope={scope}
          />
        )}
      </div>

      {/* Full battery table — all metrics */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <p className="text-sm font-semibold text-[var(--color-text)]">All Batteries — {scopeLabel}</p>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            Peak single-day discharge and charge records per battery. Data period: MMSDM daily generation.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--color-bg)]/50 border-b border-[var(--color-border)]">
                <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Battery</th>
                <th className="text-center px-2 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Region</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-500">Peak Discharge</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-500 hidden md:table-cell">Date</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-purple-400">Peak Charge</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-purple-400 hidden md:table-cell">Date</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden lg:table-cell">Total Discharge</th>
                <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] hidden lg:table-cell">Days</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {data.batteries
                .filter(b => scope === 'NEM' || b.region === scope)
                .sort((a, b) => (b.peak_discharge_mwh || 0) - (a.peak_discharge_mwh || 0))
                .map((b, i) => {
                  const color = REGION_COLOR[b.region] || '#64748b'
                  return (
                    <tr key={b.duid} className="hover:bg-[var(--color-bg)]/40 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--color-text-muted)] w-4 text-right">{i + 1}</span>
                          <div>
                            <span className="font-medium text-[var(--color-text)]">{b.name}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)] ml-1.5">{b.duid}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${REGION_BG[b.region] || ''}`}>
                          {b.region.replace('1', '')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-semibold" style={{ color }}>{fmt(b.peak_discharge_mwh)}</span>
                        <span className="text-[var(--color-text-muted)] ml-0.5">MWh</span>
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--color-text-muted)] hidden md:table-cell">
                        {fmtDate(b.peak_discharge_date)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span className="font-semibold text-purple-400">{fmt(b.peak_charge_mwh)}</span>
                        <span className="text-[var(--color-text-muted)] ml-0.5">MWh</span>
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--color-text-muted)] hidden md:table-cell">
                        {fmtDate(b.peak_charge_date)}
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--color-text-muted)] hidden lg:table-cell">
                        {fmt(b.total_discharge_mwh)} MWh
                      </td>
                      <td className="px-3 py-2 text-right text-[var(--color-text-muted)] hidden lg:table-cell">
                        {b.days_active}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Methodology note */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg px-4 py-3 text-xs text-[var(--color-text-muted)] leading-relaxed">
        <span className="font-medium text-[var(--color-text)]">Methodology: </span>
        Records are sourced from AEMO NEMWEB MMSDM DISPATCHLOAD data aggregated to daily totals per DUID.
        <span className="font-medium text-[var(--color-text)]"> Discharge MWh</span> = sum of all 5-min generation intervals in a settlement day.
        <span className="font-medium text-[var(--color-text)]"> Charge MWh</span> = sum of all 5-min load intervals.
        Fleet-level 5-min peak records (where shown) are sourced from OpenElectricity API via the BESS Portfolio data pipeline.
        Per-battery 5-min peak records require individual DUID 5-min DISPATCHLOAD extraction — a future enhancement.
        Batteries commissioning mid-year will have lower totals; compare peak single-day records for fairness.
      </div>
    </div>
  )
}
