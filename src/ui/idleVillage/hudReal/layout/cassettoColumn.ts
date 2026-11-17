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
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
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

/**
 * R-353 "estratta": the baked `-extracted` assets are the signed art cropped
 * by `drawer.edgeClipPx` on the right (rescued corner clusters composited in)
 * AND by `drawer.leftCutPx` on the left — the ornament band (pendants + big
 * emerald) is removed, only the frame/bordo survives — then the surviving
 * art is stretched horizontally by `drawer.wideFactor` (build script:
 * build-cassetto-extracted.mjs, Director 2026-11-16). Zones shift left by
 * the cut and scale by the stretch to stay on their wells; `insets.right`
 * stays honest.
 */
const EXTRACTED_SPECS: Record<'1440' | '1280', CassettoColumnSpec> = (
  ['1440', '1280'] as const
).reduce((acc, key) => {
  const geo = CASSETTO_COLUMN_GEO[key];
  const clip = CASSETTO_LAYOUT_CONFIG.drawer.edgeClipPx[key];
  const leftCut = CASSETTO_LAYOUT_CONFIG.drawer.leftCutPx[key];
  const wide = CASSETTO_LAYOUT_CONFIG.drawer.wideFactor;
  const artW = (geo.artW - leftCut - clip) * wide;
  /* The baked art drops `leftCut` design px on the left (ornament band —
   * Director: "lascia sol il frame/bordo") and is then horizontally
   * STRETCHED by `wide` ("stretchare — tutte le aree anche all'interno si
   * fanno piu' grandi"), so zone rects shift left by the cut and scale by
   * the same factor to stay on their painted wells — EXCEPT zones in
   * `unstretchedZones`, which keep their original size re-centered on the
   * stretched position of their center: the bake restores the matching
   * pictorial elements (skull, chest, CONFIRM plaque, resource wells) at
   * 1:1, and their DOM overlays must not distort or drift ("il componente
   * delle risorse deve essere proporzionato"). Zones are clamped to the
   * visible art so no content is ever amputated. */
  const unstretched = new Set(CASSETTO_LAYOUT_CONFIG.drawer.unstretchedZones);
  const zones = Object.fromEntries(
    Object.entries(geo.zones).map(([name, z]) => {
      if (unstretched.has(name)) {
        const x = (z.x + z.w / 2 - leftCut) * wide - z.w / 2;
        return [name, { ...z, x: Math.max(0, Math.min(x, artW - z.w)) }];
      }
      const x = Math.max(0, (z.x - leftCut) * wide);
      const w = Math.min((z.x + z.w - leftCut) * wide, artW) - x;
      return [name, { ...z, x, w: Math.max(0, w) }];
    }),
  );
  acc[key] = {
    key,
    src: `/assets/ui/hud-real/cassetto/column-${key}-extracted.webp`,
    geo: { artW, artH: geo.artH, zones },
    aspect: artW / geo.artH,
  };
  return acc;
}, {} as Record<'1440' | '1280', CassettoColumnSpec>);

export function cassettoColumnSpec(viewportWidth: number): CassettoColumnSpec {
  const key = viewportWidth >= CASSETTO_WIDE_BREAKPOINT ? '1440' : '1280';
  return CASSETTO_LAYOUT_CONFIG.drawer.edgeMode === 'extracted' ? EXTRACTED_SPECS[key] : SPECS[key];
}

/**
 * R-339/PLAN-119 T1: rendered column width = `aspect × viewportHeight`, capped
 * at `drawer.widthMaxPx` (the plan's clamp upper bound). Above
 * `widthMaxPx / aspect` viewport height the column renders shorter than the
 * viewport so the baked art never distorts (T1 ruling: clamp = height cap,
 * not width stretch).
 */
export function cassettoColumnWidthFor(spec: CassettoColumnSpec, viewportHeight: number): number {
  const cap = CASSETTO_LAYOUT_CONFIG.drawer.edgeMode === 'extracted'
    ? CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPxExtracted
    : CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPx;
  return Math.min(spec.aspect * viewportHeight, cap);
}

/** The height the column may occupy (≤ viewport) once the width cap binds. */
export function cassettoColumnHeightFor(spec: CassettoColumnSpec, viewportHeight: number): number {
  return Math.min(viewportHeight, CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPx / spec.aspect);
}
