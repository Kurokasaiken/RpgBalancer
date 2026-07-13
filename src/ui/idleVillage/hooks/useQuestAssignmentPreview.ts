import { useMemo } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import {
  calculatePartyPower,
  calculatePowerRatio,
  calculateQuestDifficulty,
  getOutcomeDistribution,
  QUEST_OUTCOMES,
  type OutcomeDistribution,
  type QuestPowerRules,
} from '@/engine/game/idleVillage/QuestPowerEngine';
import type { QuestItemMock } from '@/balancing/config/idleVillage/quests/questItemsMock';

export interface QuestAssignmentPreviewResult {
  partyPower: number;
  questDifficulty: number;
  powerRatio: number;
  distribution: OutcomeDistribution;
  /** Expected (probability-weighted) death chance across the distribution, 0-100. */
  projectedDeathChance: number;
  /** Expected (probability-weighted) injury chance across the distribution, 0-100. */
  projectedInjuryChance: number;
  /** Expected reward multiplier across the distribution. */
  projectedRewardMultiplier: number;
  /** False when a required slot is still empty. */
  canEmbark: boolean;
  /** Human-readable reasons blocking Embark (empty required slots). */
  blockingReasons: string[];
}

/**
 * Deterministic, rng-free live preview of a quest's outcome odds while the
 * player assigns residents/items. Only uses the pure QuestPowerEngine
 * functions (never rollQuestOutcome/resolveQuestPower, which consume rng and
 * would produce a different result on every render).
 */
export function useQuestAssignmentPreview(
  activity: ActivityDefinition,
  slots: ResidentSlotViewModel[],
  rules: QuestPowerRules,
  selectedItems: QuestItemMock[] = [],
): QuestAssignmentPreviewResult {
  return useMemo(() => {
    const assignedResidents = slots
      .filter((slot) => slot.assignedResident)
      .map((slot) => slot.assignedResident!);

    const emptyRequiredSlots = slots.filter((slot) => slot.required && !slot.assignedResidentId);
    const blockingReasons = emptyRequiredSlots.map(
      (slot) => `${slot.label} è obbligatorio ed è vuoto.`,
    );
    const canEmbark = emptyRequiredSlots.length === 0;

    // Party power, reduced by any empty-required-slot penalty multipliers.
    const basePartyPower = calculatePartyPower(assignedResidents, rules);
    const partyPowerMult = emptyRequiredSlots.reduce(
      (mult, slot) => mult * (slot.emptyPenalty?.partyPowerMult ?? 1),
      1,
    );
    const partyPower = basePartyPower * partyPowerMult;

    const questLevel = typeof activity.level === 'number' ? activity.level : 1;
    const dangerRating = typeof activity.dangerRating === 'number' ? activity.dangerRating : 0;
    const questDifficulty = calculateQuestDifficulty(questLevel, dangerRating, rules);
    const powerRatio = calculatePowerRatio(partyPower, questDifficulty);
    const distribution = getOutcomeDistribution(powerRatio, rules);

    const totalWeight = QUEST_OUTCOMES.reduce((sum, o) => sum + (distribution[o] ?? 0), 0);
    const expectedDeathChance =
      totalWeight > 0
        ? QUEST_OUTCOMES.reduce(
            (sum, o) => sum + (distribution[o] ?? 0) * (rules.deathChanceByOutcome[o] ?? 0),
            0,
          ) / totalWeight
        : 0;
    const expectedInjuryChance =
      totalWeight > 0
        ? QUEST_OUTCOMES.reduce(
            (sum, o) => sum + (distribution[o] ?? 0) * (rules.injuryChanceByOutcome[o] ?? 0),
            0,
          ) / totalWeight
        : 0;
    const expectedRewardMultiplier =
      totalWeight > 0
        ? QUEST_OUTCOMES.reduce(
            (sum, o) => sum + (distribution[o] ?? 0) * (rules.rewardMultipliers[o] ?? 1),
            0,
          ) / totalWeight
        : 1;

    // Percentage-point deltas from empty-slot penalties, per-slot resident risk
    // modifiers, and mock items — all additive on top of the expected values.
    //
    // NOTE: residentRiskModifiers are conceptually applied to the single resident
    // occupying the slot. The engine resolves outcomes per-resident, so the exact
    // expected value would aggregate each resident's individual risk. Here we
    // approximate by summing the per-slot deltas and adding them to the party-level
    // expected chance. This is intentionally deterministic and good enough for a
    // live preview; the precise per-resident roll only happens when Embark calls
    // resolveQuestPower / resolvePartyConsequences.
    const emptySlotDeltas = emptyRequiredSlots.reduce(
      (acc, slot) => ({
        deathDelta: acc.deathDelta + (slot.emptyPenalty?.extraDeathChance ?? 0),
        injuryDelta: acc.injuryDelta + (slot.emptyPenalty?.extraInjuryChance ?? 0),
      }),
      { deathDelta: 0, injuryDelta: 0 },
    );
    const residentRiskDeltas = slots
      .filter((slot) => slot.assignedResidentId && slot.residentRiskModifiers)
      .reduce(
        (acc, slot) => ({
          deathDelta: acc.deathDelta + (slot.residentRiskModifiers?.deathChanceDelta ?? 0),
          injuryDelta: acc.injuryDelta + (slot.residentRiskModifiers?.injuryChanceDelta ?? 0),
        }),
        { deathDelta: 0, injuryDelta: 0 },
      );
    const itemDeltas = selectedItems.reduce(
      (acc, item) => ({
        deathDelta: acc.deathDelta + (item.effect.deathChanceDelta ?? 0),
        injuryDelta: acc.injuryDelta + (item.effect.injuryChanceDelta ?? 0),
        rewardDelta: acc.rewardDelta + (item.effect.rewardMultiplierDelta ?? 0),
      }),
      { deathDelta: 0, injuryDelta: 0, rewardDelta: 0 },
    );

    const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

    const projectedDeathChance = clampPercent(
      expectedDeathChance * 100 +
        emptySlotDeltas.deathDelta +
        residentRiskDeltas.deathDelta +
        itemDeltas.deathDelta,
    );
    const projectedInjuryChance = clampPercent(
      expectedInjuryChance * 100 +
        emptySlotDeltas.injuryDelta +
        residentRiskDeltas.injuryDelta +
        itemDeltas.injuryDelta,
    );
    const projectedRewardMultiplier = Math.max(0, expectedRewardMultiplier + itemDeltas.rewardDelta);

    return {
      partyPower,
      questDifficulty,
      powerRatio,
      distribution,
      projectedDeathChance,
      projectedInjuryChance,
      projectedRewardMultiplier,
      canEmbark,
      blockingReasons,
    };
  }, [activity, slots, rules, selectedItems]);
}
