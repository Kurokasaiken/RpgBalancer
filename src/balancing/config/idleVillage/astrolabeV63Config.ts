/**
 * Config for the Destiny Astrolabe V6.3 semantic/cinematic upgrade (R-067).
 *
 * Covers only the NEW presentation values introduced by the
 * destiny_astrolabe_v63_semantic_cinematic_plan: the Skill Core launcher,
 * the mercury-droplet ball, the obelisk shatter exit, the radial fissure
 * used for wound/death, and the axis-label overlay.
 *
 * Gameplay values (stat, difficulty, risk percentages) stay in the engine
 * config passed by the host — nothing here changes probabilities.
 */

import { z } from 'zod';

/** Zod schema for the V6.3 semantic/cinematic presentation contract. */
const astrolabeV63ConfigSchema = z.object({
  /** Skill Core — the central golden seal that replaces the THROW button. */
  skillCore: z.object({
    /** Radius of the seal as a fraction of the arena radius. */
    radiusFactor: z.number().min(0.05).max(0.4),
    /** Breathing pulse period while armed, in ms. */
    pulseMs: z.number().int().min(400).max(4000),
    /** Implosion duration on click before the ball fires, in ms. */
    implodeMs: z.number().int().min(60).max(600),
  }),
  /** Mercury/amber droplet ball. */
  ball: z.object({
    /** Max elongation along the velocity vector (1 = circle, 1.8 = strong droplet). */
    maxStretch: z.number().min(1).max(3),
    /** Velocity (px/frame) at which maxStretch is reached. */
    stretchSpeed: z.number().min(1).max(60),
    /** Squash factor on bounce (applied perpendicular to the velocity). */
    bounceSquash: z.number().min(0.3).max(1),
    /** Trail lifetime in ms — thin, bright, no particle cloud. */
    trailLifeMs: z.number().int().min(100).max(1200),
    /** Max number of trail samples kept. */
    trailMaxSamples: z.number().int().min(8).max(200),
  }),
  /** Obelisk exit: shatter into shards that fall and sink into the tar-goo. */
  shatter: z.object({
    /** Shards spawned per obelisk. */
    shardsPerPillar: z.number().int().min(3).max(24),
    /** Downward gravity applied to shards, px/ms^2. */
    gravity: z.number().min(0).max(2),
    /** Horizontal scatter speed range, px/frame. */
    spread: z.tuple([z.number(), z.number()]),
    /** Shard lifetime range in ms. */
    lifeMs: z.tuple([z.number().int(), z.number().int()]),
    /** Shard size range in px. */
    size: z.tuple([z.number(), z.number()]),
    /** Max rotation speed, rad/frame. */
    spin: z.number().min(0).max(0.4),
  }),
  /** Radial fissure in the tar-goo at the landing point (wound/death). */
  fissure: z.object({
    /** Time for the crack to fully open, in ms. */
    openMs: z.number().int().min(50).max(1500),
    /** Wound only: time for the crack to close into a thin amber scar, in ms. */
    closeMs: z.number().int().min(200).max(4000),
    /** Base crack width in px before area scaling. */
    widthPx: z.number().min(0.5).max(20),
    /** Jaggedness of the crack path (0 = straight radial line). */
    jag: z.number().min(0).max(1),
    /** Amber scar left after a wound fissure closes. */
    scarColor: z.string(),
    /** Dark violet/black color of the death crack that stays open. */
    crackColor: z.string(),
    /** Violet edge glow around an open death crack. */
    crackEdgeColor: z.string(),
  }),
  /** Animation phase durations for the V6.3 timeline. Centralized here so the
      engine and the React wrapper read the same timing tokens. */
  phaseDurations: z.object({
    ringMs: z.number().int().min(60).max(2000),
    slamMs: z.number().int().min(100).max(4000),
    gooMs: z.number().int().min(200).max(5000),
    axisReadMs: z.number().int().min(100).max(3000),
    burstMs: z.number().int().min(100).max(4000),
    pourMs: z.number().int().min(100).max(4000),
    spinMs: z.number().int().min(500).max(8000),
    snapMs: z.number().int().min(100).max(2000),
  }),
  /** Ball landing — wheel-of-fortune deceleration with fixed-timestep state machine. */
  landing: z.object({
    /** Simulation steps per second. 120 is a good balance for WebView determinism. */
    fixedHz: z.number().int().min(30).max(240),
    /** Spin progress (0..1) where the ball leaves chaotic bouncing and starts aligning. */
    alignP: z.number().min(0).max(1),
    /** Spin progress (0..1) where the ball enters the exact quadratic deceleration. */
    decelP: z.number().min(0).max(1),
    /** Max distance from target that still allows the deceleration phase (safety). */
    captureRadius: z.number().min(10).max(500),
    /** Speed (px/s) below which the ball is allowed to enter the final deceleration. */
    minSpeed: z.number().min(0).max(2000),
    /** Speed (px/s) below which the ball is considered settled. */
    settleSpeed: z.number().min(0).max(200),
    /** Max angular speed at which the ball can turn toward the target, rad/s. */
    turnRate: z.number().min(0).max(50),
    /** Per-second decay of the tangential residual during deceleration (1/s). */
    angularDamping: z.number().min(0).max(20),
    /** Per-frame friction multiplier while the ball is bouncing (1 = no friction). */
    bounceFriction: z.number().min(0.8).max(1),
    /** Per-frame friction multiplier while the ball is aligning (1 = no friction). */
    alignFriction: z.number().min(0.8).max(1),
  }),
  /** Axis labels — skill name + stat/difficulty readout per spoke. */
  axisLabels: z.object({
    /** Label radius as a fraction of the arena radius (inside the disc). */
    radiusFactor: z.number().min(0.5).max(0.98),
    /** Font size in px at the 800px reference canvas. */
    fontPx: z.number().min(8).max(28),
    /** Line gap between the skill name and the stat/difficulty row, in px. */
    lineGapPx: z.number().min(2).max(20),
  }),
  /** Perimeter plaques — skill name/icon on the bronze bezel. */
  perimeterPlaques: z.object({
    /** Radius as a fraction of the 500px arena radius (bezel center is at 0.91). */
    radiusFactor: z.number().min(0.8).max(1.05),
    /** Plaque width in px. */
    width: z.number().int().min(60).max(220),
    /** Plaque height in px. */
    height: z.number().int().min(20).max(70),
    /** Font size in px at the 800px reference canvas. */
    fontPx: z.number().min(8).max(22),
    /** Scale multiplier for the active skill plaque. */
    activeScale: z.number().min(1).max(1.5),
  }),
});

