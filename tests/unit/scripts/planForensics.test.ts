/**
 * Unit tests for planForensics (PLAN-048 / R-217).
 *
 * Covers the pure core on synthetic fixtures: commit classification
 * (code/docs/governance/tests/mixed), entity attribution (subject + path),
 * interval attribution incl. gap→wait, plan richness, Spearman, git-log
 * parsing.
 */

import { describe, it, expect } from 'vitest';
import {
  attributeCommit,
  attributeIntervals,
  churnShares,
  classifyCommit,
  classShares,
  computeRichness,
  fileChurn,
  outOfPlanBreakdown,
  outOfPlanShare,
  planFeatures,
  planNamedPaths,
  parseGitLog,
  spearman,
  WAIT_GAP_MS,
  type EntityEvent,
  type RawCommit,
} from '../../../scripts/planForensics';

const commit = (subject: string, files: string[], at = '2026-10-18T10:00:00Z'): RawCommit => ({
  sha: 'a'.repeat(40),
  at,
  subject,
  files: files.map((p) => ({ status: 'M', path: p })),
});

describe('classifyCommit / classShares', () => {
  it('classifies code commits', () => {
    expect(classifyCommit(['src/ui/x.tsx', 'src/engine/y.ts'])).toBe('code');
  });
  it('classifies docs commits', () => {
    expect(classifyCommit(['RICHIESTE.md', 'context/INDEX.md', 'plans/PLAN-048-x.md'])).toBe(
      'docs',
    );
  });
  it('classifies governance commits', () => {
    expect(
      classifyCommit(['scripts/verification/gateCore.ts', '.windsurf/rules/00-x.md']),
    ).toBe('governance');
    expect(classifyCommit(['scripts/closureLint.ts'])).toBe('governance');
  });
  it('classifies tests commits', () => {
    expect(classifyCommit(['tests/unit/x.test.ts', 'tests/e2e/y.spec.ts'])).toBe('tests');
  });
  it('marks mixed commits and reports shares', () => {
    const files = ['src/x.ts', 'src/y.ts', 'RICHIESTE.md', 'context/Z.md'];
    expect(classifyCommit(files)).toBe('mixed');
    const s = classShares(files);
    expect(s.code).toBeCloseTo(0.5);
    expect(s.docs).toBeCloseTo(0.5);
  });
  it('falls back to other for unknown roots', () => {
    expect(classifyCommit(['weird/thing.xyz'])).toBe('other');
  });
  it('weights classes by churn lines in numstat', () => {
    const ns = '900\t10\tsrc/ui/Big.tsx\n5\t2\tREADME.md\n-\t-\tpublic/x.png';
    const s = churnShares(ns);
    expect(s.code).toBeGreaterThan(0.9);
    expect(s.docs).toBeLessThan(0.05);
    expect((s.assets ?? 0) > 0).toBe(true);
  });
  it('handles empty / malformed numstat', () => {
    expect(churnShares('')).toEqual({});
    expect(churnShares('garbage\nno tabs here')).toEqual({});
  });
});

describe('attributeCommit', () => {
  it('attributes by subject id with high confidence', () => {
    const r = attributeCommit(commit('PLAN-044 T-002: gate', ['src/x.ts']));
    expect(r).toEqual([{ entity: 'PLAN-044', confidence: 'high' }]);
  });
  it('attributes by plan file path with low confidence', () => {
    const r = attributeCommit(commit('write spec', ['plans/PLAN-048-foo.md']));
    expect(r).toEqual([{ entity: 'PLAN-048', confidence: 'low' }]);
  });
  it('normalizes sub-plan ids to the parent plan', () => {
    const r = attributeCommit(commit('PLAN-043-S8 landed', ['src/x.ts']));
    expect(r[0].entity).toBe('PLAN-043');
  });
  it('returns empty when nothing matches', () => {
    expect(attributeCommit(commit('chore: cleanup', ['src/x.ts']))).toEqual([]);
  });
});

describe('attributeIntervals', () => {
  const ev = (at: string, kind: EntityEvent['kind'], cls?: EntityEvent['cls']): EntityEvent => ({
    entity: 'R-1',
    kind,
    at,
    cls,
    confidence: 'high',
  });
  it('attributes intervals to the closing event class', () => {
    const out = attributeIntervals([
      ev('2026-10-18T10:00:00Z', 'entry-created'),
      ev('2026-10-18T10:10:00Z', 'commit', 'code'),
      ev('2026-10-18T10:20:00Z', 'commit', 'docs'),
    ]);
    expect(out).toEqual([
      { phase: 'code', ms: 600_000 },
      { phase: 'docs', ms: 600_000 },
    ]);
  });
  it('turns long gaps into wait', () => {
    const out = attributeIntervals([
      ev('2026-10-18T10:00:00Z', 'entry-created'),
      ev('2026-10-18T12:00:00Z', 'commit', 'code'),
    ]);
    expect(out[0].phase).toBe('wait');
    expect(out[0].ms).toBeGreaterThan(WAIT_GAP_MS);
  });
  it('handles single-event timelines', () => {
    expect(attributeIntervals([ev('2026-10-18T10:00:00Z', 'bundle')])).toEqual([]);
  });
});

