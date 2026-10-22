import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  LOCK_FILE,
  buildLock,
  checkTrustedLock,
  protectedSet,
  setAggregateHash,
} from '../../../scripts/verification/trustedLock';
import { GATE_FILES } from '../../../scripts/verification/contractsCheck';

const tmpDirs: string[] = [];
function mkRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'tlock-'));
  tmpDirs.push(root);
  // materializza tutti i path protetti come file dummy
  for (const rel of [
    ...GATE_FILES,
    'scripts/verification/bundle.ts',
    'scripts/verification/trustedLock.ts',
    'scripts/verification/directorApprove.ts',
    '.mw/verify-tiers.json',
    '.mw/surface-map.json',
  ]) {
    const p = path.join(root, rel);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, `dummy:${rel}`);
  }
  const frozen = path.join(root, 'src/ui/idleVillage/frozen/kits');
  mkdirSync(frozen, { recursive: true });
  writeFileSync(path.join(frozen, 'kitA.ts'), 'frozen-kit-a');
  return root;
}
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

describe('trustedLock', () => {
  it('protectedSet includes gate files, bundler and frozen kits', () => {
    const root = mkRepo();
    const set = protectedSet(root);
    expect(set).toContain('scripts/verification/produceBundle.ts');
    expect(set).toContain('scripts/verification/bundle.ts');
    expect(set.some((f) => f.includes('frozen/kits/kitA.ts'))).toBe(true);
  });

  it('lock assente → ok con nota (finestra migrazione)', () => {
    const rep = checkTrustedLock(mkRepo());
    expect(rep.ok).toBe(true);
    expect(rep.lock_present).toBe(false);
    expect(rep.notes.length).toBeGreaterThan(0);
  });

  it('seal + check → ok', () => {
    const root = mkRepo();
    const lock = buildLock(root);
    mkdirSync(path.join(root, '.mw'), { recursive: true });
    writeFileSync(path.join(root, LOCK_FILE), JSON.stringify(lock));
    const rep = checkTrustedLock(root);
    expect(rep.ok).toBe(true);
    expect(rep.lock_present).toBe(true);
  });

  it('drift su file protetto → FAIL fail-closed', () => {
    const root = mkRepo();
    const lock = buildLock(root);
    mkdirSync(path.join(root, '.mw'), { recursive: true });
    writeFileSync(path.join(root, LOCK_FILE), JSON.stringify(lock));
    writeFileSync(path.join(root, 'scripts/verification/produceBundle.ts'), 'tampered');
    const rep = checkTrustedLock(root);
    expect(rep.ok).toBe(false);
    expect(rep.errors.some((e) => e.includes('produceBundle.ts'))).toBe(true);
  });

  it('file nuovo nel perimetro non coperto dal lock → FAIL', () => {
    const root = mkRepo();
    const lock = buildLock(root);
    mkdirSync(path.join(root, '.mw'), { recursive: true });
    writeFileSync(path.join(root, LOCK_FILE), JSON.stringify(lock));
    writeFileSync(path.join(root, 'src/ui/idleVillage/frozen/kits/kitNew.ts'), 'new-kit');
    const rep = checkTrustedLock(root);
    expect(rep.ok).toBe(false);
    expect(rep.errors.some((e) => e.includes('non coperto'))).toBe(true);
  });

  it('drift coperto da approvazione Director → ok con nota (trust anchor)', () => {
    const root = mkRepo();
    const lock = buildLock(root);
    mkdirSync(path.join(root, '.mw'), { recursive: true });
    writeFileSync(path.join(root, LOCK_FILE), JSON.stringify(lock));
    // drift sul trust-set
    writeFileSync(path.join(root, 'scripts/verification/produceBundle.ts'), 'tampered');
    // senza approvazione → fail
    expect(checkTrustedLock(root, { approvalsFile: '/nonexistent/ledger.jsonl' }).ok).toBe(false);
    // con approvazione sullo stato corrente → passa con nota
    const ledger = path.join(root, 'approvals.jsonl');
    writeFileSync(
      ledger,
      JSON.stringify({ kind: 'trust-set', set_sha256: setAggregateHash(root), at: '2026-10-18T00:00:00Z' }) + '\n',
    );
    const rep = checkTrustedLock(root, { approvalsFile: ledger });
    expect(rep.ok).toBe(true);
    expect(rep.notes.some((n) => n.includes('approvazione Director'))).toBe(true);
  });

  it('lock falsificato (agente tamper + risigilla) → FAIL se ledger non approva', () => {
    const root = mkRepo();
    const lock = buildLock(root);
    mkdirSync(path.join(root, '.mw'), { recursive: true });
    writeFileSync(path.join(root, LOCK_FILE), JSON.stringify(lock));
    // il ledger ha approvato lo stato ORIGINALE
    const ledger = path.join(root, 'approvals.jsonl');
    writeFileSync(
      ledger,
      JSON.stringify({ kind: 'trust-set', set_sha256: setAggregateHash(root), at: '2026-10-18T00:00:00Z' }) + '\n',
    );
    // l'agente tampera il gate E riscrive il lock per coprire il drift
    writeFileSync(path.join(root, 'scripts/verification/produceBundle.ts'), 'tampered');
    const forged = buildLock(root);
    writeFileSync(path.join(root, LOCK_FILE), JSON.stringify(forged));
    // drift vs lock = zero (forgiato) MA l'aggregato non è approvato → FAIL
    const rep = checkTrustedLock(root, { approvalsFile: ledger });
    expect(rep.ok).toBe(false);
    expect(rep.errors.some((e) => e.includes('non approvato'))).toBe(true);
  });

  it('ledger stabilito + stato corrente approvato → ok anche se lock stantio', () => {
    const root = mkRepo();
    const lock = buildLock(root);
    mkdirSync(path.join(root, '.mw'), { recursive: true });
    writeFileSync(path.join(root, LOCK_FILE), JSON.stringify(lock));
    // drift legittimo + approvazione Director sul NUOVO stato
    writeFileSync(path.join(root, 'scripts/verification/bundle.ts'), 'v2');
    const ledger = path.join(root, 'approvals.jsonl');
    writeFileSync(
      ledger,
      JSON.stringify({ kind: 'trust-set', set_sha256: setAggregateHash(root), at: '2026-10-18T00:00:00Z' }) + '\n',
    );
    const rep = checkTrustedLock(root, { approvalsFile: ledger });
    expect(rep.ok).toBe(true);
    expect(rep.notes.some((n) => n.includes('risigillare'))).toBe(true);
  });
});
