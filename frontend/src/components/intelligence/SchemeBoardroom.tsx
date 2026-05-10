/**
 * SchemeBoardroom — full-screen briefing view of CIS + LTESA scheme intelligence.
 *
 * Mirrors the PowerPoint export but designed for on-screen presentation in
 * AURES dark mode. Sticky anchor nav lets you jump between sections; each
 * section is a generous-padding card optimised for projection.
 */
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { SchemeTrackerData, SchemeTrackerRound, SchemeTrackerProject } from '../../lib/types'

// ============================================================
// Bucket logic — mirrors exportSchemePpt
// ============================================================

const LIKELY_FAILED_THRESHOLD = 14

type Bucket = 'delivering' | 'building' | 'developing' | 'at_risk' | 'unknown'

function bucket(p: SchemeTrackerProject, monthsSinceAnnounced: number): Bucket {
  const stage = p.stage as string
  if (stage === 'operating' || stage === 'commissioning') return 'delivering'
  if (stage === 'construction') return 'building'
  if (monthsSinceAnnounced > LIKELY_FAILED_THRESHOLD) {
    const ds = (p.dev_status || '').toLowerCase()
    if (ds.includes('fid') || ds.includes('construction')) return 'building'
    return 'at_risk'
  }
  return 'developing'
}

// Display formatting
const fmtMW = (v: number | null | undefined) =>
  v == null ? '–' : v >= 1000 ? `${(v / 1000).toFixed(2)} GW` : `${Math.round(v)} MW`
const fmtMWh = (v: number | null | undefined) =>
  v == null || v === 0 ? '–' : v >= 1000 ? `${(v / 1000).toFixed(1)} GWh` : `${Math.round(v)} MWh`
const fmtDate = (s: string | null | undefined) => {
  if (!s) return '–'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
}

// AURES palette (dark theme, but values match the design system tokens)
const COLORS = {
  cis:    '#3b82f6',
  ltesa:  '#a855f7',
  green:  '#22c55e',
  amber:  '#f59e0b',
  blue:   '#3b82f6',
  red:    '#ef4444',
}

// ============================================================
// Top-level component
// ============================================================

interface Props {
  data: SchemeTrackerData
}

const SECTIONS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'cis-rounds',   label: 'CIS Rounds' },
  { id: 'ltesa-rounds', label: 'LTESA Rounds' },
  { id: 'outcomes',     label: 'Outcomes' },
  { id: 'tech',         label: 'By Technology' },
  { id: 'funnel',       label: 'CIS Funnel' },
  { id: 'nsw-cis',      label: 'NSW Wind / CIS' },
  { id: 'nsw-ltesa',    label: 'NSW Wind / LTESA' },
  { id: 'senate',       label: 'Senate & Press' },
  { id: 'outlook',      label: 'Outlook' },
] as const

export default function SchemeBoardroom({ data }: Props) {
  const cisRounds = useMemo(() => data.rounds.filter(r => r.scheme === 'CIS'), [data])
  const ltesaRounds = useMemo(() => data.rounds.filter(r => r.scheme === 'LTESA'), [data])

  return (
    <div className="space-y-8">
      {/* Sticky anchor nav */}
      <nav className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-[var(--color-bg)]/90 backdrop-blur border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mr-2 whitespace-nowrap">
            Jump to
          </span>
          {SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              className="text-xs px-3 py-1.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-primary)] whitespace-nowrap transition-colors">
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Hero / Overview */}
      <Section id="overview" title="Schemes Overview"
        intro="Combined Capacity Investment Scheme (CIS) and NSW Long-Term Energy Service Agreements (LTESA) award status — every awarded round, every project, every dollar of underwriting committed.">
        <HeroOverview data={data} cisRounds={cisRounds} ltesaRounds={ltesaRounds} />
      </Section>

      {/* CIS rounds */}
      <Section id="cis-rounds" title="CIS Rounds — Awarded & Delivering"
        intro={`${cisRounds.length} CIS rounds awarded to date — including the new WA Tenders 5 + 6 awarded 2 May 2026. "Likely failed" = past ${LIKELY_FAILED_THRESHOLD} months since announcement without confirmed CISA execution.`}
        accent={COLORS.cis}>
        <RoundsTable rounds={cisRounds} accent={COLORS.cis} />
      </Section>

      {/* LTESA rounds */}
      <Section id="ltesa-rounds" title="LTESA Rounds — NSW Underwriting"
        intro={`${ltesaRounds.length} LTESA rounds across generation, firming, and long-duration storage. NSW EnergyCo as Consumer Trustee.`}
        accent={COLORS.ltesa}>
        <RoundsTable rounds={ltesaRounds} accent={COLORS.ltesa} />
      </Section>

      {/* Outcomes */}
      <Section id="outcomes" title="Outcomes Snapshot"
        intro={`Delivery progress across all CIS + LTESA rounds. The middle ground (under construction + still in development) is where contract execution decisions over the next 6 months will determine outcomes.`}>
        <OutcomesPanel data={data} />
      </Section>

      {/* Technology breakdown */}
      <Section id="tech" title="Awarded Capacity by Technology"
        intro="Each scheme split into wind / solar / BESS / hybrid — and the share of awards that have reached construction or operation in each technology.">
        <TechBreakdownPanel data={data} />
      </Section>

      {/* Funnel */}
      <Section id="funnel" title="CIS Pipeline Funnel"
        intro="Every CIS project that has been awarded under a CISA, traced through the development pipeline. Each step shows conversion %.">
        <FunnelPanel data={data} />
      </Section>

      {/* NSW Wind in CIS */}
      <Section id="nsw-cis" title="NSW Wind in CIS"
        intro="Every NSW wind project awarded under CIS, with curated planning approval dates from NSW IPC and DPE."
        accent={COLORS.cis}>
        <NswWindPanel data={data} scheme="CIS" />
      </Section>

      {/* NSW Wind in LTESA */}
      <Section id="nsw-ltesa" title="NSW Wind in LTESA"
        intro="Every NSW wind project awarded under LTESA."
        accent={COLORS.ltesa}>
        <NswWindPanel data={data} scheme="LTESA" />
      </Section>

      {/* Senate Estimates & Press */}
      <Section id="senate" title="Senate Estimates, Recent Press & Public Pressure"
        intro="What's been said publicly about CIS execution, project finance progress, and political pressure on Minister Bowen — drawn from Senate Estimates testimony, regulator commentary, and recent industry press.">
        <SenatePanel />
      </Section>

      {/* Outlook */}
      <Section id="outlook" title="AURES Outlook — Next 6 Months Critical"
        intro="What to watch from now into late 2026: when CIS execution becomes contractually overdue and what flips from 'developing' to 'likely failed'.">
        <OutlookPanel data={data} />
      </Section>

      <p className="text-[10px] text-[var(--color-text-muted)] text-center pt-4 pb-8 border-t border-[var(--color-border)]">
        Data: AEMO Generation Information · DCCEEW CIS tender results · AEMO Services LTESA results · FNCEN Commitment Tracker · Senate Estimates testimony · Industry press as cited.
        <br/>
        Generated by AURES Intelligence — content matches the &ldquo;Export to PowerPoint&rdquo; deck on this page.
      </p>
    </div>
  )
}

