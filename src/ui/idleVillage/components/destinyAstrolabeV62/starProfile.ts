/**
 * starProfile — the silhouette family of the V6.2 astrolabe star (desiderata v37, R-275).
 *
 * The board shows ONE family, never a mix:
 *   flower    — the party is at or below the check (rounded tips, full petals, high valley)
 *   star      — the party is stronger (sharp tips, straight flanks, low valley)
 *   lean star — the party is much stronger (sharp tips, deepest valley)
 *
 * Each axis votes on its own RAW stat/difficulty margin (`stat/diff` — not on radii, so the
 * thresholds stay exact): strictly above +10% casts a star vote, strictly above +35% a lean
 * vote. The board family is the highest level reaching the majority (≥3 of 5 axes): lean if
 * at least 3 axes beat +35%, else star if at least 3 axes beat +10%, else flower.
 *
 * Morph coupling (v16/v17, PLAN-010): tip shape and valley depth are one parameter — a rounded
 * tip only ever stands on a HIGH valley, a sharp tip only ever stands on a LOW valley. The
 * prohibited quadrant — rounded tip over a valley dug to the core, the half-flower — is
 * unconstructible here: `V62_VALLEY_FLOWER = 0.3675` was exactly that bug and stays dead.
 *
 * Inside the chosen family each valley still reads its two neighbours — for DEPTH only:
 * the valley floor moves inside the family band driven by the weaker adjacent margin, so
 * unequal axes keep their own proportions while the silhouette stays one family.
 * Pure, so the rule is testable without a canvas.
 */

export type V62StarFamily = 'flower' | 'star' | 'lean';

/** Family thresholds on the raw stat/difficulty margin (v37): strictly above. */
export const V62_STAR_MARGIN = 1.10;
export const V62_LEAN_MARGIN = 1.35;

/**
 * Valley bands per family — the valley floor as a fraction of the weaker neighbouring tip.
 * Flower keeps the v17 unlocked range (full petals); star digs as the margin grows; lean is
 * the V16 cap, the sharpest admitted. Exact tuning pending the PLAN-082 visual eye-check.
 */
export const V62_FLOWER_VALLEY_MIN = 0.42;
export const V62_FLOWER_VALLEY_MAX = 0.55;
export const V62_STAR_VALLEY_MAX = 0.30;
export const V62_LEAN_VALLEY = 0.15;

export interface ValleyProfile {
  /** 0 = flower (rounded tips, sampled petals), 1 = star/lean (chord flanks).
   *  The family is board-wide, so the mix is the same on every valley. */
  mix: number;
  /** Valley floor as a fraction of the weaker neighbouring tip, inside the family band. */
  depth: number;
}

export interface BoardStarProfile {
  /** The single family the whole board renders. */
  family: V62StarFamily;
  /** One profile per valley; valley `i` sits between tip `i` and tip `i+1` (wrapping). */
  valleys: ValleyProfile[];
}

const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Depth of one valley inside the family's band, driven by the weaker adjacent margin. */
const depthFor = (family: V62StarFamily, e: number): number => {
  if (family === 'flower')
    return lerp(V62_FLOWER_VALLEY_MAX, V62_FLOWER_VALLEY_MIN, clamp01(e / V62_STAR_MARGIN));
  if (family === 'star')
    return lerp(
      V62_STAR_VALLEY_MAX,
      V62_LEAN_VALLEY,
      clamp01((e - V62_STAR_MARGIN) / (V62_LEAN_MARGIN - V62_STAR_MARGIN)),
    );
  return V62_LEAN_VALLEY;
};

/**
 * The board-level silhouette rule (v37): majority vote over the raw per-axis margins decides
 * ONE family; every valley carries that family's mix, and only its depth still varies inside
 * the family band from the weaker of the two neighbouring axes.
 */
export function boardStarProfile(margins: readonly number[]): BoardStarProfile {
  const n = margins.length;
  const need = Math.floor(n / 2) + 1;
  const leanVotes = margins.filter((e) => e > V62_LEAN_MARGIN).length;
  const starVotes = margins.filter((e) => e > V62_STAR_MARGIN).length;
  const family: V62StarFamily = leanVotes >= need ? 'lean' : starVotes >= need ? 'star' : 'flower';
  const mix = family === 'flower' ? 0 : 1;
  return {
    family,
    valleys: margins.map((_, i) => {
      const e = Math.min(margins[i], margins[(i + 1) % n]);
      return { mix, depth: depthFor(family, e) };
    }),
  };
}
