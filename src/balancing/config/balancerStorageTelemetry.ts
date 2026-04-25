/**
 * Config Balancer Storage Telemetry Monitor
 *
 * Comprehensive monitoring system for Balancer storage operations, tracking performance,
 * reliability, and alerting on storage issues with configurable thresholds.
 *
 * @module balancerStorageTelemetry
 * @since 2026-01-13
 * @author Cascade
 */

/**
 * Storage operation types
 */
export type StorageOperationType = 'load' | 'save' | 'backup' | 'history_load' | 'history_save';

/**
 * Storage operation result
 */
export interface StorageOperationResult {
  success: boolean;
  operation: StorageOperationType;
  duration: number;
  timestamp: number;
  dataSize?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Storage performance metrics
 */
export interface StorageMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastOperation: StorageOperationResult | null;
  operationCounts: Record<StorageOperationType, number>;
  errorCounts: Record<string, number>;
  dataSizeStats: {
    totalBytes: number;
    averageBytes: number;
    minBytes: number;
    maxBytes: number;
  };
}

/**
 * Alert threshold configuration
 */
export interface StorageAlertThresholds {
  maxDurationMs: number;
  maxFailureRate: number; // 0-1 (percentage)
  maxConsecutiveFailures: number;
  minDataSizeBytes: number;
  maxDataSizeBytes: number;
  alertCooldownMs: number; // Prevent alert spam
}

/**
 * Storage alert types
 */
export type StorageAlertType =
  | 'slow_operation'
  | 'high_failure_rate'
  | 'consecutive_failures'
  | 'data_size_anomaly'
  | 'storage_unavailable';

/**
 * Storage alert
 */
export interface StorageAlert {
  id: string;
  type: StorageAlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  operation?: StorageOperationResult;
  metadata?: Record<string, unknown>;
  resolved?: boolean;
  resolvedAt?: number;
}

/**
 * Storage telemetry event types
 */
export type StorageTelemetryEvent =
  | { type: 'operation_completed'; data: StorageOperationResult }
  | { type: 'alert_triggered'; data: StorageAlert }
  | { type: 'alert_resolved'; data: { alertId: string; timestamp: number } }
  | { type: 'metrics_updated'; data: StorageMetrics };

/**
 * Storage telemetry collector
 */
export class BalancerStorageTelemetry {
  private static instance: BalancerStorageTelemetry | null = null;
  private operations: StorageOperationResult[] = [];
  private alerts: StorageAlert[] = [];
  private listeners: ((event: StorageTelemetryEvent) => void)[] = [];
  private alertCooldowns: Map<StorageAlertType, number> = new Map();

  private thresholds: StorageAlertThresholds = {
    maxDurationMs: 1000, // 1 second
    maxFailureRate: 0.1, // 10%
    maxConsecutiveFailures: 3,
    minDataSizeBytes: 100, // 100 bytes
    maxDataSizeBytes: 10 * 1024 * 1024, // 10MB
    alertCooldownMs: 30000, // 30 seconds
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): BalancerStorageTelemetry {
    if (!this.instance) {
      this.instance = new BalancerStorageTelemetry();
    }
    return this.instance;
  }

  /**
   * Record a storage operation
   */
  recordOperation(
    operation: StorageOperationType,
    success: boolean,
    duration: number,
    dataSize?: number,
    error?: string,
    metadata?: Record<string, unknown>
  ): void {
    const result: StorageOperationResult = {
      success,
      operation,
      duration,
      timestamp: Date.now(),
      dataSize,
      error,
      metadata,
    };

    this.operations.push(result);

    // Keep only last 1000 operations
    if (this.operations.length > 1000) {
      this.operations = this.operations.slice(-1000);
    }

    // Emit event
    this.emit({
      type: 'operation_completed',
      data: result,
    });

    // Check for alerts
    this.checkAlerts(result);

    // Update metrics
    this.emit({
      type: 'metrics_updated',
      data: this.getMetrics(),
    });
  }

