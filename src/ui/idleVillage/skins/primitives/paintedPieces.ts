/**
 * Painted pieces — the reusable, Gemini-generated parts of the cassetto restyle (Director 2026-11-21: «i componenti interni + curati»,
 * «aggiungili correttamente a hud-lab, utilizzabili anche da altri componenti futuri»).
 *
 * Each piece was generated ALONE on a flat magenta ground, keyed to a real alpha, and graded to the nav palette. They are plain
 * assets plus CSS recipes: no production component is needed to use them, any panel can wear them.
 *
 *  - ground     deep-emerald marble with veining + soft vignette (the panel ground; colour matches the mockup's measured median)
 *  - boxFrame   fine brass double border with four corner flourishes — a `border-image` for any section box
 *  - niche      chamfered inventory niche with a bold brass frame and a recessed interior — `border-image` with `fill`
 *  - plaque     the CONFIRM plaque (lacquer body, crest, two emerald diamonds) — an <img> behind a live label, + `plaqueEnamel` for state filters
 *  - rimBottom  the golden mockup's real bottom rim (12 px strip) — a straight brass line to close a panel
 *  - seatRing   an empty party-seat ring (brass rim, four emeralds). NOT mounted on /game: the approved dragon ghiera stays there.
 *
 * Sizing rule learned the hard way: a hairline in a 1000 px source disappears when the piece is shown ~12× smaller. Anything that is
 * displayed small needs a BOLD source (niche was regenerated for that). `boxFrame` works because it is shown at ~0.4×.
 */
import type { CSSProperties } from 'react';

export const PAINTED_BASE = '/assets/ui/hud-real/slicekit/cassetto';

export const PAINTED_PIECES = {
  ground: { src: `${PAINTED_BASE}/ground.webp`, size: [1374, 2048] as const, fallback: '#04281a' },
  boxFrame: { src: `${PAINTED_BASE}/box-frame.webp`, size: [1024, 254] as const, slice: '105 130 105 130' },
  niche: { src: `${PAINTED_BASE}/niche.webp`, size: [1024, 637] as const, slice: 90 },
  plaque: { src: `${PAINTED_BASE}/cta-plaque.webp`, size: [1500, 381] as const },
  /** Enamel-only layer of the plaque: put it over `plaque` and apply state filters to IT, so the brass keeps its gold when disabled. */
  plaqueEnamel: { src: `${PAINTED_BASE}/cta-plaque-enamel.webp`, size: [1500, 381] as const },
  rimBottom: { src: `${PAINTED_BASE}/frame-bottom.webp`, size: [932, 12] as const },
  seatRing: { src: `${PAINTED_BASE}/seat-ring.webp`, size: [512, 510] as const },
} as const;

/** Panel ground: marble texture over a dark emerald fallback. Spread into `style` of the element that is the ground. */
export const paintedGround = (): CSSProperties => ({
  /* darkened toward the new mockup's ground (3,28,23): marble kept, a teal-black veil on top lowers it ~25% so the wells can sit darker still */
  background: `linear-gradient(rgba(10,60,40,.10), rgba(10,60,40,.10)), url(${PAINTED_PIECES.ground.src}) center / cover no-repeat, ${PAINTED_PIECES.ground.fallback}`,
});

/**
 * Section box frame. `edge` is the drawn corner size (y = top/bottom, x = left/right): the source corners are 130×105, so keep x/y ≈ 1.24
 * to avoid squashing the flourishes. `border` is the layout border (keep it thin: the art paints over the padding box on purpose).
 */
export const paintedBoxFrame = (edge: { y: string; x: string }, border = '2px'): CSSProperties => ({
  border: `${border} solid transparent`,
  borderImageSource: `url(${PAINTED_PIECES.boxFrame.src})`,
  borderImageSlice: PAINTED_PIECES.boxFrame.slice,
  borderImageWidth: `${edge.y} ${edge.x} ${edge.y} ${edge.x}`,
  borderImageRepeat: 'stretch',
  borderRadius: 0,
});

/** Niche: frame + recessed interior in one `border-image` (`fill`). `edge` is the drawn corner size, ~15u at 85 px wide. */
export const paintedNiche = (edge: string, border = '2px'): CSSProperties => ({
  border: `${border} solid transparent`,
  borderImage: `url(${PAINTED_PIECES.niche.src}) ${PAINTED_PIECES.niche.slice} fill / ${edge} stretch`,
});

/** Aspect (w/h) of the CONFIRM plaque, for sizing its box. */
export const PLAQUE_ASPECT = PAINTED_PIECES.plaque.size[0] / PAINTED_PIECES.plaque.size[1];
