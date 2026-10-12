// art.js — todo el pixel art, dibujado a mano (mapas de píxeles + paleta).
// Cada sprite está descrito píxel por píxel. La tipografía vive en font.js.

const TILE = 16;

// ─────────────────────────────────────────────────────────────────────────────
// PALETA (tierras de altura, ichu dorado, tejidos andinos, cielos fríos)
// ─────────────────────────────────────────────────────────────────────────────
const PAL = {
  '.': null,
  'K': '#2a1f2d', '0': '#120c18', '1': '#ffffff',
  'w': '#f7ead2', 'W': '#d9c8a8',
  'a': '#e7b089', 'b': '#c4855c', 'h': '#1f1620',
  'r': '#d8432f', 'R': '#962a22', 'p': '#f08a7a', 'x': '#c2185b', 'X': '#7f1040',
  'o': '#f0913c', 'O': '#b45f1e', 'y': '#f6c94a', 'Y': '#bd8a1c',
  'g': '#93a84a', 'G': '#64803a', 'e': '#c9c25e', 'E': '#e3d78a',
  'k': '#3f6b3a', 'c': '#5f9f8a', 'C': '#3d7468',
  'u': '#3f6fb8', 'U': '#27426e', 'v': '#9cc7f0', 'n': '#4fb6b0',
  'q': '#8a4cc0', 'Q': '#5a3088',
  's': '#b9b1c2', 'S': '#8a8296', 'D': '#5d5768', 'd': '#dcd6e4',
  'm': '#9b663b', 'M': '#6e4627', 'i': '#56381f', 'I': '#3a2414', 'j': '#b98a55',
  't': '#d9ad74', 'T': '#9a6a38',
  'l': '#efe2c8', 'L': '#c7ad86', 'f': '#fffaf0', 'F': '#8a7253',
  // tierra cálida de la quebrada
  'z': '#b8693d', 'Z': '#94502d', 'A': '#d08a58', 'B': '#7a3f24',
};
function spr(rows) { return PIX.fromRows(rows, PAL); }

// ─────────────────────────────────────────────────────────────────────────────
// TILES 16x16
// ─────────────────────────────────────────────────────────────────────────────
const T = {};

