// src/ui/idleVillage/hooks/useActivityAnalytics.ts
// Hook for aggregating and analyzing activity data from Active HUD

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import type { ActiveHUDState, ActiveHUDActivityViewModel } from './useActiveHUDState';
import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';

/**
 * Activity analytics data point with time-based aggregation.
 */
export interface ActivityAnalyticsDataPoint {
  /** Timestamp of data point */
  timestamp: number;
  /** Total number of activities */
  totalActivities: number;
  /** Activities by type */
  activitiesByType: {
    jobs: number;
    quests: number;
    maintenance: number;
  };
  /** Average progress across all activities */
  averageProgress: number;
  /** Average remaining time across all activities */
  averageRemainingTime: number;
  /** Most common activity type */
  dominantActivityType: 'job' | 'quest' | 'maintenance' | null;
  /** Resident distribution */
  residentDistribution: Record<string, number>;
}

/**
 * Aggregated analytics metrics for activity performance.
 */
export interface ActivityAnalyticsMetrics {
  /** Current snapshot of activity state */
  currentSnapshot: ActivityAnalyticsDataPoint;
  /** Historical data points (time series) */
  historicalData: ActivityAnalyticsDataPoint[];
  /** Performance metrics over time */
  performanceMetrics: {
    /** Average number of concurrent activities */
    averageConcurrentActivities: number;
    /** Peak number of concurrent activities */
    peakConcurrentActivities: number;
    /** Activity completion rate (estimated) */
    completionRate: number;
    /** Most efficient time window */
    peakEfficiencyWindow: {
      startHour: number;
      endHour: number;
      averageActivities: number;
    };
  };
  /** Activity type distribution */
  typeDistribution: {
    jobs: {
      count: number;
      percentage: number;
      averageProgress: number;
      averageDuration: number;
    };
    quests: {
      count: number;
      percentage: number;
      averageProgress: number;
      averageDuration: number;
    };
    maintenance: {
      count: number;
      percentage: number;
      averageProgress: number;
      averageDuration: number;
    };
  };
  /** Resident efficiency metrics */
  residentEfficiency: Record<string, {
    totalActivities: number;
    averageProgress: number;
    efficiency: number; // 0-1 scale
  }>;
}

/**
 * Configuration for activity analytics aggregation.
 */
export interface ActivityAnalyticsConfig {
  /** Maximum number of historical data points to keep */
  maxHistoricalPoints: number;
  /** Interval in milliseconds for data collection */
  collectionInterval: number;
  /** Enable real-time updates */
  enableRealTimeUpdates: boolean;
  /** Enable efficiency calculations */
  enableEfficiencyMetrics: boolean;
  /** Enable resident-level analytics */
  enableResidentAnalytics: boolean;
}

/**
 * Props for useActivityAnalytics hook.
 */
export interface UseActivityAnalyticsProps {
  /** Current Active HUD state */
  hudState: ActiveHUDState;
  /** Village state for additional context */
  villageState?: VillageState;
  /** Analytics configuration */
  config?: Partial<ActivityAnalyticsConfig>;
  /** Callback for analytics updates */
  onAnalyticsUpdate?: (metrics: ActivityAnalyticsMetrics) => void;
}

/**
 * Default analytics configuration.
 */
const DEFAULT_ANALYTICS_CONFIG: ActivityAnalyticsConfig = {
  maxHistoricalPoints: 100,
  collectionInterval: 5000, // 5 seconds
  enableRealTimeUpdates: true,
  enableEfficiencyMetrics: true,
  enableResidentAnalytics: true,
};

/**
 * Hook for aggregating and analyzing activity data from Active HUD.
 * 
 * @param props - Hook props with HUD state and configuration
 * @returns Analytics metrics and data aggregation functions
 */
