# AURES — Session Opener

**Paste this whole file as the first message of a new Claude Code session
to bootstrap full project context.** Then ask Claude what to work on.

---

## 0. Load memory first

Before reading anything else, check
`~/.claude/projects/-Users-travishughes-Claude/memory/MEMORY.md` and the
files it points to — they contain prior-session observations about
AURES, user preferences, and feedback. Memories are point-in-time, so
verify any specific claim against current code before acting on it.

---

## 1. What this project is

**AURES** (Australian Renewable Energy System) is a React 19 / Vite 6 /
TypeScript 5 / Tailwind 4 PWA at **`/Users/travishughes/aures-db`**. It
tracks 1,067 Australian renewable energy projects (wind, solar, BESS,
hybrid, pumped hydro) with operational, financial, scheme, equipment,
and performance intelligence — plus 12 learning modules covering the
NEM, CIS/LTESA, BESS, REZs, planning, PPAs, financing, valuation.

SQLite at `database/aures.db` is the **source of truth** (~30 tables,
1,067 projects, 224 with monthly performance, ~300k daily generation
rows from 2021→present). The site renders from static JSON exports at
`frontend/public/data/`. Strict CI: `tsc -b && vite build` must pass.

Current version: see `frontend/package.json` (was v3.07.1 at last
session opener update — check current).

---

## 2. Three surfaces — keep all in sync

| Surface | URL / Path | Notes |
|---|---|---|
| AURES site | https://travis-coder712.github.io/aures-db/ | GitHub Pages, auto-built from `main` |
| Studio | https://travis-coder712.github.io/studio/ | Travis's other public site — hosts a **copy of learning modules**. Treat AURES as canonical |
| Personal dashboard | `file:///Users/travishughes/Studio/Dashboard.html` | Local HTML index linking to both surfaces |

If you add a top-level route or rename one, check whether
`Dashboard.html` links to it and ask Travis whether to update Studio.

---

## 3. User: Travis Hughes (`travishughes@outlook.com`)

- Based in Victoria. **Tests primarily on iPhone — mobile-first.**
- Prefers **dark theme** (use CSS variables, never hardcode greys).
- Wants **comprehensive features, not minimal slices.**
- Not a professional developer — Claude Code does the heavy lifting.
- GitHub: `travis-coder712`. Repo: `Travis-coder712/aures-db`.

---

## 4. Architecture in one diagram

```
External sources              SQLite                 Static JSON              React PWA
(AEMO MMSDM, Open       database/aures.db    frontend/public/data/   frontend/src/
 Electricity API,         ~30 tables           analytics/intelligence/  pages + components
 NEMWEB, news RSS,        source of truth      *.json
 web research)
       │                       ▲                       ▲                       ▲
       │                       │                       │                       │
       └── importers ──────────┘                       │                       │
              pipeline/importers/                      │                       │
                                                      │                       │
                          exporters ──────────────────┘                       │
                          pipeline/exporters/                                  │
                                                                              │
                          dataService ────────────────────────────────────────┘
                          frontend/src/lib/dataService.ts (fetches + caches JSON)
```

Always run importers before re-running exporters. Exporters apply
**manual-overlay merge** (see §10) so hand-curated narrative survives.

---

## 5. Intelligence sub-pages already shipped (don't duplicate)

| Route | What it covers |
|---|---|
| `/intelligence` | Hub index |
| `/intelligence/revenue` | Revenue Intelligence — overview, state leaders, state report cards, revenue pressure, fleet revenue, value factor, MLF history, **Commissioning Ramp** (v3.06.0) |
| `/intelligence/scheme-tracker` | CIS/LTESA milestone tracker with NSW-wind filter |
| `/intelligence/drift-analysis` | COD drift by tech/state |
| `/intelligence/wind-resource` | Wind CF benchmarks + fleet |
| `/intelligence/solar-resource` | Solar CF + capacity-class clipping |
| `/intelligence/dunkelflaute` | Wind/solar drought analysis |
| `/intelligence/energy-mix` | 5 tabs — Simulator, Generation Stack, Battery Watch, Coal Watch (YTD comparison), Current Mix, Transition Scoreboard |
| `/intelligence/developer-scores` | Developer execution grades |
| `/intelligence/transmission-infra` | Transmission + REZ + GridConnection |
| `/intelligence/eis-technical` | EIS technical specs |
| `/intelligence/nem-activities` | Monthly activity timeline |
| `/intelligence/bess-bidding` | BESS bidding intelligence + platform deep-dives |
| `/intelligence/bess-portfolio` | BESS portfolio — duration, grid-forming, chemistry, network services, **Live & Records** |
| `/intelligence/bess-records` | All-time BESS records leaderboard |
| `/intelligence/asset-lifecycle` | Repowering candidates, fleet ages, turnover forecast |
| `/intelligence/lifecycle-quartile` | Tech × state × stage matrix (63 cells) |
| `/intelligence/risk-signals` | Supply-chain HHI + scheme win probability |
| `/intelligence/bess-capex` | $/kWh trends |
| `/intelligence/project-timeline` | Cross-project timeline |

