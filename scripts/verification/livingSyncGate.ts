/**
 * livingSyncGate — PLAN-054 T-005: Living Sync Gate su `BASE..WT`.
 *
 * Due pass (entrambi solo statici — nessuna esecuzione runtime dentro il
 * gate; i conteggi/stati dei test arrivano dal runner attestato
 * `test-results/inv-executed-counts.json` scritto sotto `SYNC_GATE=1`):
 *
 *  1. Pass Globale: `manifest.base_sha === sealed_base_sha` (dal
 *     `trusted.lock.json`); ratchet strutturale/asserzioni già coperti da
 *     `checkLivingContracts` (T-002/T-004) che resta il punto unico.
 *
 *  2. Pass Per-Componente: per ogni componente `C` il pass scatta quando
 *     il diff `BASE..WT` interseca `C.scope_files`, un file test che
 *     ospita un blocco `// INV:<id>` di `C` (o dei suoi CTR a 1-hop),
 *     oppure l'import-closure di quei blocchi. La classificazione:
 *       - **Auto-Neutral**: tutti i file toccati `.ts`/`.tsx` con emit
 *         esbuild-strip byte-identico a BASE, zero file non-JS, zero
 *         cambiamenti a blocchi INV/contratto;
 *       - **Mode A (bugfix)**: red-first `record` con
 *         `component`/`invariant`/`source_ref`, `source_ref` risolvibile
 *         a `BASE`;
 *       - **Mode B-add**: nuovo `INV` estraibile, oppure multiset
 *         asserzioni strettamente ampliato senza statement mutato né
 *         helper di closure toccati;
 *       - **Mode B-amend**: statement mutato, asserzioni/dataset/snapshot
 *         rimosse o indebolite, blocco non estraibile, helper di closure
 *         modificato, blocco mutato senza variazione di asserzioni →
 *         richiede `redfirst:retire --invariant <id> --reason "R-NNN: …"`
 *         con `R-NNN` presente a `BASE`; oltre `cap` (default 3) INV
 *         distinti per `BASE..WT` serve approvazione Director
 *         (`sync-amend-override` in `.mw/mapping-approvals.jsonl`);
 *       - **Mode C**: emit JS diverso senza cambiamenti a test/contratto
 *         → `isFullCoverage(C_at_BASE)`, zero token ad alto rischio nel
 *         diff emit, record in `.mw/neutral-claims.jsonl`.
 *
 *  executedCount: per ogni INV affetto dal diff `count(WT) ≥ count(BASE)`
 *  (snapshot sigillato `trusted.lock.json.executed_counts`); baseline
 *  `unknown` su INV affetto → cattura una tantum via callback (checkout
 *  al sigillo + run reale), fail-closed se non catturabile; INV nuovo →
 *  `not_applicable_new`. Status stabili: `enforced` /
 *  `not_applicable_new` / `not_applicable_unknown_baseline`.
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { scanInvBlocks, snapshotKeyDiff, type InvBlock } from './invBlocks';
import { loadCountEntries, resolveExecutedCount, scanWtInvBlocks, type InvCountEntry } from './invCounts';
import type { RedFirstRecord } from './redFirst';
import { loadRedFirst, retireAuthorizesInv } from './redFirst';
import {
  CONTRACTS_DIR_REL,
  isFullCoverageAtBase,
  parseContractFile,
  sourceRefExists,
  type ComponentContract,
  type IntegrationContract,
} from './contractSchema';
export const SYNC_AMEND_CAP_DEFAULT = 3;
export const NEUTRAL_CLAIMS_REL = '.mw/neutral-claims.jsonl';
export const AMEND_APPROVALS_REL = '.mw/mapping-approvals.jsonl';
const LOCK_REL = '.mw/trusted.lock.json';

export type ComponentMode = 'auto-neutral' | 'mode-a' | 'mode-b-add' | 'mode-b-amend' | 'mode-c';
export type ExecutedCountStatus = 'enforced' | 'not_applicable_new' | 'not_applicable_unknown_baseline';

/* ------------------------------------------------------------------ */
/* Pass Globale: manifest.base_sha === sealed_base                      */
/* ------------------------------------------------------------------ */

/**
 * `base_sha: "HEAD"` è l'alias accettato di «il sigillo corrente» (i
 * manifest storici lo usano). Qualunque SHA letterale diverso dalla
 * `sealed_base_sha` del lock fallisce — una riscrittura del manifest è
 * l'attacco che questo check chiude.
 */
export function checkManifestBaseSha(
  manifestBaseSha: string | undefined | null,
  sealedBaseSha: string | null,
  manifestFile = 'verification.json',
): string | null {
  if (manifestBaseSha === undefined || manifestBaseSha === null) return null;
  if (!sealedBaseSha) {
    return `${manifestFile}: base_sha dichiarato ma trusted.lock.json non sigilla alcun sealed_base — esegui npm run trusted:seal`;
  }
  if (manifestBaseSha !== sealedBaseSha && manifestBaseSha !== 'HEAD') {
    return `${manifestFile}: base_sha ${manifestBaseSha} ≠ sealed_base ${sealedBaseSha} — manifest riscritto o seal riallineato`;
  }
  return null;
}

