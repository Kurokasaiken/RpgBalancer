/**
 * React hook for validating resident drop operations in Idle Village Phase E.
 * 
 * This hook provides a centralized, config-first way to validate drag-and-drop
 * operations for residents being assigned to activities or locations. It integrates
 * with the balancing config system and provides telemetry for validation events.
 * 
 * Features:
 * - Config-first validation rules
 * - Real-time validation feedback
 * - Telemetry integration for tracking validation events
 * - Support for multiple validation contexts (activity slots, locations, etc.)
 */

import { useCallback, useMemo } from 'react';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { createSandboxDiagnostics } from '@/ui/idleVillage/utils/sandboxDiagnostics';
import { trackFatigueTelemetry, createFatigueTelemetryPayload } from '@/analytics/telemetry/telemetryProvider';
import type {
  DropValidationResult,
  DropValidationRule,
  ResidentDropRulesConfig,
} from '@/ui/idleVillage/config/residentDropRules';
import { createDropValidator, DEFAULT_DROP_RULES_CONFIG } from '@/ui/idleVillage/config/residentDropRules';
import { useAITutor } from './useAITutor';
import type { DropSuggestion } from '../ai/dropSuggestionEngine';

/**
 * Parameters for the useResidentDropValidation hook.
 */
export interface UseResidentDropValidationParams {
  /** Configuration for validation rules */
  config?: Partial<ResidentDropRulesConfig>;
  /** Optional custom validation function */
  customValidator?: (params: {
    resident: ResidentState;
    activity?: ActivityDefinition;
    currentOccupants?: number;
  }) => DropValidationResult;
  /** Whether to enable telemetry logging */
  enableTelemetry?: boolean;
  /** AI Tutor configuration */
  tutorConfig?: {
    /** Enable AI tutor mode */
    enabled?: boolean;
    /** Tutor detail level */
    detailLevel?: 'basic' | 'intermediate' | 'advanced';
    /** Show learning tips */
    showLearningTips?: boolean;
  };
}

/**
 * Return value for the useResidentDropValidation hook.
 */
export interface UseResidentDropValidationReturn {
  /** Validates a resident drop operation */
  validateDrop: (params: {
    resident: ResidentState;
    activity?: ActivityDefinition;
    currentOccupants?: number;
    context?: string;
  }) => DropValidationResult;
  
  /** Validates multiple residents for batch operations */
  validateBatchDrop: (params: {
    residents: ResidentState[];
    activity?: ActivityDefinition;
    currentOccupants?: number;
    context?: string;
  }) => DropValidationResult[];
  
  /** Gets a human-readable error message for a validation rule */
  getErrorMessage: (rule: DropValidationRule, meta?: Record<string, unknown>) => string;
  
  /** Checks if a resident is eligible for an activity (quick boolean check) */
  isResidentEligible: (resident: ResidentState, activity?: ActivityDefinition) => boolean;
  
  /** Current validation configuration */
  config: ResidentDropRulesConfig;

  /** AI Tutor functionality */
  tutor: {
    /** Whether tutor mode is enabled */
    isEnabled: boolean;
    /** Set tutor mode enabled/disabled */
    setEnabled: (enabled: boolean) => void;
    /** Get AI suggestions for a resident */
    getSuggestionsForResident: (resident: ResidentState) => DropSuggestion[];
    /** Get AI suggestions for an activity */
    getSuggestionsForActivity: (activity: ActivityDefinition) => DropSuggestion[];
    /** Explain a suggestion with AI tutor */
    explainSuggestion: (suggestion: DropSuggestion) => void;
    /** Accept current tutor suggestion */
    acceptTutorSuggestion: () => void;
    /** Reject current tutor suggestion */
    rejectTutorSuggestion: () => void;
    /** Close tutor panel */
    closeTutor: () => void;
  };
}

/**
 * Default error messages for validation rules.
 * These can be overridden by the activity definition or custom logic.
 */
