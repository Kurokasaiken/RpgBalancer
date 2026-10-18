#!/usr/bin/env tsx
/**
 * director:answer — registra un `director_answer` nel journal append-only
 * `.mw/director-answers.jsonl` (PLAN-044 T-003 / S1b).
 *
 * BOUNDARY PROCEDURALE — non prova crittografica di authorship (signing =
 * v2): chi esegue questo comando risponde come Director. Il gate verifica
 * solo che la risposta esista e sia legata agli hash giusti.
 *
 * Tipi:
 *   --exception <id>   lega exception_id + hash del record eccezione +
 *                      canonical hash di OGNI file changed coperto dal glob
 *                      dell'eccezione al momento della risposta.
 *                      Tweak benigni (whitespace/EOL) non invalidano;
 *                      modifica sostanziale → ri-approvazione. Un file che
 *                      matcha il glob dopo la risposta → scope drift →
 *                      ri-approvazione.
 *   --gate-diff        lega i gate-file modificati vs HEAD + canonical
 *                      hash (bootstrap: il gate non esiste a HEAD e non
 *                      può valutare se stesso).
 *
 * Uso:
 *   npm run director:answer -- --exception EXC-... --answer "<testo>"
 *   npm run director:answer -- --gate-diff --answer "<testo>"
 *   npm run director:answers
 */
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { canonicalFileHash } from './verification/gateCore';
import {
  DIRECTOR_ANSWERS_REL,
  globMatch,
} from './verification/surfaceMap';
import {
  GATE_FILES,
  exceptionRecordHash,
  gitChangedFiles,
  loadExceptions,
  type DirectorAnswer,
} from './verification/contractsCheck';

const repoRoot = process.cwd();
const args = process.argv.slice(2);
function arg(name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}
const flag = (name: string) => args.includes(`--${name}`);

function append(record: DirectorAnswer): void {
  const file = path.join(repoRoot, DIRECTOR_ANSWERS_REL);
  mkdirSync(path.dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(record) + '\n');
  console.log(`director_answer registrata → ${DIRECTOR_ANSWERS_REL}`);
  console.log(`  kind: ${record.kind}  answered_at: ${record.answered_at}`);
}

function cmdList(): void {
  const file = path.join(repoRoot, DIRECTOR_ANSWERS_REL);
  if (!existsSync(file)) {
    console.log('Nessuna director_answer registrata.');
    return;
  }
  const lines = readFileSync(file, 'utf8').split('\n').filter((l) => l.trim().startsWith('{'));
  for (const l of lines) {
    const a = JSON.parse(l) as DirectorAnswer;
    const target = a.exception_id ?? `${(a.gate_files ?? []).length} gate-file`;
    console.log(`${a.answered_at}  ${a.kind.padEnd(20)} ${target}  — ${a.answer.slice(0, 60)}`);
  }
}

function cmdException(exceptionId: string | undefined, answer: string | undefined): void {
  if (!exceptionId || !answer) {
    console.error('Uso: npm run director:answer -- --exception <id> --answer "<testo>"');
    process.exit(2);
  }
  const exc = [...loadExceptions(repoRoot)].reverse().find((e) => e.id === exceptionId);
  if (!exc) {
    console.error(`Eccezione ${exceptionId} non trovata in .mw/coverage-exceptions.jsonl`);
    process.exit(2);
  }
  const covered = gitChangedFiles(repoRoot)
    .filter((f) => globMatch(exc.glob, f))
    .map((f) => ({ file: f, sha256_canonical: canonicalFileHash(path.join(repoRoot, f)) }));
  if (covered.length === 0) {
    console.error(`Attenzione: il glob ${exc.glob} non copre nessun file changed — la risposta non lega nulla.`);
  }
  append({
    kind: 'coverage_exception',
    exception_id: exc.id,
    exception_record_sha256: exceptionRecordHash(exc),
    covered,
    answer,
    answered_at: new Date().toISOString(),
    answered_by: 'director',
    source: 'director:answer (boundary procedurale)',
  });
  console.log(`  covered: ${covered.length} file legati al canonical hash corrente`);
}

function cmdGateDiff(answer: string | undefined): void {
  if (!answer) {
    console.error('Uso: npm run director:answer -- --gate-diff --answer "<testo>"');
    process.exit(2);
  }
  const gateFiles = gitChangedFiles(repoRoot)
    .filter((f) => GATE_FILES.includes(f))
    .map((f) => ({ file: f, sha256_canonical: canonicalFileHash(path.join(repoRoot, f)) }));
  if (gateFiles.length === 0) {
    console.log('Nessun gate-file modificato vs HEAD — niente da rispondere.');
    return;
  }
  append({
    kind: 'gate-diff',
    gate_files: gateFiles,
    answer,
    answered_at: new Date().toISOString(),
    answered_by: 'director',
    source: 'director:answer (boundary procedurale)',
  });
  console.log(`  gate-file legati: ${gateFiles.length}`);
  gateFiles.forEach((g) => console.log(`    ${g.file}`));
}

if (flag('gate-diff')) cmdGateDiff(arg('answer'));
else if (args[0] === 'list' || flag('list')) cmdList();
else if (arg('exception')) cmdException(arg('exception'), arg('answer'));
else {
  console.error('Uso: director:answer -- --exception <id> --answer "<t>" | --gate-diff --answer "<t>" | list');
  process.exit(2);
}
