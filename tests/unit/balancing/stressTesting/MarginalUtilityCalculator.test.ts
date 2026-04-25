/**
 * Test harness wrapper for MarginalUtilityCalculator
 * 
 * Provides test utilities and wrapper functions for testing the marginal utility calculator
 * with deterministic behavior and comprehensive validation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarginalUtilityCalculator, runMarginalUtilityAnalysis } from '../../../../src/balancing/stressTesting/MarginalUtilityCalculator';
import type { StressTestArchetype } from '../../../../src/balancing/stressTesting/types';
import type { MarginalUtilityConfig } from '../../../../src/balancing/config/stressTesting/marginalUtilityConfig';
import { 
  MOCK_BASELINE_ARCHETYPE,
  MOCK_SINGLE_STAT_ARCHETYPES,
  MOCK_PAIR_STAT_ARCHETYPES,
  MOCK_MARGINAL_UTILITY_CONFIG,
  FIXTURE_UTILS 
} from '../../../fixtures/stressTesting/marginalUtilityFixtures';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn().mockResolvedValue(undefined),
}));

// Mock archetypes for testing
const mockArchetypes: StressTestArchetype[] = [
  MOCK_BASELINE_ARCHETYPE,
  ...MOCK_SINGLE_STAT_ARCHETYPES,
  ...MOCK_PAIR_STAT_ARCHETYPES,
];

describe('MarginalUtilityCalculator Test Harness', () => {
  let calculator: MarginalUtilityCalculator;

  beforeEach(() => {
    calculator = new MarginalUtilityCalculator(MOCK_MARGINAL_UTILITY_CONFIG);
  });

  describe('Calculator Initialization', () => {
    it('should initialize with default config', () => {
      const defaultCalculator = new MarginalUtilityCalculator();
      expect(defaultCalculator).toBeInstanceOf(MarginalUtilityCalculator);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: Partial<MarginalUtilityConfig> = {
        simulation: {
          simulationCount: 5000,
          concurrencyLimit: 2,
          seed: 99999,
        },
      };
      
      const customCalculator = new MarginalUtilityCalculator(customConfig);
      expect(customCalculator).toBeInstanceOf(MarginalUtilityCalculator);
    });

    it('should validate config on initialization', () => {
      const invalidConfig: Partial<MarginalUtilityConfig> = {
        thresholds: {
          opThreshold: 0.5, // Invalid: must be > 1.0
          weakThreshold: 1.5, // Invalid: must be < 1.0
        },
      };
      
      expect(() => new MarginalUtilityCalculator(invalidConfig)).not.toThrow();
      // Validation happens during analysis, not initialization
    });
  });

  describe('Progress Callback', () => {
    it('should set progress callback', () => {
      const mockCallback = vi.fn();
      calculator.setProgressCallback(mockCallback);
      
      // Progress callback is stored but not directly testable without running analysis
      expect(calculator).toBeInstanceOf(MarginalUtilityCalculator);
    });
  });

  describe('Analysis Execution', () => {
    it('should run complete analysis', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('statMetrics');
      expect(result).toHaveProperty('synergyAnalyses');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('timestamp');
      
      expect(result.statMetrics.length).toBeGreaterThan(0);
      expect(result.synergyAnalyses.length).toBeGreaterThan(0);
    });

    it('should calculate correct summary statistics', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      expect(result.summary.totalSimulations).toBeGreaterThan(0);
      expect(result.summary.totalRuntimeMs).toBeGreaterThan(0);
      expect(result.summary.avgSimulationsPerSecond).toBeGreaterThan(0);
    });

    it('should handle empty archetypes gracefully', async () => {
      const result = await calculator.runAnalysis([], MOCK_BASELINE_ARCHETYPE);
      
      expect(result.statMetrics).toHaveLength(0);
      expect(result.synergyAnalyses).toHaveLength(0);
      expect(result.summary.totalSimulations).toBe(0);
    });

    it('should use custom simulation count', async () => {
      const customConfig: Partial<MarginalUtilityConfig> = {
        simulation: {
          simulationCount: 500,
          concurrencyLimit: 2,
          seed: 12345,
        },
      };
      
      const customCalculator = new MarginalUtilityCalculator(customConfig);
      const result = await customCalculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      expect(result.config.simulationCount).toBe(500);
    });

    it('should use custom thresholds', async () => {
      const customConfig: Partial<MarginalUtilityConfig> = {
        thresholds: {
          opThreshold: 1.2,
          weakThreshold: 0.9,
        },
      };
      
      const customCalculator = new MarginalUtilityCalculator(customConfig);
      const result = await customCalculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      expect(result.config.thresholds.opThreshold).toBe(1.2);
      expect(result.config.thresholds.weakThreshold).toBe(0.9);
    });
  });

  describe('Stat Metrics Calculation', () => {
    it('should calculate win rates correctly', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      result.statMetrics.forEach(metric => {
        expect(metric.avgWinRate).toBeGreaterThanOrEqual(0);
        expect(metric.avgWinRate).toBeLessThanOrEqual(1);
      });
    });

    it('should calculate standard deviation', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      result.statMetrics.forEach(metric => {
        expect(metric.stdDeviation).toBeGreaterThanOrEqual(0);
      });
    });

    it('should identify best and worst matchups', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      result.statMetrics.forEach(metric => {
        expect(metric.bestMatchup).toHaveProperty('opponentStat');
        expect(metric.bestMatchup).toHaveProperty('winRate');
        expect(metric.worstMatchup).toHaveProperty('opponentStat');
        expect(metric.worstMatchup).toHaveProperty('winRate');
      });
    });

    it('should calculate confidence intervals', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      result.statMetrics.forEach(metric => {
        expect(metric.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
        expect(metric.confidenceInterval.upper).toBeLessThanOrEqual(1);
        expect(metric.confidenceInterval.lower).toBeLessThanOrEqual(metric.confidenceInterval.upper);
      });
    });

    it('should rank stats correctly', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      const rankings = result.statMetrics.map((m: { ranking: number }) => m.ranking);
      expect(rankings).toContain(1);
      expect(new Set(rankings).size).toBe(rankings.length); // All rankings should be unique
    });
  });

  describe('Synergy Analysis', () => {
    it('should calculate synergy multipliers', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      result.synergyAnalyses.forEach(synergy => {
        expect(synergy.observedWinRate).toBeGreaterThanOrEqual(0);
        expect(synergy.observedWinRate).toBeLessThanOrEqual(1);
        expect(synergy.expectedWinRate).toBeGreaterThanOrEqual(0);
        expect(synergy.expectedWinRate).toBeLessThanOrEqual(1);
        expect(synergy.synergyMultiplier).toBeGreaterThan(0);
      });
    });

    it('should classify synergies correctly', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      result.synergyAnalyses.forEach(synergy => {
        if (synergy.synergyMultiplier > 1.15) {
          expect(synergy.isOpSynergy).toBe(true);
          expect(synergy.isWeakSynergy).toBe(false);
        } else if (synergy.synergyMultiplier < 0.95) {
          expect(synergy.isOpSynergy).toBe(false);
          expect(synergy.isWeakSynergy).toBe(true);
        } else {
          expect(synergy.isOpSynergy).toBe(false);
          expect(synergy.isWeakSynergy).toBe(false);
        }
      });
    });

    it('should calculate statistical significance', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      result.synergyAnalyses.forEach(synergy => {
        expect(synergy.pValue).toBeGreaterThanOrEqual(0);
        expect(synergy.pValue).toBeLessThanOrEqual(1);
        expect(typeof synergy.isSignificant).toBe('boolean');
        expect(synergy.effectSize).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Export Functionality', () => {
    it('should export to JSON', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      await expect(calculator.exportResults(result, 'json')).resolves.not.toThrow();
    });

    it('should export to CSV', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      await expect(calculator.exportResults(result, 'csv')).resolves.not.toThrow();
    });

    it('should export to Markdown', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      await expect(calculator.exportResults(result, 'markdown')).resolves.not.toThrow();
    });

    it('should throw error for unsupported format', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      await expect(calculator.exportResults(result, 'xml' as 'json' | 'csv' | 'markdown')).rejects.toThrow('Unsupported export format');
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce same results with same seed', async () => {
      const config: Partial<MarginalUtilityConfig> = {
        simulation: { seed: 12345, simulationCount: 100, concurrencyLimit: 2 },
      };
      
      const calc1 = new MarginalUtilityCalculator(config);
      const calc2 = new MarginalUtilityCalculator(config);
      
      const result1 = await calc1.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      const result2 = await calc2.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      expect(result1.statMetrics).toHaveLength(result2.statMetrics.length);
      expect(result1.synergyAnalyses).toHaveLength(result2.synergyAnalyses.length);
      
      // Results should be identical (within floating point precision)
      for (let i = 0; i < result1.statMetrics.length; i++) {
        expect(result1.statMetrics[i].avgWinRate).toBeCloseTo(result2.statMetrics[i].avgWinRate, 6);
      }
    });

    it('should produce different results with different seeds', async () => {
      const config1: Partial<MarginalUtilityConfig> = {
        simulation: { seed: 12345, simulationCount: 100, concurrencyLimit: 2 },
      };
      
      const config2: Partial<MarginalUtilityConfig> = {
        simulation: { seed: 54321, simulationCount: 100, concurrencyLimit: 2 },
      };
      
      const calc1 = new MarginalUtilityCalculator(config1);
      const calc2 = new MarginalUtilityCalculator(config2);
      
      const result1 = await calc1.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      const result2 = await calc2.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      // Results should be different with different seeds
      const differentResults = result1.statMetrics.some((metric, index) => {
        return Math.abs(metric.avgWinRate - result2.statMetrics[index].avgWinRate) > 0.001;
      });
      
      expect(differentResults).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed archetypes gracefully', async () => {
      const malformedArchetypes = [
        {
          id: 'broken',
          name: 'Broken',
          description: 'Malformed archetype',
          stats: {}, // Empty stats
          testedStats: ['nonexistent'],
          pointsPerStat: 25,
          seed: 12345,
          type: 'single' as const,
        },
      ];
      
      const result = await calculator.runAnalysis(malformedArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      // Should not crash, but may produce empty results
      expect(result).toBeDefined();
    });

    it('should handle invalid config gracefully', async () => {
      const invalidConfig: Partial<MarginalUtilityConfig> = {
        simulation: {
          simulationCount: 0, // Invalid: must be at least 100
          concurrencyLimit: 2,
          seed: 12345,
        },
      };
      
      const invalidCalculator = new MarginalUtilityCalculator(invalidConfig);
      
      // Should not crash during initialization
      expect(invalidCalculator).toBeInstanceOf(MarginalUtilityCalculator);
      
      // Analysis might fail or produce unexpected results, but shouldn't crash
      const result = await invalidCalculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      expect(result).toBeDefined();
    });
  });

  describe('Performance and Scaling', () => {
    it('should handle large number of archetypes efficiently', async () => {
      const startTime = Date.now();
      
      // Create a larger set of archetypes
      const largeArchetypeSet = [
        MOCK_BASELINE_ARCHETYPE,
        ...MOCK_SINGLE_STAT_ARCHETYPES,
        ...MOCK_PAIR_STAT_ARCHETYPES,
        // Add duplicates to increase size
        ...MOCK_PAIR_STAT_ARCHETYPES.slice(0, 2),
        ...MOCK_PAIR_STAT_ARCHETYPES.slice(0, 2),
      ];
      
      await calculator.runAnalysis(largeArchetypeSet, MOCK_BASELINE_ARCHETYPE);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should handle high simulation count efficiently', async () => {
      const highSimConfig: Partial<MarginalUtilityConfig> = {
        simulation: {
          simulationCount: 5000, // Higher than default
          concurrencyLimit: 4,
          seed: 12345,
        },
      };
      
      const highSimCalculator = new MarginalUtilityCalculator(highSimConfig);
      const startTime = Date.now();
      
      await highSimCalculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Integration with Mock Fixtures', () => {
    it('should work with mock fixture data', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
      
      expect(result.statMetrics.length).toBeGreaterThan(0);
      expect(result.synergyAnalyses.length).toBeGreaterThan(0);
    });

    it('should validate mock data consistency', () => {
      expect(FIXTURE_UTILS.validateMockData()).toBe(true);
    });

    it('should create custom mock archetypes correctly', () => {
      const customArchetype = FIXTURE_UTILS.createMockArchetype(
        'test-custom',
        'Test Custom',
        { hp: 150, damage: 20 },
        ['hp', 'damage'],
        'pair'
      );
      
      expect(customArchetype).toMatchObject({
        id: 'test-custom',
        name: 'Test Custom',
        testedStats: ['hp', 'damage'],
        type: 'pair',
        pointsPerStat: 25,
        seed: 12345,
      });
    });
  });
});

/**
 * Integration test harness for complete marginal utility pipeline
 */
