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
    frameOuter: z.string(),
    ornamentStroke: z.string(),
    ornamentFill: z.string(),
    gemFill: z.string(),
    gemStroke: z.string(),
    gemGlow: z.string(),
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
  /** Medallion colours. */
  medallion: z.object({
    ring: z.string(),
    ringHighlight: z.string(),
    inner: z.string(),
    cross: z.string(),
    gem: z.string(),
  }),
  /** Canonical dimensions (design px). */
  sizing: z.object({
    width: z.number(),
    minHeight: z.number(),
    medallionSize: z.number(),
  }),
  /** POI medallion animation. */
  poi: z.object({
    fillDurationMs: z.number(),
  }),
  /** Typography / content colours. */
  content: z.object({
    title: z.string(),
    titleShadow: z.string(),
    label: z.string(),
    number: z.string(),
    numberGlow: z.string(),
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
    frameOuter: '#5a3f18',
    ornamentStroke: '#e4bd62',
    ornamentFill: 'rgba(61, 37, 19, 0.55)',
    gemFill: '#48b5a8',
    gemStroke: '#a8e8e0',
    gemGlow: 'rgba(72, 181, 168, 0.55)',
  },
  surface: {
    background:
      'radial-gradient(ellipse at 30% 0%, rgba(255,255,255,.08), transparent 45%), ' +
      'radial-gradient(ellipse at 85% 100%, rgba(0,118,130,.15), transparent 50%), ' +
      'linear-gradient(135deg, #07131b 0%, #0c1921 45%, #061016 100%)',
    boxShadow:
      'inset 0 1px rgba(255,255,255,.12), inset 0 -2px rgba(0,0,0,.75), ' +
      '0 4px 4px rgba(0,0,0,.5), 0 14px 30px rgba(0,0,0,.35)',
    rimLight: 'rgba(255,255,255,0.10)',
  },
  glow: {
    ambient: 'rgba(22, 141, 147, .22)',
    ambientOpacity: 0.55,
  },
  medallion: {
    ring: 'linear-gradient(135deg, #5d4a30 0%, #9e7b4a 40%, #5d4a30 100%)',
    ringHighlight: '#d4aa50',
    inner: '#111d24',
    cross: '#e4c45c',
    gem: '#2e8b7a',
  },
  sizing: {
    width: 420,
    minHeight: 142,
    medallionSize: 92,
  },
  poi: {
    fillDurationMs: 3000,
  },
  content: {
    title: '#e4bd62',
    titleShadow: '0 1px 0 rgba(0,0,0,.9), 0 2px 4px rgba(0,0,0,.6)',
    label: '#4dc0bd',
    number: '#e7c96e',
    numberGlow: '0 0 8px rgba(57, 179, 177, .25)',
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
