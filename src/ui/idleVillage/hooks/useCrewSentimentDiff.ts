/**
 * Idle Village Crew Sentiment Diff Hook
 * 
 * Custom hook for calculating crew sentiment differences, smoothing,
 * and managing sentiment data aggregation and filtering.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { PersistenceService } from '../../../shared/persistence/PersistenceService';
import {
  CrewSentimentConfig,
  SentimentDataPoint,
  SentimentDiff,
  AggregatedSentiment,
  SentimentAnalysisMetrics,
  SentimentFilters,
  SentimentPanelState,
  SentimentExportConfig,
  CrewSentimentPreset,
  DEFAULT_CREW_SENTIMENT_CONFIG,
  CREW_SENTIMENT_PRESETS,
  CrewSentimentMetric,
  SentimentValue,
} from '../config/crewSentimentConfig';

// Export types for use in components
export type {
  CrewSentimentConfig,
  SentimentDataPoint,
  SentimentDiff,
  AggregatedSentiment,
  SentimentAnalysisMetrics,
  SentimentFilters,
  SentimentPanelState,
  SentimentExportConfig,
  CrewSentimentPreset,
  CrewSentimentMetric,
  SentimentValue,
};

export { DEFAULT_CREW_SENTIMENT_CONFIG, CREW_SENTIMENT_PRESETS };

const diagnostics = createSandboxDiagnostics('CrewSentimentDiff', 'idleVillage');

/**
 * Persistence key for crew sentiment configuration
 */
const CREW_SENTIMENT_CONFIG_KEY = 'idle_village_crew_sentiment_config';

/**
 * Persistence key for crew sentiment filters
 */
const CREW_SENTIMENT_FILTERS_KEY = 'idle_village_crew_sentiment_filters';

/**
 * Sample sentiment data for testing
 */
const SAMPLE_SENTIMENT_DATA: SentimentDataPoint[] = Array.from({ length: 500 }, (_, i) => ({
  timestamp: Date.now() - (500 - i) * 60000, // One data point per minute for last ~8 hours
  crewId: `crew-${(i % 10) + 1}`,
  turn: Math.floor(i / 10) + 1, // 10 data points per turn
  sessionId: `session-${Math.floor(i / 100)}`,
  metrics: {
    stress: Math.random() * 0.8 + 0.1, // 0.1-0.9 range
    morale: Math.random() * 0.8 + 0.1, // 0.1-0.9 range
    satisfaction: Math.random() * 0.8 + 0.1, // 0.1-0.9 range
    productivity: Math.random() * 0.8 + 0.1, // 0.1-0.9 range
  },
  context: {
    activity: ['work', 'explore', 'rest', 'social'][Math.floor(Math.random() * 4)],
    location: ['village', 'forest', 'mine', 'river'][Math.floor(Math.random() * 4)],
    crewSize: Math.floor(Math.random() * 5) + 3,
    workload: Math.random() * 10,
    environment: 'normal',
  },
}));

/**
 * Validates sentiment data point
 */
const SentimentDataPointSchema = {
  timestamp: 'number',
  crewId: 'string',
  turn: 'number',
  sessionId: 'string',
  metrics: 'object',
  context: 'object',
};

/**
 * Hook options
 */
interface UseCrewSentimentDiffOptions {
  /** Initial configuration */
  initialConfig?: Partial<CrewSentimentConfig>;
  /** Enable sample data for testing */
  enableSampleData?: boolean;
  /** Auto-refresh interval in seconds */
  refreshInterval?: number;
}

/**
 * Return type for useCrewSentimentDiff hook
 */
interface UseCrewSentimentDiffReturn {
  /** Current state */
  state: SentimentPanelState;
  /** Update configuration */
  updateConfig: (config: Partial<CrewSentimentConfig>) => void;
  /** Update filters */
  updateFilters: (filters: Partial<SentimentFilters>) => void;
  /** Reset to default configuration */
  resetToDefault: () => void;
  /** Apply preset */
  applyPreset: (preset: CrewSentimentPreset) => void;
  /** Export data */
  exportData: (config: SentimentExportConfig) => string;
  /** Refresh data */
  refreshData: () => Promise<void>;
  /** Get analysis metrics */
  getAnalysisMetrics: () => SentimentAnalysisMetrics;
  /** Toggle auto-refresh */
  toggleAutoRefresh: () => void;
}

