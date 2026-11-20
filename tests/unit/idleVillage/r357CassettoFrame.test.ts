/**
 * R-357 / PLAN-125 — cassetto frame residues baked out of the `-extracted` art.
 * The bake (scripts/build-cassetto-extracted.mjs, step 6 `cleanup`) removes
 * the stray rules/arrow/dot the stretch left in the wells and the translucent
 * glow with a hard edge above the top-left corner. Pixels are read from the
 * shipped asset, so a re-bake that drops the cleanup fails here.
 */
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { join } from 'node:path';

const ASSET = (k: string) => join(process.cwd(), 'public/assets/ui/hud-real/cassetto', `column-${k}-extracted.webp`);
const lumAt = (d: Buffer, w: number, ch: number, x: number, y: number) => d[(y * w + x) * ch] + d[(y * w + x) * ch + 1] + d[(y * w + x) * ch + 2];

describe('R-357 cassetto frame cleanup', () => {
  /* the baked-art residue tests (stray rules/arrow/dot, top-left haze) were retired with the baked column art (DOM drawer). */
  // INV:cassetto-cta-tips-intact — R-357 (Director 2026-11-18, error made twice): the CTA button is a standalone generated
  // piece (refs/button-launch-gemini.png): both arrow tips (left AND right) must survive in the baked asset.
  it('CTA button asset keeps BOTH arrow tips, symmetric, with a transparent ground', async () => {
    const { data, info } = await sharp(join(process.cwd(), 'public/assets/ui/hud-real/cassetto3/cta-plaque.webp')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h, channels: ch } = info;
    const opaqueIn = (x0: number, x1: number, y0: number, y1: number) => {
      let n = 0;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (data[(y * w + x) * ch + 3] > 160) n++;
      return n;
    };
    const mid = Math.round(h * 0.5), band = Math.round(h * 0.12), edge = Math.round(w * 0.04);
    const left = opaqueIn(0, edge, mid - band, mid + band), right = opaqueIn(w - edge, w, mid - band, mid + band);
    expect(left, 'left tip spike at the leftmost 4%').toBeGreaterThan(20);
    expect(right, 'right tip spike at the rightmost 4%').toBeGreaterThan(20);
    expect(Math.abs(left - right) / Math.max(left, right), 'tips are symmetric').toBeLessThan(0.5);
    expect(data[3], 'top-left corner is transparent').toBeLessThan(10);
    expect(data[((h - 1) * w + (w - 1)) * ch + 3], 'bottom-right corner is transparent').toBeLessThan(10);
  });
});
