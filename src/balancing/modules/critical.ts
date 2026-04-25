import { CONSTANTS } from '../registry';

/**
 * Critical Module - Critical hit and failure calculations
 * 
 * Handles calculations for critical hits, failures, and their impact on hit chance and damage.
 */
export const CriticalModule = {
    /**
     * Calculates the effective hit chance considering Crit Bonus and Fail Malus.
     */
    calculateEffectiveHitChance: (
        txc: number,
        evasion: number,
        critChance: number,
        critTxCBonus: number,
        failChance: number,
        failTxCMalus: number
    ): number => {
        const base = CONSTANTS.BASE_HIT_CHANCE.value;

        // Normal Chance
        const normalChance = Math.max(0, Math.min(100, txc + base - evasion));

        // Crit Chance (with Bonus)
        const critHitChance = Math.max(0, Math.min(100, txc + critTxCBonus + base - evasion));

        // Fail Chance (with Malus)
        const failHitChance = Math.max(0, Math.min(100, txc - failTxCMalus + base - evasion));

        // Weights
        const pCrit = critChance / 100;
        const pFail = failChance / 100;
        const pNormal = Math.max(0, 1 - pCrit - pFail);

        // Weighted Average
        // Note: This represents the % of attacks that land.
        // Crit attacks land with probability critHitChance.
        // Fail attacks land with probability failHitChance.
        // Normal attacks land with probability normalChance.

        const effectiveChance = (pCrit * critHitChance) + (pFail * failHitChance) + (pNormal * normalChance);
        return effectiveChance;
    },

    /**
     * Calculates the average damage multiplier.
     */
    calculateAverageDamageMultiplier: (
        critChance: number,
        critMult: number,
        failChance: number,
        failMult: number
    ): number => {
        const pCrit = critChance / 100;
        const pFail = failChance / 100;
        const pNormal = Math.max(0, 1 - pCrit - pFail);

        return (pCrit * critMult) + (pFail * failMult) + (pNormal * 1.0);
    },

    /**
     * Calculates Attacks Per KO using the full logic.
     */
    calculateAttacksPerKo: (
        htkPure: number,
        effectiveHitChance: number,
        avgDmgMult: number
    ): number => {
        // Formula: HTK_Pure / (EffectiveChance% * AvgDmgMult)
        const chanceFactor = effectiveHitChance / 100;
        const denominator = chanceFactor * avgDmgMult;

        if (denominator <= 0) return 999;
        return htkPure / denominator;
    },

    /**
     * Calculates actual critical damage for a single hit.
     */
    calculateCriticalDamage: (baseDamage: number, multiplier: number): number => {
        return Math.floor(baseDamage * multiplier);
    }
};
