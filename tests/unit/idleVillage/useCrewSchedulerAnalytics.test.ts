import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCrewSchedulerAnalytics } from '@/ui/idleVillage/hooks/useCrewSchedulerAnalytics';
import type { CrewSchedulerAnalyticsConfig } from '@/ui/idleVillage/utils/crewSchedulerAnalyticsConfig';
import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import {
  clearCrewSchedulerAnalyticsHistory,
  recordCrewDecision,
  recordCrewDropFeedback,
  recordCrewQueueSnapshot,
} from '@/ui/idleVillage/utils/crewSchedulerAnalyticsChannel';

const baseQueueStats = {
  total: 1,
  avgPriority: 1.25,
  maxSize: 50,
  byActivity: {
    quest: 1,
  },
};

const baseQueue: QueuedAssignment[] = [
  {
    id: 'assignment-1',
    residentId: 'resident-1',
    activityId: 'quest',
    priorityScore: 1.25,
    factors: {
      statTagMatch: 0.7,
      fatigue: 0.3,
      questUrgency: 1,
      specialization: 0.4,
      difficulty: 0.2,
    },
    timestamp: Date.now(),
  },
];

describe('useCrewSchedulerAnalytics', () => {
  beforeEach(() => {
    clearCrewSchedulerAnalyticsHistory();
    vi.setSystemTime(new Date('2026-01-12T12:00:00Z'));
  });

  it('should merge config overrides and compute queue metrics', () => {
    const overrideConfig: Partial<CrewSchedulerAnalyticsConfig> = {
      thresholds: {
        queueWarning: 0,
        queueCritical: 1,
        fatigueWarning: 0.2,
        fatigueCritical: 0.4,
        dropFailWarning: 0.1,
        dropFailCritical: 0.2,
        throughputTarget: 2,
      },
    };

    const { result } = renderHook(() =>
      useCrewSchedulerAnalytics({
        config: overrideConfig,
      }),
    );

    act(() => {
      recordCrewQueueSnapshot(baseQueue, baseQueueStats);
    });

    expect(result.current.metrics.queue.total).toBe(1);
    expect(result.current.metrics.queue.avgFatigue).toBeCloseTo(0.3, 2);
    expect(result.current.statuses.queue).toBe('critical');
    expect(result.current.statuses.fatigue).toBe('warning');
  });

  it('should accumulate throughput metrics from decision events', () => {
    const { result } = renderHook(() => useCrewSchedulerAnalytics());

    act(() => {
      recordCrewDecision({
        assigned: true,
        residentId: 'resident-1',
        activityId: 'quest-slot',
        priorityScore: 1.2,
        reason: 'High priority assignment',
      });
      recordCrewDecision({
        assigned: false,
        residentId: 'resident-2',
        activityId: 'job-slot',
        priorityScore: 0.9,
        reason: 'Resident not available',
      });
    });

    expect(result.current.metrics.throughput.assigned).toBe(1);
    expect(result.current.metrics.throughput.rejected).toBe(1);
    expect(result.current.metrics.throughput.decisionsPerMinute).toBe(2);
  });

  it('should track drop feedback failure rates', () => {
    const { result } = renderHook(() => useCrewSchedulerAnalytics());

    act(() => {
      recordCrewDropFeedback({
        feedbackType: 'invalid',
      });
      recordCrewDropFeedback({
        feedbackType: 'warning',
      });
      recordCrewDropFeedback({
        feedbackType: 'blocked',
      });
    });

    expect(result.current.metrics.dropFeedback.total).toBe(3);
    expect(result.current.metrics.dropFeedback.invalid).toBe(1);
    expect(result.current.metrics.dropFeedback.warning).toBe(1);
    expect(result.current.metrics.dropFeedback.blocked).toBe(1);
    expect(result.current.metrics.dropFeedback.failureRate).toBeCloseTo(2 / 3, 2);
    expect(result.current.statuses.dropFailure).toBe('critical');
  });

  it('should honor layout history limits', () => {
    const { result } = renderHook(() =>
      useCrewSchedulerAnalytics({
        config: {
          layout: {
            maxHistoryPoints: 2,
            enableAsciiChrome: true,
            enableSparklines: true,
            refreshIntervalMs: 1000,
            showActivityBreakdown: true,
          },
        },
      }),
    );

    act(() => {
      recordCrewQueueSnapshot(baseQueue, baseQueueStats);
      recordCrewDecision({
        assigned: true,
        residentId: 'resident-3',
        activityId: 'job-slot',
        priorityScore: 1.0,
        reason: 'High priority assignment',
      });
      recordCrewDropFeedback({
        feedbackType: 'warning',
      });
    });

    expect(result.current.history.length).toBe(2);
    expect(result.current.history[0].type).toBe('decision');
    expect(result.current.history[1].type).toBe('drop_feedback');
  });

  it('should disable history tracking when enableHistory is false', () => {
    const { result } = renderHook(() =>
      useCrewSchedulerAnalytics({
        enableHistory: false,
      }),
    );

    act(() => {
      recordCrewQueueSnapshot(baseQueue, baseQueueStats);
    });

    expect(result.current.history).toEqual([]);
  });

  it('should keep existing history when resetHistoryOnMount is false', () => {
    act(() => {
      recordCrewQueueSnapshot(baseQueue, baseQueueStats);
    });

    const { result } = renderHook(() =>
      useCrewSchedulerAnalytics({
        resetHistoryOnMount: false,
      }),
    );

    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].type).toBe('queue_snapshot');
  });
});
