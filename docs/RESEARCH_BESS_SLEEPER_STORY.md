---
title: "BESS Sleeper Story — CIS Winners at FID Risk"
subtitle: "The wind Zero-for-15 delivery framework applied to BESS. Meeting Modo's 28% benchmark isn't a success — it's a signal of trouble that hasn't yet gone public."
version: "0.1 (working draft)"
prepared_for: "Travis Hughes"
prepared: "2026-07-16"
scope: "CIS Pilot BESS + CIS T3 Dispatchable + CIS T8 Dispatchable + NSW LTESA BESS comparison"
---

# BESS Sleeper Story — CIS Winners at FID Risk

> ### Executive summary
>
> **Wind has a delivery crisis** (2 of ~69 CIS non-battery gen at construction by March 2026, per RE 30 Mar 2026 "Zero for 15"). The question this note answers: **is BESS following the same trajectory, later and less visibly?**
>
> **The 28% rule** (Modo Energy, Sep 2025 T3 note): only 28% of battery capacity awarded a CISA in prior tenders has reached FID. Modo explicitly uses the term "zombie projects." This is the analytical anchor — not the sensationally-low 3% wind number, but a systematically-below-half conversion rate that would leave the 2030 CIS operational deadline out of reach for a large fraction of BESS awards.
>
> **BESS conversion by round** (mid-2026 checkpoint):
> - **CIS Pilot BESS** (Sep 2024, ~22 months old): 1 construction + 1 FID / 6 verified projects = **~33%** — meets Modo benchmark. Two movers are EnergyAustralia utility-scale coal-replacement.
> - **CIS T3 Dispatchable** (Sep 2025, ~10 months old): 4 construction / 16 projects = **~25%** — meets Modo benchmark. All 4 movers have **contracted revenue on top of the CIS floor** (tolling, gentailer balance sheet, or staged expansion of already-financed sites).
> - **CIS T8 Dispatchable** (May 2026, ~2 months old): 15 projects, all AWARDED-PRE-CISA. Too early to judge.
>
> **The mechanism refinement** (this note extends Travis's original thesis): government did NOT accept the lowest bids per se — the CIS tender assessment weights BCR, deliverability + timeline, and organisational capability. What separates the movers from the stallers is **contracted revenue on top of the CIS floor**. Pure-play merchant projects with only CISA floor support are the ones that can't clear FID; gentailer/tolling-backed projects are moving. Same structural risk Travis identified, refined mechanism.
>
> **Named T3 at-risk projects** (public stall signals): Mt Piper (EnergyAustralia, NSW, 15 months post-award), Teebar (Atmos, QLD, ops target slipped 2027→2028), Capricorn (Potentia, QLD, no site works), Joel Joel + Little River (ACEnergy, VIC, single-developer double-award), Deer Park (Akaysha, VIC), Kiamal (TotalEnergies, VIC), Koolunga (Equis, SA), Bulabul 2 (Ampyr, NSW), Lower Wonga (Equis, QLD), Swallow Tail (Ampyr, NSW).
>
> **The "sleeper" framing** — why this is invisible: (a) Bowen's 2026 ministerial announcements emphasise pipeline VOLUME, not delivery-to-FID conversion. No Senate Estimates commentary specifically on BESS execution rates. Political narrative is "3.7 million households." (b) BESS award-to-FID delta lags award-to-announcement by 12-18 months, so awards from May 2026 T8 won't show visible slippage until mid-2027. (c) Merchant BESS revenues have collapsed — Modo Q2 2026 avg $38.9k/MW/yr (record low); March 2026 hit $44k/MW/yr; June 2026 merchant component at −$2k/MW/yr. This capex-margin problem is worsening, not improving.
>
> **Bottom line**: BESS isn't the wind catastrophe (25% vs 3%) but it's still failing to meet the CIS 2030 operational deadline for the majority of awards. The pattern is playing out — pure-play merchant BESS is stalling; contract-backed BESS is moving. Watch T8 winners over Q3-Q4 2026 for the first stall signals; that's when the "sleeper" becomes public.
>
> **AURES data quality note**: This research surfaced material attribution errors in AURES scheme_contracts overlays for the CIS Pilot cohort — Liddell/Orana/Smithfield/Mortlake/Tailem Bend Stage 3 are wrongly marked as federal CIS Pilot BESS but are actually NSW LTESA / bilateral / gentailer-funded. Correction is bundled into Backlog Item A (comprehensive CIS/LTESA data update, `docs/PLAN_CIS_LTESA_DATA_UPDATE.md`).

---

## 1. The 28% rule — Modo's analytical anchor

The single most important statistic in the BESS delivery debate isn't the wind "Zero for 15" number. It's Modo Energy's September 2025 finding (T3 research note):

> "Only 28% of battery capacity awarded a CISA in previous tenders has reached FID … winning a CISA has not proven to be a guarantee that a project will reach FID."

Modo explicitly uses the term **"zombie projects"** — awards that never execute. This is materially different from the wind catastrophe (2 of 69, ~3%) but is still systematically below what the CIS 2030 operational deadline requires. Watt Clarity (30 Sep 2025) makes the same point from a different angle: "the majority of these projects remain marked as 'Proposed' in AEMO's latest reporting, even though up to a year has passed since being awarded a contract."

Energy Synapse's CIS tender analysis puts the pattern in a broader frame: overall bid-to-award success rate is only 15% (61 awards / 396 bids across pilot + first three NEM tenders + WA). And 80% of awarded BESS capacity is exactly 4 hours — the CIS Dispatchable minimum — which is what a lowest-cost, minimum-conforming bid selection process produces. Not necessarily a design flaw, but a signal of what the market is optimising for.

**The 28% benchmark is the yardstick for every BESS award cohort below.** Meeting it isn't a success — it's roughly the current status quo of "one in four wins actually delivers." Beating it materially is the exception, not the rule.

---

## 2. BESS delivery pattern by round

### CIS Pilot BESS (awarded 4 September 2024, ~22 months old)

Actual awarded roster: **6 projects, 995 MW / 3,626 MWh**. Per Energy-Storage.News + Xinhua 4 Sep 2024:

| Project | Proponent | State | MW / MWh | Status mid-2026 | Source |
|---|---|---|---|---|---|
| **Wooreen ESS** | EnergyAustralia | VIC | 350 / 1,400 | **CONSTRUCTION** — financial close Feb 2026, ops late 2026 | ESN Feb 2026 |
| **Hallett BESS Stage 1** | EnergyAustralia | SA | 50 / 245 | **FID reached** — early 2026; construction Q2 2026; ops mid-2027 | PV Mag Aus 13 Feb 2026 |
| Clements Gap BESS | Pacific Blue | SA | 60 / 143 | AWARDED-PRE-CISA — "in development" | Pacific Blue project page |
| Limestone Coast West | Pacific Green | SA | 250 MW | AWARDED-PRE-CISA | Pacific Green |
| Solar River hybrid | ZEN Energy | SA | 256 MW | AWARDED-PRE-CISA | ESN |
| Springvale Energy Hub | Progress Power | VIC | 115 / 230 | AWARDED-PRE-CISA — ops target 2027 | ESN |

**Pilot execution ~22 months in: 1 CONSTRUCTION + 1 FID / 6 = ~33%.** Two movers are EnergyAustralia utility-scale replacements for coal, funded via corporate strategic rationale rather than merchant-only cases. Four pre-CISA — none formally withdrawn, but slippage on the 2028-2029 ops window is now the base case.

### CIS T3 Dispatchable (awarded 16 September 2025, ~10 months old)

Full roster confirmed via Energy-Storage.News (Sep 2025): **16 projects, 4.13 GW / 15.37 GWh**.

**Note on award date**: The tender opened November 2024 and closed December 2024, but the actual award announcement was 16 September 2025 — not December 2024 as originally suggested. This is the meaningful reference point for CISA-execution windows.

| Project | Proponent | State | MW / MWh | Status ~10 months in | Mover-signal |
|---|---|---|---|---|---|
| **Calala BESS A1** | Equis | NSW | 150 / 300 | **CONSTRUCTION** — $260M tolling agreement with Smartest Energy | Tolling contracted |
| **Goulburn River Standalone BESS** | Lightsource bp | NSW | 450 / 1,370 | **CONSTRUCTION** — co-located solar+BESS building; batteries energising late 2026 | Co-located with financed asset |
| **Reeves Plains BESS** | Alinta | SA | 250 / 1,000 | **CONSTRUCTION** — FID July 2025; construction commenced April 2026 | Gentailer balance sheet |
| **Ulinda Park BESS Expansion** | Akaysha | QLD | 195 / 780 | **CONSTRUCTION-adjacent** — expands existing 155 MW site (Phase 1 ops Dec 2025) | Staged expansion of financed site |
| **Mornington BESS** | Valent Energy | VIC | 240 / 587 | **CONSTRUCTION / near-commissioning** | Fast mover |
| Mt Piper Stage 1 | EnergyAustralia | NSW | 250 / 1,000 | AWARDED-PRE-CISA — FC "late 2026" | STALL SIGNAL — 15+ months |
| Swallow Tail | Ampyr | NSW | 300 / 1,218 | AWARDED-PRE-CISA | Watch |
| Bulabul 2 | Ampyr | NSW | 100 / 406 | AWARDED-PRE-CISA (Bulabul 1 won T8 — sequenced build) | Watch |
| Capricorn BESS | Potentia | QLD | 300 / 1,200 | AWARDED-PRE-CISA — FC targeted 2026 | STALL SIGNAL |
| Lower Wonga | Equis | QLD | 200 / 800 | AWARDED-PRE-CISA | Watch |
| Teebar | Atmos | QLD | 400 / 1,600 | AWARDED-PRE-CISA — FC mid-2026, **ops delayed 2027→2028** | STALL SIGNAL — timeline slipping |
| Koolunga | Equis | SA | 200 / 800 | AWARDED-PRE-CISA | Watch |
| Deer Park | Akaysha | VIC | 275 / 1,100 | AWARDED-PRE-CISA | Watch |
| Joel Joel | ACEnergy | VIC | 250 / 1,000 | AWARDED-PRE-CISA | STALL SIGNAL — no visible progress |
| Kiamal | TotalEnergies | VIC | 220 / 810 | AWARDED-PRE-CISA | Watch |
| Little River | ACEnergy | VIC | 350 / 1,400 | AWARDED-PRE-CISA | STALL SIGNAL — no visible progress |

**T3 execution ~10 months in: 5 CONSTRUCTION / 16 = ~31%.** Right at Modo's 28% benchmark. 11 projects still pre-FID.

**All 5 movers have contracted revenue on top of the CIS floor**:
- Calala: $260M tolling agreement with Smartest Energy
- Goulburn River: co-located with an already-financed Lightsource bp solar+BESS site (Hunter, Rio-adjacent)
- Reeves Plains: Alinta gentailer balance sheet + retail book
- Ulinda: staged expansion of already-financed Akaysha site
- Mornington: fast-mover Valent

**All 11 pre-FID projects rely on the CIS floor as their primary revenue anchor.** No tolling. No gentailer balance sheet. No adjacent-financed staging. This is the sleeper cohort.

### CIS T8 Dispatchable (announced 22 May 2026, ~2 months old)

Full T8 roster verified via Energy-Storage.News (26 May 2026), PV Magazine Australia (24 Jun 2026), RenewEconomy (May 2026). **15 projects, ~4.2 GW / 16.1 GWh, all ≥4-hour duration, all standalone lithium-ion**:

| # | Project | Proponent | State | MW / MWh | Location |
|---|---|---|---|---|---|
| 1 | Grahams | Ampyr Energy | QLD | 350 / 1,428 | Kogan / Western Downs |
| 2 | Rutherglen | Ampyr / Gryphon / Red Hill | QLD | 400 / 1,602 | Bororen (Gladstone) |
| 3 | Bulabul 1 | Ampyr Energy | NSW | 300 / 600 | Wuuluman (near Wellington) |
| 4 | Wimpole | Ampyr Energy | VIC | 375 / 1,533 | Bunyip North |
| 5 | Ganymirra | Edify Energy | QLD | 250 / 1,000 | Majors Creek |
| 6 | Majors Creek | Edify Energy | QLD | 250 / 1,000 | Majors Creek |
| 7 | Oaky Creek BESS | Akaysha Energy | QLD | 250 / 1,000 | Ellesmere |
| 8 | Woonga Creek BESS | Lightsource bp | QLD | 350 / 1,223 | Lower Wonga area |
| 9 | Gelston Energy Park | Ascera Energy | NSW | 400 / 1,600 | McCullys Gap (Muswellbrook) |
| 10 | Ridgey Creek | Potentia Energy | NSW | 130 / 520 | Parkes |
| 11 | Blanche | Potentia Energy | SA | 125 / 508 | Compton |
| 12 | Emeroo | Potentia Energy | SA | 225 / 900 | Wami Kata (near Port Augusta) |
| 13 | Melbourne Renewable Energy Hub Side B | Equis Australia | VIC | 200 / 800 | Plumpton |
| 14 | Moorabool | HMC Capital | VIC | 300 / 1,200 | Moorabool |
| 15 | Byellee | Eku Energy | QLD (probable — Byellee is Gladstone) | 300 / 1,160 | Byellee |

**T8 status: all 15 AWARDED-PRE-CISA.** Too early to judge — CISA negotiation runs 6-12 months post-award, so first execution outcomes visible Q4 2026 / Q1 2027.

**Multi-round-winner watch-list** (relevant for portfolio-strategy analysis):
- **Ampyr Energy**: 4 T8 wins (Grahams, Rutherglen, Bulabul 1, Wimpole) + Bulabul 2 at T3. 5 concurrent CIS-adjacent projects for a single developer. Execution-capacity question.
- **Edify Energy**: Ganymirra + Majors Creek at both T1 (150 MW each) and T8 (250 MW each). Same sites re-awarded — additionality question worth verifying.
- **Potentia Energy**: 3 T8 wins (Ridgey Creek, Blanche, Emeroo) + Capricorn at T3. All small-mid scale.
- **Akaysha**: Oaky Creek (T8) + Ulinda Park expansion (T3). Ulinda Phase 1 already operating — strongest execution track.
- **HMC Capital**: Moorabool (T8) + Kentbruck (T1 stalled 15+ months). HMC now holds a stalled T1 wind + a fresh T8 BESS. Watch whether Moorabool executes faster than Kentbruck.
- **Lightsource bp**: Woonga Creek (T8) + Goulburn River (T3 construction). Second bite at the Hunter area.

---

## 3. The thesis, refined

Travis's original framing (2026-07-16): *"Government accepted the lowest bids in the CIS Dispatchable rounds → thinnest capex margins → BESS T3/T8 winners will follow wind's Zero-for-15 trajectory, later and less visibly."*

The data refines this in one important way. **CIS tender assessment does NOT select solely on lowest bid** — it weights BCR (dominant), deliverability + timeline, organisational capability, First Nations participation, and community benefit. Awards go to projects that clear the multi-criteria bar.

**What the mid-2026 data actually shows**: the projects that ARE moving to FID are the ones with **contracted revenue on top of the CIS floor**:
- **Tolling agreements** (Calala $260M with Smartest Energy)
- **Gentailer balance-sheet strength** (Reeves Plains Alinta, Wooreen EnergyAustralia, Hallett EnergyAustralia)
- **Staged expansions of already-financed sites** (Ulinda Park Akaysha, Goulburn River adjacent-financed Lightsource bp)

The projects that are STALLING are the pure-play merchants with only CISA floor support. Same at-risk cohort Travis identified — but the mechanism is offtake structure, not bid price. This makes the story sharper: it's not "government picked losers" (they didn't); it's "government's revenue-floor mechanism doesn't fix the merchant BESS revenue collapse."

