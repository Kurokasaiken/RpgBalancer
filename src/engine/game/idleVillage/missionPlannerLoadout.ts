/**
 * Mission Planner loadout application (MP-03, PLAN-018 T-003).
 *
 * Pure, single source of truth for "equip → effective stats": the same
 * function is consumed by the analytic engine (MP-01) and the runtime
 * resolver (MP-06), so the Planner preview and the rolled outcome can never
 * diverge on how equipment modifies a resident.
 *
 * Scope boundaries (canonical in mission_planner_data_model_fix.md §2.4):
 *   - `statDeltas` are applied here, to a COPY of the resident — the persisted
 *     `statSnapshot` is never mutated.
 *   - `durationDelta`, `durationMult`, `coverRiskDelta`, `qty` are party/quest
 *     level and are NOT applied here; the engine reads them from the catalog.
 *   - One item per slot; a slot→itemId map makes that structurally true.
 */

import {
  QUEST_EQUIP_SLOTS,
  type QuestEquipSlot,
  type QuestItem,
} from '@/balancing/config/idleVillage/quests/questItems.schema';
import type { ResidentState } from './TimeEngine';

/** Per-member loadout: slot → item id. At most one item per slot by construction. */
export type LoadoutAssignment = Partial<Record<QuestEquipSlot, string>>;

/** Item lookup consumed by the loadout math — the validated quest item pool. */
export type ItemCatalog = Readonly<Record<string, QuestItem>>;

/** Error codes raised by loadout application. */
export type LoadoutErrorCode = 'UNKNOWN_ITEM' | 'SLOT_MISMATCH';

/**
 * Typed error for invalid loadouts. Unknown or misassigned items are never
 * silently ignored — a wrong preview is worse than a loud failure.
 */
export class LoadoutError extends Error {
  /** Machine-readable failure code. */
  readonly code: LoadoutErrorCode;
  /** Offending item id, when applicable. */
  readonly itemId?: string;

  constructor(code: LoadoutErrorCode, message: string, itemId?: string) {
    super(message);
    this.name = 'LoadoutError';
    this.code = code;
    this.itemId = itemId;
  }
}

/** One additive stat contribution from a single equipped item (WHY feed). */
export interface LoadoutStatContribution {
  /** Item providing the delta. */
  itemId: string;
  /** Equipment slot the item occupies. */
  slot: QuestEquipSlot;
  /** Stat key modified. */
  stat: string;
  /** Additive delta applied to the carrier's stat. */
  delta: number;
}

/** Result of applying a loadout: effective resident + per-source contributions. */
export interface LoadoutResult {
  /** Copy of the input resident with equipment-modified `statSnapshot`. */
  resident: ResidentState;
  /** Contributions in canonical order (slot order, then stat key order). */
  contributions: LoadoutStatContribution[];
}

/**
 * Applies a member loadout to a resident, producing effective stats.
 *
 * Iterates `QUEST_EQUIP_SLOTS` in declaration order so the result and the
 * contribution list are deterministic regardless of key insertion order.
 * Equipment `statDeltas` are summed onto a copy of `statSnapshot`; stats not
 * declared by any item pass through unchanged.
 * @param resident - Resident to equip (never mutated)
 * @param loadout - Slot→itemId assignment for this member
 * @param catalog - Quest item catalog (defaults to the caller's pool)
 * @returns Effective-resident copy plus the per-item stat contributions
 * @throws LoadoutError - unknown item id, or an item whose kind/slot does not
 *   match the slot it was assigned to (the latter also covers reusing the same
 *   item across slots, since an item declares exactly one slot)
 */
export function applyLoadoutToResident(
  resident: ResidentState,
  loadout: LoadoutAssignment | undefined,
  catalog: ItemCatalog,
): LoadoutResult {
  const contributions: LoadoutStatContribution[] = [];
  const effectiveStats: Record<string, number> = { ...(resident.statSnapshot ?? {}) };

  if (loadout) {
    for (const slot of QUEST_EQUIP_SLOTS) {
      const itemId = loadout[slot];
      if (itemId === undefined) continue;

      const item = catalog[itemId];
      if (!item) {
        throw new LoadoutError(
          'UNKNOWN_ITEM',
          `Loadout references unknown item "${itemId}" in slot "${slot}".`,
          itemId,
        );
      }
      if (item.kind !== 'equipment' || item.slot !== slot) {
        throw new LoadoutError(
          'SLOT_MISMATCH',
          `Item "${itemId}" (${item.kind}${item.slot ? `, slot ${item.slot}` : ''}) cannot occupy slot "${slot}".`,
          itemId,
        );
      }

      for (const [stat, delta] of Object.entries(item.statDeltas ?? {})) {
        effectiveStats[stat] = (effectiveStats[stat] ?? 0) + delta;
        contributions.push({ itemId, slot, stat, delta });
      }
    }
  }

  return {
    resident: { ...resident, statSnapshot: effectiveStats as ResidentState['statSnapshot'] },
    contributions,
  };
}
