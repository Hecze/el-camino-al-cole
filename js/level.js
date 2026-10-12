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
  jungle:    { solid: true, top: T.jungle, body: T.jungleBody },
  swampRock: { solid: true, top: T.mudRock, body: T.stone },   // piedra de río redondeada
  branch:    { oneway: true, body: T.branch },
  trunk:     { oneway: true, body: T.trunk },     // tronco caído flotando
  ropeBridge:{ oneway: true },                       // lo dibuja la entidad del puente
  swampTop:  { liquid: 'swamp' }, swampBody: { liquid: 'swamp' },
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

// ── Canciones. Compás de 2/4 = 8 semicorcheas. ─────────────────────────────
// Todos los instrumentos comparten la célula del huayno (golpes en 0, 3 y 4):
// bajo y bombo marcan "larga–corta–larga", el charango la rellena y las
// chajchas van en corcheas. Cada canción tiene varias partes con su propia
// armonía (la melodía cae en notas del acorde en los tiempos fuertes):
//   'X'  la quena toca la parte X, la zampoña sostiene notas largas debajo
//   'X*' diálogo: la quena pregunta 2 compases y la zampoña responde 2
//   'X~' respiro: la quena descansa y la zampoña canta notas largas
const BASS_OF = { Am: ['A2', 'E2'], G: ['G2', 'D2'], F: ['F2', 'C3'], C: ['C3', 'G2'], Em: ['E2', 'B2'], Dm: ['D2', 'A2'], D: ['D2', 'A2'], E: ['E2', 'B2'], Bb: ['Bb2', 'F2'] };
// bajo de huayno: fundamental con anticipación + quinta (golpes en 0, 3 y 4)
function huaynoBass(chords) { return chords.map(c => { const [r, f] = BASS_OF[c]; return `${r}:3 ${r}:1 ${f}:4`; }).join(' '); }
function slowBass(chords) { return chords.map(c => `${BASS_OF[c][0]}:4 ${BASS_OF[c][1]}:4`).join(' '); }
function cumbiaBass(chords) { return chords.map(c => { const [r, f] = BASS_OF[c]; return `${r}:3 ${f}:1 ${r}:2 ${f}:2`; }).join(' '); }
// zampoña grave (malta): una nota del acorde por debajo de la quena, con
// notas comunes entre acordes para que la voz se mueva poco
const SIKU = { Am: 'E4', G: 'D4', F: 'C4', C: 'E4', Em: 'E4', Dm: 'D4', D: 'D4', E: 'E4', Bb: 'D4' };
function makeSong(base, parts, form, bassFn) {
  const chords = [], lead = [], lead2 = [];
  for (const k0 of form) {
    const k = k0.replace(/[*~]/g, ''), P = parts[k];
    const bars = P.mel.split('|').map(x => x.trim());
    if (bars.length !== P.ch.length) throw new Error('parte ' + k + ': compases y acordes no coinciden');
    bars.forEach((b, i) => {
      chords.push(P.ch[i]);
      if (k0.endsWith('~')) { lead.push('r:8'); lead2.push(`${SIKU[P.ch[i]]}:6 r:2`); }
      else if (k0.endsWith('*') && i % 4 >= 2) { lead.push('r:8'); lead2.push(b); }
      else { lead.push(b); lead2.push(`${SIKU[P.ch[i]]}:6 r:2`); }
    });
  }
  return Object.assign({}, base, { chords, lead: lead.join(' '), lead2: lead2.join(' '), bass: bassFn(chords) });
}

