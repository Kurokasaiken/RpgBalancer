import type { StatBlock, LockedParameter } from './types';
import { CoreModule } from './modules/core';
import { HitChanceModule } from './modules/hitchance';
import { CriticalModule } from './modules/critical';
import { MitigationModule } from './modules/mitigation';
import { CombatMetrics } from './metrics/CombatMetrics';


/**
 * Core solver for balancing calculations, handling both forward and reverse solving of stat relationships.
 */
export class BalancingSolver {
    /**
 * Solves for stat changes, handling both base stat changes and derived stat adjustments with locking.
 */
static solve(
        currentStats: StatBlock,
        changedParam: keyof StatBlock,
        newValue: number,
        lockedParam: LockedParameter
    ): StatBlock {
        const result = { ...currentStats };

        // 1. Update the changed parameter
        if (changedParam === 'configFlatFirst' || changedParam === 'configApplyBeforeCrit') {
            (result as any)[changedParam] = !!newValue;
        } else {
            result[changedParam] = newValue;
        }

        // 2. REVERSE SOLVER (Handle changes to derived stats)
        if (changedParam === 'htk') {
            if (lockedParam === 'hp') {
                result.damage = CoreModule.calculateDamageForHTK(result.hp, newValue);
            } else if (lockedParam === 'damage') {
                result.hp = CoreModule.calculateHpForHTK(result.damage, newValue);
            } else {
                result.damage = CoreModule.calculateDamageForHTK(result.hp, newValue);
            }
        }
        else if (changedParam === 'hitChance') {
            if (lockedParam === 'txc') {
                result.evasion = 50 + result.txc - newValue;
            } else {
                result.txc = newValue - 50 + result.evasion;
            }
        }
        else if (changedParam === 'attacksPerKo') {
            if (newValue > 0) {
                const currentHTK = CoreModule.calculateHTK(result.hp, result.damage);
                const targetHitChance = (currentHTK / newValue) * 100;
                const clampedHitChance = Math.max(0, Math.min(100, targetHitChance));

                if (lockedParam === 'txc') {
                    result.evasion = 50 + result.txc - clampedHitChance;
                } else {
                    result.txc = clampedHitChance - 50 + result.evasion;
                }
            }
        }
        else if (changedParam === 'effectiveDamage') {
            const effArmor = Math.max(0, result.armor - result.armorPen);
            const effResPercent = result.resistance * (1 - (result.penPercent / 100));
            const effResFactor = Math.max(0, Math.min(1, effResPercent / 100));

            if (result.configFlatFirst) {
                const resistDivisor = Math.max(0.001, 1 - effResFactor);
                const beforeResist = newValue / resistDivisor;
                result.damage = beforeResist + effArmor;
            } else {
                const beforeArmor = newValue + effArmor;
                const resistDivisor = Math.max(0.001, 1 - effResFactor);
                result.damage = beforeArmor / resistDivisor;
            }
            result.damage = Math.max(1, result.damage);
        }
        // New Metrics Reverse Solving
        else if (changedParam === 'earlyImpact') {
            const currentEI = CombatMetrics.calculateEarlyImpact(currentStats, currentStats);
            if (currentEI > 0) {
                const ratioEI = newValue / currentEI;
                result.damage = Math.max(1, currentStats.damage * ratioEI);
            }
        }
        else if (changedParam === 'edpt') {
            const currentEDPT = CombatMetrics.calculateEDPT(currentStats, currentStats);
            if (currentEDPT > 0) {
                const ratioEDPT = newValue / currentEDPT;
                result.damage = Math.max(1, currentStats.damage * ratioEDPT);
            }
        }
        else if (changedParam === 'ttk') {
            const currentEDPT_TTK = CombatMetrics.calculateEDPT(currentStats, currentStats);
            if (currentEDPT_TTK > 0) {
                result.hp = Math.max(1, Math.round(newValue * currentEDPT_TTK));
            }
        }


        // 3. FORWARD SOLVER (Handle Locks when base stats change)
        const isDerivedChange = changedParam === 'htk' || changedParam === 'hitChance' || changedParam === 'attacksPerKo' || changedParam === 'effectiveDamage' || changedParam === 'edpt' || changedParam === 'ttk' || changedParam === 'earlyImpact';

        if (!isDerivedChange && lockedParam !== 'none' && changedParam !== lockedParam) {
            if (lockedParam === 'htk') {
                if (changedParam === 'hp') {
                    result.damage = CoreModule.calculateDamageForHTK(result.hp, result.htk);
                } else if (changedParam === 'damage') {
                    result.hp = CoreModule.calculateHpForHTK(result.damage, result.htk);
                }
            }
            else if (lockedParam === 'attacksPerKo') {
                if (changedParam === 'armor') {
                    const delta = newValue - currentStats.armor;
                    result.armorPen = Math.max(0, currentStats.armorPen + delta);
                }
                else if (changedParam === 'resistance') {
                    const delta = newValue - currentStats.resistance;
                    result.penPercent = Math.max(0, Math.min(100, currentStats.penPercent + delta));
                }
                else if (changedParam === 'txc') {
                    const oldHitChance = 50 + currentStats.txc - currentStats.evasion;
                    result.evasion = result.txc + 50 - oldHitChance;
                }
            }
        }

        // 4. FINAL RECALCULATION
        // Always recalculate derived stats to ensure consistency
        result.htk = CoreModule.calculateHTK(result.hp, result.damage);
        result.hitChance = HitChanceModule.calculateHitChance(result.txc, result.evasion);

        // Recalculate effectiveDamage
        result.effectiveDamage = MitigationModule.calculateEffectiveDamage(
            result.damage,
            result.armor,
            result.resistance,
            result.armorPen,
            result.penPercent,
            result.configFlatFirst
        );

        // Recalculate Complex Derived Stats (Effective Chance, Avg Dmg, APK)
        const effectiveChance = CriticalModule.calculateEffectiveHitChance(
            result.txc, result.evasion, result.critChance, result.critTxCBonus, result.failChance, result.failTxCMalus
        );

        const avgEffectiveDamage = MitigationModule.calculateAverageEffectiveDamage(
            result.damage,
            result.critChance, result.critMult, result.failChance, result.failMult,
            result.armor, result.resistance, result.armorPen, result.penPercent,
            result.configFlatFirst, result.configApplyBeforeCrit
        );

        // APK Calculation
        const chanceFactor = effectiveChance / 100;
        const denominator = chanceFactor * avgEffectiveDamage;

        if (denominator <= 0) result.attacksPerKo = 999;
        else result.attacksPerKo = result.hp / denominator;

        // Recalculate Combat Metrics
        result.edpt = CombatMetrics.calculateEDPT(result, result);
        result.ttk = CombatMetrics.calculateTTK(result.hp, result.edpt);
        result.earlyImpact = CombatMetrics.calculateEarlyImpact(result, result);

        return result;
    }

