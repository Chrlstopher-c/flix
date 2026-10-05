#!/usr/bin/env bash
# Démarre FluxTube : installe si besoin, compile le front, lance le serveur en arrière-plan.
set -euo pipefail
cd "$(dirname "$0")"
PID_FILE=.fluxtube.pid
mkdir -p logs && : > logs/server.log

if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "FluxTube tourne déjà (PID $(cat "$PID_FILE"))"; exit 0
fi
[[ -f .env ]] || { cp .env.example .env; echo "⚠ .env créé depuis .env.example : renseigne TMDB_API_KEY"; exit 1; }
[[ -d node_modules ]] || pnpm install --frozen-lockfile
[[ "${SKIP_BUILD:-0}" == 1 && -d dist ]] || pnpm build > logs/build.log 2>&1

set -a; . ./.env; set +a
NODE_ENV=production nohup bun server/main.ts >> logs/server.log 2>&1 &
echo $! > "$PID_FILE"
sleep 1
kill -0 "$(cat "$PID_FILE")" 2>/dev/null || { echo "Échec du démarrage :"; tail -20 logs/server.log; exit 1; }
echo "FluxTube → http://localhost:${PORT:-8490}  (logs : logs/server.log)"
