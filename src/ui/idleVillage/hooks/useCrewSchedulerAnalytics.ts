/**
 * Crew Scheduler Analytics Hook
 *
 * Listens to crew scheduler analytics events and derives metrics for the retro dashboard.
 *
 * @since IV-WS3-crew-analytics
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CrewSchedulerAnalyticsConfig,
  CrewSchedulerAnalyticsThresholds,
} from '../utils/crewSchedulerAnalyticsConfig';
import {
  DEFAULT_CREW_SCHEDULER_ANALYTICS_CONFIG,
  validateCrewSchedulerAnalyticsConfig,
} from '../utils/crewSchedulerAnalyticsConfig';
import type {
  CrewSchedulerAnalyticsEvent,
  CrewDecisionEvent,
  CrewDropFeedbackEvent,
  CrewQueueSnapshotEvent,
} from '../utils/crewSchedulerAnalyticsChannel';
import {
  clearCrewSchedulerAnalyticsHistory,
  getCrewSchedulerAnalyticsHistory,
  subscribeToCrewSchedulerAnalytics,
} from '../utils/crewSchedulerAnalyticsChannel';

/**
 * Severity levels returned by the hook.
 */
export type AnalyticsSeverity = 'ok' | 'warning' | 'critical';

/**
 * Status map for each monitored metric.
 */
export interface CrewSchedulerAnalyticsStatuses {
  queue: AnalyticsSeverity;
  fatigue: AnalyticsSeverity;
  dropFailure: AnalyticsSeverity;
  throughput: AnalyticsSeverity;
}

/**
 * Drop feedback aggregates.
 */
export interface CrewSchedulerDropMetrics {
  total: number;
  invalid: number;
  warning: number;
  blocked: number;
  failureRate: number;
}

/**
 * Throughput analytics derived from decision events.
 */
export interface CrewSchedulerThroughputMetrics {
  decisionsPerMinute: number;
  assigned: number;
  rejected: number;
}

/**
 * High-level analytics payload returned by the hook.
 */
export interface CrewSchedulerAnalyticsMetrics {
  queue: {
    total: number;
    avgPriority: number;
    avgFatigue: number;
    avgStatMatch: number;
    byActivity: Record<string, number>;
    maxSize: number;
  };
  lastQueueSnapshot?: CrewQueueSnapshotEvent;
  lastDecision?: CrewDecisionEvent['decision'];
  throughput: CrewSchedulerThroughputMetrics;
  dropFeedback: CrewSchedulerDropMetrics;
}

/**
 * Hook options to customize analytics collection.
 */
export interface UseCrewSchedulerAnalyticsOptions {
  /** Optional dashboard configuration override. */
  config?: Partial<CrewSchedulerAnalyticsConfig>;
  /** Whether to retain the raw event history (default true). */
  enableHistory?: boolean;
  /** Automatically clear history on mount (default true). */
  resetHistoryOnMount?: boolean;
}

/**
 * Return signature from the analytics hook.
 */
export interface UseCrewSchedulerAnalyticsReturn {
  /** Current analytics configuration (validated + merged). */
  config: CrewSchedulerAnalyticsConfig;
  /** Derived metrics updated in real-time. */
  metrics: CrewSchedulerAnalyticsMetrics;
  /** Severity map for key KPIs. */
  statuses: CrewSchedulerAnalyticsStatuses;
  /** Raw event history (bounded by config.layout.maxHistoryPoints when enabled). */
  history: CrewSchedulerAnalyticsEvent[];
}

/**
 * Zeroed analytics payload for initial state.
 */
const EMPTY_METRICS: CrewSchedulerAnalyticsMetrics = {
  queue: {
    total: 0,
    avgPriority: 0,
    avgFatigue: 0,
    avgStatMatch: 0,
    byActivity: {},
    maxSize: DEFAULT_CREW_SCHEDULER_ANALYTICS_CONFIG.layout.maxHistoryPoints,
  },
  throughput: {
    decisionsPerMinute: 0,
    assigned: 0,
    rejected: 0,
  },
  dropFeedback: {
    total: 0,
    invalid: 0,
    warning: 0,
    blocked: 0,
    failureRate: 0,
  },
};