export function useActivityAnalytics({
  hudState,
  villageState,
  config = {},
  onAnalyticsUpdate,
}: UseActivityAnalyticsProps): {
  metrics: ActivityAnalyticsMetrics | null;
  isCollecting: boolean;
  startCollection: () => void;
  stopCollection: () => void;
  clearHistoricalData: () => void;
  exportAnalytics: () => string;
} {
  const analyticsConfig = useMemo(() => ({
    ...DEFAULT_ANALYTICS_CONFIG,
    ...config,
  }), [config]);

  const [isCollecting, setIsCollecting] = useState(false);
  const [historicalData, setHistoricalData] = useState<ActivityAnalyticsDataPoint[]>([]);
  const collectionIntervalRef = useRef<NodeJS.Timeout>();

  // Create current data point from HUD state
  const createDataPoint = useCallback((): ActivityAnalyticsDataPoint => {
    const { activities } = hudState;
    
    if (activities.length === 0) {
      return {
        timestamp: Date.now(),
        totalActivities: 0,
        activitiesByType: { jobs: 0, quests: 0, maintenance: 0 },
        averageProgress: 0,
        averageRemainingTime: 0,
        dominantActivityType: null,
        residentDistribution: {},
      };
    }

    // Aggregate by type
    const activitiesByType = activities.reduce(
      (acc, activity) => {
        acc[activity.activityType]++;
        return acc;
      },
      { jobs: 0, quests: 0, maintenance: 0 }
    );

    // Calculate averages
    const totalProgress = activities.reduce((sum, activity) => sum + activity.progress, 0);
    const totalRemainingTime = activities.reduce((sum, activity) => sum + activity.remainingSeconds, 0);
    const averageProgress = totalProgress / activities.length;
    const averageRemainingTime = totalRemainingTime / activities.length;

    // Find dominant activity type
    const dominantActivityType = (Object.entries(activitiesByType) as [keyof typeof activitiesByType, number][])
      .reduce((max, [type, count]) => count > max.count ? { type, count } : max, { type: 'jobs', count: 0 })
      .count > 0 ? activitiesByType.jobs > 0 ? 'jobs' : activitiesByType.quests > 0 ? 'quest' : 'maintenance' : null;

    // Aggregate by resident
    const residentDistribution = activities.reduce((acc, activity) => {
      acc[activity.residentId] = (acc[activity.residentId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      timestamp: Date.now(),
      totalActivities: activities.length,
      activitiesByType,
      averageProgress,
      averageRemainingTime,
      dominantActivityType,
      residentDistribution,
    };
  }, [hudState]);

  // Calculate comprehensive metrics
  const calculateMetrics = useCallback((): ActivityAnalyticsMetrics | null => {
    if (historicalData.length === 0) {
      return null;
    }

    const currentSnapshot = createDataPoint();
    const allData = [...historicalData, currentSnapshot];

    // Performance metrics
    const totalActivities = allData.reduce((sum, point) => sum + point.totalActivities, 0);
    const averageConcurrentActivities = totalActivities / allData.length;
    const peakConcurrentActivities = Math.max(...allData.map(point => point.totalActivities));

    // Estimate completion rate (based on progress)
    const completedActivities = allData.reduce((sum, point) => 
      sum + (point.averageProgress >= 1 ? point.totalActivities : 0), 0);
    const totalStartedActivities = allData.reduce((sum, point) => sum + point.totalActivities, 0);
    const completionRate = totalStartedActivities > 0 ? completedActivities / totalStartedActivities : 0;

    // Find peak efficiency window (simplified - assumes hourly patterns)
    const hourlyAggregation = allData.reduce((acc, point) => {
      const hour = new Date(point.timestamp).getHours();
      if (!acc[hour]) {
        acc[hour] = { count: 0, totalActivities: 0 };
      }
      acc[hour].count++;
      acc[hour].totalActivities += point.totalActivities;
      return acc;
    }, {} as Record<number, { count: number; totalActivities: number }>);

    const peakEfficiencyWindow = Object.entries(hourlyAggregation)
      .reduce((best, [hour, data]) => {
        const avgActivities = data.totalActivities / data.count;
        if (avgActivities > best.averageActivities) {
          return { startHour: parseInt(hour), endHour: (parseInt(hour) + 1) % 24, averageActivities: avgActivities };
        }
        return best;
      }, { startHour: 0, endHour: 1, averageActivities: 0 });

    // Type distribution analysis
    const totalByType = allData.reduce(
      (acc, point) => ({
        jobs: acc.jobs + point.activitiesByType.jobs,
        quests: acc.quests + point.activitiesByType.quests,
        maintenance: acc.maintenance + point.activitiesByType.maintenance,
      }),
      { jobs: 0, quests: 0, maintenance: 0 }
    );

    const totalTypeCount = totalByType.jobs + totalByType.quests + totalByType.maintenance;
    const typeDistribution = {
      jobs: {
        count: totalByType.jobs,
        percentage: totalTypeCount > 0 ? (totalByType.jobs / totalTypeCount) * 100 : 0,
        averageProgress: 0, // Would need more detailed tracking
        averageDuration: 0, // Would need more detailed tracking
      },
      quests: {
        count: totalByType.quests,
        percentage: totalTypeCount > 0 ? (totalByType.quests / totalTypeCount) * 100 : 0,
        averageProgress: 0,
        averageDuration: 0,
      },
      maintenance: {
        count: totalByType.maintenance,
        percentage: totalTypeCount > 0 ? (totalByType.maintenance / totalTypeCount) * 100 : 0,
        averageProgress: 0,
        averageDuration: 0,
      },
    };

    // Resident efficiency metrics
    const residentEfficiency: Record<string, { totalActivities: number; averageProgress: number; efficiency: number }> = {};
    if (analyticsConfig.enableResidentAnalytics) {
      const residentData = allData.reduce((acc, point) => {
        Object.entries(point.residentDistribution).forEach(([residentId, count]) => {
          if (!acc[residentId]) {
            acc[residentId] = { totalActivities: 0, totalProgress: 0, count: 0 };
          }
          acc[residentId].totalActivities += count;
          acc[residentId].count++;
        });
        return acc;
      }, {} as Record<string, { totalActivities: number; totalProgress: number; count: number }>);

      Object.entries(residentData).forEach(([residentId, data]) => {
        const averageProgress = data.count > 0 ? data.totalProgress / data.count : 0;
        const efficiency = Math.min(1, averageProgress * 2); // Simple efficiency calculation
        residentEfficiency[residentId] = {
          totalActivities: data.totalActivities,
          averageProgress,
          efficiency,
        };
      });
    }

    return {
      currentSnapshot,
      historicalData,
      performanceMetrics: {
        averageConcurrentActivities,
        peakConcurrentActivities,
        completionRate,
        peakEfficiencyWindow,
      },
      typeDistribution,
      residentEfficiency,
    };
  }, [createDataPoint, historicalData, analyticsConfig.enableResidentAnalytics]);

  // Start data collection
  const startCollection = useCallback(() => {
    if (isCollecting) return;
    
    setIsCollecting(true);
    
    if (analyticsConfig.enableRealTimeUpdates) {
      collectionIntervalRef.current = setInterval(() => {
        const dataPoint = createDataPoint();
        setHistoricalData(prev => {
          const updated = [...prev, dataPoint];
          // Keep only the most recent points
          return updated.slice(-analyticsConfig.maxHistoricalPoints);
        });
      }, analyticsConfig.collectionInterval);
    }
  }, [isCollecting, createDataPoint, analyticsConfig]);

  // Stop data collection
  const stopCollection = useCallback(() => {
    setIsCollecting(false);
    if (collectionIntervalRef.current) {
      clearInterval(collectionIntervalRef.current);
      collectionIntervalRef.current = undefined;
    }
  }, []);

  // Clear historical data
  const clearHistoricalData = useCallback(() => {
    setHistoricalData([]);
  }, []);

  // Export analytics data
  const exportAnalytics = useCallback((): string => {
    const metrics = calculateMetrics();
    if (!metrics) return '{}';
    
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      config: analyticsConfig,
      metrics,
      rawHistoricalData: historicalData,
    }, null, 2);
  }, [calculateMetrics, analyticsConfig, historicalData]);

  // Calculate metrics on demand
  const metrics = useMemo(() => calculateMetrics(), [calculateMetrics]);

  // Notify on analytics updates
  useEffect(() => {
    if (metrics && onAnalyticsUpdate) {
      onAnalyticsUpdate(metrics);
    }
  }, [metrics, onAnalyticsUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCollection();
    };
  }, [stopCollection]);

  return {
    metrics,
    isCollecting,
    startCollection,
    stopCollection,
    clearHistoricalData,
    exportAnalytics,
  };
}
