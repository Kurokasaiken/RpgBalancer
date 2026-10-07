/**
 * Pure SVG path geometry for HUD plaques. No imports from feature layers: the
 * silhouette is data in, path string out, so it is trivially unit-testable.
 */
export type PlaqueShape = 'hang' | 'plinth' | 'panel';

export interface PlaqueGeometry {
  /**
   * `hang`: flat top edge (anchored to the top of the screen), curved shoulders below.
   * `plinth`: the same silhouette standing on the bottom edge. `panel`: rounded rectangle.
   */
  shape: PlaqueShape;
  /** `hang`/`plinth`: how far the shoulders curve in (px). `panel`: corner radius (px). */
  size: number;
  /** `hang`/`plinth`: how much the free edge bulges away from the anchor (px). */
  sag?: number;
}

const f = (n: number) => +n.toFixed(2);

/**
 * Closed path for a plaque of `w`×`h`, drawn inside `0..w`, `0..h` so strokes centred
 * on the path can be clipped to the interior by the caller.
 */
export function cartouchePath({ shape, size, sag = 0 }: PlaqueGeometry, w: number, h: number): string {
  if (shape === 'panel') {
    const r = Math.max(0, Math.min(size, h / 2, w / 2));
    return `M${r},0H${w - r}A${r},${r} 0 0 1 ${w},${r}V${h - r}A${r},${r} 0 0 1 ${w - r},${h}H${r}A${r},${r} 0 0 1 0,${h - r}V${r}A${r},${r} 0 0 1 ${r},0Z`;
  }
  const k = Math.max(0, Math.min(size, h * 0.8, w / 4));
  // Drawn as a hanging plaque (anchor at y=0); a plinth is the same path reflected top to bottom.
  const Y = (y: number) => f(shape === 'plinth' ? h - y : y);
  const y1 = h - k;
  const anchor = Y(0);
  const rightFlank =
    `V${Y(y1)}C${w},${Y(y1 + k * 0.55)} ${f(w - k * 0.35)},${Y(y1 + k * 0.45)} ${f(w - k * 0.5)},${Y(y1 + k * 0.6)}` +
    `C${f(w - k * 0.65)},${Y(y1 + k * 0.75)} ${f(w - k * 0.7)},${Y(h)} ${f(w - k * 1.3)},${Y(h)}`;
  const bottom = sag > 0 ? `Q${f(w / 2)},${Y(h + sag * 2)} ${f(k * 1.3)},${Y(h)}` : `H${f(k * 1.3)}`;
  const leftFlank =
    `C${f(k * 0.7)},${Y(h)} ${f(k * 0.65)},${Y(y1 + k * 0.75)} ${f(k * 0.5)},${Y(y1 + k * 0.6)}` +
    `C${f(k * 0.35)},${Y(y1 + k * 0.45)} 0,${Y(y1 + k * 0.55)} 0,${Y(y1)}`;
  return `M0,${anchor}H${w}${rightFlank}${bottom}${leftFlank}Z`;
}
