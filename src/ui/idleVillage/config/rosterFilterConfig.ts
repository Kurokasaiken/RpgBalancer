import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { StatBlock } from '@/balancing/types';
import { z } from 'zod';

/**
 * Filter operators for stat-based filtering
 */
export type FilterOperator = '>' | '<' | '=' | '>=' | '<=';

/**
 * Available stat keys for filtering (from StatBlock)
 */
export type FilterStatKey = keyof StatBlock;

/**
 * Single filter criterion
 */
export interface FilterCriterion {
  /** Stat to filter by */
  stat: FilterStatKey;
  /** Comparison operator */
  operator: FilterOperator;
  /** Threshold value */
  threshold: number;
}

/**
 * Filter configuration for roster display
 */
export interface RosterFilterConfig {
  /** i18n key for the filter option label. */
  labelKey: string;
  /** Fallback label used when the translation is not available. */
  label: string;
  /** i18n key for the filter option tooltip. */
  tooltipKey: string;
  /** Fallback tooltip used when the translation is not available. */
  tooltip: string;
  /** i18n key for the filter option description. */
  descriptionKey: string;
  /** Fallback description used when the translation is not available. */
  description: string;
}

/**
 * Zod schema for filter criterion validation
 */
export const FilterCriterionSchema = z.object({
  stat: z.string() as z.ZodType<FilterStatKey>,
  operator: z.enum(['>', '<', '=', '>=', '<=']) as z.ZodType<FilterOperator>,
  threshold: z.number(),
});

/**
 * Zod schema for filter criteria array validation
 */
export const FilterCriteriaSchema = z.array(FilterCriterionSchema);

/**
 * Available filter operators with i18n configuration
 */
export const FILTER_OPERATORS: Record<FilterOperator, RosterFilterConfig> = {
  '>': {
    labelKey: 'roster.filter.operator.greaterThan',
    label: '>',
    tooltipKey: 'roster.filter.operator.greaterThanTooltip',
    tooltip: 'Greater than',
    descriptionKey: 'roster.filter.operator.greaterThanDescription',
    description: 'Stat is greater than threshold'
  },
  '<': {
    labelKey: 'roster.filter.operator.lessThan',
    label: '<',
    tooltipKey: 'roster.filter.operator.lessThanTooltip',
    tooltip: 'Less than',
    descriptionKey: 'roster.filter.operator.lessThanDescription',
    description: 'Stat is less than threshold'
  },
  '=': {
    labelKey: 'roster.filter.operator.equals',
    label: '=',
    tooltipKey: 'roster.filter.operator.equalsTooltip',
    tooltip: 'Equals',
    descriptionKey: 'roster.filter.operator.equalsDescription',
    description: 'Stat equals threshold'
  },
  '>=': {
    labelKey: 'roster.filter.operator.greaterThanOrEqual',
    label: '>=',
    tooltipKey: 'roster.filter.operator.greaterThanOrEqualTooltip',
    tooltip: 'Greater than or equal',
    descriptionKey: 'roster.filter.operator.greaterThanOrEqualDescription',
    description: 'Stat is greater than or equal to threshold'
  },
  '<=': {
    labelKey: 'roster.filter.operator.lessThanOrEqual',
    label: '<=',
    tooltipKey: 'roster.filter.operator.lessThanOrEqualTooltip',
    tooltip: 'Less than or equal',
    descriptionKey: 'roster.filter.operator.lessThanOrEqualDescription',
    description: 'Stat is less than or equal to threshold'
  }
} as const;

/**
 * Available stat keys for filtering (subset of StatBlock)
 * Excludes config flags and derived metrics that may not be relevant for filtering
 */
export const FILTER_STAT_KEYS: FilterStatKey[] = [
  'hp',
  'damage',
  'txc',
  'evasion',
  'agility',
  'hitChance',
  'effectiveDamage',
  'htk',
  'critChance',
  'armor',
  'resistance',
  'lifesteal',
  'regen',
  'ward',
  'block'
];

/**
 * Stat display configuration with i18n keys
 */
