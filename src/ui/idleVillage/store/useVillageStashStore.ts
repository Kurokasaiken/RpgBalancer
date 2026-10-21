/**
 * useVillageStashStore — the global village warehouse reservation ledger
 * (PLAN-073, artifact-r003).
 *
 * The shelf is ONE shared pool (Director ruling): every quest planner draws
 * from `VILLAGE_STASH_CONFIG.items[].qty` and an item reserved by one
 * planner's draft bag — or frozen into a live run — is unavailable to every
 * other planner. Per-session React state cannot express that, so the
 * authoritative bag lives here, keyed by the stable quest POI id.
 *
 * Invariants enforced at mutation time (never only by UI filtering):
 * - writes are gated on `hydration === 'ready'` (no write before hydrate,
 *   no silent overwrite after a persistence failure — `degraded` freezes
 *   the ledger instead of corrupting the saved snapshot);
 * - a bag holds at most one copy of each item;
 * - `assign`/`assignToSlot` re-check global availability inside the same
 *   synchronous `set`, so two planners racing on the last copy cannot both
 *   succeed;
 * - drops on an occupied slot swap atomically — the displaced item returns
 *   to the derived pool in the same transition;
 * - `commitRun` moves the owner's bag under the run id (same key
 *   `runIdOf` uses at settlement) and `releaseCommit` returns the items
 *   to the pool on every terminal transition.
 *
 * Persistence: versioned Zod-validated snapshot through
 * `PersistenceService` only (`idleVillage.stashLedger.v1`). A missing key
 * is first boot, not a failure. Hydration reconciles unknown item ids,
 * intra-bag duplicates, slot-count drift and reservations that exceed the
 * configured quantity (live committed runs win over draft bags).
 */

import { create } from 'zustand';
import { z } from 'zod';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { clearData, loadData, saveData } from '@/shared/persistence/PersistenceService';

/** Persistence key for the versioned ledger snapshot. */
export const STASH_LEDGER_KEY = 'idleVillage.stashLedger.v1';
/** Pre-PLAN-073 reservation key — wiped once at hydrate so stale mock-era rows never linger. */
const LEGACY_LOADOUT_KEY = 'idleVillage.expeditionLoadout';

/** Versioned persisted shape (Zod): draft bags by POI + committed slots by run id. */
export const stashLedgerV1Schema = z.object({
  version: z.literal(1),
  bags: z.record(z.string(), z.array(z.string().nullable())),
  committed: z.record(
    z.string(),
    z.object({ poiId: z.string(), slots: z.array(z.string().nullable()) }),
  ),
});
export type StashLedgerV1 = z.infer<typeof stashLedgerV1Schema>;

/** Hydration tri-state: `pending` blocks reads-for-write, `degraded` freezes the ledger. */
export type StashHydration = 'pending' | 'ready' | 'degraded';

/** Verdict returned by the assignment mutations — the UI maps it to localized feedback. */
export type StashAssignResult = 'ok' | 'bagFull' | 'unavailable' | 'alreadyInBag' | 'notReady';

/** Last ledger mutation, surfaced through `aria-live` announcements in planner and stash. */
export interface StashLedgerEvent {
  kind: 'assign' | 'release' | 'swap' | 'releaseAll' | 'commit' | 'rollback' | 'reject';
  poiId?: string;
  itemId?: string;
  reason?: StashAssignResult;
  at: number;
}

interface CommittedEntry {
  poiId: string;
  /** Exact slot layout taken from the bag — `rollbackCommit` restores it verbatim. */
  slots: (string | null)[];
}

export interface VillageStashState {
  hydration: StashHydration;
  /** poiId → slot array of catalog item ids (`QUEST_STASH.bagSlots` long). */
  bags: Record<string, (string | null)[]>;
  /** runId → frozen bag, released back to the pool on terminal transition. */
  committed: Record<string, CommittedEntry>;
  /** POI the open warehouse is bound to; `null` = read-only mode. */
  activeStashOwner: string | null;
  lastEvent: StashLedgerEvent | null;

  hydrate: () => Promise<void>;
  bindStash: (poiId: string | null) => void;
  /** Assigns `itemId` to the first free slot of `poiId`'s bag. */
  assign: (poiId: string, itemId: string) => StashAssignResult;
  /** Assigns `itemId` to a specific slot; an occupied slot swaps atomically. */
  assignToSlot: (poiId: string, itemId: string, slotIndex: number) => StashAssignResult;
  /** Releases whatever occupies `slotIndex` of `poiId`'s bag. */
  release: (poiId: string, slotIndex: number) => boolean;
  /** Releases every draft reservation owned by `poiId` (per-owner, like the party reset). */
  releaseAll: (poiId: string) => void;
  /** Freezes `poiId`'s bag under `runId` at quest launch (idempotent on runId). */
  commitRun: (runId: string, poiId: string) => boolean;
  /** Restores a committed bag when the launch aborts after `commitRun`. */
  rollbackCommit: (runId: string) => void;
  /** Releases a run's reservation — called on every terminal transition. */
  releaseCommit: (runId: string) => void;
}

