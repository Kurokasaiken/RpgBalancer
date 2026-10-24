/**
 * Sentinel `geometry:small-target` (run sentinel-2026-10-23T0829, S0/S1,
 * R-270) — the invasion CTA is scaled by `cardScale` to fit the world
 * surface; at ~0.875 it measured 31.5px, below the 32px minimum. The
 * unscaled min-height must compensate: ceil(32/cardScale).
 */
import { describe, it, expect } from 'vitest';
import { ctaActionMinHeightPx } from '@/ui/idleVillage/components/WorldSurfaceEventCard';

describe('WorldSurfaceEventCard — CTA hit area after cardScale', () => {
  // INV:world-surface-event-card.INV-2 — scaled CTA height never < 32px.
  it('compensates the action min-height for the card scale', () => {
    /* The observed sentinel cell: 36px CTA × 0.875 → 31.5px (flagged). */
    const mh = ctaActionMinHeightPx(0.875);
    expect(mh * 0.875).toBeGreaterThanOrEqual(32);
    /* Unscaled (scale 1): never raises above the css 36px baseline. */
    expect(ctaActionMinHeightPx(1)).toBeLessThanOrEqual(36);
    /* Deep scales still satisfy the minimum. */
    expect(ctaActionMinHeightPx(0.5) * 0.5).toBeGreaterThanOrEqual(32);
  });
});