// tierra con ichu (paja brava dorada) arriba
T.grass = spr([
  '..E....E...E..E.',
  '.Ee..eEe..eEe.Ee',
  'eege.egge.eggeeg',
  'ggggggggggggGggg',
  'GgGGgGGGgGGgGGgG',
  'MGMmMGMmmMGMmMGM',
  'mmmmmmmmmmmmmmmm',
  'mmjmmmmmmmmjmmmm',
  'mmmmmMmmmmmmmmmm',
  'mmmmmmmmmmMmmsmm',
  'mjmmmmmmmmmmmmjm',
  'mmmsmmmmMmmmmmmm',
  'mmmMmmmmmmmmmmmm',
  'mmmmmmmmmmmmjmmm',
  'mmmmmmjmmmmmmmmm',
  'MmmmmmmmmmmmmmmM',
]);
T.dirt = spr([
  'mmmmmmmmmmmmmmmm',
  'mmjmmmmmmmmjmmmm',
  'mmmmmMmmmmmmmmmm',
  'mmmmmmmmmmMmmsmm',
  'mjmmmmmmmmmmmmjm',
  'mmmsmmmmMmmmmmmm',
  'mmmMmmmmmmmmmmmm',
  'mmmmmmmmmmmmjmmm',
  'mmmmmmjmmmmmmmmm',
  'mMmmmmmmmmmmmmMm',
  'mmmmmmmmmsmmmmmm',
  'mmjmmmmmmmmmmmmm',
  'mmmmmMmmmmmjmmmm',
  'msmmmmmmmmmmmmmm',
  'mmmmmmmmmMmmmmmm',
  'MmmmmmmmmmmmmmmM',
]);
T.stoneTop = spr([
  'dddddddddddddddd',
  'dsssdsssssdssssd',
  'sssssssSssssssss',
  'ssSsssssssssSsss',
  'ssSSsssssssSSsss',
  'sssSDssssssSDsss',
  'sssssssssSssssss',
  'SsssssssSSssssSs',
  'DSssssssDSsssSDs',
  'sDSsssssssssssDs',
  'ssssssSsssssssss',
  'sssssSSsssssssss',
  'ssssSDsssssSssss',
  'sSsssssssssSSsss',
  'SDssssssssssDSss',
  'DDsssssssssssDDS',
]);
T.stone = spr([
  'sssssssssSssssss',
  'SsssssssSSssssSs',
  'DSssssssDSsssSDs',
  'sDSsssssssssssDs',
  'ssssssSsssssssss',
  'sssssSSsssssssss',
  'ssssSDsssssSssss',
  'sSsssssssssSSsss',
  'SDssssssssssDSss',
  'Dsssssssssssssss',
  'ssssssssSsssssss',
  'sssSsssSSsssssSs',
  'ssSDssSDssssssDs',
  'ssssssssssSsssss',
  'sssssssssSDsssss',
  'DsssssssssssssDS',
]);
T.snowTop = spr([
  '1111111111111111',
  'ffff1fffffff1fff',
  'ffffffffffffffff',
  'dfffffddfffffffd',
  'sdfffdssdfffffds',
  'ssdddsssSddfddss',
  'sssssssSssdsssss',
  'SsssssssSSssssSs',
  'DSssssssDSsssSDs',
  'sDSsssssssssssDs',
  'ssssssSsssssssss',
  'sssssSSsssssssss',
  'ssssSDsssssSssss',
  'sSsssssssssSSsss',
  'SDssssssssssDSss',
  'DDsssssssssssDDS',
]);
// pirca: muro de piedra seca, piedras encajadas sin mortero
T.pirca = spr([
  '.KKKKK..KKKKKK..',
  'KdssSSKKsdsssSK.',
  'KssssSKssssssSKK',
  'KSSSSKKSSSSSSKdK',
  '.KKKKdsKKKKKKssK',
  'KKdsssSSKdssKSSK',
  'KssssSSKKsssSKKK',
  'KSSSSKKKdssSSKdK',
  'KKKKKdssKSSSKssK',
  'KdssKsssSKKKKSSK',
  'KsssKSSSSKdsssKK',
  'KSSSKKKKKKssssSK',
  'KKKKdssSKKSSSSSK',
  'KdssssssSKKKKKKK',
  'KSSSSSSSSKdssSSK',
  'KKKKKKKKKKKKKKKK',
]);
// saliente de roca (plataforma de una vía, para la cabra)
T.ledge = spr([
  '.ddd1dddddd1ddd.',
  'dssssssdsssssssd',
  'sSssSssssSsssSss',
  'SDSSDSsSSDSSsDSS',
  '.DDSDDSDDSDDSDD.',
  '..DDKDD.KDDDKD..',
  '...K.K...K..K...',
]);

