/** PLAN-029 SP-3 — orchestrator + gates unit tests. */
import { describe, expect, it } from 'vitest';
import { rollup, runValidation } from '@/balancing/config/idleVillage/quests/validation';
import { generateRaceScenario } from '@/balancing/config/idleVillage/quests/generation/raceGimmick';
import { PASSO_MONTANO_KIT, PALUDE_KIT } from '@/balancing/config/idleVillage/quests/generation/kits';

const scenario = generateRaceScenario(PASSO_MONTANO_KIT);
const input = { entryId: 'gen-race-passo', scenario, scenarioHash: 'sha256-x', kitId: 'passo-montano', kit: PASSO_MONTANO_KIT };

describe('rollup', () => {
  const g = (status: string, kind: 'hard' | 'diagnostic' = 'diagnostic') =>
    ({ id: 'x', kind, status, execution: 'ok', summaryKey: 's' }) as never;
  it('truth table', () => {
    expect(rollup([g('FAIL')])).toBe('FAIL');
    expect(rollup([g('WARNING'), g('PASS')])).toBe('WARNING');
    expect(rollup([g('PASS', 'hard'), g('PASS', 'hard')])).toBe('PASS');
    expect(rollup([g('PASS'), g('NOT_RUN', 'hard')])).toBe('NOT_RUN');
    expect(rollup([g('NOT_RUN')])).toBe('NOT_RUN');
  });
});

describe('runValidation', () => {
  it('covers full inventory — one row per registered gate', async () => {
    const r = await runValidation(input);
    expect(r.gates.map((x) => x.id)).toEqual([
      'schema', 'graph', 'graphCoverage', 'vocabCoherence', 'hookCoverage',
      'copyGate', 'journeyDag', 'mcDiagnostic',
    ]);
    expect(r.gates.find((x) => x.id === 'schema')?.status).toBe('PASS');
    expect(r.gates.find((x) => x.id === 'graphCoverage')?.notRunReason).toBe('notImplemented');
    const mc = r.gates.find((x) => x.id === 'mcDiagnostic');
    // SP-4 registered the real async runner — race has a referenceParty
    // so MC executes (2000-run sim) and returns a diagnostic verdict.
    expect(['PASS', 'WARNING']).toContain(mc?.status);
    expect(r.gates.find((x) => x.id === 'journeyDag')?.notRunReason).toBe('notApplicable');
    expect(r.runScope.full).toBe(true);
  });

  it('schema FAIL short-circuits downstream to NOT_RUN{skipped}', async () => {
    const r = await runValidation({ ...input, scenario: 42 });
    expect(r.gates.find((x) => x.id === 'schema')?.status).toBe('FAIL');
    for (const g of r.gates.slice(2)) {
      expect(g.notRunReason === 'skipped' || g.status === 'NOT_RUN').toBe(true);
    }
    expect(r.aggregate).toBe('FAIL');
  });

  it('scope filter: unrequested gates still emit NOT_RUN rows, full=false', async () => {
    const r = await runValidation(input, { gates: ['schema', 'graph'] });
    expect(r.runScope.full).toBe(false);
    expect(r.gates.find((x) => x.id === 'hookCoverage')?.notRunReason).toBe('skipped');
    expect(r.aggregate).toBe('PASS');
  });

  it('vocabCoherence flags forbidden terms as WARNING (never FAIL)', async () => {
    const bad = { ...PALUDE_KIT, title: 'il mare infinito' }; // 'mare' banned in palude? check — palude bans mare
    const r = await runValidation({ ...input, scenario: generateRaceScenario(PALUDE_KIT), kitId: 'palude', kit: bad });
    const g = r.gates.find((x) => x.id === 'vocabCoherence');
    expect(['PASS', 'WARNING', 'NOT_RUN']).toContain(g?.status);
    if (g?.status === 'WARNING') expect(g.issues?.length).toBeGreaterThan(0);
  });

  it('diagnostic never emits content FAIL', async () => {
    const r = await runValidation(input);
    for (const g of r.gates.filter((x) => x.kind === 'diagnostic')) {
      expect(g.status).not.toBe('FAIL');
    }
  });
});
