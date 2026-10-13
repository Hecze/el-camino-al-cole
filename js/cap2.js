// cap2.js — CAPÍTULO 2 · LA HACKATÓN EN LIMA. El niño viaja a Lima para la
// hackatón, pero el bus se malogra en pleno desierto de Ica. El viaje
// es la entrada; el capítulo pasa sobre todo en el Centro de Lima:
//   x 0–195    EL DESIERTO      · baja las dunas en tabla de sandboard; cactus y tubulares
//   x 196–315  LA PANAMERICANA  · el bus Ica–Lima por la costa: pueblos, playas del sur y el peaje
//   x 316–351  MIRAFLORES       · el malecón, el Parque del Amor y Larcomar; agarra el parapente
//   x 352–409  LA COSTA VERDE   · bajas planeando sobre el mar hasta la playa de piedritas
//   x 410–489  BARRANCO         · la Bajada de Baños, el Puente de los Suspiros y los murales
//   x 490–593  EN MOTOTAXI      · ¡lo manejas tú! baches, rampas y el tráfico de combis
//   x 594–673  JR. DE LA UNIÓN  · balcones de madera, buzones sin tapa y carretillas
//   x 674–733  PLAZA DE ARMAS   · Catedral, pileta, palomas, el grass y los húsares de Palacio
//   x 734–829  BARRIO CHINO     · portada china, toldos, farolitos, emolientero y cambistas
//   x 830–945  LAS AZOTEAS      · garúa, ladrillo, fierros, tanques, ropa tendida y perros chuscos
//   x 946–     LA CASONA        · la hackatón es en una casona colonial del Centro
// Todo lo propio del capítulo vive aquí: tiles, sprites, entidades, música y nivel.

