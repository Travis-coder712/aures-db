# AURES — Next Session Handoff

**Last refreshed:** 2026-07-19
**Latest shipped version:** v3.22.4 (Items C+D+E bundled: 4 data-gap records + T9 Lens 1 hardening + 8 COD-review candidates verified — this session pending commit) — prior: v3.22.3
**Purpose:** Single-place brief for the next session. Cold-readable — pair with `docs/SESSION_OPENER.md` and `docs/INTELLIGENCE_LAYER_PLAN.md`.

---

## Current state snapshot (v3.22.4)

### v3.22.4 — Items C + D + E bundled release (this session, pending commit)

**Item C — 4 CIS data-gap project records created**:
- Willogoleche 2 Wind Farm (T4 SA 108 MW ENGIE/Foresight) — enhanced existing stub overlay from `data_confidence: low` to `confirmed`
- Punchs Creek Renewable Energy Project (T4 QLD 400 MW + 1,600 MWh EDPR+QIC JV) — new consolidated record replaces stale multi-stage BESS entries
- Moranbah Solar Farm (T7 QLD 171 MW + 100 MWh Zero-E/Grupo Cobra) — new record; Grupo Cobra's first AU asset; Barada Barna Cultural Heritage agreement
- Cellars Hill Wind Farm (T7 TAS 341 MW Gamuda + Alternate Path JV) — new record; shares site + 220 kV connection with sister Weasel Solar
- CIS_PROJECTS array project_id fields updated for all 4

**Item D — CIS T9 Lens 1 hardening**:
- `docs/RESEARCH_CIS_T9_COMPETITIVE_FIELD.md` + `scheme-rounds.ts t9CompetitiveFieldDeepDive` updated to reflect CIS T9 Q&A Item 8 machinery (Jul 2026)
- Formal written withdrawal notification is now a prerequisite for re-entry (proponent cannot simply signal intent — must formally notify Commonwealth in writing)
- AEMO retains discretion to consider "track record of not executing binding commitments" — additional scoring penalty even for compliant withdrawals
- Withdrawal may constitute a Significant Event under Proforma CISA (formal notification + remediation plan + prevention strategy obligations + independent legal advice recommended)
- Aligns docs + in-app component with the newer `cis-rebid-restrictions-hardening` research note (2026-07-07)

