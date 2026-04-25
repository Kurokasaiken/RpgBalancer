export const MitigationModule = {
    /**
 * Calculates effective damage after applying armor and resistance mitigation.
 */
calculateEffectiveDamage: (
        rawDamage: number,
        armor: number,
        resistance: number,
        armorPen: number,
        penPercent: number,
        flatFirst: boolean
    ): number => {
        // 1. Calculate Effective Defensive Stats
        const effArmor = Math.max(0, armor - armorPen);

        // Effective Resistance (percentage-based)
        const effResPercent = Math.max(0, resistance - penPercent);
        const effResFactor = Math.max(0, Math.min(1, effResPercent / 100)); // 0.0 to 1.0

        let damage = rawDamage;

        // 2. Apply Mitigation
        // CRITICAL CHANGE: Armor now uses Path of Exile formula
        // Formula: armor_reduction = armor / (armor + 10 * damage)
        const armorReduction = effArmor > 0 && damage > 0
            ? Math.min(0.90, effArmor / (effArmor + 10 * damage)) // Cap at 90%
            : 0;

        if (flatFirst) {
            // Apply armor reduction first (as percentage), then resistance
            damage = damage * (1 - armorReduction);
            damage = damage * (1 - effResFactor);
        } else {
            // Apply resistance first, then armor reduction
            damage = damage * (1 - effResFactor);
            damage = damage * (1 - armorReduction);
        }

        // Minimum Damage Threshold
        return Math.max(1, damage);
    },

    /**
 * Calculates average effective damage considering critical hits, failures, and mitigation order.
 */
calculateAverageEffectiveDamage: (
        baseDamage: number,
        critChance: number,
        critMult: number,
        failChance: number,
        failMult: number,
        armor: number,
        resistance: number,
        armorPen: number,
        penPercent: number,
        configFlatFirst: boolean,
        configApplyBeforeCrit: boolean
    ): number => {
        const pCrit = critChance / 100;
        const pFail = failChance / 100;
        const pNormal = Math.max(0, 1 - pCrit - pFail);

        // Case A: Mitigation BEFORE Crit (Rare, but requested as option)
        if (configApplyBeforeCrit) {
            const mitigatedBase = MitigationModule.calculateEffectiveDamage(
                baseDamage, armor, resistance, armorPen, penPercent, configFlatFirst
            );

            // Then apply Crit Multipliers to the mitigated damage
            return (pCrit * mitigatedBase * critMult) +
                (pFail * mitigatedBase * failMult) +
                (pNormal * mitigatedBase * 1.0);
        }

        // Case B: Mitigation AFTER Crit (Standard)
        else {
            // We must calculate mitigation for each scenario separately because Flat Armor works differently on different damage amounts.

            const dmgCrit = baseDamage * critMult;
            const dmgFail = baseDamage * failMult;
            const dmgNormal = baseDamage * 1.0;

            const effCrit = MitigationModule.calculateEffectiveDamage(dmgCrit, armor, resistance, armorPen, penPercent, configFlatFirst);
            const effFail = MitigationModule.calculateEffectiveDamage(dmgFail, armor, resistance, armorPen, penPercent, configFlatFirst);
            const effNormal = MitigationModule.calculateEffectiveDamage(dmgNormal, armor, resistance, armorPen, penPercent, configFlatFirst);

            return (pCrit * effCrit) + (pFail * effFail) + (pNormal * effNormal);
        }
    }
};
