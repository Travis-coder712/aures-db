# AURES — Next Session Handoff

**Created:** 2026-04-17, end of the v2.28.1 session
**Last shipped version:** v2.28.1
**Purpose:** A single-place brief for whoever picks up next. Cold-readable — no context required beyond this file plus the authoritative `docs/INTELLIGENCE_LAYER_PLAN.md`.

---

## 🟢 Current state snapshot (v2.28.1)

### What's live on the deployed site
- **26 releases shipped** v2.15.1 → v2.28.1 across two major tracks:
  - **Intelligence Layer Plan** (foundation + Tier 1-3): **complete at v2.26.0**
  - **NEM Live Market Pulse** (from phone-brief integration): **2 of 3 shipped** (v2.27 coal, v2.28 battery). v2.29 CIS Wind Pipeline still queued.
- All features on `https://travis-coder712.github.io/aures-db/`
- Plan doc: `docs/INTELLIGENCE_LAYER_PLAN.md` — authoritative release log

### Pipeline / data state
- **Coal dispatch**: `dispatch_availability` table has 90 days of NEMWEB DISPATCHLOAD 5-min data — 1.05M rows covering all 15 NEM coal stations / 44 DUIDs.
  - Latest date: approximately 2026-04-16 (depends on when you re-run)
  - Importer: `python3 pipeline/importers/import_dispatchload.py --days N`
  - Also supports `--month YYYY-MM` for historical MMSDM archives (for backfills > 1 year)
- **Battery SCADA**: `battery_daily_scada` (450 daily rollups) + `battery_records` (20 all-time records) populated from OpenElectricity 5-min API
  - Importer: `python3 pipeline/importers/import_battery_scada.py --days N`
  - Needs `OPENELECTRICITY_API_KEY` env var (set in `~/.zshrc`)
- Both analytics JSONs emit with real data:
  - `analytics/intelligence/coal-outage-dispatch.json`
  - `analytics/intelligence/battery-live-records.json`

### Known data findings (from latest runs, last 90 days)
- **NEM coal fleet**: 86.5% dispatched / 12.6% outage / 0.9% displaced
  - NSW leads structural displacement at 3.3% (Eraring)
  - Gladstone (QLD) highest outage at 41.9% (Rio Tinto maintenance)
  - Yallourn (VIC brown coal) at 25.2% outage
- **NEM battery fleet**: max 5-min discharge 3,675 MW (25 Jan 2026), max daily discharge 16 GWh (13 Apr 2026)

---

## 🔴 Active in-flight work — USER'S LATEST ASK (top priority for next session)

The user raised three improvements right before session end:

### 1. YTD vs full-year comparison problem (CRITICAL — partially incorrect data on live site)
The existing `coal-watch.json` shows Eraring 2026 as 3,680 GWh / 14.6% CF vs 2025 at 11,450 GWh / 45.4% CF. **This is apples-to-oranges** — 2026 is 3-4 months of data compared to a full year. The CF is probably already year-annualised (so technically ok) but the GWh generation comparison is misleading.

**User's proposed fix:**
- Add a **year selector** + **YTD mode** to the Coal Watch
- When "2026" is selected, default to **YTD mode**: compare YTD 2026 vs the **same period** in 2025, 2024, 2023, 2022, 2021 (the first N days/months of each prior year)
- When "2025" or earlier is selected, default to **full-year** mode: compare full 2025 vs full 2024 / 2023 / 2022 / 2021
- Make the apples-to-apples comparison explicit in the UI ("YTD Jan-Apr 2026 vs Jan-Apr 2025")

### 2. 5-year historical data constraint
**Blocker:** OpenElectricity **free tier caps at 367 days of history**. To go back 5 years we need one of:
- **Option A**: NEMWEB MMSDM historical archives (already supported by `import_dispatchload.py --month YYYY-MM`). Free, but backfilling 5 years × 12 months × ~50 MB/month = ~3 GB download. Takes ~30-60 min depending on connection.
- **Option B**: OpenElectricity paid plan (simplest but costs money)
- **Option C**: Degrade gracefully — surface as much history as available, label clearly when data is thin

**Recommended path**: build the YTD UI first (ships value even with 1 year of data). Then run a backfill script to extend history. The UI should render however much history is present.

### 3. Populate battery records + live activity
**✅ Done in v2.28.1.** 90 days of battery SCADA ingested. NEM record board is live:
- Max 5-min discharge: 3,675 MW
- Max daily discharge: 16,001 MWh

If user wants longer records history, re-run with `--days 365` or extend further with per-day loops.

