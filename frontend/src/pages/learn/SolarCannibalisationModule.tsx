/**
 * Solar Cannibalisation in the NEM.
 *
 * Five-lesson module treating cannibalisation as the main subject rather
 * than the setup for a battery story. Where the Solar + BESS module tells
 * the arc (rooftop → cannibalisation → BESS → spread saturation), this one
 * stays with the solar side: the mechanism, the AURES data, the historical
 * curve, rooftop as the compounding force, and a sober assessment of
 * whether co-located storage actually fixes the underlying arithmetic.
 */
import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-solar-cann-progress'

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
  { id: 'mechanics',     number: 1, title: 'The cannibalisation mechanic',                subtitle: 'Why every solar farm generates at the same moment, why that pushes the price toward zero, and what value factor actually measures.', readingTime: '6 min' },
  { id: 'data',          number: 2, title: 'Live AURES data — VF by farm and region',    subtitle: 'The state ranking, the leaders and the laggards, and where to find every operating solar farm’s capture price in AURES.',              readingTime: '7 min' },
  { id: 'curve',         number: 3, title: 'The cannibalisation curve',                   subtitle: 'How value factor has declined as installed solar grew. Threshold effects, negative-price hours, and LCOE net of cannibalisation.',        readingTime: '7 min' },
  { id: 'rooftop',       number: 4, title: 'Rooftop solar — the hidden driver',           subtitle: 'The largest source of midday supply does not respond to price. Why that makes utility-scale cannibalisation structurally worse.',        readingTime: '7 min' },
  { id: 'storage-stack', number: 5, title: 'Co-located storage — the answer, and its limits', subtitle: 'The math on charging from your own array, the CIS hybrid tailwind, and why co-location may delay rather than fix the problem.', readingTime: '8 min' },
]

// ============================================================
// Shared UI primitives — matched to the Verdict / NEM Pubs modules
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
// Lesson 1 — The mechanic
// ============================================================

