/**
 * Punch Club Sync Conflict Telemetry
 * 
 * Telemetry tracking system for sync conflict resolution events.
 * Provides analytics on conflict patterns, resolution strategies,
 * and performance metrics for offline sync optimization.
 */

import { saveData } from '@/shared/persistence/PersistenceService';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';
import {
  ConflictResolutionResult,
  SyncConflictEvent,
  SyncConflictSeverity,
  MergeStrategy,
  DataType,
} from '@/service-worker/syncConflictResolverConfig';

const telemetryDiagnostics = createHeadlessDiagnostics('SyncConflictTelemetry');

/**
 * Sync conflict telemetry event types
 */
export type SyncConflictTelemetryEvent = 
  | 'pc_sync_conflict_detected'
  | 'pc_sync_conflict_resolved'
  | 'pc_sync_conflict_failed'
  | 'pc_sync_conflict_timeout'
  | 'pc_sync_conflict_manual_requested'
  | 'pc_sync_conflict_manual_completed';

/**
 * Base telemetry event structure
 */
export interface SyncConflictTelemetryData {
  eventType: SyncConflictTelemetryEvent;
  timestamp: number;
  sessionId: string;
  conflictId: string;
  dataType: DataType;
  severity: SyncConflictSeverity;
  context: Record<string, unknown>;
}

/**
 * Conflict detected telemetry data
 */
export interface ConflictDetectedTelemetry extends SyncConflictTelemetryData {
  eventType: 'pc_sync_conflict_detected';
  localTimestamp: number;
  remoteTimestamp: number;
  conflictFields: string[];
  recommendedStrategy: MergeStrategy;
  requiresManualResolution: boolean;
}

/**
 * Conflict resolved telemetry data
 */
export interface ConflictResolvedTelemetry extends SyncConflictTelemetryData {
  eventType: 'pc_sync_conflict_resolved';
  strategy: MergeStrategy;
  resolutionTime: number;
  requiredManualResolution: boolean;
  mergedFieldsCount: number;
  overwrittenFieldsCount: number;
  success: boolean;
}

/**
 * Conflict failed telemetry data
 */
export interface ConflictFailedTelemetry extends SyncConflictTelemetryData {
  eventType: 'pc_sync_conflict_failed';
  strategy: MergeStrategy;
  resolutionTime: number;
  errors: string[];
}

/**
 * Conflict timeout telemetry data
 */
export interface ConflictTimeoutTelemetry extends SyncConflictTelemetryData {
  eventType: 'pc_sync_conflict_timeout';
  timeoutMs: number;
  fallbackStrategy: MergeStrategy;
}

/**
 * Manual resolution requested telemetry data
 */
export interface ManualResolutionRequestedTelemetry extends SyncConflictTelemetryData {
  eventType: 'pc_sync_conflict_manual_requested';
  timeoutMs: number;
  fieldCount: number;
}

/**
 * Manual resolution completed telemetry data
 */
export interface ManualResolutionCompletedTelemetry extends SyncConflictTelemetryData {
  eventType: 'pc_sync_conflict_manual_completed';
  resolutionTime: number;
  selectedStrategy: MergeStrategy;
  fieldSelections: Record<string, 'local' | 'remote'>;
}

/**
 * Sync conflict telemetry manager
 */
export class SyncConflictTelemetry {
  private sessionId: string;
  private enabled: boolean;
  private batchSize: number;
  private eventQueue: SyncConflictTelemetryData[] = [];
  private flushInterval: number | null = null;

