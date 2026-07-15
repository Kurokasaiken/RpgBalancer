#!/usr/bin/env tsx

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

interface BuildResult {
  success: boolean;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timestamp: string;
  duration: number;
}

/**
 * Executes build check and captures output for safeguard logging.
 * Fails explicitly if TypeScript build has errors.
 */
const DEFAULT_BUILD_TIMEOUT_MS = 180000;

function parseArgs(argv: string[]): { timeoutMs: number } {
  const timeoutArg = argv.find((arg) => arg.startsWith('--timeout='));
  const timeoutMs = timeoutArg
    ? Number(timeoutArg.split('=')[1]) || DEFAULT_BUILD_TIMEOUT_MS
    : DEFAULT_BUILD_TIMEOUT_MS;
  return { timeoutMs };
}

async function runBuildCheck(timeoutMs: number): Promise<BuildResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  console.log('🏗️  Running build check...');

  try {
    const stdout = execSync('npm run build', {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: timeoutMs,
    });

    const duration = Date.now() - startTime;

    const result: BuildResult = {
      success: true,
      exitCode: 0,
      stdout,
      stderr: '',
      timestamp,
      duration,
    };

    console.log('✅ Build check passed');
    return result;

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const err = error as { status?: number; code?: string; stdout?: string; stderr?: string; message?: string };

    const result: BuildResult = {
      success: false,
      exitCode: err.status || (err.code === 'ETIMEDOUT' ? 124 : 1),
      stdout: err.stdout || '',
      stderr: err.code === 'ETIMEDOUT'
        ? `Build timed out after ${timeoutMs}ms. Reduce scope or check for infinite loops.`
        : (err.stderr || err.message || ''),
      timestamp,
      duration,
    };

    console.error('❌ Build check failed');
    console.error('Exit code:', result.exitCode);
    console.error('Duration:', `${result.duration}ms`);

    return result;
  }
}

/**
 * Saves build result to test-results directory for evidence collection.
 */
function saveBuildLog(result: BuildResult): void {
  const testResultsDir = join(process.cwd(), 'test-results');
  
  // Ensure directory exists
  mkdirSync(testResultsDir, { recursive: true });
  
  const logFileName = `build-check-${new Date().toISOString().split('T')[0]}.log`;
  const logPath = join(testResultsDir, logFileName);
  
  const logContent = [
    `Build Check Result - ${result.timestamp}`,
    `Success: ${result.success}`,
    `Exit Code: ${result.exitCode}`,
    `Duration: ${result.duration}ms`,
    '=' .repeat(80),
    'STDOUT:',
    result.stdout || '(empty)',
    '=' .repeat(80),
    'STDERR:',
    result.stderr || '(empty)',
    '=' .repeat(80),
  ].join('\n');
  
  writeFileSync(logPath, logContent, 'utf8');
  console.log(`📝 Build log saved: ${logPath}`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const { timeoutMs } = parseArgs(process.argv.slice(2));
  const result = await runBuildCheck(timeoutMs);
  saveBuildLog(result);

  // Exit with same code as build to fail CI if build fails
  if (!result.success) {
    process.exit(result.exitCode || 1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Build check script failed:', error);
    process.exit(1);
  });
}
