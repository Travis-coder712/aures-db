/**
 * Start Here — The AURES Sampler.
 *
 * Seven short lessons (~25 min total): six "one killer idea per source
 * module" pieces that each stand alone as insight, and a seventh lesson
 * that runs an interactive Choose-Your-Own-Adventure navigator — pick a
 * persona, get a 3–5 module reading path with rationale and time estimate.
 *
 * Designed as the recommended entry point to the AURES Learning
 * curriculum. Appears first in the LEARNING_MODULES array.
 */
import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-start-here-progress'

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
  { id: 'cost-dial',      number: 1, title: 'The cost dial',                          subtitle: 'Consumers, taxpayers, investors — one dial, three positions. It moves with the political cycle.',                readingTime: '3 min' },
  { id: 'cannibalisation', number: 2, title: 'Every technology destroys its own price signal', subtitle: 'The arithmetic that ties solar, wind and BESS together into a single story.',                     readingTime: '3 min' },
  { id: 'rez-two-sided',  number: 3, title: 'A REZ is a two-sided market',            subtitle: 'Transmission gets procured on one side, access rights get auctioned on the other. Both sides settle by 2030.', readingTime: '3 min' },
  { id: 'hornsdale',      number: 4, title: 'Hornsdale — the Twitter bet',            subtitle: 'How a 100-day dare in 2016 rewrote what everyone assumed batteries could do in a wholesale market.',           readingTime: '3 min' },
  { id: 'intel-stack',    number: 5, title: 'The intelligence stack in one map',      subtitle: 'The free public documents that answer most of a competent investment memo. AEMO, AER, AEMC, CER.',              readingTime: '3 min' },
  { id: 'zero-for-15',    number: 6, title: 'Zero for 15',                            subtitle: 'The single most diagnostic finding across the entire CIS + LTESA record. What it tells us.',                   readingTime: '3 min' },
  { id: 'navigator',      number: 7, title: 'Choose your own adventure',              subtitle: 'Pick what you\'re here to do. Get a 3–5 module reading path with rationale and time estimate.',                readingTime: '5 min' },
]

// ============================================================
// Shared UI primitives — matched to the other modules
// ============================================================

function Callout({ type, children }: { type: 'info' | 'warn' | 'key' | 'numbers' | 'source'; children: React.ReactNode }) {
  const styles = {
    info:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    label: 'Note' },
    warn:    { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   label: 'Watch out' },
    key:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'The idea' },
    numbers: { bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  text: 'text-purple-400',  label: 'The number' },
    source:  { bg: 'bg-slate-800/40',   border: 'border-slate-600/40',   text: 'text-slate-300',   label: 'Go deeper' },
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

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-3">{children}</p>
}

function Em({ children }: { children: React.ReactNode }) {
  return <span className="text-[var(--color-text)] font-semibold">{children}</span>
}

// ============================================================
// Lesson 1 — The cost dial
// ============================================================

