// entities.js — física (coyote time, salto variable, corner correction) y entidades.
const TS = TILE;

// Curva de salto más "flotante": menos gravedad, caída más suave.
const PHYS = {
  GRAV: 0.50, GRAV_HOLD: 0.34, MAX_FALL: 6.6,
  RUN_ACCEL: 0.60, RUN_MAX: 2.30, FRICTION: 0.30, AIR_ACCEL: 0.45,
  JUMP_V: -7.3, JUMP_CUT: 3.0, COYOTE: 7,
};

function solidTileAt(level, px, py) { return isSolidCode(level.tile(Math.floor(px / TS), Math.floor(py / TS))); }

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
    // uso la fila donde caen los PIES (no la de arriba) para no atravesar plataformas
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
    this.hearts = 3; this.maxHearts = 3; this.invuln = 0; this.hurtT = 0;
    this.riding = null; this.dead = false; this.deadT = 0;
    this.dropThrough = false; this.dropT = 0; this.surfT = 0; this.mudT = 0;
    this.surfing = false; this.won = false;
  }
  get hitboxSmall() { return { x: this.x + 1, y: this.y + 1, w: this.w - 2, h: this.h - 2 }; }
  get jumpHeld() { return Input.held('jump') || Input.held('up'); }

  update(g) {
    const level = g.level;
    if (this.dead) { this.deadT++; this.vy = Math.min(this.vy + 0.4, 7); this.y += this.vy; return; }
    if (this.won) { this.animT++; return; }
    if (this.invuln > 0) this.invuln--;
    if (this.hurtT > 0) this.hurtT--;

    // ── montado ──
    if (this.riding) {
      const l = this.riding;
      if (Input.pressed('down')) { this.dismount(g); return; }
      if (!l.autoJump && Input.consumeJump() && l.onGround) { l.vy = PHYS.JUMP_V; l.onGround = false; g.onPlayerJump(this); }
      this.syncRide();
      this.animT++;
      return;
    }

    let ax = 0;
    const left = Input.held('left'), right = Input.held('right');
    const accel = this.onGround ? PHYS.RUN_ACCEL : PHYS.AIR_ACCEL;
    if (left && !right) { ax = -accel; this.facing = -1; }
    else if (right && !left) { ax = accel; this.facing = 1; }
    if (ax !== 0) this.vx += ax; else this.vx *= (this.onGround ? 1 - PHYS.FRICTION : 0.985);
    if (this.vx > PHYS.RUN_MAX) this.vx = PHYS.RUN_MAX;
    if (this.vx < -PHYS.RUN_MAX) this.vx = -PHYS.RUN_MAX;
    if (Math.abs(this.vx) < 0.05) this.vx = 0;

    if (this.onGround) this.coyote = PHYS.COYOTE; else if (this.coyote > 0) this.coyote--;

    if (Input.consumeJump() && this.coyote > 0) {
      this.vy = PHYS.JUMP_V; this.onGround = false; this.coyote = 0;
      g.onPlayerJump(this);
    }
    if (!this.jumpHeld && this.vy < -PHYS.JUMP_CUT) this.vy = -PHYS.JUMP_CUT;
    const gv = (this.vy < 0 && this.jumpHeld) ? PHYS.GRAV_HOLD : PHYS.GRAV;
    this.vy = Math.min(this.vy + gv, PHYS.MAX_FALL);

    if (Input.held('down')) this.dropT = 6;
    this.dropThrough = this.dropT > 0;
    if (this.dropT > 0) this.dropT--;

    if (level.wind) for (const w of level.wind) {
      if (this.rectOverlaps(w.x * TS, w.y * TS, w.w * TS, w.h * TS)) { this.vx += w.ax; this.vy += w.ay; }
    }
    if (level.huayco) {
      const hu = level.huayco;
      const x0 = Math.min(hu.x0, hu.x1) * TS - 20, x1 = Math.max(hu.x0, hu.x1) * TS + 20;
      if (this.x > x0 && this.x < x1) this.vx -= 0.06;
    }

    moveX(this, level);
    moveY(this, level);

    let onMover = null;
    for (const m of g.movers) {
      if (this.vy >= 0 && this.x + this.w > m.x - 1 && this.x < m.x + m.w + 1 &&
          this.y + this.h >= m.y - 3 && this.y + this.h <= m.y + 7) {
        this.y = m.y - this.h; this.vy = 0; this.onGround = true; onMover = m;
      }
    }
    if (onMover) {
      this.x += onMover.dx; if (onMover.dy) this.y += onMover.dy;
      if (onMover.isSurfRock) { this.surfing = true; this.surfT = 8; }
    }
    if (this.surfT > 0) { this.surfing = true; this.surfT--; }

    this.checkLiquids(g);
    this.animT++;
    if (this.x < 0) { this.x = 0; this.vx = 0; }
    const mx = level.cols * TS - this.w; if (this.x > mx) { this.x = mx; this.vx = 0; }
  }

  syncRide() {
    const l = this.riding; if (!l) return;
    const off = l.facing >= 0 ? l.seat.dx : (l.w - l.seat.dx - this.w);
    this.x = l.x + off;
    this.y = l.y + l.seat.dy;
    this.vx = l.vx; this.vy = l.vy;
  }
  dismount(g) {
    const l = this.riding; if (!l) return;
    this.riding = null; l.rider = null;
    this.vy = -3.4; this.x += l.facing * 10;
    g.audio('jump'); g.burst(this.cx, this.cy, 'dust', 6);
  }
  mount(l, g) {
    this.riding = l; l.rider = this; this.syncRide();
    g.audio('mount'); g.burst(l.cx, l.y, 'dust', 10);
  }

  checkLiquids(g) {
    const level = g.level;
    const pts = [[this.x + 2, this.y + this.h - 2], [this.x + this.w - 2, this.y + this.h - 2], [this.cx, this.cy]];
    let inWater = false, inMud = false;
    for (const [px, py] of pts) {
      const k = liquidKind(level.tile(Math.floor(px / TS), Math.floor(py / TS)));
      if (k === 'water') inWater = true; else if (k === 'mud') inMud = true;
      if (isHazardCode(level.tile(Math.floor(px / TS), Math.floor(py / TS)))) { this.hurt(g, 0); return; }
    }
    if (inWater) { g.playerEnvDeath('water'); return; }
    if (inMud) {
      this.vx *= 0.6; this.vy = Math.min(this.vy, 3.0); this.vx -= 0.25;
      this.mudT++;
      if (this.mudT % 12 === 0) { g.audio('mud'); g.burst(this.cx, this.y + this.h, 'mud', 5); }
    } else this.mudT = 0;
    if (this.y > level.rows * TS + 40) g.playerEnvDeath('fall');
  }

  hurt(g, dir) {
    if (this.invuln > 0 || this.dead) return;
    this.hearts--; this.invuln = 90; this.hurtT = 24;
    this.vy = -3.4; this.vx = (dir || (this.facing * -1)) * 2.4;
    g.audio('hurt'); g.shake(3, 8); g.burst(this.cx, this.cy, 'spark', 10);
    if (this.hearts <= 0) g.playerDeath();
  }

  draw(ctx, g) {
    if (this.riding) return;
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0 && !this.dead) return;
    let frames, speed = 6;
    if (this.dead || this.hurtT > 0) frames = [P.hurt];
    else if (this.surfing) frames = [P.surf];
    else if (!this.onGround) frames = [this.vy < 0 ? P.jump : P.fall];
    else if (Math.abs(this.vx) > 0.25) { frames = P.run; speed = Math.max(4, 9 - Math.abs(this.vx) * 2); }
    else frames = P.idle;
    const idx = Math.floor(this.animT / speed) % frames.length;
    let img = frames[idx];
    if (this.facing < 0) img = flipS(img);
    ctx.drawImage(img, Math.round(this.x - 3), Math.round(this.y - 5));
  }
  drawRider(ctx) {
    if (!this.riding) return;
    let img = P.sit;
    if (this.riding.facing < 0) img = flipS(img);
    ctx.drawImage(img, Math.round(this.x - 3), Math.round(this.y - 5));
  }
}

