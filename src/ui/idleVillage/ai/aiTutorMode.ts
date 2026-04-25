/**
 * AI Tutor Mode for Idle Village Drop Suggestions
 *
 * Provides step-by-step explanations of AI suggestions for resident-activity assignments,
 * helping users understand the reasoning behind each recommendation.
 *
 * @module aiTutorMode
 * @since 2026-01-13
 * @author Cascade
 */

import type { DropSuggestion, SuggestionType, SuggestionPriority } from '../ai/dropSuggestionEngine';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { DropValidationResult } from '../config/residentDropRules';

export interface TutorStep {
  /** Step number in the reasoning process */
  stepNumber: number;
  /** Step title */
  title: string;
  /** Detailed explanation */
  explanation: string;
  /** Visual indicators or highlights */
  highlights?: {
    resident?: string[];
    activity?: string[];
    stats?: string[];
  };
  /** Related data points */
  data?: Record<string, any>;
  /** Step confidence/importance */
  confidence: number;
}

export interface TutorExplanation {
  /** Original suggestion being explained */
  suggestion: DropSuggestion;
  /** Step-by-step reasoning process */
  reasoningSteps: TutorStep[];
  /** Key insights from the analysis */
  keyInsights: string[];
  /** Alternative considerations */
  alternatives: Array<{
    scenario: string;
    impact: 'positive' | 'neutral' | 'negative';
    explanation: string;
  }>;
  /** Overall confidence in the suggestion */
  overallConfidence: number;
  /** Learning tips for the user */
  learningTips: string[];
}

export interface TutorConfig {
  /** Detail level for explanations */
  detailLevel: 'basic' | 'intermediate' | 'advanced';
  /** Whether to show technical details */
  showTechnicalDetails: boolean;
  /** Maximum steps to show */
  maxSteps: number;
  /** Enable learning mode with tips */
  enableLearningMode: boolean;
  /** Show alternative scenarios */
  showAlternatives: boolean;
}

export interface TutorAnalytics {
  /** Tutor interaction metrics */
  interactions: {
    totalViews: number;
    averageTimeSpent: number;
    mostViewedSteps: Record<number, number>;
    confidenceChanges: number[];
  };
  /** Learning effectiveness */
  learning: {
    conceptsLearned: string[];
    improvementAreas: string[];
    userSkillLevel: 'beginner' | 'intermediate' | 'advanced';
  };
  /** Suggestion performance */
  suggestions: {
    acceptedRate: number;
    rejectedRate: number;
    modifiedRate: number;
  };
}

/**
 * Default tutor configuration
 */
export const DEFAULT_TUTOR_CONFIG: TutorConfig = {
  detailLevel: 'intermediate',
  showTechnicalDetails: false,
  maxSteps: 8,
  enableLearningMode: true,
  showAlternatives: true,
};

/**
 * AI Tutor Engine for Drop Suggestions
 */
export class AITutorEngine {
  private config: TutorConfig;

  constructor(config: Partial<TutorConfig> = {}) {
    this.config = { ...DEFAULT_TUTOR_CONFIG, ...config };
  }

  /**
   * Generate step-by-step explanation for a drop suggestion
   */
  explainSuggestion(suggestion: DropSuggestion): TutorExplanation {
    const reasoningSteps = this.buildReasoningSteps(suggestion);
    const keyInsights = this.extractKeyInsights(suggestion, reasoningSteps);
    const alternatives = this.config.showAlternatives ? this.analyzeAlternatives(suggestion) : [];
    const learningTips = this.config.enableLearningMode ? this.generateLearningTips(suggestion) : [];

    return {
      suggestion,
      reasoningSteps: reasoningSteps.slice(0, this.config.maxSteps),
      keyInsights,
      alternatives,
      overallConfidence: suggestion.confidence,
      learningTips,
    };
  }

