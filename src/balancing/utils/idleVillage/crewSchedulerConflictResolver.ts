/**
 * NP-023 – Idle Village Crew Scheduler Conflict Resolver
 * 
 * Core engine for detecting and resolving conflicts in crew scheduling.
 * Integrates with existing crew scheduler configuration and provides
 * configurable resolution strategies with actionable suggestions.
 */

import type { CrewSchedulerConfig } from '@/balancing/config/idleVillage/crewScheduler';
import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ConflictDefinition {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  description: string;
  affectedAssignments: string[]; // Assignment IDs
  detectedAt: number;
  metadata: Record<string, unknown>;
}

export type ConflictType = 
  | 'crew_limit_exceeded'
  | 'fatigue_overload'
  | 'skill_mismatch'
  | 'resource_conflict'
  | 'priority_inversion'
  | 'queue_overflow'
  | 'specialization_conflict';

export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ResolutionStrategy {
  id: string;
  name: string;
  description: string;
  applicableTypes: ConflictType[];
  applicableSeverities: ConflictSeverity[];
  priority: number; // Higher = preferred
  action: ResolutionAction;
  parameters: Record<string, unknown>;
}

export interface ResolutionAction {
  type: 'reassign' | 'delay' | 'split' | 'cancel' | 'modify_priority' | 'swap' | 'queue_rebalance';
  target: 'assignment' | 'queue' | 'resident' | 'activity';
  effect: string;
}

export interface ConflictSuggestion {
  id: string;
  conflictId: string;
  strategyId: string;
  description: string;
  impact: {
    assignmentsChanged: number;
    priorityShift: number;
    expectedResolution: number; // 0-1 confidence
  };
  steps: SuggestionStep[];
}

export interface SuggestionStep {
  action: string;
  target: string;
  parameters: Record<string, unknown>;
  expectedOutcome: string;
}

export interface ConflictResolverConfig {
  enabled: boolean;
  autoResolve: boolean;
  maxConcurrentResolutions: number;
  resolutionTimeout: number;
  strategies: ResolutionStrategy[];
  thresholds: {
    crewLimit: number;
    fatigueThreshold: number;
    skillMismatchThreshold: number;
    queueOverflowThreshold: number;
  };
  logging: boolean;
}

export interface ConflictAnalysis {
  totalConflicts: number;
  conflictsByType: Record<ConflictType, number>;
  conflictsBySeverity: Record<ConflictSeverity, number>;
  resolutionSuccess: number;
  averageResolutionTime: number;
  suggestionsGenerated: number;
  suggestionsApplied: number;
}

// ============================================================================
// Conflict Detection Engine
// ============================================================================

export class ConflictDetector {
  constructor(
    private config: CrewSchedulerConfig,
    private resolverConfig: ConflictResolverConfig
  ) {}

  /**
   * Analyze queue for conflicts
   */
  detectConflicts(queue: QueuedAssignment[]): ConflictDefinition[] {
    const conflicts: ConflictDefinition[] = [];
    const now = Date.now();

    // Check for crew limit conflicts
    conflicts.push(...this.detectCrewLimitConflicts(queue, now));

    // Check for fatigue overload conflicts
    conflicts.push(...this.detectFatigueConflicts(queue, now));

    // Check for skill mismatch conflicts
    conflicts.push(...this.detectSkillMismatchConflicts(queue, now));

    // Check for queue overflow
    conflicts.push(...this.detectQueueOverflowConflicts(queue, now));

    // Check for priority inversion
    conflicts.push(...this.detectPriorityInversionConflicts(queue, now));

    // Check for specialization conflicts
    conflicts.push(...this.detectSpecializationConflicts(queue, now));

    return conflicts;
  }

