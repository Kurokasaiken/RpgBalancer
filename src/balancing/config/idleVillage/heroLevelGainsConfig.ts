/**
 * Hero level-up gains (PLAN-067 T-C1, R-234) — what the ceremony plate shows besides the new level.
 *
 * Presentation-only, like `heroLevelConfig` (no XP, no persistence — PROGRESSION.md owns the real
 * system): per hero, the authored stat deltas and the HP delta. The plate reads the hero's CURRENT
 * values from the roster and shows `from → from + delta`; a stat the hero does not have is skipped.
 */
import { z } from 'zod';

export const heroLevelGainsSchema = z.record(
  z.string().min(1),
  z.object({
    stats: z.array(z.object({ key: z.string().min(1), delta: z.number().int().positive() })).min(1),
    hpDelta: z.number().int().positive(),
  }).strict(),
);
export type HeroLevelGains = z.infer<typeof heroLevelGainsSchema>;

export const HERO_LEVEL_GAINS: HeroLevelGains = heroLevelGainsSchema.parse({
  'hero-giggiolillo': { stats: [{ key: 'agility', delta: 6 }, { key: 'evasion', delta: 2 }], hpDelta: 12 },
  'hero-salvatrice': { stats: [{ key: 'regen', delta: 3 }, { key: 'ward', delta: 4 }], hpDelta: 10 },
  'hero-sir-spaccaculi': { stats: [{ key: 'damage', delta: 5 }, { key: 'armor', delta: 4 }], hpDelta: 16 },
});

/** Fallback for any other hero the Director might level. */
export const HERO_LEVEL_GAINS_DEFAULT = { stats: [{ key: 'agility', delta: 4 }], hpDelta: 10 } as const;
