# AURES — Next Session Handoff

**Last refreshed:** 2026-06-20, planning session (no code changes)
**Latest shipped version:** v3.16.8
**Purpose:** Single-place brief for the next session. Cold-readable — pair with `docs/SESSION_OPENER.md` and `docs/INTELLIGENCE_LAYER_PLAN.md`.

---

## Current state snapshot (v3.16.8)

### v3.14–v3.16.8 — Open Rounds + NSW T8 LTESA deep dive (12 releases)

The v3.14–16 thread = **Open Rounds intelligence + NSW Tender 8 strategy**:

- **v3.14.0** — Open Rounds "Current State of Play" tab on Scheme Intelligence.
- **v3.14.1** — Commitment-eligibility commentary per open round.
- **v3.15.0** — NSW Tender 8 strategy deep-dive — six analyst sub-sections.
- **v3.15.1** — Federal CIS cards rebuilt from gazetted T8 docs.
- **v3.15.2** — NSW T8 card rebuilt from gazetted primary docs.
- **v3.16.0** — NSW T8 helpers — ineligible-projects modal + PPA/LTESA calculator + staged-projects callout.
- **v3.16.1** — NSW T8 Risk-Share Deep Dive — worked examples + chart.
- **v3.16.2** — NSW T8 PPA Leverage Deep Dive — plain-English bid strategy.
- **v3.16.4** — NSW T8 Bid Params + Option Mechanics + Bid Config Deep Dives.
- **v3.16.5** — Split Open Rounds into CIS + LTESA tabs; confirm NSW T8 Exercise Notice timing from proforma.
- **v3.16.7** — NSW T8 Proforma Contract Mechanics Deep Dive — 11 financier-diligence cards.
- **v3.16.8** — Full data refresh per DATA_REFRESH runbook.

**Note:** The original v3.14 scope (REZ Pipeline polish items A/B/C) was deferred in favour of the NSW T8 work. Those items remain in the backlog below.

### What landed v3.09.0 → v3.13.0 (context from prior handoff)

See `docs/INTELLIGENCE_LAYER_PLAN.md` for detailed release log. Key threads:
- v3.09 = NSW Wind & CIS T7 deep dive (5 releases)
- v3.10 = Mansfield Regional Pipeline + CIS T7 final form (7 releases)
- v3.11–13 = Connection + REZ/TNSP layer (3 releases)

### Database state (verified 2026-06-20)

| Table | Rows | Range / freshness |
|---|---|---|
| `projects` | 1,064 | All with `connection_status` except 13 vestiges |
| `aemo_generation_info` | 11,917 | Refreshed 2026-05-25 (monthly) |
| `aemo_iasr_projects` | 146 | 2025 IASR Workbook (Aug 2025 final + Dec 2025 addendum) |
| `energyco_rez_access` | 19 | CWO 13 + SW 6 access rights |
| `performance_monthly` | ~16,233 | Through 2026-04 (OE settled) |
| `generation_daily` | ~300k | Through 2026-05-10 |
| `dispatch_availability` (coal 5-min) | ~24.5M | Through 2026-04-17 (MMSDM 45-day lag) |
| `dispatch_price_daily` | ~3.4k | Aug 2024 → 2026-05-10 |
| `bess_5min_peaks` | ~18.2k | Aug 2024 → 2026-05-10 |
| `battery_daily_scada` | 675 | Through 2026-06-16 |
| `battery_records` | 20 | — |
| `demand_daily` | ~11.5k | 2021-01-01 → 2026-04-01 (MMSDM lag) |
| `news_articles` | 340 | Through 2026-05-25 |
| `eis_technical_specs` | 68 | Unchanged since v2.35.0 — paused |
| `league_table_entries` | 2026: 221 entries | 29 BESS, 79 solar, 80 wind, 33 pumped hydro |

### What's live on the deployed site

