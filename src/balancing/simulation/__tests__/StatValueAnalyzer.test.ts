import { describe, it, expect, vi } from 'vitest';
import { StatValueAnalyzer } from '../StatValueAnalyzer';
import { MonteCarloSimulation } from '../MonteCarloSimulation';
import { BASELINE_STATS } from '../../baseline';

// Mock MonteCarloSimulation to control win rates
vi.mock('../MonteCarloSimulation', () => ({
    MonteCarloSimulation: {
        run: vi.fn()
    }
}));

describe('StatValueAnalyzer', () => {
    it('should calibrate a stat correctly', () => {
        // Scenario: 1 Damage = 5 HP
        // If we add 10 Damage, we expect Equilibrium HP to be +50

        vi.mocked(MonteCarloSimulation.run).mockImplementation((config) => {
            const defenderHP = config.combat.entity1.hp;
            const targetEquilibrium = BASELINE_STATS.hp + 50; // 10 dmg * 5 weight

            // If HP < Target, lose (< 0.48)
            // If HP > Target, win (> 0.52)
            // If HP approx Target, draw (~0.50)

            let winRate = 0.5;
            if (defenderHP < targetEquilibrium - 2) winRate = 0.40;
            else if (defenderHP > targetEquilibrium + 2) winRate = 0.60;
            else winRate = 0.50;

            return {
                summary: {
                    winRates: { entity1: winRate, entity2: 1 - winRate, draws: 0 },
                    totalSimulations: config.iterations,
                    confidenceIntervals: { entity1: [0, 0], entity2: [0, 0] }
                },
                combatStatistics: {} as any,
                damageMetrics: {} as any,
                hpEfficiency: {} as any,
                sampleCombats: []
            };
        });

        const result = StatValueAnalyzer.calibrateStat('damage', 10);

        // Expect weight to be close to 5.0
        expect(result.stat).toBe('damage');
        expect(result.weight).toBeCloseTo(5.0, 1);
        expect(result.confidence).toBeGreaterThan(0.8);
    });
});
