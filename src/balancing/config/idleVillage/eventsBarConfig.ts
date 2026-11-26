/**
 * Events collapsed-bar content contract.
 *
 * Director ruling 2026-11-26: the shell is NOT Events-owned art. It is the
 * same reusable Time shell (`HudRealTimeShellLayers` + `TIME_SLIM_BAR`),
 * consumed mirrored. This config therefore carries only the Events-specific
 * live content: typography, colours, spacing inside the shared content well,
 * and the semantic gem treatment. Shell dimensions/geometry are deliberately
 * absent so they cannot fork from Time.
 */
import { z } from 'zod';

const eventsBarConfigSchema = z
  .object({
    assets: z.object({ neutralGem: z.string().min(1), medallionFrame: z.string().min(1) }).strict(),
    /** Live-reading spacing inside the shared Time-shell content well. */
    content: z
      .object({
        horizontalGapPx: z.number().positive(),
        countdownGapPx: z.number().positive(),
        wellPaddingXPx: z.number().positive(),
        wellPaddingYPx: z.number().positive(),
        medallionClearancePx: z.number().positive(),
        medallionIconSizePx: z.number().positive(),
        titleWeight: z.number().int().positive(),
        titleTrackingPx: z.number().positive(),
        countdownMinWidthPx: z.number().positive(),
        countdownWeight: z.number().int().positive(),
      })
      .strict(),
    fonts: z
      .object({
        title: z.string().min(1),
        body: z.string().min(1),
      })
      .strict(),
    colors: z
      .object({
        text: z.string().min(1),
        dim: z.string().min(1),
        gold: z.string().min(1),
        shadow: z.string().min(1),
        focus: z.string().min(1),
        glow: z.string().min(1),
      })
      .strict(),
    /** Filters applied to the neutral green Time-gem content, clipped inside
     *  the medallion seat. Neutral/good stay in the green family; warning and
     *  danger move the same content toward amber/red without forking the shell. */
    gemFilters: z
      .object({
        danger: z.string(),
        warning: z.string(),
        neutral: z.string(),
        good: z.string(),
      })
      .strict(),
  })
  .strict();

export type EventsBarConfig = z.infer<typeof eventsBarConfigSchema>;

const RAW_EVENTS_BAR_CONFIG: EventsBarConfig = {
  assets: { neutralGem: '/assets/ui/hud-real/events/gem-neutral.webp', medallionFrame: '/assets/ui/hud-real/events/dial-frame.webp' },
  content: {
    horizontalGapPx: 7,
    countdownGapPx: 10,
    wellPaddingXPx: 13,
    wellPaddingYPx: 3,
    medallionClearancePx: 8,
    medallionIconSizePx: 20,
    titleWeight: 700,
    titleTrackingPx: 0.4,
    countdownMinWidthPx: 34,
    countdownWeight: 700,
  },
  fonts: {
    title: 'Marcellus, "Cardo", serif',
    body: '"Cardo", serif',
  },
  colors: {
    text: 'var(--skin-text-strong, #f3ead0)',
    dim: 'var(--skin-body-color, #cdbf8e)',
    gold: 'var(--skin-icon-color, #f1d88a)',
    shadow: '0 1px 2px rgba(3, 26, 30, 0.9)',
    focus: 'var(--skin-focus-ring, #e8c766)',
    glow: 'rgba(240, 201, 135, 0.55)',
  },
  gemFilters: {
    danger: 'hue-rotate(220deg) saturate(1.6) brightness(0.88)',
    warning: 'hue-rotate(250deg) saturate(1.28) brightness(1.03)',
    neutral: '',
    good: 'saturate(1.12) brightness(1.04)',
  },
};

export const EVENTS_BAR_CONFIG: EventsBarConfig = eventsBarConfigSchema.parse(RAW_EVENTS_BAR_CONFIG);
