/**
 * R-337 (2026-11-14) — «gli oggetti da portare in viaggio devono essere slot
 * vuoti, cliccati dal componente magazzino».
 *
 * The cassetto used to paint the whole stash catalogue as toggle rows
 * (`loadoutRows`): every item visible, click = pack/unpack inline. Wrong
 * surface — the Director wants the planner's bag contract: `bagSlots` empty
 * wells that fill ONLY by clicking rows in the bound magazzino
 * (`VillageStashPanel` → `assign` on the POI's ledger bag), mirroring the
 * stock planner's `QuestBagSlot`/`PackedBagItem` pair:
 *   empty pouch  → `onOpenStash` opens the bound warehouse;
 *   packed tile  → `onReleaseItem` returns the item to the shared pool.
 * The `loadout-item-*` test id is the focus target the shelf lands on after
 * a successful assign — it must stay.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { CassettoLoadout, CassettoQuest } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { HudRealCassetto } from '@/ui/idleVillage/hudReal/HudRealCassetto';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      opts ? `${key}:${Object.values(opts).join('|')}` : key,
  }),
}));

/* The resident rack is outside this contract — stub it so the test stays on
 * the bag surface (same as the lab's debug mounts). */
vi.mock('@/ui/idleVillage/components/ResidentSlotRack', () => ({
  ResidentSlotRack: () => <div data-testid="resident-slot-rack-stub" />,
}));

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

const renderCassetto = (loadout?: CassettoLoadout) =>
  render(
    <div style={{ position: 'relative', width: 356, height: 900 }}>
      <HudRealCassetto quest={QUEST} slots={[]} loadout={loadout} />
    </div>,
  );

describe('R-337 — the cassetto bag is empty slot frames, not a catalogue list', () => {
  it('renders one frame per bag slot; empty frames carry the pouch affordance', () => {
    const loadout: CassettoLoadout = {
      slots: [null, null, null],
      onReleaseItem: vi.fn(),
      onOpenStash: vi.fn(),
    };
    renderCassetto(loadout);
    expect(screen.getAllByTestId(/^bag-slot-\d+$/)).toHaveLength(QUEST_STASH.bagSlots);
    expect(screen.getAllByTestId(/^bag-slot-empty-\d+$/)).toHaveLength(QUEST_STASH.bagSlots);
    /* The old presentation — catalogue rows with inline pack toggle — is gone. */
    expect(screen.queryByTestId(/^cassetto-loadout-/)).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^loadout-item-/)).not.toBeInTheDocument();
  });

  it('a packed slot faces the shared item tile and releases on click', () => {
    const onReleaseItem = vi.fn();
    const loadout: CassettoLoadout = {
      slots: [{ id: 'healing', icon: 'potion', label: 'Healing', qty: 2 }, null, null],
      onReleaseItem,
      onOpenStash: vi.fn(),
    };
    renderCassetto(loadout);
    const packed = screen.getByTestId('loadout-item-healing');
    expect(packed).toHaveAttribute('data-bag-slot-index', '0');
    fireEvent.click(packed);
    expect(onReleaseItem).toHaveBeenCalledWith('healing');
  });

  it('an empty slot calls onOpenStash — the magazzino is the picker', () => {
    const onOpenStash = vi.fn();
    const loadout: CassettoLoadout = {
      slots: [{ id: 'healing', icon: 'potion', label: 'Healing' }, null, null],
      onReleaseItem: vi.fn(),
      onOpenStash,
    };
    renderCassetto(loadout);
    fireEvent.click(screen.getByTestId('bag-slot-empty-1'));
    expect(onOpenStash).toHaveBeenCalledTimes(1);
    /* The trigger element is handed over for focus return (same contract as
     * the stock detail's `onOpenStash(trigger)`). */
    expect(onOpenStash.mock.calls[0][0]).toBe(screen.getByTestId('bag-slot-empty-1'));
  });
});

describe('R-337 — /game wiring feeds the REAL sparse ledger bag', () => {
  const read = (p: string) =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('node:fs').readFileSync(require('node:path').resolve(__dirname, '../../../', p), 'utf8') as string;

  it('HudRealCassettoDetail reads bags[poi.id] and wires session handlers', () => {
    const src = read('src/ui/idleVillage/hudReal/HudRealCassettoDetail.tsx');
    expect(src).toMatch(/useVillageStashStore\(\(s\)\s*=>\s*s\.bags\[p\.poi\.id\]\)/);
    expect(src).toMatch(/onReleaseItem:\s*p\.onToggleItem/);
    expect(src).toMatch(/onOpenStash:\s*p\.onOpenStash/);
    /* The store bag is sparse — slots keep their position, never a dense
     * re-index of `selectedItemIds`. Per-quest capacity (D 2026-11-20):
     * the well count comes from `poi.bagSlots`, so `emptyStashBag` is fed
     * the resolved capacity, not the global default. */
    expect(src).toMatch(/emptyStashBag\(capacity\)\.map/);
  });
});
