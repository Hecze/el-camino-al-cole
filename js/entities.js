// entities.js — física (coyote time, salto variable, corner correction) y entidades.
const TS = TILE;

const PHYS = {
  GRAV: 0.50, GRAV_HOLD: 0.34, MAX_FALL: 6.6,
  RUN_ACCEL: 0.60, RUN_MAX: 2.30, FRICTION: 0.30, AIR_ACCEL: 0.45,
  JUMP_V: -7.3, JUMP_CUT: 3.0, COYOTE: 7,
  LLAMA_MAX: 3.2, LLAMA_JUMP: -7.5,
  // cabra: rebote algo más alto y más lento (sube ~93 px, 1,45 salientes)
  GOAT_MAX: 2.6, GOAT_JUMP: -8.4, GOAT_GRAV: 0.38, GOAT_FALL: 5.2,
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

// si un actor acabó dentro de roca sólida, lo subimos hasta un hueco libre
function unstick(a, level) {
  const solidAt = () => {
    for (let ty = Math.floor(a.y / TS); ty <= Math.floor((a.y + a.h - 1) / TS); ty++)
      for (let tx = Math.floor(a.x / TS); tx <= Math.floor((a.x + a.w - 1) / TS); tx++) if (isSolidCode(level.tile(tx, ty))) return true;
    return false;
  };
  for (let i = 0; i < 80 && solidAt(); i++) a.y -= 1;
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
    this.dropThrough = false; this.dropT = 0; this.surfT = 0; this.stickT = 0;
    this.dragged = false; this.dragT = 0; this.overEdge = false;
    this.gliding = false; this.glideAir = 0;
    this.won = false; this.invuln = 0;
  }
  get jumpHeld() { return Input.held('jump') || Input.held('up'); }

  update(g) {
    const level = g.level;
    if (this.won) { this.animT++; return; }
    if (this.mountCd > 0) this.mountCd--;
    if (this.dragged) { this.updateDragged(g); return; }
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
    if (this.gliding && !this.onGround && this.vy > 0) {
      // planeando: caída lenta; abajo = picar más rápido, salto = frenar
      const target = Input.held('down') ? 2.8 : (this.jumpHeld ? 0.7 : 1.3);
      this.vy += (target - this.vy) * 0.12;
      this.vx = Math.max(-2.0, Math.min(2.0, this.vx));
      const G = level.glide;
      if (G) { if (this.x < G.x0 * TS) { this.x = G.x0 * TS; this.vx = Math.max(0, this.vx); } if (this.x > G.x1 * TS) { this.x = G.x1 * TS; this.vx = Math.min(0, this.vx); } }
    } else {
      const gv = (this.vy < 0 && this.jumpHeld) ? PHYS.GRAV_HOLD : PHYS.GRAV;
      this.vy = Math.min(this.vy + gv, PHYS.MAX_FALL);
    }

    if (Input.held('down')) this.dropT = 6;
    this.dropThrough = this.dropT > 0;
    if (this.dropT > 0) this.dropT--;

    const wasGround = this.onGround;
    moveX(this, level);
    moveY(this, level);

    // plataformas móviles (troncos del huaico): nos llevan con la corriente
    // Plataformas móviles (troncos del huaico): nos llevan con la corriente.
    // Ayudas invisibles: el borde perdona unos píxeles (más si ya estabas
    // encima), y al aterrizar se frena el impulso y el tronco te "atrae" hacia
    // su centro durante un instante, para no resbalar al lodo.
    // si ya pisas suelo firme (una roca, la orilla), los troncos que pasan
    // por detrás no te enganchan ni te arrastran
    const onSolid = this.onGround;
    let onMover = null;
    if (this.vy >= 0 && !onSolid) for (const m of g.movers) {
      if (m.dead || m.falling) continue;
      const on = this.lastMover === m, grace = on ? 7 : 4;
      if (this.x + this.w > m.x - grace && this.x < m.x + m.w + grace &&
          this.y + this.h >= m.y - 5 && this.y + this.h <= m.y + (on ? 12 : 8)) {
        this.y = m.y - this.h; this.vy = 0; this.onGround = true; onMover = m; break;
      }
    }
    if (onMover && onMover !== this.lastMover) { this.vx *= 0.25; this.stickT = 18; g.audio('land'); g.burst(this.cx, this.y + this.h, 'mud', 3); }
    if (onMover) {
      if (this.stickT > 0) {
        this.stickT--;
        const pad = 6, l = onMover.x + pad, r = onMover.x + onMover.w - pad;
        if (!Input.held('left') && !Input.held('right')) {
          if (this.cx < l) this.x += Math.min(1.2, l - this.cx);
          else if (this.cx > r) this.x -= Math.min(1.2, this.cx - r);
          this.vx *= 0.6;
        }
      }
      const vx = this.vx; this.vx = onMover.dx; moveX(this, level); this.vx = this.wall ? 0 : vx;
      this.surfT = 6;
    }
    if (!onMover && this.onGround && !wasGround && this.vy === 0) g.onPlayerLand(this);
    this.lastMover = onMover;
    if (this.surfT > 0) this.surfT--;

    // al aterrizar después de planear, se suelta la hoja
    if (this.gliding) {
      if (!this.onGround) this.glideAir++;
      else if (this.glideAir > 40) { this.gliding = false; g.addEntity(new FallingLeaf(this.cx, this.y - 14, this.facing)); g.audio('land'); }
      else this.glideAir = 0;
    }
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
    if (inMud && g.huaico) {
      // el huaico te atrapa y te arrastra hacia el precipicio
      this.dragged = true; this.dragT = 0; this.overEdge = false; this.vx = 0; this.vy = 0; this.struggle = 0; this.hop = 0;
      g.audio('splash'); g.burst(this.cx, this.y + this.h, 'mud', 14); g.shake(2, 8);
      return;
    }
    if (this.y > Math.max(level.rows * TS + 40, 0) || this.y > g.cam.y + 216 + 80) g.playerEnvDeath('fall');
  }

  updateDragged(g) {
    const hu = g.huaico;
    this.dragT++; this.animT++;
    if (this.overEdge) {
      // cayendo por el precipicio
      this.vy = Math.min(this.vy + 0.35, 7); this.y += this.vy; this.x -= 0.5;
      if (this.dragT > 50) g.playerEnvDeath('fall');
      return;
    }
    const s = hu.surfaceAt(this.cx);
    if (s === null) { this.overEdge = true; this.dragT = 0; this.vy = -1.5; g.audio('fall'); return; }
    // la corriente arrastra (un poco más rápido que los troncos); puedes bracear algo
    let swim = 0;
    if (Input.held('right')) swim = 0.12; else if (Input.held('left')) swim = -0.12;
    // vas a la misma velocidad que los troncos: no los adelantas por debajo
    this.x += -hu.speed * 1.15 + swim;
    const target = s - this.h + 6 + (Math.floor(this.dragT / 10) % 2);
    if (this.y < target) { this.vy = Math.min(this.vy + 0.4, 5); this.y = Math.min(target, this.y + this.vy); }
    else { this.y = target; this.vy = 0; }
    if (this.dragT % 9 === 0) g.burst(this.cx, s, 'mud', 3);
    // FORCEJEO: cada pulsación es un saltito con salpicadura; si pulsas seguido
    // el impulso se acumula y al llenarse sales de un brinco. Si paras, se pierde.
    this.struggle = Math.max(0, this.struggle - 0.05);
    if (this.hop > 0) this.hop--;
    if (Input.consumeJump()) {
      this.struggle += 1; this.hop = 8;
      const k = this.struggle / 8;
      g.burst(this.cx, s - 2, 'foam', 5 + Math.round(k * 12)); g.burst(this.cx, s - 2, 'mud', 3);
      g.audio('mud');
      if (this.struggle >= 8) {
        this.dragged = false; this.y = s - this.h - 6; this.vy = -6.8; this.vx = 0.9; this.struggle = 0;
        unstick(this, g.level);
        g.audio('jump'); g.burst(this.cx, s, 'foam', 24); g.burst(this.cx, s, 'mud', 10); g.shake(1.5, 6);
      }
    }
  }

  draw(ctx, g) {
    if (this.riding) return;
    if (this.dragged) {
      const s = this.overEdge ? 99999 : (g.huaico.surfaceAt(this.cx) || 99999);
      ctx.save(); ctx.beginPath(); ctx.rect(this.x - 10, this.y - 30, 28, s + 1 - (this.y - 30)); ctx.clip();
      const img = P.jump, jx = Math.floor(this.dragT / 6) % 2;
      // saltito al forcejear: más alto cuanto más impulso llevas
      const lift = this.hop > 0 ? Math.round(Math.sin(this.hop / 8 * Math.PI) * (3 + this.struggle * 1.2)) : 0;
      ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 8 + jx), Math.round(this.y + this.h - 22 - lift));
      ctx.restore();
      return;
    }
    if (this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 0) return;
    let img;
    if (this.surfT > 0 && Math.abs(this.vx) < 0.3) img = P.surf;
    else if (!this.onGround) img = this.vy < 0 ? P.jump : P.fall;
    else if (Math.abs(this.vx) > 0.25) { const sp = Math.max(4, 9 - Math.abs(this.vx) * 2); img = P.run[Math.floor(this.animT / sp) % 4]; }
    else img = P.idle[0];
    const flying = this.gliding && !this.onGround && this.vy > 0;
    if (flying) img = P.jump;
    ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 8), Math.round(this.y + this.h - 22));
    if (this.gliding) {
      // la hoja sobre la cabeza; en vuelo se inclina hacia donde vas
      const lx = Math.round(this.cx - 16 + (flying ? Math.max(-3, Math.min(3, this.vx * 2)) : 0));
      const ly = Math.round(this.y - (flying ? 20 : 12) + (flying ? Math.sin(this.animT * 0.15) : 0));
      ctx.fillStyle = '#3a2a18';
      if (flying) { ctx.fillRect(Math.round(this.cx - 5), ly + 7, 1, Math.round(this.y) - ly - 3); ctx.fillRect(Math.round(this.cx + 4), ly + 7, 1, Math.round(this.y) - ly - 3); }
      ctx.drawImage(this.facing < 0 ? flipS(OBJ.leaf) : OBJ.leaf, lx, ly);
    }
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
    if (this.y > lv.rows * TS + 24 || (this.rider && this.y > g.cam.y + 216 + 60)) { if (this.rider) g.playerEnvDeath('fall'); else this.reset(); }
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
  constructor(x, y) { super(x, y - 15, 20, 15, { dx: 5, dy: -10 }); this.canDismount = false; this.landT = 0; this.idleT = 0; this.boost = 0; }
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
        // llegó a la cumbre (no basta con la columna: también hay que estar arriba)
        if (g.level.goatEnd && this.cx > g.level.goatEnd * TS && this.y + this.h <= (g.level.goatEndRow || 999) * TS + 2) {
          // llegó a la cumbre: la cabra se queda pastando
          this.retired = true; this.vx = 0; this.rider.dismount(g, -4.2); g.audio('bleat'); g.onGoatDone();
        } else {
          // después de comer pasto, el siguiente salto es un súper salto
          const big = this.boost > 0;
          this.vy = PHYS.GOAT_JUMP * (big ? 1.4 : 1); if (big) this.boost--;
          this.onGround = false; this.landT = 5; g.audio(big ? 'bleat' : 'boing');
          g.burst(this.cx, this.y + this.h, big ? 'spark' : 'dust', big ? 14 : 5);
        }
      }
    } else {
      this.vx *= 0.8;
      if (this.onGround && ++this.idleT % 110 === 0 && !this.retired) this.vy = -3.2; // brinquito de espera
    }
    this.vy = Math.min(this.vy + PHYS.GOAT_GRAV, PHYS.GOAT_FALL);
    moveX(this, g.level); moveY(this, g.level);
    if (this.rider) this.rider.syncRide();
    this.hazards(g);
  }
  draw(ctx) {
    const img = !this.onGround ? (this.vy < 0 ? GOAT.jump : GOAT.stand) : (this.landT > 0 ? GOAT.land : GOAT.stand);
    ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 14 + (this.facing < 0 ? 2 : -2)), Math.round(this.y + this.h - 20));
    if (this.boost > 0 && Math.floor(this.animT / 4) % 2) { ctx.fillStyle = '#ffe27a'; ctx.fillRect(Math.round(this.cx + (this.animT % 16) - 8), Math.round(this.y - 4), 1, 1); }
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
// HUAICO: el lodo baja del cerro por la derecha, corre escalón a escalón hacia
// la izquierda y se despeña por el precipicio. Arrastra troncos y lajas.
class Huaico {
  constructor(def, level) {
    this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.interval = def.interval || 84; this.speed = def.speed || 0.75;
    this.inflow = def.inflow ? { x: def.inflow.x * TS + 8, y: def.inflow.top * TS } : null;
    this.level = level; this.t = 20; this.n = 0;
  }
  surfaceAt(x) {
    for (const l of this.level.liquids) if (l.kind === 'mud' && x >= l.x * TS && x < (l.x + l.w) * TS) return l.y * TS + 4;
    return null;
  }
  prefill(g) { for (let x = this.x1 - 60; x > this.x0 + 20; x -= this.interval * this.speed) this.spawn(g, x, null); }
  spawn(g, x, y) {
    const d = new Debris(this.n++ % 3 === 2 ? 'slab' : 'log', x, this, y);
    g.addEntity(d); g.movers.push(d);
  }
  update(g) { if (--this.t <= 0) { this.t = this.interval; this.spawn(g, this.inflow.x, this.inflow.y); } }
  draw() {}
}
class Debris extends Actor {
  constructor(kind, x, hu, y) {
    const img = kind === 'log' ? OBJ.log : OBJ.slab;
    super(x - img.width / 2 + 2, 0, img.width - 4, 8);
    this.kind = kind; this.img = img; this.hu = hu; this.isMover = true;
    this.dx = 0; this.dy = 0; this.t = Math.random() * 6; this.falling = false; this.fallT = 0; this.rot = 0;
    // si viene de la cascada, cae desde arriba; si no, ya está flotando
    this.y = y != null ? y : hu.surfaceAt(this.cx) - 8;
    this.landed = y == null;
  }
  update(g) {
    const px = this.x, py = this.y;
    this.t += 0.07;
    if (this.falling) {
      // se despeña por el precipicio dando vueltas
      this.vy = Math.min(this.vy + 0.4, 8); this.y += this.vy; this.x -= 0.4; this.rot += 0.08;
      if (++this.fallT > 70) this.dead = true;
    } else {
      if (this.landed) this.x -= this.hu.speed;
      const s = this.hu.surfaceAt(this.cx);
      if (s === null) { if (this.cx < this.hu.x0) { this.falling = true; this.vy = 0.5; } }
      else {
        const target = s - 8 - (Math.sin(this.t) > 0.4 ? 1 : 0);
        if (this.y < target - 1) {
          this.vy = Math.min(this.vy + 0.45, 7); this.y = Math.min(this.y + this.vy, target);
          if (this.y >= target) { this.vy = 0; this.landed = true; g.burst(this.cx, s, 'mud', 12); if (g.near(this.cx, 220)) g.audio('mud'); }
        } else { this.y = target; this.vy = 0; this.landed = true; }
      }
    }
    this.dx = this.x - px; this.dy = this.y - py;
  }
  draw(ctx, g) {
    const img = this.img;
    if (this.falling) {
      ctx.save(); ctx.translate(Math.round(this.cx), Math.round(this.y + 4)); ctx.rotate(-this.rot);
      ctx.drawImage(img, -Math.round(img.width / 2), -4); ctx.restore();
      return;
    }
    const s = this.hu.surfaceAt(this.cx);
    if (s === null) { ctx.drawImage(img, Math.round(this.cx - img.width / 2), Math.round(this.y - 1)); return; }
    ctx.save(); ctx.beginPath(); ctx.rect(this.x - 8, this.y - 40, this.w + 16, s + 2 - (this.y - 40)); ctx.clip();
    ctx.drawImage(img, Math.round(this.cx - img.width / 2), Math.round(this.y + 2)); // 3 px más hundido: flota de verdad
    ctx.restore();
    if (!this.landed) return;
    // ola de proa: el lodo se arremolina delante
    ctx.fillStyle = '#f0d6a8';
    const f = Math.floor(g.T / 5) % 2;
    ctx.fillRect(Math.round(this.x - 3 - f), Math.round(s), 3, 1);
    ctx.fillRect(Math.round(this.x + this.w + f), Math.round(s) + 1, 2, 1);
  }
}

