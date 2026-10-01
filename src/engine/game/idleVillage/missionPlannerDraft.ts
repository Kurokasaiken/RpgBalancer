/**
 * Mission Planner draft model (MP-04, PLAN-018 T-004).
 *
 * Pure state machine for the expedition draft — no React, no rng, no
 * persistence (the draft intentionally does NOT persist across panel close,
 * per desiderata v23). The React layer (`useMissionPlannerDraft`) wraps these
 * primitives; the launch contract is validated atomically here so the quest
 * resolver receives an all-or-nothing payload.
 *
 * Reversibility is structural: every operation returns a new draft object and
 * nothing outside the draft is touched, so undo/reset restore byte-identical
 * outcomes.
 */

import {
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  type QuestSkillCheckConfig,
} from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import type {
  QuestSlotEmptyPenalty,
  QuestSlotResidentRiskModifiers,
} from '@/ui/idleVillage/slots/types';
import type { QuestEquipSlot, QuestItem } from '@/balancing/config/idleVillage/quests/questItems.schema';
import type { ResidentState } from './TimeEngine';
import type { LoadoutAssignment } from './missionPlannerLoadout';
import type {
  MissionDraft,
  MissionDraftConsumable,
  MissionDraftMember,
} from './missionPlannerEngine';
import type {
  MissionPhaseSpec,
  MissionPlannerInput,
  MissionPreviewResult,
} from './missionPlannerMath';

// ---------------------------------------------------------------------------
// Draft model
// ---------------------------------------------------------------------------

/** The player-facing expedition draft — assignment, loadout, consumables. */
export interface MissionPlannerDraft {
  /** Quest slot id → resident id. */
  assignments: Record<string, string>;
  /** Resident id → slot→itemId loadout (loadouts follow the member). */
  loadouts: Record<string, LoadoutAssignment>;
  /** Item id → selected quantity from the party pool (D3). */
  consumables: Record<string, number>;
}

/** An empty draft — the baseline a fresh Planner panel starts from. */
export const emptyMissionPlannerDraft = (): MissionPlannerDraft => ({
  assignments: {},
  loadouts: {},
  consumables: {},
});

/** Minimal slot info the draft needs from the quest/activity config. */
export interface PlannerSlotSpec {
  id: string;
  /** Optional display label (already localized by the caller). */
  label?: string;
  required?: boolean;
  emptyPenalty?: QuestSlotEmptyPenalty;
  residentRiskModifiers?: QuestSlotResidentRiskModifiers;
}

/** Live domain state the draft validates against on every recompute. */
export interface PlannerLiveState {
  /** Residents by id — the roster source of truth. */
  residentsById: Readonly<Record<string, ResidentState | undefined>>;
  /** Quest slots in canonical order (index = engine slotIndex). */
  slots: readonly PlannerSlotSpec[];
  /** Validated quest item catalog. */
  itemCatalog: Readonly<Record<string, QuestItem>>;
}

// ---------------------------------------------------------------------------
// Operations (pure: draft in → draft out)
// ---------------------------------------------------------------------------

/**
 * Assigns a resident to a quest slot. Re-assigning the same resident to
 * another slot moves it (a resident cannot occupy two slots); its loadout
 * travels with the member.
 */
export function assignResident(
  draft: MissionPlannerDraft,
  slotId: string,
  residentId: string,
): MissionPlannerDraft {
  const assignments = { ...draft.assignments };
  for (const [slot, id] of Object.entries(assignments)) {
    if (id === residentId && slot !== slotId) delete assignments[slot];
  }
  assignments[slotId] = residentId;
  return { ...draft, assignments };
}

/**
 * Removes the member occupying a slot — its loadout is dropped too, keeping
 * draft↔member correspondence exact (the reversibility contract).
 */
export function removeMember(draft: MissionPlannerDraft, slotId: string): MissionPlannerDraft {
  const residentId = draft.assignments[slotId];
  if (residentId === undefined) return draft;
  const assignments = { ...draft.assignments };
  delete assignments[slotId];
  const loadouts = { ...draft.loadouts };
  delete loadouts[residentId];
  return { ...draft, assignments, loadouts };
}

/**
 * Sets (or clears, with `undefined`) the item in a member's equipment slot.
 * No-op when the resident is not drafted — the UI never manufactures a member
 * out of a loadout edit.
 */
