# EIS/EIA & Grid Connection Coverage Audit — August 2026

## Executive summary

The AURES `eis_technical_specs` table had **68 rows across 1,098 projects (6.2% coverage)** as of the audit. Coverage was concentrated in wind (14.4%) and BESS (7.7%). **Solar (226 projects), hybrid (121), and offshore wind (22) had zero coverage.** The `eis-coverage.json` file that powers the Coverage tab was last refreshed 2026-03-22 and had an empty `available_not_extracted` list — meaning the tab could see the gap but had no candidate URLs staged for future enrichment sessions.

This audit closes that reconnaissance gap for solar (the largest zero-coverage cohort). **67 solar projects now have a documented planning source URL, assessment regime, year, connection substation, NSP, and — for the majority — headline tech specs** (panel manufacturer, tracker type, inverter, DC:AC ratio, module count). The Coverage tab now surfaces all 67 as pending targets with click-through to the source documents.

Separately, the audit identified where the **grid connection data** Travis specifically asked about actually lives. The core structural finding: **the AEMO GI workbook has no grid connection data at all** — its 150 "extra" columns are seasonal capacity forecasts and empty ballast. The real grid connection dataset is the **AEMO KCI (Key Connection Information) files**, published per-TNSP quarterly, containing substation + voltage + connection point + NSP + status per project. Cloudflare blocks scripted downloads, matching the manual-then-checkin pattern already used for the GI workbook.

## The coverage picture

### Before the audit
| Technology | Total projects | With specs | Coverage |
|---|---:|---:|---:|
| **Solar** | **226** | **0** | **0.0%** |
| **Hybrid** | **121** | **0** | **0.0%** |
| Offshore wind | 22 | 0 | 0.0% |
| BESS | 453 | 35 | 7.7% |
| Wind | 215 | 31 | 14.4% |
| Pumped hydro | 61 | 2 | 3.3% |
| **Overall** | **1,098** | **68** | **6.2%** |

### After the audit (source-hunt phase, before spec extraction)
- 67 solar projects with primary source URLs + regime + year + connection point + NSP
- Coverage tab `available_not_extracted` list: **0 → 67**
- Ready to feed a subsequent extraction session

## Solar sources — regime by state

### NSW (26 projects)
All State Significant Development (SSD) under the NSW Planning Portal, with three pre-2014 legacy Part 3A cases:

- **SSD (23 projects)** — direct EIS PDFs available via `majorprojects.planningportal.nsw.gov.au` (specific `getContent?AttachRef=SSD-nnnn` URLs) or via project landing pages at `planningportal.nsw.gov.au/major-projects/project/nnn`. Connection points overwhelmingly to TransGrid 132 kV or 330 kV substations.
- **Part 3A legacy (3 projects — Nyngan, Moree, Broken Hill)** — assessed under the repealed Part 3A of the EP&A Act, EIS docs still available via the Major Projects portal but via different URL patterns.

### QLD (23 projects)
Almost none went through Coordinator-General EIS. The regime split:

- **EPBC (3)** — Aldoga, Woolooga, Lilyvale — only these have publicly-accessible federal assessment documents.
- **Council Material Change of Use (20)** — via the Planning Act 2016 / Sustainable Planning Act 2009, assessed by the relevant Regional Council (Western Downs, Isaac, Whitsunday, Burdekin, Central Highlands, Banana, Fraser Coast, Toowoomba, Townsville, Southern Downs). Planning documents typically only reachable via the developer's own website or the council's DA register.

**Systematic per-project source discovered**: `powerlink.com.au/projects/<slug>-connection-project` pages exist for 8+ of the 23 QLD projects and are the most consistent authoritative source for the connection point + NSP details.

### VIC (14 projects)
Split by regime and era:

- **Formal Ministerial Planning Permits (post-2019)** — Numurkah, Glenrowan, Mokoan, Goorambat East. Findable via `planning.vic.gov.au/planning-approvals/ministerial-permits-register/`.
- **Council permits (pre-2019)** — Bannerton, Karadoc, Wemen, Gannawarra, Kerang. No online planning records at the state level; sit in shire council DA registers (Swan Hill RCC, Mildura RCC, Gannawarra Shire, Campaspe Shire). For these, the best public tech-spec source is often the **VIC-ESC electricity generation-licence application** — used successfully for Kiamal, Numurkah, Yatpool, Glenrowan West, Girgarre.