/** Legge `sealed_base_sha` + `executed_counts` dal trusted lock (null se assente). */
export function readSyncSeal(repoRoot: string): {
  sealed_base_sha: string | null;
  executed_counts: Record<string, number | 'unknown'>;
} {
  const p = path.join(repoRoot, LOCK_REL);
  if (!existsSync(p)) return { sealed_base_sha: null, executed_counts: {} };
  try {
    const j = JSON.parse(readFileSync(p, 'utf8')) as {
      sealed_base_sha?: string;
      executed_counts?: Record<string, number | 'unknown'>;
    };
    return {
      sealed_base_sha: j.sealed_base_sha ?? null,
      executed_counts: j.executed_counts ?? {},
    };
  } catch {
    return { sealed_base_sha: null, executed_counts: {} };
  }
}

/* ------------------------------------------------------------------ */
/* Emit JS (Auto-Neutral / Mode C)                                      */
/* ------------------------------------------------------------------ */

/**
 * Emit JS del sorgente: `ts.transpileModule` con tipi e commenti rimossi
 * — stessa semantica dell'"esbuild strip" di artifact-r009 (emit JS
 * normalizzato), scelto perché esbuild non è caricabile sotto jsdom
 * (invariante TextEncoder/Uint8Array rotta in ambiente jsdom).
 */
export function emitStripped(text: string, isTsx: boolean): string {
  const { outputText } = ts.transpileModule(text, {
    compilerOptions: {
      removeComments: true,
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      jsx: isTsx ? ts.JsxEmit.ReactJSX : undefined,
    },
    reportDiagnostics: false,
  });
  return outputText.trim();
}

/** Righe nette cambiate tra due emit (per lo scan dei token ad alto rischio). */
export function emitChangedLines(baseEmit: string, wtEmit: string): { added: string[]; removed: string[] } {
  const b = new Set(baseEmit.split('\n').map((l) => l.trim()).filter(Boolean));
  const w = new Set(wtEmit.split('\n').map((l) => l.trim()).filter(Boolean));
  return {
    added: [...w].filter((l) => !b.has(l)),
    removed: [...b].filter((l) => !w.has(l)),
  };
}

