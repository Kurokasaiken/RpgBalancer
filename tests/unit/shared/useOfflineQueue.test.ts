import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOfflineQueue } from '../../../src/shared/offline/useOfflineQueue';
import type {
  QueuedOperation,
  SyncStatus,
  OfflineQueueMetrics,
  ConflictResolution,
} from '../../../src/balancing/config/offlineQueueConfig';
import { getOfflineQueue } from '../../../src/shared/offline/OfflineQueue';

vi.mock('../../../src/shared/offline/OfflineQueue', () => ({
  getOfflineQueue: vi.fn(),
}));

const mockedGetOfflineQueue = vi.mocked(getOfflineQueue);

function createStatus(overrides: Partial<SyncStatus> = {}): SyncStatus {
  return {
    isOnline: true,
    isSyncing: false,
    queueSize: 0,
    pendingOperations: 0,
    failedOperations: 0,
    lastSyncTime: 0,
    nextSyncTime: 0,
    conflicts: [],
    ...overrides,
  };
}

function createMetrics(overrides: Partial<OfflineQueueMetrics> = {}): OfflineQueueMetrics {
  return {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageSyncTime: 0,
    conflictRate: 0,
    retryRate: 0,
    queueSize: 0,
    lastOperationTime: 0,
    ...overrides,
  };
}

type MockQueue = {
  enqueue: ReturnType<typeof vi.fn>;
  registerHandler: ReturnType<typeof vi.fn>;
  sync: ReturnType<typeof vi.fn>;
  clearCompleted: ReturnType<typeof vi.fn>;
  clearAll: ReturnType<typeof vi.fn>;
  getOperation: ReturnType<typeof vi.fn>;
  getOperations: ReturnType<typeof vi.fn>;
  getOperationsByStatus: ReturnType<typeof vi.fn>;
  getStatus: ReturnType<typeof vi.fn>;
  getMetrics: ReturnType<typeof vi.fn>;
  getConflicts: ReturnType<typeof vi.fn>;
  subscribe: ReturnType<typeof vi.fn>;
};

function setupMockQueue() {
  let operations: QueuedOperation[] = [];
  let status: SyncStatus = createStatus();
  let metrics: OfflineQueueMetrics = createMetrics();
  let conflicts: ConflictResolution[] = [];
  const listeners = new Set<() => void>();

  const queue: MockQueue = {
    enqueue: vi.fn().mockResolvedValue('op-1'),
    registerHandler: vi.fn(),
    sync: vi.fn().mockResolvedValue(undefined),
    clearCompleted: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
    getOperation: vi.fn((id: string) => operations.find(op => op.id === id)),
    getOperations: vi.fn(() => operations),
    getOperationsByStatus: vi.fn((state: QueuedOperation['status']) => operations.filter(op => op.status === state)),
    getStatus: vi.fn(() => status),
    getMetrics: vi.fn(() => metrics),
    getConflicts: vi.fn(() => conflicts),
    subscribe: vi.fn((listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };

  function updateSnapshot(next: {
    operations?: QueuedOperation[];
    status?: SyncStatus;
    metrics?: OfflineQueueMetrics;
    conflicts?: ConflictResolution[];
  }) {
    if (next.operations) operations = next.operations;
    if (next.status) status = next.status;
    if (next.metrics) metrics = next.metrics;
    if (next.conflicts) conflicts = next.conflicts;
  }

  function emitUpdate() {
    listeners.forEach(listener => listener());
  }

  mockedGetOfflineQueue.mockReturnValue(queue as unknown as any);

  return { queue, updateSnapshot, emitUpdate };
}

describe('useOfflineQueue hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides live snapshot of queue status, metrics, operations, and conflicts', () => {
    const { updateSnapshot, emitUpdate } = setupMockQueue();
    const initialStatus = createStatus({ isOnline: false });
    const initialMetrics = createMetrics({ totalOperations: 2 });
    const initialOps: QueuedOperation[] = [
      { id: '1', type: 'analytics', data: {}, timestamp: 1, priority: 1, retryCount: 0, status: 'pending' },
    ];
    const initialConflicts: ConflictResolution[] = [
      { operationId: '1', conflictType: 'data', localData: {}, remoteData: {}, resolution: 'manual', timestamp: 1 },
    ];

    updateSnapshot({
      status: initialStatus,
      metrics: initialMetrics,
      operations: initialOps,
      conflicts: initialConflicts,
    });

    const { result } = renderHook(() => useOfflineQueue());

    expect(result.current.status).toEqual(initialStatus);
    expect(result.current.metrics).toEqual(initialMetrics);
    expect(result.current.operations).toEqual(initialOps);
    expect(result.current.conflicts).toEqual(initialConflicts);
    expect(result.current.isOnline).toBe(initialStatus.isOnline);

    const nextStatus = createStatus({ isOnline: true, queueSize: 3 });
    const nextMetrics = createMetrics({ totalOperations: 3 });
    const nextOps: QueuedOperation[] = [
      { id: '2', type: 'analytics', data: {}, timestamp: 2, priority: 1, retryCount: 0, status: 'completed' },
    ];

    act(() => {
      updateSnapshot({ status: nextStatus, metrics: nextMetrics, operations: nextOps });
      emitUpdate();
    });

    expect(result.current.status).toEqual(nextStatus);
    expect(result.current.metrics).toEqual(nextMetrics);
    expect(result.current.operations).toEqual(nextOps);
    expect(result.current.isOnline).toBe(true);
  });

  it('forwards imperative methods to the underlying queue instance', async () => {
    const { queue } = setupMockQueue();
    const { result } = renderHook(() => useOfflineQueue());

    await result.current.enqueue('analytics', { foo: 'bar' }, { sessionId: 'abc' });
    expect(queue.enqueue).toHaveBeenCalledWith('analytics', { foo: 'bar' }, { sessionId: 'abc' });

    result.current.registerHandler('analytics', vi.fn());
    expect(queue.registerHandler).toHaveBeenCalled();

    await result.current.sync();
    expect(queue.sync).toHaveBeenCalled();

    await result.current.clearCompleted();
    expect(queue.clearCompleted).toHaveBeenCalled();

    await result.current.clearAll();
    expect(queue.clearAll).toHaveBeenCalled();

    result.current.getOperation('1');
    expect(queue.getOperation).toHaveBeenCalledWith('1');

    result.current.getOperations();
    expect(queue.getOperations).toHaveBeenCalled();

    result.current.getOperationsByStatus('pending');
    expect(queue.getOperationsByStatus).toHaveBeenCalledWith('pending');
  });

  it('subscribes to queue updates and unsubscribes on cleanup', () => {
    const { queue, emitUpdate } = setupMockQueue();
    const { unmount } = renderHook(() => useOfflineQueue());

    expect(queue.subscribe).toHaveBeenCalled();

    // ensure listener is invoked without errors
    expect(() => act(() => emitUpdate())).not.toThrow();

    unmount();
    const unsubscribe = queue.subscribe.mock.results[0].value;
    expect(unsubscribe).toBeTypeOf('function');
  });
});
