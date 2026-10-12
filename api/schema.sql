-- Ranking de La Maratón de los Andes (Cloudflare D1 / SQLite)

-- Cada partida pide un ticket al empezar; el puntaje solo se acepta contra un ticket vivo.
CREATE TABLE IF NOT EXISTS runs (
  id         TEXT PRIMARY KEY,
  chapter    INTEGER NOT NULL,
  started_at INTEGER NOT NULL,          -- ms epoch, hora del servidor
  ip_hash    TEXT NOT NULL,             -- sha-256(ip + sal), nunca la IP
  finished   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS runs_by_ip ON runs (ip_hash, started_at);

CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id     TEXT NOT NULL UNIQUE REFERENCES runs (id),
  chapter    INTEGER NOT NULL,
  name       TEXT NOT NULL,
  name_key   TEXT NOT NULL,             -- nombre normalizado: una fila del ranking por jugador
  time_ms    INTEGER NOT NULL,
  deaths     INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS scores_board ON scores (chapter, name_key, time_ms);
