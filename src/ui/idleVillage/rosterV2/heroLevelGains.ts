/**
 * heroLevelGains — the rows of the ceremony plate (PLAN-067 T-C1, R-234): each authored delta applied to the
 * hero's CURRENT value (`from → to`), plus max HP. Pure; stats the hero lacks are skipped.
 */
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import { HERO_LEVEL_GAINS, HERO_LEVEL_GAINS_DEFAULT } from '@/balancing/config/idleVillage/heroLevelGainsConfig';
import { STAT_DESCRIPTORS } from '@/balancing/config/idleVillage/statDescriptors';

export interface HeroLevelGainRow {
  /** Stat key, or `maxHp`. */
  key: string;
  /** i18n key of the label (namespace `idleVillage` for `maxHp`, the stat catalogue for the rest). */
  labelKey: string;
  from: number;
  to: number;
}

export function heroLevelGains(resident: ResidentState): HeroLevelGainRow[] {
  const cfg = HERO_LEVEL_GAINS[resident.id] ?? HERO_LEVEL_GAINS_DEFAULT;
  const snap = (resident.statSnapshot ?? {}) as Record<string, unknown>;
  const rows: HeroLevelGainRow[] = [];
  for (const { key, delta } of cfg.stats) {
    const from = snap[key];
    const descriptor = (STAT_DESCRIPTORS as Record<string, { labelKey: string } | undefined>)[key];
    if (typeof from === 'number' && Number.isFinite(from) && descriptor) rows.push({ key, labelKey: descriptor.labelKey, from, to: from + delta });
  }
  if (typeof resident.maxHp === 'number') rows.push({ key: 'maxHp', labelKey: 'gameFrame.heroLevel.hp', from: resident.maxHp, to: resident.maxHp + cfg.hpDelta });
  return rows;
}

const ROMAN: Array<[number, string]> = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
/** 5 → V. */
export const toRoman = (n: number): string => {
  let rest = Math.max(1, Math.floor(n));
  let out = '';
  for (const [v, s] of ROMAN) while (rest >= v) { out += s; rest -= v; }
  return out;
};
