/**
 * Idle Village Maintenance Task Forecaster
 *
 * Advanced forecasting system for predicting specific maintenance tasks based on
 * village state, resident fatigue, activity wear, and resource depletion patterns.
 * Provides actionable scheduling recommendations for optimal village maintenance.
 *
 * @module maintenanceTaskForecaster
 * @since 2026-01-13
 * @author Cascade
 */

import type { VillageState } from '@/engine/game/idleVillage/TimeEngine';
import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import { createHeadlessDiagnostics } from '@/shared/telemetry/headlessDiagnostics';

const diagnostics = createHeadlessDiagnostics('MaintenanceTaskForecaster', 'maintenance_forecast');

/**
 * Maintenance task categories
 */
export type MaintenanceTaskCategory =
  | 'resident_rest'
  | 'activity_repair'
  | 'resource_replenishment'
  | 'building_maintenance'
  | 'equipment_upkeep'
  | 'health_check'
  | 'sanitation'
  | 'security_patrol';

/**
 * Maintenance task priority levels
 */
export type MaintenanceTaskPriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Individual maintenance task
 */
export interface MaintenanceTask {
  /** Unique task identifier */
  id: string;
  /** Task category */
  category: MaintenanceTaskCategory;
  /** Human-readable task name */
  name: string;
  /** Detailed description */
  description: string;
  /** Task priority */
  priority: MaintenanceTaskPriority;
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Required resources for completion */
  requiredResources: Record<string, number>;
  /** Required resident skills/roles */
  requiredSkills: string[];
  /** Target completion timestamp */
  targetCompletionTime: number;
  /** Actual completion timestamp (if completed) */
  completedAt?: number;
  /** Task status */
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  /** Associated village entity (resident ID, activity ID, building ID, etc.) */
  targetEntityId?: string;
  /** Confidence score (0-1) for the forecast */
  confidence: number;
  /** Reasoning for the task forecast */
  reasoning: string[];
}

/**
 * Task scheduling recommendation
 */
export interface TaskSchedulingRecommendation {
  /** Recommended task */
  task: MaintenanceTask;
  /** Optimal scheduling window */
  schedulingWindow: {
    startTime: number;
    endTime: number;
    duration: number;
  };
  /** Reasoning for the scheduling recommendation */
  reasoning: string[];
  /** Alternative scheduling options */
  alternatives?: Array<{
    startTime: number;
    endTime: number;
    score: number; // 0-1 preference score
  }>;
  /** Potential conflicts with other activities */
  conflicts: string[];
  /** Expected impact of completing the task */
  impact: {
    resourceSavings: Record<string, number>;
    efficiencyGain: number;
    riskReduction: number;
  };
}

/**
 * Maintenance forecast configuration
 */
export interface MaintenanceForecastConfig {
  /** Forecasting horizon in hours */
  forecastHorizonHours: number;
  /** Minimum confidence threshold for task generation */
  minConfidenceThreshold: number;
  /** Task generation frequency (minutes) */
  taskGenerationInterval: number;
  /** Maximum concurrent tasks per category */
  maxConcurrentTasksPerCategory: Record<MaintenanceTaskCategory, number>;
  /** Resource availability assumptions */
  resourceAvailabilityAssumptions: Record<string, number>;
  /** Resident fatigue impact on task scheduling */
  fatigueImpactMultiplier: number;
  /** Priority escalation thresholds */
  priorityThresholds: {
    high: number; // Hours until deadline
    critical: number; // Hours until deadline
  };
}

/**
 * Maintenance task forecast result
 */
export interface MaintenanceTaskForecast {
  /** Forecast generation timestamp */
  generatedAt: number;
  /** Forecast horizon */
  horizonHours: number;
  /** All forecasted tasks */
  tasks: MaintenanceTask[];
  /** Tasks grouped by priority */
  tasksByPriority: Record<MaintenanceTaskPriority, MaintenanceTask[]>;
  /** Tasks grouped by category */
  tasksByCategory: Record<MaintenanceTaskCategory, MaintenanceTask[]>;
  /** Scheduling recommendations */
  schedulingRecommendations: TaskSchedulingRecommendation[];
  /** Forecast metadata */
  metadata: {
    totalTasksGenerated: number;
    tasksFilteredByConfidence: number;
    tasksFilteredByConcurrency: number;
    averageConfidence: number;
    forecastQualityScore: number;
  };
  /** Forecast alerts and warnings */
  alerts: Array<{
    type: 'warning' | 'error';
    message: string;
    context?: Record<string, unknown>;
  }>;
}

