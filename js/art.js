// art.js — TODO el pixel art, dibujado a mano (mapas de píxeles + paleta).
// Nada de arte aleatorio: cada sprite está descrito píxel por píxel.

const TILE = 16;

// ─────────────────────────────────────────────────────────────────────────────
// PALETA MAESTRA (tonos andinos: tierras, verdes de valle, cielos de altura)
// ─────────────────────────────────────────────────────────────────────────────
const PAL = {
  '.': null,
  'K': '#2a1f33', 'k': '#4a3b52', '0': '#120c18', '1': '#ffffff', 'w': '#f7ead2',
  'a': '#f4c9a0', 'b': '#d99b6b', 'c': '#a86f45', 'h': '#221922',
  'r': '#e5523f', 'R': '#a72f28', 'p': '#f2917d',
  'o': '#f0913c', 'O': '#b45f1e',
  'y': '#f6c94a', 'Y': '#bd8a1c',
  'g': '#4fbf58', 'G': '#2f8a3c', 'e': '#8fe06a',
  'u': '#4f86d6', 'U': '#2f579e', 'v': '#9cc7f0',
  'n': '#59d0d0', 'N': '#2f8f9a',
  'q': '#8a5cc0', 'Q': '#5a3788',
  's': '#cfc9da', 'S': '#8b8598', 'D': '#5f5a6c',
  'm': '#a9763f', 'M': '#7a4f28',
  't': '#caa06a', 'T': '#8a5a30',
  'l': '#d8a45c', 'L': '#a06a30', 'f': '#f2e3c4',
  'i': '#6b4a2c', 'I': '#412a16', 'j': '#8f6a40',
  'z': '#ff8a3c', 'Z': '#d15a12',
};

function spr(rows) { return PIX.fromRows(rows, PAL); }

