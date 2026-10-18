/**
 * produceBundle — produttore unico del bundle di chiusura (R-189, C2+C4).
 *
 * Esegue i comandi delle obbligazioni di un manifest `verification.json`,
 * cattura exit code e stdout/stderr in `command-logs/<id>.log`, valuta gli
 * artefatti e scrive `bundle.json` nella run dir. Exit 0 solo su PASS.
 *
 * Uso:
 *   tsx scripts/verification/produceBundle.ts --manifest=.mw/runs/<task>/verification.json
 *   tsx scripts/verification/produceBundle.ts --manifest=... --no-exec   (ri-valuta senza rieseguire)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  Bundle,
  CommandResult,
  Manifest,
  evaluateManifest,
} from './gateCore';
import { checkContractsGate, gitChangedFiles } from './contractsCheck';
import { checkRedFirstGate } from './redFirst';

function parseArgs(argv: string[]): { manifest: string; noExec: boolean } {
  const manifestArg = argv.find((a) => a.startsWith('--manifest='));
  if (!manifestArg) {
    console.error('Uso: tsx scripts/verification/produceBundle.ts --manifest=<path> [--no-exec]');
    process.exit(2);
  }
  return {
    manifest: manifestArg.split('=').slice(1).join('='),
    noExec: argv.includes('--no-exec'),
  };
}

const DEFAULT_TIMEOUT_S = 300;

function runCommand(
  command: string,
  logPath: string,
  timeoutS: number,
  runDir: string,
): CommandResult {
  try {
    // I comandi girano nella root del repo (npm/script raggiungibili); gli
    // artefatti devono essere scritti dentro $RUN_DIR per essere valutati.
    const out = execFileSync('bash', ['-lc', command], {
      cwd: process.cwd(),
      env: { ...process.env, RUN_DIR: runDir },
      encoding: 'utf8',
      timeout: timeoutS * 1000,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    writeFileSync(logPath, `exit_code: 0\n\n${out ?? ''}`);
    return { exit_code: 0 };
  } catch (err) {
    const e = err as {
      status?: number | null;
      signal?: string | null;
      killed?: boolean;
      stdout?: string;
      stderr?: string;
    };
    const timedOut = e.signal === 'SIGTERM' && e.killed === true;
    const exitCode = typeof e.status === 'number' ? e.status : null;
    writeFileSync(
      logPath,
      `exit_code: ${exitCode ?? 'null'}${timedOut ? ' (TIMEOUT)' : ''}\n\n${e.stdout ?? ''}\n${e.stderr ?? ''}`,
    );
    return { exit_code: exitCode, killed: e.killed === true, timed_out: timedOut };
  }
}

function main(): void {
  const { manifest, noExec } = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(manifest);
  const runDir = path.dirname(manifestPath);

  if (!existsSync(manifestPath)) {
    console.error(`Manifest non trovato: ${manifestPath}`);
    process.exit(2);
  }
  const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as Manifest;
  if (!Array.isArray(parsed.obligations) || parsed.obligations.length === 0) {
    console.error('Manifest senza obbligazioni: niente da verificare.');
    process.exit(2);
  }

  const logsDir = path.join(runDir, 'command-logs');
  const resultsPath = path.join(runDir, 'command-results.json');
  const commandResults: Record<string, CommandResult | null> = {};

  // --no-exec: i risultati persistiti (o ricavati dai command log) sono la
  // prova durevole del run — rivalutiamo quelli, non rieseguiamo.
  if (noExec) {
    if (existsSync(resultsPath)) {
      Object.assign(commandResults, JSON.parse(readFileSync(resultsPath, 'utf8')));
    } else {
      for (const obl of parsed.obligations) {
        if (!obl.command) continue;
        const logPath = path.join(logsDir, `${obl.id}.log`);
        if (existsSync(logPath)) {
          const head = readFileSync(logPath, 'utf8').split('\n')[0] ?? '';
          const m = head.match(/exit_code:\s*(\d+|null)/);
          commandResults[obl.id] = {
            exit_code: m && m[1] !== 'null' ? Number(m[1]) : null,
            timed_out: head.includes('TIMEOUT'),
          };
        }
      }
      console.log('(--no-exec: risultati ricavati da command-results.json / command-logs)');
    }
  }

  for (const obl of parsed.obligations) {
    if (noExec) break;
    if (obl.waived?.by === 'director') {
      console.log(`- ${obl.id}: WAIVED-DIRECTOR (${obl.waived.reason}) — comando non eseguito`);
      continue;
    }
    if (!obl.command) {
      commandResults[obl.id] = null;
      continue;
    }
    mkdirSync(logsDir, { recursive: true });
    const logPath = path.join(logsDir, `${obl.id}.log`);
    console.log(`▶ ${obl.id}: ${obl.command}`);
    commandResults[obl.id] = runCommand(obl.command, logPath, obl.timeout_s ?? DEFAULT_TIMEOUT_S, runDir);
    console.log(`  exit_code=${commandResults[obl.id]?.exit_code ?? 'null'}`);
  }
  if (!noExec) {
    writeFileSync(resultsPath, JSON.stringify(commandResults, null, 2));
  }

  // Gate file→superficie (PLAN-044 T-002): file toccato senza superficie
  // mappata né disposition → il bundle fallisce (fail-closed).
  const contractsReport = checkContractsGate(process.cwd());
  const contracts = { ok: contractsReport.errors.length === 0, reasons: contractsReport.errors };

  // Gate red-first lockato (PLAN-044 T-004): i test dichiarati in
  // manifest.red_first devono avere un record con hash test + hash log
  // rossa immutati; mutare un test registrato nella diff → rosso.
  const redFirstReport = checkRedFirstGate(process.cwd(), {
    required: parsed.red_first,
    changedFiles: gitChangedFiles(process.cwd()),
  });
  const redFirst = { ok: redFirstReport.errors.length === 0, reasons: redFirstReport.errors };

  const bundle: Bundle = evaluateManifest(parsed, runDir, commandResults, contracts, redFirst);
  const bundlePath = path.join(runDir, 'bundle.json');
  writeFileSync(bundlePath, JSON.stringify(bundle, null, 2));

  console.log('\n=== Esiti obbligazioni ===');
  for (const ob of bundle.obligations) {
    console.log(`${ob.result.padEnd(16)} ${ob.id}${ob.reasons.length ? ' — ' + ob.reasons.join('; ') : ''}`);
  }
  if (bundle.verifier.reasons.length > 0) {
    console.log('\n=== Verificatore indipendente ===');
    bundle.verifier.reasons.forEach((r) => console.log(`  • ${r}`));
  }
  if (bundle.contracts && !bundle.contracts.ok) {
    console.log('\n=== contracts:check (file→superficie) ===');
    bundle.contracts.reasons.forEach((r) => console.log(`  • ${r}`));
  }
  if (bundle.red_first && !bundle.red_first.ok) {
    console.log('\n=== redfirst:check (red-first lockato) ===');
    bundle.red_first.reasons.forEach((r) => console.log(`  • ${r}`));
  }
  console.log(`\nVerdict: ${bundle.verdict} — bundle: ${bundlePath}`);
  process.exit(bundle.verdict === 'PASS' ? 0 : 1);
}

main();
