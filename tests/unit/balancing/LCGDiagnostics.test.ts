/**
 * LCG Diagnostics Test Suite
 * 
 * Comprehensive tests for LCG diagnostic tools including seed tracking,
 * distribution analysis, and determinism verification.
 * 
 * @module LCGDiagnostics.test
 * @since 2026-01-11
 * @author Atlas-RNG
 */

import { describe, it, expect } from 'vitest';
import {
  runLCGDiagnostics,
  generateSeedVisualization,
  compareSeedSequences,
  batchTestSeeds,
  findOptimalSeed,
} from '../../../src/balancing/utils/archmage/LCGDiagnostics';

describe('LCGDiagnostics', () => {
  describe('runLCGDiagnostics', () => {
    it('should generate comprehensive diagnostics for a seed', () => {
      const result = runLCGDiagnostics(12345, 1000);
      
      expect(result.seed).toBe(12345);
      expect(result.normalizedSeed).toBeGreaterThanOrEqual(0);
      expect(result.sampleCount).toBe(1000);
      expect(result.distribution).toBeDefined();
      expect(result.chiSquared).toBeDefined();
      expect(result.reproducibility).toBeDefined();
      expect(result.performance).toBeDefined();
    });

    it('should calculate distribution statistics correctly', () => {
      const result = runLCGDiagnostics(12345, 10000);
      
      // Mean should be close to 0.5 for uniform distribution
      expect(result.distribution.mean).toBeGreaterThan(0.4);
      expect(result.distribution.mean).toBeLessThan(0.6);
      
      // Min should be close to 0
      expect(result.distribution.min).toBeGreaterThanOrEqual(0);
      expect(result.distribution.min).toBeLessThan(0.1);
      
      // Max should be close to 1
      expect(result.distribution.max).toBeGreaterThan(0.9);
      expect(result.distribution.max).toBeLessThanOrEqual(1);
      
      // Should have 10 buckets
      expect(result.distribution.buckets).toHaveLength(10);
    });

    it('should perform chi-squared test for uniformity', () => {
      const result = runLCGDiagnostics(12345, 10000);
      
      expect(result.chiSquared.statistic).toBeGreaterThanOrEqual(0);
      expect(result.chiSquared.degreesOfFreedom).toBe(9);
      expect(result.chiSquared.expectedFrequency).toBe(1000);
      expect(typeof result.chiSquared.isUniform).toBe('boolean');
    });

    it('should verify reproducibility', () => {
      const result = runLCGDiagnostics(12345, 100);
      
      expect(result.reproducibility.isReproducible).toBe(true);
      expect(result.reproducibility.firstRun).toHaveLength(10);
      expect(result.reproducibility.secondRun).toHaveLength(10);
      expect(result.reproducibility.firstRun).toEqual(result.reproducibility.secondRun);
    });

    it('should measure performance metrics', () => {
      const result = runLCGDiagnostics(12345, 10000);
      
      expect(result.performance.generationTime).toBeGreaterThan(0);
      expect(result.performance.samplesPerMs).toBeGreaterThan(0);
    });

    it('should handle different seeds deterministically', () => {
      const result1 = runLCGDiagnostics(12345, 1000);
      const result2 = runLCGDiagnostics(12345, 1000);
      
      expect(result1.distribution.mean).toBe(result2.distribution.mean);
      expect(result1.distribution.buckets).toEqual(result2.distribution.buckets);
    });

    it('should produce different results for different seeds', () => {
      const result1 = runLCGDiagnostics(12345, 1000);
      const result2 = runLCGDiagnostics(54321, 1000);
      
      expect(result1.distribution.mean).not.toBe(result2.distribution.mean);
    });
  });

  describe('generateSeedVisualization', () => {
    it('should generate visualization data for a seed', () => {
      const vizData = generateSeedVisualization(12345);
      
      expect(vizData.seed).toBe(12345);
      expect(vizData.normalizedSeed).toBeGreaterThanOrEqual(0);
      expect(vizData.binary).toBeDefined();
      expect(vizData.hex).toBeDefined();
      expect(vizData.qualityScore).toBeGreaterThanOrEqual(0);
      expect(vizData.qualityScore).toBeLessThanOrEqual(100);
      expect(vizData.preview).toHaveLength(20);
      expect(vizData.histogram).toHaveLength(10);
    });

    it('should generate binary representation', () => {
      const vizData = generateSeedVisualization(12345);
      
      expect(vizData.binary).toMatch(/^[01]{32}$/);
      expect(vizData.binary.length).toBe(32);
    });

    it('should generate hexadecimal representation', () => {
      const vizData = generateSeedVisualization(12345);
      
      expect(vizData.hex).toMatch(/^0x[0-9A-F]{8}$/);
    });

    it('should calculate quality score based on distribution', () => {
      const vizData = generateSeedVisualization(12345);
      
      // Quality score should be reasonable for a good seed
      expect(vizData.qualityScore).toBeGreaterThan(50);
    });

    it('should generate preview values in [0, 1) range', () => {
      const vizData = generateSeedVisualization(12345);
      
      vizData.preview.forEach(val => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      });
    });

    it('should generate histogram with reasonable distribution', () => {
      const vizData = generateSeedVisualization(12345);
      
      const totalSamples = vizData.histogram.reduce((sum, count) => sum + count, 0);
      expect(totalSamples).toBe(1000);
      
      // Each bucket should have some samples (not perfect, but reasonable)
      vizData.histogram.forEach(count => {
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  describe('compareSeedSequences', () => {
    it('should compare two different seeds', () => {
      const comparison = compareSeedSequences(12345, 54321, 100);
      
      expect(comparison.seed1).toBe(12345);
      expect(comparison.seed2).toBe(54321);
      expect(comparison.correlation).toBeGreaterThanOrEqual(-1);
      expect(comparison.correlation).toBeLessThanOrEqual(1);
      expect(comparison.maxDifference).toBeGreaterThanOrEqual(0);
      expect(comparison.averageDifference).toBeGreaterThanOrEqual(0);
    });

    it('should find divergence point for different seeds', () => {
      const comparison = compareSeedSequences(12345, 54321, 100);
      
      // Different seeds should diverge immediately
      expect(comparison.divergencePoint).toBe(0);
    });

    it('should show perfect correlation for same seed', () => {
      const comparison = compareSeedSequences(12345, 12345, 100);
      
      expect(comparison.correlation).toBe(1);
      expect(comparison.divergencePoint).toBeNull();
      expect(comparison.maxDifference).toBe(0);
      expect(comparison.averageDifference).toBe(0);
    });

    it('should calculate correlation correctly', () => {
      const comparison = compareSeedSequences(12345, 54321, 1000);
      
      // Different seeds should have low correlation
      expect(Math.abs(comparison.correlation)).toBeLessThan(0.1);
    });
  });

  describe('batchTestSeeds', () => {
    it('should test multiple seeds', () => {
      const seeds = [12345, 54321, 99999];
      const results = batchTestSeeds(seeds, 1000);
      
      expect(results).toHaveLength(3);
      expect(results[0].seed).toBe(12345);
      expect(results[1].seed).toBe(54321);
      expect(results[2].seed).toBe(99999);
    });

    it('should generate consistent results for each seed', () => {
      const seeds = [12345, 12345];
      const results = batchTestSeeds(seeds, 1000);
      
      expect(results[0].distribution.mean).toBe(results[1].distribution.mean);
    });

    it('should handle empty seed array', () => {
      const results = batchTestSeeds([], 1000);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('findOptimalSeed', () => {
    it('should find optimal seed in range', () => {
      const result = findOptimalSeed(10000, 20000, 10);
      
      expect(result.seed).toBeGreaterThanOrEqual(10000);
      expect(result.seed).toBeLessThanOrEqual(20000);
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(100);
      expect(result.diagnostics).toBeDefined();
    });

    it('should return seed with highest quality score', () => {
      const result = findOptimalSeed(10000, 20000, 20);
      
      // Quality score should be reasonably high
      expect(result.qualityScore).toBeGreaterThan(50);
    });

    it('should test specified number of seeds', () => {
      const result = findOptimalSeed(10000, 20000, 5);
      
      // Should complete without error
      expect(result.seed).toBeDefined();
      expect(result.diagnostics.sampleCount).toBe(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative seeds', () => {
      const result = runLCGDiagnostics(-12345, 100);
      
      expect(result.normalizedSeed).toBeGreaterThanOrEqual(0);
      expect(result.reproducibility.isReproducible).toBe(true);
    });

    it('should handle very large seeds', () => {
      const largeSeed = 4294967295; // Max 32-bit unsigned
      const result = runLCGDiagnostics(largeSeed, 100);
      
      expect(result.normalizedSeed).toBeGreaterThanOrEqual(0);
      expect(result.reproducibility.isReproducible).toBe(true);
    });

    it('should handle zero seed', () => {
      const result = runLCGDiagnostics(0, 100);
      
      expect(result.normalizedSeed).toBe(0);
      expect(result.reproducibility.isReproducible).toBe(true);
    });

    it('should handle small sample counts', () => {
      const result = runLCGDiagnostics(12345, 10);
      
      expect(result.sampleCount).toBe(10);
      expect(result.distribution.buckets).toHaveLength(10);
    });

    it('should handle large sample counts efficiently', () => {
      const startTime = performance.now();
      const result = runLCGDiagnostics(12345, 100000);
      const duration = performance.now() - startTime;
      
      expect(result.sampleCount).toBe(100000);
      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Determinism Verification', () => {
    it('should produce identical results across multiple runs', () => {
      const results = Array.from({ length: 5 }, () => runLCGDiagnostics(12345, 1000));
      
      const firstMean = results[0].distribution.mean;
      results.forEach(result => {
        expect(result.distribution.mean).toBe(firstMean);
      });
    });

    it('should maintain sequence order deterministically', () => {
      const viz1 = generateSeedVisualization(12345);
      const viz2 = generateSeedVisualization(12345);
      
      expect(viz1.preview).toEqual(viz2.preview);
    });
  });

  describe('Statistical Properties', () => {
    it('should produce uniform distribution for good seeds', () => {
      const result = runLCGDiagnostics(12345, 10000);
      
      // Chi-squared test should pass for uniform distribution
      expect(result.chiSquared.isUniform).toBe(true);
    });

    it('should have standard deviation close to theoretical value', () => {
      const result = runLCGDiagnostics(12345, 10000);
      
      // For uniform [0,1), theoretical std dev = 1/sqrt(12) ≈ 0.2887
      expect(result.distribution.stdDev).toBeGreaterThan(0.25);
      expect(result.distribution.stdDev).toBeLessThan(0.35);
    });

    it('should distribute samples evenly across buckets', () => {
      const result = runLCGDiagnostics(12345, 10000);
      
      const expectedPerBucket = 1000;
      result.distribution.buckets.forEach(count => {
        // Each bucket should be within 20% of expected
        expect(count).toBeGreaterThan(expectedPerBucket * 0.8);
        expect(count).toBeLessThan(expectedPerBucket * 1.2);
      });
    });
  });
});
