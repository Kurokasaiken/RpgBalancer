import { describe, it, expect } from 'vitest';
import { HitChanceModule } from '../hitchance';

describe('HitChanceModule', () => {
    describe('calculateHitChance', () => {
        it('should calculate base chance correctly', () => {
            // 25 + 50 - 0 = 75%
            expect(HitChanceModule.calculateHitChance(25, 0)).toBe(75);
        });

        it('should clamp between 1 and 100', () => {
            expect(HitChanceModule.calculateHitChance(100, 0)).toBe(100);
            expect(HitChanceModule.calculateHitChance(-100, 0)).toBe(1);
        });
    });

    describe('calculateEfficiency', () => {
        it('should match hit chance', () => {
            expect(HitChanceModule.calculateEfficiency(25, 0)).toBe(75);
        });
    });

    describe('calculateTxcFromEfficiency', () => {
        it('should reverse solve correctly', () => {
            // Target 75% -> Need 25 TxC (if evasion 0)
            expect(HitChanceModule.calculateTxcFromEfficiency(75, 0)).toBe(25);

            // Target 85% -> Need 35 TxC
            expect(HitChanceModule.calculateTxcFromEfficiency(85, 0)).toBe(35);
        });
    });

    describe('calculateConsistency', () => {
        it('should calculate consistency for HTK 4', () => {
            // 75% chance, HTK 4
            // 0.75^4 = 0.3164 -> 31.64%
            const consistency = HitChanceModule.calculateConsistency(25, 4, 0);
            expect(consistency).toBeCloseTo(31.64, 2);
        });

        it('should be 100% at 100% hit chance', () => {
            const consistency = HitChanceModule.calculateConsistency(50, 4, 0); // 50+50=100
            expect(consistency).toBe(100);
        });
    });

    describe('calculateTxcFromConsistency', () => {
        it('should reverse solve consistency', () => {
            // Target 31.64% Consistency with HTK 4
            // Should require ~75% Hit Chance -> ~25 TxC
            const txc = HitChanceModule.calculateTxcFromConsistency(31.640625, 4, 0);
            expect(txc).toBeCloseTo(25, 1);
        });

        it('should reverse solve 100% consistency', () => {
            const txc = HitChanceModule.calculateTxcFromConsistency(100, 4, 0);
            expect(txc).toBeCloseTo(50, 1); // 50+50=100
        });
    });
});
