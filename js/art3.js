// art3.js — pixel art del Capítulo 3 (Cusco, Valle Sagrado, el tren y Machu
// Picchu). Mismo método que art.js: mapas de píxeles + paleta, a mano.

// Todo queda dentro de ART3 para no chocar con los nombres de otros capítulos.
const ART3 = (() => {
  // paleta extra: enlucido colonial, tejas, piedra inca, andén y estación
  const PAL3 = Object.assign({}, PAL, {
    'H': '#efe6d6', 'J': '#d8ccb6',                     // enlucido blanco
    'N': '#b5523b', 'P': '#8e3b2a', 'V': '#d9785a',     // tejas de arcilla
    '2': '#a89e8c', '3': '#8c8272', '4': '#c7bdaa', '5': '#5f574a',   // piedra inca
    '6': '#7d8c6a', '7': '#e8c44a', '8': '#9aa0a8', '9': '#6e747c',   // musgo, franja, cemento
  });
  function spr3(rows, extra) { return PIX.fromRows(rows, extra ? Object.assign({}, PAL3, extra) : PAL3); }

  const T3 = {};
  // ── tiles 16x16 ──────────────────────────────────────────────────────────────
  // calle empedrada del Cusco: cantos rodados con tierra entre piedra y piedra
  T3.cobble = spr3([
    '5444325444325445',
    '4222324222342223',
    '4222354223542223',
    '3333553335533335',
    '5424442354442244',
    '2222243222243222',
    '3222353222353322',
    '5333555333555333',
    'mmmmmmmmmmmmmmmm',
    'mmjmmmmmmmmjmmmm',
    'mmmmmMmmmmmmmmmm',
    'mmmmmmmmmmMmmsmm',
    'mjmmmmmmmmmmmmjm',
    'mmmsmmmmMmmmmmmm',
    'mmmMmmmmmmmmmmmm',
    'MmmmmmmmmmmmmmmM',
  ]);
  // muro inca: sillares grandes, pulidos y encajados sin mortero
  T3.inca = spr3([
    '.44444444524444.',
    '4422222225322244',
    '4222222225322223',
    '4222222225322223',
    '4222222225322223',
    '3222222235322233',
    '3333333355333333',
    '5555555555555555',
    '444452.444444445',
    '2222535222222235',
    '2222532222222235',
    '2222532222222235',
    '2222532222222235',
    '3222533222222335',
    '3333553333333355',
    '5555555555555555',
  ]);
  // andén (terraza inca): pasto arriba y muro de piedra
  T3.andenTop = spr3([
    '..E....E...E..E.',
    '.Ee..eEe..eEe.Ee',
    'eege.egge.eggeeg',
    'ggggggggggggGggg',
    'GgGGgGGGgGGgGGgG',
    '5555555555555555',
    '444452.444444445',
    '2222535222222235',
    '2222532222222235',
    '2222532222222235',
    '3222533222222335',
    '3333553333333355',
    '5555555555555555',
    '.44444444524444.',
    '4222222225322223',
    '3333333355333333',
  ]);
  // andén de la estación: cemento con la franja amarilla de seguridad
  T3.plat = spr3([
    '7777777777777777',
    '7K77K77K77K77K77',
    '8888888888888888',
    '8898888889888898',
    '8888888888888888',
    '9999999999999999',
    '5555555555555555',
    '444452.444444445',
    '2222535222222235',
    '2222532222222235',
    '2222532222222235',
    '3222533222222335',
    '3333553333333355',
    '5555555555555555',
    '.44444444524444.',
    '3333333355333333',
  ]);
  // escalón de granito con musgo (Camino Inca)
  T3.granTop = spr3([
    '6.66.6666.66.666',
    '6666666666666666',
    '4444444444444444',
    '4222222225322244',
    '4222222225322223',
    '4222222225322223',
    '3222222235322233',
    '3333333355333333',
    '5555555555555555',
    '444452.444444445',
    '2222535222222235',
    '2222532222222235',
    '2222532222222235',
    '3222533222222335',
    '3333553333333355',
    '5555555555555555',
  ]);
  // escalera voladiza: piedra que sobresale del muro del andén
  T3.saruna = spr3([
    '4444444444444444',
    '2222222222222225',
    '3333333333333335',
    '5555555555555555',
  ]);
  // costales de papa y choclo apilados en el mercado
  T3.sacks = spr3([
    '..KKKKK..KKKKK..',
    '.KtttTK.KtttTK..',
    'KttttttKKttttttK',
    'KtTtttTKKtTtttTK',
    'KttyttTKKttettTK',
    'KtTtttTKKtTtttTK',
    '.KTTTTK..KTTTTK.',
    'KKKKKKKKKKKKKKKK',
    'KttttTKttttTKttK',
    'KtTttTKtTttTKtTK',
    'KtteTTKtttyTKttK',
    'KtTttTKtTttTKtTK',
    'KttttTKttttTKttK',
    'KTTTTTKTTTTTKTTK',
    'KttttTKttttTKttK',
    'KKKKKKKKKKKKKKKK',
  ]);

  // ── el niño agachado (para los túneles del tren). 16x22 como los demás ─────
  const P3 = {};
  P3.crouch = spr3([
    '................', '................', '................', '................',
    '................', '................', '................', '................',
    ...KID_TOP.slice(1, 12),
    '..TTKrrrrrrrK...',
    '.TTTKRuRuRuRRK..',
    '...KKaKUUKaKK...',
  ]);

  // ── ALPACA (mirando a la derecha): más lanuda que la llama, cuello corto y
  // copete de lana. 26x24, con las mismas patas que la llama.
  const ALPACA_TOP = [
    '...................x.y....',
    '..................KxKyK...',
    '.................KffffK...',
    '................KfflfflK..',
    '................KllKlllK..',
    '................KlllllllK.',
    '................KllllllKK.',
    '.................KlllKKK..',
    '.................KfllK....',
    '................KfllllK...',
    '................KfllllK...',
    '..KK..KKKKKKKKKKKfllllK...',
    '.KffKfllflllfllflllllK....',
    'KlffflllllllllllllllK.....',
    'KlllllllflllllllflllK.....',
    'KllflllllllllflllllLK.....',
    'KLlllllflllllllllLLK......',
    '.KLllllllllllllllLK.......',
    '.KLLlLLlLLLlLLLlLLK.......',
  ];
  // la de la foto lleva su mantita tejida
  const ALPACA_FOTO = ALPACA_TOP.slice(0, 12).concat([
    '.KffKxyrqyrxqyrKllllK.....',
    'KlffKrrrrrrrrrrKlllK......',
    'KlllKyqyqyqyqyqKlllK......',
    'KllfKRRRRRRRRRRKlllLK.....',
    ALPACA_TOP[16], ALPACA_TOP[17], ALPACA_TOP[18],
  ]);
  function alpacaSet(top, colors) {
    const s = (l) => spr3(top.concat(LLAMA_LEGS[l]), colors);
    return { idle: s('idle'), run: [s('runA'), s('runB'), s('runC'), s('runB')], jump: s('jump') };
  }
  const ALP = {
    foto: alpacaSet(ALPACA_FOTO),
    // café, la que escupe desde los techos
    cafe: alpacaSet(ALPACA_TOP, { l: '#b07a4a', f: '#c99464', L: '#7d5232' }),
    // la llama de Machu Picchu, crema con manchas
    mp: alpacaSet(ALPACA_TOP, { l: '#ece4d4', f: '#fff8ec', L: '#a88a68' }),
  };

  // ── TURISTA: sombrero, lentes oscuros, camisa floreada y cámara. 14x26 ─────
  const TOURIST_ROWS = [
    '....KKKKK.....',
    '...KtttttK....',
    '.KKtttttttKK..',
    'KttttttttttttK',
    '.KKaaaaaaaKK..',
    '...K00K00aK...',
    '...KaaaaaaK...',
    '...KaaRRaaK...',
    '....KKaaKK....',
    '..KorooorooK..',
    '.KoyooroooyoK.',
    '.KooroooyooroK',
    '.KaoyooroKKKaK',
    '.KaoooyoK11K..',
    '..KoorooKKKK..',
    '..KvvvvvvvvK..',
    '..KvvvvvvvvK..',
    '..KvvvKvvvvK..',
    '..KvvK.KvvvK..',
    '...KaK..KaK...',
    '...KaK..KaK...',
    '...KaK..KaK...',
    '...KaK..KaK...',
    '..KwwK.KwwK...',
    '..KKKKK.KKKK..',
  ];
  const TOURIST = [
    spr3(TOURIST_ROWS),
    // el insolado: camisa morada y la piel como camarón
    spr3(TOURIST_ROWS, { o: '#8a4cc0', a: '#f08a7a', t: '#efe2c8' }),
  ];

  // ── DANZANTE de comparsa: sombrero con flecos de colores, máscara blanca y
  // pollera que gira. Dos poses (brazos abajo / brazos arriba). 14x22
  const DANCER_HEAD = [
    '.....yxy......',
    '...KKKKKKKK...',
    '..KyrqrqrxyK..',
    'KKKKKKKKKKKKKK',
    '.xyxqxyxqxyx..',
    '..K1111111K...',
    '..K1K11K11K...',
    '..xK11RR1Kx...',
    '...KKKKKKK....',
  ];
  const DANCER_SKIRT = [
    '..KxxxxxxxK...',
    '.KxyxyxyxyxK..',
    'KxxqxxqxxqxxK.',
    'KyyyyyyyyyyyK.',
    '.KKKKKKKKKKK..',
    '...KUK.KUK....',
    '...KUK.KUK....',
    '..KKKK.KKKK...',
  ];
  const DANCER = [
    spr3(DANCER_HEAD.concat(['.KrrryyyrrrK..', 'KarrrrqrrrrraK', 'K.KrryyyrrK.K.', '...KrrqrrK....'], DANCER_SKIRT)),
    spr3(DANCER_HEAD.concat(['a.KrryyyrrK.a.', 'KKrrrrqrrrrKK.', '..KrryyyrrK...', '...KrrqrrK....'], DANCER_SKIRT)),
  ];
  // la segunda comparsa, de verde y azul
  const DANCER_B = [0, 1].map(i => spr3(
    DANCER_HEAD.concat(i ? ['a.KuuvvvuuK.a.', 'KKuuuuquuuuKK.', '..KuuvvvuuK...', '...KuuquuK....'] : ['.KuuuvvvuuuK..', 'KauuuuquuuuuaK', 'K.KuuvvvuuK.K.', '...KuuquuK....'], DANCER_SKIRT),
    { x: '#3f8a46', y: '#9cc7f0', q: '#f6c94a' }));

  // el escupitajo de alpaca
  const SPIT = spr3([
    '.cc.',
    'c11c',
    'c1cc',
    '.cc.',
  ], { c: '#cfe8c0' });

  return { T: T3, P: P3, ALP, TOURIST, DANCER, DANCER_B, SPIT };
})();
