#!/usr/bin/env tsx

/**
 * NP-161 – Multi-App Dev Boot Guard & Auto-Recovery
 *
 * CLI orchestrator that:
 *  - Reads page definitions from config/devBootGuardConfig.ts
 *  - Starts/stops dev servers and supporting processes deterministically
 *  - Runs Playwright smoke checks per page
 *  - Persists status via PersistenceService and emits telemetry events
 *  - Logs structured results for evidence
 */

import { spawn, ChildProcess } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Command } from 'commander';
import { loadDevBootGuardConfig, type BootGuardPageConfig } from '../../config/devBootGuardConfig';
import {
  trackBootGuardEvent,
  recordBootGuardPageState,
  loadBootGuardState,
  type BootGuardTelemetryPayload,
} from '../../src/analytics/devBootGuard';

interface CLIOptions {
  page?: string[];
  maxRetries?: number;
  dryRun?: boolean;
  waitForServerMs?: number;
}

interface ManagedProcess {
  label: string;
  command: string;
  child: ChildProcess;
}

interface AttemptResult {
  attempt: number;
  success: boolean;
  exitCode: number | null;
  durationMs: number;
  stdout: string;
  stderr: string;
  errorMessage?: string;
  artifactDir?: string;
}

interface PageRunResult {
  page: BootGuardPageConfig;
  attempts: AttemptResult[];
  status: 'success' | 'failure';
}

const program = new Command();
program
  .name('multiAppBootGuard')
  .description('Automates dev boot verification across Idle Village tools, STS CLI, Punch Club PWA, and Map.')
  .option('-p, --page <id...>', 'Limit execution to specific page ids (comma separated or repeated flag).')
  .option('-r, --max-retries <number>', 'Override max retries for every page.', parseInt)
  .option('--dry-run', 'Do not execute Playwright, just print planned actions.', false)
  .option('--wait-for-server-ms <number>', 'Override wait time for dev server readiness.', (value) => parseInt(value, 10));

const DEV_SERVER_LABEL = 'vite-dev-server';

async function main(): Promise<void> {
  const options = program.parse(process.argv).opts<CLIOptions>();
  const config = loadDevBootGuardConfig();
  const pages = resolveTargetPages(config.pages, options.page);
  if (!pages.length) {
    console.error('No pages matched the provided filters.');
    process.exit(1);
  }

  const waitForServerMs = options.waitForServerMs ?? 7000;

  const managedProcesses: ManagedProcess[] = [];
  let devServerProcess: ManagedProcess | null = null;

  setupSignalHandlers(() => stopAllProcesses(managedProcesses, devServerProcess));

  const results: PageRunResult[] = [];
  const startTimestamp = Date.now();
  const logFilePath = config.logFile;
  mkdirSync(dirname(logFilePath), { recursive: true });

  try {
    devServerProcess = await ensureDevServer(
      config.viteCommand,
      waitForServerMs,
    );

    for (const page of pages) {
      console.log(`\n=== Guarding page: ${page.label} (${page.route}) ===`);
      const pageResult = await guardPage({
        page,
        configProject: config.playwrightProject,
        artifactDir: config.artifactDir,
        options,
        managedProcesses,
      });
      results.push(pageResult);
    }
  } catch (error) {
    console.error('Boot guard run failed with an unexpected error:', error);
    process.exitCode = 1;
  } finally {
    await stopAllProcesses(managedProcesses, devServerProcess);
    await writeRunLog(logFilePath, results, startTimestamp);
  }

  const failed = results.filter((result) => result.status === 'failure');
  if (failed.length > 0) {
    console.error(`\n❌ Boot guard completed with ${failed.length} failing page(s).`);
    process.exitCode = 1;
  } else {
    console.log('\n✅ Boot guard completed successfully.');
  }
}

function resolveTargetPages(pages: BootGuardPageConfig[], pageFilter?: string[]): BootGuardPageConfig[] {
  if (!pageFilter || pageFilter.length === 0) {
    return pages;
  }

  const whitelisted = new Set(pageFilter.flatMap((entry) => entry.split(',').map((token) => token.trim())).filter(Boolean));
  return pages.filter((page) => whitelisted.has(page.id));
}

