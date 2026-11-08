// PLAN-112 D10: below the game's mobile-fit breakpoint the blueprint is not used; above it the game's own scale model applies (amend G1 #2).
import { describe, expect, it } from 'vitest';
import { blueprintMode, frameFor, zoomFor } from '@/ui/idleVillage/hudReal/layout/hudLayoutB';
import { getMobileFitConfig } from '@/balancing/config/idleVillage/mobileFitConfig';
import { autoHudScale } from '@/ui/idleVillage/components/gameFrame/hudScale';

describe('blueprint vs mobile-fit and the game zoom', () => {
  it('uses the game mobile-fit breakpoint (768), not a copy of it', () => {
    const bp = getMobileFitConfig().breakpointPx;
    expect(blueprintMode(bp - 1)).toBe('base-fallback');
    expect(blueprintMode(bp)).toBe('blueprint');
    expect(blueprintMode(390)).toBe('base-fallback');
  });
  it('the blueprint zoom is exactly the game one: auto = autoHudScale, 1 up to Full HD, never below 1', () => {
    expect(zoomFor('auto', 1366, 768)).toBe(autoHudScale(1366, 768));
    expect(zoomFor('auto', 1366, 768)).toBe(1);
    expect(zoomFor('auto', 2560, 1440)).toBe(autoHudScale(2560, 1440));
    expect(zoomFor('auto', 2560, 1440)).toBeGreaterThan(1);
    expect(zoomFor(1.5, 1280, 800)).toBe(1.5);
  });
  it('running text is >= 16 real px at zoom 1 on every window at or above the breakpoint (no proportional shrink)', () => {
    for (const [w, h] of [[768, 1024], [1024, 768], [1280, 650], [1366, 768], [1920, 1080]] as Array<[number, number]>) expect(16 * frameFor(w, h, 1).scale, `${w}x${h}`).toBeGreaterThanOrEqual(16);
  });
});
