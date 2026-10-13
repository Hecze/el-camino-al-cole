// entities3.js — entidades del Capítulo 3: la alpaca, las alpacas que escupen,
// turistas, comparsas, las mantas del mercado, el tren a Aguas Calientes y la
// foto grupal en Machu Picchu. Todo se registra en EXTRA_ENTITIES.
(() => {
  const A3 = ART3;
  const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const hash = (n) => { n = (n | 0) ^ 0x9e3779b9; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  const onScreen = (x, w, pad = 40) => x + w > Game.cam.x - pad && x < Game.cam.x + VIEW.w + pad;

  // globo de diálogo con texto (encima de un personaje)
  function bubble(ctx, cx, bottom, lines, tx = cx) {
    const w = Math.max(...lines.map(l => textWidth(l))) + 8, h = lines.length * 9 + 3;
    const x = Math.round(cx - w / 2), y = Math.round(bottom - h - 4);
    R(ctx, '#1d1622', x - 1, y - 1, w + 2, h + 2);
    R(ctx, '#fffaf0', x, y, w, h);
    R(ctx, '#fffaf0', Math.round(tx) - 1, y + h, 3, 2); R(ctx, '#fffaf0', Math.round(tx), y + h + 2, 1, 2);
    lines.forEach((l, i) => drawText(ctx, l, cx, y + 2 + i * 9, { color: '#27426e', align: 'center' }));
  }

  // sonidos propios del capítulo
  AUDIO.addSfx('spit', ({ tone, noise }) => { noise(0.14, 0.4, 1800, 0, { type: 'bandpass', q: 1.2, sweep: 500 }); tone(320, 0.12, 'sine', 0.2, 0, 120); });
  AUDIO.addSfx('whistle', ({ tone, noise, now }) => {
    const t = now();
    [0, 0.42].forEach((d, i) => { const L = i ? 0.75 : 0.32; tone(740, L, 'triangle', 0.13, t + d); tone(932, L, 'triangle', 0.09, t + d); tone(1109, L, 'sine', 0.05, t + d); noise(L, 0.05, 2200, t + d, { type: 'bandpass', q: 2 }); });
  });
  AUDIO.addSfx('click', ({ noise, now }) => { noise(0.03, 0.45, 4200, 0, { type: 'highpass' }); noise(0.04, 0.3, 3000, now() + 0.08, { type: 'highpass' }); });
  AUDIO.addSfx('clank', ({ tone, noise }) => { tone(190, 0.18, 'square', 0.14, 0, 90); noise(0.25, 0.35, 1400, 0, { type: 'bandpass', q: 3 }); });

  // ═══════════════════════════════════════════════════════════════════════════
  // estado del capítulo: lo que se cuenta para la pantalla final
  class State3 { constructor() { Game.selfies3 = 0; } update() {} draw() {} }

  // ═══════════════════════════════════════════════════════════════════════════
  // LA ALPACA DE LA FOTO: se monta como la llama y salta de tejado en tejado.
  // En el mercado de Pisac se queda comiendo choclo y sigues a pie.
  class Alpaca extends Llama {
    constructor(def) { super(def.x * TS, def.y * TS); this.retireX = def.retireX ? def.retireX * TS : 0; }
    update(g) {
      super.update(g);
      if (this.rider && this.retireX && this.onGround && this.cx > this.retireX) {
        this.retired = true; this.vx = 0; this.rider.dismount(g, -4.2);
        g.audio('bleat'); g.toast('LA ALPACA SE QUEDA A COMER CHOCLO');
      }
    }
    draw(ctx) {
      const S = A3.ALP.foto;
      let img;
      if (!this.onGround) img = S.jump;
      else if (Math.abs(this.vx) > 0.2) img = S.run[Math.floor(this.animT / Math.max(3, 9 - Math.abs(this.vx) * 2)) % 4];
      else img = S.idle;
      // retirada: mastica su choclo
      const chew = (this.retired || !this.rider) && this.onGround && Math.floor(this.animT / (this.retired ? 12 : 40)) % 3 === 0 ? -1 : 0;
      ctx.drawImage(this.facing < 0 ? flipS(img) : img, Math.round(this.cx - 13 + (this.facing < 0 ? 3 : -3)), Math.round(this.y + this.h - 24 + chew));
      if (this.retired) { R(ctx, '#f6c94a', this.cx + 10, this.y + 2, 4, 2); R(ctx, '#93a84a', this.cx + 13, this.y + 2, 2, 2); }
    }
  }

  // la señora de "FOTO CON ALPACA": reclama cuando te llevas a su alpaca
  class PhotoLady extends Actor {
    constructor(def) { const base = def.y * TS; super(def.x * TS, base - 25, 16, 25); this.base = base; this.animT = 0; this.angryT = 0; }
    update(g) {
      this.animT++;
      if (this.angryT > 0) this.angryT++;
      if (!this.angryT && g.player.riding instanceof Alpaca) this.angryT = 1;
    }
    draw(ctx, g) {
      const x = Math.round(this.x), b = this.base;
      // caballete con el cartel
      R(ctx, '#6b4524', x - 60, b - 18, 2, 18); R(ctx, '#6b4524', x - 20, b - 18, 2, 18);
      R(ctx, '#1d1622', x - 76, b - 37, 74, 21); R(ctx, '#f6c94a', x - 75, b - 36, 72, 19);
      drawText(ctx, 'FOTO CON', x - 39, b - 34, { color: '#962a22', align: 'center' });
      drawText(ctx, 'ALPACA S/ 1', x - 39, b - 25, { color: '#27426e', align: 'center' });
      const p = g.player, angry = this.angryT > 0 && this.angryT < 260;
      const img = OBJ.mom[angry && Math.floor(this.animT / 8) % 2 ? 1 : 0];
      ctx.drawImage(p.cx < x + 8 ? flipS(img) : img, x, b - 25);
      if (angry) bubble(ctx, x + 40, b - 40, ['¡OYE, MI ALPACA!', '¡ME LA DEVUELVES, OÍSTE!'], x + 8);
      else if (!this.angryT && Math.abs(p.cx - x) < 110) bubble(ctx, x + 40, b - 40, ['¡FOTITO CON ALPACA,', 'CASERITO!'], x + 8);
    }
  }

  // ALPACA QUE ESCUPE: desde los techos te mira, infla los cachetes... y ¡ptuh!
  class Spitter extends Actor {
    constructor(def) {
      super(def.x * TS, def.y * TS - 20, 20, 20);
      this.face = def.face || -1; this.kind = def.kind || 'cafe';
      this.state = 'idle'; this.t = 0; this.cool = 50; this.animT = Math.floor(def.x * 13) % 60;
    }
    onRespawn() { this.state = 'idle'; this.cool = 90; }
    mouth() { return { x: this.face > 0 ? this.cx + 12 : this.cx - 12, y: this.y + this.h - 18 }; }
    update(g) {
      this.animT++;
      const p = g.player, body = p.riding || p, dx = body.cx - this.cx;
      if (Math.abs(dx) > 6) this.face = dx < 0 ? -1 : 1;
      const near = Math.abs(dx) < 11 * TS && Math.abs(dx) > 20 && Math.abs(body.cy - this.cy) < 48 && g.state === 'play';
      if (this.state === 'idle') { if (this.cool > 0) this.cool--; else if (near) { this.state = 'windup'; this.t = 0; } }
      else if (++this.t >= 36) {
        const m = this.mouth();
        g.addEntity(new Spit(m.x, m.y, this.face * 2.0));
        if (g.near(this.cx, 300)) g.audio('spit');
        this.state = 'idle'; this.cool = 105;
      }
    }
    draw(ctx) {
      const img = A3.ALP[this.kind].idle, f = this.face;
      const bob = this.state === 'idle' && Math.floor(this.animT / 40) % 3 === 0 ? -1 : 0;
      ctx.drawImage(f < 0 ? flipS(img) : img, Math.round(this.cx - 13 + (f < 0 ? 3 : -3)), Math.round(this.y + this.h - 24 + bob));
      if (this.state === 'windup') {
        // cachetes inflados y un "!" para que lo veas venir
        const m = this.mouth(), r = 1 + Math.min(2, Math.floor(this.t / 10));
        R(ctx, '#cfe8c0', m.x - r - (f < 0 ? 0 : 1), m.y - r, r * 2 + 1, r * 2 + 1);
        R(ctx, '#ffffff', m.x - 1, m.y - 1, 1, 1);
        if (Math.floor(this.t / 5) % 2 === 0) drawText(ctx, '!', Math.round(this.cx + f * 6), Math.round(this.y - 26), { scale: 2, color: '#ffffff', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
      }
    }
  }
  class Spit {
    constructor(x, y, vx) { this.x = x - 2; this.y = y - 2; this.w = 4; this.h = 4; this.vx = vx; this.vy = -0.2; this.t = 0; this.hazardKind = 'spit'; }
    onRespawn() { this.dead = true; }
    update(g) {
      this.t++; this.vy += 0.018; this.x += this.vx; this.y += this.vy;
      if (this.t > 240 || isSolidCode(g.level.tile(Math.floor((this.x + 2) / TS), Math.floor((this.y + 2) / TS)))) { this.dead = true; g.burst(this.x + 2, this.y + 2, 'swampSplash', 6); }
      if (this.t % 3 === 0) g.particles.push({ x: this.x + 2 - Math.sign(this.vx) * 3, y: this.y + 2, vx: 0, vy: 0.2, life: 14, max: 14, col: '#cfe8c0', size: 1, grav: 0.05 });
    }
    hazardBox() { return this.dead ? null : { x: this.x, y: this.y, w: this.w, h: this.h }; }
    draw(ctx) { ctx.drawImage(A3.SPIT, Math.round(this.x), Math.round(this.y)); }
  }

  // TURISTA: te toma una foto cuando pasas (salir en fotos ajenas también cuenta)
  class Tourist extends Actor {
    constructor(def) { const base = def.y * TS; super(def.x * TS, base - 25, 14, 25); this.base = base; this.v = def.v || 0; this.snapT = 0; this.flip = false; }
    update(g) {
      const p = g.player, body = p.riding || p;
      this.flip = body.cx < this.cx;
      if (this.snapT > 0) this.snapT++;
      else if (Math.abs(body.cx - this.cx) < 36 && Math.abs(body.cy - this.cy) < 60) { this.snapT = 1; Game.selfies3 = (Game.selfies3 || 0) + 1; g.audio('click'); }
    }
    draw(ctx) {
      const img = A3.TOURIST[this.v % 2], x = Math.round(this.x), y = this.base - 25;
      ctx.drawImage(this.flip ? flipS(img) : img, x, y);
      if (this.snapT > 0 && this.snapT < 7) {
        // ¡flash!
        const cx = this.flip ? x + 4 : x + 10;
        R(ctx, '#ffffff', cx - 4, y + 13, 9, 1); R(ctx, '#ffffff', cx, y + 9, 1, 9); R(ctx, '#fff6b0', cx - 2, y + 11, 5, 5);
      }
      if (this.snapT > 4 && this.snapT < 80) drawText(ctx, '+1 FOTO', x + 7, y - 10 - Math.floor(this.snapT / 8), { color: '#ffd166', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
    }
  }

  // DANZANTE: baila en la plaza, salta y gira
  class Dancer extends Actor {
    constructor(def) { const base = def.y * TS; super(def.x * TS, base - 22, 14, 22); this.base = base; this.v = def.v || 0; this.animT = (def.phase || 0) * 9; }
    update() { this.animT++; }
    draw(ctx) {
      const set = this.v ? A3.DANCER_B : A3.DANCER, f = Math.floor(this.animT / 14) % 2;
      const img = Math.floor(this.animT / 56) % 2 ? flipS(set[f]) : set[f];
      ctx.drawImage(img, Math.round(this.x), this.base - 22 - (f ? 2 : 0));
    }
  }

  // COMPARSA en la calle de abajo: si caes entre dos casas, te lleva bailando
  class Comparsa extends Actor {
    constructor(def) { const base = def.y * TS; super(def.x0 * TS, base - 40, (def.x1 - def.x0) * TS, 40); this.base = base; this.animT = def.x0 * 7; this.v = def.v || 0; this.hazardKind = 'comparsa'; }
    update() { this.animT++; }
    hazardBox() { return { x: this.x + 3, y: this.base - 34, w: this.w - 6, h: 34 }; }
    draw(ctx) {
      if (!onScreen(this.x, this.w)) return;
      ctx.save(); ctx.beginPath(); ctx.rect(this.x, this.base - 80, this.w, 80); ctx.clip();
      // la calle de abajo en sombra, con papel picado que cae
      R(ctx, 'rgba(30,20,40,0.35)', this.x, this.base - 80, this.w, 80);
      for (let i = 0; i < 6; i++) {
        const px = this.x + mod3(hash(i * 7 + this.v) * this.w + Math.sin(this.animT * 0.05 + i) * 3, this.w), py = this.base - 80 + mod3(this.animT * 0.6 + i * 23, 70);
        R(ctx, ['#f6c94a', '#d8432f', '#3f6fb8', '#5c9f4a'][i % 4], px, py, 2, 1);
      }
      // los danzantes pasan de frente: una fila detrás y otra delante
      for (let row = 0; row < 2; row++) {
        const set = (row + this.v) % 2 ? A3.DANCER_B : A3.DANCER;
        for (let k = -1; k < this.w / 14 + 1; k++) {
          const ph = this.animT + k * 11 + row * 7, f = Math.floor(ph / 12) % 2;
          const x = this.x + k * 14 + (row ? 7 : 0) + Math.round(Math.sin(ph * 0.05) * 3);
          ctx.globalAlpha = row ? 1 : 0.7;
          ctx.drawImage(f ? set[1] : set[0], Math.round(x), this.base - 22 - (row ? 0 : 6) - (f ? 2 : 0));
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }
  }
  const mod3 = (a, n) => ((a % n) + n) % n;

  // LETRERO con texto (madera o pintado)
  const SIGN_COL = { wood: ['#d9ad74', '#3a2414'], red: ['#d8432f', '#ffffff'], blue: ['#2f6fa8', '#ffffff'], green: ['#3f7a4c', '#ffffff'], white: ['#f4efe4', '#27426e'], yellow: ['#f6c94a', '#27426e'] };
  class Sign3 extends Actor {
    constructor(def) { const base = def.y * TS; super(def.x * TS, base - 40, 10, 40); this.base = base; this.lines = def.lines; this.col = SIGN_COL[def.color || 'wood']; this.postH = def.post == null ? 14 : def.post; }
    update() {}
    draw(ctx) {
      const w = Math.max(...this.lines.map(l => textWidth(l))) + 8, h = this.lines.length * 9 + 3;
      const cx = Math.round(this.x + 8), x = cx - Math.round(w / 2), y = this.base - this.postH - h;
      if (!onScreen(x, w)) return;
      if (this.postH > 0) { R(ctx, '#6b4524', cx - 1, y + h, 3, this.postH); R(ctx, '#8a5a30', cx - 1, y + h, 1, this.postH); }
      R(ctx, '#1d1622', x - 1, y - 1, w + 2, h + 2); R(ctx, this.col[0], x, y, w, h);
      this.lines.forEach((l, i) => drawText(ctx, l, cx, y + 2 + i * 9, { color: this.col[1], align: 'center' }));
    }
  }

  // MANTA DEL MERCADO: el toldo tejido de un puesto; si caes encima, rebotas
  const MANTA = [['#d8432f', '#f6c94a', '#3f7a4c', '#f08a7a', '#3f6fb8'], ['#8a4cc0', '#f0913c', '#c2185b', '#f6c94a', '#5c9f4a'], ['#3f6fb8', '#ffffff', '#d8432f', '#f6c94a', '#2a1f2d']];
  class Awning extends Actor {
    constructor(def) {
      super(def.x * TS, def.y * TS, def.w * TS, 6);
      this.isMover = true; this.dx = 0; this.dy = 0; this.ground = def.ground * TS; this.c = MANTA[(def.c || 0) % MANTA.length];
      this.squash = 0; this.bounced = false; this.showHint = !!def.hint; this.goods = def.goods || 'choclo'; this.animT = def.x * 5;
    }
    update(g) {
      this.animT++;
      if (this.squash > 0) this.squash--;
      const p = g.player;
      if (p.lastMover === this && !p.riding) {
        // ¡boing! rebote alto (más alto si mantienes el salto)
        p.vy = -9.4; p.onGround = false; p.noCut = 16; p.lastMover = null; p.y -= 1;
        this.squash = 10; this.bounced = true; g.audio('boing'); g.burst(p.cx, this.y, 'dust', 6);
      }
    }
    hint(g) { const p = g.player; return this.showHint && !this.bounced && Math.abs(p.cx - this.cx) < 110 && !p.riding ? ['¡REBOTA EN LAS MANTAS!'] : null; }
    draw(ctx, g) {
      if (!onScreen(this.x, this.w)) return;
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w, gr = this.ground;
      // postes
      R(ctx, '#6b4524', x + 1, y + 3, 2, gr - y - 3); R(ctx, '#6b4524', x + w - 3, y + 3, 2, gr - y - 3);
      // mesa con mercadería y la casera detrás
      const tx = x + 6, tw = w - 12, ty = gr - 12;
      const vend = OBJ.mom[Math.floor(this.animT / 50) % 2];
      ctx.drawImage(vend, Math.round(x + w / 2 - 8), gr - 25);
      R(ctx, '#8a5a30', tx, ty, tw, 3); R(ctx, '#6b4524', tx + 2, ty + 3, 2, 9); R(ctx, '#6b4524', tx + tw - 4, ty + 3, 2, 9);
      R(ctx, this.c[0], tx, ty + 3, tw, 2);
      for (let i = 0; i < tw - 2; i += 4) {
        const k = hash(i * 7 + x);
        const col = this.goods === 'choclo' ? (k > 0.4 ? '#f6c94a' : '#93a84a') : this.goods === 'papa' ? (k > 0.5 ? '#9b663b' : '#c99a62') : (k > 0.5 ? '#d8432f' : '#f0913c');
        R(ctx, col, tx + 1 + i, ty - 3 - (k > 0.7 ? 1 : 0), 3, 3);
      }
      // la manta tejida: franjas y un fleco abajo; se hunde al rebotar
      const sag = this.squash > 0 ? Math.round(Math.sin(this.squash / 10 * Math.PI) * 3) : 0;
      for (let i = 0; i < w; i++) {
        const k = Math.sin((i / w) * Math.PI), yy = y + Math.round(k * sag);
        const band = Math.floor(i / 4) % this.c.length;
        R(ctx, this.c[band], x + i, yy, 1, 5);
        if ((i + Math.floor(i / 4)) % 3 === 0) R(ctx, this.c[(band + 2) % this.c.length], x + i, yy + 2, 1, 1);
        R(ctx, i % 2 ? this.c[1] : this.c[3], x + i, yy + 5, 1, 1 + (i % 3 === 0 ? 1 : 0));
      }
      R(ctx, 'rgba(0,0,0,0.25)', x, y + 7 + sag, w, 2);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EL TREN A AGUAS CALIENTES: locomotora y cuatro vagones con techo para
  // correr. Sale de Ollantaytambo cuando subes (o si te demoras, se va sin ti),
  // pasa túneles donde hay que agacharse y, de vez en cuando, se suelta el
  // último vagón: hay que correr hacia adelante.
  const LOCO_W = 96, WAGON_W = 80, GAP = 12, BODY_H = 48;
  let currentTrain = null;
  class Train {
    constructor(def) {
      currentTrain = this;
      this.def = def; this.roofY = def.roof * TS; this.railY = this.roofY + BODY_H;
      this.platEnd = def.platEnd * TS; this.stopX = def.stop * TS; this.speed = def.speed || 2;
      this.tunnels = def.tunnels.map(t => ({ x0: t[0] * TS, x1: t[1] * TS, warned: false }));
      this.decs = def.decouples.map(d => d * TS); this.cpX = def.cp * TS;
      this.wagons = []; this.cpTaken = false; this.saved = null; this.carry = 0; this.stepT = -1;
      this.x = -1e6; this.y = -1e6; this.w = 0; this.h = 0; this.hazardKind = 'tunnel';
      this.reset();
    }
    reset() {
      // la cola del tren queda pegada al andén
      this.F = this.platEnd + 2 + LOCO_W + this.def.wagons * (WAGON_W + GAP);
      this.v = 0; this.state = 'wait'; this.readyT = 0; this.nextDec = 0; this.warn = false;
      for (const t of this.tunnels) t.warned = false;
      for (const w of this.wagons) { w.coupled = true; w.v = 0; }
      this.layout();
    }
    layout() { for (const w of this.wagons) if (w.coupled) { w.x = this.F - w.off; w.dx = 0; } }
    rear() { let r = null; for (const w of this.wagons) if (w.coupled && (!r || w.x < r.x)) r = w; return r; }
    front() { return this.wagons.find(w => w.idx === 0); }
    // avanza una vez por paso (lo llama el primer vagón que se actualiza)
    step(g) {
      if (this.stepT === g.T) return; this.stepT = g.T;
      if (this.state === 'ready' && ++this.readyT > 210) this.depart(g);
      if (this.state === 'go') {
        this.v = Math.min(this.speed, this.v + 0.012);
        // frena a tiempo para quedar justo al lado del andén de Aguas Calientes
        const left = this.stopX - this.F;
        if (left < this.v * this.v / (2 * 0.012) + 2) this.state = 'brake';
      }
      if (this.state === 'brake') {
        const left = this.stopX - this.F;
        this.v = Math.max(0.12, Math.min(this.v, Math.sqrt(2 * 0.012 * Math.max(0, left))));
        if (left <= this.v) { this.F = this.stopX; this.v = 0; this.state = 'stop'; g.audio('whistle'); }
      }
      this.F += this.v;
      // el último vagón se suelta (con aviso: chispas y un rechinar)
      if (this.nextDec < this.decs.length) {
        const d = this.decs[this.nextDec];
        this.warn = this.F >= d - 20 * TS;
        if (this.F >= d) {
          const r = this.rear();
          if (r && r.idx > 0) { r.coupled = false; r.v = this.v; g.audio('clank'); g.burst(r.x + r.w + 6, this.roofY + 36, 'spark', 14); }
          this.nextDec++; this.warn = false;
        }
      }
      // pitazo antes de cada túnel
      for (const t of this.tunnels) if (!t.warned && this.F > t.x0 - 12 * TS) { t.warned = true; if (g.near(this.F, 500)) g.audio('whistle'); }
    }
    depart(g) { if (this.state !== 'wait' && this.state !== 'ready') return; this.state = 'go'; g.audio('whistle'); }
    onTrain(p) { return p.lastMover && p.lastMover.isWagon; }
    update(g) {
      const p = g.player, on = this.onTrain(p);
      const inZone = p.cx > this.platEnd - 30 * TS && p.cx < this.stopX + 4 * TS;
      // agacharse: solo aquí, sobre el tren o en el andén
      p.crouching = inZone && p.onGround && !p.riding && Input.held('down');
      p.pose = p.crouching ? A3.P.crouch : null;
      if (p.crouching) p.vx = Math.max(-0.8, Math.min(0.8, p.vx));
      // en el aire conservas la velocidad del tren (si no, saltar sería quedarse atrás)
      if (on) this.carry = p.lastMover.dx;
      else if (p.onGround) this.carry = 0;
      else if (this.carry) p.x += this.carry;
      if (!inZone || g.state !== 'play') return;
      // sale cuando te subes o cuando ya estás al borde del andén un rato
      if (this.state === 'wait' && p.cx > this.platEnd - 5 * TS) { this.state = 'ready'; this.readyT = 0; g.audio('whistle'); }
      if ((this.state === 'wait' || this.state === 'ready') && on) this.depart(g);
      // ¿te caíste o te quedaste atrás?
      if (p.cx > this.platEnd && p.cx < this.stopX && p.y + p.h > this.roofY + 22 && !p.dragged) { g.playerEnvDeath(this.state === 'stop' ? 'fall' : 'train'); return; }
      const r = this.rear();
      if ((this.state === 'go' || this.state === 'brake') && r && !(on && p.lastMover.coupled) && p.onGround && p.cx < r.x - 6 * TS) { g.playerEnvDeath('train'); return; }
      if (!this.cpTaken && this.F >= this.cpX && on && p.lastMover.coupled) {
        this.cpTaken = true; this.saved = { F: this.F, nextDec: this.nextDec };
        g.spawnMount = null; g.spawn = { x: this.front().x + 40, y: this.roofY };
        g.audio('checkpoint'); g.burst(p.cx, p.cy, 'spark', 18); g.toast('AVANCE GUARDADO');
      }
      // chispas en el enganche que se va a soltar
      if (this.warn && r && g.T % 3 === 0) g.particles.push({ x: r.x + r.w + GAP / 2 + (Math.random() * 6 - 3), y: this.roofY + 36, vx: Math.random() * 2 - 1, vy: -1 - Math.random(), life: 18, max: 18, col: '#ffe27a', size: 1, grav: 0.15 });
      if (this.state === 'go' && g.T % 9 === 0) { const fr = this.front(); g.particles.push({ x: fr.x + LOCO_W - 20, y: this.roofY - 2, vx: -this.v * 0.6, vy: -0.6, life: 50, max: 50, col: '#c8c2cc', size: 2, grav: -0.01 }); }
    }
    onRespawn(g) {
      if (this.state === 'stop') return;
      this.carry = 0;
      if (this.cpTaken) {
        // vuelves al punto guardado del viaje, en el vagón de adelante
        const s = this.saved;
        this.F = s.F; this.v = this.speed; this.state = 'go'; this.nextDec = s.nextDec; this.warn = false;
        for (const t of this.tunnels) t.warned = t.x0 - 12 * TS < s.F;
        const keep = this.def.wagons - s.nextDec;
        for (const w of this.wagons) {
          w.coupled = w.idx <= keep;
          // los que ya se soltaron quedan atrás, quietos en la vía
          if (!w.coupled) { w.v = 0; w.x = this.decs[this.def.wagons - w.idx] - w.off + 100; }
        }
        this.layout();
        g.spawn = { x: this.front().x + 40, y: this.roofY };
      } else this.reset();
    }
    // los túneles: de pie, te das contra el techo
    tunnelAt(p) { for (const t of this.tunnels) if (p.x + p.w > t.x0 + 3 && p.x < t.x1 - 3) return t; return null; }
    hazardBox(g) {
      const p = g.player;
      if (p.riding || p.crouching || p.y + p.h < this.roofY - 40 || !this.tunnelAt(p)) return null;
      return { x: p.x, y: p.y, w: p.w, h: p.h };
    }
    hint(g) {
      const p = g.player, on = this.onTrain(p);
      if ((this.state === 'wait' || this.state === 'ready') && !on && p.cx > this.platEnd - 9 * TS && p.cx < this.platEnd) return ['¡SALTA AL TECHO DEL TREN!'];
      if (!on) return null;
      if (this.warn) { const r = this.rear(); if (r && p.lastMover === r) return ['¡SE SUELTA EL ÚLTIMO VAGÓN!', '¡CORRE HACIA ADELANTE!']; }
      if (!p.crouching) for (const t of this.tunnels) { const d = t.x0 - p.cx; if (d > -10 && d < 130 + this.v * 20) return ['¡TÚNEL!', 'MANTÉN ABAJO PARA AGACHARTE']; }
      if (this.state === 'stop') return ['¡AGUAS CALIENTES!', 'BÁJATE POR ADELANTE'];
      return null;
    }
    // vía, durmientes y el terraplén junto al río
    drawBack(ctx) {
      const x0 = Math.max(this.platEnd - 16, Game.cam.x - 8), x1 = Math.min(this.stopX + 8, Game.cam.x + VIEW.w + 8);
      if (x1 <= x0) return;
      const ry = this.railY, wy = this.def.water * TS + 4;
      R(ctx, '#6b5d4c', x0, ry + 4, x1 - x0, wy - ry - 2);
      for (let x = Math.floor(x0 / 8) * 8; x < x1; x += 8) {
        const k = hash(x >> 3);
        R(ctx, k > 0.5 ? '#7d6e5a' : '#5a4d3e', x + (k > 0.7 ? 2 : 0), ry + 8 + Math.floor(k * 24), 6, 4);
        R(ctx, '#3a2414', x + 1, ry + 1, 5, 3);   // durmiente
      }
      R(ctx, '#4a4048', x0, ry + 4, x1 - x0, 3);   // balasto
      R(ctx, '#8a8f99', x0, ry - 1, x1 - x0, 2); R(ctx, '#c9ced6', x0, ry - 1, x1 - x0, 1);   // riel
      // los túneles por dentro (oscuros) van detrás del tren
      for (const t of this.tunnels) {
        if (!onScreen(t.x0, t.x1 - t.x0)) continue;
        const cy = this.roofY - 17;
        R(ctx, '#1b1620', t.x0, cy, t.x1 - t.x0, ry + 6 - cy);
        for (let y = cy + 4; y < ry; y += 9) for (let x = t.x0 + ((y >> 3) % 2) * 8; x < t.x1; x += 16) R(ctx, '#251e2a', x, y, 14, 1);
        for (let x = t.x0 + 24; x < t.x1 - 8; x += 48) { R(ctx, '#ffd88a', x, cy + 3, 3, 2); R(ctx, 'rgba(255,216,138,0.12)', x - 8, cy + 5, 19, 12); }
      }
    }
    // la montaña encima del túnel y la penumbra adentro van delante
    drawFront(ctx) {
      const ry = this.railY, cy = this.roofY - 17;
      for (const t of this.tunnels) {
        if (!onScreen(t.x0 - 40, t.x1 - t.x0 + 80)) continue;
        R(ctx, 'rgba(12,8,20,0.55)', t.x0, cy, t.x1 - t.x0, ry + 6 - cy);
        // cerro de roca con monte encima, más ancho que el túnel (sus faldas
        // quedan por encima del tren, para no taparlo)
        const a = t.x0 - 64, b = t.x1 + 64;
        for (let x = a; x < b; x += 2) {
          const edge = Math.min(x - a, b - x), top = cy - Math.min(150, edge * 1.1) - Math.round(hash(x >> 3) * 8);
          R(ctx, '#6a6270', x, top, 2, cy - top);
          for (let y = top + 8; y < cy; y += 6) if (hash((x >> 1) * 13 + (y >> 1) * 7) > 0.72) R(ctx, '#57505e', x, y, 2, 2);
          R(ctx, '#3f7a4c', x, top - 4, 2, 8); R(ctx, '#2f5a3c', x, top + 4, 2, 3);
          if (hash(x * 7 + t.x0) > 0.9) { R(ctx, '#2f5a3c', x - 4, top - 12, 10, 9); R(ctx, '#3f7a4c', x - 2, top - 14, 7, 5); R(ctx, '#4a3220', x, top - 4, 2, 5); }
        }
        // portadas de piedra con arco, a la entrada y a la salida
        for (const px of [t.x0, t.x1 - 8]) {
          R(ctx, '#8c8272', px - 2, cy - 10, 10, ry - cy + 14); R(ctx, '#a89e8c', px - 2, cy - 10, 10, 2);
          for (let y = cy - 6; y < ry; y += 6) R(ctx, '#5f574a', px - 2, y, 10, 1);
        }
        R(ctx, '#8c8272', t.x0 - 2, cy - 10, t.x1 - t.x0 + 4, 6); R(ctx, '#a89e8c', t.x0 - 2, cy - 10, t.x1 - t.x0 + 4, 1);
      }
    }
    draw() {}
  }
  class Wagon {
    constructor(def) {
      const T = currentTrain;
      this.train = T; this.idx = def.i; this.isMover = true; this.isWagon = true;
      this.w = def.i === 0 ? LOCO_W : WAGON_W; this.h = BODY_H;
      this.off = def.i === 0 ? LOCO_W : LOCO_W + def.i * (WAGON_W + GAP);
      this.coupled = true; this.v = 0; this.dx = 0; this.dy = 0; this.y = T.roofY; this.x = T.F - this.off;
      T.wagons.push(this);
    }
    get cx() { return this.x + this.w / 2; }
    update(g) {
      const T = this.train; T.step(g);
      const px = this.x;
      if (this.coupled) this.x = T.F - this.off;
      else { this.v = Math.max(0, this.v - 0.02); this.x += this.v; }
      this.dx = this.x - px;
    }
    draw(ctx, g) {
      if (!onScreen(this.x, this.w)) return;
      const x = Math.round(this.x), y = this.y, w = this.w, loco = this.idx === 0;
      const dist = (this.coupled ? this.train.F : this.x) / 3;
      // techo (donde se corre) y cuerpo
      R(ctx, '#8a8296', x, y, w, 1); R(ctx, '#e8e2d4', x + 1, y + 1, w - 2, 2);
      R(ctx, loco ? '#b8352a' : '#2f4f86', x, y + 3, w, 37);
      R(ctx, loco ? '#8a2820' : '#22406e', x, y + 36, w, 4);
      R(ctx, '#e2b13c', x, y + 29, w, 2);
      if (loco) {
        // cabina adelante, faro y rejilla
        R(ctx, '#1d1a24', x + w - 22, y + 7, 16, 12); R(ctx, '#9fd3f0', x + w - 21, y + 8, 14, 10); R(ctx, '#d9f1ff', x + w - 19, y + 9, 4, 3);
        R(ctx, '#e2b13c', x + w - 4, y + 3, 4, 37); R(ctx, '#fff6b0', x + w - 3, y + 22, 3, 4);
        for (let k = 0; k < 6; k++) R(ctx, '#8a2820', x + 10 + k * 8, y + 10, 5, 12);
        drawText(ctx, 'TREN DEL VALLE', x + 5, y + 31, { color: '#2a1f2d' });
        R(ctx, '#2a1f2d', x + 30, y - 4, 10, 4); R(ctx, '#5d5768', x + 31, y - 6, 8, 2);   // chimenea
      } else {
        // ventanas panorámicas con turistas mirando el paisaje
        for (let k = 0; k < 4; k++) {
          const wx = x + 5 + k * 19;
          R(ctx, '#1d1a24', wx, y + 7, 15, 15); R(ctx, '#9fd3f0', wx + 1, y + 8, 13, 13); R(ctx, '#d9f1ff', wx + 2, y + 9, 3, 3);
          const h = hash(this.idx * 31 + k);
          if (h > 0.35) { R(ctx, h > 0.7 ? '#e7b089' : '#c4855c', wx + 5, y + 14, 5, 5); R(ctx, h > 0.6 ? '#d9ad74' : '#1f1620', wx + 4, y + 12, 7, 3); }
        }
        R(ctx, 'rgba(159,211,240,0.8)', x + 4, y + 3, w - 8, 2);   // claraboya del techo
      }
      // enganches
      R(ctx, '#2a1f2d', x - 6, y + 33, 6, 3); R(ctx, '#2a1f2d', x + w, y + 33, 6, 3);
      // ruedas: giran según lo que avanza el tren
      R(ctx, '#2a1f2d', x + 4, y + 40, w - 8, 4);
      for (const bx of [x + 12, x + 22, x + w - 22, x + w - 12]) {
        R(ctx, '#1d1622', bx - 4, y + 41, 9, 7); R(ctx, '#5d5768', bx - 3, y + 42, 7, 5);
        const a = dist / 4 + bx;
        R(ctx, '#c9ced6', bx + Math.round(Math.cos(a) * 2), y + 44 + Math.round(Math.sin(a) * 2), 1, 1);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LA FOTO GRUPAL en Machu Picchu: la promo posa y te guardó un sitio.
  let _standing = null;
  function standingKids() {
    if (!_standing) _standing = STUDENT_COLORS.map(c => PIX.fromRows(KID_TOP.concat(KID_LEGS.stand), Object.assign({}, PAL, c)));
    return _standing;
  }
  class ClassPhoto extends Actor {
    constructor(def) {
      const base = def.y * TS, x0 = def.x * TS;
      super(x0, base - 40, 170, 40);
      this.base = base; this.animT = 0; this.done = false; this.t = 0;
      this.seats = [0, 17, 34, 54, 71, 88].map(d => x0 + d); this.spot = this.seats[3];
      this.profeX = x0 + 140;
    }
    update(g) {
      this.animT++;
      const p = g.player;
      if (this.done) {
        this.t++; p.x += (this.spot + 4 - p.x) * 0.2;
        if (this.t === 40) { g.audio('click'); g.burst(this.profeX, this.base - 18, 'spark', 16); }
        if (this.t === 75) g.gameComplete();
        return;
      }
      if (p.onGround && !p.riding && Math.abs(p.cx - (this.spot + 8)) < 12) { this.done = true; p.won = true; p.vx = 0; g.audio('sit'); }
    }
    draw(ctx, g) {
      const b = this.base, kids = standingKids();
      // banderola de la promo sostenida por dos palos
      const bx = this.seats[0] - 2, bw = this.seats[5] + 18 - bx;
      R(ctx, '#6b4524', bx, b - 50, 2, 50); R(ctx, '#6b4524', bx + bw - 2, b - 50, 2, 50);
      R(ctx, '#1d1622', bx + 1, b - 51, bw - 2, 13); R(ctx, '#d8432f', bx + 2, b - 50, bw - 4, 11);
      R(ctx, '#ffffff', bx + 2, b - 46, bw - 4, 3);
      drawText(ctx, 'PROMO 2026', bx + bw / 2, b - 49, { color: '#ffffff', align: 'center', shadow: true, shadowColor: '#962a22' });
      this.seats.forEach((sx, i) => {
        if (i === 3) {
          if (!this.done) { const a = 0.25 + Math.sin(this.animT * 0.12) * 0.15; R(ctx, 'rgba(255,230,140,' + a.toFixed(2) + ')', sx - 3, b - 5, 22, 5); }
          else ctx.drawImage(this.t > 30 ? P.jump : P.idle[0], Math.round(this.spot), b - 22 - (this.t > 30 && this.t < 60 ? 3 : 0));
          return;
        }
        // en la foto todos saltan
        const hop = this.done && this.t > 30 && this.t < 60 ? 3 : Math.floor((this.animT + i * 19) / 45) % 2;
        ctx.drawImage(kids[i % kids.length], sx, b - 22 - hop);
      });
      // la profe con la cámara en su trípode, mirando al grupo
      const px = this.profeX;
      R(ctx, '#3a2414', px - 12, b - 14, 1, 14); R(ctx, '#3a2414', px - 6, b - 14, 1, 14); R(ctx, '#3a2414', px - 9, b - 14, 1, 14);
      R(ctx, '#2a1f2d', px - 14, b - 20, 10, 7); R(ctx, '#5d5768', px - 17, b - 18, 3, 3);
      ctx.drawImage(flipS(OBJ.teacher2), px - 2, b - 27);
      if (this.done && this.t >= 40 && this.t < 48) { R(ctx, 'rgba(255,255,255,0.85)', this.seats[0] - 20, b - 60, 200, 60); }
      const p = g.player, near = Math.abs(p.cx - this.spot) < 150;
      if (this.done) bubble(ctx, px + 5, b - 28, [this.t < 40 ? '¡DIGAN WHISKY!' : '¡QUEDÓ BONITA!']);
      else if (near) bubble(ctx, px + 5, b - 28, ['¡APÚRATE,', 'YA VA LA FOTO!']);
    }
  }

  Object.assign(EXTRA_ENTITIES, {
    state3: () => new State3(),
    alpaca: (d) => new Alpaca(d),
    photoLady: (d) => new PhotoLady(d),
    spitter: (d) => new Spitter(d),
    tourist: (d) => new Tourist(d),
    dancer: (d) => new Dancer(d),
    comparsa: (d) => new Comparsa(d),
    sign3: (d) => new Sign3(d),
    awning: (d) => new Awning(d),
    train: (d) => new Train(d),
    wagon: (d) => new Wagon(d),
    classPhoto: (d) => new ClassPhoto(d),
  });
  window.CAP3 = { get train() { return currentTrain; } };
})();
