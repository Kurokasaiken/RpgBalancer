#!/usr/bin/env tsx
/**
 * Global Session Shutdown Manager — the only component authorized to request
 * macOS shutdown (`.windsurf/rules/50-shutdown-governance.md`).
 *
 * Polls the session registry every `POLL_INTERVAL_MS`:
 *   readRegistry → recoverStaleSessions → getUserIdleMs → canShutdown
 * When allowed: optional pre-shutdown git backup → executeShutdown.
 *
 * Fail-closed: any unreadable input, disabled policy or dry-run blocks the
 * shutdown path. Logs every decision to `test-results/shutdown-manager.log`
 * and stdout (launchd captures it via the plist).
 *
 * CLI:
 *   tsx shutdownManager.ts            # run daemon loop
 *   tsx shutdownManager.ts --once     # single evaluation, print decision
 *   tsx shutdownManager.ts --status   # human-readable diagnostics
 *
 * @module shutdownManager
 */

import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { homedir } from 'node:os';
import { canShutdown, type ShutdownDecision } from './canShutdown.js';
import { findActiveWorkProcesses } from './knownProcesses.js';
import { getUserIdleMs } from './getUserIdleMs.js';
import { executeShutdown } from './shutdownExecutor.js';
import { backupProjectTree } from './preShutdownBackup.js';
import {
  getRegistryFilePath,
  readRegistry,
  recoverStaleSessions,
  writeRegistry,
} from './sessionRegistry.js';

const POLL_INTERVAL_MS = 30_000;
/** Watchdog: sessions heartbeat-stale longer than this stop vetoing shutdown. */
const MAX_SESSION_AGE_MS = 4 * 60 * 60 * 1000; // 4h hard upper bound
const LOG_FILE = path.join(process.cwd(), 'test-results', 'shutdown-manager.log');
/** Project dirs that get a pre-shutdown commit+push (opt-in backup). */
const BACKUP_DIRS = [process.cwd()];

async function logLine(line: string): Promise<void> {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(stamped);
  try {
    await mkdir(path.dirname(LOG_FILE), { recursive: true });
    await appendFile(LOG_FILE, `${stamped}\n`);
  } catch {
    // Logging failure must not crash the manager.
  }
}

/**
 * Runs one evaluation cycle: registry → recovery → idle → decision.
 *
 * @returns The decision taken this cycle.
 */
export async function evaluateOnce(): Promise<ShutdownDecision> {
  const registryPath = getRegistryFilePath();
  let registry;
  try {
    registry = recoverStaleSessions(await readRegistry(registryPath));
    await writeRegistry(registry, registryPath);
  } catch (error) {
    const reason = `registry unreadable (fail-closed): ${error instanceof Error ? error.message : String(error)}`;
    const decision: ShutdownDecision = {
      allowed: false,
      reason,
      blockers: [],
      userIdleMs: 'UNKNOWN',
      policy: { dryRun: true, shutdownEnabled: false, userIdleThresholdSeconds: 300 },
    };
    await logLine(`decision: BLOCKED — ${reason}`);
    return decision;
  }

  const userIdleMs = await getUserIdleMs();
  const decision = canShutdown(registry, userIdleMs, { maxSessionAgeMs: MAX_SESSION_AGE_MS });

  // Bootstrap safeguard: known work processes running but unregistered must
  // block shutdown even when the registry is empty (OPS-SHUTDOWN-006 gap).
  // R-212: server fixtures (vite preview, dev servers) are reported, never
  // veto — a leftover server is not work.
  const activeWork = await findActiveWorkProcesses();
  const registeredPids = new Set(
    Object.values(registry.projects).flatMap((p) =>
      Object.values(p.sessions).map((s) => s.pid),
    ),
  );
  const unregistered = activeWork.filter((p) => !registeredPids.has(p.pid));
  const blockingWork = unregistered.filter((p) => p.kind === 'work');
  const serverLeftovers = unregistered.filter((p) => p.kind === 'server');
  if (decision.allowed && blockingWork.length > 0) {
    decision.allowed = false;
    decision.reason = `unregistered work processes active: ${blockingWork.map((p) => p.command).join('; ')}`;
  }
  if (serverLeftovers.length > 0) {
    await logLine(
      `server leftovers (non-blocking): ${serverLeftovers.map((p) => `${p.pid}:${p.command}`).join('; ')}`,
    );
  }

  await logLine(
    `decision: ${decision.allowed ? 'ALLOWED' : 'BLOCKED'} — ${decision.reason}` +
      (decision.blockers.length ? ` | blockers=${JSON.stringify(decision.blockers)}` : ''),
  );
  return decision;
}

async function actOnDecision(decision: ShutdownDecision): Promise<void> {
  if (!decision.allowed) return;

  for (const dir of BACKUP_DIRS) {
    const backup = await backupProjectTree(dir);
    await logLine(`pre-shutdown backup ${backup.projectDir}: ${backup.detail}`);
  }

  const result = await executeShutdown(decision.policy.dryRun);
  await logLine(
    `executor: ${result.ok ? 'ok' : 'FAILED'} — ${result.detail} (dryRun=${result.dryRun})`,
  );
}

async function status(): Promise<void> {
  const decision = await evaluateOnce();
  const registry = await readRegistry(getRegistryFilePath()).catch(() => null);
  console.log('\n=== shutdown:status ===');
  console.log(`registry: ${getRegistryFilePath()} ${registry ? '(readable)' : '(UNREADABLE)'}`);
  console.log(`policy:   ${JSON.stringify(decision.policy)}`);
  console.log(`idle:     ${decision.userIdleMs === 'UNKNOWN' ? 'UNKNOWN' : `${Math.round(Number(decision.userIdleMs) / 1000)}s`}`);
  console.log(`verdict:  ${decision.allowed ? 'ALLOWED' : 'BLOCKED'} — ${decision.reason}`);
  if (registry) {
    for (const [projectId, project] of Object.entries(registry.projects)) {
      for (const [sessionId, s] of Object.entries(project.sessions)) {
        console.log(`  ${projectId}/${sessionId}: ${s.state} (hb ${s.heartbeatAt}, ttl ${s.ttlSeconds}s)`);
      }
    }
  }
}

const args = process.argv.slice(2);

if (args.includes('--status')) {
  await status();
} else if (args.includes('--once')) {
  const decision = await evaluateOnce();
  await actOnDecision(decision);
} else {
  await logLine(`shutdownManager started (poll ${POLL_INTERVAL_MS / 1000}s, pid ${process.pid})`);
  for (;;) {
    try {
      const decision = await evaluateOnce();
      await actOnDecision(decision);
    } catch (error) {
      await logLine(`cycle error (fail-closed): ${error instanceof Error ? error.message : String(error)}`);
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}
