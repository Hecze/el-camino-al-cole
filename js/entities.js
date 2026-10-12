// entities.js — física (coyote time, salto variable, corner correction) y entidades.
const TS = TILE;

const PHYS = {
  GRAV: 0.50, GRAV_HOLD: 0.34, MAX_FALL: 6.6,
  RUN_ACCEL: 0.60, RUN_MAX: 2.30, FRICTION: 0.30, AIR_ACCEL: 0.45,
  JUMP_V: -7.3, JUMP_CUT: 3.0, COYOTE: 7,
  LLAMA_MAX: 3.2, LLAMA_JUMP: -7.5,
  GOAT_MAX: 2.6, GOAT_JUMP: -9.0,
};

function moveX(a, level) {
  a.wall = 0; a.x += a.vx;
  if (a.vx === 0) return;
  const top = Math.floor(a.y / TS), bot = Math.floor((a.y + a.h - 1) / TS);
  if (a.vx > 0) {
    const col = Math.floor((a.x + a.w - 1) / TS);
    for (let ty = top; ty <= bot; ty++) if (isSolidCode(level.tile(col, ty))) { a.x = col * TS - a.w; a.vx = 0; a.wall = 1; break; }
  } else {
    const col = Math.floor(a.x / TS);
    for (let ty = top; ty <= bot; ty++) if (isSolidCode(level.tile(col, ty))) { a.x = (col + 1) * TS; a.vx = 0; a.wall = -1; break; }
  }
}

function moveY(a, level) {
  a.hitCeil = false; a.onGround = false;
  const prevFeet = a.y + a.h;
  a.y += a.vy;
  const left = Math.floor(a.x / TS), right = Math.floor((a.x + a.w - 1) / TS);
  if (a.vy >= 0) {
    const feetRow = Math.floor((a.y + a.h) / TS);
    for (let tx = left; tx <= right; tx++) {
      const code = level.tile(tx, feetRow);
      if (isSolidCode(code)) { a.y = feetRow * TS - a.h; a.vy = 0; a.onGround = true; break; }
      if (isOnewayCode(code) && !a.dropThrough && prevFeet <= feetRow * TS + 0.5) {
        a.y = feetRow * TS - a.h; a.vy = 0; a.onGround = true; break;
      }
    }
  } else {
    const row = Math.floor(a.y / TS);
    const lS = isSolidCode(level.tile(left, row));
    const rS = right !== left && isSolidCode(level.tile(right, row));
    if (lS && rS) { a.y = (row + 1) * TS; a.vy = 0; a.hitCeil = true; }
    else if (lS || rS) {
      const col = lS ? left : right;
      const tileL = col * TS;
      const overlap = lS ? (Math.min(a.x + a.w, tileL + TS) - a.x) : ((a.x + a.w) - tileL);
      if (overlap <= 4) {
        a.x = lS ? tileL + TS : tileL - a.w;
        const l2 = Math.floor(a.x / TS), r2 = Math.floor((a.x + a.w - 1) / TS);
        if (isSolidCode(level.tile(l2, row)) || isSolidCode(level.tile(r2, row))) { a.y = (row + 1) * TS; a.vy = 0; a.hitCeil = true; }
      } else { a.y = (row + 1) * TS; a.vy = 0; a.hitCeil = true; }
    }
  }
}

const _flipCache = new WeakMap();
function flipS(s) { if (!s) return s; let f = _flipCache.get(s); if (!f) { f = PIX.flipped(s); _flipCache.set(s, f); } return f; }

class Actor {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.vx = 0; this.vy = 0; this.onGround = false; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  overlaps(o, pad = 0) { return this.x - pad < o.x + o.w && this.x + this.w + pad > o.x && this.y - pad < o.y + o.h && this.y + this.h + pad > o.y; }
  rectOverlaps(x, y, w, h) { return this.x < x + w && this.x + this.w > x && this.y < y + h && this.y + this.h > y; }
}

