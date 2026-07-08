/**
 * bloomEffect — single source of truth for the "AAA" drop-target bloom.
 *
 * Every element that can receive the dragged token (slots, POIs, …) uses this
 * exact effect, so the bloom reads as one system across the game.
 *
 * Technique (game-UI standard):
 * - `filter: drop-shadow()` stacked in layers of increasing blur and
 *   decreasing alpha → volumetric light decay that follows the element's
 *   ALPHA CHANNEL (round medallions get round halos — never a square box,
 *   which is the box-shadow artifact this replaces).
 * - Radii are PROPORTIONAL to the element size (via the --bloom-unit CSS
 *   variable): a 60px slot and a 160px medallion glow with the same visual
 *   weight relative to their silhouette.
 * - Layers simulate HDR light decay: hot white-gold rim → amber corona →
 *   wide warm atmosphere. A slow pulse animates intensity, not color.
 */
import type { CSSProperties } from 'react';

/** Amber corona — the game's gold accent. */
const GLOW_RGB = '251, 191, 36';
/** Hot rim, near-white for the HDR-like core. */
const CORE_RGB = '255, 241, 196';
/** Warm deep atmosphere falloff. */
const ATMO_RGB = '227, 140, 24';

const BLOOM_ANIMATION_NAME = 'aaa-bloom-pulse';

/** Reference size the layer radii are tuned against. */
const REFERENCE_SIZE_PX = 120;

/**
 * Layered volumetric glow. Radii are expressed against `--bloom-unit`
 * (the element size / REFERENCE_SIZE) so the halo scales with the component.
 */
const bloomFilter = (intensity: number): string => [
  // hot rim hugging the silhouette
  `drop-shadow(0 0 calc(var(--bloom-unit, 1) * ${(2 * intensity).toFixed(2)}px) rgba(${CORE_RGB}, ${Math.min(1, 0.95 * intensity).toFixed(2)}))`,
  // main corona
  `drop-shadow(0 0 calc(var(--bloom-unit, 1) * ${(9 * intensity).toFixed(2)}px) rgba(${GLOW_RGB}, ${(0.55 * intensity).toFixed(2)}))`,
  // mid falloff
  `drop-shadow(0 0 calc(var(--bloom-unit, 1) * ${(22 * intensity).toFixed(2)}px) rgba(${GLOW_RGB}, ${(0.3 * intensity).toFixed(2)}))`,
  // wide warm atmosphere
  `drop-shadow(0 0 calc(var(--bloom-unit, 1) * ${(42 * intensity).toFixed(2)}px) rgba(${ATMO_RGB}, ${(0.16 * intensity).toFixed(2)}))`,
].join(' ');

const BLOOM_KEYFRAMES = `
@keyframes ${BLOOM_ANIMATION_NAME} {
  0%, 100% { filter: ${bloomFilter(0.7)}; }
  50%      { filter: ${bloomFilter(1.2)}; }
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
 * - valid   → pulsing layered glow (alpha-shaped, works on any silhouette)
 * - invalid → dimmed to alpha (not a receiver for the token in hand)
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
        filter: bloomFilter(1),
        animation: `${BLOOM_ANIMATION_NAME} 1.8s ease-in-out infinite`,
        transition: 'filter 200ms ease, opacity 200ms ease',
        opacity: 1,
      };
    case 'invalid':
      return {
        ...withUnit,
        filter: 'saturate(0.6)',
        opacity: 0.3,
        transition: 'filter 200ms ease, opacity 200ms ease',
      };
    case 'idle':
    default:
      return {
        ...withUnit,
        filter: 'none',
        opacity: 1,
        transition: 'filter 200ms ease, opacity 200ms ease',
      };
  }
}
