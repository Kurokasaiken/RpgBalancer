import { describe, it, expect } from 'vitest';
import { calculateDamage } from '../damageCalculator';
import { BASELINE_STATS } from '../../../balancing/baseline';
import type { StatBlock } from '../../../balancing/types';

describe('damageCalculator - configApplyBeforeCrit', () => {
    describe('configApplyBeforeCrit = false (default, mitigation AFTER crit)', () => {
        it('should apply crit multiplier before mitigation', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 100, // Always crit
                critMult: 2.0
            };

            const defender: StatBlock = {
                ...BASELINE_STATS,
                hp: 1000,
                armor: 50, // Will reduce damage
                resistance: 0,
                configApplyBeforeCrit: false // AFTER crit (default)
            };

            let callCount = 0;
            const rng = () => {
                callCount++;
                if (callCount === 1) return 0.01; // Crit roll (< 5%)
                return 0.5; // Hit roll
            };

            const result = calculateDamage(attacker, defender, rng);

            // Expected:
            // 1. Base damage: 100
            // 2. Crit multiplier applied FIRST: 100 × 2.0 = 200
            // 3. Mitigation applied to 200: armor reduces it
            //    PoE formula: reduction = 50 / (50 + 10×200) = 50/2050 ≈ 2.44%
            //    Effective damage: 200 × (1 - 0.0244) ≈ 195.12

            expect(result.isCritical).toBe(true);
            expect(result.isHit).toBe(true);
            expect(result.rawDamage).toBe(200); // Crit damage before mitigation
            expect(result.totalDamage).toBeGreaterThan(190); // Should be ~195
            expect(result.totalDamage).toBeLessThan(200);   // But less than raw crit
        });

        it('should apply full mitigation to crit damage', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 50,
                critChance: 100,
                critMult: 3.0 // Big crit
            };

            const defender: StatBlock = {
                ...BASELINE_STATS,
                armor: 0,
                resistance: 50, // 50% reduction
                configApplyBeforeCrit: false
            };

            let callCount = 0;
            const rng = () => {
                callCount++;
                return callCount === 1 ? 0.01 : 0.5;
            };

            const result = calculateDamage(attacker, defender, rng);

            // Expected:
            // 1. Base: 50
            // 2. Crit: 50 × 3.0 = 150
            // 3. Resistance AFTER crit: 150 × (1 - 0.5) = 75

            expect(result.isCritical).toBe(true);
            expect(result.rawDamage).toBe(150);
            expect(result.totalDamage).toBe(75);
        });
    });

    describe('configApplyBeforeCrit = true (mitigation BEFORE crit)', () => {
        it('should apply mitigation before crit multiplier', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 100,
                critMult: 2.0
            };

            const defender: StatBlock = {
                ...BASELINE_STATS,
                armor: 50,
                resistance: 0,
                configApplyBeforeCrit: true // BEFORE crit
            };

            let callCount = 0;
            const rng = () => {
                callCount++;
                return callCount === 1 ? 0.01 : 0.5;
            };

            const result = calculateDamage(attacker, defender, rng);

            // Expected:
            // 1. Base damage: 100
            // 2. Mitigation applied FIRST to base:
            //    PoE formula: reduction = 50 / (50 + 10×100) = 50/1050 ≈ 4.76%
            //    Mitigated base: 100 × (1 - 0.0476) ≈ 95.24
            // 3. Crit multiplier applied to mitigated: 95.24 × 2.0 ≈ 190.48

            expect(result.isCritical).toBe(true);
            expect(result.isHit).toBe(true);
            expect(result.totalDamage).toBeGreaterThan(185); // Should be ~190
            expect(result.totalDamage).toBeLessThan(195);   // Less than "AFTER" mode
        });

        it('should apply resistance before crit multiplier', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 50,
                critChance: 100,
                critMult: 3.0
            };

            const defender: StatBlock = {
                ...BASELINE_STATS,
                armor: 0,
                resistance: 50, // 50% reduction
                configApplyBeforeCrit: true
            };

            let callCount = 0;
            const rng = () => {
                callCount++;
                return callCount === 1 ? 0.01 : 0.5;
            };

            const result = calculateDamage(attacker, defender, rng);

            // Expected:
            // 1. Base: 50
            // 2. Resistance BEFORE crit: 50 × (1 - 0.5) = 25
            // 3. Crit on mitigated: 25 × 3.0 = 75

            expect(result.isCritical).toBe(true);
            expect(result.totalDamage).toBe(75);
        });

        it('should result in lower final damage than AFTER mode (with same stats)', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 100,
                critMult: 2.0
            };

            const defenderAfter: StatBlock = {
                ...BASELINE_STATS,
                armor: 100,
                resistance: 20,
                configApplyBeforeCrit: false // AFTER
            };

            const defenderBefore: StatBlock = {
                ...BASELINE_STATS,
                armor: 100,
                resistance: 20,
                configApplyBeforeCrit: true // BEFORE
            };

            let callCount = 0;
            const rng = () => {
                callCount++;
                return callCount % 2 === 1 ? 0.01 : 0.5; // Crit, hit
            };

            const resultAfter = calculateDamage(attacker, defenderAfter, rng);

            callCount = 0; // Reset for second call
            const resultBefore = calculateDamage(attacker, defenderBefore, rng);

            // AFTER mode: Crit(100 × 2.0 = 200) → Mitigate(200)
            // BEFORE mode: Mitigate(100) → Crit(mitigated × 2.0)

            // With armor, mitigating the higher value (200) is less effective than
            // mitigating base (100), so BEFORE mode should yield LOWER damage
            expect(resultBefore.totalDamage).toBeLessThan(resultAfter.totalDamage);
        });
    });

    describe('Non-crit attacks (should be identical regardless of flag)', () => {
        it('should produce same damage for both modes on normal hits', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 0 // Never crit
            };

            const defenderAfter: StatBlock = {
                ...BASELINE_STATS,
                armor: 50,
                resistance: 20,
                configApplyBeforeCrit: false
            };

            const defenderBefore: StatBlock = {
                ...BASELINE_STATS,
                armor: 50,
                resistance: 20,
                configApplyBeforeCrit: true
            };

            const rng = () => 0.5; // No crit, always hit

            const resultAfter = calculateDamage(attacker, defenderAfter, rng);
            const resultBefore = calculateDamage(attacker, defenderBefore, rng);

            // No crit = multiplier is 1.0 = order doesn't matter
            expect(resultAfter.totalDamage).toBe(resultBefore.totalDamage);
            expect(resultAfter.isCritical).toBe(false);
            expect(resultBefore.isCritical).toBe(false);
        });
    });

    describe('Edge cases', () => {
        it('should handle very high armor differently by mode', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 50,
                critChance: 100,
                critMult: 4.0 // Big multiplier
            };

            const defender: StatBlock = {
                ...BASELINE_STATS,
                armor: 500, // Very high armor
                resistance: 0,
                configApplyBeforeCrit: false
            };

            let callCount = 0;
            const rng = () => {
                callCount++;
                return callCount % 2 === 1 ? 0.01 : 0.5;
            };

            const resultAfter = calculateDamage(attacker, defender, rng);

            // Switch to BEFORE mode
            defender.configApplyBeforeCrit = true;
            callCount = 0;
            const resultBefore = calculateDamage(attacker, defender, rng);

            // Both should still deal damage (minimum 1)
            expect(resultAfter.totalDamage).toBeGreaterThan(0);
            expect(resultBefore.totalDamage).toBeGreaterThan(0);

            // With PoE formula and very high armor:
            // AFTER mode: Crit(50 × 4.0 = 200) → Armor reduces 200
            //   Reduction = 500/(500 + 10×200) = 500/2500 = 20%
            //   Damage ≈ 160
            // BEFORE mode: Armor reduces base 50 → Crit result
            //   Reduction = 500/(500 + 10×50) = 500/1000 = 50%
            //   Damage ≈ 25 × 4.0 = 100
            // So AFTER mode is actually HIGHER with very high armor
            expect(resultAfter.totalDamage).toBeGreaterThan(resultBefore.totalDamage);
        });

        it('should handle zero armor (pure damage)', () => {
            const attacker: StatBlock = {
                ...BASELINE_STATS,
                damage: 100,
                critChance: 100,
                critMult: 2.0
            };

            const defender: StatBlock = {
                ...BASELINE_STATS,
                armor: 0,
                resistance: 0,
                configApplyBeforeCrit: false
            };

            let callCount = 0;
            const rng = () => {
                callCount++;
                return callCount % 2 === 1 ? 0.01 : 0.5;
            };

            const resultAfter = calculateDamage(attacker, defender, rng);

            defender.configApplyBeforeCrit = true;
            callCount = 0;
            const resultBefore = calculateDamage(attacker, defender, rng);

            // No mitigation = both modes should be identical
            expect(resultAfter.totalDamage).toBe(200);
            expect(resultBefore.totalDamage).toBe(200);
        });
    });
});
