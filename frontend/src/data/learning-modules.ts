/**
 * AURES Learning — module catalogue
 *
 * The single source of truth for the /learn hub and the per-module stub
 * pages. Each module either points to a fully-built lesson page (status
 * = 'available') or renders a stub that surfaces the planned lesson
 * outline + research bibliography (status = 'in-development' / 'planned').
 *
 * Adding research sources here is deliberate: the breadth of sources
 * cited in each module is part of the AURES quality bar. When we
 * deep-build a module, every source listed here should be consulted.
 */

export type ModuleStatus = 'available' | 'in-development' | 'planned'

export interface ModuleSource {
  /** Display label */
  label: string
  /** Optional URL to source */
  url?: string
  /** Short note on what this source provides */
  note?: string
}

export interface ModuleSourceGroup {
  /** e.g. 'AEMO & regulators', 'Law firms', 'Consultancies', etc. */
  category: string
  items: ModuleSource[]
}

export interface ModuleLesson {
  /** Stable lesson id, used in the URL when built (e.g. /learn/<module>/<lesson>) */
  id: string
  /** Lesson number (1-indexed) — purely visual */
  number: number
  /** Lesson title */
  title: string
  /** 1-2 sentence summary of what the lesson covers */
  summary: string
  /** Optional list of bullet points the lesson will cover */
  covers?: string[]
  /** Optional flag for an interactive element planned (e.g. a calculator) */
  interactive?: string
}

export interface LearningModule {
  id: string
  /** Emoji icon for visual flavour */
  icon: string
  title: string
  /** Short tagline (1 sentence) */
  tagline: string
  /** 2-4 sentence longer description */
  description: string
  status: ModuleStatus
  /** Estimated total read time across all lessons, e.g. '45 min' */
  readingTime: string
  /** Anchor colour for the module card */
  accent: string
  /** Lesson outline — visible on the stub even before the module is built */
  lessons: ModuleLesson[]
  /** Research bibliography — visible on the stub */
  sources: ModuleSourceGroup[]
  /** Build-priority order (1 = first to be deep-built in Phase 2) */
  buildOrder?: number
  /** When the module was last revised */
  added: string
  /**
   * For 'available' modules, the route to the existing module page
   * (e.g. '/learn/constraints'). If undefined, the hub will route to
   * the generic stub at /learn/:moduleId.
   */
  route?: string
}

// ============================================================
// 1. NEM Constraints (already built — the gold-standard reference)
// ============================================================

const M_CONSTRAINTS: LearningModule = {
  id: 'constraints',
  icon: '⚡',
  title: 'NEM Constraints & Constraint Equations',
  tagline: 'Why dispatch is more than a bid stack — physics, equations, market impacts.',
  description:
    'A 7-lesson module explaining how network constraints work in the NEM, from physical phenomena through to market price impacts and data access. Pitched at the WattClarity level: technically credible, data-first, real constraint IDs throughout.',
  status: 'available',
  readingTime: '60 min',
  accent: '#3b82f6',
  added: '2026-05-09',
  route: '/learn/constraints',
  lessons: [
    { id: 'why-dispatch', number: 1, title: 'Why Dispatch Is More Than a Bid Stack', summary: 'NEMDE as Security-Constrained Economic Dispatch (SCED). The gap between cheapest-on-paper and physically safe.' },
    { id: 'anatomy', number: 2, title: 'Anatomy of a Constraint Equation', summary: 'LHS, RHS, operator and how they shape dispatch.' },
    { id: 'shift-factors', number: 3, title: 'Injection Shift Factors', summary: 'Where they come from and how they’re used.' },
    { id: 'types', number: 4, title: 'Types of Constraints', summary: 'Six-type browser: thermal, voltage stability, transient, oscillatory, system strength, FCAS.' },
    { id: 'ids', number: 5, title: 'Constraint IDs, Sets & Lifecycle', summary: 'Live constraint ID decoder, four worked decode examples.' },
    { id: 'market', number: 6, title: 'Market Impacts: Shadow Prices & Congestion', summary: 'Two-region shadow-price calculator, congestion-rent intuition, real case studies.' },
    { id: 'data', number: 7, title: 'Working with Constraint Data', summary: 'MMS table reference, NEMOSIS, SQL patterns, external tools.' },
  ],
  sources: [
    { category: 'AEMO', items: [
      { label: 'AEMO Constraint Equations and Sets — Operating Procedures', url: 'https://www.aemo.com.au/-/media/files/electricity/nem/security_and_reliability/power_system_ops/procedures/so_op_3705.pdf' },
      { label: 'NEMDE Cost-Functions: how the dispatch engine values violations' },
      { label: 'AEMO Constraint Library (live and historical equations)' },
    ]},
    { category: 'Industry analysis', items: [
      { label: 'WattClarity — extensive constraint commentary', url: 'https://wattclarity.com.au' },
      { label: 'Aurora Energy Research — congestion price modelling' },
      { label: 'Modo Energy — constraint analytics', url: 'https://modoenergy.com' },
    ]},
    { category: 'Tools & data', items: [
      { label: 'NEMOSIS — Python access to AEMO MMS', url: 'https://github.com/UNSW-CEEM/NEMOSIS' },
      { label: 'AEMO MMS Data Model — DISPATCHCONSTRAINT, GENCONDATA tables' },
    ]},
  ],
}

// ============================================================
// 2. AEMO Connection Process
// ============================================================

