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
  Obligation,
  evaluateManifest,
  evaluateObligation,
  obligationTier,
  sha256File,
} from './gateCore';
import { checkContractsGate, gitChangedFiles } from './contractsCheck';
import { checkRedFirstGate } from './redFirst';
import { checkIntentGate } from './intentGate';
import { checkTrustedLock } from './trustedLock';
import { globMatch } from './surfaceMap';
import { isVisualFile } from './visualForkGate';
import { generateVerifierReceipt } from './verifierReceipt';
import { parseManifest } from './manifestSchema';

function parseArgs(argv: string[]): { manifest: string; noExec: boolean; allTiers: boolean } {
  const manifestArg = argv.find((a) => a.startsWith('--manifest='));
  if (!manifestArg) {
    console.error('Uso: tsx scripts/verification/produceBundle.ts --manifest=<path> [--no-exec] [--all-tiers]');
    process.exit(2);
  }
  return {
    manifest: manifestArg.split('=').slice(1).join('='),
    noExec: argv.includes('--no-exec'),
    allTiers: argv.includes('--all-tiers'),
  };
}

const DEFAULT_TIMEOUT_S = 300;

const TIERS_REL = '.mw/verify-tiers.json';

interface TiersConfig {
  perceptual_globs: string[];
  core_globs: string[];
}

/** PLAN-051 T-004: config di tiering. Assente/malformata → null → nessun
 *  skip (fail-closed: meglio un controllo in più che uno in meno). */
export function loadTiersConfig(repoRoot: string = process.cwd()): TiersConfig | null {
  try {
    const p = path.join(repoRoot, TIERS_REL);
    if (!existsSync(p)) return null;
    const parsed = JSON.parse(readFileSync(p, 'utf8')) as Partial<TiersConfig>;
    if (!Array.isArray(parsed.perceptual_globs) || !Array.isArray(parsed.core_globs)) return null;
    return { perceptual_globs: parsed.perceptual_globs, core_globs: parsed.core_globs };
  } catch {
    return null;
  }
}

/**
 * PLAN-051 T-004: il tier percettivo è raggiunto dal diff quando un file
 * è visivo (isVisualFile), matcha i glob percettivi, o tocca un modulo
 * core condiviso (shared/persistence/economy → tocca tutte le superfici).
 * Diff vuoto o config assente → true (fail-closed).
 */