// ── monturas ────────────────────────────────────────────────────────────────
class Mount extends Actor {
  constructor(x, y, w, h, seat) { super(x, y, w, h); this.facing = 1; this.rider = null; this.animT = 0; this.seat = seat; this.autoJump = false; }
}

class Llama extends Mount {
  constructor(x, y) { super(x + 2, y - 18, 20, 18, { dx: 5, dy: -8 }); this.homeX = this.x; this.homeY = this.y; }
  update(g) {
    this.animT++;
    if (this.rider) {
      const left = Input.held('left'), right = Input.held('right');
      const maxS = PHYS.RUN_MAX * 1.4;
      if (left && !right) { this.vx -= 0.4; this.facing = -1; }
      else if (right && !left) { this.vx += 0.4; this.facing = 1; }
      else this.vx *= 0.82;
      if (this.vx > maxS) this.vx = maxS; if (this.vx < -maxS) this.vx = -maxS;
    } else this.vx *= 0.8;
    this.vy = Math.min(this.vy + PHYS.GRAV, PHYS.MAX_FALL);
    moveX(this, g.level); moveY(this, g.level);
    if (this.x < 0) this.x = 0; const mx = g.level.cols * TS - this.w; if (this.x > mx) this.x = mx;
    if (this.rider) this.rider.syncRide();
    if (this.y > g.level.rows * TS + 60) { this.x = this.homeX; this.y = this.homeY; this.vx = 0; this.vy = 0; if (this.rider) this.rider.syncRide(); }
  }
  draw(ctx) {
    const moving = Math.abs(this.vx) > 0.2;
    const frames = moving ? LL.run : LL.idle;
    const speed = moving ? Math.max(4, 11 - Math.abs(this.vx) * 3) : 16;
    let img = frames[Math.floor(this.animT / speed) % frames.length];
    if (this.facing < 0) img = flipS(img);
    ctx.drawImage(img, Math.round(this.x - 2), Math.round(this.y - 1));
  }
}

