// audio.js — todo sintetizado con WebAudio, sin archivos externos.
// · Música andina acústica: quena y zampoña con soplo, charango y bajo de cuerda
//   pulsada (Karplus-Strong), bombo de cuero, chajchas y eco de quebrada.
// · Ambiente: rumor del río (con burbujeo) y el retumbar del huaico.
const AUDIO = (() => {
  let ctx = null, master = null, musicGain = null, melBus = null, sfxGain = null, ambGain = null, duckGain = null, voiceGain = null;
  let whiteBuf = null;
  let enabled = true;

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(name) {
    if (typeof name === 'number') return name;
    const m = /^([A-G])([#b]?)(\d)$/.exec(name);
    if (!m) return 440;
    const semi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
    return 440 * Math.pow(2, (semi - 69) / 12);
  }

  function makeNoise(kind, seconds) {
    const len = Math.floor(ctx.sampleRate * seconds), N = 2048;
    const d = new Float32Array(len);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      } else if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else d[i] = w;
    }
    // bucle sin "clic": se funde el final con el principio
    const L = len - N;
    const buf = ctx.createBuffer(1, L, ctx.sampleRate);
    const o = buf.getChannelData(0);
    for (let i = 0; i < L; i++) o[i] = i < N ? d[i] * (i / N) + d[L + i] * (1 - i / N) : d[i];
    return buf;
  }

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { enabled = false; return; }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    comp.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.5; sfxGain.connect(comp);
    // la música pasa por duckGain: baja mientras habla una voz (VOICE)
    duckGain = ctx.createGain(); duckGain.connect(comp);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0001; musicGain.connect(duckGain);
    voiceGain = ctx.createGain(); voiceGain.gain.value = 1.1; voiceGain.connect(master);
    melBus = ctx.createGain(); melBus.connect(musicGain);
    // eco de quebrada: reverberación natural para los instrumentos acústicos
    try {
      // solo los instrumentos melódicos pasan por el eco; bombo, chajchas y bajo van secos
      // para que el pulso quede limpio
      const len = Math.floor(ctx.sampleRate * 1.5), ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4); }
      const conv = ctx.createConvolver(); conv.buffer = ir;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000;
      const wet = ctx.createGain(); wet.gain.value = 0.2;
      melBus.connect(lp); lp.connect(conv); conv.connect(wet); wet.connect(musicGain);
    } catch (e) { /* sin reverberación */ }
    ambGain = ctx.createGain(); ambGain.gain.value = 1; ambGain.connect(comp);
    whiteBuf = makeNoise('white', 1.2);
  }
  function resume() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function now() { return ctx ? ctx.currentTime : 0; }

  // ── efectos ──────────────────────────────────────────────────────────────
  function tone(f, dur, type = 'square', vol = 0.3, when = 0, glide = null, out = null) {
    if (!enabled || !ctx) return;
    const t = (when || now()) + 0.0001;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(1, glide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out || sfxGain); o.start(t); o.stop(t + dur + 0.03);
  }
  function noise(dur, vol, cut, when, opts = {}) {
    if (!enabled || !ctx) return;
    const t = (when || now()) + 0.0001;
    const s = ctx.createBufferSource(); s.buffer = whiteBuf;
    s.playbackRate.value = opts.rate || 1;
    const f = ctx.createBiquadFilter(); f.type = opts.type || 'lowpass'; f.frequency.value = cut || 1200;
    if (opts.q) f.Q.value = opts.q;
    if (opts.sweep) f.frequency.exponentialRampToValueAtTime(opts.sweep, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (opts.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(opts.out || sfxGain);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }

  const SFX = {
    jump:    () => { tone(380, 0.14, 'triangle', 0.26, 0, 720); noise(0.06, 0.06, 2000, 0, { type: 'highpass' }); },
    land:    () => { noise(0.08, 0.16, 600); },
    page:    () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.16, 'triangle', 0.22, now() + i * 0.06)); noise(0.25, 0.08, 5000, now(), { type: 'highpass' }); },
    death:   () => { [523, 440, 392, 330].forEach((f, i) => tone(f, 0.2, 'triangle', 0.22, now() + i * 0.1)); },
    fall:    () => { tone(700, 0.6, 'sine', 0.2, 0, 140); },
    crush:   () => { noise(0.35, 0.4, 500); tone(110, 0.3, 'sine', 0.35, 0, 40); },
    splash:  () => { noise(0.45, 0.32, 2500, 0, { type: 'bandpass', q: 0.6, sweep: 400 }); tone(600, 0.15, 'sine', 0.12, 0, 200); },
    drown:   () => { noise(0.6, 0.3, 400, 0, { sweep: 120 }); [300, 240, 190].forEach((f, i) => tone(f, 0.12, 'sine', 0.18, now() + i * 0.12, f * 0.6)); },
    mount:   () => { tone(330, 0.12, 'triangle', 0.22, 0, 520); tone(660, 0.18, 'triangle', 0.18, now() + 0.08); },
    bleat:   () => { const t = now(); for (let i = 0; i < 5; i++) tone(520 + (i % 2) * 40, 0.07, 'sawtooth', 0.07, t + i * 0.05, 480); },
    // ñam ñam: mordiscos crujientes, balido contento y campanita de premio
    munch:   () => {
      const t = now();
      for (let i = 0; i < 3; i++) { noise(0.07, 0.45, 2600, t + i * 0.09, { type: 'bandpass', q: 0.9 }); noise(0.05, 0.25, 900, t + i * 0.09 + 0.02); }
      for (let i = 0; i < 4; i++) tone(560 + (i % 2) * 60, 0.08, 'sawtooth', 0.09, t + 0.3 + i * 0.06, 520);
      [784, 988, 1319, 1568].forEach((f, i) => tone(f, 0.18, 'triangle', 0.2, t + 0.12 + i * 0.07));
    },
    // rugido de puma: bufido de aire, gruñido grave y áspero que baja y un chillido encima
    puma:    () => { const t = now(); noise(0.55, 0.42, 2400, t, { type: 'bandpass', q: 1.1, sweep: 700, attack: 0.03 }); for (let i = 0; i < 7; i++) tone(170 - i * 9, 0.08, 'sawtooth', 0.24, t + 0.04 + i * 0.065, 120 - i * 8); tone(520, 0.4, 'sawtooth', 0.1, t + 0.02, 210); },
    caw:     () => { const t = now(); tone(900, 0.22, 'sawtooth', 0.06, t, 520); tone(820, 0.28, 'sawtooth', 0.05, t + 0.26, 480); },
    // ave de presa: chillido agudo "kiii-arr" con vibrato
    // chillido de ave de presa: fuerte y agudo, con aspereza ("¡kiii-aaarr!")
    screech: () => {
      const t = now();
      tone(2500, 0.45, 'sawtooth', 0.32, t, 1600); tone(3100, 0.4, 'square', 0.12, t + 0.01, 2000);
      noise(0.4, 0.22, 3200, t, { type: 'bandpass', q: 3, sweep: 1800 });
      tone(2100, 0.5, 'sawtooth', 0.28, t + 0.45, 1000); noise(0.45, 0.18, 2400, t + 0.45, { type: 'bandpass', q: 3, sweep: 1200 });
    },
    // el picado: silbido de viento que crece + otro chillido corto
    swoosh:  () => {
      const t = now();
      noise(0.6, 0.6, 500, t, { type: 'bandpass', q: 0.9, sweep: 3500, attack: 0.12 });
      noise(0.5, 0.35, 180, t, { attack: 0.1 });
      tone(2800, 0.3, 'sawtooth', 0.25, t + 0.05, 1700);
    },
    leaf:    () => { noise(0.25, 0.2, 3000, 0, { type: 'highpass' }); tone(500, 0.2, 'triangle', 0.15, 0, 900); },
    creak:   () => { const t = now(); tone(140, 0.6, 'sawtooth', 0.08, t, 90); tone(180, 0.5, 'sawtooth', 0.05, t + 0.3, 120); noise(0.4, 0.12, 300, t + 0.5); },
    sit:     () => { noise(0.12, 0.2, 700); [523, 659, 784].forEach((f, i) => tone(f, 0.2, 'triangle', 0.18, now() + 0.1 + i * 0.08)); },
    // el caimán: burbujeo antes de saltar y chasquido de mandíbulas
    gurgle:  () => { const t = now(); for (let i = 0; i < 8; i++) tone(160 + Math.random() * 140, 0.09, 'sine', 0.32, t + i * 0.06, 420); noise(0.5, 0.2, 400, t, { type: 'lowpass' }); },
    checkpoint: () => { const t = now(); [880, 1175, 1568].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, t + i * 0.07)); },
    snap:    () => { const t = now(); noise(0.08, 0.5, 1800, t, { type: 'bandpass', q: 1 }); tone(90, 0.2, 'square', 0.25, t, 50); noise(0.06, 0.4, 2500, t + 0.18, { type: 'bandpass', q: 2 }); },
    boing:   () => { tone(200, 0.16, 'triangle', 0.16, 0, 420); noise(0.05, 0.08, 800); },
    rock:    () => { noise(0.2, 0.3, 450); tone(140, 0.16, 'sine', 0.25, 0, 60); },
    rumble:  () => { noise(0.8, 0.25, 220, 0, { attack: 0.2 }); },
    select:  () => { tone(660, 0.07, 'triangle', 0.22); },
    start:   () => { [440, 523, 659, 880].forEach((f, i) => tone(f, 0.14, 'triangle', 0.24, now() + i * 0.06)); },
    bell:    () => { const t = now(); [0, 0.55, 1.1].forEach(d => { tone(880, 1.6, 'sine', 0.22, t + d); tone(2200, 0.7, 'sine', 0.07, t + d); tone(1318, 1.1, 'triangle', 0.08, t + d); }); },
    // capítulo 2: claxon de combi, ¡ay!, ladrido de perro chusco y "no se puede"
    honk:    () => { const t = now(); [0, 0.16].forEach(d => { tone(415, 0.13, 'square', 0.12, t + d); tone(523, 0.13, 'square', 0.1, t + d); }); },
    ouch:    () => { tone(900, 0.18, 'triangle', 0.22, 0, 500); noise(0.08, 0.2, 3000, 0, { type: 'highpass' }); },
    bark:    () => { const t = now(); [0, 0.2].forEach(d => { tone(520, 0.09, 'sawtooth', 0.2, t + d, 260); noise(0.08, 0.25, 900, t + d, { type: 'bandpass', q: 1.5 }); }); },
    swish:   () => { noise(0.18, 0.12, 2500, 0, { type: 'bandpass', q: 0.8, sweep: 900, attack: 0.04 }); },
    engine:  () => { const t = now(); for (let i = 0; i < 6; i++) tone(70 + (i % 2) * 18, 0.08, 'sawtooth', 0.1, t + i * 0.07, 60); },
    shout:   () => { const t = now(); [0, 0.1, 0.2].forEach((d, i) => tone(330 + i * 40, 0.08, 'square', 0.05, t + d, 300)); },
    brake:   () => { tone(1800, 0.3, 'sawtooth', 0.04, 0, 1500); noise(0.3, 0.1, 3000, 0, { type: 'highpass' }); },
    flap:    () => { noise(0.12, 0.25, 1200, 0, { type: 'bandpass', q: 0.7 }); },
    applause: () => { const t = now(); for (let i = 0; i < 26; i++) noise(0.04, 0.12 + Math.random() * 0.1, 2000 + Math.random() * 2000, t + i * 0.045 + Math.random() * 0.03, { type: 'bandpass', q: 1.2 }); },
    // soroche: un "uuuuu" que se tambalea
    heart:   () => { const t = now(); tone(120, 0.12, 'triangle', 0.3, t, 70); tone(110, 0.14, 'triangle', 0.24, t + 0.17, 65); },   // grave pero audible en el parlante del celular
    dizzy:   () => { const t = now(); [0, 0.22, 0.44].forEach((d, i) => tone(520 - i * 60, 0.25, 'triangle', 0.14, t + d, 420 - i * 60)); },
    // capítulo 3: escupitajo de alpaca, pitazo del tren, clic de cámara y enganche que se suelta
    spit:    () => { noise(0.14, 0.4, 1800, 0, { type: 'bandpass', q: 1.2, sweep: 500 }); tone(320, 0.12, 'sine', 0.2, 0, 120); },
    whistle: () => { const t = now(); [0, 0.42].forEach((d, i) => { const L = i ? 0.75 : 0.32; tone(740, L, 'triangle', 0.13, t + d); tone(932, L, 'triangle', 0.09, t + d); tone(1109, L, 'sine', 0.05, t + d); noise(L, 0.05, 2200, t + d, { type: 'bandpass', q: 2 }); }); },
    click:   () => { noise(0.03, 0.45, 4200, 0, { type: 'highpass' }); noise(0.04, 0.3, 3000, now() + 0.08, { type: 'highpass' }); },
    clank:   () => { tone(190, 0.18, 'square', 0.14, 0, 90); noise(0.25, 0.35, 1400, 0, { type: 'bandpass', q: 3 }); },
    nope:    () => { tone(220, 0.12, 'square', 0.12); tone(165, 0.18, 'square', 0.12, now() + 0.1); },
    win:     () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, 'triangle', 0.24, now() + 0.15 + i * 0.13)); },
  };
  function play(name) { if (!enabled) return; resume(); const f = SFX[name]; if (f) f(); }

  // ── música: secuenciador de huayno ─────────────────────────────────────
  // Notación: "E5:2 D5:1 C5:1 r:4"  (nota:duración en semicorcheas, r = silencio,
  // - = ligadura: alarga la nota anterior, para notas que cruzan la barra de compás)
  function parseSeq(str) {
    const out = []; let pos = 0;
    for (const tok of str.trim().split(/\s+/)) {
      if (tok === '|') continue;
      const [n, d] = tok.split(':'); const len = parseInt(d || '1', 10);
      if (n === '-') { if (out.length) out[out.length - 1].len += len; }
      else if (n !== 'r') out.push({ step: pos, note: n, len });
      pos += len;
    }
    return { events: out, length: pos };
  }
  const CHORDS = {
    Am: ['A4', 'C5', 'E5', 'A5'], C: ['G4', 'C5', 'E5', 'G5'], G: ['G4', 'B4', 'D5', 'G5'],
    Em: ['G4', 'B4', 'E5', 'G5'], Dm: ['A4', 'D5', 'F5', 'A5'], F: ['A4', 'C5', 'F5', 'A5'],
    E: ['G#4', 'B4', 'E5', 'G#5'], D: ['A4', 'D5', 'F#5', 'A5'], Bb: ['Bb4', 'D5', 'F5', 'Bb5'],
    Gm: ['G4', 'Bb4', 'D5', 'G5'], A: ['A4', 'C#5', 'E5', 'A5'], A7: ['G4', 'C#5', 'E5', 'A5'],
    E7: ['G#4', 'B4', 'D5', 'E5'], G7: ['G4', 'B4', 'D5', 'F5'], 'C#7': ['G#4', 'B4', 'C#5', 'E#5'],
    'F#m': ['A4', 'C#5', 'F#5', 'A5'], 'F#7': ['A#4', 'C#5', 'E5', 'F#5'], Bm: ['B4', 'D5', 'F#5', 'B5'], B7: ['A4', 'B4', 'D#5', 'F#5'],
  };
  let song = null, musicOn = false, musicTimer = null, step = 0, nextTime = 0;

  function prepare(s) {
    if (s._ready) return s;
    s._lead = parseSeq(s.lead); s._bass = parseSeq(s.bass);
    s._lead2 = s.lead2 ? parseSeq(s.lead2) : null;
    s._ready = true; return s;
  }
  function playMusic(s) {
    init(); if (!enabled || !ctx) return;
    if (song === s && musicOn) return;
    prepare(s);
    song = s; musicOn = true; step = 0; nextTime = ctx.currentTime + 0.12;
    musicGain.gain.cancelScheduledValues(now());
    musicGain.gain.setValueAtTime(0.0001, now());
    musicGain.gain.exponentialRampToValueAtTime((s.vol || 0.3) * 0.7, now() + 1.0);
    if (!musicTimer) musicTimer = setInterval(schedule, 25);
  }
  function stopMusic() {
    musicOn = false; song = null;
    if (musicGain) { musicGain.gain.cancelScheduledValues(now()); musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), now()); musicGain.gain.exponentialRampToValueAtTime(0.0001, now() + 0.4); }
  }

  // cuerda pulsada (Karplus-Strong extendido): afinación exacta, posición de la púa
  // y decaimiento parejo en todas las notas
  const ksCache = {};
  function pluckBuf(f, dur, bright, t60, S) {
    const sr = ctx.sampleRate;
    const N = Math.max(2, Math.floor(sr / f - S));
    const key = N + '|' + bright + '|' + dur + '|' + t60 + '|' + S;
    if (!ksCache[key]) {
      const len = Math.floor(sr * dur), buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
      const exc = new Float32Array(N); let prev = 0;
      for (let i = 0; i < N; i++) { prev += ((Math.random() * 2 - 1) - prev) * bright; exc[i] = prev; }
      // púa cerca del puente: quita armónicos como una cuerda real
      const pk = Math.max(1, Math.round(N * 0.14));
      for (let i = 0; i < N; i++) d[i] = exc[i] - (i >= pk ? exc[i - pk] : 0);
      const rho = Math.pow(0.001, 1 / (t60 * sr / (N + S)));
      for (let i = N + 1; i < len; i++) d[i] = rho * ((1 - S) * d[i - N] + S * d[i - N - 1]);
      let m = 0; for (let i = 0; i < len; i++) m = Math.max(m, Math.abs(d[i]));
      if (m > 0) for (let i = 0; i < len; i++) d[i] /= m;
      ksCache[key] = buf;
    }
    // el periodo real es N + S muestras: se corrige con la velocidad de reproducción
    return { buf: ksCache[key], rate: f * (N + S) / sr };
  }
  function playBuf(p, vol, t, out, detune = 1) {
    const s = ctx.createBufferSource(); s.buffer = p.buf; s.playbackRate.value = p.rate * detune;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(g); g.connect(out || melBus); s.start(t); s.stop(t + p.buf.duration / (p.rate * detune));
  }
  // caja de resonancia del charango (madera): realza el cuerpo y el brillo
  let charBus = null;
  function getCharBus() {
    if (charBus) return charBus;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 180;
    const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 520; body.Q.value = 1.2; body.gain.value = 5;
    const air = ctx.createBiquadFilter(); air.type = 'peaking'; air.frequency.value = 3200; air.Q.value = 0.8; air.gain.value = 4;
    hp.connect(body); body.connect(air); air.connect(melBus);
    return (charBus = hp);
  }
  // aire: ruido filtrado alrededor de la nota, el soplo que se oye en la quena y la zampoña
  function breath(f, dur, vol, t, q) {
    const s = ctx.createBufferSource(); s.buffer = whiteBuf; s.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.03); g.gain.setValueAtTime(vol, t + Math.max(0.04, dur - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    s.connect(bp); bp.connect(g); g.connect(melBus); s.start(t, Math.random() * 0.8); s.stop(t + dur + 0.1);
  }
  // quena: tono casi puro con un poco de 2º y 3º armónico, entra un pelín bajo
  // y sube a la nota, vibrato que llega tarde y soplo constante
  function quena(f, dur, vol, t, scoop = 0.975, soft = false) {
    const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
    const vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.011, t + Math.min(0.35, dur * 0.7));
    vib.connect(vg);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.setValueAtTime(vol * 0.9, t + Math.max(0.06, dur - 0.06));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 4);
    const oscs = [];
    for (const [mul, amp] of [[1, 1], [2, 0.16], [3, 0.06]]) {
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(f * mul * scoop, t); o.frequency.exponentialRampToValueAtTime(f * mul, t + (scoop < 0.95 ? 0.1 : 0.06));
      const og = ctx.createGain(); og.gain.value = amp;
      const vm = ctx.createGain(); vm.gain.value = mul; vg.connect(vm); vm.connect(o.frequency);
      o.connect(og); og.connect(lp); oscs.push(o);
    }
    lp.connect(g); g.connect(melBus);
    [vib, ...oscs].forEach(x => { x.start(t); x.stop(t + dur + 0.12); });
    breath(f, dur, vol * 0.55, t, 6);                                  // aire en la nota
    if (!soft) breath(f * 2.5, Math.min(dur, 0.08), vol * 0.5, t, 1.5);          // golpe de lengua
  }
  // zampoña (siku): caña grave, ataque soplado con "chiff" y mucho aire
  function zampona(f, dur, vol, t) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 0.99, t); o.frequency.linearRampToValueAtTime(f, t + 0.08);
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 3; // tubo cerrado: armónicos impares
    const g2 = ctx.createGain(); g2.gain.value = 0.12;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.07); g.gain.exponentialRampToValueAtTime(vol * 0.7, t + Math.max(0.1, dur));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(melBus);
    [o, o2].forEach(x => { x.start(t); x.stop(t + dur + 0.15); });
    breath(f, dur, vol * 0.9, t, 4);
    breath(f * 4, 0.1, vol * 0.9, t, 1.2);
  }
  // charango: 4 órdenes dobles de cuerda brillante, rasgueo rápido
  function charango(chord, vol, t, up) {
    const notes = CHORDS[chord]; if (!notes) return;
    const seq = up ? notes.slice().reverse() : notes, bus = getCharBus();
    seq.forEach((n, i) => {
      const tt = t + i * 0.014 + Math.random() * 0.003, f = freq(n);
      const p = pluckBuf(f, 1.1, 0.92, 0.9, 0.25);
      playBuf(p, vol * 1.5, tt, bus);
      playBuf(p, vol * 1.1, tt + 0.003, bus, 1.0025);   // cuerda doble, apenas desafinada: da el brillo del charango
    });
    noise(0.012, vol * 0.6, 4000, t, { type: 'highpass', out: bus });   // roce de la uña
  }
  // bajo: bordón de guitarra, redondo y cálido
  function bass(f, dur, vol, t) {
    playBuf(pluckBuf(f, 1.4, 0.5, 1.2, 0.5), vol * 0.9, t, musicGain);
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 0.6));
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + 0.02);
  }
  // chajchas: sonaja de pezuñas de cabra, un racimo de golpecitos secos
  function chajchas(vol, t) {
    for (let i = 0; i < 4; i++) noise(0.025, vol * (1 - i * 0.2), 3500 + Math.random() * 2500, t + i * 0.009 + Math.random() * 0.006, { type: 'bandpass', q: 3, out: musicGain });
  }
  function bombo(vol, t) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.25);
    noise(0.08, vol * 0.35, 600, t, { out: musicGain });   // parche de cuero
  }

  // adornos del quenista: cada pasada sale distinta (apoyatura, mordente, trino, glissando)
  const PENTA = [];
  for (let o = 3; o <= 6; o++) for (const n of ['A', 'C', 'D', 'E', 'G']) PENTA.push(freq(n + o));
  PENTA.sort((x, y) => x - y);
  const upper = (f) => PENTA.find(p => p > f * 1.01) || f * 1.122;
  function quenaOrn(f, dur, vol, t, orn) {
    const r = Math.random();
    if (orn <= 0 || dur < 0.2 || r > orn) return quena(f, dur, vol, t);
    const k = Math.random(), u = upper(f), g = 0.055;
    if (k < 0.3) { quena(u, g, vol * 0.8, t); quena(f, dur - g, vol, t + g, 0.99, true); }                         // apoyatura
    else if (k < 0.55) { quena(f, g, vol, t); quena(u, g, vol * 0.8, t + g, 0.99, true); quena(f, dur - 2 * g, vol, t + 2 * g, 0.99, true); } // mordente
    else if (k < 0.8 && dur >= 0.4) {                                                                              // trino
      const n = Math.floor((dur * 0.55) / g); for (let i = 0; i < n; i++) quena(i % 2 ? u : f, g, vol * (i % 2 ? 0.8 : 1), t + i * g, 0.995, i > 0);
      quena(f, dur - n * g, vol, t + n * g, 0.995, true);
    } else quena(f, dur, vol, t, 0.89);                                                                            // glissando desde abajo
  }
  // ── instrumentos de la costa (capítulo 2) ─────────────────────────────────
  // Cada canción elige con banderas: leadInst 'guitar' | 'eguitar', lead2Inst
  // 'none', strumInst 'guitar', kit 'cajon' | 'chicha', shaker 'guiro'. Sin
  // banderas suena el conjunto andino de siempre.
  // guitarra criolla: cuerda de nylon, cálida
  function guitar(f, dur, vol, t) {
    const p = pluckBuf(f, 1.2, 0.7, 0.9, 0.35);
    playBuf(p, vol * 1.6, t); playBuf(p, vol * 0.5, t + 0.004, melBus, 1.002);
  }
  // guitarra eléctrica de la chicha: brillante, con su "wah" y algo de trémolo
  let wahBus = null;
  function getWahBus() {
    if (wahBus) return wahBus;
    const pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 1300; pk.Q.value = 2.2; pk.gain.value = 9;
    const lfoO = ctx.createOscillator(); lfoO.frequency.value = 0.7; const lg = ctx.createGain(); lg.gain.value = 500;
    lfoO.connect(lg); lg.connect(pk.frequency); lfoO.start();
    pk.connect(melBus);
    return (wahBus = pk);
  }
  function eguitar(f, dur, vol, t) {
    const bus = getWahBus(), p = pluckBuf(f, 0.9, 0.96, 0.6, 0.15);
    playBuf(p, vol * 1.5, t, bus); playBuf(p, vol * 0.9, t + 0.012, bus, 1.006);   // eco corto y desafinado: el sonido chichero
  }
  function guitarStrum(chord, vol, t, up) {
    const notes = CHORDS[chord]; if (!notes) return;
    const seq = up ? notes.slice().reverse() : notes;
    seq.forEach((n, i) => playBuf(pluckBuf(freq(n) / 2, 1.0, 0.55, 0.7, 0.4), vol * 1.7, t + i * 0.012 + Math.random() * 0.003));
  }
  // cajón peruano: golpe grave al centro y "slap" agudo en el borde
  function cajon(slap, vol, t) {
    if (!slap) {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.2);
      noise(0.06, vol * 0.4, 400, t, { out: musicGain });
    } else {
      noise(0.07, vol * 0.7, 2600, t, { type: 'bandpass', q: 0.9, out: musicGain });
      noise(0.03, vol * 0.4, 5000, t, { type: 'highpass', out: musicGain });
    }
  }
  // timbal de la cumbia: parche agudo con algo de metal
  function timbal(vol, t) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(330, t + 0.1);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.16);
    noise(0.05, vol * 0.5, 3200, t, { type: 'bandpass', q: 2, out: musicGain });
  }
  // güiro: raspado corto
  function guiro(vol, t) { noise(0.07, vol, 4200, t, { type: 'bandpass', q: 5, sweep: 2600, attack: 0.02, out: musicGain }); }

  function schedule() {
    if (!musicOn || !ctx || !song) return;
    const s = song;
    const spb = 60 / s.bpm / 4; // semicorchea
    while (nextTime < ctx.currentTime + 0.15) {
      const st = step;
      for (const [trk, fn] of [[s._lead, 'lead'], [s._lead2, 'lead2'], [s._bass, 'bass']]) {
        if (!trk) continue;
        const local = st % trk.length;
        for (const ev of trk.events) if (ev.step === local) {
          if (fn === 'bass') bass(freq(ev.note), ev.len * spb * 0.95, 0.32, nextTime);
          else if (fn === 'lead') {
            if (s.leadInst === 'guitar') guitar(freq(ev.note), ev.len * spb, 0.17, nextTime);
            else if (s.leadInst === 'eguitar') eguitar(freq(ev.note), ev.len * spb, 0.15, nextTime);
            else quenaOrn(freq(ev.note), ev.len * spb * 0.92, 0.17, nextTime, s.orn || 0);
          }
          else if (s.lead2Inst !== 'none') zampona(freq(ev.note), ev.len * spb * 0.95, s.lead2Vol || 0.11, nextTime);
        }
      }
      // charango: un acorde por compás (2/4 = 8 semicorcheas; el vals usa bar: 12, 3/4)
      const bl = s.bar || 8, bar = Math.floor(st / bl), inBar = st % bl;
      const chord = s.chords[bar % s.chords.length];
      const pat = s.strum || 'D.DU.DU.';
      const c = pat[inBar];
      if (c === 'D' || c === 'U') (s.strumInst === 'guitar' ? guitarStrum : charango)(chord, c === 'D' ? 0.05 : 0.035, nextTime, c === 'U');
      // bombo + shaker
      const dr = (s.drums || 'B...b.B.')[inBar];
      if (s.kit === 'cajon') { if (dr === 'B') cajon(false, 0.55, nextTime); else if (dr === 'b') cajon(true, 0.4, nextTime); }
      else if (s.kit === 'chicha') { if (dr === 'B') bombo(0.45, nextTime); else if (dr === 'b') timbal(0.4, nextTime); }
      else if (dr === 'B') bombo(0.5, nextTime); else if (dr === 'b') bombo(0.3, nextTime);
      // chajchas en corcheas, acentuando el pulso (no a contratiempo de los demás)
      if (s.shaker === 'guiro') { if (st % 2 === 1) guiro(inBar % 4 === 3 ? 0.06 : 0.035, nextTime); }
      else if (s.shaker && st % 2 === 0) chajchas(inBar % 4 === 0 ? 0.05 : 0.03, nextTime);
      nextTime += spb; step++;
    }
  }

  // ── ambiente: río y huaico ───────────────────────────────────────────────
  let amb = null;
  function initAmbient() {
    if (amb || !ctx) return;
    const pink = makeNoise('pink', 3), brown = makeNoise('brown', 3);
    const loop = (buf, rate) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1; s.start(); return s; };
    const filt = (type, f, q) => { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; };
    const gain = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    const lfo = (hz, depth, param) => { const o = ctx.createOscillator(); o.frequency.value = hz; const g = gain(depth); o.connect(g); g.connect(param); o.start(); };

    // RÍO: rumor grave + caudal medio que "respira" + siseo de espuma
    const river = gain(0); river.connect(ambGain);
    const r1 = filt('lowpass', 420); const r1g = gain(0.9); loop(brown).connect(r1); r1.connect(r1g); r1g.connect(river);
    const r2 = filt('bandpass', 1300, 0.6); const r2g = gain(0.4); loop(pink, 1.07).connect(r2); r2.connect(r2g); r2g.connect(river);
    lfo(0.21, 0.18, r2g.gain); lfo(0.33, 420, r2.frequency); lfo(0.13, 300, r2.frequency);
    const r3 = filt('highpass', 4200); const r3g = gain(0.1); loop(pink, 0.93).connect(r3); r3.connect(r3g); r3g.connect(river);
    lfo(0.47, 0.05, r3g.gain);

    // HUAICO: masa grave y espesa con temblor
    const mud = gain(0); mud.connect(ambGain);
    const m1 = filt('lowpass', 180, 1.5); const m1g = gain(1.6); loop(brown, 0.8).connect(m1); m1.connect(m1g); m1g.connect(mud);
    lfo(6.5, 0.35, m1g.gain);
    const m2 = filt('bandpass', 520, 1.1); const m2g = gain(0.3); loop(pink, 0.85).connect(m2); m2.connect(m2g); m2g.connect(mud);
    lfo(0.4, 160, m2.frequency);
    // SELVA: chicharras (siseo agudo con trémolo rápido)
    const jungle = gain(0); jungle.connect(ambGain);
    const j1 = filt('bandpass', 5200, 3); const j1g = gain(0.25); loop(pink, 1.1).connect(j1); j1.connect(j1g); j1g.connect(jungle);
    lfo(17, 0.2, j1g.gain); lfo(0.15, 0.12, j1g.gain);
    amb = { river, mud, jungle, rv: 0, mv: 0, jv: 0 };
  }
  function bubble(v) {
    const t = now() + 0.01, f0 = 420 + Math.random() * 900;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * (1.6 + Math.random() * 0.8), t + 0.06);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); g.connect(ambGain); o.start(t); o.stop(t + 0.1);
  }
  function updateAmbient(riverVol, mudVol, jungleVol = 0) {
    if (!ctx || ctx.state !== 'running') return;
    initAmbient();
    const t = now();
    if (Math.abs(riverVol - amb.rv) > 0.01) { amb.river.gain.setTargetAtTime(riverVol * 0.6, t, 0.2); amb.rv = riverVol; }
    if (Math.abs(mudVol - amb.mv) > 0.01) { amb.mud.gain.setTargetAtTime(mudVol * 0.75, t, 0.25); amb.mv = mudVol; }
    if (Math.abs(jungleVol - amb.jv) > 0.01) { amb.jungle.gain.setTargetAtTime(jungleVol * 0.5, t, 0.3); amb.jv = jungleVol; }
    if (jungleVol > 0.1) {
      // pájaros de la selva: silbidos que suben y bajan
      if (Math.random() < 0.012 * jungleVol) { const f = 1500 + Math.random() * 1500; for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) tone(f, 0.08, 'sine', 0.06 * jungleVol, t + i * 0.11, f * (i % 2 ? 0.7 : 1.4), ambGain); }
      // ranas: croar grave
      if (Math.random() < 0.008 * jungleVol) { for (let i = 0; i < 3; i++) tone(140 + Math.random() * 30, 0.07, 'square', 0.05 * jungleVol, t + i * 0.09, 110, ambGain); }
    }
    if (riverVol > 0.05 && Math.random() < 0.12 * riverVol) bubble(riverVol);
    if (mudVol > 0.15 && Math.random() < 0.02 * mudVol) { noise(0.25, 0.18 * mudVol, 300, 0, { out: ambGain }); tone(70 + Math.random() * 60, 0.2, 'sine', 0.2 * mudVol, 0, 40, ambGain); }
  }

  function toggleMute() { init(); enabled = !enabled; if (master) master.gain.value = enabled ? 0.9 : 0; return enabled; }
  function isEnabled() { return enabled; }
  // voces (js/voice.js): su contexto, su salida (respeta el mute de master) y
  // bajar la música 'sec' segundos mientras suenan
  function context() { init(); return ctx; }
  function voiceOut() { init(); return voiceGain; }
  function duck(sec) {
    if (!duckGain) return;
    const g = duckGain.gain, t = now();
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.25, t + 0.08); g.setValueAtTime(0.25, t + sec); g.linearRampToValueAtTime(1, t + sec + 0.4);
  }

  return { play, playMusic, stopMusic, resume, toggleMute, isEnabled, freq, updateAmbient, context, voiceOut, duck };
})();
