/**
 * Location Drop Validation Configuration
 * 
 * Config-first validation rules for Idle Village location drop operations
 * based on KS-030 drag/drop plan with crew limits, fatigue thresholds,
 * and stat tag requirements.
 * 
 * @since NP-066 – Idle Village Location Drop Validator Helper
 */

import { z } from 'zod';

/**
 * Location types for validation
 */
export type LocationType = 'residential' | 'commercial' | 'industrial' | 'recreational' | 'special';

/**
 * Validation result types
 */
export type ValidationResult = 'allowed' | 'forbidden' | 'warning';

/**
 * Drop validation context
 */
export interface DropValidationContext {
  /** Source location information */
  source: {
    id: string;
    type: LocationType;
    currentOccupants: number;
    maxOccupants: number;
    fatigueLevel: number;
    statTags: string[];
  };
  /** Target location information */
  target: {
    id: string;
    type: LocationType;
    currentOccupants: number;
    maxOccupants: number;
    fatigueLevel: number;
    statTags: string[];
  };
  /** Resident being moved */
  resident: {
    id: string;
    name: string;
    stats: Record<string, number>;
    tags: string[];
    fatigueLevel: number;
  };
}

/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule type */
  type: 'crew_limit' | 'fatigue_threshold' | 'stat_tag_requirement' | 'location_compatibility' | 'capacity_constraint';
  /** Validation function */
  validate: (context: DropValidationContext) => ValidationResult;
  /** Error message template */
  errorMessage: string;
  /** Warning message template */
  warningMessage?: string;
  /** Rule priority */
  priority: number;
  /** Whether rule is enabled */
  enabled: boolean;
}

/**
 * Validation result
 */
export interface DropValidationResult {
  /** Overall validation result */
  result: ValidationResult;
  /** Whether the drop is allowed */
  allowed: boolean;
  /** Validation results for each rule */
  ruleResults: Array<{
    ruleId: string;
    ruleName: string;
    result: ValidationResult;
    message: string;
  }>;
  /** Summary message */
  summary: string;
  /** Detailed explanation */
  explanation: string;
  /** Suggestions for fixing issues */
  suggestions: string[];
}

/**
 * Location validation configuration
 */
export interface LocationDropValidationConfig {
  /** Global validation settings */
  settings: {
    /** Enable strict validation */
    strictMode: boolean;
    /** Show warnings as errors */
    warningsAsErrors: boolean;
    /** Maximum number of suggestions */
    maxSuggestions: number;
    /** Enable detailed explanations */
    detailedExplanations: boolean;
  };
  /** Crew limit rules */
  crewLimits: {
    /** Minimum crew size for residential locations */
    residentialMin: number;
    /** Maximum crew size for residential locations */
    residentialMax: number;
    /** Minimum crew size for commercial locations */
    commercialMin: number;
    /** Maximum crew size for commercial locations */
    commercialMax: number;
    /** Minimum crew size for industrial locations */
    industrialMin: number;
    /** Maximum crew size for industrial locations */
    industrialMax: number;
    /** Allow overflow beyond limits */
    allowOverflow: boolean;
    /** Overflow tolerance percentage */
    overflowTolerance: number;
  };
  /** Fatigue threshold rules */
  fatigueThresholds: {
    /** Maximum fatigue level for moves */
    maxFatigueLevel: number;
    /** High fatigue threshold */
    highFatigueThreshold: number;
    /** Critical fatigue threshold */
    criticalFatigueThreshold: number;
    /** Fatigue recovery bonus */
    fatigueRecoveryBonus: number;
    /** Enable fatigue-based restrictions */
    enableFatigueRestrictions: boolean;
  };
  /** Stat tag requirements */
  statTagRequirements: {
    /** Required stat tags for residential locations */
    residentialRequired: string[];
    /** Required stat tags for commercial locations */
    commercialRequired: string[];
    /** Required stat tags for industrial locations */
    industrialRequired: string[];
    /** Forbidden stat tags for all locations */
    forbidden: string[];
    /** Allow partial tag matching */
    allowPartialMatching: boolean;
    /** Minimum tag match percentage */
    minTagMatchPercentage: number;
  };
  /** Location compatibility rules */
  locationCompatibility: {
    /** Compatible location type mappings */
    compatibleTypes: Record<LocationType, LocationType[]>;
    /** Incompatible location type mappings */
    incompatibleTypes: Record<LocationType, LocationType[]>;
    /** Allow cross-type moves */
    allowCrossTypeMoves: boolean;
    /** Cross-type move penalty */
    crossTypeMovePenalty: number;
  };
  /** Capacity constraints */
  capacityConstraints: {
    /** Minimum free capacity required */
    minFreeCapacity: number;
    /** Maximum utilization percentage */
    maxUtilizationPercentage: number;
    /** Allow temporary overflow */
    allowTemporaryOverflow: boolean;
    /** Temporary overflow duration */
    temporaryOverflowDuration: number;
  };
  /** Custom validation rules */
  customRules: ValidationRule[];
}

