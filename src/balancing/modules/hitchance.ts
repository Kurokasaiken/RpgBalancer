import { BALANCING_CONFIG } from '../balancingConfig';

/**
 * HitChance Module - Hit chance and accuracy calculations
 * 
 * Provides calculations for hit chance, efficiency, and consistency metrics.
 */
export const HitChanceModule = {
    /**
 * Calculates hit chance based on TxC and evasion.
 */
calculateHitChance: (txc: number, evasion: number): number => {
        // Formula: TxC + BASE - Evasione
        const chance = txc + BALANCING_CONFIG.BASE_HIT_CHANCE - evasion;
        // Clamp between MIN and MAX
        return Math.max(BALANCING_CONFIG.MIN_HIT_CHANCE, Math.min(BALANCING_CONFIG.MAX_HIT_CHANCE, chance));
    },

    /**
 * Calculates attacks per KO based on HTK and hit chance.
 */
calculateAttacksPerKo: (htkPure: number, hitChance: number): number => {
        // Formula: HTK_Pure / (HitChance / 100)
        if (hitChance <= 0) return 999;
        return htkPure / (hitChance / 100);
    },

    // Inverse calculations for locks
    /**
 * Calculates evasion required to achieve a specific hit chance.
 */
calculateEvasionForChance: (txc: number, targetChance: number): number => {
        // Chance = TxC + BASE - Ev
        // Ev = TxC + BASE - Chance
        return txc + BALANCING_CONFIG.BASE_HIT_CHANCE - targetChance;
    },

    /**
 * Calculates TxC required to achieve a specific hit chance.
 */
calculateTxcForChance: (evasion: number, targetChance: number): number => {
        // Chance = TxC + BASE - Ev
        // TxC = Chance - BASE + Ev
        return targetChance - BALANCING_CONFIG.BASE_HIT_CHANCE + evasion;
    },

    // --- Derived Stats (Efficiency & Consistency) ---

    /**
 * Calculates efficiency as the hit chance.
 */
calculateEfficiency: (txc: number, evasion: number): number => {
        return HitChanceModule.calculateHitChance(txc, evasion);
    },

    /**
 * Calculates TxC required to achieve a specific efficiency.
 */
calculateTxcFromEfficiency: (efficiency: number, evasion: number): number => {
        // Efficiency is just HitChance
        return HitChanceModule.calculateTxcForChance(evasion, efficiency);
    },

    /**
 * Calculates consistency as the probability of hitting every attack in HTK turns.
 */
calculateConsistency: (txc: number, htk: number, evasion: number): number => {
        const hitChance = HitChanceModule.calculateHitChance(txc, evasion);
        if (hitChance <= 0) return 0;
        return Math.pow(hitChance / 100, htk) * 100; // Return as percentage (0-100)
    },

    /**
 * Calculates TxC required to achieve a specific consistency.
 */
calculateTxcFromConsistency: (consistency: number, htk: number, evasion: number): number => {
        // Consistency = (Chance/100)^HTK
        // (Consistency/100) = (Chance/100)^HTK
        // (Chance/100) = (Consistency/100)^(1/HTK)
        // Chance = 100 * (Consistency/100)^(1/HTK)

        if (consistency <= 0) return -999; // Impossible to solve for 0
        const targetChance = 100 * Math.pow(consistency / 100, 1 / htk);
        return HitChanceModule.calculateTxcForChance(evasion, targetChance);
    }
};
