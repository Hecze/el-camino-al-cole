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
    this.gliding = false; this.glideAir = 0; this.fallFrom = null;
    this.swimming = false; this.swimCd = 0;
    this.won = false; this.invuln = 0;
  }
  get jumpHeld() { return Input.held('jump') || Input.held('up'); }

  update(g) {
    const level = g.level;
    if (this.won) { this.animT++; return; }
    if (this.mountCd > 0) this.mountCd--;
    if (this.dragged) { this.updateDragged(g); return; }
    if (this.swimCd > 0) this.swimCd--;
    if (this.swimming) { this.updateSwim(g); return; }
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
    // planeando no hay límite de carrera: se aplica el del parapente más abajo
    if (!(this.gliding && !this.onGround)) this.vx = Math.max(-PHYS.RUN_MAX, Math.min(PHYS.RUN_MAX, this.vx));
    if (Math.abs(this.vx) < 0.05) this.vx = 0;

    if (this.onGround) this.coyote = PHYS.COYOTE; else if (this.coyote > 0) this.coyote--;
    if (this.coyote > 0 && Input.consumeJump()) {
      this.vy = PHYS.JUMP_V; this.onGround = false; this.coyote = 0;
      g.onPlayerJump(this);
    }
    if (this.noCut > 0) this.noCut--;
    else if (!this.jumpHeld && this.vy < -PHYS.JUMP_CUT) this.vy = -PHYS.JUMP_CUT;
    if (this.gliding && !this.onGround && this.vy > 0) {
      // planeando: caída lenta y constante; solo te mueves a los lados
      this.vy += (1.3 - this.vy) * 0.12;
      // a los lados se mueve más rápido que caminando
      if (Input.held('left') && !Input.held('right')) this.vx -= 0.2; else if (Input.held('right') && !Input.held('left')) this.vx += 0.2;
      this.vx = Math.max(-3.0, Math.min(3.0, this.vx));
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

    // la hoja solo se suelta al aterrizar en el valle de abajo; si caes en
    // una saliente de la montaña la conservas
    if (this.gliding) {
      if (!this.onGround) this.glideAir++;
      else if (this.glideAir > 40 && this.y > (level.glideLandRow || 0) * TS) { this.gliding = false; g.addEntity(new FallingLeaf(this.cx, this.y - 14, this.facing)); g.audio('land'); }
      else this.glideAir = 0;
    }
    // caída desde muy alto a pie (sin hoja ni montura): pierdes
    if (!this.onGround) this.fallFrom = this.gliding ? null : (this.fallFrom === null ? this.y : Math.min(this.fallFrom, this.y));
    else {
      const drop = this.fallFrom === null ? 0 : this.y - this.fallFrom;
      this.fallFrom = null;
      if (drop > 14 * TS) { g.playerEnvDeath('fall'); return; }
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
    if (!this.swimming && this.swimCd <= 0 && pts.some(([px, py]) => liquidAt(level, px, py) === 'swamp')) {
      // agua quieta de la selva: no te mata, nadas (despacio) mientras los caimanes se acercan
      this.swimming = true; this.vx *= 0.3; this.vy = Math.min(this.vy, 1); this.gliding = false;
      g.audio('splash'); g.burst(this.cx, this.y + this.h, 'swampSplash', 14);
      return;
    }
    if (inMud && g.huaico) {
      // el huaico te atrapa y te arrastra hacia el precipicio
      this.dragged = true; this.dragT = 0; this.overEdge = false; this.vx = 0; this.vy = 0; this.struggle = 0; this.hop = 0;
      g.audio('splash'); g.burst(this.cx, this.y + this.h, 'mud', 14); g.shake(2, 8);
      return;
    }
    if (this.y > Math.max(level.rows * TS + 40, 0) || this.y > g.cam.y + 216 + 80) g.playerEnvDeath('fall');
  }

  swampSurface(level, x) {
    for (const l of level.liquids) if (l.kind === 'swamp' && x >= l.x * TS && x < (l.x + l.w) * TS) return l.y * TS + 4;
    return null;
  }
  updateSwim(g) {
    const level = g.level, s = this.swampSurface(level, this.cx);
    this.animT++;
    if (s === null) { this.swimming = false; return; }
    const left = Input.held('left'), right = Input.held('right');
    if (left && !right) { this.vx -= 0.12; this.facing = -1; } else if (right && !left) { this.vx += 0.12; this.facing = 1; } else this.vx *= 0.9;
    this.vx = Math.max(-1.0, Math.min(1.0, this.vx));
    // flota con la cabeza fuera del agua
    const target = s - this.h + 9;
    this.vy += (target - this.y) * 0.12; this.vy *= 0.75;
    if (Input.consumeJump() && Math.abs(this.y - target) < 4) {
      // impulso para salir a una roca o raíz
      this.swimming = false; this.swimCd = 14; this.vy = -6.6; this.noCut = 14;   // salto completo aunque solo toques el botón
      g.audio('jump'); g.burst(this.cx, s, 'swampSplash', 10);
    }
    moveX(this, level);
    this.y += this.vy;
    if (this.animT % 16 === 0) g.burst(this.cx, s, 'swampSplash', 2);
    if (this.x < 0) this.x = 0;
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
    this.struggle = Math.max(0, this.struggle - 0.044);
    if (this.hop > 0) this.hop--;
    if (Input.consumeJump()) {
      this.struggle += 1; this.hop = 8;
      const k = this.struggle / 7;
      g.burst(this.cx, s - 2, 'foam', 5 + Math.round(k * 12)); g.burst(this.cx, s - 2, 'mud', 3);
      g.audio('mud');
      if (this.struggle >= 7) {
        this.dragged = false; this.y = s - this.h - 6; this.vy = -6.8; this.vx = 0.9; this.struggle = 0;
        unstick(this, g.level);
        g.audio('jump'); g.burst(this.cx, s, 'foam', 24); g.burst(this.cx, s, 'mud', 10); g.shake(1.5, 6);
      }
    }
  }

  // ayuda flotante en el huaico: cómo escapar y cuánto falta
  drawStruggleHint(ctx) {
    const cx = Math.round(this.cx), top = Math.round(this.y - 30), k = Math.min(1, this.struggle / 7);
    const bob = Math.round(Math.sin(this.dragT * 0.25) * 1.5);
    const blink = Math.floor(this.dragT / 12) % 2 === 0;
    drawText(ctx, '¡SALTA SIN PARAR!', cx, top + bob, { color: blink ? '#ffffff' : '#ffd166', align: 'center', shadow: true, shadowColor: '#000000' });
    // barra de fuerza: se llena con cada salto y se vacía si paras
    const w = 40, x = cx - w / 2, y = top + 11 + bob;
    ctx.fillStyle = '#1d1622'; ctx.fillRect(x - 1, y - 1, w + 2, 6);
    ctx.fillStyle = '#5a3a2a'; ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = k > 0.7 ? '#9be7c4' : '#ffd166'; ctx.fillRect(x, y, Math.round(w * k), 4);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x, y, Math.round(w * k), 1);
  }
  draw(ctx, g) {
    if (this.riding) return;
    if (this.swimming) {
      const s = this.swampSurface(g.level, this.cx) || 99999;
      ctx.save(); ctx.beginPath(); ctx.rect(this.x - 10, this.y - 30, 28, s + 1 - (this.y - 30)); ctx.clip();
      const img = P.run[Math.floor(this.animT / 8) % 4];   // braceando
      ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 8), Math.round(this.y + this.h - 22));
      ctx.restore();
      ctx.fillStyle = 'rgba(200,235,210,0.7)';
      const r = 6 + (this.animT % 24) / 3;
      ctx.fillRect(Math.round(this.cx - r), Math.round(s), 3, 1); ctx.fillRect(Math.round(this.cx + r - 3), Math.round(s), 3, 1);
      return;
    }
    if (this.dragged) {
      const s = this.overEdge ? 99999 : (g.huaico.surfaceAt(this.cx) || 99999);
      ctx.save(); ctx.beginPath(); ctx.rect(this.x - 10, this.y - 30, 28, s + 1 - (this.y - 30)); ctx.clip();
      const img = P.jump, jx = Math.floor(this.dragT / 6) % 2;
      // saltito al forcejear: más alto cuanto más impulso llevas
      const lift = this.hop > 0 ? Math.round(Math.sin(this.hop / 8 * Math.PI) * (3 + this.struggle * 1.2)) : 0;
      ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 8 + jx), Math.round(this.y + this.h - 22 - lift));
      ctx.restore();
      if (!this.overEdge) this.drawStruggleHint(ctx);
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
    const img = kind === 'log' ? OBJ.log : kind === 'roof' ? OBJ.roofRaft : OBJ.slab;
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
    ctx.drawImage(img, Math.round(this.cx - img.width / 2), Math.round(this.y + (this.kind === 'roof' ? -1 : 2))); // hundido: flota de verdad (el techo, que es liviano, asoma más)
    ctx.restore();
    if (!this.landed) return;
    // ola de proa: el lodo se arremolina delante
    ctx.fillStyle = '#f0d6a8';
    const f = Math.floor(g.T / 5) % 2;
    ctx.fillRect(Math.round(this.x - 3 - f), Math.round(s), 3, 1);
    ctx.fillRect(Math.round(this.x + this.w + f), Math.round(s) + 1, 2, 1);
  }
}

