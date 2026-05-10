/**
 * CIS & LTESA Scheme Intelligence — PowerPoint export
 *
 * Generates an executive briefing deck from the scheme-tracker.json data.
 *
 * Slides:
 *   1. Title
 *   2. Scheme overview (CIS + LTESA totals)
 *   3. CIS rounds detail table
 *   4. LTESA rounds detail table
 *   5. Outcomes — delivering vs at-risk
 *   6. NSW Wind in CIS — pipeline & status
 *   7. NSW Wind in LTESA — pipeline & status
 *   8. AURES outlook — next 6 months
 *   9. Methodology & sources
 */
import PptxGenJS from 'pptxgenjs'
import type { SchemeTrackerData, SchemeTrackerRound, SchemeTrackerProject } from './types'

// ============================================================
// Brand palette
// ============================================================

const COLOR = {
  bg:        'FFFFFF',
  text:      '0F172A',     // slate-900
  textMuted: '475569',     // slate-600
  textLight: '94A3B8',     // slate-400
  border:    'E2E8F0',     // slate-200
  primary:   '0369A1',     // sky-700
  cis:       '3B82F6',     // blue-500
  ltesa:     'A855F7',     // purple-500
  green:     '16A34A',     // emerald — delivering
  amber:     'D97706',     // amber — under construction / development
  red:       'DC2626',     // red — likely failed
  blue:      '2563EB',
  // grade chip backgrounds
  goodBg:    'DCFCE7',
  okBg:      'DBEAFE',
  warnBg:    'FEF3C7',
  badBg:     'FEE2E2',
} as const

const FONT = 'Calibri'

// ============================================================
// Helpers
// ============================================================

const fmtMW = (v: number | null | undefined) =>
  v == null ? '–' : v >= 1000 ? `${(v / 1000).toFixed(2)} GW` : `${Math.round(v)} MW`

const fmtMWh = (v: number | null | undefined) =>
  v == null || v === 0 ? '–' : v >= 1000 ? `${(v / 1000).toFixed(2)} GWh` : `${Math.round(v)} MWh`

const fmtDate = (s: string | null | undefined) => {
  if (!s) return '–'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
}

const monthsSince = (s: string | null | undefined): number | null => {
  if (!s) return null
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
}

// Project bucket — "delivered" vs "in construction" vs "development" vs "likely failed"
type Bucket = 'delivering' | 'building' | 'developing' | 'at_risk' | 'unknown'
function bucket(p: SchemeTrackerProject, monthsSinceAnnounced: number, threshold: number): Bucket {
  const stage = p.stage as string
  if (stage === 'operating' || stage === 'commissioning') return 'delivering'
  if (stage === 'construction') return 'building'
  if (monthsSinceAnnounced > threshold) {
    const ds = (p.dev_status || '').toLowerCase()
    // FID reached or construction implies definitely active — not at risk
    if (ds.includes('fid') || ds.includes('construction')) return 'building'
    return 'at_risk'
  }
  return 'developing'
}

// ============================================================
// Slide layout helpers
// ============================================================

type Slide = ReturnType<PptxGenJS['addSlide']>

function addHeader(slide: Slide, title: string, subtitle?: string) {
  slide.addText('AURES Intelligence', {
    x: 0.4, y: 0.25, w: 4, h: 0.3,
    fontSize: 9, fontFace: FONT, color: COLOR.textLight, bold: true,
  })
  slide.addText(title, {
    x: 0.4, y: 0.55, w: 12.5, h: 0.55,
    fontSize: 22, fontFace: FONT, color: COLOR.text, bold: true,
  })
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.4, y: 1.05, w: 12.5, h: 0.35,
      fontSize: 11, fontFace: FONT, color: COLOR.textMuted,
    })
  }
  // Divider
  slide.addShape('line', {
    x: 0.4, y: 1.4, w: 12.5, h: 0,
    line: { color: COLOR.border, width: 1 },
  })
}

