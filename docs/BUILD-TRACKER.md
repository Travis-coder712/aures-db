# AURES Database — Build Tracker

> **Last Updated:** 2026-03-12
> **Current Phase:** Phase 4 — Intelligence Layer (near complete)
> **Status:** Phases 1-4 near complete. 1,064 projects (incl. 22 offshore wind). Real 2024+2025 performance data + 2026 YTD from OpenElectricity API. 593 timeline events. 250 projects with coordinates. Phase 4 delivered: confidence scoring, 718 developer profiles, interactive Leaflet map, COD drift tracker. Remaining: methodology deep dive (4.5), final nav polish (4.6), build+push (4.7).

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 95% |
| Phase 2: CIS/LTESA/REZ | ✅ Complete | 100% |
| Phase 2.5: NEM Dashboard + REZ | ✅ Complete | 100% |
| Phase 3: Performance | ✅ Complete | 100% |
| Phase 3.5: Data Quality + Enrichment | ✅ Complete | 100% |
| Phase 4: Intelligence | In Progress | 90% |
| Phase 5: Data Enrichment | Ongoing | 25% |

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

## Phase 3: Performance Analytics — ✅ COMPLETE

### Data Pipeline
- [x] Database schema: `performance_annual` + `league_table_entries` tables (migration 003)
- [x] OpenElectricity API importer (`import_openelectricity.py`) — live API + `--sample` mode
- [x] League table processor (`compute_league_tables.py`) — rankings, percentiles, quartiles, composite scores
- [x] JSON export additions — league table JSONs, quartile benchmarks
- [x] OpenElectricity API key obtained and stored (Community plan, 500 req/day)
- [x] **Real 2024 data imported** — replaced sample data with AEMO market data via OpenElectricity API
- [x] **BESS charge/discharge interpolation** — derived from separate battery_charging/battery_discharging unit data
- [x] **Pumped hydro separated from BESS** — now its own league table category

### Facility Metadata Harvest (zero extra API calls)
- [x] `harvest_facility_metadata.py` — extracts dates + coordinates from facilities response
- [x] 441 timeline events auto-created (225 COD, 223 energisation, construction starts, planning approvals)
- [x] 218 projects got coordinates filled (was 6)
- [x] 200 projects got verified COD dates from AEMO registration
- [x] `data_source` column added to timeline_events (migration 004) — tracks 'manual' vs 'openelectricity'

### Frontend
- [x] Performance page (`/performance`) — sortable league tables with **4 tech tabs** (Wind / Solar / BESS / Hydro)
- [x] Fleet summary cards (projects ranked, avg CF/utilisation, avg Rev/MW, avg curtailment)
- [x] Year dropdown + state filter pills (2024 + 2025)
- [x] BESS-specific columns: Discharged, Charged, Spread, Cycles, Rev/MW
- [x] Hydro tab uses wind/solar columns (CF%, $/MWh, Rev/MW, Curt%)
- [x] **Data source badges** — green "AEMO data via OpenElectricity" for real data, amber "Sample data" for estimates
- [x] Quartile distribution chart (Recharts)
- [x] Color-coded metrics (CF%, curtailment) and quartile badges (Q1-Q4)
- [x] Mobile Dashboard shortcut button on Home page (lg:hidden)
- [x] `usePerformanceData.ts` hooks (useLeagueTableIndex, useLeagueTable, useFilteredLeagueTable)
- [x] League table types in `types.ts` (LeagueTableEntry, LeagueTable, LeagueTableIndex, LeagueTechnology includes pumped_hydro)

### Navigation
- [x] Desktop sidebar: 8 items (Home, Dashboard, Projects, Performance, Schemes, REZ, Guides, Search)
- [x] Mobile bottom nav: 5 items (Home, Projects, Perf, REZ, Search) + Dashboard shortcut on Home
- [x] Performance moved from "Coming Soon" to live nav; only Watchlist remains in Coming Soon

### Performance Data Summary

**2024 — Real AEMO Data (via OpenElectricity)**
| Technology | Projects | Avg CF | Avg Rev/MW | Avg $/MWh |
|-----------|----------|--------|------------|-----------|
| Wind | 82 | 30.3% | $210k | $77 |
| Solar | 75 | 20.6% | $97k | $52 |
| BESS | 17 | 6.8% util | $173k | $220 |
| Pumped Hydro | 33 | 28.4% | $180k | $143 |

**2025 — Real AEMO Data (via OpenElectricity)**
| Technology | Projects | Data Source |
|-----------|----------|-------------|
| Wind | 82 | OpenElectricity API |
| Solar | 80 | OpenElectricity API |
| BESS | 28 | OpenElectricity API |
| Pumped Hydro | 34 | OpenElectricity API |

