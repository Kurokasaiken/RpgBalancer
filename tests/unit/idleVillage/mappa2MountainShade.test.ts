import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

/**
 * Director 2026-11-02 («lo voglio solo sulle montagne grigiastre»): the northern-mountain
 * grade must live on the grey alpine rock only. The alpine biome id also labels the massif's
 * warm foothills — painted ochre-brown — and the multiply sheet + clarity plate used to cover
 * them, turning the brown rock maroon. `build-mappa2-mountain-shade.py` now gates the bake on
 * warm Lab pixels, and `fx/mountain-clarity.webp`'s alpha is gated the same way. The warm-brown
 * foothill strip east of the massif must stay untouched on both sheets while the grey massif
 * keeps the grade.
 */
const BASE = resolve(__dirname, '../../../public/assets/world/mappa2/base');

/** Warm-brown foothill strip (map canvas px): inside biome "alpine" but painted ochre-brown. */
const FOOTHILL_BOX = { x0: 1700, y0: 280, x1: 1840, y1: 580 };
/** Grey massif core — the shade's actual target. */
const MASSIF_BOX = { x0: 1000, y0: 80, x1: 1500, y1: 400 };

async function raw(file: string) {
  const { data, info } = await sharp(resolve(BASE, file)).raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, c: info.channels };
}

/** Paints-warm-brown mask from `layers/base_flat.webp` (the canvas the sheets apply to). */
async function warmBrownMask(): Promise<Uint8Array> {
  const { data, w, h, c } = await raw('layers/base_flat.webp');
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < mask.length; i += 1) {
    const r = data[i * c];
    const g = data[i * c + 1];
    const b = data[i * c + 2];
    if (r > b + 25 && r > g + 15) mask[i] = 1;
  }
  return mask;
}

const boxIdx = (box: typeof FOOTHILL_BOX, w: number) => {
  const out: number[] = [];
  for (let y = box.y0; y < box.y1; y += 1) for (let x = box.x0; x < box.x1; x += 1) out.push(y * w + x);
  return out;
};

describe('mappa2 mountain shade — grey rock only', () => {
  it('leaves the warm-brown foothills untouched (multiply sheet stays white there)', async () => {
    const [{ data, c }, warm] = await Promise.all([raw('fx/mountain-shade.webp'), warmBrownMask()]);
    let n = 0;
    let sum = 0;
    let bright = 0;
    for (const i of boxIdx(FOOTHILL_BOX, 2752)) {
      if (!warm[i]) continue;
      const lum = (data[i * c] + data[i * c + 1] + data[i * c + 2]) / (3 * 255);
      n += 1;
      sum += lum;
      if (lum >= 0.9) bright += 1;
    }
    expect(n).toBeGreaterThan(10000);
    expect(sum / n).toBeGreaterThan(0.9);
    expect(bright / n).toBeGreaterThan(0.75);
  });

  it('still darkens the grey massif (the sheet was not just whitened)', async () => {
    const { data, c } = await raw('fx/mountain-shade.webp');
    let n = 0;
    let sum = 0;
    for (const i of boxIdx(MASSIF_BOX, 2752)) {
      sum += (data[i * c] + data[i * c + 1] + data[i * c + 2]) / (3 * 255);
      n += 1;
    }
    expect(sum / n).toBeLessThan(0.9);
  });

  it('gates the clarity plate alpha on the warm-brown foothills', async () => {
    const [{ data, c }, warm] = await Promise.all([raw('fx/mountain-clarity.webp'), warmBrownMask()]);
    expect(c).toBe(4);
    let n = 0;
    let sum = 0;
    let covered = 0;
    for (const i of boxIdx(FOOTHILL_BOX, 2752)) {
      if (!warm[i]) continue;
      const a = data[i * c + 3] / 255;
      n += 1;
      sum += a;
      if (a > 0.2) covered += 1;
    }
    expect(n).toBeGreaterThan(10000);
    expect(sum / n).toBeLessThan(0.15);
    expect(covered / n).toBeLessThan(0.2);
  });
});