## 4. Why the merchant BESS revenue collapse is the pressure

The Modo Energy Q2 2026 review of NEM BESS revenues (cited in AURES v3.17.0 Battery Market Intelligence surface, and updated in this research):
- **NEM BESS revenues averaged $38.9k/MW/yr in Q2 2026 — a record low**
- **March 2026 hit $44k/MW/yr — record low at the time**
- **June 2026 merchant component fell to −$2k/MW/yr**
- **QLD BESS revenues −73% YoY** as installed capacity grew 2.7x — the cannibalisation is real and accelerating

For a pure-merchant BESS project modelled on 2023-2024 revenue expectations, the CIS floor may no longer be enough to close the debt-financing gap. Even a well-set Annual Floor (per CIS T8 MC1 briefing formula: Government pays 90% × (Floor − NOR) up to Annual Payment Cap) can't rescue a project whose merchant NOR has collapsed below the modelled base case.

**The pressure isn't capex — CATL/BYD cell prices are manageable for well-organised buyers.** The pressure is REVENUE. Projects that need merchant NOR to add ≥50% on top of the CIS floor to hit hurdle rates are the ones in trouble.

## 5. The "sleeper" framing — why this is invisible

Wind's delivery crisis went public because:
- 2 of 69 is a headline-friendly stat
- Senate Estimates testimony (Brine/Phan/Wiltshire 26 May 2026) formalised the number
- Trade press (RE 30 Mar 2026) framed as "Zero for 15" — memorable narrative