**2026 — Year-to-Date (Jan-Feb, via OpenElectricity)**
| Technology | Projects | Data Source |
|-----------|----------|-------------|
| All techs | 221 | OpenElectricity API (YTD) |

---

## Phase 3.5: Data Quality + Enrichment — ✅ COMPLETE

### Completed
- [x] **3 duplicate projects resolved** — Manual seeds removed, AEMO-linked entries retained
- [x] **Offshore wind separated** — 22 projects reclassified from `wind` to `offshore_wind` (new tech category with 🌊 icon)
- [x] **Real 2025 data imported** — Replaced all sample/dummy 2025 data with real OpenElectricity API data
- [x] **2026 YTD data imported** — Jan-Feb 2026 data with adjusted CF calculation for partial year
- [x] **Info tooltips added** — 11 metric definitions with formulas, sources, methodology section on Performance page
- [x] **YTD badge support** — Blue "Year to Date" badge for 2026 data, auto-selects latest year
- [x] **Offshore wind enrichment** — All 22 projects enriched with developer, status, timeline events, data confidence
  - 6 active (Star of the South, Blue Mackerel, Ørsted x2, Great Eastern, Spinifex)
  - 7 cancelled/failed (Gippsland Dawn, Cape Winds, Southern Winds, Eastern Rise, Illawarra, Novocastrian, Hunter CC)
  - 9 early-stage/uncertain (Bass, Eden, South Pacific, Ulladulla, Seaspray, Deal 1/2, Greater Southern)
- [x] **NSW REZ access rights populated** — CWO (10 projects, 7.15 GW), SW (4 projects, 3.56 GW)
- [x] **Construction project coordinates** — 21 additional projects geolocated (250 total with coords)
- [x] **Key development projects enriched** — Yanco Delta, Dinawan, Liverpool Range, Spicers Creek
- [x] **~35 projects enriched** (Session 8) — Pumped hydro, BESS, wind construction projects
- [x] **Home page updated** — 6 tech cards (wind, solar, BESS, hybrid, offshore wind, pumped hydro)
- [x] **Performance page updated** — 5+ tech tabs, info tooltips, data source badges

### Remaining Known Issues
- Blue Mackerel North has 2 AEMO entries (1,005 MW and 1,819 MW) — possible duplicate
- New England REZ access scheme not yet declared (expected Q2 2026)
- Hunter-Central Coast REZ has no access scheme yet

---

## Data Population Progress

### Database: 1,064 Projects

| Technology | Count |
|-----------|-------|
| BESS | 432 |
| Wind | 211 |
| Solar | 228 |
| Hybrid | 110 |
| Pumped Hydro | 61 |
| Offshore Wind | 22 |

### Timeline Events: 593 Total
| Source | Count |
|--------|-------|
| OpenElectricity (auto) | 441 |
| Manual (enrichment) | 152 |

### Coordinates: 250 Projects Geolocated
### Notable Descriptions: 66 Projects

### Enriched Exemplar Projects (10)

| # | Project | Tech | State | Data Depth |
|---|---------|------|-------|-----------|
| 1 | Yanco Delta Solar Farm | Solar | NSW | Good (6 timeline events, ownership change, COD drift, cost sources) |
| 2 | Golden Plains Wind Farm | Wind | VIC | Basic (3 events, Vestas OEM) |
| 3 | Victorian Big Battery | BESS | VIC | Good (5 events incl. Megapack fire, Tesla OEM) |
| 4 | Hornsdale Power Reserve | BESS | SA | Good (4 events, 3 phases, Tesla OEM) |
| 5 | Waratah Super Battery | BESS | NSW | Good (3 events, Tesla OEM, SIPS) |
| 6 | Stockyard Hill Wind Farm | Wind | VIC | Basic (3 events, Goldwind OEM, Origin PPA) — ✅ duplicate resolved |
| 7 | Coopers Gap Wind Farm | Wind | QLD | **Enriched** (7 events, FID, tower felling, repairs) — ✅ duplicate resolved |
| 8 | New England Solar Farm | Hybrid | NSW | Basic (3 events) — ✅ duplicate resolved |
| 9 | Eraring Battery | BESS | NSW | Basic (2 events, COD drift) |
| 10 | Collie Battery | BESS | WA | Basic (1 event) |

---

## Architecture

