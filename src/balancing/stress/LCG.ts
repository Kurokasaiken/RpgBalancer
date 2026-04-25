/**
 * Linear Congruential Generator for deterministic random numbers
 * Ensures reproducible simulations across different environments
 */

export class LCG {
  private seed: number;
  private readonly a = 1664525;
  private readonly c = 1013904223;
  private readonly m = Math.pow(2, 32);

  /**
   * Creates a new LCG instance.
   * 
   * @param seed - Initial seed value
   */
  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Generates the next random number in the sequence.
   * 
   * @returns Random number between 0 and 1
   */
  next(): number {
    this.seed = (this.a * this.seed + this.c) % this.m;
    return this.seed / this.m;
  }

  /**
   * Generates a random integer between min and max (inclusive).
   * 
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random integer
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generates a random float between min and max.
   * 
   * @param min - Minimum value
   * @param max - Maximum value
   * @returns Random float
   */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Resets the generator with a new seed.
   * 
   * @param seed - New seed value
   */
  reset(seed: number): void {
    this.seed = seed;
  }

  /**
   * Gets the current seed value.
   * 
   * @returns Current seed
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Creates a copy of this generator.
   * 
   * @returns New LCG instance with same seed
   */
  clone(): LCG {
    const clone = new LCG(this.seed);
    return clone;
  }

  /**
   * Generates an array of random numbers.
   * 
   * @param count - Number of random numbers to generate
   * @returns Array of random numbers
   */
  nextArray(count: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.next());
    }
    return result;
  }

  /**
   * Shuffles an array in place using Fisher-Yates algorithm.
   * 
   * @param array - Array to shuffle
   * @returns The shuffled array
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Selects a random element from an array.
   * 
   * @param array - Array to select from
   * @returns Random element
   */
  select<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Generates a random boolean with given probability.
   * 
   * @param probability - Probability of true (0-1)
   * @returns Random boolean
   */
  nextBoolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Generates a random number from a normal distribution (Box-Muller transform).
   * 
   * @param mean - Mean value
   * @param stdDev - Standard deviation
   * @returns Random number from normal distribution
   */
  nextNormal(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    let u = 0;
    let v = 0;
    while (u === 0) u = this.next();
    while (v === 0) v = this.next();
    
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return z * stdDev + mean;
  }

  /**
   * Creates a seeded random function compatible with Math.random.
   * 
   * @returns Function that returns random numbers 0-1
   */
  toRandomFunction(): () => number {
    return () => this.next();
  }
}

/**
 * Creates a deterministic random function from a seed.
 * 
 * @param seed - Seed value
 * @returns Random function
 */
export function createDeterministicRandom(seed: number): () => number {
  const lcg = new LCG(seed);
  return lcg.toRandomFunction();
}

/**
 * Utility for creating multiple independent generators from a single seed.
 */
export class SeededRandomFactory {
  private baseSeed: number;
  private counter: number;

  /**
   * Creates a new factory.
   * 
   * @param baseSeed - Base seed for all generators
   */
  constructor(baseSeed: number) {
    this.baseSeed = baseSeed;
    this.counter = 0;
  }

  /**
   * Creates a new LCG generator with a unique derived seed.
   * 
   * @param namespace - Optional namespace for seed derivation
   * @returns New LCG instance
   */
  createGenerator(namespace?: string): LCG {
    const derivedSeed = this.deriveSeed(this.baseSeed, this.counter++, namespace);
    return new LCG(derivedSeed);
  }

  /**
   * Derives a unique seed from base seed and counter.
   * 
   * @param baseSeed - Base seed value
   * @param counter - Counter value
   * @param namespace - Optional namespace
   * @returns Derived seed
   */
  private deriveSeed(baseSeed: number, counter: number, namespace?: string): number {
    let hash = baseSeed ^ counter;
    if (namespace) {
      for (let i = 0; i < namespace.length; i++) {
        hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
      }
    }
    return Math.abs(hash);
  }

  /**
   * Resets the factory counter.
   */
  reset(): void {
    this.counter = 0;
  }
}

/**
 * Default seed generator based on current time.
 */
export const DEFAULT_SEED = Date.now();

/**
 * Validates that a seed is a valid number.
 * 
 * @param seed - Seed to validate
 * @returns Whether seed is valid
 */
export function isValidSeed(seed: unknown): seed is number {
  return typeof seed === 'number' && !isNaN(seed) && isFinite(seed);
}

/**
 * Normalizes a seed value to a valid integer.
 * 
 * @param seed - Seed to normalize
 * @returns Normalized seed
 */
export function normalizeSeed(seed: unknown): number {
  if (!isValidSeed(seed)) {
    return DEFAULT_SEED;
  }
  return Math.abs(Math.floor(seed));
}
