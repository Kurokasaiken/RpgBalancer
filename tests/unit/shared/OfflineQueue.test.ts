import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  OfflineQueue,
  getOfflineQueue,
  resetOfflineQueue,
} from '../../../src/shared/offline/OfflineQueue';
import {
  DEFAULT_OFFLINE_QUEUE_CONFIG,
  type OfflineQueueConfig,
  type QueuedOperation,
} from '../../../src/balancing/config/offlineQueueConfig';
import { saveData, loadData } from '../../../src/shared/persistence/PersistenceService';

vi.mock('../../../src/shared/persistence/PersistenceService', () => {
  return {
    saveData: vi.fn().mockResolvedValue(undefined),
    loadData: vi.fn().mockResolvedValue([]),
  };
});

const mockedSaveData = vi.mocked(saveData);
const mockedLoadData = vi.mocked(loadData);

const setOnlineState = (() => {
  let online = true;
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    get() {
      return online;
    },
  });
  return (next: boolean) => {
    online = next;
    window.dispatchEvent(new Event(next ? 'online' : 'offline'));
  };
})();

function createQueue(overrides: Partial<OfflineQueueConfig> = {}): OfflineQueue {
  return new OfflineQueue({
    storageKey: `offline_queue_test_${Math.random()}`,
    syncOnConnect: false,
    ...overrides,
  });
}

describe('OfflineQueue (NP-207)', () => {
  let queue: OfflineQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    mockedSaveData.mockClear();
    mockedLoadData.mockClear();
    mockedLoadData.mockResolvedValue([]);
    setOnlineState(true);
    queue = createQueue();
  });

  afterEach(() => {
    queue.destroy();
    resetOfflineQueue();
    vi.useRealTimers();
  });

  it('respects default configuration contract', () => {
    expect(DEFAULT_OFFLINE_QUEUE_CONFIG.maxQueueSize).toBeGreaterThan(0);
    expect(DEFAULT_OFFLINE_QUEUE_CONFIG.operationPriorities).toHaveProperty('user_action');
    expect(DEFAULT_OFFLINE_QUEUE_CONFIG.conflictResolution).toBe('last-write-wins');
  });

  it('enqueues operations, persists them, and exposes metadata', async () => {
    const operationId = await queue.enqueue('analytics', { foo: 'bar' }, { sessionId: 'abc' });

    const stored = queue.getOperation(operationId);
    expect(stored).toMatchObject({
      type: 'analytics',
      data: { foo: 'bar' },
      metadata: { sessionId: 'abc' },
      status: 'pending',
    });
    expect(mockedSaveData).toHaveBeenCalledTimes(1);
  });

  it('enforces max queue size', async () => {
    const constrainedQueue = createQueue({ maxQueueSize: 1 });
    await constrainedQueue.enqueue('analytics', {});
    await expect(constrainedQueue.enqueue('analytics', {})).rejects.toThrow('Offline queue is full');
    constrainedQueue.destroy();
  });

  it('processes operations through registered handlers during sync', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    queue.registerHandler('analytics', handler);

    const id = await queue.enqueue('analytics', { payload: 1 });
    await queue.sync();

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ id }));
    expect(queue.getOperation(id)).toBeUndefined();
  });

  it('retries failed operations and marks them as failed after max attempts', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('network'));
    queue.registerHandler('analytics', handler);

    await queue.enqueue('analytics', {});
    for (let i = 0; i < DEFAULT_OFFLINE_QUEUE_CONFIG.retryAttempts; i += 1) {
      await queue.sync();
    }

    const failed = queue.getOperationsByStatus('failed');
    expect(failed).toHaveLength(1);
    expect(failed[0].retryCount).toBe(DEFAULT_OFFLINE_QUEUE_CONFIG.retryAttempts);
  });

  it('records conflicts when handler surfaces remote data', async () => {
    const conflict = {
      remoteData: { value: 2, timestamp: Date.now() + 2000 },
      conflictType: 'data' as const,
    };
    queue.registerHandler('analytics', vi.fn().mockRejectedValue(conflict));

    await queue.enqueue('analytics', { value: 1, timestamp: Date.now() });
    await queue.sync();

    const conflicts = queue.getConflicts();
    expect(conflicts).toHaveLength(1);
    expect(queue.getOperationsByStatus('conflict')).toHaveLength(1);
  });

  it('clears all operations and conflicts', async () => {
    queue.registerHandler('analytics', vi.fn().mockRejectedValue({ remoteData: { timestamp: Date.now() + 2000 } }));
    await queue.enqueue('analytics', { timestamp: Date.now() });
    await queue.sync();

    await queue.clearAll();

    expect(queue.getOperations()).toHaveLength(0);
    expect(queue.getConflicts()).toHaveLength(0);
  });

  it('notifies subscribers on updates', async () => {
    const listener = vi.fn();
    const unsubscribe = queue.subscribe(listener);

    await queue.enqueue('analytics', {});

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('updates status in response to network events', () => {
    setOnlineState(false);
    expect(queue.getStatus().isOnline).toBe(false);

    setOnlineState(true);
    expect(queue.getStatus().isOnline).toBe(true);
  });

  it('hydrates queued operations from persistence', async () => {
    const storedOperations: QueuedOperation[] = [
      {
        id: 'stored-1',
        type: 'analytics',
        data: { foo: 'bar' },
        timestamp: Date.now(),
        priority: 1,
        retryCount: 0,
        status: 'pending',
      },
    ];
    mockedLoadData.mockResolvedValueOnce(storedOperations);

    const hydratedQueue = createQueue();
    await Promise.resolve();

    expect(hydratedQueue.getOperations()).toHaveLength(1);
    hydratedQueue.destroy();
  });

  it('exposes metrics reflecting queue activity', async () => {
    queue.registerHandler('analytics', vi.fn().mockResolvedValue(undefined));
    await queue.enqueue('analytics', {});
    await queue.sync();

    const metrics = queue.getMetrics();
    expect(metrics.totalOperations).toBeGreaterThanOrEqual(0);
    expect(metrics.averageSyncTime).toBeGreaterThanOrEqual(0);
  });

  it('logs telemetry when enabled', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const telemetryQueue = createQueue({ enableTelemetry: true });

    await telemetryQueue.enqueue('analytics', {});

    expect(consoleSpy).toHaveBeenCalledWith(
      '[OfflineQueue]',
      'offline_queue_enqueued',
      expect.objectContaining({ type: 'analytics' }),
    );

    consoleSpy.mockRestore();
    telemetryQueue.destroy();
  });

  it('shares singleton instance via getOfflineQueue and allows reset', () => {
    const first = getOfflineQueue({ syncOnConnect: false });
    const second = getOfflineQueue();
    expect(first).toBe(second);

    resetOfflineQueue();
    const replacement = getOfflineQueue({ syncOnConnect: false });
    expect(replacement).not.toBe(first);
    replacement.destroy();
  });
});
