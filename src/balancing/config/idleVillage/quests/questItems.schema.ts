/**
 * Quest item / loadout schema (MP-02).
 *
 * Canonical Zod contract for equipment and consumables assignable to a quest
 * expedition in the Mission Planner. Every gameplay number lives here —
 * stat deltas feed the phase skill check, risk deltas feed the per-member
 * risk roll, duration/reward deltas feed the aggregate outcome.
 *
 * Semantics are normative in `src/docs/docs/idle_village/mission_planner_math_spec.md`
 * (risk composition §3.1, duration/reward §4.5) and field meanings in
 * `mission_planner_data_model_fix.md` §2.4.
 *
 *   - Equipment: one item per slot per member. `mount` is an equipment slot —
 *     a mount occupies the slot instead of being a free speed boost.
 *   - Consumables: a shared party pool (D3); their risk deltas apply to every
 *     living member's roll on each check.
 *   - Cover (D1): `coverRiskDelta` applies to every OTHER living member while
 *     the carrier is alive; it is how "aggiungi un membro → rischio degli altri
 *     cala" is expressed.
 */

import { z } from 'zod';

/** Equipment slot ids, authored here so UI and schema share one source. */
export const QUEST_EQUIP_SLOTS = ['weapon', 'armor', 'mount', 'trinket'] as const;
export type QuestEquipSlot = (typeof QUEST_EQUIP_SLOTS)[number];

/** Stat deltas applied to the carrier's effective stats before partyStatMult. */
export const StatDeltasSchema = z.record(z.string().min(1), z.number());

/**
 * Cover effect (D1): percentage-point risk deltas applied to every other
 * living party member while the carrier is alive. Negative values protect.
 */
export const CoverRiskDeltaSchema = z.object({
  injuryChance: z.number().min(-100).max(100).optional(),
  deathChance: z.number().min(-100).max(100).optional(),
});

/**
 * One quest item. `kind` splits the two usage modes:
 * - `equipment`: occupies `slot` on one member; stat/risk deltas apply to the
 *   carrier; `coverRiskDelta` applies to the other living members.
 * - `consumable`: party pool; risk deltas apply to every living member's roll
 *   on each phase; `qty` is the available stock.
 */
export const QuestItemSchema = z.object({
  id: z.string().min(1),
  /** i18n key suffix for the display label (resolved via idleVillage namespace). */
  labelKey: z.string().min(1),
  icon: z.string().optional(),
  kind: z.enum(['equipment', 'consumable']),

  /** Equipment only: the member slot this item occupies. */
  slot: z.enum(QUEST_EQUIP_SLOTS).optional(),

  /** Additive stat deltas on the carrier (equipment only). */
  statDeltas: StatDeltasSchema.optional(),

  /** Additive pp deltas on the carrier's phase risk (equipment only). */
  injuryChanceDelta: z.number().min(-100).max(100).optional(),
  deathChanceDelta: z.number().min(-100).max(100).optional(),

  /** Cover (D1): pp deltas applied to OTHER living members while carrier lives. */
  coverRiskDelta: CoverRiskDeltaSchema.optional(),

  /** Consumable-only stock count (party pool, D3). */
  qty: z.number().int().min(0).optional(),

  /** Additive quest-duration delta in normalized units. */
  durationDelta: z.number().optional(),
  /** Multiplicative quest-duration factor (e.g. a mount at 0.5 halves it). */
  durationMult: z.number().positive().optional(),

  /** Additive delta on the expected reward multiplier (e.g. 0.1 = +10%). */
  rewardMultiplierDelta: z.number().optional(),
})
  .refine(
    (item) => item.kind !== 'equipment' || item.slot !== undefined,
    { message: 'equipment items must declare a slot' },
  )
  .refine(
    (item) => item.kind !== 'consumable' || item.slot === undefined,
    { message: 'consumables do not occupy an equipment slot' },
  );

export const QuestItemsSchema = z.record(z.string(), QuestItemSchema);

export type QuestItem = z.infer<typeof QuestItemSchema>;
export type CoverRiskDelta = z.infer<typeof CoverRiskDeltaSchema>;
