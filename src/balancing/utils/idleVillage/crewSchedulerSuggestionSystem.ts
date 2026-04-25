/**
 * NP-023 – Idle Village Crew Scheduler Suggestion System
 * 
 * Generates actionable suggestions for resolving crew scheduling conflicts.
 * Provides ranked recommendations with impact analysis and step-by-step guidance.
 */

import type { QueuedAssignment } from '@/ui/idleVillage/hooks/useCrewScheduler';
import type { ConflictDefinition, ConflictType, ConflictSeverity } from './crewSchedulerConflictResolver';
import type { ResolutionStrategy, ResolutionContext, ResolutionResult } from './crewSchedulerResolutionStrategies';

// ============================================================================
// Suggestion System Interfaces
// ============================================================================

export interface Suggestion {
  id: string;
  conflictId: string;
  strategyId: string;
  title: string;
  description: string;
  priority: SuggestionPriority;
  confidence: number; // 0-1
  impact: SuggestionImpact;
  steps: SuggestionStep[];
  risks: SuggestionRisk[];
  benefits: SuggestionBenefit[];
  estimatedTime: number; // in milliseconds
  requirements: SuggestionRequirement[];
  alternatives: string[]; // Alternative suggestion IDs
}

export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

export interface SuggestionImpact {
  assignmentsChanged: number;
  priorityShift: number;
  fatigueReduction: number;
  efficiencyGain: number;
  conflictsResolved: number;
  newConflictsRisk: number;
  overallScore: number; // -1 to 1, negative = detrimental
}

export interface SuggestionStep {
  id: string;
  title: string;
  description: string;
  action: string;
  target: string;
  parameters: Record<string, unknown>;
  expectedOutcome: string;
  estimatedTime: number;
  dependencies: string[]; // Other step IDs that must complete first
  rollbackAction?: string;
}

export interface SuggestionRisk {
  type: 'high' | 'medium' | 'low';
  description: string;
  probability: number; // 0-1
  impact: string;
  mitigation?: string;
}

export interface SuggestionBenefit {
  type: 'immediate' | 'short_term' | 'long_term';
  description: string;
  value: number; // 0-1, relative importance
}

export interface SuggestionRequirement {
  type: 'resident_available' | 'activity_slot' | 'time_window' | 'resource' | 'condition';
  description: string;
  check: () => boolean;
  failureMessage: string;
}

export interface SuggestionGenerationConfig {
  maxSuggestionsPerConflict: number;
  minConfidenceThreshold: number;
  prioritizeByImpact: boolean;
  includeAlternatives: boolean;
  includeRiskAnalysis: boolean;
  includeTimeEstimates: boolean;
  customWeights: {
    priorityWeight: number;
    confidenceWeight: number;
    impactWeight: number;
    riskWeight: number;
    timeWeight: number;
  };
}

export interface SuggestionContext {
  timestamp: number;
  queue: QueuedAssignment[];
  availableResidents: AvailableResident[];
  activityRequirements: Record<string, ActivityRequirement>;
  globalLimits: GlobalLimits;
  historicalData: HistoricalData;
}

export interface AvailableResident {
  id: string;
  name: string;
  fatigue: number;
  skillLevel: number;
  currentAssignments: number;
  maxAssignments: number;
  specialization: Record<string, number>;
  availability: TimeWindow[];
}

export interface ActivityRequirement {
  minSkillLevel: number;
  requiredStats: string[];
  maxConcurrentAssignments: number;
  estimatedDuration: number;
  priority: number;
}

export interface GlobalLimits {
  maxQueueSize: number;
  maxConcurrentResolutions: number;
  priorityInversionThreshold: number;
}

export interface HistoricalData {
  resolutionSuccess: Record<string, number>;
  averageResolutionTime: Record<string, number>;
  conflictFrequency: Record<ConflictType, number>;
  strategyEffectiveness: Record<string, number>;
}

