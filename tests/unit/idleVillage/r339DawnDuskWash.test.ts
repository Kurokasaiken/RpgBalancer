/**
 * R-339 — dawn/dusk amber (`ambient.warm`) must reach the /game map even while
 * the baked night plates own the darkening. Before the fix, `PixiWorldMap`'s
 * wash early-returned whenever `nightLight` was set, so `warm` was dead code.
 * `washGradeFor` is the pure contract the tick now calls every frame.
 */
import { describe, expect, it } from 'vitest';
import { ambientForPhase, DAYLIGHT, washGradeFor } from '@/ui/idleVillage/config/timeOfDay';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

const TOD = DEFAULT_GAME_FRAME_CONFIG.timeOfDay.map;
const rgb = (tint: number) => ({ r: (tint >> 16) & 255, g: (tint >> 8) & 255, b: tint & 255 });

describe('washGradeFor (R-339 — dawn/dusk warm on /game)', () => {
  it('hides the wash in plain daylight, with or without plates', () => {
    expect(washGradeFor({ light: 1, warm: 0 }, false).visible).toBe(false);
    expect(washGradeFor({ light: 1, warm: 0 }, true).visible).toBe(false);
  });

  it('keeps the wash for amber dusk even when the night plates own the dark', () => {
    const g = washGradeFor({ light: 0.7, warm: 1 }, true);
    expect(g.visible).toBe(true);
    const { r, g: gg, b } = rgb(g.tint);
    // amber multiply: red nearly full, blue clearly reduced — warm, not cool
    expect(r).toBeGreaterThan(240);
    expect(b).toBeLessThan(220);
    expect(r).toBeGreaterThan(b);
  });

  it('night without plates keeps the cool dark wash (legacy path unchanged)', () => {
    const g = washGradeFor({ light: 0.35, warm: 0 }, false);
    expect(g.visible).toBe(true);
    const { r, b } = rgb(g.tint);
    expect(r).toBeLessThan(b); // cool blue-grey, as before
    expect(r).toBeGreaterThan(180); // gentle night, not black
  });

  it('night with plates hides the wash — the plates own the darkening', () => {
    expect(washGradeFor({ light: 0.35, warm: 0 }, true).visible).toBe(false);
  });

  it('warm below the floor hides the wash even with plates', () => {
    expect(washGradeFor({ light: 0.7, warm: 0.004 }, true).visible).toBe(false);
  });

  it('the config curve produces a warm dusk and a warm dawn that reach the map', () => {
    const dusk = ambientForPhase(TOD, true, 0.85); // deep into the day phase
    const dawn = ambientForPhase(TOD, false, 0.92); // late night phase
    expect(washGradeFor(dusk, true).visible).toBe(true);
    expect(washGradeFor(dawn, true).visible).toBe(true);
    const dr = rgb(washGradeFor(dusk, true).tint);
    const dw = rgb(washGradeFor(dawn, true).tint);
    expect(dr.r).toBeGreaterThan(dr.b);
    expect(dw.r).toBeGreaterThan(dw.b);
  });

  it('full daylight mid-cycle yields no grade (feed stays quiet)', () => {
    const noon = ambientForPhase(TOD, true, 0.2);
    expect(washGradeFor(noon, true).visible).toBe(false);
    expect(washGradeFor(noon, false).visible).toBe(false);
  });

  it('DAYLIGHT constant means no wash on either path', () => {
    expect(washGradeFor(DAYLIGHT, true).visible).toBe(false);
    expect(washGradeFor(DAYLIGHT, false).visible).toBe(false);
  });
});
