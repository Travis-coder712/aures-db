#!/bin/bash
# =============================================================================
# Install AURES Pipeline launchd job
# =============================================================================
# Symlinks the plist into ~/Library/LaunchAgents/ and loads it.
# Run this once to set up weekly automated pipeline runs.
#
# Usage:
#   ./scripts/install-launchd.sh          # Install and load
#   ./scripts/install-launchd.sh --remove # Unload and remove
# =============================================================================

set -euo pipefail

PLIST_NAME="com.aures.pipeline.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

if [ "${1:-}" = "--remove" ]; then
    echo "Removing AURES Pipeline launchd job..."
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    rm -f "$PLIST_DEST"
    echo "Done. Automated pipeline runs disabled."
    exit 0
fi

# Make the pipeline script executable
chmod +x "$SCRIPT_DIR/aures-pipeline.sh"

# Create log directory
mkdir -p "$(dirname "$SCRIPT_DIR")/logs"

# Symlink plist
echo "Installing launchd job..."
if [ -L "$PLIST_DEST" ] || [ -f "$PLIST_DEST" ]; then
    echo "  Unloading existing job..."
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
    rm -f "$PLIST_DEST"
fi

ln -s "$PLIST_SRC" "$PLIST_DEST"
echo "  Symlinked to $PLIST_DEST"

# Load the job
launchctl load "$PLIST_DEST"
echo "  Loaded successfully."

echo ""
echo "AURES Pipeline scheduled:"
echo "  Schedule: Every Monday at 6:00 AM"
echo "  Script:   $SCRIPT_DIR/aures-pipeline.sh"
echo "  Logs:     $(dirname "$SCRIPT_DIR")/logs/"
echo ""
echo "To test now:  ./scripts/aures-pipeline.sh"
echo "To uninstall: ./scripts/install-launchd.sh --remove"