const SONGS = {
  // yaraví: lento y melancólico, para el menú
  menu: makeSong({ bpm: 92, vol: 0.26, strum: 'D...D.U.', drums: 'B.......', orn: 0.3, lead2Vol: 0.1 }, {
    A: { ch: ['Am', 'Am', 'F', 'Am', 'C', 'G', 'Em', 'Am'],
         mel: 'A4:4 C5:2 E5:2 | E5:6 D5:2 | C5:4 A4:2 C5:2 | A4:8 | G4:4 C5:2 E5:2 | D5:6 B4:2 | B4:2 G4:2 E4:2 G4:2 | A4:8' },
  }, ['A', 'A~'], slowBass),

  // huayno alegre del valle
  valle: makeSong({ bpm: 128, vol: 0.28, strum: 'D.DUD.DU', drums: 'B..bB...', shaker: true, orn: 0.3, lead2Vol: 0.13 }, {
    A:  { ch: ['Am', 'G', 'Dm', 'Am', 'Am', 'G', 'C', 'Am'],
          mel: 'E5:3 E5:1 E5:1 D5:1 C5:2 | D5:3 E5:1 G5:2 E5:2 | D5:3 C5:1 A4:2 C5:2 | C5:2 E5:1 A4:1 A4:4 | E5:3 E5:1 E5:1 D5:1 C5:2 | D5:3 E5:1 G5:2 A5:2 | G5:3 E5:1 E5:1 D5:1 C5:2 | A4:2 C5:1 A4:1 A4:4' },
    A2: { ch: ['Am', 'G', 'Am', 'G', 'Am', 'C', 'Am', 'Am'],
          mel: 'E5:2 G5:2 E5:1 D5:1 C5:2 | D5:2 E5:1 G5:1 B4:2 G5:2 | E5:2 D5:1 C5:1 A4:2 C5:2 | D5:1 E5:1 D5:1 B4:1 G4:4 | E5:2 G5:2 A5:2 G5:2 | E5:3 G5:1 E5:2 C6:2 | A5:2 G5:1 E5:1 C5:2 E5:2 | A4:2 C5:1 A4:1 A4:4' },
    B:  { ch: ['Am', 'C', 'G', 'Em', 'Am', 'C', 'Dm', 'Am'],
          mel: 'A5:3 A5:1 A5:1 G5:1 E5:2 | G5:3 A5:1 C6:2 G5:2 | G5:3 E5:1 D5:2 B4:2 | G5:2 E5:1 D5:1 E5:4 | A5:3 A5:1 A5:1 G5:1 E5:2 | G5:3 A5:1 G5:2 E5:2 | D5:3 C5:1 A4:2 F5:2 | E5:2 C5:1 A4:1 A4:4' },
    C:  { ch: ['C', 'C', 'G', 'Am', 'C', 'C', 'Em', 'Am'],
          mel: 'C5:4 D5:2 E5:2 | G5:6 E5:2 | D5:4 B4:2 D5:2 | E5:8 | C5:4 D5:2 E5:2 | G5:4 A5:2 G5:2 | E5:3 D5:1 E5:2 B4:2 | A4:8' },
    F:  { ch: ['Am', 'G', 'Am', 'Am', 'Am', 'C', 'G', 'Am'],
          mel: 'A5:1 G5:1 E5:1 G5:1 A5:2 A5:2 | G5:1 E5:1 D5:1 E5:1 G5:2 G5:2 | A5:1 G5:1 E5:1 G5:1 A5:2 C6:2 | A5:2 G5:2 E5:4 | E5:1 D5:1 C5:1 D5:1 E5:2 E5:2 | G5:1 E5:1 D5:1 E5:1 C5:2 C5:2 | D5:1 C5:1 B4:1 C5:1 D5:2 B4:2 | A4:2 A4:2 A4:4' },
  }, ['A', 'B*', 'A2', 'C~', 'B', 'F'], huaynoBass),

  // el Apu: solemne
  apu: makeSong({ bpm: 104, vol: 0.28, strum: 'D...D.U.', drums: 'B...B...', orn: 0.25, lead2Vol: 0.13 }, {
    A: { ch: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'F', 'C', 'Dm'],
         mel: 'D5:4 F5:2 A5:2 | A5:6 F5:2 | F5:3 G5:1 F5:2 D5:2 | C5:8 | D5:4 F5:2 A5:2 | C6:6 A5:2 | G5:3 A5:1 G5:2 E5:2 | D5:8' },
    B: { ch: ['Bb', 'F', 'C', 'Am', 'Bb', 'F', 'C', 'Dm'],
         mel: 'F5:4 D5:2 F5:2 | A5:6 C6:2 | G5:4 E5:2 G5:2 | A5:8 | F5:4 D5:2 F5:2 | C6:4 A5:2 F5:2 | E5:3 G5:1 E5:2 C5:2 | D5:8' },
  }, ['A', 'B', 'A*', 'B~'], slowBass),

  // carnavalito del huaico: rápido y urgente
  huayco: makeSong({ bpm: 152, vol: 0.28, strum: 'D.DUD.DU', drums: 'B..bB..b', shaker: true, orn: 0.2, lead2Vol: 0.13 }, {
    A: { ch: ['Em', 'D', 'G', 'Em', 'C', 'Em', 'G', 'Em'],
         mel: 'E5:2 E5:1 E5:1 G5:2 E5:2 | D5:2 D5:1 D5:1 F#5:2 D5:2 | B4:2 B4:1 B4:1 D5:2 B4:2 | G4:2 B4:2 E5:4 |' +
              'G5:2 G5:1 G5:1 E5:2 G5:2 | E5:2 E5:1 G5:1 E5:2 B4:2 | B4:2 D5:1 B4:1 G4:2 D5:2 | E5:2 B4:2 E5:4' },
    B: { ch: ['C', 'D', 'Em', 'Em', 'C', 'D', 'Em', 'Em'],
         mel: 'G5:1 A5:1 G5:1 E5:1 G5:2 E5:2 | F#5:1 G5:1 F#5:1 D5:1 F#5:2 D5:2 | E5:1 F#5:1 G5:1 F#5:1 E5:2 B4:2 | E5:2 G5:2 E5:4 |' +
              'G5:2 E5:2 C5:2 E5:2 | F#5:2 D5:2 A4:2 D5:2 | B4:1 D5:1 E5:1 G5:1 B5:2 G5:2 | E5:4 E5:4' },
  }, ['A', 'B', 'A*', 'B'], huaynoBass),

  // cumbia amazónica para la selva: guitarra a contratiempo y bajo saltarín
  selva: makeSong({ bpm: 96, vol: 0.27, strum: '.D.U.D.U', drums: 'B...B.b.', shaker: true, orn: 0.25, lead2Vol: 0.13 }, {
    A: { ch: ['Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'E'],
         mel: 'A4:2 C5:2 E5:2 C5:2 | B4:2 D5:2 G5:2 D5:2 | A4:2 C5:2 F5:2 C5:2 | G#4:2 B4:2 E5:4 |' +
              'E5:1 E5:1 D5:2 C5:2 A4:2 | D5:1 D5:1 B4:2 G4:2 B4:2 | C5:2 A4:2 F4:2 A4:2 | B4:2 G#4:2 E4:4' },
    B: { ch: ['Dm', 'Am', 'E', 'Am', 'Dm', 'Am', 'E', 'Am'],
         mel: 'D5:2 F5:2 A5:2 F5:2 | E5:2 C5:2 A4:4 | B4:2 D5:2 E5:2 G#5:2 | A5:4 E5:4 | D5:2 F5:2 A5:2 F5:2 | A5:2 E5:2 C5:4 | B4:2 G#4:2 B4:2 E5:2 | A4:8' },
  }, ['A', 'B', 'A*', 'B~'], cumbiaBass),
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
    liquids.push({ x: l[0], y: l[1], w: l[2], h: l[3], kind: l[4], flow: l[5] || 1, fallTop: l[6] || 0 });
    for (let y = l[1]; y < l[1] + l[3]; y++)
      for (let x = l[0]; x < l[0] + l[2]; x++)
        put(x, y, (y === l[1] ? l[4] + 'Top' : l[4] + 'Body'));
  }
  for (const r of def.swampRocks || [])
    for (let y = r[1]; y < r[1] + r[3]; y++)
      for (let x = r[0]; x < r[0] + r[2]; x++) put(x, y, 'swampRock');
  for (const r of def.fgRocks || [])
    for (let y = r[1]; y < r[1] + r[3]; y++)
      for (let x = r[0]; x < r[0] + r[2]; x++) put(x, y, 'mudRock');
  return Object.assign({}, def, { grid, cols, rows, liquids, tile: (x, y) => (x >= 0 && x < cols && y >= 0 && y < rows ? grid[y][x] : null) });
}

