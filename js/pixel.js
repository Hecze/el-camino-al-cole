// pixel.js — motor de sprites de pixel art.
// Convierte "mapas de píxeles" (arrays de strings + paleta) en canvas listos
// para dibujar. Nada de dibujo procedural: cada píxel está descrito a mano.

const PIX = (() => {
  function createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, w | 0);
    c.height = Math.max(1, h | 0);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return c;
  }

  // rows: array de strings del mismo alto. keys: { 'K':'#000', '.':null }
  function fromRows(rows, keys) {
    const h = rows.length;
    let w = 0;
    for (const r of rows) if (r.length > w) w = r.length;
    const c = createCanvas(w, h);
    const ctx = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        const col = keys[ch];
        if (col == null) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // Matriz NxN de índices a paleta-array
  function fromIndexGrid(grid, palette) {
    const h = grid.length, w = grid[0].length;
    const c = createCanvas(w, h);
    const ctx = c.getContext('2d');
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = grid[y][x];
        if (i < 0 || palette[i] == null) continue;
        ctx.fillStyle = palette[i];
        ctx.fillRect(x, y, 1, 1);
      }
    return c;
  }

  function flipped(canvas) {
    const c = createCanvas(canvas.width, canvas.height);
    const ctx = c.getContext('2d');
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(canvas, 0, 0);
    return c;
  }

  // Silueta (para flash de daño / sombras): repinta con un color.
  function tinted(canvas, color) {
    const c = createCanvas(canvas.width, canvas.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }

  // Escala un sprite por factor entero (para fondos/variantes rápidas).
  function scaled(canvas, factor) {
    const c = createCanvas(canvas.width * factor, canvas.height * factor);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, c.width, c.height);
    return c;
  }

  // Sprite con sombra suave debajo (helper de composición).
  function withEllipseShadow(canvas, col = 'rgba(0,0,0,0.25)') {
    const pad = 2;
    const c = createCanvas(canvas.width, canvas.height + pad);
    const ctx = c.getContext('2d');
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height + pad - 1, canvas.width / 2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(canvas, 0, 0);
    return c;
  }

  return { createCanvas, fromRows, fromIndexGrid, flipped, tinted, scaled, withEllipseShadow };
})();
