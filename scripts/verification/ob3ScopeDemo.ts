/**
 * ob3ScopeDemo — OB-3 di PLAN-081: dimostrazione live del filtro di scope
 * sul worktree reale (T-13: sessioni parallele sporcano il diff).
 *
 * Usa la stessa logica di classificazione del contracts-gate
 * (surface → exception → unmapped) ma NON chiama checkContractsGate:
 * con gate-file nel diff ogni chiamata delega al gate a HEAD (~150s
 * sotto carico) e la demo varrebbe meno del suo costo. La prova a
 * livello gate l'hanno già data i test unitari e il primo bundle run
 * (report scopato con foreign_scope=74, zero errori su foreign).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  applyScopeFiles,
  gitChangedFiles,
  isExemptFile,
  loadExceptions,
} from './contractsCheck';
import { globMatch, loadSurfaceMap, surfaceFor } from './surfaceMap';
import { parseManifest } from './manifestSchema';

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, '.mw/runs/plan081-gate-foreign-scope/verification.json');
const parsed = parseManifest(JSON.parse(readFileSync(manifestPath, 'utf8')));
if (!parsed.ok) {
  console.error(`FAIL: manifest non valido — ${parsed.issues.join('; ')}`);
  process.exit(1);
}
const scope = parsed.manifest.scope_files;
if (!scope || scope.length === 0) {
  console.error('FAIL: manifest senza scope_files — la demo non ha nulla da provare');
  process.exit(1);
}

const changed = gitChangedFiles(repoRoot);
const { scoped, foreign } = applyScopeFiles(changed, scope);

console.log(`changed totale: ${changed.length}`);
console.log(`scoped (valutati dal gate): ${scoped.length}`);
console.log(`foreign_scope (advisory): ${foreign.length}`);

if (foreign.length === 0) {
  console.error('FAIL: foreign_scope vuoto — il filtro non ha partizionato');
  process.exit(1);
}

const map = loadSurfaceMap(repoRoot);
if (!map) {
  console.error('FAIL: surface-map assente — classificazione non valutabile');
  process.exit(1);
}
const exceptions = loadExceptions(repoRoot);
const wouldError = (f: string) =>
  !isExemptFile(f) &&
  surfaceFor(f, map).length === 0 &&
  !exceptions.some((e) => typeof e.glob === 'string' && globMatch(e.glob, f));

const foreignWouldError = foreign.filter(wouldError);
console.log(`file foreign che sarebbero stati errori unscoped: ${foreignWouldError.length}`);
foreignWouldError.slice(0, 10).forEach((f) => console.log(`  • ${f}`));
if (foreignWouldError.length === 0) {
  console.error('FAIL: nessun file foreign sarebbe stato errore — la demo non prova il filtro');
  process.exit(1);
}

const scopedErrors = scoped.filter(wouldError);
if (scopedErrors.length > 0) {
  console.error(`FAIL: ${scopedErrors.length} file in scope restano senza disposition:`);
  scopedErrors.forEach((f) => console.error(`  • ${f}`));
  process.exit(1);
}

console.log(
  `OK: ${foreignWouldError.length} file di altre sessioni sarebbero stati errori ` +
    `"senza superficie" nel gate unscoped; nello scoped sono advisory. ` +
    `Tutti i ${scoped.length} file del piano hanno una disposition.`,
);