**Item E — 8 COD-review candidates verified** (chip task_0ef34273 executed):
- **4 OPERATING** (upgraded from construction): Bundaberg Solar (Naturgy/GPG, cap 78→96 MW, 100% Telstra offtake), Lancaster Solar (European Energy, cap 80→108 MW, Apple PPA), Limondale BESS (RWE — Australia's first 8-hour LDS battery, full ops 27 May 2026), Munna Creek Solar (Metlen ex-Mytilineos, NBN Co 10-yr PPA)
- **4 COMMISSIONING** (still construction per AURES but AEMO lags reality): Golden Plains Wind Farm Stage 1 (TagEnergy/Ingka, combined project surpassed 1 GW output), Goorambat East Solar (ENGIE, first power injected Nov 2025), Gunsynd Solar (Progressive Renewables — UNVERIFIED past AEMO Nov 2025 registration), Wambo Wind Farm (Stanwell/Cubico JV — Stage 1 turbines powered up 2025, Stage 2 targeted end-2026)
- Proponent SPV→ultimate-parent corrections applied to Bundaberg, Lancaster, Munna Creek
- Chip already gone (didn't persist across app restart) but work is done

**Also this session — Research Notes cache-bust fix** (v3.22.3): Added `cache: 'no-cache'` to `fetchResearchNotes()` in `frontend/src/lib/dataService.ts` — forces browser + service worker to revalidate with server. New notes appear on first load after release without hard-refresh. Fixes the "notes not coming through" moment users hit after v3.21.4 shipped the BESS Sleeper Story note.

### v3.22.0–v3.22.3 — Backlog Item A executed + Research Notes fix (2026-07-16→2026-07-18)

### v3.22.0–v3.22.3 — Backlog Item A executed + Research Notes fix (2026-07-16→2026-07-18)

**Backlog Item A COMPLETE.** Three-phase CIS/LTESA data update project delivered across today's session:

- **v3.22.0** — Phase 1: CIS T1 non-NSW winner status refresh (12 projects, ~19 mo post-award). **~33% conversion rate**: 1 operating (Mokoan Solar — FC Mar 2024 pre-CIS), 1 construction (Palmer Wind — FID Jan 2026, 15-yr AGL PPA, first non-battery CIS to construction), 2 cisa_signed (Majors Creek + Ganymirra — Edify DT Infrastructure EPC Mar 2026), 8 awarded pre-FID. Meets Modo's 28% "zombie project" benchmark. Proponent corrections: Kentbruck (Neoen→HMC Capital→Illuma Energy), Goyder North (Brookfield-owned), Edify (La Caisse), Elgin (CIP), Hopeland (Pacific Partnerships), Barnawartha (Gentari), West Mokoan (Lightsource bp). Capacity corrections: Palmer 274→288 MW at FID, Mokoan 46→58 MW installed. Overlay schema extended with `execution_status`, `award_date`, `fid_date`, `execution_notes`, `execution_source_url` fields.

- **v3.22.1** — Phase 2: CIS T4 non-NSW winner status refresh (12 tractable + 2 data-gap flagged, ~9-10 mo post-award). **~29% conversion rate**: 3 CONSTRUCTION (Guthrie's Gap + Smoky Creek twin FC 20 May 2026 with **Rio Tinto 20-yr offtake anchor**; Lower Wonga FC + construction Jun 2026 INTEC/Gotion EPC), 1 FID/CONSTRUCTION (Carmody's Hill — FC Dec 2025, Snowy Hydro PPA, Aula 100% at FC), 1 CISA_SIGNED (Gawara Baya — Powerlink MID Jan 2026 "approaching FC"), 9 AWARDED. Corrections: Corop Solar acquired by OX2 from BNRG Leeson 8 Jul 2026, BESS scope revised 704→1,160 MWh; Hexham developer clarified AGL + Wind Prospect; Derby ultimate parent Sungrow (acquired ACEnergy Sep 2020); Nowingi BESS 1,200→2,400 MWh (Australia's largest DURATION BESS at 8-hour); Gawara Baya BESS 217 MWh REMOVED (unverified). Bungaban T7 status downgraded fid→awarded. Data gaps flagged: **Willogoleche 2** (T4 SA ENGIE+Foresight JV — needs separate record from operating Stage 1) and **Punchs Creek** (T4 QLD EDPR+QIC single project — needs consolidation of stale stage-2/3-kci records).

- **v3.22.2** — Phase 3: CIS T7 non-NSW winner status refresh (8 tractable + 2 data-gap flagged, ~2 mo post-award). **All 10 correctly at `awarded`** at 2 months — consistent with typical CISA negotiation timeline. **CRITICAL CORRECTION**: Bungaban Wind AURES `contract_status: fid` was WRONG — Rio Tinto PPA (Dec 2024) was de-risking milestone, NOT FID. Windlab was only "invited to enter into a CISA" 22 May 2026 per Infrastructure Pipeline. Status downgraded fid → awarded. Proponent corrections: Theodore (Theodore Energy Development SPV → RWE Renewables Australia); Whyte Yarcowie (EDF Power Solutions → EDF Renewables Australia); Willatook (added Wind Prospect WA partner attribution); Banana Range (EDF acquired Orange Creek from Lacour May 2021). Notable market intel: ENGIE/Willatook public FID target 2027 build 2029; RE identifies Theodore/RWE as gigawatt-scale project nearest to construction; European Energy/Bullyard candidate for next cisa_signed/fid (mid-2026 construction start imminent). Data gaps flagged: **Moranbah Solar** (T7 QLD Zero-E/Grupo Cobra) and **Cellars Hill Wind** (T7 TAS Gamuda+Alternate Path JV, shares site with Weasel).

- **v3.22.3** (this session, pending commit) — Research Notes cache-bust fix + handoff refresh. Added `cache: 'no-cache'` to `fetchResearchNotes()` in `dataService.ts` — forces browser + service worker to revalidate with server on each fetch, so new notes appear on first load after a release without requiring a hard-refresh. Module-level cache still holds within a session (only affects first fetch). Fixes the "notes not coming through" moment users hit after v3.21.4 shipped the BESS Sleeper Story note.

### Backlog Item A cross-phase summary

Three phases confirm Modo Energy's 28% "zombie project" benchmark holds across all vintages of the CIS scheme. All movers to CISA_SIGNED / FID / CONSTRUCTION have **contracted revenue on top of the CIS floor** (Snowy PPAs, Rio Tinto offtake, gentailer balance sheet, staged expansion of financed sites). Validates the **BESS Sleeper Story thesis** (v3.21.4) at T1+T4 vintages; T7 too early to test. Pure-play merchant projects reliant on CIS floor alone are the stalling cohort.

**4 data-gap projects flagged for follow-up** (need new AURES DB records):
- Willogoleche 2 Wind Farm (T4 SA, 108 MW, ENGIE 25% + Foresight 75% JV — expansion of operating Stage 1)
- Punchs Creek Renewable Energy (T4 QLD, 400 MW solar + 400 MW/1,600 MWh BESS, EDPR + QIC JV — consolidation of stale multi-stage BESS records)
- Moranbah Solar Farm (T7 QLD, 171 MW + 100 MWh, Zero-E Australia / Grupo Cobra)
- Cellars Hill Wind Farm (T7 TAS, 341 MW, Gamuda Renewables + Alternate Path JV)

### v3.21.1–v3.21.4 — CIS Tender 9 competitive-field intelligence + BESS sleeper story (2026-07-15/16)

- **v3.21.1** — New docs research note (`docs/RESEARCH_CIS_T9_COMPETITIVE_FIELD.md`, ~6,700 words) covering CIS T9: corrected state math (VIC/TAS minimums, not caps), deliverability paradox as central frame, Zero-for-15 sidebar (2 of ~69 CIS non-battery gen at construction by Mar 2026), Table A of 35 CISA-locked non-NSW projects curated from AURES scheme_contracts overlays, Table B tiered T9 competitive field (wind + large solar + solar+BESS), three-lens synthesis (Rebid / Gentailer / Earliest-COD), combined-view predicted T9 shape. AURES data corrections bundled: Bell Bay overlay (T4 CISA added — was missing), Whyte Yarcowie overlay (proponent WP Renewables → EDF), Palmer overlay + DB (status → construction + FID 9 Jan 2026 timeline), **Barn Hill overlay + DB (capacity 186→300 MW; owner corrected to AGL Energy since 2009 — was showing SPV name only; co-located with AGL Barn Hill BESS 270 MW)**, scheme-rounds.ts CIS T9 entry region row rephrased (min-not-cap).
- **v3.21.2** — Ported CIS T9 research into the CIS T9 card as `T9CompetitiveFieldDeepDive` component + `t9CompetitiveFieldDeepDive` field on OpenRound type. Renders in Open Rounds CIS tab under CIS T9 card, after ProformaMechanicsDeepDive. Structure: exec-summary + state-math grid + deliverability paradox with Zero-for-15 sidebar + three collapsible lenses (colour-coded, top-5 picks with STANDOUT/WATCH/LONG-SHOT/BLOCKED flag chips + conclusion) + Combined-view predicted-shape table + AGL Barn Hill standout callout + docs reference footer.
- **v3.21.3** — Published CIS T9 research note to `/intelligence/research` (new `cis-t9-competitive-field-three-lens` entry under `cis-ltesa` category). 8 sections, cross-references companion notes (`cis-rebid-restrictions-hardening` 2026-07-07 for T9 Q&A Item 8 mechanics, `cis-project-status-deep-dive` 2026-06-27, `cis-wind-projects-crisis-state-of-play` 2026-07-08). Related project IDs: barn-hill, nonowie-wind-farm, kentbruck-green-power-hub, palmer-wind-farm, hexham, guildford-wind-farm.
- **v3.21.4** (shipped 2026-07-16) — BESS Sleeper Story research note applying the wind Zero-for-15 framework to BESS CIS winners. Thesis: govt accepted lowest bids → thinnest capex margins → BESS T3/T8 winners will follow wind trajectory later and less visibly. New docs research note (`docs/RESEARCH_BESS_SLEEPER_STORY.md`) + Research Notes JSON entry (bess-market category). Also bundled: `docs/PLAN_CIS_LTESA_DATA_UPDATE.md` (3-phase execution plan for the comprehensive data update project — see Backlog Item A below).

### v3.20.0–v3.21.0 — Gas vs BESS Firming + NEM Publications module (2026-07-10)

### v3.20.0–v3.21.0 — Gas vs BESS Firming + NEM Publications module (2026-07-10)

- **v3.20.0** — New intelligence page: **Gas vs BESS Firming** (`/intelligence/firming`). Entry screen with 3 objective cards (min cost / min emissions / max renewables). Core model: fix total GWh investment, select duration (2/4/6/8hr) → calculates BESS power GW and residual gas GW needed. Outputs: KPI row, duration trade-off bar chart with ISP 2026 reference lines (Current NEM / Slow Change 2035 / Step Change 2035), 24-hour dispatch area chart (4 demand profiles: Evening peak / Heatwave / Dunkelflaute / Annual), CAPEX breakdown. Assumptions panel: read-only collapsed with "Edit assumptions" unlocking sliders. Pre-built scenarios + localStorage save/load. Hub card added.

- **v3.21.0** — New learn module (in-development, build priority #2): **Reading the NEM — Essential Publications for Power Developers** (`/learn/nem-publications`). 8 lessons: Intelligence Stack → ISP → IASR → ESOO → Network Layer (TCPR + CIR + RIT-T) → MT PASA + QED → GSOO + AER SOEM → Developer's Reading Calendar + CWO BESS worked example. Synced to Studio Learn. Research notes updated with verified Hansard quotes from Senate E&C Estimates hearing (26 May 2026, pp.86-90) on CIS wind project delays — Brine/Phan/Wiltshire testimony.

### v3.19.0–v3.19.3 — Research Notes enrichment + Hansard verification (2026-07-08)

- Updated CIS wind crisis research note with verbatim Senate Estimates testimony (Matthew Brine, Bich Phan, Lisa Wiltshire). Clarified: number four is Hansard-confirmed; specific project names are AFR-only (unverified). Added LTESA/CIS T9 geographic non-overlap nuance. Added three policy advocacy positions.

### v3.18.0–v3.18.8 — CIS Pipeline Intelligence (8 releases)

- **v3.18.0** — CIS T8 dispatchable results (15 BESS, 4.2 GW / 16.1 GWh, QLD 51%). `contract_status` field added to SchemeProject (awarded/cisa_signed/fid/construction/operating/withdrawn/terminated). 22 projects populated with status from DB cross-reference. 3 new research notes: T8 results, Zero for Fifteen (no CIS wind at construction), Bowen withdrawal/LTESA clarification.
- **v3.18.1** — CIS Pipeline Overview component on SchemeTracker Overview tab: (1) Pipeline Funnel showing awarded→signed→FID→construction→operating conversion; (2) By Round stacked bars colour-coded by status; (3) Project Table with filter pills (scheme/status/state/tech) and sortable columns. 130 projects / 38.5 GW tracked. `createPdfContainer()` utility added to exportPdf.ts.

- **v3.18.2** — Scheme status flows to ProjectDetail cards via SchemeStatusBadge.
- **v3.18.3** — project_id fixes (Tomago, Melbourne RE Hub, Willogoleche). Bowen withdrawal clarification added to NSW LTESA T8 eligibility.
- **v3.18.4** — Comprehensive deep dive: 26 projects verified with web research.
- **v3.18.5** — All 130 CIS+LTESA projects verified: 58 awarded, 15 FID, 21 construction, 7 operating. New findings: Edify EPC (DT Infrastructure), ACEnergy CATL deal, Koolunga EPC (GenusPlus), Capricorn QLD call-in, Junction Rivers terminal.
- **v3.18.6** — By Round drill-down: click status legend to see all projects in that status with details and notes.
- **v3.18.7** — SchemeTracker tabs reduced from 11 to 9 (removed Boardroom + CIS Success — subsumed by Pipeline Overview). 18 timeline events added to DB. Capricorn BESS research note (30 total). Handoff refreshed.

**Remaining tasks (next session):**

**SchemeTracker file extraction (phase 2 — dedicated session):**
- Extract NSW T8 deep-dive (~1,120 lines) → `SchemeTrackerNswT8.tsx` — includes RiskShareDeepDive, BidParamsOptionsDeepDive, BidConfigDeepDive, ProformaMechanicsDeepDive, PpaLeverageDeepDive, NswT8IneligibleProjectsModal, PpaLtesaCalculatorModal
- Extract NSWWindTab (~1,100 lines) → `SchemeTrackerNswWind.tsx` — includes helper functions (PROBABILITY_COLOUR, RISK_CONFIG, CONNECTION_CONFIG, plannningChip, yearToPct, schemeAwardYear)
- Delete dead code: CISSuccessTab (exported but not rendered), SchemeBoardroom import
- Consider extracting CISBriefingTab (~570 lines) to Learn module
- **WARNING:** Attempted in v3.18.8 session but reverted — deeply intertwined dependencies. Must map dependencies carefully before cutting. Extract one component at a time, test after each.

**CIS/LTESA data maintenance:**
- Verify the 29 "awarded" projects without DB links (WA T2/T5-6, recent T7) — some may be at FID if they were established projects before winning CIS
- Flow more research notes to project timeline_events — EPC contracts, PPA details from deep dive not yet in DB for all projects
- Update KPI cards in CisPipelineOverview to use computed values from data (currently hardcoded ~36%, ~1.8 GW, ~1.4 GW, ~0.3 GW)

**Other backlog items (unchanged):**
- Per-REZ context chip on ProjectDetail (Tier 1)
- IASR fuzzy-matcher refinement (Tier 1)
- Navigation Review (Tier 3)
- GridRival retail hedging game (Tier 3.5)
- Learn interactivity improvements (Tier 3.5)
- Piano Lessons (Coming Soon on Dashboard)

### v3.17.0–v3.17.7 — Battery Market Intelligence + Research Notes + Learn fixes (8 releases)

- **v3.17.0** — Two new intelligence surfaces: Battery Market Intelligence (`/intelligence/battery-market`, 8 sections) and Research Notes (`/intelligence/research`, 25 notes across 6 categories).
- **v3.17.1** — Deep research enrichment from Modo Energy, WattClarity, AEMO QED, RenewEconomy. State-by-state commissioned battery lists, monthly revenue timeline, cannibalisation analysis, FCAS saturation, trading platforms, duration economics.
- **v3.17.2** — AURES Learn Energy Transition module factual corrections: gentailer definition + basis risk expanded, 3 NEM price cycles described, AGL Loy Yang A acquisition timeline fixed (carbon assistance condition), Newport removed from AGL (it's EnergyAustralia's), Accel Energy narrative corrected, Alinta Loy Yang B timeline fixed (ENGIE 2017, not TPG era), Sun Cable removed from Limondale listing, Origin Eraring firmness clarified.
- **v3.17.3** — QLD Battery Investment Briefing (`/intelligence/qld-battery-briefing`) — opinionated investment memo with 5 sections: thesis ("wrong time to invest BESS capital in QLD"), revenue collapse chart, QLD pipeline timeline (interactive stacked chart + toggleable event timeline), analysis (CIS moral hazard, Callide offset, behind-the-meter, data centres, duration scenarios), NEM context.
- **v3.17.4** — QLD Briefing fixes: PDF exports all sections, Supernode Stage 1 corrected to 260 MW (was 1,300 MW full project), stacked operating/construction chart, event type toggle buttons, 4-tier pipeline breakdown (CIS contracted / proven developers / credible international / speculative).
- **v3.17.5** — Contract Market visualisation in Battery Market Intelligence: quarterly spot prices by state (Q1 2024→Q1 2026), $300 cap contract settlement chart, ASX forward curve CY26-CY29 by state with QLD May 2026 update, spread analysis, BESS investment hierarchy (SA > NSW > VIC >> QLD). New `nem-contract-prices.json` data file.

**Also this session:** NEMweb bids refreshed (Mar→May 2026, 141,868 rows), data freshness checklist added to SESSION_OPENER, end-of-session Studio update checklist added to CLAUDE.md, GridRival hedging game + Learn interactivity added to backlog (Tier 3.5), Piano Lessons card added to Dashboard.

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

## Unified Backlog (refreshed 2026-07-18 — Item A complete, Item C added)

### Backlog Item A — Comprehensive CIS + LTESA Data Update ✅ COMPLETE (2026-07-16→18, v3.22.0-v3.22.2)

**Executed across 3 phases:**
- Phase 1 (v3.22.0) — CIS T1 non-NSW: 12 projects, 33% conversion. Palmer/construction, Mokoan/operating, Majors Creek+Ganymirra/cisa_signed, 8 awarded pre-FID.
- Phase 2 (v3.22.1) — CIS T4 non-NSW: 12 tractable + 2 data-gap, 29% conversion. Guthrie's Gap + Smoky Creek + Lower Wonga construction (Rio Tinto/EPC anchors), Carmody's Hill construction (Snowy PPA).
- Phase 3 (v3.22.2) — CIS T7 non-NSW: 8 tractable + 2 data-gap, 0% at cisa_signed+ (2 months post-award — too early). Bungaban `fid` marker corrected to `awarded`.

**All 3 phases confirm Modo Energy's 28% "zombie project" benchmark.** All movers have contracted revenue on top of CIS floor (Snowy PPAs, Rio Tinto offtake, gentailer balance sheet). Validates BESS Sleeper Story thesis (Item B) at T1+T4 vintages.

**Schema extension delivered**: overlay `scheme_contracts[]` entries now carry `award_date`, `execution_status`, `execution_date`, `fid_date`, `execution_notes`, `execution_source_url`.

**4 follow-up data-gap projects** (need new AURES DB records — see Item C).

### Backlog Item B — BESS Sleeper Story ✅ SHIPPED (v3.21.4, 2026-07-16)

**Thesis** (Travis 2026-07-16): "Govt accepted lowest bids in CIS Dispatchable rounds → thinnest capex margins → BESS T3/T8 winners will follow wind's Zero-for-15 trajectory later and less visibly."

**Status**: v3.21.4 delivered the research note applying the wind-crisis framework to BESS. Includes CIS Pilot BESS + CIS T3 Dispatchable + CIS T8 Dispatchable + NSW LTESA comparison. Published to Research Notes surface under `bess-market` category. Docs long-form at `docs/RESEARCH_BESS_SLEEPER_STORY.md`.

**Remaining tracking work**:
- Watch for Modo Q3 2026 conversion-rate update showing T3 slippage
- Watch for first formal T3 CISA withdrawal (any withdrawal of Mt Piper/Teebar/Capricorn/ACEnergy projects would confirm the pattern)
- Watch for RenewEconomy tracker Q4 2026 CIS piece
- Watch for CER quarterly CIS reporting
- Watch for Senate Estimates October/November 2026 hearings — first parliamentary opportunity for BESS delivery questioning
- Watch for Watt Clarity BESS delivery analysis
- Consider in-app deep-dive component on the CIS T3 or T8 card (mirrors T9 CompetitiveFieldDeepDive pattern)

### Backlog Item C — 4 CIS data-gap projects (NEW 2026-07-18, MEDIUM PRIORITY)

Surfaced during Item A Phases 2+3. Need new AURES DB records + overlay files (currently missing or wrongly-attributed):

1. **Willogoleche 2 Wind Farm** (T4 SA, 108 MW, ENGIE 25% + Foresight 75% JV) — expansion of operating Willogoleche 1 (119 MW). Construction late 2026, commissioning 2028. CIS_PROJECTS `project_id` currently `undefined` after 2026-07-16 removal of incorrect Stage 1 pointer.
2. **Punchs Creek Renewable Energy Project** (T4 QLD, 400 MW solar + 400 MW/1,600 MWh BESS, EDPR + QIC JV) — single integrated hybrid; needs consolidation of stale `punchs-creek-hybrid-stage-2/3-kci` records (200+600 MW BESS misattribution). SkyLab's legacy "Punch and Creek" 87 MW is a separate project.
3. **Moranbah Solar Farm** (T7 QLD, 171 MW + 100 MWh, Zero-E Australia / Grupo Cobra / ACS) — near Coppabella in Bowen Basin. AC-coupled hybrid with grid-forming inverters. Grupo Cobra's first Australian clean-energy asset. Cultural Heritage + Shared Benefits agreements with Barada Barna Traditional Owners.
4. **Cellars Hill Wind Farm** (T7 TAS, 341 MW, Gamuda Renewables + Alternate Path JV) — shares site + 220 kV connection with sister Weasel Solar (has AURES record). Construction target 2028 (Weasel first, early 2027).

**Effort**: 1 session. Each project needs (a) new `projects` row via SQL insert or overlay-only if pre-AEMO-Gen-Info; (b) new overlay JSON file with scheme_contracts entry; (c) CIS_PROJECTS `project_id` update to reference new records.

### Backlog Item D — v3.21.5 Lens 1 hardening (NEW 2026-07-16, LOW-MED PRIORITY)

CIS T9 competitive-field docs note (`docs/RESEARCH_CIS_T9_COMPETITIVE_FIELD.md`) + in-app `T9CompetitiveFieldDeepDive` component have softer Lens 1 framing ("excluded UNLESS actively withdraw and resubmit") than the newer `cis-rebid-restrictions-hardening` (2026-07-07) note which documents T9 Q&A Item 8's formal withdraw-and-resubmit machinery (formal written notification + AEMO track-record discretion + Significant Event obligations). The Research Notes JSON entry (v3.21.3) already has the corrected framing. Should update docs + component to match. Small edit — ~30 min.

### Backlog Item E — Session chip: 8 COD-review candidates (task_0ef34273, NEW ~2026-06-17)

From June 2026 refresh validator (v3.16.8): 8 projects past their gazetted COD but still `status: construction` in AURES. Need manual review to decide whether each has crossed into commissioning/operating: bundaberg-solar-farm, golden-plains-wind (Stage 1), goorambat-east-solar-farm-engie, gunsynd-solar-farm, lancaster-solar-farm, limondale-bess, munna-creek-solar-farm, wambo-wind-farm. Chip still active — one click to spin off into fresh session.

### Tier 0 — SchemeTracker Restructure (HIGH PRIORITY, 1-2 sessions)

SchemeTracker.tsx is 7,940 lines with 11 tabs and 60 functions. Now that the CIS Pipeline Overview (funnel/bars/table) provides the simple overview, the page needs restructuring:

**Keep (core):**
- `overview` → Pipeline Overview (funnel + round bars + table) — the hero view
- `open-rounds` → merge CIS + LTESA back into one tab, show only currently open/evaluating rounds
- `tracker` → simplify to round-level summary with links to project detail

**Extract to separate component files (reduce main file to <3,000 lines):**
- NSW T8 deep-dive (risk-share, PPA leverage, bid params, proforma mechanics) → `SchemeTrackerNswT8.tsx` (~3,000 lines)
- NSW Wind Cohort → `SchemeTrackerNswWind.tsx`

**Move to Research Notes (temporal content doesn't belong in structural tabs):**
- Time-sensitive CIS commentary, Bowen withdrawal analysis, Senate Estimates findings → already partially migrated (29 notes)

**Remove (redundant with Pipeline Overview):**
- `cis-success` tab → subsumed by the funnel conversion rates
- `boardroom` tab → subsumed by overview + research notes
- `cis-briefing` tab → candidate for Learn module migration (how the CIS works as a mechanism)

**Candidate for Learn migration:**
- CIS mechanics briefing (how CISA cap & collar works, bid variables, assessment criteria) → standalone Learn lesson alongside the existing CIS/LTESA Bidding module

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

### Tier 3.5 — AURES Learn Improvements

1. **GridRival Retail Hedging Game** (medium, 1-2 sessions) — Interactive simulation embedded in Learn Lesson 5 (gentailer/basis risk). Player manages a retail electricity book: buys hedges (swaps, caps, ASX futures), faces wholesale price spikes, and sees P&L vary depending on whether they have owned generation (gentailer) vs pure retail. Should let users experience the 2017-19 price spike scenario and see why non-gentailers got crushed. Could also simulate the 2022 Ukraine commodity spike. Standalone component accessible from Learn hub + embeddable in Lesson 5. Design reference: GridRival (US retail electricity game). Key learning outcomes: basis risk types (locational, volume, shape, temporal), natural hedge value, why every price cycle consolidates retail market share.

2. **Learn Module Interactivity** (medium, ongoing) — Make existing lessons more interactive: inline quizzes, expandable worked examples, "what would you do?" decision points, progress-gated content. Currently all lessons are read-only text + tables. Priority modules: Energy Transition (17 lessons), BESS Story, CIS/LTESA Bidding.

3. **QLD Cap Contract Enrichment** (small) — Add ASX Energy historical QLD base and $300 cap contract settlement prices to the QLD Battery Briefing. Track the cap-base spread over time as the key BESS investment signal. Source: ASX Energy provisional settlement data (publicly available quarterly).

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
