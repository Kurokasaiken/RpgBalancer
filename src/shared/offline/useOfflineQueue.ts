/**
 * Offline Queue Hook
 * 
 * React hook for using offline queue system.
 * 
 * @since NP-207 – Offline Queue System
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getOfflineQueue, type OfflineQueue } from './OfflineQueue';
import type {
  OfflineQueueConfig,
  QueuedOperation,
  ConflictResolution,
  SyncStatus,
  OfflineQueueMetrics,
} from '../../balancing/config/offlineQueueConfig';

/**
 * Hook return type
 */
export type QueueOperationHandler = (operation: QueuedOperation) => Promise<unknown>;

export interface UseOfflineQueueReturn {
  enqueue: (type: string, payload: unknown, metadata?: QueuedOperation['metadata']) => Promise<string>;
  registerHandler: (type: string, handler: QueueOperationHandler) => void;
  sync: () => Promise<void>;
  clearCompleted: () => Promise<void>;
  clearAll: () => Promise<void>;
  getOperation: (id: string) => QueuedOperation | undefined;
  getOperations: () => QueuedOperation[];
  getOperationsByStatus: (status: QueuedOperation['status']) => QueuedOperation[];
  status: SyncStatus;
  metrics: OfflineQueueMetrics;
  conflicts: ConflictResolution[];
  operations: QueuedOperation[];
  isOnline: boolean;
}

/**
 * Use offline queue hook
 */
export function useOfflineQueue(config?: Partial<OfflineQueueConfig>): UseOfflineQueueReturn {
  const [queue] = useState<OfflineQueue>(() => getOfflineQueue(config));
  const [snapshot, setSnapshot] = useState(() => ({
    status: queue.getStatus(),
    metrics: queue.getMetrics(),
    operations: queue.getOperations(),
    conflicts: queue.getConflicts(),
  }));

  useEffect(() => {
    const unsubscribe = queue.subscribe(() => {
      setSnapshot({
        status: queue.getStatus(),
        metrics: queue.getMetrics(),
        operations: queue.getOperations(),
        conflicts: queue.getConflicts(),
      });
    });
    return () => unsubscribe();
  }, [queue]);

  const enqueue = useCallback(async (
    type: string,
    payload: unknown,
    metadata?: QueuedOperation['metadata'],
  ): Promise<string> => queue.enqueue(type, payload, metadata), [queue]);

  const registerHandler = useCallback((type: string, handler: QueueOperationHandler) => {
    queue.registerHandler(type, handler);
  }, [queue]);

  const sync = useCallback(async () => {
    await queue.sync();
  }, [queue]);

  const clearCompleted = useCallback(async () => {
    await queue.clearCompleted();
  }, [queue]);

  const clearAll = useCallback(async () => {
    await queue.clearAll();
  }, [queue]);

  const getOperation = useCallback((id: string) => queue.getOperation(id), [queue]);
  const getOperations = useCallback(() => queue.getOperations(), [queue]);
  const getOperationsByStatus = useCallback(
    (status: QueuedOperation['status']) => queue.getOperationsByStatus(status),
    [queue],
  );

  const memoizedOperations = useMemo(() => snapshot.operations, [snapshot.operations]);

  return {
    enqueue,
    registerHandler,
    sync,
    clearCompleted,
    clearAll,
    getOperation,
    getOperations,
    getOperationsByStatus,
    status: snapshot.status,
    metrics: snapshot.metrics,
    conflicts: snapshot.conflicts,
    operations: memoizedOperations,
    isOnline: snapshot.status.isOnline,
  };
}
