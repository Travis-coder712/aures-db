# Session Summary — 2026-04-17

One long session that shipped **v2.29.0**, **v2.29.1**, and prepared **v2.30.0**. This doc is the review brief — what changed, where to look, and what to sanity-check.

## TL;DR

- **v2.29.0** — Coal Watch gained a **YTD Comparison** tab (apples-to-apples same-period comparison across years).
- **v2.29.1** — Same tab, now populated with 5 years of MMSDM-backfilled coal data (2021 → today).
- **v2.30.0 (pending)** — New **Transition Scoreboard** tab on Energy Mix — coal ↓ vs wind/solar/BESS ↑ with demand overlay, per NEM + state, plus a transition-specific records board.

Three releases from a single session. Significant pipeline + UI work. **Review carefully.**

---

## Pull requests / commits (top-down)

Run `git log --oneline -15` in the repo to see the full commit chain. Highlights:

| Commit | What it does |
|---|---|
| `Add export_coal_ytd_comparison() — YTD + same-period rollups (v2.29.0)` | Pipeline exporter for YTD coal JSON |
| `Add YTD Comparison tab to Coal Watch (v2.29.0)` | Frontend tab + controls + chart + table |
| `v2.29.0 — Coal Watch YTD + Same-Period Comparison` | Version bump + plan log |
| `Fix DISPATCHLOAD MMSDM URL for Aug-2024+ archives` | Unblocked historical backfill |
| `Add backfill_coal_history.sh for 5-year MMSDM import` | Bulk backfill helper |
| `v2.29.1 — Coal YTD populated with 2021-2025 history` | Coal YTD JSON refresh with real data |
| `Add generation_daily + demand_daily importers (v2.30.0 prep)` | Two new pipeline modules |
| `Add export_energy_transition() — YoY fuel-tech + demand + records` | Exporter for the scoreboard |
| `Add Transition Scoreboard tab to Energy Mix page` | New frontend component |
| `Fix DISPATCHLOAD revision dedupe + tab-bar scrollbar overlap` | Two bugs found during verification |

---

## Things to review — prioritised checklist

### 🔴 Must-check (correctness)

- [ ] **Coal YTD numbers sanity-check** — visit `/intelligence/energy-mix → Coal Watch → YTD Comparison`. Compare NEM / NSW / QLD / VIC numbers to your own AEMO knowledge:
  - NEM YTD CF ranges 60-68% across 2021-2026 ✓ (plausible)
  - NSW YTD generation went *up* 2021→2024 because Liddell closure forced remaining plants harder — counterintuitive but accurate
  - Gladstone (QLD) outage at ~42% — Rio Tinto maintenance in 2025

- [ ] **Scoreboard percentages** — on `/intelligence/energy-mix → Transition Scoreboard`:
  - NEM coal -5.1% 2021→2025 (full-year would show larger decline; YTD is narrower)
  - Wind +56%, Solar +126% — strong but plausible given ~2x fleet expansion in this window
  - BESS from near-zero → 205 GWh YTD 2025 — new fleet, rapid growth phase

- [ ] **Demand line sanity** — dashed line on the stacked chart should be ~roughly flat at ~53 TWh YTD across all 5 years (NEM total consumption is ~200 TWh/yr full-year)

- [ ] **Records board** — coal-lowest records should be recent (2024-2026), not 2021-2022 (decline is structural)
  - ⚠️ After the dedupe fix re-imports finish, the old peak records (e.g. 673 GWh wind on 15 Jun 2022) will be replaced. Any record that still shows a 2022 date is suspect until verified.

### 🟠 Should-check (UX)

- [ ] **Tab scrollbar fix** — open Energy Mix on a narrow viewport (or iPhone). No horizontal scrollbar should appear overlapping the tab row. First line of instruction text under each tab should be fully visible.

- [ ] **YTD Comparison tab interactivity** — switch scopes (NEM/NSW/QLD/VIC), year pills, YTD↔Full toggle. Year-over-year table should update. Station breakdown chart should update.

- [ ] **Transition Scoreboard controls** — Scope (NEM + 5 states), Window toggle. Storyline chips adjust per scope. BESS chip may be absent for states with no BESS activity before 2024.

- [ ] **Records board text** — dates render in DD MMM YYYY format (en-AU). Peak demand entry shows a "sum of regional 5-min peaks" caveat note.

- [ ] **Guides index** — `/guides` should show:
  - "New" green badge on **Energy Transition Scoreboard** guide
  - "Updated" blue badge on **Coal Outage vs Dispatch Erosion** guide (v2.29 YTD tab added to that guide)
  - Every guide shows "Added DD MMM YYYY" or "Updated DD MMM YYYY" under the reading time

- [ ] **Guide reader** — open any individual guide. Header row should include the date stamp next to reading time.

### 🟡 Nice-to-check (polish)

- [ ] **Storyline chip fallback** — when a fuel tech has sparse data (e.g. BESS in SA), the chip should either show a partial year pair or not appear. Shouldn't ever show "-100%" spurious change.

- [ ] **Demand peak caveat** — the NEM demand_peak entry explicitly states "sum of regional 5-min peaks — may overstate concurrent NEM peak". Accuracy guardrail.