async function ensureDevServer(command: string, waitForServerMs: number): Promise<ManagedProcess> {
  console.log(`\n🚀 Starting dev server: ${command}`);
  const child = spawn(command, {
    cwd: process.cwd(),
    shell: true,
    stdio: 'pipe',
    env: {
      ...process.env,
      VITE_DISABLE_DEV_OVERLAY: 'true',
    },
  });

  let ready = false;
  const readinessMarkers = [/Local:/i, /ready in/i, /VITE v/i];

  child.stdout?.on('data', (data) => {
    const text = data.toString();
    process.stdout.write(text);
    if (readinessMarkers.some((marker) => marker.test(text))) {
      ready = true;
    }
  });

  child.stderr?.on('data', (data) => {
    process.stderr.write(data);
  });

  await delay(Math.min(waitForServerMs, 15000));
  if (!ready) {
    console.warn('⚠️ Dev server readiness markers not detected; proceeding after wait period.');
  } else {
    console.log('✅ Dev server reported ready.');
  }

  return {
    label: DEV_SERVER_LABEL,
    command,
    child,
  };
}

function startManagedProcess(command: string, label: string): ManagedProcess {
  console.log(`▶️  Starting ${label}: ${command}`);
  const child = spawn(command, {
    cwd: process.cwd(),
    shell: true,
    stdio: 'pipe',
  });
  child.stdout?.on('data', (data) => {
    process.stdout.write(`[${label}] ${data}`);
  });
  child.stderr?.on('data', (data) => {
    process.stderr.write(`[${label}][ERR] ${data}`);
  });
  return { label, command, child };
}

async function stopAllProcesses(managed: ManagedProcess[], devServer: ManagedProcess | null): Promise<void> {
  const stopProcess = async (proc: ManagedProcess): Promise<void> => {
    if (!proc.child || proc.child.killed) return;
    console.log(`🛑 Stopping ${proc.label} (pid ${proc.child.pid ?? 'unknown'})`);
    proc.child.kill('SIGINT');
    await delay(500);
    if (!proc.child.killed) {
      proc.child.kill('SIGTERM');
    }
  };

  for (const proc of managed) {
    await stopProcess(proc);
  }
  if (devServer) {
    await stopProcess(devServer);
  }
}

async function guardPage(params: {
  page: BootGuardPageConfig;
  configProject: string;
  artifactDir: string;
  options: CLIOptions;
  managedProcesses: ManagedProcess[];
}): Promise<PageRunResult> {
  const { page, configProject, artifactDir, options, managedProcesses } = params;
  const attempts: AttemptResult[] = [];

  const maxRetries = options.maxRetries ?? page.maxRetries ?? 3;
  const supportingProcesses: ManagedProcess[] = [];

  try {
    if (Array.isArray(page.requiredProcesses)) {
      for (const processConfig of page.requiredProcesses) {
        const proc = startManagedProcess(processConfig.command, processConfig.name);
        supportingProcesses.push(proc);
        managedProcesses.push(proc);
      }
    }

    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      if (options.dryRun) {
        console.log(
          `Dry-run: would execute Playwright for page ${page.id} (attempt ${attempt}/${maxRetries}).`,
        );
        attempts.push({
          attempt,
          success: true,
          exitCode: 0,
          durationMs: 0,
          stdout: '',
          stderr: '',
        });
        continue;
      }

      const telemetryPayload: BootGuardTelemetryPayload = {
        pageId: page.id,
        label: page.label,
        route: page.route,
        attempt,
        maxAttempts: maxRetries,
        status: 'retrying',
      };
      trackBootGuardEvent('boot_guard_run', telemetryPayload);

      const attemptResult = await runPlaywrightSmoke({
        page,
        project: configProject,
        artifactDir,
      });
      attempts.push(attemptResult);

      if (attemptResult.success) {
        telemetryPayload.status = 'success';
        telemetryPayload.metadata = { attemptResult };
        trackBootGuardEvent('boot_guard_recovery', telemetryPayload);
        await recordBootGuardPageState(page.id, {
          lastStatus: 'success',
          lastError: undefined,
          retries: attempt - 1,
        });
        break;
      } else {
        telemetryPayload.status = 'failure';
        telemetryPayload.errorMessage = attemptResult.errorMessage ?? attemptResult.stderr.slice(0, 500);
        trackBootGuardEvent('boot_guard_failure', telemetryPayload);
        await recordBootGuardPageState(page.id, {
          lastStatus: 'failure',
          lastError: telemetryPayload.errorMessage,
          retries: attempt,
        });
        if (attempt === maxRetries) {
          console.error(
            `❌ Page ${page.label} failed after ${maxRetries} attempt(s).`,
          );
        } else {
          console.warn(
            `⚠️ Page ${page.label} failed attempt ${attempt}/${maxRetries}. Retrying...`,
          );
        }
      }
    }
  } finally {
    for (const proc of supportingProcesses) {
      await stopAllProcesses([], proc);
      const index = managedProcesses.indexOf(proc);
      if (index >= 0) {
        managedProcesses.splice(index, 1);
      }
    }
  }

  const status = attempts.some((attempt) => attempt.success) ? 'success' : 'failure';
  return { page, attempts, status };
}