// Cabra montesa: auto-corre y auto-salta en las montañas.
class Cabra extends Mount {
  constructor(x, y) { super(x + 2, y - 14, 18, 14, { dx: 4, dy: -7 }); this.homeX = this.x; this.homeY = this.y; this.autoJump = true; this.jumpCd = 0; }
  update(g) {
    this.animT++;
    if (this.rider) {
      this.vx = 2.4; this.facing = 1;
      if (this.onGround && this.jumpCd <= 0) {
        const aheadX = this.x + this.w + 7;
        const feetRow = Math.floor((this.y + this.h + 1) / TS);
        const col = Math.floor(aheadX / TS);
        const groundAhead = isSolidCode(g.level.tile(col, feetRow));
        const wallAhead = isSolidCode(g.level.tile(col, feetRow - 1)) || isSolidCode(g.level.tile(col, feetRow - 2));
        if ((!groundAhead && wallAhead) || !groundAhead || (wallAhead && groundAhead)) {
          this.vy = PHYS.JUMP_V * 1.02; this.jumpCd = 12; g.onPlayerJump(this);
        }
      }
      if ((Input.pressed('jump') || Input.pressed('up')) && this.onGround && this.jumpCd <= 0) { this.vy = PHYS.JUMP_V * 1.06; this.jumpCd = 12; g.onPlayerJump(this); }
      if (this.jumpCd > 0) this.jumpCd--;
      if (Input.pressed('down')) this.rider.dismount(g);
    } else this.vx *= 0.85;
    this.vy = Math.min(this.vy + PHYS.GRAV, PHYS.MAX_FALL);
    moveX(this, g.level); moveY(this, g.level);
    if (this.x < 0) this.x = 0; const mx = g.level.cols * TS - this.w; if (this.x > mx) this.x = mx;
    if (this.rider) this.rider.syncRide();
    if (this.y > g.level.rows * TS + 80) { this.x = this.homeX; this.y = this.homeY; this.vx = 0; this.vy = 0; if (this.rider) this.rider.syncRide(); }
  }
  draw(ctx) {
    let img = GOAT[Math.floor(this.animT / 6) % GOAT.length];
    if (this.facing < 0) img = flipS(img);
    ctx.drawImage(img, Math.round(this.x - 3), Math.round(this.y - 1));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
class Cuy extends Actor {
  constructor(x, y, dir) { super(x + 3, y - 10, 10, 8); this.dir = dir || 1; this.animT = 0; this.alive = true; this.squish = 0; }
  update(g) {
    if (this.squish > 0) { this.squish--; if (this.squish === 0) this.alive = false; return; }
    this.vy = Math.min(this.vy + PHYS.GRAV, PHYS.MAX_FALL);
    this.vx = this.dir * 0.6;
    const before = this.vx;
    moveX(this, g.level);
    if (this.vx === 0 && before !== 0) this.dir *= -1;
    moveY(this, g.level);
    if (this.onGround) {
      const aheadX = this.dir > 0 ? this.x + this.w + 2 : this.x - 2;
      if (!solidTileAt(g.level, aheadX, this.y + this.h + 2)) this.dir *= -1;
    }
    this.animT++;
    if (this.y > g.level.rows * TS + 60) this.alive = false;
  }
  stomp(g) { this.squish = 12; g.audio('stomp'); g.burst(this.cx, this.y + this.h, 'dust', 8); g.addScore(100); }
  draw(ctx) {
    let img = E.cuy[Math.floor(this.animT / 9) % 2];
    if (this.dir < 0) img = flipS(img);
    ctx.save();
    if (this.squish > 0) { ctx.translate(this.cx, this.y + this.h); ctx.scale(1, 0.4); ctx.translate(-this.cx, -(this.y + this.h)); }
    ctx.drawImage(img, Math.round(this.cx - 8), Math.round(this.y + this.h - 12));
    ctx.restore();
  }
}

class Condor extends Actor {
  constructor(x, y, span) { super(x, y, 12, 8); this.home = { x, y }; this.span = (span || 4) * TS; this.t = Math.random() * 6; this.alive = true; this.dir = 1; this.animT = 0; }
  update() {
    if (!this.alive) return;
    this.t += 0.02;
    this.x = this.home.x + Math.sin(this.t) * this.span;
    this.y = this.home.y + Math.sin(this.t * 1.6) * 6;
    this.dir = Math.cos(this.t) >= 0 ? 1 : -1;
    this.animT++;
  }
  stomp(g) { this.alive = false; g.audio('stomp'); g.burst(this.cx, this.cy, 'feather', 10); g.addScore(150); }
  draw(ctx) {
    const img0 = E.condor[Math.floor(this.animT / 6) % 2];
    const img = this.dir < 0 ? flipS(img0) : img0;
    ctx.drawImage(img, Math.round(this.cx - 10), Math.round(this.cy - 7));
  }
}

class SurfRock extends Actor {
  constructor(path, speed) {
    super(path[0][0] * TS, path[0][1] * TS, 16, 8);
    this.path = path.map(p => ({ x: p[0] * TS + 8, y: p[1] * TS + 4 }));
    this.speed = speed || 0.02; this.t = Math.random(); this.isSurfRock = true;
    this.dx = 0; this.dy = 0; this.spin = 0;
  }
  update() {
    this.t += this.speed;
    let u = this.t % 2; if (u > 1) u = 2 - u;
    const seg = this.path.length - 1;
    const f = u * seg;
    const i = Math.min(Math.floor(f), seg - 1);
    const a = this.path[i], b = this.path[i + 1];
    const lf = f - i;
    const nx = a.x + (b.x - a.x) * lf, ny = a.y + (b.y - a.y) * lf;
    this.dx = nx - this.cx; this.dy = ny - this.cy;
    this.x = nx - this.w / 2; this.y = ny - this.h / 2;
    this.spin += 0.18;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.cx), Math.round(this.cy));
    ctx.rotate(Math.sin(this.spin) * 0.1);
    ctx.drawImage(T.rock, -8, -8);
    ctx.restore();
  }
}