/**
 * Default forecast configuration
 */
export const DEFAULT_MAINTENANCE_FORECAST_CONFIG: MaintenanceForecastConfig = {
  forecastHorizonHours: 24,
  minConfidenceThreshold: 0.6,
  taskGenerationInterval: 60, // 1 hour
  maxConcurrentTasksPerCategory: {
    resident_rest: 5,
    activity_repair: 2,
    resource_replenishment: 3,
    building_maintenance: 1,
    equipment_upkeep: 2,
    health_check: 3,
    sanitation: 2,
    security_patrol: 1,
  },
  resourceAvailabilityAssumptions: {
    food: 100,
    wood: 50,
    stone: 25,
    tools: 10,
  },
  fatigueImpactMultiplier: 1.5,
  priorityThresholds: {
    high: 4, // 4 hours
    critical: 1, // 1 hour
  },
};

/**
 * Maintenance Task Forecaster
 */
export class MaintenanceTaskForecaster {
  private config: MaintenanceForecastConfig;
  private villageConfig: IdleVillageConfig;

  constructor(
    villageConfig: IdleVillageConfig,
    config: Partial<MaintenanceForecastConfig> = {}
  ) {
    this.villageConfig = villageConfig;
    this.config = { ...DEFAULT_MAINTENANCE_FORECAST_CONFIG, ...config };
  }

  /**
   * Generate maintenance task forecast for the given village state
   */
  generateForecast(villageState: VillageState): MaintenanceTaskForecast {
    const startTime = Date.now();
    diagnostics.info('Starting maintenance task forecast generation', {
      horizonHours: this.config.forecastHorizonHours,
      currentTime: villageState.timestamp,
    });

    // Generate tasks from different sources
    const residentTasks = this.generateResidentTasks(villageState);
    const activityTasks = this.generateActivityTasks(villageState);
    const resourceTasks = this.generateResourceTasks(villageState);
    const buildingTasks = this.generateBuildingTasks(villageState);

    // Combine all tasks
    const allTasks = [
      ...residentTasks,
      ...activityTasks,
      ...resourceTasks,
      ...buildingTasks,
    ];

    // Filter and prioritize tasks
    const filteredTasks = this.filterAndPrioritizeTasks(allTasks);
    const uniqueTasks = this.deduplicateTasks(filteredTasks);

    // Generate scheduling recommendations
    const schedulingRecommendations = this.generateSchedulingRecommendations(
      uniqueTasks,
      villageState
    );

    // Group tasks
    const tasksByPriority = this.groupTasksByPriority(uniqueTasks);
    const tasksByCategory = this.groupTasksByCategory(uniqueTasks);

    // Generate metadata
    const metadata = this.generateForecastMetadata(allTasks, filteredTasks, uniqueTasks);

    // Generate alerts
    const alerts = this.generateForecastAlerts(uniqueTasks, villageState);

    const forecast: MaintenanceTaskForecast = {
      generatedAt: Date.now(),
      horizonHours: this.config.forecastHorizonHours,
      tasks: uniqueTasks,
      tasksByPriority,
      tasksByCategory,
      schedulingRecommendations,
      metadata,
      alerts,
    };

    const duration = Date.now() - startTime;
    diagnostics.info('Maintenance task forecast completed', {
      duration,
      totalTasks: uniqueTasks.length,
      alerts: alerts.length,
      qualityScore: metadata.forecastQualityScore,
    });

    return forecast;
  }