async function runPlaywrightSmoke(params: {
  page: BootGuardPageConfig;
  project: string;
  artifactDir: string;
}): Promise<AttemptResult> {
  const { page, project, artifactDir } = params;
  console.log(
    `🎯 Running smoke spec for ${page.label} via Playwright (project: ${project})`,
  );

  const start = Date.now();
  const env = {
    ...process.env,
    BOOT_GUARD_TARGET: page.id,
    BOOT_GUARD_ROUTE: page.route,
    BOOT_GUARD_SUCCESS_LOCATOR: page.successLocator,
    BOOT_GUARD_ERROR_SIGNATURES: page.errorSignatures.join('|'),
    BOOT_GUARD_ARTIFACT_DIR: artifactDir,
    BOOT_GUARD_CAPTURE_SELECTOR: page.captureSelector ?? '',
  };
  const args = [
    'playwright',
    'test',
    'tests/smoke/multiAppBootGuard.spec.ts',
    '--project',
    project,
    '--config',
    'playwright.config.ts',
  ];

  const { stdout, stderr, code } = await spawnWithOutput('npx', args, env);
  const duration = Date.now() - start;
  const success = code === 0;

  const attemptResult: AttemptResult = {
    attempt: 0,
    success,
    exitCode: code,
    durationMs: duration,
    stdout,
    stderr,
    errorMessage: success ? undefined : summarizeError(stdout, stderr),
    artifactDir,
  };
  return attemptResult;
}

async function spawnWithOutput(
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      shell: true,
      env,
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });
    child.stderr?.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });
    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });
    child.on('error', (error) => {
      stderr += error.message;
      resolve({ stdout, stderr, code: 1 });
    });
  });
}

function summarizeError(stdout: string, stderr: string): string | undefined {
  const combined = `${stderr}\n${stdout}`;
  const lines = combined.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return lines.slice(-5).join(' | ');
}

async function writeRunLog(logFilePath: string, results: PageRunResult[], startedAt: number): Promise<void> {
  const finishedAt = Date.now();
  const state = await loadBootGuardState();

  const payload = {
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    summary: {
      totalPages: results.length,
      passed: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failure').length,
    },
    results: results.map((result) => ({
      pageId: result.page.id,
      label: result.page.label,
      route: result.page.route,
      status: result.status,
      attempts: result.attempts.map((attempt, index) => ({
        attempt: index + 1,
        success: attempt.success,
        exitCode: attempt.exitCode,
        durationMs: attempt.durationMs,
        errorMessage: attempt.errorMessage,
        artifactDir: attempt.artifactDir,
      })),
    })),
    persistedState: state,
  };

  writeFileSync(logFilePath, JSON.stringify(payload, null, 2), 'utf8');
  console.log(`📝 Boot guard log written to ${logFilePath}`);
}

function setupSignalHandlers(onShutdown: () => void): void {
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`\nReceived ${signal}, shutting down processes...`);
      onShutdown();
      process.exit(1);
    });
  });
}

main().catch((error) => {
  console.error('Unexpected boot guard failure:', error);
  process.exit(1);
});