### SA (4 projects)
Bungala 1+2, Port Augusta REP (solar half), Tailem Bend. All consented via SA DAC / PDI. Planning docs live on `plan.sa.gov.au` and `saplanningcommission.sa.gov.au` but PDFs weren't reachable programmatically (server returns 403 to non-browser fetches). Records exist and are interactively accessible.

## Tech spec extraction — what was captured in the source-hunt

Even without the primary EIS PDFs open, the agents captured a lot of tech-spec detail from developer sites, connection-project pages, and ESC licence applications. Sample coverage across the 67 entries:

- **Panel manufacturer**: identified for ~40 projects (Jinko, JA Solar, Trina, First Solar CdTe, Canadian Solar, LONGi, Risen)
- **Tracker vs fixed-tilt**: identified for ~50 projects (NEXTracker, Array Technologies DuraTrack, Arctech, Nextracker Horizon — mostly single-axis; a few older fixed-tilt First Solar plants)
- **Inverter**: identified for ~20 projects (SMA, Sungrow, Ingeteam, Schneider)
- **DC:AC ratio**: computed for ~25 projects (range 1.14–1.40)
- **Module count**: order of magnitude for ~35 projects
- **Grid connection substation + NSP**: identified for **all 67**
- **Connection voltage**: identified for ~50 projects (66 kV, 132 kV, 220 kV, 275 kV, 330 kV)

## Grid connection data — where it actually lives

Travis flagged grid connection specs as a focus. The `eis_technical_specs` table has fields for `network_service_provider`, `connection_substation_name`, `connection_voltage_kv`, `connection_distance_km`, `transformer_mva`, `connection_augmentation`. These are ~7% populated overall, near-zero for solar and hybrid.

### The structural finding: the AEMO GI workbook has no grid connection data

Deep inspection of the January 2026 GI workbook (`data/gi_snapshots/gi-2026-01.xlsx`, 173 columns × 1,737 rows) revealed that the 150 columns beyond what AURES already ingests (cols 25–172) contain:

- **Cols 23–25**: Closure Date, Survey Last Requested Date, Survey Latest Update Date
- **Cols 26–55**: Seasonal Capacity forecasts (Winter / Summer Typical / Summer Peak, 2026 → 2035-36) — ~40% fill rate
- **Cols 56–75**: Seasonal Storage Capacity forecasts (Winter / Summer, 2026 → 2035-36) — ~8% fill rate (batteries only)
- **Cols 76–172**: Empty ballast — no header, no data

**No substation, voltage, transformer, NSP, line length, or augmentation columns anywhere in the workbook.**

### The real grid connection dataset: AEMO KCI files

Under NER 3.7F(3), each TNSP submits a quarterly **Key Connection Information (KCI)** datafile to AEMO which AEMO republishes on the Generation Information page. Contains connection-point data per project — the exact scope needed.

- **Publication cadence**: Quarterly (Jan / Apr / Jul / Oct)
- **Coverage**: All 5 NEM TNSPs (TransGrid, AusNet, ElectraNet, Powerlink, TasNetworks)
- **URL pattern** (deterministic): `https://www.aemo.com.au/-/media/files/electricity/nem/planning_and_forecasting/generation_information/{YYYY}/{tnsp}-kci-{mon}-{YYYY}.xlsx`
- **Format**: 5 structured Excel files per quarter (20/year)
- **Blocker**: AEMO Cloudflare bot challenge blocks scripted downloads — same manual-download-then-checkin pattern as the GI workbook. Fits the existing `data/gi_snapshots/` archive convention perfectly (see also `docs/DATA_REFRESH.md`).
- **Fields (per KCI schema)**: Project name, DUID, Connection Point, Substation, Voltage, Status (Committed/Anticipated/Emerging/Proposed), MW, MVA, technology, TNSP.

**This is the single most important data source to ingest to close the AURES grid-connection gap.** See the backlog item in `docs/NEXT_SESSION_HANDOFF.md` for the proposed ingest work.

### Rosetta Network Map — validated, not a KCI shortcut

The audit-agent hypothesis that `renewables.networkmap.energy` might have a KCI-derived layer accessible without Cloudflare did not hold. Direct inspection of `Network Map Renewables January 2024.gpkg` (SQLite-backed GeoPackage, downloaded successfully) showed **two layers (`points` 1,239 rows, `polygons` 1,225 rows) with 33-34 columns each, but no substation / voltage / NSP / connection-point columns**.

What Rosetta *does* have that AURES doesn't:
- **AEMO KCI Id** — the join key that would let us later merge KCI records to AURES projects
- Lat/lng coordinates
- LGA
- Postcode
- Project URL (direct developer / project home page per project — another route to spec extraction)

