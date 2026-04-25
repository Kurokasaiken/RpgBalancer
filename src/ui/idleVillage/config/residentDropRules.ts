/**
 * Config-first validation rules for resident drop operations in Idle Village Phase E.
 * 
 * This file defines all validation logic for drag-and-drop operations,
 * centralizing rules for stat requirements, fatigue thresholds, crew limits,
 * and other constraints that determine whether a resident can be assigned
 * to a particular activity or location.
 * 
 * All values are configurable through the balancing config system,
 * following the RPG Balancer philosophy of no hardcoded numbers.
 */

import type { ActivityDefinition, StatRequirement } from '@/balancing/config/idleVillage/types';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { evaluateStatRequirement } from '@/engine/game/idleVillage/statMatching';

/**
 * Validation rule types for resident drop operations.
 */
export type DropValidationRule = 
  | 'stat_requirement_allOf'
  | 'stat_requirement_anyOf' 
  | 'stat_requirement_noneOf'
  | 'fatigue_threshold'
  | 'crew_capacity'
  | 'resident_availability'
  | 'slot_locked'
  | 'scheduler_rejection';

/**
 * Detailed validation result for a drop operation.
 */
export interface DropValidationResult {
  /** Whether the drop is valid */
  isValid: boolean;
  /** Primary rule that failed validation (if any) */
  failedRule?: DropValidationRule;
  /** Human-readable error message */
  message?: string;
  /** Additional metadata for UI feedback */
  meta?: {
    /** Missing stat requirements for allOf rules */
    missingStats?: string[];
    /** Current vs threshold fatigue values */
    fatigue?: {
      current: number;
      threshold: number;
      previous?: number;
      timeSinceLastEvent?: number;
      sessionEventCount?: number;
    };
    /** Crew capacity information */
    crew?: {
      capacity: number;
      occupied: number;
      requested: number;
    };
    /** Resident status information */
    resident?: {
      id: string;
      status: string;
    };
  };
}

/**
 * Configuration for drop validation rules.
 * All values should come from the balancing config system.
 */
export interface ResidentDropRulesConfig {
  /** Maximum fatigue percentage before resident is too exhausted */
  maxFatigueBeforeExhausted: number;
  /** Default crew size for activities that don't specify one */
  defaultCrewSize: number;
  /** Whether to enable strict stat requirement validation */
  enableStatValidation: boolean;
  /** Whether to enable fatigue validation */
  enableFatigueValidation: boolean;
  /** Whether to enable crew capacity validation */
  enableCrewValidation: boolean;
}

/**
 * Default configuration values.
 * In production, these should be overridden by values from the balancing config.
 */
export const DEFAULT_DROP_RULES_CONFIG: ResidentDropRulesConfig = {
  maxFatigueBeforeExhausted: 90,
  defaultCrewSize: 1,
  enableStatValidation: true,
  enableFatigueValidation: true,
  enableCrewValidation: true,
};

/**
 * Validates stat requirements for a resident assignment.
 * 
 * @param resident - The resident being validated
 * @param statRequirement - Stat requirements from the activity definition
 * @param config - Validation configuration
 * @returns Validation result for stat requirements
 */
export function validateStatRequirements(
  resident: ResidentState,
  statRequirement: StatRequirement | undefined,
  config: ResidentDropRulesConfig
): DropValidationResult {
  if (!config.enableStatValidation || !statRequirement) {
    return { isValid: true };
  }

  const evaluation = evaluateStatRequirement(resident, statRequirement);
  
  if (!evaluation.matches) {
    const missingStats: string[] = [];
    
    if (evaluation.missingAllOf) {
      missingStats.push(...evaluation.missingAllOf.map((stat: string) => `${stat} (required)`));
    }
    
    if (!evaluation.anyOfMatched && statRequirement.anyOf) {
      missingStats.push(...statRequirement.anyOf.map((stat: string) => `${stat} (any of)`));
    }

    return {
      isValid: false,
      failedRule: evaluation.missingAllOf.length > 0 ? 'stat_requirement_allOf' : 'stat_requirement_anyOf',
      message: `Stat requirements not met: ${missingStats.join(', ')}`,
      meta: {
        missingStats,
      },
    };
  }

  return { isValid: true };
}

