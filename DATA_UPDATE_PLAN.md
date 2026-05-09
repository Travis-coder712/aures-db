# AURES Data Update Plan — May 2026

> Written by Claude Code after a comprehensive audit of the codebase, pipeline, and data state as at 9 May 2026.
> This document is the handoff reference for executing the May 2026 data run on Travis's Mac (`~/aures-db/`).
> **All execution steps are written as Claude Code prompts** — open `claude` in `~/aures-db/` and paste each prompt in sequence.

---

## How to Use This Document

1. On Travis's Mac, `cd ~/aures-db` and run `claude` to open Claude Code
2. Start a new session with the orientation prompt below
3. Work through stages 1–9 in order, pasting each prompt
4. Claude Code handles the commands, reads output, catches errors, and edits files
5. You review and approve at each stage before moving to the next

You don't need to type any terminal commands yourself. Claude Code does the running, checking, and fixing.

---

## Opening Prompt (start every new session with this)

```
Read DATA_UPDATE_PLAN.md at the repo root. This is the handoff document for the May 2026 AURES data run.

Key things to keep in mind throughout this session:
- The overlay system in export_json.py protects hand-curated data — NEVER bulk-overwrite data/projects/**/*.json files
- status is NOT an overlay override field — the DB always wins for project status
- Three pipeline scripts are NOT in admin.py and must be run manually: import_battery_scada.py, import_bess_5min.py, import_dispatch_regionsum.py
- The local DB on the dev server is empty — we are running on this Mac only

Confirm you've read and understood the plan, then wait for me to give you the first stage prompt.
```

---

## Critical Technical Notes (Claude Code Must Know These)

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

**NOT in `admin.py` — must be run explicitly:**
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

## BESS Projects Requiring Status Review After Stage 2

After AEMO Gen Info runs, verify these 7 projects. The DB wins for status, so AEMO data takes effect automatically. Check overlays only if status still looks wrong after export.

| Slug | Issue |
|------|-------|
| `collie-battery` | `cod_current: "2027"` in overlay — both stages operational July 2025. Fix overlay to `"2025-07"`. WA/WEM project, not NEM. |
| `brendale-bess` | Stage 1 operating June 2025, `cod_current: "2026-06"` is full project COD — check if correct |
| `liddell-bess` | Was in construction, should be commissioning or beyond |
| `koorangie-ess` | Was commissioning → verify now operating |
| `tarong-bess` | Was commissioning → verify now operating |
| `waratah-super-battery` | 850 MW / 1,680 MWh — largest NEM battery — verify operating |
| `western-downs-battery` | 540 MW — CS Energy / Amp Energy — verify operational stage |

---

## The 9-Stage Execution Plan (Claude Code Prompts)

### Stage 1 — Orientation & Dry Run

```
First, pull the latest code: git pull origin main (or the current branch).

Then run a dry run to show what the smart refresh would fetch without spending any API quota:
  python3 pipeline/smart_refresh.py --phase data --dry-run

Read the output and tell me:
1. Which sources it would fetch and approximately how many API calls each will use
2. Which sources it considers fresh enough to skip
3. Any warnings or configuration issues

Do not run any actual imports yet — this is a preview only.
```

---

### Stage 2 — AEMO Generation Info

```
Run the AEMO Generation Info importer. This has no API quota cost and updates project status, capacity, and DUID registrations — it's the source of truth for what's operating.

  python3 pipeline/importers/import_aemo_gen_info.py

After it completes, query the database to check the current status of these 7 BESS projects that had past COD dates and may have transitioned:
  collie-battery, brendale-bess, liddell-bess, koorangie-ess, tarong-bess, waratah-super-battery, western-downs-battery

For each one, tell me:
- What status the DB now shows
- What the overlay file (data/projects/bess/{slug}.json) shows for status and cod_current
- Whether there's a mismatch that needs fixing

Important: collie-battery is a WA/WEM project — no NEM SCADA data is expected for it. Both its stages were operational July 2025 so cod_current should be "2025-07" not "2027".

After the review, fix any overlay mismatches you find. Do NOT change status fields in overlays — only fix cod_current, capacity, or factual data errors. Status comes from the DB.
```

