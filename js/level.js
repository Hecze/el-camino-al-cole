// level.js — tiles, canciones y EL nivel: un solo camino al colegio con tres
// tramos encadenados: la llama por el valle, la cabra por el risco del Apu y el
// huaico de lodo. Al final, el colegio.

const TILE_SPECS = {
  grass:     { solid: true, top: T.grass, body: T.dirt },
  dirt:      { solid: true, body: T.dirt },
  stone:     { solid: true, top: T.stoneTop, body: T.stone },
  snow:      { solid: true, top: T.snowTop, body: T.stone },
  pirca:     { solid: true, body: T.pirca },
  ledge:     { oneway: true, body: T.ledge },
  ledgeSnow: { oneway: true, body: T.ledgeSnow },
  summit:    { oneway: true, body: T.snowTop },   // cumbre: se atraviesa desde abajo
  clay:      { solid: true, top: T.clay, body: T.clayBody },
  mudRock:   { solid: true, body: T.mudRock },
  waterTop:  { liquid: 'water' }, waterBody: { liquid: 'water' },
  mudTop:    { liquid: 'mud' },   mudBody:   { liquid: 'mud' },
};
function tileSpec(code) { return code ? TILE_SPECS[code] : null; }
function isSolidCode(c) { const s = tileSpec(c); return !!(s && s.solid); }
function isOnewayCode(c) { const s = tileSpec(c); return !!(s && s.oneway); }
function isHazardCode(c) { const s = tileSpec(c); return !!(s && s.hazard); }
function liquidKind(c) { const s = tileSpec(c); return s && s.liquid ? s.liquid : null; }
// líquido en un punto del mundo; la superficie visible está 4px bajo el borde del tile
function liquidAt(level, px, py) {
  const code = level.tile(Math.floor(px / TILE), Math.floor(py / TILE));
  const k = liquidKind(code);
  if (!k) return null;
  if (code.endsWith('Top') && (py - Math.floor(py / TILE) * TILE) < 4) return null;
  return k;
}

// ── Canciones (huayno andino). Compás de 2/4 = 8 semicorcheas. ──────────────
const BASS_OF = { Am: ['A2', 'E2'], G: ['G2', 'D2'], F: ['F2', 'C3'], C: ['C3', 'G2'], Em: ['E2', 'B2'], Dm: ['D2', 'A2'], D: ['D2', 'A2'], E: ['E2', 'B2'], Bb: ['Bb2', 'F2'] };
// bajo de huayno: fundamental con anticipación + quinta
function huaynoBass(chords) { return chords.map(c => { const [r, f] = BASS_OF[c]; return `${r}:3 ${r}:1 ${f}:4`; }).join(' '); }
function slowBass(chords) { return chords.map(c => `${BASS_OF[c][0]}:8`).join(' '); }

