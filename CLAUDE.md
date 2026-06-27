# AURES — Claude Code project root

**Before doing any work in this repo**, read `docs/SESSION_OPENER.md`
and follow it end-to-end. It covers:

- Project structure and architecture
- Recent state and release workflow (including the critical
  `package.json` + `version.json` sync rule)
- User preferences and behavioural rules
- Reusable components and key files
- Database schema + naming conventions
- Common gotchas (React, Recharts, TS, PDF tuning)
- Health-check commands to run at session start

Authoritative plan + handoff docs live in `docs/`:
`INTELLIGENCE_LAYER_PLAN.md` (release log + plan) and
`NEXT_SESSION_HANDOFF.md` (current backlog + gotchas).

User: Travis Hughes (`travishughes@outlook.com`). Mobile-first, dark
theme, comprehensive features. No emojis unless explicitly asked.
Don't commit without explicit user request.

**Scheme data gotcha — project_id mismatch:**
When adding projects to `CIS_PROJECTS` or `LTESA_PROJECTS` in
`frontend/src/data/scheme-rounds.ts`, the `project_id` field MUST
exactly match the `id` column in the `projects` SQLite table. Verify
with: `sqlite3 database/aures.db "SELECT id FROM projects WHERE name
LIKE '%ProjectName%'"`. Mismatches silently break the status flow to
project detail cards and the Pipeline Overview funnel. Run the audit:
`grep "project_id:" frontend/src/data/scheme-rounds.ts | sed "s/.*project_id: '//;s/'.*//" | sort -u > /tmp/pids.txt && sqlite3 database/aures.db "SELECT id FROM projects WHERE id IN ($(cat /tmp/pids.txt | sed "s/^/'/;s/$/'/" | tr '\n' ',' | sed 's/,$//'))" | sort > /tmp/found.txt && comm -23 /tmp/pids.txt /tmp/found.txt`

**End-of-session checklist:**
- Update `docs/NEXT_SESSION_HANDOFF.md` with new version + what shipped
- Update `docs/INTELLIGENCE_LAYER_PLAN.md` release log
- Update Studio Dashboard (`~/Studio/Dashboard.html`) — AURES card version + description
- Update Studio public (`~/Studio/studio-public/index.html`) — AURES card version + description
- Push Studio public if changed: `cd ~/Studio/studio-public && git add -A && git commit -m "update AURES version" && git push`
