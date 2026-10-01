/**
 * Mission Planner UI configuration.
 *
 * Presentation-only knobs of the Planner (qualitative bands, WHY density,
 * gauge geometry). Gameplay numbers never live here: they come from the
 * engine preview and the balancing config.
 */
import { z } from 'zod';

export const MissionPlannerUiConfigSchema = z.object({
  /** Percent thresholds for the verbal bands shown next to probabilities. */
  bands: z
    .object({
      high: z.number().min(0).max(100),
      low: z.number().min(0).max(100),
    })
    .refine((b) => b.low < b.high, { message: 'bands.low must be below bands.high' }),
  /** Max WHY lines kept per metric, strongest effects first. */
  whyLinesPerMetric: z.number().int().positive(),
  /** Diameter (px) of the success omen seal. */
  omenSize: z.number().positive(),
  /** Diameter (px) of a route waypoint medallion. */
  waypointSize: z.number().positive(),
  /** Diameter (px) of a party member medallion. */
  memberSize: z.number().positive(),
});

export type MissionPlannerUiConfig = z.infer<typeof MissionPlannerUiConfigSchema>;

/** Default Planner presentation config. */
export const DEFAULT_MISSION_PLANNER_UI_CONFIG: MissionPlannerUiConfig = MissionPlannerUiConfigSchema.parse({
  bands: { high: 70, low: 35 },
  whyLinesPerMetric: 4,
  omenSize: 168,
  waypointSize: 78,
  memberSize: 58,
});
