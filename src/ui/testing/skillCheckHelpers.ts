/**
 * Skill Check Preview Helpers
 * 
 * Shared utilities for skill check visualization and stat management.
 */

import type { StatDefinition } from '@/balancing/config/types';
import type { StatRow } from './types';
import type { AxisMetaEntry, AxisValues } from './altVisualsAxis';

export const DEFAULT_ACTIVE_VALUE = 60;
export const AXIS_VALUE_RANGE = { min: 25, max: 95 } as const;

export const AXIS_ASSIGNMENT_PATTERNS: Record<number, number[]> = {
  1: [0, 0, 0, 0, 0],
  2: [0, 0, 0, 1, 1],
  3: [0, 0, 1, 1, 2],
  4: [0, 0, 1, 2, 3],
  5: [0, 1, 2, 3, 4],
};

interface AxisPayload {
  axisMeta: AxisMetaEntry[];
  axisValues: AxisValues;
}

/**
 * Clamps a numeric value inside [min, max] and guarantees a finite result.
 */
export function clampPercentage(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Simple deterministic hash so Monte Carlo reshuffles remain reproducible.
 */
export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

/**
 * Lightweight linear congruential generator for UI-grade randomness.
 */
export function createSeededRng(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (1664525 * state + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Shuffles an array using the provided RNG (Fisher–Yates).
 */
export function shuffleWithRng<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds the pool of selectable stats directly from the balancer config.
 */
export function buildBaseStatPool(stats: Record<string, StatDefinition> | undefined): StatDefinition[] {
  if (!stats) return [];
  return Object.values(stats).filter((stat) => stat.baseStat && !stat.isDerived && !stat.isHidden);
}

/**
 * Picks the initial slice of stats from the pool ensuring deterministic order.
 */
export function buildInitialStatsFromPool(pool: StatDefinition[], seedOverride?: string): StatRow[] {
  if (!pool.length) return [];
  const baseIds = pool.map((stat) => stat.id).sort();
  const seedSource = JSON.stringify(seedOverride ? [...baseIds, seedOverride] : baseIds);
  const rng = createSeededRng(hashString(seedSource));
  const shuffled = shuffleWithRng(pool, rng);
  return shuffled.slice(0, 5).map((stat, index) => {
    const fallback = index === 0 ? DEFAULT_ACTIVE_VALUE : 0;
    const baseValue = typeof stat.defaultValue === 'number' ? stat.defaultValue : fallback;
    const normalized = clampPercentage(baseValue);
    return {
      id: stat.id,
      name: stat.label,
      questValue: normalized,
      heroValue: normalized,
      isDetrimental: stat.isDetrimental || false,
    } satisfies StatRow;
  });
}

function getRandomAxisValue(rng: () => number) {
  const span = Math.max(1, AXIS_VALUE_RANGE.max - AXIS_VALUE_RANGE.min);
  return Math.round(AXIS_VALUE_RANGE.min + rng() * span);
}

/**
 * Maps the active stats to both axis meta (name/icon) and the values for player/enemy pillars.
 */
export function buildAxisPayload(
  stats: StatRow[],
  definitions: Record<string, StatDefinition> | undefined,
  axes = 5,
): AxisPayload | null {
  const activeStats: StatRow[] = [];
  const seen = new Set<string>();
  stats.forEach((stat) => {
    if (stat.questValue <= 0 && (stat.heroValue ?? 0) <= 0) return;
    const key = stat.id ?? `${stat.name}-${activeStats.length}`;
    if (seen.has(key)) return;
    seen.add(key);
    activeStats.push(stat);
  });

  if (!activeStats.length) {
    return null;
  }

  const limited = activeStats.slice(0, axes);
  const assignment = getAxisAssignment(limited.length, axes);
  if (!assignment.length) {
    return null;
  }

  const axisMeta: AxisMetaEntry[] = [];
  const enemyValues: number[] = [];
  const playerValues: number[] = [];
  const statValueCache = new Map<string, { enemy: number; player: number }>();

  const getOrCreateStatValues = (stat: StatRow, index: number) => {
    const key = stat.id ?? `${stat.name}-${index}`;
    if (!statValueCache.has(key)) {
      const baseSeed = hashString(`${key}-${index}`);
      const enemyRng = createSeededRng(baseSeed ^ 0xa53c5);
      const playerRng = createSeededRng((baseSeed << 5) ^ 0x1b274);
      const enemy = clampPercentage(getRandomAxisValue(enemyRng));
      const player = clampPercentage(getRandomAxisValue(playerRng));
      statValueCache.set(key, { enemy, player });
    }
    return statValueCache.get(key)!;
  };

  assignment.forEach((statIndex, axisIndex) => {
    const stat = limited[statIndex] ?? limited[0];
    const definition = stat.id ? definitions?.[stat.id] : undefined;
    const name = (stat.name ?? definition?.label ?? `Stat ${axisIndex + 1}`).trim();
    const icon = definition?.icon ?? getStatGlyph(stat.id);
    axisMeta.push({ name, icon: icon || '◆' });
    const statValues = getOrCreateStatValues(stat, statIndex);
    enemyValues.push(statValues.enemy);
    playerValues.push(statValues.player);
  });

  return {
    axisMeta,
    axisValues: { enemy: enemyValues, player: playerValues },
  };
}

/**
 * Derives the axis meta entries using the balancer config stats and cardinality rules.
 */
export function deriveCardinalAxisMeta(
  stats: StatRow[],
  definitions: Record<string, StatDefinition> | undefined,
  axes = 5,
): AxisMetaEntry[] {
  const payload = buildAxisPayload(stats, definitions, axes);
  return payload?.axisMeta ?? [];
}

/**
 * Returns the axis assignment pattern for the given amount of active stats.
 */
export function getAxisAssignment(count: number, axes = 5): number[] {
  const clamped = Math.max(0, Math.min(axes, count));
  if (clamped === 0) return [];
  if (clamped >= axes) {
    return AXIS_ASSIGNMENT_PATTERNS[axes] ?? [];
  }
  return AXIS_ASSIGNMENT_PATTERNS[clamped] ?? [];
}

// Import getStatGlyph
import { getStatGlyph } from '@/ui/shared/statIconUtils';