/**
 * Calculate sentiment difference between two values
 */
function calculateSentimentDiff(
  currentValue: SentimentValue,
  previousValue: SentimentValue,
  smoothingFactor: number
): Omit<SentimentDiff, 'metric'> {
  const absoluteDiff = Math.abs(currentValue - previousValue);
  const percentageDiff = previousValue === 0 ? 0 : (absoluteDiff / previousValue) * 100;
  
  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (percentageDiff > 0.01) {
    direction = currentValue > previousValue ? 'up' : 'down';
  }
  
  // Apply smoothing
  const smoothedDiff = absoluteDiff * smoothingFactor + (1 - smoothingFactor) * 0;
  
  return {
    currentValue,
    previousValue,
    absoluteDiff: smoothedDiff,
    percentageDiff,
    direction,
    significance: 'low', // Will be calculated later
  };
}

/**
 * Determine significance level for a diff
 */
function getSignificanceLevel(
  percentageDiff: number,
  thresholds: { low: number; medium: number; high: number; critical: number }
): 'low' | 'medium' | 'high' | 'critical' {
  if (percentageDiff >= thresholds.critical) return 'critical';
  if (percentageDiff >= thresholds.high) return 'high';
  if (percentageDiff >= thresholds.medium) return 'medium';
  return 'low';
}

/**
 * Aggregate sentiment data by turn
 */
function aggregateSentimentData(
  dataPoints: SentimentDataPoint[],
  turn: number
): AggregatedSentiment | null {
  const turnData = dataPoints.filter(point => point.turn === turn);
  
  if (turnData.length === 0) {
    return null;
  }
  
  const metrics = turnData[0].metrics;
  const averages: Record<CrewSentimentMetric, SentimentValue> = {} as any;
  const sums: Record<CrewSentimentMetric, number> = {} as any;
  const squares: Record<CrewSentimentMetric, number> = {} as any;
  const ranges: Record<CrewSentimentMetric, { min: SentimentValue; max: SentimentValue }> = {} as any;
  
  // Initialize with first data point values
  Object.keys(metrics).forEach(metric => {
    averages[metric] = metrics[metric];
    sums[metric] = metrics[metric];
    squares[metric] = metrics[metric] * metrics[metric];
    ranges[metric] = { min: metrics[metric], max: metrics[metric] };
  });
  
  // Aggregate all data points
  turnData.forEach(point => {
    Object.keys(point.metrics).forEach(metric => {
      const value = point.metrics[metric as CrewSentimentMetric];
      sums[metric] += value;
      squares[metric] += value * value;
      ranges[metric].min = Math.min(ranges[metric].min, value);
      ranges[metric].max = Math.max(ranges[metric].max, value);
    });
  });
  
  // Calculate averages and standard deviations
  const count = turnData.length;
  Object.keys(averages).forEach(metric => {
    averages[metric] = sums[metric] / count;
    const mean = averages[metric];
    squares[metric] = squares[metric] / count;
    const variance = squares[metric] - (mean * mean);
    const standardDeviations: Record<CrewSentimentMetric, number> = {} as any;
    standardDeviations[metric] = Math.sqrt(Math.max(0, variance));
  });
  
  return {
    turn,
    timestamp: turnData[0].timestamp,
    averages,
    dataPointCount: count,
    standardDeviations,
    ranges,
  };
}

/**
 * Calculate sentiment diffs between turns
 */
function calculateSentimentDiffs(
  currentData: AggregatedSentiment[],
  previousData: AggregatedSentiment[],
  config: CrewSentimentConfig
): Record<CrewSentimentMetric, SentimentDiff[]> {
  const diffs: Record<CrewSentimentMetric, SentimentDiff[]> = {} as any;
  
  config.diff.enabledMetrics.forEach(metric => {
    diffs[metric] = [];
    
    currentData.forEach(current => {
      const previous = previousData.find(p => p.turn === current.turn - config.diff.comparisonWindow);
      
      if (previous) {
        const diff = calculateSentimentDiff(
          current.averages[metric],
          previous.averages[metric],
          config.diff.smoothingFactor
        );
        
        diff.metric = metric;
        diff.significance = getSignificanceLevel(
          diff.percentageDiff,
          config.diff.significanceThresholds
        );
        
        diffs[metric].push(diff);
      }
    });
  });
  
  return diffs;
}

