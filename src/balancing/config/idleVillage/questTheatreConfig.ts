/**
 * QuestTheatre — structural configuration (PLAN-021, T-003/T-004).
 *
 * Every layout/behaviour number the theatre reads lives here: panel geometry,
 * the expanded-mode contract (opt-in per instance, viewport-coverage bounds)
 * and the timings of the disposable demo runtime used by the dev route. New
 * values go through the Zod schema — nothing is hardcoded in components.
 */

import { z } from 'zod';

const questTheatreConfigSchema = z.object({
  /** Compact panel geometry (FloatingPanel contract). */
  panel: z.object({
    widthPx: z.number().positive(),
    initialX: z.number().nonnegative(),
    initialY: z.number().nonnegative(),
    maxBodyHeightPx: z.number().positive(),
  }),
  /**
   * Expanded mode — opt-in per FloatingPanel instance (`allowExpanded`).
   * `maxCoverage` is the measurable acceptance bound from PLAN-021 T-003:
   * the expanded panel may cover at most this fraction of the viewport, so a
   * minimum map area always stays visible and interactive.
   */
  expanded: z.object({
    insetPx: z.number().nonnegative(),
    maxCoverage: z.number().min(0).max(1),
    minMapVisiblePct: z.number().min(0).max(1),
  }),
  /** TheatreTrack — narrative trail of resolved nodes. */
  track: z.object({
    /** Max resolved nodes shown before the trail is ellided. */
    maxVisibleNodes: z.number().int().positive(),
  }),
  /**
   * Demo runtime timings — used ONLY by the disposable fake adapter on the
   * dev route (`/game-frame-theatre`), never by a canonical runtime.
   */
  demo: z.object({
    /** Simulated wall-time a timed node takes to resolve in the demo. */
    timedNodeMs: z.number().positive(),
    /** Whether the demo auto-advances timed nodes on mount. */
    autoAdvanceDefault: z.boolean(),
  }),
});

export type QuestTheatreConfig = z.infer<typeof questTheatreConfigSchema>;

export const DEFAULT_QUEST_THEATRE_CONFIG: QuestTheatreConfig =
  questTheatreConfigSchema.parse({
    panel: {
      widthPx: 640,
      initialX: 200,
      initialY: 80,
      maxBodyHeightPx: 640,
    },
    expanded: {
      insetPx: 32,
      maxCoverage: 0.9,
      minMapVisiblePct: 0.1,
    },
    track: {
      maxVisibleNodes: 8,
    },
    demo: {
      timedNodeMs: 2500,
      autoAdvanceDefault: true,
    },
  });