```
Layer 0: DATA PIPELINE (Python)  ✅ BUILT
  pipeline/db.py                    — Database connection helper
  pipeline/exporters/export_json.py — SQLite → JSON export (incl. performance data_source)
  pipeline/importers/import_aemo_gen_info.py — AEMO Excel importer
  pipeline/importers/import_openelectricity.py — OpenElectricity API importer (energy, market_value, BESS charge/discharge)
  pipeline/importers/harvest_facility_metadata.py — Facility metadata harvester (dates, coordinates, timeline events)
  pipeline/processors/compute_league_tables.py — League table ranking engine (4 tech categories)
  pipeline/enrichers/enrich_phase35.py — Phase 3.5 enrichment (35 construction/dev projects)
  pipeline/enrichers/enrich_mopup.py   — Mop-up enrichment (offshore wind, REZ access, coords)
  pipeline/requirements.txt         — openpyxl (AEMO only; OpenElectricity uses stdlib urllib)

Layer 1: SQLite DATABASE  ✅ BUILT
  database/schema.sql               — 17 tables, full schema (incl. performance_annual, league_table_entries)
  database/aures.db                 — 1,064 projects (incl. 22 offshore wind), 593 timeline events
  database/seeds/                   — Exemplar project seed script
  database/migrations/              — 003_performance_tables.sql, 004_timeline_data_source.sql

Layer 2: STATIC JSON  ✅ BUILT
  frontend/public/data/             — Served by Vite dev server
  projects/index.json               — 1,064 project summaries
  projects/{tech}/{id}.json         — Individual project detail (7 tech folders incl. offshore-wind)
  indexes/by-*.json                 — Indexes by tech, state, status, developer
  indexes/developer-profiles.json   — 718 developer profiles with slugs, capacity, tech/status breakdown
  indexes/by-coordinates.json       — 250 geolocated projects (lightweight map data)
  indexes/cod-drift.json            — COD drift data (7 projects with drift + 5 with history)
  performance/league-tables/*.json  — League table rankings by tech+year (8 files + index)
  performance/quartile-benchmarks/  — Quartile stats per metric
  metadata/stats.json               — Quick stats for dashboard

Layer 3: PWA FRONTEND  ✅ BUILT & DEPLOYED
  React 19 + TypeScript + Vite 6 + Tailwind 4 + Leaflet
  Async data loading (dataService.ts + useProjectData hooks)
  Fuse.js search across 1,064 projects
  Performance league tables with info tooltips + data source badges
  6 technology categories: wind, solar, BESS, hybrid, offshore wind, pumped hydro
  16 pages: Home, Dashboard, ProjectList, ProjectDetail, Performance, DeveloperList, DeveloperDetail, MapView, Search, Guides, GuideReader, SchemesOverview, SchemeRoundDetail, REZList, REZDetail, NotFound
  Mobile bottom nav + desktop sidebar + Dashboard shortcut
  PWA with service worker (vite-plugin-pwa)
  Live at: https://travis-coder712.github.io/aures-db/
```

### OpenElectricity API Usage
- **Plan:** Community (free), 500 requests/rolling 24h
- **Per import run:** ~18 requests (1 `/me` + 1 `/facilities/` + ~11 data batches + ~5 market data)
- **Metadata harvest:** 2 requests (1 `/me` + 1 `/facilities/`, reuses same data)
- **Headroom:** Can run full import twice daily with room to spare

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
- Built JSON export pipeline (SQLite → JSON)
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

### Session 7 — 2026-03-11
- Built Phase 3: Performance Analytics (full pipeline + frontend)
- Created `performance_annual` + `league_table_entries` database tables
- Built OpenElectricity API importer with `--sample` mode for dev
- Built league table processor (rankings, percentiles, quartiles, composite scores)
- Extended JSON exporter with performance data output
- Built Performance page with sortable league tables, tech tabs, state filters
- Wind (82), Solar (80), BESS (62) projects ranked with sample data
- Updated navigation: Performance in sidebar (8 items) + mobile nav (5 items, "Perf" replaces "Schemes")
- Added "Using AURES on Your Phone" guide (PWA installation + update instructions)
- Obtained and stored OpenElectricity API key (Community plan)
- Updated Home page: removed completed items from "Coming Soon"

### Session 8 — 2026-03-11
- **Real API data**: Replaced sample 2024 data with real AEMO market data via OpenElectricity API (207 projects)
- **BESS charge/discharge**: Derived charge price, discharge price, spread, cycles from separate battery unit data
- **Pumped hydro separated**: Split from BESS into own category (34 projects, new Hydro tab)
- **BESS columns enhanced**: Discharged, Charged, Spread, Cycles, Rev/MW
- **Metadata harvest**: Built `harvest_facility_metadata.py` — 441 timeline events auto-created, 218 coordinates filled, 200 COD dates set
- **Data source badges**: Green "AEMO data via OpenElectricity" / amber "Sample data" on Performance page
- **Mobile Dashboard shortcut**: Added NEM Dashboard button to Home page (mobile only)
- **Data provenance**: `data_source` field added to league table JSON and timeline_events table
- **Docs update**: Updated all guidance documents for post-Phase 3 state