/** Item ids stocked by the shelf — config is the only source. */
const QTY_BY_ITEM = new Map(VILLAGE_STASH_CONFIG.items.map((i) => [i.itemId, i.qty]));
const EMPTY_BAG = (): (string | null)[] => Array.from({ length: QUEST_STASH.bagSlots }, () => null);

/** Total reservations per item id across every draft bag and committed run. */
export function countReservations(
  bags: Record<string, (string | null)[]>,
  committed: Record<string, CommittedEntry>,
): Map<string, number> {
  const counts = new Map<string, number>();
  const bump = (id: string) => counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const slots of Object.values(bags)) for (const id of slots) if (id) bump(id);
  for (const c of Object.values(committed)) for (const id of c.slots) if (id) bump(id);
  return counts;
}

/** Copies of `itemId` still claimable worldwide. */
export function remainingFor(
  itemId: string,
  bags: Record<string, (string | null)[]>,
  committed: Record<string, CommittedEntry>,
): number {
  const qty = QTY_BY_ITEM.get(itemId) ?? 0;
  return Math.max(0, qty - (countReservations(bags, committed).get(itemId) ?? 0));
}

/**
 * Reconciles a persisted snapshot against the current config: unknown items
 * are dropped, intra-bag duplicates collapse, slots shrink/grow to
 * `bagSlots`, and over-quantity reservations are trimmed — committed runs
 * keep precedence because they mirror a live expedition.
 */
export function reconcileLedger(raw: StashLedgerV1): { bags: VillageStashState['bags']; committed: VillageStashState['committed'] } {
  const counts = new Map<string, number>();
  const claim = (id: string): boolean => {
    const n = counts.get(id) ?? 0;
    if (n >= (QTY_BY_ITEM.get(id) ?? 0)) return false;
    counts.set(id, n + 1);
    return true;
  };
  const committed: VillageStashState['committed'] = {};
  for (const [runId, c] of Object.entries(raw.committed)) {
    const slots = EMPTY_BAG().map((_, i) => {
      const id = c.slots[i] ?? null;
      return id && QTY_BY_ITEM.has(id) && claim(id) ? id : null;
    });
    if (slots.some(Boolean)) committed[runId] = { poiId: c.poiId, slots };
  }
  const bags: VillageStashState['bags'] = {};
  for (const [poiId, slots] of Object.entries(raw.bags)) {
    const seen = new Set<string>();
    const bag = EMPTY_BAG().map((_, i) => {
      const id = slots[i] ?? null;
      if (!id || !QTY_BY_ITEM.has(id) || seen.has(id) || !claim(id)) return null;
      seen.add(id);
      return id;
    });
    if (bag.some(Boolean)) bags[poiId] = bag;
  }
  return { bags, committed };
}