---

### Stage 3 — NEMWEB Operational Data

```
Run the three NEMWEB operational data importers that are NOT in admin.py. These feed battery live records, the BESS 5-min leaderboard, and the Energy Transition Scoreboard. Run them in order:

  python3 pipeline/importers/import_battery_scada.py
  python3 pipeline/importers/import_bess_5min.py
  python3 pipeline/importers/import_dispatch_regionsum.py

For each one, report: how many records were imported, what date range they cover, and any errors.

Then check whether these two additional importers exist and have previously been run:
  pipeline/importers/import_bess_band_capture.py
  pipeline/importers/import_price_band_capture.py

If they exist, check when they were last run and whether the tables bess_band_capture and price_band_capture have data. If yes, run them too. These feed future Value Factor analysis — the tables exist but aren't yet exported to JSON.

Report the results of all imports before moving on.
```

---

### Stage 4 — OpenElectricity Performance

```
Run the OpenElectricity performance importer for three data sets. The OE API has ~500 requests/day on the free plan so run these in one go — do not split across sessions.

  python3 pipeline/importers/import_openelectricity.py --year 2026 --ytd
  python3 pipeline/importers/import_openelectricity.py --year 2025 --annual
  python3 pipeline/importers/import_openelectricity.py --year 2026 --monthly

After all three complete, report:
- Total API calls used across all three runs
- Record counts imported for each
- Date range covered
- Any facilities that failed or returned incomplete data

If the API returns a rate limit error, stop and tell me — do not retry automatically as we may need to wait until tomorrow.
```

---

### Stage 5 — EPBC Referrals & Coal Monitor

```
Run the two remaining importers — EPBC referrals (59 days stale) and the coal generation monitor:

  python3 pipeline/importers/import_epbc.py
  python3 pipeline/importers/import_coal.py

Report record counts and any errors for each.
```

---

### Stage 6 — NEMWEB BESS Bids

```
Check how stale the BESS bid data is by looking at the last_run timestamp in the data sources metadata or by querying the bess_daily_bids table for the most recent date.

If the data is more than 14 days old, run:
  python3 pipeline/importers/import_nemweb_bids.py

Report what date range is now covered and how many bid records are in the database.
```

---

### Stage 7 — Export JSON + Intelligence

```
Now regenerate all frontend JSON from the updated database, then rebuild the intelligence layer:

  python3 pipeline/exporters/export_json.py
  python3 pipeline/smart_refresh.py --phase intelligence

After both complete:
1. Check frontend/public/data/metadata/sources.json — confirm last_run timestamps reflect today's imports
2. Spot-check 5 large BESS projects in frontend/public/data/projects/bess/ — verify status, capacity, and that timeline_events from overlays are still present (overlay data must survive the export)
3. Check that battery-live-records.json covers dates up to approximately today
4. Check that the Energy Transition Scoreboard data (dispatch_regionsum output) has recent regional demand data

Report any discrepancies. If overlay data was lost from any project, stop — do not proceed until we understand why.
```

---

### Stage 8 — Data Quality & NEM Records Check

```
Perform the following data quality checks and report findings:

1. Consolidated projects: query the database or check the export to confirm the 19 slugs in pipeline/config/consolidated_projects.json have NOT reappeared as duplicates in the project listing

2. BESS status summary: count how many BESS projects are now in each status (operating, commissioning, construction, approved, proposed) and compare to what we'd expect given the 7 projects reviewed in Stage 2

3. NEM records check: query the battery_daily_scada and bess_5min tables to find the all-time maximums for:
   - Max 5-min battery discharge (NEM-wide)
   - Max 5-min battery charge (NEM-wide)
   - Max daily battery discharge (NEM-wide)
   - Max daily battery charge (NEM-wide)
   
   The previous records (as at April 2026) were:
   - 3,675 MW discharge on 2026-01-25
   - 2,906.2 MW charge on 2026-04-02
   - 16,001.1 MWh daily discharge on 2026-04-13
   - 14,497 MWh daily charge on 2026-04-13
   
   Report whether any of these have been broken since April 2026, and if so, the new record value and date.

4. Report anything unexpected you found during the export — missing data, schema changes, import errors that affected output.
```

