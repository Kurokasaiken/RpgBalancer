/**
 * Undo/Redo Persistence Monitor
 * 
 * Monitors undo/redo operations in BalancerConfigStore for integrity,
 * performance, and data corruption detection.
 * 
 * @since 2026-01-19
 * @author Sentinel-Balancer – Persistence Monitor
 */

import type { ConfigSnapshot, BalancerConfig } from '@/balancing/config/types';
import { BalancerConfigStore } from '@/balancing/config/BalancerConfigStore';
import { 
  type UndoRedoMonitorConfig,
  type UndoRedoMonitorState,
  type UndoRedoIntegrityResult,
  type UndoRedoOperation,
  type IntegrityIssue,
  type UndoRedoMetrics,
  type IntegrityIssueType,
  type IntegritySeverity,
  DEFAULT_UNDO_REDO_MONITOR_CONFIG,
  UndoRedoMonitorConfigSchema,
} from './undoRedoMonitorSchema';

/**
 * Simple checksum implementation
 */
function generateSimpleChecksum(data: unknown): string {
  const str = JSON.stringify(data, Object.keys(data).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Checksum generation functions
 */
const CHECKSUM_FUNCTIONS = {
  simple: generateSimpleChecksum,
  sha256: async (data: unknown) => {
    // Simple fallback for now - in real implementation would use crypto.subtle
    return generateSimpleChecksum(data);
  },
  md5: async (data: unknown) => {
    // Simple fallback for now - in real implementation would use crypto
    return generateSimpleChecksum(data);
  },
} as const;

/**
 * Undo/Redo Persistence Monitor
 */
export class UndoRedoPersistenceMonitor {
  private state: UndoRedoMonitorState;
  private integrityCheckTimer?: NodeJS.Timeout;
  private operationStartTime?: number;

  constructor(config: Partial<UndoRedoMonitorConfig> = {}) {
    const validatedConfig = UndoRedoMonitorConfigSchema.parse({
      ...DEFAULT_UNDO_REDO_MONITOR_CONFIG,
      ...config,
    });

    this.state = {
      isMonitoring: false,
      operationHistory: [],
      metrics: {
        undoCount: 0,
        redoCount: 0,
        avgUndoTime: 0,
        avgRedoTime: 0,
        historyDepth: 0,
        maxHistoryDepth: 0,
        totalDataSize: 0,
        integrityIssues: 0,
      },
      config: validatedConfig,
    };
  }

  /**
   * Start monitoring undo/redo operations
   */
  startMonitoring(): void {
    if (this.state.isMonitoring) {
      console.warn('[UndoRedoMonitor] Already monitoring');
      return;
    }

    this.state.isMonitoring = true;
    this.state.startedAt = Date.now();

    // Set up periodic integrity checks if configured
    if (this.state.config.integrityCheckInterval > 0) {
      this.integrityCheckTimer = setInterval(() => {
        this.performIntegrityCheck().catch(console.error);
      }, this.state.config.integrityCheckInterval);
    }

    console.log('[UndoRedoMonitor] Started monitoring');
  }

  /**
   * Stop monitoring undo/redo operations
   */
  stopMonitoring(): void {
    if (!this.state.isMonitoring) {
      console.warn('[UndoRedoMonitor] Not monitoring');
      return;
    }

    this.state.isMonitoring = false;

    if (this.integrityCheckTimer) {
      clearInterval(this.integrityCheckTimer);
      this.integrityCheckTimer = undefined;
    }

    console.log('[UndoRedoMonitor] Stopped monitoring');
  }

  /**
   * Record an undo/redo operation
   */
  recordOperation(
    type: UndoRedoOperation['type'],
    success: boolean,
    error?: string,
    metadata?: Record<string, unknown>
  ): void {
    if (!this.state.isMonitoring) return;

    const duration = this.operationStartTime ? Date.now() - this.operationStartTime : 0;
    const history = BalancerConfigStore.getHistory();
    
    const operation: UndoRedoOperation = {
      type,
      timestamp: Date.now(),
      duration,
      success,
      error,
      historyDepthBefore: this.state.metrics.historyDepth,
      historyDepthAfter: history.length,
      metadata,
    };

    // Update metrics
    if (type === 'undo' && success) {
      this.state.metrics.undoCount++;
      this.state.metrics.avgUndoTime = 
        (this.state.metrics.avgUndoTime * (this.state.metrics.undoCount - 1) + duration) / 
        this.state.metrics.undoCount;
    } else if (type === 'redo' && success) {
      this.state.metrics.redoCount++;
      this.state.metrics.avgRedoTime = 
        (this.state.metrics.avgRedoTime * (this.state.metrics.redoCount - 1) + duration) / 
        this.state.metrics.redoCount;
    }

    this.state.metrics.historyDepth = history.length;
    this.state.metrics.maxHistoryDepth = Math.max(
      this.state.metrics.maxHistoryDepth,
      history.length
    );

    // Calculate data size
    const currentConfig = BalancerConfigStore.getCurrentConfigSnapshot();
    if (currentConfig) {
      this.state.metrics.totalDataSize = JSON.stringify(currentConfig).length;
    }

    // Add to operation history (keep last 100)
    this.state.operationHistory.unshift(operation);
    if (this.state.operationHistory.length > 100) {
      this.state.operationHistory = this.state.operationHistory.slice(0, 100);
    }

    // Log slow operations
    if (this.state.config.enablePerformanceMonitoring && 
        duration > this.state.config.slowOperationThreshold) {
      console.warn(`[UndoRedoMonitor] Slow ${type} operation: ${duration}ms`);
    }
  }

  /**
   * Start timing an operation
   */
  startOperation(): void {
    this.operationStartTime = Date.now();
  }

  /**
   * Perform comprehensive integrity check
   */
  async performIntegrityCheck(): Promise<UndoRedoIntegrityResult> {
    const startTime = Date.now();
    const issues: IntegrityIssue[] = [];
    const recommendations: string[] = [];

    try {
      // Get current state
      const currentConfig = BalancerConfigStore.getCurrentConfigSnapshot();
      const history = BalancerConfigStore.getHistory();

      if (!currentConfig) {
        issues.push({
          id: 'no-current-config',
          type: 'data_corruption',
          severity: 'critical',
          description: 'No current configuration found',
          details: { error: 'ConfigStore returned null' },
          detectedAt: Date.now(),
          resolved: false,
        });
      }

      // Check history depth
      if (history.length > this.state.config.maxHistoryDepth) {
        issues.push({
          id: 'history-depth-exceeded',
          type: 'history_depth_exceeded',
          severity: 'medium',
          description: `History depth (${history.length}) exceeds maximum (${this.state.config.maxHistoryDepth})`,
          details: { 
            currentDepth: history.length,
            maxDepth: this.state.config.maxHistoryDepth,
          },
          detectedAt: Date.now(),
          resolved: false,
        });
        recommendations.push('Consider increasing maxHistoryDepth or implementing history cleanup');
      }

      // Check data size
      const dataSize = JSON.stringify(currentConfig).length;
      if (dataSize > this.state.config.maxDataSizeWarning) {
        issues.push({
          id: 'data-size-warning',
          type: 'storage_failure',
          severity: 'low',
          description: `Data size (${dataSize} bytes) exceeds warning threshold (${this.state.config.maxDataSizeWarning} bytes)`,
          details: { 
            currentSize: dataSize,
            warningThreshold: this.state.config.maxDataSizeWarning,
          },
          detectedAt: Date.now(),
          resolved: false,
        });
        recommendations.push('Consider data cleanup or increasing storage limits');
      }

      // Validate history snapshots
      for (let i = 0; i < history.length; i++) {
        const snapshot = history[i];
        
        // Check timestamp validity
        if (snapshot.timestamp <= 0 || snapshot.timestamp > Date.now()) {
          issues.push({
            id: `invalid-timestamp-${i}`,
            type: 'timestamp_invalid',
            severity: 'medium',
            description: `Invalid timestamp in history snapshot ${i}`,
            details: { 
              snapshotIndex: i,
              timestamp: snapshot.timestamp,
              expectedRange: '0 < timestamp <= current time',
            },
            detectedAt: Date.now(),
            resolved: false,
          });
        }

        // Check snapshot structure
        if (!snapshot.config || !snapshot.description) {
          issues.push({
            id: `invalid-structure-${i}`,
            type: 'structure_invalid',
            severity: 'high',
            description: `Invalid structure in history snapshot ${i}`,
            details: { 
              snapshotIndex: i,
              hasConfig: !!snapshot.config,
              hasDescription: !!snapshot.description,
            },
            detectedAt: Date.now(),
            resolved: false,
          });
        }
      }

      // Calculate checksums
      const checksumFn = CHECKSUM_FUNCTIONS[this.state.config.checksumAlgorithm];
      const currentChecksum = await checksumFn(currentConfig);

      // Verify history checksums if available
      for (let i = 0; i < history.length; i++) {
        const snapshot = history[i];
        if (snapshot.checksum) {
          const calculatedChecksum = await checksumFn(snapshot.config);
          if (calculatedChecksum !== snapshot.checksum) {
            issues.push({
              id: `checksum-mismatch-${i}`,
              type: 'checksum_mismatch',
              severity: 'critical',
              description: `Checksum mismatch in history snapshot ${i}`,
              details: { 
                snapshotIndex: i,
                expected: snapshot.checksum,
                calculated: calculatedChecksum,
              },
              detectedAt: Date.now(),
              resolved: false,
            });
            recommendations.push(`Restore from backup or repair corrupted snapshot ${i}`);
          }
        }
      }

      // Update metrics
      this.state.metrics.integrityIssues = issues.length;

      const result: UndoRedoIntegrityResult = {
        passed: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        currentChecksum,
        snapshotsAnalyzed: history.length,
        issues,
        metrics: { ...this.state.metrics },
        recommendations,
      };

      this.state.lastIntegrityCheck = result;

      // Log results
      if (result.passed) {
        console.log(`[UndoRedoMonitor] Integrity check passed in ${result.duration}ms`);
      } else {
        console.warn(`[UndoRedoMonitor] Integrity check failed: ${issues.length} issues found`);
        issues.forEach(issue => {
          console.warn(`  [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.description}`);
        });
      }

      return result;

    } catch (error) {
      const issue: IntegrityIssue = {
        id: 'integrity-check-error',
        type: 'storage_failure',
        severity: 'critical',
        description: 'Integrity check failed with error',
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        detectedAt: Date.now(),
        resolved: false,
      };

      return {
        passed: false,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        currentChecksum: 'unknown',
        snapshotsAnalyzed: 0,
        issues: [issue],
        metrics: { ...this.state.metrics },
        recommendations: ['Check storage permissions and data integrity'],
      };
    }
  }

  /**
   * Get current monitor state
   */
  getState(): UndoRedoMonitorState {
    return { ...this.state };
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit?: number): UndoRedoOperation[] {
    return limit ? this.state.operationHistory.slice(0, limit) : [...this.state.operationHistory];
  }

  /**
   * Get current metrics
   */
  getMetrics(): UndoRedoMetrics {
    return { ...this.state.metrics };
  }

  /**
   * Get last integrity check result
   */
  getLastIntegrityCheck(): UndoRedoIntegrityResult | undefined {
    return this.state.lastIntegrityCheck;
  }

  /**
   * Clear operation history
   */
  clearHistory(): void {
    this.state.operationHistory = [];
    console.log('[UndoRedoMonitor] Operation history cleared');
  }

  /**
   * Update monitor configuration
   */
  updateConfig(newConfig: Partial<UndoRedoMonitorConfig>): void {
    const validatedConfig = UndoRedoMonitorConfigSchema.parse({
      ...this.state.config,
      ...newConfig,
    });

    this.state.config = validatedConfig;

    // Restart monitoring if interval changed
    if (this.state.isMonitoring && this.integrityCheckTimer) {
      clearInterval(this.integrityCheckTimer);
      this.integrityCheckTimer = undefined;

      if (validatedConfig.integrityCheckInterval > 0) {
        this.integrityCheckTimer = setInterval(() => {
          this.performIntegrityCheck().catch(console.error);
        }, validatedConfig.integrityCheckInterval);
      }
    }

    console.log('[UndoRedoMonitor] Configuration updated');
  }

  /**
   * Export monitor state for debugging
   */
  exportState(): string {
    return JSON.stringify({
      state: this.state,
      exportedAt: Date.now(),
    }, null, 2);
  }
}

// Singleton instance
export const undoRedoMonitor = new UndoRedoPersistenceMonitor();
