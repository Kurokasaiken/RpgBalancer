/**
 * Deterministic seeded RNG utilities for Archmage simulators.
 * Provides Linear Congruential Generator instances with reproducible sequences.
 */

const MODULUS = 4294967296;
const MULTIPLIER = 1664525;
const INCREMENT = 1013904223;

/**
 * Creates a deterministic RNG function based on Linear Congruential Generator (LCG).
 *
 * @param seed - Initial numeric seed (defaults to Date.now()).
 * @returns Function returning pseudo-random numbers in [0, 1).
 */
export function createSeededRng(seed: number = Date.now()): () => number {
  let state = normalizeSeed(seed);
  return () => {
    state = (state * MULTIPLIER + INCREMENT) % MODULUS;
    return state / MODULUS;
  };
}

/**
 * Normalizes any incoming seed to fit the LCG modulus range.
 *
 * @param seed - Source value (can be negative or large).
 * @returns Safe seed inside [0, MODULUS).
 */
export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    return Math.floor(Date.now() % MODULUS);
  }
  const normalized = seed % MODULUS;
  return normalized < 0 ? normalized + MODULUS : normalized;
}
