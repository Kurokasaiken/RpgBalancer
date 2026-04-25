/**
 * Location Drop Validator Helper
 * 
 * Helper utilities for validating location drop operations in Idle Village
 * based on KS-030 drag/drop plan with crew limits, fatigue thresholds,
 * and stat tag requirements.
 * 
 * @since NP-066 – Idle Village Location Drop Validator Helper
 */

import type {
  LocationType,
  ValidationResult,
  DropValidationContext,
  ValidationRule,
  DropValidationResult,
  LocationDropValidationConfig,
} from '../config/locationDropValidationConfig';
import {
  DEFAULT_LOCATION_DROP_VALIDATION_CONFIG,
  createSafeLocationDropValidationConfig,
  isValidDropValidationContext,
  isLocationTypeCompatible,
  isCrewSizeWithinLimits,
  isFatigueAcceptable,
  areStatTagsCompatible,
  isCapacityAcceptable,
} from '../config/locationDropValidationConfig';

/**
 * Built-in validation rules
 */
const BUILTIN_VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'crew_limit_check',
    name: 'Crew Limit Check',
    description: 'Validates that crew size is within location limits',
    type: 'crew_limit',
    validate: (context: DropValidationContext): ValidationResult => {
      const { withinLimits, overflow } = isCrewSizeWithinLimits(
        context.target.currentOccupants + 1,
        context.target.type,
        DEFAULT_LOCATION_DROP_VALIDATION_CONFIG
      );
      
      if (!withinLimits && !overflow) {
        return 'forbidden';
      } else if (!withinLimits && overflow) {
        return 'warning';
      }
      
      return 'allowed';
    },
    errorMessage: 'Cannot move resident: location is at maximum capacity',
    warningMessage: 'Location is near capacity limit',
    priority: 1,
    enabled: true,
  },
  {
    id: 'fatigue_threshold_check',
    name: 'Fatigue Threshold Check',
    description: 'Validates that resident fatigue level is acceptable',
    type: 'fatigue_threshold',
    validate: (context: DropValidationContext): ValidationResult => {
      const { acceptable } = isFatigueAcceptable(
        context.resident.fatigueLevel,
        DEFAULT_LOCATION_DROP_VALIDATION_CONFIG
      );
      
      return acceptable ? 'allowed' : 'forbidden';
    },
    errorMessage: 'Cannot move resident: fatigue level is too high',
    priority: 2,
    enabled: true,
  },
  {
    id: 'stat_tag_requirement_check',
    name: 'Stat Tag Requirement Check',
    description: 'Validates that resident has required stat tags for location',
    type: 'stat_tag_requirement',
    validate: (context: DropValidationContext): ValidationResult => {
      const { compatible } = areStatTagsCompatible(
        context.resident.tags,
        context.target.statTags,
        context.target.type,
        DEFAULT_LOCATION_DROP_VALIDATION_CONFIG
      );
      
      return compatible ? 'allowed' : 'forbidden';
    },
    errorMessage: 'Cannot move resident: missing required stat tags',
    priority: 3,
    enabled: true,
  },
  {
    id: 'location_compatibility_check',
    name: 'Location Compatibility Check',
    description: 'Validates that source and target locations are compatible',
    type: 'location_compatibility',
    validate: (context: DropValidationContext): ValidationResult => {
      const compatible = isLocationTypeCompatible(
        context.source.type,
        context.target.type,
        DEFAULT_LOCATION_DROP_VALIDATION_CONFIG
      );
      
      if (!compatible && !DEFAULT_LOCATION_DROP_VALIDATION_CONFIG.locationCompatibility.allowCrossTypeMoves) {
        return 'forbidden';
      } else if (!compatible && DEFAULT_LOCATION_DROP_VALIDATION_CONFIG.locationCompatibility.allowCrossTypeMoves) {
        return 'warning';
      }
      
      return 'allowed';
    },
    errorMessage: 'Cannot move resident: location types are incompatible',
    warningMessage: 'Moving between different location types',
    priority: 4,
    enabled: true,
  },
  {
    id: 'capacity_constraint_check',
    name: 'Capacity Constraint Check',
    description: 'Validates that target location has sufficient capacity',
    type: 'capacity_constraint',
    validate: (context: DropValidationContext): ValidationResult => {
      const { acceptable, overflow } = isCapacityAcceptable(
        context.target.currentOccupants,
        context.target.maxOccupants,
        DEFAULT_LOCATION_DROP_VALIDATION_CONFIG
      );
      
      if (!acceptable && !overflow) {
        return 'forbidden';
      } else if (!acceptable && overflow) {
        return 'warning';
      }
      
      return 'allowed';
    },
    errorMessage: 'Cannot move resident: insufficient capacity',
    warningMessage: 'Location is at maximum utilization',
    priority: 5,
    enabled: true,
  },
];

/**
 * Location Drop Validator class
 */
export class LocationDropValidator {
  private config: LocationDropValidationConfig;
  private customRules: ValidationRule[] = [];

