/**
 * bundle — evidence derivata (PLAN-051 T-001, R-220 artifact-r004).
 *
 * Un solo comando al posto del packaging manuale: scopre la run dir,
 * genera lo scheletro `verification.json` se assente (--init), invoca
 * `produceBundle.ts` che esegue i comandi, cattura exit code/stdout e
 * scrive `bundle.json`/`command-results.json`/`verifier.json`.
 * L'agente non scrive MAI receipts o evidence a mano.
 *
 * Uso:
 *   npm run bundle -- --run=.mw/runs/<task>            # esegue e produce il bundle
 *   npm run bundle -- --init --run=.mw/runs/<task>     # scrive lo scheletro manifest
 *   npm run bundle -- --run=.mw/runs/<task> --no-exec  # ri-valuta senza rieseguire
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RUNS_ROOT = '.mw/runs';

interface Args {
  run?: string;
  init: boolean;
  noExec: boolean;
  allTiers: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { init: false, noExec: false, allTiers: false };
  for (const a of argv) {
    if (a.startsWith('--run=')) args.run = a.slice('--run='.length);
    else if (a === '--init') args.init = true;
    else if (a === '--no-exec') args.noExec = true;
    else if (a === '--all-tiers') args.allTiers = true;
  }
  return args;
}

/** Run dir più recente in .mw/runs che contiene già un verification.json. */
export function latestRunWithManifest(repoRoot: string): string | null {
  const root = path.join(repoRoot, RUNS_ROOT);
  if (!existsSync(root)) return null;
  const candidates = readdirSync(root)
    .map((d) => path.join(root, d))
    .filter((p) => {
      try {
        return statSync(p).isDirectory() && existsSync(path.join(p, 'verification.json'));
      } catch {
        return false;
      }
    })
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return candidates[0] ?? null;
}

/** Scheletro manifest con le obbligazioni di safeguard standard —
 *  le obbligazioni task-specifiche si aggiungono editando il file. */
export function skeletonManifest(runId: string): object {
  return {
    task: runId,
    run_id: runId,
    created_at: new Date().toISOString(),
    obligations: [
      {
        id: 'OB-SAFE-BUILD',
        requirement: 'build:check passa (safeguard standard)',
        source: 'AGENTS.md mandatory safeguards',
        type: 'state',
        environment: 'headless-ok',
        command:
          'cd "$PWD" && npm run build:check 2>&1 | tail -20',
        timeout_s: 600,
        artifacts: [{ path: 'command-logs/OB-SAFE-BUILD.log', kind: 'log' }],
        blocking: true,
      },
      {
        id: 'OB-SAFE-CLOSURE',
        requirement: 'closure:lint passa (safeguard standard)',
        source: 'AGENTS.md mandatory safeguards',
        type: 'state',
        environment: 'headless-ok',
        command:
          'cd "$PWD" && npm run closure:lint 2>&1 | tail -20',
        timeout_s: 600,
        artifacts: [{ path: 'command-logs/OB-SAFE-CLOSURE.log', kind: 'log' }],
        blocking: true,
      },
    ],
  };
}

function resolveTsxCli(repoRoot: string): string | null {
  const bin = path.join(repoRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  return existsSync(bin) ? bin : null;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();

  let runDir = args.run ? path.resolve(args.run) : latestRunWithManifest(repoRoot);
  if (!runDir) {
    console.error(
      `Nessuna run dir trovata. Passa --run=${RUNS_ROOT}/<task>` +
        (args.init ? ` (con --init crea lo scheletro verification.json)` : ''),
    );
    process.exit(2);
  }
  console.log(`run dir: ${path.relative(repoRoot, runDir)}`);

  const manifestPath = path.join(runDir, 'verification.json');
  if (args.init) {
    if (existsSync(manifestPath)) {
      console.log(`verification.json già presente — nessuna sovrascrittura.`);
    } else {
      const runId = path.basename(runDir);
      writeFileSync(manifestPath, JSON.stringify(skeletonManifest(runId), null, 2) + '\n');
      console.log(
        `verification.json scheletro scritto — aggiungi le obbligazioni ` +
          `task-specifiche (type, command, artifacts) prima del bundle.`,
      );
    }
  }
  if (!existsSync(manifestPath)) {
    console.error(`Manifest assente: ${manifestPath} — usa --init per lo scheletro o scrivilo tu.`);
    process.exit(2);
  }

  const tsxCli = resolveTsxCli(repoRoot);
  const bin = tsxCli ? process.execPath : 'npx';
  const binArgs = tsxCli ? [tsxCli] : ['tsx'];
  const produceArgs = [
    'scripts/verification/produceBundle.ts',
    `--manifest=${manifestPath}`,
    ...(args.noExec ? ['--no-exec'] : []),
    ...(args.allTiers ? ['--all-tiers'] : []),
  ];
  try {
    execFileSync(bin, [...binArgs, ...produceArgs], {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  } catch (e) {
    process.exit(typeof (e as { status?: number }).status === 'number' ? (e as { status: number }).status : 1);
  }
}

// Esegue solo come CLI (i test importano le funzioni pure).
if (process.argv[1]?.endsWith('bundle.ts')) main();
