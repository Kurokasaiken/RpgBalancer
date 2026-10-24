/**
 * Mobile-fit policy for the `/game` surface (PLAN-083, R-274).
 *
 * Single config-first home for every mobile-policy number: breakpoint,
 * effective zoom bounds, gesture thresholds, nav budget, panel mode, DPR cap.
 * Nothing mobile-specific may be hardcoded in components.
 *
 * Zoom contract (debate-converged, artifact-r007):
 * - Below `breakpointPx` the map uses EFFECTIVE bounds:
 *   `effectiveMin = max(coverScale, wheelMin)` — coverage is the primary
 *   invariant (no letterbox, even when coverScale > wheelMax);
 *   `effectiveMax = max(wheelMax, effectiveMin * mobileMaxZoomFactor)` —
 *   the factor guarantees a non-empty pinch range on the target device.
 * - At `>= breakpointPx` the wheel pair is returned verbatim, so desktop
 *   is emit-identical BY CONSTRUCTION (not by numeric coincidence).
 * - `effectiveMin === effectiveMax` is a fallback for atypical aspect
 *   ratios: pinch zoom deltas no-op while pan stays active.
 */

import { z } from 'zod';

const vec2Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

export const mobileFitConfigSchema = z
  .object({
    /** Viewport width (px) under which mobile-fit mode engages. >= breakpoint = desktop verbatim. */
    breakpointPx: z.number().int().positive(),

    /** Minimum interactive target size (px), both dimensions (MOBILE_GUIDELINES). */
    minTargetPx: z.number().positive(),

    /** Nav policy below breakpoint: primary ids (ordered) + overflow «Altro» sheet. */
    navPrimaryIds: z.array(z.string()).nonempty(),
    /** Horizontal gap between nav chips (px). */
    navGapPx: z.number().nonnegative(),
    /** Reference viewport the nav budget is validated against (px). */
    navBudgetViewportPx: z.number().positive(),
    /** Worst-case safe-area inset budget assumed at the reference viewport (px). */
    navBudgetSafeAreaPx: z.number().nonnegative(),

    /** Panel rendering below breakpoint. `floating` is desktop-only by contract. */
    panelMode: z.enum(['floating', 'sheet']),

    /**
     * Mobile zoom range guarantee: effectiveMax >= effectiveMin * factor.
     * Applied ONLY in the <breakpoint branch (desktop untouched).
     */
    mobileMaxZoomFactor: z.number().finite().positive(),
    /** Minimum pinch range floor the spec asserts at the reference viewports
     *  (`effectiveMax / effectiveMin >= floor`). Director ruling — the chosen
     *  value is recorded in the T-007 evidence with its tuning device. */
    mobileZoomRangeFloor: z.number().finite().positive(),

    /** Authored focal point of the painted world, fractions of the 4240x2828
     *  canvas (0-1). Portrait cover-fit centres the camera on it. Default:
     *  centre of `safeFit.landBounds` (271..3974 x, 305..2642 y). */
    mapFocal: vec2Schema,

    /** devicePixelRatio cap applied to the Pixi renderer on coarse pointers. */
    dprCap: z.number().positive(),

    /** Gesture thresholds (px/ms) — the gesture-priority table's numbers. */
    gestures: z.object({
      /** Max press duration and travel for a tap. */
      tapMaxMs: z.number().positive(),
      tapMaxMovePx: z.number().positive(),
      /** Hold before long-press (deferred to v1.1 — tap-to-reveal ships first). */
      longPressMs: z.number().positive(),
      /** Aligned with dnd-kit hold-to-drag (`dragConfig.timing.holdToDragMs`). */
      holdToDragMs: z.number().positive(),
      /** Pointer travel before a pan/pinch lock engages. */
      panSlopPx: z.number().positive(),
      /** Distance change (px) before a two-pointer gesture counts as pinch. */
      pinchStartDeltaPx: z.number().positive(),
    }),
  })
  .refine((c) => c.mobileMaxZoomFactor >= c.mobileZoomRangeFloor, {
    message: 'mobileMaxZoomFactor must be >= mobileZoomRangeFloor (pinch range floor unreachable otherwise)',
    path: ['mobileMaxZoomFactor'],
  })
  .refine(
    (c) => {
      const n = c.navPrimaryIds.length;
      const budget =
        n * c.minTargetPx + n * c.navGapPx + c.minTargetPx <=
        c.navBudgetViewportPx - c.navBudgetSafeAreaPx;
      return budget;
    },
    {
      message:
        'navPrimaryIds overflow the nav budget: N*minTarget + N*gap + Altro must fit the reference viewport minus safe-area',
      path: ['navPrimaryIds'],
    },
  );

export type MobileFitConfig = z.infer<typeof mobileFitConfigSchema>;

const DEFAULTS: MobileFitConfig = {
  breakpointPx: 768,
  minTargetPx: 44,
  navPrimaryIds: ['village', 'map', 'workshop', 'tavern'],
  navGapPx: 8,
  navBudgetViewportPx: 390,
  navBudgetSafeAreaPx: 34,
  panelMode: 'sheet',
  mobileMaxZoomFactor: 1.6,
  mobileZoomRangeFloor: 1.4,
  mapFocal: { x: 0.5006, y: 0.5208 },
  dprCap: 2,
  gestures: {
    tapMaxMs: 300,
    tapMaxMovePx: 10,
    longPressMs: 550,
    holdToDragMs: 180,
    panSlopPx: 8,
    pinchStartDeltaPx: 12,
  },
};

const parsed = mobileFitConfigSchema.parse(DEFAULTS);

/** Validated mobile-fit policy (PLAN-083). Read via `getMobileFitConfig()`. */
export function getMobileFitConfig(): MobileFitConfig {
  return parsed;
}

/** True when the viewport engages mobile-fit mode (< breakpointPx). */
export function isMobileFitViewport(viewportWidthPx: number): boolean {
  return viewportWidthPx < parsed.breakpointPx;
}

export interface EffectiveZoomBounds {
  min: number;
  max: number;
  /** True when the effective pair was derived (mobile branch), false on desktop. */
  mobile: boolean;
}

/**
 * Effective zoom bounds for the world camera (PLAN-083 contract).
 *
 * @param viewportWidthPx - current viewport width in px
 * @param coverScale - scale at which the painted canvas covers the viewport on
 *   the short axis (no letterbox)
 * @param wheelMinBound / wheelMaxBound - the existing wheel-zoom bounds
 *   (`cameraConfig.minZoom`/`maxZoom` from the world manifest)
 * @returns the wheel pair verbatim when `viewportWidthPx >= breakpointPx`
 *   (structural emit-identical), else the clamped effective pair.
 */
export function resolveEffectiveZoomBounds(
  viewportWidthPx: number,
  coverScale: number,
  wheelMinBound: number,
  wheelMaxBound: number,
): EffectiveZoomBounds {
  if (!isMobileFitViewport(viewportWidthPx)) {
    return { min: wheelMinBound, max: wheelMaxBound, mobile: false };
  }
  const min = Math.max(coverScale, wheelMinBound);
  const max = Math.max(wheelMaxBound, min * parsed.mobileMaxZoomFactor);
  return { min, max, mobile: true };
}
