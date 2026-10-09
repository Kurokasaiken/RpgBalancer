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
    /** OUTCOME zone contract (PLAN-019-S3 T-2): BY MEMBER + WHY live inside
     *  a scrollable analysis region — the panel's header, slot rack and
     *  send stay anchored (same pattern as QuestRunWindow D-7). */
    outcome: z
      .object({
        /** Top-N WHY sources rendered; beyond the cap the tail collapses —
         *  the degradation path of the MC cost contract (attribution is
         *  harvested inside the same sims, so cost is never per-frame). */
        maxWhySources: z.number().int().min(1).max(50),
        /** Max height (px) of the scrollable analysis region at max party:
         *  measured overflow contract, not a guessed panel height. */
        analysisMaxHeightPx: z.number().int().min(120).max(1200),
        /** Outer FloatingPanel body cap (px) — sized so the fixed zones
         *  (offer header + slot rack + loadout + send) plus the capped
         *  analysis region never trigger the panel's own scroll. */
        panelMaxBodyHeightPx: z.number().int().min(300).max(1600),
      })
      .strict(),
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
  outcome: {
    maxWhySources: 5,
    /* Party max = 4 slots (goblin/rovine): aggregate chips (~30) + BY
     * MEMBER 4 rows (~90) + WHY top-5 (~120) + intel hints (~60) ≈ 300px
     * measured; 320 gives the scroll region headroom without an outer
     * panel scroll. */
    analysisMaxHeightPx: 320,
    /* Fixed zones ≈ 350px + analysis 320px + margins ≈ 700. */
    panelMaxBodyHeightPx: 700,
  },
});
