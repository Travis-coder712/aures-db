# AURES Database — Build Tracker

> **Last Updated:** 2026-03-10
> **Current Phase:** Phase 1 — Foundation
> **Status:** Core frontend complete, data pipeline built, deployed to GitHub Pages

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | In Progress | 85% |
| Phase 2: CIS/LTESA/REZ | Not Started | 0% |
| Phase 2.5: Map + NEM Summary | Not Started | 0% |
| Phase 3: Performance | Not Started | 0% |
| Phase 4: Intelligence | Not Started | 0% |
| Phase 5: Data Enrichment | Ongoing | 0% |

---

## Phase 1: Foundation — Detailed Task Tracker

### Completed
- [x] Create GitHub repo (travis-coder712/aures-db)
- [x] Clone and set up directory structure
- [x] Create project documentation (5 docs)
- [x] Set up React 19 + Vite 6 + TypeScript + Tailwind 4 + PWA
- [x] Build mobile-first layout (bottom nav + desktop sidebar)
- [x] Build Home dashboard page (stats, tech browse, pipeline status, featured projects)
- [x] Build Project list page with filters (technology, status, state)
- [x] Build Project detail page with tabs (Overview, Timeline, Technical, Sources)
- [x] Build universal search (Fuse.js fuzzy search)
- [x] Build 404 page
- [x] Deploy to GitHub Pages via GitHub Actions
- [x] Build Guides feature (7 guides readable in-app with markdown rendering)
- [x] Create SQLite database schema (15 tables: projects, timeline_events, sources, ownership, COD history, suppliers, offtakes, schemes, multi-source values, audit log, AEMO data, import metadata)
- [x] Seed database with 10 exemplar projects
- [x] Build JSON export pipeline (SQLite → static JSON: project index, per-project detail, indexes by tech/state/status/developer, stats, metadata)
- [x] Fix source URLs to link to specific pages (AEMO Gen Info page, specific RenewEconomy articles, EnergyCo access scheme pages, NSW Planning Portal project pages)
- [x] Enrich Coopers Gap with full timeline (FID, first generation, turbine tower felling, repairs, final turbine installation, COD)

### Remaining
- [ ] Build Python AEMO Generation Information importer (download + parse the Excel file)
- [ ] Enrich remaining 9 exemplar projects to Coopers Gap level of depth
- [ ] Wire frontend to load from /data/*.json instead of hardcoded TypeScript
- [ ] PWA icons (192px, 512px)
- [ ] Test PWA installation on iPhone

### Blockers
- None currently

---

## Data Population Progress

### Exemplar Projects (10 loaded)

| # | Project | Tech | State | Data Depth |
|---|---------|------|-------|-----------|
| 1 | Yanco Delta Solar Farm | Solar | NSW | Good (6 timeline events, ownership change, COD drift, cost sources) |
| 2 | Golden Plains Wind Farm | Wind | VIC | Basic (3 events, Vestas OEM) |
| 3 | Victorian Big Battery | BESS | VIC | Good (5 events incl. Megapack fire, Tesla OEM) |
| 4 | Hornsdale Power Reserve | BESS | SA | Good (4 events, 3 phases, Tesla OEM) |
| 5 | Waratah Super Battery | BESS | NSW | Good (3 events, Tesla OEM, SIPS) |
| 6 | Stockyard Hill Wind Farm | Wind | VIC | Basic (3 events, Goldwind OEM, Origin PPA) |
| 7 | Coopers Gap Wind Farm | Wind | QLD | **Enriched** (7 events incl. FID, first gen, tower felling, repairs, final turbine, COD drift, GE EPC, specific source articles) |
| 8 | New England Solar Farm | Hybrid | NSW | Basic (3 events) |
| 9 | Eraring Battery | BESS | NSW | Basic (2 events, COD drift) |
| 10 | Collie Battery | BESS | WA | Basic (1 event) |

### CIS Rounds (Phase 2)
Pilot NSW, Pilot SA-VIC, Tender 1-8 — all pending

### LTESA Rounds (Phase 2)
Round 1-6 — all pending

---

## Architecture Built

```
Layer 0: DATA PIPELINE (Python)  ✅ BUILT
  pipeline/db.py              — Database connection helper
  pipeline/exporters/         — JSON export from SQLite
  pipeline/importers/         — (AEMO importer next)
  pipeline/requirements.txt   — openpyxl, requests, pandas

Layer 1: SQLite DATABASE  ✅ BUILT
  database/schema.sql         — 15 tables, full schema
  database/aures.db           — Working database with 10 projects
  database/seeds/             — Exemplar project seed script

Layer 2: STATIC JSON  ✅ BUILT
  data/projects/index.json    — All project summaries
  data/projects/{tech}/{id}.json — Full project detail per project
  data/indexes/by-*.json      — Indexes by tech, state, status, developer
  data/metadata/stats.json    — Quick stats for dashboard
  data/metadata/last-export.json — Export timestamp

Layer 3: PWA FRONTEND  ✅ BUILT & DEPLOYED
  React 19 + TypeScript + Vite 6 + Tailwind 4
  7 pages: Home, ProjectList, ProjectDetail, Search, Guides, GuideReader, NotFound
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
- Fixed source URLs to link to specific pages (not generic homepages)
- Enriched Coopers Gap with full construction timeline (FID, turbine issues, tower felling, COD drift)

---

## What To Build Next

1. **AEMO Generation Information importer** — Download and parse the AEMO Excel file to populate the database backbone
2. **Enrich exemplar projects** — Bring all 10 projects up to the Coopers Gap level of depth (specific source articles, full timelines, all key events)
3. **Wire frontend to JSON data** — Switch from hardcoded TypeScript sample data to fetching from /data/*.json
4. **PWA icons** — Generate proper 192px and 512px icons
5. **Phase 2** — CIS/LTESA round structure
