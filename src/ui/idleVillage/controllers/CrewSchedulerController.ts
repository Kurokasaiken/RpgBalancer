/**
 * Crew Scheduler Controller – WS3 Deterministic Queue Implementation
 * 
 * Provides a controller abstraction over the useCrewScheduler hook for
 * easier integration with VillageSandbox and other components. This controller
 * manages the priority queue and exposes a clean API for scheduling operations.
 * 
 * @since WS3
 */

import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type {
  AssignmentFactors,
  QueuedAssignment,
  SchedulingDecision,
  UseCrewSchedulerOptions,
  UseCrewSchedulerReturn,
} from '../hooks/useCrewScheduler';
import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';

/**
 * Controller interface for crew scheduling operations.
 */
export interface CrewSchedulerController {
  /** Enqueue a new task for scheduling consideration */
  enqueueTask(residentId: string, activityId: string): QueuedAssignment;
  /** Process the queue and return scheduling decisions */
  processQueue(): SchedulingDecision[];
  /** Rebalance the queue with updated priorities */
  rebalanceQueue(): void;
  /** Manually consume a specific assignment */
  consumeAssignment(assignmentId: string): QueuedAssignment | null;
  /** Get current queue statistics */
  getQueueStats(): {
    total: number;
    avgPriority: number;
    byActivity: Record<string, number>;
    maxSize: number;
  };
  /** Get current queue state */
  getQueue(): QueuedAssignment[];
  /** Get current configuration */
  getConfig(): CrewSchedulerConfig;
  /** Calculate factors for a resident-activity pair */
  calculateFactors(residentId: string, activityId: string): AssignmentFactors;
}

/**
 * Creates a crew scheduler controller instance.
 * 
 * @param options - Scheduler configuration options
 * @param schedulerHook - Return value from useCrewScheduler hook
 * @returns Controller instance
 */
export function createCrewSchedulerController(
  options: UseCrewSchedulerOptions,
  schedulerHook: UseCrewSchedulerReturn
): CrewSchedulerController {
  return {
    enqueueTask: schedulerHook.enqueueTask,
    processQueue: schedulerHook.processQueue,
    rebalanceQueue: schedulerHook.rebalanceQueue,
    consumeAssignment: schedulerHook.consumeAssignment,
    getQueueStats: schedulerHook.getQueueStats,
    getQueue: () => schedulerHook.queue,
    getConfig: () => schedulerHook.config,
    calculateFactors: schedulerHook.calculateFactors,
  };
}

/**
 * Factory function to create a controller with default options.
 * 
 * @param villageState - Current village state
 * @param activities - Activity definitions
 * @param customConfig - Optional custom configuration
 * @param testMode - Whether to run in test mode
 * @returns Controller instance
 */
export function createDefaultCrewSchedulerController(
  villageState: {
    residents: Record<string, ResidentState>;
    activities: Record<string, ActivityDefinition>;
    currentTime: number;
  },
  activities: Record<string, ActivityDefinition>,
  customConfig?: Partial<CrewSchedulerConfig>,
  testMode = false
): CrewSchedulerController {
  // Note: This would typically be used within a React component
  // For now, this is a placeholder for future integration
  throw new Error(
    'createDefaultCrewSchedulerController must be used within a React component. ' +
    'Use useCrewScheduler hook directly and wrap with createCrewSchedulerController.'
  );
}

/**
 * Validates scheduling prerequisites before attempting operations.
 * 
 * @param controller - Controller instance
 * @param residentId - Resident ID to validate
 * @param activityId - Activity ID to validate
 * @returns Validation result with reason if invalid
 */
export function validateSchedulingPrerequisites(
  controller: CrewSchedulerController,
  residentId: string,
  activityId: string
): { valid: boolean; reason?: string } {
  const factors = controller.calculateFactors(residentId, activityId);
  
  // Check if factors indicate valid assignment
  if (factors.fatigue >= 0.9) {
    return { valid: false, reason: 'Resident too exhausted' };
  }
  
  if (factors.statTagMatch < 0.3) {
    return { valid: false, reason: 'Poor stat match for activity' };
  }
  
  return { valid: true };
}

/**
 * Determines if a queue rebalance is recommended based on current state.
 * 
 * @param controller - Controller instance
 * @returns Whether rebalance is recommended
 */
export function shouldRebalanceQueue(controller: CrewSchedulerController): boolean {
  const stats = controller.getQueueStats();
  const queue = controller.getQueue();
  
  // Rebalance if queue is getting full
  if (stats.total >= stats.maxSize * 0.8) {
    return true;
  }
  
  // Rebalance if there are old assignments (older than 5 minutes)
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
  const hasOldAssignments = queue.some(assignment => assignment.timestamp < fiveMinutesAgo);
  
  return hasOldAssignments;
}

/**
 * Gets scheduling recommendations for the current queue state.
 * 
 * @param controller - Controller instance
 * @returns Array of recommendations
 */
export function getSchedulingRecommendations(controller: CrewSchedulerController): string[] {
  const recommendations: string[] = [];
  const stats = controller.getQueueStats();
  const queue = controller.getQueue();
  
  // Check queue size
  if (stats.total === 0) {
    recommendations.push('Queue is empty - consider enqueuing tasks');
  } else if (stats.total >= stats.maxSize * 0.9) {
    recommendations.push('Queue nearly full - process or rebalance soon');
  }
  
  // Check average priority
  if (stats.avgPriority < 5) {
    recommendations.push('Low average priority - consider rebalancing');
  }
  
  // Check for stuck assignments
  const stuckAssignments = queue.filter(
    assignment => Date.now() - assignment.timestamp > 10 * 60 * 1000 // 10 minutes
  );
  
  if (stuckAssignments.length > 0) {
    recommendations.push(`${stuckAssignments.length} assignments stuck in queue`);
  }
  
  return recommendations;
}
