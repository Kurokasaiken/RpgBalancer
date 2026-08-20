/**
 * Equipment Templates - Canonical base values and progression for the Equip Creator.
 *
 * Each equipment type has a default starting stat block that the creator
 * pre-loads. Any stat can be modified from this base by spending equipment
 * points. Extra points are granted by rarity/quality.
 */

import type { StatBlock } from '@/balancing/types';

export type EquipmentType =
  | 'weapon'
  | 'armor'
  | 'offhand'
  | 'trinket'
  | 'ring'
  | 'mount';

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  slot: string;
  rarity: EquipmentRarity;
  stats: Partial<StatBlock>;
  /** Optional skill granted by the item (weapons always grant their attack). */
  grantedSkillId?: string;
  description?: string;
  tags?: string[];
}

export type EquipmentRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary';

export interface EquipmentTemplate {
  type: EquipmentType;
  label: string;
  slot: string;
  baseStats: Partial<StatBlock>;
  grantedSkillId?: string;
  unlockedStats: Array<keyof StatBlock>;
}

export const EQUIPMENT_RARITY_EXTRA_POINTS: Record<EquipmentRarity, number> = {
  common: 0,
  uncommon: 10,
  rare: 25,
  epic: 50,
  legendary: 100,
};

export const EQUIPMENT_TYPE_TEMPLATES: Record<EquipmentType, EquipmentTemplate> = {
  weapon: {
    type: 'weapon',
    label: 'equipment.weapon',
    slot: 'weapon',
    grantedSkillId: 'attack_base',
    baseStats: {
      damage: 0,
      txc: 25,
      critChance: 5,
      armorPen: 0,
      penPercent: 0,
    },
    unlockedStats: [
      'damage',
      'txc',
      'critChance',
      'critMult',
      'armorPen',
      'penPercent',
      'lifesteal',
    ],
  },
  armor: {
    type: 'armor',
    label: 'equipment.armor',
    slot: 'armor',
    baseStats: {
      hp: 20,
      armor: 5,
      resistance: 0,
      evasion: 0,
      block: 0,
      ward: 0,
    },
    unlockedStats: [
      'hp',
      'armor',
      'resistance',
      'evasion',
      'block',
      'ward',
      'regen',
    ],
  },
  offhand: {
    type: 'offhand',
    label: 'equipment.offhand',
    slot: 'offhand',
    baseStats: {
      damage: 0,
      block: 5,
      armor: 2,
      evasion: 5,
    },
    unlockedStats: [
      'damage',
      'block',
      'armor',
      'evasion',
      'txc',
      'critChance',
      'ward',
    ],
  },
  trinket: {
    type: 'trinket',
    label: 'equipment.trinket',
    slot: 'trinket',
    baseStats: {
      ward: 5,
      critChance: 3,
      regen: 1,
    },
    unlockedStats: [
      'ward',
      'critChance',
      'regen',
      'lifesteal',
      'critMult',
      'resistance',
    ],
  },
  ring: {
    type: 'ring',
    label: 'equipment.ring',
    slot: 'ring',
    baseStats: {
      hp: 5,
      damage: 1,
      txc: 3,
    },
    unlockedStats: [
      'hp',
      'damage',
      'txc',
      'evasion',
      'critChance',
      'regen',
    ],
  },
  mount: {
    type: 'mount',
    label: 'equipment.mount',
    slot: 'mount',
    baseStats: {
      movementSpeed: 10,
      hp: 10,
      evasion: 5,
    },
    unlockedStats: [
      'movementSpeed',
      'hp',
      'evasion',
      'damage',
      'txc',
      'critChance',
    ],
  },
};

export const ALL_EQUIPMENT_TYPES: EquipmentType[] = Object.keys(
  EQUIPMENT_TYPE_TEMPLATES
) as EquipmentType[];

export const EQUIPMENT_RARITIES: EquipmentRarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
];

export function createEmptyEquipmentItem(type: EquipmentType): EquipmentItem {
  const template = EQUIPMENT_TYPE_TEMPLATES[type];
  return {
    id: crypto.randomUUID(),
    name: '',
    type,
    slot: template.slot,
    rarity: 'common',
    stats: { ...template.baseStats },
    grantedSkillId: template.grantedSkillId,
    tags: [type, 'common'],
  };
}
