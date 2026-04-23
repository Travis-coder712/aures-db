# AURES — Next Session Handoff

**Last refreshed:** 2026-04-23, end of the v2.35.0 session
**Latest shipped version:** v2.35.0
**Purpose:** Single-place brief for the next session. Cold-readable — no context required beyond this file and `docs/INTELLIGENCE_LAYER_PLAN.md`.

---

## 🟢 Current state snapshot (v2.35.0)

### What's live on the deployed site
- **35 releases shipped** v2.15.1 → v2.35.0, with the recent ones covering:
  - **v2.32.0** — **BESS Bidding Trading Platform deep-dives** (OEM match, lock-in, convergence, grid implications per platform + grid-scale monoculture callout)
  - **v2.33.0** — **BESS Records Leaderboard** (`/intelligence/bess-records`) — 30 batteries, NEM + state scope, discharge/charge tabs, fleet peak records
  - **v2.34.0** — **Per-DUID 5-min BESS Dispatch Peaks** — `import_bess_5min.py` backfills DISPATCHLOAD for 56 DUIDs (Aug 2024→Mar 2026); Peak 5-min ⚡/🔋 columns now live in leaderboard table
  - **v2.35.0** — **BESS Records: multi-window periods, staircase timeline, revenue lens + battery coverage fix** (see below)
- All features on `https://travis-coder712.github.io/aures-db/`
- Plan doc: `docs/INTELLIGENCE_LAYER_PLAN.md` — authoritative release log

### v2.35.0 — What shipped this session

**Three new features on BESS Records page (`/intelligence/bess-records`):**

1. **Multi-window period selector** — 5-min / 30-min / 1-hr / Daily / Quarterly tabs above leaderboard. Each period shows a different peak metric per battery, sorted accordingly. Revenue hints (~$X) shown inline for daily discharge period.

2. **Records Timeline** — staircase AreaChart (Recharts `stepAfter`) showing when each all-time record was broken, at every scope level (NEM, NSW, VIC, QLD, SA, TAS) and for daily discharge / daily charge / 5-min peak. Last 5 record events annotated below the chart.

3. **Revenue Lens** — card showing estimated revenue on the top battery's peak discharge day: avg RRP, daily peak RRP, P90 RRP, and estimated revenue = MWh × P90 spot price. Methodology caveat included.

**Data quality fix — missing batteries:**
- Root cause: `import_generation_daily.py` `load_target_duids()` only included 'In Service' and 'In Commissioning' BESS, missing all 'Committed' status batteries that are actively dispatching.
- Fix: expanded WHERE clause to include `'Committed', 'Committed*'` for Battery Storage. Solar/wind unchanged.
- Affected DUIDs now captured: **WTAHB1** (Waratah Super Battery, 844 MW), **TARBESS1** (Tarong, 300 MW), **LDBESS1** (Liddell, 500 MW), **ORABESS1** (Orana), **SNB01/SNB02** (Supernode), **SWANBBF1** (Swanbank), **BRNDBES1** (Brendale)
- `import_bess_5min.py` BESS_DUIDS set corrected — 'WTAHB1' was previously listed as wrong 'WTAHBESS'

**New pipeline:** `pipeline/importers/import_dispatchprice.py`
- Downloads AEMO NEMWEB MMSDM DISPATCHPRICE archives (separate ZIPs from DISPATCHLOAD)
- Creates `dispatch_price_daily` table: `(date, region, avg_rrp, peak_rrp, p90_rrp, negative_count, intervals)` with UNIQUE(date, region)
- CLI: `--month YYYY-MM` or `--months START END`
- Currently populated: Aug 2024 → Jun 2025 (1,525 rows, 5 regions). MMSDM archive pub lag ~45 days.

**Database state after this session:**
- `bess_5min_peaks`: 16,572 rows, all with 30-min/1-hr rolling window peaks
  - Best 30-min discharge: **424.96 MWh** (WTAHB1, Waratah, 2025-10-13)
  - Best 1-hr discharge: **847.31 MWh** (WTAHB1, Waratah, 2025-10-13)
- `dispatch_price_daily`: 1,525 rows (Aug 2024 – Jun 2025, 5 NEM regions)
- `generation_daily`: re-backfilled with 'Committed' BESS — Waratah 2,100 MWh peak daily, 364 days active; Tarong 325 MWh peak, 155 days active
- Exported JSON: 41 batteries (up from 30), data_through 2026-04-01

### Pipeline / data state
- **Coal dispatch** (`dispatch_availability`): **~24M rows** from Jan 2021 → Apr 2026. MMSDM-backfilled.
- **Solar/wind/BESS daily** (`generation_daily`): **~280k+ rows**, re-backfilled to include Committed BESS.
- **BESS 5-min peaks** (`bess_5min_peaks`): 16,572 rows, Aug 2024 → Mar 2026, all with 30-min/1-hr rolling peaks.
- **BESS dispatch prices** (`dispatch_price_daily`): 1,525 rows, Aug 2024 → Jun 2025. (MMSDM lag means ~Jul 2025 onward not yet available)
- **Demand daily** (`demand_daily`): 5 state regions + NEM concurrent peak.
- **Battery SCADA** (`battery_daily_scada`): 450 daily rollups from OpenElectricity API.

---

## 📋 What remains — prioritised backlog

