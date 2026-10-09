/**
 * rewardTiers — quest reward presentation tiers (PLAN-019-S2.3).
 *
 * A tier is a label on the NOMINAL quest reward — `rewardBase` (scenario
 * offer) × `rewardScale` → `rewardResolved` (integer). Tiers never apply to
 * intermediate loot (conditional by v24 rev.2): the settlement pays
 * `rewardResolved` frozen in the run record; the tier is representation,
 * not a second source.
 *
 * Intervals are half-open `[minReward, next.minReward)` — declared rule: a
 * reward exactly on a boundary belongs to the HIGHER tier (a 1.0 vs 1.01
 * scale difference can only flip a tier when the resolved integer actually
 * crosses the boundary). Below the first `minReward` the lowest tier holds.
 */
import { z } from 'zod';

export const RewardTierSchema = z
  .object({
    id: z.string().min(1),
    /** i18n key for the tier label (idleVillage namespace) — never a string. */
    i18nKey: z.string().min(1),
    /** Lower bound of the tier, resolved-reward units (inclusive). */
    minReward: z.number().int().nonnegative(),
  })
  .strict();
export type RewardTier = z.infer<typeof RewardTierSchema>;

/** Ordered table — must be sorted by `minReward` ascending with the first
 *  at 0 (every non-negative reward belongs to a tier). */
export const REWARD_TIERS: readonly RewardTier[] = z
  .array(RewardTierSchema)
  .min(1)
  .refine(
    (tiers) => tiers[0].minReward === 0 && tiers.every((t, i) => i === 0 || t.minReward > tiers[i - 1].minReward),
    { message: 'tier ordinati per minReward crescente, primo a 0' },
  )
  .parse([
    { id: 'magra', i18nKey: 'idleVillage.questOffer.tier.magra', minReward: 0 },
    { id: 'discreta', i18nKey: 'idleVillage.questOffer.tier.discreta', minReward: 50 },
    { id: 'ricca', i18nKey: 'idleVillage.questOffer.tier.ricca', minReward: 100 },
    { id: 'leggendaria', i18nKey: 'idleVillage.questOffer.tier.leggendaria', minReward: 200 },
  ]);

/** Declared rounding of the resolved reward: `rewardBase × rewardScale`,
 *  nearest integer (`.5` rounds up — `Math.round`). */
export function resolveReward(rewardBase: number, rewardScale: number): number {
  return Math.max(0, Math.round(rewardBase * rewardScale));
}

/** Tier of a resolved reward — half-open intervals, boundary = higher tier. */
export function rewardTierFor(rewardResolved: number): RewardTier {
  let tier = REWARD_TIERS[0];
  for (const t of REWARD_TIERS) {
    if (rewardResolved >= t.minReward) tier = t;
    else break;
  }
  return tier;
}
