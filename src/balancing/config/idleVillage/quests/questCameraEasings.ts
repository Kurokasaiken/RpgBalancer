/**
 * questCameraEasings — closed easing set for the quest cinema camera
 * (PLAN-046, artifact-r011 §5).
 *
 * Every easing the camera can reference ships with ANALYTIC bounds computed in
 * closed form from the curve's own definition — never sampled, never declared:
 *   - `valueRange`: [min, max] of e(t) on [0,1], overshoot included;
 *   - `dmax`:       max_t |e'(t)|, the certified derivative bound.
 *
 * The numeric sweep in edgeSafety tests is a diagnostic only; the proof inputs
 * are these closed-form values.
 */

/** A camera easing: progress curve on t∈[0,1] with certified bounds. */
export interface EasingEntry {
  /** Progress function, e(0)=0, e(1)=1 (may overshoot inside). */
  readonly fn: (t: number) => number;
  /** [min, max] of e(t) over the whole interval — overshoot included. */
  readonly valueRange: readonly [number, number];
  /** max_t |e'(t)| over [0,1], in progress-units per unit-t. */
  readonly dmax: number;
}

/** easeOutBack overshoot constant (CSS default s). */
const BACK_S = 1.70158;
/** backOut: e(t) = 1 + (s+1)(t−1)³ + s(t−1)².
 *  e'(t) = 3(s+1)(t−1)² + 2s(t−1) → zeros at t=1 and t* = 1 − 2s/(3(s+1)).
 *  Interior overshoot peak: e(t*) — closed form below.
 *  |e'| extrema: endpoints e'(0) = 3(s+1) − 2s = s+3, e'(1)=0, plus the
 *  vertex of the quadratic e' at t−1 = −s/(3(s+1)) — its |e'| there is
 *  s²/(3(s+1)) which is < s+3 for s=1.70158, so dmax = s+3. */
const BACK_T_STAR = 1 - (2 * BACK_S) / (3 * (BACK_S + 1));
const BACK_OVERSHOOT =
  1 + (BACK_S + 1) * Math.pow(BACK_T_STAR - 1, 3) + BACK_S * Math.pow(BACK_T_STAR - 1, 2);
const backOutFn = (t: number) => 1 + (BACK_S + 1) * Math.pow(t - 1, 3) + BACK_S * Math.pow(t - 1, 2);

/**
 * The closed set — every entry's bounds derived, not swept.
 * sineInOut: e=(1−cos πt)/2 → e' = (π/2) sin πt → dmax = π/2.
 * cubicOut:  e=1−(1−t)³   → e' = 3(1−t)²       → dmax = 3.
 * quadInOut: e=2t² | 1−2(1−t)² → e' = 4t | 4(1−t) → dmax = 2 at t=0.5.
 * linear:    e=t → dmax = 1.
 */
export const EASINGS = {
  linear: { fn: (t: number) => t, valueRange: [0, 1] as const, dmax: 1 },
  sineInOut: {
    fn: (t: number) => (1 - Math.cos(Math.PI * t)) / 2,
    valueRange: [0, 1] as const,
    dmax: Math.PI / 2,
  },
  cubicOut: {
    fn: (t: number) => 1 - Math.pow(1 - t, 3),
    valueRange: [0, 1] as const,
    dmax: 3,
  },
  quadInOut: {
    fn: (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)),
    valueRange: [0, 1] as const,
    dmax: 2,
  },
  backOut: {
    fn: backOutFn,
    valueRange: [0, BACK_OVERSHOOT] as const,
    dmax: BACK_S + 3,
  },
} as const satisfies Record<string, EasingEntry>;

export type EasingId = keyof typeof EASINGS;

export const EASING_IDS = Object.keys(EASINGS) as EasingId[];