  /**
   * Build step-by-step reasoning process
   */
  private buildReasoningSteps(suggestion: DropSuggestion): TutorStep[] {
    const steps: TutorStep[] = [];
    let stepNumber = 1;

    // Step 1: Initial Assessment
    steps.push({
      stepNumber: stepNumber++,
      title: 'Initial Assessment',
      explanation: `Starting analysis for ${suggestion.resident.name} and ${suggestion.activity.label}. This suggestion has a ${Math.round(suggestion.confidence * 100)}% confidence score.`,
      highlights: {
        resident: [suggestion.resident.name],
        activity: [suggestion.activity.label],
      },
      data: {
        confidence: suggestion.confidence,
        priority: suggestion.priority,
        type: suggestion.type,
      },
      confidence: 0.9,
    });

    // Step 2: Stat Compatibility Analysis
    if (suggestion.activity.statRequirement) {
      steps.push(this.analyzeStatCompatibility(suggestion, stepNumber++));
    }

    // Step 3: Fatigue Analysis
    steps.push(this.analyzeFatigue(suggestion, stepNumber++));

    // Step 4: Crew Balance Analysis
    steps.push(this.analyzeCrewBalance(suggestion, stepNumber++));

    // Step 5: Resource Priority Analysis
    if (suggestion.activity.rewards?.length) {
      steps.push(this.analyzeResourcePriority(suggestion, stepNumber++));
    }

    // Step 6: Risk Assessment
    steps.push(this.analyzeRiskAssessment(suggestion, stepNumber++));

    // Step 7: Validation Check
    steps.push(this.analyzeValidation(suggestion, stepNumber++));

    // Step 8: Final Recommendation
    steps.push({
      stepNumber: stepNumber++,
      title: 'Final Recommendation',
      explanation: this.generateFinalRecommendation(suggestion),
      highlights: {
        resident: [suggestion.resident.name],
        activity: [suggestion.activity.label],
      },
      data: {
        recommendation: this.getRecommendationAction(suggestion),
        expectedOutcomes: suggestion.expectedOutcomes,
      },
      confidence: suggestion.confidence,
    });

    return steps;
  }

  /**
   * Analyze stat compatibility
   */
  private analyzeStatCompatibility(suggestion: DropSuggestion, stepNumber: number): TutorStep {
    const resident = suggestion.resident;
    const activity = suggestion.activity;

    let explanation = '';

    if (activity.statRequirement) {
      explanation = `Examining how ${resident.name}'s stats match the requirements for ${activity.label}. `;

      // Check if stats meet requirements
      const meetsRequirements = suggestion.validationResult.isValid;
      if (meetsRequirements) {
        explanation += `✓ ${resident.name} meets all stat requirements for this activity. `;
      } else {
        explanation += `⚠ ${resident.name} may not fully meet the stat requirements. `;
        if (suggestion.validationResult.failures?.length) {
          explanation += `Issues: ${suggestion.validationResult.failures.map(f => f.message).join(', ')}. `;
        }
      }

      if (this.config.detailLevel === 'advanced') {
        explanation += `Stat compatibility directly affects success probability and resource yield.`;
      }
    } else {
      explanation = `This activity doesn't have specific stat requirements, so ${resident.name} can participate regardless of their current stats.`;
    }

    return {
      stepNumber,
      title: 'Stat Compatibility Analysis',
      explanation,
      highlights: {
        stats: activity.statRequirement ? ['stat compatibility'] : [],
      },
      data: {
        meetsRequirements: suggestion.validationResult.isValid,
        statRequirements: activity.statRequirement,
        validationFailures: suggestion.validationResult.failures,
      },
      confidence: suggestion.validationResult.isValid ? 0.9 : 0.6,
    };
  }

  /**
   * Analyze fatigue levels
   */
  private analyzeFatigue(suggestion: DropSuggestion, stepNumber: number): TutorStep {
    const resident = suggestion.resident;
    const activity = suggestion.activity;

    const fatigueLevel = resident.fatigue;
    const fatigueThreshold = 80; // Should match engine config
    const isHighFatigue = fatigueLevel > fatigueThreshold;

    let explanation = `${resident.name} currently has ${Math.round(fatigueLevel)}% fatigue. `;

    if (isHighFatigue) {
      explanation += `⚠ This is above the recommended ${fatigueThreshold}% threshold. `;
      explanation += `High fatigue residents are less effective and may need rest soon. `;
    } else {
      explanation += `✓ This is within acceptable limits for productive work. `;
    }

    if (activity.fatigueProfile) {
      const fatigueGain = activity.fatigueProfile.baseGain;
      explanation += `This activity will increase fatigue by approximately ${fatigueGain} points. `;

      if (isHighFatigue && fatigueGain > 3) {
        explanation += `⚠ Combining high fatigue with a demanding activity may lead to exhaustion.`;
      } else if (!isHighFatigue && fatigueGain <= 2) {
        explanation += `✓ Good match - moderate fatigue gain for a well-rested resident.`;
      }
    }

    return {
      stepNumber,
      title: 'Fatigue Analysis',
      explanation,
      highlights: {
        resident: isHighFatigue ? ['high fatigue'] : ['normal fatigue'],
      },
      data: {
        currentFatigue: fatigueLevel,
        threshold: fatigueThreshold,
        activityFatigueGain: activity.fatigueProfile?.baseGain,
        isHighFatigue,
      },
      confidence: isHighFatigue ? 0.7 : 0.9,
    };
  }

