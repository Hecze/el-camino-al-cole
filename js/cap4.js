// cap4.js — CAPÍTULO 4: LA AMAZONÍA. Ya egresado, el chico ingresó a Biología
// en la universidad de Iquitos. Su primera clase es de campo: a las 8:00, en la
// playa de la estación biológica de la reserva Pacaya Samiria, la promo de
// cachimbos suelta crías de taricaya al río. Y se quedó dormido en el hospedaje
// (como siempre). Un solo nivel, de izquierda a derecha:
//
//   x 0–111    IQUITOS        · la Plaza de Armas, la Casa de Fierro y el jirón
//                               Próspero con casas de azulejos; motocarros en
//                               contra (sáltalos o rebota en su toldo) y un aguacero
//   x 112–149  EL MALECÓN     · el Malecón Tarapacá, el arcoíris y la bajada a Belén
//   x 150–269  BELÉN           · el mercado y el barrio flotante: casas sobre balsas
//                               que se mecen (salta cuando se acerquen)
//   x 270–617  EL AMAZONAS     · ¡manejas el peque-peque! palizadas, troncos que
//                               bajan, remolinos, redes de pescadores, bufeos y el
//                               grifo flotante
//   x 618–699  PACAYA SAMIRIA  · la restinga: manadas de huanganas (súbete a una aleta)
//   x 700–786  AGUAS NEGRAS    · la cocha espejo: paiches que salen a respirar y anacondas
//   x 787–     LA ESTACIÓN     · la playa de la estación biológica y la suelta de taricayas
// ─────────────────────────────────────────────────────────────────────────────
// Todo lo propio del capítulo vive aquí: arte, entidades, música y nivel.

// ═════════════════════════════════════════════════════════════════════════════
//  ARTE
// Todo queda dentro de ART4 para no chocar con los nombres de otros capítulos.
const ART4 = (() => {
  // paleta extra: vereda y tierra roja de Iquitos, azulejos, madera de palafito,
  // hojarasca y corteza del bosque, arena de playa
  const PAL4 = Object.assign({}, PAL, {
    '2': '#c9c4ba', '3': '#a8a298', '4': '#e2ddd2', '5': '#8a3f22', '6': '#b0582e', '7': '#6e2e18',
    '8': '#f4f1e8', '9': '#2f5fa8', '@': '#1d3f78', '#': '#e8b83a',
    '+': '#8a5a30', '=': '#6b4524', '-': '#b07c44', '_': '#4a2f18',
    '%': '#3e2a1a', '&': '#5e4028', '*': '#8a6a3a', '~': '#8a7a66', '^': '#6a5c4e', '$': '#a89a84', '!': '#4f4438',
    '<': '#ecd9a6', '>': '#d3b77c', '/': '#b39660',
  });
  const spr4 = (rows) => PIX.fromRows(rows, PAL4);
  const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };
  // sprite dibujado una vez con rectángulos (como la balsa y el tren del Cap. 3)
  const paint = (w, h, f) => { const c = PIX.createCanvas(w, h); f(c.getContext('2d')); return c; };

  const T4 = {};
  // ── tiles 16x16 ──────────────────────────────────────────────────────────────
  // vereda de concreto de Iquitos sobre la tierra colorada
  T4.vereda = spr4([
    '4444444444444444',
    '2222222342222222',
    '2232222342222322',
    '2222222342222222',
    '3333333333333333',
    '6666656666665666',
    '6656666666666656',
    '5666666665666666',
    '6666666666666666',
    '6665666665666666',
    '6666666666666566',
    '6566666656666666',
    '6666666666666666',
    '6666566666566666',
    '6666666666666666',
    '7666666666666667',
  ]);
  T4.tierra = spr4([
    '6666656666665666',
    '6656666666666656',
    '5666666665666666',
    '6666666666666666',
    '6665666665666666',
    '6666666666666566',
    '6566666656666666',
    '6666666666666666',
    '6666566666566666',
    '6666666666666666',
    '6656666666656666',
    '6666665666666666',
    '5666666666666665',
    '6666666656666666',
    '6665666666666666',
    '7666666666666667',
  ]);
  // grada de azulejos portugueses (las fachadas de la época del caucho)
  const AZ = ['99888899', '98899889', '88988988', '889##988', '889##988', '88988988', '98899889', '99888899'];
  T4.azulejo = spr4([...AZ, ...AZ].map(r => r + r));
  T4.azulejoTop = spr4(['4444444444444444', '2222222222222222', '3333333333333333', ...[...AZ, ...AZ].slice(3).map(r => r + r)]);
  // tablas de los palafitos y del embarcadero
  T4.deck = spr4([
    '----------------',
    '-++-++++-+++++-+',
    '++++=+++++++=+++',
    '++++++++++++++++',
    '================',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
    '_=_____=______=_',
  ]);
  T4.plank = spr4([
    '----------------',
    '+++=++++++=+++++',
    '++++++++++++++++',
    '================',
    '.=............=.',
    '.=............=.',
  ]);
  // suelo del bosque: hojarasca seca sobre tierra negra con raíces
  T4.forest = spr4([
    '..*....&..g.*...',
    '.*&*..&*&..*&*k.',
    '*&&&**&&&**&&&*&',
    '&&%&&*&%&&&&%&&&',
    '%&&%%&%&&%%&%&%%',
    '%%%%%%%%%%%%%%%%',
    '%%I%%%%%%%I%%%%%',
    '%%%%%&%%%%%%%%%%',
    '%%%%%%%%%%%&%%%%',
    '%I%%%%%%%%%%%%I%',
    '%%%%%%&%%%%%%%%%',
    '%%%%%%%%%%%%%%%%',
    '%%%&%%%%%I%%%%%%',
    '%%%%%%%%%%%%%&%%',
    '%%I%%%%%%%%%%%%%',
    '%%%%%%%%%%%%%%%%',
  ]);
  T4.forestBody = spr4([
    '%%%%%%%%%%%%%%%%', '%%I%%%%%%%I%%%%%', '%%%%%&%%%%%%%%%%', '%%%%%%%%%%%&%%%%',
    '%I%%%%%%%%%%%%I%', '%%%%%%&%%%%%%%%%', '%%%%%%%%%%%%%%%%', '%%%&%%%%%I%%%%%%',
    '%%%%%%%%%%%%%&%%', '%%I%%%%%%%%%%%%%', '%%%%%%%%%%%%%%%%', '%%%%%&%%%%%%I%%%',
    '%%%%%%%%%%%%%%%%', '%I%%%%%%&%%%%%%%', '%%%%%%%%%%%%%%%%', '%%%%%%%%%I%%%%%%',
  ]);
  // aleta (raíz tablar) de los árboles gigantes: corteza gris con vetas, musgo arriba
  T4.barkTop = spr4([
    '.gk.g..gkg..g.k.',
    'gkgkkgkkgkgkkgkg',
    'kk~kkk$kk~kkk$kk',
    '~$~~^~$~~^~$~~^~',
    '~$~~^~$~~^~$~~^~',
    '~$~^^~$~~^~$~^^~',
    '~$~~^~$~^^~$~~^~',
    '~$~~^~$~~^~$~~^~',
    '~$^~^~$~~^~$^~^~',
    '~$~~^~$~~^~$~~^~',
    '~$~~^^$~~^~$~~^^',
    '~$~~^~$~~^~$~~^~',
    '~$~~^~$^~^~$~~^~',
    '~$~~^~$~~^~$~~^~',
    '!$~~^~$~~^!$~~^!',
    '!^!!^!^!!^!^!!^!',
  ]);
  T4.bark = spr4([
    '~$~~^~$~~^~$~~^~', '~$~~^~$~~^~$~~^~', '~$~^^~$~~^~$~^^~', '~$~~^~$~^^~$~~^~',
    '~$~~^~$~~^~$~~^~', '~$^~^~$~~^~$^~^~', '~$~~^~$~~^~$~~^~', '~$~~^^$~~^~$~~^^',
    '~$~~^~$~~^~$~~^~', '~$~~^~$^~^~$~~^~', '~$~~^~$~~^~$~~^~', '~$~~^~$~~^~$~~^~',
    '~$~^^~$~~^~$~^^~', '~$~~^~$~~^~$~~^~', '!$~~^~$~~^!$~~^!', '!^!!^!^!!^!^!!^!',
  ]);
  // arena de la playa de la estación
  T4.sand = spr4([
    '<<<<<<<<<<<<<<<<',
    '<<><<<<<<<><<<<<',
    '<<<<<<>><<<<<<><',
    '><<<<<<<<<<<<<<<',
    '>>>>><>>>>>>>>>>',
    '>>>>>>>>>>/>>>>>',
    '>/>>>>>>>>>>>>>>',
    '>>>>>>>/>>>>>>/>',
    '>>>>>>>>>>>>>>>>',
    '>>/>>>>>>>>/>>>>',
    '>>>>>>>>>>>>>>>>',
    '>>>>>/>>>>>>>>>>',
    '>>>>>>>>>>>>/>>>',
    '/>>>>>>>>>>>>>>>',
    '>>>>>>>/>>>>>>>>',
    '>>>>>>>>>>>>>>>/',
  ]);
  T4.sandBody = spr4([
    '>>>>>>>>>>>>>>>>', '>>/>>>>>>>>/>>>>', '>>>>>>>>>>>>>>>>', '>>>>>/>>>>>>>>>>',
    '>>>>>>>>>>>>/>>>', '/>>>>>>>>>>>>>>>', '>>>>>>>/>>>>>>>>', '>>>>>>>>>>>>>>>/',
    '>>>>>>>>>>>>>>>>', '>>/>>>>>>>>/>>>>', '>>>>>>>>>>>>>>>>', '>>>>>/>>>>>>>>>>',
    '>>>>>>>>>>>>/>>>', '/>>>>>>>>>>>>>>>', '>>>>>>>/>>>>>>>>', '>>>>>>>>>>>>>>>/',
  ]);

  // ── MOTOCARRO de Iquitos: la moto adelante y la cabina con toldo de lona y
  //    flecos detrás (mirando a la derecha). 38x26 ────────────────────────────
  function wheel(g, cx, cy) {
    R(g, '#1d1622', cx - 4, cy - 3, 9, 7); R(g, '#1d1622', cx - 3, cy - 4, 7, 9);
    R(g, '#5d5768', cx - 2, cy - 2, 5, 5); R(g, '#c9ced6', cx, cy, 1, 1);
  }
  function motocarro(roof, roofD, body, bodyD, shirt) {
    return paint(38, 26, (g) => {
      // toldo de lona a rayas con su fleco
      R(g, '#2a1f2d', 2, 0, 28, 5); R(g, roof, 3, 1, 26, 3);
      for (let k = 3; k < 29; k += 6) R(g, roofD, k, 1, 3, 3);
      for (let k = 3; k < 29; k += 2) R(g, k % 4 === 1 ? '#f6c94a' : '#ffffff', k, 5, 1, 2);
      // parantes
      R(g, '#5d5768', 4, 5, 1, 11); R(g, '#5d5768', 27, 5, 1, 8);
      // la cabina de atrás: respaldo, cojín y carrocería
      R(g, '#2a1f2d', 3, 9, 16, 9); R(g, body, 4, 12, 14, 5); R(g, '#3a2414', 5, 10, 12, 2); R(g, bodyD, 4, 16, 14, 1);
      R(g, '#ffffff', 6, 13, 3, 1);
      // el motocarrista: cabello, cara y polo; las manos en el timón
      R(g, '#1f1620', 19, 5, 6, 3); R(g, '#c4855c', 20, 7, 5, 4); R(g, '#1f1620', 23, 8, 1, 1);
      R(g, shirt, 19, 11, 6, 5); R(g, '#c4855c', 25, 12, 4, 1);
      // la moto: asiento, tanque, manubrio, faro y horquilla
      R(g, '#2a1f2d', 17, 15, 16, 4); R(g, body, 18, 16, 14, 2); R(g, '#3a2414', 18, 15, 6, 1);
      R(g, '#2a1f2d', 28, 9, 2, 1); R(g, '#c9ced6', 29, 10, 1, 6);
      R(g, '#2a1f2d', 31, 12, 4, 4); R(g, '#fff6b0', 32, 13, 3, 2);
      R(g, '#8a8f99', 31, 16, 1, 5); R(g, '#8a8f99', 32, 17, 1, 4);
      // chasis
      R(g, '#2a1f2d', 3, 18, 27, 2);
      wheel(g, 9, 21); wheel(g, 31, 21);
    });
  }
  const MOTO = [
    motocarro('#d8432f', '#f6c94a', '#2f6fa8', '#1f4f80', '#f6c94a'),
    motocarro('#3f8a46', '#ffffff', '#d8432f', '#962a22', '#ffffff'),
    motocarro('#2f6fa8', '#f08a7a', '#f6c94a', '#bd8a1c', '#d8432f'),
    motocarro('#8a4cc0', '#f6c94a', '#4fb6b0', '#2f8a84', '#f0913c'),
  ];

  // ── HUANGANA (pecarí de labio blanco): negra, crin erizada y barba blanca.
  //    Mirando a la derecha; dos cuadros de carrera. 22x13 ───────────────────
  const huangana = (f) => paint(22, 13, (g) => {
    R(g, '#1d1622', 2, 2, 16, 8); R(g, '#3a3440', 3, 3, 14, 6); R(g, '#55505c', 4, 3, 10, 1);
    for (let k = 3; k < 16; k += 2) R(g, '#1d1622', k, 1 + (k % 4 === 1 ? 0 : 1), 1, 2);
    R(g, '#1d1622', 15, 4, 6, 6); R(g, '#3a3440', 16, 5, 4, 4); R(g, '#c9a0a0', 20, 7, 2, 2); R(g, '#1d1622', 21, 7, 1, 1);
    R(g, '#ffffff', 18, 5, 1, 1); R(g, '#f4efe4', 15, 8, 5, 2);
    const a = f ? 1 : -1;
    for (const [x, d] of [[4, a], [8, -a], [12, a], [16, -a]]) R(g, '#1d1622', x + d, 10, 2, 3);
    R(g, '#1d1622', 1, 4, 1, 2);
  });
  const HUANGANA = [huangana(0), huangana(1)];

  // ── BUFEO (delfín rosado del Amazonas): pico largo, joroba en vez de aleta.
  //    Mirando a la derecha. 32x12 ─────────────────────────────────────────────
  const BUFEO = PIX.fromRows([
    '...............KKK...............',
    '.............KKdddK..............',
    '........KKKKKpppppKKKKK..........',
    '.....KKKppppppppppppppppKKK......',
    '...KKpppppppppppppppppppppdKK....',
    'KK.KppppppppppppppppppppppKpdKKK.',
    'KdKpppppppppppppppppppppppppppppK',
    'KdpppppppppppPPPPPPPPPPpppppKKKK.',
    'KdKKPPPPPPPPPPPPPPPPPPPPPPPPK....',
    'KK..KKPPPPPPPPPPPPPPPPPPPKK......',
    '......KKKKKKKdddKKKKKKKKK........',
    '............KddK.................',
    '............KKK..................',
  ], { '.': null, K: '#2a1f2d', p: '#f2a6b4', P: '#fbd6dc', d: '#e0889c' });

  // ── PAICHE: el pez gigante; adelante verde oliva, la cola roja. 52x14 ────────
  const PAICHE = paint(52, 14, (g) => {
    for (let i = 0; i < 46; i++) {
      const t = i / 45, half = Math.round(2 + Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5) * 4 - (t > 0.85 ? (t - 0.85) * 14 : 0));
      const x = i + 5, cy = 7;
      R(g, '#1d1622', x, cy - half - 1, 1, half * 2 + 2);
      const col = t < 0.35 ? (i % 3 === 0 ? '#c85a3a' : '#a8402e') : t < 0.5 ? '#7a5a40' : '#5e6a4a';
      R(g, col, x, cy - half, 1, half * 2);
      R(g, t < 0.35 ? '#e07a52' : '#7e8a62', x, cy - half, 1, 1);           // lomo con brillo
      R(g, t < 0.35 ? '#8a3020' : '#b4b494', x, cy + half - 1, 1, 1);       // panza
      if (t > 0.1 && t < 0.4 && (i * 7) % 5 === 0) R(g, '#f09060', x, cy - 1, 1, 1);   // escamas rojas
    }
    R(g, '#1d1622', 0, 2, 6, 10); R(g, '#a8402e', 1, 3, 4, 8); R(g, '#c85a3a', 1, 4, 2, 2);   // cola
    R(g, '#1d1622', 45, 5, 1, 1); R(g, '#d8d0b0', 46, 5, 1, 1);                               // ojo
    R(g, '#3a4a32', 47, 8, 3, 1);                                                           // boca ancha
  });

  // ── TARICAYA recién nacida: caparazón oscuro con manchas amarillas. 9x5 ──────
  const TARICAYA = spr4(['..KKKK...', '.KCyCCK..', 'KCCCCyCKK', '.KKKKKKyK', '..K..K...']);
  // ── GALLINAZO posado en el techo (cabeza gris pelada) y en vuelo ─────────────
  const GALLINAZO = spr4(['..KK......', '.KDDK.....', '.KDsK.....', '..KKKK....', '.KKKKKK...', 'KKKKKKKK..', '.KKKKKKKK.', '..KKKKKKKK', '...Y..Y...']);
  const GALLINAZO_FLY = [
    spr4(['K..............K', 'KK............KK', '.KKK...DD...KKK.', '..KKKKKKKKKKKK..', '....KKKKKKKK....', '.....KK..KK.....']),
    spr4(['................', '................', '.KKKKK.DD.KKKKK.', 'K..KKKKKKKKKK..K', '....KKKKKKKK....', '.....KK..KK.....']),
  ];

  // el niño agachado sobre la orilla, soltando su taricaya (16x22, como los demás)
  const KNEEL = spr4(KID_TOP.slice(0, 15).concat(['..TTKRuRuRuRRK..', '..TTKrrrrrrrK...', '...KUUUUUUUUK...', '..KaKKKKKKKKK...', '..KK............', '................', '................']).slice(0, 22));

  return { T: T4, MOTO, HUANGANA, BUFEO, PAICHE, TARICAYA, GALLINAZO, GALLINAZO_FLY, KNEEL, PAL4 };
})();

