/**
 * e2eCache — PLAN-054 T-005: cache dei check E2E con content-hash della
 * chiusura transitiva delle dipendenze.
 *
 * Regole (artifact-r009 §5):
 *  - la chiave comprende: file test + helper + file applicativi in scope
 *    + config rilevanti (content hash), versioni runner/browser risolte
 *    da `package-lock.json` a `BASE` (mai da `node_modules` installati),
 *    e id+revisione contratto/INV;
 *  - una dipendenza modificata invalida la cache: `SKIPPED_CACHE` non
 *    soddisfa mai l'esecuzione richiesta — servono run reali attestate
 *    dal JSON report del runner (verificate da closure:lint via join su
 *    dependency-hash);
 *  - `FLAKE`/`skipped`/`SKIPPED_CACHE` restano stati distinti dal
 *    `passed`: solo `passed` attesta la run.
 *  - una check le cui dipendenze non sono enumerabili → fail closed.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { sha256File, sha256Text } from './gateCore';

export type E2eRunStatus = 'passed' | 'failed' | 'skipped' | 'skipped_cache' | 'flake';

/** Versioni runner rilevanti risolte dal lockfile (testo o path). */
export function lockfileVersions(lockText: string): Record<string, string> {
  const out: Record<string, string> = {};
  let lock: { packages?: Record<string, { version?: string }> };
  try {
    lock = JSON.parse(lockText);
  } catch {
    return out;
  }
  for (const pkg of ['@playwright/test', 'playwright', 'playwright-core', 'vitest', 'typescript']) {
    const v = lock.packages?.[`node_modules/${pkg}`]?.version;
    if (v) out[pkg] = v;
  }
  return out;
}

