/**
 * NP-023 – Idle Village Crew Scheduler Resolution Strategies
 * 
 * Configurable resolution strategies for different types of crew scheduling conflicts.
 * Each strategy defines how to resolve conflicts with specific actions and parameters.
 */

import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import type { ConflictDefinition, ConflictType, ConflictSeverity } from './crewSchedulerConflictResolver';

// ============================================================================
// Resolution Strategy Interfaces
// ============================================================================

export interface ResolutionStrategyConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  priority: number;
  applicableTypes: ConflictType[];
  applicableSeverities: ConflictSeverity[];
  action: ResolutionActionConfig;
  parameters: ResolutionParameters;
  conditions: ResolutionConditions;
  effects: ResolutionEffects;
}

export interface ResolutionActionConfig {
  type: 'reassign' | 'delay' | 'split' | 'cancel' | 'modify_priority' | 'swap' | 'queue_rebalance';
  target: 'assignment' | 'queue' | 'resident' | 'activity';
  effect: string;
  implementation: string; // Reference to implementation function
}

export interface ResolutionParameters {
  [key: string]: unknown;
}

export interface ResolutionConditions {
  maxAssignments?: number;
  minPriority?: number;
  maxFatigue?: number;
  minSkillMatch?: number;
  timeConstraints?: {
    maxDelay?: number;
    minAdvance?: number;
  };
  resourceConstraints?: {
    maxReassignments?: number;
    requireAvailableResident?: boolean;
  };
}

export interface ResolutionEffects {
  expectedImpact: {
    priorityShift: number;
    fatigueChange: number;
    efficiencyChange: number;
  };
  sideEffects: string[];
  risks: string[];
}

export interface ResolutionResult {
  success: boolean;
  strategyId: string;
  appliedActions: AppliedAction[];
  modifiedQueue: QueuedAssignment[];
  impact: ResolutionImpact;
  errors: string[];
  warnings: string[];
}

export interface AppliedAction {
  type: string;
  target: string;
  parameters: ResolutionParameters;
  result: 'success' | 'partial' | 'failed';
  outcome: string;
  timestamp: number;
}

export interface ResolutionImpact {
  assignmentsChanged: number;
  priorityShift: number;
  fatigueReduction: number;
  efficiencyGain: number;
  conflictsResolved: number;
  newConflictsCreated: number;
}

// ============================================================================
// Base Resolution Strategy Implementation
// ============================================================================

export abstract class BaseResolutionStrategy {
  protected config: ResolutionStrategyConfig;

  constructor(config: ResolutionStrategyConfig) {
    this.config = config;
  }

  abstract execute(
    conflict: ConflictDefinition,
    queue: QueuedAssignment[],
    context: ResolutionContext
  ): Promise<ResolutionResult>;

  protected validateConditions(
    conflict: ConflictDefinition,
    queue: QueuedAssignment[],
    _context: ResolutionContext
  ): boolean {
    const conditions = this.config.conditions;

    // Check assignment count
    if (conditions.maxAssignments && conflict.affectedAssignments.length > conditions.maxAssignments) {
      return false;
    }

    // Check priority constraints
    if (conditions.minPriority) {
      const assignments = queue.filter(a => conflict.affectedAssignments.includes(a.id));
      if (assignments.some(a => a.priorityScore < conditions.minPriority!)) {
        return false;
      }
    }

    // Check fatigue constraints
    if (conditions.maxFatigue) {
      const assignments = queue.filter(a => conflict.affectedAssignments.includes(a.id));
      if (assignments.some(a => a.factors.fatigue > conditions.maxFatigue!)) {
        return false;
      }
    }

    // Check skill match constraints
    if (conditions.minSkillMatch) {
      const assignments = queue.filter(a => conflict.affectedAssignments.includes(a.id));
      if (assignments.some(a => a.factors.statTagMatch < conditions.minSkillMatch!)) {
        return false;
      }
    }

    return true;
  }

