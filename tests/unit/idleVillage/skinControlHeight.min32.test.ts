/**
 * Sentinel `geometry:small-target` (run sentinel-2026-10-23T0829, R-270) —
 * every HUD control pill must be at least the 32px interactive minimum.
 *
 * The `data-hud-controls` rule pins every pill to
 * `--skin-hud-control-height` — the token itself was 26px, so every pin,
 * chip and filter control measured below the interactive minimum.
 */
import { describe, it, expect } from 'vitest';
import { BASE_SKIN_CSS_VARS } from '@/ui/idleVillage/skins/skinCssVariables';

describe('skin css variables — HUD control height', () => {
  // INV:skin-css-variables.INV-2 — --skin-hud-control-height ≥ 32px.
  it('the hud control height token meets the 32px interactive minimum', () => {
    const raw = BASE_SKIN_CSS_VARS['--skin-hud-control-height'];
    expect(raw).toBeTruthy();
    expect(parseFloat(raw)).toBeGreaterThanOrEqual(32);
  });
});
