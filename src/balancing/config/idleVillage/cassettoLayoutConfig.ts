/**
 * cassettoLayoutConfig — R-339/PLAN-119 T1 tokens for the expedition surfaces.
 *
 * The signed column art (R-323 "Dentro la cornice") keeps its baked aspect and
 * renders `aspect × viewportHeight`; the plan's `clamp(360px, 23vw, 460px)`
 * contract applies as an UPPER bound on the occupied width — at viewports
 * taller than `widthMaxPx / aspect` the column caps at `widthMaxPx` and stops
 * short of full height (art stays undistorted). `widthMinPx` is a declared
 * target that cannot bind on the baked column without distortion — it governs
 * the future non-art drawer (T2) and the width the map ledger may reserve.
 *
 * `rail` and `bottomSheet` are the T5/T8 sizing contract (persistent left
 * Roster|Stash column; non-modal mobile sheet detents) declared here so the
 * surfaces read one source of truth.
 */
import { z } from 'zod';

export const cassettoLayoutSchema = z
  .object({
    drawer: z.object({
      /** Minimum docked width the expedition surface may occupy (px). */
      widthMinPx: z.number().positive(),
      /** Viewport-width share used by the free-map layout budget. */
      widthVwFraction: z.number().positive().max(1),
      /** Hard cap on the docked width (px) — binds above `widthMaxPx / aspect`. */
      widthMaxPx: z.number().positive(),
    }),
    rail: z.object({
      /** Persistent left Roster|Stash column width (px). */
      widthPx: z.number().positive(),
      /** Width below which only one side surface may be open (mutual exclusion). */
      mutualExclusionBelowPx: z.number().positive(),
    }),
    bottomSheet: z.object({
      /** Non-modal sheet detents (T8): peek height, half/full viewport fractions. */
      peekPx: z.number().positive(),
      halfFraction: z.number().positive().max(1),
      fullFraction: z.number().positive().max(1),
    }),
  })
  .strict();

export type CassettoLayoutConfig = z.infer<typeof cassettoLayoutSchema>;

const RAW_CASSETTO_LAYOUT_CONFIG: CassettoLayoutConfig = {
  drawer: { widthMinPx: 360, widthVwFraction: 0.23, widthMaxPx: 460 },
  rail: { widthPx: 320, mutualExclusionBelowPx: 1100 },
  bottomSheet: { peekPx: 56, halfFraction: 0.5, fullFraction: 0.92 },
};

export const CASSETTO_LAYOUT_CONFIG = cassettoLayoutSchema.parse(RAW_CASSETTO_LAYOUT_CONFIG);
