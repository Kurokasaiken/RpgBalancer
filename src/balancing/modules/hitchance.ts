import { BALANCING_CONFIG } from '../balancingConfig';

export const HitChanceModule = {
    calculateHitChance: (txc: number, evasion: number): number => {
        // Formula: TxC + BASE - Evasione
        const chance = txc + BALANCING_CONFIG.BASE_HIT_CHANCE - evasion;
        // Clamp between MIN and MAX
        return Math.max(BALANCING_CONFIG.MIN_HIT_CHANCE, Math.min(BALANCING_CONFIG.MAX_HIT_CHANCE, chance));
    },

    calculateAttacksPerKo: (htkPure: number, hitChance: number): number => {
        // Formula: HTK_Pure / (HitChance / 100)
        if (hitChance <= 0) return 999;
        return htkPure / (hitChance / 100);
    },

    // Inverse calculations for locks
    calculateEvasionForChance: (txc: number, targetChance: number): number => {
        // Chance = TxC + BASE - Ev
        // Ev = TxC + BASE - Chance
        return txc + BALANCING_CONFIG.BASE_HIT_CHANCE - targetChance;
    },

    calculateTxcForChance: (evasion: number, targetChance: number): number => {
        // Chance = TxC + BASE - Ev
        // TxC = Chance - BASE + Ev
        return targetChance - BALANCING_CONFIG.BASE_HIT_CHANCE + evasion;
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
