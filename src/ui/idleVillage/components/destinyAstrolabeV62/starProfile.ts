/**
 * starProfile — the per-valley shape rule of the V6.2 star (PLAN-067 T-B1b, R-234).
 *
 * The star is flower below parity (round petals) and star above it (straight flanks), and its
 * valleys dig deeper as the tips outgrow the tar wall. The first version read ONE number for the
 * whole figure — the smallest tip/wall ratio — so with unequal axes (a real party) the weakest axis
 * decided every valley and a long petal beside a short one tapered into a blade.
 *
 * Here each VALLEY reads its own two neighbours: the family (flower↔star) and the depth come from
 * the weaker of the tips it sits between. Pure, so the rule is testable without a canvas.
 */

const PHI = (1 + Math.sqrt(5)) / 2;
/** Parity: from here the figure is a star. */
export const V62_STAR_FROM = 0.9;
export const V62_STAR_AT = 1.0;
/** Where the plain star would cover the whole tar. */
export const V62_COVER_ALL = PHI * PHI;
export const V62_VALLEY_FLOWER = 0.3675;
export const V62_VALLEY_STAR = 1 / (PHI * PHI);
export const V62_VALLEY_BLADE = 0.22;

const smoothstep = (t: number, a: number, b: number): number => {
  if (t <= a) return 0;
  if (t >= b) return 1;
  const m = (t - a) / (b - a);
  return m * m * (3 - 2 * m);
};

export interface ValleyProfile {
  /** 0 = flower (round), 1 = star (straight flanks). */
  mix: number;
  /** Valley floor as a fraction of the weaker neighbouring tip. */
  depth: number;
}

/** One profile per valley; valley `i` sits between tip `i` and tip `i+1` (wrapping). */
export function valleyProfiles(tips: readonly number[], walls: readonly number[]): ValleyProfile[] {
  const n = tips.length;
  const elong = (i: number) => tips[i] / Math.max(1e-6, walls[i]);
  return tips.map((_, i) => {
    const e = Math.min(elong(i), elong((i + 1) % n));
    const mix = smoothstep(e, V62_STAR_FROM, V62_STAR_AT);
    const blade = smoothstep(e, V62_COVER_ALL * 0.7, V62_COVER_ALL);
    const base = V62_VALLEY_FLOWER + (V62_VALLEY_STAR - V62_VALLEY_FLOWER) * mix;
    return { mix, depth: base + (V62_VALLEY_BLADE - base) * blade };
  });
}
