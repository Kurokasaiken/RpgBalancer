import { z } from 'zod';

/**
 * World-space dimensions for the continuous quest-route overlay on `/game`.
 * At the canonical map fit these values scale with the authored map; colors
 * remain skin-driven in the SVG through `--skin-*` variables.
 */
export const QuestJourneyRouteConfigSchema = z
  .object({
    /** Dark cartographic casing beneath the traveled stroke. */
    casingWidthWorldPx: z.number().positive(),
    /** Muted dashed line showing the route that remains. */
    guideWidthWorldPx: z.number().positive(),
    /** Length and gap of the faint untraveled route dashes. */
    guideDashWorldPx: z.number().positive(),
    guideGapWorldPx: z.number().positive(),
    /** Bright traveled line and its fine engraved highlight. */
    progressWidthWorldPx: z.number().positive(),
    highlightWidthWorldPx: z.number().positive(),
    /** Small endpoint seals at the village and quest POI. */
    endpointRadiusWorldPx: z.number().positive(),
    endpointCoreRadiusWorldPx: z.number().positive(),
    endpointStrokeWidthWorldPx: z.number().positive(),
    /** Party marker dimensions; the glyph scales with the map layer. */
    partyHaloRadiusWorldPx: z.number().positive(),
    partyCoreRadiusWorldPx: z.number().positive(),
    partyStrokeWidthWorldPx: z.number().positive(),
    partyGlyphScale: z.number().positive(),
    /** Small status badges anchored to the party marker (parked crossroads
     *  above, encumbered-loot pouch below). */
    markerBadgeRadiusWorldPx: z.number().positive(),
    markerBadgeOffsetWorldPx: z.number().positive(),
    markerBadgeGlyphWorldPx: z.number().positive(),
    /** Length of the travelling glint on the traveled stretch. */
    glintLengthWorldPx: z.number().positive(),
  })
  .strict()
  .superRefine((config, ctx) => {
    if (config.casingWidthWorldPx <= config.progressWidthWorldPx) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['casingWidthWorldPx'],
        message: 'Route casing must be wider than the traveled stroke.',
      });
    }
    if (config.endpointCoreRadiusWorldPx >= config.endpointRadiusWorldPx) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endpointCoreRadiusWorldPx'],
        message: 'Endpoint core must be smaller than its seal.',
      });
    }
    if (config.partyCoreRadiusWorldPx >= config.partyHaloRadiusWorldPx) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['partyCoreRadiusWorldPx'],
        message: 'Party core must be smaller than its halo.',
      });
    }
    if (config.markerBadgeOffsetWorldPx <= config.partyHaloRadiusWorldPx) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['markerBadgeOffsetWorldPx'],
        message: 'Badge offset must clear the party halo.',
      });
    }
    if (config.markerBadgeGlyphWorldPx >= config.markerBadgeRadiusWorldPx * 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['markerBadgeGlyphWorldPx'],
        message: 'Badge glyph must fit inside its seal.',
      });
    }
  });

/** Runtime-validated default dimensions for the selected continuous route style. */
export const QUEST_JOURNEY_ROUTE_CONFIG = QuestJourneyRouteConfigSchema.parse({
  casingWidthWorldPx: 36,
  guideWidthWorldPx: 7,
  guideDashWorldPx: 10,
  guideGapWorldPx: 20,
  progressWidthWorldPx: 20,
  highlightWidthWorldPx: 4,
  endpointRadiusWorldPx: 33,
  endpointCoreRadiusWorldPx: 11,
  endpointStrokeWidthWorldPx: 6,
  partyHaloRadiusWorldPx: 52,
  partyCoreRadiusWorldPx: 33,
  partyStrokeWidthWorldPx: 6,
  partyGlyphScale: 3.25,
  markerBadgeRadiusWorldPx: 24,
  markerBadgeOffsetWorldPx: 74,
  markerBadgeGlyphWorldPx: 30,
  glintLengthWorldPx: 46,
});