### 🔴 Data freshness — check at the start of every session
| Source | Cadence | Current |
|---|---|---|
| `aemo_generation_info` | monthly | 2026-04-17 |
| `news_rss` | daily | 2026-04-23 |
| `dispatch_price_daily` | monthly | Aug 2024 – Jun 2025 (MMSDM lag) |
| `market_prices` | monthly | **never** — no automated importer |
| `aemo_isp_rez` | annual | **never** — no automated importer |

**Backfill dispatchprice when newer months available (~mid-May for Jul 2025+):**
```bash
python3 pipeline/importers/import_dispatchprice.py --months 2025-07 2026-03
python3 pipeline/exporters/export_json.py
```

### 🟠 Data enrichment gaps (coverage)
- **BESS chemistry (EIS)**: 34 / 420 projects (8%). Target ≥ 50% via systematic EIS PDF parsing.
- **Ownership history**: 10 / 1,063 projects. Web research pass needed.
- **FID events**: 24 projects. Parse ASX + investor releases.
- **construction_start events**: 121 / 1,063 (11%). AEMO WDR + news.
- **`development_score` column**: empty. Consolidation pipeline from component signals.
- **EIS technical specs**: 68 / 1,063. Med-effort enrichment pass.

### 🟡 Feature backlog — from `memory/project_aures_post_plan_backlog.md`
1. **User-onboarding guide rewrites** — 7 non-methodology guides (About / Using / Navigating / Search Tips / Data Quality / Strategic Roadmap / Project Plan) haven't been refreshed for v2.16-v2.35. Low effort, high visibility.
2. **Compare-developers view** — side-by-side 2-4 developers on `/developers`. Deferred from v2.20.0.
3. **BatteryWatch → CapacityWatch merge** — ~1,080 lines of content to preserve. Nav simplification.
4. **BESS bidding per-project summaries** — pre-compute for faster page load.
5. **Dev-stage PPAs / LGC-only offtakes** — not captured in web research pass yet.
6. **F4 Phase 2 pipeline trigger endpoint** — real "Update Now" button. Requires local backend API.

### 🟢 BESS Records — potential follow-on improvements
- **5-min revenue** — join at exact dispatch interval (needs per-5min price, not just daily P90). Would require a larger `dispatch_price_5min` table.
- **Quarterly period timeline** — records_timeline currently covers daily and 5-min only; quarterly staircase would add useful long-view.
- **Battery utilisation rate** — gen_mwh / (capacity_mwh × days_active) — ranking batteries by efficiency, not just absolute records.
- **Seasonal records** — summer peak vs winter peak splits per fuel tech.

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

**Release pattern (proven across 35 releases):**
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
5. **MMSDM date format is `2025/12/31`** (slashes), not `2025-12-31`. SQLite queries and Python parsers must handle both.
6. **Python 3.9 on this machine** — `str | None` union syntax requires 3.10+. Use bare annotations or `Optional[str]` from typing in pipeline scripts.
7. **OpenElectricity free tier caps at 367 days** — for longer history use NEMWEB MMSDM.
8. **Don't commit SQLite DB** (`database/aures.db`) — it's gitignored. Data ships as JSON exports.
9. **Don't delete `data/projects/<tech>/<id>.json`** — hand-enriched overlays merged by exporter (Waratah especially).
10. **MMSDM archive publication lag** ≈ 45 days. 2026-04 archive likely available mid-May.
11. **`import_generation_daily.py` status filter** — BESS uses `'Committed', 'Committed*'` in addition to In Service/Commissioning. Do NOT revert this — those batteries are actively dispatching.

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
| `pipeline/config/coal_stations.json` | 15 NEM coal stations + 44 DUIDs (hand-curated) |
| `pipeline/importers/import_dispatchload.py` | NEMWEB coal + BESS 5-min importer (dual-format URL) |
| `pipeline/importers/import_bess_5min.py` | BESS 5-min peaks with 30-min/1-hr rolling windows |
| `pipeline/importers/import_generation_daily.py` | Solar/wind/BESS daily from cached MMSDM (incl. Committed BESS) |
| `pipeline/importers/import_dispatchprice.py` | AEMO DISPATCHPRICE daily regional spot stats (NEW v2.35.0) |
| `pipeline/importers/import_dispatch_regionsum.py` | Demand daily + NEM concurrent peak |
| `pipeline/importers/import_battery_scada.py` | OE battery 5-min importer |
| `pipeline/exporters/export_json.py` | All JSON exporters |
| `pipeline/scripts/backfill_coal_history.sh` | 5-year MMSDM backfill loop |
| `frontend/src/lib/dataSources.ts` | Source registry + PAGE_SOURCES mapping |
| `frontend/src/pages/intelligence/BessRecords.tsx` | BESS Records — periods, timeline, revenue lens |
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
   - Backfill `dispatch_price_daily` when MMSDM Jul 2025+ archives publish (~mid-May)
   - Refresh stale sources (market_prices / aemo_isp_rez — no importer yet)
   - Enrich BESS chemistry (≥ 10 more EIS PDFs would move coverage meaningfully)
   - Start user-onboarding guide rewrites (high visibility, low technical risk)

**Quickest path to a quick win:**
```bash
# Verify current data state
sqlite3 database/aures.db "SELECT COUNT(*) FROM dispatch_availability; SELECT COUNT(*) FROM generation_daily; SELECT COUNT(*) FROM bess_5min_peaks; SELECT COUNT(*) FROM dispatch_price_daily"

# Re-run all exporters (sanity check)
python3 pipeline/exporters/export_json.py

# Local build verify
cd frontend && npx tsc -b && npm run build
```

Good luck.