  /**
   * Analyze crew balance
   */
  private analyzeCrewBalance(suggestion: DropSuggestion, stepNumber: number): TutorStep {
    const activity = suggestion.activity;

    // This would need current assignment data from context
    // For now, provide general analysis
    const maxSlots = activity.maxSlots === 'infinite' ? 10 : activity.maxSlots;
    const assumedOccupants = 2; // Placeholder - would come from context

    const occupancyRatio = assumedOccupants / maxSlots;
    const isUnderOccupied = occupancyRatio < 0.5;
    const isOverOccupied = occupancyRatio > 0.9;

    let explanation = `${activity.label} can accommodate ${maxSlots === 10 ? 'many' : maxSlots} residents. `;

    if (isUnderOccupied) {
      explanation += `✓ This activity could benefit from more residents. Adding ${suggestion.resident.name} would help improve efficiency. `;
    } else if (isOverOccupied) {
      explanation += `⚠ This activity is nearly full. Consider if ${suggestion.resident.name} would be the best addition. `;
    } else {
      explanation += `✓ Good balance - this activity has appropriate staffing levels. `;
    }

    if (this.config.detailLevel === 'advanced') {
      explanation += `Crew balance affects both productivity and resource distribution across the village.`;
    }

    return {
      stepNumber,
      title: 'Crew Balance Analysis',
      explanation,
      highlights: {
        activity: isUnderOccupied ? ['understaffed'] : isOverOccupied ? ['overstaffed'] : ['well-balanced'],
      },
      data: {
        maxSlots,
        assumedOccupants,
        occupancyRatio,
        balance: isUnderOccupied ? 'under' : isOverOccupied ? 'over' : 'balanced',
      },
      confidence: 0.8,
    };
  }

  /**
   * Analyze resource priority
   */
  private analyzeResourcePriority(suggestion: DropSuggestion, stepNumber: number): TutorStep {
    const activity = suggestion.activity;

    if (!activity.rewards?.length) {
      return {
        stepNumber,
        title: 'Resource Priority Analysis',
        explanation: `${activity.label} doesn't produce specific resources, so resource priority isn't a major factor.`,
        confidence: 0.5,
      };
    }

    const rewards = activity.rewards;
    let explanation = `${activity.label} produces: `;

    rewards.forEach((reward, index) => {
      explanation += `${reward.resourceId} (${reward.amount}`;
      if (reward.probability && reward.probability < 1) {
        explanation += `, ${Math.round(reward.probability * 100)}% chance`;
      }
      explanation += `)${index < rewards.length - 1 ? ', ' : ''}`;
    });

    explanation += `. `;

    // Would need resource needs data from context
    explanation += `Consider village resource needs when deciding if this activity should be prioritized.`;

    if (this.config.detailLevel === 'advanced') {
      explanation += ` Resource production directly impacts village economy and growth.`;
    }

    return {
      stepNumber,
      title: 'Resource Priority Analysis',
      explanation,
      highlights: {
        activity: ['resource production'],
      },
      data: {
        rewards: activity.rewards,
      },
      confidence: 0.8,
    };
  }

  /**
   * Analyze risk assessment
   */
  private analyzeRiskAssessment(suggestion: DropSuggestion, stepNumber: number): TutorStep {
    const activity = suggestion.activity;
    const outcomes = suggestion.expectedOutcomes;

    const dangerRating = activity.dangerRating || 0;
    const riskLevel = outcomes?.riskLevel || 'low';

    let explanation = `${activity.label} has a danger rating of ${dangerRating}/10. `;

    switch (riskLevel) {
      case 'low':
        explanation += `✓ Low risk activity suitable for most residents.`;
        break;
      case 'medium':
        explanation += `⚠ Medium risk - consider resident experience and stats.`;
        break;
      case 'high':
        explanation += `⚠ High risk activity - only assign experienced residents with good stats.`;
        break;
    }

    if (outcomes?.successProbability) {
      const successPercent = Math.round(outcomes.successProbability * 100);
      explanation += ` Expected success rate: ${successPercent}%.`;
    }

    if (outcomes?.fatigueImpact) {
      explanation += ` Fatigue impact: ${outcomes.fatigueImpact}.`;
    }

    return {
      stepNumber,
      title: 'Risk Assessment',
      explanation,
      highlights: {
        activity: [`${riskLevel} risk`],
      },
      data: {
        dangerRating,
        riskLevel,
        expectedOutcomes: outcomes,
      },
      confidence: 0.8,
    };
  }

  /**
   * Analyze validation results
   */
  private analyzeValidation(suggestion: DropSuggestion, stepNumber: number): TutorStep {
    const validation = suggestion.validationResult;

    let explanation = `Validation check: `;

    if (validation.isValid) {
      explanation += `✓ ${suggestion.resident.name} can be assigned to ${suggestion.activity.label}. `;
      explanation += `All requirements are met.`;
    } else {
      explanation += `⚠ ${suggestion.resident.name} cannot be assigned to ${suggestion.activity.label}. `;

      if (validation.failures?.length) {
        explanation += `Issues found: `;
        validation.failures.forEach((failure, index) => {
          explanation += `${failure.message}${index < validation.failures!.length - 1 ? '; ' : ''}`;
        });
      }
    }

    return {
      stepNumber,
      title: 'Validation Check',
      explanation,
      highlights: {
        resident: validation.isValid ? ['valid'] : ['invalid'],
      },
      data: {
        isValid: validation.isValid,
        failures: validation.failures,
      },
      confidence: validation.isValid ? 0.95 : 0.9,
    };
  }

