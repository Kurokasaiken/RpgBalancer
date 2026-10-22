/**
 * questPlanning — the planning surface's numeric contract (PLAN-019-S2.4 T-2).
 *
 * The POI detail recomputes a Monte Carlo forecast on every assignment
 * change. These values make the r2 compute contract config-first: fixed N,
 * deterministic seed derived from the assignment, chunk size, and the
 * declared budget the acceptance test measures against.
 *
 * Budget note (r2): p95 ≤ `forecastBudgetMs` total, no single task > 50 ms on
 * the main thread — the forecast runs chunked (`forecastChunkRuns` per slice,
 * ≈6–8 ms each measured on goblin), starting as soon as the committed party
 * changes and never during render. `forecastRuns` is fixed, so «stima su N simulazioni» is
 * honest and the cost bounded.
 */
import { z } from 'zod';

export const QuestPlanningConfigSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    /** Monte Carlo runs per forecast — fixed, so the label «stima su N
     *  simulazioni» is honest and the cost is bounded. */
    forecastRuns: z.number().int().min(50).max(5000),
    /** Runs per synchronous slice of the chunked forecast — sized under the
     *  50 ms task bound (≈6–8 ms per 100 runs measured on goblin — that was
     *  the r2 figure; R-248's probe measured ~140 ms per 100-run slice on
     *  the goblin scenario today, so 30 runs/slice restores the bound). */
    forecastChunkRuns: z.number().int().min(10).max(1000),
    /** Declared p95 budget (ms) for one chunked estimate from its start to
     *  result; evidence + E2E assert against this. */
    forecastBudgetMs: z.number().positive(),
  })
  .strict();
export type QuestPlanningConfig = z.infer<typeof QuestPlanningConfigSchema>;

/** Authored v2: no debounce between a committed party change and its estimate. */
export const QUEST_PLANNING: QuestPlanningConfig = QuestPlanningConfigSchema.parse({
  schemaVersion: 2,
  forecastRuns: 400,
  forecastChunkRuns: 30,
  forecastBudgetMs: 300,
});