// ═════════════════════════════════════════════════════════════════════════════
class Player extends Actor {
  constructor(x, y) {
    super(x, y, 8, 15);
    this.facing = 1; this.coyote = 0; this.animT = 0;
    this.riding = null; this.mountCd = 0; this.lastMover = null;
    this.dropThrough = false; this.dropT = 0; this.surfT = 0; this.mudT = 0;
    this.won = false; this.invuln = 0;
  }
  get jumpHeld() { return Input.held('jump') || Input.held('up'); }

  update(g) {
    const level = g.level;
    if (this.won) { this.animT++; return; }
    if (this.mountCd > 0) this.mountCd--;
    if (this.invuln > 0) this.invuln--;

    // ── montado: la montura se mueve en su propio update ──
    if (this.riding) {
      const l = this.riding;
      if (l.canDismount && Input.pressed('down')) { this.dismount(g); return; }
      if (l instanceof Llama) {
        if (l.onGround) l.coyote = PHYS.COYOTE; else if (l.coyote > 0) l.coyote--;
        if (l.coyote > 0 && Input.consumeJump()) { l.vy = PHYS.LLAMA_JUMP; l.onGround = false; l.coyote = 0; g.onPlayerJump(l); }
      } else Input.clearJump();
      this.syncRide(); this.animT++;
      return;
    }

    let ax = 0;
    const left = Input.held('left'), right = Input.held('right');
    const accel = this.onGround ? PHYS.RUN_ACCEL : PHYS.AIR_ACCEL;
    if (left && !right) { ax = -accel; this.facing = -1; }
    else if (right && !left) { ax = accel; this.facing = 1; }
    if (ax !== 0) this.vx += ax; else this.vx *= (this.onGround ? 1 - PHYS.FRICTION : 0.985);
    this.vx = Math.max(-PHYS.RUN_MAX, Math.min(PHYS.RUN_MAX, this.vx));
    if (Math.abs(this.vx) < 0.05) this.vx = 0;

    if (this.onGround) this.coyote = PHYS.COYOTE; else if (this.coyote > 0) this.coyote--;
    if (this.coyote > 0 && Input.consumeJump()) {
      this.vy = PHYS.JUMP_V; this.onGround = false; this.coyote = 0;
      g.onPlayerJump(this);
    }
    if (!this.jumpHeld && this.vy < -PHYS.JUMP_CUT) this.vy = -PHYS.JUMP_CUT;
    const gv = (this.vy < 0 && this.jumpHeld) ? PHYS.GRAV_HOLD : PHYS.GRAV;
    this.vy = Math.min(this.vy + gv, PHYS.MAX_FALL);

    if (Input.held('down')) this.dropT = 6;
    this.dropThrough = this.dropT > 0;
    if (this.dropT > 0) this.dropT--;

    const wasGround = this.onGround;
    moveX(this, level);
    moveY(this, level);

    // plataformas móviles (troncos del huaico): nos llevan con la corriente
    let onMover = null;
    if (this.vy >= 0) for (const m of g.movers) {
      if (m.dead) continue;
      const reach = this.lastMover === m ? 10 : 6;
      if (this.x + this.w > m.x + 1 && this.x < m.x + m.w - 1 &&
          this.y + this.h >= m.y - 4 && this.y + this.h <= m.y + reach) {
        this.y = m.y - this.h; this.vy = 0; this.onGround = true; onMover = m; break;
      }
    }
    if (onMover) {
      const vx = this.vx; this.vx = onMover.dx; moveX(this, level); this.vx = this.wall ? 0 : vx;
      this.surfT = 6;
    }
    if (onMover && !this.lastMover) g.audio('land');
    else if (this.onGround && !wasGround && this.vy === 0) g.onPlayerLand(this);
    this.lastMover = onMover;
    if (this.surfT > 0) this.surfT--;

    this.checkLiquids(g);
    this.animT++;
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    const mx = level.cols * TS - this.w; if (this.x > mx) { this.x = mx; this.vx = 0; }
  }

