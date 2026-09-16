import { z } from 'zod';

/**
 * Config for the run-ending "Settlement Lost" takeover (R-072 scene 5,
 * direction C — verdict on screen).
 *
 * "Oxidised grey" is not a neutral grey: the art bible forbids grey/brown
 * shadows and grey fog. The grade desaturates to luminance and re-maps it onto
 * a verdigris ramp — the same gradient-map technique as
 * `eventShroudGradeTokens.ts` (`feColorMatrix saturate=0` + `feComponentTransfer`
 * table), so painted highlights keep their range while shadows go oxidised
 * copper-green.
 */

/** A gradient-map ramp as SVG `feComponentTransfer` table values, 0..1. */
export const ShroudGradeRampSchema = z.object({
  /** Red channel table values, evenly spaced across input luminance. */
  red: z.array(z.number().min(0).max(1)).min(2).readonly(),
  /** Green channel table values, evenly spaced across input luminance. */
  green: z.array(z.number().min(0).max(1)).min(2).readonly(),
  /** Blue channel table values, evenly spaced across input luminance. */
  blue: z.array(z.number().min(0).max(1)).min(2).readonly(),
});
export type ShroudGradeRamp = z.infer<typeof ShroudGradeRampSchema>;

/**
 * Verdigris ramp for the run-ending grade. Anchors: ink #0d1412, shadow
 * #22312b, mid #4a5d53, lit #83998c, crown #c9d4ca. Cooler and flatter than the
 * threat shroud's ottanio — the world reads as spent, not merely shadowed.
 */
export const OXIDIZED_RAMP: ShroudGradeRamp = {
  red: [0.051, 0.086, 0.133, 0.2, 0.29, 0.392, 0.514, 0.663, 0.788],
  green: [0.078, 0.129, 0.192, 0.271, 0.365, 0.478, 0.6, 0.729, 0.831],
  blue: [0.071, 0.114, 0.169, 0.239, 0.325, 0.431, 0.549, 0.678, 0.792],
};

export const SettlementLostConfigSchema = z.object({
  /** DOM id of the SVG filter `OxidizedGradeFilter` mounts. */
  filterId: z.string().min(1),
  /** Gradient-map ramp applied to the world surface container. */
  ramp: ShroudGradeRampSchema,
  /** Ms for the iris/vignette sweep before the verdict card appears. */
  irisDurationMs: z.number().int().positive(),
  /** Ms for the verdict card fade-in once the iris has closed. */
  cardFadeDurationMs: z.number().int().positive(),
  /** Peak opacity of the dark backdrop behind the verdict card, 0..1. */
  backdropOpacity: z.number().min(0).max(1),
  /** i18n keys (idleVillage namespace) for the verdict card copy. */
  copy: z.object({
    titleKey: z.string().min(1),
    subtitleKey: z.string().min(1),
    lossesTitleKey: z.string().min(1),
    ctaKey: z.string().min(1),
    debugTriggerKey: z.string().min(1),
  }),
  /**
   * Narrative loss beats shown in the verdict card. i18n keys, not literals —
   * they are flavour text, not real gameplay facts (Director 2026-09-16: the
   * loss list may be mocked). Real stats render separately from
   * `gameOverState.summary` when present.
   */
  lossBeatKeys: z.array(z.string().min(1)).min(1),
});
export type SettlementLostConfig = z.infer<typeof SettlementLostConfigSchema>;

export const SETTLEMENT_LOST_FILTER_ID = 'ws-settlement-lost-oxidized';

export const settlementLostConfig: SettlementLostConfig = SettlementLostConfigSchema.parse({
  filterId: SETTLEMENT_LOST_FILTER_ID,
  ramp: OXIDIZED_RAMP,
  irisDurationMs: 1100,
  cardFadeDurationMs: 700,
  backdropOpacity: 0.55,
  copy: {
    titleKey: 'world.settlementLost.title',
    subtitleKey: 'world.settlementLost.subtitle',
    lossesTitleKey: 'world.settlementLost.lossesTitle',
    ctaKey: 'world.settlementLost.cta',
    debugTriggerKey: 'world.debug.settlementLost',
  },
  lossBeatKeys: [
    'world.settlementLost.losses.walls',
    'world.settlementLost.losses.heroes',
    'world.settlementLost.losses.stores',
  ],
});

export default settlementLostConfig;
