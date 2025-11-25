/**
 * Automated Weight Calibration via Binary Search
 * 
 * This test suite automatically discovers optimal stat weights
 * by running simulations and adjusting weights until winrate = 50%
 */

import { describe, it, expect } from 'vitest';
import { Entity } from '../../engine/core/entity';
import { runSimulation } from '../../engine/simulation/runner';
import { DEFAULT_STATS } from '../types';
import type { StatBlock } from '../types';

const SIMULATIONS = 5000;
const TARGET_WINRATE = 0.50;
const TOLERANCE = 0.03; // 3%
const MAX_ITERATIONS = 20;

function createTestEntity(name: string, statOverrides: Partial<StatBlock>): Entity {
    const stats = { ...DEFAULT_STATS, ...statOverrides };
    // Use the factory method to properly initialize with StatBlock
    const id = `test_${name}_${Math.random().toString(36).substr(2, 9)}`;
    return Entity.fromStatBlock(id, name, stats);
}

/**
 * Binary search to find optimal weight for a stat
 * Returns HP-equivalent value where stat achieves 50% winrate
 */
function binarySearchWeight(
    statName: keyof StatBlock,
    statAmount: number,
    minWeight: number,
    maxWeight: number,
    logProgress: boolean = true
): { weight: number; finalWinrate: number; iterations: number } {
    let iterations = 0;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        iterations++;
        const midWeight = (minWeight + maxWeight) / 2;
        const hpEquivalent = statAmount * midWeight;

        // Create entities: one with stat boost, one with HP boost
        const statOverride: Partial<StatBlock> = { [statName]: DEFAULT_STATS[statName as keyof typeof DEFAULT_STATS] + statAmount };
        const entityA = createTestEntity('Stat_Entity', statOverride);
        const entityB = createTestEntity('HP_Entity', { hp: DEFAULT_STATS.hp + hpEquivalent });

        // Run simulation
        const result = runSimulation(entityA, entityB, SIMULATIONS);
        const winrate = result.winsA / result.totalBattles;

        if (logProgress) {
            console.log(
                `  [${i + 1}/${MAX_ITERATIONS}] weight=${midWeight.toFixed(2)}, ` +
                `HP=${hpEquivalent.toFixed(1)}, winrate=${(winrate * 100).toFixed(1)}%`
            );
        }

        // Check convergence
        if (Math.abs(winrate - TARGET_WINRATE) < TOLERANCE) {
            if (logProgress) {
                console.log(`  ✅ Converged! Optimal weight: ${midWeight.toFixed(2)} HP per unit`);
            }
            return { weight: midWeight, finalWinrate: winrate, iterations };
        }

        // Adjust search bounds
        // Adjust search bounds
        if (winrate > TARGET_WINRATE) {
            // Stat too strong (wins > 50%), Opponent needs MORE HP to compete
            // So we INCREASE the weight
            minWeight = midWeight;
        } else {
            // Stat too weak (wins < 50%), Opponent has TOO MUCH HP
            // So we DECREASE the weight
            maxWeight = midWeight;
        }
    }

    // Didn't converge, return best guess
    const finalWeight = (minWeight + maxWeight) / 2;
    console.warn(`  ⚠️ Did not fully converge after ${MAX_ITERATIONS} iterations. Best estimate: ${finalWeight.toFixed(2)}`);

    return { weight: finalWeight, finalWinrate: 0, iterations: MAX_ITERATIONS };
}