### Session 9 — 2026-03-11/12
- **Real 2025 performance data**: Replaced all sample/dummy 2025 data with real OpenElectricity API data (220 projects)
- **2026 YTD data**: Imported Jan-Feb 2026 performance data (221 projects) with adjusted CF calculation for partial year
- **YTD import support**: Added `--ytd` flag to `import_openelectricity.py` with hours-elapsed denominator
- **Info tooltips**: 11 metric definitions (CF, Rev/MW, $/MWh, curtailment, spread, cycles, etc.) with formulas and data sources
- **"About This Data" section**: Methodology explanation at bottom of Performance page
- **Offshore wind separation**: New `offshore_wind` technology type (🌊 sky-blue), 22 projects reclassified
- **Home page 6 cards**: Wind, Solar, BESS, Hybrid, Offshore Wind, Pumped Hydro in 2×3 grid
- **Performance YTD badge**: Blue "Year to Date (Jan-Feb)" badge for current year data
- **Year dropdown**: Defaults to latest year, shows "(YTD)" suffix for current year

### Session 10 — 2026-03-12
- **Offshore wind enrichment**: All 22 projects enriched with developer, status, notable info, timeline events, data confidence
  - Researched all Gippsland feasibility licences (12 awarded, 3 surrendered, 9 active)
  - Identified 7 cancelled/failed projects (Gippsland Dawn, Cape Winds, Southern Winds, Eastern Rise, Illawarra, Novocastrian, Hunter CC)
  - Star of the South most advanced (EIS lodged Dec 2025), Blue Mackerel first management plan approved
  - Ørsted still active (not withdrawn from Australia — contrary to initial assumption)
- **NSW REZ access rights**: CWO (10 projects, 7.15 GW, May 2025) and SW (4 projects, 3.56 GW, Apr 2025)
  - 16 REZ access rights events added to timeline
  - 3 BESS projects missing REZ assignment fixed (Birriwa, Cobbora, Sandy Creek)
  - New England and Hunter-Central Coast REZs not yet awarding access rights
- **Construction coordinates**: 21 additional projects geolocated (250 total with coordinates)
- **Key dev projects enriched**: Yanco Delta (Origin, $4B), Dinawan (Spark/TNB), Liverpool Range (Tilt), Spicers Creek (Squadron)
- **Duplicate resolution**: Blue Mackerel North has 2 AEMO entries flagged; original 3 duplicates already resolved
- **Phase 3.5 declared complete**

### Session 11 — 2026-03-12
- **Offshore wind toggle**: Added toggle to NEM Dashboard that excludes offshore_wind from all charts + headline stats (defaults to OFF)
  - `useNEMStats` now accepts `excludeTechs` filter, added `total_projects` to stats
  - Pill-shaped toggle button with 🌊 icon, ON/OFF indicator, sky-blue accent when active
  - Fixed hardcoded "1,067 projects" to dynamic count
- **Phase 4 plan written**: Detailed implementation plan for confidence, developer profiles, map view, COD drift stored in BUILD-TRACKER
- **Phase 4.1 started — Confidence scoring**:
  - Built `compute_confidence.py` processor — evaluates 10+ data completeness signals per project
  - Added `confidence_score` column (migration 005)
  - Scored all 1,064 projects: 4 high (Eraring Battery, Golden Plains, VBB, Yanco Delta), 30 good, 260 medium, 770 low
  - Exported confidence_score in project index + detail JSON
  - Frontend type updated (`confidence_score` in ProjectSummary)
  - **Remaining**: ConfidenceDots on cards, confidence filter on ProjectList, confidence stats on Dashboard

### Session 12 — 2026-03-12
- **Step 4.2 completed — Developer Portfolio Pages**:
  - Built `export_developer_profiles()` in export_json.py — 718 developers with slugs, tech/status/state breakdown
  - Built `DeveloperList.tsx` — searchable grid with text search, tech/state filter pills, sort options, URL-based filter state
  - Built `DeveloperDetail.tsx` — portfolio page with stat cards, Recharts BarChart tech mix, pipeline status bars, project list
  - Built `useDeveloperData.ts` hooks + DeveloperProfile/DeveloperIndex types
  - Added routes `/developers` + `/developers/:slug`, UsersIcon in nav
- **Step 4.3 completed — Map View (Leaflet)**:
  - Built `export_coordinates_index()` — 250 projects to `by-coordinates.json`
  - Built `MapView.tsx` — CARTO dark tiles, CircleMarkers sized by capacity (4-10px), tech-colored
  - Filter overlay: 6 tech pills + 3 status pills + project count
  - Built `useMapData.ts` hook + MapProject type, GlobeIcon in nav
- **Step 4.4 completed — COD Drift Analytics**:
  - Built `export_cod_drift()` — 7 projects with drift data from cod_original/cod_current parsing
  - Added COD Drift Tracker section to Dashboard with drift badges (amber delays, green ahead)
  - Added drift badge to ProjectDetail COD MetricBox
  - Built `useCODDrift.ts` hook + CODDriftProject/CODDriftData types
