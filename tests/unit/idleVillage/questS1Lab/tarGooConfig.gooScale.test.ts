/**
 * R-241 jank (tar goo): the goo SDF layer renders below full board
 * resolution by default — config-first (`rendering.gooScale`).
 *
 * Live profiling (dev AND production preview): the WebGL2 SDF raster +
 * `drawImage` composite was the dominant frame cost — p95 rAF gaps
 * 66–116ms during goo-expand/risk-pour, identical in prod so not a
 * dev-mode artifact. Half-res raster upscaled by drawImage is visually
 * identical for soft-edge tar and cuts shader cost ~4×.
 */

import { describe, expect, it } from 'vitest';
import { tarGooConfig, tarGooConfigSchema } from '@/balancing/config/idleVillage/tarGooConfig';

describe('tarGooConfig — rendering.gooScale (R-241 jank)', () => {
  // INV:R-241-goo-raster-scale — the default raster scale is below full
  // board resolution so the SDF shader + composite sync stop stalling
  // astrolabe frames.
  it('defaults below full resolution', () => {
    expect(tarGooConfig.rendering.gooScale).toBeLessThan(1);
    expect(tarGooConfig.rendering.gooScale).toBeGreaterThanOrEqual(0.25);
  });

  // INV:R-241-goo-raster-scale — schema bounds: never above 1 (no
  // supersampling) and never below 0.25 (the layer would go blurry).
  it('schema clamps gooScale to [0.25, 1]', () => {
    expect(
      tarGooConfigSchema.safeParse({
        ...tarGooConfig,
        rendering: { gooScale: 1.5 },
      }).success,
    ).toBe(false);
    expect(
      tarGooConfigSchema.safeParse({
        ...tarGooConfig,
        rendering: { gooScale: 0.1 },
      }).success,
    ).toBe(false);
    expect(
      tarGooConfigSchema.safeParse({
        ...tarGooConfig,
        rendering: { gooScale: 1 },
      }).success,
    ).toBe(true);
  });
});
