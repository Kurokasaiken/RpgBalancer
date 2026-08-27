/**
 * V6.2 tar goo — config contract + WebGL2 fallback behavior (R-032).
 *
 * The renderer must degrade gracefully: in environments without WebGL2
 * (jsdom, or a WebView with GL disabled) `createTarGooRenderer` returns null
 * and the engine keeps the V6 flat Canvas-2D drawing.
 */
import { describe, it, expect } from 'vitest';
import { tarGooConfig } from '@/balancing/config/idleVillage/tarGooConfig';
import { createTarGooRenderer } from '@/ui/idleVillage/components/destinyAstrolabeV62/tarGooRenderer';

describe('tarGooConfig', () => {
  it('exposes a validated viscous-tar parameter set', () => {
    // Tar reads as tar when damping is high and speed is capped low.
    expect(tarGooConfig.simulation.damping).toBeGreaterThanOrEqual(0.85);
    expect(tarGooConfig.simulation.damping).toBeLessThan(1);
    expect(tarGooConfig.simulation.stiffness).toBeLessThanOrEqual(0.06);
    expect(tarGooConfig.simulation.rimSamples).toBeGreaterThanOrEqual(16);
  });

  it('keeps the albedo near-black but never pure black', () => {
    const [r, g, b] = tarGooConfig.material.albedo;
    expect(r + g + b).toBeGreaterThan(0);
    expect(Math.max(r, g, b)).toBeLessThan(0.1);
  });

  it('keeps droplets small and near the rim so obelisks stay legible', () => {
    const [, max] = tarGooConfig.simulation.dropletRadius;
    expect(max).toBeLessThanOrEqual(30);
    expect(tarGooConfig.simulation.dropletOvershoot).toBeLessThanOrEqual(40);
  });
});

describe('createTarGooRenderer', () => {
  it('returns null when WebGL2 is unavailable (engine falls back to flat goo)', () => {
    // jsdom has no WebGL2 context — this asserts the graceful degradation path.
    const renderer = createTarGooRenderer(800, tarGooConfig);
    expect(renderer).toBeNull();
  });
});
