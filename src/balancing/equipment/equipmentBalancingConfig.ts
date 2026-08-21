/**
 * Equipment Balancing Config
 *
 * Central configuration for the Equipment Creator.
 * Follows the same pattern as spellBalancingConfig:
 * - loads default config
 * - allows PersistenceService override
 * - exposes getters for weights, ranges, descriptions, types, rarities
 */

import { z } from 'zod';
import { loadData, saveData } from '@/shared/persistence/PersistenceService';
import { getStatWeight } from '@/balancing/statWeights';
import {
  EquipmentBalancingConfigSchema,
  type EquipmentBalancingConfig,
  type EquipmentStatTick,
  type EquipmentType,
  type EquipmentRarity,
} from './equipmentTypes';

const STORAGE_KEY = 'rpg_equipment_balancing_config';

const BASE_EQUIPMENT_STATS = [
  'hp',
  'damage',
  'txc',
  'evasion',
  'critChance',
  'critMult',
  'armor',
  'resistance',
  'armorPen',
  'penPercent',
  'lifesteal',
  'regen',
  'ward',
  'block',
  'movementSpeed',
];

/**
 * Build a default tick sequence for a stat from its range and weight.
 * Each tick { value, weight } is absolute: weight = value * statWeight.
 */
function buildDefaultTicks(
  stat: string,
  range: { min: number; max: number; step: number; tickCount: number }
): EquipmentStatTick[] {
  const weight = getStatWeight(stat);
  const steps: number[] = [];
  for (let i = 0; i < range.tickCount; i++) {
    const value = range.min + i * range.step;
    if (value > range.max) break;
    steps.push(value);
  }
  if (steps.length === 0 || steps[steps.length - 1] < range.max) {
    steps.push(range.max);
  }

  // Weight is HP-equivalent * value. 0 is always free (baseline).
  return steps.map((value) => ({
    value: Math.round(value * 10) / 10,
    weight: Math.round(value * weight * 10) / 10,
  }));
}

function createDefaultConfig(): EquipmentBalancingConfig {
  const ranges: EquipmentBalancingConfig['ranges'] = {
    hp: { min: 0, max: 100, step: 5, tickCount: 6 },
    damage: { min: 0, max: 25, step: 1, tickCount: 6 },
    txc: { min: 0, max: 50, step: 5, tickCount: 6 },
    evasion: { min: 0, max: 25, step: 5, tickCount: 6 },
    critChance: { min: 0, max: 30, step: 5, tickCount: 7 },
    critMult: { min: 0, max: 2, step: 0.2, tickCount: 5 },
    armor: { min: 0, max: 50, step: 5, tickCount: 6 },
    resistance: { min: 0, max: 25, step: 5, tickCount: 6 },
    armorPen: { min: 0, max: 25, step: 5, tickCount: 6 },
    penPercent: { min: 0, max: 10, step: 2, tickCount: 6 },
    lifesteal: { min: 0, max: 10, step: 2, tickCount: 6 },
    regen: { min: 0, max: 10, step: 2, tickCount: 6 },
    ward: { min: 0, max: 25, step: 5, tickCount: 6 },
    block: { min: 0, max: 25, step: 5, tickCount: 6 },
    movementSpeed: { min: 0, max: 50, step: 10, tickCount: 6 },
  };

  const defaultTicks: EquipmentBalancingConfig['defaultTicks'] = {};
  for (const stat of BASE_EQUIPMENT_STATS) {
    const range = ranges[stat];
    if (range) {
      defaultTicks[stat] = buildDefaultTicks(stat, range);
    }
  }

  const weights: EquipmentBalancingConfig['weights'] = {};
  for (const stat of BASE_EQUIPMENT_STATS) {
    weights[stat] = getStatWeight(stat);
  }

  const descriptions: EquipmentBalancingConfig['descriptions'] = {
    hp: 'Hit points added by the item.',
    damage: 'Base damage modifier. Real damage comes from the linked skill.',
    txc: 'To-hit chance bonus.',
    evasion: 'Dodge chance.',
    critChance: 'Critical strike chance.',
    critMult: 'Critical damage multiplier bonus.',
    armor: 'Flat armor.',
    resistance: 'Percentage resistance.',
    armorPen: 'Flat armor penetration.',
    penPercent: 'Percentage penetration.',
    lifesteal: 'Percentage of damage returned as healing.',
    regen: 'HP regenerated per turn.',
    ward: 'One-time shield.',
    block: 'Block chance.',
    movementSpeed: 'Movement speed bonus.',
  };

  const types: EquipmentBalancingConfig['types'] = {
    weapon: {
      slot: 'weapon',
      grantedSkillIds: ['attack_base'],
      unlockedStats: ['damage', 'txc', 'critChance', 'critMult', 'armorPen', 'penPercent', 'lifesteal'],
      baseline: {},
    },
    armor: {
      slot: 'armor',
      unlockedStats: ['hp', 'armor', 'resistance', 'evasion', 'block', 'ward', 'regen'],
      baseline: {},
    },
    offhand: {
      slot: 'offhand',
      unlockedStats: ['damage', 'block', 'armor', 'evasion', 'txc', 'critChance', 'ward'],
      baseline: {},
    },
    trinket: {
      slot: 'trinket',
      unlockedStats: ['ward', 'critChance', 'regen', 'lifesteal', 'critMult', 'resistance'],
      baseline: {},
    },
    ring: {
      slot: 'ring',
      unlockedStats: ['hp', 'damage', 'txc', 'evasion', 'critChance', 'regen'],
      baseline: {},
    },
    mount: {
      slot: 'mount',
      unlockedStats: ['movementSpeed', 'hp', 'evasion', 'damage', 'txc', 'critChance'],
      baseline: {},
    },
  };

  const rarities: EquipmentBalancingConfig['rarities'] = {
    poor: { label: 'Poor', extraPoints: -5 },
    common: { label: 'Common', extraPoints: 0 },
    uncommon: { label: 'Uncommon', extraPoints: 10 },
    rare: { label: 'Rare', extraPoints: 25 },
    epic: { label: 'Epic', extraPoints: 50 },
    legendary: { label: 'Legendary', extraPoints: 100 },
    masterpiece: { label: 'Masterpiece', extraPoints: 150 },
  };

  return {
    version: '1.0.0',
    baseBudget: 10,
    weights,
    defaultTicks,
    ranges,
    descriptions,
    types,
    rarities,
  };
}