  constructor(config?: Partial<LocationDropValidationConfig>) {
    this.config = createSafeLocationDropValidationConfig(config);
    this.customRules = this.config.customRules;
  }

  /**
   * Validate a drop operation
   */
  validateDrop(context: DropValidationContext): DropValidationResult {
    // Validate context
    if (!isValidDropValidationContext(context)) {
      return {
        result: 'forbidden',
        allowed: false,
        ruleResults: [],
        summary: 'Invalid validation context',
        explanation: 'The provided context does not match the required schema.',
        suggestions: ['Check that all required fields are present and correctly typed.'],
      };
    }

    // Get all enabled rules (built-in + custom)
    const allRules = [...BUILTIN_VALIDATION_RULES, ...this.customRules].filter(rule => rule.enabled);

    // Validate against all rules
    const ruleResults = allRules.map(rule => {
      const result = rule.validate(context);
      const message = result === 'forbidden' 
        ? rule.errorMessage 
        : result === 'warning' 
          ? (rule.warningMessage || rule.errorMessage)
          : 'Validation passed';

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        result,
        message,
      };
    });

    // Determine overall result
    const hasForbidden = ruleResults.some(r => r.result === 'forbidden');
    const hasWarnings = ruleResults.some(r => r.result === 'warning');
    
    let overallResult: ValidationResult;
    if (hasForbidden || (this.config.settings.warningsAsErrors && hasWarnings)) {
      overallResult = 'forbidden';
    } else if (hasWarnings) {
      overallResult = 'warning';
    } else {
      overallResult = 'allowed';
    }

    // Generate summary and explanation
    const { summary, explanation, suggestions } = this.generateSummaryAndExplanation(
      context,
      ruleResults,
      overallResult
    );

    return {
      result: overallResult,
      allowed: overallResult !== 'forbidden',
      ruleResults,
      summary,
      explanation,
      suggestions,
    };
  }

  /**
   * Validate drop operation with custom configuration
   */
  validateDropWithConfig(
    context: DropValidationContext,
    config: LocationDropValidationConfig
  ): DropValidationResult {
    const originalConfig = this.config;
    this.config = config;
    
    try {
      const result = this.validateDrop(context);
      return result;
    } finally {
      this.config = originalConfig;
    }
  }

  /**
   * Quick validation check (returns boolean)
   */
  isDropAllowed(context: DropValidationContext): boolean {
    const result = this.validateDrop(context);
    return result.allowed;
  }

  /**
   * Get validation rules for a specific context
   */
  getValidationRules(context: DropValidationContext): ValidationRule[] {
    return [...BUILTIN_VALIDATION_RULES, ...this.customRules].filter(rule => rule.enabled);
  }

  /**
   * Add custom validation rule
   */
  addCustomRule(rule: ValidationRule): void {
    this.customRules.push(rule);
  }

  /**
   * Remove custom validation rule
   */
  removeCustomRule(ruleId: string): boolean {
    const index = this.customRules.findIndex(rule => rule.id === ruleId);
    if (index >= 0) {
      this.customRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Enable or disable a validation rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = [...BUILTIN_VALIDATION_RULES, ...this.customRules].find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get configuration
   */
  getConfig(): LocationDropValidationConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LocationDropValidationConfig>): void {
    this.config = createSafeLocationDropValidationConfig({ ...this.config, ...config });
    this.customRules = this.config.customRules;
  }

  /**
   * Generate summary and explanation for validation results
   */
  private generateSummaryAndExplanation(
    context: DropValidationContext,
    ruleResults: Array<{
      ruleId: string;
      ruleName: string;
      result: ValidationResult;
      message: string;
    }>,
    overallResult: ValidationResult
  ): { summary: string; explanation: string; suggestions: string[] } {
    const failedRules = ruleResults.filter(r => r.result === 'forbidden');
    const warningRules = ruleResults.filter(r => r.result === 'warning');

    // Generate summary
    let summary: string;
    if (overallResult === 'allowed') {
      summary = 'Drop operation is allowed';
    } else if (overallResult === 'warning') {
      summary = `Drop operation allowed with ${warningRules.length} warning${warningRules.length === 1 ? '' : 's'}`;
    } else {
      summary = `Drop operation forbidden due to ${failedRules.length} violation${failedRules.length === 1 ? '' : 's'}`;
    }

    // Generate explanation
    const explanations: string[] = [];
    
    if (failedRules.length > 0) {
      explanations.push('The following validation rules failed:');
      failedRules.forEach(rule => {
        explanations.push(`- ${rule.name}: ${rule.message}`);
      });
    }

    if (warningRules.length > 0 && overallResult !== 'forbidden') {
      explanations.push('The following validation rules generated warnings:');
      warningRules.forEach(rule => {
        explanations.push(`- ${rule.name}: ${rule.message}`);
      });
    }

    if (explanations.length === 0) {
      explanations.push('All validation rules passed successfully.');
    }

    const explanation = explanations.join('\n');

    // Generate suggestions
    const suggestions: string[] = [];
    const maxSuggestions = this.config.settings.maxSuggestions;

    if (failedRules.length > 0 && suggestions.length < maxSuggestions) {
      // Crew limit suggestions
      const crewLimitRule = failedRules.find(r => r.ruleId === 'crew_limit_check');
      if (crewLimitRule && suggestions.length < maxSuggestions) {
        suggestions.push('Consider moving residents to locations with available capacity');
        suggestions.push('Remove some residents from the target location first');
      }

      // Fatigue suggestions
      const fatigueRule = failedRules.find(r => r.ruleId === 'fatigue_threshold_check');
      if (fatigueRule && suggestions.length < maxSuggestions) {
        suggestions.push('Allow resident to rest and recover fatigue before moving');
        suggestions.push('Consider moving to a location with better recovery options');
      }

      // Stat tag suggestions
      const statTagRule = failedRules.find(r => r.ruleId === 'stat_tag_requirement_check');
      if (statTagRule && suggestions.length < maxSuggestions) {
        suggestions.push('Train resident in required skills for the target location');
        suggestions.push('Consider a location that matches the resident\'s current skills');
      }

      // Location compatibility suggestions
      const compatibilityRule = failedRules.find(r => r.ruleId === 'location_compatibility_check');
      if (compatibilityRule && suggestions.length < maxSuggestions) {
        suggestions.push('Choose a compatible location type for the move');
        suggestions.push('Consider upgrading the target location to support the resident type');
      }

      // Capacity suggestions
      const capacityRule = failedRules.find(r => r.ruleId === 'capacity_constraint_check');
      if (capacityRule && suggestions.length < maxSuggestions) {
        suggestions.push('Free up space in the target location');
        suggestions.push('Consider a location with more available capacity');
      }
    }

    return { summary, explanation, suggestions };
  }

  /**
   * Get validation statistics
   */
  getValidationStatistics(): {
    totalRules: number;
    enabledRules: number;
    customRules: number;
    builtinRules: number;
  } {
    const allRules = [...BUILTIN_VALIDATION_RULES, ...this.customRules];
    const enabledRules = allRules.filter(rule => rule.enabled);
    
    return {
      totalRules: allRules.length,
      enabledRules: enabledRules.length,
      customRules: this.customRules.length,
      builtinRules: BUILTIN_VALIDATION_RULES.length,
    };
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = DEFAULT_LOCATION_DROP_VALIDATION_CONFIG;
    this.customRules = [];
  }

  /**
   * Export current configuration
   */
  exportConfig(): LocationDropValidationConfig {
    return { ...this.config };
  }

  /**
   * Import configuration
   */
  importConfig(config: Partial<LocationDropValidationConfig>): void {
    this.config = createSafeLocationDropValidationConfig(config);
    this.customRules = this.config.customRules;
  }
}

