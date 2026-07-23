#!/usr/bin/env tsx
/**
 * CLI: heartbeatSession
 *
 * Renews the heartbeat for an existing session in the global shutdown registry.
 *
 * @example
 *   tsx scripts/shutdownManager/heartbeatSession.ts --project RPG --session devin-1
 */

import { program } from 'commander';
import {
  getRegistryFilePath,
  heartbeatSession,
  type SessionState,
} from './sessionRegistry.js';

program
  .name('heartbeatSession')
  .description('Renew a session heartbeat in the global shutdown registry')
  .requiredOption('-p, --project <id>', 'Project identifier')
  .requiredOption('-s, --session <id>', 'Session identifier')
  .option('--state <state>', 'Optional new session state')
  .option('--registry <path>', 'Registry file path override')
  .parse();

const options = program.opts<{
  project: string;
  session: string;
  state?: string;
  registry?: string;
}>();

const filePath = getRegistryFilePath(options.registry);

heartbeatSession(
  {
    projectId: options.project,
    sessionId: options.session,
    ...(options.state ? { state: options.state as SessionState } : {}),
  },
  filePath,
)
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
