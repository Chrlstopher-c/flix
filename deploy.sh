#!/usr/bin/env bash
# Compile ici puis envoie sur le serveur cible et redémarre le service. Cible lue dans .env.deploy (non suivi) :
#   DEPLOY_HOST=alias-ssh   DEPLOY_DIR=/chemin/distant   DEPLOY_SERVICE=fluxtube
set -euo pipefail
cd "$(dirname "$0")"
[[ -f .env.deploy ]] || { echo ".env.deploy manquant (DEPLOY_HOST, DEPLOY_DIR, DEPLOY_SERVICE)"; exit 1; }
. ./.env.deploy
pnpm install --frozen-lockfile
pnpm lint && pnpm typecheck && pnpm test && pnpm build
rsync -a --delete --exclude data --exclude logs --exclude .env --exclude .env.deploy --exclude .git --exclude '*.pid' \
  ./ "$DEPLOY_HOST:$DEPLOY_DIR/"
ssh "$DEPLOY_HOST" "sudo -n systemctl restart $DEPLOY_SERVICE && sleep 2 && systemctl is-active $DEPLOY_SERVICE"
