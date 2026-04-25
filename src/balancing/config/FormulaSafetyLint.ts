/**
 * Balancer Formula Safety Lint Suite
 * 
 * Comprehensive formula validation and safety analysis for derived stat formulas.
 * Provides cycle detection, range analysis, complexity assessment, and severity-based reporting.
 * 
 * @module FormulaSafetyLint
 * @since 2026-01-20
 * @author Guardian-Balancer – Formula Safety
 */

import { z } from 'zod';
import type { 
  FormulaValidationResult, 
  FormulaWarning, 
  FormulaSafetyReport, 
  RangeIssue, 
  FormulaContext 
} from './FormulaEngine';

/**
 * Lint result status
 */
export type FormulaLintStatus = 'pass' | 'warning' | 'error' | 'critical';

/**
 * Lint severity levels
 */
export type LintSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Lint rule types
 */
export type LintRuleType = 
  | 'cycle_detection'
  | 'range_analysis'
  | 'complexity_analysis'
  | 'division_safety'
  | 'negative_values'
  | 'overflow_risk'
  | 'performance_warning'
  | 'complexity';

/**
 * Lint rule configuration
 */
export interface LintRule {
  /** Rule identifier */
  id: string;
  /** Rule type */
  type: LintRuleType;
  /** Rule name */
  name: string;
  /** Rule description */
  description: string;
  /** Default severity */
  defaultSeverity: LintSeverity;
  /** Whether rule is enabled */
  enabled: boolean;
  /** Rule-specific configuration */
  config: Record<string, any>;
}

/**
 * Lint result for a single formula
 */
export interface FormulaLintResult {
  /** Formula being linted */
  formula: string;
  /** Overall validation result */
  validation: FormulaValidationResult;
  /** Lint warnings by rule */
  warnings: FormulaLintWarning[];
  /** Overall lint status */
  status: 'pass' | 'warning' | 'error' | 'critical';
  /** Processing time in milliseconds */
  processingTime: number;
}

/**
 * Enhanced lint warning with rule context
 */
export interface FormulaLintWarning extends FormulaWarning {
  /** Rule that generated this warning */
  ruleId: string;
  /** Rule type */
  ruleType: LintRuleType;
  /** Suggested fix (if available) */
  suggestion?: string;
  /** Code context around the issue */
  context?: {
    before: string;
    after: string;
    line: number;
    column: number;
  };
}

/**
 * Lint suite configuration
 */
export interface FormulaLintConfig {
  /** Enabled rules */
  enabledRules: string[];
  /** Rule configurations */
  ruleConfigs: Record<string, Record<string, any>>;
  /** Global severity overrides */
  severityOverrides: Record<string, LintSeverity>;
  /** Performance settings */
  maxOperations: number;
  /** Timeout in milliseconds */
  timeout: number;
  /** Whether to include suggestions */
  includeSuggestions: boolean;
}

/**
 * Lint suite results
 */
export interface FormulaLintResults {
  /** Overall status */
  status: 'pass' | 'warning' | 'error' | 'critical';
  /** Total formulas processed */
  totalFormulas: number;
  /** Results by formula */
  results: FormulaLintResult[];
  /** Summary statistics */
  summary: {
    pass: number;
    warning: number;
    error: number;
    critical: number;
  };
  /** Rules triggered */
  triggeredRules: Record<string, number>;
  /** Processing time in milliseconds */
  totalProcessingTime: number;
}

/**
 * Default lint configuration
 */
export const DEFAULT_FORMULA_LINT_CONFIG: FormulaLintConfig = {
  enabledRules: [
    'cycle_detection',
    'range_analysis',
    'complexity_analysis',
    'division_safety',
    'negative_values',
    'overflow_risk',
    'performance_warning',
  ],
  ruleConfigs: {
    cycle_detection: {
      maxDepth: 10,
      checkIndirect: true,
    },
    range_analysis: {
      checkNegative: true,
      checkZero: true,
      checkOverflow: true,
      maxSafeValue: 1e10,
    },
    complexity_analysis: {
      maxOperations: 100,
      maxNesting: 5,
      complexityThresholds: {
        low: 10,
        medium: 50,
        high: 100,
      },
    },
    division_safety: {
      checkZeroDivision: true,
      checkNegativeDivision: true,
      warnOnDivisionByVariables: true,
    },
    negative_values: {
      allowNegative: false,
      warnOnNegativeOperations: true,
    },
    overflow_risk: {
      checkExponential: true,
      checkMultiplication: true,
      maxSafeExponent: 20,
    },
    performance_warning: {
      maxComplexity: 'medium',
      warnOnRecursion: true,
    },
  },
  severityOverrides: {},
  maxOperations: 1000,
  timeout: 5000,
  includeSuggestions: true,
};