(() => {
  'use strict';
  const TS = TILE;
  const GR = 56;            // fila de la pista (y del fondo de las dunas)
  const ST = 46;            // fila de la calle en el Centro de Lima
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
    'o': '#9a9086', 'O': '#7a7168', 'n': '#b8aea2', 'N': '#5e564e',           // lajas del Centro
    'W': '#4a2c16', 'u': '#7a4a26', 'U': '#5a3418', 'z': '#a8703c',           // madera de balcón y cajones
    'v': '#2f7a46', 'V': '#1f5a32', 'x': '#5aa86a',                           // tejas verdes de la portada china
    'i': '#c9b89c', 'I': '#a8977c', 'j': '#7e7264', 'J': '#e2d4ba',           // playa de piedritas de la Costa Verde
    'k': '#9a8468', 'L': '#7e6a52', 'M': '#b39c7c',                           // acantilado de conglomerado
    'S': '#5a9a4a', 'T': '#3f7a36', 'Q': '#d6cfc2',                           // grass del malecón y su sardinel
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
  // lajas de piedra del Centro (Jr. de la Unión, la Plaza y el Barrio Chino)
  T2.paving = tile([
    'nnnnnnnnnnnnnnnn', 'oooooooNoooooooN', 'oooooooNoooooooN', 'ooOoooONoooOoooN', 'NNNNNNNNNNNNNNNN',
    'oooNoooooooNoooo', 'oOoNoooooOoNoooo', 'oooNoooooooNoOoo', 'NNNNNNNNNNNNNNNN',
    'oooooooNoooooooN', 'ooooOooNoooooooN', 'oooooooNooooOooN', 'NNNNNNNNNNNNNNNN',
    'oooNoooooooNoooo', 'oooNooOooooNoooo', 'NNNNNNNNNNNNNNNN',
  ]);
  // techito de un balcón de cajón (se pisa desde abajo)
  T2.balc = tile(['WWWWWWWWWWWWWWWW', 'zzzzzzzzzzzzzzzz', 'uuuuuuuuuuuuuuuu', 'UuUUUuUUUuUUUuUU', 'WWWWWWWWWWWWWWWW']);
  // tejado verde de la portada china
  T2.tejado = tile(['VVVVVVVVVVVVVVVV', 'xvxvxvxvxvxvxvxv', 'vvvvvvvvvvvvvvvv', 'VvVVvVVvVVvVVvVV', 'rrrrrrrrrrrrrrrr', 'RRRRRRRRRRRRRRRR']);
  // cajones de fruta apilados en el Mercado Central
  T2.crate = tile([
    'WWWWWWWWWWWWWWWW', 'WzzzzzzzzzzzzzzW', 'WuuuuuuuuuuuuuuW', 'WWWWWWWWWWWWWWWW', 'WzzzzzzzzzzzzzzW', 'WuuuuuuuuuuuuuuW',
    'WWWWWWWWWWWWWWWW', 'WzzzzzzzzzzzzzzW', 'WuuuuuuuuuuuuuuW', 'WWWWWWWWWWWWWWWW', 'WzzzzzzzzzzzzzzW', 'WuuuuuuuuuuuuuuW',
    'WWWWWWWWWWWWWWWW', 'WzzzzzzzzzzzzzzW', 'WuuuuuuuuuuuuuuW', 'WWWWWWWWWWWWWWWW',
  ]);
  // la Costa Verde: playa de canto rodado y el acantilado de conglomerado
  T2.playa = tile([
    'JJiJJiiJJJiJiJJJ', 'iijiiIijiiiIjiii', 'iIjjiiiiijjiiIii', 'iiiiIijiiiiiiiji', 'ijiiiiiiIijjiiii', 'iiiIjiiiiiiiIiii',
    'iiiiiiijjiiiiiij', 'IiijiiiiiIiiijii', 'iiiiiIiiiiiiiiii', 'ijiiiiiijiiIiiii', 'iiiIiiiiiiiiijii', 'iiiiiijiiIiiiiii',
    'iIiiiiiiiiiijiii', 'iiiiijiiIiiiiiIi', 'ijiiiiiiiiijiiii', 'iiiIiiiiiiiiiiii',
  ]);
  T2.cliff = tile([
    'kkLkkkMkkkkjkkkk', 'kMkkjkkkLkkkkMkk', 'kkkkkkLkkMkkjkkk', 'LkkjkkkkkkkkkkLk', 'kkkkMkkjkkLkkkkk', 'kjkkkkkkkkkkMkjk',
    'kkkLkkkMkkjkkkkk', 'kkkkkjkkkkkkLkkk', 'MkkkkkkkLkkkkkjk', 'kkjkkMkkkkjkkkkk', 'kkkkkkkjkkkkMkkk', 'kLkkjkkkkkkLkkkk',
    'kkkkkkMkkjkkkkjk', 'kjkkLkkkkkkkMkkk', 'kkkkkkkjkkLkkkkk', 'kkMkkjkkkkkkkjkk',
  ]);
  T2.malecon = tile(['QQQQQQQQQQQQQQQQ', 'SSSSSSSSSSSSSSSS', 'STSSSSTSSSSSTSSS', 'TTTTTTTTTTTTTTTT'].concat([
    'kkLkkkMkkkkjkkkk', 'kMkkjkkkLkkkkMkk', 'kkkkkkLkkMkkjkkk', 'LkkjkkkkkkkkkkLk', 'kkkkMkkjkkLkkkkk', 'kjkkkkkkkkkkMkjk',
    'kkkLkkkMkkjkkkkk', 'kkkkkjkkkkkkLkkk', 'MkkkkkkkLkkkkkjk', 'kkjkkMkkkkjkkkkk', 'kkkkkkkjkkkkMkkk', 'kLkkjkkkkkkLkkkk']));
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
    paving:     { solid: true, top: T2.paving, body: T2.conc },
    balc:       { oneway: true, body: T2.balc },
    tejado:     { oneway: true, body: T2.tejado },
    crate:      { solid: true, top: T2.crate, body: T2.crate },
    playa:      { solid: true, top: T2.playa, body: T2.cliff },
    malecon:    { solid: true, top: T2.malecon, body: T2.cliff },
    bajada:     { solid: true, top: T2.paving, body: T2.brick },
    avenida:    { solid: true, top: T2.asphalt, body: T2.conc },
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

  // LIMEÑOS del Centro: un solo molde de 12x24 que se viste según el oficio.
  // h pelo o gorra · a piel · s camisa · v chaleco o casaca · b correa · p pantalón · z zapatos
  const MAN = [
    '....KKKK....', '...KhhhhK...', '..KhhhhhhK..', '..KhaaaaaK..', '..KaKaaKaK..', '..KaaaaaaK..',
    '...KaRRaK...', '....KaaK....', '..KvvssvvK..', '.KvvvssvvvK.', '.KvvvssvvvK.', '.KavvssvvaK.',
    '.KaKvssvKaK.', '...KbbbbK...', '...KppppK...', '...KppppK...', '...KpKKpK...', '...KpKKpK...',
    '...KpKKpK...', '...KpKKpK...', '...KpKKpK...', '..KzzKKzzK..', '..KzzKKzzK..', '..KKKKKKKK..',
  ];
  const MAN_TALK = MAN.map((r, i) => i === 6 ? '...KaKKaK...' : r);
  const MAN_STEP = MAN.map((r, i) => i >= 16 && i <= 20 ? ['...KpK.KpK..', '..KpK..KpK..', '..KpK...KpK.', '.KpK....KpK.', '.KpK....KpK.'][i - 16] : i >= 21 ? ['KzzK....KzzK', 'KzzK....KzzK', 'KKKK....KKKK'][i - 21] : r);
  const ROLES = {
    // húsar de Junín, la guardia de Palacio: casaca roja, correaje blanco, casco negro
    guard:    { h: '#1d1622', a: '#c98e62', s: '#f4efe4', v: '#b8282a', b: '#f4efe4', p: '#1f2a4a', z: '#1d1622' },
    // cambista: chaleco verde con su fotocheck, camisa blanca
    cambista: { h: '#2a1f2d', a: '#d9a070', s: '#f4efe4', v: '#2f8a4a', b: '#3a2412', p: '#3a3a52', z: '#3a2412' },
    // emolientero: mandil blanco sobre polo azul y gorrita
    emoliente:{ h: '#3f6fb8', a: '#b87a52', s: '#fffaf0', v: '#3f6fb8', b: '#fffaf0', p: '#4a4a5a', z: '#2a1f2d' },
    // cargador del mercado: polo naranja, gorra al revés
    cargador: { h: '#d8432f', a: '#a86a42', s: '#f0913c', v: '#f0913c', b: '#3a2412', p: '#2b4f86', z: '#2a1f2d' },
    // ambulante de golosinas: casaca celeste
    ambulante:{ h: '#3a2412', a: '#c98e62', s: '#f6c94a', v: '#7fb6d8', b: '#3a2412', p: '#5d5768', z: '#2a1f2d' },
    // mototaxista: gorra roja, polo amarillo y casaca abierta
    mototaxista: { h: '#c8322a', a: '#b87a52', s: '#f2c230', v: '#2b4f86', b: '#3a2412', p: '#3a3a52', z: '#2a1f2d' },
    // ciclista del malecón: polo verde fosforito
    ciclista: { h: '#2a1f2d', a: '#c98e62', s: '#7ae05a', v: '#7ae05a', b: '#2a1f2d', p: '#2a4a7a', z: '#2a1f2d' },
    // parapentista: casaca naranja, casco blanco
    parapentista: { h: '#f4efe4', a: '#c98e62', s: '#2a1f2d', v: '#f0913c', b: '#2a1f2d', p: '#3a3a52', z: '#2a1f2d' },
    // surfista: traje de neopreno negro con franja celeste
    surfista: { h: '#c9a24a', a: '#b87a52', s: '#5ac8e8', v: '#1d1622', b: '#1d1622', p: '#1d1622', z: '#b87a52' },
    // pintor de murales: overol azul, gorra roja
    pintor:   { h: '#d8432f', a: '#c98e62', s: '#f4efe4', v: '#3f6fb8', b: '#3f6fb8', p: '#3f6fb8', z: '#2a1f2d' },
    // el abuelito de Barranco: canoso, chompa marrón
    abuelo:   { h: '#e8e4dc', a: '#c98e62', s: '#f4efe4', v: '#7a4a26', b: '#3a2412', p: '#5d5768', z: '#2a1f2d' },
    // mozo del chifa: camisa blanca y chaleco negro
    mozo:     { h: '#1d1622', a: '#d9a070', s: '#fffaf0', v: '#1d1622', b: '#1d1622', p: '#1d1622', z: '#1d1622' },
    // guardián del parque: chaleco amarillo
    sereno:   { h: '#2a1f2d', a: '#b87a52', s: '#3a4a5c', v: '#f2d230', b: '#2a1f2d', p: '#3a4a5c', z: '#1d1622' },
  };
  const LIMENO = {};
  for (const r in ROLES) {
    const pal = Object.assign({ '.': null, K: '#2a1f2d', R: '#7a2a2a' }, ROLES[r]);
    LIMENO[r] = { idle: PIX.fromRows(MAN, pal), talk: PIX.fromRows(MAN_TALK, pal), step: PIX.fromRows(MAN_STEP, pal) };
  }

  // Modelos para los NPCs de la guía (js/guide.js): el limeño con lo suyo
  // (lanza, calculadora, carrito...) en el mismo cuadro. [quieto, hablando]
  const limenoModel = (role, W, H, px, extra) => () => [0, 1].map(k => {
    const c = PIX.createCanvas(W, H), ctx = c.getContext('2d'), S = LIMENO[role], py = H - 24;
    if (extra.back) extra.back(ctx, px, py, k);
    ctx.drawImage(k ? S.talk : S.idle, px, py);
    if (extra.front) extra.front(ctx, px, py, k);
    return c;
  });
  Object.assign(GUIDE.models, {
    // húsar de Palacio: lanza con banderín, casco con penacho; al hablar saluda
    husar: limenoModel('guard', 22, 34, 2, {
      back: (ctx, px, py) => { R(ctx, '#5d5768', px + 14, py - 8, 1, 32); R(ctx, '#c9a24a', px + 13, py - 10, 3, 3); R(ctx, '#d8432f', px + 15, py - 6, 5, 2); R(ctx, '#ffffff', px + 15, py - 4, 5, 2); R(ctx, '#d8432f', px + 15, py - 2, 5, 2); },
      front: (ctx, px, py, k) => { R(ctx, '#1d1622', px + 3, py - 4, 6, 4); R(ctx, '#c9a24a', px + 3, py - 1, 6, 1); R(ctx, '#d8432f', px + 5, py - 8, 2, 4); if (k) R(ctx, '#c98e62', px + 9, py - 2, 2, 6); },
    }),
    // cambista: calculadora en una mano, fajo de billetes en la otra, fotocheck
    cambista: limenoModel('cambista', 16, 24, 2, {
      front: (ctx, px, py, k) => { R(ctx, '#2a1f2d', px + 9, py + 10, 5, 6); R(ctx, '#9be7c4', px + 10, py + 11, 3, 2); R(ctx, '#7ab87a', px - 1, py + 11 - k, 4, 3); R(ctx, '#f6c94a', px + 7, py + 9, 2, 2); },
    }),
    // ambulante: la caja de golosinas colgada del cuello
    ambulante: limenoModel('ambulante', 14, 24, 1, {
      front: (ctx, px, py) => { R(ctx, '#2a1f2d', px - 1, py + 10, 14, 6); R(ctx, '#c8322a', px, py + 11, 12, 4); R(ctx, '#f6c94a', px + 1, py + 11, 2, 2); R(ctx, '#3f6fb8', px + 4, py + 11, 2, 2); R(ctx, '#9be7c4', px + 7, py + 11, 2, 2); R(ctx, '#ffffff', px + 10, py + 11, 1, 2); },
    }),
    // emolientero detrás de su carrito de jarras (emoliente, linaza, alfalfa); humea
    emoliente: limenoModel('emoliente', 40, 30, 0, {
      front: (ctx, px, py, k) => {
        const cx = 15, b = py + 24;
        R(ctx, '#2a1f2d', cx - 1, b - 14, 24, 2); R(ctx, '#3f6fb8', cx, b - 13, 22, 9); R(ctx, '#fffaf0', cx, b - 13, 22, 1);
        R(ctx, '#5d5768', cx + 2, b - 4, 2, 4); R(ctx, '#5d5768', cx + 18, b - 4, 2, 4);
        [['#8a4a1a', 0], ['#c9a24a', 6], ['#5a8a3a', 12], ['#8a4a1a', 17]].forEach(([c, ox]) => { R(ctx, '#dfe3e8', cx + 1 + ox, b - 22, 5, 8); R(ctx, c, cx + 2 + ox, b - 19, 3, 5); });
        for (const [sx, sy] of k ? [[17, 2], [24, 0], [31, 3]] : [[19, 3], [27, 1]]) R(ctx, 'rgba(255,255,255,0.75)', cx + sx - 15, sy, 2, 3);
      },
    }),
    // mototaxista: gorra roja, polo amarillo y casaca abierta
    mototaxista: { h: '#c8322a', a: '#b87a52', s: '#f2c230', v: '#2b4f86', b: '#3a2412', p: '#3a3a52', z: '#2a1f2d' },
    // mototaxista con su casco colgado del brazo
    mototaxista: limenoModel('mototaxista', 16, 24, 1, {
      front: (ctx, px, py, k) => { R(ctx, '#2a1f2d', px + 10, py + 10, 5, 4); R(ctx, '#f6c94a', px + 11, py + 10, 3, 2); if (k) R(ctx, '#b87a52', px - 1, py + 6, 2, 4); },
    }),
    // parapentista con su casco y las cuerdas del arnés
    parapentista: limenoModel('parapentista', 16, 24, 2, {
      front: (ctx, px, py, k) => { R(ctx, '#d8432f', px + 2, py + 13, 8, 2); if (k) R(ctx, '#c98e62', px + 10, py + 2, 2, 7); },
    }),
    // surfista con su tabla parada al lado
    surfista: limenoModel('surfista', 20, 30, 2, {
      back: (ctx, px, py) => { R(ctx, '#2a1f2d', px + 11, py - 6, 7, 30); R(ctx, '#f6c94a', px + 12, py - 5, 5, 28); R(ctx, '#d8432f', px + 14, py - 5, 1, 28); },
    }),
    // pintor con su brocha y manchas de pintura en el overol
    pintor: limenoModel('pintor', 16, 24, 1, {
      front: (ctx, px, py, k) => { R(ctx, '#f6c94a', px + 4, py + 15, 2, 2); R(ctx, '#d8432f', px + 7, py + 18, 2, 2); R(ctx, '#5c9f4a', px + 3, py + 11, 1, 2); R(ctx, '#6b4524', px + 11, py + (k ? 4 : 9), 1, 6); R(ctx, '#d8432f', px + 10, py + (k ? 2 : 7), 3, 3); },
    }),
    // el abuelito con su bastón
    abuelo: limenoModel('abuelo', 14, 24, 1, {
      front: (ctx, px, py) => { R(ctx, '#6b4524', px + 11, py + 8, 1, 16); R(ctx, '#6b4524', px + 9, py + 8, 3, 1); },
    }),
    // mozo del chifa con su secador al brazo
    mozo: limenoModel('mozo', 14, 24, 1, {
      front: (ctx, px, py) => { R(ctx, '#fffaf0', px + 10, py + 9, 3, 7); },
    }),
  });

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
        this.retired = true; this.vx = 0; this.rider.dismount(g, -4);
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
      if (this.state === 'warn') bubble(ctx, this.load === 'bici' ? '¡RIN RIN!' : '¡CUIDADO!', g.cam.x + VIEW.w - 34, this.row * TS - 44);
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
      for (let k = 0; k < 8; k++) { R(ctx, '#2b3a4a', 6 + k * 10, -37, 8, 9); R(ctx, '#7fa4c4', 7 + k * 10, -36, 3, 3); }
      R(ctx, '#2b3a4a', 86, -35, 7, 18); R(ctx, '#7fa4c4', 87, -34, 3, 6);   // parabrisas
      drawText(ctx, 'ICA - LIMA', 44, -26, { color: '#2b4f86', align: 'center' });
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
      if (!this.said && Math.abs(g.player.cx - this.cx) < 90) { this.said = true; this.sayT = 140; g.audio('shout'); }
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
  // pinturas de micro limeño: [carrocería, sombra, franja 1, franja 2, franja 3] (la primera, la del micro rojo de referencia)
  const COMBI_PAINT = [
    ['#d8261f', '#9a1a14', '#1f4fa8', '#3f86d8', '#f4f4f6'],
    ['#f2c230', '#b88a14', '#c8322a', '#1f8a4a', '#f4f4f6'],
    ['#1f8a4a', '#146032', '#f2c230', '#f4f4f6', '#c8322a'],
    ['#f4f1ea', '#c9c3b6', '#c8322a', '#1f4fa8', '#3f86d8'],
  ];
  const STOP_SHOUTS = ['¡SUBE, SUBE, HAY SITIO!', '¡LIMA, LIMA, LIMA!', '¡AL FONDO HAY SITIO!'];
  // Combi: el techo es una plataforma móvil (te lleva); el cuerpo, en marcha, te atropella.
  class Combi extends Actor {
    constructor(x, roadY, def) {
      super(x, roadY - 30, 62, 6);
      this.isMover = true; this.dx = 0; this.dy = 0; this.bodyH = 30; this.roadY = roadY;
      this.v = 2.4; this.vmax = 2.6; this.state = 'drive'; this.stopT = 0; this.t = 0; this.hazardKind = 'combi';
      this.stops = def.stops.map(s => ({ x: s.x * TS, wait: s.wait || 110, peaje: !!s.peaje })).filter(s => s.x > x + 31 + 4);
      this.end = def.end * TS; this.n = def.n || 0; this.paint = COMBI_PAINT[this.n % COMBI_PAINT.length]; this.sayT = 0; this.say = '';
    }
    onRespawn() { this.dead = true; }
    shout(g, text) { this.say = text; this.sayT = 130; if (g.near(this.cx, 280)) g.audio('shout'); }
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
            // (si vas en el techo no grita nada: un '¡BAJA!' confundía al jugador)
            if (!aboard) this.shout(g, next.peaje ? '¡PAGA EL PEAJE, CHOFER!' : STOP_SHOUTS[(this.t >> 3) % STOP_SHOUTS.length]); }
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
    // micro limeño de perfil, al estilo del de referencia: carrocería de color, franja
    // negra de ventanas con pasajeros, letrero de ruta, franjas en diagonal,
    // chofer al volante, puerta abierta con el cobrador y aros plateados
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y) + (this.v > 0.5 && Math.floor(this.t / 4) % 2 ? 1 : 0);
      const [c1, cS, s1, s2, s3] = this.paint;
      R(ctx, 'rgba(20,20,30,0.3)', x + 2, this.roadY - 2, 60, 3);
      // carrocería con esquinas redondeadas y techo
      R(ctx, c1, x + 1, y + 1, 59, 23); R(ctx, c1, x, y + 3, 62, 20); R(ctx, c1, x + 2, y, 56, 1);
      R(ctx, cS, x + 2, y, 56, 1); R(ctx, 'rgba(255,255,255,0.25)', x + 3, y + 1, 52, 1);
      // franja de ventanas (negra) con pasajeros en silueta
      R(ctx, '#1d1a22', x + 1, y + 3, 47, 10);
      for (let k = 0; k < 4; k++) {
        const wx = x + 3 + k * 9;
        R(ctx, '#46566a', wx, y + 4, 8, 8); R(ctx, '#6a7c92', wx, y + 4, 8, 1);
        const sx = wx + 1 + ((k * 3 + this.n) % 3);
        R(ctx, '#2a2a35', sx, y + 7, 3, 3); R(ctx, '#2a2a35', sx - 1, y + 10, 5, 2);   // cabeza y hombros
        if (k % 2 === 0) { R(ctx, '#2a2a35', sx + 4, y + 8, 2, 2); R(ctx, '#2a2a35', sx + 3, y + 10, 4, 2); }
      }
      // letrero de ruta bajo las ventanas
      R(ctx, '#1d1a22', x + 1, y + 13, 39, 2);
      for (let k = 3; k < 38; k += 3) if ((k * 7 + 3) % 5) R(ctx, '#e8e8e8', x + k, y + 13, 2, 1);
      // franjas en diagonal que cruzan el costado
      for (let r = 0; r < 9; r++) {
        const yy = y + 15 + r, x0 = x + 16 + (8 - r) * 3;
        R(ctx, s1, x0, yy, 9, 1); R(ctx, s2, x0 + 9, yy, 5, 1); R(ctx, s3, x0 + 14, yy, 3, 1);
      }
      R(ctx, s1, x + 46, y + 15, 14, 2);
      // nombre de la empresa: un trazo cursivo blanco
      R(ctx, '#ffffff', x + 5, y + 17, 9, 1); R(ctx, '#ffffff', x + 4, y + 18, 2, 1); R(ctx, '#ffffff', x + 9, y + 16, 2, 1);
      // puerta abierta con el cobrador colgado
      R(ctx, '#2a2530', x + 40, y + 4, 8, 19);
      const lean = this.state === 'stop' ? 3 : 1;
      R(ctx, '#3f6fb8', x + 44 + lean, y + 9, 4, 7); R(ctx, '#e7b089', x + 44 + lean, y + 5, 4, 4); R(ctx, '#1f1620', x + 44 + lean, y + 4, 4, 2);
      R(ctx, '#e7b089', x + 48 + lean, y + 7 - (Math.floor(this.t / 10) % 2) * 2, 3, 1);   // agita la mano
      // frente: parabrisas con el chofer al volante, número de ruta, faro y parachoques
      R(ctx, '#1d1a22', x + 50, y + 3, 11, 11); R(ctx, '#46566a', x + 51, y + 4, 9, 9); R(ctx, '#8fb3cf', x + 57, y + 5, 2, 3);
      R(ctx, '#e7b089', x + 52, y + 6, 3, 3); R(ctx, '#3f86d8', x + 52, y + 9, 4, 4); R(ctx, '#1f1620', x + 52, y + 5, 3, 1);
      R(ctx, '#f2c230', x + 52, y + 17, 4, 3); R(ctx, '#1d1a22', x + 53, y + 18, 2, 1);
      R(ctx, '#fff6b0', x + 59, y + 18, 3, 2); R(ctx, '#3a3640', x - 1, y + 23, 64, 2);
      // ruedas con aro plateado
      for (const wx of [11, 50]) {
        R(ctx, cS, wx + x - 6, y + 20, 12, 2);
        R(ctx, '#1d1622', wx + x - 4, y + 22, 8, 8); R(ctx, '#1d1622', wx + x - 5, y + 23, 10, 6);
        R(ctx, '#9aa0a8', wx + x - 2, y + 24, 4, 4); R(ctx, '#d6dbe0', wx + x - 1, y + 25, 2, 2);
      }
      if (this.sayT > 0) bubble(ctx, this.say, x + 46, y - 4);
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
      const bus = g.player.riding, near = bus && Math.abs(bus.x + bus.w / 2 - (this.x + this.w / 2)) < 160;   // al bus Ica–Lima también le abren
      const open = near || g.entities.some(e => e instanceof Combi && e.stoppedAtPeaje && e.stopT < 70);
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
  // ayuda en pantalla mientras caminas por la pista en un tramo
  class RoadHint {
    constructor(def) { this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.text = def.text; }
    hint(g) { const p = g.player; return p.onGround && !p.lastMover && p.cx > this.x0 && p.cx < this.x1 && p.y + p.h >= GR * TS - 1 ? [this.text] : null; }
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

  // Tienda de barrio de la avenida (un Tambo), calcada del pixel art de referencia:
  // poste, casa de ladrillo, la tienda con su letrero amarillo y logo morado,
  // segundo piso con ventanas de colores, el letrero rojo del hostal y un grifo.
  // La fachada está en celdas (60x44) que se agrandan x3; el logo va encima a
  // resolución completa. Es decorado de fondo: no choca. Su vereda apoya en la pista.
  const TAMBO_CELLS = [
    '..addddd..........................................adddrrrrdd',
    '..addddd..........................................aammrrrrdd',
    '..addddd..........................................aammrrrrdd',
    '..addddd..........................................almffDrrdd',
    '..addddd..........................................lamfEfrrdd',
    '..addddd.....e....................................aamfffmrdd',
    '..addddd....ee....................................aammmmmmaa',
    '..addddd....eee...e..................eee...eeee...aammmmmmaa',
    '..addddd...eeeee.ee.e................eeee.eeeeeee.aamfffmmaa',
    '..addddd..eeeeeeeeeeee...........e.eeeeeeeeeeeeee.aamfEfmmaa',
    '..addddd.eeeeeeeeeeeee....ee....eeeeeeeeeeeeeeeqq.aamfffmmaa',
    '.eadddddeeeeqqeeeeeeqqee.eeee.eeeeeeeeqqeeeeqqeqq.aammmmmmaa',
    'eeadddddeeehqqeeeeeeqqeeqqeeeeqqeeeeeeqqeeeeqqeeeeaammmmmmaa',
    'eeadddddehhheeeeeeeeeeeeqqeeeeqqeeeeeheeeeeeeeeeeeaamfffmmaa',
    'eeadddddheheheeeeuuueehheeeeAAAeeeehhhhhhhhttthhhealmfffmmaa',
    'edadddddededhhhehuuuhhehhheeAAAewwwhhBBBhhhttthehelammmmaaaa',
    'edadddddhdedeeeheuFueeheeehhAFAhwwwhhBBBeeetFteehhaaEEaaaaaa',
    'jjadddddjjjjhhhhhhhhhhhhhhhhhhhhwFwhhBFBhhhhhhhhhhaaaaaaaaaa',
    'ojadddddoooohhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhaaaaaaaaaa',
    'ojadddddoooohhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhaaaaaaaaaa',
    'jjadddddjjjjkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkaaaaaaaaaa',
    'ooadddddjookffffffffffffffffffffffffffffffffffffffkaaaaaaaaa',
    'ooadddddjooffffffffffffxxxxxxffxxxxfGGGffffffffffffaaaaaaaaa',
    'jjadddddjjjffffffffffffffGffffffGffGfffffffffffffffaaaaaaaaa',
    'ojadddddoooffffffffffffffffffffffffffGfffffffffffffaaaaaaaaa',
    'ojadddddooofffffffffffGfffffffffffffxffffffffffffffaaaaaaaaa',
    'jjadddddjjjfffffffffffffffGffffffffffffffffffffffffaaaaaaaaa',
    'ooadddddjoooffffffffffffffffffffffffffffffffffffffaaaaaaaaaa',
    'ooadddddjooobbbbbbbbbbbbbbbbbbbbbbbbbbbbccccccccccaavvvvaaaa',
    'jjadddddjjjjbbbbbbbbbbbbbbbbbbbbbbbbbbbbcgggggggggaavvHvalll',
    'ojadddddoooobiiiiiijiibbiiiiiiijiibbbbbbcgggggggggaavvvvalll',
    'ojadddddoooobiiiiiijjiIbiiiiiiijjibbbbbbcgggggggggaavvvvalll',
    'jjadddddjjjjbiiiiiiijjbbiiiiiiiijjbbbbbbcgggggggggaaaaaaalll',
    'ooadddddjooobiiiiiiiijbbiiiiiiiiijbbbbbbcgggggggggaaaaaaalll',
    'ooaynnnnjooobiiiiiiiiibbiiiiiiiiiibbbbbbcgggggggggaaaaaaalll',
    'jjaynnnnjjjjbbbbbbbbbbbbbbbbbbbbbbbbbbbbcgggggggggpaaaaaalll',
    'ojayssssoooobbbbbbbbbbbbbbbbbbbbbbbbbbbbcggggggggpppaaaaalll',
    'ojayssssoooobbbbbbbbbbbbbbbbbbbbbbbbbbbbcgggggggpppppaaaalll',
    'jjaynnnnjjjjbbbbbbbbbbbbbbbbbbbbbbbbbbbbcggggggggpppaaaaalll',
    'ooaynnnnoooobbbbbbbbbbbbbbbbbbbbbbbbbbbbcggggggggpppaaaaalll',
    'ccaynnnncccccccccccccccccccccccccccccccccccccccccCCCcccccccc',
    'ccadzzzzccccccccccccccccnnnnccccccccccccccccccccpppppccccccc',
    'ccadddddcccccccccccccccnnnnccccccccccccccccccccccccccccccccc',
    'ccadddddccccccccccccccnnnncccccccccccccccccccccccccccccccccc',
  ];
  const TAMBO_PAL = { '.': null, A: '#17effe', B: '#7be701', C: '#8a0320', D: '#d1c92a', E: '#1f02cf', F: '#030003', G: '#ffe85a', H: '#1e0a73', I: '#9d70da', a: '#c6c6c4', b: '#bc61dd', c: '#e0e0e0', d: '#aaaaa8', e: '#c6b056', f: '#ffef3e', g: '#3a3a3a', h: '#eccf65', i: '#62e0f5', j: '#ffffff', k: '#c3b417', l: '#232323', m: '#d01700', n: '#f4f4bb', o: '#db6b1d', p: '#c90022', q: '#504e4a', r: '#a41208', s: '#696862', t: '#44ffb7', u: '#488c01', v: '#13018b', w: '#019be7', x: '#ffe676', y: '#faf7d1', z: '#8e8e8e' };
  const TAMBO_LOGO = [
    '.....................................................####',
    '..##########.#########..#...##.##########.#########..##.#',
    '..#########.####.#####.###.###.##########.####.####..##.#',
    '..#########.####..###..###.###..####.####.####.####..####',
    '.##########.###..####..#######..###..####.####.#####.....',
    '.#########..###..####.#########.####..###..####.####.....',
    '##########.##########.#########..########..####.####.....',
    '.########..#########.##########..########..####.####.....',
    '..####....####..####.###########.####.####..###..###.....',
    '..####.#######.####..###########.####..###..####.####....',
    '..####.#######.####.#############.####.####.####.####....',
    '.####..######..###..####.###.####.####.####..########....',
    '..###..######.####..###..###..###..########...#######....',
  ];
  let tamboImg = null;
  function tamboSprite() {
    if (tamboImg) return tamboImg;
    const base = PIX.scaled(PIX.fromRows(TAMBO_CELLS, TAMBO_PAL), 3);
    const c = PIX.createCanvas(base.width, base.height), x = c.getContext('2d');
    x.drawImage(base, 0, 0);
    x.drawImage(PIX.fromRows(TAMBO_LOGO, { '.': null, '#': '#b24fd8' }), 65, 68);
    return (tamboImg = c);
  }
  class TamboStore extends Actor {
    constructor(def) { super(def.x * TS, ST * TS - 132, 180, 132); }
    update() {}
    draw() {}
    drawBack(ctx) { ctx.drawImage(tamboSprite(), Math.round(this.x), ST * TS - 132); }
  }

  // ── EL CENTRO DE LIMA ───────────────────────────────────────────────────────
  // CASONA colonial de fondo: fachada pintada (amarillo, celeste, rosado...),
  // cornisa, ventanas con reja y portón de madera. No choca: es decorado.
  // Sus balcones son entidades aparte (Balcon) y SÍ se pisan.
  class Casona extends Actor {
    constructor(def) { super(def.x0 * TS, def.top * TS, (def.x1 - def.x0) * TS, (ST - def.top) * TS); this.col = def.col; this.sign = def.sign; this.seed = def.x0; this.door = def.door !== false; }
    update() {}
    drawBack(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w, b = ST * TS, c = this.col;
      R(ctx, c, x, y, w, b - y);
      R(ctx, 'rgba(0,0,0,0.10)', x + w - 3, y, 3, b - y);                 // canto en sombra
      R(ctx, 'rgba(255,255,255,0.35)', x, y, w, 2); R(ctx, '#fffaf0', x - 1, y - 3, w + 2, 3); R(ctx, 'rgba(0,0,0,0.18)', x - 1, y, w + 2, 1);   // cornisa blanca
      R(ctx, 'rgba(0,0,0,0.12)', x, b - 10, w, 10);                       // zócalo
      // pilastras
      for (const px of [x + 2, x + w - 6]) { R(ctx, 'rgba(255,255,255,0.25)', px, y + 2, 4, b - y - 12); }
      // ventanas del primer piso con reja (si no hay portón)
      const nWin = Math.max(1, Math.floor((w - 16) / 40));
      for (let k = 0; k < nWin; k++) {
        const wx = x + 12 + k * ((w - 24) / nWin) + ((w - 24) / nWin - 14) / 2, wy = b - 34;
        if (this.door && k === Math.floor(nWin / 2)) continue;
        R(ctx, '#2a2230', wx, wy, 14, 20); R(ctx, '#3a4a5c', wx + 1, wy + 1, 12, 18);
        for (let r = 2; r < 14; r += 3) R(ctx, '#1d1622', wx + r, wy, 1, 20);
        R(ctx, '#fffaf0', wx - 2, wy - 2, 18, 2);
      }
      // ventanas altas (detrás de los balcones o solas, con persiana)
      for (let k = 0; k < Math.floor(w / 36); k++) {
        const wx = x + 10 + k * 36, wy = y + 10;
        if (wy + 18 > b - 40) break;
        R(ctx, '#fffaf0', wx - 2, wy - 2, 16, 2); R(ctx, '#5a4030', wx, wy, 12, 18); R(ctx, '#7a5a40', wx + 1, wy + 1, 4, 16); R(ctx, '#7a5a40', wx + 7, wy + 1, 4, 16);
      }
      // portón de madera con clavos, en arco
      if (this.door) {
        const dx = Math.round(x + w / 2 - 11);
        R(ctx, '#fffaf0', dx - 3, b - 44, 28, 44); R(ctx, '#4a2c16', dx, b - 40, 22, 40); R(ctx, '#4a2c16', dx + 3, b - 43, 16, 3);
        R(ctx, '#2a1a0e', dx + 10, b - 40, 2, 40);
        for (let r = 0; r < 4; r++) for (const nx of [dx + 4, dx + 16]) R(ctx, '#c9a24a', nx, b - 34 + r * 8, 2, 2);
      }
      if (this.sign) {
        const tw = textWidth(this.sign) + 8, sx = Math.round(x + w / 2 - tw / 2), sy = b - 72;
        R(ctx, '#1d1622', sx - 1, sy - 1, tw + 2, 11); R(ctx, '#fff3d6', sx, sy, tw, 9);
        drawText(ctx, this.sign, x + w / 2, sy + 1, { color: '#8f1f1a', align: 'center' });
      }
    }
    draw() {}
  }

  // BALCÓN DE CAJÓN: la caja de madera tallada con celosía, colgada de la
  // fachada. Su techito es una plancha que se pisa (el tile 'balc').
  class Balcon extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS, def.w * TS, 8); this.col = def.col || '#5a3418'; }
    update() {}
    drawBack(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y) + 5, w = this.w, c = this.col;
      R(ctx, 'rgba(0,0,0,0.25)', x + 2, y, w - 2, 20);                       // sombra en la pared
      R(ctx, c, x + 1, y, w - 2, 16);
      // celosía: rombitos de madera
      for (let yy = y + 2; yy < y + 10; yy += 3) for (let xx = x + 4 + ((yy >> 1) % 2) * 2; xx < x + w - 4; xx += 4) R(ctx, 'rgba(255,230,180,0.3)', xx, yy, 2, 1);
      for (let k = x + 3; k < x + w - 3; k += 12) R(ctx, 'rgba(0,0,0,0.3)', k, y + 1, 1, 10);   // montantes
      R(ctx, 'rgba(0,0,0,0.25)', x + 1, y + 11, w - 2, 1);
      for (let k = x + 4; k < x + w - 4; k += 6) R(ctx, 'rgba(255,230,180,0.2)', k, y + 12, 3, 3);   // tableros de abajo
      R(ctx, '#2a1a0e', x, y + 16, w, 2);
      // canes (las ménsulas que lo sostienen)
      for (const k of [x + 3, x + w - 7]) { R(ctx, c, k, y + 18, 4, 3); R(ctx, c, k + 1, y + 21, 2, 3); }
    }
    draw() {}
  }

  // BUZÓN SIN TAPA: hueco en la vereda. La tapa está a un lado y alguien
  // dejó un cono. Si caes, pierdes.
  class Buzon extends Actor {
    constructor(def) { super(def.x * TS, ST * TS, def.w * TS, TS); this.hazardKind = 'buzon'; }
    update() {}
    hazardBox() { return { x: this.x + 3, y: this.y + 6, w: this.w - 6, h: 10 }; }
    drawBack(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      R(ctx, '#141018', x, y, this.w, TS); R(ctx, '#2a2530', x, y, this.w, 2);
      for (let k = 0; k < this.w; k += 3) R(ctx, '#3a3442', x + k, y + 4 + (k % 2) * 6, 1, 1);
    }
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      // la tapa, apoyada al lado del hueco
      R(ctx, '#2a2530', x - 7, y - 11, 5, 11); R(ctx, '#4a4452', x - 6, y - 10, 3, 9); R(ctx, '#2a2530', x - 5, y - 8, 1, 1);
      // el cono naranja
      const cx = x + this.w + 4;
      R(ctx, '#d8632f', cx, y - 10, 4, 10); R(ctx, '#d8632f', cx - 1, y - 5, 6, 5); R(ctx, '#fffaf0', cx, y - 7, 4, 2); R(ctx, '#2a1f2d', cx - 2, y - 1, 8, 1);
    }
  }

  // CARRETILLA del mercado: un cargador la empuja a toda velocidad por la
  // calle. Antes de entrar grita y aparece un "!" en el borde. Sáltala.
  class Carretilla extends Actor {
    constructor(def) { const row = def.y || ST; super(-9999, row * TS - 24, 40, 24); this.row = row; this.x0 = def.x0 * TS; this.x1 = def.x1 * TS; this.speed = def.speed || 1.6; this.load = def.load || 'papa'; this.gap = def.gap || 240; this.delay = def.delay || 0; this.hazardKind = this.load === 'bici' ? 'bici' : 'carretilla'; this.onRespawn(); }
    // al reaparecer cambia un poco cuándo salen (igual para la pareja), así no te pilla siempre en el mismo sitio
    onRespawn(g) {
      this.state = 'wait'; this.t = 0; this.cd = 70 + this.delay + (g ? (g.deaths * 37) % 60 : 0); this.x = -9999;
      // si te atropellan seguido aquí, el tramo se afloja: va más lento y sale uno solo
      if (g && g.lastDeath === this.hazardKind && g.player.cx > this.x0 - 80 && g.player.cx < this.x1) this.fails = (this.fails || 0) + 1;
      this.easy = (this.fails || 0) >= 3;
    }
    update(g) {
      this.t++;
      const p = g.player, inZone = p.cx > this.x0 && p.cx < this.x1;
      if (this.state === 'wait') {
        if (this.easy && this.delay) return;
        if (inZone && --this.cd <= 0 && g.cam.x + VIEW.w < this.x1 + 60) { this.state = 'warn'; this.t = 0; g.audio('shout'); if (this.load === 'bici') g.audio('bell'); }
        return;
      }
      if (this.state === 'warn') { if (this.t > 60) { this.state = 'drive'; this.t = 0; this.x = g.cam.x + VIEW.w + 6; } return; }
      this.x -= this.speed * (this.easy ? 0.75 : 1);
      if (this.t % 6 === 0) g.particles.push({ x: this.x + 36, y: this.row * TS - 1, vx: 0.4, vy: -0.3, life: 14, max: 14, col: '#b8aea2', size: 1, grav: 0 });
      if (this.x + this.w < g.cam.x - 40 || this.x < this.x0 - 200) { this.state = 'wait'; this.cd = this.gap; this.x = -9999; }
    }
    hazardBox() { return this.state === 'drive' ? { x: this.x + 2, y: this.y + 9, w: this.w - 4, h: this.h - 9 } : null; }
    draw(ctx, g) {
      if (this.state === 'warn' && Math.floor(this.t / 5) % 2 === 0) {
        const ex = g.cam.x + VIEW.w - 12, ey = this.row * TS - 40;
        drawText(ctx, '!', ex, ey, { scale: 2, color: '#ffffff', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
      }
      if (this.state !== 'drive') return;
      const x = Math.round(this.x), b = this.row * TS, bob = Math.floor(this.t / 4) % 2;
      if (this.load === 'bici') {
        // ciclista de la ciclovía: casco, polo y la bici a toda velocidad
        const leg = Math.floor(this.t / 4) % 2;
        for (const wx of [x + 5, x + 23]) { R(ctx, '#1d1622', wx - 5, b - 10, 10, 10); R(ctx, '#9aa0a8', wx - 3, b - 8, 6, 6); R(ctx, '#1d1622', wx - 1, b - 6, 2, 2); }
        R(ctx, '#d8432f', x + 5, b - 9, 18, 2); R(ctx, '#d8432f', x + 13, b - 15, 2, 7); R(ctx, '#2a1f2d', x + 4, b - 15, 4, 2);
        ctx.save(); ctx.beginPath(); ctx.rect(x + 8, b - 32, 14, 17); ctx.clip(); ctx.drawImage(flipS(LIMENO.ciclista.idle), x + 9, b - 31); ctx.restore();
        R(ctx, '#2a4a7a', x + 12 + leg * 2, b - 15, 2, 6); R(ctx, '#2a4a7a', x + 16 - leg * 2, b - 15, 2, 6);
        R(ctx, '#f6c94a', x + 10, b - 33, 8, 3);   // casco
        return;
      }
      // la carga: sacos de papa o una ruma de naranjas
      if (this.load === 'papa') { for (const [sx, sy] of [[2, 8], [11, 8], [20, 8], [6, 3], [15, 3]]) { R(ctx, '#2a1f2d', x + sx - 1, b - 14 - sy - 1, 10, 7); R(ctx, '#c9a978', x + sx, b - 14 - sy, 8, 5); R(ctx, '#a88a5a', x + sx + 3, b - 14 - sy, 1, 5); } }
      else { for (let k = 0; k < 9; k++) { const ox = 3 + (k % 4) * 6 + (k >= 4 ? 3 : 0) + (k >= 7 ? 3 : 0), oy = k < 4 ? 4 : k < 7 ? 9 : 14; R(ctx, '#2a1f2d', x + ox - 1, b - 14 - oy - 1, 6, 6); R(ctx, '#f0913c', x + ox, b - 14 - oy, 4, 4); R(ctx, '#ffd08a', x + ox, b - 14 - oy, 1, 1); } }
      // la plataforma, la vara y la rueda
      R(ctx, '#2a1f2d', x, b - 15, 30, 4); R(ctx, '#a8703c', x + 1, b - 14, 28, 2);
      R(ctx, '#5a3418', x + 28, b - 15, 9, 2);
      R(ctx, '#1d1622', x + 10, b - 11, 10, 10); R(ctx, '#8a8296', x + 13, b - 8, 4, 4); R(ctx, '#1d1622', x + 14, b - 7, 2, 2);
      // el cargador empujando, inclinado
      ctx.drawImage(flipS(bob ? LIMENO.cargador.step : LIMENO.cargador.idle), x + 30, b - 24 - bob);
    }
  }

  // PALOMAS de la Plaza: picotean en el suelo y salen volando cuando pasas.
  class Palomas extends Actor {
    constructor(def) { const row = def.y || ST; super(def.x0 * TS, row * TS - 6, (def.x1 - def.x0) * TS, 6); this.row = row; this.gull = def.kind === 'gaviota'; this.n = def.n || 7; this.onRespawn(); }
    onRespawn() {
      this.birds = [];
      for (let i = 0; i < this.n; i++) this.birds.push({ x: this.x + 6 + h2(this.x + i * 7) * (this.w - 12), y: this.row * TS, vx: 0, vy: 0, fly: false, f: h2(i * 3 + this.x) > 0.5 ? 1 : -1, t: i * 13, away: 0 });
    }
    update(g) {
      const p = g.player; let flap = false;
      for (const b of this.birds) {
        b.t++;
        if (!b.fly) {
          const near = Math.abs(p.cx - b.x) < 30 + Math.abs(p.vx) * 8 && Math.abs(p.y + p.h - b.y) < 40;
          if (near) { b.fly = true; b.vx = (b.x < p.cx ? -1 : 1) * (0.8 + Math.random() * 1.2); b.vy = -1.6 - Math.random() * 1.4; b.f = Math.sign(b.vx); flap = true; }
          else if (b.t % 90 === 0) b.f = -b.f;
          else if (b.t % 40 < 6) b.x += b.f * 0.25;
        } else {
          b.x += b.vx; b.y += b.vy; b.vy = Math.max(-2.4, b.vy - 0.03); b.vx *= 1.01; b.away++;
          // vuelven cuando ya pasaste
          if (b.away > 420 && Math.abs(p.cx - this.cx) > 260) { b.fly = false; b.away = 0; b.y = this.row * TS; b.x = this.x + 6 + Math.random() * (this.w - 12); b.vx = 0; b.vy = 0; }
        }
      }
      if (flap && g.near(this.cx, 300)) { g.audio('flap'); for (let i = 0; i < 5; i++) g.particles.push({ x: p.cx + (Math.random() - 0.5) * 30, y: this.row * TS - 6, vx: (Math.random() - 0.5) * 1.2, vy: -0.4 - Math.random(), life: 40, max: 40, col: '#c9ccd4', size: 1, grav: 0.02 }); }
    }
    draw(ctx) {
      for (const b of this.birds) {
        const x = Math.round(b.x), y = Math.round(b.y);
        if (b.fly && b.y < this.y - 400) continue;
        if (!b.fly) {
          const peck = b.t % 50 < 8;
          R(ctx, this.gull ? '#f4efe4' : '#7d8290', x - 3, y - 4, 6, 3); R(ctx, this.gull ? '#8a8f9a' : '#5d6270', x - 3 - b.f, y - 3, 2, 2);   // cuerpo y cola
          const hx = x + b.f * 3 + (b.f < 0 ? -1 : 0);
          R(ctx, this.gull ? '#f4efe4' : '#4f8a7a', hx - (b.f < 0 ? 0 : 1), y - 5 + (peck ? 3 : 0), 2, 2); R(ctx, this.gull ? '#ffffff' : '#5d6270', hx, y - 6 + (peck ? 3 : 0), 2, 2);   // cuello tornasol y cabeza
          R(ctx, '#d89a5a', hx + b.f, y - 5 + (peck ? 3 : 0), 1, 1);
          R(ctx, '#c8524a', x - 1, y - 1, 1, 1); R(ctx, '#c8524a', x + 1, y - 1, 1, 1);
        } else {
          const up = Math.floor(b.t / 4) % 2;
          R(ctx, this.gull ? '#f4efe4' : '#7d8290', x - 2, y - 2, 5, 2); R(ctx, this.gull ? '#ffffff' : '#5d6270', x + b.f * 3, y - 3, 2, 2);
          R(ctx, this.gull ? '#c9ccd4' : '#9ca0ac', x - 4, y - (up ? 5 : 1), 4, 2); R(ctx, '#9ca0ac', x + 1, y - (up ? 5 : 1), 4, 2);
        }
      }
    }
  }

  // EL GRASS de la Plaza: si lo pisas, el guardián te pita. No pasa nada más.
  // el megáfono del ambulante: suena más fuerte mientras más cerca pasas (VOICE.ambient)
  class Megafono extends Actor {
    // r: hasta dónde se oye; full: a esta distancia suena a todo volumen
    constructor(def) { super(0, 0, 0, 0); this.xs = def.xs.map(x => x * TS); this.r = (def.r || 45) * TS; this.full = (def.full || 15) * TS; }
    update(g) {
      const px = g.player.cx, d = Math.min(...this.xs.map(x => Math.abs(px - x)));
      const v = Math.max(0, Math.min(1, (this.r - d) / (this.r - this.full)));
      if (v > 0) VOICE.ambient('ambulante', v * 0.7);
    }
    draw() {}
  }
  class Grass extends Actor {
    constructor(def) { super(def.x0 * TS, ST * TS - 3, (def.x1 - def.x0) * TS, 3); this.t = 0; this.told = false; this.sayT = 0; }
    onRespawn() { this.told = false; }
    update(g) {
      this.t++; if (this.sayT > 0) this.sayT--;
      const p = g.player;
      if (!this.told && p.onGround && p.cx > this.x && p.cx < this.x + this.w && p.y + p.h >= ST * TS - 1) {
        this.told = true; this.sayT = 160; g.audio('whistle');
      }
    }
    draw(ctx) {
      const x = Math.round(this.x), b = ST * TS;
      for (let k = 0; k < this.w; k += 2) { const hgt = 2 + Math.round(h2(x + k) * 2); R(ctx, '#3f8a3a', x + k, b - hgt, 2, hgt); if (h2(k + x * 3) > 0.8) R(ctx, '#f6c94a', x + k, b - hgt - 1, 1, 1); }
      R(ctx, '#2f6a2a', x, b - 1, this.w, 1);
      // cartelito clavado
      const sw = textWidth('NO PISAR') + 6, sx = x + 10;
      R(ctx, '#6b4524', sx + sw / 2 - 1, b - 14, 2, 12); R(ctx, '#1d1622', sx - 1, b - 23, sw + 2, 11); R(ctx, '#fffaf0', sx, b - 22, sw, 9);
      drawText(ctx, 'NO PISAR', sx + sw / 2, b - 21, { color: '#2f6a2a', align: 'center' });
      // el guardián, al final del jardín
      const gx = x + this.w + 4, talking = this.sayT > 0;
      ctx.drawImage(flipS(talking && Math.floor(this.t / 8) % 2 ? LIMENO.sereno.talk : LIMENO.sereno.idle), gx, b - 24);
      if (talking) { R(ctx, '#c9c9d4', gx + 1, b - 18, 3, 2); bubble(ctx, '¡PIIIT!', gx + 6, b - 30, '#d8432f'); }
    }
  }

  // PILETA de bronce de la Plaza de Armas: dos tazas que se pisan
  // (los bloques invisibles van en el nivel) y el agua que salta.
  class Pileta extends Actor {
    constructor(def) { super(def.x * TS, (ST - 4) * TS, 9 * TS, 4 * TS); this.t = 0; this.wet = 0; }
    update(g) {
      this.t++; if (this.wet > 0) this.wet--;
      const cx = this.cx, top = this.y - 18;
      if (this.t % 3 === 0 && g.near(cx, 260)) for (const s of [-1, 1]) g.particles.push({ x: cx + s * 2, y: top, vx: s * (0.5 + Math.random() * 0.6), vy: -1.2 - Math.random() * 0.8, life: 34, max: 34, col: Math.random() < 0.5 ? '#d2f6f2' : '#8cdde6', size: 1, grav: 0.1 });
      // si te paras en la taza de arriba te salpica
      const p = g.player;
      if (p.onGround && Math.abs(p.cx - cx) < 22 && p.y + p.h <= this.y + 2 && this.wet === 0) { this.wet = 120; g.audio('splash'); g.burst(p.cx, p.y + 4, 'splash', 12); }
    }
    drawBack(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y), b = ST * TS, w = this.w, t = this.t;
      const BR = '#6a5a32', BL = '#a8984a', BD = '#3e3420', VG = '#5a8a6a';   // bronce, brillo, sombra y pátina
      // la poza de piedra (2 filas): borde claro, bloques y el agua adentro
      R(ctx, '#8a8072', x, b - 32, w, 32); R(ctx, '#cfc6b8', x, b - 32, w, 3); R(ctx, '#6e655a', x, b - 4, w, 4);
      for (let k = 0; k < w; k += 16) R(ctx, '#6e655a', x + k, b - 28, 1, 24);
      R(ctx, '#6e655a', x, b - 18, w, 1);
      R(ctx, '#5fb0c0', x + 3, b - 29, w - 6, 2); R(ctx, '#bdeef2', x + 6 + (t >> 2) % 30, b - 29, 8, 1); R(ctx, '#bdeef2', x + 80 + (t >> 2) % 30, b - 29, 6, 1);
      // fuste de bronce
      R(ctx, BD, x + 66, y + 28, 12, b - 32 - y - 28 + 2); R(ctx, BR, x + 68, y + 28, 6, b - 32 - y - 28); R(ctx, VG, x + 69, y + 30, 2, 8);
      // la taza de bronce: ancha arriba y angosta abajo
      for (let r = 0; r < 28; r++) { const hw = Math.round(26 - r * 0.6); R(ctx, r < 3 ? BL : r % 7 === 3 ? VG : BR, x + 72 - hw, y + r, hw * 2, 1); R(ctx, BD, x + 72 + hw - 2, y + r, 2, 1); }
      R(ctx, '#5fb0c0', x + 49, y + 1, 46, 1);
      // chorritos que caen de la taza a la poza
      for (const cx of [x + 46, x + 97]) for (let k = 0; k < 4; k++) R(ctx, '#bdeef2', cx + (k % 2), y + 2 + ((t + k * 7) % 28), 1, 3);
      // la Fama con su trompeta, en lo alto
      const fx = x + 72;
      R(ctx, BD, fx - 3, y - 6, 6, 6); R(ctx, BR, fx - 2, y - 14, 4, 8); R(ctx, BR, fx - 2, y - 18, 4, 4);
      R(ctx, BL, fx + 2, y - 17, 7, 1); R(ctx, BL, fx + 8, y - 18, 2, 3);
      R(ctx, BR, fx - 8, y - 14, 6, 2); R(ctx, BR, fx - 10, y - 16, 3, 2);   // alas
    }
    draw() {}
  }

  // TELÓN DE LA PLAZA: Catedral (izquierda) y Palacio de Gobierno con su reja.
  class PlazaFondo extends Actor {
    constructor(def) { super(def.x0 * TS, 0, (def.x1 - def.x0) * TS, 8); this.cat = def.cat; this.pal = def.pal; this.t = 0; }
    update() { this.t++; }
    drawBack(ctx) {
      const b = ST * TS;
      // CATEDRAL: dos torres con campanario y el portón labrado al centro
      const c0 = this.cat[0] * TS, c1 = this.cat[1] * TS, cw = c1 - c0, stone = '#d9c08a', shade = '#b89c6a';
      R(ctx, stone, c0 + 40, b - 120, cw - 80, 120);
      R(ctx, shade, c0 + 40, b - 120, cw - 80, 3);
      for (const tx of [c0, c1 - 44]) {
        R(ctx, stone, tx, b - 170, 44, 170); R(ctx, shade, tx + 40, b - 170, 4, 170);
        R(ctx, '#fffaf0', tx - 2, b - 172, 48, 3); R(ctx, '#fffaf0', tx - 2, b - 118, 48, 3);
        R(ctx, '#3a3442', tx + 14, b - 160, 16, 26); R(ctx, '#c9a24a', tx + 19, b - 148, 6, 6);   // campana
        R(ctx, '#6a6a7a', tx + 6, b - 186, 32, 14); R(ctx, '#7a7a8a', tx + 12, b - 196, 20, 10); R(ctx, '#5a5a6a', tx + 20, b - 206, 4, 10);
        R(ctx, '#3a3442', tx + 21, b - 214, 2, 8); R(ctx, '#3a3442', tx + 18, b - 211, 8, 2);   // cruz
      }
      const px = c0 + cw / 2;
      R(ctx, '#c4a874', px - 30, b - 100, 60, 100); R(ctx, '#3a2412', px - 12, b - 50, 24, 50); R(ctx, '#3a2412', px - 9, b - 54, 18, 4);
      for (const k of [-24, 18]) R(ctx, '#e8d8a8', px + k, b - 96, 6, 96);
      R(ctx, '#3a3442', px - 6, b - 84, 12, 16);
      // PALACIO DE GOBIERNO: fachada larga, ventanales, bandera y la reja negra
      const p0 = this.pal[0] * TS, p1 = this.pal[1] * TS, pw = p1 - p0;
      R(ctx, '#d6ccb4', p0, b - 96, pw, 96); R(ctx, '#bfb59c', p0, b - 96, pw, 4); R(ctx, '#fffaf0', p0 - 2, b - 99, pw + 4, 3);
      for (let k = p0 + 10; k < p1 - 16; k += 26) { for (const wy of [b - 84, b - 50]) { R(ctx, '#fffaf0', k - 2, wy - 3, 18, 3); R(ctx, '#3a4a5c', k, wy, 14, 22); R(ctx, '#5a7086', k + 2, wy + 2, 4, 6); } }
      const mx = p0 + pw / 2;
      R(ctx, '#d6ccb4', mx - 30, b - 116, 60, 20); R(ctx, '#fffaf0', mx - 32, b - 118, 64, 3);
      R(ctx, '#5d5768', mx, b - 150, 2, 34);
      const wave = (this.t >> 4) % 2;
      R(ctx, '#d8232f', mx + 2, b - 150 + wave, 8, 12); R(ctx, '#ffffff', mx + 10, b - 150, 8, 12); R(ctx, '#d8232f', mx + 18, b - 150 + wave, 8, 12);
      // la reja con puntas doradas
      R(ctx, '#1d1622', p0 - 4, b - 30, pw + 8, 2); R(ctx, '#1d1622', p0 - 4, b - 6, pw + 8, 2);
      for (let k = p0 - 4; k < p1 + 4; k += 4) { R(ctx, '#1d1622', k, b - 32, 1, 32); R(ctx, '#c9a24a', k, b - 34, 1, 2); }
      for (let k = p0; k < p1; k += 64) { R(ctx, '#2a2530', k, b - 40, 6, 40); R(ctx, '#c9a24a', k + 1, b - 43, 4, 3); }
    }
    draw() {}
  }

  // PORTADA DEL BARRIO CHINO: columnas rojas y tejado verde (se pisa)
  class PortadaChina extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8); }
    update() {}
    drawBack(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w, b = ST * TS;
      for (const cx of [x + 10, x + w - 20]) { R(ctx, '#1d1622', cx - 1, y + 4, 12, b - y - 4); R(ctx, '#c8322a', cx, y + 4, 10, b - y - 4); R(ctx, '#e8564a', cx + 2, y + 4, 2, b - y - 4); R(ctx, '#3a3442', cx - 3, b - 6, 16, 6); }
      R(ctx, '#c8322a', x + 4, y + 10, w - 8, 6); R(ctx, '#8f1f1a', x + 4, y + 16, w - 8, 2);
      // el cartel dorado
      const tw = textWidth('BARRIO CHINO') + 10;
      R(ctx, '#1d1622', x + w / 2 - tw / 2 - 1, y + 19, tw + 2, 13); R(ctx, '#8f1f1a', x + w / 2 - tw / 2, y + 20, tw, 11);
      drawText(ctx, 'BARRIO CHINO', x + w / 2, y + 22, { color: '#f6c94a', align: 'center' });
      // las puntas del alero, levantadas
      R(ctx, '#1f5a32', x - 4, y - 3, 6, 3); R(ctx, '#1f5a32', x + w - 2, y - 3, 6, 3); R(ctx, '#1f5a32', x - 6, y - 6, 3, 3); R(ctx, '#1f5a32', x + w + 3, y - 6, 3, 3);
      R(ctx, '#f6c94a', x + w / 2 - 3, y - 6, 6, 6);
    }
    draw() {}
  }

  // TOLDO de un puesto: si caes encima, rebotas (como la ropa tendida)
  class Toldo extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 10); this.col = def.col || ['#2b6fb8', '#fffaf0']; this.sag = 0; this.prevFeet = 1e9; this.goods = def.goods || 'fruta'; }
    update(g) {
      this.sag *= 0.85;
      const p = g.player, feet = p.y + p.h, top = this.y + 2;
      if (!p.riding && p.vy > 0 && this.prevFeet <= top + 1 && feet >= top && p.cx > this.x + 1 && p.cx < this.x + this.w - 1) {
        p.y = top - p.h; p.vy = -10.5; p.noCut = 26; p.onGround = false; p.coyote = 0; this.sag = 6;
        g.audio('boing'); g.burst(p.cx, top + 2, 'dust', 5);
      }
      this.prevFeet = p.y + p.h;
    }
    drawBack(ctx) {
      // el puesto: mostrador con la mercadería
      const x = Math.round(this.x), w = this.w, b = ST * TS;
      R(ctx, '#5d5768', x + 2, this.y, 2, b - this.y); R(ctx, '#5d5768', x + w - 4, this.y, 2, b - this.y);
      R(ctx, '#2a1f2d', x + 4, b - 16, w - 8, 16); R(ctx, '#a8703c', x + 5, b - 15, w - 10, 14); R(ctx, '#7a4a26', x + 5, b - 8, w - 10, 1);
      const G = this.goods === 'fruta' ? ['#f0913c', '#f6c94a', '#d8432f', '#7ab84a'] : ['#c9a978', '#8a5a3a', '#e8d8a8', '#a88a5a'];
      for (let k = x + 6; k < x + w - 8; k += 4) { R(ctx, G[(k >> 2) % 4], k, b - 19 - ((k >> 2) % 2), 4, 4); }
    }
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y) + Math.round(this.sag), w = this.w, [c1, c2] = this.col;
      R(ctx, '#2a1f2d', x - 1, y - 1, w + 2, 9);
      for (let k = 0; k < w; k += 8) R(ctx, (k / 8) % 2 ? c2 : c1, x + k, y, Math.min(8, w - k), 7);
      for (let k = 0; k < w; k += 8) R(ctx, (k / 8) % 2 ? c2 : c1, x + k + 1, y + 7, 6, 2);   // flecos
    }
  }

  // FAROLITOS del chifa: cuelgan de una cuerda; si los tocas, se mecen y suenan
  class Farolitos extends Actor {
    constructor(def) {
      super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8);
      this.lamps = []; for (let x = this.x + 10; x < this.x + this.w - 6; x += 22) this.lamps.push({ x, a: 0, v: 0, cd: 0 });
      this.t = 0;
    }
    update(g) {
      this.t++;
      const p = g.player;
      for (const L of this.lamps) {
        if (L.cd > 0) L.cd--;
        const ly = this.y + 6 + Math.sin(Math.PI * (L.x - this.x) / this.w) * 6;
        if (L.cd === 0 && Math.abs(p.cx - L.x) < 7 && p.y < ly + 12 && p.y + p.h > ly) {
          L.v += (p.vx >= 0 ? 1 : -1) * 0.12 + p.vy * -0.01; L.cd = 30; g.audio('bell');
          for (let i = 0; i < 6; i++) g.particles.push({ x: L.x, y: ly + 8, vx: (Math.random() - 0.5) * 1.6, vy: -Math.random() * 1.4, life: 26, max: 26, col: Math.random() < 0.5 ? '#f6c94a' : '#ffe9a8', size: 1, grav: 0.05 });
        }
        L.v += -L.a * 0.04; L.v *= 0.97; L.a += L.v;
        L.a += Math.sin(this.t * 0.03 + L.x) * 0.0006;
      }
    }
    draw(ctx) {
      const x0 = this.x, w = this.w;
      for (let x = 0; x < w; x++) R(ctx, '#2a1f2d', x0 + x, this.y + Math.sin(Math.PI * x / w) * 6, 1, 1);
      for (const L of this.lamps) {
        const ly = this.y + Math.sin(Math.PI * (L.x - x0) / w) * 6;
        ctx.save(); ctx.translate(Math.round(L.x), Math.round(ly)); ctx.rotate(L.a);
        R(ctx, '#2a1f2d', 0, 0, 1, 4);
        R(ctx, 'rgba(255,140,90,0.25)', -6, 3, 13, 13);
        R(ctx, '#2a1f2d', -4, 4, 9, 2); R(ctx, '#c8322a', -4, 6, 9, 7); R(ctx, '#e8564a', -3, 7, 2, 5); R(ctx, '#8f1f1a', -4, 9, 9, 1); R(ctx, '#2a1f2d', -4, 13, 9, 2);
        R(ctx, '#f6c94a', 0, 15, 1, 3);
        ctx.restore();
      }
    }
  }

  // ── MIRAFLORES Y BARRANCO ───────────────────────────────────────────────────
  // el ala del parapente (reemplaza a la hoja de plátano del Cap. 1 al planear)
  const WING = (() => {
    const c = PIX.createCanvas(34, 12), ctx = c.getContext('2d'), cols = ['#d8432f', '#f6c94a', '#3f6fb8', '#f6c94a', '#d8432f'];
    for (let x = 0; x < 34; x++) {
      const t = (x - 16.5) / 16.5, top = Math.round(Math.pow(Math.abs(t), 2) * 6), h = 5 - Math.round(Math.abs(t) * 2);
      R(ctx, '#2a1f2d', x, top, 1, h + 2); R(ctx, cols[Math.min(4, Math.floor(x / 7))], x, top + 1, 1, h);
      if (x % 7 === 0) R(ctx, 'rgba(0,0,0,0.25)', x, top + 1, 1, h);
    }
    return c;
  })();

  // PARAPENTE listo para despegar en el borde del malecón: tócalo y salta al vacío
  class Parapente extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS - 30, 22, 30); this.taken = false; this.t = 0; }
    onRespawn() { this.taken = false; }
    update(g) {
      this.t++;
      const p = g.player;
      if (!this.taken && !p.riding && p.overlaps(this)) {
        this.taken = true; p.gliding = true; p.glideAir = 0; p.glideImg = WING;
        g.audio('swoosh'); g.burst(this.cx, this.y + 8, 'spark', 12);
      }
    }
    draw(ctx) {
      if (this.taken) return;
      // el ala inflada por el viento, sujeta con sus cuerdas
      const x = Math.round(this.x), y = Math.round(this.y), sw = Math.round(Math.sin(this.t * 0.06) * 2);
      R(ctx, '#3a2a18', x + 4, y + 10 + sw, 1, 20 - sw); R(ctx, '#3a2a18', x + 18, y + 10 + sw, 1, 20 - sw);
      ctx.drawImage(WING, x - 6, y + sw);
    }
  }

  // PARAPENTES en el cielo de Miraflores (decorado)
  class Vuelos extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8); this.t = 0; }
    update() { this.t++; }
    drawBack(ctx) {
      for (let k = 0; k < 3; k++) {
        const x = Math.round(this.x + ((k * 230 + this.t * (0.3 + k * 0.1)) % this.w)), y = Math.round(this.y + k * 28 + Math.sin(this.t * 0.02 + k) * 6);
        ctx.save(); ctx.globalAlpha = 0.85; ctx.drawImage(WING, x, y); ctx.restore();
        R(ctx, '#3a2a18', x + 12, y + 6, 1, 10); R(ctx, '#3a2a18', x + 21, y + 6, 1, 10); R(ctx, '#2a1f2d', x + 14, y + 15, 6, 5);
      }
    }
    draw() {}
  }

  // la baranda blanca del malecón y sus faroles (decorado, detrás de ti)
  class Baranda extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8); }
    update() {}
    drawBack(ctx, g) {
      const x0 = Math.max(this.x, Math.floor(g.cam.x / 2) * 2 - 8), x1 = Math.min(this.x + this.w, g.cam.x + VIEW.w + 8), b = this.y;
      R(ctx, '#f4efe4', x0, b - 14, x1 - x0, 3); R(ctx, '#d6cfc2', x0, b - 3, x1 - x0, 3);
      for (let x = x0 - (x0 % 6); x < x1; x += 6) R(ctx, '#e8e2d4', x, b - 11, 3, 8);
      for (let x = this.x + 40; x < this.x + this.w; x += 120) if (x > x0 - 10 && x < x1) { R(ctx, '#2a2530', x, b - 40, 2, 40); R(ctx, '#2a2530', x - 3, b - 44, 8, 4); R(ctx, '#ffe9a8', x - 2, b - 43, 6, 2); }
    }
    draw() {}
  }

  // PARQUE DEL AMOR: la escultura del beso y la banca ondulada de mosaico
  class ParqueAmor extends Actor {
    constructor(def) { super(def.x * TS, def.y * TS, 12 * TS, 8); this.base = def.y * TS; }
    update() {}
    drawBack(ctx) {
      const x = Math.round(this.x), b = this.base;
      // la banca de mosaico: muro bajo y ondulado de mayólicas de colores
      const M = ['#d8432f', '#f6c94a', '#3f6fb8', '#5c9f4a', '#f08a7a', '#fffaf0', '#8a4cc0'];
      for (let k = 0; k < 190; k += 3) {
        const h = 14 + Math.round(Math.sin(k / 18) * 4);
        for (let yy = 0; yy < h; yy += 3) R(ctx, M[Math.floor(h2(k * 7 + yy) * M.length)], x + k, b - h + yy, 3, 3);
        R(ctx, '#2a1f2d', x + k, b - h - 1, 3, 1);
      }
      
      // EL BESO: dos enamorados echados, de barro rojizo, besándose
      const sx = x + 40, sb = b - 18;
      R(ctx, '#8a8072', sx - 4, sb, 84, 18); R(ctx, '#a89c8c', sx - 4, sb, 84, 2);   // pedestal
      R(ctx, '#a86a42', sx, sb - 12, 34, 12); R(ctx, '#b87a52', sx + 2, sb - 12, 30, 3);   // él, echado
      R(ctx, '#a86a42', sx + 30, sb - 22, 14, 14); R(ctx, '#a86a42', sx + 40, sb - 26, 12, 10);   // abrazo, cabezas juntas
      R(ctx, '#b87a52', sx + 44, sb - 18, 32, 10); R(ctx, '#a86a42', sx + 50, sb - 10, 26, 10);   // ella
      R(ctx, '#8a4a2a', sx + 45, sb - 22, 3, 3);
    }
    draw() {}
  }

  // LARCOMAR: el centro comercial metido en el acantilado (se dibuja sobre la roca)
  class Larcomar extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8); }
    update() {}
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w;
      for (let k = 0; k < 3; k++) {
        const yy = y + k * 26, xx = x + k * 12, ww = w - k * 24;
        R(ctx, '#e8e2d4', xx, yy, ww, 4); R(ctx, '#5a7086', xx + 2, yy + 4, ww - 4, 16); R(ctx, '#8fb3cf', xx + 4, yy + 5, ww - 8, 3);
        for (let c = xx + 2; c < xx + ww - 2; c += 12) R(ctx, '#e8e2d4', c, yy + 4, 1, 16);
        for (let c = 0; c < 4; c++) R(ctx, ['#d8432f', '#f6c94a', '#2a1f2d'][c % 3], xx + 10 + c * (ww / 5), yy + 14, 2, 4);   // gente
        R(ctx, '#b8ae98', xx, yy + 20, ww, 3);
      }
      const tw = textWidth('LARCOMAR') + 8;
      R(ctx, '#1d1622', x + w / 2 - tw / 2 - 1, y - 12, tw + 2, 11); R(ctx, '#fffaf0', x + w / 2 - tw / 2, y - 11, tw, 9);
      drawText(ctx, 'LARCOMAR', x + w / 2, y - 10, { color: '#2b4f86', align: 'center' });
    }
  }

  // EL MAR de la Costa Verde, detrás de la playa: olas que revientan y surfistas
  class Mar extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8); this.t = 0; }
    update() { this.t++; }
    drawBack(ctx, g) {
      const x0 = Math.max(this.x, Math.floor(g.cam.x)), x1 = Math.min(this.x + this.w, g.cam.x + VIEW.w + 2), b = this.y, t = this.t;
      if (x1 <= x0) return;
      R(ctx, '#6f8b98', x0, b - 64, x1 - x0, 64); R(ctx, '#5f7d8c', x0, b - 40, x1 - x0, 40); R(ctx, '#7f9aa6', x0, b - 64, x1 - x0, 4);
      // filas de espuma que avanzan hacia la orilla
      for (let r = 0; r < 4; r++) {
        const yy = b - 52 + r * 13 + ((t >> 3) + r * 5) % 6;
        for (let x = x0 - (x0 % 4); x < x1; x += 4) if (h2(x * 3 + r * 101 + (t >> 4)) > 0.55) R(ctx, '#e8f0f2', x, yy, 3, 1);
      }
      R(ctx, '#e8f0f2', x0, b - 3, x1 - x0, 2);   // la orilla
      // surfistas sobre la ola
      for (let k = 0; k < 2; k++) {
        const sx = Math.round(this.x + 60 + k * 300 + Math.sin(t * 0.01 + k * 2) * 80), sy = b - 30 - k * 12 + Math.round(Math.sin(t * 0.05 + k) * 2);
        if (sx < x0 - 20 || sx > x1) continue;
        R(ctx, '#e8f0f2', sx - 8, sy + 6, 22, 2);   // la ola que lo lleva
        R(ctx, '#f6c94a', sx - 4, sy + 4, 14, 2); R(ctx, '#1d1622', sx + 1, sy - 4, 4, 8); R(ctx, '#b87a52', sx + 1, sy - 7, 4, 3);
        R(ctx, '#1d1622', sx - 2, sy - 3, 3, 1); R(ctx, '#1d1622', sx + 5, sy - 3, 3, 1);   // brazos abiertos
      }
    }
    draw() {}
  }

  // LA BAJADA DE BAÑOS: la quebrada empedrada que baja al mar entre casonas
  // republicanas de colores, ficus enormes, buganvillas que cuelgan y faroles.
  const BAJ_WALLS = [['#e3c06a', '#c9a24e'], ['#f08a7a', '#d06a5a'], ['#9cc3d0', '#7aa4b4'], ['#b8d4a8', '#94b486'], ['#e8e0cc', '#c9bfa8'], ['#d98a6a', '#b86a4e']];
  class Bajada extends Actor {
    constructor(def) { super(def.x0 * TS, def.top * TS, (def.x1 - def.x0) * TS, (def.bottom - def.top) * TS); this.def = def; }
    update() {}
    // fila del escalón a la altura de la columna tx (los escalones: 3 casillas, 2 filas)
    stepRow(tx) { const k = Math.max(0, Math.min(8, Math.floor((tx - 410) / 3))); return tx < 410 ? 64 : 62 - 2 * k; }
    drawBack(ctx) {
      const d = this.def, bottom = d.bottom * TS;
      // las casonas: suben escalonadas con la bajada, de 2 o 3 pisos
      let n = 0;
      for (let tx = d.x0; tx < d.x1; n++) {
        const w = 4 + (h2(n * 7 + 1) > 0.5 ? 1 : 0), floors = 2 + (h2(n * 11 + 3) > 0.55 ? 1 : 0);
        const base = this.stepRow(tx) * TS, top = base - floors * 44 - 10, x = tx * TS, W = w * TS - 2;
        const [wall, shade] = BAJ_WALLS[n % BAJ_WALLS.length];
        R(ctx, '#2a1f2d', x - 1, top - 1, W + 2, bottom - top + 1);
        R(ctx, wall, x, top, W, bottom - top); R(ctx, shade, x + W - 4, top, 4, bottom - top);
        R(ctx, '#f4efe4', x - 2, top, W + 4, 4); R(ctx, shade, x - 2, top + 4, W + 4, 2);   // cornisa
        for (let f = 0; f < floors; f++) {
          const fy = top + 12 + f * 44;
          for (let wx = x + 8; wx + 14 < x + W - 4; wx += 24) {
            R(ctx, '#2a1f2d', wx - 1, fy - 1, 14, 24); R(ctx, '#4f3a2a', wx, fy, 12, 22); R(ctx, '#9fd3f0', wx + 2, fy + 2, 8, 9); R(ctx, '#7a5a3a', wx + 2, fy + 13, 8, 7);
            R(ctx, '#f4efe4', wx - 2, fy - 3, 16, 2);
          }
          // balcón de madera en el piso de arriba
          if (f === 0 && floors === 3) { R(ctx, '#5a3418', x + 4, fy + 24, W - 8, 3); for (let bx = x + 5; bx < x + W - 5; bx += 4) R(ctx, '#7a4a24', bx, fy + 14, 2, 10); R(ctx, '#5a3418', x + 4, fy + 12, W - 8, 2); }
        }
        // buganvilla cayendo desde la cornisa
        if (h2(n * 13 + 5) > 0.35) {
          const bx = x + Math.floor(h2(n * 17) * (W - 30));
          for (let k = 0; k < 40; k++) {
            const px = bx + Math.floor(h2(n * 31 + k) * 30), py = top + 4 + Math.floor(Math.pow(h2(n * 37 + k), 1.8) * 50);
            R(ctx, k % 4 ? '#c8287a' : '#e85aa0', px, py, 3, 3);
          }
          for (let k = 0; k < 10; k++) R(ctx, '#3f6a32', bx + Math.floor(h2(n * 41 + k) * 30), top + 2 + Math.floor(h2(n * 43 + k) * 20), 3, 2);
        }
        tx += w;
      }
      // ficus enormes que dan sombra a la bajada
      for (const tx of [415, 427]) {
        const base = this.stepRow(tx) * TS, cx = tx * TS;
        R(ctx, '#4a3424', cx - 3, base - 70, 7, 70); R(ctx, '#5a4030', cx - 1, base - 70, 2, 70);
        for (let k = 0; k < 60; k++) {
          const a = h2(tx * 7 + k) * Math.PI * 2, r = Math.sqrt(h2(tx * 11 + k)) * 34;
          R(ctx, k % 3 ? '#2f5a2a' : '#4a7a36', cx + Math.cos(a) * r * 1.4 - 4, base - 92 + Math.sin(a) * r * 0.8 - 3, 9, 7);
        }
      }
      // faroles de fierro, uno cada dos escalones
      for (let k = 0; k <= 8; k += 2) {
        const lx = (410 + 3 * k + 2.5) * TS, base = (62 - 2 * k) * TS;
        R(ctx, '#2a2530', lx, base - 30, 2, 30); R(ctx, '#2a2530', lx - 3, base - 36, 8, 6); R(ctx, '#ffe9a8', lx - 2, base - 35, 6, 4);
        R(ctx, 'rgba(255,233,168,0.18)', lx - 7, base - 40, 16, 14);
      }
    }
    draw() {}
  }

  // EL PUENTE DE LOS SUSPIROS: dicen que si lo cruzas aguantando la respiración
  // se cumple tu deseo. Aquí: crúzalo sin saltar y el reloj te regala un minuto.
  class Suspiros extends Actor {
    constructor(def) { super(def.x0 * TS, def.y * TS, (def.x1 - def.x0) * TS, 8); this.state = 'idle'; this.t = 0; }
    update(g) {
      this.t++;
      const p = g.player, on = p.cx > this.x && p.cx < this.x + this.w;
      if (this.state === 'idle' && on && p.onGround) { this.state = 'cross'; this.jumped = false; }
      if (this.state === 'cross') {
        if (!p.onGround) this.jumped = true;
        if (p.cx < this.x - 4) this.state = 'idle';   // se regresó: vale volver a intentarlo
        else if (p.cx > this.x + this.w) {
          this.state = 'done';
          if (!this.jumped) { g.time = Math.max(0, g.time - 200); g.audio('page'); g.toast('¡DESEO CONCEDIDO! +1 MIN'); g.burst(p.cx, p.cy, 'spark', 18); }
          else { g.audio('nope'); g.toast('¡RESPIRASTE! NI MODO'); }
        }
      }
    }
    drawBack(ctx) {
      // la quebrada bajo el puente: árboles y la bajada empedrada, allá abajo
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w;
      R(ctx, '#4a5a3a', x, y + 4, w, 400); R(ctx, '#3f6a32', x, y + 20, w, 30); R(ctx, '#5c8a3a', x + 10, y + 14, w - 20, 12);
      R(ctx, '#9a8f80', x + w / 2 - 12, y + 60, 24, 340);
      // baranda de atrás y los faroles en las puntas
      R(ctx, '#5a3418', x, y - 14, w, 2); for (let k = 0; k <= w; k += 8) R(ctx, '#5a3418', x + k, y - 14, 2, 14);
      for (const lx of [x - 2, x + w - 2]) { R(ctx, '#2a2530', lx, y - 34, 3, 34); R(ctx, '#2a2530', lx - 2, y - 40, 7, 6); R(ctx, '#ffe9a8', lx - 1, y - 39, 5, 4); }
    }
    draw(ctx) {
      // el tablado de madera
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w;
      R(ctx, '#2a1a0e', x, y, w, 7); for (let k = 0; k < w; k += 6) R(ctx, '#8a5a30', x + k, y + 1, 5, 4);
      R(ctx, '#5a3418', x, y + 5, w, 2); R(ctx, '#5a3418', x + 4, y + 7, 4, 10); R(ctx, '#5a3418', x + w - 8, y + 7, 4, 10);
    }
  }

  // MURALES de Barranco pintados en las fachadas
  class Murales extends Actor {
    constructor(def) { super(def.x0 * TS, def.top * TS, (def.x1 - def.x0) * TS, (ST - def.top) * TS); }
    update() {}
    // se pinta delante de las casonas (que se dibujan después en la lista)
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y), w = this.w, h = this.h - 10;
      const C = ['#d8432f', '#f6c94a', '#3f6fb8', '#5c9f4a', '#f08a7a', '#8a4cc0', '#f0913c', '#2b9a9a'];
      for (let k = 0; k < w; k += 24) for (let yy = 0; yy < h; yy += 12) R(ctx, C[Math.floor(h2(x + k * 5 + yy * 3) * C.length)], x + k, y + yy, 24, 12);
      // un sol grande, una ola y un pez: el mural del barrio
      const sx = x + w * 0.3, sy = y + h * 0.4;
      for (let r = 0; r < 12; r++) R(ctx, '#ffd166', sx - 12 + r, sy - r, 24 - r * 2, 1);
      for (let k = 0; k < 8; k++) R(ctx, '#ffd166', sx + Math.cos(k) * 18, sy - 6 + Math.sin(k) * 14, 3, 3);
      for (let k = 0; k < 60; k += 2) R(ctx, '#fffaf0', x + w * 0.55 + k, y + h * 0.6 + Math.sin(k / 6) * 5, 2, 2);
      R(ctx, '#f0913c', x + w * 0.75, y + h * 0.3, 18, 8); R(ctx, '#f0913c', x + w * 0.75 + 18, y + h * 0.3 - 2, 6, 12); R(ctx, '#2a1f2d', x + w * 0.75 + 3, y + h * 0.3 + 2, 2, 2);
    }
  }

  // BALDE DE PINTURA del muralista: si lo pateas, todo se llena de colores
  class Balde extends Actor {
    constructor(def) { super(def.x * TS, ST * TS - 10, 10, 10); this.hit = false; }
    onRespawn() { this.hit = false; }
    update(g) {
      const p = g.player;
      if (!this.hit && p.overlaps(this)) {
        this.hit = true; g.audio('splash');
        const C = ['#d8432f', '#f6c94a', '#3f6fb8', '#5c9f4a', '#f08a7a', '#8a4cc0'];
        for (let i = 0; i < 26; i++) g.particles.push({ x: this.cx, y: this.y, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2.5, life: 40, max: 40, col: C[i % C.length], size: 2, grav: 0.15 });
      }
    }
    draw(ctx) {
      const x = Math.round(this.x), y = Math.round(this.y);
      if (this.hit) { R(ctx, '#9aa0a8', x - 2, y + 6, 10, 4); R(ctx, '#3f6fb8', x - 6, y + 9, 22, 1); R(ctx, '#d8432f', x + 8, y + 9, 8, 1); return; }
      R(ctx, '#2a1f2d', x - 1, y, 12, 10); R(ctx, '#9aa0a8', x, y + 1, 10, 9); R(ctx, '#3f6fb8', x, y + 1, 10, 2); R(ctx, '#5d5768', x + 2, y - 3, 6, 1);
    }
  }

  // ── EN MOTOTAXI: el tramo estrella, manejando por la avenida hacia el Centro ──
  // MOTOTAXI que manejas tú: se monta como la llama. Solo con tocarlo avanza
  // (no hace falta saber jugar); con la flecha acelera, con el salto brinca.
  // Al llegar al Centro se queda: los mototaxis no entran al Centro.
  class MotoRide extends Mount {
    constructor(def) {
      super(def.x * TS, def.y * TS - 20, 30, 20, { dx: 12, dy: 2 });
      this.img = OBJ.torito[def.model] || OBJ.torito.rojo; this.end = def.end * TS;
      this.canDismount = false; this.drawsRider = true; this.ownJump = true; this.camMax = 3.6; this.taken = false; this.air = 0; this.blockT = 0;
    }
    reset() { super.reset(); this.air = 0; this.hop = false; }
    update(g) {
      this.animT++;
      if (this.rider) {
        if (!this.taken) { this.taken = true; g.audio('honk'); }
        const left = Input.held('left'), right = Input.held('right');
        // sin tocar nada avanza solo, despacito; a la derecha acelera; a la izquierda frena
        let want = right ? 3.6 : left ? -1.2 : 1.7;
        if (this.launched) want = Math.max(want, this.vx);   // volando por una rampa no pierde impulso
        this.vx += Math.max(-0.12, Math.min(0.1, want - this.vx));
        if (this.vx > 0.1) this.facing = 1; else if (this.vx < -0.1) this.facing = -1;
        // se puede saltar en el suelo, un instante después de dejarlo (coyote) o en el saltito de un bache:
        // antes el salto se perdía si lo apretabas justo al pasar un bache, y chocabas con la combi
        if (this.onGround) this.coyote = PHYS.COYOTE; else if (this.coyote > 0) this.coyote--;
        if ((this.onGround || this.coyote > 0 || this.hop) && Input.consumeJump()) { this.vy = -7.8; this.onGround = false; this.coyote = 0; this.hop = false; g.onPlayerJump(this); g.audio('honk'); }
        const held = Input.held('jump') || Input.held('up');
        if (!held && this.vy < -PHYS.JUMP_CUT && !this.launched) this.vy = -PHYS.JUMP_CUT;
        // el humito del escape
        if (this.animT % (Math.abs(this.vx) > 2 ? 4 : 9) === 0) g.particles.push({ x: this.facing > 0 ? this.x : this.x + this.w, y: this.y + this.h - 6, vx: -this.facing * 0.3, vy: -0.25, life: 45, max: 45, col: '#c8c2cc', size: 2, grav: -0.004 });
      } else { this.vx *= 0.8; if (this.animT % 30 === 0) g.particles.push({ x: this.x, y: this.y + this.h - 6, vx: -0.25, vy: -0.2, life: 50, max: 50, col: '#c8c2cc', size: 2, grav: -0.004 }); }
      this.vy = Math.min(this.vy + PHYS.GRAV, PHYS.MAX_FALL);
      const was = this.onGround;
      moveX(this, g.level); moveY(this, g.level);
      if (this.onGround) { this.launched = false; this.hop = false; if (!was && this.rider) { g.onPlayerLand(this); g.audio('land'); if (this.air > 30) { g.shake(2, 8); g.burst(this.cx, this.y + this.h, 'dust', 12); } } this.air = 0; }
      else this.air++;
      // se chocó con algo (una combi parada): toca bocina y, si no saltas tú, brinca solo
      if (this.wall && this.rider && this.onGround) { if (++this.blockT === 4) { this.vy = -7.8; this.onGround = false; this.launched = true; g.audio('honk'); g.onPlayerJump(this); } }
      else this.blockT = 0;
      // llegó al Centro: se estaciona y te bajas
      if (this.rider && this.onGround && this.cx > this.end) {
        this.retired = true; this.vx = 0; this.rider.dismount(g, -4); g.audio('honk');
      }
      if (this.rider) this.rider.syncRide();
      this.hazards(g);
    }
    draw(ctx, g) {
      const p = g.player, x = Math.round(this.x - 2), bob = this.rider && this.onGround && Math.abs(this.vx) > 0.5 && Math.floor(this.animT / 3) % 2 ? -1 : 0;
      const y = Math.round(this.y + this.h - 28) + bob, f = this.facing < 0;
      ctx.save();
      if (f) { ctx.translate(x + 34, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
      ctx.fillStyle = 'rgba(30,20,20,0.25)'; ctx.fillRect(x + 2, Math.round(this.y + this.h), 30, 2);
      ctx.drawImage(this.img, x, y);
      // tú al volante: la cabeza asoma por el parabrisas
      if (this.rider === p && !(p.invuln > 0 && Math.floor(p.invuln / 4) % 2 === 0)) {
        ctx.save(); ctx.beginPath(); ctx.rect(x + 19, y + 4, 12, 8); ctx.clip();
        ctx.drawImage(P.sit, x + 17, y + 3); ctx.restore();
      }
      ctx.restore();
      if (!this.rider && !this.retired && Math.floor(this.animT / 20) % 2) drawText(ctx, '¡SUBE!', this.cx, this.y - 14, { color: '#ffd166', align: 'center', shadow: true, shadowColor: '#2a1f2d' });
    }
  }

  // LA AVENIDA hacia el Centro: casas a medio terminar con fierros y tanques en el
  // techo, tiendas con letrero pintado y un panel publicitario.
  const AV_SHOPS = ['POLLERÍA', 'CHIFA', 'BODEGA', 'LAVANDERÍA', 'FERRETERÍA', 'MENÚ S/ 12', 'CABINAS', 'SE ALQUILA', 'BOTICA', 'JUGUERÍA'];
  const AV_WALLS = ['#b8644a', '#e3c06a', '#9cc3d0', '#e8e0cc', '#b8644a', '#d0aea4', '#b8d4a8', '#b8644a'];
  class Avenida extends Actor {
    constructor(def) {
      super(def.x0 * TS, ST * TS - 160, (def.x1 - def.x0) * TS, 160);
      this.houses = []; let tx = def.x0, n = 0;
      while (tx < def.x1) {
        const w = 5 + Math.floor(h2(n * 3 + 7) * 3), skip = (def.skip || []).some(([a, b]) => tx + w > a && tx < b);
        if (!skip) this.houses.push({ x: tx * TS, w: w * TS - 4, floors: 2 + (h2(n * 5 + 1) > 0.5 ? 1 : 0), wall: AV_WALLS[n % AV_WALLS.length], shop: AV_SHOPS[n % AV_SHOPS.length], n });
        tx += skip ? 1 : w; n++;
      }
      this.panel = def.panel * TS;
    }
    update() {}
    drawBack(ctx) {
      const b = ST * TS, c0 = Game.cam.x - 40, c1 = Game.cam.x + VIEW.w + 40;
      for (const h of this.houses) {
        if (h.x > c1 || h.x + h.w < c0) continue;
        const x = h.x, w = h.w, top = b - h.floors * 34 - 4, brick = h.wall === '#b8644a';
        R(ctx, '#2a1f2d', x - 1, top - 1, w + 2, b - top + 1); R(ctx, h.wall, x, top, w, b - top);
        if (brick) for (let yy = top + 2; yy < b - 30; yy += 4) for (let xx = x + ((yy >> 2) % 2) * 4; xx < x + w; xx += 8) R(ctx, '#9a5038', xx, yy, 7, 1);
        else R(ctx, 'rgba(0,0,0,0.12)', x + w - 4, top, 4, b - top);
        // pisos de arriba: ventanas con rejas
        for (let f = 1; f < h.floors; f++) {
          const fy = b - 34 * (f + 1) + 6;
          for (let wx = x + 6; wx + 14 < x + w; wx += 22) { R(ctx, '#2a1f2d', wx - 1, fy - 1, 16, 16); R(ctx, '#9fb3c4', wx, fy, 14, 14); for (let k = 2; k < 14; k += 4) R(ctx, '#3a3440', wx + k, fy, 1, 14); }
        }
        // el techo sin terminar: fierros de columna y, a veces, el tanque negro
        for (let k = 3; k < w; k += Math.max(10, w - 6)) R(ctx, '#5d5768', x + k, top - 12, 1, 12), R(ctx, '#5d5768', x + k + 2, top - 10, 1, 10);
        if (h2(h.n * 9 + 2) > 0.4) { const tx = x + w - 22; R(ctx, '#1d1a20', tx, top - 16, 14, 16); R(ctx, '#2e2a32', tx + 2, top - 16, 10, 2); R(ctx, '#1d1a20', tx + 4, top - 19, 6, 3); }
        if (h2(h.n * 4 + 8) > 0.5) for (let k = 0; k < 4; k++) R(ctx, ['#d8432f', '#3f6fb8', '#f6c94a', '#f4efe4'][k], x + 6 + k * 7, top - 4 + (k % 2), 5, 6);   // ropa tendida
        // primer piso: la tienda con su letrero pintado y la reja enrollable
        R(ctx, '#2a1f2d', x + 2, b - 30, w - 4, 30); R(ctx, '#f4efe4', x + 3, b - 29, w - 6, 9);
        drawText(ctx, h.shop, x + w / 2, b - 27, { color: h.n % 2 ? '#d8432f' : '#2b4f86', align: 'center' });
        if (h2(h.n * 7) > 0.45) { R(ctx, '#3a3440', x + 4, b - 20, w - 8, 20); R(ctx, '#f6c94a', x + 6, b - 18, w - 12, 9); R(ctx, '#d9d2c4', x + 6, b - 9, w - 12, 9); }
        else { R(ctx, '#7f8890', x + 4, b - 20, w - 8, 20); for (let yy = b - 19; yy < b; yy += 2) R(ctx, '#626a72', x + 4, yy, w - 8, 1); }
      }
      // panel publicitario en su poste
      if (this.panel > c0 - 120 && this.panel < c1) {
        const px = this.panel, t = b - 150; R(ctx, '#3a3440', px + 40, t + 46, 4, b - t - 46);
        R(ctx, '#1d1622', px - 2, t - 2, 88, 50); R(ctx, '#f6c94a', px, t, 84, 46); R(ctx, '#d8432f', px, t, 84, 6);
        drawText(ctx, '¡CEBICHE!', px + 42, t + 10, { color: '#2a1f2d', align: 'center' }); drawText(ctx, 'EL PEJE', px + 42, t + 22, { color: '#d8432f', align: 'center' }); drawText(ctx, 'S/ 15', px + 42, t + 34, { color: '#2b4f86', align: 'center' });
      }
    }
    draw() {}
  }

  // RAMPA de tablas en la pista: el mototaxi sale volando (a pie no pasa nada)
  class Rampa extends Actor {
    constructor(def) { super(def.x * TS, ST * TS - 12, 32, 12); this.power = def.power || 8.5; this.big = !!def.big; this.t = 0; this.told = false; }
    onRespawn() { this.told = false; }
    update(g) {
      this.t++;
      const m = g.player.riding;
      if (!(m instanceof MotoRide) || m.vx < 0.3) return;
      const front = m.x + m.w;
      if (front > this.x + 4 && m.x < this.x + this.w && m.y + m.h > this.y + 2) {
        m.vy = -this.power; m.vx = Math.max(m.vx, this.big ? 3.4 : 2.8); m.onGround = false; m.launched = true;
        g.audio('boing'); g.audio('honk'); g.burst(this.x + this.w, this.y, 'dust', 10);
        if (this.big && !this.told) { this.told = true; g.shake(2, 10); }
      }
    }
    draw(ctx) {
      const x = Math.round(this.x), b = ST * TS;
      for (let k = 0; k < this.w; k += 2) { const hh = Math.round(this.h * k / this.w); R(ctx, '#2a1f2d', x + k, b - hh - 1, 2, hh + 1); R(ctx, (k >> 2) % 2 ? '#a8703c' : '#c9894a', x + k, b - hh, 2, hh); }
      R(ctx, '#5a3418', x + this.w - 2, b - this.h, 2, this.h);
      if (this.big) { for (let k = 0; k < this.w; k += 8) R(ctx, '#f6c94a', x + k, b - Math.round(this.h * k / this.w) - 2, 4, 1); }
    }
  }

  // BACHE con agua: el mototaxi da un saltito y salpica (no te mata)
  class Bache extends Actor {
    constructor(def) { super(def.x * TS, ST * TS - 2, (def.w || 1.5) * TS, 4); this.cd = 0; }
    update(g) {
      if (this.cd > 0) this.cd--;
      const p = g.player, b = p.riding || p;
      if (this.cd === 0 && b.onGround && b.cx > this.x && b.cx < this.x + this.w && Math.abs(b.vx) > 0.8) {
        this.cd = 30; g.audio('splash'); g.burst(b.cx, ST * TS - 2, 'splash', 10);
        if (p.riding instanceof MotoRide) { b.vy = -2.4; b.onGround = false; b.hop = true; g.shake(1, 6); }
      }
    }
    drawBack(ctx) {
      const x = Math.round(this.x), y = ST * TS;
      R(ctx, '#2a2530', x, y, this.w, 3); R(ctx, '#5a7086', x + 2, y, this.w - 4, 2); R(ctx, '#9fb3c4', x + 4, y, 4, 1);
    }
    draw() {}
  }

  // COMBI ESTACIONADA en el tráfico: se puede pisar (bloques invisibles en el
  // nivel). Su cobrador grita cuando te acercas.
  class ParkedCombi extends Combi {
    constructor(def) { super(def.x * TS, ST * TS, { stops: [], end: 1e9, n: def.n || 0 }); this.isMover = false; this.v = 0; this.hazardKind = null; this.told = false; this.line = def.line || '¡PIII! ¡QUÉ TRÁFICO!'; }
    onRespawn() { this.told = false; }
    update(g) { this.t++; if (this.sayT > 0) this.sayT--; this.dx = 0; if (!this.told && g.near(this.cx, 120)) { this.told = true; this.say = this.line; this.sayT = 110; g.audio('honk'); } }
    hazardBox() { return null; }
  }

  // AMBULANTE que cruza la pista con su carrito: al oír el mototaxi se aparta
  class Cruce extends Actor {
    constructor(def) { super(def.x * TS, ST * TS - 24, 34, 24); this.onRespawn(); }
    onRespawn() { this.go = 0; this.dy = 0; }
    update(g) {
      const p = g.player;
      if (!this.go && p.cx > this.x - 110 && p.cx < this.x + 20) { this.go = 1; g.audio('shout'); }
      if (this.go && this.go < 40) { this.go++; this.dy = Math.min(14, this.dy + 0.5); }
    }
    drawBack(ctx) {
      // se aparta empujando el carrito hacia adelante, siempre apoyado en la pista
      // (se dibuja detrás del mototaxi, así que no estorba)
      const x = Math.round(this.x + this.dy * 2), b = ST * TS, run = this.go && this.go < 40 && Math.floor(this.go / 4) % 2;
      // carrito de canchita: toldo a rayas, montaña de cancha, cajón rojo y ruedas de rayos
      const cw = 30;
      for (const px of [3, 26]) R(ctx, '#7a4a26', x + px, b - 34, 2, 16);                 // parantes
      for (let i = 0; i < 8; i++) R(ctx, i % 2 ? '#f2e6c8' : '#c8262a', x + i * 4, b - 39, 4, 5);   // toldo
      for (let i = 0; i < 8; i++) R(ctx, i % 2 ? '#f2e6c8' : '#c8262a', x + i * 4 + 1, b - 34, 2, 1);   // festón
      R(ctx, '#8a1a1e', x, b - 40, 32, 1);
      for (let i = 0; i < 26; i++) {                                                        // la cancha, amontonada
        const cx = x + 4 + (i * 7) % 23, cy = b - 20 - Math.round(Math.sin(((i * 7) % 23) / 23 * Math.PI) * 4) - (i % 3 === 0 ? 1 : 0);
        R(ctx, i % 4 ? '#f6e7b4' : '#e2c070', cx, cy, 2, 2);
      }
      R(ctx, '#7a4a26', x + 1, b - 19, 29, 2);                                             // bandeja de madera
      R(ctx, '#c8262a', x + 3, b - 17, 25, 8); R(ctx, '#8a1a1e', x + 3, b - 10, 25, 1);    // cajón rojo
      R(ctx, '#8a1a1e', x + 9, b - 16, 13, 6); R(ctx, '#f2e6c8', x + 10, b - 15, 11, 4);    // panelito crema
      R(ctx, '#7a4a26', x + 12, b - 14, 2, 1); R(ctx, '#7a4a26', x + 15, b - 13, 3, 1); R(ctx, '#7a4a26', x + 18, b - 14, 1, 2);   // garabato
      R(ctx, '#7a4a26', x - 2, b - 15, 5, 1);                                              // agarradera
      for (const wx of [7, 24]) {                                                           // ruedas de rayos
        ctx.fillStyle = '#4a2c16'; ctx.beginPath(); ctx.arc(x + wx, b - 5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#c9a273'; ctx.beginPath(); ctx.arc(x + wx, b - 5, 4, 0, Math.PI * 2); ctx.fill();
        R(ctx, '#7a4a26', x + wx - 3, b - 5, 7, 1); R(ctx, '#7a4a26', x + wx, b - 8, 1, 7); R(ctx, '#7a4a26', x + wx - 2, b - 7, 1, 1); R(ctx, '#7a4a26', x + wx + 2, b - 3, 1, 1);
        R(ctx, '#3a2414', x + wx - 1, b - 6, 2, 2);
      }
      ctx.drawImage(run ? LIMENO.ambulante.step : LIMENO.ambulante.idle, x + cw + 2, b - 24);
    }
    draw() {}
  }

  // el carril de enfrente: combis y buses que pasan tocando bocina (decorado)
  class Contramano extends Actor {
    constructor(def) { super(def.x0 * TS, ST * TS - 26, (def.x1 - def.x0) * TS, 8); this.cars = []; this.t = 0; }
    update(g) {
      this.t++;
      const cam = g.cam;
      if (cam.x + VIEW.w < this.x || cam.x > this.x + this.w) { this.cars.length = 0; return; }
      if (this.t % 130 === 0) { this.cars.push({ x: cam.x + VIEW.w + 70, n: this.t / 130 | 0 }); g.audio('honk'); }
      for (const c of this.cars) c.x -= 3.2;
      this.cars = this.cars.filter(c => c.x > cam.x - 80);
    }
    drawBack(ctx) {
      ctx.save(); ctx.beginPath(); ctx.rect(this.x, this.y - 30, this.w, 40); ctx.clip();
      for (const c of this.cars) {
        // una combi del carril de enfrente: más chica, mirando a la izquierda
        const x = Math.round(c.x), y = this.y - 6 + (Math.floor(this.t / 4) % 2), [c1, c2] = COMBI_PAINT[c.n % COMBI_PAINT.length];
        R(ctx, '#c9c0aa', x, y, 46, 16); R(ctx, '#b8ae98', x + 2, y - 2, 42, 2);
        for (let k = 0; k < 4; k++) R(ctx, '#4a5a6a', x + 10 + k * 8, y + 2, 6, 5);
        R(ctx, '#4a5a6a', x + 1, y + 2, 6, 6); R(ctx, c1, x, y + 11, 46, 2); R(ctx, c2, x, y + 13, 46, 1);
        R(ctx, '#fff6b0', x, y + 9, 2, 2);
        for (const wx of [8, 37]) R(ctx, '#2a2530', x + wx - 3, y + 14, 7, 6);
      }
      ctx.restore();
      // la línea amarilla del medio de la avenida
      for (let x = this.x; x < this.x + this.w; x += 24) R(ctx, '#f2c230', x, ST * TS - 3, 12, 1);
    }
    draw() {}
  }

  // ── LA CASONA ───────────────────────────────────────────────────────────────
  // El concurso en el patio de una casona del Centro: el jurado en su mesa, los otros concursantes con
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
      // la casona del concurso: dos pisos coloniales, amarillo con zócalo granate,
      // balcones de cajón, portón abierto y la banderola colgada de la cornisa
      const x = Math.round(this.x) - 20, b = this.base;
      R(ctx, '#e3c06a', x, b - 120, 340, 120); R(ctx, '#8f2a2a', x, b - 14, 340, 14); R(ctx, 'rgba(0,0,0,0.08)', x, b - 62, 340, 2);
      R(ctx, '#fffaf0', x - 4, b - 126, 348, 6); R(ctx, 'rgba(0,0,0,0.15)', x - 4, b - 120, 348, 1);
      for (let k = 0; k < 7; k++) R(ctx, 'rgba(255,255,255,0.22)', x + 4 + k * 52, b - 120, 5, 106);   // pilastras
      // ventanas bajas con reja
      for (let k = 0; k < 6; k++) { const wx = x + 20 + k * 52; R(ctx, '#3a4a5c', wx, b - 52, 22, 26); for (let r = 3; r < 22; r += 4) R(ctx, '#1d1622', wx + r, b - 52, 1, 26); R(ctx, '#fffaf0', wx - 2, b - 55, 26, 3); }
      // balcones de cajón en el segundo piso
      for (const bx of [x + 30, x + 140, x + 250]) {
        R(ctx, '#4a2c16', bx - 2, b - 112, 64, 4); R(ctx, '#5a3418', bx, b - 108, 60, 28);
        for (let yy = b - 105; yy < b - 90; yy += 3) for (let xx = bx + 3 + ((yy >> 1) % 2) * 2; xx < bx + 57; xx += 4) R(ctx, 'rgba(255,230,180,0.28)', xx, yy, 2, 1);
        R(ctx, '#2a1a0e', bx, b - 80, 60, 2); for (const k of [bx + 4, bx + 52]) R(ctx, '#5a3418', k, b - 78, 4, 6);
      }
      // banderola del concurso
      R(ctx, '#1d1622', x + 59, b - 151, 222, 22); R(ctx, '#d8432f', x + 60, b - 150, 220, 20); R(ctx, '#ffffff', x + 60, b - 140, 220, 1);
      drawText(ctx, 'HACKATÓN ESCOLAR', x + 170, b - 147, { color: '#ffffff', align: 'center' });
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
      if (!this.done && Math.abs(g.player.cx - this.spot) < 180) bubble(ctx, '¿Y EL PARTICIPANTE?', jx + 37, b - 48);
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

  // el cerro San Cristóbal con su cruz en la cima, sobre el Rímac
  const sanCristobal = (seed, col, col2) => (g, W, H) => {
    cerroLayer(seed, col, col2)(g, W, H);
    const ridge = (x) => 76 + Math.sin((x / W) * Math.PI * 2 + seed) * 18 + Math.sin((x / W) * Math.PI * 6 + seed * 2) * 7;
    let bx = 0; for (let x = 0; x < W; x += 2) if (ridge(x) < ridge(bx)) bx = x;
    const by = Math.round(ridge(bx));
    g.fillStyle = '#f4efe4'; g.fillRect(bx - 1, by - 22, 3, 22); g.fillRect(bx - 6, by - 17, 13, 3);
    g.fillStyle = '#6f6a72'; g.fillRect(bx + 14, by - 12, 1, 12); g.fillRect(bx + 12, by - 9, 5, 1);   // antena
  };
  // el mar desde el malecón: horizonte, el Morro Solar con su cruz y la espuma
  const seaLayer = (seed, sea, sea2, morro) => (g, W, H) => {
    const hz = morro ? 96 : 112;
    g.fillStyle = sea; g.fillRect(0, hz, W, H - hz);
    g.fillStyle = sea2; for (let y = hz + 3; y < H; y += 5) for (let x = 0; x < W; x += 6) if (h2(seed + x * 7 + y) > 0.72) g.fillRect(x, y, 4, 1);
    if (morro) {
      const mx = Math.floor(W * 0.62);
      g.fillStyle = '#8f8c88'; for (let x = -90; x < 90; x += 2) { const hh = Math.round(26 * Math.cos((x / 90) * Math.PI / 2)); g.fillRect(mx + x, hz - hh, 2, hh); }
      g.fillStyle = '#f4efe4'; g.fillRect(mx - 1, hz - 34, 2, 8); g.fillRect(mx - 3, hz - 31, 6, 1);
    }
  };
  // el Centro a lo lejos: casonas de dos pisos con balcones, torres de iglesia y cúpulas
  const COLONIAL = ['#d9c08a', '#c9b48a', '#b8c4c4', '#d0aea4', '#c8c0aa', '#b9a088'];
  const colonialLayer = (seed, haze, maxH, churches) => (g, W, H) => {
    let x = 0, i = 0;
    while (x < W) {
      const w = Math.min(W - x, 22 + Math.floor(h2(seed + i * 7) * 30));
      if (churches && h2(seed + i * 29) > 0.72 && w > 30) {
        // iglesia: dos torres con campanario y cúpula al medio
        const top = 128 - maxH - 26, col = COLONIAL[i % 2];
        g.fillStyle = col; g.fillRect(x, 128 - maxH, w, H);
        for (const tx of [x + 1, x + w - 9]) { g.fillStyle = col; g.fillRect(tx, top, 8, H); g.fillStyle = haze; g.fillRect(tx + 2, top + 4, 4, 5); g.fillRect(tx + 1, top - 5, 6, 5); g.fillRect(tx + 3, top - 9, 2, 4); }
        g.fillStyle = haze; for (let r = 0; r < 8; r++) g.fillRect(x + w / 2 - 8 + r, 128 - maxH - 8 + r, 16 - r * 2, 1);
      } else {
        const hh = 14 + Math.floor(h2(seed + i * 13) * maxH), top = 128 - hh;
        g.fillStyle = COLONIAL[Math.floor(h2(seed + i * 3) * COLONIAL.length)]; g.fillRect(x, top, w, H - top);
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x, top, w, 1);
        g.fillStyle = haze;
        for (let yy = top + 4; yy < 122; yy += 9) for (let xx = x + 3; xx < x + w - 4; xx += 7) g.fillRect(xx, yy, 3, 5);
        // balcón corrido, de madera oscura
        if (h2(seed + i * 17) > 0.4 && hh > 22) { g.fillStyle = '#6a4a32'; g.fillRect(x + 3, top + 7, Math.min(w - 6, 18), 6); }
      }
      x += w + (h2(seed + i * 5) > 0.7 ? 2 : 0); i++;
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  RENDER PROPIO DEL CAPÍTULO
  // ───────────────────────────────────────────────────────────────────────────
  const LIMA_X = 308;
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
    // en las azoteas: el fondo de los callejones, oscuro, entre edificio y edificio
    const A0 = BLD[0][0] * TS, A1 = CASONA * TS;
    if (cam.x + VIEW.w > A0 && cam.x < A1) {
      const top = 46 * TS, gr = ctx.createLinearGradient(0, top - 40, 0, top + 120);
      gr.addColorStop(0, 'rgba(60,58,70,0)'); gr.addColorStop(0.3, '#4a4652'); gr.addColorStop(1, '#25222c');
      const xa = Math.max(A0, cam.x); ctx.fillStyle = gr; ctx.fillRect(xa, top - 40, Math.min(cam.x + VIEW.w, A1) - xa, cam.y + VIEW.h - top + 40);
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
    // EL PLEBEYO (Felipe Pinglo Alva † 1936; dominio público en el Perú): vals
    // criollo en 3/4 (bar: 12) con guitarra: bordón en el 1, rasgueo en el 2 y el 3
    // y cajón. Transcripción propia de la melodía conocida (la de Jesús Vásquez,
    // 1938), cotejada con la transcripción publicada por R. Sarmiento ("Los tres
    // plebeyos", Antec 2018). Estrofa en La menor; el coro, en La mayor y una
    // octava arriba para que la guitarra no se pierda en el bajo.
    //  E  "La noche cubre ya…": mi | la sol# si la | DO—— si | la sol# do fa | mi——
    //     y "Luis Enrique, el plebeyo": do# do# do# do# do# | do# si do#… | re la fa——   confianza alta
    //  T  puente "Trémulo de emoción": sol fa# sol la la# | si—— re si | la—— si la | sol#——  confianza alta
    //  C  coro "Mi sangre, aunque plebeya" y "¡Señor! ¿por qué los seres…"               confianza alta (melodía)
    //  acordes: los de la transcripción en los compases marcados; el resto, nuestros   confianza media
    plebeyo: makeSong(Object.assign({ bar: 12, bpm: 160, vol: 0.27, strum: '....D...D...', drums: 'B...b...b...', kit: 'cajon', leadInst: 'guitar' }, COSTA), {
      E: { ch: ['Am', 'E7', 'Am', 'Am', 'Am', 'Am', 'E7', 'E7', 'E7', 'E7', 'E7', 'E7', 'E7', 'E7', 'Am', 'Am',
                'Am', 'E7', 'Am', 'Am', 'A7', 'A7', 'A7', 'Dm', 'G7', 'G7', 'C', 'C', 'E7', 'E7', 'Am', 'Am'],
           mel: 'r:2 E5:2 A5:2 G#5:2 B5:2 A5:2 | C6:8 r:2 B5:2 | A5:4 G#5:2 C6:4 F5:2 | E5:12 |' +
                'r:2 A4:2 A4:2 A4:2 A4:2 C5:2 | E5:2 E5:2 E5:2 E5:2 A5:2 G#5:2 | B5:2 A5:2 A5:2 A5:2 E5:2 E5:2 | D5:12 |' +
                'r:2 D5:2 D5:2 D5:2 G#5:2 B5:2 | D6:8 r:2 C6:2 | B5:4 A5:2 B5:4 A5:2 | G#5:12 |' +
                'r:2 E5:2 E5:2 E5:2 E5:2 E5:2 | F5:2 E5:2 E5:2 E5:2 E5:2 E5:2 | F5:2 E5:2 E5:2 E5:2 E5:2 F5:2 | E5:12 |' +
                'r:2 E5:2 A5:2 G#5:2 B5:2 A5:2 | C6:8 r:2 B5:2 | A5:4 G#5:2 C6:4 F5:2 | E5:12 |' +
                'r:2 C#6:2 C#6:2 C#6:2 C#6:2 C#6:2 | C#6:2 B5:2 C#6:2 C#6:2 C#6:2 C#6:2 | C#6:2 B5:2 A5:2 C#6:2 B5:2 A5:2 | D6:2 A5:2 F5:8 |' +
                'r:2 F5:2 F5:2 F5:2 D5:2 F5:2 | D6:8 r:2 C6:2 | B5:4 D6:2 C6:4 B5:2 | C6:12 |' +
                'r:2 E5:2 A5:2 B5:2 B5:2 B5:2 | C6:2 A5:2 E5:8 | r:2 C6:2 B5:2 A5:2 G#5:2 B5:2 | A5:12' },
      T: { ch: ['Am', 'G', 'F', 'E7'],
           mel: 'r:2 G5:2 F#5:2 G5:2 A5:2 A#5:2 | B5:8 D6:2 B5:2 | A5:8 B5:2 A5:2 | G#5:12' },
      C: { ch: ['A', 'A', 'E7', 'A', 'A', 'E7', 'E7', 'Bm', 'Bm', 'E7', 'E7', 'E7', 'A', 'E7', 'Dm', 'A',
                'A', 'C#7', 'C#7', 'F#m', 'F#m', 'F#7', 'F#7', 'Bm', 'Bm', 'E7', 'E7', 'A', 'A', 'B7', 'B7', 'E7', 'A', 'E7', 'E7', 'A'],
           mel: 'r:2 E5:2 D#5:2 E5:2 G#5:2 F#5:2 | F#5:2 E5:10 | r:2 A5:2 A5:2 G#5:2 F#5:2 G#5:2 | B5:2 A5:10 |' +
                'r:2 C#6:2 C#6:2 B5:2 B5:2 C#6:2 | B5:2 A5:2 G#5:2 A5:2 G#5:2 A5:2 | B5:10 G#5:2 | F#5:12 |' +
                'r:2 D5:2 D5:2 C#5:2 D5:2 D#5:2 | E5:2 D5:10 | r:2 A5:2 A5:2 F#5:2 G#5:2 A5:2 | G#5:2 F#5:10 |' +
                'r:2 C#6:2 D6:2 B5:2 C#6:2 A5:2 | B5:2 G#5:8 G#5:2 | B5:6 F#5:2 F#5:2 F5:2 | E5:12 |' +
                'r:2 C#6:2 C#6:2 C#6:2 C#6:2 D6:2 | C#6:2 C#6:8 C#6:2 | B5:6 B5:2 B5:2 A#5:2 | A5:2 A5:10 |' +
                'r:2 A5:2 G#5:2 F#5:2 G#5:2 A5:2 | F#5:2 F#5:8 G#5:2 | E5:6 D#5:2 E5:2 F#5:2 | D5:12 |' +
                'r:2 F#5:2 E#5:2 F#5:2 G#5:2 A5:2 | C#6:2 B5:10 | r:2 F#5:2 E#5:2 F#5:2 G#5:2 A5:2 | B5:2 A5:10 |' +
                'r:2 G#5:2 F#5:2 G#5:2 A5:2 C#6:2 | B5:4 D#5:8 | -:2 A5:2 D#5:2 F#5:2 A5:2 C#6:2 | B5:12 |' +
                'r:2 C#6:2 D6:2 B5:2 C#6:2 A5:2 | B5:4 G#5:8 | -:2 E5:2 D#5:2 E5:2 F#5:2 G#5:2 | A5:8 r:4' },
    }, ['E', 'T', 'C'], valsBass),
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  EL NIVEL
  // ───────────────────────────────────────────────────────────────────────────
  const H = 70;
  // azoteas del Centro: [desde, hasta, fila del techo, tile]
  const BLD = [[830, 846, 43, 'roof'], [847, 860, 35, 'roofS'], [863, 878, 38, 'roof'], [880, 892, 40, 'roofS'],
               [899, 914, 38, 'roof'], [917, 930, 41, 'roofS'], [933, 946, 39, 'roof']];
  const CASONA = 946;   // donde empieza el patio de la casona del concurso
  // escalones del puente peatonal: macizos (te frenan), de 3 casillas y 2 filas de alto
  const FB_STEPS = [[283, GR - 2], [286, GR - 4], [289, GR - 6], [292, GR - 8], [295, GR - 10], [298, GR - 12]];
  // la calle del Centro (fila ST) con sus buzones sin tapa: [x, ancho]
  const BUZONES = [[601, 2], [616, 3], [630, 3], [648, 3], [662, 3], [772, 3], [802, 3]];
  const STREET = [594, 830];
  function streetRects() {
    const out = []; let x = STREET[0];
    for (const [bx, bw] of BUZONES) { out.push([x, ST, bx - x, H - ST, 'paving'], [bx, ST + 1, bw, H - ST - 1, 'paving']); x = bx + bw; }
    out.push([x, ST, STREET[1] - x, H - ST, 'paving']);
    return out;
  }
  // casonas de fondo: [desde, hasta, fila de la cornisa, color, letrero]
  const CASONAS = [
    [454, 466, 35, '#d98a6a', null], [466, 478, 34, '#8ab0c8', 'GALERÍA'], [478, 490, 36, '#e3c06a', 'BODEGA'],
    [594, 604, 36, '#e3c06a', 'BOTICA'], [604, 614, 34, '#9cc3d0', 'BAZAR'], [614, 628, 33, '#d99a8a', null], [628, 640, 35, '#e3c06a', 'JOYERÍA'],
    [640, 654, 34, '#c4704a', 'CALZADO'], [654, 666, 35, '#e8e0cc', null], [666, 674, 36, '#9cc3d0', null],
    [734, 752, 35, '#d9c08a', null], [752, 764, 34, '#d0aea4', 'BAZAR'], [764, 782, 35, '#e3c06a', 'IMPORTACIONES'], [782, 796, 34, '#b8322a', 'CHIFA'],
    [796, 812, 35, '#9cc3d0', 'CASA DE CAMBIO'], [812, 830, 31, '#c9b48a', 'MERCADO CENTRAL'],
  ];
  // balcones de cajón que se pisan (Jr. de la Unión): [x, ancho, fila]
  const BALCONES = [[608, 5, 43], [615, 5, 41], [622, 5, 43], [634, 5, 43], [641, 5, 41], [647, 6, 43]];
  const L2 = {
    name: 'LA HACKATÓN EN LIMA', w: CASONA + 54, h: H, anchorRow: 46,
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
      // las playas del sur: el mar aparece junto a la carretera (Asia, Punta Hermosa)
      { x0: 230, x1: 244, anchorRow: GR, sky: { dawn: ['#3a3466', '#d9826a', '#ffc68a'], morning: ['#6aa6dc', '#b4dcf0', '#f6ead0'] }, layers: [
        { kind: 'mountains', color: '#b89a7c', color2: '#a68a6c', y: GR - 6, parallax: 0.06, vpar: 0.08, amp: 5, seed: 12 },
        { kind: 'hills', color: '#4f86a8', color2: '#4f86a8', y: GR - 2, parallax: 0.12, vpar: 0.16, amp: 1, build: seaLayer(5, '#4f86a8', '#e8f4f6', false) },
        { kind: 'hills', color: '#e2c08e', color2: '#cfac7a', y: GR - 0.4, parallax: 0.3, vpar: 0.38, amp: 1.2, seed: 21 },
      ] },
      // el Centro de Lima: cielo "panza de burro", el San Cristóbal con su cruz,
      // torres de iglesia y casonas con balcones
      // Miraflores: panza de burro sobre el mar, el Morro Solar al fondo
      { x0: 302, x1: 316, anchorRow: 48, sky: { dawn: ['#6f7080', '#9a9aa6', '#bdbcbf'], morning: ['#8f929e', '#b4b6be', '#d2d1d2'], sun: false }, layers: [
        { kind: 'hills', color: '#7f97a2', color2: '#7f97a2', y: 44, parallax: 0.04, vpar: 0.06, amp: 1, build: seaLayer(3, '#7f97a2', '#a9bcc4', true) },
        { kind: 'hills', color: '#6f8b98', color2: '#6f8b98', y: 50, parallax: 0.2, vpar: 0.3, amp: 1, build: seaLayer(9, '#6f8b98', '#e8f0f2', false) },
      ] },
      // Barranco: casonas de colores sobre el acantilado y el mar detrás
      { x0: 404, x1: 418, anchorRow: 46, sky: { dawn: ['#6f7080', '#9a9aa6', '#bdbcbf'], morning: ['#8f929e', '#b4b6be', '#d2d1d2'], sun: false }, layers: [
        { kind: 'hills', color: '#7f97a2', color2: '#7f97a2', y: 44, parallax: 0.04, vpar: 0.06, amp: 1, build: seaLayer(5, '#7f97a2', '#a9bcc4', true) },
        { kind: 'hills', color: '#a8a39a', color2: '#9a958c', y: 46, parallax: 0.2, vpar: 0.26, amp: 1, build: colonialLayer(17, '#7a706a', 26, true) },
      ] },
      { x0: 482, x1: 494, anchorRow: 44, sky: { dawn: ['#6f7080', '#9a9aa6', '#bdbcbf'], morning: ['#8f929e', '#b4b6be', '#d2d1d2'], sun: false }, layers: [
        { kind: 'hills', color: '#a59a92', color2: '#958a83', y: 40, parallax: 0.06, vpar: 0.08, amp: 1, build: sanCristobal(3, '#a59a92', '#857a73') },
        { kind: 'hills', color: '#a8a39a', color2: '#9a958c', y: 43, parallax: 0.14, vpar: 0.18, amp: 1, build: colonialLayer(11, '#8e8a86', 40, true) },
        { kind: 'hills', color: '#8a8580', color2: '#7a756f', y: 45.5, parallax: 0.3, vpar: 0.36, amp: 1, build: colonialLayer(29, '#6f6a66', 26, false) },
      ] },
    ],
    spawn: { x: 7, y: 36 },
    goal: { x: CASONA + 17.5, y: 46 },
    // el parapente: planeas sobre la Costa Verde y lo sueltas al pisar la playa
    glide: { x0: 340, x1: 404 }, glideLandRow: 60,   // la flecha de "¡POR AQUÍ!" apunta a tu sitio en el concurso
    zones: [
      { x: 0,   name: 'EL DESIERTO',     music: 'desierto' },
      { x: 196, name: 'LA PANAMERICANA', music: 'panamericana' },
      { x: 316, name: 'MIRAFLORES',      music: 'desierto' },
      { x: 352, name: 'LA COSTA VERDE',  music: 'desierto' },
      { x: 410, name: 'BARRANCO',        music: 'plebeyo' },
      { x: 504, name: 'EN MOTOTAXI',     music: 'panamericana' },
      { x: 594, name: 'JR. DE LA UNIÓN', music: 'plebeyo' },
      { x: 674, name: 'PLAZA DE ARMAS',  music: 'plebeyo' },
      { x: 734, name: 'BARRIO CHINO',    music: 'plebeyo' },
      { x: 830, name: 'LAS AZOTEAS',     music: 'plebeyo' },
      { x: CASONA + 2, name: 'LA CASONA', music: 'plebeyo' },
    ],
    rects: [
      ...duneFill(H),
      // ── LA PANAMERICANA: la pista sigue por debajo del puente hasta el túnel ──
      [196, GR, 126, H - GR, 'asphalt'],
      [316, GR - 2, 1, 2, 'blockInvis'],                        // boca del túnel: solo entran las combis
      ...FB_STEPS.map(s => [s[0], s[1], 3, GR - s[1], 'conc']),   // escalera del puente peatonal
      // ── MIRAFLORES: el malecón sobre el acantilado y la playa de la Costa Verde ──
      [316, 44, 36, H - 44, 'malecon'],
      [352, 64, 58, H - 64, 'playa'],
      // ── BARRANCO: la Bajada de Baños (escalones de 2 filas), el Puente de los Suspiros y la calle ──
      ...Array.from({ length: 9 }, (_, k) => [410 + 3 * k, 62 - 2 * k, 3, H - (62 - 2 * k), 'bajada']),
      [437, ST, 7, H - ST, 'paving'], [444, ST, 10, 1, 'blockInvis'], [454, ST, 36, H - ST, 'paving'],
      // ── EL CENTRO: sobre el túnel de la Vía Expresa y la calle de lajas ──
      [490, 44, 14, 10, 'conc'], [496, 54, 8, H - 54, 'conc'],
      // la avenida del mototaxi, hasta la entrada del Jr. de la Unión
      [504, ST, 90, H - ST, 'avenida'],
      // el tráfico: combis paradas que se pueden pisar
      [521, ST - 2, 4, 2, 'blockInvis'], [554, ST - 2, 4, 2, 'blockInvis'], [559, ST - 2, 4, 2, 'blockInvis'],
      ...streetRects(),
      // la pileta de la Plaza: taza grande y taza chica
      [700, ST - 2, 9, 2, 'blockInvis'], [703, ST - 4, 3, 2, 'blockInvis'],
      // cajones de fruta para subir del Mercado a las azoteas
      [821, ST - 1, 4, 1, 'crate'], [825, ST - 2, 5, 2, 'crate'],
      // ── LAS AZOTEAS ──
      ...BLD.map(b => [b[0], b[2], b[1] - b[0], H - b[2], b[3]]),
      // tanques de agua (sólidos)
      [854, 33, 2, 2, 'blockInvis'], [903, 36, 2, 2, 'blockInvis'], [939, 37, 2, 2, 'blockInvis'],
      // ── LA CASONA: el patio ──
      [CASONA, 46, 54, H - 46, 'paving'],
    ],
    platforms: [
      // techo del peaje
      [262, GR - 6, 10, 'canopy'],
      // escaleras y tablero del puente peatonal
      [301, 44, 15, 'steel'],
      // balcones del Jr. de la Unión y el tejado de la portada china
      ...BALCONES.map(b => [b[0], b[2], b[1], 'balc']),
      [740, 42, 11, 'tejado'],
    ],
    liquids: [
      // aniego: la tubería reventó y la pista está inundada
      [222, GR, 10, 2, 'water', 1],
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
      // ── LA PANAMERICANA (corta: un aniego, el peaje y el puente) ──
      // apenas dejas la tabla (así nunca reapareces a pie en las dunas)
      { type: 'checkpoint', x: 180, y: GR },
      // el bus Ica–Lima (el mismo del capítulo 3): te lleva por la costa hasta el puente peatonal
      { type: 'bus', x: 197, y: GR, stop: 273, label: 'ICA - LIMA', shout: '¡LIMA, LIMA, LIMA!', arrive: '¡LLEGASTE A LIMA!' },
      { type: 'roadHint', x0: 186, x1: 198, text: '¡SÚBETE AL BUS!' },
      { type: 'sign', x: 202, y: GR, lines: ['PANAMERICANA SUR', 'LIMA 299 KM'], style: 'post' },
      { type: 'sign', x: 213.5, y: GR, lines: ['CHINCHA', 'CAÑETE'], style: 'post' },
      { type: 'sign', x: 230, y: GR, lines: ['ASIA', 'PLAYAS DEL SUR'], style: 'board', col: '#9cd3f0' },
      { type: 'sign', x: 240, y: GR, lines: ['PUNTA HERMOSA'], style: 'post' },
      { type: 'vendor', x: 207, y: GR, shout: '¡CHICHA MORADA, CHICHA!', kind: 'chicha' },
      { type: 'sign', x: 219.5, y: GR, lines: ['¡CUIDADO!', 'ANIEGO'], style: 'board', col: '#f6c94a' },
      { type: 'geyser', x: 226.5 },
      { type: 'sign', x: 248, y: GR, lines: ['LIMA 12 KM'], style: 'post' },
      { type: 'vendor', x: 252, y: GR, shout: '¡GASEOSA, GALLETA, CHIFLES!', kind: 'cooler' },
      { type: 'peaje', x0: 262, x1: 272, y: GR - 6, price: 'S/ 6.10' },
      { type: 'sign', x: 283, y: GR, lines: ['SE VENDE TERRENO', 'TRATO DIRECTO'], style: 'board' },
      { type: 'footbridge', x0: 283, x1: 316, deck: 44, steps: FB_STEPS },
      { type: 'roadHint', x0: 273, x1: 300, text: '¡SUBE POR EL PUENTE PEATONAL!' },
      { type: 'tunnel', x: 316 },
      // ── MIRAFLORES ──
      { type: 'vuelos', x0: 330, x1: 430, y: 40 },
      { type: 'baranda', x0: 316, x1: 352, y: 44 },
      { type: 'checkpoint', x: 319, y: 44, help: 'AGARRA EL PARAPENTE Y SALTA' },
      { type: 'sign', x: 318, y: 44, lines: ['MIRAFLORES'], style: 'post' },
      { type: 'parqueAmor', x: 323, y: 44 },
      { type: 'prop', kind: 'perro', x: 337, y: 44 },
      { type: 'npc', x: 340.5, y: 44, model: 'ambulante', lines: ['¡CHOCOTEJAS DE ICA!', '¡LLÉVATE PARA LA PROFE!'] },
      { type: 'carretilla', x0: 320, x1: 340, y: 44, speed: 1.6, gap: 260, load: 'bici' },
      { type: 'larcomar', x0: 336, x1: 350, y: 48 },
      { type: 'npc', x: 345.5, y: 44, model: 'parapentista', lines: ['¡VUELA CONMIGO, CAUSA!', '¡QUÉ TAL VISTA DESDE ARRIBA!'] },
      { type: 'parapente', x: 348.5, y: 44 },
      { type: 'hint', x: 349.2, y: 44, text: '¡AGARRA EL PARAPENTE!', arrow: 'down', r: 6, pass: 1, dy: 14, when: (g) => !g.player.gliding },
      { type: 'hint', x: 351, y: 44, text: '¡SALTA AL VACÍO!', key: 'jump', arrow: 'right', r: 4, pass: 2, when: (g) => g.player.gliding && g.player.onGround },
      { type: 'help', x0: 340, x1: 410, kind: 'fall', text: 'AGARRA EL PARAPENTE ANTES' },
      { type: 'help', x0: 316, x1: 342, kind: 'bici', text: '¡SALTA LA BICI!' },
      // ── LA COSTA VERDE ──
      { type: 'mar', x0: 352, x1: 437, y: 64 },
      { type: 'page', x: 381, y: 54 },   // la hoja que se voló: atrápala en el aire
      { type: 'palomas', kind: 'gaviota', x0: 372, x1: 384, y: 64, n: 6 },
      { type: 'npc', x: 391.5, y: 64, model: 'surfista', lines: ['¡QUÉ TAL OLA, CAUSA!', 'EL AGUA ESTÁ HELADA'] },
      { type: 'npc', x: 400.5, y: 64, model: 'ambulante', lines: ['¡RASPADILLA, CAUSA!', '¿DE FRESA O DE PIÑA?'] },
      { type: 'checkpoint', x: 404, y: 64, help: 'SUBE POR LA ESCALERA' },
      // ── BARRANCO ──
      { type: 'bajada', x0: 408, x1: 437, top: 30, bottom: 64 },
      { type: 'sign', x: 413, y: 62, lines: ['BAJADA', 'DE BAÑOS'], style: 'board', col: '#fff3d6' },
      { type: 'checkpoint', x: 438, y: ST, help: 'CRUZA SIN SALTAR: ¡+1 MIN!' },
      { type: 'npc', x: 440.5, y: ST, model: 'abuelo', lines: ['EL PUENTE DE LOS SUSPIROS...', 'SI LO CRUZAS SIN RESPIRAR...', '¡SE CUMPLE TU DESEO!'] },
      { type: 'suspiros', x0: 444, x1: 454, y: ST },
      { type: 'hint', x: 445, y: ST, text: '¡CRUZA SIN SALTAR!', arrow: 'right', r: 4, pass: 3 },
      { type: 'murales', x0: 455, x1: 478, top: 39 },
      { type: 'sign', x: 456, y: ST, lines: ['BARRANCO'], style: 'post' },
      { type: 'npc', x: 462.5, y: ST, model: 'pintor', lines: ['¡CUIDADO, PINTURA FRESCA!', '¿TE GUSTA MI MURAL?'] },
      { type: 'balde', x: 465 },
      { type: 'npc', x: 472.5, y: ST, model: 'senora', lines: ['¡PICARONES CALIENTITOS!', '¿CON MIEL, CASERITO?'] },
      { type: 'carretilla', x0: 456, x1: 484, speed: 1.8, gap: 220, load: 'bici' },
      { type: 'help', x0: 454, x1: 490, kind: 'bici', text: '¡SALTA LA BICI!' },
      // ── JR. DE LA UNIÓN ──
      // casonas y balcones primero: se dibujan detrás de todo lo demás
      ...CASONAS.map(c => ({ type: 'casona', x0: c[0], x1: c[1], top: c[2], col: c[3], sign: c[4] })),
      ...BALCONES.map((b, i) => ({ type: 'balcon', x: b[0], w: b[1], y: b[2], col: ['#5a3418', '#2f5a3a', '#6a3a1a'][i % 3] })),
      { type: 'checkpoint', x: 494, y: 44, help: 'SÚBETE AL MOTOTAXI Y ACELERA' },
      // ── EN MOTOTAXI ──
      { type: 'avenida', x0: 504, x1: 594, skip: [[521, 532]], panel: 562 },
      { type: 'contramano', x0: 504, x1: 594 },
      { type: 'npc', x: 497.5, y: 44, model: 'mototaxista', lines: ['¡TE PRESTO MI MOTO, CAUSA!', '¡AL CENTRO, VOLANDO!'] },
      { type: 'motoRide', x: 499, y: 44, model: 'rojo', end: 586 },
      { type: 'hint', x: 500, y: 44, text: '¡SÚBETE AL MOTOTAXI!', arrow: 'down', r: 6, pass: 2, dy: 16, when: (g) => !g.player.riding },
      { type: 'hint', x: 508, y: ST, text: '¡ACELERA!', key: 'right', r: 4, pass: 4, when: (g) => g.player.riding instanceof MotoRide },
      { type: 'bache', x: 510 }, { type: 'bache', x: 513.5 },
      { type: 'rampa', x: 517 },
      { type: 'parkedCombi', x: 521, n: 1, line: '¡SUBE, SUBE, HAY SITIO!' },
      { type: 'hint', x: 518, y: ST, text: 'SALTA', key: 'jump', r: 3, pass: 1, when: (g) => g.player.riding instanceof MotoRide },
      { type: 'tambo', x: 525.5 },
      { type: 'cruce', x: 532 },
      { type: 'bache', x: 538 }, { type: 'bache', x: 540.5 }, { type: 'bache', x: 543 },
      { type: 'sign', x: 547, y: ST, lines: ['¡VUELA,', 'CAUSA!'], style: 'board', col: '#f6c94a' },
      { type: 'rampa', x: 549, big: true, power: 10.5 },
      { type: 'parkedCombi', x: 554, n: 2, line: '¡LIMA, LIMA, LIMA!' }, { type: 'parkedCombi', x: 559, n: 3, line: '¡PIII! ¡QUÉ TRÁFICO!' },
      { type: 'bache', x: 568 }, { type: 'bache', x: 571 },
      { type: 'cruce', x: 574 },
      { type: 'sign', x: 583, y: ST, lines: ['AL CENTRO NO', 'ENTRAN MOTOTAXIS'], style: 'board' },
      { type: 'checkpoint', x: 590, y: ST, help: 'SALTA LOS HUECOS EN EL BORDE' },
      { type: 'sign', x: 497, y: 46.4, lines: ['AL CENTRO'], style: 'paint', col: '#f6c94a' },
      { type: 'sign', x: 501, y: 44, lines: ['CENTRO DE LIMA'], style: 'post' },
      { type: 'megafono', xs: [597.5, 791.5] },   // el ambulante del Jr. de la Unión y el del Mercado
      { type: 'npc', x: 597.5, y: ST, model: 'ambulante', lines: ['¡CHICLE, CARAMELO, CHUPETÍN!', '¡A SOL NOMÁS, CAUSA!'] },
      { type: 'hint', x: 601.5, y: ST, text: '¡SALTA EL HUECO!', key: 'jump', arrow: 'down', r: 6, pass: 1 },
      ...BUZONES.map(([x, w]) => ({ type: 'buzon', x, w })),
      { type: 'hint', x: 610, y: 43, text: '¡SÚBETE AL BALCÓN!', arrow: 'down', r: 5, pass: 1, dy: 4 },
      { type: 'help', x0: 594, x1: 674, kind: 'buzon', text: 'SALTA JUSTO EN EL BORDE' },
      { type: 'help', x0: 594, x1: 734, kind: 'carretilla', text: '¡VE POR LOS BALCONES!' },
      { type: 'carretilla', x0: 604, x1: 672, speed: 1.9, gap: 150, load: 'papa' },
      { type: 'palomas', x0: 656, x1: 666, n: 6 },
      { type: 'vendor', x: 668, y: ST, shout: '¡HELADO, HELADITO!', kind: 'cooler' },
      // ── PLAZA DE ARMAS (respiro: nada te mata aquí) ──
      { type: 'plazaFondo', x0: 674, x1: 734, cat: [675, 699], pal: [710, 734] },
      { type: 'checkpoint', x: 676, y: ST },
      // el grass (pita el guardián), las palomas y la pileta son escenario que reacciona: entidades propias del capítulo
      { type: 'grass', x0: 679, x1: 688 },
      { type: 'palomas', x0: 691, x1: 699, n: 8 },
      { type: 'pileta', x: 700 },
      { type: 'palomas', x0: 710, x1: 719, n: 7 },
      // los húsares de Palacio
      { type: 'npc', x: 720.5, y: ST, model: 'husar', flip: true, lines: ['¡SIGA, JOVEN, SIGA!', '¡AQUÍ NO SE JUEGA!'] },
      { type: 'npc', x: 730.5, y: ST, model: 'husar', flip: true, lines: ['¡CORRE, QUE LLEGAS TARDE!', '¡LA HACKATÓN ES POR ALLÁ!'] },
      // ── BARRIO CHINO Y MERCADO CENTRAL ──
      { type: 'portadaChina', x0: 740, x1: 751, y: 42 },
      // el perro chusco del barrio duerme bajo la portada: sáltalo o pasa por el tejado
      { type: 'dog', x0: 742, x1: 751, y: ST },
      { type: 'checkpoint', x: 727, y: ST, help: 'LOS TOLDOS TE HACEN REBOTAR' },
      { type: 'hint', x: 756.5, y: 43, text: '¡CAE EN EL TOLDO!', arrow: 'down', r: 6, pass: 1, dy: 4 },
      { type: 'toldo', x0: 754, x1: 759, y: 43, col: ['#2b6fb8', '#fffaf0'], goods: 'fruta' },
      { type: 'npc', x: 762.5, y: ST, model: 'emoliente', lines: ['¡EMOLIENTE, CALIENTITO!', '¿CON UÑA DE GATO?', '¡PARA LA GARÚA, CAUSA!'] },
      { type: 'npc', x: 768.5, y: ST, model: 'cambista', lines: ['¿DÓLARES? ¿CAMBIO?', '¡A BUEN PRECIO, CASERITO!'] },
      { type: 'carretilla', x0: 752, x1: 820, speed: 2.1, gap: 160, load: 'naranja' },
      { type: 'carretilla', x0: 752, x1: 820, speed: 2.1, gap: 160, delay: 50, load: 'papa' },   // van de dos en dos
      { type: 'help', x0: 736, x1: 754, kind: 'dog', text: '¡VE POR EL TEJADO!' },
      { type: 'toldo', x0: 776, x1: 781, y: 43, col: ['#c8322a', '#fffaf0'], goods: 'papa' },
      // los farolitos del chifa se mecen y suenan al tocarlos (escenario propio del capítulo)
      { type: 'farolitos', x0: 782, x1: 796, y: 41 },
      { type: 'npc', x: 785.5, y: ST, model: 'mozo', lines: ['¡PASE, PASE, HAY CHAUFA!', '¡WANTÁN FRITO, CALIENTITO!'] },
      { type: 'npc', x: 791.5, y: ST, model: 'ambulante', lines: ['¡A SOL, A SOL, A SOL!', '¡LLÉVATE TRES, CAUSA!'] },
      { type: 'npc', x: 799.5, y: ST, model: 'cambista', lines: ['¡CAMBIO, DÓLAR, EURO!', '¿CUÁNTO CAMBIAS, PATA?'] },
      { type: 'help', x0: 734, x1: 830, kind: 'carretilla', text: 'SALTA O SÚBETE A UN TOLDO' },
      { type: 'help', x0: 734, x1: 830, kind: 'buzon', text: 'SALTA JUSTO EN EL BORDE' },
      { type: 'toldo', x0: 808, x1: 813, y: 43, col: ['#2f7a46', '#f6c94a'], goods: 'fruta' },
      { type: 'checkpoint', x: 818, y: ST },
      { type: 'hint', x: 827, y: ST - 2, text: '¡A LAS AZOTEAS!', arrow: 'right', r: 7, pass: 3 },
      // ── LAS AZOTEAS ──
      ...BLD.map(b => ({ type: 'facade', x0: b[0], x1: b[1], y: b[2] })),
      { type: 'tank', x: 854, y: 35 }, { type: 'tank', x: 903, y: 38 }, { type: 'tank', x: 939, y: 39 },
      { type: 'sign', x: 834, y: 44.6, lines: ['CUIDADO', 'CON EL PERRO'], style: 'paper', col: '#1d1622' },
      { type: 'dog', x0: 830, x1: 836.5, y: 43 },
      { type: 'help', x0: 830, x1: CASONA, kind: 'dog', text: 'SALTA AL PERRO Y SIGUE' },
      { type: 'help', x0: 830, x1: CASONA, kind: 'fall', text: 'CAE EN LA ROPA PARA SUBIR' },
      // la ropa tendida llega hasta la pared del edificio alto: si caes encima, rebotas
      { type: 'clothesline', x0: 837, x1: 847, y: 41, base0: 43, base1: 43, hint: '¡SALTA SOBRE LA ROPA TENDIDA!' },
      { type: 'page', x: 842, y: 32 },
      { type: 'checkpoint', x: 864.5, y: 38, help: 'SALTA AL PERRO Y SIGUE' },
      { type: 'dog', x0: 869, x1: 878, y: 38 },
      { type: 'rebar', x: 885, y: 40 },
      { type: 'sign', x: 886, y: 41.6, lines: ['PROHIBIDO', 'ARROJAR BASURA'], style: 'paint', col: '#b8322a' },
      { type: 'clothesline', x0: 891.5, x1: 899, y: 37, base0: 40, base1: 38, hint: '¡OTRA VEZ LA ROPA!' },
      { type: 'dog', x0: 905, x1: 914, y: 38 },
      { type: 'rebar', x: 922, y: 41 },
      { type: 'sign', x: 924, y: 42.6, lines: ['HAY MAZAMORRA', 'MORADA'], style: 'paper' },
      { type: 'sign', x: 942, y: 40.6, lines: ['SE HACEN', 'TAREAS'], style: 'paper', col: '#2b4f86' },
      // ── LA CASONA ──
      { type: 'checkpoint', x: CASONA + 3, y: 46 },
      { type: 'contest', x: CASONA + 10, y: 46 },
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
    roadHint: (d) => new RoadHint(d),
    rebar: (d) => new Rebar(d),
    tank: (d) => new WaterTank(d),
    clothesline: (d) => new Clothesline(d),
    dog: (d) => new Dog(d),
    facade: (d) => new Facade(d),
    contest: (d) => new Contest(d),
    motoRide: (d) => new MotoRide(d),
    parapente: (d) => new Parapente(d),
    baranda: (d) => new Baranda(d),
    vuelos: (d) => new Vuelos(d),
    parqueAmor: (d) => new ParqueAmor(d),
    larcomar: (d) => new Larcomar(d),
    mar: (d) => new Mar(d),
    bajada: (d) => new Bajada(d),
    avenida: (d) => new Avenida(d),
    suspiros: (d) => new Suspiros(d),
    murales: (d) => new Murales(d),
    balde: (d) => new Balde(d),
    rampa: (d) => new Rampa(d),
    bache: (d) => new Bache(d),
    parkedCombi: (d) => new ParkedCombi(d),
    tambo: (d) => new TamboStore(d),
    cruce: (d) => new Cruce(d),
    contramano: (d) => new Contramano(d),
    casona: (d) => new Casona(d),
    balcon: (d) => new Balcon(d),
    buzon: (d) => new Buzon(d),
    carretilla: (d) => new Carretilla(d),
    megafono: (d) => new Megafono(d),
    palomas: (d) => new Palomas(d),
    grass: (d) => new Grass(d),
    pileta: (d) => new Pileta(d),
    plazaFondo: (d) => new PlazaFondo(d),
    portadaChina: (d) => new PortadaChina(d),
    toldo: (d) => new Toldo(d),
    farolitos: (d) => new Farolitos(d),
  });

  // ───────────────────────────────────────────────────────────────────────────
  //  EL CAPÍTULO
  // ───────────────────────────────────────────────────────────────────────────
  CHAPTERS.push({
    num: 2, title: 'LA HACKATÓN EN LIMA', short: 'LIMA', color: '#e0b47c',
    goal: '¡LLEGA A LA HACKATÓN ANTES DE LAS 8:00!', goalShort: '¡ANTES DE LAS 8:00!',
    banner: ['LA HACKATÓN EN LIMA', '¡LA HACKATÓN EMPIEZA A LAS 8:00!'],
    dayStart: 6 * 60 + 30,   // el bus se malogró a las 6:30: Miraflores, Barranco y el Centro hasta las 8:00
    deathTitle: '¡ASU MARE!',
    deathMsgs: {
      combi: '¡TE CHAPÓ LA COMBI!', buggy: '¡TE ATROPELLÓ EL TUBULAR!', cactus: '¡TE ESPINASTE CON EL CACTUS!',
      water: '¡TE CAÍSTE AL ANIEGO!', dog: '¡EL PERRO CHUSCO TE BOTÓ!', rebar: '¡TE CHUZASTE CON LOS FIERROS!',
      buzon: '¡TE CAÍSTE AL BUZÓN!', carretilla: '¡TE ATROPELLÓ LA CARRETILLA!',
      fall: '¡TE FUISTE PARA ABAJO!', bici: '¡TE CHOCÓ LA BICI!', default: '¡QUÉ PASÓ, CAUSA!',
    },
    tips: ['TABLA: TÓCALA, BAJA LAS DUNAS Y SALTA EN LAS CRESTAS.', 'COMBI: SÚBETE AL TECHO. MOTOTAXI: ¡MANÉJALO!', 'BALCONES, TOLDOS Y ROPA: SÚBETE ENCIMA.', 'BUZÓN, CARRETILLA Y PERRO: SÁLTALOS.'],
    onStart: (g) => { g.combiRides = 0; },
    win: {
      title: '¡LLEGASTE A LA HACKATÓN!',
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
