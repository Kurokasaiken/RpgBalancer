/**
 * AI Drop Suggestion Engine for Idle Village Phase E
 * 
 * Provides intelligent suggestions for resident-activity assignments
 * based on stat compatibility, fatigue levels, crew optimization,
 * and village needs. Uses config-first scoring algorithms.
 */

import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';
import type { 
  DropValidationResult, 
  DropValidationRule,
  ResidentDropRulesConfig 
} from '@/ui/idleVillage/config/residentDropRules';
import { createDropValidator, DEFAULT_DROP_RULES_CONFIG } from '@/ui/idleVillage/config/residentDropRules';

/**
 * Suggestion priority levels
 */
export type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Suggestion types for different contexts
 */
export type SuggestionType = 
  | 'optimal_assignment'    // Best match for resident
  | 'crew_optimization'    // Fill crew to optimal level
  | 'fatigue_management'   // Low fatigue options
  | 'resource_need'        // Address resource shortages
  | 'stat_development'     // Develop specific stats
  | 'emergency_fill'        // Critical activity needs fill;

/**
 * Individual suggestion for resident-activity assignment
 */
export interface DropSuggestion {
  /** Unique suggestion identifier */
  id: string;
  /** Type of suggestion */
  type: SuggestionType;
  /** Priority level */
  priority: SuggestionPriority;
  /** Resident being suggested */
  resident: ResidentState;
  /** Target activity */
  activity: ActivityDefinition;
  /** Confidence score (0-1) */
  confidence: number;
  /** Human-readable reason */
  reason: string;
  /** Expected outcomes */
  expectedOutcomes?: {
    /** Success probability (0-1) */
    successProbability?: number;
    /** Resource yield multiplier */
    yieldMultiplier?: number;
    /** Fatigue impact */
    fatigueImpact?: 'low' | 'medium' | 'high';
    /** Risk level */
    riskLevel?: 'low' | 'medium' | 'high';
  };
  /** Validation result */
  validationResult: DropValidationResult;
  /** Suggestion metadata */
  metadata: {
    /** Scoring breakdown */
    scoreBreakdown: Record<string, number>;
    /** Alternative activities */
    alternatives: Array<{
      activity: ActivityDefinition;
      score: number;
      reason: string;
    }>;
    /** Context factors */
    contextFactors: string[];
  };
}

/**
 * Configuration for AI suggestion engine
 */
export interface DropSuggestionConfig {
  /** Weight factors for scoring */
  weights: {
    statCompatibility: number;      // How well stats match requirements
    fatigueOptimization: number;   // Prefer low fatigue residents
    crewBalance: number;           // Balance crew across activities
    resourcePriority: number;      // Prioritize resource needs
    statDevelopment: number;       // Develop underutilized stats
    riskAssessment: number;         // Consider risk/reward ratio
  };
  /** Thresholds for suggestion generation */
  thresholds: {
    minConfidence: number;         // Minimum confidence to suggest
    maxSuggestionsPerResident: number; // Limit suggestions per resident
    maxSuggestionsPerActivity: number; // Limit suggestions per activity
    criticalNeedThreshold: number;  // When to show critical suggestions
  };
  /** AI behavior settings */
  behavior: {
    preferLowRisk: boolean;        // Prefer safer assignments
    considerFatigue: boolean;       // Factor in fatigue levels
    balanceCrew: boolean;           // Try to balance crew distribution
    developStats: boolean;          // Consider stat development
    prioritizeResources: boolean;   // Focus on resource needs
  };
}

/**
 * Village state context for suggestions
 */
export interface VillageContext {
  /** Current residents */
  residents: ResidentState[];
  /** Available activities */
  activities: ActivityDefinition[];
  /** Current resource levels */
  resourceLevels: Record<string, number>;
  /** Resource needs/priorities */
  resourceNeeds: Record<string, number>;
  /** Current activity assignments */
  currentAssignments: Record<string, string[]>; // activityId -> residentIds
  /** Global village state */
  villageState: {
    day: number;
    season?: string;
    crisisMode?: boolean;
  };
}

/**
 * Default configuration for AI suggestion engine
 */
export const DEFAULT_SUGGESTION_CONFIG: DropSuggestionConfig = {
  weights: {
    statCompatibility: 0.3,
    fatigueOptimization: 0.2,
    crewBalance: 0.15,
    resourcePriority: 0.15,
    statDevelopment: 0.1,
    riskAssessment: 0.1,
  },
  thresholds: {
    minConfidence: 0.3,
    maxSuggestionsPerResident: 3,
    maxSuggestionsPerActivity: 5,
    criticalNeedThreshold: 0.8,
  },
  behavior: {
    preferLowRisk: true,
    considerFatigue: true,
    balanceCrew: true,
    developStats: true,
    prioritizeResources: true,
  },
};