let cachedConfig: EquipmentBalancingConfig | null = null;

export async function loadEquipmentBalancingConfig(): Promise<EquipmentBalancingConfig> {
  if (cachedConfig) return cachedConfig;

  const defaultConfig = createDefaultConfig();

  try {
    const saved = await loadData<unknown>(STORAGE_KEY, null);
    if (saved) {
      const parsed = EquipmentBalancingConfigSchema.safeParse({ ...defaultConfig, ...saved });
      if (parsed.success) {
        cachedConfig = parsed.data;
        return cachedConfig;
      }
      console.warn('[equipmentBalancingConfig] Saved config invalid, using defaults:', parsed.error);
    }
  } catch (error) {
    console.warn('[equipmentBalancingConfig] Failed to load saved config:', error);
  }

  cachedConfig = defaultConfig;
  return cachedConfig;
}

export async function saveEquipmentBalancingConfig(config: EquipmentBalancingConfig): Promise<void> {
  const parsed = EquipmentBalancingConfigSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid equipment balancing config: ${parsed.error.message}`);
  }
  cachedConfig = parsed.data;
  await saveData(STORAGE_KEY, parsed.data);
}

export function getEquipmentBaseline(): Record<string, number> {
  return cachedConfig?.weights ?? createDefaultConfig().weights;
}

export function getEquipmentStatWeight(stat: string): number {
  return cachedConfig?.weights[stat] ?? getStatWeight(stat);
}

export function getEquipmentStatTicks(stat: string): EquipmentStatTick[] {
  return cachedConfig?.defaultTicks[stat] ?? buildDefaultTicks(stat, cachedConfig?.ranges[stat] ?? { min: 0, max: 100, step: 10, tickCount: 6 });
}

export function getEquipmentStatRange(stat: string): { min: number; max: number; step: number } {
  const range = cachedConfig?.ranges[stat];
  if (range) return { min: range.min, max: range.max, step: range.step };
  return { min: 0, max: 100, step: 1 };
}

export function getEquipmentStatDescription(stat: string): string {
  return cachedConfig?.descriptions[stat] ?? '';
}

export function getEquipmentTypeConfig(type: EquipmentType): EquipmentBalancingConfig['types']['weapon'] {
  return cachedConfig?.types[type] ?? createDefaultConfig().types[type];
}

export function getEquipmentRarityConfig(rarity: EquipmentRarity): EquipmentBalancingConfig['rarities']['common'] {
  return cachedConfig?.rarities[rarity] ?? createDefaultConfig().rarities[rarity];
}

export function getEquipmentBaseBudget(): number {
  return cachedConfig?.baseBudget ?? createDefaultConfig().baseBudget;
}
