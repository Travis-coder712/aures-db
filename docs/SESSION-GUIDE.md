# AURES Database — Session Continuity Guide

## How to Resume Work

When you start a new Claude session, use one of these prompts depending on where we are:

---

### Starting Prompt (Copy-Paste This)

```
I'm building the AURES database — an Australian renewable energy intelligence platform.
The repo is at /Users/travishughes/aures-db

Please read these files first to understand the full context:
1. docs/PROJECT-PLAN.md — Full architecture, phases, and data sources
2. docs/BUILD-TRACKER.md — Current progress and what's next
3. docs/VIBECODING-NOTES.md — What worked, approach notes

Then continue building from where we left off. Check BUILD-TRACKER.md
for the current phase, completed tasks, and next tasks.
```

---

### Quick Resume Prompts by Phase

**Phase 1 (Foundation):**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
We're in Phase 1 — building the foundation (React + Vite PWA,
SQLite schema, AEMO importer, core UI screens).
```

**Phase 2 (CIS/LTESA/REZ):**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
We're in Phase 2 — building CIS/LTESA round views, REZ views,
and the Watchlist risk dashboard.
```

**Phase 3 (Performance Analytics):**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
We're in Phase 3 — building the AEMO SCADA data pipeline and
operational performance league tables for Wind, Solar, and BESS.
```

**Phase 4 (Intelligence Layer):**
```
Continue building AURES. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
We're in Phase 4 — building the multi-source intelligence panels,
differing views feature, and operations-to-development mapping.
```

**Data Enrichment:**
```
Continue enriching AURES project data. Repo at /Users/travishughes/aures-db.
Read docs/BUILD-TRACKER.md for current progress.
I want to add detailed data for [specific projects/areas].
Please research and populate the project fact sheets.
```

---

### Useful Commands

```bash
# Start the dev server
cd /Users/travishughes/aures-db/frontend && npm run dev

# Build for production
cd /Users/travishughes/aures-db/frontend && npm run build

# Run the AEMO data import pipeline
cd /Users/travishughes/aures-db && python pipeline/importers/aemo_generation_info.py

# Export SQLite to JSON
cd /Users/travishughes/aures-db && python pipeline/exporters/export_json.py

# Deploy to GitHub Pages
cd /Users/travishughes/aures-db && npm run deploy
```

---

## Key Files to Read for Context

| File | What It Contains |
|------|-----------------|
| `docs/PROJECT-PLAN.md` | Full architecture, all phases, data sources, design decisions |
| `docs/BUILD-TRACKER.md` | Current progress — what's done, what's next, blockers |
| `docs/VIBECODING-NOTES.md` | How this was built, what worked, collaboration approach |
| `docs/PLAIN-ENGLISH-OVERVIEW.md` | Non-technical description of what AURES is and why |
| `database/schema.sql` | The complete database schema |
| `data/projects/wind/yanco-delta-wind-farm.json` | The exemplar project — shows target data richness |