// ─────────────────────────────────────────────────────────────────────────────
//  LA MARATÓN DE LOS ANDES — un solo nivel, de izquierda a derecha.
//
//   x 0–96     EL VALLE        · montado en la llama: pircas, puente colgante y un derrumbe
//   x 82–123   EL NEVADO       · la cabra salta sola por la montaña; tú la guías
//   x 119–157  EL PARAPENTE    · bajada con la hoja de plátano, esquivando águilas
//   x 145–268  CEJA DE SELVA   · el huaico: salta de tronco en tronco contra la
//                                corriente; una casa se derrumba a tu paso
//   x 269–388  LA SELVA BAJA   · agua quieta, caimanes, victorias regias y lianas
//   x 389–     EL COLEGIO      · a la orilla del río; la clase es al aire libre
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

// Orden realista de pisos ecológicos, de oeste a este:
//   valle quechua -> nevado -> (parapente por la vertiente oriental) ->
//   ceja de selva con el huaico -> selva baja inundada -> colegio ribereño
const SV = 269;          // primera columna de agua de la selva baja
const SWID = 120;        // ancho de la selva baja
const SCH = SV + SWID;   // donde empieza el pueblo ribereño del colegio
const sx = (lx) => SV + lx;

const LEVEL = {
  name: 'LA MARATÓN DE LOS ANDES', w: SCH + 44, h: 150,
  anchorRow: G,
  bgLayers: [
    { kind: 'mountains', color: '#8c93c9', color2: '#6d72a6', y: G - 3.4, parallax: 0.08, vpar: 0.10, amp: 8.5, seed: 5, snow: true },
    { kind: 'mountains', color: '#8a6fa6', color2: '#6a5486', y: G - 1.8, parallax: 0.18, vpar: 0.24, amp: 6, seed: 7 },
    { kind: 'mountains', color: '#7d9a62', color2: '#5f7e4c', y: G - 0.6, parallax: 0.32, vpar: 0.40, amp: 3.8, seed: 21 },
    { kind: 'hills', color: '#a8a356', color2: '#7f8a44', y: G + 0.4, parallax: 0.52, vpar: 0.62, amp: 2.2, seed: 3 },
    { kind: 'clouds', color: '#fff6e6', parallax: 0.06, count: 9, seed: 11 },
  ],
  // fondo de la selva baja: lomas amazónicas bajas y brumosas, sin nevados
  bgEast: {
    // el cambio ocurre en plena selva, donde el muro de follaje tapa todo el cielo
    x0: SV + 22, x1: SV + 32, anchorRow: 112,
    layers: [
      { kind: 'hills', color: '#8fb0a8', color2: '#7a9c96', y: 109.6, parallax: 0.08, vpar: 0.10, amp: 2.4, seed: 9 },
      { kind: 'canopy', color: '#5f8f6a', color2: '#4d7a5a', y: 110.6, parallax: 0.18, vpar: 0.24, amp: 2.2, seed: 13 },
      { kind: 'canopy', color: '#3f7a4c', color2: '#30623e', y: 111.6, parallax: 0.32, vpar: 0.40, amp: 1.8, seed: 17 },
      { kind: 'clouds', color: '#f4f6ee', parallax: 0.06, count: 7, seed: 4 },
    ],
  },
  spawn: { x: 6, y: G },
  // la gran montaña: silueta de fondo con nieve en lo alto
  mountain: { peakX: 121, peakRow: 10, snowRow: 78, shape: mountainShape(121, 10, 150) },
  // cerro del que baja el huaico (tierra cálida); su ladera nace tras la última roca fija
  hill: { peakX: 244, peakRow: 89, slopeL: 0.75, slopeR: 2.1, x0: 232 },
  // EL CAÑÓN DEL VALLE: puente colgante inca con una gran catarata al fondo
  canyon: { x0: 50, x1: 64, rimRow: G - 2, fall: { x: 57, top: G - 8 } },
  // LA SELVA: árboles, lianas y agua quieta
  jungle: { x0: 252, x1: SV + SWID + 4, fade: 16, waterRow: 112, trees: [sx(5), sx(26), sx(35), sx(45), sx(53), sx(61), sx(68), sx(80), sx(90), sx(98), sx(106), sx(116)] },
  goatEnd: 118, goatEndRow: SUMMIT,
  // al planear no puedes alejarte de la ladera este
  glide: { x0: 119, x1: 155.4 },   // a la derecha no pasa de la orilla: más allá está el precipicio del huaico
  glideLandRow: 100,   // la hoja solo se suelta al aterrizar por debajo de esta fila (el valle)
  altitude: { baseRow: G, baseM: 3650, perRow: 13 },
  zones: [
    { x: 0,   name: 'EL VALLE',  music: 'valle' },
    { x: 86,  name: 'EL APU',    music: 'apu', alt: true },
    { x: 145, name: 'CEJA DE SELVA', music: 'huayco' },
    { x: 252, name: 'LA SELVA',  music: 'selva' },
    { x: SCH, name: 'EL COLEGIO', music: 'selva' },
  ],
  rects: [
    // ── EL VALLE ──
    [0, G, 38, 6, 'grass'],
    [15, G - 1, 1, 1, 'pirca'],
    [31, G - 2, 1, 2, 'pirca'],
    [38, G - 2, 12, 8, 'grass'],
    [46, G - 3, 1, 1, 'pirca'], [47, G - 4, 1, 2, 'pirca'],
    // el cañón (x 50–63): paredes de roca hasta el río del fondo
    [64, G - 2, 6, 8, 'grass'],
    [70, G, 31, 6, 'grass'],
    // ── LA CUMBRE ──
    [116, SUMMIT, 9, 1, 'summit'],
    // ── LA CEJA DE SELVA: el huaico (aterrizas en su orilla) ──
    [145, 110, 12, 40, 'jungle'],
    [160, 114, 22, 36, 'jungle'], [182, 112, 22, 38, 'jungle'], [204, 110, 22, 40, 'jungle'], [226, 108, 20, 42, 'jungle'],
    // salida del huaico y bajada escalonada hacia la selva baja
    [246, 103, 11, 47, 'jungle'], [257, 106, 4, 44, 'jungle'], [261, 108, 4, 42, 'jungle'], [265, 110, 4, 40, 'jungle'],
    // ── LA SELVA BAJA INUNDADA ──
    [SV, 118, SWID, 32, 'jungle'],                // fondo fangoso bajo el agua
    // parte 4: raíces de manglar que asoman
    [sx(95), 110, 2, 8, 'jungle'],
    // parte 5: la orilla de salida, que sube suave hacia la quebrada cálida
    [sx(114), 110, 6, 40, 'jungle'],
    // ── EL PUEBLO RIBEREÑO: el colegio ──
    [SCH, 110, 44, 40, 'jungle'],
  ],
  platforms: [
    ...MTN.up,
    // puente colgante sobre el cañón
    [50, G - 2, 14, 'ropeBridge'],
    // ramas firmes de la selva (donde duermen los perezosos)
    [sx(43), 108, 4, 'branch'], [sx(54), 104, 4, 'branch'], [sx(65), 108, 4, 'branch'],
    // parte 4: un tronco caído hace de puente, y otro árbol con perezoso
    [sx(76), 111, 8, 'trunk'], [sx(98), 107, 4, 'branch'],
  ],
  liquids: [
    // el río del fondo del cañón
    [50, G + 1, 14, 5, 'water', 1],
    // el agua quieta de la selva
    [SV, 112, SWID - 6, 6, 'swamp', 0.15],
    // el huaico: cuatro escalones de lodo que bajan hacia el precipicio
    [160, 111, 22, 3, 'mud', -1], [182, 109, 22, 3, 'mud', -1], [204, 107, 22, 3, 'mud', -1], [226, 105, 20, 3, 'mud', -1],
  ],
  // rocas fijas en cada escalón del huaico; la primera para entrar desde la
  // orilla y la última como peldaño para el salto final a la orilla del colegio
  // rocas que asoman del agua de la selva (se colocan después del agua: entran en ella)
  //   parte 1: rocas para aprender · parte 2: descanso entre victorias regias · parte 3: para salir si caes
  swampRocks: [[sx(3), 111, 2, 7], [sx(8), 111, 2, 7], [sx(13), 111, 2, 7], [sx(18), 111, 2, 7], [sx(40), 111, 2, 7], [sx(52), 111, 2, 7], [sx(63), 111, 2, 7],
               [sx(72), 111, 2, 7], [sx(103), 111, 2, 7], [sx(110), 111, 2, 7]],
  fgRocks: [[161, 111, 2, 3], [180, 109, 2, 5], [202, 107, 2, 5], [224, 105, 2, 5], [243, 104, 2, 4]],
  entities: [
    // la casa del niño, con mamá en la puerta
    { type: 'house', x: 0, y: G },
    { type: 'llama', x: 10, y: G },
    { type: 'bridge', x0: 50, x1: 64, row: G - 2 },
    { type: 'cabra', x: 91, y: G },
    // puntos de control invisibles: el valle y la subida son cortos, así que el
    // primero está en la cumbre, antes del parapente
    { type: 'checkpoint', x: 151, y: 110, w: 14, h: 10 },   // toda la orilla donde aterriza el parapente
    { type: 'checkpoint', x: sx(44), y: 108 },
    { type: 'checkpoint', x: sx(72.5), y: 111 },
    { type: 'checkpoint', x: sx(99), y: 107 },
    { type: 'checkpoint', x: 250, y: 103, w: 8 },        // al salir del huaico
    { type: 'rockfall', x: 82, y: G - 13, interval: 130 },
    { type: 'checkpoint', x: 121, y: SUMMIT },
    // en la cumbre crece un platanal: su hoja gigante sirve de parapente
    { type: 'leaf', x: 123, y: SUMMIT },
    ...EAGLES,
    // ── la selva ──
    { type: 'lily', x: sx(23.5) }, { type: 'lily', x: sx(28) }, { type: 'lily', x: sx(32.5) }, { type: 'lily', x: sx(37) },
    { type: 'dryBranch', x: sx(49), y: 106 }, { type: 'dryBranch', x: sx(59.5), y: 106 },
    { type: 'sloth', x: sx(44.5), y: 108 }, { type: 'sloth', x: sx(55.5), y: 104 }, { type: 'sloth', x: sx(66.5), y: 108 }, { type: 'sloth', x: sx(99.5), y: 107 },
    { type: 'lily', x: sx(87) }, { type: 'lily', x: sx(91.5) }, { type: 'lily', x: sx(107) },
    { type: 'caiman', x0: sx(0), x1: sx(21), leap: false },
    { type: 'caiman', x0: sx(21), x1: sx(43), leap: true },
    { type: 'caiman', x0: sx(43), x1: sx(71), leap: true },
    { type: 'caiman', x0: sx(71), x1: sx(95), leap: true },
    { type: 'caiman', x0: sx(97), x1: sx(114), leap: true },
    { type: 'huaico', x0: 160, x1: 246, interval: 135, speed: 0.75, inflow: { x: 239, top: 92 } },
    // casa al borde del huaico: se derrumba cuando pasas y la corriente se lleva su techo y sus vigas
    { type: 'collapseHouse', x: 213, y: 107 },
    // el colegio se cae a pedazos... la clase se da afuera, sentados en el suelo
    // profesores en huelga delante del colegio que está por caerse
    { type: 'striker', x: SCH + 1.5, y: 110, v: 0, slot: 0, sign: ['¡HUELGA!'], say: ['¡EL COLE SE PUEDE', 'CAER EN CUALQUIER', 'MOMENTO!'] },
    { type: 'striker', x: SCH + 6.5, y: 110, v: 1, slot: 1, flip: true, sign: ['¡ARREGLEN', 'EL COLE!'], say: ['¡HACE AÑOS PEDIMOS', 'QUE LO ARREGLEN!'] },
    { type: 'school', x: SCH + 14, y: 110 },
    { type: 'outdoorClass', x: SCH + 22, y: 110 },
    // mototaxis estacionados: el transporte del pueblo
    { type: 'mototaxi', x: SCH + 36, y: 110, model: 'rojo' },
    { type: 'mototaxi', x: SCH + 39.8, y: 110, model: 'azul', flip: true, run: true },
    { type: 'mototaxi', x: SCH - 4.8, y: 110, model: 'azul' },   // esperando pasajeros en el puerto
    ...BIRDS,
    ...HERBS,
    // las 3 hojas de tarea que se le volaron al niño, enganchadas en el camino
    { type: 'page', x: 47, y: G - 5 },                                            // sobre la pirca alta
    { type: 'page', x: MTN.up[19][0] - 5, y: MTN.up[19][1] - 6 },                 // en el aire, junto al risco
    { type: 'page', x: sx(55), y: 101 },                                          // en lo alto del árbol, sobre el perezoso
  ],
  decor: [
    ['cantuta', 7, G - 1], ['ichu', 12, G - 1], ['ichu', 19, G - 1], ['maguey', 27, G - 1],
    ['cantuta', 35, G - 1], ['ichu', 41, G - 3], ['ichu', 66, G - 3], ['maguey', 72, G - 1],
    ['ichu', 78, G - 1], ['cantuta', 85, G - 1],
    // ceja de selva: helechos y bambú
    ['fern', 146, 109], ['bamboo', 149, 109], ['fern', 154, 109],
    ['bamboo', 247, 102], ['fern', 250, 102], ['fern', 254, 102], ['bamboo', 262, 107],
    // pueblo ribereño
    ['fern', SCH + 1, 109], ['bamboo', SCH + 3, 109], ['fern', SCH + 41, 109]
  ],
};

const LEVELS = [buildLevel(LEVEL)];
