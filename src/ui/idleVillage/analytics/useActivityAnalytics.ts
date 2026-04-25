/**
 * React hook for Idle Village Activity Analytics.
 * Provides real-time aggregation, telemetry emission, and dashboard data management.
 */

import { useEffect, useState, useCallback } from 'react';
import { IdleVillageActivityStore } from './IdleVillageActivityStore';
import type { 
  ActivityAnalyticsEvent, 
  ActivityAnalyticsMetrics, 
  AnalyticsRetentionConfig,
  ActivityAnalyticsDashboardConfig,
  AnalyticsThresholds,
  ActivityType
} from './activityTelemetryConfig';

/**
 * Hook return type for activity analytics.
 */
export interface UseActivityAnalyticsReturn {
  /** Current aggregated metrics */
  metrics: ActivityAnalyticsMetrics | null;
  /** Whether metrics are currently loading */
  isLoading: boolean;
  /** Last error that occurred */
  error: string | null;
  /** Store statistics for debugging */
  storeStats: {
    eventCount: number;
    lastEventTimestamp: number | null;
    sessionId: string;
    cacheAge: number;
    retentionAge: number;
  } | null;
  /** Record a new analytics event */
  recordEvent: (event: Omit<ActivityAnalyticsEvent, 'id' | 'sessionId' | 'timestamp'>) => Promise<void>;
  /** Force refresh metrics cache */
  refreshMetrics: () => Promise<void>;
  /** Clear all analytics data */
  clearAllData: () => Promise<void>;
  /** Get events by activity type */
  getEventsByActivityType: (activityType: ActivityType) => ActivityAnalyticsEvent[];
  /** Get events by time range */
  getEventsByTimeRange: (startTime: number, endTime: number) => ActivityAnalyticsEvent[];
  /** Get events by resident */
  getEventsByResident: (residentId: string) => ActivityAnalyticsEvent[];
  /** Check if metrics exceed thresholds */
  checkThresholds: (thresholds: AnalyticsThresholds) => {
    isAboveThresholds: boolean;
    violations: Array<{
      metric: string;
      value: number;
      threshold: number;
      severity: 'warning' | 'error';
    }>;
  };
}

/**
 * Props for useActivityAnalytics hook.
 */
export interface UseActivityAnalyticsProps {
  /** Retention configuration for the analytics store */
  retentionConfig?: AnalyticsRetentionConfig;
  /** Dashboard configuration */
  dashboardConfig?: ActivityAnalyticsDashboardConfig;
  /** Whether to enable automatic metrics refresh */
  enableAutoRefresh?: boolean;
  /** Auto refresh interval in milliseconds */
  autoRefreshInterval?: number;
  /** Whether to emit telemetry events */
  enableTelemetry?: boolean;
}

/**
 * Default retention configuration.
 */
const DEFAULT_RETENTION: AnalyticsRetentionConfig = {
  maxEventAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  maxEventCount: 10000,
  aggregationWindowMs: 60 * 60 * 1000, // 1 hour
  cleanupIntervalMs: 60 * 60 * 1000, // 1 hour
  enableAutoCleanup: false, // Disabled to comply with sandbox rules
};

/**
 * Emits telemetry events to sandbox diagnostics.
 */
function emitTelemetryEvent(eventType: string, data: Record<string, unknown>): void {
  try {
    // Emit to sandbox diagnostics if available
    if (typeof window !== 'undefined') {
      const windowObj = window as unknown;
      const windowRecord = windowObj as Record<string, unknown>;
      if (windowRecord.sandboxDiagnostics) {
        const diagnostics = windowRecord.sandboxDiagnostics as {
          emit: (type: string, payload: unknown) => void;
        };
        diagnostics.emit(eventType, data);
      }
    }
  } catch (error) {
    console.warn('[useActivityAnalytics] Failed to emit telemetry:', error);
  }
}

/**
 * React hook for Idle Village Activity Analytics.
 * 
 * Provides a complete analytics system with:
 * - Real-time event recording and aggregation
 * - Configurable retention policies
 * - Dashboard-ready metrics
 * - Telemetry integration
 * - Threshold monitoring
 * 
 * @param props - Hook configuration options
 * @returns Analytics API and state
 */
