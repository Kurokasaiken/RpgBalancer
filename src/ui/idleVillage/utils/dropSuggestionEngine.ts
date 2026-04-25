/**
 * Drop Suggestion Engine
 *
 * AI-powered suggestion engine for resident drop optimization.
 * Analyzes validation failures and generates intelligent hints for better assignments.
 */

import type {
  AssignmentFailureReason,
  ValidationFailureDetails
} from '@/ui/idleVillage/slots/residentSlotValidators';
import type {
  DropSuggestion,
  DropSuggestionRule,
  DropSuggestionTemplate,
  SuggestionContext,
  SuggestionPriority,
  SUGGESTION_PRIORITY_ORDER,
  DEFAULT_DROP_ADVISOR_CONFIG,
  DropAdvisorConfig,
} from '@/balancing/config/idleVillage/dropAdvisorConfig';

/**
 * Analysis result for a potential drop
 */
export interface DropAnalysisResult {
  isValid: boolean;
  failureReason?: AssignmentFailureReason;
  validationDetails?: ValidationFailureDetails;
  suggestions: DropSuggestion[];
  analysisScore: number; // 0-1 score of how good the match is
}

/**
 * Drop Suggestion Engine - AI Hints for Resident Assignments
 *
 * Analyzes resident-activity compatibility and provides intelligent suggestions
 * for optimizing drop operations in the Idle Village.
 */
export class DropSuggestionEngine {
  private config: DropAdvisorConfig;

  constructor(config: Partial<DropAdvisorConfig> = {}) {
    this.config = { ...DEFAULT_DROP_ADVISOR_CONFIG, ...config };
  }

  /**
   * Analyzes a potential drop and generates AI suggestions
   */
  analyzeDrop(context: SuggestionContext): DropAnalysisResult {
    const { failureReason, validationDetails } = context;

    // Determine if this is a valid drop
    const isValid = !failureReason || failureReason === 'RESIDENT_NOT_FOUND';

    // Calculate analysis score based on validation
    const analysisScore = this.calculateAnalysisScore(context);

    // Generate suggestions based on validation results
    const suggestions = this.generateSuggestions(context);

    // Filter and prioritize suggestions
    const filteredSuggestions = this.filterAndPrioritizeSuggestions(suggestions);

    return {
      isValid,
      failureReason,
      validationDetails,
      suggestions: filteredSuggestions,
      analysisScore,
    };
  }

  /**
   * Calculates how good a resident-activity match is (0-1 scale)
   */
  private calculateAnalysisScore(context: SuggestionContext): number {
    const { failureReason, validationDetails, residentStats, activityRequirement } = context;

    // Perfect match if no failure
    if (!failureReason || failureReason === 'RESIDENT_NOT_FOUND') {
      return this.calculatePositiveMatchScore(context);
    }

    // Calculate penalty based on failure type
    let baseScore = 0.5; // Neutral starting point

    switch (failureReason) {
      case 'FATIGUE_THRESHOLD':
        baseScore = 0.3; // Fatigue is recoverable
        break;
      case 'RESIDENT_UNAVAILABLE':
        baseScore = 0.2; // Availability issues are blocking
        break;
      case 'SCHEDULER_REJECTED':
        baseScore = 0.4; // Scheduler constraints can be worked around
        break;
      case 'VALIDATION_FAILED':
        baseScore = this.calculateStatValidationScore(validationDetails, residentStats, activityRequirement);
        break;
    }

    return Math.max(0, Math.min(1, baseScore));
  }

  /**
   * Calculates score for successful matches
   */
  private calculatePositiveMatchScore(context: SuggestionContext): number {
    const { residentStats, activityRequirement } = context;

    if (!residentStats || !activityRequirement) return 0.8; // Default good score

    // Calculate stat matching quality
    const allOfMatch = this.calculateAllOfMatch(residentStats, activityRequirement.allOf);
    const anyOfMatch = this.calculateAnyOfMatch(residentStats, activityRequirement.anyOf);
    const noneOfMatch = this.calculateNoneOfMatch(residentStats, activityRequirement.noneOf);

    // Weighted combination
    const score = (allOfMatch * 0.6) + (anyOfMatch * 0.3) + (noneOfMatch * 0.1);

    return score >= this.config.goodMatchThreshold ? 0.9 : 0.7;
  }

