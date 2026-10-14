# Cortadora de música del juego: pegas un enlace (o arrastras un mp3), eliges desde dónde suena y
# cuánto dura, y queda en musica/<tramo>.mp3 (con fundidos y volumen parejo).
# Eliges el tramo de una lista sacada del juego; si no tenía canción, se conecta solo en js/cortos.js.
# Uso: python3 tools/cortadora.py  →  http://localhost:8766
import http.server, json, pathlib, re, subprocess, tempfile, urllib.parse

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MUSICA = RAIZ / 'musica'

CORTOS = RAIZ / 'js/cortos.js'

# cortos que suenan por columna, no por nombre de tramo
ALIAS = {'PLAZA': 'PLAZA DE ARMAS', 'OJITOS CHINOS': 'BARRIO CHINO'}

def cortos():   # tramo → archivo que ya le asigna js/cortos.js
    return {ALIAS.get(m[1], m[1]): m[2] for m in re.finditer(r"'([^']+)':\s*\{\s*src: 'musica/([\w-]+)\.mp3'", CORTOS.read_text())}

def tramos():   # todos los tramos del juego, sacados de los `zones` de cada capítulo
    out, c = [], cortos()
    for n, f in enumerate([RAIZ / 'js/level.js'] + sorted((RAIZ / 'js').glob('cap*.js')), 1):
        for t in dict.fromkeys(re.findall(r"\{\s*x:[^,]+,\s*name:\s*'([^']+)'", f.read_text())):
            out.append({'cap': n, 'tramo': t, 'archivo': c.get(t)})
    return out

def slug(t):
    t = t.lower().translate(str.maketrans('áéíóúñü', 'aeiounu'))
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

def conectar(tramo, archivo, dura):   # agrega el tramo a CORTOS, antes de 'FINAL'
    txt = CORTOS.read_text()
    linea = f"  '{tramo}': {{ src: 'musica/{archivo}.mp3', desde: 0, dura: {round(dura)} }},   // puesto con la cortadora\n"
    i = txt.index("  'FINAL':")
    CORTOS.write_text(txt[:i] + linea + txt[i:])

PAGINA = '''<!doctype html><meta charset="utf-8"><title>Cortadora de música</title>
<style>
body{font:18px system-ui;max-width:680px;margin:40px auto;padding:0 16px;background:#111;color:#eee}
#drop{border:3px dashed #555;border-radius:14px;padding:40px;text-align:center;color:#aaa}
#drop.on{border-color:#e91e63;color:#fff}
audio{width:100%;margin:16px 0}
label{display:block;margin:12px 0 4px;color:#aaa;font-size:15px}
input,select{font:inherit;padding:8px;border-radius:8px;border:0;background:#222;color:#eee;width:100%;box-sizing:border-box}
button{font:inherit;padding:10px 18px;border:0;border-radius:8px;background:#e91e63;color:#fff;cursor:pointer;margin-top:16px}
#msg{margin-top:14px}
</style>
<h1>Cortadora de música</h1>
<input id="url" placeholder="Pega aquí el enlace de la canción"> <button id="traer">Traer canción</button>
<p style="color:#888;text-align:center">o</p>
<div id="drop">Arrastra aquí la canción (mp3)</div>
<div id="ed" hidden>
  <audio id="a" controls></audio>
  <button id="aqui">Que empiece aquí ▸ <span id="desde">0:00</span></button>
  <label>¿Cuántos segundos suena?</label><input id="dura" type="number" value="30" min="3" max="400">
  <label>¿Para qué tramo?</label>
  <select id="nombre"></select>
  <button id="oir">▶ Escuchar el corte</button> <button id="ok">Guardar en el juego</button>
  <div id="msg"></div>
</div>
<script>
const TRAMOS = __TRAMOS__;
let archivo, desde = 0;
const $ = id => document.getElementById(id), a = $('a');
$('nombre').innerHTML = TRAMOS.map(t => `<option value="${t.tramo}">Cap. ${t.cap} · ${t.tramo} — ${t.archivo ? 'reemplaza ' + t.archivo : 'sin canción'}</option>`).join('');
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const drop = $('drop');
drop.ondragover = e => { e.preventDefault(); drop.className = 'on'; };
drop.ondragleave = () => drop.className = '';
drop.ondrop = e => {
  e.preventDefault(); drop.className = '';
  const f = e.dataTransfer.files[0]; if (f) cargar(f, f.name);
};
function cargar(f, nombre) { archivo = f; drop.textContent = nombre; a.src = URL.createObjectURL(f); $('ed').hidden = false; }
$('traer').onclick = async () => {
  const url = $('url').value.trim(); if (!url) return;
  drop.textContent = 'Trayendo la canción… (puede tardar un minuto)';
  const r = await fetch('/traer?url=' + encodeURIComponent(url), {method: 'POST'});
  if (!r.ok) return drop.textContent = '✗ ' + await r.text();
  cargar(await r.blob(), decodeURIComponent(r.headers.get('X-Titulo') || 'canción'));
};
$('aqui').onclick = () => { desde = a.currentTime; $('desde').textContent = fmt(desde); };
let finOir;
$('oir').onclick = () => {
  a.currentTime = desde; a.play(); clearTimeout(finOir);
  finOir = setTimeout(() => a.pause(), +$('dura').value * 1000);
};
$('ok').onclick = async () => {
  const nombre = encodeURIComponent($('nombre').value);
  $('msg').textContent = 'Guardando…'; a.pause();
  const r = await fetch(`/guardar?nombre=${nombre}&desde=${desde}&dura=${$('dura').value}`, {method: 'POST', body: archivo});
  $('msg').textContent = r.ok ? '✓ ' + await r.text() : '✗ ' + await r.text();
};
</script>'''

