/**
 * amanuenseSkinConfig — "Folio dell'Amanuense" (PLAN-085, artifact-r003,
 * baseline VF-AMAN-001 opzione A folio sospeso).
 *
 * Config-first tokens for the transient scribal page: floating vellum folio,
 * humanist typographic register, composed ornament frame, density governed by
 * the reading-rect invariant (never a global % cap).
 * Consumed as `--skin-amanuense-*` custom properties / inline styles —
 * no standalone .css.
 */

export interface AmanuenseSkinConfig {
  widths: { minPx: number; preferredSlackPx: number; maxPx: number; gutterPx: number; sheetMaxPx: number };
  coexistenceMinViewportPx: number;
  palette: {
    parchment: string; parchmentEdge: string; ink: string; rubric: string;
    ultramarine: string; gold: string; goldHi: string; goldLo: string;
    vine: string; marginalia: string; loreParchment: string;
  };
  fonts: { body: string; incipit: string; lombardic: string; lore: string };
  type: { bodyPx: number; glossPx: number; incipitPx: number; colophonPx: number; lineHeight: number };
  readingRect: { measureCh1920: number; measureCh1480: number; textureDeltaL: number };
  motion: { ceremonyMsMax: number; repeatMs: number; reducedMs: number; crossfadeMs: number; foldMs: number };
  budget: { maxOrnamentNodes: number; frameMaxKb: number; totalMaxKb: number };
}

const AMANUENSE_SKIN: AmanuenseSkinConfig = {
  widths: { minPx: 320, preferredSlackPx: 0, maxPx: 460, gutterPx: 34, sheetMaxPx: 480 },
  coexistenceMinViewportPx: 1480,
  palette: {
    parchment: '#f1e3c0', parchmentEdge: '#e8d5ae', ink: '#2a1d12',
    rubric: '#9e1b14', ultramarine: '#1f3a7a',
    gold: '#b8943e', goldHi: '#e8c76a', goldLo: '#7a5a1e',
    vine: '#4a5a2a', marginalia: '#7a5a3a', loreParchment: '#efe6d0',
  },
  fonts: {
    body: "'EB Garamond', serif",
    incipit: "'Almendra SC', 'Cormorant SC', serif",
    lombardic: "'Almendra SC', serif",
    lore: "'IM Fell English', 'EB Garamond', serif",
  },
  type: { bodyPx: 17, glossPx: 14, incipitPx: 24, colophonPx: 13, lineHeight: 1.55 },
  readingRect: { measureCh1920: 48, measureCh1480: 40, textureDeltaL: 0.03 },
  motion: { ceremonyMsMax: 1800, repeatMs: 200, reducedMs: 150, crossfadeMs: 240, foldMs: 200 },
  budget: { maxOrnamentNodes: 24, frameMaxKb: 350, totalMaxKb: 700 },
};

/** The single skin config instance — components never hardcode these values. */
export function getAmanuenseSkinConfig(): AmanuenseSkinConfig {
  return AMANUENSE_SKIN;
}
