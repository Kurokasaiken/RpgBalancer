/**
 * Unit Tests for Balancer Formula Safety Lint Suite
 * 
 * Tests formula validation, cycle detection, range analysis, and CLI functionality.
 * 
 * @module FormulaSafetyLint.test
 * @since 2026-01-20
 * @author Guardian-Balancer – Formula Safety
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  FormulaSafetyLint, 
  FormulaLintConfig, 
  FormulaLintResults,
  FormulaLintResult,
  DEFAULT_FORMULA_LINT_CONFIG,
  BUILTIN_LINT_RULES,
  lintFormula,
  lintFormulas,
  type FormulaContext 
} from '@/balancing/config/FormulaSafetyLint';

describe('FormulaSafetyLint', () => {
  let lintSuite: FormulaSafetyLint;
  let testContext: FormulaContext;

  beforeEach(() => {
    lintSuite = new FormulaSafetyLint();
    testContext = {
      stats: {
        hp: { min: 0, max: 100, current: 50 },
        damage: { min: 0, max: 50, current: 25 },
        armor: { min: 0, max: 20, current: 10 },
        efficiency: { min: 0.5, max: 2.0, current: 1.0 },
        speed: { min: 0, max: 10, current: 5 },
      },
      maxOperations: 1000,
      allowNegative: false,
    };
  });

  afterEach(() => {
    // Reset to default configuration
    lintSuite.updateConfig(DEFAULT_FORMULA_LINT_CONFIG);
  });

  describe('Configuration', () => {
    it('should use default configuration when none provided', () => {
      const defaultSuite = new FormulaSafetyLint();
      const config = defaultSuite.getConfig();
      
      expect(config.enabledRules).toContain('cycle_detection');
      expect(config.enabledRules).toContain('range_analysis');
      expect(config.maxOperations).toBe(1000);
      expect(config.timeout).toBe(5000);
    });

    it('should merge custom configuration with defaults', () => {
      const customConfig: Partial<FormulaLintConfig> = {
        enabledRules: ['cycle_detection', 'range_analysis'],
        maxOperations: 500,
        timeout: 3000,
      };
      
      const customSuite = new FormulaSafetyLint(customConfig);
      const config = customSuite.getConfig();
      
      expect(config.enabledRules).toEqual(['cycle_detection', 'range_analysis']);
      expect(config.maxOperations).toBe(500);
      expect(config.timeout).toBe(3000);
    });

    it('should apply rule-specific configurations', () => {
      const customConfig: Partial<FormulaLintConfig> = {
        ruleConfigs: {
          complexity_analysis: {
            maxOperations: 50,
            complexityThresholds: {
              low: 5,
              medium: 25,
              high: 50,
            },
          },
        },
      };
      
      const customSuite = new FormulaSafetyLint(customConfig);
      const rule = customSuite.getRule('complexity_analysis');
      
      expect(rule).toBeDefined();
      expect(rule!.config.maxOperations).toBe(50);
    });

    it('should apply severity overrides', () => {
      const customConfig: Partial<FormulaLintConfig> = {
        enabledRules: ['range_analysis'],
        severityOverrides: {
          range_analysis: 'error',
        },
      };
      
      const customSuite = new FormulaSafetyLint(customConfig);
      // Note: Severity is applied at runtime during linting
      expect(customSuite.getConfig().severityOverrides.range_analysis).toBe('error');
    });
  });

  describe('Rule Management', () => {
    it('should provide access to all built-in rules', () => {
      const rules = lintSuite.getRules();
      
      expect(rules).toHaveLength(BUILTIN_LINT_RULES.length);
      expect(rules.some(r => r.id === 'cycle_detection')).toBe(true);
      expect(rules.some(r => r.id === 'range_analysis')).toBe(true);
      expect(rules.some(r => r.id === 'complexity_analysis')).toBe(true);
    });

    it('should allow enabling/disabling rules', () => {
      lintSuite.setRuleEnabled('cycle_detection', false);
      const rule = lintSuite.getRule('cycle_detection');
      
      expect(rule).toBeDefined();
      expect(rule!.enabled).toBe(false);
    });

    it('should return undefined for non-existent rules', () => {
      const rule = lintSuite.getRule('non_existent_rule');
      expect(rule).toBeUndefined();
    });
  });

  describe('Single Formula Linting', () => {
    it('should lint a simple valid formula', async () => {
      const result = await lintSuite.lintFormula('hp + damage', testContext);
      
      expect(result.formula).toBe('hp + damage');
      expect(result.status).toBe('pass');
      expect(result.validation.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect division by zero risk', async () => {
      const contextWithZero = {
        ...testContext,
        stats: {
          ...testContext.stats,
          armor: { min: 0, max: 20, current: 0 }, // Can be zero
        },
      };
      
      const result = await lintSuite.lintFormula('damage / armor', contextWithZero);
      
      expect(result.status).toBe('warning');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.ruleId === 'range_analysis')).toBe(true);
      expect(result.warnings.some(w => w.message.includes('division by zero'))).toBe(true);
    });

    it('should detect high complexity formulas', async () => {
      const complexFormula = '(hp + damage) * (armor + efficiency) * (speed + hp) * (damage + armor)';
      const result = await lintSuite.lintFormula(complexFormula, testContext);
      
      expect(result.status).toBe('warning');
      expect(result.warnings.some(w => w.ruleId === 'complexity_analysis')).toBe(true);
    });

    it('should detect negative value risks when not allowed', async () => {
      const result = await lintSuite.lintFormula('hp - damage * 2', testContext);
      
      expect(result.status).toBe('warning');
      expect(result.warnings.some(w => w.ruleId === 'negative_values')).toBe(true);
    });

    it('should detect overflow risks in exponential operations', async () => {
      const result = await lintSuite.lintFormula('damage ** 10', testContext);
      
      expect(result.status).toBe('error');
      expect(result.warnings.some(w => w.ruleId === 'overflow_risk')).toBe(true);
    });

    it('should detect division safety issues', async () => {
      const result = await lintSuite.lintFormula('damage / armor', testContext);
      
      expect(result.warnings.some(w => w.ruleId === 'division_safety')).toBe(true);
    });

    it('should handle invalid formulas gracefully', async () => {
      const result = await lintSuite.lintFormula('hp + (damage', testContext);
      
      expect(result.status).toBe('critical');
      expect(result.validation.valid).toBe(false);
      expect(result.validation.error).toContain('Unbalanced parentheses');
    });

    it('should provide suggestions for fixable issues', async () => {
      const result = await lintSuite.lintFormula('damage / armor', testContext);
      
      const divisionWarning = result.warnings.find(w => w.ruleId === 'division_safety');
      expect(divisionWarning).toBeDefined();
      expect(divisionWarning!.suggestion).toContain('max(armor, 0.001)');
    });
  });

  describe('Batch Formula Linting', () => {
    it('should lint multiple formulas', async () => {
      const formulas = [
        'hp + damage',
        'max(hp - damage, 0)',
        'damage / armor',
        '(hp + damage) * efficiency',
      ];
      
      const results = await lintSuite.lintFormulas(formulas, testContext);
      
      expect(results.totalFormulas).toBe(4);
      expect(results.results).toHaveLength(4);
      expect(results.summary.pass + results.summary.warning + results.summary.error + results.summary.critical).toBe(4);
    });

    it('should track triggered rules across all formulas', async () => {
      const formulas = [
        'hp + damage',           // Should pass
        'damage / armor',        // Should trigger division_safety
        'damage ** 5',          // Should trigger overflow_risk
        'hp - damage * 2',       // Should trigger negative_values
      ];
      
      const results = await lintSuite.lintFormulas(formulas, testContext);
      
      expect(results.triggeredRules['division_safety']).toBeGreaterThan(0);
      expect(results.triggeredRules['overflow_risk']).toBeGreaterThan(0);
      expect(results.triggeredRules['negative_values']).toBeGreaterThan(0);
    });

    it('should determine correct overall status', async () => {
      const formulas = [
        'hp + damage',           // pass
        'damage / armor',        // warning
        'damage ** 5',          // error
      ];
      
      const results = await lintSuite.lintFormulas(formulas, testContext);
      
      expect(results.status).toBe('error'); // Highest severity
    });

    it('should measure processing time', async () => {
      const formulas = Array(10).fill('hp + damage * efficiency');
      
      const results = await lintSuite.lintFormulas(formulas, testContext);
      
      expect(results.totalProcessingTime).toBeGreaterThan(0);
      expect(results.totalProcessingTime).toBeLessThan(1000); // Should be fast
    });
  });

  describe('Cycle Detection', () => {
    it('should detect potential circular references', async () => {
      const result = await lintSuite.lintFormula('hp(hp)', testContext);
      
      expect(result.warnings.some(w => w.ruleId === 'cycle_detection')).toBe(true);
      expect(result.warnings.some(w => w.message.includes('circular reference'))).toBe(true);
    });

    it('should detect array-style circular references', async () => {
      const result = await lintSuite.lintFormula('hp[hp]', testContext);
      
      expect(result.warnings.some(w => w.ruleId === 'cycle_detection')).toBe(true);
    });
  });

  describe('Range Analysis', () => {
    it('should check for division by zero in context', async () => {
      const contextWithZero = {
        ...testContext,
        stats: {
          ...testContext.stats,
          divisor: { min: 0, max: 10, current: 5 },
        },
      };
      
      const result = await lintSuite.lintFormula('damage / divisor', contextWithZero);
      
      expect(result.warnings.some(w => w.ruleId === 'range_analysis')).toBe(true);
      expect(result.warnings.some(w => w.message.includes('division by zero'))).toBe(true);
    });

    it('should respect allowNegative setting', async () => {
      const contextAllowNegative = {
        ...testContext,
        allowNegative: true,
      };
      
      const result = await lintSuite.lintFormula('hp - damage', contextAllowNegative);
      
      // Should not trigger negative_values warning when negatives are allowed
      expect(result.warnings.some(w => w.ruleId === 'negative_values')).toBe(false);
    });
  });

  describe('Complexity Analysis', () => {
    it('should classify low complexity formulas', async () => {
      const result = await lintSuite.lintFormula('hp + damage', testContext);
      
      expect(result.validation.safety?.complexity).toBe('low');
      expect(result.warnings.some(w => w.ruleId === 'complexity_analysis')).toBe(false);
    });

    it('should classify high complexity formulas', async () => {
      const complexFormula = '(hp + damage) * (armor + efficiency) * (speed + hp) * (damage + armor) * (hp + speed)';
      const result = await lintSuite.lintFormula(complexFormula, testContext);
      
      expect(result.validation.safety?.complexity).toBe('high');
      expect(result.warnings.some(w => w.ruleId === 'complexity_analysis')).toBe(true);
    });

    it('should estimate operation count correctly', async () => {
      const result = await lintSuite.lintFormula('hp + damage * armor - efficiency', testContext);
      
      expect(result.validation.safety?.estimatedOperations).toBe(3); // +, *, -
    });
  });

  describe('Performance Warnings', () => {
    it('should warn about complex formulas', async () => {
      const complexFormula = '(hp + damage) * (armor + efficiency) * (speed + hp) * (damage + armor) * (hp + speed) * (damage + armor)';
      const result = await lintSuite.lintFormula(complexFormula, testContext);
      
      expect(result.warnings.some(w => w.ruleId === 'performance_warning')).toBe(true);
    });
  });

  describe('Convenience Functions', () => {
    it('should provide lintFormula convenience function', async () => {
      const result = await lintFormula('hp + damage', testContext);
      
      expect(result.formula).toBe('hp + damage');
      expect(result.status).toBe('pass');
    });

    it('should provide lintFormulas convenience function', async () => {
      const formulas = ['hp + damage', 'damage / armor'];
      const results = await lintFormulas(formulas, testContext);
      
      expect(results.totalFormulas).toBe(2);
      expect(results.results).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed formulas gracefully', async () => {
      const result = await lintSuite.lintFormula('hp + @#$%^&*', testContext);
      
      expect(result.status).toBe('critical');
      expect(result.validation.valid).toBe(false);
      expect(result.validation.error).toContain('Invalid characters');
    });

    it('should handle empty formulas', async () => {
      const result = await lintSuite.lintFormula('', testContext);
      
      expect(result.validation.valid).toBe(true); // Empty is technically valid
      expect(result.warnings).toHaveLength(0);
    });

    it('should handle null/undefined context gracefully', async () => {
      const result = await lintSuite.lintFormula('hp + damage', {} as FormulaContext);
      
      expect(result).toBeDefined();
      expect(result.formula).toBe('hp + damage');
    });
  });

  describe('Configuration Updates', () => {
    it('should allow runtime configuration updates', async () => {
      // Start with default config
      let result = await lintSuite.lintFormula('damage / armor', testContext);
      expect(result.warnings.some(w => w.ruleId === 'division_safety')).toBe(true);
      
      // Disable division_safety rule
      lintSuite.setRuleEnabled('division_safety', false);
      result = await lintSuite.lintFormula('damage / armor', testContext);
      
      expect(result.warnings.some(w => w.ruleId === 'division_safety')).toBe(false);
    });

    it('should allow updating max operations threshold', async () => {
      lintSuite.updateConfig({ maxOperations: 5 });
      
      const result = await lintSuite.lintFormula('hp + damage * armor + efficiency + speed', testContext);
      
      expect(result.warnings.some(w => w.ruleId === 'performance_warning')).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle formulas with only numbers', async () => {
      const result = await lintSuite.lintFormula('42', testContext);
      
      expect(result.status).toBe('pass');
      expect(result.validation.usedStats).toHaveLength(0);
    });

    it('should handle formulas with nested parentheses', async () => {
      const result = await lintSuite.lintFormula('((hp + damage) * armor) / efficiency', testContext);
      
      expect(result.validation.valid).toBe(true);
      expect(result.status).toBe('warning'); // Should trigger division warning
    });

    it('should handle formulas with function calls', async () => {
      const result = await lintSuite.lintFormula('max(hp - damage, 0)', testContext);
      
      expect(result.validation.valid).toBe(true);
      expect(result.status).toBe('pass');
    });

    it('should handle very long formulas', async () => {
      const longFormula = 'hp + '.repeat(100) + 'damage';
      const result = await lintSuite.lintFormula(longFormula, testContext);
      
      expect(result).toBeDefined();
      expect(result.validation.safety?.estimatedOperations).toBeGreaterThan(50);
    });
  });

  describe('Integration with FormulaEngine', () => {
    it('should extract stat references correctly', async () => {
      const result = await lintSuite.lintFormula('hp + damage + armor + efficiency', testContext);
      
      expect(result.validation.usedStats).toContain('hp');
      expect(result.validation.usedStats).toContain('damage');
      expect(result.validation.usedStats).toContain('armor');
      expect(result.validation.usedStats).toContain('efficiency');
    });

    it('should not extract function names as stats', async () => {
      const result = await lintSuite.lintFormula('max(hp, damage) + min(armor, efficiency)', testContext);
      
      expect(result.validation.usedStats).toContain('hp');
      expect(result.validation.usedStats).toContain('damage');
      expect(result.validation.usedStats).toContain('armor');
      expect(result.validation.usedStats).toContain('efficiency');
      expect(result.validation.usedStats).not.toContain('max');
      expect(result.validation.usedStats).not.toContain('min');
    });
  });
});
