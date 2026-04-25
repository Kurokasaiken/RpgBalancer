import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_MAINTENANCE_FORECAST_CONFIG } from '@/balancing/config/idleVillage/maintenanceForecastConfig';
import type {
  MaintenanceForecastAlert,
  MaintenanceForecastConfig,
  MaintenanceForecastResult,
  MaintenanceForecastSeries,
  MaintenanceKPIObservation,
} from '@/analytics/idleVillageMaintenanceForecast';
import {
  computeMaintenanceForecast,
  maintenanceForecastToCsv,
} from '@/analytics/idleVillageMaintenanceForecast';
import type { MaintenanceCategory } from './useMaintenanceInsights';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';

const DEFAULT_PERSISTED_SNAPSHOT: MaintenanceForecastPersistenceSnapshot = {
  history: [],
};

interface MaintenanceForecastPersistenceSnapshot {
  history: MaintenanceKPIObservation[];
  lastResult?: MaintenanceForecastResult | null;
}

export interface UseMaintenanceForecastOptions {
  /** Pre-seeded KPI history, typically provided by the KPI exporter hook. */
  initialHistory?: MaintenanceKPIObservation[];
  /** Optional async loader for KPI history (e.g., CLI export, remote API). */
  fetchHistory?: () => Promise<MaintenanceKPIObservation[]>;
  /** Override forecast configuration. */
  config?: Partial<MaintenanceForecastConfig>;
  /** Interval for automatic refresh, disabled when undefined. */
  autoRefreshIntervalMs?: number;
  /** Optional diagnostics label (defaults to MaintenanceForecast). */
  diagnosticsLabel?: string;
  /** Disable persistence and auto refresh, useful for tests. */
  testMode?: boolean;
}

export interface UseMaintenanceForecastReturn {
  history: MaintenanceKPIObservation[];
  loading: boolean;
  error: string | null;
  forecast: MaintenanceForecastResult | null;
  alerts: MaintenanceForecastAlert[];
  refresh: () => Promise<void>;
  exportCsv: () => string;
  addObservation: (observation: MaintenanceKPIObservation) => Promise<void>;
  clearHistory: () => Promise<void>;
  getSeriesForCategory: (category: MaintenanceCategory) => MaintenanceForecastSeries | null;
}

/**
 * Hook that orchestrates maintenance KPI forecasts, persistence, and CSV export utilities.
 */