/**
 * Zod schema for LocationType
 */
const LocationTypeSchema = z.enum(['residential', 'commercial', 'industrial', 'recreational', 'special']);

/**
 * Zod schema for ValidationResult
 */
const ValidationResultSchema = z.enum(['allowed', 'forbidden', 'warning']);

/**
 * Zod schema for DropValidationContext
 */
const DropValidationContextSchema = z.object({
  source: z.object({
    id: z.string(),
    type: LocationTypeSchema,
    currentOccupants: z.number(),
    maxOccupants: z.number(),
    fatigueLevel: z.number(),
    statTags: z.array(z.string()),
  }),
  target: z.object({
    id: z.string(),
    type: LocationTypeSchema,
    currentOccupants: z.number(),
    maxOccupants: z.number(),
    fatigueLevel: z.number(),
    statTags: z.array(z.string()),
  }),
  resident: z.object({
    id: z.string(),
    name: z.string(),
    stats: z.record(z.number()),
    tags: z.array(z.string()),
    fatigueLevel: z.number(),
  }),
});

/**
 * Zod schema for ValidationRule
 */
const ValidationRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['crew_limit', 'fatigue_threshold', 'stat_tag_requirement', 'location_compatibility', 'capacity_constraint']),
  validate: z.function(),
  errorMessage: z.string(),
  warningMessage: z.string().optional(),
  priority: z.number(),
  enabled: z.boolean(),
});

/**
 * Zod schema for LocationDropValidationConfig
 */
const LocationDropValidationConfigSchema = z.object({
  settings: z.object({
    strictMode: z.boolean(),
    warningsAsErrors: z.boolean(),
    maxSuggestions: z.number(),
    detailedExplanations: z.boolean(),
  }),
  crewLimits: z.object({
    residentialMin: z.number(),
    residentialMax: z.number(),
    commercialMin: z.number(),
    commercialMax: z.number(),
    industrialMin: z.number(),
    industrialMax: z.number(),
    allowOverflow: z.boolean(),
    overflowTolerance: z.number(),
  }),
  fatigueThresholds: z.object({
    maxFatigueLevel: z.number(),
    highFatigueThreshold: z.number(),
    criticalFatigueThreshold: z.number(),
    fatigueRecoveryBonus: z.number(),
    enableFatigueRestrictions: z.boolean(),
  }),
  statTagRequirements: z.object({
    residentialRequired: z.array(z.string()),
    commercialRequired: z.array(z.string()),
    industrialRequired: z.array(z.string()),
    forbidden: z.array(z.string()),
    allowPartialMatching: z.boolean(),
    minTagMatchPercentage: z.number(),
  }),
  locationCompatibility: z.object({
    compatibleTypes: z.record(LocationTypeSchema, z.array(LocationTypeSchema)),
    incompatibleTypes: z.record(LocationTypeSchema, z.array(LocationTypeSchema)),
    allowCrossTypeMoves: z.boolean(),
    crossTypeMovePenalty: z.number(),
  }),
  capacityConstraints: z.object({
    minFreeCapacity: z.number(),
    maxUtilizationPercentage: z.number(),
    allowTemporaryOverflow: z.boolean(),
    temporaryOverflowDuration: z.number(),
  }),
  customRules: z.array(ValidationRuleSchema),
});

