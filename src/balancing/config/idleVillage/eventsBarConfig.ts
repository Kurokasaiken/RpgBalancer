/**
 * eventsBarConfig — visual/geometry contract of the docked Events bar
 * (Director reference 2026-11-25, `.mw/specs/hud-eventi/refs/ref-eventi-bar-specular-time-2026-11-25.png`).
 *
 * The source art is the Director-registered bar keyed from magenta by
 * `scripts/hud-real/build-events-bar.py` (976×186). Geometry is authored in
 * design px at 2× resolution — the same model as the signed Time/Resources
 * bars — so the component's intrinsic box is 488×93.
 */
import { z } from 'zod';

const rectSchema = z
  .object({
    x: z.number(),
    y: z.number(),
    w: z.number().positive(),
    h: z.number().positive(),
  })
  .strict();

const circleSchema = z
  .object({
    cx: z.number(),
    cy: z.number(),
    r: z.number().positive(),
  })
  .strict();

export const eventsBarConfigSchema = z
  .object({
    asset: z.string().min(1),
    art: z
      .object({
        w: z.number().positive(),
        h: z.number().positive(),
        sourceW: z.number().positive(),
        sourceH: z.number().positive(),
      })
      .strict(),
    field: rectSchema,
    medallion: circleSchema,
    gem: circleSchema,
    /** Green neutral gem swapped wholesale from the signed Time component
     *  (Director 2026-11-25: use the Time one, do not recolor/overpaint it). */
    timeGem: z
      .object({
        url: z.string().min(1),
        size: z.number().positive(),
        offset: z.object({ x: z.number(), y: z.number() }).strict(),
      })
      .strict(),
    content: z
      .object({
        iconSizePx: z.number().positive(),
        horizontalGapPx: z.number().positive(),
        countdownGapPx: z.number().positive(),
        titleWeight: z.number().positive(),
        titleTrackingPx: z.number(),
        countdownMinWidthPx: z.number().positive(),
        countdownWeight: z.number().positive(),
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
    /** CSS filter recipes applied to a circular copy of the red gem. Red is
     *  the danger state itself; the other tones recolour that painted gem
     *  without replacing the art. */
    gemFilters: z
      .object({
        danger: z.string(),
        warning: z.string().min(1),
        neutral: z.string().min(1),
        good: z.string().min(1),
      })
      .strict(),
  })
  .strict();

export type EventsBarConfig = z.infer<typeof eventsBarConfigSchema>;

const RAW_EVENTS_BAR_CONFIG: EventsBarConfig = {
  asset: '/assets/ui/hud-real/events/bar.webp',
  art: { w: 488, h: 93, sourceW: 976, sourceH: 186 },
  /* Measured on the keyed production art, halved to design px. The safe
   *  writing field extends under the subtle right-hand filigree; the countdown
   *  stays clear of the gem bezel. */
  field: { x: 90, y: 22, w: 303, h: 49 },
  medallion: { cx: 67.5, cy: 46, r: 23 },
  gem: { cx: 442.5, cy: 46, r: 27 },
  timeGem: { url: '/assets/ui/hud-real/time/dial-frame.webp', size: 85, offset: { x: 0, y: 0 } },
  content: {
    iconSizePx: 25,
    horizontalGapPx: 7,
    countdownGapPx: 10,
    titleWeight: 700,
    titleTrackingPx: 0.4,
    countdownMinWidthPx: 38,
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
    danger: '',
    warning: 'hue-rotate(28deg) saturate(1.08)',
    neutral: 'hue-rotate(168deg) saturate(0.78) brightness(0.96)',
    good: 'hue-rotate(105deg) saturate(0.95)',
  },
};

export const EVENTS_BAR_CONFIG: EventsBarConfig = eventsBarConfigSchema.parse(RAW_EVENTS_BAR_CONFIG);
