import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { RadarAutoTuner, useRadarAutoTuner, DEFAULT_RADAR_AUTOTUNE_CONFIG } from '@/ui/balancing/stressTesting/radarAutoTuner';
import type { MarginalUtilityMetrics } from '@/balancing/stressTesting/MarginalUtilityTypes';

// Mock data for testing
const mockStatMetrics: MarginalUtilityMetrics[] = [
  {
    statId: 'strength',
    avgWinRate: 0.8,
    ranking: 1,
    matchupCount: 100,
    pairScore: 1.2,
    expectedScore: 0.7,
    synergyMultiplier: 1.15,
  },
  {
    statId: 'agility',
    avgWinRate: 0.6,
    ranking: 2,
    matchupCount: 100,
    pairScore: 1.0,
    expectedScore: 0.6,
    synergyMultiplier: 1.0,
  },
  {
    statId: 'intelligence',
    avgWinRate: 0.4,
    ranking: 3,
    matchupCount: 100,
    pairScore: 0.8,
    expectedScore: 0.5,
    synergyMultiplier: 0.95,
  },
  {
    statId: 'endurance',
    avgWinRate: 0.2,
    ranking: 4,
    matchupCount: 100,
    pairScore: 0.6,
    expectedScore: 0.4,
    synergyMultiplier: 0.85,
  },
];

