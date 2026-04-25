export const SPELL_CORE_STATS = ['effect', 'eco', 'dangerous'] as const;

export const SPELL_ADVANCED_STATS = ['scale', 'precision'] as const;

export const SPELL_OPTIONAL_STATS = [
  'aoe',
  'cooldown',
  'range',
  'priority',
  'manaCost',
] as const;

export const DEFAULT_SPELL_STAT_ORDER = [
  ...SPELL_CORE_STATS,
  ...SPELL_ADVANCED_STATS,
  ...SPELL_OPTIONAL_STATS,
] as const;

export type SpellStatId = (typeof DEFAULT_SPELL_STAT_ORDER)[number];
