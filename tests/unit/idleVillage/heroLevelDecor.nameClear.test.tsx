/**
 * PLAN-067 T-A6 (R-234) — the hero level badge never covers the name. It hung
 * off the portrait's top-right corner growing rightwards (`left: portrait.right
 * − 6`): in the roster's dense strip (22 px portrait) «Lv 3» landed on the first
 * letters of the name (audit F3 §6.3). The badge now grows LEFTWARDS from that
 * corner and its right edge stops before the name (`[data-roster-name]`).
 * jsdom has no layout: the rects are stubbed; the live witness is the harness
 * lens (L1 = 0 in the roster at 1440 and 1280).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HERO_LEVEL_CONFIG } from '@/balancing/config/idleVillage/heroLevelConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { HeroLevelDecor } from '@/ui/idleVillage/rosterV2/HeroLevelDecor';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => `${key}:${opts?.n ?? ''}` }),
}));

const RECTS: Record<string, { left: number; top: number; width: number; height: number }> = {
  wrapper: { left: 100, top: 50, width: 300, height: 30 },
  portrait: { left: 108, top: 54, width: 22, height: 22 },
  name: { left: 136, top: 56, width: 90, height: 16 },
};
const rectOf = (el: Element) => {
  const key = el.hasAttribute('data-wanderlust-portrait') ? 'portrait' : el.hasAttribute('data-roster-name') ? 'name' : el.hasAttribute('data-test-wrapper') ? 'wrapper' : null;
  const r = key ? RECTS[key] : { left: 0, top: 0, width: 0, height: 0 };
  return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => r } as DOMRect;
};

afterEach(() => vi.restoreAllMocks());

describe('HeroLevelDecor — badge clear of the name', () => {
  // INV:R-234-level-badge-clear-of-name — the level badge's right edge never passes the name's
  // left edge (minus a 2 px gap): it may cover the portrait, never a letter of the name.
  it('anchors the badge by its right edge, stopping before the name (R-234)', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return rectOf(this);
    });
    const heroId = Object.keys(HERO_LEVEL_CONFIG!.levels)[0];
    const hero = { id: heroId, displayName: heroId, isHero: true, status: 'available', fatigue: 0, currentHp: 50, maxHp: 50 } as ResidentState;
    render(
      <div data-test-wrapper style={{ position: 'relative' }}>
        <div data-wanderlust-portrait />
        <span data-roster-name>Sir Spaccaculi</span>
        <HeroLevelDecor resident={hero} />
      </div>,
    );
    const badge = document.querySelector<HTMLElement>(`[data-hero-level="${heroId}"]`)!;
    expect(badge).toBeTruthy();
    expect(badge.style.right).not.toBe('');
    const rightEdge = RECTS.wrapper.width - parseFloat(badge.style.right); // wrapper-relative
    const nameLeft = RECTS.name.left - RECTS.wrapper.left;
    expect(rightEdge).toBeLessThanOrEqual(nameLeft - 2);
  });
});