  protected calculateImpact(
    originalQueue: QueuedAssignment[],
    modifiedQueue: QueuedAssignment[],
    appliedActions: AppliedAction[]
  ): ResolutionImpact {
    return {
      assignmentsChanged: appliedActions.length,
      priorityShift: this.calculatePriorityShift(originalQueue, modifiedQueue),
      fatigueReduction: this.calculateFatigueReduction(originalQueue, modifiedQueue),
      efficiencyGain: this.calculateEfficiencyGain(originalQueue, modifiedQueue),
      conflictsResolved: appliedActions.filter(a => a.result === 'success').length,
      newConflictsCreated: 0 // Would be calculated by conflict detector
    };
  }

  private calculatePriorityShift(original: QueuedAssignment[], modified: QueuedAssignment[]): number {
    const originalAvg = this.calculateAveragePriority(original);
    const modifiedAvg = this.calculateAveragePriority(modified);
    return modifiedAvg - originalAvg;
  }

  private calculateFatigueReduction(original: QueuedAssignment[], modified: QueuedAssignment[]): number {
    const originalAvg = this.calculateAverageFatigue(original);
    const modifiedAvg = this.calculateAverageFatigue(modified);
    return originalAvg - modifiedAvg;
  }

  private calculateEfficiencyGain(original: QueuedAssignment[], modified: QueuedAssignment[]): number {
    const originalAvg = this.calculateAverageSkillMatch(original);
    const modifiedAvg = this.calculateAverageSkillMatch(modified);
    return modifiedAvg - originalAvg;
  }

  private calculateAveragePriority(queue: QueuedAssignment[]): number {
    if (queue.length === 0) return 0;
    const sum = queue.reduce((acc, a) => acc + a.priorityScore, 0);
    return sum / queue.length;
  }

  private calculateAverageFatigue(queue: QueuedAssignment[]): number {
    if (queue.length === 0) return 0;
    const sum = queue.reduce((acc, a) => acc + a.factors.fatigue, 0);
    return sum / queue.length;
  }

  private calculateAverageSkillMatch(queue: QueuedAssignment[]): number {
    if (queue.length === 0) return 0;
    const sum = queue.reduce((acc, a) => acc + a.factors.statTagMatch, 0);
    return sum / queue.length;
  }
}

// ============================================================================
// Reassignment Strategy
// ============================================================================

export class ReassignmentStrategy extends BaseResolutionStrategy {
  async execute(
    conflict: ConflictDefinition,
    queue: QueuedAssignment[],
    context: ResolutionContext
  ): Promise<ResolutionResult> {
    const appliedActions: AppliedAction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let modifiedQueue = [...queue];

    if (!this.validateConditions(conflict, queue, context)) {
      return {
        success: false,
        strategyId: this.config.id,
        appliedActions,
        modifiedQueue,
        impact: this.calculateImpact(queue, modifiedQueue, appliedActions),
        errors: ['Strategy conditions not met'],
        warnings
      };
    }

    const maxReassignments = this.config.parameters.maxReassignments as number || 3;
    const preferLowFatigue = this.config.parameters.preferLowFatigue as boolean || true;

    for (const assignmentId of conflict.affectedAssignments.slice(0, maxReassignments)) {
      const assignment = queue.find(a => a.id === assignmentId);
      if (!assignment) {
        errors.push(`Assignment ${assignmentId} not found`);
        continue;
      }

      const alternativeResident = this.findAlternativeResident(
        assignment,
        modifiedQueue,
        context,
        preferLowFatigue
      );

      if (alternativeResident) {
        const actionResult = await this.reassignAssignment(
          assignment,
          alternativeResident,
          modifiedQueue
        );
        
        appliedActions.push(actionResult);
        if (actionResult.result === 'success') {
          modifiedQueue = actionResult.modifiedQueue;
        } else {
          errors.push(actionResult.outcome);
        }
      } else {
        warnings.push(`No alternative resident found for assignment ${assignmentId}`);
      }
    }

    return {
      success: errors.length === 0,
      strategyId: this.config.id,
      appliedActions,
      modifiedQueue,
      impact: this.calculateImpact(queue, modifiedQueue, appliedActions),
      errors,
      warnings
    };
  }

