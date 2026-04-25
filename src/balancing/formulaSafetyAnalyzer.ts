/**
 * Formula Safety Analyzer for Balancer Config
 * 
 * Analyzes formulas for safety issues including cycles, range problems,
 * division risks, and complexity concerns. Integrates with Storage Testing Framework.
 */

import { z } from 'zod';
import type { 
  FormulaValidationResult, 
  FormulaSafetyReport, 
  RangeIssue, 
  FormulaContext 
} from './config/FormulaEngine';

// Safety Rules Schema
export const SafetyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  threshold: z.number().optional(),
  check: z.instanceof(Function),
});

export type SafetyRule = z.infer<typeof SafetyRuleSchema>;

// Safety Analysis Configuration
export const SafetyAnalysisConfigSchema = z.object({
  maxComplexity: z.enum(['low', 'medium', 'high']),
  maxOperations: z.number(),
  allowNegative: z.boolean(),
  allowDivision: z.boolean(),
  allowCycles: z.boolean(),
  customRules: z.array(SafetyRuleSchema),
});

export type SafetyAnalysisConfig = z.infer<typeof SafetyAnalysisConfigSchema>;

// Safety Analysis Result
export const SafetyAnalysisResultSchema = z.object({
  formulaId: z.string(),
  formula: z.string(),
  timestamp: z.number(),
  overallSafety: z.enum(['safe', 'warning', 'unsafe', 'critical']),
  safetyReport: z.object({
    hasCycles: z.boolean(),
    complexity: z.enum(['low', 'medium', 'high']),
    estimatedOperations: z.number(),
    divisionRisk: z.boolean(),
    rangeIssues: z.array(z.object({
      stat: z.string(),
      issue: z.enum(['negative_input', 'zero_division', 'overflow_risk']),
      message: z.string(),
    })),
  }),
  ruleViolations: z.array(z.object({
    ruleId: z.string(),
    severity: z.enum(['info', 'warning', 'error', 'critical']),
    message: z.string(),
    position: z.object({
      start: z.number(),
      end: z.number(),
    }).optional(),
  })),
  recommendations: z.array(z.string()),
  context: z.object({
    stats: z.record(z.string(), z.object({
      min: z.number(),
      max: z.number(),
      current: z.number(),
    })),
    maxOperations: z.number().optional(),
    allowNegative: z.boolean().optional(),
  }),
});

export type SafetyAnalysisResult = z.infer<typeof SafetyAnalysisResultSchema>;

// Storage Analysis Result
export const StorageAnalysisResultSchema = z.object({
  timestamp: z.number(),
  totalFormulas: z.number(),
  safeFormulas: z.number(),
  warningFormulas: z.number(),
  unsafeFormulas: z.number(),
  criticalFormulas: z.number(),
  overallHealth: z.enum(['excellent', 'good', 'warning', 'critical']),
  formulaResults: z.array(SafetyAnalysisResultSchema),
  summary: z.object({
    mostCommonIssues: z.array(z.object({
      issue: z.string(),
      count: z.number(),
    })),
    complexityDistribution: z.record(z.string(), z.number()),
    riskFactors: z.array(z.string()),
  }),
});

export type StorageAnalysisResult = z.infer<typeof StorageAnalysisResultSchema>;

/**
 * Formula Safety Analyzer Class
 */
export class FormulaSafetyAnalyzer {
  private config: SafetyAnalysisConfig;
  private customRules: SafetyRule[] = [];

  constructor(config: Partial<SafetyAnalysisConfig> = {}) {
    this.config = {
      maxComplexity: 'medium',
      maxOperations: 1000,
      allowNegative: false,
      allowDivision: true,
      allowCycles: false,
      customRules: [],
      ...config,
    };
  }

  /**
   * Add custom safety rule
   */
  addRule(rule: SafetyRule): void {
    this.customRules.push(rule);
  }

  /**
   * Analyze a single formula for safety
   */
  analyzeFormula(
    formula: string,
    formulaId: string,
    context: FormulaContext
  ): SafetyAnalysisResult {
    const safetyReport = this.generateSafetyReport(formula, context);
    const ruleViolations = this.checkCustomRules(formula, context);
    const recommendations = this.generateRecommendations(safetyReport, ruleViolations);
    const overallSafety = this.determineOverallSafety(safetyReport, ruleViolations);

    return {
      formulaId,
      formula,
      timestamp: Date.now(),
      overallSafety,
      safetyReport,
      ruleViolations,
      recommendations,
      context,
    };
  }

