/**
 * CIS & LTESA Bidding Parameters — AURES Learning Module
 *
 * 7-lesson deep-dive into the mechanics of bidding into the federal
 * Capacity Investment Scheme and the NSW Long-Term Energy Service
 * Agreements. Pitched at the same level as the Constraints module:
 * technically credible, data-first, real round numbers, real
 * project examples drawn from the AURES scheme tracker.
 *
 * Sources cited inline at the end of each lesson; the full
 * bibliography also lives in src/data/learning-modules.ts.
 */
import { useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, Legend,
} from 'recharts'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-cis-ltesa-progress'

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
  { id: 'architecture',         number: 1, title: 'The Federal-State Architecture',         subtitle: 'Why two parallel sovereign-backed schemes',     readingTime: '8 min',  built: true },
  { id: 'cis-mechanics',        number: 2, title: 'CIS Mechanics — Floor + Ceiling CFD',    subtitle: 'How the CISA actually pays',                    readingTime: '10 min', built: true },
  { id: 'ppa-cisa-calculator',  number: 3, title: 'PPA × CISA Interactive Calculator',      subtitle: 'Where the dollars come from across spot scenarios — and all the interactions to watch', readingTime: '14 min', built: true },
  { id: 'ltesa-mechanics',      number: 4, title: 'LTESA Mechanics — Fixed-Price CFD',      subtitle: 'How the NSW Consumer Trustee deal works',       readingTime: '8 min',  built: true },
  { id: 'rounds',               number: 5, title: 'Round-by-Round — What Changed and Why',  subtitle: 'Pilot through Tender 6 and LTESA R1–R6',        readingTime: '12 min', built: true },
  { id: 'merit-criteria',       number: 6, title: 'Merit Criteria — and What They Cost',    subtitle: 'The scoring matrix and its hidden $/MWh',       readingTime: '10 min', built: true },
  { id: 'finance-strategy',     number: 7, title: 'Bidding Strategy & Project Financing',   subtitle: 'How CISA changes the equity model',             readingTime: '10 min', built: true },
  { id: 'outcomes',             number: 8, title: 'Outcomes — Has It Worked?',              subtitle: 'AER, FNCEN, AURES tracker, the 2026-27 inflection', readingTime: '8 min',  built: true },
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

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-[var(--color-bg-elevated)] text-emerald-400 px-1.5 py-0.5 rounded text-[13px] font-mono">
      {children}
    </code>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-[var(--color-text)] mt-8 mb-3 flex items-center gap-2">{children}</h2>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-[var(--color-text)] mt-5 mb-2">{children}</h3>
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
// Lesson 1 — The Federal-State Architecture
// ============================================================

