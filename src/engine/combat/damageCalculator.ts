// src/engine/combat/damageCalculator.ts
// Extracted damage calculation logic from balancing module for reuse

import type { StatBlock } from '../../balancing/types';
import { HitChanceModule } from '../../balancing/modules/hitchance';
import { MitigationModule } from '../../balancing/modules/mitigation';

export interface DamageResult {
    totalDamage: number;
    isHit: boolean;
    isCritical: boolean;
    hitChance: number;
    rawDamage: number;
}

/**
 * Calculate damage using balancing module rules
 * This is the single source of truth for damage calculation
 */
export function calculateDamage(
    attackerStats: StatBlock,
    defenderStats: StatBlock,
    rng: () => number
    ): DamageResult {
        // 1. Determine Crit/Fail status & modifiers
        const critFailRoll = rng() * 100;
    let txcModifier = 0;
    let damageMultiplier = 1.0;
    let isCritical = false;

    // Check Crit/Fail (Always active)
    if (critFailRoll < attackerStats.critChance) {
        isCritical = true;
        txcModifier = attackerStats.critTxCBonus;
        damageMultiplier = attackerStats.critMult;
    } else if (critFailRoll >= 100 - attackerStats.failChance) {
        // Critical Failure
        txcModifier = -attackerStats.failTxCMalus;
        damageMultiplier = attackerStats.failMult;
    }

    // 2. Calculate Hit Chance with modifiers
    const effectiveTxC = attackerStats.txc + txcModifier;
    const hitChance = HitChanceModule.calculateHitChance(effectiveTxC, defenderStats.evasion);

    // 3. Roll to Hit
    const hitRoll = rng() * 100;
    const isHit = hitRoll < hitChance;

    if (!isHit) {
        return {
            totalDamage: 0,
            isHit: false,
            isCritical,
            hitChance,
            rawDamage: 0
        };
    }

    // 4. Calculate Raw Damage and Apply Mitigation
    // The order depends on configApplyBeforeCrit flag
    let finalDamage: number;
    const baseDamage = attackerStats.damage;

    if (defenderStats.configApplyBeforeCrit) {
        // Option A: Mitigation BEFORE Crit
        // Calculate base mitigation first
        const mitigatedBase = MitigationModule.calculateEffectiveDamage(
            baseDamage,
            defenderStats.armor,
            defenderStats.resistance,
            attackerStats.armorPen,
            attackerStats.penPercent,
            defenderStats.configFlatFirst
        );

        // Then apply crit/fail multiplier to mitigated damage
        finalDamage = mitigatedBase * damageMultiplier;
    } else {
        // Option B: Mitigation AFTER Crit (Default, Standard RPG behavior)
        // Apply crit/fail multiplier to base damage first
        const rawDamage = baseDamage * damageMultiplier;

        // Then apply mitigation to the multiplied damage
        finalDamage = MitigationModule.calculateEffectiveDamage(
            rawDamage,
            defenderStats.armor,
            defenderStats.resistance,
            attackerStats.armorPen,
            attackerStats.penPercent,
            defenderStats.configFlatFirst
        );
    }

    return {
        totalDamage: Math.round(Math.max(0, finalDamage)),
        isHit: true,
        isCritical,
        hitChance,
        rawDamage: baseDamage * damageMultiplier
    };
}