  constructor(config: {
    enabled?: boolean;
    batchSize?: number;
    flushInterval?: number;
  } = {}) {
    this.sessionId = this.generateSessionId();
    this.enabled = config.enabled ?? true;
    this.batchSize = config.batchSize ?? 10;
    
    if (config.flushInterval) {
      this.startAutoFlush(config.flushInterval);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start automatic flushing of events
   */
  private startAutoFlush(intervalMs: number): void {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, intervalMs) as unknown as number;
  }

  /**
   * Stop automatic flushing
   */
  stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Emit conflict detected event
   */
  async emitConflictDetected(conflict: SyncConflictEvent): Promise<void> {
    if (!this.enabled) return;

    const telemetry: ConflictDetectedTelemetry = {
      eventType: 'pc_sync_conflict_detected',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      conflictId: conflict.conflictId,
      dataType: conflict.dataType,
      severity: conflict.severity,
      context: conflict.context || {},
      localTimestamp: conflict.localTimestamp,
      remoteTimestamp: conflict.remoteTimestamp,
      conflictFields: conflict.conflictFields,
      recommendedStrategy: conflict.recommendedStrategy,
      requiresManualResolution: conflict.requiresManualResolution,
    };

    await this.addEvent(telemetry);
    telemetryDiagnostics.info('Conflict detected telemetry emitted', {
      conflictId: conflict.conflictId,
      dataType: conflict.dataType,
      severity: conflict.severity,
    });
  }

  /**
   * Emit conflict resolved event
   */
  async emitConflictResolved(result: ConflictResolutionResult): Promise<void> {
    if (!this.enabled) return;

    const telemetry: ConflictResolvedTelemetry = {
      eventType: 'pc_sync_conflict_resolved',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      conflictId: result.conflictId,
      dataType: 'game_state' as DataType, // This would need to be passed from the conflict
      severity: 'medium' as SyncConflictSeverity, // This would need to be passed from the conflict
      context: {},
      strategy: result.strategy,
      resolutionTime: result.resolutionTime,
      requiredManualResolution: result.requiredManualResolution,
      mergedFieldsCount: result.mergedFields?.length || 0,
      overwrittenFieldsCount: result.overwrittenFields?.length || 0,
      success: result.success,
    };

    await this.addEvent(telemetry);
    telemetryDiagnostics.info('Conflict resolved telemetry emitted', {
      conflictId: result.conflictId,
      strategy: result.strategy,
      resolutionTime: result.resolutionTime,
      success: result.success,
    });
  }

  /**
   * Emit conflict failed event
   */
  async emitConflictFailed(
    conflict: SyncConflictEvent,
    strategy: MergeStrategy,
    errors: string[],
    resolutionTime: number
  ): Promise<void> {
    if (!this.enabled) return;

    const telemetry: ConflictFailedTelemetry = {
      eventType: 'pc_sync_conflict_failed',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      conflictId: conflict.conflictId,
      dataType: conflict.dataType,
      severity: conflict.severity,
      context: conflict.context || {},
      strategy,
      resolutionTime,
      errors,
    };

    await this.addEvent(telemetry);
    telemetryDiagnostics.warn('Conflict failed telemetry emitted', {
      conflictId: conflict.conflictId,
      strategy,
      errorCount: errors.length,
    });
  }

  /**
   * Emit conflict timeout event
   */
  async emitConflictTimeout(
    conflict: SyncConflictEvent,
    timeoutMs: number,
    fallbackStrategy: MergeStrategy
  ): Promise<void> {
    if (!this.enabled) return;

    const telemetry: ConflictTimeoutTelemetry = {
      eventType: 'pc_sync_conflict_timeout',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      conflictId: conflict.conflictId,
      dataType: conflict.dataType,
      severity: conflict.severity,
      context: conflict.context || {},
      timeoutMs,
      fallbackStrategy,
    };

    await this.addEvent(telemetry);
    telemetryDiagnostics.warn('Conflict timeout telemetry emitted', {
      conflictId: conflict.conflictId,
      timeoutMs,
      fallbackStrategy,
    });
  }

  /**
   * Emit manual resolution requested event
   */
  async emitManualResolutionRequested(
    conflict: SyncConflictEvent,
    timeoutMs: number
  ): Promise<void> {
    if (!this.enabled) return;

    const telemetry: ManualResolutionRequestedTelemetry = {
      eventType: 'pc_sync_conflict_manual_requested',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      conflictId: conflict.conflictId,
      dataType: conflict.dataType,
      severity: conflict.severity,
      context: conflict.context || {},
      timeoutMs,
      fieldCount: conflict.conflictFields.length,
    };

    await this.addEvent(telemetry);
    telemetryDiagnostics.info('Manual resolution requested telemetry emitted', {
      conflictId: conflict.conflictId,
      fieldCount: conflict.conflictFields.length,
    });
  }

  /**
   * Emit manual resolution completed event
   */
  async emitManualResolutionCompleted(
    conflict: SyncConflictEvent,
    resolutionTime: number,
    selectedStrategy: MergeStrategy,
    fieldSelections: Record<string, 'local' | 'remote'>
  ): Promise<void> {
    if (!this.enabled) return;

    const telemetry: ManualResolutionCompletedTelemetry = {
      eventType: 'pc_sync_conflict_manual_completed',
      timestamp: Date.now(),
      sessionId: this.sessionId,
      conflictId: conflict.conflictId,
      dataType: conflict.dataType,
      severity: conflict.severity,
      context: conflict.context || {},
      resolutionTime,
      selectedStrategy,
      fieldSelections,
    };

    await this.addEvent(telemetry);
    telemetryDiagnostics.info('Manual resolution completed telemetry emitted', {
      conflictId: conflict.conflictId,
      resolutionTime,
      selectedStrategy,
    });
  }

  /**
   * Add event to queue and flush if needed
   */
  private async addEvent(event: SyncConflictTelemetryData): Promise<void> {
    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }
  }

