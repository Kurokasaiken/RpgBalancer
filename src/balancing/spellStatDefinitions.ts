/**
 * Spell stat definitions
 * Single source of truth for spell statistics
 */

export const SPELL_STAT_DEFINITIONS = {
    core: ['effect', 'eco', 'dangerous'],
    advanced: ['scale', 'precision'],
    optional: ['aoe', 'cooldown', 'range', 'priority', 'manaCost']
} as const;

export type SpellStatCategory = keyof typeof SPELL_STAT_DEFINITIONS;
export type CoreStat = typeof SPELL_STAT_DEFINITIONS.core[number];
export type AdvancedStat = typeof SPELL_STAT_DEFINITIONS.advanced[number];
export type OptionalStat = typeof SPELL_STAT_DEFINITIONS.optional[number];
export type SpellStat = CoreStat | AdvancedStat | OptionalStat;

// Flattened array for iteration
export const ALL_SPELL_STATS: SpellStat[] = [
    ...SPELL_STAT_DEFINITIONS.core,
    ...SPELL_STAT_DEFINITIONS.advanced,
    ...SPELL_STAT_DEFINITIONS.optional
];