  private findAlternativeResident(
    assignment: QueuedAssignment,
    queue: QueuedAssignment[],
    context: ResolutionContext,
    preferLowFatigue: boolean
  ): string | null {
    const availableResidents = context.availableResidents.filter(
      resident => resident.id !== assignment.residentId
    );

    if (availableResidents.length === 0) return null;

    // Sort by preference
    availableResidents.sort((a, b) => {
      if (preferLowFatigue) {
        return a.fatigue - b.fatigue;
      }
      return b.skillLevel - a.skillLevel;
    });

    return availableResidents[0].id;
  }

  private async reassignAssignment(
    assignment: QueuedAssignment,
    newResidentId: string,
    queue: QueuedAssignment[]
  ): Promise<AppliedAction & { modifiedQueue: QueuedAssignment[] }> {
    const modifiedQueue = queue.map(a => {
      if (a.id === assignment.id) {
        return {
          ...a,
          residentId: newResidentId,
          timestamp: Date.now(),
          priorityScore: a.priorityScore * 0.9 // Slightly reduce priority for reassignment
        };
      }
      return a;
    });

    return {
      type: 'reassign',
      target: assignment.id,
      parameters: { newResidentId },
      result: 'success',
      outcome: `Reassigned to resident ${newResidentId}`,
      timestamp: Date.now(),
      modifiedQueue
    };
  }
}

// ============================================================================
// Delay Strategy
// ============================================================================

export class DelayStrategy extends BaseResolutionStrategy {
  async execute(
    conflict: ConflictDefinition,
    queue: QueuedAssignment[],
    context: ResolutionContext
  ): Promise<ResolutionResult> {
    const appliedActions: AppliedAction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let modifiedQueue = [...queue];

    if (!this.validateConditions(conflict, queue, context)) {
      return {
        success: false,
        strategyId: this.config.id,
        appliedActions,
        modifiedQueue,
        impact: this.calculateImpact(queue, modifiedQueue, appliedActions),
        errors: ['Strategy conditions not met'],
        warnings
      };
    }

    const delayMs = this.config.parameters.delayMs as number || 300000; // 5 minutes default
    const fatigueThreshold = this.config.parameters.fatigueThreshold as number || 0.7;

    for (const assignmentId of conflict.affectedAssignments) {
      const assignment = queue.find(a => a.id === assignmentId);
      if (!assignment) {
        errors.push(`Assignment ${assignmentId} not found`);
        continue;
      }

      if (assignment.factors.fatigue >= fatigueThreshold) {
        const actionResult = await this.delayAssignment(assignment, delayMs, modifiedQueue);
        
        appliedActions.push(actionResult);
        if (actionResult.result === 'success') {
          modifiedQueue = actionResult.modifiedQueue;
        } else {
          errors.push(actionResult.outcome);
        }
      } else {
        warnings.push(`Assignment ${assignmentId} fatigue below threshold`);
      }
    }

    return {
      success: errors.length === 0,
      strategyId: this.config.id,
      appliedActions,
      modifiedQueue,
      impact: this.calculateImpact(queue, modifiedQueue, appliedActions),
      errors,
      warnings
    };
  }

