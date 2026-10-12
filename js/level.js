// level.js — definición de tiles y los 3 niveles diseñados a mano.
// Diseño con intención: nada de pozos al vacío; los huecos son ríos o grietas
// con contexto. Plataformas ancladas a la geografía. Música de 64 pasos.

const TILE_SPECS = {
  grass:  { solid: true, top: T.grass,  body: T.dirt },
  dirt:   { solid: true, body: T.dirt },
  stone:  { solid: true, top: T.stoneTop, body: T.stone },
  snow:   { solid: true, top: T.snowTop, body: T.snow },
  adobe:  { solid: true, top: T.adobe, body: T.adobe },
  brick:  { solid: true, body: T.brick },
  rock:   { solid: true, body: T.rock },
  plank:  { oneway: true, body: T.plank },
  bridge: { oneway: true, body: T.bridge },
  spike:  { hazard: true, body: T.spike },
  cactus: { solid: true, body: T.cactus },
  waterTop:  { liquid: 'water', body: T.waterTop[0], anim: T.waterTop },
  waterBody: { liquid: 'water', body: T.waterBody },
  mudTop:    { liquid: 'mud', body: T.mudTop[0], anim: T.mudTop },
  mudBody:   { liquid: 'mud', body: T.mudBody },
};
function tileSpec(code) { return code ? TILE_SPECS[code] : null; }
function isSolidCode(c) { const s = tileSpec(c); return !!(s && s.solid); }
function isOnewayCode(c) { const s = tileSpec(c); return !!(s && s.oneway); }
function isHazardCode(c) { const s = tileSpec(c); return !!(s && s.hazard); }
function liquidKind(c) { const s = tileSpec(c); return s && s.liquid ? s.liquid : null; }

