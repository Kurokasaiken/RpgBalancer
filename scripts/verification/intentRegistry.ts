/**
 * intentRegistry — registro unico dei tipi di record `awaiting_director`
 * e delle risposte `director_answer` ammesse (PLAN-045 T-005a, v33 FROZEN).
 *
 * La matrice parser è TOTALE: ogni tipo di record emesso ha ≥1 risposta
 * (OB-32); una risposta fuori tabella è rifiutata dal parser (OB-20).
 * I record sono indicizzati `(gate, item_id)` con `precondition`
 * `{bundle, quorum, panel}` — un director_answer scarica solo il proprio
 * record (state machine condivisa, PLAN-044 T-003).
 *
 * Provenance (OB-47/OB-52): una risposta firmata richiede
 *  - firma HMAC-SHA256 sull'intero record strutturato
 *    `(gate, item_id, tipo_risposta, target, verbatim, epoch)` — un
 *    retype/replay invalida la firma;
 *  - entry nel journal delle invocazioni `.mw/director-invocations.jsonl`
 *    (timestamp+nonce del comando interattivo, `tty_attested: true`).
 * Senza firma valida il record è `unconfirmed`; senza entry journal →
 * provenance non autentica → blocco.
 *
 * Chiave HMAC da sorgente astratta NON leggibile dal worktree, risolta
 * in ordine: (1) macOS Keychain `security find-generic-password`,
 * (2) file `~/.mw/director-key` chmod 600, (3) variabile
 * `MW_DIRECTOR_HMAC_KEY_FILE` → file fuori dal worktree (r012, nemotron).
 */
import { execFileSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ---------------------------------------------------------------------------
// Tipi di record e risposte
// ---------------------------------------------------------------------------

/** Tipi di record awaiting_director emessi dai gate (universo chiuso). */
export const RECORD_TYPES = [
  // legacy PLAN-044 T-003 (pre-esistenti al gate intent)
  'coverage_exception',
  'gate-diff',
  // chiusura intent (P4/P5)
  'blocked-infra',
  'quorum-short',
  'verdict-unverifiable',
  'gap',
  'pareggio',
  'cap-exhausted',
  'integrity-cap-exhausted',
  'global-ceiling-exhausted',
  'ambiguous',
  'class-dispute',
  'illegitimate',
  'unconfirmed',
  'epoch-rebaptism',
  // pre-battesimo (P8)
  'prebaptism-gap',
  'prebaptism-infra',
] as const;
export type RecordType = (typeof RECORD_TYPES)[number];

/** Risposte director_answer ammesse (universo chiuso). */
export const RESPONSE_TYPES = [
  'answer', // coverage_exception/gate-diff: disposizione testuale legata a hash
  'clarify', // chiarimento Director (refines: item_id tipizzato)
  'waive', // waiver bound a (item_hash, plan_hash, evidence_hash)
  'waive-infra', // espanso per-item dal parser (BLOCKED_INFRA/quorum-short)
  'retry-panel', // re-invocazione pannello (non consuma cap)
  'amend-desiderata', // supersessione/split → epoch N+1
  'rebaptize', // re-battesimo epoch N+1 (lega plan_hash_semantico)
  'revise-plan', // pre-battesimo: revisione plan (conta in REVISION_LOOP_CAP)
  'waive-plan-gap', // pre-battesimo: gap waivato a livello plan (mai waiver a chiusura)
] as const;
export type ResponseType = (typeof RESPONSE_TYPES)[number];

/**
 * Matrice parser TOTALE record→risposte (OB-32). Ogni tipo di record
 * emesso ha ≥1 risposta ammessa; una risposta fuori tabella è rifiutata.
 */
export const ANSWER_MATRIX: Readonly<Record<RecordType, readonly ResponseType[]>> = {
  coverage_exception: ['answer'],
  'gate-diff': ['answer'],
  'blocked-infra': ['retry-panel', 'waive-infra'],
  'quorum-short': ['retry-panel', 'waive-infra'],
  'verdict-unverifiable': ['clarify', 'waive', 'amend-desiderata'],
  gap: ['clarify', 'waive', 'amend-desiderata'],
  pareggio: ['clarify', 'waive', 'amend-desiderata'],
  'cap-exhausted': ['clarify', 'waive', 'amend-desiderata'],
  'integrity-cap-exhausted': ['waive', 'amend-desiderata'],
  'global-ceiling-exhausted': ['waive', 'amend-desiderata'],
  ambiguous: ['clarify', 'amend-desiderata'],
  'class-dispute': ['clarify', 'amend-desiderata'],
  illegitimate: ['clarify', 'amend-desiderata'],
  unconfirmed: ['amend-desiderata'],
  'epoch-rebaptism': ['rebaptize', 'amend-desiderata'],
  'prebaptism-gap': ['revise-plan', 'waive-plan-gap', 'amend-desiderata'],
  'prebaptism-infra': ['retry-panel'],
};

/** Risposta ammessa per il record type (matrice totale — OB-20/OB-32). */
export function isResponseAllowed(record: RecordType, response: string): response is ResponseType {
  return (ANSWER_MATRIX[record] as readonly string[]).includes(response);
}

// ---------------------------------------------------------------------------
// Record e risposte
// ---------------------------------------------------------------------------

/** Precondizione del record (state machine condivisa): chi emette dichiara
 *  quali check devono risultare verdi prima che la risposta scarichi. */
export interface RecordPrecondition {
  bundle?: boolean;
  quorum?: boolean;
  panel?: boolean;
}

/** Record awaiting_director indicizzato (gate, item_id). */
export interface IntentRecord {
  kind: RecordType;
  gate: string;
  item_id: string;
  epoch: number;
  item_hash: string;
  /** Target hash-ato del record: exception record, plan_hash_semantico,
   *  snapshot id, ecc. — ciò che la risposta lega. */
  target: string;
  precondition?: RecordPrecondition;
  /** `clarify` su cap-exhausted autorizza esattamente UN re-eval fuori cap
   *  (OB-31/OB-37): ammesso solo se false; il re-eval lo pone a true. */
  clarify_budget_used?: boolean;
  emitted_at: string;
}

/** Risposta firmata nel journal `.mw/director-answers.jsonl`. */
export interface IntentAnswer {
  kind: 'intent-answer';
  record_kind: RecordType;
  response: ResponseType;
  gate: string;
  item_id: string;
  epoch: number;
  /** Target della risposta (hash legato: record target, plan_hash_semantico
   *  per rebaptize, residual_text per supersessione parziale). */
  target: string;
  verbatim: string;
  /** refines: item_id — tipizzato, obbligatorio per `clarify` (OB-33). */
  refines?: string;
  answered_at: string;
  answered_by: string;
  /** Provenance: nonce dell'invocazione nel journal (OB-47). */
  nonce: string;
  tty_attested: boolean;
  /** HMAC-SHA256 su (gate,item_id,response,target,verbatim,epoch) — OB-52. */
  hmac: string;
}

/** Entry del journal invocazioni `.mw/director-invocations.jsonl` (OB-47). */
export interface DirectorInvocation {
  nonce: string;
  invoked_at: string;
  tty_attested: boolean;
  record_kind: RecordType;
  gate: string;
  item_id: string;
  response: ResponseType;
}

export const DIRECTOR_INVOCATIONS_REL = path.join('.mw', 'director-invocations.jsonl');

// ---------------------------------------------------------------------------
// Indicizzazione (gate, item_id) — un director_answer scarica solo il suo record
// ---------------------------------------------------------------------------

export function recordKey(gate: string, itemId: string): string {
  return `${gate}#${itemId}`;
}

/** Ultimo record per chiave (append-only: vince l'ultimo emesso). */
export function lastRecordFor<T extends { gate: string; item_id: string }>(
  records: T[],
  gate: string,
  itemId: string,
): T | undefined {
  for (let i = records.length - 1; i >= 0; i -= 1) {
    if (records[i].gate === gate && records[i].item_id === itemId) return records[i];
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Chiave HMAC — sorgente astratta fuori dal worktree (r012)
// ---------------------------------------------------------------------------

const KEYCHAIN_SERVICE = 'rpg-director-hmac';
const KEYCHAIN_ACCOUNT = 'director';
const KEY_FILE_REL = path.join('.mw', 'director-key');

function isOutsideWorktree(p: string, repoRoot: string): boolean {
  const rp = path.resolve(p);
  return !rp.startsWith(path.resolve(repoRoot) + path.sep);
}

/**
 * Risolve la chiave HMAC in ordine: (1) macOS Keychain, (2) file
 * `~/.mw/director-key` (chmod 600), (3) `MW_DIRECTOR_HMAC_KEY_FILE` →
 * file fuori dal worktree. null se nessuna sorgente risolve.
 */
export function resolveHmacKey(repoRoot: string): { key: string; source: string } | null {
  if (process.platform === 'darwin') {
    try {
      const out = execFileSync(
        'security',
        ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w'],
        { encoding: 'utf8', timeout: 15_000, stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
      if (out) return { key: out, source: 'keychain' };
    } catch {
      // Keychain non presente o voce assente → fallback file
    }
  }
  const homeKey = path.join(os.homedir(), KEY_FILE_REL);
  if (existsSync(homeKey)) {
    try {
      const mode = statSync(homeKey).mode & 0o777;
      if (mode === 0o600) {
        const key = readFileSync(homeKey, 'utf8').trim();
        if (key) return { key, source: `file:${homeKey}` };
      }
    } catch {
      // permessi/lettura falliti → prossima sorgente
    }
  }
  const envFile = process.env.MW_DIRECTOR_HMAC_KEY_FILE;
  if (envFile && existsSync(envFile) && isOutsideWorktree(envFile, repoRoot)) {
    try {
      const mode = statSync(envFile).mode & 0o777;
      if ((mode & 0o077) === 0) {
        const key = readFileSync(envFile, 'utf8').trim();
        if (key) return { key, source: `env:${envFile}` };
      }
    } catch {
      // come sopra
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Firma HMAC — sul record strutturato, non sulla riga serializzata (OB-52)
// ---------------------------------------------------------------------------

/** Payload canonico firmato: i campi strutturali, in ordine dichiarato. */
export function signaturePayload(a: {
  gate: string;
  item_id: string;
  response: string;
  target: string;
  verbatim: string;
  epoch: number;
}): string {
  return JSON.stringify([
    'intent-answer-v1',
    a.gate,
    a.item_id,
    a.response,
    a.target,
    a.verbatim,
    a.epoch,
  ]);
}

export function signAnswer(
  a: Parameters<typeof signaturePayload>[0],
  key: string,
): string {
  return createHmac('sha256', key).update(signaturePayload(a), 'utf8').digest('hex');
}

/** Verifica la firma di un record letto dal journal (retype/replay → false). */
export function verifyAnswerSignature(a: IntentAnswer, key: string): boolean {
  return signAnswer(a, key) === a.hmac;
}

// ---------------------------------------------------------------------------
// Provenance (OB-47) — la risposta deve avere un'invocazione journalizzata
// ---------------------------------------------------------------------------

export function loadInvocations(repoRoot: string): DirectorInvocation[] {
  const p = path.join(repoRoot, DIRECTOR_INVOCATIONS_REL);
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split('\n')
    .filter((l) => l.trim().startsWith('{'))
    .map((l) => JSON.parse(l) as DirectorInvocation);
}

/**
 * Provenance di una risposta: esiste un'invocazione con lo stesso nonce,
 * tty_attested, e stesso (record_kind, gate, item_id, response).
 */
export function hasValidProvenance(a: IntentAnswer, invocations: DirectorInvocation[]): boolean {
  return invocations.some(
    (inv) =>
      inv.nonce === a.nonce &&
      inv.tty_attested === true &&
      inv.record_kind === a.record_kind &&
      inv.gate === a.gate &&
      inv.item_id === a.item_id &&
      inv.response === a.response,
  );
}

export function newNonce(): string {
  return randomBytes(12).toString('hex');
}
