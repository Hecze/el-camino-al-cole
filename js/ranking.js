// ranking.js — cliente del ranking (API en Cloudflare Workers + D1, ver api/).
// La URL de la API va en <meta name="ranking-api">. Si la API no está o no
// responde, el juego sigue igual: el ranking es un extra, nunca un bloqueo.

const RANKING = (() => {
  const meta = document.querySelector('meta[name="ranking-api"]');
  // solo para pruebas en local: ?api=http://localhost:8787 apunta a una API local
  const dbg = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? new URLSearchParams(location.search).get('api') : null;
  const API = (dbg != null ? dbg : meta ? meta.content : '').replace(/\/$/, '');
  const NAME_KEY = 'maraton-nombre';
  const ID_KEY = 'maraton-jugador', CAP_KEY = 'maraton-cap';
  // ponytail: copia de la lista del worker; si cambia allá, cambiarla aquí
  const BLOCKED = ['puta', 'puto', 'mierda', 'conchatu', 'ctm', 'huevon', 'cojud', 'pinga', 'verga', 'maricon', 'cabro', 'chucha', 'pendej', 'imbecil', 'idiota', 'nazi'];
  let runId = null, pending = null;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
  };

  async function call(path, opts = {}) {
    if (!API) throw new Error('Ranking desactivado');
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 6000);
    try {
      const r = await fetch(API + path, { ...opts, signal: ctrl.signal, headers: { 'Content-Type': 'application/json' } });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw Object.assign(new Error(data.error || 'Error ' + r.status), { status: r.status });
      return data;
    } finally { clearTimeout(timer); }
  }

  // ── formulario del nombre: un <input> HTML encima del canvas (el teclado
  //    del celular solo aparece con un input de verdad) ──────────────────────
  let form = null;
  function ensureForm() {
    if (form) return form;
    const css = document.createElement('style');
    css.textContent = `
      #rkForm{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:#0008;z-index:50;font-family:monospace}
      #rkForm.on{display:flex}
      #rkForm form{background:#2b1d3a;border:3px solid #ffd166;padding:18px;display:flex;flex-direction:column;gap:10px;width:min(320px,86vw)}
      #rkForm label{color:#ffd166;font-weight:bold;text-align:center}
      #rkForm input{font:inherit;font-size:18px;padding:8px;border:2px solid #fff3d6;background:#1b1426;color:#fff3d6;text-align:center}
      #rkForm button{font:inherit;font-size:16px;font-weight:bold;padding:10px;border:0;background:#ffd166;color:#2b1d3a;cursor:pointer}
      #rkForm button.ghost{background:transparent;color:#cdbde8}
      #rkForm .err{color:#ff8fa3;min-height:1em;text-align:center;font-size:13px}`;
    document.head.appendChild(css);
    form = document.createElement('div');
    form.id = 'rkForm';
    form.innerHTML = `<form><label for="rkName">¿CÓMO TE LLAMAS?</label>
      <input id="rkName" maxlength="16" autocomplete="nickname" placeholder="Tu nombre">
      <div class="err"></div><button type="submit"></button>
      <button type="button" class="ghost"></button></form>`;
    document.body.appendChild(form);
    return form;
  }

  // Pregunta el nombre. opts: ok (texto del botón), skip (texto del botón para saltar; sin él
  // no se puede salir), error (aviso inicial), save(name) (async; si lanza, el error se muestra).
  // Resuelve con lo que devuelva save, o null si lo salta.
  function askName({ ok, skip, error = '', save }) {
    const f = ensureForm(), form = f.querySelector('form'), input = f.querySelector('input'), err = f.querySelector('.err');
    const [okBtn, skipBtn] = f.querySelectorAll('button');
    input.value = store.get(NAME_KEY) || ''; err.textContent = error;
    okBtn.textContent = ok; skipBtn.textContent = skip || ''; skipBtn.style.display = skip ? '' : 'none';
    f.classList.add('on'); setTimeout(() => input.focus(), 50);
    return new Promise(resolve => {
      const close = v => { f.classList.remove('on'); form.onsubmit = null; resolve(v); };
      skipBtn.onclick = () => close(null);
      form.onsubmit = async e => {
        e.preventDefault();
        try { err.textContent = ''; close(await save(input.value)); }
        catch (x) { err.textContent = x.message; f.classList.add('on'); }
      };
    });
  }

  // mismas reglas que el worker (api/src/index.js cleanName): 2 a 16 letras, sin groserías
  function validName(raw) {
    const name = String(raw).normalize('NFC').replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim();
    if (name.length < 2 || name.length > 16) throw new Error('Tu nombre debe tener entre 2 y 16 letras');
    const plain = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z]/g, '');
    if (BLOCKED.some(w => plain.includes(w))) throw new Error('Elige otro nombre');
    return name;
  }

  // id anónimo del jugador, para contar cuántas personas juegan
  function playerId() {
    let id = store.get(ID_KEY);
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
      store.set(ID_KEY, id);
    }
    return id;
  }

  return {
    enabled: () => !!API,
    name: () => store.get(NAME_KEY) || '',

    // registro: pregunta el nombre (obligatorio si es la primera vez; con skip se puede cancelar)
    register(skip) {
      return askName({ ok: skip ? 'GUARDAR' : '¡A JUGAR!', skip, save: async n => { const v = validName(n); store.set(NAME_KEY, v); return v; } });
    },

    // partida guardada: índice (0 = Cap. 1) del capítulo a continuar, o null si no hay
    saved() { const n = parseInt(store.get(CAP_KEY), 10); return n >= 0 ? n : null; },
    // guarda el avance; nunca retrocede (salvo reset)
    saveChapter(idx) { const s = this.saved(); if (s == null || idx > s) store.set(CAP_KEY, String(idx)); },
    resetProgress() { store.set(CAP_KEY, ''); },

    // al empezar un capítulo: pide el ticket sin frenar el juego (con el id y nombre para medir)
    start(chapter) {
      runId = null;
      if (!API) return;
      pending = call('/api/runs', { method: 'POST', body: JSON.stringify({ chapter, playerId: playerId(), name: this.name() || undefined }) })
        .then(d => { runId = d.runId; }).catch(() => { runId = null; });
    },

    async submit(name, timeMs, deaths) {
      await pending;
      if (!runId) throw new Error('Sin conexión con el ranking');
      const res = await call('/api/scores', { method: 'POST', body: JSON.stringify({ runId, name, timeMs: Math.round(timeMs), deaths }) });
      runId = null; store.set(NAME_KEY, name);
      return res;
    },

    top: (chapter, limit = 10) => call(`/api/scores?chapter=${chapter}&limit=${limit}`).then(d => d.scores),

    // envía el puntaje con el nombre ya guardado; solo si el servidor lo rechaza (nombre inválido)
    // vuelve a preguntarlo. Resuelve con el resultado o null si lo salta.
    async askAndSubmit(timeMs, deaths) {
      try { return await this.submit(this.name(), timeMs, deaths); }
      catch (e) {
        if (e.status !== 400) throw e;
        return askName({ ok: 'ENTRAR AL RANKING', skip: 'AHORA NO', error: e.message, save: async n => { const v = validName(n); return this.submit(v, timeMs, deaths); } });
      }
    },

    // compartir: menú nativo en el celular; en la compu copia el texto con el link
    async share(text) {
      const url = location.origin + location.pathname;
      try { if (navigator.share) { await navigator.share({ text, url }); return 'shared'; } }
      catch (e) { if (e.name === 'AbortError') return 'cancel'; }
      try { await navigator.clipboard.writeText(`${text} ${url}`); return 'copied'; } catch { return 'fail'; }
    },
    whatsappUrl: text => `https://wa.me/?text=${encodeURIComponent(`${text} ${location.origin + location.pathname}`)}`,
    // el reto exige el hashtag en la publicación
    shareText: (clock, chapterName) => `Llegué al cole a las ${clock} en "${chapterName}" de La Maratón de los Andes 🎒🦙 ¿Me ganas? #HackTheAndes`,
  };
})();
