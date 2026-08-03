/**
 * Reading the NEM — Essential Publications for Power Developers.
 *
 * Eight lessons on the free, high-quality intelligence that tells you
 * where to build, what to build, and when. The intelligence stack
 * (ISP / IASR / ESOO / TCPR / CIR / RIT-T / MT PASA / QED / GSOO / AER
 * SOEM / AEMC / CER) — with a developer's reading calendar and a
 * worked example that runs a 4-hour BESS in the CWO REZ through the
 * whole stack.
 */
import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-nem-pubs-progress'

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
}

const LESSONS: LessonMeta[] = [
  { id: 'stack',         number: 1, title: 'The Intelligence Stack',                             subtitle: 'Four horizons, four institutions, one interlinked map — before you open a single document.',              readingTime: '6 min' },
  { id: 'isp',           number: 2, title: 'The ISP — the 20-year map every developer needs',   subtitle: 'IASR → Draft ISP → Final ISP → Action Plan. Actionable vs Candidate. What ISP-endorsed actually means.',    readingTime: '8 min' },
  { id: 'iasr',          number: 3, title: 'The IASR — the assumptions that drive the ISP',     subtitle: 'Load forecast is the single most consequential number. GenCost, EV uptake, policy baseline.',              readingTime: '6 min' },
  { id: 'esoo',          number: 4, title: 'The ESOO — reliability gaps and commercial signal', subtitle: 'USE, RERT, energy vs capacity adequacy. Where a reliability gap becomes a BESS or gas investment case.',   readingTime: '7 min' },
  { id: 'network-layer', number: 5, title: 'The Network Layer — TCPR, CIR and RIT-T',           subtitle: 'What constraints surround your site, what they cost in congestion rent, and which augmentations will land.', readingTime: '8 min' },
  { id: 'near-term',     number: 6, title: 'MT PASA and QED — the near-term market view',       subtitle: 'Weekly supply-demand out to two years, plus the quarterly market scorecard. Real-time thesis checks.',    readingTime: '6 min' },
  { id: 'gsoo-aer',      number: 7, title: 'GSOO and AER — firming context and regulatory view', subtitle: 'Why gas prices set the BESS ceiling. AER SOEM, revenue determinations, AEMC and the CER.',                readingTime: '7 min' },
  { id: 'calendar',      number: 8, title: 'A developer’s reading calendar + worked example', subtitle: 'A twelve-month calendar and a full trip through the stack for a 4-hour BESS in Central-West Orana.',       readingTime: '10 min' },
]

// ============================================================
// Shared UI primitives
// ============================================================