function Lesson1() {
  return (
    <div>
      <H2>Solar farms are perfectly correlated</H2>
      <P>
        A solar farm&rsquo;s output is set by two things: the sun angle and the local cloud cover.
        Sun angle is deterministic and identical across every farm in the same latitude band. Cloud
        cover is stochastic but correlated across hundreds of kilometres. As a result{' '}
        <Em>every utility solar farm in a NEM region generates a very similar hourly shape on the
        same days</Em>. You cannot diversify the output of a solar fleet the way you can diversify
        a wind fleet across a continent.
      </P>

      <H2>The merit-order effect</H2>
      <P>
        NEMDE dispatches generators in order of their offered price, cheapest first, until forecast
        demand is met. The last unit dispatched sets the regional price for the whole interval.
        Solar farms typically bid at their marginal cost &mdash; effectively zero. As solar output
        rises through the morning it displaces the incumbent thermal fleet from the marginal
        position and the clearing price collapses. When enough solar is generating simultaneously,
        the marginal generator can become another solar farm bidding zero (or negative, to preserve
        LGC eligibility on curtailed output). The clearing price then goes to zero or below.
      </P>

      <Callout type="key">
        <Em>The cannibalisation problem is not a design flaw &mdash; it is the arithmetic of adding
        zero-marginal-cost supply into a market that clears on marginal cost.</Em> Every extra
        megawatt of solar depresses the clearing price in the intervals when solar generates. It
        is unavoidable at scale for any technology whose output is coincident and whose marginal
        cost is near zero.
      </Callout>

      <H2>Value factor — the metric that captures the effect</H2>
      <P>
        The clean way to measure how much a solar farm is being cannibalised is the{' '}
        <Em>value factor (VF)</Em>:
      </P>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 my-4 text-xs font-mono">
        <div className="text-[var(--color-text)]">VF = capture price / time-weighted average pool price</div>
        <div className="text-[var(--color-text-muted)] mt-2">where</div>
        <div className="pl-4 text-[var(--color-text)]">capture price = SUM(RRP × generation) / SUM(generation)</div>
        <div className="pl-4 text-[var(--color-text)]">time-weighted average = SUM(RRP) / 48 half-hours × 365 days</div>
      </div>
      <P>
        A value factor of 1.0 means the farm earned the same $/MWh as if it had generated
        uniformly across the whole year. A VF of 0.7 means it earned 30% less than a hypothetical
        constant-output plant in the same region. A VF of 0.4 means it earned 60% less &mdash;
        which is where the worst-cannibalised Australian solar farms now sit.
      </P>

      <H2>A worked example</H2>
      <Callout type="numbers">
        <p>Consider a 200 MW solar farm generating 460 GWh a year in NSW. The pool time-weighted
        average price is $90/MWh. If the farm&rsquo;s capture price is $54/MWh, its VF is
        <Em> 0.60</Em>, and its annual revenue is $54 &times; 460,000 = <Em>$24.8m</Em>. If the same
        farm had VF = 1.0 it would earn $41.4m &mdash; a $16.6m/year gap that comes out of equity
        return, not out of costs.</p>
      </Callout>

      <H2>Typical VF ranges (illustrative)</H2>
      <Table
        emphasizeFirst
        headers={['Technology', 'Typical VF', 'Why']}
        rows={[
          ['Wind', '0.85 – 1.05', 'Output correlates within a wind resource region but not perfectly. High-wind hours often overnight when demand is lower — modest cannibalisation. Sometimes above 1.0 in evening events.'],
          ['Utility solar (low-penetration state)', '0.75 – 0.95', 'Cannibalisation exists but manageable. VIC and NSW newer farms sit here.'],
          ['Utility solar (high-penetration state)', '0.40 – 0.65', 'The deep-cannibalisation zone. Bungala, Daydream, Hayman and Limondale sit here in recent years.'],
          ['Battery storage (discharge)', '1.3 – 2.5+', 'Batteries discharge only in the highest-priced intervals by design. Their capture on discharge exceeds the pool average by a large margin.'],
        ]}
      />

      <P>
        Wind sits close to 1.0 because its output profile is more scattered across the day and the
        year and because Australia has fewer scale-fleet-diversification issues (wind fleets are
        smaller and geographically spread differently). Utility solar cannot escape the
        coincident-output problem &mdash; and the next lessons show where the AURES data now sits.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 2 — Live AURES data
// ============================================================

function Lesson2() {
  return (
    <div>
      <H2>Where to look in AURES</H2>
      <P>
        AURES exposes solar cannibalisation data in two places: the{' '}
        <Link to="/intelligence/revenue" className="text-[var(--color-primary)] hover:underline">
          Revenue Intelligence page
        </Link>{' '}
        (fleet-level value factor and state report cards) and each operating solar farm&rsquo;s
        detail page, where the <Em>Solar Value Analysis</Em> section shows capture price by month
        against the pool average, with a PDF export. Cross-reference against the{' '}
        <Link to="/intelligence/drift-analysis" className="text-[var(--color-primary)] hover:underline">
          Drift Analysis
        </Link>{' '}
        page for capture-price time series at the fleet level.
      </P>

      <H2>The state ranking (broadly stable across recent years)</H2>
      <Table
        emphasizeFirst
        headers={['State', 'Fleet VF trend', 'What is driving it']}
        rows={[
          ['SA', 'Deepest cannibalisation — often 0.40–0.55 for large solar farms', 'Small load base, high rooftop penetration (~50% of dwellings), utility solar as marginal supply for many midday intervals. Also negative spot prices frequently.'],
          ['QLD', 'Second-deepest — mid-0.50s to low 0.60s for recent large farms', 'Highest utility-solar capacity growth in NEM, high rooftop penetration, gentailer retail books short of daytime output.'],
          ['NSW', 'Middle of the pack — mid-0.60s to low 0.70s, deteriorating', 'Larger load base absorbs more of the peak; still declining fast as capacity grows and Eraring closure is priced into the curve.'],
          ['VIC', 'Best of the four so far — 0.75–0.85 typical', 'Lower utility-solar penetration relative to load; connection queue depth is more of a constraint than merit-order economics.'],
        ]}
      />

      <Callout type="warn">
        These bands are typical of recent AURES data but move by ~5&ndash;10 percentage points
        year to year depending on weather (cloud, temperature) and fleet composition. Always read
        the live number for a specific project on its own detail page rather than a state
        headline.
      </Callout>

      <H2>Best and worst — the pattern</H2>
      <H3>Structurally cannibalised farms</H3>
      <P>
        The lowest capture prices in the AURES fleet cluster in three patterns:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>SA solar &mdash; small load base + high rooftop.</Em> Bungala and Tailem Bend have carried low VFs for years.</li>
        <li><Em>Queensland high-density solar corridors.</Em> Daydream, Hayman, Warwick, Ross River, Emerald &mdash; large farms in the same electrical neighbourhood competing into the same daytime intervals.</li>
        <li><Em>Riverina-cluster NSW farms.</Em> Limondale, Sunraysia, Coleambally, Darlington Point &mdash; the same coincident-generation problem plus binding transmission constraints that force curtailment before the merit-order effect can help.</li>
      </ul>

      <H3>Regional outliers with better capture</H3>
      <P>
        A minority of farms consistently outperform state averages. The pattern:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Geographic isolation.</Em> A farm far enough from other solar farms sees less local capacity to compete against, and its output shape peaks slightly differently.</li>
        <li><Em>Winter capacity factor.</Em> Farms with better winter output relative to summer capture more of the tighter winter evening prices (though winter production is lower overall).</li>
        <li><Em>Favourable connection.</Em> A farm connected to a network node where the local load partially absorbs the daytime output faces less price depression than one whose only path is through a congested regional interconnector.</li>
        <li><Em>Bundled PPAs.</Em> A farm with a fixed-price PPA that covers most of its output is insulated from the merchant capture-price problem &mdash; the offtake counterparty bears it. That doesn&rsquo;t change VF as a metric; it changes who bears the exposure.</li>
      </ul>

      <H2>Cross-state comparison — a rough $/MWh gap</H2>
      <P>
        If the NEM time-weighted average pool price is around $90/MWh in the year to mid-2026, then
        a state fleet VF of 0.50 vs 0.80 translates directly to $45/MWh vs $72/MWh in capture. On
        a 200 MW farm generating 460 GWh/yr that&rsquo;s a $12m/year revenue gap simply from state
        of connection. It is the largest single revenue variable a solar developer chooses
        &mdash; and it is one they cannot change post-COD.
      </P>

      <Callout type="source">
        For per-project capture prices, open the project detail page and scroll to Solar Value
        Analysis. The panel exports a PDF sized for board packs. Fleet-level rankings live on the{' '}
        <Link to="/intelligence/revenue" className="text-[var(--color-primary)] hover:underline">
          Revenue Intelligence page
        </Link>{' '}
        under State Report Cards and Value Factor.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 3 — The curve
// ============================================================

function Lesson3() {
  return (
    <div>
      <H2>The historical trajectory</H2>
      <P>
        Utility solar value factors in the NEM have been on a consistent one-way trend since
        roughly 2018. The rank order across states has been stable &mdash; SA fell fastest, then
        QLD, then NSW, with VIC decaying more slowly &mdash; and every state&rsquo;s trend line
        points down. A pragmatic reading of the AURES fleet data shows the state cohorts
        converging: SA hit VF = 0.5 first, QLD followed a couple of years later, and NSW is now
        in the mid-0.6s and heading in the same direction.
      </P>

      <H2>The threshold effect</H2>
      <P>
        The relationship between penetration and value factor is not linear. Beyond a threshold
        &mdash; roughly the point at which midday utility-solar output plus rooftop equals or
        exceeds local demand &mdash; each additional megawatt of solar starts pushing spot prices
        into <Em>negative</Em> territory rather than merely toward zero.
      </P>

      <Callout type="key">
        The threshold matters because <Em>negative prices cannibalise revenue faster than
        positive-but-low prices do</Em>. A farm running through 200 hours of $0/MWh loses 200
        hours &times; volume of expected revenue. A farm running through 200 hours of −$50/MWh
        loses that same expected revenue <em>plus</em> pays the pool if it&rsquo;s not curtailed
        (or forgoes LGC revenue if it is). SA has been through this threshold; QLD is at it; NSW
        is approaching it.
      </Callout>

      <H2>Negative-price hours — mechanics and prevalence</H2>
      <P>
        A solar farm faces a choice when spot goes negative:
      </P>
      <ol className="list-decimal list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Keep generating.</Em> Continue producing LGCs and settling volume at negative pool prices. Rational if bundled LGC revenue exceeds the negative $/MWh loss.</li>
        <li><Em>Curtail.</Em> Reduce or halt output. Forgoes both LGC and the pool payment (which is negative, so a saving).</li>
        <li><Em>Bid above zero.</Em> Offer above the marginal negative bid, hoping the merit order clears you out of dispatch. Different mechanically but similar economically to curtailment.</li>
      </ol>
      <P>
        AEMO now separately reports curtailment reasons in the QED &mdash; economic curtailment
        (farm chose not to run because pool was negative) has grown from a rounding-error line
        item in 2019 to a material share of forgone output in the recent quarters. SA leads,
        QLD is catching up, NSW visible in the tail of the distribution.
      </P>

      <H2>LCOE vs LCOE-net-of-cannibalisation</H2>
      <P>
        The CSIRO GenCost report publishes utility solar LCOE around <Em>$70&ndash;80/MWh</Em>
        for the current build cost environment. The number is calculated against a fully-earned
        pool price. Adjust it for a realistic value factor and the picture is very different:
      </P>
      <Table
        emphasizeFirst
        headers={['Metric', 'GenCost view', 'Cannibalisation-adjusted']}
        rows={[
          ['LCOE per MWh generated', '$70–80', 'Same — the cost of generation does not change'],
          ['Pool price assumption', '$80–110/MWh time-weighted', '$50–70/MWh actual capture at VF 0.6'],
          ['Merchant margin', 'Positive $10–30/MWh', 'Negative $10–30/MWh — cannot cover LCOE'],
          ['What closes the gap', 'n/a', 'A firmed PPA at fixed strike, a CIS/LTESA underwrite, or a co-located battery'],
        ]}
      />

      <Callout type="warn">
        <Em>The most common analytical mistake reading GenCost:</Em> comparing the LCOE headline
        to the pool average and concluding solar is bankable. It isn&rsquo;t, at merchant risk in
        a high-penetration state. The comparison that matters is LCOE vs capture price, and the
        gap is a bankability problem that either firming, contract cover or additional revenue
        (LGC surrogate, storage arbitrage) has to bridge. The{' '}
        <Link to="/learn/cis-ltesa-verdict" className="text-[var(--color-primary)] hover:underline">
          CIS &amp; LTESA Verdict module
        </Link>{' '}
        goes deep on why CISA-alone hasn&rsquo;t bridged this gap for the wind cohort and
        wouldn&rsquo;t for solar either.
      </Callout>

      <H2>Where does the curve end?</H2>
      <P>
        The curve does not asymptote to zero on its own. Two mechanisms in principle limit it:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Investment stops.</Em> When VF falls low enough that no new solar can clear its cost of capital, the fleet stops growing and the trend flattens. This is the market solution, but it happens only after new supply becomes uninvestable.</li>
        <li><Em>Demand catches up.</Em> Electrification of transport, industrial load and data centres can raise midday consumption to absorb more of the solar output. This is the demand-side solution, and it is the only one that does not require solar to fail first.</li>
      </ul>
      <P>
        Storage co-location (Lesson 5) is not on that list because &mdash; as the Verdict module
        argues &mdash; storage compresses its own arbitrage spread with every unit added, and
        eventually faces the same self-cannibalising dynamic.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 4 — Rooftop
// ============================================================

function Lesson4() {
  return (
    <div>
      <H2>The largest source of new midday supply is a competitor solar farms cannot deter</H2>
      <P>
        Utility solar cannibalises other utility solar. That is the mechanic of Lesson 1. But there
        is a second, compounding force that acts against every utility solar farm and that no
        pricing mechanism can send a signal to: <Em>rooftop solar</Em>. Australia&rsquo;s
        rooftop fleet is the densest per capita in the world &mdash; over 4 million households, more
        than 24 GW installed by 2026, and adding roughly 4 TWh of generation per year.
      </P>

      <Callout type="numbers">
        <p>In the year to July 2026 the NEM&rsquo;s rooftop solar generated approximately
        <Em> 30.5 TWh &mdash; 13.7% of NEM generation, more than brown coal.</Em> It is the largest
        source of new midday supply, growing on household payback logic and legacy feed-in tariffs,
        and it does not respond to wholesale spot prices.</p>
      </Callout>

      <H2>Operational demand vs underlying demand</H2>
      <P>
        AEMO distinguishes two demand series:
      </P>
      <Table
        emphasizeFirst
        headers={['Series', 'What it measures', 'How rooftop shows up']}
        rows={[
          ['Underlying demand', 'Total electricity consumption in the region — including energy served by rooftop solar behind the meter', 'Rooftop is invisible in this series — it looks like the region simply consumed less grid-supplied energy'],
          ['Operational demand', 'Energy that the NEM must serve — total consumption minus behind-the-meter generation', 'Rooftop appears as a direct reduction in operational demand at every midday interval'],
        ]}
      />
      <P>
        The gap between the two series has widened dramatically. In the mid-2010s underlying and
        operational demand were nearly identical. In 2026 they diverge by roughly 30 TWh a year
        &mdash; the whole rooftop contribution. Utility solar competes against operational demand,
        and operational demand at midday is falling <Em>in absolute terms</Em> in high-rooftop
        states as new rooftop arrives faster than underlying growth.
      </P>

      <H2>Minimum operational demand events</H2>
      <P>
        When operational demand falls low enough, the NEM starts encountering system security
        limits &mdash; the grid needs some minimum thermal generation for inertia, system strength
        and voltage control. If solar output plus rooftop plus wind is more than local demand plus
        interconnector capacity, someone must be curtailed.
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>South Australia</Em> has run through several intervals of &lt;500 MW operational demand across recent Octobers &mdash; effectively the whole state was being served by rooftop and wind. AEMO has invoked emergency directions on rooftop in-principle (the ability to command switch-off), though rarely in practice.</li>
        <li><Em>Queensland</Em> is now regularly seeing minimum operational demand events on shoulder-season sunny weekend middays.</li>
        <li><Em>NSW and VIC</Em> are approaching the threshold in some quarters.</li>
      </ul>

      <H2>The compounding problem for utility solar</H2>
      <Callout type="key">
        <Em>Rooftop grows on a payback logic that ignores utility-solar economics.</Em> A
        homeowner installing rooftop looks at the retail price plus the STC subsidy, not at
        whether the wholesale price is negative that afternoon. New rooftop arrives every quarter
        whether or not utility solar is investable. The window in which utility solar earns
        useful revenue shrinks &mdash; from both sides &mdash; even as utility-solar capacity
        keeps growing.
      </Callout>

      <P>
        Utility solar can, in principle, be dispatched off when prices go negative. Rooftop
        cannot. That asymmetry means the residual price-setting burden falls on utility solar every
        time midday supply exceeds midday demand. The utility-scale fleet bears the cannibalisation
        cost while rooftop generates the surplus.
      </P>

      <H2>Rooftop forecasting is itself a discipline</H2>
      <P>
        AEMO forecasts rooftop uptake in its IASR (see the{' '}
        <Link to="/learn/nem-publications/iasr" className="text-[var(--color-primary)] hover:underline">
          Reading the NEM module, Lesson 3
        </Link>{' '}
        for how the IASR treats it). The 2024 IASR projected rooftop reaching ~40 GW installed
        by 2035 under Step Change; battery-paired household systems roughly 25% of new installs by
        2030 under the Cheaper Home Batteries program. If those numbers hold, midday operational
        demand keeps falling as a share of underlying, and the utility-solar window keeps closing.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 5 — Co-located storage
// ============================================================

function Lesson5() {
  return (
    <div>
      <H2>The economic argument for co-location</H2>
      <P>
        The idea is simple. A solar farm produces at $10&ndash;30/MWh in cannibalised midday
        intervals (or at negative prices where it&rsquo;s not curtailed). A battery paired with
        that solar farm can charge from the array for effectively nothing &mdash; the array
        wasn&rsquo;t earning much for that generation anyway &mdash; and discharge into the evening
        peak at $150&ndash;250/MWh. The battery rescues the value the solar farm was leaving on
        the table.
      </P>

      <Callout type="numbers">
        <p><Em>Illustrative math.</Em> A 200 MW / 800 MWh 4-hour BESS co-located with a 200 MW
        solar array. On a typical day the array produces 1,200 MWh; without the battery, maybe 400
        MWh of that clears at capture prices of $10&ndash;30/MWh. The battery absorbs 800 MWh of
        that array output at effectively zero cost, then discharges the same 800 MWh
        (post-efficiency) into the evening peak. If the discharge spread is $150/MWh vs a charging
        cost of $20/MWh, the BESS contributes ~$100/MWh &times; 800 MWh = <Em>$80,000 in daily
        gross margin</Em> that the standalone array would not have earned.</p>
      </Callout>

      <H2>The CIS hybrid tailwind</H2>
      <P>
        Australian policy has explicitly pushed hybrid solar+BESS. CIS Tender 1 (NEM Generation,
        Dec 2024) had roughly 42% hybrid share by count. CIS Tender 4 (Oct 2025) rose to 60%. CIS
        Tender 7 (May 2026) continued the trend, with most large-solar bids configured as
        hybrids. The rationale is exactly the co-location math above: the winners are the
        configurations that can survive merchant capture-price compression.
      </P>

      <Callout type="source">
        See the{' '}
        <Link to="/learn/bess-story" className="text-[var(--color-primary)] hover:underline">
          Solar + BESS in the NEM module
        </Link>{' '}
        for the detailed treatment of hybrid architectures (AC-coupled vs DC-coupled, shared
        BoP economics, revenue stack decomposition) and the CIS hybrid share trajectory by
        round. This lesson focuses on whether the answer actually holds.
      </Callout>

      <H2>Why co-location is not the full answer</H2>
      <P>
        Three reasons the co-location remedy has structural limits.
      </P>

      <H3>1. Storage compresses its own spread</H3>
      <P>
        Every battery added to the NEM narrows the midday-to-evening spread. The NEM battery
        fleet grew from roughly 2 GW to 8 GW in twelve months to mid-2026. NEM-wide BESS revenue
        in May 2026 was <Em>$29k/MW/yr &mdash; an all-time low since Modo began tracking in July
        2022.</Em> Q2 2026 average $38.9k/MW/yr. Price spread compressed from $183/MWh to
        $121/MWh (a 34% fall) in twelve months. New BESS projects now need to underwrite
        $50&ndash;60k/MW/yr or lower, against 2024-vintage forecasts above $100k.
      </P>
      <Callout type="warn">
        <Em>The BESS mechanism is self-inflicted in the same way solar&rsquo;s is.</Em> Batteries
        earn from spread. Every battery narrows the spread. A fleet that quadrupled in a year
        competed away the arbitrage that justified it. See the{' '}
        <Link to="/learn/cis-ltesa-verdict/three-tech" className="text-[var(--color-primary)] hover:underline">
          Verdict module Lesson 7 (three-technology divergence)
        </Link>{' '}
        for the argument that every renewable technology destroys the price signal that funded
        it.
      </Callout>

      <H3>2. Charge-source labelling and the renewable claim</H3>
      <P>
        For LGC eligibility and PPA reporting, whether a battery discharge counts as
        &ldquo;renewable&rdquo; depends on where the electrons came from. A DC-coupled hybrid
        charging from its own array unambiguously discharges renewable energy. An AC-coupled
        hybrid may charge from the grid whenever the pool price is negative, which is renewable
        in effect (because negative-price hours are usually solar-driven) but the accounting is
        harder. This shapes what a corporate offtaker will pay for the discharge output.
      </P>

      <H3>3. Duration and the two-competing-arbitrages problem</H3>
      <P>
        A 4-hour battery competes into evening scarcity intervals. A 2-hour battery competes into
        the same intervals but for less duration. As the fleet grows, 4-hour BESS bidders start
        competing with 2-hour BESS bidders <em>and</em> with each other. Duration extension
        (8h, 12h, LDS) partially escapes this &mdash; but the LDS market is smaller, more capex
        intensive, and structurally different (see the LTESA LDS rounds treatment in the{' '}
        <Link to="/learn/cis-ltesa-verdict/ltesa" className="text-[var(--color-primary)] hover:underline">
          Verdict module Lesson 9
        </Link>).
      </P>

      <H2>The sober conclusion</H2>
      <Callout type="key">
        Co-located storage is a real economic answer for the current cohort of solar projects.
        It preserves value the standalone solar would have left on the table, it aligns with the
        policy tailwind, and it produces bankable revenue stacks that pure-play solar cannot
        replicate. <Em>But it does not fix the underlying arithmetic.</Em> It delays the
        compression by taking output that was being cannibalised and moving it to a different
        interval &mdash; and once enough co-located storage is doing that, the evening interval
        gets cannibalised too.
      </Callout>

      <H2>Two things that would actually fix it</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1 mb-3 ml-2">
        <li><Em>Demand growth at scale.</Em> Every additional TWh of midday consumption &mdash; industrial electrification, data centres, EV smart charging &mdash; absorbs solar output that would otherwise be cannibalised. NEM demand growth has fallen from +5.2% in early 2024 to 0.0%. Restoring it to +3&ndash;4% a year would ease all three revenue problems &mdash; solar capture, BESS spread, wind curve &mdash; without any change to contract design.</li>
        <li><Em>Structural change to what solar earns for.</Em> Payment for firm capacity, for shape, for local system services, for green certificates in a scheme that survives 2030 &mdash; anything that decouples solar revenue from the coincident-generation pool price. Every serious proposal is in that direction.</li>
      </ul>

      <Callout type="source">
        This module treats the mechanism. The{' '}
        <Link to="/learn/bess-story" className="text-[var(--color-primary)] hover:underline">
          Solar + BESS module
        </Link>{' '}
        treats the arc from rooftop through BESS to spread saturation. The{' '}
        <Link to="/learn/cis-ltesa-verdict" className="text-[var(--color-primary)] hover:underline">
          CIS &amp; LTESA Verdict module
        </Link>{' '}
        picks up the &ldquo;three technologies each destroy the price signal that funds them&rdquo;
        argument in its Lesson 7. And the{' '}
        <Link to="/intelligence/revenue" className="text-[var(--color-primary)] hover:underline">
          Revenue Intelligence page
        </Link>{' '}
        keeps the live data updated on where each solar farm currently sits on the
        cannibalisation curve.
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
          <span className="text-3xl" aria-hidden>☀️</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            ✅ Available
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight"
          style={{ borderLeft: '4px solid #f59e0b', paddingLeft: 12, marginLeft: -12 }}>
          Solar Cannibalisation in the NEM
        </h1>
        <p className="text-base italic text-[var(--color-text-muted)]">
          Why solar earns less than the pool — and where it ends.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          Five lessons on the mechanism, the AURES data, the historical curve, rooftop as the
          compounding force, and a sober assessment of whether co-located storage really fixes
          the underlying arithmetic. Complements the{' '}
          <Link to="/learn/bess-story" className="text-[var(--color-primary)] hover:underline">
            Solar + BESS module
          </Link>{' '}
          (which uses cannibalisation as the setup for a BESS story) &mdash; this one stays with
          solar and pushes further into <em>why the curve doesn&rsquo;t asymptote and what would
          actually fix it</em>.
        </p>
      </div>

      <div className="space-y-3">
        {LESSONS.map(l => {
          const done = progress.has(l.id)
          return (
            <Link key={l.id} to={`/learn/solar-cannibalisation/${l.id}`}
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
            <Link to="/intelligence/revenue" className="text-[var(--color-primary)] hover:underline">
              Revenue Intelligence →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— fleet-level value factor and state report cards</span>
          </li>
          <li>
            <Link to="/intelligence/drift-analysis" className="text-[var(--color-primary)] hover:underline">
              Drift Analysis →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— capture-price time series at the fleet level</span>
          </li>
          <li>
            <Link to="/intelligence/solar-resource" className="text-[var(--color-primary)] hover:underline">
              Solar Resource →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— capacity factor and clipping benchmarks by class</span>
          </li>
          <li>
            <Link to="/learn/bess-story" className="text-[var(--color-primary)] hover:underline">
              Solar + BESS module →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— hybrid architectures, unit economics, spread saturation</span>
          </li>
          <li>
            <Link to="/learn/cis-ltesa-verdict/three-tech" className="text-[var(--color-primary)] hover:underline">
              CIS &amp; LTESA Verdict, Lesson 7 →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— the three-technology divergence argument</span>
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
        <Link to="/learn/solar-cannibalisation" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← Solar Cannibalisation
        </Link>
        <span className="text-[var(--color-text-muted)]">Lesson {lesson.number} of {LESSONS.length} · {lesson.readingTime}</span>
      </div>

      <div className="space-y-1 pb-4 border-b border-[var(--color-border)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Lesson {lesson.number}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight">{lesson.title}</h1>
        <p className="text-base italic text-[var(--color-text-muted)]">{lesson.subtitle}</p>
      </div>

      <article className="text-[15px] text-[var(--color-text-muted)]">
        {lesson.id === 'mechanics'     && <Lesson1 />}
        {lesson.id === 'data'          && <Lesson2 />}
        {lesson.id === 'curve'         && <Lesson3 />}
        {lesson.id === 'rooftop'       && <Lesson4 />}
        {lesson.id === 'storage-stack' && <Lesson5 />}
      </article>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <button onClick={() => navigate(`/learn/solar-cannibalisation/${prev.id}`)}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors">
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => { onComplete(lesson.id); navigate(`/learn/solar-cannibalisation/${next.id}`) }}
            className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors">
            {progress.has(lesson.id) ? 'Continue' : 'Mark read & continue'} → {next.title}
          </button>
        ) : (
          <button onClick={() => { onComplete(lesson.id); navigate('/learn/solar-cannibalisation') }}
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

export default function SolarCannibalisationModule() {
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
        <Link to="/learn/solar-cannibalisation" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Back to module index
        </Link>
      </div>
    )
  }

  return <LessonView lesson={lesson} progress={progress} onComplete={onComplete} />
}