/**
 * Built-in lint rules
 */
export const BUILTIN_LINT_RULES: LintRule[] = [
  {
    id: 'cycle_detection',
    type: 'cycle_detection',
    name: 'Cycle Detection',
    description: 'Detects circular dependencies in formulas',
    defaultSeverity: 'error',
    enabled: true,
    config: {
      maxDepth: 10,
      checkIndirect: true,
    },
  },
  {
    id: 'range_analysis',
    type: 'range_analysis',
    name: 'Range Analysis',
    description: 'Analyzes potential range issues and edge cases',
    defaultSeverity: 'warning',
    enabled: true,
    config: {
      checkNegative: true,
      checkZero: true,
      checkOverflow: true,
      maxSafeValue: 1e10,
    },
  },
  {
    id: 'complexity_analysis',
    type: 'complexity_analysis',
    name: 'Complexity Analysis',
    description: 'Estimates formula complexity and performance impact',
    defaultSeverity: 'info',
    enabled: true,
    config: {
      maxOperations: 100,
      maxNesting: 5,
      complexityThresholds: {
        low: 10,
        medium: 50,
        high: 100,
      },
    },
  },
  {
    id: 'division_safety',
    type: 'division_safety',
    name: 'Division Safety',
    description: 'Checks for division by zero and negative division risks',
    defaultSeverity: 'warning',
    enabled: true,
    config: {
      checkZeroDivision: true,
      checkNegativeDivision: true,
      warnOnDivisionByVariables: true,
    },
  },
  {
    id: 'negative_values',
    type: 'negative_values',
    name: 'Negative Values',
    description: 'Validates handling of negative values in formulas',
    defaultSeverity: 'warning',
    enabled: true,
    config: {
      allowNegative: false,
      warnOnNegativeOperations: true,
    },
  },
  {
    id: 'overflow_risk',
    type: 'overflow_risk',
    name: 'Overflow Risk',
    description: 'Identifies potential numeric overflow scenarios',
    defaultSeverity: 'error',
    enabled: true,
    config: {
      checkExponential: true,
      checkMultiplication: true,
      maxSafeExponent: 20,
    },
  },
  {
    id: 'performance_warning',
    type: 'performance_warning',
    name: 'Performance Warning',
    description: 'Warns about potential performance issues',
    defaultSeverity: 'info',
    enabled: true,
    config: {
      maxComplexity: 'medium',
      warnOnRecursion: true,
    },
  },
];

/**
 * Formula Safety Lint Suite
 * 
 * Main class for performing comprehensive formula safety analysis.
 */
export class FormulaSafetyLint {
  private config: FormulaLintConfig;
  private rules: Map<string, LintRule> = new Map();

  constructor(config: Partial<FormulaLintConfig> = {}) {
    this.config = { ...DEFAULT_FORMULA_LINT_CONFIG, ...config };
    
    // Initialize built-in rules
    BUILTIN_LINT_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
    
    // Apply configuration
    this.applyConfiguration();
  }

  /**
   * Apply configuration to rules
   */
  private applyConfiguration(): void {
    // Enable/disable rules based on configuration
    this.rules.forEach((rule, id) => {
      rule.enabled = this.config.enabledRules.includes(id);
      
      // Apply rule-specific configuration
      if (this.config.ruleConfigs[id]) {
        rule.config = { ...rule.config, ...this.config.ruleConfigs[id] };
      }
      
      // Apply severity overrides
      if (this.config.severityOverrides[id]) {
        // Note: severity is applied at runtime since it's not in the interface
      }
    });
  }