/**
 * Default location drop validation configuration
 */
export const DEFAULT_LOCATION_DROP_VALIDATION_CONFIG: LocationDropValidationConfig = {
  settings: {
    strictMode: true,
    warningsAsErrors: false,
    maxSuggestions: 5,
    detailedExplanations: true,
  },
  crewLimits: {
    residentialMin: 1,
    residentialMax: 4,
    commercialMin: 1,
    commercialMax: 6,
    industrialMin: 2,
    industrialMax: 8,
    allowOverflow: true,
    overflowTolerance: 0.2, // 20%
  },
  fatigueThresholds: {
    maxFatigueLevel: 80,
    highFatigueThreshold: 60,
    criticalFatigueThreshold: 75,
    fatigueRecoveryBonus: 10,
    enableFatigueRestrictions: true,
  },
  statTagRequirements: {
    residentialRequired: ['housing', 'basic_needs'],
    commercialRequired: ['commerce', 'services'],
    industrialRequired: ['production', 'manufacturing'],
    forbidden: ['toxic', 'hazardous', 'contaminated'],
    allowPartialMatching: true,
    minTagMatchPercentage: 0.5, // 50%
  },
  locationCompatibility: {
    compatibleTypes: {
      residential: ['residential', 'recreational'],
      commercial: ['commercial', 'recreational'],
      industrial: ['industrial'],
      recreational: ['residential', 'commercial', 'recreational'],
      special: ['residential', 'commercial', 'industrial', 'recreational', 'special'],
    },
    incompatibleTypes: {
      industrial: ['residential'],
      residential: ['industrial'],
      commercial: [],
      recreational: [],
      special: [],
    },
    allowCrossTypeMoves: true,
    crossTypeMovePenalty: 10,
  },
  capacityConstraints: {
    minFreeCapacity: 1,
    maxUtilizationPercentage: 0.9, // 90%
    allowTemporaryOverflow: true,
    temporaryOverflowDuration: 300000, // 5 minutes
  },
  customRules: [],
};

/**
 * Create safe location drop validation configuration
 */
export function createSafeLocationDropValidationConfig(
  config?: Partial<LocationDropValidationConfig>
): LocationDropValidationConfig {
  const merged = { ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG, ...config };
  
  const result = LocationDropValidationConfigSchema.safeParse(merged);
  if (!result.success) {
    console.warn('Invalid location drop validation config:', result.error);
    return DEFAULT_LOCATION_DROP_VALIDATION_CONFIG;
  }
  
  return result.data;
}

/**
 * Validate location drop validation configuration
 */
export function isValidLocationDropValidationConfig(config: unknown): config is LocationDropValidationConfig {
  return LocationDropValidationConfigSchema.safeParse(config).success;
}

/**
 * Validate drop validation context
 */
export function isValidDropValidationContext(context: unknown): context is DropValidationContext {
  return DropValidationContextSchema.safeParse(context).success;
}

/**
 * Check if location type is compatible
 */
export function isLocationTypeCompatible(
  sourceType: LocationType,
  targetType: LocationType,
  config: LocationDropValidationConfig
): boolean {
  const compatible = config.locationCompatibility.compatibleTypes[sourceType] || [];
  const incompatible = config.locationCompatibility.incompatibleTypes[sourceType] || [];
  
  return compatible.includes(targetType) && !incompatible.includes(targetType);
}

/**
 * Check if crew size is within limits
 */
