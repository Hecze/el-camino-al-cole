// voice.js — VOCES: clips de audio grabados para tres eventos del juego.
//   VOICE.play('muerte' | 'tarde' | 'gana', retrasoMs)
// La lista de archivos está en voces/manifest.js (VOICE_MANIFEST). Los clips se
// descargan al cargar la página sin bloquear nada y se decodifican cuando ya hay
// contexto de audio. Si falta un archivo, ese clip simplemente no suena. Suenan
// por AUDIO.voiceOut() (el mute los calla) y bajan la música mientras hablan.
const VOICE = (() => {
  const DIR = 'voces/';
  const clips = {};    // evento -> [{ raw: Promise<ArrayBuffer|null>, buf: AudioBuffer|null }]
  const last = {};     // evento -> índice del último que sonó
  let current = null;  // la voz que está sonando (una a la vez)

  const M = typeof VOICE_MANIFEST !== 'undefined' ? VOICE_MANIFEST : {};
  for (const ev in M) clips[ev] = M[ev].map(f => ({
    raw: fetch(DIR + f).then(r => (r.ok ? r.arrayBuffer() : null)).catch(() => null), buf: null, bad: false,
  }));

  function decode(c) {
    if (c.buf || c.bad) return Promise.resolve(c.buf);
    const ctx = AUDIO.context(); if (!ctx) return Promise.resolve(null);
    return c.raw.then(ab => {
      if (!ab) { c.bad = true; return null; }
      // Safari viejo solo tiene la versión con callbacks
      return new Promise(ok => ctx.decodeAudioData(ab.slice(0), b => { c.buf = b; ok(b); }, () => { c.bad = true; ok(null); }));
    });
  }
  // con el primer toque o tecla ya hay contexto de audio: se decodifican todos
  function warm() { for (const ev in clips) clips[ev].forEach(decode); }
  ['keydown', 'touchstart', 'mousedown'].forEach(t => window.addEventListener(t, warm, { once: true, passive: true }));

  function play(ev, delayMs = 0) {
    const list = (clips[ev] || []).filter(c => !c.bad);
    if (!list.length || !AUDIO.isEnabled()) return;
    // al azar, sin repetir el último
    let i = Math.floor(Math.random() * list.length);
    if (list.length > 1 && list[i] === last[ev]) i = (i + 1) % list.length;
    const c = list[i]; last[ev] = c;
    decode(c).then(buf => {
      if (!buf) return;
      const ctx = AUDIO.context();
      setTimeout(() => {
        if (!AUDIO.isEnabled()) return;
        if (current) { try { current.stop(); } catch (e) { /* ya terminó */ } }
        const src = ctx.createBufferSource(); src.buffer = buf; src.connect(AUDIO.voiceOut());
        src.onended = () => { if (current === src) current = null; };
        current = src; src.start();
        AUDIO.duck(buf.duration);
      }, delayMs);
    });
  }
  // AMBIENTE en bucle (p. ej. el megáfono del ambulante): VOICE.ambient('ambulante', 0..1)
  // se llama en cada update con el volumen deseado; si deja de llamarse (pausa,
  // muerte, otro capítulo) se apaga solo en ~0,3 s. No baja la música.
  const amb = {};   // nombre -> { src, gain, seen }
  function ambient(name, v) {
    const c = (clips[name] || [])[0];
    if (!c || c.bad || !AUDIO.isEnabled()) return;
    let a = amb[name];
    if (!a) {
      a = amb[name] = { src: null, gain: null, seen: 0 };
      decode(c).then(buf => {
        if (!buf) { delete amb[name]; return; }   // aún sin contexto de audio: se reintenta
        const ctx = AUDIO.context();
        a.gain = ctx.createGain(); a.gain.gain.value = 0; a.gain.connect(AUDIO.voiceOut());
        a.src = ctx.createBufferSource(); a.src.buffer = buf; a.src.loop = true; a.src.connect(a.gain); a.src.start();
      });
    }
    a.seen = performance.now();
    if (a.gain) a.gain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), AUDIO.context().currentTime, 0.1);
  }
  setInterval(() => {
    for (const k in amb) {
      const a = amb[k];
      if (a.gain && (performance.now() - a.seen > 200 || !AUDIO.isEnabled())) a.gain.gain.setTargetAtTime(0, AUDIO.context().currentTime, 0.1);
    }
  }, 150);
  return { play, ambient };
})();