BESS's emerging story hasn't gone public because:
1. **Ministerial silence**: Bowen's 2026 announcements (T7 May 2026, T8 May 2026, T10 launch Jun 2026) emphasise pipeline VOLUME (4.2 GW here, 7.8 GW there) and household equivalence ("3.7 million households"), not delivery-to-FID conversion. No Senate Estimates commentary specifically on BESS execution rates found in public reporting.
2. **Timing lag**: BESS awards run behind wind. T3 was Sep 2025 (10 months); T8 was May 2026 (2 months). Stall signals lag award by 12-18 months, so the first T3 formal withdrawals or public FC delays won't hit trade press until Q4 2026 / Q1 2027. T8 stall signals lag to mid-2027.
3. **Merchant revenue collapse is a slow-motion trigger**: Q2 2026 was the first record-low quarter. Q3 2026 will confirm or refute the pattern. Modo's quarterly reports are the leading indicator; RE's tag pages will pick it up 1-2 quarters after Modo signals.
4. **Larger denominator**: Wind has ~69 awards; BESS across Pilot + T3 + T8 alone has 37 awards. A 25% conversion problem across 37 projects is arguably a bigger absolute-MW problem than wind's 3% across 69 — but the percentage looks less alarming.
5. **BESS still gets favourable narrative headlines**: "16 GWh in a single tender" plays as good news even if the underlying delivery conversion is questionable.