  /**
   * Calculates score for stat validation failures
   */
  private calculateStatValidationScore(
    details?: ValidationFailureDetails,
    residentStats?: Record<string, number>,
    requirement?: SuggestionContext['activityRequirement']
  ): number {
    if (!details || !residentStats || !requirement) return 0.1;

    let penalty = 0;

    // Missing allOf stats is major penalty
    if (details.missingAllOf?.length) {
      penalty += details.missingAllOf.length * 0.2;
    }

    // Blocked by noneOf is critical
    if (details.blockedBy?.length) {
      penalty += details.blockedBy.length * 0.3;
    }

    // AnyOf not matched is moderate penalty
    if (details.anyOfMatched === false) {
      penalty += 0.15;
    }

    return Math.max(0.1, 0.6 - penalty);
  }

  /**
   * Generates AI suggestions based on validation context
   */
  private generateSuggestions(context: SuggestionContext): DropSuggestion[] {
    const { failureReason, validationDetails } = context;
    const suggestions: DropSuggestion[] = [];

    // Find matching rules
    const applicableRules = this.config.rules.filter(rule =>
      rule.failureReason === failureReason &&
      this.matchesValidationFilter(rule.validationFilter, validationDetails)
    );

    // Generate suggestions from applicable rules
    for (const rule of applicableRules) {
      for (const template of rule.suggestions) {
        if (this.shouldGenerateSuggestion(template, context)) {
          const suggestion = this.generateSuggestionFromTemplate(template, context);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Checks if validation details match rule filter
   */
  private matchesValidationFilter(
    filter?: Partial<ValidationFailureDetails>,
    details?: ValidationFailureDetails
  ): boolean {
    if (!filter) return true;
    if (!details) return false;

    // Check each filter criterion
    if (filter.missingAllOf && (!details.missingAllOf || !filter.missingAllOf.every(stat => details.missingAllOf!.includes(stat)))) {
      return false;
    }

    if (filter.blockedBy && (!details.blockedBy || !filter.blockedBy.every(stat => details.blockedBy!.includes(stat)))) {
      return false;
    }

    if (filter.anyOfMatched !== undefined && details.anyOfMatched !== filter.anyOfMatched) {
      return false;
    }

    return true;
  }

  /**
   * Determines if a suggestion template should be generated
   */
  private shouldGenerateSuggestion(template: DropSuggestionTemplate, context: SuggestionContext): boolean {
    const { validationDetails, residentStats } = context;

    // Check stat conditions
    if (template.statConditions) {
      const { missingStats, blockedStats, anyOfMatched } = template.statConditions;

      if (missingStats && validationDetails?.missingAllOf) {
        const hasMatchingMissing = missingStats.some(stat => validationDetails.missingAllOf!.includes(stat));
        if (!hasMatchingMissing) return false;
      }

      if (blockedStats && validationDetails?.blockedBy) {
        const hasMatchingBlocked = blockedStats.some(stat => validationDetails.blockedBy!.includes(stat));
        if (!hasMatchingBlocked) return false;
      }

      if (anyOfMatched !== undefined && validationDetails?.anyOfMatched !== anyOfMatched) {
        return false;
      }
    }

    // Check priority threshold
    if (template.minPriorityThreshold) {
      const currentPriority = this.getSuggestionPriority(template.type);
      const thresholdValue = SUGGESTION_PRIORITY_ORDER[template.minPriorityThreshold];
      const currentValue = SUGGESTION_PRIORITY_ORDER[currentPriority];
      if (currentValue < thresholdValue) return false;
    }

    return true;
  }

  /**
   * Generates a concrete suggestion from a template
   */
  private generateSuggestionFromTemplate(
    template: DropSuggestionTemplate,
    context: SuggestionContext
  ): DropSuggestion | null {
    const { validationDetails, residentStats, activityRequirement, availableActivities } = context;

    // Template variable replacement
    const replaceVars = (text: string): string => {
      return text
        .replace('{{missingStats}}', validationDetails?.missingAllOf?.join(', ') || 'unknown')
        .replace('{{blockedStats}}', validationDetails?.blockedBy?.join(', ') || 'unknown')
        .replace('{{matchingStats}}', this.findMatchingStats(residentStats, activityRequirement).join(', '))
        .replace('{{requiredStats}}', activityRequirement?.allOf?.join(', ') || 'required stats');
    };

    try {
      const suggestion: DropSuggestion = {
        type: template.type,
        priority: this.getSuggestionPriority(template.type),
        title: replaceVars(template.titleTemplate),
        description: replaceVars(template.descriptionTemplate),
        iconKey: template.iconKey,
      };

      if (template.actionTemplate) {
        suggestion.actionText = replaceVars(template.actionTemplate);
      }

      // Add stat hints for relevant suggestions
      if (template.type === 'STAT_UPGRADE' && validationDetails?.missingAllOf) {
        suggestion.statHints = validationDetails.missingAllOf;
      }

      // Add alternative activities for relevant suggestions
      if (this.config.enableActivityAlternatives && (template.type === 'ALTERNATIVE_ACTIVITY' || template.type === 'ACTIVITY_SWAP')) {
        suggestion.alternativeActivities = this.findAlternativeActivities(context, availableActivities);
      }

      return suggestion;
    } catch (error) {
      console.warn('Failed to generate suggestion from template:', error);
      return null;
    }
  }

  /**
   * Filters and prioritizes suggestions for display
   */
  private filterAndPrioritizeSuggestions(suggestions: DropSuggestion[]): DropSuggestion[] {
    // Filter by minimum priority
    const minPriorityValue = SUGGESTION_PRIORITY_ORDER[this.config.minPriority];
    const filtered = suggestions.filter(s =>
      SUGGESTION_PRIORITY_ORDER[s.priority] >= minPriorityValue
    );

    // Sort by priority (high to low)
    filtered.sort((a, b) =>
      SUGGESTION_PRIORITY_ORDER[b.priority] - SUGGESTION_PRIORITY_ORDER[a.priority]
    );

    // Limit to max suggestions
    return filtered.slice(0, this.config.maxSuggestions);
  }

  /**
   * Gets the priority for a suggestion type
   */
  private getSuggestionPriority(type: DropSuggestion['type']): SuggestionPriority {
    switch (type) {
      case 'REST_RESIDENT':
      case 'STAT_UPGRADE':
      case 'PERFECT_MATCH':
        return 'high';
      case 'ALTERNATIVE_ACTIVITY':
      case 'ACTIVITY_SWAP':
      case 'SCHEDULER_CONFLICT':
        return 'medium';
      case 'WAITING_RESIDENT':
      case 'GOOD_MATCH':
      case 'UNAVAILABLE_RESIDENT':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Finds stats that the resident has that match requirements
   */
  private findMatchingStats(
    residentStats?: Record<string, number>,
    requirement?: SuggestionContext['activityRequirement']
  ): string[] {
    if (!residentStats || !requirement) return [];

    const matches: string[] = [];

    // Check allOf requirements
    if (requirement.allOf) {
      matches.push(...requirement.allOf.filter(stat => (residentStats[stat] || 0) > 0));
    }

    // Check anyOf requirements
    if (requirement.anyOf) {
      matches.push(...requirement.anyOf.filter(stat => (residentStats[stat] || 0) > 0));
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Finds alternative activities that might be better matches
   */
  private findAlternativeActivities(
    context: SuggestionContext,
    availableActivities?: SuggestionContext['availableActivities']
  ): string[] {
    if (!availableActivities || !context.residentStats) return [];

    const alternatives: string[] = [];

    for (const activity of availableActivities) {
      if (activity.id === context.activityId) continue; // Skip current activity

      const requirement = activity.statRequirement;
      if (!requirement) continue;

      // Check if this activity would be a better match
      const allOfMatch = this.calculateAllOfMatch(context.residentStats, requirement.allOf);
      const anyOfMatch = this.calculateAnyOfMatch(context.residentStats, requirement.anyOf);
      const noneOfMatch = this.calculateNoneOfMatch(context.residentStats, requirement.noneOf);

      const score = (allOfMatch * 0.6) + (anyOfMatch * 0.3) + (noneOfMatch * 0.1);

      if (score > 0.6) { // Good match threshold
        alternatives.push(activity.name);
      }
    }

    return alternatives.slice(0, 3); // Limit to 3 alternatives
  }

  /**
   * Calculates how well resident stats match allOf requirements
   */
  private calculateAllOfMatch(residentStats: Record<string, number>, allOf?: string[]): number {
    if (!allOf?.length) return 1;
    const matched = allOf.filter(stat => (residentStats[stat] || 0) > 0).length;
    return matched / allOf.length;
  }

  /**
   * Calculates how well resident stats match anyOf requirements
   */
  private calculateAnyOfMatch(residentStats: Record<string, number>, anyOf?: string[]): number {
    if (!anyOf?.length) return 1;
    const hasAny = anyOf.some(stat => (residentStats[stat] || 0) > 0);
    return hasAny ? 1 : 0;
  }

  /**
   * Calculates how well resident stats avoid noneOf requirements
   */
  private calculateNoneOfMatch(residentStats: Record<string, number>, noneOf?: string[]): number {
    if (!noneOf?.length) return 1;
    const blocked = noneOf.some(stat => (residentStats[stat] || 0) > 0);
    return blocked ? 0 : 1;
  }
}

/**
 * Convenience function to create a drop suggestion engine
 */
export function createDropSuggestionEngine(config?: Partial<DropAdvisorConfig>): DropSuggestionEngine {
  return new DropSuggestionEngine(config);
}