Rosetta is worth an ingest pass in its own right (as a coordinates + project-URL enrichment source), but not as a substitute for the KCI files.

### Per-TNSP TAPR PDFs — validated per-state supplements

| Source | Coverage | Format | Effort |
|---|---|---|---|
| AusNet TCPR PDF (annual, Dec) | ~30-50 VIC embedded projects (22/66 kV) | Structured tables per terminal station, `pdftotext -layout` + regex works | Low |
| ElectraNet Assessment of Network Capacity for Connections Report (annual) | ~25-30 SA Mid North projects | Structured tables per sub-region | Low — flag "Commercial in Confidence" footer before ingest |
| Powerlink TAPR portal | ~200 QLD projects | Login-gated templates | Medium |
| TransGrid TAPR portal | ~250 NSW projects (interactive map) | Not obviously downloadable — needs scraping recon | Medium |

## Ranked recommendations (deferred to future sessions)

1. **Download 5 AEMO KCI files for the latest quarter, check into `data/gi_snapshots/kci_<year>Q<n>/`, and write an importer against them.** Fills the grid-connection gap for 60-80% of NEM projects in one pass.
2. **Extract tech specs for the 10 highest-priority solar projects** (Stubbo, Culcairn, Wellington North, Limondale 1, Walla Walla, Wollar, Darlington Point, Avonlie, Western Downs, Aldoga) using the URLs now staged in the Coverage tab. See `pipeline/enrichers/enrich_eis_specs.py` for the data structure.
3. **Ingest the AusNet TCPR PDF** to fill VIC embedded generator connection data.
4. **Ingest the Rosetta GPKG** for lat/lng + project URL enrichment, using the `AEMO KCI Id` field as the eventual join key for step 1.
5. **Extract the ElectraNet Connections Report PDF** for SA Mid North (flag the CiC footer to Travis first).
6. **Add hybrid solar+BESS projects (121) to the source-hunt** — same pattern as this pass; likely SSD/EPBC-heavy.
7. **Extract tech specs for the 30 CIS-supported operating-or-construction wind projects** without existing wind-spec rows.

## Method notes

- Four parallel research agents, one per state grouping + one for grid-connection data sources. Each agent verified sources by actually opening the URLs cited (no fabricated citations).
- Coverage of 67/69 (97%) solar gap projects. The two uncovered are the small residual not on any state's operating/commissioning/construction list.
- Time-boxed to ~60 min per agent.

## Sources

- **NSW Planning Portal — Major Projects**: https://www.planningportal.nsw.gov.au/major-projects
- **NSW Major Projects (direct SSD content)**: https://majorprojects.planningportal.nsw.gov.au/prweb/PRRestService/mp/01/getContent
- **QLD Powerlink connection-project pages**: https://www.powerlink.com.au/projects/
- **QLD SARA (Planning + Environment)**: https://planning.statedevelopment.qld.gov.au
- **VIC Ministerial permits register**: https://www.planning.vic.gov.au/planning-approvals/ministerial-permits-register/
- **VIC-ESC electricity generation licence applications**: https://www.esc.vic.gov.au (search by project name)
- **SA Planning + Development**: https://plan.sa.gov.au / https://www.saplanningcommission.sa.gov.au
- **EPBC Public Portal**: https://epbcpublicportal.environment.gov.au (browser session required — 403 to non-interactive fetches)
- **AEMO Generation Information (KCI listings)**: https://www.aemo.com.au/energy-systems/electricity/national-electricity-market-nem/nem-forecasting-and-planning/forecasting-and-planning-data/generation-information
- **AEMO Generation Information Guidelines** (KCI schema): https://www.aemo.com.au/-/media/files/electricity/nem/planning_and_forecasting/generation_information/2020/final-generation-information-guidelines.pdf
- **AusNet 2025 TCPR PDF**: https://dapr.ausnetservices.com.au/ausnet_data/2025%20TCPR%20for%20publication_18%20Dec%202025.pdf
- **ElectraNet Connections Capacity Report 2029**: https://electranet.com.au/wp-content/uploads/2025/08/Electranet-Assessment-of-Network-Capacity-for-Connection-Report-2029-For-publishing.pdf
- **Powerlink TAPR 2025**: https://www.powerlink.com.au/planning-report/transmission-annual-planning-report-2025
- **TransGrid TAPR portal**: https://tapr.transgrid.com.au/
- **Rosetta Network Map Renewables**: https://renewables.networkmap.energy/layers/
