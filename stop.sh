#!/usr/bin/env bash
# Arrête FluxTube proprement.
set -euo pipefail
cd "$(dirname "$0")"
PID_FILE=.fluxtube.pid
if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  kill "$(cat "$PID_FILE")"
  for _ in {1..20}; do kill -0 "$(cat "$PID_FILE")" 2>/dev/null || break; sleep 0.2; done
  echo "FluxTube arrêté"
else
  echo "FluxTube ne tournait pas"
fi
rm -f "$PID_FILE"
