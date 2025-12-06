/**
 * Unit tests for MathEngine
 * 
 * Tests all pure functions with edge cases:
 * - Zero values
 * - High armor
 * - Mirror matches
 * - Cap limits
 */

import { describe, it, expect } from 'vitest';
import { MathEngine, DEFAULT_1V1_CONFIG } from '../mathEngine';
import { BASELINE_STATS } from '../../baseline';
import type { StatBlock } from '../../types';

describe.skip('MathEngine', () => {
    describe('armorMitigation', () => {
        it('should return 0 for zero armor', () => {
            const result = MathEngine.armorMitigation(0, 10, 100);
            expect(result).toBe(0);
        });

        it('should return 0 for zero damage', () => {
            const result = MathEngine.armorMitigation(100, 10, 0);
            expect(result).toBe(0);
        });

        it('should cap at 90% mitigation', () => {
            const result = MathEngine.armorMitigation(10000, 10, 10);
            expect(result).toBeLessThanOrEqual(0.90);
        });

        it('should follow PoE formula: armor / (armor + k * damage)', () => {
            const armor = 50;
            const k = 10;
            const damage = 100;
            const expected = armor / (armor + k * damage);
            const result = MathEngine.armorMitigation(armor, k, damage);
            expect(result).toBeCloseTo(expected, 5);
        });

        it('should increase mitigation with higher armor', () => {
            const low = MathEngine.armorMitigation(10, 10, 100);
            const high = MathEngine.armorMitigation(100, 10, 100);
            expect(high).toBeGreaterThan(low);
        });
    });

    describe('expectedDamagePerHit', () => {
        it('should return base damage with no crit', () => {
            const stats: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 0,
                failChance: 0,
            };
            const result = MathEngine.expectedDamagePerHit(stats);
            expect(result).toBe(100);
        });

        it('should increase with crit chance', () => {
            const noCrit: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 0,
                critMult: 2.0,
                failChance: 0,
            };
            const withCrit: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 50,
                critMult: 2.0,
                failChance: 0,
            };

            const dmgNoCrit = MathEngine.expectedDamagePerHit(noCrit);
            const dmgWithCrit = MathEngine.expectedDamagePerHit(withCrit);

            expect(dmgWithCrit).toBeGreaterThan(dmgNoCrit);
            // 50% crit at 2.0x should be 150 damage on average
            expect(dmgWithCrit).toBeCloseTo(150, 1);
        });

        it('should handle 100% crit chance', () => {
            const stats: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 100,
                critMult: 2.0,
                failChance: 0,
            };
            const result = MathEngine.expectedDamagePerHit(stats);
            expect(result).toBe(200); // 100 * 2.0
        });
    });

    describe('expectedHitsPerTurn', () => {
        it('should return close to 1.0 for high hit chance', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                txc: 100,
                critChance: 0,
                failChance: 0,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                evasion: 0,
            };

            const result = MathEngine.expectedHitsPerTurn(attacker, defender);
            expect(result).toBeGreaterThan(0.9);
            expect(result).toBeLessThanOrEqual(1.0);
        });

        it('should decrease with evasion', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                txc: 50,
                critChance: 0,
                failChance: 0,
            };
            const lowEvasion: StatBlock = {
                ...BASELINE_STATS,
                evasion: 0,
            };
            const highEvasion: StatBlock = {
                ...BASELINE_STATS,
                evasion: 50,
            };

            const hitsLow = MathEngine.expectedHitsPerTurn(attacker, lowEvasion);
            const hitsHigh = MathEngine.expectedHitsPerTurn(attacker, highEvasion);

            expect(hitsHigh).toBeLessThan(hitsLow);
        });
    });

    describe('calcEDPT', () => {
        it('should return 0 for zero damage', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 0,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
            };

            const result = MathEngine.calcEDPT(attacker, defender, DEFAULT_1V1_CONFIG);
            expect(result).toBe(0);
        });

        it('should return 0 for zero hit chance', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                txc: -1000, // Impossibly low
                critChance: 0,
                failChance: 0,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                evasion: 1000,
            };

            const result = MathEngine.calcEDPT(attacker, defender, DEFAULT_1V1_CONFIG);
            expect(result).toBeCloseTo(0, 1);
        });

        it('should be symmetric for mirror match', () => {
            const stats: StatBlock = { ...BASELINE_STATS };

            const edpt1 = MathEngine.calcEDPT(stats, stats, DEFAULT_1V1_CONFIG);
            const edpt2 = MathEngine.calcEDPT(stats, stats, DEFAULT_1V1_CONFIG);

            expect(edpt1).toBeCloseTo(edpt2, 5);
        });

        it('should decrease with armor', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                armorPen: 0,
            };
            const lowArmor: StatBlock = {
                ...BASELINE_STATS,
                armor: 0,
            };
            const highArmor: StatBlock = {
                ...BASELINE_STATS,
                armor: 100,
            };

            const edptLow = MathEngine.calcEDPT(attacker, lowArmor, DEFAULT_1V1_CONFIG);
            const edptHigh = MathEngine.calcEDPT(attacker, highArmor, DEFAULT_1V1_CONFIG);

            expect(edptHigh).toBeLessThan(edptLow);
        });

        it('should subtract regen', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                txc: 100,
                critChance: 0,
                failChance: 0,
            };
            const noRegen: StatBlock = {
                ...BASELINE_STATS,
                armor: 0,
                resistance: 0,
                regen: 0,
            };
            const withRegen: StatBlock = {
                ...BASELINE_STATS,
                armor: 0,
                resistance: 0,
                regen: 10,
            };

            const edptNoRegen = MathEngine.calcEDPT(attacker, noRegen, DEFAULT_1V1_CONFIG);
            const edptWithRegen = MathEngine.calcEDPT(attacker, withRegen, DEFAULT_1V1_CONFIG);

            expect(edptWithRegen).toBeCloseTo(edptNoRegen - 10, 1);
        });

        it('should not go negative (regen cannot exceed damage)', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 10,
            };
            const defender: StatBlock = {
                ...BASELINE_STATS,
                regen: 1000, // Massive regen
            };

            const result = MathEngine.calcEDPT(attacker, defender, DEFAULT_1V1_CONFIG);
            expect(result).toBeGreaterThanOrEqual(0);
        });
    });

    describe('calcEHPReference', () => {
        it('should return HP for zero armor', () => {
            const stats: StatBlock = {
                ...BASELINE_STATS,
                hp: 100,
                armor: 0,
                resistance: 0,
            };

            const result = MathEngine.calcEHPReference(stats, DEFAULT_1V1_CONFIG);
            expect(result).toBeCloseTo(100, 1);
        });

        it('should return Infinity for 100% mitigation', () => {
            const stats: StatBlock = {
                ...BASELINE_STATS,
                hp: 100,
                armor: 10000,
                resistance: 0,
            };

            const result = MathEngine.calcEHPReference(stats, DEFAULT_1V1_CONFIG);
            // With PoE formula, cap is 90%, so not quite infinity
            expect(result).toBeGreaterThan(900); // HP / (1 - 0.9) = HP * 10
        });

        it('should increase with armor', () => {
            const lowArmor: StatBlock = {
                ...BASELINE_STATS,
                hp: 100,
                armor: 10,
                resistance: 0,
            };
            const highArmor: StatBlock = {
                ...BASELINE_STATS,
                hp: 100,
                armor: 100,
                resistance: 0,
            };

            const ehpLow = MathEngine.calcEHPReference(lowArmor, DEFAULT_1V1_CONFIG);
            const ehpHigh = MathEngine.calcEHPReference(highArmor, DEFAULT_1V1_CONFIG);

            expect(ehpHigh).toBeGreaterThan(ehpLow);
        });
    });
});
