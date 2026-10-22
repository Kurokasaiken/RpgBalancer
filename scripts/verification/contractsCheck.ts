/**
 * contracts:check — gate fail-closed file→superficie (PLAN-044 T-002 / S1a).
 *
 * Port nativo TS di `mind-weaver/scripts/contracts-check.py`, ma dove quello
 * era consultivo questo è un gate: un file toccato senza superficie mappata
 * richiede una disposition esplicita (mappatura via `mapping-proposal`
 * approvato, o `coverage_exception` auditabile) — rosso senza (v32 pt. 3).
 *
 * Verifiche:
 *  - ogni changed file (git diff HEAD + untracked) ha ≥1 superficie mappata
 *    o una coverage_exception che lo copre;
 *  - la diff di `.mw/surface-map.json` vs HEAD ⊆ batch di proposte approvate
 *    (sha256 del file di batch ∈ mapping-approvals.jsonl — modifiche
 *    post-approvazione non attive);
 *  - anti-glob: entry >K file o glob su root senza `anti_glob_confirmed`.
 *
 * Mis-mapping = rischio residuo documentato, non gateabile in v1 (seed S5).
 */
import { execFileSync, execSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalFileHash, sha256File, sha256Text } from './gateCore';
import { checkLivingContracts, livingContractsActive } from './contractSchema';
import { checkOrSyncIndex } from './contractsIndexSync';
import { checkLivingSync } from './livingSyncGate';
import {
  APPROVALS_REL,
  DIRECTOR_ANSWERS_REL,
  EXCEPTIONS_REL,
  PROPOSALS_DIR_REL,
  SURFACE_MAP_REL,
  approvedKeys,
  checkAntiGlob,
  diffSurfaceMaps,
  functionalKey,
  globMatch,
  loadSurfaceMap,
  parseSurfaceMap,
  surfaceFor,
  type MappingProposal,
  type SurfaceMap,
} from './surfaceMap';

/** Artefatti prodotti dal circuito gate stesso: verificati per contenuto, non per superficie. */
const EXEMPT_PATTERNS = [
  /^\.mw\/runs\//,
  /^test-results\//,
  /^\.mw\/mapping-proposals\//,
  /^\.mw\/mapping-approvals\.jsonl$/,
  /^\.mw\/coverage-exceptions\.jsonl$/,
  /^\.mw\/director-answers\.jsonl$/,
  /^\.mw\/red-first\.jsonl$/,
  /^\.mw\/red-first\//,
];

/**
 * File che implementano il gate BV (PLAN-044 T-003): quando sono nella
 * diff, la loro valutazione è delegata alla versione gate committata a
 * HEAD — il gate non giudica se stesso, niente bootstrap-loop. Se il
 * gate non esiste a HEAD (introduzione in corso), ogni gate-file
 * modificato richiede un `director_answer` kind 'gate-diff'.
 * `.mw/surface-map.json` NON è qui: ha già il suo meccanismo
 * (mapping-proposal approvato) ed è dato, non macchina.
 */
export const GATE_FILES = [
  'scripts/verification/gateCore.ts',
  'scripts/verification/surfaceMap.ts',
  'scripts/verification/contractsCheck.ts',
  'scripts/verification/produceBundle.ts',
  'scripts/contractsCheck.ts',
  'scripts/mappingProposal.ts',
  'scripts/coverageException.ts',
  'scripts/directorAnswer.ts',
  'scripts/agentsLint.ts',
  'scripts/closureLint.ts',
  'scripts/verification/redFirst.ts',
  'scripts/redFirst.ts',
  'scripts/verification/verifierReceipt.ts',
  'scripts/verification/bvMetrics.ts',
  'scripts/verification/visualForkGate.ts',
  'scripts/verification/intentRegistry.ts',
  'scripts/verification/mwDirectorAnswer.ts',
  'scripts/verification/intentGate.ts',
  'scripts/verification/contractSchema.ts',
  'scripts/verification/invBlocks.ts',
  'scripts/verification/componentInventory.ts',
  'scripts/verification/contractsIndexSync.ts',
  'scripts/verification/livingSyncGate.ts',
  'scripts/verification/invCounts.ts',
  'scripts/verification/e2eCache.ts',
  'scripts/verification/syncBug.ts',
];

