/**
 * PLAN-067 T-A14 (R-234) — keyboard order follows the screen: top bar, then the
 * navigation at the bottom, then the corner utilities. The bottom-right block
 * (Panels, Hide HUD) was earlier in the DOM than the bottom-centre nav, so Tab
 * jumped to the corner before reaching Village/Map (measured on the live HUD,
 * audit F3 HUD §5).
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { GameFrame } from '@/ui/idleVillage/components/gameFrame/GameFrame';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, o?: { defaultValue?: string }) => o?.defaultValue ?? key }) }));

describe('GameFrame — Tab order (R-234)', () => {
  // INV:R-234-tab-order-visual — the bottom navigation precedes the bottom-right utilities in the DOM.
  it('reaches the navigation before the bottom-right utilities', () => {
    const { container } = render(
      <GameFrame
        title="T"
        navItems={DEFAULT_GAME_FRAME_CONFIG.navItems.filter((n) => !n.locked).slice(0, 2)}
        activeNavId={DEFAULT_GAME_FRAME_CONFIG.navItems[0].id}
        whenWhereSlot={<div />}
        resourcesSlot={<div />}
        utilitySlot={<button type="button" data-testid="utility-btn">Panels</button>}
        config={DEFAULT_GAME_FRAME_CONFIG}
      >
        <div />
      </GameFrame>,
    );
    const nav = container.querySelector('[data-nav-id]')!;
    const utility = container.querySelector('[data-testid="utility-btn"]')!;
    expect(nav).toBeTruthy();
    expect(utility).toBeTruthy();
    expect(nav.compareDocumentPosition(utility) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