export interface TimeWindow {
  start: number;
  end: number;
  available: boolean;
}

// ============================================================================
// Suggestion Generator
// ============================================================================

export class SuggestionGenerator {
  private config: SuggestionGenerationConfig;
  private suggestionIdCounter = 0;

  constructor(config: Partial<SuggestionGenerationConfig> = {}) {
    this.config = {
      maxSuggestionsPerConflict: 3,
      minConfidenceThreshold: 0.3,
      prioritizeByImpact: true,
      includeAlternatives: true,
      includeRiskAnalysis: true,
      includeTimeEstimates: true,
      customWeights: {
        priorityWeight: 0.3,
        confidenceWeight: 0.2,
        impactWeight: 0.3,
        riskWeight: 0.1,
        timeWeight: 0.1
      },
      ...config
    };
  }

  generateSuggestions(
    conflicts: ConflictDefinition[],
    strategies: ResolutionStrategy[],
    context: SuggestionContext
  ): Suggestion[] {
    const allSuggestions: Suggestion[] = [];

    conflicts.forEach(conflict => {
      const conflictSuggestions = this.generateSuggestionsForConflict(
        conflict,
        strategies,
        context
      );
      allSuggestions.push(...conflictSuggestions);
    });

    // Rank and filter suggestions
    const rankedSuggestions = this.rankSuggestions(allSuggestions);
    const filteredSuggestions = this.filterSuggestions(rankedSuggestions);

    return filteredSuggestions;
  }

