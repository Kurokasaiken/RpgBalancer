/**
 * Crew Scheduler Time Travel Hook Unit Tests – NP-038 Implementation
 *
 * Tests the time travel functionality for snapshot management and navigation.
 *
 * @since NP-038
 */

import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useCrewSchedulerTimeTravel } from '../../../src/ui/idleVillage/hooks/useCrewSchedulerTimeTravel';
import type { QueuedAssignment } from '../../../src/ui/idleVillage/hooks/useCrewScheduler';

// Mock scheduler functions
const mockScheduler = {
  queue: [] as QueuedAssignment[],
  getQueueStats: vi.fn(() => ({
    total: 0,
    avgPriority: 0,
    byActivity: {},
  })),
};

describe('useCrewSchedulerTimeTravel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-11T00:00:00.000Z'));
    mockScheduler.queue = [];
    mockScheduler.getQueueStats.mockReturnValue({
      total: 0,
      avgPriority: 0,
      byActivity: {},
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with time travel disabled', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: { enabled: false, maxSnapshots: 0, autoCapture: false, captureOn: {} },
        })
      );

      result.current.setScheduler(mockScheduler);

      expect(result.current.timeTravelState.hasSnapshots).toBe(false);
      expect(result.current.timeTravelState.snapshots).toHaveLength(0);
      expect(result.current.canRewind).toBe(false);
      expect(result.current.canFastForward).toBe(false);
    });

    it('should initialize with time travel enabled and auto-create initial snapshot', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: { enabled: true, maxSnapshots: 20, autoCapture: true, captureOn: {} },
        })
      );

      result.current.setScheduler(mockScheduler);

      expect(result.current.timeTravelState.hasSnapshots).toBe(true);
      expect(result.current.timeTravelState.snapshots).toHaveLength(1);
      expect(result.current.timeTravelState.snapshots[0].operation).toBe('initial');
    });
  });

  describe('Snapshot Capture', () => {
    it('should capture snapshots when enabled and configured', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: true, processQueue: false },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', { residentId: 'test', activityId: 'test' });
      });

      expect(result.current.timeTravelState.snapshots).toHaveLength(2); // initial + captured
      expect(result.current.timeTravelState.snapshots[1].operation).toBe('enqueueTask');
      expect(result.current.timeTravelState.snapshots[1].metadata?.residentId).toBe('test');
    });

    it('should not capture snapshots when disabled', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: false,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: true },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
      });

      expect(result.current.timeTravelState.snapshots).toHaveLength(0);
    });

    it('should not capture snapshots when operation not configured', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: false },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
      });

      expect(result.current.timeTravelState.snapshots).toHaveLength(1); // only initial
    });

    it('should enforce max snapshots limit', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 2,
            autoCapture: true,
            captureOn: { enqueueTask: true },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
        result.current.captureSnapshot('enqueueTask', {});
        result.current.captureSnapshot('enqueueTask', {});
      });

      expect(result.current.timeTravelState.snapshots).toHaveLength(2); // max limit
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockScheduler.queue = [
        { id: '1', residentId: 'r1', activityId: 'a1', priorityScore: 1, factors: {} as any, timestamp: 1000 },
        { id: '2', residentId: 'r2', activityId: 'a2', priorityScore: 2, factors: {} as any, timestamp: 2000 },
      ];
      mockScheduler.getQueueStats.mockReturnValue({
        total: 2,
        avgPriority: 1.5,
        byActivity: { a1: 1, a2: 1 },
      });
    });

    it('should navigate to specific snapshot', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: true },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
      });

      expect(result.current.timeTravelState.snapshots).toHaveLength(2); // initial + 1
      expect(result.current.timeTravelState.currentIndex).toBe(1);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
      });

      expect(result.current.timeTravelState.snapshots).toHaveLength(3); // initial + 2
      expect(result.current.timeTravelState.currentIndex).toBe(2);

      act(() => {
        result.current.goToSnapshot(1);
      });

      expect(result.current.timeTravelState.currentIndex).toBe(1);
      expect(result.current.timeTravelState.isTimeTraveling).toBe(true);
    });

    it('should handle boundary navigation', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: true },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
      });

      act(() => {
        result.current.goToBeginning();
      });
      expect(result.current.timeTravelState.currentIndex).toBe(0);

      act(() => {
        result.current.goToEnd();
      });
      expect(result.current.timeTravelState.currentIndex).toBe(1);
    });

    it('should handle rewind and fast forward', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: true },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
        result.current.captureSnapshot('enqueueTask', {});
      });

      expect(result.current.timeTravelState.currentIndex).toBe(2);

      act(() => {
        result.current.rewind();
      });
      expect(result.current.timeTravelState.currentIndex).toBe(1);

      act(() => {
        result.current.fastForward();
      });
      expect(result.current.timeTravelState.currentIndex).toBe(2);
    });

    it('should prevent invalid navigation', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: true },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
      });

      expect(result.current.timeTravelState.currentIndex).toBe(1);

      act(() => {
        result.current.rewind();
      });

      expect(result.current.timeTravelState.currentIndex).toBe(0);

      act(() => {
        result.current.rewind(); // Should not go below 0
      });

      expect(result.current.timeTravelState.currentIndex).toBe(0);

      // Try to fast forward beyond end
      act(() => {
        result.current.fastForward();
      });
      expect(result.current.timeTravelState.currentIndex).toBe(1);

      act(() => {
        result.current.fastForward(); // Should not go beyond length-1
      });
      expect(result.current.timeTravelState.currentIndex).toBe(1);
    });
  });

  describe('Time Travel State', () => {
    it('should track time travel state correctly', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: true },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', {});
      });

      expect(result.current.timeTravelState.isTimeTraveling).toBe(false);

      act(() => {
        result.current.goToSnapshot(0);
      });

      expect(result.current.timeTravelState.isTimeTraveling).toBe(true);
    });

    it('should provide current snapshot info', () => {
      const { result } = renderHook(() =>
        useCrewSchedulerTimeTravel({
          timeTravelConfig: {
            enabled: true,
            maxSnapshots: 20,
            autoCapture: true,
            captureOn: { enqueueTask: true },
          },
        })
      );

      result.current.setScheduler(mockScheduler);

      act(() => {
        result.current.captureSnapshot('enqueueTask', { residentId: 'test' });
      });

      const currentSnapshot = result.current.currentSnapshot;
      expect(currentSnapshot).toBeDefined();
      expect(currentSnapshot?.operation).toBe('enqueueTask');
      expect(currentSnapshot?.metadata?.residentId).toBe('test');
    });
  });
});
