# AURES — Next Session Handoff

**Last refreshed:** 2026-05-26, end of v3.13.0 session
**Latest shipped version:** v3.13.0
**Purpose:** Single-place brief for the next session. Cold-readable — pair with `docs/SESSION_OPENER.md` and `docs/INTELLIGENCE_LAYER_PLAN.md`.

---

## Current state snapshot (v3.13.0)

### v3.13.0 — REZ Pipeline intelligence surface (just shipped, 2026-05-26)

Two new UI surfaces over the IASR + EnergyCo data layers that landed in v3.12.0:

1. **`/intelligence/transmission` → REZ Pipeline tab** (5th tab) — Hero stats (committed/anticipated/access-rights MW), top-15 REZ stacked bar chart (Committed + Anticipated + Access Rights), NSW access-scheme utilisation panel with Allocated÷Pipeline ratio readout (CWO 7,151 MW + South West 3,560 MW), per-REZ DataTable with click-to-expand drill-down, unmatched-IASR callout (29 projects without REZ assignment).
2. **`/rez/:id` per-REZ pages** — New "Pipeline & Access Rights" section with AEMO 2025 IASR Committed/Anticipated MW breakdown + REZ ID + IASR source link, list of IASR projects in zone not yet matched to an AURES record (data quality signal), full EnergyCo access rights detail for NSW REZs.

New aggregation exporter `pipeline/exporters/export_rez_pipeline.py` joins `projects` + `aemo_iasr_projects` + `energyco_rez_access` and normalises a noisy set of REZ names via `REZ_CANONICAL` (handles "Central-West Orana" / "Central -West Orana" / "nsw-central-west-orana" / "Issac" typo / "Far North QLD" merge cases). Canonical IDs match the `REZ_ZONES.id` `<state>-<rez-name>` convention so `/rez/:id` links resolve naturally. Output: 21 REZs · 11.5 GW IASR Committed · 8.2 GW IASR Anticipated · 10.7 GW EnergyCo access rights.

### What landed since the last handoff (v3.09.0 → v3.13.0, 11 releases in 4 days)

The v3.09 thread = **NSW Wind & CIS T7 deep dive** (5 releases). CIS Tender 7 results landed 2026-05-23 with 19 projects / 7.83 GW — NSW filled its quota with 9 winners and is **excluded from CIS T9**, leaving the Q2 2026 NSW Roadmap LTESA Generation round (2.5 GW, hybrid-favoured, ≤ 31 Dec 2029 COD acceleration bonus) as NSW Wind's last federal/state path.

- **v3.09.0** — 9th tab "NSW Wind" on Scheme Tracker with 8 sections (T7 snapshot · 12-project cohort table · build timeline Gantt with Eraring shutdown line · "yet-to-win" candidate table · upcoming LTESA briefing · 3-band probability scoring · LTESA-vs-CISA mechanism comparison · shareable copy/PDF commentary). New `LTESA_R8_CANDIDATES` + `NSW_WIND_COHORT` arrays in `scheme-rounds.ts`. New "Scheme Contracts" section on `ProjectDetail.tsx`.
- **v3.09.1** — Restored White Rock narrative (88 lines of v2.84/v2.85 curated content silently stripped by v3.09.0 exporter run).
- **v3.09.2** — NSW Wind tab UX fixes (Recharts vertical BarChart 0×0 measurement bug → replaced with div-based Gantt using CSS percentages; project selection chips + 4 preset buttons).
- **v3.09.3** — NSW Wind Build Timeline 3-mode anchor toggle (Scheme Award → COD / FID → COD / COD delivery wave).
- **v3.09.4** — Connection column on NSW Wind cohort table with 8-tier `ConnectionStatus` enum + `connection_notes`. Spawned the v3.11.0 follow-up to backfill `projects.connection_status` from AEMO Gen Info for all 1,064 projects.

The v3.10 thread = **Mansfield Regional Pipeline + CIS T7 final form** (7 releases):