const SONGS = {
  // yaraví: lento y melancólico, para el menú
  menu: {
    bpm: 92, vol: 0.26, strum: 'D...D.U.', drums: 'B.......',
    chords: ['Am', 'Am', 'F', 'Am', 'C', 'G', 'Em', 'Am'],
    lead: 'A4:4 C5:2 D5:2 | E5:6 D5:2 | C5:4 D5:2 C5:2 | A4:8 | G4:4 A4:2 C5:2 | D5:6 E5:2 | D5:2 C5:2 A4:2 G4:2 | A4:8',
  },
  // huayno alegre del valle
  valle: {
    bpm: 128, vol: 0.28, strum: 'D.DU.DU.', drums: 'B..bB.b.', shaker: true,
    chords: ['Am', 'G', 'F', 'Am', 'Am', 'G', 'C', 'Am', 'Am', 'C', 'G', 'Em', 'Am', 'C', 'Dm', 'Am'],
    lead: 'E5:3 E5:1 D5:2 C5:2 | D5:3 E5:1 G5:2 E5:2 | D5:3 C5:1 A4:2 C5:2 | D5:2 C5:1 A4:1 A4:4 |' +
          'E5:3 E5:1 D5:2 C5:2 | D5:3 E5:1 G5:2 A5:2 | G5:3 E5:1 D5:2 C5:2 | A4:2 C5:1 A4:1 A4:4 |' +
          'A5:3 A5:1 G5:2 E5:2 | G5:3 A5:1 C6:2 A5:2 | G5:3 E5:1 D5:2 E5:2 | G5:2 E5:1 D5:1 E5:4 |' +
          'A5:3 A5:1 G5:2 E5:2 | G5:3 A5:1 G5:2 E5:2 | D5:3 C5:1 A4:2 C5:2 | D5:2 C5:1 A4:1 A4:4',
  },
  // el Apu: solemne, quena con segunda voz
  apu: {
    bpm: 104, vol: 0.28, strum: 'D..D..U.', drums: 'B...B...',
    chords: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'F', 'C', 'Dm'],
    lead: 'D5:4 F5:2 G5:2 | A5:6 G5:2 | F5:3 G5:1 F5:2 D5:2 | C5:8 | D5:4 F5:2 A5:2 | C6:6 A5:2 | G5:3 A5:1 G5:2 E5:2 | D5:8',
    lead2: 'A4:8 | F4:8 | D4:8 | E4:8 | F4:8 | A4:8 | G4:8 | F4:8',
  },
  // carnavalito del huaico: rápido y urgente
  huayco: {
    bpm: 152, vol: 0.28, strum: 'DUDUDUDU', drums: 'B.bBB.b.', shaker: true,
    chords: ['Em', 'D', 'G', 'Em', 'C', 'Em', 'G', 'Em'],
    lead: 'E5:2 E5:1 E5:1 G5:2 E5:2 | D5:2 D5:1 D5:1 E5:2 D5:2 | B4:2 B4:1 B4:1 D5:2 B4:2 | A4:2 B4:2 E5:4 |' +
          'G5:2 G5:1 G5:1 A5:2 G5:2 | E5:2 E5:1 G5:1 E5:2 D5:2 | B4:2 D5:1 B4:1 A4:2 G4:2 | A4:2 B4:2 E5:4',
  },
};
SONGS.menu.bass = slowBass(SONGS.menu.chords);
SONGS.valle.bass = huaynoBass(SONGS.valle.chords);
SONGS.apu.bass = slowBass(SONGS.apu.chords);
SONGS.huayco.bass = huaynoBass(SONGS.huayco.chords);

function buildLevel(def) {
  const rows = def.h, cols = def.w;
  const grid = [];
  for (let y = 0; y < rows; y++) grid.push(new Array(cols).fill(null));
  const put = (x, y, c) => { if (x >= 0 && x < cols && y >= 0 && y < rows) grid[y][x] = c; };
  for (const r of def.rects || [])
    for (let y = r[1]; y < r[1] + r[3]; y++)
      for (let x = r[0]; x < r[0] + r[2]; x++) put(x, y, r[4]);
  for (const p of def.platforms || [])
    for (let x = p[0]; x < p[0] + p[2]; x++) put(x, p[1], p[3]);
  const liquids = [];
  for (const l of def.liquids || []) {
    liquids.push({ x: l[0], y: l[1], w: l[2], h: l[3], kind: l[4], flow: l[5] || 1, fallTop: l[6] || 0 });
    for (let y = l[1]; y < l[1] + l[3]; y++)
      for (let x = l[0]; x < l[0] + l[2]; x++)
        put(x, y, (y === l[1] ? l[4] + 'Top' : l[4] + 'Body'));
  }
  for (const r of def.fgRocks || [])
    for (let y = r[1]; y < r[1] + r[3]; y++)
      for (let x = r[0]; x < r[0] + r[2]; x++) put(x, y, 'mudRock');
  return Object.assign({}, def, { grid, cols, rows, liquids, tile: (x, y) => (x >= 0 && x < cols && y >= 0 && y < rows ? grid[y][x] : null) });
}

// ─────────────────────────────────────────────────────────────────────────────
//  EL CAMINO AL COLE — un solo nivel, de izquierda a derecha.
//
//   x 0–96     EL VALLE    · montado en la llama: pircas, cascadas y un derrumbe
//   x 82–156   EL APU      · una montaña gigante: la cabra salta sola, tú la
//                            guías. Subes por la cara oeste y bajas por la este.
//   x 145–221  EL HUAICO   · quebrada cálida: salta de tronco en tronco contra
//                            la corriente; abajo espera el precipicio.
//   x 222–     EL COLEGIO
// ─────────────────────────────────────────────────────────────────────────────
const G = 144;          // fila del suelo del valle
const SUMMIT = 18;      // fila de la cumbre

