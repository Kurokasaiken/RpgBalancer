/**
 * Drop Advisor Configuration
 *
 * Config-first AI hints for resident drop suggestions based on validation failures.
 * Provides intelligent suggestions to help users make optimal resident assignments.
 */

import type { AssignmentFailureReason, ValidationFailureDetails } from '@/ui/idleVillage/slots/residentSlotValidators';

/**
 * Suggestion priority levels for AI hints
 */
export type SuggestionPriority = 'high' | 'medium' | 'low';

/**
 * Types of AI suggestions for drop optimization
 */
export type SuggestionType =
  | 'REST_RESIDENT'           // Resident needs rest (fatigue)
  | 'ALTERNATIVE_ACTIVITY'    // Suggest better activity for resident
  | 'STAT_UPGRADE'           // Resident needs stat improvements
  | 'ACTIVITY_SWAP'          // Suggest swapping with another resident
  | 'WAITING_RESIDENT'       // Resident is available but blocked
  | 'PERFECT_MATCH'          // Excellent stat match found
  | 'GOOD_MATCH'             // Good but improvable match
  | 'SCHEDULER_CONFLICT'     // Scheduler constraint issue
  | 'UNAVAILABLE_RESIDENT';  // Resident not available

/**
 * Individual AI suggestion with metadata
 */
export interface DropSuggestion {
  type: SuggestionType;
  priority: SuggestionPriority;
  title: string;
  description: string;
  actionText?: string;
  iconKey?: string;
  statHints?: string[];
  alternativeActivities?: string[];
}

/**
 * Configuration for generating AI suggestions based on validation failures
 */
export interface DropSuggestionRule {
  /** Failure reason that triggers this rule */
  failureReason: AssignmentFailureReason;
  /** Optional validation details filter */
  validationFilter?: Partial<ValidationFailureDetails>;
  /** Priority of suggestions from this rule */
  priority: SuggestionPriority;
  /** Suggestion templates to generate */
  suggestions: DropSuggestionTemplate[];
}

/**
 * Template for generating dynamic suggestions
 */
export interface DropSuggestionTemplate {
  type: SuggestionType;
  titleTemplate: string;
  descriptionTemplate: string;
  actionTemplate?: string;
  iconKey?: string;
  /** Minimum priority threshold to show this suggestion */
  minPriorityThreshold?: SuggestionPriority;
  /** Stat-based conditions for showing this suggestion */
  statConditions?: {
    missingStats?: string[];
    blockedStats?: string[];
    anyOfMatched?: boolean;
  };
}

/**
 * AI suggestion generation context
 */
export interface SuggestionContext {
  residentId: string;
  activityId: string;
  failureReason: AssignmentFailureReason;
  validationDetails?: ValidationFailureDetails;
  residentStats?: Record<string, number>;
  activityRequirement?: {
    allOf?: string[];
    anyOf?: string[];
    noneOf?: string[];
  };
  availableActivities?: Array<{
    id: string;
    name: string;
    statRequirement?: { allOf?: string[]; anyOf?: string[]; noneOf?: string[] };
  }>;
}

/**
 * Default drop suggestion rules based on validation failures
 */
export const DEFAULT_DROP_SUGGESTION_RULES: DropSuggestionRule[] = [
  // Fatigue-related suggestions
  {
    failureReason: 'FATIGUE_THRESHOLD',
    priority: 'high',
    suggestions: [
      {
        type: 'REST_RESIDENT',
        titleTemplate: 'Rest Required',
        descriptionTemplate: 'This resident needs rest before continuing work.',
        actionTemplate: 'Move to rest area or wait for fatigue recovery',
        iconKey: 'sleep',
      },
    ],
  },

  // Stat requirement failures - detailed analysis
  {
    failureReason: 'VALIDATION_FAILED',
    priority: 'high',
    suggestions: [
      {
        type: 'STAT_UPGRADE',
        titleTemplate: 'Stat Upgrade Needed',
        descriptionTemplate: 'Missing required stats: {{missingStats}}. Consider leveling up or finding a better match.',
        iconKey: 'upgrade',
        statConditions: {
          missingStats: [], // Will be filled dynamically
        },
      },
      {
        type: 'ALTERNATIVE_ACTIVITY',
        titleTemplate: 'Try Different Activity',
        descriptionTemplate: 'This resident\'s stats don\'t match well. Try activities that require {{matchingStats}}.',
        actionTemplate: 'Drag to alternative activities',
        iconKey: 'swap',
      },
      {
        type: 'ACTIVITY_SWAP',
        titleTemplate: 'Swap with Better Match',
        descriptionTemplate: 'Another resident might be better suited for this activity.',
        actionTemplate: 'Look for residents with {{requiredStats}}',
        iconKey: 'exchange',
      },
    ],
  },

  // Availability issues
  {
    failureReason: 'RESIDENT_UNAVAILABLE',
    priority: 'medium',
    suggestions: [
      {
        type: 'WAITING_RESIDENT',
        titleTemplate: 'Resident Busy',
        descriptionTemplate: 'This resident is currently assigned to another activity.',
        actionTemplate: 'Wait for completion or reassign',
        iconKey: 'clock',
      },
    ],
  },

  // Scheduler conflicts
  {
    failureReason: 'SCHEDULER_REJECTED',
    priority: 'medium',
    suggestions: [
      {
        type: 'SCHEDULER_CONFLICT',
        titleTemplate: 'Schedule Conflict',
        descriptionTemplate: 'Scheduler prevents this assignment due to timing or capacity constraints.',
        actionTemplate: 'Check schedule conflicts or wait for availability',
        iconKey: 'calendar',
      },
    ],
  },

  // Success cases - positive suggestions
  {
    failureReason: 'RESIDENT_NOT_FOUND', // This is used as a proxy for success analysis
    priority: 'low',
    suggestions: [
      {
        type: 'PERFECT_MATCH',
        titleTemplate: 'Perfect Match!',
        descriptionTemplate: 'This resident\'s stats perfectly match the activity requirements.',
        iconKey: 'star',
      },
      {
        type: 'GOOD_MATCH',
        titleTemplate: 'Good Match',
        descriptionTemplate: 'Decent stat alignment, but could be improved.',
        iconKey: 'thumbs-up',
      },
    ],
  },
];

/**
 * Priority ordering for suggestion display
 */
export const SUGGESTION_PRIORITY_ORDER: Record<SuggestionPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Default configuration for the drop advisor system
 */
export interface DropAdvisorConfig {
  /** Enable AI suggestions */
  enabled: boolean;
  /** Maximum suggestions to show per drop */
  maxSuggestions: number;
  /** Minimum priority to show suggestions */
  minPriority: SuggestionPriority;
  /** Show positive suggestions on successful drops */
  showPositiveSuggestions: boolean;
  /** Enable activity alternatives in suggestions */
  enableActivityAlternatives: boolean;
  /** Stat threshold for "good match" vs "perfect match" */
  goodMatchThreshold: number;
  /** Rules for generating suggestions */
  rules: DropSuggestionRule[];
}

/**
 * Default drop advisor configuration
 */
export const DEFAULT_DROP_ADVISOR_CONFIG: DropAdvisorConfig = {
  enabled: true,
  maxSuggestions: 3,
  minPriority: 'low',
  showPositiveSuggestions: true,
  enableActivityAlternatives: true,
  goodMatchThreshold: 0.8,
  rules: DEFAULT_DROP_SUGGESTION_RULES,
};
