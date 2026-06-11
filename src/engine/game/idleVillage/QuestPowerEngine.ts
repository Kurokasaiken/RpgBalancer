/**
 * QuestPowerEngine — EffectivePower calculation and quest outcome distribution.
 *
 * Pure functions, config-first. No hardcoded numbers.
 *
 * Design (§12.4):
 * 1. Calculate `EffectivePower` from party stat snapshots vs quest stat requirements.
 * 2. Normalize power relative to quest difficulty (level + dangerRating).
 * 3. Map normalized power → outcome distribution (perfect/success/partial/fail/deadly).
 * 4. Roll against the distribution to determine the quest outcome.
 * 5. Apply outcome-specific reward/injury/death modifiers.
 */

import type { ActivityDefinition, GlobalRules } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from './TimeEngine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Possible quest outcomes ordered from best to worst. */
export type QuestOutcome = 'perfect' | 'success' | 'partial' | 'fail' | 'deadly';

export const QUEST_OUTCOMES: readonly QuestOutcome[] = [
  'perfect',
  'success',
  'partial',
  'fail',
  'deadly',
] as const;

/** Distribution weights for each outcome. Values don't need to sum to 1 — they're normalized internally. */
export type OutcomeDistribution = Record<QuestOutcome, number>;

/** Config block added to GlobalRules for quest power calculations. */
export interface QuestPowerRules {
  /**
   * Stat keys used to compute power when the activity doesn't specify `statRequirement`.
   * Defaults to ['hp', 'damage'].
   */
  defaultPowerStats: string[];

  /**
   * How much a single stat point contributes to power.
   * E.g. 1 hp → 0.01 power, 1 damage → 0.05 power.
   * Keys are stat names, values are weights.
   */
  statWeights: Record<string, number>;

  /**
   * Base power expected from a single level-1 resident with average stats.
   * Used to normalize the power score. Higher values make quests easier.
   */
  basePowerPerLevel: number;

  /**
   * How much the danger rating multiplies effective difficulty.
   * effectiveDifficulty = questLevel * (1 + dangerRating * dangerScaling)
   */
  dangerScaling: number;

  /**
   * Hero power bonus multiplier.
   * A hero resident's power contribution is multiplied by this factor.
   */
  heroPowerMultiplier: number;

  /**
   * Fatigue penalty: power is reduced by fatigue * this factor.
   * fatiguePenaltyFactor: 0.005 means 100 fatigue → -50% power.
   */
  fatiguePenaltyFactor: number;

  /**
   * Injury penalty: power multiplier when resident is injured.
   * e.g. 0.6 → injured residents contribute only 60% of their power.
   */
  injuryPowerMultiplier: number;

  /**
   * Outcome distribution breakpoints.
   * Each entry maps a `powerRatio` threshold to an outcome distribution.
   * PowerRatio = partyPower / effectiveDifficulty.
   * Entries are checked from highest threshold to lowest.
   *
   * Example:
   *   { threshold: 2.0, distribution: { perfect: 60, success: 30, partial: 8, fail: 2, deadly: 0 } }
   *   { threshold: 1.0, distribution: { perfect: 10, success: 40, partial: 30, fail: 15, deadly: 5 } }
   *   { threshold: 0.5, distribution: { perfect: 0, success: 10, partial: 25, fail: 40, deadly: 25 } }
   *   { threshold: 0,   distribution: { perfect: 0, success: 0, partial: 10, fail: 50, deadly: 40 } }
   */
  outcomeBreakpoints: Array<{
    threshold: number;
    distribution: OutcomeDistribution;
  }>;

  /**
   * Reward multipliers per outcome.
   * Applied to base quest rewards after outcome resolution.
   */
  rewardMultipliers: Record<QuestOutcome, number>;

  /**
   * Injury chance per outcome (0-1).
   * Applied to each party member independently.
   */
  injuryChanceByOutcome: Record<QuestOutcome, number>;

