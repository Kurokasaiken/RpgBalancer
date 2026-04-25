/**
 * React hook for consuming Balancer Storage Telemetry data.
 * Provides reactive metrics, recent operations, and dashboard utilities.
 */

import { useEffect, useState, useCallback } from 'react';
import { storageTelemetry, type StorageMetrics, type StorageOperationRecord } from '@/analytics/balancerStorageTelemetry';
import { subscribeToDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';

/**
 * Hook return type for storage telemetry data.
 */
export interface UseStorageTelemetryReturn {
  /** Current storage metrics. */
  metrics: StorageMetrics;
  /** Recent operation records. */
  records: StorageOperationRecord[];
  /** Whether data is currently loading. */
  isLoading: boolean;
  /** Last update timestamp. */
  lastUpdate: number;
  /** Export all records as CSV. */
  exportCSV: () => string;
  /** Clear all telemetry data. */
  clear: () => void;
  /** Refresh data manually. */
  refresh: () => void;
}

/**
 * Configuration options for the hook.
 */
export interface UseStorageTelemetryOptions {
  /** Number of recent records to retrieve (default: 20). */
  recordLimit?: number;
  /** Auto-refresh interval in milliseconds (default: 1000). */
  refreshInterval?: number;
  /** Whether to auto-refresh (default: true). */
  autoRefresh?: boolean;
}

const DEFAULT_OPTIONS: Required<UseStorageTelemetryOptions> = {
  recordLimit: 20,
  refreshInterval: 1000,
  autoRefresh: true,
};

/**
 * React hook for accessing storage telemetry data.
 * 
 * @param options - Configuration options
 * @returns Telemetry data and utility functions
 */
export function useStorageTelemetry(options: UseStorageTelemetryOptions = {}): UseStorageTelemetryReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [metrics, setMetrics] = useState<StorageMetrics>(() => storageTelemetry.getMetrics());
  const [records, setRecords] = useState<StorageOperationRecord[]>(() => storageTelemetry.getRecentRecords(opts.recordLimit));
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const refresh = useCallback(() => {
    setIsLoading(true);
    try {
      const newMetrics = storageTelemetry.getMetrics();
      const newRecords = storageTelemetry.getRecentRecords(opts.recordLimit);
      
      setMetrics(newMetrics);
      setRecords(newRecords);
      setLastUpdate(Date.now());
    } finally {
      setIsLoading(false);
    }
  }, [opts.recordLimit]);

  const exportCSV = useCallback(() => {
    return storageTelemetry.exportCSV();
  }, []);

  const clear = useCallback(() => {
    storageTelemetry.clear();
    refresh();
  }, [refresh]);

  // Set up auto-refresh
  useEffect(() => {
    if (!opts.autoRefresh) return;

    const interval = setInterval(refresh, opts.refreshInterval);
    return () => clearInterval(interval);
  }, [opts.autoRefresh, opts.refreshInterval, refresh]);

  // Subscribe to diagnostics updates for real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToDiagnostics(refresh);
    return unsubscribe;
  }, [refresh]);

  // Initial refresh
  useEffect(() => {
    const timeoutId = setTimeout(refresh, 0);
    return () => clearTimeout(timeoutId);
  }, [refresh]);

  return {
    metrics,
    records,
    isLoading,
    lastUpdate,
    exportCSV,
    clear,
    refresh,
  };
}

/**
 * Storage alert data structure.
 */
export interface StorageAlert {
  timestamp: number;
  type: 'error_rate' | 'avg_latency' | 'max_latency';
  threshold: number;
  actual: number;
  message: string;
}

/**
 * Hook for accessing storage alerts specifically.
 * Filters diagnostics logs for storage-related alerts.
 */
export function useStorageAlerts() {
  const [alerts, setAlerts] = useState<StorageAlert[]>([]);

  useEffect(() => {
    // This would filter diagnostics logs for storage alerts
    // Implementation depends on diagnostics API availability
    const updateAlerts = () => {
      // Placeholder: would filter diagnostics for storage alerts
      setAlerts([]);
    };

    const unsubscribe = subscribeToDiagnostics(updateAlerts);
    // Defer initial update to avoid synchronous setState
    const timeoutId = setTimeout(updateAlerts, 0);

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return alerts;
}

/**
 * Hook for storage performance trends over time.
 * Useful for charts and trend analysis.
 */
export function useStorageTrends(timeWindowMs: number = 300000) { // 5 minutes default
  const [trends, setTrends] = useState<{
    latencyTrend: Array<{ timestamp: number; value: number }>;
    errorRateTrend: Array<{ timestamp: number; value: number }>;
    operationCountTrend: Array<{ timestamp: number; value: number }>;
  }>({
    latencyTrend: [],
    errorRateTrend: [],
    operationCountTrend: [],
  });

  const refresh = useCallback(() => {
    const allRecords = storageTelemetry.getRecentRecords(200); // Get more records for trends
    const cutoff = Date.now() - timeWindowMs;
    const recentRecords = allRecords.filter(r => r.timestamp >= cutoff);

    // Group records by time buckets (e.g., every 10 seconds)
    const bucketSize = 10000; // 10 seconds
    const buckets = new Map<number, StorageOperationRecord[]>();

    recentRecords.forEach(record => {
      const bucketTime = Math.floor(record.timestamp / bucketSize) * bucketSize;
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime)!.push(record);
    });

    // Calculate trends
    const sortedBuckets = Array.from(buckets.keys()).sort();
    const latencyTrend = sortedBuckets.map(timestamp => {
      const bucketRecords = buckets.get(timestamp)!;
      const avgLatency = bucketRecords.reduce((sum, r) => sum + r.latencyMs, 0) / bucketRecords.length;
      return { timestamp, value: Math.round(avgLatency) };
    });

    const errorRateTrend = sortedBuckets.map(timestamp => {
      const bucketRecords = buckets.get(timestamp)!;
      const errorRate = (bucketRecords.filter(r => !r.success).length / bucketRecords.length) * 100;
      return { timestamp, value: Math.round(errorRate * 10) / 10 };
    });

    const operationCountTrend = sortedBuckets.map(timestamp => {
      const bucketRecords = buckets.get(timestamp)!;
      return { timestamp, value: bucketRecords.length };
    });

    setTrends({
      latencyTrend,
      errorRateTrend,
      operationCountTrend,
    });
  }, [timeWindowMs]);

  useEffect(() => {
    const unsubscribe = subscribeToDiagnostics(refresh);
    // Defer initial refresh to avoid synchronous setState
    const timeoutId = setTimeout(refresh, 0);

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [refresh]);

  return trends;
}
