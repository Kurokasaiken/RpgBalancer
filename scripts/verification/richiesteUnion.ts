/**
 * richiesteUnion — PLAN-121: lettura "union" del ledger intenti.
 *
 * Da PLAN-121 (split 2026-11-15, cutoff Data>=2026-11-08) il ledger vive in
 * tre file: `RICHIESTE.md` (attivo, entry recenti — unico file in scrittura),
 * `RICHIESTE-backlog.md` (open-family antecedenti) e `RICHIESTE-archive.md`
 * (closed-family antecedenti). I gate che risolvono ref `R-NNN` o scansionano
 * status devono leggere l'unione, non il solo file attivo.
 *
 * Ordine canonico di concatenazione: attivo → backlog → archive.
 * Pre-split (file assenti) l'unione degenera al solo RICHIESTE.md.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** I tre file del ledger, in ordine canonico di concatenazione. */
export const RICHIESTE_UNION_PARTS = [
  'RICHIESTE.md',
  'RICHIESTE-backlog.md',
  'RICHIESTE-archive.md',
] as const;

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
 * Legge l'unione dei file del ledger nel worktree (o a una baseline git se
 * passata). Ogni parte presente è concatenata nell'ordine canonico; le parti
 * mancanti sono saltate. Ritorna null solo se nemmeno RICHIESTE.md esiste.
 */
export function readRichiesteUnion(repoRoot: string, baseline?: string): string | null {
  const parts: string[] = [];
  for (const rel of RICHIESTE_UNION_PARTS) {
    const text = baseline ? readBaseline(repoRoot, baseline, rel) : readWorktree(repoRoot, rel);
    if (text !== null) parts.push(text);
  }
  return parts.length > 0 ? parts.join('') : null;
}

/** Elenco dei file union effettivamente presenti nel worktree. */
export function richiesteUnionFiles(repoRoot: string): string[] {
  return RICHIESTE_UNION_PARTS.filter((rel) => existsSync(path.join(repoRoot, rel)));
}
