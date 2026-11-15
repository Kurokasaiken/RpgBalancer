/**
 * R-339 / PLAN-119 T3-S2 — «stash assignment + consequence preview».
 *
 * The expedition drawer's reserved cost cell (`cassetto-cost-slot`) now
 * paints the food-cost preview (party × days × per-resident rate, danger
 * tone when the village stock can't cover it), and the bound
 * `VillageStashPanel` rows announce their assign eligibility BEFORE the
 * click (`data-assign-state`: eligible | packed | bagFull) plus a
 * localized bag-full hint — all read off the same sparse ledger bag the
 * bag-slot frames mirror (artifact-r004 D7 + S2). The helpers are pure;
 * the ledger stays the only mutation authority.
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  bagAssignEligibility,
  expeditionFoodCost,
} from '@/ui/idleVillage/components/gameFrame/expeditionBagAssign';
import type { CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { HudRealCassetto } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { VillageStashPanel } from '@/ui/idleVillage/components/gameFrame/VillageStashPanel';
import { VILLAGE_STASH_CONFIG, type VillageStashConfig } from '@/balancing/config/idleVillage/villageStashConfig';
import { useVillageStashStore, type VillageStashState } from '@/ui/idleVillage/store/useVillageStashStore';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';

vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(async (_key: string, fallback: unknown) => fallback),
  saveData: vi.fn(async () => undefined),
  clearData: vi.fn(async () => undefined),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

/* The resident rack is outside this contract (same stub as r337). */
vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  ResidentSlotRack: () => <div data-testid="resident-slot-rack-stub" />,
}));

const POI = 'poi-demo';
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

const QUEST: CassettoQuest = {
  title: 'Goblin Extermination',
  subtitle: 'Pianifica la spedizione',
  briefing: 'briefing',
  legs: [
    { label: 'Outbound', days: 1 },
    { label: 'At site', days: 2 },
    { label: 'Return', days: 1 },
  ],
  riskLabel: 'low',
  rewards: [{ icon: 'gold', qty: '60' }],
};

const CFG = VILLAGE_STASH_CONFIG;
const renderPanel = (config: VillageStashConfig = CFG) =>
  render(<VillageStashPanel config={config} left={0} top={0} widthPx={320} zIndex={12} onClose={() => {}} />);

describe('T3-S2 — expeditionFoodCost (config-driven consequence preview)', () => {
  it('is partySize × days × the per-resident daily rate, ceiled', () => {
    expect(expeditionFoodCost(3, 4, 1)).toBe(12);
    expect(expeditionFoodCost(2, 5, 0.5)).toBe(5);
    expect(expeditionFoodCost(1, 3, 0.4)).toBe(2); // 1.2 → ceil
  });
  it('collapses malformed input to 0 — never a negative or NaN cost', () => {
    expect(expeditionFoodCost(0, 5, 1)).toBe(0);
    expect(expeditionFoodCost(-2, 5, 1)).toBe(0);
    expect(expeditionFoodCost(NaN, 5, 1)).toBe(0);
    expect(expeditionFoodCost(3, Infinity, 1)).toBe(0);
  });
});

describe('T3-S2 — bagAssignEligibility mirrors the ledger reject reasons', () => {
  it('a missing or empty bag leaves every row eligible up to bagSlots', () => {
    expect(bagAssignEligibility(undefined, 'quest_consumable_corda', 3)).toBe('eligible');
    expect(bagAssignEligibility([null, null, null], 'quest_consumable_corda', 3)).toBe('eligible');
  });
  it('an item already in the (sparse) bag is packed, whatever the hole layout', () => {
    expect(bagAssignEligibility([null, 'quest_consumable_corda', null], 'quest_consumable_corda', 3)).toBe('packed');
    expect(bagAssignEligibility(['a', 'quest_consumable_corda', 'b'], 'quest_consumable_corda', 3)).toBe('packed');
  });
  it('a full bag (no free slot) blocks NEW items but keeps packed ones packed', () => {
    const full = ['a', 'b', 'c'];
    expect(bagAssignEligibility(full, 'quest_consumable_corda', 3)).toBe('bagFull');
    expect(bagAssignEligibility(full, 'a', 3)).toBe('packed');
  });
});