const M_CONNECTIONS: LearningModule = {
  id: 'aemo-connections',
  icon: '🔌',
  title: 'AEMO Connection Process for New Developments',
  tagline: 'From feasibility to commissioning — the full connection journey.',
  description:
    'The connection process is one of the biggest determinants of project timeline and risk. This module walks through every step: from initial feasibility, through 5.3.4 application, GPS negotiations, R1–R2 testing, and commissioning hold-points. It maps the roles of AEMO, the NSP, and the proponent at each stage, and explains why timelines have blown out for many recent projects.',
  status: 'in-development',
  readingTime: '50 min planned',
  accent: '#06b6d4',
  added: '2026-05-10',
  buildOrder: 7,
  lessons: [
    { id: 'overview', number: 1, title: 'The connection journey end-to-end', summary: 'A high-level map of every formal step from feasibility through R2, with the parties and timeframes.', covers: ['NSP vs AEMO roles', 'Tier 1 vs Tier 2 vs Tier 3 plant', 'NER Chapter 5 framework', 'Why "12 month" became "36+ month"'] },
    { id: 'feasibility', number: 2, title: 'Feasibility & pre-application studies', summary: 'What proponents do before formal application — connection point selection, preliminary system studies, NSP scoping.', covers: ['Connection point capacity assessment', 'Preliminary load-flow studies', 'NSP scoping fees', 'Why most pain is here'] },
    { id: '5341', number: 3, title: 'NER 5.3.4: Application for Connection', summary: 'The formal start. What’s in a 5.3.4 application, the data the NSP needs, and the offer-to-connect process.', covers: ['Mandatory data set', 'Functional specification', 'Initial offer to connect', 'Cost/access principles'] },
    { id: 'gps', number: 4, title: 'Generator Performance Standards (GPS)', summary: 'The 14 standards a generator must meet. Where the negotiation pressure points are. Common GPS failures.', covers: ['Standards S5.2.5.1 to S5.2.5.14', 'Automatic vs Negotiated vs Minimum standards', 'System strength gap (post-2018)', 'Inverter-based resource reality'] },
    { id: 'studies', number: 5, title: 'System studies & modelling', summary: 'PSS/E, PSCAD, RMS modelling. Why your inverter manufacturer’s model can determine your fate.', covers: ['EMT vs RMS', 'Equipment model availability', 'GPS compliance studies', 'AEMO and NSP review cycles'] },
    { id: 'r1r2', number: 6, title: 'Commissioning: R1, R2 and hold-points', summary: 'How a project actually gets onto the grid. Hold-points, tests, and why R2 has been delayed for many projects.', covers: ['Initial energisation (R1)', 'Hold-point sequencing', 'Performance verification', 'Full registration (R2)'] },
    { id: 'unblocking', number: 7, title: 'What’s being done to unblock the queue', summary: 'AEMC rule changes, system strength services, AEMO ECF, and what proponents can do today.', covers: ['Engineering Roadmap milestones', 'System strength service framework', 'AEMC rule changes 2024-2026', 'CEC connection scorecard'] },
  ],
  sources: [
    { category: 'AEMO & regulators', items: [
      { label: 'National Electricity Rules — Chapter 5 (Connection)', url: 'https://www.aemc.gov.au/regulation/energy-rules/national-electricity-rules' },
      { label: 'AEMO Connection portal & application forms', url: 'https://www.aemo.com.au/energy-systems/electricity/national-electricity-market-nem/participate-in-the-market/network-connections' },
      { label: 'AEMO Engineering Framework / Engineering Roadmap', url: 'https://www.aemo.com.au/initiatives/major-programs/engineering-framework' },
      { label: 'AEMC system strength rule changes (2017, 2021, 2023)' },
      { label: 'AER — Connection charging guideline' },
    ]},
    { category: 'Network Service Providers', items: [
      { label: 'Powerlink (QLD) connection guide' },
      { label: 'TransGrid (NSW) connection guide' },
      { label: 'AusNet Services (VIC) connection portal' },
      { label: 'ElectraNet (SA) connection process' },
      { label: 'Western Power (WA) generator access guide (SWIS)' },
    ]},
    { category: 'Law firms', items: [
      { label: 'Norton Rose Fulbright — connection negotiation series', url: 'https://www.nortonrosefulbright.com/' },
      { label: 'Allens — Energy & Resources publications', url: 'https://www.allens.com.au/' },
      { label: 'HSF Kramer — connection rule change tracker', url: 'https://www.hsfkramer.com/' },
      { label: 'Clayton Utz — generator connection insights' },
      { label: 'Gilbert + Tobin — system strength commentary' },
    ]},
    { category: 'Consultancies', items: [
      { label: 'Aurecon — generator connection studies' },
      { label: 'GHD — connection consulting' },
      { label: 'Baringa — connection economic analysis', url: 'https://www.baringa.com/' },
      { label: 'EY ROAM — system modelling and integration studies' },
      { label: 'DIgSILENT Pacific — PowerFactory studies' },
    ]},
    { category: 'Industry bodies', items: [
      { label: 'Clean Energy Council Connection Scorecard', url: 'https://cleanenergycouncil.org.au/' },
      { label: 'Energy Networks Australia — Network of the Future' },
      { label: 'Clean Energy Investor Group — connection bottleneck advocacy' },
    ]},
    { category: 'Press', items: [
      { label: 'RenewEconomy — connection-queue coverage', url: 'https://reneweconomy.com.au/' },
      { label: 'WattClarity — connection process explainers', url: 'https://wattclarity.com.au/' },
    ]},
    { category: 'AURES integration', items: [
      { label: 'AURES dev_status field — surfaces "grid connection pending" projects' },
      { label: 'AURES REZ data — connection point context per zone' },
    ]},
  ],
}

// ============================================================
// 3. Planning Approvals (EPBC + State)
// ============================================================

const M_PLANNING: LearningModule = {
  id: 'planning-approvals',
  icon: '🏛️',
  title: 'Planning Approval Pathways for Renewable Projects',
  tagline: 'EPBC plus state-by-state — and why QLD is "calling in" projects.',
  description:
    'The planning system is the single biggest source of timeline uncertainty for renewable projects. This module walks through the federal EPBC Act, then each NEM state’s pathway (NSW, VIC, QLD, SA, WA) — comparing thresholds, decision-makers, timelines, community engagement requirements, and recent reforms. Includes a deep-dive on the QLD "called-in" projects and how the federal CIS is being used to apply pressure on slow state pathways.',
  status: 'in-development',
  readingTime: '70 min planned',
  accent: '#a855f7',
  added: '2026-05-10',
  buildOrder: 6,
  lessons: [
    { id: 'overview', number: 1, title: 'Federal vs state — the two-track structure', summary: 'How any wind/solar project navigates both EPBC and state planning, and why dual-consent timelines stack.', covers: ['Bilateral assessment agreements', 'Controlled action thresholds', 'Sequencing the two tracks', 'Common rejection / withdrawal patterns'] },
    { id: 'epbc', number: 2, title: 'EPBC Act 1999 — federal environmental approval', summary: 'Matters of National Environmental Significance, controlled-action assessment, and recent EPBC reform.', covers: ['MNES list (threatened species, RAMSAR, World Heritage)', 'Referral and controlled-action decision', 'Assessment by accreditation', 'Nature Positive reform 2026 status'] },
    { id: 'nsw', number: 3, title: 'NSW — SSD pathway and the IPC', summary: 'State Significant Development under EP&A Act 1979. The Independent Planning Commission. Recent IPC determinations.', covers: ['SSD vs SSI thresholds', 'Department of Planning vs IPC', 'When 50+ objections trigger IPC referral', 'Recent IPC wind farm decisions (Spicers Creek, Thunderbolt, Valley of the Winds, Liverpool Range)'] },
    { id: 'vic', number: 4, title: 'VIC — Planning & Environment Act 1987', summary: 'Minister’s call-in powers, Energy Facilities Plan, and the Big Build Approvals 2024 reforms.', covers: ['Renewable Energy Action Plan', 'Minister’s power under s17/s20', 'Renewable Energy Zone-driven amendments', 'Recent VIC turbine height debates'] },
    { id: 'qld-call-ins', number: 5, title: 'QLD deep-dive — the "called-in" projects', summary: 'What projects has the QLD Government recently called in, why, and what does it mean for the renewable pipeline?', covers: ['Lotus Creek, Theodore, Mt Hopeful, Wambo case studies', 'Planning Act 2016 call-in mechanism', 'Coordinated Project status', 'Local sentiment vs energy policy'], interactive: 'Timeline of QLD call-in decisions' },
    { id: 'sa', number: 6, title: 'SA & WA — leaner systems, different politics', summary: 'SA’s Planning, Development and Infrastructure Act 2016 + WA’s state planning regime + Pilbara off-grid considerations.', covers: ['SA bipartisan support', 'WA Green Energy Approvals Initiative', 'Pilbara Energy Transition Plan', 'WEM grid vs SWIS-non-connected'] },
    { id: 'cis-leverage', number: 7, title: 'How the CIS is unblocking state planning', summary: 'Federal CIS contracts as a planning-acceleration lever, the IDA in NSW, and whether it’s working.', covers: ['Investment Delivery Authority (NSW)', 'CISA conditions referencing planning', 'Federal-state coordination examples', 'AER analysis on T1 progress vs planning bottlenecks'] },
  ],
  sources: [
    { category: 'Federal — EPBC', items: [
      { label: 'EPBC Act 1999 (consolidated)', url: 'https://www.legislation.gov.au/C2004A00485/latest/versions' },
      { label: 'DCCEEW EPBC public portal', url: 'https://epbcpublicportal.environment.gov.au/' },
      { label: 'Samuel Review of the EPBC Act (2020) and reform updates' },
      { label: 'Nature Positive reform package — 2026 status' },
    ]},
    { category: 'NSW', items: [
      { label: 'Environmental Planning & Assessment Act 1979', url: 'https://legislation.nsw.gov.au/view/html/inforce/current/act-1979-203' },
      { label: 'NSW Planning Portal — Major Projects', url: 'https://www.planningportal.nsw.gov.au/major-projects' },
      { label: 'Independent Planning Commission NSW', url: 'https://www.ipcn.nsw.gov.au/' },
      { label: 'NSW Energy Policy Framework (Gilbert + Tobin commentary)' },
      { label: 'Investment Delivery Authority (IDA) materials' },
    ]},
    { category: 'VIC', items: [
      { label: 'Planning & Environment Act 1987', url: 'https://www.legislation.vic.gov.au/' },
      { label: 'Department of Transport & Planning — Renewable Energy', url: 'https://www.planning.vic.gov.au/' },
      { label: 'Big Build Approvals reform 2024' },
      { label: 'Development Facilitation Program' },
    ]},
    { category: 'QLD', items: [
      { label: 'Planning Act 2016 — call-in powers', url: 'https://www.legislation.qld.gov.au/view/html/inforce/current/act-2016-025' },
      { label: 'Coordinator-General — Coordinated Project pathway', url: 'https://www.statedevelopment.qld.gov.au/coordinator-general' },
      { label: 'QLD Government media releases on called-in renewables' },
      { label: 'Local Government Association of Queensland — community sentiment' },
    ]},
    { category: 'SA & WA', items: [
      { label: 'SA Planning, Development & Infrastructure Act 2016', url: 'https://www.legislation.sa.gov.au/' },
      { label: 'WA Planning & Development Act 2005', url: 'https://www.legislation.wa.gov.au/' },
      { label: 'WA Green Energy Approvals Initiative' },
      { label: 'Pilbara Energy Transition Plan' },
    ]},
    { category: 'Law firms', items: [
      { label: 'HSF Kramer — Sweeping changes for wind energy projects under new NSW planning framework', url: 'https://www.hsfkramer.com/notes/environmentaustralia/2024-posts/Sweeping-changes-for-wind-energy-projects-under-new-NSW-planning-framework' },
      { label: 'Norton Rose Fulbright — EPBC reform tracker' },
      { label: 'Ashurst — state-by-state planning guides' },
      { label: 'MinterEllison — renewable energy planning updates' },
      { label: 'Allens — Coordinated Project alerts (QLD)' },
      { label: 'Clayton Utz — environmental approvals practice' },
      { label: 'Gilbert + Tobin — Draft NSW Energy Policy Framework analysis' },
    ]},
    { category: 'Industry / consultancy', items: [
      { label: 'Clean Energy Council — DELIVERING MAJOR CLEAN ENERGY PROJECTS IN NSW report', url: 'https://www.ceig.org.au/delivering-major-clean-energy-projects-in-nsw/' },
      { label: 'Clean Energy Investor Group — planning bottleneck advocacy' },
      { label: 'Baringa — planning timeline modelling' },
      { label: 'EY ROAM — system planning intersection' },
    ]},
    { category: 'Press', items: [
      { label: 'RenewEconomy — wind & solar project approval coverage' },
      { label: 'PV Magazine Australia — state-by-state planning news' },
      { label: 'The Guardian — community-opposition reporting' },
    ]},
    { category: 'AURES integration', items: [
      { label: 'planning_approval_date field on NSW wind/CIS projects (curated)' },
      { label: 'CIS scheme tracker — links state planning to federal contract status' },
    ]},
  ],
}