// ─────────────────────────────────────────────────────────────────────────────
// TIPOGRAFÍA 5x7 (mayúsculas + dígitos + acentos + signos)
// ─────────────────────────────────────────────────────────────────────────────
const GLYPHS = {
  'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  'C': ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  'G': ['.###.', '#...#', '#....', '#..##', '#...#', '#...#', '.###.'],
  'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  'I': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  'J': ['....#', '....#', '....#', '....#', '#...#', '#...#', '.###.'],
  'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  'N': ['#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#', '#...#'],
  'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  'W': ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  'Ñ': ['.#.#.', '#...#', '##..#', '#.#.#', '#.#.#', '#..##', '#...#'],
  'Á': ['..#..', '.###.', '#...#', '#####', '#...#', '#...#', '#...#'],
  'É': ['..#..', '#####', '#....', '####.', '#....', '#....', '#####'],
  'Í': ['..#..', '#####', '..#..', '..#..', '..#..', '..#..', '#####'],
  'Ó': ['..#..', '.###.', '#...#', '#...#', '#...#', '#...#', '.###.'],
  'Ú': ['..#..', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '.##..', '.#...'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '¡': ['..#..', '.....', '..#..', '..#..', '..#..', '..#..', '..#..'],
  '¿': ['..#..', '.....', '.#...', '#....', '#...#', '.###.', '.....'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  "'": ['..#..', '..#..', '.....', '.....', '.....', '.....', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '%': ['##..#', '##.#.', '..#..', '.#...', '#..##', '..###', '.....'],
  '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
  '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
};

const FONT_CACHE = {};
function glyphCanvas(ch, color) {
  const key = ch + '|' + color;
  if (FONT_CACHE[key]) return FONT_CACHE[key];
  let base = GLYPHS[ch];
  if (!base) base = GLYPHS[ch.toUpperCase()] || GLYPHS['?'];
  const canvas = PIX.fromRows(base, { '#': '#ffffff', '.': null });
  const c = PIX.tinted(canvas, color);
  FONT_CACHE[key] = c;
  return c;
}

// dibuja texto pixel. opts: {color, scale, sp, shadow, shadowColor, align}
function drawText(ctx, text, x, y, opts = {}) {
  const scale = opts.scale || 1;
  const sp = (opts.sp == null ? 1 : opts.sp) * scale;
  const color = opts.color || '#ffffff';
  const text2 = String(text).toUpperCase();
  const cw = 5 * scale;
  const total = text2.length * (cw + sp) - sp;
  let ox = x;
  if (opts.align === 'center') ox = Math.round(x - total / 2);
  else if (opts.align === 'right') ox = Math.round(x - total);
  ox = Math.round(ox); y = Math.round(y);
  for (let i = 0; i < text2.length; i++) {
    const ch = text2[i];
    const gx = ox + i * (cw + sp);
    if (opts.shadow) {
      const gs = glyphCanvas(ch, opts.shadowColor || 'rgba(0,0,0,0.5)');
      ctx.drawImage(gs, gx + scale, y + scale, gs.width * scale, gs.height * scale);
    }
    const gc = glyphCanvas(ch, color);
    ctx.drawImage(gc, gx, y, gc.width * scale, gc.height * scale);
  }
  return total;
}
function textWidth(text, scale = 1, sp = 1) {
  const n = String(text).length;
  const cw = 5 * scale; const s = sp * scale;
  return n * (cw + s) - s;
}

// ─────────────────────────────────────────────────────────────────────────────
// TILES
// ─────────────────────────────────────────────────────────────────────────────
const T = {};

T.grass = spr([
  'eeeeeeeeeeeeeeee', 'geegeegeegeegeee', 'gggggggggggggggg', 'GGGGGGGGGGGGGGGG',
  'mmmmmmmmmmmmmmmm', 'mmmmmmmmmmmmmmmm', 'mmMmmmmmmmmMmmmm', 'mmmmmmmmmmmmmmmm',
  'mmmmmmmmmmmmmmmm', 'mmmmMmmmmmmmmmmm', 'mmmmmmmmmmmmmmmm', 'mmmmmmmmmmmmmmmm',
  'mmmMmmmmmmmMmmmm', 'mmmmmmmmmmmmmmmm', 'mmmmmmmmmmmmmmmm', 'MMMMMMMMMMMMMMMk',
]);
T.dirt = spr([
  'mmmmmmmmmmmmmmmm', 'mmmmmmmmmmmmmmmm', 'mmMmmmmmmmmMmmmm', 'mmmmmmmmmmmmmmmm',
  'mmmmmmmmmmmmmmmm', 'mmmMmmmmmmmmmmmm', 'mmmmmmmmmmmmmmmm', 'mmmmmmmmmmmmmmmm',
  'mmmmmmmmMmmmmmmm', 'mmmmmmmmmmmmmmmm', 'mmMmmmmmmmmmMmmm', 'mmmmmmmmmmmmmmmm',
  'mmmmmmmmmmmmmmmm', 'mmmmMmmmmmmmmmmm', 'mmmmmmmmmmmmmmmm', 'MMMMMMMMMMMMMMMk',
]);
T.stoneTop = spr([
  'wwwwwwwwwwwwwwww', 'wwwwwWwwwwwWwwww', 'ssSsSssssSsSssSs', 'ssssssssssssssss',
  'ssssDsssssssssss', 'sssssssssssDssss', 'ssssssssssssssss', 'sDssssssssssssss',
  'sssssssssDssssss', 'ssssssssssssssss', 'ssssssDsssssssss', 'ssssssssssssDsss',
  'ssssssssssssssss', 'sDssssssssssssss', 'ssssssssssssssss', 'DDDDDDDDDDDDDDDk',
]);
T.stone = spr([
  'ssssssssssssssss', 'ssssDsssssssssss', 'sssssssssssDssss', 'sDssssssssssssss',
  'ssssssssssssssss', 'ssssssssDsssssss', 'ssssssssssssssss', 'sDssssssssssssss',
  'ssssssssssssDsss', 'ssssssssssssssss', 'ssssDsssssssssss', 'ssssssssssssssss',
  'sDssssssssssssss', 'ssssssssssssssss', 'ssssssssssssssss', 'DDDDDDDDDDDDDDDk',
]);
T.snowTop = spr([
  'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwvwwwwwvwwwww', 'vvvvvvvvvvvvvvvv',
  'ssssssssssssssss', 'ssssDsssssssssss', 'vvvvvvvvvvvvvvvv', 'ssssssssssssssss',
  'ssssssssssssDsss', 'ssssssssssssssss', 'sDssssssssssssss', 'ssssssssssssssss',
  'ssssssDsssssssss', 'ssssssssssssssss', 'ssssssssssssssss', 'DDDDDDDDDDDDDDDk',
]);
T.snow = spr([
  'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwvwwwwwwvwwwwww', 'wwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww', 'wwwwwwwvwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwvwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwvwwwwwwwww', 'wwwwwwwwwwwwwwww',
  'wwwvwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', 'vvvvvvvvvvvvvvvk',
]);
T.brick = spr([
  'mmmmmmmmmmmmmmmm', 'mmmmmmmMmmmmmmmm', 'MMMMMMMMMMMMMMMM', 'mmmMmmmmmmmMmmmm',
  'mmmmmmmmmmmmmmmm', 'mmmmmmmMmmmmmmmm', 'MMMMMMMMMMMMMMMM', 'mmmMmmmmmmmMmmmm',
  'mmmmmmmmmmmmmmmm', 'mmmmmmmMmmmmmmmm', 'MMMMMMMMMMMMMMMM', 'mmmMmmmmmmmMmmmm',
  'mmmmmmmmmmmmmmmm', 'mmmmmmmMmmmmmmmm', 'MMMMMMMMMMMMMMMM', 'kkkkkkkkkkkkkkkk',
]);
T.adobe = spr([
  'tttttttttttttttt', 'ttttttTttttttttt', 'TTTTTTTTTTTTTTTT', 'tttTtttttttTtttt',
  'tttttttttttttttt', 'ttttttTttttttttt', 'TTTTTTTTTTTTTTTT', 'tttTtttttttTtttt',
  'tttttttttttttttt', 'ttttttTttttttttt', 'TTTTTTTTTTTTTTTT', 'tttTtttttttTtttt',
  'tttttttttttttttt', 'ttttttTttttttttt', 'TTTTTTTTTTTTTTTT', 'kkkkkkkkkkkkkkkk',
]);
T.plank = spr([
  'TTTTTTTTTTTTTTTT', 'tttttttttttttttt', 'ttTtttttTtttttTt',
  'tttttttttttttttt', 'TTTTTTTTTTTTTTTk',
]);
T.bridge = spr([
  'TTTTTTTTTTTTTTTT', 'tttTttttTtttTttt', 'tttttttttttttttt',
  'TTTTTTTTTTTTTTTT', 'kKkkKkkKkkKkkKkk',
]);
T.rock = spr([
  '................', '.....SSssS......', '...SsSsssSSs....', '..SssssssssSs...',
  '.SsSssssssssSS..', 'SsSssssssssssSs.', 'Sssssssssssssss.', 'Sssssssssssssss.',
  'Sssssssssssssss.', 'SsssssssssssssS.', '.SsssssssssssS..', '.SsSssssssssS...',
  '..SSssssssSS....', '...SSSsSSS......', '.....SSSS.......', '................',
]);
T.spike = spr([
  '................', '..K.....K.....K.', '..K.K...K.K...K.', '..KKaK..KKaK..KK',
  '.KKaaaK.KaaaK.KK', '.KaaaaaKaaaaaKKK', 'KKaaaSaKaaaSaKKK', 'KaaaSSaaaSSaaKKK',
  'KaaSSSaaSSSaaKKK', 'KaSSSSaSSSSaaKKK', 'KSSSSSSSSSSSaKKK', 'KSSSSSSSSSSSSKKK',
  'KKKKKKKKKKKKKKKK', 'thththththththth', 'thththththththth', 'kkkkkkkkkkkkkkkk',
]);

// agua (cuerpo) — 16x16
T.waterBody = spr([
  'nnnnnnnnnnnnnnnn', 'nNnnNnnNnnNnnNnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnNnnnnnNnnn',
  'NnnNnnnnnNnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnNnnnnnNnnnnnNn', 'nnnnnnnnnnnnnnnn',
  'nnnnnnnnNnnnnnnn', 'nNnnNnnnnnnNnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnn', 'nNnnnnnnNnnnnnNn', 'nnnnnnnnnnnnnnnn', 'Nnnnnnnnnnnnnnnn',
]);
// superficie del agua (2 frames)
T.waterTop = [
  spr([
    'vvvvvnnvvnnvvvvv', 'vvvvvvvvvvvvvvvv', 'nnNnnnnnnnnnNnnn', 'vvvnnnvvvnnnvvvv',
    'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'NnnnnnnnNnnnnnnn', 'nnnnnnnnnnnnnnnn',
    'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn',
    'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nNnnnnnnnnnnnNnn',
  ]),
  spr([
    'nnnvvvvvnnvvvvnv', 'vvvvvvvvvvvvvvvv', 'nnnnNnnnnnnnnnnn', 'vvnnnvvvnnnvvvnn',
    'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'NnnnnnnNnnnnnnnn', 'nnnnnnnnnnnnnnnn',
    'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn',
    'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nnnnnnnnnnnnnnnn', 'nNnnnnnnnnnnnNnn',
  ]),
];

// huayco: lodo (cuerpo) — 16x16
T.mudBody = spr([
  'iiiiiiiiiiiiiiii', 'ijiiijiijiijiiji', 'iiiiiiiiiiiiiiii', 'iiiIiiiiiiIiiiii',
  'iiiiiiiiiiiiiiii', 'IiiiiiiiIiiiiiii', 'iiiiiiiiiiiiiiii', 'iiijiijiijiijiij',
  'iiiiiiiiiiiiiiii', 'iiiiIiiiiiiiiIii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii',
  'iIiiiiiiiiIiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiIiiiiiiii', 'iiiiiiiiiiiiiiii',
]);
T.mudTop = [
  spr([
    'jjjijijjjijijjjj', 'jijjjjjjijjjjjij', 'ijjijjjijjijjjij', 'iijijjiijjjijjii',
    'iiiiiiiiiiiiiiii', 'iiIiiiiiiiiIiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii',
    'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii',
    'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii',
  ]),
  spr([
    'ijijjjjijijjjjij', 'jjjjijijjjjijjjj', 'jijjjijjjijjjiji', 'ijjijjjjijjijjii',
    'iiiiiiiiiiiiiiii', 'iiiiIiiiiiiiiIii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii',
    'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii',
    'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii', 'iiiiiiiiiiiiiiii',
  ]),
];

// tiles decorativos / meta
T.cloud = spr([
  '.......11.......', '.....11ww11.....', '...11wwwwww11...', '..1wwwwwwwwww1..',
  '.1wwwwwwwwwwww1.', '1wwwwwwwwwwwwww1', '1wwwwwwwwwwwwww1', '.11111111111111.',
  '................', '................', '................', '................',
  '................', '................', '................', '................',
]);
T.cactus = spr([
  '......Gg........', '.....GGGg.......', '.....GggG.......', '.....GggG.......',
  'Gg...GggG.......', 'GGg..GggG...Gg..', 'GgG..GggG..GGg..', 'GgG.GgggG..GgG..',
  'GgGGGgggGggGgG..', 'GggggggggggGgG..', '..GggggggggGgG..', '......GggG..GgG.',
  '......GggG..Ggg.', '......GggG...GG.', '......GGGG......', '......GGGG......',
]);
T.flower = spr([
  '................', '................', '................', '................',
  '......y..y......', '.....yyyyy......', '.....yYyYy......', '......yyy.......',
  '.......G........', '......eGe.......', '.....eeGee......', '......GGG.......',
  '.......G........', '.......G........', '.......G........', '......GGG.......',
]);
T.tuft = spr([
  '................', '................', '................', '................',
  '................', '...........G....', '...G.......G....', '...G...G...G....',
  '..gG..gG..gG....', '..ggg.ggg.ggg...', '..gGg.gGg.gGg...', '...g...g...g....',
  '................', '................', '................', '................',
]);

// bandera / checkpoint (wiphala)
T.flagPole = spr([
  '..KK............', '..KK.KKKKK......', '..KKaKKKKKK.....', '..KKaKKKKKKK....',
  '..KKaKKKKKK.....', '..KKaKKKKKK.....', '..KKaKKKKK......', '..KKaKKKK.......',
  '..KKaKKKK.......', '..KKaKKK........', '..KKaKK.........', '..KKa...........',
  '..KKa...........', '..KKa...........', '..KKa...........', '..KKa...........',
  '..KKa...........', '..KKa...........', '..KKa...........', '..KKa...........',
  '..KKa...........', '..KKa...........', '..KKa...........', '..KKa...........',
]);
T.wiphala = spr([
  'RrRrRrRr', 'yYyYyYyY', 'RrRrRrRr', 'yYyYyYyY',
  'RrRrRrRr', 'yYyYyYyY', 'RrRrRrRr', 'yYyYyYyY',
]);

// meta: puerta del colegio
T.door = spr([
  '..TTTTTTTTTTTT..', '.TttttttttttttT.', 'TttttttttttttttT', 'TtTTTTTTTTTTTTtT',
  'TtTuuuuuuuuuuTtT', 'TtTuyyyyyyyyuTtT', 'TtTuyuuyuuyuuTtT', 'TtTuyyyyyyyyuTtT',
  'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT',
  'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT',
  'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT',
  'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT', 'TtTuuuuuuuuuuTtT', 'TTTTTTTTTTTTTTTT',
]);
T.sign = spr([
  '................', '..KKKKKKKKKKKK..', '..KwwwwwwwwwwK..', '..KwKwwwwKwwwK..',
  '..KwwKwwKwwwwK..', '..KwwwwwKwwwwK..', '..KwKwwwwKwwwK..', '..KwwKwwwwwwwK..',
  '..KwwwwwwwwwwK..', '..KKKKKKKKKKKK..', '......K..K......', '......K..K......',
  '......K..K......', '......KKKK......', '................', '................',
]);

// ─────────────────────────────────────────────────────────────────────────────
// PERSONAJE: el niño andino (facing right). 14x20, más grande y legible.
// ─────────────────────────────────────────────────────────────────────────────
const KID_TOP = [
  '......yy......',
  '.....rrrr.....',
  '....rrrrrr....',
  '...rrrrrrrr...',
  '..RyyyyyyyyR..',
  '..RyyyyyyyyR..',
  '..KaaaaaaaaK..',
  '..KaaaaaaaaK..',
  '..KmmmKmmKmmK.',   // cejas / ojos (K)
  '..KaaaaaaaaK..',
  '...KaaaaaaK...',
  '..KuuuuuuuuK..',
  '.KuyyyyyyyyuK.',
  '.KuuuuuuuuuuK.',
  '.KRRuuuuuuRRK.',
  '..KRRRRRRRRK..',
];
const KID_LEGS_A = ['...KbK..KbK...', '...KbK..KbK...', '...KbK..KbK...', '..KKKK..KKKK..'];
const KID_LEGS_B = ['...KbK..KbK...', '...KbK..KbK...', '..KbK....KbK..', '..KKK....KKK..'];
const KID_LEGS_C = ['...KbK..KbK...', '...KbK..KbK...', '...KbK..KbK...', '...KKK..KKK...'];
const KID_LEGS_TUCK = ['....Kb.bK.....', '...Kb...bK....', '..Kb.....bK...', '..KK.....KK...'];
const KID_LEGS_SIT = ['...KbbbK......', '...Kb..bK.....', '..Kb....Kb....', '..KK.....KK...'];
function kid(legs) { return spr(KID_TOP.concat(legs)); }

const P = {};
P.idle = [kid(KID_LEGS_A)];
P.run = [kid(KID_LEGS_A), kid(KID_LEGS_B), kid(KID_LEGS_A), kid(KID_LEGS_C)];
P.jump = kid(KID_LEGS_TUCK);
P.fall = kid(KID_LEGS_B);
P.hurt = kid(KID_LEGS_TUCK);
P.surf = kid(KID_LEGS_B);
P.sit = kid(KID_LEGS_SIT);

// ─────────────────────────────────────────────────────────────────────────────
// LLAMA (facing right). ~24x22
// ─────────────────────────────────────────────────────────────────────────────
const L_BODY = [
  '................KKKK....',
  '...............KflllK...',
  '...............KfllK....',
  '...............KfllK....',
  '...............KfllK....',
  '..KKKKKKKKKKKKKffllK....',
  'KfllllllllllllffffllK...',
  'KfllllllllllllfffflK....',
  'KlllllllllllllllllK.....',
  'KlllllllllllllllllK.....',
  'KlllllllllllllllllK.....',
  '.KllllllllllllllllK.....',
  '.KlllllllllllllllK......',
  '..KlllllllllllllK.......',
  '..KllllllllllllK........',
  '.KKlllK.KlllK.KK........',
];
const LL = {};
LL.idle = [
  spr(L_BODY.concat(['.KfL..K..KfL..K.....', '.KK....KK.KK...K.....', '.......K..K....K.....'])),
  spr(L_BODY.concat(['.KfL..K..KfL..K.....', '.KK....KK.KK...K.....', '.......K..K....K.....'])),
];
LL.run = [
  spr(L_BODY.concat(['.KfL..K..KfL..K.....', 'KK.....KK.KK...K.....', '......................'])),
  spr(L_BODY.concat(['..KfLK...KfLK.......', '..KK......KK.........', '......................'])),
  spr(L_BODY.concat(['.KfL..K..KfL..K.....', '.KK....KK.KK...K.....', '......................'])),
  spr(L_BODY.concat(['...KfLK..KfLK........', '...KK.....KK.........', '......................'])),
];

// ─────────────────────────────────────────────────────────────────────────────
// CABRA (montura auto-saltarina). 20x14
// ─────────────────────────────────────────────────────────────────────────────
const GOAT_BODY = [
  '....K..........K....',
  '...KLK........KLK...',
  '...KLK.......KLLK...',
  '....KLKKKKKKKLLK....',
  '...KKLLlllllLLKK....',
  '..KlllllllllllllK...',
  '.KlllllllllllllllK..',
  '.KlllllllllllllllK..',
  '.KlllllllllllllllK..',
  '.KlllllllllllllllK..',
  '..KlllllllllllllK...',
  '..KKlK..KlK..KlK....',
];
const GOAT = [
  spr(GOAT_BODY.concat(['...L...L....L.......', '...K...K....K.......'])),
  spr(GOAT_BODY.concat(['..L....L....L.......', '..K....K....K.......'])),
];

// ─────────────────────────────────────────────────────────────────────────────
// ENEMIGOS
// ─────────────────────────────────────────────────────────────────────────────
// Cuy: conejillo de indias de frente (cabeza, orejas, vientre claro). 16x12
const E = {};
E.cuy = [
  spr([
    '.....KK..KK.....',
    '...KKmmKKmmKK...',
    '..KmmmmmmmmmmK..',
    '.KmmmmmmmmmmmmK.',
    '.KmmmKmmmmKmmK..',
    '.KmmmmmmmmmmmmK.',
    '.KttttttttttttK.',
    '.KttttttttttttK.',
    '..KttttttttttK..',
    '...KKKKKKKKKK...',
    '....KbK..KbK....',
    '................',
  ]),
  spr([
    '.....KK..KK.....',
    '...KKmmKKmmKK...',
    '..KmmmmmmmmmmK..',
    '.KmmmmmmmmmmmmK.',
    '.KmmmKmmmmKmmK..',
    '.KmmmmmmmmmmmmK.',
    '.KttttttttttttK.',
    '.KttttttttttttK.',
    '..KttttttttttK..',
    '...KKKKKKKKKK...',
    '...KbK...KbK....',
    '................',
  ]),
];
// Cóndor andino: alas anchas, collar blanco, cabeza rojiza. 20x12
E.condor = [
  spr([
    '....................',
    '..KK............KK..',
    '.KhhK..........KhhK.',
    'KhhhhK........KhhhhK',
    'KhhhhK..KKKK..KhhhhK',
    '.KhhhK.KwwwwK.KhhhK.',
    '..KhhKKwwwwwwKKhhK..',
    '...KhK.wwwwww.KhK...',
    '....KK.KwwwwK.KK....',
    '.......KppppK.......',
    '........pppp........',
    '.........KK.........',
  ]),
  spr([
    '..KK............KK..',
    '.KhhK..........KhhK.',
    'KhhhhK........KhhhhK',
    'KhhhhK..KKKK..KhhhhK',
    '.KhhhK.KwwwwK.KhhhK.',
    '..KhhKKwwwwwwKKhhK..',
    '...KhK.wwwwww.KhK...',
    '....KK.KwwwwK.KK....',
    '.......KppppK.......',
    '........pppp........',
    '.........KK.........',
    '....................',
  ]),
];

// ─────────────────────────────────────────────────────────────────────────────
// OBJETOS
// ─────────────────────────────────────────────────────────────────────────────
const OBJ = {};
// moneda "sol" dorada (4 frames girando)
OBJ.coin = [
  spr(['..yyyy..', '.yYwwYy.', 'yYyooyYy', 'yYo11oYy', 'yYo11oYy', 'yYyooyYy', '.yYwwYy.', '..yyyy..']),
  spr(['...yy...', '..yYwy..', '..yYoy..', '..yY1y..', '..yY1y..', '..yYoy..', '..yYwy..', '...yy...']),
  spr(['...y....', '...yy...', '...ylo..', '...y1o..', '...y1o..', '...ylo..', '...yy...', '...y....']),
  spr(['...yy...', '..ywwy..', '..yoyy..', '..y1yy..', '..y1yy..', '..yoyy..', '..ywwy..', '...yy...']),
];
OBJ.heart = spr([
  '.rr..rr.', 'rpprpprr', 'rp11pprr', 'rppppprr', '.rpppRr.', '..rpRr..', '...rr...', '........',
]);
OBJ.gem = spr([
  '..nnnn..', '.nvvvvn.', 'nv1111vn', 'nvvvvvvn', '.nvvvvn.', '..nvvn..', '...nn...', '........',
]);
OBJ.rockBall = spr([
  '..sSss..', '.SsSssS.', 'SsssssSs', 'SssssssS', 'SssssssS', '.SssssS.', '..SSSS..', '........',
]);

// ─────────────────────────────────────────────────────────────────────────────
// FONDOS: nubes + siluetas de montañas (puntos diseñados a mano)
// ─────────────────────────────────────────────────────────────────────────────

const ART = { T, P, LL, E, OBJ };
