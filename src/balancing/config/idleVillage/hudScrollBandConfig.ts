/**
 * HUD scroll band — shared engraved scroll indicator (PLAN-125 Fase 7a,
 * PLAN-127 N=3 #1 «scroll band → Roster → Stash»).
 *
 * One treatment mounted on every list surface (`data-hud-scroll-band`):
 * Roster, Stash, later the events ledger. The visual grammar comes from the
 * scroll-band fork (`.mw/runs/20261120-scroll-band/`): variants A «smalto»,
 * B «oro inciso», C «filare» — the Director picks on the live component via
 * `?band=a|b|c` (dev only), then the winner is frozen here as `variant`.
 */

import { z } from 'zod';

const hudScrollBandSchema = z.object({
  /**
   * Fork variant — `a` = teal enamel thumb in brass-rimmed well (Director's
   *   final ruling on the live component, 2026-11-20 «A — smalto»),
   * `b` = engraved champagne-brass thumb + end studs,
   * `c` = hairline channel + sliding emerald lozenge.
   */
  variant: z.enum(['a', 'b', 'c']),
  /** Band width inside the list's right gutter (px). */
  widthPx: z.number().positive(),
  /** Inset from the scroll container's top/bottom/inner-right edge (px). */
  insetPx: z.number().nonnegative(),
  /** Thumb never shrinks below this — it must stay grabbable (T-21). */
  minThumbPx: z.number().positive(),
  /** Fraction of the viewport scrolled by a well click (page up/down). */
  wellClickPageRatio: z.number().min(0.1).max(1),
});

export const HUD_SCROLL_BAND = hudScrollBandSchema.parse({
  variant: 'a',
  widthPx: 14,
  insetPx: 2,
  minThumbPx: 28,
  wellClickPageRatio: 0.9,
});

export type HudScrollBandVariant = z.infer<typeof hudScrollBandSchema>['variant'];
