export interface FormulaValidationResult {
  valid: boolean;
  error?: string;
  usedStats: string[];
  warnings?: FormulaWarning[];
  safety?: FormulaSafetyReport;
}

export interface FormulaWarning {
  type: 'range' | 'division' | 'complexity' | 'performance';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  position?: { start: number; end: number };
}

export interface FormulaSafetyReport {
  hasCycles: boolean;
  complexity: 'low' | 'medium' | 'high';
  estimatedOperations: number;
  divisionRisk: boolean;
  rangeIssues: RangeIssue[];
}

export interface RangeIssue {
  stat: string;
  issue: 'negative_input' | 'zero_division' | 'overflow_risk';
  message: string;
}

export interface FormulaContext {
  stats: Record<string, { min: number; max: number; current: number }>;
  maxOperations?: number;
  allowNegative?: boolean;
}

const SUPPORTED_FUNCTIONS = ['min', 'max', 'abs', 'floor', 'ceil', 'round'];

function extractIdentifiers(formula: string): string[] {
  const cleaned = formula.replace(/[0-9.]+/g, ' ');
  const words = cleaned.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  return words.filter((w) => !SUPPORTED_FUNCTIONS.includes(w.toLowerCase()));
}

/**
 * Detects potential cycles in formula dependencies
 */
function detectCycles(formula: string): boolean {
  // Simple cycle detection: check if formula references itself through complex expressions
  // This is a basic implementation - more sophisticated cycle detection would require AST analysis
  const identifiers = extractIdentifiers(formula);
  
  // Check for self-references (basic cycle detection)
  return identifiers.some(id => {
    // Look for patterns that might indicate circular references
    // This is a simplified check - full cycle detection would need proper AST parsing
    return formula.includes(`${id} * ${id}`) || formula.includes(`${id} / ${id}`);
  });
}

/**
 * Estimates formula complexity based on operations count
 */
function estimateComplexity(formula: string): { complexity: 'low' | 'medium' | 'high'; operations: number } {
  // Count basic operations
  const operations = (formula.match(/[+\-*/]/g) || []).length +
                    (formula.match(/min|max|abs|floor|ceil|round/g) || []).length;
  
  let complexity: 'low' | 'medium' | 'high';
  if (operations <= 3) {
    complexity = 'low';
  } else if (operations <= 8) {
    complexity = 'medium';
  } else {
    complexity = 'high';
  }
  
  return { complexity, operations };
}

/**
 * Analyzes potential range issues in formulas
 */
function analyzeRangeIssues(formula: string, context: FormulaContext): RangeIssue[] {
  const issues: RangeIssue[] = [];
  const identifiers = extractIdentifiers(formula);
  
  identifiers.forEach(stat => {
    const statInfo = context.stats[stat];
    if (!statInfo) return;
    
    // Check for division by zero risk
    if (formula.includes(`/${stat}`) && statInfo.min <= 0 && statInfo.max >= 0) {
      issues.push({
        stat,
        issue: 'zero_division',
        message: `Division by zero possible when ${stat} = 0`
      });
    }
    
    // Check for negative input issues (if not allowed)
    if (!context.allowNegative && statInfo.min < 0) {
      if (formula.includes(`sqrt(${stat})`) || formula.includes(`log(${stat})`)) {
        issues.push({
          stat,
          issue: 'negative_input',
          message: `Negative input risk for ${stat} in mathematical function`
        });
      }
    }
    
    // Check for overflow risk with large numbers
    if (formula.includes(`${stat} * ${stat}`) && Math.abs(statInfo.max) > 1000) {
      issues.push({
        stat,
        issue: 'overflow_risk',
        message: `Potential overflow with ${stat}^2 operation`
      });
    }
  });
  
  return issues;
}

/**
 * Checks for division operations that might cause issues
 */
