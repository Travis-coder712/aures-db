---
title: "PLAN — Comprehensive CIS + LTESA Data Update Project"
subtitle: "3-phase execution to bring CISA/FID/construction status current across all ~130 CIS+LTESA winners"
prepared: "2026-07-16"
status: "planning / not yet started"
scope: "multi-session — estimated 2-3 sessions across ~4 weeks"
depends_on: "AURES v3.18.5 baseline (58 awarded / 15 FID / 21 construction / 7 operating)"
---

# Comprehensive CIS + LTESA Data Update — Execution Plan

## Why this project exists

The v3.18.5 project-status verification (2026-06-27) established a baseline for 130 CIS+LTESA winners: 58 awarded / 15 FID / 21 construction / 7 operating. That baseline is now ~4 weeks stale. During the CIS T9 competitive-field research (v3.21.1, 2026-07-16), material status changes surfaced:

- **Palmer Wind (Tilt SA)**: FID 9 Jan 2026 with 15-yr AGL PPA → construction — was `development` in AURES
- **Bell Bay Wind (Equis TAS)**: T4 CISA holder but missing `scheme_contracts` entry entirely
- **Whyte Yarcowie (SA)**: proponent stale (WP Renewables → EDF Renewables Australia post-T7)
- **Barn Hill Wind (SA)**: capacity 186→300 MW; owner AGL (since 2009) not `Barn Hill WF Pty Ltd` SPV

If four material corrections surface in a single T9-adjacent research pass, the population of stale records across the full ~130 CIS+LTESA cohort is likely much larger. And the Nov 2026 T9 results will need a current baseline for meaningful comparison.

**Bowen has stated winners cannot alter CISA terms — but the CIS T9 Q&A Item 8 (July 2026) formalises the withdraw-and-resubmit pathway with heavy machinery** (formal written notification + AEMO track-record discretion + Significant Event obligations). This makes CISA execution status a first-class data question, not just a project-lifecycle datum.

## Scope

**In scope**:
- All CIS Pilot + T1 + T3 + T4 + T7 + T8 winners (across NEM + WEM)
- All LTESA Round 1 + 2 + 3 + 4 + 5 + 6 + 7 winners
- Per-project verification of: CISA execution status, FID status, construction status, current developer, PPA disclosure (if public), Notable events (withdrawal, sale, capex adjustment)
- Schema extension: `scheme_contracts[]` entries to include `execution_status`, `execution_date`, `fid_date`, `execution_notes`
- Cross-check against `contract_status` field on SchemeProject in `frontend/src/data/scheme-rounds.ts`