  private async delayAssignment(
    assignment: QueuedAssignment,
    delayMs: number,
    queue: QueuedAssignment[]
  ): Promise<AppliedAction & { modifiedQueue: QueuedAssignment[] }> {
    const modifiedQueue = queue.map(a => {
      if (a.id === assignment.id) {
        return {
          ...a,
          timestamp: a.timestamp + delayMs,
          priorityScore: a.priorityScore * 0.8 // Reduce priority for delayed assignment
        };
      }
      return a;
    });

    return {
      type: 'delay',
      target: assignment.id,
      parameters: { delayMs },
      result: 'success',
      outcome: `Delayed by ${delayMs}ms`,
      timestamp: Date.now(),
      modifiedQueue
    };
  }
}

// ============================================================================
// Priority Adjustment Strategy
// ============================================================================

export class PriorityAdjustmentStrategy extends BaseResolutionStrategy {
  async execute(
    conflict: ConflictDefinition,
    queue: QueuedAssignment[],
    context: ResolutionContext
  ): Promise<ResolutionResult> {
    const appliedActions: AppliedAction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let modifiedQueue = [...queue];

    if (!this.validateConditions(conflict, queue, context)) {
      return {
        success: false,
        strategyId: this.config.id,
        appliedActions,
        modifiedQueue,
        impact: this.calculateImpact(queue, modifiedQueue, appliedActions),
        errors: ['Strategy conditions not met'],
        warnings
      };
    }

    const adjustmentFactor = this.config.parameters.adjustmentFactor as number || 0.5;

    for (const assignmentId of conflict.affectedAssignments) {
      const assignment = queue.find(a => a.id === assignmentId);
      if (!assignment) {
        errors.push(`Assignment ${assignmentId} not found`);
        continue;
      }

      const actionResult = await this.adjustPriority(assignment, adjustmentFactor, modifiedQueue);
      
      appliedActions.push(actionResult);
      if (actionResult.result === 'success') {
        modifiedQueue = actionResult.modifiedQueue;
      } else {
        errors.push(actionResult.outcome);
      }
    }

    return {
      success: errors.length === 0,
      strategyId: this.config.id,
      appliedActions,
      modifiedQueue,
      impact: this.calculateImpact(queue, modifiedQueue, appliedActions),
      errors,
      warnings
    };
  }

  private async adjustPriority(
    assignment: QueuedAssignment,
    adjustmentFactor: number,
    queue: QueuedAssignment[]
  ): Promise<AppliedAction & { modifiedQueue: QueuedAssignment[] }> {
    const newPriority = Math.max(0, assignment.priorityScore - adjustmentFactor);
    const modifiedQueue = queue.map(a => {
      if (a.id === assignment.id) {
        return {
          ...a,
          priorityScore: newPriority
        };
      }
      return a;
    });

    return {
      type: 'modify_priority',
      target: assignment.id,
      parameters: { adjustmentFactor, newPriority },
      result: 'success',
      outcome: `Priority adjusted from ${assignment.priorityScore.toFixed(2)} to ${newPriority.toFixed(2)}`,
      timestamp: Date.now(),
      modifiedQueue
    };
  }
}

// ============================================================================
// Queue Rebalancing Strategy
// ============================================================================

