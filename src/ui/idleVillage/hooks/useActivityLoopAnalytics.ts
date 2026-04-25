/**
 * Idle Village Activity Loop Analytics Hook
 * 
 * Custom hook for calculating activity loop bottlenecks, throughput metrics,
 * and managing activity loop data aggregation and filtering.
 */

import { useState, useEffect, useCallback } from 'react';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import { PersistenceService } from '../../../shared/persistence/PersistenceService';
import { 
  DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG,
  ACTIVITY_LOOP_PRESETS,
} from '../analytics/activityLoopAnalyzerConfig';
import type {
  ActivityLoopAnalyzerConfig,
  ActivityLoopEvent,
  ActivityLoopMetrics,
  ActivityBottleneck,
  ActivityLoopFilters,
  ActivityLoopState,
  ActivityLoopExportConfig,
  ActivityLoopPreset,
  BottleneckSeverity,
} from '../analytics/activityLoopAnalyzerConfig';

// Export types for use in components
export type {
  ActivityLoopAnalyzerConfig,
  ActivityLoopEvent,
  ActivityLoopMetrics,
  ActivityBottleneck,
  ActivityLoopFilters,
  ActivityLoopState,
  ActivityLoopExportConfig,
  ActivityLoopPreset,
  BottleneckSeverity,
};

export { DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG, ACTIVITY_LOOP_PRESETS };

const diagnostics = createSandboxDiagnostics('ActivityLoopAnalytics', 'idleVillage');

/**
 * Persistence key for activity loop configuration
 */
const ACTIVITY_LOOP_CONFIG_KEY = 'idle_village_activity_loop_config';

/**
 * Persistence key for activity loop filters
 */
const ACTIVITY_LOOP_FILTERS_KEY = 'idle_village_activity_loop_filters';

/**
 * Sample activity loop data for testing
 */
