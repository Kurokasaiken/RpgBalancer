import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

/**
 * Village page (2026-11-09): the base is the painting with NO buildings and each
 * building is a fixed lossless layer. Base + every layer, composited the way the
 * page does, must give back the original painting exactly.
 */
const ROOT = resolve(__dirname, '../../..');
const LAYERS = resolve(ROOT, 'public/assets/village/layers');
const PAINTING = resolve(ROOT, 'src/assets/mood/rude-beauty/villaggio.png');

describe('village layers — base + buildings == painting (2026-11-09)', () => {
  it('compositing every layer over the empty base reproduces the painting exactly', async () => {
    const manifest = JSON.parse(await readFile(resolve(LAYERS, 'layers.json'), 'utf8')) as {
      size: [number, number];
      base: string;
      layers: { id: string; file: string; box: [number, number, number, number]; source?: string }[];
    };
    const [W, H] = manifest.size;
    const painting = await sharp(PAINTING).removeAlpha().raw().toBuffer();
    // identity covers the painting's own layers only: `added` buildings are new art on top
    const composites = manifest.layers
      .filter((ly) => ly.source !== 'added')
      .map((ly) => ({ input: resolve(LAYERS, ly.file), left: ly.box[0], top: ly.box[1] }));
    const { data, info } = await sharp(resolve(LAYERS, manifest.base))
      .composite(composites)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([W, H]);
    let worst = 0;
    for (let i = 0; i < painting.length; i += 1) worst = Math.max(worst, Math.abs(painting[i] - data[i]));
    expect(worst).toBe(0);
  });

  it('every layer id is unique and sits inside the painting', async () => {
    const manifest = JSON.parse(await readFile(resolve(LAYERS, 'layers.json'), 'utf8')) as {
      size: [number, number];
      layers: { id: string; box: [number, number, number, number] }[];
    };
    const ids = manifest.layers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of manifest.layers) {
      const [x, y, w, h] = l.box;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(manifest.size[0]);
      expect(y + h).toBeLessThanOrEqual(manifest.size[1]);
    }
  });
});
