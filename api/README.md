# API del ranking

Cloudflare Worker + D1. El juego la llama desde `js/ranking.js`; su URL va en
`<meta name="ranking-api">` de `index.html`. Si la API no responde, el juego
sigue normal (el ranking es un extra).

## Local

```bash
cp .env.example .env            # deja D1_DATABASE_ID=local
cp .dev.vars.example .dev.vars
./run.sh d1 execute maraton-andes --local --file schema.sql
./run.sh dev --local --var MIN_TIME_MS:1000
./smoke.sh                      # pruebas contra http://localhost:8787
```

## Producción

```bash
npx wrangler@4 login
./run.sh d1 create maraton-andes          # pega el id en .env (D1_DATABASE_ID)
./run.sh d1 execute maraton-andes --remote --file schema.sql
./run.sh secret put IP_SALT               # cualquier texto largo y aleatorio
./run.sh deploy
```

`run.sh` genera `wrangler.toml` desde `wrangler.template.toml` con los valores de
`.env`: ningún id ni secreto queda en git.

## Anti-trampa

Cada partida pide un ticket (`POST /api/runs`) al empezar. Al terminar
(`POST /api/scores`) el servidor rechaza tiempos menores a `MIN_TIME_MS`,
mayores al tiempo real transcurrido desde el ticket, tickets ya usados o de otra
IP, y nombres groseros. Las IP se guardan solo como hash con sal.

## Jugadores y medición

Cada partida puede traer `playerId` (uuid anónimo del navegador) y `name`; se guardan en `runs`.
`GET /api/stats` devuelve solo agregados (jugadores únicos, partidas y ganadas por capítulo, jugadores
por día en 14 días). Una base creada antes de este cambio necesita la migración:

```bash
./run.sh d1 execute maraton-andes --remote --file migrations/001-jugadores.sql
```

"Ganadas" cuenta partidas cuyo puntaje se envió al ranking.
