import { TTKTarget } from './archetype/types';
import { NORMALIZED_WEIGHTS } from './statWeights';

export interface BalancePreset {
    id: string;
    name: string;
    description: string;
    weights: Record<string, number>;
    targets?: TTKTarget[]; // Optional overrides for targets
}

export const BALANCE_PRESETS: Record<string, BalancePreset> = {
    'standard': {
        id: 'standard',
        name: 'Standard (Current)',
        description: 'Current baseline weights (Week 7)',
        weights: NORMALIZED_WEIGHTS
    },
    'tank_meta': {
        id: 'tank_meta',
        name: 'Tank Meta (Experimental)',
        description: 'Buffed Armor (4.0) and Nerfed Damage (6.0) to slow down combat',
        weights: {
            ...NORMALIZED_WEIGHTS,
            armor: 4.0,   // Cheaper armor (was 5.0) -> More armor per budget
            damage: 6.0,  // More expensive damage (was 5.0) -> Less damage per budget
            hp: 0.8,      // Cheaper HP (was 1.0) -> More HP pools
        }
    },
    'high_lethality': {
        id: 'high_lethality',
        name: 'High Lethality',
        description: 'Fast combat: Cheap Damage, Expensive Defense',
        weights: {
            ...NORMALIZED_WEIGHTS,
            damage: 4.0,  // Cheap damage
            critMult: 8.0, // Cheap crit damage
            armor: 6.0,   // Expensive armor
            hp: 1.2       // Expensive HP
        }
    }
};

export class BalanceConfigManager {
    private static currentPreset: BalancePreset = BALANCE_PRESETS['standard'];

    static get activePreset(): BalancePreset {
        return this.currentPreset;
    }

    static setPreset(id: string) {
        if (BALANCE_PRESETS[id]) {
            this.currentPreset = BALANCE_PRESETS[id];
        } else {
            console.warn(`Preset ${id} not found, keeping ${this.currentPreset.id}`);
        }
    }

    static getWeights(): Record<string, number> {
        return this.currentPreset.weights;
    }
}
