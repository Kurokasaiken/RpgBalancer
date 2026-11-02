import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

/**
 * R-299 (2026-11-02): the coast surf shader read the snow tips of the northern peaks — which rise
 * straight out of the sea — as painted foam, "cleaned" them into teal water blobs and grew
 * run-up on them; it also lapped the inland lake shores. Every surf mechanism is now multiplied
 * by `masks/surf_zones.webp` (alpha), built by `build-mappa2-assets.py --only-surf-zones`.
 * The mask must stay closed over the alpine biome and the real lakes, and open over the
 * west-rim arch bay the surf exists for.
 */
const BASE = resolve(__dirname, '../../../public/assets/world/mappa2/base');
const ROOT = resolve(__dirname, '../../..');

async function channel(file: string, c: number) {
  const { data, info } = await sharp(resolve(BASE, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = new Uint8Array(info.width * info.height);
  for (let i = 0; i < out.length; i += 1) out[i] = data[i * info.channels + c];
  return { px: out, w: info.width, h: info.height };
}

/** Pixels of the 8-connected components of `mask` with at least `minArea` pixels. */
function bigComponents(mask: Uint8Array, w: number, h: number, minArea: number): number[] {
  const seen = new Uint8Array(mask.length);
  const kept: number[] = [];
  for (let s = 0; s < mask.length; s += 1) {
    if (!mask[s] || seen[s]) continue;
    const comp = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k += 1) {
      const x = comp[k] % w;
      const y = (comp[k] - x) / w;
      for (let dy = -1; dy <= 1; dy += 1)
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const n = ny * w + nx;
          if (mask[n] && !seen[n]) { seen[n] = 1; comp.push(n); }
        }
    }
    if (comp.length >= minArea) kept.push(...comp);
  }
  return kept;
}

describe('mappa2 surf zones (R-299)', () => {
  it('keeps the surf off every alpine pixel (the snow peaks)', async () => {
    const zones = await channel('masks/surf_zones.webp', 3);
    const biomes = await channel('biome_ids.png', 0);
    const alpine = JSON.parse(readFileSync(resolve(BASE, 'biomes.json'), 'utf-8')).biomes.find(
      (b: { id: string }) => b.id === 'alpine',
    ).index as number;
    let leaks = 0;
    for (let i = 0; i < zones.px.length; i += 1) if (biomes.px[i] === alpine && zones.px[i] > 0) leaks += 1;
    expect(leaks).toBe(0);
  });

  it('keeps the surf off the inland lakes', async () => {
    const zones = await channel('masks/surf_zones.webp', 3);
    const water = await channel('masks/internal_water_mask.webp', 3);
    const lakes = bigComponents(water.px.map((v) => (v > 127 ? 1 : 0)), water.w, water.h, 500);
    expect(lakes.length).toBeGreaterThan(50_000);
    expect(lakes.filter((i) => zones.px[i] > 0)).toHaveLength(0);
  });

  it('leaves the painted surf of the arch bay fully open', async () => {
    const zones = await channel('masks/surf_zones.webp', 3);
    const foam = await channel('masks/foam_clean.webp', 3);
    let painted = 0;
    let open = 0;
    for (let y = 340; y < 800; y += 1)
      for (let x = 0; x < 640; x += 1) {
        const i = y * zones.w + x;
        if (foam.px[i] < 8) continue;
        painted += 1;
        if (zones.px[i] > 200) open += 1;
      }
    expect(painted).toBeGreaterThan(5_000);
    expect(open / painted).toBeGreaterThan(0.98);
  });

  it('gates the coast foam shader with the zone mask', () => {
    const src = readFileSync(resolve(ROOT, 'src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx'), 'utf-8');
    expect(src).toContain("'surf_zones.webp'");
    expect(src).toContain('outColor = vec4(premult, aSurf + aFlow) * zone;');
  });
});

/**
 * R-299 (2026-11-02, «macchie di sporco»): every beach showed cyan blobs in a dark rim. Two causes:
 * the clean plate filled the foam footprint with a blurred average of deep water (blue streak on the
 * turquoise shallows), and the shader weighted Pixi's premultiplied textures by alpha a second time
 * (dark rim). The plate is now inpainted from its neighbours; the shader works in straight colour.
 */
describe('mappa2 foam clean plate (R-299)', () => {
  it('continues the painting at the plate edge instead of plating a different colour', async () => {
    const plate = await sharp(resolve(BASE, 'masks/foam_clean.webp')).ensureAlpha().raw().toBuffer();
    const base = await sharp(resolve(BASE, 'layers/base_flat.webp')).ensureAlpha().raw().toBuffer();
    let n = 0;
    let err = 0;
    for (let i = 0; i < plate.length; i += 4) {
      const a = plate[i + 3];
      if (a <= 20 || a >= 120 || Math.min(base[i], base[i + 1], base[i + 2]) >= 168) continue;
      err += (Math.abs(plate[i] - base[i]) + Math.abs(plate[i + 1] - base[i + 1]) + Math.abs(plate[i + 2] - base[i + 2])) / 3;
      n += 1;
    }
    expect(n).toBeGreaterThan(10_000);
    expect(err / n).toBeLessThan(12); // was 36.5 with the deep-water blur
  });

  it('ships the painted strokes as thin strokes, not the plate footprint', async () => {
    // Animating the footprint turned each few-px painted surf line into a white sausage (2026-11-02).
    const strokes = await channel('masks/foam_strokes.webp', 3);
    const plate = await channel('masks/foam_clean.webp', 3);
    let solid = 0;
    let footprint = 0;
    for (let i = 0; i < plate.px.length; i += 1) {
      if (plate.px[i] > 8) footprint += 1;
      if (strokes.px[i] > 200) solid += 1;
      if (strokes.px[i] > 0) expect(plate.px[i]).toBeGreaterThan(8);
    }
    expect(solid).toBeGreaterThan(1_000);
    expect(solid / footprint).toBeLessThan(0.1); // 0.05 now; the hand-baked footprint file was ~0.2
  });

  it('never weights a premultiplied texture by its alpha twice', () => {
    const src = readFileSync(resolve(ROOT, 'src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx'), 'utf-8');
    expect(src).toContain('vec3 clRgb = cl.rgb / max(cl.a, 1e-4);');
    expect(src).toContain('vec3 premult = surfCol + flowed * aFlow;');
    expect(src).not.toContain('s1.rgb * s1.a * w1');
  });

  it('lets the surf replacing the painted foam reach full coverage (no strength cap)', () => {
    // The plate hides 100% of the painted surf; capped at strength*2 (0.68 in the lab) its replacement
    // could only ever be a grey-blue veil of the painting's white (2026-11-02).
    const src = readFileSync(resolve(ROOT, 'src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx'), 'utf-8');
    expect(src).toContain('    foamA = cl.a * cov;');
    expect(src).not.toContain('cov * min(1.0, uStrength * 2.0)');
  });

  it('draws the surf as wave events in sets, not as a permanent coat', () => {
    const src = readFileSync(resolve(ROOT, 'src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx'), 'utf-8');
    expect(src).toContain('float waveAmp(float idx, float seg)');
    expect(src).toContain('float residual = aImp * (tSince < 1.0 ? 1.0 : exp(-(tSince - 1.0) / 1.8));');
  });
});
