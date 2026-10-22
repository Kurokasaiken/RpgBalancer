import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { latestRunWithManifest, skeletonManifest } from '../../../scripts/verification/bundle';
import { perceptualReached } from '../../../scripts/verification/produceBundle';
import { obligationTier } from '../../../scripts/verification/gateCore';

const tmpDirs: string[] = [];
function mkTmp(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'bundle-'));
  tmpDirs.push(d);
  return d;
}
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true });
});

describe('latestRunWithManifest', () => {
  it('returns null when .mw/runs does not exist', () => {
    expect(latestRunWithManifest(mkTmp())).toBeNull();
  });

  it('returns null when no run contains verification.json', () => {
    const root = mkTmp();
    mkdirSync(path.join(root, '.mw/runs/run-a'), { recursive: true });
    expect(latestRunWithManifest(root)).toBeNull();
  });

  it('picks the most recently modified run with a manifest', () => {
    const root = mkTmp();
    const old = path.join(root, '.mw/runs/run-old');
    const fresh = path.join(root, '.mw/runs/run-new');
    const bare = path.join(root, '.mw/runs/run-bare');
    mkdirSync(old, { recursive: true });
    mkdirSync(bare, { recursive: true });
    writeFileSync(path.join(old, 'verification.json'), '{}');
    mkdirSync(fresh, { recursive: true });
    writeFileSync(path.join(fresh, 'verification.json'), '{}');
    const past = new Date(Date.now() - 60_000);
    const { utimesSync } = require('node:fs') as typeof import('node:fs');
    utimesSync(old, past, past);
    const found = latestRunWithManifest(root);
    expect(found).toBe(fresh);
  });
});

describe('skeletonManifest', () => {
  it('contains blocking state obligations for the standard safeguards', () => {
    const m = skeletonManifest('run-x') as {
      task: string;
      obligations: { id: string; type: string; blocking: boolean; command: string }[];
    };
    expect(m.task).toBe('run-x');
    expect(m.obligations.length).toBeGreaterThanOrEqual(2);
    for (const o of m.obligations) {
      expect(o.type).toBe('state');
      expect(o.blocking).toBe(true);
      expect(o.command.length).toBeGreaterThan(0);
    }
    const cmds = m.obligations.map((o) => o.command).join(' ');
    expect(cmds).toContain('build:check');
    expect(cmds).toContain('closure:lint');
  });
});

describe('tiering per reach (PLAN-051 T-004)', () => {
  const tiers = {
    perceptual_globs: ['src/ui/**', 'src/skins/**'],
    core_globs: ['src/shared/persistence/**', 'src/engine/game/idleVillage/EconomyEngine.ts'],
  };

  it('obbligazioni percettive per default: pixel/fps/human-eye', () => {
    expect(obligationTier({ type: 'pixel-temporal' })).toBe('perceptual');
    expect(obligationTier({ type: 'fps' })).toBe('perceptual');
    expect(obligationTier({ type: 'human-eye' })).toBe('perceptual');
    expect(obligationTier({ type: 'state' })).toBe('deterministic');
    expect(obligationTier({ type: 'state', tier: 'always' })).toBe('always');
  });

  it('diff non visivo → tier percettivo non raggiunto', () => {
    expect(perceptualReached(['src/engine/foo.ts'], tiers)).toBe(false);
  });

  it('file visivo → raggiunto', () => {
    expect(perceptualReached(['src/ui/idleVillage/x.tsx'], tiers)).toBe(true);
  });

  it('modulo core (persistence/economy) → raggiunto (touches-all)', () => {
    expect(perceptualReached(['src/shared/persistence/PersistenceService.ts'], tiers)).toBe(true);
    expect(perceptualReached(['src/engine/game/idleVillage/EconomyEngine.ts'], tiers)).toBe(true);
  });

  it('diff vuoto o config assente → fail-closed (nessun skip)', () => {
    expect(perceptualReached([], tiers)).toBe(true);
    expect(perceptualReached(['src/engine/foo.ts'], null)).toBe(true);
  });
});