export function useActivityAnalytics(props: UseActivityAnalyticsProps = {}): UseActivityAnalyticsReturn {
  const {
    retentionConfig = DEFAULT_RETENTION,
    enableTelemetry = true,
  } = props;

  // Store instance
  const [store] = useState(() => new IdleVillageActivityStore(retentionConfig));
  
  // State management
  const [metrics, setMetrics] = useState<ActivityAnalyticsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize store
  useEffect(() => {
    let mounted = true;

    const initializeStore = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await store.initialize();
        
        if (mounted) {
          setIsLoading(false);
          
          // Load initial metrics
          await refreshMetrics();
          
          // Emit initialization telemetry
          if (enableTelemetry) {
            emitTelemetryEvent('activity_analytics_initialized', {
              sessionId: store.getStoreStats().sessionId,
              retentionConfig,
            });
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize analytics store');
          setIsLoading(false);
        }
      }
    };

    initializeStore();

    return () => {
      mounted = false;
      store.destroy();
    };
  }, [store, retentionConfig, enableTelemetry]);

  // Note: Auto-refresh disabled to comply with sandbox timer rules
  // Manual refresh can be triggered via refreshMetrics function

  // Update store stats periodically (disabled for sandbox compliance)
  // Note: Stats update disabled - use manual refresh via refreshMetrics

  // Refresh metrics function
  const refreshMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const freshMetrics = await store.calculateMetrics();
      setMetrics(freshMetrics);
      setError(null);
      
      // Emit telemetry for metrics refresh
      if (enableTelemetry) {
        emitTelemetryEvent('activity_analytics_metrics_refreshed', {
          eventCount: freshMetrics.eventsByType,
          completionRates: freshMetrics.completionRates,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh metrics';
      setError(errorMessage);
      console.error('[useActivityAnalytics] Failed to refresh metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [store, enableTelemetry]);

  // Record event function
  const recordEvent = useCallback(async (
    event: Omit<ActivityAnalyticsEvent, 'id' | 'sessionId' | 'timestamp'>
  ) => {
    try {
      await store.addEvent(event);
      
      // Emit telemetry for event recording
      if (enableTelemetry) {
        emitTelemetryEvent('activity_analytics_event_recorded', {
          eventType: event.type,
          activityType: event.activityType,
          activityId: event.activityId,
          residentId: event.residentId,
        });
      }
      
      // Refresh metrics after event recording
      await refreshMetrics();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record event';
      setError(errorMessage);
      console.error('[useActivityAnalytics] Failed to record event:', err);
    }
  }, [store, enableTelemetry, refreshMetrics]);

  // Clear all data function
  const clearAllData = useCallback(async () => {
    try {
      await store.clearAllData();
      setMetrics(null);
      setError(null);
      
      // Emit telemetry for data clear
      if (enableTelemetry) {
        emitTelemetryEvent('activity_analytics_data_cleared', {
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      console.error('[useActivityAnalytics] Failed to clear data:', err);
    }
  }, [store, enableTelemetry]);

  // Get events by activity type
  const getEventsByActivityType = useCallback((activityType: ActivityType) => {
    try {
      return store.getEventsByActivityType(activityType);
    } catch (err) {
      console.error('[useActivityAnalytics] Failed to get events by activity type:', err);
      return [];
    }
  }, [store]);

  // Get events by time range
  const getEventsByTimeRange = useCallback((startTime: number, endTime: number) => {
    try {
      return store.getEventsByTimeRange(startTime, endTime);
    } catch (err) {
      console.error('[useActivityAnalytics] Failed to get events by time range:', err);
      return [];
    }
  }, [store]);

  // Get events by resident
  const getEventsByResident = useCallback((residentId: string) => {
    try {
      return store.getEventsByResident(residentId);
    } catch (err) {
      console.error('[useActivityAnalytics] Failed to get events by resident:', err);
      return [];
    }
  }, [store]);

  // Check thresholds function
  const checkThresholds = useCallback((thresholds: AnalyticsThresholds) => {
    if (!metrics) {
      return {
        isAboveThresholds: false,
        violations: [],
      };
    }

    const violations: Array<{
      metric: string;
      value: number;
      threshold: number;
      severity: 'warning' | 'error';
    }> = [];

    // Check completion rates
    Object.entries(metrics.completionRates).forEach(([activityType, rate]) => {
      if (rate < thresholds.minCompletionRate) {
        violations.push({
          metric: `completionRate_${activityType}`,
          value: rate,
          threshold: thresholds.minCompletionRate,
          severity: 'error',
        });
      }
    });

    // Check failure rates
    Object.entries(metrics.failureRates).forEach(([activityType, rate]) => {
      if (rate > thresholds.maxFailureRate) {
        violations.push({
          metric: `failureRate_${activityType}`,
          value: rate,
          threshold: thresholds.maxFailureRate,
          severity: 'error',
        });
      }
    });

    // Check completion times
    Object.entries(metrics.averageCompletionTimes).forEach(([activityType, time]) => {
      if (time > thresholds.maxAverageCompletionTime) {
        violations.push({
          metric: `completionTime_${activityType}`,
          value: time,
          threshold: thresholds.maxAverageCompletionTime,
          severity: 'warning',
        });
      }
    });

    // Check risk metrics
    if (metrics.riskMetrics.averageRiskScore > thresholds.highRiskThreshold) {
      violations.push({
        metric: 'averageRiskScore',
        value: metrics.riskMetrics.averageRiskScore,
        threshold: thresholds.highRiskThreshold,
        severity: 'warning',
      });
    }

    // Check fatigue impact
    if (metrics.fatigueMetrics.fatigueImpactByActivityType.job > thresholds.fatigueImpactThreshold) {
      violations.push({
        metric: 'fatigueImpact_job',
        value: metrics.fatigueMetrics.fatigueImpactByActivityType.job,
        threshold: thresholds.fatigueImpactThreshold,
        severity: 'warning',
      });
    }

    return {
      isAboveThresholds: violations.length > 0,
      violations,
    };
  }, [metrics]);

  return {
    metrics,
    isLoading,
    error,
    storeStats: store.getStoreStats(),
    recordEvent,
    refreshMetrics,
    clearAllData,
    getEventsByActivityType,
    getEventsByTimeRange,
    getEventsByResident,
    checkThresholds,
  };
}
