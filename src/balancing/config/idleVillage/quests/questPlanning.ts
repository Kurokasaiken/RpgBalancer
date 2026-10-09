/**
 * questPlanning — the planning surface's numeric contract (PLAN-019-S2.4 T-2).
 *
 * The POI detail recomputes a Monte Carlo forecast on every assignment
 * change. These values make the r2 compute contract config-first: fixed N,
 * deterministic seed derived from the assignment, debounce, and the declared
 * budget the acceptance test measures against.
 *
 * Budget note (r2): p95 ≤ `forecastBudgetMs` total, no single task > 50 ms on
 * the main thread — the forecast runs chunked (`forecastChunkRuns` per slice,
 * ≈6–8 ms each measured on goblin) inside a debounced macrotask, never
 * during render. `forecastRuns` is fixed, so «stima su N simulazioni» is
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
     *  50 ms task bound (≈6–8 ms per 100 runs measured on goblin). */
    forecastChunkRuns: z.number().int().min(10).max(1000),
    /** Quiet period after the last assignment change before recomputing —
     *  dragging across slots never spams sims. */
    forecastDebounceMs: z.number().int().min(50).max(2000),
    /** Declared p95 budget (ms) for one forecast recompute, debounce excluded.
     *  Evidence + E2E assert against this; exceeded = finding, not silent
     *  slowdown. */
    forecastBudgetMs: z.number().positive(),
  })
  .strict();
export type QuestPlanningConfig = z.infer<typeof QuestPlanningConfigSchema>;

/** Authored v0. */
export const QUEST_PLANNING: QuestPlanningConfig = QuestPlanningConfigSchema.parse({
  schemaVersion: 1,
  forecastRuns: 400,
  forecastChunkRuns: 100,
  forecastDebounceMs: 150,
  forecastBudgetMs: 300,
});