  /**
   * Analyze multiple formulas from storage
   */
  analyzeStorage(formulas: Array<{ id: string; formula: string; context: FormulaContext }>): StorageAnalysisResult {
    const results = formulas.map(({ id, formula, context }) =>
      this.analyzeFormula(formula, id, context)
    );

    const summary = this.generateSummary(results);
    const overallHealth = this.determineStorageHealth(results);

    return {
      timestamp: Date.now(),
      totalFormulas: results.length,
      safeFormulas: results.filter(r => r.overallSafety === 'safe').length,
      warningFormulas: results.filter(r => r.overallSafety === 'warning').length,
      unsafeFormulas: results.filter(r => r.overallSafety === 'unsafe').length,
      criticalFormulas: results.filter(r => r.overallSafety === 'critical').length,
      overallHealth,
      formulaResults: results,
      summary,
    };
  }

  /**
   * Generate safety report for a formula
   */
  private generateSafetyReport(formula: string, context: FormulaContext): FormulaSafetyReport {
    const hasCycles = this.detectCycles(formula);
    const complexity = this.calculateComplexity(formula);
    const estimatedOperations = this.estimateOperations(formula, context);
    const divisionRisk = this.checkDivisionRisk(formula);
    const rangeIssues = this.checkRangeIssues(formula, context);

    return {
      hasCycles,
      complexity,
      estimatedOperations,
      divisionRisk,
      rangeIssues,
    };
  }