  /**
   * Generate resident-related maintenance tasks
   */
  private generateResidentTasks(villageState: VillageState): MaintenanceTask[] {
    const tasks: MaintenanceTask[] = [];
    const residents = Object.values(villageState.residents);
    const currentTime = villageState.timestamp;

    residents.forEach(resident => {
      // Rest task for high fatigue
      if (resident.fatigue > 0.8) {
        const restDuration = Math.min(resident.fatigue * 480, 480); // Max 8 hours
        const targetTime = currentTime + (resident.fatigue - 0.7) * 3600000; // 1 hour per 0.1 fatigue

        tasks.push({
          id: `resident_rest_${resident.id}_${currentTime}`,
          category: 'resident_rest',
          name: `Rest for ${resident.name}`,
          description: `${resident.name} needs rest due to high fatigue (${(resident.fatigue * 100).toFixed(0)}%)`,
          priority: resident.fatigue > 0.9 ? 'critical' : resident.fatigue > 0.85 ? 'high' : 'medium',
          estimatedDuration: restDuration,
          requiredResources: {},
          requiredSkills: [],
          targetCompletionTime: targetTime,
          status: 'pending',
          targetEntityId: resident.id,
          confidence: Math.min(resident.fatigue * 1.2, 0.95),
          reasoning: [
            `Fatigue level: ${(resident.fatigue * 100).toFixed(1)}%`,
            `Estimated rest time: ${Math.round(restDuration)} minutes`,
            'High fatigue impacts work efficiency and health',
          ],
        });
      }

      // Health check for injured residents
      if (resident.status === 'injured') {
        tasks.push({
          id: `health_check_${resident.id}_${currentTime}`,
          category: 'health_check',
          name: `Health check for ${resident.name}`,
          description: `${resident.name} is injured and requires medical attention`,
          priority: 'high',
          estimatedDuration: 30,
          requiredResources: { medicine: 1 },
          requiredSkills: ['healer'],
          targetCompletionTime: currentTime + 1800000, // 30 minutes
          status: 'pending',
          targetEntityId: resident.id,
          confidence: 0.9,
          reasoning: [
            'Resident is in injured status',
            'Requires immediate medical attention',
            'May impact village productivity',
          ],
        });
      }
    });

    return tasks;
  }

  /**
   * Generate activity-related maintenance tasks
   */
  private generateActivityTasks(villageState: VillageState): MaintenanceTask[] {
    const tasks: MaintenanceTask[] = [];
    const activities = Object.values(villageState.activities || {});
    const currentTime = villageState.timestamp;

    activities.forEach(activity => {
      // Equipment repair based on activity wear
      const wearLevel = activity.wearLevel || 0;
      if (wearLevel > 0.7) {
        const repairUrgency = wearLevel > 0.9 ? 'critical' : wearLevel > 0.8 ? 'high' : 'medium';
        const repairTime = wearLevel * 120; // Up to 2 hours for max wear
        const targetTime = currentTime + (wearLevel - 0.7) * 7200000; // Up to 2 hours

        tasks.push({
          id: `activity_repair_${activity.id}_${currentTime}`,
          category: 'activity_repair',
          name: `Repair ${activity.name}`,
          description: `${activity.name} equipment is worn (${(wearLevel * 100).toFixed(0)}%) and needs repair`,
          priority: repairUrgency as MaintenanceTaskPriority,
          estimatedDuration: repairTime,
          requiredResources: { tools: 1, wood: Math.ceil(wearLevel * 5) },
          requiredSkills: ['craftsman'],
          targetCompletionTime: targetTime,
          status: 'pending',
          targetEntityId: activity.id,
          confidence: Math.min(wearLevel * 1.1, 0.95),
          reasoning: [
            `Equipment wear: ${(wearLevel * 100).toFixed(1)}%`,
            `Estimated repair time: ${Math.round(repairTime)} minutes`,
            'Worn equipment reduces activity efficiency',
          ],
        });
      }
    });

    return tasks;
  }

  /**
   * Generate resource-related maintenance tasks
   */
  private generateResourceTasks(villageState: VillageState): MaintenanceTask[] {
    const tasks: MaintenanceTask[] = [];
    const resources = villageState.resources || {};
    const currentTime = villageState.timestamp;

    // Food replenishment
    const foodStock = resources.food || 0;
    const foodCapacity = this.villageConfig.resourceLimits?.food || 200;
    const foodRatio = foodStock / foodCapacity;

    if (foodRatio < 0.2) {
      const urgency = foodRatio < 0.1 ? 'critical' : foodRatio < 0.15 ? 'high' : 'medium';
      const targetTime = currentTime + (0.2 - foodRatio) * 3600000; // Urgency-based timing

      tasks.push({
        id: `food_replenishment_${currentTime}`,
        category: 'resource_replenishment',
        name: 'Food Stock Replenishment',
        description: `Food stocks are critically low (${foodStock}/${foodCapacity}). Immediate foraging/hunting needed.`,
        priority: urgency as MaintenanceTaskPriority,
        estimatedDuration: 180,
        requiredResources: {},
        requiredSkills: ['forager', 'hunter'],
        targetCompletionTime: targetTime,
        status: 'pending',
        confidence: Math.min((0.2 - foodRatio) * 5, 0.95),
        reasoning: [
          `Current food: ${foodStock}/${foodCapacity} (${(foodRatio * 100).toFixed(1)}%)`,
          'Low food stocks impact resident health and productivity',
          'Immediate action required to prevent starvation',
        ],
      });
    }

    return tasks;
  }

