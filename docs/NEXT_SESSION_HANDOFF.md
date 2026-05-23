# AURES — Next Session Handoff

**Last refreshed:** 2026-05-23, end of v3.09.0 session
**Latest shipped version:** v3.09.0
**Purpose:** Single-place brief for the next session. Cold-readable — pair with `docs/SESSION_OPENER.md` and `docs/INTELLIGENCE_LAYER_PLAN.md`.

---

## Current state snapshot (v3.09.0)

### v3.09.0 — NSW Wind & CIS T7 deep dive (just shipped, 2026-05-23)

CIS Tender 7 results landed today (2026-05-23) — 19 projects / 7.8 GW awarded vs 5 GW target, wind-dominated. NSW filled its 8-project quota with three wind winners (Yanco Delta 1,450 MW Origin — Australia's biggest wind project; Baldin 346 MW Goldwind wind+BESS; Bullewah 283 MW BayWa — REZ-access capped). DCCEEW guidance now is that **NSW will be excluded from CIS Tender 9**, so post-T7 NSW wind only has the Q2 2026 NSW Roadmap LTESA Generation round (2.5 GW, hybrid-favoured) as a path.

v3.09.0 added a 9th tab on `/intelligence/scheme-tracker` — **NSW Wind** — with eight sections: T7 snapshot, 12-project NSW wind cohort table, build timeline Gantt with Eraring shutdown reference line, "yet-to-win" candidate table headed by Pottinger and Liverpool Range Stage 2, upcoming LTESA round briefing, 3-band qualitative H/M/L probability scoring across 12 candidates, LTESA-vs-CISA mechanism comparison, and a shareable copy/PDF commentary card. New `LTESA_R8_CANDIDATES` and `NSW_WIND_COHORT` arrays in `frontend/src/data/scheme-rounds.ts` are the single source of truth. New "Scheme Contracts" section on `ProjectDetail.tsx`. 12 NSW wind overlay files updated with structured scheme_contracts / timeline_events / audit-trail stakeholder_issues (White Rock pattern). New methodology guide `nsw-wind-cis-ltesa`. SchemeBoardroom narrative refreshed (T7 outlook milestone + grid-connection constraint updated to cover T7). `CISLTESAModule.tsx` learning module updated for T7 results + NSW state pivot.

### What's live on the deployed site
- **v3.09.0 shipped 2026-05-23** — see release log entry in `docs/INTELLIGENCE_LAYER_PLAN.md`.
- **v3.08.0** — PWA refresh-prompt fix + expanded SESSION_OPENER (background): both `frontend/package.json` and `frontend/public/data/metadata/version.json` now bump in sync (the drift this fixed is documented below as a permanent gotcha).
- All features on `https://travis-coder712.github.io/aures-db/`.
- Plan doc: `docs/INTELLIGENCE_LAYER_PLAN.md` — authoritative release log.
- Route inventory: see `docs/SESSION_OPENER.md` §5 — refreshed 2026-05-22.

### v3 line — what landed since v2.35.0

The v3 cycle has been **two big threads**: the learning curriculum build-out, then the Commissioning Ramp tracker.

**Learning curriculum (the v2.66 → v2.97 arc, pre-v3):**
- `/learn` hub + 11 modules: `constraints`, `cis-ltesa-bidding`, `nsw-rez`, `bess-story`, `energy-transition`, `planning-approvals`, `aemo-connections`, `ppas`, `project-financing`, `valuing-projects` (3-part: operational / development / synthesis), `summing-it-up`.
- Interactive **PPA × CISA calculator** with IRR, sliders, 14-point interactions checklist, exportable PDF reference.
- White Rock fact corrections (v2.84/v2.85) — establishes the "leave audit trail in `stakeholder_issues`" pattern.
- PDF tuning win (v2.85): 44MB → 1.5MB (JPEG 0.82 / scale 1.5 / jsPDF compress / FAST).
- v2.98/v2.99 extracted Brisbane Builder + Acknowledge Country into separate repos.

**Scheme Boardroom + LTESA (v3.00 → v3.05):**
- v3.00.0 — single-hour PPA × CISA explorer (3 reference designs).
- v3.01.0/v3.02.0 — Scheme Boardroom **lens toggle** (Awarded vs CISA-Confirmed), FID-first wording.
- v3.03.0 — MC1 BCR deep dive in CIS/LTESA module.
- v3.04.0 — **LTESA Round 7 (firming) winners** + lesson updates.
- v3.05.0 — **MLF history chart** in Revenue Intelligence.

**Commissioning Ramp tracker (v3.06 → v3.07.1):**
- v3.06.0 — `/intelligence/revenue` "Commissioning Ramp" tab. Per-asset first-generation date, stable-output date, ramp duration, mixed-basis revenue (settled + modelled). 151 operating solar/wind/hybrid assets. New `pipeline/exporters/export_commissioning_ramp.py`. Also adds `CommissioningRampCard` on project Performance tab. BESS deliberately excluded.
- v3.07.0 — **Ramp curves over time** sub-section: per-asset trajectories aligned at month 0 = first AEMO generation, with group + fleet average overlays. Three Y-axis modes.
- v3.07.1 — Extended `pre-2021-cutoff` flag to also catch assets where `cod_declared` predates first AEMO gen by 60+ days (12 SA wind farms previously misclassified). Censored count 94 → 106.

**Meta (v3.08.0):**
- PWA refresh-prompt drift fix (`version.json` had drifted to 2.99.0 while `package.json` was 3.07.1 — PWA users on cached builds were not getting refresh prompts).
- `docs/SESSION_OPENER.md` heavily expanded with the version sync rule + PWA mechanism, React-inside-React anti-pattern, JSX apostrophe rule, PDF tuning specifics, partial-month detection algorithm, factual-honesty / White Rock correction guidance, "no emojis unless asked" rule.

### Database state (verified 2026-05-23)

| Table | Rows | Range / freshness |
|---|---|---|
| `projects` | 1,064 | — |
| `aemo_generation_info` | 9,275 | refreshed 2026-04-17 (last `import_aemo_gen_info` run) |
| `performance_monthly` | 16,233 | through **2026-05** (OE settled) |
| `generation_daily` | 299,644 | through **2026-05-10** |
| `dispatch_availability` (coal 5-min) | 24,473,768 | through 2026-04-17 |
| `dispatch_price_daily` | 3,240 | **Aug 2024 → 2026-05-10** ✅ (the v2.35.0 backlog item is done) |
| `bess_5min_peaks` | 18,210 | Aug 2024 → 2026-05-10 |
| `battery_daily_scada` (OE) | 565 | 2026-01-17 → 2026-05-09 |
| `battery_records` | 20 | — |
| `demand_daily` | 11,502 | 2021-01-01 → 2026-04-01 (5 weeks stale) |
| `news_articles` | 255 | last 2026-04-17 (5 weeks stale) |
| `eis_technical_specs` | 68 | unchanged since v2.35.0 — enrichment thread paused |

---

## What's pending — prioritised backlog

### Data freshness gaps to refresh
| Source | Latest | Notes |
|---|---|---|
| `news_articles` | 2026-04-17 | Run `import_news_rss.py` |
| `demand_daily` | 2026-04-01 | Run `import_dispatch_regionsum.py` for Apr–May |
| `dispatch_availability` | 2026-04-17 | Run coal backfill for May MMSDM (publishes ~mid-Jun) |
| `aemo_generation_info` | 2026-04-17 | Monthly cadence — due for refresh |
| `market_prices` | never | No automated importer yet |
| `aemo_isp_rez` | never | No automated importer yet |

### Items from old backlog — status
- ✅ **`dispatch_price_daily` backfill** — done, now through 2026-05-10.
- ❓ **User-onboarding guide rewrites** — no v3 commits touching `About / Using / Navigating / Search Tips / Data Quality / Strategic Roadmap / Project Plan` guides. Likely still pending.
- ❓ **Compare-developers view on `/developers`** — no evidence of build. Still deferred.
- ❓ **BatteryWatch → CapacityWatch merge** — no evidence.
- ❓ **BESS bidding per-project summaries** — no evidence.
- ❓ **F4 Phase 2 pipeline trigger endpoint** — no evidence (would need local backend API).
- ⏸ **BESS chemistry enrichment** — `eis_technical_specs` still at 68 rows, target ≥ 50% coverage of 420 BESS projects unmoved.

### Natural follow-ons from recent work
**Commissioning Ramp (v3.06 → v3.07.1):**
- BESS commissioning ramp (deliberately excluded — needs different semantics; charge+discharge cycle vs steady CF). Open design question.
- Developer / OEM rollup: "who ramps faster?" — re-pivots the same data.
- Quartile splits by COD year / state / capacity band.

**Revenue Intelligence (v3.05.0 MLF):**
- Per-project MLF vs revenue correlation chart.
- MLF-adjusted CF normalisation in league tables.

**BESS Records (v2.33–v2.35 era, still applicable):**
- Quarterly period in records timeline.
- Battery utilisation rate (gen_mwh / capacity_mwh × days_active).
- Seasonal records (summer vs winter splits).
- 5-min revenue using exact-interval dispatch prices (needs `dispatch_price_5min` — much bigger table).

**Learning curriculum:**
- 12th module? Curriculum was declared "complete" at v2.97, but Travis pushes for depth — likely candidates if needed: hedging mechanics, capacity markets, REZ access rights deep-dive, T-FIP.
- Module updates: anything material in v3.03/v3.04 (MC1 BCR, LTESA R7) that should mirror into `/learn/cis-ltesa-bidding`.

---

## Architecture patterns to preserve

**Foundation components (in `frontend/src/components/common/`):**
- `<ChartWrapper>` — Recharts wrapper with PNG + CSV export. Use for every new chart.
- `<DataTable<T>>` — sortable, row-numbered, totals row, CSV export, mobile column-hiding. Built-in formatters.
- `<DrillPanel>` — slide-in (desktop) / bottom-sheet (mobile). ESC + backdrop close.
- `<DataProvenance>` — source freshness chip row. Register new sources in `frontend/src/lib/dataSources.ts`.

**Big files worth knowing before editing (from SESSION_OPENER §6):**
- `src/components/charts/WindValueAnalysis.tsx` — 3500+ lines, PDF export, partial-month scaling.
- `src/components/charts/ValuePdfSections.tsx` — shared Project Profile + Evolution Timeline + NEM Lens PDF sections (Wind/Solar/BESS all use this).
- `src/components/charts/PerformanceTab.tsx` — project-detail Performance tab. **Commissioning Ramp card** (v3.06+) lives here.
- `src/lib/exportPdf.ts` — the PDF tuning (don't regress: JPEG 0.82 / scale 1.5 / jsPDF compress / FAST).
- `src/hooks/useVersion.ts` — 5-min poll of `version.json` + Refresh badge + SW skip-waiting flow.

**Pipeline pattern:**
- Importers populate SQLite → exporters emit static JSON at `frontend/public/data/`.
- Aggregate at import time for high-volume data (`generation_daily`, `bess_5min_peaks`).
- **MMSDM revision dedupe** by `(SETTLEMENTDATE, DUID)` — revision rows inflate totals by 2–6× on intervention days.
- **Always render gracefully** when an importer hasn't been run yet (pending-state UI).
- **Overlay merge** in exporter preserves hand-curated `data/projects/<tech>/<id>.json` fields (see `OVERLAY_OVERRIDE_FIELDS` in `pipeline/exporters/export_json.py:40`).

**Release pattern (v3.08.0 reinforced — non-negotiable):**
- Bump **BOTH** `frontend/package.json` AND `frontend/public/data/metadata/version.json` to the same number. Skip the JSON → PWA users stuck on cached build forever.
- Update `built_at` in version.json.
- Add release entry to top of `docs/INTELLIGENCE_LAYER_PLAN.md` "Recent notable releases".
- `npx tsc -b && npm run build` locally before push (CI is stricter than vite build).
- `gh run watch --exit-status` after push — don't assume.
- `gh release create vX.Y.Z` with detailed notes.
- **Don't commit without Travis explicitly asking.**

---

## Technical gotchas

1. **CI is stricter than `vite build`** — always `npx tsc -b` locally before push.
2. **Never define a React component inside another React component.** Every parent render creates a fresh type → DOM remount → `<input type="range">` drag loss, focus loss, animation restart. Real slider bug fixed in v2.86.
3. **Icons defined BEFORE the const arrays** that reference them — Vite HMR breaks otherwise.
4. **Two version files must bump in sync** — `package.json` AND `public/data/metadata/version.json`. v3.08.0 fixed the drift.
5. **JSX text doesn't need apostrophe escaping** — `\'` renders literally inside JSX. Only escape inside JS string literals (e.g. inside a `LESSONS` array).
6. **Recharts gotchas** — Tooltip formatter: use `(value) => ...` not `(value: number) => ...`. `dot` prop: cast props. `labelFormatter` payload: cast via `(payload as any)?.[0]?.payload`. No `filter` prop — use custom `content={...}`.
7. **MMSDM revisions inflate MWh** — always dedupe by `(SETTLEMENTDATE, DUID)`.
8. **MMSDM filename format changed Aug 2024** — importers try `PUBLIC_ARCHIVE#...#FILE01#...` then fall back to legacy `PUBLIC_DVD_...`.
9. **MMSDM date format is `2025/12/31`** (slashes), not `2025-12-31`. SQLite + Python parsers must handle both.
10. **Python 3.9 on this machine** — `str | None` syntax requires 3.10+. Use bare annotations or `Optional[str]`.
11. **OpenElectricity free tier**: 367-day lookback, ~500 req/day, no rate-limit headers — plan calls.
12. **OE importer only pulls `status='operating'`** — commissioning-phase gen lives only in `generation_daily`. Don't "fix" without understanding — Commissioning Ramp tab depends on the gap.
13. **`import_generation_daily.py` BESS status filter** includes `'Committed', 'Committed*'` in addition to In Service / Commissioning. **Do NOT revert** — Waratah, Tarong, Liddell, etc. depend on it.
14. **Partial-month detection** in `PerformanceTab.tsx` + Value Analyses: compare latest entry's CF to historical median for the same calendar month; if <55% of median, scale up. Fallback: scale by `today.getDate() / daysInMonth` for current month. Reuse helpers — don't reinvent.
15. **PDF tuning** (44MB → 1.5MB) — JPEG quality 0.82 · html2canvas scale 1.5 · `jsPDF({ compress: true })` · `addImage(..., 'JPEG', ..., 'FAST')`. Travis reads PDFs on both mobile and desktop. Don't regress.
16. **MMSDM archive publication lag** ≈ 45 days.
17. **Don't commit SQLite DB** (`database/aures.db`) — gitignored. Data ships as JSON exports.
18. **Don't `git add .`** — stage specific files. Imports leave temp files.
19. **Don't downgrade `status`** in importers — run `pipeline/validators/validate_status.py` after big imports.
20. **Don't edit `projects` table directly** for fields with an overlay file — edit `data/projects/<tech>/<id>.json` instead.

---

## Environment setup

- OpenElectricity API key in `~/.zshrc`: `OPENELECTRICITY_API_KEY=oe_4zNSDDp4bBBdm4SJ4MYu9t` (free / Community plan).
- NEMWEB importers need no auth — just internet.
- Cached MMSDM zips live in `data/nemweb_cache/` (~3 GB, gitignored).
- Dev server: `.claude/launch.json` defines `aures-dev` (npm `run dev --prefix frontend`, port 5173). Use Claude Preview MCP if available.
- Local URL: `http://localhost:5173/aures-db/`. Always test mobile width (375×812).

---

## Key file locations

| File | Purpose |
|---|---|
| `docs/SESSION_OPENER.md` | Project bootstrap (read first, every session) |
| `docs/INTELLIGENCE_LAYER_PLAN.md` | Release log + authoritative plan |
| `docs/NEXT_SESSION_HANDOFF.md` | This file |
| `CLAUDE.md` | Repo-root pointer to SESSION_OPENER |
| `frontend/package.json` | App version (bump in sync with version.json) |
| `frontend/public/data/metadata/version.json` | PWA refresh signal |
| `frontend/src/hooks/useVersion.ts` | Polls version.json + Refresh badge |
| `frontend/src/lib/dataService.ts` | All JSON fetches (cached) |
| `frontend/src/lib/dataSources.ts` | Source registry + PAGE_SOURCES mapping |
| `frontend/src/lib/exportPdf.ts` | PDF tuning utility |
| `frontend/src/components/charts/WindValueAnalysis.tsx` | Wind Value section + PDF |
| `frontend/src/components/charts/ValuePdfSections.tsx` | Shared PDF sections (Wind/Solar/BESS) |
| `frontend/src/components/charts/PerformanceTab.tsx` | Project Performance tab + Commissioning Ramp card |
| `frontend/src/data/learning-modules.ts` | Learning curriculum catalogue |
| `pipeline/exporters/export_json.py` | Mega-exporter (most JSON outputs) |
| `pipeline/exporters/export_commissioning_ramp.py` | Commissioning Ramp standalone exporter |
| `pipeline/importers/import_dispatchprice.py` | DISPATCHPRICE daily regional spot stats |
| `pipeline/importers/import_bess_5min.py` | BESS 5-min peaks |
| `pipeline/importers/import_generation_daily.py` | Solar/wind/BESS daily (incl. Committed BESS) |
| `pipeline/importers/import_mlf_history.py` | MLF history (v3.05.0) |
| `pipeline/scripts/backfill_coal_history.sh` | 5-year MMSDM coal backfill loop |
| `data/projects/<tech>/<id>.json` | Hand-curated overlay files (merged by exporter) |
| `memory/MEMORY.md` (in `~/.claude/projects/...`) | Auto-memory index |

---

## How to pick up next session

1. Read `docs/SESSION_OPENER.md` end-to-end (the bootstrap).
2. Read this file for current state + backlog.
3. Run the §15 health check from SESSION_OPENER.
4. Pick from the backlog above based on energy. Quick wins ready to pluck:
   - **Refresh stale data** — `news_articles` (5 weeks), `demand_daily` (5 weeks), `aemo_generation_info` (monthly cadence due).
   - **User-onboarding guide rewrites** — still untouched, high visibility, low risk.
   - **Per-project MLF correlation chart** — leverages v3.05.0 MLF history data.
   - **BESS commissioning ramp scoping** — design question first (semantics differ from solar/wind), then build.

**Sanity-check commands:**
```bash
cd /Users/travishughes/aures-db
git status                                                                       # expect clean
git log --oneline -5                                                             # last shipped version
sqlite3 database/aures.db "SELECT COUNT(*) FROM projects"                        # ~1064
sqlite3 database/aures.db "SELECT MAX(date) FROM generation_daily"               # current freshness
sed -n 's/.*"version": "\(.*\)".*/\1/p' frontend/package.json | head -1          # app version
cat frontend/public/data/metadata/version.json                                   # PWA version (must match)
```

If those two version numbers disagree, **stop and fix before doing anything else** — that's the v3.08.0 lesson.