// ============================================================
// 4. NSW REZs
// ============================================================

const M_REZ: LearningModule = {
  id: 'nsw-rez',
  icon: '🗺️',
  title: 'NSW REZs & Transmission Infrastructure',
  tagline: 'Five REZs and three TNSP backbones — where projects actually live or die.',
  description:
    'NSW has declared five Renewable Energy Zones — but a REZ without transmission is just a coloured polygon. This module covers both halves of the puzzle: the access-rights, anchor-project, and consumer-charge mechanics of each REZ, and the long-history TNSP build-out that connects them — Project EnergyConnect, HumeLink, VNI West, and the existing VNI. Heavy NSW focus, with cross-cuts to SA and VIC where the interconnectors land.',
  status: 'available',
  readingTime: '70 min',
  accent: '#10b981',
  added: '2026-05-11',
  route: '/learn/nsw-rez',
  lessons: [
    { id: 'framework',     number: 1, title: 'The NSW REZ + Transmission Framework', summary: 'EII Act 2020, the Consumer Trustee, TransGrid as TNSP, why NSW chose REZs at all.', covers: ['Electricity Infrastructure Investment Act 2020', 'AEMO Services as Consumer Trustee', 'EnergyCo as infrastructure planner', 'TransGrid as the existing TNSP', 'Why NSW chose REZs over a pure access-fee model', 'Comparable models: UK GB Connect Reform, ERCOT CREZ'] },
    { id: 'cwo',           number: 2, title: 'Central-West Orana REZ', summary: 'The first REZ — 4.5 GW target, the CWO Transmission Project, anchor projects.', covers: ['CWO Transmission Project (ACEREZ consortium)', 'Access scheme tender outcome', 'Anchor wind farms (Liverpool Range, Spicers Creek, Valley of the Winds)', 'Anchor solar + storage (Wellington Black Range, Yanco Delta)', 'Consumer charge mechanics'] },
    { id: 'new-england',   number: 3, title: 'New England REZ', summary: '8 GW target — the largest. NETP, project mix, why timelines have moved.', covers: ['New England Transmission Project (NETP)', 'Access scheme tender outcomes', 'Wind-dominant project mix (Winterbourne, Thunderbolt, Hills of Gold, Liverpool Range)', 'Hunter Power Project alignment', 'Local council and community pushback'] },
    { id: 'sw-hcc-ill',    number: 4, title: 'South-West, Hunter-Central Coast & Illawarra REZs', summary: 'The other three — solar-and-storage, coal-replacement, offshore-wind.', covers: ['South-West REZ — Riverina solar belt + Project EnergyConnect', 'Hunter-Central Coast — Eraring + Vales coal replacement', 'Illawarra — offshore wind interface', 'Why different REZs attract different developers'] },
    { id: 'pec',           number: 5, title: 'Project EnergyConnect — the long road', summary: 'NSW-SA interconnector, RIT-T, construction, cost overruns, current status.', covers: ['ESCRI-SA / Riverlink history', 'RIT-T outcome 2020', 'TransGrid + ElectraNet joint delivery', '900 km HVAC route Wagga–Buronga–Robertstown', '$2.3B → $2.8B+ cost trajectory', 'Stage 1 energisation mid-2024', 'Stage 2 to full capacity 2025-26', 'Inter-regional flow implications'] },
    { id: 'humelink-vni',  number: 6, title: 'HumeLink, VNI & VNI West — the NSW spine', summary: 'Snowy 2.0 evacuation, NSW-VIC flows, public delivery model, what slipped.', covers: ['HumeLink — 360 km 500 kV, Wagga to Bannaby', 'Why HumeLink unlocks Snowy 2.0', 'NSW public-delivery decision 2024', 'VNI existing — 660/1100 MW directional capacity', 'VNI West — joint TransGrid + AusNet', 'Original 2031 target slip', 'Cost trajectory'] },
    { id: 'compare',       number: 7, title: 'Compare-the-pair: where to develop', summary: 'CF, access cost, transmission lead time, planning friction — REZ-by-REZ.', covers: ['Resource quality (wind CF, solar CF) by zone', 'Access fee mechanics by REZ', 'Network charge differences', 'Planning friction (LGA, community sentiment)', 'TNSP commissioning risk by zone'] },
  ],
  sources: [
    { category: 'NSW Government', items: [
      { label: 'NSW Electricity Infrastructure Roadmap', url: 'https://www.energy.nsw.gov.au/nsw-plans-and-progress/government-strategies-and-frameworks/electricity-infrastructure-roadmap' },
      { label: 'EnergyCo NSW', url: 'https://www.energyco.nsw.gov.au/' },
      { label: 'AEMO Services Consumer Trustee', url: 'https://www.aemoservices.com.au/' },
      { label: 'NSW EnergyCo Statement of Opportunity (SOO) — annual' },
      { label: 'Investment Delivery Authority materials' },
    ]},
    { category: 'AEMO', items: [
      { label: 'Integrated System Plan (ISP)', url: 'https://aemo.com.au/energy-systems/major-publications/integrated-system-plan-isp' },
      { label: 'Transmission Annual Planning Report (TAPR) — TransGrid' },
      { label: 'AEMO ESOO — supply outlook' },
    ]},
    { category: 'Transmission projects', items: [
      { label: 'HumeLink — TransGrid project page' },
      { label: 'EnergyConnect (NSW-SA) — TransGrid' },
      { label: 'Central-West Orana Transmission Project (ACEREZ consortium)' },
      { label: 'New England Transmission Project' },
    ]},
    { category: 'Consultancies', items: [
      { label: 'Baringa — REZ economic modelling', url: 'https://www.baringa.com/' },
      { label: 'EY ROAM — REZ network modelling' },
      { label: 'Aurora Energy Research — Australia REZ insights', url: 'https://auroraer.com/' },
      { label: 'Cornwall Insight — NSW REZ outlook', url: 'https://www.cornwall-insight.com/' },
      { label: 'PSC Consulting — system studies' },
    ]},
    { category: 'Universities & research', items: [
      { label: 'UNSW Centre for Energy & Environmental Markets (CEEM)' },
      { label: 'ANU School of Engineering — Andrew Blakers research' },
      { label: 'Grattan Institute — energy reports' },
    ]},
    { category: 'Law firms', items: [
      { label: 'King & Wood Mallesons — REZ legal framework', url: 'https://www.kwm.com/' },
      { label: 'Norton Rose Fulbright — REZ access scheme tracker' },
      { label: 'Allens — EII Act updates' },
      { label: 'Gilbert + Tobin — Consumer Trustee tender alerts' },
    ]},
    { category: 'Press', items: [
      { label: 'RenewEconomy — REZ delivery coverage', url: 'https://reneweconomy.com.au/' },
      { label: 'WattClarity — transmission constraint analysis' },
      { label: 'PV Magazine Australia — REZ tender results' },
    ]},
    { category: 'AURES integration', items: [
      { label: 'AURES REZ data file (rez-zones.ts)' },
      { label: 'REZ-tagged projects across the AURES database' },
    ]},
  ],
}