Entity directories: `/projects`, `/projects/:id`, `/developers`,
`/developers/:slug`, `/oems`, `/oems/:slug`, `/contractors`,
`/offtakers`, `/rez`, `/rez/:id`, `/performance`, `/map`, `/search`,
`/news`, `/guides`, `/learn/<module>`.

---

## 6. Reusable components (USE THESE — don't roll your own)

All in `frontend/src/components/common/`:

| Component | Purpose |
|---|---|
| `ChartWrapper` | Wraps Recharts with PNG + CSV export. Every new chart uses this. |
| `DataTable<T>` | Sortable, row-numbered, with totals + CSV export. Built-in formatters (`integer`, `currency0`, `percent1`, etc.). |
| `DrillPanel` | Right-slide on desktop, bottom-sheet on mobile. ESC + backdrop close. Used for click-through from any chart. |
| `DataProvenance` | Source freshness chip row. Register sources in `lib/dataSources.ts`. |
| `StateReportCard`, `MlfHistory` | Domain-specific re-usables in `components/intelligence/`. |

Common helper functions in `pipeline/exporters/export_json.py`:
`_stats_summary(values)` — count/mean/median/p25/p75; `_parse_date_loose`;
`_capacity_band`; `_cf_rating`, `_solar_cf_rating`, `_grade`; `write_json`.

---

## 7. Database schema cheat sheet

Top tables (full schema via `sqlite3 database/aures.db ".schema <table>"`):

| Table | Rows | What's in it |
|---|---|---|
| `projects` | 1,067 | Canonical project list. PK = kebab-case slug ID. Has `status`, `technology`, `capacity_mw`, `state`, `rez`, `cod_current`, `cod_original`, `current_developer`, `current_operator`, scores |
| `aemo_generation_info` | ~9,300 | One row per DUID, linked to project via `project_id`. `duid`, `registered_capacity_mw`, `status`, `fuel_type`, `full_year_commissioning` |
| `performance_monthly` | ~16k | Monthly settled energy/revenue per project (operating only). UNIQUE(project_id, year, month) |
| `performance_annual` | — | Yearly rollup |
| `generation_daily` | ~300k | Daily MWh per DUID, 2021→present |
| `dispatch_availability` | ~24M | 5-min coal dispatch (MMSDM) |
| `dispatch_price_daily` | — | Regional avg RRP per day, 2024-08→ |
| `demand_daily` | ~11.5k | NEM + 5 states concurrent peak demand |
| `timeline_events` | ~1.4k | Curated events per project. Types: `cod`, `energisation`, `commissioning`, `fid`, `construction_start`, `planning_*`, `ownership_change`, `offtake_signed`, `rez_access`, `stakeholder_issue`, `notable` |
| `cod_history` | — | Historical COD estimates (drift analysis) |
| `offtakes` | — | PPA contracts. 84 rows, 57 with MW, 40 with tenor |
| `suppliers` | 419 | OEM/EPC/BoP rows linked to projects |
| `eis_technical_specs` | — | EIS-verified technical specs (chemistry, grid-forming, etc.) |
| `scheme_contracts` | — | CIS/LTESA contracts |

Relationships: most rollups join `projects` ↔ `aemo_generation_info` (via `project_id`) ↔ `generation_daily` (via `duid`). One project can have multiple DUIDs (multi-stage assets) — always SUM gen across DUIDs per project.

---

## 8. Naming conventions

- **Project IDs**: kebab-case slugs (`stubbo-solar-farm`, `eraring-bess`).
- **DUIDs**: UPPERCASE (`STUBSF1`, `ERARING`, `WELNSF1`).
- **REZ IDs**: state-prefixed (`nsw-central-west-orana`, NOT `central-west-orana`).
- **State codes**: `NSW`, `VIC`, `QLD`, `SA`, `WA`, `TAS`, `NT`, `ACT`.
- **Region codes** (AEMO): `NSW1`, `VIC1`, `QLD1`, `SA1`, `TAS1`.
- **Technology**: `wind`, `solar`, `bess`, `hybrid`, `pumped_hydro`, `offshore_wind`, `gas`.

