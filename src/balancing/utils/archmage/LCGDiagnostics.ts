/**
 * LCG Diagnostics & Seed Visualizer
 * 
 * Provides diagnostic tools for Linear Congruential Generator (LCG) analysis,
 * including seed tracking, distribution analysis, and determinism verification.
 * 
 * @module LCGDiagnostics
 * @since 2026-01-11
 * @author Atlas-RNG
 */

import { createSeededRng, normalizeSeed } from './seededRng';

/**
 * LCG diagnostic result
 */
export interface LCGDiagnosticResult {
  /** Seed used for generation */
  seed: number;
  /** Normalized seed value */
  normalizedSeed: number;
  /** Number of samples generated */
  sampleCount: number;
  /** Distribution statistics */
  distribution: {
    /** Mean of generated values */
    mean: number;
    /** Standard deviation */
    stdDev: number;
    /** Minimum value */
    min: number;
    /** Maximum value */
    max: number;
    /** Distribution buckets (0-0.1, 0.1-0.2, etc.) */
    buckets: number[];
  };
  /** Chi-squared test result for uniformity */
  chiSquared: {
    /** Chi-squared statistic */
    statistic: number;
    /** Degrees of freedom */
    degreesOfFreedom: number;
    /** Expected frequency per bucket */
    expectedFrequency: number;
    /** Pass/fail based on threshold */
    isUniform: boolean;
  };
  /** Sequence reproducibility check */
  reproducibility: {
    /** Whether sequence is reproducible */
    isReproducible: boolean;
    /** First 10 values from initial run */
    firstRun: number[];
    /** First 10 values from second run */
    secondRun: number[];
  };
  /** Performance metrics */
  performance: {
    /** Time to generate samples (ms) */
    generationTime: number;
    /** Samples per millisecond */
    samplesPerMs: number;
  };
}

/**
 * Seed visualization data
 */
export interface SeedVisualizationData {
  /** Original seed */
  seed: number;
  /** Normalized seed */
  normalizedSeed: number;
  /** Binary representation */
  binary: string;
  /** Hexadecimal representation */
  hex: string;
  /** Seed quality score (0-100) */
  qualityScore: number;
  /** First 20 generated values */
  preview: number[];
  /** Distribution histogram (10 buckets) */
  histogram: number[];
}

/**
 * Run comprehensive diagnostics on LCG with given seed
 * 
 * @param seed - Seed to test
 * @param sampleCount - Number of samples to generate (default: 10000)
 * @returns Diagnostic results
 * 
 * @example
 * ```typescript
 * const diagnostics = runLCGDiagnostics(12345, 10000);
 * console.log('Mean:', diagnostics.distribution.mean);
 * console.log('Is uniform:', diagnostics.chiSquared.isUniform);
 * ```
 */
export function runLCGDiagnostics(
  seed: number,
  sampleCount: number = 10000
): LCGDiagnosticResult {
  const normalizedSeed = normalizeSeed(seed);
  const startTime = performance.now();
  
  // Generate samples
  const rng = createSeededRng(seed);
  const samples: number[] = [];
  for (let i = 0; i < sampleCount; i++) {
    samples.push(rng());
  }
  
  const generationTime = performance.now() - startTime;
  
  // Calculate distribution statistics
  const distribution = calculateDistribution(samples);
  
  // Chi-squared test for uniformity
  const chiSquared = chiSquaredTest(distribution.buckets, sampleCount);
  
  // Reproducibility test
  const reproducibility = testReproducibility(seed);
  
  return {
    seed,
    normalizedSeed,
    sampleCount,
    distribution,
    chiSquared,
    reproducibility,
    performance: {
      generationTime,
      samplesPerMs: sampleCount / generationTime,
    },
  };
}

/**
 * Calculate distribution statistics from samples
 */
function calculateDistribution(samples: number[]): LCGDiagnosticResult['distribution'] {
  const n = samples.length;
  
  // Mean
  const mean = samples.reduce((sum, val) => sum + val, 0) / n;
  
  // Standard deviation
  const variance = samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  // Min/Max
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  
  // Distribution buckets (10 buckets: 0-0.1, 0.1-0.2, ..., 0.9-1.0)
  const buckets = new Array(10).fill(0);
  for (const sample of samples) {
    const bucketIndex = Math.min(Math.floor(sample * 10), 9);
    buckets[bucketIndex]++;
  }
  
  return { mean, stdDev, min, max, buckets };
}

/**
 * Perform chi-squared test for uniformity
 * 
 * @param buckets - Observed frequencies
 * @param totalSamples - Total number of samples
 * @returns Chi-squared test result
 */
function chiSquaredTest(
  buckets: number[],
  totalSamples: number
): LCGDiagnosticResult['chiSquared'] {
  const k = buckets.length;
  const expectedFrequency = totalSamples / k;
  
  // Chi-squared statistic: Σ((O - E)² / E)
  const statistic = buckets.reduce((sum, observed) => {
    return sum + Math.pow(observed - expectedFrequency, 2) / expectedFrequency;
  }, 0);
  
  const degreesOfFreedom = k - 1;
  
  // Critical value for α=0.05, df=9 is ~16.92
  // If statistic < critical value, distribution is uniform
  const criticalValue = 16.92;
  const isUniform = statistic < criticalValue;
  
  return {
    statistic,
    degreesOfFreedom,
    expectedFrequency,
    isUniform,
  };
}

/**
 * Test reproducibility of RNG sequence
 * 
 * @param seed - Seed to test
 * @returns Reproducibility test result
 */