/**
 * Validates fatigue threshold for a resident.
 * 
 * @param resident - The resident being validated
 * @param config - Validation configuration
 * @returns Validation result for fatigue
 */
export function validateFatigueThreshold(
  resident: ResidentState,
  config: ResidentDropRulesConfig
): DropValidationResult {
  if (!config.enableFatigueValidation) {
    return { isValid: true };
  }

  const fatiguePercent = (resident.fatigue / 100) * 100;
  
  if (fatiguePercent > config.maxFatigueBeforeExhausted) {
    return {
      isValid: false,
      failedRule: 'fatigue_threshold',
      message: `Resident too exhausted (${fatiguePercent.toFixed(1)}% > ${config.maxFatigueBeforeExhausted}%)`,
      meta: {
        fatigue: {
          current: fatiguePercent,
          threshold: config.maxFatigueBeforeExhausted,
        },
      },
    };
  }

  return { isValid: true };
}

/**
 * Validates crew capacity for an activity.
 * 
 * @param currentOccupants - Number of residents currently assigned
 * @param maxCrewSize - Maximum crew size for the activity
 * @param config - Validation configuration
 * @returns Validation result for crew capacity
 */
export function validateCrewCapacity(
  currentOccupants: number,
  maxCrewSize: number,
  config: ResidentDropRulesConfig
): DropValidationResult {
  if (!config.enableCrewValidation) {
    return { isValid: true };
  }

  if (currentOccupants >= maxCrewSize) {
    return {
      isValid: false,
      failedRule: 'crew_capacity',
      message: `Activity at full capacity (${currentOccupants}/${maxCrewSize})`,
      meta: {
        crew: {
          capacity: maxCrewSize,
          occupied: currentOccupants,
          requested: 1,
        },
      },
    };
  }

  return { isValid: true };
}

/**
 * Validates resident availability status.
 * 
 * @param resident - The resident being validated
 * @returns Validation result for resident availability
 */
export function validateResidentAvailability(
  resident: ResidentState
): DropValidationResult {
  if (resident.status !== 'available') {
    return {
      isValid: false,
      failedRule: 'resident_availability',
      message: `Resident not available (status: ${resident.status})`,
      meta: {
        resident: {
          id: resident.id,
          status: resident.status,
        },
      },
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive validation for a resident drop operation.
 * 
 * @param params - Validation parameters
 * @returns Complete validation result
 */
export function validateResidentDrop(params: {
  resident: ResidentState;
  activity?: ActivityDefinition;
  currentOccupants?: number;
  config?: Partial<ResidentDropRulesConfig>;
}): DropValidationResult {
  const config = { ...DEFAULT_DROP_RULES_CONFIG, ...params.config };
  const { resident, activity, currentOccupants = 0 } = params;

  // Check resident availability first
  const availabilityResult = validateResidentAvailability(resident);
  if (!availabilityResult.isValid) {
    return availabilityResult;
  }

  // Check fatigue threshold
  const fatigueResult = validateFatigueThreshold(resident, config);
  if (!fatigueResult.isValid) {
    return fatigueResult;
  }

  // Check stat requirements if activity is specified
  if (activity) {
    const statResult = validateStatRequirements(resident, activity.statRequirement, config);
    if (!statResult.isValid) {
      return statResult;
    }

    // Check crew capacity
    const maxCrewSize = activity.maxSlots === 'infinite' ? Number.MAX_SAFE_INTEGER : (activity.maxSlots ?? config.defaultCrewSize);
    const crewResult = validateCrewCapacity(currentOccupants, maxCrewSize, config);
    if (!crewResult.isValid) {
      return crewResult;
    }
  }

  return { isValid: true };
}

/**
 * Creates a drop validation function bound to a specific configuration.
 * Useful for React hooks that need a stable validation function.
 * 
 * @param config - Validation configuration
 * @returns Bound validation function
 */
export function createDropValidator(config: Partial<ResidentDropRulesConfig>) {
  const finalConfig = { ...DEFAULT_DROP_RULES_CONFIG, ...config };
  
  return (params: Omit<Parameters<typeof validateResidentDrop>[0], 'config'>) =>
    validateResidentDrop({ ...params, config: finalConfig });
}