// ═════════════════════════════════════════════════════════════════════════════
//  ENTIDADES
(() => {
  const A4 = ART4;
  const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const hash = (n) => { n = (n | 0) ^ 0x9e3779b9; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  const onScreen = (x, w, pad = 40) => x + w > Game.cam.x - pad && x < Game.cam.x + VIEW.w + pad;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // LO QUE FLOTA: arriba del agua se ve entero; lo que queda abajo, apenas (el agua es turbia)
  function afloat(ctx, wl, paint) {
    ctx.save(); ctx.beginPath(); ctx.rect(-1e6, -1e6, 2e6, wl + 1e6 + 1); ctx.clip(); paint(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(-1e6, wl + 1, 2e6, 1e6); ctx.clip(); ctx.globalAlpha = 0.25; paint(); ctx.restore();
  }

  // globo de diálogo con texto (encima de un personaje)
  function bubble(ctx, cx, bottom, lines, tx = cx) {
    const w = Math.max(...lines.map(l => textWidth(l))) + 8, h = lines.length * 9 + 3;
    const x = Math.round(cx - w / 2), y = Math.round(bottom - h - 4);
    R(ctx, '#1d1622', x - 1, y - 1, w + 2, h + 2);
    R(ctx, '#fffaf0', x, y, w, h);
    R(ctx, '#fffaf0', Math.round(tx) - 1, y + h, 3, 2); R(ctx, '#fffaf0', Math.round(tx), y + h + 2, 1, 2);
    lines.forEach((l, i) => drawText(ctx, l, cx, y + 2 + i * 9, { color: '#27426e', align: 'center' }));
  }
  // texto que sube y se desvanece (+1 BUFEO, ¡PIP PIP!...)
  class Floater {
    constructor(x, y, text, col) { this.x = x; this.y = y; this.text = text; this.col = col; this.t = 0; }
    update() { if (++this.t > 60) this.dead = true; }
    draw(ctx) {
      ctx.globalAlpha = Math.min(1, (60 - this.t) / 15);
      drawText(ctx, this.text, Math.round(this.x), Math.round(this.y - this.t * 0.4), { color: this.col, align: 'center', shadow: true, shadowColor: '#2a1f2d' });
      ctx.globalAlpha = 1;
    }
  }
  const sayAt = (ctx, x, y, t) => { if (Math.floor(t / 5) % 2 === 0) drawText(ctx, '!', Math.round(x), Math.round(y), { scale: 2, color: '#ffffff', align: 'center', shadow: true, shadowColor: '#2a1f2d' }); };

  // ═══════════════════════════════════════════════════════════════════════════
  // IQUITOS
  // MOTOCARRO que viene en contra por el jirón: si te alcanza, te tumba; si le
  // caes encima, rebotas en su toldo de lona (y el motocarrista toca bocina).
  class Motocarro extends Actor {
    constructor(x, base, v, k) { super(x, base - 22, 34, 22); this.base = base; this.v = v; this.k = k; this.t = 0; this.squash = 0; this.hazardKind = 'motocarro'; }
    onRespawn() { this.dead = true; }
    update(g) {
      this.t++; this.x -= this.v; if (this.squash > 0) this.squash--;
      const p = g.player, feet = p.y + p.h;
      if (!p.riding && p.vy > 0 && feet >= this.y - 2 && feet - p.vy <= this.y + 7 && p.x + p.w > this.x && p.x < this.x + this.w) {
        p.y = this.y - p.h - 1; p.vy = -7.4; p.noCut = 12; p.onGround = false; p.coyote = 0;
        this.squash = 10; g.audio('boing'); g.audio('honk'); g.burst(p.cx, this.y, 'dust', 6);
        if (!this.stomped) { this.stomped = true; g.motos4 = (g.motos4 || 0) + 1; g.addEntity(new Floater(this.cx, this.y - 8, '¡PIP PIP!', '#ffd166')); }
      }
      if (this.t % 7 === 0) g.particles.push({ x: this.x + this.w, y: this.base - 5, vx: 0.4, vy: -0.25, life: 40, max: 40, col: '#c8c2cc', size: 2, grav: -0.004 });
      if (this.x + this.w < g.cam.x - 80) this.dead = true;
    }
    hazardBox() { return { x: this.x + 4, y: this.y + 8, w: this.w - 8, h: this.h - 8 }; }
    draw(ctx) {
      if (!onScreen(this.x, 40)) return;
      const img = A4.MOTO[this.k % A4.MOTO.length], bob = Math.floor(this.t / 4) % 2, sq = this.squash > 0 ? Math.round(Math.sin(this.squash / 10 * Math.PI) * 2) : 0;
      R(ctx, 'rgba(30,20,20,0.25)', this.x + 2, this.base - 1, 32, 2);
      ctx.drawImage(flipS(img), Math.round(this.x - 2), Math.round(this.base - 26 + bob + sq));
    }
  }
  // de dónde salen: un bocinazo y un "!" en el borde de la pantalla, y luego el motocarro
  class MotoSpawner {
    constructor(def) {
      this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.base = def.y * TS; this.gaps = def.gaps; this.speeds = def.speeds;
      this.x = -1e6; this.y = -1e6; this.w = 0; this.h = 0; this.cleared = 0;
      this.onRespawn();
    }
    onRespawn() { this.i = 0; this.t = 0; this.warn = 0; this.next = 40; }
    update(g) {
      const p = g.player;
      if (p.cx < this.x0 - 8 * TS || p.cx > this.x1 - 2 * TS || g.state !== 'play') { this.warn = 0; return; }
      const sx = g.cam.x + VIEW.w + 24;
      if (sx > this.x1 + 6 * TS) { this.warn = 0; return; }   // al final del jirón ya no salen
      if (++this.t < this.next) return;
      if (!this.warn) { this.warn = 1; g.audio('honk'); }
      else if (++this.warn > 46) {
        g.addEntity(new Motocarro(sx, this.base, this.speeds[this.i % this.speeds.length], this.i));
        this.next = this.gaps[this.i % this.gaps.length]; this.i++; this.t = 0; this.warn = 0;
      }
      // cuenta los motocarros que ya pasaste (para quitar la pista)
      for (const e of g.entities) if (e instanceof Motocarro && !e.passed && e.x + e.w < p.x) { e.passed = true; this.cleared++; }
    }
    hint(g) {
      if (this.cleared >= 2) return null;
      const p = g.player;
      return g.entities.some(e => e instanceof Motocarro && !e.passed && e.x > p.cx && e.x - p.cx < 150) ? ['¡MOTOCARRO!', 'SÁLTALO O REBOTA EN SU TOLDO'] : null;
    }
    draw(ctx, g) {
      if (!this.warn) return;
      const x = g.cam.x + VIEW.w - 14, y = this.base - 38;
      sayAt(ctx, x, y, this.warn);
      if (Math.floor(this.warn / 5) % 2 === 0) { R(ctx, '#ffd166', x - 10, this.base - 14, 2, 3); R(ctx, '#ffd166', x - 12, this.base - 13, 2, 1); }
    }
  }

  // EL AGUACERO: a medio jirón se larga a llover a cántaros (trueno, cielo gris
  // y la lluvia de costado) y escampa al llegar al malecón
  let rainK = 0, rainFlash = 0;
  class Aguacero {
    constructor(def) { this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.base = def.y * TS; this.started = false; this.x = -1e6; this.y = -1e6; this.w = 0; this.h = 0; this.next = 260; rainK = 0; rainFlash = 0; }
    update(g) {
      const x = g.player.cx, inside = x > this.x0 && x < this.x1;
      rainK += ((inside ? 1 : 0) - rainK) * (inside ? 0.03 : 0.012);
      if (inside && !this.started) { this.started = true; rainFlash = 14; g.audio('rumble'); g.shake(2, 14); }
      if (inside && --this.next <= 0) { this.next = 240 + Math.floor(Math.random() * 200); rainFlash = 10; g.audio('rumble'); }
      if (rainFlash > 0) rainFlash--;
      // las gotas revientan en la vereda
      if (rainK > 0.2) for (let i = 0; i < 2; i++) {
        const px = g.cam.x + Math.random() * VIEW.w;
        g.particles.push({ x: px, y: this.base - 1, vx: (Math.random() - 0.5) * 1.2, vy: -0.8 - Math.random(), life: 10, max: 14, col: '#d8ecff', size: 1, grav: 0.2 });
      }
    }
    draw() {}
  }

  // GALLINAZO posado en un techo: si pasas cerca, alza el vuelo
  class Gallinazo {
    constructor(def) { this.hx = def.x * TS; this.hy = def.y * TS - 9; this.w = 10; this.h = 9; this.t = Math.floor(hash(def.x * 13) * 100); this.onRespawn(); }
    get cx() { return this.x + 5; }
    get cy() { return this.y + 4; }
    onRespawn() { this.x = this.hx; this.y = this.hy; this.fly = 0; }
    update(g) {
      this.t++;
      const p = g.player, body = p.riding || p;
      if (!this.fly && Math.abs(body.cx - this.cx) < 44 && body.cy > this.y - 60 && body.cy < this.y + 120) { this.fly = 1; this.dir = body.cx < this.cx ? 1 : -1; if (g.near(this.x, 200)) g.audio('flap'); }
      if (this.fly && this.fly < 400) { this.fly++; this.x += this.dir * 1.5; this.y -= 1.1 + Math.sin(this.fly * 0.2) * 0.5; }
    }
    draw(ctx) {
      if (!onScreen(this.x, 16)) return;
      if (this.fly) { const img = A4.GALLINAZO_FLY[Math.floor(this.fly / 6) % 2]; ctx.drawImage(this.dir < 0 ? flipS(img) : img, Math.round(this.x - 3), Math.round(this.y)); return; }
      const img = A4.GALLINAZO, look = Math.floor(this.t / 90) % 2;
      ctx.drawImage(look ? flipS(img) : img, Math.round(this.x), Math.round(this.y));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BELÉN
  // CASA FLOTANTE: una casita de madera con techo de irapay sobre una balsa de
  // troncos. Sube y baja con el río, se mece de lado (sway casillas) y se hunde
  // un poquito al pisarla. La ola de un bote que pasa la hace cabecear.
  const CASA = [['#c9894a', '#9a6a38', '#5f9f8a'], ['#5f9f8a', '#3d7468', '#f6c94a'], ['#d9b45a', '#a8873a', '#d8432f'], ['#d0aea4', '#a88a80', '#3f6fb8'], ['#9cc7f0', '#6f9ac4', '#f0913c']];
  class CasaFlotante {
    constructor(def) {
      this.hx = def.x * TS; this.w = def.w * TS; this.h = 8; this.wl = def.wl * TS + 4; this.isMover = true; this.dx = 0; this.dy = 0;
      this.sway = (def.sway || 0) * TS; this.per = def.per || 220; this.ph = def.ph || 0; this.col = CASA[(def.look || 0) % CASA.length];
      this.house = def.house !== false; this.boat = !!def.canoa; this.t = 0; this.sink = 0; this.wake = 0;
      this.x = this.hx; this.y = this.wl - 10; this.update({ player: {}, T: 0 });
    }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + 4; }
    update(g) {
      const px = this.x, py = this.y; this.t++;
      const on = g.player.lastMover === this;
      this.sink += ((on ? 2 : 0) - this.sink) * 0.12;
      if (this.wake > 0) this.wake = Math.max(0, this.wake - 0.012);
      const k = (this.t + this.ph) / this.per * Math.PI * 2;
      this.x = this.hx + Math.sin(k) * this.sway;
      this.y = Math.min(this.wl - 3, this.wl - 10 + Math.round(Math.sin(k * 2 + 1) * 2 + this.sink + Math.sin(this.t * 0.22) * this.wake * 3));
      this.dx = this.x - px; this.dy = this.y - py;
      if (on && g.T % 40 === 0 && Math.abs(this.dx) > 0.2) g.burst(this.cx, this.wl, 'splash', 2);
    }
    draw(ctx) {
      if (!onScreen(this.x, this.w)) return;
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w, wl = this.wl, [wall, wallD, accent] = this.col;
      if (this.house) {
        // la casita: tablas, ventana con cortina, puerta y techo de hojas de irapay
        const hw = w - 12, hx = x + 6, hh = 30, hy = y - hh;
        R(ctx, '#2a1f2d', hx - 1, hy - 1, hw + 2, hh + 2); R(ctx, wall, hx, hy, hw, hh);
        for (let k = 3; k < hw; k += 4) R(ctx, wallD, hx + k, hy, 1, hh);
        R(ctx, '#2a1f2d', hx + 4, hy + 8, 10, 9); R(ctx, '#1d2a3a', hx + 5, hy + 9, 8, 7); R(ctx, accent, hx + 5, hy + 9, 3, 7);
        R(ctx, '#3a2414', hx + hw - 12, hy + 10, 8, hh - 10); R(ctx, '#6b4524', hx + hw - 11, hy + 11, 6, hh - 11);
        for (let r = 0; r < 12; r++) {
          const half = Math.round((hw / 2 + 5) * (r + 1) / 12), cx = hx + hw / 2;
          R(ctx, '#6b4a24', cx - half - 1, hy - 12 + r, half * 2 + 2, 1);
          R(ctx, r % 3 === 2 ? '#a8873a' : '#c9a85a', cx - half, hy - 12 + r, half * 2, 1);
        }
        for (let k = -4; k < hw + 4; k += 3) R(ctx, '#8a6a34', hx + k, hy, 1, 2 + (k % 2));   // flecos del techo
        // macetas con plantas en la baranda
        R(ctx, '#b8693d', x + 2, y - 5, 4, 4); R(ctx, '#3f8a46', x + 1, y - 9, 6, 4); R(ctx, '#5fb050', x + 3, y - 10, 2, 2);
      }
      if (this.boat) {
        // una canoa amarrada: es solo la canoa, más chica y más movida
        for (let i = 0; i < w; i++) { const e = Math.min(i, w - 1 - i), lift = e < 4 ? 4 - e : 0; R(ctx, '#2a1f2d', x + i, y - lift, 1, wl + 3 - y + lift); R(ctx, '#7a4f2a', x + i, y - lift + 1, 1, wl + 1 - y + lift); }
        R(ctx, '#a8743e', x + 2, y + 1, w - 4, 1);
        return;
      }
      // la cubierta y los troncos de topa de la balsa
      R(ctx, '#2a1f2d', x - 1, y - 1, w + 2, 3); R(ctx, '#b07c44', x, y, w, 1); R(ctx, '#8a5a30', x, y + 1, w, 1);
      for (let k = 2; k < w; k += 9) R(ctx, '#6b4524', x + k, y, 1, 2);
      for (let r = 0; r < 2; r++) {
        const ly = y + 2 + r * 5;
        R(ctx, '#2a1f2d', x - 2 + r, ly, w + 4 - r * 2, 6); R(ctx, '#c9a36a', x - 1 + r, ly + 1, w + 2 - r * 2, 2); R(ctx, '#9a7a48', x - 1 + r, ly + 3, w + 2 - r * 2, 2);
        R(ctx, '#e0c08a', x - 1 + r, ly + 1, 2, 4);
      }
      for (let k = 6; k < w - 4; k += 14) R(ctx, '#5a3a1a', x + k, y + 2, 2, 10);   // amarres
      for (let i = -3; i < w + 3; i += 3) if (hash(i + (this.t >> 3) + x) > 0.45) R(ctx, '#f4e6c8', x + i, wl, 2, 1);
    }
  }
  // EL BOTE QUE PASA por el Itaya: va de derecha a izquierda y su ola hace
  // cabecear las casas flotantes (sirve de aviso: cuando pasa, espera)
  class BoteItaya {
    constructor(def) { this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.wl = def.wl * TS + 4; this.per = def.per || 520; this.t = def.ph || 0; this.x = -1e6; this.y = -1e6; this.w = 0; this.h = 0; this.run = false; }
    update(g) {
      const p = g.player;
      if (p.cx < this.x0 - 300 || p.cx > this.x1 + 300) { this.run = false; return; }
      if (!this.run && ++this.t > this.per) { this.run = true; this.t = 0; this.x = Math.min(this.x1, g.cam.x + VIEW.w + 60); }
      if (!this.run) return;
      this.x -= 1.6;
      if (g.T % 16 === 0 && g.near(this.x, 300)) g.audio('engine');
      for (const e of g.entities) if (e instanceof CasaFlotante && Math.abs(e.cx - this.x) < 26) e.wake = 1;
      if (this.x < Math.max(this.x0 - 100, g.cam.x - 120)) { this.run = false; this.t = 0; }
    }
    draw(ctx, g) {
      if (!this.run || !onScreen(this.x - 40, 90)) return;
      const x = Math.round(this.x), wl = this.wl - 3, bob = Math.floor(g.T / 8) % 2;
      // canoa con su motorista y la carga de plátanos
      for (let i = 0; i < 46; i++) { const lift = i < 5 ? Math.round((5 - i) * (5 - i) / 5) : 0; R(ctx, '#2a1f2d', x + i, wl - 6 - lift + bob, 1, 7 + lift); R(ctx, '#3f6fb8', x + i, wl - 5 - lift + bob, 1, 5 + lift); }
      R(ctx, '#f6c94a', x + 12, wl - 9 + bob, 12, 4); R(ctx, '#93a84a', x + 13, wl - 10 + bob, 4, 2); R(ctx, '#93a84a', x + 19, wl - 10 + bob, 4, 2);
      R(ctx, '#2a1f2d', x + 34, wl - 18 + bob, 6, 12); R(ctx, '#c4855c', x + 35, wl - 17 + bob, 4, 4); R(ctx, '#f4efe4', x + 35, wl - 13 + bob, 4, 6);
      R(ctx, '#5d5768', x + 44, wl - 10 + bob, 5, 4); R(ctx, '#8a8f99', x + 48, wl - 7 + bob, 10, 1); R(ctx, '#8a8f99', x + 56, wl - 6 + bob, 4, 1);
      // la estela que levanta
      for (let k = 0; k < 6; k++) R(ctx, '#f4e6c8', x + 50 + k * 8 + (g.T >> 2) % 4, wl + 1 + (k % 2), 5, 1);
    }
  }

  // PILOTES de los palafitos y embarcaderos: palos que entran al río
  class Pilotes {
    constructor(def) { this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.top = def.y * TS + 16; this.wl = def.wl * TS + 4; this.x = this.x0; this.y = this.top; this.w = this.x1 - this.x0; this.h = 40; }
    update() {}
    draw(ctx) {
      if (!onScreen(this.x0, this.w)) return;
      for (let x = this.x0 + 2; x < this.x1 - 2; x += 22) {
        R(ctx, '#2a1f2d', x - 1, this.top, 5, this.wl + 14 - this.top); R(ctx, '#7a5232', x, this.top, 3, this.wl + 14 - this.top); R(ctx, '#9b6a40', x, this.top, 1, this.wl - this.top);
        R(ctx, '#f4e6c8', x - 2, this.wl, 7, 1);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EL AMAZONAS
  // EL PEQUE-PEQUE que manejas tú: la canoa larga con el motor de cola. Se monta
  // como la llama (caes encima desde el embarcadero). Sin tocar nada avanza
  // sola; adelante acelera, atrás frena y con el salto brinca. Al llegar al
  // embarcadero de la reserva te bajas.
  let currentBoat = null;
  class PequePeque extends Mount {
    constructor(def) {
      super(def.x * TS, def.wl * TS + 4 - 10, 56, 10, { dx: 6, dy: -12 });
      this.wl = def.wl * TS + 4; this.end = def.end * TS; this.homeY = this.y = this.wl - 7;
      this.canDismount = false; this.drawsRider = true; this.ownJump = true; this.camMax = 3.9;
      this.taken = false; this.pull = 0; this.netT = 0; this.t = 0; currentBoat = this;
    }
    reset() { super.reset(); this.pull = 0; this.netT = 0; this.onGround = true; }
    update(g) {
      this.animT++; this.t++;
      const wl = this.wl;
      if (this.rider && !this.retired) {
        if (!this.taken) { this.taken = true; g.audio('engine'); g.toast('¡TÚ MANEJAS EL PEQUE-PEQUE!'); }
        const left = Input.held('left'), right = Input.held('right');
        // sin tocar nada avanza solo; adelante acelera, atrás frena
        let want = right ? 3.9 : left ? 1.1 : 2.7;
        // el remolino te frena: acelerando sales rápido; si no, avanzas a paso de tortuga
        if (this.pull) want = right ? 1.6 : 0.5;
        if (this.netT > 0) { this.netT--; want = 0; }
        this.vx += clamp(want - this.vx, -0.16, 0.1);
        this.facing = 1;
        if (this.onGround) this.coyote = PHYS.COYOTE; else if (this.coyote > 0) this.coyote--;
        if (this.coyote > 0 && Input.consumeJump()) { this.vy = -7.0; this.onGround = false; this.coyote = 0; g.audio('jump'); g.burst(this.cx, wl, 'splash', 12); }
        const held = Input.held('jump') || Input.held('up');
        this.vy += held && this.vy < 0 ? 0.3 : 0.42;
        // el motor: tac-tac-tac y su humito
        if (this.t % (this.vx > 3 ? 24 : 32) === 0) g.audio('engine');
        if (this.t % 6 === 0) g.particles.push({ x: this.x - 2, y: this.y - 6, vx: -0.6, vy: -0.4, life: 40, max: 40, col: '#c8c2cc', size: 2, grav: -0.006 });
      } else {
        this.vx *= 0.85; this.vy += 0.42;
        // te atrapa si caes encima aunque hayas saltado de más desde el embarcadero
        const p = g.player;
        if (!this.retired && !p.riding && p.vy > 0 && p.mountCd <= 0 && p.cx > this.x - 4 && p.cx < this.x + this.w + 10 && p.y + p.h > this.y - 40 && p.y + p.h < this.y + 6) p.mount(this, g);
      }
      this.x = Math.max(this.homeX - 2 * TS, this.x + this.vx); this.y += this.vy;
      const rest = wl - 7 + (this.rider ? Math.round(Math.sin(this.t * 0.09)) : 0);
      if (this.y >= rest) {
        if (!this.onGround && this.vy > 2) { g.burst(this.cx, wl, 'splash', 16); g.audio('splash'); g.shake(1, 5); }
        this.y = rest; this.vy = 0; this.onGround = true;
      } else this.onGround = false;
      // estela de espuma
      if (this.onGround && Math.abs(this.vx) > 0.5 && this.t % 3 === 0) g.particles.push({ x: this.x + 2, y: wl, vx: -0.4 - Math.random() * 0.5, vy: -0.5, life: 24, max: 24, col: '#f4e6c8', size: 1, grav: 0.05 });
      // llegó al embarcadero de la reserva: te bajas de un brinco
      if (this.rider && !this.retired && this.x + this.w > this.end && this.onGround) {
        this.retired = true; this.vx = 0; const p = this.rider;
        p.syncRide(); p.dismount(g, -5.4); p.x = this.end + 6; p.vx = 1.4;
        g.audio('brake'); g.toast('¡LLEGASTE A PACAYA SAMIRIA!');
        // el punto de control pasa a la orilla: si no, al morir aquí reaparecías en el río sin bote, una y otra vez
        g.spawn = { x: this.end + 9 * TS, y: GP * TS }; g.spawnMount = null;   // donde está el punto de control de la restinga
      }
      if (this.retired && this.vx === 0) this.x = Math.min(this.x, this.end - this.w - 2);
      this.pull = 0;
      if (this.rider) this.rider.syncRide();
    }
    draw(ctx, g) {
      if (!onScreen(this.x - 24, this.w + 30)) return;
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w, wl = this.wl, p = g.player;
      R(ctx, 'rgba(40,25,10,0.3)', x + 4, wl + 3, w - 6, 2);
      // el motor de cola: la caja, el tubo largo que entra al agua y la hélice que salpica
      const run = this.rider && !this.retired, sh = run && this.t % 4 < 2 ? 1 : 0;
      R(ctx, '#2a1f2d', x - 7, y - 6 + sh, 10, 7); R(ctx, '#5d5768', x - 6, y - 5 + sh, 8, 5); R(ctx, '#d8432f', x - 6, y - 5 + sh, 8, 1);
      for (let s = 0; s <= 14; s++) R(ctx, '#8a8f99', Math.round(x - 4 - s * 1.1), Math.round(y - 1 + s * (wl + 6 - y) / 14), 1, 2);
      if (run) for (let k = 0; k < 4; k++) R(ctx, '#f4e6c8', x - 22 - k * 3 + (this.t >> 1) % 3, wl - 1 - (k % 2) - (this.t >> 2) % 2, 2, 1);
      // el niño sentado atrás, con la mano en el timón
      if (this.rider === p && !(p.invuln > 0 && Math.floor(p.invuln / 4) % 2 === 0)) {
        ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - 24, 30, 26); ctx.clip();
        ctx.drawImage(P.sit, x + 1, y - 17); ctx.restore();
        R(ctx, '#e7b089', x + 1, y - 5, 3, 2);
      }
      // casco: canoa larga de madera, la proa sube un poco y el fondo se afina en las puntas
      for (let i = 0; i < w + 4; i++) {
        const e = Math.max(0, i - (w - 10)), lift = Math.round(e * e * 7 / 169) + (i < 3 ? 3 - i : 0);
        const top = y - lift, bot = y + this.h - Math.round(e * 0.5) - (i < 4 ? 4 - i : 0);
        R(ctx, '#2a1f2d', x + i, top, 1, Math.max(2, bot - top + 1));
        R(ctx, '#7a4f2a', x + i, top + 1, 1, Math.max(1, bot - top - 1));
        R(ctx, '#a8743e', x + i, top + 1, 1, 1);
        if (i > 3 && i < w + 1) R(ctx, '#3f8a46', x + i, top + 3, 1, 1);   // franja verde pintada
      }
      R(ctx, '#6b4524', x + 22, y - 1, 3, 2); R(ctx, '#6b4524', x + 38, y - 1, 3, 2);   // bancas
      if (!this.rider && !this.retired && Math.floor(this.animT / 20) % 2) drawText(ctx, '¡SUBE!', this.cx, this.y - 18, { color: '#ffd166', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
    }
  }

  // PALIZADA: troncos y ramas atascados en el río. Si chocas, te volteas: sáltala.
  class Palizada extends Actor {
    constructor(def) {
      const wl = def.wl * TS + 4, w = (def.w || 2) * TS, h = def.h || 12;
      super(def.x * TS, wl - h, w, h); this.wl = wl; this.hazardKind = 'palizada'; this.seed = def.x * 7; this.t = 0;
    }
    update() { this.t++; }
    hazardBox() { return { x: this.x + 5, y: this.y + 3, w: this.w - 10, h: this.h }; }
    draw(ctx) {
      if (!onScreen(this.x, this.w)) return;
      const x = Math.round(this.x), wl = this.wl, w = this.w, top = this.y;
      // troncos cruzados en distintos ángulos
      for (let k = 0; k < 5; k++) {
        const a = (hash(this.seed + k) - 0.5) * 0.9, len = w * (0.6 + hash(this.seed + k * 3) * 0.5), cx = x + w * (0.2 + k * 0.15), cy = wl - 3 - hash(this.seed + k * 5) * (this.h - 6);
        ctx.save(); ctx.translate(Math.round(cx), Math.round(cy)); ctx.rotate(a);
        R(ctx, '#2a1f2d', -len / 2, -3, len, 6); R(ctx, k % 2 ? '#7a5232' : '#6b4524', -len / 2 + 1, -2, len - 2, 4); R(ctx, '#9b6a40', -len / 2 + 1, -2, len - 2, 1);
        R(ctx, '#c9a36a', len / 2 - 3, -2, 2, 4);   // el corte del tronco
        ctx.restore();
      }
      // ramas con hojas que asoman
      for (let k = 0; k < 3; k++) { const bx = x + 6 + k * (w / 3), by = top - 2 - hash(this.seed + k * 9) * 5; R(ctx, '#4a3220', bx, by, 1, wl - by); R(ctx, '#3f8a46', bx - 3, by - 2, 4, 3); R(ctx, '#5fb050', bx + 1, by - 1, 3, 2); }
      for (let i = -4; i < w + 4; i += 2) if (hash(i + (this.t >> 2) + x) > 0.4) R(ctx, '#f4e6c8', x + i, wl - (hash(i * 3) > 0.7 ? 1 : 0), 2, 1);
    }
  }
  // TRONCO que baja con la corriente (hacia ti): empieza a bajar cuando te acercas
  class Tronco extends Actor {
    constructor(def) { const wl = def.wl * TS + 4; super(def.x * TS, wl - 9, 40, 9); this.wl = wl; this.hx = this.x; this.hazardKind = 'tronco'; this.onRespawn(); }
    onRespawn() { this.x = this.hx; this.go = false; this.a = 0; }
    update(g) {
      const p = g.player, body = p.riding || p;
      if (!this.go && this.x - body.cx < 330) this.go = true;
      if (!this.go) return;
      this.x -= 1.15; this.a += 0.06;
      this.y = this.wl - 9 + Math.round(Math.sin(this.a * 2));
      if (g.T % 8 === 0 && onScreen(this.x, this.w)) g.particles.push({ x: this.x + this.w, y: this.wl, vx: 0.3, vy: -0.3, life: 20, max: 20, col: '#f4e6c8', size: 1, grav: 0.04 });
    }
    hazardBox() { return { x: this.x + 4, y: this.y + 2, w: this.w - 8, h: this.h }; }
    draw(ctx) {
      if (!onScreen(this.x, this.w)) return;
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w;
      R(ctx, '#2a1f2d', x, y, w, 10); R(ctx, '#6b4524', x + 1, y + 1, w - 2, 8); R(ctx, '#8a5a30', x + 1, y + 1, w - 2, 2);
      for (let k = 4; k < w - 4; k += 7) R(ctx, '#4a2f18', x + k + Math.round(Math.sin(this.a + k) * 2), y + 3, 3, 1);   // corteza que gira
      R(ctx, '#2a1f2d', x - 1, y + 1, 4, 8); R(ctx, '#c9a36a', x, y + 2, 2, 6); R(ctx, '#9b6a40', x + 1, y + 4, 1, 2);   // el corte, con sus anillos
      R(ctx, '#3f8a46', x + w - 10, y - 3, 5, 3); R(ctx, '#4a3220', x + w - 8, y - 1, 1, 2);
    }
  }
  // REMOLINO: el agua gira y te frena. Mantén adelante para salir rápido.
  class Remolino {
    constructor(def) { this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.wl = def.wl * TS + 4; this.x = this.x0; this.y = this.wl - 8; this.w = this.x1 - this.x0; this.h = 16; this.t = 0; this.in = false; }
    update(g) {
      this.t++;
      const b = currentBoat;
      this.in = !!(b && b.rider && b.cx > this.x0 && b.cx < this.x1 && b.y > this.wl - 20);
      if (this.in) { b.pull = 1; if (this.t % 30 === 0) g.audio('gurgle'); if (this.t % 4 === 0) g.burst(b.cx + (Math.random() - 0.5) * 30, this.wl, 'splash', 1); }
    }
    hint(g) { return this.in ? ['¡EL REMOLINO TE FRENA!', 'MANTÉN ADELANTE'] : null; }
    draw(ctx) {
      if (!onScreen(this.x, this.w)) return;
      const cx = (this.x0 + this.x1) / 2, rx = this.w / 2, wl = this.wl;
      // el agua hundida al centro (un embudo oscuro) y los anillos de espuma que giran
      for (let i = -rx; i < rx; i++) { const k = 1 - Math.abs(i) / rx; R(ctx, 'rgba(60,38,16,0.55)', cx + i, wl - 1, 1, 2 + Math.round(k * k * 9)); }
      for (let r = 0; r < 5; r++) {
        const rr = rx * (0.15 + r * 0.2), n = 10 + r * 5;
        for (let s = 0; s < n; s++) {
          const a = s / n * Math.PI * 2 + this.t * (0.12 - r * 0.018), px = cx + Math.cos(a) * rr, py = wl + 2 + Math.sin(a) * rr * 0.22;
          if (s % 3 !== 2) R(ctx, r % 2 ? '#e0c69a' : '#fff6e0', px, py, 3, 1);
        }
      }
      // flechitas curvas que muestran el giro
      for (let k = 0; k < 2; k++) { const a = this.t * 0.12 + k * Math.PI, px = cx + Math.cos(a) * rx * 0.75, py = wl + 2 + Math.sin(a) * rx * 0.16; R(ctx, '#ffffff', px - 1, py - 1, 3, 3); }
    }
  }
  // RED DE PESCADOR tendida en el río: si la tocas, te enredas y pierdes
  // tiempo (el pescador reclama). Sáltala. Al segundo enredo, el pescador la baja.
  class Red {
    constructor(def) { this.x = def.x * TS; this.w = (def.w || 2) * TS; this.wl = def.wl * TS + 4; this.y = this.wl - 6; this.h = 8; this.t = 0; this.cd = 0; this.say = 0; this.shake = 0; this.near = false; }
    onRespawn() { this.cd = 0; this.say = 0; this.hits = 0; }
    update(g) {
      this.t++; if (this.cd > 0) this.cd--; if (this.say > 0) this.say--; if (this.shake > 0) this.shake--;
      const b = currentBoat;
      this.near = !!(b && b.rider && this.x - (b.x + b.w) < 120 && this.x + this.w > b.x);
      if (!b || !b.rider || this.cd || this.hits >= 2) return;
      if (b.x + b.w > this.x + 4 && b.x < this.x + this.w - 4 && b.y + b.h > this.wl - 4) {
        b.netT = 40; b.vx = -1.6; this.cd = 70; this.say = 110; this.shake = 30; this.hits = (this.hits || 0) + 1;
        g.audio('clank'); g.burst(this.x + this.w / 2, this.wl, 'splash', 12); g.shake(1, 6);
      }
    }
    hint() { return this.near && !this.say && (this.hits || 0) < 2 ? ['¡UNA RED!', 'SÁLTALA'] : null; }
    draw(ctx, g) {
      if (!onScreen(this.x - 30, this.w + 60)) return;
      const x = Math.round(this.x), wl = this.wl, w = this.w, sh = this.shake > 0 ? (this.shake % 4 < 2 ? 1 : -1) : 0;
      // el pescador en su canoíta, un poco más allá (más lejos de la cámara)
      const fx = x + w + 6, fy = wl - 5;
      for (let i = 0; i < 30; i++) { const e = Math.min(i, 29 - i), lift = e < 3 ? 3 - e : 0; R(ctx, '#2a1f2d', fx + i, fy - 4 - lift, 1, 5 + lift); R(ctx, '#6b4524', fx + i, fy - 3 - lift, 1, 3 + lift); }
      R(ctx, '#d9b45a', fx + 9, fy - 20, 12, 3); R(ctx, '#c9a85a', fx + 11, fy - 22, 8, 2);   // sombrero de paja
      R(ctx, '#c4855c', fx + 12, fy - 17, 6, 4); R(ctx, '#3f6fb8', fx + 11, fy - 13, 8, 9);
      if (this.say) bubble(ctx, fx + 15, fy - 22, [this.hits >= 2 ? '¡YA, PASA NOMÁS!' : '¡OE, MI RED, ÑAÑO!']);
      if ((this.hits || 0) >= 2) return;   // la bajó: ya no está
      // la red: boyas sobre el agua y la malla que cuelga entre ellas
      for (let i = 0; i <= w; i += 2) { const sag = Math.round(Math.sin(i / w * Math.PI) * 2); R(ctx, '#e8e2d4', x + i + sh, wl - 4 + sag, 1, 1); if (i % 4 === 0) R(ctx, 'rgba(232,226,212,0.6)', x + i + sh, wl - 3 + sag, 1, 5); }
      for (let i = 0; i <= w; i += 8) { R(ctx, '#2a1f2d', x + i - 2 + sh, wl - 6, 5, 4); R(ctx, i % 16 ? '#f0913c' : '#ffffff', x + i - 1 + sh, wl - 5, 3, 2); }
    }
  }
  // BUFEO: el delfín rosado salta junto al bote. Cada uno que ves suma.
  class Bufeo {
    constructor(def) { this.x0 = def.x * TS; this.wl = def.wl * TS + 4; this.per = def.per || 190; this.ph = def.ph || 0; this.dir = def.dir || 1; this.seen = false; this.k = -1; this.x = this.x0; this.y = this.wl; this.w = 30; this.h = 12; this.gotT = 0; }
    update(g) {
      if (this.gotT > 0) this.gotT++;
      if (!g.near(this.x0, 360)) { this.k = -1; return; }
      const u = (g.T + this.ph) % this.per;
      if (u === 0 && onScreen(this.x0, 10)) g.burst(this.x0 - this.dir * 34, this.wl, 'splash', 8);
      if (u >= 64) { this.k = -1; if (u === 64 && onScreen(this.x0, 10)) { g.burst(this.x0 + this.dir * 34, this.wl, 'splash', 10); g.audio('splash'); } return; }
      this.k = u / 64;
      this.x = this.x0 + this.dir * (this.k * 70 - 35); this.y = this.wl - Math.sin(this.k * Math.PI) * 36;
      if (!this.seen && this.k > 0.2 && onScreen(this.x, 10, -10)) {
        this.seen = true; g.bufeos4 = (g.bufeos4 || 0) + 1; this.gotT = 1; this.gx = this.x; this.gy = this.y; g.audio('coin');
      }
    }
    draw(ctx) {
      if (this.k >= 0 && onScreen(this.x, 32)) {
        ctx.save(); ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.rotate(-Math.cos(this.k * Math.PI) * 0.75 * this.dir); if (this.dir < 0) ctx.scale(-1, 1);
        ctx.drawImage(A4.BUFEO, -16, -7); ctx.restore();
      }
      if (this.gotT > 0 && this.gotT < 70) drawText(ctx, '+1 BUFEO', Math.round(this.gx), Math.round(this.gy - 14 - this.gotT / 6), { color: '#f6a6c0', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
    }
  }
  // LA LANCHA de pasajeros (la de las hamacas): baja por el río, más allá de tu bote
  class Lancha {
    constructor(def) { this.hx = def.x * TS; this.wl = def.wl * TS + 4; this.name = def.name || 'LORETANA'; this.onRespawn(); this.y = this.wl - 60; this.w = 150; this.h = 60; this.t = 0; }
    onRespawn() { this.x = this.hx; }
    update(g) { this.t++; if (g.near(this.x, 700)) this.x -= 0.9; if (this.t % 30 === 0 && g.near(this.x, 260)) g.audio('engine'); }
    draw(ctx, g) {
      if (!onScreen(this.x, this.w)) return;
      const x = Math.round(this.x), b = this.wl - 4, bob = Math.floor(this.t / 18) % 2;
      // casco y tres cubiertas: abajo la carga, arriba las hamacas de colores
      R(ctx, '#2a1f2d', x - 1, b - 14 + bob, 152, 15); R(ctx, '#f4efe4', x, b - 13 + bob, 150, 12); R(ctx, '#2f6fa8', x, b - 7 + bob, 150, 3);
      for (let k = 0; k < 10; k++) R(ctx, '#2f6fa8', x - k, b - 13 + bob + k, 1, 1);
      drawText(ctx, this.name, x + 90, b - 12 + bob, { color: '#2f6fa8', align: 'center' });
      for (let d = 0; d < 2; d++) {
        const dy = b - 14 - (d + 1) * 16 + bob, dx = x + 10 + d * 12, dw = 130 - d * 24;
        R(ctx, '#2a1f2d', dx - 1, dy - 1, dw + 2, 17); R(ctx, '#e8e2d4', dx, dy, dw, 16); R(ctx, '#d8432f', dx, dy, dw, 2);
        for (let k = 4; k < dw - 6; k += 11) {
          R(ctx, '#5d5768', dx + k, dy + 2, 1, 14);
          R(ctx, ['#d8432f', '#f6c94a', '#3f8a46', '#8a4cc0', '#f0913c', '#3f6fb8'][(k + d * 3) % 6], dx + k + 2, dy + 6 + (k % 3), 8, 3);   // hamacas
          if (hash(k * 7 + d) > 0.6) R(ctx, '#c4855c', dx + k + 4, dy + 3 + (k % 3), 3, 3);
        }
      }
      R(ctx, '#2a1f2d', x + 112, b - 64 + bob, 6, 16); R(ctx, '#d8432f', x + 113, b - 63 + bob, 4, 4);   // chimenea
      for (let k = 0; k < 8; k++) R(ctx, '#f4e6c8', x + 152 + k * 6 + (this.t >> 2) % 3, b + 3 + (k % 2), 4, 1);
    }
  }
  // EL GRIFO FLOTANTE: la gasolinera sobre una balsa, donde cargan los botes
  class Grifo {
    constructor(def) { this.x = def.x * TS; this.wl = def.wl * TS + 4; this.y = this.wl - 50; this.w = 96; this.h = 50; this.t = 0; }
    update() { this.t++; }
    draw(ctx, g) {
      if (!onScreen(this.x, this.w)) return;
      const x = this.x, b = this.wl - 4;
      R(ctx, '#2a1f2d', x - 1, b - 5, 98, 7); R(ctx, '#c9a36a', x, b - 4, 96, 3); R(ctx, '#9a7a48', x, b - 1, 96, 2);
      R(ctx, '#2a1f2d', x + 8, b - 34, 46, 30); R(ctx, '#f4efe4', x + 9, b - 33, 44, 29); R(ctx, '#3f8a46', x + 9, b - 33, 44, 5);
      R(ctx, '#2a1f2d', x + 4, b - 42, 54, 9); R(ctx, '#d8432f', x + 5, b - 41, 52, 7);
      drawText(ctx, 'GRIFO', x + 31, b - 40, { color: '#ffffff', align: 'center' });
      R(ctx, '#1d2a3a', x + 14, b - 24, 10, 10); R(ctx, '#3a2414', x + 34, b - 24, 10, 20);
      // el surtidor con su manguera
      R(ctx, '#2a1f2d', x + 66, b - 22, 12, 18); R(ctx, '#f6c94a', x + 67, b - 21, 10, 16); R(ctx, '#2a1f2d', x + 69, b - 18, 6, 4); R(ctx, '#d8432f', x + 69, b - 18, 6, 1);
      for (let k = 0; k < 10; k++) R(ctx, '#1d1622', x + 78 + k, b - 14 + Math.round(Math.sin(k * 0.4) * 3), 1, 1);
      // el grifero saluda
      const wave = Math.floor(this.t / 15) % 2;
      R(ctx, '#c4855c', x + 84, b - 24, 5, 4); R(ctx, '#d8432f', x + 83, b - 20, 7, 8); R(ctx, '#27426e', x + 83, b - 12, 7, 8);
      R(ctx, '#c4855c', x + 90, b - (wave ? 26 : 22), 2, 4);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PACAYA SAMIRIA
  // MANADA DE HUANGANAS: al pasar por x se oye el gruñido y tiembla el suelo; un
  // rato después pasa la manada en estampida. Súbete a una aleta (raíz tablar)
  // y deja que pasen por debajo.
  class Manada {
    // def: x = dónde se oye, end = hasta dónde llega el bosque (la manada sale de ahí como mucho)
    constructor(def) { this.tx = def.x * TS; this.endX = def.end * TS; this.base = def.y * TS; this.n = def.n || 6; this.x = -1e6; this.y = -1e6; this.w = 0; this.h = 0; this.hazardKind = 'huangana'; this.state = 'idle'; this.t = 0; this.head = 0; }
    onRespawn(g) { this.state = g.spawn.x > this.tx ? 'done' : 'idle'; this.t = 0; }
    update(g) {
      this.t++;
      const p = g.player;
      if (this.state === 'idle') {
        // solo si estás en la restinga, cerca de donde se oye (si ya pasaste de largo, no sale)
        if (p.cx > this.tx && g.state === 'play') { this.state = p.cx < this.tx + 14 * TS ? 'warn' : 'done'; this.t = 0; if (this.state === 'warn') g.audio('growl'); }
        return;
      }
      if (this.state === 'warn') {
        if (this.t % 24 === 0) g.audio(this.t % 48 ? 'grr' : 'growl');
        if (this.t % 30 === 0) g.shake(1, 8);
        if (this.t % 3 === 0) g.particles.push({ x: Math.min(g.cam.x + VIEW.w, this.endX) - Math.random() * 20, y: this.base - 2, vx: -1 - Math.random(), vy: -0.6 - Math.random(), life: 30, max: 30, col: '#c9a86a', size: 2, grav: 0.02 });
        if (this.t >= 120) { this.state = 'run'; this.t = 0; this.head = Math.min(g.cam.x + VIEW.w + 12, this.endX); g.audio('rumble'); }
        return;
      }
      if (this.state === 'run') {
        this.head -= 3.4;
        if (this.t % 5 === 0) g.burst(this.head + this.n * 18, this.base - 2, 'dust', 3);
        if (this.t % 14 === 0 && g.near(this.head, 300)) g.audio('grr');
        if (this.head + this.n * 18 < g.cam.x - 40) this.state = 'done';
      }
    }
    hazardBox() { return this.state === 'run' ? { x: this.head + 3, y: this.base - 10, w: this.n * 18 - 2, h: 10 } : null; }
    hint() { return this.state === 'warn' ? ['¡HUANGANAS!', '¡SÚBETE A UNA ALETA!'] : null; }
    draw(ctx, g) {
      if (this.state === 'warn') {
        // la polvareda que se acerca por la derecha
        const k = this.t / 120, x = Math.min(g.cam.x + VIEW.w, this.endX) - 6 - k * 26;
        for (let i = 0; i < 14; i++) { const r = hash(i * 7 + (this.t >> 3)); R(ctx, 'rgba(201,168,106,' + (0.25 + k * 0.35).toFixed(2) + ')', x + r * 30 - 10, this.base - 4 - hash(i * 3) * 22 * (0.5 + k), 6, 4); }
        sayAt(ctx, Math.min(g.cam.x + VIEW.w, this.endX) - 18, this.base - 46, this.t);
      }
      if (this.state !== 'run') return;
      for (let i = 0; i < this.n; i++) {
        const x = this.head + i * 18 + Math.round(Math.sin(i * 2.3) * 3), f = Math.floor((this.t + i * 3) / 4) % 2;
        if (!onScreen(x, 24)) continue;
        ctx.drawImage(flipS(A4.HUANGANA[f]), Math.round(x), this.base - 13 - (f ? 1 : 0));
      }
    }
  }
  // PAICHE: el pez más grande del río sube a respirar cada tanto. Mientras está
  // arriba, su lomo es una plataforma. Antes de subir salen burbujas; antes de
  // hundirse tiembla y coletea. ¡Salta antes de que se vaya!
  class Paiche {
    constructor(def) {
      this.cx0 = def.x * TS; this.wl = def.wl * TS + 4; this.per = def.per || 300; this.ph = def.ph || 0; this.upT = def.up || 170;
      this.w = 48; this.h = 8; this.x = this.cx0 - 24; this.y = this.wl + 20; this.isMover = true; this.dx = 0; this.dy = 0; this.falling = true; this.st = 'under'; this.hint1 = !!def.hint;
    }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + 4; }
    phase(T) {
      const u = (T + this.ph) % this.per, under = this.per - this.upT;
      if (u < under - 60) return ['under', 0];
      if (u < under) return ['bubbles', (u - under + 60) / 60];
      if (u < this.per - 45) return ['up', 0];
      return ['diving', (u - this.per + 45) / 45];
    }
    update(g) {
      const py = this.y, [st, k] = this.phase(g.T), was = this.st;
      let target = this.wl + 18;
      if (st === 'up') target = this.wl - 7;
      else if (st === 'diving') target = this.wl - 7 + (k > 0.7 ? (k - 0.7) / 0.3 * 26 : 0);
      this.y += (target - this.y) * (st === 'diving' && k > 0.7 ? 0.5 : 0.22);
      this.falling = this.y > this.wl - 4;
      this.st = st; this.k = k; this.dy = this.y - py; this.dx = 0;
      const vis = onScreen(this.x, this.w, 0);
      if (st === 'up' && was !== 'up' && vis) { g.burst(this.cx, this.wl, 'splash', 14); g.audio('splash'); }
      if (st === 'bubbles' && g.T % 6 === 0 && vis) g.particles.push({ x: this.x + 6 + Math.random() * 30, y: this.wl + 1, vx: 0, vy: -0.6, life: 16, max: 16, col: '#cfd8d0', size: 1, grav: 0 });
      if (st === 'diving' && g.T % 10 === 0 && vis) g.burst(this.x + 4, this.wl, 'splash', 4);
    }
    hint(g) {
      if (!this.hint1) return null;
      const p = g.player;
      if (p.lastMover === this && this.st === 'diving') return ['¡SE HUNDE!', '¡SALTA!'];
      if (Math.abs(p.cx - this.cx) < 70 && p.cx < this.cx && this.st !== 'up' && p.onGround) return ['ESPERA AL PAICHE', 'SALE A RESPIRAR'];
      return null;
    }
    draw(ctx, g) {
      if (!onScreen(this.x, 56)) return;
      const sh = this.st === 'diving' ? (g.T % 4 < 2 ? 1 : -1) : 0;
      if (this.y < this.wl + 12) {
        ctx.drawImage(A4.PAICHE, Math.round(this.x - 2 + sh), Math.round(this.y - 3));
        for (let i = -6; i < 48; i += 3) if (hash(i + (g.T >> 3) + this.cx0) > 0.5) R(ctx, '#cfd8d0', this.x + i, this.wl, 2, 1);
      }
      if (this.st === 'bubbles') for (let i = 0; i < 5; i++) { const r = hash(i * 13 + (g.T >> 2)); if (r > 0.45) R(ctx, '#cfd8d0', this.x + 4 + i * 8, this.wl - 1 - Math.round(r * 2), 2, 2); }
    }
  }
  // ANACONDA enroscada en una rama sobre el camino: si pasas por debajo, se
  // estira, sisea ("!") y baja la cabeza de golpe. Espera a que ataque y pasa
  // mientras vuelve a subir.
  class Anaconda extends Actor {
    constructor(def) { super(def.x * TS - 6, def.y * TS, 12, 12); this.ax = def.x * TS; this.top = def.y * TS; this.low = def.low * TS; this.hazardKind = 'anaconda'; this.onRespawn(); }
    onRespawn() { this.st = 'idle'; this.t = 0; this.cool = 40; this.reach = 0; }
    update(g) {
      this.t++;
      const p = g.player, near = Math.abs(p.cx - this.ax) < 60 && p.y > this.top;
      const max = this.low - this.top - 30;
      switch (this.st) {
        case 'idle': if (this.cool > 0) this.cool--; else if (near) { this.st = 'windup'; this.t = 0; g.audio('swish'); } this.reach += (0 - this.reach) * 0.1; break;
        case 'windup': this.reach = -4; if (this.t > 46) { this.st = 'strike'; this.t = 0; g.audio('snap'); g.shake(1, 6); } break;
        case 'strike': this.reach = Math.min(max, this.reach + 16); if (this.t > 30) { this.st = 'back'; this.t = 0; } break;
        case 'back': this.reach = Math.max(0, this.reach - 3); if (this.reach <= 0) { this.st = 'idle'; this.cool = 110; } break;
      }
    }
    head() { return { x: this.ax + Math.round(Math.sin(this.t * 0.05) * (this.st === 'idle' ? 3 : 0)), y: this.top + 24 + this.reach }; }
    hazardBox() {
      if (this.st !== 'strike' && !(this.st === 'back' && this.reach > 20)) return null;
      const h = this.head();
      return { x: h.x - 5, y: this.top + 22, w: 10, h: h.y - this.top - 14 };
    }
    hint(g) { const p = g.player; return this.st === 'windup' && Math.abs(p.cx - this.ax) < 80 ? ['¡ANACONDA!', 'ESPERA QUE ATAQUE'] : null; }
    draw(ctx, g) {
      if (!onScreen(this.ax - 50, 110)) return;
      const t = this.top, h = this.head(), sh = this.st === 'windup' ? (this.t % 4 < 2 ? 1 : -1) : 0;
      // la rama gruesa que sale del árbol
      R(ctx, '#2a1f2d', this.ax - 46, t - 1, 100, 9); R(ctx, '#5e4028', this.ax - 45, t, 98, 7); R(ctx, '#7a5a3a', this.ax - 45, t, 98, 2);
      for (let k = 0; k < 6; k++) { R(ctx, '#2f6b3a', this.ax - 40 + k * 17, t - 6 - (k % 2) * 3, 12, 6); R(ctx, '#3f8a46', this.ax - 38 + k * 17, t - 7 - (k % 2) * 3, 7, 3); }
      // vueltas del cuerpo alrededor de la rama: bandas en diagonal con manchas negras
      for (let k = 0; k < 4; k++) {
        const cx = this.ax - 30 + k * 9;
        for (let r = -3; r < 11; r++) { const xx = cx + Math.round(r * 0.45); R(ctx, '#1d2a1a', xx - 1, t + r, 8, 1); R(ctx, r > 7 ? '#c9b45a' : '#5a7a32', xx, t + r, 6, 1); }
        R(ctx, '#1d1a14', cx + 1, t, 3, 2); R(ctx, '#1d1a14', cx + 3, t + 5, 2, 2); R(ctx, '#7a9a42', cx + 1, t - 2, 2, 1);
      }
      // el cuello que cuelga hasta la cabeza, con sus manchas
      const segs = Math.max(2, Math.round((h.y - t - 6) / 3));
      for (let s = 0; s < segs; s++) {
        const k = s / segs, x = this.ax + 4 + (h.x - this.ax - 4) * k + Math.sin(k * 6 + this.t * 0.08) * 2 * (1 - k) + sh, y = t + 6 + (h.y - t - 6) * k;
        R(ctx, '#1d2a1a', x - 4, y, 9, 4); R(ctx, '#5a7a32', x - 3, y, 7, 4); R(ctx, '#c9b45a', x + 2, y, 1, 4);
        if (s % 3 === 1) { R(ctx, '#1d1a14', x - 2, y + 1, 3, 2); R(ctx, '#e0c060', x - 1, y + 1, 1, 1); }
      }
      // la cabeza (mirando abajo): más ancha que el cuello, ojos amarillos a los lados y la lengua
      const hx = h.x + sh, hy = h.y;
      R(ctx, '#1d2a1a', hx - 5, hy - 2, 11, 7); R(ctx, '#1d2a1a', hx - 4, hy + 5, 9, 3);
      R(ctx, '#5a7a32', hx - 4, hy - 1, 9, 6); R(ctx, '#5a7a32', hx - 3, hy + 5, 7, 2); R(ctx, '#7a9a42', hx - 2, hy - 1, 5, 1);
      R(ctx, '#f6c94a', hx - 4, hy + 1, 2, 2); R(ctx, '#f6c94a', hx + 3, hy + 1, 2, 2); R(ctx, '#1d1622', hx - 4, hy + 2, 1, 1); R(ctx, '#1d1622', hx + 4, hy + 2, 1, 1);
      R(ctx, '#1d1622', hx - 1, hy + 6, 1, 1); R(ctx, '#1d1622', hx + 1, hy + 6, 1, 1);
      if (Math.floor(this.t / 8) % 3 === 0 || this.st === 'windup') { R(ctx, '#d8432f', hx, hy + 8, 1, 3); R(ctx, '#d8432f', hx - 1, hy + 11, 1, 1); R(ctx, '#d8432f', hx + 1, hy + 11, 1, 1); }
      if (this.st === 'windup') sayAt(ctx, hx, hy - 24, this.t);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LA ESTACIÓN: la clase de campo en la playa. Tus compañeros cachimbos sueltan
  // crías de taricaya que caminan al río; tu sitio te espera (brilla). Al
  // llegar sueltas la tuya y empieza la universidad.
  let _kids = null;
  const KID_COLS = [{ r: '#3f6fb8', R: '#27426e', y: '#ffffff' }, { r: '#5c9f4a', R: '#3a7d36' }, { r: '#8a4cc0', R: '#5a3088' }, { r: '#f0913c', R: '#b45f1e' }, { r: '#4fb6b0', R: '#2f8a84' }];
  function kids() {
    if (!_kids) _kids = KID_COLS.map(c => PIX.fromRows(KID_TOP.concat(KID_LEGS.stand), Object.assign({}, PAL, c)));
    return _kids;
  }
  class ClaseCampo extends Actor {
    constructor(def) {
      const base = def.y * TS, x0 = def.x * TS;
      super(x0, base - 40, 180, 40);
      this.base = base; this.water = def.water * TS; this.animT = 0; this.done = false; this.t = 0;
      this.seats = [0, 18, 36, 60, 78, 96].map(d => x0 + d); this.spot = this.seats[3];
      this.profeX = x0 + 150; this.turtles = [];
      this.profe = GUIDE.recolor(OBJ.teacher2, { '#f0913c': '#9a8a5a', '#b45f1e': '#6b5e3a', '#f6c94a': '#3f8a46', '#5a3088': '#4a5a3a', '#8a4cc0': '#5e6e4a' });
    }
    onRespawn() {}
    update(g) {
      this.animT++;
      // cada tanto un compañero suelta una cría y camina sola hasta el agua
      if (this.animT % 55 === 0 && this.turtles.length < 14) { const i = Math.floor(this.animT / 55) % 6; if (i !== 3) this.turtles.push({ x: this.seats[i] + 12, t: 0, mine: false }); }
      for (const tu of this.turtles) { tu.t++; if (tu.x < this.water + 6) tu.x += tu.t % 3 === 0 ? 1 : 0; }
      this.turtles = this.turtles.filter(tu => tu.x < this.water + 6);
      const p = g.player;
      if (this.done) {
        this.t++; p.x += (this.spot + 4 - p.x) * 0.2;
        if (this.t === 30) { this.turtles.push({ x: this.spot + 14, t: 0, mine: true }); g.audio('page'); }
        if (this.t === 50) { g.audio('applause'); g.burst(this.profeX, this.base - 30, 'spark', 16); }
        if (this.t === 100) g.gameComplete();
        return;
      }
      if (p.onGround && !p.riding && Math.abs(p.cx - (this.spot + 8)) < 12) { this.done = true; p.won = true; p.vx = 0; g.audio('sit'); g.burst(this.spot + 8, this.base, 'dust', 8); }
    }
    draw(ctx, g) {
      const b = this.base, ks = kids();
      // banderola de bienvenida sostenida por dos palos
      const bx = this.seats[0] - 4, bw = this.seats[5] + 22 - bx;
      R(ctx, '#6b4524', bx, b - 54, 2, 54); R(ctx, '#6b4524', bx + bw - 2, b - 54, 2, 54);
      R(ctx, '#1d1622', bx + 1, b - 55, bw - 2, 22); R(ctx, '#3f8a46', bx + 2, b - 54, bw - 4, 20);
      drawText(ctx, '¡BIENVENIDOS,', bx + bw / 2, b - 52, { color: '#ffffff', align: 'center' });
      drawText(ctx, 'CACHIMBOS!', bx + bw / 2, b - 43, { color: '#f6c94a', align: 'center' });
      this.seats.forEach((sx, i) => {
        if (i === 3) {
          // tu balde con tu taricaya, y el sitio que brilla
          if (!this.done) { const a = 0.25 + Math.sin(this.animT * 0.12) * 0.15; R(ctx, 'rgba(255,230,140,' + a.toFixed(2) + ')', sx - 3, b - 5, 22, 5); }
          else ctx.drawImage(this.t > 50 && this.t < 80 ? P.jump : P.sit, Math.round(this.spot), b - 22 - (this.t > 50 && this.t < 80 ? 3 : 0));
          R(ctx, '#2a1f2d', sx + 14, b - 8, 8, 8); R(ctx, '#3f6fb8', sx + 15, b - 7, 6, 7); R(ctx, '#9cc7f0', sx + 15, b - 7, 6, 1);
          if (!this.done || this.t < 30) ctx.drawImage(A4.TARICAYA, sx + 14, b - 12);
          return;
        }
        // compañeros de pie, cada uno con su balde; de vez en cuando saltan de alegría
        const hop = this.done && this.t > 50 && this.t < 90 ? 3 : Math.floor((this.animT + i * 19) / 60) % 4 === 0 ? 1 : 0;
        ctx.drawImage(ks[i % ks.length], sx, b - 22 - hop);
        R(ctx, '#2a1f2d', sx + 13, b - 7, 6, 7); R(ctx, i % 2 ? '#d8432f' : '#f6c94a', sx + 14, b - 6, 4, 6);
      });
      // la profesora de biología con su tablero
      const px = this.profeX;
      ctx.drawImage(flipS(this.profe), px, b - 27);
      R(ctx, '#2a1f2d', px - 3, b - 17, 6, 8); R(ctx, '#f4efe4', px - 2, b - 16, 4, 6);
      // las crías que caminan al río
      for (const tu of this.turtles) {
        const step = Math.floor(tu.t / 6) % 2;
        ctx.drawImage(A4.TARICAYA, Math.round(tu.x), b - 5 - step);
        if (tu.mine && tu.t < 90) drawText(ctx, '¡LA TUYA!', Math.round(tu.x + 4), b - 18 - Math.floor(tu.t / 10), { color: '#ffd166', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
      }
      const p = g.player, near = Math.abs(p.cx - this.spot) < 160;
      if (this.done) bubble(ctx, px + 24, b - 30, [this.t < 50 ? '¡JUSTO A TIEMPO!' : '¡BIENVENIDO!'], px + 7);
      else if (near) bubble(ctx, px + 24, b - 30, ['¡TU TARICAYA', 'TE ESPERA!'], px + 7);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EL FINAL DEL JUEGO: la taricaya llega al río, el recuerdo de los cuatro
  // capítulos (del cole a la universidad) y los créditos.
  const SC = [0, 300, 640, 1060];   // en qué cuadro empieza cada pantalla
  function caption(ctx, W, y, text, a) {
    ctx.globalAlpha = Math.max(0, Math.min(1, a));
    drawText(ctx, text, W / 2, y, { scale: W < 300 ? 1 : 2, color: '#ffd166', align: 'center', shadow: true, shadowColor: '#5a2a12' });
    ctx.globalAlpha = 1;
  }
  function confetti(ctx, W, H, t, n) {
    const cols = ['#f6c94a', '#d8432f', '#3f6fb8', '#5c9f4a', '#f6a6c0', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const x = (hash(i * 13) * W + Math.sin(t * 0.03 + i) * 8) % W, y = (hash(i * 7) * H + t * (0.6 + hash(i) * 0.8)) % (H + 10) - 5;
      R(ctx, cols[i % cols.length], x, y, 2, i % 3 ? 1 : 2);
    }
  }
  // el amanecer sobre el río: el sol, la selva de la otra orilla y el agua
  function riverScene(ctx, W, H, t) {
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, '#3f7fc8'); sky.addColorStop(1, '#ffd39a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff3cf'; ctx.beginPath(); ctx.arc(W * 0.7, H * 0.44, 16, 0, Math.PI * 2); ctx.fill();
    for (let x = 0; x < W; x += 2) { const top = H * 0.5 - Math.abs(Math.sin(x * 0.05)) * 6 - hash(x >> 2) * 4; R(ctx, '#2f5a3a', x, Math.round(top), 2, H); }
    const wl = Math.round(H * 0.56);
    R(ctx, '#c49a62', 0, wl, W, H - wl);
    for (let i = 0; i < 40; i++) R(ctx, '#f4e6c8', (hash(i * 7) * W + t * 0.2) % W, wl + 3 + hash(i * 3) * (H - wl - 6), 5 + hash(i) * 8, 1);
    R(ctx, '#ffe6a0', W * 0.7 - 20, wl + 2, 40, 1); R(ctx, '#ffe6a0', W * 0.7 - 12, wl + 6, 24, 1);
    return wl;
  }
  function vignette(ctx, x, y, w, h, i, t, label) {
    R(ctx, '#1d1622', x - 3, y - 3, w + 6, h + 18); R(ctx, '#f4efe4', x - 2, y - 2, w + 4, h + 16);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const skies = [['#4f86c6', '#f6dcb0'], ['#c9d6e0', '#e8e0cc'], ['#5aa0e8', '#cfe6ff'], ['#3f7fc8', '#ffd39a']];
    const sky = ctx.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, skies[i][0]); sky.addColorStop(1, skies[i][1]);
    ctx.fillStyle = sky; ctx.fillRect(x, y, w, h);
    const gy = y + h - 12, f = Math.floor(t / 7) % 4;
    if (i === 0) {   // los Andes: la llama y el cole
      for (let k = 0; k < w; k += 2) { const top = y + 20 + Math.abs(Math.sin(k * 0.05)) * 14; R(ctx, '#7a73a6', x + k, Math.round(top), 2, h); if (top < y + 26) R(ctx, '#f4f8ff', x + k, Math.round(top), 2, 3); }
      R(ctx, '#64803a', x, gy, w, 12); ctx.drawImage(LL.run[f], x + 4, gy - 24); ctx.drawImage(P.run[f], x + 34, gy - 22);
    } else if (i === 1) {   // Lima: la garúa, los edificios y el mototaxi
      for (let k = 0; k < w; k += 12) R(ctx, ['#b8644a', '#e3c06a', '#9cc3d0', '#e8e0cc'][(k / 12) % 4], x + k, y + 22 + (k % 24), 11, h);
      R(ctx, '#5a5a62', x, gy, w, 12); ctx.drawImage(OBJ.torito.rojo, x + 18, gy - 26);
    } else if (i === 2) {   // Machu Picchu: el pico y la promo
      for (let k = 0; k < w; k += 2) { const d = Math.abs(k - w * 0.62) / 18, top = y + 10 + Math.pow(d, 1.5) * 14; R(ctx, '#3f6a42', x + k, Math.round(top), 2, h); }
      R(ctx, '#9a978c', x, gy, w, 12); ctx.drawImage(P.jump, x + 30, gy - 24);
    } else {   // la Amazonía: el río y el bufeo
      R(ctx, '#2f5a3a', x, y + h * 0.4, w, 8);
      R(ctx, '#c49a62', x, y + h * 0.4 + 8, w, h);
      const k = (t % 90) / 90; if (k < 0.6) { ctx.save(); ctx.translate(x + 20 + k * 50, y + h * 0.6 - Math.sin(k / 0.6 * Math.PI) * 14); ctx.rotate(-Math.cos(k / 0.6 * Math.PI) * 0.7); ctx.drawImage(A4.BUFEO, -16, -7); ctx.restore(); }
      ctx.drawImage(P.sit, x + 6, y + h * 0.4);
    }
    ctx.restore();
    drawText(ctx, label, x + w / 2, y + h + 3, { color: '#2a1f2d', align: 'center' });
  }
  const ENDING = {
    frames: SC[SC.length - 1], music: 'c4estacion',
    start() { VOICE.play('gana', 700); },
    skip(t) { return SC.find(s => s > t + 1) || SC[SC.length - 1]; },
    draw(ctx, W, H, t, tick) {
      const s = SC.findIndex((v, i) => t >= v && t < (SC[i + 1] || 1e9)), u = t - SC[s], len = (SC[s + 1] || SC[s] + 400) - SC[s];
      R(ctx, '#1b1424', 0, 0, W, H);
      const ty = H - 30;
      if (s === 0) {
        // la taricaya llega al río y un bufeo salta a recibirla
        const wl = riverScene(ctx, W, H, t);
        R(ctx, '#ecd9a6', 0, wl - 2, W * 0.45, H); for (let x = 0; x < W * 0.45; x += 3) R(ctx, '#d3b77c', x, wl + 4 + (x % 7), 2, 1);
        const tx = Math.min(W * 0.45 + 4, 20 + u * 0.45), sc = 3;
        ctx.save(); ctx.translate(Math.round(tx), wl - 14 + (tx >= W * 0.45 + 4 ? 6 : 0)); ctx.scale(sc, sc); ctx.drawImage(A4.TARICAYA, 0, Math.floor(u / 8) % 2); ctx.restore();
        if (u > 150) { const k = Math.min(1, (u - 150) / 70); ctx.save(); ctx.translate(Math.round(W * 0.62 + k * 70), Math.round(wl - Math.sin(k * Math.PI) * 40)); ctx.rotate(-Math.cos(k * Math.PI) * 0.75); ctx.scale(2, 2); ctx.drawImage(A4.BUFEO, -16, -7); ctx.restore(); if (u === 151) AUDIO.play('splash'); }
        caption(ctx, W, ty, '¡TU PRIMERA CLASE!', (u - 30) / 20);
      } else if (s === 1) {
        // del cole a la universidad: los cuatro capítulos, uno por uno
        const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2c2350'); sky.addColorStop(1, '#8a4f7a');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
        const narrow = W < 300, vw = narrow ? 64 : 76, vh = narrow ? 44 : 56, gap = narrow ? 8 : 14, n = 4;
        const total = n * vw + (n - 1) * gap, x0 = Math.round(W / 2 - total / 2), y0 = Math.round(H * 0.24);
        const labels = ['LOS ANDES', 'LIMA', 'MACHU PICCHU', 'LA AMAZONÍA'];
        for (let i = 0; i < n; i++) {
          const k = Math.min(1, Math.max(0, (u - 20 - i * 50) / 24)); if (k <= 0) continue;
          ctx.globalAlpha = k;
          vignette(ctx, x0 + i * (vw + gap), y0 + Math.round((1 - k) * 10), vw, vh, i, tick, narrow && labels[i].length > 9 ? labels[i].split(' ').pop() : labels[i]);
          ctx.globalAlpha = 1;
          if (u === 20 + i * 50) AUDIO.play('page');
        }
        caption(ctx, W, ty, 'DEL COLE A LA UNIVERSIDAD', (u - 230) / 20);
        if (u > 250) confetti(ctx, W, H, t, 50);
      } else {
        // créditos bajo el cielo de la selva, con luciérnagas
        for (let i = 0; i < 70; i++) R(ctx, hash(i * 3 + Math.floor(tick / 30)) > 0.85 ? '#ffffff' : '#9a94c4', hash(i * 11) * W, hash(i * 17) * H * 0.7, 1, 1);
        for (let x = 0; x < W; x += 2) { const top = H * 0.74 - Math.abs(Math.sin(x * 0.04)) * 10 - hash(x >> 2) * 8; R(ctx, '#14261a', x, Math.round(top), 2, H); }
        for (let i = 0; i < 16; i++) { const a = 0.4 + Math.sin(tick * 0.08 + i * 2) * 0.4; ctx.fillStyle = 'rgba(220,255,140,' + Math.max(0, a).toFixed(2) + ')'; ctx.fillRect(Math.round(hash(i * 5) * W + Math.sin(tick * 0.01 + i) * 10), Math.round(H * 0.55 + hash(i * 9) * H * 0.35), 1, 1); }
        const L = [
          [0, 'LA MARATÓN DE LOS ANDES', 2, '#ffd166'],
          [50, 'JUEGO ORIGINAL', 1, '#cdbde8'], [62, 'HECZE', 2, '#ffffff'],
          [110, 'CAPÍTULOS 2, 3 Y 4', 1, '#cdbde8'], [122, 'HAROLD', 2, '#ffffff'],
          [190, '¡GRACIAS POR JUGAR!', 1, '#9be7c4'],
        ];
        const narrow = W < 300;
        let y = Math.round(H * 0.16);
        for (const [at, txt, sc, col] of L) {
          ctx.globalAlpha = Math.max(0, Math.min(1, (u - at) / 20));
          const s2 = narrow ? 1 : sc;
          drawText(ctx, txt, W / 2, y, { scale: s2, color: col, align: 'center', shadow: true, shadowColor: '#000000' });
          y += s2 === 2 ? 22 : 12;
          if (txt === 'HECZE' || txt === 'HAROLD') y += 8;
        }
        ctx.globalAlpha = 1;
      }
      // fundido al entrar y al salir de cada pantalla
      const fa = Math.max(0, 1 - u / 16, 1 - (len - u) / 16);
      if (fa > 0) { ctx.fillStyle = 'rgba(11,10,18,' + fa.toFixed(2) + ')'; ctx.fillRect(0, 0, W, H); }
    },
  };

  // todo lo que va en el agua se dibuja con afloat()
  for (const C of [CasaFlotante, Pilotes, PequePeque, Palizada, Tronco, Lancha, Grifo, Paiche]) {
    const paint = C.prototype.draw;
    C.prototype.draw = function (ctx, g) { afloat(ctx, this.wl, () => paint.call(this, ctx, g)); };
  }

  Object.assign(EXTRA_ENTITIES, {
    motoSpawner: (d) => new MotoSpawner(d),
    aguacero: (d) => new Aguacero(d),
    gallinazo: (d) => new Gallinazo(d),
    casaFlotante: (d) => new CasaFlotante(d),
    boteItaya: (d) => new BoteItaya(d),
    pilotes: (d) => new Pilotes(d),
    pequePeque: (d) => new PequePeque(d),
    palizada: (d) => new Palizada(d),
    tronco: (d) => new Tronco(d),
    remolino: (d) => new Remolino(d),
    red: (d) => new Red(d),
    bufeo: (d) => new Bufeo(d),
    lancha: (d) => new Lancha(d),
    grifo: (d) => new Grifo(d),
    manada: (d) => new Manada(d),
    paiche: (d) => new Paiche(d),
    anaconda: (d) => new Anaconda(d),
    claseCampo: (d) => new ClaseCampo(d),
  });
  window.CAP4 = { get boat() { return currentBoat; }, get rain() { return rainK; }, get flash() { return rainFlash; }, ending: ENDING };
})();

// ═════════════════════════════════════════════════════════════════════════════
//  NIVEL, MÚSICA Y REGISTRO DEL CAPÍTULO
(() => {
  const A4 = ART4, T4 = A4.T;
  const GI = 58;     // fila de las calles de Iquitos (la ciudad está en lo alto del barranco)
  const GB = 63;     // fila del mercado de Belén
  const DK = 69;     // fila de las tablas: palafitos, embarcaderos y la playa
  const W = 70;      // fila del agua (el Itaya, el Amazonas y la cocha)
  const GP = 67;     // fila del suelo de la restinga en Pacaya Samiria
  const H = 80;
  // dónde empieza cada tramo
  const BE = 146, RIO = 268, PS = 612, AN = 702, ES = 786;
  const hash = (n) => { n = (n | 0) ^ 0x9e3779b9; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  // el cielo de la selva: amanece naranja y húmedo, luego azul con nubes grandes
  const SELVA_SKY = { dawn: ['#2d3a6e', '#d77a6a', '#ffcf8a'], morning: ['#2f86d0', '#86c4ee', '#e6f2d6'] };
  // el agua del Amazonas: color café con leche, con palos y hojas que bajan
  const RIO_PAL = { foam: '#f4e6c8', hi: '#e0c69a', bands: ['#c49a62', '#a8804e', '#8e6a40', '#755634', '#5c4428'], streak: ['#e0c69a', '#c8a878', '#b08e60', '#94744c', '#7a5e3c'], speed: 0.8, amp: 1, chunks: ['#4a3220', '#6b4a2c', '#3f6b3a', '#5e4028'] };
  // las aguas negras de la cocha: oscuras como té cargado, quietas como un espejo
  const NEGRA_PAL = { foam: '#cfd8d0', hi: '#5e6a62', bands: ['#2a2620', '#221e1a', '#1a1714', '#14110f', '#0e0c0a'], streak: ['#3a342c', '#2e2a24', '#24201c', '#1c1916', '#141210'], speed: 0.06, amp: 0.4, chunks: null };

  // la gente del capítulo para los NPCs de la guía
  Object.assign(GUIDE.models, {
    guardaparque: () => { const c = GUIDE.recolor(OBJ.teacher, { '#3f6fb8': '#6b7a3a', '#27426e': '#4a5a2a', '#f7ead2': '#d9c89a' }); return [c, c]; },
    heladera: () => OBJ.mom.map(c => GUIDE.recolor(c, { '#c2185b': '#f6f0e0', '#d8432f': '#4fb6b0', '#962a22': '#2f8a84', '#1f1620': '#3a2414' })),
    motorista: () => { const c = GUIDE.recolor(GUIDE.models.pastor()[0], { '#d8432f': '#3f8a46', '#962a22': '#2a6e30' }); return [c, c]; },
  });

  // tiles propios (con prefijo para no chocar con otros capítulos)
  Object.assign(TILE_SPECS, {
    c4vereda: { solid: true, top: T4.vereda, body: T4.tierra },
    c4step:   { solid: true, step: true, top: T4.vereda, body: T4.tierra },   // escalón: se sube caminando
    c4grada:  { solid: true, top: T4.azulejoTop, body: T4.azulejo },
    c4deck:   { solid: true, top: T4.deck, body: T4.deck },
    c4plank:  { oneway: true, body: T4.plank },
    c4iron:   { oneway: true },                       // balcones de la Casa de Fierro (los dibuja la casa)
    c4toldo:  { oneway: true },                       // toldos de las tiendas (los dibuja renderBack)
    c4forest: { solid: true, top: T4.forest, body: T4.forestBody },
    c4bark:   { solid: true, top: T4.barkTop, body: T4.bark },
    c4sand:   { solid: true, top: T4.sand, body: T4.sandBody },
  });

  // ── Iquitos: casas del jirón Próspero y sus toldos (se pisan) ──────────────
  const CASAS = [];
  for (let x = 52, i = 0; x < 104; i++) { const w = Math.min(6 + (i % 3), 110 - x); CASAS.push({ x, w, i, floors: 2 + (i % 4 === 1 ? 1 : 0) }); x += w; }
  const TOLDOS = [[60, 4, 0], [73, 4, 1], [87, 4, 2], [100, 4, 3]];   // [x, ancho, color]
  // ── Belén: casas flotantes y palafitos ────────────────────────────────────
  const PALAFITOS = [[181, 6, 0], [205, 6, 1], [235, 6, 2]];          // [x, ancho, estilo]
  const CASAS_FLOT = [
    { x: 189, w: 5, sway: 0, look: 0, ph: 0 },
    { x: 197, w: 5, sway: 0.8, look: 1, ph: 60 },
    { x: 214, w: 4, sway: 1, look: 2, ph: 0, per: 200 },
    { x: 221, w: 3, sway: 0.7, look: 0, ph: 100, canoa: true, house: false, per: 160 },
    { x: 227, w: 5, sway: 1.2, look: 3, ph: 150 },
    { x: 244, w: 5, sway: 1.2, look: 4, ph: 40 },
    { x: 252, w: 5, sway: 1.4, look: 1, ph: 190, per: 240 },
  ];
  // ── Pacaya Samiria: aletas de los árboles gigantes en la restinga ─────────
  const ALETAS = [626, 636, 647, 658, 669, 680, 691];
  // árboles gigantes de fondo: [columna, fila del suelo]
  // (cada aleta de la restinga es la base de uno: el tronco sale de ella)
  const ARBOLES = [...ALETAS.map(x => [x + 1, GP - 2]), [711, DK], [725, DK], [738, DK], [758, DK], [776, DK]];

  const LEVEL4 = {
    name: 'LA AMAZONÍA', w: 872, h: H,
    anchorRow: GI,
    spawn: { x: 3, y: GI },
    sky: SELVA_SKY,
    bgLayers: [
      // la selva plana más allá de la ciudad y los techos de Iquitos
      { kind: 'hills', color: '#7fae8a', color2: '#6a9a78', y: GI - 1.6, parallax: 0.05, vpar: 0.08, amp: 1.2, seed: 4 },
      { kind: 'city', build: iquitosFar, color: '#d9c9a8', color2: '#8a7a64', y: GI - 0.2, parallax: 0.3, vpar: 0.36 },
      { kind: 'clouds', color: '#ffffff', parallax: 0.05, count: 9, seed: 6 },
    ],
    // cada tramo trae su fondo, que se funde con el anterior
    bgZones: [
      // desde el malecón: el río ancho, la otra orilla y el arcoíris
      { x0: 97, x1: 106, anchorRow: GI, sky: SELVA_SKY, layers: [
        { kind: 'river', build: riverFar, color: '#c49a62', color2: '#a8804e', y: GI - 1.4, parallax: 0.1, vpar: 0.14 },
        { kind: 'clouds', color: '#ffffff', parallax: 0.05, count: 9, seed: 3 },
      ] },
      // Belén: el Itaya y las casas de la otra orilla
      { x0: BE - 2, x1: BE + 8, anchorRow: DK, sky: SELVA_SKY, layers: [
        { kind: 'river', build: belenFar, color: '#c49a62', color2: '#a8804e', y: DK - 0.6, parallax: 0.14, vpar: 0.2 },
        { kind: 'clouds', color: '#ffffff', parallax: 0.05, count: 8, seed: 8 },
      ] },
      // el Amazonas: la otra orilla lejísimos
      { x0: RIO + 4, x1: RIO + 16, anchorRow: W, sky: SELVA_SKY, layers: [
        { kind: 'river', build: riverFar, color: '#c49a62', color2: '#a8804e', y: W - 0.8, parallax: 0.08, vpar: 0.12 },
        { kind: 'clouds', color: '#ffffff', parallax: 0.04, count: 10, seed: 12 },
      ] },
      // Pacaya Samiria: el muro verde del bosque
      { x0: PS - 2, x1: PS + 8, anchorRow: GP, sky: SELVA_SKY, layers: [
        { kind: 'canopy', color: '#5f8f6a', color2: '#4d7a5a', y: GP - 4.2, parallax: 0.08, vpar: 0.1, amp: 2.4, seed: 13 },
        { kind: 'canopy', color: '#3f7a4c', color2: '#30623e', y: GP - 2.4, parallax: 0.2, vpar: 0.26, amp: 2.2, seed: 17 },
        { kind: 'canopy', color: '#2a5a34', color2: '#1f4a2a', y: GP - 0.8, parallax: 0.36, vpar: 0.42, amp: 1.8, seed: 21 },
        { kind: 'clouds', color: '#f4f6ee', parallax: 0.05, count: 7, seed: 4 },
      ] },
      // la estación: el río abierto otra vez, de mañanita
      { x0: ES - 4, x1: ES + 6, anchorRow: DK, sky: SELVA_SKY, layers: [
        { kind: 'river', build: riverFar, color: '#c49a62', color2: '#a8804e', y: DK - 0.4, parallax: 0.1, vpar: 0.14 },
        { kind: 'clouds', color: '#ffffff', parallax: 0.05, count: 9, seed: 9 },
      ] },
    ],
    zones: [
      { x: 0,   name: 'IQUITOS',        music: 'c4iquitos' },
      { x: 110, name: 'EL MALECÓN',     music: 'c4iquitos' },
      { x: BE,  name: 'BELÉN',          music: 'c4belen' },
      { x: RIO, name: 'EL AMAZONAS',    music: 'c4rio' },
      { x: PS,  name: 'PACAYA SAMIRIA', music: 'c4pacaya' },
      { x: AN,  name: 'AGUAS NEGRAS',   music: 'c4pacaya' },
      { x: ES,  name: 'LA ESTACIÓN',    music: 'c4estacion' },
    ],
    rects: [
      // ── IQUITOS: la vereda hasta el borde del malecón ──
      [0, GI, 142, H - GI, 'c4vereda'],
      [36, GI - 1, 2, 1, 'c4grada'],
      // la escalinata que baja del malecón a Belén
      [142, GI + 1, 1, H - GI - 1, 'c4step'], [143, GI + 2, 1, H - GI - 2, 'c4step'], [144, GI + 3, 1, H - GI - 3, 'c4step'], [145, GI + 4, 1, H - GI - 4, 'c4step'],
      // ── BELÉN: el mercado y la bajada al barrio flotante ──
      [146, GB, 30, H - GB, 'c4vereda'],
      [176, GB + 1, 1, H - GB - 1, 'c4step'], [177, GB + 2, 1, H - GB - 2, 'c4step'], [178, GB + 3, 1, H - GB - 3, 'c4step'], [179, GB + 4, 1, H - GB - 4, 'c4step'], [180, GB + 5, 1, H - GB - 5, 'c4step'],
      ...PALAFITOS.map(([x, w]) => [x, DK, w, 1, 'c4deck']),
      [260, DK, 8, 1, 'c4deck'],                       // el embarcadero de los peque-peque
      // ── PACAYA SAMIRIA: el embarcadero de la reserva y la restinga ──
      [PS, DK, 6, 1, 'c4deck'],
      [PS + 6, GP + 1, 1, H - GP - 1, 'c4forest'], [PS + 7, GP, AN - PS - 7, H - GP, 'c4forest'],
      ...ALETAS.map(x => [x, GP - 2, 2, 2, 'c4bark']),
      // ── AGUAS NEGRAS: islotes de raíces entre troncos y paiches ──
      ...[710, 724, 737, 757, 775].map(x => [x, DK, 3, H - DK, 'c4bark']),
      // ── LA ESTACIÓN: la playa ──
      [ES, DK, 862 - ES, H - DK, 'c4sand'],
    ],
    platforms: [
      // balcón y azotea de la Casa de Fierro
      [39, GI - 4, 10, 'c4iron'], [41, GI - 8, 6, 'c4iron'],
      // los toldos de las tiendas del jirón Próspero
      ...TOLDOS.map(([x, w]) => [x, GI - 3, w, 'c4toldo']),
      // el techo del palafito de la tercera casa (ahí se enganchó una hoja)
      [236, DK - 4, 4, 'c4plank'],
      // la rama baja de la restinga y los troncos caídos de la cocha
      [683, GP - 6, 4, 'c4plank'],
      [704, DK, 4, 'trunk'], [729, DK, 6, 'trunk'], [762, DK, 6, 'trunk'], [780, DK, 4, 'trunk'],
    ],
    liquids: [
      // el Itaya en Belén y el Amazonas (café con leche: ver RIO_PAL)
      [181, W, PS + 6 - 181, H - W, 'water', 1],
      // la cocha de aguas negras (ver NEGRA_PAL)
      [AN, W, ES - AN, H - W, 'water', 0.15],
      // la orilla del río donde la clase suelta las taricayas
      [862, DK, 10, H - DK, 'water', 0.6],
    ],
    entities: [
      // ── IQUITOS ── (el aguacero va primero: pinta las gotas que revientan)
      { type: 'aguacero', x0: 66, x1: 108, y: GI },
      { type: 'npc', x: 9, y: GI, model: 'senora', r: 5, lines: ['¡ÑAÑO, TE QUEDASTE DORMIDO!', '¡TU CLASE ES A LAS 8:00!', '¡Y ES EN PACAYA SAMIRIA!'] },
      { type: 'gallinazo', x: 2, y: GI - 5.6 }, { type: 'gallinazo', x: 22, y: GI - 7.25 }, { type: 'gallinazo', x: 30, y: GI - 7.25 },
      { type: 'npc', x: 24, y: GI, model: 'heladera', lines: ['¡HELADO DE AGUAJE, CASERITO!', '¡CHUPETE DE CAMU CAMU!'] },
      { type: 'page', x: 43.5, y: GI - 9 },
      { type: 'hint', x: 44, y: GI - 4, text: '¡UNA HOJA!', arrow: 'up', r: 4, pass: 5, vr: 3, dy: -28, item: 'page' },
      { type: 'checkpoint', x: 52, y: GI },
      { type: 'sign3', x: 53, y: GI, lines: ['JR. PRÓSPERO'], color: 'blue', post: 16 },
      { type: 'motoSpawner', x0: 54, x1: 110, y: GI, gaps: [150, 100, 160, 90, 130, 170, 80, 150, 110], speeds: [1.4, 2.0, 1.8, 2.4, 2.0, 2.6, 1.9, 2.3, 2.2] },
      { type: 'help', x0: 52, x1: 110, kind: 'motocarro', text: 'SALTA ENCIMA DEL MOTOCARRO O ESPERA EN UN TOLDO' },
      ...CASAS.filter(c => c.i % 2 === 0).map(c => ({ type: 'gallinazo', x: c.x + 2 + (c.i % 3), y: GI - c.floors * 3 - 0.5 })),
      { type: 'checkpoint', x: 84, y: GI },
      { type: 'npc', x: 92, y: GI, model: 'nino', lines: ['¡QUÉ AGUACERO, ÑAÑO!', '¡YA VA A PASAR!'] },
      // ── EL MALECÓN ──
      { type: 'checkpoint', x: 114, y: GI },
      { type: 'sign3', x: 115, y: GI, lines: ['MALECÓN', 'TARAPACÁ'], color: 'green', post: 12 },
      { type: 'npc', x: 120, y: GI, model: 'nina', lines: ['¡MIRA EL ARCOÍRIS!', '¡Y ESE RÍO TAN GRANDE!'] },
      { type: 'npc', x: 131, y: GI, model: 'senora', lines: ['¡JUANE, TACACHO CON CECINA!', '¡SURI ASADO, ÑAÑO!'] },
      { type: 'sign3', x: 139, y: GI, lines: ['BAJADA', 'A BELÉN'], color: 'yellow', post: 10 },
      // ── BELÉN ──
      { type: 'checkpoint', x: 150, y: GB },
      { type: 'npc', x: 157, y: GB, model: 'pastor', lines: ['¡CHUCHUHUASI PARA EL CANSANCIO!', '¡SANGRE DE GRADO, PARA TODO!'] },
      { type: 'prop', kind: 'olla', x: 165, y: GB, bonus: 1 },
      { type: 'npc', x: 170, y: GB, model: 'heladera', lines: ['¡AGUAJE, AGUAJITO!', '¡PESCADITO FRESCO!'] },
      ...[150, 154.5, 167, 172.5].map(x => ({ type: 'gallinazo', x, y: GB - 3.25 })),
      { type: 'checkpoint', x: 183, y: DK },
      // el bote que pasa va antes que las casas: su ola las hace cabecear
      { type: 'boteItaya', x0: 181, x1: 268, wl: W, per: 480 },
      ...CASAS_FLOT.map(c => Object.assign({ type: 'casaFlotante', wl: W }, c)),
      ...PALAFITOS.map(([x, w]) => ({ type: 'pilotes', x0: x, x1: x + w, y: DK, wl: W })),
      { type: 'pilotes', x0: 260, x1: 268, y: DK, wl: W },
      { type: 'hint', x: 186, y: DK, text: ['LAS CASAS SE MECEN:', 'SALTA CUANDO SE ACERQUEN'], arrow: 'right', r: 4, pass: 2, dy: 12 },
      { type: 'help', x0: 181, x1: 260, kind: 'water', text: 'ESPERA QUE LA CASA SE ACERQUE Y SALTA' },
      { type: 'checkpoint', x: 207, y: DK },
      { type: 'npc', x: 209.5, y: DK, model: 'nina', lines: ['¡MI CASA FLOTA!', 'EN CRECIENTE SUBE CON EL RÍO'] },
      { type: 'checkpoint', x: 237, y: DK },
      { type: 'page', x: 237.5, y: DK - 5 },
      { type: 'checkpoint', x: 263, y: DK },
      { type: 'sign3', x: 260.5, y: DK, lines: ['EMBARCADERO'], color: 'wood', post: 18 },
      { type: 'npc', x: 264, y: DK, model: 'motorista', lines: ['¡LLÉVATE MI PEQUE-PEQUE, ÑAÑO!', '¡ME LO DEVUELVES, OÍSTE!'] },
      // ── EL AMAZONAS ── (la lancha va antes que el bote: queda más lejos)
      { type: 'lancha', x: 470, wl: W },
      { type: 'grifo', x: 438, wl: W },
      { type: 'pequePeque', x: 268, wl: W, end: PS },
      { type: 'hint', x: 266, y: DK, text: '¡SÚBETE AL PEQUE-PEQUE!', key: 'right', arrow: 'down', r: 6, pass: 2, dy: 18, when: (g) => !g.player.riding },
      // entre un obstáculo y el siguiente hay al menos 14 casillas: el salto del bote
      // cubre ~11 y hay que alcanzar a aterrizar y volver a saltar (un tronco que baja
      // se encuentra con el bote ~5 casillas antes de donde empieza)
      // más fácil: 5 palizadas (antes 9) y más bajas, con mucho aire entre una y otra
      ...[290, 388, 600].map(x => ({ type: 'palizada', x, wl: W, w: 2, h: 8 })),
      ...[326, 516].map(x => ({ type: 'palizada', x, wl: W, w: 3, h: 10 })),
      { type: 'hint', x: 284, y: W, text: 'SALTA', key: 'jump', r: 8, pass: 0, dy: 20, vr: 3, when: (g) => !!g.player.riding },
      { type: 'help', x0: RIO, x1: PS, kind: 'palizada', text: 'SALTA ANTES DE LLEGAR A LA PALIZADA' },
      { type: 'help', x0: RIO, x1: PS, kind: 'tronco', text: 'EL TRONCO VIENE HACIA TI: SÁLTALO' },
      { type: 'red', x: 342, w: 3, wl: W },
      { type: 'tronco', x: 462, wl: W },
      { type: 'remolino', x0: 400, x1: 408, wl: W }, { type: 'remolino', x0: 494, x1: 502, wl: W },
      ...[[300, 1, 0], [316, -1, 60], [330, 1, 120], [344, 1, 30], [366, -1, 90], [412, 1, 10], [452, 1, 0], [456, -1, 70], [470, 1, 130], [520, -1, 40], [540, 1, 100], [580, 1, 20], [606, -1, 80]]
        .map(([x, dir, ph]) => ({ type: 'bufeo', x, dir, ph, wl: W })),
      ...[296, 358, 444, 530, 586].map(x => ({ type: 'checkpoint', x, y: W })),
      // ── PACAYA SAMIRIA ──
      { type: 'pilotes', x0: PS, x1: PS + 6, y: DK, wl: W },
      { type: 'sign3', x: PS + 2, y: DK, lines: ['RESERVA NACIONAL', 'PACAYA SAMIRIA'], color: 'green', post: 20 },
      { type: 'checkpoint', x: PS + 9, y: GP },
      { type: 'npc', x: PS + 11, y: GP, model: 'guardaparque', lines: ['¡BIENVENIDO A LA SELVA DE LOS ESPEJOS!', '¡OJO CON LAS HUANGANAS!'] },
      ...[[630, 6], [652, 7], [675, 8]].map(([x, n]) => ({ type: 'manada', x, n, y: GP, end: AN })),
      { type: 'help', x0: PS, x1: AN, kind: 'huangana', text: 'CUANDO TIEMBLE EL SUELO, SÚBETE A UNA ALETA' },
      { type: 'checkpoint', x: 641, y: GP }, { type: 'checkpoint', x: 663, y: GP }, { type: 'checkpoint', x: 686, y: GP },
      { type: 'page', x: 684.5, y: GP - 7 },
      // ── AGUAS NEGRAS ──
      { type: 'espejo', x0: AN, x1: ES },
      { type: 'paiche', x: 716, wl: W, ph: 0, hint: true }, { type: 'paiche', x: 721, wl: W, ph: 250 },
      { type: 'paiche', x: 743, wl: W, ph: 0 }, { type: 'paiche', x: 748, wl: W, ph: 255 }, { type: 'paiche', x: 753, wl: W, ph: 210 },
      { type: 'paiche', x: 771, wl: W, ph: 100 },
      { type: 'anaconda', x: 731.5, y: 63, low: DK }, { type: 'anaconda', x: 765, y: 63, low: DK },
      { type: 'help', x0: AN, x1: ES, kind: 'water', text: 'ESPERA LAS BURBUJAS: EL PAICHE VA A SUBIR' },
      { type: 'help', x0: AN, x1: ES, kind: 'anaconda', text: 'DEJA QUE LA ANACONDA ATAQUE Y PASA' },
      ...[711, 725, 738, 758, 776].map(x => ({ type: 'checkpoint', x, y: DK })),
      // ── LA ESTACIÓN ──
      { type: 'checkpoint', x: ES + 4, y: DK },
      { type: 'npc', x: 812, y: DK, model: 'guardaparque', lines: ['¡CORRE, LA CLASE YA EMPEZÓ!', '¡ES EN LA PLAYA!'] },
      { type: 'bufeo', x: 866, dir: -1, ph: 30, wl: DK, per: 220 },
      { type: 'claseCampo', x: 836, y: DK, water: 862 },
    ],
    // la flecha «¡POR AQUÍ!» de la guía apunta al final a tu sitio en la clase
    goal: { x: 840.5, y: DK },
    renderBack: renderBack4,
    renderScreen: renderScreen4,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  FONDOS DE PARALLAX (dibujados una vez en una tira de 768 px)
  // ═══════════════════════════════════════════════════════════════════════════
  // los techos de Iquitos a lo lejos: casas bajas, tanques de agua, palmeras y antenas
  function iquitosFar(g, W2, H2) {
    let x = 0, i = 0;
    while (x < W2) {
      const w = 16 + Math.floor(hash(i * 7) * 22), h = 8 + Math.floor(hash(i * 13) * 14), base = 130;
      R(g, ['#e8dcc6', '#d9b48a', '#c9d6c0', '#e3c06a', '#b8d0d8'][i % 5], x, base - h, w - 1, H2);
      R(g, 'rgba(0,0,0,0.12)', x, base - h, w - 1, 2);
      for (let k = 3; k < w - 4; k += 6) R(g, '#5d4a44', x + k, base - h + 4, 2, 3);
      if (hash(i * 3) > 0.6) { R(g, '#3a3440', x + w - 9, base - h - 7, 6, 7); R(g, '#3a3440', x + w - 8, base - h - 9, 4, 2); }   // tanque negro
      if (hash(i * 5) > 0.7) { const px = x + 4; R(g, '#6b4a2c', px, base - h - 22, 2, 22); for (let k = -2; k < 3; k++) R(g, '#3f7a4c', px - 6 + k * 2, base - h - 24 + Math.abs(k), 6, 2); }   // palmera
      if (i % 11 === 6) { R(g, '#8a8f99', x + 6, base - h - 40, 1, 40); R(g, '#d8432f', x + 5, base - h - 41, 3, 2); }   // antena
      x += w; i++;
    }
    R(g, '#8a7a64', 0, 134, W2, H2);
  }
  // el río ancho y la otra orilla: una línea de selva plana con árboles que sobresalen
  function riverFar(g, W2, H2) {
    for (let x = 0; x < W2; x += 2) {
      const top = 112 - Math.round(Math.abs(Math.sin(x * 0.045)) * 4 + hash(x >> 3) * 4 + (hash(x >> 5) > 0.85 ? 6 : 0));
      R(g, '#3f6a4a', x, top, 2, 121 - top); R(g, '#567f5c', x, top, 2, 2);
    }
    for (let y = 121; y < H2; y++) { const k = Math.min(1, (y - 121) / 50); R(g, k < 0.2 ? '#d9b884' : k < 0.5 ? '#c9a670' : '#b8925c', 0, y, W2, 1); }
    for (let i = 0; i < 70; i++) R(g, '#ead2a4', Math.floor(hash(i * 7) * W2), 123 + Math.floor(hash(i * 13) * hash(i * 3) * 40), 3 + Math.floor(hash(i) * 8), 1);
  }
  // Belén desde el agua: la otra orilla del Itaya con casas sobre pilotes
  function belenFar(g, W2, H2) {
    riverFar(g, W2, H2);
    for (let x = 6, i = 0; x < W2 - 30; x += 24 + Math.floor(hash(i) * 30), i++) {
      const w = 14 + Math.floor(hash(i * 5) * 10), base = 118;
      for (let k = 2; k < w; k += 6) R(g, '#6b5a44', x + k, base, 1, 5);
      R(g, ['#c9a36a', '#9cc7d0', '#d0aea4', '#e3c06a'][i % 4], x, base - 9, w, 9);
      for (let r = 0; r < 5; r++) R(g, '#a8873a', x - 1 + r, base - 10 - r, w + 2 - r * 2, 1);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DECORADO EN EL MUNDO (detrás de los tiles): hospedaje, catedral, Casa de
  //  Fierro, casas de azulejos, malecón, mercado, palafitos y la estación.
  //  Cada pieza se dibuja una vez en su propio canvas y luego solo se copia.
  // ═══════════════════════════════════════════════════════════════════════════
  const cache = {};
  function cached(key, w, h, paint) {
    if (!cache[key]) { const c = PIX.createCanvas(w, h); paint(c.getContext('2d'), w, h); cache[key] = c; }
    return cache[key];
  }
  // azulejos: cuadritos de 6 px con su flor, en el color que toque
  function azulejos(g, x0, y0, w, h, c1, c2) {
    for (let y = y0; y < y0 + h; y += 6) for (let x = x0; x < x0 + w; x += 6) {
      const ww = Math.min(6, x0 + w - x), hh = Math.min(6, y0 + h - y);
      R(g, '#f4f1e8', x, y, ww, hh);
      if (ww > 4 && hh > 4) { R(g, c1, x + 1, y + 1, 4, 4); R(g, '#f4f1e8', x + 2, y + 2, 2, 2); R(g, c2, x + 2, y + 2, 1, 1); R(g, c1, x, y, 1, 1); }
    }
  }
  // ventana alta con persianas de madera
  function ventana(g, x, y, col) { R(g, '#2a1f2d', x - 1, y - 1, 12, 22); R(g, col, x, y, 10, 20); R(g, '#1d2a3a', x + 2, y + 2, 6, 16); for (let k = 3; k < 18; k += 3) R(g, col, x + 2, y + k, 6, 1); R(g, '#f4efe4', x - 2, y + 20, 14, 2); }
  // el hospedaje donde se quedó dormido
  function paintHospedaje(g, W2, H2) {
    R(g, '#2a1f2d', 4, 10, W2 - 8, H2 - 10); R(g, '#f2d39a', 5, 11, W2 - 10, H2 - 11);
    azulejos(g, 5, H2 - 26, W2 - 10, 26, '#2f5fa8', '#e8b83a');
    ventana(g, 16, 22, '#3f8a46'); ventana(g, W2 - 30, 22, '#3f8a46');
    R(g, '#2a1f2d', W2 / 2 - 9, H2 - 32, 18, 32); R(g, '#6b4524', W2 / 2 - 8, H2 - 31, 16, 31); R(g, '#e2b13c', W2 / 2 + 4, H2 - 16, 1, 2);
    R(g, '#1d1622', W2 / 2 - 31, 48, 62, 13); R(g, '#3f8a46', W2 / 2 - 30, 49, 60, 11);
    drawText(g, 'HOSPEDAJE', W2 / 2, 51, { color: '#ffffff', align: 'center' });
    R(g, '#d9d2c4', 0, 6, W2, 5); R(g, '#3a3440', W2 - 30, 0, 14, 7);   // cornisa y tanque
  }
  // la Iglesia Matriz de Iquitos: una sola torre alta con su reloj
  function paintMatriz(g, W2, H2) {
    const st = '#e8dcc0', dk = '#c9b892', hi = '#f6eedc';
    R(g, '#2a1f2d', 60, 70, W2 - 64, H2 - 70); R(g, st, 61, 71, W2 - 66, H2 - 71);
    for (let y = 80; y < H2; y += 10) R(g, dk, 61, y, W2 - 66, 1);
    // nave: frontón en punta, rosetón y la puerta ojival
    const cx = 60 + (W2 - 64) / 2;
    for (let r = 0; r < 26; r++) R(g, r % 2 ? st : hi, cx - 70 + r * 2.7, 70 - r, 140 - r * 5.4, 1);
    R(g, '#2a1f2d', cx - 10, 86, 20, 20); R(g, '#3f6fb8', cx - 9, 87, 18, 18); R(g, '#d8432f', cx - 3, 93, 6, 6); R(g, '#f6c94a', cx - 1, 95, 2, 2);
    R(g, '#2a1f2d', cx - 13, H2 - 50, 26, 50); R(g, '#6b4524', cx - 12, H2 - 48, 24, 48);
    for (let r = 0; r < 8; r++) R(g, '#2a1f2d', cx - 12 + r * 1.5, H2 - 56 + r, 24 - r * 3, 1);
    // pilastras y ventanas ojivales con vitral
    for (let k = 68; k < W2 - 8; k += 46) { R(g, hi, k, 72, 5, H2 - 72); R(g, dk, k + 5, 72, 1, H2 - 72); }
    for (const k of [-38, 28]) {
      R(g, '#2a1f2d', cx + k, 116, 11, 32); R(g, '#3f6fb8', cx + k + 1, 118, 9, 30); R(g, '#d8432f', cx + k + 3, 126, 5, 5); R(g, '#f6c94a', cx + k + 4, 136, 3, 3);
      for (let r = 0; r < 5; r++) R(g, '#2a1f2d', cx + k + 1 + r, 116 - r, 9 - r * 2, 1);
    }
    R(g, dk, 61, H2 - 22, W2 - 66, 2);   // zócalo
    // la torre del reloj, con su aguja
    const tx = 6, tw = 50;
    R(g, '#2a1f2d', tx, 40, tw, H2 - 40); R(g, st, tx + 1, 41, tw - 2, H2 - 41); R(g, hi, tx + 1, 41, 3, H2 - 41);
    for (let y = 52; y < H2; y += 12) R(g, dk, tx + 1, y, tw - 2, 1);
    R(g, '#2a1f2d', tx + 13, 56, 24, 24); R(g, '#f4efe4', tx + 14, 57, 22, 22); R(g, '#2a1f2d', tx + 24, 60, 2, 9); R(g, '#2a1f2d', tx + 25, 67, 7, 2);
    R(g, '#2a1f2d', tx + 16, 92, 18, 26); R(g, '#1d1622', tx + 18, 94, 14, 24); R(g, '#e2b13c', tx + 22, 100, 6, 6);
    for (let r = 0; r < 38; r++) { const half = Math.round((tw / 2 + 2) * (1 - r / 38)); R(g, '#7a7a84', tx + tw / 2 - half, 40 - r, half * 2, 1); R(g, '#9a9aa4', tx + tw / 2 - half, 40 - r, 2, 1); }
    R(g, '#e2b13c', tx + tw / 2 - 1, 0, 2, 4);
  }
  // LA CASA DE FIERRO (la de Eiffel): planchas de hierro plateado con remaches,
  // un balcón corrido y la azotea con baranda. Sus pisos son plataformas.
  function paintFierro(g, W2, H2) {
    const plate = '#a8adb6', dark = '#6e737c', hi = '#d0d4da', base = H2;
    const bal = base - 64, top = base - 128;
    R(g, '#2a1f2d', 20, top + 4, W2 - 40, base - top - 4); R(g, plate, 21, top + 5, W2 - 42, base - top - 5);
    for (let y = top + 5; y < base; y += 12) R(g, dark, 21, y, W2 - 42, 1);
    for (let x = 21; x < W2 - 21; x += 18) { R(g, dark, x, top + 5, 1, base - top - 5); for (let y = top + 8; y < base; y += 6) R(g, hi, x + 2, y, 1, 1); }
    // tiendas abajo, ventanas arriba
    for (let x = 34; x < W2 - 44; x += 42) { R(g, '#2a1f2d', x, base - 40, 30, 40); R(g, '#3a3440', x + 1, base - 39, 28, 39); for (let y = base - 38; y < base; y += 3) R(g, '#55505c', x + 1, y, 28, 1); }
    for (let x = 36; x < W2 - 44; x += 42) { R(g, '#2a1f2d', x, bal - 44, 24, 34); R(g, '#1d2a3a', x + 1, bal - 43, 22, 33); R(g, '#9fd3f0', x + 2, bal - 42, 4, 6); }
    // el balcón corrido y la azotea con sus barandas de fierro
    for (const [y, x0, x1] of [[bal, 48, 208], [top + 4, 80, 176]]) {
      R(g, '#2a1f2d', x0 - 2, y - 1, x1 - x0 + 4, 4); R(g, '#8a8f99', x0 - 1, y, x1 - x0 + 2, 2);
      R(g, '#2a1f2d', x0 - 2, y - 14, x1 - x0 + 4, 2);
      for (let x = x0; x < x1; x += 5) { R(g, '#3a3440', x, y - 12, 1, 12); if ((x / 5) % 2) R(g, '#3a3440', x - 1, y - 7, 3, 1); }
    }
    R(g, '#1d1622', W2 / 2 - 44, bal + 8, 88, 12); R(g, '#f4efe4', W2 / 2 - 43, bal + 9, 86, 10);
    drawText(g, 'CASA DE FIERRO', W2 / 2, bal + 11, { color: '#27426e', align: 'center' });
  }
  // casa del jirón Próspero con su fachada de azulejos, balcones y cornisa
  const AZUL = [['#2f5fa8', '#e8b83a'], ['#3f8a46', '#d8432f'], ['#c9894a', '#2f5fa8'], ['#2f8a84', '#f6c94a']];
  function paintCasa(c) {
    return (g, W2, H2) => {
      const [c1, c2] = AZUL[c.i % AZUL.length];
      R(g, '#2a1f2d', 0, 6, W2, H2 - 6);
      azulejos(g, 1, 7, W2 - 2, H2 - 7, c1, c2);
      // cornisa con remate
      R(g, '#f4efe4', 0, 0, W2, 8); R(g, '#d9d2c4', 0, 6, W2, 2); for (let k = 4; k < W2; k += 12) R(g, '#f4efe4', k, -2, 4, 4);
      const fl = 48;   // alto de cada piso
      for (let f = 0; f < c.floors; f++) {
        const fy = H2 - (f + 1) * fl;
        for (let x = 8; x < W2 - 14; x += 22) {
          if (f === 0) { R(g, '#2a1f2d', x, fy + 12, 14, 36); R(g, '#6b4524', x + 1, fy + 13, 12, 35); R(g, '#2f5fa8', x + 1, fy + 13, 12, 3); }
          else { ventana(g, x + 2, fy + 14, '#3f6fb8'); R(g, '#3a3440', x - 2, fy + 34, 18, 1); for (let k = 0; k < 18; k += 3) R(g, '#3a3440', x - 2 + k, fy + 28, 1, 7); }
        }
      }
    };
  }
  // el mercado de Belén: techos de calamina sobre palos, puestos con aguaje,
  // plátanos y pescado, y los gallinazos de siempre
  function paintMercado(g, W2, H2) {
    for (let x = 0, i = 0; x < W2; i++) {
      const w = 70 + Math.floor(hash(i * 3) * 30), roof = 18 + Math.floor(hash(i * 7) * 8);
      for (const px of [x + 4, x + w - 8]) R(g, '#6b4524', px, roof, 3, H2 - roof);
      for (let k = 0; k < w; k++) { const y = roof - 4 + Math.round(k * 4 / w); R(g, '#2a1f2d', x + k, y - 1, 1, 6); R(g, k % 4 < 2 ? '#a8adb6' : '#8a8f99', x + k, y, 1, 4); if (hash(k * 7 + i) > 0.85) R(g, '#9a5a30', x + k, y + 1, 1, 2); }
      // la mesa del puesto con su mercadería
      const ty = H2 - 16;
      R(g, '#6b4524', x + 10, ty, w - 20, 3); R(g, '#4a2f18', x + 12, ty + 3, 2, 13); R(g, '#4a2f18', x + w - 14, ty + 3, 2, 13);
      for (let k = 12; k < w - 14; k += 4) {
        const kind = (i + Math.floor(k / 16)) % 3, h = hash(k * 5 + i);
        if (kind === 0) { R(g, h > 0.5 ? '#7a2a1a' : '#5a1f14', x + k, ty - 3, 3, 3); R(g, '#a85a30', x + k + 1, ty - 3, 1, 1); }   // aguaje
        else if (kind === 1) R(g, h > 0.4 ? '#f6c94a' : '#93a84a', x + k, ty - 2 - (h > 0.7 ? 1 : 0), 4, 2);                       // plátano
        else { R(g, '#8a9aa4', x + k, ty - 2, 4, 2); R(g, '#c9d6dc', x + k, ty - 2, 4, 1); }                                         // pescado
      }
      // racimos de plátanos colgando del techo
      for (let k = 18; k < w - 18; k += 26) { R(g, '#6b4524', x + k + 2, roof + 2, 1, 6); for (let r = 0; r < 4; r++) R(g, r % 2 ? '#93a84a' : '#f6c94a', x + k - r, roof + 8 + r * 2, 6 + r * 2 - r, 2); }
      x += w;
    }
  }
  // palafito: casa de madera sobre la plataforma, con techo de calamina o de irapay
  function paintPalafito(st) {
    return (g, W2, H2) => {
      const wall = ['#c9894a', '#8fb0c4', '#d9b45a'][st], b = H2, roofY = st === 2 ? b - 64 : b - 44;
      R(g, '#2a1f2d', 8, roofY, W2 - 16, b - roofY); R(g, wall, 9, roofY + 1, W2 - 18, b - roofY - 1);
      for (let k = 12; k < W2 - 10; k += 4) R(g, 'rgba(0,0,0,0.12)', k, roofY + 1, 1, b - roofY - 1);
      R(g, '#2a1f2d', 18, b - 30, 12, 30); R(g, '#3a2414', 19, b - 29, 10, 29);
      R(g, '#2a1f2d', W2 - 34, b - 32, 16, 12); R(g, '#1d2a3a', W2 - 33, b - 31, 14, 10); R(g, '#d8432f', W2 - 33, b - 31, 5, 10);
      if (st === 2) {
        // la casa alta: su techo plano es la azotea (se pisa)
        R(g, '#2a1f2d', 4, roofY - 2, W2 - 8, 4); R(g, '#8a8f99', 5, roofY - 1, W2 - 10, 2);
        R(g, '#2a1f2d', W2 - 34, b - 58, 16, 12); R(g, '#1d2a3a', W2 - 33, b - 57, 14, 10);
      } else for (let r = 0; r < 12; r++) { const half = Math.round((W2 / 2 - 2) * (r + 1) / 12); R(g, '#6b4a24', W2 / 2 - half - 1, roofY - 12 + r, half * 2 + 2, 1); R(g, r % 3 === 2 ? '#a8873a' : '#c9a85a', W2 / 2 - half, roofY - 12 + r, half * 2, 1); }
      // ropa tendida
      R(g, '#d9b45a', 10, b - 40 + (st === 2 ? -20 : 0), W2 - 20, 1);
      for (let k = 14; k < W2 - 20; k += 9) R(g, ['#d8432f', '#3f6fb8', '#f6c94a', '#f4efe4'][(k + st) % 4], k, b - 39 + (st === 2 ? -20 : 0), 5, 6);
    };
  }
  // el puesto de vigilancia de la reserva
  function paintPuesto(g, W2, H2) {
    R(g, '#2a1f2d', 6, 16, W2 - 12, H2 - 16); R(g, '#8a6a3a', 7, 17, W2 - 14, H2 - 17);
    for (let k = 10; k < W2 - 8; k += 5) R(g, '#6b4a24', k, 17, 1, H2 - 17);
    for (let r = 0; r < 14; r++) { const half = Math.round((W2 / 2) * (r + 1) / 14); R(g, '#6b4a24', W2 / 2 - half - 1, 2 + r, half * 2 + 2, 1); R(g, r % 3 === 2 ? '#a8873a' : '#c9a85a', W2 / 2 - half, 2 + r, half * 2, 1); }
    R(g, '#2a1f2d', W2 / 2 - 6, H2 - 24, 12, 24); R(g, '#3a2414', W2 / 2 - 5, H2 - 23, 10, 23);
  }
  // la estación biológica: una casona de madera sobre pilotes, con su letrero
  function paintEstacion(g, W2, H2) {
    const b = H2, floor = b - 34;
    for (let x = 14; x < W2 - 10; x += 28) { R(g, '#2a1f2d', x - 1, floor, 5, 34); R(g, '#7a5232', x, floor, 3, 34); }
    R(g, '#2a1f2d', 4, floor - 2, W2 - 8, 5); R(g, '#b07c44', 5, floor - 1, W2 - 10, 3);
    R(g, '#2a1f2d', 12, floor - 46, W2 - 24, 44); R(g, '#d9c89a', 13, floor - 45, W2 - 26, 43);
    for (let k = 16; k < W2 - 14; k += 5) R(g, '#c2b080', k, floor - 45, 1, 43);
    for (let x = 22; x < W2 - 30; x += 32) { R(g, '#2a1f2d', x, floor - 34, 18, 16); R(g, '#3f6b3a', x + 1, floor - 33, 16, 14); for (let k = 2; k < 16; k += 3) R(g, '#5f8f6a', x + 1 + k, floor - 33, 1, 14); }
    for (let r = 0; r < 20; r++) { const half = Math.round((W2 / 2) * (r + 1) / 20); R(g, '#6b4a24', W2 / 2 - half - 1, floor - 66 + r, half * 2 + 2, 1); R(g, r % 3 === 2 ? '#a8873a' : '#c9a85a', W2 / 2 - half, floor - 66 + r, half * 2, 1); }
    R(g, '#1d1622', W2 / 2 - 60, floor - 14, 120, 12); R(g, '#3f8a46', W2 / 2 - 59, floor - 13, 118, 10);
    drawText(g, 'ESTACIÓN BIOLÓGICA', W2 / 2, floor - 12, { color: '#ffffff', align: 'center' });
    // la escalera de bajada a la playa
    for (let k = 0; k < 6; k++) R(g, '#7a5232', W2 - 24 + k * 3, floor + 4 + k * 5, 8, 2);
  }
  // árbol gigante del bosque inundado: tronco liso con aletas, lianas y la copa
  // que se pierde arriba
  function paintArbol(g, W2, H2) {
    const cx = W2 / 2, b = H2;
    R(g, '#2a1f2d', cx - 13, 0, 26, b); R(g, '#8a7a66', cx - 12, 0, 24, b); R(g, '#a89a84', cx - 10, 0, 4, b); R(g, '#6a5c4e', cx + 6, 0, 5, b);
    for (let y = 10; y < b; y += 23) R(g, '#6a5c4e', cx - 4 + (y % 3), y, 3, 9);
    // aletas que bajan al suelo
    for (let r = 0; r < 30; r++) { const k = r / 30; R(g, '#7a6a58', cx - 13 - k * k * 22, b - 30 + r, 4, 1); R(g, '#7a6a58', cx + 10 + k * k * 22, b - 30 + r, 4, 1); }
    // lianas y matapalo
    for (let k = 0; k < 3; k++) for (let y = 0; y < b - 10; y += 2) R(g, '#3f6b2c', cx - 16 + k * 14 + Math.round(Math.sin(y * 0.06 + k) * 2), y, 1, 2);
    for (let y = 8; y < b - 30; y += 17) { R(g, '#3f8a46', cx - 14, y, 5, 3); R(g, '#5fb050', cx + 9, y + 6, 5, 3); }
  }

  // piezas del decorado: [x en casillas, fila del suelo, ancho y alto (px), pintor, ajuste x, ajuste y]
  const BACK = [
    [0, GI, 9 * TILE + 8, 96, paintHospedaje, -4],
    [12, GI, 20 * TILE, 186, paintMatriz],
    [36, GI, 14 * TILE, 150, paintFierro],
    ...CASAS.map(c => [c.x, GI, c.w * TILE - 2, c.floors * 48 + 8, paintCasa(c)]),
    [BE, GB, 30 * TILE, 70, paintMercado],
    ...PALAFITOS.map(([x, w, st]) => [x, DK, w * TILE, st === 2 ? 80 : 64, paintPalafito(st)]),
    [PS + 1, DK, 5 * TILE, 50, paintPuesto],
    [ES + 6, DK, 22 * TILE, 112, paintEstacion],
  ];
  function renderBack4(ctx, g) {
    const cam = g.cam, vw = VIEW.w;
    const vis = (x, w) => x + w > cam.x - 8 && x < cam.x + vw + 8;
    // el arcoíris sobre el Amazonas, después del aguacero (lejos: se mueve poco)
    if (cam.x > 96 * TILE && cam.x < 190 * TILE) {
      const a = Math.min(1, (cam.x - 96 * TILE) / 300, (190 * TILE - cam.x) / 300) * 0.55, ox = cam.x * 0.85 + 200, oy = GI * TILE - 10;
      const cols = ['#e05050', '#f0913c', '#f6c94a', '#6fbf5a', '#4f86c6', '#8a4cc0'];
      ctx.globalAlpha = Math.max(0, a);
      for (let i = 0; i < cols.length; i++) { ctx.strokeStyle = cols[i]; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(ox + 140, oy, 150 - i * 3, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    // árboles gigantes de Pacaya Samiria
    for (const [x, row] of ARBOLES) { const px = x * TILE - 16; if (vis(px - 30, 92)) ctx.drawImage(cached('arbol', 64, 200, paintArbol), px - 16, row * TILE - 200); }
    for (const [tx, row, w, h, paint, ox = 0, oy = 0] of BACK) {
      const x = tx * TILE + ox; if (!vis(x, w)) continue;
      ctx.drawImage(cached('b' + tx, w, h, paint), x, row * TILE - h + oy);
    }
    // la baranda del malecón con sus faroles
    if (vis(110 * TILE, 32 * TILE)) {
      const y = GI * TILE;
      R(ctx, '#2a1f2d', 110 * TILE, y - 17, 32 * TILE, 4); R(ctx, '#f4efe4', 110 * TILE, y - 16, 32 * TILE, 2);
      for (let x = 110 * TILE + 2; x < 142 * TILE; x += 6) { R(ctx, '#d9d2c4', x, y - 13, 3, 13); R(ctx, '#f4efe4', x, y - 11, 3, 2); }
      for (let x = 114 * TILE; x < 142 * TILE; x += 8 * TILE) { R(ctx, '#2a1f2d', x, y - 52, 3, 52); R(ctx, '#2a1f2d', x - 4, y - 56, 11, 6); R(ctx, '#fff3b0', x - 3, y - 55, 9, 4); }
    }
    // los toldos de las tiendas: lona a rayas con su fleco (se pisan)
    for (const [x, w, c] of TOLDOS) {
      const px = x * TILE, y = (GI - 3) * TILE; if (!vis(px, w * TILE)) continue;
      const cols = [['#d8432f', '#f4efe4'], ['#3f8a46', '#f6c94a'], ['#2f6fa8', '#f4efe4'], ['#f0913c', '#8a4cc0']][c];
      R(ctx, '#2a1f2d', px - 1, y - 1, w * TILE + 2, 7);
      for (let k = 0; k < w * TILE; k += 4) R(ctx, cols[(k >> 2) % 2], px + k, y, 4, 5);
      for (let k = 0; k < w * TILE; k += 4) R(ctx, cols[0], px + k + 1, y + 5, 2, 2);
      R(ctx, '#5d5768', px + 1, y + 6, 1, 3 * TILE - 6); R(ctx, '#5d5768', px + w * TILE - 2, y + 6, 1, 3 * TILE - 6);
    }
  }
  // efectos de pantalla: el aguacero (cielo gris, lluvia de costado y relámpagos)
  function renderScreen4(ctx, g) {
    const k = CAP4.rain;
    if (k > 0.01) {
      ctx.fillStyle = 'rgba(50,60,80,' + (0.32 * k).toFixed(3) + ')'; ctx.fillRect(0, 0, VIEW.w, VIEW.h);
      ctx.fillStyle = 'rgba(210,225,245,' + (0.55 * k).toFixed(3) + ')';
      const n = Math.round(150 * k);
      for (let i = 0; i < n; i++) {
        const x = ((hash(i * 7) * (VIEW.w + 60) - g.T * 2.2 - g.cam.x * 0.4) % (VIEW.w + 60) + VIEW.w + 60) % (VIEW.w + 60) - 30;
        const y = ((hash(i * 13) * VIEW.h + g.T * 9) % VIEW.h);
        for (let s = 0; s < 6; s++) ctx.fillRect(Math.round(x - s * 0.5), Math.round(y + s * 2), 1, 2);
      }
    }
    if (CAP4.flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (CAP4.flash / 14 * 0.6).toFixed(2) + ')'; ctx.fillRect(0, 0, VIEW.w, VIEW.h); }
  }

  // LA SELVA DE LOS ESPEJOS: en la cocha de aguas negras se refleja el bosque
  // (va después del agua, como una entidad más; solo donde hay agua)
  EXTRA_ENTITIES.espejo = (d) => ({
    x: d.x0 * TILE, y: W * TILE, w: (d.x1 - d.x0) * TILE, h: 64, update() {},
    draw(ctx, g) {
      const wl = W * TILE + 4, x0 = Math.max(this.x, Math.floor(g.cam.x / 4) * 4), x1 = Math.min(this.x + this.w, g.cam.x + VIEW.w);
      for (let x = x0; x < x1; x += 4) {
        if (!liquidKind(g.level.tile(Math.floor(x / TILE), W))) continue;
        const h = 14 + Math.floor(hash((x >> 3) + 7) * 12 + Math.abs(Math.sin(x * 0.02)) * 10);
        for (let y = 3; y < h; y += 2) {
          const off = Math.round(Math.sin(y * 0.5 + g.T * 0.04 + x * 0.01) * 1.2);
          ctx.fillStyle = 'rgba(63,122,76,' + (0.2 * (1 - y / h)).toFixed(3) + ')'; ctx.fillRect(x + off, wl + y, 4, 2);
        }
      }
    },
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  MÚSICA: cumbia amazónica (guitarra eléctrica con su "wah", timbal y
  //  güiro) en la ciudad y el río; algo más misterioso en la reserva
  // ═══════════════════════════════════════════════════════════════════════════
  const CUMBIA = { lead2Inst: 'none', strumInst: 'guitar', kit: 'chicha', shaker: 'guiro', leadInst: 'eguitar' };
  Object.assign(SONGS, {
    // cumbia de Iquitos: alegre y bailable, como el primer motocarro de la mañana
    c4iquitos: makeSong(Object.assign({ bpm: 100, vol: 0.27, strum: '.D.U.D.U', drums: 'B..bB.b.' }, CUMBIA), {
      A: { ch: ['Am', 'Am', 'Dm', 'Dm', 'G', 'G', 'C', 'E'],
           mel: 'E5:1 E5:1 A5:2 G5:1 E5:1 C5:2 | D5:1 E5:1 C5:2 A4:4 | F5:1 F5:1 A5:2 G5:1 F5:1 D5:2 | E5:1 F5:1 D5:2 A4:4 | D5:1 D5:1 G5:2 F5:1 D5:1 B4:2 | C5:1 D5:1 B4:2 G4:4 | C5:2 E5:2 G5:2 E5:2 | G#5:2 E5:2 B4:4' },
      B: { ch: ['F', 'G', 'Em', 'Am', 'F', 'G', 'E', 'Am'],
           mel: 'A5:2 C6:1 A5:1 F5:2 A5:2 | G5:2 B5:1 G5:1 D5:2 G5:2 | E5:1 G5:1 B5:2 G5:1 E5:1 B4:2 | C5:1 E5:1 A5:2 E5:4 | A5:1 G5:1 F5:2 A5:1 G5:1 F5:2 | G5:1 F5:1 D5:2 B4:2 D5:2 | E5:2 G#5:2 B5:2 G#5:2 | A5:4 A4:4' },
    }, ['A', 'B', 'A', 'B'], cumbiaBass),
    // Belén: juguetona, de mercado y de casas que se mecen
    c4belen: makeSong(Object.assign({ bpm: 108, vol: 0.27, strum: '.D.U.D.U', drums: 'B..bB.bb' }, CUMBIA), {
      A: { ch: ['C', 'C', 'G', 'G', 'Am', 'Am', 'F', 'G'],
           mel: 'E5:1 G5:1 C6:2 G5:1 E5:1 C5:2 | D5:1 E5:1 F5:1 E5:1 D5:2 C5:2 | B4:1 D5:1 G5:2 F5:1 D5:1 B4:2 | D5:2 G5:2 B5:4 | A5:1 G5:1 E5:2 C5:1 E5:1 A5:2 | G5:1 E5:1 C5:2 A4:4 | F5:1 A5:1 C6:2 A5:1 F5:1 C5:2 | D5:2 B4:2 G4:4' },
      B: { ch: ['Am', 'Em', 'F', 'C', 'Dm', 'Am', 'E', 'Am'],
           mel: 'C6:2 B5:1 A5:1 E5:2 A5:2 | B5:2 G5:1 E5:1 B4:2 E5:2 | A5:1 C6:1 A5:1 F5:1 C5:2 F5:2 | E5:1 G5:1 C6:2 G5:4 | F5:1 A5:1 D6:2 A5:1 F5:1 D5:2 | E5:1 A5:1 C6:2 A5:4 | G#5:1 B5:1 E6:2 D6:1 B5:1 G#5:2 | A5:4 r:4' },
    }, ['A', 'A*', 'B', 'B*', 'A'], cumbiaBass),
    // el río: rápida, con el motor del peque-peque empujando
    c4rio: makeSong(Object.assign({ bpm: 128, vol: 0.27, strum: '.D.U.D.U', drums: 'B.bbB.b.' }, CUMBIA), {
      A: { ch: ['Dm', 'Dm', 'C', 'C', 'Bb', 'Bb', 'A', 'A'],
           mel: 'D5:1 F5:1 A5:2 D6:2 A5:2 | C6:1 A5:1 F5:1 A5:1 D5:4 | C5:1 E5:1 G5:2 C6:2 G5:2 | Bb5:1 G5:1 E5:1 G5:1 C5:4 | Bb4:1 D5:1 F5:2 Bb5:2 F5:2 | A5:1 F5:1 D5:1 F5:1 Bb4:4 | A4:1 C#5:1 E5:2 A5:2 E5:2 | G5:1 F5:1 E5:1 C#5:1 A4:4' },
      B: { ch: ['Gm', 'Gm', 'Dm', 'Dm', 'Bb', 'C', 'A', 'Dm'],
           mel: 'G5:2 Bb5:1 G5:1 D5:2 G5:2 | A5:1 G5:1 F5:1 D5:1 Bb4:4 | F5:2 A5:1 F5:1 D5:2 F5:2 | E5:1 D5:1 C5:1 D5:1 A4:4 | D5:1 F5:1 Bb5:2 A5:1 G5:1 F5:2 | E5:1 G5:1 C6:2 Bb5:1 A5:1 G5:2 | A5:2 C#6:2 E6:2 C#6:2 | D6:4 D5:4' },
    }, ['A', 'B', 'A*', 'B'], cumbiaBass),
    // la reserva: la quena sobre la guitarra, misteriosa como el bosque inundado
    c4pacaya: makeSong({ bpm: 92, vol: 0.27, strum: '.D...D.U', drums: 'B...b.b.', shaker: true, strumInst: 'guitar', orn: 0.25, lead2Vol: 0.11 }, {
      A: { ch: ['Em', 'Em', 'C', 'C', 'Am', 'Am', 'B7', 'B7'],
           mel: 'E5:4 G5:2 B5:2 | A5:2 G5:2 E5:4 | C5:2 E5:2 G5:3 E5:1 | D5:2 C5:2 B4:4 | A4:2 C5:2 E5:2 A5:2 | G5:2 E5:2 C5:4 | B4:2 D#5:2 F#5:2 A5:2 | B5:4 r:4' },
      B: { ch: ['Am', 'Em', 'C', 'B7', 'Am', 'Em', 'B7', 'Em'],
           mel: 'C6:3 B5:1 A5:4 | B5:3 A5:1 G5:4 | E5:2 G5:2 C6:2 B5:2 | A5:2 F#5:2 D#5:4 | C5:2 E5:2 A5:2 C6:2 | B5:2 G5:2 E5:4 | F#5:2 A5:2 D#5:2 B4:2 | E5:8' },
    }, ['A', 'A~', 'B', 'A*', 'B'], slowBass),
    // la estación y el final: cumbia feliz, ya llegaste
    c4estacion: makeSong(Object.assign({ bpm: 104, vol: 0.27, strum: '.D.U.D.U', drums: 'B..bB.b.' }, CUMBIA), {
      A: { ch: ['G', 'G', 'C', 'C', 'D', 'D', 'G', 'G'],
           mel: 'D5:1 G5:1 B5:2 G5:1 B5:1 D6:2 | B5:1 A5:1 G5:2 D5:4 | E5:1 G5:1 C6:2 B5:1 A5:1 G5:2 | E5:2 G5:2 C5:4 | F#5:1 A5:1 D6:2 C6:1 A5:1 F#5:2 | A5:1 G5:1 F#5:1 E5:1 D5:4 | G5:2 B5:1 G5:1 D5:2 B4:2 | G5:4 G4:4' },
      B: { ch: ['Em', 'Em', 'C', 'D', 'G', 'D', 'C', 'G'],
           mel: 'B5:2 G5:1 E5:1 B4:2 E5:2 | G5:1 F#5:1 E5:1 F#5:1 G5:4 | C6:2 G5:1 E5:1 C5:2 E5:2 | D5:1 F#5:1 A5:2 D6:4 | B5:1 D6:1 B5:1 G5:1 D5:2 G5:2 | A5:1 F#5:1 D5:2 F#5:1 A5:1 D6:2 | C6:1 B5:1 A5:1 G5:1 E5:2 C5:2 | G5:4 r:4' },
    }, ['A', 'B', 'A*', 'B'], cumbiaBass),
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  EL CAPÍTULO
  // ═══════════════════════════════════════════════════════════════════════════
  const lv = buildLevel(LEVEL4);
  lv.liquids[0].pal = RIO_PAL; lv.liquids[1].pal = NEGRA_PAL; lv.liquids[2].pal = RIO_PAL;
  CHAPTERS.push({
    num: 4, title: 'LA AMAZONÍA', short: 'LA AMAZONÍA', color: '#3f8a46',
    goal: '¡LLEGA A TU PRIMERA CLASE DE LA UNIVERSIDAD!', goalShort: '¡A LA UNIVERSIDAD!',
    banner: ['LA AMAZONÍA', '¡TU PRIMERA CLASE ES A LAS 8:00!'],
    dayStart: 6 * 60 + 45,   // sale más tarde que en el Cap. 3: el día pide más prisa
    deathTitle: '¡ATATAY, ÑAÑO!',
    deathMsgs: {
      motocarro: '¡TE CHAPÓ EL MOTOCARRO, ÑAÑO!',
      get water() { const x = Game.player ? Game.player.cx / TILE : 0; return x < RIO ? '¡TE CAÍSTE AL ITAYA!' : x > AN ? '¡TE TRAGÓ LA COCHA!' : '¡AL AGUA, ÑAÑO!'; },
      palizada: '¡TE VOLTEASTE EN LA PALIZADA!',
      tronco: '¡TE CHOCÓ EL TRONCO!',
      huangana: '¡TE PASÓ ENCIMA LA MANADA!',
      anaconda: '¡LA ANACONDA TE DIO UN SUSTO!',
      fall: '¡TE FUISTE PARA ABAJO!',
      default: '¡PUCHA, ÑAÑO!',
    },
    tips: ['MOTOCARRO: SÁLTALO O REBOTA EN SU TOLDO.', 'CASAS FLOTANTES: SALTA CUANDO SE ACERQUEN.', 'PEQUE-PEQUE: SALTA PALIZADAS, TRONCOS Y REDES.', 'HUANGANAS: SÚBETE A UNA ALETA. PAICHE: PISA SU LOMO.'],
    win: {
      title: '¡LLEGASTE A TU CLASE!',
      onTime: ['¡ANTES DE LAS 8:00!', '¡ANTES DE LAS 8:00! ¡BIENVENIDO, CACHIMBO!'],
      late: ['LLEGASTE TARDE...', 'LLEGASTE TARDE... TU TARICAYA SE FUE SOLITA'],
      allPages: ['¡MATRÍCULA COMPLETA!', '¡MATRÍCULA COMPLETA! YA ERES UNIVERSITARIO'],
      drawCast(ctx, cx, tick) {
        const k = (tick % 100) / 100;
        if (k < 0.7) { ctx.save(); ctx.translate(cx - 60 + k * 30, 92 - Math.sin(k / 0.7 * Math.PI) * 18); ctx.rotate(-Math.cos(k / 0.7 * Math.PI) * 0.7); ctx.drawImage(A4.BUFEO, -16, -7); ctx.restore(); }
        ctx.drawImage(P.run[Math.floor(tick / 7) % 4], cx - 8, 76);
        ctx.save(); ctx.translate(cx + 36, 88); ctx.scale(2, 2); ctx.drawImage(A4.TARICAYA, 0, Math.floor(tick / 10) % 2); ctx.restore();
      },
      rows: (g, narrow, arrival) => [
        [narrow ? 'MATRÍCULA' : 'HOJAS DE MATRÍCULA', g.pages + ' / 3', '#ffffff'],
        arrival,
        [narrow ? 'BUFEOS' : 'BUFEOS QUE VISTE', '' + (g.bufeos4 || 0), '#f6a6c0'],
        ['CAÍDAS', '' + g.deaths, '#f2917d'],
      ],
    },
    onStart: (g) => { g.bufeos4 = 0; g.motos4 = 0; },   // delfines vistos y motocarros en que rebotaste
    ending: CAP4.ending,   // al ganar: la taricaya llega al río, el recuerdo de los 4 capítulos y los créditos
    level: lv,
  });
})();