---

### Stage 9 — Update Log, Version Bump & Deploy

```
We're now ready to record the update and deploy. Do the following steps in order:

1. Update frontend/public/data/metadata/update-log.json:
   - Find the May 2026 entry (version "2.53.0", completed: false)
   - Set completed: true
   - Fill new_operational with any BESS/wind/solar projects confirmed as newly operating in this run
   - Fill status_changes with the transitions found in Stage 2 (e.g. commissioning → operating)
   - Fill nem_records with any new NEM records found in Stage 8 (keep existing ones if not broken)
   - Update data_quality_notes with a 2-3 sentence summary of findings from this run
   
2. Bump the version to 2.53.0 in both:
   - frontend/package.json  ("version": "2.53.0")
   - frontend/public/data/metadata/version.json  ("version": "2.53.0")

3. Commit all changed files with a clear message summarising what was updated (data sources, new operational projects, any NEM records). Push to main.

4. Confirm the git push succeeded and tell me the commit hash. The CI/CD pipeline (GitHub Actions) will deploy automatically.

Do not push until you've confirmed the update-log.json looks correct — read it back to me before committing.
```

---

## Guides Rewrite (Separate Session After Data Run)

The guides have not been updated since the database launched and contain stale narratives and statistics. Run this as a separate Claude Code session after the data run is confirmed deployed.

### Guides Rewrite Prompt

```
Read DATA_UPDATE_PLAN.md first for context on what changed in the May 2026 data run.

We need to do a complete rewrite of the AURES guides. First, find the guides data file:
  grep -r "GuideEntry\|guides:" frontend/src --include="*.ts" -l

Read the file and list all existing guide entries with their titles and a one-line summary of what each covers.

Then work through each guide and:
1. Identify any statistics, project counts, or NEM metrics that are now out of date
2. Identify any references to "upcoming" projects that are now operating
3. Flag any sections that don't reflect the current state of the NEM (e.g. battery storage has scaled enormously, Value Factor cannibalisation is now a major issue)

Give me the full list of changes needed before making any edits. We'll review and approve before you start rewriting.

Also: add a new guide entry titled "Data Update Process" that documents the 9-stage monthly data refresh pipeline (the process described in DATA_UPDATE_PLAN.md) — this makes the process self-documenting for future reference.
```

---

## What Was Completed Before This Plan

- ✅ NEM Constraints Learning Module lessons 4–7 (full interactive content)
- ✅ Fixed version.json staleness causing broken update notifications
- ✅ Resolved PR merge conflicts
- ✅ Created `update-log.json` data structure with May 2026 pending + April 2026 historical entries
- ✅ Built `UpdateLogSection` component in `DataSources.tsx`
- ✅ Deployed as v2.52.1

## What Is NOT Done

- ❌ The actual data run (stages 1–9 above)
- ❌ collie-battery `cod_current` correction (handled in Stage 2 prompt)
- ❌ Add export functions to `export_json.py` for `bess_band_capture`/`price_band_capture` tables
- ❌ Guides rewrite

---

## Key NEM Records Known at Time of Writing

These are in `update-log.json` and displayed in the UI. Verify in Stage 8 whether they've been broken.

| Metric | Value | Date |
|--------|-------|------|
| Max 5-min battery discharge (NEM) | 3,675 MW | 2026-01-25 |
| Max 5-min battery charge (NEM) | 2,906.2 MW | 2026-04-02 |
| Max daily battery discharge (NEM) | 16,001.1 MWh | 2026-04-13 |
| Max daily battery charge (NEM) | 14,497 MWh | 2026-04-13 |

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
| `frontend/public/data/metadata/update-log.json` | Data update log (fill in Stage 9) |
| `frontend/public/data/metadata/version.json` | Must match package.json version |
| `frontend/package.json` | Bump version here in Stage 9 |
| `frontend/src/pages/DataSources.tsx` | Data Sources page incl. UpdateLogSection component |
| `frontend/src/hooks/useVersion.ts` | Update notification logic |
