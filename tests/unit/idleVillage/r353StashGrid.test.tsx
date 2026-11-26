import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import { VillageStashPanel } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { useVillageStashStore, type VillageStashState } from '@/ui/idleVillage/store/useVillageStashStore';

/* R-353 mockup restyle (mockup-stash-grid.jpg): the shelf is a tile grid with
 *  kind tabs and a hover/focus detail card. Ledger contract untouched —
 *  same store, same assign authority, same testids. */

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(async (_key: string, fallback: unknown) => fallback),
  saveData: vi.fn(async () => undefined),
  clearData: vi.fn(async () => undefined),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'gameFrame.stash.capacity') return `${opts?.count} of ${opts?.max}`;
      if (key === 'gameFrame.stash.capacityShort') return `${opts?.count} / ${opts?.max}`;
      if (key === 'gameFrame.stash.qty') return `${opts?.qty} in store`;
      return key;
    },
  }),
}));

const setLedger = (patch: Partial<VillageStashState>) =>
  useVillageStashStore.setState({
    hydration: 'ready',
    bags: {},
    committed: {},
    activeStashOwner: null,
    lastEvent: null,
    ...patch,
  });
beforeEach(() => setLedger({ hydration: 'pending' }));

const CFG = VILLAGE_STASH_CONFIG;
const renderPanel = () =>
  render(<VillageStashPanel config={CFG} left={0} top={0} widthPx={320} zIndex={12} onClose={() => {}} />);

