/**
 * worldScaling — external progress → offer modifiers (PLAN-019-S2.3, D-I).
 *
 * v0: the ONLY real signal is `daysPlayed` (TimeEngine `currentDay`).
 * `avgHeroPower` / `avgEquipPower` are documented FUTURE signals — they join
 * the schema when a canonical metric exists, with `schemaVersion` bumped
 * (r2: no dead fields at weight 0).
 *
 * Contract (stable even if the formula is replaced):
 * - `dangerScale` / `rewardScale` ∈ their declared `range`, always clamped;
 * - monotone non-decreasing in every present signal;
 * - identity (1.0) when no declared signal is present;
 * - deterministic: same signals → same scales;
 * - direction of effect declared per output (`min` = young world, `max` =
 *   oldest world under monotone-normalized aggregation).
 */
import { z } from 'zod';

/** One real progress signal: linear normalization over `domain`, clamped
 *  to [0,1] outside it (`outOfDomain: 'clamp'` — the declared behavior, and
 *  the only implemented mode). `weight` enters the aggregate. */
export const WorldSignalSchema = z
  .object({
    /** [min, max] of the signal's real domain (daysPlayed: TimeEngine days). */
    domain: z.tuple([z.number(), z.number()]),
    /** Contribution to the aggregate [0,1]. 0 = present but inert. */
    weight: z.number().min(0).max(1),
    /** Declared behavior outside `domain` — v0 supports clamp only. */
    outOfDomain: z.literal('clamp'),
  })
  .strict()
  .refine((s) => s.domain[1] > s.domain[0], { message: 'domain[1] deve essere > domain[0]' });
export type WorldSignal = z.infer<typeof WorldSignalSchema>;

/** Output scale contract: the value `resolveQuestOffer` applies. `range` is
 *  the hard clamp; `direction` documents which end of the aggregate maps to
 *  which end of the range. */
export const WorldOutputSchema = z
  .object({
    range: z.tuple([z.number().positive(), z.number().positive()]),
    direction: z.enum(['increasing', 'decreasing']),
  })
  .strict()
  .refine((o) => o.range[1] >= o.range[0], { message: 'range[1] deve essere >= range[0]' });
export type WorldOutput = z.infer<typeof WorldOutputSchema>;

export const WorldScalingSchema = z
  .object({
    schemaVersion: z.number().int().positive(),
    signals: z
      .object({
        /** v0 ONLY real signal — TimeEngine `currentDay`. */
        daysPlayed: WorldSignalSchema,
      })
      .strict(),
    outputs: z
      .object({
        /** Multiplies whitelisted danger fields on the ScenarioInstance. */
        dangerScale: WorldOutputSchema,
        /** Multiplies `rewardBase` → `rewardResolved` (integer, rounded). */
        rewardScale: WorldOutputSchema,
      })
      .strict(),
  })
  .strict();
export type WorldScaling = z.infer<typeof WorldScalingSchema>;

/**
 * Authored v0 table. First pass values — a 30-day-old world pushes danger
 * +40% and reward +25% over a fresh one. Calibration of the NUMBERS is the
 * Director's (R-105); the contract is what is being built here.
 */
export const WORLD_SCALING: WorldScaling = WorldScalingSchema.parse({
  schemaVersion: 1,
  signals: {
    daysPlayed: { domain: [0, 30], weight: 1, outOfDomain: 'clamp' },
  },
  outputs: {
    dangerScale: { range: [1.0, 1.4], direction: 'increasing' },
    rewardScale: { range: [1.0, 1.25], direction: 'increasing' },
  },
});

/** Signals collected from the world — every declared key optional; an
 *  absent key is «no signal», not «signal at 0». */
export interface WorldProgressSignals {
  daysPlayed?: number;
}

export interface WorldScales {
  dangerScale: number;
  rewardScale: number;
}

/** Weighted aggregate of normalized signals ∈ [0,1]; `null` = no signal
 *  present (→ identity scales). Pure and deterministic. */
function aggregate(config: WorldScaling, signals: WorldProgressSignals): number | null {
  let sum = 0;
  let wsum = 0;
  for (const [key, spec] of Object.entries(config.signals) as [keyof WorldProgressSignals, WorldSignal][]) {
    const raw = signals[key];
    if (raw === undefined || !Number.isFinite(raw)) continue;
    const [lo, hi] = spec.domain;
    const norm = Math.min(1, Math.max(0, (raw - lo) / (hi - lo))); // 'clamp'
    sum += norm * spec.weight;
    wsum += spec.weight;
  }
  return wsum > 0 ? sum / wsum : null;
}

/**
 * `signals → {dangerScale, rewardScale}` — the single computation point.
 * Contract: clamped to `range`, monotone in the aggregate, identity (1.0)
 * when no signal is present, deterministic.
 */
export function computeWorldScales(signals: WorldProgressSignals, config: WorldScaling = WORLD_SCALING): WorldScales {
  const a = aggregate(config, signals);
  if (a === null) return { dangerScale: 1.0, rewardScale: 1.0 };
  const out = {} as WorldScales;
  for (const [key, spec] of Object.entries(config.outputs) as [keyof WorldScales, WorldOutput][]) {
    const [lo, hi] = spec.range;
    const t = spec.direction === 'increasing' ? a : 1 - a;
    out[key] = lo + (hi - lo) * t;
  }
  return out;
}