describe('T3-S2 — the reserved cost cell paints the preview', () => {
  const renderCassetto = (quest: CassettoQuest) =>
    render(
      <div style={{ position: 'relative', width: 356, height: 900 }}>
        <HudRealCassetto quest={quest} slots={[]} />
      </div>,
    );

  it('renders icon + qty inside cassetto-cost-slot when quest.costPreview is set', () => {
    renderCassetto({ ...QUEST, costPreview: { icon: 'food', qty: '12' } });
    const cell = screen.getByTestId('cassetto-cost-slot');
    const value = screen.getByTestId('cassetto-cost-value');
    expect(cell).toContainElement(value);
    expect(value).toHaveTextContent('12');
    /* The filled cell is real content — the placeholder flag is lifted. */
    expect(cell).not.toHaveAttribute('data-placeholder');
    expect(cell).not.toHaveAttribute('aria-hidden');
  });

  it('flags the danger tone when the village stock cannot cover the cost', () => {
    renderCassetto({ ...QUEST, costPreview: { icon: 'food', qty: '30', insufficient: true } });
    expect(screen.getByTestId('cassetto-cost-value')).toHaveAttribute('data-tone', 'danger');
  });

  it('stays a flagged empty placeholder without a costPreview', () => {
    renderCassetto(QUEST);
    const cell = screen.getByTestId('cassetto-cost-slot');
    expect(cell).toHaveAttribute('data-placeholder', 'cost-preview');
    expect(cell).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByTestId('cassetto-cost-value')).not.toBeInTheDocument();
  });
});

describe('T3-S2 — the bound shelf marks assign eligibility (D7)', () => {
  it('empty bag: every shelf row is eligible', () => {
    setLedger({ hydration: 'ready', activeStashOwner: POI });
    renderPanel();
    for (const { itemId } of CFG.items) {
      expect(screen.getByTestId(`stash-item-${itemId}`)).toHaveAttribute('data-assign-state', 'eligible');
    }
    expect(screen.queryByTestId('stash-bag-full-hint')).not.toBeInTheDocument();
  });

  it('a partially packed bag keeps the remaining rows eligible — no hint', () => {
    const [first] = CFG.items;
    setLedger({ hydration: 'ready', activeStashOwner: POI, bags: { [POI]: [first.itemId, null, null] } });
    renderPanel();
    /* The packed copy left the shelf (stock fully reserved); the survivors
     * are still packable — a sparse hole never blocks. */
    expect(screen.queryByTestId(`stash-item-${first.itemId}`)).not.toBeInTheDocument();
    for (const { itemId } of CFG.items.slice(1)) {
      expect(screen.getByTestId(`stash-item-${itemId}`)).toHaveAttribute('data-assign-state', 'eligible');
    }
    expect(screen.queryByTestId('stash-bag-full-hint')).not.toBeInTheDocument();
  });

  it('a multi-copy item already packed stays on the shelf as packed', () => {
    const [first, ...rest] = CFG.items;
    const cfg: VillageStashConfig = {
      ...CFG,
      items: [{ ...first, qty: 2 }, ...rest],
    };
    setLedger({ hydration: 'ready', activeStashOwner: POI, bags: { [POI]: [first.itemId, null, null] } });
    renderPanel(cfg);
    expect(screen.getByTestId(`stash-item-${first.itemId}`)).toHaveAttribute('data-assign-state', 'packed');
    expect(screen.getByTestId(`stash-item-${rest[0].itemId}`)).toHaveAttribute('data-assign-state', 'eligible');
  });

  it('a full bag dims every remaining row and shows the localized hint', () => {
    const full = CFG.items.slice(0, QUEST_STASH.bagSlots).map((i) => i.itemId);
    setLedger({ hydration: 'ready', activeStashOwner: POI, bags: { [POI]: full } });
    renderPanel();
    /* The packed items' rows left the shelf; every survivor is bagFull. */
    for (const { itemId } of CFG.items.slice(QUEST_STASH.bagSlots)) {
      expect(screen.getByTestId(`stash-item-${itemId}`)).toHaveAttribute('data-assign-state', 'bagFull');
    }
    expect(screen.getByTestId('stash-bag-full-hint')).toHaveTextContent('gameFrame.stash.bagFullHint');
  });

  it('read-only mode carries no eligibility markers — the shelf stays a plain list', () => {
    setLedger({ hydration: 'ready' });
    const { container } = renderPanel();
    /* No bound owner → no row buttons and no assign-state markers
     * (`stash-item-tile` is the shared face's own id — not a row). */
    expect(container.querySelectorAll('[data-assign-state]')).toHaveLength(0);
    expect(screen.queryByTestId('stash-bag-full-hint')).not.toBeInTheDocument();
  });
});

describe('T3-S2 — /game wiring feeds the REAL ledger and config rate', () => {
  const read = (p: string) =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../../../', p), 'utf8') as string;

  it('HudRealCassettoDetail computes the preview from party × days × configured rate', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx');
    expect(src).toMatch(/expeditionFoodCost\(/);
    expect(src).toMatch(/foodConsumptionPerResidentPerDay/);
    expect(src).toMatch(/costPreview/);
    expect(src).toMatch(/insufficient/);
  });

  it('VillageStashPanel derives eligibility from the shared helper — no second authority', () => {
    const src = read('src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx');
    expect(src).toMatch(/bagAssignEligibility\(/);
    expect(src).toMatch(/data-assign-state/);
    expect(src).toMatch(/stash-bag-full-hint/);
  });

  it('the lab host wires the same costPreview semantics for witnesses', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassettoHost.tsx');
    expect(src).toMatch(/expeditionFoodCost\(/);
    expect(src).toMatch(/costPreview/);
  });
});
