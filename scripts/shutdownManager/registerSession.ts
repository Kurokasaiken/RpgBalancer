#!/usr/bin/env tsx
/**
 * CLI: registerSession
 *
 * Registers a new session in the global shutdown registry.
 *
 * @example
 *   tsx scripts/shutdownManager/registerSession.ts --project RPG --session devin-1
 */

import { program } from 'commander';
import {
  getRegistryFilePath,
  registerSession,
  type SessionState,
} from './sessionRegistry.js';

program
  .name('registerSession')
  .description('Register a session in the global shutdown registry')
  .requiredOption('-p, --project <id>', 'Project identifier')
  .requiredOption('-s, --session <id>', 'Session identifier')
  .option('--pid <number>', 'Process ID', `${process.pid}`)
  .option('--owner <name>', 'Session owner', process.env.USER ?? 'unknown')
  .option('--state <state>', 'Initial session state', 'RUNNING')
  .option('--ttl <seconds>', 'Heartbeat TTL in seconds', '60')
  .option('--reason <text>', 'Blocking reason (optional)')
  .option('--registry <path>', 'Registry file path override')
  .parse();

const options = program.opts<{
  project: string;
  session: string;
  pid: string;
  owner: string;
  state: string;
  ttl: string;
  reason?: string;
  registry?: string;
}>();

const filePath = getRegistryFilePath(options.registry);

registerSession({
  projectId: options.project,
  sessionId: options.session,
  pid: Number(options.pid),
  owner: options.owner,
  state: options.state as SessionState,
  ttlSeconds: Number(options.ttl),
  blockingReason: options.reason,
}, filePath)
  .then((registry) => {
    const project = registry.projects[options.project];
    const session = project?.sessions[options.session];
    console.log(JSON.stringify({ ok: true, session, filePath }, null, 2));
  })
  .catch((error) => {
    console.error(
      JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2),
    );
    process.exit(1);
  });
