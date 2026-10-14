// API del ranking — Cloudflare Worker + D1.
//   POST /api/runs            { chapter }                      -> { runId }
//   POST /api/scores          { runId, name, timeMs, deaths }  -> { rank, total, best }
//   GET  /api/scores?chapter=1&limit=20                        -> { scores: [...] }
// El juego pide un ticket al empezar; al terminar, el servidor comprueba que
// el tiempo reportado sea creíble contra su propio reloj.

const CHAPTERS = [1, 2, 3, 4];
const MAX_TIME_MS = 2 * 60 * 60 * 1000;   // una partida de más de 2 h no cuenta
const RUN_TTL_MS = 3 * 60 * 60 * 1000;    // un ticket vale 3 h
const CLOCK_SLACK_MS = 3000;              // latencia entre el juego y el servidor
const RUNS_PER_10_MIN = 40;               // por IP
// ponytail: lista corta de groserías; si se cuela algo, ampliar o moderar a mano en D1
const BLOCKED = ['puta', 'puto', 'mierda', 'conchatu', 'ctm', 'huevon', 'cojud', 'pinga', 'verga', 'maricon', 'cabro', 'chucha', 'pendej', 'imbecil', 'idiota', 'nazi'];

export default {
  async fetch(req, env) {
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    try {
      const url = new URL(req.url);
      const res = await route(req, env, url);
      for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status, cors);
      console.error(e);
      return json({ error: 'Algo falló en el servidor' }, 500, cors);
    }
  },
};

async function route(req, env, url) {
  const p = url.pathname;
  if (p === '/api/health') return json({ ok: true });
  if (p === '/api/runs' && req.method === 'POST') return startRun(req, env);
  if (p === '/api/scores' && req.method === 'POST') return submitScore(req, env);
  if (p === '/api/scores' && req.method === 'GET') return leaderboard(env, url);
  throw new HttpError(404, 'No existe');
}

async function startRun(req, env) {
  const { chapter } = await body(req);
  if (!CHAPTERS.includes(chapter)) throw new HttpError(400, 'Capítulo inválido');
  const ip = await ipHash(req, env), now = Date.now();
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM runs WHERE ip_hash = ? AND started_at > ?').bind(ip, now - 10 * 60 * 1000).first();
  if (n >= RUNS_PER_10_MIN) throw new HttpError(429, 'Demasiadas partidas, espera un ratito');
  const runId = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO runs (id, chapter, started_at, ip_hash) VALUES (?, ?, ?, ?)').bind(runId, chapter, now, ip).run();
  return json({ runId });
}

async function submitScore(req, env) {
  const { runId, name, timeMs, deaths = 0 } = await body(req);
  if (typeof runId !== 'string') throw new HttpError(400, 'Falta el ticket de la partida');
  const clean = cleanName(name);
  if (!Number.isInteger(timeMs) || !Number.isInteger(deaths) || deaths < 0 || deaths > 9999) throw new HttpError(400, 'Datos inválidos');

  const run = await env.DB.prepare('SELECT * FROM runs WHERE id = ?').bind(runId).first();
  const now = Date.now(), minMs = Number(env.MIN_TIME_MS || 30000);
  if (!run || run.ip_hash !== await ipHash(req, env)) throw new HttpError(403, 'Ticket inválido');
  if (run.finished) throw new HttpError(409, 'Esta partida ya se registró');
  if (now - run.started_at > RUN_TTL_MS) throw new HttpError(410, 'La partida expiró');
  // el tiempo no puede ser menor que el mínimo creíble ni mayor que lo que pasó de verdad
  if (timeMs < minMs || timeMs > MAX_TIME_MS || timeMs > now - run.started_at + CLOCK_SLACK_MS) throw new HttpError(422, 'Ese tiempo no cuadra');

  // marcar el ticket como usado de forma atómica: si dos envíos compiten, solo uno pasa
  const claimed = await env.DB.prepare('UPDATE runs SET finished = 1 WHERE id = ? AND finished = 0').bind(runId).run();
  if (!claimed.meta.changes) throw new HttpError(409, 'Esta partida ya se registró');
  await env.DB.prepare('INSERT INTO scores (run_id, chapter, name, name_key, time_ms, deaths, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(runId, run.chapter, clean, nameKey(clean), timeMs, deaths, now).run();

  const best = await env.DB.prepare('SELECT MIN(time_ms) AS t FROM scores WHERE chapter = ? AND name_key = ?').bind(run.chapter, nameKey(clean)).first();
  const { rank } = await env.DB.prepare(
    'SELECT COUNT(*) + 1 AS rank FROM (SELECT MIN(time_ms) AS t FROM scores WHERE chapter = ? GROUP BY name_key) WHERE t < ?'
  ).bind(run.chapter, best.t).first();
  const { total } = await env.DB.prepare('SELECT COUNT(DISTINCT name_key) AS total FROM scores WHERE chapter = ?').bind(run.chapter).first();
  return json({ rank, total, best: best.t, newBest: best.t === timeMs });
}

async function leaderboard(env, url) {
  const chapter = Number(url.searchParams.get('chapter'));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 20));
  if (!CHAPTERS.includes(chapter)) throw new HttpError(400, 'Capítulo inválido');
  // SQLite devuelve name/deaths de la fila con el MIN: el mejor tiempo de cada jugador
  const { results } = await env.DB.prepare(
    'SELECT name, MIN(time_ms) AS timeMs, deaths FROM scores WHERE chapter = ? GROUP BY name_key ORDER BY timeMs ASC LIMIT ?'
  ).bind(chapter, limit).all();
  return json({ scores: results }, 200, { 'Cache-Control': 'public, max-age=15' });
}

// ── utilidades ──────────────────────────────────────────────────────────────
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });
}

async function body(req) {
  if (Number(req.headers.get('Content-Length') || 0) > 2048) throw new HttpError(413, 'Muy grande');
  try { return await req.json(); } catch { throw new HttpError(400, 'JSON inválido'); }
}

export function cleanName(raw) {
  if (typeof raw !== 'string') throw new HttpError(400, 'Falta tu nombre');
  const name = raw.normalize('NFC').replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim();
  if (name.length < 2 || name.length > 16) throw new HttpError(400, 'Tu nombre debe tener entre 2 y 16 letras');
  const plain = nameKey(name).replace(/[^a-z]/g, '');
  if (BLOCKED.some(w => plain.includes(w))) throw new HttpError(400, 'Elige otro nombre');
  return name;
}
export const nameKey = n => n.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

async function ipHash(req, env) {
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip + (env.IP_SALT || 'dev-salt')));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function corsHeaders(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}
