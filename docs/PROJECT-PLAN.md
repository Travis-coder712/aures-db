# AURES Database — Comprehensive Project Plan

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

```
Layer 0: DATA PROCESSING PIPELINE (Python)
  - Automated AEMO data ingestion (Generation Info, SCADA, MLFs)
  - OpenElectricity API integration
  - Computed metrics (capacity factors, revenue, curtailment, rankings)
  - Runs periodically on your machine or via GitHub Actions

Layer 1: SQLite DATABASE
  - All project records, timelines, ownership, suppliers, performance
  - Multi-source data storage with confidence ratings
  - Computed fields: risk scores, performance scores, quartile rankings
  - Audit trail: every field change logged with source

Layer 2: STATIC JSON (version-controlled)
  - Pre-computed views exported from SQLite
  - Indexes for every navigation lens (by tech, state, developer, OEM, etc.)
  - League tables, watchlists, and market share data
  - Updated whenever the pipeline runs

Layer 3: PWA FRONTEND (GitHub Pages)
  - React 19 + TypeScript + Vite 6 + Tailwind 4
  - Offline-capable via service worker (vite-plugin-pwa)
  - Client-side filtering, search (Fuse.js), and navigation
  - Charts via Recharts, maps via Leaflet
  - Mobile-first responsive design
```

---

## Phase-by-Phase Build Plan

### Phase 1: Foundation (~2 weeks)
**Goal: Working PWA with project database on your phone**

