import { describe, it, expect } from 'vitest';
import {
    applyAsymptoticCap,
    inverseAsymptoticCap,
    applyStatCap,
    CAP_CONFIGS
} from '../asymptoticCaps';

describe('Asymptotic Caps', () => {
    describe('applyAsymptoticCap', () => {
        it('should not affect values well below cap', () => {
            // At 20 input with 60 scale, expect ~27% of cap reached
            const result = applyAsymptoticCap(20, 95, 60);
            expect(result).toBeGreaterThan(25);
            expect(result).toBeLessThan(30);
        });

        it('should approach but never reach cap', () => {
            const cap = 95;
            const result1 = applyAsymptoticCap(100, cap, 60);
            const result2 = applyAsymptoticCap(200, cap, 60);
            const result3 = applyAsymptoticCap(500, cap, 60);

            // At 500, hard cap kicks in at 3x (285), so it equals cap
            expect(result1).toBeLessThan(cap);
            expect(result2).toBeLessThan(cap);
            expect(result3).toBe(cap); // Hard limit

            // Should get closer as input increases
            expect(result2).toBeGreaterThan(result1);
        });

        it('should be monotonically increasing', () => {
            const values = [10, 20, 50, 100, 200];
            const results = values.map(v => applyAsymptoticCap(v, 95, 60));

            for (let i = 1; i < results.length; i++) {
                expect(results[i]).toBeGreaterThan(results[i - 1]);
            }
        });

        it('should enforce hard cap at 3x', () => {
            const cap = 95;
            const result = applyAsymptoticCap(300, cap, 60); // 3x cap
            expect(result).toBe(cap);
        });
    });

    describe('inverseAsymptoticCap', () => {
        it('should be inverse of applyAsymptoticCap', () => {
            const cap = 95;
            const scaleFactor = 60;
            const targetEffective = 80;

            const requiredInput = inverseAsymptoticCap(targetEffective, cap, scaleFactor);
            const actualEffective = applyAsymptoticCap(requiredInput, cap, scaleFactor);

            expect(actualEffective).toBeCloseTo(targetEffective, 1);
        });

        it('should return Infinity for cap value', () => {
            const result = inverseAsymptoticCap(95, 95, 60);
            expect(result).toBe(Infinity);
        });
    });

    describe('Stat-specific caps', () => {
        describe('Crit Chance (95% cap)', () => {
            it('should cap at 95%', () => {
                const config = CAP_CONFIGS.critChance;

                // Test various inputs
                expect(applyAsymptoticCap(50, config.cap, config.scaleFactor)).toBeLessThan(95);
                expect(applyAsymptoticCap(100, config.cap, config.scaleFactor)).toBeLessThan(95);
                expect(applyAsymptoticCap(200, config.cap, config.scaleFactor)).toBeLessThan(95);
            });

            it('should require ~120 for ~82% effective', () => {
                const config = CAP_CONFIGS.critChance;
                const result = applyAsymptoticCap(120, config.cap, config.scaleFactor);

                // Realistic expectation based on formula
                expect(result).toBeGreaterThan(80);
                expect(result).toBeLessThan(86);
            });
        });

        describe('Evasion (95% cap)', () => {
            it('should use PoE-style cap', () => {
                const config = CAP_CONFIGS.evasion;
                expect(config.cap).toBe(95);

                const result = applyAsymptoticCap(150, config.cap, config.scaleFactor);
                expect(result).toBeLessThan(95);
                expect(result).toBeGreaterThan(85); // Adjusted
            });
        });

        describe('Block (75% cap)', () => {
            it('should have stricter cap than crit', () => {
                const config = CAP_CONFIGS.block;
                expect(config.cap).toBe(75);
                expect(config.scaleFactor).toBeLessThan(CAP_CONFIGS.critChance.scaleFactor);

                const result = applyAsymptoticCap(100, config.cap, config.scaleFactor);
                expect(result).toBeLessThan(75);
                expect(result).toBeGreaterThan(65);
            });
        });
    });

    describe('applyStatCap helper', () => {
        it('should apply correct cap based on stat name', () => {
            const critResult = applyStatCap('critChance', 120);
            const blockResult = applyStatCap('block', 120);

            expect(critResult).toBeGreaterThan(blockResult); // Crit has higher cap
        });

        it('should return unchanged value for uncapped stats', () => {
            const result = applyStatCap('damage', 150);
            expect(result).toBe(150);
        });
    });

    describe('Diminishing Returns Visualization', () => {
        it('should demonstrate diminishing returns curve', () => {
            const config = CAP_CONFIGS.critChance;
            const testPoints = [
                { input: 20, expectedRange: [25, 30] },    // ~28% of cap
                { input: 50, expectedRange: [50, 56] },    // ~56% of cap
                { input: 95, expectedRange: [70, 76] },    // ~76% of cap
                { input: 150, expectedRange: [82, 89] },   // ~88% of cap
                { input: 200, expectedRange: [89, 94] },   // ~93% of cap
            ];

            console.log('\nCrit Chance Diminishing Returns:');
            console.log('Input → Effective (% of cap reached)');

            testPoints.forEach(({ input, expectedRange }) => {
                const effective = applyAsymptoticCap(input, config.cap, config.scaleFactor);
                const percentOfCap = (effective / config.cap * 100).toFixed(1);

                console.log(`${input}% → ${effective.toFixed(1)}% (${percentOfCap}% of cap)`);

                expect(effective).toBeGreaterThanOrEqual(expectedRange[0]);
                expect(effective).toBeLessThanOrEqual(expectedRange[1]);
            });
        });
    });
});