export function isExemptFile(rel: string): boolean {
  return EXEMPT_PATTERNS.some((re) => re.test(rel));
}

function git(repoRoot: string, args: string): string {
  return execSync(`git ${args}`, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
}

/** Changed file vs baseline HEAD: tracked modificati + untracked non ignorati. */
export function gitChangedFiles(repoRoot: string, baseline = 'HEAD'): string[] {
  const tracked = git(repoRoot, `diff --name-only ${baseline}`)
    .split('\n')
    .filter(Boolean);
  const untracked = git(repoRoot, 'ls-files --others --exclude-standard')
    .split('\n')
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}

/** Inventario file del repo (per anti-glob). */
export function gitAllFiles(repoRoot: string): string[] {
  const tracked = git(repoRoot, 'ls-files').split('\n').filter(Boolean);
  const untracked = git(repoRoot, 'ls-files --others --exclude-standard')
    .split('\n')
    .filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}

/** Baseline della mappa a HEAD (null se il file non esisteva). */
export function baselineSurfaceMap(repoRoot: string): SurfaceMap | null {
  try {
    const text = execSync(`git show HEAD:${SURFACE_MAP_REL}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    });
    return parseSurfaceMap(text);
  } catch {
    return null;
  }
}

export interface CoverageException {
  /** Presente sui record v2 (T-003); record legacy senza id = non-behavioral. */
  id?: string;
  glob: string;
  reason: string;
  scope?: string;
  /** true → il file coperto ha comportamento non verificato: awaiting_director. */
  unverified_behavior?: boolean;
  created_at: string;
  created_by?: string;
}

/** sha256 del record eccezione sui campi funzionali (file+reason+scope+flag). */
export function exceptionRecordHash(e: CoverageException): string {
  return sha256Text(
    JSON.stringify({
      id: e.id ?? null,
      glob: e.glob,
      reason: e.reason,
      scope: e.scope ?? null,
      unverified_behavior: e.unverified_behavior === true,
    }),
  );
}

export function loadExceptions(repoRoot: string): CoverageException[] {
  const p = path.join(repoRoot, EXCEPTIONS_REL);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split('\n')
    .filter((l) => l.trim().startsWith('{'))
    .map((l) => {
      const e = JSON.parse(l) as CoverageException & { path?: string };
      // Record scritti a mano o da tool esterni possono usare `path` al posto
      // di `glob` — normalizzare, un record malformato non deve crashare il gate.
      if (!e.glob && e.path) e.glob = e.path;
      return e;
    });
}

/** sha256 dei batch approvati dal Director. */
export function loadApprovals(repoRoot: string): Set<string> {
  const p = path.join(repoRoot, APPROVALS_REL);
  const set = new Set<string>();
  if (!existsSync(p)) return set;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (!line.trim().startsWith('{')) continue;
    const rec = JSON.parse(line) as { batch_sha256?: string };
    if (rec.batch_sha256) set.add(rec.batch_sha256);
  }
  return set;
}

/**
 * Chiavi funzionali approvate: solo i proposal-file il cui sha256 è nel
 * journal delle approvazioni. Un batch editato dopo l'approvazione cambia
 * hash → esce dall'insieme → non attivo.
 */
export function loadApprovedKeys(repoRoot: string): {
  entries: Set<string>;
  removed: Set<string>;
} {
  const approvals = loadApprovals(repoRoot);
  const dir = path.join(repoRoot, PROPOSALS_DIR_REL);
  const entries = new Set<string>();
  const removed = new Set<string>();
  if (!existsSync(dir)) return { entries, removed };
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    const full = path.join(dir, name);
    const sha = sha256File(full);
    if (!sha || !approvals.has(sha)) continue;
    const proposal = JSON.parse(readFileSync(full, 'utf8')) as MappingProposal;
    const keys = approvedKeys(proposal);
    keys.entries.forEach((k) => entries.add(k));
    keys.removed.forEach((k) => removed.add(k));
  }
  return { entries, removed };
}

/**
 * `director_answer` (PLAN-044 T-003): boundary PROCEDURALE — journal
 * append-only + shortcut dedicato, non prova crittografica di authorship
 * (signing = v2). Due tipi:
 *  - coverage_exception: lega exception_id + hash del record eccezione +
 *    canonical content hash di ogni file coperto al momento della risposta;
 *  - gate-diff: lega i gate-file modificati + canonical hash (usato quando
 *    il gate non è valutabile dalla versione committata — bootstrap).
 */
export interface DirectorAnswer {
  kind: 'coverage_exception' | 'gate-diff';
  exception_id?: string;
  exception_record_sha256?: string;
  covered?: { file: string; sha256_canonical: string | null }[];
  gate_files?: { file: string; sha256_canonical: string | null }[];
  answer: string;
  answered_at: string;
  answered_by: string;
  source: string;
}

export function loadAnswers(repoRoot: string): DirectorAnswer[] {
  const p = path.join(repoRoot, DIRECTOR_ANSWERS_REL);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split('\n')
    .filter((l) => l.trim().startsWith('{'))
    .map((l) => JSON.parse(l) as DirectorAnswer);
}

/** Ultima risposta del journal per una chiave (append-only: vince l'ultima). */
function lastAnswer(
  answers: DirectorAnswer[],
  pred: (a: DirectorAnswer) => boolean,
): DirectorAnswer | undefined {
  for (let i = answers.length - 1; i >= 0; i--) {
    if (pred(answers[i])) return answers[i];
  }
  return undefined;
}

/** Percorso del binario tsx dell'installazione corrente (null se irrisolvibile). */
function resolveTsxCli(): string | null {
  const rel = path.join('node_modules', 'tsx', 'dist', 'cli.mjs');
  try {
    if (import.meta.url.startsWith('file://')) {
      const p = fileURLToPath(new URL(`../../${rel.replace(/\\/g, '/')}`, import.meta.url));
      if (existsSync(p)) return p;
    }
  } catch {
    // import.meta.url non file-scheme (vitest/vite-node) → fallback walk-up
  }
  let dir = process.cwd();
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, rel);
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function headFile(repoRoot: string, rel: string): string | null {
  try {
    return execSync(`git show HEAD:${rel}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

/**
 * Riesegue il check con il gate committato a HEAD (PLAN-044 T-003):
 * materializza `scripts/**` a HEAD in una temp dir + un runner che chiama
 * `checkContractsGate(repoRoot)` e stampa il report in JSON. Ritorna null
 * se il gate non esiste/è ineseguibile a HEAD (→ bootstrap director_answer).
 */
export function runCommittedGate(repoRoot: string): ContractsReport | null {
  let scriptsListing: string[];
  try {
    scriptsListing = execSync('git ls-tree -r HEAD --name-only scripts/', {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    }).split('\n').filter(Boolean);
  } catch {
    return null;
  }
  if (!scriptsListing.includes('scripts/verification/contractsCheck.ts')) return null;

  const tmp = mkdtempSync(path.join(os.tmpdir(), 'head-gate-'));
  try {
    // Il repo è "type": "module": senza questo file i .ts materializzati
    // verrebbero caricati come CJS e gli import ESM fallirebbero.
    writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
    for (const rel of scriptsListing) {
      const content = headFile(repoRoot, rel);
      if (content === null) continue;
      const dest = path.join(tmp, rel);
      mkdirSync(path.dirname(dest), { recursive: true });
      writeFileSync(dest, content);
    }
    const runner = path.join(tmp, 'headGateRunner.mts');
    writeFileSync(
      runner,
      "import * as cc from './scripts/verification/contractsCheck';\n" +
        '// Il runner È il gate committato: svuotare GATE_FILES impedisce la\n' +
        '// ri-delegazione — il figlio valuta lo stesso diff e vedrebbe gli\n' +
        '// stessi gate-file → ricorsione infinita di runner tsx (hang).\n' +
        '// Namespace import + guard: il gate a HEAD può non esportare GATE_FILES.\n' +
        'const gf = (cc as { GATE_FILES?: string[] }).GATE_FILES;\n' +
        'if (Array.isArray(gf)) gf.length = 0;\n' +
        'const rep = cc.checkContractsGate(process.env.REPO_ROOT as string);\n' +
        'process.stdout.write(JSON.stringify(rep));\n',
    );
    // tsx è risolto dalla posizione del gate in esecuzione (questo file /
    // il repo da cui gira), non da repoRoot: così il runner funziona anche
    // su repo esterni/test. import.meta.url non è affidabile sotto vitest
    // (scheme non-file) → fallback: walk-up da cwd cercando node_modules.
    const tsxCli = resolveTsxCli();
    if (!tsxCli) return null;
    // stdio su file, non pipe: al timeout il figlio tsx muore ma un
    // grandchild (esbuild service) può sopravvivere tenendo la pipe aperta
    // e bloccare execFileSync su EOF — visto sotto carico sessione parallela
    // (hang >20min). Con stdio→file la morte del figlio chiude l'attesa.
    const outPath = path.join(tmp, 'runner-out.json');
    const errPath = path.join(tmp, 'runner-err.log');
    const outFd = openSync(outPath, 'w');
    const errFd = openSync(errPath, 'w');
    try {
      execFileSync(process.execPath, [tsxCli, runner], {
        env: { ...process.env, REPO_ROOT: repoRoot },
        stdio: ['ignore', outFd, errFd],
        timeout: 150_000,
      });
    } finally {
      closeSync(outFd);
      closeSync(errFd);
    }
    const rep = JSON.parse(readFileSync(outPath, 'utf8')) as ContractsReport;
    rep.evaluated_by = 'head-gate';
    return rep;
  } catch (e) {
    if (process.env.CC_GATE_DEBUG) {
      const err = e as { message?: string; stderr?: string; stdout?: string };
      process.stderr.write(
        `runCommittedGate fallita: ${err.message}\nstderr: ${String(err.stderr ?? '').slice(0, 2000)}\n`,
      );
    }
    return null;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export interface ContractsReport {
  changed_files: string[];
  exempt_files: string[];
  mapped: { file: string; surfaces: string[] }[];
  dispositioned: { file: string; via: string }[];
  unmapped: string[];
  required_checks: string[];
  /** Gate-file nella diff valutati dal gate committato o via director_answer. */
  gate_files?: { file: string; via: 'head-gate' | 'director_answer' | 'unanswered' }[];
  /** Sintesi del sotto-gate PLAN-054 (contratti vivi). */
  living_contracts?: {
    contracts_loaded: number;
    inv_blocks: number;
    kernels_shared_without_ctr: number;
    warnings: string[];
  };
  /** Sintesi del Living Sync Gate su BASE..WT (PLAN-054 T-005). */
  living_sync?: {
    triggered: number;
    modes: Record<string, string[]>;
    amended_invs: number;
    executed_counts_enforced: number;
  };
  evaluated_by?: 'working-tree' | 'head-gate';
  errors: string[];
}

export function checkContractsGate(
  repoRoot: string,
  opts: { changedFiles?: string[] } = {},
): ContractsReport {
  const errors: string[] = [];
  const report: ContractsReport = {
    changed_files: [],
    exempt_files: [],
    mapped: [],
    dispositioned: [],
    unmapped: [],
    required_checks: [],
    errors,
  };

  let changed: string[];
  try {
    changed = opts.changedFiles ?? gitChangedFiles(repoRoot);
  } catch (e) {
    errors.push(`baseline git non valutabile: ${(e as Error).message}`);
    return report;
  }
  report.changed_files = changed;

  // Gate-file diffs (T-003): valutati dalla versione gate committata a
  // HEAD — il gate non giudica se stesso, niente bootstrap-loop. Se il
  // gate non esiste a HEAD (introduzione in corso) → bootstrap: ogni
  // gate-file modificato richiede un director_answer kind 'gate-diff'.
  const gateDiff = changed.filter((f) => GATE_FILES.includes(f));
  let gateBootstrap = false;
  if (gateDiff.length > 0) {
    const delegated = runCommittedGate(repoRoot);
    if (delegated) {
      delegated.gate_files = gateDiff.map((f) => ({ file: f, via: 'head-gate' as const }));
      return delegated;
    }
    gateBootstrap = true;
    report.gate_files = [];
  }

  const map = loadSurfaceMap(repoRoot);
  if (!map) {
    errors.push(`${SURFACE_MAP_REL} assente o malformato — mappa file→superficie richiesta (fail-closed)`);
    return report;
  }

  // Anti-glob: entry troppo larghe senza conferma esplicita.
  try {
    const allFiles = gitAllFiles(repoRoot);
    for (const issue of checkAntiGlob(map, allFiles)) {
      errors.push(`anti-glob ${issue.surface_id}: ${issue.reason}`);
    }
  } catch (e) {
    errors.push(`inventario file per anti-glob non valutabile: ${(e as Error).message}`);
  }

  // Diff mappa ⊆ batch approvati (hardening dibattito).
  const baseline = baselineSurfaceMap(repoRoot);
  const diff = diffSurfaceMaps(baseline, map);
  if (diff.added.length || diff.changed.length || diff.removedIds.length) {
    const approved = loadApprovedKeys(repoRoot);
    for (const s of [...diff.added, ...diff.changed]) {
      if (!approved.entries.has(functionalKey(s))) {
        errors.push(
          `surface-map: entry "${s.id}" aggiunta/modificata senza batch approvato — crea mapping-proposal e fai approvare lo sha256 dal Director`,
        );
      }
    }
    for (const id of diff.removedIds) {
      if (!approved.removed.has(id)) {
        errors.push(`surface-map: superficie "${id}" rimossa senza batch approvato`);
      }
    }
  }

  // Bootstrap gate-diff (T-003): il gate non è valutabile dalla versione
  // committata → ogni gate-file modificato richiede director_answer
  // kind 'gate-diff' legato al canonical hash corrente.
  const answers = loadAnswers(repoRoot);
  if (gateBootstrap) {
    for (const f of gateDiff) {
      const ans = lastAnswer(
        answers,
        (a) => a.kind === 'gate-diff' && (a.gate_files ?? []).some((g) => g.file === f),
      );
      const bound = ans?.gate_files?.find((g) => g.file === f);
      const sha = canonicalFileHash(path.join(repoRoot, f));
      if (!bound) {
        errors.push(
          `gate-file "${f}" modificato e gate non valutabile a HEAD — serve director_answer (npm run director:answer -- --gate-diff)`,
        );
        report.gate_files!.push({ file: f, via: 'unanswered' });
      } else if (bound.sha256_canonical !== sha) {
        errors.push(
          `gate-file "${f}" modificato dopo il director_answer — ri-approvazione richiesta`,
        );
        report.gate_files!.push({ file: f, via: 'unanswered' });
      } else {
        report.gate_files!.push({ file: f, via: 'director_answer' });
      }
    }
  }

  /**
   * awaiting_director su una coverage_exception con unverified_behavior:
   * null = coperto; stringa = errore da registrare. Il director_answer
   * lega l'hash del record eccezione e il canonical hash del file coperto
   * al momento dell'approvazione (modifica sostanziale → ri-approvazione).
   */
  const checkAwaitingDirector = (exc: CoverageException, file: string): string | null => {
    const ans = lastAnswer(
      answers,
      (a) => a.kind === 'coverage_exception' && a.exception_id === exc.id,
    );
    if (!exc.id || !ans) {
      return `${file}: awaiting_director — coverage_exception su comportamento non verificato senza director_answer (${exc.id ?? 'record senza id — rigenera con coverage:exception'})`;
    }
    if (ans.exception_record_sha256 !== exceptionRecordHash(exc)) {
      return `${file}: awaiting_director — record eccezione ${exc.id} modificato dopo il director_answer — ri-approvazione richiesta`;
    }
    const covered = ans.covered?.find((c) => c.file === file);
    if (!covered) {
      return `${file}: awaiting_director — non coperto dal director_answer di ${exc.id} (scope drift) — ri-approvazione richiesta`;
    }
    const sha = canonicalFileHash(path.join(repoRoot, file));
    if (sha === null) return null; // file rimosso: niente comportamento residuo
    if (covered.sha256_canonical !== sha) {
      return `${file}: awaiting_director — file coperto da ${exc.id} modificato post-approvazione — ri-approvazione richiesta`;
    }
    return null;
  };

  // Classificazione changed file.
  const exceptions = loadExceptions(repoRoot);
  const required = new Set<string>();
  for (const f of changed) {
    if (isExemptFile(f)) {
      report.exempt_files.push(f);
      continue;
    }
    const surfaces = map ? surfaceFor(f, map) : [];
    if (surfaces.length > 0) {
      report.mapped.push({ file: f, surfaces: surfaces.map((s) => s.id) });
      surfaces.forEach((s) => s.expected_checks.forEach((c) => required.add(c)));
      continue;
    }
    const exc = exceptions.find((e) => typeof e.glob === 'string' && globMatch(e.glob, f));
    if (exc) {
      if (exc.unverified_behavior === true) {
        const err = checkAwaitingDirector(exc, f);
        if (err) errors.push(err);
        else report.dispositioned.push({ file: f, via: `director_answer (${exc.id})` });
      } else {
        report.dispositioned.push({ file: f, via: `coverage_exception (${exc.reason})` });
      }
    } else {
      report.unmapped.push(f);
      errors.push(
        `${f}: file toccato senza superficie mappata — serve mapping-proposal approvato o coverage_exception (v32 pt. 3)`,
      );
    }
  }

  // PLAN-054 T-002 — living contracts: schema, partizione STRICT_FILES,
  // CTR↔componenti, ratchet strutturale/asserzioni // INV:<id> su BASE.
  // Eseguito a ogni check, anche su diff di soli test (ratchet globale).
  try {
    const lc = checkLivingContracts(repoRoot);
    errors.push(...lc.errors);
    report.living_contracts = {
      contracts_loaded: lc.contracts_loaded,
      inv_blocks: lc.inv_blocks.total,
      kernels_shared_without_ctr: lc.kernels_shared_without_ctr.length,
      warnings: lc.warnings,
    };
    /* T-004: la sezione generata del master index deve essere a drift
     * zero — solo quando il sistema contratti vivi è attivo. */
    if (livingContractsActive(repoRoot)) {
      const idx = checkOrSyncIndex(repoRoot, false);
      errors.push(...idx.errors);
      if (idx.drift) {
        errors.push(
          `src/docs/docs/idle_village/COMPONENT_MASTER_INDEX.md: sezione PLAN-054 non sincronizzata — esegui npm run contracts:index-sync`,
        );
      }
      /* T-005: Living Sync Gate su BASE..WT — classificazione
       * Auto-Neutral/Mode A/B/C + cap amend + executedCount su INV
       * affetti. Statico: i test mirati li esegue il runner del bundle /
       * la run SYNC_GATE=1; qui si leggono le attestazioni. */
      const sync = checkLivingSync(repoRoot, { changedFiles: changed });
      errors.push(...sync.errors);
      report.living_sync = {
        triggered: sync.verdicts.filter((v) => v.triggered).length,
        modes: Object.fromEntries(
          sync.verdicts.filter((v) => v.modes.length).map((v) => [v.component, v.modes]),
        ),
        amended_invs: sync.amended_invs_total,
        executed_counts_enforced: Object.values(sync.executed_counts).filter((c) => c.status === 'enforced').length,
      };
    }
  } catch (e) {
    errors.push(`living-contracts check non eseguito: ${(e as Error).message}`);
  }

  report.required_checks = [...required].sort();
  report.evaluated_by = 'working-tree';
  return report;
}
