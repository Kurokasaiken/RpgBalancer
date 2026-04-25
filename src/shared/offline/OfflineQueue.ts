/**
 * Offline Queue System
 *
 * Config-first offline operation queue with automatic sync, conflict resolution,
 * and telemetry driven by offlineQueueConfig.ts. All persistence flows through
 * PersistenceService to honor mobile/offline safety requirements.
 */

import { saveData, loadData } from '../persistence/PersistenceService';
import {
  type OfflineQueueConfig,
  type QueuedOperation,
  type ConflictResolution,
  type SyncStatus,
  type OfflineQueueMetrics,
  type NetworkStatus,
  DEFAULT_OFFLINE_QUEUE_CONFIG,
  getOperationPriority,
  isCriticalOperation,
  calculateRetryDelay,
  detectConflict,
  resolveConflict,
  getNetworkStatus,
  isConnectionAdequate,
} from '../../balancing/config/offlineQueueConfig';

type OperationHandler = (operation: QueuedOperation) => Promise<unknown>;

/**
 * Offline Queue class handling operation storage, sync, and telemetry.
 */
export class OfflineQueue {
  private readonly config: OfflineQueueConfig;
  private readonly operations = new Map<string, QueuedOperation>();
  private readonly conflicts: ConflictResolution[] = [];
  private readonly handlers = new Map<string, OperationHandler>();
  private readonly listeners = new Set<() => void>();

  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private networkTimer: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;
  private lastSyncDuration = 0;
  private networkStatus: NetworkStatus = getNetworkStatus();

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_OFFLINE_QUEUE_CONFIG, ...config };
    void this.hydrateFromStorage();
    this.attachNetworkListeners();
    this.startMonitoring();
  }

  /** Subscribe to queue updates */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Register a handler for a specific operation type */
  registerHandler(type: string, handler: OperationHandler): void {
    this.handlers.set(type, handler);
  }

  /** Enqueue new operation */
  async enqueue(type: string, data: any, metadata: QueuedOperation['metadata'] = {}): Promise<string> {
    if (this.operations.size >= this.config.maxQueueSize) {
      throw new Error('Offline queue is full');
    }

    const operation: QueuedOperation = {
      id: this.generateId(type),
      type,
      data,
      timestamp: Date.now(),
      priority: getOperationPriority(type, this.config),
      retryCount: 0,
      status: 'pending',
      metadata,
    };

    this.operations.set(operation.id, operation);
    await this.persistQueue();
    this.emitUpdate();
    this.logTelemetry('offline_queue_enqueued', operation);

    if (this.shouldSyncImmediately(operation)) {
      await this.processOperation(operation.id);
    }

    return operation.id;
  }

  /** Force sync */
  async sync(): Promise<void> {
    if (this.isSyncing || !this.canSyncNow()) {
      return;
    }

    const start = performance.now();
    this.isSyncing = true;

    const operations = this.getPendingOperations();
    for (const op of operations) {
      await this.processOperation(op.id);
    }

    this.lastSyncDuration = performance.now() - start;
    this.isSyncing = false;
    this.emitUpdate();
  }

  /** Get sync status for UI */
  getStatus(): SyncStatus {
    const queueSize = this.operations.size;
    const pendingOperations = this.getPendingOperations().length;
    const failedOperations = this.getOperationsByStatus('failed').length;

    return {
      isOnline: this.networkStatus.isOnline,
      isSyncing: this.isSyncing,
      queueSize,
      pendingOperations,
      failedOperations,
      lastSyncTime: Date.now() - this.lastSyncDuration,
      nextSyncTime: Date.now() + this.config.syncIntervalMs,
      conflicts: [...this.conflicts],
    };
  }

  /** Collect metrics for telemetry */
  getMetrics(): OfflineQueueMetrics {
    const totalOperations = this.operations.size;
    const successfulOperations = this.getOperationsByStatus('completed').length;
    const failedOperations = this.getOperationsByStatus('failed').length;
    const conflictRate = this.conflicts.length / Math.max(totalOperations, 1);
    const retryRate = totalOperations > 0
      ? [...this.operations.values()].reduce((sum, op) => sum + op.retryCount, 0) / totalOperations
      : 0;

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageSyncTime: this.lastSyncDuration,
      conflictRate,
      retryRate,
      queueSize: this.operations.size,
      lastOperationTime: this.getLastOperationTimestamp(),
    };
  }

  /** Remove completed operations to keep queue light */
  async clearCompleted(): Promise<void> {
    [...this.operations.entries()].forEach(([id, op]) => {
      if (op.status === 'completed') {
        this.operations.delete(id);
      }
    });
    await this.persistQueue();
  }

  /** Destroys timers and listeners */
  destroy(): void {
    this.stopMonitoring();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  /** Internal helpers */
  private async processOperation(operationId: string): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation || operation.status === 'syncing') return;

    const handler = this.handlers.get(operation.type);
    if (!handler) {
      console.warn(`[OfflineQueue] Missing handler for ${operation.type}`);
      return;
    }

    operation.status = 'syncing';
    await this.persistQueue();

    try {
      await handler(operation);
      operation.status = 'completed';
      this.operations.delete(operationId);
      this.logTelemetry('offline_queue_completed', operation);
    } catch (error) {
      await this.handleOperationError(operation, error);
    } finally {
      await this.persistQueue();
    }
    this.emitUpdate();
  }

  private async handleOperationError(operation: QueuedOperation, error: unknown): Promise<void> {
    const conflict = this.extractConflict(operation, error);
    if (conflict) {
      this.conflicts.push(conflict);

      if (this.config.autoResolveConflicts) {
        try {
          const resolved = resolveConflict(
            { ...operation.data, timestamp: operation.timestamp },
            conflict.remoteData,
            this.config.conflictResolution,
            this.config.mergeStrategy,
          );
          operation.data = resolved;
          operation.metadata = {
            ...operation.metadata,
            version: (operation.metadata?.version ?? 0) + 1,
          };
          operation.status = 'pending';
          this.logTelemetry('offline_queue_conflict_resolved', operation);
          this.emitUpdate();
          return;
        } catch (resolutionError) {
          console.warn('[OfflineQueue] Manual conflict resolution required', resolutionError);
        }
      }

      operation.status = 'conflict';
      this.logTelemetry('offline_queue_conflict', operation);
      this.emitUpdate();
      return;
    }

    operation.retryCount += 1;
    if (operation.retryCount >= this.config.retryAttempts) {
      operation.status = 'failed';
      operation.error = this.getErrorMessage(error);
      this.logTelemetry('offline_queue_failed', operation);
      this.emitUpdate();
      return;
    }

    operation.status = 'pending';
    operation.timestamp = Date.now() + calculateRetryDelay(operation.retryCount, this.config);
    this.logTelemetry('offline_queue_retry', operation);
    this.emitUpdate();
  }

  private extractConflict(operation: QueuedOperation, error: unknown): ConflictResolution | null {
    if (!error || typeof error !== 'object') return null;
    const conflictLike = error as Partial<ConflictResolution> & { remoteData?: any };
    if (!conflictLike.remoteData) return null;

    const localData = operation.data;
    const remoteData = conflictLike.remoteData;
    const conflictType = conflictLike.conflictType ?? 'data';

    if (!detectConflict(localData, remoteData, this.config.conflictDetection)) {
      return null;
    }

    return {
      operationId: operation.id,
      conflictType,
      localData,
      remoteData,
      resolution: 'manual',
      timestamp: Date.now(),
    };
  }

  private shouldSyncImmediately(operation: QueuedOperation): boolean {
    if (!this.networkStatus.isOnline) return false;
    if (isCriticalOperation(operation.type, this.config)) return true;
    return this.config.syncOnConnect;
  }

  private canSyncNow(): boolean {
    return this.networkStatus.isOnline &&
      isConnectionAdequate(this.networkStatus, this.config) &&
      this.getPendingOperations().length > 0;
  }

  private getPendingOperations(): QueuedOperation[] {
    return [...this.operations.values()]
      .filter(op => op.status === 'pending')
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.config.batchSyncSize);
  }

  getOperationsByStatus(status: QueuedOperation['status']): QueuedOperation[] {
    return [...this.operations.values()].filter(op => op.status === status);
  }

  getOperation(operationId: string): QueuedOperation | undefined {
    return this.operations.get(operationId);
  }

  getOperations(): QueuedOperation[] {
    return [...this.operations.values()];
  }

  /** Backward-compatible helpers */
  getAction(operationId: string): QueuedOperation | undefined {
    return this.getOperation(operationId);
  }

  getAllActions(): QueuedOperation[] {
    return this.getOperations();
  }

  getActionsByStatus(status: QueuedOperation['status']): QueuedOperation[] {
    return this.getOperationsByStatus(status);
  }

  getConflicts(): ConflictResolution[] {
    return [...this.conflicts];
  }

  async clearAll(): Promise<void> {
    this.operations.clear();
    this.conflicts.length = 0;
    await this.persistQueue();
    this.emitUpdate();
  }

  private getLastOperationTimestamp(): number {
    const latest = [...this.operations.values()].sort((a, b) => b.timestamp - a.timestamp)[0];
    return latest?.timestamp ?? 0;
  }

  private async hydrateFromStorage(): Promise<void> {
    const stored = await loadData<QueuedOperation[]>(this.config.storageKey, []);
    stored.forEach(op => this.operations.set(op.id, op));
    this.emitUpdate();
  }

  private async persistQueue(): Promise<void> {
    await saveData(this.config.storageKey, [...this.operations.values()]);
  }

  private attachNetworkListeners(): void {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private startMonitoring(): void {
    if (this.syncTimer) return;
    this.syncTimer = setInterval(() => this.sync(), this.config.syncIntervalMs);
    this.networkTimer = setInterval(() => {
      this.networkStatus = getNetworkStatus();
      if (this.networkStatus.isOnline && this.config.syncOnAppFocus) {
        this.sync();
      }
    }, this.config.networkCheckIntervalMs);
  }

  private stopMonitoring(): void {
    if (this.syncTimer) clearInterval(this.syncTimer);
    if (this.networkTimer) clearInterval(this.networkTimer);
    this.syncTimer = null;
    this.networkTimer = null;
  }

  private handleOnline = (): void => {
    this.networkStatus = { ...this.networkStatus, isOnline: true };
    if (this.config.syncOnConnect) {
      this.sync();
    }
    this.emitUpdate();
  };

  private handleOffline = (): void => {
    this.networkStatus = { ...this.networkStatus, isOnline: false };
    this.emitUpdate();
  };

  private logTelemetry(event: string, operation: QueuedOperation): void {
    if (!this.config.enableTelemetry) return;
    console.log('[OfflineQueue]', event, {
      operationId: operation.id,
      type: operation.type,
      status: operation.status,
      retryCount: operation.retryCount,
    });
  }

  private generateId(type: string): string {
    return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    return 'Unknown error';
  }

  private emitUpdate(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('[OfflineQueue] Listener error', error);
      }
    });
  }
}

let queueInstance: OfflineQueue | null = null;

export function getOfflineQueue(config?: Partial<OfflineQueueConfig>): OfflineQueue {
  if (!queueInstance) {
    queueInstance = new OfflineQueue(config);
  }
  return queueInstance;
}

export function resetOfflineQueue(): void {
  queueInstance?.destroy();
  queueInstance = null;
}
