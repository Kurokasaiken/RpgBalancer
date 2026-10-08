/**
 * Procedural seabed for the translucent-sea parallax: sand ripples, dark rock patches, a few drowned
 * ruins and buried chests. A stand-in until a painted seabed exists, so it stays soft and low-contrast:
 * the sea paints over it and only a fraction shows through.
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
  canvas: HTMLCanvasElement;
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

export function createSeabedArt(width: number, height: number, seed = 7): SeabedArt {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const rand = mulberry32(seed);
  const glints: SeabedGlint[] = [];
  if (!ctx) return { canvas, glints };
  const unit = width / 2048;

  const base = ctx.createLinearGradient(0, 0, 0, height);
  base.addColorStop(0, '#0d2f3c');
  base.addColorStop(0.5, '#123f48');
  base.addColorStop(1, '#0c2c36');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);

  // Rock and weed patches: broad dark and mossy blobs.
  for (let i = 0; i < 70; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const r = (40 + rand() * 120) * unit;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const mossy = rand() > 0.55;
    g.addColorStop(0, mossy ? 'rgba(40,92,70,0.5)' : 'rgba(4,16,22,0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Sand ripples: long wavering strokes, lighter than the floor.
  ctx.lineCap = 'round';
  for (let i = 0; i < 220; i += 1) {
    const x = rand() * width;
    const y = rand() * height;
    const len = (80 + rand() * 260) * unit;
    ctx.strokeStyle = `rgba(214,200,150,${(0.05 + rand() * 0.09).toFixed(3)})`;
    ctx.lineWidth = (1.5 + rand() * 3) * unit;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + len * 0.3, y - 14 * unit, x + len * 0.7, y + 14 * unit, x + len, y);
    ctx.stroke();
  }

  // Drowned ruins: broken pale columns and wall stubs in small groups.
  for (let i = 0; i < 9; i += 1) {
    const cx = (0.06 + rand() * 0.88) * width;
    const cy = (0.08 + rand() * 0.84) * height;
    const count = 3 + Math.floor(rand() * 4);
    for (let k = 0; k < count; k += 1) {
      const w = (14 + rand() * 18) * unit;
      const h = (30 + rand() * 60) * unit;
      const x = cx + (k - count / 2) * w * 1.7;
      const y = cy + (rand() - 0.5) * 24 * unit;
      ctx.fillStyle = 'rgba(150,178,170,0.30)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x + w * 0.6, y, w * 0.4, h);
      ctx.fillStyle = 'rgba(190,214,200,0.30)';
      ctx.fillRect(x, y, w, 4 * unit);
    }
  }

  // Buried chests: a small dark box with a gold lid, and a glint that will pulse above it.
  for (let i = 0; i < 12; i += 1) {
    const x = (0.05 + rand() * 0.9) * width;
    const y = (0.08 + rand() * 0.84) * height;
    const w = (30 + rand() * 12) * unit;
    const h = w * 0.62;
    ctx.fillStyle = 'rgba(46,28,14,0.8)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = 'rgba(214,170,70,0.75)';
    ctx.fillRect(x, y, w, h * 0.3);
    ctx.fillRect(x + w * 0.44, y, w * 0.12, h);
    glints.push({ u: (x + w / 2) / width, v: y / height, period: 3 + rand() * 3, phase: rand() * 6 });
  }

  return { canvas, glints };
}