/**
 * AI Drop Suggestion Engine
 */
export class DropSuggestionEngine {
  private config: DropSuggestionConfig;
  private validator: (params: {
    resident: ResidentState;
    activity?: ActivityDefinition;
    currentOccupants?: number;
  }) => DropValidationResult;

  constructor(config: Partial<DropSuggestionConfig> = {}, validationConfig?: Partial<ResidentDropRulesConfig>) {
    this.config = { ...DEFAULT_SUGGESTION_CONFIG, ...config };
    this.validator = createDropValidator(validationConfig);
  }

  /**
   * Generate suggestions for a specific resident
   */
  generateSuggestionsForResident(
    resident: ResidentState,
    context: VillageContext
  ): DropSuggestion[] {
    const suggestions: DropSuggestion[] = [];

    // Filter valid activities for this resident
    const validActivities = context.activities.filter(activity => {
      const validation = this.validator({
        resident,
        activity,
        currentOccupants: context.currentAssignments[activity.id]?.length || 0,
      });
      return validation.isValid;
    });

    // Score each valid activity
    const scoredActivities = validActivities.map(activity => ({
      activity,
      score: this.scoreResidentActivityMatch(resident, activity, context),
      validation: this.validator({
        resident,
        activity,
        currentOccupants: context.currentAssignments[activity.id]?.length || 0,
      }),
    }));

    // Sort by score and generate suggestions
    scoredActivities
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.thresholds.maxSuggestionsPerResident)
      .forEach(({ activity, score, validation }) => {
        if (score >= this.config.thresholds.minConfidence) {
          const suggestion = this.createSuggestion(
            resident,
            activity,
            score,
            validation,
            context
          );
          suggestions.push(suggestion);
        }
      });

