# AURES — Next Session Handoff

**Last refreshed:** 2026-04-23, end of the v2.34.0 session
**Latest shipped version:** v2.34.0
**Purpose:** Single-place brief for the next session. Cold-readable — no context required beyond this file and `docs/INTELLIGENCE_LAYER_PLAN.md`.

---

## 🟢 Current state snapshot (v2.34.0)

### What's live on the deployed site
- **34 releases shipped** v2.15.1 → v2.34.0, with the recent ones covering:
  - **v2.30.0** — **Energy Transition Scoreboard** (coal vs wind/solar/BESS + demand overlay + records)
  - **v2.31.0 / v2.31.1** — **CIS Wind Pipeline filter** + data/peak-calc patch
  - **v2.32.0** — **BESS Bidding Trading Platform deep-dives** (OEM match, lock-in, convergence, grid implications per platform + grid-scale monoculture callout)
  - **v2.33.0** — **BESS Records Leaderboard** (`/intelligence/bess-records`) — 30 batteries, NEM + state scope, discharge/charge tabs, fleet peak records
  - **v2.34.0** — **Per-DUID 5-min BESS Dispatch Peaks** — `import_bess_5min.py` backfills DISPATCHLOAD for 56 DUIDs (Aug 2024→Mar 2026); Peak 5-min ⚡/🔋 columns now live in leaderboard table
- All features on `https://travis-coder712.github.io/aures-db/`
- Plan doc: `docs/INTELLIGENCE_LAYER_PLAN.md` — authoritative release log

### Pipeline / data state
- **Coal dispatch** (`dispatch_availability`): **~24M rows** from Jan 2021 → Apr 2026. MMSDM-backfilled.
- **Solar/wind/BESS daily** (`generation_daily`): **~280k rows**, 63 months (Jan 2021 → Mar 2026). Re-parses cached MMSDM zips.
- **Demand daily** (`demand_daily`): 5 state regions + NEM concurrent peak = **1,917 × 6 = 11,502 rows** (2021-01 → 2026-03).
- **Battery SCADA** (`battery_daily_scada`): 450 daily rollups from OpenElectricity API.
- Live analytics JSONs: `coal-ytd-comparison.json`, `energy-transition.json`, `coal-outage-dispatch.json`, `battery-live-records.json`, `scheme-tracker.json`, plus all Tier 1-3 intelligence exports.

### Key NEM headline (YTD, Jan 1 → 17 Apr, apples-to-apples)
- Coal: 36.7 TWh (2021) → 33.1 TWh (2026) = **-10.0%**
- Wind: 5.2 → 8.1 TWh (2021→2025) = **+56%**
- Solar: 2.6 → 5.8 TWh (2021→2025) = **+126%**
- BESS: ~0 → 205 GWh YTD discharge in 2025
- Demand: essentially flat at ~53 TWh YTD
- Concurrent NEM peak: **33,674 MW** (16 Dec 2024)

---

## 📋 What remains — prioritised backlog

### 🔴 Data freshness — check at the start of every session
| Source | Cadence | Current |
|---|---|---|
| `aemo_generation_info` | monthly | 2026-04-17 (refreshed this session) |
| `news_rss` | daily | 2026-04-17 (refreshed this session) |
| `market_prices` | monthly | **never** — no automated importer |
| `aemo_isp_rez` | annual | **never** — no automated importer |

### 🟠 Data enrichment gaps (coverage)
- **BESS chemistry (EIS)**: 34 / 420 projects (8%). Target ≥ 50% via systematic EIS PDF parsing.
- **Ownership history**: 10 / 1,063 projects. Web research pass needed.
- **FID events**: 24 projects. Parse ASX + investor releases.
- **construction_start events**: 121 / 1,063 (11%). AEMO WDR + news.
- **`development_score` column**: empty. Consolidation pipeline from component signals.
- **EIS technical specs**: 68 / 1,063. Med-effort enrichment pass.

### 🟡 Feature backlog — from `memory/project_aures_post_plan_backlog.md`
1. **User-onboarding guide rewrites** — 7 non-methodology guides (About / Using / Navigating / Search Tips / Data Quality / Strategic Roadmap / Project Plan) haven't been refreshed for v2.16-v2.31. Low effort, high visibility.
2. **Compare-developers view** — side-by-side 2-4 developers on `/developers`. Deferred from v2.20.0.
3. **BatteryWatch → CapacityWatch merge** — ~1,080 lines of content to preserve. Nav simplification.
4. **BESS bidding per-project summaries** — pre-compute for faster page load.
5. **Dev-stage PPAs / LGC-only offtakes** — not captured in web research pass yet.
6. **F4 Phase 2 pipeline trigger endpoint** — real "Update Now" button. Requires local backend API.

### 🟢 Polish items noticed this session
- **Seasonal records** on scoreboard — currently all-time only. Splitting into "summer peak" vs "winter peak" per fuel tech would be more useful.
- **Developer grade matching** uses lowercase name equality — variants like "ACEN Australia" vs "ACEN Renewables" won't match. Could use fuzzy match or canonical developer IDs.
- **Tab-row scrollbar fix** was applied to EnergyMix. Check BessPortfolio and other tabbed pages for the same issue.
- **Battery scada importer** (`import_battery_scada.py`) hasn't been checked for MMSDM URL format — may hit the same bug if used for historical backfill.

---

## 🏗️ Architecture patterns — preserve these

