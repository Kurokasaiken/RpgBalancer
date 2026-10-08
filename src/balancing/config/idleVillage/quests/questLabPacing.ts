/**
 * Quest S1 lab — cinematic pacing configuration.
 *
 * Timings for the narrative flavor layer (Director 2026-10-08): how long the
 * transit text holds the screen between phases (in the real game it will sit
 * under the movement animation) and how fast flavor text fades in.
 * All presentation timings live here, never hardcoded in the page.
 */

import { z } from 'zod';

/** Zod schema for the lab's cinematic pacing values. */
export const QuestLabPacingSchema = z.object({
  /** Hold between nodes when the destination carries no `transit` line. */
  transitionMs: z.number().min(0).max(10000).default(900),
  /** Hold when the destination has a `transit` line the player must read. */
  transitMs: z.number().min(0).max(15000).default(2600),
  /** Min hold for a transit line, however short. */
  transitMinMs: z.number().min(0).max(10000).default(2000),
  /** Max hold for a transit line, however long — it must stay skippable. */
  transitMaxMs: z.number().min(0).max(20000).default(7000),
  /** Reading speed used to scale the transit hold with the line's length. */
  transitWordsPerSecond: z.number().positive().default(3.5),
  /** Fade-in duration for transit / verdict-flavor text blocks. */
  fadeMs: z.number().min(0).max(5000).default(700),
});

/** Inferred config type. */
export type QuestLabPacing = z.infer<typeof QuestLabPacingSchema>;

/** Default pacing — validated at module load. */
export const DEFAULT_QUEST_LAB_PACING: QuestLabPacing = QuestLabPacingSchema.parse({});
