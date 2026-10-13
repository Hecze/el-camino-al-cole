// game.js — motor: bucle fijo, cámara, parallax, agua/lodo, render por capas, HUD y estados.
(function () {
  'use strict';

  // Resolución interna variable: la escala es entera (píxeles nítidos) y se
  // elige para que la vista tenga ~216 px de alto; el ancho y el alto se
  // ajustan a la forma de la pantalla para llenarla entera (en el celular la
  // vista se ensancha en vez de quedar como un rectángulo chiquito al medio).
  let BASE_W = 384, BASE_H = 216;
  const STEP = 1000 / 60;
  window.VIEW = { w: BASE_W, h: BASE_H };

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function fit() {
    const vv = window.visualViewport;
    const sw = Math.round(vv ? vv.width : window.innerWidth), sh = Math.round(vv ? vv.height : window.innerHeight);
    // escala entera: ~216 px de alto, pero sin dejar la vista más angosta que 180 px
    const scale = Math.max(1, Math.min(Math.round(sh / 216), Math.floor(sw / 180)));
    BASE_W = Math.min(800, Math.ceil(sw / scale)); BASE_H = Math.min(900, Math.ceil(sh / scale));
    window.VIEW.w = BASE_W; window.VIEW.h = BASE_H;
    if (canvas.width !== BASE_W || canvas.height !== BASE_H) { canvas.width = BASE_W; canvas.height = BASE_H; ctx.imageSmoothingEnabled = false; }
    canvas.style.width = BASE_W * scale + 'px';
    canvas.style.height = BASE_H * scale + 'px';
  }
  window.addEventListener('resize', fit); window.addEventListener('orientationchange', () => setTimeout(fit, 200));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fit);
  fit();

  // ── utilidades ───────────────────────────────────────────────────────────
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (a, n) => ((a % n) + n) % n;
  function hash(n) { n = (n | 0) ^ 0x9e3779b9; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  let tick = 0;

  // ── la hora del día ──────────────────────────────────────────────────────
  // Sales de casa a las 6:20 con el sol saliendo; la clase empieza a las 8:00.
  // Cada segundo de juego son 18 segundos del reloj (≈5 min 30 s para llegar).
  // (cada capítulo puede salir a otra hora con dayStart)
  const DAY_START_DEFAULT = 6 * 60 + 20, CLASS_START = 8 * 60, CLOCK_RATE = 0.3;
  let DAY_START = DAY_START_DEFAULT;
  const SKY_DAWN = ['#2e2f63', '#c46f8a', '#ffb877'], SKY_MORNING = ['#4f86c6', '#9cc8e8', '#f6dcb0'];
  function clockMinutes() { return DAY_START + (Game.time / 60) * CLOCK_RATE; }
  function clockText(m) { m = Math.floor(m == null ? clockMinutes() : m); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); }
  function dayProgress() { return clamp((clockMinutes() - DAY_START) / (CLASS_START - DAY_START), 0, 1); }
  function lerpColor(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const ch = (s) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * t);
    return 'rgb(' + ch(16) + ',' + ch(8) + ',' + ch(0) + ')';
  }

  // ── parallax ─────────────────────────────────────────────────────────────
  const strips = {};
  function buildStrip(def) {
    const W = 768, H = BASE_H;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    // capas con dibujo propio (la ciudad de Lima, el oasis...): se dibujan solas
    if (def.build) { def.build(g, W, H); return c; }
    const s = def.seed || 1;
    function ridge(x) {
      let n = 0, amp = 1, norm = 0, fr = 1;
      for (let o = 0; o < 4; o++) { n += Math.sin((x / W) * Math.PI * 2 * fr + s * 1.7 * (o + 1) + o) * amp; norm += amp; amp *= 0.55; fr *= 2; }
      // picos andinos: crestas más afiladas
      const v = n / norm;
      if (def.kind === 'mountains') return Math.sign(v) * Math.pow(Math.abs(v), 0.8);
      // copas de árboles: lomas suaves cubiertas de bultos redondeados
      if (def.kind === 'canopy') return v + Math.abs(Math.sin(x * 0.11 + s)) * 0.35 + Math.abs(Math.sin(x * 0.047 + s * 3)) * 0.25;
      return v;
    }
    const center = 120, ampPx = def.amp * TILE * 0.5;
    // relleno escalonado de 2px (look pixel art)
    for (let x = 0; x < W; x += 2) {
      const ry = Math.round((center - ridge(x) * ampPx) / 2) * 2;
      const grad = g.createLinearGradient(0, ry, 0, H);
      g.fillStyle = def.color; g.fillRect(x, ry, 2, H - ry);
      // sombra de ladera: el lado que baja hacia la derecha es más oscuro
      if (ridge(x + 2) < ridge(x)) { g.fillStyle = def.color2; g.globalAlpha = 0.55; g.fillRect(x, ry, 2, H - ry); g.globalAlpha = 1; }
      g.fillStyle = def.color2; g.globalAlpha = 0.5; g.fillRect(x, ry + 40, 2, H); g.globalAlpha = 1;
      if (def.snow) {
        const snowLine = center - ampPx * 0.3;
        if (ry < snowLine) { g.fillStyle = '#f4f8ff'; g.fillRect(x, ry, 2, Math.min(14, Math.round((snowLine - ry) * 1.3 / 2) * 2)); }
      }
    }
    return c;
  }
  function getStrip(def, key) { if (!strips[key]) strips[key] = buildStrip(def); return strips[key]; }

  const cloudSeed = {}, cloudCache = {};
  function drawClouds(layer, camx, dy, key, ctx) {
    const W = 768;
    if (!cloudSeed[key]) {
      const arr = [], s = layer.seed || 1;
      for (let i = 0; i < (layer.count || 8); i++) arr.push({ x: (i * 137.5 + s * 53) % W, y: 6 + ((i * 23 + s * 11) % 46), sc: 1 + ((i * 7 + s) % 3) });
      cloudSeed[key] = arr;
    }
    const off = (camx * layer.parallax + tick * 0.05) % W;
    for (const c of cloudSeed[key]) {
      let x = mod(c.x - off, W); if (x > BASE_W + 10) x -= W;
      const k = c.sc + layer.color;
      if (!cloudCache[k]) cloudCache[k] = PIX.scaled(PIX.tinted(T.cloud, layer.color), c.sc);
      ctx.drawImage(cloudCache[k], Math.round(x), Math.round(c.y + dy));
    }
  }
  let condorSil = null;
  function drawSkyCondors(dy) {
    if (!condorSil) condorSil = E.condor.map(s => PIX.tinted(s, '#3b3550'));
    for (let i = 0; i < 2; i++) {
      const period = 2600 + i * 1100;
      const u = mod(tick + i * 1500, period) / period;
      const x = -30 + u * (BASE_W + 60);
      const y = 34 + i * 26 + Math.sin(tick * 0.008 + i * 2) * 10 + dy;
      ctx.drawImage(condorSil[Math.floor((tick + i * 40) / 50) % 2], Math.round(x), Math.round(y));
    }
  }

  // ── partículas ───────────────────────────────────────────────────────────
  const COL = { swampSplash: '#c8ebd2', foam: '#f0d6a8', leaf: '#8fd062', feather: '#2a1f2d', dust: '#c9a86a', spark: '#ffe27a', mud: '#7a5232', splash: '#bdf0f4', rock: '#8a8296', paper: '#ffffff' };

  // ── estado ───────────────────────────────────────────────────────────────
  const Game = {
    state: 'menu', level: null, player: null, entities: [], movers: [], particles: [],
    cam: { x: 0, y: 0 }, look: 0, floorY: 0, shakeT: 0, shakeMag: 0, fade: 1,
    pages: 0, score: 0, huaico: null,
    menuSel: 0, pauseSel: 0, stateT: 0, T: 0,
    spawn: { x: 0, y: 0 }, spawnMount: null, zone: -1, zoneName: '',
    banner: 0, deaths: 0, time: 0,
    chapterIdx: 0, chapter: CHAPTERS[0], menuChapter: 0, winSel: 0,
  };
  window.Game = Game;

  Game.audio = (name) => AUDIO.play(name);
  Game.addScore = (n) => { Game.score += n; };
  Game.shake = (mag, t) => { Game.shakeMag = Math.max(Game.shakeMag, mag); Game.shakeT = Math.max(Game.shakeT, t); };
  Game.near = (x, r) => Game.player && Math.abs(Game.player.cx - x) < r;
  Game.addEntity = (e) => Game.entities.push(e);
  Game.toast = (text) => { Game.toastMsg = { text, t: 0 }; };
  Game.burst = (x, y, type, n) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = rnd(0.4, 2.2);
      const heavy = type === 'splash' || type === 'mud' || type === 'foam';
      Game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: (heavy ? -Math.abs(Math.sin(a)) * sp * 1.4 : Math.sin(a) * sp) - 0.6, life: rnd(16, 32), max: 32, col: COL[type] || '#fff', size: Math.random() < 0.3 ? 2 : 1, grav: heavy ? 0.2 : 0.05 });
    }
  };
  Game.onPlayerJump = (a) => { Game.burst(a.cx, a.y + a.h, 'dust', 6); AUDIO.play('jump'); };
  Game.onPlayerLand = (a) => { Game.burst(a.cx, a.y + a.h, 'dust', 4); };
  Game.onMount = () => {};
  function resumeZoneMusic() {
    const Z = Game.level && Game.level.zones[Game.zone];
    if (Z && ['play', 'respawn', 'pause'].includes(Game.state)) AUDIO.playMusic(SONGS[Z.music]);
  }
  // en la cumbre del Apu suena una frase de El Cóndor Pasa (o su corto) y luego vuelve la música del tramo
  Game.onGoatDone = () => {
    const s = SONGS.condorPasa; if (!s) return;
    AUDIO.playMusic(s);
    CORTO.play('CUMBRE DEL APU', resumeZoneMusic);
    const token = Game.jingle = {}, ms = (s.chords.length - 1) * (s.bar || 8) * 60 / s.bpm / 4 * 1000 + 150;
    setTimeout(() => {
      if (Game.jingle !== token || CORTO.playing()) return;
      Game.jingle = null;
      resumeZoneMusic();
    }, ms);
  };
  Game.setCheckpoint = (cp) => {
    Game.spawn = { x: cp.spawn.x, y: cp.spawn.y }; GUIDE.onCheckpoint(cp);
    const m = Game.player.riding;
    Game.spawnMount = m && !m.retired ? m : null;
  };
  Game.playerEnvDeath = (kind) => {
    if (Game.state !== 'play') return;
    const p = Game.player, a = p.riding || p;
    if (kind === 'water') { AUDIO.play('splash'); Game.burst(a.cx, a.y + a.h, 'splash', 18); }
    else if (kind === 'mud') AUDIO.play('drown');
    else if (kind === 'caiman') { AUDIO.play('snap'); AUDIO.play('splash'); Game.shake(3, 10); Game.burst(a.cx, a.cy, 'swampSplash', 20); }
    else if (kind === 'bird' || kind === 'eagle') { AUDIO.play('crush'); Game.shake(3, 10); Game.burst(a.cx, a.cy, 'feather', 16); }
    else if (kind === 'puma') AUDIO.play('fall');
    else if (kind === 'rock') { AUDIO.play('crush'); Game.shake(4, 12); Game.burst(a.cx, a.cy, 'rock', 14); }
    else if (kind === 'combi' || kind === 'buggy' || kind === 'carretilla' || kind === 'bici') { AUDIO.play('crush'); AUDIO.play('honk'); Game.shake(4, 12); Game.burst(a.cx, a.cy, 'dust', 18); }
    else if (kind === 'cactus' || kind === 'rebar') { AUDIO.play('ouch'); Game.shake(2, 8); Game.burst(a.cx, a.cy, 'spark', 12); }
    else if (kind === 'dog') { AUDIO.play('bark'); AUDIO.play('crush'); Game.shake(3, 10); Game.burst(a.cx, a.cy, 'dust', 14); }
    else AUDIO.play('fall');
    Game.deaths++; Game.lastDeath = kind; Game.state = 'respawn'; Game.stateT = 0;
    GUIDE.onDeath(Game); VOICE.play('muerte', 250);
  };
  Game.gameComplete = () => {
    if (Game.state !== 'play') return;
    Game.arrival = clockMinutes();
    Game.runMs = performance.now() - Game.runStart - Game.pausedMs;
    Game.state = 'win'; Game.stateT = 0; Game.winSel = 0;
    AUDIO.stopMusic(); AUDIO.play('bell'); AUDIO.play('win');
    VOICE.play(Game.arrival < CLASS_START ? 'gana' : 'tarde', 900);
  };

  Game.respawn = function () {
    const p = Game.player;
    Game.camLock = null; p.grabbed = false; Game.faint = null; Game.sorocheLvl = 0; Game.sorocheK = 0;
    for (const e of Game.entities) { if (e instanceof Mount && !e.retired) e.reset(); if (e.onRespawn) e.onRespawn(Game); }
    Game.entities = Game.entities.filter(e => !(e instanceof Boulder));
    p.riding = null; p.mountCd = 0; p.x = Game.spawn.x; p.y = Game.spawn.y - p.h;
    p.vx = 0; p.vy = 0; p.dragged = false; p.overEdge = false; p.stickT = 0; p.gliding = false; p.glideAir = 0; p.fallFrom = null;
    Game.entities = Game.entities.filter(e => !(e instanceof FallingLeaf)); p.mountCd = 0; p.invuln = 50; p.lastMover = null;
    const m = Game.spawnMount && !Game.spawnMount.retired ? Game.spawnMount : null;
    if (m) { m.x = p.cx - m.w / 2; m.y = Game.spawn.y - m.h; m.vx = 0; m.vy = 0; p.mount(m, Game, true); }
    Game.floorY = p.cy;
    updateCamera(true);
    Input.clearJump(); GUIDE.onRespawn(Game);
    Game.state = 'play'; Game.fade = 0.8;
  };

  // ── cargar ───────────────────────────────────────────────────────────────
  function startGame(ci) {
    Game.camLock = null;
    if (ci == null) ci = Game.chapterIdx;
    const ch = CHAPTERS[ci], lv = ch.level;
    Game.chapterIdx = ci; Game.chapter = ch; Game.menuChapter = ci; Game.jingle = null;
    CORTO.reset();
    Game.soroche = false; Game.sorocheK = 0; Game.sorocheLvl = 0; Game.cocaFlash = 0; Game.faint = null; Game.sorocheTold = false; Game.sorocheFlash = 0;
    DAY_START = ch.dayStart || DAY_START_DEFAULT;
    Game.level = lv;
    Game.entities = []; Game.movers = []; Game.particles = []; Game.huaico = null;
    Game.pages = 0; Game.score = 0; Game.deaths = 0; Game.time = 0;
    if (ch.onStart) ch.onStart(Game);   // contadores propios del capítulo
    // cronómetro real para el ranking (las pausas no cuentan) y ticket de la partida
    Game.runStart = performance.now(); Game.pausedMs = 0; Game.runMs = 0; Game.rankResult = null; Game.shareMsg = null;
    if (typeof RANKING !== 'undefined') RANKING.start(ch.num);
    for (const def of lv.entities) { const e = makeEntity(def, lv); if (e) { Game.entities.push(e); if (e.isMover) Game.movers.push(e); } }
    for (const e of Game.entities.slice()) if (e instanceof Huaico) { Game.huaico = e; e.prefill(Game); }
    const px = lv.spawn.x * TILE + 4, py = lv.spawn.y * TILE - 15;
    Game.player = new Player(px, py);
    Game.spawn = { x: px, y: lv.spawn.y * TILE }; Game.spawnMount = null;
    Game.zone = -1; Game.banner = 0; Game.toastMsg = null;
    Game.look = LOOK_X * 0.6; Game.floorY = Game.player.cy;
    updateCamera(true); GUIDE.start(Game); Game.lateTold = false;
    Game.state = 'play'; Game.stateT = 0; Game.fade = 1;
  }

  // ── cámara ───────────────────────────────────────────────────────────────
  // La cámara anticipa: mira hacia donde vas (el personaje queda a ~1/3 de la
  // pantalla y ves ~2/3 de lo que viene). En reposo no recentra, así no marea.
  const LOOK_X = 84;
  function updateCamera(snap) {
    // un puma se lleva al niño: la cámara se queda quieta donde estaba
    if (Game.camLock && !snap) { Game.cam.x = Game.camLock.x; Game.cam.y = Game.camLock.y; return; }
    const lv = Game.level, p = Game.player, cam = Game.cam;
    const body = p.riding || p;
    const own = p.riding ? p.riding.vx : p.vx;
    const maxV = p.riding instanceof Llama ? PHYS.LLAMA_MAX : (p.riding && p.riding.camMax) || PHYS.RUN_MAX;
    let want = Game.look;
    if (Math.abs(own) > 0.5) want = Math.sign(own) * LOOK_X * Math.min(1, 0.6 + Math.abs(own) / maxV * 0.4);
    if (p.riding instanceof Cabra) want = clamp(want, -36, 36);
    const reversing = Math.sign(want) !== Math.sign(Game.look) && Math.abs(Game.look) > 4;
    Game.look += (want - Game.look) * (reversing ? 0.025 : 0.05);

    // vertical: seguimos el "suelo" donde aterrizas, no cada salto
    if (body.onGround || snap) Game.floorY = p.cy;
    let focusY = Game.floorY, off = BASE_H * 0.62;
    if (p.cy > Game.floorY + 10) focusY = p.cy; // cayendo: lo seguimos ya
    if (p.gliding && !p.onGround) {
      // planeando: mira abajo; si hay águilas cerca deja sitio arriba para verlas
      const eagles = Game.entities.some(e => e instanceof Eagle && e.state !== 'idle' && e.state !== 'leave');
      focusY = p.cy; off = BASE_H * (eagles ? 0.58 : 0.32);
    }
    if (p.riding instanceof Cabra) {
      const descending = lv.mountain && p.cx > lv.mountain.peakX * TILE + 40;
      if (descending) { focusY = p.cy; off = BASE_H * 0.36; }                   // bajando: mira abajo
      else { focusY = Math.min(Game.floorY, p.cy + 10); off = BASE_H * 0.72; }  // trepando: mira arriba
    }

    const tx = p.cx + Game.look - BASE_W / 2, ty = focusY - off;
    if (snap) { cam.x = tx; cam.y = ty; }
    else { cam.x += (tx - cam.x) * 0.14; cam.y += (ty - cam.y) * 0.08; }
    // márgenes duros: el jugador nunca toca los bordes
    const sx = p.cx - cam.x, sy = p.cy - cam.y;
    if (sx < BASE_W * 0.2) cam.x = p.cx - BASE_W * 0.2;
    if (sx > BASE_W * 0.8) cam.x = p.cx - BASE_W * 0.8;
    if (sy < BASE_H * 0.22) cam.y = p.cy - BASE_H * 0.22;
    if (sy > BASE_H * 0.86) cam.y = p.cy - BASE_H * 0.86;
    cam.x = clamp(cam.x, 0, lv.cols * TILE - BASE_W);
    cam.y = clamp(cam.y, 0, lv.rows * TILE - BASE_H);
  }

  // ── SOROCHE: el mal de altura del Apu ──────────────────────────────────
  // Un nivel de 0 a 1 (la barra de OXÍGENO bajo el altímetro se vacía al subir):
  // sube pasando lev.soroche.startM metros, más rápido cuanto más alto; baja si
  // desciendes. Los síntomas llegan antes de vaciarse: pasada la mitad la vista
  // empieza a ondular y a verse doble, cada vez más; cerca del final vas más lento
  // y el corazón late fuerte. Si se vacía del todo, el niño se desmaya y cae de la
  // cabra al vacío. Cada hojita de coca lo baja un buen tramo. Nada de texto.
  function altitudeM() {
    const A = Game.level.altitude, p = Game.player;
    return A.baseM + (A.baseRow * TILE - (p.y + p.h)) / TILE * A.perRow;
  }
  function updateSoroche() {
    const S = Game.level.soroche, Z = Game.level.zones[Game.zone];
    if (!S) { Game.soroche = false; Game.sorocheK = 0; Game.sorocheLvl = 0; return; }
    const start = S.startM || (S.minM - 300), alt = Z && Z.alt ? altitudeM() : 0;
    // dos ritmos: baja rápido hasta que aparecen los síntomas (así se notan pronto) y
    // desde ahí despacio, para que dé tiempo de entender qué pasa y buscar coca
    const onset = S.onset || 0.3;
    if (alt > start) Game.sorocheLvl = Math.min(1, Game.sorocheLvl + (Game.sorocheLvl < onset ? (S.fast || 0.0025) : (S.rate || 0.0007) * (1 + (alt - start) / (S.div || 600))));
    else Game.sorocheLvl = Math.max(0, Game.sorocheLvl - 0.003);
    const k = Game.sorocheLvl, was = Game.soroche;
    Game.soroche = k > 0.8;   // ya cuesta moverse
    if (Game.soroche && !was) AUDIO.play('dizzy');
    // los síntomas llegan de golpe y bien notorios (la vista ondula y se ve doble),
    // y empeoran cuanto menos oxígeno queda
    Game.sorocheK += ((k < onset ? 0 : 0.7 + 0.3 * (k - onset) / (1 - onset)) - Game.sorocheK) * 0.04;
    // la primera vez: aviso (una sola vez por partida) y la barra se resalta un rato
    if (k >= onset && !Game.sorocheTold) {
      Game.sorocheTold = true; Game.sorocheFlash = 360;
      Game.toast('¡TE DIO SOROCHE! ¡BUSCA HOJAS DE COCA!');
    }
    // el corazón late más rápido mientras más se vacía
    if (k >= onset && tick % (k > 0.9 ? 30 : k > 0.75 ? 40 : 55) === 0) AUDIO.play('heart');
    // sin oxígeno: se desmaya y cae en picada (la cámara se queda quieta)
    const p = Game.player;
    if (k >= 1 && !Game.faint && Game.state === 'play' && !p.grabbed) {
      Game.faint = { t: 0, vx: (p.riding ? p.riding.facing : p.facing || 1) * -0.8 };
      if (p.riding) { const m = p.riding; p.riding = null; m.rider = null; }
      p.grabbed = true; p.vy = -2.5; p.invuln = 999; p.mountCd = 9999;   // (que no se vuelva a montar al rozar la cabra)
      Game.camLock = { x: Game.cam.x, y: Game.cam.y };
      AUDIO.play('dizzy');   // el golpe suena recién al salir de la pantalla
    }
    if (Game.faint) {
      const f = Game.faint; f.t++;
      p.vy = Math.min(p.vy + 0.32, 8); p.y += p.vy; p.x += f.vx;
      if (p.y > Game.cam.y + VIEW.h + 12) { p.invuln = 0; Game.playerEnvDeath('soroche'); }
    }
  }
  Game.cureSoroche = () => { Game.sorocheLvl = Math.max(0, Game.sorocheLvl - 0.7); Game.cocaFlash = 30; };
  // la barra del soroche: pulmones + barra que se llena (verde → amarillo → rojo)
  function renderSorocheBar() {
    const Z = Game.level.zones[Game.zone];
    if (!Game.level.soroche || !(Z && Z.alt) && Game.sorocheLvl < 0.01) return;
    const k = Game.sorocheLvl, x = BASE_W - 58, y = 24, w = 52;
    panel(x - 18, y, w + 22, 13);
    // pulmones (el soroche es falta de aire): respiran agitados cuanto más llena la barra
    const beat = Game.soroche ? Math.floor(tick / 10) % 2 : k > 0.8 ? Math.floor(tick / 18) % 2 : 0;
    const LUNG = ['.....t.....', '.....t.....', '..oo.t.oo..', '.oPPotoPPo.', 'oPPPo.oPPPo', 'oPPPo.oPPPo', 'oPPPo.oPPPo', '.oPPo.oPPo.', '..oo...oo..'];
    const LC = { t: '#e8dcd0', o: '#a8423e', P: beat ? '#ffa8a0' : '#e07a7a' };
    LUNG.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (LC[r[i]]) { ctx.fillStyle = LC[r[i]]; ctx.fillRect(x - 15 + i + (beat && r[i] !== 't' ? (i < 5 ? -1 : 1) : 0), y + 2 + j, 1, 1); } });
    ctx.fillStyle = '#1d1622'; ctx.fillRect(x, y + 3, w, 6);
    // barra de OXÍGENO: llena abajo, se vacía al subir; vacía = soroche
    const col = k < 0.5 ? '#9be7c4' : k < 0.8 ? '#ffd166' : '#f2917d';
    const blink = Game.soroche && Math.floor(tick / 10) % 2;
    ctx.fillStyle = blink ? '#f2917d' : col; ctx.fillRect(x + 1, y + 4, Math.max(Game.soroche ? 2 : 0, Math.round((w - 2) * (1 - k))), 4);
    // recién aparecido el soroche: borde dorado que parpadea alrededor de la barra
    if (Game.sorocheFlash > 0) {
      Game.sorocheFlash--;
      if (Math.floor(Game.sorocheFlash / 12) % 2 === 0) { ctx.fillStyle = '#ffd166'; ctx.fillRect(x - 20, y - 2, w + 26, 1); ctx.fillRect(x - 20, y + 14, w + 26, 1); ctx.fillRect(x - 20, y - 2, 1, 17); ctx.fillRect(x + w + 5, y - 2, 1, 17); }
    }
    if (Game.cocaFlash > 0) { Game.cocaFlash--; ctx.fillStyle = 'rgba(155,231,196,' + (Game.cocaFlash / 30).toFixed(2) + ')'; ctx.fillRect(x - 18, y, w + 22, 12); }
  }
  // la vista ondula y se ve doble, con un tinte verdoso
  let sorocheBuf = null;
  function renderSoroche(k) {
    if (!sorocheBuf || sorocheBuf.width !== BASE_W || sorocheBuf.height !== BASE_H) sorocheBuf = PIX.createCanvas(BASE_W, BASE_H);
    const b = sorocheBuf.getContext('2d'); b.clearRect(0, 0, BASE_W, BASE_H); b.drawImage(canvas, 0, 0);
    for (let y = 0; y < BASE_H; y += 2) {
      const off = Math.round(Math.sin(y * 0.045 + tick * 0.06) * 4.5 * k);
      if (off) ctx.drawImage(sorocheBuf, 0, y, BASE_W, 2, off, y, BASE_W, 2);
    }
    ctx.globalAlpha = 0.3 * k; ctx.drawImage(sorocheBuf, Math.round(5 + Math.sin(tick * 0.03) * 4), Math.round(Math.sin(tick * 0.021) * 2)); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(110,150,80,' + (0.12 * k).toFixed(3) + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    // bordes oscuros que laten con el corazón
    const beat = Math.max(0, 1 - (tick % 50) / 14);
    const vg = ctx.createRadialGradient(BASE_W / 2, BASE_H / 2, BASE_H * 0.15, BASE_W / 2, BASE_H / 2, BASE_W * 0.6);
    vg.addColorStop(0, 'rgba(20,10,30,0)'); vg.addColorStop(1, 'rgba(20,10,30,' + ((0.6 + 0.3 * beat) * k).toFixed(3) + ')');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, BASE_W, BASE_H);
  }

  // ── zonas: la música cambia por tramo ─────────────────────────────────────
  function updateZone() {
    const lv = Game.level, x = Game.player.cx / TILE;
    let z = 0;
    for (let i = 0; i < lv.zones.length; i++) if (x >= lv.zones[i].x) z = i;
    if (z > Game.zone) {
      Game.zone = z; const Z = lv.zones[z];
      Game.zoneName = Z.name;
      // un corto sigue sonando aunque cambies de tramo; al terminar vuelve la música del tramo en que estés
      if (!CORTO.playing()) AUDIO.playMusic(SONGS[Z.music]);
      CORTO.play(Z.name, resumeZoneMusic);
    }
  }

  // ── lógica ───────────────────────────────────────────────────────────────
  function update() {
    tick++; Game.T = tick;
    Input.update();
    if (Game.shakeT > 0) { Game.shakeT--; if (Game.shakeT === 0) Game.shakeMag = 0; }
    Game.fade = Math.max(0, Game.fade - 0.05);

    if (Game.rk) { updateRank(); Input.endFrame(); return; }   // panel del ranking encima de todo
    const before = Game.state;
    switch (Game.state) {
      case 'menu': updateMenu(); break;
      case 'controls': if (Input.pressed('confirm') || Input.pressed('jump') || Input.pressed('pause')) { AUDIO.play('select'); Game.state = 'menu'; } break;
      case 'play': updatePlay(); break;
      case 'pause': updatePause(); break;
      case 'respawn':
        Game.stateT++; updateParticles();
        if (Game.stateT > 30 && (Input.pressed('confirm') || Input.pressed('jump') || Input.pressed('up'))) { AUDIO.play('select'); Game.respawn(); }
        break;
      case 'win':
        Game.stateT++; updateParticles();
        for (const e of Game.entities) if (e instanceof School) e.update(Game);
        updateWin();
        break;
      case 'ending': updateEnding(); break;
    }
    // las pausas no cuentan en el tiempo del ranking
    if (before !== Game.state) {
      if (Game.state === 'pause') Game.pauseAt = performance.now();
      else if (before === 'pause' && Game.pauseAt) { Game.pausedMs += performance.now() - Game.pauseAt; Game.pauseAt = 0; }
    }
    let rv = 0, mv = 0, jv = 0;
    if (Game.level && (Game.state === 'play' || Game.state === 'respawn')) [rv, mv, jv] = ambientVolumes();
    AUDIO.updateAmbient(rv, mv, jv);
    Input.endFrame();
  }

  function ambientVolumes() {
    const p = Game.player; let r = 0, m = 0, j = 0;
    for (const L of Game.level.liquids) {
      const X0 = L.x * TILE, X1 = (L.x + L.w) * TILE, wl = L.y * TILE + 4;
      const dx = p.cx < X0 ? X0 - p.cx : p.cx > X1 ? p.cx - X1 : 0;
      const dy = Math.max(0, Math.abs(p.cy - wl) - 40);
      const d = Math.hypot(dx, dy);
      if (L.kind === 'water') r = Math.max(r, 1 - d / 230); else if (L.kind === 'mud') m = Math.max(m, 1 - d / 300); else j = Math.max(j, 1 - d / 260);
    }
    return [clamp(r, 0, 1), clamp(m, 0, 1), clamp(j, 0, 1)];
  }

  // la primera fila del menú es el selector de capítulo (izquierda/derecha elige)
  // (RANKING solo aparece si la API del ranking está configurada)
  const rankOn = () => typeof RANKING !== 'undefined' && RANKING.enabled();
  const MENU_KEYS = () => ['play', 'controls', ...(rankOn() ? ['ranking'] : []), 'sound'];
  const MENU_LABEL = { play: 'JUGAR', controls: 'CONTROLES', ranking: 'RANKING' };
  const MENU_OPTS = () => MENU_KEYS().map(k => MENU_LABEL[k] || (AUDIO.isEnabled() ? 'SONIDO: SÍ' : 'SONIDO: NO'));
  const MENU_Y = 150, MENU_DY = 16, CARDS_Y = 104;
  function menuActivate(i) {
    AUDIO.resume();
    const k = MENU_KEYS()[i];
    if (k === 'play') {
      if (CHAPTERS[Game.menuChapter]) { AUDIO.play('start'); startGame(Game.menuChapter); }
      else { AUDIO.play('nope'); Game.lockedT = 24; }   // aún no existe: la tarjeta tiembla
    }
    else if (k === 'controls') { AUDIO.play('select'); Game.state = 'controls'; }
    else if (k === 'ranking') {
      AUDIO.play('select');
      if (CHAPTERS[Game.menuChapter]) openRank(Game.menuChapter + 1, false); else { AUDIO.play('nope'); Game.lockedT = 24; }
    }
    else { AUDIO.toggleMute(); AUDIO.play('select'); }
  }
  function updateMenu() {
    if (Game.lockedT > 0) Game.lockedT--;
    const n = MENU_KEYS().length;
    if (Input.pressed('up')) { Game.menuSel = (Game.menuSel + n - 1) % n; AUDIO.play('select'); }
    if (Input.pressed('down')) { Game.menuSel = (Game.menuSel + 1) % n; AUDIO.play('select'); }
    if (Game.menuSel === 0) {
      const d = (Input.pressed('right') ? 1 : 0) - (Input.pressed('left') ? 1 : 0);
      if (d) { Game.menuChapter = mod(Game.menuChapter + d, CHAPTER_SLOTS); Game.lockedT = 0; AUDIO.play('select'); }
    }
    if (Input.pressed('confirm') || Input.pressed('jump')) menuActivate(Game.menuSel);
  }
  // pantalla final: pasar al siguiente capítulo o volver al menú
  // (con ranking: también entrar al ranking y compartir la hora de llegada)
  function winOptions() {
    return [...(CHAPTERS[Game.chapterIdx + 1] ? ['next'] : []), ...(Game.chapter.ending ? ['ending'] : []), ...(rankOn() ? ['ranking', 'share'] : []), 'menu'];
  }
  function updateWin() {
    const opts = winOptions();
    if (Game.shareMsg && ++Game.shareMsg.t > 120) Game.shareMsg = null;
    if (Game.stateT <= 90) return;
    const d = (Input.pressed('right') || Input.pressed('down') ? 1 : 0) - (Input.pressed('left') || Input.pressed('up') ? 1 : 0);
    if (opts.length > 1 && d) { Game.winSel = mod(Game.winSel + d, opts.length); AUDIO.play('select'); }
    if (Input.pressed('confirm') || Input.pressed('jump')) {
      AUDIO.play('select');
      const o = opts[Math.min(Game.winSel, opts.length - 1)];
      if (o === 'next') { AUDIO.play('start'); startGame(Game.chapterIdx + 1); }
      else if (o === 'ending') startEnding();
      else if (o === 'ranking') openRank(Game.chapter.num, true);
      else if (o === 'share') shareArrival();
      else { Game.state = 'menu'; CORTO.stop(); AUDIO.playMusic(SONGS.menu); }
    }
  }

  // FINAL DEL JUEGO: el último capítulo trae su secuencia de cierre (ending:
  // { frames, music, start(g), skip(t), draw(ctx, w, h, t, tick) }). Salto la adelanta.
  function startEnding() {
    const E = Game.chapter.ending;
    Game.state = 'ending'; Game.stateT = 0; Game.fade = 1;
    if (E.start) E.start(Game);
    if (E.music && SONGS[E.music]) AUDIO.playMusic(SONGS[E.music]);
    CORTO.play('FINAL', () => { if (Game.state === 'ending' && E.music && SONGS[E.music]) AUDIO.playMusic(SONGS[E.music]); });
  }
  function updateEnding() {
    const E = Game.chapter.ending;
    Game.stateT++;
    if (Game.stateT > 20 && (Input.pressed('confirm') || Input.pressed('jump'))) Game.stateT = E.skip(Game.stateT);
    if (Game.stateT >= E.frames) { Game.state = 'menu'; CORTO.stop(); AUDIO.playMusic(SONGS.menu); }
  }

  // ── RANKING ──────────────────────────────────────────────────────────────
  // Panel encima del juego: primero el nombre (formulario HTML de ranking.js),
  // luego tu puesto y el top 10. Si la API falla, un aviso corto y se sigue jugando.
  function openRank(chapter, submit) {
    const rk = Game.rk = { chapter, phase: submit ? 'form' : 'loading', result: null, top: null, error: null, t: 0 };
    const loadTop = () => {
      rk.phase = 'loading';
      RANKING.top(chapter, 10).then(top => { rk.top = top; rk.phase = 'show'; })
        .catch(() => { rk.error = 'SIN CONEXIÓN CON EL RANKING'; rk.phase = 'show'; });
    };
    if (!submit) { loadTop(); return; }
    // ya enviado en esta partida: solo se vuelve a mirar
    if (Game.rankResult) { rk.result = Game.rankResult; loadTop(); return; }
    RANKING.askAndSubmit(Game.runMs, Game.deaths)
      .then(res => { if (res) { rk.result = Game.rankResult = res; AUDIO.play('page'); } loadTop(); })
      .catch(() => { rk.error = 'SIN CONEXIÓN CON EL RANKING'; rk.phase = 'show'; });
  }
  function updateRank() {
    const rk = Game.rk; rk.t++;
    if (rk.phase !== 'show' || rk.t < 10) return;
    if (Input.pressed('confirm') || Input.pressed('jump') || Input.pressed('pause')) { AUDIO.play('select'); Game.rk = null; }
  }
  function shareArrival() {
    const text = RANKING.shareText(clockText(Game.arrival), Game.chapter.title);
    Game.shareMsg = { text: '...', t: 0 };
    RANKING.share(text).then(r => {
      Game.shareMsg = r === 'cancel' ? null : { text: r === 'shared' ? '¡COMPARTIDO!' : r === 'copied' ? '¡COPIADO!' : 'NO SE PUDO COMPARTIR', t: 0 };
    });
  }
  const fmtTime = (ms) => { const s = ms / 1000, m = Math.floor(s / 60); return m + ':' + (s - m * 60).toFixed(1).padStart(4, '0'); };
  function renderRank() {
    const rk = Game.rk;
    ctx.fillStyle = 'rgba(11,10,18,0.9)'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    if (rk.phase === 'form') return;   // el formulario HTML va encima
    drawText(ctx, 'RANKING', BASE_W / 2, 10, { scale: 2, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
    const ch = CHAPTERS[rk.chapter - 1];
    drawText(ctx, 'CAPÍTULO ' + rk.chapter + (ch && BASE_W >= 300 ? ': ' + ch.title : ''), BASE_W / 2, 30, { color: '#cdbde8', align: 'center' });
    let y = 44;
    if (rk.result) {
      const r = rk.result;
      drawText(ctx, 'TU PUESTO: #' + r.rank + ' DE ' + r.total, BASE_W / 2, y, { color: '#9be7c4', align: 'center' });
      if (r.newBest && r.total > 1) drawText(ctx, '¡NUEVO RÉCORD PERSONAL!', BASE_W / 2, y + 10, { color: '#ffd166', align: 'center' });
      y += 22;
    } else y += 6;
    if (rk.phase === 'loading') drawText(ctx, 'CARGANDO...', BASE_W / 2, y + 30, { color: '#fff3d6', align: 'center' });
    else if (rk.error) drawText(ctx, rk.error, BASE_W / 2, y + 30, { color: '#f2917d', align: 'center' });
    else if (!rk.top || !rk.top.length) drawText(ctx, '¡NADIE TODAVÍA! SÉ EL PRIMERO', BASE_W / 2, y + 30, { color: '#fff3d6', align: 'center' });
    else {
      const half = Math.min(150, BASE_W / 2 - 10), me = (typeof RANKING !== 'undefined' && RANKING.name() || '').toUpperCase();
      rk.top.forEach((s, i) => {
        const yy = y + i * 11, mine = me && String(s.name).toUpperCase() === me;
        const col = mine ? '#9be7c4' : i === 0 ? '#ffd166' : '#fff3d6';
        drawText(ctx, (i + 1) + '.', BASE_W / 2 - half + 14, yy, { color: col, align: 'right' });
        drawText(ctx, String(s.name).slice(0, 16), BASE_W / 2 - half + 20, yy, { color: col });
        drawText(ctx, fmtTime(s.timeMs), BASE_W / 2 + half, yy, { color: col, align: 'right' });
      });
    }
    if (rk.phase === 'show' && Math.floor(tick / 24) % 2 === 0) drawText(ctx, BASE_W < 300 ? 'PULSA A PARA VOLVER' : 'PULSA ESPACIO PARA VOLVER', BASE_W / 2, BASE_H - 16, { color: '#fff3d6', align: 'center' });
  }
  const PAUSE_OPTS = ['CONTINUAR', 'REINICIAR', 'MENÚ'];
  function pauseActivate(i) {
    AUDIO.play('select');
    if (i === 0) Game.state = 'play';
    else if (i === 1) startGame();
    else { Game.state = 'menu'; CORTO.stop(); AUDIO.playMusic(SONGS.menu); }
  }
  function updatePause() {
    if (Input.pressed('up')) { Game.pauseSel = (Game.pauseSel + 2) % 3; AUDIO.play('select'); }
    if (Input.pressed('down')) { Game.pauseSel = (Game.pauseSel + 1) % 3; AUDIO.play('select'); }
    if (Input.pressed('pause')) { Game.state = 'play'; AUDIO.play('select'); return; }
    if (Input.pressed('confirm') || Input.pressed('jump')) pauseActivate(Game.pauseSel);
  }

  function updatePlay() {
    const p = Game.player;
    if (Input.pressed('pause')) { Game.state = 'pause'; Game.pauseSel = 0; AUDIO.play('select'); return; }
    if (Input.pressed('mute')) AUDIO.toggleMute();
    Game.time++; Game.banner++;
    // los avisos duran lo que toma leerlos: ~2,5 s más un poco por cada letra
    if (Game.toastMsg && ++Game.toastMsg.t > 150 + Game.toastMsg.text.length * 4) Game.toastMsg = null;

    for (const m of Game.movers) m.update(Game);
    p.update(Game);
    for (const e of Game.entities) { if (e.dead || e.isMover) continue; e.update(Game); if (Game.state !== 'play') return; }
    Game.entities = Game.entities.filter(e => !e.dead);
    Game.movers = Game.movers.filter(e => !e.dead);

    collisionPass();
    updateParticles();
    updateZone();
    updateSoroche();
    updateCamera(false);
    GUIDE.update(Game);
    // el reloj pasa las 8:00 sin haber llegado: "¡ya fuiste!"
    if (!Game.lateTold && clockMinutes() >= CLASS_START) { Game.lateTold = true; VOICE.play('tarde'); }
    // el huaico hace temblar el suelo
    if (Game.zoneName === 'EL HUAICO' && tick % 90 === 0) Game.shake(1, 10);
  }

  function collisionPass() {
    const p = Game.player;
    if (p.won || Game.state !== 'play') return;
    const body = p.riding || p;
    const hb = { x: body.x + 2, y: body.y + 2, w: body.w - 4, h: body.h - 3 };
    for (const e of Game.entities) {
      if (e instanceof Mount) {
        if (e === p.riding || e.rider || e.retired || p.mountCd > 0) continue;
        if (p.riding instanceof Cabra) continue;
        if (p.riding && !(e instanceof Cabra)) continue;
        if (aabb(body, { x: e.x, y: e.y - 6, w: e.w, h: e.h + 6 })) p.mount(e, Game);
      } else if (e instanceof Eagle) {
        if (e.dangerous && p.invuln <= 0 && aabb(hb, e.hitbox)) { Game.playerEnvDeath('eagle'); return; }
      } else if (e instanceof Caiman) {
        if (e.dangerous && p.invuln <= 0 && aabb(hb, e.hitbox)) { Game.playerEnvDeath('caiman'); return; }
      } else if (e instanceof Condor) {
        if (p.invuln <= 0 && aabb(hb, e.hitbox)) { Game.playerEnvDeath('bird'); return; }
      } else if (e instanceof Boulder) {
        if (p.invuln <= 0 && aabb(hb, { x: e.x + 1, y: e.y + 1, w: e.w - 2, h: e.h - 2 })) { Game.playerEnvDeath('rock'); return; }
      } else if (e.hazardBox) {
        // peligros genéricos de los otros capítulos: dicen su caja y cómo te matan
        const hz = e.hazardBox(Game);
        if (hz && p.invuln <= 0 && aabb(hb, hz)) { Game.playerEnvDeath(e.hazardKind || 'hit'); return; }
      }
    }
  }

  function updateParticles() {
    const ps = Game.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const pt = ps[i];
      pt.vy += pt.grav; pt.x += pt.vx; pt.y += pt.vy; pt.vx *= 0.98;
      if (--pt.life <= 0) ps.splice(i, 1);
    }
  }

  // cielo, sol y capas de parallax en el canvas dado (se usa también para el fondo de la selva)
  let bgEastCanvas = null;
  // sky (opcional): { dawn, morning, sun: false } para cielos de otros capítulos
  function drawSkyAndLayers(ctx, layers, anchorRow, day, camx, camy, tag, sky) {
    const gr = ctx.createLinearGradient(0, 0, 0, BASE_H);
    const dawn = sky ? sky.dawn : SKY_DAWN, morning = sky ? sky.morning : SKY_MORNING;
    for (let i = 0; i < 3; i++) gr.addColorStop([0, 0.6, 1][i], lerpColor(dawn[i], morning[i], day));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, BASE_W, BASE_H);
    const anchor = anchorRow * TILE - BASE_H * 0.62;
    if (!sky || sky.sun !== false) {
      // sol naciente por el este, detrás de los cerros
      const sunX = 78 + day * 40, sunY = 112 - day * 82 - (camy - anchor) * 0.03;
      const sunCol = lerpColor('#ffb066', '#fff3cf', day);
      const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 150 - day * 90);
      glow.addColorStop(0, 'rgba(255,200,130,' + (0.75 - day * 0.45) + ')'); glow.addColorStop(1, 'rgba(255,170,110,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = sunCol; ctx.beginPath(); ctx.arc(sunX, sunY, 15, 0, Math.PI * 2); ctx.fill();
    }
    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      if (L.kind === 'clouds') { drawClouds(L, camx, -(camy - anchor) * 0.05, tag + 'c' + i, ctx); if (tag === 'w') drawSkyCondors(-(camy - anchor) * 0.06); continue; }
      const strip = getStrip(L, tag + 'l' + i);
      const off = -mod(camx * L.parallax, strip.width);
      const yoff = Math.round((L.y * TILE - anchor) - (camy - anchor) * L.vpar - 120);
      for (let x = off; x < BASE_W; x += strip.width) ctx.drawImage(strip, Math.round(x), yoff);
      if (yoff + strip.height < BASE_H) { ctx.fillStyle = L.color2; ctx.fillRect(0, yoff + strip.height, BASE_W, BASE_H); }
    }

  }

  // ── render ───────────────────────────────────────────────────────────────
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (Game.state === 'menu') { renderMenu(); if (Game.rk) renderRank(); return; }
    if (Game.state === 'controls') { renderMenu(); renderControls(); return; }
    if (Game.state === 'ending') { Game.chapter.ending.draw(ctx, BASE_W, BASE_H, Game.stateT, tick); renderOverlay(); return; }
    const lv = Game.level; if (!lv) return;

    let sx = 0, sy = 0;
    if (Game.shakeT > 0) { sx = rnd(-Game.shakeMag, Game.shakeMag); sy = rnd(-Game.shakeMag, Game.shakeMag); }

    // el día avanza con el reloj: amanece al empezar, mañana clara al llegar
    const day = dayProgress();
    const camx = Game.cam.x, camy = Game.cam.y;
    drawSkyAndLayers(ctx, lv.bgLayers, lv.anchorRow, day, camx, camy, 'w', lv.sky);
    // al bajar a la selva amazónica el fondo andino se funde con lomas de selva brumosas
    const E = lv.bgEast;
    if (E) {
      const w = clamp((camx / TILE - E.x0) / (E.x1 - E.x0), 0, 1);
      if (w > 0) {
        if (!bgEastCanvas || bgEastCanvas.width !== BASE_W || bgEastCanvas.height !== BASE_H) bgEastCanvas = PIX.createCanvas(BASE_W, BASE_H);
        const ec = bgEastCanvas.getContext('2d'); ec.imageSmoothingEnabled = false;
        drawSkyAndLayers(ec, E.layers, E.anchorRow, day, camx, camy, 'e');
        ctx.globalAlpha = w; ctx.drawImage(bgEastCanvas, 0, 0); ctx.globalAlpha = 1;
      }
    }
    // otros capítulos: varios fondos que se funden uno tras otro a lo largo del nivel
    (lv.bgZones || []).forEach((Z, i) => {
      const w = clamp((camx / TILE - Z.x0) / (Z.x1 - Z.x0), 0, 1);
      if (w <= 0) return;
      if (w >= 1) { drawSkyAndLayers(ctx, Z.layers, Z.anchorRow, day, camx, camy, 'z' + i, Z.sky); return; }
      if (!bgEastCanvas || bgEastCanvas.width !== BASE_W || bgEastCanvas.height !== BASE_H) bgEastCanvas = PIX.createCanvas(BASE_W, BASE_H);
      const ec = bgEastCanvas.getContext('2d'); ec.imageSmoothingEnabled = false;
      drawSkyAndLayers(ec, Z.layers, Z.anchorRow, day, camx, camy, 'z' + i, Z.sky);
      ctx.globalAlpha = w; ctx.drawImage(bgEastCanvas, 0, 0); ctx.globalAlpha = 1;
    });

    ctx.save();
    ctx.translate(Math.round(-camx + sx), Math.round(-camy + sy));
    renderMountain(lv);
    renderHill(lv);
    renderMist(lv);
    renderCanyon(lv);
    renderJungle(lv);
    renderBackdrop(lv);
    if (lv.renderBack) lv.renderBack(ctx, Game);   // terreno y decorado propios de otros capítulos
    for (const e of Game.entities) if (e.drawBack) e.drawBack(ctx, Game);
    renderTiles(lv);
    renderInflow(lv);
    renderLiquids(lv);
    renderDecor(lv);
    renderEntities();
    const p = Game.player;
    if (Game.state !== 'respawn' && !p.won) {
      // desmayado por el soroche: cae dando vueltas
      if (Game.faint) { ctx.save(); ctx.translate(Math.round(p.cx), Math.round(p.cy)); ctx.rotate(Game.faint.t * 0.18 * Math.sign(Game.faint.vx || 1)); ctx.translate(-Math.round(p.cx), -Math.round(p.cy)); }
      p.draw(ctx, Game); p.drawRider(ctx);
      if (Game.faint) ctx.restore();
    }
    renderFront(lv);
    for (const e of Game.entities) if (e.drawFront) e.drawFront(ctx, Game);
    renderParticles();
    ctx.restore();
    renderSnowfall(lv, camy);
    if (lv.renderScreen) lv.renderScreen(ctx, Game);   // efectos de pantalla (garúa...)
    renderAttackAlert();
    if (Game.sorocheK > 0.01) renderSoroche(Game.sorocheK);
    // luz fría y violácea del amanecer que se va disipando
    if (day < 1) { ctx.fillStyle = 'rgba(70,40,110,' + (0.22 * (1 - day)) + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H); }

    renderHUD();
    if (Game.state === 'play') GUIDE.renderScreen(ctx, Game);
    renderOverlay();
    if (Game.rk) renderRank();
  }

  // pared del risco detrás de las salientes (decorado, no colisiona)
  let backTile = null;
  function getBackTile() {
    if (!backTile) { backTile = PIX.createCanvas(TILE, TILE); const g = backTile.getContext('2d'); g.drawImage(T.stone, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(70,50,60,0.42)'; g.fillRect(0, 0, TILE, TILE); }
    return backTile;
  }
  function renderBackdrop(lv) {
    const backTile = getBackTile();
    for (const r of lv.backdrop || []) {
      for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) {
        // borde irregular a la izquierda: la roca "sale" de la montaña
        if (x - r[0] < 3 - Math.floor(hash(y * 7) * 3)) continue;
        const px = x * TILE, py = y * TILE;
        if (px > Game.cam.x + BASE_W || px + TILE < Game.cam.x || py > Game.cam.y + BASE_H || py + TILE < Game.cam.y) continue;
        ctx.drawImage(backTile, px, py);
      }
    }
  }

  // ── la gran montaña: silueta de fondo, roca abajo y nieve arriba ─────────
  let snowBack = null, rockShade = null;
  function renderMountain(lv) {
    const M = lv.mountain; if (!M) return;
    const rock = getBackTile();
    if (!snowBack) {
      snowBack = PIX.createCanvas(TILE, TILE); let g = snowBack.getContext('2d'); g.drawImage(T.stone, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(236,242,255,0.78)'; g.fillRect(0, 0, TILE, TILE);
      rockShade = PIX.createCanvas(TILE, TILE); g = rockShade.getContext('2d'); g.fillStyle = 'rgba(20,14,40,0.28)'; g.fillRect(0, 0, TILE, TILE);
    }
    const r0 = Math.max(M.peakRow, Math.floor(Game.cam.y / TILE) - 1), r1 = Math.min(lv.rows - 1, Math.ceil((Game.cam.y + BASE_H) / TILE));
    const c0 = Math.floor(Game.cam.x / TILE) - 1, c1 = Math.ceil((Game.cam.x + BASE_W) / TILE);
    for (let r = r0; r <= r1; r++) {
      const sh = M.shape[r]; if (!sh) continue;
      const L = Math.round(sh[0] - hash(r * 13) * 1.5), R = Math.round(sh[1] + hash(r * 29) * 1.5);
      const snowLine = M.snowRow + Math.round(hash(r * 7) * 6 - 3);
      for (let c = Math.max(L, c0); c <= Math.min(R, c1); c++) {
        if (isSolidCode(lv.tile(c, r))) continue;
        const snowy = r < snowLine - Math.floor(hash(c * 31) * 5) || (r < snowLine + 8 && hash(c * 17 + r) > 0.75);
        const px = c * TILE, py = r * TILE;
        ctx.drawImage(snowy ? snowBack : rock, px, py);
        // estratos de roca: franjas más claras y más oscuras
        const band = Math.floor((r + Math.floor(hash(c >> 2) * 3)) / 4) % 3;
        if (!snowy && band !== 1) { ctx.fillStyle = band ? 'rgba(255,230,200,0.07)' : 'rgba(20,10,30,0.12)'; ctx.fillRect(px, py, TILE, TILE); }
        const h = hash(c * 131 + r * 17);
        if (!snowy) {
          if (h > 0.93) { ctx.fillStyle = 'rgba(25,15,30,0.55)'; ctx.fillRect(px + 5, py + 2, 1, 6); ctx.fillRect(px + 6, py + 7, 1, 5); ctx.fillRect(px + 7, py + 11, 1, 3); } // grieta
          else if (h > 0.88 && r > M.snowRow + 12) { ctx.globalAlpha = 0.75; ctx.drawImage(T.ichu, px, py + 6); ctx.globalAlpha = 1; } // ichu de altura
          else if (h > 0.85 && r < M.snowRow + 25) { ctx.fillStyle = 'rgba(240,246,255,0.6)'; ctx.fillRect(px + 2, py + 9, 7, 2); ctx.fillRect(px + 4, py + 8, 3, 1); } // manchón de nieve
        }
        if (c > M.peakX) ctx.drawImage(rockShade, px, py); // ladera en sombra
      }
    }
  }
  // nieve que cae cuando estás en lo alto de la montaña
  function renderSnowfall(lv, camy) {
    const M = lv.mountain; if (!M) return;
    const a = clamp((M.snowRow * TILE - camy) / 400, 0, 1); if (a <= 0) return;
    ctx.fillStyle = 'rgba(255,255,255,' + (0.85 * a) + ')';
    for (let i = 0; i < 70; i++) {
      const x = mod(hash(i * 3) * BASE_W + tick * (0.3 + hash(i) * 0.5) - Game.cam.x * 0.3, BASE_W);
      const y = mod(hash(i * 7) * BASE_H + tick * (0.6 + hash(i * 5) * 0.6) - camy * 0.3, BASE_H);
      ctx.fillRect(Math.round(x), Math.round(y), i % 5 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
    }
  }
  // rocas que van delante del lodo (los troncos pasan por detrás)
  function renderFront(lv) {
    // solo la cabeza de la roca va delante: lo que cae del escalón pasa por detrás
    for (const r of lv.fgRocks || []) for (let x = r[0]; x < r[0] + r[2]; x++) ctx.drawImage(T.mudRock, x * TILE, r[1] * TILE);
  }
  // el cerro verde de la ceja de selva de donde baja el huaico
  let hillTile = null;
  function renderHill(lv) {
    const Hh = lv.hill; if (!Hh) return;
    if (!hillTile) { hillTile = PIX.createCanvas(TILE, TILE); const c = hillTile.getContext('2d'); c.fillStyle = '#3d6e47'; c.fillRect(0, 0, TILE, TILE); c.globalAlpha = 0.35; c.drawImage(T.jungleBody, 0, 0); c.globalAlpha = 1; for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? '#4f8a52' : '#2f5a3c'; c.fillRect(Math.floor(hash(i * 5) * 14), Math.floor(hash(i * 9) * 15), 3, 1); } }
    const r0 = Math.max(Hh.peakRow, Math.floor(Game.cam.y / TILE) - 1), r1 = Math.min(lv.rows - 1, Math.ceil((Game.cam.y + BASE_H) / TILE));
    const c0 = Math.floor(Game.cam.x / TILE) - 1, c1 = Math.ceil((Game.cam.x + BASE_W) / TILE);
    for (let r = r0; r <= r1; r++) {
      const d = r - Hh.peakRow;
      // el cerro no empieza antes de x0 (detrás de la última roca fija): no debe parecer pisable
      const L = Math.max(Hh.x0 || -1e9, Math.round(Hh.peakX - d * Hh.slopeL - 1 - hash(r * 11) * 1.5)), R = Math.round(Hh.peakX + d * Hh.slopeR + 1 + hash(r * 37) * 1.5);
      for (let c = Math.max(L, c0); c <= Math.min(R, c1); c++) {
        // también detrás del lodo: así no asoma el cielo entre el lodo y el cerro
        if (isSolidCode(lv.tile(c, r))) continue;
        const px = c * TILE, py = r * TILE;
        ctx.drawImage(hillTile, px, py);
        const band = Math.floor((r + Math.floor(hash(c >> 2) * 3)) / 3) % 3;
        if (band !== 1) { ctx.fillStyle = band ? 'rgba(170,230,150,0.08)' : 'rgba(10,30,20,0.14)'; ctx.fillRect(px, py, TILE, TILE); }
        const h = hash(c * 71 + r * 13);
        if (h > 0.97) ctx.drawImage(T.bamboo, px, py);
        else if (h > 0.92) { ctx.globalAlpha = 0.85; ctx.drawImage(T.fern, px, py + 4); ctx.globalAlpha = 1; }
        if (c > Hh.peakX) { ctx.fillStyle = 'rgba(10,30,30,0.18)'; ctx.fillRect(px, py, TILE, TILE); }
      }
    }
  }
  // neblina de la ceja de selva: bancos de nube que se arrastran por el cerro
  function renderMist(lv) {
    const Hh = lv.hill; if (!Hh) return;
    const mx0 = (Hh.x0 - 70) * TILE, mx1 = (Hh.peakX + 16) * TILE;
    if (mx1 < Game.cam.x || mx0 > Game.cam.x + BASE_W) return;
    for (let i = 0; i < 9; i++) {
      const w = 90 + hash(i * 7) * 120, y = (Hh.peakRow - 4) * TILE + hash(i * 13) * 15 * TILE;
      let x = mx0 + ((hash(i * 3) * (mx1 - mx0) + tick * (0.15 + hash(i) * 0.15)) % (mx1 - mx0));
      if (x + w < Game.cam.x || x > Game.cam.x + BASE_W) continue;
      ctx.fillStyle = 'rgba(230,240,235,0.10)';
      ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), 10);
      ctx.fillRect(Math.round(x + w * 0.15), Math.round(y - 4), Math.round(w * 0.6), 4);
      ctx.fillRect(Math.round(x + w * 0.3), Math.round(y + 10), Math.round(w * 0.5), 3);
    }
  }
  // el huaico baja del cerro: una cascada de lodo ancha y violenta que nace de
  // una quebrada en la ladera; por ahí caen los troncos y lajas
  function renderInflow(lv) {
    const hu = Game.huaico; if (!hu || !hu.inflow) return;
    const Pl = LIQ.mud, x = hu.inflow.x, top = hu.inflow.y, s = hu.surfaceAt(x - 4);
    if (x + 80 < Game.cam.x || x - 80 > Game.cam.x + BASE_W || s < Game.cam.y) return;
    const H = s - top;
    // la quebrada: un tajo oscuro en la ladera
    ctx.fillStyle = 'rgba(40,16,10,0.55)';
    for (let y = top - 30; y < s; y += 2) { const k = (y - top + 30) / (H + 30); const w = 10 + k * k * 62; ctx.fillRect(Math.round(x - w / 2 - 4), y, Math.round(w + 8), 2); }
    // la cortina de lodo: estrecha arriba, ancha y furiosa abajo
    for (let y = top; y < s; y++) {
      const k = (y - top) / H, w = Math.round(14 + k * k * 60 + Math.sin(y * 0.2 + tick * 0.3) * 2);
      const a = Math.round(x - w / 2);
      ctx.fillStyle = Pl.bands[1]; ctx.fillRect(a, y, w, 1);
      ctx.fillStyle = Pl.bands[0]; ctx.fillRect(a, y, 2, 1); ctx.fillRect(a + w - 2, y, 2, 1);
    }
    for (let i = 0; i < 70; i++) {
      const xx = (hash(i * 13) - 0.5), yy = top + mod(hash(i * 7) * H + tick * (3 + hash(i * 3) * 2.5), H);
      const k = (yy - top) / H, w = 14 + k * k * 60;
      ctx.fillStyle = i % 3 === 0 ? Pl.foam : i % 3 === 1 ? Pl.hi : Pl.streak[0];
      ctx.fillRect(Math.round(x + xx * (w - 4)), Math.floor(yy), 1, Math.min(6, s - Math.floor(yy)));
    }
    // salpicadura y espuma donde golpea el lodo
    for (let j = 0; j < 40; j++) {
      const r = hash(j * 17 + Math.floor(tick / 2)); if (r < 0.25) continue;
      ctx.fillStyle = r > 0.7 ? Pl.foam : Pl.hi;
      ctx.fillRect(Math.round(x - 34 + hash(j * 3 + Math.floor(tick / 2)) * 68), Math.round(s - 2 - r * 10 * hash(j + Math.floor(tick / 2))), r > 0.9 ? 2 : 1, r > 0.9 ? 2 : 1);
    }
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#e8d2b0';
    for (let i = 0; i < 12; i++) { const life = mod(tick * 0.6 + i * 7, 30); ctx.fillRect(Math.round(x - 30 + hash(i * 41 + Math.floor((tick * 0.6 + i * 7) / 30)) * 60), Math.round(s - 4 - life), 3, 2); }
    ctx.globalAlpha = 1;
  }
  // el precipicio: el lodo se despeña al vacío por el borde del lecho
  function renderPrecipice(L, Pl, X0, wl, t) {
    const yEnd = Game.cam.y + BASE_H + 4; if (wl > yEnd) return;
    for (let c = -6; c < 1; c++) {
      ctx.fillStyle = Pl.bands[c < -4 ? 2 : c < -1 ? 1 : 0]; ctx.fillRect(X0 + c, wl, 1, yEnd - wl);
      for (let k = 0; k < 4; k++) { const yy = wl + mod(hash(c * 7 + k * 13) * 300 + t * (3 + k * 0.7), 300); if (yy > yEnd) continue; ctx.fillStyle = k ? Pl.hi : Pl.foam; ctx.fillRect(X0 + c, Math.floor(yy), 1, 4); }
    }
    for (let j = 0; j < 8; j++) { const r = hash(j * 23 + Math.floor(t / 3)); if (r < 0.4) continue; ctx.fillStyle = Pl.foam; ctx.fillRect(X0 - 4 + Math.floor(hash(j + Math.floor(t / 3) * 3) * 8), wl - 1 + Math.floor(r * 3), 1, 1); }
  }

  function renderTiles(lv) {
    const c0 = Math.max(0, Math.floor(Game.cam.x / TILE) - 1), c1 = Math.min(lv.cols - 1, Math.ceil((Game.cam.x + BASE_W) / TILE) + 1);
    const r0 = Math.max(0, Math.floor(Game.cam.y / TILE) - 1), r1 = Math.min(lv.rows - 1, Math.ceil((Game.cam.y + BASE_H) / TILE) + 1);
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
      const code = lv.tile(x, y); if (!code) continue;
      const spec = TILE_SPECS[code]; if (!spec || spec.liquid || spec.front) continue;
      const img = spec.top && !isSolidCode(lv.tile(x, y - 1)) ? spec.top : spec.body;
      if (img) ctx.drawImage(img, x * TILE, y * TILE);
    }
  }

  // ── agua y lodo: dibujados píxel a píxel, con corriente ───────────────────
  const LIQ = {
    water: { foam: '#ffffff', hi: '#d2f6f2', bands: ['#6fd6dc', '#4fbad0', '#3597bb', '#27739f', '#1d5683'], streak: ['#b4f0f0', '#8cdde6', '#69c2da', '#4ba0c6', '#3780ad'], speed: 1.0, amp: 1, chunks: null },
    swamp: { foam: '#c8ebd2', hi: '#7fae8c', bands: ['#3f6b55', '#30594a', '#24473b', '#1a372e', '#122822'], streak: ['#5a8a6c', '#4a7a5c', '#3a6a4c', '#2a5a3c', '#1a4a2c'], speed: 0, amp: 0.5, chunks: null },
    mud:   { foam: '#f0d6a8', hi: '#d6a56a', bands: ['#a8723c', '#8c5a2e', '#704623', '#56351a', '#3f2512'], streak: ['#dcae74', '#c2905a', '#a47546', '#875d36', '#6b4628'], speed: 1.3, amp: 1.7, chunks: ['#3a2414', '#5d5768', '#2a1f2d', '#6e4627'] },
  };
  const BAND_H = [5, 8, 12, 16, 9999];
  const surf = (x, t, flow, amp = 1) => Math.round((Math.sin(x * 0.19 - t * 0.11 * flow) * 0.9 + Math.sin(x * 0.067 - t * 0.05 * flow + 1.7) * 1.1) * amp);

  // agua quieta de la selva: reflejos de los troncos, hojitas flotando y ondas
  function renderSwamp(lv, L, Pl, X0, X1, wl, cx0, cx1, yBot, t) {
    // rocas: su parte sumergida se ve oscura bajo el agua, con espuma y ondas en la línea del agua
    for (const r of lv.swampRocks || []) {
      const rx = r[0] * TILE, rw = r[2] * TILE; if (rx + rw + 6 < cx0 || rx - 6 > cx1) continue;
      for (let y = wl + 2; y < Math.min(yBot, wl + 34); y++) {
        const k = (y - wl) / 34, inset = Math.round(hash(y * 7 + r[0]) * 2) - Math.round(k * 3);
        ctx.fillStyle = 'rgba(70,78,74,' + (0.55 * (1 - k)).toFixed(2) + ')';
        ctx.fillRect(rx + inset, y, rw - inset * 2, 1);
      }
      ctx.fillStyle = 'rgba(200,235,210,0.75)';
      const f = Math.floor(t / 10) % 2;
      ctx.fillRect(rx - 3 - f, wl, 3, 1); ctx.fillRect(rx + rw + f, wl, 3, 1);
      ctx.fillRect(rx - 1, wl + 1, rw + 2, 1);
      const rr = 4 + (t * 0.15 + r[0] * 5) % 10;
      ctx.fillStyle = 'rgba(200,235,210,' + (0.5 * (1 - ((t * 0.15 + r[0] * 5) % 10) / 10)).toFixed(2) + ')';
      ctx.fillRect(Math.round(rx - rr), wl + 2, 3, 1); ctx.fillRect(Math.round(rx + rw + rr - 3), wl + 2, 3, 1);
    }
    const J = lv.jungle;
    if (J) for (const tx of J.trees) {
      const x = tx * TILE + 2; if (x + 12 < cx0 || x > cx1) continue;
      ctx.fillStyle = 'rgba(20,30,15,0.35)';
      for (let y = wl + 2; y < Math.min(yBot, wl + 40); y += 2) ctx.fillRect(x + Math.round(Math.sin(y * 0.3 + t * 0.05)), y, 12, 1);
    }
    for (let i = 0; i < (X1 - X0) / 18; i++) {
      // hojitas y lentejas de agua que flotan quietas
      const x = X0 + Math.floor(hash(i * 13 + L.x) * (X1 - X0)); if (x < cx0 || x > cx1) continue;
      ctx.fillStyle = hash(i * 7) > 0.5 ? '#5f9f4a' : '#8fd062'; ctx.fillRect(x, wl + Math.round(Math.sin(t * 0.02 + i)), hash(i * 3) > 0.6 ? 3 : 2, 1);
    }
    for (let i = 0; i < 6; i++) {
      // ondas que se abren despacio
      const ph = (t * 0.3 + i * 37) % 120, k = Math.floor((t * 0.3 + i * 37) / 120);
      const x = X0 + Math.floor(hash(k * 17 + i * 5 + L.x) * (X1 - X0)); if (x < cx0 - 20 || x > cx1 + 20) continue;
      const r = 2 + ph / 10, a = Math.max(0, 1 - ph / 120);
      ctx.fillStyle = 'rgba(200,235,210,' + (0.5 * a).toFixed(2) + ')';
      ctx.fillRect(Math.round(x - r), wl + 1, 2, 1); ctx.fillRect(Math.round(x + r - 2), wl + 1, 2, 1); ctx.fillRect(Math.round(x - r * 0.5), wl + 2, Math.round(r), 1);
    }
  }

  // LA SELVA: fondo de follaje, troncos, lianas y rayos de sol entre las copas
  function renderJungle(lv) {
    const J = lv.jungle; if (!J) return;
    const x0 = J.x0 * TILE, x1 = J.x1 * TILE, wr = J.waterRow * TILE;
    if (x1 < Game.cam.x || x0 > Game.cam.x + BASE_W) return;
    const cx0 = Math.max(x0, Math.floor(Game.cam.x)), cx1 = Math.min(x1, Math.ceil(Game.cam.x + BASE_W));
    // muro de follaje al fondo, con el borde superior irregular
    // al final la selva se aclara poco a poco (el follaje se desvanece) en vez de cortarse de golpe
    const fadeA = (x) => J.fade ? clamp(Math.min(x1 - x, x - x0) / (J.fade * TILE), 0, 1) : 1;
    // en los bordes no se hace transparente (se veía el fondo a través): el follaje baja como una loma
    for (let x = cx0 - (cx0 % 4); x < cx1; x += 4) {
      const k = fadeA(x); if (k <= 0) continue;
      const top = wr - 150 + Math.round(Math.sin(x * 0.05) * 10 + hash(x >> 3) * 14) + Math.round(Math.pow(1 - k, 1.5) * 150);
      ctx.fillStyle = '#244a2c'; ctx.fillRect(x, top, 4, wr - top + 4);
      ctx.fillStyle = '#2f5d34'; ctx.fillRect(x, top, 4, 3);
    }
    for (let i = 0; i < 150; i++) {
      // manchas de hojas
      const x = x0 + Math.floor(hash(i * 31) * (x1 - x0)); if (x < cx0 - 10 || x > cx1) continue;
      const y = wr - 140 + Math.floor(hash(i * 17) * 120);
      if (fadeA(x) < 0.5) continue;
      ctx.fillStyle = hash(i * 3) > 0.5 ? '#2f6b3a' : '#1d4026'; ctx.fillRect(x, y, 6 + Math.floor(hash(i) * 6), 3); ctx.fillRect(x + 2, y - 2, 4, 2);
    }
    // rayos de sol entre las copas
    ctx.fillStyle = 'rgba(255,240,170,0.07)';
    for (let i = 0; i < 4; i++) {
      const bx = x0 + 120 + i * 260; if (bx + 120 < cx0 || bx - 40 > cx1) continue;
      ctx.beginPath(); ctx.moveTo(bx, wr - 170); ctx.lineTo(bx + 24, wr - 170); ctx.lineTo(bx + 110, wr); ctx.lineTo(bx + 70, wr); ctx.closePath(); ctx.fill();
    }
    // troncos y copas
    for (const tx of J.trees) {
      const x = tx * TILE + 2; if (x + 40 < cx0 || x - 40 > cx1) continue;
      ctx.fillStyle = '#4a3220'; ctx.fillRect(x, wr - 150, 12, 154);
      ctx.fillStyle = '#6b4a2c'; ctx.fillRect(x + 2, wr - 150, 3, 154);
      ctx.fillStyle = '#3a2414'; for (let y = wr - 146; y < wr; y += 9) ctx.fillRect(x + 6 + ((y >> 3) % 2) * 2, y, 3, 1);
      ctx.fillStyle = '#5f9f4a'; for (let y = wr - 120; y < wr; y += 23) ctx.fillRect(x + 9, y, 4, 2); // musgo
      ctx.fillStyle = '#2f6b3a';
      for (let k = 0; k < 7; k++) { const ox = Math.round(Math.cos(k * 0.9) * 26), oy = Math.round(Math.sin(k * 1.7) * 9); ctx.fillRect(x + 6 + ox - 12, wr - 160 + oy, 24, 10); }
      ctx.fillStyle = '#3f8a46';
      for (let k = 0; k < 5; k++) { const ox = Math.round(Math.cos(k * 1.3) * 20); ctx.fillRect(x + 6 + ox - 8, wr - 166 + k * 2, 16, 4); }
    }
    // lianas que cuelgan y se mecen
    for (let i = 0; i < 18; i++) {
      const x = x0 + 40 + (J.fade || 0) * TILE + Math.floor(hash(i * 43) * (x1 - x0 - 80 - 2 * (J.fade || 0) * TILE)); if (x < cx0 - 10 || x > cx1 + 10) continue;
      const len = 40 + Math.floor(hash(i * 11) * 80), y0 = wr - 162;
      for (let y = 0; y < len; y += 2) { const sw = Math.round(Math.sin(tick * 0.02 + i + y * 0.02) * (y / len) * 3); ctx.fillStyle = '#3f6b2c'; ctx.fillRect(x + sw, y0 + y, 1, 2); if (y % 12 === 6) { ctx.fillStyle = '#5f9f4a'; ctx.fillRect(x + sw + 1, y0 + y, 2, 1); } }
    }
  }

  // EL CAÑÓN DEL VALLE: farallón de roca al fondo y una gran catarata que cae
  // detrás del puente colgante hasta el río
  function renderCanyon(lv) {
    const C = lv.canyon; if (!C) return;
    const x0 = (C.x0 - 6) * TILE, x1 = (C.x1 + 6) * TILE;
    if (x1 < Game.cam.x || x0 > Game.cam.x + BASE_W) return;
    const rock = getBackTile(), rim = C.rimRow;
    for (let c = C.x0 - 6; c < C.x1 + 6; c++) {
      const d = Math.min(c - (C.x0 - 6), C.x1 + 6 - c);
      const topRow = C.fall.top - 2 + Math.max(0, 6 - d) * 2 + Math.round(hash(c * 7) * 2);
      for (let r = topRow; r < rim + 6; r++) {
        if (isSolidCode(lv.tile(c, r))) continue;
        const px = c * TILE, py = r * TILE;
        ctx.drawImage(rock, px, py);
        // estratos, grietas y matas de ichu en la pared
        const band = Math.floor((r + Math.floor(hash(c >> 1) * 2)) / 2) % 3;
        if (band !== 1) { ctx.fillStyle = band ? 'rgba(255,230,200,0.08)' : 'rgba(20,10,30,0.14)'; ctx.fillRect(px, py, TILE, TILE); }
        const h = hash(c * 131 + r * 17);
        if (h > 0.9) { ctx.fillStyle = 'rgba(25,15,30,0.55)'; ctx.fillRect(px + 5, py + 2, 1, 6); ctx.fillRect(px + 6, py + 7, 1, 5); }
        else if (h > 0.82 && r < rim) { ctx.globalAlpha = 0.8; ctx.drawImage(T.ichu, px, py + 6); ctx.globalAlpha = 1; }
        if (r >= rim) { ctx.fillStyle = 'rgba(10,10,30,0.35)'; ctx.fillRect(px, py, TILE, TILE); } // fondo del cañón en sombra
      }
      ctx.fillStyle = '#5f7e4c'; ctx.fillRect(c * TILE, topRow * TILE, TILE, 3);                         // pasto en lo alto del farallón
    }
    const river = (lv.liquids.find(l => l.kind === 'water' && l.x === C.x0) || { y: rim + 5 }).y * TILE + 4;
    renderCurtain(C.fall.x * TILE + 8, C.fall.top * TILE, river, LIQ.water, 14, 46);
  }
  // cortina de una catarata: estrecha arriba, ancha abajo, con espuma y bruma
  function renderCurtain(x, top, s, Pl, w0, w1) {
    if (s < Game.cam.y || top > Game.cam.y + BASE_H) return;
    const H = s - top;
    for (let y = Math.max(top, Math.floor(Game.cam.y)); y < Math.min(s, Game.cam.y + BASE_H); y++) {
      const k = (y - top) / H, w = Math.round(w0 + k * k * (w1 - w0) + Math.sin(y * 0.2 + tick * 0.3) * 2), a = Math.round(x - w / 2);
      ctx.fillStyle = Pl.bands[1]; ctx.fillRect(a, y, w, 1);
      ctx.fillStyle = Pl.bands[0]; ctx.fillRect(a, y, 2, 1); ctx.fillRect(a + w - 2, y, 2, 1);
    }
    for (let i = 0; i < 80; i++) {
      const xx = hash(i * 13) - 0.5, yy = top + mod(hash(i * 7) * H + tick * (3 + hash(i * 3) * 2.5), H);
      const k = (yy - top) / H, w = w0 + k * k * (w1 - w0);
      ctx.fillStyle = i % 3 === 0 ? Pl.foam : i % 3 === 1 ? Pl.hi : Pl.streak[0];
      ctx.fillRect(Math.round(x + xx * (w - 4)), Math.floor(yy), 1, Math.min(6, s - Math.floor(yy)));
    }
    for (let j = 0; j < 40; j++) {
      const r = hash(j * 17 + Math.floor(tick / 2)); if (r < 0.25) continue;
      ctx.fillStyle = r > 0.7 ? Pl.foam : Pl.hi;
      ctx.fillRect(Math.round(x - w1 / 2 - 6 + hash(j * 3 + Math.floor(tick / 2)) * (w1 + 12)), Math.round(s - 2 - r * 10 * hash(j + Math.floor(tick / 2))), r > 0.9 ? 2 : 1, r > 0.9 ? 2 : 1);
    }
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 14; i++) { const life = mod(tick * 0.6 + i * 7, 30); ctx.fillRect(Math.round(x - w1 / 2 + hash(i * 41 + Math.floor((tick * 0.6 + i * 7) / 30)) * w1), Math.round(s - 4 - life), 3, 2); }
    ctx.globalAlpha = 1;
  }

  function renderLiquids(lv) {
    const t = tick, vx0 = Game.cam.x - 4, vx1 = Game.cam.x + BASE_W + 4, vy1 = Game.cam.y + BASE_H + 4;
    for (const L of lv.liquids) {
      const Pl = L.pal || LIQ[L.kind], flow = L.flow;   // un capítulo puede pintar su agua (L.pal)
      const X0 = L.x * TILE, X1 = (L.x + L.w) * TILE, top = L.y * TILE, bot = (L.y + L.h) * TILE, W = X1 - X0;
      if (X1 < vx0 || X0 > vx1 || top > vy1) continue;
      const wl = top + 4;
      const cx0 = Math.max(X0, Math.floor(vx0)), cx1 = Math.min(X1, Math.ceil(vx1));
      const yBot = Math.min(bot, vy1);

      // 1) bandas de profundidad con tramado
      let y = wl + 2;
      for (let b = 0; b < Pl.bands.length && y < yBot; b++) {
        const h = Math.min(BAND_H[b], yBot - y);
        ctx.fillStyle = Pl.bands[b]; ctx.fillRect(cx0, y, cx1 - cx0, h);
        if (b > 0) { ctx.fillStyle = Pl.bands[b - 1]; for (let x = cx0 + ((cx0 + b) & 1); x < cx1; x += 2) ctx.fillRect(x, y, 1, 1); }
        y += h;
      }
      // 2) superficie ondulada que avanza con la corriente
      for (let x = cx0; x < cx1; x++) {
        const o = surf(x, t, flow, Pl.amp), sy = wl + o;
        ctx.fillStyle = Pl.bands[0]; ctx.fillRect(x, sy, 1, wl + 3 - sy);
        ctx.fillStyle = o <= -2 * Pl.amp + 0.5 && hash(x * 3 + Math.floor(t / 6)) > 0.35 ? Pl.foam : Pl.hi;
        ctx.fillRect(x, sy, 1, 1);
      }
      if (L.fallTop) { renderFall(lv, L, Pl, X0, X1, wl, cx0, cx1, t); continue; }
      if (L.kind === 'swamp') { renderSwamp(lv, L, Pl, X0, X1, wl, cx0, cx1, yBot, t); continue; }
      if (L.kind === 'mud' && !lv.liquids.some(N => N !== L && N.x + N.w === L.x) && !isSolidCode(lv.tile(L.x - 1, L.y))) renderPrecipice(L, Pl, X0, wl, t);
      // 3) vetas de corriente bajo la superficie (más rápidas arriba que al fondo)
      const depth = Math.max(8, Math.min(bot, wl + 44) - wl);
      const nS = Math.floor(W * depth / (L.kind === 'mud' ? 90 : 150));
      for (let i = 0; i < nS; i++) {
        const r1 = hash(i * 31 + L.x * 17), r2 = hash(i * 57 + 11 + L.x), r3 = hash(i * 91 + 23);
        const dy = 3 + Math.floor(r2 * r2 * (depth - 4));
        let acc = 2, band = 0; while (band < 4 && dy > acc + BAND_H[band]) { acc += BAND_H[band]; band++; }
        const sp = Pl.speed * flow * (1.25 - dy / depth * 0.75);
        const len = 3 + Math.floor(r3 * 11 * (1 - dy / depth * 0.5));
        const sx = X0 + mod(r1 * (W + len) + t * sp, W + len) - len;
        const a = Math.max(sx, X0, cx0), b2 = Math.min(sx + len, X1, cx1);
        if (b2 <= a || wl + dy >= yBot) continue;
        ctx.fillStyle = Pl.streak[band]; ctx.fillRect(Math.floor(a), wl + dy, Math.ceil(b2 - a), 1);
        if (r3 > 0.55) { ctx.fillStyle = band < 2 ? Pl.foam : Pl.streak[Math.max(0, band - 2)]; const hx = flow > 0 ? Math.floor(b2) - 1 : Math.floor(a); ctx.fillRect(hx, wl + dy, 1, 1); }
      }
      // 4) espuma y restos flotando en la superficie
      const nF = Math.floor(W / 9);
      for (let i = 0; i < nF; i++) {
        const r1 = hash(i * 7 + L.x * 131), r2 = hash(i * 13 + 5 + L.x);
        const fx = X0 + mod(r1 * W + t * Pl.speed * flow * (0.85 + r2 * 0.4), W);
        if (fx < cx0 - 6 || fx > cx1) continue;
        const ix = Math.floor(fx), fy = wl + surf(ix, t, flow, Pl.amp) + 1;
        if (Pl.chunks && r2 > 0.6) { ctx.fillStyle = Pl.chunks[i % Pl.chunks.length]; ctx.fillRect(ix, fy - 1, r2 > 0.85 ? 3 : 2, 2); continue; }
        const len = Math.min(2 + Math.floor(r2 * 4), X1 - ix);
        ctx.fillStyle = Pl.foam; ctx.fillRect(ix, fy, len, 1);
        if (r2 > 0.7) { ctx.fillStyle = Pl.hi; ctx.fillRect(ix + 1, fy + 1, Math.max(1, len - 2), 1); }
      }
      // 5) destellos de sol (solo agua)
      if (L.kind === 'water') for (let i = 0; i < W / 20; i++) {
        const ph = Math.floor(t / 5) + i * 3;
        if (hash(ph * 7 + i + L.x) > 0.8) {
          const gx = X0 + Math.floor(hash(ph * 3 + i * 17) * W), gy = wl + surf(gx, t, flow) + 2 + Math.floor(hash(ph + i) * 6);
          ctx.fillStyle = '#ffffff'; ctx.fillRect(gx, gy, 1, 1);
          if (hash(ph + i * 5) > 0.6) { ctx.fillRect(gx - 1, gy, 3, 1); }
        }
      } else for (let i = 0; i < W / 40; i++) { // burbujas de lodo que revientan
        const ph = Math.floor(t / 8) + i * 5;
        if (hash(ph * 11 + i) > 0.85) { const gx = X0 + Math.floor(hash(ph * 5 + i * 3) * W), gy = wl + surf(gx, t, flow, Pl.amp); ctx.fillStyle = Pl.hi; ctx.fillRect(gx - 1, gy - 1, 3, 1); ctx.fillRect(gx - 2, gy, 1, 1); ctx.fillRect(gx + 2, gy, 1, 1); }
      }
      // 6) remolinos contra las orillas
      for (const [ex, dir] of [[X0, 1], [X1 - 1, -1]]) {
        if (!isSolidCode(lv.tile(Math.floor((ex - dir * 2) / TILE), L.y))) continue;
        for (let j = 0; j < 7; j++) {
          const r = hash(j * 11 + Math.floor(t / 4) * 5 + ex);
          if (r < 0.4) continue;
          ctx.fillStyle = r > 0.75 ? Pl.foam : Pl.hi;
          ctx.fillRect(ex + dir * Math.floor(hash(j * 3 + ex + Math.floor(t / 4)) * 7), wl - 1 + Math.floor(hash(j * 5 + Math.floor(t / 4)) * 4), r > 0.9 ? 2 : 1, 1);
        }
      }
      // 7) cascada donde el lodo baja de un escalón al siguiente
      for (const N of lv.liquids) {
        if (N === L || N.kind !== L.kind || N.y <= L.y) continue;
        const adjLeft = N.x + N.w === L.x, adjRight = L.x + L.w === N.x;
        if (!adjLeft && !adjRight) continue;
        const ex = adjLeft ? X0 : X1, wlN = N.y * TILE + 4, H = wlN - wl;
        for (let c = -3; c < 3; c++) {
          ctx.fillStyle = Pl.bands[Math.abs(c) > 1 ? 1 : 0]; ctx.fillRect(ex + c, wl, 1, H + 2);
          for (let k = 0; k < 2; k++) { const yy = wl + mod(hash(c * 7 + k * 13) * H + t * (2.2 + k * 0.6), H); ctx.fillStyle = k ? Pl.foam : Pl.hi; ctx.fillRect(ex + c, Math.floor(yy), 1, 3); }
        }
        for (let j = 0; j < 10; j++) { const r = hash(j * 17 + Math.floor(t / 3)); if (r < 0.35) continue; ctx.fillStyle = r > 0.7 ? Pl.foam : Pl.hi; ctx.fillRect(ex - 8 + Math.floor(hash(j * 3 + Math.floor(t / 3)) * 16), wlN - 2 + Math.floor(r * 4), 1 + (r > 0.9), 1); }
      }
    }
  }

  // Caída de agua: el arroyo baja del cerro por una pared de roca y se
  // estrella en la quebrada. Por eso el cauce es tan estrecho.
  function renderFall(lv, L, Pl, X0, X1, wl, cx0, cx1, t) {
    const ft = L.fallTop * TILE, W = X1 - X0, H = wl - ft;
    const cw = Math.round(Math.min(W - 6, 10 + W * 0.25)), a = Math.round(X0 + (W - cw) / 2), b = a + cw;
    // pared de roca detrás (no pinta sobre el terreno sólido)
    const rock = getBackTile();
    for (let r = L.fallTop; r < L.y; r++) for (let c = L.x; c < L.x + L.w; c++) {
      if (r === L.fallTop && L.w > 3 && (c === L.x || c === L.x + L.w - 1)) continue;
      if (isSolidCode(lv.tile(c, r))) continue;
      ctx.drawImage(rock, c * TILE, r * TILE);
    }
    // ichu en lo alto del peñasco
    ctx.drawImage(T.ichu, a - 12, ft - T.ichu.height + 1);
    // chorro de agua
    ctx.fillStyle = Pl.bands[1]; ctx.fillRect(a, ft + 2, b - a, H);
    ctx.fillStyle = Pl.bands[0]; ctx.fillRect(a, ft + 2, 1, H); ctx.fillRect(b - 1, ft + 2, 1, H);
    ctx.fillStyle = Pl.bands[2]; ctx.fillRect(a + 1, ft + 2, 1, H); ctx.fillRect(b - 2, ft + 2, 1, H);
    for (let x = a + 1; x < b - 1; x++) for (let k = 0; k < 3; k++) {
      const sp = 3 + hash(x * 7 + k) * 2, len = 4 + Math.floor(hash(x * 3 + k * 11) * 6);
      const yy = ft + 2 + mod(hash(x * 13 + k * 31) * H + t * sp, H);
      ctx.fillStyle = k === 0 ? Pl.foam : k === 1 ? Pl.hi : Pl.streak[1];
      ctx.fillRect(x, Math.floor(yy), 1, Math.min(len, wl - Math.floor(yy)));
    }
    // borde por donde rebosa el agua
    for (let x = a - 1; x < b + 1; x++) { ctx.fillStyle = hash(x + Math.floor(t / 4)) > 0.5 ? Pl.foam : Pl.hi; ctx.fillRect(x, ft + 1 + (hash(x * 5) > 0.7 ? 1 : 0), 1, 2); }
    // la poza hierve de espuma
    for (let x = cx0; x < cx1; x++) {
      const r = hash(x * 3 + Math.floor(t / 3));
      if (r > 0.35) { ctx.fillStyle = r > 0.7 ? Pl.foam : Pl.hi; ctx.fillRect(x, wl - 1 + Math.floor(hash(x + Math.floor(t / 3) * 7) * 4), 1, r > 0.9 ? 2 : 1); }
    }
    for (let i = 0; i < 18; i++) {
      const r = hash(i * 19 + Math.floor(t / 2));
      ctx.fillStyle = r > 0.5 ? Pl.foam : Pl.hi;
      ctx.fillRect(X0 + Math.floor(hash(i * 7 + Math.floor(t / 2)) * W), wl + 2 + Math.floor(r * 10), 2, 1);
    }
    // bruma que sube
    ctx.globalAlpha = 0.45; ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const life = mod(t * 0.5 + i * 9, 24);
      ctx.fillRect(X0 - 4 + Math.floor(hash(i * 41 + Math.floor((t * 0.5 + i * 9) / 24)) * (W + 8)), Math.floor(wl - life), 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  const DECOR_MAP = { fern: () => T.fern, bamboo: () => T.bamboo, cantuta: () => T.cantuta, ichu: () => T.ichu, maguey: () => T.maguey, sign: () => T.sign };
  function renderDecor(lv) {
    for (const d of lv.decor || []) {
      const img = (DECOR_MAP[d[0]] || (() => null))(); if (!img) continue;
      const x = d[1] * TILE; if (x > Game.cam.x + BASE_W || x + 32 < Game.cam.x) continue;
      // el ichu se mece con el viento
      const sway = d[0] === 'ichu' && Math.floor((tick + d[1] * 13) / 40) % 2 ? 1 : 0;
      ctx.drawImage(img, x + sway, d[2] * TILE + (TILE - img.height));
    }
  }

  function renderEntities() {
    const back = e => e instanceof School || e instanceof House;
    for (const e of Game.entities) if (back(e)) e.draw(ctx, Game);
    for (const e of Game.entities) if (!back(e) && !(e instanceof Mount)) e.draw(ctx, Game);
    for (const e of Game.entities) if (e instanceof Mount) e.draw(ctx, Game);
  }

  function renderParticles() {
    for (const p of Game.particles) {
      ctx.globalAlpha = clamp(p.life / p.max * 1.5, 0, 1);
      ctx.fillStyle = p.col; ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ¡bajo ataque!: líneas de velocidad estilo manga que convergen hacia el
  // niño. Pocas y titilantes mientras el águila (o el puma) se prepara; densas en el picado.
  function renderAttackAlert() {
    let n = 0;
    for (const e of Game.entities) if (e instanceof Eagle) {
      if (e.state === 'dive') n = Math.max(n, 46);
      else if (e.state === 'windup') n = Math.max(n, 18);
    } else if (e instanceof Puma) {
      if (e.state === 'leap') n = Math.max(n, 46);
      else if (e.state === 'windup') n = Math.max(n, 18);
    }
    if (!n) return;
    const p = Game.player, fx = p.cx - Game.cam.x, fy = p.cy - Game.cam.y;
    const seed = Math.floor(tick / 2);   // se redibujan cada 2 frames: efecto "vibrante"
    const R = Math.hypot(BASE_W, BASE_H) * 0.75;
    for (let i = 0; i < n; i++) {
      const ang = hash(seed * 97 + i * 13) * Math.PI * 2;
      const inner = 64 + hash(seed * 31 + i * 7) * 60;           // dejan libre el centro
      const reach = 0.45 + hash(i * 11 + seed) * 0.45;          // largo de cada trazo
      const thick = hash(i * 5 + seed) > 0.6 ? 3 : 2;
      const cx = Math.cos(ang), cy = Math.sin(ang);
      const steps = Math.floor((R - inner) * reach);
      for (let k = 0; k < steps; k++) {
        const d = R - k, x = Math.round(fx + cx * d), y = Math.round(fy + cy * d);
        const w = k < steps * 0.35 ? thick : k < steps * 0.7 ? 2 : 1;   // afina hacia el niño
        ctx.fillStyle = 'rgba(40,30,60,0.35)'; ctx.fillRect(x + 1, y + 1, w, w);   // sombra para que se vea sobre la nieve
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x, y, w, w);
      }
    }
  }

  function panel(x, y, w, h) { ctx.fillStyle = 'rgba(28,18,30,0.55)'; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2); }
  let hintBottom = 0;   // el aviso breve se acomoda debajo del cartel de ayuda para no encimarse
  // instrucciones de las entidades: con el mismo estilo que las ayudas del suelo
  // (recuadro oscuro con borde dorado) y flotando sobre el niño, no arriba al centro
  function hintBox(lines) {
    const p = Game.player, w = Math.max(...lines.map(l => textWidth(l))) + 8, h = lines.length * 9 + 4;
    const x = Math.round(Math.max(4, Math.min(BASE_W - w - 4, p.cx - Game.cam.x - w / 2)));
    const y = Math.round(Math.max(26, p.y - Game.cam.y - 40 - h));
    ctx.fillStyle = 'rgba(28,18,30,0.86)'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#ffd166'; ctx.fillRect(x, y - 1, w, 1); ctx.fillRect(x, y + h, w, 1); ctx.fillRect(x - 1, y, 1, h); ctx.fillRect(x + w, y, 1, h);
    lines.forEach((l, i) => drawText(ctx, l, x + 4, y + 3 + i * 9, { color: i ? '#fff3d6' : '#ffffff' }));
  }
  function renderHUD() {
    panel(6, 6, 46, 16);
    ctx.drawImage(OBJ.page, 10, 8);
    drawText(ctx, Game.pages + '/3', 24, 11, { color: '#ffffff' });
    const late = clockMinutes() >= CLASS_START;
    panel(BASE_W - 52, 6, 46, 16);
    drawText(ctx, clockText(), BASE_W - 29, 11, { color: late ? '#f2917d' : '#fff3d6', align: 'center' });
    const Z = Game.level.zones[Game.zone], A = Game.level.altitude;
    if (Z && Z.alt && A) {
      // altímetro: en la montaña, en vez del nombre del tramo (en rojo con soroche)
      const m = Math.max(A.baseM, Math.round(altitudeM() / 10) * 10);
      const txt = String(m).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' M';
      drawText(ctx, txt, BASE_W - 58, 11, { color: Game.soroche ? '#f2917d' : '#d9f1ff', align: 'right', shadow: true, shadowColor: '#00000088' });
    } else if (Game.zoneName) drawText(ctx, Game.zoneName, BASE_W - 58, 11, { color: '#fff3d6', align: 'right', shadow: true, shadowColor: '#00000088' });
    renderSorocheBar();

    // en la cumbre: explicar el parapente
    hintBottom = 0;
    const lf = Game.entities.find(e => e instanceof Leaf), pl = Game.player;
    if (lf && !lf.taken && Math.abs(pl.cx - lf.cx) < 90 && Math.abs(pl.cy - lf.cy) < 60 && !pl.riding) hintBox(['TOMA LA HOJA DE PLÁTANO']);
    else if (pl.gliding && pl.onGround && pl.y < 100 * TILE) hintBox(['¡SALTA AL VACÍO PARA PLANEAR!']);
    else for (const e of Game.entities) { const h = e.hint && e.hint(Game); if (h) { hintBox(h); break; } }   // ayudas de otros capítulos
    // aviso breve (p. ej. al tocar un punto de control)
    if (Game.toastMsg) {
      const tm = Game.toastMsg, w = textWidth(tm.text) + 14;
      // se ve entero todo el rato que dura (más si es más largo) y se desvanece al final
      ctx.globalAlpha = Math.max(0, Math.min(1, tm.t / 8, (150 + tm.text.length * 4 - tm.t) / 20));
      const ty = hintBottom || 26;
      panel(6, ty, w, 13); drawText(ctx, tm.text, 13, ty + 3, { color: '#9be7c4' });
      ctx.globalAlpha = 1;
    }
    // título al empezar
    if (Game.banner < 170) {
      const a = Math.min(1, (170 - Game.banner) / 40);
      ctx.globalAlpha = a;
      const bn = Game.chapter.banner;
      drawText(ctx, bn[0], BASE_W / 2, 64, { scale: BASE_W < 300 ? 1 : 2, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
      drawText(ctx, bn[1], BASE_W / 2, 86, { color: '#ffffff', align: 'center', shadow: true, shadowColor: '#00000099' });
      ctx.globalAlpha = 1;
    }
  }

  // ── overlays ─────────────────────────────────────────────────────────────
  function renderOverlay() {
    if (Game.fade > 0.001) { ctx.fillStyle = 'rgba(11,10,18,' + Game.fade + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H); }
    if (Game.state === 'pause') renderPause();
    if (Game.state === 'win') renderWin();
    if (Game.state === 'respawn') {
      const a = Math.min(1, Game.stateT / 16);
      ctx.fillStyle = 'rgba(11,10,18,' + (a * 0.85) + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H);
      const ch = Game.chapter, msg = ch.deathMsgs && (ch.deathMsgs[Game.lastDeath] || ch.deathMsgs.default);
      drawText(ctx, ch.deathTitle || '¡ACHACHÁU!', BASE_W / 2, BASE_H / 2 - 14, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
      // la causa, con jerga (solo en los capítulos que la traen)
      if (msg) drawText(ctx, msg, BASE_W / 2, BASE_H / 2 + 8, { color: '#f2917d', align: 'center', shadow: true });
      // muchas caídas en el mismo tramo: una pista (guide.js)
      const help = GUIDE.deathLine();
      if (help) drawText(ctx, help, BASE_W / 2, BASE_H / 2 - 40, { color: '#9be7c4', align: 'center', shadow: true });
      if (Game.stateT > 30) drawText(ctx, 'PULSA ESPACIO PARA SEGUIR', BASE_W / 2, BASE_H / 2 + (msg ? 26 : 14), { color: '#fff3d6', align: 'center' });
    }
  }

  function renderPause() {
    ctx.fillStyle = 'rgba(11,10,18,0.72)'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    drawText(ctx, 'PAUSA', BASE_W / 2, 60, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
    PAUSE_OPTS.forEach((o, i) => {
      const sel = i === Game.pauseSel, y = 104 + i * 20;
      if (sel) drawText(ctx, '>', BASE_W / 2 - 54, y, { color: '#9be7c4' });
      drawText(ctx, o, BASE_W / 2, y, { color: sel ? '#fff3d6' : '#b9b3d6', align: 'center' });
    });
  }

  function renderWin() {
    const a = Math.min(1, Game.stateT / 40);
    ctx.fillStyle = 'rgba(18,14,28,' + (0.82 * a) + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.globalAlpha = a;
    const bob = Math.sin(tick / 12) * 2;
    const narrow = BASE_W < 300;   // celular en vertical: textos más cortos
    winLayout();
    // cada capítulo puede traer sus propios textos, personajes y filas (win)
    const W = Game.chapter.win || {};
    drawText(ctx, W.title || '¡LLEGASTE A CLASES!', BASE_W / 2, 30 + bob, { scale: narrow ? 1 : 2, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
    const onTime = Game.arrival < CLASS_START;
    const sub = onTime ? (W.onTime || ['ANTES DE LAS 8:00', 'AL AIRE LIBRE, ANTES DE LAS 8:00']) : (W.late || ['LLEGASTE TARDE...', 'LA CLASE YA HABÍA EMPEZADO...']);
    drawText(ctx, narrow ? sub[0] : sub[1], BASE_W / 2, 54, { color: onTime ? '#f4e9d8' : '#f2917d', align: 'center' });
    if (W.drawCast) W.drawCast(ctx, BASE_W / 2, tick);
    else {
      ctx.drawImage(LL.idle[0], BASE_W / 2 - 64, 74);
      ctx.drawImage(P.run[Math.floor(tick / 7) % 4], BASE_W / 2 - 8, 76);
      ctx.drawImage(GOAT.stand, BASE_W / 2 + 34, 81);
    }
    const arrival = ['LLEGADA', clockText(Game.arrival) + (onTime ? ' ¡A TIEMPO!' : ' TARDE'), onTime ? '#9be7c4' : '#f2917d'];
    const rows = W.rows ? W.rows(Game, narrow, arrival) : [
      [narrow ? 'HOJAS' : 'HOJAS DE TAREA', Game.pages + ' / 3', '#ffffff'],
      arrival,
      ['CAÍDAS', '' + Game.deaths, '#f2917d'],
    ];
    rows.forEach((r, i) => {
      const half = Math.min(110, BASE_W / 2 - 8);
      drawText(ctx, r[0], BASE_W / 2 - half, WY.rows + i * 13, { color: '#cdbde8' });
      drawText(ctx, r[1], BASE_W / 2 + half, WY.rows + i * 13, { color: r[2], align: 'right' });
    });
    const done = W.allPages || ['¡TAREA COMPLETA!', '¡TAREA COMPLETA! LA PROFE ESTARÁ ORGULLOSA'];
    if (Game.pages === 3) drawText(ctx, narrow ? done[0] : done[1], BASE_W / 2, WY.done, { color: '#9be7c4', align: 'center' });
    renderWinOptions(narrow);
    ctx.globalAlpha = 1;
  }
  // al pie: ir al siguiente capítulo (si ya existe) o volver al menú
  // posiciones del pie de la pantalla final; en pantallas bajitas (celular
  // horizontal) todo sube un poco para que las opciones entren
  const WY = { rows: 112, done: 170, info: 182, foot: 194 };
  function winLayout() { Object.assign(WY, BASE_H < 208 ? { rows: 104, done: 157, info: 169, foot: 181 } : { rows: 112, done: 170, info: 182, foot: 194 }); }
  function renderWinOptions(narrow) {
    if (Game.stateT <= 90) return;
    const opts = winOptions();
    if (opts.length === 1) {
      if (Game.chapterIdx + 1 < CHAPTER_SLOTS) drawText(ctx, 'CAPÍTULO ' + (Game.chapterIdx + 2) + ': ¡PRÓXIMAMENTE!', BASE_W / 2, WY.info, { color: '#cdbde8', align: 'center' });
      if (Math.floor(tick / 24) % 2 === 0) drawText(ctx, narrow ? 'PULSA A PARA SEGUIR' : 'PULSA ESPACIO PARA VOLVER AL MENÚ', BASE_W / 2, WY.foot, { color: '#fff3d6', align: 'center' });
      return;
    }
    if (!opts.includes('next') && !Game.shareMsg && Game.chapterIdx + 1 < CHAPTER_SLOTS) drawText(ctx, 'CAPÍTULO ' + (Game.chapterIdx + 2) + ': ¡PRÓXIMAMENTE!', BASE_W / 2, WY.info, { color: '#cdbde8', align: 'center' });
    if (Game.shareMsg) drawText(ctx, Game.shareMsg.text, BASE_W / 2, WY.info, { color: '#9be7c4', align: 'center', shadow: true, shadowColor: '#000000' });
    const LONG = { next: 'SIGUIENTE CAPÍTULO', ending: 'SEGUIR', ranking: 'RANKING', share: 'COMPARTIR', menu: 'MENÚ' }, SHORT = { next: 'SIGUIENTE', ending: 'SEGUIR', ranking: 'RANKING', share: 'COMPARTIR', menu: 'MENÚ' };
    let gap = 26, labels = opts.map(o => (narrow ? SHORT : LONG)[o]);
    const fits = () => labels.reduce((a, l) => a + textWidth(l), 0) + gap * (labels.length - 1) <= BASE_W - 24;
    if (!fits()) { labels = opts.map(o => SHORT[o]); gap = 16; }
    if (!fits()) gap = 12;
    const ws = labels.map(l => textWidth(l)), total = ws.reduce((a, w) => a + w, 0) + gap * (labels.length - 1);
    let x = BASE_W / 2 - total / 2;
    labels.forEach((l, i) => {
      const sel = i === Game.winSel;
      drawText(ctx, l, x, WY.foot, { color: sel ? '#ffffff' : '#b9b3d6' });
      if (sel && Math.floor(tick / 16) % 2 === 0) { drawText(ctx, '>', x - Math.min(10, gap / 2 + 3), WY.foot, { color: '#ffd166' }); drawText(ctx, '<', x + ws[i] + Math.min(4, gap / 2 - 5), WY.foot, { color: '#ffd166' }); }
      x += ws[i] + gap;
    });
  }

  // ── menú principal: amanecer en los Andes, el niño va con su llama ────────
  let menuStrips = null;
  function renderMenu() {
    const gr = ctx.createLinearGradient(0, 0, 0, BASE_H);
    gr.addColorStop(0, '#2c2350'); gr.addColorStop(0.45, '#8a4f7a'); gr.addColorStop(0.75, '#e88a5a'); gr.addColorStop(1, '#f7c47a');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.arc(292, 132, 30, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,233,168,0.25)'; ctx.beginPath(); ctx.arc(292, 132, 42, 0, Math.PI * 2); ctx.fill();
    if (!menuStrips) menuStrips = [
      buildStrip({ kind: 'mountains', color: '#5a3f78', color2: '#432e5e', amp: 9, seed: 5, snow: true }),
      buildStrip({ kind: 'mountains', color: '#3d2b55', color2: '#2c1f40', amp: 5, seed: 13 }),
      buildStrip({ kind: 'hills', color: '#2a2a3a', color2: '#1d1d2a', amp: 2, seed: 3 }),
    ];
    const ys = [10, 50, 82], sp = [0.1, 0.25, 0.6];
    menuStrips.forEach((s, i) => { const off = -mod(tick * sp[i], s.width); for (let x = off; x < BASE_W; x += s.width) ctx.drawImage(s, Math.round(x), ys[i]); });
    drawSkyCondors(-10);
    // el niño camina junto a su llama en silueta sobre el cerro
    const fr = Math.floor(tick / 8) % 4;
    const sil = (img) => { const k = '_s'; if (!img[k]) img[k] = PIX.tinted(img, '#1d1d2a'); return img[k]; };
    ctx.drawImage(sil(LL.run[fr]), 70, 177);
    ctx.drawImage(sil(P.run[fr]), 100, 179);

    const bob = Math.sin(tick / 22) * 2;
    const ts = BASE_W < 260 ? 2 : 3;   // en pantallas angostas (celular vertical) el título es más chico
    drawText(ctx, 'LA MARATÓN', BASE_W / 2, 34 + bob, { scale: ts, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
    drawText(ctx, 'DE LOS ANDES', BASE_W / 2, (ts === 3 ? 60 : 54) + bob, { scale: ts, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
    // el objetivo del capítulo elegido
    const chSel = CHAPTERS[Game.menuChapter];
    const goal = chSel ? (BASE_W < 260 ? chSel.goalShort : chSel.goal) : '¡MUY PRONTO!';
    drawText(ctx, goal, BASE_W / 2, (ts === 3 ? 90 : 78) + bob, { color: '#fff3d6', align: 'center', shadow: true, shadowColor: '#00000088' });
    // en vertical se juega mejor girando el teléfono
    if (BASE_H > BASE_W) drawText(ctx, '¡GIRA EL TELÉFONO!', BASE_W / 2, MENU_Y + (MENU_KEYS().length - 1) * MENU_DY + 10, { color: '#ffd166', align: 'center', shadow: true, shadowColor: '#000000' });
    renderChapterCards(ts === 3 ? CARDS_Y : CARDS_Y - 10);
    MENU_OPTS().forEach((o, i) => {
      if (i === 0) return;   // "JUGAR" es el selector de capítulos
      const sel = i === Game.menuSel, y = MENU_Y + (i - 1) * MENU_DY;
      drawText(ctx, o, BASE_W / 2, y, { color: sel ? '#ffffff' : '#e7d3c4', align: 'center', shadow: true, shadowColor: '#00000099' });
      if (sel) { const w = textWidth(o); drawText(ctx, '>', BASE_W / 2 - w / 2 - 12, y, { color: '#ffd166' }); drawText(ctx, '<', BASE_W / 2 + w / 2 + 6, y, { color: '#ffd166' }); }
    });
  }
  // SELECTOR DE CAPÍTULO: una tarjeta por capítulo (los que faltan, con candado).
  // En pantallas angostas se ve solo la elegida, con flechas a los lados.
  function renderChapterCards(y) {
    const active = Game.menuSel === 0, narrow = BASE_W < 320;
    const cw = narrow ? Math.min(130, BASE_W - 44) : 100, chh = 30, gap = 8;
    const idx = narrow ? [Game.menuChapter] : [...Array(CHAPTER_SLOTS).keys()];
    let x = Math.round(BASE_W / 2 - (idx.length * cw + (idx.length - 1) * gap) / 2);
    for (const i of idx) {
      const ch = CHAPTERS[i], sel = i === Game.menuChapter;
      const shake = sel && Game.lockedT > 0 ? Math.round(Math.sin(Game.lockedT * 1.6) * 2) : 0;
      const cy = y - (sel && active ? 2 : 0), cx = x + shake;
      // borde: dorado si está elegida, tenue si no
      ctx.fillStyle = sel ? (active && Math.floor(tick / 20) % 2 ? '#fff3d6' : '#ffd166') : 'rgba(255,240,210,0.25)';
      ctx.fillRect(cx - 1, cy - 1, cw + 2, chh + 2);
      ctx.fillStyle = ch ? 'rgba(28,18,30,0.86)' : 'rgba(20,16,28,0.9)'; ctx.fillRect(cx, cy, cw, chh);
      ctx.fillStyle = ch ? ch.color : '#4a4458'; ctx.fillRect(cx, cy, cw, 3);   // franja de color del capítulo
      drawText(ctx, 'CAPÍTULO ' + (i + 1), cx + cw / 2, cy + 7, { color: ch ? '#ffd166' : '#8a8296', align: 'center' });
      if (ch) drawText(ctx, ch.short, cx + cw / 2, cy + 18, { color: sel ? '#ffffff' : '#e7d3c4', align: 'center' });
      else {
        // candado + PRÓXIMAMENTE
        const lx = Math.round(cx + cw / 2 - textWidth('PRÓXIMAMENTE') / 2 - 9);
        ctx.fillStyle = '#8a8296'; ctx.fillRect(lx + 1, cy + 17, 5, 1); ctx.fillRect(lx, cy + 18, 1, 2); ctx.fillRect(lx + 6, cy + 18, 1, 2);
        ctx.fillStyle = '#b9b1c2'; ctx.fillRect(lx - 1, cy + 20, 9, 6); ctx.fillStyle = '#5d5768'; ctx.fillRect(lx + 3, cy + 22, 1, 2);
        drawText(ctx, 'PRÓXIMAMENTE', cx + cw / 2 + 5, cy + 19, { color: '#8a8296', align: 'center' });
      }
      x += cw + gap;
    }
    if (active) {
      // flechas: izquierda/derecha cambia de capítulo
      const L = narrow ? Math.round(BASE_W / 2 - cw / 2) : Math.round(BASE_W / 2 - (CHAPTER_SLOTS * cw + (CHAPTER_SLOTS - 1) * gap) / 2);
      const R = BASE_W - L, ay = y + 11 + (Math.floor(tick / 16) % 2);
      drawText(ctx, '<', L - 12, ay, { color: '#ffd166', shadow: true, shadowColor: '#00000099' });
      drawText(ctx, '>', R + 6, ay, { color: '#ffd166', shadow: true, shadowColor: '#00000099' });
    }
  }

  function renderControls() {
    ctx.fillStyle = 'rgba(11,10,18,0.84)'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    drawText(ctx, 'CONTROLES', BASE_W / 2, 20, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
    const rows = [['MOVER', 'FLECHAS / A D'], ['SALTAR', 'ESPACIO / Z / FLECHA ARRIBA'], ['BAJARSE DE LA LLAMA', 'FLECHA ABAJO'], ['PAUSA', 'ESC / P'], ['SILENCIO', 'M']];
    rows.forEach((r, i) => {
      drawText(ctx, r[0], 30, 50 + i * 15, { color: '#9be7c4' });
      drawText(ctx, r[1], BASE_W - 30, 50 + i * 15, { color: '#f4e9d8', align: 'right' });
    });
    const chSel = CHAPTERS[Game.menuChapter];
    const tips = (chSel && chSel.tips) || ['LLAMA: TÓCALA PARA MONTARLA. CORRE Y SALTA MÁS.', 'CABRA: SALTA SOLA. TÚ SOLO LA GUÍAS.', 'EL PASTO LE DA A LA CABRA UN SÚPER SALTO.', 'HUAICO: SI CAES, PULSA SALTO MUY SEGUIDO.'];
    tips.forEach((t, i) => drawText(ctx, t, BASE_W / 2, 132 + i * 12, { color: '#cdbde8', align: 'center' }));
    drawText(ctx, 'PULSA ESPACIO PARA VOLVER', BASE_W / 2, 196, { color: '#fff3d6', align: 'center' });
  }

  // ── fluidez ──────────────────────────────────────────────────────────────
  // La lógica corre a 60 pasos fijos por segundo, pero la pantalla puede ir a
  // 60, 120 o 144 Hz. Para que no haya tirones, dibujamos cada actor entre su
  // posición anterior y la actual según el tiempo transcurrido (interpolación).
  // Además la cámara se alinea al píxel del jugador: así el niño no "baila" un
  // píxel adelante y atrás respecto a la cámara (eso se veía borroso y mareaba).
  function actors() { return Game.player ? [Game.player, ...Game.entities] : []; }
  function snapshot() {
    for (const a of actors()) { a._px = a.x; a._py = a.y; }
    Game.cam._px = Game.cam.x; Game.cam._py = Game.cam.y;
  }
  function renderSmooth(alpha) {
    const live = Game.level && Game.state !== 'menu' && Game.state !== 'controls';
    if (!live) { render(); return; }
    alpha = clamp(alpha, 0, 1);
    const list = actors(), cam = Game.cam;
    for (const a of list) {
      a._sx = a.x; a._sy = a.y;
      if (a._px !== undefined && Math.abs(a.x - a._px) < 64 && Math.abs(a.y - a._py) < 64) {
        a.x = a._px + (a.x - a._px) * alpha; a.y = a._py + (a.y - a._py) * alpha;
      }
    }
    const cx = cam.x, cy = cam.y;
    if (cam._px !== undefined && Math.abs(cx - cam._px) < 64 && Math.abs(cy - cam._py) < 64) { cam.x = cam._px + (cx - cam._px) * alpha; cam.y = cam._py + (cy - cam._py) * alpha; }
    const p = Game.player;
    cam.x = p.x + Math.round(cam.x - p.x);
    cam.y = p.y + Math.round(cam.y - p.y);
    render();
    cam.x = cx; cam.y = cy;
    for (const a of list) { a.x = a._sx; a.y = a._sy; }
  }

  // ── bucle ────────────────────────────────────────────────────────────────
  let last = performance.now(), acc = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    let dt = ts - last; last = ts;
    if (dt > 100) dt = 100;
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 5) { snapshot(); update(); acc -= STEP; guard++; }
    if (guard >= 5) acc = 0;
    renderSmooth(acc / STEP);
  }

  // ── init ─────────────────────────────────────────────────────────────────
  function init() {
    Input.wireTouch();
    const boot = document.getElementById('boot');
    if (boot) { boot.classList.add('hidden'); setTimeout(() => boot.remove(), 600); }
    if ('ontouchstart' in window) { const t = document.getElementById('touch'); if (t) t.classList.add('on'); }
    // solo teclado (y los botones táctiles en móvil): el ratón no hace nada
    const firstGesture = () => { AUDIO.resume(); if (Game.state === 'menu') AUDIO.playMusic(SONGS.menu); window.removeEventListener('keydown', firstGesture); };
    window.addEventListener('keydown', firstGesture);
    debugFromURL();
    requestAnimationFrame(frame);
  }
  // modo de prueba solo por URL: ?cap=2 entra directo al capítulo 2 y
  // &x=NNN (&y=NN) te deja en esa columna (y fila), con punto de control ahí
  function debugFromURL() {
    const q = new URLSearchParams(location.search), cap = parseInt(q.get('cap'), 10);
    if (!(cap >= 1 && CHAPTERS[cap - 1])) return;
    startGame(cap - 1);
    if (q.has('x')) Game.debugTeleport(+q.get('x'), q.has('y') ? +q.get('y') : null);
  }
  Game.debugTeleport = (tx, ty) => {
    const lv = Game.level, p = Game.player;
    if (ty == null) { ty = 0; while (ty < lv.rows - 1 && !isSolidCode(lv.tile(tx, ty)) && !isOnewayCode(lv.tile(tx, ty))) ty++; }
    p.riding = null; p.x = tx * TILE + 4; p.y = ty * TILE - p.h; p.vx = 0; p.vy = 0;
    Game.spawn = { x: p.x, y: ty * TILE }; Game.spawnMount = null;
    Game.floorY = p.cy; updateCamera(true);
  };
  Game.debugStep = update;
  Game.debugRender = render;
  Game.startGame = startGame;
  Game.snapCamera = () => updateCamera(true);
  init();
})();
