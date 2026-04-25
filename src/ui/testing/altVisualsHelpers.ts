/**
 * Alt Visuals Helpers
 * 
 * Shared utilities for alt visuals components.
 */

import type { StatRow } from './types';

export interface CanvasStat {
  name: string;
  value: number; // 0-20 scale
  color: string;
}

export const DEFAULT_CANVAS_WIDTH = 600;
export const DEFAULT_CANVAS_HEIGHT = 400;
export const MAX_STAT_VALUE = 20;

const FALLBACK_STATS: CanvasStat[] = [
  { name: 'STR', value: 14, color: '#f87171' },
  { name: 'DEX', value: 10, color: '#34d399' },
  { name: 'INT', value: 12, color: '#60a5fa' },
];

const COLOR_PALETTE = ['#f87171', '#34d399', '#60a5fa', '#c084fc', '#facc15'];

export function deriveAltVisualsV3Stats(stats: StatRow[]): CanvasStat[] {
  const mapped = stats
    .filter((stat) => stat.questValue > 0)
    .slice(0, 3)
    .map((stat, index) => ({
      name: stat.name,
      value: Math.max(2, Math.round((stat.questValue / 100) * MAX_STAT_VALUE)),
      color: COLOR_PALETTE[index % COLOR_PALETTE.length],
    }));

  if (mapped.length >= 3) {
    return mapped;
  }

  const needed = 3 - mapped.length;
  return [...mapped, ...FALLBACK_STATS.slice(0, needed)];
}
