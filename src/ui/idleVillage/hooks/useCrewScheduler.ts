/**
 * Crew Scheduler Hook – WS3 Deterministic Queue Implementation
 * 
 * Provides deterministic crew scheduling with priority queues based on
 * stat tags, fatigue, and quest urgency. Integrates with MapDiagnostics
 * for decision logging and supports both production (random) and test
 * (deterministic) modes.
 * 
 * @since WS3
 */

import { useCallback, useMemo, useState } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '../utils/sandboxDiagnostics';
import {
  recordCrewDecision,
  recordCrewQueueSnapshot,
} from '../utils/crewSchedulerAnalyticsChannel';
import type {
  CrewSchedulerConfig,
  CrewSchedulerDiagnostics,
} from '@/balancing/config/idleVillage/crewScheduler';
import {
  DEFAULT_CREW_SCHEDULER_CONFIG,
  TEST_CREW_SCHEDULER_CONFIG,
  createDeterministicRng,
  calculateAssignmentPriority,
  validateCrewSchedulerConfig,
} from '@/balancing/config/idleVillage/crewScheduler';
import { generateDeterministicSeed, createSchedulerSnapshot } from '@/balancing/config/idleVillage/crewSchedulerDeterminismGuard';
import { saveData } from '@/shared/persistence/PersistenceService';
import { useCrewSchedulerTimeTravel } from './useCrewSchedulerTimeTravel';

/**
 * Factors influencing crew assignment priority.
 */
export interface AssignmentFactors {
  /** How well resident stats match activity requirements (0-1) */
  statTagMatch: number;
  /** Resident fatigue level (0-1, higher = more tired) */
  fatigue: number;
  /** Quest urgency in time units (lower = more urgent) */
  questUrgency: number;
  /** Resident specialization level for this activity (0-1) */
  specialization: number;
  /** Activity difficulty rating (0-1) */
  difficulty: number;
}

/**
 * Queued assignment request with calculated priority.
 */
export interface QueuedAssignment {
  id: string;
  residentId: string;
  activityId: string;
  priorityScore: number;
  factors: AssignmentFactors;
  timestamp: number;
}

/**
 * Scheduling decision result.
 */
export interface SchedulingDecision {
  assigned: boolean;
  residentId?: string;
  activityId?: string;
  priorityScore?: number;
  reason: string;
  diagnostics?: CrewSchedulerDiagnostics;
}

/**
 * Hook configuration options.
 */
export interface UseCrewSchedulerOptions {
  /** Custom scheduler config (uses default if not provided) */
  config?: Partial<CrewSchedulerConfig>;
  /** Whether to run in test mode (deterministic seeding) */
  testMode?: boolean;
  /** Current village state for factor calculations */
  villageState: {
    residents: Record<string, ResidentState>;
    activities: Record<string, ActivityDefinition>;
    currentTime: number;
  };
  /** Activity definitions from config */
  activities: Record<string, ActivityDefinition>;
}

/**
 * Main crew scheduler hook providing deterministic priority queue management.
 */
