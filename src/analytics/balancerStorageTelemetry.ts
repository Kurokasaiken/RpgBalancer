/**
 * Balancer Storage Telemetry Monitor
 * 
 * Config-first telemetry collection for PersistenceService operations.
 * Tracks save/load latency, error rates, and provides alerting.
 * Emits events via sandbox diagnostics for dashboard consumption.
 */

import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const diagnostics = createHeadlessDiagnostics('BalancerStorageTelemetry');

/**
 * Storage operation metrics tracked over time.
 */
export interface StorageMetrics {
  /** Total operations count. */
  totalOperations: number;
  /** Successful operations count. */
  successCount: number;
  /** Failed operations count. */
  errorCount: number;
  /** Average latency in milliseconds (last 100 ops). */
  avgLatencyMs: number;
  /** Max latency in milliseconds (last 100 ops). */
  maxLatencyMs: number;
  /** Min latency in milliseconds (last 100 ops). */
  minLatencyMs: number;
  /** Error rate percentage (0-100). */
  errorRatePercent: number;
  /** Timestamp of last operation. */
  lastOperationTimestamp: number;
  /** Timestamp of last error. */
  lastErrorTimestamp?: number;
}

/**
 * Individual operation record for detailed analysis.
 */
export interface StorageOperationRecord {
  /** Operation type: 'save' | 'load' | 'clear'. */
  type: 'save' | 'load' | 'clear';
  /** Storage key. */
  key: string;
  /** Success flag. */
  success: boolean;
  /** Latency in milliseconds. */
  latencyMs: number;
  /** Error message if failed. */
  error?: string;
  /** Storage backend used: 'tauri' | 'localStorage' | 'fallback'. */
  backend: 'tauri' | 'localStorage' | 'fallback';
  /** Timestamp. */
  timestamp: number;
  /** Payload size in characters (approx). */
  payloadSize?: number;
}

/**
 * Config-first thresholds for alerting.
 */
export interface StorageTelemetryConfig {
  /** Alert if error rate exceeds this percentage. */
  errorRateThresholdPercent: number;
  /** Alert if average latency exceeds this ms. */
  avgLatencyThresholdMs: number;
  /** Alert if max latency exceeds this ms. */
  maxLatencyThresholdMs: number;
  /** Number of recent operations to consider for metrics. */
  metricsWindowSize: number;
  /** Cooldown between same-type alerts (ms). */
  alertCooldownMs: number;
}

export const DEFAULT_STORAGE_TELEMETRY_CONFIG: StorageTelemetryConfig = {
  errorRateThresholdPercent: 5,
  avgLatencyThresholdMs: 200,
  maxLatencyThresholdMs: 1000,
  metricsWindowSize: 100,
  alertCooldownMs: 30000, // 30 seconds
};

/**
 * In-memory telemetry store.
 */
class StorageTelemetryStore {
  private records: StorageOperationRecord[] = [];
  private lastAlerts: Map<string, number> = new Map();

  addRecord(record: StorageOperationRecord): void {
    this.records.push(record);
    // Keep only recent records for memory efficiency
    if (this.records.length > DEFAULT_STORAGE_TELEMETRY_CONFIG.metricsWindowSize * 2) {
      this.records = this.records.slice(-DEFAULT_STORAGE_TELEMETRY_CONFIG.metricsWindowSize * 2);
    }

    // Emit telemetry event
    diagnostics.info('storage_operation', {
      type: record.type,
      key: record.key,
      success: record.success,
      latencyMs: record.latencyMs,
      backend: record.backend,
      error: record.error,
    }, ['storage', record.type, record.success ? 'success' : 'error']);

    // Check for alerts
    this.checkAlerts();
  }

  private checkAlerts(): void {
    const metrics = this.calculateMetrics();
    const now = Date.now();

    // Error rate alert
    if (metrics.errorRatePercent > DEFAULT_STORAGE_TELEMETRY_CONFIG.errorRateThresholdPercent) {
      const lastErrorAlert = this.lastAlerts.get('error_rate') ?? 0;
      if (now - lastErrorAlert > DEFAULT_STORAGE_TELEMETRY_CONFIG.alertCooldownMs) {
        this.lastAlerts.set('error_rate', now);
        diagnostics.warn('storage_alert', {
          type: 'error_rate',
          threshold: DEFAULT_STORAGE_TELEMETRY_CONFIG.errorRateThresholdPercent,
          actual: metrics.errorRatePercent,
          metrics,
        }, ['storage', 'alert', 'error_rate']);
      }
    }

    // Latency alerts
    if (metrics.avgLatencyMs > DEFAULT_STORAGE_TELEMETRY_CONFIG.avgLatencyThresholdMs) {
      const lastLatencyAlert = this.lastAlerts.get('avg_latency') ?? 0;
      if (now - lastLatencyAlert > DEFAULT_STORAGE_TELEMETRY_CONFIG.alertCooldownMs) {
        this.lastAlerts.set('avg_latency', now);
        diagnostics.warn('storage_alert', {
          type: 'avg_latency',
          threshold: DEFAULT_STORAGE_TELEMETRY_CONFIG.avgLatencyThresholdMs,
          actual: metrics.avgLatencyMs,
          metrics,
        }, ['storage', 'alert', 'latency']);
      }
    }

    if (metrics.maxLatencyMs > DEFAULT_STORAGE_TELEMETRY_CONFIG.maxLatencyThresholdMs) {
      const lastMaxLatencyAlert = this.lastAlerts.get('max_latency') ?? 0;
      if (now - lastMaxLatencyAlert > DEFAULT_STORAGE_TELEMETRY_CONFIG.alertCooldownMs) {
        this.lastAlerts.set('max_latency', now);
        diagnostics.warn('storage_alert', {
          type: 'max_latency',
          threshold: DEFAULT_STORAGE_TELEMETRY_CONFIG.maxLatencyThresholdMs,
          actual: metrics.maxLatencyMs,
          metrics,
        }, ['storage', 'alert', 'latency']);
      }
    }
  }