/** Inferred V6.3 presentation config type. */
export type AstrolabeV63Config = z.infer<typeof astrolabeV63ConfigSchema>;

/**
 * Canonical V6.3 presentation parameters. Every value is a token — no
 * component or engine code may hardcode them.
 */
export const astrolabeV63Config: AstrolabeV63Config = astrolabeV63ConfigSchema.parse({
  skillCore: {
    radiusFactor: 0.16,
    pulseMs: 1500,
    implodeMs: 150,
  },
  ball: {
    maxStretch: 1.7,
    stretchSpeed: 18,
    bounceSquash: 0.7,
    trailLifeMs: 420,
    trailMaxSamples: 64,
  },
  shatter: {
    shardsPerPillar: 9,
    gravity: 0.16,
    spread: [0.4, 2.2],
    lifeMs: [520, 900],
    size: [2.5, 7],
    spin: 0.18,
  },
  fissure: {
    openMs: 380,
    closeMs: 1400,
    widthPx: 5,
    jag: 0.55,
    scarColor: 'rgba(232,168,60,0.85)',
    crackColor: 'rgba(6,2,16,0.96)',
    crackEdgeColor: 'rgba(150,70,220,0.6)',
  },
  landing: {
    fixedHz: 120,
    alignP: 0.42,
    decelP: 0.75,
    captureRadius: 140,
    minSpeed: 120,
    settleSpeed: 25,
    turnRate: 8,
    angularDamping: 2.5,
    bounceFriction: 0.9915,
    alignFriction: 0.996,
  },
  axisLabels: {
    radiusFactor: 0.88,
    fontPx: 13,
    lineGapPx: 9,
  },
  perimeterPlaques: {
    radiusFactor: 0.95,
    width: 120,
    height: 34,
    fontPx: 13,
    activeScale: 1.15,
  },
  phaseDurations: {
    ringMs: 140,
    slamMs: 900,
    gooMs: 1100,
    axisReadMs: 560,
    burstMs: 1100,
    pourMs: 720,
    spinMs: 2600,
    snapMs: 650,
  },
});
