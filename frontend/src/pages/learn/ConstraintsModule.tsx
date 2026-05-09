import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

// ============================================================
// Progress persistence
// ============================================================

const STORAGE_KEY = 'aures-constraints-progress'

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
  { id: 'dispatch-problem', number: 1, title: 'Why Dispatch Is More Than a Bid Stack', subtitle: 'The problem constraints solve', readingTime: '6 min', built: true },
  { id: 'constraint-anatomy', number: 2, title: 'Anatomy of a Constraint Equation', subtitle: 'The LHS / RHS structure', readingTime: '8 min', built: true },
  { id: 'injection-shift-factors', number: 3, title: 'Injection Shift Factors', subtitle: 'Where the numbers come from', readingTime: '8 min', built: true },
  { id: 'constraint-types', number: 4, title: 'Types of Constraints', subtitle: 'Physical phenomena they model', readingTime: '7 min', built: false },
  { id: 'ids-and-sets', number: 5, title: 'Constraint IDs, Sets & Lifecycle', subtitle: 'How constraints get activated and decoded', readingTime: '7 min', built: false },
  { id: 'market-impacts', number: 6, title: 'Market Impacts: Shadow Prices & Congestion', subtitle: 'How binding constraints move spot prices', readingTime: '9 min', built: false },
  { id: 'data-access', number: 7, title: 'Working with Constraint Data', subtitle: 'Practical data access guide', readingTime: '6 min', built: false },
]

// ============================================================
// Shared UI primitives
// ============================================================