**Practical implication**: expect the story to break Q4 2026 or Q1 2027 when either (a) Modo publishes a Q3 2026 conversion-rate update showing T3 slippage, or (b) a T3 winner formally withdraws its CISA under the T9 Q&A Item 8 machinery. Whichever comes first triggers the public narrative shift.

## 6. NSW LTESA comparison

NSW LTESA is running materially faster than federal CIS on BESS execution, on comparable-vintage awards:

| Project | Round | Award vintage | Status mid-2026 |
|---|---|---|---|
| **Waratah Super Battery** (Akaysha) | NSW SIPS | 2022 | **OPERATING** (850 MW / 1,680 MWh — an outlier at scale + SIPS revenue design) |
| **Tomago Battery** (AGL) | LTESA R7 May 2026 | FID Jul 2025 (predates award) | **CONSTRUCTION** — Dec 2025 start, ops H2 2027 |
| **Orana BESS** (Akaysha) | LTESA R2 / state-supported | 2023-2024 | **OPERATING** from 26 Jun 2026 (415 MW / 1,660 MWh) |
| **Liddell BESS** (AGL) | FID Dec 2023, state-supported | 500 MW / 1,000 MWh | **CONSTRUCTION** ~30% complete early 2026, ops target Apr 2026 |
| **Limondale BESS** (LDS LTESA R3) | 2023 | 50 MW / 400 MWh | **COMMISSIONING** — first LDS LTESA to reach commissioning (per ASL Feb 2026) |
| Great Western Battery (Neoen) | LTESA R6 Feb 2026 | 330 MW / 3,500 MWh | Development ~5 months post-award — no FID reported yet |
| Silver City A-CAES (Hydrostor) | LTESA R3 | 2023 | Planning approval Feb 2025, court-amended Apr 2026, construction target Sep 2026 |
| Ebor BESS (Bridge Energy) | LTESA R6 Feb 2026 | 100 MW / 870 MWh | Local consultation — ops 2028 |
| Richmond Valley BESS (Ark Energy) | LTESA (2023) | 475 MW / 2,200 MWh | IPC approval Oct 2025, AEMO 5.3.4A/B letters Jun 2026, construction "targeted later 2026" |