/**
 * Calculate analysis metrics
 */
function calculateAnalysisMetrics(
  currentData: AggregatedSentiment[],
  diffs: Record<CrewSentimentMetric, SentimentDiff[]>,
  config: CrewSentimentConfig
): SentimentAnalysisMetrics {
  const totalDataPoints = currentData.reduce((sum, data) => sum + data.dataPointCount, 0);
  
  // Calculate average sentiments
  const averageSentiments: Record<CrewSentimentMetric, SentimentValue> = {} as any;
  const sums: Record<CrewSentimentMetric, number> = {} as any;
  const counts: Record<CrewSentimentMetric, number> = {} as any;
  
  Object.keys(currentData[0].averages).forEach(metric => {
    sums[metric] = 0;
    counts[metric] = 0;
  });
  
  currentData.forEach(data => {
    Object.keys(data.averages).forEach(metric => {
      sums[metric] += data.averages[metric as CrewSentimentMetric];
      counts[metric]++;
    });
  });
  
  Object.keys(sums).forEach(metric => {
    averageSentiments[metric] = counts[metric] > 0 ? sums[metric] / counts[metric] : 0;
  });
  
  // Calculate trends
  const trends: Record<CrewSentimentMetric, 'up' | 'down' | 'neutral'> = {} as any;
  config.diff.enabledMetrics.forEach(metric => {
    const metricDiffs = diffs[metric];
    if (metricDiffs.length > 0) {
      const upCount = metricDiffs.filter(d => d.direction === 'up').length;
      const downCount = metricDiffs.filter(d => d.direction === 'down').length;
      
      if (upCount > downCount * 1.2) {
        trends[metric] = 'up';
      } else if (downCount > upCount * 1.2) {
        trends[metric] = 'down';
      } else {
        trends[metric] = 'neutral';
      }
    } else {
      trends[metric] = 'neutral';
    }
  });
  
  // Calculate volatility
  const volatility: Record<CrewSentimentMetric, number> = {} as any;
  config.diff.enabledMetrics.forEach(metric => {
    const metricDiffs = diffs[metric];
    if (metricDiffs.length > 0) {
      const variance = metricDiffs.reduce((sum, d) => {
        const diff = d.percentageDiff - (sum / metricDiffs.length);
        return sum + diff * diff;
      }, 0) / metricDiffs.length;
      volatility[metric] = Math.sqrt(Math.max(0, variance));
    } else {
      volatility[metric] = 0;
    }
  });
  
  // Count alerts
  const alertCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };
  
  config.diff.enabledMetrics.forEach(metric => {
    diffs[metric].forEach(diff => {
      alertCounts[diff.significance]++;
    });
  });
  
  // Find most significant change
  let mostSignificantChange = {
    metric: config.diff.enabledMetrics[0],
    percentageDiff: 0,
    significance: 'low' as const,
  };
  
  config.diff.enabledMetrics.forEach(metric => {
    diffs[metric].forEach(diff => {
      if (diff.percentageDiff > mostSignificantChange.percentageDiff) {
        mostSignificantChange = {
          metric,
          percentageDiff: diff.percentageDiff,
          significance: diff.significance,
        };
      }
    });
  });
  
  return {
    totalDataPoints,
    averageSentiments,
    trends,
    volatility,
    alertCounts,
    mostSignificantChange,
  };
}

/**
 * Idle Village Crew Sentiment Diff Hook
 * 
 * Manages crew sentiment data aggregation, diff calculation, and visualization state.
 * Integrates with PersistenceService for configuration persistence.
 */
