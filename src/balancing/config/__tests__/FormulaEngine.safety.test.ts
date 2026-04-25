/**
 * Formula Safety Tests
 * 
 * Comprehensive tests for formula safety features including cycle detection,
 * range validation, complexity analysis, and UI integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateFormula,
  validateFormulaWithSafety,
  lintFormula,
  createFormulaContext,
  type FormulaWarning,
  type FormulaSafetyReport,
} from '../FormulaEngine';

describe('FormulaEngine Safety Features', () => {
  const availableStats = ['hp', 'damage', 'defense', 'speed'];
  const statContext = createFormulaContext([
    { id: 'hp', min: 10, max: 100 },
    { id: 'damage', min: 1, max: 50 },
    { id: 'defense', min: 0, max: 30 },
    { id: 'speed', min: 5, max: 25 },
  ]);

  describe('Cycle Detection', () => {
    it('should detect self-referencing multiplication', () => {
      const formula = 'hp * hp';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.hasCycles).toBe(true);
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'complexity',
            message: 'Potential circular dependency detected',
            severity: 'warning'
          })
        ])
      );
    });

    it('should detect self-referencing division', () => {
      const formula = 'damage / damage';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.hasCycles).toBe(true);
      expect(result.safety?.divisionRisk).toBe(true);
    });

    it('should not flag normal formulas as having cycles', () => {
      const formula = 'hp + damage';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.hasCycles).toBe(false);
    });
  });

  describe('Range Validation', () => {
    it('should detect division by zero risk', () => {
      const formula = 'hp / defense';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.rangeIssues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stat: 'defense',
            issue: 'zero_division',
            message: 'Division by zero possible when defense = 0'
          })
        ])
      );
    });

    it('should detect overflow risk with large numbers', () => {
      const formula = 'hp * hp';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.safety?.rangeIssues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            stat: 'hp',
            issue: 'overflow_risk',
            message: 'Potential overflow with hp^2 operation'
          })
        ])
      );
    });

    it('should not flag safe operations', () => {
      const formula = 'hp + damage';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.safety?.rangeIssues).toHaveLength(0);
    });
  });

  describe('Complexity Analysis', () => {
    it('should classify simple formulas as low complexity', () => {
      const formulas = ['hp + damage', 'hp - damage', 'hp * 2'];
      
      formulas.forEach(formula => {
        const result = validateFormulaWithSafety(formula, availableStats, statContext);
        expect(result.safety?.complexity).toBe('low');
        expect(result.safety?.estimatedOperations).toBeLessThanOrEqual(3);
      });
    });

    it('should classify moderate formulas as medium complexity', () => {
      const formulas = ['hp + damage - defense', '(hp + damage) * speed', 'max(hp, damage)'];
      
      formulas.forEach(formula => {
        const result = validateFormulaWithSafety(formula, availableStats, statContext);
        expect(result.safety?.complexity).toBe('medium');
        expect(result.safety?.estimatedOperations).toBeGreaterThan(3);
        expect(result.safety?.estimatedOperations).toBeLessThanOrEqual(8);
      });
    });

    it('should classify complex formulas as high complexity', () => {
      const formulas = [
        '(hp + damage) * (defense - speed) / max(hp, damage)',
        'hp * damage + defense * speed - hp / damage + defense / speed'
      ];
      
      formulas.forEach(formula => {
        const result = validateFormulaWithSafety(formula, availableStats, statContext);
        expect(result.safety?.complexity).toBe('high');
        expect(result.safety?.estimatedOperations).toBeGreaterThan(8);
      });
    });
  });

  describe('Real-time Linting', () => {
    it('should provide complexity warnings', () => {
      const formula = '(hp + damage) * (defense - speed) / max(hp, damage)';
      const warnings = lintFormula(formula, availableStats);
      
      expect(warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'complexity',
            message: expect.stringContaining('High complexity'),
            severity: 'warning'
          })
        ])
      );
    });

    it('should provide division risk warnings', () => {
      const formula = 'hp / defense';
      const warnings = lintFormula(formula, availableStats);
      
      expect(warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'division',
            message: 'Division operations detected - ensure no zero values',
            severity: 'warning'
          })
        ])
      );
    });

    it('should provide performance warnings for exponentiation', () => {
      const formula = 'hp ** 2';
      const warnings = lintFormula(formula, availableStats);
      
      expect(warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'performance',
            message: 'Exponentiation detected - may impact performance',
            severity: 'info'
          })
        ])
      );
    });

    it('should return no warnings for simple valid formulas', () => {
      const formula = 'hp + damage';
      const warnings = lintFormula(formula, availableStats);
      
      expect(warnings).toHaveLength(0);
    });
  });

  describe('Enhanced Validation', () => {
    it('should include safety information when context is provided', () => {
      const formula = 'hp / defense + damage';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.usedStats).toEqual(['hp', 'defense', 'damage']);
    });

    it('should work without context for basic validation', () => {
      const formula = 'hp + damage';
      const result = validateFormula(formula, availableStats);
      
      expect(result.valid).toBe(true);
      expect(result.safety).toBeUndefined();
      expect(result.warnings).toBeUndefined();
      expect(result.usedStats).toEqual(['hp', 'damage']);
    });

    it('should handle invalid formulas gracefully', () => {
      const formula = 'hp + invalid_stat';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown stats: invalid_stat');
      expect(result.safety).toBeUndefined();
    });
  });

  describe('Context Creation', () => {
    it('should create valid formula context from stat definitions', () => {
      const stats = [
        { id: 'hp', min: 10, max: 100 },
        { id: 'damage', min: 1, max: 50 }
      ];
      
      const context = createFormulaContext(stats);
      
      expect(context.stats).toEqual({
        hp: { min: 10, max: 100, current: 55 },
        damage: { min: 1, max: 50, current: 25.5 }
      });
      expect(context.maxOperations).toBe(50);
      expect(context.allowNegative).toBe(true);
    });

    it('should handle empty stats array', () => {
      const context = createFormulaContext([]);
      
      expect(context.stats).toEqual({});
      expect(context.maxOperations).toBe(50);
      expect(context.allowNegative).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty formula', () => {
      const result = validateFormulaWithSafety('', availableStats, statContext);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Formula cannot be empty');
    });

    it('should handle formula with only numbers', () => {
      const result = validateFormulaWithSafety('42', availableStats, statContext);
      
      expect(result.valid).toBe(true);
      expect(result.usedStats).toHaveLength(0);
    });

    it('should handle formula with only whitespace', () => {
      const result = validateFormulaWithSafety('   ', availableStats, statContext);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Formula cannot be empty');
    });

    it('should handle complex nested operations', () => {
      const formula = 'max(min(hp, damage), defense) * speed / (hp + damage - defense)';
      const result = validateFormulaWithSafety(formula, availableStats, statContext);
      
      expect(result.valid).toBe(true);
      expect(result.safety?.complexity).toBe('high');
      expect(result.safety?.estimatedOperations).toBeGreaterThan(8);
    });
  });
});

describe('Formula Safety Integration', () => {
  it('should work with the enhanced FormulaEditor props', () => {
    const availableStats = [
      { id: 'hp', label: 'Health', min: 10, max: 100 },
      { id: 'damage', label: 'Damage', min: 1, max: 50 }
    ];
    
    // This tests the interface compatibility
    const formula = 'hp + damage';
    const statIds = availableStats.map(s => s.id);
    const context = createFormulaContext(availableStats);
    
    const result = validateFormulaWithSafety(formula, statIds, context);
    
    expect(result.valid).toBe(true);
    expect(result.safety).toBeDefined();
  });
});
