# AURES Database — Vibecoding Notes

## What Is Vibecoding?

This project is being built through a collaborative "vibecoding" approach — where the human provides the vision, domain expertise, and editorial direction, while Claude (AI) handles architecture design, research, code generation, and systematic execution.

It's not "AI writes code, human reviews it." It's more like a senior architect working with an extremely fast research assistant and builder.

---

## How This Project Came Together

### The Human Contribution (Travis)

Travis brought the domain expertise that no AI could generate:

1. **The Vision**: Not just "a database" but a multi-lens intelligence platform. The insight that the same data should be viewable from a dozen different angles (by developer, by OEM, by state, by CIS round, by REZ, etc.) came from real industry experience.

2. **The Depth Requirements**: Knowing that inverter models matter, that SIPS agreements are important, that STATCOM vs SynCon choices are trackable, that BoP contractors should be recorded — this level of granularity comes from working in the industry.

3. **The "No Hallucinations" Principle**: The non-negotiable requirement that every fact must be sourced, and that gaps should be honestly marked. This prevents the most common failure mode of AI-generated content.

4. **The Multi-Source Philosophy**: The brilliant insight that "no one source is correct on all aspects" — that the database should embrace conflicting information rather than hiding it. This elevates AURES from a simple database to an intelligence product.

5. **Real-World Examples**: Using Yanco Delta as the exemplar forced the design to handle ownership changes, milestone payments, REZ access rights, and timeline drift — all real complexities that abstract design would miss.

6. **Priority Setting**: "I'm more interested in BESS and wind at the moment" and "I'm more interested in it being comprehensive than easy to use" — these editorial decisions shape hundreds of downstream design choices.

### The Claude Contribution

Claude brought speed, breadth, and systematic thinking:

1. **Research**: Systematically searched 50+ sources to map the entire data landscape — what's freely available, what needs manual curation, what's behind paywalls. This would take a human days; it took Claude minutes.

2. **Architecture Design**: Translated the user's vision into a concrete three-layer architecture (Python pipeline + SQLite + PWA), with specific technology choices, schema designs, and data models.

3. **Feasibility Analysis**: Honestly assessed what's possible (GitHub Pages PWA works for this) and what's not (some data points like harmonic filter sizes are very hard to find publicly). Didn't over-promise.

4. **Data Model Design**: Created the detailed JSON and SQL structures that can handle multi-source data, confidence ratings, timeline events, ownership chains, and performance metrics.

5. **Scope Management**: Broke the vision into 5 phases with realistic timelines, so the project doesn't drown in ambition.

6. **Code Generation**: Writing the actual React, TypeScript, Python, and SQL code.

---

## What Worked Well

### 1. Iterative Design Through Conversation
The project architecture evolved dramatically through conversation:
- Started as "a PWA with renewable energy data"
- Became a multi-lens database
- Evolved to include performance analytics and watchlists
- Matured into a full intelligence platform with multi-source triangulation

Each user prompt refined and elevated the vision. This is much better than trying to specify everything upfront.

### 2. Real Examples as Design Drivers
Using Yanco Delta as the exemplar project forced the data model to handle:
- Ownership changes (Virya → Origin) with transaction values ($300M)
- Milestone-based payments ($125M + $175M)
- REZ access rights as a distinct event
- COD drift tracking over time
- Multiple sources reporting different aspects

This "design by example" approach catches edge cases that abstract design misses.

### 3. Honest Feasibility Assessment
Rather than saying "yes, everything is possible," the approach was to be transparent:
- "This data exists and is freely available" (AEMO, OpenElectricity)
- "This data exists but requires manual research" (OEM choices, costs)
- "This data is very hard to find publicly" (harmonic filter sizes, SIPS terms)
- "This is the kind of intelligence that Rystad charges $50k/year for"

This sets realistic expectations and helps prioritise effort.

### 4. Source-First Approach
By researching actual data sources before designing the system, the architecture fits reality rather than aspirations. The database schema was designed around what data actually exists, not what we wish existed.

---

## What's Left To Do

