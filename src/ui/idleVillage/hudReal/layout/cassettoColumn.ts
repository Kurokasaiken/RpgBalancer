/**
 * cassettoColumn — the pure width rule for the widened cassetto drawer
 * (PLAN-116 F3, ruling R-323 "Dentro la cornice", 2026-11-10):
 * column 420 px at 1440×900, 400 px at 1280×800.
 *
 * The column art is baked at fixed aspect (`artW × 1613` design px) so the
 * rendered width is always `aspect × viewportHeight` — the ruling lands
 * exactly at the two signed viewport sizes and interpolates sanely elsewhere.
 * Viewport ≥ CASSETTO_WIDE_BREAKPOINT picks the '1440' variant.
 */
import { CASSETTO_COLUMN_GEO, type CassettoColumnGeo } from '../cassettoColumnGeometry';

export const CASSETTO_WIDE_BREAKPOINT = 1360;

export interface CassettoColumnSpec {
  key: '1440' | '1280';
  src: string;
  geo: CassettoColumnGeo;
  /** Column width rendered at a given viewport height (`aspect × height`). */
  aspect: number;
}

const SPECS: Record<'1440' | '1280', CassettoColumnSpec> = {
  '1440': {
    key: '1440',
    src: '/assets/ui/hud-real/cassetto/column-1440.webp',
    geo: CASSETTO_COLUMN_GEO['1440'],
    aspect: CASSETTO_COLUMN_GEO['1440'].artW / CASSETTO_COLUMN_GEO['1440'].artH,
  },
  '1280': {
    key: '1280',
    src: '/assets/ui/hud-real/cassetto/column-1280.webp',
    geo: CASSETTO_COLUMN_GEO['1280'],
    aspect: CASSETTO_COLUMN_GEO['1280'].artW / CASSETTO_COLUMN_GEO['1280'].artH,
  },
};

export function cassettoColumnSpec(viewportWidth: number): CassettoColumnSpec {
  return SPECS[viewportWidth >= CASSETTO_WIDE_BREAKPOINT ? '1440' : '1280'];
}