describe('computeRichness', () => {
  it('counts lines, obligations, rulings and file targets', () => {
    const r = computeRichness(
      '# PLAN-001\n' +
        '- OB-1: something\n- OB-2: other\n- BV-3: gate\n' +
        'Director: «procedi» — *"approvo, procedi"*\n' +
        'touches src/ui/x.tsx and tests/y.spec.ts\n',
      3,
    );
    expect(r.obligations).toBe(3);
    expect(r.directorRulings).toBeGreaterThanOrEqual(2);
    expect(r.fileTargets).toBeGreaterThanOrEqual(2);
    expect(r.debateArtifacts).toBe(3);
    expect(r.score).toBeGreaterThan(0);
  });
});

describe('spearman', () => {
  it('returns 1 for perfectly correlated ranks', () => {
    expect(spearman([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])).toBeCloseTo(-1);
    expect(spearman([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBeCloseTo(1);
  });
  it('returns null under n<4', () => {
    expect(spearman([1, 2, 3], [1, 2, 3])).toBeNull();
  });
});

describe('parseGitLog', () => {
  it('parses name-status records', () => {
    const text =
      '\x1f' + 'a'.repeat(40) + '\x1f2026-10-18T10:00:00Z\x1fPLAN-048: miner\x1e\n' +
      'M\tsrc/x.ts\nA\tplans/PLAN-048-foo.md\n' +
      '\x1f' + 'b'.repeat(40) + '\x1f2026-10-18T11:00:00Z\x1fdocs: update\x1e\n' +
      'M\tRICHIESTE.md\n';
    const commits = parseGitLog(text);
    expect(commits).toHaveLength(2);
    expect(commits[0].sha).toBe('a'.repeat(40));
    expect(commits[0].files).toEqual([
      { status: 'M', path: 'src/x.ts' },
      { status: 'A', path: 'plans/PLAN-048-foo.md' },
    ]);
  });
});

describe('PLAN-059: plan features + rework', () => {
  it('planNamedPaths: path src/ ≥3 segmenti, niente glob `**`', () => {
    const t = 'tocca `src/ui/idleVillage/x.tsx` e src/ui/idleVillage/, non `src/ui/**` né `src/`';
    expect(planNamedPaths(t).sort()).toEqual([
      'src/ui/idleVillage',
      'src/ui/idleVillage/x.tsx',
    ]);
    expect(planNamedPaths('nessun path')).toEqual([]);
  });
  it('planFeatures: conta path, obbligazioni, traps, righe', () => {
    const f = planFeatures(
      '# plan\n## Obbligazioni\n- OB-1: x\ntraps T-04 e T-13\nsrc/a/b.ts\n',
    );
    expect(f.has_obligations).toBe(true);
    expect(f.files_named).toBe(1);
    expect(f.traps_cited).toBeGreaterThanOrEqual(2);
  });
  it('fileChurn + outOfPlanShare: churn su file fuori scope', () => {
    const churn = fileChurn('10\t5\tsrc/a/b.ts\n20\t0\tsrc/other/c.ts\n');
    expect(churn.get('src/a/b.ts')).toBe(15);
    expect(outOfPlanShare(churn, ['src/a/b.ts'])).toBeCloseTo(20 / 35);
    expect(outOfPlanShare(churn, ['src/a', 'src/other'])).toBe(0);
    expect(outOfPlanShare(new Map(), ['src/a'])).toBeNull();
  });
});

describe('PLAN-059: out-of-plan split', () => {
  it('separa bookkeeping da scope discovery', () => {
    const churn = new Map([
      ['RICHIESTE.md', 40],
      ['src/ui/x.ts', 40],
      ['src/named/y.ts', 20],
    ]);
    const b = outOfPlanBreakdown(churn, ['src/named'])!;
    expect(b.bookkeeping).toBeCloseTo(0.4);
    expect(b.scope).toBeCloseTo(0.4);
    expect(b.bookkeeping + b.scope).toBeCloseTo(0.8);
  });
});
