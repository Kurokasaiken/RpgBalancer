/**
 * cassettoLayoutConfig — R-339/PLAN-119 T1 tokens for the expedition surfaces.
 *
 * The signed column art (R-323 "Dentro la cornice") keeps its baked aspect and
 * renders `aspect × viewportHeight`; the plan's `clamp(360px, 23vw, 460px)`
 * contract applies as an UPPER bound on the occupied width — at viewports
 * taller than `widthMaxPx / aspect` the column caps at `widthMaxPx` and stops
 * short of full height (art stays undistorted). `widthMinPx` is a declared
 * target that cannot bind on the baked column without distortion — it governs
 * the future non-art drawer and the width the map ledger may reserve.
 * `chipWidthPx` (T2) is the collapsed edge-chip width — what the fold
 * publishes to `insets.right` while the drawer rests as a chip.
 *
 * `rail` and `bottomSheet` are the T5/T8 sizing contract (persistent left
 * Roster|Stash column; non-modal mobile sheet detents) declared here so the
 * surfaces read one source of truth. `topChrome` is the T6 contract (D3/D10):
 * the slim day banner + resource bar docked left/center, and the top-right
 * zone reserved for the future docked Chronicle surface. `cta` is the T1
 * enabled/muted contract: it declares the skin-token names the CONFIRM
 * plaque reads (values in `BASE_SKIN_CSS_VARS`) so every painted CTA color
 * traces config → registry, never a literal in the component.
 */
import { z } from 'zod';

export const cassettoLayoutSchema = z
  .object({
    drawer: z.object({
      /** Minimum docked width the expedition surface may occupy (px). */
      widthMinPx: z.number().positive(),
      /** Viewport-width share used by the free-map layout budget. */
      widthVwFraction: z.number().positive().max(1),
      /** Hard cap on the docked width (px) — binds above `widthMaxPx / aspect`. */
      widthMaxPx: z.number().positive(),
      /** T2: width of the collapsed edge chip (px) — the drawer's only folded
       *  form while a quest is selected (mirrors `rail.chipWidthPx`). */
      chipWidthPx: z.number().positive(),
    }),
    rail: z.object({
      /** Persistent left Roster|Stash column width (px). */
      widthPx: z.number().positive(),
      /** Width below which only one side surface may be open (mutual exclusion). */
      mutualExclusionBelowPx: z.number().positive(),
      /** Screen-edge margin above/beside the rail (px). */
      marginPx: z.number().nonnegative(),
      /** D8: the rail's max-height ends this far above the viewport bottom —
       *  the reserved zone of the bottom-left medallion/narrator (voce). */
      bottomInsetPx: z.number().nonnegative(),
      /** Width of the collapsed edge chip (px) — the rail's only folded form. */
      chipWidthPx: z.number().positive(),
      /** Bars each roster row shows, in order — config-driven (T5): which
       *  metric, its i18n label, and the skin-token pair the fill reads. */
      bars: z
        .array(
          z.object({
            id: z.string(),
            /** Resident metric the bar renders: `hp` = currentHp/maxHp,
             *  `stamina` = 1 − fatigue/100 (same derivation as the roster). */
            value: z.enum(['hp', 'stamina']),
            labelKey: z.string(),
            /** CSS variables (or values) the gradient fill reads, [start, end]. */
            fill: z.tuple([z.string(), z.string()]),
          }),
        )
        .min(1),
    }),
    bottomSheet: z.object({
      /** Non-modal sheet detents (T8): peek height, half/full viewport fractions. */
      peekPx: z.number().positive(),
      halfFraction: z.number().positive().max(1),
      fullFraction: z.number().positive().max(1),
    }),
    cta: z.object({
      /** T1 (AC8 traceability — grep check): the NAMES of the skin tokens the
       *  CONFIRM plaque's enabled/muted/hover/press/focus states read. Values
       *  live in `BASE_SKIN_CSS_VARS` (+ per-preset overrides); the component
       *  interpolates these var() strings and never writes a literal color. */
      vars: z.object({
        /** Enabled text tone of the CONFIRM label. */
        text: z.string(),
        /** Text shadow under the label (cut on the painted plaque). */
        textShadow: z.string(),
        /** Opacity of the muted (disabled) CONFIRM. */
        mutedOpacity: z.string(),
        /** Hover sheen painted inside the plaque + its ring/glow shadow. */
        sheen: z.string(),
        sheenRing: z.string(),
        /** Press face: sheen + ring + label transform. */
        pressSheen: z.string(),
        pressRing: z.string(),
        pressTransform: z.string(),
        /** Text glow on hover. */
        hoverTextGlow: z.string(),
        /** Focus-visible ring color. */
        focusRing: z.string(),
      }),
    }),
    topChrome: z.object({
      /** Design-px margin: distance from the top edge and from the boundary the
       *  left inset (`insets.left`) leaves — the cluster hugs the free-map band. */
      marginPx: z.number().nonnegative(),
      /** Design-px gap between the day banner and the resource bar. */
      gapPx: z.number().nonnegative(),
      /** D10 (Director ruling 2026-11-15): width in REAL px of the top-right zone
       *  reserved for the future docked Chronicle surface. The chrome cluster
       *  never enters it while it can stay at or above `minFitScale`. */
      chronicleReservePx: z.number().nonnegative(),
      /** Below this fit scale the Chronicle reserve yields to the screen edge —
       *  the cluster may shrink past the reserve but never leaves the window. */
      minFitScale: z.number().positive().max(1),
    }),
  })
  .strict();

