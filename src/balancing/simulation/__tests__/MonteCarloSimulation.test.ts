import { describe, it, expect, vi } from 'vitest';
import { MonteCarloSimulation } from '../MonteCarloSimulation';
import { CombatSimulator } from '../CombatSimulator';
import { BASELINE_STATS } from '../../baseline';
import type { CombatResult } from '../types';

// Mock CombatSimulator to control outcomes
vi.mock('../CombatSimulator', () => ({
    CombatSimulator: {
        simulate: vi.fn()
    }
}));

describe('MonteCarloSimulation', () => {
    const mockEntity1 = { ...BASELINE_STATS, name: 'Entity 1' };
    const mockEntity2 = { ...BASELINE_STATS, name: 'Entity 2' };

    const baseConfig = {
        combat: {
            entity1: mockEntity1,
            entity2: mockEntity2,
            turnLimit: 100
        },
        iterations: 100
    };

    it('should run the specified number of iterations', () => {
        // Mock a simple result
        const mockResult: CombatResult = {
            winner: 'entity1',
            turns: 5,
            damageDealt: { entity1: 100, entity2: 50 },
            hpRemaining: { entity1: 50, entity2: 0 },
            overkill: { entity1: 10, entity2: 0 },
            turnByTurnLog: []
        };

        vi.mocked(CombatSimulator.simulate).mockReturnValue(mockResult);

        const results = MonteCarloSimulation.run(baseConfig);

        expect(CombatSimulator.simulate).toHaveBeenCalledTimes(100);
        expect(results.summary.totalSimulations).toBe(100);
    });

    it('should correctly calculate win rates', () => {
        // Mock 60 wins for entity1, 30 for entity2, 10 draws
        let callCount = 0;
        vi.mocked(CombatSimulator.simulate).mockImplementation(() => {
            callCount++;
            if (callCount <= 60) return { winner: 'entity1', turns: 5, damageDealt: { entity1: 0, entity2: 0 }, hpRemaining: { entity1: 0, entity2: 0 }, overkill: { entity1: 0, entity2: 0 } };
            if (callCount <= 90) return { winner: 'entity2', turns: 5, damageDealt: { entity1: 0, entity2: 0 }, hpRemaining: { entity1: 0, entity2: 0 }, overkill: { entity1: 0, entity2: 0 } };
            return { winner: 'draw', turns: 5, damageDealt: { entity1: 0, entity2: 0 }, hpRemaining: { entity1: 0, entity2: 0 }, overkill: { entity1: 0, entity2: 0 } };
        });

        const results = MonteCarloSimulation.run(baseConfig);

        expect(results.summary.winRates.entity1).toBe(0.6);
        expect(results.summary.winRates.entity2).toBe(0.3);
        expect(results.summary.winRates.draws).toBe(0.1);
    });

    it('should calculate valid confidence intervals', () => {
        // Mock 50/50 split
        let callCount = 0;
        vi.mocked(CombatSimulator.simulate).mockImplementation(() => {
            callCount++;
            return {
                winner: callCount <= 50 ? 'entity1' : 'entity2',
                turns: 5,
                damageDealt: { entity1: 0, entity2: 0 },
                hpRemaining: { entity1: 0, entity2: 0 },
                overkill: { entity1: 0, entity2: 0 }
            };
        });

        const results = MonteCarloSimulation.run(baseConfig);
        const ci1 = results.summary.confidenceIntervals.entity1;

        // Check structure [low, high]
        expect(ci1).toHaveLength(2);
        expect(ci1[0]).toBeLessThanOrEqual(ci1[1]);

        // For 50% win rate with 100 samples:
        // SE = sqrt(0.5 * 0.5 / 100) = 0.05
        // Margin = 1.96 * 0.05 = 0.098
        // Range should be approx 0.402 - 0.598
        expect(ci1[0]).toBeCloseTo(0.402, 2);
        expect(ci1[1]).toBeCloseTo(0.598, 2);
    });

    it('should aggregate combat statistics correctly', () => {
        // Mock variable turns: 2, 4, 6, 8, 10
        const turns = [2, 4, 6, 8, 10];
        let index = 0;
        vi.mocked(CombatSimulator.simulate).mockImplementation(() => {
            const turn = turns[index % turns.length];
            index++;
            return {
                winner: 'entity1',
                turns: turn,
                damageDealt: { entity1: 10 * turn, entity2: 0 }, // DPT = 10
                hpRemaining: { entity1: 0, entity2: 0 },
                overkill: { entity1: 0, entity2: 0 }
            };
        });

        const results = MonteCarloSimulation.run({ ...baseConfig, iterations: 5 });

        expect(results.combatStatistics.minTurns).toBe(2);
        expect(results.combatStatistics.maxTurns).toBe(10);
        expect(results.combatStatistics.averageTurns).toBe(6);
        expect(results.combatStatistics.medianTurns).toBe(6);

        // Check histogram
        expect(results.combatStatistics.turnDistribution[2]).toBe(1);
        expect(results.combatStatistics.turnDistribution[10]).toBe(1);
    });

    it('should calculate damage metrics', () => {
        // Mock constant damage
        vi.mocked(CombatSimulator.simulate).mockReturnValue({
            winner: 'entity1',
            turns: 5,
            damageDealt: { entity1: 100, entity2: 50 }, // DPT: 20, 10
            hpRemaining: { entity1: 50, entity2: 0 },
            overkill: { entity1: 20, entity2: 0 }
        });

        const results = MonteCarloSimulation.run({ ...baseConfig, iterations: 10 });

        expect(results.damageMetrics.entity1.average).toBe(20); // 100 / 5
        expect(results.damageMetrics.entity2.average).toBe(10); // 50 / 5
        expect(results.damageMetrics.averageOverkill.entity1).toBe(20);
    });

    it('should report progress via callback', () => {
        const onProgress = vi.fn();
        const iterations = 2000; // Needs to trigger at least once (every 1000)

        vi.mocked(CombatSimulator.simulate).mockReturnValue({
            winner: 'entity1', turns: 1, damageDealt: { entity1: 0, entity2: 0 }, hpRemaining: { entity1: 0, entity2: 0 }, overkill: { entity1: 0, entity2: 0 }
        });

        MonteCarloSimulation.run({ ...baseConfig, iterations }, onProgress);

        // Should be called at 1000 and 2000
        expect(onProgress).toHaveBeenCalledTimes(2);
        expect(onProgress).toHaveBeenCalledWith(0.5);
        expect(onProgress).toHaveBeenCalledWith(1.0);
    });
});
