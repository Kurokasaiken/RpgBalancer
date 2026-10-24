/**
 * INV:quest-expedition-detail.INV-3 — stash-uniformity (R-270, Director
 * ruling): the planner tray and bag slots render the shared stash
 * item-face — `StashItemTile` + corner `StashQtyBadge` — the same grammar
 * the village shelf uses.
 */
import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as Tooltip from '@radix-ui/react-tooltip';
import { DndContext } from '@dnd-kit/core';
import { QuestExpeditionDetail } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import type { BagStockEntry } from '@/ui/idleVillage/quests/questExpedition';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'qty' in opts ? `${key}:${opts.qty}` : key,
  }),
}));

const ITEMS: BagStockEntry[] = VILLAGE_STASH_CONFIG.items.map((row) => ({
  item: defaultQuestItems[row.itemId],
  qty: row.qty,
}));

const Harness: React.FC = () => {
  const [sel, setSel] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSel((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < QUEST_STASH.bagSlots ? [...c, id] : c));
  return (
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
          items={ITEMS}
          selectedItemIds={sel}
          onToggleItem={toggle}
          onOpenStash={() => undefined}
          canSend={false}
          onSend={() => {}}
          onClose={() => {}}
          onSlotClear={() => {}}
        />
      </DndContext>
    </Tooltip.Provider>
  );
};

// INV:quest-expedition-detail.INV-3 — tray picker e bag slot usano il
// vocabolario item-face condiviso (stashItemFace): tile + badge ×N.
describe('quest planner — shared stash item-face (quest-expedition-detail.INV-3)', () => {
  it('every tray picker tile carries the shared corner ×N badge', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('bag-slot-0').querySelector('button')!);
    expect(screen.getByTestId('quest-selection-tray')).toBeInTheDocument();
    for (const { itemId, qty } of VILLAGE_STASH_CONFIG.items) {
      const tile = screen.getByTestId(`picker-item-${itemId}`);
      expect(within(tile).getByTestId('stash-qty-badge'), `${itemId} badge`).toHaveTextContent(`×${qty}`);
    }
  });

  it('a packed bag slot renders the shared item tile', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('bag-slot-0').querySelector('button')!);
    fireEvent.click(screen.getByTestId(`picker-item-${VILLAGE_STASH_CONFIG.items[0].itemId}`));
    const slot = screen.getByTestId('bag-slot-0');
    expect(within(slot).getByTestId('stash-item-tile')).toBeInTheDocument();
  });
});