---

## 🎯 Recommended v2.29.0 scope

Bundle three things into one release:

### A. YTD + Same-period Comparison (the user's CRITICAL ask)
**Exporter work:**
- New `export_coal_ytd_comparison()` function using `dispatch_availability` table
  - Aggregate to monthly (or daily) per station
  - Produce rollups per (year, cumulative-through-month) — eg "2026 through April" = sum of Jan+Feb+Mar+Apr 2026
  - Same for 2025, 2024, 2023, 2022, 2021 — degrading when data absent
  - Per NEM / state / station three levels
- Output: `analytics/intelligence/coal-ytd-comparison.json`

**Frontend work:**
- Enhance `CoalWatch.tsx` Overview tab (or new tab) with:
  - Year selector pill row: `[ 2022 ] [ 2023 ] [ 2024 ] [ 2025 ] [ 2026 ]`
  - Mode toggle: `[ YTD ] [ Full year ]` — auto-default to YTD when current year selected, Full when historical year selected
  - Display logic: compute cutoff-date (day-of-year of latest data in selected year) then show same-period totals for prior 5 years
  - Clear labels: "YTD through 16 Apr" vs "Full calendar year"
- Update the `coal-watch.json` Eraring hero number to be YTD-labelled or switch to YTD-comparison view

**Data constraints:**
- With only 90 days of dispatch_availability, YTD 2026 vs same-period 2025 is partial
- Plan for graceful empty states when historical years not yet backfilled

