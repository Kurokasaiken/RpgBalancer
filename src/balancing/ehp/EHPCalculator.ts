import type { StatBlock } from '../types';

/**
 * EHP Calculator - Path of Exile Methodology
 * 
 * Calculates Effective Health Pool (EHP) considering:
 * - Armor (damage-dependent reduction)
 * - Resistance (percentage-based)
 * - Evasion (asymptotic cap at 95%)
 * - Block (asymptotic cap at 75%)
 * 
 * Key Insight: Defensive stats provide LINEAR EHP gains, not diminishing returns!
 * Formula: EHP = Raw HP / (1 - Total Damage Reduction)
 */

export interface EHPResult {
    baseHP: number;
    physicalEHP: number;
    magicalEHP: number;
    mixedEHP: number;
    effectiveArmorReduction: number;
    effectiveResistanceReduction: number;
    effectiveEvasionChance: number;
}

export class EHPCalculator {
    // Default enemy damage profile for balancing
    private readonly DEFAULT_PHYSICAL_HIT = 20; // Average physical damage per hit
    private readonly DEFAULT_ENEMY_ACCURACY = 50; // Enemy accuracy rating

    /**
     * Calculate comprehensive EHP for a stat block
     */
    calculateEHP(stats: StatBlock, enemyDamage?: { physical?: number; magical?: number; accuracy?: number }): EHPResult {
        const physHit = enemyDamage?.physical ?? this.DEFAULT_PHYSICAL_HIT;
        const accuracy = enemyDamage?.accuracy ?? this.DEFAULT_ENEMY_ACCURACY;

        const baseHP = stats.hp;

        // Calculate mitigation layers
        const armorReduction = this.calculateArmorReduction(stats.armor, physHit);
        const resistanceReduction = this.calculateResistanceReduction(stats.resistance);
        const evasionChance = this.calculateEvasionChance(stats.evasion, accuracy);

        // Physical EHP: HP / (1 - armor reduction) * (1 / (1 - evasion))
        const physicalEHP = (baseHP / (1 - armorReduction)) * (1 / (1 - evasionChance));

        // Magical EHP: HP / (1 - resistance) * (1 / (1 - evasion))
        const magicalEHP = (baseHP / (1 - resistanceReduction)) * (1 / (1 - evasionChance));

        // Mixed EHP: Average of both
        const mixedEHP = (physicalEHP + magicalEHP) / 2;

        return {
            baseHP,
            physicalEHP,
            magicalEHP,
            mixedEHP,
            effectiveArmorReduction: armorReduction,
            effectiveResistanceReduction: resistanceReduction,
            effectiveEvasionChance: evasionChance
        };
    }

    /**
     * CRITICAL FORMULA: Armor provides damage-dependent reduction
     * 
     * Based on Path of Exile formula:
     * Reduction = Armor / (Armor + 10 * Damage)
     * 
     * This means:
     * - Armor is MORE effective against small hits
     * - Armor is LESS effective against large hits
     * - Each point of armor provides constant EHP, not diminishing returns
     */
    private calculateArmorReduction(armor: number, incomingDamage: number): number {
        if (armor <= 0) return 0;
        if (incomingDamage <= 0) return 0;

        // Path of Exile formula with 10x multiplier
        const reduction = armor / (armor + 10 * incomingDamage);

        // Cap at 90% (even with infinite armor, can't fully negate damage)
        return Math.min(reduction, 0.90);
    }

    /**
     * Resistance is simple percentage-based reduction
     * Capped at 75% (standard RPG cap)
     */
    private calculateResistanceReduction(resistance: number): number {
        const reduction = resistance / 100;
        return Math.min(reduction, 0.75); // 75% cap
    }

    /**
     * Evasion uses asymptotic formula
     * 
     * Formula: Evasion / (Evasion + Accuracy)
     * Hard cap at 95% (can't dodge everything)
     */
    private calculateEvasionChance(evasion: number, accuracy: number): number {
        if (evasion <= 0) return 0;
        if (accuracy <= 0) return Math.min(0.95, evasion / 100); // Assume base 100 accuracy

        const rawChance = evasion / (evasion + accuracy);
        return Math.min(rawChance, 0.95); // 95% cap
    }

    /**
     * Calculate marginal EHP value of adding 1 more of a stat
     * This is what we'll use for dynamic weight calculation
     */
    calculateMarginalEHPValue(
        currentStats: StatBlock,
        stat: keyof StatBlock,
        enemyDamage?: { physical?: number; magical?: number; accuracy?: number }
    ): number {
        const baselineEHP = this.calculateEHP(currentStats, enemyDamage).mixedEHP;

        // Add +1 to the stat
        const modifiedStats = { ...currentStats, [stat]: (currentStats[stat] as number) + 1 };
        const modifiedEHP = this.calculateEHP(modifiedStats, enemyDamage).mixedEHP;

        return modifiedEHP - baselineEHP;
    }

    /**
     * Helper: Calculate HP equivalent of a stat
     * This is what replaces the fixed stat weights
     */
    calculateHPEquivalent(stats: StatBlock, stat: keyof StatBlock, amount: number = 1): number {
        const marginalValue = this.calculateMarginalEHPValue(stats, stat);
        return marginalValue * amount;
    }
}