// Zigzag de salientes: desplazamientos respecto al centro del camino. Cada
// salto entre salientes consecutivas cubre como mucho 4 casillas en horizontal.
const ZIG = [0, 4, 1, -3, 1, 5, 2, -2, -5, -1, 3, -1, -4, 0, 4, 0];
function mountainPath() {
  const up = [];
  // subida (cara oeste): de la fila 141 a la 21, una saliente cada 4 filas.
  // El rebote de la cabra sube ~5,8 filas: llega con holgura a la siguiente
  // saliente pero no roza la de más arriba (nada de saltos de "1,9 salientes").
  const nUp = Math.round((G - 3 - (SUMMIT + 3)) / 4) + 1;
  for (let i = 0; i < nUp; i++) {
    const row = G - 3 - i * 4;
    const center = 103 + (i / (nUp - 1)) * 14;
    const x = Math.round(center + ZIG[i % ZIG.length] * 0.8);
    up.push([x - 1, row, i < 3 ? 4 : 3, row < 80 ? 'ledgeSnow' : 'ledge']);
  }
  return { up };
}
const MTN = mountainPath();
const mid = (l) => l[0] + l[2] / 2;
// cóndores que cruzan el risco a distintas alturas (cada vez más rápidos)
const BIRDS = [];
[124, 104, 84, 64, 46, 32].forEach((row, i) => {
  BIRDS.push({ type: 'condor', x0: 90, x1: 123, y: row - 1.5, speed: 1.4 + i * 0.12, phase: i * 0.7, dir: i % 2 ? -1 : 1 });
});
// pasto para la cabra: algo apartado del camino (cuesta ir a por él)
const HERBS = [];
MTN.up.forEach((l, i) => { if (i % 4 === 2) HERBS.push({ type: 'herb', x: mid(l) + (i % 8 === 2 ? 3 : -3), y: l[1] - 3 }); });
// puntos de control en la montaña (reapareces montado en la cabra)
const MTN_CP = [MTN.up[8], MTN.up[16], MTN.up[24]].map(l => ({ type: 'checkpoint', x: Math.floor(mid(l)), y: l[1] }));

// Silueta de la montaña calculada a partir del camino: cada saliente queda
// pegada a la roca (nada de salientes flotando en el aire).
function mountainShape(peakX, peakRow, rows) {
  const shape = [];
  for (let r = 0; r < rows; r++) {
    if (r < peakRow) { shape.push(null); continue; }
    const d = r - peakRow;
    let L = peakX - d * 0.24 - 1, R = peakX + d * 0.3 + 1;
    for (const l of MTN.up) if (Math.abs(l[1] - r) <= 6) L = Math.min(L, l[0] - 3);
    shape.push([L, R]);
  }
  // suavizar el borde izquierdo para que no tenga escalones bruscos
  for (let pass = 0; pass < 3; pass++)
    for (let r = peakRow + 1; r < rows - 1; r++) shape[r][0] = Math.min(shape[r][0], (shape[r - 1][0] + shape[r + 1][0]) / 2 + 0.5);
  return shape;
}
// águilas que acechan mientras bajas planeando: cada una vigila una franja de altura
const EAGLES = [[24, 58], [50, 84], [76, 106]].map((b, i) => ({ type: 'eagle', rowMin: b[0], rowMax: b[1], delay: 60 + i * 40 }));