    return suggestions;
  }

  /**
   * Generate suggestions for a specific activity
   */
  generateSuggestionsForActivity(
    activity: ActivityDefinition,
    context: VillageContext
  ): DropSuggestion[] {
    const suggestions: DropSuggestion[] = [];

    // Find valid residents for this activity
    const validResidents = context.residents.filter(resident => {
      const validation = this.validator({
        resident,
        activity,
        currentOccupants: context.currentAssignments[activity.id]?.length || 0,
      });
      return validation.isValid;
    });

    // Score each valid resident
    const scoredResidents = validResidents.map(resident => ({
      resident,
      score: this.scoreResidentActivityMatch(resident, activity, context),
      validation: this.validator({
        resident,
        activity,
        currentOccupants: context.currentAssignments[activity.id]?.length || 0,
      }),
    }));

    // Sort by score and generate suggestions
    scoredResidents
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.thresholds.maxSuggestionsPerActivity)
      .forEach(({ resident, score, validation }) => {
        if (score >= this.config.thresholds.minConfidence) {
          const suggestion = this.createSuggestion(
            resident,
            activity,
            score,
            validation,
            context
          );
          suggestions.push(suggestion);
        }
      });

    return suggestions;
  }

  /**
   * Generate general village-wide suggestions
   */
  generateVillageSuggestions(context: VillageContext): DropSuggestion[] {
    const suggestions: DropSuggestion[] = [];

    // Find critical needs
    const criticalActivities = this.findCriticalActivities(context);

    // Generate suggestions for critical activities first
    criticalActivities.forEach(activity => {
      const activitySuggestions = this.generateSuggestionsForActivity(activity, context);
      suggestions.push(...activitySuggestions.map(s => ({
        ...s,
        priority: 'critical' as SuggestionPriority,
        type: 'emergency_fill' as SuggestionType,
        reason: `Critical need: ${s.reason}`,
      })));
    });

    // Generate optimization suggestions
    context.residents.forEach(resident => {
      const residentSuggestions = this.generateSuggestionsForResident(resident, context);
      suggestions.push(...residentSuggestions);
    });

    // Sort by priority and confidence
    return suggestions
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      });
  }

  /**
   * Score the compatibility between a resident and activity
   */
  private scoreResidentActivityMatch(
    resident: ResidentState,
    activity: ActivityDefinition,
    context: VillageContext
  ): number {
    let score = 0;
    const scoreBreakdown: Record<string, number> = {};

    // 1. Stat compatibility scoring
    if (activity.statRequirement) {
      const statScore = this.calculateStatCompatibilityScore(resident, activity);
      score += statScore * this.config.weights.statCompatibility;
      scoreBreakdown.statCompatibility = statScore;
    }

    // 2. Fatigue optimization
    if (this.config.behavior.considerFatigue) {
      const fatigueScore = this.calculateFatigueScore(resident, activity);
      score += fatigueScore * this.config.weights.fatigueOptimization;
      scoreBreakdown.fatigueOptimization = fatigueScore;
    }

    // 3. Crew balance
    if (this.config.behavior.balanceCrew) {
      const crewScore = this.calculateCrewBalanceScore(resident, activity, context);
      score += crewScore * this.config.weights.crewBalance;
      scoreBreakdown.crewBalance = crewScore;
    }

    // 4. Resource priority
    if (this.config.behavior.prioritizeResources) {
      const resourceScore = this.calculateResourcePriorityScore(activity, context);
      score += resourceScore * this.config.weights.resourcePriority;
      scoreBreakdown.resourcePriority = resourceScore;
    }

    // 5. Stat development
    if (this.config.behavior.developStats) {
      const developmentScore = this.calculateStatDevelopmentScore(resident, activity);
      score += developmentScore * this.config.weights.statDevelopment;
      scoreBreakdown.statDevelopment = developmentScore;
    }

    // 6. Risk assessment
    const riskScore = this.calculateRiskScore(resident, activity);
    score += riskScore * this.config.weights.riskAssessment;
    scoreBreakdown.riskAssessment = riskScore;

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Calculate stat compatibility score
   */
  private calculateStatCompatibilityScore(resident: ResidentState, activity: ActivityDefinition): number {
    if (!activity.statRequirement) return 0.5; // Neutral if no requirements

    // This would integrate with the actual stat system
    // For now, return a placeholder based on validation
    // In a real implementation, this would check resident stats against requirements
    return 0.8; // Placeholder
  }

  /**
   * Calculate fatigue optimization score
   */
  private calculateFatigueScore(resident: ResidentState, activity: ActivityDefinition): number {
    const fatigueThreshold = 80; // Configurable
    const fatigueRatio = resident.fatigue / fatigueThreshold;
    
    // Prefer lower fatigue residents
    return Math.max(0, 1 - fatigueRatio);
  }

  /**
   * Calculate crew balance score
   */
  private calculateCrewBalanceScore(
    resident: ResidentState,
    activity: ActivityDefinition,
    context: VillageContext
  ): number {
    const currentOccupants = context.currentAssignments[activity.id]?.length || 0;
    const maxSlots = activity.maxSlots === 'infinite' ? 10 : activity.maxSlots;
    
    if (maxSlots === 'infinite') return 0.5; // Neutral for infinite slots
    
    const occupancyRatio = currentOccupants / maxSlots;
    
    // Prefer activities that are not too full or too empty
    const optimalRatio = 0.7; // Prefer 70% full
    const balanceScore = 1 - Math.abs(occupancyRatio - optimalRatio);
    
    return balanceScore;
  }

  /**
   * Calculate resource priority score
   */
  private calculateResourcePriorityScore(activity: ActivityDefinition, context: VillageContext): number {
    if (!activity.rewards || activity.rewards.length === 0) return 0.5;
    
    let totalPriority = 0;
    let rewardCount = 0;
    
    activity.rewards.forEach(reward => {
      const need = context.resourceNeeds[reward.resourceId] || 0;
      const current = context.resourceLevels[reward.resourceId] || 0;
      
      if (need > 0) {
        const priority = Math.min(1, need / (need + current));
        totalPriority += priority;
        rewardCount++;
      }
    });
    
    return rewardCount > 0 ? totalPriority / rewardCount : 0.5;
  }

  /**
   * Calculate stat development score
   */
  private calculateStatDevelopmentScore(resident: ResidentState, activity: ActivityDefinition): number {
    // This would analyze which stats the activity develops
    // and compare with resident's current stat profile
    // For now, return a placeholder
    return 0.6; // Placeholder
  }

  /**
   * Calculate risk assessment score
   */
  private calculateRiskScore(resident: ResidentState, activity: ActivityDefinition): number {
    const dangerRating = activity.dangerRating || 0;
    const maxDanger = 10; // Configurable
    
    // Lower risk is better for most residents
    const riskScore = this.config.behavior.preferLowRisk 
      ? 1 - (dangerRating / maxDanger)
      : dangerRating / maxDanger; // High risk, high reward
    
    return Math.max(0, Math.min(1, riskScore));
  }

  /**
   * Create a suggestion object
   */
  private createSuggestion(
    resident: ResidentState,
    activity: ActivityDefinition,
    score: number,
    validation: DropValidationResult,
    context: VillageContext
  ): DropSuggestion {
    const type = this.determineSuggestionType(resident, activity, context);
    const priority = this.determineSuggestionPriority(score, type, context);
    const reason = this.generateSuggestionReason(resident, activity, type, score);
    
    return {
      id: `${resident.id}-${activity.id}-${Date.now()}`,
      type,
      priority,
      resident,
      activity,
      confidence: score,
      reason,
      expectedOutcomes: this.calculateExpectedOutcomes(resident, activity, context),
      validationResult: validation,
      metadata: {
        scoreBreakdown: {}, // Would be populated by scoring method
        alternatives: this.findAlternativeActivities(resident, activity, context),
        contextFactors: this.identifyContextFactors(resident, activity, context),
      },
    };
  }

  /**
   * Determine suggestion type
   */
  private determineSuggestionType(
    resident: ResidentState,
    activity: ActivityDefinition,
    context: VillageContext
  ): SuggestionType {
    // Logic to determine the most appropriate suggestion type
    if (context.resourceNeeds[activity.rewards?.[0]?.resourceId] > 0) {
      return 'resource_need';
    }
    
    if (resident.fatigue > 70) {
      return 'fatigue_management';
    }
    
    if (activity.statRequirement) {
      return 'optimal_assignment';
    }
    
    return 'crew_optimization';
  }

  /**
   * Determine suggestion priority
   */
  private determineSuggestionPriority(
    score: number,
    type: SuggestionType,
    context: VillageContext
  ): SuggestionPriority {
    if (context.villageState.crisisMode || score > 0.9) return 'critical';
    if (score > 0.7) return 'high';
    if (score > 0.5) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable suggestion reason
   */
  private generateSuggestionReason(
    resident: ResidentState,
    activity: ActivityDefinition,
    type: SuggestionType,
    score: number
  ): string {
    switch (type) {
      case 'optimal_assignment':
        return `Great stat match for ${activity.label} (${Math.round(score * 100)}% fit)`;
      case 'crew_optimization':
        return `Helps balance crew for ${activity.label}`;
      case 'fatigue_management':
        return `Low fatigue option for ${activity.label}`;
      case 'resource_need':
        return `Addresses resource need with ${activity.label}`;
      case 'stat_development':
        return `Good development opportunity in ${activity.label}`;
      case 'emergency_fill':
        return `Critical need for ${activity.label}`;
      default:
        return `Good match for ${activity.label}`;
    }
  }

  /**
   * Calculate expected outcomes
   */
  private calculateExpectedOutcomes(
    resident: ResidentState,
    activity: ActivityDefinition,
    context: VillageContext
  ) {
    return {
      successProbability: 0.8, // Would be calculated based on stats and difficulty
      yieldMultiplier: 1.0, // Would be calculated based on resident stats
      fatigueImpact: activity.fatigueProfile?.baseGain ? 
        ((activity.fatigueProfile.baseGain > 5 ? 'high' as const : 
         activity.fatigueProfile.baseGain > 2 ? 'medium' as const : 'low' as const)) : 'medium' as const,
      riskLevel: activity.dangerRating ? 
        ((activity.dangerRating > 7 ? 'high' as const : 
         activity.dangerRating > 3 ? 'medium' as const : 'low' as const)) : 'low' as const,
    };
  }

  /**
   * Find alternative activities
   */
  private findAlternativeActivities(
    resident: ResidentState,
    activity: ActivityDefinition,
    context: VillageContext
  ) {
    // Find similar activities with lower scores
    return []; // Placeholder
  }

  /**
   * Identify context factors
   */
  private identifyContextFactors(
    resident: ResidentState,
    activity: ActivityDefinition,
    context: VillageContext
  ): string[] {
    const factors: string[] = [];
    
    if (resident.fatigue > 70) factors.push('high_fatigue');
    if (context.villageState.crisisMode) factors.push('crisis_mode');
    if (activity.dangerRating && activity.dangerRating > 5) factors.push('high_risk');
    
    return factors;
  }

  /**
   * Find activities with critical needs
   */
  private findCriticalActivities(context: VillageContext): ActivityDefinition[] {
    return context.activities.filter(activity => {
      const currentOccupants = context.currentAssignments[activity.id]?.length || 0;
      const maxSlots = activity.maxSlots === 'infinite' ? 10 : activity.maxSlots;
      
      // Critical if under-occupied and produces needed resources
      const occupancyRatio = currentOccupants / (maxSlots || 1);
      const hasResourceNeed = activity.rewards?.some(reward => 
        context.resourceNeeds[reward.resourceId] > 0
      );
      
      return occupancyRatio < 0.3 && hasResourceNeed;
    });
  }
}
