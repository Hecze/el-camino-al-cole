// guide.js — GUÍA DEL JUGADOR, compartida por todos los capítulos. Todo se
// declara en el array `entities` del nivel (x, y en casillas; y = fila del suelo):
//
//   { type: 'hint', x: 12, y: 144, text: 'SALTA', key: 'jump', arrow: 'down' }
//       Cartel que flota sobre (x, y): aparece al acercarte (r casillas antes,
//       por defecto 7) y se va al pasarlo (pass casillas después, por defecto 2).
//       key: 'jump' | 'left' | 'right' | 'down' → dibuja el botón del dispositivo
//       (táctil o teclado). arrow: 'up' | 'down' | 'left' | 'right' → flecha que
//       salta junto al cartel. vr: alto de la zona (casillas, por defecto 6).
//       dy: sube el cartel (px). when(g): solo se muestra si devuelve true.
//   { type: 'npc', x: 30, y: 144, model: 'pastor', lines: ['¡APÚRATE, HIJITO!'] }
//       Personaje que habla con un globo al acercarte (r casillas, por defecto 6);
//       las frases rotan solas. model: un nombre de GUIDE.models (los capítulos
//       pueden registrar los suyos: GUIDE.models.cobrador = () => [canvas, ...]).
//       flip: mira a la izquierda cuando no hay nadie cerca. ghost: solo el globo
//       (para alguien que ya dibuja otra entidad, como la mamá en la casa).
//   { type: 'prop', kind: 'gallina', x: 20, y: 144 }
//       Escenario que reacciona sin botón extra (ver PROP_KINDS más abajo):
//       gallina, cuy, perro, olla (bonus: minutos de reloj que regala), campana,
//       manta (cama elástica: w casillas de ancho), flor.
//   { type: 'checkpoint', ..., help: '¡SALTA EN EL BORDE!' }
//   { type: 'help', x0: 50, x1: 64, kind: 'water', text: '¡CORRE SIN PARAR!' }
//       Si mueres GUIDE.HELP_AFTER veces desde el último punto de control (o
//       dentro de [x0, x1], y de esa causa si trae kind), sale la ayuda en la
//       pantalla de caída y al volver.
//   { type: 'goal', x: 400, y: 110 }   (o level.goal = { x, y })
//       Si el jugador pasa ~5 s sin acercarse a lo siguiente (el próximo punto
//       de control o goal), aparece una flecha "¡POR AQUÍ!" que apunta hacia allá.
//       Opcional: when(g) → la meta vale solo mientras devuelva true (en vez de
//       "hasta pasarla"); at(g) → { x, y } en píxeles, para metas que se mueven.
//
// El motor llama a GUIDE.start / update / onDeath / onCheckpoint / onRespawn /
// renderScreen / deathLine desde game.js.
const GUIDE = (() => {
  const TS = TILE;
  const touch = () => 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
  const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

  // ── dibujo: paneles, botones y flechas ───────────────────────────────────
  function panel(ctx, x, y, w, h, bg, border) {
    R(ctx, border, x + 1, y - 1, w - 2, h + 2); R(ctx, border, x - 1, y + 1, w + 2, h - 2); R(ctx, border, x, y, w, h);
    R(ctx, bg, x + 1, y, w - 2, h); R(ctx, bg, x, y + 1, w, h - 2);
  }
  // triángulo pixel de lado n apuntando a dir, con la punta en (x, y)
  function tri(ctx, x, y, dir, n, col) {
    ctx.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const len = 1 + i * 2;
      if (dir === 'down') ctx.fillRect(Math.round(x - i), Math.round(y - i), len, 1);
      else if (dir === 'up') ctx.fillRect(Math.round(x - i), Math.round(y + i), len, 1);
      else if (dir === 'right') ctx.fillRect(Math.round(x - i), Math.round(y - i), 1, len);
      else ctx.fillRect(Math.round(x + i), Math.round(y - i), 1, len);
    }
  }
  const KEY_LABEL = { jump: 'ESPACIO' };
  function keyWidth(key) { return touch() || !KEY_LABEL[key] ? 11 : textWidth(KEY_LABEL[key]) + 6; }
  // el botón como se ve en el dispositivo: el botón A amarillo y las flechas
  // del táctil, o las teclas del teclado
  function drawKey(ctx, key, x, y) {
    if (touch() && key === 'jump') {
      R(ctx, '#5a3a12', x + 2, y, 7, 11); R(ctx, '#5a3a12', x, y + 2, 11, 7); R(ctx, '#5a3a12', x + 1, y + 1, 9, 9);
      R(ctx, '#ffd166', x + 2, y + 1, 7, 9); R(ctx, '#ffd166', x + 1, y + 2, 9, 7);
      drawText(ctx, 'A', x + 3, y + 2, { color: '#5a3a12' });
      return;
    }
    const w = keyWidth(key);
    panel(ctx, x, y, w, 11, '#fff3d6', '#8a8296');
    R(ctx, '#cdbde8', x + 1, y + 9, w - 2, 1);
    if (KEY_LABEL[key] && !touch()) drawText(ctx, KEY_LABEL[key], x + 3, y + 2, { color: '#2a1f2d' });
    else tri(ctx, x + 5 + (key === 'right' ? 2 : key === 'left' ? -2 : 0), y + (key === 'down' ? 7 : 5), key, 4, '#2a1f2d');
  }
  // corta una frase en renglones de como mucho maxW píxeles
  function wrap(text, maxW) {
    const out = []; let cur = '';
    for (const w of String(text).split(' ')) {
      const t = cur ? cur + ' ' + w : w;
      if (cur && textWidth(t) > maxW) { out.push(cur); cur = w; } else cur = t;
    }
    if (cur) out.push(cur);
    return out;
  }
  function puff(g, x, y, col, n, up = 1) {
    for (let i = 0; i < n; i++) g.particles.push({ x, y, vx: (Math.random() - 0.5) * 2.4, vy: -Math.random() * 2 * up, life: 24 + Math.random() * 16, max: 40, col, size: Math.random() < 0.4 ? 2 : 1, grav: 0.08 });
  }
  // texto que sube y se desvanece (¡GUAU!, +1 MIN...)
  class FloatText {
    constructor(x, y, text, col) { this.x = x; this.y = y; this.text = text; this.col = col; this.t = 0; }
    update() { if (++this.t > 50) this.dead = true; }
    draw(ctx) {
      ctx.globalAlpha = Math.min(1, (50 - this.t) / 15);
      drawText(ctx, this.text, this.x, this.y - this.t * 0.4, { color: this.col, align: 'center', shadow: true, shadowColor: '#2a1f2d' });
      ctx.globalAlpha = 1;
    }
  }

  // ── PISTA en el mundo ────────────────────────────────────────────────────
  // las pistas visibles dejan aquí su rectángulo: los globos que lo pisarían esperan
  const shown = new Set();
  class Hint extends Actor {
    constructor(d) {
      super(d.x * TS, d.y * TS, 1, 1);
      this.d = d; this.a = 0; this.t = 0;
      this.r = (d.r == null ? 7 : d.r) * TS; this.pass = (d.pass == null ? 2 : d.pass) * TS; this.vr = (d.vr || 6) * TS;
      this.lines = Array.isArray(d.text) ? d.text : [d.text];
    }
    update(g) {
      const p = g.player, dx = p.cx - this.x;
      // nada encima del título del capítulo
      const on = g.banner > 140 && dx > -this.r && dx < this.pass && Math.abs(p.cy - this.y) < this.vr && (!this.d.when || this.d.when(g));
      this.a = Math.max(0, Math.min(1, this.a + (on ? 0.12 : -0.08)));
      if (this.a > 0) {
        this.t++;
        const d = this.d, kw = d.key ? keyWidth(d.key) + 4 : 0;
        const w = Math.max(...this.lines.map(l => textWidth(l))) + kw + 8, h = this.lines.length * 9 + 4 + (d.key && this.lines.length === 1 ? 2 : 0);
        this.box = { x: Math.round(this.x - w / 2), y: Math.round(this.y - 34 - h - (d.dy || 0)), w, h, kw };
        shown.add(this);
      } else shown.delete(this);
    }
    onRespawn() { shown.delete(this); }
    drawFront(ctx) {
      if (this.a <= 0 || !this.box) return;
      const d = this.d, { w, h, kw } = this.box, x = this.box.x, y = Math.round(this.box.y - (1 - this.a) * 4);
      const bob = Math.floor(this.t / 20) % 2;
      ctx.globalAlpha = this.a;
      panel(ctx, x, y, w, h, 'rgba(28,18,30,0.86)', '#ffd166');
      if (d.key) drawKey(ctx, d.key, x + 4, y + Math.round(h / 2) - 5);
      this.lines.forEach((l, i) => drawText(ctx, l, x + 4 + kw, y + 3 + i * 9 + (d.key && this.lines.length === 1 ? 1 : 0), { color: i ? '#fff3d6' : '#ffffff' }));
      // flecha que salta hacia donde hay que ir o mirar
      const ar = d.arrow, A = '#ffd166';
      if (ar === 'down') tri(ctx, this.x, y + h + 8 + bob * 2, 'down', 4, A);
      else if (ar === 'up') tri(ctx, this.x, y - 8 - bob * 2, 'up', 4, A);
      else if (ar === 'right') tri(ctx, x + w + 7 + bob * 2, y + h / 2, 'right', 4, A);
      else if (ar === 'left') tri(ctx, x - 7 - bob * 2, y + h / 2, 'left', 4, A);
      ctx.globalAlpha = 1;
    }
    draw() {}
  }

  // ── PERSONAJES que hablan ────────────────────────────────────────────────
  // recolorea un sprite: { '#viejo': '#nuevo' }
  function recolor(src, map) {
    const c = PIX.createCanvas(src.width, src.height), g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    const im = g.getImageData(0, 0, c.width, c.height), px = im.data;
    // con tolerancia: algunos navegadores alteran un poco los colores del canvas
    const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const M = Object.keys(map).map(k => [hex(k), hex(map[k])]);
    for (let i = 0; i < px.length; i += 4) {
      if (!px[i + 3]) continue;
      for (const [f, t] of M) if (Math.abs(px[i] - f[0]) < 3 && Math.abs(px[i + 1] - f[1]) < 3 && Math.abs(px[i + 2] - f[2]) < 3) { px[i] = t[0]; px[i + 1] = t[1]; px[i + 2] = t[2]; break; }
    }
    g.putImageData(im, 0, 0);
    return c;
  }
  // PASTOR: abuelo con chullo, poncho y bastón (mirando a la derecha). 16x27
  const PASTOR_ROWS = [
    '......KKKK......',
    '.....KrrrrK.....',
    '....KryryrrK....',
    '....KrrrrrrK....',
    '...KyuyuyuyuK...',
    '...KhaaaaaaK....',
    '...KaaKaaKaK....',
    '...KaaaaaaabK...',
    '....KaWWWWaK....',
    '....KWWWWWWK....',
    '...KKKaaaaKKK...',
    '..KrrrrrrrrrrK.T',
    '.KrrryrrryrrrrKT',
    '.KrrrrrrrrrrrrKT',
    'KrrrRuRuRuRrrrKa',
    'KrrrrrrrrrrrraaT',
    '.KRRRRRRRRRRRRKT',
    '...KmmmmmmmmK..T',
    '...KmmmmmmmmK..T',
    '...KmmmKmmmmK..T',
    '...KmmmKKmmmK..T',
    '...KmmK..KmmK..T',
    '...KmmK..KmmK..T',
    '...KaaK..KaaK..T',
    '...KaaK..KaaK..T',
    '..KKKKK.KKKKK..T',
    '...............T',
  ];
  // niño o niña del pueblo, de pie (el sprite del protagonista con otra ropa)
  const kidModel = (map) => () => [recolor(P.idle[0], map), recolor(P.run[1], map)];
  const MODELS = {
    mama: () => OBJ.mom,
    // señora del mercado: manta verde y pollera morada
    senora: () => OBJ.mom.map(c => recolor(c, { '#c2185b': '#3f6b3a', '#d8432f': '#8a4cc0', '#962a22': '#5a3088' })),
    pastor: () => { const a = PIX.fromRows(PASTOR_ROWS, PAL); return [a, a]; },
    profe: () => [OBJ.teacher, OBJ.teacher],
    profa: () => [OBJ.teacher2, OBJ.teacher2],
    nino: kidModel({ '#d8432f': '#5c9f4a', '#962a22': '#3a7d36', '#f6c94a': '#f0913c' }),
    nina: kidModel({ '#d8432f': '#8a4cc0', '#962a22': '#5a3088', '#27426e': '#c2185b', '#3f6fb8': '#f08a7a' }),
  };
  const modelCache = {};
  function modelFrames(name, sprite) {
    if (sprite) return Array.isArray(sprite) ? sprite : [sprite, sprite];
    if (!modelCache[name]) modelCache[name] = (MODELS[name] || MODELS.nino)();
    return modelCache[name];
  }

  class Npc extends Actor {
    constructor(d) {
      const fr = modelFrames(d.model, d.sprite), base = d.y * TS;
      super(d.x * TS - fr[0].width / 2, base - fr[0].height, fr[0].width, fr[0].height);
      this.d = d; this.base = base; this.frames = fr; this.lines = d.lines || [];
      this.r = (d.r == null ? 6 : d.r) * TS; this.talking = false; this.line = 0; this.lt = 0; this.a = 0; this.t = Math.floor(d.x * 7);
      this.face = d.flip ? -1 : 1;
    }
    update(g) {
      this.t++;
      const p = g.player, dx = p.cx - this.cx;
      const near = g.banner > 140 && Math.abs(dx) < this.r && Math.abs(p.cy - this.cy) < 5 * TS && this.lines.length;
      if (near) {
        this.face = dx < 0 ? -1 : 1;
        if (!this.talking) { this.talking = true; this.line = 0; this.lt = 0; g.audio('click'); }
        // cada frase dura según lo larga que es; luego pasa a la siguiente
        if (++this.lt > 80 + this.lines[this.line].length * 3) { this.lt = 0; this.line = (this.line + 1) % this.lines.length; }
      } else if (this.talking && Math.abs(dx) > this.r + 3 * TS) this.talking = false;
      // si una pista ocupa el sitio del globo, el globo espera: la pista manda
      let blocked = false;
      if (this.talking) {
        const m = this.bubble(g);
        for (const h of shown) { const b = h.box; if (b.x < m.x + m.w + 2 && b.x + b.w + 2 > m.x && b.y < m.y + m.h + 1 && b.y + b.h + 1 > m.y) { blocked = true; break; } }
      }
      this.a = Math.max(0, Math.min(1, this.a + (this.talking && !blocked ? 0.15 : -0.15)));
    }
    draw(ctx) {
      if (this.d.ghost) return;
      // al hablar gesticula (cambia de cuadro); si no, respira
      const img = this.frames[this.talking && Math.floor(this.t / 14) % 2 ? 1 : 0];
      const bob = !this.talking && Math.floor(this.t / 40) % 3 === 0 ? 1 : 0;
      ctx.drawImage(this.face < 0 ? flipS(img) : img, Math.round(this.x), this.base - img.height + bob);
    }
    // el globo de la frase actual; no se sale de la pantalla (la colita sigue apuntando a la boca)
    bubble(g) {
      const rows = wrap(this.lines[this.line], 118), w = Math.max(...rows.map(l => textWidth(l))) + 8, h = rows.length * 9 + 4;
      const x = Math.round(Math.max(g.cam.x + 3, Math.min(g.cam.x + VIEW.w - w - 3, this.cx - w / 2 + this.face * 6)));
      return { rows, w, h, x, y: Math.round(this.y - h - 8) };
    }
    drawFront(ctx, g) {
      if (this.a <= 0 || !this.lines.length) return;
      const { rows, w, h, x } = this.bubble(g), hx = Math.round(this.cx), y = Math.round(this.y - h - 8 - (1 - this.a) * 3);
      ctx.globalAlpha = this.a;
      panel(ctx, x, y, w, h, '#fffaf0', '#2a1f2d');
      // colita del globo hacia la boca
      R(ctx, '#2a1f2d', hx - 2, y + h + 1, 5, 1); R(ctx, '#fffaf0', hx - 1, y + h, 3, 1);
      R(ctx, '#2a1f2d', hx - 1, y + h + 2, 3, 1); R(ctx, '#fffaf0', hx, y + h + 1, 1, 1); R(ctx, '#2a1f2d', hx, y + h + 3, 1, 1);
      rows.forEach((l, i) => drawText(ctx, l, x + 4, y + 3 + i * 9, { color: '#2a1f2d' }));
      ctx.globalAlpha = 1;
    }
  }

  // ── ESCENARIO INTERACTIVO ────────────────────────────────────────────────
  const S = (rows) => PIX.fromRows(rows, PAL);
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    SPR = {
      hen: S(['........rr..', '.......KrrK.', '..K....KwKwo', '.KwK...KwwK.', '.KwwKKKwwwr.', '.KwwwwwwwwK.', '..KwWwwwwwK.', '...KWWwwwK..', '....KKKKK...', '.....o..o...']),
      henFly: S(['...K....rr..', '..KwK..KrrK.', '..KwwK.KwKwo', '..KwwwKKwwK.', '.KwwwwwwwwK.', '.KwwwwwwwwK.', '..KwWwwwwwK.', '...KWWwwwK..', '....KKKKK...', '............']),
      cuy: S(['..KKKKK..', '.KmwwmmKK', 'KmmwwmmKa', 'KmmmmmmmK', '.KKKKKKK.']),
      cuyRun: S(['.........', '..KKKKKK.', '.KmwwmmKa', 'KmmmmmmmK', 'K.K..K.K.']),
      dog: S(['..........KK...', '.........KMMK..', '.........KmmmKK', '.K......KmmKmmK', '.KmK....KmmmmaK', '..KmKKKKKmmmKK.', '...KmmmmmmmmK..', '...KmMMmmmmmK..', '...KmmmmmmmmK..', '...KmK.KmK.KmK.', '...KK..KK..KK..']),
      pot: S(['..KKKKKK..', '.KzzzzzzK.', '..KZZZZK..', '.KzzzzzzK.', 'KzyzyzyzzK', 'KzAzzzzzzK', 'KzzzzzzzZK', 'KzzzzzzzZK', '.KZzzzzZK.', '..KKKKKK..']),
      bell: S(['...KK...', '..KyyK..', '.KyyyyK.', '.KyEyyK.', '.KyyyyK.', 'KyyyyyyK', 'KKKKKKKK', '...KK...']),
      bud: S(['..kG.Gk..', '.kGgGgGk.', 'kGgGkGgGk', '.kgGkGgk.', '..kGkGk..', '...kGk...', '...kGk...', '..kGGGk..']),
      bloom: S(['.x.kGk.x.', 'xXxGgGxXx', 'xXrGkGrXx', '.x.gGg.x.', '.xXkGkXx.', '.xXrGrXx.', '..x.k.x..', '..kGGGk..']),
    };
    return SPR;
  }

  // cada tipo: tamaño (px) y su comportamiento. Todas revisan primero si el
  // jugador está cerca (una resta): lejos no gastan nada.
  const PROP_KINDS = {
    // GALLINA: si pasas cerca sale volando, cacareando y soltando plumas
    gallina: { w: 12, h: 10,
      update(e, g, p, near) {
        if (!e.go && near(26)) { e.go = 1; e.vx = (p.cx < e.cx ? 1 : -1) * 1.6; e.vy = -3.4; g.audio('flap'); puff(g, e.cx, e.cy, '#f7ead2', 8); g.addEntity(new FloatText(e.cx, e.y - 6, '¡COC!', '#fff3d6')); }
        if (e.go && e.go < 200) { e.go++; e.vy = Math.min(e.vy + 0.12, 1.2); if (e.go % 16 === 0) e.vy = -1.8; e.x += e.vx; e.y += e.vy; }
      },
      draw(e, ctx, s) { if (e.go >= 200) return; const img = e.go ? (Math.floor(e.go / 4) % 2 ? s.henFly : s.hen) : s.hen; const peck = !e.go && Math.floor(e.t / 30) % 4 === 0 ? 1 : 0; ctx.drawImage(e.dir < 0 ? flipS(img) : img, Math.round(e.x), Math.round(e.y + peck)); },
    },
    // CUYES: corren a esconderse cuando pasas corriendo
    cuy: { w: 9, h: 5,
      update(e, g, p, near) {
        if (!e.go && near(40)) { e.go = 1; e.dir = p.cx < e.cx ? 1 : -1; g.audio('click'); }
        if (e.go && e.go < 50) { e.go++; e.x += e.dir * 2.2; }
      },
      draw(e, ctx, s) {
        for (let i = 0; i < 3; i++) {
          const img = e.go && e.go < 50 && Math.floor((e.go + i * 3) / 3) % 2 ? s.cuyRun : s.cuy;
          ctx.drawImage(e.dir < 0 ? flipS(img) : img, Math.round(e.x + i * 11 - 11), Math.round(e.y + (i === 1 ? 1 : 0)));
        }
      },
    },
    // PERRO chusco: te ladra y da un brinquito (no muerde)
    perro: { w: 15, h: 11,
      update(e, g, p, near) {
        if (e.cd > 0) e.cd--;
        e.dir = p.cx < e.cx ? -1 : 1;
        if (!e.cd && near(48)) { e.cd = 80; e.jump = 10; g.audio('bark'); g.addEntity(new FloatText(e.cx, e.y - 4, '¡GUAU!', '#fff3d6')); }
        if (e.jump > 0) e.jump--;
      },
      draw(e, ctx, s) { const up = e.jump > 0 ? Math.round(Math.sin(e.jump / 10 * Math.PI) * 4) : 0; ctx.drawImage(e.dir < 0 ? flipS(s.dog) : s.dog, Math.round(e.x), Math.round(e.y - up)); },
    },
    // OLLA de barro: se rompe al tocarla. Con bonus regala minutos de reloj
    olla: { w: 10, h: 10,
      update(e, g, p, near, body) {
        if (e.broken || !body.overlaps(e, 1)) return;
        e.broken = true; g.audio('crush'); g.shake(1, 6); puff(g, e.cx, e.cy, '#b8693d', 14);
        if (e.d.bonus) { g.time = Math.max(0, g.time - e.d.bonus * 200); g.audio('page'); g.addEntity(new FloatText(e.cx, e.y - 4, '+' + e.d.bonus + ' MIN', '#9be7c4')); }
      },
      draw(e, ctx, s) {
        if (!e.broken) { ctx.drawImage(s.pot, Math.round(e.x), Math.round(e.y)); if (e.d.bonus && Math.floor(e.t / 20) % 3 === 0) R(ctx, '#ffffff', e.x + 3, e.y + 2, 1, 2); return; }
        R(ctx, '#94502d', e.x, e.y + 8, 3, 2); R(ctx, '#b8693d', e.x + 4, e.y + 9, 3, 1); R(ctx, '#94502d', e.x + 7, e.y + 7, 3, 3);
      },
      reset(e) { if (!e.d.bonus) e.broken = false; },
    },
    // CAMPANA en su arco de madera: suena y se mece al tocarla
    campana: { w: 14, h: 26,
      update(e, g, p, near, body) {
        if (e.swing > 0) e.swing--;
        if (!e.swing && body.overlaps(e)) { e.swing = 70; g.audio('bell'); }
      },
      draw(e, ctx, s) {
        const x = Math.round(e.x), y = Math.round(e.y);
        R(ctx, '#6b4524', x, y, 2, 26); R(ctx, '#6b4524', x + 12, y, 2, 26); R(ctx, '#8a5a30', x - 1, y, 16, 3);
        const a = e.swing ? Math.round(Math.sin(e.swing * 0.35) * 2 * e.swing / 70) : 0;
        R(ctx, '#2a1f2d', x + 7, y + 3, 1, 3);
        ctx.drawImage(s.bell, x + 3 + a, y + 6);
      },
    },
    // MANTA tendida (aguayo): cama elástica. Cae encima y rebotas alto
    manta: { w: 48, h: 22,
      init(e) { e.w = (e.d.w || 3) * TS; e.x = e.d.x * TS; },
      update(e, g, p, near, body) {
        if (e.sag > 0) e.sag *= 0.8;
        const top = e.y + 8, feet = body.y + body.h;
        if (body.vy > 0 && e.prevFeet <= top + 1 && feet >= top && body.x + body.w > e.x + 3 && body.x < e.x + e.w - 3 && !(p.riding instanceof Cabra)) {
          body.y = top - body.h; body.vy = -9.4; body.onGround = false;
          if (body === p) { p.noCut = 30; p.coyote = 0; }
          e.sag = 6; g.audio('boing'); puff(g, body.cx, top, '#f6c94a', 6);
        }
        e.prevFeet = feet;
      },
      draw(e, ctx) {
        const x = Math.round(e.x), y = Math.round(e.y), w = e.w, sag = Math.round(e.sag || 0);
        R(ctx, '#6b4524', x, y, 2, 22); R(ctx, '#6b4524', x + w - 2, y, 2, 22);
        R(ctx, '#d9b45a', x + 2, y + 2, w - 4, 1);   // soga
        // aguayo a rayas que cuelga y se hunde al rebotar
        const cols = ['#d8432f', '#f6c94a', '#3f6fb8', '#c2185b', '#93a84a'];
        for (let i = 0; i < w - 8; i++) {
          const k = Math.sin((i / (w - 8)) * Math.PI), dip = Math.round(k * (2 + sag));
          for (let j = 0; j < 8; j++) R(ctx, cols[(j >> 1) % cols.length], x + 4 + i, y + 3 + dip + j, 1, 1);
        }
      },
    },
    // FLOR de cantuta: se abre cuando pasas y suelta pétalos
    flor: { w: 9, h: 8,
      update(e, g, p, near) { if (!e.open && near(20)) { e.open = true; puff(g, e.cx, e.y, '#f08a7a', 8); g.audio('leaf'); } },
      draw(e, ctx, s) { ctx.drawImage(e.open ? s.bloom : s.bud, Math.round(e.x), Math.round(e.y)); },
      reset(e) { e.open = false; },
    },
  };

  class Prop extends Actor {
    constructor(d) {
      const K = PROP_KINDS[d.kind] || PROP_KINDS.flor;
      super(d.x * TS - K.w / 2, d.y * TS - K.h, K.w, K.h);
      this.d = d; this.K = K; this.t = 0; this.dir = d.flip ? -1 : 1; this.home = { x: this.x, y: this.y };
      if (K.init) K.init(this);
      this.home = { x: this.x, y: this.y };
    }
    update(g) {
      this.t++;
      const p = g.player, body = p.riding || p;
      if (!this.go && Math.abs(body.cx - this.cx) > 80 + this.w) return;   // lejos: nada que hacer
      const near = (r) => Math.abs(body.cx - this.cx) < r + this.w / 2 && Math.abs(body.cy - this.cy) < 24;
      this.K.update(this, g, p, near, body);
    }
    onRespawn() {
      this.x = this.home.x; this.y = this.home.y; this.go = 0; this.vx = this.vy = 0;
      if (this.K.reset) this.K.reset(this);
    }
    draw(ctx) { this.K.draw(this, ctx, sprites()); }
  }

  // ── ayudas por muertes repetidas y flecha "por aquí" ──────────────────────
  const G = { HELP_AFTER: 2, IDLE_FRAMES: 300 };
  let helps = [], targets = [], cpDeaths = 0, cpHelp = null, helpText = null, helpT = 0;
  let target = null, best = Infinity, idle = 0, arrowA = 0;

  G.start = (g) => {
    const lv = g.level; shown.clear();
    helps = lv.entities.filter(d => d.type === 'help').map(d => ({ x0: d.x0 * TS, x1: d.x1 * TS, kind: d.kind, text: d.text, n: 0 }));
    cpDeaths = 0; cpHelp = (lv.spawn && lv.spawn.help) || null; helpText = null; helpT = 0;
    // a dónde ir: puntos de control y metas, en orden de izquierda a derecha
    targets = g.entities.filter(e => e instanceof Checkpoint).map(e => ({ x: e.spawn.x, y: e.spawn.y - 8, cp: e }));
    for (const d of lv.entities) if (d.type === 'goal') targets.push({ x: d.x * TS, y: d.y * TS - 8, when: d.when, at: d.at });
    if (lv.goal) targets.push({ x: lv.goal.x * TS, y: lv.goal.y * TS - 8 });
    targets.sort((a, b) => a.x - b.x);
    target = null; best = Infinity; idle = 0; arrowA = 0;
  };
  G.onCheckpoint = (cp) => { cpDeaths = 0; cpHelp = cp.help || null; };
  G.onDeath = (g) => {
    const x = g.player.cx;
    cpDeaths++;
    const z = helps.find(h => x >= h.x0 && x <= h.x1 && (!h.kind || h.kind === g.lastDeath));
    if (z) z.n++;
    helpText = z && z.n >= G.HELP_AFTER ? z.text : cpDeaths >= G.HELP_AFTER ? cpHelp : null;
  };
  G.onRespawn = () => { if (helpText) helpT = 300; idle = 0; best = Infinity; };
  G.deathLine = () => helpText;   // la pantalla de caída lo muestra debajo de la causa

  G.update = (g) => {
    if (helpT > 0) helpT--;
    const p = g.player;
    // el siguiente objetivo: el primer punto de control apagado o la primera meta por delante
    // (un punto de control que quedó atrás sin tocar ya no cuenta: la flecha nunca manda de vuelta)
    const t = targets.find(o => (o.cp ? !o.cp.on && o.x > p.cx - 6 * TS : o.when ? o.when(g) : p.cx < o.x - 16)) || null;
    if (t !== target) { target = t; best = Infinity; idle = 0; }
    if (!t) { arrowA = Math.max(0, arrowA - 0.1); return; }
    const T = t.at ? t.at(g) : t, d = Math.hypot(T.x - p.cx, T.y - p.cy);
    // si algo te lleva (montura, tren, balsa), hay una pista a la vista o alguien te habla, no hace falta la flecha
    const carried = p.riding || (p.lastMover && Math.abs(p.lastMover.dx || 0) > 0.2);
    const talking = g.entities.some(e => e instanceof Npc && e.talking);
    if (d < best - 24 || carried || shown.size || talking) { best = Math.min(best, d); idle = 0; } else idle++;
    arrowA = Math.max(0, Math.min(1, arrowA + (idle > G.IDLE_FRAMES ? 0.06 : -0.15)));
  };

  G.renderScreen = (ctx, g) => {
    const W = VIEW.w, H = VIEW.h;
    if (helpT > 0 && helpText) {
      const a = Math.min(1, helpT / 30, (300 - helpT) / 10), w = textWidth(helpText) + 12, y = Math.round(H * 0.3);
      ctx.globalAlpha = a;
      panel(ctx, Math.round(W / 2 - w / 2), y, w, 13, 'rgba(28,18,30,0.86)', '#ffd166');
      drawText(ctx, helpText, W / 2, y + 3, { color: '#ffd166', align: 'center' });
      ctx.globalAlpha = 1;
    }
    if (arrowA > 0 && target) {
      const p = g.player, sx = Math.round(p.cx - g.cam.x), sy = Math.round(p.cy - g.cam.y);
      const T = target.at ? target.at(g) : target, dx = T.x - p.cx, dy = T.y - p.cy;
      // flecha grande en la dirección que más pesa (derecha, arriba...), latiendo hacia allá;
      // si la meta está lejos de lado, primero hay que avanzar
      const dir = Math.abs(dx) > 160 || Math.abs(dx) > Math.abs(dy) * 0.8 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      const k = 24 + Math.round(Math.sin(g.T * 0.15) * 3), V = { right: [k, 0], left: [-k, 0], down: [0, k], up: [0, -k - 6] }[dir];
      const ax = sx + V[0], ay = sy + V[1];
      ctx.globalAlpha = arrowA;
      tri(ctx, ax + 1, ay + 1, dir, 7, '#2a1f2d'); tri(ctx, ax, ay, dir, 7, '#ffd166');
      if (dir === 'right' || dir === 'left') { const bx = dir === 'right' ? ax - 14 : ax + 7; R(ctx, '#2a1f2d', bx + 1, ay - 1, 8, 4); R(ctx, '#ffd166', bx, ay - 2, 8, 4); }
      else { const by = dir === 'down' ? ay - 14 : ay + 7; R(ctx, '#2a1f2d', ax, by + 1, 4, 8); R(ctx, '#ffd166', ax - 2, by, 4, 8); }
      drawText(ctx, '¡POR AQUÍ!', sx, dir === 'up' ? ay - 18 : sy - 30, { color: '#ffd166', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
      ctx.globalAlpha = 1;
    }
  };

  G.models = MODELS;
  G.PROP_KINDS = PROP_KINDS;
  G.recolor = recolor;
  Object.assign(EXTRA_ENTITIES, {
    hint: (d) => new Hint(d),
    npc: (d) => new Npc(d),
    prop: (d) => new Prop(d),
    help: () => null, goal: () => null,   // solo datos: los lee GUIDE.start
  });
  return G;
})();
