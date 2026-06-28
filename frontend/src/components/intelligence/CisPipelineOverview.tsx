import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { CIS_ROUNDS, CIS_PROJECTS, LTESA_ROUNDS, LTESA_PROJECTS } from '../../data/scheme-rounds'
import type { SchemeContractStatus, SchemeProject } from '../../data/scheme-rounds'

// Icons BEFORE arrays
const FunnelIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
const BarIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
const TableIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>

type ViewId = 'funnel' | 'rounds' | 'table'

const VIEWS: { id: ViewId; label: string; icon: React.ReactNode }[] = [
  { id: 'funnel', label: 'Pipeline Funnel', icon: <FunnelIcon /> },
  { id: 'rounds', label: 'By Round', icon: <BarIcon /> },
  { id: 'table', label: 'Project Table', icon: <TableIcon /> },
]

const STATUS_COLOURS: Record<string, string> = {
  awarded: '#6b7280',
  cisa_signed: '#3b82f6',
  fid: '#8b5cf6',
  construction: '#f59e0b',
  operating: '#10b981',
  withdrawn: '#ef4444',
  terminated: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  awarded: 'Awarded',
  cisa_signed: 'Signed',
  fid: 'FID',
  construction: 'Construction',
  operating: 'Operating',
  withdrawn: 'Withdrawn',
  terminated: 'Terminated',
}

const STATUS_ORDER: SchemeContractStatus[] = ['operating', 'construction', 'fid', 'cisa_signed', 'awarded']

function fmt(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
}

interface FlatProject extends SchemeProject {
  roundId: string
  roundName: string
  scheme: 'CIS' | 'LTESA'
}

function getAllProjects(): FlatProject[] {
  const projects: FlatProject[] = []

  for (const round of CIS_ROUNDS) {
    const roundProjects = CIS_PROJECTS[round.id] || []
    for (const p of roundProjects) {
      projects.push({ ...p, roundId: round.id, roundName: round.name, scheme: 'CIS', contract_status: p.contract_status || 'awarded' })
    }
  }

  for (const round of LTESA_ROUNDS) {
    const roundProjects = LTESA_PROJECTS[round.id] || []
    for (const p of roundProjects) {
      projects.push({ ...p, roundId: round.id, roundName: round.name, scheme: 'LTESA', contract_status: p.contract_status || 'awarded' })
    }
  }

  return projects
}

export default function CisPipelineOverview() {
  const [activeView, setActiveView] = useState<ViewId>('funnel')
  const allProjects = useMemo(getAllProjects, [])

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Total Awarded" value={`${fmt(allProjects.reduce((s, p) => s + p.capacity_mw, 0) / 1000)} GW`} sub={`${allProjects.length} projects`} colour="#6b7280" />
        <KpiCard label="CISA Signed" value="~36%" sub="of awarded MW" colour="#3b82f6" />
        <KpiCard label="At FID" value="~1.8 GW" sub="10% of awarded" colour="#8b5cf6" />
        <KpiCard label="Construction" value="~1.4 GW" sub="batteries leading" colour="#f59e0b" />
        <KpiCard label="Operating" value="~0.3 GW" sub="mostly LTESA legacy" colour="#10b981" />
      </div>

      {/* View toggle */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {VIEWS.map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeView === v.id ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}>
            {v.icon}{v.label}
          </button>
        ))}
      </div>

      {activeView === 'funnel' && <FunnelView projects={allProjects} />}
      {activeView === 'rounds' && <RoundsView projects={allProjects} />}
      {activeView === 'table' && <TableView projects={allProjects} />}
    </div>
  )
}

// ---------- Funnel ----------

