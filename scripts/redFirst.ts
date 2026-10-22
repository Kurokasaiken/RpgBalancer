/**
 * redFirst — CLI per il red-first lockato (PLAN-044 T-004 / S2).
 *
 *   npm run redfirst:record -- --test <file> --command "<cmd>"
 *       Esegue il comando (deve FALLIRE), salva il log in .mw/red-first/
 *       e appende un record: hash canonico test + sha256 log + exit_code.
 *   npm run redfirst:retire -- --test <file> --reason "<motivo>"
 *       Registra che il test di riproduzione è scartato (obsoleto).
 *   npm run redfirst:check   → ri-verifica record vs diff corrente (gate).
 *   npm run redfirst:status  → stato journal.
 */
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { canonicalFileHash, sha256File } from './verification/gateCore';
import {
  RED_FIRST_REL,
  RED_LOGS_REL,
  checkRedFirstGate,
  latestForFile,
  loadRedFirst,
  type RedFirstRecord,
} from './verification/redFirst';
import { gitChangedFiles } from './verification/contractsCheck';

const root = process.cwd();
const [, , cmd, ...rest] = process.argv;

const arg = (name: string): string | undefined => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};

const slug = (f: string) => f.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');

const append = (rec: RedFirstRecord): void => {
  appendFileSync(path.join(root, RED_FIRST_REL), `${JSON.stringify(rec)}\n`);
};

if (cmd === 'record') {
  const testFile = arg('test');
  const command = arg('command');
  if (!testFile || !command) {
    console.error('uso: --test <file> --command "<comando riproduzione>"');
    process.exit(1);
  }
  const testSha = canonicalFileHash(path.join(root, testFile));
  if (testSha === null) {
    console.error(`file test inesistente: ${testFile}`);
    process.exit(1);
  }
  const logsDir = path.join(root, RED_LOGS_REL);
  mkdirSync(logsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const logRel = `${RED_LOGS_REL}/${slug(testFile)}-${ts}.log`;
  let output = '';
  let exitCode = 0;
  try {
    output = String(execSync(command, { cwd: root, encoding: 'utf8', stdio: 'pipe' }));
  } catch (e) {
    const err = e as { status?: number | null; stdout?: Buffer | string; stderr?: Buffer | string };
    exitCode = typeof err.status === 'number' ? err.status : 1;
    output = `${err.stdout ?? ''}\n${err.stderr ?? ''}`;
  }
  writeFileSync(path.join(root, logRel), output);
  if (exitCode === 0) {
    console.error(
      `la run non è rossa (exit 0) — red-first richiede una riproduzione FALLITA. Log: ${logRel}`,
    );
    process.exit(1);
  }
  const rec: RedFirstRecord = {
    kind: 'record',
    test_file: testFile,
    test_sha256: testSha,
    red_log: logRel,
    red_log_sha256: sha256File(path.join(root, logRel))!,
    command,
    exit_code: exitCode,
    ...(arg('component') ? { component: arg('component') } : {}),
    ...(arg('invariant') ? { invariant: arg('invariant') } : {}),
    ...(arg('source-ref') ? { source_ref: arg('source-ref') } : {}),
    recorded_at: new Date().toISOString(),
    recorded_by: process.env.USER,
  };
  append(rec);
  console.log(
    `red-first registrato: ${testFile} (exit ${exitCode})\n  test_sha256 ${testSha.slice(0, 12)}…\n  red_log ${logRel}\n  red_log_sha256 ${rec.red_log_sha256!.slice(0, 12)}…`,
  );
} else if (cmd === 'retire') {
  const testFile = arg('test');
  const reason = arg('reason');
  if (!testFile || !reason) {
    console.error('uso: --test <file> --reason "<motivo per cui il test è scartato>"');
    process.exit(1);
  }
  const rec: RedFirstRecord = {
    kind: 'retire',
    test_file: testFile,
    reason,
    ...(arg('invariant') ? { invariant: arg('invariant') } : {}),
    recorded_at: new Date().toISOString(),
    recorded_by: process.env.USER,
  };
  append(rec);
  console.log(`retire registrato: ${testFile} — ${reason}`);
} else if (cmd === 'check') {
  const report = checkRedFirstGate(root, { changedFiles: gitChangedFiles(root) });
  for (const f of report.checked) console.log(`  ✓ ${f}`);
  for (const f of report.retired) console.log(`  ~ ${f} (retired)`);
  if (report.errors.length) {
    for (const e of report.errors) console.error(`  ✗ ${e}`);
    console.error(`redfirst:check FAIL (${report.errors.length} problemi)`);
    process.exit(1);
  }
  console.log('redfirst:check OK');
} else if (cmd === 'status') {
  const records = loadRedFirst(root);
  if (!records.length) {
    console.log('journal vuoto — nessun red-first registrato');
    process.exit(0);
  }
  const seen = new Set<string>();
  for (let i = records.length - 1; i >= 0; i--) {
    const f = records[i].test_file;
    if (seen.add(f)) {
      const r = latestForFile(records, f)!;
      const state = r.kind === 'retire' ? 'retired' : `record (${r.exit_code}) ${r.recorded_at}`;
      console.log(`  ${r.kind === 'retire' ? '~' : '●'} ${f} — ${state}${existsSync(path.join(root, f)) ? '' : ' [file assente]'}`);
    }
  }
} else {
  console.log('redFirst — comandi: record | retire | check | status');
}
