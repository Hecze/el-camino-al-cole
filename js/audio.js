// audio.js — efectos y música sintetizados (WebAudio). Sin archivos externos.
const AUDIO = (() => {
  let ctx = null, master = null, musicGain = null, sfxGain = null;
  let noiseBuf = null;
  let enabled = true;
  let musicOn = false, musicTimer = null, musicStep = 0, nextTime = 0, song = null;

  const NOTE = { C:0, 'C#':1, D:2, 'D#':3, E:4, F:5, 'F#':6, G:7, 'G#':8, A:9, 'A#':10, B:11 };
  function freq(name) {
    if (typeof name === 'number') return name;
    const m = /^([A-G]#?)(\d)$/.exec(name);
    if (!m) return 440;
    const semi = NOTE[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (semi - 69) / 12);
  }

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { enabled = false; return; }
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.55; sfxGain.connect(master);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.0; musicGain.connect(master);
    const len = ctx.sampleRate * 1.0;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  function resume() { init(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function now() { return ctx ? ctx.currentTime : 0; }

  function tone(f, dur, type = 'square', vol = 0.3, when = 0, glide = null) {
    if (!enabled || !ctx) return;
    const t = (when || now()) + 0.0001;
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(1, glide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxGain); o.start(t); o.stop(t + dur + 0.03);
  }
  function noiseHit(dur, vol, cut, when, q) {
    if (!enabled || !ctx) return;
    const t = (when || now()) + 0.0001;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut || 1200;
    if (q) f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t); s.stop(t + dur + 0.02);
  }

  const SFX = {
    jump:    () => { tone(430, 0.16, 'square', 0.28, 0, 770); },
    land:    () => { noiseHit(0.08, 0.22, 700); },
    coin:    () => { tone(988, 0.07, 'square', 0.25); tone(1319, 0.14, 'square', 0.22, now() + 0.06); },
    gem:     () => { [1046, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.12, 'triangle', 0.22, now() + i * 0.05)); },
    hurt:    () => { tone(320, 0.22, 'sawtooth', 0.3, 0, 90); },
    death:   () => { [523, 466, 415, 349, 294, 233].forEach((f, i) => tone(f, 0.28, 'square', 0.26, now() + i * 0.13)); noiseHit(0.5, 0.12, 500, now() + 0.8); },
    fall:    () => { tone(740, 0.55, 'sine', 0.22, 0, 170); noiseHit(0.4, 0.08, 500); },
    stomp:   () => { noiseHit(0.1, 0.3, 900); tone(220, 0.1, 'square', 0.2, 0, 120); },
    checkpoint: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'triangle', 0.24, now() + i * 0.09)); },
    mount:   () => { tone(300, 0.1, 'sawtooth', 0.22, 0, 520); tone(520, 0.2, 'triangle', 0.2, now() + 0.09); },
    drown:   () => { tone(400, 0.5, 'sine', 0.3, 0, 60); noiseHit(0.5, 0.2, 500); },
    splash:  () => { noiseHit(0.3, 0.28, 900); tone(500, 0.2, 'sine', 0.12, 0, 150); },
    select:  () => { tone(660, 0.08, 'square', 0.25); },
    start:   () => { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.14, 'square', 0.24, now() + i * 0.07)); },
    win:     () => { [659, 784, 988, 1318, 1568, 2093].forEach((f, i) => tone(f, 0.25, 'triangle', 0.28, now() + i * 0.14)); },
    lose:    () => { [523, 466, 415, 349, 262].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.24, now() + i * 0.18)); },
    mud:     () => { noiseHit(0.25, 0.2, 350, 0, 3); },
    rock:    () => { noiseHit(0.18, 0.25, 500); tone(160, 0.15, 'square', 0.2, 0, 90); },
  };

  function play(name) { if (!enabled) return; resume(); const f = SFX[name]; if (f) f(); }

  // ── Música: secuenciador con lookahead ───────────────────────────────────
  // patrón = { bpm, bass:[...], lead:[...], pad:[...], type }
  function playMusic(pat) {
    init(); if (!enabled || !ctx) return;
    song = pat; musicOn = true; musicStep = 0; nextTime = ctx.currentTime + 0.1;
    musicGain.gain.cancelScheduledValues(now());
    musicGain.gain.setValueAtTime(0.0001, now());
    musicGain.gain.exponentialRampToValueAtTime(pat.vol || 0.28, now() + 1.2);
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = setInterval(schedule, 25);
  }
  function stopMusic() {
    musicOn = false;
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
    if (musicGain) { musicGain.gain.cancelScheduledValues(now()); musicGain.gain.setValueAtTime(musicGain.gain.value, now()); musicGain.gain.exponentialRampToValueAtTime(0.0001, now() + 0.4); }
  }
  function mnote(f, dur, type, vol, t) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + 0.03);
  }
  function schedule() {
    if (!musicOn || !ctx) return;
    const bpm = song.bpm || 132;
    const spb = 60 / bpm / 2; // corcheas
    while (nextTime < ctx.currentTime + 0.12) {
      const s = musicStep;
      const bass = song.bass && song.bass[s % song.bass.length];
      const lead = song.lead && song.lead[s % song.lead.length];
      const pad = song.pad && song.pad[s % song.pad.length];
      if (bass) mnote(freq(bass) / 2, spb * 1.4, 'triangle', 0.30, nextTime);
      if (lead) mnote(freq(lead), spb * 0.9, 'square', 0.16, nextTime);
      if (pad && (s % 2 === 0)) mnote(freq(pad), spb * 1.9, 'sine', 0.10, nextTime);
      if (song.perc && s % 4 === 2) noiseHit(0.05, 0.06, 4000, nextTime);
      nextTime += spb; musicStep++;
    }
  }

  function toggleMute() { init(); enabled = !enabled; master.gain.value = enabled ? 0.9 : 0; return enabled; }
  function isEnabled() { return enabled; }

  return { play, playMusic, stopMusic, resume, toggleMute, isEnabled, freq, noiseAt: noiseHit, toneAt: tone };
})();