### ✅ Completed (Phases 1-4)
- [x] Scaffold the React + Vite + Tailwind + PWA frontend
- [x] Implement the SQLite database schema
- [x] Build the AEMO Generation Information importer (1,057 projects)
- [x] Build all core frontend screens (20+ pages)
- [x] Create 10 exemplar projects (Yanco Delta, Coopers Gap, etc.)
- [x] All CIS and LTESA rounds populated (15 rounds, 95 projects)
- [x] REZ views (18 zones across 5 states)
- [x] NEM Dashboard with fleet stats and charts
- [x] League tables (Wind, Solar, BESS, Hydro) with real OpenElectricity API data
- [x] Auto-populated 441 timeline events + 218 coordinates from AEMO data
- [x] Fix 3 duplicate projects (Coopers Gap, Stockyard Hill, New England Solar)
- [x] Populate NSW REZ access rights (CWO, SW)
- [x] Offshore wind enrichment (22 projects)
- [x] Confidence rating system (AUTO-COMPUTED: 4 high, 30 good, 260 medium, 770 low)
- [x] Developer profiles (718 developers with portfolio pages)
- [x] COD drift tracking and visualisation
- [x] Interactive Leaflet map view (250 projects with tech-coloured markers)
- [x] Intelligence Hub with 8 analytics pages
- [x] Climate intelligence (ENSO/IOD/SAM tracking, historical events, pattern matching)
- [x] Dunkelflaute monitor with tech+state filtering, forecast engine
- [x] Historical CF data backfilled 2018-2026 (495 monthly records)
- [x] Transmission infrastructure tracker (curated project data)
- [x] EIS technical intelligence (fauna/flora, offset analysis)
- [x] BESS capex analytics

### Next Up (Phase 5 — Enrichment & Polish)
- [ ] Navigation redesign (20+ pages need better organisation)
- [ ] Data cleanup (duplicates, missing coords, developer name normalisation)
- [ ] Performance methodology deep dive guide
- [ ] Emissions data integration
- [ ] Watchlist feature with change notifications
- [ ] OEM profiles (Vestas, Goldwind, Tesla, Fluence)
- [ ] Operations-to-development mapping
- [ ] Automated data refresh (GitHub Actions)
- [ ] Curtailment heatmap
- [ ] BESS revenue decomposition (arbitrage + FCAS)

See BUILD-TRACKER.md for the full strategic roadmap and 10 ideas for intelligence layer improvements.

---

## How To Get The Best Results From Here

### For the Human (Travis)

1. **Start each session with the resume prompt** from SESSION-GUIDE.md. This gives Claude full context without re-explaining everything.

2. **Review and redirect, don't micromanage**. Claude works best when given a direction ("build the league tables next") rather than step-by-step instructions.

3. **Bring domain knowledge**. When Claude populates project data, review for accuracy. Your industry knowledge catches errors that source-checking alone won't find.

4. **Test on your phone regularly**. Install the PWA and use it. Real usage reveals UX issues that screenshots don't.

5. **Add data sources you find**. When you read an AFR article or RenewEconomy piece that has project details, note the URL — it can be incorporated.

### For Claude (AI)

1. **Always read BUILD-TRACKER.md first** to understand current state.

2. **Don't invent data**. If you're unsure about a project detail, mark it as "Not yet verified" with a source gap.

3. **Commit frequently** with clear messages. Each meaningful chunk of work should be its own commit.

4. **Test the PWA build** before deploying. Run `npm run build` and check for errors.

5. **Update BUILD-TRACKER.md** at the end of every session with what was done and what's next.

---

## Technical Notes

### Why These Technology Choices

**React 19 + Vite 6**: Same stack as GridRival (proven for energy data). Vite gives fast builds and HMR.

**Tailwind 4**: Mobile-first utility classes make responsive design much faster than custom CSS.

**SQLite**: Perfect for this use case — single-file database, no server needed, excellent Python and Node support. Can handle 10,000+ projects easily.

**Python for data pipeline**: Best ecosystem for data processing — pandas for Excel/CSV, requests for APIs, sqlite3 in stdlib.

**JSON for PWA data**: Git-trackable, compressible, fast to parse client-side. Every data change is visible in git diff.

**GitHub Pages**: Free, reliable, automatic HTTPS, supports custom domains. The PWA service worker enables offline access.

### Development Environment

```bash
# Prerequisites
node >= 20
python >= 3.11
npm or pnpm

# Frontend development
cd frontend
npm install
npm run dev          # Start dev server at localhost:5173

# Data pipeline
cd pipeline
pip install -r requirements.txt
python importers/aemo_generation_info.py  # Import AEMO data
python exporters/export_json.py           # Export to JSON

# Build and deploy
cd frontend
npm run build        # Build PWA to dist/
npm run deploy       # Deploy to GitHub Pages
```
