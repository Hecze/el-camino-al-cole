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
    liquids.push({ x: l[0], y: l[1], w: l[2], h: l[3], kind: l[4], flow: l[5] || 1 });
    for (let y = l[1]; y < l[1] + l[3]; y++)
      for (let x = l[0]; x < l[0] + l[2]; x++)
        put(x, y, (y === l[1] ? l[4] + 'Top' : l[4] + 'Body'));
  }
  return Object.assign({}, def, { grid, cols, rows, liquids, tile: (x, y) => (x >= 0 && x < cols && y >= 0 && y < rows ? grid[y][x] : null) });
}

// ─────────────────────────────────────────────────────────────────────────────
//  EL CAMINO AL COLE — un solo nivel, de izquierda a derecha.
//
//   x 0–96    EL VALLE   · montado en la llama: pircas, arroyos y un derrumbe
//   x 86–134  EL APU     · la cabra salta sola; tú la guías sobre el vacío
//   x 135–204 EL HUAICO  · salta de tronco en tronco contra la corriente
//   x 205–    EL COLEGIO
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL = {
  name: 'EL CAMINO AL COLE', w: 240, h: 40,
  sky: ['#4f86c6', '#9cc8e8', '#f6dcb0'],
  anchorRow: 34,
  bgLayers: [
    { kind: 'mountains', color: '#8c93c9', color2: '#6d72a6', y: 30.6, parallax: 0.08, vpar: 0.10, amp: 8.5, seed: 5, snow: true },
    { kind: 'mountains', color: '#8a6fa6', color2: '#6a5486', y: 32.2, parallax: 0.18, vpar: 0.24, amp: 6, seed: 7 },
    { kind: 'mountains', color: '#7d9a62', color2: '#5f7e4c', y: 33.4, parallax: 0.32, vpar: 0.40, amp: 3.8, seed: 21 },
    { kind: 'hills', color: '#a8a356', color2: '#7f8a44', y: 34.4, parallax: 0.52, vpar: 0.62, amp: 2.2, seed: 3 },
    { kind: 'clouds', color: '#fff6e6', parallax: 0.06, count: 9, seed: 11 },
  ],
  spawn: { x: 3, y: 34 },
  goatEnd: 117,
  zones: [
    { x: 0,   name: 'EL VALLE',  music: 'valle' },
    { x: 86,  name: 'EL APU',    music: 'apu' },
    { x: 120, name: 'LA CUMBRE', music: 'apu' },
    { x: 140, name: 'EL HUAICO', music: 'huayco' },
    { x: 205, name: 'EL COLEGIO', music: 'huayco' },
  ],
  rects: [
    // ── EL VALLE ──
    [0, 34, 22, 6, 'grass'],
    [15, 33, 1, 1, 'pirca'],
    [25, 34, 13, 6, 'grass'],
    [31, 32, 1, 2, 'pirca'],
    [38, 32, 18, 8, 'grass'],
    [46, 31, 1, 1, 'pirca'], [47, 30, 1, 2, 'pirca'],
    [61, 34, 36, 6, 'grass'],
    // ── EL APU: la cumbre y la bajada al huaico ──
    [115, 11, 20, 1, 'snow'], [115, 12, 20, 28, 'stone'],
    [135, 15, 4, 25, 'stone'], [139, 19, 4, 21, 'stone'], [143, 23, 4, 17, 'stone'], [147, 27, 4, 13, 'stone'],
    // ── EL COLEGIO ──
    [205, 20, 35, 20, 'grass'],
  ],
  backdrop: [[100, 12, 15, 28]],
  platforms: [
    // salientes del risco (una vía: la cabra las atraviesa desde abajo)
    [97, 31, 4, 'ledge'], [102, 28, 3, 'ledge'], [99, 25, 3, 'ledge'], [104, 22, 4, 'ledge'],
    [109, 19, 3, 'ledge'], [106, 16, 3, 'ledge'], [111, 13, 3, 'ledge'],
    [93, 24, 2, 'ledge'], // atajo arriesgado con una hoja de tarea
  ],
  liquids: [
    [22, 34, 3, 6, 'water', 1],
    [56, 34, 5, 6, 'water', 1],
    [151, 28, 14, 12, 'mud', -1], [165, 26, 14, 14, 'mud', -1], [179, 24, 14, 16, 'mud', -1], [193, 22, 12, 18, 'mud', -1],
  ],
  entities: [
    { type: 'llama', x: 9, y: 34 },
    { type: 'cabra', x: 91, y: 34 },
    { type: 'apacheta', x: 39, y: 32 },
    { type: 'apacheta', x: 64, y: 34 },
    { type: 'apacheta', x: 88, y: 34 },
    { type: 'apacheta', x: 122, y: 11 },
    { type: 'apacheta', x: 148, y: 27 },
    { type: 'rockfall', x: 82, y: 21, interval: 130 },
    { type: 'huaico', x0: 151, x1: 205, interval: 76, speed: 0.85 },
    { type: 'school', x: 222, y: 20 },
    // las 3 hojas de tarea que se le volaron al niño, enganchadas en el camino
    { type: 'page', x: 47, y: 29 },   // sobre la pirca alta
    { type: 'page', x: 93, y: 23 },   // en la saliente escondida del risco
    { type: 'page', x: 139, y: 18 },  // en la bajada hacia el huaico
  ],
  decor: [
    ['sign', 1, 33], ['cantuta', 6, 33], ['ichu', 11, 33], ['ichu', 19, 33], ['maguey', 27, 33],
    ['cantuta', 35, 33], ['ichu', 41, 31], ['cantuta', 51, 31], ['ichu', 63, 33], ['maguey', 70, 33],
    ['ichu', 78, 33], ['cantuta', 85, 33], ['sign', 95, 33],
    ['ichu', 117, 10], ['ichu', 128, 10], ['sign', 133, 10],
    ['ichu', 149, 26], ['cantuta', 207, 19], ['ichu', 211, 19], ['maguey', 214, 19],
    ['cantuta', 232, 19], ['ichu', 236, 19],
  ],
};

const LEVELS = [buildLevel(LEVEL)];
