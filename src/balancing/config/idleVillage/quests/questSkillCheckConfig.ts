/**
 * Quest phase skill-check configuration.
 *
 * Turns the authored quest data (blueprint difficulty tier, per-phase
 * `difficultyLabel`, phase type) into the numeric D100 target the Destiny
 * Astrolabe consumes, and defines how party stats are summed into the
 * player-side value.
 *
 * This is the "la difficoltà della quest è legata allo skill check e data come
 * input" contract: every number the astrolabe receives originates here or in
 * the quest blueprint, never in a component.
 */

import { z } from 'zod';
import type { QuestPhaseType } from '../types';

/**
 * Zod schema for quest skill-check resolution.
 */
export const QuestSkillCheckConfigSchema = z.object({
  /** D100 target per blueprint difficulty tier. */
  difficultyByTier: z
    .record(z.string(), z.number().min(1).max(100))
    .default({ story: 30, skirmish: 45, dangerous: 60, heroic: 75 }),
  /**
   * D100 target per authored `TrialPhaseRequirement.difficultyLabel`.
   * Takes precedence over the tier when the label is present.
   */
  difficultyByLabel: z
    .record(z.string(), z.number().min(1).max(100))
    .default({ facile: 30, media: 50, difficile: 65, estrema: 80 }),
  /** Additive modifier applied to the target for each phase type. */
  phaseTypeDelta: z
    .record(z.string(), z.number().min(-40).max(40))
    .default({
      check: 0,
      fight: 10,
      stealth: 5,
      trap: -5,
      explore: 0,
      dialogue: -10,
      branch: 0,
      timedChoice: 5,
    }),
  /** Target used when neither a label nor a known tier resolves. */
  defaultDifficulty: z.number().min(1).max(100).default(50),
  /** Lowest and highest D100 target a resolved difficulty may take. */
  difficultyFloor: z.number().min(1).max(100).default(10),
  difficultyCeiling: z.number().min(1).max(100).default(95),
  /**
   * Value attributed to an unstaffed check, so a quest run with an empty
   * support slot still rolls instead of being mathematically impossible.
   */
  unstaffedStatFloor: z.number().min(0).default(5),
  /** Upper clamp on the summed party stat fed to the astrolabe. */
  statCeiling: z.number().min(1).default(95),
  /**
   * Parameters for resolving a milestone without the astrolabe animation,
   * used when the quest card is closed and the check happens off-screen.
   * The astrolabe resolves by ball physics; this is its probabilistic
   * equivalent, not a replay of the same geometry.
   */
  backgroundResolution: z
    .object({
      /** Success chance when stat exactly equals difficulty. */
      parSuccessChance: z.number().min(1).max(99).default(50),
      /** Lowest and highest success chance after stat/difficulty are applied. */
      successFloor: z.number().min(1).max(99).default(5),
      successCeiling: z.number().min(1).max(99).default(95),
      /** Fraction of the success band that reads as a critical success. */
      criticalWinFraction: z.number().min(0).max(1).default(0.2),
      /** Width in points of the near-miss band just past a failure. */
      nearMissBand: z.number().min(0).max(30).default(10),
      /** A roll at or above this value is a critical failure. */
      epicFailThreshold: z.number().min(50).max(100).default(96),
    })
    // Zod 4 hands back a `.default()` value as-is instead of re-parsing it, so
    // an empty object here would leave every inner field undefined. The default
    // is spelled out in full on purpose.
    .default({
      parSuccessChance: 50,
      successFloor: 5,
      successCeiling: 95,
      criticalWinFraction: 0.2,
      nearMissBand: 10,
      epicFailThreshold: 96,
    }),
});

export type QuestSkillCheckConfig = z.infer<typeof QuestSkillCheckConfigSchema>;

/** Default skill-check resolution config. */
export const DEFAULT_QUEST_SKILL_CHECK_CONFIG: QuestSkillCheckConfig =
  QuestSkillCheckConfigSchema.parse({});

/**
 * Resolves the D100 target for a phase.
 *
 * Precedence: authored `difficultyLabel` → blueprint difficulty tier →
 * configured default. The phase-type delta is then applied and the result
 * clamped to the configured floor/ceiling.
 * @param options - Authored inputs for the phase
 * @param config - Resolution config, defaults to {@link DEFAULT_QUEST_SKILL_CHECK_CONFIG}
 * @returns The clamped D100 difficulty target
 */
export function resolvePhaseDifficulty(
  options: {
    difficultyLabel?: string;
    blueprintDifficulty?: string;
    phaseType?: QuestPhaseType;
  },
  config: QuestSkillCheckConfig = DEFAULT_QUEST_SKILL_CHECK_CONFIG,
): number {
  const { difficultyLabel, blueprintDifficulty, phaseType } = options;

  const labelTarget =
    difficultyLabel !== undefined
      ? config.difficultyByLabel[difficultyLabel.toLowerCase()]
      : undefined;
  const tierTarget =
    blueprintDifficulty !== undefined
      ? config.difficultyByTier[blueprintDifficulty.toLowerCase()]
      : undefined;

  const base = labelTarget ?? tierTarget ?? config.defaultDifficulty;
  const delta = phaseType ? (config.phaseTypeDelta[phaseType] ?? 0) : 0;

  return Math.round(
    Math.min(config.difficultyCeiling, Math.max(config.difficultyFloor, base + delta)),
  );
}
