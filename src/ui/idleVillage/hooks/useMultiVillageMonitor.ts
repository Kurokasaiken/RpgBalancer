/**
 * Multi-Village Monitor Hook
 *
 * React hook for monitoring and comparing scheduler performance across multiple village environments.
 * Provides real-time KPI tracking, alert management, and comparative analysis.
 *
 * @module useMultiVillageMonitor
 * @since 2026-01-13
 * @author Atlas-MultiVillage
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MultiVillageSchedulerMonitor,
  VillageEnvironment,
  SchedulerKPIs,
  MonitorAlert,
  ComparativeAnalysis,
  DEFAULT_MULTI_VILLAGE_MONITOR_CONFIG,
  type MultiVillageMonitorConfig,
} from '../services/multiVillageSchedulerMonitor';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';

const diagnostics = createSandboxDiagnostics('MultiVillageMonitorHook', 'multi_village_monitor');

/**
 * Hook configuration options
 */
export interface UseMultiVillageMonitorConfig {
  /** Auto-start monitoring when hook mounts */
  autoStart?: boolean;
  /** Custom monitor configuration */
  monitorConfig?: Partial<MultiVillageMonitorConfig>;
  /** Enable telemetry logging */
  enableTelemetry?: boolean;
  /** Refresh interval for UI updates (ms) */
  refreshInterval?: number;
}

/**
 * Hook return value
 */
export interface UseMultiVillageMonitorReturn {
  // Monitor state
  isRunning: boolean;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;

  // Village management
  villages: VillageEnvironment[];
  villageKPIs: Map<string, SchedulerKPIs | null>;
  villageKPIsHistory: Map<string, SchedulerKPIs[]>;

  // Alerts and analysis
  alerts: MonitorAlert[];
  comparativeAnalysis: ComparativeAnalysis | null;
  monitorStats: {
    villagesMonitored: number;
    totalKpisCollected: number;
    activeAlerts: number;
    uptime: number;
    lastCollectionTime: number;
  } | null;

  // Actions
  startMonitoring: () => Promise<void>;
  stopMonitoring: () => void;
  registerVillage: (village: VillageEnvironment) => void;
  unregisterVillage: (villageId: string) => void;
  updateVillageState: (villageId: string, state: VillageEnvironment['state']) => void;
  resolveAlert: (alertId: string) => void;
  getLatestKPIs: (villageId: string) => SchedulerKPIs | null;
  getKPIHistory: (villageId: string, limit?: number) => SchedulerKPIs[];
  performComparativeAnalysis: (timeWindow?: number) => ComparativeAnalysis;

  // Export functions
  exportKPIs: (format?: 'json' | 'csv', timeRange?: { startTime?: number; endTime?: number }) => string;
  exportComparativeAnalysis: (timeWindow?: number, format?: 'json' | 'csv') => string;
  exportAlerts: (format?: 'json' | 'csv') => string;
  exportFullReport: (format?: 'json' | 'csv') => string;

  // Configuration
  updateConfig: (config: Partial<MultiVillageMonitorConfig>) => void;
  getConfig: () => MultiVillageMonitorConfig;