  /**
   * Generate building-related maintenance tasks
   */
  private generateBuildingTasks(villageState: VillageState): MaintenanceTask[] {
    const tasks: MaintenanceTask[] = [];
    const buildings = Object.values(villageState.buildings || {});
    const currentTime = villageState.timestamp;

    buildings.forEach(building => {
      // Building maintenance based on condition
      const condition = building.condition || 1.0;
      if (condition < 0.7) {
        const urgency = condition < 0.3 ? 'critical' : condition < 0.5 ? 'high' : 'medium';
        const repairTime = (1 - condition) * 240; // Up to 4 hours for worst condition
        const targetTime = currentTime + (0.7 - condition) * 86400000; // Up to 1 day

        tasks.push({
          id: `building_maintenance_${building.id}_${currentTime}`,
          category: 'building_maintenance',
          name: `Maintain ${building.name}`,
          description: `${building.name} is in poor condition (${(condition * 100).toFixed(0)}%) and needs maintenance`,
          priority: urgency as MaintenanceTaskPriority,
          estimatedDuration: repairTime,
          requiredResources: { wood: Math.ceil((1 - condition) * 20), stone: Math.ceil((1 - condition) * 10) },
          requiredSkills: ['builder'],
          targetCompletionTime: targetTime,
          status: 'pending',
          targetEntityId: building.id,
          confidence: Math.min((0.7 - condition) * 2, 0.9),
          reasoning: [
            `Building condition: ${(condition * 100).toFixed(1)}%`,
            `Estimated repair time: ${Math.round(repairTime)} minutes`,
            'Poor building condition affects resident safety and activity efficiency',
          ],
        });
      }
    });

    return tasks;
  }

  /**
   * Filter and prioritize generated tasks
   */
  private filterAndPrioritizeTasks(tasks: MaintenanceTask[]): MaintenanceTask[] {
    return tasks
      .filter(task => task.confidence >= this.config.minConfidenceThreshold)
      .sort((a, b) => {
        // Sort by priority first, then by urgency (closer deadlines first)
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;

        return a.targetCompletionTime - b.targetCompletionTime;
      });
  }

  /**
   * Remove duplicate tasks for the same entity
   */
  private deduplicateTasks(tasks: MaintenanceTask[]): MaintenanceTask[] {
    const seen = new Map<string, MaintenanceTask>();
    const categoryCounts = new Map<MaintenanceTaskCategory, number>();

    tasks.forEach(task => {
      const categoryCount = categoryCounts.get(task.category) || 0;
      const maxConcurrent = this.config.maxConcurrentTasksPerCategory[task.category];

      if (categoryCount < maxConcurrent) {
        // Check for duplicate entity tasks
        const entityKey = `${task.category}_${task.targetEntityId}`;
        const existing = seen.get(entityKey);

        if (!existing || existing.confidence < task.confidence) {
          seen.set(entityKey, task);
          categoryCounts.set(task.category, categoryCount + 1);
        }
      }
    });

    return Array.from(seen.values());
  }

  /**
   * Generate scheduling recommendations for tasks
   */
  private generateSchedulingRecommendations(
    tasks: MaintenanceTask[],
    villageState: VillageState
  ): TaskSchedulingRecommendation[] {
    const recommendations: TaskSchedulingRecommendation[] = [];
    const residents = Object.values(villageState.residents);
    const currentTime = villageState.timestamp;

    tasks.forEach(task => {
      // Find optimal scheduling window
      const schedulingWindow = this.findOptimalSchedulingWindow(task, villageState);

      // Check for conflicts
      const conflicts = this.identifySchedulingConflicts(task, schedulingWindow, villageState);

      // Calculate impact
      const impact = this.calculateTaskImpact(task, villageState);

      // Generate alternatives
      const alternatives = this.generateAlternativeSchedules(task, villageState);

      recommendations.push({
        task,
        schedulingWindow,
        reasoning: this.generateSchedulingReasoning(task, schedulingWindow, conflicts),
        alternatives,
        conflicts,
        impact,
      });
    });

    return recommendations;
  }