// ============================================================
// 5. PPAs for renewable projects
// ============================================================

const M_PPAS: LearningModule = {
  id: 'ppas',
  icon: '📜',
  title: 'PPAs for Renewable Projects',
  tagline: 'From single-buyer offtake to corporate aggregation — how the contract evolved.',
  description:
    'Power Purchase Agreements are the backbone of project finance. This module traces the evolution from utility-only PPAs through the corporate PPA boom, into today’s shaped, sleeved and bundled-LGC structures. We map the typical risk-allocation matrix, dive into specific market-shaping deals, and compare how Australian PPAs differ from US/EU equivalents.',
  status: 'in-development',
  readingTime: '50 min planned',
  accent: '#8b5cf6',
  added: '2026-05-10',
  buildOrder: 8,
  lessons: [
    { id: 'history', number: 1, title: 'A brief history of the Australian PPA', summary: 'From the 1990s utility offtake to the 2017 corporate boom to the 2024 firmed-PPA era.', covers: ['Pre-NEM utility offtakes', 'RET-driven utility PPAs (2010–2016)', 'Corporate PPA boom (2017 onwards)', 'CIS as a PPA equivalent'] },
    { id: 'anatomy', number: 2, title: 'Anatomy of a renewable PPA', summary: 'Term, price, shape, volume, risk allocation. The clauses bankability turns on.', covers: ['Strike price + escalation', 'Volume profile (firm vs as-generated vs shaped)', 'LGC bundling/separation', 'Curtailment risk allocation', 'Change-in-law'] },
    { id: 'corporate', number: 3, title: 'Corporate PPAs in Australia — the big deals', summary: 'Telstra, BHP, Coles, Woolworths, Microsoft, Atlassian, Aldi — what each deal told us.', covers: ['Telstra-Murra Warra (the catalyst)', 'BHP Olympic Dam wind/solar', 'Coles + ENGIE 100% deal', 'Microsoft + ACEN', 'Hyperscaler PPAs'] },
    { id: 'shape', number: 4, title: 'Shape risk and the rise of firmed PPAs', summary: 'Why solar-only PPAs got harder to sell. Bundling with batteries. Firming via gas peakers.', covers: ['Shape risk explained', 'Hourly matching', 'Firmed offtake (RE + storage)', '24/7 hourly carbon-free'] },
    { id: 'state-cfd', number: 5, title: 'Government-as-counterparty: CIS, LTESA, VRET', summary: 'How sovereign-backed contracts re-shape the PPA landscape and crowd in (or out) corporate offtake.', covers: ['CIS as floor + ceiling CFD', 'LTESA fixed-price CFD', 'VRET reverse auctions', 'Hybrid stacking'] },
    { id: 'pricing', number: 6, title: 'PPA pricing — the BNEF index and structural drivers', summary: 'What’s driving recent prices, why solar PPAs have decoupled from wind, and where the market is going.', covers: ['BNEF Australia PPA index', 'Capture-price compression vs PPA price', 'LGC market integration', 'Outlook 2026–2030'] },
  ],
  sources: [
    { category: 'Industry market data', items: [
      { label: 'BloombergNEF Australia PPA Tracker', url: 'https://about.bnef.com/' },
      { label: 'Energetics PPA Outlook', url: 'https://www.energetics.com.au/' },
      { label: 'Schneider Electric — Energy & Sustainability Services PPA reports' },
      { label: 'Edify Energy commentary' },
      { label: 'Clean Energy Buyers Alliance' },
    ]},
    { category: 'Law firms', items: [
      { label: 'Norton Rose Fulbright — PPA practice publications', url: 'https://www.nortonrosefulbright.com/' },
      { label: 'King & Wood Mallesons — PPA legal updates', url: 'https://www.kwm.com/' },
      { label: 'MinterEllison — Corporate PPA series', url: 'https://www.minterellison.com/' },
      { label: 'Allens — Energy Transition publications' },
      { label: 'Ashurst — Corporate PPA insights' },
      { label: 'Clayton Utz — PPA risk allocation' },
      { label: 'Herbert Smith Freehills (HSF Kramer) — PPA structure series' },
    ]},
    { category: 'Consultancies', items: [
      { label: 'Baringa — PPA pricing models', url: 'https://www.baringa.com/' },
      { label: 'Wood Mackenzie — Australia PPA outlook' },
      { label: 'Cornwall Insight — Australia PPA report' },
      { label: 'EY ROAM — PPA modelling' },
      { label: 'Marsh — PPA insurance commentary' },
    ]},
    { category: 'Universities & research', items: [
      { label: 'UNSW CEEM — PPA literature' },
      { label: 'ANU CCEP — corporate offtake research' },
      { label: 'IRENA — global PPA evolution reports' },
    ]},
    { category: 'Industry bodies', items: [
      { label: 'Clean Energy Council — Corporate PPA toolkit', url: 'https://cleanenergycouncil.org.au/' },
      { label: 'Business Renewables Centre Australia' },
    ]},
    { category: 'Press', items: [
      { label: 'RenewEconomy — PPA deal coverage', url: 'https://reneweconomy.com.au/' },
      { label: 'PV Magazine Australia — corporate PPA reporting' },
      { label: 'WattClarity — settlement & PPA analysis' },
    ]},
    { category: 'AURES integration', items: [
      { label: 'AURES offtakes data per project', url: '/offtakers' },
      { label: 'Project-level scheme contracts (CIS/LTESA strikes)' },
    ]},
  ],
}

