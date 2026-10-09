/**
 * expeditionLoadout — the expedition bag's real-item contract
 * (PLAN-019-S2.2 T-5).
 *
 * The bag reads the real `questItems` catalog (MP-02): every stash flag has
 * a catalog entry carrying `engineFlag`, so the player picks ITEM IDS and
 * the engine keeps consuming flags (I-3). Historic flags stay accepted —
 * the alias map is bidirectional.
 *
 * Consumption contract (critica r1/r2):
 * - source is the EXPEDITION BAG, never the resident inventory;
 * - the `loadout` is frozen into the run at creation;
 * - on creation the picked items are `reserved` KEYED ON runId — another
 *   expedition cannot pick them while the reservation stands;
 * - consumption during the run is recorded in the run state only;
 * - writeback to game state and release on every terminal transition
 *   (including `clear`) is S2.5's job — this module exposes the interface.
 */

import { QUEST_FLAG_TO_ITEM, QUEST_ITEM_TO_FLAG, toEngineFlag } from '@/balancing/config/idleVillage/quests/questItems';
import { QUEST_STASH, resolveStashLoadout } from '@/balancing/config/idleVillage/quests/questStash';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';

const SAVE_KEY = 'idleVillage.expeditionLoadout';

/** Persisted reservation state: runId → reserved catalog item ids. */
interface ExpeditionLoadoutState {
  reservations: Record<string, string[]>;
}

/**
 * Resolves a player loadout to engine flags. Accepts catalog item ids and
 * historic flags interchangeably; unknown entries dropped, duplicates
 * removed, result clamped to `QUEST_STASH.bagSlots`.
 * @param loadout - Item ids and/or engine flags in pick order.
 * @returns Engine flags for `QuestRunState.flags`.
 */
export function resolveExpeditionLoadout(loadout: string[] | undefined): string[] {
  return resolveStashLoadout((loadout ?? []).map(toEngineFlag));
}

/**
 * Maps engine flags back to catalog item ids (alias direction flag→item).
 * @param flags - Engine flags (e.g. from a persisted run's `flags`).
 * @returns Catalog item ids; flags without a catalog entry are dropped.
 */
export function flagsToItemIds(flags: string[]): string[] {
  return flags.map((f) => QUEST_FLAG_TO_ITEM.get(f)).filter((id): id is string => !!id);
}

/** Catalog items packable in the expedition bag (those with an engineFlag). */
export function expeditionBagItems(): string[] {
  return [...QUEST_ITEM_TO_FLAG.keys()];
}

async function readState(): Promise<ExpeditionLoadoutState> {
  return (await loadData<ExpeditionLoadoutState | null>(SAVE_KEY, null)) ?? { reservations: {} };
}

/**
 * Reserves the picked items on `runId` (call at run creation). A second
 * reservation under the same runId replaces the first (idempotent on the
 * run's own key).
 * @param runId - The run's persisted identity.
 * @param itemIds - Catalog item ids frozen into the run.
 */
export async function reserveLoadout(runId: string, itemIds: string[]): Promise<void> {
  const state = await readState();
  state.reservations[runId] = [...itemIds];
  await saveData(SAVE_KEY, state);
}

/**
 * Releases a run's reservation — called by S2.5 on every terminal
 * transition (settled, retreat, wipe, `clear`).
 * @param runId - The run whose reservation is released.
 */
export async function releaseLoadout(runId: string): Promise<void> {
  const state = await readState();
  if (!(runId in state.reservations)) return;
  delete state.reservations[runId];
  await saveData(SAVE_KEY, state);
}

/**
 * Item ids currently reserved by other runs — the picker excludes them.
 * @param excludeRunId - Reservation to ignore (the run being rebuilt).
 */
export async function reservedItemIds(excludeRunId?: string): Promise<Set<string>> {
  const state = await readState();
  const out = new Set<string>();
  for (const [runId, items] of Object.entries(state.reservations)) {
    if (runId === excludeRunId) continue;
    for (const id of items) out.add(id);
  }
  return out;
}

/** Guard kept for bag-capacity callers that still think in flags. */
export const EXPEDITION_BAG_SLOTS = QUEST_STASH.bagSlots;
