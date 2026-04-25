/**
 * Maintenance Task Scheduling Recommendations
 *
 * Advanced scheduling system for maintenance tasks that considers resource availability,
 * resident fatigue, activity conflicts, and optimization algorithms to provide actionable
 * scheduling recommendations for optimal village maintenance.
 *
 * @module maintenanceTaskScheduling
 * @since 2026-01-13
 * @author Cascade
 */

import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { MaintenanceTask, TaskSchedulingRecommendation } from './maintenanceTaskForecaster';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const diagnostics = createHeadlessDiagnostics('MaintenanceTaskScheduling', 'maintenance_scheduling');

/**
 * Scheduling constraints and preferences
 */
export interface SchedulingConstraints {
  /** Maximum concurrent tasks per resident */
  maxConcurrentTasksPerResident: number;
  /** Maximum concurrent tasks per resource type */
  maxConcurrentTasksPerResource: Record<string, number>;
  /** Minimum rest period between tasks for same resident (minutes) */
  minRestPeriodMinutes: number;
  /** Preferred working hours for different task types */
  preferredHours: {
    urgent: { start: number; end: number }; // 24-hour format
    routine: { start: number; end: number };
    specialized: { start: number; end: number };
  };
  /** Resource availability weights for scheduling priority */
  resourceAvailabilityWeights: Record<string, number>;
  /** Resident fatigue impact on scheduling */
  fatigueThresholds: {
    low: number;     // Below this, full scheduling priority
    medium: number;  // Reduced priority
    high: number;    // Only urgent tasks
    critical: number; // No tasks allowed
  };
}

/**
 * Scheduling optimization preferences
 */
export interface SchedulingOptimization {
  /** Prioritize efficiency over speed */
  prioritizeEfficiency: boolean;
  /** Allow task interleaving for better resource utilization */
  allowTaskInterleaving: boolean;
  /** Consider long-term resource sustainability */
  considerSustainability: boolean;
  /** Optimize for resident work-life balance */
  optimizeWorkLifeBalance: boolean;
  /** Maximum scheduling lookahead in hours */
  maxLookaheadHours: number;
  /** Weight factors for different optimization goals */
  weights: {
    resourceEfficiency: number;
    residentWellbeing: number;
    taskUrgency: number;
    completionSpeed: number;
  };
}

/**
 * Task scheduling conflict
 */
export interface SchedulingConflict {
  /** Conflict type */
  type: 'resource' | 'personnel' | 'time' | 'dependency';
  /** Severity level */
  severity: 'minor' | 'moderate' | 'major' | 'blocking';
  /** Description of the conflict */
  description: string;
  /** Affected time window */
  timeWindow: { start: number; end: number };
  /** Potential resolution suggestions */
  resolutions: string[];
}

/**
 * Resource availability snapshot
 */
interface ResourceAvailability {
  resource: string;
  available: number;
  total: number;
  utilization: number;
  nextAvailable: number; // timestamp
}

/**
 * Resident scheduling state
 */
interface ResidentSchedule {
  residentId: string;
  currentFatigue: number;
  assignedTasks: Array<{
    taskId: string;
    startTime: number;
    endTime: number;
  }>;
  nextAvailable: number; // timestamp
  workLoad: number; // 0-1 scale
}

/**
 * Maintenance Task Scheduler
 */
export class MaintenanceTaskScheduler {
  private config: IdleVillageConfig;
  private constraints: SchedulingConstraints;
  private optimization: SchedulingOptimization;

  constructor(
    config: IdleVillageConfig,
    constraints?: Partial<SchedulingConstraints>,
    optimization?: Partial<SchedulingOptimization>
  ) {
    this.config = config;
    this.constraints = {
      maxConcurrentTasksPerResident: 1,
      maxConcurrentTasksPerResource: {
        tools: 3,
        wood: 5,
        stone: 3,
        medicine: 2,
      },
      minRestPeriodMinutes: 30,
      preferredHours: {
        urgent: { start: 0, end: 24 }, // Any time
        routine: { start: 6, end: 18 }, // Daytime
        specialized: { start: 8, end: 17 }, // Business hours
      },
      resourceAvailabilityWeights: {
        tools: 1.2,
        medicine: 1.5,
        wood: 0.8,
        stone: 0.9,
      },
      fatigueThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
        critical: 0.9,
      },
      ...constraints,
    };

