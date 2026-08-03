/**
 * CIS & LTESA — The Verdict.
 *
 * Distilled from a Aug 2026 internal working note on CIS + LTESA scheme
 * performance. Ten lessons: from the cost-allocation dial through
 * mechanism, evidence, verdict, and forward tests. Complements the
 * existing `cis-ltesa-bidding` module (which is about HOW to bid); this
 * one is about WHETHER IT HAS WORKED.
 */
import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-cis-verdict-progress'

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
  { id: 'dial',           number: 1,  title: 'Who bears the cost — the dial with three positions',      subtitle: 'Consumers, taxpayers, investors. Bill relief and the CIS collar are the same decision expressed twice.',   readingTime: '5 min' },
  { id: 'problem',        number: 2,  title: 'The problem the CIS was built to solve',                  subtitle: 'RET wound down, LGCs on a glide path, coal exit accelerating. Right diagnosis, wrong dose.',                     readingTime: '5 min' },
  { id: 'mechanism',      number: 3,  title: 'The mechanism as designed — a collar, not a swap',        subtitle: 'The CISA cap-and-collar formula. Four bid variables. Announced first, negotiated later.',                       readingTime: '6 min' },
  { id: 'six-choices',    number: 4,  title: 'Six design choices, jointly fatal',                       subtitle: 'MC1 dominance, early-stage eligibility, no offtake, nominal bid security, and the free-option effect.',           readingTime: '6 min' },
  { id: 'macro-turn',     number: 5,  title: 'The macro turned, and turned hard',                       subtitle: 'Capex +50%, forward curve −30%, demand growth 5.2% → 0.0%, wind lending −90%.',                                  readingTime: '5 min' },
  { id: 'moneyness',      number: 6,  title: 'The moneyness trap',                                      subtitle: 'Why an OOM floor wins the auction but pays nothing when needed. The three-year liquid horizon underneath.',      readingTime: '6 min' },
  { id: 'three-tech',     number: 7,  title: 'The three-technology divergence',                         subtitle: 'Solar cannibalised by rooftop, wind never reached scale, BESS worked and is now testing its own limits.',       readingTime: '6 min' },
  { id: 'state-of-play',  number: 8,  title: 'State of play — the numbers',                             subtitle: '94 announced, 35 executed, 15 at FID. Every FID had contracted revenue on top of the CISA.',                    readingTime: '6 min' },
  { id: 'ltesa',          number: 9,  title: 'Has the LTESA been better?',                              subtitle: 'Yes for storage. Weaker for generation than the headline. What actually predicts conversion.',                   readingTime: '6 min' },
  { id: 'forward',        number: 10, title: 'Forward view — nine changes and five tests',              subtitle: 'What to change (in descending impact) and what to watch (leading indicators through 2027).',                     readingTime: '6 min' },
]

// ============================================================
// Shared UI primitives — matched to the NSW REZ / Constraints style
// ============================================================

