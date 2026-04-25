/**
 * Crew Scheduler Debug Hook – NP-106
 * 
 * Provides real-time state collection and metrics for the crew scheduler
 * debug panel. Collects queue state, conflict information, and performance
 * metrics without modifying scheduler behavior.
 * 
 * @since NP-106
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { QueuedAssignment } from './useCrewScheduler';
import type {
  CrewSchedulerDebugConfig,
  ConflictSeverity,
  VisualizationMode,
} from '../config/crewSchedulerDebugConfig';
import {
  DEFAULT_CREW_SCHEDULER_DEBUG_CONFIG,
  getRefreshInterval,
} from '../config/crewSchedulerDebugConfig';
import { CrewSchedulerConflictResolver } from '@/balancing/utils/idleVillage/crewSchedulerConflictResolver';
import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';
import { DEFAULT_CREW_SCHEDULER_CONFIG } from '@/balancing/config/idleVillage/crewScheduler';
import { DEFAULT_CONFLICT_RESOLVER_CONFIG } from '@/balancing/config/idleVillage/conflictResolverConfig';
import { saveData } from '@/shared/persistence/PersistenceService';

/**
 * Detected conflict with severity and details.
 */
export interface DetectedConflict {
  id: string;
  type: 'queue_overflow' | 'fatigue_overload' | 'priority_inversion' | 'skill_mismatch';
  severity: ConflictSeverity;
  description: string;
  affectedAssignments: string[];
  timestamp: number;
}

/**
 * Slot occupancy data for heatmap visualization.
 */
export interface SlotOccupancy {
  slotId: string;
  activityId: string;
  occupancyRate: number; // 0-1
  assignmentCount: number;
  avgPriority: number;
  hasConflict: boolean;
}

/**
 * Timeline entry for scheduler state visualization.
 */
export interface TimelineEntry {
  timestamp: number;
  queueSize: number;
  avgPriority: number;
  conflictCount: number;
  assignmentRate: number;
}

/**
 * Aggregated metrics for the debug panel.
 */
export interface DebugMetrics {
  queueSize: number;
  avgPriority: number;
  conflictCount: number;
  assignmentRate: number;
  avgFatigue: number;
  specializationMatchRate: number;
  queueUtilization: number; // 0-1
}

/**
 * Hook options for crew scheduler debug.
 */
export interface UseCrewSchedulerDebugOptions {
  /** Current queue state from scheduler */
  queue: QueuedAssignment[];
  /** Scheduler configuration */
  schedulerConfig?: CrewSchedulerConfig;
  /** Debug panel configuration */
  debugConfig?: Partial<CrewSchedulerDebugConfig>;
  /** Whether debug panel is active */
  isActive?: boolean;
}

/**
 * Return type for the debug hook.
 */
export interface UseCrewSchedulerDebugReturn {
  /** Current debug metrics */
  metrics: DebugMetrics;
  /** Detected conflicts */
  conflicts: DetectedConflict[];
  /** Slot occupancy data for heatmap */
  slotOccupancy: SlotOccupancy[];
  /** Timeline history */
  timeline: TimelineEntry[];
  /** Current visualization mode */
  visualizationMode: VisualizationMode;
  /** Set visualization mode */
  setVisualizationMode: (mode: VisualizationMode) => void;
  /** Clear timeline history */
  clearTimeline: () => void;
  /** Export debug data */
  exportDebugData: () => Promise<void>;
  /** Debug configuration */
  config: CrewSchedulerDebugConfig;
}

/**
 * Hook for collecting and analyzing crew scheduler state for debugging.
 * 
 * Provides real-time metrics, conflict detection, and visualization data
 * without interfering with scheduler operations.
 */
