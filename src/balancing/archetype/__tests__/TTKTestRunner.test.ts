import { TTKTestRunner } from '../TTKTestRunner';
import { DEFAULT_ARCHETYPES } from '../constants';
import { ArchetypeTemplate } from '../types';

describe('TTKTestRunner', () => {
    // Pick two distinct archetypes for testing
    const tank = DEFAULT_ARCHETYPES.find(a => a.id === 'tank_juggernaut') as ArchetypeTemplate;
    const dps = DEFAULT_ARCHETYPES.find(a => a.id === 'dps_berserker') as ArchetypeTemplate;

    if (!tank || !dps) {
        throw new Error('Default archetypes not found for testing');
    }

    it('should run a single matchup simulation', () => {
        const result = TTKTestRunner.runMatchup({
            archetypeA: tank,
            archetypeB: dps,
            budget: 50,
            numSimulations: 10, // Small number for unit test speed
            maxRounds: 50
        });

        expect(result).toBeDefined();
        expect(result.matchup.archetypeA).toBe(tank.id);
        expect(result.matchup.archetypeB).toBe(dps.id);
        expect(result.totalSimulations).toBe(10);
        expect(result.winnerCounts.A + result.winnerCounts.B).toBeLessThanOrEqual(10);

        // Check stats structure
        expect(result.roundsToKill.avg).toBeGreaterThan(0);
        expect(result.roundsToKill.min).toBeLessThanOrEqual(result.roundsToKill.max);
        expect(result.winRate.A).toBeGreaterThanOrEqual(0);
        expect(result.winRate.A).toBeLessThanOrEqual(1);
    });

    it('should handle mirror matches', () => {
        const result = TTKTestRunner.runMatchup({
            archetypeA: tank,
            archetypeB: tank,
            budget: 50,
            numSimulations: 10
        });

        expect(result.matchup.archetypeA).toBe(tank.id);
        expect(result.matchup.archetypeB).toBe(tank.id);
        // Mirror match should be roughly even, but with 10 sims variance is high
        // Just check it runs without error
        expect(result.totalSimulations).toBe(10);
    });

    it('should respect maxRounds', () => {
        // Create a very tanky matchup with low damage that should timeout
        // Or just set maxRounds very low
        const result = TTKTestRunner.runMatchup({
            archetypeA: tank,
            archetypeB: tank,
            budget: 100, // High HP
            numSimulations: 5,
            maxRounds: 1 // Should end immediately
        });

        expect(result.roundsToKill.max).toBeLessThanOrEqual(2); // 1 or 2 depending on implementation
    });

    it('should run a matrix of matchups', () => {
        const subset = [tank, dps];
        const results = TTKTestRunner.runMatrix(subset, 50, 5);

        // 2 archetypes -> 2x2 = 4 matchups
        expect(results.length).toBe(4);

        // Check specific matchups exist
        const tankVsDps = results.find(r => r.matchup.archetypeA === tank.id && r.matchup.archetypeB === dps.id);
        expect(tankVsDps).toBeDefined();
    });

    it('should scale with budget', () => {
        // Test at 20 budget vs 100 budget
        // Higher budget usually means longer TTK if HP scales faster than Damage, 
        // or same TTK if balanced. But raw stats should be higher.
        // Actually, in this system, HP and Damage scale linearly with budget.
        // So TTK might remain similar if both scale equally.
        // However, we just want to ensure it runs.

        const lowBudget = TTKTestRunner.runMatchup({
            archetypeA: dps,
            archetypeB: dps,
            budget: 20,
            numSimulations: 5
        });

        const highBudget = TTKTestRunner.runMatchup({
            archetypeA: dps,
            archetypeB: dps,
            budget: 100,
            numSimulations: 5
        });

        expect(lowBudget.budget).toBe(20);
        expect(highBudget.budget).toBe(100);
    });
});