// ============================================================
// Section wrapper
// ============================================================

function Section({ id, title, intro, accent, children }: {
  id: string; title: string; intro: string; accent?: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          {accent && <span className="w-1.5 h-7 rounded-full" style={{ backgroundColor: accent }} />}
          <h2 className="text-2xl font-bold text-[var(--color-text)] tracking-tight">{title}</h2>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-5xl">{intro}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

// ============================================================
// Hero overview
// ============================================================

function HeroOverview({ data, cisRounds, ltesaRounds }: {
  data: SchemeTrackerData; cisRounds: SchemeTrackerRound[]; ltesaRounds: SchemeTrackerRound[]
}) {
  const sumMW = (rs: SchemeTrackerRound[]) => rs.reduce((a, r) => a + r.total_capacity_mw, 0)
  const sumProj = (rs: SchemeTrackerRound[]) => rs.reduce((a, r) => a + r.num_projects, 0)
  const sumMWh = (rs: SchemeTrackerRound[]) => rs.reduce((a, r) => a + (r.total_storage_mwh || 0), 0)

  const cisStats = { rounds: cisRounds.length, projects: sumProj(cisRounds), mw: sumMW(cisRounds), mwh: sumMWh(cisRounds) }
  const ltesaStats = { rounds: ltesaRounds.length, projects: sumProj(ltesaRounds), mw: sumMW(ltesaRounds), mwh: sumMWh(ltesaRounds) }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <SchemeCard
        accent={COLORS.cis}
        title="CAPACITY INVESTMENT SCHEME"
        blurb="Federal underwriting (CISA) for new generation and dispatchable storage across NEM and WEM. Competitive merit-based tenders."
        stats={cisStats}
      />
      <SchemeCard
        accent={COLORS.ltesa}
        title="NSW LTESA"
        blurb="NSW Government underwriting via the Electricity Infrastructure Investment Act 2020. Targets generation, firming, and long-duration storage."
        stats={ltesaStats}
      />

      {/* Combined headline */}
      <div className="md:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Combined</p>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl font-bold text-[var(--color-text)]">{data.summary.total_projects}</span>
          <span className="text-sm text-[var(--color-text-muted)]">projects</span>
          <span className="text-3xl font-bold text-[var(--color-text)]">{(data.summary.total_mw / 1000).toFixed(1)} GW</span>
          <span className="text-sm text-[var(--color-text-muted)]">capacity</span>
          <span className="text-3xl font-bold text-[var(--color-text)]">{cisStats.rounds + ltesaStats.rounds}</span>
          <span className="text-sm text-[var(--color-text-muted)]">rounds</span>
        </div>
      </div>
    </div>
  )
}

function SchemeCard({ accent, title, blurb, stats }: {
  accent: string; title: string; blurb: string
  stats: { rounds: number; projects: number; mw: number; mwh: number }
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: accent }} />
      <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>{title}</p>
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed mb-5 max-w-md">{blurb}</p>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Rounds awarded" value={`${stats.rounds}`} />
        <Stat label="Projects awarded" value={`${stats.projects}`} />
        <Stat label="Total capacity" value={fmtMW(stats.mw)} />
        <Stat label="Total storage" value={fmtMWh(stats.mwh)} />
      </div>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]/80">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color: color || 'var(--color-text)' }}>{value}</p>
    </div>
  )
}

// ============================================================
// Rounds table (with totals)
// ============================================================

