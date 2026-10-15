/**
 * Bootstrap safeguard (OPS-SHUTDOWN-006 gap).
 *
 * Before any tool integration exists, the registry can be empty while
 * coordinator/harness/manual work is actually running. As a fail-closed
 * backstop the manager checks `ps` for known long-running work processes;
 * any hit blocks shutdown even with an empty registry.
 *
 * @module knownProcesses
 */

import { execFile } from 'node:child_process';

/** Process name fragments that indicate real work in progress. */
const KNOWN_WORK_PATTERNS = [
  'runPrompt.ts',
  'harness/dispatch.ts',
  'coordinator.py',
  'dispatcher.py',
  'mw-iterative-deliberate.py',
  'mw-orchestrate.py',
];

const PS_TIMEOUT_MS = 5_000;

export interface ActiveWorkProcess {
  pid: number;
  command: string;
}

/**
 * Lists running processes matching known work patterns.
 *
 * Fail-closed: if `ps` itself fails, returns a sentinel entry so the
 * caller treats the situation as "work may be running" and blocks.
 *
 * @returns Active work processes (empty = none detected).
 */
export function findActiveWorkProcesses(): Promise<ActiveWorkProcess[]> {
  return new Promise((resolve) => {
    execFile('ps', ['-axo', 'pid,command'], { timeout: PS_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        resolve([{ pid: -1, command: `ps failed (fail-closed): ${error.message}` }]);
        return;
      }
      const hits: ActiveWorkProcess[] = [];
      for (const line of stdout.split('\n')) {
        const trimmed = line.trim();
        const match = /^(\d+)\s+(.+)$/.exec(trimmed);
        if (!match) continue;
        const pid = Number(match[1]);
        const command = match[2];
        if (pid === process.pid) continue;
        if (KNOWN_WORK_PATTERNS.some((p) => command.includes(p))) {
          hits.push({ pid, command });
        }
      }
      resolve(hits);
    });
  });
}