Tasks:
1. [x] Create repo and project structure
2. [ ] Set up React + Vite + TypeScript + Tailwind + PWA
3. [ ] Design and implement SQLite database schema (all tables)
4. [ ] Build Python AEMO Generation Information importer
5. [ ] Build JSON export pipeline (SQLite -> /data/*.json)
6. [ ] Build core frontend screens:
   - Home dashboard
   - Project list with filters (technology, state, status)
   - Project detail page with tabs (Overview, Timeline, Technical, Sources)
   - Universal search (Fuse.js)
7. [ ] Mobile-responsive layout with bottom navigation
8. [ ] Populate 10 exemplar projects with full data:
   - Yanco Delta Wind Farm (Origin) — the gold standard
   - Golden Plains Wind Farm (TagEnergy/Vestas)
   - Victorian Big Battery (HMC Capital, formerly Neoen)
   - Hornsdale Power Reserve (Atmos Renewables, formerly Neoen)
   - Eraring Battery (Origin/Wartsila)
   - Waratah Super Battery (Akaysha/Powin)
   - Stockyard Hill Wind Farm (Goldwind)
   - Coopers Gap Wind Farm (Siemens Gamesa)
   - New England Solar Farm (ACEN)
   - Collie Battery (Synergy/Tesla/CATL)
9. [ ] Deploy to GitHub Pages
10. [ ] Create educational content scaffold

### Phase 2: CIS/LTESA/REZ + Watchlist (~2 weeks)
**Goal: Full scheme round views and forward-looking risk dashboard**

Tasks:
1. [ ] Structure all CIS rounds:
   - Pilot NSW (Nov 2023) — 6 projects, 1,075 MW
   - Pilot SA-VIC (Sep 2024) — 6 projects, 995 MW / 3,626 MWh
   - Tender 1 NEM Gen (Dec 2024) — 19 projects, 6.4 GW
   - Tender 2 WEM Disp (Mar 2025) — 4 projects, 654 MW / 2,595 MWh
   - Tender 3 NEM Disp (Sep 2025) — 16 projects, 4.13 GW / 15.37 GWh
   - Tender 4 NEM Gen (Oct 2025) — 20 projects, 6.6 GW
   - Tender 5/6 WEM (in progress)
   - Tender 7 NEM Gen (results May 2026)
   - Tender 8 NEM Disp (results mid-2026)
2. [ ] Structure all LTESA rounds:
   - Round 1 (May 2023) — Generation + LDS
   - Round 2 (Nov 2023) — Firming
   - Round 3 (Dec 2023) — Generation + LDS
   - Round 4 (mid-2024) — Generation
   - Round 5 (Feb 2025) — LDS (incl. Phoenix Pumped Hydro)
   - Round 6 (Feb 2026) — LDS (6 batteries, 1.17 GW / 12 GWh)
3. [ ] Structure REZ views:
   - NSW: Central-West Orana, New England, South-West, Hunter-Central Coast, Illawarra
   - VIC: 6 proposed REZs + offshore wind zone
   - QLD: 12 planned REZs across 3 phases
4. [ ] Build CIS/LTESA round comparison views
5. [ ] Build Watchlist dashboard with risk scoring
6. [ ] Link CIS/LTESA/REZ projects back to master project records
7. [ ] Education hub: CIS explainer, LTESA explainer, REZ explainer

### Phase 3: Performance Analytics (~2-3 weeks)
**Goal: Operational performance league tables and AEMO data pipeline**

Tasks:
1. [ ] Build Python AEMO SCADA data pipeline:
   - Download dispatch SCADA (per-unit 5-min generation data)
   - Download price data (5-min spot prices by region)
   - Download MLF tables (annual, per generator)
2. [ ] Compute monthly/quarterly/annual metrics per generator:
   - Capacity factor
   - Volume-weighted average price received
   - Revenue per MW
   - Curtailment estimate
   - Availability
3. [ ] Build league table frontend:
   - Wind farms >150 MW (by state, by year)
   - Solar farms >150 MW (by state, by year)
   - BESS (all, by state, by duration class)
   - Top/bottom toggle
   - Composite performance score
4. [ ] Curtailment analysis:
   - By zone/region
   - By technology
   - Trend over time
   - "Rhombus of Regret" and other hotspot identification
5. [ ] BESS revenue analysis:
   - Energy arbitrage vs FCAS split
   - Revenue per MW by state
   - Duration class comparison (1hr vs 2hr vs 4hr vs 8hr)
   - Grid-forming vs grid-following revenue differential
6. [ ] Wind performance analysis:
   - Capacity factor by OEM (Vestas vs Goldwind vs Siemens vs Nordex)
   - Newer vs older wind farms
   - Curtailment by state
7. [ ] Top quartile benchmark framework:
   - Compute quartiles per technology per state
   - Compare new developments against operational benchmarks

### Phase 4: Intelligence Layer (~2 weeks)
**Goal: Multi-source analysis, insights, and development mapping**

Tasks:
1. [ ] Multi-source data panel on project pages
2. [ ] Confidence rating system (4-tier)
3. [ ] "Differing Views" feature for contested topics
4. [ ] Source coverage map per project
5. [ ] Operations → development mapping:
   - For each proposed project, show nearby operating projects' performance
   - Zone curtailment risk assessment for new developments
   - "Solar Reality Check" insight page
   - "BESS Revenue Compression" insight page
   - "Wind: Bigger Isn't Always Better" insight page
6. [ ] Developer profiles with market share charts
7. [ ] OEM profiles:
   - Wind: Vestas, Goldwind, Siemens Gamesa, Nordex
   - BESS: Tesla, Fluence, Wartsila, CATL, BYD, Sungrow, Hithium
   - Inverter: Power Electronics, SMA, Tesla, Sungrow
8. [ ] COD drift tracking and visualisation
9. [ ] "Zombie project" detection and flagging
10. [ ] Construction performance leaderboard

### Phase 5: Ongoing Data Enrichment
**Goal: Continuously improve data depth and freshness**

Tasks (recurring):
- Monthly: Run AEMO SCADA pipeline for performance updates
- Quarterly: Refresh AEMO Generation Information backbone
- Per-event: Update for CIS/LTESA results, REZ announcements
- Ongoing: Enrich project fact sheets (OEM, cost, offtakes, BoP)
- Ongoing: RenewEconomy + AFR article linking for project updates
- Ongoing: Community/stakeholder issue tracking

---

## Data Sources

### Tier 1: Official / Regulatory
| Source | What It Provides | URL |
|--------|-----------------|-----|
| AEMO Generation Information | Project universe (~500+ projects) | https://www.aemo.com.au/.../generation-information |
| AEMO Dispatch SCADA | Per-unit 5-min generation data | https://www.aemo.com.au/.../generation-and-load |
| AEMO MLFs | Marginal loss factors per generator | https://www.aemo.com.au/.../loss-factors-and-regional-boundaries |
| AEMO Connections Scorecard | Connection queue status | https://www.aemo.com.au/.../connections-scorecard |
| DCCEEW CIS | Capacity Investment Scheme results | https://www.dcceew.gov.au/energy/renewable/capacity-investment-scheme |
| AEMO Services / ASL | LTESA tender results | https://asl.org.au/tenders/current-nsw-ltesa-projects |
| EnergyCo | REZ access rights, REZ info | https://www.energyco.nsw.gov.au/ |
| ACCC Merger Register | M&A regulatory decisions | https://www.accc.gov.au/public-registers |
| ASX Announcements | Listed company disclosures | Various |
| State Planning Portals | DA approvals | Various |

### Tier 2: Authoritative Journalism
| Source | Strength | URL |
|--------|----------|-----|
| Australian Financial Review | Deal values, M&A, strategic moves, financing | https://www.afr.com |
| RenewEconomy | Project detail, RenewMap, daily coverage | https://reneweconomy.com.au |
| WattClarity | Technical analysis, curtailment, capacity factors | https://wattclarity.com.au |
| Modo Energy | BESS revenue analytics, CIS/LTESA analysis | https://modoenergy.com |

### Tier 3: Specialist Industry
| Source | Strength |
|--------|----------|
| PV Magazine Australia | Solar-specific depth |
| Energy Storage News | BESS-specific depth |
| Infrastructure Investor | Deal/financing depth |
| Capital Brief | M&A intelligence |
| Energy Synapse | Market modelling |
| Clean Energy Council | Quarterly reports, industry data |

### Tier 4: Open Data
| Source | What It Provides |
|--------|-----------------|
| OpenElectricity (OpenNEM) | Generator performance data |
| Global Energy Monitor | Project-level wiki |
| Wikipedia | Wind farm lists, historical |
| ARENA | Funded project details |

### Tier 5: Primary Sources
- Developer websites
- OEM announcements
- EPC contractor announcements
- Community/stakeholder submissions

---

## Key Design Decisions

### 1. Multi-Source Intelligence (Not Single-Source Truth)
Every key data point stores ALL reported values with source, date, and context.
Confidence ratings: HIGH (multiple sources agree), GOOD (one authoritative), MEDIUM (single credible), LOW (inferred), UNVERIFIED (gap).
Conflicting information is shown, not hidden — it's a feature.

### 2. Nothing Is Ever Deleted
Old values move to history arrays. Every change has a timestamp and source.
COD changes, ownership changes, cost revisions — all preserved in timeline.

### 3. Source Hierarchy with Recency Rule
When same-tier sources conflict, latest date wins for "current" display.
All values preserved in history regardless.

### 4. Pre-Computed Analytics
All rankings, scores, and aggregations computed at export time.
PWA serves pre-built JSON — no runtime computation needed.
This keeps the frontend fast and the hosting free.

### 5. Mobile-First, Comprehensive Second
Bottom navigation with 5 tabs on mobile.
Progressive disclosure — simple surfaces, depth on demand.
Universal search as the #1 entry point on mobile.
Desktop gets full sidebar navigation.

---

## Technology Stack

| Component | Choice | Version |
|-----------|--------|---------|
| Frontend Framework | React | 19.x |
| Language | TypeScript | 5.x |
| Build Tool | Vite | 6.x |
| PWA Plugin | vite-plugin-pwa | Latest |
| Styling | Tailwind CSS | 4.x |
| Charts | Recharts | 2.x |
| Animations | Framer Motion | 12.x |
| Search | Fuse.js | Latest |
| Routing | React Router | 7.x |
| Maps | Leaflet | Latest |
| Database | SQLite3 (via better-sqlite3) | Latest |
| Data Pipeline | Python 3.11+ | - |
| Hosting | GitHub Pages | - |
| CI/CD | GitHub Actions | - |