/** Token ad alto rischio nel diff emit (Mode C rifiuta automaticamente). */
const HIGH_RISK_EMIT = [
  /data-testid/i,
  /data-hud-/i,
  /\.default\(/, // default Zod
  /\bexport\s+(const|function|class|interface|type)\s+\w+/,
];

export function highRiskEmitTokens(changed: { added: string[]; removed: string[] }): string[] {
  const hits: string[] = [];
  for (const line of [...changed.added, ...changed.removed]) {
    for (const re of HIGH_RISK_EMIT) {
      if (re.test(line)) hits.push(`${re.source} → ${line.slice(0, 100)}`);
    }
  }
  return hits;
}

/* ------------------------------------------------------------------ */
/* Import-closure di un file test (trigger set esteso)                  */
/* ------------------------------------------------------------------ */

const TEST_EXT = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx'];

function resolveSpec(repoRoot: string, fromFile: string, spec: string): string | null {
  let base: string | null = null;
  if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else if (spec.startsWith('@/')) base = path.join(repoRoot, 'src', spec.slice(2));
  else if (spec.startsWith('src/')) base = path.join(repoRoot, spec);
  else if (spec.startsWith('tests/')) base = path.join(repoRoot, spec);
  if (!base) return null;
  for (const cand of [base, ...TEST_EXT.map((e) => base + e), ...TEST_EXT.map((e) => path.join(base, `index${e}`))]) {
    if (existsSync(cand)) return cand;
  }
  return null;
}

/**
 * Chiusura transitiva degli import `from`/`import()` di un file,
 * limitata ai path dentro il repo (le import di package non contano —
 * sono coperte dalle versioni lockfile nella cache E2E).
 */
export function importClosure(repoRoot: string, file: string, maxNodes = 256): Set<string> {
  const out = new Set<string>();
  const queue = [file];
  const seen = new Set(queue);
  while (queue.length && out.size < maxNodes) {
    const cur = queue.shift()!;
    let text: string;
    try {
      text = readFileSync(cur, 'utf8');
    } catch {
      continue;
    }
    const sf = ts.createSourceFile(cur, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const specs: string[] = [];
    const visit = (n: ts.Node) => {
      if (
        (ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) &&
        n.moduleSpecifier &&
        ts.isStringLiteral(n.moduleSpecifier)
      ) {
        specs.push(n.moduleSpecifier.text);
      }
      if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const a = n.arguments[0];
        if (a && ts.isStringLiteral(a)) specs.push(a.text);
      }
      ts.forEachChild(n, visit);
    };
    visit(sf);
    for (const s of specs) {
      const r = resolveSpec(repoRoot, cur, s);
      if (r && !seen.has(r)) {
        seen.add(r);
        out.add(r);
        queue.push(r);
      }
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Approvazioni Director per il cap amend/retire                        */
/* ------------------------------------------------------------------ */

/** INV ids coperti da un record Director `sync-amend`/`sync-amend-override`. */
export function loadAmendApprovals(repoRoot: string): string[] {
  const p = path.join(repoRoot, AMEND_APPROVALS_REL);
  if (!existsSync(p)) return [];
  const out: string[] = [];
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (!line.trim().startsWith('{')) continue;
    try {
      const rec = JSON.parse(line) as { kind?: string; inv_ids?: string[]; inv?: string };
      if (rec.kind === 'sync-amend' || rec.kind === 'sync-amend-override') {
        for (const id of rec.inv_ids ?? []) out.push(id);
        if (rec.inv) out.push(rec.inv);
      }
    } catch {
      /* riga malformata: non fidata */
    }
  }
  return out;
}

/**
 * Cap amend/retire per `BASE..WT`: oltre `cap` INV distinti serve
 * approvazione Director che copra *tutti* gli INV amendati.
 */
export function enforceAmendCap(
  amendedInvs: string[],
  approvals: string[],
  cap = SYNC_AMEND_CAP_DEFAULT,
): string | null {
  const distinct = [...new Set(amendedInvs)];
  if (distinct.length <= cap) return null;
  const uncovered = distinct.filter((i) => !approvals.includes(i));
  if (!uncovered.length) return null;
  return (
    `sync-gate: ${distinct.length} amend/retire su BASE..WT > cap ${cap} — ` +
    `serve approvazione Director (sync-amend-override) per: ${uncovered.join(', ')}`
  );
}

/** `neutral-claims.jsonl`: componenti con claim Auto-Neutral/Mode C registrato. */
export function loadNeutralClaims(repoRoot: string): Set<string> {
  const p = path.join(repoRoot, NEUTRAL_CLAIMS_REL);
  const out = new Set<string>();
  if (!existsSync(p)) return out;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    if (!line.trim().startsWith('{')) continue;
    try {
      const rec = JSON.parse(line) as { component?: string };
      if (rec.component) out.add(rec.component);
    } catch {
      /* riga malformata: ignorata */
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Classificazione per-componente (nucleo puro, test-iniettabile)       */
/* ------------------------------------------------------------------ */

export interface ComponentSyncInput {
  component: ComponentContract;
  /** Diff `BASE..WT` (path relativi posix). */
  changed: Set<string>;
  /** Tutti gli INV dichiarati da C + dai CTR a 1-hop che includono C. */
  invIds: string[];
  /** INV dichiarati da C con `source: director-bug` aggiunti in `BASE..WT`. */
  newDirectorBugInvs: string[];
  baseInv: Map<string, InvBlock>;
  wtInv: Map<string, InvBlock>;
  /** statement canonico per INV a BASE e WT (da fingerprint contratto). */
  baseStatements: Map<string, string>;
  wtStatements: Map<string, string>;
  /** Il file contratto di C è nella diff. */
  contractChanged: boolean;
  /** Emit strip identico a BASE per TUTTI i file scope `.ts/.tsx` toccati. */
  emitIdentical: boolean;
  /** File non `.ts`/`.tsx` toccati dentro lo scope (css/json/asset) o rename. */
  touchedNonTs: boolean;
  /** Closure cumulativa dei file test che ospitano gli INV di C. */
  closureFiles: Set<string>;
  /**
   * Per INV id: file della sua import-closure toccati nel diff (helper
   * modificato del blocco specifico — non l'unione su tutto il
   * componente, per non forzare amend a INV di file non collegati).
   */
  closureTouchedByInv: Map<string, string[]>;
  /** Per INV id: chiavi `__snapshots__` keyed sul blocco rimosse/mutate. */
  snapshotChangedByInv: Map<string, string[]>;
  records: RedFirstRecord[];
  sourceRefAtBase: (ref: string) => boolean;
  /** `isFullCoverageAtBase` del contratto di C (null = non valutabile). */
  fullCoverageAtBase: boolean;
  neutralClaimed: boolean;
  emitDiff: { added: string[]; removed: string[] };
  /** `test_refs` di C eseguiti e passed nel report corrente (null = non attestato). */
  testRefsPassed: boolean | null;
}

export interface ComponentVerdict {
  component: string;
  triggered: boolean;
  triggeredBy: string[];
  modes: ComponentMode[];
  /** INV distinti con amend autorizzato (conta per il cap BASE..WT). */
  amendedInvs: string[];
  /** INV affetti dal diff (blockHash cambiato o host/closure toccata). */
  affectedInvs: string[];
  newInvs: string[];
  errors: string[];
}

const retireAuthorizes = retireAuthorizesInv;

/** Multiset ⊆ : asserzioni BASE coperte da WT (restituisce le mancanti). */
function missingAssertions(base: InvBlock, wt: InvBlock): string[] {
  const count = new Map<string, number>();
  for (const a of wt.assertions) count.set(a, (count.get(a) ?? 0) + 1);
  const missing: string[] = [];
  for (const a of base.assertions) {
    const n = count.get(a) ?? 0;
    if (n === 0) missing.push(a);
    else count.set(a, n - 1);
  }
  return missing;
}

export function evaluateComponentSync(input: ComponentSyncInput): ComponentVerdict {
  const c = input.component;
  const out: ComponentVerdict = {
    component: c.id,
    triggered: false,
    triggeredBy: [],
    modes: [],
    amendedInvs: [],
    affectedInvs: [],
    newInvs: [],
    errors: [],
  };
  const touchedScope = c.scope_files.filter((f) => input.changed.has(f));
  const hostFiles = new Map<string, string>();
  for (const id of input.invIds) {
    const b = input.wtInv.get(id) ?? input.baseInv.get(id);
    if (b) hostFiles.set(id, b.file);
  }
  const touchedHosts = [...new Set([...hostFiles.values()].filter((f) => input.changed.has(f)))];
  const touchedClosure = [...input.closureFiles].filter((f) => input.changed.has(f) && !c.scope_files.includes(f));
  out.triggeredBy = [...touchedScope, ...touchedHosts, ...touchedClosure.map((f) => `${f} (closure)`), ...(input.contractChanged ? [`${c.id}.md (contract)`] : [])];
  if (!out.triggeredBy.length) return out;
  out.triggered = true;

  const blocksChanged = new Set<string>();
  let authorizedAmend = false;

  /* ---- per-INV ---- */
  for (const id of input.invIds) {
    const base = input.baseInv.get(id);
    const wt = input.wtInv.get(id);
    if (!base && wt) {
      out.newInvs.push(id);
      if (!wt.extractable) out.errors.push(`${c.id} INV:${id} nuovo non estraibile — ${wt.notExtractableReason ?? 'nessun expect diretto'}`);
      if (wt.skipped) out.errors.push(`${c.id} INV:${id} nuovo marcato skip/todo/fixme — un INV deve essere eseguibile`);
      out.modes.push('mode-b-add');
      continue;
    }
    if (base && !wt) {
      /* INV rimosso o rinominato (es. edit del solo tag // INV:<id>):
       * il ratchet globale lo segnala già — qui si esige l'autorizzazione
       * di Mode B-amend perché il verdetto sia auto-contenuto. */
      out.affectedInvs.push(id);
      const auth = retireAuthorizes(input.records, id, base.file, input.sourceRefAtBase);
      if (auth.ok) {
        out.amendedInvs.push(id);
        out.modes.push('mode-b-amend');
      } else {
        out.errors.push(`${c.id} INV:${id} rimosso/rinominato senza redfirst:retire — ${auth.reason}`);
      }
      continue;
    }
    if (!base || !wt) continue;

    const blockChanged = base.blockHash !== wt.blockHash;
    if (blockChanged) blocksChanged.add(id);
    const invClosureTouched = input.closureTouchedByInv.get(id) ?? [];
    const affected = blockChanged || touchedHosts.includes(wt.file) || invClosureTouched.length > 0;
    if (affected) out.affectedInvs.push(id);

    const stmtChanged = (input.baseStatements.get(id) ?? null) !== (input.wtStatements.get(id) ?? null);
    const missing = missingAssertions(base, wt);
    const datasetChanged = base.datasetHash !== wt.datasetHash;
    const nonExtractable = !wt.extractable;
    const helperTouched = invClosureTouched.length > 0;
    const snapChanged = input.snapshotChangedByInv.get(id) ?? [];

    const needsAmend =
      stmtChanged || missing.length > 0 || datasetChanged || nonExtractable || helperTouched || snapChanged.length > 0;

    if (needsAmend) {
      const auth = retireAuthorizes(input.records, id, wt.file, input.sourceRefAtBase);
      if (!auth.ok) {
        const detail = stmtChanged
          ? `statement mutato`
          : nonExtractable
            ? `blocco non estraibile`
            : datasetChanged
              ? `dataset test.each mutato`
              : snapChanged.length
                ? `snapshot keyed rimosso/mutato (${snapChanged.join(', ')})`
                : helperTouched
                ? `helper di import-closure modificato (${invClosureTouched.join(', ')})`
                : `asserzioni BASE rimosse/indebolite: ${missing[0]?.slice(0, 80)}`;
        out.errors.push(`${c.id} INV:${id} — Mode B-amend non autorizzato: ${detail} — ${auth.reason}`);
      } else {
        authorizedAmend = true;
        out.amendedInvs.push(id);
        out.modes.push('mode-b-amend');
      }
    } else if (blockChanged) {
      /* Blocco mutato con asserzioni invariate e statement invariato:
       * ampliamento stretto del multiset → B-add; altrimenti (edit del
       * solo commento / reformat) → fallisce closed: non è né un add né
       * un amend autorizzato. */
      const strictlyEnlarged = wt.assertions.length > base.assertions.length;
      if (strictlyEnlarged) out.modes.push('mode-b-add');
      else
        out.errors.push(
          `${c.id} INV:${id} — blocco mutato senza variazione delle asserzioni né statement: ` +
            `amend non classificabile, serve redfirst:retire con R-NNN a BASE`,
        );
    }
  }

  /* ---- Mode A: bugfix con record red-first ---- */
  const bugRecords = input.records.filter((r) => r.component === c.id);
  const modeARecord = [...bugRecords].reverse().find((r) => r.kind === 'record');
  if (modeARecord || input.newDirectorBugInvs.length) {
    if (!modeARecord) {
      out.errors.push(
        `${c.id}: INV director-bug (${input.newDirectorBugInvs.join(', ')}) senza redfirst:record — ` +
          `Mode A richiede una run rossa registrata con --component ${c.id} --invariant <id> --source-ref`,
      );
    } else {
      if (!modeARecord.source_ref) {
        out.errors.push(`${c.id}: red-first record Mode A senza source_ref`);
      } else if (!input.sourceRefAtBase(modeARecord.source_ref)) {
        out.errors.push(
          `${c.id}: source_ref ${modeARecord.source_ref} non risolvibile a BASE — ` +
            `un R-NNN/intent-id creato dopo BASE è citabile solo via proposta sha256-approvata`,
        );
      }
      if (!modeARecord.exit_code) {
        out.errors.push(`${c.id}: record Mode A con exit_code ${modeARecord.exit_code ?? 'null'} — serve una riproduzione FALLITA`);
      }
      out.modes.push('mode-a');
    }
  }

  /* ---- Auto-Neutral / Mode C ---- */
  const invChanged = blocksChanged.size > 0 || out.newInvs.length > 0;
  const behaviorSurfaceChanged = touchedScope.length > 0 || input.touchedNonTs;
  if (behaviorSurfaceChanged && input.emitIdentical && !input.touchedNonTs && !invChanged && !input.contractChanged && !touchedClosure.length && !touchedHosts.length) {
    out.modes.push('auto-neutral');
  } else if (!input.emitIdentical && !invChanged && !input.contractChanged && !touchedHosts.length && !touchedClosure.length) {
    /* Emit JS diverso senza alcun cambiamento a test/contratto → Mode C. */
    out.modes.push('mode-c');
    if (!input.fullCoverageAtBase) {
      out.errors.push(`${c.id}: Mode C richiede isFullCoverage a BASE — contratto assente o coverage incompleta al sigillo`);
    }
    const hits = highRiskEmitTokens(input.emitDiff);
    if (hits.length) {
      out.errors.push(`${c.id}: Mode C — diff emit tocca token ad alto rischio: ${hits[0]}`);
    }
    if (!input.neutralClaimed) {
      out.errors.push(`${c.id}: Mode C richiede un record in ${NEUTRAL_CLAIMS_REL} (component "${c.id}")`);
    }
    if (input.testRefsPassed === false) {
      out.errors.push(`${c.id}: Mode C richiede tutti i test_refs passed — almeno un test non verde nel report`);
    } else if (input.testRefsPassed === null) {
      out.errors.push(`${c.id}: Mode C — esecuzione dei test_refs non attestata dal runner report`);
    }
  } else if (input.touchedNonTs && input.emitIdentical && !invChanged) {
    out.errors.push(`${c.id}: Auto-Neutral impossibile — file non-JS toccati (css/json/asset o rename)`);
  }

  void authorizedAmend;
  out.modes = [...new Set(out.modes)];
  return out;
}

/* ------------------------------------------------------------------ */
/* executedCount (T-005)                                                */
/* ------------------------------------------------------------------ */

export interface ExecutedCountVerdict {
  status: ExecutedCountStatus;
  base: number | 'unknown';
  wt: number | null;
  captured?: boolean;
  error?: string;
}

/**
 * Regola `executedCount(WT) ≥ executedCount(BASE)` per un INV affetto.
 * `baseCount === 'unknown'` → cattura una tantum via `capture` (fail
 * closed se non catturabile). INV nuovo → `not_applicable_new`.
 */
export function evaluateExecutedCount(opts: {
  id: string;
  affected: boolean;
  isNew: boolean;
  baseCount: number | 'unknown' | undefined;
  wtCount: number | null;
  capture?: (id: string) => number | null;
}): ExecutedCountVerdict {
  const { id, affected, isNew } = opts;
  if (isNew) {
    return { status: 'not_applicable_new', base: 'unknown', wt: opts.wtCount };
  }
  if (!affected) {
    return { status: 'not_applicable_unknown_baseline', base: opts.baseCount ?? 'unknown', wt: opts.wtCount };
  }
  let base = opts.baseCount;
  let captured = false;
  if (base === undefined || base === 'unknown') {
    const got = opts.capture?.(id) ?? null;
    if (got === null) {
      return {
        status: 'enforced',
        base: 'unknown',
        wt: opts.wtCount,
        captured: false,
        error: `INV:${id} affetto dal diff con executedCount(BASE) unknown e cattura baseline impossibile — fail closed (checkout al sigillo + run reale richiesti)`,
      };
    }
    base = got;
    captured = true;
  }
  if (opts.wtCount === null) {
    return {
      status: 'enforced',
      base,
      wt: null,
      captured,
      error: `INV:${id} affetto dal diff senza conteggio WT attestato — esegui i test INV sotto SYNC_GATE=1 (conteggio runner richiesto)`,
    };
  }
  if (opts.wtCount < base) {
    return {
      status: 'enforced',
      base,
      wt: opts.wtCount,
      captured,
      error: `INV:${id} executedCount regredito ${opts.wtCount} < ${base} (BASE) — expect reso irraggiungibile senza Mode B-amend autorizzato`,
    };
  }
  return { status: 'enforced', base, wt: opts.wtCount, captured };
}

/* ------------------------------------------------------------------ */
/* Report + orchestrazione repo                                         */
/* ------------------------------------------------------------------ */

export interface LivingSyncReport {
  sealed_base_sha: string | null;
  baseline: string;
  verdicts: ComponentVerdict[];
  executed_counts: Record<string, ExecutedCountVerdict>;
  baseline_captures: { inv: string; count: number }[];
  amended_invs_total: number;
  amend_cap: number;
  errors: string[];
  warnings: string[];
}

export interface LivingSyncOptions {
  baseline?: string;
  changedFiles?: string[];
  /** Manifests da validare sul base_sha (closure/produce). */
  manifests?: { file: string; base_sha?: string }[];
  counts?: InvCountEntry[];
  records?: RedFirstRecord[];
  /** Cattura baseline una tantum: default fail-closed (ritorna null). */
  captureBaseline?: (repoRoot: string, sha: string, file: string, titles: string[]) => number | null;
  emitIdenticalFor?: (rel: string, baseline: string) => boolean;
  cap?: number;
}

const TS_LIKE = /\.(ts|tsx|mts|cts)$/;
const NON_JS_FORBIDDEN = /\.(css|json|sass|scss|less|svg|png|jpg|webp|glsl|wgsl|vert|frag)$/;

export function checkLivingSync(repoRoot: string, opts: LivingSyncOptions = {}): LivingSyncReport {
  const seal = readSyncSeal(repoRoot);
  const baseline = opts.baseline ?? seal.sealed_base_sha ?? 'HEAD';
  const errors: string[] = [];
  const warnings: string[] = [];
  const report: LivingSyncReport = {
    sealed_base_sha: seal.sealed_base_sha,
    baseline,
    verdicts: [],
    executed_counts: {},
    baseline_captures: [],
    amended_invs_total: 0,
    amend_cap: opts.cap ?? SYNC_AMEND_CAP_DEFAULT,
    errors,
    warnings,
  };

  /* Pass Globale — manifest.base_sha vs sealed_base. */
  for (const m of opts.manifests ?? []) {
    const err = checkManifestBaseSha(m.base_sha, seal.sealed_base_sha, m.file);
    if (err) errors.push(err);
  }

  /* Contratti + scansione blocchi. */
  const contractFiles = listContractMd(repoRoot).filter((f) => !f.endsWith('INDEX.md'));
  const components = new Map<string, ComponentContract>();
  const integrations: IntegrationContract[] = [];
  const contractRelOf = new Map<string, string>();
  for (const rel of contractFiles) {
    const p = parseContractFile(rel, readFileSync(path.join(repoRoot, CONTRACTS_DIR_REL, rel), 'utf8'));
    if (!p.contract) continue;
    if (p.contract.kind === 'component') {
      components.set(p.contract.data.id, p.contract.data);
      contractRelOf.set(p.contract.data.id, rel);
    } else {
      integrations.push(p.contract.data);
    }
  }

  const changed = opts.changedFiles ?? defaultChanged(repoRoot, baseline);
  const changedSet = new Set(changed);

  const wtBlocks = new Map(scanWtInvBlocks(repoRoot).blocks.map((b) => [b.id, b]));
  const baseBlocks = new Map(scanBaseInvBlocks(repoRoot, baseline).map((b) => [b.id, b]));

  const records = opts.records ?? loadRedFirst(repoRoot);
  const entries = opts.counts ?? loadCountEntries(repoRoot);
  const neutralClaims = loadNeutralClaims(repoRoot);
  const amendApprovals = loadAmendApprovals(repoRoot);
  const sourceRefAtBase = (ref: string) => sourceRefExists(repoRoot, ref, baseline);

  const statementsOf = (c: ComponentContract) =>
    new Map(c.invariants.map((i) => [i.id, i.statement.replace(/\s+/g, ' ').trim()]));
  const baseStatementsOf = (contractRel: string): Map<string, string> => {
    const text = textAt(repoRoot, contractRel, baseline);
    if (!text) return new Map();
    const p = parseContractFile(contractRel, text);
    if (!p.contract) return new Map();
    return statementsOf(p.contract.data as ComponentContract);
  };

  /* Componente → tutti gli INV suoi + dei CTR che lo includono (1-hop). */
  const invIdsOf = (id: string): string[] => {
    const own = components.get(id)?.invariants.map((i) => i.id) ?? [];
    const hop = integrations.filter((ctr) => ctr.components.includes(id)).flatMap((ctr) => ctr.invariants.map((i) => i.id));
    return [...new Set([...own, ...hop])];
  };

  const allAmended = new Set<string>();
  for (const [id, c] of components) {
    const invIds = invIdsOf(id);
    /* Trigger set: scope + file host degli INV + closure degli host. */
    const hostFiles = new Set(
      invIds.map((i) => wtBlocks.get(i)?.file ?? baseBlocks.get(i)?.file).filter((f): f is string => !!f),
    );
    const closureFiles = new Set<string>();
    const closureOfHost = new Map<string, Set<string>>();
    for (const hf of hostFiles) {
      const cl = new Set<string>();
      for (const f of importClosure(repoRoot, path.isAbsolute(hf) ? hf : path.join(repoRoot, hf))) {
        cl.add(path.relative(repoRoot, f).split(path.sep).join('/'));
      }
      closureOfHost.set(hf, cl);
      for (const f of cl) closureFiles.add(f);
    }
    const closureTouchedByInv = new Map<string, string[]>();
    for (const i of invIds) {
      const hf = wtBlocks.get(i)?.file ?? baseBlocks.get(i)?.file;
      if (!hf) continue;
      const touched = [...(closureOfHost.get(hf) ?? new Set<string>())].filter(
        (f) => changedSet.has(f) && !c.scope_files.includes(f),
      );
      if (touched.length) closureTouchedByInv.set(i, touched);
    }
    /* Snapshot keyed sul blocco: `.snap` del file host nella diff →
     * `snapshotKeyDiff` per key (riordino puro = advisory, non segnala). */
    const snapshotChangedByInv = new Map<string, string[]>();
    for (const hf of hostFiles) {
      const snapRel = snapPathFor(hf);
      if (!snapRel || !changedSet.has(snapRel)) continue;
      const bSnap = textAt(repoRoot, snapRel, baseline);
      const wSnap = existsSync(path.join(repoRoot, snapRel))
        ? readFileSync(path.join(repoRoot, snapRel), 'utf8')
        : '';
      const diff = snapshotKeyDiff(bSnap ?? '', wSnap);
      if (!diff.removedOrChanged.length) continue;
      for (const i of invIds) {
        const b = wtBlocks.get(i) ?? baseBlocks.get(i);
        if (b?.file === hf && b.usesSnapshot) {
          snapshotChangedByInv.set(i, [...(snapshotChangedByInv.get(i) ?? []), ...diff.removedOrChanged]);
        }
      }
    }

    const touchedScope = c.scope_files.filter((f) => changedSet.has(f));
    const touchedNonTs = touchedScope.some((f) => NON_JS_FORBIDDEN.test(f) || !TS_LIKE.test(f));

    /* Emit diff cumulato dei file .ts/.tsx toccati. */
    let emitIdentical = true;
    const emitDiff = { added: [] as string[], removed: [] as string[] };
    for (const rel of touchedScope.filter((f) => TS_LIKE.test(f))) {
      const same =
        opts.emitIdenticalFor?.(rel, baseline) ??
        emitIdenticalAtBase(repoRoot, rel, baseline);
      if (!same) {
        emitIdentical = false;
        const bText = textAt(repoRoot, rel, baseline);
        const wText = readFileSync(path.join(repoRoot, rel), 'utf8');
        const d = emitChangedLines(
          bText ? emitStripped(bText, rel.endsWith('.tsx')) : '',
          emitStripped(wText, rel.endsWith('.tsx')),
        );
        emitDiff.added.push(...d.added);
        emitDiff.removed.push(...d.removed);
      }
    }

    /* Mode C: tutti i test_refs del contratto a BASE passed nel report. */
    const contractRel = `${CONTRACTS_DIR_REL}/${contractRelOf.get(id) ?? `components/${id}.md`}`;
    const full = isFullCoverageAtBase(repoRoot, contractRel, baseline);
    const baseText = textAt(repoRoot, contractRel, baseline);
    const baseParsed = baseText ? parseContractFile(contractRel, baseText) : null;
    const testRefs = new Set<string>();
    if (baseParsed?.contract) {
      for (const inv of baseParsed.contract.data.invariants) for (const t of inv.test_refs) testRefs.add(t);
    }
    let testRefsPassed: boolean | null = null;
    if (entries.length) {
      const rel = (f: string) => f.split('\\').join('/');
      const refEntries = entries.filter((e) => [...testRefs].some((t) => rel(e.file).endsWith(t) || t.endsWith(rel(e.file))));
      testRefsPassed = refEntries.length > 0 && refEntries.every((e) => e.status === 'passed');
    }

    /* Contratto assente a BASE → nessuno statement può essere "mutato":
     * si passa la mappa WT anche come base (evita il falso positivo di
     * T-005 sui contratti T-004 mai committati). */
    const baseStatements = baseText ? baseStatementsOf(contractRel) : statementsOf(c);
    const verdict = evaluateComponentSync({
      component: c,
      changed: changedSet,
      invIds,
      newDirectorBugInvs: baseText
        ? c.invariants.filter((i) => i.source === 'director-bug' && !baseStatements.has(i.id)).map((i) => i.id)
        : c.invariants.filter((i) => i.source === 'director-bug').map((i) => i.id),
      baseInv: baseBlocks,
      wtInv: wtBlocks,
      baseStatements,
      wtStatements: statementsOf(c),
      contractChanged: changedSet.has(contractRel),
      emitIdentical,
      touchedNonTs,
      closureFiles,
      closureTouchedByInv,
      snapshotChangedByInv,
      records,
      sourceRefAtBase,
      fullCoverageAtBase: full.full,
      neutralClaimed: neutralClaims.has(id),
      emitDiff,
      testRefsPassed,
    });
    report.verdicts.push(verdict);
    errors.push(...verdict.errors);
    for (const inv of verdict.amendedInvs) allAmended.add(inv);
  }

  /* Cap amend/retire per BASE..WT: oltre cap → approvazione Director su
   * TUTTI gli INV amendati (canale Director: mapping-approvals.jsonl). */
  report.amended_invs_total = allAmended.size;
  const capErr = enforceAmendCap([...allAmended], amendApprovals, report.amend_cap);
  if (capErr) errors.push(capErr);

  /* executedCount per ogni INV affetto da QUALUNQUE componente. */
  const affected = new Map<string, { isNew: boolean }>();
  for (const v of report.verdicts) {
    for (const id of v.affectedInvs) affected.set(id, { isNew: false });
    for (const id of v.newInvs) affected.set(id, { isNew: true });
  }
  for (const [id, info] of affected) {
    const block = wtBlocks.get(id);
    const wtCount = block ? resolveExecutedCount(block, entries) : null;
    const v = evaluateExecutedCount({
      id,
      affected: !info.isNew,
      isNew: info.isNew,
      baseCount: seal.executed_counts[id],
      wtCount,
      capture:
        opts.captureBaseline && block
          ? (invId) =>
              opts.captureBaseline!(repoRoot, baseline, block.file, block.testTitles)
          : undefined,
    });
    report.executed_counts[id] = v;
    if (v.captured) report.baseline_captures.push({ inv: id, count: v.base as number });
    if (v.error) errors.push(v.error);
  }

  return report;
}

/** `__snapshots__/<basename>.snap` del file test host (convenzione vitest). */
function snapPathFor(hostFile: string): string | null {
  if (!/\.(ts|tsx)$/.test(hostFile)) return null;
  const dir = path.posix.dirname(hostFile.split('\\').join('/'));
  const base = path.posix.basename(hostFile);
  return `${dir}/__snapshots__/${base}.snap`;
}

/** File `.md` di `.mw/contracts/` relativi alla dir contratti. */
function listContractMd(repoRoot: string, rel = ''): string[] {
  const dir = path.join(repoRoot, CONTRACTS_DIR_REL, rel);
  const out: string[] = [];
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const abs = path.join(dir, n);
    const r = rel ? `${rel}/${n}` : n;
    if (statSync(abs).isDirectory()) out.push(...listContractMd(repoRoot, r));
    else if (n.endsWith('.md')) out.push(r);
  }
  return out;
}

function defaultChanged(repoRoot: string, baseline: string): string[] {
  const tracked = execSync(`git diff --name-only ${baseline}`, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 32 * 1024 * 1024,
  }).split('\n').filter(Boolean);
  const untracked = execSync('git ls-files --others --exclude-standard', {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 32 * 1024 * 1024,
  }).split('\n').filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}

function textAt(repoRoot: string, rel: string, baseline: string): string | null {
  try {
    return execSync(`git show ${baseline}:${rel}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch {
    return null;
  }
}

function emitIdenticalAtBase(repoRoot: string, rel: string, baseline: string): boolean {
  const bText = textAt(repoRoot, rel, baseline);
  if (bText === null) return false; // file nuovo → emit "diverso"
  let wText: string;
  try {
    wText = readFileSync(path.join(repoRoot, rel), 'utf8');
  } catch {
    return false;
  }
  try {
    return emitStripped(bText, rel.endsWith('.tsx')) === emitStripped(wText, rel.endsWith('.tsx'));
  } catch {
    return false; // non compilabile → fail-closed verso Mode B/C
  }
}

/** Blocchi INV a BASE (git grep su tests/**). */
export function scanBaseInvBlocks(repoRoot: string, baseline: string): InvBlock[] {
  const files: { path: string; text: string }[] = [];
  try {
    const tagged = execSync(`git grep -l "INV:" ${baseline} -- "tests/**"`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 32 * 1024 * 1024,
    }).split('\n').filter(Boolean);
    for (const line of tagged) {
      /* `git grep -l <rev>` prefissa ogni path con `<rev>:` — va rimosso. */
      const rel = line.includes(':') ? line.slice(line.indexOf(':') + 1) : line;
      if (!/\.(ts|tsx)$/.test(rel) || rel.includes('__snapshots__')) continue;
      const text = textAt(repoRoot, rel, baseline);
      if (text) files.push({ path: rel, text });
    }
  } catch {
    /* nessun tag a BASE */
  }
  return scanInvBlocks(files).blocks;
}

/**
 * Cattura baseline reale per gli INV richiesti: worktree pulito allo SHA
 * sigillato + `vitest run` dei file host sotto SYNC_GATE=1; ritorna il
 * conteggio per INV o null se la cattura fallisce (fail-closed).
 */
export function captureBaselineCounts(
  repoRoot: string,
  sealedSha: string,
  blocks: InvBlock[],
  opts: { timeoutMs?: number } = {},
): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  const files = [...new Set(blocks.map((b) => b.file))];
  if (!files.length) return out;
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'inv-base-'));
  try {
    execSync(`git worktree add --detach ${tmp} ${sealedSha}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 60_000,
    });
    const countsPath = path.join(tmp, 'test-results', 'inv-executed-counts.json');
    mkdirSync(path.dirname(countsPath), { recursive: true });
    try {
      execFileSync(
        'npx',
        ['vitest', 'run', ...files, '--reporter=json'],
        {
          cwd: tmp,
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: opts.timeoutMs ?? 120_000,
          env: { ...process.env, SYNC_GATE: '1', INV_COUNTS_FILE: countsPath },
        },
      );
    } catch {
      /* vitest rosso sulla baseline: il counts file può comunque esistere */
    }
    if (!existsSync(countsPath)) {
      for (const b of blocks) out[b.id] = null;
      return out;
    }
    const entries = (JSON.parse(readFileSync(countsPath, 'utf8')) as { entries?: InvCountEntry[] }).entries ?? [];
    for (const b of blocks) out[b.id] = resolveExecutedCount(b, entries);
    return out;
  } catch {
    for (const b of blocks) out[b.id] = null;
    return out;
  } finally {
    try {
      execSync(`git worktree remove --force ${tmp}`, {
        cwd: repoRoot,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
}