- **v3.10.0** — Mansfield Regional Pipeline page at `/intelligence/mansfield-pipeline` (proof of concept for NEM-wide map). 100km haversine filter, 7-tier PipelineTier, CartoDB Dark Leaflet map, hero stats, hand-curated coords for 9 dev-stage projects.
- **v3.10.1** — Data refresh: news 255 → 340 articles, AEMO Gen Info 9,275 → 10,596 DUIDs, OE perf Jan–Apr 2026, battery SCADA through 2026-05-24.
- **v3.10.2** — CIS T7 full 19-winner refresh. 4 new projects added (Gundary Solar Hybrid, Gunning Solar, Wattle Creek, Banana Range, Moranbah). Round total: 7.83 GW · 7.89 GWh storage. NSW count revised to 9 (Wattle Creek added late). New "All 19 Winners" analysis section.
- **v3.10.3** — Scheme-contract coverage sweep (73 overlay files updated + 2 new overlays). NSW quota quote callout. LTESA R8 deep dive section.
- **v3.10.4** — ASL merit-criteria weightings table added to Hybrid LTESA callout. Corrected 49% (PV Tech) → 40% (Tender 1 brief).
- **v3.10.5** — Corrected the T1 figure (40%) to the current T6 precedent: MC5 = 45%. Re-sourced from ASL's NSW Roadmap T6 market briefing.
- **v3.10.6** — ICA Partners reclassified from "construction conglomerate" to "Investment partnership". Numbered Yet-to-Win table with estimated COD column + Hybrid LTESA bonus highlighting (≤ 31 Dec 2029 green · 2030 amber · 2031+ red).

The v3.11–13 thread = **Connection + REZ/TNSP layer** (3 releases, closes 2 spawn-task chips):

- **v3.11.0** — `projects.connection_status` backfill across all 1,064 projects from AEMO Gen Info. New `CONNECTION_STATUS_MAP` (In Service → operating · In Commissioning → commissioning · Committed → committed · Anticipated → anticipated · Publicly Announced → proposed). `COALESCE(NULLIF(...))` protection on every UPDATE/INSERT. New `ConnectionStatusRow` chip on `ProjectDetail`. Coverage: 1,051 / 1,064.
- **v3.12.0** — TNSP register layer Phase 1: EnergyCo NSW REZ Access Rights (19 access rights / 10.71 GW across CWO + SW) + AEMO IASR Workbook (146 Committed/Anticipated projects, 94 matched / 64% — fuzzy-matcher refinement flagged for v3.14). Backfills `projects.rez` for 61 projects. New `aemo_iasr_projects` + `energyco_rez_access` tables. New `RezAccessRow` chip on ProjectDetail. New `docs/DATA_REFRESH.md` runbook. Closed the v3.09.4 spawn-task chip.
- **v3.13.0** — REZ Pipeline tab on TransmissionInfra + augmented REZDetail pages. New aggregation exporter `export_rez_pipeline.py`. Closed the v3.12.0 spawn-task chip.

### Database state (verified 2026-05-26)

| Table | Rows | Range / freshness |
|---|---|---|
| `projects` | 1,064 | All with `connection_status` populated except 13 vestiges |
| `aemo_generation_info` | 11,917 | Refreshed 2026-05-25 (monthly) |
| `aemo_iasr_projects` | 146 | New table — 2025 IASR Workbook (Aug 2025 final + Dec 2025 addendum) |
| `energyco_rez_access` | 19 | New table — CWO 13 + SW 6 access rights |
| `performance_monthly` | ~16,233 | Through 2026-04 (OE settled) |
| `generation_daily` | ~300k | Through 2026-05-10 |
| `dispatch_availability` (coal 5-min) | ~24.5M | Through 2026-04-17 (MMSDM 45-day lag) |
| `dispatch_price_daily` | ~3.4k | Aug 2024 → 2026-05-10 |
| `bess_5min_peaks` | ~18.2k | Aug 2024 → 2026-05-10 |
| `battery_daily_scada` | 640 | Through 2026-05-24 |
| `battery_records` | 20 | — |
| `demand_daily` | ~11.5k | 2021-01-01 → 2026-04-01 (MMSDM lag) |
| `news_articles` | 340 | Through 2026-05-25 |
| `eis_technical_specs` | 68 | Unchanged since v2.35.0 — paused |