  /**
   * Flush events to persistence
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await saveData(`sync-telemetry-${Date.now()}`, {
        sessionId: this.sessionId,
        events,
        timestamp: Date.now(),
      });

      telemetryDiagnostics.debug('Telemetry events flushed', {
        eventCount: events.length,
        sessionId: this.sessionId,
      });
    } catch (error) {
      telemetryDiagnostics.error('Failed to flush telemetry events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Get telemetry statistics for current session
   */
  getSessionStats(): {
    totalEvents: number;
    eventsByType: Record<SyncConflictTelemetryEvent, number>;
    eventsByDataType: Record<DataType, number>;
    eventsBySeverity: Record<SyncConflictSeverity, number>;
    averageResolutionTime: number;
    successRate: number;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsByDataType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    let successCount = 0;

    for (const event of this.eventQueue) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsByDataType[event.dataType] = (eventsByDataType[event.dataType] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

      if (event.eventType === 'pc_sync_conflict_resolved') {
        const resolvedEvent = event as ConflictResolvedTelemetry;
        totalResolutionTime += resolvedEvent.resolutionTime;
        resolutionCount++;
        if (resolvedEvent.success) {
          successCount++;
        }
      }
    }

    return {
      totalEvents: this.eventQueue.length,
      eventsByType: eventsByType as Record<SyncConflictTelemetryEvent, number>,
      eventsByDataType: eventsByDataType as Record<DataType, number>,
      eventsBySeverity: eventsBySeverity as Record<SyncConflictSeverity, number>,
      averageResolutionTime: resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0,
      successRate: resolutionCount > 0 ? (successCount / resolutionCount) * 100 : 0,
    };
  }

  /**
   * Clear all events and reset session
   */
  async clearSession(): Promise<void> {
    await this.flushEvents();
    this.eventQueue = [];
    this.sessionId = this.generateSessionId();
    telemetryDiagnostics.info('Telemetry session cleared', {
      newSessionId: this.sessionId,
    });
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    telemetryDiagnostics.info('Telemetry enabled state changed', { enabled });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopAutoFlush();
    this.eventQueue = [];
  }
}

/**
 * Global telemetry instance
 */
export const syncConflictTelemetry = new SyncConflictTelemetry({
  enabled: true,
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
});

/**
 * Hook for using sync conflict telemetry in React components
 */
export function useSyncConflictTelemetry() {
  const getSessionStats = () => syncConflictTelemetry.getSessionStats();
  const clearSession = () => syncConflictTelemetry.clearSession();
  const setEnabled = (enabled: boolean) => syncConflictTelemetry.setEnabled(enabled);

  return {
    telemetry: syncConflictTelemetry,
    getSessionStats,
    clearSession,
    setEnabled,
  };
}
