import { z } from 'zod';

/**
 * Zod schema for the event reminder token contract.
 *
 * These tokens drive the visual presentation of the world-surface event
 * reminder (gilded frame, surface, glow, sizing, POI animation). No component
 * should hardcode these values; they are the single source of truth.
 */
const tokensSchema = z.object({
  /** Gilded / imperial frame tokens. */
  gilded: z.object({
    frameStroke: z.string(),
    ornamentStroke: z.string(),
    gemFill: z.string(),
  }),
  /** Dark enamel plaque surface. */
  surface: z.object({
    background: z.string(),
    boxShadow: z.string(),
    rimLight: z.string(),
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
    ornamentStroke: '#e4bd62',
    gemFill: '#f0d58b',
  },
  surface: {
    background:
      'radial-gradient(ellipse at 18% 0%, rgba(255,255,255,.07), transparent 42%), ' +
      'radial-gradient(ellipse at 82% 100%, rgba(0,118,130,.12), transparent 45%), ' +
      'linear-gradient(135deg, #07131b 0%, #0a1720 45%, #071017 100%)',
    boxShadow:
      'inset 0 1px rgba(255,255,255,.11), inset 0 -2px rgba(0,0,0,.7), ' +
      '0 3px 3px rgba(0,0,0,.45), 0 10px 24px rgba(0,0,0,.28)',
    rimLight: 'rgba(255,255,255,0.11)',
  },
  glow: {
    ambient: 'rgba(22, 141, 147, .20)',
    ambientOpacity: 0.55,
  },
  sizing: {
    width: 320,
    minHeight: 140,
    poiSize: 92,
  },
  poi: {
    fillDurationMs: 3000,
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
