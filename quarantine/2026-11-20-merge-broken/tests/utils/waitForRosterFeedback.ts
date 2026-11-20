import { expect, type Page } from '@playwright/test';
import { rosterFeedbackPatterns } from '../config/rosterFeedbackPatterns';
import type { IdleVillageTestHooks } from '../../src/ui/idleVillage/types/IdleVillageTestHooks';

export interface WaitForRosterFeedbackOptions {
  /**
   * Regex (or list of regexes) considered valid success strings.
   * Defaults to {@link rosterFeedbackPatterns.success}.
   */
  successPattern?: RegExp | RegExp[] | null;
  /**
   * Regex (or list of regexes) considered blocking error strings.
   * Defaults to {@link rosterFeedbackPatterns.error}.
   */
  errorPattern?: RegExp | RegExp[] | null;
  locator?: string;
  visibleTimeout?: number;
  pollTimeout?: number;
  pollIntervals?: number[];
}

const DEFAULT_SUCCESS_PATTERNS = rosterFeedbackPatterns.success;
const DEFAULT_ERROR_PATTERNS = rosterFeedbackPatterns.error;

const normalizePatterns = (
  input: RegExp | RegExp[] | null | undefined,
  fallback: readonly RegExp[],
): RegExp[] => {
  if (input === null) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  }
  if (input) {
    return [input];
  }
  return [...fallback];
};

const combinePatterns = (patterns: readonly RegExp[]): RegExp => {
  if (!patterns.length) {
    return /.*/;
  }

  const flags = [...new Set(patterns.flatMap(pattern => pattern.flags.split('')))].join('');
  const source = patterns.map(pattern => `(?:${pattern.source})`).join('|');
  return new RegExp(source, flags);
};

const matchesAnyPattern = (value: string | null | undefined, patterns: readonly RegExp[]): boolean => {
  if (!value) return false;
  return patterns.some(pattern => pattern.test(value));
};

declare global {
  interface Window {
    __idleVillageTestHooks?: IdleVillageTestHooks;
  }
}

export async function waitForRosterFeedback(
  page: Page,
  options: WaitForRosterFeedbackOptions = {},
): Promise<string> {
  const {
    successPattern,
    errorPattern,
    locator = '[data-testid="roster-feedback"]',
    visibleTimeout = 10_000,
    pollTimeout = 10_000,
    pollIntervals = [250, 500, 750],
  } = options;

  const successPatterns = normalizePatterns(successPattern, DEFAULT_SUCCESS_PATTERNS);
  const errorPatterns = normalizePatterns(errorPattern, DEFAULT_ERROR_PATTERNS);
  const successExpectationPattern = combinePatterns(successPatterns.length ? successPatterns : DEFAULT_SUCCESS_PATTERNS);
  const errorMatchers = errorPatterns.length ? errorPatterns : DEFAULT_ERROR_PATTERNS;

  const feedback = page.locator(locator);
  await expect(feedback).toBeVisible({ timeout: visibleTimeout });

  let lastMessage = '';

  await expect
    .poll(
      async () => {
        await feedback.waitFor({ state: 'attached' });
        const text = (await feedback.innerText()).trim();
        lastMessage = text;
        if (matchesAnyPattern(text, errorMatchers)) {
          return text; // Return error messages as valid feedback
        }
        if (matchesAnyPattern(text, successPatterns)) {
          return text;
        }

        const hookState = await page.evaluate(() => {
          const hooks = window.__idleVillageTestHooks;
          return {
            feedback: hooks?.getAssignmentFeedback?.() ?? null,
            diagnostics: hooks?.getAssignmentDiagnostics?.() ?? null,
          };
        });

        const hookFeedback = hookState.feedback ?? null;
        if (matchesAnyPattern(hookFeedback, errorMatchers)) {
          throw new Error(`Hook assignment feedback reported error: "${hookFeedback}"`);
        }

        const diagnosticReason = hookState.diagnostics?.reason;
        if (diagnosticReason && diagnosticReason.toLowerCase() !== 'ok') {
          throw new Error(`Assignment diagnostics reported error: "${diagnosticReason}"`);
        }

        if (matchesAnyPattern(hookFeedback, successPatterns)) {
          lastMessage = hookFeedback ?? lastMessage;
          return hookFeedback ?? '';
        }

        return text;
      },
      { timeout: pollTimeout, intervals: pollIntervals },
    )
    .toMatch(successExpectationPattern);

  return lastMessage;
}