function addFooter(slide: Slide, page: number, total: number) {
  slide.addShape('line', {
    x: 0.4, y: 7.1, w: 12.5, h: 0,
    line: { color: COLOR.border, width: 1 },
  })
  slide.addText(`AURES Intelligence  ·  ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: 0.4, y: 7.2, w: 8, h: 0.25,
    fontSize: 9, fontFace: FONT, color: COLOR.textLight,
  })
  slide.addText(`${page} / ${total}`, {
    x: 12, y: 7.2, w: 0.9, h: 0.25,
    fontSize: 9, fontFace: FONT, color: COLOR.textLight, align: 'right',
  })
}

// ============================================================
// Main entry point
// ============================================================

export async function exportSchemePpt(data: SchemeTrackerData, options: { likelyFailedThresholdMonths?: number } = {}): Promise<void> {
  const threshold = options.likelyFailedThresholdMonths ?? 14

  const pptx = new PptxGenJS()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.title = 'CIS & LTESA Scheme Intelligence'
  pptx.subject = 'Executive briefing'
  pptx.author = 'AURES Intelligence'

  const cisRounds = data.rounds.filter(r => r.scheme === 'CIS')
  const ltesaRounds = data.rounds.filter(r => r.scheme === 'LTESA')

  const TOTAL_PAGES = 9
  let page = 0

  // ----- Slide 1: Title -----
  page++
  {
    const s = pptx.addSlide()
    s.background = { color: COLOR.bg }
    s.addShape('rect', { x: 0, y: 0, w: 13.333, h: 0.6, fill: { color: COLOR.primary } })
    s.addText('AURES INTELLIGENCE', {
      x: 0.4, y: 0.1, w: 6, h: 0.4,
      fontSize: 12, fontFace: FONT, color: 'FFFFFF', bold: true,
    })

    s.addText('CIS & LTESA Scheme Intelligence', {
      x: 0.7, y: 2.4, w: 12, h: 0.9,
      fontSize: 36, fontFace: FONT, color: COLOR.text, bold: true,
    })
    s.addText('Executive Briefing', {
      x: 0.7, y: 3.3, w: 12, h: 0.5,
      fontSize: 20, fontFace: FONT, color: COLOR.textMuted,
    })
    s.addText([
      { text: `${data.summary.total_projects} projects · ${(data.summary.total_mw / 1000).toFixed(1)} GW under contract`, options: { fontSize: 13, fontFace: FONT, color: COLOR.textMuted } },
      { text: '\n', options: {} },
      { text: `${cisRounds.length} CIS rounds · ${ltesaRounds.length} LTESA rounds`, options: { fontSize: 13, fontFace: FONT, color: COLOR.textMuted } },
    ], { x: 0.7, y: 4.2, w: 12, h: 1, fontSize: 13, fontFace: FONT, color: COLOR.textMuted })

    s.addText(new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' }), {
      x: 0.7, y: 6.2, w: 12, h: 0.4,
      fontSize: 11, fontFace: FONT, color: COLOR.textLight,
    })
  }

  // ----- Slide 2: Scheme overview -----
  page++
  {
    const s = pptx.addSlide()
    s.background = { color: COLOR.bg }
    addHeader(s, 'Schemes Overview', 'Combined Capacity Investment Scheme (CIS) and NSW Long-Term Energy Service Agreements (LTESA) award status')

    // Two columns: CIS | LTESA
    const cisMW = cisRounds.reduce((a, r) => a + r.total_capacity_mw, 0)
    const cisProj = cisRounds.reduce((a, r) => a + r.num_projects, 0)
    const cisMWh = cisRounds.reduce((a, r) => a + (r.total_storage_mwh || 0), 0)
    const ltesaMW = ltesaRounds.reduce((a, r) => a + r.total_capacity_mw, 0)
    const ltesaProj = ltesaRounds.reduce((a, r) => a + r.num_projects, 0)
    const ltesaMWh = ltesaRounds.reduce((a, r) => a + (r.total_storage_mwh || 0), 0)

    drawSummaryCard(s, 0.4, 1.7, 6.2, 5.0, COLOR.cis,
      `CAPACITY INVESTMENT SCHEME`,
      `Federal underwriting agreements (CISA) for new generation and dispatchable storage across the NEM and WEM. Awarded via competitive merit-based tender.`,
      [
        { label: 'Rounds awarded', value: `${cisRounds.length}` },
        { label: 'Projects awarded', value: `${cisProj}` },
        { label: 'Total capacity',  value: fmtMW(cisMW) },
        { label: 'Total storage',   value: fmtMWh(cisMWh) },
      ]
    )
    drawSummaryCard(s, 6.7, 1.7, 6.2, 5.0, COLOR.ltesa,
      `NSW LTESA`,
      `NSW Government underwriting agreements via the Electricity Infrastructure Investment Act 2020. Targets generation, firming, and long-duration storage to refresh the state's energy mix.`,
      [
        { label: 'Rounds awarded', value: `${ltesaRounds.length}` },
        { label: 'Projects awarded', value: `${ltesaProj}` },
        { label: 'Total capacity',  value: fmtMW(ltesaMW) },
        { label: 'Total storage',   value: fmtMWh(ltesaMWh) },
      ]
    )

    addFooter(s, page, TOTAL_PAGES)
  }

  // ----- Slide 3: CIS rounds detail table -----
  page++
  drawRoundsTable(pptx.addSlide(), 'CIS Rounds — Award & Delivery Status', cisRounds, COLOR.cis, threshold, page, TOTAL_PAGES)

  // ----- Slide 4: LTESA rounds detail table -----
  page++
  drawRoundsTable(pptx.addSlide(), 'LTESA Rounds — Award & Delivery Status', ltesaRounds, COLOR.ltesa, threshold, page, TOTAL_PAGES)

  // ----- Slide 5: Outcomes — what's delivered vs at-risk -----
  page++
  {
    const s = pptx.addSlide()
    s.background = { color: COLOR.bg }
    addHeader(s, 'Outcomes Snapshot', `Delivery progress across all CIS + LTESA rounds. "Likely failed" applies to projects in development past ${threshold} months without confirmed CISA/LTESA execution.`)

    const allProjects = data.rounds.flatMap(r => r.projects.map(p => ({ p, r })))
    const totals = { delivering: 0, building: 0, developing: 0, at_risk: 0, unknown: 0 }
    const totalsMw = { delivering: 0, building: 0, developing: 0, at_risk: 0, unknown: 0 }
    for (const { p, r } of allProjects) {
      const b = bucket(p, r.months_since_announced, threshold)
      totals[b] += 1
      totalsMw[b] += p.capacity_mw || 0
    }
    const tot = totals.delivering + totals.building + totals.developing + totals.at_risk + totals.unknown

    const cards = [
      { label: 'Delivering',    sub: 'Operating or commissioning', n: totals.delivering, mw: totalsMw.delivering, color: COLOR.green },
      { label: 'Under Construction', sub: 'Site works underway', n: totals.building,    mw: totalsMw.building,    color: COLOR.amber },
      { label: 'In Development', sub: `≤${threshold} months since award`, n: totals.developing, mw: totalsMw.developing, color: COLOR.blue },
      { label: 'Likely Failed', sub: `>${threshold} months & no CISA confirmed`, n: totals.at_risk, mw: totalsMw.at_risk, color: COLOR.red },
    ]
    cards.forEach((c, i) => {
      const x = 0.4 + (i * 3.18)
      drawOutcomeCard(s, x, 1.7, 3.0, 1.85, c.color, c.label, c.sub, c.n, c.mw, tot)
    })

    // Stacked horizontal bar showing share of MW
    s.addText('SHARE OF AWARDED CAPACITY', {
      x: 0.4, y: 3.85, w: 6, h: 0.3,
      fontSize: 9, fontFace: FONT, color: COLOR.textMuted, bold: true,
    })
    const totalMw = totalsMw.delivering + totalsMw.building + totalsMw.developing + totalsMw.at_risk + totalsMw.unknown
    let xCursor = 0.4
    const barW = 12.5, barY = 4.2, barH = 0.55
    cards.forEach(c => {
      const w = (c.mw / Math.max(totalMw, 1)) * barW
      if (w > 0.05) {
        s.addShape('rect', { x: xCursor, y: barY, w, h: barH, fill: { color: c.color }, line: { color: 'FFFFFF', width: 1 } })
        if (w > 0.7) {
          s.addText(`${fmtMW(c.mw)}`, {
            x: xCursor, y: barY, w, h: barH,
            fontSize: 10, fontFace: FONT, color: 'FFFFFF', bold: true, align: 'center', valign: 'middle',
          })
        }
        xCursor += w
      }
    })

    // Headline interpretation
    const deliveringPct = (totalsMw.delivering / Math.max(totalMw, 1)) * 100
    const atRiskPct = (totalsMw.at_risk / Math.max(totalMw, 1)) * 100
    s.addText([
      { text: 'Headline read: ', options: { bold: true, color: COLOR.text, fontSize: 11, fontFace: FONT } },
      { text: `${deliveringPct.toFixed(0)}% of awarded capacity is operating or commissioning. ${atRiskPct.toFixed(0)}% sits in the "likely failed" bucket — past the ${threshold}-month threshold without confirmed CISA execution. The middle ground (under construction + still in development) is where contract execution decisions over the next 6 months will determine outcomes.`,
        options: { color: COLOR.textMuted, fontSize: 11, fontFace: FONT } },
    ], { x: 0.4, y: 5.2, w: 12.5, h: 1.6, fontSize: 11, fontFace: FONT })

    addFooter(s, page, TOTAL_PAGES)
  }

  // ----- Slide 6: NSW Wind in CIS -----
  page++
  drawNswWindSlide(pptx.addSlide(), 'NSW Wind — CIS Pipeline', data, 'CIS', threshold, page, TOTAL_PAGES)

  // ----- Slide 7: NSW Wind in LTESA -----
  page++
  drawNswWindSlide(pptx.addSlide(), 'NSW Wind — LTESA Pipeline', data, 'LTESA', threshold, page, TOTAL_PAGES)

  // ----- Slide 8: AURES outlook — next 6 months -----
  page++
  {
    const s = pptx.addSlide()
    s.background = { color: COLOR.bg }
    addHeader(s, 'AURES Outlook — Next 6 Months Critical', 'What to watch from now into late 2026: when CIS execution becomes contractually overdue and what flips from "developing" to "likely failed".')

    // Key milestones panel
    const cisT1 = data.rounds.find(r => r.id === 'cis-tender-1' || (r.scheme === 'CIS' && r.round.includes('Tender 1')))
    const cisT4 = data.rounds.find(r => r.scheme === 'CIS' && r.round.includes('Tender 4'))

    const milestones = [
      cisT1 ? {
        title: `CIS Tender 1 — ${cisT1.months_since_announced + 6} months mark`,
        body: `${cisT1.num_projects} projects awarded ${fmtDate(cisT1.announced_date)}. Currently ${cisT1.months_since_announced} months on. Projects without confirmed CISA execution by mid-2026 will trip the AURES "likely failed" threshold (${threshold} months).`,
        date: 'Mid-2026',
        color: COLOR.amber,
      } : null,
      cisT4 ? {
        title: `CIS Tender 4 — first execution window`,
        body: `${cisT4.num_projects} projects awarded ${fmtDate(cisT4.announced_date)} (${cisT4.months_since_announced} months ago). Standard CISA execution targets ~12 months from award. Failure to execute by Q4 2026 raises early concerns.`,
        date: 'Q4 2026',
        color: COLOR.blue,
      } : null,
      {
        title: 'NSW EnergyCo grid connection commitments',
        body: 'Most NSW Wind/CIS projects sit at "grid connection pending" per AURES dev_status. The next 6 months will reveal whether NSW EnergyCo can clear the backlog of access rights needed for projects to reach FID.',
        date: 'Ongoing',
        color: COLOR.red,
      },
      {
        title: 'CISA execution & First Nations publication',
        body: 'CIS Tender 1+ projects must publish First Nations and Social Licence commitments within 20 business days of CISA execution. Sustained absence of publication is a strong signal a project has not executed.',
        date: 'Continuous',
        color: COLOR.cis,
      },
    ].filter((m): m is NonNullable<typeof m> => m !== null)

    milestones.forEach((m, i) => {
      const y = 1.7 + i * 1.25
      // Color block
      s.addShape('rect', { x: 0.4, y, w: 0.15, h: 1.05, fill: { color: m.color }, line: { color: m.color } })
      // Title row
      s.addText(m.title, {
        x: 0.7, y, w: 9, h: 0.32,
        fontSize: 13, fontFace: FONT, color: COLOR.text, bold: true,
      })
      s.addText(m.date, {
        x: 9.7, y, w: 3.2, h: 0.32,
        fontSize: 11, fontFace: FONT, color: m.color, bold: true, align: 'right',
      })
      s.addText(m.body, {
        x: 0.7, y: y + 0.32, w: 12.2, h: 0.7,
        fontSize: 10, fontFace: FONT, color: COLOR.textMuted,
      })
    })

    // Bottom watchlist note
    const allProjects = data.rounds.flatMap(r => r.projects.map(p => ({ p, r })))
    const stillDeveloping = allProjects.filter(({ p, r }) => bucket(p, r.months_since_announced, threshold) === 'developing').length
    const developingMw = allProjects
      .filter(({ p, r }) => bucket(p, r.months_since_announced, threshold) === 'developing')
      .reduce((a, { p }) => a + p.capacity_mw, 0)

    s.addText([
      { text: 'Watchlist: ', options: { bold: true, color: COLOR.text, fontSize: 10, fontFace: FONT } },
      { text: `${stillDeveloping} projects (${fmtMW(developingMw)}) currently in the "developing" bucket. Each crossing the ${threshold}-month threshold without a confirmed CISA execution flips into "likely failed" under AURES analysis. Track CISA execution dates and grid connection commitments project-by-project on the SchemeTracker page.`,
        options: { color: COLOR.textMuted, fontSize: 10, fontFace: FONT } },
    ], { x: 0.4, y: 6.55, w: 12.5, h: 0.5, fontSize: 10, fontFace: FONT })

    addFooter(s, page, TOTAL_PAGES)
  }

  // ----- Slide 9: Methodology & sources -----
  page++
  {
    const s = pptx.addSlide()
    s.background = { color: COLOR.bg }
    addHeader(s, 'Methodology & Data Sources', 'How AURES tracks scheme outcomes and where it draws data from.')

    s.addText('METHODOLOGY', {
      x: 0.4, y: 1.7, w: 6, h: 0.3,
      fontSize: 10, fontFace: FONT, color: COLOR.textMuted, bold: true,
    })
    s.addText([
      { text: '• Project status', options: { bold: true, color: COLOR.text, fontSize: 11, fontFace: FONT } },
      { text: ' — current AEMO Generation Information dispatch stage (operating, commissioning, construction, development, unknown).\n', options: { color: COLOR.textMuted, fontSize: 11, fontFace: FONT } },
      { text: '• Likely failed threshold', options: { bold: true, color: COLOR.text, fontSize: 11, fontFace: FONT } },
      { text: ` — projects > ${threshold} months past round announcement without confirmed CISA/LTESA execution. Senate Estimates Apr 2026 confirmed ~9 Tender 1 projects had reached financial close among those with executed CISAs.\n`, options: { color: COLOR.textMuted, fontSize: 11, fontFace: FONT } },
      { text: '• CISA execution proxy', options: { bold: true, color: COLOR.text, fontSize: 11, fontFace: FONT } },
      { text: ' — CIS Tender 1+ projects must publish First Nations and Social Licence commitments within 20 business days of CISA execution. Absence of publication after 6+ months signals non-execution.\n', options: { color: COLOR.textMuted, fontSize: 11, fontFace: FONT } },
      { text: '• Planning approval status', options: { bold: true, color: COLOR.text, fontSize: 11, fontFace: FONT } },
      { text: ' — NOT consistently captured as a structured field in the current AURES dataset. Where dev_status reads "FID reached" or "grid connection pending", planning is logically approved (you cannot reach FID without it). Exact approval dates are not in scope of the current pipeline.', options: { color: COLOR.textMuted, fontSize: 11, fontFace: FONT } },
    ], { x: 0.4, y: 2.05, w: 12.5, h: 3.5, fontSize: 11, fontFace: FONT })

    s.addText('PRIMARY SOURCES', {
      x: 0.4, y: 5.6, w: 6, h: 0.3,
      fontSize: 10, fontFace: FONT, color: COLOR.textMuted, bold: true,
    })
    s.addText([
      { text: 'DCCEEW Capacity Investment Scheme tender results · AEMO Services (NSW Consumer Trustee) LTESA tender summaries · AEMO Generation Information (monthly) · First Nations Clean Energy Network (FNCEN) "From Commitment to Delivery" tracker · Senate Standing Committee on Environment Estimates (Apr 2026) · OpenElectricity API for dispatch data',
        options: { color: COLOR.textMuted, fontSize: 10, fontFace: FONT } },
    ], { x: 0.4, y: 5.95, w: 12.5, h: 1.0, fontSize: 10, fontFace: FONT })

    addFooter(s, page, TOTAL_PAGES)
  }

  // Save
  const dateSlug = new Date().toISOString().slice(0, 10)
  await pptx.writeFile({ fileName: `AURES_Scheme_Intelligence_${dateSlug}.pptx` })
}