// ============================================================
// 6. The BESS Story in the NEM
// ============================================================

const M_BESS: LearningModule = {
  id: 'bess-story',
  icon: '🔋',
  title: 'Solar + BESS in the NEM — Boom, Cannibalisation, Batteries',
  tagline: 'The full arc: rooftop boom → cannibalisation deep-dive → BESS → spread saturation.',
  description:
    'Australia\'s solar and storage stories are too entangled to tell separately. Rooftop solar created cannibalisation, cannibalisation created the BESS opportunity, BESS deployment is now compressing its own arbitrage spread — and the next wave (long-duration storage and solar+storage co-location) is what answers that. This 10-lesson module tells the whole arc, with deep-dive treatments of capture-price decay (using AURES data), how a battery earns, the BESS records leaderboard, and the coming spread-saturation question.',
  status: 'available',
  readingTime: '95 min',
  accent: '#22c55e',
  added: '2026-05-11',
  route: '/learn/bess-story',
  lessons: [
    { id: 'rooftop-boom',  number: 1, title: 'The Australian rooftop solar boom', summary: 'How feed-in tariffs, STCs and a hyper-competitive installer market built the world’s densest rooftop solar fleet.', covers: ['Premium FITs (NSW Solar Bonus, VIC Premium FIT)', 'STC scheme replacing RECs in 2011', 'Australian electrician industry — sole-operator competition keeps install costs low', 'Chinese module costs and dumping allegations', 'Cost trajectory: $5/W in 2010 to ~$1.10/W today', '~4 million homes, 24+ GW installed by 2026'] },
    { id: 'btm-scale',     number: 2, title: 'Commercial solar and the hidden demand effect', summary: 'Commercial mid-scale roll-out plus the impact of behind-the-meter generation on operational demand.', covers: ['Commercial 100 kW – 1 MW segment', 'Operational demand vs underlying demand', 'Minimum demand events in SA, VIC, QLD', 'How 30+ GW behind-the-meter changes the grid view of demand', 'Hidden demand growth from data centres and EVs masked by rooftop'] },
    { id: 'cannibalisation-mechanic', number: 3, title: 'The cannibalisation mechanic', summary: 'What value factor really means, why solar farms are perfectly correlated, the merit-order effect.', covers: ['Value factor = capture price / pool average', 'The merit-order effect formally', 'Why solar output is perfectly correlated within a region', 'Hourly profile of a typical solar farm', 'Negative spot prices — mechanism and who pays', 'Mathematical relationship between solar penetration and VF'] },
    { id: 'capture-price-decay',   number: 4, title: 'Capture-price decay — real data by state and farm', summary: 'Year-on-year VF decline using AURES data. Worst farms, best farms, and what predicts the gap.', covers: ['VF trajectory 2018-2026 by NEM region', 'Worst capture price farms (Bungala, Daydream, Hayman, Limondale)', 'Best capture price solar (regional outliers)', 'Curtailment — economic vs technical', 'AURES Solar Value Analysis cross-link', 'The "diversity capture premium" metric'], interactive: 'AURES Solar Value Analysis cross-link' },
    { id: 'hornsdale',             number: 5, title: 'Origins: Hornsdale and the Tesla bet', summary: 'How a Twitter bet brought the world\'s biggest battery to South Australia and rewrote the orthodoxy.', covers: ['28 Sep 2016 SA blackout context', 'Tesla / Neoen / Musk 100-day bet', 'Hornsdale Power Reserve commissioning Dec 2017', 'FCAS revenue surprise', '2019 expansion to 150 MW / 193.5 MWh'] },
    { id: 'how-earns',             number: 6, title: 'How a battery actually earns', summary: 'Arbitrage spread, FCAS, capacity contracts — and the real numbers from AURES.', covers: ['Spread = avg discharge price minus avg charge price', 'Round-trip efficiency 80–88%', 'Cycles per year (target ~250–350)', 'FCAS market revenue mix'], interactive: 'AURES BESS Records Leaderboard cross-link' },
    { id: 'duration-records',      number: 7, title: 'The duration evolution and BESS records', summary: '1-hour → 4-hour → 8h+. State-by-state records. CIS and LTESA driving each tier.', covers: ['Why 1-hour led for FCAS', 'CIS Tender 3 4-hour minimum', 'LTESA Round 6 8.7–11.5 hour batteries', 'AURES leaderboard per state'] },
    { id: 'solar-storage-stacking', number: 8, title: 'Solar + storage stacking — the answer to cannibalisation', summary: 'Co-located batteries that charge from their own solar array, time-shift to evening, and recover the cannibalised value.', covers: ['DC-coupled vs AC-coupled hybrids', 'Charge-from-own-array math', 'CIS hybrid awards (12 of 20 in T4)', 'Real examples — Junction Rivers, Wellington, Bundey', 'Why only ~50% of utility solar will eventually be hybrid'] },
    { id: 'spread-reduction',      number: 9, title: 'BESS spread reduction — does the arbitrage eat itself?', summary: 'As more batteries arrive, midday-to-evening spread compresses. International experience and Australian outlook.', covers: ['The cannibalisation-by-storage thesis', 'AEMO QED data on spread compression', 'California 2022-23 spread collapse parallel', 'When does it start hitting Australia?', 'What survives — long-duration, co-located, multi-day storage'] },
    { id: 'outlook',               number: 10, title: 'Where this is going — more solar, more batteries', summary: 'Residential battery boom, AEMO ISP storage targets, the compounding loop.', covers: ['Federal Cheaper Home Batteries program (2025)', '~250,000+ home batteries by 2024', 'AEMO ISP storage outlook', 'NSW 2 GW / 28 GWh LDS target by 2034', 'BESS as price-setter (32% Q1 2026)', 'Why baseload exit means more solar AND more BESS'] },
  ],
  sources: [
    { category: 'AURES live data', items: [
      { label: 'AURES BESS Records Leaderboard', url: '/intelligence/bess-records' },
      { label: 'AURES BESS Value Analysis on each operating BESS' },
      { label: 'AURES BESS Capex analytics' },
      { label: 'AURES Battery Watch' },
    ]},
    { category: 'AEMO', items: [
      { label: 'AEMO Quarterly Energy Dynamics (QED)', url: 'https://www.aemo.com.au/energy-systems/electricity/national-electricity-market-nem/data-nem/market-management-system-mms-data' },
      { label: 'Integrated System Plan (ISP) storage outlook' },
      { label: 'AEMO ESOO storage outlook' },
    ]},
    { category: 'Industry analytics', items: [
      { label: 'Modo Energy — Australia battery market reports', url: 'https://modoenergy.com/' },
      { label: 'Gridcog Australia BESS analytics', url: 'https://www.gridcog.com/' },
      { label: 'Aurora Energy Research — Australia battery outlook', url: 'https://auroraer.com/' },
      { label: 'Cornwall Insight — battery price-setting analysis' },
      { label: 'Wood Mackenzie — Australia energy storage reports' },
      { label: 'BloombergNEF — Australia BESS' },
    ]},
    { category: 'Universities & research', items: [
      { label: 'UNSW CEEM — battery economics research' },
      { label: 'ANU School of Engineering — storage modelling' },
      { label: 'Grattan Institute — Storing fairness' },
    ]},
    { category: 'Press', items: [
      { label: 'RenewEconomy — battery coverage', url: 'https://reneweconomy.com.au/' },
      { label: 'Energy-Storage News (ESS-news)', url: 'https://www.energy-storage.news/' },
      { label: 'PV Magazine Australia — storage section' },
      { label: 'WattClarity — BESS settlement analysis', url: 'https://wattclarity.com.au/' },
    ]},
    { category: 'Notable case studies', items: [
      { label: 'Hornsdale Power Reserve — Neoen reports' },
      { label: 'Victorian Big Battery — Neoen reports' },
      { label: 'Waratah Super Battery — Akaysha / EnergyCo' },
      { label: 'Eraring Big Battery — Origin' },
      { label: 'Riverina BESS — Edify Energy' },
    ]},
  ],
}

