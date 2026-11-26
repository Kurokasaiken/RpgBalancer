import { z } from 'zod';
import measurements from './mappa2FitMeasurements.json';

const rectSchema = z.object({ x0: z.number(), y0: z.number(), x1: z.number(), y1: z.number() });
const measurementsSchema = z.object({
  source: z.string(),
  method: z.string(),
  canvas: z.object({ width: z.number().positive(), height: z.number().positive() }),
  landBounds: rectSchema,
  mainComponentAreaPx: z.number().positive(),
});

/** Generated measurement of the principal mappa2 continent (scripts/plan135/build-mappa2-landbounds.py). */
export const MAPPA2_FIT_MEASUREMENTS = measurementsSchema.parse(measurements);

/** PLAN-135 D1(b): approved apron depth in world px at canvas 1× scale. */
export const MAPPA2_APRON = { top: 200, right: 560, bottom: 0, left: 560 } as const;

/** Fixed HUD slots participating in the resting-fit guarantee; floating panels and the narrator slot do not. */
export const MAPPA2_FIT_CHROME_SLOTS = ['time', 'resources', 'events', 'nav'] as const;