// ── Canciones: 4 frases de 16 pasos (64) para que el loop no canse ──────────
const SONGS = {
  menu: {
    bpm: 104, vol: 0.20,
    bass: [
      ...['A2', null, null, null, 'E2', null, null, null, 'A2', null, 'E2', null, 'A2', null, null, null],
      ...['F2', null, null, null, 'C3', null, null, null, 'F2', null, 'C3', null, 'F2', null, null, null],
      ...['C3', null, null, null, 'G2', null, null, null, 'C3', null, 'G2', null, 'C3', null, null, null],
      ...['G2', null, null, null, 'D3', null, null, null, 'G2', null, 'D3', null, 'E3', null, 'G2', null],
    ],
    lead: [
      ...['A4', null, 'C5', null, 'E5', null, 'D5', null, 'C5', null, 'A4', null, 'G4', null, 'E4', null],
      ...['F4', null, 'A4', null, 'C5', null, 'A4', null, 'G4', null, 'F4', null, 'C4', null, 'D4', null],
      ...['C5', null, 'E5', null, 'G5', null, 'E5', null, 'D5', null, 'C5', null, 'G4', null, 'A4', null],
      ...['G4', null, 'B4', null, 'D5', null, 'B4', null, 'A4', null, 'G4', null, 'E4', null, 'A4', null],
    ],
    pad: ['A3', null, null, null, 'F3', null, null, null, 'C4', null, null, null, 'G3', null, null, null],
  },
  valle: {
    bpm: 138, vol: 0.24,
    bass: [
      ...['A2','A2',null,'E2', 'A2',null,'E2',null, 'A2','A2',null,'E2', 'A2',null,'C3',null],
      ...['F2','F2',null,'C3', 'F2',null,'C3',null, 'F2','F2',null,'C3', 'F2',null,'A2',null],
      ...['C3','C3',null,'G2', 'C3',null,'G2',null, 'C3','C3',null,'G2', 'C3',null,'E3',null],
      ...['G2','G2',null,'D3', 'G2',null,'D3',null, 'G2','G2',null,'D3', 'E3',null,'G2',null],
    ],
    lead: [
      ...['A4','C5','D5','E5', 'G5','E5','D5','C5', 'D5','E5','G5','A5', 'G5','E5','D5',null],
      ...['C5','E5','G5','A5', 'G5','E5','D5','C5', 'A4','C5','D5','E5', 'D5','C5','A4',null],
      ...['F5','E5','D5','C5', 'A4','C5','D5','E5', 'G5','A5','C6','A5', 'G5','E5','D5',null],
      ...['E5','G5','A5','G5', 'E5','D5','C5','D5', 'E5','G5','A5','B5', 'A5','G5','E5',null],
    ],
    pad: ['A3', null, null, null, 'F3', null, null, null, 'C4', null, null, null, 'G3', null, null, null],
    perc: true,
  },
  apu: {
    bpm: 100, vol: 0.22,
    bass: [
      ...['D2', null, null, null, 'A2', null, null, null, 'D2', null, null, 'A2', 'D2', null, null, null],
      ...['Bb2', null, null, null, 'F2', null, null, null, 'Bb2', null, null, 'F2', 'Bb2', null, null, null],
      ...['F2', null, null, null, 'C3', null, null, null, 'F2', null, null, 'C3', 'F2', null, null, null],
      ...['G2', null, null, null, 'D3', null, null, null, 'A2', null, null, null, 'C3', null, 'D3', null],
    ],
    lead: [
      ...['D5', null, 'F5', null, 'A5', null, 'G5', null, 'F5', null, 'D5', null, 'C5', null, 'A4', null],
      ...['Bb4', null, 'D5', null, 'F5', null, 'D5', null, 'C5', null, 'Bb4', null, 'F4', null, 'G4', null],
      ...['F5', null, 'A5', null, 'C6', null, 'A5', null, 'G5', null, 'F5', null, 'C5', null, 'D5', null],
      ...['G5', null, 'A5', null, 'C6', null, 'A5', null, 'G5', null, 'F5', null, 'D5', null, 'D5', null],
    ],
    pad: ['D3', null, null, null, 'Bb3', null, null, null, 'F3', null, null, null, 'G3', null, null, null],
  },
  huayco: {
    bpm: 152, vol: 0.26,
    bass: [
      ...['E2','E2','E2',null, 'E2','G2','E2',null, 'E2','E2','E2',null, 'E2','G2','B2',null],
      ...['D2','D2','D2',null, 'D2','F2','D2',null, 'D2','D2','D2',null, 'D2','F2','A2',null],
      ...['C2','C2','C2',null, 'C2','E2','C2',null, 'C2','C2','C2',null, 'C2','E2','G2',null],
      ...['B2','B2','D3',null, 'E3','E3','G3',null, 'A2','A2','C3',null, 'B2','D3','E3',null],
    ],
    lead: [
      ...['E5','G5','A5','G5', 'E5','D5','E5',null, 'E5','G5','A5','B5', 'A5','G5','E5',null],
      ...['D5','F5','G5','F5', 'D5','C5','D5',null, 'D5','F5','G5','A5', 'G5','F5','D5',null],
      ...['C5','E5','G5','E5', 'A5','G5','E5','D5', 'C5','E5','G5','A5', 'C6','A5','G5',null],
      ...['B5','A5','G5','E5', 'G5','A5','B5','D6', 'A5','G5','E5','D5', 'B4','D5','E5',null],
    ],
    pad: ['E3', null, null, null, 'D3', null, null, null, 'C3', null, null, null, 'B2', null, null, null],
    perc: true,
  },
};

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
    const liquid = { x: l[0], y: l[1], w: l[2], h: l[3], kind: l[4] };
    liquids.push(liquid);
    for (let y = l[1]; y < l[1] + l[3]; y++)
      for (let x = l[0]; x < l[0] + l[2]; x++)
        put(x, y, (y === l[1] ? l[4] + 'Top' : l[4] + 'Body'));
  }
  return Object.assign({}, def, { grid, cols, rows, liquids, tile: (x, y) => (x >= 0 && x < cols && y >= 0 && y < rows ? grid[y][x] : null) });
}

function lineCoins(x, y, n) { const a = []; for (let i = 0; i < n; i++) a.push({ type: 'coin', x: x + i, y }); return a; }
function arc(x, y, n, h) { const a = []; n = n || 4; h = h || 4; for (let i = 0; i < n; i++) a.push({ type: 'coin', x: x + i, y: y - Math.round(Math.sin((i + 0.5) / n * Math.PI) * (h - 1)) }); return a; }