function Lesson1() {
  return (
    <div>
      <H2>Every argument about the energy transition sits on one question</H2>
      <P>
        The transition costs money that current market prices do not produce, and{' '}
        <Em>someone has to bear it</Em>. There are only three candidates: consumers, through prices
        or levies; taxpayers, through contracts and contingent liabilities; or investors, through
        losses.
      </P>
      <P>
        It does not have to be one of them, and it will not stay the same forever. It is a dial,
        not a switch, and it moves with the political and capital cycle.
      </P>

      <Callout type="key">
        <Em>Bill relief and the CIS collar are the same decision expressed twice:</Em> consumers
        are not to bear it visibly, and taxpayers are to bear it contingently and later. Whatever
        remains lands on investors &mdash; not by agreement, not priced at bid, and not
        sustainably. The 90% collapse in Australian wind lending in 2025 is what that looks like
        from the capital side.
      </Callout>

      <Callout type="source">
        The full argument &mdash; how the dial got here, what the CIS mechanism did specifically,
        why the wind cohort collapsed &mdash; is in the{' '}
        <Link to="/learn/cis-ltesa-verdict" className="text-[var(--color-primary)] hover:underline">
          CIS &amp; LTESA — The Verdict
        </Link>{' '}
        module (10 lessons, 55 min). Lesson 1 opens with this framing; the rest of the module
        walks through the evidence.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 2 — Cannibalisation
// ============================================================

function Lesson2() {
  return (
    <div>
      <H2>The arithmetic underneath three technologies</H2>
      <P>
        Utility solar earns less than the pool because every solar farm generates at the same
        moment, and the coincident output pushes midday prices toward zero. Grid batteries earn
        the spread between charging and discharging &mdash; and every battery added narrows that
        spread. Wind erodes its own capture in high-wind intervals and, at scale, the overnight
        price.
      </P>
      <P>
        The pattern reads the same in each case: <Em>every technology destroys the price signal
        that funds it</Em>. This is not a contract design problem. It is the arithmetic of adding
        zero-marginal-cost supply into a market that clears on marginal cost.
      </P>

      <Callout type="numbers">
        <p>NEM-wide BESS revenue in May 2026: <Em>$29k/MW/yr</Em> &mdash; an all-time low since
        Modo began tracking in July 2022. The battery fleet quadrupled in twelve months
        (2 GW &rarr; 8 GW) and competed away the arbitrage that justified it.</p>
      </Callout>

      <Callout type="key">
        It is only fatal because demand growth is zero. NEM demand growth has fallen from{' '}
        <Em>+5.2% in early 2024 to 0.0%</Em>. With 3&ndash;4% annual growth &mdash;
        electrification, industrial load, data centres &mdash; cannibalisation is absorbed by a
        growing market and all three revenue problems ease substantially without any change to
        contract design.
      </Callout>

      <Callout type="source">
        The solar-specific version of the argument (mechanism, value factor by state, the rooftop
        compounding force) is in the{' '}
        <Link to="/learn/solar-cannibalisation" className="text-[var(--color-primary)] hover:underline">
          Solar Cannibalisation
        </Link>{' '}
        module (5 lessons, 35 min). The three-tech unification appears as Lesson 7 of the{' '}
        <Link to="/learn/cis-ltesa-verdict/three-tech" className="text-[var(--color-primary)] hover:underline">
          CIS &amp; LTESA Verdict
        </Link>{' '}
        module.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 3 — REZ as two-sided market
// ============================================================

function Lesson3() {
  return (
    <div>
      <H2>Not a coloured polygon</H2>
      <P>
        A Renewable Energy Zone (REZ) is a planning construct, not a technical one. It is a
        geographic polygon declared by the NSW Government under the Electricity Infrastructure
        Investment Act 2020, inside which two things happen simultaneously: <Em>coordinated
        transmission infrastructure</Em> is built to evacuate the area&rsquo;s renewable resource,
        and <Em>access rights</Em> to that transmission are auctioned to project developers.
      </P>
      <P>
        Outside a REZ, a renewable project still has to apply for connection to TransGrid the
        old-fashioned way &mdash; and increasingly, the answer is &ldquo;not for five years&rdquo;.
      </P>

      <Callout type="key">
        <Em>A REZ is a two-sided market.</Em> On one side, NSW (via the Consumer Trustee at AEMO
        Services) procures shared transmission infrastructure, paying for it through a regulated
        levy on every NSW retail customer&rsquo;s bill. On the other side, generators bid for
        access to that transmission via an Access Scheme tender &mdash; paying for the right to
        connect to it. Both sides are designed to be in steady state by 2030.
      </Callout>

      <Callout type="numbers">
        <p>NSW has declared <Em>five REZs</Em> &mdash; Central-West Orana, New England, South-West,
        Hunter-Central Coast, Illawarra. Central-West Orana was first out: transmission energisation
        targeted 2027, ACEREZ consortium delivering, access-rights tender <Em>4&times;
        oversubscribed</Em>, 3.56 GW of the 3.98 GW capacity granted at first tender.</p>
      </Callout>

      <Callout type="source">
        The full REZ + transmission story &mdash; per-REZ deep dives, the TNSP backbone (Project
        EnergyConnect, HumeLink, VNI West), where projects actually live or die &mdash; is in the{' '}
        <Link to="/learn/nsw-rez" className="text-[var(--color-primary)] hover:underline">
          NSW REZs &amp; Transmission
        </Link>{' '}
        module (7 lessons, 70 min).
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 4 — Hornsdale
// ============================================================

function Lesson4() {
  return (
    <div>
      <H2>A dare with a deadline</H2>
      <P>
        On <Em>28 September 2016</Em> a severe storm knocked out five 275 kV transmission lines in
        South Australia. The whole state went dark. The political fallout ran for months. Then, in
        March 2017, a Twitter exchange between Atlassian&rsquo;s Mike Cannon-Brookes, Tesla&rsquo;s
        Elon Musk and Neoen collapsed months of policy debate into 100 words:{' '}
        <Em>Tesla would install the world&rsquo;s largest battery in South Australia within 100
        days of contract signing, or it would be free</Em>.
      </P>
      <P>
        The battery was installed in less than 100 days. It was called the Hornsdale Power
        Reserve. It commissioned in December 2017. And what it did next quietly reshaped market
        orthodoxy: it started earning more from frequency control (FCAS) than from the wholesale
        arbitrage it had been sold on, and it captured multi-second events that no other asset
        class could physically respond to.
      </P>

      <Callout type="key">
        The Hornsdale FCAS revenue was <Em>the surprise that mattered</Em>. It made every
        subsequent battery in Australia bankable on more than the spot spread alone &mdash; and
        every large investor started asking whether a similar asset in a similar constraint would
        do the same thing. Nine years and 8 GW of NEM battery fleet later, the answer is: yes,
        for a while, until enough batteries arrived to compete away the FCAS spreads too. Cf.
        Lesson 2.
      </Callout>

      <Callout type="source">
        The full arc &mdash; the rooftop boom that created the cannibalisation, the cannibalisation
        that created the BESS opportunity, and the BESS deployment now compressing its own spread
        &mdash; is in the{' '}
        <Link to="/learn/bess-story" className="text-[var(--color-primary)] hover:underline">
          Solar + BESS in the NEM
        </Link>{' '}
        module (12 lessons, 120 min). Hornsdale is Lesson 5.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 5 — The intelligence stack
// ============================================================

function Lesson5() {
  return (
    <div>
      <H2>The best-kept public secret in Australian energy</H2>
      <P>
        AEMO, the AER, the AEMC, the CER and the state agencies publish an interconnected set of
        documents that, read together, cover <Em>most of what you need for a competent investment
        memo</Em>. Any developer, board member or investor with an internet connection can access
        the same market intelligence that expensive advisors resell.
      </P>

      <div className="overflow-x-auto my-4">
        <table className="w-full text-sm border border-[var(--color-border)] rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-[var(--color-bg-elevated)]">
              <th className="text-left p-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Horizon</th>
              <th className="text-left p-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Question</th>
              <th className="text-left p-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Publication</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[var(--color-border)]">
              <td className="p-3 text-xs text-[var(--color-text)] font-semibold">20 years</td>
              <td className="p-3 text-xs text-[var(--color-text-muted)]">Where will the system need to be?</td>
              <td className="p-3 text-xs text-[var(--color-text-muted)]">ISP, IASR, GSOO</td>
            </tr>
            <tr className="border-t border-[var(--color-border)]">
              <td className="p-3 text-xs text-[var(--color-text)] font-semibold">10 years</td>
              <td className="p-3 text-xs text-[var(--color-text-muted)]">Will supply meet demand?</td>
              <td className="p-3 text-xs text-[var(--color-text-muted)]">ESOO</td>
            </tr>
            <tr className="border-t border-[var(--color-border)]">
              <td className="p-3 text-xs text-[var(--color-text)] font-semibold">2 years — weekly</td>
              <td className="p-3 text-xs text-[var(--color-text-muted)]">Any near-term scarcity?</td>
              <td className="p-3 text-xs text-[var(--color-text-muted)]">MT PASA</td>
            </tr>
            <tr className="border-t border-[var(--color-border)]">
              <td className="p-3 text-xs text-[var(--color-text)] font-semibold">Quarterly + annual</td>
              <td className="p-3 text-xs text-[var(--color-text-muted)]">What actually happened?</td>
              <td className="p-3 text-xs text-[var(--color-text-muted)]">QED, AER State of the Energy Market</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="key">
        <Em>The stack is a chain.</Em> The IASR sets assumptions the ISP uses to plan transmission
        the ESOO tests for reliability the TCPR reports connection-queue depth against the CIR
        then shows congestion cost for. If any link moves, the downstream links shift with it. That
        is why understanding the <em>stack</em> matters more than memorising any single publication.
      </Callout>

      <Callout type="source">
        Full treatment &mdash; each publication family in turn, a twelve-month reading calendar,
        and a worked example that runs a 4-hour BESS in Central-West Orana through eight
        publications in sequence &mdash; is in the{' '}
        <Link to="/learn/nem-publications" className="text-[var(--color-primary)] hover:underline">
          Reading the NEM
        </Link>{' '}
        module (8 lessons, 58 min).
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 6 — Zero for 15
// ============================================================

function Lesson6() {
  return (
    <div>
      <H2>The one number that tells the delivery story</H2>
      <P>
        The federal Capacity Investment Scheme awarded thirty-one wind projects across its first
        four tenders, totalling <Em>13.7 GW</Em>. That is close to the whole wind build that ISP
        2024 says Australia needs to reach FID within a couple of years.
      </P>
      <P>
        As of March 2026 &mdash; well over a year after the largest of those awards, and eighteen
        months after some of them &mdash; the number of CIS-supported wind projects that had begun
        construction was:
      </P>

      <div className="text-center my-6">
        <div className="inline-block bg-red-500/10 border border-red-500/30 rounded-xl px-8 py-6">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-red-400 mb-1">CIS wind at construction, March 2026</div>
          <div className="text-5xl font-bold text-[var(--color-text)]">0 of 15</div>
        </div>
      </div>

      <P>
        The number is now three of thirty-one, only two of which are in the NEM. Every project
        that has reached FID had <Em>contracted revenue on top of the CIS floor</Em> &mdash; a
        bilateral PPA with a creditworthy offtaker, a gentailer balance sheet, or staged expansion
        of an already-financed site. <em>None</em> reached FID on the CISA alone.
      </P>

      <Callout type="key">
        That is the empirical core of the whole question. It says the CISA is <em>not</em> a
        financing instrument. It is a <Em>risk-reduction overlay on a project that must already
        be financeable by other means</Em>. Every subsequent policy conclusion in the Verdict
        module follows from this one observation.
      </Callout>

      <Callout type="source">
        The full argument &mdash; six design choices that were individually defensible but jointly
        fatal, the macro turn (capex +50%, curve &minus;30%, demand growth to 0.0%, wind lending
        &minus;90%), and nine ranked policy fixes &mdash; is in the{' '}
        <Link to="/learn/cis-ltesa-verdict" className="text-[var(--color-primary)] hover:underline">
          CIS &amp; LTESA Verdict
        </Link>{' '}
        module. The specific state-of-play numbers are in Lesson 8 of that module.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 7 — Choose Your Own Adventure navigator
// ============================================================

type Persona = 'developer' | 'investor' | 'analyst' | 'curious'

interface PathStep {
  module: string
  href: string
  time: string
  why: string
}

interface PersonaPath {
  label: string
  icon: string
  intro: string
  steps: PathStep[]
  totalTime: string
  pivotAdvice: string
}

const PATHS: Record<Persona, PersonaPath> = {
  developer: {
    label: 'I develop projects',
    icon: '🏗️',
    intro: 'Site selection, connection, planning, and revenue underwriting. The path optimises for what you need to close a specific project — pick a site, get it approved, get it connected, get the offtake.',
    steps: [
      { module: 'NSW REZs & Transmission Infrastructure', href: '/learn/nsw-rez',           time: '70 min', why: 'Where projects actually live or die. The five NSW REZs plus the TNSP backbone (PEC, HumeLink, VNI West).' },
      { module: 'AEMO Connection Process',                href: '/learn/aemo-connections',  time: '65 min', why: 'The technical gate — 7-stage journey, GPS negotiation, system studies. Why 12-month became 36–50 month.' },
      { module: 'Planning Approvals',                     href: '/learn/planning-approvals',time: '75 min', why: 'The parallel gate — EPBC, state SSD, community engagement, the failure modes that kill projects.' },
      { module: 'CIS & LTESA Bidding Parameters',         href: '/learn/cis-ltesa-bidding', time: '80 min', why: 'The underwriting layer — CISA mechanics, PPA×CISA interactive calculator, merit criteria evolution.' },
      { module: 'PPAs',                                   href: '/learn/ppas',              time: '70 min', why: 'The offtake layer — corporate PPA volume, gentailer positioning, contract structures.' },
    ],
    totalTime: '~6 hours across five modules',
    pivotAdvice: 'Start with NSW REZs if you\'re still picking a site. Start with CIS & LTESA Bidding if you have a site and need to price the bid.',
  },
  investor: {
    label: 'I underwrite / invest',
    icon: '💰',
    intro: 'The path optimises for capital-allocation questions — is this scheme working? does this project convert? what does the delivery evidence say? — rather than for how to build a specific project.',
    steps: [
      { module: 'CIS & LTESA — The Verdict',              href: '/learn/cis-ltesa-verdict', time: '55 min', why: 'The delivery critique of the CIS + LTESA. Every FID had a bilateral PPA on top of the CISA. The three-tech divergence.' },
      { module: 'Solar Cannibalisation',                  href: '/learn/solar-cannibalisation', time: '35 min', why: 'Why solar earns less than the pool, why co-location only delays the problem, what would actually fix it.' },
      { module: 'Valuing Projects',                       href: '/learn/valuing-projects',  time: '80 min', why: 'The valuation frameworks — DCF, comparables, capture-price adjustment, the mistakes that turn up in memos.' },
      { module: 'Project Financing',                      href: '/learn/project-financing', time: '75 min', why: 'Debt sizing, DSCR conventions, non-recourse structures, the interplay with CIS/LTESA structures.' },
      { module: 'Reading the NEM',                        href: '/learn/nem-publications',  time: '58 min', why: 'The public intelligence stack — ISP / ESOO / TCPR / CIR / MT PASA / QED / GSOO. What replaces the paid consultancies.' },
    ],
    totalTime: '~5 hours across five modules',
    pivotAdvice: 'Read Verdict first if you\'re trying to decide whether the CIS is investable at all. Read Valuing Projects first if you already have a project in front of you.',
  },
  analyst: {
    label: 'I analyse the market',
    icon: '📈',
    intro: 'The path optimises for understanding how the market works and what the data says — origins, mechanisms, key numbers, ongoing dynamics. Less about a specific project, more about the whole system.',
    steps: [
      { module: 'The Energy Transition in the NEM',        href: '/learn/energy-transition', time: '195 min', why: 'The full arc — privatisation, the gentailer era, the RET, the carbon-price years, the Coal Closure Decade, external drivers. Sets the frame for everything else.' },
      { module: 'Solar + BESS in the NEM',                 href: '/learn/bess-story',        time: '120 min', why: 'The dominant new-build configuration. Rooftop boom → cannibalisation → BESS → spread saturation, with live AURES data.' },
      { module: 'NEM Constraints & Constraint Equations',  href: '/learn/constraints',       time: '90 min',  why: 'How dispatch actually clears. Shift factors, constraint types, IDs, market impacts. The technical spine every analyst needs.' },
      { module: 'Reading the NEM',                         href: '/learn/nem-publications',  time: '58 min',  why: 'The public data + planning stack in a developer\'s calendar. Great as a reference back to your other work.' },
    ],
    totalTime: '~7.5 hours across four modules',
    pivotAdvice: 'The Energy Transition module is the founding one. If you have limited time, read that plus Reading the NEM for the reference layer, then return to Solar + BESS and Constraints as needed.',
  },
  curious: {
    label: 'I\'m just curious',
    icon: '👀',
    intro: 'The path optimises for the shortest tour of the most surprising material — high signal-to-effort. About four hours end-to-end, but each module stands alone.',
    steps: [
      { module: 'The Energy Transition in the NEM',       href: '/learn/energy-transition', time: '195 min', why: 'The founding story. Written to be readable straight through — the modules that follow all reference it.' },
      { module: 'Solar Cannibalisation',                  href: '/learn/solar-cannibalisation', time: '35 min', why: 'The shortest module. Answers the question "why does solar earn less than the pool?" in five lessons.' },
      { module: 'CIS & LTESA — The Verdict',              href: '/learn/cis-ltesa-verdict', time: '55 min', why: 'A working note distilled to ten lessons. Reads like an argument, not a textbook.' },
      { module: 'Summing It Up',                          href: '/learn/summing-it-up',     time: '45 min', why: 'The synthesis lesson at the end of the curriculum. Best read after any two or three others as a way to see how they fit together.' },
    ],
    totalTime: '~5.5 hours across four modules — but any single one is a self-contained read',
    pivotAdvice: 'If you only read one, read The Energy Transition. If you have 35 minutes, read Solar Cannibalisation.',
  },
}

function Lesson7() {
  const [selected, setSelected] = useState<Persona | null>(null)

  return (
    <div>
      <H2>Pick what you&rsquo;re here to do</H2>
      <P>
        Four personas below, each with a suggested reading path through the curriculum. Click one
        to reveal the path, with rationale for each module and a total time estimate.
      </P>
      <P>
        You are free to ignore all of this &mdash; every module stands alone and can be read in
        any order. The paths are shortcuts, not prescriptions.
      </P>

      <div className="grid sm:grid-cols-2 gap-3 my-6">
        {(Object.keys(PATHS) as Persona[]).map(p => {
          const path = PATHS[p]
          const isSelected = selected === p
          return (
            <button
              key={p}
              onClick={() => setSelected(isSelected ? null : p)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                isSelected
                  ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]'
                  : 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>{path.icon}</span>
                <span className={`text-sm font-bold ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`}>
                  {path.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-5 my-5">
          <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
            <h3 className="text-base font-bold text-[var(--color-text)]">
              {PATHS[selected].icon} {PATHS[selected].label}
            </h3>
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {PATHS[selected].totalTime}
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed mb-4">
            {PATHS[selected].intro}
          </p>

          <ol className="space-y-3">
            {PATHS[selected].steps.map((s, i) => (
              <li key={s.href} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 flex items-center justify-center text-xs font-bold text-[var(--color-primary)]">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <Link to={s.href} className="text-sm font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] hover:underline">
                      {s.module} →
                    </Link>
                    <span className="text-[10px] text-[var(--color-text-muted)]">{s.time}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{s.why}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] italic">
              <span className="text-[var(--color-text)] font-semibold">Where to start:</span>{' '}
              {PATHS[selected].pivotAdvice}
            </p>
          </div>
        </div>
      )}

      <H2>Or browse the full catalogue</H2>
      <P>
        Every module lives on the{' '}
        <Link to="/learn" className="text-[var(--color-primary)] hover:underline">
          Learning hub
        </Link>{' '}
        with a description, lesson list and estimated reading time. Fifteen modules total, all
        available.
      </P>

      <Callout type="source">
        Two orientation cross-links that don&rsquo;t map neatly to a persona but are worth
        knowing about:{' '}
        <Link to="/learn/summing-it-up" className="text-[var(--color-primary)] hover:underline">
          Summing It Up
        </Link>{' '}
        is the closing synthesis of the whole curriculum, best read after 2&ndash;3 others; and{' '}
        <Link to="/intelligence/research" className="text-[var(--color-primary)] hover:underline">
          Research Notes
        </Link>{' '}
        is the shorter-form intelligence library sitting alongside the modules &mdash; single-topic
        working notes rather than multi-lesson deep-dives.
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
            ✅ Recommended entry point
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight"
          style={{ borderLeft: '4px solid #8b5cf6', paddingLeft: 12, marginLeft: -12 }}>
          Start Here — The AURES Sampler
        </h1>
        <p className="text-base italic text-[var(--color-text-muted)]">
          Six sharp ideas from across the curriculum, plus a choose-your-own-adventure navigator.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          A ~25-minute tour of the AURES Learning catalogue. Six short lessons each surface the
          single sharpest idea from a source module &mdash; self-contained on their own, with a
          &ldquo;go deeper&rdquo; link to the full treatment. The seventh lesson is an interactive
          navigator: pick a persona (developer / investor / analyst / curious) and get a
          suggested 3&ndash;5 module reading path with rationale and time estimate.
        </p>
      </div>

      <div className="space-y-3">
        {LESSONS.map(l => {
          const done = progress.has(l.id)
          return (
            <Link key={l.id} to={`/learn/start-here/${l.id}`}
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
          Or jump straight to the full catalogue
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          <Link to="/learn" className="text-[var(--color-primary)] hover:underline">
            Learning hub →
          </Link>
          <span className="ml-2">— all 14 modules with descriptions and lesson lists</span>
        </p>
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
        <Link to="/learn/start-here" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← Start Here
        </Link>
        <span className="text-[var(--color-text-muted)]">Lesson {lesson.number} of {LESSONS.length} · {lesson.readingTime}</span>
      </div>

      <div className="space-y-1 pb-4 border-b border-[var(--color-border)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Lesson {lesson.number}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight">{lesson.title}</h1>
        <p className="text-base italic text-[var(--color-text-muted)]">{lesson.subtitle}</p>
      </div>

      <article className="text-[15px] text-[var(--color-text-muted)]">
        {lesson.id === 'cost-dial'       && <Lesson1 />}
        {lesson.id === 'cannibalisation' && <Lesson2 />}
        {lesson.id === 'rez-two-sided'   && <Lesson3 />}
        {lesson.id === 'hornsdale'       && <Lesson4 />}
        {lesson.id === 'intel-stack'     && <Lesson5 />}
        {lesson.id === 'zero-for-15'     && <Lesson6 />}
        {lesson.id === 'navigator'       && <Lesson7 />}
      </article>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <button onClick={() => navigate(`/learn/start-here/${prev.id}`)}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors">
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => { onComplete(lesson.id); navigate(`/learn/start-here/${next.id}`) }}
            className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors">
            {progress.has(lesson.id) ? 'Continue' : 'Mark read & continue'} → {next.title}
          </button>
        ) : (
          <button onClick={() => { onComplete(lesson.id); navigate('/learn/start-here') }}
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

export default function StartHereModule() {
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
        <Link to="/learn/start-here" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Back to module index
        </Link>
      </div>
    )
  }

  return <LessonView lesson={lesson} progress={progress} onComplete={onComplete} />
}
