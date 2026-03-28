export interface Guide {
  id: string
  title: string
  description: string
  icon: string
  category: 'about' | 'technical' | 'process' | 'roadmap'
  readingTime: string
  content: string
}

export const GUIDES: Guide[] = [
  {
    id: 'plain-english-overview',
    title: 'What Is AURES?',
    description: 'A plain-English explanation of what this project is, who it\'s for, and why it exists.',
    icon: '💡',
    category: 'about',
    readingTime: '5 min read',
    content: `# What Is This and Why Does It Exist?

## The Plain English Version

Australia is in the middle of the biggest transformation of its electricity system in a century. Coal plants are closing, and they're being replaced by wind farms, solar farms, batteries, and new transmission lines. There are hundreds of these projects — some already operating, some being built, some still on paper.

**The problem is:** there's no single place where you can see all of this clearly.

The information exists, but it's scattered across dozens of websites, government databases, news articles, company announcements, and paywalled reports. If you want to know basic things like "what battery projects are being built in NSW?" or "who makes the turbines for that wind farm?" or "has this project been delayed?", you have to piece it together yourself from half a dozen sources.

**AURES fixes this.** It brings together information from 10+ public sources — including AEMO registers, government scheme data, RSS news feeds, OpenElectricity performance data, and AEMO ISP planning documents — into one searchable, browsable database with built-in analytics. It works on your phone, has a powerful cross-entity search (press Cmd+K), and includes an Intelligence Layer with 10 analytical features covering risk scoring, performance benchmarking, market trends, EIS document analysis, and developer data quality auditing.

---

## What Can You Do With It?

### Look at projects from any angle

Want to see every wind farm in Queensland? Done.
Every project using Vestas turbines? Done.
Every battery that uses Tesla Megapacks? Done.
What did Origin Energy buy this year? Done.
Which projects won CIS funding in Tender 3? Done.
What's in the South West REZ? Done.
Who are the offtakers for operating wind farms? Done.

It's the same underlying data, but you can slice it a dozen different ways — by project, developer, OEM, contractor, offtaker, REZ, scheme, or location on the map. Use the **Cmd+K search** (or tap the search icon on mobile) to instantly find any project, developer, OEM, contractor, or offtaker across the whole platform.

### Track how projects evolve over time

This is the killer feature. Every project has a timeline showing its full history:
- When it was first proposed
- Who developed it
- When it got planning approval
- If it was sold (and for how much)
- When it won CIS/LTESA funding
- What the original construction timeline was
- How that timeline has changed
- What the current expected completion date is

You can see at a glance: "This project was supposed to be finished in 2025, but it's slipped to 2028. Here's why."

### See which projects are actually performing well

For projects that are already operating, AURES tracks:
- How much power they actually generate (capacity factor)
- How much they get paid (volume-weighted price)
- How much power they lose to grid congestion (curtailment)
- How their location affects their revenue (loss factors)

You can see league tables — the best-performing wind farms, solar farms, and batteries — and also the worst. And critically, you can see *why* some perform better than others.

### Understand whether new projects will succeed

For projects that have won government contracts (CIS or LTESA) but haven't been built yet, AURES provides a "watchlist" that scores each project on how likely it is to actually reach construction. This is based on:
- Does it have planning approval?
- Does it have grid access?
- Does the developer have a track record?
- Is the technology proven?
- Are there supply chain risks?

### Analyse market trends with the Intelligence Layer

AURES includes 10 intelligence features that go beyond raw data:
- **Scheme Risk Scoring** — traffic-light risk assessment for CIS/LTESA projects
- **COD Drift Analysis** — delay patterns by technology, state, and developer
- **Wind Resource Assessment** — capacity factor predictions based on location
- **Dunkelflaute Analysis** — renewable energy drought risk and BESS coverage adequacy
- **Energy Mix Tracker** — how each state's generation mix is evolving
- **Developer Scores** — A-F execution grading based on delivery track record
- **Revenue Intelligence** — revenue trends and benchmarks by technology
- **Grid Connection Analysis** — REZ congestion and connection bottleneck mapping
- **EIS/EIA Technical Intelligence** — 98 projects with extracted technical specs, EIS vs actual performance comparison, coverage gap tracking
- **Developer Data Quality** — website cross-referencing, SPV correction identification, JV partnership documentation

### Stay up to date with the News Feed

AURES automatically imports news from RenewEconomy, PV Magazine Australia, and Energy Storage News, and fuzzy-matches articles to projects in the database. See the latest coverage for any project right on its detail page.

### Learn how the energy system works

An education section explains the fundamentals:
- How does Australia's electricity market work?
- What is a Renewable Energy Zone?
- What is the Capacity Investment Scheme?
- Why do batteries earn money from frequency control?
- What is a marginal loss factor and why does it matter?

---

## What Makes This Different?

### 1. It's honest about uncertainty
If we don't know something, it says "Not yet verified" rather than making something up. Every data point has a confidence rating, and every fact links back to its source.

### 2. It shows conflicting information
When the AFR says a project cost $300M and RenewEconomy says $350M, AURES shows both, with dates and context. In this industry, no single source is right about everything. The database helps you see the full picture.

### 3. It tracks change over time
Most databases show you a snapshot. AURES shows you the movie. How has this project's expected completion date shifted? Who used to own it? What was the original cost estimate?

### 4. It works on your phone
Designed mobile-first as a Progressive Web App. Install it on your iPhone and use it on-site, in meetings, or wherever you need quick access to project intelligence.

---

## Who Is This For?

- **Renewable energy professionals** who need project intelligence at their fingertips
- **Investors** evaluating project risks and developer track records
- **Policy analysts** tracking whether CIS/LTESA/REZ programs are delivering
- **Journalists** who need accurate, sourced project data
- **Students and educators** learning about Australia's energy transition
- **Anyone** who wants to understand what's happening with renewable energy in Australia

---

## How Is the Data Kept Accurate?

1. **AEMO backbone**: The core project list comes from AEMO's Generation Information publication, updated quarterly. This is the official source of truth for what exists and what's proposed.

2. **Sourced enrichment**: Every additional detail (OEM, cost, offtakes, etc.) must have a source URL. No data is entered without attribution.

3. **Multi-source triangulation**: Where possible, facts are confirmed across multiple sources. The more sources that agree, the higher the confidence rating.

4. **Change tracking**: Every data update is logged with date, source, and the old value. This creates an audit trail and prevents silent errors.

5. **Honest gaps**: Fields that haven't been researched say "Not yet verified" rather than being left blank or filled with guesses.

---

## Hierarchy of What AURES Achieves

**Level 1: DATABASE** — "What projects exist?"
1,067 project records covering every significant renewable energy project in Australia (NEM + WEM). Filterable by technology, state, developer, OEM, status, REZ, CIS/LTESA round. Searchable via Cmd+K cross-entity search.

**Level 2: PROFILES** — "Who are the players?"
Developer profiles (152 scored developers). OEM profiles (34 equipment manufacturers). EPC contractor profiles (45 contractors). Offtaker profiles (31 offtakers with 85 PPA/offtake agreements tracked).

**Level 3: HISTORY** — "How has this project evolved?"
Full lifecycle timeline for each project. Ownership changes with transaction values. COD drift tracking. Milestone progression.

**Level 4: ANALYSIS** — "How are existing projects performing?"
Operational performance league tables. Capacity factors, revenue, curtailment, loss factors. Best and worst performers by technology and state. BESS revenue breakdown (arbitrage vs FCAS).

**Level 5: INTELLIGENCE** — "What patterns explain performance?"
10 intelligence features: scheme risk scoring (17 tracked projects), COD drift analysis, wind resource assessment, Dunkelflaute analysis, energy mix tracking, developer execution scoring (A-F grades), revenue intelligence, grid connection bottleneck analysis, EIS/EIA technical intelligence (98 projects), and developer data quality auditing (20 developers cross-referenced).

**Level 6: INSIGHT** — "What should we be watching?"
News feed integration (RenewEconomy, PV Magazine, Energy Storage News) with fuzzy project matching. Multi-source analysis of contested topics. Market share trends and competitive dynamics.`,
  },
  {
    id: 'project-plan',
    title: 'Architecture & Plan',
    description: 'Full architecture, phase-by-phase build plan, data sources, and key design decisions.',
    icon: '🏗️',
    category: 'technical',
    readingTime: '12 min read',
    content: `# AURES — Comprehensive Project Plan

## What Is AURES?

**AURES** (AUstralian Renewable Energy System) is a comprehensive, open-source database and intelligence platform tracking every significant renewable energy project in Australia's National Electricity Market (NEM) and Western Australian Wholesale Electricity Market (WEM).

It is designed to be:
- **Comprehensive**: Every wind, solar, BESS, hybrid, pumped hydro, and gas project tracked with full lifecycle data
- **Multi-lens**: Same data viewable by technology, state, developer, OEM, REZ, CIS/LTESA round, and status
- **Historically rich**: Full project timelines showing ownership changes, COD drift, cost evolution, milestone history
- **Analytically powerful**: Operational performance league tables, project risk scoring, top quartile benchmarking
- **Source-transparent**: Every data point linked to its source, with confidence ratings and multi-source triangulation
- **Mobile-first**: PWA that works brilliantly on iPhone and desktop
- **Accurate**: No AI hallucinations — only verified, sourced data with gaps honestly marked

---

## Architecture Overview

The system has four layers:

**Layer 0: DATA PROCESSING PIPELINE (Python)**
Automated AEMO data ingestion (Generation Info, SCADA, MLFs). OpenElectricity API integration (annual + monthly). News RSS import (RenewEconomy, PV Magazine, Energy Storage News). AEMO ISP data import. Computed metrics (capacity factors, revenue, curtailment, rankings). Pipeline automation via \`scripts/aures-pipeline.sh\` with macOS launchd scheduling (weekly Monday 6am). \`admin.py --auto\` flag runs only steps exceeding their frequency threshold.

**Layer 1: SQLite DATABASE**
All project records, timelines, ownership, suppliers, performance. Multi-source data storage with confidence ratings. Computed fields: risk scores, performance scores, quartile rankings. Audit trail: every field change logged with source.

**Layer 2: STATIC JSON (version-controlled)**
Pre-computed views exported from SQLite. Indexes for every navigation lens (by tech, state, developer, OEM, etc.). League tables, watchlists, and market share data. Updated whenever the pipeline runs.

**Layer 3: PWA FRONTEND (GitHub Pages)**
React 19 + TypeScript + Vite 6 + Tailwind 4. Offline-capable via service worker (vite-plugin-pwa). Cross-entity search modal (Cmd+K) with fuzzy matching via Fuse.js. 8 Intelligence Layer pages (scheme risk, COD drift, wind resource, Dunkelflaute, energy mix, developer scores, revenue intelligence, grid connection). Charts via Recharts with PNG export and CSV download. Maps via Leaflet. Accessibility: ARIA labels, skip-to-content, focus management. Mobile-first responsive design with ScrollableTable and Breadcrumbs.

---

## Phase-by-Phase Build Plan

### Phase 1: Foundation (~2 weeks)
**Goal: Working PWA with project database on your phone**

Core tasks: React + Vite + TypeScript + Tailwind + PWA setup. SQLite database schema. Python AEMO Generation Information importer. JSON export pipeline. Core frontend screens (Home dashboard, Project list with filters, Project detail with tabs, Universal search). Mobile-responsive layout with bottom navigation. 10 exemplar projects with full data. Deploy to GitHub Pages.

### Phase 2: CIS/LTESA/REZ + Watchlist (~2 weeks)
**Goal: Full scheme round views and forward-looking risk dashboard**

Structure all CIS rounds (Pilot NSW through Tender 8). Structure all LTESA rounds (Round 1-6). Structure REZ views (NSW, VIC, QLD). Build CIS/LTESA round comparison views. Build Watchlist dashboard with risk scoring. Education hub: CIS explainer, LTESA explainer, REZ explainer.

### Phase 2.5: Interactive Map + NEM Summary
**Goal: Spatial intelligence and fleet-wide dashboard**

**Interactive Map** — Zoomable Leaflet map showing REZ boundaries, transmission network (500kV/330kV/275kV backbone), planned transmission upgrades (HumeLink, VNI West, Marinus Link, CopperString 2.0, etc.) with construction status, and every tracked project plotted by location. Color-coded by technology, sized by capacity. Filter by tech, status, developer. Highlight which projects depend on specific transmission upgrades.

**NEM Summary Dashboard** — High-level snapshot of installed renewables by type (Wind, Solar, BESS, Pumped Hydro, Hybrid). Shows operating vs under construction vs planned capacity. Timeline of projects expected to reach COD in the next 12 months. Clickable drill-downs to see individual projects. Includes practical guidance on how to check if projects are on time (AEMO commissioning register, GPS approval, connection scorecard, CIS milestone deadlines, developer track record, supply chain indicators).

### Phase 3: Performance Analytics (~2-3 weeks)
**Goal: Operational performance league tables and AEMO data pipeline**

Build Python AEMO SCADA data pipeline (dispatch, price, MLF data). Compute monthly/quarterly/annual metrics per generator (capacity factor, revenue, curtailment, availability). Build league table frontend for Wind, Solar, BESS. Curtailment analysis by zone/region. BESS revenue analysis (arbitrage vs FCAS). Wind performance by OEM.  Top quartile benchmark framework.

### Phase 4: Intelligence Layer (~2 weeks)
**Goal: Multi-source analysis, insights, and development mapping**

Multi-source data panel on project pages. Confidence rating system. "Differing Views" feature. Source coverage map per project. Operations to development mapping. Developer and OEM profiles with market share. COD drift tracking visualisation. "Zombie project" detection. Construction performance leaderboard.

### Phase 5: Ongoing Data Enrichment
**Goal: Continuously improve data depth and freshness**

Monthly: Run AEMO SCADA pipeline. Quarterly: Refresh AEMO Generation Information. Per-event: CIS/LTESA results, REZ announcements. Ongoing: Enrich project fact sheets, article linking, stakeholder tracking.

---

## Data Sources (10+ public sources)

### Tier 1: Official / Regulatory
- **AEMO Generation Information** — Project universe (~500+ projects)
- **AEMO Dispatch SCADA** — Per-unit 5-min generation data
- **AEMO MLFs** — Marginal loss factors per generator
- **AEMO Connections Scorecard** — Connection queue status
- **DCCEEW CIS** — Capacity Investment Scheme results
- **AEMO Services / ASL** — LTESA tender results
- **EnergyCo** — REZ access rights, REZ info
- **ACCC Merger Register** — M&A regulatory decisions
- **State Planning Portals** — DA approvals

### Tier 2: Authoritative Journalism
- **Australian Financial Review** — Deal values, M&A, strategic moves, financing
- **RenewEconomy** — Project detail, RenewMap, daily coverage
- **WattClarity** — Technical analysis, curtailment, capacity factors
- **Modo Energy** — BESS revenue analytics, CIS/LTESA analysis

### Tier 3: Specialist Industry
PV Magazine Australia, Energy Storage News, Infrastructure Investor, Capital Brief, Energy Synapse, Clean Energy Council

### Tier 4: Open Data
OpenElectricity (OpenNEM) — annual and monthly performance data (capacity factors, revenue, curtailment). Monthly intervals enable seasonal analysis with 12 data points per facility per year. Global Energy Monitor, Wikipedia, ARENA.

### Tier 5: News & RSS Feeds
**RenewEconomy** (reneweconomy.com.au/feed/), **PV Magazine Australia**, **Energy Storage News**. Imported weekly via \`import_news_rss.py\`. Articles are fuzzy-matched to projects in the database and displayed on project detail pages.

### Tier 6: AEMO ISP & Planning Data
AEMO Integrated System Plan appendix Excel files — REZ hosting capacity limits, transmission augmentation timelines, and connection queue data. Imported annually via \`import_aemo_isp.py\`.

### Tier 7: Primary Sources
Developer websites, OEM announcements, EPC contractor announcements, Community/stakeholder submissions

---

## Key Design Decisions

### 1. Multi-Source Intelligence (Not Single-Source Truth)
Every key data point stores ALL reported values with source, date, and context. Conflicting information is shown, not hidden — it's a feature.

### 2. Nothing Is Ever Deleted
Old values move to history arrays. Every change has a timestamp and source.

### 3. Source Hierarchy with Recency Rule
When same-tier sources conflict, latest date wins for "current" display. All values preserved in history.

### 4. Pre-Computed Analytics
All rankings, scores, and aggregations computed at export time. PWA serves pre-built JSON — no runtime computation needed.

### 5. Mobile-First, Comprehensive Second
Bottom navigation with tabs on mobile. Progressive disclosure — simple surfaces, depth on demand. Desktop gets full sidebar navigation.

---

## Technology Stack

| Component | Choice |
|-----------|--------|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| PWA | vite-plugin-pwa |
| Charts | Recharts |
| Animations | Framer Motion |
| Search | Fuse.js |
| Routing | React Router 7 |
| Database | SQLite3 |
| Data Pipeline | Python 3.11+ |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |`,
  },
  {
    id: 'build-tracker',
    title: 'Build Progress',
    description: 'Current build status, phase progress, task checklists, and data population tracking.',
    icon: '📊',
    category: 'process',
    readingTime: '8 min read',
    content: `# AURES — Build Tracker

> **Last Updated:** 2026-03-29
> **Version:** v2.6.1
> **Current Phase:** Phase 3 — Performance Analytics (in progress)

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 100% |
| Phase 2: CIS/LTESA/REZ | ✅ Complete | 100% |
| Phase 2.5: NEM Dashboard | ✅ Complete | 100% |
| Phase 3: Performance Analytics | 🔧 In Progress | 90% |
| Phase 4: Confidence & Profiles | ✅ Complete | 100% |
| Phase 5: Data Enrichment Pipeline | ✅ Complete | 100% |
| Phase 6: BESS Deep Dive | ✅ Complete | 100% |
| Phase 7: Timeline & Analytics | ✅ Complete | 100% |
| Phase 8: EIS/EIA Intelligence | ✅ Complete | 100% |
| Phase 9: Developer Data Quality | ✅ Complete | 100% |
| Ongoing: Data Quality & Enrichment | 🔄 Continuous | — |

---

## Platform Stats (as of 22 March 2026)

| Metric | Count |
|--------|-------|
| Total projects | 1,067 |
| Wind farms | 211 |
| Solar farms | 228 |
| Battery (BESS) | 432 |
| Hybrid projects | 110 |
| Timeline events | 1,366 |
| OEM/supplier records | 217 |
| Offtake/PPA agreements | 85 |
| Projects with timelines | 677 |
| Frontend pages | 27 |
| Developers scored | 152 |
| Developers audited (data quality) | 20 |
| EIS projects extracted | 98 |
| Scheme-risk tracked projects | 17 |
| Intelligence features | 10 |
| OEM profiles | 34 |
| Contractor profiles | 45 |
| Offtaker profiles | 31 |

---

## Phase 1: Foundation ✅

- Created GitHub repo + CI/CD (GitHub Actions)
- React 19 + Vite 6 + TypeScript + Tailwind 4 + PWA
- SQLite database schema with full relational model
- Python AEMO Generation Information importer (1,064 projects)
- JSON export pipeline (SQLite → static JSON)
- Home dashboard, Project list (filters), Project detail (tabs)
- Universal search (Fuse.js), mobile bottom nav + desktop sidebar
- Deployed to GitHub Pages as PWA

## Phase 2: CIS/LTESA/REZ ✅

- CIS Tender 1–8 + Pilot rounds with all awarded projects
- LTESA Round 1–6 with contract details
- REZ analysis pages (NSW, VIC, QLD, SA, TAS zones)
- Scheme overview with round-by-round browsing
- REZ detail pages with project lists and capacity summaries

## Phase 2.5: NEM Dashboard ✅

- NEM-wide summary dashboard with technology breakdown
- Offshore wind toggle and filtering
- State-level capacity summaries

## Phase 3: Performance Analytics 🔧

### Completed
- OpenElectricity API integration for capacity factors, revenue, curtailment (annual + monthly)
- Performance league tables (wind, solar, BESS) for 2024, 2025, 2026 YTD
- BESS revenue breakdown (energy arbitrage vs FCAS)
- BESS capex analytics page with cost curves
- Volume-weighted price and marginal loss factor tracking
- OEM market share pie charts (by projects, MW, MWh)
- Intelligence Layer: 10 features (scheme risk, COD drift, wind resource, Dunkelflaute, energy mix, developer scores, revenue intelligence, grid connection, EIS/EIA technical intelligence, developer data quality)
- News Feed: RSS import with project fuzzy-matching
- OpenElectricity Monthly data import (seasonal analysis)
- AEMO ISP data import (REZ hosting capacity)
- Pipeline automation (launchd, admin.py --auto)
- Cmd+K cross-entity search modal
- Accessibility improvements (ARIA, skip-to-content, focus management)
- Mobile polish (ScrollableTable, Breadcrumbs, touch targets)
- Data visualisation export (PNG charts, CSV download)

### In Progress / Remaining
- Wind capacity factor analysis (AEMO registered vs nameplate discrepancy identified)
- Solar curtailment deep-dive
- Historical performance trend charts

## Phase 4: Confidence & Profiles ✅

- Auto-computed confidence ratings for all 1,064 projects
- Confidence filter on project list + breakdown on dashboard
- Developer profiles with portfolio stats and grouping (711 → 103 parent companies)
- OEM profiles with market share, technology breakdown, state presence
- Contractor profiles (45 EPC/BoP contractors)
- Offtaker profiles (31 offtakers with PPA tracking)
- Interactive map (Leaflet) with clustered markers
- COD drift tracking and analysis

## Phase 5: Data Enrichment Pipeline ✅

- EPBC referrals import with 4-tier development stage classification
- Development stage classification (AEMO Announced → Planning → Approved → Construction → Operating)
- Data freshness tracking per data source
- Multi-source enrichment SQL scripts
- Admin CLI tool for database management

## Phase 6: BESS Deep Dive ✅

- BESS supplier data (OEM, integrator, cell chemistry, inverter)
- Capex analytics with $/kW and $/kWh cost curves
- Operational timeline analysis
- Grid-forming inverter flags for ARENA-confirmed projects
- SIPS, SynCon, STATCOM, harmonic filter tracking

## Phase 7: Timeline & Analytics ✅

- Project timeline analytics page
- Multi-select filters across the app
- Developer grouping refinements
- Data sources page

## Phase 8: EIS/EIA Intelligence ✅

- EIS Technical page with 6 tabs (Wind, BESS, Solar, EIS vs Actual, Coverage, Grid Connection)
- 98 EIS projects extracted across 4 technologies (wind, BESS, solar, pumped hydro)
- EIS vs Actual CF comparison with 21 operating wind projects and interactive charts
- Coverage gap tracker with 153 identified projects and sortable tables
- PDF opportunity flagging system (61 opportunities prioritised by data gap severity)
- Grid connection analysis: voltage distribution (clickable drill-down), NSP table (sortable), connection distance analysis
- Connection substation data filled for 22 solar projects

## Phase 9: Developer Data Quality ✅

- Developer market share pie charts (Top Developers by MW/projects, By Technology)
- Developer Data Quality tab with 3 sub-sections:
  - Website Comparison: 20 top developer websites cross-referenced against AURES database
  - SPV Corrections: 610 project developer corrections (51 high confidence) with searchable/sortable/filterable table
  - Joint Ventures: 4 documented JV partnerships
- Data quality generator script (pipeline/generators/generate_developer_quality.py)
- Mobile version check accessibility (tappable header badge + slide-out menu button)

---

## Recent Data Enrichment Sessions

### CIS Success & Real API Data — 2026-03-27
- Added CIS Success tab to Scheme Intelligence with confirmed/not-confirmed CISA tracking tables
- CISA assumption analyzer with configurable month-since-award threshold (3/4/5/6 months)
- Replaced sample generation profile data with real Open Electricity API data (5 NEM regions, 25 seasonal profiles)
- Replaced sample coal watch data with real API facility-level data (4 NSW plants: Eraring, Bayswater, Vales Point, Mt Piper)
- Fixed coal importer: corrected Mt Piper facility code (MTPIPER→MP), unit codes, and unit→facility aggregation
- Fixed generation profiles importer: divided hourly power values by 12 (API sums 5-min intervals)
- Full accuracy audit of CIS/LTESA timeline — corrected fabricated project names, wrong capacities, wrong statuses across all 11 rounds
- Added collapsible timeline events with expand/collapse all
- Fixed scheme analysis modal scroll and keyboard navigation
- Enriched scheme analysis essay content with correct per-round project data
- Fixed developer doughnut chart to use grouped developer data (540 vs 711 ungrouped)

### EIS Intelligence & Developer Data Quality — 2026-03-22
- Built EIS/EIA Technical Intelligence page with 6 tabs: Wind, BESS, Solar, EIS vs Actual, Coverage, Grid Connection
- Extracted EIS data for 98 projects (33 wind, 36 BESS, 27 solar, 2 pumped hydro) — 100% coverage of available EIS documents
- Added EIS vs Actual CF comparison for 21 operating wind projects with grouped bar, scatter, and delta charts
- Built EIS Coverage Gap tracker with sortable tables, PDF opportunity flagging (61 opportunities: 16 high, 37 medium, 8 low priority)
- Added clickable voltage distribution chart drill-down and sortable NSP table on Grid Connection tab
- Created Developer Data Quality audit tab on Developers page:
  - Cross-referenced 20 top developer websites against AURES database (126 discrepancies found)
  - Identified 610 SPV-to-parent developer corrections (51 high confidence)
  - Documented 4 joint venture partnerships (Pottinger/AGL+Someva, MacIntyre/Acciona+Ark, Golden Plains/TagEnergy+Ingka, Yanco Delta/Origin+ViRYA)
- Added developer market share donut pie charts (by MW and project count) and technology breakdown pie chart
- Made version check button accessible on mobile (tappable header badge + slide-out menu button)
- Bumped version from v1.7.0 → v2.0.0 → v2.1.0 → v2.5.1 → v2.6.0 → v2.6.1
- New files: eis-comparison.json, eis-coverage.json, eis-pdf-opportunities.json, developer-data-quality.json, generate_developer_quality.py

### Wind Farm Deep Dive — 2026-03-12/13
- Researched all 90 operating/commissioning/construction wind farms
- Added 150+ timeline events (planning, FID, construction, energisation, COD)
- Corrected nameplate capacities for 18 wind farms (AEMO registered vs nameplate)
- Added OEM data for 74 wind farms (Vestas, GE, Goldwind, Suzlon, Senvion, Nordex, etc.)
- Added 58 current operator records
- Added 46 offtake/PPA agreements
- Added capex data for 8 construction-phase wind farms
- Added grid infrastructure flags (SynCon at Clarke Creek, Kaban; STATCOM at Stockyard Hill)

### BESS Deep Dive — 2026-03-11/12
- BESS supplier enrichment across all operating/construction batteries
- Grid-forming inverter flags for 10 ARENA-confirmed BESS projects
- Capex data and cost curve analytics
- Fixed boolean export bug (all projects incorrectly showing grid flags as Yes)

---

## Recently Completed

### Intelligence Layer (10 features)
- ✅ Scheme Risk — CIS/LTESA risk scoring with traffic light system (17 tracked projects)
- ✅ COD Drift Analysis — by technology, state, developer
- ✅ Wind Resource Assessment — capacity factor analysis
- ✅ Dunkelflaute Analysis — renewable energy drought risk + BESS coverage
- ✅ Energy Mix — by state and technology breakdown
- ✅ Developer Scores — execution grading A-F (152 developers scored)
- ✅ Revenue Intelligence — revenue trends by technology
- ✅ Grid Connection — REZ congestion analysis
- ✅ EIS/EIA Technical Intelligence — 98 projects extracted (wind, BESS, solar, pumped hydro), EIS vs actual CF comparison, coverage gap tracking, PDF opportunity flagging
- ✅ Developer Data Quality — website cross-referencing (20 developers), 610 SPV corrections, 4 JV partnerships, market share pie charts

### UX Enhancements
- ✅ Search: Cmd+K modal with cross-entity search (projects, developers, OEMs, contractors, offtakers), fuzzy matching via Fuse.js, recent searches
- ✅ Accessibility: ARIA labels, skip-to-content, focus management, screen reader support
- ✅ Mobile Polish: ScrollableTable with gradient indicators, Breadcrumbs, larger touch targets
- ✅ Data Visualisation Export: PNG chart export via html-to-image, CSV data download

### New Data Sources
- ✅ News Feed: RSS from RenewEconomy, PV Magazine AU, Energy Storage News (fuzzy-matched to projects)
- ✅ OpenElectricity Monthly: 12 data points per facility per year for seasonal analysis
- ✅ AEMO ISP: REZ hosting capacity and connection data

### Pipeline Automation
- ✅ \`scripts/aures-pipeline.sh\` shell wrapper for automated runs
- ✅ macOS launchd plist — weekly Monday 6am
- ✅ \`admin.py --auto\` flag — runs only steps exceeding frequency threshold
- ✅ Auto git commit and push on data changes

---

## What's Next

> **See the full [Strategic Roadmap](/guides/strategic-roadmap) for the complete plan.**

### Remaining Intelligence Features
- ⏳ Equipment Supply Chain Intelligence — OEM market share trends and lead time tracking

### Remaining Data Sources
- ⏳ NSW Planning Portal API integration
- ⏳ Global Wind Atlas wind speed data
- ⏳ FCAS revenue data (pending OE API support)

### Platform Evolution
- Testing framework (Vitest)
- Database migration consideration (SQLite to Supabase/Turso)
- User accounts, watchlist, and push notifications`,
  },
  {
    id: 'session-guide',
    title: 'Session Guide',
    description: 'How to resume development work across sessions. Resume prompts and useful commands.',
    icon: '🔄',
    category: 'process',
    readingTime: '3 min read',
    content: `# Session Continuity Guide

## How to Resume Work

When you start a new Claude session, use one of these prompts depending on where you are:

---

## Starting Prompt

Copy and paste this when starting a new session:

> I'm building the AURES database — an Australian renewable energy intelligence platform. The repo is at /Users/travishughes/aures-db
>
> Please read these files first to understand the full context:
> 1. docs/PROJECT-PLAN.md — Full architecture, phases, and data sources
> 2. docs/BUILD-TRACKER.md — Current progress and what's next
> 3. docs/VIBECODING-NOTES.md — What worked, approach notes
>
> Then continue building from where we left off.

---

## Quick Resume Prompts by Phase

**Phase 1 (Foundation):**
Continue building AURES. We're in Phase 1 — building the foundation (React + Vite PWA, SQLite schema, AEMO importer, core UI screens).

**Phase 2 (CIS/LTESA/REZ):**
We're in Phase 2 — building CIS/LTESA round views, REZ views, and the Watchlist risk dashboard.

**Phase 3 (Performance Analytics):**
We're in Phase 3 — building the AEMO SCADA data pipeline and operational performance league tables for Wind, Solar, and BESS.

**Phase 4 (Intelligence Layer):**
We're in Phase 4 — building the multi-source intelligence panels, differing views feature, and operations-to-development mapping.

**Data Enrichment:**
I want to add detailed data for specific projects/areas. Please research and populate the project fact sheets.

---

## Useful Commands

Start the dev server:
\`cd /Users/travishughes/aures-db/frontend && npm run dev\`

Build for production:
\`cd /Users/travishughes/aures-db/frontend && npm run build\`

Run the AEMO data import pipeline:
\`cd /Users/travishughes/aures-db && python pipeline/importers/aemo_generation_info.py\`

Export SQLite to JSON:
\`cd /Users/travishughes/aures-db && python pipeline/exporters/export_json.py\`

---

## Key Files to Read for Context

| File | What It Contains |
|------|-----------------|
| docs/PROJECT-PLAN.md | Full architecture, all phases, data sources, design decisions |
| docs/BUILD-TRACKER.md | Current progress — what's done, what's next, blockers |
| docs/VIBECODING-NOTES.md | How this was built, what worked, collaboration approach |
| docs/PLAIN-ENGLISH-OVERVIEW.md | Non-technical description of what AURES is and why |`,
  },
  {
    id: 'vibecoding-notes',
    title: 'How This Was Built',
    description: 'The vibecoding approach — what human and AI each contributed, what worked, and how to get the best results.',
    icon: '🤝',
    category: 'process',
    readingTime: '6 min read',
    content: `# Vibecoding Notes

## What Is Vibecoding?

This project is being built through a collaborative "vibecoding" approach — where the human provides the vision, domain expertise, and editorial direction, while Claude (AI) handles architecture design, research, code generation, and systematic execution.

It's not "AI writes code, human reviews it." It's more like a senior architect working with an extremely fast research assistant and builder.

---

## How This Project Came Together

### The Human Contribution (Travis)

Travis brought the domain expertise that no AI could generate:

1. **The Vision**: Not just "a database" but a multi-lens intelligence platform. The insight that the same data should be viewable from a dozen different angles came from real industry experience.

2. **The Depth Requirements**: Knowing that inverter models matter, that SIPS agreements are important, that STATCOM vs SynCon choices are trackable, that BoP contractors should be recorded — this level of granularity comes from working in the industry.

3. **The "No Hallucinations" Principle**: The non-negotiable requirement that every fact must be sourced, and that gaps should be honestly marked.

4. **The Multi-Source Philosophy**: The insight that "no one source is correct on all aspects" — that the database should embrace conflicting information rather than hiding it.

5. **Real-World Examples**: Using Yanco Delta as the exemplar forced the design to handle ownership changes, milestone payments, REZ access rights, and timeline drift.

6. **Priority Setting**: "I'm more interested in BESS and wind at the moment" and "I'm more interested in it being comprehensive than easy to use" — these editorial decisions shape hundreds of downstream choices.

### The Claude Contribution

Claude brought speed, breadth, and systematic thinking:

1. **Research**: Systematically searched 50+ sources to map the entire data landscape — what's freely available, what needs manual curation, what's behind paywalls.

2. **Architecture Design**: Translated the vision into a concrete three-layer architecture with specific technology choices, schema designs, and data models.

3. **Feasibility Analysis**: Honestly assessed what's possible and what's not. Didn't over-promise.

4. **Data Model Design**: Created the detailed JSON and SQL structures that handle multi-source data, confidence ratings, timeline events, and ownership chains.

5. **Scope Management**: Broke the vision into 5 phases with realistic timelines.

6. **Code Generation**: Writing the actual React, TypeScript, Python, and SQL code.

---

## What Worked Well

### 1. Iterative Design Through Conversation
The architecture evolved dramatically through conversation:
- Started as "a PWA with renewable energy data"
- Became a multi-lens database
- Evolved to include performance analytics and watchlists
- Matured into a full intelligence platform with multi-source triangulation

Each prompt refined and elevated the vision.

### 2. Real Examples as Design Drivers
Using Yanco Delta as the exemplar project forced the data model to handle:
- Ownership changes (Virya to Origin) with transaction values ($300M)
- Milestone-based payments ($125M + $175M)
- REZ access rights as a distinct event
- COD drift tracking over time
- Multiple sources reporting different aspects

### 3. Honest Feasibility Assessment
Rather than saying "yes, everything is possible," the approach was transparent:
- "This data exists and is freely available" (AEMO, OpenElectricity)
- "This data exists but requires manual research" (OEM choices, costs)
- "This data is very hard to find publicly" (harmonic filter sizes, SIPS terms)

### 4. Source-First Approach
By researching actual data sources before designing the system, the architecture fits reality rather than aspirations.

---

## How To Get The Best Results

### For the Human (Travis)

1. **Start each session with the resume prompt** from the Session Guide. This gives Claude full context.

2. **Review and redirect, don't micromanage**. Claude works best when given a direction rather than step-by-step instructions.

3. **Bring domain knowledge**. When Claude populates project data, review for accuracy. Your industry knowledge catches errors that source-checking alone won't find.

4. **Test on your phone regularly**. Install the PWA and use it. Real usage reveals UX issues that screenshots don't.

5. **Add data sources you find**. When you read an AFR article or RenewEconomy piece with project details, note the URL.

### For Claude (AI)

1. **Always read BUILD-TRACKER.md first** to understand current state.
2. **Don't invent data**. Mark unknowns as "Not yet verified".
3. **Commit frequently** with clear messages.
4. **Test the PWA build** before deploying.
5. **Update BUILD-TRACKER.md** at the end of every session.`,
  },
  {
    id: 'interactive-map',
    title: 'Interactive Map (Planned)',
    description: 'A zoomable map showing REZs, transmission networks, upgrade plans, and every tracked project by location.',
    icon: '🗺️',
    category: 'roadmap',
    readingTime: '5 min read',
    content: `# Interactive Map — Feature Vision

## Overview

An interactive map of Australia's energy infrastructure, letting you visually explore where projects are, how they connect to the grid, and what's planned.

---

## What the Map Will Show

### Renewable Energy Zones (REZs)

Every declared REZ across the NEM and WEM, shown as shaded regions on the map:

- **NSW REZs**: New England, Central-West Orana, Hunter-Central Coast, Illawarra, South West, Energy Connect
- **VIC REZs**: Murray River, Western Victoria, Gippsland, South West Victoria
- **QLD REZs**: Northern Queensland, Isaac, Fitzroy, Wide Bay, Darling Downs, Banana Range
- **SA REZs**: Mid-North, Leigh Creek, South East, Riverland, Eastern Eyre Peninsula
- **TAS**: North West, North East

Each REZ shows:
- Declared capacity and registered interest
- Number of projects within the zone
- Access right holders and status
- Click to see all projects in that REZ

### Transmission Network

The existing high-voltage transmission network overlaid on the map:
- 500kV, 330kV, 275kV, 220kV backbone lines
- Interconnectors (VIC-NSW, NSW-QLD, VIC-SA, Basslink, Marinus Link, VNI West, HumeLink, Sydney Ring)
- Key substations and connection points

### Transmission Upgrades (Planned & In Progress)

This is where the map gets really valuable. Each planned transmission upgrade shown with its current status:

- **HumeLink** — Status, route, capacity, which projects depend on it
- **VNI West** — Status, timeline, dependent projects
- **Sydney Ring** — Status, connection to Waratah Super Battery and Hunter REZ
- **Marinus Link** — Status, impact on Tasmanian wind export
- **CopperString 2.0** — Status, North QLD REZ enablement
- **Energy Connect** — Now operational, impact on NSW-SA flows
- **Central-West Orana REZ Transmission** — EnergyCo project, REZ access rights
- **New England REZ Transmission** — Status, dependent projects

Each upgrade shows:
- Current construction/planning status
- Expected completion date
- Which renewable projects require this upgrade to connect
- Developer/constructor information
- Cost estimates where available

### Project Locations

Every tracked project plotted on the map:
- Color-coded by technology (wind=blue, solar=amber, BESS=purple, hybrid=cyan)
- Size scaled by capacity (MW)
- Click any project to see its summary card
- Filter by technology, status, developer, or capacity range

---

## Interactivity

### State-Level View
Start zoomed out to see all of Australia. Each state shows aggregate statistics:
- Total capacity (operating + under construction + planned)
- Number of projects by status
- Key transmission constraints

### Zoom In
Zoom into any region to see individual projects, REZ boundaries, and transmission lines. At higher zoom levels, project labels appear and you can see substation names.

### Filter Controls
- Toggle layers: REZs, transmission, upgrades, projects
- Filter projects by technology, status, capacity
- Highlight projects dependent on specific transmission upgrades
- Show only projects in a specific CIS/LTESA round

---

## Technical Implementation

Built with **Leaflet.js** (open-source mapping library):
- GeoJSON for REZ boundaries (sourced from AEMO/EnergyCo planning documents)
- Polylines for transmission network routes
- Markers with custom icons for project locations
- Layer groups for toggling visibility
- Mobile-optimised touch interactions

### Data Sources for Map
- **AEMO ISP** — Transmission network topology, REZ definitions
- **EnergyCo** — NSW REZ boundaries and access rights
- **AEMO Connections Map** — Project locations and connection points
- **State planning portals** — Transmission upgrade routes and approvals

---

## Why This Matters

Understanding which projects will actually get built requires understanding the grid:
- A 500MW solar farm is useless if the transmission to export its power won't be built for 5 years
- REZ access rights determine who can connect and when
- Transmission constraints cause curtailment, reducing project economics
- Knowing which upgrades are on track (or delayed) directly affects project viability

The map makes these spatial relationships intuitive rather than abstract.`,
  },
  {
    id: 'nem-summary',
    title: 'NEM Summary Dashboard (Planned)',
    description: 'Live snapshot of installed renewables by type, what\'s under construction, and what\'s coming online in the next 12 months.',
    icon: '⚡',
    category: 'roadmap',
    readingTime: '6 min read',
    content: `# NEM Summary Dashboard — Feature Vision

## Overview

A high-level dashboard showing the current state and near-term trajectory of Australia's renewable energy fleet. Think of it as the "state of the nation" view — how much is operating, how much is being built, and what's expected to come online soon.

> **Note:** For detailed state-by-state generation mix analysis and forward projections, see the **Energy Mix** page in the Intelligence section, which tracks how each state's electricity generation is evolving toward decarbonisation.

---

## Dashboard Sections

### 1. Installed Capacity by Technology

A clear breakdown of what's currently operating in the NEM + WEM:

| Technology | Installed | Under Construction | Planned |
|-----------|-----------|-------------------|---------|
| Wind | XX GW | XX GW | XX GW |
| Solar (utility) | XX GW | XX GW | XX GW |
| BESS | XX GW / XX GWh | XX GW / XX GWh | XX GW / XX GWh |
| Pumped Hydro | XX GW | XX GW (Snowy 2.0) | XX GW |
| Hybrid | XX GW | XX GW | XX GW |

Each row is clickable — tap "Wind Under Construction" to see every wind project currently being built, with expected completion dates and current status.

### 2. Under Construction Pipeline

All projects currently in construction phase, grouped by expected Commercial Operation Date (COD):

**Q2 2026**
- Project A (Wind, 200MW, NSW) — On track
- Project B (BESS, 300MW/600MWh, VIC) — Delayed from Q1

**Q3 2026**
- Project C (Solar, 400MW, QLD) — On track
- Project D (Hybrid, 250MW + 100MW/200MWh, SA) — Early commissioning

**Q4 2026**
- ...

Each project shows:
- Technology and capacity
- Location and REZ
- Developer
- Original COD vs current expected COD
- On-track / Delayed / Ahead of schedule indicator
- Key risk flags (if any)

### 3. Coming Online — Next 12 Months

The critical forward-looking view. What new capacity is expected to reach COD in the next 12 months?

Summary statistics:
- **Total new capacity expected**: X.X GW generation + X.X GW / X.X GWh storage
- **By technology**: Wind XX MW, Solar XX MW, BESS XX MW/XX MWh
- **By state**: NSW XX MW, VIC XX MW, QLD XX MW, SA XX MW

Click into any project to see its full detail page.

### 4. How to Check if a Project Is on Time

This is the intelligence layer — practical guidance on how to verify whether a project will actually meet its stated COD:

#### Early Commissioning Registration with AEMO
- Projects register for "early commissioning" when they're close to generating
- Check the AEMO **Commissioning and Testing Register** for recent registrations
- If a project says COD is Q3 2026 but hasn't registered for commissioning by Q1 2026, it's likely delayed

#### Generator Performance Standards
- Before full commercial operation, projects need AEMO to approve their Generator Performance Standards (GPS)
- Check the GPS register for approved/pending status
- No GPS application = project is not close to operating

#### Connection Agreement Progress
- The AEMO **Connections Scorecard** shows where each project is in the connection process
- Stages: Application > Assessment > Offer > Agreement > Commissioning
- A project claiming "under construction" but still in "Offer" stage has a problem

#### Physical Construction Evidence
- Satellite imagery (Google Earth) can show construction progress
- Media reports and developer social media often show construction milestones
- Local council records may show construction activity

#### CIS/LTESA Milestone Deadlines
- CIS and LTESA contracts have milestone deadlines: Financial Close, Construction Start, First Generation, Full COD
- Missing milestones can result in contract cancellation
- DCCEEW publishes CIS progress updates

#### Developer Track Record
- Has this developer delivered other projects on time?
- AURES tracks developer delivery history across all their projects
- First-time developers or those with a history of delays are higher risk

#### Supply Chain Indicators
- Are the turbines/panels/batteries ordered?
- Is the EPC contractor confirmed?
- Are there known supply chain bottlenecks (e.g., transformer shortages)?

---

## Clickable Detail Layers

Every summary number on the dashboard is clickable:

- **"3.2 GW Wind Operating"** → Shows all operating wind projects, sorted by capacity
- **"800 MW BESS Under Construction"** → Shows all BESS projects in construction
- **"1.2 GW expected online by Q4 2026"** → Shows all projects targeting COD before Q4 2026

This makes the dashboard a powerful navigation tool, not just a static summary.

---

## Data Sources

- **AEMO Generation Information** — The definitive project universe, capacity, status, and expected COD
- **AEMO Commissioning and Testing Register** — Early commissioning registrations
- **AEMO Connections Scorecard** — Connection pipeline status
- **DCCEEW** — CIS milestone progress
- **Developer announcements** — Construction updates, financial close
- **RenewEconomy / AFR** — Project news and delay reporting

---

## Technical Implementation

The NEM Summary dashboard will be built as a dedicated page:
- Summary stat cards at the top (total by tech and status)
- Interactive bar/stacked chart showing capacity by technology and status
- Timeline view showing expected COD dates for the next 12 months
- Filterable project table for drill-down
- "How to check" section as an expandable guide panel

Charts built with **Recharts**, data sourced from the pre-computed JSON exports.

---

## Why This Matters

The NEM summary answers the question everyone in the industry asks: "What's actually happening?" Not what's planned or proposed, but what's being built right now and when it will be operating.

For investors, it shows the supply pipeline. For policy analysts, it shows whether targets are being met. For developers, it shows the competitive landscape. For anyone following the energy transition, it shows real progress (or lack thereof).`,
  },
  {
    id: 'using-aures',
    title: 'Using AURES on Your Phone',
    description: 'How to install the PWA, update to the latest version, and troubleshoot common issues.',
    icon: '📱',
    category: 'about',
    readingTime: '3 min read',
    content: `# Using AURES on Your Phone

## Installing the PWA

AURES is a Progressive Web App (PWA). You can install it on your phone for quick access:

### iPhone (Safari)
1. Open **https://travis-coder712.github.io/aures-db/** in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **Add to Home Screen**
4. Tap **Add** in the top right

### Android (Chrome)
1. Open **https://travis-coder712.github.io/aures-db/** in Chrome
2. Tap the **three-dot menu** in the top right
3. Tap **Add to Home Screen** or **Install App**
4. Confirm the installation

---

## Updating to the Latest Version

AURES uses a service worker to cache the app for offline use. This means your phone may show an older version even after updates are deployed. Here's how to force an update:

### Quick Fix — Hard Refresh
1. Open AURES in your phone's browser (not the installed PWA)
2. Pull down to refresh, or use the browser's reload button
3. The service worker will check for updates in the background
4. Close and reopen the app — the new version should load

### If That Doesn't Work — Clear Cache
**iPhone:**
1. Go to **Settings > Safari > Advanced > Website Data**
2. Find **travis-coder712.github.io** and swipe to delete
3. Reopen AURES in Safari

**Android:**
1. Go to **Settings > Apps > Chrome** (or your browser)
2. Tap **Storage > Clear Cache**
3. Reopen AURES

### Nuclear Option — Reinstall the PWA
1. Delete the AURES app from your home screen
2. Open the URL fresh in your browser
3. Reinstall using the steps above

---

## Troubleshooting

**App shows old data or missing pages:**
This is almost always a service worker cache issue. Follow the update steps above.

**App won't install:**
Make sure you're using Safari on iPhone or Chrome on Android. Other browsers may not support PWA installation.

**Pages load slowly:**
The first load fetches ~300KB of project data. Subsequent loads are cached and should be instant. If you're on a slow connection, give it a moment.

**Charts don't render:**
Make sure JavaScript is enabled in your browser settings. Some content blockers can interfere with chart rendering.

---

## Navigating on Mobile

AURES has a bottom navigation bar with quick access to the 5 most-used pages: Home, Projects, Performance, REZ, and Search.

To access all pages (Developers, OEMs, Contractors, Offtakers, Dashboard, Map, Schemes, Guides), tap the **hamburger menu** (three lines) in the top-left corner. This opens the full navigation sidebar.

---

## Key Pages

**Developers** — Browse 718 developers. Use the "Group variants" toggle to merge SPV/legal entities under their parent companies (~104 groups). Top-10 buttons give quick access to the biggest developers (ACEN, AGL, Hydro Tasmania, etc.).

**OEMs** — 17 equipment manufacturers (Vestas, Goldwind, Tesla, etc.). See which turbines or batteries are used in which projects.

**Contractors** — 20 EPC contractors. See who is building what.

**Offtakers & PPAs** — 19 offtakers with 48 tracked power purchase agreements. Filter by PPA type (corporate PPA, government PPA, tolling, etc.).

**Performance** — League tables ranking operating projects by capacity factor, revenue, and curtailment. Compare wind farms, solar farms, and batteries side by side.

**Data Sources** — Shows where AURES data comes from and when each source was last updated.`,
  },
  {
    id: 'performance-methodology',
    title: 'Performance Metrics Deep Dive',
    description: 'How capacity factor, curtailment, revenue, and BESS metrics are calculated — data sources, formulas, limitations, and caveats.',
    icon: '🔬',
    category: 'technical',
    readingTime: '10 min read',
    content: `# Performance Metrics — Deep Dive

This guide explains exactly how every metric on the Performance League Tables page is calculated, where the data comes from, and what the limitations are.

---

## Data Pipeline Overview

All performance data flows through this pipeline:

**AEMO NEMWEB** (5-minute dispatch intervals) → **OpenElectricity API** (aggregation & enrichment) → **AURES Python pipeline** (import, compute rankings) → **Static JSON** (served to your browser)

- **Source:** OpenElectricity API, which aggregates AEMO's 5-minute dispatch and settlement data
- **Frequency:** Annual aggregation (sum of ~105,000 five-minute intervals per year). Monthly data available but not yet imported.
- **Coverage:** All NEM-registered facilities. WEM (Western Australia) is **not** covered — WA projects appear in the database but without performance data.
- **Latency:** Settlement data lags real-time by 2-3 days
- **API plan:** Community (free), 500 requests/day

---

## Capacity Factor (CF%)

### What it measures
The ratio of actual energy output to the theoretical maximum if the plant ran at full nameplate capacity 24/7. It answers: "How hard is this plant working relative to what it could theoretically do?"

### Formula
\`CF = (Energy_MWh) / (Capacity_MW x 8,760) x 100\`

- **Energy_MWh:** Total metered energy dispatched to the grid over the year, from AEMO SCADA data
- **Capacity_MW:** Nameplate (registered) capacity from AEMO Generation Information — NOT maximum output or de-rated capacity
- **8,760:** Hours in a standard year (8,784 in a leap year). For YTD data, actual hours elapsed to date.

### What affects capacity factor
- **Resource quality:** Wind speed, solar irradiance at the site
- **Plant age:** Degradation of solar panels (0.3-0.5%/year) or turbine wear
- **Planned outages:** Scheduled maintenance windows
- **Unplanned outages:** Equipment failures, grid faults
- **Curtailment:** Output forced below capacity due to grid constraints or negative prices
- **Connection constraints:** Runback schemes limiting output at the connection point

### Typical ranges
| Technology | Poor | Average | Good | Excellent |
|-----------|------|---------|------|-----------|
| Wind | <25% | 25-32% | 32-40% | >40% |
| Solar | <18% | 18-22% | 22-26% | >26% |
| Pumped Hydro | 5-15% | 15-25% | 25-35% | n/a |

### Important caveats
- CF does **not** distinguish between voluntary curtailment (negative prices — a smart economic decision) and forced curtailment (constraints — a problem). A low CF could mean bad wind or smart market behaviour.
- **Hybrid projects** may have combined CF for co-located generation. AEMO tracks DUIDs separately but OpenElectricity may aggregate wind+solar at the same site.
- Comparing CF across technologies is meaningless — a 25% wind CF and 25% solar CF reflect very different realities.

---

## Curtailment (%)

### What it measures
The estimated percentage of potential generation that was NOT dispatched, despite available resource (wind/sun). It answers: "How much power was left on the table?"

### Why it's estimated (not exact)
AEMO does not publish a single "curtailment" number per facility. True curtailment requires comparing:
- Actual dispatch vs available capacity (from SCADA)
- Constraint equations that bound output
- Semi-scheduled generator UIGF (Unconstrained Intermittent Generation Forecast) vs actual

### Our method
Derived from dispatch data patterns — comparing expected output (resource availability x capacity) vs actual output. This is an **approximation**.

### Types of curtailment
1. **Economic curtailment** — Generator self-curtails during negative prices (voluntary, rational). Under-reported by our method.
2. **Network constraints** — AEMO directs reduced output due to transmission limits
3. **System security** — AEMO directs reduction for grid stability (frequency, inertia)
4. **Connection limits** — Runback schemes at the connection point cap output below nameplate

### Limitations
- Currently **indicative only**
- Under-reports economic curtailment (choosing not to generate)
- May over-report for plants with genuinely low output (old panels, poor siting)
- Future improvement: use NEMWEB constraint equation data directly for precise curtailment

---

## Revenue & Pricing

### Market Value ($)
Total wholesale energy revenue from the NEM spot market. This is the sum of energy dispatched x spot price at each 5-minute interval.

**What it excludes:**
- LGC (Large-scale Generation Certificate) revenue — worth $30-50/MWh for eligible projects
- PPA contract premiums or floors
- FCAS/ancillary services revenue
- Capacity payments (future CIS payments)

**Real-world revenue** for most renewable projects is 30-60% higher than the wholesale market value shown here.

### Price Received ($/MWh)
Volume-weighted average spot price at time of dispatch. Reflects the generator's price exposure profile.

\`$/MWh = Market Value ($) / Energy Generated (MWh)\`

A solar farm dispatching at midday will receive lower prices than a battery dispatching at evening peak. This metric reveals those differences.

### Revenue per MW (Rev/MW)
Total market revenue divided by nameplate capacity.

\`Rev/MW = Market Value ($) / Capacity (MW)\`

This is the key efficiency metric — it captures both how much a plant generates AND when it generates (price capture). Two wind farms with identical capacity factors can have very different Rev/MW if one is in a high-price state.

---

## BESS-Specific Metrics

Battery storage has fundamentally different metrics from generators.

### Charge / Discharge Energy
AEMO registers each battery as **two separate DUIDs** — a charging unit and a discharging unit. OpenElectricity tracks both. Discharged energy is always less than charged energy due to round-trip efficiency losses (typically 85-90% for lithium-ion).

### Price Spread ($/MWh)
\`Spread = Avg Discharge Price - Avg Charge Price\`

The core profit driver for BESS. A battery charges when prices are low (e.g. $20/MWh midday solar glut) and discharges when prices are high (e.g. $150/MWh evening peak). Higher spreads mean better arbitrage returns.

### Annual Cycles
\`Cycles = Total Energy Discharged (MWh) / Storage Capacity (MWh)\`

One cycle = fully discharging the battery's entire storage capacity once. Most NEM batteries do 1-2 full equivalent cycles per day. Higher cycles mean more throughput but also more wear on the battery.

### Utilisation (%)
\`Utilisation = Energy Discharged / (Capacity MW x Hours in Period) x 100\`

Percentage of time the battery was actively discharging. Note this only counts discharge — a battery spending 4 hours charging and 4 hours discharging has ~17% utilisation by this measure.

### What BESS revenue data misses
Our data captures **arbitrage revenue only** (buy low, sell high in the spot market). It does NOT include:
- **FCAS revenue** — batteries earn significant income from frequency regulation services, sometimes exceeding arbitrage revenue
- **Network support payments** — contracted grid stability services
- **Cap contract premiums** — financial hedging products

For many batteries, FCAS is 30-50% of total revenue. Our league tables therefore represent a floor, not the complete picture.

---

## Composite Rankings

### How projects are ranked
Each project receives a composite score (0-100) based on weighted metrics:

**Wind & Solar:**
| Metric | Weight |
|--------|--------|
| Capacity Factor | 40% |
| Revenue per MW | 40% |
| Curtailment (inverted) | 20% |

**BESS:**
| Metric | Weight |
|--------|--------|
| Revenue per MW | 30% |
| Utilisation | 30% |
| Price Spread | 20% |
| Cycles | 20% |

### Quartiles
Projects are divided into four equal groups based on composite score:
- **Q1** (green) — Top 25% performers
- **Q2** (blue) — Above median
- **Q3** (amber) — Below median
- **Q4** (red) — Bottom 25%

### Percentile rankings
Each metric also has a percentile ranking (0-100th percentile) showing where a project sits relative to all peers of the same technology.

---

## Known Limitations

1. **WEM not covered** — Western Australian projects (Collie Battery, etc.) have no performance data
2. **FCAS revenue excluded** — Especially impacts BESS rankings
3. **Curtailment is estimated** — Indicative, not precise
4. **Hybrid attribution** — Co-located wind+solar may have combined metrics
5. **New projects penalised** — Projects that started mid-year will show lower annual totals (CF is annualised to compensate, but revenue is not)
6. **Sample data fallback** — If real data is unavailable for a technology/year, projected estimates (marked with amber badge) are shown instead

---

## Want to verify our numbers?

The underlying data is publicly available:
- **OpenElectricity:** [openelectricity.org.au](https://openelectricity.org.au) — free facility-level data explorer
- **AEMO NEMWEB:** [nemweb.com.au](https://nemweb.com.au) — raw 5-minute dispatch files
- **AEMO Generation Information:** Published quarterly with registered capacities

If you spot a discrepancy, it's likely due to capacity differences (registered vs maximum), time period alignment, or DUID mapping. We welcome corrections.`,
  },
  {
    id: 'strategic-roadmap',
    title: 'Strategic Roadmap',
    description: 'Comprehensive review of infrastructure, UX, data strategy, and the 10-feature intelligence layer plan.',
    icon: '🗺️',
    category: 'roadmap',
    readingTime: '20 min read',
    content: `# AURES Strategic Roadmap

> **Last Updated:** 22 March 2026
> **Version:** v2.5.1 | **Projects:** 1,067 | **Intelligence Features:** 10 | **Developers Scored:** 152 | **EIS Projects:** 98

This document is the master plan for AURES. It covers a comprehensive review of the platform's code and infrastructure, UX quality, data enhancement strategy, and the design of the intelligence layer features that transform AURES from a database into an analytical platform.

---

## Part 1: Infrastructure & Code Quality Review

### Current Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19, Vite 7, TypeScript 5.9, Tailwind 4 | 25 pages, 12 hooks, 7 components |
| Data | SQLite (1 file, 19 tables) | Exported to static JSON for the PWA |
| Pipeline | Python 3 (16 scripts, ~7,000 lines) | Manual runs, no automation |
| Deploy | GitHub Actions → GitHub Pages | Push to main triggers build+deploy |
| PWA | vite-plugin-pwa, StaleWhileRevalidate | 7-day cache, 500 max entries |

### Priority Improvements

#### Tier 1 — High Impact, Low Effort ✅ COMPLETE

**Code Splitting (React.lazy)** ✅
All routes converted to React.lazy with Suspense fallbacks.

**Error Boundaries** ✅
Generic ErrorBoundary wrapping routes plus specific boundaries around chart-heavy pages.

**Icon Extraction** ✅
SVG icons extracted to dedicated icons file.

#### Tier 2 — High Impact, Medium Effort (Partial)

**Data Cache Layer** — ⏳ Planned
Each hook still fetches independently. TanStack Query or SWR migration planned for future sprint.

**Testing Framework** — ⏳ Planned
Vitest + @testing-library/react planned but not yet implemented.

**PWA Cache Versioning** ✅
Cache-busting implemented.

#### Tier 3 — Medium Impact ✅ COMPLETE

**Pipeline Automation** ✅
\`scripts/aures-pipeline.sh\` shell wrapper with macOS launchd scheduling (weekly Monday 6am). \`admin.py --auto\` flag runs only steps exceeding their frequency threshold. Auto git commit and push on data changes.

**Large Page Decomposition** ✅
Chart components extracted into ChartWrapper. ScrollableTable component for mobile. Sub-components extracted from large pages.

---

## Part 2: UX Assessment

### Current Scores (post-UX enhancements)

| Dimension | Score | Status |
|-----------|-------|--------|
| Navigation | 9/10 | ✅ Breadcrumbs added, Cmd+K search |
| Search | 9/10 | ✅ Cross-entity SearchModal, fuzzy matching, recent searches |
| Mobile | 9/10 | ✅ ScrollableTable, gradient indicators, larger touch targets |
| Accessibility | 8/10 | ✅ ARIA labels, skip-to-content, focus management |
| Error Handling | 8/10 | ✅ Error boundaries, Skeleton components |
| Data Viz | 9/10 | ✅ PNG export, CSV download, semantic figures |
| Code Quality | 8/10 | Clean TypeScript, ChartWrapper pattern |
| Design System | 7/10 | Good CSS variables, dark theme |
| **Overall** | **8.6/10** | **Major polish pass complete** |

### Priority UX Improvements

**1. Error Handling (5/10 → 8/10)** ✅ COMPLETE
- Error boundaries at route level with "Something went wrong. Tap to retry"
- Centralised Skeleton component with variants (card, table row, chart)
- Network error states with retry buttons on all data-fetching pages

**2. Search (6/10 → 9/10)** ✅ COMPLETE
- Cmd+K / Ctrl+K keyboard shortcut opening a SearchModal from any page
- Cross-entity search: projects, developers, OEMs, contractors, offtakers
- Fuzzy matching via Fuse.js with relevance-ranked results
- Recent searches persisted in localStorage
- Mobile: tap the search icon in the header

**3. Accessibility (6/10 → 8/10)** ✅ COMPLETE
- aria-label on all icon-only buttons (hamburger, search, filter chips)
- aria-current="page" on active NavLinks
- Skip-to-content link for keyboard navigation
- Focus management on route changes
- Screen reader support throughout

**4. Mobile Polish (7/10 → 9/10)** ✅ COMPLETE
- ScrollableTable component with gradient indicators for horizontal scroll
- Breadcrumb navigation visible on tablet+ breakpoints
- Larger touch targets on chart elements
- Touch-friendly chart tooltips

**5. Data Visualization (8/10 → 9/10)** ✅ COMPLETE
- PNG chart export via html-to-image (share button on every chart)
- CSV data download for filtered datasets
- Semantic figure + figcaption elements around all charts (ChartWrapper component)
- Responsive chart sizing using ResponsiveContainer everywhere

---

## Part 3: Data Enhancement Strategy

### Current Data Coverage

| Metric | Count | Coverage |
|--------|-------|----------|
| Total projects | 1,064 | — |
| With timeline events | 677 | 63.6% |
| With coordinates | 250 | 23.5% |
| With performance data | 221 | 20.8% |
| With supplier records | 134 | 12.6% |
| With offtake/PPA data | 60 | 5.6% |

### 8 Data Sources (5 complete, 3 planned)

#### 1. NSW Planning Portal API
**URL:** api.apps1.nsw.gov.au/eplanning/data/v0/OnlineDA
**Provides:** DA status, lodge date, determination date, conditions of consent, modification applications.
**Approach:** New importer matching projects by developer name and location. New planning_approvals database table.
**Priority:** HIGH — NSW has the most projects and the only proper API.

#### 2. Other State Planning Portals
VIC (planning.vic.gov.au), QLD (planning.statedevelopment.qld.gov.au), SA (plan.sa.gov.au).
**Approach:** Web scraping (no public APIs). Start with SA PlanSA which has the most structured HTML.
**Priority:** MEDIUM — Do after NSW is working.

#### 3. EIS Document Mining
Environmental Impact Statements are typically 500-2000 page PDFs containing wind speed measurements, turbine layouts, noise assessments, grid connection details, and vegetation clearing data.
**Approach:** Download PDFs from EPBC referral links and NSW Planning Portal. Use pdfplumber for text extraction. Regex patterns for structured fields. For scale, use an LLM API for unstructured extraction.
**New data:** Wind speed (m/s), hub height (m), rotor diameter (m), number of turbines, noise limits (dBA), grid connection voltage (kV).
**Priority:** HIGH for wind projects — EIS docs contain data available nowhere else.

#### 4. OEM & Developer Websites
Vestas, GE Vernova, and Goldwind publish project reference lists. Origin, AGL, Neoen, and other listed developers publish project updates and ASX announcements.
**Approach:** Per-source scrapers storing raw announcements in a news_items table, auto-linked to projects.
**Priority:** MEDIUM — good for filling OEM gaps and tracking ownership changes.

#### 5. News Feed Automation ✅ COMPLETE
RenewEconomy (reneweconomy.com.au/feed/), PV Magazine Australia, Energy Storage News.
**Implementation:** \`import_news_rss.py\` fetches RSS weekly, fuzzy-matches article titles against project names, stores in news_articles table with project linkage. Articles appear on project detail pages.

#### 6. OpenElectricity Monthly Data ✅ COMPLETE (FCAS pending)
**Implementation:** \`import_openelectricity.py\` extended to fetch monthly intervals — 12 data points per facility per year enabling seasonal analysis. Used by Dunkelflaute analysis and revenue intelligence features.
**Remaining:** FCAS revenue data pending OpenElectricity API support for FCAS market endpoints.

#### 7. Global Wind Atlas
**URL:** globalwindatlas.info — provides modeled mean wind speed at 100m/150m hub heights at 250m spatial resolution.
**Approach:** For each geolocated wind project (currently 250), query the API for modeled wind speed. Store as modeled_wind_speed_100m, modeled_wind_speed_150m columns.
**Priority:** HIGH — enables the Wind Resource Quality Assessment intelligence feature.

#### 8. AEMO ISP Data ✅ COMPLETE
The Integrated System Plan publishes REZ hosting capacity limits, transmission augmentation timelines, and connection queue data.
**Implementation:** \`import_aemo_isp.py\` parses ISP appendix Excel files (published annually). REZ hosting capacity data integrated. Used by the Grid Connection Bottleneck Analysis intelligence feature.

### Keeping Data Up To Date

**Automated (GitHub Actions cron):**
- AEMO Generation Info: 1st of each month
- OpenElectricity annual: Quarterly (Jan/Apr/Jul/Oct)
- OpenElectricity YTD: 15th of each month
- EPBC referrals: 1st of each month
- News feeds (RSS): Daily

**Semi-automated (local + Claude):**
- EIS document mining: Ad hoc when new EIS published
- Web research: Triggered by news feed matches
- Planning portal checks: Monthly manual review

**API Rate Limit Management:**
New api_rate_limits table tracking daily usage per API. OpenElectricity budget: ~100 req/day for automation, 400 for ad-hoc research.

---

## Part 4: The Intelligence Layer — 10 Features (9 Complete, 1 Planned)

### Feature 1: CIS/LTESA Project Risk Tracker ✅ COMPLETE

**What it does:** Analyses projects that won CIS or LTESA scheme contracts to assess delivery risk. Flags projects that haven't reached FID, are experiencing COD drift, or were awarded to already-operating assets. Provides a traffic-light risk score.

**Why it matters:** The CIS and LTESA schemes have awarded contracts to dozens of projects, but many face significant delivery challenges. Some contracts went to projects already in operation or construction — potentially diluting the scheme's intent to incentivise new build. Identifying at-risk projects early enables better policy and investment decisions.

**Key questions it answers:**
- Which CIS/LTESA projects have reached FID? Which haven't?
- How many were already operating or in construction when awarded?
- What is the aggregate COD drift for scheme-funded projects vs the broader pipeline?
- Which projects are most at risk of missing their contractual deadlines?

**Data sources:** scheme_contracts table, timeline_events (FID milestones), cod_history, performance_annual, web research for contract deadlines.

**UI:** Traffic-light risk table (Green/Amber/Red). Timeline visualisation showing each project's actual progress vs required milestones. Summary KPIs.

---

### Feature 2: COD/FID Drift Analysis (Aggregate) ✅ COMPLETE

**What it does:** Extends the existing per-project COD drift tracking into a statistical analysis of delay patterns across the entire fleet. Identifies which factors predict delay — technology type, project size, state, developer.

**Why it matters:** Project delays are systemic in Australian renewables. Understanding the patterns (do larger projects delay more? do certain developers consistently miss timelines? are certain states slower?) enables better project evaluation and planning assumptions.

**Key questions it answers:**
- What is the median COD drift by technology? (Wind vs Solar vs BESS vs Hybrid)
- Do bigger projects experience more delay?
- Which states have the slowest approval-to-operation timelines?
- Is drift getting worse or better over time?
- Which developers are "serial delayers"?

**Data sources:** cod_history, timeline_events, projects (technology, capacity_mw, state, developer).

**UI:** Box plot charts by technology. Heat map (state x technology). Scatter plot (capacity vs drift). Developer leaderboard sorted by average drift. Trend line over time.

---

### Feature 3: Wind Resource Quality Assessment ✅ COMPLETE

**What it does:** Predicts expected capacity factors for development-stage wind projects based on their location. Uses modeled wind speed data from Global Wind Atlas and a regression model trained on operating wind farms' actual performance.

**Why it matters:** A wind project's long-term viability depends on the quality of the wind resource at its location. By comparing modeled wind speeds against actual capacity factors of operating farms, we can predict whether a proposed project is in a good location — crucial for evaluating CIS/LTESA project viability.

**Key questions it answers:**
- What capacity factor can we expect from this development-stage wind project?
- How does this location compare to the best and worst performing wind farms?
- Are any CIS/LTESA wind projects in poor resource areas?
- What is the R-squared between modeled wind speed and actual capacity factor?

**Data sources:** Global Wind Atlas API (wind speed at hub height), performance_annual (actual CF for operating farms), project coordinates.

**UI:** Map overlay with wind speed contours. Scatter plot of modeled wind speed vs actual CF. Table of development projects ranked by predicted CF. Resource rating badges (Excellent/Good/Average/Poor).

---

### Feature 4: EIS/EIA Technical Intelligence ✅ COMPLETE

**What it does:** Extracts and structures technical specifications from Environmental Impact Statement PDFs across all technologies. Provides EIS vs actual performance comparison for operating projects. Tracks coverage gaps and flags PDF download opportunities for future data extraction.

**Why it matters:** EIS documents contain the most detailed technical information about a project — data that exists nowhere else publicly. Extracting and structuring this data unlocks deep technical comparison and due diligence. Comparing EIS predictions against actual operational performance reveals systematic optimism bias in environmental approvals.

**Key questions it answers:**
- What hub height, rotor diameter, and capacity factor was assumed in this wind farm's EIS?
- How does the EIS-predicted capacity factor compare to actual operational performance?
- What grid connection voltage, substation, and distance is planned for each project?
- Which projects have EIS documents available but data not yet extracted?
- What is the EIS coverage rate across the project database?

**Data sources:** eis_technical_specs table (SQLite), performance_annual (for EIS vs actual comparison), manually curated coverage gap and PDF opportunity data.

**UI:** 6-tab page — Wind specs, BESS specs, Solar specs, EIS vs Actual (grouped bar, scatter, delta charts), Coverage (extracted + gap tables with PDF opportunity flags), Grid Connection (voltage distribution with drill-down, NSP table, connection distance analysis). 98 projects extracted (33 wind, 36 BESS, 27 solar, 2 pumped hydro). 21 operating wind projects with EIS vs actual CF comparison showing average -11.4% delta.

---

### Feature 5: Dunkelflaute Detection & Analysis ✅ COMPLETE

**What it does:** Identifies periods of simultaneous low wind and solar generation across the NEM. Analyses frequency, duration, geographic extent, and models the impact on BESS dispatch and grid reliability.

**Why it matters:** Dunkelflaute events (periods of low wind and low solar simultaneously) are critical stress tests for a renewable-dominated grid. Understanding their frequency and severity helps assess whether the BESS pipeline is sufficient and which wind farms are most affected.

**Key questions it answers:**
- How often do Dunkelflaute events occur? In which months?
- When one state has low wind, do neighbouring states also?
- During the worst Dunkelflaute on record, how much did wind generation drop? Which farms were hit hardest?
- Given current BESS capacity, how many hours of backup does each state have during a Dunkelflaute?

**Data sources:** OpenElectricity monthly generation data by NEM region, project capacity by state, BESS storage capacity.

**UI:** Calendar heat map (wind+solar combined CF by month by region). Dunkelflaute event timeline. Cross-region correlation matrix. BESS adequacy analysis cards. Historical trend line.

---

### Feature 6: State Energy Mix Transition Tracker ✅ COMPLETE

**What it does:** Visualises how each state's electricity generation mix has evolved — the retirement of coal, the growth of wind/solar/BESS, and the path toward decarbonisation. Projects forward based on the committed and development pipeline.

**Why it matters:** Each state is on a different trajectory. Tasmania is nearly 100% renewable. Victoria and NSW are racing to replace coal. Queensland has the largest pipeline. Understanding these trajectories helps assess where investment is heading.

**Key questions it answers:**
- What percentage of each state's generation is now renewable?
- When will each state reach 50%, 80%, 100% renewables?
- Which specific projects are driving the transition in each state?
- How realistic are the forward projections given historical delivery rates?

**Data sources:** OpenElectricity historical generation by fuel type by NEM region. AURES pipeline by state/technology/status/COD.

**UI:** Stacked area chart per state. Forward projection zone (shaded). Small multiples for state comparison. Key milestone markers (coal closures). Click on future year to see assumed projects.

---

### Feature 7: Developer Execution Scoring ✅ COMPLETE

**What it does:** Rates each developer on their track record of delivering projects on time, at stated capacity, and through to operation. Provides an execution reliability score that contextualises the credibility of their development pipeline.

**Why it matters:** A developer with 5 GW in their pipeline but a history of delays and withdrawals is very different from one with 500 MW and a perfect delivery record. Execution scoring adds crucial context to pipeline announcements and scheme contract awards.

**Key questions it answers:**
- What is this developer's average COD drift?
- What percentage of their announced projects actually reach operation?
- How long do they typically take from FID to COD?
- How credible is their current pipeline given their track record?

**Data sources:** developer-profiles.json, cod_history, timeline_events, projects.status.

**UI:** A-F rating badge on DeveloperDetail. Radar chart (speed, reliability, scale, experience). Developer comparison tool. Pipeline credibility view flagging large pipelines with poor execution scores.

---

### Feature 8: Equipment Supply Chain Intelligence ⏳ PLANNED

**What it does:** Tracks OEM market share trends over time, technology evolution (turbine size, BESS chemistry), and lead time intelligence.

**Why it matters:** Understanding which OEMs are winning in the Australian market, how turbine sizes are evolving, and what lead times look like helps developers plan procurement and helps analysts understand technology trends.

**Key questions it answers:**
- Which wind OEM has gained the most market share in the last 3 years?
- What is the average turbine capacity installed each year? (showing the trend toward larger turbines)
- What is the average time from equipment order to COD?
- Which BESS chemistry (LFP, NMC) is dominating new orders?

**Data sources:** suppliers table, oem-profiles.json, timeline_events (equipment_order dates).

**UI:** Animated market share pie chart (slider by year). Technology evolution line chart (average turbine MW over time). OEM comparison table. Lead time analysis.

---

### Feature 9: Market Revenue Intelligence ✅ COMPLETE

**What it does:** Benchmarks project revenue performance, analyses merchant vs contracted revenue exposure, and provides BESS-specific revenue decomposition (energy arbitrage vs FCAS).

**Why it matters:** Understanding actual revenue performance — not just capacity factor — is critical for investment analysis. BESS revenue in particular is complex, with significant FCAS contribution that varies dramatically by market conditions.

**Key questions it answers:**
- What does a top-quartile wind farm earn per MWh vs the fleet average?
- What proportion of BESS revenue comes from FCAS vs energy arbitrage?
- Which projects are fully merchant vs fully contracted? What is the revenue difference?
- Are revenues trending up or down by technology?

**Data sources:** performance_annual (revenue, price), offtakes (PPA status), OpenElectricity FCAS data.

**UI:** BESS revenue waterfall chart. Revenue heat map (monthly per MW). Merchant exposure analysis. Quartile benchmark cards. Year-over-year trend.

---

### Feature 10: Grid Connection Bottleneck Analysis ✅ COMPLETE

**What it does:** Identifies where projects are stuck in the grid connection process, maps queue congestion by REZ and network service provider, and quantifies the systemic impact of connection delays.

**Why it matters:** Grid connection is the single biggest bottleneck in Australian renewable energy development. Projects can wait 3-5 years for a connection agreement. Understanding where the queues are longest and which NSPs are slowest enables better site selection and policy focus.

**Key questions it answers:**
- Which REZs have the most queued capacity relative to hosting capacity?
- How long does it take from planning approval to grid connection in each REZ?
- Which NSP (Transgrid, ElectraNet, AusNet, etc.) processes connections fastest?
- How much capacity and investment is held up by connection delays?

**Data sources:** projects (connection_status, connection_nsp, rez), AEMO TCPR data, ISP hosting capacity.

**UI:** Map with REZ boundaries coloured by queue congestion. REZ detail cards. Connection journey Gantt chart. NSP comparison table.

---

## Part 5: What's Next

### Completed Summary (as of v2.5.1, 27 March 2026)

**Infrastructure:** ✅ Code splitting, error boundaries, icon extraction, pipeline automation (launchd + admin.py --auto)
**UX:** ✅ Cmd+K search, accessibility, mobile polish, data viz export, mobile version check
**Data Sources:** ✅ News RSS (3 feeds), OE monthly, AEMO ISP, EIS documents (98 projects). ⏳ NSW Planning Portal, Global Wind Atlas, FCAS data
**Intelligence:** ✅ 10 of 11 features complete. ⏳ Supply Chain Intelligence
**Developer Quality:** ✅ 20 developer websites audited, 610 SPV corrections, 4 JV partnerships documented

### Remaining Work

**Intelligence Features (1 remaining)**
- Feature 8: Equipment Supply Chain Intelligence — OEM market share trends over time, technology evolution, lead time tracking

**Data Sources (3 remaining)**
- NSW Planning Portal API — DA status, determination dates, conditions of consent
- Global Wind Atlas — modeled wind speed at hub height for every geolocated wind project
- FCAS revenue data — pending OpenElectricity API support for FCAS market endpoints

**Data Quality Actions (from Developer Audit)**
- Apply high-confidence SPV corrections (51 projects) to SQLite database
- Add EDF Renewables to developer data (Dawson Wind 600MW, Banana Range Wind 230MW in development)
- Update JV developer assignments (Pottinger = Someva/AGL, MacIntyre = Acciona/Ark Energy)
- Extract EIS data for 61 flagged PDF opportunities (16 high priority)

**Platform Evolution**
- Testing framework (Vitest + @testing-library/react)
- Data cache layer (TanStack Query or SWR)
- Database migration consideration (SQLite to Supabase/Turso for concurrent writes)
- User accounts + Watchlist feature
- Push notification alerts for project milestone changes
- SA PlanSA and VIC planning portal scrapers
- ASX announcement parser for listed developers`,
  },
  {
    id: 'search-tips',
    title: 'Search Tips',
    description: 'How to use the Cmd+K search modal to find projects, developers, OEMs, contractors, and offtakers.',
    icon: '🔍',
    category: 'about',
    readingTime: '2 min read',
    content: `# Search Tips

## Opening Search

**Desktop:** Press **\u2318K** (Mac) or **Ctrl+K** (Windows/Linux) from any page to open the search modal instantly.

**Mobile:** Tap the **search icon** in the header bar.

You can also click the search bar in the navigation sidebar.

---

## What You Can Search

AURES search spans five entity types in a single query:

| Entity | Examples |
|--------|----------|
| **Projects** | "Waratah Super Battery", "Goyder South", "Snowy 2.0" |
| **Developers** | "ACEN", "Neoen", "Goldwind" |
| **OEMs** | "Vestas", "Tesla", "GE Vernova" |
| **Contractors** | "UGL", "Downer", "Bouygues" |
| **Offtakers** | "Origin", "AGL", "CleanCo" |

Results are grouped by type so you can quickly find what you need.

---

## Fuzzy Matching

Search uses **fuzzy matching** powered by Fuse.js. This means:

- You don't need exact spelling — "watara batt" will still find "Waratah Super Battery"
- Partial matches work — "gold" finds both "Goldwind" (OEM) and "Golden Plains" (project)
- Results are ranked by relevance, with closer matches appearing first

### Tips for Better Results

- **Be specific when you can** — "Clarke Creek Wind" is better than just "Clarke"
- **Use key words** — technology names, state names, or company names narrow results fast
- **Try abbreviations** — "BESS", "CIS", "LTESA" work as search terms
- **Developer names** — search by the parent company name for grouped results

---

## Recent Searches

The search modal remembers your **recent searches** and shows them when you open it. This makes it quick to jump back to entities you were recently researching.

Recent searches are stored locally in your browser and persist across sessions.

---

## Keyboard Navigation

Once the search modal is open:

- **Type** to filter results in real time
- **Arrow keys** (\u2191\u2193) to move between results
- **Enter** to navigate to the selected result
- **Escape** to close the modal

---

## On Mobile

On mobile devices, the search modal opens full-screen for easier typing and browsing. Tap any result to navigate directly to that entity's detail page. The back button or swipe gesture returns you to where you were.`,
  },
  {
    id: 'data-quality',
    title: 'Data Quality Audit',
    description: 'Automated data quality checks, issue taxonomy, and methodology for identifying and resolving data accuracy problems.',
    icon: '🔬',
    category: 'technical',
    readingTime: '10 min read',
    content: `# Data Quality Audit

> **Last Updated:** 2026-03-27
> **Script:** \`pipeline/generators/generate_data_quality.py\`
> **Output:** \`frontend/public/data/analytics/data-quality.json\`

AURES aggregates data from 10+ sources (AEMO, OpenElectricity, CIS/LTESA announcements, developer websites, EIS documents). When the same physical project appears in multiple sources under slightly different names, capacities, or statuses, data quality issues can emerge. This guide documents the automated audit system and the taxonomy of issues it detects.

---

## How to Run the Audit

\`\`\`bash
cd /path/to/aures-db
python3 pipeline/generators/generate_data_quality.py
\`\`\`

The script:
1. Loads all 1,000+ project JSON files from \`frontend/public/data/projects/\`
2. Parses scheme entries from \`scheme-rounds.ts\` and \`esg-tracker-data.ts\`
3. Runs 5 automated checks (see below)
4. Writes a structured report to \`data-quality.json\`
5. Prints a summary with high-severity issues to the console

Run it **after every data import or manual edit** to catch regressions.

---

## Issue Taxonomy

### 1. Identity Confusion (similar_names)

**What:** Two distinct projects with similar names that could be mixed up.

**Examples found and fixed:**
- **Willogoleche Wind Farm** (operating, 120 MW) vs **Willogoleche 2 Wind Farm** (development, 108 MW) — CIS data was incorrectly linked to the operating project
- **Mokoan Solar Farm** (operating, 46 MW) vs **West Mokoan Solar Farm and BESS** (development, 300 MW) — scheme entry was pointing to the wrong project_id

**Detection:** Fuzzy name matching (SequenceMatcher) with smart filtering to exclude legitimate patterns:
- Explicit stage/phase numbering (Stage 1 vs Stage 2)
- Co-located different technologies (Solar + BESS at same site)
- Directional variants (North vs South)
- Numbered suffixes (BESS 1 vs BESS 2)

**Resolution:** Verify each flagged pair. If they're genuinely distinct, no action needed. If confused, create separate project files and fix cross-references.

---

### 2. Cross-Reference Mismatch (name_mismatch)

**What:** A scheme entry's \`project_id\` points to a project file whose name doesn't match.

**Examples:**
- Scheme says "Kentbruck Wind Farm" but project file is "Kentbruck Green Power Hub"
- Scheme says "Teebar BESS" but project file is "Teebar Creek Battery Storage - KCI"

**Detection:** Name similarity score < 60% between scheme entry name and linked project file name.

**Resolution:** Either the scheme name or project name needs updating, or the project_id is wrong.

---

### 3. Capacity Discrepancy (capacity_mismatch)

**What:** Scheme-contracted capacity differs significantly (>20%) from the project file capacity.

**Important context:** This is often **legitimate** — a scheme may contract for Stage 1 of a larger project, or for partial capacity. The audit distinguishes:
- **Staged projects:** Flagged as "info" when scheme name contains "Stage" and capacity < total
- **Non-staged mismatches:** Flagged as "warning" or "high" — these need investigation

**Examples found and fixed:**
- **Liddell BESS:** Was listed as 250 MW in CIS Pilot and 500 MW in LTESA R2, but it's one project with one 500 MW contract under the combined round

**Resolution:** Verify which capacity is correct. If it's a staged contract, add a note. If it's wrong, fix it.

---

### 4. Status Drift (status_drift)

**What:** A scheme entry's \`stage\` (operating/construction/development) doesn't match the project file's \`status\`.

**Example found and fixed:**
- **West Mokoan Solar Farm** was listed as \`stage: 'operating'\` in ESG tracker but the project file correctly shows \`status: 'development'\`

**Detection:** Direct comparison of scheme stage vs project status.

**Resolution:** Update the stale status — usually the project file is more current.

---

### 5. Multi-Scheme Duplicate (multi_scheme_duplicate)

**What:** Same \`project_id\` appears in multiple scheme rounds. May indicate double-counting.

**Example found and fixed:**
- **Liddell BESS** appeared in both CIS Pilot NSW (250 MW) and LTESA Round 2 (500 MW) — these were one combined round, not two separate contracts

**Detection:** Group scheme entries by project_id, flag those appearing 2+ times. Higher severity when capacities differ across rounds.

**Resolution:** Verify whether the project genuinely has multiple contracts or if rounds were double-listed.

---

### 6. Orphaned Reference (orphaned_reference)

**What:** A scheme entry references a \`project_id\` that doesn't exist as a project file.

**Detection:** Check every scheme project_id against the project file index.

**Resolution:** Either create the missing project file or fix the project_id.

---

### 7. Technology Mismatch (technology_mismatch)

**What:** Scheme says one technology but the project file says another.

**Detection:** Direct comparison, allowing hybrid to match solar/bess.

---

### 8. Missing Coordinates & Empty Timelines

**What:** Operating/construction projects without map coordinates or timeline events.

**Detection:** Simple field presence checks for active projects.

---

## Common Root Causes

| Root Cause | How It Manifests |
|-----------|-----------------|
| **Name evolution** | Project changes name during development (e.g. "Kentbruck Wind Farm" → "Kentbruck Green Power Hub") |
| **Source disagreement** | AEMO uses one name/capacity, CIS announcement uses another |
| **Partial contracting** | Scheme contracts for Stage 1 or partial capacity; project file shows total |
| **Combined rounds** | CIS Pilot NSW and LTESA R2 were one combined round but modelled as two |
| **SPV vs parent** | Developer registered as SPV (e.g. "Willogoleche Power Pty Ltd") vs parent ("ENGIE") |
| **Stale status** | Project progresses but scheme tracker isn't updated |

---

## Audit Results Summary (27 March 2026)

| Metric | Count |
|--------|-------|
| Projects scanned | 1,068 |
| Scheme entries parsed | 187 |
| Total issues found | 243 |
| High severity | 62 |
| Warning | 94 |
| Info | 87 |

### Issues by Type

| Type | Count | Description |
|------|-------|-------------|
| similar_names | 105 | Pairs of projects with similar names — most are legitimate (stages, co-located tech) |
| multi_scheme_duplicate | 79 | Projects appearing in multiple scheme rounds |
| capacity_mismatch | 36 | Scheme capacity differs from project file |
| name_mismatch | 12 | Scheme name significantly different from project file name |
| missing_coordinates | 9 | Active projects without map coordinates |
| technology_mismatch | 2 | Scheme and project disagree on technology type |

### Key Issues Resolved This Session

1. **Willogoleche / Willogoleche 2** — Created separate project file for Willogoleche 2 (development, 108 MW). Fixed CIS Tender 4 references to point to new project instead of operating Willogoleche.
2. **Mokoan / West Mokoan** — Fixed project_id in scheme data: West Mokoan now correctly points to \`west-mokoan-solar-farm-and-bess\` instead of \`mokoan-solar-farm\`. Fixed status from "operating" to "development".
3. **Liddell BESS** — Consolidated to single 500 MW entry under CIS Pilot NSW. Removed duplicate from LTESA Round 2 (same combined round, one contract).

### Issues Requiring Future Investigation

- **Smithfield Battery (235 MW in CIS Pilot vs 65 MW in project file)** — likely same combined round issue as Liddell
- **Orana BESS** — appears in both CIS Pilot and LTESA R2, may need same consolidation as Liddell
- **Hargaves BESS vs Hargraves BESS** (300 MW vs 710 MW) — possible spelling error creating duplicate
- **Blue Mackerel North Off Shore vs Offshore** — likely duplicate from capitalisation difference

---

## Recommended Workflow

1. **After data import:** Run \`python3 pipeline/generators/generate_data_quality.py\`
2. **Review high-severity issues** printed to console
3. **Fix confirmed issues** in the relevant source files (project JSON, scheme-rounds.ts, esg-tracker-data.ts, export_json.py)
4. **Re-run audit** to verify fixes and check for regressions
5. **Commit** the updated data-quality.json alongside your fixes`,
  },
]

export const GUIDE_CATEGORIES = {
  about: { label: 'About AURES', color: '#0ea5e9' },
  technical: { label: 'Technical', color: '#8b5cf6' },
  process: { label: 'Process', color: '#22c55e' },
  roadmap: { label: 'Roadmap', color: '#f59e0b' },
} as const
