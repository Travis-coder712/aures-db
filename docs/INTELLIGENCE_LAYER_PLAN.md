# AURES Intelligence Layer — Enhancement Plan

**Living document — updated each session as items are completed or refined.**

Last updated: 2026-04-17 (v2.15.1 baseline)

---

## Why This Document Exists

The data underneath AURES has been transformed (419 supplier records, 1,365 timeline events, 123k BESS bids, 225 operating projects with monthly performance, developer/contractor/OEM/offtaker profiles). The current intelligence layer was built for a much thinner dataset. This plan captures:

1. **Foundation work** (cross-cutting UX plumbing) — must come before new features
2. **Navigation reorganisation** — grouping the hamburger menu
3. **Tier 1/2/3 feature builds** — new intelligence products leveraging enriched data
4. **Completed / in-progress** — so we can pick up across sessions

---

## 0. Foundation Work — Build These First

These are cross-cutting concerns raised in the audit. **Every new feature after this should use these shared pieces**, so building them first saves re-work later.

### F1. ChartFrame — reliable chart rendering
**Problem:** charts across the intelligence layer occasionally don't render, typically because:
- `ResponsiveContainer` lacks an explicit `height` and the parent has no height
- Chart is inside a tab that was `display:none` on first mount → measured 0×0
- Chart is inside a collapsible/expandable section that renders children lazily

**Solution:** a shared wrapper component at `frontend/src/components/common/ChartFrame.tsx`:

```tsx
<ChartFrame title="Foo" height={320} data={rows} csvColumns={[...]}>
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={rows}>...</BarChart>
  </ResponsiveContainer>
</ChartFrame>
```

Behaviour:
- Enforces explicit `height` (required prop — no more missing heights)
- Wraps existing `ChartWrapper` (keeps PNG + CSV export)
- Uses `IntersectionObserver` + `ResizeObserver` to re-render Recharts when the frame first becomes visible (fixes tab / collapse issues)
- Renders a skeleton while `data` is loading
- Renders a "No data" empty state when `data` is empty
- Accepts `onClickDatum` pass-through to support drill-down (see F2)

**Migration:** replace every existing Recharts block in `pages/intelligence/*` and `pages/BESSCapex.tsx`, `Performance.tsx`, etc.

### F2. Drill-down pattern — click a chart, see what's in it
**Problem:** right now charts show aggregates but you can't drill into the underlying records. The user wants: click a bar → see the projects in that bar → click another column → see their suppliers → back → back.

**Solution:** two pieces of shared plumbing:

1. **`useDrillDown<T>()` hook** — manages a stack of drill states
   ```tsx
   const drill = useDrillDown<{ state: string; year?: number }>()
   // drill.current, drill.push({state:'NSW'}), drill.pop(), drill.reset()
   ```

2. **`<DrillBreadcrumb>` component** — renders the current drill path with clickable segments and "All" at the root.

3. **`<DrillPanel>` slide-in** — when a user clicks a datum, a right-side panel slides in showing the underlying project list (sortable DataTable) without losing the aggregate view. Alternative: inline expand below the chart.

**Recharts wiring:** `<Bar onClick={(datum) => drill.push({state: datum.state})}>`. Same for `<Pie>`, `<Scatter>`.

