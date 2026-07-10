/**
 * bloomEffect — single source of truth for the "AAA" drop-target bloom.
 *
 * Every element that can receive the dragged token (slots, POIs, …) uses this
 * exact effect, so the bloom reads as one system across the game.
 *
 * DESIGN (2026 refresh — "Ember Aurora"):
 * Modern AAA drop-target highlights have moved past the flat, single-hue throb.
 * The current trend (GDC UI talks, Game UI Database, oklch-based glow work) is:
 *   1. Perceptually-even light via the **oklch** color space — gold/amber glows
 *      that stay luminous instead of turning muddy as alpha drops.
 *   2. **Volumetric, multi-hue HDR falloff** — an incandescent white-gold core
 *      that cools through gold → amber → deep ember, so the halo reads as real
 *      light with depth, not a colored blur.
 *   3. **"Dormant energy that ignites"** — an organic breathing pulse PLUS a
 *      second energy wave that is *born at the rim and emanates outward*, then
 *      fades — the "pulsing rings" language of current game HUDs.
 *
 * Technique (unchanged, deliberately):
 * - Built entirely from stacked `filter: drop-shadow()` layers so the glow
 *   follows the element's ALPHA CHANNEL — round medallions get round halos,
 *   square cards get square halos, never a box-shadow rectangle.
 * - Radii are PROPORTIONAL to element size via the `--bloom-unit` CSS variable,
 *   so a 60px slot and a 200px medallion glow with the same visual weight.
 * - `filter`-only animation keeps it on the GPU compositor (no layout/paint),
 *   protecting INP.
 */
import type { CSSProperties } from 'react';

/**
 * oklch palette — lightness / chroma / hue. Tuned as an HDR temperature ramp:
 * incandescent core → radiant gold → amber → deep ember atmosphere.
 */
/** Incandescent near-white core (hottest point of the light). */
const CORE = 'oklch(0.97 0.06 95)';
/** Radiant gold — the game's signature accent. */
const GOLD = 'oklch(0.86 0.19 90)';
/** Amber mid falloff. */
const AMBER = 'oklch(0.77 0.18 68)';
/** Deep warm ember — the wide atmospheric wave. */
const EMBER = 'oklch(0.62 0.16 52)';

const BLOOM_ANIMATION_NAME = 'aaa-bloom-pulse';

/** Reference size the layer radii are tuned against. */
const REFERENCE_SIZE_PX = 120;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));
const px = (radius: number): string => `calc(var(--bloom-unit, 1) * ${radius.toFixed(2)}px)`;

/**
 * A single emanating energy ring: born tight at the rim, travels outward and
 * fades to 0 at the edge. `frac` is its own 0→1 progress.
 */
const wave = (i: number, frac: number): string =>
  `drop-shadow(0 0 ${px(22 + 50 * frac)} ${withAlpha(EMBER, 0.46 * i * Math.pow(1 - frac, 1.1))})`;

/**
 * Layered volumetric glow.
 * @param i intensity of the steady core (breathing).
 * @param phase 0→1 drive for the emanating waves. TWO rings run half a cycle
 *        apart, so there is always energy in flight → a continuous, punchy
 *        outward pulse rather than a single lazy throb.
 * Radii are expressed against `--bloom-unit` so the halo scales with the element.
 */
const bloomFilter = (i: number, phase: number): string => {
  return [
    // hot rim hugging the silhouette
    `drop-shadow(0 0 ${px(3.5 * i)} ${withAlpha(CORE, i)})`,
    // radiant inner corona
    `drop-shadow(0 0 ${px(11 * i)} ${withAlpha(GOLD, 0.82 * i)})`,
    // amber mid falloff
    `drop-shadow(0 0 ${px(23 * i)} ${withAlpha(AMBER, 0.55 * i)})`,
    // two staggered emanating ember rings
    wave(i, phase),
    wave(i, (phase + 0.5) % 1),
  ].join(' ');
};

/** Appends an alpha to an oklch(L C H) color → oklch(L C H / a). */
function withAlpha(oklch: string, alpha: number): string {
  return oklch.replace(/\)\s*$/, ` / ${clamp01(alpha).toFixed(2)})`);
}

const BLOOM_KEYFRAMES = `
@keyframes ${BLOOM_ANIMATION_NAME} {
  0%   { filter: ${bloomFilter(0.85, 0)}; }
  25%  { filter: ${bloomFilter(1.25, 0.25)}; }
  50%  { filter: ${bloomFilter(1.5, 0.5)}; }
  75%  { filter: ${bloomFilter(1.25, 0.75)}; }
  100% { filter: ${bloomFilter(0.85, 1)}; }
}
`;

let keyframesInjected = false;

/** Injects the shared bloom keyframes once per document. */
export function ensureBloomKeyframes(): void {
  if (keyframesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-bloom-effect', 'true');
  style.textContent = BLOOM_KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

export type BloomState = 'idle' | 'valid' | 'invalid';

/**
 * Style for a drop-target in the given highlight state.
 * @param sizePx rendered size of the element — the halo scales with it.
 * - valid   → living ember-aurora bloom (breathing core + emanating wave)
 * - invalid → cooled to a desaturated dim (not a receiver for the token in hand)
 * - idle    → no effect
 */
export function getBloomStyle(state: BloomState, sizePx: number = REFERENCE_SIZE_PX): CSSProperties {
  ensureBloomKeyframes();
  const unit = Math.max(0.35, sizePx / REFERENCE_SIZE_PX);
  const withUnit = { ['--bloom-unit' as string]: unit.toFixed(3) };
  switch (state) {
    case 'valid':
      return {
        ...withUnit,
        filter: bloomFilter(1.1, 0.25),
        animation: `${BLOOM_ANIMATION_NAME} 1.5s ease-in-out infinite`,
        transition: 'filter 220ms ease, opacity 220ms ease',
        opacity: 1,
        willChange: 'filter',
      };
    case 'invalid':
      return {
        ...withUnit,
        filter: 'grayscale(0.7) brightness(0.72)',
        opacity: 0.32,
        transition: 'filter 220ms ease, opacity 220ms ease',
      };
    case 'idle':
    default:
      return {
        ...withUnit,
        filter: 'none',
        opacity: 1,
        transition: 'filter 220ms ease, opacity 220ms ease',
      };
  }
}