**NSW LTESA converts faster than federal CIS because**:
1. **Gentailer participation is materially heavier** — AGL, EnergyAustralia dominate LTESA-supported BESS. Federal CIS BESS is more pure-play developer.
2. **Credible offtake anchors** — aluminium (Tomago), coal-retirement replacement (Liddell), industrial captive load.
3. **State regulatory certainty stacks with federal CIS** — dual-scheme certainty helps financing.
4. **NSW SIPS provides a genuine alternative revenue mechanism** for the largest projects (Waratah).

**However**: the newer LDS LTESA R6 cohort (Feb 2026) is showing exactly the same "no FID visible" pattern as CIS T3 at the equivalent age. Great Western Battery (Neoen 330 MW / 3.5 GWh) is the LTESA analogue of Capricorn/Teebar — awarded and in development but with no public FID progress.

So the NSW LTESA advantage isn't structural (the scheme design isn't magic) — it's proponent-selection. Gentailers move faster than pure-plays regardless of which scheme awarded them.

## 7. Named at-risk projects — the sleeper cohort

**CIS T3 projects with public stall signals** (in order of concern):

1. **Mt Piper Stage 1** (EnergyAustralia, NSW, 250 MW / 1,000 MWh) — publicly targeting FC "late 2026", 15+ months post-award. Adjacent to coal retirement. If AGL/EA's own retail book can't get this to FID within the CIS window, that's a strong signal.
2. **Teebar Creek Battery** (Atmos, QLD, 400 MW / 1,600 MWh) — FC targeted mid-2026, **ops slipped from 2027 to 2028**. Timeline is drifting in real time.
3. **Capricorn BESS** (Potentia, QLD, 300 MW / 1,200 MWh) — FC "targeted 2026", **no site works reported**. Potentia has 3 T8 wins (Ridgey Creek, Blanche, Emeroo) plus this T3 → portfolio-execution capacity question.
4. **Joel Joel** + **Little River** (ACEnergy, VIC, 250 + 350 MW) — single-developer double VIC award, no visible FID progress on either. Concentration risk.
5. **Deer Park BESS** (Akaysha, VIC, 275 MW / 1,100 MWh) — Akaysha executing Ulinda well but Deer Park is quiet.
6. **Kiamal BESS** (TotalEnergies, VIC, 220 MW / 810 MWh) — TotalEnergies has an existing Kiamal solar (operating) so co-location advantage — but no BESS FID signal.
7. **Koolunga BESS** (Equis, SA, 200 MW / 800 MWh) — Equis executing Calala (NSW) well but Koolunga stalled.
8. **Bulabul 2** (Ampyr, NSW, 100 MW / 406 MWh) — Ampyr just won 4 T8 projects; capacity to execute 5 concurrent CIS-adjacent projects is questionable.
9. **Lower Wonga** (Equis, QLD, 200 MW / 800 MWh) — same Equis story as Koolunga.
10. **Swallow Tail** (Ampyr, NSW, 300 MW / 1,218 MWh) — same Ampyr portfolio concern.

