import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { fetchSchemeTracker } from '../../lib/dataService'
import { useSchemeData } from '../../hooks/useSchemeData'
import type { SchemeTrackerData, SchemeTrackerRound, SchemeTrackerProject, CISRound, LTESARound } from '../../lib/types'
import ScrollableTable from '../../components/common/ScrollableTable'

// ============================================================
// Stage colours & helpers — defined BEFORE const arrays
// ============================================================

const STAGE_CONFIG: Record<string, { label: string; color: string; order: number }> = {
  operating: { label: 'Operating', color: '#22c55e', order: 0 },
  commissioning: { label: 'Commissioning', color: '#a855f7', order: 1 },
  construction: { label: 'Construction', color: '#3b82f6', order: 2 },
  planning_approved: { label: 'Approved', color: '#06b6d4', order: 3 },
  development: { label: 'Development', color: '#f59e0b', order: 4 },
  unknown: { label: 'Unknown', color: '#636e72', order: 5 },
}

function stageColor(stage: string): string {
  return STAGE_CONFIG[stage]?.color ?? '#636e72'
}

function stageLabel(stage: string): string {
  return STAGE_CONFIG[stage]?.label ?? stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatTech(tech: string): string {
  const map: Record<string, string> = {
    bess: 'BESS', vpp: 'VPP', pumped_hydro: 'Pumped Hydro',
    hybrid: 'Hybrid', wind: 'Wind', solar: 'Solar',
  }
  return map[tech] ?? tech.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function fmtMW(mw: number): string {
  return mw >= 1000 ? `${(mw / 1000).toFixed(1)} GW` : `${Math.round(mw)} MW`
}

// ============================================================
// Component
// ============================================================

const TABS = ['overview', 'tracker'] as const
type Tab = typeof TABS[number]
const TAB_LABELS: Record<Tab, string> = { overview: 'Overview', tracker: 'Milestone Tracker' }

export default function SchemeTracker() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [data, setData] = useState<SchemeTrackerData | null>(null)
  const [loading, setLoading] = useState(true)

  // Overview data
  const { cisRounds, ltesaRounds, loading: overviewLoading } = useSchemeData()

  // Multi-select filters
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
  const [selectedRounds, setSelectedRounds] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])

  // Expanded rounds
  const [expandedRounds, setExpandedRounds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchSchemeTracker().then(d => { setData(d ?? null); setLoading(false) })
  }, [])

  // Available filter values
  const allPrograms = useMemo(() => {
    if (!data) return []
    return [...new Set(data.rounds.map(r => r.scheme))].sort()
  }, [data])

  const allStates = useMemo(() => {
    if (!data) return []
    const states = new Set<string>()
    for (const r of data.rounds) {
      for (const s of Object.keys(r.by_state)) states.add(s)
    }
    return [...states].sort()
  }, [data])

  const availableRounds = useMemo(() => {
    if (!data) return []
    let rounds = data.rounds
    if (selectedPrograms.length > 0) {
      rounds = rounds.filter(r => selectedPrograms.includes(r.scheme))
    }
    return rounds.map(r => ({ id: r.id, label: `${r.scheme} ${r.round}` }))
  }, [data, selectedPrograms])

  // Filter rounds
  const filteredRounds = useMemo(() => {
    if (!data) return []
    let rounds = data.rounds

    if (selectedPrograms.length > 0) {
      rounds = rounds.filter(r => selectedPrograms.includes(r.scheme))
    }
    if (selectedRounds.length > 0) {
      rounds = rounds.filter(r => selectedRounds.includes(r.id))
    }

    // For state filtering, filter projects within rounds
    if (selectedStates.length > 0) {
      rounds = rounds.map(r => {
        const filteredProjects = r.projects.filter(p => selectedStates.includes(p.state))
        if (filteredProjects.length === 0) return null
        // Recompute by_stage and by_state for filtered projects
        const byStage: Record<string, number> = {}
        const byState: Record<string, number> = {}
        for (const p of filteredProjects) {
          byStage[p.stage] = (byStage[p.stage] || 0) + 1
          byState[p.state] = (byState[p.state] || 0) + 1
        }
        return {
          ...r,
          projects: filteredProjects,
          num_projects: filteredProjects.length,
          total_capacity_mw: filteredProjects.reduce((s, p) => s + p.capacity_mw, 0),
          total_storage_mwh: filteredProjects.reduce((s, p) => s + (p.storage_mwh || 0), 0),
          by_stage: byStage,
          by_state: byState,
        } as SchemeTrackerRound
      }).filter((r): r is SchemeTrackerRound => r !== null)
    }

    // Sort by announced_date descending (newest first)
    return [...rounds].sort((a, b) => b.announced_date.localeCompare(a.announced_date))
  }, [data, selectedPrograms, selectedRounds, selectedStates])

  // Summary stats from filtered rounds
  const summaryStats = useMemo(() => {
    const stages: Record<string, { count: number; mw: number }> = {}
    for (const r of filteredRounds) {
      for (const p of r.projects) {
        if (!stages[p.stage]) stages[p.stage] = { count: 0, mw: 0 }
        stages[p.stage].count++
        stages[p.stage].mw += p.capacity_mw
      }
    }
    const totalProjects = filteredRounds.reduce((s, r) => s + r.num_projects, 0)
    const totalMW = filteredRounds.reduce((s, r) => s + r.total_capacity_mw, 0)
    return { stages, totalProjects, totalMW }
  }, [filteredRounds])

  // Toggle helpers
  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
  }

  function toggleRound(id: string) {
    setExpandedRounds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const hasFilters = selectedPrograms.length > 0 || selectedRounds.length > 0 || selectedStates.length > 0
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const filterCount = (selectedPrograms.length > 0 ? 1 : 0) + (selectedRounds.length > 0 ? 1 : 0) + (selectedStates.length > 0 ? 1 : 0)

  function renderSchemeFilters() {
    return (
      <div className="space-y-3">
        {/* Program filter */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Program</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {allPrograms.map(prog => {
              const isActive = selectedPrograms.includes(prog)
              const color = prog === 'CIS' ? '#f59e0b' : '#8b5cf6'
              return (
                <button
                  key={prog}
                  onClick={() => setSelectedPrograms(toggle(selectedPrograms, prog))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isActive
                      ? 'border-transparent font-medium'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                  }`}
                  style={isActive ? { backgroundColor: `${color}20`, color } : undefined}
                >
                  {prog}
                </button>
              )
            })}
          </div>
        </div>

        {/* Round filter */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">Round</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {availableRounds.map(r => {
              const isActive = selectedRounds.includes(r.id)
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRounds(toggle(selectedRounds, r.id))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-medium'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                  }`}
                >
                  {r.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* State filter */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">State</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {allStates.map(state => {
              const isActive = selectedStates.includes(state)
              return (
                <button
                  key={state}
                  onClick={() => setSelectedStates(toggle(selectedStates, state))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    isActive
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400 font-medium'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                  }`}
                >
                  {state}
                </button>
              )
            })}
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={() => { setSelectedPrograms([]); setSelectedRounds([]); setSelectedStates([]) }}
            className="text-xs text-blue-400 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }

  // ============================================================
  // Render
  // ============================================================

  if (loading && overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">CIS / LTESA Scheme Intelligence</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Capacity Investment Scheme and NSW Long-term Energy Service Agreements
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <SchemeOverviewTab cisRounds={cisRounds} ltesaRounds={ltesaRounds} loading={overviewLoading} />
      )}

      {/* Tracker Tab */}
      {activeTab === 'tracker' && !data ? (
        <div className="p-6 text-center text-[var(--color-text-muted)]">
          <p>No scheme tracker data available</p>
        </div>
      ) : activeTab === 'tracker' && data && (
        <>

      {/* Mobile filter button */}
      <div className="lg:hidden flex items-center gap-2">
        <button
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filters
          {filterCount > 0 && (
            <span className="bg-[var(--color-primary)] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {filterCount}
            </span>
          )}
        </button>
        {hasFilters && (
          <span className="text-[10px] text-[var(--color-text-muted)]">
            {filteredRounds.length} round{filteredRounds.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      {showMobileFilters && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-50 transition-opacity"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-[var(--color-bg)] border-t border-[var(--color-border)] rounded-t-2xl max-h-[70dvh] overflow-y-auto overscroll-contain animate-slide-up">
            <div className="sticky top-0 bg-[var(--color-bg)] pt-3 pb-2 px-4 border-b border-[var(--color-border)]">
              <div className="w-10 h-1 rounded-full bg-[var(--color-border)] mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-text)]">Filters</span>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                >
                  Done
                </button>
              </div>
            </div>
            <div className="px-4 py-4">
              {renderSchemeFilters()}
            </div>
            <div className="h-6" />
          </div>
        </>
      )}

      {/* Desktop Filters — always visible on lg+ */}
      <div className="hidden lg:block">
        {renderSchemeFilters()}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard
          label="Operating / Commissioning"
          count={(summaryStats.stages['operating']?.count || 0) + (summaryStats.stages['commissioning']?.count || 0)}
          mw={(summaryStats.stages['operating']?.mw || 0) + (summaryStats.stages['commissioning']?.mw || 0)}
          color="#22c55e"
        />
        <SummaryCard
          label="Construction"
          count={summaryStats.stages['construction']?.count || 0}
          mw={summaryStats.stages['construction']?.mw || 0}
          color="#3b82f6"
        />
        <SummaryCard
          label="Development"
          count={(summaryStats.stages['development']?.count || 0) + (summaryStats.stages['planning_approved']?.count || 0) + (summaryStats.stages['unknown']?.count || 0)}
          mw={(summaryStats.stages['development']?.mw || 0) + (summaryStats.stages['planning_approved']?.mw || 0) + (summaryStats.stages['unknown']?.mw || 0)}
          color="#f59e0b"
        />
      </div>

      {/* Outcomes Pie Chart */}
      <OutcomesPieChart rounds={filteredRounds} />

      {/* Round Progress Cards */}
      <div className="space-y-3">
        {filteredRounds.map(round => (
          <RoundProgressCard
            key={round.id}
            round={round}
            expanded={expandedRounds.has(round.id)}
            onToggle={() => toggleRound(round.id)}
          />
        ))}
        {filteredRounds.length === 0 && (
          <div className="p-6 text-center text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl">
            No rounds match the selected filters
          </div>
        )}
      </div>

      {/* Methodology */}
      <details className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <summary className="text-sm font-medium text-[var(--color-text)] cursor-pointer">How milestone tracking works</summary>
        <div className="mt-3 text-xs text-[var(--color-text-muted)] space-y-2">
          <p>This tracker monitors the factual milestone progression of projects awarded through government procurement schemes. Unlike risk scoring which tries to predict failures, milestone tracking shows what has actually happened.</p>
          <p><strong className="text-[var(--color-text)]">What counts as success:</strong> A project reaching <span className="text-blue-400 font-semibold">construction</span> or <span className="text-green-400 font-semibold">operation</span> means it will be built — this is scheme success, even if late.</p>
          <p><strong className="text-[var(--color-text)]">Milestone stages:</strong></p>
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(STAGE_CONFIG).filter(([k]) => k !== 'unknown').map(([key, cfg]) => (
              <span key={key} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}>
                {cfg.label}
              </span>
            ))}
          </div>
          <p className="mt-2">For older rounds where many projects remain in development well after announcement, this may indicate challenges reaching financial close or planning approval — but we avoid speculating on outcomes without sufficient data.</p>
        </div>
      </details>

      {/* Source note */}
      <div className="text-xs text-[var(--color-text-muted)] italic">
        Project status sourced from AEMO, state planning portals, and developer announcements.
        Round data from DCCEEW (CIS) and AEMO Services (LTESA).
      </div>

        </>
      )}
    </div>
  )
}

// ============================================================
// Overview Tab
// ============================================================

function OverviewRoundCard({ round, scheme }: { round: CISRound | LTESARound; scheme: 'cis' | 'ltesa' }) {
  const isCIS = scheme === 'cis'
  const accentColor = isCIS ? '#f59e0b' : '#8b5cf6'

  return (
    <Link
      to={`/schemes/${scheme}/${round.id}`}
      className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight">{round.name}</h3>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{round.announced_date}</p>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
          {isCIS ? (round as CISRound).market : 'NSW'}
        </span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: `${accentColor}40`, color: accentColor }}>
          {round.type === 'generation' ? 'Generation' : round.type === 'dispatchable' ? 'Dispatchable' : round.type === 'firming' ? 'Firming' : round.type === 'lds' ? 'Long Duration Storage' : round.type}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ color: accentColor }}>
            {round.total_capacity_mw >= 1000 ? `${(round.total_capacity_mw / 1000).toFixed(1)} GW` : `${Math.round(round.total_capacity_mw)} MW`}
          </span>
          {round.total_storage_mwh != null && round.total_storage_mwh > 0 && (
            <span>{round.total_storage_mwh >= 1000 ? `${(round.total_storage_mwh / 1000).toFixed(1)} GWh` : `${Math.round(round.total_storage_mwh)} MWh`}</span>
          )}
        </div>
        <span>{round.num_projects} projects</span>
      </div>
    </Link>
  )
}