  private detectCrewLimitConflicts(queue: QueuedAssignment[], now: number): ConflictDefinition[] {
    const conflicts: ConflictDefinition[] = [];
    const residentAssignments = new Map<string, QueuedAssignment[]>();

    // Group assignments by resident
    queue.forEach(assignment => {
      const assignments = residentAssignments.get(assignment.residentId) || [];
      assignments.push(assignment);
      residentAssignments.set(assignment.residentId, assignments);
    });

    // Check crew limits
    residentAssignments.forEach((assignments, residentId) => {
      if (assignments.length > this.resolverConfig.thresholds.crewLimit) {
        conflicts.push({
          id: `crew_limit_${residentId}_${now}`,
          type: 'crew_limit_exceeded',
          severity: this.calculateSeverity(assignments.length - this.resolverConfig.thresholds.crewLimit),
          description: `Resident ${residentId} has ${assignments.length} assignments (limit: ${this.resolverConfig.thresholds.crewLimit})`,
          affectedAssignments: assignments.map(a => a.id),
          detectedAt: now,
          metadata: {
            residentId,
            assignmentCount: assignments.length,
            limit: this.resolverConfig.thresholds.crewLimit
          }
        });
      }
    });

    return conflicts;
  }

  private detectFatigueConflicts(queue: QueuedAssignment[], now: number): ConflictDefinition[] {
    const conflicts: ConflictDefinition[] = [];

    queue.forEach(assignment => {
      if (assignment.factors.fatigue > this.resolverConfig.thresholds.fatigueThreshold) {
        conflicts.push({
          id: `fatigue_${assignment.id}_${now}`,
          type: 'fatigue_overload',
          severity: this.calculateFatigueSeverity(assignment.factors.fatigue),
          description: `Assignment ${assignment.id} has high fatigue: ${(assignment.factors.fatigue * 100).toFixed(1)}%`,
          affectedAssignments: [assignment.id],
          detectedAt: now,
          metadata: {
            assignmentId: assignment.id,
            fatigueLevel: assignment.factors.fatigue,
            threshold: this.resolverConfig.thresholds.fatigueThreshold
          }
        });
      }
    });

    return conflicts;
  }

  private detectSkillMismatchConflicts(queue: QueuedAssignment[], now: number): ConflictDefinition[] {
    const conflicts: ConflictDefinition[] = [];

    queue.forEach(assignment => {
      if (assignment.factors.statTagMatch < this.resolverConfig.thresholds.skillMismatchThreshold) {
        conflicts.push({
          id: `skill_mismatch_${assignment.id}_${now}`,
          type: 'skill_mismatch',
          severity: this.calculateSkillMismatchSeverity(assignment.factors.statTagMatch),
          description: `Assignment ${assignment.id} has poor skill match: ${(assignment.factors.statTagMatch * 100).toFixed(1)}%`,
          affectedAssignments: [assignment.id],
          detectedAt: now,
          metadata: {
            assignmentId: assignment.id,
            skillMatch: assignment.factors.statTagMatch,
            threshold: this.resolverConfig.thresholds.skillMismatchThreshold
          }
        });
      }
    });

    return conflicts;
  }

  private detectQueueOverflowConflicts(queue: QueuedAssignment[], now: number): ConflictDefinition[] {
    const conflicts: ConflictDefinition[] = [];

    if (queue.length > this.resolverConfig.thresholds.queueOverflowThreshold) {
      conflicts.push({
        id: `queue_overflow_${now}`,
        type: 'queue_overflow',
        severity: this.calculateSeverity(queue.length - this.resolverConfig.thresholds.queueOverflowThreshold),
        description: `Queue has ${queue.length} assignments (threshold: ${this.resolverConfig.thresholds.queueOverflowThreshold})`,
        affectedAssignments: queue.map(a => a.id),
        detectedAt: now,
        metadata: {
          queueSize: queue.length,
          threshold: this.resolverConfig.thresholds.queueOverflowThreshold
        }
      });
    }

    return conflicts;
  }

