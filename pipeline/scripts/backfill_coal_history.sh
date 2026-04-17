#!/usr/bin/env bash
# Backfill 5 years of coal dispatch history from NEMWEB MMSDM archives.
#
# OpenElectricity's free tier caps history at 367 days, so to build a proper
# 5-year YTD-vs-same-period comparison we fall back to AEMO's MMSDM archive
# (free, public, ~50-100 MB per month). This script loops over every month in
# the chosen range and calls import_dispatchload.py --month YYYY-MM. The
# importer's UNIQUE(settlement_date, duid) constraint auto-skips months already
# ingested, so re-running is safe.
#
# Usage:
#   pipeline/scripts/backfill_coal_history.sh                 # 2021-01 → 2025-12
#   pipeline/scripts/backfill_coal_history.sh 2023 2025       # custom range
#
# Expect ~30-60 min runtime and ~3 GB of temporary download across 5 years.

set -euo pipefail

START_YEAR="${1:-2021}"
END_YEAR="${2:-2025}"

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
IMPORTER="$ROOT_DIR/pipeline/importers/import_dispatchload.py"

if [[ ! -f "$IMPORTER" ]]; then
  echo "! Cannot find $IMPORTER" >&2
  exit 1
fi

echo "Backfilling coal dispatch history: $START_YEAR-01 → $END_YEAR-12"
echo "Script root: $ROOT_DIR"

cd "$ROOT_DIR"

for (( year=START_YEAR; year<=END_YEAR; year++ )); do
  for month in 01 02 03 04 05 06 07 08 09 10 11 12; do
    target="${year}-${month}"
    echo ""
    echo "========== $target =========="
    # Run and keep going even if an individual month fails (e.g. NEMWEB
    # transient 503). Log failures; final summary reports which are missing.
    if python3 "$IMPORTER" --month "$target"; then
      echo "✓ $target OK"
    else
      echo "! $target FAILED — continuing"
    fi
  done
done

echo ""
echo "Backfill loop complete. Summary of months present in dispatch_availability:"
sqlite3 "$ROOT_DIR/database/aures.db" \
  "SELECT SUBSTR(settlement_date, 1, 7), COUNT(*) FROM dispatch_availability
   GROUP BY SUBSTR(settlement_date, 1, 7)
   ORDER BY 1;"
