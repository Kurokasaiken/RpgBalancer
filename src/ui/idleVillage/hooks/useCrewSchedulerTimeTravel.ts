/**
 * Crew Scheduler Time Travel Hook – NP-038 Implementation
 *
 * Provides time travel functionality for crew scheduler queue snapshots,
 * enabling rewind/fast-forward through scheduler state history.
 *
 * @since NP-038
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { QueuedAssignment, UseCrewSchedulerReturn } from './useCrewScheduler';
import type { CrewSchedulerTimeTravelConfig } from '@/balancing/config/idleVillage/crewScheduler';

/**
 * Snapshot of scheduler state at a specific point in time.
 */
export interface SchedulerSnapshot {
  /** Unique snapshot ID */
  id: string;
  /** Queue state at time of snapshot */
  queue: QueuedAssignment[];
  /** Timestamp when snapshot was taken */
  timestamp: number;
  /** Operation that triggered the snapshot */
  operation: 'enqueueTask' | 'processQueue' | 'rebalanceQueue' | 'consumeAssignment' | 'initial';
  /** Metadata about the operation */
  metadata?: {
    residentId?: string;
    activityId?: string;
    assignmentId?: string;
    queueStats?: {
      total: number;
      avgPriority: number;
      byActivity: Record<string, number>;
    };
  };
}

/**
 * Time travel navigation state.
 */
export interface TimeTravelState {
  /** Array of snapshots in chronological order */
  snapshots: SchedulerSnapshot[];
  /** Current position in the timeline (0 = earliest, length-1 = latest) */
  currentIndex: number;
  /** Whether time travel is active (not at latest snapshot) */
  isTimeTraveling: boolean;
  /** Whether there are snapshots available */
  hasSnapshots: boolean;
}

/**
 * Hook options for time travel configuration.
 */
export interface UseCrewSchedulerTimeTravelOptions {
  /** Time travel configuration from scheduler config */
  timeTravelConfig: CrewSchedulerTimeTravelConfig;
}

/**
 * Return type for the time travel hook.
 */
export interface UseCrewSchedulerTimeTravelReturn {
  /** Current time travel state */
  timeTravelState: TimeTravelState;

  /** Navigation functions */
  goToBeginning: () => void;
  goToEnd: () => void;
  goToSnapshot: (index: number) => void;
  rewind: () => void;
  fastForward: () => void;

  /** Snapshot management */
  captureSnapshot: (operation: SchedulerSnapshot['operation'], metadata?: SchedulerSnapshot['metadata']) => void;
  clearSnapshots: () => void;
  setScheduler: (scheduler: {
    queue: QueuedAssignment[];
    getQueueStats: () => {
      total: number;
      avgPriority: number;
      byActivity: Record<string, number>;
    };
  }) => void;

  /** Current snapshot info */
  currentSnapshot: SchedulerSnapshot | null;
  canRewind: boolean;
  canFastForward: boolean;
}

/**
 * Hook for managing time travel through crew scheduler snapshots.
 *
 * Provides rewind/fast-forward functionality by capturing and restoring
 * scheduler queue states at key operation points.
 */
