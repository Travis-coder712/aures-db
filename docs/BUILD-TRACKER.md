# AURES Database — Build Tracker

> **Last Updated:** 2026-03-12
> **Current Phase:** Phase 3.5 complete, ready for Phase 4
> **Status:** Phases 1-3.5 complete. 1,064 projects (incl. 22 offshore wind). Real 2024+2025 performance data + 2026 YTD from OpenElectricity API. 593 timeline events. 250 projects with coordinates. Offshore wind fully enriched. REZ access rights populated (CWO 10 projects, SW 4 projects). Info tooltips on Performance page.

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 95% |
| Phase 2: CIS/LTESA/REZ | ✅ Complete | 100% |
| Phase 2.5: NEM Dashboard + REZ | ✅ Complete | 100% |
| Phase 3: Performance | ✅ Complete | 100% |
| Phase 3.5: Data Quality + Enrichment | ✅ Complete | 100% |
| Phase 4: Intelligence | Not Started | 0% |
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
  performance/league-tables/*.json  — League table rankings by tech+year (8 files + index)
  performance/quartile-benchmarks/  — Quartile stats per metric
  metadata/stats.json               — Quick stats for dashboard

Layer 3: PWA FRONTEND  ✅ BUILT & DEPLOYED
  React 19 + TypeScript + Vite 6 + Tailwind 4
  Async data loading (dataService.ts + useProjectData hooks)
  Fuse.js search across 1,064 projects
  Performance league tables with info tooltips + data source badges
  6 technology categories: wind, solar, BESS, hybrid, offshore wind, pumped hydro
  13 pages: Home, Dashboard, ProjectList, ProjectDetail, Performance, Search, Guides, GuideReader, SchemesOverview, SchemeRoundDetail, REZList, REZDetail, NotFound
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

---

## What To Build Next

### Short Term (Phase 4 — Intelligence Layer)
1. **Confidence ratings** — Implement 4-tier system (HIGH/GOOD/MEDIUM/LOW) based on data completeness
2. **Developer profiles** — Aggregate portfolio views by developer (Origin, AGL, Neoen, etc.)
3. **COD drift tracking** — Visualise how expected COD dates shift over time
4. **Map view** — 250 projects now have coordinates; map is feasible

### Medium Term
5. **Monthly performance data** — Change interval from annual to monthly for sparklines/seasonal patterns
6. **Emissions data** — Add `emissions` metric to OpenElectricity data fetch (0 extra API calls)
7. **Watchlist feature** — User-defined project watchlists with change notifications
8. **New England REZ access rights** — Populate when declared (~Q2 2026)
9. **Operations-to-development mapping** — Show nearby operating performance for proposed projects
