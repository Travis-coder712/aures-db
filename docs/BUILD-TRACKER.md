# AURES Database — Build Tracker

> **Last Updated:** 2026-03-10
> **Current Phase:** Phase 2.5 — NEM Dashboard + REZ Tracking
> **Status:** Phase 1 + Phase 2 + Phase 2.5 complete. 1,067 projects live. NEM Fleet Dashboard with charts. 18 REZ zones tracked across 5 states.

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 95% |
| Phase 2: CIS/LTESA/REZ | ✅ Complete | 100% |
| Phase 2.5: NEM Dashboard + REZ | ✅ Complete | 100% |
| Phase 3: Performance | Preview Built | 10% |
| Phase 4: Intelligence | Not Started | 0% |
| Phase 5: Data Enrichment | Ongoing | 5% |

---

## Phase 1: Foundation — ✅ COMPLETE

### Completed
- [x] Create GitHub repo (travis-coder712/aures-db)
- [x] Clone and set up directory structure
- [x] Create project documentation (5 docs)
- [x] Set up React 19 + Vite 6 + TypeScript + Tailwind 4 + PWA
- [x] Build mobile-first layout (bottom nav + desktop sidebar)
- [x] Build Home dashboard page (stats, tech browse, pipeline status, featured projects)
- [x] Build Project list page with filters (technology, status, state)
- [x] Build Project detail page with tabs (Overview, Timeline, Technical, Sources)
- [x] Build universal search (Fuse.js fuzzy search across 1,067 projects)
- [x] Build 404 page
- [x] Deploy to GitHub Pages via GitHub Actions
- [x] Build Guides feature (7 guides readable in-app with markdown rendering)
- [x] Create SQLite database schema (15 tables)
- [x] Seed database with 10 exemplar projects
- [x] Build JSON export pipeline (SQLite → static JSON)
- [x] Fix source URLs to link to specific pages
- [x] Enrich Coopers Gap with full timeline
- [x] Build Python AEMO Generation Information importer (1,057 projects imported)
- [x] Wire frontend to load from JSON (dataService.ts + useProjectData hooks)
- [x] Performance charts preview (recharts: energy price, curtailment, BESS charge/discharge)

### Deferred to Phase 5 (ongoing enrichment)
- [ ] Enrich remaining 9 exemplar projects to Coopers Gap level of depth
- [ ] PWA icons (192px, 512px)
- [ ] Test PWA installation on iPhone

---

## Phase 2: CIS/LTESA/REZ — ✅ COMPLETE

### CIS Rounds — Data Seeded
- [x] Pilot NSW (Nov 2023) — 6 projects, 1,075 MW
- [x] Pilot SA-VIC (Sep 2024) — 6 projects, 995 MW / 3,626 MWh
- [x] Tender 1 NEM Gen (Dec 2024) — 19 projects, 6.4 GW (aggregate only, project list TBD)
- [x] Tender 2 WEM Disp (Mar 2025) — 4 projects, 654 MW / 2,595 MWh (full project list)
- [x] Tender 3 NEM Disp (Sep 2025) — 16 projects, 4.13 GW / 15.37 GWh (full project list)
- [x] Tender 4 NEM Gen (Oct 2025) — 20 projects, 6.6 GW (full project list)
- [x] Tender 5/6 WEM (pending — results expected Mar-Apr 2026)
- [x] Tender 7 NEM Gen (pending — results expected May 2026)
- [x] Tender 8 NEM Disp (pending — results expected mid-2026)

### LTESA Rounds — Data Seeded
- [x] Round 1 (May 2023) — Generation + LDS
- [x] Round 2 (Nov 2023) — Firming
- [x] Round 3 (Dec 2023) — Generation + LDS
- [x] Round 4 (mid-2024) — Generation
- [x] Round 5 (Feb 2025) — LDS (incl. Phoenix Pumped Hydro)
- [x] Round 6 (Feb 2026) — LDS (6 batteries, 1.17 GW / 12 GWh, full project list)

### Frontend — Schemes Pages Built
- [x] Schemes overview page (CIS + LTESA summary cards, round listings)
- [x] CIS round detail page (stats, projects grouped by state, sources)
- [x] LTESA round detail page (stats, projects, sources)
- [x] Pending round state ("Results not yet announced")
- [x] Education section: CIS + LTESA explainers on overview page
- [x] Nav updated: Schemes in sidebar + mobile bottom nav
- [x] CIS/LTESA comparison table (scope, capacity, storage, contract types, capacity share bar)
- [x] Link scheme projects to master project records (85 of 95 linked via project_id)
- [x] CIS Tender 1 individual project list (all 19 projects)

---

## Phase 2.5: NEM Dashboard + REZ Tracking — ✅ COMPLETE

