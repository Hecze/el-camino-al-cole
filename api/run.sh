#!/usr/bin/env bash
# Uso: ./run.sh dev | deploy | <cualquier comando de wrangler>
# Lee .env, genera wrangler.toml desde la plantilla y llama a wrangler.
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a
# token de la cuenta personal (h18m), separado del token de trabajo
[ -n "${CLOUDFLARE_API_TOKEN_H18M:-}" ] && export CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN_H18M"
: "${D1_DATABASE_ID:=local}" "${ALLOWED_ORIGINS:=http://localhost:8000}" "${MIN_TIME_MS:=30000}"
sed -e "s|\${D1_DATABASE_ID}|$D1_DATABASE_ID|" -e "s|\${ALLOWED_ORIGINS}|$ALLOWED_ORIGINS|" -e "s|\${MIN_TIME_MS}|$MIN_TIME_MS|" \
  wrangler.template.toml > wrangler.toml
exec npx -y wrangler@4 "$@"
