// ranking.js — cliente del ranking (API en Cloudflare Workers + D1, ver api/).
// La URL de la API va en <meta name="ranking-api">. Si la API no está o no
// responde, el juego sigue igual: el ranking es un extra, nunca un bloqueo.

const RANKING = (() => {
  const meta = document.querySelector('meta[name="ranking-api"]');
  // solo para pruebas en local: ?api=http://localhost:8787 apunta a una API local
  const dbg = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? new URLSearchParams(location.search).get('api') : null;
  const API = (dbg != null ? dbg : meta ? meta.content : '').replace(/\/$/, '');
  const NAME_KEY = 'maraton-nombre';
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
      if (!r.ok) throw new Error(data.error || 'Error ' + r.status);
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
      <div class="err"></div><button type="submit">ENTRAR AL RANKING</button>
      <button type="button" class="ghost">AHORA NO</button></form>`;
    document.body.appendChild(form);
    return form;
  }

  return {
    enabled: () => !!API,
    name: () => store.get(NAME_KEY) || '',

    // al empezar un capítulo: pide el ticket sin frenar el juego
    start(chapter) {
      runId = null;
      if (!API) return;
      pending = call('/api/runs', { method: 'POST', body: JSON.stringify({ chapter }) })
        .then(d => { runId = d.runId; }).catch(() => { runId = null; });
    },

    async submit(name, timeMs, deaths) {
      store.set(NAME_KEY, name);
      await pending;
      if (!runId) throw new Error('Sin conexión con el ranking');
      const id = runId; runId = null;
      return call('/api/scores', { method: 'POST', body: JSON.stringify({ runId: id, name, timeMs: Math.round(timeMs), deaths }) });
    },

    top: (chapter, limit = 10) => call(`/api/scores?chapter=${chapter}&limit=${limit}`).then(d => d.scores),

    // pide el nombre y envía el puntaje; resuelve con el resultado o null si lo salta
    askAndSubmit(timeMs, deaths) {
      const f = ensureForm(), input = f.querySelector('input'), err = f.querySelector('.err');
      input.value = this.name(); err.textContent = '';
      f.classList.add('on'); setTimeout(() => input.focus(), 50);
      return new Promise(resolve => {
        const close = v => { f.classList.remove('on'); f.querySelector('form').onsubmit = null; resolve(v); };
        f.querySelector('.ghost').onclick = () => close(null);
        f.querySelector('form').onsubmit = async e => {
          e.preventDefault();
          err.textContent = 'Enviando…';
          try { close(await this.submit(input.value, timeMs, deaths)); }
          catch (x) { err.textContent = x.message; }
        };
      });
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