const SAMPLE_ACTIVITY_LOOP_DATA: ActivityLoopEvent[] = Array.from({ length: 1000 }, (_, i) => {
  const types: ActivityLoopEvent['type'][] = ['activityStarted', 'activityCompleted', 'activityFailed', 'activityCancelled'];
  const activityTypes = ['job', 'quest', 'maintenance', 'exploration'] as const;
  
  return {
    id: `event-${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    timestamp: Date.now() - (1000 - i) * 60000, // One event per minute for last ~16 hours
    activityId: `activity-${(i % 20) + 1}`,
    activityType: activityTypes[Math.floor(Math.random() * activityTypes.length)],
    crewId: `crew-${(i % 8) + 1}`,
    sessionId: `session-${Math.floor(i / 50)}`,
    duration: Math.random() * 300 + 60, // 1-5 minutes
    metadata: {
      priority: Math.random() > 0.8 ? 'high' : 'normal',
      location: ['village', 'forest', 'mine', 'river'][Math.floor(Math.random() * 4)],
    },
    queuePosition: Math.floor(Math.random() * 10),
    backlogSize: Math.floor(Math.random() * 50) + 10,
  };
});

/**
 * Calculate activity loop metrics from events
 */
function calculateActivityLoopMetrics(events: ActivityLoopEvent[]): ActivityLoopMetrics {
  const startedEvents = events.filter(e => e.type === 'activityStarted');
  const completedEvents = events.filter(e => e.type === 'activityCompleted');
  const failedEvents = events.filter(e => e.type === 'activityFailed');
  const cancelledEvents = events.filter(e => e.type === 'activityCancelled');
  
  const totalStarted = startedEvents.length;
  const totalCompleted = completedEvents.length;
  const totalFailed = failedEvents.length;
  const totalCancelled = cancelledEvents.length;
  
  // Calculate current backlog
  const currentBacklog = Math.max(0, totalStarted - totalCompleted - totalFailed - totalCancelled);
  
  // Calculate average backlog
  const backlogSizes = events.map(e => e.backlogSize || 0).filter(size => size > 0);
  const averageBacklog = backlogSizes.length > 0 
    ? backlogSizes.reduce((sum, size) => sum + size, 0) / backlogSizes.length 
    : 0;
  
  // Calculate max backlog
  const maxBacklog = backlogSizes.length > 0 ? Math.max(...backlogSizes) : 0;
  
  // Calculate throughput rate (activities per hour)
  const timeSpan = events.length > 0 
    ? (Math.max(...events.map(e => e.timestamp)) - Math.min(...events.map(e => e.timestamp))) / (1000 * 60 * 60)
    : 1;
  const throughputRate = totalCompleted / timeSpan;
  
  // Calculate average completion time
  const completionTimes = completedEvents.map(e => e.duration || 0).filter(time => time > 0);
  const averageCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : 0;
  
  // Calculate failure rate
  const failureRate = totalStarted > 0 ? (totalFailed / totalStarted) * 100 : 0;
  
  // Calculate cancellation rate
  const cancellationRate = totalStarted > 0 ? (totalCancelled / totalStarted) * 100 : 0;
  
  // Calculate average queue wait time
  const queuePositions = events.map(e => e.queuePosition || 0).filter(pos => pos > 0);
  const averageQueueWait = queuePositions.length > 0
    ? queuePositions.reduce((sum, pos) => sum + pos, 0) / queuePositions.length
    : 0;
  
  return {
    totalStarted,
    totalCompleted,
    totalFailed,
    totalCancelled,
    currentBacklog,
    averageBacklog,
    maxBacklog,
    throughputRate,
    averageCompletionTime,
    failureRate,
    cancellationRate,
    averageQueueWait,
  };
}

/**
 * Determine bottleneck severity
 */
function getBottleneckSeverity(
  currentMetrics: ActivityLoopMetrics,
  targetMetrics: ActivityLoopMetrics,
  thresholds: ActivityLoopAnalyzerConfig['config']['alertThresholds']
): BottleneckSeverity {
  const deviations = [
    { current: currentMetrics.throughputRate, target: targetMetrics.throughputRate, weight: 0.3 },
    { current: currentMetrics.currentBacklog, target: targetMetrics.maxBacklogSize, weight: 0.25 },
    { current: currentMetrics.failureRate, target: targetMetrics.maxFailureRate, weight: 0.2 },
    { current: currentMetrics.cancellationRate, target: targetMetrics.maxCancellationRate, weight: 0.15 },
    { current: currentMetrics.averageCompletionTime, target: targetMetrics.maxAverageCompletionTime, weight: 0.1 },
  ];
  
  const totalDeviation = deviations.reduce((sum, { current, target, weight }) => {
    const deviation = target > 0 ? Math.abs((current - target) / target) * 100 : 0;
    return sum + (deviation * weight);
  }, 0);
  
  if (totalDeviation >= thresholds.critical) return 'critical';
  if (totalDeviation >= thresholds.high) return 'high';
  if (totalDeviation >= thresholds.medium) return 'medium';
  return 'low';
}

/**
 * Calculate bottleneck impact score
 */
function calculateImpactScore(
  currentMetrics: ActivityLoopMetrics,
  targetMetrics: ActivityLoopMetrics
): number {
  const factors = [
    Math.max(0, (targetMetrics.throughputRate - currentMetrics.throughputRate) / targetMetrics.throughputRate),
    Math.max(0, (currentMetrics.currentBacklog - targetMetrics.maxBacklogSize) / targetMetrics.maxBacklogSize),
    Math.max(0, (currentMetrics.failureRate - targetMetrics.maxFailureRate) / targetMetrics.maxFailureRate),
    Math.max(0, (currentMetrics.cancellationRate - targetMetrics.maxCancellationRate) / targetMetrics.maxCancellationRate),
    Math.max(0, (currentMetrics.averageCompletionTime - targetMetrics.maxAverageCompletionTime) / targetMetrics.maxAverageCompletionTime),
  ];
  
  return Math.min(100, factors.reduce((sum, factor) => sum + factor, 0) * 20);
}

/**
 * Generate bottleneck recommendations
 */
function generateRecommendations(
  bottleneck: ActivityBottleneck
): string[] {
  const recommendations: string[] = [];
  const { currentMetrics, targetMetrics, bottleneckType } = bottleneck;
  
  switch (bottleneckType) {
    case 'queue':
      if (currentMetrics.averageQueueWait > targetMetrics.maxAverageQueueWait) {
        recommendations.push('Increase queue processing capacity');
        recommendations.push('Implement priority-based queue management');
        recommendations.push('Add more workers to reduce queue wait time');
      }
      break;
      
    case 'completion':
      if (currentMetrics.throughputRate < targetMetrics.targetThroughputRate) {
        recommendations.push('Optimize activity completion workflow');
        recommendations.push('Reduce activity complexity or duration');
        recommendations.push('Implement parallel processing for compatible activities');
      }
      break;
      
    case 'failure':
      if (currentMetrics.failureRate > targetMetrics.maxFailureRate) {
        recommendations.push('Improve activity success conditions');
        recommendations.push('Add better error handling and retry mechanisms');
        recommendations.push('Review activity requirements and prerequisites');
      }
      break;
      
    case 'resource':
      if (currentMetrics.currentBacklog > targetMetrics.maxBacklogSize) {
        recommendations.push('Allocate more resources to activity processing');
        recommendations.push('Implement resource pooling and sharing');
        recommendations.push('Optimize resource allocation algorithms');
      }
      break;
  }
  
  // General recommendations
  if (currentMetrics.averageCompletionTime > targetMetrics.maxAverageCompletionTime) {
    recommendations.push('Streamline activity execution process');
    recommendations.push('Remove unnecessary steps or dependencies');
  }
  
  if (currentMetrics.cancellationRate > targetMetrics.maxCancellationRate) {
    recommendations.push('Improve activity scheduling and timing');
    recommendations.push('Reduce activity conflicts and resource competition');
  }
  
  return recommendations;
}

/**
 * Identify bottlenecks in activity loop
 */
function identifyBottlenecks(
  events: ActivityLoopEvent[],
  config: ActivityLoopAnalyzerConfig
): ActivityBottleneck[] {
  const bottlenecks: ActivityBottleneck[] = [];
  const timeWindow = config.config.analysis.timeWindowHours * 60 * 60 * 1000; // Convert to milliseconds
  const now = Date.now();
  const windowStart = now - timeWindow;
  
  // Group events by activity type
  const eventsByActivity = events.reduce((groups, event) => {
    if (!groups[event.activityType]) {
      groups[event.activityType] = [];
    }
    groups[event.activityType].push(event);
    return groups;
  }, {} as Record<string, ActivityLoopEvent[]>);
  
  Object.entries(eventsByActivity).forEach(([activityType, activityEvents]) => {
    // Filter events within time window
    const recentEvents = activityEvents.filter(event => event.timestamp >= windowStart);
    
    if (recentEvents.length < config.config.analysis.minDataPoints) {
      return; // Skip if not enough data
    }
    
    const currentMetrics = calculateActivityLoopMetrics(recentEvents);
    const targetMetrics = config.config.kpiTargets;
    
    // Determine bottleneck type
    let bottleneckType: ActivityBottleneck['bottleneckType'] = 'resource';
    if (currentMetrics.averageQueueWait > targetMetrics.maxAverageQueueWait * 1.5) {
      bottleneckType = 'queue';
    } else if (currentMetrics.throughputRate < targetMetrics.targetThroughputRate * 0.7) {
      bottleneckType = 'completion';
    } else if (currentMetrics.failureRate > targetMetrics.maxFailureRate * 1.5) {
      bottleneckType = 'failure';
    }
    
    const severity = getBottleneckSeverity(currentMetrics, targetMetrics, config.config.alertThresholds);
    const impactScore = calculateImpactScore(currentMetrics, targetMetrics);
    
    // Only include bottlenecks with significant impact
    if (impactScore >= config.config.alertThresholds.low) {
      const bottleneck: ActivityBottleneck = {
        activityId: activityType,
        activityType,
        severity,
        bottleneckType,
        currentMetrics,
        targetMetrics,
        deviationPercentage: impactScore,
        impactScore,
        recommendations: [],
        timeWindow: {
          start: windowStart,
          end: now,
          duration: timeWindow,
        },
      };
      
      bottleneck.recommendations = generateRecommendations(bottleneck);
      bottlenecks.push(bottleneck);
    }
  });
  
  // Sort by impact score (highest first)
  return bottlenecks.sort((a, b) => b.impactScore - a.impactScore);
}

/**
 * Hook options
 */
interface UseActivityLoopAnalyticsOptions {
  /** Initial configuration */
  initialConfig?: Partial<ActivityLoopAnalyzerConfig>;
  /** Enable sample data for testing */
  enableSampleData?: boolean;
  /** Auto-refresh interval in seconds */
  refreshInterval?: number;
}

/**
 * Return type for useActivityLoopAnalytics hook
 */
interface UseActivityLoopAnalyticsReturn {
  /** Current state */
  state: ActivityLoopState;
  /** Update configuration */
  updateConfig: (config: Partial<ActivityLoopAnalyzerConfig>) => void;
  /** Update filters */
  updateFilters: (filters: Partial<ActivityLoopFilters>) => void;
  /** Reset to default configuration */
  resetToDefault: () => void;
  /** Apply preset */
  applyPreset: (preset: ActivityLoopPreset) => void;
  /** Export data */
  exportData: (config: ActivityLoopExportConfig) => string;
  /** Refresh data */
  refreshData: () => Promise<void>;
  /** Get current metrics */
  getCurrentMetrics: () => ActivityLoopMetrics;
  /** Get bottlenecks */
  getBottlenecks: () => ActivityBottleneck[];
  /** Toggle auto-refresh */
  toggleAutoRefresh: () => void;
}

/**
 * Idle Village Activity Loop Analytics Hook
 * 
 * Manages activity loop bottleneck analysis, metrics calculation, and data aggregation.
 * Integrates with PersistenceService for configuration persistence.
 */
export function useActivityLoopAnalytics(options: UseActivityLoopAnalyticsOptions = {}): UseActivityLoopAnalyticsReturn {
  const {
    initialConfig = {},
    enableSampleData = false,
    refreshInterval = 30, // 30 seconds
  } = options;

  // Initialize state
  const [state, setState] = useState<ActivityLoopState>(() => ({
    events: [],
    bottlenecks: [],
    metrics: {
      totalStarted: 0,
      totalCompleted: 0,
      totalFailed: 0,
      totalCancelled: 0,
      currentBacklog: 0,
      averageBacklog: 0,
      maxBacklog: 0,
      throughputRate: 0,
      averageCompletionTime: 0,
      failureRate: 0,
      cancellationRate: 0,
      averageQueueWait: 0,
    },
    config: { ...DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG, ...initialConfig },
    filters: {},
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
      const persistedConfig = await PersistenceService.loadData(ACTIVITY_LOOP_CONFIG_KEY);
      if (persistedConfig) {
        setState(prev => ({ ...prev, config: { ...prev.config, ...persistedConfig } }));
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
      const persistedFilters = await PersistenceService.loadData(ACTIVITY_LOOP_FILTERS_KEY);
      if (persistedFilters) {
        setState(prev => ({ ...prev, filters: { ...prev.filters, ...persistedFilters } }));
      }
    } catch (error) {
      diagnostics.warn('Failed to load persisted filters', { error });
    }
  }, []);

  /**
   * Persist configuration
   */
  const persistConfig = useCallback(async (config: ActivityLoopAnalyzerConfig): Promise<void> => {
    try {
      await PersistenceService.saveData(ACTIVITY_LOOP_CONFIG_KEY, config);
    } catch (error) {
      diagnostics.error('Failed to persist config', { error });
    }
  }, []);

  /**
   * Persist filters
   */
  const persistFilters = useCallback(async (filters: Partial<ActivityLoopFilters>): Promise<void> => {
    try {
      await PersistenceService.saveData(ACTIVITY_LOOP_FILTERS_KEY, filters);
    } catch (error) {
      diagnostics.error('Failed to persist filters', { error });
    }
  }, []);

  /**
   * Filter events based on current filters
   */
  const filterEvents = useCallback((events: ActivityLoopEvent[]): ActivityLoopEvent[] => {
    return events.filter(event => {
      // Activity type filter
      if (state.filters.activityTypes && !state.filters.activityTypes.includes(event.activityType)) {
        return false;
      }
      
      // Crew filter
      if (state.filters.crewIds && !state.filters.crewIds.includes(event.crewId)) {
        return false;
      }
      
      // Time range filter
      if (state.filters.timeRange) {
        const { start, end } = state.filters.timeRange;
        const eventTime = new Date(event.timestamp);
        if (eventTime < start || eventTime > end) {
          return false;
        }
      }
      
      // Severity filter (applied to bottlenecks, not events)
      // Impact score filter (applied to bottlenecks, not events)
      
      return true;
    });
  }, [state.filters]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback(async (newConfig: Partial<ActivityLoopAnalyzerConfig>): Promise<void> => {
    const updatedConfig = { ...state.config, ...newConfig };
    setState(prev => ({ ...prev, config: updatedConfig }));
    await persistConfig(updatedConfig);
  }, [state.config, persistConfig]);

  /**
   * Update filters
   */
  const updateFilters = useCallback(async (newFilters: Partial<ActivityLoopFilters>): Promise<void> => {
    const updatedFilters = { ...state.filters, ...newFilters };
    setState(prev => ({ ...prev, filters: updatedFilters }));
    await persistFilters(updatedFilters);
  }, [state.filters, persistFilters]);

  /**
   * Reset to default configuration
   */
  const resetToDefault = useCallback(async (): Promise<void> => {
    await updateConfig(DEFAULT_ACTIVITY_LOOP_ANALYZER_CONFIG);
  }, [updateConfig]);

  /**
   * Apply preset configuration
   */
  const applyPreset = useCallback(async (preset: ActivityLoopPreset): Promise<void> => {
    await updateConfig(ACTIVITY_LOOP_PRESETS[preset]);
  }, [updateConfig]);

  /**
   * Export data
   */
  const exportData = useCallback((exportConfig: ActivityLoopExportConfig): string => {
    const { events, bottlenecks, metrics, config } = state;
    const filteredEvents = filterEvents(events);
    const filteredBottlenecks = state.filters.severityLevels 
      ? bottlenecks.filter(b => state.filters.severityLevels!.includes(b.severity))
      : bottlenecks;
    
    switch (exportConfig.format) {
        case 'json': {
          return JSON.stringify({
            config: exportConfig.includeRawEvents ? config : undefined,
            events: exportConfig.includeRawEvents ? filteredEvents : undefined,
            bottlenecks: exportConfig.includeBottlenecks ? filteredBottlenecks : undefined,
            metrics: exportConfig.includeRawEvents ? metrics : undefined,
            exportedAt: new Date().toISOString(),
          }, null, 2);
        }

        case 'csv': {
          if (!exportConfig.includeBottlenecks) {
            throw new Error('CSV export requires bottlenecks');
          }
          const headers = ['Activity Type', 'Severity', 'Bottleneck Type', 'Impact Score', 'Current Throughput', 'Target Throughput', 'Current Backlog', 'Max Backlog', 'Failure Rate', 'Recommendations'];
          const rows = filteredBottlenecks.map(b => [
            b.activityType,
            b.severity,
            b.bottleneckType,
            b.impactScore.toFixed(2),
            b.currentMetrics.throughputRate.toFixed(2),
            b.targetMetrics.targetThroughputRate.toFixed(2),
            b.currentMetrics.currentBacklog.toString(),
            b.targetMetrics.maxBacklog.toString(),
            b.currentMetrics.failureRate.toFixed(2),
            `"${b.recommendations.join('; ')}"`,
          ]);
          return [headers, ...rows].map(row => row.join(',')).join('\n');
        }

        case 'markdown': {
          let markdown = '# Activity Loop Bottleneck Analysis\n\n';
          markdown += `**Generated:** ${new Date().toISOString()}\n`;
          markdown += `**Events Analyzed:** ${filteredEvents.length}\n`;
          markdown += `**Bottlenecks Identified:** ${filteredBottlenecks.length}\n`;
          markdown += `**Last Update:** ${new Date(state.lastUpdate).toISOString()}\n\n`;
          
          if (exportConfig.includeMetrics) {
            markdown += '## Current Metrics\n\n';
            markdown += `- **Total Started:** ${metrics.totalStarted}\n`;
            markdown += `- **Total Completed:** ${metrics.totalCompleted}\n`;
            markdown += `- **Throughput Rate:** ${metrics.throughputRate.toFixed(2)} activities/hour\n`;
            markdown += `- **Current Backlog:** ${metrics.currentBacklog}\n`;
            markdown += `- **Failure Rate:** ${metrics.failureRate.toFixed(2)}%\n`;
            markdown += `- **Cancellation Rate:** ${metrics.cancellationRate.toFixed(2)}%\n\n`;
          }

          if (exportConfig.includeBottlenecks) {
            markdown += '## Identified Bottlenecks\n\n';
            filteredBottlenecks.forEach(bottleneck => {
              markdown += `### ${bottleneck.activityType} (${bottleneck.severity.toUpperCase()})\n\n`;
              markdown += `- **Type:** ${bottleneck.bottleneckType}\n`;
              markdown += `- **Impact Score:** ${bottleneck.impactScore.toFixed(2)}\n`;
              markdown += `- **Current Throughput:** ${bottleneck.currentMetrics.throughputRate.toFixed(2)} vs Target: ${bottleneck.targetMetrics.targetThroughputRate.toFixed(2)}\n`;
              markdown += `- **Current Backlog:** ${bottleneck.currentMetrics.currentBacklog} vs Max: ${bottleneck.targetMetrics.maxBacklog}\n`;
              markdown += `- **Failure Rate:** ${bottleneck.currentMetrics.failureRate.toFixed(2)}% vs Max: ${bottleneck.targetMetrics.maxFailureRate.toFixed(2)}%\n\n`;
              
              if (exportConfig.includeRecommendations && bottleneck.recommendations.length > 0) {
                markdown += '**Recommendations:**\n';
                bottleneck.recommendations.forEach(rec => {
                  markdown += `- ${rec}\n`;
                });
                markdown += '\n';
              }
            });
          }

          return markdown;
        }

        default:
          throw new Error(`Unsupported export format: ${exportConfig.format}`);
      }
  }, [state, filterEvents]);

  /**
   * Get current metrics
   */
  const getCurrentMetrics = useCallback((): ActivityLoopMetrics => {
    const filteredEvents = filterEvents(state.events);
    return calculateActivityLoopMetrics(filteredEvents);
  }, [state.events, filterEvents]);

  /**
   * Get bottlenecks
   */
  const getBottlenecks = useCallback((): ActivityBottleneck[] => {
    const filteredEvents = filterEvents(state.events);
    const allBottlenecks = identifyBottlenecks(filteredEvents, state.config);
    
    // Apply severity filter
    let filteredBottlenecks = allBottlenecks;
    if (state.filters.severityLevels) {
      filteredBottlenecks = filteredBottlenecks.filter(b => 
        state.filters.severityLevels!.includes(b.severity)
      );
    }
    
    // Apply bottleneck type filter
    if (state.filters.bottleneckTypes) {
      filteredBottlenecks = filteredBottlenecks.filter(b => 
        state.filters.bottleneckTypes!.includes(b.bottleneckType)
      );
    }
    
    // Apply minimum impact score filter
    if (state.filters.minImpactScore !== undefined) {
      filteredBottlenecks = filteredBottlenecks.filter(b => 
        b.impactScore >= state.filters.minImpactScore!
      );
    }
    
    return filteredBottlenecks;
  }, [state.events, state.config, state.filters, filterEvents]);

  /**
   * Refresh data
   */
  const refreshData = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // In a real implementation, this would fetch data from the activity telemetry service
      // For now, we'll use sample data if enabled
      if (enableSampleData) {
        // Simulate data processing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const filteredEvents = filterEvents(SAMPLE_ACTIVITY_LOOP_DATA);
        const metrics = calculateActivityLoopMetrics(filteredEvents);
        const bottlenecks = identifyBottlenecks(filteredEvents, state.config);
        
        setState(prev => ({ 
          ...prev, 
          events: SAMPLE_ACTIVITY_LOOP_DATA,
          metrics,
          bottlenecks,
          isLoading: false,
          lastUpdate: Date.now(),
        }));
      } else {
        // TODO: Implement real data fetching from activity telemetry service
        setState(prev => ({ 
          ...prev, 
          events: [],
          metrics: calculateActivityLoopMetrics([]),
          bottlenecks: [],
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
  }, [enableSampleData, filterEvents, state.config]);

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

  // Re-calculate metrics and bottlenecks when data or config changes
  useEffect(() => {
    const filteredEvents = filterEvents(state.events);
    const metrics = calculateActivityLoopMetrics(filteredEvents);
    const bottlenecks = identifyBottlenecks(filteredEvents, state.config);
    
    setState(prev => ({ ...prev, metrics, bottlenecks }));
  }, [state.events, state.config, filterEvents]);

  // Emit telemetry events
  useEffect(() => {
    if (state.bottlenecks.length > 0) {
      // TODO: Emit idle_activity_loop_bottleneck_detected telemetry event
      diagnostics.info('Activity loop bottlenecks detected', {
        bottleneckCount: state.bottlenecks.length,
        criticalCount: state.bottlenecks.filter(b => b.severity === 'critical').length,
        lastUpdate: state.lastUpdate,
      });
    }
  }, [state.bottlenecks.length, state.lastUpdate]);

  return {
    state,
    updateConfig,
    updateFilters,
    resetToDefault,
    applyPreset,
    exportData,
    refreshData,
    getCurrentMetrics,
    getBottlenecks,
    toggleAutoRefresh,
  };
}