function Lesson1() {
  return (
    <div>
      <H2>The headline question</H2>
      <P>
        Why does Australia have <Em>two parallel sovereign-backed underwriting schemes</Em> for renewable
        energy — the federal Capacity Investment Scheme (CIS), and the NSW Long-Term Energy Service Agreement
        (LTESA) regime? The short answer: NSW moved first, the federal government scaled up later, and
        neither is willing to dismantle their structure. Understanding the architecture matters because every
        bidder must decide which scheme (or both, or neither) suits their project.
      </P>

      <Callout type="key">
        Both schemes are <Em>contracts for difference</Em>. They underwrite revenue. They do not provide
        upfront capital, equity, or grants. The proponent still finances, builds, and operates the asset
        commercially — but the revenue volatility is shared with the sovereign counterparty.
      </Callout>

      <H2>Two schemes, side by side</H2>
      <Table
        emphasizeFirst
        headers={['Dimension', 'CIS (Federal)', 'LTESA (NSW)']}
        rows={[
          ['Legal vehicle', 'Capacity Investment Scheme Agreement (CISA)', 'Long-Term Energy Service Agreement (LTESA)'],
          ['Counterparty', 'Commonwealth of Australia (DCCEEW signs, AEMO Services delivers)', 'NSW Government (AEMO Services as Consumer Trustee)'],
          ['Statute', 'Administrative — guideline-based, no dedicated Act', 'Electricity Infrastructure Investment Act 2020 (NSW)'],
          ['Geographic scope', 'NEM + WEM (Tenders 2 and 5/6 were WA-only)', 'NSW only'],
          ['Mechanism', 'Two-way CFD with floor + ceiling profit-share', 'Two-way CFD with fixed strike (LDS variant in R6)'],
          ['Term', 'Typically 12–15 years post-COD', 'Typically 14–20 years post-COD (LDS up to 20)'],
          ['First round', 'CIS Pilot — NSW, announced Nov 2023', 'Round 1 — Generation + LDS, May 2023'],
          ['Latest round', 'Tenders 5 and 6 (WEM Generation + Dispatchable), 2 May 2026', 'Round 6 — Long Duration Storage, 5 Feb 2026'],
        ]}
      />

      <H2>Why two schemes?</H2>
      <P>
        NSW moved first because it had to. The 2019 NSW Electricity Infrastructure Roadmap (followed by the
        EII Act 2020) was a response to a specific problem: the Liddell coal closure (April 2023) and the
        Eraring closure (originally 2025) would remove ~4 GW of dispatchable capacity from the NSW system
        within five years, and the state could not wait for the federal government to underwrite the
        replacement. The Roadmap committed to <Em>at least 12 GW of generation, 2 GW of long-duration
        storage, and 28 GWh of LDES capacity by 2030</Em>, all underwritten by NSW consumers via the
        regulated Consumer Trustee.
      </P>
      <P>
        The federal CIS, in its first form, was a 6 GW pilot announced in late 2022. It became politically
        unworkable when the AEMO Integrated System Plan made clear that the NEM needed roughly{' '}
        <Em>32 GW of new renewable generation and 13 GW of dispatchable capacity by 2030</Em> to deliver an
        82% renewable share. In November 2023 Minister Bowen quadrupled the CIS to 32 GW (23 GW of
        renewables + 9 GW of dispatchable), and the federal scheme finally matched the scale of the
        problem.
      </P>

      <Callout type="info">
        For a bidder this is the practical question: a NSW project may be eligible for both. A SA, VIC,
        QLD, TAS or WA project can only access CIS. Most NSW bidders treat the two as <Em>complementary
        rather than substitute</Em> — using CIS to lock in revenue floor while bidding into LTESA for a
        higher fixed strike on the same asset, where the rounds permit it. Only one CFD can apply to any
        given MWh, but a project can split its capacity across two contracts.
      </Callout>

      <H2>What about the other states?</H2>
      <P>
        VIC ran the VRET reverse auctions (2017 and 2018) for ~928 MW, but has since moved to a centralised
        State Electricity Commission re-establishment with direct equity participation rather than a CFD.
        QLD has pursued the Queensland Energy and Jobs Plan with public ownership of CleanCo and Stanwell
        rather than a private CFD scheme. SA's bipartisan support for renewables has so far meant private
        offtake markets have funded the build-out without state CFDs. WA is the most isolated case: SWIS is
        a separate market and the federal CIS has stepped in directly via WEM-specific Tenders 2, 5, and 6.
      </P>

      <H2>Where the federal-state interaction shows up</H2>
      <P>
        For NSW projects, the federal-state question is a real strategic choice. Tender 1 (Dec 2024) had 19
        successful projects, of which 7 are in NSW; the same projects are also broadly eligible for LTESA
        rounds. The bidding decision turns on:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Strike price expectations</Em> — LTESA is a fixed strike, CIS is floor + ceiling. A bidder confident in high market prices prefers LTESA's fixed strike with capped CIS floor as a safety net.</li>
        <li><Em>Delivery timing</Em> — CIS has shorter time-to-execution targets (12 months from award) than LTESA. Earlier-stage NSW projects often prefer LTESA for the longer development runway.</li>
        <li><Em>Merit-criteria fit</Em> — LTESA places heavier weight on First Nations participation under the EII Act framework. CIS Tenders 5+ added the same, but the LTESA structure is more granular.</li>
        <li><Em>Project bond requirements</Em> — both require performance bonds, but the CIS requirement (20 days post-execution) has driven some bidders to LTESA where the bond timing is less aggressive.</li>
      </ul>

      <Callout type="source">
        Sources for this lesson: DCCEEW{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme" target="_blank" rel="noopener">CIS home</a>{' '}·
        AEMO Services{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://aemoservices.com.au/" target="_blank" rel="noopener">tenders portal</a>{' '}·
        NSW{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://www.energy.nsw.gov.au/nsw-plans-and-progress/government-strategies-and-frameworks/electricity-infrastructure-roadmap" target="_blank" rel="noopener">Electricity Infrastructure Roadmap</a>{' '}·
        EII Act 2020 (NSW){' '}·
        Hamilton Locke{' '}
        <em>Kicking off Australia's largest-ever renewables tender</em>{' '}·
        AEMO ISP 2024.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 2 — CIS Mechanics — Floor + Ceiling CFD
// ============================================================

function Lesson2() {
  // Interactive: simple CISA payoff calculator
  const [floor, setFloor] = useState(60)
  const [ceiling, setCeiling] = useState(120)
  const [marketPrice, setMarketPrice] = useState(80)
  const [shareAbove, setShareAbove] = useState(90)

  const proponentReceives =
    marketPrice < floor    ? floor :
    marketPrice <= ceiling ? marketPrice :
    ceiling + (marketPrice - ceiling) * (1 - shareAbove / 100)

  const govPays =
    marketPrice < floor ? floor - marketPrice : 0
  const govReceives =
    marketPrice > ceiling ? (marketPrice - ceiling) * (shareAbove / 100) : 0

  return (
    <div>
      <H2>The two-way CFD</H2>
      <P>
        A CISA is a <Em>two-way contract for difference</Em> on a reference price. The reference price is the
        regional reference price (RRP) of the NEM region the project sits in (or the WEM equivalent for
        WA tenders). The contract has three parameters that matter for bidding:
      </P>

      <Callout type="key">
        The CISA defines a <Em>floor</Em> price below which the Commonwealth tops up the proponent's revenue,
        and a <Em>ceiling</Em> price above which the proponent shares its profits with the Commonwealth.
        Between floor and ceiling the proponent simply earns the market price. Volume is the project's
        actual generation (or for dispatchable contracts, its dispatched energy minus charging energy for
        BESS).
      </Callout>

      <H3>The payoff structure, formally</H3>
      <P>
        Let <Code>P</Code> be the volume-weighted average market price the project realised in a settlement
        period, <Code>F</Code> the floor and <Code>C</Code> the ceiling, and <Code>s</Code> the
        commonwealth share above the ceiling. Then the proponent's effective $/MWh revenue is:
      </P>
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4 my-4 font-mono text-sm leading-relaxed">
        <span className="text-[var(--color-text-muted)]">If</span> <Code>P &lt; F</Code>:                          {' '}<Code>R = F</Code> <span className="text-[var(--color-text-muted)]">(commonwealth tops up)</span><br/>
        <span className="text-[var(--color-text-muted)]">If</span> <Code>F ≤ P ≤ C</Code>:                       {' '}<Code>R = P</Code> <span className="text-[var(--color-text-muted)]">(market only)</span><br/>
        <span className="text-[var(--color-text-muted)]">If</span> <Code>P &gt; C</Code>:                          {' '}<Code>R = C + (P − C) × (1 − s)</Code> <span className="text-[var(--color-text-muted)]">(profit-share)</span>
      </div>

      <P>
        The <Em>strike</Em> price you'll see quoted in industry analysis is sometimes the floor, sometimes
        a notional &ldquo;mid-point&rdquo;, and sometimes a P50 expected revenue. There is no single &ldquo;CIS
        strike price&rdquo; — each contract is bilaterally negotiated within the bid envelope.
      </P>

      <H2>Try it — CISA payoff calculator</H2>
      <P>Move the sliders to see how the floor + ceiling structure shifts the proponent's $/MWh revenue.</P>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 my-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Floor F ($/MWh)</label>
            <input type="range" min="20" max="120" step="5" value={floor} onChange={e => setFloor(+e.target.value)} className="w-full mt-1" />
            <p className="text-sm font-bold text-[var(--color-text)] mt-1">${floor}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Ceiling C ($/MWh)</label>
            <input type="range" min="80" max="250" step="5" value={ceiling} onChange={e => setCeiling(+e.target.value)} className="w-full mt-1" />
            <p className="text-sm font-bold text-[var(--color-text)] mt-1">${ceiling}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Market price P ($/MWh)</label>
            <input type="range" min="0" max="300" step="5" value={marketPrice} onChange={e => setMarketPrice(+e.target.value)} className="w-full mt-1" />
            <p className="text-sm font-bold text-[var(--color-text)] mt-1">${marketPrice}</p>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Govt share above C (%)</label>
            <input type="range" min="50" max="100" step="5" value={shareAbove} onChange={e => setShareAbove(+e.target.value)} className="w-full mt-1" />
            <p className="text-sm font-bold text-[var(--color-text)] mt-1">{shareAbove}%</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Proponent receives</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">${proponentReceives.toFixed(2)}/MWh</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">
              {marketPrice < floor ? 'Floor protection — market is below F.' :
               marketPrice <= ceiling ? 'Pure market — between F and C.' :
               'Profit-share kicks in above C.'}
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold">Commonwealth pays</p>
            <p className="text-2xl font-bold text-blue-400 mt-1">${govPays.toFixed(2)}/MWh</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Top-up — only when market &lt; floor.</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-purple-400 font-semibold">Commonwealth claws back</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">${govReceives.toFixed(2)}/MWh</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Profit-share — only when market &gt; ceiling.</p>
          </div>
        </div>
      </div>

      <H2>Generation contracts vs Dispatchable contracts</H2>
      <P>
        CIS uses two distinct CFD templates depending on what the project provides:
      </P>
      <Table
        emphasizeFirst
        headers={['', 'Generation CISA', 'Dispatchable CISA']}
        rows={[
          ['Eligible technology', 'Wind, solar, hybrid (with co-located battery)', 'Standalone BESS, pumped hydro, thermal'],
          ['Reference price', 'Regional RRP', 'Regional RRP'],
          ['Volume metric', 'Net energy generated (MWh)', 'Discharge MWh − charge MWh, with FCAS bid stack treatment defined separately'],
          ['Floor mechanism', 'Per-MWh top-up if VWAP below floor', 'Per-MWh top-up but linked to dispatch behaviour requirements (e.g. min cycles/yr)'],
          ['Ceiling mechanism', 'Standard profit-share above ceiling', 'Profit-share AND a duty-cycle requirement (must dispatch when market signals say so)'],
          ['Contract template', 'Released June 2024', 'Released October 2024 (later than Generation)'],
          ['First award round', 'CIS Pilot NSW (Nov 2023) used a draft template', 'CIS Pilot NSW (BESS) — same draft, ratified later'],
        ]}
      />

      <H3>Why the two templates differ</H3>
      <P>
        A Generation CISA is straightforward: more output is always better, the project bids into the
        market at a low offer to maximise dispatch, and the CFD settles on the result. A Dispatchable CISA
        has a deeper problem: a battery owner could keep the battery idle if the contract had no penalty
        for under-dispatch, claim the floor revenue on the energy they did dispatch, and never use the
        asset for grid services. The Dispatchable template adds <Em>duty-cycle conditions</Em> — minimum
        cycles per year, response to market price thresholds, FCAS contracted volumes — to ensure the
        battery actually delivers system value.
      </P>

      <H2>What the CISA does NOT cover</H2>
      <Callout type="warn">
        The CFD references <Em>regional RRP, not the project's actual capture price</Em>. So it does not
        protect against:
        <ul className="list-disc list-inside mt-2 ml-2 space-y-1 text-[var(--color-text-muted)]">
          <li><Em>Basis risk</Em> — the gap between the project's local connection-point price and the
            regional RRP, which appears as Marginal Loss Factors (MLFs) and intra-regional constraint
            congestion.</li>
          <li><Em>Curtailment</Em> — if the project is dispatched off, no MWh is generated, so no top-up
            is paid on the missing volume.</li>
          <li><Em>Cannibalisation within shape</Em> — if every solar farm in the region is generating at
            the same time, the regional RRP may be at or near zero. The CFD pays <Em>up to the floor</Em>,
            so the proponent is protected from negative prices, but only at the contract's floor, not at
            an &ldquo;average&rdquo; price that compensates for shape.</li>
          <li><Em>Connection delays</Em> — the contract typically references commercial operation date.
            If COD slips, the contract clock and the term reset, and bond forfeiture is possible.</li>
        </ul>
      </Callout>

      <Callout type="numbers">
        Worked example. Suppose a 200 MW solar farm in NSW with 30% capacity factor wins a Generation CISA
        with floor = $50/MWh, ceiling = $130/MWh, share-above = 90/10 (proponent keeps 10%, Commonwealth
        gets 90%). In a year where the NSW RRP averages $40 over solar hours (heavy cannibalisation), the
        proponent receives $50/MWh × 525,600 MWh = ~$26.3M revenue from the CFD, with the Commonwealth
        topping up $10/MWh × 525,600 ≈ $5.3M. In a year where prices spike to $200/MWh average, the
        proponent receives $130 + (200 − 130) × 0.10 = $137/MWh × 525,600 ≈ $72M, and the Commonwealth
        receives $63/MWh × 525,600 ≈ $33M. The contract is therefore extremely valuable in low-price years
        and only mildly attractive in high-price years.
      </Callout>

      <Callout type="source">
        Sources: DCCEEW <em>Capacity Investment Scheme guidelines</em> · HSF Kramer{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://www.hsfkramer.com/notes/energy/2024-posts/Capacity-Investment-Scheme-update-and-the-release-of-the-Dispatchable-CISA-2024" target="_blank" rel="noopener">CIS update and the release of the Dispatchable CISA</a>{' '}·
        Pinsent Masons <em>Latest Australian capacity investment scheme battery projects announced</em>{' '}·
        Baringa <em>Australia CIS storage tenders</em>{' '}·
        AEMO Services CISA template documents.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 3 — LTESA Mechanics — Fixed-Price CFD
// ============================================================

function Lesson3() {
  return (
    <div>
      <H2>The Consumer Trustee model</H2>
      <P>
        The LTESA scheme is structurally older and structurally different from the CIS. It was established
        by the NSW Electricity Infrastructure Investment Act 2020 (EII Act), and is delivered by AEMO
        Services in a unique role called the <Em>Consumer Trustee</Em>. The Trustee acts as agent for NSW
        consumers, signs LTESA contracts with successful proponents, and is reimbursed by NSW consumers
        through a Roadmap-specific charge on their bills.
      </P>

      <Callout type="key">
        The single most important contractual difference between LTESA and CIS: an LTESA strike price is{' '}
        <Em>fixed</Em>. There is no separate floor and ceiling. The strike is the strike, and the
        proponent is paid the difference (in either direction) between the strike and the market reference
        price for every MWh delivered.
      </Callout>

      <H2>The LTESA contract structure</H2>
      <P>The fixed-price two-way CFD math:</P>
      <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4 my-4 font-mono text-sm leading-relaxed">
        <span className="text-[var(--color-text-muted)]">For every MWh the project delivers:</span><br/>
        <Code>R = K</Code> <span className="text-[var(--color-text-muted)]">(proponent always receives the strike K)</span><br/>
        <span className="text-[var(--color-text-muted)]">Trustee pays</span> <Code>K − P</Code> <span className="text-[var(--color-text-muted)]">if P &lt; K (consumers fund the gap)</span><br/>
        <span className="text-[var(--color-text-muted)]">Proponent pays</span> <Code>P − K</Code> <span className="text-[var(--color-text-muted)]">if P &gt; K (consumers benefit)</span>
      </div>
      <P>
        Where <Code>P</Code> is the market reference price (regional RRP for generation, time-weighted
        regional price for storage) and <Code>K</Code> is the strike. The proponent's net cash position is
        always exactly K per MWh delivered, regardless of market price — making LTESA contracts more
        bankable than CIS to lenders that prefer revenue certainty over upside potential.
      </P>

      <H2>The four LTESA variants</H2>
      <P>
        The LTESA framework has been adapted to four asset types, each with a tailored payoff:
      </P>
      <Table
        emphasizeFirst
        headers={['Variant', 'Asset type', 'Reference price', 'Volume metric']}
        rows={[
          ['Generation LTESA', 'Wind, solar, hybrid', 'Regional RRP', 'Energy generated (MWh)'],
          ['Firming LTESA', 'BESS up to 4 hours, gas peakers', 'Regional RRP', 'Net dispatched MWh + availability'],
          ['Long Duration Storage LTESA', 'BESS 8h+, pumped hydro', 'Time-weighted regional RRP', 'Net dispatched MWh, with availability payment'],
          ['Hybrid LTESA', 'Solar/wind + battery co-located', 'Regional RRP', 'Generation + battery treated separately'],
        ]}
      />

      <H2>Aboriginal Participation Plans</H2>
      <P>
        Under the EII Act, every LTESA project must commit to an{' '}
        <Em>Aboriginal Participation Plan</Em> (APP). The minimum threshold is 1.5% of the project's
        operational and construction spend going to First Nations procurement, with a 10% stretch goal.
        These commitments are legally binding from the moment the LTESA is executed, and the Consumer
        Trustee monitors compliance for the full term. There is no equivalent contractual mechanism in
        the CIS — the federal scheme imposes First Nations engagement via merit criteria but not via
        post-execution legal obligation.
      </P>

      <Callout type="info">
        For a NSW project this often makes the LTESA route more First-Nations-engagement-intensive than
        CIS. Some proponents prefer CIS for that reason; others (particularly those with established
        relationships with traditional owners) prefer LTESA because the locked-in compliance protects them
        from price-only competitors.
      </Callout>

      <H2>The LTESA option mechanism</H2>
      <P>
        An LTESA is technically a long-dated <Em>option</Em> on a CFD. Proponents bid an option premium
        per MWh; once awarded, they have the right (but not the obligation) to call the LTESA into effect
        at the contractually-defined strike price. The option exists because between award and COD the
        proponent's project may evolve — they may secure a better corporate PPA, decide to skip the LTESA,
        or fail to reach FID. The option premium is forfeited if the LTESA is not called.
      </P>
      <P>
        For Round 6 (Long Duration Storage), the Trustee published a typical option premium range of
        $1.50–$3.00/MWh. A 100 MW / 800 MWh battery with 250 cycles/year (~73 GWh annual throughput) would
        therefore commit ~$110k–$220k/year in option premium until it triggered the LTESA — a small
        fraction of the project's economics.
      </P>

      <H2>The LDS variant — what's different in Round 6</H2>
      <P>
        The 5 February 2026 Round 6 result (1,171 MW / 11,980 MWh of long-duration storage) marks the first
        large-scale use of the LDS LTESA template. Key contractual changes versus standard LTESA:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Time-weighted reference price</Em> rather than dispatch-only RRP — to ensure the contract
          values the storage's flexibility, not just the energy it delivers.</li>
        <li><Em>Availability payment</Em> on top of the energy CFD — the project earns a flat $/MW/year
          payment for being available, irrespective of energy throughput.</li>
        <li><Em>Cycle floor</Em> — the contract requires a minimum of ~200 full-equivalent cycles per
          year, beneath which the availability payment is reduced.</li>
        <li><Em>Term up to 20 years</Em> — longer than firming LTESAs to match LDS asset economics.</li>
      </ul>

      <Callout type="numbers">
        Round 6 award sizes (5 Feb 2026): Great Western Battery (Neoen) 330 MW / 3,500 MWh — the single
        largest. Bowmans Creek BESS (Ark) 250 MW / 2,414 MWh. Bannaby BESS (BW ESS) 233 MW / 2,676 MWh.
        Plus Armidale East, Ebor and Kingswood. The cohort runs at 8.7–11.5 hour duration. Combined
        capacity (1,171 MW) is well within the legislated 2 GW LDS target by 2030.
      </Callout>

      <H2>LTESA vs CIS — the side-by-side</H2>
      <Table
        emphasizeFirst
        headers={['Test', 'CIS', 'LTESA']}
        rows={[
          ['Revenue certainty for lenders', 'Floor protects downside; ceiling caps upside', 'Pure fixed strike — both directions'],
          ['Upside retention for equity', '10% of upside above ceiling', 'No upside above strike'],
          ['Project bond timing', '20 days post-execution', 'More flexible per round'],
          ['First Nations enforcement', 'Merit criteria + soft compliance', 'Aboriginal Participation Plans (legally binding)'],
          ['Term', '12–15 years', '14–20 years (LDS up to 20)'],
          ['Geographic eligibility', 'Whole NEM + WEM', 'NSW only'],
          ['Stacking with corporate PPA', 'Easier (CFD references RRP, PPA can sit alongside)', 'Possible but requires careful attribution per MWh'],
        ]}
      />

      <Callout type="source">
        Sources: AEMO Services{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://aemoservices.com.au/" target="_blank" rel="noopener">tenders portal</a>{' '}·
        EII Act 2020 (NSW) — consolidated text · NSW EnergyCo Statement of Opportunity 2025 ·
        AEMO Services Round 6 LDS LTESA Tender Rules · Modo Energy <em>LTESA Round 6 secures enough
        long-duration storage to meet NSW Roadmap targets</em>{' '}·
        First Nations Clean Energy Network reports on APP compliance.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 4 — Round-by-Round
// ============================================================

function Lesson4() {
  return (
    <div>
      <H2>14 rounds, three-and-a-half years</H2>
      <P>
        Between May 2023 and May 2026 the two schemes ran 14 rounds (8 CIS + 6 LTESA), awarding
        underwriting to <Em>104 projects representing 28.3 GW</Em>. Every round refined the rules — single
        vs two-stage tendering, time limits, merit-criteria weighting, bond requirements, technology
        eligibility. This lesson walks through each round in chronological order, with the structural
        change it introduced.
      </P>

      <Callout type="info">
        Want the full project list for each round? The AURES{' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          Scheme Tracker
        </Link>{' '}
        lists every awarded project with its current delivery stage. The{' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          Boardroom briefing
        </Link>{' '}
        reframes the same data for executive presentation.
      </Callout>

      <H2>The CIS rounds</H2>
      <Table
        emphasizeFirst
        headers={['Round', 'Announced', 'Type', 'Awards', 'Capacity', 'Innovation introduced']}
        rows={[
          ['CIS Pilot — NSW', '23 Nov 2023', 'Dispatchable (NSW only)', '6 projects', '1,325 MW', 'First trial of the CISA structure. Used a draft contract template; later ratified.'],
          ['CIS Pilot — SA/VIC', '4 Sep 2024', 'Dispatchable', '6 projects', '995 MW', 'Extended the dispatchable template to a multi-state context. First "across NEM region" award.'],
          ['Tender 1 — NEM Generation', '11 Dec 2024', 'Generation (wind/solar/hybrid)', '19 projects', '6.4 GW', 'First mass-scale generation round. 84 bids received — 4× over-subscribed. First round to use formalised merit criteria.'],
          ['Tender 2 — WEM Dispatchable', '20 Mar 2025', 'Dispatchable (WA only)', '4 projects', '654 MW', 'First tender into the WEM. WA-specific design paper preceded.'],
          ['Tender 3 — NEM Dispatchable', '17 Sep 2025', 'Dispatchable', '16 projects', '4.1 GW', 'First time storage was the focus rather than generation. 4-hour minimum requirement introduced.'],
          ['Tender 4 — NEM Generation', '9 Oct 2025', 'Generation', '20 projects', '6.6 GW', 'Largest single-round capacity to date. 12 of the 20 awards were hybrid (solar + battery).'],
          ['Tender 5 — WEM Generation', '2 May 2026', 'Generation (WA only)', '7 projects', '1.9 GW', 'Used the new single-stage tender process. First WA generation round. 6 wind farms + 1 solar/battery hybrid (Trina Solar Killawarra).'],
          ['Tender 6 — WEM Dispatchable', '2 May 2026', 'Dispatchable (WA only)', '3 projects', '482 MW / 3.7 GWh', 'WA second dispatchable round. 6.9–8 hour batteries (longer-duration than prior dispatchable rounds).'],
        ]}
      />

      <H2>The LTESA rounds</H2>
      <Table
        emphasizeFirst
        headers={['Round', 'Announced', 'Type', 'Awards', 'Capacity', 'Innovation introduced']}
        rows={[
          ['Round 1 — Generation + LDS', '3 May 2023', 'Both', 'Multiple', '~700 MW', 'First LTESA round under EII Act. Established Consumer Trustee role at AEMO Services.'],
          ['Round 2 — Firming', '22 Nov 2023', 'Firming (BESS + gas)', '4 projects', '~720 MW', 'Co-delivered as the CIS Pilot — NSW (the same projects had federal CIS + state LTESA dual contracts).'],
          ['Round 3 — Generation + LDS', '19 Dec 2023', 'Both', 'Multiple', '~1.4 GW', 'First time Aboriginal Participation Plans were mandatory at award stage.'],
          ['Round 4 — Generation', '1 Jul 2024', 'Generation', '2 projects', '~310 MW', 'Smallest LTESA round. Flyers Creek (~140 MW) became the first LTESA project to begin operations (May 2025).'],
          ['Round 5 — Long Duration Storage', '27 Feb 2025', 'LDS', 'Multiple', '~570 MW', 'First LDS-specific round. Established the time-weighted reference price methodology.'],
          ['Round 6 — Long Duration Storage', '5 Feb 2026', 'LDS', '6 projects', '1,171 MW / 11,980 MWh', 'Largest LDES award to date. 8.7–11.5 hour batteries. Met NSW\'s 2 GW LDS legislated target on its own.'],
        ]}
      />

      <H2>The major rule changes</H2>

      <H3>2025 single-stage tender reform</H3>
      <P>
        In 2025 DCCEEW announced a major restructure of the CIS process: the previous two-stage flow (Stage
        A — eligibility and project bid, Stage B — financial bid) was collapsed into a single combined
        bid. This cut the total tender duration from approximately 9 months to 6 months. Tenders 5 and 6
        (May 2026) were the first rounds to use the new single-stage process. Pinsent Masons and HSF
        Kramer both flagged this as &ldquo;the largest procedural change&rdquo; since CIS launched.
      </P>

      <H3>Time limits for CISA execution</H3>
      <P>
        Following the AER's September 2025 finding that &ldquo;only half of CIS Tender 1 winners have made
        visible progress&rdquo;, DCCEEW added explicit time limits for executing the CISA after award.
        Successful proponents now have a contractually binding window (the exact duration is set per
        tender) to negotiate and sign the CISA. The Commonwealth may discontinue negotiations if the
        deadline is missed.
      </P>

      <H3>Project bond requirements</H3>
      <P>
        From CIS Tender 1 onwards, successful proponents must lodge a <Em>performance bond within 20
        business days</Em> of CISA execution. Failure to deliver the bond can result in re-tendering of
        the awarded capacity. The bond amount is typically calibrated to project scale and risk profile.
      </P>

      <H3>First Nations and Social Licence weighting</H3>
      <P>
        Merit criteria 4 (First Nations) and 7 (Social Licence) were strengthened in the Nov 2024
        guideline update. From CIS Tender 3 onwards proponents must publish their First Nations and
        Social Licence commitments within <Em>20 business days of CISA execution</Em> — a requirement
        that became the basis for the First Nations Clean Energy Network &ldquo;From Commitment to
        Delivery&rdquo; tracker. Tender 5 onwards added a dedicated First Nations participation criterion
        and labour disclosure requirements.
      </P>

      <H2>The cumulative effect</H2>
      <P>
        Each round's changes reflect lessons learned. The result is a system where:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>The procurement process is faster (6 months vs 9).</li>
        <li>Successful bidders face binding execution deadlines.</li>
        <li>Performance bonds protect the Commonwealth from non-delivery.</li>
        <li>First Nations engagement is embedded contractually, not just promised.</li>
        <li>The technology mix has expanded (1-hour storage T2 → 8h+ in T6 / LTESA R6).</li>
      </ul>

      <Callout type="warn">
        For a current bidder, the practical implication is that the rules of CIS Tender 7+ will not be
        the rules of Tender 1. Pricing benchmarks, project bond economics, and execution timelines all
        need to be drawn from the most recent comparable round, not from the earliest mass-scale rounds.
      </Callout>

      <Callout type="source">
        Sources: DCCEEW{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme/closed-cis-tenders" target="_blank" rel="noopener">Closed CIS tenders</a>{' '}·
        AEMO Services tender results · HSF Kramer{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://www.hsfkramer.com/notes/energy/2025-posts/cis-changes" target="_blank" rel="noopener">Major changes for CIS tender process</a>{' '}·
        Pinsent Masons{' '}
        <em>CIS streamlined by Australia federal government</em>{' '}·
        Modo Energy <em>LTESA Round 6 secures enough long-duration storage to meet NSW Roadmap targets</em>{' '}·
        Energy-Storage News{' '}
        <em>Western Australia awards 1.9 GW of renewables and 3.7 GWh of battery storage under CIS Tenders 5 and 6</em>{' '}·
        AURES{' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          Scheme Tracker
        </Link>{' '}
        for live project status.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 5 — Merit Criteria — and What They Cost
// ============================================================

function Lesson5() {
  return (
    <div>
      <H2>The seven merit criteria</H2>
      <P>
        From CIS Tender 1 onwards, proponents are scored on seven merit criteria. The exact weights vary
        per round, but the criteria themselves have been stable. Each criterion has both an <Em>obvious
        cost</Em> (what the proponent has to spend or commit to) and a <Em>hidden cost</Em> (the implicit
        $/MWh cost of meeting the bar to win).
      </P>

      <Table
        emphasizeFirst
        headers={['#', 'Criterion', 'What it scores', 'Typical weight']}
        rows={[
          ['MC1', 'Development progress', 'How advanced the project is — planning approval, grid connection studies, EPC tender, site control', '~15–20%'],
          ['MC2', 'Cost competitiveness', 'The bid price (floor / ceiling / strike)', '~25–30%'],
          ['MC3', 'System value', 'Location relative to REZs, dispatchability, contribution to system reliability', '~10–15%'],
          ['MC4', 'First Nations participation', 'Equity stake, procurement commitments, training programs, MoUs with traditional owners', '~10–15%'],
          ['MC5', 'Community benefit', 'Community benefit fund, local infrastructure contributions, regional employment programs', '~10%'],
          ['MC6', 'Local jobs & supply chain', 'Construction job count, local content (esp. Australian steel), apprenticeship targets', '~10%'],
          ['MC7', 'Social licence', 'Demonstrated community engagement, complaint resolution processes, transparency commitments', '~10%'],
        ]}
      />

      <H2>The implicit $/MWh cost</H2>
      <P>
        Each criterion has an implicit cost that doesn't appear in the bid price but materially affects
        the project's economics. Estimating these costs is one of the harder parts of bid construction —
        get them wrong and the bid is either uncompetitive (over-engineered social commitments) or wins
        the round but is unbankable (under-engineered ones).
      </P>

      <H3>MC4 — First Nations: ~$1–4/MWh</H3>
      <P>
        Typical commitments include 5–15% First Nations equity (often achieved via a non-recourse loan to
        the relevant Traditional Owner organisation, repaid out of project distributions), $0.5–3M/year
        community benefit funds for First Nations communities, and 1.5–10% First Nations procurement
        targets. The implied $/MWh cost depends heavily on the equity structure: a generous equity stake
        with a low-interest loan can cost the project ~$1–2/MWh in revenue dilution, while a procurement-only
        commitment is closer to $0.20–0.50/MWh.
      </P>

      <H3>MC5 — Community benefit: ~$0.50–2/MWh</H3>
      <P>
        Community benefit funds typically commit a flat $/MW/year or a share-of-revenue mechanism. Common
        benchmark: $1,000–$3,000/MW/year going to a local council or community trust. For a 200 MW solar
        farm at 30% CF, $2,000/MW/year = $400k/year against ~525,600 MWh = ~$0.76/MWh.
      </P>

      <H3>MC6 — Local jobs & supply chain: ~$2–8/MWh</H3>
      <P>
        Australian steel and local content commitments are the most expensive merit-criterion element.
        Steel made in Australia trades at a 15–25% premium to imported steel, and given that steel is 20–
        30% of total project capex, the implicit cost can be $2–6/MWh. For a typical 6–8% steel cost
        increment, on a project with $1.5M/MW capex and 30% CF over 25 years, the discounted cost works
        out to ~$3–5/MWh. Local labour and apprenticeship commitments add a further $0.5–1/MWh.
      </P>

      <H3>MC7 — Social licence: ~$0.20–1/MWh</H3>
      <P>
        Social licence is the cheapest merit criterion, but the cost has been rising as planning friction
        increases. Typical commitments include a community engagement officer, a 24/7 complaint hotline,
        annual transparency reports, and binding noise/visual amenity protections. Most of this is
        operational expenditure of $200–500k/year for a 200 MW project.
      </P>

      <H2>Total implicit social-licence cost</H2>
      <Callout type="numbers">
        Putting it together: a competitive bid in CIS Tender 4 or beyond likely commits roughly{' '}
        <Em>$3–10/MWh</Em> in implicit costs to win on MC4–MC7 alone. On a Generation CISA with floor
        $50/MWh, that means the project's effective floor (after social-licence costs) is ~$40–47/MWh —
        which is uneconomic for many wind projects unless the project has strong system value scoring on
        MC3 or genuine cost-competitive scoring on MC2. This is why the implicit cost of merit criteria
        matters so much for FID economics.
      </Callout>

      <H2>How to score MC1 — the development progress trap</H2>
      <P>
        Of all the merit criteria, MC1 is the most counter-intuitive. Proponents naturally want to bid
        their <Em>most advanced</Em> project to maximise MC1 scoring. But CIS is{' '}
        <Em>deliberately designed to support early-stage projects</Em> — DCCEEW Branch Head Mr Brine
        confirmed in April 2026 Senate Estimates that &ldquo;if they're at financial close, they probably
        don't need a lot of support from the federal government.&rdquo; The result is that the most-advanced
        project may not actually win its merit on MC1 because it doesn't &ldquo;need&rdquo; the support.
      </P>
      <P>
        The practical implication: MC1 rewards being <Em>far enough along to be deliverable, not so far
        along that the support is unnecessary</Em>. This is a narrow window — typically planning consent
        secured, grid connection studies underway, and EPC tender close to award. Projects that are ahead
        of this (FID-ready) often lose to projects in this sweet spot.
      </P>

      <H2>The MC2 / cost trade-off</H2>
      <P>
        MC2 (cost) is the largest single weight at ~25–30%. The temptation is to bid an aggressively low
        floor or strike to maximise MC2 scoring. But:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>A low floor reduces lender confidence — DSCR is calculated against the floor, so a floor of
          $35/MWh on a 30% CF project gives roughly half the DSCR cushion of a $50/MWh floor.</li>
        <li>If the contract is heavily ceiling-share, the proponent has given up most of the upside in
          high-price years — and CIS contracts are 12-15 years, so a couple of high-price years matter a
          lot to total NPV.</li>
      </ul>
      <P>
        The optimal MC2 bid depends on the proponent's risk appetite, capital structure, and view on
        future market prices. Aggressive MC2 bidding (low floor, high ceiling-share) is favoured by
        well-capitalised developers who can withstand under-recovery; conservative MC2 bidding (higher
        floor, lower ceiling-share) is favoured by project-finance-dependent developers needing high
        DSCR.
      </P>

      <Callout type="warn">
        Misreading the merit-criteria weights in any given round is the most common reason bids fail.
        Each round's exact weights are published in the tender rules — they have shifted between rounds
        — and proponents who use Tender 1's weights for a Tender 4 bid will systematically misallocate
        commitments.
      </Callout>

      <Callout type="source">
        Sources: DCCEEW <em>CIS guidelines</em> (each round has its own merit-criteria weights document) ·
        AEMO Services <em>Tender rules</em> per LTESA round · HSF Kramer{' '}
        <em>CIS update and the release of the Dispatchable CISA</em> · Senate Standing Committee on
        Environment & Communications, April 2026 Estimates · First Nations Clean Energy Network{' '}
        <em>From Commitment to Delivery</em> · Clean Energy Council Best Practice Charter.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 6 — Bidding Strategy & Project Financing
// ============================================================

function Lesson6() {
  return (
    <div>
      <H2>How a CISA changes the bankability picture</H2>
      <P>
        Renewable project finance lenders care about three things: cash flow predictability, downside
        protection, and term match between debt and revenue contract. A CISA shifts all three:
      </P>
      <Table
        emphasizeFirst
        headers={['Lender concern', 'Pre-CISA project', 'Post-CISA project']}
        rows={[
          ['Revenue predictability', 'Spot price + corporate PPA — basis risk persists', 'Floor protection — minimum revenue line is contractual'],
          ['Downside protection', 'Reliance on sponsor support letters or LGC bundling', 'Floor of $40–60/MWh provides DSCR floor under 1.10×–1.15× downside case'],
          ['Term match', 'Banks limit tenor to 5–7 years on merchant exposure', 'Term-match to 12–15-year CISA — banks comfortable with 12-year mini-perm or 15-year term'],
          ['Equity returns', 'IRR uncertain; high-price years deliver upside', 'IRR ranges narrow — ceiling-share caps upside but increases certainty of base case'],
          ['Refinancing', 'Limited — banks won\'t refinance merchant on long tenor', 'Strong — sponsor can refinance at lower cost post-construction once CISA is in operation'],
        ]}
      />

      <Callout type="key">
        The single biggest commercial implication of a CISA is that it lifts the debt:equity ratio a
        bankable project can carry. A typical merchant wind farm might raise 60% debt; the same project
        with a CISA can raise 70–75%. That ~10–15% additional debt is replaced equity, which means the
        equity sponsor's IRR can be ~3–6 percentage points higher for the same project economics.
      </Callout>

      <H2>The bid-strategy spectrum</H2>
      <P>
        Within the CIS framework, proponents face a strategic choice: bid an{' '}
        <Em>aggressive low-floor / high-ceiling-share</Em> structure (maximises upside but loses points
        on MC2), or a <Em>conservative high-floor / low-ceiling-share</Em> structure (better MC2 score
        but caps upside). The two ends of the spectrum:
      </P>

      <H3>Aggressive: low floor + share-the-upside</H3>
      <P>
        Low floor (e.g. $35–40/MWh), narrow gap to ceiling, high commonwealth share-above. This bid says
        &ldquo;I'm confident in market prices; give me the upside.&rdquo;
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>+ Strong MC2 scoring</li>
        <li>+ Less Commonwealth subsidy if market prices are high → easier political defence</li>
        <li>− Lower DSCR cushion → higher cost of debt, may need extra equity</li>
        <li>− Equity returns very sensitive to market scenario assumptions</li>
        <li>− Best suited to: well-capitalised IPPs, BESS projects with FCAS upside, projects with corporate PPA stacking</li>
      </ul>

      <H3>Conservative: high floor + retain-most-upside</H3>
      <P>
        Higher floor (e.g. $50–65/MWh), wider gap to ceiling, lower commonwealth share-above. This bid
        says &ldquo;give me the floor — I'll take less of the high-price upside in return.&rdquo;
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>+ Strong DSCR — lender appetite is highest here, lowest cost of debt</li>
        <li>+ Equity returns more predictable across scenarios</li>
        <li>+ Suits project-finance-dependent developers</li>
        <li>− Weaker MC2 scoring — risk of losing the round to aggressive bidders</li>
        <li>− Higher Commonwealth subsidy in low-price years → political pressure</li>
        <li>− Best suited to: greenfield wind projects with limited PPA optionality, regional projects</li>
      </ul>

      <H2>The PPA-stacking strategy</H2>
      <P>
        Most successful CIS bidders are not relying solely on the CISA. The mature strategy is to stack a
        corporate PPA <Em>under</Em> the CISA: use the CISA floor as a downside backstop, and sell some
        portion of the project's output to a corporate buyer at a higher price. The PPA payment is made
        net of any CISA top-up, meaning the proponent earns the higher of (a) PPA price for contracted
        volume or (b) CISA floor for uncontracted volume.
      </P>
      <P>
        Junction Rivers' (CIS Tender 1 hybrid, NSW, 585 MW + 800 MWh) is a good example of this strategy
        — the project has both a CISA and is in PPA negotiations with multiple corporate buyers. Coles'
        100% renewable PPA and Telstra's earlier deals with Murra Warra demonstrate the volume of
        corporate demand available to bid against.
      </P>

      <H2>The DSCR sensitivity test</H2>
      <P>
        Lenders run a Base + Downside DSCR analysis. With a CISA, the calculations look like this for a
        200 MW wind farm with ~30% CF and capex of ~$1.5M/MW:
      </P>
      <Callout type="numbers">
        <strong>Base case</strong> — RRP averages $80/MWh, project earns $80/MWh (between floor and
        ceiling). Annual revenue ≈ $42M. Operating costs ~$8M. EBITDA ~$34M. Debt service on $200M of
        debt at 7% over 12-year amortisation ≈ $25M/year. <Em>DSCR ≈ 1.36×</Em> — healthy.<br/>
        <strong>Downside case</strong> — RRP averages $35/MWh, CISA floor $50/MWh kicks in. Project still
        earns $50/MWh × 525,600 MWh = $26.3M revenue. Operating costs ~$8M. EBITDA ~$18.3M. Debt service
        ≈ $25M/year. <Em>DSCR ≈ 0.73×</Em> — failing.<br/>
        <strong>Implication</strong>: lenders won't size to the downside case; they'll require ~$60/MWh
        floor or smaller debt slug. This is the key bid-vs-bankability tension.
      </Callout>

      <H2>Why super funds win the equity</H2>
      <P>
        Australian super funds (IFM Investors, AustralianSuper, Aware Super) have been the dominant equity
        sponsors of CIS-backed projects in 2025–2026. The reason: the post-CISA project profile —
        long-tenor, low-volatility, contracted-revenue infrastructure — is exactly what super funds need
        for their unlisted infrastructure allocations. Their cost of capital (~6–8% real, target net IRR)
        is materially lower than independent IPP equity (target ~12–15% nominal IRR), which means they
        can price equity in a CISA-backed project at a premium that non-super-fund equity simply can't.
      </P>

      <H2>The stage-and-second-tender bidder pattern</H2>
      <P>
        A subtle pattern visible in CIS award lists: some developers bid their projects in two stages.
        Stage 1 gets a CISA for a portion of the capacity (say, 200 MW of a 500 MW project). The
        developer reaches FID and starts construction on Stage 1 with the CISA backing. Then they bid
        Stage 2 in a later tender — now with Stage 1 as evidence of execution capability, lower
        construction risk premium, and a more credible MC1 score.
      </P>
      <P>
        Liverpool Range Wind Farm Stage 1 (CIS Tender 4, 634 MW) follows this pattern — the broader
        Liverpool Range project is ~1.3 GW, and Tilt Renewables awarded the modification approval (Oct
        2024) for the larger project but bid Stage 1 first into Tender 4. Future tenders are expected to
        see Stage 2 bids from the same developer.
      </P>

      <Callout type="source">
        Sources: King & Wood Mallesons{' '}
        <em>Energy & Resources project finance series</em>{' '}·
        Norton Rose Fulbright{' '}<em>Project Finance Sourcebook</em>{' '}·
        Allens <em>Renewable Energy Finance updates</em>{' '}·
        Clean Energy Finance Corporation (CEFC)
        <em> investment principles</em>{' '}·
        Senate Estimates Apr 2026 (Mr Brine on early-stage targeting) ·
        BloombergNEF Energy Finance reports · Inframation Group renewables deal data ·
        AURES{' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          Scheme Tracker
        </Link>{' '}
        for project-by-project status.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 7 — Outcomes — Has It Worked?
// ============================================================

function Lesson7() {
  return (
    <div>
      <H2>The honest read</H2>
      <P>
        Three and a half years in, the verdict is mixed. The schemes have <Em>awarded</Em> 28.3 GW —
        more than any comparable program globally — but actually <Em>delivering</Em> projects is taking
        longer than initial timelines suggested. The CIS has not failed; it is working as designed. But
        the design was always going to test the system's ability to convert paper contracts into steel in
        the ground, and that test is still ongoing.
      </P>

      <H2>The AER September 2025 quarterly</H2>
      <P>
        The Clean Energy Regulator's September 2025 quarterly noted that of the 19 CIS Tender 1 awards
        (Dec 2024 announcement), <Em>only half had made visible progress</Em> by the 9-month mark. Wind
        in particular was struggling — no Tender 1 wind project had reached FID by that date. The press
        framing was harsh; the underlying reality was that 9 months is a short window even for a fast-
        track CISA execution timeline.
      </P>

      <Callout type="numbers">
        Tender 1 status as at May 2026 (per AURES Scheme Tracker):
        <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
          <li><Em>Operating</Em> — Mokoan Solar Farm (46 MW, VIC) — first T1 project to reach LGC approval</li>
          <li><Em>Construction</Em> — Goulburn River Solar Farm (450 MW, NSW); Palmer Wind Farm (288 MW,
            SA) — Tilt took FID Jan 2026</li>
          <li><Em>FID approaching</Em> — Goyder North (300 MW, SA), Sandy Creek Solar (700 MW, NSW),
            Valley of the Winds (936 MW, NSW)</li>
          <li><Em>Past 14-month threshold</Em> — most remaining T1 awards now sit in the &ldquo;likely
            failed&rdquo; bucket per the AURES tracker definition</li>
        </ul>
      </Callout>

      <H2>The Senate Estimates April 2026 testimony</H2>
      <P>
        Ms Alison Wiltshire (DCCEEW Branch Head, CIS Delivery & Governance) confirmed in April 2026 that{' '}
        <Em>~9 projects across all CIS rounds had reached financial close</Em> by that date, with executed
        CISAs. Mr Brine added the design-intent framing: &ldquo;If they're at financial close, they
        probably don't need a lot of support from the federal government.&rdquo; The implication — most
        signed projects expected to reach financial close in calendar year 2026.
      </P>

      <H2>The CISA execution proxy — First Nations publication</H2>
      <P>
        Because actual CISA execution dates are commercially confidential, the public proxy is the First
        Nations Clean Energy Network &ldquo;From Commitment to Delivery&rdquo; tracker. Under CIS Tender 3+
        rules, proponents must publish their First Nations and Social Licence commitments within 20
        business days of executing their CISA. Sustained absence of publication 6+ months after award is
        a strong signal the project has not executed.
      </P>
      <P>
        The FNCEN tracker shows ~9 CIS Tender 1 projects with published commitments as of May 2026 —
        consistent with the Senate Estimates testimony.
      </P>

      <H2>The "likely failed" definition and why it matters</H2>
      <Callout type="warn">
        AURES defines a project as <Em>likely failed</Em> if it is &gt; 14 months past round announcement
        without confirmed CISA execution and without a high-confidence dev_status indicator (like
        &ldquo;FID reached&rdquo; or &ldquo;construction&rdquo;). This is a probabilistic call, not a
        definitive judgment — projects in this bucket can and do recover. But the empirical pattern from
        comparable schemes globally (UK CfD, US PTC) is that contracts not executed within ~12-15 months
        of award have a materially elevated probability of never executing.
      </Callout>

      <P>
        As at May 2026, AURES classifies:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Across all 14 rounds</Em>: 5–6 projects in &ldquo;likely failed&rdquo; bucket (mostly Tender 1 cohort), ~5 GW worth.</li>
        <li><Em>Tender 3 (Sep 2025)</Em>: 8 months old — past the &ldquo;execution should be close&rdquo;
          mark but not past the threshold. Watch the next 6 months for CISA execution announcements.</li>
        <li><Em>Tender 4 (Oct 2025)</Em>: 7 months old — first execution window opens around mid-2026.</li>
        <li><Em>Tenders 5 + 6 (May 2026)</Em>: just announced. First CISA executions expected ~9–12 months
          from now.</li>
      </ul>

      <H2>What the next 6 months tell us</H2>
      <P>
        The critical question for the schemes is whether the second half of 2026 produces a wave of CISA
        executions and FIDs from the Tender 1 and Tender 3 cohorts. The signals to watch:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>FNCEN publications</Em> from Tender 3 winners — first executions expected from mid-2026.</li>
        <li><Em>Goyder North FID</Em> — Neoen has flagged construction start mid-2026 for the 300 MW T1
          award. FID in early-to-mid 2026 would be confirmation.</li>
        <li><Em>Valley of the Winds FID</Em> — ACEN's 936 MW NSW T1 project has IPC planning approval
          (June 2025) and is awaiting NSW EnergyCo grid connection rights. FID in 2026 is the test of
          whether the NSW grid connection process is unblocking.</li>
        <li><Em>Tender 7 announcement</Em> — DCCEEW has flagged a continued tender cadence. Tender 7's
          rule changes (if any) will reflect the lessons of Tender 1's execution problems.</li>
      </ul>

      <H2>The structural counter-argument</H2>
      <P>
        Some critics — particularly the Centre for Independent Studies and elements of the Coalition —
        argue that the CIS is structurally over-stretched and is creating a stranded-asset risk: locking
        in 32 GW of contracts at high strike prices that may prove uneconomic in a future where
        cannibalisation deepens and capacity factors decline. Their evidence: the AEMC's 2025 retail
        price forecast (5% dip then 13% rise over 5/10 years), the Eraring extension to April 2029
        (which suggests coal exit timelines are slipping), and the AER's slow progress finding.
      </P>
      <P>
        The defenders — DCCEEW, Bowen, and most of the renewable industry — argue that the CIS has
        already attracted the necessary investment that wasn't going to happen otherwise, and that the
        delivery problems are typical for an early-stage scheme that will improve with each round.
      </P>

      <H2>Where AURES sits</H2>
      <P>
        The AURES read: it's too early to conclude. The schemes have done what they were designed to do —
        move 28.3 GW of capacity into contracted form. Whether that translates into operating capacity by
        2030 depends on the next 18 months of CISA executions and FIDs. The {' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          AURES Scheme Tracker
        </Link>{' '}
        and the Boardroom briefing tab are designed to give a continuously-updated answer.
      </P>

      <Callout type="key">
        For a bidder reading this in 2026: the structure has worked, the rules have been refined four
        times, the WA tenders demonstrate the design is portable across markets, and the 2026 cohort of
        FIDs will determine whether this generation of schemes is reproducible globally. For an investor:
        the projects to back are those with planning approvals already locked in, established corporate
        PPAs, and developers with track records of CISA execution. For a policy-maker: the design is
        sound; the limiting factor is now the planning and grid-connection systems sitting around it.
      </Callout>

      <Callout type="source">
        Sources: AER quarterly statements (Sep 2025, Dec 2025) ·
        Senate Standing Committee on Environment & Communications, April 2026 Estimates ·
        First Nations Clean Energy Network{' '}
        <a className="text-[var(--color-primary)] hover:underline" href="https://www.firstnationscleanenergy.org.au/project_commitments" target="_blank" rel="noopener">From Commitment to Delivery tracker</a>{' '}·
        AEMC 2025 retail price forecast · Centre for Independent Studies <em>Eraring extension exposes
        Bowen's credibility gap</em> · RenewEconomy{' '}
        <em>Regulator says CIS Tender 1 projects are taking longer to land finance</em>{' '}·
        AURES{' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          Scheme Tracker
        </Link>{' '}
        and Boardroom briefing.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 8 (display position 3) — PPA × CISA Interactive Calculator
// ============================================================

/**
 * Interactive calculator for showing how a CISA settles against a
 * wind farm's actual realised revenue (PPA-covered MWh at strike +
 * merchant MWh at spot). Runs 8 spot-price scenarios in parallel and
 * decomposes each annual revenue stack into:
 *   - PPA revenue
 *   - Merchant revenue (positive or negative)
 *   - CISA floor top-up (subject to annual cap)
 *   - CISA ceiling clawback
 * Followed by a comprehensive interactions checklist.
 */

interface CalcInputs {
  capacityMw: number
  capacityFactor: number     // 0-1
  ppaStrike: number          // $/MWh
  ppaCoverage: number        // 0-1
  ppaTenor: number           // years
  cisaFloor: number          // $/MWh
  cisaCeiling: number        // $/MWh
  cisaAnnualCap: number      // $M/yr
  cisaTenor: number          // years
  curtailNegative: boolean   // wind farm curtails when spot < $0?
}

interface ScenarioResult {
  spotPrice: number
  generationMwh: number
  ppaRevenue: number
  merchantRevenue: number
  preCisaRevenue: number
  preCisaPerMwh: number
  cisaTopUpRaw: number       // uncapped — for showing where cap bites
  cisaTopUp: number          // after cap applied
  cisaClawback: number       // negative — paid to government
  totalRevenue: number
  effectivePerMwh: number
  capBites: boolean
}

function calcScenario(inputs: CalcInputs, spotPrice: number): ScenarioResult {
  // Annual generation = MW × 8760 × CF
  const annualGeneration = inputs.capacityMw * 8760 * inputs.capacityFactor
  // PPA / merchant split
  const ppaMwh = annualGeneration * inputs.ppaCoverage
  // For curtailment behaviour: if spot < 0 and project curtails, merchant volume drops to 0
  // (rough proxy — assume curtailment applies pro-rata to ~10% of hours when curtailing)
  const curtailmentFraction = (inputs.curtailNegative && spotPrice < 0) ? 0.10 : 0
  const merchantMwh = annualGeneration * (1 - inputs.ppaCoverage) * (1 - curtailmentFraction)
  // Effective annual generation for CISA settlement (account for curtailed MWh)
  const effectiveGeneration = ppaMwh + merchantMwh

  // Energy revenue
  const ppaRevenue = ppaMwh * inputs.ppaStrike            // always positive
  const merchantRevenue = merchantMwh * spotPrice          // positive or negative

  const preCisaRevenue = ppaRevenue + merchantRevenue
  const preCisaPerMwh = effectiveGeneration > 0 ? preCisaRevenue / effectiveGeneration : 0

  // CISA settlement — applied to effective generation
  // Floor top-up: gov pays when effective $/MWh below floor
  // Ceiling clawback: project pays when effective $/MWh above ceiling
  let cisaTopUpRaw = 0
  let cisaClawback = 0
  if (preCisaPerMwh < inputs.cisaFloor) {
    cisaTopUpRaw = (inputs.cisaFloor - preCisaPerMwh) * effectiveGeneration
  } else if (preCisaPerMwh > inputs.cisaCeiling) {
    cisaClawback = (preCisaPerMwh - inputs.cisaCeiling) * effectiveGeneration
  }
  // Apply annual cap (positive payments capped; clawback uncapped)
  const cap = inputs.cisaAnnualCap * 1_000_000
  const cisaTopUp = Math.min(cisaTopUpRaw, cap)
  const capBites = cisaTopUpRaw > cap

  const totalRevenue = preCisaRevenue + cisaTopUp - cisaClawback
  const effectivePerMwh = effectiveGeneration > 0 ? totalRevenue / effectiveGeneration : 0

  return {
    spotPrice,
    generationMwh: effectiveGeneration,
    ppaRevenue,
    merchantRevenue,
    preCisaRevenue,
    preCisaPerMwh,
    cisaTopUpRaw,
    cisaTopUp,
    cisaClawback: -cisaClawback,  // negative for stacking
    totalRevenue,
    effectivePerMwh,
    capBites,
  }
}

function PpaCisaCalculator() {
  const [inputs, setInputs] = useState<CalcInputs>({
    capacityMw: 200,
    capacityFactor: 0.38,
    ppaStrike: 70,
    ppaCoverage: 0.50,
    ppaTenor: 12,
    cisaFloor: 55,
    cisaCeiling: 130,
    cisaAnnualCap: 30,
    cisaTenor: 15,
    curtailNegative: true,
  })

  // 8 spot price scenarios spanning the realistic range
  const spotScenarios = useMemo(() => [-20, 10, 30, 50, 70, 100, 130, 160], [])

  const results = useMemo(() => spotScenarios.map(s => calcScenario(inputs, s)), [inputs, spotScenarios])

  // Format $M from $ value
  const m = (v: number) => (v / 1_000_000).toFixed(1)

  // Chart data — convert to $M for readability
  const chartData = results.map(r => ({
    spot: `$${r.spotPrice}`,
    PPA: Math.round(r.ppaRevenue / 1_000_000 * 10) / 10,
    Merchant: Math.round(r.merchantRevenue / 1_000_000 * 10) / 10,
    'CISA top-up': Math.round(r.cisaTopUp / 1_000_000 * 10) / 10,
    'CISA clawback': Math.round(r.cisaClawback / 1_000_000 * 10) / 10,
    Total: Math.round(r.totalRevenue / 1_000_000 * 10) / 10,
    EffectivePerMwh: Math.round(r.effectivePerMwh),
    CapBites: r.capBites,
  }))

  // Annual revenue at PPA + CISA only (no merchant), for reference line interpretation
  // Generation calc once
  const annualGen = inputs.capacityMw * 8760 * inputs.capacityFactor

  // Slider component (inline)
  const Slider = ({ label, value, min, max, step, onChange, format }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; format: (v: number) => string;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="font-mono font-semibold text-[var(--color-text)]">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-[var(--color-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
      />
    </div>
  )

  return (
    <div className="my-6 space-y-5">
      {/* Inputs */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 space-y-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          Inputs · adjust to see the revenue stack change
        </p>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Project</p>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            <Slider label="Capacity" value={inputs.capacityMw} min={50} max={500} step={10}
              onChange={(v) => setInputs({ ...inputs, capacityMw: v })}
              format={(v) => `${v} MW`} />
            <Slider label="Capacity factor (wind)" value={inputs.capacityFactor} min={0.20} max={0.50} step={0.01}
              onChange={(v) => setInputs({ ...inputs, capacityFactor: v })}
              format={(v) => `${(v * 100).toFixed(0)}%`} />
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic">
            Annual generation = {(annualGen / 1000).toFixed(0)} GWh
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">PPA — the arms-length offtake</p>
          <div className="grid sm:grid-cols-3 gap-x-6 gap-y-3">
            <Slider label="Strike price" value={inputs.ppaStrike} min={40} max={120} step={1}
              onChange={(v) => setInputs({ ...inputs, ppaStrike: v })}
              format={(v) => `$${v}/MWh`} />
            <Slider label="Volume coverage" value={inputs.ppaCoverage} min={0} max={1} step={0.05}
              onChange={(v) => setInputs({ ...inputs, ppaCoverage: v })}
              format={(v) => `${(v * 100).toFixed(0)}%`} />
            <Slider label="Tenor" value={inputs.ppaTenor} min={5} max={25} step={1}
              onChange={(v) => setInputs({ ...inputs, ppaTenor: v })}
              format={(v) => `${v} yrs`} />
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">CISA — the federal floor / ceiling CFD</p>
          <div className="grid sm:grid-cols-4 gap-x-6 gap-y-3">
            <Slider label="Floor strike" value={inputs.cisaFloor} min={30} max={100} step={1}
              onChange={(v) => setInputs({ ...inputs, cisaFloor: v })}
              format={(v) => `$${v}/MWh`} />
            <Slider label="Ceiling strike" value={inputs.cisaCeiling} min={80} max={200} step={1}
              onChange={(v) => setInputs({ ...inputs, cisaCeiling: v })}
              format={(v) => `$${v}/MWh`} />
            <Slider label="Annual cap (gov payment)" value={inputs.cisaAnnualCap} min={0} max={100} step={1}
              onChange={(v) => setInputs({ ...inputs, cisaAnnualCap: v })}
              format={(v) => `$${v}M`} />
            <Slider label="CISA tenor" value={inputs.cisaTenor} min={10} max={20} step={1}
              onChange={(v) => setInputs({ ...inputs, cisaTenor: v })}
              format={(v) => `${v} yrs`} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input
            type="checkbox"
            id="curtail"
            checked={inputs.curtailNegative}
            onChange={(e) => setInputs({ ...inputs, curtailNegative: e.target.checked })}
            className="cursor-pointer accent-[var(--color-primary)]"
          />
          <label htmlFor="curtail" className="text-[var(--color-text-muted)] cursor-pointer">
            Project curtails on negative-price hours (no merchant generation when spot {'<'} $0)
          </label>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
          Where the dollars come from — annual revenue by source, across spot-price scenarios
        </p>
        <p className="text-[10px] text-[var(--color-text-muted)] mb-4">
          Stacked bars decompose each annual revenue scenario. Dashed lines show floor (${inputs.cisaFloor}/MWh)
          and ceiling (${inputs.cisaCeiling}/MWh). Yellow cap warning appears when the CISA annual cap binds.
        </p>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }} stackOffset="sign">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="spot" tick={{ fontSize: 11, fill: 'rgb(148,163,184)' }}
              label={{ value: 'Annual avg spot capture price ($/MWh)', position: 'bottom', offset: -2, fill: 'rgb(148,163,184)', fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11, fill: 'rgb(148,163,184)' }}
              tickFormatter={(v) => `$${v}M`}
              label={{ value: 'Annual revenue', angle: -90, position: 'insideLeft', fill: 'rgb(148,163,184)', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgb(15,23,42)', border: '1px solid rgb(51,65,85)', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: 'rgb(241,245,249)', fontWeight: 600 }}
              formatter={(value, name) => [`$${Number(value).toFixed(1)}M`, String(name)]} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <ReferenceLine y={0} stroke="rgb(148,163,184)" />
            <Bar dataKey="PPA"            stackId="a" fill="#3b82f6" />
            <Bar dataKey="Merchant"       stackId="a" fill="#22c55e">
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.Merchant >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
            <Bar dataKey="CISA top-up"    stackId="a" fill="#a855f7" />
            <Bar dataKey="CISA clawback"  stackId="a" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>

        {/* Per-scenario summary table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs border-t border-[var(--color-border)]">
            <thead>
              <tr className="text-[var(--color-text-muted)]">
                <th className="text-left py-2 pr-3 font-semibold uppercase tracking-wider text-[10px]">Spot</th>
                <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">PPA</th>
                <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Merchant</th>
                <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">CISA</th>
                <th className="text-right py-2 px-2 font-semibold uppercase tracking-wider text-[10px]">Total</th>
                <th className="text-right py-2 pl-2 font-semibold uppercase tracking-wider text-[10px]">Eff. $/MWh</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => {
                const cisaNet = r.cisaTopUp + r.cisaClawback // clawback is already negative
                return (
                  <tr key={i} className="border-t border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]/30">
                    <td className="py-2 pr-3 font-mono text-[var(--color-text)]">${r.spotPrice}/MWh</td>
                    <td className="py-2 px-2 text-right font-mono text-[var(--color-text-muted)]">${m(r.ppaRevenue)}M</td>
                    <td className={`py-2 px-2 text-right font-mono ${r.merchantRevenue >= 0 ? 'text-[var(--color-text-muted)]' : 'text-red-400'}`}>
                      {r.merchantRevenue >= 0 ? '' : '−'}${Math.abs(parseFloat(m(r.merchantRevenue)))}M
                    </td>
                    <td className={`py-2 px-2 text-right font-mono ${cisaNet >= 0 ? 'text-purple-400' : 'text-orange-400'}`}>
                      {cisaNet >= 0 ? '+' : '−'}${Math.abs(parseFloat(m(Math.abs(cisaNet))))}M
                      {r.capBites && <span className="ml-1 text-amber-400" title="Annual cap binds — government payment limited">!</span>}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-semibold text-[var(--color-text)]">${m(r.totalRevenue)}M</td>
                    <td className="py-2 pl-2 text-right font-mono text-[var(--color-text)]">${r.effectivePerMwh.toFixed(0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {results.some(r => r.capBites) && (
            <p className="text-[10px] text-amber-400 mt-2 italic">
              <span className="font-bold">!</span> Annual cap binds in this scenario — government would owe more
              than the cap permits. The project absorbs the un-paid portion ($
              {m(results.find(r => r.capBites)!.cisaTopUpRaw - results.find(r => r.capBites)!.cisaTopUp)}M in the
              binding scenario).
            </p>
          )}
        </div>
      </div>

      {/* Reading-the-chart guide */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-2">Reading the chart</p>
        <ul className="text-sm text-[var(--color-text)] leading-relaxed list-disc list-inside space-y-1">
          <li><span className="font-mono text-blue-400">Blue</span> = PPA revenue. Flat across scenarios because PPA strike doesn't move with spot.</li>
          <li><span className="font-mono text-emerald-400">Green</span> = merchant revenue (spot &gt; 0). Slopes upward with spot price.</li>
          <li><span className="font-mono text-red-400">Red</span> = merchant LOSSES (spot &lt; 0). Only present in negative-spot scenarios when the project does not curtail.</li>
          <li><span className="font-mono text-purple-400">Purple</span> = CISA floor top-up. Appears when realised $/MWh falls below floor.</li>
          <li><span className="font-mono text-orange-400">Orange</span> = CISA ceiling clawback. Negative bar — project pays gov when realised $/MWh exceeds ceiling.</li>
        </ul>
      </div>
    </div>
  )
}

// ============================================================
// Lesson 8 (display Lesson 3) — the interactive lesson body
// ============================================================

function Lesson8() {
  return (
    <div>
      <H2>How a PPA and a CISA interact</H2>
      <P>
        Most CIS-contracted projects in the NEM also have a corporate or gentailer PPA over part of their
        output. The two contracts settle in different ways — but they interact, because the CISA
        settles on the project's <Em>realised</Em> revenue per MWh, not a hypothetical merchant-only
        scenario. Understanding the interaction is essential for both bid design (what CISA strike to
        bid, given an existing PPA structure) and for ongoing portfolio management (how the two
        contracts behave through wholesale-price cycles).
      </P>

      <H2>The model behind this calculator</H2>
      <P>
        The calculator models a wind farm with two revenue contracts running in parallel:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>An <Em>arms-length PPA</Em> covering a defined % of generation at a fixed $/MWh strike.
          The PPA buyer pays the strike regardless of where spot prices land. The volume not covered
          by the PPA flows to the merchant market at the prevailing spot price.</li>
        <li>A <Em>CISA</Em> applying to the project's full generation as a two-way floor + ceiling
          CFD: if the project's effective realised price (PPA + merchant blend) is below the floor,
          government tops up; if it's above the ceiling, the project pays government back. Top-ups
          are subject to an annual cap; clawbacks are uncapped.</li>
      </ul>
      <P>
        The output below shows annual revenue across eight spot-price scenarios — from heavily
        negative ($-20/MWh) through to scarcity ($160/MWh). For each scenario, the stacked bar
        decomposes revenue into PPA, merchant, CISA top-up, and CISA clawback.
      </P>

      <Callout type="info">
        <Em>Simplifications.</Em> The calculator treats spot price as an annual average capture price
        for the project. Real wind farms see substantial intra-year variation; the calculator
        captures the headline economics rather than the period-by-period settlement detail. It also
        assumes the CISA settles on realised revenue (PPA + merchant) — actual contracts sometimes
        settle on the regional reference price gross. Treat the calculator as a strategy tool, not a
        settlement engine.
      </Callout>

      <PpaCisaCalculator />

      <H2>Critical interactions — what to watch</H2>
      <P>
        Beyond the headline price levers, a dozen secondary interactions shape how PPA and CISA
        actually behave together. The list below is the comprehensive checklist for any project
        team designing or assessing a contract stack.
      </P>

      <H2>1. Volume / offtake amount alignment</H2>
      <P>
        The PPA covers a percentage of generation; the CISA covers all of it. The interaction matters:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Low PPA coverage (e.g. 30%)</Em> — most generation is merchant; CISA floor catches
          downside; the project is highly exposed to merchant-price upside (CISA ceiling caps it).</li>
        <li><Em>High PPA coverage (e.g. 90%)</Em> — most generation is at the PPA strike; if PPA
          strike is above CISA floor, the CISA rarely triggers floor make-up. If PPA strike is below
          CISA floor, the project effectively gets the higher of (PPA strike) and (CISA floor) for
          the PPA portion via the CISA mechanism.</li>
        <li><Em>100% PPA coverage</Em> — there is no merchant. The CISA only triggers if PPA strike
          itself is below floor or above ceiling. For all practical purposes, the project's revenue
          is just the PPA strike.</li>
      </ul>

      <H2>2. Tenor mismatch — what happens at PPA or CISA expiry</H2>
      <P>
        PPAs in Australia typically run 10-15 years; CISAs are 12-15 years for CIS (and 20 years for
        LTESA). When one expires before the other:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>PPA ends first (year 10), CISA continues (year 11-15):</Em> all generation becomes
          merchant; CISA floor protects downside; the project's residual revenue is closer to the
          CISA floor.</li>
        <li><Em>CISA ends first (year 12), PPA continues (year 13-15):</Em> the PPA-covered portion
          is unchanged; merchant portion is fully exposed; project IRR sensitivity to spot prices
          rises substantially in the post-CISA period.</li>
        <li><Em>Both end together:</Em> the project enters a fully merchant phase with all-spot
          exposure. Bankability of the post-PPA-post-CISA period is typically very poor.</li>
      </ul>

      <H2>3. $$ below $0 — the negative-price problem</H2>
      <P>
        This is one of the most important interactions and most commonly overlooked. When spot
        prices go negative (NSW solar midday hours, VIC oversupply periods), the merchant portion of
        the project's generation costs money to dispatch. The interactions:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Will the PPA buyer pay during negative-priced hours?</Em> Most PPAs explicitly
          require the buyer to pay strike regardless of spot — but some have "negative-price
          carve-outs" where the project absorbs losses below specified thresholds (e.g. spot
          below −$50/MWh).</li>
        <li><Em>Will the CISA settle on negative-priced generation?</Em> Most CIS contracts have a
          "floor below floor" provision — the floor does not extend infinitely down. Typically the
          CISA only pays make-up if realised price is between $0 and the floor; below $0 the
          project bears the losses.</li>
        <li><Em>Does the project curtail?</Em> If the PPA allows curtailment during negative
          prices, the project can simply turn off — avoiding the merchant loss. The CISA does not
          deem the curtailed energy (since it isn't generated).</li>
        <li><Em>Practical impact:</Em> a wind farm with high PPA coverage and a curtailment-friendly
          PPA is largely insulated from negative prices. A wind farm with low PPA coverage and a
          "must run" PPA exposed to negative prices can lose meaningful revenue. The calculator
          above toggles this with the "Project curtails on negative-price hours" checkbox.</li>
      </ul>

      <H2>4. CISA annual cap — when government's wallet has a floor of its own</H2>
      <P>
        The CISA annual cap is the maximum amount the government will pay in any one financial year.
        It's set per project in the bid evaluation, and it bites in extreme low-price scenarios:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Typical cap sizes:</Em> $20-50M for a 200-300 MW project; scales roughly with
          generation volume × (floor − expected merchant price).</li>
        <li><Em>When the cap binds:</Em> if realised price collapses far below the floor (e.g.
          high-renewables glut with negative midday prices and weak evenings), the make-up payment
          can exceed the cap. The project absorbs the shortfall — a partial uncovered downside
          even with a floor.</li>
        <li><Em>Cap design implications:</Em> bidders propose the cap as part of the CISA terms.
          Higher cap = more downside protection but more competitive pressure on the floor strike
          (lower) and may rank lower on the merit criteria.</li>
        <li><Em>Worked illustration:</Em> the calculator's yellow exclamation indicator shows when
          the cap binds in a scenario. Adjust the floor + cap sliders to see how the cap creates a
          "deductible" effect at very low spot prices.</li>
      </ul>

      <H2>5. Aggregation period — daily, monthly, annual</H2>
      <P>
        The settlement frequency of the CISA matters. Common variants:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Annual aggregation</Em> — average price for the year is computed; settlement is
          single annual amount. Smooths out within-year variability but defers cash to year-end.</li>
        <li><Em>Monthly aggregation</Em> — settlement each month based on that month's average.
          Better cash flow timing for the project; more administrative work.</li>
        <li><Em>Interval-level settlement</Em> — settlement per 30-minute period (matches AEMO).
          Most granular; treats each interval independently; can result in CISA paying make-up for
          some intervals while clawing back from others in the same day.</li>
      </ul>
      <P>
        For CIS, the contract typically settles annually with monthly progress reporting; LTESA
        settles monthly. The aggregation period affects timing of cash flows but rarely changes the
        total amount settled across the year.
      </P>

      <H2>6. The "reference price" choice</H2>
      <P>
        Critical fine print: what spot price does the CISA settle against?
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Regional reference price (RRP)</Em> — the AEMO regional spot price (e.g. Sydney
          West for NSW). This is the most common CISA reference. Means the project's actual
          capture price (which can be lower than RRP due to value-factor erosion) is NOT what
          settles. A project with capture price $50 and RRP $65 has the CISA based on $65 — even
          though it actually earned $50.</li>
        <li><Em>Project capture price</Em> — some contracts settle on actual realised revenue.
          More project-friendly but less common.</li>
        <li><Em>Hybrid reference</Em> — a mix; e.g. settlement on RRP × technology-specific value
          factor adjustment.</li>
      </ul>
      <P>
        For wind farms with value factors of 0.85-0.95 (typical), the choice of reference can move
        the effective CISA payment by 5-15% per MWh. This is one of the most negotiated single
        clauses in a CISA term sheet.
      </P>

      <H2>7. MLF treatment — gross or net of marginal loss factor</H2>
      <P>
        Closely related to the reference price question:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Settlement gross of MLF</Em> — CISA pays as if MLF were 1.0. The project's actual
          MLF (e.g. 0.92) reduces the realised income on each MWh, but the CISA still settles on
          the gross. Protects the project from MLF degradation risk.</li>
        <li><Em>Settlement net of MLF</Em> — CISA pays on actual settlement income (× MLF). The
          project absorbs MLF degradation through the life of the contract. Lower government cost
          but higher project risk.</li>
      </ul>
      <P>
        Most CIS contracts settle gross of MLF — a deliberate decision to insulate developers from
        the worst-case MLF erosion in declining REZ regions. Worth verifying for any specific
        contract.
      </P>

      <H2>8. Curtailment allocation — technical vs economic</H2>
      <P>
        Curtailment occurs when AEMO directs reduced output (technical) or when the project chooses
        to reduce output to avoid negative prices (economic). The CISA treatment of each matters:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Technical curtailment</Em> — most CISAs deem the project to have generated the
          curtailed energy (so the CISA still pays make-up against the deemed MWh). Protects
          project against operator-imposed losses.</li>
        <li><Em>Economic curtailment</Em> — most CISAs do NOT deem economic curtailment (since the
          project chose to reduce output to manage its own economics). Project absorbs the
          opportunity cost.</li>
        <li><Em>PPA curtailment treatment</Em> — varies by PPA. Most modern PPAs deem technical
          curtailment for the PPA-covered MWh as well; some require pro-rata reduction.</li>
      </ul>

      <H2>9. LGC treatment and bundling</H2>
      <P>
        The CISA does not typically pay for LGCs — LGCs are a separate revenue stream worth $5-15/MWh
        in 2026 (down from $90/MWh at 2017 peak). Most CIS contracts:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Leave LGCs to the project — they can be sold to the spot LGC market or bundled into a
          corporate PPA.</li>
        <li>If the PPA bundles LGCs (some do, some strip), the LGC revenue is captured at the PPA
          strike implicitly.</li>
        <li>Verify in any term sheet: who gets the LGCs, and at what price.</li>
      </ul>

      <H2>10. Annual cap interaction with merchant period</H2>
      <P>
        A subtle interaction: the annual cap is sized in dollars, but the make-up requirement varies
        by generation volume and price gap. In years where the project generates more (high wind
        year) <em>and</em> spot prices are low (oversupply), the un-capped make-up requirement can
        be much higher than the cap. The CISA effectively has a deductible in extreme scenarios.
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Use the calculator above to test: with high CF (45%) and low spot (-$20/MWh), does the
          cap bind?</li>
        <li>Project teams should size their downside reserves based on the worst-case-uncovered-
          shortfall, not just the floor strike.</li>
      </ul>

      <H2>11. Force majeure, change in law, and contract event triggers</H2>
      <P>
        Standard contract events affect both PPA and CISA. Interactions to verify:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Cyclone or major weather event</Em> — typically excused under both PPA and CISA;
          the project pays no penalty for undelivered energy.</li>
        <li><Em>Regulatory change</Em> — most PPAs and CISAs have change-in-law clauses but with
          different triggers and remedies. A change benefiting the project (e.g. new tax credit)
          may flow through differently in each contract.</li>
        <li><Em>Market design change</Em> — moves like the AEMC's 5-minute settlement rule
          implementation can trigger renegotiation clauses in some contracts.</li>
      </ul>

      <H2>12. Stacking with multiple PPAs or sleeved arrangements</H2>
      <P>
        Some projects have multiple PPA tranches (e.g. 30% to one corporate, 30% to another, 40%
        merchant). The CISA settles on the blended realised price across all tranches. This works
        cleanly when:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>All PPA settlement is documented and consistent</li>
        <li>The blended-price calculation is unambiguous</li>
        <li>The project doesn't try to use a "sleeved" PPA structure that obscures the actual
          revenue (which can cause CISA settlement disputes)</li>
      </ul>

      <H2>13. The bankability question</H2>
      <P>
        Lenders look at the combined PPA + CISA when sizing debt:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>PPA tenor &gt; debt tenor</Em> — preferred. Means PPA covers the entire debt
          amortisation period.</li>
        <li><Em>CISA tenor &gt; PPA tenor</Em> — even better. Provides revenue protection in
          the post-PPA period for the tail of debt amortisation.</li>
        <li><Em>CISA floor &lt; PPA strike</Em> — preferred. PPA is the primary revenue; CISA is
          backstop.</li>
        <li><Em>CISA cap appropriate for project size</Em> — cap should cover worst-case make-up
          on at least 80-90% of P90 generation × (floor − P90 spot price).</li>
      </ul>

      <H2>14. Strategic considerations at bid time</H2>
      <P>
        When designing your CISA bid (covered in Lesson 7), the PPA already-in-place shapes:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>How low to bid the floor</Em> — if a strong PPA already covers most generation at
          a price above expected merchant, the floor can be lower (less likely to trigger).</li>
        <li><Em>How high to bid the ceiling</Em> — if the project wants to retain upside, ceiling
          should be high. But high ceiling reduces merit-criteria score.</li>
        <li><Em>What annual cap to propose</Em> — higher cap = better protection but lower merit
          score. Calibrate to the worst-case downside the project can survive.</li>
        <li><Em>How to integrate with existing offtake</Em> — some bidders structure the CISA
          settlement reference to align with their PPA settlement, minimising basis risk between
          the two contracts.</li>
      </ul>

      <Callout type="key">
        The PPA × CISA combination is the most common modern contracting structure for Australian
        renewable projects. The calculator above shows the headline economics; the 14-point
        checklist captures the contractual interactions that determine whether the structure
        actually delivers the expected outcomes through real market scenarios. Before signing
        either contract, project teams should pressure-test each clause against the
        contract-event scenarios — particularly negative prices, MLF degradation,
        force majeure, and tenor mismatches.
      </Callout>

      <Callout type="source">
        Sources: Capacity Investment Scheme Contract Templates (DCCEEW) · NSW Long-Term Energy
        Service Agreement Template (EnergyCo) · King &amp; Wood Mallesons
        <em> CISA / PPA Interaction</em> 2024 · Norton Rose Fulbright <em>Sovereign Offtake
        Practice Notes</em> · AURES Scheme Tracker (live).
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
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-10 space-y-6">
      <Link to="/learn" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
        ← AURES Learning
      </Link>

      <div className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-3xl" aria-hidden>🎯</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            ✅ Available
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight"
          style={{ borderLeft: '4px solid #3b82f6', paddingLeft: 12, marginLeft: -12 }}>
          CIS & LTESA Bidding Parameters
        </h1>
        <p className="text-base italic text-[var(--color-text-muted)]">
          How sovereign-backed renewable underwriting auctions actually work.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          A 7-lesson deep dive into the mechanics of bidding into the federal Capacity Investment Scheme
          and NSW Long-Term Energy Service Agreements. The strike price, floor and ceiling parameters,
          merit criteria evolution, First Nations &amp; Social Licence requirements, project bonds, and
          how each round&rsquo;s changes interact with project finance and equity returns. Heavy use of
          AURES scheme-tracker data.
        </p>
      </div>

      <div className="space-y-3">
        {LESSONS.map(l => {
          const done = progress.has(l.id)
          return (
            <Link key={l.id} to={`/learn/cis-ltesa-bidding/${l.id}`}
              className="block bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors group">
              <div className="flex items-baseline gap-3">
                <span className="text-xs font-bold text-[var(--color-text-muted)]">Lesson {l.number}</span>
                {done && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">✓ Read</span>}
              </div>
              <h3 className="text-base font-bold text-[var(--color-text)] mt-1.5 group-hover:text-[var(--color-primary)]">{l.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">{l.subtitle}</p>
              <p className="text-[10px] text-[var(--color-text-muted)]/70 mt-1.5">{l.readingTime}</p>
            </Link>
          )
        })}
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
          See live AURES data alongside this module
        </p>
        <ul className="space-y-1 text-sm">
          <li>
            <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
              Scheme Tracker →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— project-by-project current status across all 14 rounds</span>
          </li>
          <li>
            <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
              Boardroom briefing →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— executive overview with PowerPoint export</span>
          </li>
        </ul>
      </div>

      <p className="text-[10px] text-[var(--color-text-muted)] text-center pt-4 border-t border-[var(--color-border)]">
        {LESSONS.filter(l => progress.has(l.id)).length} of {LESSONS.length} lessons read.
        Progress is stored in your browser only.
        <button onClick={() => { LESSONS.forEach(l => onMark(l.id, false)) }}
          className="ml-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] underline">
          Reset
        </button>
      </p>
    </div>
  )
}

function LessonView({ lesson, progress, onComplete }: {
  lesson: LessonMeta
  progress: Set<string>
  onComplete: (id: string) => void
}) {
  const navigate = useNavigate()
  const idx = LESSONS.findIndex(l => l.id === lesson.id)
  const prev = idx > 0 ? LESSONS[idx - 1] : null
  const next = idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 lg:py-10 space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-2 text-xs">
        <Link to="/learn/cis-ltesa-bidding" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← CIS &amp; LTESA Bidding
        </Link>
        <span className="text-[var(--color-text-muted)]">Lesson {lesson.number} of {LESSONS.length} · {lesson.readingTime}</span>
      </div>

      <div className="space-y-1 pb-4 border-b border-[var(--color-border)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Lesson {lesson.number}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight">{lesson.title}</h1>
        <p className="text-base italic text-[var(--color-text-muted)]">{lesson.subtitle}</p>
      </div>

      <article className="text-[15px] text-[var(--color-text-muted)]">
        {lesson.id === 'architecture'         && <Lesson1 />}
        {lesson.id === 'cis-mechanics'        && <Lesson2 />}
        {lesson.id === 'ppa-cisa-calculator'  && <Lesson8 />}
        {lesson.id === 'ltesa-mechanics'      && <Lesson3 />}
        {lesson.id === 'rounds'               && <Lesson4 />}
        {lesson.id === 'merit-criteria'       && <Lesson5 />}
        {lesson.id === 'finance-strategy'     && <Lesson6 />}
        {lesson.id === 'outcomes'             && <Lesson7 />}
      </article>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <button onClick={() => navigate(`/learn/cis-ltesa-bidding/${prev.id}`)}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors">
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => { onComplete(lesson.id); navigate(`/learn/cis-ltesa-bidding/${next.id}`) }}
            className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors">
            {progress.has(lesson.id) ? 'Continue' : 'Mark read & continue'} → {next.title}
          </button>
        ) : (
          <button onClick={() => { onComplete(lesson.id); navigate('/learn/cis-ltesa-bidding') }}
            className="text-sm px-4 py-2 rounded-lg bg-emerald-500 text-white hover:opacity-90 transition-colors">
            ✓ Mark complete &amp; back to module
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// Top-level component
// ============================================================

export default function CISLTESAModule() {
  const { lessonId } = useParams<{ lessonId?: string }>()
  const [progress, setProgress] = useState<Set<string>>(loadProgress)

  const onComplete = useCallback((id: string) => {
    setProgress(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      saveProgress(next)
      return next
    })
  }, [])

  const onMark = useCallback((id: string, done: boolean) => {
    setProgress(prev => {
      const next = new Set(prev)
      if (done) next.add(id)
      else      next.delete(id)
      saveProgress(next)
      return next
    })
  }, [])

  if (!lessonId) {
    return <ModuleIndex progress={progress} onMark={onMark} />
  }

  const lesson = LESSONS.find(l => l.id === lessonId)
  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-base text-[var(--color-text-muted)]">Lesson not found.</p>
        <Link to="/learn/cis-ltesa-bidding" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Back to module index
        </Link>
      </div>
    )
  }

  return <LessonView lesson={lesson} progress={progress} onComplete={onComplete} />
}
