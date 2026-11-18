#!/usr/bin/env bash
# MI-K VISION 3D: thin wrapper. The real launcher lives in KSV (single source of truth).
# MI-K 3D page = http://localhost:5176 (started by `ai`, see start_mik in ~/KSV/ai.sh).
# Usage: ./ai.sh [run|stop|restart]
# 3D page alone (no other service):  npm run dev -- --port 5176   (5173 belongs to the KSV UI)
set -u
LAUNCHER="${KSV_LAUNCHER:-$HOME/KSV/ai.sh}"
if [ ! -f "$LAUNCHER" ]; then
  echo "Launcher not found: $LAUNCHER (set KSV_LAUNCHER to override)" >&2
  exit 1
fi
exec bash "$LAUNCHER" "$@"