export class QueueRebalancingStrategy extends BaseResolutionStrategy {
  async execute(
    conflict: ConflictDefinition,
    queue: QueuedAssignment[],
    context: ResolutionContext
  ): Promise<ResolutionResult> {
    const appliedActions: AppliedAction[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.validateConditions(conflict, queue, context)) {
      return {
        success: false,
        strategyId: this.config.id,
        appliedActions,
        modifiedQueue: queue,
        impact: this.calculateImpact(queue, queue, appliedActions),
        errors: ['Strategy conditions not met'],
        warnings
      };
    }

    const strategy = this.config.parameters.strategy as string || 'priority_first';
    let modifiedQueue = [...queue];

    try {
      switch (strategy) {
        case 'priority_first':
          modifiedQueue = this.rebalanceByPriority(modifiedQueue);
          break;
        case 'timestamp_first':
          modifiedQueue = this.rebalanceByTimestamp(modifiedQueue);
          break;
        case 'fatigue_aware':
          modifiedQueue = this.rebalanceFatigueAware(modifiedQueue);
          break;
        case 'skill_optimized':
          modifiedQueue = this.rebalanceSkillOptimized(modifiedQueue);
          break;
        default:
          warnings.push(`Unknown rebalancing strategy: ${strategy}`);
      }

      appliedActions.push({
        type: 'queue_rebalance',
        target: 'queue',
        parameters: { strategy },
        result: 'success',
        outcome: `Rebalanced queue using ${strategy} strategy`,
        timestamp: Date.now()
      });

    } catch (error) {
      errors.push(`Rebalancing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      success: errors.length === 0,
      strategyId: this.config.id,
      appliedActions,
      modifiedQueue,
      impact: this.calculateImpact(queue, modifiedQueue, appliedActions),
      errors,
      warnings
    };
  }

  private rebalanceByPriority(queue: QueuedAssignment[]): QueuedAssignment[] {
    return [...queue].sort((a, b) => b.priorityScore - a.priorityScore);
  }

  private rebalanceByTimestamp(queue: QueuedAssignment[]): QueuedAssignment[] {
    return [...queue].sort((a, b) => a.timestamp - b.timestamp);
  }

  private rebalanceFatigueAware(queue: QueuedAssignment[]): QueuedAssignment[] {
    return [...queue].sort((a, b) => {
      // Prioritize low fatigue assignments
      const fatigueDiff = a.factors.fatigue - b.factors.fatigue;
      if (Math.abs(fatigueDiff) > 0.1) {
        return fatigueDiff;
      }
      // Fall back to priority
      return b.priorityScore - a.priorityScore;
    });
  }

  private rebalanceSkillOptimized(queue: QueuedAssignment[]): QueuedAssignment[] {
    return [...queue].sort((a, b) => {
      // Prioritize high skill match
      const skillDiff = b.factors.statTagMatch - a.factors.statTagMatch;
      if (Math.abs(skillDiff) > 0.1) {
        return skillDiff;
      }
      // Fall back to priority
      return b.priorityScore - a.priorityScore;
    });
  }
}

// ============================================================================
// Resolution Strategy Registry
// ============================================================================

export interface ResolutionContext {
  timestamp: number;
  availableResidents: AvailableResident[];
  activityRequirements: Record<string, ActivityRequirement>;
  globalLimits: {
    maxQueueSize: number;
    maxConcurrentResolutions: number;
  };
}

export interface AvailableResident {
  id: string;
  fatigue: number;
  skillLevel: number;
  currentAssignments: number;
  maxAssignments: number;
}

export interface ActivityRequirement {
  minSkillLevel: number;
  requiredStats: string[];
  maxConcurrentAssignments: number;
}

export class ResolutionStrategyRegistry {
  private strategies = new Map<string, BaseResolutionStrategy>();

  constructor() {
    this.registerDefaultStrategies();
  }

  register(strategy: BaseResolutionStrategy): void {
    this.strategies.set(strategy.config.id, strategy);
  }

  unregister(strategyId: string): void {
    this.strategies.delete(strategyId);
  }

  get(strategyId: string): BaseResolutionStrategy | undefined {
    return this.strategies.get(strategyId);
  }

  getAll(): BaseResolutionStrategy[] {
    return Array.from(this.strategies.values());
  }

  getEnabled(): BaseResolutionStrategy[] {
    return this.getAll().filter(strategy => strategy.config.enabled);
  }

  getApplicableStrategies(
    conflictType: ConflictType,
    severity: ConflictSeverity
  ): BaseResolutionStrategy[] {
    return this.getEnabled().filter(strategy =>
      (strategy as any).config.applicableTypes.includes(conflictType) &&
      (strategy as any).config.applicableSeverities.includes(severity)
    ).sort((a, b) => (b as any).config.priority - (a as any).config.priority);
  }

  private registerDefaultStrategies(): void {
    // Reassignment strategies
    this.register(new ReassignmentStrategy({
      id: 'reassign_overload',
      name: 'Reassign Overloaded Crew',
      description: 'Move assignments from overloaded residents to available ones',
      enabled: true,
      priority: 100,
      applicableTypes: ['crew_limit_exceeded'],
      applicableSeverities: ['medium', 'high', 'critical'],
      action: {
        type: 'reassign',
        target: 'assignment',
        effect: 'Redistribute workload',
        implementation: 'standard_reassign'
      },
      parameters: {
        maxReassignments: 3,
        preferLowFatigue: true
      },
      conditions: {
        maxAssignments: 5,
        resourceConstraints: {
          maxReassignments: 3,
          requireAvailableResident: true
        }
      },
      effects: {
        expectedImpact: {
          priorityShift: -0.1,
          fatigueChange: -0.2,
          efficiencyChange: 0.1
        },
        sideEffects: ['May reduce assignment priority'],
        risks: ['Alternative resident may have lower skill match']
      }
    }));

    // Delay strategies
    this.register(new DelayStrategy({
      id: 'delay_fatigue',
      name: 'Delay Fatigued Assignments',
      description: 'Delay assignments for fatigued residents',
      enabled: true,
      priority: 90,
      applicableTypes: ['fatigue_overload'],
      applicableSeverities: ['medium', 'high', 'critical'],
      action: {
        type: 'delay',
        target: 'assignment',
        effect: 'Allow fatigue recovery',
        implementation: 'standard_delay'
      },
      parameters: {
        delayMs: 300000,
        fatigueThreshold: 0.7
      },
      conditions: {
        maxFatigue: 0.9,
        timeConstraints: {
          maxDelay: 600000
        }
      },
      effects: {
        expectedImpact: {
          priorityShift: -0.2,
          fatigueChange: -0.3,
          efficiencyChange: 0.0
        },
        sideEffects: ['Delays task completion'],
        risks: ['May cause deadline misses']
      }
    }));

    // Priority adjustment strategies
    this.register(new PriorityAdjustmentStrategy({
      id: 'fix_priority_inversion',
      name: 'Fix Priority Inversion',
      description: 'Adjust priorities to resolve inversion conflicts',
      enabled: true,
      priority: 80,
      applicableTypes: ['priority_inversion'],
      applicableSeverities: ['low', 'medium', 'high'],
      action: {
        type: 'modify_priority',
        target: 'assignment',
        effect: 'Correct priority ordering',
        implementation: 'standard_priority_adjust'
      },
      parameters: {
        adjustmentFactor: 0.5
      },
      conditions: {
        minPriority: 0.1
      },
      effects: {
        expectedImpact: {
          priorityShift: -0.3,
          fatigueChange: 0.0,
          efficiencyChange: 0.1
        },
        sideEffects: ['May reduce overall priority scores'],
        risks: ['Could create new priority inversions']
      }
    }));

    // Queue rebalancing strategies
    this.register(new QueueRebalancingStrategy({
      id: 'queue_rebalance',
      name: 'Rebalance Queue',
      description: 'Reorder queue to optimize assignment flow',
      enabled: true,
      priority: 70,
      applicableTypes: ['queue_overflow', 'specialization_conflict'],
      applicableSeverities: ['medium', 'high', 'critical'],
      action: {
        type: 'queue_rebalance',
        target: 'queue',
        effect: 'Optimize queue ordering',
        implementation: 'standard_rebalance'
      },
      parameters: {
        strategy: 'priority_first'
      },
      conditions: {
        maxAssignments: 50
      },
      effects: {
        expectedImpact: {
          priorityShift: 0.0,
          fatigueChange: 0.0,
          efficiencyChange: 0.2
        },
        sideEffects: ['Changes assignment order'],
        risks: ['May disrupt existing priorities']
      }
    }));
  }
}