  private detectPriorityInversionConflicts(queue: QueuedAssignment[], now: number): ConflictDefinition[] {
    const conflicts: ConflictDefinition[] = [];
    
    // Sort by timestamp to check arrival order vs priority
    const sortedByTimestamp = [...queue].sort((a, b) => a.timestamp - b.timestamp);
    const sortedByPriority = [...queue].sort((a, b) => b.priorityScore - a.priorityScore);

    // Check for significant priority inversions
    for (let i = 0; i < Math.min(sortedByTimestamp.length, 10); i++) {
      const earlyAssignment = sortedByTimestamp[i];
      const highPriorityAssignment = sortedByPriority[i];

      if (earlyAssignment.id !== highPriorityAssignment.id) {
        const priorityDiff = highPriorityAssignment.priorityScore - earlyAssignment.priorityScore;
        if (priorityDiff > this.config.thresholds.questUrgencyThreshold) {
          conflicts.push({
            id: `priority_inversion_${earlyAssignment.id}_${highPriorityAssignment.id}_${now}`,
            type: 'priority_inversion',
            severity: 'medium',
            description: `Priority inversion: ${earlyAssignment.id} arrived before ${highPriorityAssignment.id} but has lower priority`,
            affectedAssignments: [earlyAssignment.id, highPriorityAssignment.id],
            detectedAt: now,
            metadata: {
              earlyAssignment: earlyAssignment.id,
              highPriorityAssignment: highPriorityAssignment.id,
              priorityDiff
            }
          });
        }
      }
    }

    return conflicts;
  }

  private detectSpecializationConflicts(queue: QueuedAssignment[], now: number): ConflictDefinition[] {
    const conflicts: ConflictDefinition[] = [];
    const activityAssignments = new Map<string, QueuedAssignment[]>();

    // Group assignments by activity
    queue.forEach(assignment => {
      const assignments = activityAssignments.get(assignment.activityId) || [];
      assignments.push(assignment);
      activityAssignments.set(assignment.activityId, assignments);
    });

    // Check for too many low-specialization assignments on same activity
    activityAssignments.forEach((assignments, activityId) => {
      const lowSpecAssignments = assignments.filter(a => a.factors.specialization < 0.3);
      if (lowSpecAssignments.length > 2) {
        conflicts.push({
          id: `specialization_${activityId}_${now}`,
          type: 'specialization_conflict',
          severity: 'medium',
          description: `Activity ${activityId} has ${lowSpecAssignments.length} low-specialization assignments`,
          affectedAssignments: lowSpecAssignments.map(a => a.id),
          detectedAt: now,
          metadata: {
            activityId,
            lowSpecCount: lowSpecAssignments.length,
            totalAssignments: assignments.length
          }
        });
      }
    });

    return conflicts;
  }

  private calculateSeverity(overage: number): ConflictSeverity {
    if (overage >= 5) return 'critical';
    if (overage >= 3) return 'high';
    if (overage >= 1) return 'medium';
    return 'low';
  }

  private calculateFatigueSeverity(fatigue: number): ConflictSeverity {
    if (fatigue >= 0.9) return 'critical';
    if (fatigue >= 0.7) return 'high';
    if (fatigue >= 0.5) return 'medium';
    return 'low';
  }

  private calculateSkillMismatchSeverity(match: number): ConflictSeverity {
    if (match <= 0.1) return 'critical';
    if (match <= 0.3) return 'high';
    if (match <= 0.5) return 'medium';
    return 'low';
  }
}

// ============================================================================
// Resolution Strategy Engine
// ============================================================================

export class ResolutionEngine {
  constructor(private config: ConflictResolverConfig) {}

  /**
   * Generate resolution suggestions for detected conflicts
   */
  generateSuggestions(conflicts: ConflictDefinition[], queue: QueuedAssignment[]): ConflictSuggestion[] {
    const suggestions: ConflictSuggestion[] = [];

    conflicts.forEach(conflict => {
      const applicableStrategies = this.config.strategies.filter(
        strategy => 
          strategy.applicableTypes.includes(conflict.type) &&
          strategy.applicableSeverities.includes(conflict.severity)
      ).sort((a, b) => b.priority - a.priority);

      applicableStrategies.forEach((strategy, index) => {
        const suggestion = this.createSuggestion(conflict, strategy, queue, index);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      });
    });

    return suggestions;
  }

  private createSuggestion(
    conflict: ConflictDefinition, 
    strategy: ResolutionStrategy, 
    queue: QueuedAssignment[],
    index: number
  ): ConflictSuggestion | null {
    const suggestionId = `${conflict.id}_${strategy.id}_${index}`;
    
    switch (strategy.action.type) {
      case 'reassign':
        return this.createReassignSuggestion(suggestionId, conflict, strategy, queue);
      case 'delay':
        return this.createDelaySuggestion(suggestionId, conflict, strategy, queue);
      case 'modify_priority':
        return this.createPrioritySuggestion(suggestionId, conflict, strategy, queue);
      case 'queue_rebalance':
        return this.createRebalanceSuggestion(suggestionId, conflict, strategy, queue);
      default:
        return null;
    }
  }