/**
 * Deep merges dashboard config overrides while preserving validation.
 */
function mergeConfig(
  override?: Partial<CrewSchedulerAnalyticsConfig>,
): CrewSchedulerAnalyticsConfig {
  if (!override) {
    return DEFAULT_CREW_SCHEDULER_ANALYTICS_CONFIG;
  }

  const merged: CrewSchedulerAnalyticsConfig = {
    palette: {
      ...DEFAULT_CREW_SCHEDULER_ANALYTICS_CONFIG.palette,
      ...(override.palette ?? {}),
    },
    thresholds: {
      ...DEFAULT_CREW_SCHEDULER_ANALYTICS_CONFIG.thresholds,
      ...(override.thresholds ?? {}),
    },
    layout: {
      ...DEFAULT_CREW_SCHEDULER_ANALYTICS_CONFIG.layout,
      ...(override.layout ?? {}),
    },
  };

  if (!validateCrewSchedulerAnalyticsConfig(merged)) {
    console.warn('[useCrewSchedulerAnalytics] Invalid config override, using defaults.');
    return DEFAULT_CREW_SCHEDULER_ANALYTICS_CONFIG;
  }

  return merged;
}

/**
 * Calculates severity for a KPI given thresholds.
 */
function resolveSeverity(
  value: number,
  warningThreshold: number,
  criticalThreshold: number,
  inverted = false,
): AnalyticsSeverity {
  if (inverted) {
    if (value < criticalThreshold) return 'critical';
    if (value < warningThreshold) return 'warning';
    return 'ok';
  }

  if (value >= criticalThreshold) return 'critical';
  if (value >= warningThreshold) return 'warning';
  return 'ok';
}

/**
 * Hook used by the Crew Scheduler dashboard to gather analytics metrics.
 */