export function setLoadoutItem(
  draft: MissionPlannerDraft,
  residentId: string,
  slot: QuestEquipSlot,
  itemId: string | undefined,
): MissionPlannerDraft {
  const drafted = Object.values(draft.assignments).includes(residentId);
  if (!drafted) return draft;
  const loadouts = { ...draft.loadouts };
  const next = { ...(loadouts[residentId] ?? {}) };
  if (itemId === undefined) {
    delete next[slot];
  } else {
    next[slot] = itemId;
  }
  if (Object.keys(next).length === 0) {
    delete loadouts[residentId];
  } else {
    loadouts[residentId] = next;
  }
  return { ...draft, loadouts };
}

/** Sets the selected quantity of a consumable; `qty <= 0` removes it. */
export function setConsumableQty(
  draft: MissionPlannerDraft,
  itemId: string,
  qty: number,
): MissionPlannerDraft {
  const consumables = { ...draft.consumables };
  if (qty <= 0) {
    delete consumables[itemId];
  } else {
    consumables[itemId] = Math.floor(qty);
  }
  return { ...draft, consumables };
}

// ---------------------------------------------------------------------------
// Validation against live state
// ---------------------------------------------------------------------------

/** Machine-readable reason a draft cannot launch. */
export type DraftInvalidReason =
  | 'EMPTY_REQUIRED_SLOT'
  | 'RESIDENT_MISSING'
  | 'ITEM_UNKNOWN'
  | 'ITEM_SLOT_MISMATCH'
  | 'CONSUMABLE_OVER_STOCK'
  | 'PARTY_TOO_LARGE';

/** One validation failure, with the offending entity for UI highlighting. */
export interface DraftIssue {
  reason: DraftInvalidReason;
  slotId?: string;
  residentId?: string;
  itemId?: string;
}

/** Result of validating a draft against the live domain state. */
export interface DraftValidation {
  /** True when the draft may launch (all required slots filled and valid). */
  canEmbark: boolean;
  issues: DraftIssue[];
  /** Resident ids drafted but absent from the live roster (invalidated). */
  invalidatedResidentIds: string[];
}

/**
 * Validates the draft against live domain state. A drafted resident that no
 * longer exists in the roster invalidates the draft (warning + canEmbark
 * false) — the Planner never presents stale numbers as viable.
 */
export function validateDraft(
  draft: MissionPlannerDraft,
  live: PlannerLiveState,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): DraftValidation {
  const issues: DraftIssue[] = [];
  const invalidatedResidentIds: string[] = [];

  const memberCount = Object.keys(draft.assignments).length;
  if (memberCount > config.plannerMaxMembers) {
    issues.push({ reason: 'PARTY_TOO_LARGE' });
  }

  for (const slot of live.slots) {
    if (slot.required && !draft.assignments[slot.id]) {
      issues.push({ reason: 'EMPTY_REQUIRED_SLOT', slotId: slot.id });
    }
  }

  for (const residentId of Object.values(draft.assignments)) {
    if (!live.residentsById[residentId]) {
      invalidatedResidentIds.push(residentId);
      issues.push({ reason: 'RESIDENT_MISSING', residentId });
    }
  }

  for (const [residentId, loadout] of Object.entries(draft.loadouts)) {
    for (const [slot, itemId] of Object.entries(loadout)) {
      if (itemId === undefined) continue;
      const item = live.itemCatalog[itemId];
      if (!item) {
        issues.push({ reason: 'ITEM_UNKNOWN', residentId, itemId });
      } else if (item.kind !== 'equipment' || item.slot !== slot) {
        issues.push({ reason: 'ITEM_SLOT_MISMATCH', residentId, itemId });
      }
    }
  }

  for (const [itemId, qty] of Object.entries(draft.consumables)) {
    const item = live.itemCatalog[itemId];
    if (!item || item.kind !== 'consumable') {
      issues.push({ reason: 'ITEM_UNKNOWN', itemId });
    } else if (item.qty !== undefined && qty > item.qty) {
      issues.push({ reason: 'CONSUMABLE_OVER_STOCK', itemId });
    }
  }

  return {
    canEmbark: issues.length === 0,
    issues,
    invalidatedResidentIds,
  };
}

// ---------------------------------------------------------------------------
// Draft → engine input
// ---------------------------------------------------------------------------