// Cóndor que cruza la montaña en línea recta, de vez en cuando. Antes de
// entrar grazna y aparece un aviso en el borde de la pantalla: hay que esquivarlo.
class Condor extends Actor {
  constructor(def) {
    super(0, def.y * TS, 20, 7);
    // vuela de x0 a x1 (solo sobre su ladera de la montaña)
    this.cx0 = (def.x0 + def.x1) / 2 * TS; this.half = (def.x1 - def.x0) / 2 * TS; this.speed = def.speed || 1.6;
    this.baseY = def.y * TS; this.dir = def.dir || 1; this.animT = 0;
    this.wait = 90 + Math.floor((def.phase || 0) * 60); this.active = false; this.warnT = 0;
    this.x = -9999;
  }
  get warning() { return !this.active && this.wait > 0 && this.wait < 70; }
  update(g) {
    this.animT++;
    const near = Math.abs(g.player.cy - this.baseY) < 160 && Math.abs(g.player.cx - this.cx0) < 360;
    if (!this.active) {
      if (!near) return;               // solo vuelan cuando estás cerca de su altura
      if (--this.wait === 69) g.audio('caw');
      if (this.wait <= 0) { this.active = true; this.x = this.cx0 - this.dir * this.half - this.w / 2; }
      return;
    }
    this.x += this.dir * this.speed;
    this.y = this.baseY + Math.sin(this.animT * 0.05) * 4;
    if ((this.dir > 0 && this.x > this.cx0 + this.half) || (this.dir < 0 && this.x < this.cx0 - this.half - this.w)) {
      this.active = false; this.dir *= -1; this.x = -9999; this.wait = 220 + Math.floor(Math.random() * 120);
    }
  }
  onRespawn() { this.active = false; this.x = -9999; this.wait = 160; }
  get hitbox() { return this.active ? { x: this.x + 5, y: this.y + 2, w: this.w - 10, h: this.h - 4 } : { x: -9999, y: -9999, w: 0, h: 0 }; }
  draw(ctx) {
    if (!this.active) return;
    const img = E.condorBig[Math.floor(this.animT / 9) % 2];
    ctx.drawImage(this.dir < 0 ? flipS(img) : img, Math.round(this.cx - 14), Math.round(this.y - 2));
  }
}