// ── tierra cálida de la quebrada (zona del huaico) ─────────────────────────
T.clay = spr([
  '..e....E..e..E..',
  '.eEe..eEe.eEe.e.',
  'AAzAAAzAAAAzAAzA',
  'zzzzzzzzzAzzzzzz',
  'zZzzzzzzzzzzZzzz',
  'zzzzAzzzzzzzzzzz',
  'zzzzzzzzZzzzzzAz',
  'ZzzzzzzzzzzzzzzZ',
  'zzzsszzzzzzAzzzz',
  'zzzSSzzzzzzzzzzz',
  'zzzzzzzZzzzzzzzz',
  'zAzzzzzzzzzzZzzz',
  'zzzzzzzzzzzzzzzz',
  'zzzzzZzzzAzzzzsz',
  'zzzzzzzzzzzzzzSz',
  'BzzzzzzzzzzzzzzB',
]);
T.clayBody = spr([
  'zzzzzzzzzAzzzzzz',
  'zZzzzzzzzzzzZzzz',
  'zzzzAzzzzzzzzzzz',
  'zzzzzzzzZzzzzzAz',
  'ZzzzzzzzzzzzzzzZ',
  'zzzsszzzzzzAzzzz',
  'zzzSSzzzzzzzzzzz',
  'zzzzzzzZzzzzzzzz',
  'zAzzzzzzzzzzZzzz',
  'zzzzzzzzzzzzzzzz',
  'zzzzzZzzzAzzzzsz',
  'zzzzzzzzzzzzzzSz',
  'zzZzzzzzzzzzzzzz',
  'zzzzzzzzzzZzzzzz',
  'zzzzzAzzzzzzzzzz',
  'BzzzzzzzzzzzzzzB',
]);
// saliente nevada (parte alta de la montaña)
T.ledgeSnow = spr([
  '.1111f11111f111.',
  '1ffffffdfffffff1',
  'dfdsfdssdfsdffsd',
  'SDSSDSsSSDSSsDSS',
  '.DDSDDSDDSDDSDD.',
  '..DDKDD.KDDDKD..',
  '...K.K...K..K...',
]);
// roca fija en los escalones del huaico (se dibuja delante del lodo)
T.mudRock = spr([
  '..KKKKKKKKKKKK..',
  '.KddddsssddsssK.',
  'KdsssssssssssSSK',
  'KssSssssssSssSSK',
  'KsssssssssssSSDK',
  'KSsssSsssssSSSDK',
  'KSSsssssSSSSSDDK',
  'KDSSSSSSSSSSDDDK',
  'KDDSSSSSSSSDDDDK',
  'KDDDDSSSSDDDDDDK',
  'KDDDDDDDDDDDDDDK',
  'KIDDDDDDDDDDDDIK',
  'KIIDDDDDDDDDDIIK',
  'KIIIIDDDDDDIIIIK',
  'KIIIIIIIIIIIIIIK',
  'KIIIIIIIIIIIIIIK',
]);
// cactus candelabro (quebradas secas)
T.cactus = spr([
  '......kk........',
  '.....kcck.......',
  '.....kcck..kk...',
  '.kk..kcck.kcck..',
  'kcck.kcck.kcck..',
  'kcck.kcck.kcck..',
  'kcckkkcckkkcck..',
  '.kcccccccccck...',
  '..kkkkcckkkk....',
  '.....kcck.......',
  '.....kcck.......',
  '.....kcck.......',
  '.....kCCk.......',
]);

T.cloud = spr([
  '.......11.......', '.....11ww11.....', '...11wwwwww11...', '..1wwwwwwwwww1..',
  '.1wwwwwwwwwwww1.', '1wwwwwwwwwwwwww1', '1wwwwwwwwwwwwww1', '.11111111111111.',
]);

// ── decorado ────────────────────────────────────────────────────────────────
// ichu: mata de paja brava
T.ichu = spr([
  '.......E........',
  '...E...e...E....',
  '...e..Ee..e.....',
  '....e.e..ee..E..',
  '.E..eeE.ee..e...',
  '..e.eeeeee.e....',
  '...eegeegee.....',
  '..Eegggegge.....',
  '...gggGgggG.....',
  '....GGGGGG......',
]);
// cantuta: la flor nacional del Perú, campanas fucsia colgando
T.cantuta = spr([
  '......k.........',
  '.....kGk..k.....',
  '....k..Gkk......',
  '...xk...G..k....',
  '..xxX...Gk.xk...',
  '..xXX..kG.xxX...',
  '...yy..G..xXX...',
  '.......G...yy...',
  '..k...GG........',
  '...kGGG.........',
  '.....G..........',
  '.....G..........',
]);
// maguey (agave)
T.maguey = spr([
  '.......c........',
  '...c...c....c...',
  '...cc..c...cc...',
  '....c.cC..cC....',
  'c...cCcCc.c...c.',
  '.cc.cCcCcCc.cc..',
  '..cCCcCcCcCcC...',
  '...CcCcCcCcC....',
  '....CCCCCCC.....',
]);
// letrero de madera con flecha
T.sign = spr([
  '..KKKKKKKKKKKK..',
  '.KttttttttttttK.',
  '.KttTTTTTTTyttK.',
  '.KtTTTTTTTTyytK.',
  '.KttTTTTTTTyttK.',
  '.KttttttttttttK.',
  '..KKKKKKKKKKKK..',
  '.......KTK......',
  '.......KTK......',
  '.......KTK......',
  '......KKTKK.....',
]);
// ─────────────────────────────────────────────────────────────────────────────
// EL NIÑO (mirando a la derecha): chullo con orejeras, poncho y mochila. 16x22
// ─────────────────────────────────────────────────────────────────────────────
const KID_TOP = [
  '.......yy.......',
  '......KrrK......',
  '.....KryrrK.....',
  '....KrrrrwrK....',
  '...KrwrrrrrrK...',
  '...KyuyuyuyuK...',
  '...KhhhaaaaaK...',
  '..rKhhaaaaKaK...',
  '..rKhaaaaaKaK...',
  '..rKhaaaaaaabK..',
  '..y.KbaaaaRaK...',
  '.....KKaaaKK....',
  '..TTKrrrrrrrK...',
  '.TjtKroyoyorrK..',
  '.TttKrrrrrrraK..',
  '.TTTKRuRuRuRRK..',
  '..TTKrrrrrrrK...',
];
const KID_LEGS = {
  stand: ['....KUUUUUUK....', '.....KUUKUUK....', '.....KUK.KUK....', '.....KaK.KaK....', '....KKKK.KKKK...'],
  runA:  ['....KUUUUUUK....', '...KUUK..KUUK...', '..KUK.....KaK...', '..KaK.....KKKK..', '.KKKK...........'],
  runB:  ['....KUUUUUUK....', '.....KUUUUK.....', '.....KUKKUK.....', '.....KaKKaK.....', '....KKKKKKKK....'],
  runC:  ['....KUUUUUUK....', '...KUUK..KUUK...', '...KaK....KUK...', '..KKKK....KaK...', '.........KKKK...'],
  jump:  ['....KUUUUUUK....', '...KUUK..KUUK...', '..KaK......KaK..', '..KK........KK..', '................'],
  sit:   ['....KUUUUUUUK...', '....KUUK.KUUK...', '....KaK...KaK...', '....KK....KK....', '................'],
};
function kid(legs) { return spr(KID_TOP.concat(KID_LEGS[legs])); }