class Pickup extends Actor {
  constructor(type, x, y) {
    super(x * TS + 4, y * TS + 4, 8, 8);
    this.type = type; this.animT = Math.random() * 10; this.baseY = this.y; this.taken = false;
  }
  update(g) {
    this.animT += 0.12;
    this.y = this.baseY + Math.sin(this.animT) * 1.6;
    if (!this.taken && this.overlaps(g.player, 3)) this.collect(g);
  }
  collect(g) {
    this.taken = true; this.dead = true;
    if (this.type === 'coin') { g.audio('coin'); g.addScore(50); g.coins++; g.burst(this.cx, this.cy, 'spark', 6); }
    else if (this.type === 'heart') { g.audio('gem'); g.player.hearts = Math.min(g.player.maxHearts, g.player.hearts + 1); g.burst(this.cx, this.cy, 'heart', 8); }
    else { g.audio('gem'); g.addScore(500); g.gems++; g.burst(this.cx, this.cy, 'spark', 14); }
  }
  draw(ctx) {
    let img;
    if (this.type === 'coin') img = OBJ.coin[Math.floor(this.animT) % 4];
    else if (this.type === 'heart') img = OBJ.heart;
    else img = OBJ.gem;
    ctx.drawImage(img, Math.round(this.cx - 4), Math.round(this.cy - 4));
  }
}