### What's live on the deployed site

- **v3.13.0 shipped 2026-05-26** — `https://travis-coder712.github.io/aures-db/`
- Plan doc: `docs/INTELLIGENCE_LAYER_PLAN.md` (authoritative release log)
- Data refresh runbook: `docs/DATA_REFRESH.md` (NEW in v3.12.0)
- Route inventory: `docs/SESSION_OPENER.md` §5

---

## v3.14.0 — proposed scope ("REZ Pipeline polish + completion")

Three coherent items that close out the threads opened in v3.11–13:

### A. Per-REZ context chip on ProjectDetail (small)
When a project has a REZ access right, show its standing within the REZ on the project card. E.g. for Liverpool Range:
> "1 of 13 CWO access rights · 1,332 MW of 7,151 MW allocated · Committed share 24%"

Connects per-project view to the v3.13 REZ Pipeline aggregate. Flagged in the v3.13.0 release log.

**Where:** `ProjectDetail.tsx` Grid Connection section, below `RezAccessRow`.

### B. AEMO IASR fuzzy-matcher refinement (medium)
52 of 146 IASR projects don't match an AURES project (35% miss rate). Refine `pipeline/importers/import_aemo_iasr.py` to catch:
- Stage-specific suffixes (`Stage 2`, `S2`, `- 2`, etc.)
- "BESS" vs "Battery" vs "Energy Storage System" variants
- Gas peakers / pumped hydro patterns the current matcher misses

Target: <20 unmatched (≥85% match rate).

**Bonus:** unmatched IASR projects with high MW (e.g. 240+ MW Eraring Big Battery 2, 250+ MW Swanbank BESS) could be auto-created as new project records.

### C. Consolidated-project vestige cleanup (small)
13 "Stage 2/3" rows linger in the `projects` table with NULL `connection_status` because the importer correctly consolidates them into a parent (Blackstone BESS 2, Bouldercombe Stage 2, Bremer Battery 2/3/4, Goyder BESS Stage 2, etc.). Either delete these vestigial rows or mark them with a `consolidated_into` field so they stop showing in coverage reports.

Flagged in the v3.11.0 release log.

### D. *(Optional — may push to v3.15)* REZ boundary polygons on the Map page
If AEMO ISP GIS data is publicly downloadable, render the 18 declared/in-flight REZ boundaries on the existing `/map` page as Leaflet polygons coloured by congestion or pipeline pressure. Provides visual context for v3.13's REZ Pipeline data.

Scope risk: REZ boundary geometry sourcing + ISP GIS license. May warrant its own release.

---

## v3.15+ candidate backlog

Pulling from `project_aures_next_tasks.md` (older next-tasks doc) + natural follow-ons:

