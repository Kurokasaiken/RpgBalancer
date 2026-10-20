import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VILLAGE_STASH_CONFIG, villageStashSchema } from '@/balancing/config/idleVillage/villageStashConfig';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { HUD_PANELS } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';
import { resolveStashItemDescKey, villageStashViewModel } from '@/ui/idleVillage/components/gameFrame/villageStashViewModel';
import { VillageStashPanel } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { MapBuildingPoi } from '@/ui/idleVillage/components/gameFrame/MapBuildingPoi';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'gameFrame.stash.capacity') return `${opts?.count} of ${opts?.max}`;
      if (key === 'gameFrame.stash.qty') return `${opts?.qty} in store`;
      return key;
    },
  }),
}));

const CFG = VILLAGE_STASH_CONFIG;

describe('villageStashConfig', () => {
  it('has unique itemIds, all offerable quest consumables', () => {
    const ids = CFG.items.map((i) => i.itemId);
    expect(new Set(ids).size).toBe(ids.length);
    // The picker's offerable set is exactly the consumable kind of questItems:
    // the mock stash can never contradict the loadout surface.
    for (const id of ids) {
      expect(defaultQuestItems[id]?.kind, `${id} must be an offerable consumable`).toBe('consumable');
    }
  });

  it('stocks only bag-legal consumables — the shelf IS the planner picker (PLAN-036)', async () => {
    const { isExpeditionItem } = await import('@/ui/idleVillage/quests/questExpedition');
    for (const { itemId } of CFG.items) {
      const item = defaultQuestItems[itemId];
      expect(item.engineFlag, `${itemId} needs an engineFlag channel to be packable`).toBeTruthy();
      expect(isExpeditionItem(item), `${itemId} must pass the expedition legality bar`).toBe(true);
    }
  });

  it('keeps sum(qty) within capacityMax', () => {
    const total = CFG.items.reduce((sum, i) => sum + i.qty, 0);
    expect(total).toBeLessThanOrEqual(CFG.capacityMax);
  });

  it('rejects invalid configs at parse time', () => {
    const base = structuredClone(CFG);
    expect(() =>
      villageStashSchema.parse({ ...base, items: [...base.items.slice(0, 5), { itemId: 'quest_weapon_iron_blade', qty: 1 }] }),
    ).toThrow();
    expect(() =>
      villageStashSchema.parse({ ...base, items: [...base.items.slice(0, 5), { itemId: base.items[0].itemId, qty: 1 }], capacityMax: 99 }),
    ).toThrow();
    expect(() =>
      villageStashSchema.parse({ ...base, capacityMax: 1 }),
    ).toThrow();
  });

  /* PLAN-035: no continent-map marker — the warehouse tooltip inside the
   * Village view opens the panel; menu/`v` paths stay registered. */
  it('registers panelId villageStash in the HUD panels registry', () => {
    expect(HUD_PANELS.some((p) => p.id === 'villageStash')).toBe(true);
  });
});

describe('villageStashViewModel', () => {
  it('derives the displayed count from sum(qty) and resolves a descKey per row', () => {
    const vm = villageStashViewModel(CFG);
    expect(vm.storedCount).toBe(CFG.items.reduce((s, i) => s + i.qty, 0));
    expect(vm.capacityMax).toBe(CFG.capacityMax);
    expect(vm.rows).toHaveLength(CFG.items.length);
    for (const row of vm.rows) {
      expect(resolveStashItemDescKey(row.itemId)).toBe(row.descKey);
      expect(row.descKey.length).toBeGreaterThan(0);
      expect(row.nameKey).toBe(defaultQuestItems[row.itemId].labelKey);
    }
  });
});

describe('VillageStashPanel', () => {
  const renderPanel = () =>
    render(<VillageStashPanel config={CFG} left={0} top={0} widthPx={320} zIndex={12} onClose={() => {}} />);

  it('renders every config row with name, wrapped description and inline ×qty', () => {
    renderPanel();
    const list = screen.getByRole('list');
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(CFG.items.length);
    CFG.items.forEach(({ itemId, qty }, i) => {
      const item = defaultQuestItems[itemId];
      expect(within(rows[i]).getByText(new RegExp(item.labelKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
      expect(rows[i]).toHaveTextContent(resolveStashItemDescKey(itemId));
      expect(rows[i]).toHaveTextContent(`×${qty}`);
    });
  });

  it('shows the derived capacity in the footer and no interactive controls in rows', () => {
    renderPanel();
    // R-234: the capacity is the Warehouse's (24 at level II), not a second literal.
    expect(screen.getByText(`${CFG.items.reduce((sum, i) => sum + i.qty, 0)} of ${CFG.capacityMax}`)).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(within(list).queryAllByRole('button')).toHaveLength(0);
    expect(within(list).queryAllByRole('checkbox')).toHaveLength(0);
    expect(within(list).queryAllByRole('textbox')).toHaveLength(0);
    // The only button in the whole panel is the title-row close control.
    expect(screen.getAllByRole('button')).toHaveLength(1);
  });

  it('titles the panel via aria-labelledby', () => {
    renderPanel();
    const panel = screen.getByRole('region', { name: 'gameFrame.stash.title' });
    expect(panel).toBeInTheDocument();
  });
});

describe('MapBuildingPoi', () => {
  const renderPoi = (onActivate = vi.fn()) => {
    const utils = render(<MapBuildingPoi buildingId="stash" name="Magazzino" sizePx={55} onActivate={onActivate} />);
    return { onActivate, marker: screen.getByRole('button', { name: 'Magazzino' }), ...utils };
  };

  /* jsdom has no PointerEvent constructor: React delegates `onPointerDown` by
   *  event name, so a bubbling MouseEvent typed `pointerdown` reaches it. */
  const pointerDown = (marker: HTMLElement, x: number, y: number) =>
    fireEvent(marker, new MouseEvent('pointerdown', { bubbles: true, clientX: x, clientY: y }));

  it('activates on Enter, Space and a click with under-5px pointer travel', () => {
    const { onActivate, marker } = renderPoi();
    fireEvent.keyDown(marker, { key: 'Enter' });
    fireEvent.keyDown(marker, { key: ' ' });
    pointerDown(marker, 100, 100);
    fireEvent.click(marker, { clientX: 102, clientY: 101 });
    expect(onActivate).toHaveBeenCalledTimes(3);
    expect(onActivate).toHaveBeenCalledWith(marker);
  });

  it('suppresses activation after a map pan (pointer travel ≥ 5px)', () => {
    const { onActivate, marker } = renderPoi();
    pointerDown(marker, 100, 100);
    fireEvent.click(marker, { clientX: 108, clientY: 100 });
    expect(onActivate).not.toHaveBeenCalled();
  });

  it('stops taking pointer input while exiting (anchor ghost)', () => {
    const { container } = render(<MapBuildingPoi buildingId="stash" name="Magazzino" sizePx={55} onActivate={() => {}} exiting />);
    /* The ghost leaves the a11y tree (aria-hidden + tabIndex -1), so it is
     * queried by data attribute, not by role. */
    const marker = container.querySelector<HTMLElement>('[data-building-poi="stash"]');
    expect(marker).toHaveStyle({ pointerEvents: 'none', opacity: '0' });
    expect(marker).toHaveAttribute('data-exiting');
    expect(marker).toHaveAttribute('aria-hidden', 'true');
    expect(marker).toHaveAttribute('tabindex', '-1');
  });
});
