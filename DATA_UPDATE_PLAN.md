# AURES Data Update Plan — May 2026

> Written by Claude Code after a comprehensive audit of the codebase, pipeline, and data state as at 9 May 2026.
> This document is the handoff reference for executing the May 2026 data run on Travis's Mac (`~/aures-db/`).

---

## Context

This plan covers the first full data refresh since the database launched. Seven data sources are stale by 23–59 days. The local DB on the dev server is EMPTY — all pipeline steps run on Travis's Mac only.

Target state: database current as at 10 May 2026, deployed as **v2.53.0**.

---

## Critical Technical Notes (Read Before Touching Anything)

### The Overlay System

`pipeline/exporters/export_json.py` merges hand-curated overlays over DB exports. Overlays live at `data/projects/{tech}/*.json`.

**`OVERLAY_OVERRIDE_FIELDS`** — these fields always come from the overlay, never from the DB:
`notable, description, timeline_events, sources, capex_total, capex_per_mw, capex_notes, sips_amount, sips_date, sips_notes, battery_status, data_confidence, last_updated, offtake_structure, revenue_model, revenue_notes, grid_connection, grid_connection_notes, developer_notes, technology_notes, additional_notes, risk_factors, key_milestones, regulatory_notes`

**`OVERLAY_FILL_EMPTY_FIELDS`** — overlay fills these only if DB returns empty:
`suppliers, scheme_contracts, ownership_history, offtakes`

**`OVERLAY_KEY_ALIASES`** — `timeline` in overlay JSON maps to `timeline_events` in export.

**Critical**: `status` is NOT in OVERRIDE_FIELDS — the DB always wins for project status. If a project has been updated to "operating" in the DB (via AEMO Gen Info import), it will show correctly even if the overlay says something different.

Do NOT bulk-overwrite overlay files. They contain hand-curated narrative, timeline events, and financial data that is not in the DB.

### Pipeline Script Inventory

**In `admin.py` (16 steps):**
- `import_aemo_gen_info.py` → AEMO generation registry (project status, capacity, DUIDs)
- `import_openelectricity.py` → dispatch performance data
- `import_nemweb_bids.py` → BESS bid profiles → `bess_daily_bids` → `bess-bidding.json`
- `export_json.py` → all frontend JSON

**NOT in `admin.py` — run manually:**
- `import_battery_scada.py` → `battery_daily_scada` → `battery-live-records.json`
- `import_bess_5min.py` → BESS 5-min dispatch peaks → BESS records leaderboard
- `import_dispatch_regionsum.py` → regional demand → Energy Transition Scoreboard

**Unused tables (have importers + data, NOT referenced in export_json.py):**
- `bess_band_capture` — imported by `import_bess_band_capture.py`
- `price_band_capture` — imported by `import_price_band_capture.py`
- These could feed Value Factor analysis but currently wasted. Adding export functions to `export_json.py` is a future task.

### Consolidated Projects

`pipeline/config/consolidated_projects.json` lists 19 slug pairs where AEMO stage variants are merged under parent slugs and suppressed from export. Do not delete or rename these slugs — they suppress duplicates from AEMO Gen Info.

### smart_refresh.py vs admin.py

- `smart_refresh.py --phase data` = OE imports + league_tables + monthly_performance + export_json (skips sources fresher than 14 days)
- `smart_refresh.py --phase intelligence` = re-exports intelligence JSON from existing DB (no API calls)
- `admin.py --all` = all 16 importers in sequence (brute force, ignores freshness)
- OE API has ~500 req/day limit on free plan — run OE steps first

---

## Data Staleness Audit (as at 9 May 2026)

| Source | Days Stale | Script | Output |
|--------|-----------|--------|--------|
| OpenElectricity Performance | ~53 | `import_openelectricity.py` | `performance-*.json` |
| AEMO Generation Information | ~23 | `import_aemo_gen_info.py` | projects DB table |
| NEMWEB Battery SCADA | ~24 | `import_battery_scada.py` | `battery-live-records.json` |
| NEMWEB BESS 5-min Peaks | ~39 | `import_bess_5min.py` | BESS leaderboard |
| NEMWEB Dispatch Region Sum | ~39 | `import_dispatch_regionsum.py` | Energy Transition Scoreboard |
| EPBC Referrals | ~59 | `import_epbc.py` | `epbc-referrals.json` |
| Coal Generation Monitor | ~23 | `import_coal.py` | coal monitor data |

