// cortos.js — cortos de canciones conocidas que suenan una vez en momentos clave
// (al entrar a un tramo, 'CUMBRE DEL APU' al coronar el Apu, 'FINAL' en el cierre). Mientras suena un
// corto, la música del juego se calla; al terminar, vuelve la del tramo.
// Cada corto: el archivo en musica/, desde qué segundo y cuántos segundos dura.
// Si el archivo no está, no pasa nada: sigue la música del juego.
// PARA QUITARLOS TODOS: vaciar CORTOS (dejar `const CORTOS = {};`).
const CORTOS = {
  'CUMBRE DEL APU':  { src: 'musica/apu-el-condor-pasa.mp3', desde: 0, dura: 30 },
  'LA SELVA':        { src: 'musica/selva-danza-de-los-mirlos.mp3', desde: 0, dura: 30 },
  'LA PANAMERICANA': { src: 'musica/panamericana-toro-mata.mp3', desde: 0, dura: 30 },
  'BARRANCO':        { src: 'musica/barranco-puente-de-los-suspiros.mp3', desde: 0, dura: 30 },
  'JR. DE LA UNIÓN': { src: 'musica/centro-el-plebeyo.mp3', desde: 0, dura: 30 },
  'EN MOTOTAXI':     { src: 'musica/mototaxi-carinito.mp3', desde: 0, dura: 30 },
  'EL CUSCO':        { src: 'musica/cusco-valicha.mp3', desde: 0, dura: 30 },
  'MACHU PICCHU':    { src: 'musica/machupicchu-virgenes-del-sol.mp3', desde: 0, dura: 30 },
  'INTI PUNKU':      { src: 'musica/intipunku-el-condor-pasa.mp3', desde: 0, dura: 30 },
  'FINAL':           { src: 'musica/final-contigo-peru.mp3', desde: 0, dura: 40 },
};

const CORTO = (() => {
  const FADE = 1.5, VOL = 0.8;   // segundos de fundido y volumen máximo
  let played = {}, cur = null;
  function stop() { if (cur) { cur.a.pause(); clearInterval(cur.timer); cur = null; } }
  // suena el corto de `key` (una vez por partida); `after` se llama al terminar
  // interruptor en index.html: <meta name="cortos" content="on|off">
  const ON = (document.querySelector('meta[name="cortos"]') || {}).content !== 'off';
  function play(key, after) {
    const c = ON && CORTOS[key];
    if (!c || played[key]) return;
    played[key] = true; stop();
    const a = new Audio(c.src), me = { a, after };
    a.volume = 0; a.currentTime = c.desde || 0;
    a.play().then(() => {
      if (!played[key]) { a.pause(); return; }   // se reinició la partida mientras cargaba
      cur = me; AUDIO.stopMusic();
      const t0 = performance.now(), dura = c.dura || 25;
      me.timer = setInterval(() => {
        // la pausa del juego también pausa el corto; el silencio del juego lo silencia
        const t = a.currentTime - (c.desde || 0);
        if (t >= dura || a.ended || performance.now() - t0 > (dura + 30) * 1000) { stop(); if (me.after) me.after(); return; }
        if (Game.state === 'pause') { if (!a.paused) a.pause(); return; }
        if (a.paused) a.play().catch(() => {});
        a.muted = !AUDIO.isEnabled();
        a.volume = VOL * Math.max(0, Math.min(1, t / FADE, (dura - t) / FADE));
      }, 50);
    }).catch(() => { played[key] = false; });   // sin archivo o sin permiso de audio: sigue la música del juego
  }
  function reset() { stop(); played = {}; }
  return { play, stop, reset, playing: () => !!cur };
})();
