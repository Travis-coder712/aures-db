# AURES Database — Build Tracker

> **Last Updated:** 2026-03-10
> **Current Phase:** Phase 1 — Foundation
> **Current Task:** Project scaffolding and setup

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | 🟡 In Progress | ██░░░░░░░░ 15% |
| Phase 2: CIS/LTESA/REZ | ⬜ Not Started | ░░░░░░░░░░ 0% |
| Phase 3: Performance | ⬜ Not Started | ░░░░░░░░░░ 0% |
| Phase 4: Intelligence | ⬜ Not Started | ░░░░░░░░░░ 0% |
| Phase 5: Data Enrichment | ⬜ Ongoing | ░░░░░░░░░░ 0% |

---

## Phase 1: Foundation — Detailed Task Tracker

### Completed
- [x] Create GitHub repo (travis-coder712/aures-db)
- [x] Clone and set up directory structure
- [x] Create project documentation (PROJECT-PLAN.md, SESSION-GUIDE.md, BUILD-TRACKER.md)
- [x] Create plain English overview
- [x] Create vibecoding notes
- [ ] ...continuing below

### In Progress
- [ ] Set up React + Vite + TypeScript + Tailwind + PWA
- [ ] Create SQLite database schema

### Not Started
- [ ] Build Python AEMO Generation Information importer
- [ ] Build JSON export pipeline
- [ ] Build Home dashboard page
- [ ] Build Project list page with filters
- [ ] Build Project detail page with tabs (Overview, Timeline, Technical, Sources)
- [ ] Build universal search (Fuse.js)
- [ ] Build mobile bottom navigation
- [ ] Build desktop sidebar navigation
- [ ] Populate 10 exemplar projects with full multi-source data
- [ ] Deploy to GitHub Pages
- [ ] Test PWA installation on iPhone

### Blockers
- None currently

---

## What To Build Next (For Claude)

When resuming, the next tasks in order are:

1. **If frontend not yet scaffolded:** Set up Vite + React + TypeScript + Tailwind + vite-plugin-pwa in /frontend
2. **If schema not created:** Create SQLite schema in /database/schema.sql
3. **If AEMO importer not built:** Build Python script to parse AEMO Generation Information Excel
4. **If export not built:** Build JSON export from SQLite to /data/
5. **If screens not built:** Build Home, ProjectList, ProjectDetail pages
6. **If exemplars not populated:** Research and create full JSON for 10 exemplar projects
7. **If not deployed:** Set up GitHub Pages deployment via GitHub Actions

---

## Data Population Progress

### Exemplar Projects (Phase 1 Target: 10)
| # | Project | Technology | Status |
|---|---------|-----------|--------|
| 1 | Yanco Delta Wind Farm | Wind + BESS | ⬜ Not Started |
| 2 | Golden Plains Wind Farm | Wind | ⬜ Not Started |
| 3 | Victorian Big Battery | BESS | ⬜ Not Started |
| 4 | Hornsdale Power Reserve | BESS | ⬜ Not Started |
| 5 | Eraring Battery | BESS | ⬜ Not Started |
| 6 | Waratah Super Battery | BESS | ⬜ Not Started |
| 7 | Stockyard Hill Wind Farm | Wind | ⬜ Not Started |
| 8 | Coopers Gap Wind Farm | Wind | ⬜ Not Started |
| 9 | New England Solar Farm | Solar | ⬜ Not Started |
| 10 | Collie Battery | BESS | ⬜ Not Started |

### CIS Rounds (Phase 2)
| Round | Projects | Status |
|-------|----------|--------|
| Pilot NSW | 6 | ⬜ |
| Pilot SA-VIC | 6 | ⬜ |
| Tender 1 | 19 | ⬜ |
| Tender 2 | 4 | ⬜ |
| Tender 3 | 16 | ⬜ |
| Tender 4 | 20 | ⬜ |

### LTESA Rounds (Phase 2)
| Round | Projects | Status |
|-------|----------|--------|
| Round 1 | 4 | ⬜ |
| Round 2 | 6 | ⬜ |
| Round 3 | 5 | ⬜ |
| Round 4 | 2 | ⬜ |
| Round 5 | 3 | ⬜ |
| Round 6 | 6 | ⬜ |

---

## Session Log

### Session 1 — 2026-03-10
- **What happened:** Comprehensive design session. Explored data sources, architecture options, and feasibility. Decided on three-layer hybrid architecture (Python pipeline + SQLite + PWA).
- **Key decisions:**
  - React + Vite + Tailwind + PWA on GitHub Pages
  - SQLite for data management, JSON for PWA consumption
  - Multi-source intelligence model (show all sources, don't hide conflicts)
  - Confidence rating system for data points
  - Project timeline as core differentiating feature
  - Performance league tables for Wind, Solar, BESS
  - Watchlist with risk scoring for CIS/LTESA/REZ projects
- **Data sources confirmed:** AEMO, DCCEEW, ASL, EnergyCo, AFR, RenewEconomy, WattClarity, Modo Energy, OpenElectricity, Global Energy Monitor, CEC, PV Magazine, Energy Storage News
- **Exemplar designed:** Yanco Delta Wind Farm with full timeline model
- **Started building:** Repo created, directory structure, documentation