### NEM Fleet Dashboard (`/dashboard`)
- [x] Fleet stats cards (Operating 37 GW, Construction 18.4 GW, Development 328.4 GW, Storage 674 GWh)
- [x] Capacity by Technology stacked bar chart (Recharts — wind/solar/BESS/hybrid/pumped hydro)
- [x] Capacity by State horizontal bar chart (Recharts — NSW/QLD/VIC/SA/TAS/WA)
- [x] Construction Pipeline project list (60 projects, linked to detail pages)
- [x] `useNEMStats.ts` hook — client-side cross-tab aggregation from project index

### REZ Tracking (`/rez`, `/rez/:id`)
- [x] Curated 18 REZ zones across 5 states (NSW 5, VIC 5, QLD 4, SA 3, TAS 1)
- [x] REZ list page with state filter tabs, state summary cards, zone card grid
- [x] REZ detail page with stats, description, transmission info, project list, sources
- [x] `rez-zones.ts` data file with zone metadata, descriptions, sources
- [x] `useREZData.ts` hooks (useREZList, useREZDetail with project matching)

### Navigation
- [x] Desktop sidebar: Home, Dashboard, Projects, Schemes, REZ, Guides, Search (7 items)
- [x] Mobile bottom nav: Home, Projects, Schemes, REZ, Search (5 items)
- [x] Dashboard + Guides desktop-only; Performance + Watchlist in "Coming Soon"

---

## Data Population Progress

### Database: 1,067 Projects

| Technology | Count | Capacity |
|-----------|-------|----------|
| BESS | 432 | 129.3 GW |
| Wind | 235 | 129.5 GW |
| Solar | 229 | 50.8 GW |
| Hybrid | 110 | 45.3 GW |
| Pumped Hydro | 61 | 29.1 GW |

### Enriched Exemplar Projects (10)

| # | Project | Tech | State | Data Depth |
|---|---------|------|-------|-----------|
| 1 | Yanco Delta Solar Farm | Solar | NSW | Good (6 timeline events, ownership change, COD drift, cost sources) |
| 2 | Golden Plains Wind Farm | Wind | VIC | Basic (3 events, Vestas OEM) |
| 3 | Victorian Big Battery | BESS | VIC | Good (5 events incl. Megapack fire, Tesla OEM) |
| 4 | Hornsdale Power Reserve | BESS | SA | Good (4 events, 3 phases, Tesla OEM) |
| 5 | Waratah Super Battery | BESS | NSW | Good (3 events, Tesla OEM, SIPS) |
| 6 | Stockyard Hill Wind Farm | Wind | VIC | Basic (3 events, Goldwind OEM, Origin PPA) |
| 7 | Coopers Gap Wind Farm | Wind | QLD | **Enriched** (7 events, FID, tower felling, repairs, COD drift) |
| 8 | New England Solar Farm | Hybrid | NSW | Basic (3 events) |
| 9 | Eraring Battery | BESS | NSW | Basic (2 events, COD drift) |
| 10 | Collie Battery | BESS | WA | Basic (1 event) |

---

## Architecture

```
Layer 0: DATA PIPELINE (Python)  ✅ BUILT
  pipeline/db.py                    — Database connection helper
  pipeline/exporters/export_json.py — SQLite → JSON export
  pipeline/importers/import_aemo_gen_info.py — AEMO Excel importer
  pipeline/requirements.txt         — openpyxl, requests, pandas

Layer 1: SQLite DATABASE  ✅ BUILT
  database/schema.sql               — 15 tables, full schema
  database/aures.db                 — 1,067 projects
  database/seeds/                   — Exemplar project seed script

Layer 2: STATIC JSON  ✅ BUILT
  frontend/public/data/             — Served by Vite dev server
  data/                             — Source-of-truth export
  projects/index.json               — 1,067 project summaries (303KB)
  projects/{tech}/{id}.json         — Individual project detail
  indexes/by-*.json                 — Indexes by tech, state, status, developer
  metadata/stats.json               — Quick stats for dashboard

Layer 3: PWA FRONTEND  ✅ BUILT & DEPLOYED
  React 19 + TypeScript + Vite 6 + Tailwind 4
  Async data loading (dataService.ts + useProjectData hooks)
  Fuse.js search across 1,067 projects
  Performance charts (recharts) for operating assets
  12 pages: Home, Dashboard, ProjectList, ProjectDetail, Search, Guides, GuideReader, SchemesOverview, SchemeRoundDetail, REZList, REZDetail, NotFound
  Mobile bottom nav + desktop sidebar
  PWA with service worker (vite-plugin-pwa)
  Live at: https://travis-coder712.github.io/aures-db/
```

---

## Session Log

### Session 1 — 2026-03-10
- Comprehensive design session (8 messages)
- Explored data sources, architecture, feasibility
- Decided on three-layer hybrid architecture
- Key decisions: multi-source intelligence, confidence ratings, timeline as core feature
- Created repo and documentation

