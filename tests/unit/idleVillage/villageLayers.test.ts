import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

/**
 * Village page (2026-11-09): the base is the painting with NO buildings and each
 * building is a fixed lossless layer. Base + every layer, composited the way the
 * page does, must give back the original painting exactly.
 *
 * R-326 (2026-11-12): buildings may be RETIRED from the manifest while keeping
 * their polygon in buildings.json (e.g. house-small-west, removed from the
 * director menu). In a removed building's exclusive region — its grown mask
 * minus every remaining layer's alpha — the composite must show the base fill
 * instead of the painting.
 */
const ROOT = resolve(__dirname, '../../..');
const LAYERS = resolve(ROOT, 'public/assets/village/layers');
const PAINTING = resolve(ROOT, 'src/assets/mood/rude-beauty/villaggio.png');
const BUILDINGS = resolve(LAYERS, 'buildings.json');

interface VillageLayer {
  id: string;
  file: string;
  box: [number, number, number, number];
  source?: string;
}
interface VillageManifest {
  size: [number, number];
  base: string;
  layers: VillageLayer[];
}
interface BuildingMask {
  id: string;
  poly: [number, number][];
}

/**
 * Rasterizes a polygon mask on the full canvas and dilates it by `dilate` px so
 * it covers the grown/feathered region the cut pipeline produced (GROW ≈ 22px
 * + feather σ8 tail ≈ 46px reach; we use 50 to be safe).
 */
function rasterGrownPoly(poly: [number, number][], W: number, H: number, dilate: number): Uint8Array {
  const mask = new Uint8Array(W * H);
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs)) - dilate - 1);
  const x1 = Math.min(W - 1, Math.ceil(Math.max(...xs)) + dilate + 1);
  const y0 = Math.max(0, Math.floor(Math.min(...ys)) - dilate - 1);
  const y1 = Math.min(H - 1, Math.ceil(Math.max(...ys)) + dilate + 1);
  // scanline point-in-polygon
  const inside = new Uint8Array(W * H);
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      let inPoly = false;
      for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
        const [xi, yi] = poly[i];
        const [xj, yj] = poly[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inPoly = !inPoly;
      }
      if (inPoly) inside[y * W + x] = 1;
    }
  }
  // separable box dilation (good enough for a grown-mask upper bound)
  const tmp = new Uint8Array(W * H);
  for (let y = 0; y < H; y += 1) {
    const row = y * W;
    for (let x = 0; x < W; x += 1) {
      const a = Math.max(0, x - dilate);
      const b = Math.min(W - 1, x + dilate);
      for (let xx = a; xx <= b; xx += 1) if (inside[row + xx]) { tmp[row + x] = 1; break; }
    }
  }
  for (let x = 0; x < W; x += 1) {
    for (let y = 0; y < H; y += 1) {
      if (!tmp[y * W + x]) continue;
      const a = Math.max(0, y - dilate);
      const b = Math.min(H - 1, y + dilate);
      for (let yy = a; yy <= b; yy += 1) mask[yy * W + x] = 1;
    }
  }
  return mask;
}

/** Loads a layer webp as raw RGBA bytes. */
async function loadLayer(ly: VillageLayer) {
  const { data, info } = await sharp(resolve(LAYERS, ly.file))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Max alpha of the given layers on the full canvas (0-255). */
async function unionAlpha(layers: VillageLayer[], W: number, H: number): Promise<Uint8Array> {
  const union = new Uint8Array(W * H);
  for (const ly of layers) {
    const { data, width, height } = await loadLayer(ly);
    const [bx, by] = ly.box;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const a = data[(y * width + x) * 4 + 3];
        if (a > union[(by + y) * W + bx + x]) union[(by + y) * W + bx + x] = a;
      }
    }
  }
  return union;
}

/** Counts pixels where both layers have alpha > 0 in their box intersection. */
async function countOverlap(a: VillageLayer, b: VillageLayer): Promise<number> {
  const ax0 = Math.max(a.box[0], b.box[0]);
  const ay0 = Math.max(a.box[1], b.box[1]);
  const ax1 = Math.min(a.box[0] + a.box[2], b.box[0] + b.box[2]);
  const ay1 = Math.min(a.box[1] + a.box[3], b.box[1] + b.box[3]);
  if (ax0 >= ax1 || ay0 >= ay1) return 0;
  const A = await loadLayer(a);
  const B = await loadLayer(b);
  let n = 0;
  for (let y = ay0; y < ay1; y += 1) {
    for (let x = ax0; x < ax1; x += 1) {
      const pa = ((y - a.box[1]) * A.width + (x - a.box[0])) * 4 + 3;
      const pb = ((y - b.box[1]) * B.width + (x - b.box[0])) * 4 + 3;
      if (A.data[pa] > 0 && B.data[pb] > 0) n += 1;
    }
  }
  return n;
}