**Out of scope** (defer to separate work):
- T9 winners (round hasn't completed — Nov 2026 results)
- T10 winners (round hasn't completed)
- Non-CIS-linked project status updates (already covered by monthly AEMO Gen Info import)
- Retrospective updates to news_articles / trade_press citations older than 6 months

## 3-Phase Execution Plan

### Phase 1 — CIS T1 non-NSW winners (12 projects, ~18 months old)

**Why first**: Most stale (Dec 2024 award), most likely to show CISA-execution shifts, most public commentary available.

**Projects** (per v3.21.1 research):
- Kentbruck Wind (VIC 600 MW, HMC ex-Neoen) — **known stalled**
- Goyder North Stage 1 (SA 300 MW, Neoen)
- Palmer Wind (SA 274 MW, Tilt) — **known at construction post-FID Jan 2026**
- Hopeland Solar (QLD 250 MW, ACS)
- West Mokoan (VIC 300 MW + 560 MWh, Lightsource bp)
- Barwon (VIC 250 MW + 500 MWh, Elgin/CIP)
- Elaine (VIC 125 MW + 250 MWh, Elgin)
- Barnawartha (VIC 64 MW + 138.8 MWh, Gentari)
- Majors Creek (QLD 150 MW + 600 MWh, Edify)
- Ganymirra (QLD 150 MW + 600 MWh, Edify)
- Campbells Forest Solar (VIC 205 MW, Risen Energy)
- Mokoan Solar (VIC 46 MW, European Energy)

**Data sources**:
- ASL tender pages: `https://asl.org.au/tenders/` (403 gotcha — may need manual)
- DCCEEW media releases: minister.dcceew.gov.au
- CER quarterly CIS reporting: cleanenergyregulator.gov.au
- RE, PV mag AU, energy-storage.news, Modo Energy (paywalled)
- Developer IR pages: HMC Capital, Neoen, Tilt Renewables, Lightsource bp, Elgin/CIP, Gentari, Edify Energy, Risen Energy, European Energy Australia

**Deliverables**:
- 12 overlay JSON updates (`data/projects/<tech>/<id>.json` — extend `scheme_contracts[]` entries)
- Extended overlay schema: add `execution_status`, `execution_date`, `fid_date`, `execution_notes` fields
- Update `contract_status` field in `CIS_PROJECTS` array in `frontend/src/data/scheme-rounds.ts`
- Release: `v3.22.0 — CIS T1 non-NSW winner status refresh`

**Estimated effort**: 1 focused agent-sweep session (~2-3 hrs elapsed inc. agent runtime + synthesis + overlay writes + verification).

### Phase 2 — CIS T4 non-NSW winners (14 projects, ~10 months old)

**Why next**: Second-oldest cohort. Some (Carmody's Hill, Willogoleche 2) are known to be at/near FID; others (Hexham AGL) publicly stated 2028 FID horizon.

**Projects** (per v3.21.1 research):
- Bell Bay Wind (TAS 224 MW, Equis) — **overlay MISSING scheme_contracts (data gap surfaced v3.21.1)**
- Carmody's Hill Wind (SA 247 MW, Aula)
- Gawara Baya Wind + BESS (QLD 399 MW + 217 MWh, Windlab)
- Hexham Wind (VIC 600 MW, AGL) — **2028 FID horizon per AGL public statement**
- Moah Creek Wind (QLD 360 MW, CQP)
- Willogoleche 2 (SA 108 MW, ENGIE + Foresight)
- Bundey BESS + Solar (SA 240 MW + 1200 MWh, Genaspi)
- Corop SF + BESS (VIC 230 MW + 704 MWh, BNRG Leeson)
- Guthrie's Gap Solar (QLD 300 MW + 1200 MWh, Edify)
- Lower Wonga Solar (QLD 281 MW, Lightsource bp)
- Nowingi Solar (VIC 300 MW + 1200 MWh, Edify)
- Punchs Creek Solar (QLD 400 MW + 1600 MWh, EDPR)
- Smoky Creek Solar (QLD 300 MW + 1200 MWh, Edify)
- Derby Solar + BESS (VIC 95 MW)

**Data sources**: same as Phase 1 + Bowen 24 June 2026 press conference transcript.

**Deliverables**: 14 overlay updates + `CIS_PROJECTS` array updates. Release: `v3.22.1 — CIS T4 non-NSW winner status refresh`.

**Estimated effort**: 1 session.

### Phase 3 — CIS T7 winners (19 projects, ~2 months old)

**Why last**: Just-awarded (May 2026). Mostly pre-CISA. But by the time we execute (~4-6 weeks from now), some early-mover T7 winners may have executed CISAs and be worth tracking.

**Projects** (partial list from v3.21.1 research):
- Bungaban Wind + BESS (QLD 1,150 MW + 1,400 MWh, Windlab)
- Theodore Wind + BESS (QLD 1,022 MW, RWE)
- Cellars Hill Wind (TAS 341 MW, Gamuda + Alternate Path)
- Willatook Wind (VIC 338 MW, ENGIE)
- Whyte Yarcowie Wind (SA 289 MW, EDF) — **AURES proponent field stale (v3.21.1 flagged)**
- Banana Range Wind (QLD 228 MW, EDF)
- Woolsthorpe Wind (VIC 72 MW, ICA Partners)
- Weasel Solar (TAS 200 MW, Gamuda + Alternate Path)
- Moranbah Solar + BESS (QLD 171 MW + 100 MWh, Zero-E/Grupo Cobra)
- Bullyard Solar (QLD 97 MW, European Energy)
- Plus 9 NSW winners covered by existing AURES CIS_PROJECTS array
- Plus any hybrid/BESS winners not yet identified

**Deliverables**: 19 overlay updates + `CIS_PROJECTS` array extension. Release: `v3.22.2 — CIS T7 status refresh`.

**Estimated effort**: 1 session (may run in parallel with Phase 2 if agent bandwidth allows).

### Phase 4 (optional) — Extend `CIS_PROJECTS` array to be non-NSW-inclusive

**Current state**: `CIS_PROJECTS` in `frontend/src/data/scheme-rounds.ts` has 9 entries, all NSW. My v3.21.1 research surfaced 35 non-NSW CIS-locked projects. The frontend UI (CIS Success tab, Pipeline Overview funnel) materially under-represents the actual CIS outcome.

**Deliverable**: Extend `CIS_PROJECTS` array with 35 non-NSW winners (structure matches existing NSW entries — proponent, scheme, awarded_mw, total_mw, technology, stage_label, rez, planning_status, fid_year, fid_status, connection_status, connection_notes, execution_risk, risk_rationale).

**Release**: `v3.22.3 — CIS_PROJECTS array non-NSW extension`.

**Estimated effort**: 1-2 sessions (mostly manual data-entry from Phase 1-3 sourced data).

## Schema Extension Proposal

Current `scheme_contracts[]` entry structure:
```json
{
  "scheme": "CIS",
  "round": "Tender 4 — NEM Generation",
  "capacity_mw": 247,
  "storage_mwh": null,
  "source_url": "https://www.dcceew.gov.au/...",
  "contract_type": "CISA (federal underwriting)"
}
```

Proposed extension:
```json
{
  "scheme": "CIS",
  "round": "Tender 4 — NEM Generation",
  "capacity_mw": 247,
  "storage_mwh": null,
  "source_url": "https://www.dcceew.gov.au/...",
  "contract_type": "CISA (federal underwriting)",
  "award_date": "2025-10-09",
  "execution_status": "awarded" | "cisa_signed" | "fid" | "construction" | "operating" | "withdrawn" | "lapsed",
  "execution_date": "2026-01-09",
  "fid_date": "2026-01-09",
  "execution_notes": "FID reached with 15-yr AGL PPA; construction commenced mid-2026",
  "execution_source_url": "https://energyglobal.com/wind/09012026/tilt-renewables-approves-palmer-wind-farm-for-construction-in-2026/"
}
```

This extends existing structure additively (no breaking change). Existing overlays without these fields default to `execution_status: 'awarded'` in the UI.

## Data-Sourcing Checklist per Project

For each project, verify from at least 2 independent sources:
- [ ] Award date + round + capacity confirmed against primary source (DCCEEW media release preferred)
- [ ] Current execution status (per the enum above)
- [ ] FID date if reached (developer press release, RE reporting, CER quarterly)
- [ ] Withdrawal / lapse if public (Bowen commentary, ASL notification, developer statement)
- [ ] PPA disclosure if public (for gentailer offtake pattern analysis)
- [ ] Notable events (capex adjustment, ownership change, planning outcome)

Flag every entry with `data_confidence` and `last_verified` — do not silently promote uncertain status.

## Agent Brief Template (per phase)

```
Research task: verify CISA execution + FID status for the following [ROUND] non-[STATE] winners:

[List of projects with award MW + proponent]

For each project, produce:
- current execution_status (from enum: awarded | cisa_signed | fid | construction | operating | withdrawn | lapsed)
- FID date if reached (dd-mm-yyyy)
- Source URL + date supporting the status determination
- Any notable events since award (withdrawal, ownership change, capex adjustment, PPA disclosure)

Primary sources to try in order:
1. DCCEEW ministerial media release for the specific round
2. ASL tender page (403 gotcha — may need manual)
3. CER quarterly CIS project reporting
4. Developer investor-relations / press-release page
5. Trade press (RE, PV mag AU, energy-storage.news, WattClarity)

Return per-project rows in a table. Flag any UNVERIFIED items explicitly.
```

## Verification Loop

For each phase completion:
1. Cross-check per-project status against the `contract_status` field in `CIS_PROJECTS` array
2. Cross-check FID dates against `battery_daily_scada` / `performance_monthly` where applicable (operating projects should be generating)
3. Re-run mega-exporter — confirm no unintended regressions
4. tsc + build clean
5. Version bump (both files) + release log entry
6. Hold for commit approval per project rule
7. Update `docs/NEXT_SESSION_HANDOFF.md` with phase-completion state

## Success Criteria

By project completion (v3.22.3):
- All ~130 CIS + LTESA winners have current `execution_status` recorded in overlays
- ≥95% of statuses have primary-source citation (DCCEEW or developer IR)
- `CIS_PROJECTS` array in scheme-rounds.ts covers non-NSW winners → SchemeTracker Pipeline Overview funnel reflects actual CIS outcome
- Baseline established for tracking T9 results (Nov 2026) and T10 results (2027)
- New research note: `CIS Delivery-Crisis Update — Post v3.22 Baseline` published to Research Notes

## Risks + Mitigations

**Risk 1 — ASL 403 gotcha persists**: WebFetch returns 403 for asl.org.au. Mitigation: manual browser access for critical projects; archive.org cached versions; developer press releases as substitute primary source.

**Risk 2 — CISA execution status is commercially confidential**: Many proponents don't publicly disclose CISA execution status. Mitigation: use "AWARDED PRE-CISA" as default for projects without positive execution evidence; do not infer execution from planning progress alone.

**Risk 3 — Scope creep**: Adding T9 and T10 winners as they're announced could double the workload. Mitigation: this plan explicitly scopes T9/T10 out; separate release cycle when those rounds complete.

**Risk 4 — Trade-press inaccuracy**: pv-tech and RE sometimes misattribute proponents (Whyte Yarcowie WP-vs-EDF example). Mitigation: require ≥2 independent sources; flag single-source items as UNVERIFIED.

## Not-in-scope reminders

- No changes to importer scripts (this is manual overlay curation)
- No changes to database schema (all changes are within the overlay JSON structure)
- No mega-exporter changes (overlay fields already flow through if in OVERLAY_OVERRIDE_FIELDS — verify `scheme_contracts` is included at `pipeline/exporters/export_json.py:40`)
- No breaking changes to existing frontend components (schema extension is additive)

## Estimated Total Effort

3 phases + optional Phase 4 = 4-6 focused sessions across 3-4 weeks. Approx 12-18 hrs of focused work if agent-runtime is included. Deliverables: 4 releases (v3.22.0 → v3.22.3), 1 new research note, updated NEXT_SESSION_HANDOFF, updated CIS_PROJECTS array with 35+ non-NSW entries.

## When to Start

**Recommended trigger**: After the BESS sleeper story note ships (this session, v3.21.4). The BESS sleeper story shows the same delivery-crisis analytical framework applied to storage — the comprehensive data update will then let us maintain that analytical view on live data going forward.

---

*End of plan. Ready to execute when scoped.*