- [ ] **2026 data gap** — gen_daily / demand only have data through what AEMO has published (currently through ~Feb 2026 for MMSDM). The scoreboard should render 2026 gracefully, not show it as "zeros".

### 🟢 Backend / plumbing (skip unless debugging)

- [ ] **Importer dedupe** — `pipeline/importers/import_generation_daily.py` and `import_dispatch_regionsum.py` now dedupe by `(SETTLEMENTDATE, DUID)` before summing. Without this, MMSDM revision rows inflated totals by 2-6× on days with interventions. Coal data was fine because `import_dispatchload.py` uses `INSERT OR IGNORE` with a UNIQUE constraint.

- [ ] **MMSDM filename format** — `import_dispatchload.py` now tries both `PUBLIC_ARCHIVE#DISPATCHLOAD#FILE01#...` (Aug 2024+) and `PUBLIC_DVD_DISPATCHLOAD_...` (legacy) formats. Any month older than Aug 2024 will download via the legacy URL; anything from Aug 2024 onward needs the new format.

- [ ] **Cached zips** — `data/nemweb_cache/` now has ~3 GB of zips (60 months × DISPATCHLOAD + DISPATCHREGIONSUM). This is gitignored. Not a problem unless disk space is tight.

---

## Known issues to follow up

1. **2026 data gap** — MMSDM archives take ~45 days to publish. 2026-03 and 2026-04 won't be available in the scoreboard until around mid-May / mid-June 2026.
2. **CIS Wind Pipeline filter** (original v2.29 scope per handoff) — deferred. Still queued in NEXT_SESSION_HANDOFF.md.
3. **2026 coal data only partial** — coal dispatch is Jan-Apr 2026 (from Current/Next_Day_Dispatch daily files). Solar/wind/BESS 2026 is Jan-Feb only until next MMSDM drop.

---

## Files changed — by layer

### Pipeline
- `pipeline/importers/import_dispatchload.py` — added fallback URL format, added dedupe-aware helper
- `pipeline/importers/import_generation_daily.py` *(new)* — solar / wind / BESS daily importer
- `pipeline/importers/import_dispatch_regionsum.py` *(new)* — demand daily importer
- `pipeline/scripts/backfill_coal_history.sh` *(new)* — 5-year coal MMSDM bulk backfill
- `pipeline/exporters/export_json.py` — added `export_coal_ytd_comparison()` and `export_energy_transition()`

### Frontend
- `frontend/src/components/intelligence/CoalWatch.tsx` — added YTD Comparison section
- `frontend/src/components/intelligence/EnergyTransition.tsx` *(new)* — Scoreboard component
- `frontend/src/pages/intelligence/EnergyMix.tsx` — new tab + tab-bar scrollbar fix
- `frontend/src/lib/dataService.ts` — added `fetchCoalYtdComparison()` and `fetchEnergyTransition()`
- `frontend/src/lib/dataSources.ts` — added `nemweb_dispatchload` to energy-mix page sources
- `frontend/src/data/guides.ts` — added `added` / `updated` fields; new Energy Transition Scoreboard guide; YTD addendum on Coal Outage guide
- `frontend/src/pages/Guides.tsx` — renders New / Updated badge + date stamp
- `frontend/src/pages/GuideReader.tsx` — date stamp in guide header

### Database schema
- **new:** `generation_daily` table — `(date, duid, fuel_type, region, gen_mwh, charge_mwh, interval_count)`
- **new:** `demand_daily` table — `(date, region, demand_mwh, peak_demand_mw, interval_count)`
- **populated:** `dispatch_availability` now ~24M rows (Jan 2021 → Apr 2026)

### JSON outputs
- **new:** `frontend/public/data/analytics/intelligence/coal-ytd-comparison.json`
- **new:** `frontend/public/data/analytics/intelligence/energy-transition.json`

---

## Release cadence

| Version | Status | Headline |
|---|---|---|
| v2.29.0 | ✅ shipped | YTD Comparison UI with graceful-degrade (1 year of data) |
| v2.29.1 | ✅ shipped | YTD Comparison populated with 5 years of MMSDM-backfilled coal |
| v2.30.0 | ⏳ pending (this session) | Energy Transition Scoreboard — coal vs wind/solar/BESS + demand + records |

---

## Where to start your review

1. Open [`/intelligence/energy-mix`](https://travis-coder712.github.io/aures-db/#/intelligence/energy-mix) on your phone
2. Click **Transition Scoreboard** → read the storyline chips → compare the NEM stacked chart to expectations
3. Click **NSW** scope → the Liddell-retirement narrative should be visible in the numbers
4. Switch to **Coal Watch** → **YTD Comparison** → verify prior-year coal numbers look right
5. Open [`/guides`](https://travis-coder712.github.io/aures-db/#/guides) — the **Energy Transition Scoreboard** guide should show the NEW badge; **Coal Outage vs Dispatch** should show UPDATED
6. Read both guides end-to-end — they're the source of truth for methodology and should match what you see in the UI

---

**If anything looks off, flag it and we'll iterate.**