**Foundation components (v2.16-v2.18):**
- `<ChartFrame>` — wraps Recharts with enforced height + visibility re-measure
- `<DataTable>` — sortable, row numbers, totals, CSV export, mobile column hiding
- `<DrillPanel>` — slide-in side panel for click-through drill
- `<DataProvenance>` — source chip row with freshness + copy-refresh-command

**Pipeline pattern (unchanged since v2.16):**
- Python pipeline in `pipeline/` — importers populate SQLite, exporters emit static JSON
- Every new data source: add to `SOURCE_REGISTRY` in `frontend/src/lib/dataSources.ts` + `PAGE_SOURCES` mapping
- Aggregate-at-import-time for high-volume DUID data (see `generation_daily`) — keeps tables small
- Always dedupe MMSDM CSV revisions by `(SETTLEMENTDATE, DUID)` (see v2.30.0 fix — revision rows inflate totals by 2-6× on intervention days)
- **Graceful pending-state UI**: always render correctly even when importer hasn't been run

**Release pattern (proven across 31 releases):**
- Logical commits: pipeline + frontend + guide + version-bump-release-commit
- `frontend/package.json` version bump
- Update `docs/INTELLIGENCE_LAYER_PLAN.md` release log
- `gh release create vX.Y.Z` with detailed notes
- Monitor CI (`tsc -b && vite build`) — stricter than local `tsc --noEmit`
- Always ensure Waratah JSON restored after export (covered by overlay merge since v2.17.1)

---

## 🧰 Technical gotchas

1. **CI is stricter than `tsc --noEmit`** — always run `npm run build` locally before push.
2. **Icons must be defined BEFORE const arrays** that reference them (Vite HMR issue) — relevant in older files.
3. **MMSDM filename format changed Aug 2024** — importer tries new `PUBLIC_ARCHIVE#...#FILE01#...` then legacy `PUBLIC_DVD_...`.
4. **MMSDM revisions inflate MWh** — use dedupe by `(SETTLEMENTDATE, DUID)` pattern from `import_generation_daily.py`.
5. **OpenElectricity free tier caps at 367 days** — for longer history use NEMWEB MMSDM.
6. **Don't commit SQLite DB** (`database/aures.db`) — it's gitignored. Data ships as JSON exports.
7. **Don't delete `data/projects/<tech>/<id>.json`** — hand-enriched overlays merged by exporter (Waratah especially).
8. **MMSDM archive publication lag** ≈ 45 days. 2026-04 archive likely available mid-May.

---

## 🔑 Environment setup

- OpenElectricity API key in `~/.zshrc`: `OPENELECTRICITY_API_KEY=oe_4zNSDDp4bBBdm4SJ4MYu9t` (Community / free plan).
- NEMWEB importers need no auth — just internet.
- Cached MMSDM zips live in `data/nemweb_cache/` (~3 GB, gitignored).

---

## 📦 Key file locations

| File | Purpose |
|---|---|
| `docs/INTELLIGENCE_LAYER_PLAN.md` | Release log + authoritative plan |
| `docs/NEXT_SESSION_HANDOFF.md` | This file |
| `docs/SESSION_2026-04-17_SUMMARY.md` | Review checklist for today's 4 releases |
| `pipeline/config/coal_stations.json` | 15 NEM coal stations + 44 DUIDs (hand-curated) |
| `pipeline/importers/import_dispatchload.py` | NEMWEB coal 5-min importer (dual-format URL) |
| `pipeline/importers/import_generation_daily.py` | Solar/wind/BESS daily from cached MMSDM |
| `pipeline/importers/import_dispatch_regionsum.py` | Demand daily + NEM concurrent peak |
| `pipeline/importers/import_battery_scada.py` | OE battery 5-min importer |
| `pipeline/exporters/export_json.py` | All JSON exporters |
| `pipeline/scripts/backfill_coal_history.sh` | 5-year MMSDM backfill loop |
| `frontend/src/lib/dataSources.ts` | Source registry + PAGE_SOURCES mapping |
| `frontend/src/components/intelligence/CoalWatch.tsx` | Coal Watch with YTD Comparison tab |
| `frontend/src/components/intelligence/EnergyTransition.tsx` | Transition Scoreboard |
| `frontend/src/pages/intelligence/SchemeTracker.tsx` | Scheme Tracker with CIS Wind filter |
| `frontend/src/data/guides.ts` | All guides with added/updated date fields |
| `memory/MEMORY.md` | Memory index |

---

## ▶️ How to pick up next session

1. **Read `docs/INTELLIGENCE_LAYER_PLAN.md`** for the release log
2. **Read THIS file** for current state + backlog
3. Pick from the prioritised backlog above based on energy. Quick wins ready to pluck:
   - Refresh any stale sources (especially market_prices / aemo_isp_rez — no importer yet)
   - Enrich BESS chemistry (≥ 10 more EIS PDFs would move coverage meaningfully)
   - Start user-onboarding guide rewrites (high visibility, low technical risk)

**Quickest path to a quick win:**
```bash
# Verify current data state
sqlite3 database/aures.db "SELECT COUNT(*) FROM dispatch_availability; SELECT COUNT(*) FROM generation_daily; SELECT COUNT(*) FROM demand_daily"

# Re-run all exporters (sanity check)
python3 pipeline/exporters/export_json.py

# Local build verify
cd frontend && npx tsc -b && npm run build
```

Good luck.