  syncRide() {
    const l = this.riding; if (!l) return;
    this.facing = l.facing;
    this.x = l.x + (l.facing >= 0 ? l.seat.dx : l.w - l.seat.dx - this.w);
    this.y = l.y + l.seat.dy;
    this.vx = l.vx; this.vy = l.vy; this.onGround = l.onGround;
  }
  dismount(g, hop = -3.6) {
    const l = this.riding; if (!l) return;
    this.riding = null; l.rider = null;
    this.vy = hop; this.vx = l.facing * 1.2; this.x += l.facing * 10;
    this.mountCd = 50;
    g.audio('jump'); g.burst(this.cx, this.cy, 'dust', 6);
  }
  mount(l, g, silent) {
    if (this.riding) { const old = this.riding; old.rider = null; old.vx = 0; }
    this.riding = l; l.rider = this; l.facing = 1; this.syncRide();
    if (!silent) { g.audio(l instanceof Cabra ? 'bleat' : 'mount'); g.burst(l.cx, l.y, 'dust', 10); g.onMount(l); }
  }

  checkLiquids(g) {
    const level = g.level;
    const pts = [[this.x + 2, this.y + this.h - 2], [this.x + this.w - 2, this.y + this.h - 2], [this.cx, this.cy]];
    let inWater = false, inMud = false;
    for (const [px, py] of pts) {
      const k = liquidAt(level, px, py);
      if (k === 'water') inWater = true; else if (k === 'mud') inMud = true;
    }
    if (inWater) { g.playerEnvDeath('water'); return; }
    if (inMud) {
      // el lodo te traga: un instante para reaccionar y se acabó
      this.vx *= 0.5; this.vy = Math.min(this.vy, 0.7);
      if (this.mudT % 6 === 0) g.burst(this.cx, this.y + this.h, 'mud', 5);
      if (++this.mudT > 16) g.playerEnvDeath('mud');
    } else this.mudT = 0;
    if (this.y > level.rows * TS + 40) g.playerEnvDeath('fall');
  }

  draw(ctx, g) {
    if (this.riding) return;
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) return;
    let img;
    if (this.surfT > 0 && Math.abs(this.vx) < 0.3) img = P.surf;
    else if (!this.onGround) img = this.vy < 0 ? P.jump : P.fall;
    else if (Math.abs(this.vx) > 0.25) { const sp = Math.max(4, 9 - Math.abs(this.vx) * 2); img = P.run[Math.floor(this.animT / sp) % 4]; }
    else img = P.idle[0];
    if (this.mudT > 0) {
      // hundiéndose: recortamos los pies
      ctx.save(); ctx.beginPath(); ctx.rect(this.x - 8, this.y - 10, 24, 22 + 6 - this.mudT); ctx.clip();
    }
    ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 8), Math.round(this.y + this.h - 22 + (this.mudT > 0 ? this.mudT * 0.6 : 0)));
    if (this.mudT > 0) ctx.restore();
  }
  drawRider(ctx) {
    if (!this.riding) return;
    const img = this.riding.facing < 0 ? flipS(P.sit) : P.sit;
    ctx.drawImage(img, Math.round(this.cx - 8), Math.round(this.y + this.h - 22));
  }
}

// ── monturas ────────────────────────────────────────────────────────────────
class Mount extends Actor {
  constructor(x, y, w, h, seat) {
    super(x, y, w, h); this.facing = 1; this.rider = null; this.animT = 0; this.seat = seat;
    this.homeX = x; this.homeY = y; this.coyote = 0; this.retired = false; this.canDismount = true;
  }
  reset() { this.x = this.homeX; this.y = this.homeY; this.vx = 0; this.vy = 0; this.rider = null; this.facing = 1; }
  hazards(g) {
    const lv = g.level;
    for (const px of [this.x + 3, this.x + this.w - 3]) {
      const k = liquidAt(lv, px, this.y + this.h - 2);
      if (k) { if (this.rider) { g.playerEnvDeath(k); } else this.reset(); return; }
    }
    if (this.y > lv.rows * TS + 24) { if (this.rider) g.playerEnvDeath('fall'); else this.reset(); }
  }
}

