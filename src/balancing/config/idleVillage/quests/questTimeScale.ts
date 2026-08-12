/**
 * Quest phase time scale.
 *
 * `QuestPhase.durationValue` is authored in narrative units (`ticks`, `hours`,
 * `days`). This module owns the single conversion from those narrative units
 * to the real milliseconds the quest halo and the milestone engine run on.
 *
 * Why this is a config module and not a constant next to the halo: the totals
 * are balancing knobs. A quest authored as "2h + 3h + 1h" should be tunable
 * from six seconds of play to six minutes without touching a component.
 *
 * Note on `hours`: the compressed village clock (`globalRules.dayLengthInTimeUnits`)
 * makes a literal 1/24-of-a-day hour far too short to read as a quest phase, so
 * `msPerHour` is an independent knob rather than a derivation of `msPerDay`.
 */

import { z } from 'zod';
import type { QuestPhase } from '../types';

/**
 * Zod schema for the quest phase time scale.
 */
export const QuestTimeScaleSchema = z.object({
  /** Real milliseconds one authored `ticks` unit represents. */
  msPerTick: z.number().positive().default(1_000),
  /** Real milliseconds one authored `hours` unit represents. */
  msPerHour: z.number().positive().default(1_000),
  /** Real milliseconds one authored `days` unit represents. */
  msPerDay: z.number().positive().default(8_000),
  /** Fallback total used when a quest has no phases to sum. */
  fallbackTotalMs: z.number().positive().default(12_000),
});

export type QuestTimeScale = z.infer<typeof QuestTimeScaleSchema>;

/**
 * Default scale: one narrative hour reads as one second of play, so the
 * three-phase `quest_city_rats` blueprint (2h + 3h + 1h) runs in six seconds —
 * short enough to exercise every milestone in a test-hub session.
 */
export const DEFAULT_QUEST_TIME_SCALE: QuestTimeScale = QuestTimeScaleSchema.parse({});

/**
 * Converts a single quest phase's authored duration to real milliseconds.
 * @param phase - The quest phase to measure
 * @param scale - Time scale to apply, defaults to {@link DEFAULT_QUEST_TIME_SCALE}
 * @returns The phase duration in milliseconds, never negative
 */
export function questPhaseDurationMs(
  phase: Pick<QuestPhase, 'durationValue' | 'durationUnits'>,
  scale: QuestTimeScale = DEFAULT_QUEST_TIME_SCALE,
): number {
  const value = Number.isFinite(phase.durationValue) ? Math.max(0, phase.durationValue) : 0;
  switch (phase.durationUnits) {
    case 'days':
      return value * scale.msPerDay;
    case 'hours':
      return value * scale.msPerHour;
    case 'ticks':
    default:
      return value * scale.msPerTick;
  }
}

/**
 * Sums the authored phase durations of a quest — the single source of truth for
 * how long the halo takes to write itself.
 *
 * `ActivityDefinition.durationFormula` is deliberately not consulted: it is a
 * display/sandbox value in seconds and can diverge from the blueprint.
 * @param phases - The quest's phases, in order
 * @param scale - Time scale to apply, defaults to {@link DEFAULT_QUEST_TIME_SCALE}
 * @returns Total quest duration in milliseconds, or the configured fallback
 *          when there are no phases
 */
export function questTotalDurationMs(
  phases: readonly Pick<QuestPhase, 'durationValue' | 'durationUnits'>[],
  scale: QuestTimeScale = DEFAULT_QUEST_TIME_SCALE,
): number {
  if (phases.length === 0) return scale.fallbackTotalMs;
  const total = phases.reduce((sum, phase) => sum + questPhaseDurationMs(phase, scale), 0);
  return total > 0 ? total : scale.fallbackTotalMs;
}