const P = {};
P.idle = [kid('stand')];
P.run = [kid('runA'), kid('runB'), kid('runC'), kid('runB')];
P.jump = kid('jump');
P.fall = kid('runB');
P.surf = kid('runA');
P.sit = kid('sit');

// ─────────────────────────────────────────────────────────────────────────────
// LLAMA (mirando a la derecha): borlas de colores en las orejas y manta tejida.
// 26x24
// ─────────────────────────────────────────────────────────────────────────────
const LLAMA_TOP = [
  '...................xy.....',
  '..................xKKq....',
  '..................KlK.....',
  '..................KllKK...',
  '..................KlKllK..',
  '..................KllllfK.',
  '..................KlllKKK.',
  '.................KflllK...',
  '.................KfllK....',
  '.................KfllK....',
  '.................KfllK....',
  '..KK..KKKKKKKKKKKfllK.....',
  '.KlfKKxyrqyrxqyrKfflK.....',
  'KllfKrrrrrrrrrrrKffK......',
  'KlffKyqyqyqyqyqyKlfK......',
  'KlllKRRRRRRRRRRRKllK......',
  'KllllllllllllllllllK......',
  '.KlllllllllllllllLK.......',
  '.KLlllllllllllllLLK.......',
];
const LLAMA_LEGS = {
  idle: ['..KLLlK.....KlLLK.........', '..KlLK.......KlLK.........', '..KlK.........KlK.........', '..KlK.........KlK.........', '..KKK.........KKK.........'],
  runA: ['..KLLK......KlLK..........', '.KlK.........KlK..........', 'KlK...........KlK.........', 'KK.............KK.........', '..........................'],
  runB: ['...KLlK.....KlLK..........', '...KlK......KlK...........', '...KlK......KlK...........', '...KKK......KKK...........', '..........................'],
  runC: ['..KLLK......KlLK..........', '...KlK......KlK...........', '....KlK...KlK.............', '....KK....KK..............', '..........................'],
  jump: ['..KLLK.......KlLK.........', '...KlK.....KlK............', '....KK.....KK.............', '..........................', '..........................'],
};
const LL = {};
const llama = (l) => spr(LLAMA_TOP.concat(LLAMA_LEGS[l]));
LL.idle = [llama('idle')];
LL.run = [llama('runA'), llama('runB'), llama('runC'), llama('runB')];
LL.jump = llama('jump');