  /**
   * Check custom safety rules
   */
  private checkCustomRules(formula: string, context: FormulaContext) {
    const violations = [];

    for (const rule of this.customRules) {
      if (!rule.enabled) continue;

      try {
        const result = rule.check(formula, context);
        if (!result) {
          violations.push({
            ruleId: rule.id,
            severity: rule.severity,
            message: rule.description,
          });
        }
      } catch (error) {
        violations.push({
          ruleId: rule.id,
          severity: 'error' as const,
          message: `Rule check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return violations;
  }

  /**
   * Generate recommendations based on safety analysis
   */
  private generateRecommendations(safetyReport: FormulaSafetyReport, ruleViolations: any[]): string[] {
    const recommendations: string[] = [];

    if (safetyReport.hasCycles) {
      recommendations.push('Remove circular dependencies in formula');
    }

    if (safetyReport.complexity === 'high') {
      recommendations.push('Simplify formula to reduce complexity');
    }

    if (safetyReport.estimatedOperations > this.config.maxOperations) {
      recommendations.push('Reduce estimated operations for better performance');
    }

    if (safetyReport.divisionRisk) {
      recommendations.push('Add division by zero protection');
    }

    if (safetyReport.rangeIssues.length > 0) {
      recommendations.push('Review stat ranges to prevent overflow/underflow');
    }

    ruleViolations.forEach(violation => {
      if (violation.severity === 'critical' || violation.severity === 'error') {
        recommendations.push(`Fix: ${violation.message}`);
      }
    });

    return recommendations;
  }

  /**
   * Determine overall safety level
   */
  private determineOverallSafety(safetyReport: FormulaSafetyReport, ruleViolations: any[]): 'safe' | 'warning' | 'unsafe' | 'critical' {
    // Check for critical issues
    if (safetyReport.hasCycles && !this.config.allowCycles) {
      return 'critical';
    }

    const criticalViolations = ruleViolations.filter(v => v.severity === 'critical');
    if (criticalViolations.length > 0) {
      return 'critical';
    }

    // Check for unsafe issues
    const errorViolations = ruleViolations.filter(v => v.severity === 'error');
    if (errorViolations.length > 0 || safetyReport.divisionRisk) {
      return 'unsafe';
    }

    // Check for warnings
    const warningViolations = ruleViolations.filter(v => v.severity === 'warning');
    if (
      warningViolations.length > 0 ||
      safetyReport.complexity === 'high' ||
      safetyReport.rangeIssues.length > 0
    ) {
      return 'warning';
    }

    return 'safe';
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(results: SafetyAnalysisResult[]) {
    const issueCounts = new Map<string, number>();
    const complexityCounts = new Map<string, number>();
    const riskFactors: string[] = [];

    results.forEach(result => {
      // Count issues
      result.ruleViolations.forEach(violation => {
        issueCounts.set(violation.message, (issueCounts.get(violation.message) || 0) + 1);
      });

      // Count complexity
      complexityCounts.set(
        result.safetyReport.complexity,
        (complexityCounts.get(result.safetyReport.complexity) || 0) + 1
      );

      // Collect risk factors
      if (result.safetyReport.hasCycles) riskFactors.push('cycles');
      if (result.safetyReport.divisionRisk) riskFactors.push('division');
      if (result.safetyReport.rangeIssues.length > 0) riskFactors.push('range');
    });

    const mostCommonIssues = Array.from(issueCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count }));

    return {
      mostCommonIssues,
      complexityDistribution: Object.fromEntries(complexityCounts),
      riskFactors: [...new Set(riskFactors)],
    };
  }

  /**
   * Determine overall storage health
   */
  private determineStorageHealth(results: SafetyAnalysisResult[]): 'excellent' | 'good' | 'warning' | 'critical' {
    const criticalCount = results.filter(r => r.overallSafety === 'critical').length;
    const unsafeCount = results.filter(r => r.overallSafety === 'unsafe').length;
    const warningCount = results.filter(r => r.overallSafety === 'warning').length;

    if (criticalCount > 0) return 'critical';
    if (unsafeCount > results.length * 0.2) return 'critical';
    if (unsafeCount > 0 || warningCount > results.length * 0.5) return 'warning';
    if (warningCount > 0) return 'good';
    return 'excellent';
  }

  /**
   * Detect cycles in formula dependencies
   */
  private detectCycles(formula: string): boolean {
    // Simple cycle detection - check for self-references
    const identifiers = this.extractIdentifiers(formula);
    
    // This is a basic implementation - more sophisticated cycle detection would require AST analysis
    for (const identifier of identifiers) {
      if (formula.includes(`${identifier}(`) && formula.includes(identifier)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Calculate formula complexity
   */
  private calculateComplexity(formula: string): 'low' | 'medium' | 'high' {
    const operators = (formula.match(/[+\-*/]/g) || []).length;
    const functions = (formula.match(/[a-zA-Z_]+\(/g) || []).length;
    const identifiers = this.extractIdentifiers(formula).length;
    
    const complexity = operators + functions * 2 + identifiers;
    
    if (complexity <= 5) return 'low';
    if (complexity <= 15) return 'medium';
    return 'high';
  }

  /**
   * Estimate operations count
   */
  private estimateOperations(formula: string, context: FormulaContext): number {
    const operators = (formula.match(/[+\-*/]/g) || []).length;
    const functions = (formula.match(/[a-zA-Z_]+\(/g) || []).length;
    
    return operators + functions * 3 + 1; // Base operation
  }

  /**
   * Check for division risks
   */
  private checkDivisionRisk(formula: string): boolean {
    return formula.includes('/') && !formula.includes('&&');
  }

  /**
   * Check for range issues
   */
  private checkRangeIssues(formula: string, context: FormulaContext): RangeIssue[] {
    const issues: RangeIssue[] = [];
    const identifiers = this.extractIdentifiers(formula);

    for (const stat of identifiers) {
      const statInfo = context.stats[stat];
      if (!statInfo) continue;

      // Check for potential negative input if not allowed
      if (!this.config.allowNegative && statInfo.min < 0) {
        issues.push({
          stat,
          issue: 'negative_input',
          message: `Stat ${stat} can be negative, which may cause issues`,
        });
      }

      // Check for potential zero division
      if (formula.includes(`/${stat}`) && statInfo.min <= 0 && statInfo.max >= 0) {
        issues.push({
          stat,
          issue: 'zero_division',
          message: `Potential zero division with stat ${stat}`,
        });
      }

      // Check for overflow risk
      if (Math.abs(statInfo.max) > 1000000) {
        issues.push({
          stat,
          issue: 'overflow_risk',
          message: `Stat ${stat} has large range, potential overflow risk`,
        });
      }
    }

    return issues;
  }

  /**
   * Extract identifiers from formula
   */
  private extractIdentifiers(formula: string): string[] {
    const supportedFunctions = ['min', 'max', 'abs', 'floor', 'ceil', 'round'];
    const cleaned = formula.replace(/[0-9.]+/g, ' ');
    const words = cleaned.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    return words.filter((w) => !supportedFunctions.includes(w.toLowerCase()));
  }
}

// Default safety rules
export const DEFAULT_SAFETY_RULES: SafetyRule[] = [
  {
    id: 'no-hardcoded-values',
    name: 'No Hardcoded Values',
    description: 'Formulas should not contain hardcoded numeric values',
    enabled: true,
    severity: 'warning',
    check: (formula: string) => !/\b\d{2,}\b/.test(formula),
  },
  {
    id: 'balanced-operations',
    name: 'Balanced Operations',
    description: 'Formulas should have balanced number of operations',
    enabled: true,
    severity: 'info',
    check: (formula: string) => {
      const operators = (formula.match(/[+\-*/]/g) || []).length;
      return operators <= 10;
    },
  },
  {
    id: 'no-nested-functions',
    name: 'No Deeply Nested Functions',
    description: 'Avoid deeply nested function calls',
    enabled: true,
    severity: 'warning',
    check: (formula: string) => {
      const maxNesting = Math.max(...(formula.match(/\(/g) || []).map((_, i, arr) => 
        arr.slice(0, i + 1).filter(c => c === '(').length - 
        arr.slice(0, i + 1).filter(c => c === ')').length
      ));
      return maxNesting <= 3;
    },
  },
];

// Default configuration
export const DEFAULT_SAFETY_CONFIG: SafetyAnalysisConfig = {
  maxComplexity: 'medium',
  maxOperations: 1000,
  allowNegative: false,
  allowDivision: true,
  allowCycles: false,
  customRules: DEFAULT_SAFETY_RULES,
};
