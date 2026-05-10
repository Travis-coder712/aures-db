/**
 * The Energy Transition in the NEM — AURES Learning Module
 *
 * 11 lessons spanning the privatisation era through the rise of the gentailer
 * and the current decarbonisation arc. Includes deep-dives on AGL, Origin,
 * EnergyAustralia and Alinta as the four organisations that dominate the
 * generation+retail picture.
 */
import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-energy-transition-progress'

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
  { id: 'pre-nem',          number: 1,  title: 'Pre-NEM Australia — state monopolies and COAG reform',     subtitle: 'How electricity was structured before 1998 and why it changed',     readingTime: '11 min' },
  { id: 'vic-selloff',      number: 2,  title: 'The Victorian sell-off (1992-96)',                          subtitle: 'Kennett, the SECV breakup, and who bought Loy Yang, Hazelwood, Yallourn', readingTime: '12 min' },
  { id: 'nsw-sa-priv',      number: 3,  title: 'NSW and SA — partial privatisation and the gentrader era', subtitle: 'Carr, Iemma, Keneally, O\'Farrell, and the SA long-lease',           readingTime: '12 min' },
  { id: 'qld-wa',           number: 4,  title: 'Queensland GOCs and Western Australia — the alternatives',  subtitle: 'Why QLD kept state ownership and why WA disaggregated then re-merged', readingTime: '12 min' },
  { id: 'gentailer',        number: 5,  title: 'What is a gentailer (and why it works)',                    subtitle: 'Vertical integration, hedging, churn and the structural advantage', readingTime: '10 min' },
  { id: 'agl-history',      number: 6,  title: 'AGL — the 187-year arc (1837 → 2026)',                      subtitle: 'Sydney streetlights, Loy Yang, Macquarie Generation, the demerger that wasn\'t', readingTime: '15 min' },
  { id: 'agl-today',        number: 7,  title: 'AGL today and 2030 — geographic mismatch and rebalance',    subtitle: 'State-by-state customers vs generation, pipeline, revenue shift', readingTime: '11 min' },
  { id: 'origin',           number: 8,  title: 'Origin Energy — Boral, APLNG, Eraring, and the Brookfield bid', subtitle: 'How a building-materials spin-off became a NEM giant',           readingTime: '12 min' },
  { id: 'energy-australia', number: 9,  title: 'EnergyAustralia — Sydney County Council to Hong Kong-owned', subtitle: 'TRUenergy, CLP, Yallourn closure and Tallawarra B',                  readingTime: '11 min' },
  { id: 'alinta',           number: 10, title: 'Alinta Energy — SECWA roots to Chow Tai Fook',              subtitle: 'Babcock & Brown, TPG, Loy Yang B and the WA stronghold',            readingTime: '10 min' },
  { id: 'coal-exit',        number: 11, title: 'Coal exit and the 2030-35 NEM landing',                     subtitle: 'Who closes when, federal/state interventions, what fills the gap', readingTime: '13 min' },
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
// Lesson 1 — Pre-NEM Australia (state monopolies and COAG reform)
// ============================================================