  private createReassignSuggestion(
    id: string, 
    conflict: ConflictDefinition, 
    strategy: ResolutionStrategy,
    queue: QueuedAssignment[]
  ): ConflictSuggestion {
    const steps: SuggestionStep[] = [
      {
        action: 'find_alternative_resident',
        target: conflict.affectedAssignments[0],
        parameters: { excludeResidents: [conflict.metadata.residentId] },
        expectedOutcome: 'Find resident with better availability/skill match'
      },
      {
        action: 'reassign_task',
        target: conflict.affectedAssignments[0],
        parameters: { newResident: 'auto_select' },
        expectedOutcome: 'Move assignment to better suited resident'
      }
    ];

    return {
      id,
      conflictId: conflict.id,
      strategyId: strategy.id,
      description: `Reassign ${conflict.affectedAssignments.length} overloaded assignments to available residents`,
      impact: {
        assignmentsChanged: conflict.affectedAssignments.length,
        priorityShift: 0.1,
        expectedResolution: 0.8
      },
      steps
    };
  }

  private createDelaySuggestion(
    id: string,
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    _queue: QueuedAssignment[]
  ): ConflictSuggestion {
    const steps: SuggestionStep[] = [
      {
        action: 'delay_assignment',
        target: conflict.affectedAssignments[0],
        parameters: { delayMs: 300000 }, // 5 minutes
        expectedOutcome: 'Delay assignment to allow fatigue recovery'
      }
    ];

    return {
      id,
      conflictId: conflict.id,
      strategyId: strategy.id,
      description: `Delay ${conflict.affectedAssignments.length} high-fatigue assignments`,
      impact: {
        assignmentsChanged: conflict.affectedAssignments.length,
        priorityShift: -0.2,
        expectedResolution: 0.7
      },
      steps
    };
  }

  private createPrioritySuggestion(
    id: string,
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    _queue: QueuedAssignment[]
  ): ConflictSuggestion {
    const steps: SuggestionStep[] = [
      {
        action: 'adjust_priority',
        target: conflict.affectedAssignments[0],
        parameters: { priorityAdjustment: -0.5 },
        expectedOutcome: 'Lower priority to prevent queue blocking'
      }
    ];

    return {
      id,
      conflictId: conflict.id,
      strategyId: strategy.id,
      description: `Adjust priority for ${conflict.affectedAssignments.length} assignments to resolve inversion`,
      impact: {
        assignmentsChanged: conflict.affectedAssignments.length,
        priorityShift: -0.3,
        expectedResolution: 0.9
      },
      steps
    };
  }

  private createRebalanceSuggestion(
    id: string,
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    _queue: QueuedAssignment[]
  ): ConflictSuggestion {
    const steps: SuggestionStep[] = [
      {
        action: 'rebalance_queue',
        target: 'queue',
        parameters: { strategy: 'priority_first' },
        expectedOutcome: 'Reorder queue by priority and availability'
      }
    ];

    return {
      id,
      conflictId: conflict.id,
      strategyId: strategy.id,
      description: 'Rebalance entire queue to optimize assignment order',
      impact: {
        assignmentsChanged: _queue.length,
        priorityShift: 0.0,
        expectedResolution: 0.6
      },
      steps
    };
  }
}

// ============================================================================
// Main Conflict Resolver
// ============================================================================

export class CrewSchedulerConflictResolver {
  private detector: ConflictDetector;
  private resolutionEngine: ResolutionEngine;
  private analysis: ConflictAnalysis;

  constructor(
    private schedulerConfig: CrewSchedulerConfig,
    private resolverConfig: ConflictResolverConfig
  ) {
    this.detector = new ConflictDetector(schedulerConfig, resolverConfig);
    this.resolutionEngine = new ResolutionEngine(resolverConfig);
    this.analysis = this.initializeAnalysis();
  }

