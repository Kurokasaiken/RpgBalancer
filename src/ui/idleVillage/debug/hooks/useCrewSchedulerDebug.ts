/**
 * Crew Scheduler Debug Hook – NP-106 Visual Debug Panel
 *
 * Provides debug state and inspection methods for the crew scheduler system.
 * Exposes queue state, configuration, diagnostics, and real-time event tracking
 * for visual debugging and troubleshooting.
 *
 * @since NP-106
 */

import { useCallback, useMemo, useState } from 'react';
import type {
  AssignmentFactors,
  QueuedAssignment,
  SchedulingDecision,
  UseCrewSchedulerReturn,
} from '../../hooks/useCrewScheduler';
import type { CrewSchedulerConfig, CrewSchedulerDiagnostics } from '@/balancing/config/idleVillage/crewScheduler';
import { calculateAssignmentPriority } from '@/balancing/config/idleVillage/crewScheduler';

/**
 * Debug event captured from scheduler operations.
 */
export interface DebugEvent {
  id: string;
  timestamp: number;
  type: 'enqueue' | 'process' | 'rebalance' | 'consume' | 'config_change';
  data: unknown;
}

/**
 * Debug state snapshot for inspection.
 */
export interface CrewSchedulerDebugState {
  /** Current queue state */
  queue: QueuedAssignment[];
  /** Current scheduler configuration */
  config: CrewSchedulerConfig;
  /** Queue statistics */
  queueStats: {
    total: number;
    avgPriority: number;
    byActivity: Record<string, number>;
    maxSize: number;
  };
  /** Recent debug events */
  events: DebugEvent[];
  /** Recent scheduling decisions */
  recentDecisions: SchedulingDecision[];
  /** Diagnostics log entries */
  diagnostics: CrewSchedulerDiagnostics[];
  /** Whether debug mode is enabled */
  debugEnabled: boolean;
}

/**
 * Hook options for debug state management.
 */
export interface UseCrewSchedulerDebugOptions {
  /** Scheduler hook return value */
  scheduler: UseCrewSchedulerReturn;
  /** Maximum number of events to keep in history */
  maxEvents?: number;
  /** Maximum number of decisions to keep in history */
  maxDecisions?: number;
  /** Whether to enable debug mode by default */
  debugEnabled?: boolean;
}

/**
 * Hook providing debug state and inspection methods for crew scheduler.
 *
 * @param options - Debug hook options
 * @returns Debug state and inspection methods
 */
export function useCrewSchedulerDebug({
  scheduler,
  maxEvents = 50,
  maxDecisions = 20,
  debugEnabled = true,
}: UseCrewSchedulerDebugOptions) {
  const [events, setEvents] = useState<DebugEvent[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<SchedulingDecision[]>([]);
  const [diagnostics, setDiagnostics] = useState<CrewSchedulerDiagnostics[]>([]);
  const [debugEnabledState, setDebugEnabledState] = useState(debugEnabled);

  // Derive debug state from scheduler and local state
  const debugState: CrewSchedulerDebugState = useMemo(() => ({
    queue: scheduler.queue,
    config: scheduler.config,
    queueStats: scheduler.getQueueStats(),
    events,
    recentDecisions,
    diagnostics,
    debugEnabled: debugEnabledState,
  }), [scheduler, events, recentDecisions, diagnostics, debugEnabledState]);

  /**
   * Adds a debug event to the event history.
   */
  const addDebugEvent = useCallback((
    type: DebugEvent['type'],
    data: unknown
  ) => {
    if (!debugEnabled) return;

    const event: DebugEvent = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      data,
    };

    setEvents((prev) => [event, ...prev].slice(0, maxEvents));
  }, [debugEnabled, maxEvents]);

  /**
   * Records a scheduling decision for inspection.
   */
  const recordDecision = useCallback((decision: SchedulingDecision) => {
    if (!debugEnabled) return;

    setRecentDecisions((prev) => [decision, ...prev].slice(0, maxDecisions));
  }, [debugEnabled, maxDecisions]);

  /**
   * Records a diagnostic entry for inspection.
   */
  const recordDiagnostic = useCallback((diagnostic: CrewSchedulerDiagnostics) => {
    if (!debugEnabled) return;

    setDiagnostics((prev) => [diagnostic, ...prev].slice(0, maxEvents));
  }, [debugEnabled, maxEvents]);

  /**
   * Clears all debug history.
   */
  const clearDebugHistory = useCallback(() => {
    setEvents([]);
    setRecentDecisions([]);
    setDiagnostics([]);
  }, []);

  /**
   * Toggles debug mode on/off.
   */
  const toggleDebugMode = useCallback(() => {
    setDebugEnabledState((prev) => !prev);
  }, []);

  /**
   * Exports current debug state as JSON for analysis.
   */
  const exportDebugState = useCallback(() => {
    return JSON.stringify(debugState, null, 2);
  }, [debugState]);

  /**
   * Gets assignment factors for a specific resident-activity pair.
   */
  const getAssignmentFactors = useCallback((
    residentId: string,
    activityId: string
  ): AssignmentFactors => {
    return scheduler.calculateFactors(residentId, activityId);
  }, [scheduler]);

  /**
   * Simulates priority calculation for inspection.
   */
  const simulatePriority = useCallback((
    residentId: string,
    activityId: string
  ): { priorityScore: number; factors: AssignmentFactors } => {
    const factors = getAssignmentFactors(residentId, activityId);
    const priorityScore = calculateAssignmentPriority(
      scheduler.config.priorityWeights,
      scheduler.config.thresholds,
      factors
    );
    return { priorityScore, factors };
  }, [getAssignmentFactors, scheduler.config]);

  return {
    // Debug state
    debugState,
    
    // Inspection methods
    getAssignmentFactors,
    simulatePriority,
    
    // Event management
    addDebugEvent,
    recordDecision,
    recordDiagnostic,
    clearDebugHistory,
    
    // Mode control
    toggleDebugMode,
    
    // Export
    exportDebugState,
  };
}

export type UseCrewSchedulerDebugReturn = ReturnType<typeof useCrewSchedulerDebug>;