  private generateSuggestionsForConflict(
    conflict: ConflictDefinition,
    strategies: ResolutionStrategy[],
    context: SuggestionContext
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const applicableStrategies = this.getApplicableStrategies(conflict, strategies);

    applicableStrategies.forEach((strategy, index) => {
      if (index >= this.config.maxSuggestionsPerConflict) return;

      const suggestion = this.createSuggestion(conflict, strategy, context);
      if (suggestion && suggestion.confidence >= this.config.minConfidenceThreshold) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  private getApplicableStrategies(
    conflict: ConflictDefinition,
    strategies: ResolutionStrategy[]
  ): ResolutionStrategy[] {
    return strategies.filter(strategy =>
      strategy.applicableTypes.includes(conflict.type) &&
      strategy.applicableSeverities.includes(conflict.severity)
    ).sort((a, b) => b.priority - a.priority);
  }

  private createSuggestion(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): Suggestion | null {
    const suggestionId = this.generateSuggestionId();
    const confidence = this.calculateConfidence(conflict, strategy, context);
    const impact = this.calculateImpact(conflict, strategy, context);
    const steps = this.generateSteps(conflict, strategy, context);
    const risks = this.generateRisks(conflict, strategy, context);
    const benefits = this.generateBenefits(conflict, strategy, context);
    const requirements = this.generateRequirements(conflict, strategy, context);
    const estimatedTime = this.calculateEstimatedTime(steps);

    return {
      id: suggestionId,
      conflictId: conflict.id,
      strategyId: strategy.id,
      title: this.generateSuggestionTitle(conflict, strategy),
      description: this.generateSuggestionDescription(conflict, strategy),
      priority: this.determinePriority(conflict, impact),
      confidence,
      impact,
      steps,
      risks,
      benefits,
      estimatedTime,
      requirements,
      alternatives: [] // Will be populated during ranking
    };
  }

  private generateSuggestionId(): string {
    return `suggestion_${++this.suggestionIdCounter}_${Date.now()}`;
  }

  private calculateConfidence(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): number {
    let confidence = 0.5; // Base confidence

    // Historical effectiveness
    const historicalSuccess = context.historicalData.strategyEffectiveness[strategy.id] || 0.5;
    confidence = confidence * 0.6 + historicalSuccess * 0.4;

    // Conflict severity adjustment
    const severityMultiplier = {
      low: 0.8,
      medium: 0.9,
      high: 1.0,
      critical: 1.1
    };
    confidence *= severityMultiplier[conflict.severity];

    // Context factors
    if (this.hasRequiredResources(conflict, strategy, context)) {
      confidence *= 1.2;
    }

    return Math.min(1.0, Math.max(0.0, confidence));
  }

  private calculateImpact(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionImpact {
    const baseImpact = {
      assignmentsChanged: conflict.affectedAssignments.length,
      priorityShift: 0.0,
      fatigueReduction: 0.0,
      efficiencyGain: 0.0,
      conflictsResolved: 1,
      newConflictsRisk: 0.1,
      overallScore: 0.0
    };

    // Strategy-specific impact calculations
    switch (strategy.action.type) {
      case 'reassign':
        baseImpact.priorityShift = -0.1;
        baseImpact.fatigueReduction = 0.2;
        baseImpact.efficiencyGain = 0.1;
        break;
      case 'delay':
        baseImpact.priorityShift = -0.2;
        baseImpact.fatigueReduction = 0.3;
        baseImpact.efficiencyGain = 0.0;
        break;
      case 'modify_priority':
        baseImpact.priorityShift = -0.3;
        baseImpact.fatigueReduction = 0.0;
        baseImpact.efficiencyGain = 0.1;
        break;
      case 'queue_rebalance':
        baseImpact.priorityShift = 0.0;
        baseImpact.fatigueReduction = 0.0;
        baseImpact.efficiencyGain = 0.2;
        break;
    }

    // Calculate overall score
    baseImpact.overallScore = this.calculateOverallScore(baseImpact);

    return baseImpact;
  }

  private calculateOverallScore(impact: SuggestionImpact): number {
    const weights = {
      priorityShift: -0.3,
      fatigueReduction: 0.3,
      efficiencyGain: 0.4,
      newConflictsRisk: -0.2
    };

    return (
      impact.priorityShift * weights.priorityShift +
      impact.fatigueReduction * weights.fatigueReduction +
      impact.efficiencyGain * weights.efficiencyGain +
      impact.newConflictsRisk * weights.newConflictsRisk
    );
  }

  private generateSteps(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionStep[] {
    const steps: SuggestionStep[] = [];

    switch (strategy.action.type) {
      case 'reassign':
        steps.push(...this.generateReassignmentSteps(conflict, strategy, context));
        break;
      case 'delay':
        steps.push(...this.generateDelaySteps(conflict, strategy, context));
        break;
      case 'modify_priority':
        steps.push(...this.generatePriorityAdjustmentSteps(conflict, strategy, context));
        break;
      case 'queue_rebalance':
        steps.push(...this.generateRebalancingSteps(conflict, strategy, context));
        break;
    }

    return steps;
  }

  private generateReassignmentSteps(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionStep[] {
    const steps: SuggestionStep[] = [];
    const maxReassignments = (strategy.parameters as any).maxReassignments as number || 3;

    steps.push({
      id: 'analyze_alternatives',
      title: 'Analyze Alternative Residents',
      description: 'Identify available residents with suitable skills and availability',
      action: 'find_alternative_resident',
      target: conflict.affectedAssignments[0],
      parameters: { maxCandidates: 5 },
      expectedOutcome: 'List of suitable alternative residents',
      estimatedTime: 1000,
      dependencies: []
    });

    for (let i = 0; i < Math.min(conflict.affectedAssignments.length, maxReassignments); i++) {
      steps.push({
        id: `reassign_${i}`,
        title: `Reassign Assignment ${i + 1}`,
        description: `Move assignment to selected alternative resident`,
        action: 'reassign_task',
        target: conflict.affectedAssignments[i],
        parameters: { newResident: 'auto_select' },
        expectedOutcome: 'Assignment moved to new resident',
        estimatedTime: 500,
        dependencies: ['analyze_alternatives'],
        rollbackAction: 'restore_original_assignment'
      });
    }

    steps.push({
      id: 'verify_reassignment',
      title: 'Verify Reassignment',
      description: 'Confirm all assignments are properly reassigned and no new conflicts created',
      action: 'verify_resolution',
      target: 'queue',
      parameters: {},
      expectedOutcome: 'All assignments verified',
      estimatedTime: 2000,
      dependencies: steps.slice(1).map(s => s.id)
    });

    return steps;
  }

  private generateDelaySteps(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionStep[] {
    const steps: SuggestionStep[] = [];
    const delayMs = (strategy.parameters as any).delayMs as number || 300000;

    steps.push({
      id: 'calculate_delay',
      title: 'Calculate Optimal Delay',
      description: 'Determine appropriate delay based on fatigue recovery time',
      action: 'calculate_delay_time',
      target: conflict.affectedAssignments[0],
      parameters: { maxDelay: delayMs },
      expectedOutcome: 'Optimal delay time calculated',
      estimatedTime: 500,
      dependencies: []
    });

    for (const assignmentId of conflict.affectedAssignments) {
      steps.push({
        id: `delay_${assignmentId}`,
        title: `Delay Assignment ${assignmentId}`,
        description: `Postpone assignment to allow fatigue recovery`,
        action: 'delay_assignment',
        target: assignmentId,
        parameters: { delayMs },
        expectedOutcome: 'Assignment delayed in queue',
        estimatedTime: 200,
        dependencies: ['calculate_delay'],
        rollbackAction: 'restore_original_timestamp'
      });
    }

    return steps;
  }

  private generatePriorityAdjustmentSteps(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionStep[] {
    const steps: SuggestionStep[] = [];
    const adjustmentFactor = (strategy.parameters as any).adjustmentFactor as number || 0.5;

    steps.push({
      id: 'analyze_priority_inversion',
      title: 'Analyze Priority Inversion',
      description: 'Identify the specific priority inversion causing the conflict',
      action: 'analyze_priority_conflict',
      target: conflict.id,
      parameters: {},
      expectedOutcome: 'Priority inversion analysis complete',
      estimatedTime: 1000,
      dependencies: []
    });

    for (const assignmentId of conflict.affectedAssignments) {
      steps.push({
        id: `adjust_priority_${assignmentId}`,
        title: `Adjust Priority for ${assignmentId}`,
        description: 'Modify assignment priority to resolve inversion',
        action: 'adjust_priority',
        target: assignmentId,
        parameters: { adjustmentFactor },
        expectedOutcome: 'Priority adjusted',
        estimatedTime: 200,
        dependencies: ['analyze_priority_inversion'],
        rollbackAction: 'restore_original_priority'
      });
    }

    return steps;
  }

  private generateRebalancingSteps(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionStep[] {
    const steps: SuggestionStep[] = [];
    const rebalanceStrategy = (strategy.parameters as any).strategy as string || 'priority_first';

    steps.push({
      id: 'analyze_queue_state',
      title: 'Analyze Queue State',
      description: 'Examine current queue composition and bottlenecks',
      action: 'analyze_queue',
      target: 'queue',
      parameters: {},
      expectedOutcome: 'Queue analysis complete',
      estimatedTime: 2000,
      dependencies: []
    });

    steps.push({
      id: 'rebalance_queue',
      title: 'Rebalance Queue',
      description: `Reorder queue using ${rebalanceStrategy} strategy`,
      action: 'rebalance_queue',
      target: 'queue',
      parameters: { strategy: rebalanceStrategy },
      expectedOutcome: 'Queue rebalanced',
      estimatedTime: 1000,
      dependencies: ['analyze_queue_state'],
      rollbackAction: 'restore_original_order'
    });

    steps.push({
      id: 'verify_rebalance',
      title: 'Verify Rebalancing Results',
      description: 'Confirm that rebalancing resolved the conflict',
      action: 'verify_rebalance',
      target: 'queue',
      parameters: {},
      expectedOutcome: 'Rebalancing verified',
      estimatedTime: 1500,
      dependencies: ['rebalance_queue']
    });

    return steps;
  }

  private generateRisks(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionRisk[] {
    const risks: SuggestionRisk[] = [];

    // Common risks
    risks.push({
      type: 'medium',
      description: 'Resolution may create new conflicts',
      probability: 0.2,
      impact: 'Minor queue disruption',
      mitigation: 'Monitor queue after resolution'
    });

    // Strategy-specific risks
    switch (strategy.action.type) {
      case 'reassign':
        risks.push({
          type: 'medium',
          description: 'Alternative resident may have lower skill match',
          probability: 0.3,
          impact: 'Reduced assignment efficiency',
          mitigation: 'Verify skill compatibility before reassignment'
        });
        break;
      case 'delay':
        risks.push({
          type: 'high',
          description: 'Delayed assignments may miss deadlines',
          probability: 0.4,
          impact: 'Quest failure or penalties',
          mitigation: 'Check time constraints before delaying'
        });
        break;
      case 'modify_priority':
        risks.push({
          type: 'low',
          description: 'Priority adjustment may affect other assignments',
          probability: 0.2,
          impact: 'Minor priority changes',
          mitigation: 'Review full queue impact'
        });
        break;
    }

    return risks;
  }

  private generateBenefits(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionBenefit[] {
    const benefits: SuggestionBenefit[] = [];

    // Common benefits
    benefits.push({
      type: 'immediate',
      description: 'Resolves current conflict',
      value: 0.8
    });

    // Strategy-specific benefits
    switch (strategy.action.type) {
      case 'reassign':
        benefits.push({
          type: 'short_term',
          description: 'Improves workload distribution',
          value: 0.6
        });
        benefits.push({
          type: 'long_term',
          description: 'Reduces future crew limit conflicts',
          value: 0.4
        });
        break;
      case 'delay':
        benefits.push({
          type: 'short_term',
          description: 'Allows fatigue recovery',
          value: 0.7
        });
        break;
      case 'modify_priority':
        benefits.push({
          type: 'immediate',
          description: 'Fixes priority ordering',
          value: 0.9
        });
        break;
      case 'queue_rebalance':
        benefits.push({
          type: 'immediate',
          description: 'Optimizes queue efficiency',
          value: 0.6
        });
        benefits.push({
          type: 'short_term',
          description: 'Prevents future conflicts',
          value: 0.5
        });
        break;
    }

    return benefits;
  }

  private generateRequirements(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): SuggestionRequirement[] {
    const requirements: SuggestionRequirement[] = [];

    // Common requirements
    requirements.push({
      type: 'condition',
      description: 'Queue must be accessible for modification',
      check: () => context.queue.length > 0,
      failureMessage: 'Queue is empty or locked'
    });

    // Strategy-specific requirements
    switch (strategy.action.type) {
      case 'reassign':
        requirements.push({
          type: 'resident_available',
          description: 'At least one alternative resident must be available',
          check: () => context.availableResidents.length > 1,
          failureMessage: 'No alternative residents available'
        });
        break;
      case 'delay':
        requirements.push({
          type: 'time_window',
          description: 'Sufficient time must be available for delays',
          check: () => true, // Would check actual time constraints
          failureMessage: 'Insufficient time window for delays'
        });
        break;
    }

    return requirements;
  }

  private calculateEstimatedTime(steps: SuggestionStep[]): number {
    return steps.reduce((total, step) => total + step.estimatedTime, 0);
  }

  private generateSuggestionTitle(conflict: ConflictDefinition, strategy: ResolutionStrategy): string {
    return `${strategy.name} for ${conflict.type.replace('_', ' ').toUpperCase()}`;
  }

  private generateSuggestionDescription(conflict: ConflictDefinition, strategy: ResolutionStrategy): string {
    return `Apply ${strategy.name.toLowerCase()} to resolve ${conflict.type.replace('_', ' ')} affecting ${conflict.affectedAssignments.length} assignments`;
  }

  private determinePriority(conflict: ConflictDefinition, impact: SuggestionImpact): SuggestionPriority {
    if (conflict.severity === 'critical' || impact.overallScore > 0.7) return 'critical';
    if (conflict.severity === 'high' || impact.overallScore > 0.4) return 'high';
    if (conflict.severity === 'medium' || impact.overallScore > 0.1) return 'medium';
    return 'low';
  }

  private hasRequiredResources(
    conflict: ConflictDefinition,
    strategy: ResolutionStrategy,
    context: SuggestionContext
  ): boolean {
    // Simplified check - would be more sophisticated in practice
    return context.availableResidents.length > 0;
  }

  private rankSuggestions(suggestions: Suggestion[]): Suggestion[] {
    return suggestions.sort((a, b) => {
      const scoreA = this.calculateSuggestionScore(a);
      const scoreB = this.calculateSuggestionScore(b);
      return scoreB - scoreA;
    });
  }

  private calculateSuggestionScore(suggestion: Suggestion): number {
    const weights = this.config.customWeights;
    
    return (
      (suggestion.priority === 'critical' ? 1.0 : suggestion.priority === 'high' ? 0.8 : suggestion.priority === 'medium' ? 0.6 : 0.4) * weights.priorityWeight +
      suggestion.confidence * weights.confidenceWeight +
      suggestion.impact.overallScore * weights.impactWeight +
      (1 - this.calculateRiskLevel(suggestion.risks)) * weights.riskWeight +
      (1 - Math.min(suggestion.estimatedTime / 300000, 1)) * weights.timeWeight // 5 minutes max
    );
  }

  private calculateRiskLevel(risks: SuggestionRisk[]): number {
    if (risks.length === 0) return 0;
    
    const totalRisk = risks.reduce((sum, risk) => {
      const riskValue = risk.type === 'high' ? 1.0 : risk.type === 'medium' ? 0.6 : 0.3;
      return sum + (risk.probability * riskValue);
    }, 0);
    
    return Math.min(1.0, totalRisk / risks.length);
  }

  private filterSuggestions(suggestions: Suggestion[]): Suggestion[] {
    // Filter by confidence threshold
    let filtered = suggestions.filter(s => s.confidence >= this.config.minConfidenceThreshold);
    
    // Add alternatives if enabled
    if (this.config.includeAlternatives) {
      filtered = this.addAlternatives(filtered);
    }
    
    return filtered;
  }

  private addAlternatives(suggestions: Suggestion[]): Suggestion[] {
    // Group suggestions by conflict
    const conflictGroups = new Map<string, Suggestion[]>();
    
    suggestions.forEach(suggestion => {
      const group = conflictGroups.get(suggestion.conflictId) || [];
      group.push(suggestion);
      conflictGroups.set(suggestion.conflictId, group);
    });
    
    // Add alternatives within each conflict group
    conflictGroups.forEach(group => {
      group.forEach((suggestion, index) => {
        const alternatives = group
          .filter((_, i) => i !== index)
          .map(alt => alt.id)
          .slice(0, 2); // Top 2 alternatives
        
        suggestion.alternatives = alternatives;
      });
    });
    
    return suggestions;
  }
}

// ============================================================================
// Suggestion Engine
// ============================================================================

export class SuggestionEngine {
  private generator: SuggestionGenerator;
  private appliedSuggestions = new Map<string, AppliedSuggestion>();

  constructor(config: Partial<SuggestionGenerationConfig> = {}) {
    this.generator = new SuggestionGenerator(config);
  }

  generateSuggestions(
    conflicts: ConflictDefinition[],
    strategies: ResolutionStrategy[],
    context: SuggestionContext
  ): Suggestion[] {
    return this.generator.generateSuggestions(conflicts, strategies, context);
  }

  async applySuggestion(
    suggestion: Suggestion,
    context: SuggestionContext,
    executeStep: (step: SuggestionStep) => Promise<boolean>
  ): Promise<AppliedSuggestion> {
    const appliedSuggestion: AppliedSuggestion = {
      suggestionId: suggestion.id,
      startedAt: Date.now(),
      status: 'in_progress',
      completedSteps: [],
      failedSteps: [],
      errors: [],
      warnings: []
    };

    try {
      // Check requirements
      const requirementResults = await this.checkRequirements(suggestion.requirements);
      if (!requirementResults.allPassed) {
        appliedSuggestion.status = 'failed';
        appliedSuggestion.errors.push(...requirementResults.failures);
        return appliedSuggestion;
      }

      // Execute steps in dependency order
      const orderedSteps = this.orderStepsByDependencies(suggestion.steps);
      
      for (const step of orderedSteps) {
        try {
          const success = await executeStep(step);
          if (success) {
            appliedSuggestion.completedSteps.push(step.id);
          } else {
            appliedSuggestion.failedSteps.push(step.id);
            appliedSuggestion.errors.push(`Step ${step.id} failed`);
          }
        } catch (error) {
          appliedSuggestion.failedSteps.push(step.id);
          appliedSuggestion.errors.push(`Step ${step.id} error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }

      // Determine final status
      if (appliedSuggestion.failedSteps.length === 0) {
        appliedSuggestion.status = 'completed';
      } else if (appliedSuggestion.completedSteps.length > 0) {
        appliedSuggestion.status = 'partial';
      } else {
        appliedSuggestion.status = 'failed';
      }

    } catch (error) {
      appliedSuggestion.status = 'failed';
      appliedSuggestion.errors.push(`Suggestion execution error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    appliedSuggestion.completedAt = Date.now();
    this.appliedSuggestions.set(suggestion.id, appliedSuggestion);
    
    return appliedSuggestion;
  }

  private async checkRequirements(requirements: SuggestionRequirement[]): Promise<{
    allPassed: boolean;
    failures: string[];
  }> {
    const failures: string[] = [];
    
    for (const requirement of requirements) {
      try {
        const passed = requirement.check();
        if (!passed) {
          failures.push(requirement.failureMessage);
        }
      } catch (error) {
        failures.push(`Requirement check failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
    
    return {
      allPassed: failures.length === 0,
      failures
    };
  }

  private orderStepsByDependencies(steps: SuggestionStep[]): SuggestionStep[] {
    const ordered: SuggestionStep[] = [];
    const remaining = [...steps];
    const completed = new Set<string>();

    while (remaining.length > 0) {
      let progressMade = false;
      
      for (let i = remaining.length - 1; i >= 0; i--) {
        const step = remaining[i];
        
        if (step.dependencies.every(dep => completed.has(dep))) {
          ordered.push(step);
          completed.add(step.id);
          remaining.splice(i, 1);
          progressMade = true;
        }
      }
      
      if (!progressMade) {
        // Circular dependency or missing dependency
        console.warn('Circular or missing dependencies detected, adding remaining steps');
        ordered.push(...remaining);
        break;
      }
    }
    
    return ordered;
  }

  getAppliedSuggestion(suggestionId: string): AppliedSuggestion | undefined {
    return this.appliedSuggestions.get(suggestionId);
  }

  getAllAppliedSuggestions(): AppliedSuggestion[] {
    return Array.from(this.appliedSuggestions.values());
  }

  clearAppliedSuggestions(): void {
    this.appliedSuggestions.clear();
  }
}

export interface AppliedSuggestion {
  suggestionId: string;
  startedAt: number;
  completedAt?: number;
  status: 'in_progress' | 'completed' | 'partial' | 'failed';
  completedSteps: string[];
  failedSteps: string[];
  errors: string[];
  warnings: string[];
}
