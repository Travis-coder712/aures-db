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

**End-of-session checklist:**
- Update `docs/NEXT_SESSION_HANDOFF.md` with new version + what shipped
- Update `docs/INTELLIGENCE_LAYER_PLAN.md` release log
- Update Studio Dashboard (`~/Studio/Dashboard.html`) — AURES card version + description
- Update Studio public (`~/Studio/studio-public/index.html`) — AURES card version + description
- Push Studio public if changed: `cd ~/Studio/studio-public && git add -A && git commit -m "update AURES version" && git push`
