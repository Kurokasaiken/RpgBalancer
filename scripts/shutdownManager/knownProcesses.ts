/**
 * Bootstrap safeguard (OPS-SHUTDOWN-006 gap).
 *
 * Before any tool integration exists, the registry can be empty while
 * coordinator/harness/manual work is actually running. As a fail-closed
 * backstop the manager checks `ps` for known long-running work processes;
 * any hit blocks shutdown even with an empty registry.
 *
 * Classification (R-212): only *work* processes veto shutdown. Server
 * fixtures — `vite preview`, dev servers — are reported but never veto:
 * a leftover server is not work. Its consumer (the test runner, the dev
 * session) is what the blocking patterns detect, and an active user is
 * already covered by the idle gate. On 2026-10-17 an orphaned `vite
 * preview` (nohup, port 5173) vetoed shutdown for ~2h.
 *
 * @module knownProcesses
 */
import { execFile } from 'node:child_process';

/** Process name fragments that indicate real work in progress. */
const BLOCKING_WORK_PATTERNS = [
  'runPrompt.ts',
  'harness/dispatch.ts',
  'coordinator.py',
  'dispatcher.py',
  'mw-iterative-deliberate.py',
  'mw-orchestrate.py',
  /* Dev/test activity — registry integrations (OPS-SHUTDOWN-006) are not
   *  wired yet, so a running test suite or build must still block.
   * 'playwright' is matched only by real process signatures (driver path,
   * test subcommand, CLI binary): `--mode playwright` / `dist-playwright`
   * inside vite invocations are NOT playwright processes (R-212). */
  'playwright/driver',
  'playwright test',
  'bin/playwright',
  'playwright-core',
  'run-driver',
  '@playwright/',
  'vitest',
  'vite build',
  'npm run build',
  'npm run test',
];

/**
 * Server-fixture fragments — matched processes are reported, never veto.
 * Checked only after {@link BLOCKING_WORK_PATTERNS} fails, so `vite build`
 * stays blocking while a bare `vite` dev server does not.
 */
const SERVER_LEFTOVER_PATTERNS = [
  'vite preview',
  'npm run preview',
  'npm run dev',
  'vite dev',
  'bin/vite',
];

const PS_TIMEOUT_MS = 5_000;

/** Whether a matched process is real work (`work`) or a leftover server. */
export type WorkProcessKind = 'work' | 'server';

export interface ActiveWorkProcess {
  pid: number;
  command: string;
  kind: WorkProcessKind;
}

/**
 * Classifies a process command line.
 *
 * Blocking patterns win over server patterns, so `vite build` is work
 * while `vite preview`/`vite` dev servers are leftovers.
 *
 * @param command - The `ps` command column for the process.
 * @returns The process kind, or `null` when no pattern matches.
 */
export function classifyWorkCommand(command: string): WorkProcessKind | null {
  if (BLOCKING_WORK_PATTERNS.some((p) => command.includes(p))) return 'work';
  if (SERVER_LEFTOVER_PATTERNS.some((p) => command.includes(p))) return 'server';
  return null;
}

/**
 * Lists running processes matching known patterns.
 *
 * Fail-closed: if `ps` itself fails, returns a `kind='work'` sentinel entry
 * so the caller treats the situation as "work may be running" and blocks.
 *
 * @returns Active matching processes (empty = none detected).
 */
export function findActiveWorkProcesses(): Promise<ActiveWorkProcess[]> {
  return new Promise((resolve) => {
    execFile('ps', ['-axo', 'pid,command'], { timeout: PS_TIMEOUT_MS }, (error, stdout) => {
      if (error) {
        resolve([{ pid: -1, command: `ps failed (fail-closed): ${error.message}`, kind: 'work' }]);
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
        const kind = classifyWorkCommand(command);
        if (kind !== null) {
          hits.push({ pid, command, kind });
        }
      }
      resolve(hits);
    });
  });
}