export function isCrewSizeWithinLimits(
  crewSize: number,
  locationType: LocationType,
  config: LocationDropValidationConfig
): { withinLimits: boolean; overflow: boolean } {
  const limits = config.crewLimits;
  
  let minLimit = 1;
  let maxLimit = 10;
  
  switch (locationType) {
    case 'residential':
      minLimit = limits.residentialMin;
      maxLimit = limits.residentialMax;
      break;
    case 'commercial':
      minLimit = limits.commercialMin;
      maxLimit = limits.commercialMax;
      break;
    case 'industrial':
      minLimit = limits.industrialMin;
      maxLimit = limits.industrialMax;
      break;
    case 'recreational':
      minLimit = 1;
      maxLimit = 8;
      break;
    case 'special':
      minLimit = 1;
      maxLimit = 10;
      break;
  }
  
  const withinLimits = crewSize >= minLimit && crewSize <= maxLimit;
  const overflow = crewSize > maxLimit && config.crewLimits.allowOverflow;
  
  return { withinLimits, overflow };
}

/**
 * Check if fatigue level is acceptable
 */
export function isFatigueAcceptable(
  fatigueLevel: number,
  config: LocationDropValidationConfig
): { acceptable: boolean; level: 'normal' | 'high' | 'critical' } {
  if (!config.fatigueThresholds.enableFatigueRestrictions) {
    return { acceptable: true, level: 'normal' };
  }
  
  const { highFatigueThreshold, criticalFatigueThreshold, maxFatigueLevel } = config.fatigueThresholds;
  
  if (fatigueLevel >= criticalFatigueThreshold) {
    return { acceptable: false, level: 'critical' };
  } else if (fatigueLevel >= highFatigueThreshold) {
    return { acceptable: false, level: 'high' };
  } else if (fatigueLevel >= maxFatigueLevel) {
    return { acceptable: false, level: 'critical' };
  }
  
  return { acceptable: true, level: 'normal' };
}

/**
 * Check if stat tags are compatible
 */
export function areStatTagsCompatible(
  residentTags: string[],
  locationTags: string[],
  locationType: LocationType,
  config: LocationDropValidationConfig
): { compatible: boolean; missingTags: string[]; forbiddenTags: string[] } {
  const requirements = config.statTagRequirements;
  
  // Get required tags for location type
  let requiredTags: string[] = [];
  switch (locationType) {
    case 'residential':
      requiredTags = requirements.residentialRequired;
      break;
    case 'commercial':
      requiredTags = requirements.commercialRequired;
      break;
    case 'industrial':
      requiredTags = requirements.industrialRequired;
      break;
    default:
      requiredTags = [];
  }
  
  // Check for forbidden tags
  const forbiddenTags = residentTags.filter(tag => requirements.forbidden.includes(tag));
  
  // Check for missing required tags
  const missingTags = requiredTags.filter(requiredTag => {
    if (config.statTagRequirements.allowPartialMatching) {
      // Partial matching - check if any resident tag contains the required tag
      return !residentTags.some(residentTag => 
        residentTag.includes(requiredTag) || requiredTag.includes(residentTag)
      );
    } else {
      // Exact matching
      return !residentTags.includes(requiredTag);
    }
  });
  
  const compatible = forbiddenTags.length === 0 && 
    (missingTags.length === 0 || 
     (config.statTagRequirements.allowPartialMatching && 
      missingTags.length / requiredTags.length < (1 - config.statTagRequirements.minTagMatchPercentage)));
  
  return { compatible, missingTags, forbiddenTags };
}

/**
 * Check if capacity is acceptable
 */
export function isCapacityAcceptable(
  currentOccupants: number,
  maxOccupants: number,
  config: LocationDropValidationConfig
): { acceptable: boolean; utilization: number; overflow: boolean } {
  const utilization = currentOccupants / maxOccupants;
  const overflow = utilization > config.capacityConstraints.maxUtilizationPercentage;
  
  const acceptable = utilization <= config.capacityConstraints.maxUtilizationPercentage ||
    (config.capacityConstraints.allowTemporaryOverflow && overflow);
  
  return { acceptable, utilization, overflow };
}

export type {
  LocationType,
  ValidationResult,
  DropValidationContext,
  ValidationRule,
  DropValidationResult,
  LocationDropValidationConfig,
};

export {
  LocationTypeSchema,
  ValidationResultSchema,
  DropValidationContextSchema,
  ValidationRuleSchema,
  LocationDropValidationConfigSchema,
};
