/**
 * Shutdown executor — the ONLY module authorized to power off the machine
 * (`.windsurf/rules/50-shutdown-governance.md`, capability ownership).
 *
 * macOS implementation: `osascript -e 'tell application "System Events" to
 * shut down'` — passwordless, requires the calling app's Automation
 * permission for System Events (granted once interactively).
 *
 * @module shutdownExecutor
 */

import { execFile } from 'node:child_process';

export interface ShutdownExecutionResult {
  ok: boolean;
  dryRun: boolean;
  command: string;
  detail: string;
}

const SHUTDOWN_COMMAND = 'osascript';
const SHUTDOWN_ARGS = ['-e', 'tell application "System Events" to shut down'];
const EXEC_TIMEOUT_MS = 15_000;

/**
 * Executes a real (non-dry-run) system shutdown.
 *
 * ONLY call this from `shutdownManager.ts` after `canShutdown()` allowed it.
 * In dry-run mode the command is reported but never executed.
 *
 * @param dryRun - When true (default policy), logs the intent and returns.
 * @returns Execution result describing what happened.
 */
export function executeShutdown(dryRun: boolean): Promise<ShutdownExecutionResult> {
  const command = `${SHUTDOWN_COMMAND} ${SHUTDOWN_ARGS.map((a) => `'${a}'`).join(' ')}`;
  if (dryRun) {
    return Promise.resolve({
      ok: true,
      dryRun: true,
      command,
      detail: 'DRY_RUN: shutdown not executed',
    });
  }
  return new Promise((resolve) => {
    execFile(SHUTDOWN_COMMAND, SHUTDOWN_ARGS, { timeout: EXEC_TIMEOUT_MS }, (error) => {
      if (error) {
        resolve({ ok: false, dryRun: false, command, detail: error.message });
        return;
      }
      resolve({ ok: true, dryRun: false, command, detail: 'shutdown requested to System Events' });
    });
  });
}