function RoundsTable({ rounds, accent }: { rounds: SchemeTrackerRound[]; accent: string }) {
  const totals = useMemo(() => {
    const out = { projects: 0, mw: 0, delivering: 0, building: 0, developing: 0, at_risk: 0 }
    for (const r of rounds) {
      out.projects += r.num_projects
      out.mw += r.total_capacity_mw
      for (const p of r.projects) {
        const b = bucket(p, r.months_since_announced)
        if (b !== 'unknown') out[b] += 1
      }
    }
    return out
  }, [rounds])

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ backgroundColor: accent }}>
            {['Round', 'Announced', '# Proj', 'Capacity', 'Delivering', 'Building', 'Developing', 'At Risk'].map((h, i) => (
              <th key={h} className={`px-3 py-2.5 text-white text-xs font-semibold ${(i === 0 || i === 1) ? 'text-left' : 'text-right'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map(r => {
            const b = { delivering: 0, building: 0, developing: 0, at_risk: 0 }
            for (const p of r.projects) {
              const bk = bucket(p, r.months_since_announced)
              if (bk !== 'unknown') b[bk] += 1
            }
            return (
              <tr key={r.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]/40">
                <td className="px-3 py-2 font-medium text-[var(--color-text)]">{r.round}</td>
                <td className="px-3 py-2 text-[var(--color-text-muted)] text-xs">{fmtDate(r.announced_date)}</td>
                <td className="px-3 py-2 text-right text-[var(--color-text)]">{r.num_projects}</td>
                <td className="px-3 py-2 text-right text-[var(--color-text)]">{fmtMW(r.total_capacity_mw)}</td>
                <td className="px-3 py-2 text-right" style={{ color: b.delivering ? COLORS.green : 'var(--color-text-muted)' }}>{b.delivering || '–'}</td>
                <td className="px-3 py-2 text-right" style={{ color: b.building   ? COLORS.amber : 'var(--color-text-muted)' }}>{b.building   || '–'}</td>
                <td className="px-3 py-2 text-right" style={{ color: b.developing ? COLORS.blue  : 'var(--color-text-muted)' }}>{b.developing || '–'}</td>
                <td className="px-3 py-2 text-right" style={{ color: b.at_risk    ? COLORS.red   : 'var(--color-text-muted)' }}>{b.at_risk    || '–'}</td>
              </tr>
            )
          })}
          <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-bg-elevated)] font-semibold">
            <td className="px-3 py-2.5 text-[var(--color-text)]">TOTAL</td>
            <td />
            <td className="px-3 py-2.5 text-right text-[var(--color-text)]">{totals.projects}</td>
            <td className="px-3 py-2.5 text-right text-[var(--color-text)]">{fmtMW(totals.mw)}</td>
            <td className="px-3 py-2.5 text-right" style={{ color: COLORS.green }}>{totals.delivering}</td>
            <td className="px-3 py-2.5 text-right" style={{ color: COLORS.amber }}>{totals.building}</td>
            <td className="px-3 py-2.5 text-right" style={{ color: COLORS.blue }}>{totals.developing}</td>
            <td className="px-3 py-2.5 text-right" style={{ color: COLORS.red }}>{totals.at_risk}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Outcomes panel
// ============================================================

function OutcomesPanel({ data }: { data: SchemeTrackerData }) {
  const stats = useMemo(() => {
    const counts = { delivering: 0, building: 0, developing: 0, at_risk: 0 }
    const mw = { delivering: 0, building: 0, developing: 0, at_risk: 0 }
    for (const r of data.rounds) {
      for (const p of r.projects) {
        const b = bucket(p, r.months_since_announced)
        if (b !== 'unknown') {
          counts[b] += 1
          mw[b] += p.capacity_mw || 0
        }
      }
    }
    return { counts, mw }
  }, [data])

  const totalProj = stats.counts.delivering + stats.counts.building + stats.counts.developing + stats.counts.at_risk
  const totalMw = stats.mw.delivering + stats.mw.building + stats.mw.developing + stats.mw.at_risk

  const cards = [
    { label: 'Delivering',    sub: 'Operating or commissioning', n: stats.counts.delivering, mw: stats.mw.delivering, color: COLORS.green },
    { label: 'Under Construction', sub: 'Site works underway',   n: stats.counts.building,   mw: stats.mw.building,    color: COLORS.amber },
    { label: 'In Development', sub: `≤${LIKELY_FAILED_THRESHOLD} months since award`, n: stats.counts.developing, mw: stats.mw.developing, color: COLORS.blue },
    { label: 'Likely Failed', sub: `>${LIKELY_FAILED_THRESHOLD} months without CISA`, n: stats.counts.at_risk, mw: stats.mw.at_risk, color: COLORS.red },
  ]

  const deliveringPct = (stats.mw.delivering / Math.max(totalMw, 1)) * 100
  const atRiskPct = (stats.mw.at_risk / Math.max(totalMw, 1)) * 100

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: c.color }} />
            <p className="text-[11px] font-bold uppercase tracking-wider mt-1" style={{ color: c.color }}>{c.label}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-[var(--color-text)]">{c.n}</span>
              <span className="text-xs text-[var(--color-text-muted)]">projects</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">{fmtMW(c.mw)} · {((c.n / Math.max(totalProj, 1)) * 100).toFixed(0)}% of #</p>
            <p className="text-[10px] text-[var(--color-text-muted)]/80 mt-1 italic">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Share-of-capacity bar */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Share of awarded capacity (by MW)</p>
        <div className="flex h-10 rounded-lg overflow-hidden border border-[var(--color-border)]">
          {cards.map(c => {
            const w = (c.mw / Math.max(totalMw, 1)) * 100
            if (w < 0.5) return null
            return (
              <div key={c.label} title={`${c.label}: ${fmtMW(c.mw)} (${w.toFixed(0)}%)`}
                className="flex items-center justify-center text-xs font-semibold text-white"
                style={{ width: `${w}%`, backgroundColor: c.color }}>
                {w >= 8 ? `${w.toFixed(0)}%` : ''}
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] border-l-4 rounded-xl p-4" style={{ borderLeftColor: COLORS.green }}>
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          <span className="font-semibold text-[var(--color-text)]">Headline read: </span>
          <span style={{ color: COLORS.green, fontWeight: 600 }}>{deliveringPct.toFixed(0)}%</span> of awarded capacity is operating or commissioning.{' '}
          <span style={{ color: COLORS.red, fontWeight: 600 }}>{atRiskPct.toFixed(0)}%</span> sits in the &ldquo;likely failed&rdquo; bucket — past the {LIKELY_FAILED_THRESHOLD}-month threshold without confirmed CISA execution. The middle ground is where contract execution decisions over the next 6 months will determine outcomes.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Tech breakdown panel
// ============================================================

function TechBreakdownPanel({ data }: { data: SchemeTrackerData }) {
  const techLabel: Record<string, string> = {
    wind: 'Wind', solar: 'Solar', bess: 'BESS', hybrid: 'Hybrid', pumped_hydro: 'Pumped Hydro',
  }
  const techColor: Record<string, string> = {
    wind: '#3b82f6', solar: '#f59e0b', bess: '#10b981', hybrid: '#ec4899', pumped_hydro: '#8b5cf6',
    other: '#64748b',
  }

  type Agg = { count: number; mw: number; delivering: number; building: number; mwDelivering: number; mwBuilding: number }
  const aggregate = (scheme: 'CIS' | 'LTESA') => {
    const out: Record<string, Agg> = {}
    for (const r of data.rounds) {
      if (r.scheme !== scheme) continue
      for (const p of r.projects) {
        const tech = (p.technology || 'other').toLowerCase()
        const a = out[tech] ??= { count: 0, mw: 0, delivering: 0, building: 0, mwDelivering: 0, mwBuilding: 0 }
        a.count += 1
        a.mw += p.capacity_mw || 0
        const b = bucket(p, r.months_since_announced)
        if (b === 'delivering') { a.delivering += 1; a.mwDelivering += p.capacity_mw }
        if (b === 'building') { a.building += 1; a.mwBuilding += p.capacity_mw }
      }
    }
    return Object.entries(out).sort((a, b) => b[1].mw - a[1].mw)
  }

  const renderBlock = (label: string, accent: string, rows: ReturnType<typeof aggregate>) => {
    const totals = rows.reduce((acc, [, a]) => ({
      count: acc.count + a.count,
      mw: acc.mw + a.mw,
      successCount: acc.successCount + a.delivering + a.building,
      successMw: acc.successMw + a.mwDelivering + a.mwBuilding,
    }), { count: 0, mw: 0, successCount: 0, successMw: 0 })
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 text-white font-semibold text-sm" style={{ backgroundColor: accent }}>{label}</div>
        {rows.length === 0 ? (
          <p className="p-4 text-sm text-[var(--color-text-muted)] italic">No awards yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="px-3 py-2 text-left">Tech</th>
                <th className="px-3 py-2 text-right">#</th>
                <th className="px-3 py-2 text-right">Capacity</th>
                <th className="px-3 py-2 text-right">Delivering / Building</th>
                <th className="px-3 py-2 text-right">Success rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([tech, a]) => {
                const successCount = a.delivering + a.building
                const successMw = a.mwDelivering + a.mwBuilding
                const successPct = a.count > 0 ? (successCount / a.count) * 100 : 0
                const successMwPct = a.mw > 0 ? (successMw / a.mw) * 100 : 0
                const rateColor = successPct >= 50 ? COLORS.green : successPct >= 20 ? COLORS.amber : COLORS.red
                return (
                  <tr key={tech} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg)]/40">
                    <td className="px-3 py-2 font-semibold" style={{ color: techColor[tech] || techColor.other }}>{techLabel[tech] || tech}</td>
                    <td className="px-3 py-2 text-right text-[var(--color-text)]">{a.count}</td>
                    <td className="px-3 py-2 text-right text-[var(--color-text)]">{fmtMW(a.mw)}</td>
                    <td className="px-3 py-2 text-right" style={{ color: successCount ? COLORS.green : 'var(--color-text-muted)' }}>
                      {successCount} · {fmtMW(successMw)}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold" style={{ color: rateColor }}>
                      {successPct.toFixed(0)}% · {successMwPct.toFixed(0)}%
                    </td>
                  </tr>
                )
              })}
              <tr className="bg-[var(--color-bg-elevated)] font-semibold">
                <td className="px-3 py-2.5 text-[var(--color-text)]">TOTAL</td>
                <td className="px-3 py-2.5 text-right text-[var(--color-text)]">{totals.count}</td>
                <td className="px-3 py-2.5 text-right text-[var(--color-text)]">{fmtMW(totals.mw)}</td>
                <td className="px-3 py-2.5 text-right" style={{ color: COLORS.green }}>{totals.successCount} · {fmtMW(totals.successMw)}</td>
                <td className="px-3 py-2.5 text-right text-[var(--color-text)]">
                  {totals.count ? `${((totals.successCount / totals.count) * 100).toFixed(0)}%` : '–'} ·{' '}
                  {totals.mw ? `${((totals.successMw / totals.mw) * 100).toFixed(0)}%` : '–'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {renderBlock('CIS', COLORS.cis, aggregate('CIS'))}
      {renderBlock('LTESA', COLORS.ltesa, aggregate('LTESA'))}
    </div>
  )
}

// ============================================================
// Funnel panel
// ============================================================

function FunnelPanel({ data }: { data: SchemeTrackerData }) {
  const cisProjects = useMemo(() =>
    data.rounds.filter(r => r.scheme === 'CIS').flatMap(r => r.projects.map(p => ({ p, r }))),
    [data]
  )

  const stage1 = cisProjects
  const stage2 = cisProjects.filter(({ p }) =>
    ['operating', 'commissioning', 'construction'].includes(p.stage as string) ||
    (p.dev_status || '').toLowerCase().includes('fid') ||
    (p.planning_approval_date != null && p.planning_approval_date !== '')
  )
  const stage3 = cisProjects.filter(({ p }) =>
    ['operating', 'commissioning', 'construction'].includes(p.stage as string) ||
    (p.dev_status || '').toLowerCase().includes('fid')
  )
  const stage4 = cisProjects.filter(({ p }) =>
    ['operating', 'commissioning'].includes(p.stage as string)
  )
  const atRisk = cisProjects.filter(({ p, r }) => bucket(p, r.months_since_announced) === 'at_risk')

  const stages = [
    { label: 'Awarded under a CISA',                  list: stage1, color: COLORS.cis },
    { label: 'Past planning / FID gate',              list: stage2, color: COLORS.blue },
    { label: 'Reached financial close or construction', list: stage3, color: COLORS.amber },
    { label: 'Operating or commissioning',            list: stage4, color: COLORS.green },
  ]

  const totalCount = stage1.length
  const totalMw = stage1.reduce((a, { p }) => a + p.capacity_mw, 0)
  const e2eByCount = totalCount > 0 ? (stage4.length / totalCount) * 100 : 0
  const e2eByMw = totalMw > 0 ? (stage4.reduce((a, { p }) => a + p.capacity_mw, 0) / totalMw) * 100 : 0
  const atRiskMw = atRisk.reduce((a, { p }) => a + (p.capacity_mw || 0), 0)

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Funnel — 2 cols */}
      <div className="lg:col-span-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <div className="space-y-2">
          {stages.map((s, i) => {
            const count = s.list.length
            const mw = s.list.reduce((a, { p }) => a + (p.capacity_mw || 0), 0)
            const widthPct = 100 - (i * 18)   // tapers down for funnel effect
            const prev = i > 0 ? stages[i - 1] : null
            const conversionByCount = prev ? Math.round((count / Math.max(prev.list.length, 1)) * 100) : 100
            const prevMw = prev ? prev.list.reduce((a, { p }) => a + (p.capacity_mw || 0), 0) : totalMw
            const conversionByMw = prev ? Math.round((mw / Math.max(prevMw, 1)) * 100) : 100
            return (
              <div key={s.label} className="flex items-center gap-3">
                <div className="flex-1 flex justify-center">
                  <div className="rounded-lg flex flex-col items-center justify-center px-4 py-3 text-white shadow-md transition-all"
                    style={{ width: `${widthPct}%`, backgroundColor: s.color, minHeight: 70 }}>
                    <p className="text-sm font-semibold leading-tight text-center">{s.label}</p>
                    <p className="text-xs mt-1 opacity-90">{count} projects · {fmtMW(mw)}</p>
                  </div>
                </div>
                <div className="w-32 text-xs text-[var(--color-text-muted)]">
                  {prev ? (
                    <>
                      <p className="font-semibold" style={{ color: s.color }}>↓ {conversionByCount}% by #</p>
                      <p className="text-[10px]">{conversionByMw}% by MW</p>
                    </>
                  ) : (
                    <p className="text-[10px] italic">Top of funnel</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Right column callouts */}
      <div className="space-y-3">
        <div className="bg-[var(--color-bg-card)] border-l-4 rounded-xl p-4" style={{ borderLeftColor: COLORS.green }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">End-to-end conversion</p>
          <p className="text-3xl font-bold mt-1" style={{ color: COLORS.green }}>{e2eByCount.toFixed(0)}%</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">awarded → operating or commissioning · {e2eByMw.toFixed(0)}% by MW</p>
        </div>
        <div className="bg-[var(--color-bg-card)] border-l-4 rounded-xl p-4" style={{ borderLeftColor: COLORS.red }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">At risk</p>
          <p className="text-3xl font-bold mt-1" style={{ color: COLORS.red }}>{atRisk.length}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{fmtMW(atRiskMw)} past the {LIKELY_FAILED_THRESHOLD}-month threshold</p>
        </div>
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Top of funnel</p>
          <p className="text-3xl font-bold mt-1 text-[var(--color-text)]">{totalCount}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">CIS projects awarded · {fmtMW(totalMw)}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// NSW Wind panel
// ============================================================

function NswWindPanel({ data, scheme }: { data: SchemeTrackerData; scheme: 'CIS' | 'LTESA' }) {
  const rows = useMemo(() => {
    const out: { round: string; project: SchemeTrackerProject; monthsSince: number }[] = []
    for (const r of data.rounds) {
      if (r.scheme !== scheme) continue
      for (const p of r.projects) {
        if (p.technology === 'wind' && p.state === 'NSW') {
          out.push({ round: r.round, project: p, monthsSince: r.months_since_announced })
        }
      }
    }
    return out
  }, [data, scheme])

  if (rows.length === 0) {
    return <p className="bg-[var(--color-bg-card)] border border-dashed border-[var(--color-border)] rounded-xl p-8 text-center text-sm text-[var(--color-text-muted)]">No NSW wind projects in {scheme}.</p>
  }

  const accent = scheme === 'CIS' ? COLORS.cis : COLORS.ltesa
  const totalMw = rows.reduce((a, x) => a + x.project.capacity_mw, 0)
  const buckets = { delivering: 0, building: 0, developing: 0, at_risk: 0 }
  let mwDelivering = 0
  for (const { project: p, monthsSince } of rows) {
    const b = bucket(p, monthsSince)
    if (b !== 'unknown') buckets[b] += 1
    if (b === 'delivering') mwDelivering += p.capacity_mw
  }

  const stageColor = (stage: string) =>
    stage === 'operating' || stage === 'commissioning' ? COLORS.green :
    stage === 'construction' ? COLORS.amber :
    stage === 'development' ? COLORS.blue : 'var(--color-text-muted)'

  const fmtPlanning = (p: SchemeTrackerProject) => {
    if (p.planning_approval_date) {
      const auth = p.planning_authority ? ` · ${p.planning_authority}` : ''
      return { text: fmtDate(p.planning_approval_date) + auth, kind: 'approved' as const }
    }
    if (p.planning_approval_date === null && p.planning_authority) {
      return { text: 'Pending — ' + p.planning_authority, kind: 'pending' as const }
    }
    return { text: '— not in dataset', kind: 'unknown' as const }
  }

  return (
    <div className="space-y-3">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: accent }}>
              {['Project', 'Round', 'MW', 'Stage', 'Dev Status', 'Planning Approval', 'Months'].map((h, i) => (
                <th key={h} className={`px-3 py-2.5 text-white text-xs font-semibold ${i === 2 || i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ round, project: p, monthsSince }) => {
              const planning = fmtPlanning(p)
              return (
                <tr key={`${round}-${p.name}`} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg)]/40">
                  <td className="px-3 py-2.5">
                    {p.project_id ? (
                      <Link to={`/projects/${p.project_id}`} className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)]">{p.name}</Link>
                    ) : (
                      <span className="font-semibold text-[var(--color-text)]">{p.name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[var(--color-text-muted)] text-xs">{round}</td>
                  <td className="px-3 py-2.5 text-right text-[var(--color-text)]">{fmtMW(p.capacity_mw)}</td>
                  <td className="px-3 py-2.5 text-xs font-semibold" style={{ color: stageColor(p.stage) }}>{p.stage}</td>
                  <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)] italic">{p.dev_status || '–'}</td>
                  <td className="px-3 py-2.5 text-xs"
                    style={{ color: planning.kind === 'approved' ? 'var(--color-text)' : planning.kind === 'pending' ? COLORS.amber : 'var(--color-text-muted)' }}>
                    {planning.text}
                  </td>
                  <td className={`px-3 py-2.5 text-right text-xs font-semibold`}
                    style={{ color: monthsSince > LIKELY_FAILED_THRESHOLD ? COLORS.red : 'var(--color-text-muted)' }}>
                    {monthsSince}
                  </td>
                </tr>
              )
            })}
            <tr className="bg-[var(--color-bg-elevated)] font-semibold">
              <td className="px-3 py-2.5 text-[var(--color-text)]">TOTAL</td>
              <td className="px-3 py-2.5 text-xs text-[var(--color-text-muted)]">{rows.length} projects</td>
              <td className="px-3 py-2.5 text-right text-[var(--color-text)]">{fmtMW(totalMw)}</td>
              <td colSpan={4} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Status callout */}
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
        <span className="font-semibold text-[var(--color-text)]">NSW wind under {scheme}: </span>
        {rows.length} projects, {fmtMW(totalMw)} total.{' '}
        {buckets.delivering > 0 && <span style={{ color: COLORS.green, fontWeight: 600 }}>{buckets.delivering} delivering ({fmtMW(mwDelivering)})</span>}
        {buckets.delivering > 0 && (buckets.building > 0 || buckets.developing > 0) && ', '}
        {buckets.building > 0 && <span style={{ color: COLORS.amber, fontWeight: 600 }}>{buckets.building} under construction</span>}
        {buckets.building > 0 && buckets.developing > 0 && ', '}
        {buckets.developing > 0 && <span style={{ color: COLORS.blue }}>{buckets.developing} in development</span>}
        {buckets.at_risk > 0 && <span>, <span style={{ color: COLORS.red, fontWeight: 600 }}>{buckets.at_risk} at risk of failure</span></span>}
        .
      </p>

      {/* Caveat for planning approval */}
      <p className="text-xs italic text-[var(--color-text-muted)]/80 leading-relaxed">
        <span className="font-semibold" style={{ color: COLORS.amber }}>Source: </span>
        Planning approval dates curated from NSW IPC, NSW Department of Planning &amp; Environment, and the NSW Planning Portal as of May 2026. Coverage is currently limited to NSW wind/CIS — broader project coverage is a follow-up enrichment task.
      </p>
    </div>
  )
}

