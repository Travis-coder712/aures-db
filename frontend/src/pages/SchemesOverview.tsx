import { Link } from 'react-router-dom'
import { useSchemeData } from '../hooks/useSchemeData'
import type { CISRound, LTESARound } from '../lib/types'

function RoundCard({ round, scheme }: { round: CISRound | LTESARound; scheme: 'cis' | 'ltesa' }) {
  const isCIS = scheme === 'cis'
  const accentColor = isCIS ? '#f59e0b' : '#8b5cf6'

  return (
    <Link
      to={`/schemes/${scheme}/${round.id}`}
      className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)]/30 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)] leading-tight">
            {round.name}
          </h3>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
            {round.announced_date}
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {isCIS ? (round as CISRound).market : 'NSW'}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-[10px] px-2 py-0.5 rounded-full border"
          style={{ borderColor: `${accentColor}40`, color: accentColor }}
        >
          {round.type === 'generation' ? 'Generation' :
           round.type === 'dispatchable' ? 'Dispatchable' :
           round.type === 'firming' ? 'Firming' :
           round.type === 'lds' ? 'Long Duration Storage' :
           round.type}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ color: accentColor }}>
            {round.total_capacity_mw >= 1000
              ? `${(round.total_capacity_mw / 1000).toFixed(1)} GW`
              : `${Math.round(round.total_capacity_mw)} MW`}
          </span>
          {round.total_storage_mwh && round.total_storage_mwh > 0 && (
            <span>
              {round.total_storage_mwh >= 1000
                ? `${(round.total_storage_mwh / 1000).toFixed(1)} GWh`
                : `${Math.round(round.total_storage_mwh)} MWh`}
            </span>
          )}
        </div>
        <span>{round.num_projects} projects</span>
      </div>
    </Link>
  )
}

function SchemeSummary({ label, color, rounds, totalMW, totalMWh, totalProjects }: {
  label: string
  color: string
  rounds: number
  totalMW: number
  totalMWh: number
  totalProjects: number
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
          <p className="text-lg font-bold" style={{ color }}>
            {totalMW >= 1000 ? `${(totalMW / 1000).toFixed(1)} GW` : `${Math.round(totalMW)} MW`}
          </p>
        </div>
        {totalMWh > 0 && (
          <div>
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase">Storage</p>
            <p className="text-lg font-bold" style={{ color }}>
              {totalMWh >= 1000 ? `${(totalMWh / 1000).toFixed(1)} GWh` : `${Math.round(totalMWh)} MWh`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SchemesOverview() {
  const { cisRounds, ltesaRounds, loading } = useSchemeData()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
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
    <div className="px-4 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-[var(--color-text)] mb-1">
          Government Schemes
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Capacity Investment Scheme (CIS) and NSW Long-term Energy Service Agreements (LTESA)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8">
        <SchemeSummary
          label="Capacity Investment Scheme (CIS)"
          color="#f59e0b"
          rounds={cisRounds.length}
          totalMW={cisTotalMW}
          totalMWh={cisTotalMWh}
          totalProjects={cisTotalProjects}
        />
        <SchemeSummary
          label="NSW LTESA"
          color="#8b5cf6"
          rounds={ltesaRounds.length}
          totalMW={ltesaTotalMW}
          totalMWh={ltesaTotalMWh}
          totalProjects={ltesaTotalProjects}
        />
      </div>

      {/* CIS Rounds */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
          <span className="text-xl">🛡️</span>
          CIS Tender Rounds
        </h2>
        {cisRounds.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No CIS round data loaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {cisRounds.map((round) => (
              <RoundCard key={round.id} round={round} scheme="cis" />
            ))}
          </div>
        )}
      </section>

      {/* LTESA Rounds */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
          <span className="text-xl">📄</span>
          NSW LTESA Rounds
        </h2>
        {ltesaRounds.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No LTESA round data loaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {ltesaRounds.map((round) => (
              <RoundCard key={round.id} round={round} scheme="ltesa" />
            ))}
          </div>
        )}
      </section>

      {/* Explainer */}
      <section className="mb-8">
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