**Migration target:** start with Performance league tables (user's specific ask), then roll out to all intelligence pages.

### F4. DataProvenance — source, freshness, update triggers
**Problem:** data in the performance and intelligence layers now comes from multiple sources with different refresh cadences — OpenElectricity API (AEMO dispatch), NEMWEB (BESS bids), per-project enrichment (EIS PDFs, WattClarity articles, RenewEconomy / PV Magazine / Energy Storage News, ASX disclosures, developer websites, media releases). Users can't tell where a given number came from, how stale it is, or whether they should trigger a refresh.

**Solution:** a shared `<DataProvenance>` component that every chart/view uses to surface:

```tsx
<DataProvenance
  sources={[
    { id: 'openelectricity', label: 'OpenElectricity', lastUpdated: '2026-04-12',
      staleAfterDays: 3, refreshCommand: 'python pipeline/fetch_openelectricity.py' },
    { id: 'nemweb-bids', label: 'NEMWEB Bids', lastUpdated: '2026-04-15',
      staleAfterDays: 1, refreshCommand: 'python pipeline/fetch_nemweb_bids.py' },
  ]}
/>
```

Behaviour per source:
- **Badge showing "Last updated X days ago"** with green/amber/red traffic light based on `staleAfterDays`
- **Hover tooltip** with full datetime and source description
- **"Update now" button per source** — two modes (phased rollout):
  - **Phase 1 (no backend):** clicking copies the CLI command to clipboard and shows a toast "Run this locally to refresh"
  - **Phase 2 (pipeline trigger endpoint):** POSTs to a new local/internal pipeline API that runs the job and streams status back to the UI

Source registry (initial set):
| Source | Purpose | Staleness threshold |
|---|---|---|
| `openelectricity` | Monthly CF%, revenue, price, curtailment (AEMO dispatch) | 7 days |
| `nemweb-bids` | BESS daily bids (10 price bands × direction) | 1 day |
| `aemo-gen-info` | AEMO Generator Info registration | 30 days |
| `epbc-referrals` | Environmental referrals matched to projects | 30 days |
| `rez-isp` | AEMO ISP REZ data | 180 days |
| `news-rss` | RSS from RenewEconomy / PV Magazine / Energy Storage News | 1 day |
| `wattclarity` | WattClarity article scrape | 7 days |
| `asx-disclosures` | Listed developer ASX announcements | 7 days |
| `web-research-oems` | OEM supplier research (solar/hydro/wind/bess) | 90 days — mostly one-off |
| `web-research-offtakes` | PPA counterparty research | 90 days — mostly one-off |
| `eis-pdfs` | Project EIS technical extraction | 180 days |
| `developer-websites` | Developer website scrape | 30 days |

**Placement:** a compact source-chip strip at the top of every chart / analysis section. Also an expanded "Data Sources & Status" page (exists today — refresh it to drive off the same registry) gathering all sources into one admin view with per-source update buttons.

**Prior art in this codebase:** `Performance.tsx` already has an "Update Performance Data" collapsible panel with CLI instructions. DataProvenance generalises that pattern and applies it everywhere.

### F3. DataTable — sortable, totals, row numbers
**Problem:** tables across the app have inconsistent behaviour. The user wants, on every table:
- Sortable by any column (click header, toggle asc/desc)
- Row number in first column (resets when filtering)
- Total row at bottom (sum / avg / count depending on column type)
- Sticky header when scrolling
- Stays within existing `ScrollableTable` for horizontal overflow

**Solution:** a shared `<DataTable>` component at `frontend/src/components/common/DataTable.tsx`:

```tsx
<DataTable
  rows={projects}
  columns={[
    { key: 'name', label: 'Project', sortable: true },
    { key: 'capacity_mw', label: 'MW', format: 'number0', align: 'right',
      sortable: true, aggregator: 'sum' },
    { key: 'capacity_factor_pct', label: 'CF%', format: 'percent1', align: 'right',
      sortable: true, aggregator: 'avg' },
    { key: 'revenue_aud', label: 'Revenue', format: 'currency0', align: 'right',
      sortable: true, aggregator: 'sum' },
  ]}
  showRowNumbers
  showTotals
  defaultSort={{ key: 'capacity_factor_pct', dir: 'desc' }}
  onRowClick={(row) => navigate(`/projects/${row.id}`)}
/>
```

Features:
- Automatic sort indicator (▲ / ▼) on active column
- Row numbers in column 0 — count reflects visible rows after filtering
- Aggregator options: `'sum' | 'avg' | 'count' | 'median' | (rows) => string`
- Format options: `'number0' | 'number1' | 'percent1' | 'currency0' | 'date'` + custom
- CSV export hook (reuses existing `exportDataAsCSV`)
- Optional `onRowClick` for drill-through
- Integrates with `<ScrollableTable>` for wide tables

**Migration:** replace all `<table>` usages across intelligence pages. This is a ~200-line component that will be used 40+ times.

**Alternative considered:** TanStack Table v8 — industry standard, feature-rich. Rejected for now because: (a) heavier dependency, (b) we want the component to enforce consistent dark-theme styling, (c) our needs are modest (sort + totals + row numbers).

---

## 1. Navigation Reorganisation

Replace the flat 17-item hamburger menu with 6 grouped sections.

```
━━━━━━━━━━ EXPLORE ━━━━━━━━━━
  Home
  Dashboard
  Projects
  Map
  Search
  Watchlist

━━━━━━━━━━ INTELLIGENCE ━━━━━━━━━━
▸ Performance & Revenue           (NEW HUB)
    · Fleet League Tables         (← /performance)
    · Revenue Intelligence        (← /intelligence/revenue)
    · BESS Bidding Strategy       (← /intelligence/bess-bidding)
    · Generation & Dispatch       (← /intelligence/energy-mix, Generation Stack tab)

▸ Equipment & Technology          (NEW HUB)
    · OEM Intelligence            (← /oems, significantly upgraded)
    · BESS Capex Analysis         (← /analytics/bess-capex)
    · EIS Technical Specs         (← /intelligence/eis-technical)
    · Wind & Solar Resource       (← /intelligence/wind-resource + new solar equivalent)

▸ Developers & Contractors        (NEW HUB)
    · Developer Intelligence      (← /developers, merged with DeveloperScores)
    · Contractor Intelligence     (← /contractors, expanded)
    · Offtakers & PPAs            (← /offtakers, expanded)

▸ Pipeline & Delivery             (NEW HUB)
    · Scheme Tracker (CIS/LTESA)  (← /intelligence/scheme-tracker)
    · Drift Analysis              (← /intelligence/drift-analysis)
    · Project Timeline            (← /analytics/project-timeline)
    · NEM Activities              (← /intelligence/nem-activities)

▸ Grid & Geography                (NEW HUB)
    · Renewable Energy Zones      (← /rez, expanded)
    · Transmission & Grid         (merge /intelligence/grid-connection + /intelligence/transmission-infra)
    · Dunkelflaute Monitor        (← /intelligence/dunkelflaute)
    · Energy Mix & Coal Watch     (← /intelligence/energy-mix, other tabs)

━━━━━━━━━━ RESOURCES ━━━━━━━━━━
  News
  Guides
  Data Sources
```

### Duplicates to merge / retire
- `/intelligence/grid-connection` → merge into `/intelligence/transmission-infra` (the latter has the Leaflet map and is strictly richer)
- `/intelligence/battery-watch` → **MERGE, DO NOT RETIRE BLINDLY**. The standalone BatteryWatch component is 1,080 lines and contains unique content the user relies on (NSW/QLD BESS buildout, capacity milestones, demand context, coal displacement timeline). Before retiring the route: (a) diff the standalone component against the CapacityWatch.tsx (1,438 lines) that sits inside Energy Mix; (b) port any unique sections into CapacityWatch; (c) consider renaming CapacityWatch → a name that reflects the combined scope (eg "DeploymentWatch" or keep "CapacityWatch" and add a BESS-focused sub-section). Only then retire the standalone route.
- `/intelligence/wind-resource` → becomes "Wind & Solar Resource" (add solar equivalent)

---

## 2. Tier 1 — Transformative (build these first)

### T1.A  OEM Intelligence — Equipment Deep Dive by Type
**Status:** planned

**Current state:** `/oems` is a flat directory of 86 OEMs. No equipment-type deep dive, no market-share analysis, no performance correlation.

**Prerequisite:** rebuild `oem-profiles.json` exporter to include `solar_oem` role (currently 0 solar OEMs in profiles — role was added to DB constraint but exporter wasn't updated).

**New structure — tabbed by equipment type:**

| Tab | Content |
|---|---|
| **Wind OEMs** (77) | Market share (MW, projects) · turbine model library · rotor/rated capacity evolution over COD years · state concentration · contractor pairings · avg installed-fleet CF per OEM |
| **Solar OEMs** (51 panel + 56 inverter) | Panel vs inverter split · market share · SMA/Ingeteam inverter dominance · First Solar/Canadian/Jinko leadership · tracker vs fixed mount if known from EIS |
| **BESS OEMs** (57) | Market share · chemistry breakdown (LFP vs NMC) · combined OEM+inverter roles (Tesla/Fluence/Wartsila) · $/kWh trends per OEM (joined to BESS Capex) · bidding behaviour per OEM fleet (joined to BessBidding) |
| **Hydro OEMs** (42) | Fuji Tasmania monopoly · Toshiba/Voith/Boving comparisons · refurbishment vs new-build |
| **Cross-cutting** | "Who supplies whom" OEM × developer heatmap · OEM → performance quartile correlation · OEM pipeline visibility (upcoming wins in dev/construction) |

### T1.B  Developer Intelligence — Portfolio Explorer
**Status:** planned

**Current state:** `/developers/:slug` shows a basic stat card, one bar chart, and a project list. It does not answer "what is Edify actually doing right now?"

**Target:** turn DeveloperDetail into a portfolio dashboard:
- **Portfolio Gantt** — every project the developer owns, lifecycle stages (conception → dev → construction → operating), original vs actual COD deltas
- **Pipeline waterfall** — counts by stage, click-through to filtered project list
- **Execution scorecard** — on-time %, avg drift, completion rate, grade (fold in DeveloperScores)
- **Technology specialisation** — project-size distribution, hybrid patterns, typical duration ratios for BESS+solar
- **Equipment preferences** — go-to OEMs/contractors (from supplier data): "Edify uses Tesla on 80% of BESS"
- **Offtake strategy** — counterparties, typical PPA tenor, merchant vs contracted %
- **Ownership history** — when have they bought/sold projects?
- **Operating fleet performance** — aggregate quartile distribution
- **Revenue profile** — aggregate Rev/MW vs fleet median

Plus on DeveloperList:
- "Compare developers" feature (pick 2–4 side-by-side)
- Market concentration / Herfindahl by tech

### T1.C  Lifecycle Quartile Matrix
**Status:** planned

A single high-level grid — **asset type × state × lifecycle stage** — showing project counts and quartile-like rankings at every intersection.

Different quartile metrics per stage:
- **Operating** → composite performance (CF × rev × curtailment) — league table quartile exists
- **Construction** → delivery quartile (expected drift × developer score × capex efficiency)
- **Development** → probability-of-delivery quartile (dev score × CIS win × EIS stage × REZ access × grid status)

Click any cell → drill into filtered project list. This becomes the "state of the nation" view.

Cross-cutting: uses **F2 (drill-down)** and **F3 (DataTable)** extensively.

---

## 3. Tier 2 — High Impact

### T2.D  Contractor Intelligence
- Contractor × developer heatmap
- Contractor × OEM preferred pairings
- Delivery track record (avg COD drift for projects they've delivered)
- Capacity pipeline — what's currently under construction, when it frees up
- Technology specialisation (CPP = BESS-heavy, GE = EPC, etc.)
- State coverage map

### T2.E  Offtaker Intelligence — PPA Market Mapper
- Market share by PPA volume — who's buying
- Buyer profiles — Snowy vs AGL vs Origin vs corporates (Telstra, BHP, Woolies) vs retail
- Offtake type breakdown — PPA vs VPPA vs sleeved vs swaps vs LGC-only
- Avg PPA tenor by buyer type
- Developer × offtaker matrix — who signs with whom
- Uncontracted fleet risk — operating projects with no known offtake, cross-referenced to Revenue Pressure

### T2.F  Solar Resource Analysis
Mirror the existing Wind Resource page:
- State GHI/DNI benchmarks
- CF rankings (solar fleet median ~25%, top-quartile ~29%)
- Tracker vs fixed-mount performance gap
- Tilt/azimuth from EIS where available
- Dev pipeline CF predictions
- Curtailment risk scoring (rooftop PV penetration × state)

### T2.G  BESS Portfolio Intelligence
- BESS duration explorer — 2h → 4h → 8h transition timeline
- Grid-forming vs grid-following tracker
- Co-located vs standalone split
- Chemistry lineage (LFP dominance)
- Virtual transmission / SIPS / network service contracts (Waratah, Wallgrove, Torrens)

---

## 4. Tier 3 — Nice-to-Have

- **T3.H** Equipment Lifecycle & Refurbishment Tracker — ageing wind fleets approaching 20 years
- **T3.I** Supply Chain Concentration Risk — Herfindahl by equipment type, single-OEM dependency flagging
- **T3.J** Scheme Win Probability Model — predict CIS/LTESA win probability for development-stage projects
- **T3.K** Repowering Candidates Dashboard — operating wind >15 years, CF trend, refurb opportunity

---

## 4b. Guides & Documentation — Complete Rewrite

**Status:** planned

**Current state:** 12 guides in `frontend/src/data/guides.ts` (~2,066 lines). Many are stale artefacts from earlier phases:

| ID | Title | Status |
|---|---|---|
| `plain-english-overview` | What Is AURES? | Keep — refresh for new intelligence layer |
| `project-plan` | Architecture & Plan | Out of date (pre-enrichment) — rewrite |
| `build-tracker` | Build Progress | Stale changelog — retire (git log does this) |
| `session-guide` | Session Guide | Meta/process doc — retire or move to dev-only |
| `vibecoding-notes` | How This Was Built | Retrospective — retire or move to dev-only |
| `interactive-map` | Interactive Map (Planned) | Map is built — retire, or rewrite as a usage guide |
| `nem-summary` | NEM Summary Dashboard (Planned) | Dashboard is built — retire or rewrite |
| `using-aures` | Using AURES on Your Phone | Keep — refresh |
| `performance-methodology` | Performance Metrics Deep Dive | Keep — refresh with quartile logic |
| `strategic-roadmap` | Strategic Roadmap | Stale — replace with a roadmap derived from this plan |
| `search-tips` | Search Tips | Keep |
| `data-quality` | Data Quality Audit | Keep — refresh with current coverage numbers |

### Proposed new guide set (consolidated, ~6–8 guides)

| Category | Guide | Content |
|---|---|---|
| **About** | What Is AURES? | Plain-English explainer, refreshed for current state |
| **About** | Data Sources & Quality | Merge `data-quality` + freshness info · what's covered · gaps · confidence tiers |
| **Using** | Finding What You Want | Merge `using-aures` + `search-tips` · Cmd+K · filters · watchlist · mobile |
| **Using** | Navigating the Intelligence Layer | NEW — orient users around the 5 intelligence hubs, when to use each |
| **Methodology** | Performance & Quartile Rankings | Refreshed `performance-methodology` · composite scoring · quartile logic · click-through drill-down |
| **Methodology** | Developer Execution Scoring | NEW — explain how scores are computed, what they mean, limitations |
| **Methodology** | OEM & Supplier Data | NEW — what counts as an OEM vs EPC vs BOP, data sourcing, confidence |
| **Roadmap** | Where This Is Going | Replace `strategic-roadmap` with a user-facing summary of this plan |

### Principles for the rewrite
- **Keep user-facing; retire process docs.** `build-tracker`, `session-guide`, `vibecoding-notes` should not live in user guides. Move them to `docs/` as dev notes if kept at all.
- **Every guide must cite current features**, not "Planned — coming soon" placeholders.
- **Link between guides** — each methodology guide should link from the analysis page that uses it (eg Performance page has "Read: Performance & Quartile Rankings").
- **Include screenshots or interactive callouts** if practical (currently Markdown-only).
- **One revision pass per major release** — when v2.18.0 ships OEM Intelligence, the OEM guide gets updated in the same commit.

### Build order
This sits as a parallel track to the intelligence layer work. Rewrite each guide when its corresponding feature ships — eg OEM guide rewrite lands with T1.A (OEM Intelligence). The "About / Using / Navigating" guides can be rewritten any time after F1/F3/nav reorg complete.

---

## 5. Quick Wins (batch whenever convenient)

1. Rebuild `oem-profiles.json` with `solar_oem` role (prereq for T1.A)
2. Merge GridConnection into TransmissionInfra
3. Retire standalone Battery Watch route
4. Move `/analytics/bess-capex` and `/analytics/project-timeline` under `/intelligence/*`
5. Group hamburger menu into 6 sections (layout-only change)

---

## 6. Recommended Build Order

| Session | Work | Output |
|---|---|---|
| 1 | Foundation F1 (ChartFrame), F3 (DataTable) · regenerate solar OEM profile · quick wins 2–5 · group hamburger menu · retire stale guides | v2.16.0 |
| 2 | Foundation F4 (DataProvenance — Phase 1 clipboard-copy mode) · surface on Performance + Intelligence pages | v2.17.0 |
| 3 | Foundation F2 (drill-down pattern) · retrofit Performance charts with click-through · rewrite About/Using/Navigating guides | v2.18.0 |
| 4 | T1.A — OEM Intelligence tabbed deep-dive · rewrite OEM & Supplier Data guide | v2.19.0 |
| 5 | T1.B — Developer portfolio dashboard · rewrite Developer Execution Scoring guide | v2.20.0 |
| 6 | **T2.E — Offtaker Intelligence / PPA Market Mapper** (promoted from Tier 2 ahead of T1.C — offtakes need their own first-class home, not a sub-section of DeveloperDetail) | v2.21.0 |
| 7 | T1.C — Lifecycle Quartile Matrix · rewrite Performance & Quartile Rankings guide | v2.22.0 |
| 8+ | Remaining Tier 2 features in user-priority order · F4 Phase 2 (pipeline trigger endpoint) · remaining guide rewrites | v2.23+ |

---

## 7. History of Development → GitHub is the Source of Truth

**Decision:** the history of this project lives in **git commits, tags, and GitHub releases** — not in markdown files. The `build-tracker` guide will be retired for this reason.

**How we use it:**
- **Every user-visible change ships with a version bump** in `frontend/package.json` (eg v2.15.1 → v2.16.0).
- **Every release gets a GitHub Release** (`gh release create v2.x.y`) with a short summary pulled from the commit trail — this gives a permanent, human-readable changelog accessible from github.com/Travis-coder712/aures-db/releases.
- **Commits are written for humans** — short why-centric message, not "wip / fix typo".
- **This plan document lives in `docs/`** and is committed alongside code changes, so the plan's own evolution is also tracked in git.
- **A future "Release History" page** in the app (under Resources or a footer link) can simply render the GitHub Releases feed via its public JSON API — no duplicate maintenance.

### Current baseline: v2.15.1 (committed 2026-04-17)

Recent notable releases (from git log):
- **v2.20.0** — T1.B Developer Portfolio Dashboard: `/developers/:slug` rebuilt from a basic stat page into an 8-section portfolio view — execution scorecard with A/B/D/F grade, scheme-win chips, pipeline waterfall, COD drift timeline, equipment preferences (go-to OEMs + contractors), conditional operating-fleet quartile distribution (9 devs qualify), offtake summary + cross-link to PPA mapper, full project list. New `export_developer_analytics()` pre-aggregates equipment + drift + scheme wins + performance + offtakes (181 devs with equipment data, 167 with performance, 16 with scheme wins, 54 with offtakes). Plan reordered to promote T2.E (Offtaker PPA Market Mapper) ahead of T1.C for v2.21.0 — offtakes needs its own first-class home.
- **v2.19.0** — T1.A OEM Intelligence deep-dive: `/oems` rebuilt as a tabbed page (Overview · Wind · Solar · BESS · Hydro · Directory) · new Hydro market-share pie · new Overview tab with HHI concentration index per role + "Top 3 per Equipment Type" + "Most Active Developer-OEM Pairings" · per-tech OEM league tables with CF% + Q1-share performance correlation · BESS tab adds $/kWh by OEM + EIS-verified chemistry callout · Hydro tab adds Fuji Tasmania monopoly callout · new `export_oem_analytics()` in pipeline pre-aggregates performance + developer cross-links (no N+1 fetches) · new "OEM & Supplier Data" guide.
- **v2.18.0** — F2 drill-down pattern: `<DrillPanel>` + `<DrillBreadcrumb>` components · click-through retrofitted on 5 charts across 4 pages (DriftAnalysis tech + state bars · Performance quartile distribution · Revenue by Tech · Revenue Pressure · BESS rebid frequency) · slide-in-right on desktop, bottom-sheet on mobile · Escape + click-outside to close · Performance methodology guide updated.
- **v2.17.1** — Refinements: Solar OEM market share chart on `/oems` (panels + inverters toggle) · BESS Capex + Project Timeline removed from hamburger (still reachable via Intelligence Hub) · **overlay merge in exporter** — manual-enrichment files at `data/projects/<tech>/<id>.json` now survive re-exports (no more copy-back needed for Waratah SIPS contracts, etc.) · Timeline ↔ NEM Activities cross-links.
- **v2.17.0** — Data provenance across the app: typed source registry + `<DataProvenance>` chip widget + 21 pages retrofitted (every intelligence page, every entity directory, BESS Capex, Project Timeline, Performance). Extended exporter registry to 11 sources (added NEMWEB bids, News RSS, AEMO ISP REZ, market prices). Each chip shows source · age · status dot; click for full description + copyable refresh command.
- **v2.16.0** — Intelligence layer foundation: ChartFrame + DataTable · solar OEMs visible (16 new, 101 total) · GridConnection merged into Transmission/REZ · analytics pages moved into /intelligence · 3-group nav (Explore · Intelligence · Resources) · stale guides retired
- **v2.15.1** — Fix stakeholder_issues rendering for object-format data
- **v2.15.0** — Solar & hydro supplier enrichment: 202 new supplier records from web research
- **v2.14.0** — Notable text enrichment: 100% coverage across all 225 operating projects
- **v2.13.0** — Real monthly performance data for 220 projects, BESS revenue, Waratah SIPS enrichment
- **v2.12.0** — Next-gen BESS tech: Quantum3 string inverters, SmartStack, Megablock, Eraring capex fix

All prior history: `git log` or GitHub Releases page.

### Known data gaps still to close (enrichment, parallel to UI work)
- 16/80 wind projects missing some supplier data
- 7/34 hydro projects missing OEM data
- Ownership history only 12 entries — could be deeper
- BESS bidding summaries could be pre-computed per project
- Web research on offtakes not yet commenced (85 known, likely many more unlisted)

---

## 8. Principles

1. **Foundation before features** — F1/F2/F3 always. Every new chart uses ChartFrame. Every new table uses DataTable.
2. **Every chart has a drill path** — aggregates without drill are dead ends for power users.
3. **Every table has row numbers + totals + sortable columns** — no exceptions.
4. **Intelligence is the centre of gravity** — operational dashboards support it, not the other way round.
5. **Leverage the enrichment** — the data is the point. If a feature doesn't require the new supplier/developer/offtake/timeline data, it's probably not intelligence, it's just reporting.