function Callout({ type, children }: { type: 'info' | 'warn' | 'key' | 'formula'; children: React.ReactNode }) {
  const styles = {
    info:    { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   label: 'Note' },
    warn:    { bg: 'bg-amber-500/10',  border: 'border-amber-500/30',  text: 'text-amber-400',  label: 'Important' },
    key:     { bg: 'bg-emerald-500/10',border: 'border-emerald-500/30',text: 'text-emerald-400',label: 'Key Concept' },
    formula: { bg: 'bg-slate-800/60',  border: 'border-slate-600/40',  text: 'text-slate-300',  label: 'Formula' },
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

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl p-4 overflow-x-auto my-4">
      <code className="text-sm font-mono text-emerald-400 leading-relaxed whitespace-pre">{children}</code>
    </pre>
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

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
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
                <td key={j} className="p-3 text-xs text-[var(--color-text-muted)] leading-relaxed">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================
// Lesson 1 — Why Dispatch Is More Than a Bid Stack
// ============================================================

function Lesson1() {
  const [showConstrained, setShowConstrained] = useState(false)

  const units = [
    { name: 'Gas A',   bid: 45,  capacity: 200, color: '#f97316' },
    { name: 'Coal',    bid: 30,  capacity: 300, color: '#64748b' },
    { name: 'Wind',    bid: 5,   capacity: 250, color: '#3b82f6' },
    { name: 'Solar',   bid: 0,   capacity: 400, color: '#f59e0b' },
    { name: 'Gas B',   bid: 85,  capacity: 150, color: '#ef4444' },
  ]
  const demand = 700
  const sorted = [...units].sort((a, b) => a.bid - b.bid)

  // Unconstrained: cheapest first up to demand
  let remaining = demand
  const unconstrained = sorted.map(u => {
    const dispatched = Math.min(u.capacity, remaining)
    remaining -= dispatched
    return { ...u, dispatched }
  })

  // Constrained: Solar limited to 150 MW due to network constraint
  const SOLAR_LIMIT = 150
  remaining = demand
  const constrained = sorted.map(u => {
    const cap = u.name === 'Solar' ? Math.min(u.capacity, SOLAR_LIMIT) : u.capacity
    const dispatched = Math.min(cap, remaining)
    remaining -= dispatched
    return { ...u, dispatched, capped: u.name === 'Solar' && u.capacity > SOLAR_LIMIT }
  })

  const display = showConstrained ? constrained : unconstrained
  const marginalUnit = [...display].reverse().find(u => u.dispatched > 0)
  const clearingPrice = marginalUnit ? marginalUnit.bid : 0

  return (
    <div className="space-y-2">
      <P>
        Most people picture electricity dispatch as a simple merit-order stack: generators offer their output at a price,
        the cheapest ones get dispatched first until demand is met, and the most expensive unit needed sets the spot price.
        This is correct as far as it goes — but it misses everything the physical network imposes.
      </P>

      <H2>Security-Constrained Economic Dispatch</H2>
      <P>
        AEMO's dispatch engine — NEMDE (National Electricity Market Dispatch Engine) — doesn't just find the cheapest
        combination of generation to meet demand. It finds the cheapest combination that also keeps the physical power
        system within safe operating limits. This is called <strong className="text-[var(--color-text)]">Security-Constrained Economic Dispatch (SCED)</strong>.
      </P>
      <P>
        SCED is a linear programming optimisation. Every 5 minutes it solves a problem with roughly:
      </P>
      <ul className="text-sm text-[var(--color-text-muted)] space-y-1 ml-4 mb-4 list-disc">
        <li>~300 decision variables (scheduled generator dispatch targets)</li>
        <li>~600–1,000 constraint equations (physical network limits)</li>
        <li>1 objective function (minimise total dispatch cost)</li>
      </ul>
      <P>
        The constraints are what make SCED different from a simple bid stack. Without them, NEMDE might dispatch a
        generator at full output even though doing so would overload a transmission line — causing real physical damage
        and potentially a cascading blackout.
      </P>

      <H2>What Happens Without Constraints?</H2>
      <P>
        When more power flows through a transmission line than its thermal rating allows, the conductor heats up. If the
        overload persists, the conductor sags, potentially touching vegetation or structures below. Protection systems
        then trip the line — suddenly removing a large amount of transfer capacity. The generators on the export side
        now have nowhere to send their power, and the load on the import side faces a shortfall. Other lines pick up the
        load, potentially overloading themselves in turn. This is <strong className="text-[var(--color-text)]">cascading failure</strong> — and it's how large-scale blackouts begin.
      </P>
      <P>
        Voltage stability and transient stability failures can happen even faster — some in under a second. Constraints
        prevent NEMDE from ever finding a dispatch solution that puts the system in a position where these failures
        could occur.
      </P>

      <H2>Interactive: Bid Stack vs Constrained Dispatch</H2>
      <P>
        The example below shows a simplified 5-unit system with 700 MW of demand. Toggle between unconstrained merit
        order and constrained dispatch (a network constraint limits solar output to 150 MW).
      </P>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 my-4">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowConstrained(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!showConstrained ? 'bg-blue-600 text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}
          >
            Merit Order (no constraints)
          </button>
          <button
            onClick={() => setShowConstrained(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showConstrained ? 'bg-amber-600 text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}
          >
            Constrained Dispatch (solar capped)
          </button>
        </div>

        <div className="space-y-2">
          {display.map((u) => {
            const pct = (u.dispatched / u.capacity) * 100
            const isMarginal = u.name === marginalUnit?.name
            return (
              <div key={u.name} className="flex items-center gap-3">
                <div className="w-16 text-xs text-[var(--color-text-muted)] text-right shrink-0">{u.name}</div>
                <div className="flex-1 bg-[var(--color-bg-elevated)] rounded h-7 overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${(u.dispatched / 400) * 100}%`, backgroundColor: u.color, opacity: 0.85 }}
                  />
                  {'capped' in u && u.capped && (
                    <div
                      className="absolute top-0 h-full border-r-2 border-amber-400 border-dashed"
                      style={{ left: `${(SOLAR_LIMIT / 400) * 100}%` }}
                    />
                  )}
                </div>
                <div className="w-24 text-xs text-right shrink-0">
                  <span className="text-[var(--color-text)]">{u.dispatched} MW</span>
                  <span className="text-[var(--color-text-muted)] ml-1">@ ${u.bid}</span>
                </div>
                {isMarginal && (
                  <span className="text-[10px] font-semibold text-amber-400 shrink-0">← sets price</span>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-wrap gap-4 text-xs">
          <span className="text-[var(--color-text-muted)]">Clearing price: <strong className="text-[var(--color-text)]">${clearingPrice}/MWh</strong></span>
          <span className="text-[var(--color-text-muted)]">Demand: <strong className="text-[var(--color-text)]">700 MW</strong></span>
          {showConstrained && (
            <span className="text-amber-400 font-medium">Solar network constraint: 150 MW limit on this corridor</span>
          )}
        </div>

        {showConstrained && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-[var(--color-text-muted)]">
            With the solar corridor constrained to 150 MW, NEMDE must dispatch the expensive Gas B unit to meet demand.
            The clearing price rises from <strong className="text-amber-400">${unconstrained.find(u => [...unconstrained].reverse().find(v => v.dispatched > 0)?.name === u.name)?.bid ?? 45}/MWh to ${clearingPrice}/MWh</strong> —
            not because fuel costs changed, but because a physical network limit prevents the cheapest generation from reaching the load.
          </div>
        )}
      </div>

      <H2>The Scale of Real NEM Dispatch</H2>
      <P>
        The simple 5-unit example above had one constraint. The real NEM runs with{' '}
        <strong className="text-[var(--color-text)]">600–1,000 active constraint equations</strong> in every 5-minute dispatch
        interval. Each one represents a real physical limit somewhere on the 40,000+ km of transmission network.
        NEMDE solves this constrained optimisation in under 30 seconds, every 5 minutes, 24/7.
      </P>

      <Callout type="key">
        A constraint equation tells NEMDE: "the weighted sum of these generators' outputs must not exceed this limit."
        NEMDE finds the least-cost dispatch that satisfies all constraints simultaneously — this is what makes NEM
        dispatch far more complex than a simple merit-order bid stack.
      </Callout>

      <H2>Key Terms Introduced</H2>
      <Table
        headers={['Term', 'Meaning']}
        rows={[
          ['SCED', 'Security-Constrained Economic Dispatch — the optimisation NEMDE solves every 5 minutes'],
          ['NEMDE', 'National Electricity Market Dispatch Engine — AEMO\'s dispatch software'],
          ['Constraint equation', 'A linear inequality/equality that limits generator dispatch to keep the network safe'],
          ['Binding constraint', 'A constraint where the limit is actually reached — LHS equals RHS'],
          ['Marginal value', 'The shadow price of a binding constraint — how much dispatch cost changes per 1 MW relaxation'],
        ]}
      />
    </div>
  )
}

// ============================================================
// Lesson 2 — Anatomy of a Constraint Equation
// ============================================================

function Lesson2() {
  const [highlightRow, setHighlightRow] = useState<number | null>(null)

  const x5Terms = [
    { duid: 'LKBONNY1', name: 'Limondale 1 SF', cap: 220, factor: 1.000 },
    { duid: 'LKBONNY2', name: 'Limondale 2 SF', cap: 29,  factor: 1.000 },
    { duid: 'COPPABELLA1', name: 'Coppabella SF', cap: 115, factor: 0.952 },
    { duid: 'DARLINGTON1', name: 'Darlington Point SF', cap: 200, factor: 0.891 },
    { duid: 'TRANGIE1',  name: 'Trangie SF',    cap: 85,  factor: 0.743 },
    { duid: 'WHITROCK1', name: 'White Rock Wind', cap: 175, factor: 0.612 },
  ]
  const rhs = 630

  const exampleDispatch = [220, 29, 80, 140, 50, 120]
  const lhsValue = x5Terms.reduce((sum, t, i) => sum + t.factor * exampleDispatch[i], 0)
  const isBinding = lhsValue >= rhs * 0.99

  return (
    <div className="space-y-2">
      <P>
        Every constraint equation in the NEM follows the same mathematical structure. Once you can read one,
        you can read all of them — and understand exactly what physical limit is being enforced and which generators
        are contributing to it.
      </P>

      <H2>The General Form</H2>
      <Callout type="formula">
        <code className="font-mono text-emerald-400">
          F₁ × Q₁ + F₂ × Q₂ + … + Fₙ × Qₙ  ≤  RHS
        </code>
        <div className="mt-2 text-xs text-[var(--color-text-muted)] space-y-1">
          <div><span className="text-emerald-400">Fᵢ</span> = LHS factor (sensitivity coefficient — how much unit i contributes to the monitored element's flow)</div>
          <div><span className="text-emerald-400">Qᵢ</span> = dispatch quantity for unit i (MW of generation, interconnector flow, or FCAS enablement)</div>
          <div><span className="text-emerald-400">RHS</span> = the physical limit (line rating, stability limit, or dynamic SCADA value) — fixed for each dispatch interval</div>
        </div>
      </Callout>

      <P>
        The left-hand side (LHS) is a weighted sum of things NEMDE can control. The right-hand side (RHS) is a
        pre-calculated limit that NEMDE treats as fixed. NEMDE must find dispatch quantities{' '}
        <Code>Q₁…Qₙ</Code> such that this inequality (or equality) holds for every active constraint.
      </P>

      <H2>What Goes on the LHS?</H2>
      <P>Any entity whose output NEMDE controls can appear on the LHS:</P>
      <ul className="text-sm text-[var(--color-text-muted)] space-y-1 ml-4 mb-4 list-disc">
        <li><strong className="text-[var(--color-text)]">Scheduled and semi-scheduled generators</strong> — identified by DUID</li>
        <li><strong className="text-[var(--color-text)]">Scheduled loads</strong> and Wholesale Demand Response units</li>
        <li><strong className="text-[var(--color-text)]">Interconnectors</strong> (Heywood, QNI, VNI, Basslink, Murraylink)</li>
        <li><strong className="text-[var(--color-text)]">FCAS providers</strong> — separate terms for raise/lower ancillary services</li>
        <li><strong className="text-[var(--color-text)]">Regional net load</strong> — for regional surplus/deficit constraints</li>
      </ul>
      <P>
        Only entities with a factor ≥ 0.07 must appear on the LHS. Smaller factors are excluded as they have
        negligible influence on the monitored element's flow.
      </P>

      <H2>What Goes on the RHS?</H2>
      <P>The RHS is a single number for each dispatch interval, but it can be calculated in complex ways:</P>
      <Table
        headers={['RHS Source', 'Example', 'When Used']}
        rows={[
          ['Static line rating', '630 MW', 'Thermal limit from TNSP — same every interval'],
          ['Dynamic line rating', 'Varies with temperature/wind', 'Weather-dependent conductor cooling'],
          ['SCADA measurement', 'Actual metered flow from start of interval', '"Feedback constraints" — includes initial conditions'],
          ['Stability limit', 'Output of offline security studies', 'Voltage collapse, transient stability, oscillatory stability'],
          ['RPN expression', 'Complex formula combining multiple inputs', 'Constraints with multiple contributing factors in RHS'],
        ]}
      />
      <P>
        The RHS uses a <strong className="text-[var(--color-text)]">Reverse Polish Notation (RPN)</strong> calculation engine inside NEMDE.
        This allows arbitrarily complex expressions — for example, RHS = line rating minus existing metered flow on
        a parallel line. AEMO's <Code>GENERICCONSTRAINTRHS</Code> table stores these RPN terms.
      </P>

      <H2>The Three Operators</H2>
      <Table
        headers={['Operator', 'Meaning', 'Example Use']}
        rows={[
          ['≤ (LE)', 'LHS must not exceed RHS', 'Thermal limit — combined output must stay below line rating'],
          ['≥ (GE)', 'LHS must not fall below RHS', 'Minimum generation constraint — e.g. must run at least X MW for voltage support'],
          ['= (EQ)', 'LHS must exactly equal RHS', 'Equality constraint — rare, used for specific balancing requirements'],
        ]}
      />

      <H2>The Five MMS Tables</H2>
      <P>
        A constraint equation is not a single record — it's spread across five database tables in AEMO's Market
        Management System (MMS), each holding a different part of the definition:
      </P>
      <Table
        headers={['Table', 'Contents']}
        rows={[
          [<Code key="1">GENCONDATA</Code>, 'Master record: constraint ID, operator (≤/≥/=), type (THERMAL/VOLTAGE/STABILITY), which processes use it (DISPATCH/PREDISPATCH/ST PASA/MT PASA)'],
          [<Code key="2">SPDCONNECTIONPOINTCONSTRAINT</Code>, 'LHS factors for generators and loads, keyed by DUID + constraint ID + effective date'],
          [<Code key="3">SPDINTERCONNECTORCONSTRAINT</Code>, 'LHS factors for interconnectors'],
          [<Code key="4">SPDREGIONCONSTRAINT</Code>, 'LHS factors for regions (regional demand-type constraints)'],
          [<Code key="5">GENERICCONSTRAINTRHS</Code>, 'RHS calculation terms using RPN notation. Different scope (DS/PD/ST/MT) allows different limits for dispatch vs planning'],
        ]}
      />

      <H2>Interactive: The X5 Constraint (N^^N_NIL_3)</H2>
      <P>
        The N^^N_NIL_3 constraint — informally called the "X5 constraint" — limits combined output from a group of
        solar farms in southwest NSW to protect against voltage collapse following a contingency. Hover any row to
        see that unit's contribution to the LHS sum.
      </P>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 my-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[var(--color-text)]">N^^N_NIL_3 — SW NSW Voltage Stability</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isBinding ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isBinding ? 'BINDING' : 'NOT BINDING'}
          </span>
        </div>

        <div className="font-mono text-xs mb-3 text-[var(--color-text-muted)] flex flex-wrap gap-1 items-center">
          {x5Terms.map((t, i) => (
            <span key={t.duid}>
              <span
                className={`px-1 rounded cursor-pointer transition-colors ${highlightRow === i ? 'bg-blue-500/30 text-blue-300' : 'hover:bg-blue-500/10 text-[var(--color-text)]'}`}
                onMouseEnter={() => setHighlightRow(i)}
                onMouseLeave={() => setHighlightRow(null)}
              >
                {t.factor.toFixed(3)} × {exampleDispatch[i]}
              </span>
              {i < x5Terms.length - 1 && <span className="text-[var(--color-text-muted)]"> + </span>}
            </span>
          ))}
          <span className="text-[var(--color-text-muted)]"> ≤ </span>
          <span className="text-amber-400 font-bold">{rhs}</span>
        </div>

        <div className="space-y-1.5">
          {x5Terms.map((t, i) => {
            const contribution = t.factor * exampleDispatch[i]
            const pct = (contribution / rhs) * 100
            const isHl = highlightRow === i
            return (
              <div
                key={t.duid}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${isHl ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-[var(--color-bg-elevated)]/50'}`}
                onMouseEnter={() => setHighlightRow(i)}
                onMouseLeave={() => setHighlightRow(null)}
              >
                <div className="w-32 shrink-0">
                  <p className="text-[11px] font-medium text-[var(--color-text)] truncate">{t.name}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">{t.duid} · {t.cap} MW</p>
                </div>
                <div className="w-14 text-right shrink-0 text-[11px] text-blue-400 font-mono">×{t.factor.toFixed(3)}</div>
                <div className="flex-1 bg-[var(--color-bg-elevated)] rounded h-4 overflow-hidden">
                  <div className="h-full bg-blue-500/60 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="w-20 text-right text-[11px] text-[var(--color-text-muted)] shrink-0">
                  {contribution.toFixed(1)} MW
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs">
          <span className="text-[var(--color-text-muted)]">
            LHS sum: <strong className="text-[var(--color-text)]">{lhsValue.toFixed(1)} MW</strong>
          </span>
          <span className="text-[var(--color-text-muted)]">
            RHS limit: <strong className="text-amber-400">{rhs} MW</strong>
          </span>
          <span className="text-[var(--color-text-muted)]">
            Headroom: <strong className={lhsValue < rhs ? 'text-emerald-400' : 'text-red-400'}>{(rhs - lhsValue).toFixed(1)} MW</strong>
          </span>
        </div>

        <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic">
          Example dispatch values for illustration. Real values change every 5-minute interval.
        </p>
      </div>

      <Callout type="key">
        The LHS factor (0.743 for Trangie, 1.000 for Limondale) represents how much of each generator's 1 MW
        output reaches the monitored transmission element. A factor of 1.0 means every MW produced flows through
        that element; 0.743 means 74.3% does. These are called <strong>Injection Shift Factors (ISFs)</strong> —
        covered in detail in Lesson 3.
      </Callout>

      <H2>The 0.07 Threshold</H2>
      <P>
        Any generator with an ISF below 0.07 is excluded from the LHS — their influence on the monitored element
        is too small to justify the complexity of including them. In December 2025 AEMO raised this threshold
        (previously lower) as part of ongoing constraint equation maintenance. If all LHS factors are very small,
        the entire equation is rescaled so that the largest absolute factor equals 1.0, with a maximum scaling
        factor of 30.
      </P>
    </div>
  )
}

// ============================================================
// Lesson 3 — Injection Shift Factors
// ============================================================

function Lesson3() {
  const [injection, setInjection] = useState(100)
  const [showPostCont, setShowPostCont] = useState(false)

  // 4-bus network: A—B—C—D in a loop, with a cross-link B—D
  // Line impedances (p.u.): AB=0.2, BC=0.3, CD=0.2, AD=0.4, BD=0.25
  // DC power flow gives ISFs relative to bus D (RRN)
  // Pre-contingency ISFs for injection at bus A (relative to D):
  //   Line AB: 0.71  Line BC: 0.43  Line AD: 0.29  Line BD: 0.28  Line CD: 0.43
  // Post-contingency (line BD removed):
  //   Line AB: 0.83  Line BC: 0.52  Line AD: 0.17  Line CD: 0.52

  const lines = showPostCont
    ? [
        { name: 'Line A–B', from: 'A', to: 'B', isf: 0.83, x: 50,  y: 80,  x2: 230, y2: 80  },
        { name: 'Line B–C', from: 'B', to: 'C', isf: 0.52, x: 230, y: 80,  x2: 340, y2: 200 },
        { name: 'Line C–D', from: 'C', to: 'D', isf: 0.52, x: 340, y: 200, x2: 140, y2: 200 },
        { name: 'Line A–D', from: 'A', to: 'D', isf: 0.17, x: 50,  y: 80,  x2: 140, y2: 200 },
      ]
    : [
        { name: 'Line A–B', from: 'A', to: 'B', isf: 0.71, x: 50,  y: 80,  x2: 230, y2: 80  },
        { name: 'Line B–C', from: 'B', to: 'C', isf: 0.43, x: 230, y: 80,  x2: 340, y2: 200 },
        { name: 'Line C–D', from: 'C', to: 'D', isf: 0.43, x: 340, y: 200, x2: 140, y2: 200 },
        { name: 'Line A–D', from: 'A', to: 'D', isf: 0.29, x: 50,  y: 80,  x2: 140, y2: 200 },
        { name: 'Line B–D', from: 'B', to: 'D', isf: 0.28, x: 230, y: 80,  x2: 140, y2: 200 },
      ]

  const buses = [
    { id: 'A', label: 'Bus A\n(Generator)', x: 50,  y: 80,  color: '#3b82f6' },
    { id: 'B', label: 'Bus B',               x: 230, y: 80,  color: '#64748b' },
    { id: 'C', label: 'Bus C',               x: 340, y: 200, color: '#64748b' },
    { id: 'D', label: 'Bus D\n(RRN)',         x: 140, y: 200, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-2">
      <P>
        In Lesson 2, we saw that every LHS term has a factor — a number like 0.891 or 1.000. These factors don't
        come from nowhere. They are calculated from a power flow model of the transmission network, and are called
        <strong className="text-[var(--color-text)]"> Injection Shift Factors (ISFs)</strong> — or sometimes
        Generation Shift Factors or Power Transfer Distribution Factors (PTDFs).
      </P>

      <H2>What an ISF Measures</H2>
      <Callout type="formula">
        <code className="font-mono text-emerald-400">
          ISF(line ℓ, bus k) = ΔFlow(line ℓ) / ΔInjection(bus k)
        </code>
        <div className="mt-2 text-xs text-[var(--color-text-muted)]">
          The fraction of a 1 MW injection at bus k that flows through line ℓ.
          Relative to the Regional Reference Node (RRN) as the swing bus.
        </div>
      </Callout>

      <P>
        If a generator at bus A injects 1 MW and 0.71 MW of that flows through line A–B, then the ISF for
        (line A–B, bus A) is 0.71. This is the number that goes into the LHS of a constraint equation monitoring
        line A–B — for any generator connected at bus A.
      </P>

      <H2>The Swing Bus: Why the RRN Has ISF = 0</H2>
      <P>
        Every ISF is computed relative to a reference bus — the Regional Reference Node (RRN). The RRN is the
        "swing bus" in the DC power flow: it absorbs any imbalance. By definition, injecting 1 MW at the RRN
        causes zero additional flow on any line — all the power stays at the reference point. So any generator
        located at the RRN has LHS factor = 0 and does not appear in constraint equations.
      </P>
      <P>
        NEM RRNs: <Code>NSW1</Code> = Sydney West 330 kV, <Code>VIC1</Code> = Thomastown 66 kV,{' '}
        <Code>QLD1</Code> = South Pine 275 kV, <Code>SA1</Code> = Torrens Island 275 kV,{' '}
        <Code>TAS1</Code> = George Town 220 kV.
      </P>

      <H2>Why DC Power Flow?</H2>
      <P>
        The actual power system uses AC (alternating current), which means the full power flow equations are
        non-linear — they can't be used directly in a linear programme. AEMO uses a linearised DC power flow
        approximation that makes two simplifications:
      </P>
      <ul className="text-sm text-[var(--color-text-muted)] space-y-1 ml-4 mb-4 list-disc">
        <li>Voltage magnitudes are assumed constant (1.0 per unit throughout)</li>
        <li>Voltage angle differences are assumed small (so sin(θ) ≈ θ)</li>
      </ul>
      <P>
        Under these assumptions, real power flows become linear functions of nodal injections — exactly what you
        need for a linear programme. The DC approximation is accurate enough for constraint formulation while
        remaining computationally tractable.
      </P>

      <H2>Meshed Networks: Why ISF ≠ 1</H2>
      <P>
        In a <strong className="text-[var(--color-text)]">radial network</strong> (a simple chain of buses with no
        loops), every MW from a generator flows along the single path to load. The ISF for every line on that path
        is exactly 1.0.
      </P>
      <P>
        In a <strong className="text-[var(--color-text)]">meshed network</strong> (loops, parallel paths), power
        follows the path of least resistance. A 1 MW injection splits across multiple parallel routes according to
        their impedances. The ISF for each line reflects only its share of the flow — so ISFs are typically less
        than 1.0 in meshed networks.
      </P>

      <H2>Interactive: 4-Bus Network</H2>
      <P>
        The diagram below shows a simplified 4-bus meshed network. Bus A is the generator (injection point);
        Bus D is the RRN (swing bus). Use the slider to set the injection and see how 1 MW splits across the
        network. Toggle to see how ISFs change when line B–D is lost (post-contingency).
      </P>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 my-4">
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)]">Injection at A:</span>
            <input
              type="range" min={10} max={200} step={10} value={injection}
              onChange={e => setInjection(Number(e.target.value))}
              className="w-28 accent-blue-500"
            />
            <span className="text-xs font-mono text-blue-400 w-16">{injection} MW</span>
          </div>
          <button
            onClick={() => setShowPostCont(v => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showPostCont ? 'bg-red-600/80 text-white' : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]'}`}
          >
            {showPostCont ? '⚡ Line B–D tripped (N-1)' : 'Trip Line B–D (N-1 contingency)'}
          </button>
        </div>

        {/* Network diagram */}
        <div className="relative mb-4" style={{ height: 280 }}>
          <svg width="100%" height="280" viewBox="0 0 420 280" className="overflow-visible">
            {/* Lines */}
            {lines.map(l => {
              const flow = l.isf * injection
              const thick = 1 + (l.isf * 4)
              return (
                <g key={l.name}>
                  <line x1={l.x} y1={l.y} x2={l.x2} y2={l.y2}
                    stroke="#1e40af" strokeWidth={thick} opacity={0.6} />
                  <text
                    x={(l.x + l.x2) / 2 + 8} y={(l.y + l.y2) / 2 - 6}
                    fontSize="10" fill="#94a3b8" textAnchor="middle"
                  >
                    {flow.toFixed(0)} MW
                  </text>
                  <text
                    x={(l.x + l.x2) / 2 + 8} y={(l.y + l.y2) / 2 + 8}
                    fontSize="9" fill="#475569" textAnchor="middle"
                  >
                    (ISF={l.isf.toFixed(2)})
                  </text>
                </g>
              )
            })}
            {/* Buses */}
            {buses.map(b => (
              <g key={b.id}>
                <circle cx={b.x} cy={b.y} r={22} fill={`${b.color}30`} stroke={b.color} strokeWidth={1.5} />
                <text x={b.x} y={b.y + 4} fontSize="13" fontWeight="700" fill={b.color} textAnchor="middle">{b.id}</text>
              </g>
            ))}
            <text x={50} y={112} fontSize="9" fill="#94a3b8" textAnchor="middle">Generator</text>
            <text x={140} y={232} fontSize="9" fill="#f59e0b" textAnchor="middle">RRN (swing)</text>
          </svg>
        </div>

        {/* ISF table */}
        <div className="space-y-1.5">
          {lines.map(l => {
            const flow = l.isf * injection
            const pct = l.isf * 100
            return (
              <div key={l.name} className="flex items-center gap-2">
                <div className="w-20 text-[11px] text-[var(--color-text-muted)] shrink-0">{l.name}</div>
                <div className="w-12 text-right text-[11px] font-mono text-blue-400 shrink-0">ISF={l.isf.toFixed(2)}</div>
                <div className="flex-1 bg-[var(--color-bg-elevated)] rounded h-4 overflow-hidden">
                  <div className="h-full bg-blue-500/60 transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
                <div className="w-16 text-right text-[11px] text-[var(--color-text)] shrink-0">{flow.toFixed(1)} MW</div>
              </div>
            )
          })}
        </div>

        {showPostCont && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-[var(--color-text-muted)]">
            With line B–D removed, power redistributes across the remaining lines. Line A–B's ISF
            rises from 0.71 to 0.83 — generators at bus A now have a larger LHS factor in any constraint
            monitoring line A–B. The constraint RHS may also need adjusting for the new thermal limit of the
            remaining circuit.
          </div>
        )}
        <p className="text-[10px] text-[var(--color-text-muted)] mt-2 italic">
          Simplified 4-bus example using DC power flow principles. Real NEM networks have hundreds of buses.
        </p>
      </div>

      <H2>Post-Contingency ISFs</H2>
      <P>
        Most NEM constraints are <strong className="text-[var(--color-text)]">N-1 security constraints</strong>:
        they protect against the loss of a single network element (a line, transformer, or generator) while keeping
        the system in a safe state. The ISFs in these constraints are computed on the{' '}
        <strong className="text-[var(--color-text)]">post-contingency network</strong> — the network topology after
        the worst credible fault has been removed.
      </P>
      <P>
        Process: (1) Switch out the contingent element in the power flow model. (2) Solve the post-contingency
        power flow. (3) Compute sensitivities of the monitored line's post-contingency flow to generator injections.
        (4) These sensitivities become the constraint's LHS factors.
      </P>
      <P>
        This is why the same generator can have different LHS factors in different constraint equations — each
        constraint models a different post-contingency network topology.
      </P>

      <Callout type="key">
        ISFs are the bridge between the physical network (impedances, topology) and the dispatch optimisation
        (linear equations). They convert a complex non-linear power flow problem into the linear constraint
        format that NEMDE can solve in seconds.
      </Callout>

      <H2>Minimum ISF Threshold</H2>
      <P>
        Any generator with <Code>|ISF| &lt; 0.07</Code> is excluded from the LHS — their influence is too
        small to meaningfully constrain. This threshold was raised in December 2025 as part of AEMO's ongoing
        constraint maintenance. After filtering, if all remaining factors are very small, the whole equation
        is normalised by multiplying both LHS and RHS by a scalar so the largest factor equals 1.0 (maximum
        scaling factor: 30).
      </P>
    </div>
  )
}

// ============================================================
// Lesson 4–7 Coming Soon
// ============================================================

function ComingSoon({ lesson }: { lesson: LessonMeta }) {
  const topics: Record<string, string[]> = {
    'constraint-types': [
      'Thermal limits — static vs dynamic line ratings, N-1 post-contingency thermal',
      'Voltage stability (^^) — N-1 voltage collapse limits',
      'Transient stability (::) — rotor angle following a fault',
      'Oscillatory stability — inter-area oscillation modes, ≥5% damping requirement',
      'System strength / fault level — IBR penetration, SCR, SA islanding constraint',
      'FCAS sufficiency constraints — D_ and F_ prefix equations',
    ],
    'ids-and-sets': [
      'Decoding constraint IDs: state prefix, type operator, NIL vs outage-specific',
      'Worked decodes: N^^N_NIL_3, Q^^TR_CLHA_-600, V_NWVIC_GFT1_750, N-DPWG_63_X5',
      'Constraint sets: why equations are grouped and invoked together',
      'The Network Outage Schedule and outage-specific constraint sets',
      'Pre-dispatch vs dispatch RHS: DS / PD / ST / MT scope',
      'The RPN calculation engine for complex RHS expressions',
      'Interactive: Constraint ID decoder',
    ],
    'market-impacts': [
      'What "binding" means: LHS = RHS, marginal value ≠ 0',
      'Shadow price (marginal value): λ = ∂(dispatch cost) / ∂(RHS)',
      'Regional price separation from binding interconnector constraints',
      'Congestion rent calculation',
      'CVP factors: priority order for constraint violations',
      'Case study: X5 constraint — SW NSW solar curtailment',
      'Case study: SA islanding 2020 — Heywood trip, $90M+ FCAS bill',
      'Case study: Opaque congestion (Jun 2024) — N-DPWG_63_X5 hidden curtailment',
    ],
    'data-access': [
      'AEMO Congestion Information Resource (CIR)',
      'NEMweb MMS Archive — GENCONDATA, SPD tables, GENERICCONSTRAINTRHS',
      'NEMOSIS Python: dynamic_data_compiler() for DISPATCHCONSTRAINT',
      'Julius Susanto\'s NEM_constraints library',
      'AEMO MMS Data Model Report — column-level documentation',
      'AEMO Monthly Constraint Reports',
      'Interactive: Constraint lookup panel using AURES data',
    ],
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] border-dashed rounded-xl p-8 text-center">
        <p className="text-3xl mb-3">🔨</p>
        <p className="text-sm font-semibold text-[var(--color-text)] mb-1">Lesson {lesson.number} is being built</p>
        <p className="text-xs text-[var(--color-text-muted)]">Content and interactive components coming soon</p>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <p className="text-xs font-semibold text-[var(--color-text)] mb-3">This lesson will cover:</p>
        <ul className="space-y-2">
          {(topics[lesson.id] || []).map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
              <span className="text-[var(--color-primary)] mt-0.5 shrink-0">→</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ============================================================
// Lesson Shell — navigation wrapper
// ============================================================

function LessonShell({ lesson, progress, onComplete }: {
  lesson: LessonMeta
  progress: Set<string>
  onComplete: (id: string) => void
}) {
  const navigate = useNavigate()
  const isComplete = progress.has(lesson.id)
  const currentIndex = LESSONS.findIndex(l => l.id === lesson.id)
  const prev = currentIndex > 0 ? LESSONS[currentIndex - 1] : null
  const next = currentIndex < LESSONS.length - 1 ? LESSONS[currentIndex + 1] : null

  const ContentComponent = {
    'dispatch-problem': Lesson1,
    'constraint-anatomy': Lesson2,
    'injection-shift-factors': Lesson3,
  }[lesson.id]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-xs text-[var(--color-text-muted)]">
        <Link to="/learn/constraints" className="hover:text-[var(--color-primary)] transition-colors">
          ← Constraints Module
        </Link>
        <span>/</span>
        <span>Lesson {lesson.number}</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
            Lesson {lesson.number} of {LESSONS.length}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)]">{lesson.readingTime}</span>
          {isComplete && (
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              ✓ Complete
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">{lesson.title}</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{lesson.subtitle}</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-6">
        {LESSONS.map((l, i) => (
          <div
            key={l.id}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < currentIndex ? 'bg-emerald-500' :
              i === currentIndex ? 'bg-[var(--color-primary)]' :
              'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      {ContentComponent ? <ContentComponent /> : <ComingSoon lesson={lesson} />}

      {/* Mark complete + navigation */}
      <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center gap-3">
        {!isComplete && lesson.built && (
          <button
            onClick={() => onComplete(lesson.id)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
          >
            ✓ Mark as complete
          </button>
        )}
        <div className="flex gap-2 sm:ml-auto">
          {prev && (
            <button
              onClick={() => navigate(`/learn/constraints/${prev.id}`)}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              ← Lesson {prev.number}
            </button>
          )}
          {next && (
            <button
              onClick={() => { onComplete(lesson.id); navigate(`/learn/constraints/${next.id}`) }}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
            >
              Lesson {next.number} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Module Index
// ============================================================

function ModuleIndex({ progress }: { progress: Set<string> }) {
  const completed = LESSONS.filter(l => progress.has(l.id)).length
  const pct = Math.round((completed / LESSONS.length) * 100)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link to="/guides" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
          ← Guides & Documentation
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">⚡</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
            Learning Module
          </span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          Network Constraints in the NEM
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 leading-relaxed">
          From physics to price — a 7-lesson module explaining how transmission constraints work,
          how AEMO models them, and how binding constraints move spot prices. Pitched at the
          practitioner level with real constraint IDs and MMS data throughout.
        </p>
      </div>

      {/* Progress */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">Your progress</span>
          <span className="text-xs font-semibold text-[var(--color-text)]">{completed} / {LESSONS.length} lessons</span>
        </div>
        <div className="h-2 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        {completed === LESSONS.length && (
          <p className="text-xs text-emerald-400 mt-2 font-medium">🎉 Module complete!</p>
        )}
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {LESSONS.map((lesson) => {
          const isDone = progress.has(lesson.id)
          return (
            <Link
              key={lesson.id}
              to={lesson.built ? `/learn/constraints/${lesson.id}` : '#'}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                lesson.built
                  ? 'bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/30 active:scale-[0.99]'
                  : 'bg-[var(--color-bg-card)]/50 border-[var(--color-border)]/50 cursor-default opacity-60'
              }`}
              onClick={e => !lesson.built && e.preventDefault()}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
                isDone ? 'bg-emerald-500/20 text-emerald-400' :
                lesson.built ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' :
                'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]'
              }`}>
                {isDone ? '✓' : lesson.number}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[var(--color-text)]">{lesson.title}</p>
                  {!lesson.built && (
                    <span className="text-[10px] font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 rounded">
                      Coming soon
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{lesson.subtitle}</p>
              </div>
              <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">{lesson.readingTime}</span>
            </Link>
          )
        })}
      </div>

      {/* Data source note */}
      <div className="mt-6 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">Sources</p>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
          Content drawn from AEMO's Constraint Formulation Guidelines, Constraint Naming Guidelines, Congestion Information
          Resource, and MMS Data Model documentation. Case studies sourced from WattClarity analysis. Interactive examples
          use simplified but mathematically accurate models of real constraint equations (X5 / N^^N_NIL_3) and DC power flow.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Module root — routes /learn/constraints and /learn/constraints/:lessonId
// ============================================================

export default function ConstraintsModule() {
  const { lessonId } = useParams<{ lessonId?: string }>()
  const [progress, setProgress] = useState<Set<string>>(() => loadProgress())

  const markComplete = useCallback((id: string) => {
    setProgress(prev => {
      const next = new Set(prev)
      next.add(id)
      saveProgress(next)
      return next
    })
  }, [])

  if (!lessonId) {
    return <ModuleIndex progress={progress} />
  }

  const lesson = LESSONS.find(l => l.id === lessonId)
  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] px-4 text-center">
        <span className="text-5xl mb-4">🔍</span>
        <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">Lesson not found</h1>
        <Link to="/learn/constraints" className="text-sm text-[var(--color-primary)] hover:underline">
          ← Back to module
        </Link>
      </div>
    )
  }

  return <LessonShell lesson={lesson} progress={progress} onComplete={markComplete} />
}
