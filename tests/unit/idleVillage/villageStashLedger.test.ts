/**
 * PLAN-073 village stash ledger — reducer/hydration/persistence contract:
 * shared pool across planners, atomic assign/release/swap, release-all,
 * commit/rollback at the launch boundary, versioned hydration reconcile and
 * the no-write-before-hydrate / degraded-freeze gates.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/* In-memory PersistenceService — the ledger never sees real storage in unit. */
const memory = new Map<string, unknown>();
vi.mock('@/shared/persistence/PersistenceService', () => ({
  loadData: vi.fn(async (key: string, fallback: unknown) => (memory.has(key) ? memory.get(key) : fallback)),
  saveData: vi.fn(async (key: string, data: unknown) => {
    memory.set(key, data);
  }),
  clearData: vi.fn(async (key: string) => {
    memory.delete(key);
  }),
}));

import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import {
  STASH_LEDGER_KEY,
  countReservations,
  emptyStashBag,
  reconcileLedger,
  remainingFor,
  reservedElsewhereCount,
  useVillageStashStore,
  type VillageStashState,
} from '@/ui/idleVillage/store/useVillageStashStore';

const S = () => useVillageStashStore.getState();
const POI_A = 'poi-goblin';
const POI_B = 'poi-rovine';
const ITEM = VILLAGE_STASH_CONFIG.items[0].itemId;
const ITEM2 = VILLAGE_STASH_CONFIG.items[1].itemId;

/** Reset the store to a hydrated-empty ledger before each test. */
const reset = () => {
  memory.clear();
  useVillageStashStore.setState({
    hydration: 'ready',
    bags: {},
    committed: {},
    activeStashOwner: null,
    lastEvent: null,
  } as Partial<VillageStashState>);
};

beforeEach(reset);

// INV:PLAN-073-stash-global-ledger
describe('villageStash ledger — assign/release', () => {
  it('assigns to the first free slot and marks the item unavailable', () => {
    expect(S().assign(POI_A, ITEM)).toBe('ok');
    expect(S().bags[POI_A]).toEqual([ITEM, null, null].slice(0, QUEST_STASH.bagSlots));
    expect(remainingFor(ITEM, S().bags, S().committed)).toBe(0);
  });

  it('fills the first FREE slot, not the tail (release in the middle first)', () => {
    S().assign(POI_A, ITEM);
    S().assign(POI_A, ITEM2);
    S().assign(POI_A, VILLAGE_STASH_CONFIG.items[2].itemId);
    S().release(POI_A, 1);
    const third = VILLAGE_STASH_CONFIG.items[3].itemId;
    expect(S().assign(POI_A, third)).toBe('ok');
    expect(S().bags[POI_A][1]).toBe(third);
  });

  it('rejects a duplicate of the same item inside one bag', () => {
    S().assign(POI_A, ITEM);
    expect(S().assign(POI_A, ITEM)).toBe('alreadyInBag');
    expect(S().bags[POI_A].filter(Boolean)).toHaveLength(1);
  });

  it('rejects with bagFull when every slot is packed — no mutation', () => {
    for (const { itemId } of VILLAGE_STASH_CONFIG.items.slice(0, QUEST_STASH.bagSlots)) S().assign(POI_A, itemId);
    const extra = VILLAGE_STASH_CONFIG.items[QUEST_STASH.bagSlots].itemId;
    expect(S().assign(POI_A, extra)).toBe('bagFull');
    expect(S().bags[POI_A]).not.toContain(extra);
    expect(S().lastEvent?.kind).toBe('reject');
    expect(S().lastEvent?.reason).toBe('bagFull');
  });

  it('rejects unknown / globally unavailable items without mutation', () => {
    expect(S().assign(POI_A, 'quest_weapon_iron_blade')).toBe('unavailable');
    S().assign(POI_B, ITEM); // the only copy is held by POI_B
    expect(S().assign(POI_A, ITEM)).toBe('unavailable');
    expect(S().bags[POI_A]).toBeUndefined();
  });

  it('two planners compete for the same single copy — only one wins', () => {
    expect(S().assign(POI_A, ITEM)).toBe('ok');
    expect(S().assign(POI_B, ITEM)).toBe('unavailable');
    /* Releasing A's copy restores the pool — B can claim it now. */
    S().release(POI_A, 0);
    expect(S().assign(POI_B, ITEM)).toBe('ok');
  });

  it('release returns the copy to the derived pool', () => {
    S().assign(POI_A, ITEM);
    expect(remainingFor(ITEM, S().bags, S().committed)).toBe(0);
    S().release(POI_A, 0);
    expect(remainingFor(ITEM, S().bags, S().committed)).toBe(VILLAGE_STASH_CONFIG.items[0].qty);
    expect(S().bags[POI_A]).toBeUndefined();
  });

  it('release on an empty slot is a safe no-op', () => {
    expect(S().release(POI_A, 0)).toBe(false);
  });
});