// ============================================================
// 7. Solar Cannibalisation
// ============================================================

const M_SOLAR_CANN: LearningModule = {
  id: 'solar-cannibalisation',
  icon: '☀️',
  title: 'Solar Cannibalisation in the NEM',
  tagline: 'Why solar earns less than the pool — and where it ends.',
  description:
    'Solar farms generate at the same time as every other solar farm in the region. The collective midday peak floods the market and pushes spot prices toward zero, creating a structural revenue penalty unique to high-penetration markets. This module uses real AURES capture-price data from operating solar farms to show the cannibalisation curve, the regional differences (SA vs NSW vs QLD vs VIC), and the role of co-located storage.',
  status: 'in-development',
  readingTime: '40 min planned',
  accent: '#f59e0b',
  added: '2026-05-10',
  buildOrder: 4,
  lessons: [
    { id: 'mechanics', number: 1, title: 'The cannibalisation mechanic', summary: 'Why all solar farms generate at the same time, why that pushes prices down, and what the value-factor metric actually measures.', covers: ['Coincident-output problem', 'Merit-order effect', 'Value factor = capture / pool average', 'AEMO half-hourly RRP intuition'] },
    { id: 'data', number: 2, title: 'Live AURES data — VF by farm and region', summary: 'Real capture prices and value factors for every operating solar farm in AURES.', covers: ['SA leaders & laggards', 'NSW capture price distribution', 'QLD value-factor decay', 'Cross-state comparison'], interactive: 'AURES Solar Value Analysis cross-link' },
    { id: 'curve', number: 3, title: 'The cannibalisation curve', summary: 'How VF has declined as installed solar grew. Year-over-year capture price by region.', covers: ['Annual VF trend per state', 'Threshold effects (when VF dropped fastest)', 'Negative-price hours emergence', 'CSIRO GenCost LCOE vs LCOE-net-of-cannibalisation'] },
    { id: 'rooftop', number: 4, title: 'Rooftop solar — the hidden driver', summary: 'Rooftop displaces grid demand at midday. Why it makes utility-scale cannibalisation worse.', covers: ['DPV trajectory in each state', 'Operational demand vs underlying demand', 'Minimum demand events', 'Rooftop forecasting'] },
    { id: 'storage-stack', number: 5, title: 'Co-located storage as the answer (and its limits)', summary: 'Hybrid solar+battery vs standalone solar. The economics of charging your own dispatch trough.', covers: ['Charge-from-own-array math', 'Time-of-day arbitrage', 'CIS hybrid awards (T1 + T4)', 'Storage saturation risk'] },
  ],
  sources: [
    { category: 'AURES data', items: [
      { label: 'AURES Solar Value Analysis (per-project)' },
      { label: 'AURES Value Factor intelligence' },
      { label: 'AURES Drift Analysis (capture price over time)' },
    ]},
    { category: 'AEMO & data sources', items: [
      { label: 'AEMO Quarterly Energy Dynamics' },
      { label: 'AEMO MMS DISPATCHPRICE table' },
      { label: 'OpenElectricity API — generation-weighted prices', url: 'https://openelectricity.org.au/' },
    ]},
    { category: 'Consultancies', items: [
      { label: 'Aurora Energy Research — Australia solar capture price work', url: 'https://auroraer.com/' },
      { label: 'Cornwall Insight — capture price reports' },
      { label: 'Wood Mackenzie — Australia solar outlook' },
      { label: 'Modo Energy — solar capture pricing', url: 'https://modoenergy.com/' },
      { label: 'EY ROAM — capture price modelling' },
    ]},
    { category: 'Universities & research', items: [
      { label: 'UNSW CEEM — cannibalisation literature' },
      { label: 'ANU — Tom Brown / Andrew Blakers research' },
      { label: 'CSIRO GenCost reports', url: 'https://www.csiro.au/en/research/technology-space/energy/gencost' },
    ]},
    { category: 'Press & analysis', items: [
      { label: 'RenewEconomy — capture price coverage' },
      { label: 'WattClarity — cannibalisation analysis', url: 'https://wattclarity.com.au/' },
      { label: 'PV Magazine Australia — utility-scale solar reporting' },
    ]},
    { category: 'Operator commentary', items: [
      { label: 'Origin / Tilt / Neoen quarterly reports — capture price disclosures' },
      { label: 'Genex, Edify, ACEN investor materials' },
    ]},
  ],
}

// ============================================================
// 8. Energy Transition in the NEM
// ============================================================

const M_TRANSITION: LearningModule = {
  id: 'energy-transition',
  icon: '🔄',
  title: 'The Energy Transition in the NEM',
  tagline: 'From state monopolies to 47% renewable — the phases of how we got here.',
  description:
    'The NEM was designed for fleets of coal generators. It now hosts 50%+ renewables on many days. This module walks through the major phases — pre-NEM, the carbon price era, the RET decade, the coal-closure cascade, and the CIS era — and explains the external drivers (carbon, drought, solar PV cost decline, hyperscale demand) at each stage. We link each phase to revenue impact for incumbent generators vs new entrants.',
  status: 'in-development',
  readingTime: '55 min planned',
  accent: '#0ea5e9',
  added: '2026-05-10',
  buildOrder: 5,
  lessons: [
    { id: 'pre-nem', number: 1, title: 'Pre-NEM: state monopolies', summary: 'How electricity was managed before 1998. Why the NEM was created.', covers: ['State Electricity Commissions', 'COAG energy reforms 1991', 'Vertical disaggregation', 'NEM start 13 December 1998'] },
    { id: 'ret-era', number: 2, title: 'RET era (2001–2016)', summary: 'The Mandatory Renewable Energy Target. The first wind boom. The LGC market.', covers: ['MRET 2001 → LRET 2010', '20% by 2020 target', 'First-generation wind farms', 'LGC market mechanics'] },
    { id: 'carbon', number: 3, title: 'The carbon price era (2012–2014)', summary: 'Two short years that re-shaped the NEM. What happened, and what stuck.', covers: ['Clean Energy Act 2011', 'Carbon price 1 July 2012', 'Repeal 17 July 2014', 'Long-tail effect on coal economics'] },
    { id: 'closures', number: 4, title: 'The coal closure cascade', summary: 'Hazelwood, Liddell, Eraring extension, Yallourn, Loy Yang A schedule.', covers: ['Hazelwood March 2017 (1600 MW out)', 'Liddell April 2023', 'Eraring extension 2027 → 2029', 'Yallourn 2028', 'Loy Yang A 2035'] },
    { id: 'cis-era', number: 5, title: 'The CIS era (2024+)', summary: 'Federal underwriting takes over from state-by-state schemes. Why.', covers: ['Why state-by-state schemes weren’t enough', 'CIS as the mass-scale lever', 'Federal-state coordination', 'New role of LTESA, VRET, REZs'] },
    { id: 'drivers', number: 6, title: 'External drivers — drought, solar costs, hyperscalers', summary: 'The non-policy forces that drove the transition arc.', covers: ['Solar PV cost decline (90% in 12 years)', 'Drought → hydro reduction', 'Hyperscale data centre demand', 'Coal capex deferral'] },
    { id: 'today', number: 7, title: 'Where we are and where we’re going', summary: 'Q1 2026 read: 47% renewables, batteries set price 32% of intervals. ISP scenarios.', covers: ['AEMO Q1 2026 statistics', 'ISP 2026 step-change scenario', '82% renewable target arithmetic', 'Risks: Eraring, Yallourn timing'] },
  ],
  sources: [
    { category: 'AEMO & regulators', items: [
      { label: 'AEMO Integrated System Plan 2024 / 2026' },
      { label: 'AEMO Quarterly Energy Dynamics — historical archive' },
      { label: 'AEMC Strategic Priorities' },
      { label: 'Energy Security Board (ESB) Post-2025 Review' },
      { label: 'AER State of the Energy Market reports' },
    ]},
    { category: 'Universities & think tanks', items: [
      { label: 'Grattan Institute energy reports', url: 'https://grattan.edu.au/' },
      { label: 'ANU Centre for Climate & Energy Policy (CCEP)' },
      { label: 'UNSW Centre for Energy & Environmental Markets (CEEM)' },
      { label: 'CSIRO GenCost (annual)', url: 'https://www.csiro.au/en/research/technology-space/energy/gencost' },
      { label: 'Climate Change Authority — annual reports' },
    ]},
    { category: 'Government & policy', items: [
      { label: 'DCCEEW — Australia’s emissions projections' },
      { label: 'ARENA — annual reports' },
      { label: 'Clean Energy Finance Corporation (CEFC) — annual reports' },
      { label: 'Productivity Commission — energy reviews' },
    ]},
    { category: 'Consultancies', items: [
      { label: 'Wood Mackenzie — Australia outlook' },
      { label: 'BloombergNEF — Australia energy outlook' },
      { label: 'Aurora Energy Research — Australia decadal scenarios' },
      { label: 'Baringa — energy transition reports' },
      { label: 'EY ROAM — energy market modelling' },
      { label: 'IEA — Australia country review' },
    ]},
    { category: 'Press & commentary', items: [
      { label: 'RenewEconomy — Giles Parkinson archive', url: 'https://reneweconomy.com.au/' },
      { label: 'WattClarity — Paul McArdle commentary', url: 'https://wattclarity.com.au/' },
      { label: 'The Conversation — Australian energy academic commentary' },
      { label: 'Australian Financial Review — energy desk' },
    ]},
    { category: 'AURES data integration', items: [
      { label: 'AURES Generation Stack and Energy Mix Transition pages' },
      { label: 'Coal Watch on each major closing plant' },
      { label: 'Battery Watch on the storage build-out' },
    ]},
  ],
}

