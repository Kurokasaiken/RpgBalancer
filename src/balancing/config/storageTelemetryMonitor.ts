/**
 * Config Balancer Storage Telemetry Monitor
 *
 * Comprehensive telemetry monitoring system for Config Balancer storage operations.
 * Tracks save/load performance, error rates, data integrity, and usage patterns
 * to provide insights into storage system health and optimization opportunities.
 *
 * @since NP-097
 */

import { useCallback, useRef, useMemo } from 'react';
import type { BalancerConfig, ConfigSnapshot } from './types';

/**
 * Storage operation types for telemetry tracking
 */
export type StorageOperationType =
  | 'save'
  | 'load'
  | 'clear'
  | 'export'
  | 'import'
  | 'validate'
  | 'migrate'
  | 'backup'
  | 'restore';

/**
 * Storage telemetry event types
 */
export type StorageTelemetryEventType =
  | 'storage_operation_start'
  | 'storage_operation_success'
  | 'storage_operation_error'
  | 'storage_performance_warning'
  | 'storage_data_integrity_check'
  | 'storage_migration_detected'
  | 'storage_backup_created'
  | 'storage_error_recovery';

/**
 * Storage operation metrics
 */
export interface StorageOperationMetrics {
  /** Operation type */
  operation: StorageOperationType;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Success status */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Data size in bytes */
  dataSize?: number;
  /** Config version */
  configVersion?: string;
  /** User agent/browser info */
  userAgent?: string;
}

/**
 * Storage health metrics
 */
export interface StorageHealthMetrics {
  /** Total operations performed */
  totalOperations: number;
  /** Successful operations */
  successfulOperations: number;
  /** Failed operations */
  failedOperations: number;
  /** Average operation duration */
  averageDuration: number;
  /** Error rate percentage */
  errorRate: number;
  /** Last successful save timestamp */
  lastSuccessfulSave?: number;
  /** Last successful load timestamp */
  lastSuccessfulLoad?: number;
  /** Storage size in bytes */
  storageSize?: number;
  /** Data integrity checksum */
  dataChecksum?: string;
}

/**
 * Storage telemetry event
 */