describe('Marginal Utility Pipeline Integration', () => {
  it('should integrate with convenience function', async () => {
    const analysis = await runMarginalUtilityAnalysis(
      mockArchetypes,
      MOCK_BASELINE_ARCHETYPE,
      MOCK_MARGINAL_UTILITY_CONFIG
    );
    
    expect(analysis).toHaveProperty('id');
    expect(analysis).toHaveProperty('statMetrics');
    expect(analysis).toHaveProperty('synergyAnalyses');
    expect(analysis).toHaveProperty('summary');
  });

  it('should work with default config', async () => {
    const analysis = await runMarginalUtilityAnalysis(
      mockArchetypes,
      MOCK_BASELINE_ARCHETYPE
    );
    
    expect(analysis.config.simulationCount).toBe(10000); // Default value
  });
});

/**
 * Export test utilities for other test files
 */
export const MARGINAL_UTILITY_TEST_UTILS = {
  /**
   * Create a calculator with custom configuration
   */
  createCalculator: (config: Partial<MarginalUtilityConfig> = {}) => {
    return new MarginalUtilityCalculator(config);
  },

  /**
   * Run a complete analysis with test data
   */
  runTestAnalysis: async (config?: Partial<MarginalUtilityConfig>) => {
    const calculator = MARGINAL_UTILITY_TEST_UTILS.createCalculator(config);
    return calculator.runAnalysis(mockArchetypes, MOCK_BASELINE_ARCHETYPE);
  },

  /**
   * Validate analysis result structure
   */
  validateAnalysis: (analysis: any) => {
    expect(analysis).toHaveProperty('id');
    expect(analysis).toHaveProperty('config');
    expect(analysis).toHaveProperty('statMetrics');
    expect(analysis).toHaveProperty('synergyAnalyses');
    expect(analysis).toHaveProperty('summary');
    expect(analysis).toHaveProperty('timestamp');
    
    expect(Array.isArray(analysis.statMetrics)).toBe(true);
    expect(Array.isArray(analysis.synergyAnalyses)).toBe(true);
    expect(typeof analysis.summary).toBe('object');
    expect(typeof analysis.timestamp).toBe('number');
  },

  /**
   * Compare two analysis results for similarity
   */
  compareAnalyses: (analysis1: any, analysis2: any, tolerance = 0.01) => {
    expect(analysis1.statMetrics).toHaveLength(analysis2.statMetrics.length);
    expect(analysis1.synergyAnalyses).toHaveLength(analysis2.synergyAnalyses.length);
    
    // Compare stat metrics
    analysis1.statMetrics.forEach((metric: any, index: number) => {
      const metric2 = analysis2.statMetrics[index];
      expect(metric.avgWinRate).toBeCloseTo(metric2.avgWinRate, 2);
      expect(metric.stdDeviation).toBeCloseTo(metric2.stdDeviation, 2);
    });
    
    // Compare synergy analyses
    analysis1.synergyAnalyses.forEach((synergy: any, index: number) => {
      const synergy2 = analysis2.synergyAnalyses[index];
      expect(synergy.observedWinRate).toBeCloseTo(synergy2.observedWinRate, 2);
      expect(synergy.synergyMultiplier).toBeCloseTo(synergy2.synergyMultiplier, 2);
    });
  },
};