class Llama extends Mount {
  constructor(x, y) { super(x + 2, y - 20, 20, 20, { dx: 2, dy: -3 }); }
  update(g) {
    this.animT++;
    if (this.rider) {
      const left = Input.held('left'), right = Input.held('right');
      if (left && !right) { this.vx -= 0.42; this.facing = -1; }
      else if (right && !left) { this.vx += 0.42; this.facing = 1; }
      else this.vx *= 0.84;
      this.vx = Math.max(-PHYS.LLAMA_MAX, Math.min(PHYS.LLAMA_MAX, this.vx));
      const held = Input.held('jump') || Input.held('up');
      if (!held && this.vy < -PHYS.JUMP_CUT) this.vy = -PHYS.JUMP_CUT;
      this.vy = Math.min(this.vy + (held && this.vy < 0 ? PHYS.GRAV_HOLD : PHYS.GRAV), PHYS.MAX_FALL);
    } else { this.vx *= 0.8; this.vy = Math.min(this.vy + PHYS.GRAV, PHYS.MAX_FALL); }
    const was = this.onGround;
    moveX(this, g.level); moveY(this, g.level);
    if (this.rider && this.onGround && !was) g.onPlayerLand(this);
    if (this.x < 0) this.x = 0;
    if (this.rider) this.rider.syncRide();
    this.hazards(g);
  }
  draw(ctx) {
    let img;
    if (!this.onGround) img = LL.jump;
    else if (Math.abs(this.vx) > 0.2) img = LL.run[Math.floor(this.animT / Math.max(3, 9 - Math.abs(this.vx) * 2)) % 4];
    else img = LL.idle[0];
    const bob = !this.rider && this.onGround && Math.floor(this.animT / 40) % 3 === 0 ? -1 : 0; // mastica
    ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 13 + (this.facing < 0 ? 3 : -3)), Math.round(this.y + this.h - 24 + bob));
  }
}

// Cabra montesa: rebota sola sin parar; el jugador solo la dirige.
class Cabra extends Mount {
  constructor(x, y) { super(x, y - 14, 18, 14, { dx: 4, dy: -10 }); this.canDismount = false; this.landT = 0; this.idleT = 0; }
  update(g) {
    this.animT++;
    if (this.landT > 0) this.landT--;
    if (this.rider) {
      const left = Input.held('left'), right = Input.held('right');
      if (left && !right) { this.vx -= 0.4; this.facing = -1; }
      else if (right && !left) { this.vx += 0.4; this.facing = 1; }
      else this.vx *= 0.9;
      this.vx = Math.max(-PHYS.GOAT_MAX, Math.min(PHYS.GOAT_MAX, this.vx));
      if (this.onGround) {
        if (g.level.goatEnd && this.cx > g.level.goatEnd * TS) {
          // llegó a la cumbre: la cabra se queda pastando
          this.retired = true; this.vx = 0; this.rider.dismount(g, -4.2); g.audio('bleat'); g.onGoatDone();
        } else { this.vy = PHYS.GOAT_JUMP; this.onGround = false; this.landT = 5; g.audio('boing'); g.burst(this.cx, this.y + this.h, 'dust', 5); }
      }
    } else {
      this.vx *= 0.8;
      if (this.onGround && ++this.idleT % 110 === 0 && !this.retired) this.vy = -3.2; // brinquito de espera
    }
    this.vy = Math.min(this.vy + PHYS.GRAV, PHYS.MAX_FALL);
    moveX(this, g.level); moveY(this, g.level);
    if (this.rider) this.rider.syncRide();
    this.hazards(g);
  }
  draw(ctx) {
    const img = !this.onGround ? (this.vy < 0 ? GOAT.jump : GOAT.stand) : (this.landT > 0 ? GOAT.land : GOAT.stand);
    ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 11 + (this.facing < 0 ? 2 : -2)), Math.round(this.y + this.h - 17));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Derrumbe: piedras que caen del cerro y ruedan cuesta abajo (hacia ti).
