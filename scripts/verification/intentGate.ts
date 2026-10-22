/**
 * intentGate — gate di chiusura del regime intent (PLAN-045 T-005b, P5).
 *
 * Attivato da `intent_gate: true` nel manifest del task: `verify:bundle`
 * e `closure:lint` richiedono che `.mw/runs/<task>/intent.json` esista e
 * abbia status ∈ {PASS, WAIVED, SKIPPED_TRIVIAL}.
 *
 * Controlli (tabella esiti P5):
 *  - ROSSO (integrità): intent.json assente/malformato, ledger_sha256 ≠
 *    sha256(intent.md), epoch non monotoni, epoch N+1 senza
 *    rebaptism_answer, ledger non parsabile, `not-applicable` riattivato
 *    (scope_surfaces ∩ surface(changed_files) ≠ ∅), required del seed
 *    non ⊆ manifest_closure, director_answer citato senza firma valida
 *    o senza provenance journal (→ unconfirmed), RICHIESTE.md non
 *    append-only vs git.
 *  - Non terminale: item pending/awaiting/quorum-short/open → la
 *    chiusura non è ammessa finché non sono disposizionati.
 *  - Re-seal: variazione di changed_files gestita a monte dal reseal
 *    meccanico (intent_json.py); qui conta solo lo stato letto.
 *
 * item_state table totale (default-deny) — specchio di
 * mind-weaver/scripts/verification/intent_json.py: tenere in sync.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  hasValidProvenance,
  loadInvocations,
  resolveHmacKey,
  verifyAnswerSignature,
  type IntentAnswer,
} from './intentRegistry';
import { loadSurfaceMap, surfaceFor } from './surfaceMap';

// ---------------------------------------------------------------- types

export interface IntentGateReport {
  ok: boolean;
  status: string;
  errors: string[];
  warnings: string[];
}

interface IntentItem {
  verdict?: string;
  disposition?: string;
  class?: string;
  plan_waived?: boolean;
  scope_surfaces?: string[];
  director_answer?: string;
}

interface IntentJson {
  task_id?: string;
  run_id?: string;
  epoch?: number;
  ledger_sha256?: string;
  manifest_closure?: Array<[string, string, string]>;
  /** Commit di battesimo — baseline per la verifica append-only di
   *  RICHIESTE.md (P2). Legato nel record al seed; senza baseline il
   *  check è solo un warning (ancora non esiste un punto di ancoraggio). */
  richeste_baseline_commit?: string;
  items?: Record<string, IntentItem>;
}

const SATISFYING = new Set([
  'covered', 'waived', 'waived-infra', 'not-applicable', 'signoff', 'skipped-trivial',
]);
const BLOCKING = new Set([
  'gap', 'unverifiable', 'verdict-unverifiable', 'class-dispute', 'unconfirmed',
  'cap-exhausted', 'integrity-cap-exhausted', 'global-ceiling-exhausted',
  'ambiguous', 'illegitimate',
]);
const NON_TERMINAL = new Set([
  'human-eye-pending-signoff', 'pending', 'awaiting', 'awaiting_director',
  'quorum-short', 'contested', 'open',
]);

// ------------------------------------------------------------- item state

/**
 * Tabella item_state totale (P5): 'satisfies' | 'blocks' | 'non-terminal'.
 * Default-deny su stati sconosciuti. `contested` conta verso gap, mai
 * covered. `open` (incl. plan_waived) resta attivo fino a `covered`.
 */
export function itemState(
  rec: IntentItem,
  opts: { hasValidSignoff?: boolean; reactivated?: boolean } = {},
): 'satisfies' | 'blocks' | 'non-terminal' {
  const state = rec.verdict ?? rec.disposition;
  if (state === 'human-eye') {
    return opts.hasValidSignoff ? 'satisfies' : 'non-terminal';
  }
  if (state === 'not-applicable') {
    return opts.reactivated ? 'blocks' : 'satisfies';
  }
  if (state === 'contested') return 'blocks';
  if (state && SATISFYING.has(state)) return 'satisfies';
  if (state && BLOCKING.has(state)) return 'blocks';
  if (state && NON_TERMINAL.has(state)) return 'non-terminal';
  return 'blocks';
}

