// StatBlock is used in types, but here we only need numbers.
// Keeping import for future extensibility if needed, but commenting out to fix lint.
// import type { StatBlock } from '../types';

export const CoreModule = {
    calculateHTK: (hp: number, damage: number): number => {
        if (damage <= 0) return 999;
        return hp / damage;
    },

    calculateDamageForHTK: (hp: number, htk: number): number => {
        if (htk <= 0) return 999;
        return hp / htk;
    },

    calculateHpForHTK: (damage: number, htk: number): number => {
        return damage * htk;
    }
};