describe('villageStash ledger — swap / releaseAll / commit', () => {
  it('assignToSlot on an occupied slot swaps atomically', () => {
    S().assign(POI_A, ITEM);
    S().assignToSlot(POI_A, ITEM2, 0);
    expect(S().bags[POI_A][0]).toBe(ITEM2);
    /* The displaced copy is back in the pool in the same transition. */
    expect(remainingFor(ITEM, S().bags, S().committed)).toBe(VILLAGE_STASH_CONFIG.items[0].qty);
    expect(S().lastEvent?.kind).toBe('swap');
  });

  it('assignToSlot dropping the item on its own slot is an idempotent ok', () => {
    S().assign(POI_A, ITEM);
    expect(S().assignToSlot(POI_A, ITEM, 0)).toBe('ok');
    expect(S().bags[POI_A][0]).toBe(ITEM);
  });

  it('releaseAll empties only the owner bag — other owners keep theirs', () => {
    S().assign(POI_A, ITEM);
    S().assign(POI_B, ITEM2);
    S().releaseAll(POI_A);
    expect(S().bags[POI_A]).toBeUndefined();
    expect(S().bags[POI_B]).toEqual([ITEM2, ...emptyStashBag().slice(1)]);
  });

  it('commitRun freezes the owner bag under the run id and is idempotent', () => {
    S().assign(POI_A, ITEM);
    expect(S().commitRun('run-1', POI_A)).toBe(true);
    expect(S().bags[POI_A]).toBeUndefined();
    expect(S().committed['run-1'].slots[0]).toBe(ITEM);
    /* committed stock is out of the pool — nobody can pack it. */
    expect(S().assign(POI_B, ITEM)).toBe('unavailable');
    expect(S().commitRun('run-1', POI_A)).toBe(true); // idempotent on the same key
  });

  it('rollbackCommit restores the exact slot layout', () => {
    S().assign(POI_A, ITEM);
    S().release(POI_A, 0);
    S().assign(POI_A, ITEM2); // packed in slot 0... force a hole: put ITEM2 in slot 1 via assignToSlot
    S().assignToSlot(POI_A, ITEM, 2);
    const before = [...S().bags[POI_A]];
    S().commitRun('run-2', POI_A);
    S().rollbackCommit('run-2');
    expect(S().bags[POI_A]).toEqual(before);
    expect(S().committed['run-2']).toBeUndefined();
  });

  it('releaseCommit returns committed copies to the pool', () => {
    S().assign(POI_A, ITEM);
    S().commitRun('run-3', POI_A);
    expect(remainingFor(ITEM, S().bags, S().committed)).toBe(0);
    S().releaseCommit('run-3');
    expect(remainingFor(ITEM, S().bags, S().committed)).toBe(VILLAGE_STASH_CONFIG.items[0].qty);
  });
});