- **Navigation**: Desktop sidebar now 10 items; mobile bottom nav unchanged (5 items)
- **Build**: `npx tsc -b && npx vite build` passed clean

---

## Phase 4: Intelligence Layer — IN PROGRESS

### Overview
Phase 4 adds intelligence on top of the existing 1,064-project database: auto-computed confidence ratings, developer portfolio pages, COD drift analytics, and a map view. All four features build on data already in the DB — no new external API calls needed.

### Current State (Pre-Implementation)
- `data_confidence` column exists in `projects` table (values: high/good/medium/low/unverified)
- Current distribution: 52 high, 1 good, 8 medium, 1,003 low — most set manually, needs auto-computation
- `ConfidenceDots.tsx` component already exists (4-dot visual with colors)
- `by-developer.json` index already exported (718 distinct developers)
- `cod_history` table exists but sparse (10 records across 5 projects)
- 250 projects have lat/lon coordinates; exported as `coordinates: { lat, lng }` in JSON
- No mapping library installed yet

---

### Step 4.1: Auto-Computed Confidence Ratings

**Goal:** Replace manual confidence assignments with a scoring algorithm that evaluates data completeness per project.

**New file:** `pipeline/processors/compute_confidence.py` (~150 lines)

Scoring algorithm (points → tier):
| Signal | Points | Max |
|--------|--------|-----|
| Timeline events | 3 per event | 15 |
| Coordinates present | 10 | 10 |
| Performance data (any year) | 10 | 10 |
| COD history (2+ entries) | 10 | 10 |
| Ownership history exists | 5 | 5 |
| Notable description (>50 chars) | 10 | 10 |
| High-tier sources (tier 1-2) | 5 per source | 15 |
| Has current_developer | 5 | 5 |
| Has storage_mwh (for BESS/hybrid) | 5 | 5 |
| Has OEM/turbine model | 5 | 5 |

Tier mapping:
- **HIGH** (75-100): Deeply enriched, multiple sources
- **GOOD** (50-74): Good coverage, most fields populated
- **MEDIUM** (25-49): Basic data plus some enrichment
- **LOW** (0-24): Minimal data (AEMO import only)

Steps:
- [x] Schema: `data_confidence` column already exists
- [x] Build `compute_confidence.py` — query all data signals per project, compute score, update `data_confidence`
- [x] Add `confidence_score` INTEGER column to projects table (migration 005) — store raw numeric score
- [x] Run processor — Distribution: 4 high, 30 good, 260 medium, 770 low
- [x] Update JSON export to include `confidence_score` in project index + detail
- [x] Frontend: ConfidenceDots already on ProjectList cards + ProjectDetail header (pre-existing)
- [x] Frontend: confidence filter on ProjectList — "Data" row with High/Good/Medium/Low pills
- [x] Frontend: "Data Quality" section on Dashboard — horizontal bars with counts, %, links to filtered list

**Files to modify:**
- NEW: `pipeline/processors/compute_confidence.py`
- NEW: `database/migrations/005_confidence_score.sql`
- MODIFY: `pipeline/exporters/export_json.py` — export confidence_score
- MODIFY: `frontend/src/lib/types.ts` — add confidence_score to ProjectSummary
- MODIFY: `frontend/src/pages/ProjectList.tsx` — confidence filter + dots on cards
- MODIFY: `frontend/src/pages/ProjectDetail.tsx` — confidence dots in header

---

### Step 4.2: Developer Portfolio Pages

**Goal:** New `/developers` list page + `/developers/:name` detail page showing portfolio aggregation per developer.

**Data available:**
- 718 distinct developers in `current_developer` column
- `by-developer.json` already maps developer → project IDs
- Top developers: Hydro-Electric Corp (22), Edify Energy (16), Neoen (11), X-Elio (11), ARK Energy (10)

**New export:** `pipeline/exporters/export_json.py` → add `export_developer_profiles()`:

Output: `frontend/public/data/indexes/developer-profiles.json`
```json
{
  "developers": [
    {
      "slug": "neoen-australia",
      "name": "Neoen Australia",
      "project_count": 11,
      "total_capacity_mw": 2450,
      "total_storage_mwh": 1200,
      "by_technology": { "wind": 3, "solar": 4, "bess": 4 },
      "by_status": { "operating": 5, "construction": 3, "development": 3 },
      "states": ["NSW", "VIC", "SA"],
      "avg_confidence": "good",
      "project_ids": ["hornsdale-power-reserve", ...]
    }
  ],
  "total_developers": 718
}
```

**Frontend pages:**
- `/developers` — searchable list, sorted by total capacity, cards with tech breakdown
- `/developers/:slug` — full portfolio: stats cards, project list, tech mix chart, state breakdown

