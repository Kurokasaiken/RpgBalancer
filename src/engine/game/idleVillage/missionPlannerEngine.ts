/**
 * Mission Planner engine (MP-01, PLAN-018 T-001).
 *
 * The rng-free analytic layer the Planner panel consumes: it turns a player
 * draft — party members with their loadouts, the party consumable pool, and
 * blueprint-authored phases — into the canonical outcome distribution of
 * `missionPlannerMath.ts` (normative: `mission_planner_math_spec.md`).
 *
 * Boundaries:
 *   - pure: no rng, no UI/store/persistence imports, no side effects;
 *   - residents pass through `applyLoadoutToResident` (MP-03) so effective
 *     stats are the single source of truth shared with the resolver (MP-06);
 *   - every number comes from config/catalog input — no local constants;
 *   - canonical ordering is enforced here: members by (slotIndex, residentId),
 *     contributions already sorted by the math layer; `serializeOutcome`
 *     emits the stable string used by the reversibility tests.
 */

import {
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  resolvePhaseDifficulty,
  type QuestSkillCheckConfig,
} from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import { questPhaseDurationMs } from '@/balancing/config/idleVillage/quests/questTimeScale';
import type {
  QuestBlueprint,
  QuestPhase,
} from '@/balancing/config/idleVillage/quests/questBlueprints.schema';
import type { ResidentState } from './TimeEngine';
import { resolvePhaseStatTags } from './questMilestones';
import {
  applyLoadoutToResident,
  LoadoutError,
  type ItemCatalog,
  type LoadoutAssignment,
} from './missionPlannerLoadout';
import {
  computeMissionPreview,
  type MissionConsumableSpec,
  type MissionItemEffect,
  type MissionMemberSpec,
  type MissionPhaseSpec,
  type MissionPlannerInput,
  type MissionPreviewResult,
} from './missionPlannerMath';

/** Error codes raised while turning a draft into a distribution. */
export type MissionPlannerEngineErrorCode = 'PARTY_TOO_LARGE' | 'UNKNOWN_ITEM' | 'NOT_CONSUMABLE';

/**
 * Typed error for invalid drafts. The engine refuses rather than silently
 * clamping the party or dropping items, because a wrong preview would feed
 * the launch contract with numbers the resolver cannot honour.
 */
export class MissionPlannerEngineError extends Error {
  /** Machine-readable failure code. */
  readonly code: MissionPlannerEngineErrorCode;

  constructor(code: MissionPlannerEngineErrorCode, message: string) {
    super(message);
    this.name = 'MissionPlannerEngineError';
    this.code = code;
  }
}

/** One drafted member: the resident, its quest slot, and its loadout. */
export interface MissionDraftMember {
  /** Base resident; loadout deltas are applied internally via MP-03. */
  resident: ResidentState;
  /** Quest slot index (canonical member ordering key). */
  slotIndex: number;
  /** Slot→itemId assignment for this member. */
  loadout?: LoadoutAssignment;
  /** Slot-level personal risk deltas in pp (residentRiskModifiers). */
  injuryChanceDelta?: number;
  deathChanceDelta?: number;
}

/** A consumable selected from the party pool (D3). */
export interface MissionDraftConsumable {
  itemId: string;
  /** Selected quantity; validated against the item's `qty` stock. */
  qty?: number;
}

/** The full planner draft: what the player configured, before resolution. */
export interface MissionDraft {
  /** Drafted members (any order — canonically sorted internally). */
  members: readonly MissionDraftMember[];
  /** Phases as consumed by the model (see {@link buildMissionPhaseSpecs}). */
  phases: readonly MissionPhaseSpec[];
  /** Selected consumables from the party pool. */
  consumables?: readonly MissionDraftConsumable[];
  /** Catalog used to resolve every referenced item id. */
  itemCatalog: ItemCatalog;
  /** Aggregate pp delta from empty required slots (shared penalty). */
  emptySlotPenalty?: MissionPlannerInput['emptySlotPenalty'];
  /** Tier reward multipliers (config-driven). */
  rewardMultipliers?: MissionPlannerInput['rewardMultipliers'];
  /** Floor for resolved duration, in ms (questTimeScale units). */
  durationMin?: number;
}

/**
 * Converts a blueprint's phases into model specs: resolved difficulty,
 * authored `checkStatTags`, base risk profile, duration in ms.
 * @param blueprint - Authored quest blueprint
 * @param config - Skill-check config
 * @returns Phase specs in blueprint order
 */
export function buildMissionPhaseSpecs(
  blueprint: QuestBlueprint,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): MissionPhaseSpec[] {
  return blueprint.phases.map((phase: QuestPhase) => {
    const requirements = phase.requirements as { difficultyLabel?: string } | undefined;
    return {
      phaseId: phase.id,
      difficulty: resolvePhaseDifficulty(
        {
          difficultyLabel: requirements?.difficultyLabel,
          blueprintDifficulty: blueprint.difficulty,
          phaseType: phase.type,
        },
        config,
      ),
      checkStatTags: resolvePhaseStatTags(phase),
      baseInjuryChance: phase.riskProfile?.injuryChance ?? 0,
      baseDeathChance: phase.riskProfile?.deathChance ?? 0,
      durationUnits: questPhaseDurationMs(phase),
    };
  });
}