/**
 * Translates a draft into the engine `MissionDraft`. Invalid entries are
 * skipped (members whose resident vanished, mismatched items) — the engine
 * still previews what would happen with the remaining party, while
 * `validateDraft` separately blocks the launch.
 */
export function toMissionDraft(
  draft: MissionPlannerDraft,
  live: PlannerLiveState,
  phases: readonly MissionPhaseSpec[],
): MissionDraft {
  const members: MissionDraftMember[] = [];
  let emptyDeath = 0;
  let emptyInjury = 0;

  live.slots.forEach((slot, slotIndex) => {
    const residentId = draft.assignments[slot.id];
    const resident = residentId ? live.residentsById[residentId] : undefined;
    if (!resident) {
      // An empty slot pays its declared penalty whether or not it is
      // required — optional slots use it to price "leaving support empty".
      if (slot.emptyPenalty) {
        emptyDeath += slot.emptyPenalty.extraDeathChance ?? 0;
        emptyInjury += slot.emptyPenalty.extraInjuryChance ?? 0;
      }
      return;
    }
    members.push({
      resident,
      slotIndex,
      loadout: draft.loadouts[resident.id],
      injuryChanceDelta: slot.residentRiskModifiers?.injuryChanceDelta,
      deathChanceDelta: slot.residentRiskModifiers?.deathChanceDelta,
    });
  });

  const consumables: MissionDraftConsumable[] = Object.entries(draft.consumables).map(
    ([itemId, qty]) => ({ itemId, qty }),
  );

  return {
    members,
    phases,
    consumables,
    itemCatalog: live.itemCatalog,
    emptySlotPenalty:
      emptyDeath || emptyInjury
        ? { deathChanceDelta: emptyDeath, injuryChanceDelta: emptyInjury }
        : undefined,
    durationMin: undefined,
  };
}

// ---------------------------------------------------------------------------
// Outcome delta (vs previous canonical output)
// ---------------------------------------------------------------------------

/** Per-metric delta between two previews (curr − prev), pp or units. */
export interface OutcomeDeltas {
  success: number;
  injury: number;
  death: number;
  duration: number;
  reward: number;
}

/** Computes headline deltas between two previews; null when `prev` is absent. */
export function diffOutcomes(
  prev: MissionPreviewResult | null,
  curr: MissionPreviewResult,
): OutcomeDeltas | null {
  if (!prev) return null;
  return {
    success: curr.questSuccess - prev.questSuccess,
    injury: curr.aggregate.anyInjury - prev.aggregate.anyInjury,
    death: curr.aggregate.anyDeath - prev.aggregate.anyDeath,
    duration: curr.duration - prev.duration,
    reward: curr.expectedRewardMultiplier - prev.expectedRewardMultiplier,
  };
}

// ---------------------------------------------------------------------------
// Launch contract
// ---------------------------------------------------------------------------

/** Typed launch payload consumed by the quest resolver (MP-06). */
export interface MissionLaunchPayload {
  questId: string;
  party: Array<{
    residentId: string;
    slotId: string;
    loadout: LoadoutAssignment;
  }>;
  consumables: Array<{ itemId: string; qty: number }>;
}

export type LaunchPayloadResult =
  | { ok: true; payload: MissionLaunchPayload }
  | { ok: false; issues: DraftIssue[] };

/**
 * Builds the launch payload — atomic validation: either the whole draft is
 * valid and the payload is complete, or nothing is produced and every issue
 * is reported. The caller owns the actual embark; if embark fails after a
 * valid payload, restoring is trivial because the draft object is immutable
 * and untouched (rollback = keep the draft).
 */
export function buildLaunchPayload(
  draft: MissionPlannerDraft,
  live: PlannerLiveState,
  questId: string,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): LaunchPayloadResult {
  const validation = validateDraft(draft, live, config);
  if (!validation.canEmbark) {
    return { ok: false, issues: validation.issues };
  }
  return {
    ok: true,
    payload: {
      questId,
      party: Object.entries(draft.assignments).map(([slotId, residentId]) => ({
        residentId,
        slotId,
        loadout: draft.loadouts[residentId] ?? {},
      })),
      consumables: Object.entries(draft.consumables).map(([itemId, qty]) => ({
        itemId,
        qty,
      })),
    },
  };
}
