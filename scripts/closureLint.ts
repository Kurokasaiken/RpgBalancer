import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { checkKanbanGate, checkNestedAgentsGate, checkRichiesteGate } from './verification/gateCore';
import { checkContractsGate, gitChangedFiles } from './verification/contractsCheck';
import { checkRedFirstGate } from './verification/redFirst';

/**
 * closure:lint — gate di chiusura (R-189), ridotto all'essenziale (R-208).
 *
 * La kanban board `agent_assignments.md` e la pipeline di dispatch
 * (coordinator / ai-worker / harness) sono IN PAUSA dalla decisione
 * Director 2026-10-16 (R-208): nessuna nuova riga sulla board, nessun
 * dispatch, nessun prompt spec. Questo script NON valida più il formato
 * della tabella kanban: applica solo il gate di chiusura — una nuova
 * transizione a `Completato` sulla board o a `fatta`/`completata` in
 * RICHIESTE.md senza `bundle.json` valido fallisce il lint.
 *
 * Baseline = HEAD: le righe già committate sono grandfathered.
 * Il controllo sul diff della board resta attivo di proposito: se qualcuno
 * riapre la tabella a mano, il gate lo intercetta (fail-loud).
 */

const KANBAN_REL_PATH = path.join('src', 'docs', 'docs', 'coordinator', 'agent_assignments.md');
const RICHIESTE_REL_PATH = 'RICHIESTE.md';

const DEFAULT_TIMEOUT_MS = 30000;

function parseArgs(argv: string[]): { timeoutMs: number } {
  const timeoutArg = argv.find((arg) => arg.startsWith('--timeout='));
  const timeoutMs = timeoutArg
    ? Number(timeoutArg.split('=')[1]) || DEFAULT_TIMEOUT_MS
    : DEFAULT_TIMEOUT_MS;
  return { timeoutMs };
}

async function main() {
  const { timeoutMs } = parseArgs(process.argv.slice(2));
  const errors: string[] = [];

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`closure:lint timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  // Gate di chiusura (R-189): nuove transizioni a Completato / fatta devono
  // citare un bundle.json valido. Baseline = HEAD: le righe già chiuse e
  // committate sono grandfathered; chi scrive Completato/fatta a mano senza
  // bundle lascia il repo rosso qui (fail-loud).
  try {
    const repoRoot = process.cwd();
    const readBaseline = (rel: string) =>
      Promise.race([
        Promise.resolve(
          execSync(`git show "HEAD:${rel.replace(/\\/g, '/')}"`, {
            encoding: 'utf8' as BufferEncoding,
            maxBuffer: 32 * 1024 * 1024,
          }),
        ),
        timeoutPromise,
      ]);

    const baselineKanban = await readBaseline(KANBAN_REL_PATH);
    const currentKanban = await readFile(path.resolve(KANBAN_REL_PATH), 'utf8');
    errors.push(...checkKanbanGate(baselineKanban, currentKanban, repoRoot));

    const baselineRichieste = await readBaseline(RICHIESTE_REL_PATH);
    const currentRichieste = await readFile(path.resolve(RICHIESTE_REL_PATH), 'utf8');
    errors.push(...checkRichiesteGate(baselineRichieste, currentRichieste, repoRoot));
  } catch (gateError) {
    errors.push(
      `Gate di chiusura non valutabile (baseline git assente?): ${(gateError as Error).message}`,
    );
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Gate igiene AGENTS (PLAN-044 T-001): nessun pattern di workflow
  // sospeso nei file agente annidati — il drift non si reintroduce.
  errors.push(...checkNestedAgentsGate(process.cwd()));

  // Gate file→superficie (PLAN-044 T-002): file toccato senza superficie
  // mappata né disposition → rosso (fail-closed).
  errors.push(...checkContractsGate(process.cwd()).errors);

  // Gate red-first (PLAN-044 T-004): un file test con record attivo
  // mutato nella diff corrente senza re-record/retire → rosso.
  errors.push(
    ...checkRedFirstGate(process.cwd(), { changedFiles: gitChangedFiles(process.cwd()) })
      .errors,
  );

  if (errors.length > 0) {
    console.error('Closure lint fallito. Risolvi i seguenti problemi:');
    for (const err of errors) {
      console.error(` • ${err}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('Closure lint passato: gate di chiusura RICHIESTE/board verificato.');
}

main().catch((error) => {
  console.error('Errore eseguendo closure:lint', error);
  process.exitCode = 1;
});
