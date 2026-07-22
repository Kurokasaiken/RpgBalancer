import { z } from 'zod';

const worldSurfaceConfigSchema = z.object({
  parallax: z.object({
    multipliers: z.array(z.number()),
    bounds: z.array(z.number()),
  }),
  breath: z.object({
    timing: z.number(),
    amplitude: z.number(),
  }),
  calibration: z.object({
    baseOpacity: z.number(),
  }),
  events: z.array(z.any()),
  wonders: z.array(z.any()),
  underwater: z.array(z.any()),
});

export const WORLD_SURFACE_CONFIG = worldSurfaceConfigSchema.parse({
  parallax: {
    multipliers: [1.2, 1.1, 1.02, 1, 0.9, 0.75],
    bounds: [-40, 40],
  },
  breath: {
    timing: 4000,
    amplitude: 2,
  },
  calibration: {
    baseOpacity: 0.5,
  },
  events: [],
  wonders: [],
  underwater: [],
});