describe('villageStash ledger — hydration gate & reconciliation', () => {
  it('first boot: missing key hydrates ready-empty, not degraded', async () => {
    useVillageStashStore.setState({ hydration: 'pending' } as Partial<VillageStashState>);
    await S().hydrate();
    expect(S().hydration).toBe('ready');
    expect(S().bags).toEqual({});
  });

  it('blocks every mutation while pending or degraded', async () => {
    useVillageStashStore.setState({ hydration: 'pending' } as Partial<VillageStashState>);
    expect(S().assign(POI_A, ITEM)).toBe('notReady');
    useVillageStashStore.setState({ hydration: 'degraded' } as Partial<VillageStashState>);
    expect(S().assign(POI_A, ITEM)).toBe('notReady');
    expect(S().release(POI_A, 0)).toBe(false);
  });

  it('a corrupted snapshot degrades instead of overwriting', async () => {
    memory.set(STASH_LEDGER_KEY, { version: 99, bogus: true });
    useVillageStashStore.setState({ hydration: 'pending' } as Partial<VillageStashState>);
    await S().hydrate();
    expect(S().hydration).toBe('degraded');
    /* The corrupt snapshot stays untouched — no silent overwrite. */
    expect(memory.get(STASH_LEDGER_KEY)).toEqual({ version: 99, bogus: true });
  });

  it('persists a versioned snapshot after each mutation (round trip)', async () => {
    S().assign(POI_A, ITEM);
    S().commitRun('run-p', POI_B);
    await Promise.resolve();
    const saved = memory.get(STASH_LEDGER_KEY) as { version: number; bags: Record<string, unknown[]> };
    expect(saved.version).toBe(1);
    expect(saved.bags[POI_A][0]).toBe(ITEM);
  });

  it('reconcileLedger drops unknown items, intra-bag duplicates and slot-count drift', () => {
    const { bags } = reconcileLedger({
      version: 1,
      bags: {
        [POI_A]: ['ghost-item', ITEM, ITEM, ITEM2, 'extra-slot-junk'], // unknown + dup + overflow
      },
      committed: {},
    });
    expect(bags[POI_A]).toEqual([null, ITEM, null, ITEM2, null].slice(0, QUEST_STASH.bagSlots));
  });

  it('reconcileLedger lets committed runs win over draft bags on scarce stock', () => {
    const { bags, committed } = reconcileLedger({
      version: 1,
      bags: { [POI_A]: [ITEM, null, null] },
      committed: { 'run-x': { poiId: POI_B, slots: [ITEM, null, null] } },
    });
    expect(committed['run-x'].slots[0]).toBe(ITEM);
    expect(bags[POI_A]).toBeUndefined(); // trimmed — the run owns the copy
  });

  it('hydrate applies reconciliation to a real persisted snapshot', async () => {
    memory.set(STASH_LEDGER_KEY, {
      version: 1,
      bags: { [POI_A]: [ITEM, ITEM2, 'junk'] },
      committed: { 'run-z': { poiId: POI_B, slots: [ITEM2, null, null] } },
    });
    useVillageStashStore.setState({ hydration: 'pending' } as Partial<VillageStashState>);
    await S().hydrate();
    expect(S().hydration).toBe('ready');
    /* ITEM2 belongs to the committed run — the bag keeps only ITEM. */
    expect(S().bags[POI_A][0]).toBe(ITEM);
    expect(S().bags[POI_A][1]).toBeNull();
    expect(S().committed['run-z'].slots[0]).toBe(ITEM2);
  });
});

describe('villageStash ledger — derived counters', () => {
  it('countReservations covers bags + committed; reservedElsewhereCount excludes the owner', () => {
    S().assign(POI_A, ITEM);
    S().assign(POI_B, ITEM2);
    S().assign(POI_A, VILLAGE_STASH_CONFIG.items[2].itemId);
    S().commitRun('run-c', POI_B);
    const counts = countReservations(S().bags, S().committed);
    expect(counts.get(ITEM)).toBe(1);
    expect(counts.get(ITEM2)).toBe(1);
    expect(reservedElsewhereCount(S(), POI_A)).toBe(1); // only the run-committed copy
    expect(reservedElsewhereCount(S(), null)).toBe(3);
  });
});