export function useCrewScheduler({
  config: customConfig,
  testMode = false,
  villageState,
  activities,
}: UseCrewSchedulerOptions) {
  // Merge with appropriate default config
  const config = useMemo(() => {
    const baseConfig = testMode ? TEST_CREW_SCHEDULER_CONFIG : DEFAULT_CREW_SCHEDULER_CONFIG;
    const merged = { ...baseConfig, ...customConfig };
    
    if (!validateCrewSchedulerConfig(merged)) {
      console.warn('Invalid crew scheduler config, falling back to defaults');
      return baseConfig;
    }
    
    return merged;
  }, [customConfig, testMode]);

  // Initialize deterministic RNG if needed
  const rng = useMemo(() => {
    if (config.seeding.deterministic) {
      // Generate seed based on strategy
      const seed = generateDeterministicSeed(
        config.seeding.seedStrategy || 'fixed',
        config.seeding.lcgSeed,
        config.seeding.seedContext
      );
      return createDeterministicRng(seed);
    }
    return null;
  }, [config.seeding]);

  // Diagnostics logging
  const diagnostics = useMemo(
    () => createSandboxDiagnostics<CrewSchedulerDiagnostics>('CrewScheduler', 'scheduler'),
    []
  );

  // Time travel hook for snapshot management
  const timeTravel = useCrewSchedulerTimeTravel({
    timeTravelConfig: config.timeTravel || { enabled: false, maxSnapshots: 0, autoCapture: false, captureOn: {} },
  });

  // Priority queue state
  const [queue, setQueue] = useState<QueuedAssignment[]>([]);

  /**
   * Indicates whether analytics channel emissions are enabled.
   */
  const analyticsEnabled = Boolean(config.analytics?.enableChannel);

  /**
   * Builds queue statistics used by both runtime APIs and analytics events.
   *
   * @param targetQueue - Queue snapshot to analyze
   * @returns Queue stats payload
   */
  const buildQueueStats = useCallback((targetQueue: QueuedAssignment[]) => {
    const total = targetQueue.length;
    const avgPriority =
      total > 0
        ? targetQueue.reduce((sum: number, assignment) => sum + assignment.priorityScore, 0) /
          total
        : 0;
    const byActivity = targetQueue.reduce((acc: Record<string, number>, assignment) => {
      acc[assignment.activityId] = (acc[assignment.activityId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      avgPriority,
      byActivity,
      maxSize: config.maxQueueSize,
    };
  }, [config.maxQueueSize]);

  /**
   * Calculates assignment factors for a resident-activity pair.
   */
  const calculateFactors = useCallback((
    residentId: string,
    activityId: string
  ): AssignmentFactors => {
    const resident = villageState.residents[residentId];
    const activity = activities[activityId];
    
    if (!resident || !activity) {
      return {
        statTagMatch: 0,
        fatigue: 1,
        questUrgency: 999,
        specialization: 0,
        difficulty: 0,
      };
    }

    // Stat tag matching (simplified - would integrate with actual stat system)
    const statTagMatch = activity.statRequirement
      ? (activity.statRequirement.allOf?.[0] ? 0.8 : 0.5)
      : 0.5;

    // Fatigue from resident state
    const fatigue = resident.fatigue ?? 0;

    // Quest urgency (check if activity is time-sensitive)
    const questUrgency = activity.tags?.includes('quest') 
      ? 999 // Default urgency for quests (would be calculated from quest data)
      : 999;

    // Specialization based on resident preferences/history
    const specialization = 0.5; // Default (would come from resident specialization data)

    // Activity difficulty from config
    const difficulty = activity.dangerRating ? activity.dangerRating / 10 : 0.5;

    return {
      statTagMatch: Math.max(0, Math.min(1, statTagMatch)),
      fatigue: Math.max(0, Math.min(1, fatigue)),
      questUrgency: Math.max(0, questUrgency),
      specialization: Math.max(0, Math.min(1, specialization)),
      difficulty: Math.max(0, Math.min(1, difficulty)),
    };
  }, [villageState, activities]);

  /**
   * Enqueues a new assignment request with calculated priority.
   */
  const enqueueTask = useCallback((
    residentId: string,
    activityId: string
  ): QueuedAssignment => {
    const factors = calculateFactors(residentId, activityId);
    const priorityScore = calculateAssignmentPriority(
      config.priorityWeights,
      config.thresholds,
      factors
    );

    const assignment: QueuedAssignment = {
      id: `${residentId}-${activityId}-${Date.now()}`,
      residentId,
      activityId,
      priorityScore,
      factors,
      timestamp: Date.now(),
    };

    // Add to queue maintaining deterministic priority order
    setQueue((prev: QueuedAssignment[]) => {
      const newQueue = [...prev, assignment];
      
      // Deterministic sorting: priority first, then timestamp for tie-breaking
      newQueue.sort((a: QueuedAssignment, b: QueuedAssignment) => {
        // Primary sort: priority score (higher = more priority)
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        // Secondary sort: timestamp (earlier = higher priority for same priority)
        return a.timestamp - b.timestamp;
      });

      const trimmedQueue =
        newQueue.length > config.maxQueueSize ? newQueue.slice(0, config.maxQueueSize) : newQueue;

      if (analyticsEnabled) {
        recordCrewQueueSnapshot(trimmedQueue, buildQueueStats(trimmedQueue));
      }

      return trimmedQueue;
    });

    // Capture snapshot for time travel
    timeTravel.captureSnapshot('enqueueTask', {
      residentId,
      activityId,
      assignmentId: assignment.id,
    });

    // Save snapshot using PersistenceService if enabled
    if (config.timeTravel?.enabled && config.timeTravel?.autoCapture) {
      const snapshot = createSchedulerSnapshot(
        generateDeterministicSeed(
          config.seeding.seedStrategy || 'fixed',
          config.seeding.lcgSeed,
          config.seeding.seedContext
        ),
        config,
        queue,
        villageState
      );
      
      // Save to persistence
      saveData(`crew_scheduler_snapshot_${Date.now()}`, snapshot).catch(error => {
        console.warn('[CrewScheduler] Failed to save snapshot:', error);
      });
    }

    // Log diagnostics if enabled
    if (config.enableDiagnostics) {
      diagnostics.info('Task enqueued', {
        timestamp: Date.now(),
        residentId: assignment.residentId,
        activityId: assignment.activityId,
        priorityScore,
        factors: assignment.factors,
        decision: 'queued' as const,
      });
    }

    return assignment;
  }, [analyticsEnabled, buildQueueStats, calculateFactors, config, diagnostics, timeTravel, queue, villageState]);

  /**
   * Processes the queue and makes scheduling decisions.
   */
  const processQueue = useCallback((): SchedulingDecision[] => {
    const decisions: SchedulingDecision[] = [];
    const processedIds = new Set<string>();

    // Process queue using current state
    queue.forEach((assignment) => {
      // Skip if already processed
      if (processedIds.has(assignment.id)) return;
      processedIds.add(assignment.id);

      const resident = villageState.residents[assignment.residentId];
      const activity = activities[assignment.activityId];

      // Basic availability checks
      if (!resident || !activity) {
        decisions.push({
          assigned: false,
          reason: 'Missing resident or activity',
        });
        return;
      }

      if (resident.status !== 'available') {
        decisions.push({
          assigned: false,
          reason: 'Resident not available',
        });
        return;
      }

      // Check for existing assignments
      const isAlreadyAssigned = Object.values(villageState.activities).some(
        (scheduled: ActivityDefinition & { characterIds?: string[] }) =>
          scheduled.characterIds?.includes(assignment.residentId),
      );

      if (isAlreadyAssigned) {
        decisions.push({
          assigned: false,
          reason: 'Resident already assigned',
        });
        return;
      }

      // Apply some randomness if not deterministic
      let shouldAssign = true;
      if (!config.seeding.deterministic && rng) {
        shouldAssign = rng() > 0.1; // 90% chance to assign
      }

      const decision: SchedulingDecision = {
        assigned: shouldAssign,
        residentId: assignment.residentId,
        activityId: assignment.activityId,
        priorityScore: assignment.priorityScore,
        reason: shouldAssign ? 'High priority assignment' : 'Random rejection',
      };

      decisions.push(decision);

      if (analyticsEnabled) {
        recordCrewDecision(decision);
      }

      // Log diagnostics
      if (config.enableDiagnostics) {
        const diagnostic: CrewSchedulerDiagnostics = {
          timestamp: Date.now(),
          residentId: assignment.residentId,
          activityId: assignment.activityId,
          priorityScore: assignment.priorityScore,
          factors: assignment.factors,
          decision: shouldAssign ? 'assigned' : 'skipped',
          reason: decision.reason,
        };
        diagnostics.info('Scheduling decision', diagnostic);
      }
    });

    // Remove processed assignments from queue
    setQueue((prev: QueuedAssignment[]) => {
      const remaining = prev.filter((a: QueuedAssignment) => !processedIds.has(a.id));
      if (analyticsEnabled) {
        recordCrewQueueSnapshot(remaining, buildQueueStats(remaining));
      }
      return remaining;
    });

    return decisions;
  }, [
    activities,
    analyticsEnabled,
    buildQueueStats,
    config,
    diagnostics,
    queue,
    rng,
    villageState,
  ]);

  // Capture snapshot for time travel after queue processing
  timeTravel.captureSnapshot('processQueue', {
    queueStats: buildQueueStats(queue),
  });

  /**
   * Rebalances the queue by recalculating priorities.
   */
  const rebalanceQueue = useCallback(() => {
    setQueue((prev: QueuedAssignment[]) => {
      const rebalanced = prev.map((assignment: QueuedAssignment) => {
        const factors = calculateFactors(assignment.residentId, assignment.activityId);
        const priorityScore = calculateAssignmentPriority(
          config.priorityWeights,
          config.thresholds,
          factors,
        );

        return {
          ...assignment,
          priorityScore,
          factors,
          timestamp: Date.now(), // Update timestamp for rebalance
        };
      });

      rebalanced.sort((a: QueuedAssignment, b: QueuedAssignment) => {
        // Primary sort: priority score (higher = more priority)
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        // Secondary sort: timestamp (earlier = higher priority for same priority)
        return a.timestamp - b.timestamp;
      });

      diagnostics.info('Queue rebalanced', {
        timestamp: Date.now(),
        residentId: 'system',
        activityId: 'rebalance',
        priorityScore: 0,
        factors: {
          statTagMatch: 0,
          fatigue: 0,
          questUrgency: 0,
          specialization: 0,
          difficulty: 0,
        },
        decision: 'skipped' as const,
        reason: `Rebalanced from ${prev.length} to ${rebalanced.length} items`,
      });

      if (analyticsEnabled) {
        recordCrewQueueSnapshot(rebalanced, buildQueueStats(rebalanced));
      }

      return rebalanced;
    });
  }, [analyticsEnabled, buildQueueStats, calculateFactors, config, diagnostics]);

  // Capture snapshot for time travel after queue rebalance
  timeTravel.captureSnapshot('rebalanceQueue', {
    queueStats: buildQueueStats(queue),
  });

  /**
   * Consumes an assignment from the queue (manual override).
   */
  const consumeAssignment = useCallback((assignmentId: string): QueuedAssignment | null => {
    const assignment = queue.find((a: QueuedAssignment) => a.id === assignmentId);
    if (!assignment) return null;

    setQueue((prev: QueuedAssignment[]) => {
      const filtered = prev.filter((a: QueuedAssignment) => a.id !== assignmentId);
      if (analyticsEnabled) {
        recordCrewQueueSnapshot(filtered, buildQueueStats(filtered));
      }
      return filtered;
    });

    diagnostics.info('Assignment consumed', {
      timestamp: Date.now(),
      residentId: assignment.residentId,
      activityId: assignment.activityId,
      priorityScore: assignment.priorityScore,
      factors: assignment.factors,
      reason: 'Manual consumption',
    });

    timeTravel.captureSnapshot('consumeAssignment', {
      queueStats: buildQueueStats(queue),
    });

    return assignment;
  }, [analyticsEnabled, buildQueueStats, diagnostics, queue, timeTravel]);

  /**
   * Gets current queue statistics.
   */
  const getQueueStats = useCallback(() => {
    return buildQueueStats(queue);
  }, [buildQueueStats, queue]);

  // Set scheduler functions for time travel after all functions are defined
  timeTravel.setScheduler({ queue, getQueueStats });

  return {
    // Queue management
    enqueueTask,
    processQueue,
    rebalanceQueue,
    consumeAssignment,
    getQueueStats,
    
    // State access
    queue,
    config,
    
    // Utilities
    calculateFactors,
    diagnostics,
    timeTravel,
  };
}

export type UseCrewSchedulerReturn = ReturnType<typeof useCrewScheduler>;
