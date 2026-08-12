/**
 * Quest milestone resolution.
 *
 * A running quest fires one skill check per milestone, and milestones are
 * spaced evenly across the quest duration (desiderata v3: "equispaziate").
 * With four phases that is 25% / 50% / 75% / 100%; the rule generalises to any
 * phase count, so a three-phase quest fires at 33% / 67% / 100%.
 *
 * Everything here is pure: the caller owns the clock, this module owns the
 * arithmetic and the mapping from authored quest data to astrolabe input.
 */

import type { AstrolabeSkill } from '@/ui/idleVillage/components/destinyAstrolabe/engine';
import type {
  QuestPhase,
  StatRequirement,
  TrialPhaseRequirement,
} from '@/balancing/config/idleVillage/types';
import {
  DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  resolvePhaseDifficulty,
  type QuestSkillCheckConfig,
} from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import type { ResidentState } from './TimeEngine';

/**
 * Computes the elapsed-time thresholds at which each milestone fires.
 *
 * Milestones are equispaced, one per phase, and the last one lands exactly on
 * the total duration so the final check coincides with the halo closing.
 * @param totalDurationMs - Total quest duration in milliseconds
 * @param milestoneCount - Number of milestones, normally the phase count
 * @returns Ascending thresholds in milliseconds; empty when count < 1
 */
export function buildQuestMilestones(
  totalDurationMs: number,
  milestoneCount: number,
): number[] {
  if (!Number.isFinite(totalDurationMs) || totalDurationMs <= 0) return [];
  const count = Math.max(0, Math.floor(milestoneCount));
  return Array.from(
    { length: count },
    (_, index) => Math.round((totalDurationMs * (index + 1)) / count),
  );
}

/**
 * Extracts the stat tags a phase tests.
 *
 * Blueprints in the wild use either the trial shape (`requiredStatTags`) or a
 * plain `statRequirement`, so both are read before falling back to the
 * activity-level requirement supplied by the caller.
 * @param phase - The quest phase
 * @param fallbackRequirement - Activity-level requirement used when the phase declares none
 * @returns Distinct stat tags, in declaration order
 */
export function resolvePhaseStatTags(
  phase: Pick<QuestPhase, 'requirements'>,
  fallbackRequirement?: StatRequirement,
): string[] {
  const requirements = phase.requirements as
    | (TrialPhaseRequirement & { statRequirement?: StatRequirement })
    | undefined;

  const fromTrial = requirements?.requiredStatTags ?? [];
  const phaseStatRequirement = requirements?.statRequirement;
  const requirement = phaseStatRequirement ?? fallbackRequirement;

  const fromRequirement: string[] = requirement
    ? [
        ...(requirement.allOf ?? []).filter((entry): entry is string => typeof entry === 'string'),
        ...(requirement.anyOf ?? []),
      ]
    : [];

  return Array.from(new Set([...fromTrial, ...fromRequirement]));
}

/**
 * Sums one stat across the assigned party.
 *
 * "Somma delle stat dei residenti": every resident in a slot contributes, so
 * filling more slots strengthens the check.
 * @param residents - Residents currently assigned to the quest
 * @param statTag - The stat key to sum
 * @returns The summed value, zero when nobody carries the stat
 */
export function sumPartyStat(residents: readonly ResidentState[], statTag: string): number {
  return residents.reduce((total, resident) => {
    const value = resident.statSnapshot?.[statTag];
    return total + (typeof value === 'number' && Number.isFinite(value) ? value : 0);
  }, 0);
}

/**
 * Builds the astrolabe input for one quest phase.
 *
 * Produces one skill per stat tag the phase tests, each carrying the summed
 * party value and the difficulty resolved from the authored quest data. When a
 * phase declares no stat tags at all, a single generic skill is produced so the
 * milestone still rolls.
 * @param options - Phase, party and authored difficulty inputs
 * @param config - Skill-check config, defaults to {@link DEFAULT_QUEST_SKILL_CHECK_CONFIG}
 * @returns Skills ready to hand to the Destiny Astrolabe
 */
export function buildAstrolabeSkillsForPhase(
  options: {
    phase: QuestPhase;
    residents: readonly ResidentState[];
    blueprintDifficulty?: string;
    fallbackRequirement?: StatRequirement;
    genericSkillName?: string;
  },
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): AstrolabeSkill[] {
  const { phase, residents, blueprintDifficulty, fallbackRequirement, genericSkillName } = options;
  const requirements = phase.requirements as TrialPhaseRequirement | undefined;

  const difficulty = resolvePhaseDifficulty(
    {
      difficultyLabel: requirements?.difficultyLabel,
      blueprintDifficulty,
      phaseType: phase.type,
    },
    config,
  );

  const clampStat = (value: number): number =>
    Math.round(Math.min(config.statCeiling, Math.max(config.unstaffedStatFloor, value)));

  const statTags = resolvePhaseStatTags(phase, fallbackRequirement);

  if (statTags.length === 0) {
    return [
      {
        name: genericSkillName ?? phase.title,
        stat: clampStat(
          residents.reduce(
            (total, resident) => total + (resident.statSnapshot?.hp ? 1 : 0),
            0,
          ) * config.unstaffedStatFloor,
        ),
        difficulty,
      },
    ];
  }

  return statTags.map((statTag) => ({
    name: statTag,
    stat: clampStat(sumPartyStat(residents, statTag)),
    difficulty,
  }));
}

/** Injury and death chances of a check, in percentage points. */
export interface PhaseRiskChances {
  injuryChance: number;
  deathChance: number;
}

