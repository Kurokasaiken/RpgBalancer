/**
 * Stat Weight Sensitivity Analyzer Unit Tests
 * 
 * Comprehensive test suite for the Stat Weight Sensitivity Analyzer.
 * Tests configuration, analysis logic, Monte Carlo integration, and recommendations.
 * 
 * @since NP-144 – Config Balancer: Stat Weight Sensitivity Analyzer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StatWeightSensitivityAnalyzer, runSensitivityAnalysis, analyzeStatSensitivity } from '../../../src/balancing/analysis/StatWeightSensitivityAnalyzer';
import type {
  SensitivityConfig,
  SensitivityResult,
  SensitivityMetric,
  PerturbationRange,
  AnalysisScope,
  SensitivityThreshold,
} from '../../../src/balancing/config/analysis/sensitivityConfig';
import {
  DEFAULT_SENSITIVITY_CONFIG,
  createSafeSensitivityConfig,
  validateSensitivityConfig,
  generatePerturbations,
  calculateSensitivityScore,
  calculateImpactScore,
  identifyCriticalWeights,
  generateRecommendations,
  getSensitivityThreshold,
  getSensitivityColor,
  getSensitivityIcon,
  getSensitivityRecommendation,
  PERTURBATION_RANGES,
  SENSITIVITY_METRICS,
  SENSITIVITY_THRESHOLDS,
} from '../../../src/balancing/config/analysis/sensitivityConfig';
import type { BalancerConfig } from '../../../src/balancing/config/types';

// Mock Monte Carlo Engine
vi.mock('../../../src/balancing/monteCarlo/MonteCarloEngine', () => ({
  runMonteCarloSimulation: vi.fn().mockResolvedValue({
    runs: [
      {
        id: 'run-1',
        archetype: 'archetype-1',
        result: 'victory',
        turns: 12,
        damageDealt: 150,
        damageTaken: 80,
        hpRemaining: 45,
        timestamp: Date.now(),
      },
      {
        id: 'run-2',
        archetype: 'archetype-2',
        result: 'defeat',
        turns: 18,
        damageDealt: 120,
        damageTaken: 100,
        hpRemaining: 0,
        timestamp: Date.now(),
      },
      {
        id: 'run-3',
        archetype: 'archetype-3',
        result: 'victory',
        turns: 10,
        damageDealt: 180,
        damageTaken: 60,
        hpRemaining: 80,
        timestamp: Date.now(),
      },
    ],
  }),
}));

describe('Sensitivity Configuration', () => {
  describe('Default Configuration', () => {
    it('should have correct default metrics', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.metrics).toHaveLength(8);
      expect(DEFAULT_SENSITIVITY_CONFIG.metrics[0].id).toBe('balance-score');
      expect(DEFAULT_SENSITIVITY_CONFIG.metrics[0].weight).toBe(0.3);
    });

    it('should have correct perturbation ranges', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.perturbationRanges).toHaveLength(5);
      expect(DEFAULT_SENSITIVITY_CONFIG.perturbationRanges[0].id).toBe('tiny');
      expect(DEFAULT_SENSITIVITY_CONFIG.perturbationRanges[0].percentage).toBe(0.01);
    });

    it('should have correct thresholds', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.thresholds.insensitive).toBe(0.05);
      expect(DEFAULT_SENSITIVITY_CONFIG.thresholds.critical).toBe(0.60);
    });

    it('should have correct analysis configuration', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.analysis.scope).toBe('full-system');
      expect(DEFAULT_SENSITIVITY_CONFIG.analysis.iterations).toBe(1000);
      expect(DEFAULT_SENSITIVITY_CONFIG.analysis.maxPerturbations).toBe(25);
    });

    it('should have correct Monte Carlo configuration', () => {
      expect(DEFAULT_SENSITIVITY_CONFIG.monteCarlo.targetTurns).toBe(15);
      expect(DEFAULT_SENSITIVITY_CONFIG.monteCarlo.scenarioType).toBe('1v1');
      expect(DEFAULT_SENSITIVITY_CONFIG.monteCarlo.archetypes).toBe(10);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', () => {
      const config = {
        metrics: DEFAULT_SENSITIVITY_CONFIG.metrics,
        perturbationRanges: DEFAULT_SENSITIVITY_CONFIG.perturbationRanges,
        thresholds: DEFAULT_SENSITIVITY_CONFIG.thresholds,
        analysis: DEFAULT_SENSITIVITY_CONFIG.analysis,
        monteCarlo: DEFAULT_SENSITIVITY_CONFIG.monteCarlo,
        ui: DEFAULT_SENSITIVITY_CONFIG.ui,
      };
      
      const errors = validateSensitivityConfig(config);
      expect(errors).toEqual([]);
    });

    it('should reject invalid metric weight', () => {
      const config = {
        metrics: [
          {
            ...DEFAULT_SENSITIVITY_CONFIG.metrics[0],
            weight: 1.5, // Invalid: > 1
          },
        ],
        perturbationRanges: DEFAULT_SENSITIVITY_CONFIG.perturbationRanges,
        thresholds: DEFAULT_SENSITIVITY_CONFIG.thresholds,
        analysis: DEFAULT_SENSITIVITY_CONFIG.analysis,
        monteCarlo: DEFAULT_SENSITIVITY_CONFIG.monteCarlo,
        ui: DEFAULT_SENSITIVITY_CONFIG.ui,
      };
      
      const errors = validateSensitivityConfig(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid perturbation percentage', () => {
      const config = {
        metrics: DEFAULT_SENSITIVITY_CONFIG.metrics,
        perturbationRanges: [
          {
            ...DEFAULT_SENSITIVITY_CONFIG.perturbationRanges[0],
            percentage: 1.5, // Invalid: > 1
          },
        ],
        thresholds: DEFAULT_SENSITIVITY_CONFIG.thresholds,
        analysis: DEFAULT_SENSITIVITY_CONFIG.analysis,
        monteCarlo: DEFAULT_SENSITIVITY_CONFIG.monteCarlo,
        ui: DEFAULT_SENSITIVITY_CONFIG.ui,
      };
      
      const errors = validateSensitivityConfig(config);
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid threshold', () => {
      const config = {
        metrics: DEFAULT_SENSITIVITY_CONFIG.metrics,
        perturbationRanges: DEFAULT_SENSITIVITY_CONFIG.perturbationRanges,
        thresholds: {
          ...DEFAULT_SENSITIVITY_CONFIG.thresholds,
          insensitive: -0.1, // Invalid: negative
        },
        analysis: DEFAULT_SENSITIVITY_CONFIG.analysis,
        monteCarlo: DEFAULT_SENSITIVITY_CONFIG.monteCarlo,
        ui: DEFAULT_SENSITIVITY_CONFIG.ui,
      };
      
      const errors = validateSensitivityConfig(config);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Safe Configuration Creation', () => {
    it('should create safe configuration from valid input', () => {
      const input = {
        analysis: {
          scope: 'single-stat' as AnalysisScope,
          iterations: 500,
        },
        thresholds: {
          critical: 0.7,
        },
      };
      
      const config = createSafeSensitivityConfig(input);
      
      expect(config.analysis.scope).toBe('single-stat');
      expect(config.analysis.iterations).toBe(500);
      expect(config.thresholds.critical).toBe(0.7);
    });

    it('should fallback to defaults for invalid input', () => {
      const input = {
        analysis: {
          scope: 'invalid' as any,
          iterations: 50000, // Invalid: > 10000
        },
        thresholds: {
          critical: -0.1, // Invalid: negative
        },
      };
      
      const config = createSafeSensitivityConfig(input);
      
      expect(config.analysis.scope).toBe(DEFAULT_SENSITIVITY_CONFIG.analysis.scope);
      expect(config.analysis.iterations).toBe(DEFAULT_SENSITIVITY_CONFIG.analysis.iterations);
      expect(config.thresholds.critical).toBe(DEFAULT_SENSITIVITY_CONFIG.thresholds.critical);
    });
  });
});

describe('Sensitivity Utilities', () => {
  describe('Perturbation Generation', () => {
    it('should generate perturbations for tiny range', () => {
      const perturbations = generatePerturbations('tiny');
      expect(perturbations).toHaveLength(5);
      expect(perturbations[0]).toBe(-0.005); // -0.5%
      expect(perturbations[2]).toBe(0); // 0%
      expect(perturbations[4]).toBe(0.005); // +0.5%
    });

    it('should generate perturbations for extreme range', () => {
      const perturbations = generatePerturbations('extreme');
      expect(perturbations).toHaveLength(13);
      expect(perturbations[0]).toBe(-0.5); // -50%
      expect(perturbations[6]).toBe(0); // 0%
      expect(perturbations[12]).toBe(0.5); // +50%
    });

    it('should generate different number of perturbations for each range', () => {
      const tiny = generatePerturbations('tiny');
      const small = generatePerturbations('small');
      const medium = generatePerturbations('medium');
      const large = generatePerturbations('large');
      const extreme = generatePerturbations('extreme');
      
      expect(tiny.length).toBe(5);
      expect(small.length).toBe(7);
      expect(medium.length).toBe(9);
      expect(large.length).toBe(11);
      expect(extreme.length).toBe(13);
    });
  });

  describe('Sensitivity Threshold Detection', () => {
    it('should detect insensitive sensitivity', () => {
      const threshold = getSensitivityThreshold(0.03, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      expect(threshold).toBe('insensitive');
    });

    it('should detect low sensitivity', () => {
      const threshold = getSensitivityThreshold(0.1, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      expect(threshold).toBe('low');
    });

    it('should detect moderate sensitivity', () => {
      const threshold = getSensitivityThreshold(0.2, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      expect(threshold).toBe('moderate');
    });

    it('should detect high sensitivity', () => {
      const threshold = getSensitivityThreshold(0.35, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      expect(threshold).toBe('high');
    });

    it('should detect critical sensitivity', () => {
      const threshold = getSensitivityThreshold(0.7, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      expect(threshold).toBe('critical');
    });
  });

  describe('Sensitivity Color Mapping', () => {
    it('should return correct colors for each threshold', () => {
      expect(getSensitivityColor('insensitive')).toBe('#10b981');
      expect(getSensitivityColor('low')).toBe('#84cc16');
      expect(getSensitivityColor('moderate')).toBe('#f59e0b');
      expect(getSensitivityColor('high')).toBe('#ef4444');
      expect(getSensitivityColor('critical')).toBe('#dc2626');
    });
  });

  describe('Sensitivity Icons', () => {
    it('should return correct icons for each threshold', () => {
      expect(getSensitivityIcon('insensitive')).toBe('🛡️');
      expect(getSensitivityIcon('low')).toBe('📉');
      expect(getSensitivityIcon('moderate')).toBe('⚖️');
      expect(getSensitivityIcon('high')).toBe('⚠️');
      expect(getSensitivityIcon('critical')).toBe('🚨');
    });
  });

  describe('Sensitivity Recommendations', () => {
    it('should return recommendations for insensitive threshold', () => {
      const recommendation = getSensitivityRecommendation('insensitive');
      expect(recommendation).toBe('Weight is stable and can be safely adjusted');
    });

    it('should return recommendations for critical threshold', () => {
      const recommendation = getSensitivityRecommendation('critical');
      expect(recommendation).toBe('Weight is extremely critical, avoid changes without extensive testing');
    });
  });

  describe('Sensitivity Score Calculation', () => {
    it('should calculate sensitivity score from perturbations', () => {
      const perturbations = [
        { perturbation: 0.1, newWeight: 1.1, metrics: { 'balance-score': 0.6 }, sensitivity: 0.2, impact: 0.1, confidence: 0.9 },
        { perturbation: -0.1, newWeight: 0.9, metrics: { 'balance-score': 0.4 }, sensitivity: 0.3, impact: -0.1, confidence: 0.8 },
        { perturbation: 0.05, newWeight: 1.05, metrics: { 'balance-score': 0.55 }, sensitivity: 0.1, impact: 0.05, confidence: 0.95 },
      ];
      
      const score = calculateSensitivityScore(perturbations, 'balance-score');
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty perturbations', () => {
      const score = calculateSensitivityScore([], 'balance-score');
      expect(score).toBe(0);
    });
  });

  describe('Impact Score Calculation', () => {
    it('should calculate positive impact for improvement', () => {
      const impact = calculateImpactScore(0.5, 0.6, true);
      expect(impact).toBeCloseTo(0.2, 2);
    });

    it('should calculate negative impact for degradation', () => {
      const impact = calculateImpactScore(0.6, 0.5, true);
      expect(impact).toBeCloseTo(-0.17, 2);
    });

    it('should calculate negative impact for degradation when lower is better', () => {
      const impact = calculateImpactScore(0.6, 0.5, false);
      expect(impact).toBeCloseTo(0.17, 2);
    });

    it('should calculate positive impact for improvement when lower is better', () => {
      const impact = calculateImpactScore(0.5, 0.6, false);
      expect(impact).toBeCloseTo(-0.17, 2);
    });
  });

  describe('Critical Weight Identification', () => {
    it('should identify critical weights from results', () => {
      const results = [
        {
          statId: 'damage',
          statName: 'Damage',
          originalWeight: 1.0,
          perturbations: [],
          overallSensitivity: 0.7,
          criticalThreshold: 0.6,
          recommendations: [],
          analysisDate: new Date().toISOString(),
          iterations: 1000,
        },
        {
          statId: 'health',
          statName: 'Health',
          originalWeight: 1.2,
          perturbations: [],
          overallSensitivity: 0.3,
          criticalThreshold: 0.6,
          recommendations: [],
          analysisDate: new Date().toISOString(),
          iterations: 1000,
        },
      ];
      
      const criticalWeights = identifyCriticalWeights(results, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      
      expect(criticalWeights).toEqual(['damage']);
    });

    it('should return empty array for no critical weights', () => {
      const results = [
        {
          statId: 'damage',
          statName: 'Damage',
          originalWeight: 1.0,
          perturbations: [],
          overallSensitivity: 0.3,
          criticalThreshold: 0.6,
          recommendations: [],
          analysisDate: new Date().toISOString(),
          iterations: 1000,
        },
        {
          statId: 'health',
          statName: 'Health',
          originalWeight: 1.2,
          perturbations: [],
          overallSensitivity: 0.2,
          criticalThreshold: 0.6,
          recommendations: [],
          analysisDate: new Date().toISOString(),
          iterations: 1000,
        },
      ];
      
      const criticalWeights = identifyCriticalWeights(results, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      
      expect(criticalWeights).toEqual([]);
    });
  });

  describe('Recommendations Generation', () => {
    it('should generate recommendations for sensitive stat', () => {
      const result = {
        statId: 'damage',
        statName: 'Damage',
        originalWeight: 1.0,
        perturbations: [],
        overallSensitivity: 0.7,
        criticalThreshold: 0.6,
        recommendations: [],
        analysisDate: new Date().toISOString(),
        iterations: 1000,
      };
      
      const recommendations = generateRecommendations(result, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      
      expect(recommendations).toContain('Weight is critical, changes require thorough testing');
    });

    it('should generate recommendations for insensitive stat', () => {
      const result = {
        statId: 'health',
        statName: 'Health',
        originalWeight: 1.2,
        perturbations: [],
        overallSensitivity: 0.03,
        criticalThreshold: 0.6,
        recommendations: [],
        analysisDate: new Date().toISOString(),
        iterations: 1000,
      };
      
      const recommendations = generateRecommendations(result, DEFAULT_SENSITIVITY_CONFIG.thresholds);
      
      expect(recommendations).toContain('Weight is stable and can be safely adjusted');
    });
  });
});

describe('StatWeightSensitivityAnalyzer Class', () => {
  let analyzer: StatWeightSensitivityAnalyzer;
  let mockBalancerConfig: BalancerConfig;
  
  beforeEach(() => {
    mockBalancerConfig = {
      stats: [
        { id: 'damage', label: 'Damage', weight: 1.0, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 10 },
        { id: 'health', label: 'Health', weight: 1.2, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 200, step: 5, defaultValue: 50 },
        { id: 'speed', label: 'Speed', weight: 0.8, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 20 },
      ],
      cards: [],
      presets: [],
    };
    
    analyzer = new StatWeightSensitivityAnalyzer({
      balancerConfig: mockBalancerConfig,
    });
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    analyzer.cancel();
  });

  it('should initialize with default configuration', () => {
      expect(analyzer.getConfig()).toEqual(DEFAULT_SENSITIVITY_CONFIG);
      expect(analyzer.getBalancerConfig()).toEqual(mockBalancerConfig);
    });

  it('should update configuration', () => {
      const newConfig = {
        analysis: {
          scope: 'single-stat' as AnalysisScope,
          iterations: 500,
        },
      };
      
      analyzer.updateConfig(newConfig);
      
      expect(analyzer.getConfig().analysis.scope).toBe('single-stat');
      expect(analyzer.getConfig().analysis.iterations).toBe(500);
    });

  it('should update balancer configuration', () => {
      const newBalancerConfig = {
        ...mockBalancerConfig,
        stats: [
          { ...mockBalancerConfig.stats[0], weight: 1.5 },
          ...mockBalancerConfig.stats.slice(1),
        ],
      };
      
      analyzer.updateBalancerConfig(newBalancerConfig);
      
      expect(analyzer.getBalancerConfig().stats[0].weight).toBe(1.5);
    });

  it('should cancel analysis', () => {
      const analysisPromise = analyzer.analyze();
      
      // Cancel immediately
      analyzer.cancel();
      
      await expect(analysisPromise).reject('Analysis aborted');
    });

  it('should run full sensitivity analysis', async () => {
      const result = await analyzer.analyze();
      
      expect(result.results).toBeDefined();
      expect(result.criticalWeights).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.heatmap).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

  it('should run analysis with custom configuration', async () => {
      const customConfig = {
        analysis: {
          scope: 'single-stat' as AnalysisScope,
          iterations: 500,
          maxPerturbations: 10,
        },
      };
      
      const result = await analyzer.analyze({ config: customConfig });
      
      expect(result.metadata.config.analysis.scope).toBe('single-stat');
      expect(result.metadata.config.analysis.iterations).toBe(500);
      expect(result.metadata.config.analysis.maxPerturbations).toBe(10);
    });

  it('should analyze single stat sensitivity', async () => {
      const result = await analyzer.analyzeStat('damage', 1.0);
      
      expect(result.statId).toBe('damage');
      expect(result.originalWeight).toBe(1.0);
      expect(result.perturbations).toBeDefined();
      expect(result.overallSensitivity).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

  it('should handle stat not found error', async () => {
      await expect(analyzer.analyzeStat('nonexistent', 1.0)).rejects.toThrow(
        "Stat 'nonexistent' not found in balancer configuration"
      );
    });

  it('should handle abort signal during analysis', async () => {
      const abortController = new AbortController();
      
      const analysisPromise = analyzer.analyze({
        abortSignal: abortController.signal,
      });
      
      // Abort after short delay
      setTimeout(() => abortController.abort(), 100);
      
      await expect(analysisPromise).reject('Analysis aborted');
    });
  });
});

describe('Convenience Functions', () => {
  describe('runSensitivityAnalysis', () => {
    it('should run full analysis with default configuration', async () => {
      const result = await runSensitivityAnalysis();
      
      expect(result.results).toBeDefined();
      expect(result.criticalWeights).toBeDefined();
      expect(result.statistics).toBeDefined();
      expect(result.heatmap).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should run analysis with custom configuration', async () => {
      const customConfig = {
        analysis: {
          scope: 'single-stat' as AnalysisScope,
          iterations: 500,
        },
      };
      
      const result = await runSensitivityAnalysis({ config: customConfig });
      
      expect(result.metadata.config.analysis.scope).toBe('single-stat');
      expect(result.metadata.config.analysis.iterations).toBe(500);
    });

    it('should run analysis with custom balancer config', async () => {
      const customBalancerConfig = {
        stats: [
          { id: 'test', label: 'Test', weight: 2.0, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 10 },
        ],
        cards: [],
        presets: [],
      };
      
      const result = await runSensitivityAnalysis({ balancerConfig: customBalancerConfig });
      
      expect(result.results).toBeDefined();
      expect(result.statistics.totalStats).toBe(1);
      expect(result.results[0].statId).toBe('test');
    });
  });

  describe('analyzeStatSensitivity', () => {
    it('should analyze single stat with default configuration', async () => {
      const result = await analyzeStatSensitivity('damage');
      
      expect(result.statId).toBe('damage');
      expect(result.originalWeight).toBe(1.0);
      expect(result.perturbations).toBeDefined();
      expect(result.overallSensitivity).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should analyze stat with custom weight', async () => {
      const result = await analyzeStatSensitivity('damage', 2.0);
      
      expect(result.originalWeight).toBe(2.0);
      expect(result.perturbations.map(p => p.newWeight)).toContain(2.0 * (1 + p.perturbation));
    });

    it('should analyze stat with custom configuration', async () => {
      const customConfig = {
        analysis: {
          iterations: 500,
          maxPerturbations: 5,
        },
      };
      
      const result = await analyzeStatSensitivity('damage', 1.0, { config: customConfig });
      
      expect(result.perturbations.length).toBe(5);
      expect(result.iterations).toBe(500);
    });

    it('should handle stat not found error', async () => {
      await expect(analyzeStatSensitivity('nonexistent')).rejects.toThrow(
        "Stat 'nonexistent' not found in balancer configuration"
      );
    });
  });
});

describe('Integration Tests', () => {
  it('should complete full analysis workflow', async () => {
    const customConfig = {
      analysis: {
        scope: 'pairwise' as AnalysisScope,
        iterations: 500,
        maxPerturbations: 15,
      },
      };
      
      const customBalancerConfig = {
        stats: [
          { id: 'damage', label: 'Damage', weight: 1.0, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 10 },
          { id: 'health', label: 'Health', weight: 1.2, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 200, step: 5, defaultValue: 50 },
          { id: 'speed', label: 'Speed', weight: 0.8, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 20 },
          { id: 'defense', label: 'Defense', weight: 0.9, isCore: true, isDerived: false, isPenalty: false, min: 0, max: 100, step: 1, defaultValue: 15 },
        ],
        cards: [],
        presets: [],
      };
      
      const result = await runSensitivityAnalysis({
        config: customConfig,
        balancerConfig: customBalancerConfig,
      });
      
      expect(result.results).toHaveLength(4);
      expect(result.metadata.config.analysis.scope).toBe('pairwise');
      expect(result.metadata.config.analysis.iterations).toBe(500);
      expect(result.metadata.config.analysis.maxPerturbations).toBe(15);
      expect(result.statistics.totalStats).toBe(4);
      expect(result.criticalWeights).toBeDefined();
      expect(result.heatmap).toHaveLength(4);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle large analysis efficiently', async () => {
      const largeConfig = {
        analysis: {
          scope: 'full-system' as AnalysisScope,
          iterations: 2000,
          maxPerturbations: 50,
        },
      };
      
      const startTime = Date.now();
      const result = await runSensitivityAnalysis({ config: largeConfig });
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(30000); // Should complete in < 30s
      expect(result.statistics.totalPerturbations).toBeLessThanOrEqual(200); // 4 stats * 50 perturbations = 200 max
      expect(result.statistics.totalStats).toBe(5); // 5 stats in default config
    });

    it('should provide progress updates during analysis', async () => {
      const progressUpdates: number[] = [];
      
      const result = await runSensitivityAnalysis({
        onProgress: (progress, currentStat) => {
          progressUpdates.push(progress);
        },
      });
      
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[progressUpdates.length - 1]).toBe(1); // Should reach 100%
    });

    it('should generate meaningful recommendations', async () => {
      const result = await runSensitivityAnalysis();
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => 
        r.includes('critical') || 
        r.includes('sensitivity') ||
        r.includes('recommendation')
      )).toBe(true);
    });

    it('should generate valid heatmap data', async () => {
      const result = await runSensitivityAnalysis();
      
      expect(result.heatmap).toHaveLength(5); // 5 stats in default config
      expect(result.heatmap[0]).toHaveProperty('statId');
      expect(result.heatmap[0]).toHaveProperty('sensitivity');
      expect(result.heatmap[0]).toHaveProperty('threshold');
      expect(result.heatmap[0]).toHaveProperty('color');
    });
  });
});