const DEFAULT_ERROR_MESSAGES: Record<DropValidationRule, string> = {
  stat_requirement_allOf: 'This resident does not meet the required stats.',
  stat_requirement_anyOf: 'This resident lacks the necessary stats.',
  stat_requirement_noneOf: 'This resident has incompatible stats.',
  fatigue_threshold: 'This resident is too exhausted to work.',
  crew_capacity: 'This activity is already at full capacity.',
  resident_availability: 'This resident is not available.',
  slot_locked: 'This slot is currently locked.',
  scheduler_rejection: 'The assignment was rejected by the scheduler.',
};

/**
 * Hook for validating resident drop operations with config-first rules.
 * 
 * @param params - Hook parameters
 * @returns Validation utilities and state
 */
export function useResidentDropValidation(params: UseResidentDropValidationParams = {}): UseResidentDropValidationReturn {
  const { config: userConfig, customValidator, enableTelemetry = true, tutorConfig } = params;

  // Initialize diagnostics for telemetry
  const diagnostics = useMemo(() => {
    return enableTelemetry ? createSandboxDiagnostics('resident-drop-validation') : null;
  }, [enableTelemetry]);

  // Initialize AI Tutor
  const aiTutor = useAITutor({
    defaultEnabled: tutorConfig?.enabled || false,
    tutorConfig: {
      detailLevel: tutorConfig?.detailLevel || 'intermediate',
      enableLearningMode: tutorConfig?.showLearningTips || false,
    },
    enableTelemetry: enableTelemetry,
  });

  // Create bound validator with user config
  const validator = useMemo(() => {
    if (customValidator) {
      return customValidator;
    }
    
    return createDropValidator(userConfig ?? {});
  }, [customValidator, userConfig]);

  /**
   * Validates a single resident drop operation.
   */
  const validateDrop = useCallback((
    params: {
      resident: ResidentState;
      activity?: ActivityDefinition;
      currentOccupants?: number;
      context?: string;
    }
  ): DropValidationResult => {
    const result = validator({
      resident: params.resident,
      activity: params.activity,
      currentOccupants: params.currentOccupants,
    });

    // Log telemetry event
    if (diagnostics && params.context) {
      if (result.isValid) {
        diagnostics.info('idle_drop_validation_success', {
          residentId: params.resident.id,
          activityId: params.activity?.id,
          context: params.context,
        });
      } else {
        diagnostics.warn('idle_drop_validation_failure', {
          residentId: params.resident.id,
          activityId: params.activity?.id,
          context: params.context,
          failedRule: result.failedRule,
          message: result.message,
        });

        // Emit fatigue threshold telemetry if applicable
        if (result.failedRule === 'fatigue_threshold' && result.meta) {
          const fatigue = (result.meta as DropValidationResult['meta'])?.fatigue;

          if (typeof fatigue?.current === 'number' && typeof fatigue?.threshold === 'number') {
            const eventType = fatigue.current >= fatigue.threshold * 1.5 
              ? 'fatigue_threshold_block' 
              : 'fatigue_threshold_warn';
            
            const fatiguePayload = createFatigueTelemetryPayload(
              params.resident.id,
              params.activity?.id,
              fatigue.current,
              fatigue.threshold,
              params.context,
              {
                previousFatigue: fatigue.previous,
                timeSinceLastEvent: fatigue.timeSinceLastEvent,
                sessionEventCount: fatigue.sessionEventCount || 1,
                activityType: params.activity?.tags?.[0] || 'unknown',
                residentStats: {
                  fatigue: params.resident.fatigue || 0,
                  status: params.resident.status,
                  ...(params.resident.statSnapshot || {}),
                } as unknown as Record<string, number>,
              }
            );
            
            trackFatigueTelemetry(eventType, fatiguePayload);
          }
        }
      }
    }

    return result;
  }, [validator, diagnostics]);

  /**
   * Validates multiple residents for batch operations.
   */
  const validateBatchDrop = useCallback((
    params: {
      residents: ResidentState[];
      activity?: ActivityDefinition;
      currentOccupants?: number;
      context?: string;
    }
  ): DropValidationResult[] => {
    return params.residents.map(resident => 
      validateDrop({
        resident,
        activity: params.activity,
        currentOccupants: params.currentOccupants,
        context: params.context,
      })
    );
  }, [validateDrop]);

  /**
   * Gets a human-readable error message for a validation rule.
   */
  const getErrorMessage = useCallback((
    rule: DropValidationRule,
    meta?: Record<string, unknown>
  ): string => {
    // Check if activity has custom error message
    if (meta && 'activity' in meta) {
      const activity = meta.activity as {
        customErrorMessages?: Record<string, string>;
      };
      if (activity.customErrorMessages?.[rule]) {
        return activity.customErrorMessages[rule];
      }
    }

    // Use default message
    const baseMessage = DEFAULT_ERROR_MESSAGES[rule];
    
    // Add context from metadata if available
    if (meta && 'fatigue' in meta) {
      const fatigue = meta.fatigue as {
        current?: number;
        threshold?: number;
      };
      if (fatigue?.current && fatigue?.threshold) {
        return `${baseMessage} (${fatigue.current.toFixed(1)}% > ${fatigue.threshold}%)`;
      }
    }
    
    if (meta && 'crew' in meta) {
      const crew = meta.crew as {
        occupied?: number;
        capacity?: number;
      };
      if (crew?.occupied && crew?.capacity) {
        return `${baseMessage} (${crew.occupied}/${crew.capacity})`;
      }
    }
    
    if (meta && 'missingStats' in meta) {
      const missingStats = meta.missingStats as string[];
      if (Array.isArray(missingStats) && missingStats.length > 0) {
        return `${baseMessage} Missing: ${missingStats.join(', ')}`;
      }
    }
    
    return baseMessage;
  }, []);

  /**
   * Quick boolean check for resident eligibility.
   */
  const isResidentEligible = useCallback((
    resident: ResidentState,
    activity?: ActivityDefinition
  ): boolean => {
    const result = validateDrop({
      resident,
      activity,
      context: 'eligibility_check',
    });
    return result.isValid;
  }, [validateDrop]);

  // Final configuration (merged with defaults)
  const config = useMemo(() => {
    return { ...DEFAULT_DROP_RULES_CONFIG, ...userConfig };
  }, [userConfig]);

  return {
    validateDrop,
    validateBatchDrop,
    getErrorMessage,
    isResidentEligible,
    config,
    tutor: {
      isEnabled: aiTutor.isEnabled,
      setEnabled: aiTutor.setEnabled,
      getSuggestionsForResident: (resident: ResidentState) => {
        // Create a basic village context for suggestions
        const context = {
          residents: [resident], // Would need full village state in real implementation
          activities: [], // Would need available activities
          resourceLevels: {},
          resourceNeeds: {},
          currentAssignments: {},
          villageState: { day: 1, season: 'spring' },
        };
        return aiTutor.getSuggestionsForResident(resident, context);
      },
      getSuggestionsForActivity: (activity: ActivityDefinition) => {
        // Create a basic village context for suggestions
        const context = {
          residents: [], // Would need available residents
          activities: [activity],
          resourceLevels: {},
          resourceNeeds: {},
          currentAssignments: {},
          villageState: { day: 1, season: 'spring' },
        };
        return aiTutor.getSuggestionsForActivity(activity, context);
      },
      explainSuggestion: aiTutor.explainSuggestion,
      acceptTutorSuggestion: aiTutor.acceptSuggestion,
      rejectTutorSuggestion: aiTutor.rejectSuggestion,
      closeTutor: aiTutor.closeTutor,
    },
  };
}
