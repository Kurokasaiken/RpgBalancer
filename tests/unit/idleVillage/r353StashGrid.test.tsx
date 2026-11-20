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

  it('offers a radiogroup of kind tabs derived from the config kinds', () => {
    renderPanel();
    const tabs = screen.getByRole('radiogroup', { name: 'gameFrame.stash.filterLabel' });
    expect(within(tabs).getByTestId('stash-tab-all')).toHaveAttribute('aria-checked', 'true');
    // Every configured kind gets a tab; the shelf config stocks consumables.
    const expectedKinds = [...new Set(CFG.items.map((i) => defaultQuestItems[i.itemId]?.kind).filter(Boolean))];
    for (const kind of expectedKinds) {
      expect(within(tabs).getByTestId(`stash-tab-${kind}`)).toBeInTheDocument();
    }
  });

  it('keeps the full stock visible under a kind tab whose kind covers every row', () => {
    renderPanel();
    fireEvent.click(screen.getByTestId('stash-tab-consumable'));
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(CFG.items.length);
    fireEvent.click(screen.getByTestId('stash-tab-all'));
    expect(within(list).getAllByRole('listitem')).toHaveLength(CFG.items.length);
  });
});

// INV:village-stash-panel.INV-4 — the detail card previews the last hovered/focused
// item in the shared tooltip vocabulary (name, effect, covers, stock), falling back
// to the first visible row; the Pack affordance exists only when a planner is bound.
describe('stash item detail card (INV-4)', () => {
  it('previews the first shelf row by default in the shared vocabulary', () => {
    renderPanel();
    const detail = screen.getByTestId('stash-detail');
    const first = defaultQuestItems[CFG.items[0].itemId];
    expect(detail).toHaveTextContent(first.labelKey);
    /* R-363 detail card: stock reads as the «N in store» line, not a badge. */
    expect(detail).toHaveTextContent(`${CFG.items[0].qty} in store`);
    expect(detail).toHaveTextContent('gameFrame.stash.usableInExpeditions');
  });

  it('updates the preview when a cell is hovered', () => {
    renderPanel();
    const rows = within(screen.getByRole('list')).getAllByRole('listitem');
    fireEvent.mouseEnter(rows[2]);
    const detail = screen.getByTestId('stash-detail');
    expect(detail).toHaveTextContent(defaultQuestItems[CFG.items[2].itemId].labelKey);
  });

  it('carries no Pack affordance in read-only mode', () => {
    renderPanel();
    expect(screen.getByTestId('stash-detail')).toBeInTheDocument();
    expect(screen.queryByTestId('stash-pack-detail')).toBeNull();
  });

  it('exposes a Pack button in bound mode that assigns through the ledger', () => {
    setLedger({ activeStashOwner: 'poi-demo' });
    renderPanel();
    expect(screen.getByTestId('stash-shelf')).toHaveAttribute('data-stash-mode', 'interactive');
    const pack = screen.getByTestId('stash-pack-detail');
    expect(pack).toHaveAttribute('data-assign-state', 'eligible');
    fireEvent.click(pack);
    expect(useVillageStashStore.getState().lastEvent?.kind).toBe('assign');
    expect(useVillageStashStore.getState().lastEvent?.itemId).toBe(CFG.items[0].itemId);
  });

  // INV:village-stash-panel.INV-5 — the plaque mounts the mockup's ornate frame:
  // PanelFrameOrnaments (data-panel-frame="ornate"), the R-357 9-slice set —
  // 4 fixed corners + chest clasp <img> + repeat-tile edge strips + inner filet,
  // decorative only (aria-hidden, pointer-events none), in every mode.
  it('mounts the mockup ornate frame on the plaque', () => {
    const { container } = renderPanel();
    const frame = container.querySelector('[data-panel-frame="ornate"]') as HTMLElement;
    expect(frame).toBeTruthy();
    expect(frame.getAttribute('aria-hidden')).toBe('true');
    /* PLAN-127 slice-kit: the painted frame now renders from the generated
     *  manifest (data-frame-manifest), not the legacy 5-img ornate set
     *  (4 corners + chest clasp — clasp removed by ruling). */
    expect(frame.getAttribute('data-frame-manifest')).toBeTruthy();
    /* ≥4: the manifest's fixed corners; edges may be culled at jsdom's
     *  zero-size rects. */
    expect(frame.querySelectorAll('img').length).toBeGreaterThanOrEqual(4);
  });
});