---

## BESS Projects Requiring Status Review

After running AEMO Gen Info, verify these 7 projects whose COD dates have passed but may still show wrong status. The DB wins for status, so if AEMO has updated them to operating, they'll export correctly. Check overlays if status still looks wrong.

| Slug | Issue |
|------|-------|
| `collie-battery` | `cod_current: "2027"` in overlay — both stages operational July 2025. Fix overlay to `"2025-07"`. WA/WEM project, not NEM. |
| `brendale-bess` | Stage 1 operating June 2025, `cod_current: "2026-06"` is full project COD — check if correct |
| `liddell-bess` | Was in construction, should be commissioning |
| `koorangie-ess` | Was commissioning → verify now operating |
| `tarong-bess` | Was commissioning → verify now operating |
| `waratah-super-battery` | 850 MW / 1,680 MWh — largest NEM battery — verify operating |
| `western-downs-battery` | 540 MW — CS Energy / Amp Energy — verify operational stage |

**collie-battery fix**: in `data/projects/bess/collie-battery.json`, change `cod_current` from `"2027"` to `"2025-07"`. This is a WA (WEM) project, not NEM — no NEM SCADA data expected.

---

## The 9-Stage Execution Plan

Run on Travis's Mac (`~/aures-db/`). Do a `git pull` first.

### Stage 1: Dry Run Preview
```bash
python3 pipeline/smart_refresh.py --phase data --dry-run
```
Confirms what will be fetched before spending API quota.

### Stage 2: AEMO Generation Info (run first — no API quota cost)
```bash
python3 pipeline/importers/import_aemo_gen_info.py
```
Updates project status, capacity, DUID registrations. This is the source of truth for what's operating.
After: manually review the 7 BESS projects listed above.

### Stage 3: NEMWEB Operational Data (three scripts, run in order)
```bash
python3 pipeline/importers/import_battery_scada.py          # 30-day backfill
python3 pipeline/importers/import_bess_5min.py              # 30-day backfill
python3 pipeline/importers/import_dispatch_regionsum.py     # 30-day backfill
```
These are NOT in admin.py — must be run manually. Feed battery-live-records, BESS leaderboard, Energy Transition Scoreboard.

**Also run if data exists:**
```bash
python3 pipeline/importers/import_bess_band_capture.py
python3 pipeline/importers/import_price_band_capture.py
```
These populate unused tables. Check if the importers exist and have been run before — if yes, run them to keep data fresh for future Value Factor analysis.

### Stage 4: OpenElectricity Performance
```bash
python3 pipeline/importers/import_openelectricity.py --year 2026 --ytd
python3 pipeline/importers/import_openelectricity.py --year 2025 --annual
python3 pipeline/importers/import_openelectricity.py --year 2026 --monthly
```
YTD 2026, full 2025 annual, and monthly breakdown. ~30 API calls total. Run early in the day.

### Stage 5: EPBC Referrals
```bash
python3 pipeline/importers/import_epbc.py
```
59 days stale. Environmental referral pipeline data.

### Stage 6: Coal Generation Monitor
```bash
python3 pipeline/importers/import_coal.py
```

### Stage 7: NEMWEB BESS Bids (if stale)
```bash
python3 pipeline/importers/import_nemweb_bids.py
```
Bid profiles — check staleness first with `--dry-run` or inspect `data/sources`.

### Stage 8: Export JSON + Intelligence
```bash
python3 pipeline/exporters/export_json.py
python3 pipeline/smart_refresh.py --phase intelligence
```
Regenerate all frontend JSON. Run intelligence phase after to rebuild analytics.

### Stage 9: Data Quality Checks
After export, verify:
- `frontend/public/data/projects/bess/*.json` — spot check 3–5 large BESS projects for correct status
- `frontend/public/data/metadata/sources.json` — confirm last_run timestamps updated
- Check 19 consolidated slugs haven't reappeared as duplicates
- Confirm `battery-live-records.json` has records up to ~May 2026
- Confirm Energy Transition Scoreboard has recent regional demand data

---

## After the Data Run

