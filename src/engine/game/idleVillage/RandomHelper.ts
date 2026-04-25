/**
 * Minimal Gameplay RNG helper.
 * Wraps the shared seeded RNG utilities so that engine state can persist
 * deterministic random sequences without storing closures or Date-based entropy.
 */

import { createSeededRng, normalizeSeed } from '@/balancing/utils/archmage/seededRng';

/**
 * Serialized RNG state stored inside the Minimal Gameplay engine state.
 */
export interface MinimalRngState {
  /** Normalized seed driving the deterministic sequence. */
  seed: number;
  /** Current cursor value used to derive the next random sample. */
  cursor: number;
}

/**
 * Creates a deterministic RNG state from a numeric seed.
 */
export function createMinimalRngState(seed: number): MinimalRngState {
  const normalized = normalizeSeed(seed);
  return {
    seed: normalized,
    cursor: normalized,
  };
}

/**
 * Generates the next pseudo-random number in [0, 1) along with the updated RNG state.
 */
export function nextRandomValue(rngState: MinimalRngState): {
  value: number;
  nextState: MinimalRngState;
} {
  // Re-create the deterministic generator at the current cursor and advance once.
  const generator = createSeededRng(rngState.cursor);
  const value = generator();
  const nextCursor = Math.floor(value * 4294967296);

  return {
    value,
    nextState: {
      seed: rngState.seed,
      cursor: nextCursor,
    },
  };
}

/**
 * Ensures we always operate with a valid RNG state, even if legacy snapshots omit it.
 */
export function ensureMinimalRngState(
  state: MinimalRngState | undefined,
  fallbackSeed: number
): MinimalRngState {
  if (state && Number.isFinite(state.cursor)) {
    return state;
  }
  return createMinimalRngState(fallbackSeed);
}