// ============================================================
// Component-level helpers
// ============================================================

function drawSummaryCard(
  s: Slide, x: number, y: number, w: number, h: number,
  accent: string,
  title: string,
  blurb: string,
  stats: { label: string; value: string }[]
) {
  s.addShape('rect', { x, y, w, h, fill: { color: 'F8FAFC' }, line: { color: COLOR.border, width: 1 } })
  s.addShape('rect', { x, y, w: 0.15, h, fill: { color: accent }, line: { color: accent } })
  s.addText(title, {
    x: x + 0.3, y: y + 0.25, w: w - 0.6, h: 0.4,
    fontSize: 12, fontFace: FONT, color: accent, bold: true,
  })
  s.addText(blurb, {
    x: x + 0.3, y: y + 0.7, w: w - 0.6, h: 1.4,
    fontSize: 10, fontFace: FONT, color: COLOR.textMuted,
  })
  // Stats grid 2x2
  stats.forEach((stat, i) => {
    const sx = x + 0.3 + (i % 2) * (w / 2 - 0.3)
    const sy = y + 2.4 + Math.floor(i / 2) * 1.05
    s.addText(stat.label.toUpperCase(), {
      x: sx, y: sy, w: w / 2 - 0.4, h: 0.3,
      fontSize: 9, fontFace: FONT, color: COLOR.textLight, bold: true,
    })
    s.addText(stat.value, {
      x: sx, y: sy + 0.3, w: w / 2 - 0.4, h: 0.55,
      fontSize: 22, fontFace: FONT, color: COLOR.text, bold: true,
    })
  })
}