/**
 * Builds the canonical math input from a draft.
 *
 * Members are sorted by (slotIndex, residentId); equipment contributes
 * effective stats (MP-03), personal risk deltas and cover deltas (D1) to the
 * member spec, and duration/reward deltas as item effects; consumables are
 * validated against the pool and keep their per-check deltas (D3).
 * @param draft - Player draft
 * @param config - Skill-check config (provides `partyStatMult`)
 * @returns Canonical `MissionPlannerInput` for {@link computeMissionPreview}
 * @throws MissionPlannerEngineError - party over the configured cap
 * @throws LoadoutError - invalid member loadout (propagated from MP-03)
 */
export function buildMissionInput(
  draft: MissionDraft,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): MissionPlannerInput {
  const maxMembers = config.plannerMaxMembers;
  if (draft.members.length > maxMembers) {
    throw new MissionPlannerEngineError(
      'PARTY_TOO_LARGE',
      `Mission draft has ${draft.members.length} members; the planner supports at most ${maxMembers} (questSkillCheckConfig.plannerMaxMembers).`,
    );
  }

  const sorted = [...draft.members].sort(
    (a, b) => a.slotIndex - b.slotIndex || a.resident.id.localeCompare(b.resident.id),
  );

  const itemEffects: MissionItemEffect[] = [];
  const members: MissionMemberSpec[] = sorted.map((entry) => {
    const loadout = applyLoadoutToResident(entry.resident, entry.loadout, draft.itemCatalog);

    let injuryDelta = entry.injuryChanceDelta ?? 0;
    let deathDelta = entry.deathChanceDelta ?? 0;
    let coverInjury = 0;
    let coverDeath = 0;

    if (entry.loadout) {
      for (const itemId of Object.values(entry.loadout)) {
        if (itemId === undefined) continue;
        const item = draft.itemCatalog[itemId];
        if (!item) {
          throw new LoadoutError('UNKNOWN_ITEM', `Unknown item "${itemId}".`, itemId);
        }
        injuryDelta += item.injuryChanceDelta ?? 0;
        deathDelta += item.deathChanceDelta ?? 0;
        coverInjury += item.coverRiskDelta?.injuryChance ?? 0;
        coverDeath += item.coverRiskDelta?.deathChance ?? 0;
        if (item.durationDelta || item.durationMult || item.rewardMultiplierDelta) {
          itemEffects.push({
            itemId: item.id,
            durationDelta: item.durationDelta,
            durationMult: item.durationMult,
            rewardMultiplierDelta: item.rewardMultiplierDelta,
          });
        }
      }
    }

    return {
      residentId: entry.resident.id,
      slotIndex: entry.slotIndex,
      stats: (loadout.resident.statSnapshot ?? {}) as Record<string, number>,
      injuryChanceDelta: injuryDelta,
      deathChanceDelta: deathDelta,
      coverInjuryChanceDelta: coverInjury,
      coverDeathChanceDelta: coverDeath,
    };
  });

  const consumables: MissionConsumableSpec[] = (draft.consumables ?? []).map((entry) => {
    const item = draft.itemCatalog[entry.itemId];
    if (!item) {
      throw new MissionPlannerEngineError(
        'UNKNOWN_ITEM',
        `Consumable "${entry.itemId}" is not in the item catalog.`,
      );
    }
    if (item.kind !== 'consumable') {
      throw new MissionPlannerEngineError(
        'NOT_CONSUMABLE',
        `Item "${entry.itemId}" is equipment; it must be assigned to a member slot.`,
      );
    }
    const qty = entry.qty ?? 1;
    if (qty < 1 || (item.qty !== undefined && qty > item.qty)) {
      throw new MissionPlannerEngineError(
        'UNKNOWN_ITEM',
        `Consumable "${entry.itemId}" selected with qty ${qty} exceeds available stock ${item.qty ?? 1}.`,
      );
    }
    return {
      itemId: item.id,
      injuryChanceDelta: (item.injuryChanceDelta ?? 0) * qty,
      deathChanceDelta: (item.deathChanceDelta ?? 0) * qty,
      rewardMultiplierDelta: (item.rewardMultiplierDelta ?? 0) * qty,
      durationDelta: (item.durationDelta ?? 0) * qty,
      durationMult: item.durationMult === undefined ? undefined : Math.pow(item.durationMult, qty),
    };
  });

  return {
    members,
    phases: draft.phases,
    consumables,
    itemEffects,
    emptySlotPenalty: draft.emptySlotPenalty,
    rewardMultipliers: draft.rewardMultipliers,
    partyStatMult: config.partyStatMult,
    durationMin: draft.durationMin,
  };
}

/**
 * Computes the exact outcome distribution of a draft — the single entry
 * point the Planner panel calls on every configuration change.
 * @param draft - Player draft
 * @param config - Skill-check config
 * @returns Canonical preview: tiers, per-member risks, aggregates, WHY
 */
export function questOutcomeDistribution(
  draft: MissionDraft,
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): MissionPreviewResult {
  return computeMissionPreview(buildMissionInput(draft, config), config);
}

/**
 * Canonical serialization of a preview, for the reversibility contract:
 * restoring a draft must reproduce the identical string, not just similar
 * numbers. Arrays are emitted in canonical order; floats are already
 * rounded to six decimals by the math layer.
 * @param result - Preview result to serialize
 * @returns Stable string suitable for deep equality checks
 */
export function serializeOutcome(result: MissionPreviewResult): string {
  return JSON.stringify(result);
}
