/**
 * validationConfig — lab validation thresholds (PLAN-029 SP-3).
 * Config-first: the advisory ratio is a config value, explicitly marked
 * uncalibrated until SP-4/MC evidence calibrates it.
 */

import { z } from 'zod';

export const ValidationConfigSchema = z
  .object({
    /** Fraction of scenes that must be hook-bearing to avoid WARNING. */
    hookRatio: z
      .object({
        advisory: z.number().min(0).max(1),
        /** Honest flag: this threshold has not been calibrated by evidence. */
        uncalibrated: z.literal(true),
      })
      .strict(),
  })
  .strict();

export type ValidationConfig = z.infer<typeof ValidationConfigSchema>;

/** The live config — advisory 0.75 per the SPEC hook rule, uncalibrated. */
export const validationConfig: ValidationConfig = ValidationConfigSchema.parse({
  hookRatio: { advisory: 0.75, uncalibrated: true },
});
