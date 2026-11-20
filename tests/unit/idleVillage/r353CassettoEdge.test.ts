/**
 * R-353 — cassetto "estratto": bordo destro a filo schermo (zero frame, zero
 * fessura di mappa), frame preservato su top/bottom/sinistra; variante che
 * coesiste con l'arte firmata R-323 (`drawer.edgeMode`).
 * Ruling Director 2026-11-16: la banda ornamentale sx (ciondoli + smeraldo
 * enorme) e' eliminata — resta solo il frame/bordo (`leftCutPx`) — e tutta
 * l'arte tenuta e' stirata orizzontalmente di `wideFactor` = 4/3 ("tutte le
 * aree anche all'interno ... piu' grande a sinistra"). Spec in
 * `cassettoExtractedEdge.json` — la stessa fonte del bake script.
 */
import { describe, expect, it } from 'vitest';
import { CASSETTO_LAYOUT_CONFIG } from '@/balancing/config/idleVillage/cassettoLayoutConfig';
import extractedEdgeSpec from '@/balancing/config/idleVillage/cassettoExtractedEdge.json';
import { CASSETTO_COLUMN_GEO } from '@/ui/idleVillage/hudReal/cassettoColumnGeometry';
import { CASSETTO_WIDE_BREAKPOINT, cassettoColumnSpec, cassettoColumnWidthFor } from '@/ui/idleVillage/hudReal/layout/cassettoColumn';

const CLIP = CASSETTO_LAYOUT_CONFIG.drawer.edgeClipPx;
const LEFT = CASSETTO_LAYOUT_CONFIG.drawer.leftCutPx;
const WIDE = CASSETTO_LAYOUT_CONFIG.drawer.wideFactor;

describe('R-353 cassetto estratto — edge contract', () => {
  it('edgeMode default is extracted and the clip spec is the frozen lab pick', () => {
    expect(CASSETTO_LAYOUT_CONFIG.drawer.edgeMode).toBe('extracted');
    expect(CLIP).toEqual(extractedEdgeSpec.edgeClipPx);
    expect(CLIP['1440']).toBe(72);
    expect(LEFT).toEqual(extractedEdgeSpec.leftCutPx);
    expect(LEFT['1440']).toBeGreaterThan(0);
    expect(WIDE).toBeCloseTo(4 / 3, 3);
  });

  /* R-357 / PLAN-125 (Mode B-amend, `redfirst:retire`; re-applied 2026-11-20): the baked extracted column art and its zone mapping
   * are retired — the drawer is rebuilt in DOM (cassettoColumn.ts is now `columnAspect × viewportH`). The edge spec stays only
   * as the legacy bake input. */
  it('the DOM drawer width is columnAspect × viewportH, flush right, capped (replaces the baked-art mapping)', () => {
    const spec = cassettoColumnSpec(CASSETTO_WIDE_BREAKPOINT + 40);
    expect(spec.aspect).toBeCloseTo(CASSETTO_LAYOUT_CONFIG.drawer.columnAspect, 6);
    expect(cassettoColumnWidthFor(spec, 900)).toBeCloseTo(512, 0);
    expect(cassettoColumnWidthFor(spec, 3000)).toBe(CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPxExtracted);
  });

  it('recomposited pieces survive the left cut and stay inside the visible art', () => {
    for (const key of ['1440', '1280'] as const) {
      const geo = CASSETTO_COLUMN_GEO[key];
      const visible = geo.artW - CLIP[key]; // pre-stretch design space
      for (const pc of extractedEdgeSpec.pieces[key]) {
        const pieceW = pc.src?.w ?? pc.destW;
        expect(pc.dest.x, `piece ${key}@${pc.dest.x} exits the left cut`).toBeGreaterThanOrEqual(LEFT[key]);
        expect(pc.dest.x + pieceW, `piece ${key}@${pc.dest.x} exits the right clip`).toBeLessThanOrEqual(visible);
      }
    }
  });
});
