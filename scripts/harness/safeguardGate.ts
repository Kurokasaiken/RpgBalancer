/**
 * Safeguard gate for the executor harness.
 *
 * Runs the mandatory safeguard suite before a task can be marked complete.
 * Aligned with .windsurf/rules/00-project-invariants.md:
 *   npm run lint -- <scope>
 *   npm run test -- <scope>
 *   npm run build:check
 *   npm run kanban:lint
 */

import { execSync } from 'node:child_process';

/** Result of a single safeguard step. */
export interface SafeguardResult {
  step: string;
  status: 'PASSED' | 'FAILED';
  duration: number;
  output: string;
  critical: boolean;
}

/** Outcome of the full gate. */
export interface SafeguardGateOutcome {
  ok: boolean;
  results: SafeguardResult[];
}

const DEFAULT_STEPS = [
  {
    name: 'TypeScript Build Check',
    command: 'npm run build:check',
    critical: true,
    timeoutMs: 180000,
  },
  {
    name: 'ESLint Check',
    command: 'npm run lint',
    critical: true,
    timeoutMs: 120000,
  },
  {
    name: 'Unit Tests',
    command: 'npm run test -- --run',
    critical: true,
    timeoutMs: 300000,
  },
  {
    name: 'Kanban Validation',
    command: 'npm run kanban:lint',
    critical: true,
    timeoutMs: 30000,
  },
];

/**
 * Run the mandatory safeguard gate.
 *
 * @param taskId Task identifier used only for logging.
 * @param scope Optional scope argument for lint/test (e.g. tests/unit/harness).
 * @param executionHint Optional execution hint (atomic/verified/architectural) to determine additional safeguards.
 */
export async function runSafeguardGate(
  taskId: string,
  scope?: string,
  executionHint?: 'atomic' | 'verified' | 'architectural',
): Promise<SafeguardGateOutcome> {
  let steps = DEFAULT_STEPS.map((step) => ({
    ...step,
    command: scope && (step.command.startsWith('npm run lint') || step.command.startsWith('npm run test'))
      ? `${step.command} -- ${scope}`
      : step.command,
  }));

  // Add Semgrep safeguard for verified and architectural tasks
  if (executionHint === 'verified' || executionHint === 'architectural') {
    const semgrepStep = {
      name: 'Semgrep Security Scan',
      command: scope ? `npx semgrep --config=auto ${scope}` : 'npx semgrep --config=auto',
      critical: true,
      timeoutMs: 120000,
    };
    steps.push(semgrepStep);
  }

  // Add legacy patterns check for UI tasks
  if (!scope || scope.includes('src/ui') || scope.includes('src/pages')) {
    const legacyPatternsStep = {
      name: 'Legacy Patterns Check',
      command: 'bash scripts/check-legacy-patterns.sh',
      critical: true,
      timeoutMs: 60000,
    };
    steps.push(legacyPatternsStep);
  }

  const results: SafeguardResult[] = [];
  let allPassed = true;

  for (const step of steps) {
    const startTime = Date.now();
    try {
      const output = execSync(step.command, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10,
        timeout: step.timeoutMs,
      });
      const duration = Date.now() - startTime;
      results.push({
        step: step.name,
        status: 'PASSED',
        duration,
        output: output.trim().slice(-4000),
        critical: step.critical,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error as { stdout?: string; stderr?: string; message?: string; code?: string };
      const combined = `${err.stdout ?? ''}\n${err.stderr ?? ''}`.trim();
      const output = err.code === 'ETIMEDOUT'
        ? `Timeout after ${step.timeoutMs}ms. Reduce scope or re-run with a shorter command.`
        : (combined || err.message || 'command failed');
      results.push({
        step: step.name,
        status: 'FAILED',
        duration,
        output,
        critical: step.critical,
      });
      if (step.critical) {
        allPassed = false;
      }
    }
  }

  return { ok: allPassed, results };
}
