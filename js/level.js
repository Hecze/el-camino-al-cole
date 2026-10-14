// level.js — tiles, canciones y EL nivel: un solo camino al colegio con tramos
// encadenados: la fiesta del pueblo, la llama por el valle, la cabra por el
// risco del Apu, la laguna helada, el huaico de lodo, el río en balsa, la selva
// y el dosel. Al final, el colegio.

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
  tranquera: { solid: true },                        // la dibuja la entidad del quipu (y la quita al abrirse)
  swampTop:  { liquid: 'swamp' }, swampBody: { liquid: 'swamp' },
  waterTop:  { liquid: 'water' }, waterBody: { liquid: 'water' },
  mudTop:    { liquid: 'mud' },   mudBody:   { liquid: 'mud' },
  lakeTop:   { liquid: 'lake' },  lakeBody:  { liquid: 'lake' },   // agua helada de la laguna
  cobble:    { solid: true, top: T.cobble, body: T.dirt },        // calle empedrada del pueblo
  adobe:     { solid: true, top: T.teja, body: T.cal },           // casa encalada con techo de tejas
  ice:       { solid: true, top: T.ice, body: T.iceBody, ice: true },   // hielo: resbala
  iceDeep:   { solid: true, body: T.iceBody },                    // hielo del fondo (bajo los huecos)
  deck:      { oneway: true, body: T.deck },                      // plataforma en la copa de un árbol
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
const BASS_OF = { Am: ['A2', 'E2'], G: ['G2', 'D2'], F: ['F2', 'C3'], C: ['C3', 'G2'], Em: ['E2', 'B2'], Dm: ['D2', 'A2'], D: ['D2', 'A2'], E: ['E2', 'B2'], Bb: ['Bb2', 'F2'],
  Gm: ['G2', 'D2'], A: ['A2', 'E2'], A7: ['A2', 'E2'], E7: ['E2', 'B2'], G7: ['G2', 'D2'], 'C#7': ['C#3', 'G#2'], 'F#m': ['F#2', 'C#3'], 'F#7': ['F#2', 'C#3'], Bm: ['B2', 'F#2'], B7: ['B2', 'F#2'] };
