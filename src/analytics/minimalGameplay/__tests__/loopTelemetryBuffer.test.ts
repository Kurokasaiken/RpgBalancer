import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LoopTelemetryBuffer, enqueueLoopTelemetry, flushLoopTelemetry } from '../loopTelemetryBuffer';

// Mock dependencies
vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(),
  loadData: vi.fn(),
}));

vi.mock('@/shared/telemetry/telemetryProvider', () => ({
  traceMinimalGameplay: vi.fn(),
}));

const mockSaveData = vi.mocked(require('@/shared/persistence/PersistenceService').saveData);
const mockLoadData = vi.mocked(require('@/shared/persistence/PersistenceService').loadData);
const mockTraceMinimalGameplay = vi.mocked(require('@/shared/telemetry/telemetryProvider').traceMinimalGameplay);

describe('LoopTelemetryBuffer', () => {
  let buffer: LoopTelemetryBuffer;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveData.mockResolvedValue(undefined);
    mockLoadData.mockResolvedValue(null);
    mockTraceMinimalGameplay.mockImplementation(() => {});

    // Clear any timers from previous tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (buffer) {
      buffer.destroy();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      buffer = new LoopTelemetryBuffer();

      expect(buffer.getBufferSize()).toBe(0);
      const stats = buffer.getStats();
      expect(stats.batchSize).toBe(10);
      expect(stats.maxAgeMs).toBe(5000);
    });

    it('should accept custom config', () => {
      buffer = new LoopTelemetryBuffer({
        batchSize: 5,
        maxAgeMs: 10000,
        enablePersistence: false,
      });

      const stats = buffer.getStats();
      expect(stats.batchSize).toBe(5);
      expect(stats.maxAgeMs).toBe(10000);
    });

    it('should load persisted buffer on initialization', async () => {
      const persistedEvents = [
        {
          eventType: 'tick',
          timestamp: Date.now() - 1000,
          data: { day: 1, gold: 100 },
        },
      ];

      mockLoadData.mockResolvedValue(persistedEvents);

      buffer = new LoopTelemetryBuffer();

      // Wait for async initialization
      await vi.runAllTimersAsync();

      expect(buffer.getBufferSize()).toBe(1);
      expect(mockLoadData).toHaveBeenCalledWith('minimal-loop-telemetry-buffer', null);
    });

    it('should filter out stale events when loading persisted buffer', async () => {
      const now = Date.now();
      const persistedEvents = [
        {
          eventType: 'tick',
          timestamp: now - 10000, // Older than 5 seconds
          data: { day: 1 },
        },
        {
          eventType: 'pause',
          timestamp: now - 1000, // Fresh
          data: { source: 'user' },
        },
      ];

      mockLoadData.mockResolvedValue(persistedEvents);

      buffer = new LoopTelemetryBuffer({ maxAgeMs: 5000 });

      await vi.runAllTimersAsync();

      expect(buffer.getBufferSize()).toBe(1);
    });

    it('should handle persistence load errors gracefully', async () => {
      mockLoadData.mockRejectedValue(new Error('Load failed'));

      buffer = new LoopTelemetryBuffer();

      await vi.runAllTimersAsync();

      expect(buffer.getBufferSize()).toBe(0);
    });
  });

  describe('enqueue', () => {
    beforeEach(() => {
      buffer = new LoopTelemetryBuffer({ enablePersistence: false });
    });

    it('should add events to buffer', async () => {
      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1, gold: 100 },
      };

      await buffer.enqueue(event);

      expect(buffer.getBufferSize()).toBe(1);
    });

    it('should auto-flush when reaching batch size', async () => {
      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      buffer = new LoopTelemetryBuffer({ batchSize: 2, enablePersistence: false });

      await buffer.enqueue(event);
      expect(buffer.getBufferSize()).toBe(1);

      await buffer.enqueue(event);
      expect(buffer.getBufferSize()).toBe(0); // Should have flushed

      expect(mockTraceMinimalGameplay).toHaveBeenCalledWith('minimal_loop_tick', expect.any(Object));
    });

    it('should handle enqueue errors gracefully', async () => {
      mockTraceMinimalGameplay.mockRejectedValue(new Error('Telemetry failed'));

      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      // Should not throw, buffer should retain events
      await expect(buffer.enqueue(event)).resolves.toBeUndefined();
      expect(buffer.getBufferSize()).toBe(1);
    });
  });

  describe('flush', () => {
    beforeEach(() => {
      buffer = new LoopTelemetryBuffer({ enablePersistence: false });
    });

    it('should flush all buffered events', async () => {
      const events = [
        {
          eventType: 'tick' as const,
          timestamp: Date.now(),
          data: { day: 1, gold: 100 },
        },
        {
          eventType: 'pause' as const,
          timestamp: Date.now(),
          data: { source: 'user' },
        },
      ];

      for (const event of events) {
        await buffer.enqueue(event);
      }

      expect(buffer.getBufferSize()).toBe(2);

      await buffer.flush();

      expect(buffer.getBufferSize()).toBe(0);
      expect(mockTraceMinimalGameplay).toHaveBeenCalledTimes(2);
      expect(mockTraceMinimalGameplay).toHaveBeenCalledWith('minimal_loop_telemetry_flush', {
        eventCount: 2,
        batchSize: 10,
        bufferSize: 0,
      });
    });

    it('should persist buffer when enabled', async () => {
      buffer = new LoopTelemetryBuffer({ enablePersistence: true });

      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      await buffer.enqueue(event);
      await buffer.flush();

      expect(mockSaveData).toHaveBeenCalledWith('minimal-loop-telemetry-buffer', null);
    });

    it('should handle flush errors and retry', async () => {
      mockTraceMinimalGameplay.mockRejectedValueOnce(new Error('First failure'));
      mockTraceMinimalGameplay.mockResolvedValueOnce(undefined);

      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      await buffer.enqueue(event);

      // Start flush (will fail first time)
      const flushPromise = buffer.flush();

      // Fast-forward to trigger retry
      vi.advanceTimersByTime(1000);

      await flushPromise;

      expect(mockTraceMinimalGameplay).toHaveBeenCalledTimes(2); // Original + retry
    });

    it('should do nothing when buffer is empty', async () => {
      await buffer.flush();

      expect(mockTraceMinimalGameplay).not.toHaveBeenCalled();
    });
  });

  describe('flushIfOlderThan', () => {
    beforeEach(() => {
      buffer = new LoopTelemetryBuffer({ enablePersistence: false });
    });

    it('should flush when events are older than threshold', async () => {
      const oldTimestamp = Date.now() - 10000; // 10 seconds ago

      const event = {
        eventType: 'tick' as const,
        timestamp: oldTimestamp,
        data: { day: 1 },
      };

      await buffer.enqueue(event);

      await buffer.flushIfOlderThan(5000); // 5 second threshold

      expect(buffer.getBufferSize()).toBe(0);
      expect(mockTraceMinimalGameplay).toHaveBeenCalledWith('minimal_loop_tick', expect.any(Object));
    });

    it('should not flush when events are younger than threshold', async () => {
      const recentTimestamp = Date.now() - 1000; // 1 second ago

      const event = {
        eventType: 'tick' as const,
        timestamp: recentTimestamp,
        data: { day: 1 },
      };

      await buffer.enqueue(event);

      await buffer.flushIfOlderThan(5000);

      expect(buffer.getBufferSize()).toBe(1);
      expect(mockTraceMinimalGameplay).not.toHaveBeenCalled();
    });
  });

  describe('setBatchSize', () => {
    it('should update batch size', () => {
      buffer = new LoopTelemetryBuffer();

      buffer.setBatchSize(20);

      const stats = buffer.getStats();
      expect(stats.batchSize).toBe(20);
    });

    it('should enforce minimum batch size of 1', () => {
      buffer = new LoopTelemetryBuffer();

      buffer.setBatchSize(0);

      const stats = buffer.getStats();
      expect(stats.batchSize).toBe(1);
    });
  });

  describe('getStats', () => {
    it('should return buffer statistics', () => {
      buffer = new LoopTelemetryBuffer({ batchSize: 15, maxAgeMs: 10000 });

      const stats = buffer.getStats();

      expect(stats).toEqual({
        bufferSize: 0,
        batchSize: 15,
        maxAgeMs: 10000,
        oldestEventAge: undefined,
      });
    });

    it('should calculate oldest event age', async () => {
      buffer = new LoopTelemetryBuffer();

      const oldTimestamp = Date.now() - 2000;
      const event = {
        eventType: 'tick' as const,
        timestamp: oldTimestamp,
        data: { day: 1 },
      };

      await buffer.enqueue(event);

      const stats = buffer.getStats();
      expect(stats.oldestEventAge).toBeGreaterThanOrEqual(2000);
    });
  });

  describe('Automatic Flushing', () => {
    it('should automatically flush based on age', async () => {
      buffer = new LoopTelemetryBuffer({
        maxAgeMs: 2000,
        enablePersistence: false,
      });

      const oldTimestamp = Date.now() - 3000;
      const event = {
        eventType: 'tick' as const,
        timestamp: oldTimestamp,
        data: { day: 1 },
      };

      await buffer.enqueue(event);

      // Fast-forward past the age threshold
      vi.advanceTimersByTime(3000);

      expect(buffer.getBufferSize()).toBe(0);
      expect(mockTraceMinimalGameplay).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up timers', () => {
      buffer = new LoopTelemetryBuffer();

      // Spy on clearInterval
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      buffer.destroy();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Convenience Functions', () => {
    it('enqueueLoopTelemetry should use default buffer', async () => {
      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      await enqueueLoopTelemetry(event);

      expect(mockTraceMinimalGameplay).toHaveBeenCalledWith('minimal_loop_tick', expect.any(Object));
    });

    it('flushLoopTelemetry should flush default buffer', async () => {
      // Add an event first
      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      await enqueueLoopTelemetry(event);

      await flushLoopTelemetry();

      expect(mockTraceMinimalGameplay).toHaveBeenCalledWith('minimal_loop_telemetry_flush', expect.any(Object));
    });
  });

  describe('Persistence Integration', () => {
    it('should persist buffer state', async () => {
      buffer = new LoopTelemetryBuffer({ enablePersistence: true });

      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      await buffer.enqueue(event);

      expect(mockSaveData).toHaveBeenCalledWith('minimal-loop-telemetry-buffer', [event]);
    });

    it('should clear persisted buffer after successful flush', async () => {
      buffer = new LoopTelemetryBuffer({ enablePersistence: true });

      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      await buffer.enqueue(event);
      await buffer.flush();

      expect(mockSaveData).toHaveBeenLastCalledWith('minimal-loop-telemetry-buffer', null);
    });

    it('should handle persistence errors gracefully', async () => {
      mockSaveData.mockRejectedValue(new Error('Save failed'));

      buffer = new LoopTelemetryBuffer({ enablePersistence: true });

      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      // Should not throw
      await expect(buffer.enqueue(event)).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle telemetry send failures', async () => {
      mockTraceMinimalGameplay.mockRejectedValue(new Error('Send failed'));

      buffer = new LoopTelemetryBuffer({ enablePersistence: false });

      const event = {
        eventType: 'tick' as const,
        timestamp: Date.now(),
        data: { day: 1 },
      };

      // Should complete flush despite telemetry failure
      await buffer.enqueue(event);
      await buffer.flush();

      expect(buffer.getBufferSize()).toBe(0);
    });
  });
});
