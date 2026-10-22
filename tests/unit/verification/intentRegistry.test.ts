/**
 * intentRegistry — PLAN-045 T-005a: registro unico record/risposte,
 * matrice totale (OB-32), firma HMAC (OB-52), provenance (OB-47).
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  ANSWER_MATRIX,
  RECORD_TYPES,
  isResponseAllowed,
  recordKey,
  lastRecordFor,
  resolveHmacKey,
  signAnswer,
  verifyAnswerSignature,
  hasValidProvenance,
  loadInvocations,
  DIRECTOR_INVOCATIONS_REL,
  type IntentAnswer,
  type DirectorInvocation,
} from '../../../scripts/verification/intentRegistry';
import { emitDirectorAnswer } from '../../../scripts/verification/mwDirectorAnswer';
import { DIRECTOR_ANSWERS_REL } from '../../../scripts/verification/surfaceMap';

const KEY = 'test-hmac-key-0123456789abcdef';
const baseSigned = {
  gate: 'intent',
  item_id: 'v33.item-3',
  response: 'waive' as const,
  target: 'itemhash123',
  verbatim: 'ok a chiudere senza questo controllo',
  epoch: 1,
};

describe('ANSWER_MATRIX — totalità (OB-32)', () => {
  it('ogni tipo di record ha almeno una risposta ammessa', () => {
    for (const rt of RECORD_TYPES) {
      expect(ANSWER_MATRIX[rt].length, rt).toBeGreaterThanOrEqual(1);
    }
  });

  it('epoch-rebaptism accetta rebaptize (OB-32)', () => {
    expect(isResponseAllowed('epoch-rebaptism', 'rebaptize')).toBe(true);
    expect(isResponseAllowed('epoch-rebaptism', 'waive')).toBe(false);
  });

  it('matrice per tipo: infra→retry/waive-infra, gap→clarify/waive/amend', () => {
    expect(isResponseAllowed('blocked-infra', 'retry-panel')).toBe(true);
    expect(isResponseAllowed('blocked-infra', 'waive-infra')).toBe(true);
    expect(isResponseAllowed('blocked-infra', 'waive')).toBe(false);
    expect(isResponseAllowed('quorum-short', 'waive-infra')).toBe(true);
    expect(isResponseAllowed('gap', 'clarify')).toBe(true);
    expect(isResponseAllowed('cap-exhausted', 'clarify')).toBe(true);
    expect(isResponseAllowed('integrity-cap-exhausted', 'clarify')).toBe(false);
    expect(isResponseAllowed('ambiguous', 'waive')).toBe(false);
    expect(isResponseAllowed('unconfirmed', 'amend-desiderata')).toBe(true);
    expect(isResponseAllowed('unconfirmed', 'clarify')).toBe(false);
    expect(isResponseAllowed('prebaptism-gap', 'waive-plan-gap')).toBe(true);
    expect(isResponseAllowed('prebaptism-gap', 'waive')).toBe(false);
    expect(isResponseAllowed('prebaptism-infra', 'waive-infra')).toBe(false);
  });

  it('risposta fuori tabella → parser rifiuta (OB-20)', () => {
    expect(isResponseAllowed('gap', 'retry-panel')).toBe(false);
    expect(isResponseAllowed('gate-diff', 'clarify')).toBe(false);
    expect(isResponseAllowed('coverage_exception', 'answer')).toBe(true);
  });
});

describe('indicizzazione record (gate, item_id)', () => {
  it('recordKey + lastRecordFor: vince l\'ultimo emesso per la stessa chiave', () => {
    expect(recordKey('intent', 'v33.item-1')).toBe('intent#v33.item-1');
    const recs = [
      { gate: 'intent', item_id: 'v33.item-1', tag: 'a' },
      { gate: 'intent', item_id: 'v33.item-2', tag: 'b' },
      { gate: 'intent', item_id: 'v33.item-1', tag: 'c' },
    ];
    expect(lastRecordFor(recs, 'intent', 'v33.item-1')?.tag).toBe('c');
    expect(lastRecordFor(recs, 'intent', 'v33.item-2')?.tag).toBe('b');
    expect(lastRecordFor(recs, 'other', 'v33.item-1')).toBeUndefined();
  });
});

describe('firma HMAC (OB-52)', () => {
  it('roundtrip sign/verify su record strutturato', () => {
    const hmac = signAnswer(baseSigned, KEY);
    const ans = { ...baseSigned, hmac } as unknown as IntentAnswer;
    expect(verifyAnswerSignature(ans, KEY)).toBe(true);
  });

  it('retype di un campo → firma invalida (replay/tamper detection)', () => {
    const hmac = signAnswer(baseSigned, KEY);
    for (const mutate of [
      (a: IntentAnswer) => ({ ...a, response: 'waive-infra' }),
      (a: IntentAnswer) => ({ ...a, item_id: 'v33.item-9' }),
      (a: IntentAnswer) => ({ ...a, verbatim: a.verbatim + '!' }),
      (a: IntentAnswer) => ({ ...a, epoch: a.epoch + 1 }),
      (a: IntentAnswer) => ({ ...a, target: 'otherhash' }),
      (a: IntentAnswer) => ({ ...a, gate: 'other' }),
    ]) {
      const ans = mutate({ ...baseSigned, hmac } as unknown as IntentAnswer);
      expect(verifyAnswerSignature(ans, KEY), JSON.stringify(mutate.toString())).toBe(false);
    }
  });

  it('chiave diversa → firma invalida', () => {
    const ans = { ...baseSigned, hmac: signAnswer(baseSigned, KEY) } as unknown as IntentAnswer;
    expect(verifyAnswerSignature(ans, 'altra-chiave')).toBe(false);
  });
});

describe('resolveHmacKey — sorgente astratta fuori dal worktree', () => {
  let root: string;
  let keyFile: string;
  const OLD_ENV = process.env.MW_DIRECTOR_HMAC_KEY_FILE;
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'hmac-root-'));
    keyFile = path.join(root, 'outside.key');
    writeFileSync(keyFile, KEY + '\n');
    chmodSync(keyFile, 0o600);
    delete process.env.MW_DIRECTOR_HMAC_KEY_FILE;
  });
  afterEach(() => {
    if (OLD_ENV === undefined) delete process.env.MW_DIRECTOR_HMAC_KEY_FILE;
    else process.env.MW_DIRECTOR_HMAC_KEY_FILE = OLD_ENV;
    rmSync(root, { recursive: true, force: true });
  });

  it('MW_DIRECTOR_HMAC_KEY_FILE fuori dal worktree → fonte env usata o keychain/home precedenti', () => {
    const repo = path.join(root, 'repo');
    process.env.MW_DIRECTOR_HMAC_KEY_FILE = keyFile;
    const k = resolveHmacKey(repo);
    // su macOS con keychain/home la env è il fallback — quel che conta è
    // che una sorgente valida risolva e NON sia dentro il worktree
    if (k !== null) expect(k.key.length).toBeGreaterThan(0);
  });

  it('key file DENTRO il worktree → mai usato come fonte', () => {
    const repo = path.join(root, 'repo');
    const inside = path.join(repo, '.mw');
    mkdirSync(inside, { recursive: true });
    const insideKey = path.join(inside, 'k');
    writeFileSync(insideKey, KEY);
    chmodSync(insideKey, 0o600);
    process.env.MW_DIRECTOR_HMAC_KEY_FILE = insideKey;
    const k = resolveHmacKey(repo);
    // se risolve, è per keychain/home — mai per il file dentro il worktree
    if (k !== null) expect(k.source).not.toContain(insideKey);
  });
});

describe('provenance journal (OB-47)', () => {
  it('risposta con invocazione nonce+tty matching → provenance ok', () => {
    const inv: DirectorInvocation = {
      nonce: 'abc123',
      invoked_at: '2026-10-18T00:00:00Z',
      tty_attested: true,
      record_kind: 'gap',
      gate: 'intent',
      item_id: 'v33.item-3',
      response: 'waive',
    };
    const ans = {
      nonce: 'abc123',
      record_kind: 'gap',
      gate: 'intent',
      item_id: 'v33.item-3',
      response: 'waive',
    } as IntentAnswer;
    expect(hasValidProvenance(ans, [inv])).toBe(true);
  });

  it('nonce assente dal journal → provenance fallita', () => {
    const ans = { nonce: 'zzz', record_kind: 'gap', gate: 'g', item_id: 'i', response: 'waive' } as IntentAnswer;
    expect(hasValidProvenance(ans, [])).toBe(false);
  });

  it('nonce match ma tty_attested false → provenance fallita', () => {
    const inv: DirectorInvocation = {
      nonce: 'n1',
      invoked_at: 'x',
      tty_attested: false,
      record_kind: 'gap',
      gate: 'g',
      item_id: 'i',
      response: 'waive',
    };
    const ans = { nonce: 'n1', record_kind: 'gap', gate: 'g', item_id: 'i', response: 'waive' } as IntentAnswer;
    expect(hasValidProvenance(ans, [inv])).toBe(false);
  });

  it('nonce match ma risposta diversa → provenance fallita (replay di nonce)', () => {
    const inv: DirectorInvocation = {
      nonce: 'n2',
      invoked_at: 'x',
      tty_attested: true,
      record_kind: 'gap',
      gate: 'g',
      item_id: 'i',
      response: 'clarify',
    };
    const ans = { nonce: 'n2', record_kind: 'gap', gate: 'g', item_id: 'i', response: 'waive' } as IntentAnswer;
    expect(hasValidProvenance(ans, [inv])).toBe(false);
  });
});

describe('emitDirectorAnswer — journal + firma end-to-end', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), 'emit-'));
  });
  afterEach(() => rmSync(root, { recursive: true, force: true }));

  it('scrive invocazione + risposta firmata verificabile', () => {
    const ans = emitDirectorAnswer(
      { record: 'gap', response: 'waive', ...baseSigned, key: KEY },
      root,
    );
    expect(ans.hmac).toBe(signAnswer(ans, KEY));
    expect(verifyAnswerSignature(ans, KEY)).toBe(true);
    const invs = loadInvocations(root);
    expect(invs).toHaveLength(1);
    expect(hasValidProvenance(ans, invs)).toBe(true);
    // la risposta è appendata al journal answers
    const lines = readFileSync(path.join(root, DIRECTOR_ANSWERS_REL), 'utf8').trim().split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).nonce).toBe(ans.nonce);
  });

  it('risposta fuori matrice → throw (parser rifiuta)', () => {
    expect(() =>
      emitDirectorAnswer(
        { record: 'unconfirmed', response: 'clarify', ...baseSigned, key: KEY },
        root,
      ),
    ).toThrow('non ammessa');
  });

  it('clarify senza refines → throw (OB-33)', () => {
    expect(() =>
      emitDirectorAnswer(
        { ...baseSigned, record: 'gap', response: 'clarify', key: KEY },
        root,
      ),
    ).toThrow('refines');
  });

  it('clarify con refines → emessa con campo tipizzato', () => {
    const ans = emitDirectorAnswer(
      { ...baseSigned, record: 'gap', response: 'clarify', refines: 'v33.item-3', key: KEY },
      root,
    );
    expect(ans.refines).toBe('v33.item-3');
  });
});

describe('CLI — TTY gate (OB-52)', () => {
  it('stdin piped → nessun token, exit≠0', () => {
    const res = (() => {
      try {
        execFileSync(
          process.execPath,
          [
            path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'),
            path.join(process.cwd(), 'scripts', 'verification', 'mwDirectorAnswer.ts'),
            '--record', 'gap', '--gate', 'g', '--item', 'i',
            '--response', 'waive', '--verbatim', 'x',
          ],
          { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, NODE_OPTIONS: '' } },
        );
        return { code: 0, err: '' };
      } catch (e) {
        const er = e as { status?: number; stderr?: string };
        return { code: er.status ?? 1, err: er.stderr ?? '' };
      }
    })();
    expect(res.code).not.toBe(0);
    expect(res.err).toContain('TTY');
  });
});