export const useVillageStashStore = create<VillageStashState>((set, get) => {
  const emit = (event: Omit<StashLedgerEvent, 'at'>) => set({ lastEvent: { ...event, at: Date.now() } });

  /** Write-through to PersistenceService — only post-hydrate; a failed save degrades the ledger. */
  const persist = () => {
    const { hydration, bags, committed } = get();
    if (hydration !== 'ready') return;
    void saveData(STASH_LEDGER_KEY, { version: 1, bags, committed } satisfies StashLedgerV1).catch(() =>
      set({ hydration: 'degraded' }),
    );
  };

  /** Availability re-checked inside the `set` callback — the mutation itself is the gate. */
  const putItem = (poiId: string, itemId: string, slotIndex: number | null): StashAssignResult => {
    /* Rejects are ledger events too — the aria-live surfaces announce them. */
    const fail = (reason: StashAssignResult): StashAssignResult => {
      emit({ kind: 'reject', poiId, itemId, reason });
      return reason;
    };
    if (get().hydration !== 'ready') return fail('notReady');
    if (!QTY_BY_ITEM.has(itemId)) return fail('unavailable');
    const bag = [...(get().bags[poiId] ?? EMPTY_BAG())];
    if (slotIndex !== null && (slotIndex < 0 || slotIndex >= bag.length)) return fail('unavailable');
    if (bag.includes(itemId)) return bag[slotIndex ?? -1] === itemId ? 'ok' : fail('alreadyInBag');
    if (remainingFor(itemId, get().bags, get().committed) <= 0) return fail('unavailable');
    const target = slotIndex ?? bag.indexOf(null);
    if (target < 0) return fail('bagFull');
    const displaced = bag[target];
    bag[target] = itemId;
    set((s) => ({ bags: { ...s.bags, [poiId]: bag } }));
    emit({ kind: displaced ? 'swap' : 'assign', poiId, itemId });
    persist();
    return 'ok';
  };

  return {
    hydration: 'pending',
    bags: {},
    committed: {},
    activeStashOwner: null,
    lastEvent: null,

    hydrate: async () => {
      if (get().hydration !== 'pending') return;
      try {
        const raw = await loadData<unknown>(STASH_LEDGER_KEY, null);
        if (raw == null) {
          /* First boot is not a failure — an empty ready ledger. */
          set({ hydration: 'ready' });
          return;
        }
        const parsed = stashLedgerV1Schema.safeParse(raw);
        if (!parsed.success) {
          set({ hydration: 'degraded' });
          return;
        }
        set({ hydration: 'ready', ...reconcileLedger(parsed.data) });
        /* The mock-era reservation key is superseded — wipe it so stale
         * rows can never be read back by an older surface. */
        void clearData(LEGACY_LOADOUT_KEY).catch(() => undefined);
      } catch {
        set({ hydration: 'degraded' });
      }
    },

    bindStash: (poiId) => set({ activeStashOwner: poiId }),

    assign: (poiId, itemId) => putItem(poiId, itemId, null),
    assignToSlot: (poiId, itemId, slotIndex) => putItem(poiId, itemId, slotIndex),

    release: (poiId, slotIndex) => {
      if (get().hydration !== 'ready') return false;
      const bag = [...(get().bags[poiId] ?? EMPTY_BAG())];
      const itemId = bag[slotIndex];
      if (!itemId) return false;
      bag[slotIndex] = null;
      set((s) => {
        const bags = { ...s.bags };
        if (bag.some(Boolean)) bags[poiId] = bag;
        else delete bags[poiId];
        return { bags };
      });
      emit({ kind: 'release', poiId, itemId });
      persist();
      return true;
    },

    releaseAll: (poiId) => {
      if (get().hydration !== 'ready') return;
      if (!get().bags[poiId]?.some(Boolean)) return;
      set((s) => {
        const bags = { ...s.bags };
        delete bags[poiId];
        return { bags };
      });
      emit({ kind: 'releaseAll', poiId });
      persist();
    },

    commitRun: (runId, poiId) => {
      if (get().hydration !== 'ready' || !runId) return false;
      const bag = get().bags[poiId] ?? EMPTY_BAG();
      set((s) => {
        const bags = { ...s.bags };
        delete bags[poiId];
        return {
          bags,
          committed: { ...s.committed, [runId]: { poiId, slots: bag } },
        };
      });
      emit({ kind: 'commit', poiId });
      persist();
      return true;
    },

    rollbackCommit: (runId) => {
      if (get().hydration !== 'ready') return;
      const entry = get().committed[runId];
      if (!entry) return;
      set((s) => {
        const committed = { ...s.committed };
        delete committed[runId];
        const bags = { ...s.bags };
        if (entry.slots.some(Boolean)) bags[entry.poiId] = entry.slots;
        return { bags, committed };
      });
      emit({ kind: 'rollback', poiId: entry.poiId });
      persist();
    },

    releaseCommit: (runId) => {
      if (!get().committed[runId]) return;
      set((s) => {
        const committed = { ...s.committed };
        delete committed[runId];
        return { committed };
      });
      emit({ kind: 'release' });
      persist();
    },
  };
});

export { EMPTY_BAG as emptyStashBag };

/** Non-null bag contents of `poiId` in slot order — the planner's `selectedItemIds` view. */
export const selectBagItemIds = (state: VillageStashState, poiId: string): string[] =>
  (state.bags[poiId] ?? EMPTY_BAG()).filter((id): id is string => Boolean(id));

/** Reservations held by owners OTHER than `excludePoiId` — the warehouse's «N elsewhere» counter. */
export const reservedElsewhereCount = (state: VillageStashState, excludePoiId: string | null): number => {
  let n = 0;
  for (const [poiId, slots] of Object.entries(state.bags)) {
    if (poiId === excludePoiId) continue;
    n += slots.filter(Boolean).length;
  }
  for (const c of Object.values(state.committed)) n += c.slots.filter(Boolean).length;
  return n;
};