export function useCrewSchedulerTimeTravel({
  timeTravelConfig,
}: UseCrewSchedulerTimeTravelOptions): UseCrewSchedulerTimeTravelReturn {
  // Track if time travel is enabled
  const isEnabled = timeTravelConfig.enabled;

  // Snapshots array - use ref to avoid re-renders on every change
  const snapshotsRef = useRef<SchedulerSnapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Scheduler functions ref - set later to avoid circular dependency
  const schedulerRef = useRef<{
    queue: QueuedAssignment[];
    getQueueStats: () => {
      total: number;
      avgPriority: number;
      byActivity: Record<string, number>;
    };
  } | null>(null);

  // Auto-capture initial snapshot on mount
  const initialSnapshotCaptured = useRef(false);
  if (isEnabled && !initialSnapshotCaptured.current) {
    initialSnapshotCaptured.current = true;
    snapshotsRef.current = [{
      id: `initial-${Date.now()}`,
      queue: [],
      timestamp: Date.now(),
      operation: 'initial',
    }];
  }

  /**
   * Creates a snapshot from current scheduler state.
   */
  const createSnapshot = useCallback((
    operation: SchedulerSnapshot['operation'],
    metadata?: SchedulerSnapshot['metadata']
  ): SchedulerSnapshot => {
    if (!schedulerRef.current) {
      throw new Error('Scheduler not set for time travel');
    }

    const queueStats = schedulerRef.current.getQueueStats();

    return {
      id: `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      queue: [...schedulerRef.current.queue],
      timestamp: Date.now(),
      operation,
      metadata: {
        ...metadata,
        queueStats,
      },
    };
  }, []);

  /**
   * Sets the scheduler functions for snapshot creation.
   */
  const setScheduler = useCallback((scheduler: {
    queue: QueuedAssignment[];
    getQueueStats: () => {
      total: number;
      avgPriority: number;
      byActivity: Record<string, number>;
    };
  }) => {
    schedulerRef.current = scheduler;
  }, []);

  /**
   * Captures a new snapshot and manages the snapshot history.
   */
  const captureSnapshot = useCallback((
    operation: SchedulerSnapshot['operation'],
    metadata?: SchedulerSnapshot['metadata']
  ) => {
    if (!isEnabled || !timeTravelConfig.autoCapture) return;
    if (!timeTravelConfig.captureOn[operation]) return;

    const newSnapshot = createSnapshot(operation, metadata);

    // If we're time traveling and capture a new snapshot, discard future snapshots
    if (currentIndex < snapshotsRef.current.length - 1) {
      snapshotsRef.current = snapshotsRef.current.slice(0, currentIndex + 1);
    }

    // Add new snapshot
    snapshotsRef.current.push(newSnapshot);

    // Enforce max snapshots limit
    if (snapshotsRef.current.length > timeTravelConfig.maxSnapshots) {
      snapshotsRef.current.shift(); // Remove oldest
    } else {
      // Update current index to point to the new latest snapshot
      setCurrentIndex(snapshotsRef.current.length - 1);
    }
  }, [isEnabled, timeTravelConfig, currentIndex, createSnapshot]);

  /**
   * Clears all snapshots and resets to initial state.
   */
  const clearSnapshots = useCallback(() => {
    snapshotsRef.current = [];
    setCurrentIndex(0);
    initialSnapshotCaptured.current = false;
  }, []);

  /**
   * Navigates to a specific snapshot index.
   */
  const goToSnapshot = useCallback((index: number) => {
    if (!isEnabled) return;
    if (index < 0 || index >= snapshotsRef.current.length) return;

    setCurrentIndex(index);
  }, [isEnabled]);

  /**
   * Goes to the earliest snapshot.
   */
  const goToBeginning = useCallback(() => {
    if (!isEnabled) return;
    setCurrentIndex(0);
  }, [isEnabled]);

  /**
   * Goes to the latest snapshot.
   */
  const goToEnd = useCallback(() => {
    if (!isEnabled) return;
    setCurrentIndex(snapshotsRef.current.length - 1);
  }, [isEnabled]);

  /**
   * Moves one step backward in time.
   */
  const rewind = useCallback(() => {
    if (!isEnabled) return;
    setCurrentIndex(prev => prev > 0 ? prev - 1 : prev);
  }, [isEnabled]);

  /**
   * Moves one step forward in time.
   */
  const fastForward = useCallback(() => {
    if (!isEnabled) return;
    setCurrentIndex(prev => prev < snapshotsRef.current.length - 1 ? prev + 1 : prev);
  }, [isEnabled]);

  // Compute derived state
  const timeTravelState = useMemo((): TimeTravelState => {
    const snapshots = snapshotsRef.current;
    const hasSnapshots = snapshots.length > 0;
    const isTimeTraveling = hasSnapshots && currentIndex < snapshots.length - 1;

    return {
      snapshots,
      currentIndex,
      isTimeTraveling,
      hasSnapshots,
    };
  }, [currentIndex]);

  const currentSnapshot = timeTravelState.snapshots[timeTravelState.currentIndex] || null;
  const canRewind = isEnabled && timeTravelState.currentIndex > 0;
  const canFastForward = isEnabled && timeTravelState.currentIndex < timeTravelState.snapshots.length - 1;

  return {
    timeTravelState,
    goToBeginning,
    goToEnd,
    goToSnapshot,
    rewind,
    fastForward,
    captureSnapshot,
    clearSnapshots,
    setScheduler,
    currentSnapshot,
    canRewind,
    canFastForward,
  };
}