export interface StorageTelemetryEvent {
  /** Unique event ID */
  id: string;
  /** Event type */
  type: StorageTelemetryEventType;
  /** Timestamp */
  timestamp: number;
  /** Session ID for grouping */
  sessionId: string;
  /** Operation metrics */
  metrics: StorageOperationMetrics;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Storage telemetry configuration
 */
export interface StorageTelemetryConfig {
  /** Whether telemetry is enabled */
  enabled: boolean;
  /** Performance warning threshold in milliseconds */
  performanceWarningThreshold: number;
  /** Whether to track detailed metrics */
  trackDetailedMetrics: boolean;
  /** Whether to enable data integrity checks */
  enableIntegrityChecks: boolean;
  /** Maximum events to keep in memory */
  maxEventsInMemory: number;
  /** Session identifier */
  sessionId?: string;
}

/**
 * Default telemetry configuration
 */
export const DEFAULT_STORAGE_TELEMETRY_CONFIG: StorageTelemetryConfig = {
  enabled: true,
  performanceWarningThreshold: 100, // 100ms
  trackDetailedMetrics: true,
  enableIntegrityChecks: true,
  maxEventsInMemory: 100,
  sessionId: `balancer_storage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};

/**
 * Generate data checksum for integrity verification
 */
export function generateDataChecksum(data: BalancerConfig): string {
  const dataString = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Storage telemetry monitor hook
 */
export function useStorageTelemetryMonitor(
  config: Partial<StorageTelemetryConfig> = {}
) {
  const fullConfig = useMemo(
    () => ({ ...DEFAULT_STORAGE_TELEMETRY_CONFIG, ...config }),
    [config]
  );

  const eventsRef = useRef<StorageTelemetryEvent[]>([]);
  const currentOperationRef = useRef<StorageOperationMetrics | null>(null);

  /**
   * Start tracking a storage operation
   */
  const startOperation = useCallback(
    (operation: StorageOperationType, metadata?: Record<string, unknown>) => {
      if (!fullConfig.enabled) return;

      const operationMetrics: StorageOperationMetrics = {
        operation,
        startTime: Date.now(),
        success: false,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        ...metadata,
      };

      currentOperationRef.current = operationMetrics;

      if (fullConfig.trackDetailedMetrics) {
        const event: StorageTelemetryEvent = {
          id: `storage_${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'storage_operation_start',
          timestamp: operationMetrics.startTime,
          sessionId: fullConfig.sessionId!,
          metrics: operationMetrics,
          metadata,
        };

        eventsRef.current.push(event);

        // Keep only recent events
        if (eventsRef.current.length > fullConfig.maxEventsInMemory) {
          eventsRef.current = eventsRef.current.slice(-fullConfig.maxEventsInMemory);
        }
      }
    },
    [fullConfig]
  );

  /**
   * Complete tracking a storage operation
   */
  const completeOperation = useCallback(
    (success: boolean, error?: string, additionalMetadata?: Record<string, unknown>) => {
      if (!fullConfig.enabled || !currentOperationRef.current) return;

      const operationMetrics = currentOperationRef.current;
      operationMetrics.endTime = Date.now();
      operationMetrics.duration = operationMetrics.endTime - operationMetrics.startTime;
      operationMetrics.success = success;
      if (error) operationMetrics.error = error;

      if (fullConfig.trackDetailedMetrics) {
        const eventType: StorageTelemetryEventType = success
          ? 'storage_operation_success'
          : 'storage_operation_error';

        const event: StorageTelemetryEvent = {
          id: `storage_${operationMetrics.operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: eventType,
          timestamp: operationMetrics.endTime,
          sessionId: fullConfig.sessionId!,
          metrics: operationMetrics,
          metadata: additionalMetadata,
        };

        eventsRef.current.push(event);

        // Check for performance warnings
        if (
          operationMetrics.duration &&
          operationMetrics.duration > fullConfig.performanceWarningThreshold
        ) {
          const warningEvent: StorageTelemetryEvent = {
            id: `storage_perf_warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'storage_performance_warning',
            timestamp: operationMetrics.endTime,
            sessionId: fullConfig.sessionId!,
            metrics: operationMetrics,
            metadata: {
              warningThreshold: fullConfig.performanceWarningThreshold,
              actualDuration: operationMetrics.duration,
            },
          };
          eventsRef.current.push(warningEvent);
        }
      }

      currentOperationRef.current = null;
    },
    [fullConfig]
  );

  /**
   * Record a custom telemetry event
   */
  const recordEvent = useCallback(
    (
      type: StorageTelemetryEventType,
      metrics: Partial<StorageOperationMetrics>,
      metadata?: Record<string, unknown>
    ) => {
      if (!fullConfig.enabled) return;

      const event: StorageTelemetryEvent = {
        id: `storage_custom_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        timestamp: Date.now(),
        sessionId: fullConfig.sessionId!,
        metrics: {
          operation: 'validate', // Default operation type
          startTime: Date.now(),
          success: true,
          ...metrics,
        } as StorageOperationMetrics,
        metadata,
      };

      eventsRef.current.push(event);
    },
    [fullConfig]
  );

  /**
   * Calculate health metrics from telemetry data
   */
  const calculateHealthMetrics = useCallback((): StorageHealthMetrics => {
    const events = eventsRef.current;
    const operations = events.filter(
      (e) => e.type === 'storage_operation_success' || e.type === 'storage_operation_error'
    );

    const successful = operations.filter((e) => e.metrics.success);
    const failed = operations.filter((e) => !e.metrics.success);

    const totalDuration = operations.reduce(
      (sum, e) => sum + (e.metrics.duration || 0),
      0
    );

    const lastSuccessfulSave = operations
      .filter((e) => e.metrics.operation === 'save' && e.metrics.success)
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp;

    const lastSuccessfulLoad = operations
      .filter((e) => e.metrics.operation === 'load' && e.metrics.success)
      .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp;

    return {
      totalOperations: operations.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageDuration: operations.length > 0 ? totalDuration / operations.length : 0,
      errorRate: operations.length > 0 ? (failed.length / operations.length) * 100 : 0,
      lastSuccessfulSave,
      lastSuccessfulLoad,
    };
  }, []);

  /**
   * Export telemetry data
   */
  const exportTelemetryData = useCallback(() => {
    return {
      config: fullConfig,
      events: eventsRef.current,
      healthMetrics: calculateHealthMetrics(),
      exportTimestamp: Date.now(),
    };
  }, [fullConfig, calculateHealthMetrics]);

  /**
   * Clear telemetry data
   */
  const clearTelemetryData = useCallback(() => {
    eventsRef.current = [];
    currentOperationRef.current = null;
  }, []);

  return {
    config: fullConfig,
    startOperation,
    completeOperation,
    recordEvent,
    calculateHealthMetrics,
    exportTelemetryData,
    clearTelemetryData,
    get events() {
      return eventsRef.current;
    },
  };
}

/**
 * Storage telemetry utilities
 */
export class StorageTelemetryUtils {
  /**
   * Validate storage operation performance
   */
  static validatePerformance(duration: number, threshold: number): boolean {
    return duration <= threshold;
  }

  /**
   * Calculate storage operation throughput
   */
  static calculateThroughput(operations: number, timeWindow: number): number {
    return operations / (timeWindow / 1000); // operations per second
  }

  /**
   * Analyze error patterns
   */
  static analyzeErrorPatterns(events: StorageTelemetryEvent[]): Record<string, number> {
    const errorPatterns: Record<string, number> = {};

    events
      .filter((e) => e.type === 'storage_operation_error')
      .forEach((event) => {
        const operation = event.metrics.operation;
        const error = event.metrics.error || 'unknown_error';
        const key = `${operation}:${error}`;

        errorPatterns[key] = (errorPatterns[key] || 0) + 1;
      });

    return errorPatterns;
  }

  /**
   * Generate storage health report
   */
  static generateHealthReport(healthMetrics: StorageHealthMetrics): string {
    return `
Storage Health Report
=====================
Total Operations: ${healthMetrics.totalOperations}
Successful: ${healthMetrics.successfulOperations}
Failed: ${healthMetrics.failedOperations}
Error Rate: ${healthMetrics.errorRate.toFixed(2)}%
Average Duration: ${healthMetrics.averageDuration.toFixed(2)}ms
Last Successful Save: ${healthMetrics.lastSuccessfulSave ? new Date(healthMetrics.lastSuccessfulSave).toISOString() : 'Never'}
Last Successful Load: ${healthMetrics.lastSuccessfulLoad ? new Date(healthMetrics.lastSuccessfulLoad).toISOString() : 'Never'}
Storage Size: ${healthMetrics.storageSize || 'Unknown'} bytes
    `.trim();
  }
}
