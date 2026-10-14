-- Registro de jugadores: id anónimo y nombre en cada partida. Aditiva: no toca datos existentes.
-- Solo para bases creadas antes de este cambio (schema.sql ya las trae en bases nuevas).
ALTER TABLE runs ADD COLUMN player_id TEXT;
ALTER TABLE runs ADD COLUMN player_name TEXT;
CREATE INDEX IF NOT EXISTS runs_by_day ON runs (started_at);