function Callout({ type, children }: { type: 'info' | 'warn' | 'key' | 'numbers' | 'source'; children: React.ReactNode }) {
  const styles = {
    info:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    label: 'Note' },
    warn:    { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   text: 'text-amber-400',   label: 'Important' },
    key:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Key finding' },
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
// Lesson 1 — The dial
// ============================================================

function Lesson1() {
  return (
    <div>
      <H2>The question underneath everything</H2>
      <P>
        Every argument about the CIS, the LTESA, contract design, bid discipline and delivery rates
        is downstream of one question. <Em>The transition costs money that current market prices do
        not produce, and someone has to bear it.</Em>
      </P>
      <P>
        There are only three candidates: <Em>consumers</Em>, through prices or levies;{' '}
        <Em>taxpayers</Em>, through contracts and contingent liabilities; or{' '}
        <Em>investors</Em>, through losses. It does not have to be one of them, and it will not stay
        the same forever. It is a dial, not a switch, and it moves with the political and capital cycle.
      </P>

      <Callout type="key">
        Around 2020&ndash;22 the dial sat between consumers and taxpayers &mdash; retail prices were
        rising and being passed through, and the RET was still creating certificate value. Two
        decisions moved it. <Em>Bill relief pushed cost away from consumers.</Em> The <Em>CIS
        collar</Em> &mdash; capped, covering only 90% of a shortfall, settling on an annual revenue
        aggregate, and bid deep out of the money &mdash; pushed cost away from taxpayers.
      </Callout>

      <H2>The residual lands on investors — by default, not by agreement</H2>
      <P>
        Consequence follows mechanically. If consumers are shielded and the taxpayer&rsquo;s exposure
        is contingent, capped and out of the money, then the residual falls on <Em>investors</Em>{' '}
        &mdash; who did not agree to it, cannot price it, and are now declining to fund it. The 90%
        collapse in Australian wind lending in 2025 is what that looks like from the capital side.
      </P>

      <Callout type="numbers">
        <p><Em>Bill relief and the CIS collar are the same decision expressed twice:</Em> consumers
        are not to bear it visibly, and taxpayers are to bear it contingently and later. Whatever
        remains is investor loss &mdash; not by contract, but by residual arithmetic.</p>
      </Callout>

      <P>
        Every subsequent lesson in this module is a working-through of what happened when the dial
        landed in that position. The mechanism can be argued, the market circumstance can be argued,
        the bidder behaviour can be argued &mdash; but the allocation frame is the ground truth
        underneath all three.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 2 — The problem the CIS was built to solve
// ============================================================

function Lesson2() {
  return (
    <div>
      <H2>The investment case had genuinely broken</H2>
      <P>
        By 2021&ndash;22 Australia had a structural investment problem in large-scale renewables that
        no existing instrument addressed. Four things fell over simultaneously.
      </P>

      <H3>1. The RET had done its job and was winding down</H3>
      <P>
        The Large-scale Renewable Energy Target was fully met by 2019&ndash;20. Its liable-entity
        demand was frozen, so LGC prices went on a long glide path to zero. The scheme ends in 2030.
        By February 2026 spot LGCs were trading around <Em>A$3.75&ndash;3.90/MWh</Em>, down from
        A$30/MWh in January 2025. Removing the certificate obligation did not merely remove a revenue
        line &mdash; it removed the <Em>mandated demand</Em> that had manufactured a deep bilateral
        PPA market as a by-product.
      </P>

      <H3>2. The merchant PPA market could not fill the gap</H3>
      <P>
        Corporate PPAs exist but are lumpy, short-dated relative to asset life, and concentrated among
        a handful of large industrial buyers. Gentailer PPAs shrank as the gentailers reoriented
        toward owning assets themselves and as their own retail books became harder to hedge against
        an increasingly solar-cannibalised daytime price shape.
      </P>

      <H3>3. Coal exit timing created a reliability cliff</H3>
      <P>
        Eraring (2,880 MW) was announced for early closure in February 2022. Liddell closed April
        2023. Yallourn, Vales Point, Bayswater and others followed on published trajectories.
        Regulators faced a genuine sequencing risk &mdash; firm capacity leaving faster than
        replacement capacity arriving.
      </P>

      <H3>4. The capacity market alternative had been rejected</H3>
      <P>
        The Energy Security Board&rsquo;s proposed capacity mechanism was widely opposed in 2022,
        principally because early designs appeared to pay coal and gas for availability. Ministers
        rejected it. The CIS emerged partly as the politically acceptable substitute &mdash; a
        capacity-procurement instrument that explicitly excluded fossil generation.
      </P>

      <Callout type="key">
        The diagnosis, in one line: <Em>projects were not reaching FID because neither equity nor
        debt could see a contracted revenue path.</Em> The CIS was designed to fix that.
      </Callout>

      <H2>Right disease, wrong dose</H2>
      <P>
        The problem was diagnosed as <Em>insufficient revenue certainty</Em>, and treated with a
        partial, contingent, capped downside cover. The actual problem was the <Em>absence of a
        bankable contracted revenue stream</Em>. Right disease, wrong dose &mdash; and the difference
        between those two diagnoses is the whole of what followed.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 3 — The mechanism as designed
// ============================================================

function Lesson3() {
  return (
    <div>
      <H2>The CISA formula</H2>
      <P>
        The CISA is a <Em>cap-and-collar on annual net operational revenue</Em>, not a price
        contract. Written out:
      </P>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 my-4 space-y-2 text-xs font-mono">
        <div>If Net Operational Revenue (NOR) &lt; Annual Floor:</div>
        <div className="pl-4 text-[var(--color-text)]">Commonwealth pays <code>min(90% &times; (Floor &minus; NOR), Annual Payment Cap)</code></div>
        <div>If NOR &gt; Annual Ceiling:</div>
        <div className="pl-4 text-[var(--color-text)]">Operator repays <code>min(50% &times; (NOR &minus; Ceiling), Annual Payment Cap)</code></div>
        <div>Between floor and ceiling: <span className="text-[var(--color-text)]">nothing settles</span></div>
      </div>

      <P>
        The 90% support share and the 50% clawback share are <Em>fixed by government</Em> and are not
        bid variables. Bidders compete on <Em>four</Em> parameters &mdash; Annual Floor, Annual
        Ceiling, Annual Payment Cap and Support End Date &mdash; each of which may be bid as a
        per-year schedule. Support period up to 15 years from commercial operation.
      </P>

      <H2>Four design features that do most of the damage</H2>

      <H3>(a) Settlement is on an annual revenue aggregate, not price &times; volume</H3>
      <P>
        A swap pays the difference between strike and spot on a defined notional quantity. The CISA
        pays a share of a shortfall against a total-revenue number you must first <Em>earn in the
        market</Em>. You therefore retain volume risk, shape risk, MLF risk, curtailment risk and
        negative-price risk in full. Lenders cannot size debt against a residual.
      </P>

      <H3>(b) Only 90% of the shortfall is covered, and it is capped</H3>
      <P>
        The Annual Payment Cap binds. So it is not a floor; it is a partial, capped top-up toward a
        floor. Credit committees haircut it heavily.
      </P>

      <H3>(c) The ceiling removes the upside — but the critique needs care</H3>
      <P>
        It would be wrong to say a bidder faces a swap strike and a CISA floor as if they were the
        same number priced differently. Under a collar you keep all market revenue between floor and
        ceiling, so you bid the floor <em>lower</em> than you would bid a swap strike &mdash; the
        floor is a downside-insurance strike, not an expected-revenue strike. In principle the
        correct bid is a floor set at roughly your senior debt service requirement, leaving equity
        the upside. On paper that is a <Em>better</Em> structure for equity than a swap.
      </P>
      <P>
        The problem is what the auction does to that number. <Em>MC1 scores net CISA cost to the
        Commonwealth.</Em> A higher floor means higher expected cost and a worse score. Competitive
        pressure drives the floor <em>below</em> the debt-service level &mdash; which is the one
        level at which the instrument would have worked.
      </P>
      <P>
        Contrast a swap auction. Competing the strike down thins the equity return, but the contract
        remains bankable at any strike, because debt sizes off strike &times; contracted volume.{' '}
        <Em>Competing a floor down destroys bankability outright.</Em>
      </P>

      <H3>(d) The CISA was, until July 2026, effectively a free option</H3>
      <P>
        Winning cost you a modest bid security. There was no material financial penalty for never
        executing. That is the structural explanation for a 19&times; oversubscribed tender (T8)
        coexisting with a ~36% CISA-execution rate.
      </P>

      <Callout type="key">
        <Em>The CISA settles on an annual revenue aggregate, covers only 90% of a shortfall, is
        capped, and until mid-2026 could be won and abandoned for a rounding error of a bid security.</Em>
        The individual design choices are defensible in isolation. Together they define an instrument
        that awards free options to the most optimistic bidder.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 4 — Six design choices
// ============================================================

function Lesson4() {
  return (
    <div>
      <H2>Six choices, individually defensible, jointly fatal</H2>
      <P>
        None of these choices was crazy on its own. Together they define a mechanism that awards free
        options to the most optimistic bidder and imposes no cost on non-delivery.
      </P>

      <Table
        emphasizeFirst
        headers={['Design choice', 'What it does', 'Why it hurts in combination']}
        rows={[
          ['Least-cost bidding', 'MC1 (financial value) carries ~49–50% of the weighting.', 'The bidder with the smallest expected Commonwealth outlay wins. That is precisely the bidder whose floor is furthest out of the money.'],
          ['Early-stage projects eligible', 'No planning approval, connection agreement or access rights required as a gate.', 'Winners include projects that will not physically get built regardless of contract price.'],
          ['No offtake requirement', 'Bidders do not need a PPA to bid or to win.', 'Projects rely on the CISA alone. Every project that has actually reached FID had a bilateral PPA on top.'],
          ['Nominal bid security', 'NSW Process Security Bond of $4,000/MW, capped at $1.2m.', 'On a 1,000 MW project that is $1.2m against a ~$4bn commitment — 0.03% of capex. A rounding error, not a deterrent.'],
          ['Announce first, negotiate later', 'Awards publicised at ministerial media release; contracts executed 6–12 months afterward.', 'Announced capacity is created at announcement; the binding obligation, if it ever arrives, comes later. This alone manufactures a phantom pipeline.'],
          ['Political value in the announcement itself', '7.8 GW headline is a better story than 3 GW six months later.', 'The design bias runs toward announcing more than can be executed, because the announcement is what the political system trades in.'],
        ]}
      />

      <H2>The consequence is now measurable</H2>
      <Callout type="numbers">
        <p><Em>94 projects announced, 35 contracts executed, 15 at final investment decision.</Em>{' '}
        (Senate Estimates, 26 May 2026.) Of the 31 wind projects (13.7 GW), three had reached FID
        &mdash; one of which was in the WEM. Wind reaching FID in the NEM: <Em>two of 28</Em> as of
        late May 2026.</p>
      </Callout>

      <H2>The critical caveat: these are not independent</H2>
      <P>
        Design determined which bidders competed and what behaviour paid. A bidder who provisioned
        properly &mdash; 20&ndash;30% capex headroom and a floor set off debt service rather than off
        the curve, in the region of $95&ndash;105/MWh escalating &mdash; would have lost the tender
        and written off their development spend.{' '}
        <Em>The reasonable contingency was calculable; bidding it was not survivable. The auction
        made prudence unaffordable.</Em>
      </P>

      <H2>Attribution — a provisional weighting</H2>
      <Table
        emphasizeFirst
        headers={['Factor', 'Provisional weight', 'Why']}
        rows={[
          ['Design', '~50%', 'MC1 dominance selects for out-of-the-money floors; free options; announce-then-negotiate; no maturity gate; nominal bid security.'],
          ['Market circumstance', '~35%', '50% capex inflation, 30% curve fall, zero demand growth, 90% lending collapse, offtaker scarcity — none of it in the bidders\' control.'],
          ['Bidder behaviour and selection', '~15%', 'The bid field was structurally selected for optimism. Development-company business models monetise through de-risking and sale, not through operation, so a CISA award is value-accretive whether or not it ever converts.'],
        ]}
      />

      <Callout type="warn">
        Weightings are working estimates. If future bid parameters are published and show floors{' '}
        <em>rising</em> across rounds as cost inflation became public, weight shifts toward market
        circumstance and away from design. If floors were flat or falling despite that knowledge,
        weight shifts hard toward design. NSW Tender Round 8 &mdash; a swap rather than a collar,
        offered to the same NSW cohort excluded from CIS T9 &mdash; is the cleanest natural
        experiment available, resolving November or December 2026.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 5 — The macro turn
// ============================================================

function Lesson5() {
  return (
    <div>
      <H2>Five variables, all moving in the direction of harm</H2>
      <P>
        Simultaneous with the rounds themselves, the underlying economics of building a new NEM wind
        farm deteriorated across every axis a bidder cared about.
      </P>

      <Table
        emphasizeFirst
        headers={['Variable', 'Movement', 'Source / notes']}
        rows={[
          ['Onshore wind development cost', '+~50% since 2020–23 (roughly 9–13% a year compound)', 'Rystad Energy'],
          ['NSW forward curve, near quarters', '−30% to −34% in twelve months to 30 Jul 2026', 'Leitch chart, ITK'],
          ['NSW 2027 Q1 specifically', '$116 (Aug 25) → $98 (Apr 26) → $81 (Jul 26)', 'A 17% fall in a single quarter, after T7 bids were already lodged.'],
          ['Demand growth (3-month rolling YoY)', '+5.2% peak in early 2024 → 0.0% now', 'NEM demand growth stalled at zero — first-order.'],
          ['Wind lending', '~US$5bn (2024) → ~US$525m (2025) — a ~90% collapse', 'LSEG LPC data via IFR. In the year AFTER the largest generation tender in Australian history.'],
        ]}
      />

      <Callout type="key">
        <Em>Neither blade alone would be fatal.</Em> A 50% capex rise against a stable curve is
        survivable with a repriced offtake. A 30% curve fall against a stable cost base is survivable.
        They compress the equity return from both ends at once, and the compression is multiplicative
        rather than additive.
      </Callout>

      <H2>The creditworthy-offtaker bottleneck</H2>
      <P>
        The realistic universe of investment-grade counterparties willing to sign long-dated
        renewable offtake in the NEM is <Em>effectively Fortescue, Rio Tinto, and the state utilities
        such as Synergy and SEC Victoria.</Em> Corporate PPA volumes have been running at only{' '}
        <Em>1&ndash;1.5 GW per year</Em>. Against a requirement of roughly 14 GW to reach FID in two
        years, the offtake market is an order of magnitude too small &mdash; and no contract redesign
        fixes that on its own.
      </P>

      <H2>The cost of capital moved the other way at the same time</H2>
      <P>
        Debt is scarcer and dearer for this asset class &mdash; Australian wind lending fell roughly
        90% in 2025 &mdash; and credit standards tightened repeatedly through 2024&ndash;26 in ways
        that narrowed the field of bankable projects. Equity hurdle rates for merchant-exposed
        generation have risen with the broader rate environment and with observed sector losses.
      </P>
      <P>
        Note the asymmetry this creates: <Em>realised returns are falling while required returns are
        rising.</Em> In storage the effect is visible &mdash; 4-hour BESS IRRs have compressed from
        above 15% to roughly 8&ndash;14%, with commercial banks now willing to lend but at materially
        lower return expectations. In wind the gap has simply stopped clearing at all.
      </P>

      <Callout type="warn">
        A CIS floor bid in 2024 embedded a WACC assumption that no longer holds. Nothing in the CISA
        indexes to that. This is a <Em>fourth independent driver</Em>, alongside capex inflation,
        price decline and offtaker scarcity &mdash; and it is the one that most directly explains
        why a project can be well-priced on its own terms and still fail to attract equity.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 6 — The moneyness trap
// ============================================================

function Lesson6() {
  return (
    <div>
      <H2>The liquid-horizon problem</H2>
      <P>
        Electricity futures in the NEM are liquid for roughly <Em>three years</Em>. Beyond that there
        is no traded price &mdash; only modelling. But a wind farm has a 25&ndash;30 year life and a
        15-year CISA. <Em>Every counterparty in the financing chain prices off the liquid window</Em>
        because it is the only mark anyone will accept:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>Lenders size debt against the traded strip and extrapolate beyond it with a haircut that widens with tenor.</li>
        <li>Equity buyers run a base case anchored on the curve, then fade to a long-run modelled price that is itself calibrated to where the observable curve sits today.</li>
        <li>PPA counterparties price off the curve, less a discount for taking volume and shape risk.</li>
        <li>Valuers and credit committees mark to the same strip.</li>
      </ul>

      <Callout type="key">
        Consequence: <Em>a 30% fall in a three-year window resets the assessed value of a 30-year
        asset</Em>, even though nothing has changed about 2035. The long-dated assumption is not
        independent of the short-dated observation. It is anchored to it.
      </Callout>

      <H2>The mechanism × moneyness compounding</H2>
      <P>
        Combine that with the MC1 incentive and you get the specific trap that caught T1 and T4. When
        those bids were priced, the NSW curve for 2027&ndash;28 sat around <Em>$116&ndash;120/MWh</Em>.
        A bidder setting a floor at, say, $75/MWh was bidding <Em>deep out of the money</Em> &mdash;
        roughly 35% below the traded curve.
      </P>
      <P>
        That bid has two properties that are catastrophic in combination:
      </P>
      <ol className="list-decimal list-inside text-sm text-[var(--color-text-muted)] space-y-2 mb-3 ml-2">
        <li>
          <Em>It scores superbly on MC1.</Em> Expected Commonwealth outlay is near zero, because on
          the curve as it then stood the floor would never be struck. Excellent financial-value score,
          high probability of winning.
        </li>
        <li>
          <Em>It provides nothing when it is needed.</Em> A floor protects only at the level it is
          set. NSW 2027 Q1 now trades at $81. The floor is nearly at the money and the project has
          borne essentially the whole of the decline.
        </li>
      </ol>

      <Callout type="numbers">
        <p><Em>The auction rewarded bidders for buying insurance with a deductible so large it would
        never pay out.</Em> And it ran at what now looks like the cyclical peak of the forward curve.
        The correct floor for a well-run wind bid, off senior debt service on a $110/MWh LCOE, lands
        in the <Em>$95&ndash;105/MWh region &mdash; escalating.</Em> Nobody appears to have carried it.</p>
      </Callout>

      <H2>What a bankable floor actually looks like</H2>
      <P>
        A defensible floor bid is not &ldquo;curve minus 35%.&rdquo; It is <Em>debt service plus
        operating cost plus a thin equity coupon</Em>. For a wind project at 70% gearing with a
        1.35&ndash;1.45&times; DSCR against a $110/MWh LCOE, that requirement lands somewhere in the
        $75&ndash;90/MWh region &mdash; and it should be <Em>indexed</Em>, or bid as a rising
        per-year schedule. A bidder holding no fixed-price EPC and no turbine supply agreement at
        submission &mdash; which is every bidder in every round &mdash; needed 20&ndash;30% capex
        headroom on top of that.
      </P>
      <P>
        The bidder who carried that properly did not win a worse deal. They lost the tender and
        wrote off their development spend. That is a mechanism failure, and it is the mechanism&rsquo;s.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 7 — Three-technology divergence
// ============================================================

function Lesson7() {
  return (
    <div>
      <H2>Reading &ldquo;the CIS didn&rsquo;t work&rdquo; as one story hides the finding</H2>
      <P>
        The three technologies the CIS procures have diverged sharply. They share the auction, the
        collar and the merit criteria &mdash; but the failure mode is different in each, and the
        binding constraint is different in each.
      </P>

      <H3>Solar — revenue impaired by its own success, and by an actor that ignores prices</H3>
      <P>
        Utility solar&rsquo;s problem is not capex and it is not the CISA. It is <Em>capture rate</Em>.
        Every additional megawatt of midday generation depresses the price in the intervals when
        solar generates. A solar farm can hold its volume, hold its cost base, and still watch its
        realised revenue per megawatt-hour fall, because the price in its generating window is being
        competed to zero and below. The compounding factor is that <Em>the largest source of new
        midday supply does not respond to price</Em>: rooftop solar adds roughly 4 TWh a year, will
        keep arriving whether or not utility solar is investable, and reached 13.7% of NEM
        generation in the year to July 2026 &mdash; more than brown coal.
      </P>

      <H3>Wind — never reached scale, then hit the scissor</H3>
      <P>
        Wind&rsquo;s story is the opposite. There are <Em>2,494 MW of wind under construction or
        commissioning across the entire NEM</Em> &mdash; against 13.7 GW of CIS-awarded wind. It did
        not cannibalise itself into difficulty; it ran into a 50% capex increase, a 30% forward-curve
        decline, a 90% collapse in project lending and an offtake market an order of magnitude too
        small, <Em>before it ever got to scale</Em>. The RET was the last mechanism that funded it at
        volume; the CISA was meant to be the successor and, per the previous lesson, has not.
      </P>

      <H3>BESS — the one that worked, and is now testing its own limits</H3>
      <P>
        Grid-scale storage has been the genuine success. The NEM battery fleet grew from roughly{' '}
        <Em>2 GW to 8 GW in twelve months</Em>. CIS storage rounds converted at two to three times
        the rate of generation rounds &mdash; Tender 3 at about 62% by count at construction or FID,
        against Tender 1&rsquo;s ~11%. What made it work: wide spreads from coal-era volatility,
        cheap or negative-cost charging from the solar glut, 12&ndash;18 month build times,
        contractible revenue via tolling agreements, and modular scale.
      </P>

      <Callout type="warn">
        But look at what is now happening. <Em>NEM-wide BESS revenue in May 2026 was $29k/MW/yr
        &mdash; an all-time low</Em> since Modo began tracking in July 2022. Q2 2026 average
        $38.9k/MW/yr. Price spread compressed $183/MWh &rarr; $121/MWh (−34%). 4-hour BESS IRRs
        compressed from above 15% to 8&ndash;14%. New projects need to underwrite <Em>$50&ndash;60k/MW/yr
        or lower</Em>, against 2024-vintage forecasts above $100k. The mechanism is self-inflicted
        in the same way solar&rsquo;s is: batteries earn from spread, every battery narrows the
        spread, and once the fleet quadruples in a year the arbitrage that justified it stops paying.
      </Callout>

      <H2>The unifying finding</H2>
      <Callout type="key">
        <Em>Every technology in this transition destroys the price signal that funds it.</Em> Solar
        competes away the midday price. Storage competes away the spread it arbitrages. Wind erodes
        its own capture rate in high-wind intervals and, at scale, the overnight price. None of the
        three has a revenue mechanism that survives its own build-out. This is not a contract design
        problem. It is the arithmetic of adding zero-marginal-cost supply into a market that clears
        on marginal cost. <Em>And it is only fatal because demand growth is flat.</Em>
      </Callout>

      <P>
        That last observation is the most under-discussed policy lever in the whole debate. NEM
        demand growth has fallen from +5.2% in early 2024 to 0.0%. With 3&ndash;4% annual growth
        &mdash; electrification, industrial load, data centres &mdash; cannibalisation is absorbed
        by a growing market and all three revenue problems ease substantially without <em>any</em>{' '}
        change to contract design.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 8 — State of play
// ============================================================

function Lesson8() {
  return (
    <div>
      <H2>The program numbers, as confirmed at Senate Estimates 26 May 2026</H2>
      <Table
        emphasizeFirst
        headers={['Metric', 'Figure']}
        rows={[
          ['Projects announced successful', '94'],
          ['CISAs executed', '35 (with ~50 more under negotiation)'],
          ['Projects at final investment decision', '15'],
          ['Wind projects, of the 94', '31, totalling 13.7 GW'],
          ['Milestone delays formally notified', '~6'],
          ['Projects that approached the department to say they cannot deliver', '4'],
        ]}
      />

      <Callout type="key">
        <Em>CISA execution has barely moved.</Em> December 2025: ~6.5 GW of ~18 GW (~36% by
        capacity). May 2026: 35 of 94 projects (~37% by count). Five months, five more tenders&rsquo;
        worth of announcements, and the execution rate is flat.
      </Callout>

      <H2>Reconciling the four different pipeline counts in circulation</H2>
      <P>
        Four counts of &ldquo;how big is the CIS pipeline&rdquo; are quoted. They are not errors
        &mdash; they count different things. Be explicit about which you are using.
      </P>
      <Table
        emphasizeFirst
        headers={['Source', 'Figure', 'What it counts']}
        rows={[
          ['Senate Estimates, 26 May 2026', '94 projects', 'All CIS awards, all markets, all rounds.'],
          ['RenewEconomy, 26 May 2026', '58 projects / 18.8 GW NEM generation, plus 7 projects / 1.9 GW WEM', 'Wind and solar only; excludes standalone dispatchable.'],
          ['DCCEEW, Dec 2025', '63 projects', 'Excludes the CIS Pilot NSW cohort, which sat under the NSW LTESA firming framework.'],
          ['AURES v3.23.1', '115 projects', 'All rounds in the AURES dataset, including pilots.'],
        ]}
      />

      <H2>The single most diagnostic finding</H2>
      <P>
        Across the entire AURES corpus, the pattern is unambiguous:
      </P>
      <Callout type="key">
        <Em>Every CIS project that has reached FID had contracted revenue on top of the CIS floor.
        None reached FID on the CISA alone.</Em>
      </Callout>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>Palmer &mdash; 15-year AGL PPA (Jan 2026)</li>
        <li>Carmody&rsquo;s Hill &mdash; Snowy Hydro PPA (Dec 2025)</li>
        <li>Guthrie&rsquo;s Gap and Smoky Creek &mdash; Rio Tinto 20-year offtake (May 2026)</li>
        <li>Goyder North &mdash; BHP PPA for Olympic Dam</li>
        <li>Bungaban &mdash; pre-existing Rio Tinto PPA</li>
        <li>Calala &mdash; Smartest Energy tolling</li>
        <li>Reeves Plains, Wooreen, Hallett, Liddell, Mortlake &mdash; gentailer balance sheets</li>
        <li>Ulinda Park, Goulburn River &mdash; staged expansion of already-financed sites</li>
      </ul>

      <Callout type="warn">
        This is the empirical core of the whole question. It says the CISA is <em>not</em> a
        financing instrument. It is a <Em>risk-reduction overlay on a project that must already be
        financeable by other means.</Em> Every design conclusion in the module follows from this
        one observation.
      </Callout>

      <H2>Two effective terminations to note</H2>
      <P>
        Neither has been formally cancelled, but both are functionally lost:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>
          <Em>Junction Rivers</Em> (Windlab, NSW, ~585&ndash;600 MW wind + BESS, CIS T1) failed to
          secure South-West REZ access rights &mdash; a <em>transmission</em> failure, not a contract
          design one. First project effectively dropped from the CIS.
        </li>
        <li>
          <Em>Capricorn BESS</Em> (Potentia, QLD, 300 MW / 1,200 MWh, CIS T3) was called in by the
          QLD Deputy Premier in early 2026 for state-level review, creating planning uncertainty for
          a $500m+ investment and unsettling the wider QLD BESS pipeline.
        </li>
      </ul>
    </div>
  )
}

// ============================================================
// Lesson 9 — Has the LTESA been better?
// ============================================================

function Lesson9() {
  return (
    <div>
      <H2>Mechanism comparison</H2>
      <Table
        emphasizeFirst
        headers={['Feature', 'CISA', 'Generation LTESA', 'Hybrid Gen LTESA (new)', 'LDS LTESA']}
        rows={[
          ['Instrument', 'Cap-and-collar on annual net revenue', 'Option strip over price swaps', 'Option strip, 50% price-risk share', 'Variable annuity ($/MW/yr)'],
          ['Settlement unit', 'Annual revenue aggregate', '$/MWh × notional quantity', '$/MWh × net exports × 50%', '$/MW/yr top-up'],
          ['Downside cover', '90% of shortfall, capped', '100% of contracted % at fixed price', '50% of contracted %', 'Top-up to Annuity Cap'],
          ['Upside clawback', '50% above ceiling, capped', '50% above threshold (non-exercise years), capped', 'Same', '50% above Net Revenue Threshold'],
          ['Negative prices', 'Not addressed', 'Floating price floored at $0', 'Notional quantity = 0', 'N/A'],
          ['Term', 'Up to 15 yrs', '20 yrs default (TR8)', '20 yrs default', '14 yrs BESS / 40 yrs PHES'],
          ['Award sequencing', 'Announced, then negotiated (6–12 mths)', 'Executed at award against published proforma', 'Executed at award', 'Executed at award'],
          ['Unexecuted-award cohort', '~60–65% of announced capacity', 'None identified in public reporting', 'n/a', 'None identified'],
          ['Bankability', 'Weak', 'Strong', 'Moderate', 'Strong'],
        ]}
      />

      <H2>Where the LTESA clearly outperformed — storage and firming</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>Rounds 5 and 6 delivered NSW&rsquo;s legislated LDS objectives &mdash; <Em>2 GW by 2030 and 28 GWh by 2034</Em> &mdash; ahead of the deadline. Across all rounds the scheme has secured roughly 2.77 GW / 30 GWh of long-duration storage.</li>
        <li><Em>Prices fell between rounds:</Em> R6 cleared at approximately $150k/MW/yr average annuity cap against roughly $185k in R5. A working procurement mechanism.</li>
        <li>R5 delivered the first pumped hydro LTESA &mdash; <Em>Phoenix, 800 MW / ~12 GWh, 40-year term</Em>, the longest government-backed energy contract in Australian history. R3 delivered the first compressed-air project (Hydrostor Silver City, 200 MW / 1,600 MWh).</li>
        <li>Firming R7: AGL&rsquo;s Tomago battery delivers <Em>double the energy of the Liddell battery</Em> (2,000 MWh vs 1,000 MWh) at roughly the same cost as the Tender 2 award, at a materially lower strike.</li>
      </ul>

      <H2>Where the comparison is weaker than it appears — generation</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li>The R1/R3/R4 generation conversion advantage is real but partly a <Em>selection effect</Em>. Flyers Creek was already built at award. New England Solar and Stubbo were both very advanced ACEN projects.</li>
        <li>R4 awarded only 312 MW against a 1,150 MW target and NSW then <Em>cancelled the following generation tender</Em> to align with the CIS.</li>
        <li>NSW ran <Em>no generation tender between mid-2024 and May 2026.</Em> The LTESA&rsquo;s generation record is a small sample from an early, favourable cohort, followed by a two-year absence.</li>
      </ul>

      <H2>The real lesson — the predictive variable</H2>
      <Callout type="key">
        The variable that predicts conversion is not &ldquo;CfD versus collar.&rdquo; It is{' '}
        <Em>how much of the revenue is fixed, volume-independent, and settled per unit.</Em>
      </Callout>

      <H2>Ranked by conversion performance in the data</H2>
      <Table
        emphasizeFirst
        headers={['Rank', 'Instrument', 'Why it converts']}
        rows={[
          ['1', 'LDS LTESA annuity ($/MW/yr, volume-independent)', 'Targets met, prices falling between rounds, technology diversity achieved.'],
          ['2', 'Generation LTESA swap ($/MWh on contracted volume)', 'Strong conversion in early rounds; the unit of settlement is bankable.'],
          ['3', 'CISA collar with a bilateral PPA on top', 'Every CIS project that has reached FID sits here. The collar is the top-up, the PPA does the financing.'],
          ['4', 'CISA collar alone', 'Near-zero conversion for generation. The instrument is a risk-reduction overlay, not a financing instrument.'],
        ]}
      />

      <Callout type="warn">
        Leitch&rsquo;s remedy &mdash; a flat quarterly-settled swap over 20&ndash;25 years &mdash;
        is directionally right. A flat swap would move the CIS from tier 4 to tier 2, which is a
        large improvement. An availability-style payment for firm capacity would move it to tier 1
        &mdash; but that is a capacity mechanism, which is precisely what ministers rejected in 2022
        and which the CIS was invented to avoid. <Em>That is the political circle nobody has
        squared: the instrument that converts best is the one closest to the thing that was ruled
        out.</Em>
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 10 — Forward view
// ============================================================

function Lesson10() {
  return (
    <div>
      <H2>Nine changes, in descending order of expected impact</H2>
      <ol className="list-decimal list-inside text-sm text-[var(--color-text-muted)] space-y-2 mb-4 ml-2">
        <li><Em>Change the settlement unit.</Em> Move from an annual net-revenue collar to a per-MWh swap on a defined notional quantity. This alone determines bankability.</li>
        <li><Em>Make maturity an eligibility gate, not a merit score.</Em> Planning approval, connection agreement, and access rights as hard gates. Would have transformed T1 and T7 outcomes.</li>
        <li><Em>Execute at award, or announce conditionally with a deadline.</Em> Sign at announcement against a published proforma, or announce a conditional award that lapses in 90 days with the capacity returning to the next round&rsquo;s pool and the lapse published.</li>
        <li><Em>Escalating, forfeitable security</Em> at bid → award → CISA → FID. The NSW Process Security Bond of $4,000/MW capped at $1.2m is 0.03% of capex &mdash; a rounding error, not a deterrent.</li>
        <li><Em>Remove or radically raise the ceiling.</Em> The 50% clawback destroys the equity case without buying bankability. If the state wants upside participation, take it as equity, not as a revenue haircut.</li>
        <li><Em>Address negative prices and curtailment explicitly.</Em> NSW&rsquo;s zeroing of notional quantity in negative intervals is a workable template.</li>
        <li><Em>Index the strike, or accept shorter terms.</Em> NSW bids are nominal $/MWh with no CPI escalation over 20 years. That is a large real-price haircut which bidders must forecast, and forecast error there is another source of winner&rsquo;s curse.</li>
        <li><Em>Publish anonymised bid parameters after award.</Em> Floor, ceiling, cap and support-end-date distributions, aggregated by round and technology. Without this nobody &mdash; including parliament &mdash; can tell whether the auction is producing bankable floors.</li>
        <li><Em>Sequence coal exit credibly.</Em> No contract design fixes a forward curve suppressed by repeatedly deferred closures. Leitch is right that paying coal to stay online while paying renewables to enter is self-defeating.</li>
      </ol>

      <H2>Five tests worth watching, in date order</H2>
      <Table
        emphasizeFirst
        headers={['Signal', 'Timing', 'What it would tell you']}
        rows={[
          ['CIS T9 results', 'Nov 2026', 'Whether deliverability screening survives contact with MC1 price competition.'],
          ['NSW T8 results (Gen LTESA swap, same cohort excluded from CIS T9)', 'Nov/Dec 2026 → 2027', 'The cleanest available A/B test of contract form. If NSW T8 converts materially better than CIS T7, the contract-design argument is close to proven.'],
          ['Government forecast of ~15 GW at financial close by 31 Dec 2026', 'Dec 2026 (falsifiable)', 'Track against CER quarterly reports. If landing at 4–6 GW, the delivery critique is settled. 15 GW would require a seven-to-eightfold increase in closed capacity within seven months.'],
          ['Modo Q3/Q4 2026 BESS revenue', 'Late 2026', 'First data showing sub-25% T3 storage conversion, if the &ldquo;sleeper&rdquo; problem materialises.'],
          ['Senate Estimates', 'Oct–Nov 2026', 'Parliamentary pressure on the delivery numbers; the May 2026 hearing was the wind breakout moment.'],
        ]}
      />

      <H2>The 15 GW test</H2>
      <Callout type="key">
        Whatever else happens, the government&rsquo;s own forecast &mdash; approximately <Em>15 GW
        at financial close by 31 December 2026</Em>, given on the record on 26 May 2026 &mdash; is
        the cleanest falsifiable claim available. Roughly 1.8 GW had reached FID earlier in the
        year. Reaching 15 GW by 31 December 2026 requires a seven-to-eightfold increase in closed
        capacity within seven months, in a sector where wind lending fell ~90% in 2025 and where the
        department, in the same hearing, just confirmed four winners telling it they cannot deliver.
      </Callout>

      <H2>The bottom line</H2>
      <P>
        <Em>The CIS has been a highly successful procurement mechanism and a failed delivery
        mechanism, and the first caused the second.</Em> Procurement: heavily oversubscribed,
        competitive, low headline cost, essentially nothing paid out. Delivery: 15 FIDs from 94
        awards; three of 31 wind projects at FID, one in the WEM; 2,494 MW of wind under
        construction or commissioning across the entire NEM against 13.7 GW of CIS wind awarded.
      </P>
      <P>
        The LTESA has been better, but not principally because it is a CfD &mdash; it has been
        better where it pays a fixed, volume-independent amount per unit or per MW. Its generation
        record rests on a small, favourably selected early cohort followed by a two-year gap in
        generation procurement, and NSW&rsquo;s newest hybrid product moves <em>away</em> from
        full price cover, not toward it.
      </P>
      <P>
        There is a third factor underneath both, and it may be the binding one: the
        creditworthy-offtaker market is roughly an order of magnitude too small for the build task
        &mdash; 1&ndash;1.5 GW per year of corporate PPA against a 14 GW two-year requirement. The
        RET manufactured that market as a by-product of a legislated mandate. Nothing replaced it.
        This is the best case for Leitch&rsquo;s flat swap, because a flat swap makes the
        Commonwealth the creditworthy counterparty; the collar cannot, because it settles on a
        residual rather than on volume at a price.
      </P>

      <Callout type="source">
        This module distils an internal working note (~40 pages) prepared August 2026. Companion
        AURES surfaces: the{' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          Scheme Tracker
        </Link>{' '}
        (project-by-project status), the{' '}
        <Link to="/intelligence/research" className="text-[var(--color-primary)] hover:underline">
          Research Notes
        </Link>{' '}
        library (deeper argument threads including{' '}
        <em>cis-wind-projects-crisis-state-of-play</em>,{' '}
        <em>cis-rebid-restrictions-hardening</em> and the <em>BESS sleeper story</em>), and the
        companion{' '}
        <Link to="/learn/cis-ltesa-bidding" className="text-[var(--color-primary)] hover:underline">
          CIS &amp; LTESA Bidding module
        </Link>{' '}
        for the mechanics of how the auction actually works.
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
          <span className="text-3xl" aria-hidden>⚖️</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            ✅ Available
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight"
          style={{ borderLeft: '4px solid #c2410c', paddingLeft: 12, marginLeft: -12 }}>
          CIS &amp; LTESA — The Verdict
        </h1>
        <p className="text-base italic text-[var(--color-text-muted)]">
          Who bore the cost, what the mechanism did, and why the first-cohort delivery numbers look the way they do.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          Distilled from an internal working note (Aug 2026). Ten lessons trace the arc from the
          cost-allocation dial (consumers / taxpayers / investors), through the CISA mechanism, the
          six design choices, the macro turn, the moneyness trap, the three-technology divergence,
          the state of play, the LTESA comparison, and the forward tests. Complements the{' '}
          <Link to="/learn/cis-ltesa-bidding" className="text-[var(--color-primary)] hover:underline">
            CIS &amp; LTESA Bidding module
          </Link>{' '}
          &mdash; that one is about <em>how</em> to bid; this one is about <em>whether it has worked</em>.
        </p>
      </div>

      <div className="space-y-3">
        {LESSONS.map(l => {
          const done = progress.has(l.id)
          return (
            <Link key={l.id} to={`/learn/cis-ltesa-verdict/${l.id}`}
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
            <span className="text-[var(--color-text-muted)] ml-2">— every CIS + LTESA project, status, counterparty, execution field</span>
          </li>
          <li>
            <Link to="/intelligence/research" className="text-[var(--color-primary)] hover:underline">
              Research Notes →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— longer-form threads: BESS sleeper story, T9 competitive field, wind projects crisis</span>
          </li>
          <li>
            <Link to="/learn/cis-ltesa-bidding" className="text-[var(--color-primary)] hover:underline">
              CIS &amp; LTESA Bidding →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— the how-to companion module (bidding mechanics, PPA×CISA calculator, merit criteria)</span>
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
        <Link to="/learn/cis-ltesa-verdict" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← CIS &amp; LTESA — The Verdict
        </Link>
        <span className="text-[var(--color-text-muted)]">Lesson {lesson.number} of {LESSONS.length} · {lesson.readingTime}</span>
      </div>

      <div className="space-y-1 pb-4 border-b border-[var(--color-border)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Lesson {lesson.number}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight">{lesson.title}</h1>
        <p className="text-base italic text-[var(--color-text-muted)]">{lesson.subtitle}</p>
      </div>

      <article className="text-[15px] text-[var(--color-text-muted)]">
        {lesson.id === 'dial'          && <Lesson1 />}
        {lesson.id === 'problem'       && <Lesson2 />}
        {lesson.id === 'mechanism'     && <Lesson3 />}
        {lesson.id === 'six-choices'   && <Lesson4 />}
        {lesson.id === 'macro-turn'    && <Lesson5 />}
        {lesson.id === 'moneyness'     && <Lesson6 />}
        {lesson.id === 'three-tech'    && <Lesson7 />}
        {lesson.id === 'state-of-play' && <Lesson8 />}
        {lesson.id === 'ltesa'         && <Lesson9 />}
        {lesson.id === 'forward'       && <Lesson10 />}
      </article>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <button onClick={() => navigate(`/learn/cis-ltesa-verdict/${prev.id}`)}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors">
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => { onComplete(lesson.id); navigate(`/learn/cis-ltesa-verdict/${next.id}`) }}
            className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors">
            {progress.has(lesson.id) ? 'Continue' : 'Mark read & continue'} → {next.title}
          </button>
        ) : (
          <button onClick={() => { onComplete(lesson.id); navigate('/learn/cis-ltesa-verdict') }}
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

export default function CISLTESAVerdictModule() {
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
        <Link to="/learn/cis-ltesa-verdict" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Back to module index
        </Link>
      </div>
    )
  }

  return <LessonView lesson={lesson} progress={progress} onComplete={onComplete} />
}
