#!/usr/bin/env node
/**
 * Auto-Commit Guardian
 * Diagnostica lint/test/build e riprova commit/push automatici.
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = parseArgs(process.argv.slice(2));

if (!args.stage || !['commit', 'push'].includes(args.stage)) {
  console.error('commitFailureMonitor: --stage commit|push obbligatorio');
  process.exit(1);
}

const logDir =
  args.log && args.log.length > 0
    ? path.dirname(args.log)
    : path.join(process.cwd(), 'test-results', 'auto-commit-guardian');

fs.mkdirSync(logDir, { recursive: true });

const logFile =
  args.log && args.log.length > 0
    ? args.log
    : path.join(
        logDir,
        `${new Date().toISOString().replace(/[:.]/g, '-')}-${args.stage}.log`,
      );

log(`🚨 Auto-Commit Guardian attivato (stage=${args.stage})`);

const diagnostics = [
  { label: 'npm run lint', command: 'npm', args: ['run', 'lint'] },
  { label: 'npm run test', command: 'npm', args: ['run', 'test'] },
  { label: 'npm run build:check', command: 'npm', args: ['run', 'build:check'] },
  { label: 'npm run kanban:lint', command: 'npm', args: ['run', 'kanban:lint'] },
  { label: 'npm run deploy:vercel:verify', command: 'npm', args: ['run', 'deploy:vercel:verify'] },
];

for (const step of diagnostics) {
  if (!runStep(step.label, step.command, step.args)) {
    log('Guardian terminato: diagnosi non superata.');
    log(`SHUTDOWN_CAPABILITY_NOT_OWNED: ${step.label} failed during Guardian recovery`);
    process.exit(1);
  }
}

if (args.stage === 'commit') {
  ensureArg(args.commitMessage, '--commit-message');
  if (!runStep('git add -A', 'git', ['add', '-A'])) {
    log('SHUTDOWN_CAPABILITY_NOT_OWNED: git add -A failed during Guardian recovery');
    process.exit(1);
  }
  if (!runStep('git commit', 'git', ['commit', '-m', args.commitMessage])) {
    log('SHUTDOWN_CAPABILITY_NOT_OWNED: git commit failed during Guardian recovery');
    process.exit(1);
  }
  log('✅ Commit ripristinato correttamente.');
} else {
  const branch = args.branch || detectBranch();
  if (!runStep(`git push origin ${branch}`, 'git', ['push', 'origin', branch])) {
    log(`SHUTDOWN_CAPABILITY_NOT_OWNED: git push origin ${branch} failed during Guardian recovery`);
    process.exit(1);
  }
  log('✅ Push completato dal guardian.');
}

log('🏁 Guardian completato con successo.');
process.exit(0);

function runStep(label, command, commandArgs) {
  log(`→ ${label}`);
  const result = spawnSync(command, commandArgs, {
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (result.stdout) {
    log(result.stdout.trim());
  }
  if (result.stderr) {
    log(result.stderr.trim());
  }
  if (result.status !== 0) {
    log(`✖ ${label} fallito (exit ${result.status}).`);
    return false;
  }
  log(`✔ ${label} completato.`);
  return true;
}

function detectBranch() {
  const result = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (result.status !== 0 || !result.stdout) {
    log('⚠️ Impossibile rilevare branch corrente.');
    process.exit(1);
  }
  return result.stdout.trim();
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  fs.appendFileSync(logFile, `${line}\n`);
  console.log(line);
}

function ensureArg(value, flagName) {
  if (!value || value.length === 0) {
    log(`⚠️ Argomento ${flagName} richiesto per stage commit.`);
    process.exit(1);
  }
}

function parseArgs(rawArgs) {
  const out = {};
  for (let i = 0; i < rawArgs.length; i += 1) {
    const token = rawArgs[i];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const value = rawArgs[i + 1] && !rawArgs[i + 1].startsWith('--') ? rawArgs[i + 1] : '';
    out[camelCase(key)] = value;
    if (value) {
      i += 1;
    }
  }
  return out;
}

function camelCase(input) {
  return input.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