  /**
   * Analyze queue and generate conflict resolution suggestions
   */
  analyzeQueue(queue: QueuedAssignment[]): {
    conflicts: ConflictDefinition[];
    suggestions: ConflictSuggestion[];
    analysis: ConflictAnalysis;
  } {
    if (!this.resolverConfig.enabled) {
      return {
        conflicts: [],
        suggestions: [],
        analysis: this.analysis
      };
    }

    const conflicts = this.detector.detectConflicts(queue);
    const suggestions = this.resolutionEngine.generateSuggestions(conflicts, queue);
    
    this.updateAnalysis(conflicts, suggestions);

    return {
      conflicts,
      suggestions,
      analysis: this.analysis
    };
  }

  /**
   * Apply a resolution suggestion
   */
  async applySuggestion(
    suggestion: ConflictSuggestion,
    queue: QueuedAssignment[]
  ): Promise<{
    success: boolean;
    modifiedQueue: QueuedAssignment[];
    appliedSteps: string[];
    errors: string[];
  }> {
    const appliedSteps: string[] = [];
    const errors: string[] = [];
    let modifiedQueue = [...queue];

    try {
      for (const step of suggestion.steps) {
        const result = await this.executeStep(step, modifiedQueue);
        if (result.success) {
          modifiedQueue = result.modifiedQueue;
          appliedSteps.push(step.action);
        } else {
          errors.push(`Failed to execute ${step.action}: ${result.error}`);
        }
      }

      this.analysis.suggestionsApplied += appliedSteps.length;

      return {
        success: errors.length === 0,
        modifiedQueue,
        appliedSteps,
        errors
      };
    } catch (error) {
      return {
        success: false,
        modifiedQueue,
        appliedSteps,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  private async executeStep(
    step: SuggestionStep,
    queue: QueuedAssignment[]
  ): Promise<{
    success: boolean;
    modifiedQueue: QueuedAssignment[];
    error?: string;
  }> {
    // This would integrate with the actual crew scheduler
    // For now, return a mock implementation
    switch (step.action) {
      case 'delay_assignment':
        return this.delayAssignment(step.target, queue, step.parameters);
      case 'adjust_priority':
        return this.adjustPriority(step.target, queue, step.parameters);
      case 'rebalance_queue':
        return this.rebalanceQueue(queue, step.parameters);
      default:
        return {
          success: false,
          modifiedQueue: queue,
          error: `Unknown action: ${step.action}`
        };
    }
  }

  private delayAssignment(
    assignmentId: string,
    queue: QueuedAssignment[],
    parameters: Record<string, unknown>
  ): { success: boolean; modifiedQueue: QueuedAssignment[] } {
    const delayMs = parameters.delayMs as number || 300000;
    const modifiedQueue = queue.map(assignment => {
      if (assignment.id === assignmentId) {
        return {
          ...assignment,
          timestamp: assignment.timestamp + delayMs,
          priorityScore: assignment.priorityScore * 0.8 // Reduce priority
        };
      }
      return assignment;
    });

    return { success: true, modifiedQueue };
  }

  private adjustPriority(
    assignmentId: string,
    queue: QueuedAssignment[],
    parameters: Record<string, unknown>
  ): { success: boolean; modifiedQueue: QueuedAssignment[] } {
    const adjustment = parameters.priorityAdjustment as number || -0.5;
    const modifiedQueue = queue.map(assignment => {
      if (assignment.id === assignmentId) {
        return {
          ...assignment,
          priorityScore: Math.max(0, assignment.priorityScore + adjustment)
        };
      }
      return assignment;
    });

    return { success: true, modifiedQueue };
  }

  private rebalanceQueue(
    queue: QueuedAssignment[],
    parameters: Record<string, unknown>
  ): { success: boolean; modifiedQueue: QueuedAssignment[] } {
    const strategy = parameters.strategy as string || 'priority_first';
    
    const modifiedQueue = [...queue];
    
    switch (strategy) {
      case 'priority_first':
        modifiedQueue.sort((a, b) => b.priorityScore - a.priorityScore);
        break;
      case 'timestamp_first':
        modifiedQueue.sort((a, b) => a.timestamp - b.timestamp);
        break;
      default:
        break;
    }

    return { success: true, modifiedQueue };
  }

  private initializeAnalysis(): ConflictAnalysis {
    return {
      totalConflicts: 0,
      conflictsByType: {
        crew_limit_exceeded: 0,
        fatigue_overload: 0,
        skill_mismatch: 0,
        resource_conflict: 0,
        priority_inversion: 0,
        queue_overflow: 0,
        specialization_conflict: 0
      },
      conflictsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      resolutionSuccess: 0,
      averageResolutionTime: 0,
      suggestionsGenerated: 0,
      suggestionsApplied: 0
    };
  }

  private updateAnalysis(conflicts: ConflictDefinition[], suggestions: ConflictSuggestion[]): void {
    this.analysis.totalConflicts += conflicts.length;
    this.analysis.suggestionsGenerated += suggestions.length;

    conflicts.forEach(conflict => {
      this.analysis.conflictsByType[conflict.type]++;
      this.analysis.conflictsBySeverity[conflict.severity]++;
    });
  }

  /**
   * Get current analysis metrics
   */
  getAnalysis(): ConflictAnalysis {
    return { ...this.analysis };
  }

  /**
   * Reset analysis metrics
   */
  resetAnalysis(): void {
    this.analysis = this.initializeAnalysis();
  }
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_CONFLICT_RESOLVER_CONFIG: ConflictResolverConfig = {
  enabled: true,
  autoResolve: false,
  maxConcurrentResolutions: 3,
  resolutionTimeout: 30000,
  strategies: [
    {
      id: 'reassign_overload',
      name: 'Reassign Overloaded Crew',
      description: 'Move assignments from overloaded residents to available ones',
      applicableTypes: ['crew_limit_exceeded'],
      applicableSeverities: ['medium', 'high', 'critical'],
      priority: 100,
      action: {
        type: 'reassign',
        target: 'assignment',
        effect: 'Redistribute workload'
      },
      parameters: {
        maxReassignments: 3,
        preferLowFatigue: true
      }
    },
    {
      id: 'delay_fatigue',
      name: 'Delay Fatigued Assignments',
      description: 'Delay assignments for fatigued residents',
      applicableTypes: ['fatigue_overload'],
      applicableSeverities: ['medium', 'high', 'critical'],
      priority: 90,
      action: {
        type: 'delay',
        target: 'assignment',
        effect: 'Allow fatigue recovery'
      },
      parameters: {
        delayMs: 300000,
        fatigueThreshold: 0.7
      }
    },
    {
      id: 'fix_priority_inversion',
      name: 'Fix Priority Inversion',
      description: 'Adjust priorities to resolve inversion conflicts',
      applicableTypes: ['priority_inversion'],
      applicableSeverities: ['low', 'medium', 'high'],
      priority: 80,
      action: {
        type: 'modify_priority',
        target: 'assignment',
        effect: 'Correct priority ordering'
      },
      parameters: {
        adjustmentFactor: 0.5
      }
    },
    {
      id: 'queue_rebalance',
      name: 'Rebalance Queue',
      description: 'Reorder queue to optimize assignment flow',
      applicableTypes: ['queue_overflow', 'specialization_conflict'],
      applicableSeverities: ['medium', 'high', 'critical'],
      priority: 70,
      action: {
        type: 'queue_rebalance',
        target: 'queue',
        effect: 'Optimize queue ordering'
      },
      parameters: {
        strategy: 'priority_first'
      }
    },
    {
      id: 'skill_mismatch_reassign',
      name: 'Fix Skill Mismatch',
      description: 'Reassign poorly matched tasks to better suited residents',
      applicableTypes: ['skill_mismatch'],
      applicableSeverities: ['high', 'critical'],
      priority: 85,
      action: {
        type: 'reassign',
        target: 'assignment',
        effect: 'Improve skill matching'
      },
      parameters: {
        minSkillMatch: 0.6
      }
    }
  ],
  thresholds: {
    crewLimit: 3,
    fatigueThreshold: 0.6,
    skillMismatchThreshold: 0.4,
    queueOverflowThreshold: 20
  },
  logging: true
};