### Performance & analysis
- **Solar Performance Deep Dive** (next-tasks #2, large 2-3 sessions): EIS-vs-actual for 27 solar projects · curtailment proxy · SolarWatch module.
- **All-Tech Performance Review** (next-tasks #4, large): hub-height vs CF · OEM comparison · hybrid co-location impact.
- **Curtailment sourcing across all techs** (medium): negative-price proxy from OpenElectricity + AEMO quarterly constraint reports.
- **Per-project MLF correlation chart** (small): leverages v3.05 MLF history. Quick win.
- **BESS commissioning ramp scoping** (medium): design question first — charge+discharge semantics differ from solar/wind ramp.

### Data & content quality
- **Data Quality Review Phase 2** (next-tasks #3, medium): 62 high-severity issues to triage — name mismatches, capacity mismatches, similar names false positives.
- **BESS chemistry enrichment** (medium): only 34 of 420 BESS projects have verified chemistry — EIS PDF parsing pass.
- **User-onboarding guide rewrites** (small, high visibility): About / Using / Navigating / Search Tips / Data Quality / Strategic Roadmap / Project Plan — untouched since v2.x.
- **Ownership history enrichment**: only 12 records across 10 projects — many M&A deals missing.

### Architecture & UX
- **Navigation review** (next-tasks #1, medium): mobile bottom nav 5 items vs desktop sidebar 16+ — parity gap.
- **Compare-developers view** (deferred since v2.20.0, medium): side-by-side scorecards on `/developers`.
- **BatteryWatch → CapacityWatch merge** (medium): architectural cleanup with content preservation.
- **BESS bidding per-project summaries** (medium): pre-computed instead of live-processed.

### Big-ticket / infrastructure
- **F4 Phase 2 pipeline trigger endpoint** (large, needs backend API): "Update Now" button replacing clipboard CLI commands.

### Cross-cutting concern
- **Curtailment data sourcing** is referenced in multiple analyses (Solar #2, All-Tech #4, REZ deep dives) — tackle early.

---

## Data-freshness gaps (refreshed 2026-05-26)

| Source | Latest | Status |
|---|---|---|
| `news_articles` | 2026-05-25 | ✅ Fresh (v3.10.1 refresh) |
| `aemo_generation_info` | 2026-05-25 | ✅ Fresh (v3.10.1 refresh) |
| `performance_monthly` | 2026-04 | ✅ Fresh (v3.10.1 refresh — OE has 1-month lag) |
| `battery_daily_scada` | 2026-05-24 | ✅ Fresh |
| `aemo_iasr_projects` | 2025-Aug + Dec addendum | ✅ Latest available (annual cadence) |
| `energyco_rez_access` | 2025-04 / 2025-05 | ✅ Latest available (ad-hoc cadence) |
| `demand_daily` | 2026-04-01 | ⏳ Blocked by MMSDM 45-day publication lag |
| `dispatch_availability` (coal) | 2026-04-17 | ⏳ Same MMSDM lag |
| `market_prices` | never | ❌ No automated importer (backlog) |
| ~~`aemo_isp_rez`~~ | — | ✅ **Now sourced via AEMO IASR Workbook (v3.12.0)** |

---

## Architecture patterns to preserve

(Unchanged from v3.09.0 handoff — all still apply. Reproduced here for cold-read convenience.)

**Foundation components (in `frontend/src/components/common/`):**
- `<ChartWrapper>` — Recharts wrapper with PNG + CSV export. Use for every new chart.
- `<DataTable<T>>` — sortable, row-numbered, totals row, CSV export, mobile column-hiding.
- `<DrillPanel>` — slide-in (desktop) / bottom-sheet (mobile). ESC + backdrop close.
- `<DataProvenance>` — source freshness chip row. Register new sources in `frontend/src/lib/dataSources.ts`.

**Big files worth knowing before editing:**
- `src/pages/intelligence/SchemeTracker.tsx` — 5,000+ lines (NSW Wind tab added in v3.09).
- `src/pages/intelligence/TransmissionInfra.tsx` — 1,800+ lines (REZ Pipeline tab added v3.13).
- `src/pages/REZDetail.tsx` — Pipeline & Access Rights panel added v3.13.
- `src/pages/ProjectDetail.tsx` — ConnectionStatusRow (v3.11) + RezAccessRow (v3.12).
- `src/components/charts/WindValueAnalysis.tsx` — 3,500+ lines, PDF export.
- `src/lib/exportPdf.ts` — PDF tuning (don't regress: JPEG 0.82 / scale 1.5 / jsPDF compress / FAST).
- `src/hooks/useVersion.ts` — 5-min poll of `version.json` + Refresh badge.

**Pipeline pattern:**
- Importers populate SQLite → exporters emit static JSON at `frontend/public/data/`.
- Aggregate at import time for high-volume data.
- **MMSDM revision dedupe** by `(SETTLEMENTDATE, DUID)`.
- **Overlay merge** in exporter preserves hand-curated `data/projects/<tech>/<id>.json` fields (see `OVERLAY_OVERRIDE_FIELDS` at `pipeline/exporters/export_json.py:40` — extended in v3.11/v3.12 with connection_* and rez_access_* fields).
- **Never downgrade `status`** in importers — `pipeline/validators/validate_status.py` enforces.
- **COALESCE(NULLIF(...)) protection** in UPDATE branches — preserves hand-curated values when auto-importer runs.

**Release pattern (v3.08.0 reinforced — non-negotiable):**
- Bump **BOTH** `frontend/package.json` AND `frontend/public/data/metadata/version.json` to the same number.
- Update `built_at` in version.json.
- Add release entry to top of `docs/INTELLIGENCE_LAYER_PLAN.md` "Recent notable releases".
- `npx tsc -b && npm run build` locally before push (CI is stricter than vite build).
- **Don't commit without Travis explicitly asking.**

---

## Technical gotchas

(Carried forward from v3.09.0 handoff. Numbered list preserved for cross-reference.)

1. **CI is stricter than `vite build`** — always `npx tsc -b` locally before push.
2. **Never define a React component inside another React component.**
3. **Icons defined BEFORE the const arrays** that reference them — Vite HMR breaks otherwise.
4. **Two version files must bump in sync** — `package.json` AND `public/data/metadata/version.json`.
5. **JSX text doesn't need apostrophe escaping** — `\'` renders literally inside JSX. Only escape inside JS string literals.
6. **Recharts Tooltip formatter** — use `(value, name) => ...` and coerce via `Number(value) || 0`, not `(value: number) => ...`. v3.13 had a regression here that was caught at the tsc step.
7. **MMSDM revisions inflate MWh** — always dedupe by `(SETTLEMENTDATE, DUID)`.
8. **MMSDM filename format changed Aug 2024** — try `PUBLIC_ARCHIVE#...` then fall back to legacy `PUBLIC_DVD_...`.
9. **MMSDM date format is `2025/12/31`** (slashes).
10. **Python 3.9 on this machine** — `str | None` requires 3.10+. Use `Optional[str]`.
11. **OE free tier**: 367-day lookback, ~500 req/day, no rate-limit headers — plan calls.
12. **OE importer only pulls `status='operating'`** — commissioning-phase gen lives only in `generation_daily`. Don't "fix" without understanding.
13. **`import_generation_daily.py` BESS status filter** includes `'Committed', 'Committed*'`. **Do NOT revert.**
14. **Partial-month detection** — compare latest entry's CF to historical median; if <55% of median, scale up.
15. **PDF tuning** (44MB → 1.5MB) — JPEG quality 0.82 · html2canvas scale 1.5 · `jsPDF({ compress: true })` · `addImage(..., 'JPEG', ..., 'FAST')`.
16. **MMSDM archive publication lag** ≈ 45 days.
17. **Don't commit SQLite DB** — gitignored; data ships as JSON.
18. **Don't `git add .`** — stage specific files.
19. **Don't downgrade `status`** — run validator after big imports.
20. **Don't edit `projects` table directly** for fields with an overlay — edit `data/projects/<tech>/<id>.json` instead.
21. **NEW (v3.11):** When auto-importers set `connection_status`, use `COALESCE(NULLIF(<col>, ''), ?)` — preserves hand-curated values.
22. **NEW (v3.12):** `OVERLAY_OVERRIDE_FIELDS` is the authoritative list of fields whose overlay value wins over the DB. When adding new hand-curated fields, register them there.
23. **NEW (v3.13):** REZ name canonicalisation lives in `pipeline/exporters/export_rez_pipeline.py REZ_CANONICAL`. When new variants appear, add them there — canonical IDs follow the `<state>-<rez-name>` convention to align with `frontend/src/data/rez-zones.ts`.

---

## Environment setup

- OpenElectricity API key in `~/.zshrc`: `OPENELECTRICITY_API_KEY=...` (free / Community plan).
- NEMWEB importers need no auth — just internet.
- Cached MMSDM zips live in `data/nemweb_cache/` (~3 GB, gitignored).
- Cached AEMO IASR + EnergyCo xlsx files live in `pipeline/importers/downloads/` (gitignored).
- Dev server: `.claude/launch.json` defines `aures-dev`. Local URL: `http://localhost:5173/aures-db/`.

---

## Key file locations

| File | Purpose |
|---|---|
| `docs/SESSION_OPENER.md` | Project bootstrap (read first, every session) |
| `docs/INTELLIGENCE_LAYER_PLAN.md` | Release log + authoritative plan |
| `docs/NEXT_SESSION_HANDOFF.md` | This file |
| `docs/DATA_REFRESH.md` | Per-importer cadence runbook (new in v3.12.0) |
| `CLAUDE.md` | Repo-root pointer to SESSION_OPENER |
| `frontend/package.json` | App version (bump in sync) |
| `frontend/public/data/metadata/version.json` | PWA refresh signal |
| `frontend/src/hooks/useVersion.ts` | Polls version.json + Refresh badge |
| `frontend/src/lib/dataService.ts` | All JSON fetches (cached) |
| `frontend/src/lib/dataSources.ts` | Source registry — extended v3.12 with `aemo_iasr` + `energyco_rez_access` |
| `frontend/src/lib/exportPdf.ts` | PDF tuning utility |
| `frontend/src/pages/intelligence/TransmissionInfra.tsx` | REZ Pipeline tab (v3.13) |
| `frontend/src/pages/REZDetail.tsx` | Pipeline & Access Rights panel (v3.13) |
| `frontend/src/pages/ProjectDetail.tsx` | ConnectionStatusRow + RezAccessRow (v3.11/v3.12) |
| `frontend/src/pages/intelligence/MansfieldPipeline.tsx` | v3.10.0 proof-of-concept |
| `frontend/src/pages/intelligence/SchemeTracker.tsx` | NSW Wind tab (v3.09) |
| `pipeline/exporters/export_json.py` | Mega-exporter (OVERLAY_OVERRIDE_FIELDS line 40) |
| `pipeline/exporters/export_rez_pipeline.py` | REZ Pipeline aggregation (v3.13) |
| `pipeline/exporters/export_regional_pipeline.py` | Mansfield region (v3.10) |
| `pipeline/importers/import_aemo_gen_info.py` | Generator Info + `connection_status` derivation (v3.11) |
| `pipeline/importers/import_aemo_iasr.py` | IASR Workbook + `projects.rez` backfill (v3.12) |
| `pipeline/importers/import_energyco_rez_access.py` | NSW REZ Access Rights (v3.12) |
| `data/projects/<tech>/<id>.json` | Hand-curated overlay files |

---

## How to pick up next session

1. Read `docs/SESSION_OPENER.md` end-to-end (the bootstrap).
2. Read this file for current state + backlog.
3. Run the health-check commands below.
4. Pick from v3.14 scope or v3.15+ backlog. v3.14 is fully spec'd above — items A/B/C can be tackled in any order. D is the optional bigger play.

**Sanity-check commands:**
```bash
cd /Users/travishughes/aures-db
git status                                                                       # expect clean
git log --oneline -5                                                             # last shipped version
sqlite3 database/aures.db "SELECT COUNT(*) FROM projects"                        # 1064
sqlite3 database/aures.db "SELECT COUNT(*) FROM aemo_iasr_projects"              # 146 (v3.12 table)
sqlite3 database/aures.db "SELECT COUNT(*) FROM energyco_rez_access"             # 19 (v3.12 table)
sed -n 's/.*"version": "\(.*\)".*/\1/p' frontend/package.json | head -1          # 3.13.0
cat frontend/public/data/metadata/version.json                                   # must match
```

If the two version numbers disagree, **stop and fix before anything else** — the v3.08.0 lesson.
