/**
 * questExpeditionBag.test.tsx — PLAN-036 (R-195) bag-zone contract:
 * exactly `QUEST_STASH.bagSlots` visible slots, a page-owned Stash action,
 * and slot-anchored access to the Selection Tray (PLAN-043 WS-3, replaces the retired
 * `quest-bag-external-picker` popover — see ws3 testid migration list):
 * icon-only `picker-item-*` tiles with stock badge + rich tooltip,
 * `loadout-item-*` strictly unique (a filled slot's inner button, never a
 * picker tile), Escape/click-outside close the tray only and focus
 * returns to the originating bag slot.
 */
import { describe, expect, it, vi } from 'vitest';
import React, { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

/** Same source join the session performs — village shelf → catalog. */
const ITEMS: BagStockEntry[] = VILLAGE_STASH_CONFIG.items.map((row) => ({
  item: defaultQuestItems[row.itemId],
  qty: row.qty,
}));

const Harness: React.FC<{ onOpenStash?: (trigger: HTMLButtonElement) => void }> = ({ onOpenStash = () => undefined }) => {
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
          onOpenStash={onOpenStash}
          canSend={false}
          onSend={() => {}}
          onClose={() => {}}
          onSlotClear={() => {}}
        />
      </DndContext>
    </Tooltip.Provider>
  );
};

describe('bag zone — Stash action + slot-anchored WS-3 Selection Tray', () => {
  it('renders exactly bagSlots slots plus the Village Stash action, picker closed', () => {
    render(<Harness />);
    for (let i = 0; i < QUEST_STASH.bagSlots; i++) {
      expect(screen.getByTestId(`bag-slot-${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId(`bag-slot-${QUEST_STASH.bagSlots}`)).toBeNull();
    expect(screen.getByTestId('quest-open-stash')).toBeInTheDocument();
    expect(screen.queryByTestId('quest-tray-toggle')).toBeNull();
    expect(screen.queryByTestId('quest-selection-tray')).toBeNull();
  });

  it('bag action opens the page-owned Stash without opening the item picker', () => {
    const onOpenStash = vi.fn();
    render(<Harness onOpenStash={onOpenStash} />);
    fireEvent.click(screen.getByTestId('quest-open-stash'));
    expect(onOpenStash).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    expect(screen.queryByTestId('quest-selection-tray')).toBeNull();
  });

  it('opens the item tray from an empty bag slot and shows one icon-only tile per village item', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('bag-slot-0').querySelector('button')!);
    const picker = screen.getByTestId('quest-selection-tray');
    expect(picker).toBeInTheDocument();
    for (const { itemId } of VILLAGE_STASH_CONFIG.items) {
      const tile = screen.getByTestId(`picker-item-${itemId}`);
      expect(tile).toBeInTheDocument();
      /* Icon-only contract: the tile carries an svg + the qty badge — the
       *  item NAME must not render as text inside the tile. */
      expect(tile.querySelector('svg')).not.toBeNull();
      expect(tile).not.toHaveTextContent(defaultQuestItems[itemId].labelKey);
    }
  });

  it('selecting three tiles fills the three bag slots; tray stays open', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('bag-slot-0').querySelector('button')!);
    const first3 = VILLAGE_STASH_CONFIG.items.slice(0, 3);
    for (const { itemId } of first3) {
      fireEvent.click(screen.getByTestId(`picker-item-${itemId}`));
    }
    for (let i = 0; i < 3; i++) {
      expect(screen.getByTestId(`bag-slot-${i}`)).toHaveTextContent('');
      expect(screen.getByTestId(`bag-slot-${i}`).querySelector('button')).not.toBeNull();
    }
    for (const { itemId } of first3) {
      /* WITNESS-06b: `loadout-item-<id>` exists EXACTLY once — the filled
       *  slot's inner button — while the `picker-item-<id>` tile coexists. */
      expect(screen.getAllByTestId(`loadout-item-${itemId}`)).toHaveLength(1);
      expect(screen.getAllByTestId(`picker-item-${itemId}`)).toHaveLength(1);
    }
    /* Bag full: the remaining tiles are disabled. */
    const fourth = VILLAGE_STASH_CONFIG.items[3].itemId;
    expect(screen.getByTestId(`picker-item-${fourth}`)).toBeDisabled();
    expect(screen.getByTestId('quest-selection-tray')).toBeInTheDocument();
  });

  it('clicking a filled bag slot removes the item', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('bag-slot-0').querySelector('button')!);
    const id = VILLAGE_STASH_CONFIG.items[0].itemId;
    fireEvent.click(screen.getByTestId(`picker-item-${id}`));
    expect(screen.getAllByTestId(`loadout-item-${id}`)).toHaveLength(1);
    fireEvent.click(screen.getByTestId(`loadout-item-${id}`));
    expect(screen.queryByTestId(`loadout-item-${id}`)).toBeNull();
  });

  it('Escape closes ONLY the tray and focus returns to the originating bag slot', () => {
    render(<Harness />);
    const slotButton = screen.getByTestId('bag-slot-0').querySelector('button')!;
    fireEvent.click(slotButton);
    expect(screen.getByTestId('quest-selection-tray')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('quest-selection-tray')).toBeNull();
    /* The panel itself stays mounted (the detail plaque survives). */
    expect(screen.getByTestId('quest-expedition-detail')).toBeInTheDocument();
    expect(document.activeElement).toBe(slotButton);
  });

  it('a pointer down outside the tray closes it', () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('bag-slot-0').querySelector('button')!);
    expect(screen.getByTestId('quest-selection-tray')).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByTestId('quest-selection-tray')).toBeNull();
  });

  it('focusing a picker tile exposes name + description + stock in a tooltip', async () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId('bag-slot-0').querySelector('button')!);
    const id = VILLAGE_STASH_CONFIG.items[0].itemId;
    const tile = screen.getByTestId(`picker-item-${id}`);
    fireEvent.focus(tile);
    await waitFor(() => {
      expect(document.querySelector('[role="tooltip"], [data-radix-popper-content-wrapper]')).not.toBeNull();
    });
    const tip = document.querySelector('[role="tooltip"]') ?? document.querySelector('[data-radix-popper-content-wrapper]')!;
    const item = defaultQuestItems[id];
    /* Name (labelKey), effect description (item/stash descKey) and the
     *  stock line (`{qty}` interpolated) must all land in the tooltip. */
    const labelKey = item.labelKey.replace(/^idleVillage\./, '');
    expect(tip).toHaveTextContent(labelKey);
    const descKey = item.descKey ?? (item.engineFlag ? QUEST_STASH.items.find((s) => s.flag === item.engineFlag)?.descKey : undefined);
    if (descKey) expect(tip).toHaveTextContent(descKey);
    expect(tip).toHaveTextContent(`${VILLAGE_STASH_CONFIG.items.find((r) => r.itemId === id)!.qty}`);
  });
});
