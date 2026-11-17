/**
 * hudTones — shared HUD signal colours (PLAN-112 blueprint): skin tokens
 * first, V9 literals as fallbacks — the pattern every HUD cluster reuses.
 */
import { describe, expect, it } from 'vitest';
import { HUD_TONE_COLOR, type HudTone } from '@/ui/idleVillage/components/gameFrame/hudTones';

describe('hudTones — shared signal colours', () => {
  // INV:hud-tones.INV-1 — every tone resolves a `--skin-*` token first with a
  // literal fallback inside var() — never a hardcoded colour alone — and the
  // tone set is exactly danger / warning / neutral / good.
  it('resolves every tone to a --skin token with a fallback inside var()', () => {
    const tones: HudTone[] = ['danger', 'warning', 'neutral', 'good'];
    expect(Object.keys(HUD_TONE_COLOR).sort()).toEqual(tones.slice().sort());
    for (const tone of tones) {
      expect(HUD_TONE_COLOR[tone]).toMatch(/^var\(--skin-/);
      expect(HUD_TONE_COLOR[tone]).toMatch(/#[0-9a-f]{6}\)/);
    }
  });
});