class Boulder extends Actor {
  constructor(x, y) { super(x - 6, y, 12, 12); this.rot = 0; }
  update(g) {
    this.vy = Math.min(this.vy + PHYS.GRAV, 7);
    const vy0 = this.vy;
    this.vx = -1.7;
    moveX(this, g.level);
    if (this.wall) { g.burst(this.cx, this.cy, 'rock', 12); this.dead = true; return; }
    moveY(this, g.level);
    if (this.onGround && vy0 > 2.5) {
      this.vy = -vy0 * 0.38;
      if (g.near(this.cx, 260)) { g.audio('rock'); g.shake(1.5, 6); }
      g.burst(this.cx, this.y + this.h, 'dust', 6);
    }
    this.rot += this.vx / 6;
    const k = liquidAt(g.level, this.cx, this.y + this.h - 2);
    if (k) { g.burst(this.cx, this.y + this.h, k === 'water' ? 'splash' : 'mud', 14); if (g.near(this.cx, 260)) g.audio('splash'); this.dead = true; }
    if (this.y > g.level.rows * TS) this.dead = true;
  }
  draw(ctx) {
    ctx.save(); ctx.translate(Math.round(this.cx), Math.round(this.cy));
    ctx.rotate(Math.round(this.rot * 4) / 4);
    ctx.drawImage(OBJ.boulder, -7, -7); ctx.restore();
  }
}
class Rockfall {
  constructor(x, y, interval) { this.x = x * TS + 8; this.y = y * TS; this.interval = interval || 130; this.t = 70; }
  onRespawn() { this.t = 90; }
  update(g) {
    if (Math.abs(g.player.cx - this.x) > 460) return;
    this.t--;
    // aviso: cae gravilla antes de la piedra
    if (this.t < 40 && this.t % 3 === 0) g.particles.push({ x: this.x + (Math.random() * 12 - 6), y: g.cam.y - 2, vx: 0, vy: 1.5, life: 60, max: 60, col: '#8a8296', size: 1, grav: 0.12 });
    if (this.t === 30 && g.near(this.x, 300)) g.audio('rumble');
    if (this.t <= 0) { this.t = this.interval; g.addEntity(new Boulder(this.x, this.y)); }
  }
  draw() {}
}

