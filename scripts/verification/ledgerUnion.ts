/**
 * ledgerUnion — PLAN-123: lettura "union" del ledger decisioni.
 *
 * Da PLAN-123 (split 2026-11-15, cutoff Data>=2026-10-24) il ledger vive in
 * due file: `context/DECISION_LOG.md` (attivo — entry datate recenti, unico
 * file in scrittura) e `context/DECISION_LOG-archive.md` (14 sezioni legacy
 * non-datate + datate antecedenti). I gate/strumenti che risolvono ref
 * `Decision NNN` o entry datate devono leggere l'unione, non il solo attivo.
 *
 * `.mw/desiderata.md` NON è splittato (ruling D-2c): resta il canonico
 * byte-intatto, fonte unica dello slice tooling; il read-path obbligato è
 * `.mw/desiderata-digest.md` (indice completo + suffisso verbatim), ma le
 * citazioni `vN` risolvono sempre sul canonico.
 *
 * Ordine canonico di concatenazione DECISION_LOG: attivo → archive.
 * Pre-split (archive assente) l'unione degenera al solo attivo.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** I file del ledger decisioni, in ordine canonico di concatenazione. */
export const DECISION_LOG_UNION_PARTS = [
  'context/DECISION_LOG.md',
  'context/DECISION_LOG-archive.md',
] as const;

/** Canonico desiderata (intatto) + digest in read-list. */
export const DESIDERATA_CANONICAL = '.mw/desiderata.md';
export const DESIDERATA_DIGEST = '.mw/desiderata-digest.md';

function readWorktree(repoRoot: string, rel: string): string | null {
  try {
    const p = path.join(repoRoot, rel);
    return existsSync(p) ? readFileSync(p, 'utf8') : null;
  } catch {
    return null;
  }
}

function readBaseline(repoRoot: string, baseline: string, rel: string): string | null {
  try {
    return execSync(`git show "${baseline}:${rel}"`, {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null; // parte inesistente a quella baseline (es. pre-split)
  }
}

/**
 * Legge l'unione dei file di DECISION_LOG nel worktree (o a una baseline git
 * se passata). Ogni parte presente è concatenata nell'ordine canonico; le
 * parti mancanti sono saltate. Ritorna null solo se nemmeno l'attivo esiste.
 *
 * NOTA: a differenza di RICHIESTE (unione ordinata ricostruisce il file
 * originale), qui l'ordine canonico attivo→archive NON ricompone l'ordine
 * originale del file pre-split — le sezioni dell'archive precedevano quelle
 * attive. L'unione serve per lookup di ref (`Decision NNN`, data), non per
 * ricostruzione byte-perfect (quella è verificata da ledgerSplit unionCheck).
 */
export function readDecisionLogUnion(repoRoot: string, baseline?: string): string | null {
  const parts: string[] = [];
  for (const rel of DECISION_LOG_UNION_PARTS) {
    const text = baseline ? readBaseline(repoRoot, baseline, rel) : readWorktree(repoRoot, rel);
    if (text !== null) parts.push(text);
  }
  return parts.length > 0 ? parts.join('') : null;
}

/** Elenco dei file union effettivamente presenti nel worktree. */
export function decisionLogUnionFiles(repoRoot: string): string[] {
  return DECISION_LOG_UNION_PARTS.filter((rel) => existsSync(path.join(repoRoot, rel)));
}