---

## 9. How to ship a new version (the AURES workflow)

```bash
cd /Users/travishughes/aures-db/frontend

# 1. Always TS-check locally — CI is stricter than `vite build`
npx tsc -b && npm run build

# 2. Bump version in package.json (feat = minor, fix = patch, chore = patch)
# 3. Add release entry to docs/INTELLIGENCE_LAYER_PLAN.md (top of
#    "Recent notable releases", same format as existing entries)

# 4. Commit + push
cd /Users/travishughes/aures-db
git add <specific files — NEVER `git add .`>
git commit -m "$(cat <<'EOF'
feat(v3.0X.0): <short title>

<paragraph explaining what + why>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin main

# 5. GitHub release
gh release create v3.0X.0 --title "v3.0X.0 — <title>" --notes "$(cat <<'EOF'
## <Feature name>
<one-paragraph summary>
### What it does / what's new
- bullets
🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Never commit without Travis asking.** Even when you finish a feature,
stop and wait for explicit "commit and push" before doing so.

---

## 10. Updating DATA without overriding curated content

The DB is structured truth, but many narrative/relationship fields are
hand-curated and live as **overlays** at
`data/projects/<tech>/<id>.json`. Exporter merges these over the DB
output so they survive re-exports.

Protected fields (see `OVERLAY_OVERRIDE_FIELDS` in
`pipeline/exporters/export_json.py:40`): `notable`, `description`,
`overview`, `stakeholder_issues`, `timeline_events`, `sources`,
`technology_details`, `sips_contracts`, `sips_revenue`,
`revenue_determinations`, `aer_determinations`, `capex_aud_m`,
`capex_source`, `last_updated`, `last_verified`, `data_confidence`,
`first_seen`, `confidence_score`, `performance_score`,
`battery_status`.

**Rules:**
1. Never edit those fields directly in the DB if an overlay exists —
   edit `data/projects/<tech>/<id>.json` instead.
2. Run `pipeline/validators/validate_status.py` after big imports —
   never silently downgrade a project's `status`.
3. The OE importer only pulls `status='operating'` — commissioning-phase
   gen lives only in `generation_daily`. Don't "fix" this without
   understanding why; the Commissioning Ramp tab depends on the gap.
4. Always re-run the exporter after a data refresh so the JSON catches up.

### Common refresh commands

API key is in `~/.zshrc`:
```
export OPENELECTRICITY_API_KEY="oe_..."   # free plan: ~500 req/day, 367-day lookback
```

```bash
cd /Users/travishughes/aures-db

# Monthly performance (settled energy + revenue)
python3 pipeline/importers/import_openelectricity.py --year 2026 --ytd

# Daily generation (powers Commissioning Ramp + Energy Transition)
python3 pipeline/importers/import_generation_daily.py

# Coal dispatch (24M rows, takes a while)
bash pipeline/scripts/backfill_coal_history.sh

# Battery 5-min SCADA
python3 pipeline/importers/import_battery_scada.py --days 7

# News RSS
python3 pipeline/importers/import_news_rss.py

# AEMO Generation Info (refresh registered capacities + statuses)
python3 pipeline/importers/import_aemo_genx.py

# Validators (run after big imports)
python3 pipeline/validators/validate_status.py
python3 pipeline/validators/validate_sources.py

# Then re-export ALL JSON (slow but comprehensive)
python3 pipeline/exporters/export_json.py