/**
 * Create location drop validator with default configuration
 */
export function createLocationDropValidator(
  config?: Partial<LocationDropValidationConfig>
): LocationDropValidator {
  return new LocationDropValidator(config);
}

/**
 * Quick validation function (convenience method)
 */
export function validateLocationDrop(
  context: DropValidationContext,
  config?: Partial<LocationDropValidationConfig>
): DropValidationResult {
  const validator = createLocationDropValidator(config);
  return validator.validateDrop(context);
}

/**
 * Quick validation check (convenience method)
 */
export function isLocationDropAllowed(
  context: DropValidationContext,
  config?: Partial<LocationDropValidationConfig>
): boolean {
  const validator = createLocationDropValidator(config);
  return validator.isDropAllowed(context);
}

/**
 * Create validation context from minimal data
 */
export function createValidationContext(
  sourceId: string,
  sourceType: LocationType,
  targetId: string,
  targetType: LocationType,
  residentId: string,
  residentName: string,
  currentOccupants: number = 0,
  maxOccupants: number = 4,
  fatigueLevel: number = 0,
  residentTags: string[] = [],
  locationTags: string[] = [],
  residentStats: Record<string, number> = {}
): DropValidationContext {
  return {
    source: {
      id: sourceId,
      type: sourceType,
      currentOccupants,
      maxOccupants,
      fatigueLevel,
      statTags: locationTags,
    },
    target: {
      id: targetId,
      type: targetType,
      currentOccupants,
      maxOccupants,
      fatigueLevel,
      statTags: locationTags,
    },
    resident: {
      id: residentId,
      name: residentName,
      stats: residentStats,
      tags: residentTags,
      fatigueLevel,
    },
  };
}

/**
 * Get validation rule by ID
 */
export function getValidationRule(ruleId: string): ValidationRule | null {
  return [...BUILTIN_VALIDATION_RULES].find(rule => rule.id === ruleId) || null;
}

/**
 * Get all built-in validation rules
 */
export function getBuiltinValidationRules(): ValidationRule[] {
  return [...BUILTIN_VALIDATION_RULES];
}

/**
 * Check if validation rule exists
 */
export function hasValidationRule(ruleId: string): boolean {
  return getValidationRule(ruleId) !== null;
}

export {
  LocationDropValidator as default,
};