// ═════════════════════════════════════════════════════════════════════════════
class Pickup extends Actor {
  constructor(type, x, y) {
    super(x * TS + 3, y * TS + 5, 10, 11);
    if (type === 'herb') { this.x -= 3; this.y -= 3; this.w = 16; this.h = 16; }
    this.type = type; this.animT = Math.random() * 10; this.baseY = this.y;
  }
  update(g) {
    this.animT += 0.1;
    const p = g.player;
    if (this.overlaps(p, 3) || (p.riding && this.overlaps(p.riding, 1))) this.collect(g);
  }
  collect(g) {
    if (this.type === 'herb') {
      // solo la cabra come pasto: le da un súper salto
      const goat = g.player.riding; if (!(goat instanceof Cabra)) return;
      this.dead = true; goat.boost = 1; g.herbs++; g.audio('munch'); g.burst(this.cx, this.cy, 'leaf', 12);
      return;
    }
    this.dead = true;
    g.audio('page'); g.pages++; g.burst(this.cx, this.cy, 'paper', 16);
  }
  draw(ctx) {
    if (this.type === 'herb') {
      // brillo que late + destello que gira: tiene que verse desde lejos
      const bob = Math.sin(this.animT) * 1.5, cx = this.cx, cy = this.cy + bob;
      const pulse = 0.35 + Math.sin(this.animT * 2.2) * 0.15;
      ctx.fillStyle = 'rgba(255,240,140,' + pulse.toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(Math.round(cx), Math.round(cy), 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,220,' + (pulse + 0.2).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(Math.round(cx), Math.round(cy), 8, 0, Math.PI * 2); ctx.fill();
      ctx.drawImage(OBJ.herb, Math.round(cx - 8), Math.round(cy - 7));
      for (let k = 0; k < 2; k++) {
        const a = this.animT * 1.3 + k * Math.PI;
        const sx = Math.round(cx + Math.cos(a) * 13), sy = Math.round(cy + Math.sin(a) * 9);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(sx, sy - 1, 1, 3); ctx.fillRect(sx - 1, sy, 3, 1);
      }
      return;
    }
    // la hoja aletea con el viento, apoyada en el suelo
    const tilt = Math.sin(this.animT * 1.4) > 0 ? 0 : 1;
    ctx.drawImage(OBJ.page, Math.round(this.cx - 5 + tilt), Math.round(this.y + this.h - 11));
  }
}

// Punto de control invisible: al pasar por aquí, reapareces aquí.
class Checkpoint extends Actor {
  constructor(x, y) { super(x * TS - 24, y * TS - 64, 64, 64); this.on = false; this.spawn = { x: x * TS + 4, y: y * TS }; }
  update(g) {
    const p = g.player;
    if (!this.on && (p.overlaps(this) || (p.riding && p.riding.overlaps(this)))) { this.on = true; g.setCheckpoint(this); }
  }
  draw() {}
}

// ═════════════════════════════════════════════════════════════════════════════


// La hoja gigante del platanal de la cumbre: tómala y salta al vacío.
class Leaf extends Actor {
  constructor(x, y) { super(x * TS, y * TS - 30, 22, 30); this.taken = false; this.animT = 0; }
  onRespawn() { this.taken = false; }
  update(g) {
    this.animT++;
    const p = g.player;
    if (!this.taken && !p.riding && p.overlaps(this)) { this.taken = true; p.gliding = true; p.glideAir = 0; g.audio('leaf'); g.burst(this.cx, this.y + 8, 'leaf', 14); }
  }
  draw(ctx) {
    ctx.drawImage(OBJ.bananaPlant, Math.round(this.x), Math.round(this.y + this.h - 19));
    if (!this.taken) {
      // la hoja grande, colgando del platanal, se mece con el viento
      const sw = Math.round(Math.sin(this.animT * 0.05) * 1.5);
      ctx.drawImage(OBJ.leaf, Math.round(this.x - 6 + sw), Math.round(this.y + 2));
    }
  }
}
class FallingLeaf {
  constructor(x, y, dir) { this.x = x; this.y = y; this.dir = dir; this.t = 0; }
  update() { this.t++; this.x += Math.sin(this.t * 0.08) * 1.2 + this.dir * 0.4; this.y += 0.5; if (this.t > 120) this.dead = true; }
  draw(ctx) { ctx.save(); ctx.globalAlpha = Math.min(1, (120 - this.t) / 30); ctx.translate(Math.round(this.x), Math.round(this.y)); ctx.rotate(Math.sin(this.t * 0.08) * 0.5); ctx.drawImage(OBJ.leaf, -16, -4); ctx.restore(); }
}

// ÁGUILA: mientras planeas, te rodea; luego chilla, se prepara y se lanza en
// picado en línea recta hacia donde estabas. La dirección se fija al lanzarse:
// apártate en el último momento.
class Eagle extends Actor {
  constructor(def) {
    super(-9999, -9999, 24, 12);
    this.rowMin = def.rowMin; this.rowMax = def.rowMax; this.delay = def.delay || 60;
    this.state = 'idle'; this.t = 0; this.angle = Math.random() * 6; this.animT = 0; this.dirX = 1; this.dx = 0; this.dy = 0; this.face = 1;
  }
  onRespawn() { this.state = 'idle'; this.x = -9999; this.y = -9999; this.t = 0; }
  get dangerous() { return this.state === 'dive'; }
  get hitbox() { return { x: this.x + 4, y: this.y + 2, w: this.w - 8, h: this.h - 4 }; }
  update(g) {
    const p = g.player; this.animT++; this.t++;
    const row = p.cy / TS;
    const active = p.gliding && !p.onGround && row >= this.rowMin && row <= this.rowMax && g.state === 'play';
    const busy = g.entities.some(o => o !== this && o instanceof Eagle && (o.state === 'windup' || o.state === 'dive'));
    switch (this.state) {
      case 'idle':
        if (active) { this.state = 'circle'; this.t = 0; this.x = p.cx + (Math.random() < 0.5 ? -220 : 220); this.y = p.cy - 90; }
        break;
      case 'circle': {
        // da vueltas alrededor del niño
        this.angle += 0.04;
        // merodea SIEMPRE por encima del niño (40–70 px más arriba): nunca lo atraviesa
        const tx = p.cx + Math.cos(this.angle) * 90 - this.w / 2, ty = p.cy - 55 + Math.sin(this.angle) * 15 - this.h / 2;
        const ox = this.x; this.x += (tx - this.x) * 0.07; this.y += (ty - this.y) * 0.07; this.face = this.x >= ox ? 1 : -1;
        if (!active) { this.state = 'leave'; this.t = 0; }
        else if (this.t > 110 + this.delay && !busy) { this.state = 'windup'; this.t = 0; g.audio('screech'); }
        break;
      }
      case 'windup': {
        // se encara al niño, retrocede un poco y abre las garras
        const vx = p.cx - this.cx, vy = p.cy - this.cy, d = Math.hypot(vx, vy) || 1;
        this.face = vx >= 0 ? 1 : -1;
        this.x -= vx / d * 0.3; this.y -= vy / d * 0.3;
        this.aimX = p.cx; this.aimY = p.cy;
        if (this.t > 38) { this.dx = vx / d * 4.4; this.dy = vy / d * 4.4; this.state = 'dive'; this.t = 0; g.audio('swoosh'); g.shake(2, 10); }
        break;
      }
      case 'dive':
        this.x += this.dx; this.y += this.dy;
        if (this.t > 60) { this.state = 'recover'; this.t = 0; }
        break;
      case 'recover':
        this.x += this.dx * 0.5; this.y -= 1.8; this.dx *= 0.97;
        if (this.t > 50) { this.state = active ? 'circle' : 'leave'; this.t = 0; this.delay = 40 + Math.random() * 80; }
        break;
      case 'leave':
        this.y -= 2.2; this.x += this.face * 1.5;
        if (this.t > 120) { this.state = 'idle'; this.x = -9999; this.y = -9999; }
        if (active && this.t > 30) { this.state = 'circle'; this.t = 0; }
        break;
    }
  }
  draw(ctx) {
    if (this.state === 'idle') return;
    const att = this.state === 'windup' || this.state === 'dive';
    if (this.state === 'windup') {
      // línea de mira punteada hacia el niño y "!" sobre el águila
      const x0 = this.cx, y0 = this.cy, x1 = this.aimX || x0, y1 = this.aimY || y0;
      const n = Math.floor(Math.hypot(x1 - x0, y1 - y0) / 6);
      ctx.fillStyle = (Math.floor(this.t / 4) % 2) ? '#ffffff' : '#d9e6f2';
      for (let i = 1; i < n; i += 2) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), 2, 2);
      // el "!" nunca se sale de la pantalla: si el águila está fuera, se pega al borde
      const g = Game, cy = Math.max(g.cam.y + 4, Math.min(g.cam.y + 216 - 20, this.y - 16)), cx = Math.max(g.cam.x + 10, Math.min(g.cam.x + 374, this.cx));
      if (Math.floor(this.t / 5) % 2 === 0) drawText(ctx, '!', Math.round(cx), Math.round(cy), { scale: 2, color: '#ffffff', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
    }
    const img = att ? E.eagle.attack : (Math.floor(this.animT / 8) % 2 ? E.eagle.flyA : E.eagle.flyB);
    ctx.save();
    ctx.translate(Math.round(this.cx), Math.round(this.cy));
    if (this.state === 'dive') ctx.rotate(Math.atan2(this.dy, Math.abs(this.dx)) * 0.6 * (this.face));
    if (this.face < 0) ctx.scale(-1, 1);
    // tiembla un poco antes de lanzarse
    const sh = this.state === 'windup' ? (this.t % 4 < 2 ? 1 : -1) : 0;
    ctx.drawImage(img, -16 + sh, -10);
    ctx.restore();
  }
}

// EL COLEGIO: se cae a pedazos. Tablones clausurando la puerta, grietas,
// tejas que faltan y puntales sosteniendo la pared. Aquí no hay clases...
class School extends Actor {
  constructor(x, y) {
    const base = y * TS;
    super(x * TS - 60, base - 96, 120, 96);
    this.base = base; this.animT = 0; this.creak = 0;
  }
  update(g) {
    this.animT++;
    const p = g.player;
    const near = Math.abs(p.cx - (this.x + 60)) < 70;
    // al acercarte cruje y se desprende polvo y algún cascote
    if (near && this.creak <= 0) { this.creak = 150; g.audio('creak'); }
    if (this.creak > 0) this.creak--;
    if (near && this.animT % 14 === 0) g.particles.push({ x: this.x + 10 + Math.random() * 100, y: this.base - 60 + Math.random() * 10, vx: 0, vy: 0.4, life: 60, max: 60, col: Math.random() < 0.5 ? '#c9a86a' : '#a3402a', size: Math.random() < 0.3 ? 2 : 1, grav: 0.08 });
  }
  draw(ctx) {
    const bx = Math.round(this.x), base = this.base;
    ctx.save();
    // el edificio entero está ladeado
    ctx.translate(bx + 6, base); ctx.rotate(-0.035); ctx.translate(-(bx + 6), -base);
    const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(bx + x, base + y, w, h); };
    R('rgba(40,20,10,0.25)', 2, -2, 118, 2);
    // muro sucio y descascarado
    R('#d9ccb0', 6, -46, 108, 46);
    for (let y = -42; y < -12; y += 6) R('#c6b693', 6, y, 108, 1);
    for (const [x, y, w, h] of [[14, -44, 18, 9], [70, -30, 12, 14], [92, -42, 16, 8], [40, -20, 10, 7]]) R('#b98a55', x, y, w, h); // adobe al descubierto
    R('#5e7fa8', 6, -12, 108, 12); R('#2b4f86', 6, -12, 108, 1);
    for (let x = 10; x < 110; x += 13) R('#8aa2c0', x, -9, 5, 3); // pintura caída
    // grietas
    const crack = (pts) => { ctx.fillStyle = '#3a2414'; for (const [x, y] of pts) ctx.fillRect(bx + x, base + y, 1, 2); };
    crack([[30, -46], [31, -44], [33, -42], [32, -40], [34, -38], [36, -36], [35, -34], [37, -32], [39, -30], [38, -28]]);
    crack([[86, -46], [85, -44], [83, -42], [84, -40], [82, -38], [80, -36], [81, -34], [79, -32]]);
    crack([[60, -12], [61, -14], [63, -16], [62, -18], [64, -20]]);
    // ventanas rotas
    for (const wx of [14, 94]) {
      R('#2b4f86', wx - 1, -36, 14, 18); R('#1d1a24', wx, -35, 12, 16);
      R('#9fd3f0', wx, -35, 4, 5); R('#9fd3f0', wx + 8, -26, 4, 7); R('#2b4f86', wx + 5, -35, 2, 16);
    }
    // puerta clausurada con tablones y cinta
    R('#2b4f86', 49, -30, 22, 30); R('#3a2412', 50, -29, 20, 29);
    ctx.save(); ctx.translate(bx + 60, base - 15);
    for (const [ang, oy] of [[0.5, -6], [-0.5, -6], [0.1, 6]]) { ctx.save(); ctx.rotate(ang); ctx.fillStyle = '#8a5a30'; ctx.fillRect(-15, oy - 2, 30, 4); ctx.fillStyle = '#6b4524'; ctx.fillRect(-15, oy + 1, 30, 1); ctx.restore(); }
    ctx.restore();
    R('#d8432f', 28, -25, 64, 9); drawText(ctx, 'CLAUSURADO', bx + 60, base - 24, { color: '#ffffff', align: 'center' });
    // techo con huecos y vigas a la vista
    for (let i = 0; i < 18; i++) {
      const y = -64 + i, inset = Math.round((17 - i) * 0.7);
      R(i % 4 < 2 ? '#b0553a' : '#8f3f2a', -2 + inset, y, 124 - inset * 2, 1);
    }
    for (const [x, y, w, h] of [[20, -62, 16, 9], [64, -58, 12, 8], [88, -63, 14, 11]]) { R('#4a3a52', x, y, w, h); for (let k = 0; k < w; k += 5) R('#6b4524', x + k, y, 2, h); }
    R('#7f2f1f', -2, -47, 124, 1);
    // tejas caídas en el suelo
    for (const [x, c] of [[-6, '#b0553a'], [-2, '#8f3f2a'], [112, '#b0553a'], [118, '#8f3f2a'], [4, '#8f3f2a']]) R(c, x, -3, 5, 3);
    // puntales de madera sosteniendo la pared
    ctx.save(); ctx.translate(bx + 116, base); ctx.rotate(-0.75); ctx.fillStyle = '#6b4524'; ctx.fillRect(0, -2, 40, 4); ctx.fillStyle = '#8a5a30'; ctx.fillRect(0, -2, 40, 1); ctx.restore();
    ctx.save(); ctx.translate(bx + 2, base); ctx.rotate(-2.35); ctx.fillStyle = '#6b4524'; ctx.fillRect(0, -2, 36, 4); ctx.restore();
    // espadaña torcida con la campana colgando de un lado
    ctx.save(); ctx.translate(bx + 60, base - 64); ctx.rotate(0.12);
    ctx.fillStyle = '#d9ccb0'; ctx.fillRect(-10, -22, 20, 22); ctx.fillStyle = '#4a3a52'; ctx.fillRect(-5, -18, 10, 12);
    ctx.fillStyle = '#e2b13c'; ctx.fillRect(-2, -14, 5, 6); ctx.fillStyle = '#3a2414'; ctx.fillRect(4, -22, 1, 6); ctx.fillRect(-9, -8, 1, 5);
    ctx.restore();
    ctx.restore();
  }
}

