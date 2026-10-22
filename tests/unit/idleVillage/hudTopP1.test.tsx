/**
 * PLAN-067 HUD-3 = P1 (R-234) — the top HUD: three detached tabs (time · what's next · resources),
 * the day/night medallion where MENU used to be, and the menu as an icon in the bottom-right corner
 * (Esc opens it too). The centre tab tells what and when, shrinks when calm and disappears when
 * there is nothing to say — never an empty frame.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { nextEventModel } from '@/ui/idleVillage/components/gameFrame/nextEvent';
import { NextEventTab } from '@/ui/idleVillage/components/gameFrame/NextEventTab';
import { GameFrame } from '@/ui/idleVillage/components/gameFrame/GameFrame';
import { HudGameMenu } from '@/ui/idleVillage/components/gameFrame/HudGameMenu';
import { HUD_PANELS, type HudPanelId } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, o?: Record<string, unknown>) => (o && 'days' in o ? `${key}:${o.days}` : key) }),
}));
vi.mock('@/hooks/useLocalization', () => ({ useLocalization: () => ({ locale: 'en', setLocale: vi.fn() }) }));

const ev = (id: string, typeId: string, daysLeft: number, extra: Record<string, unknown> = {}) => ({ id, typeId, title: `T-${id}`, daysLeft, ...extra });

describe('nextEventModel (R-234, HUD-3)', () => {
  // INV:R-234-hud-next-states — alarm / quiet / none, decided by threat type and days.
  it('is none when nothing is within ten days, and ignores announcements still travelling', () => {
    expect(nextEventModel([]).state).toBe('none');
    expect(nextEventModel([ev('a', 'harvest', 12)]).state).toBe('none');
    expect(nextEventModel([ev('a', 'threat', 1, { arriving: true })]).state).toBe('none');
  });
  it('is alarm only for a threat within five days — anything else, however soon, is quiet', () => {
    expect(nextEventModel([ev('a', 'threat', 5)]).state).toBe('alarm');
    expect(nextEventModel([ev('a', 'visit', 1)]).state).toBe('quiet');
    expect(nextEventModel([ev('a', 'threat', 6)]).state).toBe('quiet');
  });
  it('is quiet for the nearest event within ten days, picking the nearest first', () => {
    const m = nextEventModel([ev('far', 'harvest', 9), ev('near', 'visit', 4)]);
    expect(m.state).toBe('quiet');
    expect(m.event?.id).toBe('near');
  });
});

describe('NextEventTab (R-234, HUD-3)', () => {
  const wrap = (ui: React.ReactElement) => render(<Tooltip.Provider>{ui}</Tooltip.Provider>);
  it('renders nothing when there is nothing to say', () => {
    const { container } = wrap(<NextEventTab events={[]} onSelect={() => {}} />);
    expect(container.querySelector('[data-testid="hud-next-tab"]')).toBeNull();
  });
  it('shows what and when, and selects on click', () => {
    const onSelect = vi.fn();
    wrap(<NextEventTab events={[ev('g', 'threat', 3)]} onSelect={onSelect} />);
    const tab = screen.getByTestId('hud-next-tab');
    expect(tab).toHaveAttribute('data-state', 'alarm');
    expect(tab.textContent).toContain('T-g');
    fireEvent.click(tab);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'g' }));
  });
});

describe('GameFrame top row (R-234, HUD-3)', () => {
  const frame = () => render(
    <GameFrame
      title="T"
      navItems={DEFAULT_GAME_FRAME_CONFIG.navItems.slice(0, 2)}
      activeNavId={DEFAULT_GAME_FRAME_CONFIG.navItems[0].id}
      whenWhereSlot={<div data-testid="when" />}
      nextSlot={<div data-testid="next" />}
      resourcesSlot={<div data-testid="res" />}
      menuSlot={<button type="button" data-testid="menu-btn">menu</button>}
      utilitySlot={<button type="button" data-testid="util-btn">panels</button>}
      config={DEFAULT_GAME_FRAME_CONFIG}
    ><div /></GameFrame>,
  );
  // INV:R-234-hud-top-p1 — time · next · resources left to right; the menu lives in the corner cluster.
  it('orders time, next and resources, and moves the menu to the bottom-right cluster', () => {
    frame();
    const when = screen.getByTestId('when'), next = screen.getByTestId('next'), res = screen.getByTestId('res');
    expect(when.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(next.compareDocumentPosition(res) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const menu = screen.getByTestId('menu-btn');
    expect(res.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(menu.closest('[data-hud-corner]')).not.toBeNull();
    expect(screen.getByTestId('util-btn').closest('[data-hud-corner]')).toBe(menu.closest('[data-hud-corner]'));
  });
});

describe('HudGameMenu trigger (R-234, HUD-3)', () => {
  const visible = Object.fromEntries(HUD_PANELS.map((p) => [p.id, p.defaultVisible])) as Record<HudPanelId, boolean>;
  // INV:R-234-hud-menu-icon — the menu trigger is an icon (no visible text) and Esc opens it.
  it('is an icon without visible text, and Esc opens the menu', () => {
    render(<Tooltip.Provider><HudGameMenu visible={visible} onTogglePanel={vi.fn()} /></Tooltip.Provider>);
    const btn = screen.getByRole('button', { name: 'gameFrame.menu.title' });
    expect(btn.textContent?.trim()).toBe('');
    expect(screen.queryByRole('menu')).toBeNull();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
