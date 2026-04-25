/**
 * Punch Club Offline Sync Conflict Resolver
 * 
 * Config-first system for detecting and resolving sync conflicts between
 * local and remote data with automatic and manual merge strategies.
 * Prevents data loss during synchronization operations.
 */

import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import {
  DEFAULT_SYNC_CONFLICT_RESOLVER_CONFIG,
  SyncConflictResolverConfig,
  SyncConflictEvent,
  ConflictResolutionResult,
  MergeStrategy,
  DataType,
  SyncConflictSeverity,
  SyncConflictResolverUtils,
} from './syncConflictResolverConfig';

const resolverDiagnostics = createSandboxDiagnostics('SyncConflictResolver');

/**
 * Conflict history entry
 */
interface ConflictHistoryEntry {
  conflictId: string;
  timestamp: number;
  dataType: DataType;
  severity: SyncConflictSeverity;
  strategy: MergeStrategy;
  success: boolean;
  resolutionTime: number;
}

/**
 * Pending manual resolution queue
 */
interface PendingResolution {
  conflict: SyncConflictEvent;
  resolve: (result: ConflictResolutionResult) => void;
  timeout: number;
  createdAt: number;
}

/**
 * Main sync conflict resolver class
 */
export class SyncConflictResolver {
  private config: SyncConflictResolverConfig;
  private conflictHistory: ConflictHistoryEntry[] = [];
  private pendingResolutions: Map<string, PendingResolution> = new Map();
  private isInitialized = false;

  constructor(config: SyncConflictResolverConfig = DEFAULT_SYNC_CONFLICT_RESOLVER_CONFIG) {
    this.config = { ...config };
  }

