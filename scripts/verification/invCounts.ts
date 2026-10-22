/**
 * invCounts — PLAN-054 T-005: modello e join degli `executedCount` per
 * blocco `// INV:<id>`.
 *
 * Il runner (vitest setup `tests/setup/invAssertionCounts.ts` oppure il
 * wrapper Playwright `tests/helpers/syncGateExpect.ts`) registra per ogni
 * test eseguito sotto `SYNC_GATE=1` il numero di asserzioni del tentativo
 * finale `passed` — mai il cumulato di retry/poll (artifact-r009 §2.2).
 *
 * Regole del join:
 *  - `expect.poll`/`toPass` nel blocco → floor statico = numero di
 *    asserzioni dirette estraibili (un tentativo passato = 1 asserzione
 *    contata per `expect.poll`, non N polling);
 *  - `test.each` → un entry runtime per riga tabellare: il conteggio del
 *    blocco è il minimo sulle istanze (una regressione su una riga fallisce);
 *  - INV merge su più test → somma dei conteggi dei titoli.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { invTagPositions, scanInvBlocks, type InvBlock } from './invBlocks';

export const COUNTS_FILE_REL = 'test-results/inv-executed-counts.json';

/** Entry runtime scritta dal runner sotto SYNC_GATE=1. */
export interface InvCountEntry {
  /** Path del file test, relativo al repo root (posix). */
  file: string;
  /** Full title del test (describe inclusi), come riportato dal runner. */
  title: string;
  /** Asserzioni del tentativo finale passed. */
  assertionCalls: number;
  /** Stato del tentativo finale. */
  status: 'passed' | 'failed' | 'skipped';
}

export function loadCountEntries(repoRoot: string): InvCountEntry[] {
  const p = join(repoRoot, COUNTS_FILE_REL);
  if (!existsSync(p)) return [];
  try {
    const text = readFileSync(p, 'utf8');
    /* JSONL (una entry per tentativo; vince l'ultima = tentativo finale)
     * oppure documento JSON `{ entries: [] }` (runner report materializzato). */
    const byKey = new Map<string, InvCountEntry>();
    const push = (e: InvCountEntry) => {
      if (e && typeof e.file === 'string') byKey.set(`${e.file}${e.title}`, e);
    };
    if (text.trimStart().startsWith('{')) {
      const raw = JSON.parse(text) as { entries?: InvCountEntry[] };
      if (Array.isArray(raw.entries)) for (const e of raw.entries) push(e);
      else push(raw as unknown as InvCountEntry);
    } else {
      for (const line of text.split('\n')) {
        if (!line.trim().startsWith('{')) continue;
        push(JSON.parse(line) as InvCountEntry);
      }
    }
    return [...byKey.values()];
  } catch {
    return [];
  }
}

/** Il titolo template `test.each` matcha un full title runtime: `%*` → jolly. */
export function titleMatches(template: string, runtimeTitle: string, describePath: string[]): boolean {
  const full = [...describePath, template].join(' ');
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^${esc(full).replace(/%[a-zA-Z]/g, '.*')}(\\s.*)?$`);
  return re.test(runtimeTitle) || re.test(runtimeTitle.replace(/\s+/g, ' '));
}

/**
 * Conteggio eseguito di un blocco INV dalle entry runtime:
 *  - `usesPoll` → floor statico (`assertions.length`), il cumulato dei
 *    polling NON è accettato;
 *  - altrimenti somma delle `assertionCalls` dei test matchati; entry
 *    assenti → `null` (il chiamante decide se fail-closed).
 */
export function resolveExecutedCount(
  block: Pick<InvBlock, 'file' | 'describePath' | 'testTitles' | 'assertions' | 'usesPoll'>,
  entries: InvCountEntry[],
): number | null {
  if (block.usesPoll) return block.assertions.length;
  const rel = (f: string) => f.split('\\').join('/');
  const file = rel(block.file);
  const matched: number[] = [];
  for (const t of block.testTitles) {
    const rows = entries.filter(
      (e) => rel(e.file).endsWith(file) || file.endsWith(rel(e.file)),
    ).filter((e) => titleMatches(t, e.title, block.describePath));
    if (!rows.length) return null;
    /* test.each: minimo sulle istanze; titolo singolo: entry finale. */
    matched.push(Math.min(...rows.map((r) => r.assertionCalls)));
  }
  if (!matched.length) return null;
  return matched.reduce((a, b) => a + b, 0);
}

/** Scansione blocchi INV WT (condivisa con il seal e il gate). */
export function scanWtInvBlocks(repoRoot: string): { blocks: InvBlock[] } {
  const testFiles: { path: string; text: string }[] = [];
  const scanDir = (d: string) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d)) {
      const abs = join(d, n);
      if (abs.includes('__snapshots__')) continue;
      if (statSync(abs).isDirectory()) scanDir(abs);
      else if (/\.(ts|tsx)$/.test(n)) {
        const text = readFileSync(abs, 'utf8');
        if (invTagPositions(text).length) testFiles.push({ path: relative(repoRoot, abs), text });
      }
    }
  };
  scanDir(join(repoRoot, 'tests'));
  return { blocks: scanInvBlocks(testFiles).blocks };
}

/**
 * Snapshot `executed_counts` da sigillare in `trusted.lock.json`: per ogni
 * blocco INV il conteggio runtime dal counts file, o `'unknown'` se il
 * runner non lo ha attestato (Playwright senza SYNC_GATE=1, test mai
 * eseguiti sotto il gate).
 */
export function collectSealedCounts(repoRoot: string): Record<string, number | 'unknown'> {
  const { blocks } = scanWtInvBlocks(repoRoot);
  const entries = loadCountEntries(repoRoot);
  const out: Record<string, number | 'unknown'> = {};
  for (const b of blocks) {
    const n = resolveExecutedCount(b, entries);
    out[b.id] = n === null ? 'unknown' : n;
  }
  return out;
}