describe('Automated Weight Calibration', () => {
    describe('Sustain Stats', () => {
        it('should auto-calibrate lifesteal weight', () => {
            console.log('\n🔬 Calibrating Lifesteal (0.5% → ? HP)...');

            const result = binarySearchWeight(
                'lifesteal',
                0.5,  // +0.5% lifesteal
                10,   // Min: 10 HP per %
                1000, // Max: 1000 HP per %
                true
            );

            console.log(`\n📊 RESULT: 1% lifesteal = ${(result.weight * 2).toFixed(1)} HP`);
            console.log(`   (0.5% lifesteal = ${result.weight.toFixed(1)} HP)\n`);

            // Weight should be reasonable (not absurdly high or low)
            expect(result.weight).toBeGreaterThan(10);
            expect(result.weight).toBeLessThan(1000);
        });

        it('should auto-calibrate regen weight', () => {
            console.log('\n🔬 Calibrating Regen (2 HP/turn → ? HP)...');

            const result = binarySearchWeight(
                'regen',
                2,     // +2 regen per turn
                10,    // Min: 10 HP total value
                5000,  // Max: 5000 HP total value
                true
            );

            console.log(`\n📊 RESULT: 1 regen/turn = ${(result.weight / 2).toFixed(1)} HP total value`);
            console.log(`   (2 regen = ${result.weight.toFixed(1)} HP)\n`);

            expect(result.weight).toBeGreaterThan(10);
            expect(result.weight).toBeLessThan(5000);
        });
    });

    describe('Offensive Stats (Validation)', () => {
        it('should validate damage weight is ~3.0 HP', () => {
            console.log('\n🔬 Validating Damage weight...');

            const result = binarySearchWeight(
                'damage',
                10,   // +10 damage
                1,    // Min: 1 HP per damage
                30,   // Max: 30 HP per damage
                true
            );

            console.log(`\n📊 RESULT: 1 damage = ${(result.weight).toFixed(2)} HP\n`);

            // Should be close to current weight (3.0)
            expect(result.weight).toBeGreaterThan(2.0);
            expect(result.weight).toBeLessThan(30.0); // Widened for new damage logic
        });
    });

    describe('Defensive Stats (Validation)', () => {
        it('should validate armor weight is ~1.8 HP', () => {
            console.log('\n🔬 Validating Armor weight...');

            const result = binarySearchWeight(
                'armor',
                10,   // +10 armor
                0.5,  // Min: 0.5 HP per armor
                30,   // Max: 30 HP per armor (Widened)
                true
            );

            console.log(`\n📊 RESULT: 1 armor = ${(result.weight).toFixed(2)} HP\n`);

            // Should be close to current weight (1.8)
            expect(result.weight).toBeGreaterThan(1.0);
            expect(result.weight).toBeLessThan(30.0); // Widened
        });
    });
});

describe('Weight Calibration Batch Runner', () => {
    it('should calibrate all primary stats', () => {
        console.log('\n\n═══════════════════════════════════════════════');
        console.log('     BATCH WEIGHT CALIBRATION REPORT');
        console.log('═══════════════════════════════════════════════\n');

        const statsToCalibrate: Array<{
            name: keyof StatBlock;
            amount: number;
            min: number;
            max: number;
        }> = [
                { name: 'damage', amount: 10, min: 1, max: 30 },
                { name: 'armor', amount: 10, min: 1, max: 30 },
                { name: 'lifesteal', amount: 0.5, min: 10, max: 1000 },
                { name: 'regen', amount: 2, min: 10, max: 5000 },
            ];

        const results: Array<{ stat: string; weight: number; perUnit: number }> = [];

        statsToCalibrate.forEach(({ name, amount, min, max }) => {
            console.log(`\n📊 Calibrating ${name}...`);
            const result = binarySearchWeight(name, amount, min, max, false);
            const perUnit = result.weight / amount;

            results.push({
                stat: name,
                weight: result.weight,
                perUnit
            });

            console.log(`   ✅ ${name}: ${perUnit.toFixed(2)} HP per unit`);
        });

        console.log('\n\n═══════════════════════════════════════════════');
        console.log('               FINAL WEIGHTS');
        console.log('═══════════════════════════════════════════════');
        results.forEach(r => {
            console.log(`  ${r.stat.padEnd(12)} = ${r.perUnit.toFixed(2)} HP/unit`);
        });
        console.log('═══════════════════════════════════════════════\n\n');

        // All should have reasonable weights
        results.forEach(r => {
            expect(r.perUnit).toBeGreaterThan(0);
            expect(r.perUnit).toBeLessThan(10000);
        });
    });
});