function OverviewSummary({ label, color, rounds, totalMW, totalMWh, totalProjects }: {
  label: string; color: string; rounds: number; totalMW: number; totalMWh: number; totalProjects: number
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color }}>{label}</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Rounds</p>
          <p className="text-lg font-bold text-[var(--color-text)]">{rounds}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Projects</p>
          <p className="text-lg font-bold text-[var(--color-text)]">{totalProjects}</p>
        </div>
        <div>
          <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Capacity</p>
          <p className="text-lg font-bold" style={{ color }}>{totalMW >= 1000 ? `${(totalMW / 1000).toFixed(1)} GW` : `${Math.round(totalMW)} MW`}</p>
        </div>
        {totalMWh > 0 && (
          <div>
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Storage</p>
            <p className="text-lg font-bold" style={{ color }}>{totalMWh >= 1000 ? `${(totalMWh / 1000).toFixed(1)} GWh` : `${Math.round(totalMWh)} MWh`}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function SchemeOverviewTab({ cisRounds, ltesaRounds, loading }: { cisRounds: CISRound[]; ltesaRounds: LTESARound[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-sm text-[var(--color-text-muted)] animate-pulse">Loading scheme data...</div>
      </div>
    )
  }

  const cisTotalMW = cisRounds.reduce((s, r) => s + r.total_capacity_mw, 0)
  const cisTotalMWh = cisRounds.reduce((s, r) => s + (r.total_storage_mwh ?? 0), 0)
  const cisTotalProjects = cisRounds.reduce((s, r) => s + r.num_projects, 0)
  const ltesaTotalMW = ltesaRounds.reduce((s, r) => s + r.total_capacity_mw, 0)
  const ltesaTotalMWh = ltesaRounds.reduce((s, r) => s + (r.total_storage_mwh ?? 0), 0)
  const ltesaTotalProjects = ltesaRounds.reduce((s, r) => s + r.num_projects, 0)

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <OverviewSummary label="Capacity Investment Scheme (CIS)" color="#f59e0b" rounds={cisRounds.length} totalMW={cisTotalMW} totalMWh={cisTotalMWh} totalProjects={cisTotalProjects} />
        <OverviewSummary label="NSW LTESA" color="#8b5cf6" rounds={ltesaRounds.length} totalMW={ltesaTotalMW} totalMWh={ltesaTotalMWh} totalProjects={ltesaTotalProjects} />
      </div>

      {/* Comparison Table */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          CIS vs LTESA Comparison
        </h2>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 px-4 text-[var(--color-text-muted)] text-xs font-medium"></th>
                <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: '#f59e0b' }}>CIS</th>
                <th className="text-right py-3 px-4 text-xs font-semibold" style={{ color: '#8b5cf6' }}>LTESA</th>
                <th className="text-right py-3 px-4 text-[var(--color-text-muted)] text-xs font-medium">Combined</th>
              </tr>
            </thead>
            <tbody className="text-[var(--color-text)]">
              <tr className="border-b border-[var(--color-border)]/50">
                <td className="py-2.5 px-4 text-xs text-[var(--color-text-muted)]">Scope</td>
                <td className="py-2.5 px-4 text-right text-xs">Federal (NEM + WEM)</td>
                <td className="py-2.5 px-4 text-right text-xs">NSW only</td>
                <td className="py-2.5 px-4 text-right text-xs text-[var(--color-text-muted)]">—</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]/50">
                <td className="py-2.5 px-4 text-xs text-[var(--color-text-muted)]">Rounds</td>
                <td className="py-2.5 px-4 text-right font-medium">{cisRounds.length}</td>
                <td className="py-2.5 px-4 text-right font-medium">{ltesaRounds.length}</td>
                <td className="py-2.5 px-4 text-right font-medium text-[var(--color-text-muted)]">{cisRounds.length + ltesaRounds.length}</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]/50">
                <td className="py-2.5 px-4 text-xs text-[var(--color-text-muted)]">Projects</td>
                <td className="py-2.5 px-4 text-right font-medium">{cisTotalProjects}</td>
                <td className="py-2.5 px-4 text-right font-medium">{ltesaTotalProjects}</td>
                <td className="py-2.5 px-4 text-right font-bold text-[var(--color-primary)]">{cisTotalProjects + ltesaTotalProjects}</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]/50">
                <td className="py-2.5 px-4 text-xs text-[var(--color-text-muted)]">Capacity</td>
                <td className="py-2.5 px-4 text-right font-medium" style={{ color: '#f59e0b' }}>{(cisTotalMW / 1000).toFixed(1)} GW</td>
                <td className="py-2.5 px-4 text-right font-medium" style={{ color: '#8b5cf6' }}>{(ltesaTotalMW / 1000).toFixed(1)} GW</td>
                <td className="py-2.5 px-4 text-right font-bold text-[var(--color-primary)]">{((cisTotalMW + ltesaTotalMW) / 1000).toFixed(1)} GW</td>
              </tr>
              <tr className="border-b border-[var(--color-border)]/50">
                <td className="py-2.5 px-4 text-xs text-[var(--color-text-muted)]">Storage</td>
                <td className="py-2.5 px-4 text-right font-medium" style={{ color: '#f59e0b' }}>{(cisTotalMWh / 1000).toFixed(1)} GWh</td>
                <td className="py-2.5 px-4 text-right font-medium" style={{ color: '#8b5cf6' }}>{(ltesaTotalMWh / 1000).toFixed(1)} GWh</td>
                <td className="py-2.5 px-4 text-right font-bold text-[var(--color-primary)]">{((cisTotalMWh + ltesaTotalMWh) / 1000).toFixed(1)} GWh</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 text-xs text-[var(--color-text-muted)]">Contract type</td>
                <td className="py-2.5 px-4 text-right text-xs">CfD (up to 15yr)</td>
                <td className="py-2.5 px-4 text-right text-xs">CfD gen (20yr) / LDS (14-40yr)</td>
                <td className="py-2.5 px-4 text-right text-xs text-[var(--color-text-muted)]">—</td>
              </tr>
            </tbody>
          </table>
          {/* Visual bar comparison */}
          <div className="px-4 py-3 border-t border-[var(--color-border)]">
            <p className="text-[10px] text-[var(--color-text-muted)] mb-2 uppercase tracking-wider font-medium">Capacity share</p>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div className="transition-all" style={{ width: `${(cisTotalMW / (cisTotalMW + ltesaTotalMW) * 100).toFixed(0)}%`, backgroundColor: '#f59e0b' }} />
              <div className="transition-all" style={{ width: `${(ltesaTotalMW / (cisTotalMW + ltesaTotalMW) * 100).toFixed(0)}%`, backgroundColor: '#8b5cf6' }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: '#f59e0b' }}>CIS {(cisTotalMW / (cisTotalMW + ltesaTotalMW) * 100).toFixed(0)}%</span>
              <span className="text-[10px]" style={{ color: '#8b5cf6' }}>LTESA {(ltesaTotalMW / (cisTotalMW + ltesaTotalMW) * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </section>

      {/* CIS Rounds */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          CIS Tender Rounds
        </h2>
        {cisRounds.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No CIS round data loaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {cisRounds.map(round => <OverviewRoundCard key={round.id} round={round} scheme="cis" />)}
          </div>
        )}
      </section>

      {/* LTESA Rounds */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
          <span className="text-xl">📄</span>
          NSW LTESA Rounds
        </h2>
        {ltesaRounds.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No LTESA round data loaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ltesaRounds.map(round => <OverviewRoundCard key={round.id} round={round} scheme="ltesa" />)}
          </div>
        )}
      </section>

      {/* Explainer */}
      <section>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-2">What are CIS and LTESA?</h3>
          <div className="space-y-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
            <p>
              The <strong className="text-[#f59e0b]">Capacity Investment Scheme (CIS)</strong> is a
              federal underwriting mechanism designed to de-risk investment in new renewable generation
              and dispatchable capacity across the NEM and WEM. Projects bid into competitive tenders
              and receive revenue support contracts.
            </p>
            <p>
              <strong className="text-[#8b5cf6]">Long-term Energy Service Agreements (LTESA)</strong> are
              NSW-specific contracts administered by AEMO Services Limited (ASL) that provide revenue
              certainty for new generation, firming, and long-duration storage projects to support the
              NSW Electricity Infrastructure Roadmap.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

// ============================================================
// Summary Card
// ============================================================

// ============================================================
// Outcomes Pie Chart
// ============================================================

function OutcomesPieChart({ rounds }: { rounds: SchemeTrackerRound[] }) {
  // Aggregate stages across filtered rounds
  const pieData = useMemo(() => {
    const stages: Record<string, { count: number; mw: number }> = {}
    for (const r of rounds) {
      for (const p of r.projects) {
        // Bucket into 3 groups: Operating/Commissioning, Construction, Development
        let bucket: string
        if (p.stage === 'operating' || p.stage === 'commissioning') {
          bucket = 'operating'
        } else if (p.stage === 'construction') {
          bucket = 'construction'
        } else {
          bucket = 'development'
        }
        if (!stages[bucket]) stages[bucket] = { count: 0, mw: 0 }
        stages[bucket].count++
        stages[bucket].mw += p.capacity_mw
      }
    }

    const config: Record<string, { label: string; color: string; order: number }> = {
      operating: { label: 'Operating / Commissioning', color: '#22c55e', order: 0 },
      construction: { label: 'Construction', color: '#3b82f6', order: 1 },
      development: { label: 'Development', color: '#f59e0b', order: 2 },
    }

    return Object.entries(stages)
      .map(([key, val]) => ({
        name: config[key]?.label ?? key,
        count: val.count,
        mw: val.mw,
        color: config[key]?.color ?? '#636e72',
        order: config[key]?.order ?? 99,
      }))
      .sort((a, b) => a.order - b.order)
  }, [rounds])

  const total = pieData.reduce((s, d) => s + d.count, 0)
  if (total === 0) return null

  // Per-round timeline: how many months since announcement and stage breakdown
  const roundTimeline = useMemo(() => {
    return rounds
      .filter(r => r.num_projects > 0)
      .sort((a, b) => a.announced_date.localeCompare(b.announced_date))
      .map(r => {
        const operating = (r.by_stage['operating'] || 0) + (r.by_stage['commissioning'] || 0)
        const construction = r.by_stage['construction'] || 0
        const dev = r.num_projects - operating - construction
        return {
          id: r.id,
          label: `${r.scheme} ${r.round}`,
          months: r.months_since_announced,
          total: r.num_projects,
          operating,
          construction,
          dev,
          progressPct: r.num_projects > 0 ? ((operating + construction) / r.num_projects * 100) : 0,
        }
      })
  }, [rounds])

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
      <h2 className="text-sm font-semibold text-[var(--color-text)] mb-3">Scheme Outcomes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie */}
        <div className="flex flex-col items-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--color-text)' }}
                formatter={(value, name) => {
                  const d = pieData.find(p => p.name === name)
                  return [`${value} projects (${fmtMW(d?.mw ?? 0)})`, name]
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 justify-center mt-1">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {d.name} ({d.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Round timeline bars */}
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-medium mb-2">
            Round progression timeline
          </p>
          {roundTimeline.map(r => (
            <div key={r.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-[var(--color-text)] truncate max-w-[65%]">{r.label}</span>
                <span className="text-[10px] text-[var(--color-text-muted)]">{r.months}mo ago</span>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-[var(--color-bg)]">
                {r.operating > 0 && (
                  <div style={{ width: `${r.operating / r.total * 100}%`, backgroundColor: '#22c55e' }} />
                )}
                {r.construction > 0 && (
                  <div style={{ width: `${r.construction / r.total * 100}%`, backgroundColor: '#3b82f6' }} />
                )}
                {r.dev > 0 && (
                  <div style={{ width: `${r.dev / r.total * 100}%`, backgroundColor: '#f59e0b' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, count, mw, color }: { label: string; count: number; mw: number; color: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-4 border border-[var(--color-border)] text-center">
      <div className="text-3xl md:text-4xl font-bold" style={{ color }}>{count}</div>
      <div className="text-[10px] md:text-xs text-[var(--color-text-muted)] mt-1 font-medium">{label}</div>
      <div className="text-xs font-semibold mt-1" style={{ color }}>{fmtMW(mw)}</div>
    </div>
  )
}

// ============================================================
// Round Progress Card
// ============================================================

function RoundProgressCard({
  round,
  expanded,
  onToggle,
}: {
  round: SchemeTrackerRound
  expanded: boolean
  onToggle: () => void
}) {
  const schemeColor = round.scheme === 'CIS' ? '#f59e0b' : '#8b5cf6'

  // Build stage bar segments sorted by stage order
  const stageSegments = Object.entries(round.by_stage)
    .map(([stage, count]) => ({
      stage,
      count,
      pct: round.num_projects > 0 ? (count / round.num_projects) * 100 : 0,
      color: stageColor(stage),
      order: STAGE_CONFIG[stage]?.order ?? 99,
    }))
    .sort((a, b) => a.order - b.order)

  // State summary string
  const stateStr = Object.entries(round.by_state)
    .sort((a, b) => b[1] - a[1])
    .map(([s, c]) => `${s} ${c}`)
    .join(', ')

  // Flag: old round, many in development
  const devCount = (round.by_stage['development'] || 0) + (round.by_stage['unknown'] || 0)
  const showNote = round.months_since_announced > 18 && devCount > 0

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
      {/* Clickable header */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 hover:bg-[var(--color-bg)]/30 transition-colors"
      >
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight">
              {round.scheme} {round.round}
            </h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              Announced {round.months_since_announced} months ago · {round.announced_date}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${schemeColor}20`, color: schemeColor }}
            >
              {round.type === 'generation' ? 'Generation' :
               round.type === 'dispatchable' ? 'Dispatchable' :
               round.type === 'firming' ? 'Firming' :
               round.type === 'lds' ? 'Long Duration Storage' :
               round.type === 'mixed' ? 'Gen + LDS' : round.type}
            </span>
            <svg
              className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform ${expanded ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex h-3 rounded-full overflow-hidden bg-[var(--color-bg)] mb-2">
          {stageSegments.map(seg => (
            <div
              key={seg.stage}
              className="transition-all"
              style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
              title={`${stageLabel(seg.stage)}: ${seg.count}`}
            />
          ))}
        </div>

        {/* Legend chips */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {stageSegments.map(seg => (
            <span
              key={seg.stage}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${seg.color}20`, color: seg.color }}
            >
              {stageLabel(seg.stage)} {seg.count}
            </span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] flex-wrap">
          <span className="font-medium" style={{ color: schemeColor }}>
            {round.num_projects} projects · {fmtMW(round.total_capacity_mw)}
          </span>
          {round.total_storage_mwh > 0 && (
            <span>
              {round.total_storage_mwh >= 1000
                ? `${(round.total_storage_mwh / 1000).toFixed(1)} GWh`
                : `${Math.round(round.total_storage_mwh)} MWh`} storage
            </span>
          )}
          <span>{stateStr}</span>
        </div>

        {/* Factual note for older rounds */}
        {showNote && (
          <div className="mt-2 text-[10px] text-amber-400/80 flex items-center gap-1">
            <span>⏳</span>
            <span>
              {devCount} project{devCount > 1 ? 's' : ''} still in development {round.months_since_announced} months after announcement
            </span>
          </div>
        )}
      </button>

      {/* Expanded project table */}
      {expanded && (
        <div className="border-t border-[var(--color-border)]">
          <ScrollableTable>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)]">
                  <th className="text-left p-3 text-[var(--color-text-muted)] font-medium text-xs">Project</th>
                  <th className="text-left p-3 text-[var(--color-text-muted)] font-medium text-xs hidden md:table-cell">Developer</th>
                  <th className="text-left p-3 text-[var(--color-text-muted)] font-medium text-xs hidden sm:table-cell">Tech</th>
                  <th className="text-left p-3 text-[var(--color-text-muted)] font-medium text-xs hidden sm:table-cell">State</th>
                  <th className="text-left p-3 text-[var(--color-text-muted)] font-medium text-xs">Stage</th>
                  <th className="text-right p-3 text-[var(--color-text-muted)] font-medium text-xs">MW</th>
                  <th className="text-center p-3 text-[var(--color-text-muted)] font-medium text-xs hidden md:table-cell">FID</th>
                  <th className="text-center p-3 text-[var(--color-text-muted)] font-medium text-xs hidden md:table-cell">Construction</th>
                </tr>
              </thead>
              <tbody>
                {round.projects
                  .sort((a, b) => b.capacity_mw - a.capacity_mw)
                  .map((p, i) => (
                    <ProjectRow key={`${p.name}-${i}`} project={p} />
                  ))}
              </tbody>
            </table>
          </ScrollableTable>
          <div className="px-4 py-3 border-t border-[var(--color-border)]">
            <Link
              to={`/schemes/${round.scheme.toLowerCase()}/${round.id}`}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
            >
              View full round details →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Project Row
// ============================================================

function ProjectRow({ project: p }: { project: SchemeTrackerProject }) {
  const color = stageColor(p.stage)

  return (
    <tr className="border-b border-[var(--color-border)]/50 hover:bg-[var(--color-bg)]/50">
      <td className="p-3">
        {p.project_id ? (
          <Link
            to={`/projects/${p.project_id}?from=intelligence/scheme-tracker&fromLabel=Back to Scheme Intelligence`}
            className="text-blue-400 hover:text-blue-300 text-xs"
          >
            {p.name}
          </Link>
        ) : (
          <span className="text-xs text-[var(--color-text)]">{p.name}</span>
        )}
        <div className="text-[10px] text-[var(--color-text-muted)] md:hidden mt-0.5">{p.developer}</div>
      </td>
      <td className="p-3 text-xs text-[var(--color-text-muted)] hidden md:table-cell">{p.developer}</td>
      <td className="p-3 hidden sm:table-cell">
        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]">
          {formatTech(p.technology)}
        </span>
      </td>
      <td className="p-3 text-xs text-[var(--color-text-muted)] hidden sm:table-cell">{p.state}</td>
      <td className="p-3">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {stageLabel(p.stage)}
        </span>
      </td>
      <td className="p-3 text-right text-xs text-[var(--color-text)]">{p.capacity_mw.toLocaleString()}</td>
      <td className="p-3 text-center text-[10px] text-[var(--color-text-muted)] hidden md:table-cell">
        {p.fid_date ?? '—'}
      </td>
      <td className="p-3 text-center text-[10px] text-[var(--color-text-muted)] hidden md:table-cell">
        {p.construction_start ?? '—'}
      </td>
    </tr>
  )
}