    /**
     * Recalculates all derived stats and metrics for a given stat block.
     * Useful for initialization or validation.
     */
    static recalculate(stats: StatBlock): StatBlock {
        // We can reuse solve with a dummy change to trigger full recalculation
        // Or just implement it directly. Direct is safer/cleaner.
        const newStats = { ...stats };

        // 1. Recalculate Derived Stats (Standard)
        newStats.htk = CoreModule.calculateHTK(newStats.hp, newStats.damage);
        newStats.hitChance = HitChanceModule.calculateHitChance(newStats.txc, newStats.evasion);

        newStats.effectiveDamage = MitigationModule.calculateEffectiveDamage(
            newStats.damage,
            newStats.armor,
            newStats.resistance,
            newStats.armorPen,
            newStats.penPercent,
            newStats.configFlatFirst
        );

        // Complex Stats
        const effectiveChance = CriticalModule.calculateEffectiveHitChance(
            newStats.txc, newStats.evasion, newStats.critChance, newStats.critTxCBonus, newStats.failChance, newStats.failTxCMalus
        );

        const avgEffectiveDamage = MitigationModule.calculateAverageEffectiveDamage(
            newStats.damage,
            newStats.critChance, newStats.critMult, newStats.failChance, newStats.failMult,
            newStats.armor, newStats.resistance, newStats.armorPen, newStats.penPercent,
            newStats.configFlatFirst, newStats.configApplyBeforeCrit
        );

        const chanceFactor = effectiveChance / 100;
        const denominator = chanceFactor * avgEffectiveDamage;

        if (denominator <= 0) newStats.attacksPerKo = 999;
        else newStats.attacksPerKo = newStats.hp / denominator;

        // 2. Recalculate Combat Metrics
        newStats.edpt = CombatMetrics.calculateEDPT(newStats, newStats);
        newStats.ttk = CombatMetrics.calculateTTK(newStats.hp, newStats.edpt);
        newStats.earlyImpact = CombatMetrics.calculateEarlyImpact(newStats, newStats);

        return newStats;
    }
}
