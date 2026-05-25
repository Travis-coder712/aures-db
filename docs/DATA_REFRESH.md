# AURES Data Refresh Runbook

The canonical list of importers that should run as part of every regular data
refresh, plus their public-source URLs, cadence, and what they update.

Run order: **importers → validators → mega-exporter → version bump**.

The "Never downgrade status" pipeline-data-protection rule applies throughout —
every importer uses `COALESCE(NULLIF(field, ''), ?)` or equivalent so that
hand-curated values, scheme contracts, and stakeholder narratives are
preserved across runs.

---

## Importers (in suggested run order)

### 1. News articles
**Script:** `pipeline/importers/import_news_articles.py`
**Sources:** RenewEconomy, PV Magazine Australia, Energy Storage News
**Cadence:** Daily — feeds the latest-news intelligence
**What it updates:** `news_articles` table
**Notes:** Idempotent — dedupes by URL.

### 2. AEMO Generator Information (monthly Excel)
**Script:** `pipeline/importers/import_aemo_gen_info.py`
**Source:** [`nem-generation-information-{month}-{year}.xlsx`](https://www.aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information)
**Cadence:** Monthly (AEMO publishes ~1st of each month)
**What it updates:**
- `aemo_generation_info` table (one row per DUID-month snapshot)
- `projects.connection_status` (operating / commissioning / committed / anticipated / proposed) — derived from per-DUID AEMO Status via `CONNECTION_STATUS_MAP` (added in v3.11.0)
- `projects.status`, `capacity_mw`, `storage_mwh` where AEMO confirms an upgrade (never a downgrade — protected by `STATUS_PRIORITY` ordering)

### 3. AEMO IASR Workbook *(added v3.12.0)*
**Script:** `pipeline/importers/import_aemo_iasr.py`
**Source:** [`2025-inputs-and-assumptions-workbook.xlsx`](https://www.aemo.com.au/-/media/files/stakeholder_consultation/consultations/nem-consultations/2024/2025-iasr-scenarios/final-docs/2025-inputs-and-assumptions-workbook.xlsx) (17 MB, 83 sheets)
**Cadence:** Annual (final IASR — August), with Draft IASR cycles in Dec/Feb supporting each ISP
**What it updates:**
- `aemo_iasr_projects` table — per-project rows for Committed / Anticipated / Additional policy-supported projects (146 entries in the 2025 IASR)
- `projects.rez` — backfilled from IASR's `REZ Location` column where currently NULL (added 61 REZ assignments at first run). COALESCE protected.
**Key added value vs the monthly Gen Info Excel:** REZ Location + REZ ID per project (Wagga Wagga / N5, Central-West Orana / N3, etc.) — the monthly Gen Info Excel does NOT expose REZ assignment.

### 4. EnergyCo NSW REZ Access Rights Register *(added v3.12.0)*
**Script:** `pipeline/importers/import_energyco_rez_access.py`
**Source:** [`access-rights-register.xlsx`](https://www.energyco.nsw.gov.au/sites/default/files/2025-04/access-rights-register.xlsx)
**Cadence:** As-updated by EnergyCo (no fixed period — typically after new REZ allocation rounds or status changes). Re-run as part of every refresh — cheap (~66 KB file, 19 rows).
**What it updates:**
- `energyco_rez_access` table — one row per access right (CWO + SW REZ schemes; 19 entries / 10.71 GW at v3.12.0)
- `projects.rez_access_status` / `rez_access_mw` / `rez_access_date` / `rez_access_scheme` — aggregated per project
- `timeline_events` — one `rez_access` event per access right, deduped by access_right_id

### 5. Open Electricity performance (monthly)
**Script:** `pipeline/importers/import_oe_performance.py`
**Source:** [Open Electricity API](https://api.openelectricity.org.au/)
**Cadence:** Monthly — typically the 5th of each month for the previous month's settled data
**What it updates:**
- `performance_monthly` — operating projects' generation, revenue, capacity factor

### 6. AEMO MMSDM dispatch + bidding
**Scripts:** `import_dispatchload.py`, `import_dispatchprice.py`, `import_dispatch_regionsum.py`, `import_bess_5min.py`
**Source:** [AEMO MMSDM archive](https://nemweb.com.au/Reports/Archive/MMSDM/) (publishes ~45-day lag)
**Cadence:** Monthly — second week, for the month two months prior (May data lands mid-July)
**What it updates:**
- `dispatch_load_daily`, `dispatch_price_daily`, `generation_daily`, `battery_daily_scada`, `bess_5min_bids`

### 7. EPBC referrals
**Script:** `pipeline/importers/import_epbc.py`
**Source:** [DCCEEW EPBC referrals](https://epbcpublicportal.environment.gov.au/)
**Cadence:** Weekly (DCCEEW updates rolling)
**What it updates:** `epbc_referrals` table; sets `development_stage` to `epbc_submitted` / `epbc_approved` where applicable

---

## Validators (run after importers, before exporter)

### `pipeline/validators/validate_status.py`
Cross-checks `projects.status` against `cod_current` to surface near-COD
construction projects that may have crossed into commissioning/operating.
Outputs are informational by default; pass `--fix` to apply.

---

## Exporter (always last)

### `pipeline/exporters/export_json.py`
Regenerates **all** frontend JSONs (per-project + analytics + indexes). Run
after every refresh so the frontend catches up.

The `OVERLAY_OVERRIDE_FIELDS` frozenset (line 40) controls which fields a
manual overlay at `data/projects/<tech>/<id>.json` should override over the
DB-exported value. Currently includes: narrative · stakeholder issues ·
sources · timeline events · capex · scheme contracts · **connection status**
(v3.11.0) · **REZ access** (v3.12.0).

---

## Version bump + ship checklist

After a refresh that meaningfully changes what users see:

1. **Both version files MUST bump in sync:**
   - `frontend/package.json`
   - `frontend/public/data/metadata/version.json`
   (The useVersion hook polls the JSON every 5 min and surfaces the PWA refresh badge.)
2. Release log entry in `docs/INTELLIGENCE_LAYER_PLAN.md` under "Recent notable releases".
3. Refresh `docs/NEXT_SESSION_HANDOFF.md` if state has materially shifted.
4. `cd frontend && npx tsc -b && npm run build` — local build, CI is stricter than `vite build`.
5. Commit + push only when Travis explicitly asks.

---

## What's still manual (commercial-in-confidence)

The granular **TNSP connection process stages** (Transgrid 5.3.4 enquiry /
5.3.5 application / 5.3.6 offer / GPSA executed; Powerlink Connection
Pipeline; ElectraNet enquiry stages) are NOT publicly published — they live
between TNSP and proponent. We capture what we can from public sources:

- AEMO Gen Info Status (operating / committed / anticipated / proposed)
- AEMO IASR Workbook (Existing / Committed / Anticipated / Additional policy-supported)
- EnergyCo REZ Access Rights Register (NSW REZ-allocated capacity)
- News + press releases + EnergyCo announcements (manual overlay refinement)

Hand-curated TNSP refinements live in `data/projects/<tech>/<id>.json`
overlay files under `connection_notes` / `rez_access_notes` and survive
re-exports via `OVERLAY_OVERRIDE_FIELDS`.

---

## Upcoming sources (not yet automated)

- **VicGrid quarterly connection updates** — VicGrid took over AEMO's
  Victorian planning role on 1 Nov 2025. Publishes connection process
  register. Would refine VIC project granularity.
- **NSW IPC planning approval register** — gives planning-stage granularity
  (epbc_approved vs awaiting IPC).
- **DCCEEW Major Projects List** — federal-level commitment tracker.
- **EnergyCo Tablelands REZ register** — when/if declared.

These would be Phase 2/3 additions following the v3.12.0 baseline.
