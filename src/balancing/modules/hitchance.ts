// import type { StatBlock } from '../types';

export const HitChanceModule = {
    calculateHitChance: (txc: number, evasion: number): number => {
        // Formula: TxC + 50 - Evasione
        let chance = txc + 50 - evasion;
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
    }
};
