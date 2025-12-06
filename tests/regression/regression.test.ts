import { describe, it, expect } from 'vitest';
import { runMatrixCombat } from '../../src/balancing/1v1/matrixRunner';
import { loadTestArchetypes } from '../../src/balancing/1v1/testArchetypes';

// Regression test: ensure the combat matrix runner remains deterministic for a fixed seed
describe('1v1 Matrix Combat Regression', () => {
  it('produces deterministic NxN results for a fixed seed', async () => {
    const archetypes = await loadTestArchetypes();
    const subset = archetypes.slice(0, 4); // keep small for speed

    const firstRun = runMatrixCombat({ archetypes: subset, seed: 12345, turnLimit: 20 });
    const secondRun = runMatrixCombat({ archetypes: subset, seed: 12345, turnLimit: 20 });

    const expectedCells = subset.length * subset.length;
    expect(firstRun.length).toBe(expectedCells);
    expect(secondRun.length).toBe(expectedCells);
    expect(firstRun).toEqual(secondRun);
  });
});