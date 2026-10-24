/**
 * INV:village-stash-panel.INV-1 — stash-uniformity (R-270, Director ruling):
 * the village shelf and the quest planner render the SAME item-face —
 * a shared lacquer `StashItemTile` with the corner `StashQtyBadge` ×N —
 * and the same tooltip vocabulary (`StashItemTooltipBody` name·desc·stock),
 * while the containers stay different (rows vs tiles).
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { VillageStashPanel } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { StashItemTooltipBody } from '@/ui/idleVillage/components/gameFrame/stashItemFace';
import { useVillageStashStore, type VillageStashState } from '@/ui/idleVillage/store/useVillageStashStore';

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(async (_key: string, fallback: unknown) => fallback),
  saveData: vi.fn(async () => undefined),
  clearData: vi.fn(async () => undefined),
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
beforeEach(() => setLedger({ hydration: 'ready' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts && 'qty' in opts ? `${key}:${opts.qty}` : key,
  }),
}));

const renderPanel = () =>
  render(<VillageStashPanel config={VILLAGE_STASH_CONFIG} left={0} top={0} widthPx={320} zIndex={12} onClose={() => {}} />);

// INV:village-stash-panel.INV-1 — ogni riga shelf mostra la stessa item-face
// del planner (tile lacquer + badge angolare ×N) e il tooltip condiviso.
describe('village stash — shared item-face (village-stash-panel.INV-1)', () => {
  it('every shelf row shows the shared tile + corner ×N badge', () => {
    renderPanel();
    const list = screen.getByRole('list');
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(VILLAGE_STASH_CONFIG.items.length);
    VILLAGE_STASH_CONFIG.items.forEach(({ itemId, qty }, i) => {
      expect(within(rows[i]).getByTestId('stash-item-tile'), `${itemId} tile`).toBeInTheDocument();
      expect(within(rows[i]).getByTestId('stash-qty-badge'), `${itemId} badge`).toHaveTextContent(`×${qty}`);
    });
  });

  it('the shared tooltip body renders the shared vocabulary — name · desc · stock', () => {
    const first = VILLAGE_STASH_CONFIG.items[0];
    render(
      <StashItemTooltipBody labelKey="questItems.test.name" descKey="questItems.test.desc" stockQty={first.qty} />,
    );
    expect(screen.getByText('questItems.test.name')).toBeInTheDocument();
    expect(screen.getByText('questItems.test.desc')).toBeInTheDocument();
    expect(screen.getByText(`questExpedition.bag.stock:${first.qty}`)).toBeInTheDocument();
  });
});
