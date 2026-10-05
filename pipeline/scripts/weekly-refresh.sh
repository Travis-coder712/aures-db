#!/bin/zsh
# AURES Weekly Local Refresh
# Invoked by the com.aures.weekly-refresh LaunchAgent every Monday 07:00.
# Runs smart_refresh.py, then commits and pushes the updated JSON files.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_PREFIX="[$(date '+%Y-%m-%d %H:%M:%S')]"

echo "$LOG_PREFIX ── AURES weekly refresh starting ──"
cd "$REPO_ROOT"

# Load zshrc so OPENELECTRICITY_API_KEY is available
source ~/.zshrc 2>/dev/null || true

# ── Phase 1: data refresh (smart_refresh handles API quota logic) ──
echo "$LOG_PREFIX Running smart_refresh --phase all ..."
python3 pipeline/smart_refresh.py --phase all
echo "$LOG_PREFIX smart_refresh complete."

# ── Phase 2: commit updated data files ──
git add frontend/public/data/ data/gi_snapshots/ 2>/dev/null || true

if git diff --cached --quiet; then
    echo "$LOG_PREFIX No data changes to commit."
else
    STAMP="$(date -u '+%Y-%m-%d')"
    git commit -m "data: weekly refresh ${STAMP}

Auto-committed by com.aures.weekly-refresh LaunchAgent.
Refresh phases: data + intelligence.
See pipeline/logs/weekly-refresh.log for detail."
    git push
    echo "$LOG_PREFIX Committed and pushed data refresh."
fi

echo "$LOG_PREFIX ── AURES weekly refresh complete ──"
