import { describe, it, expect } from 'vitest';
import { autoHudScale, parseHudScaleMode, resolveHudScale, HUD_SCALE_MAX, HUD_SCALE_MIN } from '@/ui/idleVillage/components/gameFrame/hudScale';

describe('interface size (PLAN-058)', () => {
  it('stays at 1 up to full HD and for small windows', () => {
    expect(autoHudScale(1280, 720)).toBe(1);
    expect(autoHudScale(1440, 900)).toBe(1);
    expect(autoHudScale(1920, 1080)).toBe(1);
  });

  it('grows with the window beyond full HD, in steps of 0.05', () => {
    expect(autoHudScale(2560, 1440)).toBe(1.3); // 1.333 → 1.30
    expect(autoHudScale(3840, 2160)).toBe(2);
    expect(autoHudScale(2400, 1350)).toBe(1.25);
  });

  it('is limited by the smaller side, so an ultrawide window does not over-scale', () => {
    expect(autoHudScale(3440, 1440)).toBe(1.3); // height decides
  });

  // INV:hud-scale.INV-1
  it('never leaves the allowed range and survives bad input', () => {
    expect(autoHudScale(7680, 4320)).toBe(HUD_SCALE_MAX);
    expect(autoHudScale(0, 0)).toBe(HUD_SCALE_MIN);
    expect(autoHudScale(Number.NaN, 1080)).toBe(HUD_SCALE_MIN);
  });

  it('a fixed mode ignores the window size', () => {
    expect(resolveHudScale(1.5, 1280, 720)).toBe(1.5);
    expect(resolveHudScale('auto', 3840, 2160)).toBe(2);
  });

  it('parses stored values and falls back to auto', () => {
    expect(parseHudScaleMode(1.25)).toBe(1.25);
    expect(parseHudScaleMode('auto')).toBe('auto');
    expect(parseHudScaleMode(3)).toBe('auto');
    expect(parseHudScaleMode(null)).toBe('auto');
    expect(parseHudScaleMode('1.5')).toBe('auto');
  });
});