function testReproducibility(seed: number): LCGDiagnosticResult['reproducibility'] {
  const rng1 = createSeededRng(seed);
  const firstRun: number[] = [];
  for (let i = 0; i < 10; i++) {
    firstRun.push(rng1());
  }
  
  const rng2 = createSeededRng(seed);
  const secondRun: number[] = [];
  for (let i = 0; i < 10; i++) {
    secondRun.push(rng2());
  }
  
  const isReproducible = firstRun.every((val, idx) => val === secondRun[idx]);
  
  return { isReproducible, firstRun, secondRun };
}

/**
 * Generate visualization data for a seed
 * 
 * @param seed - Seed to visualize
 * @returns Visualization data
 * 
 * @example
 * ```typescript
 * const vizData = generateSeedVisualization(12345);
 * console.log('Binary:', vizData.binary);
 * console.log('Quality:', vizData.qualityScore);
 * ```
 */
export function generateSeedVisualization(seed: number): SeedVisualizationData {
  const normalizedSeed = normalizeSeed(seed);
  
  // Binary and hex representations
  const binary = normalizedSeed.toString(2).padStart(32, '0');
  const hex = '0x' + normalizedSeed.toString(16).toUpperCase().padStart(8, '0');
  
  // Generate preview values
  const rng = createSeededRng(seed);
  const preview: number[] = [];
  for (let i = 0; i < 20; i++) {
    preview.push(rng());
  }
  
  // Generate histogram (10 buckets)
  const histogram = new Array(10).fill(0);
  const rngHist = createSeededRng(seed);
  for (let i = 0; i < 1000; i++) {
    const val = rngHist();
    const bucketIndex = Math.min(Math.floor(val * 10), 9);
    histogram[bucketIndex]++;
  }
  
  // Calculate quality score based on distribution uniformity
  const expectedCount = 100; // 1000 samples / 10 buckets
  const variance = histogram.reduce((sum, count) => {
    return sum + Math.pow(count - expectedCount, 2);
  }, 0) / 10;
  
  // Lower variance = higher quality (max score 100)
  const qualityScore = Math.max(0, Math.min(100, 100 - variance / 10));
  
  return {
    seed,
    normalizedSeed,
    binary,
    hex,
    qualityScore,
    preview,
    histogram,
  };
}

/**
 * Compare two seeds and their generated sequences
 * 
 * @param seed1 - First seed
 * @param seed2 - Second seed
 * @param sampleCount - Number of samples to compare (default: 100)
 * @returns Comparison result
 */
export function compareSeedSequences(
  seed1: number,
  seed2: number,
  sampleCount: number = 100
): {
  seed1: number;
  seed2: number;
  correlation: number;
  divergencePoint: number | null;
  maxDifference: number;
  averageDifference: number;
} {
  const rng1 = createSeededRng(seed1);
  const rng2 = createSeededRng(seed2);
  
  let divergencePoint: number | null = null;
  let maxDifference = 0;
  let totalDifference = 0;
  const values1: number[] = [];
  const values2: number[] = [];
  
  for (let i = 0; i < sampleCount; i++) {
    const val1 = rng1();
    const val2 = rng2();
    values1.push(val1);
    values2.push(val2);
    
    const diff = Math.abs(val1 - val2);
    totalDifference += diff;
    maxDifference = Math.max(maxDifference, diff);
    
    if (divergencePoint === null && diff > 0.001) {
      divergencePoint = i;
    }
  }
  
  // Calculate Pearson correlation
  const mean1 = values1.reduce((sum, v) => sum + v, 0) / sampleCount;
  const mean2 = values2.reduce((sum, v) => sum + v, 0) / sampleCount;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < sampleCount; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  const correlation = numerator / Math.sqrt(denom1 * denom2);
  
  return {
    seed1,
    seed2,
    correlation,
    divergencePoint,
    maxDifference,
    averageDifference: totalDifference / sampleCount,
  };
}

/**
 * Batch test multiple seeds
 * 
 * @param seeds - Array of seeds to test
 * @param sampleCount - Samples per seed (default: 1000)
 * @returns Array of diagnostic results
 */
export function batchTestSeeds(
  seeds: number[],
  sampleCount: number = 1000
): LCGDiagnosticResult[] {
  return seeds.map(seed => runLCGDiagnostics(seed, sampleCount));
}

/**
 * Find optimal seed in range based on quality criteria
 * 
 * @param minSeed - Minimum seed value
 * @param maxSeed - Maximum seed value
 * @param testCount - Number of seeds to test (default: 100)
 * @returns Best seed and its quality score
 */
export function findOptimalSeed(
  minSeed: number,
  maxSeed: number,
  testCount: number = 100
): { seed: number; qualityScore: number; diagnostics: LCGDiagnosticResult } {
  const step = Math.floor((maxSeed - minSeed) / testCount);
  let bestSeed = minSeed;
  let bestScore = 0;
  let bestDiagnostics: LCGDiagnosticResult | null = null;
  
  for (let i = 0; i < testCount; i++) {
    const seed = minSeed + i * step;
    const vizData = generateSeedVisualization(seed);
    
    if (vizData.qualityScore > bestScore) {
      bestScore = vizData.qualityScore;
      bestSeed = seed;
      bestDiagnostics = runLCGDiagnostics(seed, 1000);
    }
  }
  
  return {
    seed: bestSeed,
    qualityScore: bestScore,
    diagnostics: bestDiagnostics!,
  };
}
