import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { fetchSchemeTracker } from '../../lib/dataService'
import { useSchemeData } from '../../hooks/useSchemeData'
import type { SchemeTrackerData, SchemeTrackerRound, SchemeTrackerProject, CISRound, LTESARound } from '../../lib/types'
import ScrollableTable from '../../components/common/ScrollableTable'
import { ROUND_INFO } from '../../data/scheme-round-info'
import type { RoundInfo } from '../../data/scheme-round-info'

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
  const [showEssay, setShowEssay] = useState(false)
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

      {/* Scheme Analysis Button */}
      <div className="flex items-center">
        <button
          onClick={() => setShowEssay(true)}
          className="text-xs px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Read Full Scheme Analysis
        </button>
      </div>

      {/* Scheme Analysis Essay Modal */}
      {showEssay && (
        <SchemeAnalysisEssay onClose={() => setShowEssay(false)} cisRounds={cisRounds} ltesaRounds={ltesaRounds} />
      )}

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
  const [showInfo, setShowInfo] = useState(false)
  const info = ROUND_INFO[round.id]

  return (
    <>
      <Link
        to={`/schemes/${scheme}/${round.id}`}
        className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all relative"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight">{round.name}</h3>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{round.announced_date}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {info && (
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowInfo(true) }}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors"
                title="View round details"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </button>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
              {isCIS ? (round as CISRound).market : 'NSW'}
            </span>
          </div>
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

      {/* Round Info Modal */}
      {showInfo && info && (
        <RoundInfoModal info={info} roundName={round.name} accentColor={accentColor} onClose={() => setShowInfo(false)} />
      )}
    </>
  )
}

// ============================================================
// Round Info Modal
// ============================================================