export type CassettoLayoutConfig = z.infer<typeof cassettoLayoutSchema>;

const RAW_CASSETTO_LAYOUT_CONFIG: CassettoLayoutConfig = {
  drawer: { widthMinPx: 360, widthVwFraction: 0.23, widthMaxPx: 460, chipWidthPx: 40 },
  rail: {
    widthPx: 320,
    mutualExclusionBelowPx: 1100,
    marginPx: 24,
    bottomInsetPx: 240,
    chipWidthPx: 40,
    bars: [
      {
        id: 'hp',
        value: 'hp',
        labelKey: 'gameFrame.heroLevel.hp',
        fill: ['var(--skin-statbar-hp-start)', 'var(--skin-statbar-hp-end)'],
      },
      {
        id: 'stamina',
        value: 'stamina',
        labelKey: 'gameFrame.roster.zanara.stamina',
        fill: ['var(--skin-statbar-stamina-start)', 'var(--skin-statbar-stamina-end)'],
      },
    ],
  },
  bottomSheet: { peekPx: 56, halfFraction: 0.5, fullFraction: 0.92 },
  cta: {
    vars: {
      text: 'var(--skin-cassetto-cta-text)',
      textShadow: 'var(--skin-cassetto-cta-text-shadow)',
      mutedOpacity: 'var(--skin-cassetto-cta-muted-opacity)',
      sheen: 'var(--skin-cassetto-cta-sheen)',
      sheenRing: 'var(--skin-cassetto-cta-sheen-ring)',
      pressSheen: 'var(--skin-cassetto-cta-press-sheen)',
      pressRing: 'var(--skin-cassetto-cta-press-ring)',
      pressTransform: 'var(--skin-cassetto-cta-press-transform)',
      hoverTextGlow: 'var(--skin-cassetto-cta-hover-text-glow)',
      focusRing: 'var(--skin-cassetto-cta-focus-ring)',
    },
  },
  topChrome: { marginPx: 12, gapPx: 10, chronicleReservePx: 360, minFitScale: 0.55 },
};

export const CASSETTO_LAYOUT_CONFIG = cassettoLayoutSchema.parse(RAW_CASSETTO_LAYOUT_CONFIG);
