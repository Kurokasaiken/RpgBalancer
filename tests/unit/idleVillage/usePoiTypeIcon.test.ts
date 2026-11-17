/**
 * usePoiTypeIcon — POI family glyphs (PLAN-117 family): each family's painted
 * centre glyph lives at a stable authored path; absent files fall back to the
 * cross inside the hook.
 */
import { describe, expect, it } from 'vitest';
import { poiTypeIconUrl } from '@/ui/idleVillage/components/gameFrame/usePoiTypeIcon';

describe('usePoiTypeIcon — glyph url contract', () => {
  // INV:use-poi-type-icon.INV-1 — the painted glyph path is
  // `/assets/ui/poi/icon_<type>.webp` for every POI family.
  it('maps every family to its painted glyph path', () => {
    for (const type of ['quest', 'job', 'event'] as const) {
      expect(poiTypeIconUrl(type)).toBe(`/assets/ui/poi/icon_${type}.webp`);
    }
  });
});
