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
 * `bottomSheet` is the T8 sizing contract (non-modal mobile sheet detents).
 * The T5 docked Roster|Stash column was reverted — Director ruling
 * 2026-11-15: roster e stash restano superfici sempre separate, nessuna
 * colonna/tab unificata. `topChrome` is the T6 contract (D3/D10):
 * the slim day banner + resource bar docked left/center, and the top-right
 * zone reserved for the future docked Chronicle surface. `cta` is the T1
 * enabled/muted contract: it declares the skin-token names the CONFIRM
 * plaque reads (values in `BASE_SKIN_CSS_VARS`) so every painted CTA color
 * traces config → registry, never a literal in the component.
 */
import { z } from 'zod';
import cassettoExtractedEdgeSpec from './cassettoExtractedEdge.json';

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
       *  form while a quest is selected. */
      chipWidthPx: z.number().positive(),
      /** R-353 (Director ruling): which right-edge treatment the column wears.
       *  'framed' = the signed R-323 art, frame on all four sides.
       *  'extracted' = the drawer pulled from off-screen — the right band
       *  clipped flush to the screen edge (no frame, no map sliver) with the
       *  rescued particulars re-composited into the baked `-extracted` assets
       *  (spec: cassettoExtractedEdge.json, build-cassetto-extracted.mjs). */
      edgeMode: z.enum(['framed', 'extracted']),
      /** R-353 (Director pick in cassetto-edge-lab, design px on the artW×artH
       *  grid): how much art exits the right screen edge per variant in
       *  'extracted' mode. Single source: cassettoExtractedEdge.json — the
       *  same file the bake script reads, so the rendered width and the asset
       *  crop can never drift apart. */
      edgeClipPx: z.object({
        '1440': z.number().nonnegative(),
        '1280': z.number().nonnegative(),
      }),
      /** R-353 (Director ruling "elimina il pezzo a sinistra … lascia sol il
       *  frame/bordo"): design px cut off the LEFT of the source art — the
       *  filigree/emerald/pendants band. Single source:
       *  cassettoExtractedEdge.json, same file the bake script reads. */
      leftCutPx: z.object({
        '1440': z.number().nonnegative(),
        '1280': z.number().nonnegative(),
      }),
      /** R-353 (Director ruling "stretchiamo a sinistra del 33%"): the
       *  extracted column's artW is `(artW - leftCut - clip) × wideFactor` —
       *  the whole surviving art (frame bar included) stretches horizontally
       *  so every inner area gains real writing space. */
      wideFactor: z.number().positive(),
      /** R-353 (Director 2026-11-16): zones that stay 1:1 — "il componente
       *  delle risorse deve essere proporzionato", "hai strettchato davvero
       *  il teschio e il reward, ripristinalo", "il pulsante in basso che
       *  tocca il frame". These zones keep their original w, re-centered on
       *  the stretched position of their original center — matching the
       *  pictorial elements the bake restores unstretched. */
      unstretchedZones: z.array(z.string()),
      /** Hard cap for the extracted (widened) column — the framed R-323 cap
       *  `widthMaxPx` stays untouched; this is `widthMaxPx × wideFactor`. */
      widthMaxPxExtracted: z.number().positive(),
      /** R-357: lateral slide duration (ms) — the drawer enters with
       *  `cassettoSlideIn` and folds only after `cassettoSlideOut` finishes.
       *  Skipped entirely under `prefers-reduced-motion`. */
      slideMs: z.number().positive(),
      /** R-357 / PLAN-125: the DOM drawer (golden `mockup-r357-cassetto-largo.png`) is `columnAspect × viewportHeight` wide,
       *  capped by `widthMaxPxExtracted`: 0.5689 → 512 px at 1440×900. */
      columnAspect: z.number().positive(),
    }),
    bottomSheet: z.object({
      /** Non-modal sheet detents (T8): peek height, half/full viewport fractions. */
      peekPx: z.number().positive(),
      halfFraction: z.number().positive().max(1),
      fullFraction: z.number().positive().max(1),
      /** T8/D5: at or below this viewport width the expedition surface exists
       *  ONLY as the bottom sheet — the docked column and its chips never
       *  mount (mutual exclusion of the lateral surface, AC10: tested at
       *  1024 and 1100, boundary inclusive). */
      maxWidthPx: z.number().positive(),
      /** T8/D5: the drag affordance — the sheet's handle+header strip height
       *  (px) and its minimum interactive target (AC10 ≥44px). */
      handlePx: z.number().positive(),
      /** AC10: body text floor (px) inside the sheet. */
      minTextPx: z.number().positive(),
      /** Touch-target size (px) for party/bag slots inside the sheet. */
      slotPx: z.number().positive(),
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
        /** R-357: the CTA is the painted plaque; its states are FILTERS on the picture (+ label opacity). */
        enamelHoverFilter: z.string(),
        enamelPressFilter: z.string(),
        enamelDisabled: z.string(),
      }),
    }),
    topChrome: z.object({
      /** Design-px margin: distance from the top edge and from the boundary the
       *  left inset (`insets.left`) leaves — the cluster hugs the free-map band. */
      marginPx: z.number().nonnegative(),
      /** Design-px gap between the day banner and the resource bar when the
       *  pair can't breathe (fit-clamped); below this they may overlap-bound. */
      gapPx: z.number().nonnegative(),
      /** R-352 (Director ruling): the day banner docks at this design-px left
       *  margin, decoupled from the centred resource bar — the bar's absolute
       *  centre rules, the banner breathes at the left edge (picked live: 40). */
      bannerMarginPx: z.number().nonnegative(),
      /** D10 (Director ruling 2026-11-15): width in REAL px of the top-right zone
       *  reserved for the future docked Chronicle surface. The chrome cluster
       *  never enters it while it can stay at or above `minFitScale`. */
      chronicleReservePx: z.number().nonnegative(),
      /** Below this fit scale the Chronicle reserve yields to the screen edge —
       *  the cluster may shrink past the reserve but never leaves the window. */
      minFitScale: z.number().positive().max(1),
      /** R-352: capsule heights measured on the signed slim art (design px —
       *  the plain parallel band only, medallions/filigree/pendant ignored).
       *  The resource bar renders scaled by `capsulePx.time /
       *  capsulePx.resources` so the pair's bands read as one height. */
      capsulePx: z.object({
        time: z.number().positive(),
        resources: z.number().positive(),
      }),
      /** R-376-bis (Director ruling 2026-11-21 sera — «sembra troppo piccolo
       *  in proporzione al componente tempo… ingradiscilo in proporzione»):
       *  multiplier on the capsule-pair ratio; at 1.2 the bar lands ~420×68.6,
       *  width ≈ the banner's. */
      resourcesBoost: z.number().positive().max(2),

    }),
  })
  .strict();