// ============================================================
// 9. Project Financing of Renewables
// ============================================================

const M_FINANCING: LearningModule = {
  id: 'project-financing',
  icon: '💰',
  title: 'Project Financing of Renewables',
  tagline: 'How a wind farm or BESS gets built — debt, equity, DSCR, leverage.',
  description:
    'A project finance lens on the renewable build-out. Starting from the basic SPV structure, this module walks through equity sponsors, debt structuring (mini-perm vs term), DSCR / leverage levels, refinancing dynamics, and how CIS / LTESA contracts re-shape bankability. Pitched at a level a board member could read end-to-end while still being technical enough for a finance professional.',
  status: 'in-development',
  readingTime: '60 min planned',
  accent: '#ec4899',
  added: '2026-05-10',
  buildOrder: 9,
  lessons: [
    { id: 'spv', number: 1, title: 'Project finance 101 — the SPV structure', summary: 'Why projects are financed via Special Purpose Vehicles, not on the sponsor’s balance sheet.', covers: ['SPV legal structure', 'Limited recourse', 'Debt:equity ratio', 'Sponsor support letters & EPC wraps'] },
    { id: 'equity', number: 2, title: 'The equity stack', summary: 'Who provides equity, in what tranches, and how returns are shared.', covers: ['Sponsor equity (developer)', 'Infrastructure funds', 'Super funds (IFM, AustralianSuper, Aware Super)', 'Tax-equity considerations'] },
    { id: 'debt', number: 3, title: 'The debt stack', summary: 'Senior debt, mezzanine, mini-perm vs term, hedging.', covers: ['Big 4 (NAB/CBA/Westpac/ANZ) vs international (MUFG, BNP, ING, Nord/LB)', 'Tenor: 4–7 yr mini-perm to 12–15 yr term', 'Interest rate hedging requirements', 'CEFC role'] },
    { id: 'dscr', number: 4, title: 'DSCR and leverage', summary: 'What lenders actually look at. The DSCR-based sizing math, by example.', covers: ['DSCR definition and calculation', '1.30x base case → 1.10x downside', 'Leverage: 65–75% typical for fully-contracted', 'P50/P90 generation profiles'], interactive: 'DSCR sensitivity calculator' },
    { id: 'risk', number: 5, title: 'Risk allocation in renewable PF', summary: 'Where each risk lives — proponent, contractor, offtaker, lender, government.', covers: ['Construction risk → EPC contractor', 'Resource risk → P90 buffer', 'Curtailment & MLF → varied', 'Connection / hold-point risk → proponent'] },
    { id: 'cis-impact', number: 6, title: 'How CIS and LTESA change the picture', summary: 'A revenue floor changes everything. Bankability transformation under CISA contracts.', covers: ['CIS as floor + ceiling CFD', 'LTESA bankability profile', 'PPA + CISA stacking', 'Refinancing economics post-FID'] },
  ],
  sources: [
    { category: 'Law firms (project finance)', items: [
      { label: 'King & Wood Mallesons — Energy & Resources PF series', url: 'https://www.kwm.com/' },
      { label: 'Norton Rose Fulbright — Project Finance Sourcebook' },
      { label: 'Allens — Renewable Energy Finance updates' },
      { label: 'Allen & Overy / Shearman — global PF tracker' },
      { label: 'Ashurst — Australian project finance practice' },
      { label: 'White & Case — global PF reports' },
      { label: 'Clayton Utz — finance & infrastructure publications' },
      { label: 'HSF Kramer — energy finance updates', url: 'https://www.hsfkramer.com/' },
    ]},
    { category: 'Banks & lenders', items: [
      { label: 'Clean Energy Finance Corporation (CEFC) — investment principles', url: 'https://www.cefc.com.au/' },
      { label: 'NAB — energy finance reports' },
      { label: 'CBA — energy finance' },
      { label: 'Westpac / ANZ — sustainability-linked loans' },
      { label: 'MUFG / BNP / ING — Australia infrastructure desks' },
    ]},
    { category: 'Industry data', items: [
      { label: 'IJGlobal — Australian PF deal database', url: 'https://www.ijglobal.com/' },
      { label: 'Inframation Group — renewables deals' },
      { label: 'BloombergNEF — Energy Finance reports' },
    ]},
    { category: 'Consultancies', items: [
      { label: 'KPMG — Renewable Energy Finance practice' },
      { label: 'Deloitte — Renewables Finance' },
      { label: 'EY ROAM — financial models supporting bankability' },
      { label: 'PwC — Energy & Utilities' },
      { label: 'Marsh — PF insurance practice' },
    ]},
    { category: 'Universities & research', items: [
      { label: 'UNSW CEEM — financing literature' },
      { label: 'Australian National University — finance research' },
      { label: 'Climate Change Authority — Capital flows reports' },
    ]},
    { category: 'Press', items: [
      { label: 'AFR — finance pages' },
      { label: 'RenewEconomy — finance coverage' },
      { label: 'Inframation News' },
    ]},
    { category: 'AURES integration', items: [
      { label: 'AURES Developer Scores intelligence' },
      { label: 'Project-level scheme contracts and offtake fields' },
    ]},
  ],
}

// ============================================================
// 10. CIS & LTESA Bidding Parameters (Phase 2 first deep-dive)
// ============================================================

