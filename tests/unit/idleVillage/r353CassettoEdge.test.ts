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

  it.each(['1440', '1280'] as const)('extracted spec %s uses the baked wide -extracted asset and widened art', (key) => {
    const spec = cassettoColumnSpec(key === '1440' ? CASSETTO_WIDE_BREAKPOINT + 40 : CASSETTO_WIDE_BREAKPOINT - 40);
    const geo = CASSETTO_COLUMN_GEO[key];
    const expectedArtW = (geo.artW - LEFT[key] - CLIP[key]) * WIDE;
    expect(spec.src).toBe(`/assets/ui/hud-real/cassetto/column-${key}-extracted.webp`);
    expect(spec.geo.artW).toBeCloseTo(expectedArtW, 4);
    expect(spec.geo.artH).toBe(geo.artH);
    expect(spec.aspect).toBeCloseTo(expectedArtW / geo.artH, 6);
  });

  it.each(['1440', '1280'] as const)('zones %s shift left by leftCut then scale with the stretch; unstretched zones stay 1:1 re-centered', (key) => {
    const geo = CASSETTO_COLUMN_GEO[key];
    const spec = cassettoColumnSpec(key === '1440' ? CASSETTO_WIDE_BREAKPOINT + 40 : CASSETTO_WIDE_BREAKPOINT - 40);
    const unstretched = new Set(CASSETTO_LAYOUT_CONFIG.drawer.unstretchedZones);
    for (const [name, z] of Object.entries(spec.geo.zones)) {
      const src = geo.zones[name as keyof typeof geo.zones];
      if (unstretched.has(name)) {
        // zona proporzionata (Director: risorse/teschio/reward/confirm 1:1)
        expect(z.w, `zone ${name} must keep original width`).toBeCloseTo(src.w, 4);
        const cx = (src.x + src.w / 2 - LEFT[key]) * WIDE;
        expect(z.x + z.w / 2, `zone ${name} center not on stretched center`).toBeCloseTo(cx, 1);
      } else {
        expect(z.x, `zone ${name} x not shifted+stretched`).toBeCloseTo(Math.max(0, (src.x - LEFT[key]) * WIDE), 2);
      }
      expect(z.y, `zone ${name} y must not change (horizontal stretch only)`).toBe(src.y);
      expect(z.h, `zone ${name} h must not change (horizontal stretch only)`).toBe(src.h);
      expect(z.x + z.w, `zone ${name} exits the visible art`).toBeLessThanOrEqual(spec.geo.artW + 0.5);
    }
  });

  it('extracted column renders the surviving art stretched by wideFactor (honest insets)', () => {
    const h = 900;
    const extracted = cassettoColumnWidthFor(cassettoColumnSpec(1440), h);
    const narrow = (CASSETTO_COLUMN_GEO['1440'].artW - LEFT['1440'] - CLIP['1440']) / CASSETTO_COLUMN_GEO['1440'].artH * h;
    expect(extracted).toBeCloseTo(narrow * WIDE, 1);
    expect(extracted).toBeGreaterThan(narrow);
    expect(extracted).toBeLessThanOrEqual(CASSETTO_LAYOUT_CONFIG.drawer.widthMaxPxExtracted);
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
