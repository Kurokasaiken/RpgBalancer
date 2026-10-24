/**
 * world-surface-clouds — the anime-cut cloud sprites read as stickers over the
 * cartographer-style painting (Director session 2026-10-24: «prova A, se
 * fallisce proviamo B»). Option A harmonizes them in-engine: every sprite gets
 * the `cloudsLook` treatment (opacity scale + CSS filter) from config, while
 * the shadow sprites stay untreated — they are already dark `multiply` marks.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { WorldSurfaceClouds } from '@/ui/idleVillage/components/WorldSurfaceClouds';
import { WorldSurfaceCloudShadows } from '@/ui/idleVillage/components/WorldSurfaceCloudShadows';
import { atmosphereAssets } from '@/ui/idleVillage/config/atmosphereAssets';

const CANVAS = { width: 4240, height: 2828 };

describe('WorldSurfaceClouds harmonization', () => {
  // INV:world-surface-clouds.INV-1 — every cloud sprite is rendered through
  // the harmonization treatment declared in `atmosphereAssets.cloudsLook`
  // (opacity × opacityScale, CSS filter applied).
  it('applies cloudsLook opacityScale and filter to every sprite', () => {
    const { container } = render(
      <WorldSurfaceClouds canvasSize={CANVAS} zIndex={5} />,
    );
    const imgs = container.querySelectorAll<HTMLImageElement>('img.ws-cloud');
    expect(imgs.length).toBeGreaterThan(0);
    // The same sprite file can serve multiple bands, so band lookup by src is
    // ambiguous: assert membership in the set of scaled band opacities instead.
    const expectedOpacities = atmosphereAssets.clouds.map(
      (b) => b.opacity * atmosphereAssets.cloudsLook.opacityScale,
    );
    imgs.forEach((img) => {
      expect(img.style.filter).toBe(atmosphereAssets.cloudsLook.filter);
      expect(
        expectedOpacities.some((o) => Math.abs(Number(img.style.opacity) - o) < 1e-5),
      ).toBe(true);
    });
  });

  // INV:world-surface-clouds.INV-1 — the treatment targets the cloud sprites
  // only: the baked shadow marks keep their authored `shadowOpacity` and no
  // filter, or the sepia/blur would smear dirt across the painting.
  it('leaves cloud shadows untreated', () => {
    const { container } = render(
      <WorldSurfaceCloudShadows canvasSize={CANVAS} zIndex={4} />,
    );
    const imgs = container.querySelectorAll<HTMLImageElement>('img.ws-cloud-shadow');
    expect(imgs.length).toBeGreaterThan(0);
    imgs.forEach((img) => {
      expect(img.style.filter).toBe('');
    });
  });
});
