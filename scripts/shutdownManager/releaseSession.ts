#!/usr/bin/env tsx
/**
 * CLI: releaseSession
 *
 * Releases (finalises) a session in the global shutdown registry.
 *
 * @example
 *   tsx scripts/shutdownManager/releaseSession.ts --project RPG --session devin-1 --state COMPLETED
 */

import { program } from 'commander';
import {
  getRegistryFilePath,
  releaseSession,
  type SessionState,
} from './sessionRegistry.js';

program
  .name('releaseSession')
  .description('Release a session in the global shutdown registry')
  .requiredOption('-p, --project <id>', 'Project identifier')
  .requiredOption('-s, --session <id>', 'Session identifier')
  .option('--state <state>', 'Final session state', 'COMPLETED')
  .option('--registry <path>', 'Registry file path override')
  .parse();

const options = program.opts<{
  project: string;
  session: string;
  state: string;
  registry?: string;
}>();

const filePath = getRegistryFilePath(options.registry);

releaseSession(
  {
    projectId: options.project,
    sessionId: options.session,
    state: options.state as SessionState,
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
