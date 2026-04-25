/**
 * Unit tests for Marginal Utility Calculator
 * 
 * Tests the core marginal utility analysis engine including:
 * - Configuration validation
 * - Simulation batch execution
 * - Stat metrics calculation
 * - Synergy analysis
 * - Export functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarginalUtilityCalculator, runMarginalUtilityAnalysis } from '../../../src/balancing/stressTesting/MarginalUtilityCalculator';
import type { StressTestArchetype } from '../../../src/balancing/stressTesting/types';
import type { MarginalUtilityConfig } from '../../../src/balancing/config/stressTesting/marginalUtilityConfig';

// Mock PersistenceService
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn().mockResolvedValue(undefined),
}));

describe('MarginalUtilityCalculator', () => {
  let calculator: MarginalUtilityCalculator;
  let mockArchetypes: StressTestArchetype[];
  let mockBaseline: StressTestArchetype;

  beforeEach(() => {
    calculator = new MarginalUtilityCalculator();
    
    // Create mock archetypes for testing
    mockBaseline = {
      id: 'baseline',
      name: 'Baseline',
      description: 'Baseline archetype',
      stats: { hp: 100, damage: 10, speed: 5 },
      testedStats: [],
      pointsPerStat: 0,
      seed: 12345,
      type: 'baseline',
    };

    mockArchetypes = [
      {
        id: 'single_hp',
        name: 'HP +25',
        description: 'Single stat archetype with hp boosted',
        stats: { hp: 125, damage: 10, speed: 5 },
        testedStats: ['hp'],
        pointsPerStat: 25,
        seed: 12345,
        type: 'single',
      },
      {
        id: 'single_damage',
        name: 'Damage +25',
        description: 'Single stat archetype with damage boosted',
        stats: { hp: 100, damage: 35, speed: 5 },
        testedStats: ['damage'],
        pointsPerStat: 25,
        seed: 12345,
        type: 'single',
      },
      {
        id: 'pair_hp_damage',
        name: 'HP +25 & Damage +25',
        description: 'Pair stat archetype with hp and damage boosted',
        stats: { hp: 125, damage: 35, speed: 5 },
        testedStats: ['hp', 'damage'],
        pointsPerStat: 25,
        seed: 12345,
        type: 'pair',
      },
    ];
  });

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      const calc = new MarginalUtilityCalculator();
      expect(calc).toBeInstanceOf(MarginalUtilityCalculator);
    });

    it('should merge custom config with defaults', () => {
      const customConfig: Partial<MarginalUtilityConfig> = {
        simulation: {
          simulationCount: 5000,
          concurrencyLimit: 2,
          seed: 99999,
        },
      };
      
      const calc = new MarginalUtilityCalculator(customConfig);
      expect(calc).toBeInstanceOf(MarginalUtilityCalculator);
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

  describe('runAnalysis', () => {
    it('should run complete analysis', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('config');
      expect(result).toHaveProperty('statMetrics');
      expect(result).toHaveProperty('synergyAnalyses');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('timestamp');
      
      expect(result.statMetrics).toHaveLength(2); // hp and damage
      expect(result.synergyAnalyses).toHaveLength(1); // hp + damage pair
    });

    it('should calculate correct summary statistics', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      expect(result.summary.totalSimulations).toBe(10000); // 1 pair * 10000 simulations
      expect(result.summary.totalRuntimeMs).toBeGreaterThan(0);
      expect(result.summary.avgSimulationsPerSecond).toBeGreaterThan(0);
    });

    it('should handle empty archetypes gracefully', async () => {
      const result = await calculator.runAnalysis([], mockBaseline);
      
      expect(result.statMetrics).toHaveLength(0);
      expect(result.synergyAnalyses).toHaveLength(0);
      expect(result.summary.totalSimulations).toBe(0);
    });
  });

  describe('Stat Metrics Calculation', () => {
    it('should calculate win rates correctly', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      const hpMetric = result.statMetrics.find((m: { statId: string }) => m.statId === 'hp');
      const damageMetric = result.statMetrics.find((m: { statId: string }) => m.statId === 'damage');
      
      expect(hpMetric).toBeDefined();
      expect(damageMetric).toBeDefined();
      
      expect(hpMetric!.avgWinRate).toBeGreaterThanOrEqual(0);
      expect(hpMetric!.avgWinRate).toBeLessThanOrEqual(1);
      expect(damageMetric!.avgWinRate).toBeGreaterThanOrEqual(0);
      expect(damageMetric!.avgWinRate).toBeLessThanOrEqual(1);
    });

    it('should calculate standard deviation', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      const hpMetric = result.statMetrics.find((m: { statId: string }) => m.statId === 'hp');
      expect(hpMetric!.stdDeviation).toBeGreaterThanOrEqual(0);
    });

    it('should identify best and worst matchups', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      const hpMetric = result.statMetrics.find((m: { statId: string }) => m.statId === 'hp');
      expect(hpMetric!.bestMatchup.opponentStat).toBe('damage');
      expect(hpMetric!.worstMatchup.opponentStat).toBe('damage');
    });

    it('should calculate confidence intervals', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      const hpMetric = result.statMetrics.find((m: { statId: string }) => m.statId === 'hp');
      expect(hpMetric!.confidenceInterval.lower).toBeGreaterThanOrEqual(0);
      expect(hpMetric!.confidenceInterval.upper).toBeLessThanOrEqual(1);
      expect(hpMetric!.confidenceInterval.lower).toBeLessThanOrEqual(hpMetric!.confidenceInterval.upper);
    });

    it('should rank stats correctly', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      const rankings = result.statMetrics.map((m: { ranking: number }) => m.ranking);
      expect(rankings).toContain(1);
      expect(rankings).toContain(2);
      expect(new Set(rankings).size).toBe(2); // All rankings should be unique
    });
  });

  describe('Synergy Analysis', () => {
    it('should calculate synergy multipliers', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      const synergy = result.synergyAnalyses[0];
      expect(synergy.statIds).toEqual(['hp', 'damage']);
      expect(synergy.observedWinRate).toBeGreaterThanOrEqual(0);
      expect(synergy.observedWinRate).toBeLessThanOrEqual(1);
      expect(synergy.expectedWinRate).toBeGreaterThanOrEqual(0);
      expect(synergy.expectedWinRate).toBeLessThanOrEqual(1);
      expect(synergy.synergyMultiplier).toBeGreaterThan(0);
    });

    it('should classify synergies correctly', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      const synergy = result.synergyAnalyses[0];
      
      // Test with default thresholds
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

    it('should calculate statistical significance', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      const synergy = result.synergyAnalyses[0];
      expect(synergy.pValue).toBeGreaterThanOrEqual(0);
      expect(synergy.pValue).toBeLessThanOrEqual(1);
      expect(typeof synergy.isSignificant).toBe('boolean');
      expect(synergy.effectSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Export Functionality', () => {
    it('should export to JSON', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      await expect(calculator.exportResults(result, 'json')).resolves.not.toThrow();
    });

    it('should export to CSV', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      await expect(calculator.exportResults(result, 'csv')).resolves.not.toThrow();
    });

    it('should export to Markdown', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      await expect(calculator.exportResults(result, 'markdown')).resolves.not.toThrow();
    });

    it('should throw error for unsupported format', async () => {
      const result = await calculator.runAnalysis(mockArchetypes, mockBaseline);
      
      await expect(calculator.exportResults(result, 'xml' as 'json' | 'csv' | 'markdown')).rejects.toThrow('Unsupported export format');
    });
  });

  describe('Configuration', () => {
    it('should use custom simulation count', async () => {
      const customConfig: Partial<MarginalUtilityConfig> = {
        simulation: {
          simulationCount: 1000,
          concurrencyLimit: 2,
          seed: 12345,
        },
      };
      
      const customCalc = new MarginalUtilityCalculator(customConfig);
      const result = await customCalc.runAnalysis(mockArchetypes, mockBaseline);
      
      expect(result.config.simulationCount).toBe(1000);
    });

    it('should use custom thresholds', async () => {
      const customConfig: Partial<MarginalUtilityConfig> = {
        thresholds: {
          opThreshold: 1.2,
          weakThreshold: 0.9,
        },
      };
      
      const customCalc = new MarginalUtilityCalculator(customConfig);
      const result = await customCalc.runAnalysis(mockArchetypes, mockBaseline);
      
      expect(result.config.thresholds.opThreshold).toBe(1.2);
      expect(result.config.thresholds.weakThreshold).toBe(0.9);
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce same results with same seed', async () => {
      const config: Partial<MarginalUtilityConfig> = {
        simulation: { seed: 12345, simulationCount: 100, concurrencyLimit: 2 },
      };
      
      const calc1 = new MarginalUtilityCalculator(config);
      const calc2 = new MarginalUtilityCalculator(config);
      
      const result1 = await calc1.runAnalysis(mockArchetypes, mockBaseline);
      const result2 = await calc2.runAnalysis(mockArchetypes, mockBaseline);
      
      expect(result1.statMetrics).toHaveLength(result2.statMetrics.length);
      expect(result1.synergyAnalyses).toHaveLength(result2.synergyAnalyses.length);
      
      // Results should be identical (within floating point precision)
      for (let i = 0; i < result1.statMetrics.length; i++) {
        expect(result1.statMetrics[i].avgWinRate).toBeCloseTo(result2.statMetrics[i].avgWinRate, 6);
      }
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
      
      const result = await calculator.runAnalysis(malformedArchetypes, mockBaseline);
      
      // Should not crash, but may produce empty results
      expect(result).toBeDefined();
    });
  });
});

describe('runMarginalUtilityAnalysis convenience function', () => {
  it('should run analysis with default config', async () => {
    const mockArchetypes: StressTestArchetype[] = [
      {
        id: 'single_hp',
        name: 'HP +25',
        description: 'Single stat archetype',
        stats: { hp: 125, damage: 10, speed: 5 },
        testedStats: ['hp'],
        pointsPerStat: 25,
        seed: 12345,
        type: 'single',
      },
    ];
    
    const mockBaseline: StressTestArchetype = {
      id: 'baseline',
      name: 'Baseline',
      description: 'Baseline archetype',
      stats: { hp: 100, damage: 10, speed: 5 },
      testedStats: [],
      pointsPerStat: 0,
      seed: 12345,
      type: 'baseline',
    };
    
    const result = await runMarginalUtilityAnalysis(mockArchetypes, mockBaseline);
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('statMetrics');
    expect(result).toHaveProperty('synergyAnalyses');
    expect(result).toHaveProperty('summary');
  });

  it('should accept custom config', async () => {
    const mockArchetypes: StressTestArchetype[] = [];
    const mockBaseline: StressTestArchetype = {
      id: 'baseline',
      name: 'Baseline',
      description: 'Baseline archetype',
      stats: { hp: 100, damage: 10, speed: 5 },
      testedStats: [],
      pointsPerStat: 0,
      seed: 12345,
      type: 'baseline',
    };
    
    const customConfig: Partial<MarginalUtilityConfig> = {
      simulation: { simulationCount: 500, concurrencyLimit: 1, seed: 999 },
    };
    
    const result = await runMarginalUtilityAnalysis(mockArchetypes, mockBaseline, customConfig);
    
    expect(result.config.simulationCount).toBe(500);
    expect(result.config.seed).toBe(999);
  });
});