// ═════════════════════════════════════════════════════════════════════════════
// HUAICO: troncos y lajas bajan con el lodo, escalón a escalón.
class Huaico {
  constructor(def, level) {
    this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.interval = def.interval || 76; this.speed = def.speed || 0.85;
    this.level = level; this.t = this.interval; this.n = 0;
  }
  surfaceAt(x) {
    for (const l of this.level.liquids) if (l.kind === 'mud' && x >= l.x * TS && x < (l.x + l.w) * TS) return l.y * TS + 4;
    return null;
  }
  prefill(g) { for (let x = this.x1 - 34; x > this.x0 + 12; x -= this.interval * this.speed) this.spawn(g, x, true); }
  spawn(g, x, instant) {
    const d = new Debris(this.n++ % 3 === 2 ? 'slab' : 'log', x, this, instant);
    g.addEntity(d); g.movers.push(d);
  }
  update(g) { if (--this.t <= 0) { this.t = this.interval; this.spawn(g, this.x1 - 32, false); } }
  draw() {}
}
class Debris extends Actor {
  constructor(kind, x, hu, instant) {
    const w = kind === 'log' ? 28 : 18;
    super(x, 0, w, 6);
    this.kind = kind; this.hu = hu; this.isMover = true;
    this.dx = 0; this.dy = 0; this.t = Math.random() * 6; this.sinkT = 0;
    this.y = hu.surfaceAt(this.cx) - 4 + (instant ? 0 : 14);
  }
  update(g) {
    const px = this.x, py = this.y;
    this.t += 0.07;
    this.x -= this.hu.speed;
    const s = this.hu.surfaceAt(this.cx);
    if (s === null || this.cx < this.hu.x0 + 10 || this.sinkT > 0) {
      this.sinkT++; this.y += 0.45;
      if (this.sinkT > 40) this.dead = true;
    } else {
      const target = s - 4 - (Math.sin(this.t) > 0.4 ? 1 : 0);
      if (this.y < target - 1) {
        this.vy = Math.min(this.vy + 0.45, 6); this.y = Math.min(this.y + this.vy, target);
        if (this.y >= target) { this.vy = 0; g.burst(this.cx, s, 'mud', 10); if (g.near(this.cx, 220)) g.audio('mud'); }
      } else if (this.y > target) this.y = Math.max(target, this.y - 0.7); // emerge del lodo
      else { this.y = target; this.vy = 0; }
    }
    this.dx = this.x - px; this.dy = this.y - py;
  }
  draw(ctx, g) {
    const s = this.hu.surfaceAt(this.cx) || (this.y + 4);
    ctx.save(); ctx.beginPath(); ctx.rect(this.x - 6, this.y - 30, this.w + 12, s + 2 - (this.y - 30)); ctx.clip();
    const img = this.kind === 'log' ? OBJ.log : OBJ.slab;
    ctx.drawImage(img, Math.round(this.cx - img.width / 2), Math.round(this.y - 1));
    ctx.restore();
    // ola de proa: el lodo se arremolina delante
    ctx.fillStyle = '#e2c49a';
    const f = Math.floor(g.T / 5) % 2;
    ctx.fillRect(Math.round(this.x - 2 - f), Math.round(s), 2, 1);
    ctx.fillRect(Math.round(this.x + this.w + f), Math.round(s) + 1, 2, 1);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
class Pickup extends Actor {
  constructor(type, x, y) {
    super(x * TS + 3, y * TS + 5, 10, 11);
    this.type = type; this.animT = Math.random() * 10; this.baseY = this.y;
  }
  update(g) {
    this.animT += 0.1;
    const p = g.player;
    if (this.overlaps(p, 3) || (p.riding && this.overlaps(p.riding, 1))) this.collect(g);
  }
  collect(g) {
    this.dead = true;
    g.audio('page'); g.pages++; g.burst(this.cx, this.cy, 'paper', 16);
  }
  draw(ctx) {
    // la hoja aletea con el viento, apoyada en el suelo
    const tilt = Math.sin(this.animT * 1.4) > 0 ? 0 : 1;
    ctx.drawImage(OBJ.page, Math.round(this.cx - 5 + tilt), Math.round(this.y + this.h - 11));
  }
}

// Apacheta: montículo de piedras. Al pasar, el niño le ata una cinta: checkpoint.
class Apacheta extends Actor {
  constructor(x, y) { super(x * TS, y * TS - 12, 16, 12); this.on = false; this.animT = 0; this.spawn = { x: x * TS + 4, y: y * TS }; }
  update(g) {
    this.animT += 0.1;
    const p = g.player;
    if (!this.on && (p.overlaps(this, 2) || (p.riding && p.riding.overlaps(this)))) {
      this.on = true; g.setCheckpoint(this); g.audio('apacheta'); g.burst(this.cx, this.y, 'spark', 14);
    }
  }
  draw(ctx) {
    ctx.drawImage(T.apacheta, Math.round(this.x), Math.round(this.y));
    if (this.on) ctx.drawImage(T.ribbon[Math.floor(this.animT * 1.5) % 2], Math.round(this.x + 8), Math.round(this.y - 6));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EL COLEGIO: escuela rural andina — paredes encaladas con zócalo azul, techo de
// tejas, espadaña con campana y la bandera del Perú. Se entra por la puerta.
class School extends Actor {
  constructor(x, y) {
    const base = y * TS;
    super(x * TS - 60, base - 96, 120, 96);
    this.base = base; this.animT = 0; this.done = false; this.bell = 0;
    this.door = { x: x * TS - 10, y: base - 28, w: 20, h: 28 };
  }
  update(g) {
    this.animT += 0.1;
    if (this.bell > 0) this.bell--;
    const p = g.player;
    if (!this.done && p.rectOverlaps(this.door.x + 4, this.door.y, this.door.w - 8, this.door.h)) {
      this.done = true; this.bell = 200; p.won = true; g.gameComplete();
    }
  }
  near(g) { return Math.abs(g.player.cx - (this.x + 60)) < 90; }
  draw(ctx, g) {
    const bx = Math.round(this.x), base = this.base;
    const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(bx + x, base + y, w, h); };
    // sombra en el suelo
    R('rgba(40,20,10,0.25)', 2, -2, 118, 2);
    // muro encalado
    R('#f1e8d6', 6, -46, 108, 46);
    for (let y = -42; y < -12; y += 6) R('#e2d6bd', 6, y, 108, 1);
    // zócalo azul
    R('#3d6db3', 6, -12, 108, 12); R('#2b4f86', 6, -12, 108, 1); R('#2b4f86', 6, -1, 108, 1);
    // ventanas
    for (const wx of [14, 34, 74, 94]) {
      R('#2b4f86', wx - 1, -36, 14, 18); R('#9fd3f0', wx, -35, 12, 16);
      R('#d9f1ff', wx + 1, -34, 3, 1); R('#d9f1ff', wx + 1, -33, 1, 3);
      R('#2b4f86', wx + 5, -35, 2, 16); R('#2b4f86', wx, -28, 12, 1);
      R('#a06a30', wx - 2, -18, 16, 2);
      R('#d8432f', wx + 1, -20, 2, 2); R('#c2185b', wx + 5, -20, 2, 2); R('#d8432f', wx + 9, -20, 2, 2); // macetas con flores
    }
    // puerta (se abre cuando te acercas)
    const open = this.near(g) || this.done;
    R('#2b4f86', 49, -30, 22, 30);
    if (open) { R('#3a2412', 50, -29, 20, 29); R('#8a5a30', 50, -29, 4, 29); R('#8a5a30', 66, -29, 4, 29); R('#ffd88a', 56, -24, 8, 6); }
    else { R('#8a5a30', 50, -29, 20, 29); R('#6b4524', 59, -29, 2, 29); for (let y = -26; y < 0; y += 5) R('#6b4524', 50, y, 20, 1); R('#f6c94a', 56, -15, 2, 2); R('#f6c94a', 62, -15, 2, 2); }
    R('#bdb5c6', 46, -1, 28, 1);
    // letrero
    R('#2b4f86', 36, -45, 48, 11); R('#ffffff', 37, -44, 46, 9);
    drawText(ctx, 'COLEGIO', bx + 60, base - 43, { color: '#2b4f86', align: 'center' });
    // techo de tejas (dos aguas visto de frente)
    for (let i = 0; i < 18; i++) {
      const y = -64 + i, inset = Math.round((17 - i) * 0.7);
      R(i % 4 < 2 ? '#c4583a' : '#a3402a', -2 + inset, y, 124 - inset * 2, 1);
      if (i % 4 === 3) for (let x = -2 + inset + ((i >> 2) % 2) * 3; x < 122 - inset; x += 6) R('#7f2f1f', x, y, 2, 1);
    }
    R('#7f2f1f', -2, -47, 124, 1); R('rgba(0,0,0,0.18)', 6, -46, 108, 3);
    // espadaña con campana
    R('#f1e8d6', 50, -86, 20, 22); R('#e2d6bd', 50, -66, 20, 2);
    R('#f1e8d6', 54, -90, 12, 4); R('#f1e8d6', 58, -93, 4, 3);
    R('#4a3a52', 55, -82, 10, 12);
    const sw = this.bell > 0 ? Math.round(Math.sin(this.bell * 0.35) * 2) : 0;
    R('#2a1f2d', 59, -82, 2, 2);
    R('#e2b13c', 57 + sw, -80, 6, 6); R('#f6d36a', 58 + sw, -79, 2, 3); R('#9a6a18', 56 + sw, -75, 8, 1); R('#2a1f2d', 59 + sw * 2, -74, 2, 2);
    // bandera del Perú
    R('#d6d0e0', 128, -84, 1, 84); R('#f6c94a', 127, -86, 3, 2);
    for (let c = 0; c < 18; c++) {
      const wy = Math.round(Math.sin(this.animT * 1.4 - c * 0.45) * 1.2 * (c / 18));
      R(c < 6 || c >= 12 ? '#d91023' : '#ffffff', 129 + c, -82 + wy, 1, 12);
    }
  }
}

function makeEntity(def, level) {
  switch (def.type) {
    case 'llama': return new Llama(def.x * TS, def.y * TS);
    case 'cabra': return new Cabra(def.x * TS, def.y * TS);
    case 'rockfall': return new Rockfall(def.x, def.y, def.interval);
    case 'huaico': return new Huaico(def, level);
    case 'apacheta': return new Apacheta(def.x, def.y);
    case 'school': return new School(def.x, def.y);
    case 'page': return new Pickup('page', def.x, def.y);
    default: return null;
  }
}
