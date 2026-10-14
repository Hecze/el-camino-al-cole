#!/usr/bin/env bash
# Publica el juego (lo commiteado en HEAD) en Cloudflare: https://maraton-andes.haroldmedrano33.workers.dev
# Uso: tools/publicar.sh   (usa el login de wrangler de la cuenta Harold18m, igual que api/run.sh)
set -euo pipefail
cd "$(dirname "$0")/.."
d=$(mktemp -d); trap 'rm -rf "$d"' EXIT
git archive HEAD | tar -x -C "$d/" && mkdir "$d/sitio" && (cd "$d" && mv css img js musica voces index.html *.png *.ico sitio/) && rm -rf "$d/sitio/voces/crudos"
unset CLOUDFLARE_API_TOKEN CF_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID=fa21477007610346907b3d43843094c5
cd "$d" && npx -y wrangler@4 deploy --assets sitio --name maraton-andes --compatibility-date 2025-09-01