// INV:village-stash-panel.INV-3 — the shelf is a tile grid: every listitem carries
// the shared StashItemTile face + corner ×N badge + the item's name/description as
// sr-only text; a radiogroup of kind tabs derived from the config filters the grid.
describe('stash shelf grid (INV-3)', () => {
  it('renders every shelf row as a well cell carrying icon + qty badge + sr-only name/desc', () => {
    renderPanel();
    const list = screen.getByRole('list');
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(CFG.items.length);
    rows.forEach((row) => {
      /* Director 2026-11-20: single-frame cell — no inner tile, icon + badge only. */
      expect(within(row).queryByTestId('stash-item-tile')).toBeNull();
      expect(row.querySelector('img,svg')).toBeTruthy();
      expect(within(row).getByTestId('stash-qty-badge')).toBeInTheDocument();
    });
    CFG.items.forEach(({ itemId, qty }, i) => {
      const item = defaultQuestItems[itemId];
      expect(within(rows[i]).getByText(new RegExp(item.labelKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument();
      expect(rows[i]).toHaveTextContent(`×${qty}`);
    });
  });

  it('offers a row of round kind filters derived from the config kinds', () => {
    renderPanel();
    const group = screen.getByRole('group', { name: 'gameFrame.stash.filterLabel' });
    expect(within(group).getByTestId('stash-filter-all')).toHaveAttribute('aria-pressed', 'true');
    const expectedKinds = [...new Set(CFG.items.map((i) => defaultQuestItems[i.itemId]?.kind).filter(Boolean))];
    for (const kind of expectedKinds) {
      expect(within(group).getByTestId(`stash-filter-${kind}`)).toBeInTheDocument();
    }
  });

  it('keeps the full stock visible under a kind tab whose kind covers every row', () => {
    renderPanel();
    fireEvent.click(screen.getByTestId('stash-filter-consumable'));
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(CFG.items.length);
    fireEvent.click(screen.getByTestId('stash-filter-all'));
    expect(within(list).getAllByRole('listitem')).toHaveLength(CFG.items.length);
  });

  it('seats filters in the header before close, keeps empty alcoves visible, and hides the scroll control at capacity', () => {
    renderPanel();
    const group = screen.getByTestId('stash-filters');
    expect(group.style.position).toBe('absolute');
    expect(group.style.right).not.toBe('');
    expect(group.style.left).toBe('');
    expect(screen.getAllByTestId('stash-empty-alcove')).toHaveLength(Math.max(0, 15 - CFG.items.length));
    expect(screen.queryByTestId('stash-scroll-track')).toBeNull();
    expect(screen.queryByTestId('stash-mode-hint')).toBeNull();
    expect(screen.queryByTestId('stash-bag-full-hint')).toBeNull(); // read-only fixture: hint may exist only sr-only when a bound bag is full
  });

  it('shows the lateral scroll control only when filtered rows exceed the fifteen visible alcoves', () => {
    const overflowConfig = {
      ...CFG,
      items: Array.from({ length: 16 }, (_, i) => ({ itemId: `quest_overflow_${i}`, qty: 1 })),
    } as typeof CFG;
    const scrollHeight = vi.spyOn(HTMLDivElement.prototype, 'scrollHeight', 'get').mockImplementation(function () {
      return this.getAttribute('data-testid') === 'stash-shelf' ? 640 : 0;
    });
    const clientHeight = vi.spyOn(HTMLDivElement.prototype, 'clientHeight', 'get').mockImplementation(function () {
      return this.getAttribute('data-testid') === 'stash-shelf' ? 320 : 0;
    });
    render(<VillageStashPanel config={overflowConfig} left={0} top={0} widthPx={320} zIndex={12} onClose={() => {}} />);
    expect(screen.getByTestId('stash-scroll-track')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('stash-filter-all'));
    scrollHeight.mockRestore();
    clientHeight.mockRestore();
  });
});

// INV:village-stash-panel.INV-4 — the fixed detail card is retired (Director 2026-11-26): the item
// is described by its shared tooltip on hover/focus, and a click assigns only with a bound planner.
// Read-only: no button, and a click changes nothing in the ledger.
describe('stash item interaction (INV-4)', () => {
  it('has no fixed detail card and no Pack button in read-only mode', () => {
    renderPanel();
    expect(screen.queryByTestId('stash-detail')).toBeNull();
    expect(screen.queryByTestId('stash-pack-detail')).toBeNull();
    expect(screen.queryAllByRole('button').filter((b) => b.getAttribute('data-testid')?.startsWith('stash-item-'))).toHaveLength(0);
  });

  it('a read-only click on a cell does not mutate the ledger', () => {
    renderPanel();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    fireEvent.click(rows[0]);
    expect(useVillageStashStore.getState().lastEvent).toBeNull();
  });

  it('bound mode: a click on a cell assigns through the ledger', () => {
    setLedger({ activeStashOwner: 'poi-demo' });
    renderPanel();
    expect(screen.getByTestId('stash-shelf')).toHaveAttribute('data-stash-mode', 'interactive');
    const cell = screen.getByTestId(`stash-item-${CFG.items[0].itemId}`);
    expect(cell).toHaveAttribute('data-assign-state', 'eligible');
    fireEvent.click(cell);
    expect(useVillageStashStore.getState().lastEvent?.kind).toBe('assign');
    expect(useVillageStashStore.getState().lastEvent?.itemId).toBe(CFG.items[0].itemId);
  });

  // INV:village-stash-panel.INV-5 — the panel mounts the mockup 1:1: the whole
  // chrome is the clean Gemini-regenerated frame (2026-11-25, alpha-cut)
  // (Director 2026-11-24: «uguale, in proporzione 1:1 con il mockup» —
  // supersedes the PanelFrameOrnaments contract) with the stock counter the
  // mockup paints («24 / 24») restored — supersedes the 2026-11-20 no-counter
  // ruling.
  it('mounts the mockup painted backdrop and no stock counter', () => {
    const { container } = renderPanel();
    const backdrop = container.querySelector('img[src*="stash-frame-no-grid"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    expect(backdrop.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-frame-manifest="stash-frame"]')).toBeNull();
    /* The «N / M» counter is retired (Director 2026-11-26). */
    expect(container.querySelector('[data-testid="stash-capacity"]')).toBeNull();
  });
});