  /**
   * Death chance per outcome (0-1).
   * Applied to each party member independently, after injury check.
   */
  deathChanceByOutcome: Record<QuestOutcome, number>;
}

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export const DEFAULT_QUEST_POWER_RULES: QuestPowerRules = {
  defaultPowerStats: ['hp', 'damage'],
  statWeights: {
    hp: 0.01,
    damage: 0.04,
    agility: 0.02,
    evasion: 0.03,
    armor: 0.02,
  },
  basePowerPerLevel: 5,
  dangerScaling: 0.25,
  heroPowerMultiplier: 1.5,
  fatiguePenaltyFactor: 0.005,
  injuryPowerMultiplier: 0.6,

  outcomeBreakpoints: [
    {
      threshold: 2.0,
      distribution: { perfect: 60, success: 30, partial: 8, fail: 2, deadly: 0 },
    },
    {
      threshold: 1.5,
      distribution: { perfect: 25, success: 45, partial: 20, fail: 8, deadly: 2 },
    },
    {
      threshold: 1.0,
      distribution: { perfect: 10, success: 35, partial: 30, fail: 18, deadly: 7 },
    },
    {
      threshold: 0.7,
      distribution: { perfect: 2, success: 15, partial: 30, fail: 35, deadly: 18 },
    },
    {
      threshold: 0.0,
      distribution: { perfect: 0, success: 5, partial: 15, fail: 40, deadly: 40 },
    },
  ],

  rewardMultipliers: {
    perfect: 1.5,
    success: 1.0,
    partial: 0.5,
    fail: 0.1,
    deadly: 0.0,
  },

  injuryChanceByOutcome: {
    perfect: 0.0,
    success: 0.05,
    partial: 0.20,
    fail: 0.40,
    deadly: 0.70,
  },

  deathChanceByOutcome: {
    perfect: 0.0,
    success: 0.0,
    partial: 0.02,
    fail: 0.05,
    deadly: 0.15,
  },
};

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Calculate the effective power of a single resident for a quest.
 * Uses stat weights from config, adjusted for fatigue, hero status, injury.
 */
export function calculateResidentPower(
  resident: ResidentState,
  rules: QuestPowerRules,
): number {
  const stats = resident.statSnapshot ?? {};

  // Sum weighted stats
  let rawPower = 0;
  for (const [statKey, weight] of Object.entries(rules.statWeights)) {
    const statVal = stats[statKey];
    if (typeof statVal === 'number' && Number.isFinite(statVal)) {
      rawPower += statVal * weight;
    }
  }

  // Hero bonus
  if (resident.isHero) {
    rawPower *= rules.heroPowerMultiplier;
  }

  // Fatigue penalty
  const fatiguePenalty = (resident.fatigue ?? 0) * rules.fatiguePenaltyFactor;
  rawPower *= Math.max(0, 1 - fatiguePenalty);

  // Injury penalty
  if (resident.isInjured) {
    rawPower *= rules.injuryPowerMultiplier;
  }

  return Math.max(0, rawPower);
}

/**
 * Calculate the total effective power of a party of residents.
 */
export function calculatePartyPower(
  residents: ResidentState[],
  rules: QuestPowerRules,
): number {
  if (residents.length === 0) return 0;
  let total = 0;
  for (const r of residents) {
    total += calculateResidentPower(r, rules);
  }
  return total;
}

/**
 * Calculate the effective difficulty of a quest based on level and danger rating.
 * Optional difficultyMultiplier applies variance (e.g., 0.7-1.3 for undertuned/overtuned).
 */
export function calculateQuestDifficulty(
  questLevel: number,
  dangerRating: number,
  rules: QuestPowerRules,
  difficultyMultiplier?: number,
): number {
  const baseDifficulty = rules.basePowerPerLevel * questLevel * (1 + dangerRating * rules.dangerScaling);
  return difficultyMultiplier != null ? baseDifficulty * difficultyMultiplier : baseDifficulty;
}

/**
 * Get the power ratio: party power / quest difficulty.
 * Ratio > 1 means the party is stronger than the quest expects.
 * Ratio < 1 means the party is underpowered.
 */
export function calculatePowerRatio(
  partyPower: number,
  questDifficulty: number,
): number {
  if (questDifficulty <= 0) return partyPower > 0 ? 10 : 1;
  return partyPower / questDifficulty;
}

