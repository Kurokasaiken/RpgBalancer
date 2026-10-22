/**
 * PLAN-067 T-B4 (R-234, PL-3 = A) — the warehouse trigger in the planner is a 36px icon with the HUD
 * tooltip «Warehouse · V» (name + engraved shortcut), not a 26px pill with a native `title`.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { QuestExpeditionDetail } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const renderDetail = () => render(
  <Tooltip.Provider delayDuration={0}>
    <DndContext>
      <QuestExpeditionDetail
        poi={questPoiById('poi-goblin')!}
        scenario={GOBLIN_SCENARIO}
        resolved={null}
        resolvePending={false}
        slots={[]}
        estimate="computing"
        forecastDelta={null}
        intelHints={[]}
        expeditionDuration={{ nodeTicks: 50, estimatedTicks: 250, factor: 1 }}
        requiredFilled={false}
        items={[]}
        selectedItemIds={[]}
        onToggleItem={() => {}}
        onOpenStash={() => {}}
        canSend={false}
        onSend={() => {}}
        onClose={() => {}}
        onSlotClear={() => {}}
      />
    </DndContext>
  </Tooltip.Provider>,
);


describe('planner warehouse trigger (R-234, PL-3 = A)', () => {
  // INV:R-234-planner-stash-icon — 36px icon button, no native title, the HUD tooltip names it
  // and shows its shortcut key.
  it('is a 36px icon with the HUD tooltip and no native title', () => {
    renderDetail();
    const btn = screen.getByTestId('quest-open-stash');
    expect(btn.style.width).toBe('36px');
    expect(btn.style.height).toBe('36px');
    expect(btn.hasAttribute('title')).toBe(false);
    expect(btn).toHaveAttribute('aria-label', 'gameFrame.village.openStash');
    fireEvent.focus(btn);
    const tip = document.querySelector('[data-hud-tooltip]')!;
    expect(tip.textContent).toContain('gameFrame.village.openStash');
    expect(tip.querySelector('kbd')!.textContent).toBe('V');
  }, 30000);
});
