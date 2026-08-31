import { z } from 'zod';

/**
 * Zod schema for the event reminder token contract.
 *
 * These tokens drive the visual presentation of the world-surface event
 * reminder. No component should hardcode these values; they are the single
 * source of truth.
 */
const tokensSchema = z.object({
  /** Gilded / imperial frame tokens. */
  gilded: z.object({
    frameStroke: z.string(),
    frameGradientStart: z.string(),
    frameGradientMid: z.string(),
    frameGradientEnd: z.string(),
    frameShadow: z.string(),
    ornamentStroke: z.string(),
    ornamentFill: z.string(),
    gemFill: z.string(),
    gemStroke: z.string(),
    gemGlow: z.string(),
    gemFace: z.string(),
    gemShadow: z.string(),
    gemSpecular: z.string(),
    gemBezel: z.string(),
  }),
  /** Dark enamel plaque surface. */
  surface: z.object({
    background: z.string(),
    boxShadow: z.string(),
    rimLight: z.string(),
    texture: z.string(),
  }),
  /** Ambient glow behind the reminder. */
  glow: z.object({
    ambient: z.string(),
    ambientOpacity: z.number(),
  }),
  /** Canonical dimensions (design px). */
  sizing: z.object({
    width: z.number(),
    minHeight: z.number(),
    poiSize: z.number(),
  }),
  /** POI medallion animation. */
  poi: z.object({
    fillDurationMs: z.number(),
  }),
  /** Countdown typography. */
  countdown: z.object({
    labelSize: z.number(),
    labelColor: z.string(),
    labelGlow: z.string(),
    numberSize: z.number(),
    numberColor: z.string(),
    numberGlow: z.string(),
  }),
  /** Title engraving. */
  title: z.object({
    color: z.string(),
    shadow: z.string(),
    highlight: z.string(),
  }),
  /** Temporal states. */
  states: z.object({
    calm: z.object({
      frameGlow: z.string(),
      numberGlow: z.string(),
    }),
    urgent: z.object({
      frameGlow: z.string(),
      numberGlow: z.string(),
      pulseDurationMs: z.number(),
    }),
    active: z.object({
      frameGlow: z.string(),
      numberGlow: z.string(),
    }),
  }),
});

/** Inferred token type. */
export type EventReminderTokens = z.infer<typeof tokensSchema>;

/**
 * Canonical tokens for the world-surface event reminder.
 *
 * Palette follows the Prismatic Wanderlust art Bible: deep teal shadows,
 * Solar Triumph golds, no grey/brown.
 */
export const eventReminderTokens: EventReminderTokens = {
  gilded: {
    frameStroke: '#d4aa50',
    frameGradientStart: '#f8e4a8',
    frameGradientMid: '#c9a14a',
    frameGradientEnd: '#5a3f18',
    frameShadow: 'rgba(0, 0, 0, 0.55)',
    ornamentStroke: '#e4bd62',
    ornamentFill: 'rgba(61, 37, 19, 0.55)',
    gemFill: '#48b5a8',
    gemStroke: '#a8e8e0',
    gemGlow: 'rgba(72, 181, 168, 0.55)',
    gemFace: '#7fd6cd',
    gemShadow: '#1f5a52',
    gemSpecular: '#ffffff',
    gemBezel: '#2a1a0e',
  },
  surface: {
    background:
      'radial-gradient(ellipse at 25% 8%, rgba(255,255,255,.08), transparent 42%), ' +
      'radial-gradient(ellipse at 85% 95%, rgba(0,118,130,.14), transparent 48%), ' +
      'linear-gradient(135deg, #07131b 0%, #0c1921 45%, #061016 100%)',
    boxShadow:
      'inset 0 1px rgba(255,255,255,.11), inset 0 -2px rgba(0,0,0,.7), ' +
      '0 4px 4px rgba(0,0,0,.5), 0 14px 30px rgba(0,0,0,.35)',
    rimLight: 'rgba(255,255,255,0.10)',
    texture: 'rgba(255,255,255,0.03)',
  },
  glow: {
    ambient: 'rgba(22, 141, 147, .22)',
    ambientOpacity: 0.55,
  },
  sizing: {
    width: 420,
    minHeight: 142,
    poiSize: 92,
  },
  poi: {
    fillDurationMs: 3000,
  },
  countdown: {
    labelSize: 10,
    labelColor: '#9ddcd6',
    labelGlow: '0 1px 2px rgba(0,0,0,.8)',
    numberSize: 34,
    numberColor: '#f0d58b',
    numberGlow: '0 0 14px rgba(240,207,106,.4), 0 2px 4px rgba(0,0,0,.6)',
  },
  title: {
    color: '#f0d58b',
    shadow: '0 -1px 0 rgba(255,255,255,.25), 0 1px 0 rgba(0,0,0,.9), 0 3px 6px rgba(0,0,0,.7)',
    highlight: '0 0 10px rgba(240,207,106,.25)',
  },
  states: {
    calm: {
      frameGlow: 'rgba(22, 141, 147, .20)',
      numberGlow: '0 0 12px rgba(240,207,106,.35), 0 2px 4px rgba(0,0,0,.6)',
    },
    urgent: {
      frameGlow: 'rgba(72, 181, 168, .45)',
      numberGlow: '0 0 16px rgba(72, 181, 168, .45), 0 2px 4px rgba(0,0,0,.6)',
      pulseDurationMs: 1800,
    },
    active: {
      frameGlow: 'rgba(212, 86, 86, .45)',
      numberGlow: '0 0 16px rgba(212, 86, 86, .45), 0 2px 4px rgba(0,0,0,.6)',
    },
  },
};

/**
 * Runtime validation for the event reminder token contract.
 */
export function validateEventReminderTokens(
  candidate: unknown,
): EventReminderTokens {
  return tokensSchema.parse(candidate);
}