  calculateMetrics(): StorageMetrics {
    const windowSize = DEFAULT_STORAGE_TELEMETRY_CONFIG.metricsWindowSize;
    const recentRecords = this.records.slice(-windowSize);

    if (recentRecords.length === 0) {
      return {
        totalOperations: 0,
        successCount: 0,
        errorCount: 0,
        avgLatencyMs: 0,
        maxLatencyMs: 0,
        minLatencyMs: 0,
        errorRatePercent: 0,
        lastOperationTimestamp: 0,
      };
    }

    const successRecords = recentRecords.filter(r => r.success);
    const errorRecords = recentRecords.filter(r => !r.success);
    const latencies = recentRecords.map(r => r.latencyMs);

    return {
      totalOperations: recentRecords.length,
      successCount: successRecords.length,
      errorCount: errorRecords.length,
      avgLatencyMs: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      maxLatencyMs: Math.max(...latencies),
      minLatencyMs: Math.min(...latencies),
      errorRatePercent: (errorRecords.length / recentRecords.length) * 100,
      lastOperationTimestamp: Math.max(...recentRecords.map(r => r.timestamp)),
      lastErrorTimestamp: errorRecords.length > 0 ? Math.max(...errorRecords.map(r => r.timestamp)) : undefined,
    };
  }

  getRecentRecords(limit: number = 50): StorageOperationRecord[] {
    return this.records.slice(-limit);
  }

  exportRecordsAsCSV(): string {
    const headers = ['timestamp', 'type', 'key', 'success', 'latencyMs', 'backend', 'error', 'payloadSize'];
    const rows = this.records.map(record => [
      record.timestamp,
      record.type,
      record.key,
      record.success,
      record.latencyMs,
      record.backend,
      record.error || '',
      record.payloadSize || '',
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  clear(): void {
    this.records = [];
    this.lastAlerts.clear();
    diagnostics.info('storage_telemetry_cleared', {}, ['storage']);
  }
}

/**
 * Global telemetry store instance.
 */
const telemetryStore = new StorageTelemetryStore();

/**
 * Wraps a promise to measure latency and record telemetry.
 */
export async function withStorageTelemetry<T>(
  type: 'save' | 'load' | 'clear',
  key: string,
  operation: () => Promise<T>,
  backend: 'tauri' | 'localStorage' | 'fallback' = 'tauri',
): Promise<T> {
  const startTime = performance.now();
  let success = false;
  let error: string | undefined;

  try {
    const result = await operation();
    success = true;
    return result;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    throw err;
  } finally {
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    telemetryStore.addRecord({
      type,
      key,
      success,
      latencyMs,
      error,
      backend,
      timestamp: Date.now(),
    });
  }
}

/**
 * Public API for accessing telemetry data.
 */
export const storageTelemetry = {
  /**
   * Get current storage metrics.
   */
  getMetrics: (): StorageMetrics => telemetryStore.calculateMetrics(),

  /**
   * Get recent operation records.
   */
  getRecentRecords: (limit?: number) => telemetryStore.getRecentRecords(limit),

  /**
   * Export all records as CSV.
   */
  exportCSV: (): string => telemetryStore.exportRecordsAsCSV(),

  /**
   * Clear all telemetry data.
   */
  clear: (): void => telemetryStore.clear(),
};

/**
 * Hook for React components to consume storage telemetry.
 * Returns reactive metrics and records.
 */
export function useStorageTelemetry() {
  // In a real implementation, this would use React state/subscriptions
  // For now, return current values - React integration will be in the hook file
  return {
    metrics: storageTelemetry.getMetrics(),
    records: storageTelemetry.getRecentRecords(20),
    exportCSV: storageTelemetry.exportCSV,
    clear: storageTelemetry.clear,
  };
}
