// cortos.js — cortos de canciones conocidas que suenan una vez en momentos clave
// (al entrar a un tramo, 'CUMBRE DEL APU' al coronar el Apu, 'FINAL' en el cierre). Mientras suena un
// corto, la música del juego se calla; al terminar, vuelve la del tramo.
// Cada corto: el archivo en musica/, desde qué segundo, cuántos segundos dura y `vol` opcional (0 a 1, por defecto 0.8).
// `vuelta: true` repite el archivo (útil con `hasta`, para que dure todo un tramo).
// Si el archivo no está, no pasa nada: sigue la música del juego.
// PARA QUITARLOS TODOS: vaciar CORTOS (dejar `const CORTOS = {};`).
const CORTOS = {
  'EL VALLE':        { src: 'musica/valle-mi-valentin.mp3', desde: 0, dura: 240, vol: 0.4, apaga: { x: 119, suelo: 110, rango: 30 } },   // sigue por El Apu; se apaga al acercarte al piso del huaico
  'LA SELVA':        { src: 'musica/selva-danza-de-los-mirlos.mp3', desde: 0, dura: 30 },
  'LA PANAMERICANA': { src: 'musica/panamericana-toro-mata.mp3', desde: 0, dura: 30 },
  'BARRANCO':        { src: 'musica/barranco-puente-de-los-suspiros.mp3', desde: 0, dura: 30 },
  // por columna (`cap` + `en`): suenan al cruzar esa columna del capítulo
  'PLAZA':           { src: 'musica/plaza-marcha-de-banderas.mp3', cap: 2, en: 674, desde: 0, dura: 8 },   // remate frente a Palacio
  'OJITOS CHINOS':   { src: 'musica/barriochino-ojitos-chinos.mp3', cap: 2, en: 725, desde: 0, dura: 240, hasta: 'LAS AZOTEAS' },   // todo Barrio Chino; se apaga al subir a las azoteas
  'EN MOTOTAXI':     { src: 'musica/mototaxi-el-aguajal.mp3', desde: 0, dura: 234, hasta: 674 },   // la canción entera, hasta la Plaza de Armas; ahí entra la Marcha
  'LAS AZOTEAS':     { src: 'musica/azoteas-soy-provinciano.mp3', desde: 0, dura: 150, hasta: 'LA CASONA' },   // los techos (desde el 1:44 de la canción), hasta la casona
  'EL CUSCO':        { src: 'musica/cusco-valicha.mp3', desde: 0, dura: 30 },
  'VALLE SAGRADO':   { src: 'musica/valle-sagrado.mp3', desde: 0, dura: 1800, vuelta: true },   // Alborada: se repite del valle hasta la foto final (sin cortes)
  'FINAL':           { src: 'musica/final-contigo-peru.mp3', desde: 0, dura: 40 },
};

const CORTO = (() => {
  const FADE = 1.5, VOL = 0.8;   // segundos de fundido y volumen máximo
  let played = {}, cur = null, hushUntil = 0;
  function hush(ms) { hushUntil = Math.max(hushUntil, performance.now() + ms); }
  function stop() { if (cur) { cur.a.pause(); clearInterval(cur.timer); cur = null; } }
  // suena el corto de `key` (una vez por partida); `after` se llama al terminar
  // interruptor en index.html: <meta name="cortos" content="on|off">
  const ON = (document.querySelector('meta[name="cortos"]') || {}).content !== 'off';
  function play(key, after) {
    const c = ON && CORTOS[key];
    if (!c || played[key]) return;
    // un corto con `hasta` una columna no se corta: el siguiente espera a que termine
    if (cur && typeof cur.hasta === 'number') { cur.next = [key, after]; return; }
    played[key] = true; stop();
    const a = new Audio(c.src), me = { a, after, hasta: c.hasta, apaga: c.apaga };
    a.volume = 0; a.currentTime = c.desde || 0; a.loop = !!c.vuelta;
    a.play().then(() => {
      if (!played[key]) { a.pause(); return; }   // se reinició la partida mientras cargaba
      cur = me; AUDIO.stopMusic();
      const t0 = performance.now(); me.dura = c.dura || 25;
      me.timer = setInterval(() => {
        // la pausa del juego también pausa el corto; el silencio del juego lo silencia
        const t = a.currentTime - (c.desde || 0), dura = me.dura; me.t = t;
        if (t >= dura || a.ended || performance.now() - t0 > (dura + 30) * 1000) {
          stop();
          if (me.next) play(me.next[0], me.next[1]); else if (me.after) me.after();
          return;
        }
        if (Game.state === 'pause') { if (!a.paused) a.pause(); return; }
        if (a.paused) a.play().catch(() => {});
        a.muted = !AUDIO.isEnabled();
        // al morir o mientras habla una voz (¡achachau!), la canción baja al 20 % y luego vuelve suave
        const bajo = Game.state === 'respawn' || VOICE.speaking() || performance.now() < hushUntil;
        me.duck = (me.duck ?? 1) + ((bajo ? 0.2 : 1) - (me.duck ?? 1)) * (bajo ? 0.6 : 0.3);
        // `apaga`: pasada la columna x, baja según lo cerca que estés del piso (fila `suelo`) y al llegar termina
        let cerca = 1;
        if (me.apaga && Game.player && Game.player.cx / TILE >= me.apaga.x) {
          cerca = Math.max(0, Math.min(cerca, (me.apaga.suelo - Game.player.cy / TILE) / me.apaga.rango));
          if (cerca <= 0.02) me.dura = Math.min(me.dura, t);
        }
        const tIn = c.vuelta ? (performance.now() - t0) / 1000 : t;   // al repetir, el fundido de entrada no se repite
        a.volume = (c.vol || VOL) * me.duck * cerca * Math.max(0, Math.min(1, tIn / FADE, (dura - t) / FADE));
      }, 50);
    }).catch(() => { played[key] = false; });   // sin archivo o sin permiso de audio: sigue la música del juego
  }
  // al entrar a un tramo: si el corto que suena tiene `hasta` ese tramo, se apaga con fundido
  function zone(name) { if (cur && cur.hasta === name && cur.t != null) { cur.dura = Math.min(cur.dura, cur.t + FADE); cur.a.loop = false; } }
  // en cada paso, con la columna del jugador: si el corto tiene `hasta` una columna y ya la pasaste, se apaga con fundido
  let lastX = null;
  function pos(x, after) {
    // cortos por columna: suenan al cruzarla hacia adelante (una vez por partida)
    if (lastX != null && x > lastX) for (const k in CORTOS) {
      const c = CORTOS[k];
      if (c.en != null && c.cap === Game.chapterIdx + 1 && lastX < c.en && x >= c.en) play(k, after);
    }
    lastX = x; if (cur && typeof cur.hasta === 'number' && x >= cur.hasta && cur.t != null) { cur.dura = Math.min(cur.dura, cur.t + FADE); cur.hasta = null; } }
  function reset() { stop(); played = {}; lastX = null; }
  return { play, stop, reset, zone, pos, hush, playing: () => !!cur };
})();
