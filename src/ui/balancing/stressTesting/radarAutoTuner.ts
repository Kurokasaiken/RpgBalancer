/**
 * KS-105-radar-autotune – Radar Chart Auto-Tuning Algorithm
 * 
 * Config-first dynamic range calculation and smoothing for StatProfileRadar
 * to optimize visual clarity and data distribution.
 * 
 * @module RadarAutoTuner
 * @since 2026-01-12
 * @author Helix-Radar
 */

import { useMemo } from 'react';
import type { MarginalUtilityMetrics } from '@/balancing/stressTesting/MarginalUtilityTypes';

/**
 * Auto-tuning configuration for radar chart optimization
 */
export interface RadarAutoTuneConfig {
  /** Range calculation strategy */
  rangeStrategy: 'percentile' | 'stddev' | 'minmax' | 'adaptive';
  /** Percentile bounds for percentile strategy (default: 5-95) */
  percentileBounds: { lower: number; upper: number };
  /** Standard deviation multiplier for stddev strategy (default: 2) */
  stddevMultiplier: number;
  /** Minimum range to prevent over-zooming (default: 0.1) */
  minRange: number;
  /** Maximum range to prevent under-zooming (default: 2.0) */
  maxRange: number;
  /** Smoothing configuration */
  smoothing: {
    /** Enable adaptive smoothing (default: true) */
    enabled: boolean;
    /** Smoothing algorithm type */
    algorithm: 'gaussian' | 'exponential' | 'moving_average';
    /** Smoothing factor (0-1, higher = more smoothing) */
    factor: number;
    /** Window size for moving average (default: 3) */
    windowSize: number;
  };
  /** Grid optimization */
  gridOptimization: {
    /** Enable automatic grid level adjustment */
    enabled: boolean;
    /** Preferred number of grid levels (default: 5) */
    preferredLevels: number;
    /** Maximum grid levels (default: 8) */
    maxLevels: number;
    /** Minimum grid levels (default: 3) */
    minLevels: number;
  };
}

/**
 * Default auto-tuning configuration
 */
export const DEFAULT_RADAR_AUTOTUNE_CONFIG: RadarAutoTuneConfig = {
  rangeStrategy: 'adaptive',
  percentileBounds: { lower: 5, upper: 95 },
  stddevMultiplier: 2,
  minRange: 0.1,
  maxRange: 2.0,
  smoothing: {
    enabled: true,
    algorithm: 'gaussian',
    factor: 0.3,
    windowSize: 3,
  },
  gridOptimization: {
    enabled: true,
    preferredLevels: 5,
    maxLevels: 8,
    minLevels: 3,
  },
};

/**
 * Auto-tuning result with optimized parameters
 */
export interface RadarAutoTuneResult {
  /** Optimized maximum value for radar scale */
  maxValue: number;
  /** Recommended grid levels */
  gridLevels: number;
  /** Smoothing parameters applied */
  smoothingApplied: {
    algorithm: string;
    factor: number;
    windowSize: number;
  };
  /** Range calculation details */
  rangeInfo: {
    strategy: string;
    originalMin: number;
    originalMax: number;
    optimizedMin: number;
    optimizedMax: number;
    outlierCount: number;
  };
  /** Performance metrics */
  performance: {
    dataUtilization: number; // 0-1, how well the range fits the data
    outlierHandling: number; // 0-1, how well outliers are handled
    gridEfficiency: number; // 0-1, how well the grid fits the range
  };
}

/**
 * Radar Auto-Tuner for dynamic range calculation and smoothing
 */
export class RadarAutoTuner {
  private config: RadarAutoTuneConfig;

  constructor(config: Partial<RadarAutoTuneConfig> = {}) {
    this.config = this.mergeConfig(config);
  }

  /**
   * Merge user config with defaults
   */
  private mergeConfig(userConfig: Partial<RadarAutoTuneConfig>): RadarAutoTuneConfig {
    return {
      rangeStrategy: userConfig.rangeStrategy ?? DEFAULT_RADAR_AUTOTUNE_CONFIG.rangeStrategy,
      percentileBounds: {
        ...DEFAULT_RADAR_AUTOTUNE_CONFIG.percentileBounds,
        ...userConfig.percentileBounds,
      },
      stddevMultiplier: userConfig.stddevMultiplier ?? DEFAULT_RADAR_AUTOTUNE_CONFIG.stddevMultiplier,
      minRange: userConfig.minRange ?? DEFAULT_RADAR_AUTOTUNE_CONFIG.minRange,
      maxRange: userConfig.maxRange ?? DEFAULT_RADAR_AUTOTUNE_CONFIG.maxRange,
      smoothing: {
        ...DEFAULT_RADAR_AUTOTUNE_CONFIG.smoothing,
        ...userConfig.smoothing,
      },
      gridOptimization: {
        ...DEFAULT_RADAR_AUTOTUNE_CONFIG.gridOptimization,
        ...userConfig.gridOptimization,
      },
    };
  }

