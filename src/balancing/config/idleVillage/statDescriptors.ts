import type { StatBlock } from '@/balancing/types';

export type StatCategory = 'offense' | 'defense' | 'utility';
export type StatFormat = 'int' | 'percent' | 'multiplier';

export interface StatDescriptor {
  /** i18n key under the `stat` namespace, e.g. `stat.damage`. */
  labelKey: string;
  category: StatCategory;
  format: StatFormat;
}

/**
 * Player-facing stats only.
 *
 * `StatBlock` also carries derived values (hitChance, effectiveDamage, htk...),
 * balancing telemetry (edpt, ttk, earlyImpact) and config flags. None of those
 * belong in front of a player — they're intermediate numbers the balancing
 * engine computes for itself, not something a character sheet should explain.
 * A key with no entry here is never shown, on purpose: adding a stat to
 * `StatBlock` does not opt it into the UI until someone decides it should be
 * player-facing and gives it a label here.
 */
export const STAT_DESCRIPTORS: Partial<Record<keyof StatBlock, StatDescriptor>> = {
  damage: { labelKey: 'stat.damage', category: 'offense', format: 'int' },
  txc: { labelKey: 'stat.accuracy', category: 'offense', format: 'int' },
  critChance: { labelKey: 'stat.critChance', category: 'offense', format: 'percent' },
  critMult: { labelKey: 'stat.critMult', category: 'offense', format: 'multiplier' },
  armorPen: { labelKey: 'stat.armorPen', category: 'offense', format: 'int' },
  penPercent: { labelKey: 'stat.penPercent', category: 'offense', format: 'percent' },

  armor: { labelKey: 'stat.armor', category: 'defense', format: 'int' },
  resistance: { labelKey: 'stat.resistance', category: 'defense', format: 'percent' },
  evasion: { labelKey: 'stat.evasion', category: 'defense', format: 'percent' },
  block: { labelKey: 'stat.block', category: 'defense', format: 'percent' },
  ward: { labelKey: 'stat.ward', category: 'defense', format: 'int' },
  energyShield: { labelKey: 'stat.energyShield', category: 'defense', format: 'int' },
  thorns: { labelKey: 'stat.thorns', category: 'defense', format: 'int' },

  agility: { labelKey: 'stat.agility', category: 'utility', format: 'int' },
  regen: { labelKey: 'stat.regen', category: 'utility', format: 'int' },
  lifesteal: { labelKey: 'stat.lifesteal', category: 'utility', format: 'percent' },
  movementSpeed: { labelKey: 'stat.movementSpeed', category: 'utility', format: 'percent' },
  cooldownReduction: { labelKey: 'stat.cooldownReduction', category: 'utility', format: 'percent' },
  castSpeed: { labelKey: 'stat.castSpeed', category: 'utility', format: 'percent' },
};

export const STAT_CATEGORY_ORDER: StatCategory[] = ['offense', 'defense', 'utility'];

export function formatStatDisplayValue(format: StatFormat, value: number): string {
  const rounded = Math.round(value * 100) / 100;
  switch (format) {
    case 'percent':
      return `${rounded}%`;
    case 'multiplier':
      return `×${rounded}`;
    case 'int':
    default:
      return String(rounded);
  }
}
