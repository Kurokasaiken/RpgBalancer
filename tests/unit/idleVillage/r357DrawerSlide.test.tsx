/**
 * R-357 / PLAN-125 — the expedition drawer slides in from / out to the right edge.
 * Motion is skipped under reduced-motion (and where matchMedia says so, e.g. jsdom default).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { ExpeditionDrawer } from '@/ui/idleVillage/components/gameFrame/ExpeditionDrawer';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, o?: Record<string, unknown>) => (o ? `${k}:${Object.values(o).join('|')}` : k) }),
}));
vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({ ResidentSlotRack: () => <div data-testid="resident-slot-rack-stub" /> }));

const QUEST: CassettoQuest = { title: 'T', briefing: 'b', legs: [{ label: 'Outbound', days: 1 }], riskLabel: 'High', rewards: [{ icon: 'gold', qty: '1' }] };
const mountDrawer = () => render(
  <TooltipProvider><DndContext><DragProvider><div style={{ position: 'relative', width: 1440, height: 900 }}>
    <ExpeditionDrawer quest={QUEST} slots={[]} />
  </div></DragProvider></DndContext></TooltipProvider>,
);
const mockMotion = (noPreference: boolean) => {
  const real = window.matchMedia;
  window.matchMedia = ((q: string) => ({
    matches: q.includes('prefers-reduced-motion: no-preference') ? noPreference : q.includes('min-width') ? true : false,
    media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  return () => { window.matchMedia = real; };
};

describe('R-357 drawer lateral slide', () => {
  let restore: () => void = () => {};
  afterEach(() => { restore(); });

  // INV:cassetto-slide-lateral — slide-in on mount; the chip-fold choreography (slide-out + chip swap)
  // is REMOVED (Director 2026-11-22 «eliminala», seal of OB-7 γ «il cassetto resta chiuso senza tab»).
  it('enters with the slide-in keyframe and mounts NO fold chips', () => {
    restore = mockMotion(true);
    mountDrawer();
    const slide = screen.getByTestId('expedition-drawer-slide');
    expect(slide.style.animation).toContain('cassettoSlideIn');
    expect(slide.style.animation).toContain(`${CASSETTO_LAYOUT_CONFIG.drawer.slideMs}ms`);
    expect(screen.queryByTestId('expedition-drawer-collapse')).toBeNull();
    expect(screen.queryByTestId('expedition-drawer-expand')).toBeNull();
  });

  it('under reduced motion there is no animation', () => {
    restore = mockMotion(false);
    mountDrawer();
    expect(screen.getByTestId('expedition-drawer-slide').style.animation).toBe('');
  });
});
