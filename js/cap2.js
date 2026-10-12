// cap2.js — CAPÍTULO 2 · EL CONCURSO EN LIMA. El niño viaja a Lima para un
// concurso escolar, pero el bus se malogra en pleno desierto de Ica. Cuatro
// tramos de izquierda a derecha:
//   x 0–195    EL DESIERTO      · baja las dunas en tabla de sandboard; cactus y tubulares
//   x 196–345  LA PANAMERICANA  · combis que pasan: súbete a su techo para cruzar los aniegos
//   x 346–509  LAS AZOTEAS      · garúa, ladrillo, fierros, tanques, ropa tendida y perros chuscos
//   x 510–     EL COLEGIO       · el jurado del concurso espera
// Todo lo propio del capítulo vive aquí: tiles, sprites, entidades, música y nivel.

(() => {
  'use strict';
  const TS = TILE;
  const GR = 56;            // fila de la pista (y del fondo de las dunas)
  const h2 = (n) => { n = (n | 0) ^ 0x2545f491; n = Math.imul(n ^ (n >>> 15), 0x2c1b3c6d); n = Math.imul(n ^ (n >>> 12), 0x297a2d39); n ^= n >>> 15; return (n >>> 0) / 4294967296; };
  const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

  // ───────────────────────────────────────────────────────────────────────────
  //  TILES
  // ───────────────────────────────────────────────────────────────────────────
  const CPAL = {
    '.': null, 'K': '#2a1f2d',
    'a': '#4a4a52', 'A': '#3a3a42', 's': '#6a6a72', 'l': '#8c8c94',          // asfalto
    'e': '#b08a5e', 'E': '#94714a', 'f': '#c9a273',                           // tierra apisonada
    'c': '#d6d2cc', 'C': '#b8b4ae', 'D': '#7a756f',                           // losa de concreto
    'b': '#b5523a', 'B': '#94402c', 'm': '#d9b49a', 'h': '#5e2a1e',           // ladrillo pandereta
    'p': '#d9a59a', 'P': '#c48e83', 'q': '#e8bdb2',                           // pared tarrajeada y pintada
    'g': '#9aa0a8', 'G': '#6d737c', 'w': '#dfe3e8',                           // metal
    'r': '#c8322a', 'R': '#8f1f1a', 'y': '#f2c230',
  };
  const tile = (rows) => PIX.fromRows(rows, CPAL);
  const T2 = {};
  T2.asphalt = tile([
    'llllllllllllllll', 'asasaaaasaaasaaa', 'aaaaAaaaaaaaAaaa', 'aAaaaaasaaaaaaaa', 'AAAAAAAAAAAAAAAA',
    'eeeeEeeeeeeeEeee', 'eEeeeeefeeeeeeee', 'eeeeeeeeeeEeeefe', 'eefeeEeeeeeeeeee', 'eeeeeeeeeeeeeEee',
    'eeEeeeeeefeeeeee', 'eeeeeeEeeeeeeeee', 'efeeeeeeeeeeEeee', 'eeeeeEeeeeefeeee', 'eeeeeeeeeeeeeeee', 'EeeeeeeeeeeeeeeE',
  ]);
  T2.earth = tile([
    'eeeeEeeeeeeeEeee', 'eEeeeeefeeeeeeee', 'eeeeeeeeeeEeeefe', 'eefeeEeeeeeeeeee', 'eeeeeeeeeeeeeEee', 'eeEeeeeeefeeeeee',
    'eeeeeeEeeeeeeeee', 'efeeeeeeeeeeEeee', 'eeeeeEeeeeefeeee', 'eeeeeeeeeeeeeeee', 'eEeeeeeeeEeeeeee', 'eeeeefeeeeeeeEee',
    'eeEeeeeeeeeeeeee', 'eeeeeeeeEeeeefee', 'eeeeEeeeeeeeeeee', 'EeeeeeeeeeeeeeeE',
  ]);
  // ladrillo de pandereta sin tarrajear (la casa "en construcción" de siempre)
  const BRICK = [
    'bbbbbbbmbbbbbbbm', 'bhbhbbbmbhbhbbbm', 'bbbbbBbmbbbbbBbm', 'mmmmmmmmmmmmmmmm',
    'bbbmbbbbbbbmbbbb', 'bhbmbhbbbhbmbhbb', 'bBbmbbbBbbbmbbbB', 'mmmmmmmmmmmmmmmm',
    'bbbbbbbmbbbbbbbm', 'bbhbhbbmbbhbhbbm', 'bbbbbbBmbbbbbbBm', 'mmmmmmmmmmmmmmmm',
    'bbbmbbbbbbbmbbbb', 'bhbmbhbbbhbmbhbb', 'bbbmbbbBbbbmbBbb', 'mmmmmmmmmmmmmmmm',
  ];
  T2.brick = tile(BRICK);
  T2.roof = tile(['cccccccccccccccc', 'CcCCCCcCCCCCcCCC', 'CCCCCCCCCCCCCCCC', 'DDDDDDDDDDDDDDDD'].concat(BRICK.slice(4)));
  T2.stucco = tile([
    'pppppppppppppppp', 'pppppqpppppppppp', 'pppppppppppPpppp', 'pppppppppppppppp', 'ppPppppppppppppp', 'pppppppppqpppppp',
    'pppppppppppppppp', 'ppppppPppppppppp', 'pqpppppppppppppp', 'pppppppppppppPpp', 'pppppppppppppppp', 'pppppPpppppppppp',
    'ppppppppppqppppp', 'pppppppppppppppp', 'pPpppppppppppppp', 'pppppppppppppppp',
  ]);
  T2.roofS = tile(['cccccccccccccccc', 'CcCCCCcCCCCCcCCC', 'CCCCCCCCCCCCCCCC', 'DDDDDDDDDDDDDDDD', 'PPPPPPPPPPPPPPPP'].concat(Array(11).fill('pppppppppppppppp')));
  // plancha de metal (paraderos y puente peatonal): se atraviesa desde abajo
  T2.steel = tile(['wwwwwwwwwwwwwwww', 'gGgggggGgggggggG', 'gggggggggggggggg', 'GGGGGGGGGGGGGGGG', '.G...G....G...G.']);
  // techo del peaje: franjas rojas y blancas
  // concreto de la escalera del puente
  T2.concTop = tile(['wwwwwwwwwwwwwwww', 'ccccccccccccccc C'.replace(' ', ''), 'CCCCCCCCCCCCCCCC', 'DDDDDDDDDDDDDDDD', 'CcCCCCCCcCCCCCCC', 'CCCCCCCCCCCCcCCC', 'CCCcCCCCCCCCCCCC', 'CCCCCCCCCCCCCCCC',
    'CCCCCCCCcCCCCCCC', 'CcCCCCCCCCCCCCCC', 'CCCCCCCCCCCCCcCC', 'CCCCCcCCCCCCCCCC', 'CCCCCCCCCCCCCCCC', 'CCCCCCCCCCcCCCCC', 'CCcCCCCCCCCCCCCC', 'DCCCCCCCCCCCCCCD']);
  T2.conc = tile(['CCCCCCCCcCCCCCCC', 'CcCCCCCCCCCCCCCC', 'CCCCCCCCCCCCCcCC', 'CCCCCcCCCCCCCCCC', 'CCCCCCCCCCCCCCCC', 'CCCCCCCCCCcCCCCC', 'CCcCCCCCCCCCCCCC', 'CCCCCCCCCCCCCCCC',
    'CCCCCCCCcCCCCCCC', 'CcCCCCCCCCCCCCCC', 'CCCCCCCCCCCCCcCC', 'CCCCCcCCCCCCCCCC', 'CCCCCCCCCCCCCCCC', 'CCCCCCCCCCcCCCCC', 'CCcCCCCCCCCCCCCC', 'DCCCCCCCCCCCCCCD']);
  T2.canopy = tile(['wwwwwwwwwwwwwwww', 'rrrrwwwwrrrrwwww', 'rrrrwwwwrrrrwwww', 'RRRRgggRRRRggggR', 'GGGGGGGGGGGGGGGG', '................']);

  Object.assign(TILE_SPECS, {
    sandFill:   { solid: true },                       // arena: la dibuja el relieve de las dunas
    blockInvis: { solid: true },
    asphalt:    { solid: true, top: T2.asphalt, body: T2.earth },
    roof:       { solid: true, top: T2.roof, body: T2.brick },
    roofS:      { solid: true, top: T2.roofS, body: T2.stucco },
    steel:      { oneway: true, body: T2.steel },
    conc:       { solid: true, top: T2.concTop, body: T2.conc },
    canopy:     { oneway: true, body: T2.canopy },
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  LAS DUNAS: relieve suave (no son tiles). Cada duna tiene una rampa que se
  //  empina hasta la cresta (te lanza al aire) y una cara de bajada empinada
  //  que se va suavizando. Cada cresta es más baja que la anterior: la tabla
  //  siempre tiene impulso para subir la siguiente.
  // ───────────────────────────────────────────────────────────────────────────
  const DUNE_PTS = [[0, 36], [16, 36], [28, 44], [40, 40], [52, 47], [64, 43], [76, 49], [88, 45], [100, 51], [112, 47], [124, 53], [136, 49], [148, 55], [160, 51], [172, GR], [196, GR]];
  const DUNE_END = 196;
  function duneRow(xt) {
    const P = DUNE_PTS;
    if (xt <= P[0][0]) return P[0][1];
    for (let i = 0; i < P.length - 1; i++) {
      const [x0, y0] = P[i], [x1, y1] = P[i + 1];
      if (xt > x1) continue;
      const t = (xt - x0) / (x1 - x0);
      if (y1 > y0) return y0 + (y1 - y0) * (2 * t - t * t);   // bajada
      if (y1 < y0) return y0 - (y0 - y1) * t * t;             // subida hacia la cresta
      return y0;
    }
    return P[P.length - 1][1];
  }
  const DUNES = {
    end: 175,    // aquí se acaban las dunas y te bajas de la tabla
    surface: (px) => duneRow(px / TS) * TS,
    slope: (px) => (duneRow((px + 1) / TS) - duneRow((px - 1) / TS)) * TS / 2,
  };
  // casillas sólidas (invisibles) bajo la arena, para caminar a pie
  function duneFill(rows) {
    const out = [];
    for (let c = 0; c < DUNE_END; c++) {
      let m = 0; for (let k = 0; k <= TS; k += 4) m = Math.max(m, duneRow(c + k / TS));
      const r = Math.ceil(m - 1e-6);
      out.push([c, r, 1, rows - r, 'sandFill']);
    }
    return out;
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  SPRITES
  // ───────────────────────────────────────────────────────────────────────────
  // perro chusco: cruzado de mil razas, con su collar rojo. 18x12, mira a la derecha
  const DPAL = { '.': null, K: '#2a1f2d', b: '#a8743c', B: '#7a4f28', w: '#efe2c8', r: '#d8432f', p: '#f08a7a' };
  const DOG_TOP = [
    '............KK....', '...........KBK....', '..........KbbbK...', '..........KbKbbK..', '..K.......KbbbbbbK',
    '.KbK......KrrbbKKK', '..KbKKKKKKKbbbK...', '...KbbbwwbbbbbbK..', '...KbbwwwbbbbbbK..', '...KBbbbbbbbbbBK..',
  ];
  const DOG_LEGS = { a: ['...KBK.KbK.KBK.KbK', '...KK..KK..KK..KK.'], b: ['....KBKbK...KBKbK.', '....KK.KK...KK.KK.'] };
  const DOG = {
    a: PIX.fromRows(DOG_TOP.concat(DOG_LEGS.a), DPAL),
    b: PIX.fromRows(DOG_TOP.concat(DOG_LEGS.b), DPAL),
    bark: PIX.fromRows(DOG_TOP.slice(0, 5).concat(['.KbK......KrrbbKpK'], DOG_TOP.slice(6), DOG_LEGS.a), DPAL),
    sleep: PIX.fromRows(['..................', '..................', '..................', '..................', '..........KK......',
      '.........KBK......', '..KKKKKKKbbbKK....', '.KbbbwwbbbbKbbK...', 'KbbbwwwbbbbbbbbK..', 'KBbbbbbbbbbbbBKK..', '.KKKKKKKKKKKKK....', '..................'], DPAL),
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  ENTIDADES
  // ───────────────────────────────────────────────────────────────────────────
  const sandParticle = (g, x, y, vx) => g.particles.push({ x, y, vx, vy: -0.6 - Math.random() * 1.2, life: 20, max: 20, col: Math.random() < 0.5 ? '#f1d29a' : '#d9ad74', size: Math.random() < 0.4 ? 2 : 1, grav: 0.12 });
  // globito de diálogo con texto (cobradores, ambulantes, perros)
  function bubble(ctx, text, x, y, col) {
    const w = textWidth(text) + 6, bx = Math.round(x - w / 2), by = Math.round(y - 12);
    R(ctx, '#1d1622', bx - 1, by - 1, w + 2, 12); R(ctx, '#fffaf0', bx, by, w, 10);
    R(ctx, '#1d1622', Math.round(x) - 1, by + 11, 3, 2); R(ctx, '#fffaf0', Math.round(x), by + 10, 1, 2);
    drawText(ctx, text, x, by + 2, { color: col || '#1d1622', align: 'center' });
  }

  // TABLA DE SANDBOARD: se monta como la llama, pero baja las dunas sola:
  // acelera en las bajadas, sube con el impulso y en cada cresta sale volando.
  class Sandboard extends Mount {
    constructor(x, y) {
      super(x, y - 18, 14, 18, { dx: 3, dy: -1 });
      this.canDismount = false; this.drawsRider = true; this.ownJump = true; this.camMax = 4.7;
      this.angle = 0; this.jumping = false; this.taken = false;
    }
    reset() { super.reset(); this.onGround = false; this.angle = 0; }
    hint(g) {
      const p = g.player;
      if (!this.taken && !p.riding && Math.abs(p.cx - this.cx) < 110) return ['¡TOMA LA TABLA Y BAJA LAS DUNAS!'];
      return null;
    }
    update(g) {
      this.animT++;
      const D = g.level.dunes;
      if (this.rider) {
        this.taken = true;
        const left = Input.held('left'), right = Input.held('right');
        if (this.onGround) {
          const s = D.slope(this.cx), sin = s / Math.hypot(1, s);
          // cuesta abajo acelera; cuesta arriba frena menos de lo real (así llegas a la cresta)
          this.vx += sin * (sin > 0 ? 0.24 : 0.16);
          if (right) { this.vx += 0.06; if (this.vx < 1.3) this.vx = Math.min(1.3, this.vx + 0.2); }
          else if (left) this.vx -= 0.12;
          this.vx *= 0.997;
          if (Input.consumeJump()) {
            this.vy = Math.min(this.vy, 0) - 6.2; this.onGround = false; this.jumping = true;
            g.onPlayerJump(this);
          }
        } else {
          if (right) this.vx += 0.03; else if (left) this.vx -= 0.05;
          if (this.jumping && !(Input.held('jump') || Input.held('up')) && this.vy < -3) this.vy = -3;
        }
        this.vx = Math.max(-2.5, Math.min(4.7, this.vx));
        if (this.vx > 0.1) this.facing = 1; else if (this.vx < -0.1) this.facing = -1;
      } else this.vx *= 0.8;
      // integración con el relieve de la duna
      const wasGround = this.onGround;
      this.vy = Math.min(this.vy + 0.42, 7);
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0) { this.x = 0; this.vx = 0; }
      const gy = D.surface(this.cx), s = D.slope(this.cx);
      const glue = wasGround && this.vy > -1 && gy - (this.y + this.h) < 4;   // pegado a la arena salvo que salga despedido
      if (this.y + this.h >= gy || glue) {
        if (!wasGround && this.rider) { g.onPlayerLand(this); g.audio('land'); for (let i = 0; i < 6; i++) sandParticle(g, this.cx, gy, (Math.random() - 0.5) * 2); }
        this.y = gy - this.h; this.vy = s * this.vx; this.onGround = true; this.jumping = false;
      } else this.onGround = false;
      // la tabla se inclina con la duna; en el aire se endereza despacio
      const want = this.onGround ? Math.atan(s) : Math.max(-0.5, Math.min(0.5, this.vy * 0.06));
      this.angle += (want - this.angle) * (this.onGround ? 0.5 : 0.08);
      if (this.rider && this.onGround && Math.abs(this.vx) > 1.6 && this.animT % 2 === 0) sandParticle(g, this.cx - this.facing * 8, gy - 1, -this.vx * 0.3);
      if (this.rider && this.onGround && this.animT % 22 === 0 && Math.abs(this.vx) > 2) g.audio('swish');
      // al llegar al llano del oasis te bajas de la tabla
      if (this.rider && this.onGround && this.cx > D.end * TS) {
        this.retired = true; this.vx = 0; this.rider.dismount(g, -4); g.toast('¡BACÁN! ¡QUÉ TAL BAJADA!');
      }
      if (this.rider) this.rider.syncRide();
    }
    draw(ctx, g) {
      const p = g.player, riding = this.rider === p;
      if (this.retired) {
        // clavada de pie en la arena, como en las agencias de Huacachina
        ctx.save(); ctx.translate(Math.round(this.cx + 10), Math.round(this.y + this.h + 2)); ctx.rotate(-1.35);
        this.drawBoard(ctx); ctx.restore(); return;
      }
      ctx.save();
      ctx.translate(Math.round(this.cx), Math.round(this.y + this.h));
      ctx.rotate(this.angle);
      if (this.facing < 0) ctx.scale(-1, 1);
      this.drawBoard(ctx);
      if (riding && !(p.invuln > 0 && Math.floor(p.invuln / 4) % 2 === 0)) {
        const img = this.onGround ? P.surf : (this.vy < 0 ? P.jump : P.fall);
        ctx.drawImage(img, -8, -25);
      }
      ctx.restore();
    }
    drawBoard(ctx) {
      // tabla de madera pintada con franjas, la punta levantada
      R(ctx, '#2a1f2d', -11, -4, 22, 4); R(ctx, '#f0913c', -10, -4, 20, 2); R(ctx, '#d8432f', -4, -4, 6, 2);
      R(ctx, '#f6c94a', 4, -4, 3, 2); R(ctx, '#2a1f2d', 10, -6, 2, 3); R(ctx, '#f0913c', 9, -5, 2, 2);
      R(ctx, '#6e4627', -9, -2, 18, 1);
    }
  }

  // CACTUS de la quebrada seca: pincha
  class Cactus extends Actor {
    constructor(def) { super(def.x * TS, 0, 16, 13); this.y = duneRow(def.x + 0.5) * TS - 12; this.hazardKind = 'cactus'; }
    update() {}
    hazardBox() { return { x: this.x + 4, y: this.y + 2, w: 8, h: 10 }; }
    draw(ctx) { ctx.drawImage(T.cactus, Math.round(this.x), Math.round(this.y)); }
  }

  // TUBULAR (buggy arenero): baja por las dunas hacia ti con los turistas
  // gritando. Antes de entrar suena el motor y aparece un "!" en el borde.
  class Buggy extends Actor {
    constructor(def) { super(-9999, 0, 30, 17); this.trigger = def.x * TS; this.hazardKind = 'buggy'; this.speed = def.speed || 1.7; this.onRespawn(); }
    onRespawn() { this.state = 'wait'; this.t = 0; this.x = -9999; }
    update(g) {
      this.t++;
      const p = g.player;
      if (this.state === 'wait') { if (p.cx > this.trigger && p.cx < this.trigger + 600) { this.state = 'warn'; this.t = 0; g.audio('engine'); } return; }
      if (this.state === 'warn') {
        if (this.t > 55) { this.state = 'drive'; this.t = 0; this.x = g.cam.x + VIEW.w + 10; }
        return;
      }
      if (this.state !== 'drive') return;
      this.x -= this.speed;
      this.y = DUNES.surface(this.cx) - this.h + (Math.floor(this.t / 4) % 2);
      if (this.t % 3 === 0) sandParticle(g, this.x + this.w, this.y + this.h - 2, 0.8);
      if (this.t % 50 === 0 && g.near(this.cx, 300)) g.audio('engine');
      if (this.x + this.w < g.cam.x - 60 || this.x < 0) { this.state = 'gone'; this.x = -9999; }
    }
    hazardBox() { return this.state === 'drive' ? { x: this.x + 3, y: this.y + 4, w: this.w - 6, h: this.h - 4 } : null; }
    draw(ctx, g) {
      if (this.state === 'warn' && Math.floor(this.t / 5) % 2 === 0) {
        // aviso en el borde derecho de la pantalla, a la altura de la arena
        const ex = g.cam.x + VIEW.w - 12, ey = Math.max(g.cam.y + 20, Math.min(g.cam.y + VIEW.h - 30, DUNES.surface(ex) - 34));
        drawText(ctx, '!', ex, ey, { scale: 2, color: '#ffffff', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
      }
      if (this.state !== 'drive') return;
      const x = Math.round(this.x), y = Math.round(this.y), s = DUNES.slope(this.cx);
      ctx.save(); ctx.translate(x + 15, y + 17); ctx.rotate(Math.atan(s) * 0.8); ctx.translate(-15, -17);
      // turistas gritando con los brazos arriba
      const arms = Math.floor(this.t / 8) % 2;
      for (const [hx, hair, shirt] of [[9, '#3a2412', '#3f6fb8'], [17, '#f6c94a', '#d8432f']]) {
        R(ctx, shirt, hx, 6, 5, 4); R(ctx, '#e7b089', hx + 1, 2, 4, 4); R(ctx, hair, hx + 1, 1, 4, 2);
        R(ctx, '#e7b089', hx - 1, arms ? -2 : 0, 1, 6); R(ctx, '#e7b089', hx + 5, arms ? 0 : -2, 1, 6);
        R(ctx, '#2a1f2d', hx + 2, 4, 1, 1); R(ctx, '#2a1f2d', hx + 2, 5, 2, 1);
      }
      // jaula tubular naranja
      ctx.fillStyle = '#f0913c';
      R(ctx, '#f0913c', 4, 0, 22, 2); R(ctx, '#f0913c', 4, 0, 2, 11); R(ctx, '#f0913c', 24, 0, 2, 11);
      R(ctx, '#f0913c', 2, 10, 27, 2); R(ctx, '#b45f1e', 2, 12, 27, 1);
      R(ctx, '#2a1f2d', 3, 9, 2, 2); R(ctx, '#ffe9a8', 1, 9, 2, 2);   // faro (va hacia la izquierda)
      // ruedas grandes
      for (const wx of [6, 23]) { R(ctx, '#1d1622', wx - 4, 11, 8, 6); R(ctx, '#1d1622', wx - 3, 10, 6, 8); R(ctx, '#8a8296', wx - 1, 13, 2, 2); }
      ctx.restore();
    }
  }

  // EL BUS MALOGRADO al inicio: echa humo; el chofer ya se rindió
  class BrokenBus extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS - 44, 96, 44); this.base = def.y * TS; this.t = 0; }
    update(g) {
      this.t++;
      if (this.t % 9 === 0) g.particles.push({ x: this.x + 4 + Math.random() * 6, y: this.base - 30, vx: -0.15 + Math.random() * 0.2, vy: -0.45, life: 80, max: 80, col: Math.random() < 0.5 ? '#5d5768' : '#3a3442', size: 2, grav: -0.004 });
      if (g.time === 50 && g.near(this.cx, 300)) g.toast('¡SE MALOGRÓ EL BUS EN PLENO DESIERTO!');
    }
    draw(ctx) {
      const x = Math.round(this.x), b = this.base;
      ctx.save(); ctx.translate(x + 48, b); ctx.rotate(0.03); ctx.translate(-48, 0);
      R(ctx, 'rgba(60,40,20,0.25)', 2, -2, 94, 3);
      R(ctx, '#f4efe4', 0, -40, 94, 32); R(ctx, '#2b4f86', 0, -14, 94, 6); R(ctx, '#d8432f', 0, -17, 94, 3);
      for (let k = 0; k < 8; k++) { R(ctx, '#2b3a4a', 6 + k * 10, -35, 8, 11); R(ctx, '#7fa4c4', 7 + k * 10, -34, 3, 4); }
      R(ctx, '#2b3a4a', 86, -35, 7, 18); R(ctx, '#7fa4c4', 87, -34, 3, 6);   // parabrisas
      drawText(ctx, 'ICA - LIMA', 46, -24, { color: '#2b4f86', align: 'center' });
      R(ctx, '#3a3442', 0, -8, 94, 2);
      for (const wx of [16, 74]) { R(ctx, '#1d1622', wx - 6, -9, 12, 9); R(ctx, '#8a8296', wx - 2, -6, 4, 3); }
      // capó del motor abierto atrás
      R(ctx, '#d6d0c4', -3, -44, 4, 14); R(ctx, '#1d1622', 1, -30, 4, 12);
      ctx.restore();
    }
  }

  // PALMERA del oasis
  class Palm extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS, 8, 8); this.t = Math.floor(def.x * 13); this.tall = def.tall || 52; this.lean = def.lean || 0.25; }
    update() { this.t++; }
    drawBack(ctx) {
      const bx = this.x + 8, by = this.y, H = this.tall;
      let x = bx;
      for (let i = 0; i < H; i += 3) { x = bx + Math.round(Math.pow(i / H, 2) * H * this.lean); R(ctx, i % 6 ? '#8a6a44' : '#6e5232', x - 2, by - i - 3, 5, 3); }
      const tx = x, ty = by - H - 2, sw = Math.sin(this.t * 0.03) * 1.5;
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + (k - 3) * 0.55, len = 18 + (k % 2) * 5;
        for (let s = 0; s < len; s += 2) {
          const dx = Math.cos(a) * s * 1.1 + (s / len) * sw, dy = Math.sin(a) * s * 0.55 + Math.pow(s / len, 2) * 14;
          R(ctx, s > len * 0.6 ? '#4f8a3a' : '#3d7a30', tx + dx, ty + dy, 3, 2);
        }
      }
      R(ctx, '#6e4627', tx - 3, ty + 1, 3, 3); R(ctx, '#5a3b22', tx + 1, ty + 2, 3, 3);   // cocos (bueno, dátiles)
    }
    draw() {}
  }

  // LETREROS: estilo 'post' (verde de carretera), 'paper' (cartulina pegada),
  // 'paint' (pintado en la pared), 'board' (panel publicitario en postes)
  class Sign extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS, 8, 8); this.lines = def.lines; this.style = def.style || 'post'; this.col = def.col; this.tilt = def.tilt || 0; }
    update() {}
    draw(ctx) {
      const w = Math.max(...this.lines.map(l => textWidth(l))) + 8, h = this.lines.length * 9 + 4;
      const x = Math.round(this.x), y = Math.round(this.y);
      ctx.save(); ctx.translate(x, y); ctx.rotate(this.tilt);
      if (this.style === 'post' || this.style === 'board') {
        const bg = this.style === 'post' ? '#1f6e43' : (this.col || '#f4efe4'), fg = this.style === 'post' ? '#ffffff' : '#2b4f86';
        const top = -h - (this.style === 'post' ? 26 : 34);
        R(ctx, '#5d5768', -w / 2 + 4, top, 2, -top); R(ctx, '#5d5768', w / 2 - 6, top, 2, -top);
        R(ctx, '#1d1622', -w / 2 - 1, top - 1, w + 2, h + 2); R(ctx, bg, -w / 2, top, w, h);
        if (this.style === 'post') { R(ctx, '#ffffff', -w / 2 + 1, top + 1, w - 2, 1); R(ctx, '#ffffff', -w / 2 + 1, top + h - 2, w - 2, 1); }
        this.lines.forEach((l, i) => drawText(ctx, l, 0, top + 3 + i * 9, { color: i === 0 && this.style === 'board' ? '#d8432f' : fg, align: 'center' }));
      } else if (this.style === 'paper') {
        R(ctx, 'rgba(30,20,20,0.3)', -w / 2 + 1, 1, w, h); R(ctx, '#fffaf0', -w / 2, 0, w, h);
        R(ctx, '#c9c2b0', -w / 2 + 2, 0, 3, 1); R(ctx, '#c9c2b0', w / 2 - 5, 0, 3, 1);   // cinta
        this.lines.forEach((l, i) => drawText(ctx, l, 0, 3 + i * 9, { color: this.col || '#d8432f', align: 'center' }));
      } else {
        this.lines.forEach((l, i) => drawText(ctx, l, 0, 2 + i * 9, { color: this.col || '#fffaf0', align: 'center', shadow: true, shadowColor: 'rgba(40,10,10,0.6)' }));
      }
      ctx.restore();
    }
  }

  // AMBULANTE: grita lo que vende cuando pasas
  class Vendor extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS - 25, 16, 25); this.base = def.y * TS; this.shout = def.shout; this.kind = def.kind || 'chicha'; this.t = Math.floor(def.x * 7); this.said = false; this.sayT = 0; }
    onRespawn() { this.said = false; }
    update(g) {
      this.t++; if (this.sayT > 0) this.sayT--;
      if (!this.said && Math.abs(g.player.cx - this.cx) < 90) { this.said = true; this.sayT = 140; g.toast(this.shout); g.audio('shout'); }
    }
    draw(ctx, g) {
      const x = Math.round(this.x), b = this.base;
      // carrito o caja
      if (this.kind === 'chicha') {
        R(ctx, '#6b4524', x + 15, b - 14, 18, 3); R(ctx, '#3a2412', x + 17, b - 11, 2, 11); R(ctx, '#3a2412', x + 29, b - 11, 2, 11);
        R(ctx, '#dfe3e8', x + 18, b - 26, 12, 12); R(ctx, '#5a2a6e', x + 19, b - 22, 10, 8); R(ctx, '#7a3c96', x + 19, b - 22, 10, 2);
        R(ctx, '#9aa0a8', x + 18, b - 27, 12, 1);
      } else {
        R(ctx, '#3f6fb8', x + 15, b - 12, 16, 12); R(ctx, '#ffffff', x + 15, b - 12, 16, 2); R(ctx, '#27426e', x + 15, b - 2, 16, 2);
        R(ctx, '#d8432f', x + 17, b - 17, 4, 5); R(ctx, '#f6c94a', x + 22, b - 16, 6, 4);
      }
      const img = OBJ.mom[this.sayT > 0 && Math.floor(this.t / 18) % 2 ? 1 : 0];
      ctx.drawImage(g.player.cx < this.cx ? flipS(img) : img, x, b - 25);
      if (this.sayT > 0) bubble(ctx, this.shout.replace(/[¡!]/g, '').split(',')[0] + '!', x + 8, b - 30);
    }
  }

  // ── LA PANAMERICANA: combis ─────────────────────────────────────────────────
  const COMBI_PAINT = [['#c8322a', '#f2c230'], ['#2b6fb8', '#f4efe4'], ['#1f8a4a', '#f2c230'], ['#7a3c96', '#f08a7a']];
  const STOP_SHOUTS = ['¡SUBE, SUBE, HAY SITIO!', '¡LIMA, LIMA, LIMA!', '¡AL FONDO HAY SITIO!'];
  // Combi: el techo es una plataforma móvil (te lleva); el cuerpo, en marcha, te atropella.
  class Combi extends Actor {
    constructor(x, roadY, def) {
      super(x, roadY - 30, 62, 6);
      this.isMover = true; this.dx = 0; this.dy = 0; this.bodyH = 30; this.roadY = roadY;
      this.v = 2.4; this.vmax = 2.6; this.state = 'drive'; this.stopT = 0; this.t = 0; this.hazardKind = 'combi';
      this.stops = def.stops.map(s => ({ x: s.x * TS, wait: s.wait || 110, peaje: !!s.peaje })).filter(s => s.x > x + 31 + 4);
      this.end = def.end * TS; this.paint = COMBI_PAINT[def.n % COMBI_PAINT.length]; this.sayT = 0; this.say = '';
    }
    onRespawn() { this.dead = true; }
    shout(g, text) { this.say = text; this.sayT = 100; if (g.near(this.cx, 280)) { g.toast(text); g.audio('shout'); } }
    get stoppedAtPeaje() { return this.state === 'stop' && this.stops[0] && this.stops[0].peaje; }
    update(g) {
      const px = this.x; this.t++; if (this.sayT > 0) this.sayT--;
      const p = g.player, aboard = p.lastMover === this;
      if (aboard && !this.wasAboard) { this.shout(g, '¡OYE, AL FONDO HAY SITIO!'); g.combiRides = (g.combiRides || 0) + 1; }
      this.wasAboard = aboard;
      const next = this.stops[0];
      if (this.state === 'drive') {
        if (next) {
          const d = next.x - this.cx, brake = this.v * this.v / (2 * 0.06) + 2;
          if (d <= 0.8) { this.x = next.x - this.w / 2; this.v = 0; this.state = 'stop'; this.stopT = next.wait; g.audio('brake');
            this.shout(g, aboard ? '¡BAJA, BAJA!' : next.peaje ? '¡PAGA EL PEAJE, CHOFER!' : STOP_SHOUTS[(this.t >> 3) % STOP_SHOUTS.length]); }
          else if (d < brake) this.v = Math.max(0.35, this.v - 0.06);
          else this.v = Math.min(this.vmax, this.v + 0.05);
        } else this.v = Math.min(this.vmax + 0.4, this.v + 0.05);
        // no se choca con la combi de adelante: la sigue a distancia
        let gap = 1e9, ahead = null;
        for (const e of g.entities) if (e instanceof Combi && e !== this && !e.dead && e.x > this.x) { const d = e.x - this.x - this.w; if (d < gap) { gap = d; ahead = e; } }
        if (ahead && gap < 14) this.v = 0;
        else if (ahead && gap < 44) this.v = Math.min(this.v, ahead.v);
        this.x += this.v;
      } else if (--this.stopT <= 0) { this.state = 'drive'; this.stops.shift(); g.audio('honk'); }
      if (this.x > this.end) this.dead = true;   // se mete al túnel de la Vía Expresa
      this.dx = this.x - px; this.dy = 0;
      // salpica al cruzar el aniego
      if (this.v > 0.5 && this.t % 3 === 0) for (const wx of [this.x + 10, this.x + 48]) if (liquidAt(g.level, wx, this.roadY + 2)) g.burst(wx, this.roadY - 2, 'splash', 2);
    }
    hazardBox() { return Math.abs(this.dx) > 0.3 ? { x: this.x + 3, y: this.y + 8, w: this.w - 6, h: this.bodyH - 8 } : null; }
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y) + (this.v > 0.5 && Math.floor(this.t / 4) % 2 ? 1 : 0), [c1, c2] = this.paint;
      R(ctx, 'rgba(20,20,30,0.3)', x + 2, this.roadY - 2, 60, 3);
      // carrocería
      R(ctx, '#efe6cf', x + 1, y + 3, 60, 22); R(ctx, '#efe6cf', x, y + 5, 62, 19);
      R(ctx, '#d9cfb3', x + 3, y, 54, 4); for (let k = 6; k < 54; k += 8) R(ctx, '#5d5768', x + k, y - 1, 2, 2);   // parrilla del techo
      R(ctx, c1, x, y + 20, 62, 2); R(ctx, c2, x, y + 22, 62, 1);
      // ventanas
      for (let k = 0; k < 4; k++) { R(ctx, '#3a4a5c', x + 4 + k * 9, y + 5, 7, 6); R(ctx, '#8fb3cf', x + 5 + k * 9, y + 6, 2, 2); }
      // puerta corrediza abierta con el cobrador colgado
      R(ctx, '#2a2530', x + 40, y + 6, 8, 16);
      const lean = this.state === 'stop' ? 3 : 1;
      R(ctx, '#3f6fb8', x + 44 + lean, y + 9, 4, 7); R(ctx, '#e7b089', x + 44 + lean, y + 5, 4, 4); R(ctx, '#1f1620', x + 44 + lean, y + 4, 4, 2);
      R(ctx, '#e7b089', x + 48 + lean, y + 7 - (Math.floor(this.t / 10) % 2) * 2, 3, 1);   // agita la mano
      // parabrisas, faro y parachoques
      R(ctx, '#3a4a5c', x + 51, y + 5, 9, 9); R(ctx, '#8fb3cf', x + 57, y + 6, 2, 3); R(ctx, '#fffaf0', x + 52, y + 3, 7, 2);
      R(ctx, '#fff6b0', x + 59, y + 16, 3, 2); R(ctx, '#5d5768', x - 1, y + 23, 64, 2);
      drawText(ctx, 'LIMA', x + 8, y + 12, { color: c1 });
      for (const wx of [11, 50]) { R(ctx, '#1d1622', wx + x - 4, y + 22, 8, 8); R(ctx, '#1d1622', wx + x - 3, y + 21, 6, 10); R(ctx, '#9aa0a8', wx + x - 1, y + 25, 2, 2); }
      if (this.sayT > 0 && !this.wasAboard) bubble(ctx, this.say, x + 46, y - 4);
    }
  }
  // Las combis salen cada tanto desde atrás (tocan claxon antes de entrar en pantalla)
  class CombiSpawner {
    constructor(def) { this.def = def; this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.t = 40; this.warn = 0; this.n = 0; }
    onRespawn() { this.t = 50; this.warn = 0; }
    update(g) {
      const p = g.player;
      if (p.cx < this.x0 - 40 || p.cx > this.x1) { this.warn = 0; return; }
      if (this.warn > 0) {
        if (--this.warn === 0) {
          const c = new Combi(Math.max(this.x0 - 90, g.cam.x - 70), GR * TS, Object.assign({ n: this.n++ }, this.def));
          g.addEntity(c); g.movers.push(c);
        }
        return;
      }
      if (--this.t <= 0) {
        const active = g.entities.filter(e => e instanceof Combi && !e.dead && e.x < g.cam.x + 200).length;
        if (active < 2) { this.warn = 55; g.audio('honk'); }
        this.t = 250 + Math.floor(Math.random() * 90);
      }
    }
    draw(ctx, g) {
      if (this.warn <= 0 || Math.floor(this.warn / 5) % 2) return;
      const x = g.cam.x + 14, y = GR * TS - 40;
      drawText(ctx, '!', x, y, { scale: 2, color: '#ffffff', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
      drawText(ctx, '¡PIII PIII!', x - 4, y + 18, { color: '#ffd166', shadow: true, shadowColor: '#2a1f2d' });
    }
  }
  // PARADERO: poste azul y techito (el techo es una plancha que se pisa)
  class Paradero extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS, 64, 8); this.base = GR * TS; }
    update() {}
    drawBack(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y), b = this.base;
      R(ctx, '#5d5768', x + 3, y, 2, b - y); R(ctx, '#5d5768', x + 59, y, 2, b - y);
      R(ctx, 'rgba(120,170,200,0.35)', x + 6, y + 6, 52, b - y - 16);   // vidrio
      R(ctx, '#6b4524', x + 14, b - 10, 36, 3); R(ctx, '#3a2412', x + 16, b - 7, 2, 7); R(ctx, '#3a2412', x + 46, b - 7, 2, 7);
    }
    draw(ctx) {
      const x = Math.round(this.x) - 10, b = this.base;
      R(ctx, '#5d5768', x, b - 40, 2, 40); R(ctx, '#2b6fb8', x - 13, b - 52, 28, 13); R(ctx, '#ffffff', x - 12, b - 51, 26, 1);
      drawText(ctx, 'BUS', x + 1, b - 48, { color: '#ffffff', align: 'center' });
    }
  }
  // PEAJE: casetas bajo el techo de franjas; la barrera sube cuando paga la combi
  class Peaje extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8); this.base = GR * TS; this.arm = 0; this.price = def.price; }
    update(g) {
      const open = g.entities.some(e => e instanceof Combi && e.stoppedAtPeaje && e.stopT < 70);
      this.arm += ((open ? 1 : 0) - this.arm) * 0.12;
    }
    drawBack(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y) + 5, b = this.base, w = this.w;
      R(ctx, '#9aa0a8', x + 2, y, 5, b - y); R(ctx, '#9aa0a8', x + w - 7, y, 5, b - y);
      // caseta del cobrador
      R(ctx, '#e8e2d4', x + 26, b - 34, 26, 34); R(ctx, '#2b3a4a', x + 30, b - 30, 18, 12); R(ctx, '#d8432f', x + 26, b - 36, 26, 3);
      R(ctx, '#e7b089', x + 36, b - 26, 5, 5); R(ctx, '#1f1620', x + 36, b - 27, 5, 2);
    }
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y), b = this.base;
      const label = 'PEAJE ' + this.price, lw = textWidth(label) + 8;
      R(ctx, '#1d1622', x + this.w / 2 - lw / 2 - 1, y + 5, lw + 2, 13); R(ctx, '#f6c94a', x + this.w / 2 - lw / 2, y + 6, lw, 11);
      drawText(ctx, label, x + this.w / 2, y + 8, { color: '#1d1622', align: 'center' });
      // barrera a rayas
      ctx.save(); ctx.translate(x + this.w - 30, b - 14); ctx.rotate(-this.arm * 1.3);
      for (let k = 0; k < 28; k += 4) R(ctx, (k / 4) % 2 ? '#ffffff' : '#d8432f', k, -1, 4, 3);
      ctx.restore(); R(ctx, '#5d5768', x + this.w - 33, b - 16, 5, 16);
    }
  }
  // ANIEGO: se rompió la tubería y el agua sale a chorros
  class Geyser extends Actor {
    constructor(def) { super(def.x * TS, GR * TS, 8, 8); this.t = Math.floor(def.x * 5); this.power = def.power || 1; }
    update(g) {
      this.t++;
      const k = 0.6 + 0.4 * Math.abs(Math.sin(this.t * 0.02));
      if (this.t % 2 === 0) for (let i = 0; i < 2; i++) g.particles.push({ x: this.x + 8 + (Math.random() - 0.5) * 4, y: this.y + 2, vx: (Math.random() - 0.5) * 1.2, vy: -(3 + Math.random() * 2.5) * k * this.power, life: 40, max: 40, col: Math.random() < 0.5 ? '#d2f6f2' : '#8cdde6', size: Math.random() < 0.4 ? 2 : 1, grav: 0.18 });
    }
    draw(ctx) { R(ctx, '#5d5768', this.x + 4, this.y + 2, 8, 4); R(ctx, '#9aa0a8', this.x + 5, this.y + 2, 6, 1); }
  }
  // PUENTE PEATONAL con escaleras (que nadie usa... menos tú)
  class Footbridge extends Actor {
    constructor(def) { super(def.x0 * TS, def.deck * TS, (def.x1 - def.x0) * TS, 8); this.steps = def.steps; this.deck = def.deck * TS; }
    update() {}
    drawBack(ctx) {
      // viga bajo el tablero
      R(ctx, '#8a8f99', this.steps[this.steps.length - 1][0] * TS + 48, this.deck + 5, this.x + this.w - this.steps[this.steps.length - 1][0] * TS - 48, 8);
      // pilares y barandas
      R(ctx, '#7d838c', this.x + this.w - 6, this.deck + 4, 4, GR * TS - this.deck - 4);
      for (const s of this.steps) { R(ctx, '#2b6fb8', s[0] * TS, s[1] * TS - 12, 48, 2); R(ctx, '#2b6fb8', s[0] * TS + 2, s[1] * TS - 12, 1, 12); }
      R(ctx, '#2b6fb8', this.steps[this.steps.length - 1][0] * TS, this.deck - 12, this.x + this.w - this.steps[this.steps.length - 1][0] * TS, 2);
      for (let x = this.steps[this.steps.length - 1][0] * TS; x < this.x + this.w; x += 6) R(ctx, '#2b6fb8', x, this.deck - 12, 1, 12);
    }
    draw(ctx) {
      // el cartel de siempre, colgado del puente
      const cx = this.x + this.w - 64, y = this.deck + 6;
      R(ctx, '#1d1622', cx - 47, y - 1, 94, 20); R(ctx, '#f4efe4', cx - 46, y, 92, 18);
      drawText(ctx, 'USE EL PUENTE', cx, y + 1, { color: '#2b4f86', align: 'center' });
      drawText(ctx, 'PEATONAL', cx, y + 10, { color: '#d8432f', align: 'center' });
    }
  }
  // ayuda: el camino sigue por arriba
  class StairsHint {
    constructor(def) { this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; }
    hint(g) { const p = g.player; return p.onGround && !p.lastMover && p.cx > this.x0 && p.cx < this.x1 && p.y + p.h >= GR * TS - 1 ? ['¡SUBE POR EL PUENTE PEATONAL!'] : null; }
    update() {}
    draw() {}
  }
  // TÚNEL de la Vía Expresa: las combis desaparecen en él (se dibuja delante)
  class Tunnel extends Actor {
    constructor(def) { super(def.x * TS, (GR - 3) * TS, 6 * TS, 3 * TS); }
    update() {}
    draw() {}
    drawFront(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      const gr = ctx.createLinearGradient(x, 0, x + 40, 0); gr.addColorStop(0, '#2a2530'); gr.addColorStop(1, '#0d0b12');
      ctx.fillStyle = gr; ctx.fillRect(x + 4, y + 10, this.w - 4, this.h - 10);
      R(ctx, '#9aa0a8', x, y, 6, this.h); R(ctx, '#b8b4ae', x, y, this.w, 12); R(ctx, '#7a756f', x, y + 11, this.w, 2);
      drawText(ctx, 'VÍA EXPRESA', x + this.w / 2 + 2, y + 3, { color: '#2a2530', align: 'center' });
      for (let k = 0; k < 3; k++) R(ctx, '#fff6b0', x + 20 + k * 24, y + 16, 4, 2);   // luces del túnel
    }
  }

  // ── LAS AZOTEAS ─────────────────────────────────────────────────────────────
  // FIERROS de construcción: varillas oxidadas que esperan "el segundo piso"
  class Rebar extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS - 10, (def.w || 2) * TS, 10); this.hazardKind = 'rebar'; }
    update() {}
    hazardBox() { return { x: this.x + 2, y: this.y + 1, w: this.w - 4, h: 9 }; }
    draw(ctx) {
      const x = Math.round(this.x), b = Math.round(this.y + this.h);
      for (let k = 0; k < this.w / 16; k++) {
        const cx = x + k * 16 + 3;
        R(ctx, '#a8a296', cx - 2, b - 3, 13, 3);   // pie de columna
        for (let j = 0; j < 4; j++) { R(ctx, '#8a4a2a', cx + j * 3, b - 12 + (j % 2), 1, 12); R(ctx, '#b06a3a', cx + j * 3, b - 12 + (j % 2), 1, 1); }
        R(ctx, '#6e3a20', cx - 1, b - 8, 12, 1);
      }
    }
  }
  // TANQUE DE AGUA negro sobre la azotea (sólido: se puede pisar)
  class WaterTank extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS - 32, 32, 32); }
    update() {}
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      R(ctx, '#1d1a22', x + 2, y + 5, 28, 27); R(ctx, '#2e2a34', x + 4, y + 5, 6, 27); R(ctx, '#3a3542', x + 5, y + 6, 2, 25);
      for (const yy of [12, 20, 27]) R(ctx, '#121016', x + 2, y + yy, 28, 1);
      R(ctx, '#2e2a34', x + 6, y + 1, 20, 4); R(ctx, '#1d1a22', x + 10, y, 12, 2);
    }
  }
  // ROPA TENDIDA: si caes encima, rebotas alto (las sábanas son un trampolín)
  class Clothesline extends Actor {
    constructor(def) {
      super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 12);
      this.lineY = def.y * TS; this.poleBase = [def.base0 * TS, def.base1 * TS]; this.sag = 0; this.prevFeet = 1e9; this.t = Math.floor(def.x0 * 3);
      this.hintText = def.hint;
    }
    hint(g) {
      const p = g.player;
      if (this.hintText && !this.used && p.onGround && p.cx > this.x - 140 && p.cx < this.x + 20) return [this.hintText];
      return null;
    }
    update(g) {
      this.t++; this.sag *= 0.88;
      const p = g.player, feet = p.y + p.h, top = this.lineY + 4;
      if (!p.riding && p.vy > 0 && this.prevFeet <= top + 1 && feet >= top && p.cx > this.x + 2 && p.cx < this.x + this.w - 2) {
        p.y = top - p.h; p.vy = -11.5; p.noCut = 30; p.onGround = false; p.coyote = 0; this.sag = 8; this.used = true;
        g.audio('boing'); g.audio('flap'); g.burst(p.cx, top + 4, 'paper', 6);
      }
      this.prevFeet = p.y + p.h;
    }
    drawBack(ctx) {
      const x0 = Math.round(this.x), x1 = Math.round(this.x + this.w), y = this.lineY;
      R(ctx, '#7d838c', x0 - 2, y - 2, 3, this.poleBase[0] - y + 2); R(ctx, '#7d838c', x1 - 1, y - 2, 3, this.poleBase[1] - y + 2);
    }
    draw(ctx, g) {
      const x0 = this.x, w = this.w, y = this.lineY, p = g.player;
      const sagAt = (x) => { const t = (x - x0) / w; return Math.sin(Math.PI * t) * (3 + this.sag * (1 - Math.min(1, Math.abs(x - p.cx) / 50))); };
      ctx.fillStyle = '#efe2c8'; for (let x = 0; x < w; x++) ctx.fillRect(Math.round(x0 + x), Math.round(y + sagAt(x0 + x)), 1, 1);
      // la ropa: polos, sábanas, un buzo y medias, colgados con ganchos
      const CLOTHES = [['#3f6fb8', 'polo'], ['#fffaf0', 'sheet'], ['#d8432f', 'pants'], ['#f6c94a', 'polo'], ['#9be7c4', 'sheet'], ['#c2185b', 'sock'], ['#8a4cc0', 'polo']];
      let x = x0 + 4, k = Math.floor(x0 / 7);
      while (x < x0 + w - 12) {
        const [c, kind] = CLOTHES[k++ % CLOTHES.length], cw = kind === 'sheet' ? 18 : kind === 'sock' ? 4 : 11;
        if (x + cw > x0 + w - 3) break;
        const yy = Math.round(y + sagAt(x + cw / 2)) + 1, sway = Math.round(Math.sin(this.t * 0.05 + k) * 1);
        if (kind === 'sheet') { R(ctx, c, x + sway, yy, cw, 13); R(ctx, 'rgba(0,0,0,0.12)', x + sway + cw - 4, yy, 4, 13); R(ctx, 'rgba(0,0,0,0.1)', x + sway, yy + 11, cw, 2); }
        else if (kind === 'polo') { R(ctx, c, x + sway, yy, cw, 3); R(ctx, c, x + 2 + sway, yy + 3, cw - 4, 7); R(ctx, 'rgba(0,0,0,0.15)', x + 4 + sway, yy, 3, 1); }
        else if (kind === 'pants') { R(ctx, c, x + sway, yy, cw, 4); R(ctx, c, x + sway, yy + 4, 4, 9); R(ctx, c, x + cw - 4 + sway, yy + 4, 4, 9); }
        else { R(ctx, c, x + sway, yy, 3, 6); R(ctx, c, x + sway, yy + 5, 5, 2); }
        R(ctx, '#e8a85a', x + 1, yy - 1, 1, 2); R(ctx, '#e8a85a', x + cw - 2, yy - 1, 1, 2);   // ganchos
        x += cw + 3;
      }
    }
  }
  // PERRO CHUSCO: duerme en su azotea; si te paras en ella, se despierta,
  // ladra y te persigue. Hay que saltarlo.
  class Dog extends Actor {
    constructor(def) {
      super(def.x1 * TS - 20, def.y * TS - 12, 18, 12);
      this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.roof = def.y * TS; this.home = this.x; this.hazardKind = 'dog';
      this.onRespawn();
    }
    onRespawn() { this.state = 'sleep'; this.t = 0; this.x = this.home; this.face = -1; this.turnT = 0; }
    update(g) {
      this.t++;
      const p = g.player, onRoof = p.cx > this.x0 - 6 && p.cx < this.x1 + 6 && p.y + p.h <= this.roof + 2 && p.y + p.h > this.roof - 70;
      if (this.state === 'sleep') { if (onRoof && p.onGround) { this.state = 'alert'; this.t = 0; g.audio('bark'); } return; }
      if (this.state === 'alert') {
        this.face = p.cx < this.cx ? -1 : 1;
        if (this.t % 16 === 0) g.audio('bark');
        if (this.t > 34) { this.state = 'chase'; this.t = 0; }
        return;
      }
      if (this.state === 'chase') {
        if (!onRoof) { this.state = 'back'; this.t = 0; return; }
        const want = p.cx < this.cx ? -1 : 1;
        // si lo saltas, tarda un poco en darse la vuelta
        if (want !== this.face) { if (++this.turnT > 14) { this.face = want; this.turnT = 0; } }
        else { this.turnT = 0; this.x += this.face * 1.55; }
        this.x = Math.max(this.x0, Math.min(this.x1 - this.w, this.x));
        if (this.t % 30 === 0) g.audio('bark');
        return;
      }
      // vuelve a su rincón y se echa
      if (onRoof && p.onGround) { this.state = 'alert'; this.t = 0; return; }
      const d = this.home - this.x; this.face = Math.sign(d) || this.face; this.x += Math.max(-0.8, Math.min(0.8, d));
      if (Math.abs(d) < 1) { this.state = 'sleep'; this.face = -1; }
    }
    hazardBox() { return this.state === 'sleep' ? null : { x: this.x + 3, y: this.y + 3, w: this.w - 6, h: this.h - 3 }; }
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      let img = DOG.sleep;
      if (this.state === 'alert') img = Math.floor(this.t / 8) % 2 ? DOG.bark : DOG.a;
      else if (this.state === 'chase' || this.state === 'back') img = this.turnT > 0 ? DOG.bark : (Math.floor(this.t / 5) % 2 ? DOG.a : DOG.b);
      ctx.drawImage(this.face < 0 ? flipS(img) : img, x, y + (this.state === 'chase' && Math.floor(this.t / 5) % 2 ? -1 : 0));
      if (this.state === 'sleep') { const z = Math.floor(this.t / 30) % 3; drawText(ctx, 'Z', x + 12 + z * 2, y - 6 - z * 3, { color: '#fffaf0', shadow: true, shadowColor: '#2a1f2d' }); }
      else if (this.state === 'alert' || (this.state === 'chase' && Math.floor(this.t / 30) % 2 === 0)) bubble(ctx, '¡GUAU!', x + 9, y - 2, '#d8432f');
    }
  }
  // CABLES de luz entre edificios, con zapatillas colgadas
  class Cable extends Actor {
    constructor(def) { super(def.x0 * TS, def.y0 * TS, (def.x1 - def.x0) * TS, 8); this.y1 = def.y1 * TS; this.shoes = def.shoes; }
    update() {}
    drawBack(ctx) {
      const x0 = this.x, x1 = this.x + this.w, y0 = this.y, y1 = this.y1;
      for (let c = 0; c < 2; c++) for (let x = x0; x < x1; x++) {
        const t = (x - x0) / (x1 - x0), y = y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * (10 + c * 5) + c * 3;
        R(ctx, '#1d1a22', x, y, 1, 1);
        if (this.shoes && c === 0 && Math.abs(t - 0.45) < 0.005) {
          // un par de zapatillas colgando de los pasadores
          R(ctx, '#efe2c8', x, y, 1, 9); R(ctx, '#efe2c8', x + 3, y, 1, 7);
          R(ctx, '#fffaf0', x - 3, y + 9, 6, 3); R(ctx, '#d8432f', x - 3, y + 11, 6, 1);
          R(ctx, '#fffaf0', x + 1, y + 7, 6, 3); R(ctx, '#2b6fb8', x + 1, y + 9, 6, 1);
        }
      }
    }
    draw() {}
  }
  // ventanas en las fachadas
  class Facade extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8); this.cols = def.x1 - def.x0; this.seed = def.x0; }
    update() {}
    draw(ctx, g) {
      const y0 = this.y + 22;
      for (let fl = 0; fl < 4; fl++) for (let c = 1; c < this.cols - 1; c += 4) {
        const x = this.x + c * TS + 4, y = y0 + fl * 48;
        if (y > g.cam.y + VIEW.h || h2(this.seed * 31 + fl * 7 + c) < 0.25) continue;
        R(ctx, '#3a3442', x - 1, y - 1, 22, 18); R(ctx, '#2a3540', x, y, 20, 16); R(ctx, '#5a7086', x + 2, y + 2, 7, 5);
        R(ctx, '#3a3442', x + 10, y, 1, 16);
        if (h2(this.seed + fl * 3 + c * 5) > 0.6) R(ctx, '#e8d06a', x + 12, y + 3, 6, 10);   // luz prendida
      }
    }
  }

  // ── EL COLEGIO ──────────────────────────────────────────────────────────────
  // El concurso en el patio: el jurado en su mesa, los otros concursantes con
  // sus proyectos y tu sitio vacío. La meta es pararte en tu sitio.
  class Contest extends Actor {
    constructor(def) {
      super(def.x * TS, def.y * TS - 60, 300, 60);
      this.base = def.y * TS; this.spot = def.x * TS + 120; this.done = false; this.t = 0; this.doneT = 0;
      // compañeros de otros colegios: mismo uniforme, otros colores
      this.mates = [STUDENT_COLORS[0], STUDENT_COLORS[2]].map(c => PIX.fromRows(KID_TOP.concat(KID_LEGS.stand), Object.assign({}, PAL, c)));
    }
    hint(g) { const p = g.player; return !this.done && Math.abs(p.cx - this.spot) < 160 && Math.abs(p.cx - this.spot) > 30 ? ['¡A TU SITIO, QUE YA EMPIEZA!'] : null; }
    update(g) {
      this.t++;
      const p = g.player;
      if (this.done) {
        this.doneT++; p.x += (this.spot - 4 - p.x) * 0.2;
        if (this.doneT % 6 === 0 && this.doneT < 60) g.particles.push({ x: this.spot + (Math.random() - 0.5) * 90, y: this.base - 90, vx: (Math.random() - 0.5) * 0.6, vy: 0.6, life: 90, max: 90, col: ['#d8432f', '#f6c94a', '#3f6fb8', '#9be7c4', '#ffffff'][this.doneT % 5], size: 2, grav: 0.02 });
        if (this.doneT === 40) g.gameComplete();
        return;
      }
      if (p.onGround && !p.riding && Math.abs(p.cx - this.spot) < 12) { this.done = true; p.won = true; p.vx = 0; g.audio('sit'); g.audio('applause'); }
    }
    drawBack(ctx) {
      // el colegio: pabellón de dos pisos, pintado de crema con zócalo granate
      const x = Math.round(this.x) - 20, b = this.base;
      R(ctx, '#e8dcc0', x, b - 120, 340, 120); R(ctx, '#8f2a2a', x, b - 22, 340, 22); R(ctx, '#d0c2a2', x, b - 62, 340, 3);
      for (let k = 0; k < 7; k++) for (const fy of [b - 108, b - 52]) { R(ctx, '#3a4a5c', x + 14 + k * 46, fy, 26, 22); R(ctx, '#8fb3cf', x + 16 + k * 46, fy + 2, 6, 6); R(ctx, '#e8dcc0', x + 26 + k * 46, fy, 2, 22); }
      R(ctx, '#d0c2a2', x - 4, b - 126, 348, 7);
      // banderola del concurso
      R(ctx, '#1d1622', x + 59, b - 151, 222, 22); R(ctx, '#d8432f', x + 60, b - 150, 220, 20); R(ctx, '#ffffff', x + 60, b - 140, 220, 1);
      drawText(ctx, 'CONCURSO ESCOLAR DE CIENCIAS', x + 170, b - 147, { color: '#ffffff', align: 'center' });
      drawText(ctx, '¡BIENVENIDOS!', x + 170, b - 138, { color: '#f6c94a', align: 'center' });
      R(ctx, '#5d5768', x + 60, b - 129, 2, 9); R(ctx, '#5d5768', x + 278, b - 129, 2, 9);
    }
    draw(ctx, g) {
      const x = Math.round(this.x), b = this.base, t = this.t;
      // otros concursantes: el volcán que hace erupción y el sistema solar
      const stand = (sx, label) => { R(ctx, '#8a5a30', sx, b - 16, 40, 3); R(ctx, '#6b4524', sx + 3, b - 13, 2, 13); R(ctx, '#6b4524', sx + 35, b - 13, 2, 13); R(ctx, '#fffaf0', sx + 6, b - 46, 28, 18); R(ctx, '#5d5768', sx + 19, b - 28, 2, 12); drawText(ctx, label, sx + 20, b - 42, { color: '#2b4f86', align: 'center' }); };
      stand(x, 'H2O'); stand(x + 150, 'ADN');
      // volcán de bicarbonato
      R(ctx, '#7a4f28', x + 10, b - 22, 20, 6); R(ctx, '#7a4f28', x + 14, b - 28, 12, 6); R(ctx, '#d8432f', x + 17, b - 30, 6, 3);
      if (t % 90 < 30) for (let k = 0; k < 3; k++) R(ctx, k % 2 ? '#f0913c' : '#d8432f', x + 18 + ((t + k * 3) % 5), b - 32 - ((t * 2 + k * 7) % 14), 2, 2);
      // un compañero junto a su proyecto
      const sp = Math.floor(t / 40) % 2;
      ctx.drawImage(this.mates[0], x + 42, b - 22 + sp);
      ctx.drawImage(flipS(this.mates[1]), x + 192, b - 22 + (1 - sp));
      // tu sitio: tu maqueta y un espacio vacío que brilla
      const sx = this.spot - 50;
      R(ctx, '#8a5a30', sx, b - 16, 40, 3); R(ctx, '#6b4524', sx + 3, b - 13, 2, 13); R(ctx, '#6b4524', sx + 35, b - 13, 2, 13);
      // la maqueta: una mini combi... y una mini llama
      R(ctx, '#efe6cf', sx + 6, b - 25, 16, 8); R(ctx, '#c8322a', sx + 6, b - 20, 16, 2); R(ctx, '#3a4a5c', sx + 8, b - 24, 3, 2); R(ctx, '#3a4a5c', sx + 13, b - 24, 3, 2);
      R(ctx, '#efe2c8', sx + 26, b - 25, 7, 5); R(ctx, '#efe2c8', sx + 31, b - 30, 2, 6); R(ctx, '#efe2c8', sx + 27, b - 20, 1, 3); R(ctx, '#efe2c8', sx + 31, b - 20, 1, 3);
      R(ctx, '#fffaf0', sx + 4, b - 46, 32, 16); drawText(ctx, 'MI PERÚ', sx + 20, b - 42, { color: '#d8432f', align: 'center' });
      if (!this.done) { const a = 0.25 + Math.sin(t * 0.12) * 0.15; ctx.fillStyle = 'rgba(255,230,140,' + a.toFixed(2) + ')'; ctx.fillRect(this.spot - 10, b - 5, 20, 5); }
      else ctx.drawImage(P.idle[0], Math.round(g.player.x - 4), b - 22 - (this.doneT < 10 && this.doneT % 4 < 2 ? 2 : 0));
      // el jurado en su mesa: miran el reloj... o aplauden
      const jx = x + 226;
      R(ctx, '#2b4f86', jx, b - 18, 74, 4); R(ctx, '#27426e', jx, b - 14, 74, 14); drawText(ctx, 'JURADO', jx + 37, b - 11, { color: '#ffffff', align: 'center' });
      const clap = this.done && Math.floor(t / 6) % 2;
      [[OBJ.teacher, 4], [OBJ.teacher2, 26], [OBJ.teacher, 48]].forEach(([img, ox], i) => {
        ctx.save(); ctx.beginPath(); ctx.rect(jx + ox - 2, b - 50, 20, 32); ctx.clip();
        ctx.drawImage(flipS(img), jx + ox, b - 44 + (clap && i % 2 ? -1 : 0)); ctx.restore();
      });
      if (!this.done && Math.abs(g.player.cx - this.spot) < 180) bubble(ctx, '¿Y EL CONCURSANTE?', jx + 37, b - 48);
      if (this.done) bubble(ctx, '¡BRAVO!', jx + 37, b - 48, '#d8432f');
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  FONDOS
  // ───────────────────────────────────────────────────────────────────────────
  // ciudad gris: edificios de varios pisos con ventanas, tanques y antenas
  const cityLayer = (seed, wall, wall2, win, maxH) => (g, W, H) => {
    let x = 0, i = 0;
    while (x < W) {
      const w = Math.min(W - x, 18 + Math.floor(h2(seed + i * 7) * 34)), hh = 18 + Math.floor(h2(seed + i * 13) * maxH), top = 128 - hh;
      g.fillStyle = h2(seed + i * 3) > 0.5 ? wall : wall2; g.fillRect(x, top, w, H - top);
      g.fillStyle = win;
      for (let yy = top + 4; yy < 124; yy += 6) for (let xx = x + 3; xx < x + w - 3; xx += 5) if (h2(seed + xx * 3 + yy) > 0.35) g.fillRect(xx, yy, 2, 3);
      if (h2(seed + i * 19) > 0.5) { g.fillStyle = '#2a2830'; g.fillRect(x + 4, top - 4, 6, 4); }
      if (h2(seed + i * 23) > 0.7) { g.fillStyle = '#2a2830'; g.fillRect(x + w - 6, top - 12, 1, 12); g.fillRect(x + w - 8, top - 5, 3, 2); }
      x += w; i++;
    }
  };
  // cerro con casitas de colores trepando (los asentamientos de Lima)
  const cerroLayer = (seed, col, col2) => (g, W, H) => {
    const ridge = (x) => 76 + Math.sin((x / W) * Math.PI * 2 + seed) * 18 + Math.sin((x / W) * Math.PI * 6 + seed * 2) * 7;
    for (let x = 0; x < W; x += 2) { const ry = Math.round(ridge(x) / 2) * 2; g.fillStyle = col; g.fillRect(x, ry, 2, H - ry); }
    const HC = ['#c9a0a8', '#c9bf8a', '#9fb0c4', '#b9a3c4', '#a8c0a0', '#d0b49a'];
    for (let k = 0; k < 520; k++) {
      const x = Math.floor(h2(seed * 97 + k) * W), ry = ridge(x), y = Math.floor(ry + 4 + h2(seed + k * 7) * (130 - ry));
      if (y > 128) continue;
      g.fillStyle = HC[k % HC.length]; g.fillRect(x, y, 3, 2); g.fillStyle = col2; g.fillRect(x, y + 2, 3, 1);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  RENDER PROPIO DEL CAPÍTULO
  // ───────────────────────────────────────────────────────────────────────────
  const LIMA_X = 338;
  function renderBack(ctx, g) {
    const cam = g.cam, x0 = Math.max(0, Math.floor(cam.x / 2) * 2 - 2), x1 = Math.min(DUNE_END * TS, cam.x + VIEW.w + 2);
    // la laguna del oasis, detrás de las palmeras
    const lx0 = 175 * TS, lx1 = 195 * TS, ly = GR * TS;
    if (lx1 > cam.x && lx0 < cam.x + VIEW.w) {
      for (let x = lx0; x < lx1; x += 2) {
        const k = Math.min(x - lx0, lx1 - x) / 40, d = Math.round(Math.min(1, k) * 6);
        R(ctx, '#2f7f8a', x, ly - d, 2, d); R(ctx, '#6fc6c8', x, ly - d, 2, 1);
      }
      for (let i = 0; i < 6; i++) { const sx = lx0 + 30 + ((i * 47 + g.T * 0.2) % (lx1 - lx0 - 60)); R(ctx, '#d2f6f2', sx, ly - 4 + (i % 2), 4, 1); }
    }
    // las dunas: arena dibujada columna a columna, con la cara de bajada en sombra y ondas del viento
    for (let x = x0; x < x1; x += 2) {
      const sy = Math.round(DUNES.surface(x + 1)), s = DUNES.slope(x + 1);
      if (sy > cam.y + VIEW.h) continue;
      const shade = s > 0.35 ? '#d9a868' : s < -0.2 ? '#ecc98c' : '#e4b979';
      R(ctx, '#dfb173', x, sy, 2, Math.max(0, cam.y + VIEW.h - sy)); R(ctx, shade, x, sy, 2, 22);
      R(ctx, s > 0.35 ? '#e2b273' : '#f8dca6', x, sy, 2, 1);
      for (let k = 1; k < 5; k++) { const yy = sy + k * 9 + ((x >> 4) % 3); if (h2(x * 3 + k * 101) > 0.45) R(ctx, 'rgba(160,110,60,0.18)', x, yy, 2, 1); }
    }
    // en Lima: el fondo de los callejones, oscuro, entre edificio y edificio
    if (cam.x + VIEW.w > 346 * TS && cam.x < SCHOOL * TS) {
      const top = 46 * TS, gr = ctx.createLinearGradient(0, top - 40, 0, top + 120);
      gr.addColorStop(0, 'rgba(60,58,70,0)'); gr.addColorStop(0.3, '#4a4652'); gr.addColorStop(1, '#25222c');
      ctx.fillStyle = gr; ctx.fillRect(Math.max(346 * TS, cam.x), top - 40, Math.min(VIEW.w, SCHOOL * TS - cam.x), cam.y + VIEW.h - top + 40);
    }
  }
  // garúa limeña: llovizna finita que casi no moja (pero se ve)
  function renderScreen(ctx, g) {
    const k = Math.max(0, Math.min(1, (g.cam.x / TS - LIMA_X) / 12));
    if (k <= 0) return;
    ctx.fillStyle = 'rgba(210,214,224,' + (0.1 * k).toFixed(3) + ')'; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    ctx.fillStyle = 'rgba(235,240,248,' + (0.55 * k).toFixed(3) + ')';
    for (let i = 0; i < 110; i++) {
      const sp = 1.6 + h2(i * 5) * 1.2;
      const x = ((h2(i * 3) * VIEW.w - g.T * sp * 0.35 - g.cam.x * 0.5) % VIEW.w + VIEW.w) % VIEW.w;
      const y = ((h2(i * 7) * VIEW.h + g.T * sp - g.cam.y * 0.5) % VIEW.h + VIEW.h) % VIEW.h;
      ctx.fillRect(Math.round(x), Math.round(y), 1, 2);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  MÚSICA: festejo para el desierto, chicha para la Panamericana y Lima
  // ───────────────────────────────────────────────────────────────────────────
  // bajo del festejo: golpe en el 1 y anticipación sincopada
  const festejoBass = (chords) => chords.map(c => { const [r, f] = BASS_OF[c]; return `${r}:3 ${f}:3 ${r}:2`; }).join(' ');
  const COSTA = { lead2Inst: 'none', strumInst: 'guitar' };
  Object.assign(SONGS, {
    desierto: makeSong(Object.assign({ bpm: 120, vol: 0.27, strum: 'D.UD.UD.', drums: 'B..bB.b.', kit: 'cajon', shaker: true, leadInst: 'guitar' }, COSTA), {
      A: { ch: ['G', 'C', 'D', 'G', 'G', 'C', 'D', 'G'],
           mel: 'D5:2 G5:1 G5:1 B5:2 G5:2 | E5:2 G5:1 E5:1 C5:2 E5:2 | D5:1 E5:1 F#5:1 G5:1 A5:2 F#5:2 | G5:3 D5:1 B4:4 | D5:2 G5:1 G5:1 B5:2 D6:2 | C6:2 B5:1 A5:1 G5:2 E5:2 | D5:1 E5:1 F#5:1 A5:1 G5:2 F#5:2 | G5:4 r:4' },
      B: { ch: ['Em', 'Am', 'D', 'G', 'Em', 'Am', 'D', 'G'],
           mel: 'B5:2 B5:1 A5:1 G5:2 E5:2 | A5:2 A5:1 G5:1 E5:2 C5:2 | F#5:2 A5:1 F#5:1 D5:2 F#5:2 | G5:2 B5:2 G5:4 | E5:1 G5:1 B5:2 E6:2 B5:2 | C6:2 A5:1 E5:1 A5:2 C6:2 | A5:1 G5:1 F#5:1 E5:1 D5:2 F#5:2 | G5:4 G4:4' },
    }, ['A', 'B', 'A', 'B'], festejoBass),
    panamericana: makeSong(Object.assign({ bpm: 100, vol: 0.27, strum: '.D.U.D.U', drums: 'B..bB.b.', kit: 'chicha', shaker: 'guiro', leadInst: 'eguitar' }, COSTA), {
      A: { ch: ['Am', 'Am', 'G', 'G', 'F', 'F', 'E', 'E'],
           mel: 'A4:1 C5:1 E5:1 A5:1 G5:2 E5:2 | C5:1 E5:1 A5:1 C6:1 B5:2 A5:2 | G4:1 B4:1 D5:1 G5:1 F5:2 D5:2 | B4:1 D5:1 G5:1 B5:1 A5:2 G5:2 | F5:2 E5:1 F5:1 A5:2 F5:2 | E5:1 D5:1 C5:1 D5:1 F5:2 A5:2 | G#5:2 B5:1 G#5:1 E5:2 D5:2 | B4:2 G#4:2 E4:4' },
      B: { ch: ['Dm', 'Dm', 'Am', 'Am', 'G', 'G', 'E', 'Am'],
           mel: 'D5:2 F5:1 A5:1 D6:2 A5:2 | C6:1 A5:1 F5:1 A5:1 D5:4 | E5:2 A5:1 C6:1 E6:2 C6:2 | B5:1 A5:1 G5:1 A5:1 E5:4 | D5:1 G5:1 B5:1 D6:1 B5:2 G5:2 | F5:1 E5:1 D5:1 E5:1 G5:4 | E5:1 G#5:1 B5:1 E6:1 D6:2 B5:2 | A5:4 A4:4' },
    }, ['A', 'B', 'A', 'B'], cumbiaBass),
    lima: makeSong(Object.assign({ bpm: 108, vol: 0.27, strum: '.D.U.D.U', drums: 'B.bbB.b.', kit: 'chicha', shaker: 'guiro', leadInst: 'eguitar' }, COSTA), {
      A: { ch: ['Em', 'Em', 'D', 'D', 'C', 'D', 'Em', 'Em'],
           mel: 'E5:1 G5:1 B5:1 E6:1 D6:2 B5:2 | G5:1 B5:1 E5:1 G5:1 F#5:2 E5:2 | D5:1 F#5:1 A5:1 D6:1 C6:2 A5:2 | F#5:1 A5:1 D5:1 F#5:1 E5:2 D5:2 | C5:2 E5:1 G5:1 C6:2 G5:2 | D5:2 F#5:1 A5:1 D6:2 A5:2 | B5:1 A5:1 G5:1 F#5:1 E5:2 B4:2 | E5:4 r:4' },
      B: { ch: ['Am', 'Am', 'Em', 'Em', 'C', 'D', 'Em', 'Em'],
           mel: 'A5:2 C6:1 A5:1 E5:2 A5:2 | G5:1 A5:1 G5:1 E5:1 C5:4 | B4:1 E5:1 G5:1 B5:1 A5:2 G5:2 | E5:2 G5:1 E5:1 B4:4 | C5:1 E5:1 G5:1 C6:1 B5:2 G5:2 | A5:1 F#5:1 D5:1 F#5:1 A5:4 | G5:1 F#5:1 E5:1 D5:1 B4:2 D5:2 | E5:8' },
    }, ['A', 'B', 'A*', 'B'], cumbiaBass),
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  EL NIVEL
  // ───────────────────────────────────────────────────────────────────────────
  const H = 70;
  // azoteas: [desde, hasta, fila del techo, tile]
  const BLD = [[363, 376, 42, 'roofS'], [379, 392, 40, 'roof'], [394, 410, 43, 'roof'], [411, 424, 35, 'roofS'], [427, 442, 38, 'roof'],
               [444, 456, 40, 'roofS'], [463, 478, 38, 'roof'], [481, 494, 41, 'roofS'], [497, 510, 39, 'roof'],
               [513, 526, 41, 'roofS'], [529, 541, 44, 'roof'], [544, 556, 36, 'roofS'], [559, 571, 39, 'roof'], [574, 586, 42, 'roofS']];
  const SCHOOL = 586;   // donde empieza el patio del colegio
  // escalones del puente peatonal: macizos (te frenan), de 3 casillas y 2 filas de alto
  const FB_STEPS = [[313, GR - 2], [316, GR - 4], [319, GR - 6], [322, GR - 8], [325, GR - 10], [328, GR - 12]];
  const STOPS = [{ x: 213.5 }, { x: 240.5 }, { x: 266.5, peaje: true, wait: 120 }, { x: 304.5 }];
  const L2 = {
    name: 'EL CONCURSO EN LIMA', w: 640, h: H, anchorRow: 46,
    dunes: DUNES,
    // amanecer despejado en el desierto
    sky: { dawn: ['#3a3466', '#d9826a', '#ffc68a'], morning: ['#5a9ad6', '#a9d4ee', '#f8e6bf'] },
    bgLayers: [
      // dunas lejanas, cada vez más cerca y más doradas
      { kind: 'hills', color: '#f0d3ad', color2: '#e6c39a', y: 43.6, parallax: 0.08, vpar: 0.10, amp: 4, seed: 5 },
      { kind: 'hills', color: '#e6bf8e', color2: '#d8ad7a', y: 45, parallax: 0.18, vpar: 0.24, amp: 3.2, seed: 8 },
      { kind: 'hills', color: '#d4a26a', color2: '#c4925c', y: 46.4, parallax: 0.32, vpar: 0.40, amp: 2.6, seed: 2 },
    ],
    bgZones: [
      // la costa: cerros pelados de tierra junto a la carretera
      { x0: 184, x1: 198, anchorRow: GR, sky: { dawn: ['#3a3466', '#d9826a', '#ffc68a'], morning: ['#5a9ad6', '#a9d4ee', '#f8e6bf'] }, layers: [
        { kind: 'mountains', color: '#c4a486', color2: '#b0906f', y: GR - 5, parallax: 0.08, vpar: 0.10, amp: 6, seed: 4 },
        { kind: 'mountains', color: '#a8866a', color2: '#94735a', y: GR - 2.6, parallax: 0.18, vpar: 0.24, amp: 4, seed: 9 },
        { kind: 'hills', color: '#d2ad7e', color2: '#bf9a6c', y: GR - 0.6, parallax: 0.32, vpar: 0.40, amp: 1.8, seed: 6 },
      ] },
      // Lima: cielo "panza de burro", cerros con casitas y la ciudad gris
      { x0: LIMA_X - 8, x1: LIMA_X + 4, anchorRow: 44, sky: { dawn: ['#6f7080', '#9a9aa6', '#bdbcbf'], morning: ['#8f929e', '#b4b6be', '#d2d1d2'], sun: false }, layers: [
        { kind: 'hills', color: '#a59a92', color2: '#958a83', y: 40, parallax: 0.06, vpar: 0.08, amp: 1, build: cerroLayer(3, '#a59a92', '#857a73') },
        { kind: 'hills', color: '#8e909c', color2: '#7f818d', y: 43, parallax: 0.14, vpar: 0.18, amp: 1, build: cityLayer(11, '#9a9ca8', '#8e909c', '#b6b8c2', 60) },
        { kind: 'hills', color: '#6f717e', color2: '#626470', y: 45.5, parallax: 0.3, vpar: 0.36, amp: 1, build: cityLayer(29, '#7a7c88', '#6f717e', '#8f93a0', 44) },
      ] },
    ],
    spawn: { x: 7, y: 36 },
    zones: [
      { x: 0,   name: 'EL DESIERTO',     music: 'desierto' },
      { x: 196, name: 'LA PANAMERICANA', music: 'panamericana' },
      { x: 346, name: 'LAS AZOTEAS',     music: 'lima' },
      { x: SCHOOL + 2, name: 'EL COLEGIO', music: 'lima' },
    ],
    rects: [
      ...duneFill(H),
      // ── LA PANAMERICANA: la pista sigue por debajo del puente hasta el túnel ──
      [196, GR, 156, H - GR, 'asphalt'],
      [346, GR - 2, 1, 2, 'blockInvis'],                        // boca del túnel: solo entran las combis
      ...FB_STEPS.map(s => [s[0], s[1], 3, GR - s[1], 'conc']),   // escalera del puente peatonal
      // ── LAS AZOTEAS ──
      [346, 44, 14, 10, 'roof'], [352, 54, 8, H - 54, 'roof'],  // sobre el túnel y el primer edificio
      ...BLD.map(b => [b[0], b[2], b[1] - b[0], H - b[2], b[3]]),
      // tanques de agua (sólidos)
      [371, 40, 2, 2, 'blockInvis'], [418, 33, 2, 2, 'blockInvis'], [467, 36, 2, 2, 'blockInvis'], [503, 37, 2, 2, 'blockInvis'], [550, 34, 2, 2, 'blockInvis'],
      // ── EL COLEGIO: el patio ──
      [SCHOOL, 46, 640 - SCHOOL, H - 46, 'conc'],
    ],
    platforms: [
      // techos de los paraderos
      [212, GR - 4, 4, 'steel'], [239, GR - 4, 4, 'steel'], [303, GR - 4, 4, 'steel'],
      // techo del peaje
      [262, GR - 6, 10, 'canopy'],
      // escaleras y tablero del puente peatonal
      [331, 44, 15, 'steel'],
    ],
    liquids: [
      // aniegos: la tubería reventó y la pista está inundada
      [222, GR, 10, 2, 'water', 1], [282, GR, 14, 2, 'water', 1],
    ],
    entities: [
      // ── EL DESIERTO ──
      { type: 'brokenBus', x: 0.3, y: 36 },
      { type: 'sandboard', x: 12, y: 36 },
      { type: 'sign', x: 14.5, y: 36, lines: ['ALQUILER', 'DE TABLAS'], style: 'board', col: '#fff3d6' },
      { type: 'cactus', x: 56 }, { type: 'cactus', x: 105 }, { type: 'cactus', x: 152 },
      { type: 'buggy', x: 62 }, { type: 'buggy', x: 122, speed: 1.9 },
      { type: 'checkpoint', x: 90, y: 47, w: 3, h: 8 },
      { type: 'page', x: 88.5, y: 41 },
      // el oasis de Huacachina
      { type: 'palm', x: 177, y: GR, tall: 54, lean: -0.2 }, { type: 'palm', x: 183, y: GR, tall: 44, lean: 0.25 }, { type: 'palm', x: 188, y: GR, tall: 58, lean: 0.1 }, { type: 'palm', x: 193, y: GR, tall: 40, lean: -0.3 },
      { type: 'sign', x: 181, y: GR, lines: ['HUACACHINA'], style: 'post' },
      // ── LA PANAMERICANA ──
      { type: 'checkpoint', x: 199, y: GR },
      { type: 'sign', x: 202, y: GR, lines: ['PANAMERICANA SUR', 'LIMA 299 KM'], style: 'post' },
      { type: 'combiSpawner', x0: 196, x1: 330, stops: STOPS, end: 346.5 },
      { type: 'vendor', x: 207, y: GR, shout: '¡CHICHA MORADA, CHICHA!', kind: 'chicha' },
      { type: 'paradero', x: 212, y: GR - 4 }, { type: 'paradero', x: 239, y: GR - 4 }, { type: 'paradero', x: 303, y: GR - 4 },
      { type: 'sign', x: 219.5, y: GR, lines: ['¡CUIDADO!', 'ANIEGO'], style: 'board', col: '#f6c94a' },
      { type: 'geyser', x: 226.5 }, { type: 'geyser', x: 288.5, power: 1.3 },
      { type: 'sign', x: 248, y: GR, lines: ['LIMA 12 KM'], style: 'post' },
      { type: 'vendor', x: 252, y: GR, shout: '¡GASEOSA, GALLETA, CHIFLES!', kind: 'cooler' },
      { type: 'peaje', x0: 262, x1: 272, y: GR - 6, price: 'S/ 6.10' },
      { type: 'page', x: 266.5, y: GR - 7 },
      { type: 'sign', x: 278, y: GR, lines: ['SE ROMPIÓ', 'LA TUBERÍA'], style: 'board', col: '#f6c94a' },
      { type: 'sign', x: 313, y: GR, lines: ['SE VENDE TERRENO', 'TRATO DIRECTO'], style: 'board' },
      { type: 'footbridge', x0: 313, x1: 346, deck: 44, steps: FB_STEPS },
      { type: 'stairsHint', x0: 296, x1: 330 },
      { type: 'tunnel', x: 346 },
      // ── LAS AZOTEAS ──
      { type: 'checkpoint', x: 350, y: 44 },
      ...BLD.map(b => ({ type: 'facade', x0: b[0], x1: b[1], y: b[2] })),
      { type: 'facade', x0: 352, x1: 360, y: 44 },
      { type: 'sign', x: 349, y: 45.2, lines: ['BIENVENIDOS', 'A LIMA'], style: 'paint', col: '#f6c94a' },
      { type: 'tank', x: 371, y: 42 }, { type: 'tank', x: 418, y: 35 }, { type: 'tank', x: 467, y: 38 }, { type: 'tank', x: 503, y: 39 },
      { type: 'sign', x: 369, y: 43.6, lines: ['SE ALQUILA', 'CUARTO'], style: 'paper' },
      { type: 'sign', x: 386, y: 41.8, lines: ['NO ORINAR'], style: 'paint', col: '#fffaf0' },
      { type: 'rebar', x: 384, y: 40 },
      { type: 'sign', x: 398, y: 44.6, lines: ['CUIDADO', 'CON EL PERRO'], style: 'paper', col: '#1d1622' },
      { type: 'dog', x0: 394, x1: 400.5, y: 43 },
      // la ropa tendida llega hasta la pared del edificio alto: si caes encima, rebotas
      { type: 'clothesline', x0: 401, x1: 411, y: 41, base0: 43, base1: 43, hint: '¡SALTA SOBRE LA ROPA TENDIDA!' },
      { type: 'page', x: 406, y: 32 },
      { type: 'cable', x0: 422, y0: 33.5, x1: 432, y1: 36.5, shoes: true },
      { type: 'cable', x0: 374, y0: 40, x1: 382, y1: 38 },
      { type: 'checkpoint', x: 428.5, y: 38 },
      { type: 'dog', x0: 433, x1: 442, y: 38 },
      { type: 'rebar', x: 449, y: 40 },
      { type: 'sign', x: 450, y: 41.6, lines: ['PROHIBIDO', 'ARROJAR BASURA'], style: 'paint', col: '#b8322a' },
      { type: 'clothesline', x0: 455.5, x1: 463, y: 37, base0: 40, base1: 38, hint: '¡OTRA VEZ LA ROPA!' },
      { type: 'dog', x0: 469, x1: 478, y: 38 },
      { type: 'rebar', x: 486, y: 41 },
      { type: 'sign', x: 488, y: 42.6, lines: ['HAY MAZAMORRA', 'MORADA'], style: 'paper' },
      { type: 'cable', x0: 492, y0: 40, x1: 500, y1: 38 },
      { type: 'checkpoint', x: 514.5, y: 41 },
      { type: 'rebar', x: 518, y: 41 },
      { type: 'sign', x: 520, y: 42.6, lines: ['SE ALQUILA', 'MINI DEPA'], style: 'paper' },
      { type: 'dog', x0: 529, x1: 536.5, y: 44 },
      { type: 'clothesline', x0: 537, x1: 544, y: 42, base0: 44, base1: 44, hint: '¡ARRIBA, POR LA ROPA!' },
      { type: 'tank', x: 550, y: 36 },
      { type: 'cable', x0: 555, y0: 34.5, x1: 562, y1: 37.5, shoes: true },
      { type: 'sign', x: 565, y: 40.6, lines: ['NO HAY', 'AGUA'], style: 'paint', col: '#b8322a' },
      { type: 'rebar', x: 563, y: 39 }, { type: 'dog', x0: 566, x1: 571, y: 39 },
      { type: 'sign', x: 580, y: 43.6, lines: ['SE HACEN', 'TAREAS'], style: 'paper', col: '#2b4f86' },
      // ── EL COLEGIO ──
      { type: 'checkpoint', x: SCHOOL + 3, y: 46 },
      { type: 'contest', x: SCHOOL + 10, y: 46 },
    ],
    decor: [],
    renderBack, renderScreen,
  };

  Object.assign(EXTRA_ENTITIES, {
    sandboard: (d) => new Sandboard(d.x * TS, d.y * TS),
    cactus: (d) => new Cactus(d),
    buggy: (d) => new Buggy(d),
    brokenBus: (d) => new BrokenBus(d),
    palm: (d) => new Palm(d),
    sign: (d) => new Sign(d),
    vendor: (d) => new Vendor(d),
    combiSpawner: (d) => new CombiSpawner(d),
    paradero: (d) => new Paradero(d),
    peaje: (d) => new Peaje(d),
    geyser: (d) => new Geyser(d),
    footbridge: (d) => new Footbridge(d),
    tunnel: (d) => new Tunnel(d),
    stairsHint: (d) => new StairsHint(d),
    rebar: (d) => new Rebar(d),
    tank: (d) => new WaterTank(d),
    clothesline: (d) => new Clothesline(d),
    dog: (d) => new Dog(d),
    cable: (d) => new Cable(d),
    facade: (d) => new Facade(d),
    contest: (d) => new Contest(d),
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  EL CAPÍTULO
  // ───────────────────────────────────────────────────────────────────────────
  CHAPTERS.push({
    num: 2, title: 'EL CONCURSO EN LIMA', short: 'LIMA', color: '#e0b47c',
    goal: '¡LLEGA AL CONCURSO ANTES DE LAS 8:00!', goalShort: '¡ANTES DE LAS 8:00!',
    banner: ['EL CONCURSO EN LIMA', '¡EL CONCURSO EMPIEZA A LAS 8:00!'],
    dayStart: 6 * 60 + 40,   // el bus se malogró a las 6:40: hay menos tiempo que en los Andes
    deathTitle: '¡ASU MARE!',
    deathMsgs: {
      combi: '¡TE CHAPÓ LA COMBI!', buggy: '¡TE ATROPELLÓ EL TUBULAR!', cactus: '¡TE ESPINASTE CON EL CACTUS!',
      water: '¡TE CAÍSTE AL ANIEGO!', dog: '¡EL PERRO CHUSCO TE BOTÓ!', rebar: '¡TE CHUZASTE CON LOS FIERROS!',
      fall: '¡TE FUISTE DE LA AZOTEA!', default: '¡QUÉ PASÓ, CAUSA!',
    },
    tips: ['TABLA: TÓCALA, BAJA LAS DUNAS Y SALTA EN LAS CRESTAS.', 'COMBI: SÚBETE AL TECHO PARA CRUZAR EL ANIEGO.', 'ROPA TENDIDA: CAE ENCIMA Y REBOTAS BIEN ALTO.', 'PERRO CHUSCO: SÁLTALO, NO TE DEJES ALCANZAR.'],
    onStart: (g) => { g.combiRides = 0; },
    win: {
      title: '¡LLEGASTE AL CONCURSO!',
      onTime: ['¡ANTES DE LAS 8:00!', '¡ANTES DE LAS 8:00 Y ANTES QUE EL JURADO!'],
      late: ['¡HORA PERUANA!', 'LLEGASTE CON HORA PERUANA... EL JURADO ESPERÓ'],
      allPages: ['¡EXPOSICIÓN COMPLETA!', '¡EXPOSICIÓN COMPLETA! EL JURADO TE APLAUDE'],
      drawCast: (ctx, cx, tick) => {
        // el perro chusco te sigue persiguiendo hasta en la pantalla final
        ctx.drawImage(Math.floor(tick / 5) % 2 ? DOG.a : DOG.b, cx - 62, 86 + (Math.floor(tick / 5) % 2));
        ctx.drawImage(P.run[Math.floor(tick / 7) % 4], cx - 8, 76);
        ctx.save(); ctx.translate(cx + 44, 98); ctx.rotate(-0.15);
        R(ctx, '#2a1f2d', -11, -4, 22, 4); R(ctx, '#f0913c', -10, -4, 20, 2); R(ctx, '#d8432f', -4, -4, 6, 2); R(ctx, '#2a1f2d', 10, -6, 2, 3);
        ctx.restore();
      },
      rows: (g, narrow, arrival) => [
        [narrow ? 'HOJAS' : 'HOJAS DE LA EXPOSICIÓN', g.pages + ' / 3', '#ffffff'],
        arrival,
        [narrow ? 'COMBIS' : 'COMBIS QUE TE LLEVARON', '' + (g.combiRides || 0), '#f6c94a'],
        ['CAÍDAS', '' + g.deaths, '#f2917d'],
      ],
    },
    level: buildLevel(L2),
  });
})();
