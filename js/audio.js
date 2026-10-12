// audio.js — todo sintetizado con WebAudio, sin archivos externos.
// · Música de huayno: quena (con vibrato y soplo), charango rasgueado, bajo y bombo.
// · Ambiente: rumor del río (con burbujeo) y el retumbar del huaico.
const AUDIO = (() => {
  let ctx = null, master = null, musicGain = null, sfxGain = null, ambGain = null;
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
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0001; musicGain.connect(comp);
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
    caw:     () => { const t = now(); tone(900, 0.22, 'sawtooth', 0.06, t, 520); tone(820, 0.28, 'sawtooth', 0.05, t + 0.26, 480); },
    // ave de presa: chillido agudo "kiii-arr" con vibrato
    screech: () => { const t = now(); tone(2400, 0.35, 'sawtooth', 0.09, t, 1500); tone(2600, 0.3, 'square', 0.04, t + 0.02, 1700); tone(1900, 0.4, 'sawtooth', 0.07, t + 0.38, 900); },
    swoosh:  () => { noise(0.45, 0.25, 600, 0, { type: 'bandpass', q: 0.8, sweep: 3000, attack: 0.15 }); },
    leaf:    () => { noise(0.25, 0.2, 3000, 0, { type: 'highpass' }); tone(500, 0.2, 'triangle', 0.15, 0, 900); },
    creak:   () => { const t = now(); tone(140, 0.6, 'sawtooth', 0.08, t, 90); tone(180, 0.5, 'sawtooth', 0.05, t + 0.3, 120); noise(0.4, 0.12, 300, t + 0.5); },
    sit:     () => { noise(0.12, 0.2, 700); [523, 659, 784].forEach((f, i) => tone(f, 0.2, 'triangle', 0.18, now() + 0.1 + i * 0.08)); },
    boing:   () => { tone(200, 0.16, 'triangle', 0.16, 0, 420); noise(0.05, 0.08, 800); },
    rock:    () => { noise(0.2, 0.3, 450); tone(140, 0.16, 'sine', 0.25, 0, 60); },
    rumble:  () => { noise(0.8, 0.25, 220, 0, { attack: 0.2 }); },
    select:  () => { tone(660, 0.07, 'triangle', 0.22); },
    start:   () => { [440, 523, 659, 880].forEach((f, i) => tone(f, 0.14, 'triangle', 0.24, now() + i * 0.06)); },
    bell:    () => { const t = now(); [0, 0.55, 1.1].forEach(d => { tone(880, 1.6, 'sine', 0.22, t + d); tone(2200, 0.7, 'sine', 0.07, t + d); tone(1318, 1.1, 'triangle', 0.08, t + d); }); },
    win:     () => { [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => tone(f, 0.3, 'triangle', 0.24, now() + 0.15 + i * 0.13)); },
  };
  function play(name) { if (!enabled) return; resume(); const f = SFX[name]; if (f) f(); }

  // ── música: secuenciador de huayno ─────────────────────────────────────
  // Notación: "E5:2 D5:1 C5:1 r:4"  (nota:duración en semicorcheas, r = silencio)
  function parseSeq(str) {
    const out = []; let pos = 0;
    for (const tok of str.trim().split(/\s+/)) {
      if (tok === '|') continue;
      const [n, d] = tok.split(':'); const len = parseInt(d || '1', 10);
      if (n !== 'r') out.push({ step: pos, note: n, len });
      pos += len;
    }
    return { events: out, length: pos };
  }
  const CHORDS = {
    Am: ['A4', 'C5', 'E5', 'A5'], C: ['G4', 'C5', 'E5', 'G5'], G: ['G4', 'B4', 'D5', 'G5'],
    Em: ['G4', 'B4', 'E5', 'G5'], Dm: ['A4', 'D5', 'F5', 'A5'], F: ['A4', 'C5', 'F5', 'A5'],
    E: ['G#4', 'B4', 'E5', 'G#5'], D: ['A4', 'D5', 'F#5', 'A5'], Bb: ['Bb4', 'D5', 'F5', 'Bb5'],
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
    musicGain.gain.exponentialRampToValueAtTime(s.vol || 0.3, now() + 1.0);
    if (!musicTimer) musicTimer = setInterval(schedule, 25);
  }
  function stopMusic() {
    musicOn = false; song = null;
    if (musicGain) { musicGain.gain.cancelScheduledValues(now()); musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), now()); musicGain.gain.exponentialRampToValueAtTime(0.0001, now() + 0.4); }
  }

  // quena: triangulo + octava suave, vibrato que entra tarde y soplo al atacar
  function quena(f, dur, vol, t) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
    const o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(f * 2, t);
    const vib = ctx.createOscillator(); vib.frequency.value = 5.6;
    const vg = ctx.createGain(); vg.gain.setValueAtTime(0, t); vg.gain.linearRampToValueAtTime(f * 0.012, t + Math.min(0.25, dur * 0.6));
    vib.connect(vg); vg.connect(o.frequency); vg.connect(o2.frequency);
    const g = ctx.createGain(), g2 = ctx.createGain(); g2.gain.value = 0.18;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.035);
    g.gain.setValueAtTime(vol, t + Math.max(0.04, dur - 0.06));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(musicGain);
    [o, o2, vib].forEach(x => { x.start(t); x.stop(t + dur + 0.1); });
    noise(0.07, vol * 0.25, f * 2, t, { type: 'bandpass', q: 2, out: musicGain });
  }
  function charango(chord, vol, t, up) {
    const notes = CHORDS[chord]; if (!notes) return;
    const seq = up ? notes.slice().reverse() : notes;
    seq.forEach((n, i) => {
      const tt = t + i * 0.011;
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(freq(n), tt);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3200, tt); f.frequency.exponentialRampToValueAtTime(900, tt + 0.2);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(vol, tt + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.28);
      o.connect(f); f.connect(g); g.connect(musicGain); o.start(tt); o.stop(tt + 0.3);
    });
  }
  function bass(f, dur, vol, t) {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + 0.02);
  }
  function bombo(vol, t) {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.25);
    noise(0.05, vol * 0.3, 1800, t, { out: musicGain });
  }

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
          else quena(freq(ev.note), ev.len * spb * 0.92, fn === 'lead' ? 0.17 : 0.08, nextTime);
        }
      }
      // charango: un acorde por compás de 2/4 (8 semicorcheas)
      const bar = Math.floor(st / 8), inBar = st % 8;
      const chord = s.chords[bar % s.chords.length];
      const pat = s.strum || 'D.DU.DU.';
      const c = pat[inBar];
      if (c === 'D' || c === 'U') charango(chord, c === 'D' ? 0.05 : 0.035, nextTime, c === 'U');
      // bombo + shaker
      const dr = (s.drums || 'B...b.B.')[inBar];
      if (dr === 'B') bombo(0.5, nextTime); else if (dr === 'b') bombo(0.3, nextTime);
      if (s.shaker && st % 2 === 1) noise(0.04, 0.035, 7000, nextTime, { type: 'highpass', out: musicGain });
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
    amb = { river, mud, rv: 0, mv: 0 };
  }
  function bubble(v) {
    const t = now() + 0.01, f0 = 420 + Math.random() * 900;
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * (1.6 + Math.random() * 0.8), t + 0.06);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045 * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g); g.connect(ambGain); o.start(t); o.stop(t + 0.1);
  }
  function updateAmbient(riverVol, mudVol) {
    if (!ctx || ctx.state !== 'running') return;
    initAmbient();
    const t = now();
    if (Math.abs(riverVol - amb.rv) > 0.01) { amb.river.gain.setTargetAtTime(riverVol * 0.6, t, 0.2); amb.rv = riverVol; }
    if (Math.abs(mudVol - amb.mv) > 0.01) { amb.mud.gain.setTargetAtTime(mudVol * 0.75, t, 0.25); amb.mv = mudVol; }
    if (riverVol > 0.05 && Math.random() < 0.12 * riverVol) bubble(riverVol);
    if (mudVol > 0.15 && Math.random() < 0.02 * mudVol) { noise(0.25, 0.18 * mudVol, 300, 0, { out: ambGain }); tone(70 + Math.random() * 60, 0.2, 'sine', 0.2 * mudVol, 0, 40, ambGain); }
  }

  function toggleMute() { init(); enabled = !enabled; if (master) master.gain.value = enabled ? 0.9 : 0; return enabled; }
  function isEnabled() { return enabled; }

  return { play, playMusic, stopMusic, resume, toggleMute, isEnabled, freq, updateAmbient };
})();