export type CassettoLayoutConfig = z.infer<typeof cassettoLayoutSchema>;

const RAW_CASSETTO_LAYOUT_CONFIG: CassettoLayoutConfig = {
  drawer: { widthMinPx: 360, widthVwFraction: 0.23, widthMaxPx: 460, chipWidthPx: 40, edgeMode: 'extracted', edgeClipPx: cassettoExtractedEdgeSpec.edgeClipPx, leftCutPx: cassettoExtractedEdgeSpec.leftCutPx, wideFactor: cassettoExtractedEdgeSpec.wideFactor, unstretchedZones: cassettoExtractedEdgeSpec.unstretchedZones, widthMaxPxExtracted: 613, slideMs: 260, columnAspect: 0.5689 },
  bottomSheet: { peekPx: 56, halfFraction: 0.5, fullFraction: 0.92, maxWidthPx: 1100, handlePx: 44, minTextPx: 16, slotPx: 48 },
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
      enamelHoverFilter: 'var(--skin-cassetto-cta-enamel-hover-filter)',
      enamelPressFilter: 'var(--skin-cassetto-cta-enamel-press-filter)',
      enamelDisabled: 'var(--skin-cassetto-cta-enamel-disabled)',
    },
  },
  topChrome: {
    marginPx: 12,
    gapPx: 10,
    bannerMarginPx: 40,
    chronicleReservePx: 360,
    minFitScale: 0.55,
    /* Measured on the signed `bar-slim.webp` art (opaque band height at
     *  interior columns): time 105/2 = 52.5, resources 114/2 = 57.0 (R-376
     *  pointed-cap bar) — resources scales by ~0.921. */
    capsulePx: { time: 52.5, resources: 57.0 },
    /* R-376-bis: 1.2 × (52.5/57) ≈ 1.105 → barra ~419×68.5 a fit 1. */
    resourcesBoost: 1.2,
  },
};

export const CASSETTO_LAYOUT_CONFIG = cassettoLayoutSchema.parse(RAW_CASSETTO_LAYOUT_CONFIG);