### B. MMSDM historical backfill (enables the 5-year ask)
- Add a convenience script: `pipeline/scripts/backfill_coal_history.sh` that loops over months for 2021-2025
- Document clearly in the methodology guide
- Estimated runtime / disk: document upfront
- Auto-skip already-ingested months (the importer's UNIQUE constraint handles this)

### C. CIS Wind Pipeline filter (original v2.29 plan)
From the phone-brief integration:
- Add a wind-specific filter + "Dev Status" column to existing SchemeTracker
- **Auto "why not building" annotations** computed from existing AURES signals:
  - `development_stage = early_stage` → "pre-planning"
  - `connection_status` empty → "grid connection pending"
  - No EIS + `cod_current > 2027` → "environmental pending"
  - Developer grade D/F → "execution risk"
- Optional manual annotation field on `scheme_contracts` for confirmed blockers
- Cross-link to `/intelligence/drift-analysis` for already-slipping projects
- No new page — extension of `/intelligence/scheme-tracker`

---

## 📋 Queued but lower priority (AURES Post-Plan Backlog)

These are still in `memory/project_aures_post_plan_backlog.md`:

1. **F4 Phase 2** — pipeline trigger endpoint (needs a local backend API — replaces clipboard-copy refresh buttons)
2. **User-onboarding guide rewrites** — the 7 non-methodology guides (About / Using / Navigating / Search Tips / Data Quality / Strategic Roadmap / Project Plan)
3. **Data enrichment gaps:**
   - BESS chemistry (8% → target 50%+ via more EIS parsing)
   - Ownership history (12 records → grow via web research)
   - `development_score` column (empty — compute in pipeline)
   - FID / construction_start event capture (24/102 coverage)
   - AEMO ISP REZ data (no automated importer)
   - Market prices (no automated importer)
4. **Compare-developers view** on `/developers` (stretch from T1.B)
5. **BatteryWatch → CapacityWatch merge** (content-preservation important — 1,080 lines of content on standalone)
6. **BESS bidding per-project summaries** — pre-compute for faster loads
7. **Development-stage PPA commitments / LGC-only offtakes** — not captured in web research pass

---

## 🏗️ Architecture patterns — preserve these

**Foundation components (v2.16-v2.18) are the building blocks for everything:**
- `<ChartFrame>` — wraps all Recharts with enforced height + visibility re-measure
- `<DataTable>` — sortable, row numbers, totals, CSV export, mobile column hiding
- `<DrillPanel>` — slide-in side panel for click-through drill
- `<DataProvenance>` — source chip row with freshness + copy-refresh-command

**Pipeline pattern (unchanged since v2.16):**
- Python pipeline in `pipeline/` — importers populate SQLite, exporters emit static JSON
- Every new data source: add to `SOURCE_REGISTRY` in `frontend/src/lib/dataSources.ts` + `PAGE_SOURCES` mapping
- Exporter pattern: compute once in pipeline, emit aggregated JSON, frontend fetches once per page
- **Graceful pending-state UI**: always render correctly even when importer hasn't been run (v2.27 + v2.28 both use this)

**Release pattern (proven across 28 releases):**
- Logical commits: pipeline + frontend + guide + version-bump-release-commit
- `frontend/package.json` version bump
- Update `docs/INTELLIGENCE_LAYER_PLAN.md` release log
- `gh release create vX.Y.Z` with detailed notes
- Monitor CI (runs `tsc -b && vite build`) — strictly stricter than local `tsc --noEmit`
- **Always ensure Waratah JSON restored** after export: `cp data/projects/bess/waratah-super-battery.json frontend/public/data/projects/bess/...` — covered by the overlay merge in exporter since v2.17.1

---

## 🧰 Technical gotchas to know

1. **CI is stricter than `tsc --noEmit`** — always run `npm run build` locally before push.
2. **Icons must be defined BEFORE const arrays** that reference them (Vite HMR issue) — only relevant for some older files.
3. **Recharts quirks** — in memory file `MEMORY.md` under "Key Patterns".
4. **OpenElectricity API** — 5-min interval max 8 days per request → needs chunking (handled by battery importer).
5. **NEMWEB 21 April 2026 platform migration** — URLs may change. Both importers have placeholder notes in their docstrings.
6. **Mobile-first design** — user tests on iPhone. Verify responsive layouts.
7. **Don't commit the SQLite DB** (`database/aures.db`) — it's gitignored. Data ships as JSON exports.
8. **Don't delete `data/projects/<tech>/<id>.json`** — these are hand-enriched overlays (Waratah SIPS data especially) that the exporter merges onto DB data. See `pipeline/exporters/export_json.py` overlay merge logic.

---

## 🔑 Environment setup

- API key in `~/.zshrc`: `OPENELECTRICITY_API_KEY=oe_4zNSDDp4bBBdm4SJ4MYu9t` (Community / free plan, 498 credits remaining at last check)
- To run any OE importer: `zsh -c 'source ~/.zshrc && python3 pipeline/importers/...'`
- NEMWEB importer needs no auth — just internet.

---

## 📦 Key file locations

| File | Purpose |
|---|---|
| `docs/INTELLIGENCE_LAYER_PLAN.md` | Release log + authoritative plan |
| `docs/NEXT_SESSION_HANDOFF.md` | This file |
| `pipeline/config/coal_stations.json` | 15 NEM coal stations + 44 DUIDs (hand-curated) |
| `pipeline/importers/import_dispatchload.py` | NEMWEB coal 5-min importer |
| `pipeline/importers/import_battery_scada.py` | OE battery 5-min importer |
| `pipeline/exporters/export_json.py` | All JSON exporters |
| `frontend/src/lib/dataSources.ts` | Source registry + PAGE_SOURCES mapping |
| `frontend/src/lib/dataService.ts` | fetchXxx() lazy-cache helpers |
| `frontend/src/components/intelligence/CoalWatch.tsx` | Coal Watch with Outage/Dispatch tab |
| `frontend/src/pages/intelligence/BessPortfolio.tsx` | BESS Portfolio with Live & Records tab |
| `frontend/src/data/guides.ts` | All methodology guides |
| `memory/project_aures_intelligence_plan.md` | Memory pointer to plan |
| `memory/project_aures_post_plan_backlog.md` | Post-plan backlog (F4 Phase 2 etc.) |
| `memory/MEMORY.md` | Memory index |

---

## ▶️ How to pick up next session

1. **Read `docs/INTELLIGENCE_LAYER_PLAN.md`** for context on releases v2.15.1 → v2.28.1
2. **Read THIS file** for active in-flight work
3. Start with **v2.29.0 YTD + Same-period Comparison** — user's most recent request
4. If user says "continue", assume that's the plan unless they redirect

**Quickest path to value in the next session:**
```bash
# 1. Verify data state
sqlite3 database/aures.db "SELECT COUNT(*) FROM dispatch_availability"
sqlite3 database/aures.db "SELECT COUNT(*) FROM battery_daily_scada"

# 2. Extend coal outage exporter to emit monthly + YTD rollups
# Edit pipeline/exporters/export_json.py export_coal_outage_dispatch()
# Add per-month aggregation, per-year-cumulative rollups per station

# 3. Add year selector + YTD mode to CoalWatch.tsx
# New section or extend existing Overview tab

# 4. Run exporter + build + commit logical chunks + release v2.29.0
python3 pipeline/exporters/export_json.py
cd frontend && npm run build
# ... commits, push, gh release create v2.29.0
```

Good luck.
