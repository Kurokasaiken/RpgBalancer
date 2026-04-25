import type { Archetype } from '../generator';

export interface OneVOneMatrixConfig {
  /** Number of archetypes from the test registry to include in matrix regression tests. */
  subsetSize: number;
  /** RNG seed used for deterministic matrix runs. */
  seed: number;
  /** Turn limit passed to the combat simulator. */
  turnLimit: number;
  /** Acceptable range for average TTK (turns) across the full matrix. */
  avgTurnsBounds: { min: number; max: number };
}

export interface OneVOneTestConfig {
  /** Legacy archetype ids used in high-level balance tests. */
  archetypes: Archetype[];
  /** Budgets (in HP-equivalent points) used across balance tests. */
  budgets: number[];
  /** Primary budget tier for detailed matchup and meta checks. */
  primaryBudget: number;
  /** Tight winrate tolerance around 50% (e.g. 0.1 => 40-60%). */
  winrateTolerance: number;
  /** Maximum allowed relative difference in HP-equivalent cost between two builds at the same budget. */
  costDiffMaxRatio: number;
  /** Loose bounds for winrate sanity checks (e.g. 0.3-0.7). */
  looseWinrateBounds: { min: number; max: number };
  /** Bounds for average winrate per archetype in meta checks. */
  metaAvgBounds: { min: number; max: number };
  /** Minimum winrate expected for specialization advantage tests (e.g. Tank vs Balanced). */
  specializationMinWinrate: number;
  /** Minimum winrate expected for evasive advantage vs low-accuracy builds. */
  evasiveMinWinrate: number;
  /** Shared config for 1v1 matrix regression tests. */
  matrix: OneVOneMatrixConfig;
}

export const ONE_V_ONE_TEST_CONFIG: OneVOneTestConfig = {
  archetypes: ['balanced', 'tank', 'glass_cannon', 'evasive'],
  budgets: [50, 100, 150, 200],
  primaryBudget: 100,
  winrateTolerance: 0.1, // 40-60% as "balanced" window
  costDiffMaxRatio: 0.2, // builds at same budget should not differ by more than ±20% cost
  looseWinrateBounds: {
    min: 0.3,
    max: 0.7,
  },
  metaAvgBounds: {
    min: 0.3,
    max: 0.7,
  },
  specializationMinWinrate: 0.45,
  evasiveMinWinrate: 0.4,
  matrix: {
    subsetSize: 4,
    seed: 12345,
    turnLimit: 20,
    avgTurnsBounds: {
      min: 2,
      max: 20,
    },
  },
};
