#!/usr/bin/env tsx
/**
 * mw-director-answer — comando interattivo Director (PLAN-045 T-005a,
 * v33 FROZEN). Registra un `director_answer` tipizzato e FRMATO nel
 * journal `.mw/director-answers.jsonl` + entry nel journal invocazioni
 * `.mw/director-invocations.jsonl` (provenance OB-47).
 *
 * Requisiti (OB-52):
 *  - TTY reale obbligatorio: stdin piped/here-doc o
 *    `DIRECTOR_NONINTERACTIVE=1` → nessun token → rifiuto.
 *  - Firma HMAC-SHA256 sul record strutturato — chiave da sorgente
 *    astratta fuori dal worktree (Keychain → ~/.mw/director-key →
 *    MW_DIRECTOR_HMAC_KEY_FILE). Senza firma valida il record è
 *    `unconfirmed` a chiusura.
 *
 * Uso:
 *   npm run mw-director-answer -- --record <tipo> --gate <g> --item <id> \
 *     --response <risposta> --verbatim "<testo>" --epoch <n> --target <t>
 *   npm run mw-director-answer -- --init-key   # crea ~/.mw/director-key
 *   npm run mw-director-answer -- --list
 */
import { appendFileSync, mkdirSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import {
  ANSWER_MATRIX,
  DIRECTOR_INVOCATIONS_REL,
  RECORD_TYPES,
  isResponseAllowed,
  loadInvocations,
  newNonce,
  recordKey,
  resolveHmacKey,
  signAnswer,
  type DirectorInvocation,
  type IntentAnswer,
  type RecordType,
  type ResponseType,
} from './intentRegistry';
import { DIRECTOR_ANSWERS_REL } from './surfaceMap';

const repoRoot = process.cwd();

// ---------------------------------------------------------------------------
// Emissione (lib — testabile senza TTY)
// ---------------------------------------------------------------------------

export interface EmitInput {
  record: RecordType;
  response: ResponseType;
  gate: string;
  item_id: string;
  epoch: number;
  target: string;
  verbatim: string;
  refines?: string;
  key: string;
  answered_by?: string;
}

/**
 * Scrive invocazione (journal provenance) + risposta firmata (journal
 * answers). La risposta referenzia il nonce dell'invocazione (OB-47).
 */
export function emitDirectorAnswer(input: EmitInput, root: string): IntentAnswer {
  if (!isResponseAllowed(input.record, input.response)) {
    throw new Error(
      `risposta "${input.response}" non ammessa per record "${input.record}" ` +
        `(ammesse: ${ANSWER_MATRIX[input.record].join(' | ')})`,
    );
  }
  if (input.response === 'clarify' && !input.refines) {
    throw new Error('clarify richiede --refines <item_id> tipizzato (OB-33)');
  }
  const nonce = newNonce();
  const now = new Date().toISOString();
  const invocation: DirectorInvocation = {
    nonce,
    invoked_at: now,
    tty_attested: true,
    record_kind: input.record,
    gate: input.gate,
    item_id: input.item_id,
    response: input.response,
  };
  const invPath = path.join(root, DIRECTOR_INVOCATIONS_REL);
  mkdirSync(path.dirname(invPath), { recursive: true });
  appendFileSync(invPath, JSON.stringify(invocation) + '\n');

  const signed = {
    gate: input.gate,
    item_id: input.item_id,
    response: input.response,
    target: input.target,
    verbatim: input.verbatim,
    epoch: input.epoch,
  };
  const answer: IntentAnswer = {
    kind: 'intent-answer',
    record_kind: input.record,
    response: input.response,
    gate: input.gate,
    item_id: input.item_id,
    epoch: input.epoch,
    target: input.target,
    verbatim: input.verbatim,
    ...(input.refines ? { refines: input.refines } : {}),
    answered_at: now,
    answered_by: input.answered_by ?? os.userInfo().username,
    nonce,
    tty_attested: true,
    hmac: signAnswer(signed, input.key),
  };
  const ansPath = path.join(root, DIRECTOR_ANSWERS_REL);
  mkdirSync(path.dirname(ansPath), { recursive: true });
  appendFileSync(ansPath, JSON.stringify(answer) + '\n');
  return answer;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function requireTty(): void {
  if (process.env.DIRECTOR_NONINTERACTIVE === '1') {
    console.error('mw-director-answer: DIRECTOR_NONINTERACTIVE=1 — nessun token emesso (OB-52)');
    process.exit(3);
  }
  if (!process.stdin.isTTY) {
    console.error(
      'mw-director-answer: TTY reale richiesto — stdin piped/here-doc non ' +
        'produce un director_answer autenticato (OB-52)',
    );
    process.exit(3);
  }
}

function initKey(): void {
  const homeKey = path.join(os.homedir(), '.mw', 'director-key');
  if (existsSync(homeKey)) {
    console.log(`chiave già presente: ${homeKey}`);
    return;
  }
  mkdirSync(path.dirname(homeKey), { recursive: true });
  writeFileSync(homeKey, randomBytes(32).toString('hex') + '\n');
  chmodSync(homeKey, 0o600);
  console.log(`chiave HMAC creata → ${homeKey} (chmod 600, fuori dal worktree)`);
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.includes('--init-key')) {
    requireTty();
    initKey();
    return;
  }
  if (args.includes('--list')) {
    for (const inv of loadInvocations(repoRoot)) {
      console.log(
        `${inv.invoked_at}  nonce=${inv.nonce.slice(0, 8)}…  ` +
          `${inv.record_kind}→${inv.response}  ${recordKey(inv.gate, inv.item_id)}`,
      );
    }
    return;
  }
  const arg = (name: string): string | undefined => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const record = arg('record') as RecordType | undefined;
  const response = arg('response') as ResponseType | undefined;
  const gate = arg('gate');
  const itemId = arg('item');
  const verbatim = arg('verbatim');
  const epoch = Number(arg('epoch') ?? '0');
  const target = arg('target') ?? '';
  const refines = arg('refines');
  if (!record || !response || !gate || !itemId || !verbatim) {
    console.error(
      'Uso: npm run mw-director-answer -- --record <tipo> --gate <g> ' +
        '--item <id> --response <r> --verbatim "<testo>" --epoch <n> --target <t> [--refines <id>]\n' +
        `record: ${RECORD_TYPES.join(', ')}`,
    );
    process.exit(2);
  }
  requireTty();
  const k = resolveHmacKey(repoRoot);
  if (!k) {
    console.error(
      'chiave HMAC non risolta — esegui `npm run mw-director-answer -- --init-key` ' +
        '(o configura Keychain / MW_DIRECTOR_HMAC_KEY_FILE fuori dal worktree)',
    );
    process.exit(4);
  }
  const ans = emitDirectorAnswer(
    {
      record,
      response,
      gate,
      item_id: itemId,
      epoch,
      target,
      verbatim,
      refines,
      key: k.key,
    },
    repoRoot,
  );
  console.log(`director_answer firmata → ${DIRECTOR_ANSWERS_REL}`);
  console.log(`  ${ans.record_kind} → ${ans.response}  ${recordKey(ans.gate, ans.item_id)}`);
  console.log(`  nonce=${ans.nonce.slice(0, 8)}…  hmac=${ans.hmac.slice(0, 12)}…  key=${k.source}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
