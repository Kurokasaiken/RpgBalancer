import type { TTKTarget } from './archetype/types';
import { NORMALIZED_WEIGHTS } from './statWeights';

export interface BalancePreset {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  targets?: TTKTarget[]; // Optional overrides for targets
}

/**
 * Built-in balance presets with different weight configurations for various playstyles.
 */
export const BALANCE_PRESETS: Record<string, BalancePreset> = {
  standard: {
    id: 'standard',
    name: 'Standard (Current)',
    description: 'Current baseline weights (Week 7)',
    weights: NORMALIZED_WEIGHTS,
  },
  tank_meta: {
    id: 'tank_meta',
    name: 'Tank Meta (Experimental)',
    description: 'Buffed Armor (4.0) and Nerfed Damage (6.0) to slow down combat',
    weights: {
      ...NORMALIZED_WEIGHTS,
      armor: 4.0, // Cheaper armor (was 5.0) -> More armor per budget
      damage: 6.0, // More expensive damage (was 5.0) -> Less damage per budget
      hp: 0.8, // Cheaper HP (was 1.0) -> More HP pools
    },
  },
  high_lethality: {
    id: 'high_lethality',
    name: 'High Lethality',
    description: 'Fast combat: Cheap Damage, Expensive Defense',
    weights: {
      ...NORMALIZED_WEIGHTS,
      damage: 4.0, // Cheap damage
      critMult: 8.0, // Cheap crit damage
      armor: 6.0, // Expensive armor
      hp: 1.2, // Expensive HP
    },
  },
  v1_1_experimental: {
    id: 'v1.1_experimental',
    name: 'v1.1 Experimental (Tank Buff)',
    description:
      'Tuning attempt to fix DPS dominance. Cheaper Armor (4.0), Nerfed Pen (2.0), Nerfed Damage (5.5)',
    weights: {
      ...NORMALIZED_WEIGHTS,
      armor: 4.0, // Cheaper Armor (was 5.0) -> Tanks get 25% more armor
      damage: 5.5, // More expensive Damage (was 5.0) -> DPS lose 10% damage
      armorPen: 2.0, // More expensive Flat Pen (was 1.5) -> Harder to penetrate armor
      penPercent: 100.0, // More expensive % Pen (was 80.0) -> Harder to shred tanks
    },
  },
  v1_2_hp_buff: {
    id: 'v1.2_hp_buff',
    name: 'v1.2 HP Buff',
    description: 'Massive HP Buff (0.5 cost). Armor 4.0. Damage 5.0.',
    weights: {
      ...NORMALIZED_WEIGHTS,
      hp: 0.5, // 2x HP for everyone
      armor: 4.0, // Cheaper Armor
      damage: 5.0, // Standard Damage
    },
  },
  v1_3_no_pen: {
    id: 'v1.3_no_pen',
    name: 'v1.3 No Penetration',
    description: 'Diagnostic: Penetration is effectively disabled (cost 1000x)',
    weights: {
      ...NORMALIZED_WEIGHTS,
      armorPen: 1000.0,
      penPercent: 10000.0,
    },
  },
  v1_4_armor_buff_extreme: {
    id: 'v1.4_armor_buff_extreme',
    name: 'v1.4 Armor Buff Extreme',
    description: 'Diagnostic: Armor cost 1.0 (5x cheaper)',
    weights: {
      ...NORMALIZED_WEIGHTS,
      armor: 1.0,
    },
  },
};
