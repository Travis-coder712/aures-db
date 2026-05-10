/**
 * The Solar + BESS Story in the NEM — AURES Learning Module
 *
 * 7 lessons that tell the full arc: residential solar boom →
 * commercial scale → behind-the-meter scale → cannibalisation →
 * Hornsdale → modern BESS economics → outlook. The solar boom is
 * what made BESS necessary, so the module starts there.
 */
import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-bess-story-progress'

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
  { id: 'rooftop-boom',     number: 1, title: 'The Australian rooftop solar boom',                subtitle: 'FITs, STCs, electricians and Chinese modules',           readingTime: '12 min' },
  { id: 'btm-scale',        number: 2, title: 'Commercial solar and the hidden-demand effect',     subtitle: 'Operational demand vs underlying demand',                readingTime: '10 min' },
  { id: 'cannibalisation',  number: 3, title: 'From cannibalisation to opportunity',               subtitle: 'Why solar made BESS necessary',                          readingTime: '8 min' },
  { id: 'hornsdale',        number: 4, title: 'Origins: Hornsdale and the Tesla bet',              subtitle: 'How a Twitter bet rewrote the orthodoxy',                readingTime: '10 min' },
  { id: 'how-earns',        number: 5, title: 'How a battery actually earns',                      subtitle: 'Arbitrage, FCAS, capacity, with real AURES numbers',     readingTime: '11 min' },
  { id: 'duration-records', number: 6, title: 'The duration evolution and BESS records',           subtitle: '1-hour to 8-hour and the state-by-state leaderboard',    readingTime: '10 min' },
  { id: 'outlook',          number: 7, title: 'Where this is going — more solar, more batteries',  subtitle: 'Residential battery boom and ISP storage targets',       readingTime: '9 min' },
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
// Lesson 1 — The Australian rooftop solar boom
// ============================================================