  /**
   * Generate final recommendation
   */
  private generateFinalRecommendation(suggestion: DropSuggestion): string {
    const confidencePercent = Math.round(suggestion.confidence * 100);
    const priority = suggestion.priority;

    let recommendation = `Based on all factors analyzed, this is a `;

    switch (priority) {
      case 'critical':
        recommendation += `CRITICAL ${confidencePercent}% confidence suggestion. `;
        break;
      case 'high':
        recommendation += `HIGH ${confidencePercent}% confidence suggestion. `;
        break;
      case 'medium':
        recommendation += `MEDIUM ${confidencePercent}% confidence suggestion. `;
        break;
      case 'low':
        recommendation += `LOW ${confidencePercent}% confidence suggestion. `;
        break;
    }

    recommendation += `${suggestion.reason} `;

    if (suggestion.expectedOutcomes) {
      recommendation += `Expected outcomes: ${suggestion.expectedOutcomes.successProbability ? Math.round(suggestion.expectedOutcomes.successProbability * 100) + '% success, ' : ''}${suggestion.expectedOutcomes.fatigueImpact} fatigue impact, ${suggestion.expectedOutcomes.riskLevel} risk.`;
    }

    return recommendation;
  }

  /**
   * Get recommended action
   */
  private getRecommendationAction(suggestion: DropSuggestion): string {
    if (suggestion.validationResult.isValid) {
      return suggestion.priority === 'critical' ? 'Assign immediately' :
             suggestion.priority === 'high' ? 'Strongly recommend' :
             suggestion.priority === 'medium' ? 'Consider assigning' :
             'Optional assignment';
    } else {
      return 'Cannot assign - fix validation issues first';
    }
  }

  /**
   * Extract key insights
   */
  private extractKeyInsights(suggestion: DropSuggestion, steps: TutorStep[]): string[] {
    const insights: string[] = [];

    if (suggestion.confidence > 0.8) {
      insights.push('High confidence match with strong stat compatibility');
    }

    if (suggestion.resident.fatigue > 80) {
      insights.push('High fatigue resident - consider rest or light activities');
    }

    if (suggestion.activity.dangerRating && suggestion.activity.dangerRating > 7) {
      insights.push('High-risk activity requires careful consideration');
    }

    if (!suggestion.validationResult.isValid) {
      insights.push('Validation failures must be resolved before assignment');
    }

    return insights;
  }

  /**
   * Analyze alternative scenarios
   */
  private analyzeAlternatives(suggestion: DropSuggestion): Array<{
    scenario: string;
    impact: 'positive' | 'neutral' | 'negative';
    explanation: string;
  }> {
    const alternatives = [];

    // Alternative 1: Different activity for same resident
    alternatives.push({
      scenario: `Assign ${suggestion.resident.name} to a different activity`,
      impact: 'neutral',
      explanation: 'Could provide variety or better stat development, but may not address current needs as well.',
    });

    // Alternative 2: Different resident for same activity
    alternatives.push({
      scenario: `Assign a different resident to ${suggestion.activity.label}`,
      impact: 'neutral',
      explanation: 'Might achieve similar results if other residents have compatible stats.',
    });

    // Alternative 3: Wait for better timing
    if (suggestion.resident.fatigue > 70) {
      alternatives.push({
        scenario: 'Wait until fatigue decreases',
        impact: 'positive',
        explanation: `${suggestion.resident.name} would perform better after resting, potentially increasing success rate.`,
      });
    }

    return alternatives;
  }

  /**
   * Generate learning tips
   */
  private generateLearningTips(suggestion: DropSuggestion): string[] {
    const tips = [];

    if (suggestion.type === 'stat_development') {
      tips.push('Activities help develop specific stats - choose based on your long-term goals');
    }

    if (suggestion.priority === 'critical') {
      tips.push('Critical suggestions often address immediate village needs');
    }

    if (suggestion.expectedOutcomes?.successProbability) {
      tips.push('Success probability considers both resident stats and activity difficulty');
    }

    tips.push('Balance high-reward activities with resident fatigue and risk tolerance');

    return tips;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TutorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create tutor engine instance
 */
export function createTutorEngine(config?: Partial<TutorConfig>): AITutorEngine {
  return new AITutorEngine(config);
}

/**
 * Create tutor engine instance with default config
 */
export function createDefaultTutorEngine(): AITutorEngine {
  return new AITutorEngine();
}
