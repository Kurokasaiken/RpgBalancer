/**
 * redFirst — red-first lockato (PLAN-044 T-004 / S2).
 *
 * Quando un fix nasce da un test di riproduzione, la run rossa è lockata
 * per identità E esecuzione: il record lega hash canonico del file test +
 * sha256 del log della run rossa + exit code (≠0 obbligatorio). A fine
 * task il gate ricontrolla: file mutato, log manomesso o run "verde"
 * registrata → rosso.
 *
 * Journal append-only `.mw/red-first.jsonl`; log durevoli in
 * `.mw/red-first/`. `retire` = il test è scartato con motivo registrato
 * (invariante: nessun escape hatch — se i presupposti non sussistono più,
 * il test viene rimosso con record, non fatto sparire).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { canonicalFileHash, sha256File } from './gateCore';

export const RED_FIRST_REL = '.mw/red-first.jsonl';
export const RED_LOGS_REL = '.mw/red-first';

export interface RedFirstRecord {
  kind: 'record' | 'retire';
  test_file: string;
  /** Canonical hash del file test al record — identità. */
  test_sha256?: string;
  /** Path relativo del log della run rossa — esecuzione. */
  red_log?: string;
  red_log_sha256?: string;
  command?: string;
  /** Deve essere ≠ 0: una run "rossa" con exit 0 non è una riproduzione. */
  exit_code?: number;
  /** Per retire: perché il test è scartato. */
  reason?: string;
  recorded_at: string;
  recorded_by?: string;
}

export function loadRedFirst(repoRoot: string): RedFirstRecord[] {
  const p = path.join(repoRoot, RED_FIRST_REL);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split('\n')
    .filter((l) => l.trim().startsWith('{'))
    .map((l) => JSON.parse(l) as RedFirstRecord);
}

/** Ultimo evento del journal per un file test (append-only: vince l'ultimo). */
export function latestForFile(
  records: RedFirstRecord[],
  file: string,
): RedFirstRecord | undefined {
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].test_file === file) return records[i];
  }
  return undefined;
}

export interface RedFirstReport {
  checked: string[];
  retired: string[];
  errors: string[];
}

/**
 * Gate red-first.
 * - `required` (da manifest): ogni file DEVE avere un record valido —
 *   test_sha256 + red_log_sha256 immutati, exit_code ≠ 0.
 * - In più: qualunque file con record attivo (non retired) presente nella
 *   diff corrente viene riverificato — mutare un test di riproduzione
 *   registrato senza re-record/retire → rosso.
 */
export function checkRedFirstGate(
  repoRoot: string,
  opts: { required?: string[]; changedFiles?: string[] } = {},
): RedFirstReport {
  const report: RedFirstReport = { checked: [], retired: [], errors: [] };
  const records = loadRedFirst(repoRoot);
  const changed = opts.changedFiles;
  const required = opts.required ?? [];

  const verify = (file: string, ctx: string): void => {
    const rec = latestForFile(records, file);
    if (!rec) {
      report.errors.push(
        `${ctx}${file}: red-first richiesto ma nessun record — registra la run rossa con npm run redfirst:record`,
      );
      return;
    }
    if (rec.kind === 'retire') {
      report.retired.push(file);
      if (ctx) {
        report.errors.push(
          `${ctx}${file}: test scartato (${rec.reason ?? 'senza motivo'}) — il manifest lo richiede ancora`,
        );
      }
      return;
    }
    report.checked.push(file);
    const testSha = canonicalFileHash(path.join(repoRoot, file));
    if (testSha === null) {
      report.errors.push(`${ctx}${file}: file test registrato assente — re-record o redfirst:retire`);
    } else if (testSha !== rec.test_sha256) {
      report.errors.push(
        `${ctx}${file}: hash file test diverso da quello registrato (red-first lock) — re-record o retire`,
      );
    }
    const logPath = rec.red_log ? path.join(repoRoot, rec.red_log) : null;
    const logSha = logPath ? sha256File(logPath) : null;
    if (!logPath || logSha === null) {
      report.errors.push(`${ctx}${file}: log run rossa mancante (${rec.red_log ?? 'n/a'})`);
    } else if (logSha !== rec.red_log_sha256) {
      report.errors.push(
        `${ctx}${file}: hash output run rossa diverso da quello registrato — log manomesso`,
      );
    }
    if (typeof rec.exit_code !== 'number' || rec.exit_code === 0) {
      report.errors.push(
        `${ctx}${file}: run registrata con exit_code=${rec.exit_code ?? 'null'} — red-first richiede una riproduzione FALLITA`,
      );
    }
  };

  for (const f of required) verify(f, 'manifest: ');

  if (changed) {
    const inDiff = new Set(changed);
    const seen = new Set<string>();
    for (const rec of records) {
      if (seen.has(rec.test_file) || !inDiff.has(rec.test_file)) continue;
      seen.add(rec.test_file);
      const latest = latestForFile(records, rec.test_file);
      if (!latest || latest.kind === 'retire') continue;
      if (required.includes(rec.test_file)) continue; // già verificato sopra
      verify(rec.test_file, '');
    }
  }

  return report;
}
