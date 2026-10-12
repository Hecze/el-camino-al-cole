// game.js — motor: bucle fijo, cámara, parallax, agua/lodo, render por capas, HUD y estados.
(function () {
  'use strict';

  const BASE_W = 384, BASE_H = 216, STEP = 1000 / 60;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function fit() {
    const sw = window.innerWidth, sh = window.innerHeight;
    const scale = Math.max(1, Math.floor(Math.min(sw / BASE_W, sh / BASE_H)));
    canvas.style.width = BASE_W * scale + 'px';
    canvas.style.height = BASE_H * scale + 'px';
  }
  window.addEventListener('resize', fit); fit();

  // ── utilidades ───────────────────────────────────────────────────────────
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mod = (a, n) => ((a % n) + n) % n;
  function hash(n) { n = (n | 0) ^ 0x9e3779b9; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; }
  function aabb(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  let tick = 0;

  // ── parallax ─────────────────────────────────────────────────────────────
  const strips = {};
  function buildStrip(def) {
    const W = 768, H = BASE_H;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const s = def.seed || 1;
    function ridge(x) {
      let n = 0, amp = 1, norm = 0, fr = 1;
      for (let o = 0; o < 4; o++) { n += Math.sin((x / W) * Math.PI * 2 * fr + s * 1.7 * (o + 1) + o) * amp; norm += amp; amp *= 0.55; fr *= 2; }
      // picos andinos: crestas más afiladas
      const v = n / norm; return def.kind === 'mountains' ? Math.sign(v) * Math.pow(Math.abs(v), 0.8) : v;
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
  function drawClouds(layer, camx, dy, key) {
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
  const COL = { dust: '#c9a86a', spark: '#ffe27a', mud: '#7a5232', splash: '#bdf0f4', rock: '#8a8296', paper: '#ffffff' };

  // ── estado ───────────────────────────────────────────────────────────────
  const Game = {
    state: 'menu', level: null, player: null, entities: [], movers: [], particles: [],
    cam: { x: 0, y: 0 }, look: 0, floorY: 0, shakeT: 0, shakeMag: 0, fade: 1,
    choclos: 0, pages: 0, score: 0, totalChoclos: 0,
    menuSel: 0, pauseSel: 0, stateT: 0, T: 0,
    spawn: { x: 0, y: 0 }, spawnMount: null, zone: -1, zoneName: '',
    hint: null, banner: 0, deaths: 0, time: 0, pointer: null,
  };
  window.Game = Game;

  Game.audio = (name) => AUDIO.play(name);
  Game.addScore = (n) => { Game.score += n; };
  Game.shake = (mag, t) => { Game.shakeMag = Math.max(Game.shakeMag, mag); Game.shakeT = Math.max(Game.shakeT, t); };
  Game.near = (x, r) => Game.player && Math.abs(Game.player.cx - x) < r;
  Game.addEntity = (e) => Game.entities.push(e);
  Game.burst = (x, y, type, n) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = rnd(0.4, 2.2);
      const heavy = type === 'splash' || type === 'mud';
      Game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: (heavy ? -Math.abs(Math.sin(a)) * sp * 1.4 : Math.sin(a) * sp) - 0.6, life: rnd(16, 32), max: 32, col: COL[type] || '#fff', size: Math.random() < 0.3 ? 2 : 1, grav: heavy ? 0.2 : 0.05 });
    }
  };
  Game.showHint = (text) => { Game.hint = { text, t: 0 }; };
  Game.onPlayerJump = (a) => { Game.burst(a.cx, a.y + a.h, 'dust', 6); AUDIO.play('jump'); };
  Game.onPlayerLand = (a) => { Game.burst(a.cx, a.y + a.h, 'dust', 4); };
  Game.onMount = (m) => {
    if (m instanceof Llama) Game.showHint('SALTA CON ESPACIO. ¡LA LLAMA CORRE MÁS!');
    else Game.showHint('LA CABRA SALTA SOLA. GUÍALA CON IZQUIERDA Y DERECHA');
  };
  Game.onGoatDone = () => Game.showHint('¡CUMBRE! LA CABRA SE QUEDA A PASTAR');
  Game.setCheckpoint = (cp) => {
    Game.spawn = { x: cp.spawn.x, y: cp.spawn.y };
    Game.spawnMount = Game.player.riding instanceof Llama ? Game.player.riding : null;
  };
  Game.playerEnvDeath = (kind) => {
    if (Game.state !== 'play') return;
    const p = Game.player, a = p.riding || p;
    if (kind === 'water') { AUDIO.play('splash'); Game.burst(a.cx, a.y + a.h, 'splash', 18); }
    else if (kind === 'mud') AUDIO.play('drown');
    else if (kind === 'rock') { AUDIO.play('crush'); Game.shake(4, 12); Game.burst(a.cx, a.cy, 'rock', 14); }
    else AUDIO.play('fall');
    Game.deaths++; Game.state = 'respawn'; Game.stateT = 0;
  };
  Game.gameComplete = () => {
    if (Game.state !== 'play') return;
    Game.state = 'win'; Game.stateT = 0;
    AUDIO.stopMusic(); AUDIO.play('bell'); AUDIO.play('win');
  };

  Game.respawn = function () {
    const p = Game.player;
    for (const e of Game.entities) { if (e instanceof Mount && !e.retired) e.reset(); if (e.onRespawn) e.onRespawn(Game); }
    Game.entities = Game.entities.filter(e => !(e instanceof Boulder));
    p.riding = null; p.x = Game.spawn.x; p.y = Game.spawn.y - p.h;
    p.vx = 0; p.vy = 0; p.mudT = 0; p.mountCd = 0; p.invuln = 50; p.lastMover = null;
    const m = Game.spawnMount;
    if (m) { m.x = p.cx - m.w / 2; m.y = Game.spawn.y - m.h; m.vx = 0; m.vy = 0; p.mount(m, Game, true); }
    Game.floorY = p.cy;
    Input.clearJump();
    Game.state = 'play'; Game.fade = 0.8;
  };

  // ── cargar ───────────────────────────────────────────────────────────────
  function startGame() {
    const lv = LEVELS[0];
    Game.level = lv;
    Game.entities = []; Game.movers = []; Game.particles = [];
    Game.choclos = 0; Game.pages = 0; Game.score = 0; Game.deaths = 0; Game.time = 0;
    Game.totalChoclos = lv.entities.filter(d => d.type === 'choclo').length;
    for (const def of lv.entities) { const e = makeEntity(def, lv); if (e) Game.entities.push(e); }
    for (const e of Game.entities.slice()) if (e instanceof Huaico) e.prefill(Game);
    const px = lv.spawn.x * TILE + 4, py = lv.spawn.y * TILE - 15;
    Game.player = new Player(px, py);
    Game.spawn = { x: px, y: lv.spawn.y * TILE }; Game.spawnMount = null;
    Game.zone = -1; Game.hint = null; Game.banner = 0;
    Game.look = LOOK_X * 0.6; Game.floorY = Game.player.cy;
    updateCamera(true);
    Game.state = 'play'; Game.stateT = 0; Game.fade = 1;
  }

  // ── cámara ───────────────────────────────────────────────────────────────
  // La cámara anticipa: mira hacia donde vas (el personaje queda a ~1/3 de la
  // pantalla y ves ~2/3 de lo que viene). En reposo no recentra, así no marea.
  const LOOK_X = 84;
  function updateCamera(snap) {
    const lv = Game.level, p = Game.player, cam = Game.cam;
    const body = p.riding || p;
    const own = p.riding ? p.riding.vx : p.vx;
    const maxV = p.riding instanceof Llama ? PHYS.LLAMA_MAX : PHYS.RUN_MAX;
    let want = Game.look;
    if (Math.abs(own) > 0.5) want = Math.sign(own) * LOOK_X * Math.min(1, 0.6 + Math.abs(own) / maxV * 0.4);
    if (p.riding instanceof Cabra) want = clamp(want, -36, 36);
    const reversing = Math.sign(want) !== Math.sign(Game.look) && Math.abs(Game.look) > 4;
    Game.look += (want - Game.look) * (reversing ? 0.025 : 0.05);

    // vertical: seguimos el "suelo" donde aterrizas, no cada salto
    if (body.onGround || snap) Game.floorY = p.cy;
    let focusY = Game.floorY, off = BASE_H * 0.62;
    if (p.cy > Game.floorY + 10) focusY = p.cy; // cayendo: lo seguimos ya
    if (p.riding instanceof Cabra) { focusY = Math.min(Game.floorY, p.cy + 10); off = BASE_H * 0.72; } // trepando: mira arriba

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

  // ── zonas: música y pistas por tramo ─────────────────────────────────────
  function updateZone() {
    const lv = Game.level, x = Game.player.cx / TILE;
    let z = 0;
    for (let i = 0; i < lv.zones.length; i++) if (x >= lv.zones[i].x) z = i;
    if (z > Game.zone) {
      Game.zone = z; const Z = lv.zones[z];
      Game.zoneName = Z.name;
      AUDIO.playMusic(SONGS[Z.music]);
      Game.showHint(Z.hint);
    }
  }

  // ── lógica ───────────────────────────────────────────────────────────────
  function update() {
    tick++; Game.T = tick;
    Input.update();
    if (Game.shakeT > 0) { Game.shakeT--; if (Game.shakeT === 0) Game.shakeMag = 0; }
    Game.fade = Math.max(0, Game.fade - 0.05);
    if (Game.hint) Game.hint.t++;

    const tap = Game.pointer; Game.pointer = null;
    switch (Game.state) {
      case 'menu': updateMenu(tap); break;
      case 'controls': if (tap || Input.pressed('confirm') || Input.pressed('jump') || Input.pressed('pause')) { AUDIO.play('select'); Game.state = 'menu'; } break;
      case 'play': updatePlay(); break;
      case 'pause': updatePause(tap); break;
      case 'respawn':
        Game.stateT++; updateParticles();
        if (Game.stateT > 34) Game.respawn();
        break;
      case 'win':
        Game.stateT++; updateParticles();
        for (const e of Game.entities) if (e instanceof School) e.update(Game);
        if (Game.stateT > 90 && (tap || Input.pressed('confirm') || Input.pressed('jump'))) { AUDIO.play('select'); Game.state = 'menu'; AUDIO.playMusic(SONGS.menu); }
        break;
    }
    let rv = 0, mv = 0;
    if (Game.level && (Game.state === 'play' || Game.state === 'respawn')) [rv, mv] = ambientVolumes();
    AUDIO.updateAmbient(rv, mv);
    Input.endFrame();
  }

  function ambientVolumes() {
    const p = Game.player; let r = 0, m = 0;
    for (const L of Game.level.liquids) {
      const X0 = L.x * TILE, X1 = (L.x + L.w) * TILE, wl = L.y * TILE + 4;
      const dx = p.cx < X0 ? X0 - p.cx : p.cx > X1 ? p.cx - X1 : 0;
      const dy = Math.max(0, Math.abs(p.cy - wl) - 40);
      const d = Math.hypot(dx, dy);
      if (L.kind === 'water') r = Math.max(r, 1 - d / 230); else m = Math.max(m, 1 - d / 300);
    }
    return [clamp(r, 0, 1), clamp(m, 0, 1)];
  }

  const MENU_OPTS = () => ['JUGAR', 'CONTROLES', AUDIO.isEnabled() ? 'SONIDO: SÍ' : 'SONIDO: NO'];
  const MENU_Y = 142, MENU_DY = 16;
  function menuActivate(i) {
    AUDIO.resume();
    if (i === 0) { AUDIO.play('start'); startGame(); }
    else if (i === 1) { AUDIO.play('select'); Game.state = 'controls'; }
    else { AUDIO.toggleMute(); AUDIO.play('select'); }
  }
  function updateMenu(tap) {
    if (Input.pressed('up')) { Game.menuSel = (Game.menuSel + 2) % 3; AUDIO.play('select'); }
    if (Input.pressed('down')) { Game.menuSel = (Game.menuSel + 1) % 3; AUDIO.play('select'); }
    if (tap) {
      // un clic sobre una opción la ejecuta; un clic en cualquier otro sitio = JUGAR
      const i = Math.round((tap.y - MENU_Y - 3) / MENU_DY);
      menuActivate(i >= 0 && i < 3 && Math.abs(tap.x - BASE_W / 2) < 80 ? i : 0);
      return;
    }
    if (Input.pressed('confirm') || Input.pressed('jump')) menuActivate(Game.menuSel);
  }
  const PAUSE_OPTS = ['CONTINUAR', 'REINICIAR', 'MENÚ'];
  function pauseActivate(i) {
    AUDIO.play('select');
    if (i === 0) Game.state = 'play';
    else if (i === 1) startGame();
    else { Game.state = 'menu'; AUDIO.playMusic(SONGS.menu); }
  }
  function updatePause(tap) {
    if (Input.pressed('up')) { Game.pauseSel = (Game.pauseSel + 2) % 3; AUDIO.play('select'); }
    if (Input.pressed('down')) { Game.pauseSel = (Game.pauseSel + 1) % 3; AUDIO.play('select'); }
    if (Input.pressed('pause')) { Game.state = 'play'; AUDIO.play('select'); return; }
    if (tap) { const i = Math.round((tap.y - 104 - 3) / 20); if (i >= 0 && i < 3) pauseActivate(i); return; }
    if (Input.pressed('confirm') || Input.pressed('jump')) pauseActivate(Game.pauseSel);
  }

  function updatePlay() {
    const p = Game.player;
    if (Input.pressed('pause')) { Game.state = 'pause'; Game.pauseSel = 0; AUDIO.play('select'); return; }
    if (Input.pressed('mute')) AUDIO.toggleMute();
    Game.time++; Game.banner++;

    for (const m of Game.movers) m.update(Game);
    p.update(Game);
    for (const e of Game.entities) { if (e.dead || e.isMover) continue; e.update(Game); if (Game.state !== 'play') return; }
    Game.entities = Game.entities.filter(e => !e.dead);
    Game.movers = Game.movers.filter(e => !e.dead);

    collisionPass();
    updateParticles();
    updateZone();
    updateCamera(false);
    // el huaico hace temblar el suelo
    if (Game.zone === 3 && tick % 90 === 0) Game.shake(1, 10);
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
      } else if (e instanceof Boulder) {
        if (p.invuln <= 0 && aabb(hb, { x: e.x + 1, y: e.y + 1, w: e.w - 2, h: e.h - 2 })) { Game.playerEnvDeath('rock'); return; }
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

  // ── render ───────────────────────────────────────────────────────────────
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (Game.state === 'menu') { renderMenu(); return; }
    if (Game.state === 'controls') { renderMenu(); renderControls(); return; }
    const lv = Game.level; if (!lv) return;

    let sx = 0, sy = 0;
    if (Game.shakeT > 0) { sx = rnd(-Game.shakeMag, Game.shakeMag); sy = rnd(-Game.shakeMag, Game.shakeMag); }

    const gr = ctx.createLinearGradient(0, 0, 0, BASE_H);
    gr.addColorStop(0, lv.sky[0]); gr.addColorStop(0.6, lv.sky[1]); gr.addColorStop(1, lv.sky[2]);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, BASE_W, BASE_H);

    const camx = Game.cam.x, camy = Game.cam.y;
    const anchor = lv.anchorRow * TILE - BASE_H * 0.62;
    // sol
    ctx.fillStyle = '#fff1c4'; ctx.beginPath(); ctx.arc(300, 40 - (camy - anchor) * 0.03, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,241,196,0.25)'; ctx.beginPath(); ctx.arc(300, 40 - (camy - anchor) * 0.03, 22, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < lv.bgLayers.length; i++) {
      const L = lv.bgLayers[i];
      if (L.kind === 'clouds') { drawClouds(L, camx, -(camy - anchor) * 0.05, 'c' + i); drawSkyCondors(-(camy - anchor) * 0.06); continue; }
      const strip = getStrip(L, 'l' + i);
      const off = -mod(camx * L.parallax, strip.width);
      const yoff = Math.round((L.y * TILE - anchor) - (camy - anchor) * L.vpar - 120);
      for (let x = off; x < BASE_W; x += strip.width) ctx.drawImage(strip, Math.round(x), yoff);
      if (yoff + strip.height < BASE_H) { ctx.fillStyle = L.color2; ctx.fillRect(0, yoff + strip.height, BASE_W, BASE_H); }
    }

    ctx.save();
    ctx.translate(Math.round(-camx + sx), Math.round(-camy + sy));
    renderBackdrop(lv);
    renderTiles(lv);
    renderLiquids(lv);
    renderDecor(lv);
    renderEntities();
    const p = Game.player;
    if (Game.state !== 'respawn' && !p.won) { p.draw(ctx, Game); p.drawRider(ctx); }
    renderParticles();
    ctx.restore();

    renderHUD();
    renderOverlay();
  }

  // pared del risco detrás de las salientes (decorado, no colisiona)
  let backTile = null;
  function renderBackdrop(lv) {
    if (!backTile) { backTile = PIX.createCanvas(TILE, TILE); const g = backTile.getContext('2d'); g.drawImage(T.stone, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(40,30,60,0.55)'; g.fillRect(0, 0, TILE, TILE); }
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

  function renderTiles(lv) {
    const c0 = Math.max(0, Math.floor(Game.cam.x / TILE) - 1), c1 = Math.min(lv.cols - 1, Math.ceil((Game.cam.x + BASE_W) / TILE) + 1);
    const r0 = Math.max(0, Math.floor(Game.cam.y / TILE) - 1), r1 = Math.min(lv.rows - 1, Math.ceil((Game.cam.y + BASE_H) / TILE) + 1);
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
      const code = lv.tile(x, y); if (!code) continue;
      const spec = TILE_SPECS[code]; if (!spec || spec.liquid) continue;
      const img = spec.top && !isSolidCode(lv.tile(x, y - 1)) ? spec.top : spec.body;
      if (img) ctx.drawImage(img, x * TILE, y * TILE);
    }
  }

  // ── agua y lodo: dibujados píxel a píxel, con corriente ───────────────────
  const LIQ = {
    water: { foam: '#ffffff', hi: '#d2f6f2', bands: ['#6fd6dc', '#4fbad0', '#3597bb', '#27739f', '#1d5683'], streak: ['#b4f0f0', '#8cdde6', '#69c2da', '#4ba0c6', '#3780ad'], speed: 1.0, amp: 1, chunks: null },
    mud:   { foam: '#f0d6a8', hi: '#d6a56a', bands: ['#a8723c', '#8c5a2e', '#704623', '#56351a', '#3f2512'], streak: ['#dcae74', '#c2905a', '#a47546', '#875d36', '#6b4628'], speed: 1.3, amp: 1.7, chunks: ['#3a2414', '#5d5768', '#2a1f2d', '#6e4627'] },
  };
  const BAND_H = [5, 8, 12, 16, 9999];
  const surf = (x, t, flow, amp = 1) => Math.round((Math.sin(x * 0.19 - t * 0.11 * flow) * 0.9 + Math.sin(x * 0.067 - t * 0.05 * flow + 1.7) * 1.1) * amp);

  function renderLiquids(lv) {
    const t = tick, vx0 = Game.cam.x - 4, vx1 = Game.cam.x + BASE_W + 4, vy1 = Game.cam.y + BASE_H + 4;
    for (const L of lv.liquids) {
      const Pl = LIQ[L.kind], flow = L.flow;
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

  const DECOR_MAP = { cantuta: () => T.cantuta, ichu: () => T.ichu, maguey: () => T.maguey, sign: () => T.sign };
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
    const back = e => e instanceof School || e instanceof Apacheta;
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

  // ── HUD ──────────────────────────────────────────────────────────────────
  function panel(x, y, w, h) { ctx.fillStyle = 'rgba(28,18,30,0.55)'; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2); }
  function renderHUD() {
    panel(6, 6, 104, 16);
    ctx.drawImage(OBJ.choclo[0], 10, 9);
    drawText(ctx, Game.choclos + '/' + Game.totalChoclos, 21, 11, { color: '#ffe27a' });
    ctx.drawImage(OBJ.page, 64, 8);
    drawText(ctx, Game.pages + '/3', 77, 11, { color: '#ffffff' });
    if (Game.zoneName) drawText(ctx, Game.zoneName, BASE_W - 8, 9, { color: '#fff3d6', align: 'right', shadow: true, shadowColor: '#00000088' });

    // pista contextual
    const h = Game.hint;
    if (h && h.t < 260) {
      const a = Math.min(1, h.t / 12, (260 - h.t) / 30);
      ctx.globalAlpha = a;
      const w = textWidth(h.text) + 16;
      panel(BASE_W / 2 - w / 2, 30, w, 15);
      drawText(ctx, h.text, BASE_W / 2, 34, { color: '#fff3d6', align: 'center' });
      ctx.globalAlpha = 1;
    }
    // título al empezar
    if (Game.banner < 170) {
      const a = Math.min(1, (170 - Game.banner) / 40);
      ctx.globalAlpha = a;
      drawText(ctx, 'EL CAMINO AL COLE', BASE_W / 2, 64, { scale: 2, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
      drawText(ctx, '¡LLEGA A TIEMPO A CLASES!', BASE_W / 2, 86, { color: '#ffffff', align: 'center', shadow: true, shadowColor: '#00000099' });
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
      drawText(ctx, '¡ACHACHÁU!', BASE_W / 2, BASE_H / 2 - 8, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
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
    drawText(ctx, '¡LLEGASTE AL COLE!', BASE_W / 2, 30 + bob, { scale: 2, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
    drawText(ctx, 'JUSTO CUANDO SONABA LA CAMPANA.', BASE_W / 2, 54, { color: '#f4e9d8', align: 'center' });
    ctx.drawImage(LL.idle[0], BASE_W / 2 - 64, 74);
    ctx.drawImage(P.run[Math.floor(tick / 7) % 4], BASE_W / 2 - 8, 76);
    ctx.drawImage(GOAT.stand, BASE_W / 2 + 34, 81);
    const secs = Math.floor(Game.time / 60);
    const rows = [
      ['CHOCLOS', Game.choclos + ' / ' + Game.totalChoclos, '#ffe27a'],
      ['HOJAS DE TAREA', Game.pages + ' / 3', '#ffffff'],
      ['TIEMPO', Math.floor(secs / 60) + ':' + String(secs % 60).padStart(2, '0'), '#9be7c4'],
      ['CAÍDAS', '' + Game.deaths, '#f2917d'],
    ];
    rows.forEach((r, i) => {
      drawText(ctx, r[0], BASE_W / 2 - 80, 112 + i * 13, { color: '#cdbde8' });
      drawText(ctx, r[1], BASE_W / 2 + 80, 112 + i * 13, { color: r[2], align: 'right' });
    });
    if (Game.pages === 3) drawText(ctx, '¡TAREA COMPLETA! LA PROFE ESTARÁ ORGULLOSA', BASE_W / 2, 170, { color: '#9be7c4', align: 'center' });
    if (Game.stateT > 90 && Math.floor(tick / 24) % 2 === 0) drawText(ctx, 'PULSA PARA VOLVER AL MENÚ', BASE_W / 2, 194, { color: '#fff3d6', align: 'center' });
    ctx.globalAlpha = 1;
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
    drawText(ctx, 'EL CAMINO', BASE_W / 2, 34 + bob, { scale: 3, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
    drawText(ctx, 'AL COLE', BASE_W / 2, 60 + bob, { scale: 3, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
    drawText(ctx, 'UNA AVENTURA EN LOS ANDES', BASE_W / 2, 90 + bob, { color: '#fff3d6', align: 'center', shadow: true, shadowColor: '#00000088' });
    MENU_OPTS().forEach((o, i) => {
      const sel = i === Game.menuSel, y = MENU_Y + i * MENU_DY;
      drawText(ctx, o, BASE_W / 2, y, { color: sel ? '#ffffff' : '#e7d3c4', align: 'center', shadow: true, shadowColor: '#00000099' });
      if (sel) { const w = textWidth(o); drawText(ctx, '>', BASE_W / 2 - w / 2 - 12, y, { color: '#ffd166' }); drawText(ctx, '<', BASE_W / 2 + w / 2 + 6, y, { color: '#ffd166' }); }
    });
  }

  function renderControls() {
    ctx.fillStyle = 'rgba(11,10,18,0.84)'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    drawText(ctx, 'CONTROLES', BASE_W / 2, 20, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
    const rows = [['MOVER', 'FLECHAS / A D'], ['SALTAR', 'ESPACIO / Z / FLECHA ARRIBA'], ['BAJARSE DE LA LLAMA', 'FLECHA ABAJO'], ['PAUSA', 'ESC / P'], ['SILENCIO', 'M']];
    rows.forEach((r, i) => {
      drawText(ctx, r[0], 30, 50 + i * 15, { color: '#9be7c4' });
      drawText(ctx, r[1], BASE_W - 30, 50 + i * 15, { color: '#f4e9d8', align: 'right' });
    });
    const tips = ['LLAMA: TÓCALA PARA MONTARLA. CORRE Y SALTA MÁS.', 'CABRA: SALTA SOLA. TÚ SOLO LA GUÍAS.', 'HUAICO: SALTA DE TRONCO EN TRONCO.', 'LAS APACHETAS GUARDAN TU AVANCE.'];
    tips.forEach((t, i) => drawText(ctx, t, BASE_W / 2, 132 + i * 12, { color: '#cdbde8', align: 'center' }));
    drawText(ctx, 'PULSA PARA VOLVER', BASE_W / 2, 196, { color: '#fff3d6', align: 'center' });
  }

  // ── bucle ────────────────────────────────────────────────────────────────
  let last = performance.now(), acc = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    let dt = ts - last; last = ts;
    if (dt > 100) dt = 100;
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 5) { update(); acc -= STEP; guard++; }
    if (guard >= 5) acc = 0;
    render();
  }

  // ── init ─────────────────────────────────────────────────────────────────
  function init() {
    Input.wireTouch();
    const boot = document.getElementById('boot');
    if (boot) { boot.classList.add('hidden'); setTimeout(() => boot.remove(), 600); }
    if ('ontouchstart' in window) { const t = document.getElementById('touch'); if (t) t.classList.add('on'); }
    canvas.addEventListener('pointerdown', (e) => {
      AUDIO.resume();
      const r = canvas.getBoundingClientRect();
      Game.pointer = { x: (e.clientX - r.left) / r.width * BASE_W, y: (e.clientY - r.top) / r.height * BASE_H };
    });
    canvas.addEventListener('pointermove', (e) => {
      if (Game.state !== 'menu') return;
      const r = canvas.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * BASE_W, y = (e.clientY - r.top) / r.height * BASE_H;
      const i = Math.round((y - MENU_Y - 3) / MENU_DY);
      if (i >= 0 && i < 3 && Math.abs(x - BASE_W / 2) < 80) Game.menuSel = i;
    });
    const firstGesture = () => { AUDIO.resume(); if (Game.state === 'menu') AUDIO.playMusic(SONGS.menu); window.removeEventListener('keydown', firstGesture); window.removeEventListener('pointerdown', firstGesture); };
    window.addEventListener('keydown', firstGesture);
    window.addEventListener('pointerdown', firstGesture);
    requestAnimationFrame(frame);
  }
  Game.debugStep = update;
  Game.debugRender = render;
  Game.startGame = startGame;
  init();
})();