function drawOutcomeCard(
  s: Slide, x: number, y: number, w: number, h: number, color: string,
  label: string, sub: string, n: number, mw: number, total: number
) {
  s.addShape('rect', { x, y, w, h, fill: { color: 'F8FAFC' }, line: { color: COLOR.border, width: 1 } })
  s.addShape('rect', { x, y, w, h: 0.06, fill: { color }, line: { color } })
  s.addText(label.toUpperCase(), {
    x: x + 0.2, y: y + 0.2, w: w - 0.4, h: 0.3,
    fontSize: 10, fontFace: FONT, color, bold: true,
  })
  s.addText(`${n}`, {
    x: x + 0.2, y: y + 0.55, w: w - 0.4, h: 0.7,
    fontSize: 32, fontFace: FONT, color: COLOR.text, bold: true,
  })
  s.addText(`projects · ${fmtMW(mw)}`, {
    x: x + 0.2, y: y + 1.25, w: w - 0.4, h: 0.3,
    fontSize: 10, fontFace: FONT, color: COLOR.textMuted,
  })
  s.addText(sub, {
    x: x + 0.2, y: y + 1.5, w: w - 0.4, h: 0.3,
    fontSize: 9, fontFace: FONT, color: COLOR.textLight, italic: true,
  })
  // % of total
  const pct = total > 0 ? (n / total * 100).toFixed(0) : '0'
  s.addText(`${pct}%`, {
    x: x + w - 0.9, y: y + 0.15, w: 0.7, h: 0.4,
    fontSize: 14, fontFace: FONT, color, bold: true, align: 'right',
  })
}