class Checkpoint extends Actor {
  constructor(x, y) { super(x * TS + 4, y * TS - 20, 8, 22); this.on = false; this.animT = 0; this.spawn = { x: x * TS, y: y * TS }; }
  update(g) {
    this.animT += 0.1;
    if (!this.on && g.player.overlaps(this, -2)) { this.on = true; g.setCheckpoint(this); g.audio('checkpoint'); g.burst(this.cx, this.y, 'spark', 12); }
  }
  draw(ctx) {
    ctx.drawImage(T.flagPole, Math.round(this.x - 4), Math.round(this.y));
    if (this.on) { const wave = Math.sin(this.animT * 2) * 1; ctx.drawImage(T.wiphala, Math.round(this.x - 1), Math.round(this.y + 2 + wave)); }
    else { ctx.save(); ctx.globalAlpha = 0.45; ctx.drawImage(T.wiphala, Math.round(this.x - 1), Math.round(this.y + 14)); ctx.restore(); }
  }
}

class Goal extends Actor {
  constructor(x, y, name) { const base = y * TS; super(x * TS + 4, base - 40, 10, 40); this.base = base; this.name = name || 'META'; this.animT = 0; this.done = false; }
  update(g) { this.animT += 0.1; if (!this.done && g.player.overlaps(this, -4)) { this.done = true; g.levelComplete(); } }
  draw(ctx) {
    ctx.drawImage(T.flagPole, Math.round(this.x - 4), Math.round(this.base - 24));
    ctx.drawImage(T.flagPole, Math.round(this.x - 4), Math.round(this.base - 40));
    for (let i = 0; i < 3; i++) { const wave = Math.sin(this.animT * 2 + i) * 1.2; ctx.drawImage(T.wiphala, Math.round(this.x - 1 + (i % 2)), Math.round(this.base - 38 + i * 8 + wave)); }
    drawText(ctx, this.name, this.x + 4, this.base - 52, { scale: 1, color: '#fff8e0', align: 'center', shadow: true, shadowColor: '#00000088' });
  }
}

class School extends Actor {
  constructor(x, y, name) { const base = y * TS; super(x * TS - 44, base - 64, 88, 64); this.base = base; this.animT = 0; this.done = false; this.name = name; }
  update(g) { this.animT += 0.1; if (!this.done && g.player.overlaps(this, -4)) { this.done = true; g.gameComplete(); } }
  draw(ctx) {
    const bx = Math.round(this.x), by = Math.round(this.base - 48);
    ctx.drawImage(T.adobe, bx, by, 88, 48);
    for (let i = 0; i < 6; i++) ctx.drawImage(T.brick, bx - 4 + i * 16, by - 12, 16, 16);
    ctx.drawImage(T.door, Math.round(this.cx - 8), by + 36, 16, 24);
    ctx.fillStyle = '#9bd3f0'; ctx.fillRect(bx + 8, by + 16, 12, 12); ctx.fillRect(bx + 68, by + 16, 12, 12);
    ctx.strokeStyle = '#754a2a'; ctx.strokeRect(bx + 8.5, by + 15.5, 13, 13); ctx.strokeRect(bx + 67.5, by + 15.5, 13, 13);
    ctx.drawImage(T.flagPole, bx + 86, by - 32);
    const wave = Math.sin(this.animT * 2) * 1.5;
    ctx.drawImage(T.wiphala, bx + 89, by - 30 + wave);
    drawText(ctx, 'EL COLEGIO', this.cx, by - 22, { scale: 1, color: '#fff8e0', align: 'center', shadow: true });
  }
}

class SpikeRow extends Actor {
  constructor(x, y, n) { super(x * TS, y * TS, n * TS, TS); this.hazard = true; }
  update() {}
  draw(ctx) { for (let i = 0; i < this.w / TS; i++) ctx.drawImage(T.spike, Math.round(this.x + i * TS), Math.round(this.y)); }
}

function makeEntity(def) {
  switch (def.type) {
    case 'cuy': return new Cuy(def.x * TS, def.y * TS, def.dir);
    case 'condor': return new Condor(def.x * TS, def.y * TS, def.span);
    case 'llama': return new Llama(def.x * TS, def.y * TS);
    case 'cabra': return new Cabra(def.x * TS, def.y * TS);
    case 'surfRock': return new SurfRock(def.path, def.speed);
    case 'checkpoint': return new Checkpoint(def.x, def.y);
    case 'goal': return new Goal(def.x, def.y, def.name);
    case 'school': return new School(def.x, def.y, def.name);
    case 'spikeRow': return new SpikeRow(def.x, def.y, def.n);
    case 'coin': return new Pickup('coin', def.x, def.y);
    case 'heart': return new Pickup('heart', def.x, def.y);
    case 'gem': return new Pickup('gem', def.x, def.y);
    default: return null;
  }
}
