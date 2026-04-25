/**
 * Unit tests for FormulaEngine enhancements - cycle detection, range validation, and safety features
 */

import { describe, it, expect } from 'vitest';
import {
  validateFormula,
  validateFormulaWithSafety,
  lintFormula,
  createFormulaContext,
  type FormulaValidationResult,
  type FormulaSafetyReport
} from '../../../src/balancing/config/FormulaEngine';

describe('FormulaEngine Enhancements', () => {
  const availableStats = ['hp', 'damage', 'defense', 'speed'];
  const testContext = createFormulaContext([
    { id: 'hp', min: 50, max: 200 },
    { id: 'damage', min: 10, max: 50 },
    { id: 'defense', min: 5, max: 30 },
    { id: 'speed', min: 1, max: 10 }
  ]);

  describe('Cycle Detection', () => {
    it('should detect simple self-referencing cycles', () => {
      const formula = 'hp * hp';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.hasCycles).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'complexity',
          message: 'Potential circular dependency detected',
          severity: 'warning'
        })
      );
    });

    it('should detect division cycles', () => {
      const formula = 'damage / damage';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.hasCycles).toBe(true);
    });

    it('should not detect cycles in valid formulas', () => {
      const formula = 'hp + damage * 2';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.hasCycles).toBe(false);
    });
  });

  describe('Range Validation', () => {
    it('should detect division by zero risk', () => {
      const formula = '100 / defense';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.rangeIssues).toContainEqual(
        expect.objectContaining({
          stat: 'defense',
          issue: 'zero_division',
          message: 'Division by zero possible when defense = 0'
        })
      );
    });

    it('should detect overflow risk with large numbers', () => {
      const formula = 'hp * hp';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.safety?.rangeIssues).toContainEqual(
        expect.objectContaining({
          stat: 'hp',
          issue: 'overflow_risk',
          message: 'Potential overflow with hp^2 operation'
        })
      );
    });

    it('should detect negative input risk for mathematical functions', () => {
      const formula = 'sqrt(hp - 100)';
      const contextWithNegative = createFormulaContext([
        { id: 'hp', min: 0, max: 150 }
      ]);
      const result = validateFormulaWithSafety(formula, ['hp'], contextWithNegative);
      
      expect(result.safety?.rangeIssues).toContainEqual(
        expect.objectContaining({
          stat: 'hp',
          issue: 'negative_input',
          message: 'Negative input risk for hp in mathematical function'
        })
      );
    });
  });

  describe('Complexity Analysis', () => {
    it('should classify low complexity formulas', () => {
      const formula = 'hp + damage';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.safety?.complexity).toBe('low');
      expect(result.safety?.estimatedOperations).toBeLessThanOrEqual(3);
    });

    it('should classify medium complexity formulas', () => {
      const formula = 'hp + damage * 2 - defense / speed';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.safety?.complexity).toBe('medium');
      expect(result.safety?.estimatedOperations).toBeGreaterThan(3);
      expect(result.safety?.estimatedOperations).toBeLessThanOrEqual(8);
    });

    it('should classify high complexity formulas', () => {
      const formula = 'hp + damage * defense / speed - min(hp, damage) + max(defense, speed) * abs(speed - 5)';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.safety?.complexity).toBe('high');
      expect(result.safety?.estimatedOperations).toBeGreaterThan(8);
    });
  });

  describe('Division Risk Analysis', () => {
    it('should detect division risk with variables', () => {
      const formula = 'hp / defense + damage / speed';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.safety?.divisionRisk).toBe(true);
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'division',
          severity: 'warning'
        })
      );
    });

    it('should not detect division risk with constants only', () => {
      const formula = 'hp / 2 + damage * 3';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.safety?.divisionRisk).toBe(false);
    });
  });

  describe('Enhanced Linting', () => {
    it('should provide comprehensive linting feedback', () => {
      const formula = 'hp * hp / defense + damage ** 2';
      const warnings = lintFormula(formula, availableStats);
      
      expect(warnings).toContainEqual(
        expect.objectContaining({
          type: 'complexity',
          severity: 'warning'
        })
      );
      
      expect(warnings).toContainEqual(
        expect.objectContaining({
          type: 'division',
          severity: 'warning'
        })
      );
      
      expect(warnings).toContainEqual(
        expect.objectContaining({
          type: 'performance',
          severity: 'info'
        })
      );
    });

    it('should return no warnings for simple valid formulas', () => {
      const formula = 'hp + damage';
      const warnings = lintFormula(formula, availableStats);
      
      expect(warnings).toHaveLength(0);
    });
  });

  describe('Safety Report Integration', () => {
    it('should generate complete safety report', () => {
      const formula = 'hp * hp / defense';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.safety).toBeDefined();
      expect(result.safety?.hasCycles).toBe(true);
      expect(result.safety?.complexity).toBe('medium');
      expect(result.safety?.divisionRisk).toBe(true);
      expect(result.safety?.rangeIssues.length).toBeGreaterThan(0);
      expect(result.safety?.estimatedOperations).toBeGreaterThan(0);
    });

    it('should handle formulas without safety analysis', () => {
      const formula = 'hp + damage';
      const result = validateFormula(formula, availableStats);
      
      expect(result.valid).toBe(true);
      expect(result.safety).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', () => {
      const formula = 'hp + ';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Syntax error');
      expect(result.safety).toBeUndefined();
    });

    it('should handle unknown stats', () => {
      const formula = 'hp + unknown_stat';
      const result = validateFormulaWithSafety(formula, availableStats, testContext);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown stats');
    });

    it('should handle empty formulas', () => {
      const result = validateFormulaWithSafety('', availableStats, testContext);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Formula cannot be empty');
    });
  });

  describe('Performance Considerations', () => {
    it('should handle large formulas efficiently', () => {
      const largeFormula = availableStats.map(stat => `${stat} * 2`).join(' + ');
      const start = performance.now();
      const result = validateFormulaWithSafety(largeFormula, availableStats, testContext);
      const end = performance.now();
      
      expect(result.valid).toBe(true);
      expect(end - start).toBeLessThan(100); // Should complete in <100ms
    });
  });
});
