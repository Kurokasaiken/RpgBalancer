// StatBlock is used in types, but here we only need numbers.
// Keeping import for future extensibility if needed, but commenting out to fix lint.
// import type { StatBlock } from '../types';

/**
 * Core Module - Basic combat calculations
 * 
 * Provides fundamental calculations for hits to kill and related metrics.
 */
export const CoreModule = {
    /**
     * Calculates Hits To Kill based on HP and damage per hit.
     */
    calculateHTK: (hp: number, damage: number): number => {
        if (damage <= 0) return 999;
        return hp / damage;
    },

    /**
     * Calculates damage per hit required to achieve a specific HTK.
     */
    calculateDamageForHTK: (hp: number, htk: number): number => {
        if (htk <= 0) return 999;
        return hp / htk;
    },

    /**
     * Calculates HP required to achieve a specific HTK with given damage.
     */
    calculateHpForHTK: (damage: number, htk: number): number => {
        return damage * htk;
    }
};