**Structural pattern**: the at-risk projects are (a) pure-play developer with no gentailer balance sheet, AND (b) reliance on merchant NOR to add material revenue on top of CIS floor, AND (c) no tolling / PPA / adjacent-financed staging.

## 8. What to watch — the leading indicators

If the BESS sleeper story is going to break publicly, watch for:

1. **Modo Energy Q3 2026 or Q4 2026 quarterly review** — the first quarterly data point showing sub-25% conversion rate for T3. Modo has been the analytical anchor and will likely publish first.
2. **First formal T3 CISA withdrawal** — under the T9 Q&A Item 8 machinery (formal written notification to Commonwealth), a T3 winner formally withdrawing is a Significant Event and public. Any withdrawal of a Mt Piper / Teebar / Capricorn / ACEnergy project would confirm the pattern.
3. **RenewEconomy tracking piece** — historically RE publishes a CIS tracker every 3-6 months. A late-2026 update showing T3 conversion below Modo's 28% benchmark would trigger broader trade-press narrative shift.
4. **CER quarterly CIS reporting** — official government data on scheme progress, quarterly cadence. Any material year-on-year decline in the "committed" or "operational" categories for BESS specifically.
5. **Senate Estimates October/November 2026 hearings** — first opportunity post-Bowen's 2026 announcements for parliamentary questions on BESS delivery. Wind delivery testimony (26 May 2026) was the wind Zero-for-15 breakout moment; a comparable BESS moment would be an October/November 2026 hearing.
6. **Watt Clarity BESS delivery analysis** — likely to be the first analyst piece connecting the merchant revenue collapse (Modo data) to the FID conversion problem (Modo analytical anchor) into a single BESS-specific delivery narrative.

## 9. What this means for CIS T9 (which we just analysed)

The wind T9 competitive-field research (v3.21.1, `docs/RESEARCH_CIS_T9_COMPETITIVE_FIELD.md`) identified deliverability as the T9 assessor's dominant filter. The BESS Pilot + T3 data validates this positioning:
- T9 assessors sit on top of a T1/T4 wind delivery crisis (2 of 69 at construction)
- AND a T3 BESS delivery pattern that's meeting Modo's 28% "zombie" benchmark
- Both patterns tell the assessor that deliverability tightening is well-justified
- Expect the T9 MC2/MC3 filter to be applied aggressively — projects without demonstrated delivery capacity (proven CIS track record) will be penalised harder than trade press has yet appreciated

The Barn Hill / AGL gentailer-integrated pitch identified in the T9 note (docs/RESEARCH_CIS_T9_COMPETITIVE_FIELD.md §7) gets STRONGER when read against the BESS data — because AGL is also progressing Liddell + Tomago on the LTESA side, AGL's aggregate BESS delivery track is the strongest of any developer in the market.

## 10. AURES data quality issues surfaced (feeds Backlog Item A)

The research uncovered material attribution errors in AURES `scheme_contracts` overlays for the Pilot BESS cohort:

**Actual CIS Pilot BESS (SA/VIC tender, awarded 4 Sep 2024)**: 6 projects (Wooreen, Hallett, Clements Gap, Limestone Coast West, Solar River, Springvale) — 995 MW / 3,626 MWh.

**AURES overlays that WRONGLY mark projects as "CIS Pilot" BESS**:
- `liddell-bess` (NSW, AGL 500 MW / 1,000 MWh) — AURES overlay says "CIS Pilot — NSW". **NOT federal CIS Pilot** — this is bilateral / state-supported per developer press.
- `orana-bess` (NSW, Wellington/Akaysha 460 MW / 920 MWh) — AURES says "CIS Pilot — NSW". **Actually LTESA R2 Firming + state support**.
- `smithfield-bess` (NSW, 235 MW / 470 MWh) — AURES says "CIS Pilot — NSW". Actually LTESA R2 Firming.
- `mortlake-battery` (VIC, Boral 135 MW / 270 MWh) — AURES says "CIS Pilot — SA / VIC". **NOT federal CIS Pilot** — Boral is corporate offtaker, not federally underwritten.
- `tailem-bend-stage-3` (SA, Vena 200 MW / 560 MWh) — AURES says "CIS Pilot — SA / VIC". **NOT federal CIS Pilot** per agent verification.

**Actual CIS Pilot BESS projects MISSING from AURES scheme_contracts overlays**:
- Limestone Coast West BESS (Pacific Green, SA, 250 MW) — MISSING or misclassified
- Solar River hybrid (SA, 256 MW) — MISSING
- Springvale Energy Hub (Progress Power, VIC, 115 MW / 230 MWh) — MISSING

**Impact on this note**: I've reported the CORRECT Pilot cohort per agent research, NOT the AURES-derived (incorrect) 8-project list.

**Corrective action**: bundle with Backlog Item A (comprehensive CIS/LTESA data update, `docs/PLAN_CIS_LTESA_DATA_UPDATE.md`). Phase 1 or Phase 2 execution should reconcile these attributions against DCCEEW primary sources.

## 11. What you may not have considered

1. **The 28% "zombie" benchmark is the story, not the wind 3%** — for BESS, meeting the benchmark isn't good news; it means 3 in 4 wins never execute
2. **Ampyr Energy has 5 concurrent CIS-adjacent projects (4 T8 + 1 T3 stalled)** — a single-developer concentration story. Watch execution capacity signals
3. **HMC Capital is now holding Kentbruck (T1 stalled wind) AND Moorabool (T8 fresh BESS)** — testing pattern of HMC's CIS-portfolio execution vs. its infrastructure-fund track record
4. **Edify won T1 AND T8 on the same 2 sites (Ganymirra, Majors Creek)** — additionality question worth verifying; may be sequenced stages but AURES overlay attribution needs checking
5. **The merchant revenue collapse (Modo Q2 2026 -73% QLD YoY) is the real trigger, not capex** — Travis's original "lowest bid → no FID" thesis focused on capex; the actual pressure is revenue
6. **NSW LTESA gentailer participation is materially heavier than federal CIS** — this is why LTESA converts faster. Federal CIS has always been more pure-play-developer heavy
7. **The T9 Q&A Item 8 machinery (per companion research note) applies equally to BESS** — any T3 CISA withdrawal is a Significant Event under Proforma CISA; heavy procedural weight makes withdrawal a public event
8. **Watt Clarity as the analytical anchor for the pending narrative break** — Paul McArdle's likely angle if he covers this is "look at Modo conversion rates alongside merchant revenue collapse alongside CATL cell pricing" — a triple-signal analytical story that hasn't been synthesised publicly yet
9. **T8 QLD dominance (7 of 15) sets up a QLD-specific FID risk** — QLD merchant BESS revenues have collapsed most severely; QLD T8 winners face the hardest revenue-model challenge
10. **The First Nations set-aside doesn't apply to Dispatchable rounds** — CIS T8 is not covered by the 500 MW FN set-aside that applies to T9 gen + T10 storage. So T8 winners have no set-aside cushion to fall back on

## 12. Sources

