import type { StatBlock, LockedParameter } from './types';
import { CoreModule } from './modules/core';
import { HitChanceModule } from './modules/hitchance';
import { CriticalModule } from './modules/critical';
import { MitigationModule } from './modules/mitigation';

export class BalancingSolver {
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
        // If we change a derived value (HTK, HitChance), we must adjust base values (HP, Dmg, TxC, Ev)
        // BEFORE we do any other locking logic or recalculation.

        if (changedParam === 'htk') {
            // HTK changed -> Adjust Damage or HP
            if (lockedParam === 'hp') {
                // HP locked -> Adjust Damage
                result.damage = CoreModule.calculateDamageForHTK(result.hp, newValue);
            } else if (lockedParam === 'damage') {
                // Damage locked -> Adjust HP
                result.hp = CoreModule.calculateHpForHTK(result.damage, newValue);
            } else {
                // No relevant lock -> Default to adjusting Damage (keeping HP as anchor is standard)
                result.damage = CoreModule.calculateDamageForHTK(result.hp, newValue);
            }
        }
        else if (changedParam === 'hitChance') {
            // HitChance changed -> Adjust Evasion or TxC
            // HitChance = 50 + TxC - Evasion
            // If TxC locked -> Adjust Evasion
            // Evasion = 50 + TxC - NewHitChance
            if (lockedParam === 'txc') {
                result.evasion = 50 + result.txc - newValue;
            } else {
                // Default: Adjust TxC
                // TxC = NewHitChance - 50 + Evasion
                result.txc = newValue - 50 + result.evasion;
            }
        }
        else if (changedParam === 'attacksPerKo') {
            // AttacksPerKO changed -> Need to adjust underlying stats
            // APK = HTK / (HitChance / 100)
            // This is complex because it depends on HTK (hp/dmg) and HitChance (txc-ev)
            // Simplest approach: Adjust HitChance (which adjusts TxC or Ev)
            // newAPK = HTK / (newHitChance / 100)
            // newHitChance = (HTK / newAPK) * 100

            if (newValue > 0) {
                // Calculate current HTK from hp and damage
                const currentHTK = CoreModule.calculateHTK(result.hp, result.damage);
                const targetHitChance = (currentHTK / newValue) * 100;

                // Clamp to reasonable range
                const clampedHitChance = Math.max(0, Math.min(100, targetHitChance));

                // Adjust TxC or Evasion to achieve this HitChance
                if (lockedParam === 'txc') {
                    result.evasion = 50 + result.txc - clampedHitChance;
                } else {
                    result.txc = clampedHitChance - 50 + result.evasion;
                }
            }
        }

        else if (changedParam === 'effectiveDamage') {
            // EffectiveDamage changed -> Adjust base Damage
            // This is complex because it depends on mitigation stats

            const effArmor = Math.max(0, result.armor - result.armorPen);
            const effResPercent = result.resistance * (1 - (result.penPercent / 100));
            const effResFactor = Math.max(0, Math.min(1, effResPercent / 100));

            // Solve for rawDamage given targetEffectiveDamage
            if (result.configFlatFirst) {
                // Formula: effectiveDmg = max(1, max(0, rawDmg - effArmor) * (1 - effResFactor))
                // Reverse: rawDmg = (effectiveDmg / (1 - effResFactor)) + effArmor
                const resistDivisor = Math.max(0.001, 1 - effResFactor); // Protect from division by zero
                const beforeResist = newValue / resistDivisor;
                result.damage = beforeResist + effArmor;
            } else {
                // Formula: effectiveDmg = max(1, max(0, rawDmg * (1 - effResFactor) - effArmor))
                // Reverse: rawDmg = (effectiveDmg + effArmor) / (1 - effResFactor)
                const beforeArmor = newValue + effArmor;
                const resistDivisor = Math.max(0.001, 1 - effResFactor);
                result.damage = beforeArmor / resistDivisor;
            }

            // Ensure damage is positive and reasonable
            result.damage = Math.max(1, result.damage);
        }


        // 3. FORWARD SOLVER (Handle Locks when base stats change)
        // Only run this if we didn't just do a reverse solve (i.e. if we changed a base stat)
        const isDerivedChange = changedParam === 'htk' || changedParam === 'hitChance' || changedParam === 'attacksPerKo' || changedParam === 'effectiveDamage';

        if (!isDerivedChange && lockedParam !== 'none' && changedParam !== lockedParam) {

            // HTK Locked
            if (lockedParam === 'htk') {
                if (changedParam === 'hp') {
                    result.damage = CoreModule.calculateDamageForHTK(result.hp, result.htk);
                } else if (changedParam === 'damage') {
                    result.hp = CoreModule.calculateHpForHTK(result.damage, result.htk);
                }
            }

            // HitChance Locked (Not strictly a lock in types yet, but good to handle if we add it)
            // ...

            // AttacksPerKO Locked
            else if (lockedParam === 'attacksPerKo') {
                // Simplified compensation logic for mitigation changes
                if (changedParam === 'armor') {
                    const delta = newValue - currentStats.armor;
                    result.armorPen = Math.max(0, currentStats.armorPen + delta);
                }
                else if (changedParam === 'resistance') {
                    const delta = newValue - currentStats.resistance;
                    result.penPercent = Math.max(0, Math.min(100, currentStats.penPercent + delta));
                }
                // For TxC changes, adjust Evasion to maintain HitChance (which helps maintain APK)
                else if (changedParam === 'txc') {
                    // This is an approximation. Ideally we'd solve for APK directly.
                    // But maintaining HitChance is a good proxy if Dmg/HP are constant.
                    // New TxC -> Adjust Evasion to keep HitChance constant?
                    // Wait, if APK is locked, we want APK constant.
                    // If we change TxC, HitChance changes, APK changes.
                    // So yes, we should adjust Evasion to keep HitChance constant.
                    // Old HitChance = 50 + OldTxC - OldEv
                    // New HitChance should be same.
                    // 50 + NewTxC - NewEv = 50 + OldTxC - OldEv
                    // NewEv = NewTxC - (OldTxC - OldEv)
                    const oldHitChance = 50 + currentStats.txc - currentStats.evasion;
                    result.evasion = result.txc + 50 - oldHitChance;
                }
            }

            // HP Locked (Adjust Damage if HTK changes - but HTK is derived, so this case is rare unless we have circular logic)
            else if (lockedParam === 'hp') {
                if (changedParam === 'damage') {
                    // If Damage changes and HP is locked, HTK changes. No conflict.
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

        return result;
    }
}