const LEVEL = {
  name: 'EL CAMINO AL COLE', w: 262, h: 150,
  anchorRow: G,
  bgLayers: [
    { kind: 'mountains', color: '#8c93c9', color2: '#6d72a6', y: G - 3.4, parallax: 0.08, vpar: 0.10, amp: 8.5, seed: 5, snow: true },
    { kind: 'mountains', color: '#8a6fa6', color2: '#6a5486', y: G - 1.8, parallax: 0.18, vpar: 0.24, amp: 6, seed: 7 },
    { kind: 'mountains', color: '#7d9a62', color2: '#5f7e4c', y: G - 0.6, parallax: 0.32, vpar: 0.40, amp: 3.8, seed: 21 },
    { kind: 'hills', color: '#a8a356', color2: '#7f8a44', y: G + 0.4, parallax: 0.52, vpar: 0.62, amp: 2.2, seed: 3 },
    { kind: 'clouds', color: '#fff6e6', parallax: 0.06, count: 9, seed: 11 },
  ],
  spawn: { x: 6, y: G },
  // la gran montaña: silueta de fondo con nieve en lo alto
  mountain: { peakX: 121, peakRow: 10, snowRow: 78, shape: mountainShape(121, 10, 150) },
  // cerro del que baja el huaico (tierra cálida)
  hill: { peakX: 220, peakRow: 89, slopeL: 1.7, slopeR: 2.1 },
  goatEnd: 118, goatEndRow: SUMMIT,
  // al planear no puedes alejarte de la ladera este
  glide: { x0: 119, x1: 164 },
  altitude: { baseRow: G, baseM: 3650, perRow: 13 },
  zones: [
    { x: 0,   name: 'EL VALLE',  music: 'valle' },
    { x: 86,  name: 'EL APU',    music: 'apu', alt: true },
    { x: 145, name: 'EL HUAICO', music: 'huayco' },
    { x: 222, name: 'EL COLEGIO', music: 'huayco' },
  ],
  rects: [
    // ── EL VALLE ──
    [0, G, 22, 6, 'grass'],
    [15, G - 1, 1, 1, 'pirca'],
    [25, G, 13, 6, 'grass'],
    [31, G - 2, 1, 2, 'pirca'],
    [38, G - 2, 18, 8, 'grass'],
    [46, G - 3, 1, 1, 'pirca'], [47, G - 4, 1, 2, 'pirca'],
    [61, G, 40, 6, 'grass'],
    // ── LA CUMBRE ──
    [116, SUMMIT, 9, 1, 'summit'],
    // ── LA QUEBRADA CÁLIDA: orilla, lecho del huaico y el colegio ──
    [145, 110, 12, 40, 'clay'],
    [160, 114, 16, 36, 'clay'], [176, 112, 16, 38, 'clay'], [192, 110, 16, 40, 'clay'], [208, 108, 14, 42, 'clay'],
    [222, 103, 40, 47, 'clay'],
  ],
  platforms: [...MTN.up],
  liquids: [
    // arroyos que bajan del cerro: caen en cascada a una quebrada estrecha
    [22, G, 3, 6, 'water', 1, G - 7],
    [56, G, 5, 6, 'water', 1, G - 9],
    // el huaico: cuatro escalones de lodo que bajan hacia el precipicio (x 157–159)
    [160, 111, 16, 3, 'mud', -1], [176, 109, 16, 3, 'mud', -1], [192, 107, 16, 3, 'mud', -1], [208, 105, 14, 3, 'mud', -1],
  ],
  // rocas fijas en cada escalón del huaico (para subir sin caerte)
  // la primera (x 161) sirve para entrar al huaico desde la orilla sin depender del tronco justo
  fgRocks: [[161, 111, 2, 3], [174, 109, 2, 5], [190, 107, 2, 5], [206, 105, 2, 5]],
  entities: [
    // la casa del niño, con mamá en la puerta
    { type: 'house', x: 0, y: G },
    { type: 'llama', x: 10, y: G },
    { type: 'cabra', x: 91, y: G },
    // puntos de control invisibles
    { type: 'checkpoint', x: 39, y: G - 2 },
    { type: 'checkpoint', x: 64, y: G },
    { type: 'checkpoint', x: 88, y: G },
    ...MTN_CP,
    { type: 'checkpoint', x: 151, y: 110 },
    { type: 'rockfall', x: 82, y: G - 13, interval: 130 },
    { type: 'checkpoint', x: 121, y: SUMMIT },
    // en la cumbre crece un platanal: su hoja gigante sirve de parapente
    { type: 'leaf', x: 123, y: SUMMIT },
    ...EAGLES,
    { type: 'huaico', x0: 160, x1: 222, interval: 84, speed: 0.75, inflow: { x: 218, top: 92 } },
    // el colegio se cae a pedazos... la clase se da afuera, sentados en el suelo
    { type: 'school', x: 231, y: 103 },
    { type: 'outdoorClass', x: 243, y: 103 },
    ...BIRDS,
    ...HERBS,
    // las 3 hojas de tarea que se le volaron al niño, enganchadas en el camino
    { type: 'page', x: 47, y: G - 5 },                                            // sobre la pirca alta
    { type: 'page', x: MTN.up[19][0] - 5, y: MTN.up[19][1] - 6 },                 // en el aire, junto al risco
    { type: 'page', x: 154, y: 109 },                                             // en la orilla del huaico
  ],
  decor: [
    ['cantuta', 7, G - 1], ['ichu', 12, G - 1], ['ichu', 19, G - 1], ['maguey', 27, G - 1],
    ['cantuta', 35, G - 1], ['ichu', 41, G - 3], ['cantuta', 51, G - 3], ['ichu', 63, G - 1], ['maguey', 70, G - 1],
    ['ichu', 78, G - 1], ['cantuta', 85, G - 1],
    ['cactus', 146, 109], ['maguey', 149, 109],
    ['cactus', 225, 102], ['maguey', 229, 102], ['cantuta', 233, 102], ['cactus', 252, 102], ['maguey', 257, 102],
  ],
};

const LEVELS = [buildLevel(LEVEL)];
