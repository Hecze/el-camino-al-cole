# Cortadora de música del juego: arrastras un mp3, eliges desde dónde suena y
# cuánto dura, y queda en musica/<nombre>.mp3 (con fundidos y volumen parejo).
# Si el nombre ya está en js/cortos.js, el juego lo usa al tiro; si es nuevo, hay que conectarlo.
# Uso: python3 tools/cortadora.py  →  http://localhost:8766
import http.server, json, pathlib, re, subprocess, tempfile, urllib.parse

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MUSICA = RAIZ / 'musica'

def usados():   # nombres de archivo que js/cortos.js ya usa, con su tramo
    txt = (RAIZ / 'js/cortos.js').read_text()
    return [[m[1], m[2]] for m in re.finditer(r"'([^']+)':\s*\{\s*src: 'musica/([\w-]+)\.mp3'", txt)]

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
<div id="drop">Arrastra aquí la canción (mp3)</div>
<div id="ed" hidden>
  <audio id="a" controls></audio>
  <button id="aqui">Que empiece aquí ▸ <span id="desde">0:00</span></button>
  <label>¿Cuántos segundos suena?</label><input id="dura" type="number" value="30" min="3" max="400">
  <label>¿Para qué tramo?</label>
  <select id="nombre"></select>
  <input id="nuevo" placeholder="nombre-nuevo (ej. iquitos-el-sonido-de-la-selva)" hidden>
  <button id="oir">▶ Escuchar el corte</button> <button id="ok">Guardar en el juego</button>
  <div id="msg"></div>
</div>
<script>
const USADOS = __USADOS__;
let archivo, desde = 0;
const $ = id => document.getElementById(id), a = $('a');
$('nombre').innerHTML = USADOS.map(([t, n]) => `<option value="${n}">${t} (${n})</option>`).join('') + '<option value="">Otro (nombre nuevo)…</option>';
$('nombre').onchange = () => $('nuevo').hidden = !!$('nombre').value;
const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
const drop = $('drop');
drop.ondragover = e => { e.preventDefault(); drop.className = 'on'; };
drop.ondragleave = () => drop.className = '';
drop.ondrop = e => {
  e.preventDefault(); drop.className = '';
  archivo = e.dataTransfer.files[0]; if (!archivo) return;
  drop.textContent = archivo.name; a.src = URL.createObjectURL(archivo); $('ed').hidden = false;
};
$('aqui').onclick = () => { desde = a.currentTime; $('desde').textContent = fmt(desde); };
let finOir;
$('oir').onclick = () => {
  a.currentTime = desde; a.play(); clearTimeout(finOir);
  finOir = setTimeout(() => a.pause(), +$('dura').value * 1000);
};
$('ok').onclick = async () => {
  const nombre = $('nombre').value || $('nuevo').value.trim();
  if (!/^[a-z0-9-]+$/.test(nombre)) return $('msg').textContent = 'El nombre solo puede tener minúsculas, números y guiones.';
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
        self.responder(200, PAGINA.replace('__USADOS__', json.dumps(usados(), ensure_ascii=False)))

    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        nombre = q.get('nombre', [''])[0]
        if not re.fullmatch(r'[a-z0-9-]+', nombre):
            return self.responder(400, 'nombre inválido')
        desde, dura = float(q['desde'][0]), float(q['dura'][0])
        with tempfile.NamedTemporaryFile(suffix='.audio') as f:
            f.write(self.rfile.read(int(self.headers['Content-Length']))); f.flush()
            fade = min(1.5, dura / 4)
            r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(desde), '-t', str(dura), '-i', f.name,
                                '-af', f'afade=t=in:d={fade},afade=t=out:st={dura - fade}:d={fade},loudnorm=I=-16',
                                '-ar', '44100', '-b:a', '128k', MUSICA / f'{nombre}.mp3'], capture_output=True, text=True)
        if r.returncode:
            return self.responder(500, 'No se pudo cortar: ' + r.stderr[-300:])
        conectado = any(n == nombre for _, n in usados())
        self.responder(200, f'Guardado en musica/{nombre}.mp3. ' + (
            'Ya suena en el juego (recarga la página del juego).' if conectado else 'Es nuevo: pídele a Claude que lo conecte a su tramo.'))

print('Cortadora en http://localhost:8766')
http.server.HTTPServer(('127.0.0.1', 8766), H).serve_forever()