class H(http.server.BaseHTTPRequestHandler):
    def responder(self, code, body):
        self.send_response(code); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.end_headers()
        self.wfile.write(body.encode())

    def do_GET(self):
        self.responder(200, PAGINA.replace('__TRAMOS__', json.dumps(tramos(), ensure_ascii=False)))

    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if self.path.startswith('/traer'):
            return self.traer(q.get('url', [''])[0])
        tramo = q.get('nombre', [''])[0]
        if tramo not in {t['tramo'] for t in tramos()}:
            return self.responder(400, 'tramo desconocido')
        nombre = cortos().get(tramo) or slug(tramo)
        desde, dura = float(q['desde'][0]), float(q['dura'][0])
        with tempfile.NamedTemporaryFile(suffix='.audio') as f:
            f.write(self.rfile.read(int(self.headers['Content-Length']))); f.flush()
            fade = min(1.5, dura / 4)
            r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(desde), '-t', str(dura), '-i', f.name,
                                '-af', f'afade=t=in:d={fade},afade=t=out:st={dura - fade}:d={fade},loudnorm=I=-16',
                                '-ar', '44100', '-b:a', '128k', MUSICA / f'{nombre}.mp3'], capture_output=True, text=True)
        if r.returncode:
            return self.responder(500, 'No se pudo cortar: ' + r.stderr[-300:])
        if tramo not in cortos():
            conectar(tramo, nombre, dura)
        self.responder(200, f'Listo: suena en {tramo}. Recarga el juego para oírla.')

    def traer(self, url):   # baja el audio del enlace con yt-dlp (brew install yt-dlp)
        if not re.match(r'https?://', url):
            return self.responder(400, 'Pega un enlace que empiece con https://')
        with tempfile.TemporaryDirectory() as d:
            r = subprocess.run(['yt-dlp', '-x', '--audio-format', 'mp3', '--no-playlist', '-o', f'{d}/%(title)s.%(ext)s', url],
                               capture_output=True, text=True)
            mp3 = next(pathlib.Path(d).glob('*.mp3'), None)
            if r.returncode or not mp3:
                return self.responder(500, 'No se pudo traer: ' + r.stderr[-300:])
            self.send_response(200); self.send_header('Content-Type', 'audio/mpeg')
            self.send_header('X-Titulo', urllib.parse.quote(mp3.stem)); self.end_headers()
            self.wfile.write(mp3.read_bytes())

print('Cortadora en http://localhost:8766')
http.server.HTTPServer(('127.0.0.1', 8766), H).serve_forever()