/** Versioni dal `package-lock.json` a BASE (mai dai node_modules installati). */
export function lockfileVersionsAtBaseline(repoRoot: string, baseline: string): Record<string, string> | null {
  try {
    const text = execSync(`git show ${baseline}:package-lock.json`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
    return lockfileVersions(text);
  } catch {
    return null;
  }
}

/**
 * Chiave di cache di un check E2E: content-hash della closure completa
 * (file + versioni lockfile@BASE + revisioni contratto/INV). Ogni
 * contributo mancante → `null` (fail-closed: non cachabile).
 */
export function e2eCacheKey(input: {
  checkId: string;
  depHashes: (string | null)[];
  versions: Record<string, string> | null;
  contractRev: string;
  invRevs: Record<string, string>;
}): string | null {
  if (input.versions === null) return null;
  if (input.depHashes.some((h) => h === null)) return null;
  return createHash('sha256')
    .update(
      JSON.stringify({
        check: input.checkId,
        deps: [...input.depHashes].sort(),
        versions: input.versions,
        contract: input.contractRev,
        invs: Object.keys(input.invRevs).sort().map((k) => [k, input.invs[k]]),
      }),
    )
    .digest('hex');
}

/** Hash di contenuto della closure di file (null → elemento non hashabile). */
export function depHashOf(repoRoot: string, rel: string): string | null {
  return sha256File(path.join(repoRoot, rel));
}

/* ------------------------------------------------------------------ */
/* Obblighi E2E: dep-changed → run reale richiesta                      */
/* ------------------------------------------------------------------ */

export interface E2eObligationInput {
  /** Check E2E sigillate con la loro dependency-closure hash. */
  checks: {
    id: string;
    /** Chiusura sigillata: path → sha256 di contenuto. */
    sealedDeps: Record<string, string>;
  }[];
  /** Diff BASE..WT (path relativi posix). */
  changedFiles: string[];
  /** Entry del runner report corrente (una per esecuzione attestata). */
  report: {
    check_id: string;
    status: E2eRunStatus;
    /** Hash della closure valutata al momento della run. */
    deps_hash?: string;
  }[];
  /** hash → deps correnti (per confronto col sigillo). */
  currentDepHash?: (checkId: string) => Record<string, string> | null;
}

export interface E2eObligationVerdict {
  check_id: string;
  dep_changed: boolean;
  satisfied: boolean;
  reason: string;
}

export function evalE2eObligations(input: E2eObligationInput): {
  verdicts: E2eObligationVerdict[];
  errors: string[];
} {
  const verdicts: E2eObligationVerdict[] = [];
  const errors: string[] = [];
  const changed = new Set(input.changedFiles);

  for (const check of input.checks) {
    const sealed = check.sealedDeps;
    const depPaths = Object.keys(sealed);
    if (!depPaths.length) {
      verdicts.push({ check_id: check.id, dep_changed: false, satisfied: false, reason: 'closure dipendenze non enumerabile — fail closed' });
      errors.push(`e2e ${check.id}: closure dipendenze non enumerabile — fail closed`);
      continue;
    }
    const current = input.currentDepHash?.(check.id) ?? null;
    if (current === null) {
      verdicts.push({ check_id: check.id, dep_changed: false, satisfied: false, reason: 'closure corrente non valutabile — fail closed' });
      errors.push(`e2e ${check.id}: closure corrente non valutabile — fail closed`);
      continue;
    }
    const touchedDeps = depPaths.filter((d) => changed.has(d) && current[d] !== sealed[d]);
    const depChanged = touchedDeps.length > 0;
    const curHash = sha256Text(JSON.stringify(current));
    const sealedHash = sha256Text(JSON.stringify(sealed));
    const runs = input.report.filter((r) => r.check_id === check.id);
    const realPass = runs.find((r) => r.status === 'passed');
    const failed = runs.find((r) => r.status === 'failed' || r.status === 'flake');

    if (depChanged) {
      /* Dipendenza modificata: serve una run REALE passata sulla closure
       * corrente — SKIPPED_CACHE non attesta nulla su codice cambiato. */
      if (failed) {
        verdicts.push({ check_id: check.id, dep_changed: true, satisfied: false, reason: `run fallita (${failed.status}) su closure modificata` });
        errors.push(`e2e ${check.id}: dipendenza modificata (${touchedDeps.join(', ')}) e run ${failed.status} — fail closed`);
      } else if (!realPass) {
        const onlyCache = runs.length === 0 || runs.every((r) => r.status === 'skipped_cache' || r.status === 'skipped');
        verdicts.push({
          check_id: check.id,
          dep_changed: true,
          satisfied: false,
          reason: onlyCache
            ? 'dipendenza modificata — cache invalidata, esecuzione reale richiesta (SKIPPED_CACHE non attesta)'
            : 'nessuna run passed sulla closure corrente',
        });
        errors.push(`e2e ${check.id}: dipendenza modificata senza run reale passed — SKIPPED_CACHE non soddisfa`);
      } else if (realPass.deps_hash !== undefined && realPass.deps_hash !== curHash) {
        verdicts.push({ check_id: check.id, dep_changed: true, satisfied: false, reason: 'run passed su closure diversa dall\'attuale — rieseguire' });
        errors.push(`e2e ${check.id}: run passed ma su dependency-hash stale — rieseguire sullo stato corrente`);
      } else {
        verdicts.push({ check_id: check.id, dep_changed: true, satisfied: true, reason: 'run reale passed sulla closure corrente' });
      }
    } else {
      /* Dipendenze invariate: la cache è valida — SKIPPED_CACHE legittimo. */
      if (failed) {
        verdicts.push({ check_id: check.id, dep_changed: false, satisfied: false, reason: `run ${failed.status} su closure invariata` });
        errors.push(`e2e ${check.id}: run ${failed.status} (dipendenze invariate, hash ${sealedHash.slice(0, 8)}→${curHash.slice(0, 8)})`);
      } else if (realPass || runs.some((r) => r.status === 'skipped_cache')) {
        verdicts.push({ check_id: check.id, dep_changed: false, satisfied: true, reason: realPass ? 'run passed' : 'cache hit (closure invariata)' });
      } else if (!runs.length) {
        verdicts.push({ check_id: check.id, dep_changed: false, satisfied: false, reason: 'nessuna run attestata e nessuna cache' });
        errors.push(`e2e ${check.id}: nessuna esecuzione né cache — check E2E senza attestazione`);
      } else {
        verdicts.push({ check_id: check.id, dep_changed: false, satisfied: false, reason: 'solo skipped/fixme — non passed né cache' });
        errors.push(`e2e ${check.id}: solo skipped/fixme nel report — non attesta la run`);
      }
    }
  }
  return { verdicts, errors };
}