function drawRoundsTable(
  s: Slide, title: string, rounds: SchemeTrackerRound[], accent: string,
  threshold: number, page: number, total: number
) {
  s.background = { color: COLOR.bg }
  addHeader(s, title, `${rounds.length} rounds — number of projects, capacity, and current delivery split. "Likely failed" = past ${threshold} months since award without confirmed CISA/LTESA execution.`)

  const headers = ['Round', 'Announced', '# Proj', 'Capacity', 'Delivering', 'Building', 'Developing', 'At Risk']
  const headerRow = headers.map((h, i) => ({
    text: h,
    options: {
      bold: true, fontSize: 10, fontFace: FONT, color: 'FFFFFF',
      fill: { color: accent }, align: (i === 0 || i === 1) ? 'left' : 'right' as 'left' | 'right',
      valign: 'middle' as const,
    },
  }))

  const dataRows = rounds.map(r => {
    const buckets = { delivering: 0, building: 0, developing: 0, at_risk: 0 }
    for (const p of r.projects) {
      const b = bucket(p, r.months_since_announced, threshold)
      if (b !== 'unknown') buckets[b] += 1
    }
    return [
      { text: r.round, options: { fontSize: 10, fontFace: FONT, color: COLOR.text, bold: true, align: 'left' as const, valign: 'middle' as const } },
      { text: fmtDate(r.announced_date), options: { fontSize: 10, fontFace: FONT, color: COLOR.textMuted, align: 'left' as const, valign: 'middle' as const } },
      { text: `${r.num_projects}`, options: { fontSize: 10, fontFace: FONT, color: COLOR.text, align: 'right' as const, valign: 'middle' as const } },
      { text: fmtMW(r.total_capacity_mw), options: { fontSize: 10, fontFace: FONT, color: COLOR.text, align: 'right' as const, valign: 'middle' as const } },
      { text: buckets.delivering ? `${buckets.delivering}` : '–', options: { fontSize: 10, fontFace: FONT, color: buckets.delivering ? COLOR.green : COLOR.textLight, align: 'right' as const, valign: 'middle' as const, bold: !!buckets.delivering } },
      { text: buckets.building   ? `${buckets.building}`   : '–', options: { fontSize: 10, fontFace: FONT, color: buckets.building   ? COLOR.amber : COLOR.textLight, align: 'right' as const, valign: 'middle' as const, bold: !!buckets.building } },
      { text: buckets.developing ? `${buckets.developing}` : '–', options: { fontSize: 10, fontFace: FONT, color: buckets.developing ? COLOR.blue  : COLOR.textLight, align: 'right' as const, valign: 'middle' as const } },
      { text: buckets.at_risk    ? `${buckets.at_risk}`    : '–', options: { fontSize: 10, fontFace: FONT, color: buckets.at_risk    ? COLOR.red   : COLOR.textLight, align: 'right' as const, valign: 'middle' as const, bold: !!buckets.at_risk } },
    ]
  })

  s.addTable([headerRow, ...dataRows], {
    x: 0.4, y: 1.7, w: 12.5,
    colW: [3.4, 1.4, 1.0, 1.5, 1.3, 1.3, 1.3, 1.3],
    border: { type: 'solid', color: COLOR.border, pt: 1 },
    rowH: 0.42,
  })

  addFooter(s, page, total)
}

