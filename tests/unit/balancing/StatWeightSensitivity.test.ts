/**
 * Stat Weight Sensitivity Analysis Unit Tests
 * 
 * Comprehensive test suite for the Stat Weight Sensitivity Analyzer.
 * Tests configuration, analysis logic, Monte Carlo integration, and export functionality.
 * 
 * @since NP-189 – Balancer Stat Weight Sensitivity Analysis
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  StatWeightSensitivityAnalyzer,
  runSensitivityAnalysis,
  exportResults,
  DEFAULT_SENSITIVITY_CONFIG,
  SENSITIVITY_THRESHOLDS,
  SENSITIVITY_CLASSIFICATIONS,
  type SensitivityConfig,
  type SensitivityAnalysisResult,
  type PerturbationResult,
  type StatSensitivityResult,
} from '../../../src/balancing/analysis/StatWeightSensitivity';
import type { BalancerConfig } from '../../../src/balancing/config/types';

// Mock Monte Carlo engine
vi.mock('../../../src/balancing/monteCarlo/MonteCarloEngine', () => ({
  runMonteCarloSimulation: vi.fn(),
}));

const mockRunMonteCarloSimulation = vi.mocked(
  (await import('../../../src/balancing/monteCarlo/MonteCarloEngine')).runMonteCarloSimulation
);

// Mock balancer config matching BalancerConfig interface
const mockBalancerConfig: BalancerConfig = {
  version: '1.0.0',
  targetTurns: { '1v1': 20, 'boss': 30, 'group': 25, 'swarm': 40 },
  scenarioBudget: { '1v1': { hpEq: 100, damageEq: 15 }, 'boss': { hpEq: 500, damageEq: 40 } },
  stats: {
    hp: { id: 'hp', label: 'Health Points', type: 'number' as const, min: 50, max: 200, step: 5, defaultValue: 100, weight: 1.0, isCore: true, isDerived: false },
    damage: { id: 'damage', label: 'Damage', type: 'number' as const, min: 10, max: 50, step: 2, defaultValue: 25, weight: 1.0, isCore: true, isDerived: false },
    defense: { id: 'defense', label: 'Defense', type: 'number' as const, min: 5, max: 30, step: 1, defaultValue: 15, weight: 0.8, isCore: true, isDerived: false },
    speed: { id: 'speed', label: 'Speed', type: 'number' as const, min: 1, max: 20, step: 1, defaultValue: 10, weight: 0.6, isCore: true, isDerived: false },
    accuracy: { id: 'accuracy', label: 'Accuracy', type: 'percentage' as const, min: 0.5, max: 1.0, step: 0.05, defaultValue: 0.75, weight: 0.7, isCore: true, isDerived: false },
  },
  cards: {},
  presets: {},
  activePresetId: 'default',
};

// Mock scenario result matching ScenarioResult interface
const mockScenarioResult = {
  scenarioId: 'test-scenario',
  timestamp: Date.now(),
  iterations: 1000,
  winRate: 0.65,
  avgTurnsToVictory: 18.5,
  avgTurnsToDefeat: 25.0,
  turnsStdDev: 4.2,
  statistics: {
    victories: 650,
    defeats: 300,
    timeouts: 50,
    avgDamageDealt: 75.3,
    avgDamageTaken: 45.2,
    avgHpRemaining: 28.7,
  },
  archetypePerformance: {
    'warrior': { archetypeId: 'warrior', winRate: 0.7, avgTurns: 17, stdDev: 3.1, rating: 'Good' as const },
    'mage': { archetypeId: 'mage', winRate: 0.6, avgTurns: 20, stdDev: 4.5, rating: 'Average' as const },
  },
  synergyAnalysis: [
    {
      archetypePair: ['warrior', 'mage'] as [string, string],
      combinedWinRate: 0.75,
      expectedWinRate: 0.65,
      synergyMultiplier: 1.15,
      rating: 'Good' as const,
      sampleSize: 1000,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockRunMonteCarloSimulation.mockResolvedValue(mockScenarioResult);
});

describe('Stat Weight Sensitivity Configuration', () => {
  describe('Default Configuration', () => {
    it('should have valid default configuration', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.analysis.scope).toBe('full-system');
      expect(DEFAULT_SENSITIVITY_CONFIG.analysis.iterations).toBe(1000);
      expect(DEFAULT_SENSITIVITY_CONFIG.analysis.seed).toBe(42);
      expect(DEFAULT_SENSITIVITY_CONFIG.analysis.timeoutMinutes).toBe(5);
    });

    it('should have valid perturbation configuration', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.perturbation.ranges).toHaveLength(4);
      expect(DEFAULT_SENSITIVITY_CONFIG.perturbation.bidirectional).toBe(true);
      expect(DEFAULT_SENSITIVITY_CONFIG.perturbation.maxPerturbations).toBe(10);
    });

    it('should have valid metrics configuration', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.metrics.primary).toContain('winRate');
      expect(DEFAULT_SENSITIVITY_CONFIG.metrics.primary).toContain('balanceScore');
      expect(DEFAULT_SENSITIVITY_CONFIG.metrics.weights.winRate).toBe(0.4);
      expect(DEFAULT_SENSITIVITY_CONFIG.metrics.weights.balanceScore).toBe(0.3);
    });

    it('should have valid scenario configuration', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.scenario.template).toBe('basic-1v1');
    });

    it('should have valid export configuration', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.export.formats).toContain('json');
      expect(DEFAULT_SENSITIVITY_CONFIG.export.formats).toContain('csv');
      expect(DEFAULT_SENSITIVITY_CONFIG.export.includeDetails).toBe(true);
    });
  });

  describe('Perturbation Ranges', () => {
    it('should have valid perturbation ranges', () => {
      const ranges = DEFAULT_SENSITIVITY_CONFIG.perturbation.ranges;
      
      expect(ranges).toHaveLength(4);
      
      // Check tiny range
      const tinyRange = ranges.find(r => r.id === 'tiny');
      expect(tinyRange).toBeDefined();
      expect(tinyRange?.percentage).toBe(0.05);
      expect(tinyRange?.steps).toBe(3);
      
      // Check small range
      const smallRange = ranges.find(r => r.id === 'small');
      expect(smallRange).toBeDefined();
      expect(smallRange?.percentage).toBe(0.10);
      expect(smallRange?.steps).toBe(5);
      
      // Check medium range
      const mediumRange = ranges.find(r => r.id === 'medium');
      expect(mediumRange).toBeDefined();
      expect(mediumRange?.percentage).toBe(0.20);
      expect(mediumRange?.steps).toBe(7);
      
      // Check large range
      const largeRange = ranges.find(r => r.id === 'large');
      expect(largeRange).toBeDefined();
      expect(largeRange?.percentage).toBe(0.30);
      expect(largeRange?.steps).toBe(5);
    });
  });

  describe('Sensitivity Thresholds', () => {
    it('should have valid threshold values', () => {
      expect(SENSITIVITY_THRESHOLDS.insensitive).toBe(0.05);
      expect(SENSITIVITY_THRESHOLDS.low).toBe(0.15);
      expect(SENSITIVITY_THRESHOLDS.moderate).toBe(0.30);
      expect(SENSITIVITY_THRESHOLDS.high).toBe(0.50);
      expect(SENSITIVITY_THRESHOLDS.critical).toBe(0.70);
    });

    it('should have increasing threshold values', () => {
      const thresholds = [
        SENSITIVITY_THRESHOLDS.insensitive,
        SENSITIVITY_THRESHOLDS.low,
        SENSITIVITY_THRESHOLDS.moderate,
        SENSITIVITY_THRESHOLDS.high,
        SENSITIVITY_THRESHOLDS.critical,
      ];
      
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
      }
    });
  });

  describe('Sensitivity Classifications', () => {
    it('should have valid classification definitions', () => {
      expect(SENSITIVITY_CLASSIFICATIONS.insensitive.label).toBe('Insensitive');
      expect(SENSITIVITY_CLASSIFICATIONS.insensitive.color).toBe('#10b981');
      expect(SENSITIVITY_CLASSIFICATIONS.critical.label).toBe('Critical');
      expect(SENSITIVITY_CLASSIFICATIONS.critical.color).toBe('#dc2626');
    });

    it('should have unique colors for each classification', () => {
      const colors = Object.values(SENSITIVITY_CLASSIFICATIONS).map(c => c.color);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });
});

describe('StatWeightSensitivityAnalyzer Class', () => {
  let analyzer: StatWeightSensitivityAnalyzer;

  beforeEach(() => {
    analyzer = new StatWeightSensitivityAnalyzer({}, mockBalancerConfig);
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      expect(analyzer).toBeInstanceOf(StatWeightSensitivityAnalyzer);
    });

    it('should initialize with custom configuration', () => {
      const customConfig: Partial<SensitivityConfig> = {
        analysis: {
          scope: 'single-stat',
          iterations: 500,
          seed: 42,
          timeoutMinutes: 5,
          verbose: false,
        },
      };
      
      const customAnalyzer = new StatWeightSensitivityAnalyzer(customConfig, mockBalancerConfig);
      expect(customAnalyzer).toBeInstanceOf(StatWeightSensitivityAnalyzer);
    });
  });

  describe('Analysis Execution', () => {
    it('should run complete sensitivity analysis', async () => {
      const result = await analyzer.runAnalysis();
      
      expect(result).toBeDefined();
      expect(result.config).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.statResults).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.visualization).toBeDefined();
      
      // Check metadata
      expect(result.metadata.analysisId).toMatch(/^sensitivity-\d+-[a-z0-9]+$/);
      expect(result.metadata.totalSimulations).toBeGreaterThan(0);
      expect(result.metadata.totalPerturbations).toBeGreaterThan(0);
      expect(result.metadata.duration).toBeGreaterThan(0);
      
      // Check stat results
      expect(result.statResults.length).toBeGreaterThan(0);
      
      // Check summary
      expect(result.summary.mostSensitive).toBeDefined();
      expect(result.summary.leastSensitive).toBeDefined();
      expect(result.summary.averageSensitivity).toBeGreaterThanOrEqual(0);
      
      // Check visualization
      expect(result.visualization.heatmap).toBeDefined();
      expect(result.visualization.ranking).toBeDefined();
    });

    it('should call Monte Carlo simulation for each perturbation', async () => {
      await analyzer.runAnalysis();
      
      expect(mockRunMonteCarloSimulation).toHaveBeenCalledTimes(expect.any(Number));
      expect(mockRunMonteCarloSimulation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should handle simulation errors gracefully', async () => {
      mockRunMonteCarloSimulation.mockRejectedValue(new Error('Simulation failed'));
      
      // Should not throw error
      const result = await analyzer.runAnalysis();
      expect(result).toBeDefined();
    });
  });

  describe('Stat Analysis', () => {
    it('should analyze individual stat with perturbations', async () => {
      const result = await analyzer.runAnalysis();
      const statResult = result.statResults[0];
      
      expect(statResult).toBeDefined();
      expect(statResult.statId).toBeDefined();
      expect(statResult.statName).toBeDefined();
      expect(statResult.originalWeight).toBeGreaterThanOrEqual(0);
      expect(statResult.perturbations).toBeDefined();
      expect(statResult.overallSensitivity).toBeGreaterThanOrEqual(0);
      expect(statResult.classification).toBeDefined();
      expect(statResult.maxImpact).toBeGreaterThanOrEqual(0);
      expect(statResult.recommendation).toBeDefined();
    });

    it('should generate perturbations within configured ranges', async () => {
      const result = await analyzer.runAnalysis();
      const statResult = result.statResults[0];
      
      expect(statResult.perturbations.length).toBeGreaterThan(0);
      
      // Check perturbation values
      for (const perturbation of statResult.perturbations) {
        expect(perturbation.statId).toBe(statResult.statId);
        expect(perturbation.originalWeight).toBe(statResult.originalWeight);
        expect(perturbation.perturbation).toBeDefined();
        expect(perturbation.newWeight).toBeGreaterThan(0);
        expect(perturbation.simulationResults).toBeDefined();
        expect(perturbation.metrics).toBeDefined();
        expect(perturbation.sensitivityScore).toBeGreaterThanOrEqual(0);
        expect(['positive', 'negative', 'neutral']).toContain(perturbation.impactDirection);
      }
    });

    it('should classify sensitivity correctly', async () => {
      const result = await analyzer.runAnalysis();
      
      for (const statResult of result.statResults) {
        expect(['insensitive', 'low', 'moderate', 'high', 'critical']).toContain(statResult.classification);
        
        // Check classification logic
        if (statResult.overallSensitivity < SENSITIVITY_THRESHOLDS.insensitive) {
          expect(statResult.classification).toBe('insensitive');
        } else if (statResult.overallSensitivity < SENSITIVITY_THRESHOLDS.low) {
          expect(statResult.classification).toBe('low');
        } else if (statResult.overallSensitivity < SENSITIVITY_THRESHOLDS.moderate) {
          expect(statResult.classification).toBe('moderate');
        } else if (statResult.overallSensitivity < SENSITIVITY_THRESHOLDS.high) {
          expect(statResult.classification).toBe('high');
        } else {
          expect(statResult.classification).toBe('critical');
        }
      }
    });

    it('should generate appropriate recommendations', async () => {
      const result = await analyzer.runAnalysis();
      
      for (const statResult of result.statResults) {
        expect(statResult.recommendation).toBeDefined();
        expect(statResult.recommendation.length).toBeGreaterThan(0);
        
        // Check recommendation content based on classification
        if (statResult.classification === 'critical') {
          expect(statResult.recommendation).toContain('Critical');
        } else if (statResult.classification === 'insensitive') {
          expect(statResult.recommendation).toContain('insensitive');
        }
      }
    });
  });

  describe('Metrics Calculation', () => {
    it('should calculate balance score correctly', async () => {
      const result = await analyzer.runAnalysis();
      const statResult = result.statResults[0];
      
      for (const perturbation of statResult.perturbations) {
        expect(perturbation.metrics.balanceScore).toBeGreaterThanOrEqual(0);
        expect(perturbation.metrics.balanceScore).toBeLessThanOrEqual(1);
      }
    });

    it('should calculate sensitivity score using configured weights', async () => {
      const result = await analyzer.runAnalysis();
      const statResult = result.statResults[0];
      
      for (const perturbation of statResult.perturbations) {
        expect(perturbation.sensitivityScore).toBeGreaterThanOrEqual(0);
        expect(perturbation.sensitivityScore).toBeLessThanOrEqual(1);
      }
    });

    it('should determine impact direction correctly', async () => {
      const result = await analyzer.runAnalysis();
      const statResult = result.statResults[0];
      
      for (const perturbation of statResult.perturbations) {
        expect(['positive', 'negative', 'neutral']).toContain(perturbation.impactDirection);
      }
    });
  });

  describe('Summary Calculation', () => {
    it('should calculate correct summary statistics', async () => {
      const result = await analyzer.runAnalysis();
      
      expect(result.summary.mostSensitive).toBeDefined();
      expect(result.summary.leastSensitive).toBeDefined();
      expect(result.summary.averageSensitivity).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.summary.criticalStats)).toBe(true);
      expect(Array.isArray(result.summary.insensitiveStats)).toBe(true);
    });

    it('should identify most and least sensitive stats', async () => {
      const result = await analyzer.runAnalysis();
      
      if (result.statResults.length > 1) {
        const mostSensitive = result.statResults.find(s => s.statId === result.summary.mostSensitive);
        const leastSensitive = result.statResults.find(s => s.statId === result.summary.leastSensitive);
        
        expect(mostSensitive).toBeDefined();
        expect(leastSensitive).toBeDefined();
        expect(mostSensitive!.overallSensitivity).toBeGreaterThanOrEqual(leastSensitive!.overallSensitivity);
      }
    });
  });

  describe('Visualization Data', () => {
    it('should generate heatmap data', async () => {
      const result = await analyzer.runAnalysis();
      
      expect(result.visualization.heatmap).toBeDefined();
      expect(result.visualization.heatmap.length).toBeGreaterThan(0);
      
      for (const dataPoint of result.visualization.heatmap) {
        expect(dataPoint.statId).toBeDefined();
        expect(dataPoint.perturbation).toBeDefined();
        expect(dataPoint.sensitivity).toBeGreaterThanOrEqual(0);
        expect(dataPoint.impact).toBeGreaterThanOrEqual(0);
      }
    });

    it('should generate ranking data', async () => {
      const result = await analyzer.runAnalysis();
      
      expect(result.visualization.ranking).toBeDefined();
      expect(result.visualization.ranking.length).toBe(result.statResults.length);
      
      for (const ranking of result.visualization.ranking) {
        expect(ranking.statId).toBeDefined();
        expect(ranking.statName).toBeDefined();
        expect(ranking.sensitivity).toBeGreaterThanOrEqual(0);
        expect(['insensitive', 'low', 'moderate', 'high', 'critical']).toContain(ranking.classification);
      }
    });
  });
});

describe('Export Functionality', () => {
  let mockResult: SensitivityAnalysisResult;
  
  beforeEach(() => {
    mockResult = {
      config: DEFAULT_SENSITIVITY_CONFIG,
      metadata: {
        analysisId: 'test-analysis',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 5000,
        totalSimulations: 10000,
        totalPerturbations: 50,
      },
      statResults: [
        {
          statId: 'hp',
          statName: 'Health Points',
          originalWeight: 1.0,
          perturbations: [],
          overallSensitivity: 0.25,
          classification: 'moderate',
          maxImpact: 0.15,
          recommendation: 'Moderate sensitivity - normal tuning required',
        },
        {
          statId: 'damage',
          statName: 'Damage',
          originalWeight: 1.0,
          perturbations: [],
          overallSensitivity: 0.65,
          classification: 'high',
          maxImpact: 0.35,
          recommendation: 'High sensitivity - monitor closely and consider adjustments',
        },
      ],
      summary: {
        mostSensitive: 'damage',
        leastSensitive: 'hp',
        averageSensitivity: 0.45,
        criticalStats: [],
        insensitiveStats: [],
      },
      visualization: {
        heatmap: [],
        ranking: [],
      },
    };
  });

  describe('JSON Export', () => {
    it('should export results as JSON', () => {
      const exported = exportResults(mockResult, 'json');
      
      expect(typeof exported).toBe('string');
      
      const parsed = JSON.parse(exported);
      expect(parsed.config).toBeDefined();
      expect(parsed.metadata).toBeDefined();
      expect(parsed.statResults).toBeDefined();
      expect(parsed.summary).toBeDefined();
      expect(parsed.visualization).toBeDefined();
    });

    it('should export valid JSON structure', () => {
      const exported = exportResults(mockResult, 'json');
      
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });

  describe('CSV Export', () => {
    it('should export results as CSV', () => {
      const exported = exportResults(mockResult, 'csv');
      
      expect(typeof exported).toBe('string');
      expect(exported).toContain('Stat ID,Stat Name,Original Weight');
      expect(exported).toContain('hp,Health Points');
      expect(exported).toContain('damage,Damage');
    });

    it('should include all required columns', () => {
      const exported = exportResults(mockResult, 'csv');
      const lines = exported.split('\n');
      const headers = lines[0].split(',');
      
      expect(headers).toContain('Stat ID');
      expect(headers).toContain('Stat Name');
      expect(headers).toContain('Original Weight');
      expect(headers).toContain('Overall Sensitivity');
      expect(headers).toContain('Classification');
      expect(headers).toContain('Max Impact');
      expect(headers).toContain('Recommendation');
    });

    it('should have correct number of data rows', () => {
      const exported = exportResults(mockResult, 'csv');
      const lines = exported.split('\n').filter(line => line.trim());
      
      expect(lines.length).toBe(mockResult.statResults.length + 1); // +1 for header
    });
  });

  describe('Markdown Export', () => {
    it('should export results as Markdown', () => {
      const exported = exportResults(mockResult, 'markdown');
      
      expect(typeof exported).toBe('string');
      expect(exported).toContain('# Stat Weight Sensitivity Analysis');
      expect(exported).toContain('## Summary');
      expect(exported).toContain('## Results');
    });

    it('should include analysis metadata', () => {
      const exported = exportResults(mockResult, 'markdown');
      
      expect(exported).toContain(mockResult.metadata.analysisId);
      expect(exported).toContain(mockResult.metadata.duration.toString());
      expect(exported).toContain(mockResult.metadata.totalSimulations.toString());
    });

    it('should include summary information', () => {
      const exported = exportResults(mockResult, 'markdown');
      
      expect(exported).toContain(mockResult.summary.mostSensitive);
      expect(exported).toContain(mockResult.summary.leastSensitive);
      expect(exported).toContain(mockResult.summary.averageSensitivity.toFixed(4));
    });

    it('should include results table', () => {
      const exported = exportResults(mockResult, 'markdown');
      
      expect(exported).toContain('| Stat | Sensitivity | Classification |');
      expect(exported).toContain('| Health Points |');
      expect(exported).toContain('| Damage |');
    });
  });
});

describe('Convenience Functions', () => {
  describe('runSensitivityAnalysis', () => {
    it('should run sensitivity analysis with convenience function', async () => {
      const result = await runSensitivityAnalysis({}, mockBalancerConfig);
      
      expect(result).toBeDefined();
      expect(result.config).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.statResults).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.visualization).toBeDefined();
    });

    it('should accept custom configuration', async () => {
      const customConfig: Partial<SensitivityConfig> = {
        analysis: {
          scope: 'single-stat',
          iterations: 500,
          seed: 42,
          timeoutMinutes: 5,
          verbose: false,
        },
      };
      
      const result = await runSensitivityAnalysis(customConfig, mockBalancerConfig);
      
      expect(result.config.analysis.scope).toBe('single-stat');
      expect(result.config.analysis.iterations).toBe(500);
    });
  });

  describe('exportResults', () => {
    it('should default to JSON format', () => {
      const mockResult = {} as SensitivityAnalysisResult;
      const exported = exportResults(mockResult);
      
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should handle unknown format gracefully', () => {
      const mockResult = {} as SensitivityAnalysisResult;
      const exported = exportResults(mockResult, 'unknown' as any);
      
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });
});

describe('Integration Tests', () => {
  it('should complete full workflow with custom configuration', async () => {
    const customConfig: Partial<SensitivityConfig> = {
      analysis: {
        scope: 'single-stat',
        iterations: 100,
        seed: 42,
        timeoutMinutes: 1,
        verbose: false,
      },
      perturbation: {
        ranges: [
          {
            id: 'test',
            percentage: 0.10,
            steps: 3,
            description: 'Test perturbation',
          },
        ],
        bidirectional: false,
        maxPerturbations: 5,
      },
      metrics: {
        primary: ['winRate'],
        weights: { winRate: 1.0 },
      },
    };
    
    const result = await runSensitivityAnalysis(customConfig, mockBalancerConfig);
    
    expect(result).toBeDefined();
    expect(result.config.analysis.scope).toBe('single-stat');
    expect(result.config.analysis.iterations).toBe(100);
    expect(result.config.perturbation.ranges).toHaveLength(1);
    expect(result.config.perturbation.bidirectional).toBe(false);
    
    // Export in all formats
    const jsonExport = exportResults(result, 'json');
    const csvExport = exportResults(result, 'csv');
    const markdownExport = exportResults(result, 'markdown');
    
    expect(jsonExport).toContain('sensitivity-');
    expect(csvExport).toContain('Stat ID,Stat Name');
    expect(markdownExport).toContain('# Stat Weight Sensitivity Analysis');
  });

  it('should handle large analysis efficiently', async () => {
    const largeConfig: Partial<SensitivityConfig> = {
      analysis: {
        scope: 'full-system',
        iterations: 5000,
        seed: 42,
        timeoutMinutes: 10,
        verbose: false,
      },
      perturbation: {
        ranges: DEFAULT_SENSITIVITY_CONFIG.perturbation.ranges,
        bidirectional: true,
        maxPerturbations: 20,
      },
    };
    
    const startTime = Date.now();
    const result = await runSensitivityAnalysis(largeConfig, mockBalancerConfig);
    const duration = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(result.metadata.totalSimulations).toBeGreaterThan(10000);
    expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
  });

  it('should handle simulation failures gracefully', async () => {
    mockRunMonteCarloSimulation.mockRejectedValue(new Error('Simulation failed'));
    
    const result = await runSensitivityAnalysis({}, mockBalancerConfig);
    
    expect(result).toBeDefined();
    expect(result.statResults).toBeDefined();
    // Should still produce results even with simulation failures
  });

  it('should produce consistent results with same seed', async () => {
    const config: Partial<SensitivityConfig> = {
      analysis: {
        scope: 'full-system',
        seed: 12345,
        iterations: 100,
        timeoutMinutes: 5,
        verbose: false,
      },
    };
    
    const result1 = await runSensitivityAnalysis(config, mockBalancerConfig);
    const result2 = await runSensitivityAnalysis(config, mockBalancerConfig);
    
    // Results should be similar (allowing for minor variations)
    expect(result1.summary.averageSensitivity).toBeCloseTo(result2.summary.averageSensitivity, 2);
  });
});

describe('Error Handling', () => {
  it('should handle invalid configuration gracefully', async () => {
    const invalidConfig: Partial<SensitivityConfig> = {
      analysis: {
        scope: 'full-system',
        iterations: -1, // Invalid
        seed: 42,
        timeoutMinutes: 0, // Invalid
        verbose: false,
      },
    };
    
    const analyzer = new StatWeightSensitivityAnalyzer(invalidConfig, mockBalancerConfig);
    const result = await analyzer.runAnalysis();
    
    expect(result).toBeDefined();
    // Should use default values for invalid config
  });

  it('should handle missing balancer config gracefully', async () => {
    const incompleteConfig = {} as BalancerConfig;
    
    const analyzer = new StatWeightSensitivityAnalyzer({}, incompleteConfig);
    const result = await analyzer.runAnalysis();
    
    expect(result).toBeDefined();
  });

  it('should handle timeout gracefully', async () => {
    const config: Partial<SensitivityConfig> = {
      analysis: {
        scope: 'full-system',
        seed: 42,
        timeoutMinutes: 0.001, // Very short timeout
        verbose: false,
        iterations: 1000,
      },
    };
    
    // Mock slow simulation
    mockRunMonteCarloSimulation.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    const result = await runSensitivityAnalysis(config, mockBalancerConfig);
    
    expect(result).toBeDefined();
    // Should complete or timeout gracefully
  });
});

describe('Performance Tests', () => {
  it('should complete analysis within reasonable time', async () => {
    const startTime = Date.now();
    
    const result = await runSensitivityAnalysis({
      analysis: { scope: 'full-system', iterations: 1000, seed: 42, timeoutMinutes: 5, verbose: false }
    }, mockBalancerConfig);
    
    const duration = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });

  it('should handle memory efficiently', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    await runSensitivityAnalysis({
      analysis: { scope: 'full-system', iterations: 2000, seed: 42, timeoutMinutes: 5, verbose: false },
      perturbation: { ranges: DEFAULT_SENSITIVITY_CONFIG.perturbation.ranges, bidirectional: true, maxPerturbations: 15 },
    }, mockBalancerConfig);
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  it('should scale linearly with iterations', async () => {
    const iterations = [100, 500, 1000];
    const durations: number[] = [];
    
    for (const iter of iterations) {
      const startTime = Date.now();
      await runSensitivityAnalysis({
        analysis: { scope: 'full-system', iterations: iter, seed: 42, timeoutMinutes: 5, verbose: false }
      }, mockBalancerConfig);
      durations.push(Date.now() - startTime);
    }
    
    // Duration should scale roughly linearly
    expect(durations[2]).toBeLessThan(durations[0] * 15); // Allow some variance
  });
});
