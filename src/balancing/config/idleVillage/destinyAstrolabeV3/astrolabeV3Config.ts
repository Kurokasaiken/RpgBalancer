import { z } from 'zod';

/**
 * Destiny Astrolabe V3 — config-first (piano §A).
 * Ogni valore usato dall'engine/simulazione vive qui, validato Zod.
 * Niente magic numbers nel draw loop.
 */
export const AstrolabeV3ConfigSchema = z.object({
  /* Geometria (spazio normalizzato: raggio arena = 1) */
  coreRadius: z.number().min(0.05).max(0.3).default(0.12),
  maxRadius: z.number().min(0.5).max(1).default(0.95),
  /** Clamp minimo di leggibilità per bande/zone (unità normalizzate ≈ 3px su 380px). */
  minVisualThickness: z.number().min(0).max(0.1).default(0.01),
  minVoidRadius: z.number().min(0).max(0.2).default(0.03),
  /** Banda near-miss: % della distanza normalizzata centro→stella (D7). */
  nearMissPct: z.number().min(0).max(25).default(5),

  /* Timeline (ms) — fasi §5 */
  tRingLock: z.number().default(600),
  tThreatSlam: z.number().default(900),
  tAgencyBurst: z.number().default(1100),
  tRiskPour: z.number().default(800),
  tSnap: z.number().default(250),
  tMorphMs: z.number().default(300),

  /* The-spin §6 */
  theSpinDurationMin: z.number().default(3500),
  theSpinDurationMax: z.number().default(4500),
  slowMoScale: z.number().min(0.1).max(1).default(0.45),
  /** Soglia slow-mo: frazione del raggio arena di distanza dal punto di atterraggio. */
  slowMoDistance: z.number().min(0).max(1).default(0.15),
  hitStopFreezeMs: z.number().min(0).max(400).default(100),
  bounceCountMin: z.number().int().default(2),
  bounceCountMax: z.number().int().default(4),
  cameraPushIn: z.number().min(0).max(0.2).default(0.06),
  trailFadeMs: z.number().default(400),

  /* Vincoli modifiers §7 */
  statClampMin: z.number().default(1),
  statClampMax: z.number().default(99),
  riskPctMax: z.number().default(60),

  /* Rendering */
  dprCap: z.number().default(2),

  /* Onboarding */
  onboardingMaxViews: z.number().int().default(3),

  /* RNG seed di default per i test (l'engine usa un seed per-lancio) */
  rngSeed: z.number().default(1),
});

export type AstrolabeV3Config = z.infer<typeof AstrolabeV3ConfigSchema>;

export const astrolabeV3Config: AstrolabeV3Config = AstrolabeV3ConfigSchema.parse({});
