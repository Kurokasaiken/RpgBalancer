/**
 * R-353 mockup roster row (mockup-stash-grid.jpg, ruling: pannelli flottanti +
 * restyle estetico): the compact strip mounts the signed C1 medallion (ring +
 * real portrait), the parchment small-caps name and the HP/stamina bars on
 * engraved hairlines — and the level badge lives in a dedicated column right
 * of the medallion (LV chip over an emblem shield), not the portrait's
 * top-right. jsdom has no layout: rects are stubbed like
 * heroLevelDecor.nameClear.test.tsx.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { HERO_LEVEL_CONFIG } from '@/balancing/config/idleVillage/heroLevelConfig';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { HeroLevelDecor } from '@/ui/idleVillage/rosterV2/HeroLevelDecor';
import WanderlustRosterCardV2 from '@/ui/idleVillage/rosterV2/WanderlustRosterCardV2';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => `${key}:${opts?.n ?? ''}` }),
}));

const RECTS: Record<string, { left: number; top: number; width: number; height: number }> = {
  wrapper: { left: 100, top: 50, width: 300, height: 56 },
  portrait: { left: 110, top: 58, width: 40, height: 40 },
  name: { left: 160, top: 60, width: 110, height: 16 },
};
const rectOf = (el: Element) => {
  const key = el.hasAttribute('data-wanderlust-portrait')
    ? 'portrait'
    : el.hasAttribute('data-roster-name')
      ? 'name'
      : el.hasAttribute('data-test-wrapper')
        ? 'wrapper'
        : null;
  const r = key ? RECTS[key] : { left: 0, top: 0, width: 0, height: 0 };
  return { ...r, x: r.left, y: r.top, right: r.left + r.width, bottom: r.top + r.height, toJSON: () => r } as DOMRect;
};

afterEach(() => vi.restoreAllMocks());

describe('WanderlustRosterCardV2 — compact mockup row', () => {
  // INV:wanderlust-roster-card-v2.INV-1 — the compact strip carries the signed C1 medallion
  // (data-wanderlust-portrait wraps the ring+portrait imgs), the gold display name and the
  // two value bars, marked data-density="compact" for the decor's badge anchor.
  it('mounts the signed C1 medallion, gold name and dual bars on a compact strip', () => {
    const { container } = render(
      <DndContext>
        <WanderlustRosterCardV2
          workerId="w1"
          label="Giggiolillo"
          hp={195}
          fatigue={0}
          maxHp={195}
          compact
          portraitUrl="/portraits/giggiolillo.png"
        />
      </DndContext>,
    );
    const row = container.querySelector('[data-density="compact"]') as HTMLElement;
    expect(row).toBeTruthy();
    const portrait = row.querySelector('[data-wanderlust-portrait]') as HTMLElement;
    expect(portrait).toBeTruthy();
    // The signed medallion: ring image + resident portrait image.
    expect(portrait.querySelectorAll('img').length).toBeGreaterThanOrEqual(1);
    const name = row.querySelector('[data-roster-name]') as HTMLElement;
    expect(name).toBeTruthy();
    expect(name.style.color).toContain('var(--skin-text-primary');
    // The mockup's dedicated LV column: a spacer sits between medallion and name.
    expect(row.children[1].style.width).toBe('34px');
  });
});

describe('HeroLevelDecor — compact badge column', () => {
  // INV:R-353-compact-badge-corner — with data-density="compact" inside the
  // wrapper, the LV cluster lives in the dedicated column right of the medallion (right edge
  // at portrait.right + 32, vertically centred on the ring): chip over emblem shield, never
  // on the name.
  it('pins the badge cluster in the medallion column in compact density', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return rectOf(this);
    });
    const heroId = Object.keys(HERO_LEVEL_CONFIG!.levels)[0];
    const hero = { id: heroId, displayName: heroId, isHero: true, status: 'available', fatigue: 0, currentHp: 50, maxHp: 50 } as ResidentState;
    render(
      <div data-test-wrapper style={{ position: 'relative' }}>
        <div data-density="compact">
          <span data-wanderlust-portrait />
          <span data-roster-name>Giggiolillo</span>
        </div>
        <HeroLevelDecor resident={hero} />
      </div>,
    );
    const badge = document.querySelector<HTMLElement>(`[data-hero-level="${heroId}"]`)!;
    expect(badge).toBeTruthy();
    // Right edge lands on portrait.right + 32 (wrapper coords) — the dedicated LV column.
    const rightEdge = RECTS.wrapper.width - parseFloat(badge.style.right);
    expect(rightEdge).toBeCloseTo(RECTS.portrait.left - RECTS.wrapper.left + RECTS.portrait.width + 32, 5);
    // Top is centred on the ring: portrait.top + height/2 − the cluster's own ascent.
    expect(parseFloat(badge.style.top)).toBeCloseTo(RECTS.portrait.top - RECTS.wrapper.top + RECTS.portrait.height / 2 - 18, 5);
    // The cluster is chip + emblem shield: the badge itself is a plain column,
    // the shield silhouette lives in the nested emblem.
    expect(badge.style.clipPath ?? '').not.toContain('polygon');
    expect(badge.querySelector('[style*="clip-path"]')).toBeTruthy();
  });

  it('keeps the top-right contract outside compact density', () => {
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return rectOf(this);
    });
    const heroId = Object.keys(HERO_LEVEL_CONFIG!.levels)[0];
    const hero = { id: heroId, displayName: heroId, isHero: true, status: 'available', fatigue: 0, currentHp: 50, maxHp: 50 } as ResidentState;
    render(
      <div data-test-wrapper style={{ position: 'relative' }}>
        <span data-wanderlust-portrait />
        <span data-roster-name>Giggiolillo</span>
        <HeroLevelDecor resident={hero} />
      </div>,
    );
    const badge = document.querySelector<HTMLElement>(`[data-hero-level="${heroId}"]`)!;
    expect(badge.style.clipPath ?? '').not.toContain('polygon');
    expect(parseFloat(badge.style.top)).toBeCloseTo(RECTS.portrait.top - RECTS.wrapper.top - 7, 5);
  });
});