export function perceptualReached(changedFiles: string[], tiers: TiersConfig | null): boolean {
  if (!tiers || changedFiles.length === 0) return true;
  return changedFiles.some(
    (f) =>
      isVisualFile(f) ||
      tiers.perceptual_globs.some((g) => globMatch(g, f)) ||
      tiers.core_globs.some((g) => globMatch(g, f)),
  );
}

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
  const { manifest, noExec, allTiers } = parseArgs(process.argv.slice(2));
  const manifestPath = path.resolve(manifest);
  const runDir = path.dirname(manifestPath);

  if (!existsSync(manifestPath)) {
    console.error(`Manifest non trovato: ${manifestPath}`);
    process.exit(2);
  }
  // PLAN-051 T-005: contratto Zod del manifest — un verification.json
  // malformato o prose-only rifiuta il bundle (exit 2), non produce un
  // verdetto su input ambiguo.
  const schemaCheck = parseManifest(JSON.parse(readFileSync(manifestPath, 'utf8')));
  if (!schemaCheck.ok) {
    console.error(`Manifest ${manifestPath} non valido (schema PLAN-051 T-005):`);
    for (const issue of schemaCheck.issues) console.error(`  • ${issue}`);
    process.exit(2);
  }
  const parsed = schemaCheck.manifest;

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
  const changedFiles = gitChangedFiles(process.cwd());
  const redFirstReport = checkRedFirstGate(process.cwd(), {
    required: parsed.red_first,
    changedFiles,
  });
  const redFirst = { ok: redFirstReport.errors.length === 0, reasons: redFirstReport.errors };

  // PLAN-051 T-004: tiering per reach. Le obbligazioni percettive saltano
  // se il diff non tocca superfici visive né moduli core (touches-all);
  // `--all-tiers` (verify:sweep) disabilita lo skip. Config assente o
  // diff vuoto → nessun skip (fail-closed).
  const tiersCfg = loadTiersConfig();
  const skipPerceptual = !allTiers && !perceptualReached(changedFiles, tiersCfg);
  if (skipPerceptual) {
    console.log('tiering: nessuna superficie percettiva/core nel diff — obbligazioni percettive SKIPPED');
  }
  const evaluateWithTier = (obl: Obligation) =>
    skipPerceptual && obligationTier(obl) === 'perceptual'
      ? {
          id: obl.id,
          result: 'SKIPPED' as const,
          reasons: ['tier percettivo non raggiunto dal diff (verify:sweep per il run completo)'],
          artifacts: obl.artifacts.map((a) => ({ path: a.path, sha256: null, exists: false })),
        }
      : evaluateObligation(obl, runDir, commandResults[obl.id] ?? null, parsed.created_at);

  // Receipt meccanico del verificatore (PLAN-044 T-005): verifier.json è
  // rigenerato qui — verdetto meccanico + exit code + hash artefatti +
  // tree hash sull'albero sorgente+test. Un receipt scritto a mano viene
  // sovrascritto; il check a valle richiede `generated_by`.
  const verifierNeeded =
    parsed.verifier_required === true ||
    parsed.obligations.some((o) => o.blocking && o.type !== 'state');
  if (verifierNeeded) {
    const evaluations = parsed.obligations.map(evaluateWithTier);
    const receipt = generateVerifierReceipt({
      manifest: parsed,
      evaluations,
      commandResults,
      repoRoot: process.cwd(),
      changedFiles,
    });
    writeFileSync(path.join(runDir, 'verifier.json'), JSON.stringify(receipt, null, 2));
    console.log('verifier.json: receipt meccanico rigenerato (generated_by presente)');
  }

  // PLAN-051 T-002: hash-lock del trust-set (fail-closed solo quando il
  // lock esiste — finché è assente è una nota, la sigillatura arriva con
  // il canale di approvazione T-003). Self-hash del bundler nel bundle.
  const lockReport = checkTrustedLock(process.cwd());
  const trustedLock = {
    ok: lockReport.ok,
    lock_present: lockReport.lock_present,
    reasons: lockReport.errors,
    notes: lockReport.notes,
  };
  const integrity = {
    bundler_sha256: {
      'scripts/verification/produceBundle.ts': sha256File(
        path.join(process.cwd(), 'scripts/verification/produceBundle.ts'),
      ),
      'scripts/verification/bundle.ts': sha256File(
        path.join(process.cwd(), 'scripts/verification/bundle.ts'),
      ),
    },
  };

  // Gate regime intent (PLAN-045 T-005b): manifest.intent_gate richiede
  // intent.json con status PASS|WAIVED|SKIPPED_TRIVIAL + catena/integrità.
  const intentReport = parsed.intent_gate === true
    ? checkIntentGate(runDir, process.cwd(), { changedFiles })
    : null;
  const intentGate = intentReport
    ? { ok: intentReport.ok, status: intentReport.status, reasons: intentReport.errors }
    : undefined;
  for (const w of intentReport?.warnings ?? []) {
    console.log(`  ⚠ intent-gate: ${w}`);
  }

  const bundle: Bundle = evaluateManifest(
    parsed,
    runDir,
    commandResults,
    contracts,
    redFirst,
    trustedLock,
    integrity,
    skipPerceptual,
    intentGate,
  );
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
  if (bundle.decision_report && !bundle.decision_report.ok) {
    console.log('\n=== decision report (schema-check) ===');
    bundle.decision_report.reasons.forEach((r) => console.log(`  • ${r}`));
  }
  if (bundle.intent_gate && !bundle.intent_gate.ok) {
    console.log('\n=== intent-gate (regime intent PLAN-045) ===');
    bundle.intent_gate.reasons.forEach((r) => console.log(`  • ${r}`));
  }
  if (bundle.trusted_lock) {
    for (const n of bundle.trusted_lock.notes) console.log(`  note: ${n}`);
    if (!bundle.trusted_lock.ok) {
      console.log('\n=== trusted-lock (hash-lock trust-set) ===');
      bundle.trusted_lock.reasons.forEach((r) => console.log(`  • ${r}`));
    }
  }
  console.log(`\nVerdict: ${bundle.verdict} — bundle: ${bundlePath}`);
  process.exit(bundle.verdict === 'PASS' ? 0 : 1);
}

if (process.argv[1]?.endsWith('produceBundle.ts')) main();