function drawNswWindSlide(
  s: Slide, title: string, data: SchemeTrackerData, scheme: 'CIS' | 'LTESA',
  threshold: number, page: number, totalPages: number
) {
  s.background = { color: COLOR.bg }
  addHeader(s, title, `Every wind project in NSW awarded under ${scheme}. AURES dev_status reflects current development bottleneck — most have planning approval already (the constraint is grid connection or CISA execution).`)

  // Filter
  const rows: { round: string; announced: string; project: SchemeTrackerProject; monthsSince: number }[] = []
  for (const r of data.rounds) {
    if (r.scheme !== scheme) continue
    for (const p of r.projects) {
      if (p.technology === 'wind' && p.state === 'NSW') {
        rows.push({ round: r.round, announced: r.announced_date, project: p, monthsSince: r.months_since_announced })
      }
    }
  }

  if (rows.length === 0) {
    s.addText(`No NSW wind projects in ${scheme} as of ${new Date().toLocaleDateString('en-AU')}.`, {
      x: 0.4, y: 3.0, w: 12.5, h: 1, fontSize: 14, fontFace: FONT, color: COLOR.textMuted, align: 'center',
    })
    addFooter(s, page, totalPages)
    return
  }

  const accent = scheme === 'CIS' ? COLOR.cis : COLOR.ltesa
  const headers = ['Project', 'Round', 'MW', 'Stage', 'Dev Status', 'Months Since Award']
  const headerRow = headers.map((h, i) => ({
    text: h,
    options: {
      bold: true, fontSize: 10, fontFace: FONT, color: 'FFFFFF',
      fill: { color: accent }, align: (i === 0 || i === 1 || i === 3 || i === 4) ? 'left' : 'right' as 'left' | 'right',
      valign: 'middle' as const,
    },
  }))

  const stageColor = (stage: string) =>
    stage === 'operating' || stage === 'commissioning' ? COLOR.green :
    stage === 'construction' ? COLOR.amber :
    stage === 'development' ? COLOR.blue : COLOR.textLight

  const dataRows = rows.map(({ round, project: p, monthsSince }) => [
    { text: p.name, options: { fontSize: 10, fontFace: FONT, color: COLOR.text, bold: true, align: 'left' as const, valign: 'middle' as const } },
    { text: round, options: { fontSize: 9, fontFace: FONT, color: COLOR.textMuted, align: 'left' as const, valign: 'middle' as const } },
    { text: fmtMW(p.capacity_mw), options: { fontSize: 10, fontFace: FONT, color: COLOR.text, align: 'right' as const, valign: 'middle' as const } },
    { text: p.stage, options: { fontSize: 9, fontFace: FONT, color: stageColor(p.stage), bold: true, align: 'left' as const, valign: 'middle' as const } },
    { text: p.dev_status || '–', options: { fontSize: 9, fontFace: FONT, color: COLOR.textMuted, align: 'left' as const, valign: 'middle' as const, italic: true } },
    { text: `${monthsSince} mo`, options: { fontSize: 10, fontFace: FONT, color: monthsSince > threshold ? COLOR.red : COLOR.textMuted, align: 'right' as const, valign: 'middle' as const, bold: monthsSince > threshold } },
  ])

  const tableHeight = 0.42 * (rows.length + 1)
  s.addTable([headerRow, ...dataRows], {
    x: 0.4, y: 1.7, w: 12.5,
    colW: [3.4, 2.6, 1.2, 1.6, 2.4, 1.3],
    border: { type: 'solid', color: COLOR.border, pt: 1 },
    rowH: 0.42,
  })

  // Status callout
  const yAfter = 1.7 + tableHeight + 0.3
  const buckets = { delivering: 0, building: 0, developing: 0, at_risk: 0 }
  let mwTotal = 0, mwDelivering = 0
  for (const { project: p, monthsSince } of rows) {
    const b = bucket(p, monthsSince, threshold)
    if (b !== 'unknown') buckets[b] += 1
    mwTotal += p.capacity_mw
    if (b === 'delivering') mwDelivering += p.capacity_mw
  }

  s.addText([
    { text: 'NSW wind under ' + scheme + ': ', options: { bold: true, color: COLOR.text, fontSize: 11, fontFace: FONT } },
    { text: `${rows.length} projects, ${fmtMW(mwTotal)} total. `, options: { color: COLOR.textMuted, fontSize: 11, fontFace: FONT } },
    { text: `${buckets.delivering} delivering`, options: { color: COLOR.green, fontSize: 11, fontFace: FONT, bold: true } },
    { text: ` (${fmtMW(mwDelivering)}), `, options: { color: COLOR.textMuted, fontSize: 11, fontFace: FONT } },
    { text: `${buckets.building} under construction`, options: { color: COLOR.amber, fontSize: 11, fontFace: FONT, bold: true } },
    { text: `, ${buckets.developing} in development`, options: { color: COLOR.blue, fontSize: 11, fontFace: FONT } },
    { text: buckets.at_risk ? `, ${buckets.at_risk} at risk of failure` : '', options: { color: COLOR.red, fontSize: 11, fontFace: FONT, bold: true } },
    { text: '.', options: { color: COLOR.textMuted, fontSize: 11, fontFace: FONT } },
  ], { x: 0.4, y: yAfter, w: 12.5, h: 0.5, fontSize: 11, fontFace: FONT })

  // Annotation footnote — explain limitations
  s.addText([
    { text: 'Caveat: ', options: { italic: true, color: COLOR.amber, fontSize: 9, fontFace: FONT, bold: true } },
    { text: 'Per-project planning approval dates are not captured as a structured field in the current AURES dataset. Where dev_status reads "grid connection pending" or "FID reached", planning is logically approved (these milestones cannot be reached without it). For exact planning-approval dates, refer to the relevant state planning portal.',
      options: { italic: true, color: COLOR.textMuted, fontSize: 9, fontFace: FONT } },
  ], { x: 0.4, y: yAfter + 0.6, w: 12.5, h: 0.7, fontSize: 9, fontFace: FONT })

  addFooter(s, page, totalPages)
}

// silence unused — kept for potential future use
void monthsSince
