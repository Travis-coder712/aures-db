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

**AURES fixes this.** It brings together information from every major public source into one searchable, browsable database that works on your phone.

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

It's the same underlying data, but you can slice it a dozen different ways — by project, developer, OEM, contractor, offtaker, REZ, scheme, or location on the map.

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
Comprehensive project records for every significant renewable energy project in Australia (NEM + WEM). Filterable by technology, state, developer, OEM, status, REZ, CIS/LTESA round.

**Level 2: PROFILES** — "Who are the players?"
Developer profiles (718 developers, grouped into ~104 parent companies). OEM profiles (17 equipment manufacturers). EPC contractor profiles (20 contractors). Offtaker profiles (19 offtakers with 48 PPA/offtake agreements tracked).

**Level 3: HISTORY** — "How has this project evolved?"
Full lifecycle timeline for each project. Ownership changes with transaction values. COD drift tracking. Milestone progression.

**Level 4: ANALYSIS** — "How are existing projects performing?"
Operational performance league tables. Capacity factors, revenue, curtailment, loss factors. Best and worst performers by technology and state. BESS revenue breakdown (arbitrage vs FCAS).

**Level 5: INTELLIGENCE** — "Will planned projects succeed?"
Watchlist risk scoring for CIS/LTESA/REZ winners. Development readiness assessment. Operations-to-development mapping. Top quartile benchmarking (new vs existing).

**Level 6: INSIGHT** — "What should we be watching?"
Multi-source analysis of contested topics. Lessons from operational reality. Market share trends and competitive dynamics. Critical milestones in the next 6 months.`,
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
Automated AEMO data ingestion (Generation Info, SCADA, MLFs). OpenElectricity API integration. Computed metrics (capacity factors, revenue, curtailment, rankings). Runs periodically on your machine or via GitHub Actions.

**Layer 1: SQLite DATABASE**
All project records, timelines, ownership, suppliers, performance. Multi-source data storage with confidence ratings. Computed fields: risk scores, performance scores, quartile rankings. Audit trail: every field change logged with source.

**Layer 2: STATIC JSON (version-controlled)**
Pre-computed views exported from SQLite. Indexes for every navigation lens (by tech, state, developer, OEM, etc.). League tables, watchlists, and market share data. Updated whenever the pipeline runs.

**Layer 3: PWA FRONTEND (GitHub Pages)**
React 19 + TypeScript + Vite 6 + Tailwind 4. Offline-capable via service worker (vite-plugin-pwa). Client-side filtering, search (Fuse.js), and navigation. Charts via Recharts, maps via Leaflet. Mobile-first responsive design.

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

## Data Sources

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
OpenElectricity (OpenNEM), Global Energy Monitor, Wikipedia, ARENA

### Tier 5: Primary Sources
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
    readingTime: '4 min read',
    content: `# AURES — Build Tracker

> **Last Updated:** 2026-03-10
> **Current Phase:** Phase 1 — Foundation

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | In Progress | 70% |
| Phase 2: CIS/LTESA/REZ | Not Started | 0% |
| Phase 3: Performance | Not Started | 0% |
| Phase 4: Intelligence | Not Started | 0% |
| Phase 5: Data Enrichment | Ongoing | 0% |

---

## Phase 1: Foundation — Completed

- Created GitHub repo (travis-coder712/aures-db)
- Set up directory structure
- Created project documentation (5 guides)
- Set up React + Vite + TypeScript + Tailwind + PWA
- Built Home dashboard page
- Built Project list page with filters (technology, status, state)
- Built Project detail page with tabs (Overview, Timeline, Technical, Sources)
- Built universal search (Fuse.js)
- Built mobile bottom navigation + desktop sidebar
- Deployed to GitHub Pages

## Phase 1: Remaining

- SQLite database schema
- Python AEMO Generation Information importer
- JSON export pipeline
- Enrich 10 exemplar projects to full depth
- PWA icons (192px, 512px)
- Test PWA installation on iPhone

---

## Data Population Progress

### Exemplar Projects (10 loaded)

| # | Project | Tech | State | Data Depth |
|---|---------|------|-------|-----------|
| 1 | Yanco Delta Solar Farm | Solar | NSW | Good (timeline, ownership, COD drift) |
| 2 | Golden Plains Wind Farm | Wind | VIC | Basic |
| 3 | Victorian Big Battery | BESS | VIC | Good (timeline, fire incident) |
| 4 | Hornsdale Power Reserve | BESS | SA | Good (phases, expansion history) |
| 5 | Waratah Super Battery | BESS | NSW | Basic |
| 6 | Stockyard Hill Wind Farm | Wind | VIC | Basic (OEM: Goldwind) |
| 7 | Coopers Gap Wind Farm | Wind | QLD | Basic (OEM: Vestas) |
| 8 | New England Solar Farm | Hybrid | NSW | Basic |
| 9 | Eraring Battery | BESS | NSW | Basic |
| 10 | Collie Battery | BESS | WA | Basic |

### CIS Rounds (Phase 2)
Pilot NSW, Pilot SA-VIC, Tender 1-8 — all pending

### LTESA Rounds (Phase 2)
Round 1-6 — all pending

---

## Session Log

### Session 1 — 2026-03-10
- Comprehensive design session over 8 messages
- Explored data sources, architecture, feasibility
- Decided on three-layer hybrid architecture
- Key decisions: multi-source intelligence model, confidence ratings, timeline as core feature

### Session 2 — 2026-03-10
- Built entire Phase 1 frontend scaffold
- Created Layout, all pages, shared components
- Loaded 10 exemplar projects with real data
- Deployed to GitHub Pages successfully
- Added guides to the PWA`,
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
]

export const GUIDE_CATEGORIES = {
  about: { label: 'About AURES', color: '#0ea5e9' },
  technical: { label: 'Technical', color: '#8b5cf6' },
  process: { label: 'Process', color: '#22c55e' },
  roadmap: { label: 'Roadmap', color: '#f59e0b' },
} as const
