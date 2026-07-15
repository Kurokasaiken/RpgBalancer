import { z } from 'zod';
import { DestinyAstrolabeV3Config } from './astrolabeV3Config.schema';

export const astrolabeV3Config = DestinyAstrolabeV3Config.extend({
  theSpinDurationMin: z.number(),
  theSpinDurationMax: z.number(),
  slowMoScale: z.number(),
  slowMoDistance: z.number(),
  hitStopFreeze: z.number(),
  bounceCountMin: z.number(),
  bounceCountMax: z.number(),
  cameraPushIn: z.number(),
  trailFadeMs: z.number(),
  rngSeed: z.number(),
});