export interface FormulaValidationResult {
  valid: boolean;
  error?: string;
  usedStats: string[];
}

const SUPPORTED_FUNCTIONS = ['min', 'max', 'abs', 'floor', 'ceil', 'round'];

function extractIdentifiers(formula: string): string[] {
  const cleaned = formula.replace(/[0-9.]+/g, ' ');
  const words = cleaned.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  return words.filter((w) => !SUPPORTED_FUNCTIONS.includes(w.toLowerCase()));
}

export function validateFormula(formula: string, availableStats: string[]): FormulaValidationResult {
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

  return { valid: true, usedStats: identifiers };
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
