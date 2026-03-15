#!/bin/bash
# =============================================================================
# AURES Pipeline — Automated data import & export
# =============================================================================
# Runs all pipeline steps that are due (based on frequency thresholds),
# exports updated JSON, and optionally commits + pushes changes.
#
# Usage:
#   ./scripts/aures-pipeline.sh          # Run with auto-commit
#   ./scripts/aures-pipeline.sh --dry    # Show what would run without executing
# =============================================================================

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$REPO_DIR/logs"
LOG_FILE="$LOG_DIR/pipeline-$(date +%F).log"
PYTHON="${PYTHON:-python3}"

# Ensure log directory
mkdir -p "$LOG_DIR"

# Source environment (API keys etc.)
if [ -f "$HOME/.zshrc" ]; then
    source "$HOME/.zshrc" 2>/dev/null || true
fi

echo "========================================" | tee -a "$LOG_FILE"
echo "AURES Pipeline Run — $(date)" | tee -a "$LOG_FILE"
echo "========================================" | tee -a "$LOG_FILE"

cd "$REPO_DIR"

# Check if dry run
DRY_RUN=false
if [ "${1:-}" = "--dry" ]; then
    DRY_RUN=true
    echo "DRY RUN — showing what would execute" | tee -a "$LOG_FILE"
fi

# Run pipeline with --auto flag (only runs steps that are due)
echo "" | tee -a "$LOG_FILE"
echo "Running pipeline (auto mode)..." | tee -a "$LOG_FILE"

if [ "$DRY_RUN" = true ]; then
    $PYTHON pipeline/admin.py --status 2>&1 | tee -a "$LOG_FILE"
else
    $PYTHON pipeline/admin.py --all 2>&1 | tee -a "$LOG_FILE"
    PIPELINE_EXIT=$?

    if [ $PIPELINE_EXIT -ne 0 ]; then
        echo "ERROR: Pipeline failed with exit code $PIPELINE_EXIT" | tee -a "$LOG_FILE"
        exit $PIPELINE_EXIT
    fi
fi

# Check if data files changed
echo "" | tee -a "$LOG_FILE"
CHANGES=$(git diff --name-only frontend/public/data/ 2>/dev/null | wc -l | tr -d ' ')
UNTRACKED=$(git ls-files --others --exclude-standard frontend/public/data/ 2>/dev/null | wc -l | tr -d ' ')
TOTAL_CHANGES=$((CHANGES + UNTRACKED))

if [ "$TOTAL_CHANGES" -gt 0 ]; then
    echo "Data changes detected: $CHANGES modified, $UNTRACKED new files" | tee -a "$LOG_FILE"

    if [ "$DRY_RUN" = false ]; then
        # Stage and commit
        git add frontend/public/data/
        git commit -m "data: auto-update $(date +%F)

Automated pipeline run — $TOTAL_CHANGES files updated.

Co-Authored-By: AURES Pipeline <noreply@aures.dev>" 2>&1 | tee -a "$LOG_FILE"

        # Push
        echo "Pushing to remote..." | tee -a "$LOG_FILE"
        git push 2>&1 | tee -a "$LOG_FILE"
        echo "Push complete." | tee -a "$LOG_FILE"
    else
        echo "DRY RUN — would commit and push $TOTAL_CHANGES data file changes" | tee -a "$LOG_FILE"
    fi
else
    echo "No data changes — nothing to commit." | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "Pipeline complete at $(date)" | tee -a "$LOG_FILE"
echo "Log: $LOG_FILE"
