/**
 * questExpedition — pure launch-boundary logic (PLAN-019-S2.4 T-3).
 *
 * `buildExpeditionParty` is the authoritative re-validation the «Invia
 * spedizione» commit runs at the write boundary: slot completeness and
 * EVERY member's eligibility are recomputed from the freshest roster +
 * run state — a stale render can never smuggle a dead, away or
 * already-out resident into a frozen party.
 */
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { StatRequirement } from '@/balancing/config/idleVillage/types';
import { questResidentEligibility, residentInExpedition } from '@/ui/idleVillage/questS1Lab/questEligibility';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import type { LabMember } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { defaultQuestItems } from '@/balancing/config/idleVillage/quests/questItems';
import type { QuestItem } from '@/balancing/config/idleVillage/quests/questItems.schema';
import type { LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

/** Slot shape the boundary needs — decoupled from the controller's view
 *  model so tests build it directly. */
export interface ExpeditionSlotSpec {
  /** Blueprint id — the `assignments` map key. */
  blueprintId: string;
  required: boolean;
  role?: string;
  requirement?: StatRequirement;
}

/**
 * Builds the frozen party for launch, or `null` when any precondition
 * fails. Every member is re-validated: status per `QUEST_ELIGIBILITY`
 * (injured admitted), the union `inExpedition` lock across `activeRuns`,
 * and the slot's own stat requirement.
 */
export function buildExpeditionParty(
  slots: ExpeditionSlotSpec[],
  assignments: Record<string, string | null>,
  residentsById: Record<string, ResidentState | undefined>,
  activeRuns: ReadonlyArray<QuestRunState | null>,
): LabMember[] | null {
  if (!slots.some((s) => s.required)) return null;
  const members: LabMember[] = [];
  for (const slot of slots) {
    const residentId = assignments[slot.blueprintId];
    const resident = residentId ? residentsById[residentId] : undefined;
    if (slot.required && !resident) return null;
    if (!resident) continue;
    const base = questResidentEligibility(resident, slot.requirement, null);
    if (!base.eligible) return null;
    if (activeRuns.some((run) => residentInExpedition(resident.id, run))) return null;
    const role = (slot.role === 'leader' || slot.role === 'bodyguard' ? slot.role : 'member') as LabMember['role'];
    members.push(residentToQuestMember(resident, role));
  }
  if (!members.some((m) => m.role === 'leader')) return null;
  return members;
}

/* ------------------------------------------------------------------ */
/* Loadout duration channel (PLAN-019-S3 T-3, desiderata v24 #7).       */
/* ------------------------------------------------------------------ */

/**
 * Effective per-node tick pace of the expedition under a loadout:
 * `durationMult` multiplies (a mount at 0.5 halves the pace), `durationDelta`
 * adds caller ticks per node. The catalog declares the numbers; the engine
 * consumes the result through `clock.nodeTicks` at launch — a real effect
 * on frontier pacing, not a label.
 */
export interface LoadoutDuration {
  /** Per-node tick pace for `createRun`'s clock (never below 1). */
  nodeTicks: number;
  /** The whole-expedition estimate the duration chip shows — the POI's
   *  authored `estimatedDurationTicks` scaled by the same factor. */
  estimatedTicks: number;
  /** nodeTicks / baseNodeTicks — the signed pace change (1 = unmodified). */
  factor: number;
}

/** Whether a catalog item belongs to the expedition bag — every declared
 *  effect channel must be REAL in the graph engine: an `engineFlag` the run
 *  consumes, a duration channel (`durationMult`/`durationDelta`) that feeds
 *  `clock.nodeTicks`, or `coverRiskDelta` — wired into the harm bands by
 *  `coverDeltaFor` (PLAN-019-S4 T-5, D-S4-3). Items whose declared deltas
 *  nothing consumes (statDeltas/carrier risk deltas/rewardMultiplierDelta
 *  — the planner-era channels the graph engine ignores) stay OUT: the bag
 *  never sells a fake effect. */
export function isExpeditionItem(item: QuestItem): boolean {
  if (
    item.statDeltas !== undefined ||
    item.injuryChanceDelta !== undefined ||
    item.deathChanceDelta !== undefined ||
    item.rewardMultiplierDelta !== undefined
  ) {
    return false;
  }
  return Boolean(item.engineFlag || item.durationMult !== undefined || item.durationDelta !== undefined);
}

/** Computes the loadout's duration effect for a POI whose per-node pace is
 *  `baseNodeTicks` and whose authored estimate is `baseEstimatedTicks`. */
export function loadoutDuration(
  selectedItemIds: string[],
  baseNodeTicks: number,
  baseEstimatedTicks: number,
  items: Record<string, QuestItem> = defaultQuestItems,
): LoadoutDuration {
  let mult = 1;
  let delta = 0;
  for (const id of selectedItemIds) {
    const item = items[id];
    if (!item) continue;
    if (item.durationMult !== undefined) mult *= item.durationMult;
    if (item.durationDelta !== undefined) delta += item.durationDelta;
  }
  const nodeTicks = Math.max(1, Math.round(baseNodeTicks * mult + delta));
  const factor = baseNodeTicks > 0 ? nodeTicks / baseNodeTicks : 1;
  return { nodeTicks, estimatedTicks: Math.max(1, Math.round(baseEstimatedTicks * factor)), factor };
}

/* ------------------------------------------------------------------ */
/* Key-stat display tiers (PLAN-036, R-195).                            */
/* ------------------------------------------------------------------ */

/** One village-stocked consumable offered to the expedition bag (PLAN-036,
 *  R-195): the warehouse shelf row joined to its catalog entry — `qty`
 *  feeds the picker's stock badge. Source of truth: `VILLAGE_STASH_CONFIG`
 *  (its schema already guarantees a bag-legal consumable). */
export interface BagStockEntry {
  item: QuestItem;
  qty: number;
}

/** Primary/Secondary tier pair the forecast sidecar renders. */
export interface KeyStatTiers {
  primary: LabStat[];
  secondary: LabStat[];
}

/**
 * Resolves the scenario's planner key-stat tiers. Authored `keyStats` wins
 * verbatim (the refined contract — disjoint tiers, `primary ⊆ primaryStats`
 * — is a parse-time guarantee). Absent ⇒ deterministic presentation-only
 * fallback over the frozen `primaryStats` (NEVER mutated):
 *   `primary   = [primaryStats[0]]`             (index 0 exists — min(1))
 *   `secondary = primaryStats.slice(1).filter(s => s !== primaryStats[0])`
 * — disjoint by construction even when a legacy array duplicates a stat.
 * @param scenario Parsed scenario (or `undefined` while it resolves).
 * @returns The tiers to display; `primary: []` only when no scenario exists.
 */
export function deriveKeyStats(scenario: Pick<QuestScenario, 'primaryStats' | 'keyStats'> | undefined): KeyStatTiers {
  if (scenario?.keyStats) return { primary: scenario.keyStats.primary, secondary: scenario.keyStats.secondary };
  const stats = scenario?.primaryStats ?? [];
  const head = stats[0];
  if (!head) return { primary: [], secondary: [] };
  return { primary: [head], secondary: stats.slice(1).filter((s) => s !== head) };
}

/**
 * R-183 slot↔slot swap: the resident in `fromSlot` is dragged onto `toSlot`
 * without leaving the rack. Empty target → the resident moves; occupied
 * target → the two residents trade places. Both landings cross the same
 * eligibility gate a roster drop crosses (`isEligible(residentId, slotId)`),
 * so a swap can never park a resident where a direct drop would be refused.
 * @returns The next assignments map, or `null` when the move is refused
 *   (same slot, empty source, or an ineligible landing).
 */
export function planSlotSwap(
  assignments: Record<string, string | null>,
  fromSlot: string,
  toSlot: string,
  isEligible: (residentId: string, slotId: string) => boolean,
): Record<string, string | null> | null {
  if (fromSlot === toSlot) return null;
  const moving = assignments[fromSlot];
  if (!moving) return null;
  const displaced = assignments[toSlot] ?? null;
  if (!isEligible(moving, toSlot)) return null;
  if (displaced && !isEligible(displaced, fromSlot)) return null;
  return { ...assignments, [toSlot]: moving, [fromSlot]: displaced };
}
