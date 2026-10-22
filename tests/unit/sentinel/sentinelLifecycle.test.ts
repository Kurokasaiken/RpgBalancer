/**
 * PLAN-078 T-005 lifecycle tests — taint guard, ingest lock, repeat-gate
 * aggregation, morning digest. All unit-level: no browser, no dev server.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { acquireIngestLock, fingerprintOf } from '../../../scripts/sentinel/ledgerBridge';
import { snapshotWorktree, worktreeDrifted } from '../../../scripts/sentinel/worktreeTaintGuard';
import { renderDigest } from '../../../scripts/sentinel/morningDigest';
import { applyRepeatGate } from '../../../scripts/sentinel/oracles/index';
import { DEFAULT_SENTINEL_CONFIG } from '../../../scripts/sentinel/sentinelConfig';
import type { GatedFinding, OracleFinding } from '../../../scripts/sentinel/oracles/index';
import type { ResolvedOwnership } from '../../../scripts/sentinel/componentResolver';

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sentinel-life-'));

const OWNER: ResolvedOwnership = {
  component_id: 'quest-run-window',
  surface_id: 'game-hud',
  scope_files: ['src/x.ts'],
  surface_manifest_hash: 'abc',
  confidence: 'root-file',
};

const mkFinding = (over: Partial<OracleFinding> = {}): OracleFinding => ({
  oracle_id: 'geometry:outside-viewport',
  signature: 'sig-001',
  title: 't',
  severity: 'defect',
  state_node: 'S1_WorldMapIdle',
  perturbation_kind: 'VP_SWEEP',
  target: '[data-testid="quest-window"]',
  evidence: {},
  ...over,
});

describe('ingest lock (concurrency safety)', () => {
  it('blocks a second acquisition while held and frees on release', () => {
    const dir = tmp();
    const lock = path.join(dir, '.ingest.lock');
    const release = acquireIngestLock(lock, 'run-a', 60_000);
    expect(() => acquireIngestLock(lock, 'run-b', 60_000)).toThrow(/ingest lock held/);
    release();
    const release2 = acquireIngestLock(lock, 'run-b', 60_000);
    release2();
    expect(fs.existsSync(lock)).toBe(false);
  });

  it('takes over a stale lock', () => {
    const dir = tmp();
    const lock = path.join(dir, '.ingest.lock');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(lock, JSON.stringify({ pid: 1, runId: 'old', at: new Date(Date.now() - 999_999).toISOString() }));
    const release = acquireIngestLock(lock, 'run-c', 60_000);
    release();
  });
});

describe('fingerprint', () => {
  it('is stable across sweep-cell variation', () => {
    const a = fingerprintOf(mkFinding({ cell: '1280x720@1x/en' }) as GatedFinding, OWNER);
    const b = fingerprintOf(mkFinding({ cell: '3440x1440@2x/it-IT' }) as GatedFinding, OWNER);
    expect(a).toBe(b);
  });

  it('normalizes positional/css-module selectors before hashing', () => {
    const a = fingerprintOf(mkFinding({ target: '.quest_window_a1b2c:nth-child(2)' }), OWNER);
    const b = fingerprintOf(mkFinding({ target: '.quest_window' }), OWNER);
    const c = fingerprintOf(mkFinding({ target: '.quest_panel' }), OWNER);
    expect(a).toBe(b); // hash suffix + nth-child normalize away
    expect(c).not.toBe(b); // different semantic class → different fingerprint
  });
});

describe('worktree taint guard (T-13)', () => {
  /* git init+commit on a contended disk can exceed the 5s default —
   * the assertion itself is instant. */
  it('detects drift only when tracked files change', { timeout: 60_000 }, () => {
    const dir = tmp();
    execSync('git init -q && git config user.email t@t && git config user.name t', { cwd: dir });
    fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const x = 1;\n');
    execSync('git add -A && git commit -qm init', { cwd: dir });

    const base = snapshotWorktree(dir);
    expect(worktreeDrifted(base, dir)).toBe(false);

    fs.writeFileSync(path.join(dir, 'src', 'a.ts'), 'export const x = 2;\n');
    expect(worktreeDrifted(base, dir)).toBe(true);
  });
});

describe('repeat gate aggregation', () => {
  const cfg = DEFAULT_SENTINEL_CONFIG.repeatGate;

  it('structural finding in all runs → confirmed', () => {
    const f = mkFinding();
    const gated = applyRepeatGate([[f], [f]], cfg);
    expect(gated[0].gate).toBe('confirmed');
    expect(gated[0].exactMatches).toBe(2);
  });

  it('structural finding in 1-of-2 runs → rejected', () => {
    const f = mkFinding();
    const gated = applyRepeatGate([[f], []], cfg);
    expect(gated[0].gate).toBe('rejected');
  });

  it('temporal finding ≥3-of-5 → confirmed; below → flaky', () => {
    const t = mkFinding({ oracle_id: 'temporal:black-frame', signature_family: 'tf' });
    const five = applyRepeatGate([[t], [t], [t], [], []], cfg);
    expect(five[0].gate).toBe('confirmed');
    const two = applyRepeatGate([[t], [t], [], [], []], cfg);
    expect(two[0].gate).toBe('flaky');
  });

  it('same family with divergent signatures → divergent-observation, never confirmed', () => {
    const a = mkFinding({ oracle_id: 'temporal:desync', signature: 'sigA', signature_family: 'fam1' });
    const b = mkFinding({ oracle_id: 'temporal:desync', signature: 'sigB', signature_family: 'fam1' });
    const gated = applyRepeatGate([[a], [b]], cfg);
    expect(gated.every((g) => g.gate === 'divergent-observation')).toBe(true);
    expect(gated[0].observedSignatures?.sort()).toEqual(['sigA', 'sigB']);
  });
});

describe('morning digest', () => {
  it('groups findings into verdict buckets and flags tainted runs', () => {
    const findings: GatedFinding[] = [
      { ...mkFinding(), exactMatches: 2, familyMatches: 1, gate: 'confirmed', cell: '1440x900@1x/en' },
      { ...mkFinding({ signature: 'sig-flaky', oracle_id: 'temporal:ghost' }), exactMatches: 1, familyMatches: 1, gate: 'flaky' },
      { ...mkFinding({ signature: 'sig-div', severity: 'observation' }), exactMatches: 1, familyMatches: 2, gate: 'divergent-observation' },
    ];
    const md = renderDigest({
      runId: 'sentinel-test',
      startedAt: 'a',
      finishedAt: 'b',
      tainted: true,
      dryRun: true,
      degradedCells: ['S9@cell'],
      unreachedStates: ['S15'],
      findings,
      bridge: null,
    });
    expect(md).toContain('RUN TAINTED');
    expect(md).toContain('Confirmed defects (1)');
    expect(md).toContain('Flaky / race candidates (1)');
    expect(md).toContain('Divergent observations (1)');
    expect(md).toContain('unreached states: S15');
  });
});
