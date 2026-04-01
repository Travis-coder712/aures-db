# Plan: Dashboard Curated View + Mobile Navigation

## Problem
1. **Dashboard shows all 1064 projects** — many are zombie/offshore/low-confidence. The curated pipeline (429 projects) is a better default.
2. **Project Timeline shows all 1064** — includes 344 "first seen 2027+" projects that inflate future bars, especially BESS.
3. **Mobile filters** — already well-handled on ProjectList (bottom sheet), but Dashboard filter pills wrap to multiple lines on phone.

## Research Findings
- AEMO Connections Scorecard: **275 projects** in formal NEM connection process
- CEC reports: **~80-88 committed** (construction/commissioning), ~142 including financially committed
- AEMO Generation Information: **~400-600** proposed projects
- Our curated pipeline: **429** (222 operating + 49 construction + 11 commissioning + 147 development)
- The 147 curated development projects aligns well with AEMO's 275 connection queue minus operating/construction

## Curated Rules (already implemented in ProjectList, need to propagate)
- All operating/commissioning/construction: **always included**
- CIS/LTESA scheme projects: **always included** (even low confidence)
- Offshore wind: **always excluded**
- Zombies: **excluded**
- EPBC approved/submitted: **included** regardless of confidence
- Medium+ confidence: **included**
- Low confidence planning_submitted/early_stage without scheme: **excluded**

---

## Changes

### 1. Dashboard — Default to Curated View
**File: `Dashboard.tsx`**
- Import `isCuratedProject` from `ProjectList.tsx` (or extract to shared util)
- Apply curated filter to `allProjects` by default
- Update header subtitle: `"429 curated projects · 1,064 tracked"` with a small toggle to switch
- Add "ⓘ What is curated?" expandable note (same text as ProjectList)
- Curated stats in headline cards (operating/construction/development counts change)
- Charts (tech + state) use curated data
- Add a subtle "Show full pipeline" toggle link

### 2. Project Timeline — Add Curated Toggle
**File: `ProjectTimeline.tsx`**
- Add `isCurated` state (default true)
- Filter `data.projects` through `isCuratedProject` when toggle is on
- This removes offshore wind + zombies + low-confidence from timeline bars
- Add toggle chip: "Curated" / "Full Pipeline" at top of filters

### 3. Extract `isCuratedProject` to Shared Utility
**File: `frontend/src/lib/curatedFilter.ts`** (new)
- Move `isCuratedProject` function from ProjectList to shared module
- Import it in Dashboard, ProjectList, and ProjectTimeline
- This avoids code duplication

### 4. Timeline Data — Add Curated Fields
**File: `pipeline/exporters/export_json.py`** in `export_project_timeline()`
- Add `zombie_flag`, `has_scheme_contract`, `data_confidence`, `development_stage`, `technology` to timeline project records (some may already be there)
- This lets the frontend filter without needing a second data fetch

### 5. Mobile Dashboard Filters
**File: `Dashboard.tsx`**
- On mobile (`lg:` breakpoint), convert filter section to horizontal scrollable row per group (overflow-x-auto, no flex-wrap) so each filter row fits on one line
- Tech pills scroll horizontally instead of wrapping to 2 lines
- Alternative: collapse into a single "Filters" button that opens bottom sheet (matching ProjectList pattern)

### 6. Curated Note
- Already exists in ProjectList — ensure same note appears on Dashboard and Timeline
- Text: "Curated shows operating, commissioning and construction projects, plus development projects awarded a CIS or LTESA contract, with EPBC approval/submission, or medium+ data confidence. Offshore wind and zombie projects are excluded."
- Add benchmark line: "Benchmarks: AEMO tracks ~275 projects in the NEM connection queue; CEC reports ~142 committed/under construction."

---

## Files Modified
1. `frontend/src/lib/curatedFilter.ts` — **NEW** shared curated filter
2. `frontend/src/pages/Dashboard.tsx` — curated default + mobile scroll filters
3. `frontend/src/pages/ProjectList.tsx` — import from shared util instead of local function
4. `frontend/src/pages/ProjectTimeline.tsx` — curated toggle
5. `pipeline/exporters/export_json.py` — add missing fields to timeline export
6. `frontend/public/data/analytics/project-timeline.json` — regenerated

## Not Changed
- Curated filter logic itself — already correct per user requirements (CIS/LTESA always in, offshore always out)
- Mobile ProjectList filters — already uses bottom sheet pattern, works well