function FunnelView({ projects }: { projects: FlatProject[] }) {
  const totalMw = projects.reduce((s, p) => s + p.capacity_mw, 0)

  const stages = STATUS_ORDER.map(status => {
    const matching = projects.filter(p => {
      const s = p.contract_status || 'awarded'
      const idx = STATUS_ORDER.indexOf(s as SchemeContractStatus)
      const targetIdx = STATUS_ORDER.indexOf(status)
      return idx <= targetIdx
    })
    return { status, mw: matching.reduce((s, p) => s + p.capacity_mw, 0), count: matching.length }
  })

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">CIS + LTESA Conversion Funnel</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">
          How much of the awarded capacity has actually progressed? The narrowing funnel shows the delivery gap at each stage.
        </p>

        <div className="space-y-2">
          {stages.map((stage) => {
            const pct = (stage.mw / totalMw) * 100
            const colour = STATUS_COLOURS[stage.status]
            return (
              <div key={stage.status} className="flex items-center gap-3">
                <div className="w-24 text-right shrink-0">
                  <div className="text-xs font-medium" style={{ color: colour }}>{STATUS_LABELS[stage.status]}</div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-8 rounded-md flex items-center px-3 text-xs text-white font-medium whitespace-nowrap"
                    style={{ width: pct < 20 ? 'auto' : `${pct}%`, minWidth: pct < 20 ? undefined : `${Math.max(pct, 8)}%`, background: colour, transition: 'width 0.5s ease' }}>
                    {fmt(stage.mw / 1000)} GW ({stage.count})
                  </div>
                </div>
                <div className="w-12 text-right shrink-0 text-[10px] text-[var(--color-text-muted)]">
                  {Math.round(pct)}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Conversion rates */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          <ConversionCard from="Awarded" to="Signed" rate={36} colour="#3b82f6" />
          <ConversionCard from="Signed" to="FID" rate={28} colour="#8b5cf6" />
          <ConversionCard from="FID" to="Construction" rate={78} colour="#f59e0b" />
          <ConversionCard from="Construction" to="Operating" rate={21} colour="#10b981" />
        </div>
      </div>

      {/* Zero for fifteen callout */}
      <div className="bg-[var(--color-bg-card)] border border-red-500/30 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-red-400 mb-2">Zero for Fifteen</h4>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          No CIS-awarded wind farm has started construction as of March 2026. Only 2 of 39 generation projects have reached construction start.
          Of ~18 GW in successful CIS projects, only ~6.5 GW has signed CISAs (~36%). The scheme is awarding capacity that is not being built.
        </p>
      </div>
    </div>
  )
}

// ---------- Rounds View ----------

function RoundsView({ projects }: { projects: FlatProject[] }) {
  const [drillStatus, setDrillStatus] = useState<string | null>(null)
  const roundIds = [...new Set(projects.map(p => p.roundId))]

  const chartData = roundIds.map(rid => {
    const rProjects = projects.filter(p => p.roundId === rid)
    const byStatus: Record<string, number> = {}
    for (const s of STATUS_ORDER) byStatus[s] = 0
    for (const p of rProjects) {
      const status = (p.contract_status || 'awarded') as string
      byStatus[status] = (byStatus[status] || 0) + p.capacity_mw
    }
    const roundName = rProjects[0]?.roundName || rid
    const shortName = roundName.replace('CIS ', '').replace('LTESA ', 'L').replace('Tender ', 'T').replace('Round ', 'R').replace(' — NEM Dispatchable', ' Disp').replace(' — NEM Generation', ' Gen').replace(' — WEM', ' WEM').replace('Pilot', 'Pilot')
    return { name: shortName, ...byStatus, _total: rProjects.reduce((s, p) => s + p.capacity_mw, 0) }
  })

  const drillProjects = drillStatus
    ? projects.filter(p => (p.contract_status || 'awarded') === drillStatus).sort((a, b) => b.capacity_mw - a.capacity_mw)
    : null

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Capacity by Round — Status Breakdown</h3>
        <p className="text-xs text-[var(--color-text-muted)] mb-4">Click a status in the legend to see all projects with that status.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {STATUS_ORDER.slice().reverse().map(s => {
            const count = projects.filter(p => (p.contract_status || 'awarded') === s).length
            const mw = projects.filter(p => (p.contract_status || 'awarded') === s).reduce((sum, p) => sum + p.capacity_mw, 0)
            return (
              <button key={s} onClick={() => setDrillStatus(drillStatus === s ? null : s)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all border ${
                  drillStatus === s ? 'border-white/30' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
                style={{ background: STATUS_COLOURS[s] + (drillStatus === s ? '30' : '15'), color: STATUS_COLOURS[s] }}>
                <span className="w-2 h-2 rounded-sm" style={{ background: STATUS_COLOURS[s] }} />
                {STATUS_LABELS[s]} ({count} · {fmt(mw / 1000)} GW)
              </button>
            )
          })}
        </div>

        <div className="h-72 lg:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--color-text-muted)' }} angle={-30} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickFormatter={v => `${(Number(v) / 1000).toFixed(1)}`} label={{ value: 'GW', position: 'insideLeft', offset: -5, fontSize: 10, fill: 'var(--color-text-muted)' }} />
              <Tooltip content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 shadow-xl text-xs">
                    <div className="font-medium text-[var(--color-text)] mb-1">{label}</div>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {payload.filter((p: any) => Number(p.value) > 0).map((p: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
                        <span className="text-[var(--color-text-muted)]">{STATUS_LABELS[p.dataKey] || p.dataKey}:</span>
                        <span className="text-[var(--color-text)] font-medium">{fmt(Number(p.value) / 1000)} GW</span>
                      </div>
                    ))}
                  </div>
                )
              }} />
              {STATUS_ORDER.slice().reverse().map(s => (
                <Bar key={s} dataKey={s} name={STATUS_LABELS[s]} stackId="status" fill={STATUS_COLOURS[s]}
                  fillOpacity={drillStatus && drillStatus !== s ? 0.2 : 1}
                  radius={s === 'awarded' ? [3, 3, 0, 0] : undefined} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drill-down panel */}
      {drillProjects && drillStatus && (
        <div className="bg-[var(--color-bg-card)] border rounded-xl p-5" style={{ borderColor: STATUS_COLOURS[drillStatus] + '40' }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: STATUS_COLOURS[drillStatus] }}>
              {STATUS_LABELS[drillStatus]} — {drillProjects.length} projects · {fmt(drillProjects.reduce((s, p) => s + p.capacity_mw, 0) / 1000)} GW
            </h4>
            <button onClick={() => setDrillStatus(null)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">Close</button>
          </div>
          <div className="space-y-2">
            {drillProjects.map((p, i) => (
              <div key={`${p.roundId}-${i}`} className="bg-[var(--color-bg-elevated)] rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {p.project_id ? (
                      <Link to={`/projects/${p.project_id}`} className="text-xs font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors">{p.name}</Link>
                    ) : (
                      <span className="text-xs font-medium text-[var(--color-text)]">{p.name}</span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-bg-card)] text-[var(--color-text-muted)]">{p.scheme}</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--color-text)]">{fmt(p.capacity_mw)} MW</span>
                </div>
                <div className="text-[10px] text-[var(--color-text-muted)]">
                  {p.developer} · {p.state} · {p.technology} · {p.roundName.replace('CIS ', '').replace('LTESA ', '')}
                </div>
                {p.notes && (
                  <div className="text-[10px] text-[var(--color-text-muted)] mt-1 italic leading-relaxed">{p.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------- Table View ----------

function TableView({ projects }: { projects: FlatProject[] }) {
  const [filterScheme, setFilterScheme] = useState<'all' | 'CIS' | 'LTESA'>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterState, setFilterState] = useState<string>('all')
  const [filterTech, setFilterTech] = useState<string>('all')
  const [sortField, setSortField] = useState<'capacity_mw' | 'name' | 'state'>('capacity_mw')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const filtered = useMemo(() => {
    let result = projects
    if (filterScheme !== 'all') result = result.filter(p => p.scheme === filterScheme)
    if (filterStatus !== 'all') result = result.filter(p => (p.contract_status || 'awarded') === filterStatus)
    if (filterState !== 'all') result = result.filter(p => p.state === filterState)
    if (filterTech !== 'all') result = result.filter(p => p.technology === filterTech)
    result.sort((a, b) => {
      const av = sortField === 'capacity_mw' ? a.capacity_mw : sortField === 'name' ? a.name : a.state
      const bv = sortField === 'capacity_mw' ? b.capacity_mw : sortField === 'name' ? b.name : b.state
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'desc' ? bv - av : av - bv
      return sortDir === 'desc' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv))
    })
    return result
  }, [projects, filterScheme, filterStatus, filterState, filterTech, sortField, sortDir])

  const states = [...new Set(projects.map(p => p.state))].sort()
  const techs = [...new Set(projects.map(p => p.technology))].sort()

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterPills label="Scheme" value={filterScheme} options={['all', 'CIS', 'LTESA']} onChange={v => setFilterScheme(v as typeof filterScheme)} />
        <FilterPills label="Status" value={filterStatus} options={['all', ...STATUS_ORDER]} onChange={setFilterStatus} labels={{ all: 'All', ...STATUS_LABELS }} />
        <FilterPills label="State" value={filterState} options={['all', ...states]} onChange={setFilterState} />
        <FilterPills label="Tech" value={filterTech} options={['all', ...techs]} onChange={setFilterTech} />
      </div>

      <div className="text-xs text-[var(--color-text-muted)]">{filtered.length} projects · {fmt(filtered.reduce((s, p) => s + p.capacity_mw, 0) / 1000)} GW</div>

      {/* Table */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium cursor-pointer hover:text-[var(--color-text)]" onClick={() => toggleSort('name')}>Project {sortField === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Developer</th>
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium cursor-pointer hover:text-[var(--color-text)]" onClick={() => toggleSort('capacity_mw')}>MW {sortField === 'capacity_mw' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Tech</th>
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium cursor-pointer hover:text-[var(--color-text)]" onClick={() => toggleSort('state')}>State {sortField === 'state' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</th>
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Round</th>
                <th className="text-left p-3 text-[var(--color-text-muted)] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((p, i) => {
                const status = (p.contract_status || 'awarded') as string
                return (
                  <tr key={`${p.roundId}-${i}`} className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg-elevated)]/50">
                    <td className="p-3 text-[var(--color-text)]">
                      {p.project_id ? <Link to={`/projects/${p.project_id}`} className="hover:text-[var(--color-primary)] transition-colors">{p.name}</Link> : p.name}
                    </td>
                    <td className="p-3 text-[var(--color-text-muted)]">{p.developer}</td>
                    <td className="p-3 text-[var(--color-text)] font-medium">{fmt(p.capacity_mw)}</td>
                    <td className="p-3 text-[var(--color-text-muted)] capitalize">{p.technology}</td>
                    <td className="p-3 text-[var(--color-text-muted)]">{p.state}</td>
                    <td className="p-3 text-[var(--color-text-muted)]">{p.scheme === 'CIS' ? p.roundName.replace('CIS ', '') : p.roundName.replace('LTESA ', '')}</td>
                    <td className="p-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: STATUS_COLOURS[status] + '20', color: STATUS_COLOURS[status] }}>
                        {STATUS_LABELS[status] || status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ---------- Shared ----------

function KpiCard({ label, value, sub, colour }: { label: string; value: string; sub: string; colour: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-3 text-center">
      <div className="text-[10px] text-[var(--color-text-muted)]">{label}</div>
      <div className="text-lg font-bold" style={{ color: colour }}>{value}</div>
      <div className="text-[10px] text-[var(--color-text-muted)]">{sub}</div>
    </div>
  )
}

function ConversionCard({ from, to, rate, colour }: { from: string; to: string; rate: number; colour: string }) {
  return (
    <div className="bg-[var(--color-bg-elevated)] rounded-lg p-3 text-center">
      <div className="text-[10px] text-[var(--color-text-muted)]">{from} → {to}</div>
      <div className="text-lg font-bold" style={{ color: colour }}>{rate}%</div>
    </div>
  )
}

function FilterPills({ label, value, options, onChange, labels }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; labels?: Record<string, string>
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-[var(--color-text-muted)] mr-1">{label}:</span>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            value === o ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}>
          {labels?.[o] || (o === 'all' ? 'All' : o.charAt(0).toUpperCase() + o.slice(1))}
        </button>
      ))}
    </div>
  )
}