function Lesson1() {
  return (
    <div>
      <H2>The state monopoly era — six fortresses</H2>
      <P>
        For most of the 20th century, Australia's electricity system was not one industry but six —
        one per state, each a vertically-integrated public monopoly. Each state owned everything: the
        coal mines that fuelled the generators, the generators themselves, the transmission lines that
        connected them, the distribution networks that ran down the suburban street, and (in most
        states) the retail relationship with the customer.
      </P>
      <Table
        emphasizeFirst
        headers={['State', 'Vertically-integrated utility', 'Primary fuel base']}
        rows={[
          ['NSW', 'Electricity Commission of NSW (Elcom) → Pacific Power', 'Black coal — Hunter Valley, Lithgow'],
          ['VIC', 'State Electricity Commission of Victoria (SECV)', 'Brown coal — Latrobe Valley'],
          ['QLD', 'Queensland Electricity Commission (QEC)', 'Black coal — Bowen Basin, Callide / Tarong fields'],
          ['SA', 'Electricity Trust of South Australia (ETSA)', 'Brown coal (Leigh Creek) + gas'],
          ['WA', 'State Electricity Commission of WA (SECWA)', 'Black coal — Collie + Pilbara gas'],
          ['TAS', 'Hydro-Electric Commission (HEC)', 'Hydropower — Central Plateau dams'],
        ]}
      />
      <P>
        These were not just utilities. They were instruments of state economic policy. NSW's Elcom
        bankrolled the development of the Hunter Valley coal industry. Victoria's SECV literally
        invented the brown-coal mining town (Yallourn, Morwell, Traralgon). Queensland's QEC built
        regional Queensland through rural electrification. The idea of selling them was, for decades,
        politically unthinkable.
      </P>

      <H2>Why vertical integration was the default</H2>
      <P>
        Three arguments held the system together for fifty years:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Capital intensity.</Em> A 660 MW coal unit cost the 1970s equivalent of $2-3B and had
          a 50-year planning horizon. No private investor would commit that without a guaranteed
          return — which only a government with rate-setting power could deliver.</li>
        <li><Em>Natural monopoly.</Em> A second set of transmission lines competing with the first
          made no economic sense. If the wires were a monopoly, the argument went, so should the rest
          be.</li>
        <li><Em>Public-good framing.</Em> Universal access at uniform pricing was treated as a social
          contract. Cross-subsidising remote rural consumers from urban consumers was easier inside a
          single integrated utility than across competitive markets.</li>
      </ul>

      <H2>Why it broke</H2>
      <P>
        By the late 1980s the model was failing on three measures at once. <Em>Costs</Em> were
        ballooning — overbuild in the 1970s under "build for the next thirty years" assumptions left
        states with massive surplus capacity and capital tied up in plants the demand didn't justify.
        <Em>Productivity</Em> was poor — public utilities had workforces 2-3× the headcount of
        comparable private utilities in the US or UK. <Em>Cross-state inefficiency</Em> was
        invisible — Victoria's brown coal was being burned to meet evening peaks while South
        Australia's gas plants sat idle, or NSW exported in the dead of night while Queensland imported,
        because there was no integrated market to dispatch the most efficient plant.
      </P>

      <H2>The Hilmer Review and the COAG reform of 1991</H2>
      <P>
        The 1991 Council of Australian Governments (COAG) reform package — guided by the
        <em> Independent Committee of Inquiry into National Competition Policy</em> chaired by
        Professor Frederick Hilmer — laid out a framework that would reshape every infrastructure
        sector in Australia, but it landed hardest on electricity. The five core principles:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Structural separation</Em> — vertically integrated utilities must be split into
          generation, transmission, distribution and retail businesses</li>
        <li><Em>Open access</Em> — transmission and distribution networks must allow any generator or
          retailer to use them, at regulated prices</li>
        <li><Em>Competitive neutrality</Em> — state-owned businesses competing with private firms
          must do so on equivalent terms (tax, regulation, cost of capital)</li>
        <li><Em>Independent economic regulation</Em> — prices for the monopoly network components
          would be set by a regulator at arm's length from political pressure</li>
        <li><Em>Cross-border competition</Em> — generators in one state should be able to sell to
          retailers and large consumers in another, via a national wholesale market</li>
      </ul>

      <H2>The NEM begins — 13 December 1998</H2>
      <P>
        The National Electricity Market started trading on 13 December 1998 with three founding
        regions: NSW, Victoria, and the ACT. Queensland joined when the QNI interconnector to NSW was
        commissioned in 2001; South Australia joined when the Heywood interconnector to Victoria came
        online (also 2001). Tasmania joined when the Basslink cable to Victoria entered service in
        2005. Western Australia and the Northern Territory remain separate to this day — WA runs the
        South West Interconnected System (SWIS) and the North West Interconnected System (NWIS), the
        NT runs three small isolated systems.
      </P>
      <P>
        The NEM is fundamentally a <Em>gross pool</Em>: every megawatt-hour generated in the NEM
        regions is offered to AEMO (the Australian Energy Market Operator), which then dispatches
        plant in 5-minute intervals to meet demand at lowest cost, subject to security constraints.
        The settlement price for each 5-minute interval is the regional reference price, paid to all
        dispatched generators in that region. Retailers buy from the pool at that same price.
      </P>

      <Callout type="key">
        The structural separation mandated by COAG meant generators could no longer rely on a captive
        retail customer base to recover their costs. They had to compete in the spot market every
        five minutes. This is the foundational fact of the modern Australian energy market —
        everything that follows (the rise of the gentailer, capture-price decay, BESS economics,
        the CIS) is downstream of this reform.
      </Callout>

      <H2>Three paths from one starting point</H2>
      <P>
        COAG didn't tell each state <em>how</em> to disaggregate or whether to privatise. That was
        left to state governments. Three distinct paths emerged: Victoria's complete and rapid
        privatisation (1992-99), NSW and SA's contested partial privatisation (1996-2014), and
        Queensland's retention of state ownership (the GOC model). Western Australia carved a fourth
        path, disaggregating and then re-aggregating its sector inside fifteen years. The next four
        lessons cover each path.
      </P>

      <Callout type="source">
        Sources: Hilmer Report 1993 · COAG energy reform agreement July 1991 ·
        AEMC <em>History of the NEM</em> · Productivity Commission <em>Energy Market Reforms 1998</em> ·
        IEA <em>Australia Electricity Sector Review</em>.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 2 — The Victorian sell-off (1992-96)
// ============================================================

function Lesson2() {
  return (
    <div>
      <H2>Kennett and the great Victorian sell-off</H2>
      <P>
        Jeff Kennett's Liberal-National Coalition won the 1992 Victorian election on a debt-reduction
        platform. Victoria was carrying ~$32B in state debt — much of it loaded onto the State
        Electricity Commission's overbuilt 1980s generation fleet. The SECV was, depending on the
        accounting, between $20B and $25B of that debt. Selling it would simultaneously retire debt
        and remove the political problem of a money-losing monopoly.
      </P>
      <P>
        Within four years (1995-99), Kennett's government broke up the SECV into 14 separate
        businesses and sold every one of them. No other state attempted privatisation at this scale
        or speed. Victoria became — and remains — the most privatised electricity market in the world.
      </P>

      <H2>The generation breakup</H2>
      <P>
        The SECV's generation portfolio was disaggregated into five companies, each centred on one
        major brown-coal complex:
      </P>
      <Table
        emphasizeFirst
        headers={['Plant', 'Capacity', 'Sale year', 'Sale price', 'Buyer']}
        rows={[
          ['Yallourn Energy', '1,480 MW', '1996', '~$2.1B', 'Powergen UK (later sold on)'],
          ['Hazelwood', '1,600 MW', '1996', '~$2.4B', 'International Power UK consortium'],
          ['Loy Yang B', '1,000 MW', '1992 (partial) / 1997 (full)', '~$1.0B', 'Mission Energy + Tokyo Electric consortium'],
          ['Loy Yang A', '2,000 MW', '1997', '~$4.74B', 'Horizon Energy Investment Group'],
          ['Energy Brix', '150 MW', '1996', '~$50M', 'HRL Limited'],
          ['Southern Hydro', '479 MW', '1997', '~$391M', 'Infratil / Meridian'],
        ]}
      />
      <P>
        Loy Yang A's sale price — $4.74B — was the largest single asset sale in Australian history at
        the time. The buyer, Horizon Energy Investment Group, was a consortium of US power developers
        (CMS Energy, NRG Energy, Mission Energy) and Australian financial buyers. Loy Yang A would
        change hands three more times over the next decade as the original 1997 capital structure
        proved too aggressive for the prices that materialised in the early NEM.
      </P>

      <H2>The distribution breakup</H2>
      <P>
        Victoria's electricity distribution networks — the poles and wires that run down each
        suburban street — were split into five geographical zones. Each was sold as a long-term
        regulated monopoly to private buyers:
      </P>
      <Table
        emphasizeFirst
        headers={['Network', 'Territory', 'Buyer (1995-96)', 'Current owner']}
        rows={[
          ['CitiPower', 'Inner Melbourne', 'Entergy (US)', 'Spark Infrastructure / Power Assets HK'],
          ['Powercor', 'Western Victoria', 'PacifiCorp (US)', 'Spark Infrastructure / Power Assets HK'],
          ['Eastern Energy', 'Eastern Melbourne', 'TXU (US)', 'Ausnet Services (later sold to Singapore Power)'],
          ['Solaris Power', 'Northern Melbourne', 'GPU (US)', 'Jemena (now SGSP / Singapore-China)'],
          ['United Energy', 'Southern Melbourne', 'UtiliCorp (US) + AMP', 'CKI / Spark Infrastructure'],
        ]}
      />
      <P>
        Notice the buyers: <Em>every single Victorian distribution network was sold to a foreign
        buyer in 1995-96</Em>, mostly US utilities. By 2026, none of the original US buyers remain —
        ownership has churned through US, UK, Singaporean, Chinese and Hong Kong investors. This is
        partly because regulated network returns proved less attractive than the original buyers
        modelled, partly because Asian utility capital was searching for yield through the 2000s.
      </P>

      <H2>The retail breakup</H2>
      <P>
        The SECV's retail business was split into five customer franchises — initially aligned with
        the distribution zones, then progressively opened to competition. The original retail
        ownership map at full contestability in 2002:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Eastern Energy retail</Em> → TXU Australia → TRUenergy (CLP, 2005) → <Em>EnergyAustralia</Em></li>
        <li><Em>CitiPower retail</Em> → Origin Energy (acquired 2002)</li>
        <li><Em>Solaris / Powercor retail</Em> → AGL Energy</li>
        <li><Em>Pulse Energy</Em> (newcomer) → AGL (acquired 2008)</li>
      </ul>
      <P>
        By 2005, the three retail brands that remained — AGL, Origin and TRUenergy — had each
        acquired generation assets in Victoria, NSW or SA. The vertical integration that COAG had
        deliberately broken apart in 1998 was being reassembled by 2005, but now in private hands.
        This is the moment the <Em>gentailer</Em> structure begins (covered in Lesson 5).
      </P>

      <H2>The fate of the original buyers</H2>
      <P>
        The most consequential post-1997 sale was Loy Yang A. The Horizon consortium proved over-
        levered relative to actual NEM revenues, and after the 2001 Enron collapse Mission Energy
        (one of the consortium partners) was forced into receivership. Horizon followed in 2003.
        Loy Yang A was repackaged and sold to <Em>Great Energy Alliance Corporation (GEAC)</Em> in
        2004 — a consortium of AGL Energy (32.5%), Tokyo Electric Power Co (TEPCO, 32.5%), Tokyo Gas,
        Marubeni and Macquarie Bank. This consortium would in turn unwind a decade later, leaving
        AGL the sole owner — the subject of Lesson 6.
      </P>

      <H2>The legacy</H2>
      <P>
        Victoria emerged from the Kennett sell-off with the cheapest electricity prices in Australia
        for about a decade (1998-2008) — the result of selling brown-coal generators at fire-sale
        prices to debt-funded buyers who then competed each other into thin margins. By 2010 those
        same generators were under-investing in maintenance, and by 2017 Hazelwood closed abruptly
        with two months' notice when French parent Engie ran out of capital to recover its
        boiler-pressure issues. Brown coal had been mispriced from day one; the sell-off accelerated
        the under-investment cycle that ended with Hazelwood's exit and made VIC the most coal-
        dependent state at exactly the moment coal began to retreat.
      </P>

      <Callout type="key">
        Victoria's privatisation produced two enduring features of the NEM: (1) the brown-coal
        generators of the Latrobe Valley are <Em>privately owned, foreign-controlled, and operating
        on assets older than 1985</Em> — a recipe for forced unscheduled outages, which is exactly
        what unfolded 2017-2024; and (2) the retail brands that survived the consolidation — AGL,
        Origin, EnergyAustralia — gained the customer relationships that would let them re-integrate
        into private gentailers over the next decade.
      </Callout>

      <Callout type="source">
        Sources: Kennett Government final budget papers 1999 · Productivity Commission
        <em> Victorian Electricity Industry Inquiry 1996</em> · Department of Treasury & Finance VIC
        <em> Electricity Privatisation Outcomes</em> · ACCC <em>Reports on State Privatisations</em> ·
        Wikipedia / company histories cross-checked.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 3 — NSW and SA privatisation
// ============================================================

function Lesson3() {
  return (
    <div>
      <H2>The NSW privatisation that took 20 years</H2>
      <P>
        Where Victoria's privatisation was decisive, NSW's was a 20-year political war fought
        inside the Labor Party as much as between the parties. Three separate Labor premiers attempted
        electricity privatisation, three were defeated by their own caucus or party conference, and a
        Liberal premier eventually completed the job in 2014.
      </P>

      <H2>The Carr attempt (1997)</H2>
      <P>
        Bob Carr's Labor government had been elected 1995 with a centre-left mandate. By 1997, with
        NSW state debt rising and energy reform underway nationally, Carr proposed selling Pacific
        Power's generation assets and the NSW distribution networks. The May 1997 ALP State
        Conference rejected the proposal by a 3:1 margin. Carr withdrew the plan and did not raise
        electricity privatisation again during his premiership.
      </P>

      <H2>The Iemma attempt (2008)</H2>
      <P>
        Morris Iemma, who succeeded Carr, made a second attempt in 2007-2008. The proposal was more
        modest: lease the generators (rather than sell outright) and sell the retailers. The May 2008
        ALP State Conference rejected it 702 votes to 107. The defeat triggered Iemma's resignation
        in September 2008. NSW's electricity sector remained state-owned for two more years.
      </P>

      <H2>The Keneally "Gentrader" compromise (2010)</H2>
      <P>
        Kristina Keneally, succeeding Iemma, found a structure that bypassed the ALP conference's
        outright opposition to selling the plants. Under the <Em>Gentrader</Em> model, the NSW
        government retained ownership of the physical power stations but sold the long-term rights
        to trade their output. The 2010 transactions:
      </P>
      <Table
        emphasizeFirst
        headers={['Gentrader contract', 'Plants covered', 'Buyer', 'Price', 'Term']}
        rows={[
          ['Macquarie Generation', 'Bayswater 2,640 MW + Liddell 2,000 MW', 'AGL Energy', '$1.5B (later)', 'Indefinite output rights'],
          ['Delta Electricity (Western)', 'Mt Piper 1,400 MW + Wallerawang 1,000 MW', 'TRUenergy (CLP)', '$2.04B', '36-year offtake'],
          ['Delta Electricity (Coastal)', 'Vales Point 1,320 MW + Munmorah 600 MW', 'Origin Energy (later)', 'Retained for sale', '—'],
          ['NSW retail (EnergyAustralia)', 'Sydney + Hunter retail customers', 'TRUenergy (CLP)', '$2.04B (combined)', 'Asset sale'],
          ['NSW retail (Country Energy)', 'Regional NSW retail customers', 'Origin Energy', '$1.07B', 'Asset sale'],
          ['NSW retail (Integral Energy)', 'Western Sydney retail customers', 'Origin Energy', '(part of $1.07B)', 'Asset sale'],
        ]}
      />
      <P>
        The Gentrader deal was simultaneously the largest single electricity transaction in
        Australian history (~$5.3B across all parts) and a political disaster. Treasurer Eric
        Roozendaal pushed the deal through Cabinet without the ALP conference's prior approval. The
        deal was signed at midnight on 14 December 2010 — at which point eight Labor MLCs resigned
        from the board of Eraring Energy in protest. The Labor government lost the next election in
        March 2011 in a landslide.
      </P>

      <H2>The O'Farrell completion (2013-2014)</H2>
      <P>
        Barry O'Farrell's Liberal government, elected 2011, completed what Carr, Iemma and Keneally
        couldn't. The 2013-14 transactions sold the underlying power stations to their existing
        gentraders:
      </P>
      <Table
        emphasizeFirst
        headers={['Asset', 'Year', 'Buyer', 'Price', 'Note']}
        rows={[
          ['Eraring Power Station 2,880 MW', '2013', 'Origin Energy', '~$50M', 'Already had gentrader rights via Eraring Energy; NSW Govt wanted to exit ownership'],
          ['Vales Point Power Station 1,320 MW', '2015', 'Sunset Power / Delta Electricity (private)', '~$1M (yes, $1 million)', 'Private buyers Trevor St Baker + Brian Flannery; subsequent transactions'],
          ['Macquarie Generation (Bayswater + Liddell)', '2014', 'AGL Energy', '$1.505B', 'Made AGL the largest single generator in the NEM'],
          ['Mt Piper + Wallerawang', '2014', 'EnergyAustralia (CLP)', '$160M', 'Wallerawang demolished 2015; Mt Piper retained'],
        ]}
      />
      <P>
        Two prices stand out for sheer cheapness: Eraring at $50M (for 2,880 MW of plant on a fully
        consented site) and Vales Point at $1M. Both reflect how poorly NSW black coal was viewed in
        2013 — the Carbon Pricing Mechanism had just been repealed, but the writing was already on
        the wall. Both buyers ended up with assets worth far more in subsequent years as wholesale
        prices recovered.
      </P>

      <H2>The South Australian long-lease (1999)</H2>
      <P>
        John Olsen's Liberal government in SA went a different route. Rather than sell the assets
        outright, the government granted <Em>long-term leases</Em> (mostly 100 years) — politically
        more palatable, economically near-equivalent. The 1999 transactions raised $5.4B for the
        state and transferred control of essentially the entire SA electricity system:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>ETSA Utilities</Em> (distribution) → 200-year lease to Cheung Kong Infrastructure
          (CKI, Hong Kong). Now operates as <Em>SA Power Networks</Em>.</li>
        <li><Em>ETSA Power</Em> (Pelican Point + Torrens Island gas generators) → 100-year lease to
          NRG Energy (US). NRG later sold to International Power (UK), then GDF Suez, then Engie.</li>
        <li><Em>Optima Energy</Em> (Northern + Playford brown coal) → 100-year lease to NRG.
          Both plants closed 2016 — Northern was SA's last operating coal generator.</li>
        <li><Em>SA retail (origin point)</Em> → AGL acquired the customer base through subsequent
          consolidation.</li>
      </ul>
      <P>
        SA emerged from privatisation with the highest retail electricity prices in the NEM —
        a position it has held almost continuously since 2000. Three structural reasons: (1) SA
        relied disproportionately on expensive gas peaking generation, (2) the state imported
        roughly a third of its electricity from VIC via the Heywood interconnector and paid a premium
        for it, and (3) the privatised gas plants had concentrated ownership and consequent market
        power.
      </P>

      <Callout type="warn">
        SA's high electricity prices were a major political headache through the 2000s and 2010s and
        directly motivated Jay Weatherill's Labor government to chase renewable energy aggressively
        — Hornsdale Power Reserve (the original Tesla Big Battery), the world's largest wind farm
        portfolio per-capita, and the 2017 systemwide blackout that pushed the state into accelerated
        grid-scale storage investment. The privatisation legacy in SA is therefore directly upstream
        of both Australia's first big battery and the broader battery-storage industry.
      </Callout>

      <H2>What NSW and SA had in common</H2>
      <P>
        Both privatisations transferred assets cheap to buyers who were betting on long-term wholesale
        price appreciation. Both produced ownership chains that ended in foreign hands or in
        gentailer hands (AGL, Origin, EnergyAustralia). And both consolidated retail and generation
        ownership in ways that COAG had deliberately tried to prevent — Origin owned Eraring AND
        retail customers in NSW; AGL owned Macquarie Gen AND retail customers; EnergyAustralia owned
        Mt Piper AND retail customers. The competitive separation that justified privatisation in the
        first place lasted barely fifteen years.
      </P>

      <Callout type="source">
        Sources: NSW Treasury <em>Electricity Privatisation Final Report 2014</em> · Government of SA
        <em> ETSA Lease Transactions 1999</em> · ABC News archives · AFR
        <em> Gentrader Files</em> · Origin Energy and AGL annual reports · Wikipedia /
        Australian Parliamentary Library cross-checked.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 4 — Queensland GOCs and Western Australia
// ============================================================

function Lesson4() {
  return (
    <div>
      <H2>Queensland — the GOC model that stuck</H2>
      <P>
        Of the original six state-owned electricity systems, Queensland is the only one where
        <em> generation remains entirely in state hands in 2026</em>. The story of how that happened
        is a study in Queensland Labor's resistance to privatisation, the political defeat of the one
        attempt to change course, and the institutional pattern that emerged: <Em>Government Owned
        Corporations (GOCs)</Em> running the generation, transmission, distribution and retail
        functions in parallel with private-sector competition where it could be tolerated.
      </P>

      <H2>The Beattie / Bligh era (1998-2012)</H2>
      <P>
        Peter Beattie's Labor government, elected 1998, made an early decision: no electricity
        privatisation. Beattie saw what Carr was attempting in NSW and the political cost being paid
        in Victoria, and judged that Queensland's regional Labor base (Ipswich, Bundaberg, Rockhampton,
        Mackay) would not tolerate it. Generation stayed government-owned, restructured into two
        competing GOCs (CS Energy and Stanwell) plus a third (Tarong) that was later merged.
      </P>
      <P>
        Anna Bligh's Labor government did sell some assets — Queensland Rail freight (2010) and
        Queensland Motorways (2010) — but kept electricity off the privatisation list. The 2010 ALP
        State Conference explicitly resolved against electricity privatisation, mirroring NSW's
        position but with effective enforcement.
      </P>

      <H2>The Newman attempt and the 2015 election (2014-2015)</H2>
      <P>
        Campbell Newman's LNP government, elected in a 2012 landslide (78 of 89 seats), took the
        electricity privatisation idea to the 2015 election as the centrepiece of its second-term
        agenda — proposing 99-year leases of the generators, transmission (Powerlink) and the urban
        distribution networks for an expected $37B. The 31 January 2015 election was a political
        earthquake: the LNP lost 36 seats, Newman lost his own seat, and the ALP under Annastacia
        Palaszczuk formed minority government with 44 seats. Electricity privatisation was the
        dominant single issue and the dominant political postmortem.
      </P>
      <P>
        Palaszczuk's three successive election wins (2015, 2017, 2020) cemented the GOC model. The
        2022 <Em>Queensland Energy and Jobs Plan</Em> went further — it committed the state to
        retaining majority public ownership of generation through the renewable transition, with
        $62B of state-led investment in renewables, storage and transmission.
      </P>

      <H2>The current Queensland GOC structure</H2>
      <Table
        emphasizeFirst
        headers={['GOC', 'Role', 'Major assets']}
        rows={[
          ['Stanwell Corporation', 'Coal + gas generation, soon-to-be renewables', 'Stanwell PS 1,460 MW, Tarong PS 1,400 MW, Tarong North 443 MW, Meandu coal mine, Wivenhoe wholesale role'],
          ['CS Energy', 'Coal + gas generation, soon-to-be renewables', 'Callide B 700 MW, Callide C 810 MW (post-Unit C4 explosion 2021), Kogan Creek 750 MW, Gladstone Power Station role'],
          ['CleanCo Queensland', 'Clean energy (created 2019)', 'Wivenhoe pumped hydro 570 MW, Kareeya hydro 88 MW, Borumba pumped hydro 2 GW (under development), MacIntyre wind farm 1,026 MW (operating)'],
          ['Energy Queensland', 'Distribution + retail', 'Energex (SE QLD distribution), Ergon Energy (regional distribution + retail), Yurika (retail brand for commercial customers)'],
          ['Powerlink Queensland', 'Transmission', 'All Queensland high-voltage transmission, plus QNI interconnector to NSW'],
        ]}
      />

      <H2>Why the GOC model has worked for Queensland</H2>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Scale and diversification.</Em> Queensland's generation fleet is geographically and
          technically diverse (coal at Stanwell, Tarong, Callide, Kogan; gas at Swanbank, Yarwun;
          hydro at Wivenhoe, Kareeya). State ownership lets the portfolio cross-subsidise — the
          coal generators fund the renewables build, the hydro hedges the coal exit risk.</li>
        <li><Em>Retail competition is allowed.</Em> AGL, Origin, EnergyAustralia all operate in
          Queensland's retail market alongside Yurika and Ergon Retail. The GOC model isn't a
          monopoly — it's a state-owned set of competitive businesses.</li>
        <li><Em>Capital is cheaper.</Em> Queensland Treasury's borrowing rates are 100-200 bps below
          what private generators can secure. This matters enormously for capital-intensive
          renewables and storage build-out.</li>
        <li><Em>Political durability.</Em> The 2015 election made electricity privatisation a
          near-impossible issue for any major Queensland political party. Both Labor and LNP have
          since committed to majority public ownership of the renewable transition assets.</li>
      </ul>

      <Callout type="key">
        Queensland's GOC structure has become the unintended template for what other states are now
        trying to recreate via EnergyCo (NSW), VicGrid (VIC) and the federal CIS. The realisation
        that <Em>large-scale renewable build-out works best with government balance-sheet support
        and coordination</Em> has effectively re-introduced state-led energy investment in every
        NEM jurisdiction by 2026.
      </Callout>

      <H2>Western Australia — disaggregation and re-merge</H2>
      <P>
        Western Australia is structurally separate from the NEM (it runs the SWIS and NWIS as
        independent systems), but its reform journey is instructive. The Court Liberal government
        broke up SECWA in 1995 into separate entities — but unlike Victoria, it did not privatise
        them outright. The Carpenter Labor government completed the disaggregation in 2006:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Verve Energy</Em> — generation</li>
        <li><Em>Synergy</Em> — retail</li>
        <li><Em>Western Power</Em> — transmission and distribution (urban SWIS)</li>
        <li><Em>Horizon Power</Em> — regional WA (transmission, distribution, retail combined for
          regional towns)</li>
      </ul>
      <P>
        WA's gas-retail business was privatised separately and became <Em>Alinta Gas</Em> in 2000 —
        the foundation of what would become Alinta Energy (Lesson 10).
      </P>

      <H2>WA's 2014 re-merger</H2>
      <P>
        The Barnett Liberal government undid much of the disaggregation in 2014. Verve Energy
        (generation) and Synergy (retail) were merged back into a single state-owned gentailer
        called <Em>Synergy</Em>. The argument: WA's small market (~5,000 MW peak demand vs 35,000+
        in the NEM) made true competition impractical, and vertical separation was producing
        retail-margin compression that risked making the state utility insolvent.
      </P>
      <P>
        Today, WA's SWIS structure is:
      </P>
      <Table
        emphasizeFirst
        headers={['Entity', 'Function', 'Ownership']}
        rows={[
          ['Synergy', 'Government-owned gentailer (gen + retail)', 'WA Government'],
          ['Western Power', 'Transmission + urban distribution', 'WA Government'],
          ['Horizon Power', 'Regional generation + distribution + retail', 'WA Government'],
          ['Alinta Energy', 'Private gentailer competitor to Synergy', 'Chow Tai Fook (Hong Kong)'],
          ['Bluewaters / Sumitomo', 'Private coal generation (Collie)', 'Sumitomo / Kansai consortium'],
          ['AEMO (WA division)', 'Market operator', 'Federal'],
        ]}
      />

      <Callout type="info">
        WA's re-merger of Synergy in 2014 went almost unnoticed nationally but it's a useful case
        study: it shows that even where structural separation was achieved, in a small market the
        benefits of vertical integration can outweigh the costs of reduced retail competition. The
        same logic explains why the NEM's gentailers (AGL, Origin, EnergyAustralia) survived and
        consolidated after privatisation despite COAG's original intent.
      </Callout>

      <Callout type="source">
        Sources: Queensland Energy and Jobs Plan 2022 · Queensland Treasury <em>GOC annual reports</em> ·
        WA Department of Energy <em>SWIS Reform Final Report 2014</em> ·
        Synergy and Western Power annual reports · ABC News election coverage 2015.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 5 — What is a gentailer (and why it works)
// ============================================================

function Lesson5() {
  return (
    <div>
      <H2>The word and what it actually means</H2>
      <P>
        A <Em>gentailer</Em> is a vertically-integrated business that owns both <em>generation</em>
        (power stations) and <em>retail</em> (the relationship with end-use electricity customers).
        Within the NEM, three companies have dominated the gentailer model for the past 20 years:
        AGL Energy, Origin Energy, and EnergyAustralia. A fourth — Alinta Energy — has scale in
        Western Australia and growing scale on the east coast. These four collectively serve roughly
        <Em> 75-80% of NEM electricity customers</Em> and own roughly <Em>55% of the dispatchable
        generation fleet</Em>.
      </P>

      <H2>Why vertical integration works in electricity</H2>
      <P>
        The structural argument for the gentailer model comes down to <Em>basis risk</Em>. A retailer
        without owned generation must buy electricity from the NEM pool at the regional reference
        price (RRP), which can swing from negative $1,000/MWh to $17,500/MWh in adjacent five-minute
        intervals. Customers, meanwhile, pay a fixed retail tariff. The retailer is short the
        difference and must hedge.
      </P>
      <P>
        Hedging instruments exist — swaps, caps, futures (traded on the ASX 24 platform) — but
        they have basis risk against the actual physical position. A retailer that hedges with a
        12-month $80/MWh swap is fully protected only if its actual customer load profile and
        regional price exposure exactly matches the swap reference. They never do.
      </P>
      <P>
        A retailer with owned generation has a <Em>natural hedge</Em>: when wholesale prices spike,
        retail margins compress, but generation margins expand. The two largely offset. The
        gentailer model effectively internalises the hedge — every MWh of customer load that's
        served by an owned MWh of generation eliminates both the retailer's basis risk and the
        generator's offtake risk.
      </P>

      <H2>The 2017-19 lesson — when non-gentailers got crushed</H2>
      <P>
        The structural advantage of the gentailer model was most visible during the 2017-19 NEM
        wholesale price spike. NEM average prices rose from ~$60/MWh in 2015-16 to ~$110-140/MWh in
        2018-19. Customers were on fixed retail tariffs set 12-18 months earlier. Non-gentailer
        retailers — pure resellers buying from the pool at spot or contract — saw their margins
        compress to negative. The casualty list:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Sumo Power</Em> — sold to Origin 2017</li>
        <li><Em>Powerdirect</Em> — sold to AGL 2007 (under previous price spike)</li>
        <li><Em>Pulse Energy</Em> — collapsed 2018, customers transferred</li>
        <li><Em>Urth Energy</Em> — went into liquidation 2019</li>
        <li><Em>One Big Switch / Energy Locals</Em> — squeezed, survived but at small scale</li>
        <li><Em>Click Energy</Em> — sold to AGL 2017</li>
        <li><Em>1st Energy</Em> — sold to ERM Power 2018</li>
        <li><Em>Diamond Energy</Em> — survived, but on retail-only model with constant capital raises</li>
      </ul>
      <P>
        The pattern is consistent: <Em>vertically-integrated incumbents bought out distressed
        retail-only competitors at depressed valuations.</Em> Every wholesale price cycle since 2007
        has produced this same pattern. The Big 4 gentailers' market share has therefore <em>grown</em>
        through periods of high wholesale prices, not shrunk.
      </P>

      <H2>Why the regulator hasn't intervened</H2>
      <P>
        The ACCC's 2018 <Em>Retail Electricity Pricing Inquiry</Em> identified gentailer dominance
        as a competition concern but stopped short of recommending structural separation. The
        argument:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Forced separation would destroy the natural hedge and increase capital costs for both
          generation and retail businesses</li>
        <li>The Default Market Offer (DMO, introduced 2019) caps retail price gouging in the
          standing-offer market</li>
        <li>Retail competition <em>exists</em> — there are ~75 active electricity retailers in the
          NEM. The Big 4 don't control 100% of customers.</li>
        <li>The transition to renewables requires gentailers to invest in new generation, and
          breaking up their balance sheets would make that harder</li>
      </ul>
      <P>
        The DMO has been the main regulatory lever. Set annually by the AER (federal) and ESC
        (Victoria), it caps what gentailers can charge standing-offer customers in each distribution
        network area. Market-offer customers (those on advertised plans) can be charged less, but
        not materially more. The DMO has tracked wholesale costs reasonably closely since 2019.
      </P>

      <H2>The Big 4 market share today</H2>
      <Table
        emphasizeFirst
        headers={['Gentailer', 'NEM retail accounts', 'NEM share', 'Owned generation (MW)', 'Generation share']}
        rows={[
          ['AGL Energy', '~4.5M', '28%', '~9,000 MW (incl. Bayswater + Loy Yang A)', '~18%'],
          ['Origin Energy', '~4.3M', '27%', '~6,000 MW (incl. Eraring)', '~12%'],
          ['EnergyAustralia', '~2.5M', '15%', '~3,200 MW (Yallourn + Mt Piper)', '~6%'],
          ['Alinta Energy', '~1.1M', '7%', '~1,500 MW (Loy Yang B + WA assets)', '~3%'],
          ['Big 4 total', '~12.4M', '77%', '~19,700 MW', '~39%'],
          ['~75 other retailers / generators', '~3.7M', '23%', '~30 GW (renewables + others)', '~61%'],
        ]}
      />
      <P>
        Two important things to read into this table. First, <Em>retail is more concentrated than
        generation</Em>: the Big 4 control 77% of customers but only ~39% of generation capacity.
        That's because renewables developers (Tilt, Goldwind, Neoen, ACEN, Iberdrola, ENGIE,
        Pacific Hydro etc.) own large chunks of new-build capacity but no retail. Second,
        <Em> generation share is falling fast</Em> — the Big 4's coal fleet is retiring, and they
        are competing with hundreds of new renewables developers for the replacement capacity.
      </P>

      <H2>What the gentailer model becomes in 2030</H2>
      <P>
        Two scenarios for what gentailers look like in 2030:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Status quo extended</Em> — Big 4 retain ~70-75% retail share, rebuild their
          generation portfolios around renewables + storage, run lower margins but on bigger
          customer bases. AGL and Origin pursue this path actively.</li>
        <li><Em>Customer-platform disruption</Em> — Amber, Powershop, OVO and others build retail
          businesses around customer-side optimisation (EV charging, BTM batteries, demand response).
          The Big 4 lose share to platforms but retain wholesale market power via owned generation.
          The retail margin <em>moves</em> from gentailer to platform.</li>
      </ul>

      <Callout type="key">
        The next five lessons profile the Big 4 in detail. The key question to keep in mind: each
        gentailer faces the same structural choice — defend the retail business with new owned
        generation, or accept that the generation business is becoming a separate (lower-return,
        higher-capital-intensity) infrastructure asset. AGL and Origin have committed to the first
        path. EnergyAustralia is hedging. Alinta is moving slower than the others.
      </Callout>

      <Callout type="source">
        Sources: ACCC <em>Retail Electricity Pricing Inquiry 2018</em> · AER <em>State of the
        Energy Market 2024</em> · AEMO retail market data · Company annual reports · AFR
        <em> Retail Casualty List 2017-2020</em>.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 6 — AGL — the 187-year arc
// ============================================================

function Lesson6() {
  return (
    <div>
      <H2>1837 — The oldest company in Australia</H2>
      <P>
        The <Em>Australian Gas Light Company</Em> was chartered by the New South Wales colonial
        legislature in 1837 — eight years before the colony of Victoria was carved out, fifteen
        years before the discovery of gold at Ballarat, sixty-four years before federation. Its
        founding purpose was singular: provide gaslight for Sydney's streets. The first gasworks at
        Darling Harbour fired up in 1841 and lit George Street with whale-oil-derived town gas
        within the year.
      </P>
      <P>
        AGL is therefore the second-oldest company in Australia (behind only Tooth & Co Brewery) and
        among the oldest continuously-operating gas companies in the English-speaking world. For
        most of its first 150 years it was a pure gas business — town gas from coal carbonisation,
        then natural gas from Bass Strait after 1976. Through the Great Depression, both World Wars,
        nationalisation efforts and the 1970s oil shocks, AGL stayed a Sydney-centric gas retailer.
        Generation was someone else's problem.
      </P>

      <H2>2000-2006 — The pivot to electricity</H2>
      <P>
        Australia's electricity privatisation created a one-time opportunity. AGL had:
        a large existing customer base (~1.5M gas accounts in NSW and VIC), brand trust, and an
        established billing/credit infrastructure that could be repurposed for electricity. What it
        didn't have was generation.
      </P>
      <P>
        The transition happened in three stages:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>2000-2003:</Em> AGL acquires retail rights to Victorian distribution-network
          customers from Pulse Energy and Solaris Power (the Victorian retailers spun out of SECV).
          Cross-sells electricity into existing gas customer base.</li>
        <li><Em>2003:</Em> AGL Power Generation formed as a subsidiary; AGL begins acquiring small
          gas peaker and wind portfolios.</li>
        <li><Em>2006:</Em> Corporate restructure creates <Em>AGL Energy Ltd</Em> as the modern
          listed gentailer. AGL formally becomes a vertically-integrated electricity + gas business
          for the first time in 169 years.</li>
      </ul>

      <H2>2007 — The Loy Yang stake</H2>
      <P>
        Loy Yang A — the largest power station in Victoria, 2,210 MW of brown coal generation at
        Traralgon — had been privatised by Kennett in 1997. The original Horizon Energy consortium
        collapsed by 2003 under the weight of post-Enron deleveraging. Loy Yang A was reorganised
        into a new vehicle called <Em>Great Energy Alliance Corporation (GEAC)</Em> in 2004. GEAC's
        ownership in 2007:
      </P>
      <Table
        emphasizeFirst
        headers={['Shareholder', 'Stake', 'Role']}
        rows={[
          ['AGL Energy', '32.54%', 'Australian off-taker, retail customer base'],
          ['Tokyo Electric Power Company (TEPCO)', '32.54%', 'Japanese strategic investor — coal-fired expertise'],
          ['Tokyo Gas', '11.50%', 'Japanese energy company'],
          ['Marubeni Corporation', '13.61%', 'Japanese trading house'],
          ['Macquarie Bank', '9.81%', 'Financial investor'],
        ]}
      />
      <P>
        AGL paid approximately $448M for its 32.54% stake in 2007 and immediately signed a long-term
        contract for 60% of Loy Yang A's output — making the plant a critical hedge against AGL's
        growing Victorian retail customer base.
      </P>

      <H2>11 March 2011 — Fukushima Daiichi</H2>
      <P>
        On 11 March 2011, the Tōhoku earthquake and tsunami struck Japan's northeast coast. The
        Fukushima Daiichi nuclear power plant, operated by Tokyo Electric Power Company (TEPCO),
        suffered cooling-system failures across three reactors and partial meltdowns over the
        following days. TEPCO's losses from the disaster eventually totalled an estimated
        ¥21 trillion (~A$280 billion). TEPCO was nationalised in 2012 to manage the cleanup. As
        part of its forced asset sale, TEPCO began divesting non-core international holdings —
        including its 32.54% stake in Loy Yang A.
      </P>
      <P>
        Tokyo Gas and Marubeni also signalled exit. The GEAC consortium was unwinding.
      </P>

      <Callout type="key">
        Fukushima is the proximate cause of AGL becoming Australia's largest single power generator.
        TEPCO's forced divestment after the disaster created a once-in-a-generation opportunity for
        AGL to consolidate full ownership of Loy Yang A. Whether AGL would have made the same move
        without Fukushima is impossible to say — but the timing was no coincidence.
      </Callout>

      <H2>2012 — AGL takes full ownership of Loy Yang A</H2>
      <P>
        In June 2012, AGL announced it would acquire the remaining 67.46% of Loy Yang A for
        approximately $448M (plus assumption of project debt). The transaction closed in December
        2012, giving AGL 100% ownership of:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Loy Yang A power station — 2,210 MW of brown-coal generation</li>
        <li>The adjacent Loy Yang coal mine — 30 Mt/yr of brown coal reserves</li>
        <li>The associated 500 kV transmission connection to the Latrobe Valley network</li>
      </ul>
      <P>
        Loy Yang A's brown-coal LCOE in 2012-15 was approximately $28-35/MWh. Wholesale prices
        averaged $50-60/MWh during the post-Carbon-Price period. The plant generated approximately
        16 TWh per year, implying gross margin of $230-450M per annum. The acquisition paid back its
        nominal price within 2-3 years and became AGL's largest single profit centre. It would
        remain so for the next decade.
      </P>

      <H2>2014 — Macquarie Generation</H2>
      <P>
        Twelve months after Loy Yang A consolidation, the NSW O'Farrell government put Macquarie
        Generation on the block. Macquarie Generation owned <Em>Bayswater Power Station</Em> (2,640
        MW, Hunter Valley, NSW black coal) and <Em>Liddell Power Station</Em> (2,000 MW, Hunter
        Valley, NSW black coal). AGL bid $1.505B and won the September 2014 auction against ERM
        Power, Marubeni and others.
      </P>
      <P>
        The Macquarie Generation acquisition made AGL:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>The <Em>largest single generator in the National Electricity Market</Em> — ~11,000 MW
          of installed capacity across Loy Yang A, Bayswater, Liddell, Torrens Island (SA gas),
          Newport (VIC gas), Macarthur wind, Hallett wind, and smaller hydro</li>
        <li>The <Em>largest single greenhouse gas emitter in Australia</Em> — approximately 42
          million tonnes CO₂-equivalent per annum, larger than any other entity in the Clean Energy
          Regulator's NGERS database</li>
        <li>A national gentailer in every NEM state (except Tasmania), with ~3.7M retail customers</li>
      </ul>

      <H2>2022 — The demerger that wasn't</H2>
      <P>
        By 2021, the strategic tension inside AGL had become impossible to manage. The coal-heavy
        generation portfolio was producing the cash that the renewables build-out needed, but it was
        also producing the emissions intensity that institutional investors increasingly couldn't
        hold. The AGL board, led by chair Peter Botten, proposed a structural demerger in mid-2021:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Accel Energy</Em> — the coal generation business (Loy Yang A, Bayswater, Liddell,
          Torrens Island, Newport). Designed to run the coal plants until close-down dates, then
          wind up.</li>
        <li><Em>AGL Australia</Em> — the retail business plus the renewables pipeline and gas
          peakers. Designed to be a forward-looking gentailer transitioning to clean energy.</li>
      </ul>
      <P>
        The demerger required 75% shareholder approval and was scheduled for a June 2022 vote.
      </P>

      <H2>Cannon-Brookes and the takedown</H2>
      <P>
        In February 2022, Mike Cannon-Brookes (co-founder of Atlassian) via his investment vehicle
        <Em> Grok Ventures</Em> joined with Brookfield Asset Management in a $5B takeover bid for the
        entire AGL business. The AGL board rejected it as undervaluing the company. The bidders
        withdrew.
      </P>
      <P>
        Cannon-Brookes then changed tactics. Grok Ventures spent approximately $650M acquiring
        <Em> 11.28% of AGL shares</Em> on-market through April-May 2022 — making Grok the single
        largest shareholder. Cannon-Brookes publicly opposed the demerger on the grounds that
        splitting the company would slow the closure of the coal plants (because Accel Energy would
        be capitalised specifically to run them out to schedule).
      </P>
      <P>
        AustralianSuper (10.1% holding) and HESTA (institutional super funds with combined ~13%)
        sided with Grok. With 30%+ of the register publicly opposed, the demerger could not reach
        75% approval. On 11 May 2022, the AGL board pulled the proposal and announced a major
        strategy review. Chair Peter Botten resigned within a week; CEO Graeme Hunt followed.
        Four other non-executive directors followed by mid-2022.
      </P>

      <H2>The Climate Transition Action Plan (2022-present)</H2>
      <P>
        The post-demerger AGL board (chaired by Patricia McKenzie from 2022) and the new CEO Damien
        Nicks pursued a strategy that the original demerger had ruled out: <Em>accelerate the coal
        exit using the cash that the coal business itself is generating</Em>.
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Liddell</Em> closed April 2023 — one year ahead of the original 2024 schedule, two
          years ahead of the post-Macquarie-Gen plan</li>
        <li><Em>Bayswater</Em> closure brought forward to 2033 (was 2035)</li>
        <li><Em>Loy Yang A</Em> closure brought forward to 2035 (was originally 2045-48)</li>
        <li><Em>Torrens Island</Em> closure brought forward to 2026 (was 2035)</li>
        <li><Em>Replacement build pipeline</Em>: ~12 GW of renewables and storage by 2035, with
          ~$20B of investment committed to the transition</li>
      </ul>
      <P>
        The 2024 Climate Transition Action Plan represents the largest single-company decarbonisation
        commitment in Australian corporate history — and a remarkable case study in shareholder
        activism reshaping a 187-year-old company's strategy in twelve months.
      </P>

      <Callout type="key">
        AGL's 2022 demerger battle is the most consequential corporate governance event in Australian
        energy industry history. Without it, AGL Energy would likely still be running its coal fleet
        to its original 2045-2048 closure dates. With it, AGL has accelerated coal closure by 7-10
        years and committed $20B to renewables — making it the single largest investor in
        Australia's energy transition. Lesson 7 examines what that pipeline actually looks like
        and how it's changing AGL's customer-vs-generation geography.
      </Callout>

      <Callout type="source">
        Sources: AGL Energy annual reports 2007-2025 · AGL Demerger Scheme Booklet 2021 ·
        Grok Ventures public correspondence 2022 · AustralianSuper public position 2022 ·
        Clean Energy Regulator NGERS database · Mike Cannon-Brookes public statements ·
        AFR <em>The Cannon-Brookes Files</em> · Reuters <em>TEPCO Loy Yang Sale</em> 2012.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 7 — AGL today and 2030 (geographic mismatch and rebalance)
// ============================================================

function Lesson7() {
  return (
    <div>
      <H2>AGL today — the customer footprint</H2>
      <P>
        As of mid-2026, AGL Energy serves approximately <Em>4.5 million electricity and gas
        customers</Em> across five jurisdictions (it does not operate in Tasmania or Western
        Australia). The customer mix:
      </P>
      <Table
        emphasizeFirst
        headers={['State', 'Approx. accounts', 'Share of AGL retail', 'Approx. AGL retail market share in that state']}
        rows={[
          ['VIC', '~1.5M', '33%', '~32% (gas + electricity combined)'],
          ['NSW', '~1.3M', '29%', '~24% (electricity), ~28% (gas)'],
          ['QLD', '~1.0M', '22%', '~30% (electricity)'],
          ['SA', '~0.6M', '13%', '~38% (electricity, largest of all gentailers)'],
          ['ACT', '~0.1M', '3%', '~25% (electricity)'],
        ]}
      />
      <P>
        Three patterns to note. First, <Em>AGL is over-indexed in Victoria</Em> — both because of
        its long history as a gas retailer in Sydney/Melbourne and because of the Pulse Energy
        acquisition. Second, <Em>AGL is the dominant retailer in SA</Em>, which has the highest
        average household bill in the NEM — making SA disproportionately important to AGL's retail
        margin. Third, <Em>AGL is meaningfully smaller in QLD</Em> than its national share, because
        Energy Queensland (Ergon Retail + Yurika) retains a strong regional presence.
      </P>

      <H2>AGL today — the generation footprint</H2>
      <P>
        AGL's generation portfolio as of mid-2026:
      </P>
      <Table
        emphasizeFirst
        headers={['Asset', 'State', 'Type', 'Capacity', 'Status']}
        rows={[
          ['Loy Yang A', 'VIC', 'Brown coal', '2,210 MW', 'Operating; close 2035 (planned)'],
          ['Bayswater', 'NSW', 'Black coal', '2,640 MW', 'Operating; close 2033 (planned)'],
          ['Liddell', 'NSW', 'Black coal', '2,000 MW', 'Closed April 2023'],
          ['Torrens Island A+B', 'SA', 'Gas', '1,280 MW', 'A retired; B operating, close 2026'],
          ['Newport', 'VIC', 'Gas peaker', '510 MW', 'Operating'],
          ['Somerton', 'VIC', 'Gas peaker', '150 MW', 'Operating'],
          ['Hallett Power Station', 'SA', 'Gas peaker', '203 MW', 'Operating'],
          ['Barker Inlet', 'SA', 'Gas peaker', '210 MW', 'Operating (commissioned 2019)'],
          ['Macarthur Wind Farm (50%)', 'VIC', 'Wind', '210 MW (AGL share)', 'Operating'],
          ['Hallett Wind Cluster', 'SA', 'Wind', '350 MW', 'Operating'],
          ['Coopers Gap Wind Farm', 'QLD', 'Wind', '453 MW (offtake)', 'Operating via PPA'],
          ['Broken Hill Solar', 'NSW', 'Solar', '53 MW', 'Operating (Cape Cluster)'],
          ['Nyngan + Broken Hill Solar PPAs', 'NSW', 'Solar', '300 MW (offtake)', 'Operating via PPA'],
          ['Liddell BESS', 'NSW', 'Battery', '500 MW / 2,000 MWh', 'Under construction; first 250 MW online late 2026'],
          ['Loy Yang BESS', 'VIC', 'Battery', '200 MW / 800 MWh', 'Under construction; online 2026-27'],
          ['Torrens Island BESS', 'SA', 'Battery', '250 MW / 1,000 MWh', 'Operating (commissioned 2023)'],
        ]}
      />

      <H2>The geographic mismatch — customers vs generation by state</H2>
      <P>
        Map AGL's customer footprint against its generation footprint and a clear mismatch emerges:
      </P>
      <Table
        emphasizeFirst
        headers={['State', 'AGL customer load (TWh)', 'AGL operating generation (TWh)', 'Net position', 'Implication']}
        rows={[
          ['VIC', '~10', '~14-16', 'Long generation (~+4-6 TWh)', 'AGL sells surplus into pool / contracts'],
          ['NSW', '~9', '~14-17', 'Long generation (~+5-8 TWh, falls to ~+5 by 2030 as Bayswater closes)', 'AGL sells surplus into pool / contracts'],
          ['QLD', '~7', '~3 (PPA offtake)', 'Short generation (~-4 TWh)', 'AGL buys from QLD pool / GOC contracts to serve customers'],
          ['SA', '~4', '~2-3', 'Short generation (~-1-2 TWh)', 'AGL buys from SA pool / Hornsdale-area generation'],
          ['ACT', '~1', '0', 'Short generation (~-1 TWh)', 'AGL buys from NSW pool / ACT 100% renewable contracts'],
        ]}
      />
      <P>
        Two observations. First, AGL is <Em>structurally long</Em> in VIC and NSW (more generation
        than load) and structurally <Em>short</Em> in QLD, SA and ACT (more load than generation).
        This is fine when wholesale prices are spread evenly across regions — AGL captures the
        difference. But it creates a vulnerability: regional price divergence (as happens during
        transmission congestion or interconnector outages) flows directly into AGL's earnings.
      </P>
      <P>
        Second, AGL's NSW long position is <Em>about to collapse</Em>. Bayswater closes in 2033; once
        it does, AGL loses ~16 TWh per year of NSW generation. To preserve its hedge against ~9 TWh
        of NSW customer load, AGL needs to replace not all 16 TWh but at least ~9 TWh of firm
        renewable generation. That's the core driver of the AGL renewables pipeline.
      </P>

      <H2>The AGL renewables pipeline — where the rebalance happens</H2>
      <P>
        AGL's announced Climate Transition Action Plan pipeline targets ~12 GW of new renewable and
        storage capacity by 2035. The geographic distribution is deliberately rebalanced:
      </P>
      <Table
        emphasizeFirst
        headers={['Project', 'State', 'Capacity', 'Type', 'Status / target online']}
        rows={[
          ['Liddell BESS', 'NSW', '500 MW / 2,000 MWh', 'Battery (4h)', 'Construction; first units late 2026'],
          ['Loy Yang BESS Phase 1', 'VIC', '200 MW / 800 MWh', 'Battery (4h)', 'Construction; 2026-27'],
          ['Loy Yang BESS Phase 2+3', 'VIC', '500 MW / 2,000 MWh', 'Battery (4h)', 'FID expected 2026-27'],
          ['Macquarie Energy Hub', 'NSW', '1,000 MW+', 'Solar + BESS hybrid', 'Planning; FID 2027'],
          ['Bowmans Creek Wind', 'NSW', '270 MW', 'Wind', 'Construction; online 2027'],
          ['Pottinger Wind Farm (offtake)', 'NSW', '~400 MW', 'Wind (PPA)', 'Development'],
          ['Bayswater Hub', 'NSW', '500 MW', 'Solar + BESS', 'Planning; uses Bayswater connection post-2033'],
          ['Hunter Renewable Energy Hub', 'NSW', '1,500 MW', 'Wind + solar + BESS', 'Planning'],
          ['Forest Wind (offtake)', 'QLD', '450 MW', 'Wind (PPA)', 'Construction'],
          ['Coopers Gap Wind expansion', 'QLD', 'TBA', 'Wind', 'Planning'],
          ['Aldoga Solar (offtake)', 'QLD', '~600 MW', 'Solar (PPA)', 'Construction'],
        ]}
      />

      <H2>What the rebalance looks like in 2030</H2>
      <P>
        Project the AGL pipeline forward to a 2030 generation footprint:
      </P>
      <Table
        emphasizeFirst
        headers={['State', 'AGL load 2030 (TWh)', 'AGL gen 2030 (TWh)', 'Net 2030', 'Comparison vs 2026']}
        rows={[
          ['VIC', '~11', '~10-12 (Loy Yang + new BESS + offtakes)', 'Roughly balanced', 'From +5 long → balanced'],
          ['NSW', '~10', '~15-17 (Bayswater still + new build)', 'Still long, +5-7', 'Similar; will collapse after 2033'],
          ['QLD', '~8', '~4 (new PPAs)', 'Still short, -4', 'Marginally better; remains primary growth focus'],
          ['SA', '~4', '~3 (firmed renewables)', 'Roughly balanced', 'From -2 short → balanced'],
          ['ACT', '~1', '0', 'Short', 'Unchanged'],
        ]}
      />
      <P>
        By 2030, AGL's portfolio looks meaningfully different: roughly balanced in VIC and SA, still
        long in NSW (until Bayswater retires), still short in QLD and ACT. The renewable build is
        therefore geographically targeted to fix the structural shortfall — not to replace
        coal-MWh-for-MWh, but to <em>match retail load to firm renewable generation in each region</em>.
      </P>

      <H2>What this does to AGL's revenue mix</H2>
      <P>
        AGL's FY25 underlying earnings ($1.4B EBIT) came roughly 65% from coal generation, 20% from
        retail margin, 10% from gas generation, and 5% from renewables + storage. By 2030 (with
        Bayswater still operating), this mix shifts to roughly: 40% from coal generation (declining),
        25% from renewable + storage generation, 20% from retail margin, 10% from gas peakers, 5%
        from carbon credits / other. By 2035 (post-Bayswater), coal drops to zero, renewables +
        storage rise to ~55-60% of earnings, retail margin remains ~20%, gas peakers ~15%, other ~5%.
      </P>

      <Callout type="key">
        The AGL transition story is therefore as much about <Em>geographic rebalancing</Em> as
        about replacing coal with renewables. The new build is concentrated in QLD (where AGL is
        short of generation) and in NSW (where Bayswater's eventual exit needs to be replaced). The
        VIC and SA fleets get firmed via storage rather than replaced. This pattern — replacing
        coal in some states, growing into others — will define the next decade of AGL's strategic
        story.
      </Callout>

      <Callout type="source">
        Sources: AGL Energy FY25 Investor Briefing · AGL Climate Transition Action Plan 2024 ·
        AEMO ISP 2026 generation forecast · AURES scheme tracker · AGL FY25 generation summary ·
        Reuters / AFR <em>AGL Strategy Update 2024-2025</em>.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 8 — Origin Energy
// ============================================================

function Lesson8() {
  return (
    <div>
      <H2>1946-2000 — Boral and the Australian energy slice</H2>
      <P>
        Origin Energy doesn't trace back to 1837 — it traces back to <Em>Boral Limited</Em>, founded
        1946 as Bituminous Oil Refineries Australia Ltd, a wartime petroleum-refining venture that
        pivoted to building materials in peacetime. Through the 1970s and 1980s, Boral built one of
        Australia's largest diversified industrial groups: bricks, cement, plasterboard, asphalt,
        timber, oil & gas. By the late 1990s, Boral's energy business included gas distribution
        networks, oil & gas exploration acreage, and a small electricity retail operation.
      </P>
      <P>
        In February 2000, Boral demerged its energy assets into a separately-listed company called
        <Em> Origin Energy Ltd</Em>. The board appointed Grant King as foundation CEO. Origin
        started life with: $1.3B revenue, ~150,000 retail customers (mostly gas), upstream gas
        exploration tenements in the Cooper Basin and Queensland's Surat Basin, and minority
        interests in three small gas-fired power stations.
      </P>

      <H2>2002-2007 — Vertical integration via retail acquisition</H2>
      <P>
        Grant King's strategy was to acquire retail at scale while building generation behind it.
        Key acquisitions:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>2002:</Em> Origin acquires CitiPower retail from US Edison Mission Energy</li>
        <li><Em>2004:</Em> Origin acquires Sun Retail (Queensland) from Ergon Energy as part of
          Bligh Labor's partial QLD retail privatisation</li>
        <li><Em>2006:</Em> Origin acquires Powerdirect retail from CS Energy</li>
        <li><Em>2007:</Em> Origin acquires the New Zealand operations of Contact Energy (~60%
          stake), making it briefly a trans-Tasman gentailer</li>
      </ul>
      <P>
        By 2007 Origin had grown from 150,000 to ~3 million retail customers. Its generation portfolio
        had also expanded — Roma Power Station (gas, QLD), Worsley Cogen (industrial), Mortlake gas
        plant (under construction VIC). But the major strategic move came from gas, not electricity.
      </P>

      <H2>2008-2013 — APLNG and the LNG bet</H2>
      <P>
        Origin's largest strategic move was the <Em>Australia Pacific LNG (APLNG)</Em> project — an
        export-LNG venture monetising Origin's Queensland coal-seam-gas reserves via a $20B
        gas-liquefaction plant on Curtis Island, Gladstone. The structure:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Origin Energy</Em> — 37.5% — upstream CSG resource provider, project operator</li>
        <li><Em>ConocoPhillips</Em> — 37.5% — LNG facility operator</li>
        <li><Em>Sinopec</Em> — 25% — anchor LNG offtake customer</li>
      </ul>
      <P>
        APLNG was sanctioned in July 2011, construction ran 2011-2015, and first cargo shipped
        January 2016. The project produced ~9 million tonnes per annum of LNG and locked in
        approximately A$70B of contracted offtake revenue (Sinopec + Kansai Electric + others) over
        20 years. APLNG immediately became Origin's largest single financial asset and the single
        largest source of group cash flow.
      </P>
      <P>
        The pivot to LNG had a side effect: Origin's domestic gas customers in eastern Australia
        were now competing for the same gas molecules that APLNG was exporting to Asia at oil-linked
        prices. This is the structural origin of Australia's east-coast gas-price problem, which
        peaked 2017-19 and remains contested in 2026.
      </P>

      <H2>2013 — Eraring</H2>
      <P>
        The September 2013 NSW Government sale of Eraring Power Station to Origin Energy is, in
        hindsight, one of the most lopsided transactions in Australian energy history. NSW sold
        Eraring (2,880 MW black coal at Lake Macquarie) for approximately $50M — a price that
        reflected:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>The Carbon Pricing Mechanism had just been repealed (July 2014 effective)</li>
        <li>NSW had already sold the output rights via the 2010 Gentrader deal — Origin owned the
          economic exposure, NSW owned the physical depreciation risk</li>
        <li>Wholesale prices were depressed (~$45-55/MWh)</li>
        <li>The Hunter Valley fuel supply was tightening</li>
      </ul>
      <P>
        Eraring became Origin's largest single asset. At ~$50/MWh wholesale and $25/MWh fuel cost,
        the plant generated ~$650M/year gross margin within five years — making it a 13:1 cash
        payback on the purchase price.
      </P>

      <H2>2020-2023 — Eraring closure and the Brookfield bid</H2>
      <P>
        Origin announced the early closure of Eraring (2025 target) in February 2022 — three years
        ahead of the previous 2032 schedule. The decision reflected the collapsing economics of NSW
        black coal as renewables share rose and wholesale prices fell. The announcement triggered an
        immediate political backlash and prompted negotiations with the NSW Government.
      </P>
      <P>
        Meanwhile, in March 2022, a consortium of <Em>Brookfield Asset Management</Em> (Canadian
        renewables-focused infrastructure investor) and <Em>EIG Partners</Em> (US energy-focused PE)
        made an unsolicited $9/share takeover offer for Origin — valuing the company at ~$18.4B.
        Origin's board rejected the offer. Over the following 18 months the bidders raised their
        offer multiple times, eventually reaching $9.53/share (~$19.5B) with revised
        scheme-of-arrangement terms.
      </P>

      <H2>November 2023 — The AustralianSuper veto</H2>
      <P>
        Brookfield/EIG's revised scheme of arrangement required 75% of votes by share count.
        <Em> AustralianSuper</Em>, holding 17.45% of Origin shares, publicly announced in October
        2023 that it would vote against — arguing the offer materially undervalued APLNG and the
        renewables pipeline. At a 17.45% no vote, the scheme could not reach 75% approval. The
        2 November 2023 scheme meeting confirmed the rejection: ~68% in favour, against the 75%
        threshold.
      </P>
      <P>
        Origin remained independent. Brookfield walked away. Frank Calabria continued as CEO.
        Within six months, Origin and the NSW Government signed an Eraring extension agreement that
        kept the plant running to 2027 (with optionality to 2029) under a profit/loss-share
        underwriting structure.
      </P>

      <H2>The Eraring underwriting deal (August 2024)</H2>
      <P>
        The August 2024 NSW-Origin agreement structured Eraring's continued operation as follows:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Origin agreed to keep Eraring running through August 2027 (and optionally 2029)</li>
        <li>NSW Government provided an opt-in profit/loss-share mechanism: if Eraring's operation
          generated profit above $40M/year, NSW would share in the upside; if losses exceeded a cap,
          NSW would cover them up to $225M</li>
        <li>The opt-in is annual — Origin chooses each year whether to invoke the protection. For
          FY26 and FY27, Origin chose <em>not</em> to opt in (because wholesale prices remained
          high enough to make the mechanism unnecessary)</li>
      </ul>
      <P>
        The Eraring deal is structurally similar to the federal CIS — a contract-for-difference
        revenue floor protecting against downside, with the operator retaining most upside. It
        effectively crystallises Origin's exit path from coal while preserving optionality to extend
        if firmness is needed.
      </P>

      <H2>Origin today and the 2030 pipeline</H2>
      <P>
        Origin's current generation footprint:
      </P>
      <Table
        emphasizeFirst
        headers={['Asset', 'State', 'Type', 'Capacity', 'Status']}
        rows={[
          ['Eraring', 'NSW', 'Black coal', '2,880 MW', 'Operating; close 2027 (opt-in 2029)'],
          ['Mortlake', 'VIC', 'Gas', '550 MW', 'Operating'],
          ['Quarantine', 'SA', 'Gas peaker', '224 MW', 'Operating'],
          ['Darling Downs', 'QLD', 'Gas', '644 MW', 'Operating'],
          ['Shoalhaven Pumped Hydro', 'NSW', 'Hydro', '240 MW', 'Operating'],
          ['Eraring BESS', 'NSW', 'Battery', '700 MW / 2,800 MWh', 'Construction; phase 1 online 2025, phase 2 2026'],
          ['Mortlake BESS', 'VIC', 'Battery', '300 MW / 1,200 MWh', 'Planning'],
          ['Yarwun (offtake)', 'QLD', 'Solar', '~150 MW', 'PPA'],
          ['Stockyard Hill (offtake)', 'VIC', 'Wind', '530 MW', 'Operating via PPA'],
          ['Cherry Tree Wind', 'VIC', 'Wind', '57 MW', 'Operating'],
        ]}
      />
      <P>
        Origin's 2030 strategic focus is narrower than AGL's: Eraring BESS at scale, Mortlake BESS,
        more offtake PPAs to feed retail load, and continued growth of APLNG as the cash engine.
        Origin has not committed to building utility-scale solar or wind itself — preferring to
        contract with developers like Tilt, Goldwind, and Iberdrola via long-term PPAs.
      </P>

      <Callout type="key">
        Origin Energy is structurally different from AGL: it's a <Em>retail-and-LNG company that
        happens to own one big coal plant</Em>, where AGL is a <Em>coal-generation company that
        owns a big retail business</Em>. Origin's coal exit is therefore simpler — once Eraring
        closes, Origin's emissions profile collapses dramatically. AGL's transition is bigger and
        more complex because it has more coal to replace and a less profitable export-LNG hedge.
      </Callout>

      <Callout type="source">
        Sources: Origin Energy annual reports 2010-2025 · Origin Scheme Booklet 2023 ·
        AustralianSuper public statements October 2023 · NSW Government Eraring Agreement 2024 ·
        APLNG joint venture disclosures · AFR <em>The Brookfield Files</em>.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 9 — EnergyAustralia
// ============================================================

function Lesson9() {
  return (
    <div>
      <H2>1935-1996 — Sydney County Council</H2>
      <P>
        EnergyAustralia is the unusual case: its origins are not a private gas company (like AGL) or
        an industrial spin-off (like Origin), but a Sydney local-government electricity utility. The
        <Em> Sydney County Council Electricity Department</Em> was established in 1935 to operate
        Sydney's electricity supply on behalf of 39 metropolitan municipalities. Through 1935-1996
        it grew into one of the largest electricity distributors in the country — serving 1.4M
        accounts across Sydney, the Central Coast and the Hunter region.
      </P>

      <H2>1996-2011 — From county council to corporatisation to privatisation</H2>
      <P>
        Sydney County Council was corporatised by the Greiner-Fahey Liberal NSW government in 1995-96
        as <Em>EnergyAustralia Pty Ltd</Em>, a state-owned corporation. The corporatisation kept
        EnergyAustralia 100% state-owned but separated it from local-government control. Through
        1996-2010 EnergyAustralia operated as NSW's largest electricity retailer and distribution
        network operator — the latter focused on inner Sydney.
      </P>
      <P>
        The 2010 Keneally Gentrader deal split EnergyAustralia in two:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>The <Em>distribution network</Em> portion (poles and wires inner Sydney) stayed
          state-owned and was renamed <Em>Ausgrid</Em> in 2011. Ausgrid was later partially
          privatised by the Baird Liberal government in 2016 — sold as a 99-year lease to a
          consortium including Australian Super, IFM Investors and CKI.</li>
        <li>The <Em>retail</Em> business (~2.4M accounts) was sold to <Em>TRUenergy</Em> for $2.04B
          as part of the same December 2010 transaction that sold Mt Piper and Wallerawang gentrader
          rights to TRUenergy.</li>
      </ul>

      <H2>2011-2012 — The TRUenergy / CLP transition</H2>
      <P>
        TRUenergy was the Australian operating subsidiary of <Em>CLP Group</Em> (originally China
        Light & Power Hong Kong), a Hong Kong-listed Asian utility holding company. CLP had
        acquired TRUenergy in 2005 from TXU Australia. TRUenergy's pre-2011 portfolio included
        Yallourn (VIC brown coal), Iona gas plant (VIC), and a smaller retail business.
      </P>
      <P>
        After acquiring EnergyAustralia retail from NSW in December 2010, CLP rebranded the merged
        entity in 2012 under the <Em>EnergyAustralia</Em> brand — adopting the more recognisable
        name and quietly retiring TRUenergy. The 2012 rebrand merged:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Yallourn 1,480 MW brown coal (acquired by TRUenergy from PowerGen UK in 2005)</li>
        <li>Mt Piper 1,400 MW black coal (gentrader rights from 2010, full ownership 2014)</li>
        <li>EnergyAustralia retail ~2.4M customers</li>
        <li>Several gas peakers (Tallawarra A in NSW, Iona in VIC, Newport contracts)</li>
      </ul>
      <P>
        EnergyAustralia from 2012 onward has been, technically, a Hong Kong-owned company — making it
        the only one of Australia's Big 4 gentailers under foreign ultimate ownership. CLP Holdings
        remains the parent, listed on the Hong Kong Stock Exchange (HKEX: 0002).
      </P>

      <H2>The CLP problem — capital allocation conflict</H2>
      <P>
        CLP's global portfolio includes Hong Kong electricity supply (the original CLP Power Hong
        Kong), Indian renewables, Chinese coal generation, and Taiwanese power. Within that group,
        EnergyAustralia is one of several subsidiaries competing for capital. The result has been a
        consistently smaller renewables build-out than either AGL or Origin: where AGL committed
        ~$20B to its transition pipeline, EnergyAustralia's announced spend is ~$3-4B. This isn't
        because EnergyAustralia is smaller in scale — its NSW + VIC generation portfolio is larger
        than Alinta's — but because CLP can deploy capital in Asian markets at higher return.
      </P>

      <H2>2021 — The Yallourn closure agreement</H2>
      <P>
        Yallourn Power Station is one of Australia's oldest operating coal plants (commissioned in
        stages from 1973, units progressively retired and replaced). Its closure date was originally
        2032, but in March 2021 EnergyAustralia and the Victorian Government announced an
        accelerated closure agreement for <Em>mid-2028</Em>. The terms were never made public — but
        the deal includes confidential payments from the VIC government to EnergyAustralia in
        exchange for closure-date certainty.
      </P>
      <P>
        EnergyAustralia in exchange committed to:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Build the <Em>Wooreen Energy Storage Project</Em> (350 MW / 1,400 MWh BESS) on the
          Yallourn site by 2028 to replace some of the closure-period firmness</li>
        <li>Build or contract <Em>Tallawarra B</Em> (320 MW gas peaker) in NSW — commissioned
          October 2023, hydrogen-capable</li>
        <li>Commit to a renewable energy transition plan with milestone reporting</li>
      </ul>

      <H2>2026 outlook — Mt Piper and the slow transition</H2>
      <P>
        Mt Piper Power Station (1,400 MW, NSW black coal, near Lithgow) remains EnergyAustralia's
        largest operating asset post-Yallourn closure. Its official close date is 2040 — the latest
        of the major NSW coal plants. Whether it actually reaches that date depends on:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>NSW black coal availability (Springvale mine supplies Mt Piper; Centennial Coal has
          flagged reserve depletion concerns)</li>
        <li>Whether the NSW Government extends LTESA-style underwriting to Mt Piper as Bayswater
          approaches closure</li>
        <li>Whether CLP allocates capital to extend the plant's life vs deploying that capital in
          Indian or Hong Kong assets</li>
      </ul>

      <H2>EnergyAustralia today</H2>
      <P>
        Generation portfolio mid-2026:
      </P>
      <Table
        emphasizeFirst
        headers={['Asset', 'State', 'Type', 'Capacity', 'Status']}
        rows={[
          ['Mt Piper', 'NSW', 'Black coal', '1,400 MW', 'Operating; close 2040 (planned)'],
          ['Yallourn', 'VIC', 'Brown coal', '1,480 MW', 'Operating; close mid-2028'],
          ['Tallawarra B', 'NSW', 'Gas peaker', '320 MW', 'Operating (commissioned Oct 2023)'],
          ['Hallett Power Station (lease)', 'SA', 'Gas peaker', '203 MW', 'Operating via lease'],
          ['Cathedral Rocks Wind (offtake)', 'SA', 'Wind', '66 MW', 'Operating via PPA'],
          ['Boco Rock Wind (offtake)', 'NSW', 'Wind', '113 MW', 'Operating via PPA'],
          ['Wooreen BESS', 'VIC', 'Battery', '350 MW / 1,400 MWh', 'Construction; online 2028'],
          ['Hallett BESS', 'SA', 'Battery', '50 MW / 200 MWh', 'Planning'],
          ['Lake Lyell Pumped Hydro', 'NSW', 'Pumped hydro', '335 MW (proposed)', 'Pre-feasibility; delayed'],
        ]}
      />
      <P>
        Retail footprint: ~2.5M accounts across NSW (most), VIC, QLD, SA, ACT. Stronger in NSW than
        VIC despite the major generation asset being VIC-based.
      </P>

      <Callout type="key">
        EnergyAustralia's strategic position is the most uncertain of the Big 4. Its parent (CLP)
        has higher-return Asian investment options. Its NSW asset (Mt Piper) faces fuel-supply
        risk. Its VIC asset (Yallourn) closes in 2028 with limited replacement build. Its retail
        base is stable but vulnerable to disintermediation. Of the four major gentailers, it has
        the smallest committed renewables pipeline and the weakest transition story.
      </Callout>

      <Callout type="source">
        Sources: CLP Holdings annual reports · EnergyAustralia annual reports 2012-2025 ·
        NSW Treasury <em>Privatisation Final Report 2014</em> · Victorian Government Yallourn deal
        2021 · AURES scheme tracker · AFR <em>Inside EnergyAustralia</em> 2024.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 10 — Alinta Energy
// ============================================================

function Lesson10() {
  return (
    <div>
      <H2>2000 — Alinta Gas privatised from SECWA</H2>
      <P>
        Alinta's origins trace to the breakup of the State Electricity Commission of Western
        Australia (SECWA) in 1995-2000. The Court Liberal government separated SECWA into Western
        Power (transmission/distribution), Verve Energy (generation) and AlintaGas (gas
        distribution + retail). AlintaGas was floated on the ASX in 2000 as a privatised gas
        utility — initially focused on the WA gas pipeline network and retail business.
      </P>
      <P>
        The 2000 IPO valued the company at $1.4B. Bob Browning was the foundation CEO.
      </P>

      <H2>2000-2007 — The Browning expansion</H2>
      <P>
        Under Browning, Alinta expanded aggressively from a WA gas utility into a national
        diversified infrastructure group. Acquisitions over 2000-2006 included:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li>Duke Energy's Australian assets (gas pipelines + storage)</li>
        <li>Multinet Gas (Victorian distribution network)</li>
        <li>United Energy Distribution (Victorian electricity network)</li>
        <li>AGL's NSW gas distribution networks (asset swap, 2006)</li>
        <li>Stake in Eastern Star Gas (CSG exploration)</li>
      </ul>
      <P>
        By 2007 Alinta was Australia's largest diversified energy infrastructure group, with assets
        spanning gas pipelines, electricity networks and CSG development. The growth was funded
        primarily through debt and a stretched balance sheet.
      </P>

      <H2>2007 — Babcock & Brown and the peak</H2>
      <P>
        In August 2007, at the height of the pre-GFC infrastructure boom, a consortium led by
        <Em> Babcock & Brown Infrastructure</Em> (the listed infrastructure arm of Babcock & Brown
        merchant bank) and <Em>Singapore Power</Em> agreed a $7.4B takeover of Alinta. The deal
        valued Alinta at a 27% premium to its pre-bid trading price.
      </P>
      <P>
        Almost immediately after the transaction closed, the global financial crisis arrived. By
        2009 Babcock & Brown Group was in administration. The Alinta assets were progressively
        broken up and sold to repay debt — distributing the gas pipelines to APA Group, the
        Victorian distribution networks to Spark Infrastructure, and the WA generation and retail
        business into a separately-managed entity.
      </P>

      <H2>2011 — TPG buys what's left</H2>
      <P>
        In December 2011, US private equity firm <Em>TPG Capital</Em> acquired the rump Alinta
        Energy business — by then primarily WA retail customers plus the Loy Yang B 1,070 MW brown
        coal plant in Victoria and some smaller WA generation. The price was approximately $2.1B
        (vs the 2007 sale price of $7.4B for the larger pre-breakup entity).
      </P>
      <P>
        TPG ran Alinta for 6 years, focusing on operational efficiency rather than expansion. The
        rebuild work positioned Alinta for a second sale at higher valuation.
      </P>

      <H2>2017 — Chow Tai Fook acquires Alinta</H2>
      <P>
        In April 2017, TPG sold Alinta Energy to <Em>Chow Tai Fook Enterprises</Em> (CTFE), the
        private investment holding company of Hong Kong's Cheng family. CTFE's primary business is
        the listed jewelry chain <em>Chow Tai Fook Jewellery Group</em> (HKEX: 1929), but the
        family's broader portfolio spans property, utilities, ports and infrastructure across Asia.
        The acquisition price was approximately $4B.
      </P>
      <P>
        In the same year (October 2017), Alinta acquired <Em>Loy Yang B</Em> from China Power
        International Development Ltd (a subsidiary of China Energy Investment Corporation) for
        approximately A$1.07B. Loy Yang B (1,070 MW brown coal, adjacent to AGL's Loy Yang A in the
        Latrobe Valley) became Alinta's largest single asset.
      </P>

      <H2>Alinta today — WA strongest, east coast growing</H2>
      <P>
        Generation portfolio mid-2026:
      </P>
      <Table
        emphasizeFirst
        headers={['Asset', 'State', 'Type', 'Capacity', 'Status']}
        rows={[
          ['Loy Yang B', 'VIC', 'Brown coal', '1,070 MW', 'Operating; official close 2047 (likely earlier)'],
          ['Pinjarra Cogen', 'WA', 'Gas cogen', '240 MW', 'Operating (Alcoa industrial offtake)'],
          ['Wagerup Cogen', 'WA', 'Gas cogen', '240 MW', 'Operating (Alcoa industrial offtake)'],
          ['Newman Power Station', 'WA NWIS', 'Gas', '178 MW', 'Operating (Pilbara, BHP supply)'],
          ['Port Hedland Power Station', 'WA NWIS', 'Gas', '212 MW', 'Operating'],
          ['Reeves Plains Power Station', 'SA', 'Gas peaker', '198 MW', 'Operating'],
          ['Glenrowan West Solar', 'VIC', 'Solar', '65 MW', 'Operating'],
          ['Yandin Wind Farm', 'WA SWIS', 'Wind', '214 MW', 'Operating'],
          ['Chichester Solar Farm', 'WA SWIS', 'Solar', '60 MW', 'Operating'],
          ['Reeves Plains BESS', 'SA', 'Battery', '111 MW / 222 MWh', 'Construction; online 2026'],
        ]}
      />
      <P>
        Retail base: approximately 1.1M accounts. Strong in WA (where Alinta is the primary
        challenger to state-owned Synergy on the SWIS) and growing on the east coast (NSW, VIC, QLD,
        SA combined ~700,000 accounts).
      </P>

      <H2>Where Alinta sits in the transition story</H2>
      <P>
        Alinta is the most coal-heavy of the Big 4 by share of total generation (Loy Yang B
        represents ~60% of its operating output). It is also the most under-invested in renewables
        relative to its size — committing roughly $1B to its energy transition pipeline vs AGL's
        $20B and Origin's ~$5B. CTFE's investment thesis appears to be: <Em>run the coal asset
        through to a profitable exit, build modest renewables, and avoid the high-capex
        transformation that AGL is undertaking</Em>.
      </P>
      <P>
        Loy Yang B's official 2047 closure date is widely regarded as a planning placeholder. The
        plant is the youngest of the Latrobe Valley brown-coal generators (commissioned 1996), so
        physical asset life is real. But AEMO's 2026 ISP forecasts Loy Yang B exit by 2035-37 as
        wholesale prices and brown-coal LCOE diverge under high renewable penetration. Alinta's
        actual closure decision will likely come in the early 2030s.
      </P>

      <Callout type="key">
        Alinta is the dark horse of the Big 4. Its WA business is structurally strong — Synergy
        (state-owned) faces capital allocation constraints, leaving Alinta as the primary growth
        gentailer in the SWIS. Its east-coast business is smaller but growing. Its parent (CTFE) is
        opaque about long-term strategy and has shown willingness to hold the asset through a
        slow transition rather than accelerate spend. Whether Alinta becomes a credible challenger
        to AGL/Origin nationally, or remains a regional player, will hinge on Loy Yang B's exit
        timing and CTFE's appetite for east-coast renewable investment.
      </Callout>

      <Callout type="source">
        Sources: Alinta Energy annual reports 2017-2025 · Chow Tai Fook Enterprises corporate
        disclosures (limited) · TPG Capital exit announcement 2017 · ABC <em>Babcock &amp; Brown
        Collapse</em> 2009 · AEMO ISP 2026 · AFR <em>Inside Alinta</em> 2023.
      </Callout>
    </div>
  )
}

// ============================================================
// Lesson 11 — Coal exit and the 2030-35 NEM landing
// ============================================================

function Lesson11() {
  return (
    <div>
      <H2>The coal closure schedule</H2>
      <P>
        Australia's NEM coal fleet peaked at approximately 24 GW in the mid-2010s. As of mid-2026,
        operating coal is approximately 17 GW. By 2030 it will be approximately 11-13 GW. By 2035,
        approximately 4-5 GW. By 2040, approximately 1.4 GW (Mt Piper if it stays). The schedule:
      </P>
      <Table
        emphasizeFirst
        headers={['Plant', 'State', 'Owner', 'Capacity', 'Close date']}
        rows={[
          ['Hazelwood', 'VIC', 'ENGIE (was Internat\'l Power)', '1,600 MW', 'Mar 2017 (already closed)'],
          ['Northern', 'SA', 'ENGIE (was NRG)', '520 MW', 'May 2016 (already closed)'],
          ['Wallerawang', 'NSW', 'EnergyAustralia', '1,000 MW', '2014 (already closed)'],
          ['Munmorah', 'NSW', 'Delta', '600 MW', '2010 (already closed)'],
          ['Liddell', 'NSW', 'AGL', '2,000 MW', 'April 2023 (already closed)'],
          ['Torrens Island A', 'SA', 'AGL', '480 MW (gas)', '2024 (already closed)'],
          ['Eraring', 'NSW', 'Origin', '2,880 MW', '2027 (opt-in to 2029)'],
          ['Yallourn', 'VIC', 'EnergyAustralia', '1,480 MW', 'Mid-2028'],
          ['Vales Point', 'NSW', 'Delta (Sev.en Global)', '1,320 MW', '2033 (committed)'],
          ['Bayswater', 'NSW', 'AGL', '2,640 MW', '2033'],
          ['Loy Yang A', 'VIC', 'AGL', '2,210 MW', '2035'],
          ['Callide B', 'QLD', 'CS Energy', '700 MW', '2028 (target)'],
          ['Stanwell', 'QLD', 'Stanwell Corp', '1,460 MW', '2035 (target)'],
          ['Callide C', 'QLD', 'CS Energy', '810 MW', '2035 (target)'],
          ['Gladstone', 'QLD', 'NRG Gladstone consortium', '1,680 MW', '2029 (target)'],
          ['Kogan Creek', 'QLD', 'CS Energy', '750 MW', '2030 (target)'],
          ['Tarong', 'QLD', 'Stanwell Corp', '1,400 MW', '2035-37 (target)'],
          ['Tarong North', 'QLD', 'Stanwell Corp', '443 MW', '2037 (target)'],
          ['Mt Piper', 'NSW', 'EnergyAustralia', '1,400 MW', '2040 (planned, uncertain)'],
          ['Loy Yang B', 'VIC', 'Alinta', '1,070 MW', '2047 (planned, likely 2035-37)'],
        ]}
      />

      <H2>Federal and state interventions in the coal exit</H2>
      <P>
        The unmanaged coal exit has been a political nightmare. Hazelwood's surprise March 2017
        closure (announced November 2016 with five months' notice) sent wholesale prices in
        Victoria from ~$60/MWh to ~$110/MWh almost overnight and was a defining political event for
        the 2017-19 energy debate. To prevent repetition, every subsequent major closure has been
        wrapped in some form of government underwriting or coordination mechanism:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Liddell (AGL)</Em> — closure scheduled with 5+ years' notice; replacement via the
          AGL Hunter Energy Hub (Liddell BESS now being built on the site). No direct underwriting
          but the federal Coalition Government threatened compulsory acquisition in 2018 to keep it
          open. AGL closed it on time.</li>
        <li><Em>Yallourn (EnergyAustralia)</Em> — March 2021 confidential VIC Government deal to
          bring closure forward from 2032 to 2028, in exchange for confidential payments. The
          structure has been criticised as opaque but it secured the closure date.</li>
        <li><Em>Eraring (Origin)</Em> — August 2024 NSW Government opt-in profit/loss share
          underwriting. $40M annual profit threshold, $225M loss cap. Origin chose not to opt in
          for FY26 and FY27 because prices stayed high. Origin chose not to opt in for FY26 and FY27
          (price stayed high enough). Closure 2027 or 2029 depending on annual decision.</li>
        <li><Em>Bayswater (AGL)</Em> — committed close date 2033; no specific underwriting yet.
          Likely to attract CIS-style firmness payments in the late 2020s as the closure date
          approaches.</li>
        <li><Em>Queensland fleet</Em> — coordinated via the 2022 Queensland Energy and Jobs Plan
          ($62B state-led transition). State ownership of CS Energy, Stanwell and CleanCo means the
          closure schedule can be coordinated without market underwriting — losses absorbed by
          Queensland Treasury.</li>
        <li><Em>Loy Yang A (AGL)</Em> — 2035 close date in AGL Climate Transition Action Plan. Likely
          to attract a Victorian Government deal similar to Yallourn 2021 in the early 2030s.</li>
      </ul>

      <H2>What's replacing coal</H2>
      <P>
        The 2024 + 2026 AEMO Integrated System Plans (ISPs) lay out what will replace ~20 GW of coal
        by 2035. Approximate magnitudes (Step Change scenario, NEM-wide):
      </P>
      <Table
        emphasizeFirst
        headers={['Technology', '2026 capacity', '2030 capacity', '2035 capacity', 'Growth']}
        rows={[
          ['Operating coal', '~17 GW', '~11-13 GW', '~4-5 GW', '−12 GW'],
          ['Utility-scale solar', '~7 GW', '~18 GW', '~28 GW', '+21 GW'],
          ['Utility wind', '~12 GW', '~22 GW', '~30 GW', '+18 GW'],
          ['Rooftop solar (DPV)', '~24 GW', '~32 GW', '~40 GW', '+16 GW'],
          ['Grid BESS (4-8h)', '~3 GW', '~13 GW', '~25 GW', '+22 GW'],
          ['Long-duration storage (8h+)', '~1 GW', '~5 GW', '~12 GW', '+11 GW'],
          ['Pumped hydro', '~2.5 GW (excl. Snowy 2.0)', '~4.5 GW (with Snowy 2.0)', '~5 GW', '+2.5 GW'],
          ['Gas (peakers + open cycle)', '~10 GW', '~10 GW', '~10 GW', 'flat'],
          ['Behind-the-meter batteries', '~2 GW', '~6 GW', '~12 GW', '+10 GW'],
        ]}
      />
      <P>
        Three things to read from this. First, <Em>the replacement build is bigger than the coal
        being replaced</Em> — roughly 80 GW of new generation and storage versus 12 GW of coal exit.
        This reflects (a) lower capacity factor of renewables vs coal, (b) demand growth (data
        centres, electrification, EVs) absorbing the gap, and (c) the need for storage to firm
        intermittent generation.
      </P>
      <P>
        Second, <Em>storage is the fastest-growing category by far</Em> — grid BESS plus LDS plus
        BTM batteries combined grow from ~6 GW in 2026 to ~49 GW in 2035, an eight-fold increase.
        This is the storage-saturation thesis from the BESS module's Lesson 11.
      </P>
      <P>
        Third, <Em>gas stays flat at ~10 GW</Em> through 2035. The gas peakers don't grow but they
        also don't retire — they're the residual firmness that the storage build-out can't
        economically displace until long-duration storage matures further. The 2035-40 period is
        when gas itself starts retiring in earnest.
      </P>

      <H2>The 2030-2035 NEM in numbers</H2>
      <P>
        A snapshot of the AEMO Step Change scenario at 2030:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>Generation mix:</Em> ~70-78% from variable renewables (wind + solar + rooftop), ~8%
          gas, ~10-15% coal (declining), ~3-5% pumped hydro and storage discharge</li>
        <li><Em>Annual demand:</Em> ~215 TWh (vs ~190 TWh in 2024) — modest growth despite
          electrification, because demand response and BTM solar offset most load growth</li>
        <li><Em>Peak demand:</Em> ~37 GW (vs ~35 GW today) — modest growth, but shifting from summer
          evening to summer afternoon as EV charging and AC load patterns shift</li>
        <li><Em>Minimum demand:</Em> approaching 0 GW (or even negative) on shoulder-season weekends
          as rooftop solar overwhelms operational load</li>
      </ul>

      <H2>What this means for the gentailers</H2>
      <P>
        The four gentailers profiled in Lessons 6-10 face the same structural transition with
        different starting positions:
      </P>
      <ul className="list-disc list-inside text-sm text-[var(--color-text-muted)] space-y-1.5 mb-3 ml-2">
        <li><Em>AGL</Em> — biggest coal exit (4,850 MW), biggest replacement spend ($20B), most
          aggressive timeline. By 2035 will be a primarily renewables + storage gentailer.</li>
        <li><Em>Origin</Em> — single largest coal asset (Eraring 2,880 MW) but earliest exit (2027-
          29). Smallest replacement spend relative to coal exit because LNG revenue continues. By
          2030, primarily LNG + Eraring BESS + retail.</li>
        <li><Em>EnergyAustralia</Em> — moderate coal exit (Yallourn 2028 + Mt Piper 2040), smallest
          replacement spend, most exposed to a slow-transition scenario. CLP parent capital
          allocation is the swing variable.</li>
        <li><Em>Alinta</Em> — last coal exit (Loy Yang B 2047 official, likely earlier), smallest
          replacement spend by share of generation, strong WA stronghold. By 2035, primarily a WA
          gentailer with declining east-coast presence unless investment accelerates.</li>
      </ul>

      <H2>Risk: what could break the schedule</H2>
      <Table
        emphasizeFirst
        headers={['Risk', 'Trigger', 'Likely consequence']}
        rows={[
          ['Forced unscheduled coal closure', 'Boiler failure, mine depletion, owner financial distress', 'Wholesale price spike; emergency LTESA-style underwriting'],
          ['Transmission build delays', 'EnergyConnect, HumeLink, Marinus running 3+ years late', 'REZ generation stranded; coal extension required'],
          ['Replacement build delays', 'CIS contracts not converting to FID, supply chain bottlenecks', 'Reliability gap 2028-32; gas peaker build accelerated'],
          ['Demand shock', 'AI data centre load growing faster than ISP forecasts', 'Tight market 2026-30; coal extension or accelerated peaker build'],
          ['Gentailer balance sheet stress', 'AGL or Origin transition spend overruns', 'Slowed renewable build; reliance on developer-led capacity'],
        ]}
      />

      <Callout type="key">
        The energy transition in the NEM is fundamentally a transition <em>between corporate
        balance sheets</em>: from the integrated gentailer model that owned the coal fleet, to a
        more fragmented model where developers (Tilt, Neoen, ACEN, Iberdrola, Goldwind, Squadron,
        SunCable, Engie Australia, EDF Renewables, EDP Renewables) own most new-build renewables
        while the gentailers retain retail relationships and provide firmness. The Big 4
        gentailers' challenge is to retain enough <em>generation</em> ownership to keep their natural
        retail hedge — a challenge AGL and Origin are tackling head-on, EnergyAustralia is hedging,
        and Alinta is mostly avoiding.
      </Callout>

      <Callout type="source">
        Sources: AEMO Integrated System Plan 2024 + 2026 · AURES coal closure tracker ·
        Clean Energy Regulator NGERS data · NSW Government Eraring Agreement 2024 ·
        Queensland Energy and Jobs Plan 2022 · Victorian Yallourn Agreement 2021 ·
        AGL Climate Transition Action Plan · Origin Energy Investor Day 2025.
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
          <span className="text-3xl" aria-hidden>🔄</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400">
            ✅ Available
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight"
          style={{ borderLeft: '4px solid #0ea5e9', paddingLeft: 12, marginLeft: -12 }}>
          The Energy Transition in the NEM
        </h1>
        <p className="text-base italic text-[var(--color-text-muted)]">
          Privatisation, the rise of the gentailer, and the decarbonisation arc.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed max-w-3xl">
          The modern NEM is the product of a structural reform that started in 1991 and a series
          of state-by-state privatisations that ran from 1992 to 2014 — and the four corporate
          empires (AGL, Origin, EnergyAustralia, Alinta) that grew up inside it. This 11-lesson
          module walks through the pre-NEM era, each state's privatisation path, the rise of the
          gentailer business model, and deep-dive profiles of the four organisations that dominate
          generation and retail today. The closing lesson maps the 2030-2035 coal exit and what
          replaces it.
        </p>
      </div>

      <div className="space-y-3">
        {LESSONS.map(l => {
          const done = progress.has(l.id)
          return (
            <Link key={l.id} to={`/learn/energy-transition/${l.id}`}
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
            <span className="text-[var(--color-text-muted)] ml-2">— CIS/LTESA awards including the gentailer wins</span>
          </li>
          <li>
            <Link to="/intelligence/asset-lifecycle" className="text-[var(--color-primary)] hover:underline">
              Asset Lifecycle →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— coal closure schedule by plant</span>
          </li>
          <li>
            <Link to="/learn/bess-story" className="text-[var(--color-primary)] hover:underline">
              Solar + BESS Story module →
            </Link>
            <span className="text-[var(--color-text-muted)] ml-2">— how renewables + storage fill the gap</span>
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
        <Link to="/learn/energy-transition" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]">
          ← The Energy Transition in the NEM
        </Link>
        <span className="text-[var(--color-text-muted)]">Lesson {lesson.number} of {LESSONS.length} · {lesson.readingTime}</span>
      </div>

      <div className="space-y-1 pb-4 border-b border-[var(--color-border)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">Lesson {lesson.number}</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] leading-tight">{lesson.title}</h1>
        <p className="text-base italic text-[var(--color-text-muted)]">{lesson.subtitle}</p>
      </div>

      <article className="text-[15px] text-[var(--color-text-muted)]">
        {lesson.id === 'pre-nem'          && <Lesson1 />}
        {lesson.id === 'vic-selloff'      && <Lesson2 />}
        {lesson.id === 'nsw-sa-priv'      && <Lesson3 />}
        {lesson.id === 'qld-wa'           && <Lesson4 />}
        {lesson.id === 'gentailer'        && <Lesson5 />}
        {lesson.id === 'agl-history'      && <Lesson6 />}
        {lesson.id === 'agl-today'        && <Lesson7 />}
        {lesson.id === 'origin'           && <Lesson8 />}
        {lesson.id === 'energy-australia' && <Lesson9 />}
        {lesson.id === 'alinta'           && <Lesson10 />}
        {lesson.id === 'coal-exit'        && <Lesson11 />}
      </article>

      <div className="flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-border)]">
        {prev ? (
          <button onClick={() => navigate(`/learn/energy-transition/${prev.id}`)}
            className="text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text-muted)] transition-colors">
            ← {prev.title}
          </button>
        ) : <span />}
        {next ? (
          <button onClick={() => { onComplete(lesson.id); navigate(`/learn/energy-transition/${next.id}`) }}
            className="text-sm px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-colors">
            {progress.has(lesson.id) ? 'Continue' : 'Mark read & continue'} → {next.title}
          </button>
        ) : (
          <button onClick={() => { onComplete(lesson.id); navigate('/learn/energy-transition') }}
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

export default function EnergyTransitionModule() {
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
        <Link to="/learn/energy-transition" className="text-sm text-[var(--color-primary)] hover:underline mt-2 inline-block">
          ← Back to module index
        </Link>
      </div>
    )
  }

  return <LessonView lesson={lesson} progress={progress} onComplete={onComplete} />
}