function checkDivisionRisk(formula: string): boolean {
  // Check for division operations
  const divisionOps = formula.match(/\//g);
  if (!divisionOps) return false;
  
  // Multiple divisions increase risk
  if (divisionOps.length > 2) return true;
  
  // Check for division by variables (higher risk than constants)
  const variableDivisions = formula.match(/\/[a-zA-Z_][a-zA-Z0-9_]*/g);
  return variableDivisions ? variableDivisions.length > 0 : false;
}

/**
 * Creates a comprehensive safety report for the formula
 */
function createSafetyReport(formula: string, context: FormulaContext): FormulaSafetyReport {
  const hasCycles = detectCycles(formula);
  const { complexity, operations } = estimateComplexity(formula);
  const divisionRisk = checkDivisionRisk(formula);
  const rangeIssues = analyzeRangeIssues(formula, context);
  
  return {
    hasCycles,
    complexity,
    estimatedOperations: operations,
    divisionRisk,
    rangeIssues
  };
}

export function validateFormula(formula: string, availableStats: string[], context?: FormulaContext): FormulaValidationResult {
  if (!formula || formula.trim().length === 0) {
    return { valid: false, error: 'Formula cannot be empty', usedStats: [] };
  }

  const identifiers = extractIdentifiers(formula);
  const unknownStats = identifiers.filter((id) => !availableStats.includes(id));

  if (unknownStats.length > 0) {
    return {
      valid: false,
      error: `Unknown stats: ${unknownStats.join(', ')}`,
      usedStats: identifiers,
    };
  }

  try {
    const testContext: Record<string, number> = {};
    availableStats.forEach((s) => {
      testContext[s] = 1;
    });
    const fn = new Function(...Object.keys(testContext), `return ${formula}`);
    const result = fn(...Object.values(testContext));
    if (typeof result !== 'number' || !isFinite(result)) {
      return {
        valid: false,
        error: 'Formula must return a finite number',
        usedStats: identifiers,
      };
    }
  } catch (e) {
    return {
      valid: false,
      error: `Syntax error: ${(e as Error).message}`,
      usedStats: identifiers,
    };
  }

  // Generate warnings and safety report if context is provided
  const warnings: FormulaWarning[] = [];
  let safety: FormulaSafetyReport | undefined;

  if (context) {
    safety = createSafetyReport(formula, context);
    
    // Add warnings based on safety analysis
    if (safety.hasCycles) {
      warnings.push({
        type: 'complexity',
        message: 'Potential circular dependency detected',
        severity: 'warning'
      });
    }
    
    if (safety.complexity === 'high') {
      warnings.push({
        type: 'complexity',
        message: 'High complexity formula may impact performance',
        severity: 'warning'
      });
    }
    
    if (safety.divisionRisk) {
      warnings.push({
        type: 'division',
        message: 'Division operations may cause issues with zero values',
        severity: 'warning'
      });
    }
    
    if (safety.rangeIssues.length > 0) {
      safety.rangeIssues.forEach(issue => {
        warnings.push({
          type: 'range',
          message: issue.message,
          severity: issue.issue === 'zero_division' ? 'error' : 'warning'
        });
      });
    }
  }

  return { 
    valid: true, 
    usedStats: identifiers,
    warnings: warnings.length > 0 ? warnings : undefined,
    safety
  };
}

export function executeFormula(formula: string, values: Record<string, number>): number {
  try {
    const statIds = Object.keys(values);
    const statValues = Object.values(values);
    const fn = new Function(...statIds, `return ${formula}`);
    const result = fn(...statValues);
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch (e) {
    console.error('Formula execution error:', e);
    return 0;
  }
}

export function suggestCompletions(partialFormula: string, availableStats: string[]): string[] {
  const lastWordMatch = partialFormula.match(/[a-zA-Z_][a-zA-Z0-9_]*$/);
  const lastWord = lastWordMatch ? lastWordMatch[0] : '';
  if (!lastWord) return availableStats;
  return availableStats.filter((s) => s.toLowerCase().startsWith(lastWord.toLowerCase()));
}

/**
 * Enhanced validation with full safety analysis and context
 */
export function validateFormulaWithSafety(
  formula: string, 
  availableStats: string[], 
  context: FormulaContext
): FormulaValidationResult {
  return validateFormula(formula, availableStats, context);
}

/**
 * Quick validation without safety analysis (for performance-critical scenarios)
 */
export function validateFormulaBasic(formula: string, availableStats: string[]): FormulaValidationResult {
  return validateFormula(formula, availableStats);
}

/**
 * Lint formula for potential issues and improvements
 */
export function lintFormula(formula: string, availableStats: string[]): FormulaWarning[] {
  const warnings: FormulaWarning[] = [];
  
  // Basic syntax check
  const basicResult = validateFormulaBasic(formula, availableStats);
  if (!basicResult.valid) {
    warnings.push({
      type: 'complexity',
      message: basicResult.error || 'Invalid formula syntax',
      severity: 'error'
    });
    return warnings;
  }
  
  // Complexity warnings
  const { complexity, operations } = estimateComplexity(formula);
  if (complexity === 'high') {
    warnings.push({
      type: 'complexity',
      message: `High complexity: ${operations} operations detected`,
      severity: 'warning'
    });
  }
  
  // Division risk
  if (checkDivisionRisk(formula)) {
    warnings.push({
      type: 'division',
      message: 'Division operations detected - ensure no zero values',
      severity: 'warning'
    });
  }
  
  // Performance warnings
  if (formula.includes('**') || formula.includes('^')) {
    warnings.push({
      type: 'performance',
      message: 'Exponentiation detected - may impact performance',
      severity: 'info'
    });
  }
  
  return warnings;
}

/**
 * Create a default formula context from stat definitions
 */
export function createFormulaContext(stats: Array<{ id: string; min: number; max: number }>): FormulaContext {
  const context: FormulaContext['stats'] = {};
  stats.forEach(stat => {
    context[stat.id] = {
      min: stat.min,
      max: stat.max,
      current: (stat.min + stat.max) / 2
    };
  });
  
  return {
    stats: context,
    maxOperations: 50,
    allowNegative: true
  };
}