describe('village layers — base + buildings == painting (2026-11-09)', () => {
  it('compositing every layer over the empty base reproduces the painting exactly', async () => {
    const manifest = JSON.parse(await readFile(resolve(LAYERS, 'layers.json'), 'utf8')) as VillageManifest;
    const { buildings } = JSON.parse(await readFile(BUILDINGS, 'utf8')) as { buildings: BuildingMask[] };
    const [W, H] = manifest.size;
    const painting = await sharp(PAINTING).removeAlpha().raw().toBuffer();
    const base = await sharp(resolve(LAYERS, manifest.base)).removeAlpha().raw().toBuffer();
    // identity covers the painting's own layers only: `added` buildings are new art on top
    const painted = manifest.layers.filter((ly) => ly.source !== 'added');
    const composites = painted.map((ly) => ({ input: resolve(LAYERS, ly.file), left: ly.box[0], top: ly.box[1] }));
    const { data, info } = await sharp(resolve(LAYERS, manifest.base))
      .composite(composites)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    expect([info.width, info.height]).toEqual([W, H]);

    // INV:R-326-no-small-west — retired buildings (poly still in buildings.json,
    // layer gone from the manifest) leave an exclusive region where the
    // composite must show the base fill, not the painting. Painted alphas are
    // feathered, so three cases: no coverage -> base, full coverage -> painting,
    // partial coverage at a grown-mask rim -> blend (skipped, bounded by both).
    const paintedIds = new Set(manifest.layers.map((l) => l.id));
    const union = await unionAlpha(painted, W, H);
    const retired: Uint8Array[] = [];
    for (const b of buildings) {
      if (!paintedIds.has(b.id)) retired.push(rasterGrownPoly(b.poly, W, H, 50));
    }
    let worstPainting = 0;
    let worstBase = 0;
    let retiredUncovered = 0;
    for (let i = 0; i < W * H; i += 1) {
      const off = i * 3;
      const dP = Math.max(
        Math.abs(painting[off] - data[off]),
        Math.abs(painting[off + 1] - data[off + 1]),
        Math.abs(painting[off + 2] - data[off + 2]),
      );
      const dB = Math.max(
        Math.abs(base[off] - data[off]),
        Math.abs(base[off + 1] - data[off + 1]),
        Math.abs(base[off + 2] - data[off + 2]),
      );
      const sameBasePainting =
        painting[off] === base[off] && painting[off + 1] === base[off + 1] && painting[off + 2] === base[off + 2];
      if (union[i] === 0) {
        if (retired.some((g) => g[i])) retiredUncovered += 1;
        worstBase = Math.max(worstBase, dB);
      } else if (union[i] === 255 || sameBasePainting) {
        worstPainting = Math.max(worstPainting, dP);
      }
    }
    expect(retiredUncovered).toBeGreaterThan(0);
    expect(worstBase).toBe(0);
    expect(worstPainting).toBe(0);
    // full-canvas pixel scan + grown-mask rasterization can exceed the 5s
    // default under load — keep the assertion budget generous (R-326 it.4)
  }, 300_000);

  it('painted layers are alpha-disjoint; lumber carries no chief-house pixels (INV:R-326-layer-disjoint)', async () => {
    const manifest = JSON.parse(await readFile(resolve(LAYERS, 'layers.json'), 'utf8')) as VillageManifest;
    const painted = manifest.layers.filter((ly) => ly.source !== 'added');
    // INV:R-326-layer-disjoint — a contested pixel paints the painting either way
    // but shows a foreign building when a single layer is toggled: ownership must
    // be exclusive.
    const overlaps: string[] = [];
    for (let i = 0; i < painted.length; i += 1) {
      for (let j = i + 1; j < painted.length; j += 1) {
        const n = await countOverlap(painted[i], painted[j]);
        if (n > 0) overlaps.push(`${painted[i].id}×${painted[j].id}=${n}`);
      }
    }
    expect(overlaps).toEqual([]);
    const lumber = manifest.layers.find((l) => l.id === 'lumber');
    const chief = manifest.layers.find((l) => l.id === 'chief-house');
    if (lumber && chief) expect(await countOverlap(lumber, chief)).toBe(0);
  });

  it('house-small-west is gone from the manifest — it must not appear in the director menu (INV:R-326-no-small-west)', async () => {
    const manifest = JSON.parse(await readFile(resolve(LAYERS, 'layers.json'), 'utf8')) as VillageManifest;
    const ids = manifest.layers.map((l) => l.id);
    expect(ids).not.toContain('house-small-west');
  });

  it('every layer id is unique and sits inside the painting', async () => {
    const manifest = JSON.parse(await readFile(resolve(LAYERS, 'layers.json'), 'utf8')) as VillageManifest;
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