  /**
   * Add event listener
   */
  addListener(listener: (event: StorageTelemetryEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners = [];
  }

  /**
   * Get current metrics
   */
  getMetrics(): StorageMetrics {
    const operations = this.operations;
    const successful = operations.filter(op => op.success);
    const failed = operations.filter(op => !op.success);

    const durations = operations.map(op => op.duration);
    const dataSizes = operations.map(op => op.dataSize).filter(Boolean) as number[];

    const operationCounts = operations.reduce((counts, op) => {
      counts[op.operation] = (counts[op.operation] || 0) + 1;
      return counts;
    }, {} as Record<StorageOperationType, number>);

    const errorCounts = failed.reduce((counts, op) => {
      const errorKey = op.error || 'unknown_error';
      counts[errorKey] = (counts[errorKey] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      totalOperations: operations.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      lastOperation: operations.length > 0 ? operations[operations.length - 1] : null,
      operationCounts,
      errorCounts,
      dataSizeStats: {
        totalBytes: dataSizes.reduce((a, b) => a + b, 0),
        averageBytes: dataSizes.length > 0 ? dataSizes.reduce((a, b) => a + b, 0) / dataSizes.length : 0,
        minBytes: dataSizes.length > 0 ? Math.min(...dataSizes) : 0,
        maxBytes: dataSizes.length > 0 ? Math.max(...dataSizes) : 0,
      },
    };
  }

  /**
   * Get recent operations
   */
  getRecentOperations(limit: number = 50): StorageOperationResult[] {
    return this.operations.slice(-limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): StorageAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (active and resolved)
   */
  getAllAlerts(): StorageAlert[] {
    return [...this.alerts];
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();

      this.emit({
        type: 'alert_resolved',
        data: { alertId, timestamp: Date.now() },
      });
    }
  }

  /**
   * Configure alert thresholds
   */
  setThresholds(thresholds: Partial<StorageAlertThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  /**
   * Get current thresholds
   */
  getThresholds(): StorageAlertThresholds {
    return { ...this.thresholds };
  }

  /**
   * Clear all telemetry data
   */
  clear(): void {
    this.operations = [];
    this.alerts = [];
    this.alertCooldowns.clear();
  }

  /**
   * Export telemetry data
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      metrics: this.getMetrics(),
      recentOperations: this.getRecentOperations(100),
      alerts: this.getAllAlerts(),
      thresholds: this.getThresholds(),
      exportTimestamp: Date.now(),
    };

    if (format === 'csv') {
      const headers = ['timestamp', 'operation', 'success', 'duration', 'dataSize', 'error'];
      const rows = this.operations.map(op => [
        op.timestamp,
        op.operation,
        op.success.toString(),
        op.duration.toString(),
        op.dataSize?.toString() || '',
        op.error || '',
      ]);

      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Check for alerts based on operation result
   */
  private checkAlerts(operation: StorageOperationResult): void {
    const now = Date.now();

    // Slow operation alert
    if (operation.duration > this.thresholds.maxDurationMs) {
      this.triggerAlert('slow_operation', 'medium', `Storage operation took ${operation.duration}ms (threshold: ${this.thresholds.maxDurationMs}ms)`, operation);
    }

    // Data size anomaly alerts
    if (operation.dataSize !== undefined) {
      if (operation.dataSize < this.thresholds.minDataSizeBytes) {
        this.triggerAlert('data_size_anomaly', 'low', `Data size ${operation.dataSize} bytes is below minimum threshold (${this.thresholds.minDataSizeBytes} bytes)`, operation);
      }
      if (operation.dataSize > this.thresholds.maxDataSizeBytes) {
        this.triggerAlert('data_size_anomaly', 'high', `Data size ${operation.dataSize} bytes exceeds maximum threshold (${this.thresholds.maxDataSizeBytes} bytes)`, operation);
      }
    }

    // Check failure rate and consecutive failures
    this.checkFailurePatterns(operation, now);
  }

  /**
   * Check for failure patterns and trigger alerts
   */
  private checkFailurePatterns(operation: StorageOperationResult, _now: number): void {
    const recentOps = this.operations.slice(-10); // Last 10 operations
    const failureRate = recentOps.filter(op => !op.success).length / recentOps.length;

    // High failure rate alert
    if (failureRate > this.thresholds.maxFailureRate) {
      this.triggerAlert('high_failure_rate', 'high', `Failure rate ${Math.round(failureRate * 100)}% exceeds threshold (${Math.round(this.thresholds.maxFailureRate * 100)}%)`);
    }

    // Consecutive failures alert
    const consecutiveFailures = recentOps.slice().reverse().findIndex(op => op.success) || recentOps.length;
    if (!operation.success && consecutiveFailures >= this.thresholds.maxConsecutiveFailures) {
      this.triggerAlert('consecutive_failures', 'critical', `${consecutiveFailures} consecutive storage failures detected`);
    }
  }

  /**
   * Trigger an alert (with cooldown to prevent spam)
   */
  private triggerAlert(
    type: StorageAlertType,
    severity: StorageAlert['severity'],
    message: string,
    operation?: StorageOperationResult,
    metadata?: Record<string, unknown>
  ): void {
    const now = Date.now();
    const lastAlert = this.alertCooldowns.get(type) || 0;

    if (now - lastAlert < this.thresholds.alertCooldownMs) {
      return; // Still in cooldown
    }

    const alert: StorageAlert = {
      id: `alert_${type}_${now}`,
      type,
      severity,
      message,
      timestamp: now,
      operation,
      metadata,
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    this.alertCooldowns.set(type, now);

    this.emit({
      type: 'alert_triggered',
      data: alert,
    });
  }

  /**
   * Emit telemetry event to all listeners
   */
  private emit(event: StorageTelemetryEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Storage telemetry listener error:', error);
      }
    });
  }
}

/**
 * Get the global storage telemetry instance
 */
export function getStorageTelemetry(): BalancerStorageTelemetry {
  return BalancerStorageTelemetry.getInstance();
}

/**
 * Initialize storage telemetry monitoring
 */
export function initializeStorageTelemetry(): void {
  // This will be called when the Balancer system initializes
  getStorageTelemetry();
}
