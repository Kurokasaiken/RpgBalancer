import { describe, it, expect } from 'vitest';
import { EHPCalculator } from '../ehp/EHPCalculator';
import { DEFAULT_STATS } from '../types';

/**
 * EHP Calculator Tests
 * Validates that the EHP formulas work correctly
 */

describe('EHPCalculator', () => {
    const calculator = new EHPCalculator();

    describe('Basic EHP Calculation', () => {
        it('should return base HP when no defensive stats', () => {
            const stats = { ...DEFAULT_STATS, hp: 100, armor: 0, resistance: 0, evasion: 0 };
            const result = calculator.calculateEHP(stats);

            expect(result.baseHP).toBe(100);
            expect(result.physicalEHP).toBeCloseTo(100, 1);
            expect(result.magicalEHP).toBeCloseTo(100, 1);
        });

        it('should double EHP with 50% reduction', () => {
            // With 50% reduction, EHP = HP / (1 - 0.5) = HP * 2
            const stats = { ...DEFAULT_STATS, hp: 100, resistance: 50 }; // 50% resist
            const result = calculator.calculateEHP(stats);

            expect(result.magicalEHP).toBeCloseTo(200, 5); // ~200 EHP
        });

        it('should quadruple EHP with 75% reduction', () => {
            // With 75% reduction, EHP = HP / (1 - 0.75) = HP * 4
            const stats = { ...DEFAULT_STATS, hp: 100, resistance: 75 }; // At cap
            const result = calculator.calculateEHP(stats);

            expect(result.magicalEHP).toBeCloseTo(400, 5); // ~400 EHP
        });
    });

    describe('Armor Formula (Damage-Dependent)', () => {
        it('should provide more reduction against small hits', () => {
            const stats = { ...DEFAULT_STATS, hp: 100, armor: 100 };

            // Against 10 damage hit
            const smallHit = calculator.calculateEHP(stats, { physical: 10, magical: 0 });

            // Against 50 damage hit
            const bigHit = calculator.calculateEHP(stats, { physical: 50, magical: 0 });

            // Small hits should have better armor reduction
            expect(smallHit.effectiveArmorReduction).toBeGreaterThan(bigHit.effectiveArmorReduction);
        });

        it('should follow Path of Exile formula: armor / (armor + 10 * damage)', () => {
            const stats = { ...DEFAULT_STATS, armor: 200 };

            // Against 20 damage: 200 / (200 + 10*20) = 200 / 400 = 0.5 = 50%
            const result = calculator.calculateEHP(stats, { physical: 20, magical: 0 });

            expect(result.effectiveArmorReduction).toBeCloseTo(0.5, 2);
        });

        it('should cap armor reduction at 90%', () => {
            const stats = { ...DEFAULT_STATS, armor: 10000 };

            const result = calculator.calculateEHP(stats, { physical: 10, magical: 0 });

            expect(result.effectiveArmorReduction).toBeLessThanOrEqual(0.90);
        });
    });

    describe('Evasion Formula (Asymptotic)', () => {
        it('should cap evasion at 95%', () => {
            const stats = { ...DEFAULT_STATS, evasion: 10000 };

            const result = calculator.calculateEHP(stats);

            expect(result.effectiveEvasionChance).toBeLessThanOrEqual(0.95);
        });

        it('should follow formula: evasion / (evasion + accuracy)', () => {
            const stats = { ...DEFAULT_STATS, evasion: 50 };

            // With 50 accuracy (default): 50 / (50 + 50) = 0.5 = 50%
            const result = calculator.calculateEHP(stats, { accuracy: 50 });

            expect(result.effectiveEvasionChance).toBeCloseTo(0.5, 2);
        });

        it('should multiply EHP by 1/(1-evasion)', () => {
            const stats = { ...DEFAULT_STATS, hp: 100, evasion: 50, armor: 0, resistance: 0 };

            // 50% evasion → EHP multiplier = 1 / (1 - 0.5) = 2x
            const result = calculator.calculateEHP(stats, { accuracy: 50 });

            expect(result.physicalEHP).toBeCloseTo(200, 5); // 100 HP * 2
        });
    });

    describe('Layered Defenses', () => {
        it('should stack armor + evasion multiplicatively', () => {
            const stats = { ...DEFAULT_STATS, hp: 100, armor: 100, evasion: 50 };

            // Armor: 100 / (100 + 10*20) = 0.333 → EHP = 100 / 0.667 = 150
            // Evasion: 50 / (50 + 50) = 0.5 → Multiplier = 2x
            // Total: 150 * 2 = 300
            const result = calculator.calculateEHP(stats, { physical: 20, accuracy: 50 });

            expect(result.physicalEHP).toBeGreaterThan(250); // Should be ~300
        });
    });

    describe('Marginal Value Calculation', () => {
        it('should calculate marginal EHP value of +1 armor', () => {
            const stats = { ...DEFAULT_STATS, hp: 100, armor: 50 };

            const marginalValue = calculator.calculateMarginalEHPValue(stats, 'armor');

            // Should return a positive HP equivalent
            expect(marginalValue).toBeGreaterThan(0);
        });

        it('armor should provide constant EHP per point (linear scaling)', () => {
            const stats1 = { ...DEFAULT_STATS, hp: 100, armor: 10 };
            const stats2 = { ...DEFAULT_STATS, hp: 100, armor: 50 };
            const stats3 = { ...DEFAULT_STATS, hp: 100, armor: 100 };

            const value1 = calculator.calculateMarginalEHPValue(stats1, 'armor');
            const value2 = calculator.calculateMarginalEHPValue(stats2, 'armor');
            const value3 = calculator.calculateMarginalEHPValue(stats3, 'armor');

            // All should be within 20% of each other (roughly linear)
            const avg = (value1 + value2 + value3) / 3;
            expect(Math.abs(value1 - avg) / avg).toBeLessThan(0.2);
            expect(Math.abs(value2 - avg) / avg).toBeLessThan(0.2);
            expect(Math.abs(value3 - avg) / avg).toBeLessThan(0.2);
        });

        it('HP should have marginal value of exactly 1', () => {
            const stats = { ...DEFAULT_STATS, hp: 100 };

            const marginalValue = calculator.calculateMarginalEHPValue(stats, 'hp');

            // +1 HP = +1 EHP (by definition)
            expect(marginalValue).toBeCloseTo(1, 1);
        });
    });

    describe('Real-World Scenarios', () => {
        it('Tank build: high HP + armor should have massive EHP', () => {
            const tank = { ...DEFAULT_STATS, hp: 200, armor: 150, resistance: 25 };

            const result = calculator.calculateEHP(tank);

            // Should have 300+ mixed EHP (actual: ~308)
            expect(result.mixedEHP).toBeGreaterThan(300);
        });

        it('Evasive build: high evasion should double+ EHP', () => {
            const dodge = { ...DEFAULT_STATS, hp: 100, evasion: 100, armor: 0 };

            const result = calculator.calculateEHP(dodge, { accuracy: 50 });

            // 100 evasion vs 50 accuracy = 66.7% dodge → 3x multiplier
            expect(result.physicalEHP).toBeGreaterThan(250);
        });

        it('Balanced build: moderate defenses', () => {
            const balanced = { ...DEFAULT_STATS, hp: 120, armor: 50, resistance: 20, evasion: 30 };

            const result = calculator.calculateEHP(balanced);

            // Should have 200-400 mixed EHP
            expect(result.mixedEHP).toBeGreaterThan(200);
            expect(result.mixedEHP).toBeLessThan(400);
        });
    });
});