- **v3.16.8 shipped** — `https://travis-coder712.github.io/aures-db/`
- Plan doc: `docs/INTELLIGENCE_LAYER_PLAN.md` (authoritative release log)
- Data refresh runbook: `docs/DATA_REFRESH.md`
- Route inventory: `docs/SESSION_OPENER.md` §5

---

## Unified Backlog (refreshed 2026-06-20)

### Tier 1 — Deferred v3.14 polish (REZ Pipeline completion)

These were originally v3.14 scope but deferred for the NSW T8 thread. Still applicable:

**A. Per-REZ context chip on ProjectDetail (small)**
Show a project's standing within its REZ. E.g. "1 of 13 CWO access rights · 1,332 MW of 7,151 MW allocated · Committed share 24%". Where: `ProjectDetail.tsx` Grid Connection section, below `RezAccessRow`.

**B. AEMO IASR fuzzy-matcher refinement (medium)**
52 of 146 IASR projects unmatched (35% miss rate). Target: <20 unmatched (≥85%). Refine `pipeline/importers/import_aemo_iasr.py` for stage suffixes, BESS/Battery/ESS variants, gas/pumped hydro patterns. Bonus: auto-create records for high-MW unmatched projects.

**C. Consolidated-project vestige cleanup (small)**
13 Stage 2/3 rows with NULL `connection_status`. Either delete or mark with `consolidated_into` field.

**D. REZ boundary polygons on Map (optional, may need ISP GIS data)**

### Tier 2 — New priorities (from 2026-06-20 planning session)

#### BESS Market Intelligence (HIGH PRIORITY)

