#!/usr/bin/env bash
# Redémarre Flix (logs remis à zéro).
set -euo pipefail
cd "$(dirname "$0")"
./stop.sh
./start.sh