  // Utility functions
  refreshData: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing multi-village scheduler monitoring
 *
 * @param villages - Initial village environments to monitor
 * @param config - Hook configuration options
 * @returns Multi-village monitor state and actions
 *
 * @example
 * ```typescript
 * const {
 *   villages,
 *   alerts,
 *   startMonitoring,
 *   exportKPIs
 * } = useMultiVillageMonitor(villages, {
 *   autoStart: true,
 *   enableTelemetry: true
 * });
 * ```
 */
export function useMultiVillageMonitor(
  initialVillages: VillageEnvironment[] = [],
  config: UseMultiVillageMonitorConfig = {}
): UseMultiVillageMonitorReturn {
  const {
    autoStart = false,
    monitorConfig = {},
    enableTelemetry = true,
    refreshInterval = 5000, // 5 seconds
  } = config;

  // Monitor instance
  const monitor = useMemo(() => {
    return new MultiVillageSchedulerMonitor(monitorConfig);
  }, []);

  // State
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Data state
  const [villages, setVillages] = useState<VillageEnvironment[]>(initialVillages);
  const [villageKPIs, setVillageKPIs] = useState<Map<string, SchedulerKPIs | null>>(new Map());
  const [villageKPIsHistory, setVillageKPIsHistory] = useState<Map<string, SchedulerKPIs[]>>(new Map());
  const [alerts, setAlerts] = useState<MonitorAlert[]>([]);
  const [comparativeAnalysis, setComparativeAnalysis] = useState<ComparativeAnalysis | null>(null);
  const [monitorStats, setMonitorStats] = useState<UseMultiVillageMonitorReturn['monitorStats']>(null);

  // Register initial villages
  useEffect(() => {
    initialVillages.forEach(village => {
      monitor.registerVillage(village);
    });
    setVillages(monitor.getVillages());

    if (enableTelemetry) {
      diagnostics.info('Multi-village monitor hook initialized', {
        villages: initialVillages.length,
        config: monitorConfig,
      });
    }
  }, [initialVillages, monitor, monitorConfig, enableTelemetry]);

  // Auto-start monitoring
  useEffect(() => {
    if (autoStart) {
      startMonitoring();
    }

    return () => {
      monitor.stopMonitoring();
    };
  }, [autoStart]);

  // Periodic UI refresh
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isRunning, refreshInterval]);

  // Refresh data from monitor
  const refreshData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Update villages
      setVillages(monitor.getVillages());

      // Update KPIs
      const newKPIs = new Map<string, SchedulerKPIs | null>();
      const newKPIsHistory = new Map<string, SchedulerKPIs[]>();

      monitor.getVillages().forEach(village => {
        newKPIs.set(village.id, monitor.getLatestKPIs(village.id));
        newKPIsHistory.set(village.id, monitor.getKPIHistory(village.id));
      });

      setVillageKPIs(newKPIs);
      setVillageKPIsHistory(newKPIsHistory);

      // Update alerts
      setAlerts(monitor.getActiveAlerts());

      // Update stats
      setMonitorStats(monitor.getStats());

      // Update comparative analysis
      if (monitor.getVillages().length > 1) {
        setComparativeAnalysis(monitor.performComparativeAnalysis());
      }

      setLastUpdate(Date.now());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);

      if (enableTelemetry) {
        diagnostics.error('Failed to refresh monitor data', { error: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  }, [monitor, enableTelemetry]);

  // Start monitoring
  const startMonitoring = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      monitor.startMonitoring();
      setIsRunning(true);

      // Initial data refresh
      await refreshData();

      if (enableTelemetry) {
        diagnostics.info('Multi-village monitoring started', {
          villages: monitor.getVillages().length,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start monitoring';
      setError(errorMessage);
      setIsRunning(false);

      if (enableTelemetry) {
        diagnostics.error('Failed to start monitoring', { error: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  }, [monitor, refreshData, enableTelemetry]);

  // Stop monitoring
  const stopMonitoring = useCallback((): void => {
    monitor.stopMonitoring();
    setIsRunning(false);

    if (enableTelemetry) {
      diagnostics.info('Multi-village monitoring stopped');
    }
  }, [monitor, enableTelemetry]);

  // Village management
  const registerVillage = useCallback((village: VillageEnvironment): void => {
    monitor.registerVillage(village);
    setVillages(monitor.getVillages());

    if (enableTelemetry) {
      diagnostics.info('Village registered for monitoring', {
        villageId: village.id,
        villageName: village.name,
      });
    }
  }, [monitor, enableTelemetry]);

  const unregisterVillage = useCallback((villageId: string): void => {
    monitor.unregisterVillage(villageId);
    setVillages(monitor.getVillages());

    // Clean up local state
    setVillageKPIs(prev => {
      const newMap = new Map(prev);
      newMap.delete(villageId);
      return newMap;
    });

    setVillageKPIsHistory(prev => {
      const newMap = new Map(prev);
      newMap.delete(villageId);
      return newMap;
    });

    if (enableTelemetry) {
      diagnostics.info('Village unregistered from monitoring', { villageId });
    }
  }, [monitor, enableTelemetry]);

  const updateVillageState = useCallback((villageId: string, state: VillageEnvironment['state']): void => {
    monitor.updateVillageState(villageId, state);
  }, [monitor]);

  // Alert management
  const resolveAlert = useCallback((alertId: string): void => {
    monitor.resolveAlert(alertId);
    setAlerts(monitor.getActiveAlerts());

    if (enableTelemetry) {
      diagnostics.info('Alert resolved', { alertId });
    }
  }, [monitor, enableTelemetry]);

  // KPI accessors
  const getLatestKPIs = useCallback((villageId: string): SchedulerKPIs | null => {
    return monitor.getLatestKPIs(villageId);
  }, [monitor]);

  const getKPIHistory = useCallback((villageId: string, limit?: number): SchedulerKPIs[] => {
    return monitor.getKPIHistory(villageId, limit);
  }, [monitor]);

  // Comparative analysis
  const performComparativeAnalysis = useCallback((timeWindow: number = 60 * 60 * 1000): ComparativeAnalysis => {
    return monitor.performComparativeAnalysis(timeWindow);
  }, [monitor]);

  // Export functions
  const exportKPIs = useCallback((
    format: 'json' | 'csv' = 'json',
    timeRange?: { startTime?: number; endTime?: number }
  ): string => {
    return monitor.exportKPIs(format, timeRange);
  }, [monitor]);

  const exportComparativeAnalysis = useCallback((
    timeWindow: number = 60 * 60 * 1000,
    format: 'json' | 'csv' = 'json'
  ): string => {
    return monitor.exportComparativeAnalysis(timeWindow, format);
  }, [monitor]);

  const exportAlerts = useCallback((format: 'json' | 'csv' = 'json'): string => {
    return monitor.exportAlerts(format);
  }, [monitor]);

  const exportFullReport = useCallback((format: 'json' | 'csv' = 'json'): string => {
    return monitor.exportFullReport(format);
  }, [monitor]);

  // Configuration management
  const updateConfig = useCallback((config: Partial<MultiVillageMonitorConfig>): void => {
    monitor.updateConfig(config);
  }, [monitor]);

  const getConfig = useCallback((): MultiVillageMonitorConfig => {
    return monitor.getConfig();
  }, [monitor]);

  // Utility functions
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Computed values
  const activeAlertsCount = useMemo(() => alerts.length, [alerts]);

  const criticalAlertsCount = useMemo(() =>
    alerts.filter(alert => alert.severity === 'critical').length,
  [alerts]);

  const villagesWithIssues = useMemo(() => {
    const villageIds = new Set(alerts.map(alert => alert.villageId));
    return Array.from(villageIds);
  }, [alerts]);

  return {
    // Monitor state
    isRunning,
    isLoading,
    error,
    lastUpdate,

    // Village management
    villages,
    villageKPIs,
    villageKPIsHistory,

    // Alerts and analysis
    alerts,
    comparativeAnalysis,
    monitorStats,

    // Actions
    startMonitoring,
    stopMonitoring,
    registerVillage,
    unregisterVillage,
    updateVillageState,
    resolveAlert,
    getLatestKPIs,
    getKPIHistory,
    performComparativeAnalysis,

    // Export functions
    exportKPIs,
    exportComparativeAnalysis,
    exportAlerts,
    exportFullReport,

    // Configuration
    updateConfig,
    getConfig,

    // Utility functions
    refreshData,
    clearError,

    // Additional computed values (extensions to the interface)
    activeAlertsCount,
    criticalAlertsCount,
    villagesWithIssues,
  } as UseMultiVillageMonitorReturn & {
    activeAlertsCount: number;
    criticalAlertsCount: number;
    villagesWithIssues: string[];
  };
}

/**
 * Hook for monitoring a single village with simplified interface
 *
 * @param village - Village environment to monitor
 * @param config - Hook configuration
 * @returns Single village monitor state and actions
 *
 * @example
 * ```typescript
 * const { isRunning, alerts, startMonitoring } = useSingleVillageMonitor(village);
 * ```
 */
export function useSingleVillageMonitor(
  village: VillageEnvironment,
  config: UseMultiVillageMonitorConfig = {}
): Omit<UseMultiVillageMonitorReturn, 'villages' | 'registerVillage' | 'unregisterVillage'> & {
  village: VillageEnvironment;
  latestKPIs: SchedulerKPIs | null;
  kpiHistory: SchedulerKPIs[];
} {
  const monitorResult = useMultiVillageMonitor([village], config);

  const villageKPIs = monitorResult.villageKPIs.get(village.id) || null;
  const kpiHistory = monitorResult.villageKPIsHistory.get(village.id) || [];

  return {
    ...monitorResult,
    village,
    latestKPIs: villageKPIs,
    kpiHistory,
  };
}

/**
 * Hook for monitoring alert trends across villages
 *
 * @param alerts - Active alerts array
 * @returns Alert trend analysis
 */
export function useAlertTrends(alerts: MonitorAlert[]) {
  return useMemo(() => {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    const last24Hours = now - (24 * 60 * 60 * 1000);

    const recentAlerts = alerts.filter(alert => alert.timestamp > lastHour);
    const dailyAlerts = alerts.filter(alert => alert.timestamp > last24Hours);

    const alertsByType = alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsBySeverity = alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const alertsByVillage = alerts.reduce((acc, alert) => {
      acc[alert.villageId] = (acc[alert.villageId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAlerts: alerts.length,
      recentAlerts: recentAlerts.length,
      dailyAlerts: dailyAlerts.length,
      alertsByType,
      alertsBySeverity,
      alertsByVillage,
      resolutionRate: alerts.length > 0
        ? (alerts.filter(a => a.resolved).length / alerts.length) * 100
        : 0,
    };
  }, [alerts]);
}