/**
 * Look up the outcome distribution for a given power ratio
 * from the sorted breakpoints in config.
 */
export function getOutcomeDistribution(
  powerRatio: number,
  rules: QuestPowerRules,
): OutcomeDistribution {
  // Breakpoints are sorted high to low (by threshold)
  const sorted = [...rules.outcomeBreakpoints].sort((a, b) => b.threshold - a.threshold);
  for (const bp of sorted) {
    if (powerRatio >= bp.threshold) {
      return { ...bp.distribution };
    }
  }
  // Fallback: last breakpoint (lowest threshold)
  const last = sorted[sorted.length - 1];
  return last
    ? { ...last.distribution }
    : { perfect: 0, success: 0, partial: 0, fail: 50, deadly: 50 };
}

/**
 * Roll a quest outcome from the distribution using the provided RNG.
 * Distribution values are treated as relative weights (don't need to sum to 1).
 */
export function rollQuestOutcome(
  distribution: OutcomeDistribution,
  rng: () => number,
): QuestOutcome {
  const totalWeight = QUEST_OUTCOMES.reduce((sum, o) => sum + (distribution[o] ?? 0), 0);
  if (totalWeight <= 0) return 'fail';

  const roll = rng() * totalWeight;
  let cumulative = 0;
  for (const outcome of QUEST_OUTCOMES) {
    cumulative += distribution[outcome] ?? 0;
    if (roll < cumulative) {
      return outcome;
    }
  }
  return 'fail';
}

/**
 * Resolve injury and death rolls for each party member based on the quest outcome.
 * Returns an array of injury/death events.
 */
export function resolvePartyConsequences(
  residents: ResidentState[],
  outcome: QuestOutcome,
  rules: QuestPowerRules,
  rng: () => number,
): Array<{
  residentId: string;
  consequence: 'none' | 'injured' | 'dead';
}> {
  const injuryChance = rules.injuryChanceByOutcome[outcome] ?? 0;
  const deathChance = rules.deathChanceByOutcome[outcome] ?? 0;

  return residents.map((r) => {
    const deathRoll = rng();
    if (deathRoll < deathChance) {
      return { residentId: r.id, consequence: 'dead' as const };
    }
    const injuryRoll = rng();
    if (injuryRoll < injuryChance) {
      return { residentId: r.id, consequence: 'injured' as const };
    }
    return { residentId: r.id, consequence: 'none' as const };
  });
}

// ---------------------------------------------------------------------------
// High-level orchestrator
// ---------------------------------------------------------------------------

export interface QuestPowerResult {
  partyPower: number;
  questDifficulty: number;
  powerRatio: number;
  distribution: OutcomeDistribution;
  outcome: QuestOutcome;
  rewardMultiplier: number;
  consequences: Array<{
    residentId: string;
    consequence: 'none' | 'injured' | 'dead';
  }>;
}

/**
 * Full quest power resolution pipeline.
 * Pure function: reads config, produces result. No side effects.
 * Optional difficultyMultiplier applies variance to quest difficulty calculation.
 */
export function resolveQuestPower(
  partyResidents: ResidentState[],
  activity: ActivityDefinition,
  rules: QuestPowerRules,
  rng: () => number,
  difficultyMultiplier?: number,
): QuestPowerResult {
  const questLevel = typeof activity.level === 'number' ? activity.level : 1;
  const dangerRating = typeof activity.dangerRating === 'number' ? activity.dangerRating : 0;

  const partyPower = calculatePartyPower(partyResidents, rules);
  const questDifficulty = calculateQuestDifficulty(questLevel, dangerRating, rules, difficultyMultiplier);
  const powerRatio = calculatePowerRatio(partyPower, questDifficulty);
  const distribution = getOutcomeDistribution(powerRatio, rules);
  const outcome = rollQuestOutcome(distribution, rng);
  const rewardMultiplier = rules.rewardMultipliers[outcome] ?? 1;
  const consequences = resolvePartyConsequences(partyResidents, outcome, rules, rng);

  return {
    partyPower,
    questDifficulty,
    powerRatio,
    distribution,
    outcome,
    rewardMultiplier,
    consequences,
  };
}
