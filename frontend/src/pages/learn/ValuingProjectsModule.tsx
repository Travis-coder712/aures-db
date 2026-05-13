/**
 * Valuing Renewable Projects — Top-Quartile Analysis — AURES Learning Module
 *
 * 14-lesson framework for assessing the quality of a renewable energy
 * project — operational or in-development — against fundamentals, leading
 * to a top-quartile score per technology cohort.
 *
 * Part A (lessons 1-6, v2.95.0): operational valuation
 *   1. The asset-manager's job — why operational valuation is distinct
 *   2. What data you actually need (Australian context)
 *   3. Operational metrics that matter — by technology
 *   4. Peer comparison — defining "top quartile" for operating assets
 *   5. Forward valuation from operational data
 *   6. Presenting it — boardroom-ready outputs
 *
 * Part B (lessons 7-12, v2.96.0): development-stage valuation
 * Part C (lessons 13-14, v2.97.0): scoring framework + interactive tool
 */
import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-valuing-projects-progress'

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return new Set(JSON.parse(raw))
  } catch { /* ignore */ }
  return new Set()
}

function saveProgress(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

// ============================================================
// Lesson metadata
// ============================================================

interface LessonMeta {
  id: string
  number: number
  title: string
  subtitle: string
  readingTime: string
  built: boolean
}

const LESSONS: LessonMeta[] = [
  // Part A — Operational valuation (v2.95.0)
  { id: 'asset-manager-job',  number: 1, title: "The asset-manager's job — why operational valuation is distinct", subtitle: 'Lifecycle stages, use cases, and how operational valuation differs from development', readingTime: '11 min', built: true },
  { id: 'data-layer',         number: 2, title: 'What data you actually need (Australian context)',                 subtitle: 'AEMO MMSDM, OpenElectricity, AER, ASIC, NEM Connection Register — what is reliable, what is gappy', readingTime: '13 min', built: true },
  { id: 'metrics-by-tech',    number: 3, title: 'Operational metrics that matter — by technology',                  subtitle: 'Wind, solar, BESS, hybrid — the metric stack for each',                                           readingTime: '14 min', built: true },
  { id: 'peer-comparison',    number: 4, title: 'Peer comparison — defining "top quartile" for operating assets',   subtitle: 'Cohort construction, vintage adjustment, deserves-vs-achieves',                                  readingTime: '12 min', built: true },
  { id: 'forward-valuation',  number: 5, title: 'Forward valuation from operational data',                          subtitle: 'Capture-price trajectory, MLF degradation, value-factor convergence, the discount rate',         readingTime: '13 min', built: true },
  { id: 'presenting',         number: 6, title: 'Presenting it — boardroom-ready outputs',                          subtitle: 'Scorecards, pros/cons, peer comparison, the AURES Wind Value Analysis as worked example',        readingTime: '11 min', built: true },
  // Part B — Development valuation (v2.96.0)
  { id: 'dev-stages',         number: 7, title: 'Stages of a renewable project — typical $/MW step-ups',            subtitle: 'From land-tied-up through FID to COD — value at each milestone',                                  readingTime: '12 min', built: false },
  { id: 'fundamentals',       number: 8, title: 'The five fundamental categories that drive value',                 subtitle: 'Resource, connection, offtake, developer, constructability + community',                          readingTime: '11 min', built: false },
  { id: 'resource-quality',   number: 9, title: 'Resource quality — the foundational fundamental',                  subtitle: 'Wind/solar/BESS — what data exists, what you must estimate',                                      readingTime: '13 min', built: false },
  { id: 'connection',        number: 10, title: 'Connection quality — the value-killer category',                   subtitle: 'MLF history, future-congestion, DNSP vs TNSP, curtailment — interactive tool',                  readingTime: '14 min', built: false },
  { id: 'other-fundamentals', number: 11, title: 'Constructability, community, offtake, developer',                  subtitle: 'The four softer categories — how to weight them with limited data',                              readingTime: '12 min', built: false },
  { id: 'scoring-framework', number: 12, title: 'The scoring framework — weights, anchors, quartile output',         subtitle: 'The unified 25/25/20/15/15 rubric',                                                              readingTime: '11 min', built: false },
  // Part C — Synthesis (v2.97.0)
  { id: 'interactive-tool',  number: 13, title: 'The interactive valuation tool',                                    subtitle: 'Apply the framework to any operational or development project',                                  readingTime: '10 min', built: false },
  { id: 'future-shifts',     number: 14, title: 'How this changes — ESEM, 24/7 CFE, data centre surge',              subtitle: 'Forward-looking adjustments to the framework',                                                    readingTime: '10 min', built: false },
]

// ============================================================
// Shared UI primitives
// ============================================================

function Callout({ type, children }: { type: 'info' | 'warn' | 'key' | 'numbers' | 'source'; children: React.ReactNode }) {
  const styles = {
    info:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    label: 'Note' },
    warn:    { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   label: 'Important' },
    key:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Key Concept' },
    numbers: { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  text: 'text-purple-400',  label: 'Worked example' },
    source:  { bg: 'bg-slate-800/40',   border: 'border-slate-600/40',   text: 'text-slate-300',   label: 'Sources' },
  }
  const s = styles[type]
  return (
    <div className={`${s.bg} border ${s.border} rounded-xl p-4 my-4`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${s.text} mb-2`}>{s.label}</p>
      <div className="text-sm text-[var(--color-text)] leading-relaxed">{children}</div>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[var(--color-text)] mt-8 mb-3 flex items-center gap-2">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[var(--color-text)] mt-5 mb-2">{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-3">{children}</p>
}

function Em({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--color-text)] font-semibold">{children}</span>
}

function Table({ headers, rows, emphasizeFirst = false }: { headers: string[]; rows: (string | React.ReactNode)[][]; emphasizeFirst?: boolean }) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border border-[var(--color-border)] rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-[var(--color-bg-elevated)]">
            {headers.map((h, i) => (
              <th key={i} className="text-left p-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]/30">
              {row.map((cell, j) => (
                <td key={j} className={`p-3 text-xs leading-relaxed ${emphasizeFirst && j === 0 ? 'text-[var(--color-text)] font-semibold' : 'text-[var(--color-text-muted)]'}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Lesson 1 — The asset-manager's job
// ============================================================

function Lesson1() {
  return (
    <div>
      <H2>Why operational valuation is a distinct discipline</H2>
      <P>
        Valuing a renewable project that's already running is a fundamentally different exercise from
        valuing one that's still on paper. The development-stage analyst is forecasting from external
        proxies — wind atlas data, generic capacity factors, vendor curves. The operational analyst
        starts from the asset's own performance record. What it has actually generated, captured, and
        earned over months or years of operation. The question shifts from <Em>&ldquo;will this work?&rdquo;</Em>
        to <Em>&ldquo;how is it actually working, and is that better or worse than peers?&rdquo;</Em>
      </P>
      <P>
        That data advantage is also a data trap. Operational data ages — a wind farm that captured
        $85/MWh in 2022 may capture $45/MWh in 2026 because the region around it has filled with
        cannibalising solar. The metrics that mattered most at FID may not be the metrics that matter
        most at refinance.
      </P>

      <H2>The lifecycle — five stages of operational life</H2>
      <Table
        emphasizeFirst
        headers={['Stage', 'Years post-COD', 'What changes', 'Valuation question']}
        rows={[
          ['Commissioning', '0 – 1', 'Partial capacity online, ramp-up disclosures, first MLF settlement', 'Are we hitting nameplate? Any defect or vendor-warranty trigger?'],
          ['Ramp / proving', '1 – 3', 'First full operating year(s); P50/P90 vs actual; first refinancing window', 'Does the resource match the development-stage forecast?'],
          ['Steady-state', '3 – 10', 'Stable CF, stable MLF, full revenue stack visible', 'Is this still top-quartile vs the as-built peer cohort?'],
          ['Mid-life', '10 – 17', 'Capture price compression bites; major overhaul (turbine retrofit, inverter replacement); refinancing window 2', 'What is the remaining-life NPV — and does that justify the capex of mid-life upgrades?'],
          ['End-of-life', '17 – 25+', 'Repowering decision; decommissioning bond execution; planning re-approvals', 'Sell, repower, or decommission?'],
        ]}
      />
      <Callout type="info">
        BESS lifecycle is compressed: design life ~15 years, degradation steepest in years 8–12,
        end-of-life often by year 14 (vs wind/solar 25–30). The "mid-life" stage for BESS arrives
        around year 7-9. Hybrid projects effectively run two lifecycles in parallel — the solar/wind
        component ageing slowly, the BESS component ageing faster.
      </Callout>

      <H2>Why the question is asked — five real use cases</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Refinancing.</Em> The original project debt (mini-perm, 5–7 years) is being rolled.
          The new lender needs a current view of CF, capture price, MLF trajectory, and forward
          revenue. The valuation is the input to the DSCR sizing for the refinanced debt.</li>
        <li><Em>M&A — secondary asset sale.</Em> Tilt selling Snowtown to Powerlink; Genex selling
          Kidston Stage 1 to Macquarie. The buyer's diligence is operational valuation. The seller's
          asking price is operational valuation. The gap is where the deal is.</li>
        <li><Em>Portfolio rebalancing.</Em> A super fund holding 12 operating wind/solar assets
          decides annually which to keep, which to sell. The rank order is operational valuation.</li>
        <li><Em>Dividend recapture.</Em> The sponsor refinances debt upward — releasing equity that
          was tied up at FID. The valuation determines the size of the recap.</li>
        <li><Em>Insurance — business interruption claims.</Em> When a wind farm is offline for a
          cyclone event, the BI insurer pays out the lost revenue. That payout is operational
          valuation applied to a hypothetical operating period.</li>
      </ul>

      <H2>How operational valuation differs from development</H2>
      <Table
        emphasizeFirst
        headers={['Dimension', 'Development valuation', 'Operational valuation']}
        rows={[
          ['Primary data', 'Wind atlas, GHI maps, vendor curves, generic CF', 'AEMO half-hourly dispatch, real capture, registered MLF'],
          ['Confidence', 'Wide P50/P90 bands; risk-adjusted', 'Empirical; tight bands on past data, wider on future'],
          ['Time horizon', 'Forecast 25-year cash flow', 'Forecast remaining 15-25-year cash flow + look-back'],
          ['Key risks', 'Construction, planning, connection', 'Capture price erosion, MLF degradation, ageing equipment'],
          ['Discount rate', 'Higher (typically 8–10% real for renewable PF)', 'Lower (5–7% real once construction risk eliminated)'],
          ['Peer comparison', 'Often impossible — bespoke project', 'Required — every operational asset has peers'],
          ['Optionality', 'Significant — design changes still possible', 'Limited — asset is committed'],
        ]}
      />

      <H2>The mid-life pivot — when valuation gets interesting</H2>
      <P>
        Most operational valuation is straightforward in stages 1–3. The asset is performing roughly
        as expected; the metrics confirm or deny the original investment thesis. The hard valuation
        work starts at mid-life, when three things converge: the original PPA expiring or
        re-pricing, capture-price compression eroding merchant revenue, and the asset needing
        capital expenditure (turbine blades, inverter replacements, BESS augmentation). The mid-life
        question is whether the project's <Em>remaining</Em> economics justify the upgrade capex —
        or whether it's better to repower (replace) or run-to-failure.
      </P>
      <Callout type="key">
        Top-quartile at FID does not mean top-quartile at year 10. A NSW wind farm built in 2018
        with high CF and 0.95 value factor may have median CF and 0.72 value factor in 2026 as the
        REZ around it filled with same-shape generation. Operational valuation needs to look both
        backward (track record) and forward (peer-cohort dynamics) to avoid mis-pricing.
      </Callout>

      <H2>The AURES operational valuation framework</H2>
      <P>
        The remaining lessons in Part A build out the practical framework: what data you need
        (Lesson 2), what metrics matter per technology (Lesson 3), how to construct a peer cohort
        and define top-quartile (Lesson 4), how to project forward from operational data (Lesson 5),
        and how to present the result in a way that survives boardroom scrutiny (Lesson 6). Part B
        then extends the same framework to development-stage projects, where the data is thinner
        but the underlying fundamentals categories are identical.
      </P>

      <Callout type="source">
        Sources: AGL, Origin, Tilt Renewables annual reports · CEFC investment principles ·
        Norton Rose Fulbright <em>Renewable asset M&A</em> 2024 · Allens <em>Refinancing renewable
        debt</em> · BloombergNEF <em>Australia Asset Valuation Models</em> · ASIC half-yearly
        financials for ASX-listed asset owners · AFR project finance coverage.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 2 — What data you actually need
// ============================================================

function Lesson2() {
  return (
    <div>
      <H2>The Australian operational data layer — what's free, what's not</H2>
      <P>
        Australia has one of the world's better operational-data environments for renewable assets.
        Almost everything you need for a first-pass valuation is publicly available; only the
        sharpest forward-looking inputs (capture-price forecasts, asset-specific PPA terms) sit
        behind paywalls. The trick is knowing which dataset answers which question.
      </P>

      <H2>The five free public datasets that matter</H2>

      <H3>1. AEMO MMSDM — the foundational layer</H3>
      <P>
        The AEMO Market Management System Data Model is the underlying record of every dispatch
        interval in the NEM. Key tables for operational valuation:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>DISPATCH_UNIT_SCADA</Em> — 5-minute generation by DUID</li>
        <li><Em>DISPATCHPRICE</Em> — 5-minute RRP by region</li>
        <li><Em>DISPATCHLOAD</Em> — 5-minute output target + availability per DUID</li>
        <li><Em>NETWORK_LOSS_FACTORS</Em> — annual MLF and DLF per DUID</li>
        <li><Em>DUDETAILSUMMARY</Em> — DUID metadata (region, fuel type, registered capacity)</li>
        <li><Em>DISPATCHCONSTRAINT</Em> — every constraint equation that bound dispatch</li>
      </ul>
      <P>
        Access patterns: bulk CSV via AEMO's monthly archives, or programmatically via NEMOSIS
        (Python). AURES uses both — half-hourly aggregations are stored in the AURES DB and surfaced
        via the per-project Performance and Value Analysis pages.
      </P>

      <H3>2. OpenElectricity API — the developer-friendly front-end</H3>
      <P>
        OpenElectricity ingests AEMO data and exposes it via a clean REST API. The free tier
        provides 367 days of look-back, ~500 calls/day, with the response format already
        aggregated to hourly and daily resolution. Key endpoints:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>/facilities/</Em> — facility list with unit codes, fuel tech, registered capacity</li>
        <li><Em>/data/facilities/NEM</Em> — facility-level dispatch metrics by metric and interval</li>
        <li><Em>/data/network/NEM</Em> — network-level dispatch summaries</li>
      </ul>
      <P>
        AURES uses OpenElectricity for the hourly_shape data behind the Wind Value Analysis &gt;
        Daily Shape tab. The same API can feed solar diurnal curves and BESS dispatch profiles.
      </P>

      <H3>3. AER quarterly performance reports</H3>
      <P>
        The Australian Energy Regulator publishes a quarterly <Em>Wholesale Markets Performance
        Report</Em> with operational data on every utility-scale plant — CF, dispatched energy,
        revenue-equivalent metrics, and (since 2024) curtailment statistics. The reports also
        include cohort-level statistics (state averages, technology averages) useful for peer
        comparison.
      </P>

      <H3>4. ASIC half-yearly financials (ASX-listed asset owners)</H3>
      <P>
        Project-level financials are commercially sensitive, but where the asset sits inside a
        listed entity (AGL, Origin, Tilt, Genex, Mercury, ContactEnergy NZ, NEXTGEN, Akaysha
        backed by BlackRock with ASX-listed parent disclosures), the half-yearly accounts often
        disclose:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Revenue and EBITDA per asset segment</li>
        <li>Capex on operational assets (vs growth capex)</li>
        <li>Refinancing transactions and the implied valuation</li>
        <li>Mark-to-market changes on PPA derivatives (AASB 9)</li>
      </ul>
      <P>
        Asset-level granularity varies — Tilt and Genex disclose per-project; AGL discloses by
        portfolio bucket. The signal is consistent enough to triangulate operational valuation.
      </P>

      <H3>5. NEM Connection Register + AEMO Generation Information</H3>
      <P>
        Connection-side data:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>NEM Connection Register</Em> — every DUID with its connection point (TNI), TNSP,
          status (operating / connecting / withdrawn)</li>
        <li><Em>AEMO Generation Information</Em> — the monthly snapshot of registered capacity,
          status, and project owners — feeds the AURES Scheme Tracker</li>
      </ul>

      <H2>What private data adds — and whether you need it</H2>
      <Table
        emphasizeFirst
        headers={['Source', 'What it adds', 'Subscription cost', 'When you need it']}
        rows={[
          ['Wood Mackenzie / Aurora Energy Research', 'Forward capture-price forecasts, cannibalisation curves', '$50-150k/yr', 'For refinancing or M&A diligence beyond ~3 years forward'],
          ['BloombergNEF Australia ETO', 'Asset valuations, deal benchmarks, LCOE trajectories', '$30-80k/yr', 'For market-wide context, not asset-specific'],
          ['Inframation Group / IJ Global', 'Deal data, secondary-sale prices, refinancing terms', '$25-50k/yr', 'For M&A pricing or refinancing benchmarks'],
          ['Cornwall Insight Australia', 'Capture-price index, value-factor forecasts', '$20-40k/yr', 'Lower-cost alternative to Aurora; less granular'],
          ['Modo Energy Australia', 'BESS-focused — FCAS revenue stacks, arbitrage benchmarks', '$15-30k/yr', 'For BESS-heavy portfolios specifically'],
        ]}
      />
      <Callout type="info">
        For first-pass operational valuation of any single asset, the public data is sufficient. The
        private subscriptions become necessary when you need to defend a forward forecast in a
        diligence room or refinancing memorandum where the counterparty also has them.
      </Callout>

      <H2>What AURES has built on top — and where it stops</H2>
      <P>
        AURES Intelligence integrates the public data into per-project workflows:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Wind / Solar / BESS Value Analyses</Em> — multi-tab per-project pages with CF, capture
          price, value factor, MLF trend, curtailment indicators, peer ranking, daily shape, price
          band capture, and exportable PDF summaries.</li>
        <li><Em>Scheme Tracker</Em> — CIS / LTESA / VRET / ACT auction outcomes mapped to live
          project status.</li>
        <li><Em>Performance tab</Em> — for any operating project, year-on-year CF heatmap with
          partial-month scaling and commissioning toggle.</li>
        <li><Em>Curtailment & MLF Indicators</Em> — the Wind Value Analysis Trend tab surfaces
          basin-level MLF erosion and constraint-attributable curtailment hours.</li>
      </ul>
      <P>
        Where AURES doesn't yet have data:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Pre-2018 monthly performance data for older facilities (the AEMO MMSDM goes back
          further but ingestion is selective)</li>
        <li>FCAS revenue split by service (Reg vs Contingency vs Cap) — aggregate FCAS available,
          breakdown coming</li>
        <li>Curtailment forecasts at specific connection points — depends on AEMO load-flow
          modelling that isn't publicly published</li>
        <li>Community sentiment / social licence scoring</li>
      </ul>

      <Callout type="key">
        For operational valuation, AURES Intelligence + AEMO MMSDM + AER quarterlies is enough for
        80% of decisions. The remaining 20% needs Aurora / WoodMac forward curves and (for M&A)
        Inframation deal data. AURES is built to be the working-day layer, not the diligence-room
        layer — but the diligence-room outputs can be reconstructed from AURES base data and
        external forecasts.
      </Callout>

      <Callout type="source">
        Sources: AEMO MMSDM Data Model documentation · OpenElectricity API docs ·{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://www.aer.gov.au" target="_blank" rel="noopener">AER Wholesale Markets Performance</a>{' '}·
        ASX-listed company half-yearly reports · NEMOSIS Python library ·
        AURES{' '}
        <Link to="/projects" className="text-[var(--color-primary)] hover:underline">Project pages</Link>
        {' '}and per-project Value Analyses.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 3 — Operational metrics by technology
// ============================================================

function Lesson3() {
  return (
    <div>
      <H2>The metric stack — one for every technology</H2>
      <P>
        Each technology has its own panel of operational metrics. Some translate cleanly across
        technologies (capture price, MLF, availability); others are tech-specific (round-trip
        efficiency for BESS; performance ratio for solar; wind speed for wind). A good operational
        valuation looks at every metric the technology supports — gaps tell you where the data
        layer is incomplete, not that the metric doesn't matter.
      </P>

      <H2>Wind — the metric stack</H2>
      <Table
        emphasizeFirst
        headers={['Metric', 'Target range', 'What it tells you', 'Watch-outs']}
        rows={[
          ['Capacity Factor (annual)', '30-42% (NSW/VIC), 35-45% (TAS/SA)', 'Resource quality + operational uptime', 'Compare to project P50; ramp-up year can mislead'],
          ['Capacity Factor variance year-over-year', '±2-4pp typical', 'Volatility of revenue base', 'High variance increases financing margin'],
          ['Capture Price ($/MWh)', '$50-90 (NSW), $35-60 (VIC), $40-80 (SA)', 'Realised revenue per MWh dispatched', 'Falling capture price = cannibalisation arriving'],
          ['Value Factor (capture / pool)', '0.85-0.98', 'Time-of-generation alignment with pool prices', 'Sub-0.80 signals deep cannibalisation; rising VF unusual'],
          ['MLF (current vs registered)', 'Stable or improving', 'Network-side losses + intra-regional position', 'Falling MLF = REZ congestion; CISA doesn\'t cover'],
          ['Curtailment % (network)', '<5% typical, >10% concerning', 'Constraint-attributable lost output', 'Rising = REZ getting saturated'],
          ['Curtailment % (economic)', 'Project-dependent', 'Voluntary non-dispatch in negative prices', 'Reveals dispatch strategy'],
          ['Availability factor', '≥95%', '% of operational hours not under maintenance/fault', '<92% suggests turbine age or supplier issue'],
          ['FCAS revenue / MW', '$1-5k/yr typical', 'Ancillary revenue stack', 'Limited for wind; growing under fast-frequency reform'],
        ]}
      />
      <Callout type="numbers">
        <strong>Worked example — White Rock Wind Farm Stage 1.</strong> Operating data shows:
        CF ~32% (right at NSW state median), capture price ~$95/MWh (top quartile for 2025),
        value factor 0.94 (top decile), MLF 0.83 (declining from 0.92 at COD due to local
        congestion). The capture price advantage offsets the MLF erosion in P50 NPV terms —
        but the trend is what matters: extrapolating MLF decline, White Rock's effective
        $/MWh drops $3-5 per MWh per year of operation.
      </Callout>

      <H2>Solar — the metric stack</H2>
      <Table
        emphasizeFirst
        headers={['Metric', 'Target range', 'What it tells you', 'Watch-outs']}
        rows={[
          ['Capacity Factor (annual)', '22-28% (NSW/VIC), 25-32% (QLD/SA)', 'GHI quality + tracking + losses', 'Lower than wind but more predictable'],
          ['Performance Ratio (PR)', '78-85%', 'Actual / theoretical based on irradiance', 'Below 75% = soiling, inverter, or shading issue'],
          ['Degradation rate (% per yr)', '0.5-0.7% standard', 'Module power loss over time', '>1% = LID, PID, or supplier defect'],
          ['Soiling rate (% per yr)', '1-4% region-dependent', 'Dust accumulation losses', 'Higher in NW NSW, central QLD'],
          ['Capture Price ($/MWh)', '$25-50 (NSW), $20-40 (QLD)', 'Realised solar-hours revenue', 'Falling fastest of all techs due to cannibalisation'],
          ['Value Factor', '0.50-0.75', 'Time-of-generation = midday low-price hours', 'Below 0.55 means structural problem'],
          ['MLF', 'Stable or improving', 'As wind', 'Solar MLFs falling fastest in QLD'],
          ['Curtailment % (network + economic combined)', '5-15%', 'Combined for solar — economic dominates in negative-price hours', 'Rising at ~2pp per year in solar-heavy regions'],
          ['Inverter availability', '≥98%', 'Inverter is the lifecycle weak point', 'Falling toward 95% suggests overdue replacement'],
          ['Tracking system uptime (if applicable)', '≥99%', 'Single-axis tracker maintenance', 'Tracker downtime costs ~10% generation'],
        ]}
      />

      <H2>BESS — the metric stack</H2>
      <Table
        emphasizeFirst
        headers={['Metric', 'Target range', 'What it tells you', 'Watch-outs']}
        rows={[
          ['Round-trip efficiency (RTE)', '85-90% (Li-ion 2024-2026)', 'Energy in vs energy out across full cycle', '<82% signals battery degradation arriving'],
          ['Cycles per year', '250-365', 'How aggressively the BESS is being worked', '>365 = aggressive bidding; <200 = under-utilised'],
          ['FCAS revenue / MW / yr', '$30-80k', 'Ancillary services market participation', 'Saturating in NSW/VIC; still strong in QLD/SA'],
          ['Energy arbitrage revenue / MW / yr', '$80-200k', 'Spread × cycles × MLF', 'The dominant revenue stream'],
          ['Capacity revenue (if CISA)', '$50-150k / MW / yr', 'Dispatchable CISA floor', 'Only for CIS-backed projects'],
          ['Availability factor', '≥97%', '% time available for dispatch', '<94% = control system or thermal issue'],
          ['Peak power held during scarcity events', '85-100% of nominal', 'How much MW the BESS can hold during 5/30/60 min events', '<80% = battery in degraded state or thermal de-rating'],
          ['SOC discipline (% time in operational band)', '85-95%', 'Battery managed sustainably between 15-90% SOC', '<80% suggests dispatch optimiser is over-stressing the asset'],
          ['Augmentation cadence', 'First augmentation year 7-9', 'When BESS capacity is topped up', 'Earlier than year 6 = unexpected degradation'],
        ]}
      />
      <Callout type="info">
        BESS metrics are evolving fastest. Modo Energy publishes Australian BESS revenue stacks
        weekly. The 2024-2026 split is roughly: 50-60% energy arbitrage, 20-30% FCAS, 10-15%
        capacity (CISA only), 0-5% reactive support / SRAS. Expect FCAS share to fall as more
        BESS comes online in NSW/VIC; capacity share to rise as ESEM firming contracts arrive.
      </Callout>

      <H2>Hybrid — blended metrics + revenue stack visibility</H2>
      <P>
        A hybrid's operational data must separate the generation component (solar/wind) from the
        storage component (BESS) — because the components age differently, generate revenue at
        different times, and have different peer cohorts. The key hybrid-specific metrics:
      </P>
      <Table
        emphasizeFirst
        headers={['Metric', 'Watch for', 'Why it matters']}
        rows={[
          ['Revenue stack split (energy gen / arbitrage / FCAS / PPA)', 'Stack should be 30-50% generation, 35-50% storage', 'A heavily generation-skewed stack means BESS is under-utilised'],
          ['BESS:Solar capacity ratio', 'Industry trending toward 0.3-0.5 MW BESS per MW solar', 'Lower = mostly solar with arbitrage upside; higher = firming product'],
          ['Co-curtailment behaviour', '% solar curtailment captured by BESS charging', 'Higher = better economic optimisation of free solar'],
          ['Combined value factor', 'Should be higher than solar-only', 'Hybrid effect lifts the blended value factor — quantify this'],
          ['Daily-shape post-firming', 'Evening export should be 30-50% of total', 'Confirms BESS is firming generation to higher-priced hours'],
        ]}
      />

      <Callout type="key">
        The metric stack tells you what the asset is doing. Peer comparison (Lesson 4) tells you
        whether it's doing it well. Always anchor metrics to a peer cohort — a 28% CF wind farm
        in NSW is poor; the same 28% CF wind farm in TAS is excellent. Absolute numbers without
        cohort context mislead.
      </Callout>

      <Callout type="source">
        Sources: AURES per-project Wind / Solar / BESS Value Analysis pages · AER quarterly
        Wholesale Markets Performance Reports · OpenElectricity public datasets · Modo Energy{' '}
        <em>Australia BESS Performance Reports</em> · CSIRO GenCost · DNV <em>Renewable Asset
        Performance Benchmarks</em>.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 4 — Peer comparison and top quartile
// ============================================================

function Lesson4() {
  return (
    <div>
      <H2>"Top quartile" only makes sense relative to a peer cohort</H2>
      <P>
        A 32% capacity factor is excellent for a NSW wind farm and mediocre for a TAS one. A $48/MWh
        capture price is brilliant for a 2025 solar farm and merely average for a 2018 vintage. The
        first job of operational valuation is constructing the right peer cohort — then the
        metrics within that cohort tell you where the asset sits.
      </P>

      <H2>Cohort construction — four axes</H2>
      <Table
        emphasizeFirst
        headers={['Axis', 'Why it matters', 'Practical rule']}
        rows={[
          ['Technology', 'CFs, capture prices, value factors differ structurally', 'Wind / Solar / BESS / Hybrid — never mix'],
          ['Region or REZ', 'MLF, capture, congestion, resource quality all region-locked', 'NEM region at minimum; REZ if available'],
          ['Vintage (COD year)', 'Newer assets benefit from technology improvements + lower cannibalisation history', 'Group within ±2 years'],
          ['Capacity bucket', 'Scale economies for BESS; constructability for wind', 'Bands: 50-150 MW, 150-300 MW, 300+ MW'],
        ]}
      />
      <P>
        A clean cohort: NSW wind farms, 2019-2021 COD, 150-300 MW. That's typically 5-9 projects in
        the AURES universe — enough for quartile statistics, small enough to be genuinely
        comparable. The 80 operating wind farms in the NEM split into ~8-12 such cohorts.
      </P>

      <H2>The vintage adjustment problem</H2>
      <P>
        Comparing a 2017 wind farm against a 2024 one is unfair to the 2017 vintage on multiple
        dimensions:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Newer turbines have higher hub heights → higher CF for the same resource</li>
        <li>Newer projects benefit from improved O&M practices → higher availability</li>
        <li>Newer projects entered service when capture prices were already cannibalised → their
          P50 was set lower, but they're achieving their P50 more reliably</li>
        <li>Older projects accumulated MLF erosion that newer projects haven't yet experienced</li>
      </ul>
      <P>
        Two ways to handle this:
      </P>
      <ol className="list-decimal list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Cohort by vintage</Em> — split 2017-2019 from 2020-2022 from 2023+ and rank within.
          Cleanest but reduces cohort size.</li>
        <li><Em>Adjusted metrics</Em> — normalise CF by hub height; normalise capture price by the
          year's regional median. Allows wider cohorts but introduces assumptions.</li>
      </ol>
      <P>
        AURES generally uses cohort-by-vintage at the per-project page, with the option to broaden
        the cohort manually. The Wind / Solar Value Analysis pages display state-cohort rankings by
        default, with vintage-adjusted views available.
      </P>

      <H2>Deserves vs achieves — the two-axis framework</H2>
      <P>
        Within a cohort, there are two related but distinct questions:
      </P>
      <Table
        emphasizeFirst
        headers={['Axis', 'Question', 'How to measure']}
        rows={[
          ['Deserves', 'Given the resource and location, what should this project be achieving?', 'Resource-adjusted CF (using nearby met masts or reanalysis); peer-cohort median'],
          ['Achieves', 'What is the project actually delivering?', 'Raw CF, capture price, value factor over the operational record'],
        ]}
      />
      <P>
        Plotting these on two axes gives four quadrants:
      </P>
      <Table
        emphasizeFirst
        headers={['Quadrant', 'Interpretation', 'Implication for valuation']}
        rows={[
          ['High deserves, high achieves', 'Excellent location AND excellent operations', 'True top quartile — valuation premium'],
          ['High deserves, low achieves', 'Excellent location, poor operations', 'Operations upside — pays for itself if management improves'],
          ['Low deserves, high achieves', 'Mediocre location, well-run', 'Limited upside; current performance unsustainable'],
          ['Low deserves, low achieves', 'Mediocre location, poorly run', 'Discount to cohort median; investigate viability'],
        ]}
      />
      <Callout type="key">
        Top quartile is best framed as <Em>top quartile in achieves AND top quartile in
        deserves</Em>. A project that's top quartile in achieves but only middle-cohort in
        deserves is at risk of regression — the operational outperformance may not be sustainable.
        The deserves axis is the structural ceiling.
      </Callout>

      <H2>The single-metric trap</H2>
      <P>
        Industry analysis often ranks operational projects by a single headline — usually CF or
        revenue per MW. This is misleading:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>A wind farm with high CF and low value factor is exporting heavily at low-price times
          — a high revenue-per-MW number masks the structural problem</li>
        <li>A solar farm with low CF but high capture price (because it sits in a less-cannibalised
          spot) may have better NPV than the high-CF peer</li>
        <li>A BESS with high cycles/year may be deploying capacity wastefully if cycle revenue is
          falling — high cycles do not mean high IRR</li>
      </ul>
      <P>
        A defensible top-quartile ranking uses a <Em>composite</Em> of at least three metrics,
        weighted to the relevant valuation question:
      </P>

      <Table
        emphasizeFirst
        headers={['Valuation question', 'Composite weighting (for wind, illustrative)']}
        rows={[
          ['Refinancing — stable cash flow', '40% CF stability + 30% capture price level + 30% value factor'],
          ['M&A — forward earnings', '30% capture price trajectory + 30% value factor + 25% MLF stability + 15% CF level'],
          ['Sale of operational asset', '35% revenue per MW + 25% capture price + 20% MLF + 20% CF'],
        ]}
      />

      <Callout type="numbers">
        <strong>Worked example — NSW 2019-2021 wind cohort ranking (illustrative).</strong>
        <br /><br />
        Cohort: 6 wind farms, 150-300 MW, 2019-2021 COD. Metrics over the 2024 calendar year:
        <br /><br />
        Project A: CF 33%, capture $92/MWh, VF 0.97, MLF 0.91 → composite top-quartile<br />
        Project B: CF 31%, capture $76/MWh, VF 0.86, MLF 0.86 → median<br />
        Project C: CF 35%, capture $58/MWh, VF 0.72, MLF 0.83 → bottom (despite high CF, structural cannibalisation)<br />
        Project D: CF 32%, capture $84/MWh, VF 0.91, MLF 0.94 → upper quartile<br />
        Project E: CF 28%, capture $89/MWh, VF 0.95, MLF 0.89 → median<br />
        Project F: CF 30%, capture $65/MWh, VF 0.80, MLF 0.87 → bottom<br />
        <br />
        Ranked by raw CF, Project C is best. Ranked by composite (with capture and VF weighted),
        Project A is best. The two rankings produce different M&A pricing.
      </Callout>

      <Callout type="source">
        Sources: AURES per-project pages and Peer Comparison tab · AEMO MMSDM ·{' '}
        OpenElectricity facility data · Modo Energy <em>Australia Asset Performance Benchmarks</em>{' '}
        · DNV <em>Wind Resource Assessment Benchmarks</em> · BloombergNEF asset valuation methodology.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 5 — Forward valuation from operational data
// ============================================================

function Lesson5() {
  return (
    <div>
      <H2>From history to forecast — the projection layer</H2>
      <P>
        Operational data tells you what happened. Valuation needs to extend that into the future —
        15 to 25 years of remaining cash flow. Three structural questions shape every forward
        projection: capture price, MLF, and the discount rate. Each has well-trodden modelling
        conventions and well-known pitfalls.
      </P>

      <H2>Projecting capture price — three approaches</H2>

      <H3>1. Cohort median trajectory</H3>
      <P>
        The default for first-pass analysis. Take the project's current capture price as a delta
        to the cohort median, assume that delta persists, project the cohort median using AEMO ISP
        2024 step-change. This works well for projects with stable operational records and
        relatively low cannibalisation risk.
      </P>

      <H3>2. Value-factor convergence</H3>
      <P>
        High-value-factor projects (currently capturing premium prices) face structural pressure
        toward mean: as more same-shape generation enters their region, their value factor must
        fall. The convergence rate depends on local penetration. Wind in saturated REZs has
        converged 4-7 percentage points per year of operation. Solar has converged 8-12 pp/year
        in heavily-solar regions.
      </P>
      <P>
        A useful rule: a project currently at VF 0.95 with steeply rising local penetration will
        likely be at 0.85 in 3-5 years, 0.78 in 7-10 years. Below 0.78 the cannibalisation
        plateaus because economic curtailment kicks in.
      </P>

      <H3>3. Vendor capture-price forecasts</H3>
      <P>
        Aurora Energy Research, Wood Mackenzie, and Cornwall Insight publish region-specific
        capture-price forecasts by technology vintage. These are paywalled but defensible for
        diligence. They typically blend cohort statistics with bespoke load-flow modelling for the
        specific connection point.
      </P>

      <H2>Projecting MLF — the asymmetric risk</H2>
      <P>
        MLF erosion is one-directional: it falls more often than it rises. A wind or solar farm
        with current MLF of 0.92 might be at 0.85 in 5 years; rarely climbs back to 0.95. The
        forward modelling needs to bake this in.
      </P>
      <Table
        emphasizeFirst
        headers={['MLF trend pattern', 'Likely cause', 'Projection rule']}
        rows={[
          ['Stable (±1pp / yr)', 'Strong-grid site; minimal local additions', 'Hold flat'],
          ['Falling 1-3pp / yr', 'REZ filling with same-tech generation', 'Continue at half the historic rate for 5 years, then plateau'],
          ['Falling 3-7pp / yr', 'Heavily-saturated REZ', 'Project will reach floor (~0.75) in 3-5 years'],
          ['Rising', 'Network upgrade in progress; nearby project retiring', 'Verify the cause; sustainable improvement rare'],
        ]}
      />
      <Callout type="warn">
        Remember — the CISA does <em>not</em> cover MLF erosion. A project with 0.92 MLF
        decreasing to 0.83 over 8 years loses ~10% of revenue, and the CISA's floor make-up
        calculation (against RRP, not capture price) doesn't compensate. This is the largest single
        forward risk for many operational renewable projects in declining REZs.
      </Callout>

      <H2>The discount rate — what changes after construction</H2>
      <P>
        Pre-FID renewable projects typically discount at 8-10% real for equity. Once operating
        for 2-3 years with stable metrics, the same project can be discounted at 5-7% real because
        construction risk is gone, operational risk is empirically bounded, and revenue
        predictability is established. Three categories:
      </P>
      <Table
        emphasizeFirst
        headers={['Discount rate tier', 'Real % (2026)', 'Asset profile']}
        rows={[
          ['Premium operational', '4.5-5.5%', 'CISA / LTESA-backed; super fund equity; long-tenor PPA'],
          ['Standard operational', '5.5-6.5%', 'Merchant + corporate PPA; established sponsor'],
          ['Operational with risk', '7-9%', 'Heavily merchant; falling MLF; near end of original PPA'],
          ['Mid-life with capex', '8-11%', 'Major overhaul required (turbine, inverter, BESS augmentation)'],
        ]}
      />
      <P>
        The discount-rate compression on transition from construction-phase to operational-phase
        is one of the largest single drivers of equity value. A $100M project worth $40M as
        pre-FID equity is often worth $55-65M once operating for 24 months at expectation.
      </P>

      <H2>Refinancing economics</H2>
      <P>
        The 5-7 year mark is when most renewable project debt is refinanced. The original
        construction debt (mini-perm) was sized to a conservative downside; the refinanced debt
        is sized to demonstrated operational performance. Three outcomes:
      </P>
      <ol className="list-decimal list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Term-out refinance</Em> — same gearing, longer tenor, modestly lower coupon. The
          conservative choice; protects existing equity returns.</li>
        <li><Em>Cash-out refinance (recap)</Em> — raise gearing back to 75% on a demonstrated
          revenue base, releasing cash to equity sponsors. Typical recap distribution: $50-150M
          for a 200 MW operating renewable asset.</li>
        <li><Em>Hold-and-amortise</Em> — keep amortising the original debt to maturity. Rare for
          standalone projects, common for portfolio-financed assets where the lender treats the
          asset as one of many.</li>
      </ol>

      <H2>The terminal value question</H2>
      <P>
        At years 18-22 (depending on technology), forward valuation needs to model end-of-life
        options:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Repower</Em> — replace turbines with modern equipment, extend life 20+ years.
          Typical capex 60-70% of original; output uplift 30-50% from larger turbines.</li>
        <li><Em>Refurbish</Em> — replace blades, gearboxes; extend life 10-15 years. Capex 20-30%
          of original; modest output recovery.</li>
        <li><Em>Run-to-failure</Em> — minimise opex through year 25, decommission per bond.</li>
        <li><Em>Convert to hybrid</Em> — add BESS at existing connection; extends revenue runway
          and may justify keeping the generator into year 25+.</li>
      </ul>

      <Callout type="numbers">
        <strong>Worked example — NSW wind farm at year 10, considering refinancing.</strong>
        <br /><br />
        100 MW asset, 32% CF, $80/MWh blended (PPA + merchant). Current debt: $80M at 5.5% with
        7 years remaining amortisation. Operational EBITDA: $22M/yr. Forward 15-yr NPV at 6.5%
        real: ~$185M.
        <br /><br />
        <strong>Refinance options:</strong><br />
        Hold-and-amortise: equity dividend ~$13M/yr.<br />
        Term-out: refinance to 65% gearing (vs current ~55%), $100M debt at 5.0%, additional $20M
        released. Annual dividend rises to $14M.<br />
        Recap to 75%: $140M debt, $50M cash to equity. Dividend $11M/yr after higher service. The
        equity IRR rises from 9% to 12% on the recap path.
      </Callout>

      <Callout type="source">
        Sources: BloombergNEF asset valuation methodology · Macquarie infrastructure investor
        materials · Norton Rose Fulbright <em>Renewable refinancing practice notes</em> ·
        Aurora Energy Research <em>NEM Capture Price Outlook 2026</em> ·
        AURES Wind / Solar / BESS Value Analyses (forward views) ·
        AEMO ISP 2024 step-change scenario.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 6 — Presenting it — boardroom-ready outputs
// ============================================================

function Lesson6() {
  return (
    <div>
      <H2>The audience determines the format</H2>
      <P>
        Operational valuation outputs land in three different rooms, and each room reads them
        differently. The same underlying analysis needs three different presentations:
      </P>
      <Table
        emphasizeFirst
        headers={['Audience', 'Their question', 'What they want to see']}
        rows={[
          ['Sponsor board', 'Hold, sell, or recapitalise?', 'Single-page scorecard with quartile ranking, peer chart, forward NPV range, 3-5 bullet thesis'],
          ['Refinancing lenders', 'Can we size higher debt against this?', 'P50/P90 cash flow projection, DSCR table under multiple price scenarios, covenants compliance history'],
          ['M&A buyers', 'What is this worth, and what are the hidden risks?', 'Detailed metric stack, peer ranking, forward risk matrix, MLF/curtailment trajectory analysis'],
        ]}
      />

      <H2>The single-page scorecard — what works</H2>
      <P>
        The boardroom version compresses operational valuation to a single page. The components
        that earn their space:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Headline grade</Em> — A+ to D, with sub-grade explanation. Lets the reader
          calibrate instantly.</li>
        <li><Em>Three or four primary metrics</Em> with percentile bars showing where the asset
          sits in cohort. CF, capture price, value factor, MLF.</li>
        <li><Em>Forward trajectory</Em> — a single sparkline of expected $/MWh over the next 10
          years, with the cohort median overlay.</li>
        <li><Em>Top 3 pros / Top 3 cons</Em> — written in plain English, each tied to a number.</li>
        <li><Em>Data confidence</Em> — how many years of data, completeness, ramp-year flag.</li>
      </ul>
      <P>
        Things to leave off the scorecard: full data tables (put in appendix), forward-curve
        methodology (put in appendix), every metric (only the 3-4 that matter for the audience).
      </P>

      <H2>The AURES per-project Value Analysis — worked example</H2>
      <P>
        The AURES Wind Value Analysis page (visit any operating wind farm, scroll to the Wind Value
        Analysis section) implements this pattern:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Top-of-page header includes the data confidence badge and grade chip (A-D).</li>
        <li>The Valuation tab shows the pros/cons narrative with quantitative anchors.</li>
        <li>The Peers tab plots this project against state cohort on multiple axes.</li>
        <li>The Trend tab surfaces forward indicators — MLF erosion, capture price trajectory,
          curtailment hours.</li>
        <li>The export-to-PDF button generates a boardroom-ready single-page summary that includes
          project profile, value tables, NEM lens, and the curtailment & MLF indicators section.</li>
      </ul>
      <P>
        This pattern is technology-portable. The Solar and BESS Value Analyses use the same tab
        structure with technology-specific metric stacks (Solar adds Performance Ratio and
        degradation; BESS adds round-trip efficiency, cycle revenue split, and discharge
        spread analysis).
      </P>

      <H2>Pros and cons — writing them so they survive review</H2>
      <P>
        The pros/cons paragraph is the most-read part of the scorecard. Three rules:
      </P>
      <ol className="list-decimal list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Every claim is tied to a number.</Em> "Strong capacity factor" is weak; "33% CF in
          a state cohort averaging 29% — top quartile" is defensible.</li>
        <li><Em>Forward-looking risks earn space.</Em> Don't only describe what is good — describe
          what is most likely to deteriorate, and on what timescale.</li>
        <li><Em>Concede the cons.</Em> A scorecard with five pros and no cons reads as marketing,
          not analysis. Every operating asset has at least two real cons.</li>
      </ol>
      <Callout type="numbers">
        <strong>Example — well-written pro/con pair for a NSW wind farm:</strong>
        <br /><br />
        <Em>Pro:</Em> "Above-average capacity factor (33% vs NSW cohort 29%, percentile 78). The
        site sits on a long ridgeline with consistent SW winds. Production has been stable
        ±1.5pp year over the operating record."
        <br /><br />
        <Em>Con:</Em> "MLF declined from 0.94 at COD (2019) to 0.86 in 2025, a 0.8pp/year erosion
        attributable to ~700 MW of new wind connecting at neighbouring TNIs since 2021. Forward
        modelling implies 0.82 by 2028; the CISA does not compensate for MLF erosion."
      </Callout>

      <H2>Side-by-side peer comparison — visualising the cohort</H2>
      <P>
        The peer chart is often the most decision-influencing visual. Three patterns that work:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Bar chart with project highlighted</Em> — single metric across cohort, with the
          subject project coloured. Clean for senior audiences.</li>
        <li><Em>Two-axis scatter</Em> — e.g. CF (x) vs capture price (y). The deserves-vs-achieves
          plot from Lesson 4 fits here. Shows which quadrant the asset sits in.</li>
        <li><Em>Radar / spider chart</Em> — 5-6 metrics, each scaled 0-100 within cohort, project
          plotted vs cohort median. Visualises overall balance.</li>
      </ul>

      <H2>What boards actually look at</H2>
      <P>
        From the AURES analysis of board materials filed in ASX-listed asset M&A processes and
        public refinancing memos:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>The headline grade or quartile sits in the first 20 seconds of review</li>
        <li>The forward NPV range gets the most challenge — "why is the upper bound that high?"</li>
        <li>Cons are read more carefully than pros</li>
        <li>The data confidence flag determines whether the analysis is taken at face value or
          re-modelled</li>
        <li>Peer comparison earns 60-80% of the discussion time when the result is contested</li>
      </ul>

      <Callout type="key">
        Operational valuation is reverse-engineering: the headline (grade, NPV, recommendation)
        sits on top of the metric stack, which sits on top of the data layer. A reader walks
        downward from headline to detail when they need to challenge or confirm. A scorecard
        that supports this walk-down — with each layer transparently linked to the one above —
        wins.
      </Callout>

      <Callout type="source">
        Sources: AURES per-project Value Analysis pages (Wind, Solar, BESS) and exportable PDFs ·
        ASX-listed asset M&A materials · BloombergNEF asset valuation report templates ·
        Norton Rose Fulbright project finance practice notes · Macquarie Infrastructure investor
        day materials.
      </Callout>

      <Callout type="info">
        <strong>End of Part A.</strong> Lessons 7-12 (Part B) cover development-stage valuation —
        how the same framework adapts when you have no operational record and must value from
        fundamentals (resource, connection, offtake, developer, constructability + community).
        Lessons 13-14 (Part C) close the loop with an interactive top-quartile scoring tool
        applicable to operating or development projects.
      </Callout>
    </div>
  )
}

// ============================================================
// Module shell — index + per-lesson view
// ============================================================

function ModuleIndex({ progress, onMark }: {
  progress: Set<string>
  onMark: (id: string, done: boolean) => void
}) {
  const builtMin = LESSONS.filter(l => l.built).reduce((s, l) => s + parseInt(l.readingTime, 10), 0)
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      <div>
        <Link to="/learn" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← Learning modules
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mt-2 mb-1">
          Valuing Renewable Projects — Top-Quartile Analysis
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          A 14-lesson framework for scoring renewable assets — operational or in-development — against
          fundamentals. Part A (lessons 1–6) covers operational valuation; Part B (7–12, coming in v2.96.0)
          covers development-stage valuation; Part C (13–14, v2.97.0) ties them together with an
          interactive scoring tool.
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          Currently built: {LESSONS.filter(l => l.built).length} of {LESSONS.length} lessons (~{builtMin} min).
        </p>
      </div>

      <div className="space-y-2">
        {LESSONS.map(l => {
          const done = progress.has(l.id)
          const isBuilt = l.built
          if (!isBuilt) {
            return (
              <div
                key={l.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-card)]/40 opacity-60"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]">
                  {l.number}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-1">{l.title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{l.subtitle}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] mt-1 italic">Coming in {l.number <= 12 ? 'v2.96.0' : 'v2.97.0'}</p>
                </div>
              </div>
            )
          }
          return (
            <Link
              key={l.id}
              to={`/learn/valuing-projects/${l.id}`}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                done
                  ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                  : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
              }`}>
                {done ? '✓' : l.number}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">{l.title}</h3>
                <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{l.subtitle}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{l.readingTime}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="text-xs text-[var(--color-text-muted)] text-center py-4">
        {LESSONS.filter(l => progress.has(l.id)).length} of {LESSONS.filter(l => l.built).length} built lessons read.
        {' '}
        <button onClick={() => { LESSONS.forEach(l => onMark(l.id, false)) }}
          className="text-[var(--color-primary)] hover:underline">
          Reset progress
        </button>
      </div>
    </div>
  )
}

function LessonView({ lesson, onComplete }: {
  lesson: LessonMeta
  onComplete: (id: string) => void
}) {
  const navigate = useNavigate()
  const builtLessons = LESSONS.filter(l => l.built)
  const idx = builtLessons.findIndex(l => l.id === lesson.id)
  const prev = idx > 0 ? builtLessons[idx - 1] : null
  const next = idx >= 0 && idx < builtLessons.length - 1 ? builtLessons[idx + 1] : null

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      <div>
        <Link to="/learn/valuing-projects" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← Valuing Renewable Projects
        </Link>
        <div className="flex items-center gap-2 mt-2 text-xs">
          <span className="text-[var(--color-text-muted)]">Lesson {lesson.number} of {LESSONS.length} · {lesson.readingTime}</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-text)] mt-1">
          {lesson.title}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{lesson.subtitle}</p>
      </div>

      <div>
        {lesson.id === 'asset-manager-job' && <Lesson1 />}
        {lesson.id === 'data-layer'        && <Lesson2 />}
        {lesson.id === 'metrics-by-tech'   && <Lesson3 />}
        {lesson.id === 'peer-comparison'   && <Lesson4 />}
        {lesson.id === 'forward-valuation' && <Lesson5 />}
        {lesson.id === 'presenting'        && <Lesson6 />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <button onClick={() => navigate(`/learn/valuing-projects/${prev.id}`)}
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => { onComplete(lesson.id); navigate(`/learn/valuing-projects/${next.id}`) }}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 transition-colors">
            Mark read + next → {next.title}
          </button>
        ) : (
          <button onClick={() => { onComplete(lesson.id); navigate('/learn/valuing-projects') }}
            className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
            Mark read + back to index
          </button>
        )}
      </div>
    </div>
  )
}

export default function ValuingProjectsModule() {
  const { lessonId } = useParams<{ lessonId?: string }>()
  const [progress, setProgress] = useState<Set<string>>(loadProgress)

  const onMark = useCallback((id: string, done: boolean) => {
    setProgress(prev => {
      const next = new Set(prev)
      if (done) next.add(id); else next.delete(id)
      saveProgress(next)
      return next
    })
  }, [])

  const onComplete = useCallback((id: string) => onMark(id, true), [onMark])

  if (!lessonId) {
    return <ModuleIndex progress={progress} onMark={onMark} />
  }

  const lesson = LESSONS.find(l => l.id === lessonId)
  if (!lesson || !lesson.built) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">
          {lesson ? 'This lesson is not built yet — coming in a later version.' : 'Lesson not found.'}
        </p>
        <Link to="/learn/valuing-projects" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Back to Valuing Renewable Projects
        </Link>
      </div>
    )
  }
  return <LessonView lesson={lesson} onComplete={onComplete} />
}