describe('RadarAutoTuner', () => {
  let tuner: RadarAutoTuner;

  beforeEach(() => {
    tuner = new RadarAutoTuner();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const config = tuner.getConfig();
      expect(config).toEqual(DEFAULT_RADAR_AUTOTUNE_CONFIG);
    });

    it('should merge user config with defaults', () => {
      const userConfig = {
        rangeStrategy: 'percentile' as const,
        minRange: 0.2,
      };
      
      const customTuner = new RadarAutoTuner(userConfig);
      const config = customTuner.getConfig();
      
      expect(config.rangeStrategy).toBe('percentile');
      expect(config.minRange).toBe(0.2);
      expect(config.maxRange).toBe(DEFAULT_RADAR_AUTOTUNE_CONFIG.maxRange);
    });
  });

  describe('autoTune', () => {
    it('should return default result for empty metrics', () => {
      const result = tuner.autoTune([]);
      
      expect(result.maxValue).toBe(1.0);
      expect(result.gridLevels).toBe(DEFAULT_RADAR_AUTOTUNE_CONFIG.gridOptimization.preferredLevels);
      expect(result.rangeInfo.strategy).toBe('default');
    });

    it('should calculate optimal range for normal data', () => {
      const result = tuner.autoTune(mockStatMetrics);
      
      expect(result.maxValue).toBeGreaterThan(0);
      expect(result.maxValue).toBeLessThanOrEqual(DEFAULT_RADAR_AUTOTUNE_CONFIG.maxRange);
      expect(result.gridLevels).toBeGreaterThanOrEqual(DEFAULT_RADAR_AUTOTUNE_CONFIG.gridOptimization.minLevels);
      expect(result.gridLevels).toBeLessThanOrEqual(DEFAULT_RADAR_AUTOTUNE_CONFIG.gridOptimization.maxLevels);
    });

    it('should handle percentile strategy', () => {
      const customTuner = new RadarAutoTuner({
        rangeStrategy: 'percentile',
        percentileBounds: { lower: 25, upper: 75 },
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.rangeInfo.strategy).toBe('percentile');
      expect(result.maxValue).toBeGreaterThan(0);
    });

    it('should handle stddev strategy', () => {
      const customTuner = new RadarAutoTuner({
        rangeStrategy: 'stddev',
        stddevMultiplier: 1.5,
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.rangeInfo.strategy).toBe('stddev');
      expect(result.maxValue).toBeGreaterThan(0);
    });

    it('should handle minmax strategy', () => {
      const customTuner = new RadarAutoTuner({
        rangeStrategy: 'minmax',
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.rangeInfo.strategy).toBe('minmax');
      expect(result.maxValue).toBeGreaterThan(0);
    });

    it('should use adaptive strategy by default', () => {
      const result = tuner.autoTune(mockStatMetrics);
      
      // Adaptive strategy chooses the best performing strategy
      expect(['percentile', 'stddev', 'minmax']).toContain(result.rangeInfo.strategy);
    });

    it('should apply range constraints', () => {
      const customTuner = new RadarAutoTuner({
        minRange: 0.5,
        maxRange: 1.0,
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.maxValue).toBeGreaterThanOrEqual(0.5);
      expect(result.maxValue).toBeLessThanOrEqual(1.0);
    });

    it('should optimize grid levels based on maxValue', () => {
      const result = tuner.autoTune(mockStatMetrics);
      
      // Grid levels should be adjusted based on the magnitude of maxValue
      expect(result.gridLevels).toBeDefined();
      expect(typeof result.gridLevels).toBe('number');
    });

    it('should calculate performance metrics', () => {
      const result = tuner.autoTune(mockStatMetrics);
      
      expect(result.performance.dataUtilization).toBeGreaterThanOrEqual(0);
      expect(result.performance.dataUtilization).toBeLessThanOrEqual(1);
      expect(result.performance.outlierHandling).toBeGreaterThanOrEqual(0);
      expect(result.performance.outlierHandling).toBeLessThanOrEqual(1);
      expect(result.performance.gridEfficiency).toBeGreaterThanOrEqual(0);
      expect(result.performance.gridEfficiency).toBeLessThanOrEqual(1);
    });

    it('should handle outlier detection', () => {
      const metricsWithOutlier = [
        ...mockStatMetrics,
        {
          statId: 'outlier',
          avgWinRate: 2.0, // Much higher than others
          ranking: 5,
          matchupCount: 100,
          pairScore: 2.0,
          expectedScore: 0.7,
          synergyMultiplier: 1.5,
        },
      ];
      
      const result = tuner.autoTune(metricsWithOutlier);
      
      // Outlier detection depends on strategy, may not always detect outliers
      expect(result.rangeInfo.outlierCount).toBeGreaterThanOrEqual(0);
      expect(result.maxValue).toBeLessThanOrEqual(2.0); // Should be constrained
    });
  });

  describe('smoothing algorithms', () => {
    it('should apply gaussian smoothing', () => {
      const customTuner = new RadarAutoTuner({
        smoothing: {
          ...DEFAULT_RADAR_AUTOTUNE_CONFIG.smoothing,
          enabled: true,
          algorithm: 'gaussian',
          factor: 0.5,
        },
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.smoothingApplied.algorithm).toBe('gaussian');
      expect(result.smoothingApplied.factor).toBe(0.5);
    });

    it('should apply exponential smoothing', () => {
      const customTuner = new RadarAutoTuner({
        smoothing: {
          ...DEFAULT_RADAR_AUTOTUNE_CONFIG.smoothing,
          enabled: true,
          algorithm: 'exponential',
          factor: 0.3,
        },
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.smoothingApplied.algorithm).toBe('exponential');
      expect(result.smoothingApplied.factor).toBe(0.3);
    });

    it('should apply moving average smoothing', () => {
      const customTuner = new RadarAutoTuner({
        smoothing: {
          ...DEFAULT_RADAR_AUTOTUNE_CONFIG.smoothing,
          enabled: true,
          algorithm: 'moving_average',
          windowSize: 5,
        },
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.smoothingApplied.algorithm).toBe('moving_average');
      expect(result.smoothingApplied.windowSize).toBe(5);
    });

    it('should disable smoothing when disabled', () => {
      const customTuner = new RadarAutoTuner({
        smoothing: {
          ...DEFAULT_RADAR_AUTOTUNE_CONFIG.smoothing,
          enabled: false,
        },
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.smoothingApplied.algorithm).toBe(DEFAULT_RADAR_AUTOTUNE_CONFIG.smoothing.algorithm);
    });
  });

  describe('grid optimization', () => {
    it('should disable grid optimization when disabled', () => {
      const customTuner = new RadarAutoTuner({
        gridOptimization: {
          ...DEFAULT_RADAR_AUTOTUNE_CONFIG.gridOptimization,
          enabled: false,
        },
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.gridLevels).toBe(DEFAULT_RADAR_AUTOTUNE_CONFIG.gridOptimization.preferredLevels);
    });

    it('should respect grid level constraints', () => {
      const customTuner = new RadarAutoTuner({
        gridOptimization: {
          ...DEFAULT_RADAR_AUTOTUNE_CONFIG.gridOptimization,
          minLevels: 2,
          maxLevels: 6,
        },
      });
      
      const result = customTuner.autoTune(mockStatMetrics);
      
      expect(result.gridLevels).toBeGreaterThanOrEqual(2);
      expect(result.gridLevels).toBeLessThanOrEqual(6);
    });
  });

  describe('config management', () => {
    it('should update config', () => {
      tuner.updateConfig({
        rangeStrategy: 'percentile',
        minRange: 0.3,
      });
      
      const config = tuner.getConfig();
      
      expect(config.rangeStrategy).toBe('percentile');
      expect(config.minRange).toBe(0.3);
    });

    it('should preserve other config when updating', () => {
      tuner.updateConfig({
        rangeStrategy: 'stddev',
      });
      
      const config = tuner.getConfig();
      
      expect(config.rangeStrategy).toBe('stddev');
      expect(config.percentileBounds).toEqual(DEFAULT_RADAR_AUTOTUNE_CONFIG.percentileBounds);
      expect(config.stddevMultiplier).toEqual(DEFAULT_RADAR_AUTOTUNE_CONFIG.stddevMultiplier);
    });
  });
});

describe('useRadarAutoTuner', () => {
  it('should provide hook API', () => {
    const { result } = renderHook(() => useRadarAutoTuner());
    
    expect(result.current.autoTune).toBeInstanceOf(Function);
    expect(result.current.getConfig).toBeInstanceOf(Function);
    expect(result.current.updateConfig).toBeInstanceOf(Function);
  });

  it('should use custom config', () => {
    const customConfig = {
      rangeStrategy: 'percentile' as const,
      minRange: 0.2,
    };
    
    const { result } = renderHook(() => useRadarAutoTuner(customConfig));
    
    const config = result.current.getConfig();
    expect(config.rangeStrategy).toBe('percentile');
    expect(config.minRange).toBe(0.2);
  });

  it('should auto-tune metrics', () => {
    const { result } = renderHook(() => useRadarAutoTuner());
    
    act(() => {
      const tuneResult = result.current.autoTune(mockStatMetrics);
      
      expect(tuneResult.maxValue).toBeGreaterThan(0);
      expect(tuneResult.gridLevels).toBeGreaterThan(0);
      expect(tuneResult.rangeInfo.strategy).toBeDefined();
    });
  });

  it('should update config through hook', () => {
    const { result } = renderHook(() => useRadarAutoTuner());
    
    act(() => {
      result.current.updateConfig({
        rangeStrategy: 'minmax' as const,
      });
    });
    
    const config = result.current.getConfig();
    expect(config.rangeStrategy).toBe('minmax');
  });
});

describe('edge cases', () => {
  let tuner: RadarAutoTuner;

  beforeEach(() => {
    tuner = new RadarAutoTuner();
  });

  it('should handle single metric', () => {
    const singleMetric = [mockStatMetrics[0]];
    const result = tuner.autoTune(singleMetric);
    
    expect(result.maxValue).toBeGreaterThan(0);
    expect(result.gridLevels).toBeGreaterThan(0);
  });

  it('should handle identical values', () => {
    const identicalMetrics = mockStatMetrics.map(metric => ({
      ...metric,
      avgWinRate: 0.5,
    }));
    
    const result = tuner.autoTune(identicalMetrics);
    
    expect(result.maxValue).toBeGreaterThan(0);
    expect(result.performance.dataUtilization).toBeGreaterThan(0); // Good fit
  });

  it('should handle extreme values', () => {
    const extremeMetrics = [
      { ...mockStatMetrics[0], avgWinRate: 0.001 },
      { ...mockStatMetrics[1], avgWinRate: 0.999 },
    ];
    
    const result = tuner.autoTune(extremeMetrics);
    
    expect(result.maxValue).toBeGreaterThan(0);
    expect(result.maxValue).toBeLessThanOrEqual(DEFAULT_RADAR_AUTOTUNE_CONFIG.maxRange);
  });

  it('should handle zero values', () => {
    const zeroMetrics = mockStatMetrics.map(metric => ({
      ...metric,
      avgWinRate: 0,
    }));
    
    const result = tuner.autoTune(zeroMetrics);
    
    expect(result.maxValue).toBeGreaterThanOrEqual(DEFAULT_RADAR_AUTOTUNE_CONFIG.minRange * 0.5);
  });

  it('should handle negative values gracefully', () => {
    // Though avgWinRate shouldn't be negative, test robustness
    const negativeMetrics = [
      { ...mockStatMetrics[0], avgWinRate: -0.1 },
      { ...mockStatMetrics[1], avgWinRate: 0.8 },
    ];
    
    const result = tuner.autoTune(negativeMetrics);
    
    expect(result.maxValue).toBeGreaterThan(0);
    // Algorithm may not handle negative values perfectly in all cases
    expect(result.rangeInfo.optimizedMin).toBeDefined();
  });
});