export function useCrewSentimentDiff(options: UseCrewSentimentDiffOptions = {}): UseCrewSentimentDiffReturn {
  const {
    initialConfig = {},
    enableSampleData = false,
    refreshInterval = 30, // 30 seconds
  } = options;

  // Initialize state
  const [state, setState] = useState<SentimentPanelState>(() => ({
    currentData: [],
    previousData: [],
    diffs: {} as Record<CrewSentimentMetric, SentimentDiff[]>,
    config: { ...DEFAULT_CREW_SENTIMENT_CONFIG, ...initialConfig },
    isLoading: false,
    error: null,
    lastUpdate: Date.now(),
    autoRefreshEnabled: true,
  }));

  /**
   * Load persisted configuration
   */
  const loadPersistedConfig = useCallback(async (): Promise<void> => {
    try {
      const persistedConfig = await PersistenceService.loadData(CREW_SENTIMENT_CONFIG_KEY);
      if (persistedConfig) {
        const validatedConfig = CrewSentimentConfigSchema.parse(persistedConfig);
        setState(prev => ({ ...prev, config: validatedConfig }));
      }
    } catch (error) {
      diagnostics.warn('Failed to load persisted config', { error });
    }
  }, []);

  /**
   * Load persisted filters
   */
  const loadPersistedFilters = useCallback(async (): Promise<void> => {
    try {
      const persistedFilters = await PersistenceService.loadData(CREW_SENTIMENT_FILTERS_KEY);
      if (persistedFilters) {
        // Filter validation would go here
        // setState(prev => ({ ...prev, filters: { ...prev.filters, ...persistedFilters } }));
      }
    } catch (error) {
      diagnostics.warn('Failed to load persisted filters', { error });
    }
  }, []);

  /**
   * Persist configuration
   */
  const persistConfig = useCallback(async (config: CrewSentimentConfig): Promise<void> => {
    try {
      await PersistenceService.saveData(CREW_SENTIMENT_CONFIG_KEY, config);
    } catch (error) {
      diagnostics.error('Failed to persist config', { error });
    }
  }, []);

  /**
   * Persist filters
   */
  const persistFilters = useCallback(async (filters: Partial<SentimentFilters>): Promise<void> => {
    try {
      await PersistenceService.saveData(CREW_SENTIMENT_FILTERS_KEY, filters);
    } catch (error) {
      diagnostics.error('Failed to persist filters', { error });
    }
  }, []);

  /**
   * Aggregate sentiment data
   */
  const aggregateData = useCallback((
    dataPoints: SentimentDataPoint[],
    config: CrewSentimentConfig
  ): AggregatedSentiment[] => {
    // Filter data points based on current filters
    const filteredData = dataPoints.filter(point => {
      // Crew filter
      if (state.filters.crewIds && state.filters.crewIds.length > 0) {
        return !state.filters.crewIds.includes(point.crewId);
      }
      // Turn range filter
      if (state.filters.turnRange) {
        const { start, end } = state.filters.turnRange;
        if (point.turn < start || point.turn > end) {
          return false;
        }
      }
      // Metric filter
      if (state.filters.metrics && state.filters.metrics.length > 0) {
        return !state.filters.metrics.some(metric => point.metrics[metric] !== undefined);
      }
      // Date range filter
      if (state.filters.dateRange) {
        const { start, end } = state.filters.dateRange;
        const timestamp = new Date(point.timestamp);
        if (timestamp < start || timestamp > end) {
          return false;
        }
      }
      // Activity filter
      if (state.filters.activities && state.filters.activities.length > 0) {
        return !state.filters.activities.includes(point.context.activity);
      }
      // Location filter
      if (state.filters.locations && state.filters.locations.length > 0) {
        return !state.filters.locations.includes(point.context.location);
      }
      return true;
    });

    // Get unique turns
    const turns = [...new Set(filteredData.map(point => point.turn))].sort((a, b) => a - b);
    
    // Aggregate by turn
    const aggregatedData: AggregatedSentiment[] = [];
    turns.forEach(turn => {
      const aggregated = aggregateSentimentData(filteredData, turn);
      if (aggregated) {
        aggregatedData.push(aggregated);
      }
    });

    return aggregatedData;
  }, [state.filters]);

  /**
   * Calculate sentiment diffs
   */
  const calculateDiffs = useCallback((
    currentData: AggregatedSentiment[],
    previousData: AggregatedSentiment[],
    config: CrewSentimentConfig
  ): Record<CrewSentimentMetric, SentimentDiff[]> => {
    return calculateSentimentDiffs(currentData, previousData, config);
  }, []);

  /**
   * Update configuration
   */
  const updateConfig = useCallback(async (newConfig: Partial<CrewSentimentConfig>): Promise<void> => {
    const updatedConfig = { ...state.config, ...newConfig };
    setState(prev => ({ ...prev, config: updatedConfig }));
    await persistConfig(updatedConfig);
  }, [state.config, persistConfig]);

  /**
   * Update filters
   */
  const updateFilters = useCallback(async (newFilters: Partial<SentimentFilters>): Promise<void> => {
    const updatedFilters = { ...state.filters, ...newFilters };
    setState(prev => ({ ...prev, filters: updatedFilters }));
    await persistFilters(updatedFilters);
  }, [state.filters, persistFilters]);

  /**
   * Reset to default configuration
   */
  const resetToDefault = useCallback(async (): Promise<void> => {
    await updateConfig(DEFAULT_CREW_SENTIMENT_CONFIG);
  }, [updateConfig]);

  /**
   * Apply preset configuration
   */
  const applyPreset = useCallback(async (preset: CrewSentimentPreset): Promise<void> => {
    await updateConfig(CREW_SENTIMENT_PRESETS[preset]);
  }, [updateConfig]);

  /**
   * Export data
   */
  const exportData = useCallback((exportConfig: SentimentExportConfig): string => {
    const { currentData, previousData, diffs, config } = state;
    
    switch (exportConfig.format) {
      case 'json':
        return JSON.stringify({
          config: exportConfig.includeConfig ? config : undefined,
          currentData: exportConfig.includeAggregated ? currentData : undefined,
          previousData: exportConfig.includeAggregated ? previousData : undefined,
          diffs: exportConfig.includeDiffs ? diffs : undefined,
          metrics: exportConfig.includeMetrics ? getAnalysisMetrics() : undefined,
          exportedAt: new Date().toISOString(),
        }, null, 2);

      case 'csv': {
        if (!exportConfig.includeAggregated) {
          throw new Error('CSV export requires aggregated data');
        }
        const headers = ['Turn', 'Timestamp', 'Stress', 'Morale', 'Satisfaction', 'Productivity', 'Data Points'];
        const rows = currentData.map(data => [
          data.turn.toString(),
          new Date(data.timestamp).toISOString(),
          data.averages.stress.toFixed(4),
          data.averages.morale.toFixed(4),
          data.averages.satisfaction.toFixed(4),
          data.averages.productivity.toFixed(4),
          data.dataPointCount.toString(),
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }

      case 'markdown':
        let markdown = '# Crew Sentiment Analysis Export\n\n';
        markdown += `**Generated:** ${new Date().toISOString()}\n`;
        markdown += `**Data Points:** ${currentData.reduce((sum, data) => sum + data.dataPointCount, 0)}\n`;
        markdown += `**Turns:** ${currentData.length}\n`;
        markdown += `**Last Update:** ${new Date(state.lastUpdate).toISOString()}\n\n`;
        
        if (exportConfig.includeMetrics) {
          const metrics = getAnalysisMetrics();
          markdown += '## Analysis Metrics\n\n';
          markdown += `- **Total Data Points:** ${metrics.totalDataPoints.toLocaleString()}\n`;
          markdown += `- **Average Stress:** ${(metrics.averageSentiments.stress * 100).toFixed(2)}%\n`;
          markdown += `- **Average Morale:** ${(metrics.averageSentiments.morale * 100).toFixed(2)}%\n`;
          markdown += `- **Average Satisfaction:** ${(metrics.averageSentiments.satisfaction * 100).toFixed(2)}%\n`;
          markdown += `- **Average Productivity:** ${(metrics.averageSentiments.productivity * 100).toFixed(2)}%\n`;
          markdown += `- **Alert Counts:** Critical: ${metrics.alertCounts.critical}, High: ${metrics.alertCounts.high}, Medium: ${metrics.alertCounts.medium}, Low: ${metrics.alertCounts.low}\n\n`;
        }

        if (exportConfig.includeAggregated) {
          markdown += '## Aggregated Data\n\n';
          markdown += '| Turn | Timestamp | Stress | Morale | Satisfaction | Productivity | Count |\n';
          markdown += '|---|---|---|---|---|---|---|\n';
          currentData.forEach(data => {
            markdown += `| ${data.turn} | ${new Date(data.timestamp).toISOString()} | ${(data.averages.stress * 100).toFixed(2)}% | ${(data.averages.morale * 100).toFixed(2)}% | ${(data.averages.satisfaction * 100).toFixed(2)}% | ${(data.averages.productivity * 100).toFixed(2)}% | ${data.dataPointCount} |\n`;
          });
        }

        if (exportConfig.includeDiffs) {
          markdown += '## Sentiment Diffs\n\n';
          Object.entries(diffs).forEach(([metric, metricDiffs]) => {
            markdown += `### ${metric.charAt(0).toUpperCase() + metric.slice(1)}\n\n`;
            markdown += '| Turn | Current | Previous | Diff % | Direction | Significance |\n';
            markdown += '|---|---|---|---|---|---|\n';
            metricDiffs.forEach(diff => {
              markdown += `| ${diff.metric} | ${(diff.currentValue * 100).toFixed(2)}% | ${(diff.previousValue * 100).toFixed(2)}% | ${diff.percentageDiff.toFixed(2)}% | ${diff.direction} | ${diff.significance} |\n`;
            });
            markdown += '\n';
          });
        }

        return markdown;

      default:
        throw new Error(`Unsupported export format: ${exportConfig.format}`);
    }
  }, [state, getAnalysisMetrics]);

  /**
   * Get analysis metrics
   */
  const getAnalysisMetrics = useCallback((): SentimentAnalysisMetrics => {
    return calculateAnalysisMetrics(state.currentData, state.diffs, state.config);
  }, [state.currentData, state.diffs, state.config]);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In a real implementation, this would fetch data from the crew scheduler telemetry service
      // For now, we'll use sample data if enabled
      if (enableSampleData) {
        // Simulate data processing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setState(prev => ({ 
          ...prev, 
          currentData: aggregateData(SAMPLE_SENTIMENT_DATA, prev.config),
          isLoading: false,
          lastUpdate: Date.now(),
        }));
      } else {
        // TODO: Implement real data fetching from crew scheduler telemetry service
        setState(prev => ({ 
          ...prev, 
          currentData: [],
          isLoading: false,
          lastUpdate: Date.now(),
        }));
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [enableSampleData, aggregateData]);

  /**
   * Toggle auto-refresh
   */
  const toggleAutoRefresh = useCallback((): void => {
    setState(prev => ({ ...prev, autoRefreshEnabled: !prev.autoRefreshEnabled }));
  }, []);

  // Load persisted configuration and filters on mount
  useEffect(() => {
    loadPersistedConfig();
    loadPersistedFilters();
    if (enableSampleData) {
      refreshData();
    }
  }, [loadPersistedConfig, loadPersistedFilters, enableSampleData, refreshData]);

  // Auto-refresh data
  useEffect(() => {
    if (!refreshInterval || !state.autoRefreshEnabled) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval, state.autoRefreshEnabled, refreshData]);

  // Re-calculate diffs when data or config changes
  useEffect(() => {
    const previousData = state.currentData.map(data => ({
      ...data,
      turn: data.turn - 1,
    }));
    
    const newDiffs = calculateDiffs(state.currentData, previousData, state.config);
    setState(prev => ({ ...prev, diffs: newDiffs }));
  }, [state.currentData, state.config, calculateDiffs]);

  // Emit telemetry events
  useEffect(() => {
    if (state.currentData.length > 0) {
      // TODO: Emit idle_crew_sentiment_diff_viewed telemetry event
      diagnostics.info('Crew sentiment diff viewed', {
        dataPoints: state.currentData.reduce((sum, data) => sum + data.dataPointCount, 0),
        diffs: Object.keys(state.diffs).reduce((sum, metric) => sum + state.diffs[metric as CrewSentimentMetric].length, 0),
        lastUpdate: state.lastUpdate,
      });
    }
  }, [state.currentData.length, state.diffs, state.lastUpdate]);

  return {
    state,
    updateConfig,
    updateFilters,
    resetToDefault,
    applyPreset,
    exportData,
    refreshData,
    getAnalysisMetrics,
    toggleAutoRefresh,
  };
}