Steps:
- [x] Add `export_developer_profiles()` to `export_json.py`
- [x] Create slug generation (lowercase, hyphenated, deduplicated)
- [x] Run export, verify JSON output — 718 developers exported
- [x] NEW: `frontend/src/hooks/useDeveloperData.ts` — fetch and filter developer profiles
- [x] NEW: `frontend/src/pages/DeveloperList.tsx` — searchable developer grid with tech/state filters
- [x] NEW: `frontend/src/pages/DeveloperDetail.tsx` — portfolio page with Recharts tech mix chart, pipeline status bars
- [x] Add routes: `/developers`, `/developers/:slug`
- [x] Add "Developers" to navigation (desktop sidebar with UsersIcon)

**Files to modify:**
- MODIFY: `pipeline/exporters/export_json.py` — add developer profile export
- NEW: `frontend/src/hooks/useDeveloperData.ts`
- NEW: `frontend/src/pages/DeveloperList.tsx`
- NEW: `frontend/src/pages/DeveloperDetail.tsx`
- MODIFY: `frontend/src/lib/dataService.ts` — add fetchDeveloperProfiles, fetchDeveloperDetail
- MODIFY: `frontend/src/App.tsx` — add routes
- MODIFY: `frontend/src/components/Layout.tsx` — add to nav

---

### Step 4.3: Map View

**Goal:** Interactive map showing 250+ geolocated projects with clustering, tech-colored markers, and click-to-detail.

**Library:** Leaflet + React-Leaflet (open-source, no API key, OSM tiles)
- `npm install leaflet react-leaflet`
- `npm install -D @types/leaflet`

**Data:** Project index already includes coordinates. Create a filtered coordinates index for faster map loading:

Output: `frontend/public/data/indexes/by-coordinates.json`
```json
[
  {
    "id": "golden-plains-wind",
    "name": "Golden Plains Wind Farm",
    "technology": "wind",
    "status": "construction",
    "capacity_mw": 1300,
    "state": "VIC",
    "lat": -37.78,
    "lng": 143.94
  }
]
```

**Frontend page:** `/map` (~350 lines)
- Full-viewport map (mobile: full screen minus nav; desktop: full minus sidebar)
- Marker clustering (react-leaflet-cluster or manual)
- Tech-colored markers using TECHNOLOGY_CONFIG colors
- Click marker → popup with name, tech, capacity, status, link to detail
- Filter panel: technology pills + status pills (overlay on map)
- REZ zone boundaries (stretch goal — GeoJSON overlays)
- Australia-centered default view: `[-25.5, 134]` zoom 4

Steps:
- [x] `npm install leaflet react-leaflet @types/leaflet` in frontend/
- [x] Add coordinates index export to `export_json.py` — `export_coordinates_index()` (250 projects)
- [x] Run export, verify JSON — `by-coordinates.json` generated
- [x] NEW: `frontend/src/pages/MapView.tsx` — Leaflet map with CARTO dark tiles, CircleMarkers sized by capacity, tech-colored
- [x] NEW: `frontend/src/hooks/useMapData.ts` — fetch coordinates index
- [x] Import Leaflet CSS in `index.css` + dark popup overrides
- [x] Add route: `/map`
- [x] Add "Map" to navigation (desktop sidebar with GlobeIcon)
- [ ] Test mobile responsiveness (touch zoom, popup sizing)

**Files to modify:**
- MODIFY: `pipeline/exporters/export_json.py` — add coordinates index export
- MODIFY: `frontend/package.json` — add leaflet + react-leaflet
- NEW: `frontend/src/pages/MapView.tsx`
- NEW: `frontend/src/hooks/useMapData.ts`
- MODIFY: `frontend/src/lib/dataService.ts` — add fetchMapData
- MODIFY: `frontend/src/App.tsx` — add route
- MODIFY: `frontend/src/components/Layout.tsx` — add to nav
- MODIFY: `frontend/src/index.css` or `main.tsx` — Leaflet CSS import

---

### Step 4.4: COD Drift Analytics

**Goal:** Visualise COD drift patterns — which projects are delayed, by how much, and trends by technology.

**Current data limitations:**
- Only 10 `cod_history` records across 5 projects (very sparse)
- `cod_original` and `cod_current` columns exist on most projects but many are NULL
- Timeline events with type `cod_change` could be mined

**Approach:** Two-part — (A) harvest more COD data from existing DB, (B) build drift visualisation.

**(A) COD Data Harvester:** `pipeline/processors/harvest_cod_drift.py` (~150 lines)
- Parse `cod_original` and `cod_current` from all projects with both fields
- Calculate drift_months = difference between original and current
- Create summary stats by technology and year
- Export: `frontend/public/data/indexes/cod-drift.json`
```json
{
  "projects_with_drift": 120,
  "avg_drift_months": { "wind": 8.2, "solar": 5.1, "bess": 3.7 },
  "by_project": [
    { "id": "...", "name": "...", "technology": "wind", "original": "2024", "current": "2026", "drift_months": 24 }
  ]
}
```

