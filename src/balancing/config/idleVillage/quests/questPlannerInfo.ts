/**
 * questPlannerInfo — planning-time information contract (PLAN-019-S3 T-1).
 *
 * What the Planner may know BEFORE launch (D-S3-3, ratificata 2026-10-09):
 *
 * - the primary stat channel of every check is always known;
 * - `previewHint` on authored nodes is always shown (declared danger hints);
 * - `revealHint` is deeper intel, unlocked only by `revealAtPlanning` slots —
 *   the explorer's stat meeting the authored threshold;
 * - `certainChecks` is the only per-check number the UI may show: dominance
 *   on the reachable node graph, never an invented percentage.
 *
 * The `certainty` block sizes the engine-driven probe (`questCertainty`):
 * the die sweep is exhaustive by construction (`verdictFromRoll` bands cover
 * the whole d100 for any success bound), so it is a cap, not a sample size.
 */
import { z } from 'zod';

export const QuestPlannerInfoConfigSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    /** Budgets for `exploreScenarioGraph` / `certainChecks`. */
    certainty: z
      .object({
        /** Fixed seed — the probe must be deterministic per scenario. */
        probeSeed: z.number().int(),
        /** Distinct abstract states before giving up; truncation empties the
         *  certain list (unexplored paths could dodge the check). */
        maxStates: z.number().int().min(100).max(200_000),
        /** `rngCalls` offsets tried per non-check command — covers rollFlag
         *  arms, harm variance and combat cleared/survivors branches. */
        rngSweepPerCommand: z.number().int().min(2).max(256),
        /** Forced dies per check option — 100 = every reachable verdict
         *  guaranteed by construction. */
        dieSweepMax: z.number().int().min(5).max(100),
      })
      .strict(),
    /** `revealAtPlanning` mechanic (optional, per-slot authored). */
    revealAtPlanning: z
      .object({
        /** Master switch — the mechanic is ratified but authored slots
         *  decide where it applies. */
        enabled: z.boolean(),
        /** Cap on revealed hints surfaced at once (UI overflow guard). */
        maxRevealedHints: z.number().int().min(1).max(50),
      })
      .strict(),
    /** Cap on authored `previewHint`s shown at planning (overflow guard). */
    maxPreviewHints: z.number().int().min(1).max(50),
  })
  .strict();
export type QuestPlannerInfoConfig = z.infer<typeof QuestPlannerInfoConfigSchema>;

/** Authored v0. */
export const QUEST_PLANNER_INFO: QuestPlannerInfoConfig = QuestPlannerInfoConfigSchema.parse({
  schemaVersion: 1,
  certainty: {
    probeSeed: 7331,
    maxStates: 20_000,
    rngSweepPerCommand: 24,
    dieSweepMax: 100,
  },
  revealAtPlanning: {
    enabled: true,
    maxRevealedHints: 12,
  },
  maxPreviewHints: 12,
});