// ─────────────────────────────────────────────────────────────────────────────
// NIVEL 1 — EL VALLE: campos en terraza y dos ríos que cruzar.
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL1 = {
  name: 'EL VALLE', subtitle: 'Camino a la escuela', w: 200, h: 20,
  music: 'valle',
  sky: ['#f6b06a', '#ffcf87', '#ffe6b0'],
  bgLayers: [
    { kind: 'mountains', color: '#8a6fb0', color2: '#6a5490', y: 13, parallax: 0.13, amp: 6, seed: 7 },
    { kind: 'mountains', color: '#6f9a6a', color2: '#568050', y: 14.2, parallax: 0.30, amp: 4, seed: 21 },
    { kind: 'hills', color: '#4f9a4a', color2: '#3d7f3c', y: 15.2, parallax: 0.52, amp: 2.6, seed: 3 },
    { kind: 'clouds', color: '#fff3dd', y: 2, parallax: 0.08, count: 9, seed: 11 },
  ],
  spawn: { x: 3, y: 16 },
  goal: { type: 'goal', x: 194, y: 16, name: 'META' },
  rects: [
    [0, 16, 30, 4, 'grass'],
    [30, 15, 2, 1, 'grass'], [32, 14, 2, 2, 'grass'], [34, 13, 2, 3, 'grass'],
    [36, 13, 8, 7, 'grass'],
    [44, 15, 2, 1, 'grass'], [46, 16, 10, 4, 'grass'],
    // rio 1 (56..70)
    [58, 15, 2, 1, 'stone'], [63, 14, 2, 1, 'stone'], [68, 15, 2, 1, 'stone'],
    [71, 16, 29, 4, 'grass'],
    [80, 13, 3, 1, 'stone'], [88, 11, 3, 1, 'stone'],
    [100, 15, 2, 1, 'grass'], [102, 14, 2, 2, 'grass'], [104, 13, 8, 7, 'grass'],
    [112, 14, 2, 2, 'grass'], [114, 15, 2, 1, 'grass'], [116, 16, 4, 4, 'grass'],
    // rio 2 (120..137)
    [138, 16, 30, 4, 'grass'],
    [168, 16, 32, 4, 'grass'],
  ],
  platforms: [
    [120, 14, 4, 'plank'], [125, 13, 4, 'plank'], [130, 14, 4, 'plank'], [134, 13, 4, 'plank'],
  ],
  liquids: [ [56, 16, 15, 4, 'water'], [120, 16, 18, 4, 'water'] ],
  entities: [
    { type: 'cuy', x: 14, y: 16, dir: -1 },
    { type: 'cuy', x: 22, y: 16, dir: 1 },
    { type: 'cuy', x: 40, y: 13, dir: -1 },
    { type: 'cuy', x: 50, y: 16, dir: 1 },
    { type: 'cuy', x: 78, y: 16, dir: -1 },
    { type: 'cuy', x: 90, y: 16, dir: 1 },
    { type: 'cuy', x: 108, y: 13, dir: -1 },
    { type: 'cuy', x: 150, y: 16, dir: 1 },
    { type: 'cuy', x: 160, y: 16, dir: -1 },
    { type: 'condor', x: 66, y: 8, span: 4 },
    { type: 'condor', x: 130, y: 8, span: 5 },
    { type: 'checkpoint', x: 72, y: 16 },
    { type: 'checkpoint', x: 140, y: 16 },
    { type: 'heart', x: 82, y: 12 },
    { type: 'gem', x: 122, y: 13 },
    { type: 'gem', x: 88, y: 10 },
    ...arc(58, 13, 5, 5), ...arc(122, 13, 6, 5),
    ...lineCoins(6, 15, 5), ...lineCoins(74, 15, 5), ...lineCoins(170, 15, 6),
  ],
  decor: [
    ['sign', 5, 15], ['flower', 12, 15], ['tuft', 20, 15], ['tuft', 33, 14],
    ['flower', 41, 12], ['tuft', 52, 15], ['rock', 76, 15], ['tuft', 92, 15],
    ['flower', 116, 15], ['tuft', 130, 15], ['cactus', 150, 15], ['tuft', 164, 15],
    ['sign', 188, 15],
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// NIVEL 2 — EL APU: ascenso por risco, grieta de hielo con llama, y cabra
// auto-saltarina por los pilares hasta la cima.
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL2 = {
  name: 'EL APU', subtitle: 'La montaña de los cóndores', w: 180, h: 50,
  music: 'apu',
  sky: ['#6db6e0', '#a9d8ef', '#e6f3fb'],
  bgLayers: [
    { kind: 'mountains', color: '#6f86c4', color2: '#55689e', y: 40, parallax: 0.12, amp: 7, seed: 5, snow: true },
    { kind: 'mountains', color: '#8aa0d6', color2: '#6f86b8', y: 41.5, parallax: 0.26, amp: 5, seed: 19, snow: true },
    { kind: 'hills', color: '#9fb6d8', color2: '#86a0c2', y: 42.8, parallax: 0.46, amp: 2.6, seed: 9 },
    { kind: 'clouds', color: '#ffffff', y: 3, parallax: 0.07, count: 10, seed: 4 },
  ],
  spawn: { x: 3, y: 46 },
  goal: { type: 'goal', x: 166, y: 18, name: 'LA CIMA' },
  rects: [
    [0, 46, 22, 4, 'stone'],
    [22, 43, 8, 7, 'stone'],
    [32, 40, 8, 10, 'stone'],
    [42, 37, 8, 13, 'stone'],
    [52, 34, 10, 16, 'stone'],
    [64, 31, 3, 1, 'stone'], [70, 28, 3, 1, 'stone'], [64, 25, 3, 1, 'stone'], [70, 22, 3, 1, 'stone'],
    [76, 30, 6, 20, 'stone'],
    // grieta de hielo (82..95) con pilares de hielo
    [84, 30, 2, 2, 'snow'], [89, 29, 2, 2, 'snow'], [94, 30, 2, 2, 'snow'],
    [96, 35, 6, 15, 'stone'],
    // pilares para la cabra
    [100, 34, 4, 16, 'stone'], [107, 32, 4, 18, 'stone'], [114, 30, 4, 20, 'stone'],
    [121, 28, 4, 22, 'stone'], [128, 26, 4, 24, 'stone'], [135, 24, 4, 26, 'stone'],
    [142, 22, 4, 28, 'stone'], [149, 20, 4, 30, 'stone'],
    [156, 18, 24, 2, 'snow'],
  ],
  platforms: [
    [26, 38, 4, 'plank'], [44, 31, 4, 'plank'], [58, 30, 4, 'plank'],
  ],
  liquids: [],
  wind: [
    { x: 30, y: 30, w: 8, h: 12, ax: 0.05, ay: -0.02 },
    { x: 120, y: 12, w: 10, h: 10, ax: -0.04, ay: 0 },
  ],
  entities: [
    { type: 'condor', x: 30, y: 33, span: 4 },
    { type: 'condor', x: 50, y: 28, span: 4 },
    { type: 'condor', x: 92, y: 24, span: 4 },
    { type: 'condor', x: 130, y: 16, span: 3 },
    { type: 'llama', x: 78, y: 30 },
    { type: 'cabra', x: 98, y: 35 },
    { type: 'checkpoint', x: 46, y: 37 },
    { type: 'checkpoint', x: 78, y: 30 },
    { type: 'checkpoint', x: 98, y: 35 },
    { type: 'heart', x: 66, y: 24 },
    { type: 'gem', x: 90, y: 27 },
    { type: 'gem', x: 60, y: 29 },
    { type: 'spikeRow', x: 52, y: 33, n: 5 },
    ...arc(44, 30, 4, 5), ...arc(100, 33, 4, 5),
    ...lineCoins(24, 42, 4), ...lineCoins(158, 16, 5),
    ...[ [104,33],[105,33],[110,31],[124,25] ].map(p => ({ type: 'coin', x: p[0], y: p[1] })),
  ],
  decor: [
    ['rock', 20, 45], ['rock', 74, 29], ['sign', 6, 45], ['tuft', 46, 36],
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// NIVEL 3 — EL HUAYCO: ríos revueltos y la corriente de lodo.
// ─────────────────────────────────────────────────────────────────────────────
const LEVEL3 = {
  name: 'EL HUAYCO', subtitle: 'Surcar la corriente', w: 190, h: 26,
  music: 'huayco',
  sky: ['#5b6b7a', '#93a29a', '#d9c9a0'],
  bgLayers: [
    { kind: 'mountains', color: '#5a5568', color2: '#433f52', y: 18.5, parallax: 0.13, amp: 6, seed: 13, snow: true },
    { kind: 'mountains', color: '#6d5a52', color2: '#544139', y: 20, parallax: 0.28, amp: 4.5, seed: 27 },
    { kind: 'hills', color: '#5c6b4f', color2: '#48573d', y: 21.2, parallax: 0.48, amp: 2.4, seed: 6 },
    { kind: 'clouds', color: '#c9c4b4', y: 2, parallax: 0.06, count: 8, seed: 15 },
  ],
  spawn: { x: 3, y: 22 },
  goal: { type: 'school', x: 182, y: 12, name: 'EL COLEGIO' },
  rects: [
    [0, 22, 24, 4, 'grass'],
    [26, 21, 2, 1, 'stone'], [30, 20, 2, 1, 'stone'], [34, 21, 2, 1, 'stone'], [38, 20, 2, 1, 'stone'],
    [44, 22, 16, 4, 'grass'],
    [76, 22, 8, 4, 'grass'],
    // canal del huayco
    [84, 23, 14, 3, 'stone'], [98, 21, 14, 5, 'stone'],
    [112, 19, 14, 7, 'stone'], [126, 16, 14, 10, 'stone'], [140, 13, 10, 13, 'stone'],
    [150, 12, 40, 14, 'grass'],
  ],
  platforms: [
    [60, 19, 4, 'plank'], [66, 18, 4, 'plank'], [72, 19, 4, 'plank'],
    [160, 14, 4, 'plank'], [168, 13, 5, 'plank'],
  ],
  liquids: [
    [24, 22, 20, 4, 'water'],
    [60, 22, 16, 4, 'water'],
    [84, 23, 14, 3, 'mud'], [98, 21, 14, 3, 'mud'],
    [112, 19, 14, 3, 'mud'], [126, 16, 14, 4, 'mud'], [140, 13, 10, 6, 'mud'],
  ],
  huayco: { x0: 84, x1: 150 },
  entities: [
    { type: 'cuy', x: 12, y: 22, dir: 1 },
    { type: 'cuy', x: 50, y: 22, dir: -1 },
    { type: 'cuy', x: 80, y: 22, dir: 1 },
    { type: 'condor', x: 40, y: 15, span: 4 },
    { type: 'condor', x: 80, y: 14, span: 4 },
    { type: 'checkpoint', x: 46, y: 22 },
    { type: 'checkpoint', x: 80, y: 22 },
    { type: 'heart', x: 66, y: 16 },
    { type: 'gem', x: 61, y: 16 },
    { type: 'surfRock', path: [[86, 22], [100, 20], [114, 18], [128, 15], [142, 12]], speed: 0.018 },
    { type: 'surfRock', path: [[100, 20], [114, 18], [128, 15], [142, 12]], speed: 0.023 },
    { type: 'surfRock', path: [[114, 18], [128, 15], [142, 12]], speed: 0.028 },
    { type: 'surfRock', path: [[90, 22], [90, 16]], speed: 0.030, vertical: true },
    { type: 'surfRock', path: [[120, 18], [120, 13]], speed: 0.026, vertical: true },
    ...lineCoins(100, 14, 5), ...lineCoins(152, 10, 5),
    ...[ [88,19],[92,16],[104,13],[118,9],[132,6],[146,9] ].map(p => ({ type: 'coin', x: p[0], y: p[1] })),
    ...arc(64, 15, 4, 5),
  ],
  decor: [
    ['sign', 5, 21], ['tuft', 16, 21], ['rock', 48, 21], ['flower', 78, 21],
    ['rock', 152, 11], ['sign', 176, 11], ['tuft', 168, 11],
  ],
};

const LEVELS = [ buildLevel(LEVEL1), buildLevel(LEVEL2), buildLevel(LEVEL3) ];