export const STAT_DISPLAY_CONFIG: Record<FilterStatKey, RosterFilterConfig> = {
  hp: {
    labelKey: 'roster.filter.stat.hp',
    label: 'HP',
    tooltipKey: 'roster.filter.stat.hpTooltip',
    tooltip: 'Health Points',
    descriptionKey: 'roster.filter.stat.hpDescription',
    description: 'Current health points'
  },
  damage: {
    labelKey: 'roster.filter.stat.damage',
    label: 'Damage',
    tooltipKey: 'roster.filter.stat.damageTooltip',
    tooltip: 'Damage',
    descriptionKey: 'roster.filter.stat.damageDescription',
    description: 'Base damage value'
  },
  txc: {
    labelKey: 'roster.filter.stat.txc',
    label: 'TxC',
    tooltipKey: 'roster.filter.stat.txcTooltip',
    tooltip: 'To-Hit Chance',
    descriptionKey: 'roster.filter.stat.txcDescription',
    description: 'Flat to-hit chance bonus'
  },
  evasion: {
    labelKey: 'roster.filter.stat.evasion',
    label: 'Evasion',
    tooltipKey: 'roster.filter.stat.evasionTooltip',
    tooltip: 'Evasion',
    descriptionKey: 'roster.filter.stat.evasionDescription',
    description: 'Flat evasion value'
  },
  agility: {
    labelKey: 'roster.filter.stat.agility',
    label: 'Agility',
    tooltipKey: 'roster.filter.stat.agilityTooltip',
    tooltip: 'Agility',
    descriptionKey: 'roster.filter.stat.agilityDescription',
    description: 'Initiative stat for turn order'
  },
  hitChance: {
    labelKey: 'roster.filter.stat.hitChance',
    label: 'Hit Chance',
    tooltipKey: 'roster.filter.stat.hitChanceTooltip',
    tooltip: 'Hit Chance %',
    descriptionKey: 'roster.filter.stat.hitChanceDescription',
    description: 'Calculated hit chance percentage'
  },
  effectiveDamage: {
    labelKey: 'roster.filter.stat.effectiveDamage',
    label: 'Effective Damage',
    tooltipKey: 'roster.filter.stat.effectiveDamageTooltip',
    tooltip: 'Effective Damage',
    descriptionKey: 'roster.filter.stat.effectiveDamageDescription',
    description: 'Damage after mitigation'
  },
  htk: {
    labelKey: 'roster.filter.stat.htk',
    label: 'Hits to Kill',
    tooltipKey: 'roster.filter.stat.htkTooltip',
    tooltip: 'Hits to Kill',
    descriptionKey: 'roster.filter.stat.htkDescription',
    description: 'Number of hits to kill target'
  },
  critChance: {
    labelKey: 'roster.filter.stat.critChance',
    label: 'Crit Chance',
    tooltipKey: 'roster.filter.stat.critChanceTooltip',
    tooltip: 'Critical Chance %',
    descriptionKey: 'roster.filter.stat.critChanceDescription',
    description: 'Critical hit chance percentage'
  },
  armor: {
    labelKey: 'roster.filter.stat.armor',
    label: 'Armor',
    tooltipKey: 'roster.filter.stat.armorTooltip',
    tooltip: 'Armor',
    descriptionKey: 'roster.filter.stat.armorDescription',
    description: 'Flat armor value'
  },
  resistance: {
    labelKey: 'roster.filter.stat.resistance',
    label: 'Resistance',
    tooltipKey: 'roster.filter.stat.resistanceTooltip',
    tooltip: 'Resistance %',
    descriptionKey: 'roster.filter.stat.resistanceDescription',
    description: 'Damage resistance percentage'
  },
  lifesteal: {
    labelKey: 'roster.filter.stat.lifesteal',
    label: 'Lifesteal',
    tooltipKey: 'roster.filter.stat.lifestealTooltip',
    tooltip: 'Lifesteal %',
    descriptionKey: 'roster.filter.stat.lifestealDescription',
    description: 'Lifesteal percentage'
  },
  regen: {
    labelKey: 'roster.filter.stat.regen',
    label: 'Regen',
    tooltipKey: 'roster.filter.stat.regenTooltip',
    tooltip: 'Regeneration',
    descriptionKey: 'roster.filter.stat.regenDescription',
    description: 'Health regeneration per turn'
  },
  ward: {
    labelKey: 'roster.filter.stat.ward',
    label: 'Ward',
    tooltipKey: 'roster.filter.stat.wardTooltip',
    tooltip: 'Ward',
    descriptionKey: 'roster.filter.stat.wardDescription',
    description: 'Flat shield value'
  },
  block: {
    labelKey: 'roster.filter.stat.block',
    label: 'Block',
    tooltipKey: 'roster.filter.stat.blockTooltip',
    tooltip: 'Block %',
    descriptionKey: 'roster.filter.stat.blockDescription',
    description: 'Block chance percentage'
  }
} as const;

/**
 * Check if a resident matches a single filter criterion
 * 
 * @param resident - The resident to check
 * @param criterion - The filter criterion to apply
 * @returns True if the resident matches the criterion
 */
export function matchesCriterion(
  resident: ResidentState,
  criterion: FilterCriterion
): boolean {
  const { stat, operator, threshold } = criterion;
  
  // Get stat value from statSnapshot, default to 0 if missing
  const statValue = resident.statSnapshot?.[stat] ?? 0;
  
  // Handle missing or non-finite stat values
  if (typeof statValue !== 'number' || !Number.isFinite(statValue)) {
    return false;
  }
  
  switch (operator) {
    case '>':
      return statValue > threshold;
    case '<':
      return statValue < threshold;
    case '=':
      return statValue === threshold;
    case '>=':
      return statValue >= threshold;
    case '<=':
      return statValue <= threshold;
    default:
      return false;
  }
}

/**
 * Filter residents based on an array of filter criteria
 * All criteria must be satisfied (AND logic)
 * 
 * @param residents - The residents to filter
 * @param criteria - Array of filter criteria to apply
 * @returns Filtered residents matching all criteria
 */
export function filterResidents(
  residents: ResidentState[],
  criteria: FilterCriterion[]
): ResidentState[] {
  if (criteria.length === 0) {
    return residents;
  }
  
  return residents.filter((resident) =>
    criteria.every((criterion) => matchesCriterion(resident, criterion))
  );
}

/**
 * Get all available filter operators as an array for UI rendering
 */
export function getFilterOperators(): RosterFilterConfig[] {
  return Object.values(FILTER_OPERATORS);
}

/**
 * Get all available stat keys as an array for UI rendering
 */
export function getFilterStatKeys(): FilterStatKey[] {
  return FILTER_STAT_KEYS;
}

/**
 * Get display configuration for a specific stat
 */
export function getStatDisplayConfig(stat: FilterStatKey): RosterFilterConfig {
  return STAT_DISPLAY_CONFIG[stat] || {
    labelKey: 'roster.filter.stat.unknown',
    label: stat,
    tooltipKey: 'roster.filter.stat.unknownTooltip',
    tooltip: stat,
    descriptionKey: 'roster.filter.stat.unknownDescription',
    description: `Stat: ${stat}`
  };
}