  /**
   * Auto-tune radar parameters based on stat metrics
   */
  public autoTune(statMetrics: MarginalUtilityMetrics[]): RadarAutoTuneResult {
    if (statMetrics.length === 0) {
      return this.getDefaultResult();
    }

    // Extract values
    const values = statMetrics.map(m => m.avgWinRate);
    
    // Calculate optimal range
    const rangeResult = this.calculateOptimalRange(values);
    
    // Apply smoothing if enabled
    if (this.config.smoothing.enabled) {
      this.applySmoothing(values);
    }

    // Optimize grid levels
    const gridLevels = this.config.gridOptimization.enabled
      ? this.calculateOptimalGridLevels(rangeResult.optimizedMax)
      : this.config.gridOptimization.preferredLevels;

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(values, rangeResult, gridLevels);

    return {
      maxValue: rangeResult.optimizedMax,
      gridLevels,
      smoothingApplied: {
        algorithm: this.config.smoothing.algorithm,
        factor: this.config.smoothing.factor,
        windowSize: this.config.smoothing.windowSize,
      },
      rangeInfo: rangeResult,
      performance,
    };
  }

  /**
   * Calculate optimal range based on strategy
   */
  private calculateOptimalRange(values: number[]): RadarAutoTuneResult['rangeInfo'] {
    const originalMin = Math.min(...values);
    const originalMax = Math.max(...values);
    
    let optimizedMin = originalMin;
    let optimizedMax = originalMax;
    let strategy = this.config.rangeStrategy;
    let outlierCount = 0;

    switch (this.config.rangeStrategy) {
      case 'percentile':
        ({ min: optimizedMin, max: optimizedMax, outlierCount } = this.calculatePercentileRange(values));
        break;
      
      case 'stddev':
        ({ min: optimizedMin, max: optimizedMax, outlierCount } = this.calculateStddevRange(values));
        break;
      
      case 'minmax': {
        // Use min-max with padding
        const padding = (originalMax - originalMin) * 0.1;
        optimizedMin = Math.max(0, originalMin - padding);
        optimizedMax = originalMax + padding;
        break;
      }
      
      case 'adaptive': {
        // Choose best strategy based on data distribution
        const strategies: Array<'percentile' | 'stddev' | 'minmax'> = ['percentile', 'stddev', 'minmax'];
        let bestScore = -1;
        let bestResult = { min: optimizedMin, max: optimizedMax, outlierCount: 0 };

        for (const strat of strategies) {
          const result = strat === 'percentile' 
            ? this.calculatePercentileRange(values)
            : strat === 'stddev'
            ? this.calculateStddevRange(values)
            : { min: originalMin, max: originalMax, outlierCount: 0 };

          const score = this.evaluateRangeQuality(values, result.min, result.max);
          if (score > bestScore) {
            bestScore = score;
            bestResult = result;
            strategy = strat;
          }
        }

        ({ min: optimizedMin, max: optimizedMax, outlierCount } = bestResult);
        break;
      }
    }

    // Apply range constraints
    const range = optimizedMax - optimizedMin;
    if (range < this.config.minRange) {
      const center = (optimizedMax + optimizedMin) / 2;
      optimizedMin = Math.max(0, center - this.config.minRange / 2);
      optimizedMax = center + this.config.minRange / 2;
    } else if (range > this.config.maxRange) {
      const center = (optimizedMax + optimizedMin) / 2;
      optimizedMin = Math.max(0, center - this.config.maxRange / 2);
      optimizedMax = center + this.config.maxRange / 2;
    }

    return {
      strategy,
      originalMin,
      originalMax,
      optimizedMin,
      optimizedMax,
      outlierCount,
    };
  }

  /**
   * Calculate percentile-based range
   */
  private calculatePercentileRange(values: number[]): { min: number; max: number; outlierCount: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const lowerIndex = Math.floor((this.config.percentileBounds.lower / 100) * sorted.length);
    const upperIndex = Math.ceil((this.config.percentileBounds.upper / 100) * sorted.length) - 1;
    
    const min = sorted[lowerIndex];
    const max = sorted[upperIndex];
    const outlierCount = lowerIndex + (sorted.length - upperIndex - 1);

    return { min, max, outlierCount };
  }

  /**
   * Calculate standard deviation-based range
   */
  private calculateStddevRange(values: number[]): { min: number; max: number; outlierCount: number } {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    const min = Math.max(0, mean - this.config.stddevMultiplier * stddev);
    const max = mean + this.config.stddevMultiplier * stddev;
    
    const outlierCount = values.filter(val => val < min || val > max).length;

    return { min, max, outlierCount };
  }

  /**
   * Apply smoothing to values
   */
  private applySmoothing(values: number[]): number[] {
    switch (this.config.smoothing.algorithm) {
      case 'gaussian': {
        return this.applyGaussianSmoothing(values);
      }
      
      case 'exponential': {
        return this.applyExponentialSmoothing(values);
      }
      
      case 'moving_average': {
        return this.applyMovingAverageSmoothing(values);
      }
      
      default: {
        return values;
      }
    }
  }