  /**
   * Initialize the resolver with persisted state
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load conflict history
      const savedHistory = await loadData<ConflictHistoryEntry[]>('sync-conflict-history', []);
      this.conflictHistory = savedHistory.slice(-this.config.global.maxConflictHistory);

      resolverDiagnostics.info('Sync conflict resolver initialized', {
        historySize: this.conflictHistory.length,
        configKeys: Object.keys(this.config),
      });

      this.isInitialized = true;
    } catch (error) {
      resolverDiagnostics.error('Failed to initialize sync conflict resolver:', error);
      throw error;
    }
  }

  /**
   * Detect conflicts between local and remote data
   */
  async detectConflicts(
    localData: Record<string, unknown>,
    remoteData: Record<string, unknown>,
    dataType: DataType
  ): Promise<SyncConflictEvent[]> {
    const conflicts: SyncConflictEvent[] = [];
    const rule = SyncConflictResolverUtils.getDetectionRule(this.config, dataType);

    if (!rule) {
      resolverDiagnostics.warn('No detection rule found for data type:', dataType);
      return conflicts;
    }

    const localTimestamp = (localData.lastModified as number) || Date.now();
    const remoteTimestamp = (remoteData.lastModified as number) || Date.now();

    // Check each conflict field
    for (const fieldPath of rule.conflictFields) {
      const localValue = this.getNestedValue(localData, fieldPath);
      const remoteValue = this.getNestedValue(remoteData, fieldPath);

      if (!this.deepEqual(localValue, remoteValue)) {
        const conflict: SyncConflictEvent = {
          conflictId: SyncConflictResolverUtils.generateConflictId(dataType, localTimestamp, remoteTimestamp),
          dataType,
          severity: rule.severity,
          localData,
          remoteData,
          localTimestamp,
          remoteTimestamp,
          conflictFields: [fieldPath],
          recommendedStrategy: rule.defaultStrategy,
          requiresManualResolution: rule.requireManualResolution,
          context: {
            fieldPath,
            localValue: JSON.stringify(localValue),
            remoteValue: JSON.stringify(remoteValue),
          },
        };

        conflicts.push(conflict);
        resolverDiagnostics.debug('Conflict detected', {
          conflictId: conflict.conflictId,
          dataType,
          fieldPath,
          severity: rule.severity,
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolve a sync conflict using the specified strategy
   */
  async resolveConflict(
    conflict: SyncConflictEvent,
    strategy?: MergeStrategy
  ): Promise<ConflictResolutionResult> {
    const startTime = Date.now();
    const resolutionStrategy = strategy || conflict.recommendedStrategy;

    try {
      resolverDiagnostics.info('Resolving conflict', {
        conflictId: conflict.conflictId,
        strategy: resolutionStrategy,
        dataType: conflict.dataType,
      });

      let result: ConflictResolutionResult;

      switch (resolutionStrategy) {
        case 'local_wins':
          result = await this.resolveLocalWins(conflict);
          break;
        case 'remote_wins':
          result = await this.resolveRemoteWins(conflict);
          break;
        case 'most_recent':
          result = await this.resolveMostRecent(conflict);
          break;
        case 'merge_fields':
          result = await this.resolveMergeFields(conflict);
          break;
        case 'auto_merge':
          result = await this.resolveAutoMerge(conflict);
          break;
        case 'manual_resolve':
          result = await this.requestManualResolution(conflict);
          break;
        default:
          throw new Error(`Unknown merge strategy: ${resolutionStrategy}`);
      }

      // Validate result
      if (!SyncConflictResolverUtils.validateResolutionResult(result)) {
        throw new Error('Invalid resolution result');
      }

      // Update conflict history
      await this.updateConflictHistory(conflict, result);

      // Emit telemetry event
      if (this.config.global.enableTelemetry) {
        await this.emitTelemetryEvent(result);
      }

      const resolutionTime = Date.now() - startTime;
      resolverDiagnostics.info('Conflict resolved successfully', {
        conflictId: conflict.conflictId,
        strategy: resolutionStrategy,
        resolutionTime,
        success: result.success,
      });

      return result;

    } catch (error) {
      const resolutionTime = Date.now() - startTime;
      const errorResult: ConflictResolutionResult = {
        conflictId: conflict.conflictId,
        strategy: resolutionStrategy,
        success: false,
        resolvedData: conflict.localData, // Fallback to local data
        resolutionTime,
        requiredManualResolution: false,
        errors: [error instanceof Error ? error.message : String(error)],
        resolvedAt: Date.now(),
      };

      resolverDiagnostics.error('Failed to resolve conflict', {
        conflictId: conflict.conflictId,
        strategy: resolutionStrategy,
        error: error instanceof Error ? error.message : String(error),
      });

      return errorResult;
    }
  }

  /**
   * Resolve conflict by keeping local data
   */
  private async resolveLocalWins(conflict: SyncConflictEvent): Promise<ConflictResolutionResult> {
    return {
      conflictId: conflict.conflictId,
      strategy: 'local_wins',
      success: true,
      resolvedData: conflict.localData,
      resolutionTime: 0,
      requiredManualResolution: false,
      overwrittenFields: conflict.conflictFields,
      resolvedAt: Date.now(),
    };
  }

  /**
   * Resolve conflict by keeping remote data
   */
  private async resolveRemoteWins(conflict: SyncConflictEvent): Promise<ConflictResolutionResult> {
    return {
      conflictId: conflict.conflictId,
      strategy: 'remote_wins',
      success: true,
      resolvedData: conflict.remoteData,
      resolutionTime: 0,
      requiredManualResolution: false,
      overwrittenFields: conflict.conflictFields,
      resolvedAt: Date.now(),
    };
  }

  /**
   * Resolve conflict by keeping most recent data
   */
  private async resolveMostRecent(conflict: SyncConflictEvent): Promise<ConflictResolutionResult> {
    const winner = conflict.localTimestamp > conflict.remoteTimestamp ? 'local' : 'remote';
    const winnerData = winner === 'local' ? conflict.localData : conflict.remoteData;

    return {
      conflictId: conflict.conflictId,
      strategy: 'most_recent',
      success: true,
      resolvedData: winnerData,
      resolutionTime: 0,
      requiredManualResolution: false,
      overwrittenFields: conflict.conflictFields,
      resolvedAt: Date.now(),
    };
  }

  /**
   * Resolve conflict by merging fields with priority rules
   */
  private async resolveMergeFields(conflict: SyncConflictEvent): Promise<ConflictResolutionResult> {
    const mergedData = { ...conflict.localData };
    const mergedFields: string[] = [];
    const overwrittenFields: string[] = [];

    for (const fieldPath of conflict.conflictFields) {
      const fieldConfig = SyncConflictResolverUtils.getFieldMergeConfig(this.config, fieldPath);
      const strategy = fieldConfig?.strategy || 'most_recent';

      let selectedValue: unknown;
      let winner: 'local' | 'remote';

      switch (strategy) {
        case 'local_wins':
          selectedValue = this.getNestedValue(conflict.localData, fieldPath);
          winner = 'local';
          break;
        case 'remote_wins':
          selectedValue = this.getNestedValue(conflict.remoteData, fieldPath);
          winner = 'remote';
          break;
        case 'most_recent':
          winner = conflict.localTimestamp > conflict.remoteTimestamp ? 'local' : 'remote';
          selectedValue = winner === 'local' 
            ? this.getNestedValue(conflict.localData, fieldPath)
            : this.getNestedValue(conflict.remoteData, fieldPath);
          break;
        default:
          // Default to most recent
          winner = conflict.localTimestamp > conflict.remoteTimestamp ? 'local' : 'remote';
          selectedValue = winner === 'local' 
            ? this.getNestedValue(conflict.localData, fieldPath)
            : this.getNestedValue(conflict.remoteData, fieldPath);
          break;
      }

      this.setNestedValue(mergedData, fieldPath, selectedValue);
      
      if (winner === 'local') {
        overwrittenFields.push(fieldPath);
      } else {
        mergedFields.push(fieldPath);
      }
    }

    return {
      conflictId: conflict.conflictId,
      strategy: 'merge_fields',
      success: true,
      resolvedData: mergedData,
      resolutionTime: 0,
      requiredManualResolution: false,
      mergedFields,
      overwrittenFields,
      resolvedAt: Date.now(),
    };
  }

  /**
   * Resolve conflict with automatic intelligent merge
   */
  private async resolveAutoMerge(conflict: SyncConflictEvent): Promise<ConflictResolutionResult> {
    // Check data size limits
    const dataSize = JSON.stringify(conflict.localData).length + JSON.stringify(conflict.remoteData).length;
    if (dataSize > this.config.validation.maxAutoMergeSize) {
      resolverDiagnostics.warn('Data too large for auto-merge, falling back to most_recent', {
        conflictId: conflict.conflictId,
        dataSize,
        maxSize: this.config.validation.maxAutoMergeSize,
      });
      return this.resolveMostRecent(conflict);
    }

    // Use field-level merge for intelligent auto-merge
    return this.resolveMergeFields(conflict);
  }

  /**
   * Request manual resolution from user
   */
  private async requestManualResolution(conflict: SyncConflictEvent): Promise<ConflictResolutionResult> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        // Timeout - fallback to most recent
        resolverDiagnostics.warn('Manual resolution timeout, using fallback strategy', {
          conflictId: conflict.conflictId,
          timeout: this.config.global.manualResolutionTimeout,
        });
        
        resolve(this.resolveMostRecent(conflict));
      }, this.config.global.manualResolutionTimeout);

      const pendingResolution: PendingResolution = {
        conflict,
        resolve: (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        timeout: timeoutId as unknown as number,
        createdAt: Date.now(),
      };

      this.pendingResolutions.set(conflict.conflictId, pendingResolution);

      // Emit event for UI to handle
      this.emitManualResolutionRequest(conflict);
    });
  }

  /**
   * Handle manual resolution response from UI
   */
  async handleManualResolution(
    conflictId: string,
    resolutionData: Record<string, unknown>,
    strategy: MergeStrategy
  ): Promise<void> {
    const pending = this.pendingResolutions.get(conflictId);
    if (!pending) {
      resolverDiagnostics.warn('No pending resolution found for conflict:', conflictId);
      return;
    }

    const result: ConflictResolutionResult = {
      conflictId,
      strategy,
      success: true,
      resolvedData: resolutionData,
      resolutionTime: Date.now() - pending.createdAt,
      requiredManualResolution: true,
      mergedFields: pending.conflict.conflictFields,
      resolvedAt: Date.now(),
    };

    pending.resolve(result);
    this.pendingResolutions.delete(conflictId);

    resolverDiagnostics.info('Manual resolution completed', {
      conflictId,
      strategy,
      resolutionTime: result.resolutionTime,
    });
  }

  /**
   * Get conflict resolution statistics
   */
  getResolutionStats(): {
    totalConflicts: number;
    successRate: number;
    averageResolutionTime: number;
    strategyUsage: Record<MergeStrategy, number>;
    severityBreakdown: Record<SyncConflictSeverity, number>;
  } {
    if (this.conflictHistory.length === 0) {
      return {
        totalConflicts: 0,
        successRate: 0,
        averageResolutionTime: 0,
        strategyUsage: {} as Record<MergeStrategy, number>,
        severityBreakdown: {} as Record<SyncConflictSeverity, number>,
      };
    }

    const successfulConflicts = this.conflictHistory.filter(entry => entry.success);
    const totalResolutionTime = this.conflictHistory.reduce((sum, entry) => sum + entry.resolutionTime, 0);

    const strategyUsage: Record<string, number> = {};
    const severityBreakdown: Record<string, number> = {};

    for (const entry of this.conflictHistory) {
      strategyUsage[entry.strategy] = (strategyUsage[entry.strategy] || 0) + 1;
      severityBreakdown[entry.severity] = (severityBreakdown[entry.severity] || 0) + 1;
    }

    return {
      totalConflicts: this.conflictHistory.length,
      successRate: (successfulConflicts.length / this.conflictHistory.length) * 100,
      averageResolutionTime: totalResolutionTime / this.conflictHistory.length,
      strategyUsage: strategyUsage as Record<MergeStrategy, number>,
      severityBreakdown: severityBreakdown as Record<SyncConflictSeverity, number>,
    };
  }

  /**
   * Clear conflict history
   */
  async clearHistory(): Promise<void> {
    this.conflictHistory = [];
    await saveData('sync-conflict-history', []);
    resolverDiagnostics.info('Conflict history cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SyncConflictResolverConfig>): void {
    this.config = { ...this.config, ...newConfig };
    resolverDiagnostics.info('Configuration updated', { updatedKeys: Object.keys(newConfig) });
  }

  // Private helper methods

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined;
    }, obj);
  }

  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current || typeof current !== 'object') return {};
      if (!(key in current)) {
        (current as Record<string, unknown>)[key] = {};
      }
      return (current as Record<string, unknown>)[key] as Record<string, unknown>;
    }, obj);
    target[lastKey] = value;
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      const keysA = Object.keys(a as Record<string, unknown>);
      const keysB = Object.keys(b as Record<string, unknown>);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
          return false;
        }
      }
      
      return true;
    }

    return false;
  }

  private async updateConflictHistory(conflict: SyncConflictEvent, result: ConflictResolutionResult): Promise<void> {
    const entry: ConflictHistoryEntry = {
      conflictId: conflict.conflictId,
      timestamp: Date.now(),
      dataType: conflict.dataType,
      severity: conflict.severity,
      strategy: result.strategy,
      success: result.success,
      resolutionTime: result.resolutionTime,
    };

    this.conflictHistory.push(entry);

    // Trim history if needed
    if (this.conflictHistory.length > this.config.global.maxConflictHistory) {
      this.conflictHistory = this.conflictHistory.slice(-this.config.global.maxConflictHistory);
    }

    await saveData('sync-conflict-history', this.conflictHistory);
  }

  private async emitTelemetryEvent(result: ConflictResolutionResult): Promise<void> {
    try {
      const telemetryData = {
        eventType: 'pc_sync_conflict_resolved',
        data: {
          conflictId: result.conflictId,
          strategy: result.strategy,
          success: result.success,
          resolutionTime: result.resolutionTime,
          requiredManualResolution: result.requiredManualResolution,
          mergedFieldsCount: result.mergedFields?.length || 0,
          overwrittenFieldsCount: result.overwrittenFields?.length || 0,
          timestamp: result.resolvedAt,
        },
      };

      // Save telemetry event
      await saveData(`telemetry-${Date.now()}`, telemetryData);
      
      resolverDiagnostics.debug('Telemetry event emitted', telemetryData);
    } catch (error) {
      resolverDiagnostics.error('Failed to emit telemetry event:', error);
    }
  }

  private emitManualResolutionRequest(conflict: SyncConflictEvent): void {
    // In a real implementation, this would emit a custom event or use a message bus
    // For now, we'll use a simple approach with window events for the UI to listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('syncConflictManualResolution', {
        detail: {
          conflictId: conflict.conflictId,
          dataType: conflict.dataType,
          severity: conflict.severity,
          localData: conflict.localData,
          remoteData: conflict.remoteData,
          conflictFields: conflict.conflictFields,
          context: conflict.context,
        },
      }));
    }

    resolverDiagnostics.info('Manual resolution request emitted', {
      conflictId: conflict.conflictId,
      dataType: conflict.dataType,
    });
  }
}

/**
 * Global sync conflict resolver instance
 */
export const syncConflictResolver = new SyncConflictResolver();