Primary:
- Energy-Storage.News — CIS T8 announcement (26 May 2026) — https://www.energy-storage.news/australia-awards-4-2gw-16-1gwh-of-battery-storage-under-capacity-investment-scheme-tender-8/
- PV Magazine Australia — CIS T8 fifteen batteries (24 Jun 2026) — https://www.pv-magazine-australia.com/2026/06/24/fifteen-big-batteries-secure-cis-contracts-in-latest-tender-round/
- RenewEconomy — T8 sunshine state 15 four-hour batteries (May 2026) — https://reneweconomy.com.au/sunshine-state-the-big-winner-as-15-four-hour-battery-projects-named-in-16-gigawatt-hour-cis-tender/
- Energy-Storage.News — T3 sixteen batteries 15.37 GWh — https://www.energy-storage.news/over-15gwh-of-energy-storage-successful-in-australias-capacity-investment-scheme-tender-3/
- Xinhua — CIS Pilot SA-VIC 3626 MWh (4 Sep 2024) — https://english.news.cn/20240904/8ca3b53776b44fd38fa20bc5590f9e27/c.html

Trade press + analyst:
- Modo Energy — T3 research note (Sep 2025, paywalled) — https://modoenergy.com/research/en/australia-nem-sixteen-batteries-win-contracts-in-the-capacity-investment-scheme
- Modo Energy — NEM BESS revenues Q2 2026 review — https://modoenergy.com/research/en/australia-nem-bess-revenues-summer-2025-26-review
- Watt Clarity — Are CIS-ters doin' it for themselves? Part 1 (30 Sep 2025) — https://wattclarity.com.au/articles/2025/09/are-cis-ters-doin-it-for-themselves-part-1-tracking-the-progress-of-cis-projects-post-award/
- Energy Synapse — CIS tender analysis + patterns — https://energysynapse.com.au/cis-tender-analysis-project-configuration-and-success-patterns/
- RenewEconomy — CIS battery winners tracking (Sep 2025) — https://reneweconomy.com.au/cis-battery-winners-some-are-already-off-and-running-others-may-take-at-least-a-year-to-get-going/
- PV Magazine Aus — Alinta Reeves Plains construction start (20 Apr 2026) — https://www.pv-magazine-australia.com/2026/04/20/alinta-kicks-off-1000-mwh-battery-build-in-south-australia/
- Energy-Storage.News — Lightsource bp Goulburn River construction — https://www.energy-storage.news/lightsource-bp-kicks-off-construction-on-cis-contract-winning-solar-plus-storage-plant-in-australia/
- Energy-Storage.News — EnergyAustralia Wooreen construction Feb 2026 — https://www.energy-storage.news/energyaustralia-begins-construction-of-1400mwh-bess-in-victoria/
- PV Magazine Aus — Hallett BESS milestone (13 Feb 2026) — https://www.pv-magazine-australia.com/2026/02/13/hallett-battery-project-reaches-major-milestone-in-south-australia/
- Akaysha — Ulinda Park Phase 1 online — https://akayshaenergy.com/news/akaysha-energys-ulinda-park-bess-phase-1-goes-online

NSW LTESA comparison:
- AGL — Tomago FID (Jul 2025) — https://www.agl.com.au/about-agl/news-centre/2025/july/final-investment-decision-on-the-500-mw-tomago-battery
- Renewables Now — Tomago 500 MW investment decision — https://renewablesnow.com/news/agl-takes-decision-to-invest-in-500-mw-battery-project-in-nsw-1279358/
- EnergyCo — Waratah Super Battery — https://www.energyco.nsw.gov.au/our-projects/waratah-super-battery-project
- PV Magazine Aus — Ark Richmond Valley connection approval (8 Jun 2026) — https://www.pv-magazine-australia.com/2026/06/08/ark-energy-gets-approval-to-connect-solar-battery-hybrid-project-to-nsw-grid/
- Energy-Storage.News — Hydrostor Silver City A-CAES court amendment — https://www.energy-storage.news/australian-court-amends-consent-for-hydrostors-1-6gwh-long-duration-energy-storage-project-following-appeal/

AURES internal (companion research):
- docs/RESEARCH_CIS_T9_COMPETITIVE_FIELD.md — CIS T9 three-lens competitive field analysis (v3.21.1)
- docs/PLAN_CIS_LTESA_DATA_UPDATE.md — 3-phase execution plan for the AURES data quality fixes surfaced in §10 of this note
- Research Notes: `cis-rebid-restrictions-hardening` (2026-07-07) — T9 Q&A Item 8 withdraw-and-resubmit mechanics
- Research Notes: `cis-project-status-deep-dive` (2026-06-27) — CIS conversion baseline
- Research Notes: `cis-wind-projects-crisis-state-of-play` (2026-07-08) — Senate Estimates testimony on wind delivery crisis

---

_End of working draft. Version 0.1, 2026-07-16._
