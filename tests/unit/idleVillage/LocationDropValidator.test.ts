/**
 * Location Drop Validator Tests
 * 
 * Unit tests for the Idle Village Location Drop Validator helper
 * including validation rules, configuration, and edge cases.
 * 
 * @since NP-066 – Idle Village Location Drop Validator Helper
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type {
  LocationType,
  ValidationResult,
  DropValidationContext,
  ValidationRule,
  DropValidationResult,
  LocationDropValidationConfig,
} from '../../../src/ui/idleVillage/config/locationDropValidationConfig';
import {
  DEFAULT_LOCATION_DROP_VALIDATION_CONFIG,
  createSafeLocationDropValidationConfig,
  isValidDropValidationContext,
  isLocationTypeCompatible,
  isCrewSizeWithinLimits,
  isFatigueAcceptable,
  areStatTagsCompatible,
  isCapacityAcceptable,
} from '../../../src/ui/idleVillage/config/locationDropValidationConfig';
import {
  LocationDropValidator,
  createLocationDropValidator,
  validateLocationDrop,
  isLocationDropAllowed,
  createValidationContext,
  getValidationRule,
  getBuiltinValidationRules,
  hasValidationRule,
} from '../../../src/ui/idleVillage/utils/locationDropValidator';

describe('LocationDropValidator Core', () => {
  let validator: LocationDropValidator;

  beforeEach(() => {
    validator = new LocationDropValidator();
  });

  describe('Configuration', () => {
    it('creates validator with default configuration', () => {
      expect(validator.getConfig()).toEqual(DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
    });

    it('creates validator with custom configuration', () => {
      const customConfig = {
        settings: {
          strictMode: false,
          warningsAsErrors: true,
          maxSuggestions: 10,
          detailedExplanations: false,
        },
        crewLimits: {
          residentialMax: 6,
          commercialMax: 8,
        },
      };
      
      const customValidator = new LocationDropValidator(customConfig);
      const config = customValidator.getConfig();
      
      expect(config.settings.strictMode).toBe(false);
      expect(config.settings.warningsAsErrors).toBe(true);
      expect(config.crewLimits.residentialMax).toBe(6);
      expect(config.crewLimits.commercialMax).toBe(8);
    });

    it('handles invalid configuration gracefully', () => {
      const invalidConfig = {
        settings: {
          strictMode: 'invalid' as any,
          warningsAsErrors: true,
          maxSuggestions: 10,
          detailedExplanations: true,
        },
        crewLimits: {
          residentialMin: -1,
          residentialMax: 0,
        },
      };
      
      const customValidator = new LocationDropValidator(invalidConfig);
      expect(customValidator.getConfig()).toEqual(DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
    });
  });

  describe('Validation Context', () => {
    it('creates valid validation context', () => {
      const context = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident',
        2,
        4,
        30,
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        { strength: 10, agility: 8 }
      );
      
      expect(context.source.id).toBe('source-1');
      expect(context.source.type).toBe('residential');
      expect(context.target.id).toBe('target-1');
      expect(context.target.type).toBe('residential');
      expect(context.resident.id).toBe('resident-1');
      expect(context.resident.name).toBe('Test Resident');
      expect(context.resident.fatigueLevel).toBe(30);
    });

    it('validates context schema', () => {
      const validContext = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident'
      );
      
      expect(isValidDropValidationContext(validContext)).toBe(true);
    });

    it('rejects invalid context', () => {
      const invalidContext = {
        source: {
          id: 'source-1',
          type: 'invalid' as LocationType,
          currentOccupants: 2,
          maxOccupants: 4,
          fatigueLevel: 30,
          statTags: [],
        },
        target: {
          id: 'target-1',
          type: 'residential',
          currentOccupants: 1,
          maxOccupants: 4,
          fatigueLevel: 20,
          statTags: [],
        },
        resident: {
          id: 'resident-1',
          name: 'Test Resident',
          stats: {},
          tags: [],
          fatigueLevel: 25,
        },
      };
      
      expect(isValidDropValidationContext(invalidContext)).toBe(false);
    });
  });

  describe('Validation Rules', () => {
    it('has all built-in validation rules', () => {
      const rules = getBuiltinValidationRules();
      expect(rules).toHaveLength(5);
      
      const ruleIds = rules.map(r => r.id);
      expect(ruleIds).toContain('crew_limit_check');
      expect(ruleIds).toContain('fatigue_threshold_check');
      expect(ruleIds).toContain('stat_tag_requirement_check');
      expect(ruleIds).toContain('location_compatibility_check');
      expect(ruleIds).toContain('capacity_constraint_check');
    });

    it('can get validation rule by ID', () => {
      const rule = getValidationRule('crew_limit_check');
      expect(rule).toBeTruthy();
      expect(rule!.id).toBe('crew_limit_check');
      expect(rule!.name).toBe('Crew Limit Check');
    });

    it('returns null for non-existent rule', () => {
      const rule = getValidationRule('non_existent_rule');
      expect(rule).toBeNull();
    });

    it('can check if rule exists', () => {
      expect(hasValidationRule('crew_limit_check')).toBe(true);
      expect(hasValidationRule('non_existent_rule')).toBe(false);
    });
  });

  describe('Validation Logic', () => {
    it('allows valid drop operation', () => {
      const context = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident',
        1,
        4,
        20, // Low fatigue
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        { strength: 10 }
      );
      
      const result = validator.validateDrop(context);
      
      expect(result.result).toBe('allowed');
      expect(result.allowed).toBe(true);
      expect(result.ruleResults.every(r => r.result === 'allowed')).toBe(true);
    });

    it('forbids drop due to crew limit', () => {
      const context = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident',
        4, // At max capacity
        4,
        20,
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        { strength: 10 }
      );
      
      const result = validator.validateDrop(context);
      
      expect(result.result).toBe('forbidden');
      expect(result.allowed).toBe(false);
      expect(result.ruleResults.some(r => r.ruleId === 'crew_limit_check' && r.result === 'forbidden')).toBe(true);
    });

    it('forbids drop due to high fatigue', () => {
      const context = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident',
        1,
        4,
        85, // High fatigue
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        { strength: 10 }
      );
      
      const result = validator.validateDrop(context);
      
      expect(result.result).toBe('forbidden');
      expect(result.allowed).toBe(false);
      expect(result.ruleResults.some(r => r.ruleId === 'fatigue_threshold_check' && r.result === 'forbidden')).toBe(true);
    });

    it('forbids drop due to missing stat tags', () => {
      const context = createValidationContext(
        'source-1',
        'commercial',
        'target-1',
        'commercial',
        'resident-1',
        'Test Resident',
        1,
        6,
        20,
        [], // No tags
        ['commerce', 'services'],
        { strength: 10 }
      );
      
      const result = validator.validateDrop(context);
      
      expect(result.result).toBe('forbidden');
      expect(result.allowed).toBe(false);
      expect(result.ruleResults.some(r => r.ruleId === 'stat_tag_requirement_check' && r.result === 'forbidden')).toBe(true);
    });

    it('forbids drop due to incompatible location types', () => {
      const context = createValidationContext(
        'source-1',
        'industrial',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident',
        1,
        4,
        20,
        ['production', 'manufacturing'],
        ['housing', 'basic_needs'],
        { strength: 10 }
      );
      
      const result = validator.validateDrop(context);
      
      expect(result.result).toBe('forbidden');
      expect(result.allowed).toBe(false);
      expect(result.ruleResults.some(r => r.ruleId === 'location_compatibility_check' && r.result === 'forbidden')).toBe(true);
    });

    it('forbids drop due to capacity constraints', () => {
      const context = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident',
        1,
        4,
        20,
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        { strength: 10 }
      );
      
      // Mock capacity check to fail
      jest.spyOn(require('../../../src/ui/idleVillage/config/locationDropValidationConfig'), 'isCapacityAcceptable')
        .mockReturnValue({ acceptable: false, utilization: 1.0, overflow: false });
      
      const result = validator.validateDrop(context);
      
      expect(result.result).toBe('forbidden');
      expect(result.allowed).toBe(false);
      expect(result.ruleResults.some(r => r.ruleId === 'capacity_constraint_check' && r.result === 'forbidden')).toBe(true);
    });
  });

  describe('Quick Validation Methods', () => {
    it('isLocationDropAllowed returns boolean', () => {
      const context = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident',
        1,
        4,
        20,
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        { strength: 10 }
      );
      
      expect(isLocationDropAllowed(context)).toBe(true);
      expect(isLocationDropAllowed(context, { settings: { warningsAsErrors: true } })).toBe(true);
    });

    it('validateLocationDrop returns full result', () => {
      const context = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'Test Resident',
        1,
        4,
        20,
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        { strength: 10 }
      );
      
      const result = validateLocationDrop(context);
      
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('allowed');
      expect(result).toHaveProperty('ruleResults');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('suggestions');
    });
  });

  describe('Custom Rules', () => {
    it('can add custom validation rule', () => {
      const customRule: ValidationRule = {
        id: 'custom_test_rule',
        name: 'Custom Test Rule',
        description: 'Test rule for validation',
        type: 'crew_limit',
        validate: () => 'allowed' as ValidationResult,
        errorMessage: 'Custom rule failed',
        priority: 10,
        enabled: true,
      };
      
      validator.addCustomRule(customRule);
      
      const stats = validator.getValidationStatistics();
      expect(stats.customRules).toBe(1);
      expect(hasValidationRule('custom_test_rule')).toBe(true);
    });

    it('can remove custom validation rule', () => {
      const customRule: ValidationRule = {
        id: 'custom_test_rule',
        name: 'Custom Test Rule',
        description: 'Test rule for validation',
        type: 'crew_limit',
        validate: () => 'allowed' as ValidationResult,
        errorMessage: 'Custom rule failed',
        priority: 10,
        enabled: true,
      };
      
      validator.addCustomRule(customRule);
      expect(validator.removeCustomRule('custom_test_rule')).toBe(true);
      expect(validator.removeCustomRule('non_existent_rule')).toBe(false);
      
      const stats = validator.getValidationStatistics();
      expect(stats.customRules).toBe(0);
    });

    it('can enable/disable validation rule', () => {
      expect(validator.setRuleEnabled('crew_limit_check', false)).toBe(true);
      expect(validator.setRuleEnabled('non_existent_rule', false)).toBe(false);
      
      // Verify rule is disabled
      const context = createValidationContext(
        'source-1',
        'residential',
        'target-1',
        'residential',
        'resident-1',
        'warningsAsErrors: true',
        4,
        4,
        20,
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        { strength: 10 }
      );
      
      const result = validator.validateDrop(context);
      expect(result.ruleResults.find(r => r.ruleId === 'crew_limit_check')).toBeUndefined();
    });
  });

  describe('Configuration Management', () => {
    it('can update configuration', () => {
      const newConfig = {
        settings: {
          strictMode: false,
          maxSuggestions: 20,
        },
      };
      
      validator.updateConfig(newConfig);
      expect(validator.getConfig().settings.strictMode).toBe(false);
      expect(validator.getConfig().settings.maxSuggestions).toBe(20);
    });

    it('can export and import configuration', () => {
      const exportedConfig = validator.exportConfig();
      
      const newValidator = new LocationDropValidator();
      newValidator.importConfig(exportedConfig);
      
      expect(newValidator.getConfig()).toEqual(validator.getConfig());
    });

    it('can reset to default configuration', () => {
      validator.updateConfig({
        settings: { strictMode: false },
      });
      
      validator.reset();
      
      expect(validator.getConfig()).toEqual(DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
      expect(validator.getValidationStatistics().customRules).toBe(0);
    });
  });

  describe('Statistics', () => {
    it('provides validation statistics', () => {
      const stats = validator.getValidationStatistics();
      
      expect(stats.totalRules).toBe(5);
      expect(stats.builtinRules).toBe(5);
      expect(stats.customRules).toBe(0);
      expect(stats.enabledRules).toBe(5);
    });

    it('updates statistics when custom rules are added', () => {
      const customRule: ValidationRule = {
        id: 'custom_rule',
        name: 'Custom Rule',
        description: 'Test rule',
        type: 'crew_limit',
        validate: () => 'allowed' as ValidationResult,
        errorMessage: 'Custom rule failed',
        priority: 10,
        enabled: true,
      };
      
      validator.addCustomRule(customRule);
      
      const stats = validator.getValidationStatistics();
      expect(stats.totalRules).toBe(6);
      expect(stats.customRules).toBe(1);
      expect(stats.enabledRules).toBe(6);
      
      validator.removeCustomRule('custom_rule');
      
      const updatedStats = validator.getValidationStatistics();
      expect(updatedStats.totalRules).toBe(5);
      expect(updatedStats.customRules).toBe(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('Location Type Compatibility', () => {
    it('allows compatible location types', () => {
      expect(isLocationTypeCompatible('residential', 'residential', DEFAULT_LOCATION_DROP_VALIDATION_CONFIG)).toBe(true);
      expect(isLocationTypeCompatible('residential', 'recreational', DEFAULT_LOCATION_DROP_VALIDATION_CONFIG)).toBe(true);
      expect(isLocationTypeCompatible('commercial', 'commercial', DEFAULT_LOCATION_DROP_VALIDATION_CONFIG)).toBe(true);
    });

    it('forbids incompatible location types', () => {
      expect(isLocationTypeCompatible('industrial', 'residential', DEFAULT_LOCATION_VALIDATION_CONFIG)).toBe(false);
      expect(isLocationTypeCompatible('residential', 'industrial', DEFAULT_LOCATION_VALIDATION_CONFIG)).toBe(false);
    });

    it('allows cross-type moves when enabled', () => {
      const config = {
        ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG,
        locationCompatibility: {
          ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG.locationCompatibility,
          allowCrossTypeMoves: true,
        },
      };
      
      expect(isLocationTypeCompatible('industrial', 'residential', config)).toBe(false);
      expect(isLocationTypeCompatible('residential', 'industrial', config)).toBe(false);
    });
  });

  describe('Crew Size Limits', () => {
    it('accepts crew within limits', () => {
      const result = isCrewSizeWithinLimits(2, 'residential', DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
      expect(result.withinLimits).toBe(true);
      expect(result.overflow).toBe(false);
    });

    it('rejects crew exceeding limits', () => {
      const result = isCrewSizeWithinLimits(5, 'residential', DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
      expect(result.withinLimits).toBe(false);
      expect(result.overflow).toBe(false);
    });

    it('allows overflow when enabled', () => {
      const config = {
        ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG,
        crewLimits: {
          ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG.crewLimits,
          allowOverflow: true,
          overflowTolerance: 0.5,
        },
      };
      
      const result = isCrewSizeWithinLimits(5, 'residential', config);
      expect(result.withinLimits).toBe(false);
      expect(result.overflow).toBe(true);
    });
  });

  describe('Fatigue Thresholds', () => {
    it('accepts normal fatigue levels', () => {
      const result = isFatigueAcceptable(30, DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
      expect(result.acceptable).toBe(true);
      expect(result.level).toBe('normal');
    });

    it('rejects high fatigue levels', () => {
      const result = isFatigueAcceptable(65, DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
      expect(result.acceptable).toBe(false);
      expect(result.level).toBe('high');
    });

    it('rejects critical fatigue levels', () => {
      const result = isFatigueAcceptable(80, DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
      expect(result.acceptable).toBe(false);
      expect(result.level).toBe('critical');
    });

    it('disables fatigue restrictions when disabled', () => {
      const config = {
        ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG,
        fatigueThresholds: {
          ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG.fatigueThresholds,
          enableFatigueRestrictions: false,
        },
      };
      
      const result = isFatigueAcceptable(85, config);
      expect(result.acceptable).toBe(true);
      expect(result.level).toBe('normal');
    });
  });

  describe('Stat Tag Compatibility', () => {
    it('accepts compatible stat tags', () => {
      const result = areStatTagsCompatible(
        ['housing', 'basic_needs'],
        ['housing', 'basic_needs'],
        'residential',
        DEFAULT_LOCATION_DROP_VALIDATION_CONFIG
      );
      
      expect(result.compatible).toBe(true);
      expect(result.missingTags).toHaveLength(0);
      expect(result.forbiddenTags).toHaveLength(0);
    });

    it('identifies missing required tags', () => {
      const result = areStatTagsCompatible(
        ['housing'], // Missing 'basic_needs'
        ['housing'],
        'residential',
        DEFAULT_LOCATION_DROP_VALIDATION_CONFIG
      );
      
      expect(result.compatible).toBe(false);
      expect(result.missingTags).toContain('basic_needs');
      expect(result.forbiddenTags).toHaveLength(0);
    });

    it('identifies forbidden tags', () => {
      const result = areStatTagsCompatible(
        ['housing', 'toxic'],
        ['housing', 'basic_needs'],
        'residential',
        DEFAULT_LOCATION_DROP_VALIDATION_CONFIG
      );
      
      expect(result.compatible).toBe(false);
      expect(result.missingTags).toHaveLength(0);
      expect(result.forbiddenTags).toContain('toxic');
    });

    it('allows partial matching when enabled', () => {
      const config = {
        ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG,
        statTagRequirements: {
          ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG.statTagRequirements,
          allowPartialMatching: true,
          minTagMatchPercentage: 0.5,
        },
      };
      
      const result = areStatTagsCompatible(
        ['housing'], // Partial match for 'basic_needs'
        ['housing'],
        'residential',
        config
      );
      
      expect(result.compatible).toBe(true);
      expect(result.missingTags).toHaveLength(0);
    });
  });

  describe('Capacity Acceptability', () => {
    it('accepts normal utilization', () => {
      const result = isCapacityAcceptable(3, 4, DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
      expect(result.acceptable).toBe(true);
      expect(result.utilization).toBe(0.75);
      expect(result.overflow).toBe(false);
    });

    it('rejects overcapacity', () => {
      const result = isCapacityAcceptable(4, 4, DEFAULT_LOCATION_DROP_VALIDATION_CONFIG);
      expect(result.acceptable).toBe(false);
      expect(result.utilization).toBe(1.0);
      expect(result.overflow).toBe(false);
    });

    it('allows temporary overflow when enabled', () => {
      const config = {
        ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG,
        capacityConstraints: {
          ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG.capacityConstraints,
          allowTemporaryOverflow: true,
        },
      };
      
      const result = isCapacityAcceptable(4, 4, config);
      expect(result.acceptable).toBe(true);
      expect(result.overflow).toBe(true);
    });
  });
});

describe('Integration Tests', () => {
  it('handles complex validation scenarios', () => {
    const context = createValidationContext(
      'source-1',
      'industrial',
      'target-1',
      'residential',
      'resident-1',
      'Test Resident',
      1,
      4,
      85, // High fatigue
      ['production', 'manufacturing'],
      ['housing', 'basic_needs'],
      { strength: 10 }
    );
    
    const result = validateLocationDrop(context);
    
    // Should be forbidden due to multiple violations
    expect(result.result).toBe('forbidden');
    expect(result.allowed).toBe(false);
    expect(result.ruleResults.length).toBeGreaterThan(2);
    
    // Check specific violations
    expect(result.ruleResults.some(r => r.ruleId === 'fatigue_threshold_check')).toBe(true);
    expect(result.ruleResults.some(r => r.ruleId === 'stat_tag_requirement_check')).toBe(true);
    expect(result.ruleResults.some(r => r.ruleId === 'location_compatibility_check')).toBe(true);
  });

  it('provides detailed feedback for failed validations', () => {
    const context = createValidationContext(
      'source-1',
      'residential',
      'target-1',
      'residential',
      'resident-1',
      'Test Resident',
      4, // At capacity
      4,
      90, // Critical fatigue
      [], // No tags
      ['housing', 'basic_needs'],
      { strength: 10 }
    );
    
    const result = validateLocationDrop(context);
    
    expect(result.summary).toContain('forbidden');
    expect(result.explanation).toContain('validation rules failed');
    expect(result.suggestions).toHaveLength(5); // Max suggestions
    expect(result.suggestions[0]).toContain('free up space');
  });

  it('handles edge cases gracefully', () => {
    // Empty tags
    const context1 = createValidationContext(
      'source-1',
      'residential',
      'target-1',
      'residential',
      'resident-1',
      'Test Resident',
      1,
      4,
      20,
      [],
      [],
      { strength: 10 }
    );
    
    const result1 = validateLocationDrop(context1);
    expect(result1.result).toBe('forbidden');
    expect(result1.ruleResults.some(r => r.ruleId === 'stat_tag_requirement_check')).toBe(true);

    // Zero fatigue
    const context2 = createValidationContext(
      'source-1',
      'residential',
      'target-1',
      'residential',
      'resident-1',
      'Test Resident',
      1,
      4,
      0,
      ['housing', 'basic_needs'],
      ['housing', 'basic_needs'],
      { strength: 10 }
    );
    
    const result2 = validateLocationDrop(context2);
    expect(result2.result).toBe('allowed');
  });

  it('respects configuration changes', () => {
    const context = createValidationContext(
      'source-1',
      'residential',
      'target-1',
      'residential',
      'resident-1',
      'Test Resident',
      1,
      4,
      65, // High fatigue
      ['housing', 'basic_needs'],
      ['housing', 'basic_needs'],
      { strength: 10 }
    );
    
    // With default config - should be forbidden
    const result1 = validateLocationDrop(context);
    expect(result1.result).toBe('forbidden');
    
    // With fatigue restrictions disabled - should be allowed
    const result2 = validateLocationDrop(context, {
      fatigueThresholds: {
        ...DEFAULT_LOCATION_DROP_VALIDATION_CONFIG.fatigueThresholds,
        enableFatigueRestrictions: false,
      },
    });
    
    expect(result2.result).toBe('allowed');
  });
});
