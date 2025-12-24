import type { StatRow } from './types';

export interface AxisValues {
  enemy: number[];
  player: number[];
}

export interface AxisMetaEntry {
  name: string;
  icon: string;
}

export const DEFAULT_AXIS_VALUES = {
  enemy: [65, 58, 60, 55, 62],
  player: [60, 54, 58, 50, 59],
} as const;

export function deriveAxisValues(
  stats: StatRow[],
  fallbackEnemy: readonly number[],
  fallbackPlayer: readonly number[],
  axes = 5,
): AxisValues {
  const normalized = stats
    .map((stat, index) => ({
      quest: clampValue(stat.questValue),
      hero: clampValue(stat.heroValue ?? stat.questValue),
      fallbackIndex: index,
    }))
    .filter((entry) => entry.quest > 0 || entry.hero > 0)
    .slice(0, axes);

  const enemy: number[] = [];
  const player: number[] = [];
  for (let i = 0; i < axes; i += 1) {
    if (normalized[i]) {
      enemy.push(normalized[i].quest);
      player.push(normalized[i].hero);
    } else {
      enemy.push(fallbackEnemy[i % fallbackEnemy.length] ?? 0);
      player.push(fallbackPlayer[i % fallbackPlayer.length] ?? 0);
    }
  }
  return { enemy, player };
}

export function deriveAxisMeta(
  stats: StatRow[],
  fallbackMeta: readonly AxisMetaEntry[],
  axes = 5,
): AxisMetaEntry[] {
  const normalized = stats
    .map((stat, index) => ({
      name: (stat.name ?? '').trim() || fallbackMeta[index % fallbackMeta.length]?.name || `Stat ${index + 1}`,
      icon: fallbackMeta[index % fallbackMeta.length]?.icon ?? '✦',
    }))
    .filter((entry) => !!entry.name)
    .slice(0, axes);

  const result: AxisMetaEntry[] = [];
  for (let i = 0; i < axes; i += 1) {
    result.push(normalized[i] ?? fallbackMeta[i % fallbackMeta.length]);
  }
  return result;
}

export interface AxisRandomizationOptions {
  min?: number;
  max?: number;
  variance?: number;
}

export function randomizeAxisValues(
  base: AxisValues,
  { min = 20, max = 95, variance = 30 }: AxisRandomizationOptions = {},
): AxisValues {
  const clampMin = clampValue(min);
  const clampMax = clampValue(Math.max(min, max));
  const getRandomBetween = (low: number, high: number) => {
    const span = Math.max(1, high - low);
    return Math.round(low + Math.random() * span);
  };
  const jitter = (value: number) => {
    const localMin = Math.max(clampMin, value - variance);
    const localMax = Math.min(clampMax, value + variance);
    const effectiveMin = localMin < localMax ? localMin : clampMin;
    const effectiveMax = localMin < localMax ? localMax : clampMax;
    return getRandomBetween(effectiveMin, effectiveMax);
  };
  return {
    enemy: base.enemy.map(jitter),
    player: base.player.map(jitter),
  };
}

function clampValue(value: number | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Number(value)));
}
