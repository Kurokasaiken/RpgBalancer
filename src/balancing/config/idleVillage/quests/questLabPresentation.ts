/**
 * Quest S1 lab — presentation layer configuration (PLAN-023, artifact-r005).
 *
 * Everything the cockpit UI needs that is a *number* or a *policy* lives
 * here: layout budget, presentation timing, damage-channel parameters,
 * exposure encoding, skip/input guards, and the pace the player picks
 * BEFORE a check (Director D1: manual skip, pace chosen pre-check).
 * No component may hardcode these values; colors stay in skin tokens.
 */

import { z } from 'zod';

/** Exposure encoding tiers — how the per-slot chance-per-hit reads. */
export const ExposureTierSchema = z.object({
  /** Upper bound (inclusive) of this tier's chance-per-hit %. */
  maxPct: z.number().min(0).max(100),
  /** Lucide-ish icon id resolved by the UI ('shield', 'shield-half', 'crosshair'). */
  icon: z.string(),
});

/** Zod schema for the lab's presentation values. */
export const QuestLabPresentationSchema = z.object({
  layout: z
    .object({
      /** vh budget of the three cockpit regions (they must sum ≈100). */
      contextStripVh: z.number().default(6),
      stageBandVh: z.number().default(48),
      actionZoneVh: z.number().default(46),
      /** Bounded content width so ultrawide doesn't stretch to emptiness. */
      maxWidthPx: z.number().default(1560),
    })
    .prefault({}),

  /** Presentation timeline: one speed factor scales EVERY segment — no
   *  component invents its own accelerated durations (artifact §8). */
  timeline: z
    .object({
      /** Base durations per beat (ms) at speed ×1. */
      cinematicMs: z.number().default(900),
      verdictHoldMs: z.number().default(200),
      killsMs: z.number().default(400),
      /** Hard ceiling for the harm phase; stagger auto-compresses to fit. */
      maxHarmPhaseMs: z.number().default(1500),
      settleMs: z.number().default(100),
      /** How much of a phase's tail the next phase may overlap (0–0.5). */
      phaseOverlapPct: z.number().min(0).max(0.5).default(0.15),
      /** 'fast' pace multiplier the player can pre-select (Director D1). */
      fastSpeed: z.number().min(1).max(10).default(2.5),
    })
    .prefault({}),

  /** Damage channel: transient floaters + durable delta chips + HP ghost. */
  damage: z
    .object({
      floatRisePx: z.number().default(26),
      floatLifeMs: z.number().default(900),
      /** Stagger between floaters on the same member (harm lanes). */
      staggerMs: z.number().default(150),
      maxFloatersPerMember: z.number().min(1).max(6).default(3),
      /** amount ≥ ratio × maxHp reads as a heavy hit (scaled up, longer life). */
      heavyHitRatio: z.number().min(0).max(1).default(0.25),
      /** Ghost layer: hold at hpBefore then drain once after last event. */
      ghostHoldMs: z.number().default(350),
      ghostDrainMs: z.number().default(600),
      /** Hit marker (transient): brass ring + shake duration. */
      hitMarkerMs: z.number().default(600),
    })
    .prefault({}),

  /** Formation / horde presentation. */
  formation: z
    .object({
      exposureTiers: z.array(ExposureTierSchema).min(1).default([
        { maxPct: 0, icon: 'shield' },
        { maxPct: 30, icon: 'shield-half' },
        { maxPct: 100, icon: 'crosshair' },
      ]),
      /** Tween for exposure values when the profile shifts (turn/death). */
      exposureRetweenMs: z.number().default(400),
      /** Rank-shift animation when the living close ranks toward the horde. */
      rankShiftMs: z.number().default(450),
      /** Horde token cap — beyond it, a numeral + proportional fill. */
      maxHordeTokens: z.number().min(1).default(10),
      /** The exposure pips per member card (10 = decile gauge). */
      exposurePips: z.number().min(4).max(20).default(10),
    })
    .prefault({}),

  /** Skip / input contract (Director D1: manual, pace chosen pre-check). */
  input: z
    .object({
      /** After settle, swallow input for this long so a skip keystroke can't
       *  fire the revealed action button. */
      inputGuardMs: z.number().default(150),
      /** Hit-marker aria-live region debounce. */
      liveDebounceMs: z.number().default(100),
    })
    .prefault({}),

  /** Motion levels honored via useSkinBinding.supportedMotionLevels. */
  motion: z
    .object({
      /** 'minimal' = no floaters/shakes; instant fills + delta chips. */
      defaultLevel: z.enum(['full', 'reduced', 'minimal']).default('full'),
    })
    .prefault({}),

  /** Option tooltip disclosure: which stakes to show pre-click (D1). */
  tooltip: z
    .object({
      showBound: z.boolean().default(true),
      showWoundPct: z.boolean().default(true),
      showDeathPct: z.boolean().default(true),
      showToll: z.boolean().default(true),
      /** Show the armed-consumable delta inside the same tooltip. */
      showConsumableDelta: z.boolean().default(true),
    })
    .prefault({}),
});

/** Inferred config type. */
export type QuestLabPresentation = z.infer<typeof QuestLabPresentationSchema>;

/** Default presentation values — validated at module load. */
export const DEFAULT_QUEST_LAB_PRESENTATION: QuestLabPresentation =
  QuestLabPresentationSchema.parse({});