function Lesson1() {
  return (
    <div>
      <H2>A genuine global outlier</H2>
      <P>
        Australia has more rooftop solar per capita than any country on earth. As of 2026, roughly{' '}
        <Em>one in three Australian dwellings has rooftop PV</Em> — about 4 million homes — adding up to
        more than 24 GW of installed capacity. That fleet generates 10-15% of all NEM electricity in any
        given year, more than 25% in summer afternoons, and more than 100% of South Australia's local
        load on perfect-condition days. None of this was foreseen in any official planning document
        from 2010, 2015, or even 2020. The Australian rooftop boom kept exceeding forecasts because three
        independent forces compounded: government support, falling module costs, and a uniquely
        competitive installer market.
      </P>

      <Callout type="key">
        The headline reason rooftop solar in Australia is so much bigger than in any comparable country
        is that <Em>Australian residential systems cost roughly $1.00-1.30 per watt installed</Em>,
        whereas US residential is $3.00-4.00/W and UK residential is around £1.50/W (~$2.80 AUD).
        The same 6.6 kW system costs ~$7,000 here and ~$22,000 in the US. The economics are simply
        different — and they are different not because Australians have lower wages (we don't) but
        because of a specific industry structure described below.
      </Callout>

      <H2>Phase 1 — the premium feed-in tariff era (2008-2014)</H2>
      <P>
        Australian rooftop solar started small and was kicked off by state government feed-in tariff
        (FIT) schemes that paid premium rates for solar exports. The most famous were:
      </P>
      <Table
        emphasizeFirst
        headers={['State', 'Scheme', 'Rate', 'Open period', 'Notes']}
        rows={[
          ['NSW', 'Solar Bonus Scheme', '60 c/kWh gross (later 20 c)', 'Jan 2010 – Apr 2011 closed to new applicants', 'Expensive in retrospect — locked NSW consumers into ~$1.7B of payments through 2016'],
          ['VIC', 'Premium FIT', '60 c/kWh net', 'Nov 2009 – Sep 2011', 'Tied to gross export only; closed to new entrants 2011'],
          ['SA', 'Solar FIT', '44-54 c/kWh', '2008-2013 (multiple revisions)', 'Closed cohort still benefiting through 2028'],
          ['QLD', 'Solar Bonus Scheme', '44 c/kWh net', 'Jul 2008 – Jul 2012', 'Closed in 2012; legacy customers grandfathered to 2028'],
          ['ACT, WA, TAS', 'Various FITs', '20-50 c/kWh', '2010-2013', 'All closed to new entrants by 2013'],
          ['Federal SHCP', 'Solar Homes & Communities Plan rebate', '$8,000 cash rebate', '2008-2009', 'Cash up-front rebate that kicked off the first wave'],
        ]}
      />
      <P>
        These FITs were rationalised down (sometimes abruptly, generating political controversy) once
        the cost of solar dropped enough that lower export rates were sufficient. By 2013-14, premium
        FITs were closed to new customers; what remained were 1:1 net feed-in tariffs at ~10-15 c/kWh,
        which are still the dominant retail offering today.
      </P>

      <H2>Phase 2 — STCs and the regulated subsidy (2011-present)</H2>
      <P>
        From 2011, the Renewable Energy Target's small-scale component was carved out as the{' '}
        <Em>Small-scale Renewable Energy Scheme (SRES)</Em>, generating Small-scale Technology
        Certificates (STCs). Each STC represents 1 MWh of expected lifetime generation. A typical 6.6 kW
        residential system in Sydney generates ~80 STCs at installation. Liable retailers (those who sell
        electricity) must surrender STCs in proportion to their sales, creating demand. STC prices have
        traded in the $30-40 range for most of the past decade — meaning the average residential install
        receives an upfront subsidy of roughly $2,400-3,200 (paid by the installer to the customer as a
        point-of-sale discount).
      </P>
      <P>
        The SRES is scheduled to wind down in 2030. A 6.6 kW system installed in 2026 will receive only
        4 years' worth of STCs (one per remaining year). This is one of the reasons the residential
        solar industry has been pushing customers to install <Em>now</Em> — and why the Federal
        Government's 2025 Cheaper Home Batteries policy was timed to extend support past the SRES
        sunset.
      </P>

      <H2>Phase 3 — the Australian installer cost advantage</H2>
      <P>
        This is the most under-appreciated piece of the story. Australia has approximately{' '}
        <Em>10,000+ accredited solar installers</Em>, the vast majority of which are sole operators or
        small partnerships of 2-10 electricians. The Clean Energy Council accreditation regime requires
        a licensed electrician with solar PV training, but otherwise has very few barriers to entry. The
        result is a hyper-competitive installer market.
      </P>
      <P>
        Compare to the US, where:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>State-level licensing plus city-level permitting take 60-90 days for a typical residential install</li>
        <li>Two large companies (Sunrun and SunPower historically; Tesla via Solar Roof; some
          regional players) dominate residential</li>
        <li>Soft costs (permitting, customer acquisition, sales commissions) are 50-60% of total install
          cost</li>
        <li>Module costs are similar to Australia, but everything else is 2-3× more expensive</li>
      </ul>
      <P>
        Compare to the UK and most of Europe, where:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Electrical regulation is stricter and licensing burden higher</li>
        <li>The installer market is less fragmented — fewer single-electrician operators</li>
        <li>VAT and other taxes are higher</li>
        <li>Result: ~£1.50/W vs Australia's ~$1.10/W — but with much lower roof orientations
          economics due to higher latitude and weather</li>
      </ul>
      <P>
        Australia's combination of <Em>(a) low installer overhead, (b) no permitting friction, and{' '}
        (c) standardised AS/NZS-compliant equipment</Em> means a 6.6 kW install is a 1-2 day job by a
        single electrician + apprentice, completed end-to-end within 2-4 weeks of customer enquiry. That
        is the single biggest cost advantage and is structurally hard to replicate elsewhere.
      </P>

      <Callout type="info">
        The Australian electrician industry has historically been adversarial about &ldquo;solar
        cowboys&rdquo; — installers who cut corners on safety. The Clean Energy Council does enforce
        accreditation removal for repeat offenders, and the most egregious operators have been
        prosecuted. But the broader pattern — many small operators competing aggressively on price —
        has been a powerful force keeping costs down. It's an example where labour-market structure
        beat regulatory consolidation.
      </Callout>

      <H2>Phase 4 — Chinese modules and the dumping question</H2>
      <P>
        The other half of the cost story is module pricing. Module prices have collapsed about{' '}
        <Em>90% over the past decade</Em>:
      </P>
      <Table
        emphasizeFirst
        headers={['Year', 'Module spot price (US$/W)', 'Driver']}
        rows={[
          ['2010', '~$2.00/W', 'First-generation crystalline silicon, mostly European and US makers'],
          ['2014', '~$0.65/W', 'Chinese manufacturing scale, US/EU anti-dumping tariffs in place'],
          ['2018', '~$0.30/W', 'Continued Chinese scale, automation, polysilicon glut'],
          ['2022', '~$0.22/W', 'COVID-era supply chain pressure briefly reversed the decline'],
          ['2024', '~$0.10/W', 'Significant overcapacity in Chinese manufacturing, polysilicon prices crashed'],
          ['2026', '~$0.10/W (with PERC) — bifacial / TOPCon at $0.12-0.14/W', 'Industry oversupply continues'],
        ]}
      />
      <P>
        Chinese manufacturers (Trina, Jinko, Longi, JA Solar, Canadian Solar — though &ldquo;Canadian&rdquo;
        Solar is mostly Chinese-manufactured) dominate global supply, with roughly 80-85% of world
        production by capacity in 2024. The question of whether this is <Em>dumping</Em> — selling
        below cost to capture market share — is genuinely contested:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Yes:</Em> the US Department of Commerce, the European Commission, and India have all
          formally found dumping and applied tariffs. The 2022-24 anti-dumping investigations in the US
          extended to Chinese modules manufactured in Cambodia, Malaysia, Thailand, and Vietnam — finding
          circumvention was widespread.</li>
        <li><Em>No (Chinese position):</Em> low prices reflect genuine manufacturing efficiency, vertical
          integration with polysilicon, scale economies, and currency. Recent industry losses among
          Chinese makers (Longi, Jinko reporting losses 2024) suggest prices are at or below break-even
          even before subsidies.</li>
        <li><Em>Australia's position:</Em> Australia has not imposed anti-dumping duties on Chinese
          solar modules. The Australian Competition and Consumer Commission and Anti-Dumping
          Commission have considered cases, but no duties have been applied to PV modules to date.
          This means Australian installers source the same modules as global markets do, but pay no
          tariff premium on top.</li>
      </ul>

      <Callout type="warn">
        It is fair to say that <Em>the absence of Australian anti-dumping action has been a material
        cost advantage</Em> for Australian residential solar relative to the US/EU. Whether that is
        good policy is a separate question — supporters argue it speeds the transition; critics argue
        it accepts subsidised supply chains and forecloses domestic manufacturing options. As of 2026
        the question remains live, with the Federal Government's Future Made in Australia agenda
        funding pilot Australian module manufacturing.
      </Callout>

      <H2>The cumulative effect — the world's biggest rooftop fleet</H2>
      <Table
        emphasizeFirst
        headers={['Year', 'Installed rooftop capacity (GW)', 'Households (m)', 'Share of dwellings']}
        rows={[
          ['2014', '~3 GW', '~1.6 m', '~17%'],
          ['2018', '~8 GW', '~2 m', '~22%'],
          ['2022', '~17 GW', '~3 m', '~28%'],
          ['2024', '~22 GW', '~3.6 m', '~31%'],
          ['2026', '~26 GW', '~4 m', '~33-35%'],
        ]}
      />
      <P>
        For comparison: Germany has roughly 12 GW of residential rooftop on a population three times
        the size. The US has ~25 GW of residential rooftop on a population 13× larger. The UK has
        roughly 5 GW. Australia's rooftop fleet, on a per-capita basis, is comfortably the world's
        largest.
      </P>

      <Callout type="source">
        Sources: Clean Energy Regulator <em>Postcode data</em> ·
        Australian PV Institute <em>APVI dashboard</em> ·
        Clean Energy Council <em>Clean Energy Australia annual report</em> ·
        BloombergNEF <em>Solar Module Price Index</em> ·
        IEA-PVPS <em>Trends in Photovoltaic Applications</em> ·
        US ITC anti-dumping decisions on Chinese modules (2012, 2014, 2022-24) ·
        SunWiz <em>Australian PV market reports</em> ·
        AEMC <em>Residential Electricity Price Trends</em>.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 2 — Commercial solar and behind-the-meter scale
// ============================================================

function Lesson2() {
  return (
    <div>
      <H2>The commercial scale-up</H2>
      <P>
        Once residential solar hit saturation in any given suburb, the installer industry moved to the
        commercial segment — schools, factories, supermarkets, warehouses, council buildings. Commercial
        systems are typically <Em>30 kW – 1 MW</Em> in scale, sit on flat or low-pitched roofs, and are
        installed in days rather than weeks. They share the residential cost-advantage thesis (small,
        competitive installers; standardised equipment; light permitting) but with bigger systems and
        often more sophisticated financing — solar PPAs at the building level, performance guarantees,
        and increasingly battery co-location.
      </P>
      <P>
        As of 2026, commercial PV adds roughly <Em>4-5 GW</Em> on top of the residential 26 GW, for a
        total behind-the-meter (BTM) fleet of ~30-31 GW. That is more than half of total installed
        renewable capacity in Australia and substantially more than all utility-scale solar combined
        (~10-12 GW utility solar in the NEM).
      </P>

      <Table
        emphasizeFirst
        headers={['Sector', 'Approx capacity', 'Typical system', 'Trend']}
        rows={[
          ['Residential', '~26 GW', '6-13 kW', 'Mature; growth slowing in saturated areas; battery attach picking up'],
          ['Commercial mid-scale', '~3-4 GW', '30 kW – 1 MW', 'Strongest growth segment; PPA financing increasingly available'],
          ['Industrial / large commercial', '~1 GW', '1-5 MW (sometimes ground-mounted)', 'Emerging — major retailers, miners, agribusiness'],
        ]}
      />

      <H2>Operational demand vs underlying demand</H2>
      <P>
        AEMO publishes two demand metrics for the NEM:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Operational demand</Em> — what the grid sees. The energy actually drawn from the
          transmission network, after rooftop solar has been netted off behind-the-meter consumption.</li>
        <li><Em>Underlying demand</Em> — total energy actually consumed. The sum of grid imports plus
          rooftop generation that was self-consumed. This is the &ldquo;real&rdquo; consumption — the
          number you'd see if rooftop solar didn't exist.</li>
      </ul>

      <Callout type="key">
        The gap between underlying demand and operational demand is what behind-the-meter solar
        contributes. In Q1 2026, the gap was roughly <Em>15-20% of underlying demand on average</Em>,
        and as much as <Em>40-50% during midday solar peaks in SA, VIC and QLD</Em>. AEMO's grid view
        of demand is therefore systematically smaller than the underlying load — and getting more so
        every year as new rooftop comes online.
      </Callout>

      <H2>The hidden demand growth problem</H2>
      <P>
        Behind-the-meter solar masks an important fact: <Em>total electricity consumption is growing
        again</Em>. After fifteen years of flat or declining operational demand (driven by rooftop
        offset, energy efficiency, and economic restructuring away from heavy industry), the grid is
        starting to see structural demand growth from three sources:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Data centres</Em> — Australia is forecast to need 2-4 GW of additional data-centre
          capacity by 2030 to host hyperscale (AWS, Microsoft, Google) workloads, plus AI training
          loads. Sydney and Melbourne are the hubs.</li>
        <li><Em>Electric vehicles</Em> — by mid-2026, ~10% of new car sales are EVs and growing. EV
          home charging is largely overnight and behind-the-meter, so the visible demand impact is
          small today but compounds.</li>
        <li><Em>Heating and cooking electrification</Em> — gas-to-electric switching for hot water,
          heating, and stoves. State policies (VIC mandating no new gas connections for new homes
          from 2024) are accelerating this.</li>
      </ul>
      <P>
        The combination — <Em>underlying demand rising, rooftop solar offsetting most of the
        growth</Em> — means operational demand has stayed flat-ish even as the actual use of
        electricity has grown. AEMO's 2024 ESOO and 2026 ISP both flagged this divergence. Forecasting
        is harder when the visible signal (operational demand) and the underlying reality (consumption)
        are pulling apart.
      </P>

      <H2>Minimum demand events</H2>
      <P>
        At the extreme end, behind-the-meter solar can push <Em>operational demand to record lows</Em>.
        The phenomenon is called a minimum demand event, and it has gone from theoretical to routine
        in the last five years:
      </P>
      <Table
        emphasizeFirst
        headers={['Region', 'First minimum demand event', 'Recent record', 'Notes']}
        rows={[
          ['SA', 'Sun 11 Oct 2020 — first negative operational demand in any NEM region', '~−330 MW (~Q4 2024)', 'SA exports to VIC during these events; PEC adds export capacity'],
          ['QLD', 'Late 2022 — operational demand dipped below 4 GW', 'Q1 2025 - dipped to ~3.8 GW', 'Hot mid-day peaks remain high'],
          ['VIC', 'Q4 2023 — operational demand below 3 GW', 'Q1 2026 — sustained below 3.5 GW for several spring weekends', 'High rooftop density'],
          ['NSW', 'Not yet — but trending', 'Lowest operational demand recorded ~6 GW', 'Larger fleet of industrial loads keeps NSW underlying demand higher'],
          ['TAS', 'N/A — different system, low rooftop density', '—', 'Hydro-dominant; rooftop is smaller share'],
        ]}
      />

      <Callout type="warn">
        Minimum demand events stress the grid in ways that maximum demand events don't. With low load
        and high renewable injection, frequency stability becomes harder, system strength weakens, and
        thermal generators face the choice of operating below technical minimums or shutting down. The
        AEMC has been working through frequency response services, system strength services, and
        emergency-load mechanisms to manage them. The grid was not designed for this; it is being
        retrofitted.
      </Callout>

      <H2>Why this matters for the BESS story</H2>
      <P>
        Three implications flow from the behind-the-meter scale that the BESS story will pick up:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Cannibalisation</Em> — every GW of rooftop solar pushes midday wholesale prices closer
          to zero, which makes utility-scale solar economics worse, which creates the BESS opportunity
          (Lesson 3).</li>
        <li><Em>The duck curve</Em> — operational demand has a pronounced midday dip and an evening
          peak. Steeper than California's famous duck curve. The shape favours storage that can charge
          midday and discharge evening.</li>
        <li><Em>Regulatory complexity</Em> — AEMO and the AEMC have had to invent rules for
          behind-the-meter that they didn't expect. Distributed Energy Resources (DER) management,
          dynamic operating envelopes, and flexible export limits are all responses to the BTM scale
          that nobody planned for in 2010.</li>
      </ul>

      <Callout type="source">
        Sources: AEMO <em>Quarterly Energy Dynamics</em> ·
        AEMO <em>2024 Electricity Statement of Opportunities (ESOO)</em> ·
        AEMO <em>Integrated System Plan 2024 + 2026</em> ·
        Australian PV Institute <em>operational vs underlying demand reports</em> ·
        AEMC <em>System security and reliability rule changes</em> ·
        Clean Energy Council <em>Distributed Energy Resources strategy</em>.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 3 — From cannibalisation to opportunity
// ============================================================

function Lesson3() {
  return (
    <div>
      <H2>What rooftop did to wholesale prices</H2>
      <P>
        For most of the 2000s and early 2010s, the NEM's wholesale spot price had a familiar daily
        pattern — a soft trough overnight, a morning ramp, a midday plateau, an evening peak. Rooftop
        solar broke that pattern. As behind-the-meter solar grew, midday <Em>operational demand</Em>
        fell sharply (Lesson 2), which meant fewer thermal generators had to bid into the midday
        window, which meant the merit-order price-setter shifted leftward, which meant the midday
        price collapsed. By 2018-2019 the daily curve had inverted: midday prices were the cheapest of
        the day, evening prices the most expensive.
      </P>

      <Callout type="key">
        Rooftop solar cannibalises utility-scale solar. Both technologies generate at the same time
        (the sun shines on everyone), so the more rooftop there is, the lower the price utility solar
        farms receive. By 2024, utility solar in SA was capturing prices ~35-50% below the regional
        average. The cannibalisation effect is the single biggest economic problem for utility-scale
        solar developers — and it created the conditions in which grid-scale BESS became economic.
      </Callout>

      <H2>Negative price hours</H2>
      <P>
        Once midday operational demand falls below the must-run output of synchronous generators (coal
        and gas units that can't easily turn off), wholesale prices go <Em>negative</Em>. The
        generators are paying retailers to take their energy because shutting down and restarting is
        more expensive. Negative-price hours have grown from a curiosity to a regular feature:
      </P>
      <Table
        emphasizeFirst
        headers={['Year', 'Hours of negative spot in SA', 'Hours in QLD', 'Hours in VIC']}
        rows={[
          ['2019', '~50 hr/yr', '<10 hr/yr', '<10 hr/yr'],
          ['2021', '~150 hr/yr', '~50 hr/yr', '~80 hr/yr'],
          ['2023', '~600 hr/yr', '~250 hr/yr', '~400 hr/yr'],
          ['2025', '~900 hr/yr', '~500 hr/yr', '~700 hr/yr'],
          ['Q1 2026 (annualised)', '~1100 hr/yr', '~700 hr/yr', '~900 hr/yr'],
        ]}
      />

      <H2>What the BESS opportunity actually is</H2>
      <P>
        A battery's economic logic is simple: charge when prices are low, discharge when prices are
        high. The bigger the spread between low and high, the better. Rooftop solar created exactly
        that spread:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Cheap charge window</Em> — midday, when behind-the-meter solar pushes wholesale prices
          to zero (or below).</li>
        <li><Em>Expensive discharge window</Em> — evening peak (5-9 pm), when the sun has gone, demand
          is rising, and only thermal and hydro can supply.</li>
        <li><Em>Daily spread</Em> — typically $80-200/MWh, sometimes $500+/MWh during scarcity events.</li>
      </ul>

      <P>
        Pre-2017, this spread didn't exist on any meaningful scale in Australia. There were occasional
        scarcity events but the daily structure was relatively flat. By 2020-2021, the spread was
        large enough that a 1-hour battery (just enough to cycle once a day) could pay back capex
        within 5-7 years from arbitrage alone — before counting any FCAS or capacity contract revenue.
        That was the moment grid-scale BESS became investable.
      </P>

      <Callout type="info">
        The cannibalisation problem is also addressed in detail in the upcoming{' '}
        <Link to="/learn/solar-cannibalisation" className="text-[var(--color-primary)] hover:underline">
          Solar Cannibalisation in the NEM
        </Link>{' '}module (Phase 2 #4). That module will go deeper on capture-price math, value factors,
        and the technical drivers of price decay. For this BESS module, the key takeaway is simply that
        the cannibalisation problem creates the arbitrage spread, and the arbitrage spread creates the
        BESS opportunity.
      </Callout>

      <H2>The bridge to grid BESS</H2>
      <P>
        By the mid-2010s, rooftop solar had created a market where:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Midday wholesale prices were structurally suppressed</li>
        <li>Evening peaks were getting steeper</li>
        <li>Frequency control needed faster response than thermal could give</li>
        <li>The first FCAS contingency markets were oversupplied by hydro and underused by anything
          fast</li>
      </ul>
      <P>
        Anyone building a battery into that market would find three revenue streams ready and waiting:
        arbitrage, FCAS, and capacity payments under emerging schemes. All it took was a project big
        enough to prove the concept. That project — Hornsdale — is the subject of the next lesson.
      </P>

      <Callout type="source">
        Sources: AEMO <em>Quarterly Energy Dynamics — negative-price hour data</em> ·
        Modo Energy <em>Australia BESS revenue stack reports</em> ·
        Aurora Energy Research <em>Australia capture price modelling</em> ·
        WattClarity <em>negative-price commentary</em> ·
        AEMC <em>FCAS market design papers</em>.
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
      <H2>The 28 September 2016 South Australia blackout</H2>
      <P>
        It started with severe weather. On 28 September 2016, three tornadoes hit transmission towers
        north of Adelaide. Within seconds, multiple 275 kV lines tripped, voltage and frequency excursions
        cascaded across the SA grid, and several wind farms tripped offline en masse via their (then
        relatively new) low-voltage ride-through settings. SA was islanded from the rest of the NEM,
        underfrequency load shedding triggered, and the entire state went black for several hours.
      </P>
      <P>
        The political reaction was severe. Then-PM Malcolm Turnbull blamed renewable energy publicly
        within days; AEMO's review eventually placed the cause on the cumulative effect of multiple
        line failures plus the ride-through configurations on wind farms. SA's response — coordinated
        by Premier Jay Weatherill — was to commission a 100 MW grid-scale battery as part of a broader
        package of grid reliability measures. The battery would provide rapid-response frequency
        control to prevent a similar cascade in future.
      </P>

      <Callout type="info">
        Important context: the 100 MW battery was conceived as a <Em>grid stability asset</Em> first,
        an arbitrage asset second. Its primary value proposition was preventing future blackouts via
        sub-second frequency response. The arbitrage and FCAS revenue that turned out to dominate its
        actual returns was a happy surprise.
      </Callout>

      <H2>The Twitter bet</H2>
      <P>
        In March 2017, Atlassian co-founder Mike Cannon-Brookes had a Twitter exchange with Tesla CEO
        Elon Musk about whether Tesla could deliver a 100 MW battery to SA. Musk responded famously:
        &ldquo;Tesla will get the system installed and working 100 days from contract signature or it
        is free.&rdquo; Cannon-Brookes engaged then-PM Turnbull and Weatherill in the exchange, and the
        promise became politically binding.
      </P>
      <P>
        Tesla won the SA tender in July 2017 in partnership with Neoen, the French renewable developer.
        The site was at Neoen's Hornsdale Wind Farm near Jamestown, ~200 km north of Adelaide. Final
        contract signature was 29 September 2017. Construction commenced immediately. The 100 MW /
        129 MWh battery was energised on <Em>1 December 2017 — 60 days under the deadline</Em>. It was
        the largest grid-scale lithium-ion battery in the world at the time, and the fastest delivery
        of any major energy infrastructure project in Australian history.
      </P>

      <H2>The FCAS surprise</H2>
      <P>
        Hornsdale Power Reserve started commercial operation in December 2017. Within weeks, it had
        captured an outsized share of SA's contingency frequency control market — the FCAS markets that
        pay generators to respond to frequency excursions. The reason: a battery's response is{' '}
        <Em>sub-second</Em> and arbitrarily precise, whereas thermal and hydro plant has multi-second
        delays and physical lag. AEMO's market dispatch optimiser preferred Hornsdale's FCAS bids for
        almost every interval where it was available.
      </P>

      <Callout type="numbers">
        Hornsdale's 2018 financials (per Neoen's annual report): <Em>~$24M of revenue from a $90M
        capex base in its first full year</Em>, of which ~70% came from FCAS contingency markets and
        ~25% from energy arbitrage. Pre-Hornsdale, the SA contingency-raise prices had averaged
        ~$8-12/MW/hr. Post-Hornsdale, prices fell to $1-3/MW/hr — Hornsdale alone had collapsed the
        market price for the service it provided. AEMO published reports showing SA consumers had
        benefited by an estimated $116M in the first 24 months.
      </Callout>

      <H2>The 2019 expansion</H2>
      <P>
        The success of the original 100 MW prompted a 50% expansion. In November 2019, Neoen and Tesla
        commissioned an additional 50 MW / 64.5 MWh, bringing Hornsdale to{' '}
        <Em>150 MW / 193.5 MWh total</Em>. The expansion was funded partly by ARENA, partly by Neoen,
        and partly by SA Government grants — a structure that became the template for several
        subsequent batteries (Victorian Big Battery, Wallgrove, Bouldercombe).
      </P>

      <H2>Why Hornsdale broke the orthodoxy</H2>
      <P>
        Before Hornsdale, the consensus view was that grid-scale batteries were not economic. The
        battery industry had been promising &ldquo;within 5 years&rdquo; for ~15 years running.
        Hornsdale changed three beliefs:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Speed of delivery</Em> — 100 MW in 100 days demonstrated that grid-scale batteries
          could be built faster than any thermal or hydro project. Lower regulatory friction, modular
          equipment, factory-built components.</li>
        <li><Em>Revenue stack reality</Em> — FCAS revenue alone could pay back a battery's capex in
          under 5 years. The arbitrage opportunity was the cherry on top, not the main course.</li>
        <li><Em>Market response speed</Em> — a single asset can transform the price of a market service.
          Hornsdale's effect on SA contingency prices was instantaneous and dramatic.</li>
      </ul>
      <P>
        Within 18 months of Hornsdale's commissioning, six more grid-scale battery projects had been
        announced or commenced in Australia. Within 5 years, Australia had more grid-scale battery
        capacity per capita than any country except possibly South Korea. Hornsdale was the proof
        point that turned the industry on.
      </P>

      <Callout type="source">
        Sources: AEMO <em>Black System South Australia 28 September 2016 final report</em> ·
        Neoen <em>annual reports 2017-2019</em> ·
        Tesla press releases ·
        AEMO <em>Hornsdale Power Reserve Year 1 and Year 2 reports</em> ·
        ARENA <em>Knowledge Sharing Hornsdale series</em> ·
        Aurecon <em>Hornsdale impact study</em> for Neoen.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 5 — How a battery actually earns
// ============================================================

function Lesson5() {
  return (
    <div>
      <H2>The four revenue streams</H2>
      <P>
        A grid-scale battery in the NEM has four distinct revenue streams. The mix between them
        determines bid strategy, asset sizing (MW vs MWh), and operating profile. The four:
      </P>
      <Table
        emphasizeFirst
        headers={['Stream', 'What it pays for', 'Best suited to', 'Typical share of revenue']}
        rows={[
          ['Energy arbitrage', 'Charging at low price, discharging at high price', '2-4 hour batteries with high cycle count', '40-70% in 2024-26'],
          ['FCAS markets', 'Sub-second frequency response (raise/lower 6 sec, 60 sec, 5 min)', '1-hour batteries — fast response, low energy throughput', '15-40% (was 70%+ at Hornsdale Y1)'],
          ['Capacity / contracted offtake', 'CIS, LTESA, or corporate firmness contract — guaranteed revenue', 'All durations; 4+ hour for dispatchable contracts', '0-50% depending on contract'],
          ['System strength / inertia services', 'Network support contracts, mainly via TNSPs and SA AESIPS', 'Specialist sites — geographic placement matters', '0-15% (rare; site-specific)'],
        ]}
      />

      <H2>Arbitrage spread — the headline metric</H2>
      <P>
        The simplest way to read a battery's economics is the <Em>arbitrage spread</Em>: average
        discharge price minus average charge price, measured per MWh delivered. AURES tracks this
        per-battery across the NEM and presents it on the{' '}
        <Link to="/intelligence/bess-records" className="text-[var(--color-primary)] hover:underline">
          BESS Records Leaderboard
        </Link>
        . Typical 2024-26 numbers for Australian batteries:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>$120-180/MWh</Em> spread for SA batteries — best in the NEM, driven by SA's deeper
          midday solar trough and strong evening peak</li>
        <li><Em>$80-130/MWh</Em> spread for QLD and VIC batteries</li>
        <li><Em>$60-100/MWh</Em> spread for NSW batteries — typically lower because NSW's price spread
          is less extreme</li>
        <li><Em>$40-80/MWh</Em> spread for TAS — smallest market, less volatile</li>
      </ul>
      <P>
        Those numbers are <Em>before</Em> round-trip losses. A battery with an 85% RTE delivers about
        85% of the energy it absorbs, which is equivalent to a 15% discount on the spread. Real
        per-MWh-delivered margin is therefore ~85% of the headline spread.
      </P>

      <Callout type="numbers">
        Hornsdale 2018 economics (worked example): 100 MW × 1.29 hours = 129 MWh. Average ~250
        cycles/yr in Y1 (heavy FCAS, light arbitrage cycling) = ~32,000 MWh/year throughput. Energy
        margin ~$90/MWh. Energy revenue ~$2.9M. FCAS revenue ~$17M. Total ~$24M, against ~$90M capex
        + ~$1M/yr OPEX. Pre-tax payback ~4 years. By 2020, FCAS market saturation reduced FCAS
        revenue, but arbitrage revenue grew as cannibalisation deepened and the battery cycled more
        aggressively. Net effect: total revenue stayed in the $20-30M range.
      </Callout>

      <H2>The FCAS evolution</H2>
      <P>
        FCAS — Frequency Control Ancillary Services — is what made Hornsdale economic. The market has
        eight separate FCAS products in the NEM:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Regulation Raise + Lower</Em> — continuous fine-grained frequency adjustment</li>
        <li><Em>Contingency Raise / Lower at 6 seconds</Em> — fastest response to a major event</li>
        <li><Em>Contingency Raise / Lower at 60 seconds</Em> — sustained response</li>
        <li><Em>Contingency Raise / Lower at 5 minutes</Em> — recovery and restoration</li>
      </ul>
      <P>
        Pre-Hornsdale, hydro and gas dominated. Post-Hornsdale, batteries dominated the contingency
        markets within 18 months. Today FCAS prices are close to floor for most intervals because
        battery supply has saturated the markets. <Em>FCAS arbitrage is no longer a profitable
        anchor for new batteries</Em> — the next battery to commission will earn its first dollar from
        energy arbitrage, not from FCAS.
      </P>

      <H2>Cycle counts and degradation</H2>
      <P>
        Batteries degrade with cycling. A typical lithium-ion BESS today has:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Warranty for 350-500 full-equivalent cycles per year</li>
        <li>Designed degradation curve to ~70-80% of original capacity at end of warranty (~10-15 years)</li>
        <li>Replacement and augmentation cycles built into the operations plan</li>
      </ul>
      <P>
        A battery cycling more aggressively than warranty earns more money but degrades faster. A
        battery cycling less still loses some calendar-life capacity even if untouched. The optimal
        cycle rate depends on the spread and the battery's revenue stack. AURES tracks{' '}
        <Em>average cycles per year</Em> per battery in the leaderboard.
      </P>

      <Callout type="key">
        For a developer evaluating a BESS investment, the key economic levers are:<br/>
        (1) <Em>$/MW capex</Em> — currently $700k-$900k/MW for 4-hour, falling 5-8% per year;<br/>
        (2) <Em>arbitrage spread $/MWh</Em> in the connection point's region — varies as above;<br/>
        (3) <Em>cycle rate</Em> — function of spread and contracted profile;<br/>
        (4) <Em>round-trip efficiency</Em> — function of equipment and operating temperature;<br/>
        (5) <Em>contracted revenue floor</Em> — CIS, LTESA, or corporate offtake.<br/>
        Plug those into the AURES BESS Value Analysis on any operating BESS to see actual numbers.
      </Callout>

      <Callout type="source">
        Sources: AEMO <em>Quarterly Energy Dynamics</em> · AEMO <em>FCAS market design papers</em> ·
        Modo Energy <em>Australia BESS revenue reports</em> · Aurora Energy Research <em>BESS
        outlook</em> · Cornwall Insight <em>Battery storage market</em> ·
        AURES{' '}
        <Link to="/intelligence/bess-records" className="text-[var(--color-primary)] hover:underline">
          BESS Records Leaderboard
        </Link>{' '}for live per-battery data.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 6 — Duration evolution and BESS records
// ============================================================

function Lesson6() {
  return (
    <div>
      <H2>The duration arc</H2>
      <P>
        Australian batteries have evolved through clearly recognisable duration tiers, driven by
        successive market opportunities:
      </P>
      <Table
        emphasizeFirst
        headers={['Tier', 'Typical duration', 'Era', 'Driver', 'Anchor projects']}
        rows={[
          ['Tier 1', '0.5 - 1 hour', '2017 - 2020', 'FCAS dominance', 'Hornsdale (1.3h), Dalrymple BESS, Ballarat BESS'],
          ['Tier 2', '1 - 2 hours', '2020 - 2022', 'FCAS + early arbitrage', 'Bulgana BESS, Wallgrove (1h)'],
          ['Tier 3', '2 - 4 hours', '2022 - 2025', 'Arbitrage primary, FCAS supplementary', 'Victorian Big Battery (1.5h, expanding), Riverina ESS (2h), Wandoan (4h)'],
          ['Tier 4', '4 hours', '2024 - present', 'CIS dispatchable rounds set 4-hour minimum', 'Eraring BESS (4h, 2.8 GWh), Waratah Super Battery (4h, ~1.7 GWh), Tarong BESS (4h)'],
          ['Tier 5', '8+ hours', '2026 onward', 'LTESA Round 6 long-duration tier', 'Great Western Battery (~10.6h), Bowmans Creek BESS (~9.6h), Bannaby BESS (~11.5h)'],
        ]}
      />

      <H2>Why each tier emerged</H2>
      <P>
        Each tier corresponds to a specific market opportunity becoming dominant:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Tier 1 (FCAS):</Em> Hornsdale's success made FCAS the obvious anchor. 1-hour batteries
          could earn most of the FCAS revenue at half the capex of 2-hour batteries. The first wave
          of 50-100 MW batteries was almost all 1-hour.</li>
        <li><Em>Tier 2 (FCAS + arbitrage):</Em> as FCAS prices fell from saturation, batteries needed
          a second revenue stream. 1.5-2 hour batteries could meaningfully participate in arbitrage
          while still earning FCAS, so the typical project shifted to that range.</li>
        <li><Em>Tier 3 (arbitrage primary):</Em> arbitrage spreads had grown enough that 2-4 hour
          batteries were better than 1-hour even after the higher capex. Daily cycling against the
          midday-to-evening spread became the primary revenue mode.</li>
        <li><Em>Tier 4 (4-hour CIS dispatchable):</Em> the federal CIS Tender 3 (Sep 2025) introduced
          a 4-hour minimum requirement for dispatchable awards. This created a regulatory driver for
          4-hour minimum, on top of the economic logic. Most awarded T3 projects are at 4 hours
          exactly.</li>
        <li><Em>Tier 5 (8+ hour long-duration):</Em> LTESA Round 6 (Feb 2026) awarded only batteries
          with ≥8 hours duration to meet the NSW LDS target. The economics are different — these
          batteries don't cycle daily; they target multi-day events and seasonal balancing. They are
          essentially a partial replacement for pumped hydro.</li>
      </ul>

      <H2>State leaders — the AURES leaderboard</H2>
      <P>
        AURES tracks every operating BESS in the NEM and ranks them by spread, capacity, throughput
        and other metrics. Live data is at the{' '}
        <Link to="/intelligence/bess-records" className="text-[var(--color-primary)] hover:underline">
          BESS Records Leaderboard
        </Link>{' '}page. Highlights as of May 2026:
      </P>
      <Table
        emphasizeFirst
        headers={['Region', 'Largest', 'Largest by energy', 'Notable mention']}
        rows={[
          ['NSW', 'Eraring Big Battery — 460 MW', 'Eraring 460 MW × 4h = 2.8 GWh', 'Waratah Super Battery (Akaysha) operational; among first major LTESA assets'],
          ['VIC', 'Victorian Big Battery (Hazelwood) — 300 MW', '~1.5 hour at full power', 'Mortlake BESS, Hazelwood — co-located with retired coal sites'],
          ['QLD', 'Wandoan South — 100 MW × 4h = 400 MWh', 'Bouldercombe 50 MW × 1h', 'Tarong BESS coming online 2026 with 300 MW × 4h'],
          ['SA', 'Torrens Island BESS — 250 MW × 1h', 'Hornsdale (still notable) — 150 MW × 1.3h', 'Tailem Bend Stage 2 250 MW × 4h'],
          ['TAS', 'Smaller market — single-digit MW BESS', '—', 'Hydro dominance limits BESS opportunity'],
        ]}
      />

      <H2>The CIS and LTESA driving evolution</H2>
      <P>
        The duration evolution is no longer purely market-driven. Government programs are now setting
        the duration tier:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>CIS Tender 3 (Sep 2025):</Em> 4-hour minimum for dispatchable contracts. 16 awards,
          mostly at 4 hours.</li>
        <li><Em>LTESA Round 6 (Feb 2026):</Em> 8+ hour minimum for LDS. Six awards spanning
          8.7-11.5 hours.</li>
        <li><Em>CIS Tender 6 (May 2026):</Em> 6.9-8 hour batteries for WA dispatchable. Three awards.</li>
      </ul>
      <P>
        The implication for developers: the 4-hour and 8-hour tiers are now &ldquo;standard&rdquo;
        rather than aspirational. Batteries at sub-2-hour are increasingly being relegated to FCAS
        niche roles. The market is rapidly bifurcating between short-duration FCAS specialists and
        long-duration arbitrage / dispatchable assets.
      </P>

      <Callout type="source">
        Sources: AURES{' '}
        <Link to="/intelligence/bess-records" className="text-[var(--color-primary)] hover:underline">
          BESS Records Leaderboard
        </Link>{' '}·
        AEMO Quarterly Energy Dynamics ·
        Modo Energy Australia BESS reports ·
        Energy-Storage News Australia coverage ·
        Aurora Energy Research and Cornwall Insight battery outlooks.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 7 — Outlook
// ============================================================

function Lesson7() {
  return (
    <div>
      <H2>The residential battery boom</H2>
      <P>
        After 15 years of residential solar growth, Australia is now in the early stages of a parallel
        residential <Em>battery</Em> boom. By the end of 2024, ~250,000 home batteries had been
        installed — a number that has compounded at 30-40% per year since 2020. The drivers:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Tesla Powerwall 3 + competitors (sonnen, BYD, Alpha-ESS) at $7,000-12,000 installed for
          a 13-16 kWh battery</li>
        <li>Falling export feed-in tariffs (the 1:1 net FIT in many states is now <em>negative</em>
          during midday — retailers charge the customer to export)</li>
        <li>State rebate schemes — VIC's Solar Homes Battery Loan, NSW's Peak Demand Reduction Scheme</li>
        <li><Em>Federal Cheaper Home Batteries Program (announced 2025, operational 2026):</Em> 30%
          rebate on installed batteries, capped at $4,000 per system, designed to add ~1.3 GW of
          additional behind-the-meter storage by 2030</li>
      </ul>
      <P>
        The residential battery has the same hyper-competitive installer dynamic as residential solar,
        with the same cost advantages. Australia has more home battery installs per capita than any
        country except possibly Germany, and the trajectory is steeper. By 2030, AEMO's Step Change
        scenario assumes ~3-4 GW / 12-15 GWh of residential and small commercial batteries — the
        largest distributed energy resource fleet in the world.
      </P>

      <H2>The AEMO ISP storage targets</H2>
      <P>
        The AEMO Integrated System Plan (Step Change scenario, 2024) projects the following storage
        build-out for the NEM:
      </P>
      <Table
        emphasizeFirst
        headers={['Year', 'Grid BESS (4h)', 'Long-duration (8h+)', 'Pumped hydro', 'Behind-the-meter']}
        rows={[
          ['2026', '~5 GW / 20 GWh', '~1 GW / 12 GWh', '~2.7 GW (Snowy 2.0 commissioning)', '~1.5 GW / 5 GWh'],
          ['2030', '~13 GW / 52 GWh', '~5 GW / 50 GWh', '~5 GW (with Snowy 2.0 fully operating)', '~3.5 GW / 12 GWh'],
          ['2034', '~18 GW / 72 GWh', '~10 GW / 100+ GWh', '~5 GW', '~5 GW / 18 GWh'],
        ]}
      />

      <H2>NSW LDS targets — the legislated number</H2>
      <P>
        NSW has the most specific storage target of any Australian jurisdiction, set in statute under
        the EII Act 2020:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>2 GW of long-duration storage by 2030</Em> — already achieved in award terms after
          LTESA Rounds 5 and 6</li>
        <li><Em>28 GWh of long-duration storage by 2034</Em> — LTESA Round 6 (1,171 MW × 8.7-11.5h
          = ~12 GWh) gets us roughly halfway. The next two LTESA rounds need to award the balance.</li>
      </ul>

      <H2>BESS as the price-setter</H2>
      <P>
        AEMO's Q1 2026 QED reported a milestone: <Em>batteries set the marginal price in 32% of NEM
        dispatch intervals</Em> — making them the most frequent price-setting technology in the
        market for the first time. Five years ago coal set price 70% of the time and batteries set
        price 0% of the time. The transition is structural and probably accelerating.
      </P>

      <Callout type="key">
        The shift to BESS price-setting matters because it changes the revenue prospects of every
        other generator. Coal and gas plants used to set the marginal price during the most profitable
        intervals; now batteries do, and batteries bid at much lower marginal prices because their
        cost of energy comes from off-peak charging. The result is downward pressure on wholesale
        prices, which improves consumer welfare but compresses revenue for thermal generators —
        accelerating the closure of coal generators that don't have a contracted revenue floor.
      </Callout>

      <H2>The compounding loop</H2>
      <P>
        Where this all ends up is a compounding loop with self-reinforcing dynamics:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>More <Em>solar</Em> creates deeper midday troughs, raising the value of storage.</li>
        <li>More <Em>storage</Em> raises the cost-effective ceiling for solar deployment.</li>
        <li>Together they push <Em>thermal</Em> generators out faster.</li>
        <li>Faster thermal exit means more pressure for storage build-out to provide reliability.</li>
        <li>That feeds back into more solar opportunity.</li>
      </ul>
      <P>
        The headline read for 2030: Australia is forecast to have 60+ GW of utility-scale solar (up
        from ~12 GW today), 40+ GW of rooftop solar (up from ~26 GW), 20+ GW of grid-scale BESS, and
        5+ GW of pumped hydro. Coal will be largely gone or in scheduled retirement. Gas will exist
        primarily as a peaking resource for residual reliability.
      </P>

      <Callout type="info">
        For investors and developers: the structural call is that the solar + storage combination is
        the new baseload of the Australian grid. The cost trajectory is set; the regulatory
        infrastructure (CIS, LTESA, REZs, TNSP build-out) is in place; the market signal (BESS
        price-setting 32% of intervals) is established. The questions left are timing, location, and
        contracting strategy — not whether the build-out happens.
      </Callout>

      <Callout type="source">
        Sources: AEMO <em>Integrated System Plan 2024 + 2026</em> ·
        AEMO <em>Quarterly Energy Dynamics Q1 2026</em> ·
        DCCEEW <em>Cheaper Home Batteries Program</em> ·
        SunWiz <em>Battery installations Australia</em> ·
        Modo Energy <em>Australia battery market reports</em> ·
        AEMO Services <em>LTESA Round 6 outcome</em> ·
        AURES{' '}
        <Link to="/intelligence/bess-records" className="text-[var(--color-primary)] hover:underline">
          BESS Records Leaderboard
        </Link>{' '}and{' '}
        <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
          Scheme Tracker
        </Link>.
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
          <span className="text-3xl" aria-hidden>🔋</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            ✅ Available
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight"
          style={{ borderLeft: '4px solid #22c55e', paddingLeft: 12, marginLeft: -12 }}>
          The Solar + BESS Story in the NEM
        </h1>
        <p className="text-base italic text-[var(--color-text-muted)]">
          From rooftop boom to grid-scale batteries — how Australia got here.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          Australia has more rooftop solar per capita than any country on earth. That fact created the
          cannibalisation problem, which created the BESS opportunity, which created the modern NEM.
          This module tells the full arc — the residential solar boom (FITs, STCs, the Australian
          electrician cost advantage, Chinese module economics), commercial scale-up, behind-the-meter
          scale, and how all of that led to Hornsdale, Tesla, FCAS, and today&rsquo;s 32% price-setting
          share for batteries.
        </p>
      </div>

      <div className="space-y-3">
        {LESSONS.map(l => {
          const done = progress.has(l.id)
          return (
            <Link key={l.id} to={`/learn/bess-story/${l.id}`}
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
            <Link to="/intelligence/bess-records" className="text-[var(--color-primary)] hover:underline">
              BESS Records Leaderboard →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— every operating BESS, ranked</span>
          </li>
          <li>
            <Link to="/intelligence/scheme-tracker" className="text-[var(--color-primary)] hover:underline">
              Scheme Tracker →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— CIS/LTESA awards by tech and round</span>
          </li>
          <li>
            <Link to="/learn/cis-ltesa-bidding" className="text-[var(--color-primary)] hover:underline">
              CIS &amp; LTESA Bidding module →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— deep-dive on the underwriting that drives the storage build-out</span>
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
        <Link to="/learn/bess-story" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← The Solar + BESS Story
        </Link>
        <span className="text-[var(--color-text-muted)]">Lesson {lesson.number} of {LESSONS.length} · {lesson.readingTime}</span>
      </div>

      <div className="space-y-1 pb-4 border-b border-[var(--color-border)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Lesson {lesson.number}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight">{lesson.title}</h1>
        <p className="text-base italic text-[var(--color-text-muted)]">{lesson.subtitle}</p>
      </div>

      <article className="text-[15px] text-[var(--color-text-muted)]">
        {lesson.id === 'rooftop-boom'     && <Lesson1 />}
        {lesson.id === 'btm-scale'        && <Lesson2 />}
        {lesson.id === 'cannibalisation'  && <Lesson3 />}
        {lesson.id === 'hornsdale'        && <Lesson4 />}
        {lesson.id === 'how-earns'        && <Lesson5 />}
        {lesson.id === 'duration-records' && <Lesson6 />}
        {lesson.id === 'outlook'          && <Lesson7 />}
      </article>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <button onClick={() => navigate(`/learn/bess-story/${prev.id}`)}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors">
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => { onComplete(lesson.id); navigate(`/learn/bess-story/${next.id}`) }}
            className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors">
            {progress.has(lesson.id) ? 'Continue' : 'Mark read & continue'} → {next.title}
          </button>
        ) : (
          <button onClick={() => { onComplete(lesson.id); navigate('/learn/bess-story') }}
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

export default function BESSStoryModule() {
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
        <Link to="/learn/bess-story" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Back to module index
        </Link>
      </div>
    )
  }

  return <LessonView lesson={lesson} progress={progress} onComplete={onComplete} />
}