// LA CLASE AL AIRE LIBRE: los alumnos sentados en el suelo y el profesor con
// su pizarra. La meta de verdad es sentarte en el hueco junto a tus compañeros.
const STUDENT_COLORS = [{ r: '#3f6fb8', R: '#27426e' }, { r: '#5c9f4a', R: '#3a7d36' }, { r: '#8a4cc0', R: '#5a3088' }, { r: '#f0913c', R: '#b45f1e' }];
let _students = null;
function studentSprites() {
  if (_students) return _students;
  _students = STUDENT_COLORS.map(c => PIX.fromRows(KID_TOP.concat(KID_LEGS.sit), Object.assign({}, PAL, c)));
  return _students;
}
class OutdoorClass extends Actor {
  constructor(x, y) {
    const base = y * TS;
    super(x * TS, base - 40, 200, 40);
    this.base = base; this.animT = 0; this.done = false; this.sitT = 0;
    // posiciones de los alumnos; el hueco libre (índice 2) es el tuyo
    this.seats = [0, 22, 48, 74, 96].map(dx => x * TS + dx);
    this.spot = this.seats[2];
    this.board = x * TS + 128; this.teacherX = x * TS + 180; // al otro lado de la pizarra
  }
  update(g) {
    this.animT++;
    const p = g.player;
    if (this.done) { this.sitT++; p.x += (this.spot - p.x) * 0.2; if (this.sitT === 40) g.gameComplete(); return; }
    if (p.onGround && !p.riding && Math.abs(p.cx - (this.spot + 8)) < 14) {
      this.done = true; p.won = true; p.vx = 0; g.audio('sit'); g.burst(this.spot + 8, this.base, 'dust', 8);
    }
  }
  draw(ctx, g) {
    const base = this.base, sp = studentSprites();
    // pizarra sobre un caballete
    const bxp = this.board;
    ctx.fillStyle = '#6b4524'; ctx.fillRect(bxp + 4, base - 30, 3, 30); ctx.fillRect(bxp + 41, base - 30, 3, 30); ctx.fillRect(bxp + 22, base - 26, 3, 26);
    ctx.fillStyle = '#8a5a30'; ctx.fillRect(bxp, base - 52, 48, 30);
    ctx.fillStyle = '#2f5a3e'; ctx.fillRect(bxp + 2, base - 50, 44, 26);
    drawText(ctx, '2+2=4', bxp + 24, base - 46, { color: '#e8f0e0', align: 'center' });
    drawText(ctx, 'AEIOU', bxp + 24, base - 36, { color: '#e8f0e0', align: 'center' });
    // el profesor, de pie junto a la pizarra mirando hacia ella y hacia los
    // alumnos; escribe con la tiza (destello en la mano)
    const near = Math.abs(g.player.cx - this.spot) < 120 && !this.done;
    ctx.drawImage(flipS(OBJ.teacher), Math.round(this.teacherX), base - 27);
    if (!near && Math.floor(this.animT / 20) % 2) { ctx.fillStyle = '#ffffff'; ctx.fillRect(this.teacherX - 1, base - 16, 2, 1); }
    // alumnos sentados en el suelo mirando la pizarra
    this.seats.forEach((sx, i) => {
      if (i === 2) {
        // tu sitio: un pequeño poncho extendido en el suelo
        if (!this.done) { const a = 0.25 + Math.sin(this.animT * 0.12) * 0.15; ctx.fillStyle = 'rgba(255,230,140,' + a.toFixed(2) + ')'; ctx.fillRect(sx - 3, base - 5, 22, 5); }
        ctx.fillStyle = '#d8432f'; ctx.fillRect(sx + 1, base - 2, 14, 2);
        ctx.fillStyle = '#f6c94a'; for (let k = 0; k < 14; k += 3) ctx.fillRect(sx + 1 + k, base - 2, 1, 1);
        if (this.done) ctx.drawImage(P.sit, Math.round(g.player.x - 4), base - 22 + (this.sitT < 8 ? -8 + this.sitT : 0));
        return;
      }
      const bob = Math.floor((this.animT + i * 23) / 50) % 2;
      ctx.drawImage(sp[i % sp.length], sx, base - 22 + bob);
    });
  }
}