// ============================================================
// Senate Estimates / press panel — NEW
// ============================================================

function SenatePanel() {
  return (
    <div className="space-y-4">
      {/* Top bar — recent context blocks */}
      <div className="grid md:grid-cols-3 gap-3">
        <ContextCard
          accent={COLORS.red}
          tag="Clean Energy Regulator"
          headline="Only half of CIS Tender 1 winners have made visible progress"
          body="The Clean Energy Regulator confirmed in its September 2025 quarterly that most CIS Tender 1 projects are taking longer than expected to reach financial close. Wind continues to struggle — no wind projects reached FID in 2025."
          source="reneweconomy.com.au"
          url="https://reneweconomy.com.au/regulator-says-cis-tender-1-projects-are-taking-longer-to-land-finance-only-half-have-made-progress/"
        />
        <ContextCard
          accent={COLORS.amber}
          tag="DCCEEW reform"
          headline="Bowen streamlines CIS tender to single-stage to compress timeline"
          body={`Single-stage tender process replaces the previous two-stage process — finalisation cut from ~9 months to ~6. Time limits introduced for CISA execution; Commonwealth may discontinue negotiations if missed. Used for Tenders 5 & 6 (WA).`}
          source="DCCEEW"
          url="https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme/changes-to-future-tender-process"
        />
        <ContextCard
          accent={COLORS.cis}
          tag="Q1 2026 NEM update"
          headline="Renewables hit 47% of NEM, batteries set price 32% of intervals"
          body="Most recent Quarterly Energy Dynamics from AEMO confirmed batteries are now the most frequent price-setting technology in the NEM — the structural backdrop in which CIS dispatchable rounds are being executed."
          source="DCCEEW"
          url="https://minister.dcceew.gov.au/bowen/media-releases/record-renewable-generation-drives-down-australias-emissions"
        />
      </div>

      {/* Senate Estimates excerpt */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full grid place-items-center text-base font-bold text-white"
            style={{ backgroundColor: COLORS.ltesa }}>SE</span>
          <h3 className="text-base font-bold text-[var(--color-text)]">Senate Estimates testimony — what was said</h3>
        </div>

        <ul className="space-y-2.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
          <li>
            <span className="font-semibold text-[var(--color-text)]">~9 projects had reached financial close </span>
            among CIS Tender 1 winners with executed CISAs (Apr 2026 Senate Environment &amp; Communications Estimates — Ms Alison Wiltshire, Branch Head, CIS Delivery &amp; Governance, DCCEEW).
          </li>
          <li>
            <span className="font-semibold text-[var(--color-text)]">CIS deliberately targets early-stage projects</span> (Mr Brine, DCCEEW): &ldquo;If they&rsquo;re at financial close, they probably don&rsquo;t need a lot of support from the federal government.&rdquo; — explanation for why fewer T1 projects are at FID than analysts initially expected.
          </li>
          <li>
            <span className="font-semibold text-[var(--color-text)]">Most signed projects expected to reach financial close in calendar year 2026 </span>
            — confirmed timeline, places ~mid-2026 onward as the inflection point for CIS Tender 1 execution outcomes.
          </li>
          <li>
            <span className="font-semibold text-[var(--color-text)]">CISA proponents have 20 days to lodge a project bond </span>
            after signing; failure to deliver can result in bond forfeiture and re-tendering.
          </li>
        </ul>

        <p className="text-[10px] text-[var(--color-text-muted)]/70 italic pt-2 border-t border-[var(--color-border)]">
          Source: Senate Standing Committee on Environment &amp; Communications, Budget Estimates, April 2026 — DCCEEW evidence.
        </p>
      </div>

      {/* Bowen-pressure block */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full grid place-items-center text-base font-bold text-white"
            style={{ backgroundColor: COLORS.amber }}>P</span>
          <h3 className="text-base font-bold text-[var(--color-text)]">Press &amp; pressure on Minister Bowen</h3>
        </div>
        <ul className="space-y-2.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
          <li>
            <span className="font-semibold text-[var(--color-text)]">Eraring extension</span> — Origin extended Eraring to August 2027 in May 2024 under an <em>opt-in underwriting arrangement with the NSW Government</em>: Origin can elect each year (by 31 March) to share up to $40M of profits with NSW or claim up to 80% of losses, capped at $225M/year. Origin chose <em>not</em> to opt in for both 2025-26 and 2026-27, so no taxpayer money has flowed to date — but the underwriting backstop exists and its monetary impact in any future year remains unknown. In Jan 2026 Origin further extended operations to April 2029. Centre for Independent Studies framed the broader sequence as &ldquo;Bowen&rsquo;s credibility gap on renewables.&rdquo; The political risk: if CIS Tender 1 wind doesn&rsquo;t deliver on schedule, NSW retains coal longer than the 82% target assumes.
          </li>
          <li>
            <span className="font-semibold text-[var(--color-text)]">First Nations Clean Energy Network — &ldquo;From Commitment to Delivery&rdquo;</span> tracker has become an external proxy for which CISA projects are actually executing. The 20-business-day publication clock after CISA signature means sustained absence is a strong negative signal.
          </li>
          <li>
            <span className="font-semibold text-[var(--color-text)]">Bowen&rsquo;s framing</span>: &ldquo;The best thing we can do for energy prices is more renewables&rdquo; — but with only Mokoan operating and Goulburn River in construction from CIS Tender 1 (as of Q1 2026), the proof points are still concentrated in solar rather than wind.
          </li>
          <li>
            <span className="font-semibold text-[var(--color-text)]">AEMC 2025 forecast</span> projects a 5% dip in retail prices over five years before a 13% rise as more coal exits — central to the political contest about whether the CIS is delivering &ldquo;cheap reliable&rdquo; or &ldquo;expensive transition&rdquo;.
          </li>
        </ul>
      </div>

      {/* Watch list — projects positioning for FID */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full grid place-items-center text-base font-bold text-white"
            style={{ backgroundColor: COLORS.green }}>F</span>
          <h3 className="text-base font-bold text-[var(--color-text)]">Watch list — CIS Tender 1 projects progressing or positioning for FID in 2026</h3>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">From the 19 CIS Tender 1 awards (Dec 2024), these are the projects publicly identified by AER and industry reporting as already in construction, operating, or closest to reaching FID. The South Australian wind projects (Goyder North, Palmer) have been flagged as the most likely first wind FIDs.</p>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {[
            { name: 'Mokoan Solar Farm',      desc: '46 MW solar · VIC · first T1 project operating, first to LGC approval' },
            { name: 'Goulburn River Solar',   desc: '450 MW solar · NSW · in construction' },
            { name: 'Goyder North Wind Farm', desc: '300 MW wind · SA · expected first wind FID under T1' },
            { name: 'Palmer Wind Farm',       desc: '274 MW wind · SA · approaching FID' },
            { name: 'Valley of the Winds',    desc: '936 MW wind · NSW · NSW IPC planning approval Jun 2025; awaiting grid connection' },
            { name: 'Sandy Creek Solar',      desc: '700 MW solar · NSW · largest NSW solar in T1' },
          ].map(p => (
            <div key={p.name} className="flex items-start gap-2 p-2.5 rounded-lg border border-[var(--color-border)]">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: COLORS.green }} />
              <div>
                <p className="font-semibold text-[var(--color-text)]">{p.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)]/70 italic">
          Sources: <a href="https://reneweconomy.com.au/regulator-says-cis-tender-1-projects-are-taking-longer-to-land-finance-only-half-have-made-progress/" target="_blank" rel="noopener" className="hover:underline">RenewEconomy AER analysis</a> ·
          {' '}<a href="https://reneweconomy.com.au/south-australia-wind-projects-to-be-first-cis-winners-to-reach-financial-close-victoria-says-no-to-more-solar-hybrids/" target="_blank" rel="noopener" className="hover:underline">RenewEconomy SA wind first</a>.
          Note: earlier-flagged projects like Pottinger Wind Farm (NSW) and Fortescue East Pilbara are also positioning for FID in 2026 but were <em>not</em> awarded under CIS Tender 1.
        </p>
      </div>
    </div>
  )
}

function ContextCard({ accent, tag, headline, body, source, url }: {
  accent: string; tag: string; headline: string; body: string; source: string; url: string
}) {
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accent }} />
      <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: accent }}>{tag}</p>
      <h4 className="text-sm font-semibold text-[var(--color-text)] mt-1.5 leading-snug">{headline}</h4>
      <p className="text-xs text-[var(--color-text-muted)] mt-2 leading-relaxed">{body}</p>
      <a href={url} target="_blank" rel="noopener" className="text-[10px] text-[var(--color-text-muted)]/80 hover:text-[var(--color-primary)] mt-2 inline-block">
        Source: {source} ↗
      </a>
    </div>
  )
}