**(B) Frontend:** Add COD drift section to Dashboard or as sub-tab on Performance page
- Bar chart: average drift by technology
- Scatter plot: project capacity vs drift months
- Top 10 most delayed projects list
- Could also add drift indicator on ProjectDetail (already partially shown)

Steps:
- [x] Build drift export in `export_json.py` — `export_cod_drift()` parses cod_original/cod_current, computes drift_months, includes cod_history
- [x] Run export, verify JSON — 7 projects with drift, 5 with history (data is sparse — only 7 projects have both cod_original + cod_current)
- [x] Frontend: COD Drift Tracker section on Dashboard — project list with drift badges (amber delayed, green ahead)
- [x] Add drift badge to ProjectDetail COD MetricBox (e.g., "+12 mo" amber pill)

**Files to modify:**
- NEW: `pipeline/processors/harvest_cod_drift.py`
- MODIFY: `pipeline/exporters/export_json.py` — add drift export
- NEW or MODIFY: Frontend component for drift charts
- MODIFY: `frontend/src/pages/ProjectDetail.tsx` — drift badge

---

### Step 4.5: Performance Metrics Deep Dive (Methodology Guide)

**Goal:** A dedicated methodology page/modal accessible from Performance page via a prominent info button, providing a thorough explanation of how capacity factor, curtailment, and all other metrics are calculated, where the data comes from, and what the limitations are.

**Current state:**
- 11 compact metric tooltips already exist in Performance.tsx (hover/click popups, ~2-3 lines each)
- "About This Data" section at bottom of Performance page (3 brief paragraphs)
- These are good for quick reference but don't explain the full data pipeline or edge cases

**What's needed:** A deeper explainer covering:

#### Capacity Factor — Deep Dive
- **Definition:** Ratio of actual generation to theoretical maximum at nameplate capacity
- **Formula:** `CF = Energy_MWh / (Capacity_MW × Hours_in_Period) × 100`
- **Data source:** AEMO 5-minute dispatch intervals (SCADA data), aggregated to annual totals via OpenElectricity API
- **Capacity used:** Nameplate (registered) capacity from AEMO Generation Information, NOT maximum output or de-rated capacity
- **Hours in period:** Full year = 8,760 hours (8,784 in leap year); for YTD data, actual hours elapsed to date
- **What affects CF:** Wind resource quality, solar irradiance, plant age/degradation, planned outages, unplanned outages, curtailment, connection constraints
- **Typical ranges:** Wind 25-45%, Solar 18-28%, Pumped Hydro 5-35% (depends on dispatch strategy)
- **Caveats:** CF doesn't distinguish between voluntary curtailment (negative prices) and forced curtailment (constraints). A low CF could mean bad wind or smart market behaviour.
- **Hybrid projects:** May have combined CF for co-located generation; AEMO tracks DUIDs separately but OpenElectricity may aggregate

#### Curtailment — Deep Dive
- **Definition:** Estimated percentage of potential generation that was NOT dispatched, despite available resource (wind/sun)
- **Why it's estimated:** AEMO doesn't publish a single "curtailment" number per facility. True curtailment requires comparing:
  - Actual dispatch vs available capacity (from SCADA)
  - Constraint equations that bound output
  - Semi-scheduled generator UIGF (Unconstrained Intermittent Generation Forecast) vs actual
- **Our method:** Derived from dispatch data patterns — comparing expected output (resource availability × capacity) vs actual output. This is an approximation.
- **Types of curtailment:**
  - **Economic** — Generator self-curtails during negative prices (voluntary, rational)
  - **Network constraints** — AEMO directs reduced output due to transmission limits
  - **System security** — AEMO directs reduction for grid stability (frequency, inertia)
  - **Connection limits** — Runback schemes at connection point
- **Data source:** AEMO NEMWEB dispatch data, processed by OpenElectricity. Future improvement: use NEMWEB constraint equation data directly for precise curtailment.
- **Limitation:** Currently indicative only. Under-reports economic curtailment, may over-report for plants with genuine low output.

#### Revenue & Pricing
- **Market value:** Total wholesale energy revenue from NEM spot market ($)
- **Excludes:** LGC (Large-scale Generation Certificate) revenue, PPA contract premiums, FCAS/ancillary services, capacity payments
- **Real-world revenue** for most projects is 30-60% higher than wholesale market value alone (LGCs add $30-50/MWh for eligible projects)
- **Price received ($/MWh):** Volume-weighted average spot price at time of dispatch — reflects the generator's price exposure profile

