// level3.js — CAPÍTULO 3: LA EXCURSIÓN A MACHU PICCHU. La promo salió de
// excursión y el niño se quedó dormido en el hostal: tiene que alcanzar al
// grupo antes de la foto de las 8:00. Un solo nivel, de izquierda a derecha:
//
//   x 0–151    EL CUSCO        · calles empedradas, muro inca, la plaza y la
//                                alpaca de la foto: se sube a los tejados
//   x 152–284  VALLE SAGRADO   · andenes de Pisac, el puente del Urubamba,
//                                el mercado (las mantas rebotan) y los andenes
//                                de Ollantaytambo
//   x 285–714  EL TREN         · techo del tren en marcha: túneles y vagones
//                                que se sueltan
//   x 715–     MACHU PICCHU    · Aguas Calientes, el Camino Inca y la foto
// ─────────────────────────────────────────────────────────────────────────────
(() => {
  const A3 = ART3, T3 = A3.T;
  const GC = 70;     // fila de la calle del Cusco
  const GV = 76;     // fila del fondo del valle (y de los rieles del tren)
  const ROOF = 73;   // fila del techo del tren (y de los andenes de las estaciones)
  const hash = (n) => { n = (n | 0) ^ 0x9e3779b9; n = Math.imul(n ^ (n >>> 16), 0x85ebca6b); n = Math.imul(n ^ (n >>> 13), 0xc2b2ae35); n ^= n >>> 16; return (n >>> 0) / 4294967296; };
  const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

  // tiles propios (con prefijo para no chocar con otros capítulos)
  Object.assign(TILE_SPECS, {
    c3cobble: { solid: true, top: T3.cobble, body: T.dirt },
    c3bld:    { solid: true },                       // casas: las dibuja renderBack
    c3balc:   { oneway: true },                      // balcón colonial (dibujado con la casa)
    c3inca:   { solid: true, body: T3.inca },
    c3anden:  { solid: true, top: T3.andenTop, body: T3.inca },
    c3plat:   { solid: true, top: T3.plat, body: T3.inca },
    c3gran:   { solid: true, top: T3.granTop, body: T3.inca },
    c3sacks:  { solid: true, body: T3.sacks },
    c3saruna: { oneway: true, body: T3.saruna },
  });

  // ── las casas coloniales de los tejados (sólidas) ─────────────────────────
  // x, ancho, fila del techo; muro y si llevan balcón
  const ROOFS = [
    { x: 46, w: 8, top: 66, wall: '#efe6d6', balc: true },
    { x: 57, w: 9, top: 65, wall: '#e8d2a0' },
    { x: 69, w: 7, top: 63, wall: '#efe6d6', tower: true },
    { x: 80, w: 10, top: 65, wall: '#dfe7ea', balc: true },
    { x: 93, w: 8, top: 64, wall: '#efe6d6' },
    { x: 104, w: 10, top: 66, wall: '#e8d2a0', balc: true },
    { x: 117, w: 8, top: 61, wall: '#efe6d6', tower: true },
    { x: 128, w: 9, top: 64, wall: '#dfe7ea' },
    { x: 140, w: 8, top: 63, wall: '#e8d2a0', balc: true },
  ];
  // calles transversales entre casa y casa: por ahí pasa la comparsa
  const ALLEYS = ROOFS.slice(0, -1).map((b, i) => [b.x + b.w, ROOFS[i + 1].x]);
  // balcones que asoman a la calle (se pisan): [x, fila]
  const BALCONIES = [[44, 68], [115, 64]];

  // dónde empieza cada tramo
  const V = 152;          // VALLE SAGRADO
  const OL = V + 133;     // andén de Ollantaytambo
  const PE = OL + 18;     // fin del andén: ahí espera el tren
  const AC = PE + 412;    // andén de Aguas Calientes (el tren para justo antes)

  // ── el camino inca: escalones de 4 casillas que suben 2 ──────────────────
  const steps = (x0, row0, n) => [...Array(n).keys()].map(i => [x0 + 4 * i, row0 - 2 * i, 4, 84 - (row0 - 2 * i), 'c3gran']);

  const LEVEL3 = {
    name: 'LA EXCURSIÓN A MACHU PICCHU', w: AC + 196, h: 84,
    anchorRow: GC,
    spawn: { x: 3, y: GC },
    bgLayers: [
      { kind: 'mountains', color: '#9a94c4', color2: '#7a73a6', y: GC - 3.4, parallax: 0.08, vpar: 0.10, amp: 7, seed: 9, snow: true },
      { kind: 'mountains', color: '#8f7f8f', color2: '#6d5d72', y: GC - 1.8, parallax: 0.18, vpar: 0.24, amp: 4.5, seed: 4 },
      { kind: 'city', build: cuscoSkyline, color: '#c9b293', color2: '#7a5e4c', y: GC - 0.2, parallax: 0.32, vpar: 0.40 },
      { kind: 'clouds', color: '#fff6e6', parallax: 0.06, count: 8, seed: 7 },
    ],
    // cada tramo trae su fondo, que se funde con el anterior
    bgZones: [
      { x0: V - 2, x1: V + 10, anchorRow: GV, layers: [
        { kind: 'mountains', color: '#a7b4d4', color2: '#8590b6', y: GV - 3.6, parallax: 0.08, vpar: 0.10, amp: 9, seed: 12, snow: true },
        { kind: 'mountains', color: '#6f9a5e', color2: '#557d4a', y: GV - 1.6, parallax: 0.18, vpar: 0.24, amp: 6, seed: 3 },
        { kind: 'terraces', build: terraceHills, color: '#7fa463', color2: '#557d4a', y: GV - 0.4, parallax: 0.32, vpar: 0.40 },
        { kind: 'clouds', color: '#fff6e6', parallax: 0.06, count: 8, seed: 3 },
      ] },
      { x0: OL + 1, x1: OL + 15, anchorRow: GV, layers: [
        { kind: 'mountains', color: '#5f8a6a', color2: '#4a7356', y: GV - 4.2, parallax: 0.08, vpar: 0.10, amp: 10, seed: 21 },
        { kind: 'mountains', color: '#3f6f4c', color2: '#2f5a3c', y: GV - 2.2, parallax: 0.18, vpar: 0.24, amp: 7, seed: 8 },
        { kind: 'canopy', color: '#2f5a3a', color2: '#244a2e', y: GV - 0.4, parallax: 0.40, vpar: 0.45, amp: 2, seed: 5 },
        { kind: 'clouds', color: '#eef2ee', parallax: 0.06, count: 9, seed: 6 },
      ] },
      { x0: AC - 5, x1: AC + 9, anchorRow: 52, layers: [
        { kind: 'mountains', color: '#93a4c4', color2: '#7584a6', y: 52 - 3, parallax: 0.06, vpar: 0.08, amp: 8, seed: 15, snow: true },
        { kind: 'mountains', color: '#5f8f6a', color2: '#4a7356', y: 52 - 1, parallax: 0.16, vpar: 0.2, amp: 7, seed: 6 },
        { kind: 'canopy', color: '#3f7a4c', color2: '#2f6038', y: 52 + 1.5, parallax: 0.32, vpar: 0.36, amp: 3, seed: 2 },
        { kind: 'clouds', color: '#ffffff', parallax: 0.05, count: 10, seed: 9 },
      ] },
    ],
    zones: [
      { x: 0,      name: 'EL CUSCO',      music: 'c3cusco' },
      { x: V,      name: 'VALLE SAGRADO', music: 'c3valle' },
      { x: OL + 1, name: 'EL TREN',       music: 'c3tren' },
      { x: AC,     name: 'MACHU PICCHU',  music: 'c3condor' },
    ],
    rects: [
      // ── EL CUSCO ──
      [0, GC, V + 6, 84 - GC, 'c3cobble'],
      ...ROOFS.map(b => [b.x, b.top, b.w, GC - b.top, 'c3bld']),
      // escalinata de piedra para bajar de los tejados
      [148, 65, 1, 5, 'c3inca'], [149, 67, 1, 3, 'c3inca'], [150, 69, 1, 1, 'c3inca'],
      // ── VALLE SAGRADO: los andenes de Pisac bajan al valle ──
      [V + 6, 72, 6, 12, 'c3anden'], [V + 12, 74, 6, 10, 'c3anden'], [V + 18, GV, 14, 84 - GV, 'grass'],
      // la otra orilla del Urubamba y el mercado
      [V + 54, GV, 42, 84 - GV, 'grass'],
      [V + 68, 72, 2, 4, 'c3sacks'], [V + 76, 70, 2, 6, 'c3sacks'], [V + 89, 74, 2, 2, 'c3sacks'],
      // los andenes de Ollantaytambo suben de a tres casillas
      [V + 96, 73, 8, 11, 'c3anden'], [V + 104, 70, 8, 14, 'c3anden'], [V + 112, 67, 8, 17, 'c3anden'], [V + 120, 64, 9, 20, 'c3anden'],
      [V + 129, 66, 1, 18, 'c3inca'], [V + 130, 68, 1, 16, 'c3inca'], [V + 131, 70, 1, 14, 'c3inca'], [V + 132, 72, 1, 12, 'c3inca'],
      // ── EL TREN: andén de Ollantaytambo y andén de Aguas Calientes ──
      [OL, ROOF, PE - OL, 84 - ROOF, 'c3plat'],
      [AC, ROOF, 20, 84 - ROOF, 'c3plat'],
      // ── MACHU PICCHU: el Camino Inca ──
      ...steps(AC + 20, 72, 6),
      [AC + 44, 60, 6, 24, 'c3gran'],
      ...steps(AC + 53, 59, 6),
      [AC + 77, 48, 6, 36, 'c3gran'],
      ...steps(AC + 86, 46, 4),
      [AC + 102, 40, 5, 44, 'c3gran'],
      // pilares de piedra sobre las nubes
      [AC + 110, 41, 4, 43, 'c3gran'], [AC + 117, 39, 4, 45, 'c3gran'], [AC + 124, 41, 3, 43, 'c3gran'],
      // la terraza de la foto: un andén delgado sobre la ciudadela
      [AC + 130, 40, 66, 2, 'c3anden'],
    ],
    platforms: [
      ...BALCONIES.map(([x, r]) => [x, r, 2, 'c3balc']),
      // puente colgante sobre el Urubamba, con un tramo en reparación
      [V + 32, GV, 8, 'ropeBridge'], [V + 43, GV, 11, 'ropeBridge'],
      // escaleras voladizas en los muros de los andenes
      [V + 103, 71, 1, 'c3saruna'], [V + 111, 68, 1, 'c3saruna'], [V + 119, 65, 1, 'c3saruna'],
    ],
    liquids: [
      [V + 32, GV + 1, 22, 7, 'water', 1],
      // el Urubamba corre junto a la vía del tren
      [PE, 79, AC - PE, 5, 'water', 1],
    ],
    entities: [
      { type: 'state3' },
      // ── EL CUSCO ──
      { type: 'sign3', x: 15.5, y: GC, lines: ['NO TOCAR LOS', 'MUROS INCAS'], color: 'white', post: 12 },
      { type: 'tourist', x: 9.5, y: GC, v: 0 },
      { type: 'photoLady', x: 27, y: GC },
      { type: 'alpaca', x: 29.5, y: GC, retireX: V + 60 },
      { type: 'tourist', x: 31, y: GC, v: 1 },
      { type: 'dancer', x: 34, y: GC, v: 0, phase: 0 }, { type: 'dancer', x: 37.5, y: GC, v: 1, phase: 3 }, { type: 'dancer', x: 41, y: GC, v: 0, phase: 6 },
      ...ALLEYS.map(([x0, x1], i) => ({ type: 'comparsa', x0, x1, y: GC, v: i % 2 })),
      { type: 'checkpoint', x: 60, y: 65 },
      { type: 'page', x: 72.5, y: 59 },
      { type: 'spitter', x: 86, y: 65, face: -1 },
      { type: 'tourist', x: 97, y: 64, v: 1 },
      { type: 'spitter', x: 111, y: 66, face: -1 },
      { type: 'checkpoint', x: 120, y: 61 },
      { type: 'spitter', x: 135, y: 64, face: -1 },
      { type: 'tourist', x: 144, y: 63, v: 0 },
      // ── VALLE SAGRADO ──
      { type: 'checkpoint', x: V + 2, y: GC },
      { type: 'sign3', x: V + 3, y: GC, lines: ['VALLE SAGRADO', 'PISAC >'], color: 'green' },
      { type: 'sign3', x: V + 28, y: GV, lines: ['PUENTE EN', 'REPARACIÓN', 'DESDE 1998'], color: 'yellow' },
      { type: 'bridge', x0: V + 32, x1: V + 40, row: GV }, { type: 'bridge', x0: V + 43, x1: V + 54, row: GV },
      { type: 'sign3', x: V + 59, y: GV, lines: ['MERCADO', 'DE PISAC'], color: 'red', post: 20 },
      { type: 'awning', x: V + 62, y: 73, w: 4, ground: GV, c: 0, goods: 'choclo', hint: true },
      { type: 'awning', x: V + 71, y: 73, w: 4, ground: GV, c: 1, goods: 'papa' },
      { type: 'awning', x: V + 80, y: 73, w: 4, ground: GV, c: 2, goods: 'aji' },
      { type: 'awning', x: V + 92, y: 72, w: 3, ground: GV, c: 0, goods: 'choclo' },
      { type: 'page', x: V + 76.5, y: 65 },
      { type: 'tourist', x: V + 85.5, y: GV, v: 0 },
      // ── EL TREN ──
      { type: 'checkpoint', x: OL + 4, y: ROOF },
      { type: 'sign3', x: OL + 13, y: ROOF, lines: ['PROHIBIDO SUBIR', 'AL TECHO DEL TREN'], color: 'red', post: 10 },
      { type: 'train', roof: ROOF, platEnd: PE, stop: AC, speed: 2.6, wagons: 4, water: 79,
        // los vagones se sueltan donde ningún túnel cae cerca (hay que poder saltar)
        tunnels: [[50, 60], [150, 162], [188, 200], [270, 280], [360, 372]].map(([a, b]) => [PE + a, PE + b]),
        decouples: [120, 250, 330].map(d => PE + d), cp: PE + 125 },
      ...[0, 1, 2, 3, 4].map(i => ({ type: 'wagon', i })),
      // ── MACHU PICCHU ──
      { type: 'checkpoint', x: AC + 3, y: ROOF },
      { type: 'tourist', x: AC + 9, y: ROOF, v: 1 },
      { type: 'sign3', x: AC + 15, y: ROOF, lines: ['A MACHU PICCHU:', 'BUS S/ 80', 'A PIE: GRATIS'], color: 'wood' },
      { type: 'sign3', x: AC + 22, y: 72, lines: ['CAMINO INCA', '¡SOLO 1700 ESCALONES!'], color: 'wood' },
      { type: 'checkpoint', x: AC + 46, y: 60 },
      { type: 'tourist', x: AC + 48, y: 60, v: 0 },
      { type: 'rockfall', x: AC + 75, y: 40, interval: 150 },
      { type: 'checkpoint', x: AC + 79, y: 48 },
      { type: 'spitter', x: AC + 81.5, y: 48, face: -1, kind: 'mp' },
      { type: 'page', x: AC + 84, y: 44 },
      { type: 'checkpoint', x: AC + 104, y: 40 },
      { type: 'sign3', x: AC + 103.5, y: 40, lines: ['YA FALTA POQUITO', '(MENTIRA)'], color: 'wood' },
      { type: 'spitter', x: AC + 132.5, y: 40, face: -1, kind: 'mp' },
      { type: 'tourist', x: AC + 142, y: 40, v: 1 },
      { type: 'classPhoto', x: AC + 157, y: 40 },
    ],
    renderBack: renderBack3,
    renderScreen: renderScreen3,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  FONDOS DE PARALLAX (dibujados una vez en una tira de 768 px)
  // ═══════════════════════════════════════════════════════════════════════════
  // tejados del Cusco a lo lejos, con las torres de las iglesias
  function cuscoSkyline(g, W, H) {
    let x = 0, i = 0;
    while (x < W) {
      const w = 18 + Math.floor(hash(i * 7) * 18), h = 10 + Math.floor(hash(i * 13) * 16), base = 128 + Math.floor(hash(i * 5) * 6);
      R(g, hash(i * 3) > 0.3 ? '#d9cbb4' : '#cdb48c', x, base - h, w, H);
      for (let k = 0; k < w; k += 2) R(g, k % 4 ? '#a85a44' : '#8e4a38', x + k, base - h - 4 + Math.abs(k - w / 2) / (w / 2) * 3, 2, 4);
      for (let k = 4; k < w - 4; k += 7) R(g, '#5d4a44', x + k, base - h + 5, 2, 3);
      // de vez en cuando, una iglesia con su campanario
      if (i % 9 === 4) { R(g, '#b9a68a', x + 4, base - h - 22, 9, 22); R(g, '#8f7f70', x + 5, base - h - 26, 7, 4); R(g, '#5d4a44', x + 7, base - h - 18, 3, 4); R(g, '#d9cbb4', x + 8, base - h - 30, 1, 4); }
      x += w; i++;
    }
    R(g, '#7a5e4c', 0, 134, W, H);
  }
  // cerros del Valle Sagrado cubiertos de andenes
  function terraceHills(g, W, H) {
    for (let x = 0; x < W; x += 2) {
      const top = Math.round((112 - Math.sin(x / W * Math.PI * 6 + 1) * 14 - Math.sin(x / W * Math.PI * 14) * 5) / 2) * 2;
      R(g, '#7fa463', x, top, 2, H);
      for (let y = top + 4; y < H; y += 5) R(g, (y >> 2) % 2 ? '#6b8f52' : '#8fb070', x, y, 2, 1);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DECORADO EN EL MUNDO (detrás de los tiles): casas, muro inca, catedral,
  //  ruinas, estaciones y la ciudadela. Cada pieza se dibuja una vez en su
  //  propio canvas y luego solo se copia.
  // ═══════════════════════════════════════════════════════════════════════════
  const cache = {};
  function cached(key, w, h, paint) {
    if (!cache[key]) { const c = PIX.createCanvas(w, h); paint(c.getContext('2d'), w, h); cache[key] = c; }
    return cache[key];
  }
  // sillares incas en hiladas: piedras de largo variable con esquinas romas
  function incaCourses(g, x0, y0, w, h, seed, cols = ['#a89e8c', '#c7bdaa', '#8c8272', '#5f574a']) {
    let y = y0, row = 0;
    while (y < y0 + h) {
      const ch = Math.min(y0 + h - y, 8 + Math.floor(hash(seed + row * 17) * 5));
      let x = x0, k = 0;
      while (x < x0 + w) {
        const sw = Math.min(x0 + w - x, 12 + Math.floor(hash(seed + row * 31 + k * 7) * 16));
        R(g, cols[3], x, y, sw, ch);
        R(g, cols[0], x + 1, y + 1, sw - 2, ch - 2);
        R(g, cols[1], x + 2, y + 1, sw - 4, 1); R(g, cols[1], x + 1, y + 2, 1, ch - 4);
        R(g, cols[2], x + 2, y + ch - 2, sw - 3, 1); R(g, cols[2], x + sw - 2, y + 2, 1, ch - 3);
        x += sw; k++;
      }
      y += ch; row++;
    }
  }
  // casa colonial: muro encalado sobre base inca, ventanas azules y techo de teja
  function paintHouse(g, W, H, b) {
    const ox = 4, oy = 4, w = W - 8, h = H - 8;
    R(g, b.wall, ox, oy, w, h);
    R(g, 'rgba(0,0,0,0.06)', ox, oy + 10, 3, h - 10);
    incaCourses(g, ox, oy + h - 30, w, 30, b.x * 3);
    // ventanas con marco azul (y alguna con macetas de geranios)
    for (let wy = oy + 18; wy < oy + h - 40; wy += 30) for (let wx = ox + 10; wx < ox + w - 14; wx += 26) {
      R(g, '#1f4f80', wx - 1, wy - 1, 12, 16); R(g, '#2f6fa8', wx, wy, 10, 14); R(g, '#1d2a3a', wx + 2, wy + 2, 6, 10);
      R(g, '#9fd3f0', wx + 2, wy + 2, 2, 2); R(g, '#f4efe4', wx - 2, wy + 14, 14, 2);
      if (hash(wx * 7 + wy + b.x) > 0.6) { R(g, '#9a5a30', wx, wy + 11, 10, 3); R(g, '#d8432f', wx + 1, wy + 9, 2, 2); R(g, '#d8432f', wx + 6, wy + 9, 2, 2); R(g, '#3f7a4c', wx + 4, wy + 10, 2, 1); }
    }
    // puerta de madera a la calle
    if (b.door !== false) { const dx = ox + Math.floor(w / 2) - 8; R(g, '#1f4f80', dx - 2, oy + h - 28, 20, 28); R(g, '#6b4524', dx, oy + h - 26, 16, 26); R(g, '#8a5a30', dx + 7, oy + h - 26, 1, 26); R(g, '#e2b13c', dx + 10, oy + h - 14, 1, 2); }
    // balcón cusqueño de madera, cerrado y con celosía
    if (b.balc) {
      const bx = ox + w - 40, by = oy + 16;
      R(g, '#1d2a3a', bx - 1, by - 1, 32, 22); R(g, '#2f6fa8', bx, by, 30, 20); R(g, '#1f4f80', bx, by + 9, 30, 2);
      for (let k = 2; k < 30; k += 4) R(g, '#9fd3f0', bx + k, by + 2, 2, 6);
      for (let k = 1; k < 30; k += 3) R(g, '#1f4f80', bx + k, by + 12, 1, 6);
      R(g, '#6b4524', bx - 2, by + 20, 34, 2); R(g, '#6b4524', bx + 3, by + 22, 2, 4); R(g, '#6b4524', bx + 25, by + 22, 2, 4);
    }
    // techo de tejas de arcilla: la superficie que pisas queda arriba del todo
    for (let k = 0; k < W; k += 4) {
      R(g, '#8e3b2a', k, oy, 4, 9); R(g, '#b5523b', k, oy, 3, 8); R(g, '#d9785a', k, oy, 3, 1);
      R(g, '#d9785a', k, oy + 4, 1, 3);
    }
    R(g, '#6e2c1f', 0, oy + 9, W, 1); R(g, 'rgba(0,0,0,0.25)', ox, oy + 10, w, 3);
  }
  // el balcón por donde se sube desde la calle (plataforma de una vía)
  function paintStreetBalcony(ctx, x, y) {
    R(ctx, '#1d2a3a', x - 1, y - 1, 34, 3); R(ctx, '#6b4524', x, y, 32, 3); R(ctx, '#8a5a30', x, y, 32, 1);
    for (let k = 2; k < 32; k += 4) R(ctx, '#2f6fa8', x + k, y - 10, 2, 10);
    R(ctx, '#2f6fa8', x, y - 11, 32, 2);
    R(ctx, '#6b4524', x + 4, y + 3, 2, 8); R(ctx, '#6b4524', x + 24, y + 3, 2, 8);
  }

  // la catedral de la Plaza de Armas: piedra andesita, dos torres y portada
  function paintCathedral(g, W, H) {
    const st = '#8f7f70', dk = '#6f6052', hi = '#a89888';
    const tw = 52, by = 70;
    R(g, st, tw - 4, by, W - 2 * tw + 8, H - by);                 // cuerpo central
    for (let y = by + 6; y < H; y += 8) R(g, dk, tw - 4, y, W - 2 * tw + 8, 1);
    for (const tx of [0, W - tw]) {                              // las dos torres
      R(g, st, tx, 24, tw, H - 24); R(g, hi, tx, 24, 2, H - 24);
      for (let y = 30; y < H; y += 8) R(g, dk, tx, y, tw, 1);
      R(g, dk, tx + 12, 34, 28, 24); R(g, '#2a1f2d', tx + 16, 38, 20, 20);   // campanario
      R(g, '#e2b13c', tx + 22, 44, 8, 8); R(g, '#bd8a1c', tx + 22, 50, 8, 2);
      R(g, st, tx - 2, 20, tw + 4, 6); R(g, hi, tx - 2, 20, tw + 4, 1);
      R(g, st, tx + 10, 6, tw - 20, 14); R(g, dk, tx + 16, 0, tw - 32, 8);   // cúpula
      R(g, '#e2b13c', tx + tw / 2 - 1, -4 + 4, 2, 6);
    }
    // portada: arco, columnas y ventana
    const cx = W / 2;
    R(g, hi, cx - 34, by + 8, 68, H - by - 8); R(g, st, cx - 30, by + 12, 60, H - by - 12);
    for (const k of [-26, -16, 12, 22]) R(g, hi, cx + k, by + 14, 4, H - by - 14);
    R(g, '#2a1f2d', cx - 10, H - 46, 20, 46); R(g, '#3a2412', cx - 9, H - 44, 18, 44); R(g, '#2a1f2d', cx - 6, H - 52, 12, 6);
    R(g, '#2a1f2d', cx - 4, by + 20, 8, 12); R(g, '#e2b13c', cx - 2, by + 22, 4, 4);
    R(g, st, cx - 40, by - 10, 80, 12); R(g, hi, cx - 40, by - 10, 80, 1); R(g, dk, cx - 2, by - 22, 4, 12); R(g, dk, cx - 6, by - 18, 12, 3);
  }
  // el muro inca de Hatun Rumiyoc con la piedra de los doce ángulos
  function paintIncaStreet(g, W, H) {
    R(g, '#e8dcc6', 0, 0, W, H - 54); R(g, '#d8ccb6', 0, H - 60, W, 6);
    for (let wx = 14; wx < W - 20; wx += 44) { R(g, '#1f4f80', wx - 1, 17, 14, 22); R(g, '#2f6fa8', wx, 18, 12, 20); R(g, '#1d2a3a', wx + 2, 20, 8, 16); }
    incaCourses(g, 0, H - 54, W, 54, 77, ['#8a8a7a', '#a6a596', '#6e6e60', '#4a4a40']);
    // la piedra de los doce ángulos: verdosa, más grande, encajada entre las demás
    const P = [[0, 6], [5, 0], [17, 1], [24, 0], [30, 5], [32, 13], [28, 18], [31, 25], [22, 28], [10, 27], [4, 22], [1, 15]];
    const ox = 56, oy = H - 44;
    g.fillStyle = '#4a4a40'; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(ox + x - 1, oy + y - 1) : g.moveTo(ox + x - 1, oy + y - 1)); g.closePath(); g.fill();
    g.save(); g.translate(1, 1); g.fillStyle = '#4a4a40'; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y)); g.closePath(); g.fill(); g.restore();
    g.fillStyle = '#8f9a80'; g.beginPath(); P.forEach(([x, y], i) => i ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y)); g.closePath(); g.fill();
    R(g, '#a9b498', ox + 6, oy + 4, 14, 2); R(g, '#a9b498', ox + 4, oy + 6, 2, 8);
  }
  // el hostal donde se quedó dormido
  function paintHostal(g, W, H) {
    paintHouse(g, W, H, { x: 3, wall: '#f0c98a', door: true, balc: true });
    R(g, '#1d1622', W / 2 - 25, 70, 50, 13); R(g, '#3f7a4c', W / 2 - 24, 71, 48, 11);
    drawText(g, 'HOSTAL', W / 2, 73, { color: '#ffffff', align: 'center' });
  }
  // estación de tren: casita con alero y el nombre pintado
  function paintStation(name) {
    return (g, W, H) => {
      R(g, '#e8d2a0', 6, 14, W - 12, H - 14);
      for (let k = 0; k < W; k += 4) { R(g, '#8e3b2a', k, 6, 4, 9); R(g, '#b5523b', k, 6, 3, 8); }
      for (let wx = 16; wx < W - 24; wx += 30) { R(g, '#3f7a4c', wx - 1, 30, 14, 20); R(g, '#1d2a3a', wx + 1, 32, 10, 16); }
      const tw = textWidth(name) + 10;
      R(g, '#1d1622', W / 2 - tw / 2 - 1, 17, tw + 2, 11); R(g, '#3f7a4c', W / 2 - tw / 2, 18, tw, 9);
      drawText(g, name, W / 2, 19, { color: '#ffffff', align: 'center' });
    };
  }
  // casitas de adobe de Pisac, detrás del mercado
  function paintVillage(g, W, H) {
    for (let x = 0, i = 0; x < W; i++) {
      const w = 40 + Math.floor(hash(i * 11) * 30), h = 34 + Math.floor(hash(i * 5) * 16);
      R(g, hash(i) > 0.5 ? '#c99a62' : '#d9ad74', x, H - h, w - 2, h);
      for (let y = H - h + 14; y < H; y += 5) R(g, 'rgba(120,80,40,0.25)', x, y, w - 2, 1);
      for (let k = -2; k < w; k += 4) { R(g, '#8e3b2a', x + k, H - h - 6, 4, 8); R(g, '#b5523b', x + k, H - h - 6, 3, 7); }
      R(g, '#3a2412', x + 8, H - 20, 10, 20); R(g, '#1f4f80', x + w - 18, H - h + 14, 8, 8);
      x += w;
    }
  }
  // el Templo del Sol de Ollantaytambo: seis monolitos rosados
  function paintMonoliths(g, W, H) {
    for (let i = 0; i < 6; i++) {
      const x = i * 18, h = H - 4 - Math.floor(hash(i * 9) * 8);
      R(g, '#7a5a52', x, H - h, 16, h); R(g, '#c99a8a', x + 1, H - h + 1, 14, h - 2); R(g, '#e0b8a8', x + 2, H - h + 1, 4, h - 3);
      R(g, '#a87a6a', x + 16, H - h + 6, 2, h - 6);
    }
  }
  // la Puerta del Sol (Inti Punku): vano trapezoidal de piedra
  function paintIntiPunku(g, W, H) {
    incaCourses(g, 0, 0, W, H, 501, ['#9a978c', '#b8b5a8', '#7a776c', '#55534a']);
    g.fillStyle = 'rgba(0,0,0,0)'; g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(W / 2 - 8, 10); g.lineTo(W / 2 + 8, 10); g.lineTo(W / 2 + 13, H); g.lineTo(W / 2 - 13, H); g.closePath(); g.fillStyle = '#000'; g.fill();
    g.globalCompositeOperation = 'source-over';
  }
  // la ciudadela vista desde arriba: andenes que bajan, casas de granito sin techo
  function paintCitadel(g, W, H) {
    for (let i = 0; i < 9; i++) {
      const y = i * 12, x0 = i * 6;
      R(g, '#55534a', x0, y, W - x0, 12); R(g, '#9a978c', x0, y + 2, W - x0, 10); R(g, '#6f9a52', x0, y, W - x0, 3);
      for (let x = x0 + (i % 2) * 6; x < W; x += 12) R(g, '#7a776c', x, y + 6, 1, 6);
    }
    // la plaza principal (pasto) y las casas
    R(g, '#7fae5c', 60, 46, 200, 20); R(g, '#93c06a', 60, 46, 200, 2);
    for (let k = 0; k < 14; k++) {
      const x = 20 + k * 34 + Math.floor(hash(k * 3) * 10), y = 14 + (k % 3) * 24, w = 14 + Math.floor(hash(k * 7) * 8);
      R(g, '#6e6c62', x - 1, y - 1, w + 2, 11); R(g, '#a8a598', x, y, w, 9); R(g, '#8c897c', x, y + 6, w, 3);
      R(g, '#a8a598', x, y - 4, 3, 4); R(g, '#a8a598', x + w - 3, y - 4, 3, 4);   // hastiales
      R(g, '#2a2a30', x + 3, y + 3, 2, 4); R(g, '#2a2a30', x + w - 5, y + 3, 2, 4);
    }
    // las llamas que pastan en la ciudadela
    for (const [x, y] of [[120, 52], [180, 49]]) { R(g, '#f4efe4', x, y, 7, 4); R(g, '#f4efe4', x + 5, y - 4, 2, 4); R(g, '#3a2414', x + 1, y + 4, 1, 2); R(g, '#3a2414', x + 5, y + 4, 1, 2); }
  }
  // Huayna Picchu: el pico verde y empinado detrás de la ciudadela
  function paintHuayna(g, W, H) {
    for (let x = 0; x < W; x += 2) {
      const d1 = Math.abs(x - 210) / 70, d2 = Math.abs(x - 80) / 60;
      const top = Math.min(16 + Math.pow(d1, 1.7) * 150 + Math.round(hash(x >> 2) * 4), 170 + Math.pow(d2, 1.6) * 90);
      R(g, x > 210 ? '#3f6a42' : '#4f7f4c', x, top, 2, H - top);
      if (top < 110 && hash(x * 3) > 0.5) R(g, '#7a7a72', x, top + 2 + Math.floor(hash(x) * 20), 2, 6);   // roca viva
      if (top < 60 && (x >> 1) % 3 === 0) R(g, '#8a8a80', x, top + 4, 2, 1);                             // andenes en la cumbre
    }
    g.globalCompositeOperation = 'source-atop'; R(g, 'rgba(240,248,255,0.2)', 0, 0, W, H); g.globalCompositeOperation = 'source-over';   // un velo de neblina
  }

  // piezas del decorado: [x en casillas, fila del suelo, ancho y alto (px), pintor, ajuste x, ajuste y]
  const BACK = [
    [0, GC, 8 * TILE + 8, 7 * TILE + 8, paintHostal, -4, 4],
    [8, GC, 16 * TILE, 96, paintIncaStreet],
    [27, GC, 18 * TILE, 12 * TILE, paintCathedral],
    [V + 58, GV, 38 * TILE, 60, paintVillage],
    [V + 121, 64, 108, 44, paintMonoliths],
    [OL + 1, ROOF, 15 * TILE, 58, paintStation('OLLANTAYTAMBO')],
    [AC + 2, ROOF, 15 * TILE, 58, paintStation('AGUAS CALIENTES')],
    [AC + 134, 40, 44, 52, paintIntiPunku],
  ];
  function renderBack3(ctx, g) {
    const cam = g.cam, vw = VIEW.w;
    const vis = (x, w) => x + w > cam.x - 8 && x < cam.x + vw + 8;
    // Machu Picchu: el pico y la ciudadela tienen algo de parallax (están lejos)
    if (cam.x > (AC + 105) * TILE) {
      const ref = (AC + 159) * TILE - vw / 2;
      const hp = cached('huayna', 340, 320, paintHuayna);
      ctx.drawImage(hp, Math.round((AC + 155) * TILE + (cam.x - ref) * 0.45), 31 * TILE + 4);
      const ci = cached('citadel', 520, 120, paintCitadel);
      ctx.drawImage(ci, Math.round((AC + 143) * TILE + (cam.x - ref) * 0.2), 41 * TILE + 8);
    }
    // mar de nubes a los pies del Camino Inca
    if (cam.x > (AC + 30) * TILE - vw) for (let i = 0; i < 26; i++) {
      const w = 90 + hash(i * 5) * 90, x = (AC + 40) * TILE + i * 70 + Math.sin(g.T * 0.004 + i) * 12;
      if (vis(x, w)) { cloudBank(ctx, x, 43 * TILE + hash(i * 3) * 40, w, 9, 0.8); cloudBank(ctx, x + 20, 42 * TILE + hash(i * 9) * 24, w * 0.6, 6, 0.9); }
    }
    for (const [tx, row, w, h, paint, ox = 0, oy = 0] of BACK) {
      const x = tx * TILE + ox; if (!vis(x, w)) continue;
      ctx.drawImage(cached('b' + tx, w, h, paint), x, row * TILE - h + oy);
    }
    // pilar de piedra del puente en reparación
    const px = (V + 40) * TILE;
    if (vis(px, 48)) { R(ctx, '#5f574a', px + 10, GV * TILE + 2, 28, 60); R(ctx, '#8c8272', px + 12, GV * TILE + 2, 24, 60); for (let y = GV * TILE + 8; y < GV * TILE + 60; y += 8) R(ctx, '#5f574a', px + 12, y, 24, 1); }
    // las casas de los tejados
    for (const b of ROOFS) {
      const x = b.x * TILE; if (!vis(x - 4, b.w * TILE + 8)) continue;
      const W = b.w * TILE + 8, H = (GC - b.top) * TILE + 8;
      ctx.drawImage(cached('r' + b.x, W, H, (c) => paintHouse(c, W, H, b)), x - 4, b.top * TILE - 4);
      if (b.tower) {
        // campanario sobre la casa (de fondo: no se pisa)
        const tx = x + b.w * TILE - 30, ty = b.top * TILE;
        R(ctx, '#d9cbb4', tx, ty - 34, 22, 34); R(ctx, '#bfae94', tx + 18, ty - 34, 4, 34);
        R(ctx, '#2a1f2d', tx + 6, ty - 28, 10, 12); R(ctx, '#e2b13c', tx + 8, ty - 24, 6, 6);
        R(ctx, '#b5523b', tx - 2, ty - 38, 26, 4); R(ctx, '#d9785a', tx + 9, ty - 44, 4, 6); R(ctx, '#e2b13c', tx + 10, ty - 50, 2, 6);
      }
    }
    for (const [bx, br] of BALCONIES) if (vis(bx * TILE - 8, 48)) paintStreetBalcony(ctx, bx * TILE, br * TILE);
  }
  // neblina de Machu Picchu: bancos de nube suaves que pasan por delante
  function renderScreen3(ctx, g) {
    const cam = g.cam; if (cam.x < (AC + 9) * TILE) return;
    const a = Math.min(1, (cam.x - (AC + 9) * TILE) / 200);
    for (let i = 0; i < 5; i++) {
      const w = 140 + hash(i * 7) * 160, y = 50 + hash(i * 13) * (VIEW.h - 70), span = VIEW.w + w;
      const x = ((hash(i * 3) * span + g.T * (0.12 + hash(i) * 0.15) - cam.x * 0.15) % span + span) % span - w;
      cloudBank(ctx, x, y, w, 7, 0.06 * a);
    }
  }
  // nube como una elipse de líneas: más ancha al medio, sin bordes duros
  function cloudBank(ctx, x, y, w, h, alpha) {
    ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
    for (let dy = -h; dy <= h; dy++) {
      const k = Math.sqrt(1 - (dy / (h + 1)) ** 2), lw = Math.round(w * k * (0.85 + 0.15 * Math.sin(dy * 1.7 + x * 0.01)));
      ctx.fillRect(Math.round(x + (w - lw) / 2), Math.round(y + dy), lw, 1);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  MÚSICA (misma notación y armonía que level.js: compases de 2/4)
  // ═══════════════════════════════════════════════════════════════════════════
  Object.assign(SONGS, {
    // huayno cusqueño: alegre, para correr por las calles empedradas
    c3cusco: makeSong({ bpm: 124, vol: 0.28, strum: 'D.DUD.DU', drums: 'B..bB...', shaker: true, orn: 0.3, lead2Vol: 0.13 }, {
      A: { ch: ['Am', 'G', 'C', 'G', 'Am', 'G', 'C', 'Am'],
           mel: 'A4:2 C5:1 D5:1 E5:2 E5:2 | D5:1 E5:1 G5:2 E5:2 D5:2 | C5:2 E5:1 D5:1 C5:2 G4:2 | D5:3 C5:1 B4:2 G4:2 | A4:2 C5:1 D5:1 E5:2 G5:2 | A5:2 G5:1 E5:1 D5:2 B4:2 | C5:1 D5:1 E5:2 D5:1 C5:1 A4:2 | A4:3 G4:1 A4:4' },
      B: { ch: ['C', 'G', 'Am', 'Em', 'C', 'G', 'Am', 'Am'],
           mel: 'G5:2 E5:1 G5:1 C6:2 G5:2 | D5:2 G5:2 B4:2 D5:2 | E5:1 D5:1 C5:1 D5:1 E5:2 A5:2 | G5:2 E5:2 B4:4 | G5:2 E5:1 G5:1 C6:2 E5:2 | D5:1 E5:1 D5:1 B4:1 G4:2 B4:2 | C5:2 B4:1 A4:1 C5:2 E5:2 | A4:2 A4:1 A4:1 A4:4' },
    }, ['A', 'A*', 'B', 'B~', 'A'], huaynoBass),

    // sikuris del valle: las zampoñas dialogan sobre bombos grandes
    c3valle: makeSong({ bpm: 104, vol: 0.28, strum: 'D...D...', drums: 'B.b.B.b.', orn: 0.15, lead2Vol: 0.16 }, {
      A: { ch: ['Em', 'D', 'G', 'Em', 'Em', 'D', 'C', 'Em'],
           mel: 'E5:2 G5:2 B5:2 A5:2 | A5:2 F#5:2 D5:4 | G5:2 B5:2 D6:2 B5:2 | A5:2 G5:2 E5:4 | E5:2 G5:2 B5:2 A5:2 | A5:2 F#5:2 D5:2 E5:2 | G5:2 E5:2 C5:2 D5:2 | E5:6 r:2' },
      B: { ch: ['G', 'D', 'Em', 'Em', 'C', 'D', 'Em', 'Em'],
           mel: 'D6:2 B5:2 G5:2 B5:2 | A5:2 D5:2 F#5:4 | G5:2 E5:2 B4:2 E5:2 | G5:4 E5:4 | C6:2 G5:2 E5:2 G5:2 | F#5:2 A5:2 D5:4 | E5:2 G5:2 B4:2 D5:2 | E5:8' },
    }, ['A*', 'A', 'B*', 'A~', 'B'], slowBass),

    // carnavalito del tren: rápido, con el traqueteo del bombo
    c3tren: makeSong({ bpm: 158, vol: 0.28, strum: 'D.DUD.DU', drums: 'B.bBB.b.', shaker: true, orn: 0.2, lead2Vol: 0.13 }, {
      A: { ch: ['Dm', 'C', 'F', 'Dm', 'Dm', 'C', 'Bb', 'Dm'],
           mel: 'D5:1 F5:1 A5:2 A5:1 G5:1 F5:2 | E5:1 G5:1 C5:2 E5:1 D5:1 C5:2 | F5:1 A5:1 C6:2 A5:1 G5:1 F5:2 | E5:2 D5:2 D5:4 | D5:1 F5:1 A5:2 D6:2 A5:2 | G5:1 E5:1 C5:2 E5:2 G5:2 | F5:1 D5:1 Bb4:2 D5:2 F5:2 | E5:1 F5:1 E5:1 C5:1 D5:4' },
      B: { ch: ['F', 'C', 'Dm', 'Am', 'Bb', 'F', 'C', 'Dm'],
           mel: 'A5:2 A5:1 C6:1 A5:2 F5:2 | G5:2 G5:1 E5:1 C5:4 | F5:2 F5:1 A5:1 D5:4 | E5:2 C5:2 A4:4 | D5:1 F5:1 Bb5:2 A5:1 G5:1 F5:2 | A5:2 F5:2 C5:4 | E5:1 G5:1 C6:2 G5:1 E5:1 C5:2 | D5:2 A4:2 D5:4' },
    }, ['A', 'B', 'A*', 'B'], huaynoBass),

    // EL CÓNDOR PASA (Daniel Alomía Robles, dominio público en el Perú):
    // transcripción propia del tema lento, en La menor, para quena y zampoña
    c3condor: makeSong({ bpm: 88, vol: 0.28, strum: 'D...D.U.', drums: 'B.......', orn: 0.2, lead2Vol: 0.12 }, {
      A: { ch: ['Am', 'E', 'Am', 'Am', 'C', 'Am', 'C', 'Am'],
           mel: 'r:6 E4:2 | A4:6 G#4:2 | A4:2 B4:2 C5:2 D5:2 | E5:6 D5:2 | E5:2 D5:1 E5:1 G5:2 E5:1 D5:1 | C5:2 A4:6 | C5:4 A4:2 G4:2 | A4:8' },
      A2: { ch: ['Am', 'E', 'Am', 'Am', 'C', 'Am', 'E', 'Am'],
           mel: 'r:6 E4:2 | A4:6 G#4:2 | A4:2 B4:2 C5:2 D5:2 | E5:6 D5:2 | E5:2 D5:1 E5:1 G5:2 E5:1 D5:1 | C5:2 A4:6 | B4:4 G#4:2 E4:2 | A4:8' },
      B: { ch: ['Am', 'C', 'Am', 'Am', 'C', 'G', 'E', 'Am'],
           mel: 'A5:6 G5:2 | E5:2 G5:2 A5:2 G5:2 | E5:4 D5:2 C5:2 | A4:8 | C5:4 D5:2 E5:2 | D5:4 B4:2 G4:2 | B4:4 G#4:2 B4:2 | A4:8' },
    }, ['A', 'A2', 'B', 'A2~', 'B*', 'A2'], slowBass),
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  EL CAPÍTULO
  // ═══════════════════════════════════════════════════════════════════════════
  const lv = buildLevel(LEVEL3);
  CHAPTERS[2] = {
    num: 3, title: 'LA EXCURSIÓN A MACHU PICCHU', short: 'MACHU PICCHU', color: '#4f9a6a',
    goal: '¡ALCANZA A TU PROMO EN MACHU PICCHU!', goalShort: '¡A MACHU PICCHU!',
    banner: ['LA EXCURSIÓN A MACHU PICCHU', '¡ALCANZA A TU PROMO!'],
    dayStart: 6 * 60 + 50,
    deathTitle: '¡ATATAU!',
    deathMsgs: {
      spit: '¡LA ALPACA TE ESCUPIÓ!',
      comparsa: '¡TE JALÓ LA COMPARSA!',
      train: '¡SE TE FUE EL TREN, CAUSA!',
      tunnel: '¡AGÁCHATE EN EL TÚNEL, PE!',
      water: '¡TE BAÑASTE EN EL URUBAMBA!',
      rock: '¡PIEDRA SUELTA, CAUSA!',
      fall: '¡TE FUISTE AL BARRANCO!',
      default: '¡ASU MARE!',
    },
    tips: ['ALPACA: TÓCALA PARA MONTARLA. SALTA TEJADOS.', 'MANTAS DEL MERCADO: CAE ENCIMA Y REBOTA.', 'TREN: EN LOS TÚNELES MANTÉN ABAJO.', 'SI SE SUELTA TU VAGÓN, ¡CORRE ADELANTE!'],
    win: {
      title: '¡LLEGASTE A LA FOTO!',
      onTime: ['¡SALISTE EN LA FOTO!', '¡SALISTE EN LA FOTO DE LA PROMO, CAUSA!'],
      late: ['LA FOTO SALIÓ SIN TI', 'LA FOTO SALIÓ SIN TI... ¡TE PEGARÁN CON PHOTOSHOP!'],
      allPages: ['¡PERMISO COMPLETO!', '¡PERMISO COMPLETO! LA PROFE YA NO TE JALA'],
      drawCast(ctx, cx, tick) {
        ctx.drawImage(A3.ALP.foto.idle, cx - 66, 74);
        ctx.drawImage(P.run[Math.floor(tick / 7) % 4], cx - 8, 76);
        ctx.drawImage(OBJ.teacher2, cx + 30, 70);
      },
      rows: (g, narrow, arrival) => [
        [narrow ? 'PERMISO' : 'HOJAS DEL PERMISO', g.pages + ' / 3', '#ffffff'],
        arrival,
        [narrow ? 'FOTOS' : 'FOTOS DE TURISTAS', '' + (g.selfies3 || 0), '#ffd166'],
        ['CAÍDAS', '' + g.deaths, '#f2917d'],
      ],
    },
    level: lv,
  };
})();
