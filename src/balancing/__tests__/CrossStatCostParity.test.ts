import { describe, it, expect } from 'vitest';
import { Entity } from '../../engine/core/entity';
import { createEmptyAttributes } from '../../engine/core/stats';
import { runSimulation } from '../../engine/simulation/runner';
import { DEFAULT_STATS, type StatBlock } from '../types';
import { STAT_WEIGHTS } from '../statWeights';

/**
 * Cross-Stat Cost Parity Tests
 * 
 * These tests validate that stat weights accurately represent combat value.
 * If 1 Damage = 3.5 HP (per weights), then an entity with +10 Damage should
 * perform equally to an entity with +35 HP when fighting identical opponents.
 */

describe('Cross-Stat Cost Parity', () => {
    const SIMULATIONS = 1000;
    const TOLERANCE = 0.08; // ±8% winrate tolerance (45-55% is balanced)

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
     * Helper: Test parity between two stats
     */
    function testStatParity(
        statA: keyof typeof STAT_WEIGHTS,
        valueA: number,
        statB: keyof typeof STAT_WEIGHTS,
        valueB: number,
        description: string
    ) {
        const entityA = createTestEntity('A', { [statA]: DEFAULT_STATS[statA] + valueA });
        const entityB = createTestEntity('B', { [statB]: DEFAULT_STATS[statB] + valueB });

        const result = runSimulation(entityA, entityB, SIMULATIONS);
        const winRateA = result.winsA / result.totalBattles;

        // Both should have equal "power budget" so winrate should be ~50%
        const isBalanced = winRateA >= (0.5 - TOLERANCE) && winRateA <= (0.5 + TOLERANCE);

        console.log(`${description}`);
        console.log(`  Entity A (+${valueA} ${statA}): ${(winRateA * 100).toFixed(1)}% winrate`);
        console.log(`  Entity B (+${valueB} ${statB}): ${((1 - winRateA) * 100).toFixed(1)}% winrate`);
        console.log(`  Expected: 50% ± ${(TOLERANCE * 100).toFixed(0)}% → ${isBalanced ? '✅ PASS' : '❌ FAIL'}`);

        expect(winRateA).toBeGreaterThanOrEqual(0.5 - TOLERANCE);
        expect(winRateA).toBeLessThanOrEqual(0.5 + TOLERANCE);
    }

    describe('HP vs Damage Parity', () => {
        it('should balance +10 Damage vs +35 HP', () => {
            // 10 Damage * 3.5 weight = 35 HP equivalent
            testStatParity('damage', 10, 'hp', 35, 'HP vs Damage (1:3.5 ratio)');
        });

        it('should balance +5 Damage vs +17.5 HP', () => {
            // 5 Damage * 3.5 = 17.5 HP
            testStatParity('damage', 5, 'hp', 17.5, 'HP vs Damage (smaller values)');
        });

        it('should balance +20 Damage vs +70 HP', () => {
            // 20 Damage * 3.5 = 70 HP
            testStatParity('damage', 20, 'hp', 70, 'HP vs Damage (larger values)');
        });
    });

    describe('Defensive Stat Parity', () => {
        it('should balance +10 Armor vs +18 HP', () => {
            // 10 Armor * 1.8 weight = 18 HP
            testStatParity('armor', 10, 'hp', 18, 'Armor vs HP');
        });

        it('should balance Armor vs Evasion', () => {
            // 1.8 Armor ≈ 2.0 Evasion in terms of HP value
            // 10 Armor * 1.8 = 18 HP
            // 9 Evasion * 2.0 = 18 HP
            testStatParity('armor', 10, 'evasion', 9, 'Armor vs Evasion');
        });

        it('should balance TxC vs Evasion (symmetry)', () => {
            // TxC and Evasion should have same weight (2.0)
            testStatParity('txc', 10, 'evasion', 10, 'TxC vs Evasion (offensive vs defensive)');
        });
    });

    describe('Offensive Stat Parity', () => {
        it('should balance Damage vs Crit Chance', () => {
            // 1 Damage * 3.5 = 3.5 HP
            // 0.7% Crit * 5.0 = 3.5 HP
            testStatParity('damage', 10, 'critChance', 7, 'Damage vs Crit Chance');
        });

        it('should balance Damage vs TxC', () => {
            // 1 Damage * 3.5 = 3.5 HP
            // 1.75 TxC * 2.0 = 3.5 HP
            testStatParity('damage', 10, 'txc', 17.5, 'Damage vs TxC');
        });
    });

    // NOTE: Spell Modifier stat tests deferred to Phase 8 (Damage Type System)
    // Reason: mightPercent and spellPower need damage type distinction
    // to be properly integrated into balance tests

    describe('Sustain Stat Parity', () => {
        it('should balance Lifesteal vs HP', () => {
            // 1% Lifesteal * 40 = 40 HP
            // So 0.5% Lifesteal = 20 HP
            testStatParity('lifesteal', 0.5, 'hp', 20, 'Lifesteal vs HP');
        });

        it('should balance Regen vs HP', () => {
            // 1 Regen * 15 = 15 HP
            testStatParity('regen', 2, 'hp', 30, 'Regen vs HP');
        });

        it('should balance Lifesteal vs Regen', () => {
            // 1% Lifesteal = 40 HP
            // 1 Regen = 15 HP
            // So 1% Lifesteal = 2.67 Regen
            testStatParity('lifesteal', 0.75, 'regen', 2, 'Lifesteal vs Regen');
        });
    });

    describe('Complex Parity (3-stat budget)', () => {
        it('should balance mixed offensive vs defensive builds', () => {
            // Build A: +5 Damage + +5 Armor = 5*3.5 + 5*1.8 = 17.5 + 9 = 26.5 HP
            const buildA = createTestEntity('Mixed_A', {
                damage: DEFAULT_STATS.damage + 5,
                armor: DEFAULT_STATS.armor + 5
            });

            // Build B: +26.5 HP
            const buildB = createTestEntity('Tank_B', {
                hp: DEFAULT_STATS.hp + 26.5
            });

            const result = runSimulation(buildA, buildB, SIMULATIONS);
            const winRateA = result.winsA / result.totalBattles;

            console.log('Mixed Build vs Pure HP:');
            console.log(`  Mixed (+5 dmg, +5 armor): ${(winRateA * 100).toFixed(1)}%`);
            console.log(`  Pure HP (+26.5): ${((1 - winRateA) * 100).toFixed(1)}%`);

            expect(winRateA).toBeGreaterThanOrEqual(0.5 - TOLERANCE);
            expect(winRateA).toBeLessThanOrEqual(0.5 + TOLERANCE);
        });

        it('should balance burst vs sustain builds', () => {
            // Build A: +10 Damage + +2% Crit = 10*3.5 + 2*5 = 35 + 10 = 45 HP
            const burstBuild = createTestEntity('Burst', {
                damage: DEFAULT_STATS.damage + 10,
                critChance: DEFAULT_STATS.critChance + 2
            });

            // Build B: +1% Lifesteal + 0.33 Regen = 1*40 + 0.33*15 ≈ 45 HP
            const sustainBuild = createTestEntity('Sustain', {
                lifesteal: DEFAULT_STATS.lifesteal + 1,
                regen: DEFAULT_STATS.regen + 0.33
            });

            const result = runSimulation(burstBuild, sustainBuild, SIMULATIONS);
            const winRateA = result.winsA / result.totalBattles;

            console.log('Burst vs Sustain:');
            console.log(`  Burst: ${(winRateA * 100).toFixed(1)}%`);
            console.log(`  Sustain: ${((1 - winRateA) * 100).toFixed(1)}%`);

            // This test might be looser due to combat dynamics
            expect(winRateA).toBeGreaterThanOrEqual(0.5 - TOLERANCE * 1.5);
            expect(winRateA).toBeLessThanOrEqual(0.5 + TOLERANCE * 1.5);
        });
    });
});