#### BESS-Specific Metrics
- **Charge/discharge data:** AEMO registers battery units as two separate DUIDs (charging unit + discharging unit). OpenElectricity tracks both.
- **Round-trip efficiency:** Typically 85-90% for lithium-ion. Visible as discharged < charged energy.
- **Cycles:** Full equivalent cycles (total discharged ÷ storage capacity). Most BESS do 1-2 cycles/day.
- **Revenue model:** Primarily arbitrage (charge low, discharge high) + FCAS. Our data captures arbitrage only.

#### Data Pipeline
- **Source:** OpenElectricity API → AEMO NEMWEB dispatch & settlement data
- **Frequency:** Annual aggregation (sum of 5-minute intervals). Monthly available but not yet imported.
- **Coverage:** All NEM-registered facilities. WEM (Western Australia) NOT covered.
- **Latency:** ~2-3 days behind real-time (settlement data lag)
- **API plan:** Community (free), 500 requests/day

**Implementation approach:** Full-page guide at `/guides/performance-methodology` (reuse existing Guides infrastructure) OR a slide-out panel/modal triggered by info button on Performance page.

Steps:
- [ ] Write methodology content (structured markdown or TSX)
- [ ] Decide format: new Guide page vs. modal/drawer on Performance page
- [ ] Add prominent "How is this calculated?" button near Performance page header
- [ ] Link from existing metric tooltips to relevant section of deep dive
- [ ] Include worked examples (e.g., "Coopers Gap Wind: 1,000 MW × 8,760h = 8,760,000 MWh max → actual 2,890,000 MWh → CF = 33%")

**Files to modify:**
- NEW: Guide content (either `frontend/public/guides/performance-methodology.md` or inline in TSX)
- MODIFY: `frontend/src/pages/Performance.tsx` — add info button linking to deep dive
- POSSIBLY MODIFY: `frontend/src/pages/Guides.tsx` — if adding as a new guide

---

### Implementation Order

| # | Task | Est. Lines | Dependencies | Priority |
|---|------|-----------|--------------|----------|
| 4.1 | Confidence scoring pipeline | ~150 | None | HIGH |
| 4.1b | Confidence UI (filters, dots) | ~100 | 4.1 | HIGH |
| 4.2 | Developer profile export | ~100 | None | HIGH |
| 4.2b | Developer list + detail pages | ~700 | 4.2 | HIGH |
| 4.3 | Map view (Leaflet) | ~400 | None | MEDIUM |
| 4.3b | Map filters + clustering | ~150 | 4.3 | MEDIUM |
| 4.4 | COD drift harvester | ~150 | None | LOW (sparse data) |
| 4.4b | COD drift visualisation | ~200 | 4.4 | LOW |
| 4.5 | Metrics methodology deep dive | ~300 | None | MEDIUM |
| 4.6 | Navigation update (final) | ~50 | 4.2b, 4.3 | After all pages |
| 4.7 | Build verify + push | — | All | Last |

**Recommended session plan:**
- **Session 11:** Steps 4.1 + 4.1b (confidence) + 4.2 (developer export) — pipeline work ✅ DONE
- **Session 12:** Steps 4.2b + 4.3 + 4.4 (developer pages, map, COD drift) ✅ DONE
- **Session 13:** Steps 4.5 (methodology) + 4.6 (nav polish) + 4.7 (verify/push) — finish + polish

---

### Verification Checklist
- [x] `python3 pipeline/processors/compute_confidence.py` updates all 1,064 projects
- [x] `python3 pipeline/exporters/export_json.py` exports developer-profiles.json + by-coordinates.json + cod-drift.json
- [x] `npx tsc -b && npx vite build` passes clean
- [x] `/developers` renders searchable developer grid
- [x] `/developers/:slug` renders portfolio with charts
- [x] `/map` renders Leaflet map with 250+ markers, tech colors, filter overlay
- [x] ProjectList shows confidence dots, filterable by tier
- [x] ProjectDetail shows confidence score + drift badge
- [x] Desktop sidebar: 10 items (Home, Dashboard, Projects, Performance, Developers, Map, Schemes, REZ, Guides, Search)
- [x] Mobile bottom nav: 5 items (Home, Projects, Perf, REZ, Search)
- [ ] No console errors on any page (not yet verified on all pages)

---

## What To Build After Phase 4

### Medium Term (Phase 5+)
1. **Monthly performance data** — Change interval from annual to monthly for sparklines/seasonal patterns
2. **Emissions data** — Add `emissions` metric to OpenElectricity data fetch (0 extra API calls)
3. **Watchlist feature** — User-defined project watchlists with change notifications
4. **New England REZ access rights** — Populate when declared (~Q2 2026)
5. **Operations-to-development mapping** — Show nearby operating performance for proposed projects
6. **REZ zone GeoJSON overlays** — Show REZ boundaries on map view
