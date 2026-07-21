/**
 * Deterministic Mulberry32 PRNG for the presentation runtime.
 *
 * Each runtime update receives a base seed; effects can `fork` sub-streams
 * without affecting the root generator.  This keeps presentation effects
 * deterministic and replayable.
 */

export interface PresentationRandom {
  next(): number;
  fork(namespace: string, counter?: number): PresentationRandom;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Stable string-to-number hash used for deterministic forks.
 */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createPresentationRandom(seed: number): PresentationRandom {
  const generator = mulberry32(seed);

  return {
    next: () => generator(),
    fork(namespace, counter = 0) {
      const derived = (seed ^ hashString(namespace) ^ counter) >>> 0;
      return createPresentationRandom(derived);
    },
  };
}

/**
 * Backwards-compatible alias for tests that import the class form.
 */
export class PresentationRandomClass implements PresentationRandom {
  private readonly generator: () => number;

  constructor(seed: number) {
    this.generator = mulberry32(seed);
  }

  next(): number {
    return this.generator();
  }

  fork(namespace: string, counter = 0): PresentationRandom {
    const derived = (this.next() * 4294967296 ^ hashString(namespace) ^ counter) >>> 0;
    return new PresentationRandomClass(derived);
  }
}