# Or just one intelligence page (fast)
python3 -m pipeline.exporters.export_commissioning_ramp
```

After data refresh affects what users see, version-bump as
`chore(v3.0X.Y): refresh <sources>`.

---

## 11. Learning modules

**Primary home is AURES** at `/aures-db/learn/<module-id>`. Source:
`frontend/src/pages/learn/*.tsx`. Each module is a TSX component with
a chapter list + per-chapter content. Currently shipped:

`constraints`, `cis-ltesa-bidding`, `nsw-rez`, `bess-story`,
`energy-transition`, `planning-approvals`, `aemo-connections`, `ppas`,
`project-financing`, `valuing-projects`, `summing-it-up`.

**Studio has a copy.** When a module materially changes in AURES, ask
Travis whether to mirror to Studio. Treat AURES as canonical.

---

## 12. Plan before non-trivial work

**Use plan mode (`EnterPlanMode`)** when:
- Adding a new intelligence sub-page or tab.
- Changes that span pipeline + frontend.
- Anything with materially different valid approaches (definitions for
  metrics, sourcing strategies, BESS vs other tech treatment).
- Anything touching >3 files or requiring a new JSON output.

**Just edit** for: typo fixes, single-component tweaks, small text
changes, version bumps, release-log entries.

When the plan involves a metric definition (e.g. "stable output",
"revenue per MW") **ask the user the design question explicitly**
before writing the plan — those choices materially shape what gets
built. Use `AskUserQuestion`.

---

## 13. Recharts / TypeScript gotchas

- **Recharts Tooltip `filter` prop doesn't exist** — use a custom
  `content={(props) => <CustomTooltip {...}/>}` for many-line charts.
- **`(value: number) => ...` in Tooltip formatter triggers TS error** —
  use `(value) => ...` and cast: `Number(value)`.
- **Recharts `dot` prop**: cast via
  `(props) => { const { cx, cy, payload } = props as { cx: number; cy: number; payload: T } ...`
- **`labelFormatter` payload**: cast via `(payload as any)?.[0]?.payload`.
- **Icons must be defined BEFORE the const arrays that reference them**
  (Vite HMR issue specific to this repo).
- **CI is stricter than `vite build`** — always `npx tsc -b` locally.
- **One project may have multiple DUIDs** — always aggregate gen
  across DUIDs (`SUM(gen_mwh) GROUP BY date`) when computing
  project-level totals.
- **`projects.capacity_mw` may not equal SUM of
  `aemo_generation_info.registered_capacity_mw`** for multi-stage
  assets — pick deliberately, document the choice.

---

## 14. Browser verification

Dev server config at `.claude/launch.json`:
```json
{ "name": "aures-dev", "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev", "--prefix", "frontend"], "port": 5173 }
```

If Claude Preview MCP is available, use `preview_start name="aures-dev"`
to spin it up, then `preview_eval` / `preview_snapshot` / `preview_click`
to drive it. Always test mobile width too (preset `mobile` or
explicit `375×812`).

Otherwise: `npm run dev --prefix frontend` and open
`http://localhost:5173/aures-db/`.

---

## 15. Quick health check at session start

```bash
cd /Users/travishughes/aures-db

git status                                                # expect clean
git log --oneline -5                                      # last shipped version
sqlite3 database/aures.db "SELECT COUNT(*) FROM projects" # ~1067
sqlite3 database/aures.db "SELECT COUNT(*) FROM generation_daily"      # ~300k+
sqlite3 database/aures.db "SELECT COUNT(*) FROM performance_monthly"   # ~16k+
sqlite3 database/aures.db "SELECT MAX(date) FROM generation_daily"     # current freshness
sed -n 's/.*"version": "\(.*\)".*/\1/p' frontend/package.json | head -1
```

If row counts are dramatically lower than expected, someone cleared the
DB — see `docs/NEXT_SESSION_HANDOFF.md` for backfill scripts.

---

## 16. Authoritative docs (read in this order)

1. **`docs/INTELLIGENCE_LAYER_PLAN.md`** — release log + ongoing plan.
   Most recent entry at top of "Recent notable releases".
2. **`docs/NEXT_SESSION_HANDOFF.md`** — current state, backlog priorities,
   gotchas. The pickup doc.
3. **`docs/SESSION_2026-04-17_SUMMARY.md`** — context on the 4-release
   weekend that landed v2.29.0–v2.31.0.
4. **This file (`docs/SESSION_OPENER.md`)** — the bootstrapper you just
   pasted.

`docs/BUILD-TRACKER.md`, `SESSION-GUIDE.md`, `VIBECODING-NOTES.md`,
`PLAIN-ENGLISH-OVERVIEW.md` are older / legacy — skip unless asked.

---

## 17. What NOT to do

- **Don't `git add .`** — stage specific files. Some imports leave
  temp files behind.
- **Don't commit without explicit user ask** — even when a feature
  feels finished.
- **Don't skip hooks** (`--no-verify`, `--no-gpg-sign`) without
  explicit instruction.
- **Don't downgrade `status`** in importers — operating projects stay
  operating even if a feed momentarily drops them.
- **Don't `cd <current-dir>` before git** — `git` already operates on
  the working tree; the compound triggers a permission prompt.
- **Don't edit `projects` table directly** for fields that have an
  overlay file — edit `data/projects/<tech>/<id>.json` instead.
- **Don't roll new chart/table/drill components** — use `ChartWrapper`,
  `DataTable`, `DrillPanel`.
- **Don't embed API keys** in code or commit messages.

---

## Now

Read `docs/INTELLIGENCE_LAYER_PLAN.md` and `docs/NEXT_SESSION_HANDOFF.md`,
run the §15 health check, then ask Travis what to work on.