export function useMaintenanceForecast(
  options: UseMaintenanceForecastOptions = {}
): UseMaintenanceForecastReturn {
  const {
    initialHistory = [],
    fetchHistory,
    config,
    autoRefreshIntervalMs,
    diagnosticsLabel = 'MaintenanceForecast',
    testMode = false,
  } = options;

  const diagnostics = useMemo(
    () => createSandboxDiagnostics(diagnosticsLabel),
    [diagnosticsLabel]
  );

  const mergedConfig = useMemo<MaintenanceForecastConfig>(() => {
    return {
      ...DEFAULT_MAINTENANCE_FORECAST_CONFIG,
      ...config,
      smoothing: {
        ...DEFAULT_MAINTENANCE_FORECAST_CONFIG.smoothing,
        ...config?.smoothing,
      },
      presentation: mergePresentationConfig(
        DEFAULT_MAINTENANCE_FORECAST_CONFIG.presentation,
        config?.presentation
      ),
      alertThresholds: {
        ...DEFAULT_MAINTENANCE_FORECAST_CONFIG.alertThresholds,
        ...config?.alertThresholds,
      },
      persistenceKey:
        config?.persistenceKey ?? DEFAULT_MAINTENANCE_FORECAST_CONFIG.persistenceKey,
    };
  }, [config]);

  const [history, setHistory] = useState<MaintenanceKPIObservation[]>(initialHistory);
  const [forecast, setForecast] = useState<MaintenanceForecastResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const autoRefreshTimer = useRef<ReturnType<typeof setInterval>>();
  const isMountedRef = useRef(true);

  const persistSnapshot = useCallback(
    async (snapshot: MaintenanceForecastPersistenceSnapshot) => {
      if (testMode) return;
      try {
        await saveData(mergedConfig.persistenceKey, snapshot);
      } catch (persistError) {
        diagnostics.warn('Failed to persist maintenance forecast snapshot', persistError);
      }
    },
    [diagnostics, mergedConfig.persistenceKey, testMode]
  );

  const bootstrapFromPersistence = useCallback(async () => {
    if (testMode) return;
    setLoading(true);
    try {
      const persisted = await loadData<MaintenanceForecastPersistenceSnapshot>(
        mergedConfig.persistenceKey,
        DEFAULT_PERSISTED_SNAPSHOT
      );
      if (!isMountedRef.current) return;

      const mergedHistory = mergeHistories(
        persisted.history ?? [],
        initialHistory,
        mergedConfig.presentation.maxHistoricalPoints
      );
      setHistory(mergedHistory);
      if (persisted.lastResult) {
        setForecast(persisted.lastResult);
      }
    } catch (loadError) {
      diagnostics.error('Unable to load maintenance forecast snapshot', loadError);
      setError('Unable to load maintenance forecast state.');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    diagnostics,
    initialHistory,
    mergedConfig.persistenceKey,
    mergedConfig.presentation.maxHistoricalPoints,
    testMode,
  ]);

  const runComputation = useCallback(
    (nextHistory: MaintenanceKPIObservation[]) => {
      if (nextHistory.length === 0) {
        setForecast(null);
        return;
      }
      const result = computeMaintenanceForecast(nextHistory, mergedConfig);
      setForecast(result);
      void persistSnapshot({ history: nextHistory, lastResult: result });
    },
    [mergedConfig, persistSnapshot]
  );

  const refresh = useCallback(async () => {
    if (!fetchHistory) {
      runComputation(history);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedHistory = await fetchHistory();
      if (!isMountedRef.current) return;

      const mergedHistory = mergeHistories(
        fetchedHistory,
        history,
        mergedConfig.presentation.maxHistoricalPoints
      );
      setHistory(mergedHistory);
      runComputation(mergedHistory);
    } catch (refreshError) {
      diagnostics.error('Failed to refresh maintenance KPI history', refreshError);
      if (isMountedRef.current) {
        setError('Unable to refresh maintenance forecast.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    diagnostics,
    fetchHistory,
    history,
    mergedConfig.presentation.maxHistoricalPoints,
    runComputation,
  ]);

  const addObservation = useCallback(
    async (observation: MaintenanceKPIObservation) => {
      setHistory((prev) => {
        const merged = mergeHistories([observation], prev, mergedConfig.presentation.maxHistoricalPoints);
        runComputation(merged);
        return merged;
      });
    },
    [mergedConfig.presentation.maxHistoricalPoints, runComputation]
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    setForecast(null);
    await persistSnapshot({ history: [], lastResult: null });
  }, [persistSnapshot]);

  const exportCsv = useCallback((): string => {
    if (!forecast) return '';
    return maintenanceForecastToCsv(forecast);
  }, [forecast]);

  const getSeriesForCategory = useCallback(
    (category: MaintenanceCategory): MaintenanceForecastSeries | null => {
      if (!forecast) return null;
      return forecast.series[category] ?? null;
    },
    [forecast]
  );

  useEffect(() => {
    if (!testMode) {
      bootstrapFromPersistence().catch((bootstrapError) => {
        diagnostics.error('Bootstrap failure for maintenance forecast', bootstrapError);
      });
    } else {
      runComputation(history);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [
    bootstrapFromPersistence,
    diagnostics,
    history,
    runComputation,
    testMode,
  ]);

  useEffect(() => {
    if (history.length === 0 || fetchHistory) {
      return;
    }
    runComputation(history);
  }, [history, fetchHistory, runComputation]);

  useEffect(() => {
    if (testMode || !autoRefreshIntervalMs || !fetchHistory) {
      return () => {
        if (autoRefreshTimer.current) {
          clearInterval(autoRefreshTimer.current);
        }
      };
    }

    autoRefreshTimer.current = setInterval(() => {
      refresh().catch((err) => diagnostics.warn('Auto refresh failed', err));
    }, autoRefreshIntervalMs);

    return () => {
      if (autoRefreshTimer.current) {
        clearInterval(autoRefreshTimer.current);
      }
    };
  }, [autoRefreshIntervalMs, diagnostics, fetchHistory, refresh, testMode]);

  return {
    history,
    loading,
    error,
    forecast,
    alerts: forecast?.alerts ?? [],
    refresh,
    exportCsv,
    addObservation,
    clearHistory,
    getSeriesForCategory,
  };
}

function mergeHistories(
  nextHistory: MaintenanceKPIObservation[],
  baseHistory: MaintenanceKPIObservation[],
  maxPoints: number
): MaintenanceKPIObservation[] {
  const merged = [...baseHistory];
  nextHistory.forEach((observation) => {
    const existingIndex = merged.findIndex(
      (candidate) =>
        candidate.timestamp === observation.timestamp &&
        candidate.category === observation.category
    );
    if (existingIndex === -1) {
      merged.push(observation);
    } else {
      merged[existingIndex] = observation;
    }
  });

  return merged
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-maxPoints);
}

function mergePresentationConfig(
  baseConfig: MaintenanceForecastConfig['presentation'],
  override?: Partial<MaintenanceForecastConfig['presentation']>
): MaintenanceForecastConfig['presentation'] {
  if (!override) {
    return baseConfig;
  }

  return {
    ...baseConfig,
    ...override,
    palette: {
      ...baseConfig.palette,
      ...(override.palette ?? {}),
      series: {
        ...baseConfig.palette.series,
        ...(override.palette?.series ?? {}),
      },
      confidenceFill: {
        ...baseConfig.palette.confidenceFill,
        ...(override.palette?.confidenceFill ?? {}),
      },
    },
  };
}