// Casa de adobe al fondo, al borde del huaico. Cuando te acercas cruje, tiembla
// y se derrumba: los muros caen hacia los lados y el techo de calamina se
// desliza al lodo, donde flota como una balsa junto con sus vigas.
class CollapseHouse extends Actor {
  constructor(x, y) {
    super(x * TS - 32, y * TS + 4 - 60, 64, 60);
    this.base = y * TS + 4; this.hx = x * TS; this.state = 'stand'; this.t = 0;
  }
  onRespawn() { this.state = 'stand'; this.t = 0; }
  update(g) {
    this.t++;
    const p = g.player;
    if (this.state === 'stand') {
      if (p.cx > this.hx - 9 * TS && p.cx < this.hx + 4 * TS && g.state === 'play') { this.state = 'creak'; this.t = 0; g.audio('creak'); g.audio('rumble'); }
    } else if (this.state === 'creak') {
      if (this.t % 6 === 0) g.particles.push({ x: this.hx - 30 + Math.random() * 60, y: this.base - 58 + Math.random() * 6, vx: 0, vy: 0.3, life: 40, max: 40, col: Math.random() < 0.5 ? '#c9a86a' : '#8a6a4a', size: 1, grav: 0.08 });
      if (this.t > 45) { this.state = 'fall'; this.t = 0; g.audio('crush'); g.audio('rock'); g.shake(3, 22); }
    } else if (this.state === 'fall') {
      if (this.t < 30 && this.t % 2 === 0) g.particles.push({ x: this.hx - 30 + Math.random() * 60, y: this.base - 40 + Math.random() * 26, vx: (Math.random() - 0.5) * 2.4, vy: -1.5 - Math.random() * 1.5, life: 50, max: 50, col: Math.random() < 0.6 ? '#b98a55' : '#94502d', size: Math.random() < 0.4 ? 2 : 1, grav: 0.18 });
      if (this.t === 26) {
        // el techo y las vigas caen al lodo y la corriente se los lleva
        const hu = g.huaico;
        if (hu) {
          for (const [kind, dx, dy] of [['roof', 0, 40], ['log', -66, 30], ['log', 68, 26]]) {
            const d = new Debris(kind, this.hx + dx, hu, this.base - dy); g.addEntity(d); g.movers.push(d);
          }
        }
        g.burst(this.hx, this.base, 'mud', 26); g.audio('splash');
      }
      if (this.t > 60) { this.state = 'ruin'; this.t = 0; }
    }
  }
  draw() {}
  // se dibuja detrás del lodo (está al fondo), sobre un barranco de tierra
  drawBack(ctx) {
    const bx = Math.round(this.hx - 32), base = this.base - 14;   // el piso de la casa, sobre el barranco
    const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(bx + x, base + y, w, h); };
    // barranco que baja hasta el lodo (el huaico ya se comió parte de la orilla)
    for (let x = -18; x < 82; x += 2) {
      const edge = Math.abs(x - 32) > 40 ? Math.round((Math.abs(x - 32) - 40) * 0.9) : 0;
      R('#6e4627', x, edge, 2, 30 - edge); R('#5a3b22', x, 8 + edge + ((x >> 1) % 3), 2, 22);
      R('#7d9a62', x, edge - 1, 2, 2);
    }
    for (const [x, y] of [[-8, 6], [6, 10], [24, 7], [50, 11], [70, 8]]) R('#94502d', x, y, 4, 2);   // piedras en el barranco
    if (this.state === 'ruin') {
      // escombros: tocones de muro, adobes sueltos y un dintel caído
      R('#a3753f', 2, -12, 8, 12); R('#b98a55', 3, -11, 6, 3); R('#a3753f', 54, -9, 9, 9);
      for (const [x, w] of [[12, 6], [20, 5], [27, 7], [37, 6], [45, 5]]) R(x % 2 ? '#b98a55' : '#94502d', x, -4, w, 4);
      R('#6b4524', 22, -7, 16, 3);
      return;
    }
    const sh = this.state === 'creak' ? Math.round(Math.sin(this.t * 1.7) * Math.min(2, this.t / 15)) : 0;
    const k = this.state === 'fall' ? Math.min(1, this.t / 26) : 0;   // avance del derrumbe
    const wall = (side) => {
      // cada muro gira hacia su lado sobre su base y cae por el barranco
      ctx.save();
      ctx.translate(bx + (side < 0 ? 2 : 62) + sh, base + k * 14); ctx.rotate(side * k * 1.3);
      const ox = side < 0 ? 0 : -30;
      ctx.fillStyle = '#b98a55'; ctx.fillRect(ox, -36, 30, 36);
      ctx.fillStyle = '#a3753f'; for (let y = -34; y < 0; y += 5) ctx.fillRect(ox, y, 30, 1);
      ctx.fillStyle = '#c9a06a'; for (let y = -32; y < 0; y += 10) for (let x = 2; x < 28; x += 9) ctx.fillRect(ox + x, y, 1, 4);
      ctx.fillStyle = '#8a6040'; ctx.fillRect(ox, -2, 30, 2);   // zócalo
      if (side < 0) { ctx.fillStyle = '#3a2412'; ctx.fillRect(ox + 17, -23, 11, 23); ctx.fillStyle = '#6b4524'; ctx.fillRect(ox + 18, -22, 9, 22); ctx.fillStyle = '#e2b13c'; ctx.fillRect(ox + 25, -12, 1, 2); }   // puerta
      else {   // ventana con cortina
        ctx.fillStyle = '#6b4524'; ctx.fillRect(ox + 7, -28, 12, 11); ctx.fillStyle = '#2b2030'; ctx.fillRect(ox + 8, -27, 10, 9);
        ctx.fillStyle = '#d8432f'; ctx.fillRect(ox + 8, -27, 3, 9); ctx.fillStyle = '#6b4524'; ctx.fillRect(ox + 12, -27, 1, 9);
      }
      if (this.state !== 'stand') {   // grieta que se abre
        ctx.fillStyle = '#3a2414'; const cx = ox + (side < 0 ? 26 : 3);
        for (let i = 0; i < 6; i++) ctx.fillRect(cx + ((i % 2) ? -side : 0), -35 + i * 5, 1, 5);
      }
      ctx.restore();
    };
    wall(-1); wall(1);
    // techo de calamina a dos aguas: en el derrumbe se desliza al lodo
    if (!(this.state === 'fall' && this.t >= 26)) {
      ctx.save(); ctx.translate(bx + 32 + sh, base - 44 + k * k * 40); ctx.rotate(k * 0.35);
      for (let i = 0; i < 11; i++) { const w = 76 - (10 - i) * 6; ctx.fillStyle = i % 2 ? '#9aa0a8' : '#8a9098'; ctx.fillRect(Math.round(-w / 2), i - 10, w, 1); }
      ctx.fillStyle = '#7d838c'; for (let x = -38; x < 38; x += 4) ctx.fillRect(x, 0, 2, 2);
      ctx.fillStyle = 'rgba(150,70,30,0.7)'; ctx.fillRect(-24, -4, 9, 3); ctx.fillRect(12, -2, 11, 3);
      ctx.fillStyle = '#5d636c'; ctx.fillRect(-39, 2, 78, 1);
      ctx.fillStyle = '#d9ccb0'; ctx.fillRect(14, -16, 4, 7); ctx.fillStyle = '#8a8296'; ctx.fillRect(14, -17, 4, 1);   // chimenea
      ctx.restore();
    }
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
  constructor(x, y, w = 4, h = 4) { super(x * TS + 8 - w * TS / 2, y * TS - h * TS, w * TS, h * TS); this.on = false; this.spawn = { x: x * TS + 4, y: y * TS }; }
  update(g) {
    const p = g.player;
    if (!this.on && (p.overlaps(this) || (p.riding && p.riding.overlaps(this)))) {
      this.on = true; g.setCheckpoint(this);
      // que se note: campanita, destellos y un aviso breve
      g.audio('checkpoint'); g.burst(p.cx, p.cy, 'spark', 18); g.toast('AVANCE GUARDADO');
    }
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
  get hitbox() { return { x: this.x + 2, y: this.y + 1, w: this.w - 4, h: this.h - 2 }; }
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
        // apunta a donde ESTARÁS cuando llegue (el niño sigue cayendo al planear):
        // si te quedas quieto, te atrapa; hay que cambiar de rumbo en el último momento
        const T = d / 6.5;
        const ax = p.cx + p.vx * T, ay = p.cy + p.vy * T;
        this.aimX = ax; this.aimY = ay;
        if (this.t > 38) {
          const wx = ax - this.cx, wy = ay - this.cy, wd = Math.hypot(wx, wy) || 1;
          this.dx = wx / wd * 6.5; this.dy = wy / wd * 6.5; this.state = 'dive'; this.t = 0; g.audio('swoosh'); g.shake(2, 10);
        }
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
// planchas de calamina oxidadas y sueltas, y puntales sosteniendo la pared. Aquí no hay clases...
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
    // el edificio entero está ladeado: el lado izquierdo se hunde en el barro (no flota)
    ctx.translate(bx + 116, base); ctx.rotate(-0.035); ctx.translate(-(bx + 116), -base);
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
    // cinta de peligro cruzando la puerta
    ctx.save(); ctx.translate(bx + 60, base - 18); ctx.rotate(-0.25);
    for (let k = -18; k < 18; k += 4) { ctx.fillStyle = (k / 4) & 1 ? '#1d1622' : '#f6c94a'; ctx.fillRect(k, -2, 4, 3); }
    ctx.restore();
    // techo de calamina ondulada, oxidada, con planchas que faltan y vigas a la vista
    for (let i = 0; i < 18; i++) {
      const y = -64 + i, inset = Math.round((17 - i) * 0.7);
      R('#9aa0a8', -2 + inset, y, 124 - inset * 2, 1);
      for (let x = -2 + inset; x < 122 - inset; x += 4) R('#7d838c', x, y, 2, 1);   // ondas
    }
    for (const [x, y, w, h] of [[4, -60, 10, 6], [44, -55, 14, 5], [100, -62, 8, 8], [76, -52, 8, 4]]) R('rgba(150,70,30,0.75)', x, y, w, h); // óxido
    for (const [x, y, w, h] of [[20, -62, 16, 9], [64, -58, 12, 8], [88, -63, 14, 11]]) { R('#4a3a52', x, y, w, h); for (let k = 0; k < w; k += 5) R('#6b4524', x + k, y, 2, h); }
    R('#5d636c', -2, -47, 124, 1);
    // una plancha suelta colgando del borde
    ctx.save(); ctx.translate(bx + 118, base - 47); ctx.rotate(0.9 + Math.sin(this.animT * 0.05) * 0.04);
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(0, 0, 14, 3); ctx.fillStyle = '#7d838c'; for (let k = 0; k < 14; k += 4) ctx.fillRect(k, 0, 2, 3); ctx.fillStyle = 'rgba(150,70,30,0.75)'; ctx.fillRect(8, 0, 5, 3);
    ctx.restore();
    // pedazos de calamina caídos en el suelo
    for (const [x, c] of [[-8, '#9aa0a8'], [-2, '#7d838c'], [110, '#9aa0a8'], [4, '#8a5a40']]) R(c, x, -2, 6, 2);
    // puntales de madera sosteniendo la pared
    ctx.save(); ctx.translate(bx + 116, base); ctx.rotate(-0.75); ctx.fillStyle = '#6b4524'; ctx.fillRect(0, -2, 40, 4); ctx.fillStyle = '#8a5a30'; ctx.fillRect(0, -2, 40, 1); ctx.restore();
    ctx.save(); ctx.translate(bx + 2, base); ctx.rotate(-2.35); ctx.fillStyle = '#6b4524'; ctx.fillRect(0, -2, 36, 4); ctx.restore();
    // espadaña torcida con la campana colgando de un lado
    ctx.save(); ctx.translate(bx + 60, base - 64); ctx.rotate(0.12);
    ctx.fillStyle = '#d9ccb0'; ctx.fillRect(-10, -22, 20, 22); ctx.fillStyle = '#4a3a52'; ctx.fillRect(-5, -18, 10, 12);
    ctx.fillStyle = '#e2b13c'; ctx.fillRect(-2, -14, 5, 6); ctx.fillStyle = '#3a2414'; ctx.fillRect(4, -22, 1, 6); ctx.fillRect(-9, -8, 1, 5);
    ctx.restore();
    ctx.restore();
    // letrero de Defensa Civil clavado delante: explica por qué no hay clases adentro
    const sx0 = bx + 70, sy0 = base - 52;
    ctx.fillStyle = '#6b4524'; ctx.fillRect(sx0 + 8, sy0 + 40, 3, 12); ctx.fillRect(sx0 + 55, sy0 + 40, 3, 12);
    ctx.fillStyle = '#1d1622'; ctx.fillRect(sx0 - 1, sy0 - 1, 68, 43);
    ctx.fillStyle = '#d8432f'; ctx.fillRect(sx0, sy0, 66, 41);
    ctx.fillStyle = '#f6c94a'; ctx.fillRect(sx0 + 2, sy0 + 11, 62, 28);
    drawText(ctx, '¡PELIGRO!', sx0 + 33, sy0 + 2, { color: '#ffffff', align: 'center' });
    drawText(ctx, 'RIESGO DE', sx0 + 33, sy0 + 13, { color: '#1d1622', align: 'center' });
    drawText(ctx, 'COLAPSO', sx0 + 33, sy0 + 22, { color: '#1d1622', align: 'center' });
    drawText(ctx, 'INMINENTE', sx0 + 33, sy0 + 31, { color: '#962a22', align: 'center' });
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
// Globo de diálogo (como en las historietas): fondo blanco, borde oscuro y
// colita apuntando a quien habla. (x, y) es la punta de la colita.
function drawBubble(ctx, lines, x, y, alpha = 1) {
  const w = Math.max(...lines.map(l => textWidth(l))) + 8, h = lines.length * 9 + 5;
  let bx = Math.round(x - w / 2); const by = Math.round(y - 4 - h);
  // que no se salga de la pantalla (la colita sigue apuntando a quien habla)
  if (typeof Game !== 'undefined' && Game.cam) bx = Math.max(Math.round(Game.cam.x) + 4, Math.min(Math.round(Game.cam.x) + 384 - w - 4, bx));
  ctx.save(); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#1d1622';
  ctx.fillRect(bx - 1, by, w + 2, h); ctx.fillRect(bx, by - 1, w, h + 2);
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(bx, by, w, h);
  // colita
  ctx.fillStyle = '#1d1622'; ctx.fillRect(x - 3, by + h, 7, 1); ctx.fillRect(x - 2, by + h + 1, 5, 1); ctx.fillRect(x - 1, by + h + 2, 3, 1); ctx.fillRect(x, by + h + 3, 1, 1);
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(x - 2, by + h, 5, 1); ctx.fillRect(x - 1, by + h + 1, 3, 1); ctx.fillRect(x, by + h + 2, 1, 1);
  lines.forEach((l, i) => drawText(ctx, l, bx + w / 2, by + 3 + i * 9, { color: '#1d1622', align: 'center' }));
  ctx.restore();
}

// Profesores en huelga frente al colegio: marchan en el sitio con su
// pancarta y, cuando te acercas, explican por turnos qué pasa.
class Striker extends Actor {
  constructor(def) {
    const base = def.y * TS;
    super(def.x * TS, base - 27, 14, 27);
    this.base = base; this.v = def.v || 0; this.sign = def.sign; this.say = def.say; this.slot = def.slot || 0;
    this.flip = !!def.flip; this.animT = def.v * 17;
  }
  update(g) { this.animT++; }
  draw(ctx, g) {
    const img = this.v ? OBJ.teacher2 : OBJ.teacher;
    const step = Math.floor(this.animT / 18) % 2;          // marcha en el sitio
    const x = Math.round(this.x), y = this.base - 27 - step;
    ctx.drawImage(this.flip ? flipS(img) : img, x, y);
    // pancarta en alto, se mueve con el ritmo de la marcha
    const px = x + 7, py = y - 22 + (Math.floor(this.animT / 18) % 2 ? 1 : 0);
    ctx.fillStyle = '#6b4524'; ctx.fillRect(px, py + 10, 2, 24);
    const w = Math.max(...this.sign.map(l => textWidth(l))) + 6, h = this.sign.length * 9 + 3;
    ctx.fillStyle = '#1d1622'; ctx.fillRect(px + 1 - w / 2 - 1, py - h + 10 - 1, w + 2, h + 2);
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(px + 1 - w / 2, py - h + 10, w, h);
    this.sign.forEach((l, i) => drawText(ctx, l, px + 1, py - h + 12 + i * 9, { color: '#d8432f', align: 'center' }));
    // hablan por turnos cuando el niño está cerca
    const p = g.player, d = Math.abs(p.cx - (this.x + 7));
    const onScreen = x > g.cam.x + 2 && x + 14 < g.cam.x + 382;
    if (d < 170 && !p.won && onScreen) {
      const who = Math.floor((g.T || 0) / 170) % 2;
      if (who === this.slot) drawBubble(ctx, this.say, x + 7, py - h + 6);
    }
  }
}

// Mototaxi (torito) estacionado, de perfil: cabina cerrada blanca con dos
// puertas y ventanas, frente del color de la moto con parabrisas grande,
// direccional ámbar, panel oscuro con faro y la rueda delantera bajo la trompa.
// Colores tomados de fotos reales (modelo rojo y modelo azul).
const TORITO = {
  rojo: { body: '#c31c14', mid: '#b82a20', dark: '#741114', panel: '#221f26', glass: '#283136', glassHi: '#3c4850', stripe: '#c31c14' },
  azul: { body: '#1268a1', mid: '#0b5489', dark: '#144472', panel: '#4b5262', glass: '#7a879a', glassHi: '#a4b2c2', stripe: '#4e8bc1' },
};
const TORITO_WHITE = '#eef2f2', TORITO_WHITE2 = '#cfcfcf', TORITO_SHADE = '#a4adac';
class Mototaxi extends Actor {
  constructor(def) {
    const base = def.y * TS;
    super(def.x * TS, base - 38, 52, 38);
    this.base = base; this.c = TORITO[def.model] || TORITO.rojo; this.flip = !!def.flip; this.t = Math.floor(def.x * 7) % 300; this.run = !!def.run;
  }
  update(g) {
    this.t++;
    if (this.run && this.t % 40 === 0) g.particles.push({ x: this.flip ? this.x + 50 : this.x + 1, y: this.base - 5, vx: this.flip ? 0.25 : -0.25, vy: -0.2, life: 50, max: 50, col: '#c8c2cc', size: 2, grav: -0.004 });
  }
  draw() {}
  drawBack(ctx) {
    const c = this.c, base = this.base, bx = Math.round(this.x), sh = this.run && Math.floor(this.t / 3) % 2 ? -1 : 0;
    ctx.save();
    if (this.flip) { ctx.translate(bx * 2 + 52, 0); ctx.scale(-1, 1); }
    const R = (col, x, y, w, h) => { ctx.fillStyle = col; ctx.fillRect(bx + x, base + y + sh, w, h); };
    const wheel = (cx) => {
      ctx.fillStyle = '#232429'; ctx.beginPath(); ctx.arc(bx + cx, base - 5, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#88929c'; ctx.fillRect(bx + cx - 2, base - 7, 4, 4); ctx.fillStyle = '#232429'; ctx.fillRect(bx + cx - 1, base - 6, 2, 2);
    };
    ctx.fillStyle = 'rgba(30,20,20,0.25)'; ctx.fillRect(bx + 1, base - 1, 50, 2);   // sombra
    wheel(9);
    // techo blanco con el filo del color de la moto; sobresale sobre el parabrisas
    R(TORITO_WHITE, 3, -42, 42, 1); R(TORITO_WHITE, 2, -41, 45, 3); R(TORITO_SHADE, 2, -38, 45, 1);
    R(c.stripe, 8, -43, 22, 1);
    // cabina trasera blanca con dos puertas, esquina de atrás redondeada
    R(TORITO_WHITE, 1, -37, 27, 30); R(TORITO_WHITE2, 1, -37, 2, 30); R(TORITO_WHITE2, 1, -37, 3, 1);
    R(TORITO_SHADE, 13, -36, 1, 29); R(TORITO_SHADE, 27, -36, 1, 29);          // juntas de las puertas
    R(c.glass, 4, -35, 7, 11); R(c.glassHi, 5, -34, 2, 4);                      // ventana trasera
    R(c.glass, 16, -35, 9, 12); R(c.glassHi, 17, -34, 2, 4);                   // ventana de la puerta
    R(c.body, 17, -21, 3, 1); R(c.body, 5, -22, 3, 1);                           // manijas
    for (let y = -20; y < -15; y += 2) R(TORITO_WHITE2, 3, y, 8, 1);           // rejilla
    R(TORITO_WHITE2, 14, -9, 13, 2);                                             // zócalo de la puerta
    // parte baja trasera del color de la moto, con el arco de la rueda
    R(c.body, 1, -14, 13, 8); R(c.mid, 1, -9, 13, 2); R(c.dark, 1, -7, 3, 1); R(c.dark, 13, -7, 1, 1);
    // frente: parante con parabrisas grande
    R(c.body, 28, -38, 15, 19);
    R(c.glass, 29, -37, 13, 15); R(c.glassHi, 30, -36, 3, 7);
    R('#232429', 35, -36, 1, 1); R('#232429', 36, -35, 1, 1); R('#232429', 37, -34, 1, 1); R('#232429', 38, -33, 1, 1);   // plumilla
    // trompa redondeada que sobresale abajo
    const nose = [[-21, 45], [-20, 46], [-19, 47], [-18, 48], [-17, 49], [-16, 49], [-15, 50], [-14, 50], [-13, 50], [-12, 49], [-11, 48], [-10, 46], [-9, 43], [-8, 40]];
    for (const [y, x1] of nose) R(c.body, 28, y, x1 - 28, 1);
    R(c.body, 43, -38, 1, 17);
    for (const [y, x1] of nose.slice(-4)) R(c.mid, 28, y, x1 - 28, 1);
    R(c.dark, 28, -8, 12, 1);
    R('#be6023', 30, -21, 7, 2);                                                 // direccional ámbar
    R(c.panel, 41, -18, 8, 7); R(c.panel, 40, -17, 1, 5);                        // panel del frente
    ctx.fillStyle = '#d3dce1'; ctx.beginPath(); ctx.arc(bx + 46, base - 15 + sh, 2.5, 0, Math.PI * 2); ctx.fill();
    R('#ffffff', 45, -16, 1, 1);
    // horquilla
    R('#232429', 46, -9, 2, 4);
    ctx.restore();
    // rueda delantera (sin el temblor del motor) con su guardafango
    ctx.save(); if (this.flip) { ctx.translate(bx * 2 + 52, 0); ctx.scale(-1, 1); }
    wheel(46);
    ctx.fillStyle = c.body; ctx.fillRect(bx + 41, base - 11, 11, 2); ctx.fillRect(bx + 40, base - 10, 2, 2); ctx.fillRect(bx + 51, base - 10, 1, 2);
    ctx.fillStyle = c.mid; ctx.fillRect(bx + 42, base - 9, 9, 1);
    ctx.restore();
  }
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
    // habla mientras llegas; al acercarte a tu sitio se calla para que se vea la pizarra
    if (Math.abs(g.player.cx - this.teacherX) < 260 && g.player.cx < this.spot - 30 && !this.done) drawBubble(ctx, ['EL COLE SE PUEDE CAER:', 'HOY LA CLASE ES AFUERA.', '¡SIÉNTATE CON TODOS!'], this.teacherX + 7, base - 30);
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
    // agita la mano con calma (cambia de pose cada ~0,6 s)
    const wave = near && Math.floor(this.animT / 36) % 2 === 0;
    const img = OBJ.mom[wave ? 1 : 0];
    ctx.drawImage(p.cx < bx + 44 ? flipS(img) : img, bx + 36, base - 25);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// LA SELVA INUNDADA
// ═════════════════════════════════════════════════════════════════════════════
const SWAMP_SURFACE = (level, x) => {
  for (const l of level.liquids) if (l.kind === 'swamp' && x >= l.x * TS && x < (l.x + l.w) * TS) return l.y * TS + 4;
  return null;
};

// Victoria regia: flota, pero si te quedas encima se hunde poco a poco.
class LilyPad extends Actor {
  constructor(x, level) {
    super(x * TS - 14, 0, 28, 4);
    this.isMover = true; this.dx = 0; this.dy = 0; this.level = level;
    this.base = SWAMP_SURFACE(level, this.cx) - 3; this.y = this.base;
    this.sink = 0; this.falling = false; this.goneT = 0; this.t = Math.random() * 6;
  }
  onRespawn() { this.sink = 0; this.falling = false; this.goneT = 0; this.y = this.base; }
  update(g) {
    const py = this.y; this.t += 0.05;
    if (this.falling) {
      // hundida: vuelve a salir al rato
      if (++this.goneT > 170) { this.falling = false; this.sink = 0; this.goneT = 0; }
      this.y = this.base + 12;
    } else {
      if (g.player.lastMover === this && !g.player.swimming) { this.sink += 0.085; if (Math.floor(this.sink * 10) % 12 === 0) g.burst(this.cx + (Math.random() * 20 - 10), this.base + 3, 'swampSplash', 1); }
      else this.sink = Math.max(0, this.sink - 0.05);
      if (this.sink > 6) { this.falling = true; g.burst(this.cx, this.base + 3, 'swampSplash', 10); }
      this.y = this.base + this.sink + (Math.sin(this.t) > 0.6 ? 1 : 0) * (this.sink < 0.5 ? 1 : 0);
    }
    this.dy = this.y - py;
  }
  draw(ctx) {
    if (this.falling && this.goneT < 150) return;
    const a = this.falling ? (this.goneT - 150) / 20 : 1;
    ctx.save(); ctx.globalAlpha = a;
    ctx.drawImage(OBJ.lily, Math.round(this.cx - 15), Math.round(this.y - 1));
    ctx.restore();
  }
}

// Tronco podrido colgado de lianas: crujen al pisarlo, se deshilachan y se
// cortan; el tronco cae al agua. Al rato aparece otro colgado.
class DryBranch extends Actor {
  constructor(x, y) {
    super(x * TS, y * TS, 46, 6);
    this.isMover = true; this.dx = 0; this.dy = 0; this.hx = this.x; this.hy = this.y;
    this.crack = 0; this.falling = false; this.goneT = 0; this.vy = 0; this.rot = 0; this.animT = 0;
  }
  onRespawn() { this.crack = 0; this.falling = false; this.goneT = 0; this.x = this.hx; this.y = this.hy; this.vy = 0; this.rot = 0; }
  update(g) {
    const py = this.y; this.animT++;
    if (this.falling) {
      this.goneT++; this.vy = Math.min(this.vy + 0.35, 6); this.y += this.vy; this.rot += 0.04;
      const s = SWAMP_SURFACE(g.level, this.cx);
      if (s && this.y > s && this.y - this.vy <= s) { g.burst(this.cx, s, 'swampSplash', 14); if (g.near(this.cx, 240)) g.audio('splash'); }
      if (this.goneT > 260) this.onRespawn();
    } else if (g.player.lastMover === this) {
      if (this.crack === 0) g.audio('creak');
      if (this.crack % 8 === 4) g.burst(this.hx + (this.crack % 16 < 8 ? 7 : 39), this.y - 6, 'leaf', 1);
      if (++this.crack > 30) { this.falling = true; this.vy = 0.5; g.burst(this.hx + 7, this.y - 4, 'leaf', 6); g.burst(this.hx + 39, this.y - 4, 'leaf', 6); g.audio('snap'); }
    } else if (this.crack > 0) this.crack = Math.max(0, this.crack - 0.5);
    this.dy = this.y - py;
  }
  // dos lianas que bajan desde las copas y sostienen el tronco
  drawVines(ctx, len, fray) {
    const t = this.animT;
    for (const [i, ox] of [[0, 7], [1, 39]]) {
      const bx = Math.round(this.hx + ox), top = Math.round(this.hy) - 170;
      const L = len == null ? 170 : len[i];
      for (let y = 0; y < L; y += 2) {
        const k = y / 170, sw = Math.round(Math.sin(t * 0.04 + i * 2 + y * 0.03) * (len == null ? fray * 1.5 : 3) * k);
        // al deshilacharse se ven huecos cerca del nudo
        if (fray > 0 && L - y < 14 && (y >> 1) % 3 === 0) continue;
        ctx.fillStyle = '#3f6b2c'; ctx.fillRect(bx + sw, top + y, 2, 2);
        if (y % 14 === 6) { ctx.fillStyle = '#5f9f4a'; ctx.fillRect(bx + sw + 2, top + y, 2, 1); }
      }
      if (len == null) { ctx.fillStyle = '#2e4f20'; ctx.fillRect(bx - 1, top + L - 2, 4, 3); } // nudo
    }
  }
  draw(ctx) {
    if (this.falling) {
      // las lianas cortadas quedan colgando y se mecen
      const L = Math.max(120, 168 - this.goneT * 2);
      if (this.goneT <= 230) this.drawVines(ctx, [L, L - 10], 0);
      else { ctx.save(); ctx.globalAlpha = (this.goneT - 230) / 30; this.drawVines(ctx, null, 0); ctx.drawImage(OBJ.dryBranch, Math.round(this.hx), Math.round(this.hy)); ctx.restore(); return; }
    } else this.drawVines(ctx, null, this.crack / 30);
    if (this.falling && this.goneT > 230) return;
    const sh = this.crack > 0 && !this.falling ? (this.crack % 4 < 2 ? 1 : -1) * Math.min(1, this.crack / 10) : 0;
    ctx.save(); ctx.translate(Math.round(this.cx + sh), Math.round(this.y + 3)); ctx.rotate(this.rot);
    ctx.drawImage(OBJ.dryBranch, -24, -3); ctx.restore();
  }
}

// Perezoso colgado de una rama firme: gira la cabeza (despacio) para mirarte.
class Sloth extends Actor {
  constructor(x, y) { super(x * TS - 10, y * TS + 3, 20, 18); this.face = -1; this.turnT = 0; this.animT = Math.random() * 100; }
  update(g) {
    this.animT++;
    const want = g.player.cx < this.cx ? -1 : 1;
    if (want !== this.face) { if (++this.turnT > 70) { this.face = want; this.turnT = 0; } } else this.turnT = 0;
  }
  draw(ctx) {
    const img = this.face < 0 ? E.sloth.left : E.sloth.right;
    const sway = Math.round(Math.sin(this.animT * 0.02) * 1);
    ctx.drawImage(img, Math.round(this.x + sway), Math.round(this.y));
  }
}

// CAIMÁN: patrulla con solo los ojos fuera. Si nadas, va a por ti. Si estás en
// una piedra, hoja o rama baja, se acerca por debajo, burbujea... y salta.
class Caiman extends Actor {
  constructor(def, level) {
    super(def.x0 * TS + 20, 0, 34, 10);
    this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.canLeap = def.leap;
    this.s = SWAMP_SURFACE(level, this.x0 + 8); this.y = this.s - 4;
    this.dir = 1; this.state = 'patrol'; this.t = 0; this.cool = 60; this.animT = Math.random() * 50;
    this.vx = 0; this.vy = 0; this.homeX = this.x;
  }
  onRespawn() { this.state = 'patrol'; this.x = this.homeX; this.y = this.s - 4; this.cool = 120; this.vy = 0; }
  get dangerous() { return this.state === 'leap' || this.state === 'chase'; }
  get hitbox() { return this.state === 'leap' ? { x: this.x + 2, y: this.y - 2, w: this.w - 4, h: this.h + 2 } : { x: this.x + 6, y: this.y - 2, w: this.w - 12, h: 10 }; }
  update(g) {
    const p = g.player; this.animT++; this.t++;
    if (this.cool > 0) this.cool--;
    const inRange = p.cx > this.x0 - 30 && p.cx < this.x1 + 30;
    const feet = p.y + p.h;
    const swimTo = (tx, sp) => { const d = tx - this.cx; this.x += Math.max(-sp, Math.min(sp, d)); if (Math.abs(d) > 1) this.dir = Math.sign(d); this.x = Math.max(this.x0, Math.min(this.x1 - this.w, this.x)); };
    switch (this.state) {
      case 'patrol':
        this.x += this.dir * 0.45;
        if (this.x < this.x0 || this.x + this.w > this.x1) this.dir *= -1;
        if (p.swimming && inRange) { this.state = 'chase'; this.t = 0; }
        else if (this.canLeap && this.cool <= 0 && inRange && !p.riding && p.onGround && feet > this.s - 80 && feet <= this.s + 2) { this.state = 'stalk'; this.t = 0; }
        break;
      case 'chase':
        // va a por el niño que nada
        swimTo(p.cx, 1.25);
        if (!p.swimming || !inRange) { this.state = 'patrol'; this.cool = 60; }
        break;
      case 'stalk':
        // se acerca por debajo hasta donde estás
        swimTo(p.cx + p.vx * 20, 1.5);
        if (Math.abs(this.cx - p.cx) < 10) { this.state = 'aim'; this.t = 0; g.audio('gurgle'); }
        if (!inRange || p.swimming || this.t > 360) { this.state = 'patrol'; this.cool = 90; }
        break;
      case 'aim':
        // el agua hierve: burbujas grandes y salpicaduras; va a saltar
        if (this.t % 2 === 0) g.particles.push({ x: this.cx + (Math.random() * 22 - 11), y: this.s, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random() * 1.2, life: 22, max: 22, col: Math.random() < 0.5 ? '#ffffff' : '#c8ebd2', size: Math.random() < 0.5 ? 2 : 1, grav: 0.05 });
        if (this.t === 20) g.audio('gurgle');
        if (this.t > 46) {
          this.state = 'leap'; this.t = 0;
          this.vy = -7.4; this.vx = Math.max(-1.6, Math.min(1.6, (p.cx + p.vx * 22 - this.cx) / 23));
          g.audio('snap'); g.burst(this.cx, this.s, 'swampSplash', 16);
        }
        break;
      case 'leap':
        this.vy += 0.32; this.y += this.vy; this.x += this.vx;
        if (this.vx) this.dir = Math.sign(this.vx);
        if (this.vy > 0 && this.y >= this.s - 4) { this.y = this.s - 4; this.vy = 0; this.vx = 0; this.state = 'patrol'; this.cool = 160; g.burst(this.cx, this.s, 'swampSplash', 18); if (g.near(this.cx, 260)) g.audio('splash'); }
        break;
    }
  }
  draw(ctx, g) {
    if (this.state === 'leap') {
      const img = this.t % 16 < 10 ? E.caiman.open : E.caiman.shut;
      ctx.save(); ctx.translate(Math.round(this.cx), Math.round(this.y + 4));
      ctx.rotate(Math.atan2(this.vy, 4) * 0.7 * this.dir); if (this.dir < 0) ctx.scale(-1, 1);
      ctx.drawImage(img, -20, -9); ctx.restore();
      return;
    }
    // en el agua solo asoman los ojos, el hocico y la cresta del lomo
    const s = this.s, x = Math.round(this.cx), d = this.dir;
    const sink = 0;
    // la silueta oscura del cuerpo bajo el agua: se le ve venir
    ctx.save(); ctx.globalAlpha = 0.45; ctx.beginPath(); ctx.rect(x - 30, s + 1, 60, 20); ctx.clip();
    if (!Caiman.shadow) Caiman.shadow = PIX.tinted(E.caiman.shut, '#0d1f14');
    const body = d < 0 ? flipS(Caiman.shadow) : Caiman.shadow;
    ctx.drawImage(body, x - 20 + (d > 0 ? -6 : 6), s - 4 + sink);
    ctx.restore();
    ctx.fillStyle = '#2f5a2c';
    for (let i = -14; i <= 6; i += 5) ctx.fillRect(x - i * d - 1, s - 1 + sink, 3, 1);                  // cresta
    ctx.fillStyle = '#3f6b3a'; ctx.fillRect(x + d * 8 - 3, s - 3 + sink, 6, 3); ctx.fillRect(x + d * 15 - 1, s - 2 + sink, 4, 2); // ojos y hocico
    ctx.fillStyle = '#f6c94a'; ctx.fillRect(x + d * 8 - 2, s - 3 + sink, 1, 1); ctx.fillRect(x + d * 8 + 1, s - 3 + sink, 1, 1);
    if (this.state === 'aim') {
      // va a saltar: los ojos asoman y brillan, anillos de ondas y un "!" blanco
      const rise = Math.min(3, Math.floor(this.t / 6));
      ctx.fillStyle = '#3f6b3a'; ctx.fillRect(x + d * 8 - 4, s - 4 - rise, 8, 3 + rise);
      ctx.fillStyle = Math.floor(this.t / 4) % 2 ? '#fff6b0' : '#f6c94a';
      ctx.fillRect(x + d * 8 - 3, s - 4 - rise, 2, 2); ctx.fillRect(x + d * 8 + 1, s - 4 - rise, 2, 2);
      for (let k = 0; k < 2; k++) {
        const ph = (this.t * 1.2 + k * 14) % 28, r = 6 + ph, a = 1 - ph / 28;
        ctx.fillStyle = 'rgba(230,250,235,' + (0.8 * a).toFixed(2) + ')';
        ctx.fillRect(Math.round(x - r), s, 4, 1); ctx.fillRect(Math.round(x + r - 4), s, 4, 1);
        ctx.fillRect(Math.round(x - r * 0.6), s + 1, Math.round(r * 1.2), 1);
      }
      // "!" fijo (no parpadea) y que sube un poco: imposible no verlo
      drawText(ctx, '!', x, s - 26 - Math.min(4, Math.floor(this.t / 8)), { scale: 2, color: Math.floor(this.t / 6) % 2 ? '#ffffff' : '#fff6b0', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
    }
    ctx.fillStyle = 'rgba(200,235,210,0.6)';                                                          // estela en V
    const w = 4 + (this.animT % 20) / 2;
    ctx.fillRect(x - d * 10 - d * w, s, 3, 1); ctx.fillRect(x - d * 10 - d * w, s + 2, 3, 1);
  }
}

// PUENTE COLGANTE INCA (tipo Q'eswachaka): cuerdas de ichu trenzado y tablas.
// Se mece y se hunde un poco bajo tus pies.
class Bridge extends Actor {
  constructor(def) { super(def.x0 * TS - 6, def.row * TS - 20, (def.x1 - def.x0) * TS + 12, 24); this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.deckY = def.row * TS; this.bounce = 0; this.animT = 0; this.px = -1; }
  update(g) {
    this.animT++;
    const p = g.player, a = p.riding || p;
    const on = a.onGround && Math.abs(a.y + a.h - this.deckY) < 2 && a.cx > this.x0 && a.cx < this.x1;
    this.px = on ? a.cx : -1;
    this.bounce += ((on ? Math.min(3, 1 + Math.abs(a.vx)) : 0) - this.bounce) * 0.08;
  }
  sagAt(x) {
    const t = (x - this.x0) / (this.x1 - this.x0);
    let s = Math.sin(Math.PI * t) * (1.5 + this.bounce * 0.6);
    if (this.px > 0) s += Math.max(0, 1 - Math.abs(x - this.px) / 40) * this.bounce * 0.5;
    return s + Math.sin(this.animT * 0.05 + t * 3) * 0.4;
  }
  draw(ctx) {
    const x0 = this.x0, x1 = this.x1, y = this.deckY;
    // postes de madera en cada lado
    for (const px of [x0 - 5, x1 + 1]) { ctx.fillStyle = '#5a3a1e'; ctx.fillRect(px, y - 18, 4, 22); ctx.fillStyle = '#8a5a30'; ctx.fillRect(px, y - 18, 1, 22); ctx.fillStyle = '#3a2412'; ctx.fillRect(px - 1, y - 19, 6, 2); }
    // cuerdas pasamanos (cuelgan más que el piso)
    const rope = (yy, sagK) => { for (let x = x0 - 3; x <= x1 + 3; x++) { const t = (x - x0) / (x1 - x0); const sag = Math.sin(Math.PI * Math.max(0, Math.min(1, t))) * (6 + this.bounce * 2) * sagK + this.sagAt(Math.max(x0, Math.min(x1, x))) * 0.6; ctx.fillStyle = '#b88f3a'; ctx.fillRect(x, Math.round(yy + sag), 1, 1); ctx.fillStyle = '#7a5a20'; ctx.fillRect(x, Math.round(yy + sag) + 1, 1, 1); } };
    // colgantes verticales de la cuerda al piso
    ctx.fillStyle = '#9a7a30';
    for (let x = x0 + 6; x < x1; x += 10) { const t = (x - x0) / (x1 - x0); const top = y - 16 + Math.sin(Math.PI * t) * (6 + this.bounce * 2) + this.sagAt(x) * 0.6; const bot = y + this.sagAt(x); ctx.fillRect(x, Math.round(top), 1, Math.max(1, Math.round(bot - top))); }
    rope(y - 16, 1);
    // tablas del piso
    for (let x = x0; x < x1; x += 4) {
      const yy = Math.round(y + this.sagAt(x + 2));
      ctx.fillStyle = (x / 4) % 3 === 0 ? '#7a4f28' : '#9b663b'; ctx.fillRect(x, yy, 3, 3);
      ctx.fillStyle = '#4a2f18'; ctx.fillRect(x, yy + 3, 3, 1);
    }
    // cuerdas bajo el piso
    for (let x = x0; x < x1; x++) { ctx.fillStyle = '#7a5a20'; ctx.fillRect(x, Math.round(y + 4 + this.sagAt(x)), 1, 1); }
  }
}

function makeEntity(def, level) {
  switch (def.type) {
    case 'llama': return new Llama(def.x * TS, def.y * TS);
    case 'cabra': return new Cabra(def.x * TS, def.y * TS);
    case 'rockfall': return new Rockfall(def.x, def.y, def.interval);
    case 'huaico': return new Huaico(def, level);
    case 'collapseHouse': return new CollapseHouse(def.x, def.y);
    case 'striker': return new Striker(def);
    case 'mototaxi': return new Mototaxi(def);
    case 'checkpoint': return new Checkpoint(def.x, def.y, def.w, def.h);
    case 'house': return new House(def.x, def.y);
    case 'school': return new School(def.x, def.y);
    case 'lily': return new LilyPad(def.x, level);
    case 'dryBranch': return new DryBranch(def.x, def.y);
    case 'sloth': return new Sloth(def.x, def.y);
    case 'caiman': return new Caiman(def, level);
    case 'bridge': return new Bridge(def);
    case 'outdoorClass': return new OutdoorClass(def.x, def.y);
    case 'leaf': return new Leaf(def.x, def.y);
    case 'eagle': return new Eagle(def);
    case 'page': return new Pickup('page', def.x, def.y);
    case 'herb': return new Pickup('herb', def.x, def.y);
    case 'condor': return new Condor(def);
    default: return null;
  }
}
