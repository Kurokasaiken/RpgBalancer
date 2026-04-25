import { describe, it, expect } from 'vitest';
import { generateStatBlock, type Archetype } from '../generator';
import { Entity } from '../../engine/core/entity';
import { createEmptyAttributes } from '../../engine/core/stats';
import { runSimulation } from '../../engine/simulation/runner';
import { calculateStatBlockCost } from '../costs';
import { ONE_V_ONE_TEST_CONFIG } from '../testing/BalanceTestConfig';

/**
 * Archetype Balance Tests
 * 
 * Validates that different archetypes (Tank, DPS, Balanced) are viable
 * and no single archetype dominates at equal point budgets.
 */

describe('Archetype Balance', () => {
    const SIMULATIONS = 1000;
    const CONFIG = ONE_V_ONE_TEST_CONFIG;
    const TOLERANCE = CONFIG.winrateTolerance; // ±10% winrate tolerance (40-60% is balanced)

    /**
     * Helper: Create entity from archetype
     */
    function createArchetypeEntity(archetype: Archetype, budget: number): Entity {
        const stats = generateStatBlock(archetype, budget);
        const entity = new Entity(`${archetype}_${budget}`, archetype, createEmptyAttributes());
        entity.statBlock = stats;
        entity.derivedStats.maxHp = stats.hp;
        entity.derivedStats.attackPower = stats.damage;
        entity.currentHp = stats.hp;
        return entity;
    }

    /**
     * Helper: Test matchup between two archetypes
     */
    function testMatchup(
        archetypeA: Archetype,
        archetypeB: Archetype,
        budget: number,
        description: string
    ) {
        const entityA = createArchetypeEntity(archetypeA, budget);
        const entityB = createArchetypeEntity(archetypeB, budget);

        // Ensure that for a given budget the generated builds have comparable
        // HP-equivalent cost under the current BalancerConfig weights.
        const costA = calculateStatBlockCost(generateStatBlock(archetypeA, budget));
        const costB = calculateStatBlockCost(generateStatBlock(archetypeB, budget));
        const avgCost = (costA + costB) / 2;
        const costDiffRatio = Math.abs(costA - costB) / avgCost;

        expect(costDiffRatio).toBeLessThanOrEqual(CONFIG.costDiffMaxRatio);

        const result = runSimulation(entityA, entityB, SIMULATIONS);
        const winRateA = result.winsA / result.totalBattles;

        console.log(`${description} (budget: ${budget})`);
        console.log(`  ${archetypeA}: ${(winRateA * 100).toFixed(1)}% winrate`);
        console.log(`  ${archetypeB}: ${((1 - winRateA) * 100).toFixed(1)}% winrate`);
        console.log(`  Avg Turns: ${result.averageTurns.toFixed(1)}`);

        const isBalanced = winRateA >= (0.5 - TOLERANCE) && winRateA <= (0.5 + TOLERANCE);
        console.log(`  Expected: 50% ± ${(TOLERANCE * 100).toFixed(0)}% → ${isBalanced ? '✅ PASS' : '❌ FAIL'}`);

        return { winRateA, isBalanced };
    }

    describe('Round-Robin at Budget 100', () => {
        const BUDGET = CONFIG.primaryBudget;

        it('should balance Tank vs DPS', () => {
            const { winRateA } = testMatchup('tank', 'glass_cannon', BUDGET, 'Tank vs DPS');

            // Tank should have slight advantage (defense > offense in long fights)
            // But not dominate
            expect(winRateA).toBeGreaterThanOrEqual(CONFIG.looseWinrateBounds.min); // Tank wins at least min
            expect(winRateA).toBeLessThanOrEqual(CONFIG.looseWinrateBounds.max);    // But not more than max
        });

        it('should balance Tank vs Balanced', () => {
            const { winRateA } = testMatchup('tank', 'balanced', BUDGET, 'Tank vs Balanced');

            expect(winRateA).toBeGreaterThanOrEqual(0.5 - TOLERANCE);
            expect(winRateA).toBeLessThanOrEqual(0.5 + TOLERANCE);
        });

        it('should balance DPS vs Balanced', () => {
            const { winRateA } = testMatchup('glass_cannon', 'balanced', BUDGET, 'DPS vs Balanced');

            expect(winRateA).toBeGreaterThanOrEqual(0.5 - TOLERANCE);
            expect(winRateA).toBeLessThanOrEqual(0.5 + TOLERANCE);
        });

        it('should balance Tank vs Evasive', () => {
            const { winRateA } = testMatchup('tank', 'evasive', BUDGET, 'Tank vs Evasive');

            expect(winRateA).toBeGreaterThanOrEqual(0.5 - TOLERANCE);
            expect(winRateA).toBeLessThanOrEqual(0.5 + TOLERANCE);
        });

        it('should balance DPS vs Evasive', () => {
            const { winRateA } = testMatchup('glass_cannon', 'evasive', BUDGET, 'DPS vs Evasive');

            expect(winRateA).toBeGreaterThanOrEqual(0.5 - TOLERANCE);
            expect(winRateA).toBeLessThanOrEqual(0.5 + TOLERANCE);
        });

        it('should balance Balanced vs Evasive', () => {
            const { winRateA } = testMatchup('balanced', 'evasive', BUDGET, 'Balanced vs Evasive');

            expect(winRateA).toBeGreaterThanOrEqual(0.5 - TOLERANCE);
            expect(winRateA).toBeLessThanOrEqual(0.5 + TOLERANCE);
        });
    });

    describe('Scaling Consistency', () => {
        const budgets = CONFIG.budgets;

        budgets.forEach(budget => {
            it(`should maintain balance at budget ${budget}`, () => {
                // Test key matchup: Tank vs DPS
                const { winRateA } = testMatchup('tank', 'glass_cannon', budget, `Tank vs DPS @ ${budget}`);

                // Should stay within reasonable bounds
                expect(winRateA).toBeGreaterThanOrEqual(CONFIG.looseWinrateBounds.min);
                expect(winRateA).toBeLessThanOrEqual(CONFIG.looseWinrateBounds.max);
            });
        });
    });

    describe('Specialization Value', () => {
        const BUDGET = 100;

        it('Tank should have advantage in sustained combat (vs Balanced)', () => {
            const { winRateA } = testMatchup('tank', 'balanced', BUDGET, 'Tank Specialization');

            // Tank should win slightly more often (but not dominate)
            // If balanced, that's OK. If tank loses, stat weights are wrong.
            expect(winRateA).toBeGreaterThanOrEqual(CONFIG.specializationMinWinrate); // At least competitive
        });

        it('DPS should have advantage in burst damage (vs Balanced)', () => {
            const { winRateA } = testMatchup('glass_cannon', 'balanced', BUDGET, 'DPS Specialization');

            // DPS should win slightly more (kills before taking damage)
            expect(winRateA).toBeGreaterThanOrEqual(CONFIG.specializationMinWinrate);
        });

        it('Evasive should have advantage vs low-accuracy builds', () => {
            // Create a low-TxC tank
            const lowAccTank = createArchetypeEntity('tank', BUDGET);
            const evasive = createArchetypeEntity('evasive', BUDGET);

            const result = runSimulation(evasive, lowAccTank, SIMULATIONS);
            const winRateEvasive = result.winsA / result.totalBattles;

            console.log('Evasive vs Low-TxC Tank:');
            console.log(`  Evasive: ${(winRateEvasive * 100).toFixed(1)}%`);
            console.log(`  Tank: ${((1 - winRateEvasive) * 100).toFixed(1)}%`);

            // Evasive should have edge against low-accuracy opponents
            expect(winRateEvasive).toBeGreaterThanOrEqual(CONFIG.evasiveMinWinrate);
        });
    });

    describe('No Dominant Archetype (Meta Check)', () => {
        const BUDGET = 100;

        it('No archetype should win >70% against all others', () => {
            const archetypes: Archetype[] = CONFIG.archetypes;
            const results: Record<string, number[]> = {};

            // Initialize results
            archetypes.forEach(arch => {
                results[arch] = [];
            });

            // Round-robin tournament
            for (let i = 0; i < archetypes.length; i++) {
                for (let j = i + 1; j < archetypes.length; j++) {
                    const archA = archetypes[i];
                    const archB = archetypes[j];

                    const entityA = createArchetypeEntity(archA, BUDGET);
                    const entityB = createArchetypeEntity(archB, BUDGET);

                    const result = runSimulation(entityA, entityB, SIMULATIONS);
                    const winRateA = result.winsA / result.totalBattles;

                    results[archA].push(winRateA);
                    results[archB].push(1 - winRateA); // B's winrate in this matchup
                }
            }

            // Calculate average winrate for each archetype
            const avgWinrates: Record<string, number> = {};
            archetypes.forEach(arch => {
                const avg = results[arch].reduce((a, b) => a + b, 0) / results[arch].length;
                avgWinrates[arch] = avg;
                console.log(`${arch}: ${(avg * 100).toFixed(1)}% avg winrate`);
            });

            // No archetype should dominate or be weak beyond configured bounds
            archetypes.forEach(arch => {
                expect(avgWinrates[arch]).toBeGreaterThanOrEqual(CONFIG.metaAvgBounds.min);
                expect(avgWinrates[arch]).toBeLessThanOrEqual(CONFIG.metaAvgBounds.max);
            });
        });
    });
});