export function useCrewSchedulerAnalytics(
  options: UseCrewSchedulerAnalyticsOptions = {},
): UseCrewSchedulerAnalyticsReturn {
  const {
    config: overrideConfig,
    enableHistory = true,
    resetHistoryOnMount = true,
  } = options;

  const config = useMemo(() => mergeConfig(overrideConfig), [overrideConfig]);
  const [history, setHistory] = useState<CrewSchedulerAnalyticsEvent[]>(() => {
    if (!enableHistory) {
      return [];
    }
    if (resetHistoryOnMount) {
      clearCrewSchedulerAnalyticsHistory();
      return [];
    }
    return getCrewSchedulerAnalyticsHistory().slice(-config.layout.maxHistoryPoints);
  });
  const [metrics, setMetrics] = useState<CrewSchedulerAnalyticsMetrics>({
    ...EMPTY_METRICS,
    queue: { ...EMPTY_METRICS.queue, maxSize: config.layout.maxHistoryPoints },
  });

  const decisionTimestampsRef = useRef<number[]>([]);
  const dropCountsRef = useRef<{ invalid: number; warning: number; blocked: number; total: number }>(
    { invalid: 0, warning: 0, blocked: 0, total: 0 },
  );

  const trimHistory = useCallback(
    (events: CrewSchedulerAnalyticsEvent[]): CrewSchedulerAnalyticsEvent[] => {
      if (!enableHistory) return events;
      if (events.length <= config.layout.maxHistoryPoints) {
        return events;
      }
      return events.slice(events.length - config.layout.maxHistoryPoints);
    },
    [config.layout.maxHistoryPoints, enableHistory],
  );

  useEffect(() => {
    const handleEvent = (event: CrewSchedulerAnalyticsEvent) => {
      setHistory((prev) => (enableHistory ? trimHistory([...prev, event]) : prev));

      if (event.type === 'queue_snapshot') {
        const snapshot = event as CrewQueueSnapshotEvent;
        setMetrics((prev) => ({
          ...prev,
          queue: {
            total: snapshot.queueStats.total,
            avgPriority: snapshot.queueStats.avgPriority,
            avgFatigue: snapshot.avgFatigue,
            avgStatMatch: snapshot.avgStatMatch,
            byActivity: snapshot.queueStats.byActivity,
            maxSize: snapshot.queueStats.maxSize,
          },
          lastQueueSnapshot: snapshot,
        }));
      } else if (event.type === 'decision') {
        const decisionEvent = event as CrewDecisionEvent;
        const now = Date.now();
        decisionTimestampsRef.current = decisionTimestampsRef.current
          .filter((timestamp) => now - timestamp <= 60_000)
          .concat(now);

        setMetrics((prev) => {
          const assignedIncrement = decisionEvent.decision.assigned ? 1 : 0;
          const rejectedIncrement = decisionEvent.decision.assigned ? 0 : 1;
          const decisionsPerMinute = decisionTimestampsRef.current.length;

          return {
            ...prev,
            lastDecision: decisionEvent.decision,
            throughput: {
              assigned: prev.throughput.assigned + assignedIncrement,
              rejected: prev.throughput.rejected + rejectedIncrement,
              decisionsPerMinute,
            },
          };
        });
      } else if (event.type === 'drop_feedback') {
        const dropEvent = event as CrewDropFeedbackEvent;
        dropCountsRef.current = {
          total: dropCountsRef.current.total + 1,
          invalid:
            dropCountsRef.current.invalid + (dropEvent.feedbackType === 'invalid' ? 1 : 0),
          warning:
            dropCountsRef.current.warning +
            (dropEvent.feedbackType === 'warning' ? 1 : 0),
          blocked:
            dropCountsRef.current.blocked + (dropEvent.feedbackType === 'blocked' ? 1 : 0),
        };

        const failureCount =
          dropCountsRef.current.invalid + dropCountsRef.current.blocked;
        const failureRate =
          dropCountsRef.current.total > 0
            ? failureCount / dropCountsRef.current.total
            : 0;

        setMetrics((prev) => ({
          ...prev,
          dropFeedback: {
            total: dropCountsRef.current.total,
            invalid: dropCountsRef.current.invalid,
            warning: dropCountsRef.current.warning,
            blocked: dropCountsRef.current.blocked,
            failureRate,
          },
        }));
      }
    };

    const unsubscribe = subscribeToCrewSchedulerAnalytics(handleEvent);
    return () => {
      unsubscribe();
    };
  }, [enableHistory, trimHistory]);

  const statuses: CrewSchedulerAnalyticsStatuses = useMemo(() => {
    const thresholds: CrewSchedulerAnalyticsThresholds = config.thresholds;
    const queueStatus = resolveSeverity(
      metrics.queue.total,
      thresholds.queueWarning,
      thresholds.queueCritical,
    );

    const fatigueStatus = resolveSeverity(
      metrics.queue.avgFatigue,
      thresholds.fatigueWarning,
      thresholds.fatigueCritical,
    );

    const dropStatus = resolveSeverity(
      metrics.dropFeedback.failureRate,
      thresholds.dropFailWarning,
      thresholds.dropFailCritical,
    );

    // Throughput target is minimum desired - invert severity logic.
    const throughputStatus = resolveSeverity(
      metrics.throughput.decisionsPerMinute,
      thresholds.throughputTarget,
      thresholds.throughputTarget,
      true,
    );

    return {
      queue: queueStatus,
      fatigue: fatigueStatus,
      dropFailure: dropStatus,
      throughput: throughputStatus,
    };
  }, [config.thresholds, metrics]);

  return {
    config,
    metrics,
    statuses,
    history,
  };
}

export default useCrewSchedulerAnalytics;