### 1. Fix collie-battery overlay
```json
// data/projects/bess/collie-battery.json
"cod_current": "2025-07"  // was "2027"
```

### 2. Update update-log.json
File: `frontend/public/data/metadata/update-log.json`

The May 2026 entry (`completed: false`) needs to be filled in with actual results:
- Set `completed: true`
- Fill `new_operational` with any newly confirmed operating projects
- Fill `status_changes` with transitions confirmed during Stage 2
- Fill `nem_records` with any new NEM records identified
- Fill `new_projects` with any new projects added to the DB
- Update `data_quality_notes` with actual findings

### 3. Bump to v2.53.0 and deploy
```json
// frontend/package.json
"version": "2.53.0"

// frontend/public/data/metadata/version.json
"version": "2.53.0"
```
Commit, push to main, CI deploys automatically.

---

## Guides Rewrite (Post-Data-Run)

The guides in `frontend/src/data/guides.ts` (or wherever they live — check the file) have not been updated since the database launch and are out of date. After the data run:

1. **Rewrite all guide entries** to reflect current state of NEM (new large BESS, changed market dynamics, etc.)
2. **Add a "Data Update Process" guide** documenting the 9-stage plan above — this makes it self-referencing and reproducible
3. **Update the Architecture & Plan guide** to reflect changes made since launch
4. **Update any guides with March 2026 or earlier data cutoffs** — these will have stale stats/narratives
5. **Focus guides on what's changed**: large BESS entering service, record battery discharge events, FCAS market evolution, Value Factor cannibalisation trends

To find the guides file:
```bash
grep -r "guides" frontend/src --include="*.ts" -l
grep -r "GuideEntry\|guides:" frontend/src --include="*.ts" -l
```

---

## What Was Done in This Session (Before This Plan)

- ✅ Completed NEM Constraints Learning Module lessons 4–7 (full interactive content)
- ✅ Fixed version.json staleness — users were seeing downgrade prompt, not update prompt
- ✅ Resolved PR merge conflicts for lessons completion
- ✅ Created `update-log.json` data structure with May 2026 pending entry + April 2026 historical entry
- ✅ Built `UpdateLogSection` component in `DataSources.tsx` — shows per-update cards with sources refreshed, new operational, status changes, NEM records, data quality notes
- ✅ Deployed as v2.52.1

## What Is NOT Done

- ❌ The actual data run (runs on Travis's Mac, not this server)
- ❌ Add export functions to `export_json.py` for `bess_band_capture`/`price_band_capture` tables
- ❌ Guides rewrite
- ❌ collie-battery `cod_current` correction (do alongside data run)

---

## Key NEM Records Known at Time of Writing

These are in `update-log.json` and the UI already shows them:

| Metric | Value | Date |
|--------|-------|------|
| Max 5-min battery discharge (NEM) | 3,675 MW | 2026-01-25 |
| Max 5-min battery charge (NEM) | 2,906.2 MW | 2026-04-02 |
| Max daily battery discharge (NEM) | 16,001.1 MWh | 2026-04-13 |
| Max daily battery charge (NEM) | 14,497 MWh | 2026-04-13 |

These may have been broken again — check NEMWEB during Stage 3/4 of the data run.

---

## File Locations Quick Reference

| File | Purpose |
|------|---------|
| `pipeline/exporters/export_json.py` | All JSON export logic, overlay merge at line ~121 |
| `pipeline/admin.py` | 16-step pipeline runner |
| `pipeline/smart_refresh.py` | API-efficient refresh, --phase data/intelligence/all |
| `pipeline/config/consolidated_projects.json` | 19 slug pairs to suppress AEMO duplicates |
| `data/projects/bess/*.json` | BESS overlay files (hand-curated, don't bulk overwrite) |
| `data/projects/wind/*.json` | Wind overlay files |
| `data/projects/solar/*.json` | Solar overlay files |
| `frontend/public/data/metadata/update-log.json` | Data update log (fill in after each run) |
| `frontend/public/data/metadata/version.json` | Must match package.json version |
| `frontend/package.json` | Bump version here before deploying |
| `frontend/src/pages/DataSources.tsx` | Data Sources page incl. UpdateLogSection component |
| `frontend/src/hooks/useVersion.ts` | Update notification logic |
