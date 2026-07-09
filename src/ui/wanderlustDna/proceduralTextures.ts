/**
 * Wanderlust DNA — procedural texture bakery.
 *
 * All textures are baked ONCE on offscreen 2D canvases (never per frame) and
 * then uploaded to WebGL. Deterministic seeded RNG so a given hero always
 * mints the same coin.
 */

/** mulberry32 — tiny deterministic PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  return [canvas, ctx];
}

/**
 * Deep-field constellation plate: the token's *background* parallax layer.
 * Star field + faint nebula + thin gold sight-lines, on abyssal teal.
 */
export function makeConstellationTexture(size = 512, seed = 7): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size);
  const rnd = mulberry32(seed);

  const bg = ctx.createRadialGradient(size * 0.5, size * 0.42, size * 0.05, size * 0.5, size * 0.5, size * 0.75);
  bg.addColorStop(0, '#0a2436');
  bg.addColorStop(0.55, '#051523');
  bg.addColorStop(1, '#020a12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, size, size);

  // Nebula wisps
  for (let i = 0; i < 5; i++) {
    const x = size * (0.2 + rnd() * 0.6);
    const y = size * (0.2 + rnd() * 0.6);
    const r = size * (0.12 + rnd() * 0.2);
    const wisp = ctx.createRadialGradient(x, y, 0, x, y, r);
    const hue = rnd() > 0.5 ? '0, 180, 200' : '30, 120, 160';
    wisp.addColorStop(0, `rgba(${hue}, 0.10)`);
    wisp.addColorStop(1, `rgba(${hue}, 0)`);
    ctx.fillStyle = wisp;
    ctx.fillRect(0, 0, size, size);
  }

  // Stars (kept inside a 10% margin so the 0.05 parallax never reveals a clamped edge)
  const stars: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 46; i++) {
    const x = size * (0.1 + rnd() * 0.8);
    const y = size * (0.1 + rnd() * 0.8);
    const r = 0.6 + rnd() * 1.8;
    stars.push({ x, y });
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    glow.addColorStop(0, 'rgba(200, 235, 255, 0.9)');
    glow.addColorStop(0.35, 'rgba(140, 210, 240, 0.25)');
    glow.addColorStop(1, 'rgba(140, 210, 240, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(235, 248, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Constellation sight-lines in faint gold
  ctx.strokeStyle = 'rgba(223, 184, 87, 0.22)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 9; i++) {
    const a = stars[Math.floor(rnd() * stars.length)];
    const b = stars[Math.floor(rnd() * stars.length)];
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  return canvas;
}

/**
 * Hooded-bust hero silhouette (alpha layer): the token's *front* parallax
 * layer. Stylized placeholder — swap with a masked portrait asset later.
 */
export function makePortraitTexture(size = 512, seed = 11): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(size, size);
  const rnd = mulberry32(seed);
  const cx = size / 2;

  // Cloaked shoulders
  const bodyTop = size * 0.58;
  const body = ctx.createLinearGradient(0, bodyTop, 0, size);
  body.addColorStop(0, '#2a2016');
  body.addColorStop(1, '#0c0805');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(size * 0.12, size);
  ctx.bezierCurveTo(size * 0.16, bodyTop, size * 0.36, size * 0.55, cx, size * 0.55);
  ctx.bezierCurveTo(size * 0.64, size * 0.55, size * 0.84, bodyTop, size * 0.88, size);
  ctx.closePath();
  ctx.fill();

  // Hood shell behind the head
  ctx.fillStyle = '#1b140c';
  ctx.beginPath();
  ctx.ellipse(cx, size * 0.42, size * 0.21, size * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headR = size * 0.145;
  const headY = size * 0.42;
  const head = ctx.createRadialGradient(cx - headR * 0.4, headY - headR * 0.4, headR * 0.15, cx, headY, headR);
  head.addColorStop(0, '#4c3a24');
  head.addColorStop(1, '#171008');
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.arc(cx, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Gold rim-light along the left profile (renaissance key light)
  ctx.strokeStyle = 'rgba(223, 184, 87, 0.65)';
  ctx.lineWidth = size * 0.012;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, headY, headR * 0.96, Math.PI * 0.62, Math.PI * 1.28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.94);
  ctx.bezierCurveTo(size * 0.22, size * 0.7, size * 0.34, size * 0.6, size * 0.42, size * 0.585);
  ctx.stroke();

  // Two faint eye glints, jittered per seed
  ctx.fillStyle = 'rgba(0, 229, 255, 0.55)';
  const eyeY = headY + headR * (0.02 + rnd() * 0.06);
  ctx.beginPath();
  ctx.arc(cx - headR * 0.34, eyeY, size * 0.008, 0, Math.PI * 2);
  ctx.arc(cx + headR * 0.34, eyeY, size * 0.008, 0, Math.PI * 2);
  ctx.fill();

  return canvas;
}

/**
 * Painterly scene backdrop — used both as the stage CSS background AND as the
 * lens shader's refraction source, so what the glass bends is exactly what
 * sits behind it.
 */
export function makeSceneTexture(w = 1280, h = 800, seed = 3): HTMLCanvasElement {
  const [canvas, ctx] = makeCanvas(w, h);
  const rnd = mulberry32(seed);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#16211a');
  bg.addColorStop(0.5, '#101a1c');
  bg.addColorStop(1, '#1a150e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Layered oil strokes: olive / rust / teal arcs of varying weight
  const palette = [
    'rgba(86, 108, 70, 0.16)',
    'rgba(140, 84, 40, 0.14)',
    'rgba(38, 96, 100, 0.15)',
    'rgba(180, 140, 70, 0.08)',
    'rgba(20, 40, 46, 0.2)',
  ];
  for (let i = 0; i < 150; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 30 + rnd() * 160;
    const start = rnd() * Math.PI * 2;
    ctx.strokeStyle = palette[Math.floor(rnd() * palette.length)];
    ctx.lineWidth = 6 + rnd() * 26;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y, r, start, start + 0.6 + rnd() * 1.4);
    ctx.stroke();
  }

  // Vignette
  const vin = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.72);
  vin.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vin.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
  ctx.fillStyle = vin;
  ctx.fillRect(0, 0, w, h);

  return canvas;
}
