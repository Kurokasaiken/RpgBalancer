#!/usr/bin/env tsx
/**
 * PLAN-039 / R-204 — night-shift wrapper for the replay benchmark.
 *
 * Registers a session in the Global Session Shutdown Manager registry so the
 * guardian keeps the machine awake while runs are in flight, heartbeats
 * between runs, then releases the session so the quiet-window shutdown can
 * fire once the benchmark drains.
 *
 * Usage:  npx tsx scripts/benchmark/nightrun.ts [-- <replay args>]
 * e.g.    npx tsx scripts/benchmark/nightrun.ts -- --case B1-i18n-icu --repeats 1
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import {
  heartbeatSession,
  registerSession,
  releaseSession,
} from '../shutdownManager/sessionRegistry.js';

const REPO_ROOT = process.cwd();
const PROJECT_ID = 'RpgBalancer';
const HEARTBEAT_MS = 60_000;
/** Session TTL — long enough to survive one full run without heartbeat. */
const TTL_SECONDS = 1200;

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const sessionId = `bench-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;

  await registerSession({
    projectId: PROJECT_ID,
    sessionId,
    pid: process.pid,
    owner: 'bench-nightrun',
    state: 'RUNNING',
    ttlSeconds: TTL_SECONDS,
    blockingReason: 'replay benchmark running',
    maxDurationMs: 8 * 3600 * 1000,
  });
  console.log(`[nightrun] session ${sessionId} registered`);

  const timer = setInterval(() => {
    heartbeatSession({ projectId: PROJECT_ID, sessionId }).catch((e: unknown) =>
      console.error('[nightrun] heartbeat failed:', e),
    );
  }, HEARTBEAT_MS);

  let exitCode = 0;
  try {
    const child = spawnSync(
      'npx', ['tsx', 'scripts/benchmark/replay.ts', ...args],
      { cwd: REPO_ROOT, stdio: 'inherit', env: process.env },
    );
    exitCode = child.status ?? 1;
  } finally {
    clearInterval(timer);
    const state = exitCode === 0 ? 'COMPLETED' : 'FAILED';
    await releaseSession({ projectId: PROJECT_ID, sessionId, state }).catch((e: unknown) =>
      console.error('[nightrun] release failed:', e),
    );
    console.log(`[nightrun] session ${sessionId} released as ${state} — guardian may proceed`);
  }
  return exitCode;
}

main().then((code) => process.exit(code));
