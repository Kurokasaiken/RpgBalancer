/**
 * Procedural seabed for the see-through sea: a sandy floor (far layer) and, on a transparent sheet, drowned
 * ruins, rocks and buried chests (near layer). A stand-in until a painted seabed exists. The floor is light,
 * like sand seen through clear water: the sea above stays partly opaque and tints it, so the reveal reads as
 * "I can see below the surface" instead of "the water went dark".
 */
export interface SeabedGlint {
  /** Position as a fraction of the texture. */
  u: number;
  v: number;
  /** Seconds of the pulse cycle and its phase offset. */
  period: number;
  phase: number;
}

export interface SeabedArt {
  floor: HTMLCanvasElement;
  objects: HTMLCanvasElement;
  glints: SeabedGlint[];
}

/** Small deterministic PRNG so the seabed is the same on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sheet = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d') };
};

export function createSeabedArt(width: number, height: number, seed = 7): SeabedArt {
  const rand = mulberry32(seed);
  const unit = width / 2048;
  const glints: SeabedGlint[] = [];

  // ── Far layer: pale sand with ripples and weed patches ──
  const { canvas: floor, ctx: f } = sheet(width, height);
  if (f) {
    const base = f.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, '#cdbf92');
    base.addColorStop(0.5, '#b9b48d');
    base.addColorStop(1, '#c6b98c');
    f.fillStyle = base;
    f.fillRect(0, 0, width, height);
    for (let i = 0; i < 80; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const r = (50 + rand() * 140) * unit;
      const g = f.createRadialGradient(x, y, 0, x, y, r);
      const weed = rand() > 0.5;
      g.addColorStop(0, weed ? 'rgba(74,120,82,0.45)' : 'rgba(150,132,92,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = g;
      f.fillRect(x - r, y - r, r * 2, r * 2);
    }
    f.lineCap = 'round';
    for (let i = 0; i < 260; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const len = (80 + rand() * 240) * unit;
      f.strokeStyle = `rgba(250,240,205,${(0.18 + rand() * 0.22).toFixed(3)})`;
      f.lineWidth = (1.5 + rand() * 2.5) * unit;
      f.beginPath();
      f.moveTo(x, y);
      f.bezierCurveTo(x + len * 0.3, y - 12 * unit, x + len * 0.7, y + 12 * unit, x + len, y);
      f.stroke();
    }
  }

  // ── Near layer: rocks, drowned ruins, chests (transparent everywhere else) ──
  const { canvas: objects, ctx: o } = sheet(width, height);
  if (o) {
    for (let i = 0; i < 40; i += 1) {
      const x = rand() * width;
      const y = rand() * height;
      const r = (12 + rand() * 28) * unit;
      o.fillStyle = 'rgba(70,78,70,0.75)';
      o.beginPath();
      o.ellipse(x, y, r, r * 0.7, rand() * Math.PI, 0, Math.PI * 2);
      o.fill();
      o.fillStyle = 'rgba(210,214,190,0.35)';
      o.beginPath();
      o.ellipse(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.3, 0, 0, Math.PI * 2);
      o.fill();
    }
    for (let i = 0; i < 9; i += 1) {
      const cx = (0.06 + rand() * 0.88) * width;
      const cy = (0.08 + rand() * 0.84) * height;
      const count = 3 + Math.floor(rand() * 4);
      for (let k = 0; k < count; k += 1) {
        const w = (14 + rand() * 18) * unit;
        const h = (30 + rand() * 60) * unit;
        const x = cx + (k - count / 2) * w * 1.7;
        const y = cy + (rand() - 0.5) * 24 * unit;
        o.fillStyle = 'rgba(232,226,204,0.85)';
        o.fillRect(x, y, w, h);
        o.fillStyle = 'rgba(80,86,78,0.55)';
        o.fillRect(x + w * 0.62, y, w * 0.38, h);
        o.fillStyle = 'rgba(40,60,52,0.35)';
        o.fillRect(x - w * 0.2, y + h, w * 1.4, 6 * unit);
      }
    }
    for (let i = 0; i < 12; i += 1) {
      const x = (0.05 + rand() * 0.9) * width;
      const y = (0.08 + rand() * 0.84) * height;
      const w = (30 + rand() * 12) * unit;
      const h = w * 0.62;
      o.fillStyle = 'rgba(92,56,26,0.95)';
      o.fillRect(x, y, w, h);
      o.fillStyle = 'rgba(232,186,80,0.95)';
      o.fillRect(x, y, w, h * 0.3);
      o.fillRect(x + w * 0.44, y, w * 0.12, h);
      glints.push({ u: (x + w / 2) / width, v: y / height, period: 3 + rand() * 3, phase: rand() * 6 });
    }
  }

  return { floor, objects, glints };
}

/** Tileable smooth noise for the refraction wobble (red = x shift, green = y shift). */
export function createRefractionNoise(size = 256, seed = 11): HTMLCanvasElement {
  const rand = mulberry32(seed);
  const { canvas, ctx } = sheet(size, size);
  if (!ctx) return canvas;
  const image = ctx.createImageData(size, size);
  const waves = Array.from({ length: 6 }, () => ({
    fx: 1 + Math.floor(rand() * 3),
    fy: 1 + Math.floor(rand() * 3),
    phase: rand() * Math.PI * 2,
  }));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0;
      let g = 0;
      waves.forEach((w, i) => {
        const a = ((x * w.fx + y * w.fy) / size) * Math.PI * 2 + w.phase;
        if (i % 2 === 0) r += Math.sin(a);
        else g += Math.cos(a);
      });
      const idx = (y * size + x) * 4;
      image.data[idx] = 128 + (r / 3) * 127;
      image.data[idx + 1] = 128 + (g / 3) * 127;
      image.data[idx + 2] = 128;
      image.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