// ─────────────────────────────────────────────────────────────────────────────
// CABRA MONTESA: cuernos curvos, barba, patas firmes. 28x21
// ─────────────────────────────────────────────────────────────────────────────
// (generada con primitivas y retocada: cuernos anillados hacia atrás, barba, colita)
const GOAT = {
  stand: spr([
  '..............KSDSSK........',
  '.............KDKKKDSK.......',
  '............KSSK..KSSK......',
  '...........KSDK.KKKwwwK.....',
  '...........KSK.KwwwwwKwKK...',
  '............K.KWKwwwwwwwwK..',
  '..K...........KwwwwwwwwwwSK.',
  '.KwK..KKKKKKKKKwwwwwwwwwwWK.',
  '.KwwKKwWWWWWWwwwwwwwwWWKWK..',
  '..KKwwwwwwwwwwwwwwwwwWWKK...',
  '..KwwwwwwwwwwwwwwwwwwWWK....',
  '..KwwwwwwwwwwwwwwwKKKKWK....',
  '..KwwwwwwwwwwwwwwwK...K.....',
  '...KWWWWWWwwwwwwwK..........',
  '....KWWWWWWWWWWWWK..........',
  '...KWwKSDKKKKWwKSDK.........',
  '...KWwKSDK..KWwKSDK.........',
  '...KWwKSDK..KWwKSDK.........',
  '...KWwKSDK..KWwKSDK.........',
  '....KK.KK....KK.KK..........',
  '............................',
  ]),
  jump: spr([
  '..............KSDSSK........',
  '.............KDKKKDSK.......',
  '............KSSK..KSSK......',
  '...........KSDK.KKKwwwK.....',
  '...........KSK.KwwwwwKwKK...',
  '............K.KWKwwwwwwwwK..',
  '..K...........KwwwwwwwwwwSK.',
  '.KwK..KKKKKKKKKwwwwwwwwwwWK.',
  '.KwwKKwWWWWWWwwwwwwwwWWKWK..',
  '..KKwwwwwwwwwwwwwwwwwWWKK...',
  '..KwwwwwwwwwwwwwwwwwwWWK....',
  '..KwwwwwwwwwwwwwwwKKKKWK....',
  '..KwwwwwwwwwwwwwwwK...K.....',
  '...KWWWWWWwwwwwwwK..........',
  '....KWWWWWWWWWWWWKK.........',
  '...KWwSDKKKKKKKWwSDK........',
  '...KWwSDK.....KWwSDK........',
  '....KKSDK......KKSDK........',
  '......KK.........KK.........',
  '............................',
  '............................',
  ]),
  land: spr([
  '..............KSDSSK........',
  '.............KDKKKDSK.......',
  '............KSSK..KSSK......',
  '...........KSDK.KKKwwwK.....',
  '...........KSK.KwwwwwKwKK...',
  '............K.KWKwwwwwwwwK..',
  '..K...........KwwwwwwwwwwSK.',
  '.KwK..KKKKKKKKKwwwwwwwwwwWK.',
  '.KwwKKwWWWWWWwwwwwwwwWWKWK..',
  '..KKwwwwwwwwwwwwwwwwwWWKK...',
  '..KwwwwwwwwwwwwwwwwwwWWK....',
  '..KwwwwwwwwwwwwwwwKKKKWK....',
  '..KwwwwwwwwwwwwwwwK...K.....',
  '...KWWWWWWwwwwwwwK..........',
  '...KKWWWWWWWWWWWWK..........',
  '..KWwKKSDKKKWwKKSDK.........',
  '..KWwKKSDK.KWwKKSDK.........',
  '..KWwKKSDK.KWwKKSDK.........',
  '...KK..KK...KK..KK..........',
  '............................',
  '............................',
  ]),
};

// ─────────────────────────────────────────────────────────────────────────────
// CÓNDOR (solo decorado: planea a lo lejos). 24x9, alas con "dedos".
// ─────────────────────────────────────────────────────────────────────────────
const E = {};
E.condor = [
  spr([
    '..........KK............',
    '.........KwwK...........',
    'K.K.KKKKKKwwKKKKKK.K.K..',
    '.KKKKKKKKKKKKKKKKKKKKK..',
    '..KKKKKKKKpKKKKKKKKKK...',
    '....KKKKKKKKKKKKKKK.....',
    '.........KKKK...........',
  ]),
  spr([
    '..........KK............',
    '.....KKKKKwwKKKKK.......',
    '...KKKKKKKwwKKKKKKK.....',
    '.KKKKKKKKKKKKKKKKKKKK...',
    'K.K.K...KKpKK...K.K.K...',
    '.........KKKK...........',
    '..........KK............',
  ]),
];