// bajo de huayno: fundamental con anticipación + quinta (golpes en 0, 3 y 4)
function huaynoBass(chords) { return chords.map(c => { const [r, f] = BASS_OF[c]; return `${r}:3 ${r}:1 ${f}:4`; }).join(' '); }
function slowBass(chords) { return chords.map(c => `${BASS_OF[c][0]}:4 ${BASS_OF[c][1]}:4`).join(' '); }
function cumbiaBass(chords) { return chords.map(c => { const [r, f] = BASS_OF[c]; return `${r}:3 ${f}:1 ${r}:2 ${f}:2`; }).join(' '); }
// bajo de vals (3/4): bordón en el tiempo 1, alternando fundamental y quinta; la guitarra hace el 2 y el 3
function valsBass(chords) { return chords.map((c, i) => `${BASS_OF[c][i % 2]}:4 r:8`).join(' '); }
// zampoña grave (malta): una nota del acorde por debajo de la quena, con
// notas comunes entre acordes para que la voz se mueva poco
const SIKU = { Am: 'E4', G: 'D4', F: 'C4', C: 'E4', Em: 'E4', Dm: 'D4', D: 'D4', E: 'E4', Bb: 'D4' };
// base.bar: semicorcheas por compás (8 = 2/4, por defecto; 12 = 3/4 del vals)
function makeSong(base, parts, form, bassFn) {
  const chords = [], lead = [], lead2 = [], bl = base.bar || 8;
  const siku = (c) => SIKU[c] ? `${SIKU[c]}:${bl - 2} r:2` : `r:${bl}`;
  for (const k0 of form) {
    const k = k0.replace(/[*~]/g, ''), P = parts[k];
    const bars = P.mel.split('|').map(x => x.trim());
    if (bars.length !== P.ch.length) throw new Error('parte ' + k + ': compases y acordes no coinciden');
    bars.forEach((b, i) => {
      const len = b.split(/\s+/).reduce((n, t) => n + parseInt(t.split(':')[1] || '1', 10), 0);
      if (len !== bl) throw new Error(`parte ${k}, compás ${i + 1}: dura ${len} y debe durar ${bl}`);
      chords.push(P.ch[i]);
      if (k0.endsWith('~')) { lead.push(`r:${bl}`); lead2.push(siku(P.ch[i])); }
      else if (k0.endsWith('*') && i % 4 >= 2) { lead.push(`r:${bl}`); lead2.push(b); }
      else { lead.push(b); lead2.push(siku(P.ch[i])); }
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

  // ADIÓS PUEBLO DE AYACUCHO (huayno ayacuchano anónimo, siglo XIX; dominio
  // público): transcripción propia en La menor para quena, zampoña y charango.
  // Cotejada con la melodía que recoge la tablatura de charango del CEMDUC-PUCP
  // (solo la línea melódica; acordes y arreglo son nuestros). Original en 2/8:
  // aquí cada compás de 2/4 junta dos de 2/8.
  //  I  intro "mi re | do. mi | mi re | do. mi | mi re | do si do | re si | la"   confianza alta
  //  A  "A-diós pue-blo de A-ya-cu-cho, per-las-cha-llay":
  //     mi la | la sol# la~ | la do | la | la sol mi | sol | la la | sol sol sol~ |
  //     mi re | do. mi~ | re do | la. do | la sol mi                              confianza alta
  //  B  igual a A desde el 4.º compás; empieza "do re mi (tresillo) | mi re mi~ | mi la"
  //     (el tresillo va como 1-1-2 semicorcheas)                                  confianza media-alta
  //  acordes (Am, C, G, E): propios, en el estilo del huayno                     confianza media
  ayacucho: makeSong({ bpm: 100, vol: 0.28, strum: 'D.DUD.DU', drums: 'B..bB...', shaker: true, orn: 0.25, lead2Vol: 0.12 }, {
    I:  { ch: ['C', 'C', 'Am', 'Am', 'Am'],
          mel: 'E5:2 D5:2 C5:3 E5:1 | E5:2 D5:2 C5:3 E5:1 | E5:2 D5:2 C5:2 B4:1 C5:1 | D5:2 B4:2 A4:4 | r:4 E5:2 A5:2' },
    // A con la 1.ª casilla: el "A-diós" de la vuelta cae al final del compás anterior
    A:  { ch: ['Am', 'Am', 'C', 'G', 'C', 'Am'],
          mel: 'A5:1 G#5:1 A5:3 A5:1 C6:2 | A5:4 A5:1 G5:2 E5:1 | G5:4 A5:2 A5:2 | G5:2 G5:1 G5:2 E5:2 D5:1 | C5:3 E5:2 D5:2 C5:1 | A4:3 C5:1 A4:1 G4:1 E4:2' },
    // la vuelta de A, con la 2.ª casilla (termina en la)
    A2: { ch: ['Am', 'Am', 'C', 'G', 'C', 'Am'],
          mel: 'E5:2 A5:2 A5:1 G#5:1 A5:2 | -:1 A5:1 C6:2 A5:4 | A5:1 G5:2 E5:1 G5:4 | A5:2 A5:2 G5:2 G5:1 G5:1 | -:1 E5:2 D5:1 C5:3 E5:1 | -:1 D5:2 C5:1 A4:4' },
    B:  { ch: ['C', 'C', 'C', 'G', 'C', 'Am'],
          mel: 'C5:1 D5:1 E5:2 E5:2 D5:1 E5:1 | -:1 E5:1 A5:2 G5:4 | A5:1 G5:2 E5:1 G5:4 | A5:2 A5:2 G5:2 G5:1 G5:1 | -:1 E5:2 D5:1 C5:3 E5:1 | -:1 D5:2 C5:1 A4:4' },
  }, ['I', 'A', 'A2', 'B', 'B*'], huaynoBass),

  // el Apu: solemne
  apu: makeSong({ bpm: 104, vol: 0.28, strum: 'D...D.U.', drums: 'B...B...', orn: 0.25, lead2Vol: 0.13 }, {
    A: { ch: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'F', 'C', 'Dm'],
         mel: 'D5:4 F5:2 A5:2 | A5:6 F5:2 | F5:3 G5:1 F5:2 D5:2 | C5:8 | D5:4 F5:2 A5:2 | C6:6 A5:2 | G5:3 A5:1 G5:2 E5:2 | D5:8' },
    B: { ch: ['Bb', 'F', 'C', 'Am', 'Bb', 'F', 'C', 'Dm'],
         mel: 'F5:4 D5:2 F5:2 | A5:6 C6:2 | G5:4 E5:2 G5:2 | A5:8 | F5:4 D5:2 F5:2 | C6:4 A5:2 F5:2 | E5:3 G5:1 E5:2 C5:2 | D5:8' },
  }, ['A', 'B', 'A*', 'B~'], slowBass),

  // EL CÓNDOR PASA (Daniel Alomía Robles, 1913; dominio público): la frase
  // inicial del yaraví, transcrita en la menor para quena y zampoña. Suena una
  // vez al llegar a la cumbre del Apu; el último compás es silencio.
  condorPasa: makeSong({ bpm: 84, vol: 0.3, strum: 'D...D.U.', drums: 'B...b...', orn: 0.25, lead2Vol: 0.12 }, {
    A: { ch: ['Am', 'Am', 'Am', 'C', 'Am', 'E', 'Am', 'Am'],
         mel: 'r:6 E4:2 | A4:2 G#4:2 A4:2 B4:2 | C5:2 B4:2 C5:2 D5:2 | E5:4 G5:2 E5:2 | D5:2 C5:2 A4:4 | E5:3 D5:1 C5:2 B4:2 | A4:8 | r:8' },
  }, ['A'], slowBass),

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
  for (const r of def.riverRocks || [])
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
//   x 0–99     EL PUEBLO       · la fiesta patronal: techos de tejas, cohetes de la
//                                alborada y danzantes de tijeras
//   x 100–196  EL VALLE        · montado en la llama: pircas, puente colgante y un derrumbe
//   x 182–224  EL NEVADO       · la cabra salta sola por la montaña; tú la guías
//   x 225–294  LA LAGUNA       · la laguna del Apu, congelada: el hielo resbala y
//                                las placas delgadas se quiebran
//   x 289–327  EL PARAPENTE    · bajada con la hoja de plátano, esquivando águilas
//   x 315–438  CEJA DE SELVA   · el huaico: salta de tronco en tronco contra la
//                                corriente; una casa se derrumba a tu paso
//   x 439–568  EL RÍO          · los rápidos en balsa: piedras y remolinos
//   x 569–688  LA SELVA BAJA   · agua quieta, caimanes, victorias regias y lianas
//   x 689–798  EL DOSEL        · sube al árbol, puentes colgantes entre las copas,
//                                monos ladrones y la tirolesa hasta el colegio
//   x 799–     EL COLEGIO      · a la orilla del río; la clase es al aire libre
//
// Los tramos de siempre conservan sus columnas de antes dentro de va() y ce():
// así el mapa viejo se sigue leyendo igual y solo se corre de lugar.
// ─────────────────────────────────────────────────────────────────────────────
const G = 144;          // fila del suelo del valle
const SUMMIT = 18;      // fila de la cumbre
const PUEBLO = 100;     // ancho de El Pueblo (todo lo de después se corre esto)
const LAGUNA = 70;      // ancho de La Laguna, entre la cumbre y la hoja de plátano
const RIO = 130;        // ancho de El Río, entre el huaico y la selva baja
const DOSEL = 110;      // ancho de El Dosel, entre la selva baja y el colegio
const va = (x) => x + PUEBLO;            // El Valle y El Apu (columnas de antes)
const ce = (x) => x + PUEBLO + LAGUNA;   // de la hoja de plátano a la Ceja de Selva (columnas de antes)

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
    const center = va(103) + (i / (nUp - 1)) * 14;
    const x = Math.round(center + ZIG[i % ZIG.length] * 0.8);
    up.push([x - 1, row, i < 3 ? 4 : 3, row < 80 ? 'ledgeSnow' : 'ledge']);
  }
  // BIFURCACIONES de los pumas: a la altura de cada puma hay DOS salientes. La del
  // lado del puma (la del camino, up[i]) es su blanco; la otra, alejada, está fuera
  // de su alcance. Ambas quedan a tiro de la de abajo y de la de arriba.
  const alt = [];
  PUMA_FORKS.forEach((i, k) => {
    const away = k % 2 === 0 ? 1 : -1;   // pumas a la izquierda en las pares: la segura queda a la derecha
    const m = ((up[i - 1][0] + up[i - 1][2] / 2) + (up[i + 1][0] + up[i + 1][2] / 2)) / 2;
    const w = up[i][2], type = up[i][3];
    up[i] = [Math.round(m - away * 3 - w / 2), up[i][1], w, type];   // la del puma
    alt.push([Math.round(m + away * 3 - w / 2), up[i][1], w, type]);   // la segura
  });
  return { up, alt };
}
const PUMA_FORKS = [2, 5, 8, 11, 15, 19, 26];   // salientes con bifurcación y puma (más abajo que arriba)
const MTN = mountainPath();
const mid = (l) => l[0] + l[2] / 2;
// cóndores que cruzan el risco a distintas alturas (cada vez más rápidos)
const BIRDS = [];
[124, 104, 84, 64, 46, 32].forEach((row, i) => {
  BIRDS.push({ type: 'condor', x0: va(90), x1: va(123), y: row - 1.5, speed: 1.4 + i * 0.12, phase: i * 0.7, dir: i % 2 ? -1 : 1 });
});
// pumas en sus repisas, junto a la saliente de la bifurcación que vigilan: más
// abajo que arriba (las cabras trepan justamente para escapar de ellos)
const PUMAS = PUMA_FORKS.map((i, k) => {
  const l = MTN.up[i], left = k % 2 === 0;
  return { type: 'puma', x: left ? l[0] - 6 : l[0] + l[2] + 3, y: l[1] - 1, face: left ? 1 : -1, snowy: l[1] < 80, ledge: i };
});
// hojitas de coca para el soroche: en el centro de las salientes, donde rebota la
// cabra. La primera queda varias salientes después de los primeros síntomas (hay
// que buscarla) y la última deja llegar a la cumbre ya con soroche
const COCA = [12, 18, 24].map(i => ({ type: 'coca', x: mid(MTN.up[i]) - 0.5, y: MTN.up[i][1] - 1 }));
// puntos de control en la montaña (reapareces montado en la cabra)

// Silueta de la montaña calculada a partir del camino: cada saliente queda
// pegada a la roca (nada de salientes flotando en el aire). Desde la fila
// shelfRow la ladera este se corre shelfW columnas: es el rellano de la laguna.
function mountainShape(peakX, peakRow, rows, shelfRow, shelfW) {
  const shape = [];
  for (let r = 0; r < rows; r++) {
    if (r < peakRow) { shape.push(null); continue; }
    const d = r - peakRow;
    let L = peakX - d * 0.24 - 1, R = peakX + d * 0.3 + 1 + (r >= shelfRow ? shelfW : 0);
    for (const l of [...MTN.up, ...MTN.alt]) if (Math.abs(l[1] - r) <= 6) L = Math.min(L, l[0] - 3);
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
//   pueblo -> valle quechua -> nevado y laguna -> (parapente por la vertiente
//   oriental) -> ceja de selva con el huaico -> el río baja a la selva baja
//   inundada -> dosel -> colegio ribereño
const RV = ce(269);           // primera columna de agua del río
const rio = (lx) => RV + lx;
const SV = RV + RIO;          // primera columna de agua de la selva baja
const SWID = 120;             // ancho de la selva baja
const sx = (lx) => SV + lx;
const DS = SV + SWID;         // donde empieza el dosel
const dos = (lx) => DS + lx;
const SCH = DS + DOSEL;       // donde empieza el pueblo ribereño del colegio
const DECK = 96;              // fila de las plataformas y puentes del dosel

// ── GUÍA (js/guide.js): pistas antes de cada mecánica nueva, gente que habla,
// escenario que reacciona y ayudas si te caes seguido en el mismo tramo ─────
const quipuOpen = (g) => g.entities.some(e => e instanceof Quipu && e.open);
const onFoot = (g) => !g.player.riding, onLlama = (g) => g.player.riding instanceof Llama, onGoat = (g) => g.player.riding instanceof Cabra;
const onRaft = (g) => g.player.riding instanceof Balsa;
const GUIA = [
  // EL PUEBLO
  { type: 'npc', x: 2.75, y: G, model: 'mama', ghost: true, r: 9, lines: ['¡YA SON LAS SEIS MENOS VEINTE, HIJITO!', '¡NO TE OLVIDES TU TAREA!'] },
  { type: 'hint', x: 10, y: G, text: 'SALTA', key: 'jump', r: 4, pass: 2, when: onFoot },
  { type: 'npc', x: 16.5, y: G, model: 'pastor', lines: ['¡HOY ES LA FIESTA DEL PATRÓN!', '¡YA EMPEZÓ LA ALBORADA!'] },
  { type: 'prop', kind: 'gallina', x: 19.5, y: G },
  { type: 'hint', x: 25, y: G, text: ['¡EL DANZANTE!', 'SÁLTALO CUANDO ESTÉ ABAJO'], key: 'jump', r: 6, pass: 0, dy: 20 },
  { type: 'help', x0: 18, x1: 31, kind: 'tijeras', text: 'SÁLTALO CUANDO ESTÉ ABAJO' },
  { type: 'hint', x: 30.5, y: G - 2, text: '¡POR LOS TECHOS!', arrow: 'right', r: 4, pass: 1 },
  { type: 'hint', x: 46.5, y: G - 5, text: ['¡UN COHETE!', 'PASA CUANDO YA SALIÓ'], arrow: 'down', r: 6, pass: 0, dy: 12 },
  { type: 'help', x0: 31, x1: 64, kind: 'cohete', text: 'PASA CUANDO EL COHETE YA SALIÓ' },
  { type: 'npc', x: 68.5, y: G, model: 'senora', lines: ['¡PAN WAWA CALIENTITO!', '¡VIVA EL PATRÓN!'] },
  { type: 'prop', kind: 'olla', x: 70.5, y: G, bonus: 1 },
  { type: 'prop', kind: 'perro', x: 87, y: G },
  { type: 'help', x0: 64, x1: 92, kind: 'tijeras', text: 'SÁLTALO CUANDO ESTÉ ABAJO' },
  { type: 'npc', x: 92.5, y: G, model: 'nino', lines: ['¡TU LLAMA TE ESPERA!', '¡CORRE, QUE YA ES TARDE!'] },
  // EL VALLE
  { type: 'hint', x: va(10.5), y: G, text: '¡SÚBETE A LA LLAMA!', key: 'right', arrow: 'down', r: 10, pass: 1, dy: 22, when: onFoot },
  { type: 'hint', x: va(13.5), y: G, text: 'SALTA', key: 'jump', r: 3, pass: 1.5, when: onLlama },
  { type: 'prop', kind: 'gallina', x: va(16.5), y: G },
  { type: 'npc', x: va(18.5), y: G, model: 'pastor', lines: ['¡BUENOS DÍAS, WAWA!', '¡VAS TARDE, CAUSA!'] },
  // EL QUIPU: la piedra tallada dice en qué orden tocar los cordones
  { type: 'hint', x: va(21), y: G, text: 'EN ESTE ORDEN', r: 7, pass: 9, dy: -8, when: (g) => !quipuOpen(g) },
  { type: 'prop', kind: 'cuy', x: va(35.5), y: G },
  { type: 'prop', kind: 'flor', x: va(34), y: G }, { type: 'prop', kind: 'gallina', x: va(36.5), y: G, flip: true },
  { type: 'npc', x: va(41), y: G - 2, model: 'senora', lines: ['¡CHOCLITO CON QUESO, CASERITO!', '¡A UN SOLCITO NOMÁS!'] },
  { type: 'prop', kind: 'olla', x: va(44), y: G - 2, bonus: 1 },
  { type: 'hint', x: va(47), y: G - 4, text: '¡TU TAREA!', arrow: 'down', r: 6, pass: 0.5, dy: 4, item: 'page' },
  { type: 'prop', kind: 'flor', x: va(68), y: G - 2 }, { type: 'prop', kind: 'perro', x: va(72), y: G },
  { type: 'prop', kind: 'manta', x: va(74.5), y: G, w: 3 },
  { type: 'help', x0: va(48), x1: va(66), text: 'CRUZA EL PUENTE SIN PARAR' },
  { type: 'help', x0: va(70), x1: va(92), kind: 'rock', text: '¡SALTA CUANDO LLEGUE LA PIEDRA!' },
  // EL APU: la cabra, el soroche y los cóndores
  { type: 'npc', x: va(87.5), y: G, model: 'nino', lines: ['¡CUIDADO CON EL SOROCHE!', '¡ARRIBA HAY UNA LAGUNA!'] },
  // si te quedas a pie al pie del cerro, la flecha de "¡POR AQUÍ!" señala a la cabra
  // (solo al pie del cerro: más arriba la cabra queda atrás y la flecha no debe mandarte de vuelta)
  { type: 'goal', x: va(91), y: G, when: (g) => !onGoat(g) && g.player.cx > va(70) * TILE && g.player.cx < va(96) * TILE, at: (g) => { const c = g.entities.find(e => e instanceof Cabra); return { x: c.cx, y: c.cy }; } },
  { type: 'hint', x: va(91.5), y: G, text: '¡SÚBETE A LA CABRA!', arrow: 'down', r: 7, pass: 1, when: (g) => !onGoat(g) },
  { type: 'hint', x: COCA[0].x + 0.5, y: COCA[0].y + 1.5, text: '¡COCA!', arrow: 'down', r: 6, pass: 3, vr: 4, item: 'coca' },
  { type: 'help', x0: va(92), x1: va(126), kind: 'bird', text: '¡SI VES EL AVISO, ESPERA!' },
  { type: 'help', x0: va(82), x1: va(126), kind: 'soroche', text: 'COME HOJAS DE COCA PARA RESPIRAR' },
  { type: 'help', x0: va(82), x1: va(126), kind: 'puma', text: 'SI EL PUMA MARCA UNA SALIENTE, ¡VE A LA OTRA!' },
  { type: 'help', x0: va(92), x1: va(126), text: 'TÚ SOLO GUÍA: LA CABRA SALTA' },
  { type: 'npc', x: va(117), y: SUMMIT, model: 'nina', lines: ['¡QUÉ TAL VISTA!', '¡LA LAGUNA ESTÁ CONGELADA!'] },
  { type: 'prop', kind: 'campana', x: va(119.5), y: SUMMIT },
  // LA LAGUNA: el hielo resbala y las placas delgadas se quiebran
  { type: 'hint', x: va(129), y: SUMMIT, text: ['¡EL HIELO RESBALA!', 'FRENA ANTES DEL HUECO'], arrow: 'right', r: 5, pass: 2 },
  { type: 'hint', x: va(146.5), y: SUMMIT, text: ['EL HIELO DELGADO SE ROMPE', '¡NO TE QUEDES!'], arrow: 'right', r: 5, pass: 1 },
  { type: 'help', x0: va(125), x1: ce(125), kind: 'lake', text: 'SALTA JUSTO EN EL BORDE' },
  { type: 'npc', x: ce(117.5), y: SUMMIT, model: 'nino', lines: ['¡CON ESA HOJA PUEDES VOLAR!'] },
  // CEJA DE SELVA: el huaico
  { type: 'npc', x: ce(147.5), y: 110, model: 'senora', lines: ['¡AY, EL HUAICO, HIJITO!', '¡SE LLEVÓ MI CASA!'] },
  { type: 'help', x0: ce(157), x1: ce(246), kind: 'mud', text: 'EN EL LODO: ¡SALTA SIN PARAR!' },
  { type: 'prop', kind: 'olla', x: ce(253), y: 103, bonus: 1 },
  // EL RÍO: la balsa que manejas tú
  { type: 'npc', x: ce(262.5), y: 108, model: 'pastor', lines: ['¡LLÉVATE MI BALSA, WAWA!', '¡SALTA LAS PIEDRAS!'] },
  { type: 'hint', x: ce(267), y: 110, text: '¡SÚBETE A LA BALSA!', arrow: 'right', r: 6, pass: 2, when: onFoot },
  // si te quedas a pie en el muelle, la flecha señala la balsa
  { type: 'goal', x: rio(1), y: 110, when: (g) => onFoot(g) && g.player.cx > ce(257) * TILE && g.player.cx < rio(4) * TILE, at: (g) => { const b = g.entities.find(e => e instanceof Balsa); return { x: b.cx, y: b.cy }; } },
  { type: 'hint', x: rio(12), y: 110, text: 'SALTA LA PIEDRA', key: 'jump', r: 7, pass: 1, when: onRaft },
  { type: 'hint', x: rio(27), y: 110, text: ['¡REMOLINO!', 'FRENA O SÁLTALO'], key: 'left', r: 7, pass: 1, when: onRaft },
  { type: 'help', x0: rio(0), x1: SV, kind: 'remolino', text: 'FRENA HASTA QUE SE CIERRE' },
  // LA SELVA BAJA
  { type: 'npc', x: SV - 4.5, y: 110, model: 'nino', lines: ['¡CUIDADO CON LOS LAGARTOS!'] },
  { type: 'hint', x: sx(21), y: 111, text: ['LAS HOJAS SE HUNDEN', '¡NO TE QUEDES!'], arrow: 'right', r: 5, pass: 2 },
  { type: 'help', x0: SV - 4, x1: DS, kind: 'caiman', text: '¡NO NADES! VE POR ARRIBA' },
  // EL DOSEL: sube al árbol y cruza por las copas
  { type: 'npc', x: dos(0.5), y: 110, model: 'nina', lines: ['¡SUBE POR LAS RAMAS!', '¡OJO, LOS MONOS SON RATEROS!'] },
  { type: 'hint', x: dos(8), y: 110, text: '¡SUBE POR EL ÁRBOL!', arrow: 'up', r: 5, pass: 3, vr: 4 },
  { type: 'hint', x: dos(12.5), y: DECK, text: ['¡EL MONO!', 'PASA CUANDO SE ALEJE'], arrow: 'right', r: 5, pass: 1 },
  { type: 'help', x0: dos(12), x1: dos(80), kind: 'mono', text: 'ESPERA QUE EL MONO SE ALEJE' },
  { type: 'hint', x: dos(76.5), y: DECK, text: '¡AGÁRRATE DE LA TIROLESA!', arrow: 'right', r: 5, pass: 1, when: onFoot },
  // EL COLEGIO
  { type: 'prop', kind: 'campana', x: SCH + 9.5, y: 110 },
];

// ── EL PUEBLO: casas de adobe con techo de tejas (se cruzan por arriba) ──────
const CASAS = [[32, G - 4, 8, 4], [42, G - 5, 9, 5], [54, G - 4, 9, 4]];
// ── LA LAGUNA: huecos de agua helada en el hielo ([columna, ancho]) ─────────
const HUECOS = [[va(139), 2], [va(148), 5], [va(160), 8], [va(175), 3]];

const LEVEL = {
  name: 'LA MARATÓN DE LOS ANDES', w: SCH + 53, h: 150,
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
    // el cambio ocurre al bajar el río, donde el muro de follaje ya tapa casi todo el cielo
    x0: rio(4), x1: rio(20), anchorRow: 112,
    layers: [
      { kind: 'hills', color: '#8fb0a8', color2: '#7a9c96', y: 109.6, parallax: 0.08, vpar: 0.10, amp: 2.4, seed: 9 },
      { kind: 'canopy', color: '#5f8f6a', color2: '#4d7a5a', y: 110.6, parallax: 0.18, vpar: 0.24, amp: 2.2, seed: 13 },
      { kind: 'canopy', color: '#3f7a4c', color2: '#30623e', y: 111.6, parallax: 0.32, vpar: 0.40, amp: 1.8, seed: 17 },
      { kind: 'clouds', color: '#f4f6ee', parallax: 0.06, count: 7, seed: 4 },
    ],
  },
  spawn: { x: 6, y: G },
  goal: { x: SCH + 22, y: 110 },   // la flecha de "¡POR AQUÍ!" apunta acá al final
  // la gran montaña: silueta de fondo con nieve en lo alto (y el rellano de la laguna al este)
  mountain: { peakX: va(121), peakRow: 10, snowRow: 78, shape: mountainShape(va(121), 10, 150, SUMMIT, LAGUNA) },
  // cerro del que baja el huaico (tierra cálida); su ladera nace tras la última roca fija
  hill: { peakX: ce(244), peakRow: 89, slopeL: 0.75, slopeR: 2.1, x0: ce(232) },
  // EL CAÑÓN DEL VALLE: puente colgante inca con una gran catarata al fondo
  canyon: { x0: va(50), x1: va(64), rimRow: G - 2, fall: { x: va(57), top: G - 8 } },
  // LA SELVA: árboles, lianas y agua quieta (desde el río hasta el colegio)
  jungle: { x0: ce(252), x1: SCH + 4, fade: 16, waterRow: 112,
    trees: [rio(14), rio(36), rio(61), rio(84), rio(108), sx(5), sx(26), sx(35), sx(45), sx(53), sx(61), sx(68), sx(80), sx(90), sx(98), sx(106), sx(116)] },
  goatEnd: va(118), goatEndRow: SUMMIT,
  goatLedges: MTN.up.map(l => [l[0], l[2], l[1]]),   // [col, ancho, fila]: los pumas pronostican por aquí
  // al planear no puedes alejarte de la ladera este
  glide: { x0: ce(119), x1: ce(155.4) },   // a la derecha no pasa de la orilla: más allá está el precipicio del huaico
  glideLandRow: 100,   // la hoja solo se suelta al aterrizar por debajo de esta fila (el valle)
  altitude: { baseRow: G, baseM: 3650, perRow: 13 },
  // desde startM el oxígeno baja rápido (fast) hasta los síntomas (onset) y luego
  // despacio (rate, que crece con la altura): ~13 s quieto antes de desmayarte
  soroche: { startM: 3750, fast: 0.0025, onset: 0.3, rate: 0.0006, div: 600, maxMul: 2.5 },
  zones: [
    { x: 0,       name: 'EL PUEBLO', music: 'valle' },
    { x: va(0),   name: 'EL VALLE',  music: 'ayacucho' },
    { x: va(86),  name: 'EL APU',    music: 'apu', alt: true },
    // en la laguna el soroche da un respiro: el reto aquí es el hielo
    { x: va(125), name: 'LA LAGUNA', music: 'apu' },
    { x: ce(145), name: 'CEJA DE SELVA', music: 'huayco' },
    { x: ce(257), name: 'EL RÍO',    music: 'huayco' },
    { x: SV - 6,  name: 'LA SELVA',  music: 'selva' },
    { x: DS,      name: 'EL DOSEL',  music: 'selva' },
    { x: SCH,     name: 'EL COLEGIO', music: 'selva' },
  ],
  rects: [
    // ── EL PUEBLO: la calle empedrada y las casas que se cruzan por los techos ──
    [0, G, PUEBLO, 6, 'cobble'],
    [12, G - 1, 1, 1, 'pirca'],
    [30, G - 2, 2, 2, 'pirca'],   // escalón para subir al primer techo
    ...CASAS.map(([x, y, w, h]) => [x, y, w, h, 'adobe']),
    // ── EL VALLE ──
    [va(0), G, 38, 6, 'grass'],
    [va(15), G - 1, 1, 1, 'pirca'],
    [va(38), G - 2, 12, 8, 'grass'],
    [va(46), G - 3, 1, 1, 'pirca'], [va(47), G - 4, 1, 2, 'pirca'],
    // el cañón (x va(50)–va(63)): paredes de roca hasta el río del fondo
    [va(64), G - 2, 6, 8, 'grass'],
    [va(70), G, 31, 6, 'grass'],
    // ── LA CUMBRE ──
    [va(116), SUMMIT, 9, 1, 'summit'],
    // ── LA LAGUNA: orillas de nieve y la laguna congelada en medio ──
    [va(125), SUMMIT, 6, 8, 'snow'],
    [va(131), SUMMIT, 55, 2, 'ice'], [va(131), SUMMIT + 2, 55, 6, 'iceDeep'],
    [ce(116), SUMMIT, 9, 8, 'snow'],   // la orilla del platanal, al borde del precipicio
    // ── LA CEJA DE SELVA: el huaico (aterrizas en su orilla) ──
    [ce(145), 110, 12, 40, 'jungle'],
    [ce(160), 114, 22, 36, 'jungle'], [ce(182), 112, 22, 38, 'jungle'], [ce(204), 110, 22, 40, 'jungle'], [ce(226), 108, 20, 42, 'jungle'],
    // salida del huaico y bajada escalonada hasta el muelle del río
    [ce(246), 103, 11, 47, 'jungle'], [ce(257), 106, 4, 44, 'jungle'], [ce(261), 108, 4, 42, 'jungle'], [ce(265), 110, 4, 40, 'jungle'],
    // ── EL RÍO: tres tramos que bajan a saltos (los rápidos) y la playita del final ──
    [rio(0), 114, 46, 36, 'jungle'], [rio(46), 116, 44, 34, 'jungle'], [rio(90), 118, 28, 32, 'jungle'],
    [rio(118), 114, 4, 36, 'jungle'], [rio(122), 112, 2, 38, 'jungle'], [rio(124), 110, 6, 40, 'jungle'],
    // ── LA SELVA BAJA INUNDADA ──
    [SV, 118, SWID, 32, 'jungle'],                // fondo fangoso bajo el agua
    // parte 4: raíces de manglar que asoman
    [sx(95), 110, 2, 8, 'jungle'],
    // parte 5: la orilla de salida, que sube suave hacia la quebrada cálida
    [sx(114), 110, 6, 40, 'jungle'],
    // ── EL DOSEL: la orilla del primer árbol, la quebrada y la orilla del colegio ──
    [dos(0), 110, 12, 40, 'jungle'], [dos(11), 108, 1, 2, 'mudRock'],   // una piedra al borde: a pie no se cae a la quebrada sin querer
    [dos(12), 130, 92, 20, 'jungle'],
    [dos(104), 110, 6, 40, 'jungle'],
    // ── EL PUEBLO RIBEREÑO: el colegio ──
    [SCH, 110, 53, 40, 'jungle'],
  ],
  platforms: [
    ...MTN.up, ...MTN.alt,
    // puente colgante sobre el cañón
    [va(50), G - 2, 14, 'ropeBridge'],
    // ramas firmes de la selva (donde duermen los perezosos)
    [sx(43), 108, 4, 'branch'], [sx(54), 104, 4, 'branch'], [sx(65), 108, 4, 'branch'],
    // parte 4: un tronco caído hace de puente, y otro árbol con perezoso
    [sx(76), 111, 8, 'trunk'], [sx(98), 107, 4, 'branch'],
    // EL DOSEL: ramas en zigzag para subir al primer árbol (cada una 3 filas más arriba)
    [dos(8), 107, 4, 'branch'], [dos(2), 104, 4, 'branch'], [dos(8), 101, 4, 'branch'], [dos(2), 98, 4, 'branch'],
    // plataformas en las copas y los puentes colgantes que las unen
    [dos(1), DECK, 13, 'deck'], [dos(14), DECK, 14, 'ropeBridge'],
    [dos(28), DECK, 8, 'deck'], [dos(36), DECK, 14, 'ropeBridge'],
    [dos(50), DECK, 8, 'deck'], [dos(58), DECK, 14, 'ropeBridge'],
    [dos(72), DECK, 8, 'deck'],
  ],
  liquids: [
    // el río del fondo del cañón
    [va(50), G + 1, 14, 5, 'water', 1],
    // la laguna helada: el agua de los huecos (muy fría: te congela)
    ...HUECOS.map(([x, w]) => [x, SUMMIT, w, 2, 'lake', 0.2]),
    // el agua quieta de la selva
    [SV, 112, SWID - 6, 6, 'swamp', 0.15],
    // el huaico: cuatro escalones de lodo que bajan hacia el precipicio
    [ce(160), 111, 22, 3, 'mud', -1], [ce(182), 109, 22, 3, 'mud', -1], [ce(204), 107, 22, 3, 'mud', -1], [ce(226), 105, 20, 3, 'mud', -1],
    // el río: corre hacia la derecha y baja dos escalones (los rápidos)
    [rio(0), 110, 46, 4, 'water', 1.4], [rio(46), 112, 44, 4, 'water', 1.4], [rio(90), 114, 28, 4, 'water', 1.4],
    // el riachuelo del fondo de la quebrada, bajo los puentes del dosel
    [dos(12), 126, 92, 4, 'water', 1],
  ],
  // rocas fijas en cada escalón del huaico; la primera para entrar desde la
  // orilla y la última como peldaño para el salto final a la orilla del colegio
  // rocas que asoman del agua de la selva (se colocan después del agua: entran en ella)
  //   parte 1: rocas para aprender · parte 2: descanso entre victorias regias · parte 3: para salir si caes
  swampRocks: [[sx(3), 111, 2, 7], [sx(8), 111, 2, 7], [sx(13), 111, 2, 7], [sx(18), 111, 2, 7], [sx(40), 111, 2, 7], [sx(52), 111, 2, 7], [sx(63), 111, 2, 7],
               [sx(72), 111, 2, 7], [sx(103), 111, 2, 7], [sx(110), 111, 2, 7]],
  // piedras del río: asoman una fila sobre el agua y frenan la balsa (hay que saltarlas)
  riverRocks: [[rio(16), 109, 2, 5], [rio(58), 111, 2, 5], [rio(80), 111, 2, 5], [rio(108), 113, 2, 5]],
  fgRocks: [[ce(161), 111, 2, 3], [ce(180), 109, 2, 5], [ce(202), 107, 2, 5], [ce(224), 105, 2, 5], [ce(243), 104, 2, 4]],
  entities: [
    // ── EL PUEBLO ──
    // la casa del niño, con mamá en la puerta
    { type: 'house', x: 0, y: G },
    // la fiesta: banderines, la iglesia, el castillo de fuegos y puertas y ventanas de las casas
    { type: 'pueblo', casas: CASAS, iglesia: 72, castillo: 80, arco: 96, flags: [[13, 31, G - 6], [62, 92, G - 7]] },
    // danzantes de tijeras: bailan en la calle y de rato en rato dan un gran salto
    { type: 'danzante', x: 25, y: G, phase: 0 },
    { type: 'danzante', x: 73, y: G, phase: 40, flip: true },
    { type: 'danzante', x: 83, y: G, phase: 100 },
    // cohetes de la alborada clavados en los techos: se prenden y salen disparados
    { type: 'cohete', x: 46.5, y: G - 5, phase: 0 },
    { type: 'cohete', x: 58.5, y: G - 4, phase: 90 },
    { type: 'checkpoint', x: 66, y: G, help: 'SÁLTALO CUANDO ESTÉ ABAJO' },
    // ── EL VALLE ──
    { type: 'llama', x: va(10), y: G },
    // la tranquera del quipu (donde antes había una pirca): toca rojo, verde y amarillo
    { type: 'quipu', x: va(31), y: G, qx: va(23.5), sx: va(21), cords: [[va(24.75), 'amarillo'], [va(26.5), 'rojo'], [va(28.25), 'verde']], order: ['rojo', 'verde', 'amarillo'] },
    { type: 'bridge', x0: va(50), x1: va(64), row: G - 2 },
    { type: 'cabra', x: va(91), y: G },
    // puntos de control invisibles: uno al pie del cerro, junto a la cabra (si un
    // puma te tumba no vuelves a casa; ya montado, reapareces sobre ella), otro en la cumbre antes de la laguna
    { type: 'checkpoint', x: va(97), y: G, w: 4, help: 'SI EL PUMA MARCA UNA SALIENTE, ¡VE A LA OTRA!' },
    { type: 'checkpoint', x: ce(151), y: 110, w: 14, h: 10, help: 'SI CAES AL LODO: ¡SALTA, SALTA!' },   // toda la orilla donde aterriza el parapente
    // un solo punto de control en la selva: en la orilla, antes de entrar al agua
    { type: 'checkpoint', x: SV - 4, y: 110, w: 4, help: 'NO TE QUEDES MUCHO EN LAS HOJAS' },
    { type: 'rockfall', x: va(82), y: G - 13, interval: 130 },
    // ── LA LAGUNA ──
    // el glaciar del Apu al fondo y las apachetas de la orilla
    { type: 'laguna', x0: va(125), x1: ce(125), row: SUMMIT },
    { type: 'checkpoint', x: va(121), y: SUMMIT, help: 'FRENA ANTES DE SALTAR EL HUECO' },
    { type: 'iceplate', x: va(148), y: SUMMIT }, { type: 'iceplate', x: va(151), y: SUMMIT },
    { type: 'iceplate', x: va(161), y: SUMMIT }, { type: 'iceplate', x: va(164), y: SUMMIT },
    { type: 'checkpoint', x: ce(119), y: SUMMIT, help: '¡APÁRTATE CUANDO SE LANCE EL ÁGUILA!' },
    // en la orilla de la laguna crece un platanal: su hoja gigante sirve de parapente
    { type: 'leaf', x: ce(123), y: SUMMIT },
    ...EAGLES,
    // ── EL RÍO ──
    { type: 'checkpoint', x: ce(266), y: 110, w: 4, help: 'FRENA HASTA QUE SE CIERRE EL REMOLINO' },
    // la balsa espera amarrada junto al muelle; al final se queda en la playita
    { type: 'balsa', x: rio(0), y: 110, end: rio(116) },
    { type: 'remolino', x: rio(30.5), phase: 0 },
    { type: 'remolino', x: rio(69), phase: 120 },
    { type: 'remolino', x: rio(98), phase: 60 },
    // a mitad del río, ya montado: reapareces sobre la balsa
    { type: 'checkpoint', x: rio(49), y: 112, w: 4, h: 6, help: 'FRENA HASTA QUE SE CIERRE EL REMOLINO' },
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
    { type: 'huaico', x0: ce(160), x1: ce(246), interval: 135, speed: 0.75, inflow: { x: ce(239), top: 92 } },
    // casa al borde del huaico: se derrumba cuando pasas y la corriente se lleva su techo y sus vigas
    { type: 'collapseHouse', x: ce(213), y: 107 },
    // ── EL DOSEL ──
    // los árboles gigantes (lupunas) con sus copas, la quebrada y las lianas
    { type: 'dosel', x0: dos(0), x1: dos(104), trees: [[dos(6.5), 110], [dos(31.5), 126], [dos(53.5), 126], [dos(75.5), 126]], deck: DECK, water: 126 },
    { type: 'checkpoint', x: dos(4), y: 110, w: 4, help: 'ESPERA QUE EL MONO SE ALEJE' },
    { type: 'bridge', x0: dos(14), x1: dos(28), row: DECK },
    { type: 'bridge', x0: dos(36), x1: dos(50), row: DECK },
    { type: 'bridge', x0: dos(58), x1: dos(72), row: DECK },
    // monos maquisapa colgados de lianas: se mecen sobre los puentes
    { type: 'mono', x: dos(21), row: DECK, phase: 0 },
    { type: 'mono', x: dos(43), row: DECK, phase: 1.6 },
    { type: 'mono', x: dos(60), row: DECK, phase: 3.2 },
    { type: 'mono', x: dos(70), row: DECK, phase: 1.6 },
    { type: 'checkpoint', x: dos(53.5), y: DECK, w: 4, help: 'ESPERA QUE EL MONO SE ALEJE' },
    // la tirolesa: del último árbol baja hasta la orilla del colegio
    { type: 'tirolesa', x0: dos(78), y0: DECK, x1: dos(106), y1: 110 },
    // el colegio se cae a pedazos... la clase se da afuera, sentados en el suelo
    // profesores en huelga delante del colegio que está por caerse
    { type: 'striker', x: SCH + 1.5, y: 110, v: 0, sign: ['¡HUELGA!'] },
    { type: 'striker', x: SCH + 6.5, y: 110, v: 1, flip: true, sign: ['¡ARREGLEN', 'EL COLE!'] },
    { type: 'school', x: SCH + 14, y: 110 },
    { type: 'outdoorClass', x: SCH + 22, y: 110 },
    ...BIRDS,
    ...PUMAS,
    ...COCA,
    ...GUIA,
    // las 3 hojas de tarea que se le volaron al niño, enganchadas en el camino
    { type: 'page', x: va(47), y: G - 5 },                                        // sobre la pirca alta
    { type: 'page', x: MTN.up[19][0] - 5, y: MTN.up[19][1] - 6 },                 // en el aire, junto al risco
    { type: 'page', x: sx(55), y: 101 },                                          // en lo alto del árbol, sobre el perezoso
  ],
  decor: [
    ['maguey', 8, G - 1], ['cantuta', 21, G - 1], ['maguey', 64, G - 1], ['cantuta', 90, G - 1],
    ['cantuta', va(7), G - 1], ['ichu', va(12), G - 1], ['ichu', va(19), G - 1], ['maguey', va(27), G - 1],
    ['cantuta', va(35), G - 1], ['ichu', va(41), G - 3], ['ichu', va(66), G - 3], ['maguey', va(72), G - 1],
    ['ichu', va(78), G - 1], ['cantuta', va(85), G - 1],
    // ceja de selva: helechos y bambú
    ['fern', ce(146), 109], ['bamboo', ce(149), 109], ['fern', ce(154), 109],
    ['bamboo', ce(247), 102], ['fern', ce(250), 102], ['fern', ce(254), 102], ['bamboo', ce(262), 107],
    // el río y la orilla de la selva baja
    ['fern', rio(119), 113], ['bamboo', rio(125), 109], ['fern', rio(127), 109],
    // el dosel
    ['fern', dos(0), 109], ['bamboo', dos(10), 109], ['fern', dos(105), 109],
    // pueblo ribereño
    ['fern', SCH + 1, 109], ['bamboo', SCH + 3, 109], ['fern', SCH + 41, 109]
  ],
};

// ── Capítulos ───────────────────────────────────────────────────────────────
// Cada capítulo tiene su título, su objetivo (siempre llegar antes de las 8:00,
// cada uno con su razón) y su nivel. Los siguientes se agregan en orden con
// CHAPTERS.push desde su propio archivo (js/cap2.js, js/cap3.js...). Los huecos
// hasta CHAPTER_SLOTS aparecen en el menú como "PRÓXIMAMENTE".
// Campos opcionales (si faltan, se usa lo del Capítulo 1): dayStart (minutos),
// deathTitle, deathMsgs {tipo: texto}, win {...}, tips [...] (ver game.js).
const CHAPTER_SLOTS = 3;
const CHAPTERS = [{
  num: 1, title: 'LA MARATÓN DE LOS ANDES', short: 'LOS ANDES', color: '#8a6fa6',
  goal: '¡LLEGA AL COLE ANTES DE LAS 8:00!', goalShort: '¡ANTES DE LAS 8:00!',
  banner: ['LA MARATÓN DE LOS ANDES', '¡LLEGA A TIEMPO A CLASES!'],
  dayStart: 5 * 60 + 40,   // sale con la alborada de la fiesta: el camino (pueblo, laguna, río y dosel) es largo
  deathMsgs: {
    huaico: '¡TE LLEVÓ EL HUAICO, CAUSA!', mud: '¡TE LLEVÓ EL HUAICO, CAUSA!', water: '¡EL RÍO TE JALÓ, COMPADRE!',
    bird: '¡EL CÓNDOR TE CHOTEÓ!', eagle: '¡EL ÁGUILA TE LLEVÓ DE PIQUEO!', caiman: '¡EL CAIMÁN TE HIZO CEBICHE!',
    puma: '¡UN PUMA SE LLEVÓ A TU CABRA!', soroche: '¡EL SOROCHE TE TUMBÓ, HIJITO!', rock: '¡TE CAYÓ UN PEDRONÓN, HERMANITO!', fall: '¡TE FUISTE AL BARRANCO, PE!',
    cohete: '¡TE REVENTÓ EL COHETE, CAUSA!', tijeras: '¡EL DANZANTE TE BAILÓ ENCIMA!', lake: '¡TE CONGELASTE COMO MARCIANO!',
    remolino: '¡EL REMOLINO TE CHUPÓ, COMPADRE!', mono: '¡EL MONO SE CHOREÓ TU MOCHILA!', default: '¡CUIDADO, PUES!',
  },
  tips: ['LLAMA: TÓCALA PARA MONTARLA. CORRE Y SALTA MÁS.', 'CABRA: SALTA SOLA. TÚ SOLO LA GUÍAS.', 'HIELO: RESBALA. FRENA ANTES DE SALTAR.', 'HUAICO: SI CAES, PULSA SALTO MUY SEGUIDO.', 'BALSA: SALTA LAS PIEDRAS Y LOS REMOLINOS.'],
  level: buildLevel(LEVEL),
}];