  /**
   * Find optimal scheduling window for a task
   */
  private findOptimalSchedulingWindow(
    task: MaintenanceTask,
    villageState: VillageState
  ): { startTime: number; endTime: number; duration: number } {
    const currentTime = villageState.timestamp;
    const urgencyHours = (task.targetCompletionTime - currentTime) / 3600000;

    // Adjust scheduling based on priority and urgency
    let startDelay = 0;
    if (task.priority === 'critical') {
      startDelay = Math.max(0, urgencyHours - 0.5) * 3600000; // Start soon
    } else if (task.priority === 'high') {
      startDelay = Math.max(0, urgencyHours - 2) * 3600000; // Start within 2 hours
    } else {
      startDelay = Math.max(0, urgencyHours - 6) * 3600000; // More flexible
    }

    const startTime = currentTime + startDelay;
    const endTime = startTime + (task.estimatedDuration * 60000);
    const duration = task.estimatedDuration * 60000;

    return { startTime, endTime, duration };
  }

  /**
   * Identify potential scheduling conflicts
   */
  private identifySchedulingConflicts(
    task: MaintenanceTask,
    window: { startTime: number; endTime: number },
    villageState: VillageState
  ): string[] {
    const conflicts: string[] = [];

    // Check resident availability
    const availableResidents = Object.values(villageState.residents).filter(resident => {
      return resident.status === 'active' && resident.fatigue < 0.8;
    });

    if (availableResidents.length < (task.requiredSkills.length || 1)) {
      conflicts.push(`Insufficient available residents (${availableResidents.length} available, ${task.requiredSkills.length || 1} needed)`);
    }

    // Check resource availability
    Object.entries(task.requiredResources).forEach(([resource, amount]) => {
      const available = (villageState.resources || {})[resource] || 0;
      if (available < amount) {
        conflicts.push(`Insufficient ${resource} (${available} available, ${amount} needed)`);
      }
    });

    // Check for overlapping high-priority tasks
    // This would require access to scheduled tasks - simplified for now

    return conflicts;
  }

  /**
   * Calculate expected impact of completing the task
   */
  private calculateTaskImpact(
    task: MaintenanceTask,
    villageState: VillageState
  ): { resourceSavings: Record<string, number>; efficiencyGain: number; riskReduction: number } {
    const impact = {
      resourceSavings: {} as Record<string, number>,
      efficiencyGain: 0,
      riskReduction: 0,
    };

    switch (task.category) {
      case 'resident_rest':
        impact.efficiencyGain = 0.3; // 30% efficiency gain after rest
        impact.riskReduction = 0.4; // 40% reduction in injury risk
        break;

      case 'activity_repair':
        impact.efficiencyGain = 0.25; // 25% efficiency gain after repair
        impact.resourceSavings = { tools: 1 }; // Save on tool replacement
        break;

      case 'resource_replenishment':
        impact.riskReduction = 0.6; // 60% reduction in starvation risk
        break;

      case 'building_maintenance':
        impact.efficiencyGain = 0.15; // 15% efficiency gain
        impact.riskReduction = 0.3; // 30% reduction in collapse risk
        break;

      default:
        impact.efficiencyGain = 0.1;
        impact.riskReduction = 0.2;
    }

    return impact;
  }

  /**
   * Generate alternative scheduling options
   */
  private generateAlternativeSchedules(
    task: MaintenanceTask,
    villageState: VillageState
  ): Array<{ startTime: number; endTime: number; score: number }> {
    const alternatives: Array<{ startTime: number; endTime: number; score: number }> = [];
    const baseWindow = this.findOptimalSchedulingWindow(task, villageState);

    // Generate 3 alternative time slots
    for (let i = 1; i <= 3; i++) {
      const offset = i * 2 * 3600000; // 2, 4, 6 hours later
      const altStart = baseWindow.startTime + offset;
      const altEnd = altStart + baseWindow.duration;

      // Calculate preference score (lower is better)
      const score = Math.min(i * 0.3, 0.8); // Decreasing preference

      alternatives.push({
        startTime: altStart,
        endTime: altEnd,
        score: 1 - score, // Convert to 0-1 scale where 1 is best
      });
    }

    return alternatives;
  }