export function useCrewSchedulerDebug({
  queue,
  schedulerConfig = DEFAULT_CREW_SCHEDULER_CONFIG,
  debugConfig,
  isActive = true,
}: UseCrewSchedulerDebugOptions): UseCrewSchedulerDebugReturn {
  // Merge with default config
  const config = useMemo<CrewSchedulerDebugConfig>(() => ({
    ...DEFAULT_CREW_SCHEDULER_DEBUG_CONFIG,
    ...debugConfig,
  }), [debugConfig]);

  // Visualization mode state
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>(
    config.defaultVisualizationMode
  );

  // Timeline history
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const timelineRef = useRef<TimelineEntry[]>([]);

  // Conflict resolver for detection
  const conflictResolver = useMemo(
    () => new CrewSchedulerConflictResolver(schedulerConfig, DEFAULT_CONFLICT_RESOLVER_CONFIG),
    [schedulerConfig]
  );

  // Previous queue size for rate calculation
  const prevQueueSizeRef = useRef(queue.length);
  const lastUpdateRef = useRef(0);
  
  // Initialize lastUpdateRef on mount
  useEffect(() => {
    lastUpdateRef.current = Date.now();
  }, []);

  // Track assignment rate separately to avoid Date.now() in useMemo
  const [assignmentRate, setAssignmentRate] = useState(0);

  /**
   * Calculates current debug metrics from queue state.
   */
  const metrics = useMemo<DebugMetrics>(() => {
    if (queue.length === 0) {
      return {
        queueSize: 0,
        avgPriority: 0,
        conflictCount: 0,
        assignmentRate: 0,
        avgFatigue: 0,
        specializationMatchRate: 0,
        queueUtilization: 0,
      };
    }

    const totalPriority = queue.reduce((sum, a) => sum + a.priorityScore, 0);
    const avgPriority = totalPriority / queue.length;

    const totalFatigue = queue.reduce((sum, a) => sum + a.factors.fatigue, 0);
    const avgFatigue = totalFatigue / queue.length;

    const matchingSpecializations = queue.filter(
      a => a.factors.specialization >= 0.5
    ).length;
    const specializationMatchRate = matchingSpecializations / queue.length;

    const queueUtilization = queue.length / schedulerConfig.maxQueueSize;

    // Detect conflicts
    const { conflicts: detectedConflicts } = conflictResolver.analyzeQueue(queue);

    return {
      queueSize: queue.length,
      avgPriority,
      conflictCount: detectedConflicts.length,
      assignmentRate,
      avgFatigue,
      specializationMatchRate,
      queueUtilization,
    };
  }, [queue, schedulerConfig.maxQueueSize, conflictResolver, assignmentRate]);

  /**
   * Update assignment rate calculation in effect.
   */
  useEffect(() => {
    const now = Date.now();
    const timeDelta = (now - lastUpdateRef.current) / 1000;
    const queueDelta = prevQueueSizeRef.current - queue.length;
    const rate = timeDelta > 0 ? Math.max(0, queueDelta / timeDelta) : 0;
    setAssignmentRate(rate);
    prevQueueSizeRef.current = queue.length;
    lastUpdateRef.current = now;
  }, [queue.length]);

  /**
   * Detects conflicts in the current queue.
   */
  const conflicts = useMemo<DetectedConflict[]>(() => {
    if (!config.enabled || queue.length === 0) {
      return [];
    }

    const { conflicts: rawConflicts } = conflictResolver.analyzeQueue(queue);
    
    return rawConflicts
      .slice(0, config.maxConflictsDisplayed)
      .map(conflict => ({
        id: conflict.id,
        type: conflict.type as DetectedConflict['type'],
        severity: conflict.severity as ConflictSeverity,
        description: conflict.description,
        affectedAssignments: conflict.affectedAssignments,
        timestamp: conflict.detectedAt,
      }));
  }, [config.enabled, config.maxConflictsDisplayed, queue, conflictResolver]);

  /**
   * Calculates slot occupancy data for heatmap.
   */
  const slotOccupancy = useMemo<SlotOccupancy[]>(() => {
    if (!config.enabled || queue.length === 0) {
      return [];
    }

    // Group assignments by activity
    const byActivity = queue.reduce<Record<string, QueuedAssignment[]>>((acc, assignment) => {
      if (!acc[assignment.activityId]) {
        acc[assignment.activityId] = [];
      }
      acc[assignment.activityId].push(assignment);
      return acc;
    }, {});

    // Calculate occupancy for each activity
    return Object.entries(byActivity).map(([activityId, assignments]) => {
      const totalPriority = assignments.reduce((sum, a) => sum + a.priorityScore, 0);
      const avgPriority = totalPriority / assignments.length;
      const occupancyRate = Math.min(1, assignments.length / 5); // Assume max 5 per slot

      // Check if any assignments have conflicts
      const assignmentIds = new Set(assignments.map(a => a.id));
      const hasConflict = conflicts.some(c =>
        c.affectedAssignments.some(id => assignmentIds.has(id))
      );

      return {
        slotId: activityId,
        activityId,
        occupancyRate,
        assignmentCount: assignments.length,
        avgPriority,
        hasConflict,
      };
    });
  }, [config.enabled, queue, conflicts]);

  /**
   * Updates timeline with current state.
   */
  const updateTimeline = useCallback(() => {
    if (!config.enabled || !isActive) return;

    const now = Date.now();
    const entry: TimelineEntry = {
      timestamp: now,
      queueSize: metrics.queueSize,
      avgPriority: metrics.avgPriority,
      conflictCount: metrics.conflictCount,
      assignmentRate: metrics.assignmentRate,
    };

    setTimeline(prev => {
      const updated = [...prev, entry];
      // Keep only entries within visible range
      const cutoff = now - config.timeline.visibleRange * config.timeline.timeUnitMs;
      const filtered = updated.filter(e => e.timestamp >= cutoff);
      timelineRef.current = filtered;
      return filtered;
    });

    // Update refs for next calculation
    prevQueueSizeRef.current = queue.length;
    lastUpdateRef.current = now;
  }, [config, isActive, metrics, queue.length]);

  /**
   * Clears timeline history.
   */
  const clearTimeline = useCallback(() => {
    setTimeline([]);
    timelineRef.current = [];
  }, []);

  /**
   * Exports debug data to PersistenceService.
   */
  const exportDebugData = useCallback(async () => {
    if (!config.enableTelemetry) return;

    const exportData = {
      timestamp: Date.now(),
      metrics,
      conflicts,
      slotOccupancy,
      timeline: timelineRef.current,
      queueSnapshot: queue.map(a => ({
        id: a.id,
        residentId: a.residentId,
        activityId: a.activityId,
        priorityScore: a.priorityScore,
        factors: a.factors,
      })),
    };

    try {
      await saveData(`crew_scheduler_debug_${Date.now()}`, exportData);
      
      // Emit telemetry event
      if (config.enableTelemetry) {
        window.dispatchEvent(new CustomEvent('crew_scheduler_debug_opened', {
          detail: {
            timestamp: Date.now(),
            queueSize: metrics.queueSize,
            conflictCount: metrics.conflictCount,
            visualizationMode,
          },
        }));
      }
    } catch (error) {
      console.warn('[CrewSchedulerDebug] Failed to export debug data:', error);
    }
  }, [config.enableTelemetry, metrics, conflicts, slotOccupancy, queue, visualizationMode]);

  /**
   * Auto-refresh timeline based on refresh rate.
   */
  useEffect(() => {
    if (!config.enabled || !isActive) return;

    const interval = getRefreshInterval(config.refreshRate);
    if (interval === 0) return; // Manual refresh only

    let frameId: number;
    let lastTime = Date.now();
    
    const tick = () => {
      const now = Date.now();
      if (now - lastTime >= interval) {
        updateTimeline();
        lastTime = now;
      }
      frameId = requestAnimationFrame(tick);
    };
    
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [config.enabled, config.refreshRate, isActive, updateTimeline, config.timeline.timeUnitMs]);

  /**
   * Emit telemetry when panel opens.
   */
  useEffect(() => {
    if (isActive && config.enableTelemetry) {
      window.dispatchEvent(new CustomEvent('crew_scheduler_debug_opened', {
        detail: {
          timestamp: Date.now(),
          queueSize: metrics.queueSize,
          conflictCount: metrics.conflictCount,
          visualizationMode,
        },
      }));
    }
  }, [isActive, config.enableTelemetry, metrics.queueSize, metrics.conflictCount, visualizationMode]);

  return {
    metrics,
    conflicts,
    slotOccupancy,
    timeline,
    visualizationMode,
    setVisualizationMode,
    clearTimeline,
    exportDebugData,
    config,
  };
}