const M_CIS_LTESA: LearningModule = {
  id: 'cis-ltesa-bidding',
  icon: '🎯',
  title: 'CIS & LTESA Bidding Parameters',
  tagline: 'How sovereign-backed renewable underwriting auctions actually work.',
  description:
    'A deep dive into the mechanics of bidding into the federal Capacity Investment Scheme and NSW Long-Term Energy Service Agreements. The strike price, floor and ceiling parameters, merit criteria evolution, First Nations & Social Licence requirements, project bonds, and how each round’s changes interact with project finance and equity returns. Heavy use of AURES scheme tracker data.',
  status: 'available',
  readingTime: '66 min',
  accent: '#3b82f6',
  added: '2026-05-11',
  route: '/learn/cis-ltesa-bidding',
  lessons: [
    { id: 'architecture', number: 1, title: 'The federal-state architecture', summary: 'Why Australia ended up with two parallel sovereign underwriting schemes.', covers: ['CIS national rationale', 'LTESA Electricity Infrastructure Investment Act 2020', 'Overlap & gap-filling', 'How states without LTESA equivalents fare'] },
    { id: 'cis-mechanics', number: 2, title: 'CIS mechanics — floor + ceiling CFD', summary: 'The CISA structure. Strike price vs floor, ceiling sharing, term length.', covers: ['Underlying CFD structure', 'Floor price negotiation', 'Ceiling profit-share triggers', 'Term length (typically 12-15 years)', 'Generation vs Dispatchable contracts differ'] },
    { id: 'ltesa-mechanics', number: 3, title: 'LTESA mechanics — fixed-price CFD', summary: 'The Consumer Trustee, fixed-price strike, the LDS variant.', covers: ['Fixed-price two-way CFD', 'NSW EnergyCo / AEMO Services roles', 'Round 1 generation vs Round 6 LDS', 'Aboriginal Participation Plans'] },
    { id: 'rounds', number: 4, title: 'Round-by-round — what changed and why', summary: 'CIS Pilot → T1 → T2 (WEM) → T3 → T4 → T5/T6 (WEM). Merit criteria evolution.', covers: ['Single-stage tender reform 2025', 'First Nations & Social Licence weighting growth', 'Time limits for CISA execution', 'Project bond requirements'], interactive: 'Round-by-round comparison table' },
    { id: 'merit-criteria', number: 5, title: 'The merit criteria — and what they cost', summary: 'Each criterion has a price. First Nations equity, community benefit funds, local steel, labour disclosure.', covers: ['MC1 development progress', 'MC2 cost', 'MC3 system value', 'MC4 First Nations', 'MC5 community', 'MC6 jobs', 'MC7 social licence', 'Implicit $/MWh cost of each'] },
    { id: 'finance-interplay', number: 6, title: 'Bidding strategy and project financing', summary: 'How the CIS contract feeds back into the equity model and lender perception.', covers: ['CISA pricing as a finance derivative', 'Offtake stacking with corporate PPAs', 'Bid options: aggressive low-floor vs conservative ceiling-share', 'Why stage-and-second-tender bidders exist'] },
    { id: 'outcomes', number: 7, title: 'Outcomes — has it worked?', summary: 'Award-to-FID conversion, the AER\'s "only half progressing", and the next 6 months.', covers: ['T1 cohort progress (AER Sep 2025)', 'CISA execution proxy (FNCEN)', 'Likely-failed bucket dynamics', 'Forward outlook 2026–2027'] },
  ],
  sources: [
    { category: 'DCCEEW (CIS)', items: [
      { label: 'DCCEEW Capacity Investment Scheme home', url: 'https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme' },
      { label: 'DCCEEW Open & Closed CIS tenders pages' },
      { label: 'DCCEEW CIS guidelines (every revision)' },
      { label: 'CIS Reform — single-stage tender announcement' },
      { label: 'WA WEM design paper (Aug 2025)' },
    ]},
    { category: 'NSW EnergyCo / AEMO Services (LTESA)', items: [
      { label: 'AEMO Services — Tenders page', url: 'https://aemoservices.com.au/' },
      { label: 'NSW EnergyCo Statement of Opportunity' },
      { label: 'EII Act 2020 (NSW)', url: 'https://legislation.nsw.gov.au/' },
      { label: 'Consumer Trustee tender rules' },
    ]},
    { category: 'Government — testimony & reform', items: [
      { label: 'Senate Standing Committee on Environment & Communications — Estimates 2026', url: 'https://www.aph.gov.au/Parliamentary_Business/Senate_estimates/ec' },
      { label: 'Clean Energy Regulator — quarterly CIS progress notes' },
      { label: 'AER reports referencing CIS' },
    ]},
    { category: 'Law firms', items: [
      { label: 'HSF Kramer — Capacity Investment Scheme update', url: 'https://www.hsfkramer.com/notes/energy/2024-posts/Capacity-Investment-Scheme-update-and-the-release-of-the-Dispatchable-CISA-2024' },
      { label: 'HSF Kramer — Major changes for CIS tender process 2025', url: 'https://www.hsfkramer.com/notes/energy/2025-posts/cis-changes' },
      { label: 'Pinsent Masons — CIS battery projects coverage', url: 'https://www.pinsentmasons.com/' },
      { label: 'Norton Rose Fulbright — CIS practice' },
      { label: 'Lexology — Australian energy contributors' },
      { label: 'Hamilton Locke — kicking off Australia’s largest renewables tender' },
      { label: 'Clayton Utz — CIS legal commentary' },
      { label: 'King & Wood Mallesons — CIS series' },
    ]},
    { category: 'Consultancies', items: [
      { label: 'Baringa — CIS storage tender analysis', url: 'https://www.baringa.com/en/insights/low-carbon-capital/australia-cis-storage-tenders/' },
      { label: 'Modo Energy — CIS round-by-round research', url: 'https://modoenergy.com/' },
      { label: 'Aurora Energy Research — CIS economics' },
      { label: 'Cornwall Insight — CIS pricing reports' },
      { label: 'EY ROAM — CIS modelling' },
    ]},
    { category: 'Industry & First Nations', items: [
      { label: 'First Nations Clean Energy Network "From Commitment to Delivery"', url: 'https://www.firstnationscleanenergy.org.au/project_commitments' },
      { label: 'Clean Energy Council Best Practice Charter' },
      { label: 'Clean Energy Investor Group submissions' },
    ]},
    { category: 'Press', items: [
      { label: 'RenewEconomy — CIS tender coverage', url: 'https://reneweconomy.com.au/' },
      { label: 'Energy-Storage News — CIS BESS coverage', url: 'https://www.energy-storage.news/' },
      { label: 'PV Magazine Australia — CIS tender outcomes' },
      { label: 'WattClarity — CIS analysis' },
    ]},
    { category: 'AURES live data', items: [
      { label: 'AURES Scheme Tracker', url: '/intelligence/scheme-tracker' },
      { label: 'AURES Boardroom briefing' },
      { label: 'AURES Export-to-PowerPoint' },
      { label: 'ESG Tracker — CISA execution proxy' },
    ]},
  ],
}

// ============================================================
// Module catalogue export
// ============================================================

// Note: solar cannibalisation has been folded into the merged
// "Solar + BESS in the NEM" module (M_BESS) — see lessons 3, 4, 8 and 9
// of that module. M_SOLAR_CANN is retained in code for historical
// reference but is no longer exposed in the catalogue.
void M_SOLAR_CANN

export const LEARNING_MODULES: LearningModule[] = [
  M_CONSTRAINTS,
  M_CIS_LTESA,
  M_REZ,
  M_BESS,
  M_TRANSITION,
  M_PLANNING,
  M_CONNECTIONS,
  M_PPAS,
  M_FINANCING,
]

export function getModule(id: string): LearningModule | undefined {
  return LEARNING_MODULES.find(m => m.id === id)
}

export function totalLessons(): number {
  return LEARNING_MODULES.reduce((sum, m) => sum + m.lessons.length, 0)
}