// LA CASA: casita andina de adobe con techo de ichu. Mamá mira desde la
// puerta y se despide con la mano mientras el niño sale hacia el colegio.
class House extends Actor {
  constructor(x, y) { const base = y * TS; super(x * TS, base - 70, 100, 70); this.base = base; this.animT = 0; }
  update(g) {
    this.animT++;
    // humo del fogón saliendo por el techo
    if (this.animT % 18 === 0) g.particles.push({ x: this.x + 72 + Math.random() * 4, y: this.base - 66, vx: 0.15 + Math.random() * 0.1, vy: -0.35, life: 90, max: 90, col: '#d8d0c8', size: 2, grav: -0.002 });
  }
  draw(ctx, g) {
    const bx = Math.round(this.x), base = this.base;
    const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(bx + x, base + y, w, h); };
    // muro de adobe con hiladas de bloques
    R('#c99a62', 4, -40, 92, 40);
    for (let y = -36, k = 0; y < 0; y += 5, k++) { R('#a87a46', 4, y, 92, 1); for (let x = 4 + (k % 2) * 6; x < 96; x += 12) R('#a87a46', x, y - 4, 1, 4); }
    R('#8a5a30', 4, -2, 92, 2);
    // ventanita con maceta de cantutas
    R('#5a3a1e', 66, -30, 16, 14); R('#2a1f2d', 68, -28, 12, 10); R('#ffd88a', 69, -27, 4, 4);
    R('#9a5a30', 66, -16, 16, 3); R('#c2185b', 69, -19, 2, 2); R('#c2185b', 75, -19, 2, 2); R('#64803a', 72, -19, 2, 2);
    // puerta abierta con luz cálida del interior
    R('#5a3a1e', 34, -30, 20, 30); R('#3a2412', 36, -28, 16, 28); R('#e8a85a', 38, -26, 12, 26); R('#ffd88a', 40, -24, 8, 24);
    R('#8a5a30', 30, -28, 5, 28); for (let y = -26; y < 0; y += 6) R('#6b4524', 30, y, 5, 1); // hoja de la puerta abierta
    // techo de ichu a dos aguas, con el borde deshilachado
    for (let i = 0; i < 26; i++) {
      const y = -66 + i, inset = Math.max(0, Math.round((25 - i) * 1.9));
      R(i % 3 === 0 ? '#b88f3a' : i % 3 === 1 ? '#d9b45a' : '#c9a24a', -4 + inset, y, 108 - inset * 2, 1);
    }
    for (let x = -4; x < 104; x += 3) R(x % 2 ? '#b88f3a' : '#a07a2e', x, -40, 2, 2 + (x % 5 === 0 ? 2 : 0));
    // banquito de madera y olla de barro junto a la puerta
    R('#6b4524', 8, -8, 16, 2); R('#6b4524', 9, -6, 2, 6); R('#6b4524', 21, -6, 2, 6);
    R('#8a4a2a', 84, -9, 10, 9); R('#a85a32', 85, -8, 8, 2); R('#2a1f2d', 86, -10, 6, 1);
    // mamá en la puerta: mira al niño y se despide con la mano
    const p = g.player, near = Math.abs(p.cx - (bx + 44)) < 170;
    const wave = near && Math.floor(this.animT / 14) % 2 === 0;
    const img = OBJ.mom[wave ? 1 : 0];
    ctx.drawImage(p.cx < bx + 44 ? flipS(img) : img, bx + 36, base - 25);
  }
}

function makeEntity(def, level) {
  switch (def.type) {
    case 'llama': return new Llama(def.x * TS, def.y * TS);
    case 'cabra': return new Cabra(def.x * TS, def.y * TS);
    case 'rockfall': return new Rockfall(def.x, def.y, def.interval);
    case 'huaico': return new Huaico(def, level);
    case 'checkpoint': return new Checkpoint(def.x, def.y);
    case 'house': return new House(def.x, def.y);
    case 'school': return new School(def.x, def.y);
    case 'outdoorClass': return new OutdoorClass(def.x, def.y);
    case 'leaf': return new Leaf(def.x, def.y);
    case 'eagle': return new Eagle(def);
    case 'page': return new Pickup('page', def.x, def.y);
    case 'herb': return new Pickup('herb', def.x, def.y);
    case 'condor': return new Condor(def);
    default: return null;
  }
}
