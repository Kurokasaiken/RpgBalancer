#!/usr/bin/env tsx
/**
 * agents:lint — igiene dei file istruzioni agente annidati (PLAN-044 T-001).
 *
 * Ogni `AGENTS.md`/`CLAUDE.md` sotto la root è un pointer alla fonte unica
 * (root `AGENTS.md` + `.windsurf/rules/`): i pattern del workflow sospeso
 * R-208 non possono riapparire lì. Exit 1 su qualsiasi violazione; lo
 * stesso check gira dentro `closure:lint`.
 *
 * CLI:
 *   tsx scripts/agentsLint.ts [--root DIR]
 */
import path from 'node:path';
import { checkNestedAgentsGate } from './verification/gateCore';

const rootIdx = process.argv.indexOf('--root');
const root = rootIdx >= 0 ? path.resolve(process.argv[rootIdx + 1]) : process.cwd();

const errors = checkNestedAgentsGate(root);
if (errors.length === 0) {
  console.log('agents:lint OK — nessun workflow sospeso nei file agente annidati.');
} else {
  console.error('agents:lint FAILED — workflow sospeso reintrodotto in file agente annidati:');
  for (const err of errors) console.error(`  • ${err}`);
  process.exit(1);
}
