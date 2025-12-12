import { describe, it, expect } from 'vitest';
import { runMatrixCombat } from '../../src/balancing/1v1/matrixRunner';
import { loadTestArchetypes } from '../../src/balancing/1v1/testArchetypes';
import { ONE_V_ONE_TEST_CONFIG } from '../../src/balancing/testing/BalanceTestConfig';

// Regression test: ensure the combat matrix runner remains deterministic for a fixed seed
describe('1v1 Matrix Combat Regression', () => {
  it('produces deterministic NxN results for a fixed seed', async () => {
    const archetypes = await loadTestArchetypes();
    const { subsetSize, seed, turnLimit, avgTurnsBounds } = ONE_V_ONE_TEST_CONFIG.matrix;
    const subset = archetypes.slice(0, subsetSize); // keep small for speed

    const firstRun = runMatrixCombat({ archetypes: subset, seed, turnLimit });
    const secondRun = runMatrixCombat({ archetypes: subset, seed, turnLimit });

    const expectedCells = subset.length * subset.length;
    expect(firstRun.length).toBe(expectedCells);
    expect(secondRun.length).toBe(expectedCells);
    expect(firstRun).toEqual(secondRun);

    const avgTurns = firstRun.reduce((sum, r) => sum + r.turns, 0) / firstRun.length;
    expect(avgTurns).toBeGreaterThanOrEqual(avgTurnsBounds.min);
    expect(avgTurns).toBeLessThanOrEqual(avgTurnsBounds.max);
  });
});