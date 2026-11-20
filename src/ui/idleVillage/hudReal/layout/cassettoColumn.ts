/**
 * cassettoColumn — the pure width rule for the expedition drawer.
 *
 * R-357 / PLAN-125 (2026-11-17, restored 2026-11-20): the drawer is rebuilt in DOM from the approved golden
 * (`mockup-r357-cassetto-largo.png`); the baked column art and its absolute zones are gone.
 * The rendered width is `columnAspect × viewportHeight`, capped at `widthMaxPxExtracted`.
 * Kept for compatibility: the 1440/1280 key (viewport ≥ CASSETTO_WIDE_BREAKPOINT).
 */
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';

export const CASSETTO_WIDE_BREAKPOINT = 1360;

export interface CassettoColumnSpec {
  key: '1440' | '1280';
  /** Column width ÷ viewport height. */
  aspect: number;
}

export function cassettoColumnSpec(viewportWidth: number): CassettoColumnSpec {
  const key = viewportWidth >= CASSETTO_WIDE_BREAKPOINT ? '1440' : '1280';
  return { key, aspect: CASSETTO_LAYOUT_CONFIG.drawer.columnAspect };
}

/** Rendered column width = `aspect × viewportHeight`, capped at `drawer.widthMaxPxExtracted`. */
export function cassettoColumnWidthFor(spec: CassettoColumnSpec, viewportHeight: number): number {
  return Math.min(spec.aspect * viewportHeight, CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPxExtracted);
}

/** The height the column may occupy: the full viewport (the DOM column flexes its content). */
export function cassettoColumnHeightFor(_spec: CassettoColumnSpec, viewportHeight: number): number {
  return viewportHeight;
}
