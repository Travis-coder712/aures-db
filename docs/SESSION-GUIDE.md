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

**Phase 3.5 (Data Quality — CURRENT):**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
We're between Phase 3 and 4. Phases 1-3 complete with real OpenElectricity
API data. 1,067 projects, 224 with real performance data. Need to fix 3
duplicate projects, populate NSW REZ access rights, and enrich construction
pipeline data. API key in ~/.zshrc as OPENELECTRICITY_API_KEY.
```

**Phase 4 (Intelligence Layer):**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
We're in Phase 4 — building multi-source intelligence panels,
confidence ratings, developer profiles, COD drift tracking, and
operations-to-development mapping.
```

**Data Enrichment (web research for specific projects):**
```
Continue enriching AURES project data. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
I want to add detailed data for [specific projects/areas].
Please research and populate the project fact sheets.
The OpenElectricity API key is in ~/.zshrc as OPENELECTRICITY_API_KEY.
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

# Generate sample data for a year
cd /Users/travishughes/aures-db && python3 pipeline/importers/import_openelectricity.py --year 2025 --sample

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
| `docs/BUILD-TRACKER.md` | Current progress — what's done, what's next, data quality issues |
| `docs/PROJECT-PLAN.md` | Full architecture, all phases, data sources, design decisions |
| `docs/VIBECODING-NOTES.md` | How this was built, what worked, collaboration approach |
| `docs/PLAIN-ENGLISH-OVERVIEW.md` | Non-technical description of what AURES is and why |
| `database/schema.sql` | The complete database schema (17 tables) |
| `pipeline/importers/import_openelectricity.py` | OpenElectricity API importer |
| `pipeline/importers/harvest_facility_metadata.py` | Facility metadata harvester (dates, coords) |

## Key Patterns / Gotchas

- **Icons before arrays**: Icon components must be defined BEFORE any const arrays that reference them (Vite HMR issue)
- **Always run `npx tsc -b`** locally before pushing — CI is stricter than `vite build`
- **Recharts Tooltip formatter**: Use `(value) => ...` not `(value: number) => ...` to avoid TS errors
- **REZ zone IDs** are state-prefixed: `nsw-central-west-orana` not `central-west-orana`
- **API trailing slash**: `/v4/facilities/` needs trailing slash; `/v4/me` does not
- **User-Agent required**: Must send `User-Agent: AURES-Pipeline/1.0` — Cloudflare blocks default Python UA
- **PWA caching**: After deployment, users may need to delete and re-add the PWA to see nav changes