function Callout({ type, children }: { type: 'info' | 'warn' | 'key' | 'numbers' | 'source'; children: React.ReactNode }) {
  const styles = {
    info:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    label: 'Note' },
    warn:    { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   label: 'Watch out' },
    key:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Key idea' },
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
  return <h2 className="text-lg font-bold text-[var(--color-text)] mt-8 mb-3">{children}</h2>
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
// Lesson 1 — The Intelligence Stack
// ============================================================

function Lesson1() {
  return (
    <div>
      <H2>Free, if you know where to look</H2>
      <P>
        Any developer, board member or investor with an internet connection can access a
        substantial fraction of the same market intelligence that expensive advisors resell. AEMO,
        the AER, the AEMC, the CER and the state agencies publish an interconnected set of documents
        that, read together, cover <Em>where transmission is going</Em> (ISP), <Em>whether the
        system will meet demand</Em> (ESOO), <Em>which network augmentations are actually being
        approved</Em> (RIT-T, TCPR), <Em>how the market is behaving right now</Em> (QED, MT PASA),
        and <Em>where regulatory boundaries are moving</Em> (AER, AEMC). This module is a map to
        that stack.
      </P>

      <H2>Four horizons</H2>
      <P>
        The publications differ in what they try to answer, which corresponds to how far ahead they
        look:
      </P>
      <Table
        emphasizeFirst
        headers={['Horizon', 'Question', 'Anchor publications']}
        rows={[
          ['20 years', 'Where will the system need to be?', 'Integrated System Plan (ISP), IASR, GSOO'],
          ['10 years',  'Will supply meet demand across weather years?', 'Electricity Statement of Opportunities (ESOO)'],
          ['2 years — weekly',  'Will supply meet demand week-by-week?', 'Medium-Term PASA (MT PASA)'],
          ['Quarterly / annual (backwards)', 'What actually happened, and what did it mean?', 'Quarterly Energy Dynamics (QED), AER State of the Energy Market, AEMC Annual Market Performance Review'],
        ]}
      />

      <H2>Four institutions</H2>
      <Table
        emphasizeFirst
        headers={['Institution', 'Role', 'What to expect']}
        rows={[
          ['AEMO', 'Market and system operator; forecasts and planning', 'The heaviest source: ISP, IASR, ESOO, GSOO, QED, MT PASA, TCPR, CIR — all AEMO'],
          ['AER (Australian Energy Regulator)', 'Economic regulation of networks; wholesale conduct oversight', 'State of the Energy Market annual review; TNSP revenue determinations; retail electricity price monitoring'],
          ['AEMC (Australian Energy Market Commission)', 'Rule-maker for the NEM', 'Annual Market Performance Review; rule-change consultations; the reason a market design shifts'],
          ['State agencies + CER', 'REZ delivery, LGCs, CIS/LTESA administration', 'EnergyCo NSW, VicGrid; Clean Energy Regulator LGC and CIS/LTESA milestone reporting'],
        ]}
      />

      <Callout type="key">
        <Em>The intelligence stack is a chain.</Em> The IASR sets the load and cost assumptions that
        the ISP uses to plan transmission that the ESOO tests for reliability that the TCPR reports
        connection-queue depth against that the CIR then shows congestion cost for. If any link
        moves &mdash; a new IASR load forecast, a new ISP scenario &mdash; the downstream links
        shift with it. That is why understanding the stack matters more than memorising any single
        publication.
      </Callout>

      <H2>The publication calendar in one glance</H2>
      <P>
        Exact dates drift year to year, but the rhythm is stable enough to plan against:
      </P>
      <Table
        emphasizeFirst
        headers={['Month', 'Publication', 'Cadence']}
        rows={[
          ['Feb–Mar', 'QED Q4 (prior year)', 'Quarterly'],
          ['May', 'QED Q1', 'Quarterly'],
          ['Jun', 'ISP Action Plan (annual update between full ISPs)', 'Annual'],
          ['Jul', 'AER Wholesale Electricity Market Performance Report', 'Annual'],
          ['Aug', 'ESOO (draft late-Jul, final late-Aug typical); QED Q2', 'Annual / quarterly'],
          ['Sep–Oct', 'AEMC Annual Market Performance Review', 'Annual'],
          ['Nov', 'QED Q3; AER State of the Energy Market', 'Quarterly / annual'],
          ['Dec–Jan', 'GSOO; MLF and TCPR annual releases', 'Annual'],
          ['Every 2 years', 'Full ISP (last: ISP 2024; next: ISP 2026)', 'Biennial'],
          ['Weekly', 'MT PASA (updated Tuesdays)', 'Weekly'],
        ]}
      />

      <P>
        Lesson 8 turns this list into a monthly reading calendar and then puts the whole stack to
        work on a single project. Lessons 2 through 7 take each publication family in turn.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 2 — ISP
// ============================================================

function Lesson2() {
  return (
    <div>
      <H2>What the ISP actually is</H2>
      <P>
        The Integrated System Plan is AEMO&rsquo;s biennial long-range plan for the NEM &mdash; a
        20-year, whole-of-system optimisation that identifies the transmission, generation and
        storage build the system needs under each of a small number of scenarios. It is the closest
        thing the NEM has to a master plan, and it is the document that shapes every subsequent
        planning decision.
      </P>

      <H2>The lifecycle — four documents, two years</H2>
      <Table
        emphasizeFirst
        headers={['Stage', 'What lands', 'Timing']}
        rows={[
          ['IASR (Inputs, Assumptions and Scenarios Report)', 'The inputs the ISP uses — load forecast, technology cost curves, policy settings per scenario. This is the foundational document, discussed in Lesson 3.', '~12 months before final ISP'],
          ['Draft ISP', 'AEMO’s optimisation output under each scenario. Consulted on.', '~6 months before final'],
          ['Final ISP', 'The published plan, with an Optimal Development Path per scenario.', 'Every 2 years (ISP 2022, ISP 2024, ISP 2026)'],
          ['ISP Action Plan', 'Annual update between full ISPs — tracks Actionable ISP Projects, flags any changes to scenario likelihood.', 'Annual (June)'],
        ]}
      />

      <H2>Three scenarios, and which one is the &ldquo;planning case&rdquo;</H2>
      <P>
        ISP 2024 modelled three scenarios: <Em>Step Change</Em> (the default planning case, and the
        one all Actionable ISP Projects are anchored to), <Em>Progressive Change</Em> (slower
        transition), and <Em>Green Energy Exports</Em> (a large export-industry additionality
        case). ISP 2026 keeps the same architecture with updated inputs.
      </P>
      <Callout type="warn">
        The scenario Australia&rsquo;s actually tracking is not published. AEMO&rsquo;s Optimal
        Development Path assumes Step Change materialises; deviations show up in QED and ESOO
        first. Reading the ISP and treating Step Change as forecast rather than as scenario is one
        of the more common analytical mistakes.
      </Callout>

      <H2>Actionable vs Candidate — the distinction that matters</H2>
      <P>
        The ISP labels each transmission project as either <Em>Actionable</Em> (proceed with
        pre-construction and RIT-T; committed to the plan) or <Em>Candidate</Em> (identified as a
        future need but not yet gated for delivery). The distinction determines whether TNSPs can
        actually spend money and progress the project. HumeLink, VNI West, Marinus Link Stage 1,
        Sydney Ring, New England REZ transmission and Central-West Orana REZ transmission are all
        Actionable in ISP 2024. Sydney Ring 2, Marinus Link Stage 2, and various REZ expansion
        works sit in the Candidate pool.
      </P>

      <Callout type="key">
        <Em>ISP-endorsed = REZ-in-plan.</Em> If a REZ appears in the ISP&rsquo;s Optimal Development
        Path with its transmission committed as Actionable, the site is inside the plan, capacity
        allocations exist, and the TNSP is accountable for the enabling works. If a REZ is not
        ISP-endorsed, developers connecting there fund most of the transmission themselves and take
        the timing risk.
      </Callout>

      <H2>What ISP 2024 said in headline form</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>~50 GW of new utility-scale renewable generation by 2035 under Step Change; ~30 GW of storage.</li>
        <li>Six coal stations to retire this decade; another five by 2035.</li>
        <li>Offshore wind contributing from ~2030 in the plan.</li>
        <li>Actionable transmission spend across the decade in the tens-of-billions range.</li>
      </ul>

      <H2>ISP limitations you should carry in your head</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>2-year publication lag</Em> — the ISP you&rsquo;re reading was consulted 12&ndash;18 months ago against IASR inputs that were locked before that.</li>
        <li><Em>Scenario uncertainty</Em> &mdash; the Optimal Development Path assumes Step Change materialises. Deviations from that read as delays even if the alternative scenario is arriving.</li>
        <li><Em>Does not name individual project winners</Em> &mdash; the ISP identifies capacity needs, not developers. Merit lies with CIS/LTESA and access rights.</li>
      </ul>
    </div>
  )
}

// ============================================================
// Lesson 3 — IASR
// ============================================================

function Lesson3() {
  return (
    <div>
      <H2>The IASR is where the ISP&rsquo;s conclusions actually live</H2>
      <P>
        The Inputs, Assumptions and Scenarios Report is published before every ISP and is arguably
        more important than the ISP itself. If you disagree with its load forecast or its
        technology cost curves, you should disagree with the ISP&rsquo;s conclusions. Read
        critically, the IASR tells you which assumptions the plan is <em>most sensitive to</em>
        &mdash; and therefore which ones to challenge.
      </P>

      <H2>What&rsquo;s in it</H2>
      <Table
        emphasizeFirst
        headers={['Input', 'What it shapes']}
        rows={[
          ['Load forecast (P10, P50, P90 by region and scenario)', 'The single most consequential number in the whole ISP chain. Everything downstream (ESOO, TCPR queue timing, RIT-T net benefits) uses this.'],
          ['CSIRO GenCost technology cost curves', 'Which technologies win in the Optimal Development Path. Sensitive to BESS and offshore wind assumptions in particular.'],
          ['Fuel cost trajectories (gas, coal)', 'Determines when incumbent thermal exits the merit order and how coal deferrals score.'],
          ['EV uptake by state', 'Both a load-adder (charging) and a demand-shape modifier (evening peaks).'],
          ['Rooftop solar trajectory', 'A demand modifier, not a supply-side input in the same way as utility solar — it shows up as reduced operational demand.'],
          ['Policy settings per scenario', 'Legislated 82% renewable target, CIS/LTESA capacity assumed, state schemes and offshore wind allocations.'],
          ['Coal exit trajectory', 'Assumed announced closures (Eraring, Yallourn, Bayswater, Loy Yang A/B, others) — with sensitivity if closures defer.'],
        ]}
      />

      <H2>Why the load forecast is load-bearing</H2>
      <P>
        Every reliability, congestion and revenue conclusion in the ISP chain traces back to how
        much electricity AEMO assumes the NEM will consume. A load forecast that turns out to be
        1&ndash;2% high per year compounds to a very different transmission and generation build.
        The most valuable analytical exercise you can do with the IASR is to substitute a different
        load assumption and mentally re-run the ISP conclusions.
      </P>

      <Callout type="numbers">
        <p>In practice this is easier than it sounds. If Step Change assumed +3.5%/yr operational
        demand growth and you think +1.5%/yr is more likely, you can approximately halve every
        &ldquo;new capacity needed&rdquo; figure the ISP publishes. The plan is close to linear in
        load growth at the margin.</p>
      </Callout>

      <H2>How to stress-test an ISP conclusion</H2>
      <P>
        Three moves a competent analyst uses:
      </P>
      <ol className="list-decimal list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Swap the scenario.</Em> Read what the same page of the ISP would say if Progressive Change were the operative scenario. The gap between the two is the plan&rsquo;s policy exposure.</li>
        <li><Em>Swap the GenCost point estimate for its range.</Em> BESS is the biggest lever here: 4-hour BESS at $500/kWh vs $700/kWh produces materially different transmission needs.</li>
        <li><Em>Age the coal-exit dates.</Em> If a station defers by two years, the reliability signal that ESOO carries also defers by two years, and every dispatchable capacity signal in ESOO and MT PASA weakens accordingly.</li>
      </ol>

      <Callout type="warn">
        <Em>What the IASR does not model:</Em> post-CIS merchant pricing dynamics, community
        opposition to specific projects, connection queue timing at individual substations, and
        marginal loss factor drift at specific nodes. It also uses the same demand assumptions
        the ESOO does &mdash; so an IASR error propagates into ESOO without acting as an
        independent check.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 4 — ESOO
// ============================================================

function Lesson4() {
  return (
    <div>
      <H2>The ESOO&rsquo;s job</H2>
      <P>
        The Electricity Statement of Opportunities is AEMO&rsquo;s annual 10-year probabilistic
        reliability assessment for the NEM. It looks at every year, every region, every weather and
        demand scenario, and asks: <Em>does forecast supply meet forecast demand to the reliability
        standard?</Em> Where it doesn&rsquo;t, that&rsquo;s a &ldquo;reliability gap&rdquo;. Every
        reliability gap is potentially a commercial opportunity for a dispatchable asset.
      </P>

      <H2>The reliability standard, and why 0.002% matters</H2>
      <Callout type="key">
        The NEM Reliability Standard is that expected <Em>Unserved Energy (USE)</Em> in any region
        must not exceed <Em>0.002% of the annual energy consumption</Em> of that region. It is
        remarkably tight &mdash; a 30-hour blackout across a whole state, once every three years,
        would breach it. When ESOO forecasts a region above the standard, AEMO is signalling that
        <Em> new dispatchable capacity has physical justification</Em>.
      </Callout>

      <H2>Reading the tables</H2>
      <P>
        The ESOO reports USE by year, by region, and by scenario &mdash; usually with a
        &ldquo;central case&rdquo; and a &ldquo;low-reserve&rdquo; case. The three things to look
        for:
      </P>
      <ol className="list-decimal list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Which regions are above the standard, in which years?</Em> States with USE flagged mid-decade are the near-term commercial opportunity.</li>
        <li><Em>Is the gap driven by demand growth or by supply retirements?</Em> ESOO breaks this out. Retirement-driven gaps are more binding because they cannot be deferred by demand-side response.</li>
        <li><Em>What committed capacity is already assumed?</Em> ESOO already counts committed projects. A gap remaining after those are counted is a real gap.</li>
      </ol>

      <H2>Energy adequacy vs capacity adequacy — the critical distinction</H2>
      <P>
        ESOO reports both: <Em>capacity adequacy</Em> (does peak MW meet peak demand?) and
        <Em> energy adequacy</Em> (does annual MWh serve annual demand across weather variance?).
        The two point at different investments:
      </P>
      <Table
        emphasizeFirst
        headers={['Signal', 'Peak-MW gap', 'MWh gap']}
        rows={[
          ['Investment case', 'Firm capacity — BESS, gas peaker, DR', 'Duration — long-duration storage, firmed VRE, expanded interconnectors'],
          ['Product it justifies', '2–4 hour BESS, gas peaker, firmed offtake', '6–24+ hour storage, pumped hydro, VRE + storage co-located'],
        ]}
      />

      <H2>RERT — the early-warning instrument</H2>
      <P>
        The Reliability and Emergency Reserve Trader is AEMO&rsquo;s backstop &mdash; contracted
        emergency reserves paid for out of consumer levies. When ESOO flags a region, AEMO
        typically procures RERT to cover the gap in the near term. <Em>RERT procurement is a
        real-time market signal that the ESOO gap is being taken seriously.</Em> RERT is not a
        substitute for new capacity; it is a bridge.
      </P>

      <H2>Historical accuracy — when to trust it, when to hedge</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Called correctly:</Em> the 2022 east-coast gas shortage and cascading price event was foreshadowed in the ESOO the year prior.</li>
        <li><Em>Missed:</Em> the SA 2019 issues (system security, not USE per se) were partially outside the ESOO&rsquo;s framing.</li>
        <li><Em>Recurring bias:</Em> the ESOO tends to be more conservative about renewable contribution to reliability than the operational data supports, which biases it toward flagging tighter capacity than turns out to be needed.</li>
      </ul>

      <Callout type="warn">
        <Em>Two limitations you should carry:</Em> ESOO does not forecast wholesale prices (that is
        the market&rsquo;s job) and does not model merchant competition (multiple dispatchable
        assets competing to fill the same gap). A flagged USE gap is a necessary but not sufficient
        condition for a good investment. The commercial question &mdash; will my project earn the
        return, or will three others show up alongside it? &mdash; the ESOO does not answer.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 5 — Network Layer
// ============================================================

function Lesson5() {
  return (
    <div>
      <H2>Three documents replace half a consulting bill</H2>
      <P>
        Developers used to pay consultants six-figure fees to answer three questions about a
        proposed connection: <Em>what constraints surround this site, what do they cost, and will
        the planned solution actually get built?</Em> Three publications now answer each of those
        directly &mdash; the TCPR, the CIR, and the RIT-T dockets. Reading them yourself is not a
        substitute for a specialist assessment, but it is close enough to route capital efficiently.
      </P>

      <H2>TCPR — the annual connection stocktake</H2>
      <P>
        The Transmission Connection and Planning Report (formerly NCPR) is AEMO&rsquo;s annual
        per-NSP adequacy assessment. For each NSP region &mdash; TransGrid, Powerlink, AusNet,
        ElectraNet, TasNetworks &mdash; it reports:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>Connection queue depth by node (how many projects are trying to connect where you are)</li>
        <li>Thermal capacity limits on key network elements</li>
        <li>System strength shortfalls and how they will be remediated (syncons, grid-forming inverter obligations)</li>
        <li>Planned network solutions and their approximate timing</li>
      </ul>
      <Callout type="key">
        <Em>Use the TCPR before the site option is even priced.</Em> It tells you whether the
        connection queue at your candidate node is 3-deep or 30-deep, whether system strength is
        already a bottleneck, and whether the local augmentation is proposed for 2027 or 2032.
        This is the difference between a $50m connection budget and a $500m one.
      </Callout>

      <H2>CIR — the constraint cost ledger</H2>
      <P>
        The Congestion Information Resource is AEMO&rsquo;s public dataset on binding constraints.
        For every material constraint it tracks: <Em>how often it binds</Em> (as a %), <Em>the
        shadow price when it does</Em> ($/MWh), and <Em>the annual market cost</Em> in $ millions.
        Constraint IDs are stable across years, so you can build multi-year trends.
      </P>
      <P>
        The direct developer use: identify which binding constraints affect your candidate
        connection point, and check whether the augmentation that would relieve them is in an
        approved RIT-T. If the biggest binding constraint at your node carries $50m+ of annual
        congestion rent and is due to be relieved in 2027, that&rsquo;s a strong signal for MLF
        improvement and higher realised prices post-augmentation. If the constraint has no
        augmentation planned, the depression persists indefinitely and needs to be priced in.
      </P>

      <Callout type="numbers">
        <p>For orientation, the CWO&ndash;Sydney family of binding constraints has run in the order
        of <Em>hundreds of millions of dollars a year</Em> in congestion cost during peak REZ
        buildup, driving the case for the CWO REZ transmission project. Reading the CIR annual
        summary against the ISP&rsquo;s Actionable Projects list is the single fastest way to
        understand where transmission capital is going and why.</p>
      </Callout>

      <H2>RIT-T — the four-stage augmentation process</H2>
      <P>
        The Regulatory Investment Test for Transmission is the formal approval process for major
        network augmentations, run by the TNSP under AER oversight:
      </P>
      <Table
        emphasizeFirst
        headers={['Stage', 'What lands', 'What it tells you']}
        rows={[
          ['Project Specification Consultation Report (PSCR)', 'The problem statement and the credible options', 'Whether the project is being formally scoped'],
          ['Project Assessment Draft Report (PADR)', 'Options analysis, net market benefit calculation', 'The preferred option and roughly its cost'],
          ['Project Assessment Final Report (PAFR)', 'The final option selected, with quantified benefits', 'This is the go/no-go signal for the project'],
          ['AER determination', 'Approves the RIT-T output and sets revenue treatment', 'The financial commitment is now made — the TNSP can spend'],
        ]}
      />

      <H3>Key current RIT-Ts worth tracking</H3>
      <Table
        emphasizeFirst
        headers={['Project', 'TNSP', 'Status']}
        rows={[
          ['HumeLink', 'TransGrid + EnergyCo (delivery)', 'Approved; under construction. Energisation stages through 2026–28.'],
          ['VNI West (KerangLink)', 'TransGrid + AusNet', 'Progressing through PADR/PAFR; delivery vehicle contested.'],
          ['Marinus Link Stage 1', 'TasNetworks (via Marinus Link)', 'Approved. Construction gated on funding arrangements.'],
          ['QNI Medium', 'Powerlink + TransGrid', 'Being progressed as an intermediate augmentation.'],
          ['Central-West Orana REZ transmission', 'ACEREZ consortium (NSW EII framework)', 'Under construction; energisation 2027.'],
          ['New England REZ transmission', 'TransGrid + EnergyCo', 'RIT-T progression slower; scope tension around wind allocation.'],
        ]}
      />

      <H2>REZ Development Plans as the state-level companion</H2>
      <P>
        <Em>EnergyCo NSW</Em> publishes annual REZ Development Plans covering CWO, New England,
        South-West, Hunter-Central Coast and Illawarra. <Em>VicGrid</Em> publishes equivalent REZ
        Investment Plans. Read alongside the TCPR and CIR they give the state-level view of what
        transmission is being funded through the consumer levy versus the regulated network revenue
        stream.
      </P>

      <Callout type="warn">
        The most common mistake reading network documents: treating an Actionable ISP designation
        or a PAFR-approved RIT-T as a delivery guarantee. Delivery still requires funding
        (regulated revenue reset), procurement (contractor availability), and physical build
        (planning approvals, easements, ROW access). HumeLink was <em>approved</em> years before it
        started construction and the gap between the two is where developer risk lives.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 6 — MT PASA + QED
// ============================================================

function Lesson6() {
  return (
    <div>
      <H2>The near-term view: two very different publications</H2>
      <P>
        MT PASA and QED sit at the short end of the intelligence stack. MT PASA is <Em>forward</Em>
        &mdash; a weekly-updated projection of the next 24 months (extended to 48 for peak
        summer/winter). QED is <Em>backward</Em> &mdash; a quarterly scorecard of what actually
        happened last quarter. Read together, they close the loop between the long-range plan and
        the market as it is.
      </P>

      <H2>MT PASA mechanics</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Published weekly, on Tuesdays.</Em> Every week, AEMO refreshes the outlook based on the latest generator availability, forecast demand and known outages.</li>
        <li><Em>Two years ahead by default, extended to four for peak seasons.</Em> The extension covers the periods where a shortfall is most likely to bind.</li>
        <li><Em>Probabilistic demand</Em> &mdash; MT PASA reports P10, P50 and P90 demand scenarios (10% chance of exceeding, median, 90% chance of exceeding).</li>
        <li><Em>Surplus vs deficit</Em> &mdash; the headline output. A negative reserve margin at P90 is a serious near-term signal.</li>
      </ul>

      <Callout type="key">
        <Em>MT PASA is the tightest near-term signal for a dispatchable asset.</Em> If summer 2026-27
        NSW shows P10 evenings with reserve margins going negative, that is where a 2-hour battery
        earns its highest scarcity revenue. AEMO also uses MT PASA to trigger RERT procurement,
        which itself becomes a public reservation of capacity.
      </Callout>

      <H2>QED — the quarterly scorecard</H2>
      <P>
        Quarterly Energy Dynamics is AEMO&rsquo;s comprehensive quarterly review. Each issue
        (published ~7 weeks after quarter-end) covers:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>Spot prices by region — average, peak, quantiles, negative price frequency.</li>
        <li>Generation mix by fuel — coal share, gas share, renewables share, storage discharge.</li>
        <li>Interconnector utilisation and price separation events.</li>
        <li>Demand vs forecast &mdash; both operational and underlying (i.e. adjusted for rooftop solar).</li>
        <li>Special features &mdash; each issue does one deep-dive on a market condition or event.</li>
      </ul>

      <H2>What each is good at, and what each hides</H2>
      <Table
        emphasizeFirst
        headers={['', 'MT PASA', 'QED']}
        rows={[
          ['Time direction', 'Forward, 2–4 years', 'Backward, prior quarter'],
          ['Best for', 'Identifying near-term dispatch scarcity; validating peak-season revenue assumptions', 'Tracking market share evolution (coal exit pace, BESS penetration, cannibalisation)'],
          ['Common misuse', 'Treating P50 surplus as a price forecast — it isn’t', 'Reading last quarter’s spot price as forward guidance — it isn’t'],
          ['Cadence match', 'Reset your dispatch case weekly during peak seasons', 'Re-read your investment thesis quarterly'],
        ]}
      />

      <H2>How the two combine in a stress test</H2>
      <P>
        For a 2-hour BESS bidding at merchant risk, the pair of documents gives you two independent
        signals: <Em>QED</Em> tells you whether the arbitrage spread was $80/MWh or $180/MWh last
        quarter (and how the trend is moving), and <Em>MT PASA</Em> tells you whether the coming
        summer peak will have the reserve margin to widen that spread further. If QED shows
        spread compression and MT PASA shows loose reserve, the base case tightens. If QED shows
        wide spread and MT PASA shows tight reserve, the base case is doing its job.
      </P>

      <Callout type="warn">
        Neither publication forecasts prices in the sense a merchant investor needs. Aurora, Modo
        and Cornwall Insight do. The MT PASA/QED pair tells you whether the <em>conditions</em> for
        the price forecast still hold &mdash; a much narrower and much cheaper question.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 7 — GSOO + AER + AEMC + CER
// ============================================================

function Lesson7() {
  return (
    <div>
      <H2>Why an electricity developer reads the GSOO</H2>
      <P>
        The Gas Statement of Opportunities looks like a gas document but drives an electricity
        conclusion. Gas is BESS&rsquo;s primary competing firming technology, and every gas price
        spike or supply-constraint moment is a moment the BESS revenue case works. Reading the GSOO
        is how you cross-check the assumed gas price behind your storage investment thesis.
      </P>

      <H2>What&rsquo;s in the GSOO</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>20-year east-coast gas supply outlook (Cooper, Gippsland, Surat, Bowen basins).</li>
        <li>Pipeline capacity by corridor and known constraint points.</li>
        <li>Domestic vs LNG-netback pricing linkage &mdash; the Queensland LNG trains set the effective east-coast domestic gas price via export parity.</li>
        <li>Declining conventional reserves and the imported LNG terminal question (Port Kembla, others).</li>
        <li>Winter demand forecast and the resulting risk of constraint in cold-snap periods.</li>
      </ul>

      <Callout type="key">
        <Em>Gas price is the BESS ceiling.</Em> A 2-hour battery in peak scarcity intervals earns
        the spread between its charging price and the price gas sets to serve the peak. If the
        GSOO says gas will run $16&ndash;25/GJ in winter (implied electricity firming cost roughly
        $80&ndash;120/MWh), that is the number your BESS case is pricing against. If the GSOO
        implies structurally lower gas prices &mdash; say, more LNG imports or new domestic supply
        &mdash; your BESS revenue case tightens.
      </Callout>

      <H2>AER State of the Energy Market</H2>
      <P>
        The AER&rsquo;s annual comprehensive review of both electricity and gas markets, published
        in November. Dry but valuable. The developer-relevant sections:
      </P>
      <Table
        emphasizeFirst
        headers={['Section', 'Why it matters']}
        rows={[
          ['Wholesale electricity market performance', 'Independent view of price formation, market power, bidding behaviour — a useful cross-check against AEMO’s QED.'],
          ['Network revenue and prices', 'The regulated revenue TNSPs are allowed to earn and spend — determines the pace of augmentation.'],
          ['New investment conditions', 'The AER’s read on whether the market is producing enough new build. When the AER says the answer is no, that’s a signal.'],
          ['Retail and small-customer', 'Less directly relevant for developers but useful for understanding the political economy of price policy.'],
        ]}
      />

      <H2>AER TNSP Revenue Determinations</H2>
      <P>
        Every five years each TNSP resets its regulated revenue with the AER. That reset determines
        how much the TNSP can spend on capex, how much on opex, and therefore how quickly it can
        actually build the augmentations the ISP identifies. The stagger:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>TransGrid (NSW) &mdash; current period through 2028.</li>
        <li>Powerlink (QLD) &mdash; current period through 2027.</li>
        <li>AusNet Services (VIC) &mdash; current period through 2027.</li>
        <li>ElectraNet (SA) &mdash; current period through 2028.</li>
        <li>TasNetworks (TAS) &mdash; current period through 2029.</li>
      </ul>
      <P>
        A revenue-reset year is a real gate for developer-relevant projects &mdash; the TNSP&rsquo;s
        capital programme depth for the coming five years is decided at the reset. If the
        augmentation you&rsquo;re counting on isn&rsquo;t in the approved capex, it isn&rsquo;t
        happening.
      </P>

      <H2>AEMC Annual Market Performance Review</H2>
      <P>
        The AEMC (the rule-maker for the NEM) publishes an annual review that combines a market
        health assessment with a summary of open and completed rule changes. Rule changes matter to
        developers because they redefine what&rsquo;s bankable &mdash; the recent moves on
        primary frequency response, integrated system security, transmission access reform and
        constraint framework rewrites all originated as AEMC processes. If a rule change is coming
        that affects your revenue model, the AEMC review is where you see it first.
      </P>

      <H2>Clean Energy Regulator publications</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>LGC supply-demand balance</Em> &mdash; the fading half of the RET era. Useful to size any residual LGC revenue in your stack.</li>
        <li><Em>LGCA register</Em> &mdash; every accredited generation source and its issuance history. A public record of who is generating what.</li>
        <li><Em>CIS/LTESA milestone tracking</Em> &mdash; the CER quarterly generation reports (Quarterly Carbon Market Report) now include CIS-supported project FID milestones. This is where you validate CIS delivery claims independently.</li>
      </ul>

      <Callout type="source">
        For the CIS/LTESA delivery angle specifically, pair the CER quarterly reports with the{' '}
        <Link to="/learn/cis-ltesa-verdict" className="text-[var(--color-primary)] hover:underline">
          CIS &amp; LTESA Verdict module
        </Link>{' '}
        and the AURES{' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          Scheme Tracker
        </Link>{' '}
        &mdash; the CER numbers are the primary source; those pages layer project-level attribution
        on top.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 8 — Calendar + worked example
// ============================================================

function Lesson8() {
  return (
    <div>
      <H2>The twelve-month calendar</H2>
      <P>
        A pragmatic reading rhythm for a developer or investor tracking the NEM. Cross-reference
        with the publication calendar in Lesson 1.
      </P>
      <Table
        emphasizeFirst
        headers={['Month', 'What lands', 'Depth of read']}
        rows={[
          ['January', 'Prior-year Q4 QED (~Feb); MLF reset consultation; TCPR annual', 'Deep read: MLF and TCPR set the operational year'],
          ['February', 'QED Q4 published (typical); MT PASA weekly rhythm', 'Scan QED headline; deep on any project-relevant nodes in TCPR'],
          ['March', 'IASR consultation (in ISP years); AEMO Congestion snapshot', 'Deep on IASR when in publication window (biennial)'],
          ['April', 'MLF reset final; ESOO methodology paper', 'Deep on MLF — direct revenue impact'],
          ['May', 'QED Q1; scheme results (CIS/LTESA)', 'Deep on scheme rounds; scan QED trend'],
          ['June', 'ISP Action Plan; Draft ISP (biennial); half-year AER updates', 'Deep on Action Plan or Draft ISP; skim rest'],
          ['July', 'AER Wholesale Electricity Market Performance Report; MT PASA', 'Scan AER wholesale report; watch MT PASA for summer prep'],
          ['August', 'Draft ESOO; QED Q2', 'Deep on draft ESOO — investment signal window'],
          ['September', 'AEMC Annual Market Performance Review; Final ESOO', 'Deep on final ESOO; scan AEMC for rule-change pipeline'],
          ['October', 'ISP AEMO Forum; TNSP Annual Planning Reports', 'Scan Forum outputs; deep on your local TNSP APR'],
          ['November', 'QED Q3; AER State of the Energy Market', 'Deep on AER SOEM — annual synthesis'],
          ['December', 'GSOO; Final ISP (biennial); reflection quarter', 'Deep on GSOO; deep on Final ISP when biennial'],
        ]}
      />

      <H2>Worked example — a 4-hour BESS in Central-West Orana</H2>
      <P>
        Suppose you are assessing a 200 MW / 800 MWh BESS at a candidate node in the CWO REZ. The
        publication stack gives you an evidence-based investment memo in about a day.
      </P>

      <H3>Step 1 — ISP: is the transmission actually coming?</H3>
      <Callout type="numbers">
        <p><Em>CWO REZ transmission is Actionable in ISP 2024</Em>, ACEREZ contract signed, first
        stage energisation targeted 2027. That means the congestion currently depressing revenues
        at the CWO nodes is on a defined relief path. <Em>The value uplift from a 2027 energisation
        is priced into any project whose commissioning aligns with or follows it.</Em></p>
      </Callout>

      <H3>Step 2 — ESOO: is there a reliability signal for dispatchable?</H3>
      <Callout type="numbers">
        <p>ESOO flags NSW as having <Em>USE risk in the second half of the decade</Em>, driven
        principally by Eraring&rsquo;s retirement (deferred, but the direction is fixed). A 2028
        commissioning date lands into the tightest window &mdash; the case for a scarcity-earning
        dispatchable asset in NSW is at its strongest exactly then.</p>
      </Callout>

      <H3>Step 3 — TCPR: is the connection queue viable?</H3>
      <Callout type="numbers">
        <p>TCPR reports <Em>a large connection queue in the CWO region</Em>. System strength is
        actively being managed via TransGrid synchronous condensers. This is a positive signal
        that the network is being scaled to accommodate connection, but the queue depth means:
        <em> get in early, and expect the enabling works to shape your commissioning date</em>.</p>
      </Callout>

      <H3>Step 4 — CIR: what does congestion currently cost?</H3>
      <Callout type="numbers">
        <p>CIR reports material congestion cost across the CWO-to-Sydney constraint family &mdash;
        an order of <Em>hundreds of millions of dollars a year</Em> during peak REZ buildup, and
        precisely the cost that the Actionable transmission is designed to relieve. The MLF at CWO
        nodes has been under pressure; the transmission relief should partially unwind that
        pressure post-2027.</p>
      </Callout>

      <H3>Step 5 — MT PASA: what does summer 2026-27 look like?</H3>
      <Callout type="numbers">
        <p>MT PASA shows <Em>tight reserve margins in NSW summer 2026-27 evenings</Em>, particularly
        under P90 demand. Every evening the reserve margin goes negative is an evening a
        dispatchable asset earns a scarcity premium. The near-term commercial signal is
        confirmed by the same window ESOO flagged medium-term.</p>
      </Callout>

      <H3>Step 6 — GSOO: what firming price does gas set?</H3>
      <Callout type="numbers">
        <p>GSOO&rsquo;s implied winter firming cost via gas peakers is in the region of
        <Em> $80&ndash;120/MWh</Em>. A 4-hour BESS with charging at $30&ndash;50/MWh (from midday
        cannibalisation) discharging into the evening peak clearing at $150&ndash;250/MWh has a
        gross spread the gas alternative cannot match at the peak &mdash; and the BESS competes
        away only its own contribution to the spread, not the whole peak.</p>
      </Callout>

      <H3>Step 7 — QED: what has the spread actually been?</H3>
      <Callout type="numbers">
        <p>Recent QEDs show <Em>NSW BESS revenues compressing</Em> as the state fleet expands
        (see the{' '}
        <Link to="/learn/bess-story" className="text-[var(--color-primary)] hover:underline">
          Solar + BESS module
        </Link>{' '}
        for the fleet-level dynamic). Merchant BESS revenue expectations for 2026 are on the order
        of <Em>$50&ndash;80k/MW/yr</Em>, materially below 2024-vintage forecasts above $100k. A
        200 MW battery therefore needs $10&ndash;16m/yr in gross revenue to underwrite. This is
        where the ESOO signal and the QED compression need to be weighed against each other.</p>
      </Callout>

      <H3>Step 8 — Scheme tracker: is CIS or LTESA support in play?</H3>
      <Callout type="numbers">
        <p>NSW batteries are eligible for the NSW LTESA firming rounds (LDS + Firming, not
        generation), and for CIS dispatchable tenders (T8, T10 forthcoming) if configured. A 4-hour
        BESS is below the LTESA LDS 8-hour threshold, so the LTESA path here is R7-style Firming
        rather than R5/R6/R9 LDS. See the{' '}
        <Link to="/learn/cis-ltesa-bidding" className="text-[var(--color-primary)] hover:underline">
          CIS &amp; LTESA Bidding module
        </Link>{' '}
        for how each product prices.</p>
      </Callout>

      <H2>What the publications collectively still don&rsquo;t tell you</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Merchant pricing competition.</Em> How many other 2-4 hour NSW batteries will bid into the same evening peak intervals — the QED shows historical spreads, not the equilibrium once your project is added.</li>
        <li><Em>Planning and social licence risk at your specific site.</Em> Neither AEMO nor AER models this — you assess it from EPBC records, state planning department outputs, and community engagement.</li>
        <li><Em>Actual connection timing at your specific node.</Em> The TCPR gives queue depth; the negotiation with the NSP determines your position and timing.</li>
        <li><Em>Turbine / equipment lead times and pricing.</Em> Publicly unavailable at any material precision.</li>
        <li><Em>Long-run price forecasts.</Em> That is Aurora, Modo, Cornwall Insight, Wood Mac territory.</li>
      </ul>

      <Callout type="key">
        <Em>The public stack answers roughly two-thirds of a competent investment memo.</Em> The
        remaining third &mdash; specific merchant competition, project-level planning risk,
        equipment supply chain, long-run price paths &mdash; is where the paid consultants and
        subscription services actually earn their fees. Knowing which third they&rsquo;re earning
        it for is what this module was built to teach.
      </Callout>

      <Callout type="source">
        <p>Companion AURES surfaces to pair with the public stack:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">Scheme Tracker</Link> — project-by-project CIS/LTESA status</li>
          <li><Link to="/intelligence/transmission-infra" className="text-[var(--color-primary)] hover:underline">Transmission &amp; REZ</Link> — TCPR and RIT-T summary layered on AURES data</li>
          <li><Link to="/intelligence/drift-analysis" className="text-[var(--color-primary)] hover:underline">Drift Analysis</Link> — capture price trend at the fleet level</li>
          <li><Link to="/learn/cis-ltesa-verdict" className="text-[var(--color-primary)] hover:underline">CIS &amp; LTESA Verdict</Link> — reads the same publications to a delivery critique</li>
          <li><Link to="/learn/nsw-rez" className="text-[var(--color-primary)] hover:underline">NSW REZs &amp; Transmission</Link> — the specific-REZ deep dive that anchors the CWO worked example</li>
        </ul>
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
          <span className="text-3xl" aria-hidden>📡</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            ✅ Available
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight"
          style={{ borderLeft: '4px solid #0ea5e9', paddingLeft: 12, marginLeft: -12 }}>
          Reading the NEM — Essential Publications for Power Developers
        </h1>
        <p className="text-base italic text-[var(--color-text-muted)]">
          The free, high-quality intelligence that tells you where to build, what to build, and when.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          AEMO, the AER, the AEMC and state agencies publish an interconnected set of documents
          that, read together, cover most of what expensive consultants resell. Eight lessons take
          each publication family in turn — ISP, IASR, ESOO, TCPR/CIR/RIT-T, MT PASA/QED,
          GSOO/AER/AEMC/CER — and close with a twelve-month reading calendar and a full worked
          example that runs a 4-hour BESS in the Central-West Orana REZ through the whole stack.
        </p>
      </div>

      <div className="space-y-3">
        {LESSONS.map(l => {
          const done = progress.has(l.id)
          return (
            <Link key={l.id} to={`/learn/nem-publications/${l.id}`}
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
            <Link to="/intelligence/transmission-infra" className="text-[var(--color-primary)] hover:underline">
              Transmission &amp; REZ intelligence →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— TCPR + RIT-T summary layered on AURES data</span>
          </li>
          <li>
            <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
              Scheme Tracker →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— every CIS + LTESA project, status, counterparty</span>
          </li>
          <li>
            <Link to="/intelligence/drift-analysis" className="text-[var(--color-primary)] hover:underline">
              Drift Analysis →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— capture-price trend at the fleet level, the QED signal at project granularity</span>
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
        <Link to="/learn/nem-publications" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← Reading the NEM
        </Link>
        <span className="text-[var(--color-text-muted)]">Lesson {lesson.number} of {LESSONS.length} · {lesson.readingTime}</span>
      </div>

      <div className="space-y-1 pb-4 border-b border-[var(--color-border)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Lesson {lesson.number}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight">{lesson.title}</h1>
        <p className="text-base italic text-[var(--color-text-muted)]">{lesson.subtitle}</p>
      </div>

      <article className="text-[15px] text-[var(--color-text-muted)]">
        {lesson.id === 'stack'         && <Lesson1 />}
        {lesson.id === 'isp'           && <Lesson2 />}
        {lesson.id === 'iasr'          && <Lesson3 />}
        {lesson.id === 'esoo'          && <Lesson4 />}
        {lesson.id === 'network-layer' && <Lesson5 />}
        {lesson.id === 'near-term'     && <Lesson6 />}
        {lesson.id === 'gsoo-aer'      && <Lesson7 />}
        {lesson.id === 'calendar'      && <Lesson8 />}
      </article>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <button onClick={() => navigate(`/learn/nem-publications/${prev.id}`)}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors">
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => { onComplete(lesson.id); navigate(`/learn/nem-publications/${next.id}`) }}
            className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors">
            {progress.has(lesson.id) ? 'Continue' : 'Mark read & continue'} → {next.title}
          </button>
        ) : (
          <button onClick={() => { onComplete(lesson.id); navigate('/learn/nem-publications') }}
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

export default function NEMPublicationsModule() {
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
        <Link to="/learn/nem-publications" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Back to module index
        </Link>
      </div>
    )
  }

  return <LessonView lesson={lesson} progress={progress} onComplete={onComplete} />
}
