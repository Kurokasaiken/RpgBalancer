import { describe, it, expect } from 'vitest';
import { Entity } from '../../engine/core/entity';
import { createEmptyAttributes } from '../../engine/core/stats';
import { runSimulation } from '../../engine/simulation/runner';
import { DEFAULT_STATS, type StatBlock } from '../types';
import { DynamicWeightCalculator } from '../synergy/DynamicWeightCalculator';
import { STAT_WEIGHTS } from '../statWeights';

/**
 * Diminishing Returns Tests
 * 
 * Validates that defensive stats show diminishing returns as they stack,
 * while offensive stats remain more linear.
 */

describe('Diminishing Returns', () => {
    const SIMULATIONS = 500; // Fewer sims for speed (we're testing curves, not exact values)
    const calculator = new DynamicWeightCalculator(DEFAULT_STATS);

    /**
     * Helper: Create entity with modified stats
     */
    function createTestEntity(name: string, statOverrides: Partial<StatBlock>): Entity {
        const entity = new Entity(`test_${name}`, name, createEmptyAttributes());
        entity.statBlock = { ...DEFAULT_STATS, ...statOverrides };
        entity.derivedStats.maxHp = entity.statBlock.hp;
        entity.derivedStats.attackPower = entity.statBlock.damage;
        entity.currentHp = entity.statBlock.hp;
        return entity;
    }

    /**
     * Helper: Calculate marginal value of adding 1 more of a stat
     */
    async function calculateMarginalValue(baseStats: StatBlock, stat: keyof typeof STAT_WEIGHTS): Promise<number> {
        const results = await calculator.calculateWeights(baseStats, STAT_WEIGHTS);
        const statResult = results.find(r => r.stat === stat);
        return statResult?.dynamicWeight || 0;
    }

    /**
     * Helper: Test if stat shows diminishing returns
     */
    async function testDiminishingReturns(
        stat: keyof typeof STAT_WEIGHTS,
        values: number[],
        description: string
    ) {
        const marginalValues: number[] = [];

        console.log(`\n${description}`);
        console.log(`Testing ${stat} at values: ${values.join(', ')}`);

        for (const value of values) {
            const testStats = { ...DEFAULT_STATS, [stat]: value };
            const marginalValue = await calculateMarginalValue(testStats, stat);
            marginalValues.push(marginalValue);
            console.log(`  @${value} ${stat}: marginal value = ${marginalValue.toFixed(2)} HP`);
        }

        // Check if values are decreasing (diminishing returns)
        let isDecreasing = true;
        for (let i = 1; i < marginalValues.length; i++) {
            if (marginalValues[i] >= marginalValues[i - 1]) {
                isDecreasing = false;
                break;
            }
        }

        console.log(`  Trend: ${isDecreasing ? '✅ Diminishing' : '⚠️ Non-diminishing'}`);
        return { marginalValues, isDecreasing };
    }

    describe('Armor Diminishing Returns', () => {
        it('should show decreasing marginal value as armor increases', async () => {
            const { marginalValues, isDecreasing } = await testDiminishingReturns(
                'armor',
                [10, 30, 50, 100, 200],
                'Armor Curve'
            );

            // Armor should clearly diminish
            expect(isDecreasing).toBe(true);

            // Value at 200 armor should be <50% of value at 10 armor
            expect(marginalValues[4]).toBeLessThan(marginalValues[0] * 0.5);
        });

        it('should have steep drop-off at high values', async () => {
            const lowArmor = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 50 }, 'armor');
            const highArmor = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 150 }, 'armor');

            // At 3x the armor, value should be <70% of original
            expect(highArmor).toBeLessThan(lowArmor * 0.7);
        });
    });

    describe('Evasion Diminishing Returns', () => {
        it('should approach asymptote near cap (95%)', async () => {
            const { marginalValues, isDecreasing } = await testDiminishingReturns(
                'evasion',
                [10, 30, 50, 70, 90],
                'Evasion Curve (approaching cap)'
            );

            expect(isDecreasing).toBe(true);

            // At 90 evasion (near cap), marginal value should be very low
            expect(marginalValues[4]).toBeLessThan(marginalValues[0] * 0.3);
        });
    });

    describe('Crit Chance Diminishing Returns', () => {
        it('should show drop-off near cap (100%)', async () => {
            const { marginalValues } = await testDiminishingReturns(
                'critChance',
                [10, 30, 50, 75, 95],
                'Crit Chance Curve'
            );

            // At 95% crit, adding more should be nearly worthless
            expect(marginalValues[4]).toBeLessThan(marginalValues[0] * 0.2);
        });
    });

    describe('Damage Linearity (Control Test)', () => {
        it('should remain relatively linear', async () => {
            const { marginalValues } = await testDiminishingReturns(
                'damage',
                [20, 40, 60, 80, 100],
                'Damage Curve (should be linear)'
            );

            // Damage should NOT diminish heavily
            // Even at 100 damage, marginal value should be >70% of baseline
            expect(marginalValues[4]).toBeGreaterThan(marginalValues[0] * 0.7);
        });
    });

    describe('HP vs Damage Comparison', () => {
        it('should show HP is more stable than defensive stats', async () => {
            const hpCurve = await testDiminishingReturns(
                'hp',
                [100, 200, 300, 400, 500],
                'HP Curve'
            );

            const armorCurve = await testDiminishingReturns(
                'armor',
                [10, 30, 50, 100, 200],
                'Armor Curve'
            );

            // HP should be more linear than Armor
            const hpVariance = Math.max(...hpCurve.marginalValues) / Math.min(...hpCurve.marginalValues);
            const armorVariance = Math.max(...armorCurve.marginalValues) / Math.min(...armorCurve.marginalValues);

            expect(hpVariance).toBeLessThan(armorVariance);
        });
    });

    describe('Practical Breakpoints', () => {
        it('should identify sweet spots for armor investment', async () => {
            // Test armor at key thresholds
            const armor0 = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 0 }, 'armor');
            const armor20 = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 20 }, 'armor');
            const armor50 = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 50 }, 'armor');
            const armor100 = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 100 }, 'armor');

            console.log('\nArmor Breakpoints:');
            console.log(`  @0 armor: ${armor0.toFixed(2)} HP/point`);
            console.log(`  @20 armor: ${armor20.toFixed(2)} HP/point`);
            console.log(`  @50 armor: ${armor50.toFixed(2)} HP/point`);
            console.log(`  @100 armor: ${armor100.toFixed(2)} HP/point`);

            // First 20 armor should be most valuable
            expect(armor20).toBeGreaterThan(armor50);
            expect(armor50).toBeGreaterThan(armor100);
        });

        it('should identify efficient crit investment range', async () => {
            const crit10 = await calculateMarginalValue({ ...DEFAULT_STATS, critChance: 10 }, 'critChance');
            const crit30 = await calculateMarginalValue({ ...DEFAULT_STATS, critChance: 30 }, 'critChance');
            const crit50 = await calculateMarginalValue({ ...DEFAULT_STATS, critChance: 50 }, 'critChance');
            const crit75 = await calculateMarginalValue({ ...DEFAULT_STATS, critChance: 75 }, 'critChance');

            console.log('\nCrit Chance Breakpoints:');
            console.log(`  @10% crit: ${crit10.toFixed(2)} HP/point`);
            console.log(`  @30% crit: ${crit30.toFixed(2)} HP/point`);
            console.log(`  @50% crit: ${crit50.toFixed(2)} HP/point`);
            console.log(`  @75% crit: ${crit75.toFixed(2)} HP/point`);

            // Sweet spot: 10-50% crit
            // Above 50%, marginal value should drop significantly
            expect(crit10).toBeGreaterThan(crit75 * 1.5);
        });
    });

    describe('Extreme Values (Saturation Test)', () => {
        it('should handle 0 values gracefully', async () => {
            const zeroArmor = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 0 }, 'armor');
            const zeroDamage = await calculateMarginalValue({ ...DEFAULT_STATS, damage: 1 }, 'damage');

            // Should not crash and should return reasonable values
            expect(zeroArmor).toBeGreaterThan(0);
            expect(zeroDamage).toBeGreaterThan(0);
        });

        it('should saturate defensive stats at extreme values', async () => {
            const extremeArmor = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 500 }, 'armor');
            const normalArmor = await calculateMarginalValue({ ...DEFAULT_STATS, armor: 50 }, 'armor');

            // Extreme armor should have VERY low marginal value
            expect(extremeArmor).toBeLessThan(normalArmor * 0.1);
        });
    });
});
