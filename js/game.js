// game.js — motor: bucle fijo, cámara, parallax, render por capas, HUD y estados.
(function () {
  'use strict';

  const BASE_W = 384, BASE_H = 216, STEP = 1000 / 60;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function fit() {
    const sw = window.innerWidth, sh = window.innerHeight;
    let scale = Math.max(1, Math.floor(Math.min(sw / BASE_W, sh / BASE_H)));
    canvas.style.width = BASE_W * scale + 'px';
    canvas.style.height = BASE_H * scale + 'px';
  }
  window.addEventListener('resize', fit); fit();

  // ── utilidades ───────────────────────────────────────────────────────────
  const rnd = (a, b) => a + Math.random() * (b - a);
  function aabb(a, b, ap = 0, bp = 0) {
    return a.x - ap < b.x + b.w + bp && a.x + a.w + ap > b.x - bp && a.y - ap < b.y + b.h + bp && a.y + a.h + ap > b.y - bp;
  }

  // ── parallax ─────────────────────────────────────────────────────────────
  const strips = {};
  function buildStrip(def) {
    const W = 768, H = BASE_H;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const s = def.seed || 1;
    function ridge(x) {
      let n = 0, amp = 1, norm = 0, freq = 1;
      for (let o = 0; o < 4; o++) {
        n += Math.sin((x / W) * Math.PI * 2 * freq + s * 1.7 * (o + 1) + o) * amp;
        norm += amp; amp *= 0.55; freq *= 2;
      }
      return n / norm;
    }
    const center = 120, ampPx = def.amp * TILE * 0.5;
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 2) g.lineTo(x, center - ridge(x) * ampPx);
    g.lineTo(W, H); g.closePath();
    const grad = g.createLinearGradient(0, center - ampPx, 0, H);
    grad.addColorStop(0, def.color); grad.addColorStop(1, def.color2 || def.color);
    g.fillStyle = grad; g.fill();
    if (def.snow) {
      const snowLine = center - ampPx * 0.25;
      g.fillStyle = '#f4f8ff';
      for (let x = 0; x <= W; x += 2) {
        const ry = center - ridge(x) * ampPx;
        if (ry < snowLine) { const d = Math.min(10, (snowLine - ry) * 1.4); g.fillRect(x, ry, 2, d); }
      }
    }
    return c;
  }
  function getStrip(def, key) { if (!strips[key]) strips[key] = buildStrip(def); return strips[key]; }

  const cloudSeed = {};
  function drawClouds(layer, camx, camy, key) {
    const W = 768;
    if (!cloudSeed[key]) {
      const arr = []; const s = layer.seed || 1;
      for (let i = 0; i < (layer.count || 8); i++) {
        const x = ((i * 137.5 + s * 53) % W);
        const y = 5 + ((i * 23 + s * 11) % 42); // nubes altas, lejos del suelo
        const sc = 1 + ((i * 7 + s) % 3);
        arr.push({ x, y, sc });
      }
      cloudSeed[key] = arr;
    }
    const arr = cloudSeed[key];
    const off = (camx * layer.parallax + tick * 0.06) % W;
    const yoff = -camy * 0.06;
    for (const c of arr) {
      let x = (c.x - off) % W; if (x < -40) x += W;
      drawCloud(c, x, c.y + yoff, layer.color);
    }
  }
  function drawCloud(c, x, y, color) {
    const img = c.sc === 1 ? T.cloud : cloudScaled(c.sc, color);
    ctx.drawImage(img, Math.round(x), Math.round(y));
  }
  const cloudCache = {};
  function cloudScaled(sc, color) {
    const k = sc + color;
    if (!cloudCache[k]) cloudCache[k] = PIX.scaled(PIX.tinted(T.cloud, color), sc);
    return cloudCache[k];
  }

  // ── partículas ───────────────────────────────────────────────────────────
  const COL = { dust: '#c9a86a', spark: '#ffe27a', mud: '#7a5a3a', feather: '#eef3ff', heart: '#ff6b8a', splash: '#8fd8f0', rock: '#8b8598' };

  // ── estado del juego ─────────────────────────────────────────────────────
  const Game = {
    state: 'menu', levelIndex: 0, level: null, player: null, entities: [], movers: [], particles: [],
    cam: { x: 0, y: 0 }, look: 0, shakeT: 0, shakeMag: 0, fade: 1, fadeDir: -1,
    coins: 0, gems: 0, score: 0, totalCoins: 0, totalGems: 0,
    menuSel: 0, pauseSel: 0, blink: 0, T: 0, storyT: 0, stateT: 0,
    spawn: { x: 0, y: 0 }, checkpointName: '',
  };
  window.Game = Game;

  // hooks usados por entidades
  Game.audio = (name) => AUDIO.play(name);
  Game.addScore = (n) => { Game.score += n; };
  Game.shake = (mag, t) => { Game.shakeMag = Math.max(Game.shakeMag, mag); Game.shakeT = Math.max(Game.shakeT, t); };
  Game.burst = (x, y, type, n) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = rnd(0.4, 2.2);
      Game.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, life: rnd(16, 30), max: 30, col: COL[type] || '#fff', size: rnd(1, 2.4) | 0 || 1, grav: type === 'splash' || type === 'mud' ? 0.18 : 0.05 });
    }
  };
  Game.onPlayerJump = (p) => {
    Game.burst(p.cx, p.y + p.h, 'dust', 6);
    AUDIO.play('jump');
  };
  Game.setCheckpoint = (cp) => { Game.spawn = { x: cp.spawn.x, y: cp.spawn.y }; Game.checkpointName = cp.name; };
  Game.playerEnvDeath = (kind) => {
    if (Game.state !== 'play') return;
    if (kind === 'water') AUDIO.play('splash');
    else if (kind === 'fall') AUDIO.play('fall');
    else if (kind === 'mud') AUDIO.play('drown');
    Game.state = 'respawn'; Game.stateT = 0;
  };
  Game.playerDeath = () => { if (Game.state !== 'play') return; AUDIO.play('death'); Game.state = 'respawn'; Game.stateT = 0; };
  Game.levelComplete = () => { if (Game.state !== 'play') return; Game.state = 'levelclear'; Game.stateT = 0; AUDIO.play('win'); };
  Game.gameComplete = () => { if (Game.state !== 'play') return; Game.state = 'win'; Game.stateT = 0; AUDIO.play('win'); };

  Game.respawn = function () {
    const p = Game.player;
    p.x = Game.spawn.x; p.y = Game.spawn.y - p.h;
    p.vx = 0; p.vy = 0; p.dead = false; p.won = false; p.hearts = p.maxHearts; p.invuln = 90; p.riding = null;
    for (const e of Game.entities) if (e instanceof Llama) { e.rider = null; }
    Game.state = 'play'; Game.fade = 1; Game.fadeDir = -1;
  };

  // ── cargar nivel ─────────────────────────────────────────────────────────
  function loadLevel(i) {
    Game.levelIndex = i;
    const lv = LEVELS[i];
    Game.level = lv;
    Game.entities = []; Game.movers = []; Game.particles = [];
    Game.totalCoins = 0;
    for (const def of lv.entities) {
      const e = makeEntity(def);
      if (!e) continue;
      Game.entities.push(e);
      if (e.isSurfRock) Game.movers.push(e);
      if (def.type === 'coin') Game.totalCoins++;
    }
    if (lv.goal) { const ge = makeEntity(lv.goal); if (ge) Game.entities.push(ge); }
    const sp = lv.spawn;
    const px = sp.x * TILE + 4, py = sp.y * TILE - 15;
    Game.player = new Player(px, py);
    Game.spawn = { x: Game.player.x, y: Game.player.y + 15 };
    Game.checkpointName = '';
    Game.cam.x = Game.player.cx - BASE_W / 2;
    Game.cam.y = Game.player.cy - BASE_H / 2;
    Game.look = 0;
    Game.state = 'story'; Game.storyT = 0; Game.stateT = 0; Game.fade = 1; Game.fadeDir = -1;
    AUDIO.playMusic(SONGS[lv.music] || SONGS.valle);
  }
  Game.loadLevel = loadLevel;

  // ── cámara: zona muerta + lookahead suave (sin mareo) ─────────────────────
  function updateCamera() {
    const lv = Game.level, p = Game.player;
    // lookahead acotado y muy suavizado; no salta al girar
    const desiredLook = Math.max(-22, Math.min(28, p.vx * 6 + (p.onGround ? p.facing * 9 : 0)));
    Game.look += (desiredLook - Game.look) * 0.035;
    const cx = BASE_W / 2 + Game.look, cy = BASE_H / 2;
    const dzx = 56, dzy = 64; // zona muerta: la cámara no se mueve dentro de este recuadro
    let tx = Game.cam.x;
    const sX = p.cx - Game.cam.x;
    if (sX > cx + dzx) tx = p.cx - (cx + dzx);
    else if (sX < cx - dzx) tx = p.cx - (cx - dzx);
    let ty = Game.cam.y;
    const sY = p.cy - Game.cam.y;
    if (sY > cy + dzy) ty = p.cy - (cy + dzy);
    else if (sY < cy - dzy) ty = p.cy - (cy - dzy);
    Game.cam.x += (tx - Game.cam.x) * 0.10;
    Game.cam.y += (ty - Game.cam.y) * 0.065;
    const worldW = lv.cols * TILE, worldH = lv.rows * TILE;
    if (worldW <= BASE_W) Game.cam.x = (worldW - BASE_W) / 2;
    else Game.cam.x = Math.max(0, Math.min(worldW - BASE_W, Game.cam.x));
    if (worldH <= BASE_H) Game.cam.y = (worldH - BASE_H) / 2;
    else Game.cam.y = Math.max(0, Math.min(worldH - BASE_H, Game.cam.y));
  }

  // ── lógica ───────────────────────────────────────────────────────────────
  let tick = 0;
  function update() {
    tick++; Game.T = tick;
    Input.update();
    Game.blink += 0.08;

    if (Game.shakeT > 0) { Game.shakeT--; if (Game.shakeT === 0) Game.shakeMag = 0; }
    if (Game.fadeDir < 0) Game.fade = Math.max(0, Game.fade - 0.06);
    else Game.fade = Math.min(1, Game.fade + 0.06);

    switch (Game.state) {
      case 'menu': updateMenu(); break;
      case 'controls': if (Input.pressed('confirm') || Input.pressed('pause')) { AUDIO.play('select'); Game.state = 'menu'; } break;
      case 'story':
        Game.storyT++;
        if (Game.storyT > 20 && (Input.pressed('confirm') || Input.pressed('jump'))) {
          Game.state = 'play'; Game.stateT = 0; AUDIO.play('select');
        }
        break;
      case 'play': updatePlay(); break;
      case 'pause': updatePause(); break;
      case 'respawn':
        Game.stateT++;
        if (Game.stateT > 24) { Game.respawn(); AUDIO.play('select'); }
        break;
      case 'levelclear':
        Game.stateT++;
        if (Game.stateT > 30 && (Input.pressed('confirm') || Input.pressed('jump'))) {
          if (Game.levelIndex + 1 < LEVELS.length) { AUDIO.play('select'); loadLevel(Game.levelIndex + 1); }
          else { Game.state = 'win'; Game.stateT = 0; }
        }
        break;
      case 'win':
        Game.stateT++;
        if (Game.stateT > 40 && Input.pressed('confirm')) { AUDIO.play('select'); resetRun(); Game.state = 'menu'; }
        break;
    }
    Input.endFrame();
  }

  function resetRun() { Game.coins = 0; Game.gems = 0; Game.score = 0; }

  function updateMenu() {
    if (Input.pressed('up')) { Game.menuSel = (Game.menuSel + 2) % 3; AUDIO.play('select'); }
    if (Input.pressed('down')) { Game.menuSel = (Game.menuSel + 1) % 3; AUDIO.play('select'); }
    if (Input.pressed('confirm') || Input.pressed('jump')) {
      AUDIO.resume(); AUDIO.play('start');
      if (Game.menuSel === 0) { resetRun(); loadLevel(0); }
      else if (Game.menuSel === 1) { Game.state = 'controls'; }
      else { AUDIO.toggleMute(); }
    }
  }

  function updatePause() {
    if (Input.pressed('up')) { Game.pauseSel = (Game.pauseSel + 2) % 3; AUDIO.play('select'); }
    if (Input.pressed('down')) { Game.pauseSel = (Game.pauseSel + 1) % 3; AUDIO.play('select'); }
    if (Input.pressed('pause')) { Game.state = 'play'; AUDIO.play('select'); return; }
    if (Input.pressed('confirm') || Input.pressed('jump')) {
      if (Game.pauseSel === 0) { Game.state = 'play'; AUDIO.play('select'); }
      else if (Game.pauseSel === 1) { AUDIO.play('select'); loadLevel(Game.levelIndex); }
      else { AUDIO.play('select'); AUDIO.stopMusic(); resetRun(); Game.state = 'menu'; }
    }
  }

  function updatePlay() {
    const lv = Game.level, p = Game.player;

    if (Input.pressed('pause')) { Game.state = 'pause'; Game.pauseSel = 0; AUDIO.play('select'); return; }
    if (Input.pressed('mute')) AUDIO.toggleMute();

    // movers primero (para dx de este frame)
    for (const m of Game.movers) m.update(Game);

    p.update(Game);

    for (const e of Game.entities) {
      if (e.dead || e.isSurfRock) continue; // los movers ya se actualizaron arriba
      e.update(Game);
    }
    // limpiar
    Game.entities = Game.entities.filter(e => !e.dead && e.alive !== false);

    collisionPass();
    updateParticles();
    updateCamera();
  }

  function collisionPass() {
    const p = Game.player;
    if (p.dead || p.won) return;
    const ph = p.hitboxSmall;
    for (const e of Game.entities) {
      if (e instanceof Cuy) {
        if (e.alive === false || e.squish > 0) continue;
        const box = { x: e.x + 1, y: e.y + 1, w: e.w - 2, h: e.h - 2 };
        if (aabb(ph, box)) {
          if (p.vy > 0.6 && p.y + p.h - e.y < 12) { e.stomp(Game); p.vy = -6.4; p.onGround = false; }
          else p.hurt(Game, Math.sign(p.cx - e.cx) || 1);
        }
      } else if (e instanceof Condor) {
        if (!e.alive) continue;
        const box = { x: e.x + 1, y: e.y + 1, w: e.w - 2, h: e.h - 2 };
        if (aabb(ph, box)) {
          if (p.vy > 0.4 && p.y + p.h - e.y < 12) { e.stomp(Game); p.vy = -6.4; }
          else p.hurt(Game, Math.sign(p.cx - e.cx) || 1);
        }
      } else if (e instanceof Mount && !p.riding && !e.rider) {
        const box = { x: e.x, y: e.y - 3, w: e.w, h: 12 };
        if (aabb(ph, box) && p.vy > 0) p.mount(e, Game);
      } else if (e instanceof SpikeRow) {
        const box = { x: e.x + 2, y: e.y + 4, w: e.w - 4, h: e.h - 4 };
        if (aabb(ph, box)) p.hurt(Game, Math.sign(p.cx - e.cx) || 0);
      }
    }
  }

  function updateParticles() {
    const ps = Game.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const pt = ps[i];
      pt.vy += pt.grav; pt.x += pt.vx; pt.y += pt.vy; pt.vx *= 0.98; pt.life--;
      if (pt.life <= 0) ps.splice(i, 1);
    }
  }

  // ── render ───────────────────────────────────────────────────────────────
  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, BASE_W, BASE_H);

    let sx = 0, sy = 0;
    if (Game.shakeT > 0) { sx = rnd(-Game.shakeMag, Game.shakeMag); sy = rnd(-Game.shakeMag, Game.shakeMag); }

    if (Game.state === 'menu') { renderMenu(); renderOverlay(); return; }
    if (Game.state === 'controls') { renderMenu(); renderControls(); renderOverlay(); return; }

    const lv = Game.level; if (!lv) return;

    // cielo
    const sky = lv.sky;
    const gr = ctx.createLinearGradient(0, 0, 0, BASE_H);
    gr.addColorStop(0, sky[0]); gr.addColorStop(0.55, sky[1]); gr.addColorStop(1, sky[2]);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, BASE_W, BASE_H);

    const camx = Game.cam.x, camy = Game.cam.y;
    for (let i = 0; i < lv.bgLayers.length; i++) {
      const L = lv.bgLayers[i];
      if (L.kind === 'clouds') { drawClouds(L, camx, camy, lv.name + i); continue; }
      const strip = getStrip(L, lv.name + i);
      const off = -(camx * L.parallax) % strip.width;
      const desired = L.y * TILE - camy;
      const yoff = desired - 120;
      for (let x = off - strip.width; x < BASE_W; x += strip.width) ctx.drawImage(strip, Math.round(x), Math.round(yoff));
    }

    ctx.save();
    ctx.translate(Math.round(-camx + sx), Math.round(-camy + sy));

    renderTiles(lv);
    renderDecor(lv);
    renderEntities();
    renderParticles();
    if (Game.player && !Game.player.won) Game.player.draw(ctx, Game);
    if (Game.player && Game.player.riding) Game.player.drawRider(ctx);

    ctx.restore();

    renderHUD();
    renderOverlay();
  }

  function renderTiles(lv) {
    const c0 = Math.max(0, Math.floor(Game.cam.x / TILE) - 1);
    const c1 = Math.min(lv.cols - 1, Math.ceil((Game.cam.x + BASE_W) / TILE) + 1);
    const r0 = Math.max(0, Math.floor(Game.cam.y / TILE) - 1);
    const r1 = Math.min(lv.rows - 1, Math.ceil((Game.cam.y + BASE_H) / TILE) + 1);
    const tAnim = Math.floor(tick / 14) % 2;
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) {
      const code = lv.tile(x, y); if (!code) continue;
      const spec = TILE_SPECS[code]; if (!spec) continue;
      let img;
      if (spec.anim) img = spec.anim[tAnim];
      else if (spec.top) img = isSolidCode(lv.tile(x, y - 1)) ? spec.body : spec.top;
      else img = spec.body;
      if (img) ctx.drawImage(img, x * TILE, y * TILE);
    }
  }

  const DECOR_MAP = { flower: () => T.flower, tuft: () => T.tuft, cactus: () => T.cactus, rock: () => T.rock, sign: () => T.sign };
  function renderDecor(lv) {
    for (const d of lv.decor || []) {
      const img = (DECOR_MAP[d[0]] || (() => null))(); if (!img) continue;
      ctx.drawImage(img, d[1] * TILE, d[2] * TILE + (TILE - img.height));
    }
  }

  function renderEntities() {
    const ents = Game.entities.slice();
    // dibujar primero fondos (checkpoints, school), luego enemigos/pickups
    for (const e of ents) if (e instanceof Checkpoint || e instanceof Goal || e instanceof School || e instanceof SurfRock) e.draw(ctx, Game);
    for (const e of ents) if (!(e instanceof Checkpoint || e instanceof Goal || e instanceof School || e instanceof SurfRock)) e.draw(ctx, Game);
  }

  function renderParticles() {
    for (const p of Game.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.max));
      ctx.fillStyle = p.col;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  function renderHUD() {
    const p = Game.player; if (!p) return;
    ctx.save();
    // panel
    ctx.fillStyle = 'rgba(20,14,28,0.42)';
    roundRect(6, 6, 150, 24, 4); ctx.fill();
    // corazones
    for (let i = 0; i < p.maxHearts; i++) {
      ctx.globalAlpha = i < p.hearts ? 1 : 0.28;
      ctx.drawImage(OBJ.heart, 10 + i * 12, 10);
    }
    ctx.globalAlpha = 1;
    // monedas
    ctx.drawImage(OBJ.coin[Math.floor(tick / 6) % 4], 52, 10);
    drawText(ctx, '' + Game.coins, 62, 11, { scale: 1, color: '#ffe27a' });
    // gemas
    ctx.drawImage(OBJ.gem, 92, 10);
    drawText(ctx, '' + Game.gems, 102, 11, { scale: 1, color: '#9ff0e4' });
    // nivel
    drawText(ctx, Game.level.name, BASE_W - 8, 9, { scale: 1, color: '#fff3d6', align: 'right', shadow: true });
    drawText(ctx, 'PUNTOS ' + Game.score, BASE_W - 8, 18, { scale: 1, color: '#cdbde8', align: 'right', shadow: true });
    ctx.restore();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ── overlays (fade, story, pause, respawn, clear, win) ───────────────────
  function renderOverlay() {
    if (Game.fade > 0.001) { ctx.fillStyle = 'rgba(11,10,18,' + Game.fade + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H); }
    if (Game.state === 'story') renderStory();
    if (Game.state === 'pause') renderPause();
    if (Game.state === 'levelclear') renderClear();
    if (Game.state === 'win') renderWin();
    if (Game.state === 'respawn') {
      const a = Math.min(1, Game.stateT / 12);
      ctx.fillStyle = 'rgba(11,10,18,' + a + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H);
      drawText(ctx, '¡UY!', BASE_W / 2, BASE_H / 2 - 6, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
    }
  }

  const STORY = [
    'EN LOS ANDES, IR A LA ESCUELA\nES TODA UNA AVENTURA.',
    'EL APU SE ALZA IMPONENTE.\nUN ABISMO TE SEPARA DEL CAMINO.',
    'UN HUAYCO BAJÓ DEL CERRO.\n¡SURFEA LAS ROCAS CONTRACORRIENTE!',
  ];
  function renderStory() {
    const a = Math.min(1, Game.storyT / 18);
    ctx.fillStyle = 'rgba(11,10,18,' + (0.72 * a) + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.globalAlpha = a;
    const lv = Game.level;
    drawText(ctx, 'NIVEL ' + (Game.levelIndex + 1), BASE_W / 2, 58, { scale: 1, color: '#9be7c4', align: 'center', shadow: true });
    drawText(ctx, lv.name, BASE_W / 2, 74, { scale: 2, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#00000099' });
    const lines = STORY[Game.levelIndex].split('\n');
    lines.forEach((ln, i) => drawText(ctx, ln, BASE_W / 2, 108 + i * 12, { scale: 1, color: '#f4e9d8', align: 'center' }));
    if (Math.floor(tick / 24) % 2 === 0) drawText(ctx, 'PULSA A PARA COMENZAR', BASE_W / 2, 168, { scale: 1, color: '#fff3d6', align: 'center' });
    ctx.globalAlpha = 1;
  }

  const PAUSE_OPTS = ['CONTINUAR', 'REINICIAR', 'MENÚ'];
  function renderPause() {
    ctx.fillStyle = 'rgba(11,10,18,0.72)'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    drawText(ctx, 'PAUSA', BASE_W / 2, 60, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
    PAUSE_OPTS.forEach((o, i) => {
      const sel = i === Game.pauseSel;
      const y = 104 + i * 20;
      if (sel && Math.floor(tick / 12) % 2 === 0) drawText(ctx, '>', BASE_W / 2 - 54, y, { scale: 1, color: '#9be7c4' });
      drawText(ctx, o, BASE_W / 2, y, { scale: 1, color: sel ? '#fff3d6' : '#b9b3d6', align: 'center' });
    });
  }

  function renderClear() {
    const a = Math.min(1, Game.stateT / 20);
    ctx.fillStyle = 'rgba(11,10,18,' + (0.78 * a) + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.globalAlpha = a;
    drawText(ctx, '¡NIVEL COMPLETADO!', BASE_W / 2, 66, { scale: 1, color: '#9be7c4', align: 'center', shadow: true });
    drawText(ctx, Game.level.name, BASE_W / 2, 82, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
    drawText(ctx, 'MONEDAS ' + Game.coins + '   GEMAS ' + Game.gems, BASE_W / 2, 118, { scale: 1, color: '#f4e9d8', align: 'center' });
    drawText(ctx, 'PUNTOS ' + Game.score, BASE_W / 2, 132, { scale: 1, color: '#ffe27a', align: 'center' });
    if (Game.stateT > 30 && Math.floor(tick / 24) % 2 === 0) drawText(ctx, Game.levelIndex + 1 < LEVELS.length ? 'PULSA A PARA SEGUIR' : 'PULSA A PARA TERMINAR', BASE_W / 2, 166, { scale: 1, color: '#fff3d6', align: 'center' });
    ctx.globalAlpha = 1;
  }

  function renderWin() {
    const a = Math.min(1, Game.stateT / 24);
    ctx.fillStyle = 'rgba(18,14,28,' + (0.86 * a) + ')'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    ctx.globalAlpha = a;
    const bob = Math.sin(tick / 12) * 2;
    drawText(ctx, '¡LLEGASTE AL COLE!', BASE_W / 2, 44 + bob, { scale: 2, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#00000099' });
    drawText(ctx, 'EL NIÑO LLEGÓ A CLASES.', BASE_W / 2, 74, { scale: 1, color: '#f4e9d8', align: 'center' });
    // niño + llama
    ctx.drawImage(LL.idle[0], BASE_W / 2 - 56, 96);
    ctx.drawImage(P.idle[Math.floor(tick / 20) % 2], BASE_W / 2 - 30, 96 + 0);
    drawText(ctx, 'MONEDAS ' + Game.coins, BASE_W / 2, 130, { scale: 1, color: '#ffe27a', align: 'center' });
    drawText(ctx, 'GEMAS ' + Game.gems, BASE_W / 2, 142, { scale: 1, color: '#9ff0e4', align: 'center' });
    drawText(ctx, 'PUNTOS ' + Game.score, BASE_W / 2, 154, { scale: 1, color: '#fff3d6', align: 'center' });
    if (Game.stateT > 40 && Math.floor(tick / 24) % 2 === 0) drawText(ctx, 'PULSA ENTER PARA VOLVER', BASE_W / 2, 182, { scale: 1, color: '#cdbde8', align: 'center' });
    ctx.globalAlpha = 1;
  }

  // ── menú principal ───────────────────────────────────────────────────────
  function renderMenu() {
    const gr = ctx.createLinearGradient(0, 0, 0, BASE_H);
    gr.addColorStop(0, '#3a2a5a'); gr.addColorStop(0.5, '#a45a7a'); gr.addColorStop(1, '#f0a35e');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, BASE_W, BASE_H);
    // sol
    ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(300, 60, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(300, 60, 18, 0, Math.PI * 2); ctx.fill();
    // montañas
    ctx.fillStyle = '#6a4a86'; mountainStrip(0, 120, 90);
    ctx.fillStyle = '#4a3a6a'; mountainStrip(0, 150, 70);
    ctx.fillStyle = '#2f6a4a'; ctx.fillRect(0, 176, BASE_W, 40);
    // suelo de pasto
    ctx.fillStyle = '#3fae5a'; ctx.fillRect(0, 176, BASE_W, 4);
    // personaje y llama
    ctx.drawImage(P.idle[Math.floor(Game.blink / 2) % 2], 70, 150);
    ctx.drawImage(LL.idle[Math.floor(Game.blink / 2) % 2], 250, 148);
    // título
    const bob = Math.sin(tick / 20) * 2;
    drawText(ctx, 'EL CAMINO', BASE_W / 2, 44 + bob, { scale: 3, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#6a2f1a' });
    drawText(ctx, 'AL COLE', BASE_W / 2, 70 + bob, { scale: 3, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#6a2f1a' });
    drawText(ctx, 'AVENTURA ANDINA', BASE_W / 2, 96 + bob, { scale: 1, color: '#f4e9d8', align: 'center', shadow: true });

    const OPTS = ['JUGAR', 'CONTROLES', AUDIO.isEnabled() ? 'SONIDO: SÍ' : 'SONIDO: NO'];
    OPTS.forEach((o, i) => {
      const sel = i === Game.menuSel;
      const y = 138 + i * 16;
      drawText(ctx, o, BASE_W / 2, y, { scale: 1, color: sel ? '#fff3d6' : '#e0d4c4', align: 'center', shadow: true });
      if (sel) { const w = textWidth(o, 1, 1); drawText(ctx, '>', BASE_W / 2 - w / 2 - 12, y, { scale: 1, color: '#9be7c4' }); drawText(ctx, '<', BASE_W / 2 + w / 2 + 6, y, { scale: 1, color: '#9be7c4' }); }
    });
    drawText(ctx, '(C) 2026 - HECHO PARA LA HACKATHON', BASE_W / 2, 202, { scale: 1, color: 'rgba(255,255,255,0.5)', align: 'center' });
  }
  function mountainStrip(seed, baseY, h) {
    ctx.beginPath(); ctx.moveTo(0, BASE_H);
    for (let x = 0; x <= BASE_W; x += 6) {
      const n = Math.sin(x * 0.02 + seed) * 0.5 + Math.sin(x * 0.05 + seed * 2) * 0.3;
      ctx.lineTo(x, baseY - h * (0.5 + 0.5 * n));
    }
    ctx.lineTo(BASE_W, BASE_H); ctx.closePath(); ctx.fill();
  }

  function renderControls() {
    ctx.fillStyle = 'rgba(11,10,18,0.82)'; ctx.fillRect(0, 0, BASE_W, BASE_H);
    drawText(ctx, 'CONTROLES', BASE_W / 2, 24, { scale: 2, color: '#ffd166', align: 'center', shadow: true });
    const rows = [
      ['MOVER', 'FLECHAS  A  D'],
      ['SALTAR', 'ESPACIO  Z  X'],
      ['BAJAR / BAJARSE', 'FLECHA ABAJO'],
      ['PAUSA', 'ESC  P'],
      ['SILENCIO', 'M'],
    ];
    rows.forEach((r, i) => {
      const y = 56 + i * 18;
      drawText(ctx, r[0], 40, y, { scale: 1, color: '#9be7c4' });
      drawText(ctx, r[1], BASE_W - 40, y, { scale: 1, color: '#f4e9d8', align: 'right' });
    });
    drawText(ctx, 'MONTA LA LLAMA CAYENDO SOBRE ELLA', BASE_W / 2, 156, { scale: 1, color: '#cdbde8', align: 'center' });
    drawText(ctx, 'EN EL HUAYCO, SALTA ENTRE ROCAS', BASE_W / 2, 168, { scale: 1, color: '#cdbde8', align: 'center' });
    drawText(ctx, 'PULSA A PARA VOLVER', BASE_W / 2, 192, { scale: 1, color: '#fff3d6', align: 'center' });
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
    const hint = document.getElementById('bootHint');
    if (hint) hint.textContent = 'Pulsa o toca para empezar';
    if ('ontouchstart' in window) {
      const t = document.getElementById('touch'); if (t) t.classList.add('on');
    }
    function ready() {
      AUDIO.resume();
      if (boot) { boot.classList.add('hidden'); setTimeout(() => boot.remove(), 600); }
      window.removeEventListener('pointerdown', ready);
      window.removeEventListener('keydown', ready);
      window.removeEventListener('touchstart', ready);
    }
    window.addEventListener('pointerdown', ready);
    window.addEventListener('keydown', ready);
    window.addEventListener('touchstart', ready);
    requestAnimationFrame(frame);
  }
  Game.debugStep = update;
  Game.debugRender = render;
  init();
})();