/** Minimal shape of a consumable that can be spent before a check. */
export interface ConsumableRiskEffect {
  effect: {
    injuryChanceDelta?: number;
    deathChanceDelta?: number;
  };
}

/**
 * Applies spent consumables to a phase's risk profile.
 *
 * Deltas are percentage points and the result is clamped to 0–100, so stacking
 * potions can zero a risk out but never invert it.
 * @param base - The phase's authored risk chances
 * @param items - Consumables the player chose to spend on this check
 * @returns The effective chances used for the roll
 */
export function applyConsumableRiskEffects(
  base: PhaseRiskChances,
  items: readonly ConsumableRiskEffect[],
): PhaseRiskChances {
  const clamp = (value: number): number => Math.min(100, Math.max(0, value));
  return items.reduce<PhaseRiskChances>(
    (chances, item) => ({
      injuryChance: clamp(chances.injuryChance + (item.effect.injuryChanceDelta ?? 0)),
      deathChance: clamp(chances.deathChance + (item.effect.deathChanceDelta ?? 0)),
    }),
    { injuryChance: clamp(base.injuryChance), deathChance: clamp(base.deathChance) },
  );
}

/** Whether an astrolabe verdict counts as a passed phase. */
export function isPassingVerdict(verdict: string): boolean {
  return verdict === 'bigwin' || verdict === 'win' || verdict === 'almost';
}

/**
 * Resolves a milestone without the astrolabe animation.
 *
 * The player only watches the astrolabe when the quest card is open; a check
 * that fires while the card is closed still has to produce a real outcome.
 * This is the probabilistic equivalent of the astrolabe — same verdict
 * vocabulary and the same risk-roll semantics — not a replay of its ball
 * physics, so the two paths agree in distribution rather than trajectory.
 * @param options - Skills to test and the effective risk chances
 * @param config - Skill-check config, defaults to {@link DEFAULT_QUEST_SKILL_CHECK_CONFIG}
 * @param rng - Random source in [0, 1), injectable for deterministic tests
 * @returns A result shaped exactly like an astrolabe resolution
 */
export function resolveMilestoneWithoutAnimation(
  options: {
    skills: readonly AstrolabeSkill[];
    risk: PhaseRiskChances;
  },
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
  rng: () => number = Math.random,
): AstrolabeResultShape {
  const { skills, risk } = options;
  const tuning = config.backgroundResolution;

  // The weakest skill drives the phase: a party is only as strong as the
  // requirement it is least equipped for.
  const skillIndex =
    skills.length === 0
      ? 0
      : skills.reduce(
          (worst, skill, index) =>
            skill.stat - skill.difficulty < skills[worst].stat - skills[worst].difficulty
              ? index
              : worst,
          0,
        );
  const skill = skills[skillIndex];

  const successChance = skill
    ? Math.min(
        tuning.successCeiling,
        Math.max(
          tuning.successFloor,
          skill.stat - skill.difficulty + tuning.parSuccessChance,
        ),
      )
    : tuning.successFloor;

  const roll = 1 + Math.floor(rng() * 100);

  let verdict: string;
  if (roll >= tuning.epicFailThreshold) {
    verdict = 'epicfail';
  } else if (roll <= successChance * tuning.criticalWinFraction) {
    verdict = 'bigwin';
  } else if (roll <= successChance) {
    verdict = 'win';
  } else if (roll <= successChance + tuning.nearMissBand) {
    verdict = 'almost';
  } else {
    verdict = 'fail';
  }

  const riskRoll = 1 + Math.floor(rng() * 100);
  const dead = riskRoll <= risk.deathChance;
  const wounded = !dead && riskRoll <= risk.deathChance + risk.injuryChance;

  return {
    verdict,
    roll,
    riskRoll,
    skillIndex,
    skillName: skill?.name ?? '',
    wounded,
    dead,
  };
}

/** Outcome tiers of a finished quest, matching QuestPowerEngine's vocabulary. */
export type QuestOutcomeTier = 'perfect' | 'success' | 'partial' | 'fail' | 'deadly';

/**
 * Derives the headline outcome of a quest from the phases that were actually
 * played.
 *
 * A failed phase does not abort the run, so the ending has to be assembled
 * afterwards: this is where "esito combinato finale" is decided. Deliberately
 * not a power roll — a party that passed every trial must never be told it
 * failed, and one that passed none must never be told it was perfect.
 * @param results - Per-phase results, in phase order; nulls count as unresolved
 * @returns The outcome tier to display
 */
export function resolveQuestOutcomeTier(
  results: readonly (AstrolabeResultShape | null)[],
): QuestOutcomeTier {
  const resolved = results.filter((entry): entry is AstrolabeResultShape => !!entry);
  if (resolved.length === 0) return 'fail';

  const passed = resolved.filter((entry) => isPassingVerdict(entry.verdict)).length;
  const anyDeath = resolved.some((entry) => entry.dead);

  if (passed === resolved.length) return anyDeath ? 'success' : 'perfect';
  if (passed === 0) return anyDeath ? 'deadly' : 'fail';
  // Half or more of the trials passed reads as a win, below that as a partial.
  return passed * 2 >= resolved.length ? 'success' : 'partial';
}

/** Structural mirror of the astrolabe's result, kept local to avoid a UI import cycle. */
export interface AstrolabeResultShape {
  verdict: string;
  roll: number;
  riskRoll: number;
  skillIndex: number;
  skillName: string;
  wounded: boolean;
  dead: boolean;
}