  /**
   * Gaussian smoothing
   */
  private applyGaussianSmoothing(values: number[]): number[] {
    const window = this.config.smoothing.windowSize;
    const sigma = this.config.smoothing.factor;
    const smoothed: number[] = [];

    for (let i = 0; i < values.length; i++) {
      let weightedSum = 0;
      let weightSum = 0;

      for (let j = -window; j <= window; j++) {
        const index = i + j;
        if (index >= 0 && index < values.length) {
          const weight = Math.exp(-(j * j) / (2 * sigma * sigma));
          weightedSum += values[index] * weight;
          weightSum += weight;
        }
      }

      smoothed.push(weightedSum / weightSum);
    }

    return smoothed;
  }

  /**
   * Exponential smoothing
   */
  private applyExponentialSmoothing(values: number[]): number[] {
    const alpha = this.config.smoothing.factor;
    const smoothed: number[] = [];
    let prevValue = values[0];

    for (let i = 0; i < values.length; i++) {
      const currentValue = i === 0 ? values[0] : alpha * values[i] + (1 - alpha) * prevValue;
      smoothed.push(currentValue);
      prevValue = currentValue;
    }

    return smoothed;
  }

  /**
   * Moving average smoothing
   */
  private applyMovingAverageSmoothing(values: number[]): number[] {
    const window = this.config.smoothing.windowSize;
    const smoothed: number[] = [];

    for (let i = 0; i < values.length; i++) {
      let sum = 0;
      let count = 0;

      for (let j = Math.max(0, i - window); j <= Math.min(values.length - 1, i + window); j++) {
        sum += values[j];
        count++;
      }

      smoothed.push(sum / count);
    }

    return smoothed;
  }

  /**
   * Calculate optimal grid levels
   */
  private calculateOptimalGridLevels(maxValue: number): number {
    const { preferredLevels, minLevels, maxLevels } = this.config.gridOptimization;
    
    // Choose grid levels based on value magnitude
    if (maxValue <= 0.5) return Math.max(minLevels, Math.min(maxLevels, preferredLevels + 1));
    if (maxValue <= 1.0) return preferredLevels;
    if (maxValue <= 1.5) return Math.max(minLevels, preferredLevels - 1);
    return Math.max(minLevels, Math.min(maxLevels, preferredLevels - 2));
  }

  /**
   * Evaluate range quality
   */
  private evaluateRangeQuality(values: number[], min: number, max: number): number {
    const range = max - min;
    if (range === 0) return 0;

    // Calculate how well values fit in the range
    const inRange = values.filter(v => v >= min && v <= max).length;
    const coverageScore = inRange / values.length;

    // Calculate range efficiency (not too wide, not too narrow)
    const valueRange = Math.max(...values) - Math.min(...values);
    const efficiencyScore = Math.min(1, valueRange / range);

    return (coverageScore + efficiencyScore) / 2;
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    values: number[],
    rangeInfo: RadarAutoTuneResult['rangeInfo'],
    gridLevels: number
  ): RadarAutoTuneResult['performance'] {
    const dataUtilization = this.evaluateRangeQuality(
      values,
      rangeInfo.optimizedMin,
      rangeInfo.optimizedMax
    );

    const outlierHandling = values.length > 0 
      ? 1 - (rangeInfo.outlierCount / values.length)
      : 1;

    const gridEfficiency = gridLevels >= this.config.gridOptimization.minLevels &&
      gridLevels <= this.config.gridOptimization.maxLevels
      ? 1
      : 0.5;

    return {
      dataUtilization,
      outlierHandling,
      gridEfficiency,
    };
  }

  /**
   * Get default result for empty data
   */
  private getDefaultResult(): RadarAutoTuneResult {
    return {
      maxValue: 1.0,
      gridLevels: this.config.gridOptimization.preferredLevels,
      smoothingApplied: {
        algorithm: this.config.smoothing.algorithm,
        factor: this.config.smoothing.factor,
        windowSize: this.config.smoothing.windowSize,
      },
      rangeInfo: {
        strategy: 'default',
        originalMin: 0,
        originalMax: 0,
        optimizedMin: 0,
        optimizedMax: 1.0,
        outlierCount: 0,
      },
      performance: {
        dataUtilization: 0,
        outlierHandling: 1,
        gridEfficiency: 1,
      },
    };
  }

  /**
   * Get current configuration
   */
  public getConfig(): RadarAutoTuneConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<RadarAutoTuneConfig>): void {
    this.config = this.mergeConfig(newConfig);
  }
}

/**
 * Hook for radar auto-tuning
 */
export function useRadarAutoTuner(config?: Partial<RadarAutoTuneConfig>) {
  const tuner = useMemo(() => new RadarAutoTuner(config), [config]);

  return {
    autoTune: (statMetrics: MarginalUtilityMetrics[]) => tuner.autoTune(statMetrics),
    getConfig: () => tuner.getConfig(),
    updateConfig: (newConfig: Partial<RadarAutoTuneConfig>) => tuner.updateConfig(newConfig),
  };
}
