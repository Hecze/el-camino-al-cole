#!/usr/bin/env bash
# Prueba de humo contra la API (local: ./run.sh dev --local con MIN_TIME_MS=1000)
set -u
API=${API:-http://localhost:8787}
fail=0
check() { if [ "$2" = "$3" ]; then echo "ok   $1"; else echo "FAIL $1 (esperaba $3, llegó $2) $(cat /tmp/smoke_body)"; fail=1; fi; }
post() { curl -s -o /tmp/smoke_body -w '%{http_code}' -X POST "$API$1" -H 'Content-Type: application/json' --data-binary "$2"; }
score() { post /api/scores "{\"runId\":\"$1\",\"name\":\"$2\",\"timeMs\":$3,\"deaths\":${4:-0}}"; }
run() { post /api/runs "{\"chapter\":$1}" >/dev/null; python3 -c "import json;print(json.load(open('/tmp/smoke_body'))['runId'])"; }

check "capítulo inválido" "$(post /api/runs '{"chapter":9}')" 400
R=$(run 1)
check "tiempo bajo el mínimo" "$(score "$R" Rapidin 500)" 422
check "tiempo mayor al real" "$(score "$R" Rapidin 600000)" 422
check "nombre grosero" "$(score "$R" 'Huevón 99' 1500)" 400
check "nombre muy corto" "$(score "$R" x 1500)" 400
check "ticket falso" "$(score nope Ana 1500)" 403
sleep 1.6
N="Smoke$RANDOM"
check "puntaje válido" "$(score "$R" "$N" 1500 2)" 200
check "ticket reusado" "$(score "$R" "$N" 1400)" 409
R2=$(run 1); sleep 1.3
check "segundo jugador" "$(score "$R2" "Otro$RANDOM" 1200)" 200
check "ranking" "$(curl -s -o /tmp/smoke_body -w '%{http_code}' "$API/api/scores?chapter=1")" 200
grep -q "$N" /tmp/smoke_body && echo "ok   aparece en el ranking" || { echo "FAIL no aparece en el ranking"; fail=1; }
check "CORS" "$(curl -s -D - -o /dev/null -H 'Origin: http://localhost:8000' "$API/api/scores?chapter=1" | grep -ci 'access-control-allow-origin: http://localhost:8000')" 1
exit $fail
