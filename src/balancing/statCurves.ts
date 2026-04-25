export interface StatCurveSegment {
  min: number;
  max: number;
  factor: number;
}

export type StatCurves = Record<string, StatCurveSegment[]>;

/**
 * STAT_CURVES
 *
 * Config-driven non-linear cost modifiers for stats.
 *
 * - factor = 1.0  => linear cost (no change)
 * - factor > 1.0  => points are more expensive in this value range
 * - factor < 1.0  => points are cheaper in this value range
 *
 * These curves are intentionally conservative; they can be refined
 * using MarginalUtilityCalculator / runStatStressTests.
 */
export const STAT_CURVES: StatCurves = {
  // Evasion becomes increasingly swingy at high values.
  // Make high evasion more expensive in stat testing.
  evasion: [
    { min: 0, max: 20, factor: 0.8 },
    { min: 20, max: 40, factor: 1.0 },
    { min: 40, max: 60, factor: 1.4 },
    { min: 60, max: 80, factor: 1.8 },
    { min: 80, max: 200, factor: 2.2 },
  ],

  // Critical chance strongly amplifies all other offensive stats.
  critChance: [
    { min: 0, max: 10, factor: 0.7 },
    { min: 10, max: 30, factor: 1.0 },
    { min: 30, max: 50, factor: 1.5 },
    { min: 50, max: 75, factor: 2.0 },
    { min: 75, max: 100, factor: 2.5 },
  ],

  // Flat armor: early points are good, very high armor should be costly.
  armor: [
    { min: 0, max: 50, factor: 1.0 },
    { min: 50, max: 100, factor: 1.2 },
    { min: 100, max: 200, factor: 1.5 },
    { min: 200, max: 10000, factor: 2.0 },
  ],

  // Resistance %: multiplicative mitigation, very strong at high values.
  resistance: [
    { min: 0, max: 20, factor: 0.9 },
    { min: 20, max: 40, factor: 1.1 },
    { min: 40, max: 60, factor: 1.5 },
    { min: 60, max: 100, factor: 2.0 },
  ],
};

/**
 * Get multiplicative curve factor for a stat at a given value.
 *
 * If no curve is defined for the stat, returns 1.0.
 */
export function getStatCurveFactor(statId: string, value: number | undefined | null): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return 1.0;
  }

  const segments = STAT_CURVES[statId];
  if (!segments || segments.length === 0) {
    return 1.0;
  }

  for (const seg of segments) {
    if (value >= seg.min && value < seg.max) {
      return seg.factor;
    }
  }

  // If value is above the last segment, clamp to the last segment's factor.
  return segments[segments.length - 1].factor;
}
