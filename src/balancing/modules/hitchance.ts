// import type { StatBlock } from '../types';

export const HitChanceModule = {
    calculateHitChance: (txc: number, evasion: number): number => {
        // Formula: TxC + 50 - Evasione
        const chance = txc + 50 - evasion;
        // Clamp between 1% and 100%
        return Math.max(1, Math.min(100, chance));
    },

    calculateAttacksPerKo: (htkPure: number, hitChance: number): number => {
        // Formula: HTK_Pure / (HitChance / 100)
        if (hitChance <= 0) return 999;
        return htkPure / (hitChance / 100);
    },

    // Inverse calculations for locks
    calculateEvasionForChance: (txc: number, targetChance: number): number => {
        // Chance = TxC + 50 - Ev
        // Ev = TxC + 50 - Chance
        return txc + 50 - targetChance;
    },

    calculateTxcForChance: (evasion: number, targetChance: number): number => {
        // Chance = TxC + 50 - Ev
        // TxC = Chance - 50 + Ev
        return targetChance - 50 + evasion;
    },

    // --- Derived Stats (Efficiency & Consistency) ---

    // Efficiency = HitChance (0-100)
    calculateEfficiency: (txc: number, evasion: number): number => {
        return HitChanceModule.calculateHitChance(txc, evasion);
    },

    calculateTxcFromEfficiency: (efficiency: number, evasion: number): number => {
        // Efficiency is just HitChance
        return HitChanceModule.calculateTxcForChance(evasion, efficiency);
    },

    // Consistency = (HitChance/100)^HTK
    calculateConsistency: (txc: number, htk: number, evasion: number): number => {
        const hitChance = HitChanceModule.calculateHitChance(txc, evasion);
        if (hitChance <= 0) return 0;
        return Math.pow(hitChance / 100, htk) * 100; // Return as percentage (0-100)
    },

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