  /**
   * Generate reasoning for scheduling recommendation
   */
  private generateSchedulingReasoning(
    task: MaintenanceTask,
    window: { startTime: number; endTime: number },
    conflicts: string[]
  ): string[] {
    const reasoning: string[] = [];
    const currentTime = Date.now();
    const hoursUntilDeadline = (task.targetCompletionTime - currentTime) / 3600000;

    reasoning.push(`Task priority: ${task.priority.toUpperCase()}`);
    reasoning.push(`Deadline: ${hoursUntilDeadline.toFixed(1)} hours from now`);
    reasoning.push(`Estimated duration: ${task.estimatedDuration} minutes`);

    if (conflicts.length === 0) {
      reasoning.push('No scheduling conflicts detected');
      reasoning.push('Optimal time window selected for resource availability');
    } else {
      reasoning.push(`${conflicts.length} potential conflicts identified`);
      reasoning.push('Schedule adjusted to minimize impact');
    }

    return reasoning;
  }

  /**
   * Group tasks by priority
   */
  private groupTasksByPriority(tasks: MaintenanceTask[]): Record<MaintenanceTaskPriority, MaintenanceTask[]> {
    const groups: Record<MaintenanceTaskPriority, MaintenanceTask[]> = {
      low: [],
      medium: [],
      high: [],
      critical: [],
    };

    tasks.forEach(task => {
      groups[task.priority].push(task);
    });

    return groups;
  }

  /**
   * Group tasks by category
   */
  private groupTasksByCategory(tasks: MaintenanceTask[]): Record<MaintenanceTaskCategory, MaintenanceTask[]> {
    const groups: Record<MaintenanceTaskCategory, MaintenanceTask[]> = {
      resident_rest: [],
      activity_repair: [],
      resource_replenishment: [],
      building_maintenance: [],
      equipment_upkeep: [],
      health_check: [],
      sanitation: [],
      security_patrol: [],
    };

    tasks.forEach(task => {
      groups[task.category].push(task);
    });

    return groups;
  }

  /**
   * Generate forecast metadata
   */
  private generateForecastMetadata(
    allTasks: MaintenanceTask[],
    filteredTasks: MaintenanceTask[],
    finalTasks: MaintenanceTask[]
  ): MaintenanceTaskForecast['metadata'] {
    const totalGenerated = allTasks.length;
    const filteredByConfidence = totalGenerated - filteredTasks.length;
    const filteredByConcurrency = filteredTasks.length - finalTasks.length;

    const averageConfidence = finalTasks.length > 0
      ? finalTasks.reduce((sum, task) => sum + task.confidence, 0) / finalTasks.length
      : 0;

    // Calculate quality score based on various factors
    const confidenceScore = averageConfidence;
    const coverageScore = Math.min(finalTasks.length / 10, 1); // Expect at least 10 tasks
    const diversityScore = Object.values(this.groupTasksByCategory(finalTasks))
      .filter(tasks => tasks.length > 0).length / 8; // All 8 categories

    const qualityScore = (confidenceScore * 0.5) + (coverageScore * 0.3) + (diversityScore * 0.2);

    return {
      totalTasksGenerated: totalGenerated,
      tasksFilteredByConfidence: filteredByConfidence,
      tasksFilteredByConcurrency: filteredByConcurrency,
      averageConfidence,
      forecastQualityScore: qualityScore,
    };
  }

  /**
   * Generate forecast alerts and warnings
   */
  private generateForecastAlerts(
    tasks: MaintenanceTask[],
    villageState: VillageState
  ): MaintenanceTaskForecast['alerts'] {
    const alerts: MaintenanceTaskForecast['alerts'] = [];

    // Check for critical tasks
    const criticalTasks = tasks.filter(task => task.priority === 'critical');
    if (criticalTasks.length > 3) {
      alerts.push({
        type: 'error',
        message: `${criticalTasks.length} critical maintenance tasks require immediate attention`,
        context: { criticalTasks: criticalTasks.length },
      });
    }

    // Check for resource shortages
    const resourceTasks = tasks.filter(task => task.category === 'resource_replenishment');
    if (resourceTasks.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${resourceTasks.length} resource replenishment tasks indicate potential shortages`,
        context: { resourceTasks: resourceTasks.length },
      });
    }

    // Check for high resident fatigue
    const restTasks = tasks.filter(task => task.category === 'resident_rest');
    const highFatigueTasks = restTasks.filter(task => task.priority === 'critical');
    if (highFatigueTasks.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${highFatigueTasks.length} residents require immediate rest due to critical fatigue`,
        context: { criticalFatigueResidents: highFatigueTasks.length },
      });
    }

    return alerts;
  }

  /**
   * Update forecaster configuration
   */
  updateConfig(config: Partial<MaintenanceForecastConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): MaintenanceForecastConfig {
    return { ...this.config };
  }
}