function closureStatus(states: string[], anyWaived: boolean): string {
  if (states.some((s) => s === 'blocks')) return 'BLOCKED';
  if (states.some((s) => s === 'non-terminal')) return 'NOT_CLOSABLE';
  if (states.length > 0 && states.every((s) => s === 'satisfies') === false) return 'NOT_CLOSABLE';
  if (anyWaived) return 'WAIVED';
  return 'PASS';
}

// ----------------------------------------------------------- ledger read

function sha256FileText(p: string): string {
  return createHash('sha256').update(readFileSync(p, 'utf8')).digest('hex');
}

interface LedgerLite {
  epochs: number[];
  rebaptism: Map<number, string>;
  requiredTuples: Set<string>;
}

/**
 * Parse minimale del ledger per i controlli di catena (epochs monotoni,
 * rebaptism su N>1, tuple manifest_plan del seed corrente). Il parser di
 * riferimento resta intent_ledger.py — qui serve solo la forma.
 */
function parseLedgerLite(text: string): LedgerLite | null {
  const epochs: number[] = [];
  const rebaptism = new Map<number, string>();
  const requiredTuples = new Set<string>();
  let cur = 0;
  let inManifest = false;
  for (const ln of text.split('\n')) {
    const m = ln.match(/^## epoch-(\d+) seed/);
    if (m) {
      cur = Number(m[1]);
      epochs.push(cur);
      inManifest = false;
      continue;
    }
    if (cur === 0) continue;
    if (ln.startsWith('manifest_plan:')) {
      inManifest = true;
      continue;
    }
    if (inManifest && ln.startsWith('  - ')) {
      requiredTuples.add(ln.slice(4).trim());
      continue;
    }
    inManifest = false;
    if (ln.startsWith('rebaptism_answer:')) {
      rebaptism.set(cur, ln.split(':', 2)[1].trim());
    }
  }
  if (epochs.length === 0) return null;
  return { epochs, rebaptism, requiredTuples };
}

// ------------------------------------------------------------------ gate

export function checkIntentGate(
  runDir: string,
  repoRoot: string,
  opts: { changedFiles: string[] },
): IntentGateReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  const intentPath = path.join(runDir, 'intent.json');
  if (!existsSync(intentPath)) {
    return {
      ok: false,
      status: 'MISSING',
      errors: ['intent.json assente — manifest dichiara intent_gate: true (preflight)'],
      warnings,
    };
  }
  let intent: IntentJson;
  try {
    intent = JSON.parse(readFileSync(intentPath, 'utf8')) as IntentJson;
  } catch {
    return { ok: false, status: 'RED', errors: ['intent.json non parsabile (integrità)'], warnings };
  }

  // ROSSO: ledger_sha256 binding + struttura epoch.
  const ledgerPath = path.join(runDir, 'intent.md');
  if (!existsSync(ledgerPath)) {
    errors.push('intent.md assente accanto a intent.json (integrità)');
  } else {
    const ledgerText = readFileSync(ledgerPath, 'utf8');
    if (intent.ledger_sha256 && sha256FileText(ledgerPath) !== intent.ledger_sha256) {
      errors.push('ROSSO integrità: ledger_sha256 ≠ sha256(intent.md) — ledger mutato dopo il seal');
    }
    const lite = parseLedgerLite(ledgerText);
    if (!lite) {
      errors.push('ROSSO integrità: ledger non parsabile (nessun epoch seed)');
    } else {
      for (let i = 0; i < lite.epochs.length; i += 1) {
        if (lite.epochs[i] !== i + 1) {
          errors.push(`ROSSO integrità: epoch non monotoni (${lite.epochs.join(',')})`);
          break;
        }
      }
      for (const n of lite.epochs) {
        if (n > 1 && !lite.rebaptism.get(n)) {
          errors.push(`ROSSO: epoch ${n} senza rebaptism_answer (epoch-rebaptism OB-25)`);
        }
      }
      // required(seed epoch corrente) ⊆ manifest_closure
      if (intent.manifest_closure) {
        const closure = new Set(intent.manifest_closure.map((t) => t.join(' | ')));
        for (const t of lite.requiredTuples) {
          if (!closure.has(t)) {
            errors.push(`ROSSO: required manifest_plan non ⊆ manifest_closure — "${t}"`);
          }
        }
      } else if (lite.requiredTuples.size > 0) {
        warnings.push('manifest_closure non dichiarato in intent.json — check required ⊆ closure saltato');
      }
    }
  }

  // item_state table + status chiusura.
  const items = intent.items ?? {};
  const states: string[] = [];
  let anyWaived = false;
  let surfaceMap: ReturnType<typeof loadSurfaceMap> | null = null;
  try {
    surfaceMap = loadSurfaceMap(repoRoot);
  } catch {
    warnings.push('mappa file→surface non disponibile: not-applicable trattati come pending');
  }
  for (const [itemId, rec] of Object.entries(items)) {
    let reactivated = false;
    if (rec.verdict === 'not-applicable' && rec.scope_surfaces?.length) {
      if (!surfaceMap) {
        reactivated = true; // mappa assente → pending/blocca (default-deny)
      } else {
        const touched = new Set(
          opts.changedFiles.flatMap((f) => surfaceFor(f, surfaceMap).map((s) => s.id)),
        );
        reactivated = rec.scope_surfaces.some((s) => touched.has(s));
      }
    }
    const st = itemState(rec, { reactivated });
    if (reactivated) {
      errors.push(`not-applicable ${itemId} riattivato: scope_surfaces ∩ changed_files ≠ ∅ (OB-39/OB-45)`);
    }
    if (st === 'non-terminal') {
      warnings.push(`item ${itemId} non terminale (${rec.verdict ?? rec.disposition})`);
    }
    if (rec.verdict === 'waived' || rec.verdict === 'waived-infra') anyWaived = true;
    states.push(st);
  }
  const status = closureStatus(states, anyWaived);
  if (status !== 'PASS' && status !== 'WAIVED' && status !== 'SKIPPED_TRIVIAL') {
    errors.push(`intent status ${status} — chiusura richiede PASS|WAIVED|SKIPPED_TRIVIAL`);
  }

  // director_answer citati: firma HMAC + provenance journal (OB-47/OB-52).
  const cited = Object.entries(items).filter(([, r]) => r.director_answer);
  if (cited.length > 0) {
    const keyInfo = resolveHmacKey(repoRoot);
    const invocations = loadInvocations(repoRoot);
    const answersPath = path.join(repoRoot, '.mw', 'director-answers.jsonl');
    const answers: IntentAnswer[] = existsSync(answersPath)
      ? readFileSync(answersPath, 'utf8')
          .split('\n')
          .filter((l) => l.trim().startsWith('{'))
          .map((l) => JSON.parse(l) as IntentAnswer)
      : [];
    for (const [itemId, rec] of cited) {
      const ans = answers.find((a) => a.nonce === rec.director_answer);
      if (!ans) {
        errors.push(`director_answer ${rec.director_answer} di ${itemId} non nel journal → unconfirmed`);
        continue;
      }
      if (!keyInfo) {
        errors.push(`chiave HMAC non risolvibile — firma di ${itemId} non verificabile → unconfirmed`);
      } else if (!verifyAnswerSignature(ans, keyInfo.key)) {
        errors.push(`director_answer di ${itemId} con firma invalida → unconfirmed`);
      }
      if (!hasValidProvenance(ans, invocations)) {
        errors.push(`director_answer di ${itemId} senza entry journal provenance (nonce/tty) → unconfirmed`);
      }
    }
  }

  // RICHIESTE.md append-only vs git rispetto al commit di battesimo
  // (P2). La baseline è legata in intent.json — HEAD non è usabile:
  // il worktree condivide sessioni e lo stato delle R si aggiorna.
  if (intent.richeste_baseline_commit) {
    try {
      const baseline = execSync(
        `git show "${intent.richeste_baseline_commit}:RICHIESTE.md"`,
        { cwd: repoRoot, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
      );
      const current = readFileSync(path.join(repoRoot, 'RICHIESTE.md'), 'utf8');
      if (!current.startsWith(baseline)) {
        errors.push(
          'ROSSO: RICHIESTE.md non append-only rispetto al commit di battesimo',
        );
      }
    } catch {
      errors.push(
        `richeste_baseline_commit ${intent.richeste_baseline_commit} non risolvibile → integrità non verificabile`,
      );
    }
  } else {
    warnings.push('richeste_baseline_commit assente: append-only RICHIESTE non verificato');
  }

  return { ok: errors.length === 0, status, errors, warnings };
}
