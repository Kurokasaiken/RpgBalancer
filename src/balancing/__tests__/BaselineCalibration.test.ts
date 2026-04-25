import { describe, it, expect } from 'vitest';
import { calibrationResult } from '../calibrateBaseline';

// Minimal sanity checks around the baseline calibration wiring
// This test is intentionally light: it does not enforce a specific
// winrate (0.5) so that DEFAULT_STATS can evolve, but it guards
// against obvious wiring/regression issues.

describe('Baseline Calibration (DEFAULT_STATS vs DEFAULT_STATS)', () => {
  it('should expose a coherent summary linked to the underlying Monte Carlo run', () => {
    const { summary, symmetryTest, raw } = calibrationResult;

    // Simulation counts should be consistent
    expect(summary.simulations).toBe(symmetryTest.simulations);
    expect(summary.simulations).toBe(raw.totalSimulations);

    // Winrates should be proper probabilities
    expect(summary.winrateA).toBeGreaterThanOrEqual(0);
    expect(summary.winrateA).toBeLessThanOrEqual(1);
    expect(summary.winrateB).toBeGreaterThanOrEqual(0);
    expect(summary.winrateB).toBeLessThanOrEqual(1);

    // A and B winrates should approximately sum to 1 (allowing for draws / rounding)
    const sum = summary.winrateA + summary.winrateB;
    expect(sum).toBeGreaterThanOrEqual(0.99);
    expect(sum).toBeLessThanOrEqual(1.01);
  });
});
