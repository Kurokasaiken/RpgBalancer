import type { Spell, SpellType } from '@/balancing/spellTypes';

const SPELL_TYPE_COLOR_MAP: Record<SpellType, string> = {
  damage: 'text-red-400',
  heal: 'text-green-400',
  shield: 'text-blue-400',
  buff: 'text-yellow-400',
  debuff: 'text-purple-400',
  cc: 'text-orange-400',
};

const FALLBACK_COLOR = 'text-gray-400';

/**
 * Returns the Tailwind utility class that matches the provided spell type.
 * Falls back to a neutral tone when the type is unknown (legacy data).
 */
export function getSpellTypeColor(type: Spell['type'] | string): string {
  if (!type) {
    return FALLBACK_COLOR;
  }
  return SPELL_TYPE_COLOR_MAP[type as SpellType] ?? FALLBACK_COLOR;
}

/**
 * Calculates the average damage output for a spell using the shared baseline damage.
 * The value is returned as a number so callers can decide the formatting precision.
 */
export function calculateAverageDamage(spell: Spell, baselineDamage: number): number {
  const eco = spell.eco ?? 1;
  const effectRatio = spell.effect / 100;
  return effectRatio * baselineDamage * eco;
}

/**
 * Returns a new array sorted alphabetically by spell name (case insensitive).
 * The original array is never mutated.
 */
export function sortSpellsByName(spells: Spell[]): Spell[] {
  return [...spells].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