// ============================================================
// Outlook panel
// ============================================================

function OutlookPanel({ data }: { data: SchemeTrackerData }) {
  const cisT1 = data.rounds.find(r => r.scheme === 'CIS' && r.round.includes('Tender 1'))
  const cisT3 = data.rounds.find(r => r.scheme === 'CIS' && r.round.includes('Tender 3'))
  const cisT4 = data.rounds.find(r => r.scheme === 'CIS' && r.round.includes('Tender 4'))
  const cisT5 = data.rounds.find(r => r.scheme === 'CIS' && r.round.includes('Tender 5'))

  const t1Months = cisT1?.months_since_announced ?? 0
  const t3Months = cisT3?.months_since_announced ?? 0
  const t4Months = cisT4?.months_since_announced ?? 0

  const t1AtRisk = cisT1 ? cisT1.projects.filter(p => bucket(p, t1Months) === 'at_risk').length : 0

  const milestones: { color: string; title: string; date: string; body: string }[] = []

  if (cisT1) {
    milestones.push({
      color: t1Months > LIKELY_FAILED_THRESHOLD ? COLORS.red : COLORS.amber,
      title: 'CIS Tender 1 — already past the AURES "likely failed" threshold',
      date: t1Months > LIKELY_FAILED_THRESHOLD ? 'Past threshold' : `Crosses ${LIKELY_FAILED_THRESHOLD}m`,
      body: `${cisT1.num_projects} projects awarded ${fmtDate(cisT1.announced_date)} (${t1Months} months ago, beyond the ${LIKELY_FAILED_THRESHOLD}-month threshold). Of these, ${t1AtRisk} sit in the "likely failed" bucket today (no CISA execution confirmed). Watch the next 6 months for CISA executions or contract terminations.`,
    })
  }
  if (cisT3) {
    const remaining = LIKELY_FAILED_THRESHOLD - t3Months
    milestones.push({
      color: remaining > 0 ? COLORS.amber : COLORS.red,
      title: `CIS Tender 3 — ${remaining > 0 ? `${remaining} months until threshold` : 'past threshold'}`,
      date: remaining > 0 ? `${remaining} months` : 'Past threshold',
      body: `${cisT3.num_projects} projects awarded ${fmtDate(cisT3.announced_date)} (${t3Months} months ago). Standard CISA execution targets ~12 months; expect a wave of execution announcements through mid-2026.`,
    })
  }
  if (cisT4) {
    milestones.push({
      color: COLORS.blue,
      title: 'CIS Tender 4 — first execution window opens',
      date: `${Math.max(12 - t4Months, 0)} months`,
      body: `${cisT4.num_projects} projects awarded ${fmtDate(cisT4.announced_date)} (${t4Months} months ago). First CISA executions expected from ~12 months from award; first FNCEN tracker publications should appear from mid-2026.`,
    })
  }
  milestones.push({
    color: COLORS.cis,
    title: `WA CIS Tenders 5 + 6 — ${cisT5 ? `awarded ${fmtDate(cisT5.announced_date)}` : 'just awarded'}`,
    date: '12-month watch',
    body: 'Tenders 5 (WEM Generation) and 6 (WEM Dispatchable) award the first major capacity injection ahead of WA\'s coal exit by 2030 — 10 projects, ~1.9 GW renewables + 3.7 GWh storage. Watch CISA execution timelines (~9–12 months) and which projects break ground first.',
  })
  milestones.push({
    color: COLORS.red,
    title: 'NSW grid connection — the key constraint on Tenders 1 + 4',
    date: 'Ongoing',
    body: 'All 5 NSW wind projects in the CIS pipeline (Valley of the Winds, Spicers Creek, Thunderbolt, Dinawan Stage 1, Liverpool Range Stage 1) sit at "grid connection pending" — most have planning approval but await NSW EnergyCo access rights. The next 6 months are decisive for whether these reach FID.',
  })

  return (
    <div className="space-y-2.5">
      {milestones.map((m, i) => (
        <div key={i} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 flex gap-4 hover:bg-[var(--color-bg)]/40 transition-colors">
          <div className="w-1.5 rounded-full self-stretch" style={{ backgroundColor: m.color }} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h4 className="text-base font-semibold text-[var(--color-text)]">{m.title}</h4>
              <span className="text-xs font-semibold whitespace-nowrap" style={{ color: m.color }}>{m.date}</span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] mt-1.5 leading-relaxed">{m.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