    this.optimization = {
      prioritizeEfficiency: true,
      allowTaskInterleaving: true,
      considerSustainability: true,
      optimizeWorkLifeBalance: false,
      maxLookaheadHours: 48,
      weights: {
        resourceEfficiency: 0.4,
        residentWellbeing: 0.3,
        taskUrgency: 0.2,
        completionSpeed: 0.1,
      },
      ...optimization,
    };
  }

  /**
   * Generate scheduling recommendations for maintenance tasks
   */
  generateSchedulingRecommendations(
    tasks: MaintenanceTask[],
    villageState: VillageState,
    existingSchedule?: Array<{
      taskId: string;
      startTime: number;
      endTime: number;
      assignedResidents: string[];
      requiredResources: Record<string, number>;
    }>
  ): TaskSchedulingRecommendation[] {
    const startTime = Date.now();
    diagnostics.info('Generating scheduling recommendations', {
      taskCount: tasks.length,
      lookaheadHours: this.optimization.maxLookaheadHours,
    });

    // Initialize scheduling state
    const resourceAvailability = this.calculateResourceAvailability(villageState);
    const residentSchedules = this.buildResidentSchedules(villageState, existingSchedule || []);

    // Generate recommendations for each task
    const recommendations: TaskSchedulingRecommendation[] = [];

    for (const task of tasks) {
      const recommendation = this.scheduleIndividualTask(
        task,
        villageState,
        resourceAvailability,
        residentSchedules,
        existingSchedule || []
      );
      recommendations.push(recommendation);
    }

    // Apply optimization passes
    if (this.optimization.allowTaskInterleaving) {
      this.optimizeTaskInterleaving(recommendations, residentSchedules);
    }

    if (this.optimization.considerSustainability) {
      this.applySustainabilityConstraints(recommendations, villageState);
    }

    if (this.optimization.optimizeWorkLifeBalance) {
      this.optimizeWorkLifeBalance(recommendations, residentSchedules);
    }

    // Final ranking and scoring
    this.scoreRecommendations(recommendations);

    const duration = Date.now() - startTime;
    diagnostics.info('Scheduling recommendations completed', {
      duration,
      recommendations: recommendations.length,
      optimized: this.optimization.allowTaskInterleaving,
    });

    return recommendations;
  }

  /**
   * Schedule an individual task
   */
  private scheduleIndividualTask(
    task: MaintenanceTask,
    villageState: VillageState,
    resourceAvailability: ResourceAvailability[],
    residentSchedules: Map<string, ResidentSchedule>,
    existingSchedule: Array<{
      taskId: string;
      startTime: number;
      endTime: number;
      assignedResidents: string[];
      requiredResources: Record<string, number>;
    }>
  ): TaskSchedulingRecommendation {
    const currentTime = villageState.timestamp;

    // Find optimal time window
    const schedulingWindow = this.findOptimalTimeWindow(task, currentTime);

    // Identify potential conflicts
    const conflicts = this.identifySchedulingConflicts(
      task,
      schedulingWindow,
      resourceAvailability,
      residentSchedules,
      existingSchedule
    );

    // Generate alternative schedules
    const alternatives = this.generateAlternativeSchedules(
      task,
      schedulingWindow,
      conflicts,
      villageState
    );

    // Calculate impact metrics
    const impact = this.calculateSchedulingImpact(task, villageState);

    // Generate reasoning
    const reasoning = this.generateSchedulingReasoning(task, schedulingWindow, conflicts);

    return {
      task,
      schedulingWindow,
      reasoning,
      alternatives,
      conflicts: conflicts.map(c => c.description),
      impact,
    };
  }

  /**
   * Find optimal time window for a task
   */
  private findOptimalTimeWindow(
    task: MaintenanceTask,
    currentTime: number
  ): { startTime: number; endTime: number; duration: number } {
    const taskType = this.categorizeTaskType(task);
    const preferredHours = this.constraints.preferredHours[taskType];

    // Calculate urgency factor (0-1, higher = more urgent)
    const timeToDeadline = task.targetCompletionTime - currentTime;
    const urgencyFactor = Math.max(0, Math.min(1, 1 - (timeToDeadline / (24 * 60 * 60 * 1000)))); // 24 hours

    // Adjust scheduling based on urgency
    let startDelay = 0;
    if (urgencyFactor > 0.8) {
      // Critical: Schedule immediately
      startDelay = 0;
    } else if (urgencyFactor > 0.6) {
      // High: Schedule within preferred hours
      startDelay = this.calculatePreferredHoursDelay(currentTime, preferredHours);
    } else if (urgencyFactor > 0.3) {
      // Medium: Can wait up to 12 hours
      startDelay = Math.min(12 * 60 * 60 * 1000, timeToDeadline * 0.5);
    } else {
      // Low: Flexible scheduling
      startDelay = Math.min(24 * 60 * 60 * 1000, timeToDeadline * 0.7);
    }

    const startTime = currentTime + startDelay;
    const endTime = startTime + (task.estimatedDuration * 60 * 1000);
    const duration = task.estimatedDuration * 60 * 1000;

    return { startTime, endTime, duration };
  }

  /**
   * Categorize task type for scheduling preferences
   */
  private categorizeTaskType(task: MaintenanceTask): keyof SchedulingConstraints['preferredHours'] {
    if (task.priority === 'critical') return 'urgent';
    if (task.category === 'health_check' || task.category === 'building_maintenance') return 'urgent';
    if (task.category === 'equipment_upkeep' || task.category === 'sanitation') return 'specialized';
    return 'routine';
  }

  /**
   * Calculate delay to reach preferred hours
   */
  private calculatePreferredHoursDelay(currentTime: number, preferredHours: { start: number; end: number }): number {
    const currentHour = new Date(currentTime).getHours();
    const currentMinute = new Date(currentTime).getMinutes();

    if (currentHour >= preferredHours.start && currentHour < preferredHours.end) {
      return 0; // Already in preferred hours
    }

    // Calculate time to next preferred start
    let nextStartHour = preferredHours.start;
    if (currentHour >= preferredHours.end) {
      nextStartHour = preferredHours.start + 24; // Tomorrow
    }

    const nextStartTime = new Date(currentTime);
    nextStartTime.setHours(nextStartHour, 0, 0, 0);

    return Math.max(0, nextStartTime.getTime() - currentTime);
  }

  /**
   * Calculate resource availability
   */
  private calculateResourceAvailability(villageState: VillageState): ResourceAvailability[] {
    const resources = villageState.resources || {};
    const availability: ResourceAvailability[] = [];

    // Define total capacities (would come from config)
    const capacities = {
      food: 200,
      wood: 100,
      stone: 50,
      tools: 20,
      medicine: 10,
    };

    Object.entries(capacities).forEach(([resource, total]) => {
      const available = resources[resource] || 0;
      const utilization = total > 0 ? (total - available) / total : 0;

      availability.push({
        resource,
        available,
        total,
        utilization,
        nextAvailable: villageState.timestamp, // Assume available now (could be more complex)
      });
    });

    return availability;
  }

  /**
   * Build resident scheduling state
   */
  private buildResidentSchedules(
    villageState: VillageState,
    existingSchedule: Array<{
      taskId: string;
      startTime: number;
      endTime: number;
      assignedResidents: string[];
      requiredResources: Record<string, number>;
    }>
  ): Map<string, ResidentSchedule> {
    const schedules = new Map<string, ResidentSchedule>();

    villageState.residents.forEach(resident => {
      const assignedTasks = existingSchedule
        .filter(schedule => schedule.assignedResidents.includes(resident.id))
        .map(schedule => ({
          taskId: schedule.taskId,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        }));

      // Calculate work load (simplified)
      const activeTasks = assignedTasks.filter(task =>
        task.startTime <= villageState.timestamp && task.endTime > villageState.timestamp
      ).length;

      const workLoad = Math.min(1, activeTasks / this.constraints.maxConcurrentTasksPerResident);

      schedules.set(resident.id, {
        residentId: resident.id,
        currentFatigue: resident.fatigue,
        assignedTasks,
        nextAvailable: this.calculateResidentNextAvailable(resident, assignedTasks, villageState.timestamp),
        workLoad,
      });
    });

    return schedules;
  }

  /**
   * Calculate when a resident will next be available
   */
  private calculateResidentNextAvailable(
    resident: ResidentState,
    assignedTasks: Array<{ taskId: string; startTime: number; endTime: number }>,
    currentTime: number
  ): number {
    const futureTasks = assignedTasks.filter(task => task.endTime > currentTime);
    if (futureTasks.length === 0) return currentTime;

    const latestEndTime = Math.max(...futureTasks.map(task => task.endTime));

    // Add rest period
    const restPeriod = this.constraints.minRestPeriodMinutes * 60 * 1000;

    return latestEndTime + restPeriod;
  }

  /**
   * Identify scheduling conflicts for a task
   */
  private identifySchedulingConflicts(
    task: MaintenanceTask,
    schedulingWindow: { startTime: number; endTime: number },
    resourceAvailability: ResourceAvailability[],
    residentSchedules: Map<string, ResidentSchedule>,
    existingSchedule: Array<{
      taskId: string;
      startTime: number;
      endTime: number;
      assignedResidents: string[];
      requiredResources: Record<string, number>;
    }>
  ): SchedulingConflict[] {
    const conflicts: SchedulingConflict[] = [];

    // Check resource availability
    Object.entries(task.requiredResources).forEach(([resource, amount]) => {
      const resourceInfo = resourceAvailability.find(r => r.resource === resource);
      if (resourceInfo && resourceInfo.available < amount) {
        conflicts.push({
          type: 'resource',
          severity: resourceInfo.available === 0 ? 'blocking' : 'major',
          description: `Insufficient ${resource}: ${resourceInfo.available} available, ${amount} needed`,
          timeWindow: schedulingWindow,
          resolutions: [
            'Delay task until resources are replenished',
            'Reduce resource requirements if possible',
            'Substitute with alternative resources',
          ],
        });
      }
    });

    // Check resident availability (simplified - would need skill matching)
    const availableResidents = Array.from(residentSchedules.values()).filter(schedule => {
      // Check fatigue levels
      const fatigueLevel = schedule.currentFatigue;
      const fatigueThreshold = task.priority === 'critical'
        ? this.constraints.fatigueThresholds.critical
        : task.priority === 'high'
        ? this.constraints.fatigueThresholds.high
        : this.constraints.fatigueThresholds.medium;

      if (fatigueLevel > fatigueThreshold) return false;

      // Check availability
      return schedule.nextAvailable <= schedulingWindow.startTime;
    });

    if (availableResidents.length === 0) {
      conflicts.push({
        type: 'personnel',
        severity: 'blocking',
        description: 'No residents available for task assignment',
        timeWindow: schedulingWindow,
        resolutions: [
          'Wait for resident rest periods to complete',
          'Reduce task requirements or split into smaller tasks',
          'Consider lower-priority task alternatives',
        ],
      });
    }

    // Check for time conflicts with existing schedule
    const overlappingTasks = existingSchedule.filter(schedule =>
      schedule.startTime < schedulingWindow.endTime &&
      schedule.endTime > schedulingWindow.startTime
    );

    if (overlappingTasks.length > 0) {
      conflicts.push({
        type: 'time',
        severity: overlappingTasks.length > 2 ? 'major' : 'moderate',
        description: `${overlappingTasks.length} existing tasks overlap with proposed schedule`,
        timeWindow: schedulingWindow,
        resolutions: [
          'Adjust scheduling window to avoid conflicts',
          'Consider task interleaving if allowed',
          'Prioritize based on task urgency',
        ],
      });
    }

    return conflicts;
  }

  /**
   * Generate alternative scheduling options
   */
  private generateAlternativeSchedules(
    task: MaintenanceTask,
    primaryWindow: { startTime: number; endTime: number; duration: number },
    conflicts: SchedulingConflict[],
    villageState: VillageState
  ): Array<{ startTime: number; endTime: number; score: number }> {
    const alternatives: Array<{ startTime: number; endTime: number; score: number }> = [];

    // Generate 3 alternative time slots
    for (let i = 1; i <= 3; i++) {
      const offset = i * 4 * 60 * 60 * 1000; // 4, 8, 12 hours later
      const altStart = primaryWindow.startTime + offset;
      const altEnd = altStart + primaryWindow.duration;

      // Calculate preference score based on conflicts and timing
      let score = 1.0;

      // Reduce score for each conflict
      conflicts.forEach(conflict => {
        switch (conflict.severity) {
          case 'minor': score *= 0.95; break;
          case 'moderate': score *= 0.85; break;
          case 'major': score *= 0.7; break;
          case 'blocking': score *= 0.5; break;
        }
      });

      // Adjust score based on timing preferences
      const hoursFromNow = (altStart - villageState.timestamp) / (60 * 60 * 1000);
      if (hoursFromNow > 24) score *= 0.8; // Penalize far future
      if (hoursFromNow < 1) score *= 0.9; // Slight penalty for very soon

      alternatives.push({
        startTime: altStart,
        endTime: altEnd,
        score,
      });
    }

    return alternatives.sort((a, b) => b.score - a.score);
  }

  /**
   * Calculate scheduling impact metrics
   */
  private calculateSchedulingImpact(
    task: MaintenanceTask,
    villageState: VillageState
  ): { resourceSavings: Record<string, number>; efficiencyGain: number; riskReduction: number } {
    const impact = {
      resourceSavings: {} as Record<string, number>,
      efficiencyGain: 0,
      riskReduction: 0,
    };

    // Calculate based on task category
    switch (task.category) {
      case 'resident_rest':
        impact.efficiencyGain = 0.25; // 25% efficiency gain after rest
        impact.riskReduction = 0.3; // 30% reduction in injury risk
        break;

      case 'activity_repair':
        impact.efficiencyGain = 0.2; // 20% efficiency gain after repair
        impact.resourceSavings = { tools: 2 }; // Save on tool replacement
        break;

      case 'resource_replenishment':
        impact.riskReduction = 0.5; // 50% reduction in shortage risk
        break;

      case 'building_maintenance':
        impact.efficiencyGain = 0.15; // 15% efficiency gain
        impact.riskReduction = 0.25; // 25% reduction in collapse risk
        break;

      case 'health_check':
        impact.riskReduction = 0.4; // 40% reduction in health risk
        break;

      case 'equipment_upkeep':
        impact.efficiencyGain = 0.1; // 10% efficiency gain
        impact.resourceSavings = { tools: 1 };
        break;

      case 'sanitation':
        impact.riskReduction = 0.2; // 20% reduction in disease risk
        break;

      case 'security_patrol':
        impact.riskReduction = 0.35; // 35% reduction in security risk
        break;

      default:
        impact.efficiencyGain = 0.05;
        impact.riskReduction = 0.1;
    }

    return impact;
  }

  /**
   * Generate scheduling reasoning
   */
  private generateSchedulingReasoning(
    task: MaintenanceTask,
    schedulingWindow: { startTime: number; endTime: number },
    conflicts: SchedulingConflict[]
  ): string[] {
    const reasoning: string[] = [];
    const currentTime = Date.now();
    const hoursUntilStart = (schedulingWindow.startTime - currentTime) / (60 * 60 * 1000);

    reasoning.push(`Task priority: ${task.priority.toUpperCase()}`);
    reasoning.push(`Estimated duration: ${task.estimatedDuration} minutes`);
    reasoning.push(`Scheduled to start in ${hoursUntilStart.toFixed(1)} hours`);

    if (conflicts.length === 0) {
      reasoning.push('No scheduling conflicts detected');
      reasoning.push('Optimal resource and personnel availability');
    } else {
      const conflictCount = conflicts.length;
      const blockingConflicts = conflicts.filter(c => c.severity === 'blocking').length;

      reasoning.push(`${conflictCount} scheduling conflicts identified`);
      if (blockingConflicts > 0) {
        reasoning.push(`${blockingConflicts} blocking conflicts require resolution`);
      }
      reasoning.push('Schedule optimized to minimize conflict impact');
    }

    return reasoning;
  }

  /**
   * Apply task interleaving optimization
   */
  private optimizeTaskInterleaving(
    recommendations: TaskSchedulingRecommendation[],
    residentSchedules: Map<string, ResidentSchedule>
  ): void {
    // Sort by start time
    recommendations.sort((a, b) => a.schedulingWindow.startTime - b.schedulingWindow.startTime);

    // Attempt to interleave tasks for better resource utilization
    recommendations.forEach((rec, index) => {
      if (index === 0) return;

      const prevRec = recommendations[index - 1];
      const timeGap = rec.schedulingWindow.startTime - prevRec.schedulingWindow.endTime;

      // If there's a significant gap, try to move this task earlier
      if (timeGap > 30 * 60 * 1000) { // 30 minutes
        const newStartTime = prevRec.schedulingWindow.endTime + (5 * 60 * 1000); // 5 min buffer
        const newEndTime = newStartTime + rec.schedulingWindow.duration;

        // Check if this creates conflicts (simplified check)
        const wouldConflict = recommendations.some(otherRec =>
          otherRec !== rec &&
          otherRec.schedulingWindow.startTime < newEndTime &&
          otherRec.schedulingWindow.endTime > newStartTime
        );

        if (!wouldConflict) {
          rec.schedulingWindow.startTime = newStartTime;
          rec.schedulingWindow.endTime = newEndTime;
          rec.reasoning.push('Task interleaved for better resource utilization');
        }
      }
    });
  }

  /**
   * Apply sustainability constraints
   */
  private applySustainabilityConstraints(
    recommendations: TaskSchedulingRecommendation[],
    villageState: VillageState
  ): void {
    // Ensure resource usage doesn't deplete critical resources
    const criticalResources = ['medicine', 'tools'];
    const sustainabilityBuffer = 0.2; // Keep 20% buffer

    recommendations.forEach(rec => {
      Object.entries(rec.task.requiredResources).forEach(([resource, amount]) => {
        if (criticalResources.includes(resource)) {
          const currentAmount = (villageState.resources || {})[resource] || 0;
          const totalCapacity = this.getResourceCapacity(resource);

          if (currentAmount - amount < totalCapacity * sustainabilityBuffer) {
            // Delay task to maintain sustainability
            rec.schedulingWindow.startTime += 2 * 60 * 60 * 1000; // 2 hours
            rec.schedulingWindow.endTime += 2 * 60 * 60 * 1000;
            rec.reasoning.push(`Delayed for resource sustainability (${resource})`);
          }
        }
      });
    });
  }

  /**
   * Optimize for work-life balance
   */
  private optimizeWorkLifeBalance(
    recommendations: TaskSchedulingRecommendation[],
    residentSchedules: Map<string, ResidentSchedule>
  ): void {
    // Avoid scheduling tasks during rest periods and ensure adequate breaks
    recommendations.forEach(rec => {
      const startHour = new Date(rec.schedulingWindow.startTime).getHours();

      // Prefer daytime scheduling (6 AM - 6 PM)
      if (startHour < 6 || startHour > 18) {
        // Try to move to daytime
        const dayAdjustment = startHour < 6 ? 6 - startHour : 30 - startHour; // Next day 6 AM
        rec.schedulingWindow.startTime += dayAdjustment * 60 * 60 * 1000;
        rec.schedulingWindow.endTime += dayAdjustment * 60 * 60 * 1000;
        rec.reasoning.push('Adjusted for work-life balance (daytime scheduling)');
      }
    });
  }

  /**
   * Score and rank recommendations
   */
  private scoreRecommendations(recommendations: TaskSchedulingRecommendation[]): void {
    recommendations.forEach(rec => {
      let score = 0;

      // Base score from task priority
      const priorityScore = rec.task.priority === 'critical' ? 100 :
                           rec.task.priority === 'high' ? 75 :
                           rec.task.priority === 'medium' ? 50 : 25;
      score += priorityScore * this.optimization.weights.taskUrgency;

      // Efficiency score (fewer conflicts = higher score)
      const efficiencyScore = Math.max(0, 100 - (rec.conflicts.length * 20));
      score += efficiencyScore * this.optimization.weights.resourceEfficiency;

      // Resident wellbeing score
      const wellbeingScore = rec.impact.efficiencyGain * 100;
      score += wellbeingScore * this.optimization.weights.residentWellbeing;

      // Speed score (earlier completion = higher score)
      const hoursFromNow = (rec.schedulingWindow.startTime - Date.now()) / (60 * 60 * 1000);
      const speedScore = Math.max(0, 100 - (hoursFromNow / 24) * 50); // Decay over 24 hours
      score += speedScore * this.optimization.weights.completionSpeed;

      // Store score in recommendation (as extension)
      (rec as any).score = score;
    });

    // Sort by score
    recommendations.sort((a, b) => (b as any).score - (a as any).score);
  }

  /**
   * Get resource capacity (simplified)
   */
  private getResourceCapacity(resource: string): number {
    const capacities = {
      food: 200,
      wood: 100,
      stone: 50,
      tools: 20,
      medicine: 10,
    };
    return capacities[resource as keyof typeof capacities] || 100;
  }

  /**
   * Update scheduling constraints
   */
  updateConstraints(constraints: Partial<SchedulingConstraints>): void {
    this.constraints = { ...this.constraints, ...constraints };
  }

  /**
   * Update optimization preferences
   */
  updateOptimization(optimization: Partial<SchedulingOptimization>): void {
    this.optimization = { ...this.optimization, ...optimization };
  }

  /**
   * Get current configuration
   */
  getConfig(): { constraints: SchedulingConstraints; optimization: SchedulingOptimization } {
    return {
      constraints: { ...this.constraints },
      optimization: { ...this.optimization },
    };
  }
}
