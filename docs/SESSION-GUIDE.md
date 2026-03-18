# AURES Database — Session Continuity Guide

## How to Resume Work

When you start a new Claude session, use one of these prompts depending on where we are:

---

### Starting Prompt (Copy-Paste This)

```
I'm building the AURES database — an Australian renewable energy intelligence platform.
The repo is at /Users/travishughes/aures-db

Please read these files first to understand the full context:
1. docs/BUILD-TRACKER.md — Current progress and what's next
2. docs/PROJECT-PLAN.md — Full architecture, phases, and data sources
3. docs/VIBECODING-NOTES.md — What worked, approach notes

Then continue building from where we left off. Check BUILD-TRACKER.md
for the current phase, completed tasks, and next tasks.
```

---

### Quick Resume Prompts by Phase

**Phase 5 (Enrichment & Polish — CURRENT):**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
Phases 1-4 complete. 1,064 projects, 8 intelligence analytics pages,
climate intelligence with ENSO/IOD/SAM tracking, pattern-matching
forecast engine, Dunkelflaute monitor with tech+state filtering,
transmission infrastructure tracker. Historical CF data 2018-2026.
API key in ~/.zshrc as OPENELECTRICITY_API_KEY.
See BUILD-TRACKER.md "Strategic Roadmap" for next priorities.
```

**Intelligence Layer Enhancement:**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
I want to improve the intelligence layer. See the "10 Ideas for
Improving the Intelligence Layer" section in BUILD-TRACKER.md.
The Intelligence Hub is at /intelligence with 8 sub-pages.
Climate intelligence data is in frontend/src/data/climate-intelligence.ts.
```

**Data Enrichment (web research for specific projects):**
```
Continue enriching AURES project data. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
I want to add detailed data for [specific projects/areas].
Please research and populate the project fact sheets.
The OpenElectricity API key is in ~/.zshrc as OPENELECTRICITY_API_KEY.
```

**Navigation & UX Review:**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md — see "Navigation Review" section.
The app has 20+ pages and navigation needs restructuring.
Desktop sidebar has 10+ items, mobile bottom nav has 5.
Intelligence sub-pages are only accessible via the Intelligence Hub.
```

---

### Useful Commands

```bash
# Start the dev server
cd /Users/travishughes/aures-db/frontend && npm run dev

# TypeScript check (run BEFORE pushing — CI is strict)
cd /Users/travishughes/aures-db/frontend && npx tsc -b

# Build for production
cd /Users/travishughes/aures-db/frontend && npx vite build

# ---- Data Pipeline Commands ----

# Import real performance data from OpenElectricity API
cd /Users/travishughes/aures-db && python3 pipeline/importers/import_openelectricity.py --year 2024

# Import monthly data for a specific year
cd /Users/travishughes/aures-db && python3 pipeline/importers/import_openelectricity.py --year 2026 --monthly

# Backfill historical years (annual + monthly)
for year in 2018 2019 2020 2021 2022 2023; do
  python3 pipeline/importers/import_openelectricity.py --year $year
  python3 pipeline/importers/import_openelectricity.py --year $year --monthly
done

# Harvest facility metadata (dates, coords, timeline events) — 0 extra API calls
cd /Users/travishughes/aures-db && python3 pipeline/importers/harvest_facility_metadata.py

# Compute league tables
cd /Users/travishughes/aures-db && python3 pipeline/processors/compute_league_tables.py --year 2024
cd /Users/travishughes/aures-db && python3 pipeline/processors/compute_league_tables.py --year 2025

# Export SQLite to JSON
cd /Users/travishughes/aures-db && python3 pipeline/exporters/export_json.py

# ---- Full Refresh Pipeline (in order) ----
# 1. Import (uses ~13 API calls per year)
# 2. Harvest metadata (uses 2 API calls)
# 3. Compute league tables
# 4. Export JSON
# 5. Build frontend

# Check API quota
curl -s -H "Authorization: Bearer $OPENELECTRICITY_API_KEY" \
  -H "User-Agent: AURES-Pipeline/1.0" \
  https://api.openelectricity.org.au/v4/me | python3 -c \
  "import json,sys; d=json.load(sys.stdin); print('Remaining:', d['data']['meta']['remaining'])"
```

---

## Key Files to Read for Context

| File | What It Contains |
|------|-----------------|
| `docs/BUILD-TRACKER.md` | Current progress — what's done, what's next, strategic roadmap, data quality issues |
| `docs/PROJECT-PLAN.md` | Full architecture, all phases, data sources, design decisions |
| `docs/VIBECODING-NOTES.md` | How this was built, what worked, collaboration approach |
| `docs/PLAIN-ENGLISH-OVERVIEW.md` | Non-technical description of what AURES is and why |
| `database/schema.sql` | The complete database schema (17 tables) |
| `pipeline/importers/import_openelectricity.py` | OpenElectricity API importer (supports `--year`, `--monthly`, `--ytd`) |
| `pipeline/importers/harvest_facility_metadata.py` | Facility metadata harvester (dates, coords) |
| `frontend/src/data/climate-intelligence.ts` | Curated climate data (ENSO/IOD/SAM drivers, historical events, current conditions) |
| `frontend/src/data/transmission-projects.ts` | Curated transmission infrastructure project data |
| `frontend/src/pages/intelligence/Dunkelflaute.tsx` | Climate intelligence + Dunkelflaute monitor (largest page, ~1500 lines) |

## Key Patterns / Gotchas

- **Icons before arrays**: Icon components must be defined BEFORE any const arrays that reference them (Vite HMR issue)
- **Always run `npx tsc -b`** locally before pushing — CI is stricter than `vite build`
- **Recharts Tooltip formatter**: Use `(value) => ...` not `(value: number) => ...` to avoid TS errors
- **REZ zone IDs** are state-prefixed: `nsw-central-west-orana` not `central-west-orana`
- **API trailing slash**: `/v4/facilities/` needs trailing slash; `/v4/me` does not
- **User-Agent required**: Must send `User-Agent: AURES-Pipeline/1.0` — Cloudflare blocks default Python UA
- **PWA caching**: After deployment, users may need to delete and re-add the PWA to see nav changes
- **CSS variables**: Use `--color-*` prefix for all theme colours (dark theme default)
- **Static data files**: Climate and transmission data uses TypeScript data files (`frontend/src/data/`) not JSON — enables type safety and helper functions
- **Tab pattern**: Intelligence sub-pages use `activeTab` state + button pills for internal tab navigation (see Dunkelflaute.tsx, TransmissionInfra.tsx, EISTechnical.tsx)
