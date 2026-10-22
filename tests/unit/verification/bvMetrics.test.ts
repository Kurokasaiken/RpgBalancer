import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeBvMetrics, loadSeeds, type SeedRecord } from '../../../scripts/verification/bvMetrics';

function mkRepo() {
  const root = mkdtempSync(path.join(tmpdir(), 'bvm-'));
  mkdirSync(path.join(root, '.mw', 'runs'), { recursive: true });
  return root;
}

function addBundle(root: string, run: string, producedAt: string, verdict = 'PASS') {
  const dir = path.join(root, '.mw', 'runs', run);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    path.join(dir, 'bundle.json'),
    JSON.stringify({ task: 'T', run_id: run, produced_at: producedAt, verdict }),
  );
}

function writeJsonl(root: string, rel: string, rows: object[]) {
  writeFileSync(path.join(root, rel), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
}

function addReg(root: string, name: string, content: string) {
  mkdirSync(path.join(root, '.mw', 'regression'), { recursive: true });
  writeFileSync(path.join(root, '.mw', 'regression', name), content);
}

describe('computeBvMetrics (PLAN-044 T-007)', () => {
  it('calcola dispositions/closure, wait, found-by e zero_defect', () => {
    const root = mkRepo();
    // 3 closure: 1 pre-baseline, 2 post.
    addBundle(root, 'r1', '2026-10-15T10:00:00Z');
    addBundle(root, 'r2', '2026-10-18T10:00:00Z');
    addBundle(root, 'r3', '2026-10-19T10:00:00Z');
    // boundary = primo director_answer (era dispositions ≈ T-003).
    writeJsonl(root, '.mw/director-answers.jsonl', [
      { kind: 'gate_diff', answered_at: '2026-10-17T21:00:00Z' },
      { kind: 'coverage_exception', exception_id: 'EX-1', answered_at: '2026-10-18T12:30:00Z' },
    ]);
    writeJsonl(root, '.mw/mapping-approvals.jsonl', [
      { approved_at: '2026-10-18T09:00:00Z' },
      { approved_at: '2026-10-19T09:00:00Z' },
    ]);
    writeJsonl(root, '.mw/coverage-exceptions.jsonl', [
      { id: 'EX-1', unverified_behavior: true, created_at: '2026-10-18T12:00:00Z' },
      { id: 'EX-2', unverified_behavior: true, created_at: '2026-10-19T00:00:00Z' },
    ]);
    addReg(
      root,
      'REG-001.md',
      '# REG-001\n**found-by:** `director`\nFix 2026-10-12\n',
    );
    addReg(
      root,
      'REG-002.md',
      '# REG-002\n**found-by:** `gate`\nFix 2026-10-18\n',
    );
    addReg(root, 'REG-003.md', '# REG-003 senza tag\nFix 2026-10-20\n');
    mkdirSync(path.join(root, '.mw', 'bugs', '2026-10-18-oops'), { recursive: true });
    writeJsonl(root, '.mw/bv-seeds.jsonl', [
      { kind: 'defect', file: 'src/game/x.ts', detected_by: 'gate', seeded_at: '2026-10-18T00:00:00Z' },
      { kind: 'mismapping', file: 'src/game/y.ts', detected_by: 'none', seeded_at: '2026-10-18T00:00:00Z' },
    ]);

    const m = computeBvMetrics(root);
    expect(m.closures.total).toBe(3);
    expect(m.closures.pre).toBe(1);
    expect(m.closures.post).toBe(2);
    expect(m.dispositions.total).toBe(4);
    expect(m.dispositions.pre).toBe(0);
    expect(m.director_dispositions_per_closure.post).toBe(2); // 4 disp / 2 closure
    expect(m.awaiting_director_wait_minutes.samples).toBe(1);
    expect(m.awaiting_director_wait_minutes.median).toBe(30);
    expect(m.awaiting_director_wait_minutes.pending).toBe(1); // EX-2
    expect(m.found_by.director).toBe(1);
    expect(m.found_by.gate).toBe(1);
    expect(m.reg_without_found_by).toBe(1);
    expect(m.zero_defect_closures).toBe(1); // r3: REG-003+bug sono nella finestra di r2/r3?
    expect(m.seeds.total).toBe(2);
    expect(m.seeds.by_kind.defect).toBe(1);
    expect(m.seeds.by_detected_by.none).toBe(1);
    expect(m.trend.verdict).toBe('INSUFFICIENT_DATA'); // volume < min
  });

  it('flagga rubber-stamp se la mediana dei wait è sotto floor', () => {
    const root = mkRepo();
    for (let i = 0; i < 10; i++) {
      addBundle(root, `r${i}`, `2026-10-1${i}T10:00:00Z`);
    }
    writeJsonl(root, '.mw/director-answers.jsonl', [
      { kind: 'gate_diff', answered_at: '2026-10-01T00:00:00Z' },
      ...Array.from({ length: 9 }, (_, i) => ({
        kind: 'coverage_exception',
        exception_id: `E${i}`,
        answered_at: `2026-10-0${i + 1}T00:00:30Z`,
      })),
    ]);
    writeJsonl(
      root,
      '.mw/coverage-exceptions.jsonl',
      Array.from({ length: 9 }, (_, i) => ({
        id: `E${i}`,
        unverified_behavior: true,
        created_at: `2026-10-0${i + 1}T00:00:00Z`,
      })),
    );
    const m = computeBvMetrics(root);
    expect(m.awaiting_director_wait_minutes.median).toBe(0.5);
    expect(m.trend.verdict).toBe('RUBBER_STAMP_RISK');
  });

  it('INSUFFICIENT_DATA su repo vuoto', () => {
    const m = computeBvMetrics(mkRepo());
    expect(m.closures.total).toBe(0);
    expect(m.trend.verdict).toBe('INSUFFICIENT_DATA');
  });

  it('loadSeeds legge il journal append-only', () => {
    const root = mkRepo();
    const recs: SeedRecord[] = [
      { kind: 'defect', file: 'a.ts', detected_by: 'gate', seeded_at: '2026-10-19T00:00:00Z' },
    ];
    writeJsonl(root, '.mw/bv-seeds.jsonl', recs);
    expect(loadSeeds(root)).toHaveLength(1);
    expect(loadSeeds(root)[0].kind).toBe('defect');
  });
});
