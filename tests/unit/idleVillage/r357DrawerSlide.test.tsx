/**
 * R-357 / PLAN-125 — the expedition drawer slides in from / out to the right edge.
 * Motion is skipped under reduced-motion (and where matchMedia says so, e.g. jsdom default).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider as TooltipProvider } from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { DragProvider } from '@/ui/idleVillage/components/DragContext';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { ExpeditionDrawer } from '@/ui/idleVillage/components/gameFrame/ExpeditionDrawer';
import { useExpeditionDrawer } from '@/ui/idleVillage/store/useExpeditionDrawer';
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
  beforeEach(() => { useExpeditionDrawer.setState({ expanded: true }); vi.useFakeTimers(); });
  afterEach(() => { restore(); vi.useRealTimers(); });

  // INV:cassetto-slide-lateral
  it('enters with the slide-in keyframe and leaves with slide-out, folding only after slideMs', () => {
    restore = mockMotion(true);
    mountDrawer();
    const slide = screen.getByTestId('expedition-drawer-slide');
    expect(slide.style.animation).toContain('cassettoSlideIn');
    expect(slide.style.animation).toContain(`${CASSETTO_LAYOUT_CONFIG.drawer.slideMs}ms`);
    fireEvent.click(screen.getByTestId('expedition-drawer-collapse'));
    expect(screen.getByTestId('expedition-drawer-slide')).toHaveAttribute('data-leaving');
    expect(screen.getByTestId('expedition-drawer-slide').style.animation).toContain('cassettoSlideOut');
    expect(useExpeditionDrawer.getState().expanded).toBe(true);           // still open while it slides
    act(() => { vi.advanceTimersByTime(CASSETTO_LAYOUT_CONFIG.drawer.slideMs + 5); });
    expect(useExpeditionDrawer.getState().expanded).toBe(false);          // folded after the slide
    expect(screen.getByTestId('expedition-drawer-expand')).toBeInTheDocument();
  });

  it('under reduced motion there is no animation and the fold is immediate', () => {
    restore = mockMotion(false);
    mountDrawer();
    expect(screen.getByTestId('expedition-drawer-slide').style.animation).toBe('');
    fireEvent.click(screen.getByTestId('expedition-drawer-collapse'));
    expect(useExpeditionDrawer.getState().expanded).toBe(false);
  });
});