// ─────────────────────────────────────────────────────────────────────────────
// OBJETOS
// ─────────────────────────────────────────────────────────────────────────────
const OBJ = {};
// hoja de tarea (hay 3 escondidas)
OBJ.page = spr([
  'KKKKKKKK..',
  'K111111KK.',
  'K1uuuu1K1K',
  'K111111KKK',
  'K1uuuuu11K',
  'K1111111rK',
  'K1uuuu11rK',
  'K1111111rK',
  'K1uuuuu11K',
  'K11111111K',
  'KKKKKKKKKK',
]);
// tronco del huaico (grande y ancho para que se pueda aterrizar bien)
OBJ.log = spr([
  '....KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK....',
  '...KjmmmmjmmmmmmmjmmmmmmmjmmmmmmmmjKK...',
  '..KmmmMmmmmmmmMmmmmmmmMmmmmmmMmmmmKtTK..',
  '.KmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmKtTTtK.',
  '.KMmmmmmMmmmmmmmMmmmmmmMmmmmmmmmmKTtTTK.',
  '.KmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmKtTtTK.',
  '.KMMMMiMMMMMMMMMiMMMMMMMMiMMMMMMMMKtTK..',
  '..KKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK...',
]);
// laja: roca plana grande que flota en el lodo
OBJ.slab = spr([
  '......KKKKKKKKKKKKKKKKK.......',
  '...KKKddssdsssddsssssssKKK....',
  '..KdddssssssssssssSsssssSSK...',
  '.KdssssSsssssssssssssssSSSSK..',
  'KdsssssssssSssssssssSssSSSSDK.',
  'KSSssssssssssssssssssSSSSSDDK.',
  'KDSSSSsSSSSSSSSSSSSSSSSSSDDDK.',
  '.KKKKKKKKKKKKKKKKKKKKKKKKKKKK..',
]);
// pasto fresco: comida para la cabra (¡súper salto!)
OBJ.herb = spr([
  '...y..e..x..',
  '..yYyeEexXx.',
  '...yeGeEex..',
  '.e..GeGEe.e.',
  'eEe.GGeGG.Ee',
  '.eGeGGGGGeG.',
  '..GGGGGGGGG.',
  '..KTTTTTTTK.',
  '..KtTtTtTtK.',
  '...KKKKKKK..',
]);
// cóndor que cruza el risco (obstáculo): colores reales, 28x12
E.condorBig = [
  spr([
    '.............KK.............',
    '............KppK............',
    '...........K1111K...........',
    'K.K.K.KKKKKKK11KKKKKKK.K.K.K',
    '.KKKKKKKKKKKKKKKKKKKKKKKKKK.',
    '..KhhhhhhhKKKKKKKKhhhhhhhK..',
    '....KKKhhhhKKKKKKhhhhKKK....',
    '.......KKKKKKKKKKKKKK.......',
    '...........KKKKKK...........',
    '............K..K............',
  ]),
  spr([
    '.............KK.............',
    '.....KKKKKKKKppKKKKKKKK.....',
    '...KKhhhhhhK1111KhhhhhhKK...',
    '.KKhhhhhhKKKK11KKKKhhhhhhKK.',
    'K.K.KKKKKKKKKKKKKKKKKKK.K.K.',
    '.K.K....KKKKKKKKKKK....K.K..',
    '..........KKKKKKKK..........',
    '...........KKKKKK...........',
    '............K..K............',
    '............................',
  ]),
];

// piedra del derrumbe (rueda)
OBJ.boulder = spr([
  '....KKKKKK....',
  '..KKddsssSKK..',
  '.KddsssssSSSK.',
  '.KdsssSssssSK.',
  'KdsssssssSsSSK',
  'KssSssssssssSK',
  'KsssssssSsssSK',
  'KssssssssssSSK',
  'KSsssSssssSSSK',
  '.KSsssssssSSK.',
  '.KSSsssSSSSDK.',
  '..KKSSSSDDKK..',
  '....KKKKKK....',
]);

const ART = { T, P, LL, GOAT, E, OBJ };
