/**
 * PLAN-067 T-A14 (R-234) — HUD controls explain themselves with the HUD's own tooltip, not the
 * browser's `title` (late, OS-styled, absent from every capture, shortcut as plain «[Space]»).
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HudTooltip } from '@/ui/idleVillage/components/gameFrame/HudTooltip';
import { WhenWhereCluster } from '@/ui/idleVillage/components/gameFrame/WhenWhereCluster';
import { GameFrame } from '@/ui/idleVillage/components/gameFrame/GameFrame';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, o?: { defaultValue?: string }) => o?.defaultValue ?? key }) }));

describe('HudTooltip', () => {
  it('opens on keyboard focus with name, shortcut key cap and hint', async () => {
    render(
      <HudTooltip label="Pause" shortcut="Space" hint="Stops the clock">
        <button type="button">go</button>
      </HudTooltip>,
    );
    await act(async () => { screen.getByRole('button').focus(); });
    const tip = await screen.findByRole('tooltip');
    expect(tip).toHaveTextContent('Pause');
    expect(tip).toHaveTextContent('Stops the clock');
    expect(document.querySelector('[data-hud-tooltip] kbd')?.textContent).toBe('Space');
  });

  it('a wrapped trigger opens even when the control is disabled', async () => {
    render(
      <HudTooltip label="Workshop" hint="Not yet" wrap>
        <button type="button" disabled>w</button>
      </HudTooltip>,
    );
    await userEvent.hover(screen.getByRole('button').parentElement!);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Not yet');
  });
});

describe('HUD controls carry no native title (R-234)', () => {
  // INV:R-234-hud-no-native-title — the speed controls, the nav and the corner buttons name themselves
  // through HudTooltip: none of them keeps a browser `title`.
  it('speed controls, nav and corner buttons have no title attribute', () => {
    const speed = { multiplier: 1, available: [1, 2, 4], onChange: () => {}, onTogglePause: () => {} };
    const { container } = render(
      <GameFrame
        title="T"
        navItems={DEFAULT_GAME_FRAME_CONFIG.navItems}
        activeNavId={DEFAULT_GAME_FRAME_CONFIG.navItems[0].id}
        whenWhereSlot={<WhenWhereCluster isDayPhase cycleProgress={0.3} isPaused={false} currentDay={1} placeName="R" speed={speed} />}
        resourcesSlot={<div />}
        utilitySlot={null}
        config={DEFAULT_GAME_FRAME_CONFIG}
      >
        <div />
      </GameFrame>,
    );
    const titled = [...container.querySelectorAll('button[title], [role="radio"][title], [role="group"][title]')].map((e) => e.getAttribute('title'));
    expect({ titled }).toEqual({ titled: [] });
  });
});