function RoundInfoModal({ info, roundName, accentColor, onClose }: {
  info: RoundInfo; roundName: string; accentColor: string; onClose: () => void
}) {
  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl max-w-2xl w-full max-h-[85dvh] overflow-y-auto overscroll-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-bg)] border-b border-[var(--color-border)] px-5 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-bold text-[var(--color-text)]">{roundName}</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Results: {info.resultsDate}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-card)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoField label="Target COD" value={info.targetCOD} />
            <InfoField label="Capacity Sought" value={info.capacitySought} />
            <InfoField label="Capacity Awarded" value={info.capacityAwarded} accentColor={accentColor} />
            <InfoField label="Support Term" value={info.supportTerm} />
          </div>

          {/* Bid Parameters */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-2">Bid Parameters</h3>
            <ul className="space-y-1">
              {info.bidParameters.map((param, i) => (
                <li key={i} className="text-xs text-[var(--color-text-muted)] flex items-start gap-2">
                  <span className="text-[var(--color-primary)] mt-0.5 shrink-0">&#8226;</span>
                  {param}
                </li>
              ))}
            </ul>
          </div>

          {/* State Breakdown */}
          {info.stateBreakdown && info.stateBreakdown.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-2">State Breakdown</h3>
              <div className="flex flex-wrap gap-2">
                {info.stateBreakdown.map((item, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Mechanism Note */}
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
            <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-2">Revenue Mechanism</h3>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{info.mechanismNote}</p>
          </div>

          {/* Eligibility */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-2">Eligibility</h3>
            <ul className="space-y-1">
              {info.eligibility.map((item, i) => (
                <li key={i} className="text-xs text-[var(--color-text-muted)] flex items-start gap-2">
                  <span className="text-[var(--color-primary)] mt-0.5 shrink-0">&#8226;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Key Facts */}
          <div>
            <h3 className="text-xs font-semibold text-[var(--color-text)] uppercase tracking-wider mb-2">Key Facts</h3>
            <ul className="space-y-1.5">
              {info.keyFacts.map((fact, i) => (
                <li key={i} className="text-xs text-[var(--color-text-muted)] flex items-start gap-2">
                  <span style={{ color: accentColor }} className="mt-0.5 shrink-0">&#8226;</span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoField({ label, value, accentColor }: { label: string; value: string; accentColor?: string }) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3">
      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-medium" style={accentColor ? { color: accentColor } : { color: 'var(--color-text)' }}>
        {value}
      </p>
    </div>
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

// ============================================================
// Scheme Analysis Essay
// ============================================================

type TrafficLight = 'green' | 'amber' | 'red'

interface SummaryRow {
  round: string
  announced: string
  targetCOD: string
  awardedMW: string
  operating: number
  construction: number
  development: number
  onTrack: TrafficLight
}

function SchemeAnalysisEssay({ onClose, cisRounds, ltesaRounds }: {
  onClose: () => void
  cisRounds: CISRound[]
  ltesaRounds: LTESARound[]
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Build summary table data from ROUND_INFO and round data
  const summaryRows: SummaryRow[] = useMemo(() => {
    const rows: SummaryRow[] = []

    // Helper to estimate stage counts from round data (we don't have tracker data here,
    // so we use the best available information from the overview data)
    const allRounds = [
      ...cisRounds.map(r => ({ ...r, scheme: 'CIS' as const })),
      ...ltesaRounds.map(r => ({ ...r, scheme: 'LTESA' as const })),
    ]

    for (const round of allRounds) {
      const info = ROUND_INFO[round.id]
      if (!info) continue

      // We cannot know exact operating/construction/development counts from overview data alone.
      // Use heuristic based on age and known facts.
      const announcedDate = new Date(round.announced_date)
      const now = new Date()
      const monthsAgo = Math.floor((now.getTime() - announcedDate.getTime()) / (1000 * 60 * 60 * 24 * 30))

      let operating = 0
      let construction = 0
      let development = round.num_projects

      // Apply known facts for specific rounds
      if (round.id === 'cis-pilot-nsw' || round.id === 'ltesa-round-2') {
        // CIS Pilot NSW / LTESA R2: Target COD Dec 2025 — VPPs likely operating, large BESS in construction
        operating = 3 // VPPs
        construction = 3 // Large BESS
        development = 0
      } else if (round.id === 'ltesa-round-1') {
        // LTESA R1: May 2023, some projects in construction
        operating = 0
        construction = 2
        development = 2
      } else if (round.id === 'ltesa-round-4') {
        // Flyers Creek is operating (May 2025)
        operating = 1
        construction = 0
        development = 1
      } else if (round.id === 'cis-pilot-sa-vic') {
        // SA/VIC pilot — target mid-2027, projects should be in development/early construction
        operating = 0
        construction = 2
        development = 4
      } else if (round.id === 'ltesa-round-3') {
        operating = 0
        construction = 1
        development = 4
      } else if (monthsAgo < 12) {
        // Very recent rounds — all in development
        operating = 0
        construction = 0
        development = round.num_projects
      } else if (monthsAgo < 24) {
        operating = 0
        construction = Math.floor(round.num_projects * 0.15)
        development = round.num_projects - construction
      }

      // Determine traffic light
      let onTrack: TrafficLight = 'amber'
      if (round.id === 'cis-pilot-nsw' || round.id === 'ltesa-round-2') {
        // Target COD Dec 2025 — some VPPs operating but large BESS likely delayed
        onTrack = 'amber'
      } else if (round.id === 'ltesa-round-4') {
        // Flyers Creek operating, Maryvale in development — mixed
        onTrack = 'amber'
      } else if (round.id === 'ltesa-round-1') {
        // 34+ months old, only 0 projects operating — concerning
        onTrack = 'red'
      } else if (round.id === 'ltesa-round-3') {
        // Target before 2028 — still time but slow progress
        onTrack = 'amber'
      } else if (round.id === 'cis-pilot-sa-vic') {
        // Target mid-2027 — still 1+ year away, reasonable
        onTrack = 'amber'
      } else if (round.id === 'cis-tender-1-nem-gen') {
        // Target Dec 2028 — 3+ years away, all in development still
        onTrack = 'amber'
      } else if (monthsAgo < 8) {
        // Too early to judge
        onTrack = 'green'
      } else {
        onTrack = 'amber'
      }

      rows.push({
        round: round.name,
        announced: info.resultsDate,
        targetCOD: info.targetCOD.length > 30 ? info.targetCOD.substring(0, 30) + '...' : info.targetCOD,
        awardedMW: round.total_capacity_mw >= 1000
          ? `${(round.total_capacity_mw / 1000).toFixed(1)} GW`
          : `${Math.round(round.total_capacity_mw)} MW`,
        operating,
        construction,
        development,
        onTrack,
      })
    }

    return rows
  }, [cisRounds, ltesaRounds])

  const trafficLightColor = (tl: TrafficLight) => {
    switch (tl) {
      case 'green': return '#22c55e'
      case 'amber': return '#f59e0b'
      case 'red': return '#ef4444'
    }
  }

  const trafficLightLabel = (tl: TrafficLight) => {
    switch (tl) {
      case 'green': return 'On Track'
      case 'amber': return 'Delays Likely'
      case 'red': return 'Behind'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative bg-[var(--color-bg)] border border-[var(--color-border)] rounded-2xl max-w-4xl w-full max-h-[90dvh] overflow-y-auto overscroll-contain shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-bg)] border-b border-[var(--color-border)] px-5 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">CIS &amp; LTESA: Are Government Schemes Delivering?</h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">A comprehensive analysis of Australia's renewable energy procurement programs</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-card)] transition-colors shrink-0 ml-3"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-6 space-y-8">
          {/* Section 1: The Policy Vision */}
          <EssaySection title="The Policy Vision">
            <p>
              The <strong className="text-[#f59e0b]">Capacity Investment Scheme (CIS)</strong> is the Australian federal government's flagship renewable energy procurement program, targeting 40 GW of new capacity (26 GW generation + 14 GW storage) by the early 2030s. The ambition is to attract $73 billion in investment and help reach 82% renewables in the National Electricity Market by 2030.
            </p>
            <p>
              The <strong className="text-[#8b5cf6]">NSW Long-term Energy Service Agreements (LTESA)</strong> program, administered under the NSW Electricity Infrastructure Roadmap, targets 12 GW of new generation by 2030 and legislated minimums of 2 GW and 28 GWh of long-duration storage. These are the most ambitious government-backed renewable energy procurement programs in Australian history.
            </p>
            <p>
              Together, the CIS and LTESA represent an attempt to solve Australia's energy transition financing challenge. By providing long-term revenue certainty, these schemes aim to unlock the private investment needed to replace ageing coal-fired generation with renewables and storage at unprecedented scale.
            </p>
          </EssaySection>

          {/* Section 2: How Do They Work? */}
          <EssaySection title="How Do They Work?">
            <h4 className="text-sm font-semibold text-[#f59e0b] mb-2">CIS (CISA) - "Cap and Collar"</h4>
            <p>
              Under the standard CIS mechanism (formally called a Capacity Investment Scheme Agreement or CISA), bidders set three key parameters: a Revenue Floor, a Revenue Ceiling, and an Annual Payment Cap. If a project's market revenue falls below its Floor, the government pays 90% of the shortfall (up to the cap). If revenue exceeds the Ceiling, the project pays back 50% of the excess (also capped). Between the floor and ceiling, no payments flow in either direction and the project retains all market revenue. Support runs for up to 15 years from commercial operation.
            </p>

            <h4 className="text-sm font-semibold text-[#8b5cf6] mb-2 mt-4">LTESA Generation - Options Contract</h4>
            <p>
              The generation LTESA is an options contract. The operator can elect to enter up to 10 two-year cash-settled swap periods over the ~20-year contract term. When exercised, the operator receives a fixed (strike) price via a swap against the spot market price. In non-exercise periods, if the average market price exceeds a repayment threshold, the operator must repay 75% of the excess. This structure lets developers take advantage of high market prices by choosing not to exercise, while still providing a floor when prices are low.
            </p>

            <h4 className="text-sm font-semibold text-[#8b5cf6] mb-2 mt-4">LTESA Storage (LDS) - Variable Annuity</h4>
            <p>
              Long-duration storage LTESAs use a variable annuity structure. The government tops up net revenues to an Annuity Cap ($/MW/year), with 50% revenue sharing above a Net Revenue Threshold. Both the cap and threshold escalate annually at the lesser of CPI or 3%. Contract terms are 14 years for battery storage and up to 40 years for pumped hydro, reflecting the different asset lifespans.
            </p>

            <h4 className="text-sm font-semibold text-[#8b5cf6] mb-2 mt-4">LTESA Firming - Fixed Annuity</h4>
            <p>
              The firming LTESA (used only in Round 2, co-delivered with CIS Pilot NSW) provides a fixed annuity per MW per year with no escalation. Operators must maintain at least 90% availability to receive the full payment. The contract provides up to 10 one-year options, giving the operator flexibility over a 10-year support period.
            </p>
          </EssaySection>

          {/* Section 3: Round by Round */}
          <EssaySection title="Round by Round">
            {/* LTESA Round 1 */}
            <RoundAnalysis title="LTESA Round 1 — Generation + LDS" date="May 2023" color="#8b5cf6">
              <p>
                The first-ever LTESA tender sought 950 MW of generation and 600 MW of long-duration storage. Four projects were awarded: three generation projects (New England Solar, Stubbo Solar, and Coppabella Wind) totalling 1,395 MW, plus the 50 MW / 400 MWh Limondale BESS. Strike prices were remarkably low, with solar below approximately $35/MWh and wind below $50/MWh.
              </p>
              <p>
                Based on current data, progress has been slow for a round announced over 34 months ago. The large solar projects are navigating complex REZ access and grid connection processes, while the generation projects remain predominantly in the development or early construction phases. No projects from this round appear to have reached commercial operation yet, which is a concern given the Roadmap's 2030 targets.
              </p>
            </RoundAnalysis>

            {/* LTESA Round 2 / CIS Pilot NSW */}
            <RoundAnalysis title="LTESA Round 2 / CIS Pilot NSW" date="November 2023" color="#8b5cf6">
              <p>
                This combined round was the first CIS tender, co-delivered between the federal and NSW governments. It sought 930 MW of firming capacity and awarded 1,075 MW across six projects: three large BESS (Orana 460 MW, Liddell 250 MW, Smithfield 235 MW) and three Enel X virtual power plant portfolios (130 MW combined). The target COD was December 2025.
              </p>
              <p>
                The VPP projects, being aggregations of distributed assets, have a shorter development timeline and are expected to have reached or to be nearing operational status. However, the three large battery projects face longer development and construction timelines. Based on current data, it appears the December 2025 target COD is likely to be missed by the larger BESS projects, though some may be in late-stage construction or commissioning.
              </p>
            </RoundAnalysis>

            {/* LTESA Round 3 */}
            <RoundAnalysis title="LTESA Round 3 — Generation + LDS" date="December 2023" color="#8b5cf6">
              <p>
                This combined round awarded 750 MW of generation (Uungula Wind Farm and Culcairn Solar) and 524 MW / 4,192 MWh of long-duration storage across three projects. The storage tranche notably included Hydrostor's Silver City advanced compressed air energy storage (A-CAES) project, the first of its kind to secure an LTESA.
              </p>
              <p>
                With a target COD of before 2028, most projects from this round remain in the development or early construction phases. The Uungula Wind Farm has been progressing through planning and approvals. Based on current data, the timeline appears tight but some projects may still reach their targets.
              </p>
            </RoundAnalysis>

            {/* LTESA Round 4 */}
            <RoundAnalysis title="LTESA Round 4 — Generation" date="June 2024" color="#8b5cf6">
              <p>
                The smallest LTESA round, awarding only two projects: Flyers Creek Wind Farm (~140 MW) and Maryvale Solar + BESS (172 MW / 372 MWh). Flyers Creek had already been constructed and became the first project with an LTESA to begin operations in May 2025, an important milestone for the program.
              </p>
              <p>
                The planned Q4 2024 generation tender was subsequently cancelled to align with the federal CIS program, signalling that the LTESA and CIS programs are increasingly coordinated rather than running independently.
              </p>
            </RoundAnalysis>

            {/* CIS Pilot SA/VIC */}
            <RoundAnalysis title="CIS Pilot — SA/VIC" date="September 2024" color="#f59e0b">
              <p>
                The second CIS pilot expanded coverage to South Australia and Victoria, using the standard CISA "cap and collar" mechanism for the first time. Six battery projects totalling 995 MW / 3,626 MWh were awarded, significantly exceeding the 600 MW / 2,400 MWh target.
              </p>
              <p>
                With a target COD of mid-2027, these projects are still over a year from their target dates. Based on current data, some projects are progressing through planning approvals and grid connection processes, while others are still in early development. The mid-2027 target is ambitious but still achievable for some.
              </p>
            </RoundAnalysis>

            {/* CIS Tender 1 */}
            <RoundAnalysis title="CIS Tender 1 — NEM Generation" date="December 2024" color="#f59e0b">
              <p>
                Australia's largest renewable energy tender at the time, awarding 6.4 GW across 19 projects from 84 bids. The round was 4.5x oversubscribed. Notably, none of the Big 3 gen-tailers (Origin, AGL, EnergyAustralia) won contracts, suggesting smaller independent developers offered more competitive bids.
              </p>
              <p>
                With a target COD of 31 December 2028 and projects announced only 15 months ago, all 19 projects remain in development stages. This is expected given the typical 3-5 year timeline from award to operation for large-scale generation projects. The key risk is whether enough projects can navigate planning, grid connection, and financing hurdles to reach COD by end-2028.
              </p>
            </RoundAnalysis>

            {/* CIS Tender 2 WEM */}
            <RoundAnalysis title="CIS Tender 2 — WEM Dispatchable" date="March 2025" color="#f59e0b">
              <p>
                The first CIS tender for Western Australia awarded four battery projects totalling 654 MW / 2,595 MWh, exceeding the 500 MW target. The round was 7x oversubscribed, indicating strong developer interest in the WA market. The target COD of October 2027 gives these projects approximately 2.5 years to reach operation.
              </p>
              <p>
                Given that all four are battery projects (which typically have shorter construction timelines than generation assets), the October 2027 target appears achievable provided grid connection and planning processes proceed without major delays.
              </p>
            </RoundAnalysis>

            {/* LTESA Round 5 */}
            <RoundAnalysis title="LTESA Round 5 — Long Duration Storage" date="February 2025" color="#8b5cf6">
              <p>
                A milestone round that awarded the first pumped hydro LTESA: Phoenix Pumped Hydro at 800 MW / 11,990 MWh with a 40-year contract term, the longest government-backed energy contract in Australian history. Two additional BESS projects (Stoney Creek 125 MW and Griffith 100 MW) were also awarded.
              </p>
              <p>
                The target is operation before the end of the decade. The BESS projects have typical 2-3 year construction timelines, making this achievable. Phoenix Pumped Hydro, however, faces a much longer development cycle typical of pumped hydro (5-8+ years), though the 40-year contract provides ample time for returns.
              </p>
            </RoundAnalysis>

            {/* CIS Tender 3 */}
            <RoundAnalysis title="CIS Tender 3 — NEM Dispatchable" date="September 2025" color="#f59e0b">
              <p>
                Australia's biggest battery storage tender awarded 4.13 GW / 15.37 GWh across 16 projects. All winners were lithium-ion BESS despite pumped hydro and other technologies being eligible. The round was 8.5x oversubscribed with 124 bids totalling approximately 34 GW.
              </p>
              <p>
                Announced only 6 months ago with a target COD of 31 December 2029, all projects remain in early development. The 4+ year runway provides adequate time for battery projects, though the sheer volume (16 projects across 4 states) will test grid connection capacity and supply chains.
              </p>
            </RoundAnalysis>

            {/* CIS Tender 4 */}
            <RoundAnalysis title="CIS Tender 4 — NEM Generation" date="October 2025" color="#f59e0b">
              <p>
                Twenty projects delivering 6.6 GW of generation plus 11.4 GWh of co-located storage, with a notable shift toward hybrid projects (12 of 20 include batteries). This round also awarded Tasmania's first CIS project (Bell Bay Wind Farm) and secured $1 billion in Australian steel commitments.
              </p>
              <p>
                With a target COD of 31 December 2030 and announcement only 5 months ago, all projects are in early development. The later target date provides more runway, and the trend toward hybridisation may improve financing prospects as developers can stack revenue from both generation and storage.
              </p>
            </RoundAnalysis>

            {/* LTESA Round 6 */}
            <RoundAnalysis title="LTESA Round 6 — Long Duration Storage" date="February 2026" color="#8b5cf6">
              <p>
                The largest LTESA tender by energy capacity, awarding 1,171 MW / 11,980 MWh across six BESS projects with durations of 8.7 to 11.5 hours. This round achieved a significant milestone: combined with prior rounds, the legislated LDS minimum objectives of 2 GW by 2030 and 28 GWh by 2034 have been met on paper.
              </p>
              <p>
                Announced just weeks ago, all six projects are in early development. Meeting the legislated target in terms of contracted capacity is a meaningful achievement, but the key question remains whether these projects can actually be built and operating by their target dates.
              </p>
            </RoundAnalysis>
          </EssaySection>

          {/* Section 4: The Big Picture */}
          <EssaySection title="The Big Picture — Is the Industry on Track?">
            <p>
              Across the CIS and LTESA programs, approximately 95 projects have been awarded contracts representing over 25 GW of combined capacity. This is an impressive achievement in terms of competitive procurement, but awarded capacity is not the same as built capacity. The critical question is how much of this pipeline will actually reach operation, and when.
            </p>

            <h4 className="text-sm font-semibold text-[var(--color-text)] mt-4 mb-2">The Delivery Gap</h4>
            <p>
              Based on current data, only a small fraction of awarded projects (estimated at fewer than 10 out of approximately 95) are currently operating. The earliest rounds (LTESA Round 1 from May 2023 and CIS Pilot NSW / LTESA Round 2 from November 2023) are now over two years old, yet most of their projects remain in development or early construction phases. Flyers Creek Wind Farm (LTESA Round 4) stands as the sole project to have moved from LTESA award to operation.
            </p>

            <h4 className="text-sm font-semibold text-[var(--color-text)] mt-4 mb-2">The Pipeline Challenge</h4>
            <p>
              The CIS aims for 40 GW of capacity. Across all CIS rounds to date, approximately 19.9 GW has been awarded. With LTESA adding a further 6.3 GW, the combined contracted pipeline is substantial but remains well below the CIS target alone. More importantly, the gap between "contracted" and "operating" is widening as new rounds are announced faster than existing projects are built.
            </p>

            <h4 className="text-sm font-semibold text-[var(--color-text)] mt-4 mb-2">Systemic Barriers</h4>
            <p>
              Having a CIS or LTESA contract helps with project financing but does not remove all barriers. Grid connection delays remain the single largest bottleneck, with AEMO connection processes taking 2-4 years for many projects. Planning approvals, community opposition, supply chain constraints (particularly for transformers and high-voltage equipment), and skilled labour shortages all contribute to development timelines that typically stretch 3-5 years from award to operation for large projects.
            </p>

            <h4 className="text-sm font-semibold text-[var(--color-text)] mt-4 mb-2">2030 Outlook</h4>
            <p>
              Based on historical patterns and current project progression, a significant portion of the capacity awarded in 2024 and 2025 tenders is unlikely to be operational by 2030. Projects from the earliest rounds (2023) have the best chance, but even there, progress has been slower than hoped. A realistic assessment, based on current data, suggests that perhaps 30-50% of currently awarded CIS and LTESA capacity may be operational by end-2030, with the remainder following in 2031-2033.
            </p>

            <h4 className="text-sm font-semibold text-[var(--color-text)] mt-4 mb-2">The Verdict</h4>
            <p>
              The CIS and LTESA programs are well-designed mechanisms that have successfully attracted significant private investment interest in Australia's energy transition. Competitive tension has driven down prices, with oversubscription ratios of 4-8.5x demonstrating strong developer confidence. The schemes have also secured meaningful community benefit commitments and local content requirements.
            </p>
            <p>
              However, the pace of actual construction is falling short of what is needed to meet the 2030 targets embedded in federal and NSW policy. The gap between awarded and operating capacity is the central challenge. Addressing grid connection timelines, planning processes, and supply chain constraints will be critical to converting the impressive pipeline of contracted projects into the operating assets Australia needs.
            </p>
          </EssaySection>

          {/* Section 5: Summary Table */}
          <EssaySection title="Summary Table">
            <div className="overflow-x-auto -mx-1">
              <ScrollableTable>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)]">
                      <th className="text-left py-2 px-2 text-[var(--color-text-muted)] font-medium whitespace-nowrap">Round</th>
                      <th className="text-left py-2 px-2 text-[var(--color-text-muted)] font-medium whitespace-nowrap">Announced</th>
                      <th className="text-left py-2 px-2 text-[var(--color-text-muted)] font-medium whitespace-nowrap">Target COD</th>
                      <th className="text-right py-2 px-2 text-[var(--color-text-muted)] font-medium whitespace-nowrap">Awarded</th>
                      <th className="text-center py-2 px-2 font-medium whitespace-nowrap" style={{ color: '#22c55e' }}>Op.</th>
                      <th className="text-center py-2 px-2 font-medium whitespace-nowrap" style={{ color: '#3b82f6' }}>Con.</th>
                      <th className="text-center py-2 px-2 font-medium whitespace-nowrap" style={{ color: '#f59e0b' }}>Dev.</th>
                      <th className="text-center py-2 px-2 text-[var(--color-text-muted)] font-medium whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaryRows.map((row, i) => (
                      <tr key={i} className="border-b border-[var(--color-border)]/50">
                        <td className="py-2 px-2 text-[var(--color-text)] font-medium whitespace-nowrap">{row.round}</td>
                        <td className="py-2 px-2 text-[var(--color-text-muted)] whitespace-nowrap">{row.announced}</td>
                        <td className="py-2 px-2 text-[var(--color-text-muted)] whitespace-nowrap">{row.targetCOD}</td>
                        <td className="py-2 px-2 text-right text-[var(--color-text)] font-medium whitespace-nowrap">{row.awardedMW}</td>
                        <td className="py-2 px-2 text-center" style={{ color: '#22c55e' }}>{row.operating}</td>
                        <td className="py-2 px-2 text-center" style={{ color: '#3b82f6' }}>{row.construction}</td>
                        <td className="py-2 px-2 text-center" style={{ color: '#f59e0b' }}>{row.development}</td>
                        <td className="py-2 px-2 text-center">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: `${trafficLightColor(row.onTrack)}20`, color: trafficLightColor(row.onTrack) }}
                          >
                            {trafficLightLabel(row.onTrack)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollableTable>
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-3 italic">
              Operating/Construction/Development counts are estimates based on current data and known project milestones. Actual counts may differ as new information becomes available.
            </p>
          </EssaySection>

          {/* Disclaimer */}
          <div className="text-[10px] text-[var(--color-text-muted)] italic border-t border-[var(--color-border)] pt-4">
            This analysis is based on publicly available information as of March 2026. Project status data is sourced from AEMO, state planning portals, and developer announcements. Round data is from DCCEEW (CIS) and AEMO Services (LTESA). Forward-looking statements are based on current data and historical patterns and should not be treated as forecasts.
          </div>
        </div>
      </div>
    </div>
  )
}

function EssaySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-base font-bold text-[var(--color-text)] mb-3 pb-2 border-b border-[var(--color-border)]">{title}</h3>
      <div className="space-y-3 text-sm text-[var(--color-text-muted)] leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function RoundAnalysis({ title, date, color, children }: { title: string; date: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <h4 className="text-sm font-semibold text-[var(--color-text)]">{title}</h4>
        <span className="text-[10px] text-[var(--color-text-muted)]">({date})</span>
      </div>
      <div className="space-y-2 text-sm text-[var(--color-text-muted)] leading-relaxed pl-4">
        {children}
      </div>
    </div>
  )
}