### Session 2 — 2026-03-10
- Built entire Phase 1 frontend scaffold
- Created Layout, all pages, shared components
- Loaded 10 exemplar projects with real data
- Deployed to GitHub Pages successfully
- Added Guides to the PWA (7 guides with markdown rendering)
- Added Maps & NEM Summary roadmap guides

### Session 3 — 2026-03-10
- Built SQLite database schema (15 tables)
- Built seed script for 10 exemplar projects
- Built JSON export pipeline (SQLite → static JSON)
- Fixed source URLs to link to specific pages
- Enriched Coopers Gap with full construction timeline

### Session 4 — 2026-03-10
- Built AEMO Generation Information importer (Python)
- Imported 1,057 new projects from AEMO Excel (≥30MW renewable)
- Database now has 1,067 projects (432 BESS, 235 wind, 229 solar, 110 hybrid, 61 pumped hydro)
- Created async data loading layer (dataService.ts + React hooks)
- Wired all frontend pages to JSON data (Home, ProjectList, ProjectDetail, Search)
- Added performance charts for operating assets (recharts)
- Built sample performance data for 6 projects (BESS + wind)
- All pages verified working with 1,067 projects
- Phase 1 declared complete — moving to Phase 2

### Session 5 — 2026-03-10
- Researched all CIS tender rounds (Pilots + Tenders 1-8) via web search
- Researched all LTESA rounds (Rounds 1-6) via web search
- Built `scheme-rounds.ts` with complete CIS + LTESA round data
- Full project lists for: CIS Tender 2 (4), Tender 3 (16), Tender 4 (20), LTESA Round 6 (6)
- Built `useSchemeData.ts` hooks (useSchemeData, useCISRound, useLTESARound)
- Built `SchemesOverview.tsx` — combined CIS + LTESA overview page with summary cards
- Built `SchemeRoundDetail.tsx` — detail page with stats, projects grouped by state, sources
- Added Schemes to nav (sidebar + mobile bottom nav)
- Added routes: `/schemes`, `/schemes/:scheme/:roundId`
- CIS accent: amber (#f59e0b), LTESA accent: purple (#8b5cf6)
- Verified all page states: overview, detail with projects, pending rounds

### Session 5b — 2026-03-10 (continued)
- Added CIS Tender 1 complete project list (all 19 projects from RenewEconomy/DCCEEW)
- Added LTESA Rounds 1-5 project lists: R1 (4 projects), R2 (4), R3 (5), R4 (2), R5 (3)
- Updated round metadata: R1 (1,445 MW/400 MWh), R2 (1,075 MW/2,790 MWh), R4 (317 MW/372 MWh), R5 (1,025 MW/13,790 MWh)
- Built CIS vs LTESA comparison table on overview page (capacity share bar, contract types, combined totals)
- 95 projects now tracked across 15 rounds (71 CIS + 24 LTESA)
- Matched 66 of 91 scheme projects to master 1,067-project database (25 unmatched — mostly WEM or new)
- Phase 2 now ~85% complete

### Session 5c — 2026-03-10 (continued)
- Added project_id fields to 85 of 95 scheme projects (linking to master 1,067-project DB)
- 10 unlinked: 4 WEM projects (not in NEM data), 4 VPP portfolios (distributed), 1 Springfield BESS (new), 1 Punchs Creek (size mismatch)
- Fixed BUILD-TRACKER checkboxes for comparison table and CIS Tender 1 project list (completed in 5b)
- Phase 2 declared complete at 100%

### Session 6 — 2026-03-10
- Built NEM Fleet Dashboard (`/dashboard`) with 4 fleet stat cards + 2 Recharts stacked bar charts + construction pipeline
- Created `useNEMStats.ts` hook for client-side cross-tab aggregation from 1,067 projects
- Researched and curated 18 REZ zones across 5 states (NSW 5, VIC 5, QLD 4, SA 3, TAS 1)
- Built `rez-zones.ts` data file with zone metadata, descriptions, transmission info, sources
- Built REZ list page (`/rez`) with state filters, summary cards, zone grid
- Built REZ detail page (`/rez/:id`) with stats, description, project matching, sources
- Updated navigation: 7-item desktop sidebar, 5-item mobile bottom nav
- Map view deferred (99% of projects lack coordinates)
- Phase 2.5 declared complete

---

## What To Build Next

1. **Map view** — Plot projects on an Australian map (needs coordinate data sourcing)
2. **Data enrichment** — Enrich remaining 9 exemplar projects to Coopers Gap depth (Phase 5)
3. **REZ–project linking** — Add `rez` field to projects in master DB for better REZ detail pages
4. **Performance dashboards** — Operating asset metrics (Phase 3)