Batteries are now the defining NEM story. Key market facts (as of June 2026):
- Batteries set the marginal price in **32% of all NEM trading intervals** in Q1 2026 (evening peaks ~40%, midday solar ~61%)
- BESS revenues fell **38% YoY** to $73k/MW/yr; May 2026 hit **$29k/MW/yr** — lowest since Modo began tracking (Jul 2022)
- QLD energy-only revenues dropped **73%** as BESS capacity grew 2.7x
- NEM wholesale avg ~$73/MWh Q1 2026, **down 12% YoY**. NSW -33.3% in May; SA/TAS more resilient at -7%
- Installed BESS exceeded **8 GW** (4.4 GW added since Q1 2025); pipeline **33.2 GW** (49% of NEM connection queue)
- Modo projects **16.8 GW online by end 2027**
- Renewables hit record **47% of NEM supply** Q1 2026
- Eraring Battery + Melbourne RE Hub A3 (NEM's first 4-hour battery, Dec 2025) at the sophisticated end of bidding; gap between top and bottom performers widening

**Proposed new surface — "Battery Market Intelligence" tab:**
- Price-setting frequency by technology (battery vs gas vs hydro) over time
- Revenue per MW trends by state (Modo-style waterfall)
- Bidding sophistication heatmap — spread capture by entity over time
- Cannibalisation tracker — correlation between installed BESS MW and revenue per MW
- State-by-state wholesale price trends

**This absorbs two existing backlog items:**
- BatteryWatch → CapacityWatch merge (was Tier 4 #5) → subsumed into this larger surface
- BESS bidding per-project summaries (was Tier 4 #6) → subsumed

**Key sources:** Modo Energy, WattClarity (Paul McArdle), RenewEconomy, AEMO ESOO + MMSDM dispatch data.

#### Research Notes System (MEDIUM PRIORITY)

New AURES section for time-stamped, categorised research notes. Addresses:
- SchemeTracker is now very large (5,000+ lines pre-v3.14, likely larger after NSW T8 work) — some tabs contain time-sensitive commentary better suited as dated research notes
- CIS analysis, policy questions, and market commentary are inherently temporal — they need a date and context rather than being embedded as permanent tabs
- Categories: BESS Market, CIS/LTESA, Wholesale Prices, Policy, REZ/Transmission, Senate Estimates

**Design approach:** `/intelligence/research` route with a list of notes filterable by category and date. Each note is a markdown-style entry with metadata (date, category, tags, related projects). Could start with a JSON data file and simple renderer, migrating existing time-sensitive SchemeTracker content over time.

#### CIS/LTESA Policy Questions (MEDIUM PRIORITY)

Extends the existing CIS Outcomes deep dive:
- **Can unsigned CIS winners bid into current LTESA rounds?** Live policy tension — no definitive public guidance found. If allowed, gives CIS winners dual-contract optionality; if disallowed, protects LTESA round integrity.
- **CIS Tender 8**: Open seeking **16 GWh of storage** across NEM, results expected mid-2026.
- **Senate Estimates monitoring**: Track new hearing transcripts for CIS construction progress updates.
- **State-by-state CIS dashboard**: Per-state breakdown of projects, capacity, stages (deferred from earlier CIS Outcomes plan).
- **Policy target tracking**: 40 GW CIS target burndown chart; LTESA 12 GW gen + 2 GW LDS by 2030 progress.

#### WA Expansion (LARGE — multi-session)

Expand AURES into Western Australia's energy market. Structurally different from NEM:

**WA Market Structure (WEM):**
- **Reserve Capacity Mechanism (RCM)**: Capacity credits paid at Reserve Capacity Price — currently $251,420/MW/yr. BRCP cap rising to $360,700/MW/yr for 2026 (+112% on 2024).
- **Capacity year**: Oct–Sep (not Jul-Jun like NEM).
- **No formal REZs** — uses zones/industrial-hub taxonomy tied to named transmission segments.
- **CIS-WA runs as separate WEM-specific tenders** — distinct from NEM CIS rounds.
- **Grid**: SWIS (South West Interconnected System) — islanded, no NEM interconnection.

**CIS-WA results:**
- Tender 2 (Mar 2025, storage): Boddington Giga Battery 324 MW, Muchea 150 MW (Neoen), Merredin 100 MW (Atmos), Waroona 80 MW (Frontier).
- Tenders 5 & 6 (May 2026): 10 projects — 1,886 MW renewables + 482 MW / 3,683 MWh storage. Largest single day of federal capacity support in WEM history. Includes Collie Battery & Solar Hybrid (200 MW/1,518 MWh), Neoen Yathroo Battery (200 MW/1,600 MWh).

**Supply outlook:** 2025 ESOO forecasts **425 MW shortfall from 2027-28**. ~1,700 MW coal/gas retires 2027-2032 (Collie 317 MW 2027, Muja D 422 MW Oct 2029, Pinjar gas, Bluewaters coal).

**Transmission (SWIS Transmission Plan, Sep 2025):**
- Phase 1 (2025-2030): ~2.6 GW unlocked (1 GW north, 1.6 GW east) + 1,500 MW industrial loads.
- Phase 2 (2030-2035): Chittering, Moora, Collie, metro Perth.
- Phase 3 (2035+): Green-industry expansion.
- **Clean Energy Link – North**: Under construction, $584M committed — biggest WA transmission investment in a decade.
- Northern + eastern renewable corridors gated on Phase 1 / Clean Energy Link delivery.

**Data sources:**
- `data.wa.aemo.com.au` — bulk CSV (demand, dispatch/WEMDE, prices, settlements, STEM, NCESS). Free.
- Some AEMO WEM API endpoints need participant credentials — bulk CSV is the practical free path.
- WEM ESOO (annual) — forecasts, retirements, CRC, shortfalls.
- Western Power — SWIS Transmission Plan, network data.
- ERAWA — BRCP determinations, market rules.
- EPWA — policy, RCM reviews.

**Schema decision deferred** until actual WA data is explored. Options: add `market` field to `projects` table, or separate WA tables. Key structural differences to account for: capacity credits as first-class entities, two pricing concepts (RCP + energy), Oct-Sep capacity year, CIS-WA tender tracking, zone/hub taxonomy instead of REZs.

**Phases:**
1. Data collection + schema design
2. "How WA Works" explainer page (RCM vs NEM comparison)
3. RCM results timeline + project tracking
4. SWIS map with transmission constraints
5. Cross-market NEM vs WEM comparison

### Tier 3 — Six deep-dives (from March 2026 planning, still applicable)

1. **Navigation Review** (medium, 1-2 sessions) — Mobile bottom nav 5 items vs desktop sidebar 16+. Restructure sidebar groups, improve mobile nav, add intelligence sub-navigation. *Foundational — affects all other work.*

2. **Solar Performance Deep Dive** (large, 2-3 sessions) — EIS-vs-actual for 27 solar projects, curtailment proxy sourcing, SolarWatch module. Panel/tracking type analysis, state-by-state CF comparison, degradation tracking. Key question: does bifacial + single-axis outperform fixed-tilt?

3. **Data Quality Review Phase 2** (medium, 1-2 sessions) — 243 issues (62 high severity). Triage name mismatches (12), capacity mismatches (18 high), similar names false positives (29 high). Improve audit script with `is_known_variant()` exclusions. Target: <100 actionable issues.

4. **All-Tech Performance Review** (large, 2-3 sessions) — Wind: hub-height vs CF correlation, OEM comparison (Vestas/GE/Goldwind/Nordex). BESS: revenue by duration, cycling seasonality, grid-forming vs grid-following. Cross-tech: hybrid co-location impact, REZ-level performance, curtailment heatmap.

5. **REZ Deep Dive** (large, 2-3 sessions, research-heavy) — Per-REZ governance, access scheme, infrastructure status, costs, risks for all 18 REZs. REZ comparison dashboard, performance correlation, investment guide. *Partially advanced by v3.12-13 IASR + REZ Pipeline work.*

6. **CIS/LTESA Outcomes** (large, 2-3 sessions) — State-by-state dashboard, CIS vs LTESA head-to-head (success rates, time-to-construction, technology preference), surface `financial-close-data.ts` in UI, policy target burndown charts. *Partially advanced by v3.14-16 NSW T8 work. Some content may migrate to Research Notes system.*

### Tier 4 — Polish & enrichment (lower priority)

- **F4 Phase 2 — Pipeline Trigger Endpoint** (large, needs backend API): "Update Now" button replacing clipboard CLI commands.
- **User-onboarding guide rewrites** (small, high visibility): About / Using / Navigating / Search Tips / Data Quality / Strategic Roadmap / Project Plan — untouched since v2.x, need refresh for v3.x feature set.
- **Data enrichment**: BESS chemistry (34/420 verified), ownership history (12 records/10 projects), `development_score` column (empty), FID/construction_start events (sparse).
- **Compare-developers view** (deferred since v2.20.0): side-by-side scorecards on `/developers`.
- **Per-project MLF correlation chart** (small, quick win): leverages v3.05 MLF history.
- **Developer/OEM commissioning ramp rollup**: "who ramps faster?"
- **5-min revenue using exact-interval dispatch prices**: needs `dispatch_price_5min` table (big).
- **SOL bidding / forecast data**: development-stage PPA commitments + LGC-only contracts not captured.

### Cross-cutting concerns

- **Curtailment data sourcing** — affects Solar (#2), All-Tech (#4), REZ (#5) deep dives + BESS Market Intelligence. Tackle early. Options: negative-price proxy from OpenElectricity (recommended start), AEMO NEMWEB constraint data (complex), AEMO quarterly constraint reports.
- **SchemeTracker decomposition** — now likely 6,000+ lines after NSW T8 work. Research Notes system provides a migration path for time-sensitive content. Consider splitting remaining structural content into separate component files per tab.
- **Data refresh** — battery_daily_scada is current (2026-06-16) but several other sources need refresh: performance_monthly (only through 2026-04), news_articles (2026-05-25), dispatch data.

---

## Data-freshness gaps (checked 2026-06-20)

| Source | Latest | Status |
|---|---|---|
| `battery_daily_scada` | 2026-06-16 | ✅ Fresh (v3.16.8 refresh) |
| `news_articles` | 2026-05-25 | ⚠️ ~4 weeks stale |
| `aemo_generation_info` | 2026-05-25 | ⚠️ Due for monthly refresh |
| `performance_monthly` | 2026-04 | ⚠️ May data likely settled — refresh due |
| `aemo_iasr_projects` | 2025-Aug + Dec addendum | ✅ Latest available (annual cadence) |
| `energyco_rez_access` | 2025-04/05 | ✅ Latest available (ad-hoc cadence) |
| `demand_daily` | 2026-04-01 | ⏳ Blocked by MMSDM 45-day lag |
| `dispatch_availability` (coal) | 2026-04-17 | ⏳ Same MMSDM lag |
| `market_prices` | never | ❌ No automated importer (backlog) |

---

## Architecture patterns to preserve

**Foundation components (in `frontend/src/components/common/`):**
- `<ChartWrapper>` — Recharts wrapper with PNG + CSV export. Use for every new chart.
- `<DataTable<T>>` — sortable, row-numbered, totals row, CSV export, mobile column-hiding.
- `<DrillPanel>` — slide-in (desktop) / bottom-sheet (mobile). ESC + backdrop close.
- `<DataProvenance>` — source freshness chip row. Register new sources in `frontend/src/lib/dataSources.ts`.

**Big files worth knowing before editing:**
- `src/pages/intelligence/SchemeTracker.tsx` — 6,000+ lines (NSW Wind v3.09 + NSW T8 v3.15-16).
- `src/pages/intelligence/TransmissionInfra.tsx` — 1,800+ lines (REZ Pipeline tab v3.13).
- `src/pages/REZDetail.tsx` — Pipeline & Access Rights panel (v3.13).
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

1. **CI is stricter than `vite build`** — always `npx tsc -b` locally before push.
2. **Never define a React component inside another React component.**
3. **Icons defined BEFORE the const arrays** that reference them — Vite HMR breaks otherwise.
4. **Two version files must bump in sync** — `package.json` AND `public/data/metadata/version.json`.
5. **JSX text doesn't need apostrophe escaping** — `\'` renders literally inside JSX.
6. **Recharts Tooltip formatter** — use `(value, name) => ...` and coerce via `Number(value) || 0`, not `(value: number) => ...`.
7. **MMSDM revisions inflate MWh** — always dedupe by `(SETTLEMENTDATE, DUID)`.
8. **MMSDM filename format changed Aug 2024** — try `PUBLIC_ARCHIVE#...` then fall back to legacy `PUBLIC_DVD_...`.
9. **MMSDM date format is `2025/12/31`** (slashes).
10. **Python 3.9 on this machine** — `str | None` requires 3.10+. Use `Optional[str]`.
11. **OE free tier**: 367-day lookback, ~500 req/day, no rate-limit headers — plan calls.
12. **OE importer only pulls `status='operating'`** — commissioning-phase gen lives only in `generation_daily`.
13. **`import_generation_daily.py` BESS status filter** includes `'Committed', 'Committed*'`. **Do NOT revert.**
14. **Partial-month detection** — compare latest entry's CF to historical median; if <55% of median, scale up.
15. **PDF tuning** (44MB → 1.5MB) — JPEG quality 0.82 · html2canvas scale 1.5 · `jsPDF({ compress: true })` · `addImage(..., 'JPEG', ..., 'FAST')`.
16. **MMSDM archive publication lag** ≈ 45 days.
17. **Don't commit SQLite DB** — gitignored; data ships as JSON.
18. **Don't `git add .`** — stage specific files.
19. **Don't downgrade `status`** — run validator after big imports.
20. **Don't edit `projects` table directly** for fields with an overlay — edit `data/projects/<tech>/<id>.json` instead.
21. **COALESCE(NULLIF(...)) protection** on auto-importer UPDATEs — preserves hand-curated values (v3.11).
22. **OVERLAY_OVERRIDE_FIELDS** is the authoritative list of overlay-wins fields. Register new hand-curated fields there (v3.12).
23. **REZ name canonicalisation** lives in `pipeline/exporters/export_rez_pipeline.py REZ_CANONICAL`. Canonical IDs follow `<state>-<rez-name>` (v3.13).

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
| `docs/DATA_REFRESH.md` | Per-importer cadence runbook (v3.12.0) |
| `CLAUDE.md` | Repo-root pointer to SESSION_OPENER |
| `frontend/package.json` | App version (bump in sync) |
| `frontend/public/data/metadata/version.json` | PWA refresh signal |
| `frontend/src/hooks/useVersion.ts` | Polls version.json + Refresh badge |
| `frontend/src/lib/dataService.ts` | All JSON fetches (cached) |
| `frontend/src/lib/dataSources.ts` | Source registry |
| `frontend/src/lib/exportPdf.ts` | PDF tuning utility |
| `frontend/src/pages/intelligence/TransmissionInfra.tsx` | REZ Pipeline tab (v3.13) |
| `frontend/src/pages/intelligence/SchemeTracker.tsx` | NSW Wind (v3.09) + NSW T8 (v3.15-16) |
| `frontend/src/pages/REZDetail.tsx` | Pipeline & Access Rights panel (v3.13) |
| `frontend/src/pages/ProjectDetail.tsx` | ConnectionStatusRow + RezAccessRow (v3.11/v3.12) |
| `frontend/src/pages/intelligence/MansfieldPipeline.tsx` | Regional pipeline proof-of-concept (v3.10) |
| `pipeline/exporters/export_json.py` | Mega-exporter (OVERLAY_OVERRIDE_FIELDS line 40) |
| `pipeline/exporters/export_rez_pipeline.py` | REZ Pipeline aggregation (v3.13) |
| `pipeline/importers/import_aemo_gen_info.py` | Generator Info + connection_status (v3.11) |
| `pipeline/importers/import_aemo_iasr.py` | IASR Workbook + projects.rez backfill (v3.12) |
| `pipeline/importers/import_energyco_rez_access.py` | NSW REZ Access Rights (v3.12) |
| `data/projects/<tech>/<id>.json` | Hand-curated overlay files |

---

## How to pick up next session

1. Read `docs/SESSION_OPENER.md` end-to-end (the bootstrap).
2. Read this file for current state + backlog.
3. Run the health-check commands below.
4. Pick from the unified backlog. Suggested priority order:
   - **Data refresh first** (performance_monthly May data, news, generation_daily)
   - **BESS Market Intelligence** — highest-value new surface, absorbs two existing items
   - **Research Notes system** — enables SchemeTracker decomposition
   - **Deferred v3.14 polish** (A/B/C) — small wins to close REZ arc
   - **WA Expansion** — new market, multi-session project
   - **Deep dives** per Tier 3 list

**Sanity-check commands:**
```bash
cd /Users/travishughes/aures-db
git status                                                                       # expect clean
git log --oneline -5                                                             # last shipped version
sqlite3 database/aures.db "SELECT COUNT(*) FROM projects"                        # 1064
sqlite3 database/aures.db "SELECT COUNT(*) FROM aemo_iasr_projects"              # 146 (v3.12 table)
sqlite3 database/aures.db "SELECT COUNT(*) FROM energyco_rez_access"             # 19 (v3.12 table)
sqlite3 database/aures.db "SELECT MAX(settlement_date) FROM battery_daily_scada" # 2026-06-16
sed -n 's/.*"version": "\(.*\)".*/\1/p' frontend/package.json | head -1          # 3.16.8
cat frontend/public/data/metadata/version.json                                   # must match
```

If the two version numbers disagree, **stop and fix before anything else** — the v3.08.0 lesson.