  /**
   * Lint a single formula
   * 
   * @param formula - Formula to lint
   * @param context - Formula context with stats and constraints
   * @returns Lint result for the formula
   */
  async lintFormula(formula: string, context: FormulaContext): Promise<FormulaLintResult> {
    const startTime = Date.now();
    const warnings: FormulaLintWarning[] = [];
    
    try {
      // Parse and validate the formula (using existing FormulaEngine logic)
      const validation = this.validateFormula(formula, context);
      
      // Run enabled lint rules
      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue;
        
        const ruleWarnings = await this.runRule(rule, formula, context, validation);
        warnings.push(...ruleWarnings);
      }
      
      // Determine overall status
      const status = this.calculateStatus(warnings);
      
      return {
        formula,
        validation,
        warnings,
        status,
        processingTime: Date.now() - startTime,
      };
      
    } catch (error) {
      // Handle unexpected errors
      const criticalWarning: FormulaLintWarning = {
        type: 'complexity',
        message: `Critical error during linting: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'critical',
        ruleId: 'system_error',
        ruleType: 'complexity',
        suggestion: 'Check formula syntax and try again',
      };
      
      return {
        formula,
        validation: {
          valid: false,
          error: criticalWarning.message,
          usedStats: [],
          warnings: [criticalWarning],
        },
        warnings: [criticalWarning],
        status: 'critical',
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Lint multiple formulas
   * 
   * @param formulas - Array of formulas to lint
   * @param context - Formula context
   * @returns Comprehensive lint results
   */
  async lintFormulas(formulas: string[], context: FormulaContext): Promise<FormulaLintResults> {
    const startTime = Date.now();
    const results: FormulaLintResult[] = [];
    const triggeredRules: Record<string, number> = {};
    
    // Process each formula
    for (const formula of formulas) {
      const result = await this.lintFormula(formula, context);
      results.push(result);
      
      // Track triggered rules
      result.warnings.forEach(warning => {
        triggeredRules[warning.ruleId] = (triggeredRules[warning.ruleId] || 0) + 1;
      });
    }
    
    // Calculate summary statistics
    const summary = results.reduce(
      (acc, result) => {
        acc[result.status]++;
        return acc;
      },
      { pass: 0, warning: 0, error: 0, critical: 0 }
    );
    
    // Determine overall status
    const status = this.calculateStatus(results.flatMap(r => r.warnings));
    
    return {
      status,
      totalFormulas: formulas.length,
      results,
      summary,
      triggeredRules,
      totalProcessingTime: Date.now() - startTime,
    };
  }

  /**
   * Validate formula using existing FormulaEngine logic
   * 
   * @param formula - Formula to validate
   * @param context - Formula context
   * @returns Validation result
   */
  private validateFormula(formula: string, context: FormulaContext): FormulaValidationResult {
    // This would integrate with the existing FormulaEngine.validateFormula
    // For now, we'll create a basic implementation
    
    const usedStats = this.extractStatReferences(formula);
    const warnings: FormulaWarning[] = [];
    
    // Basic validation
    let valid = true;
    let error: string | undefined;
    
    try {
      // Check for balanced parentheses
      const openParens = (formula.match(/\(/g) || []).length;
      const closeParens = (formula.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        valid = false;
        error = 'Unbalanced parentheses';
      }
      
      // Check for invalid characters - allow function names
      if (!/^[a-zA-Z0-9+\-*/().\s]+$/.test(formula)) {
        // Check if it's just function calls that are valid
        const hasValidFunctions = /^(max|min|abs|floor|ceil|round|sqrt|pow|log)\s*\([^)]*\s*[a-zA-Z0-9+\-*/().\s]*$/;
        if (!hasValidFunctions.test(formula)) {
          valid = false;
          error = 'Invalid characters in formula';
        }
      }
      
      // Check for empty formula - treat as valid
      if (formula.trim() === '') {
        valid = true;
        error = undefined;
      }
      
    } catch (e) {
      valid = false;
      error = e instanceof Error ? e.message : String(e);
    }
    
    // Calculate safety metrics
    const operations = this.estimateOperations(formula);
    let complexity: 'low' | 'medium' | 'high' = 'low';
    
    if (operations <= 10) {
      complexity = 'low';
    } else if (operations <= 50) {
      complexity = 'medium';
    } else {
      complexity = 'high';
    }
    
    const safety: FormulaSafetyReport = {
      hasCycles: false,
      complexity,
      estimatedOperations: operations,
      divisionRisk: formula.includes('/'),
      rangeIssues: [],
    };
    
    return {
      valid,
      error,
      usedStats,
      warnings,
      safety,
    };
  }

  /**
   * Run a specific lint rule
   * 
   * @param rule - Rule to run
   * @param formula - Formula being linted
   * @param context - Formula context
   * @param validation - Current validation result
   * @returns Warnings generated by the rule
   */
  private async runRule(
    rule: LintRule, 
    formula: string, 
    context: FormulaContext, 
    validation: FormulaValidationResult
  ): Promise<FormulaLintWarning[]> {
    const warnings: FormulaLintWarning[] = [];
    
    // Apply severity override if configured
    const severity = this.config.severityOverrides[rule.id] || rule.defaultSeverity;
    
    switch (rule.type) {
      case 'cycle_detection':
        warnings.push(...this.checkCycleDetection(rule, formula, context, severity));
        break;
      case 'range_analysis':
        warnings.push(...this.checkRangeAnalysis(rule, formula, context, severity));
        break;
      case 'complexity_analysis':
        warnings.push(...this.checkComplexityAnalysis(rule, formula, context, severity));
        break;
      case 'division_safety':
        warnings.push(...this.checkDivisionSafety(rule, formula, context, severity));
        break;
      case 'negative_values':
        warnings.push(...this.checkNegativeValues(rule, formula, context, severity));
        break;
      case 'overflow_risk':
        warnings.push(...this.checkOverflowRisk(rule, formula, context, severity));
        break;
      case 'performance_warning':
        warnings.push(...this.checkPerformanceWarning(rule, formula, context, severity));
        break;
    }
    
    return warnings;
  }

  /**
   * Check for circular dependencies
   */
  private checkCycleDetection(rule: LintRule, formula: string, context: FormulaContext, severity: LintSeverity): FormulaLintWarning[] {
    const warnings: FormulaLintWarning[] = [];
    const stats = this.extractStatReferences(formula);
    
    // Simple cycle detection: check if formula references itself
    for (const stat of stats) {
      if (formula.includes(`${stat}(`) || formula.includes(`${stat}[`)) {
        warnings.push({
          type: 'complexity',
          message: `Potential circular reference detected for stat "${stat}"`,
          severity,
          ruleId: rule.id,
          ruleType: rule.type,
          suggestion: 'Consider restructuring the formula to avoid circular dependencies',
        });
      }
    }
    
    return warnings;
  }

  /**
   * Check for range issues
   */
  private checkRangeAnalysis(rule: LintRule, formula: string, context: FormulaContext, severity: LintSeverity): FormulaLintWarning[] {
    const warnings: FormulaLintWarning[] = [];
    const config = rule.config;
    
    // Check for division by zero risks
    if (formula.includes('/')) {
      const divisorMatch = formula.match(/\/\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (divisorMatch) {
        const divisor = divisorMatch[1];
        if (context.stats[divisor] && context.stats[divisor].min === 0) {
          warnings.push({
            type: 'range',
            message: `Division by zero risk: "${divisor}" can be zero`,
            severity,
            ruleId: rule.id,
            ruleType: rule.type,
            suggestion: `Add guard: max(${divisor}, 1) or check if ${divisor} != 0`,
          });
        }
      }
    }
    
    // Check for negative value risks
    if (!context.allowNegative && formula.includes('-')) {
      warnings.push({
        type: 'range',
        message: 'Negative values not allowed but subtraction detected',
        severity,
        ruleId: rule.id,
        ruleType: rule.type,
        suggestion: 'Use max() to ensure non-negative results',
      });
    }
    
    return warnings;
  }

  /**
   * Check formula complexity
   */
  private checkComplexityAnalysis(rule: LintRule, formula: string, context: FormulaContext, severity: LintSeverity): FormulaLintWarning[] {
    const warnings: FormulaLintWarning[] = [];
    const operations = this.estimateOperations(formula);
    const config = rule.config.complexityThresholds;
    
    let complexity: 'low' | 'medium' | 'high';
    if (operations <= config.low) {
      complexity = 'low';
    } else if (operations <= config.medium) {
      complexity = 'medium';
    } else {
      complexity = 'high';
    }
    
    if (complexity === 'high') {
      warnings.push({
        type: 'complexity',
        message: `High complexity formula: ${operations} operations estimated`,
        severity,
        ruleId: rule.id,
        ruleType: rule.type,
        suggestion: 'Consider simplifying the formula or breaking it into multiple parts',
      });
    }
    
    return warnings;
  }

  /**
   * Check division safety
   */
  private checkDivisionSafety(rule: LintRule, formula: string, context: FormulaContext, severity: LintSeverity): FormulaLintWarning[] {
    const warnings: FormulaLintWarning[] = [];
    
    // Check for division by variables
    const divisionMatches = formula.match(/\/\s*([a-zA-Z_][a-zA-Z0-9_]*)/g);
    if (divisionMatches) {
      divisionMatches.forEach(match => {
        const variable = match.replace('/\s*', '');
        warnings.push({
          type: 'division',
          message: `Division by variable "${variable}" detected`,
          severity,
          ruleId: rule.id,
          ruleType: rule.type,
          suggestion: `Consider adding guard: max(${variable}, 0.001)`,
        });
      });
    }
    
    return warnings;
  }

  /**
   * Check negative value handling
   */
  private checkNegativeValues(rule: LintRule, formula: string, context: FormulaContext, severity: LintSeverity): FormulaLintWarning[] {
    const warnings: FormulaLintWarning[] = [];
    
    if (!context.allowNegative) {
      // Check for operations that might produce negative results
      if (formula.includes('-') && !formula.includes('max(')) {
        warnings.push({
          type: 'range',
          message: 'Potential negative results without protection',
          severity,
          ruleId: rule.id,
          ruleType: rule.type,
          suggestion: 'Use max(expression, 0) to ensure non-negative results',
        });
      }
    }
    
    return warnings;
  }

  /**
   * Check for overflow risks
   */
  private checkOverflowRisk(rule: LintRule, formula: string, context: FormulaContext, severity: LintSeverity): FormulaLintWarning[] {
    const warnings: FormulaLintWarning[] = [];
    const config = rule.config;
    
    // Check for exponential operations
    if (formula.includes('**') || formula.includes('^')) {
      warnings.push({
        type: 'range',
        message: 'Exponential operation detected - potential overflow risk',
        severity,
        ruleId: rule.id,
        ruleType: rule.type,
        suggestion: 'Consider using logarithmic scaling or bounds checking',
      });
    }
    
    // Check for large multiplications
    const multiplications = (formula.match(/\*/g) || []).length;
    if (multiplications > 5) {
      warnings.push({
        type: 'range',
        message: `Multiple multiplications (${multiplications}) - potential overflow risk`,
        severity,
        ruleId: rule.id,
        ruleType: rule.type,
        suggestion: 'Consider using logarithmic scaling or intermediate bounds',
      });
    }
    
    return warnings;
  }

  /**
   * Check for performance warnings
   */
  private checkPerformanceWarning(rule: LintRule, formula: string, context: FormulaContext, severity: LintSeverity): FormulaLintWarning[] {
    const warnings: FormulaLintWarning[] = [];
    const operations = this.estimateOperations(formula);
    const config = rule.config;
    
    if (operations > 50) {
      warnings.push({
        type: 'performance',
        message: `Complex formula may impact performance: ${operations} operations`,
        severity,
        ruleId: rule.id,
        ruleType: rule.type,
        suggestion: 'Consider caching results or simplifying the formula',
      });
    }
    
    return warnings;
  }

  /**
   * Extract stat references from formula
   */
  private extractStatReferences(formula: string): string[] {
    // Extract identifiers that are not functions or numbers
    const cleaned = formula.replace(/[0-9.+\-*/()]/g, ' ');
    const words = cleaned.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
    
    // Filter out function names
    const functions = ['min', 'max', 'abs', 'floor', 'ceil', 'round', 'sqrt', 'pow', 'log'];
    return words.filter(word => !functions.includes(word.toLowerCase()));
  }

  /**
   * Estimate number of operations in formula
   */
  private estimateOperations(formula: string): number {
    // Count operators and function calls
    const operators = (formula.match(/[+\-*/]/g) || []).length;
    const functions = (formula.match(/[a-zA-Z_][a-zA-Z0-9_]*\(/g) || []).length;
    return operators + functions;
  }

  /**
   * Calculate overall status from warnings
   * 
   * @param warnings - Array of warnings
   * @returns Overall status
   */
  private calculateStatus(warnings: FormulaLintWarning[]): FormulaLintStatus {
    const hasCritical = warnings.some(w => w.severity === 'critical');
    const hasErrors = warnings.some(w => w.severity === 'error');
    const hasWarnings = warnings.some(w => w.severity === 'warning');
    
    if (hasCritical) return 'critical';
    if (hasErrors) return 'error';
    if (hasWarnings) return 'warning';
    return 'pass';
  }

  /**
   * Get current configuration
   */
  getConfig(): FormulaLintConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<FormulaLintConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyConfiguration();
  }

  /**
   * Get available rules
   */
  getRules(): LintRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Enable/disable a rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): LintRule | undefined {
    return this.rules.get(ruleId);
  }
}

/**
 * Export default instance
 */
export const defaultFormulaLint = new FormulaSafetyLint();

/**
 * Convenience function for quick linting
 */
export async function lintFormula(formula: string, context: FormulaContext): Promise<FormulaLintResult> {
  return defaultFormulaLint.lintFormula(formula, context);
}

/**
 * Convenience function for batch linting
 */
export async function lintFormulas(formulas: string[], context: FormulaContext): Promise<FormulaLintResults> {
  return defaultFormulaLint.lintFormulas(formulas, context);
}
