/**
 * Time of day on the /game map — pure, config-driven (`gameFrameConfig.timeOfDay.map`, Director 2026-11-11: every value
 * from config, none hard-coded). `ambient.light` 1 = full day … `nightLight` = deepest night; `warm` 0..1 = amber dawn/dusk.
 */
import type { GameFrameConfig } from '@/balancing/config/idleVillage/gameFrameConfig';

export type TimeOfDayMapConfig = GameFrameConfig['timeOfDay']['map'];
export interface Ambient { light: number; warm: number }
export const DAYLIGHT: Ambient = { light: 1, warm: 0 };

const ramp = (a: number, b: number, x: number) => (b <= a ? (x >= b ? 1 : 0) : Math.min(1, Math.max(0, (x - a) / (b - a))));

/** Light for a phase at progress `p` (0..1 through the current day or night phase). */
export function ambientForPhase(cfg: TimeOfDayMapConfig, isDayPhase: boolean, p: number): Ambient {
  const c = cfg.curve;
  const span = 1 - cfg.nightLight;
  return isDayPhase
    ? { light: 1 - span * ramp(c.dayFallStart, 1, p), warm: ramp(c.duskWarmStart, c.duskWarmPeak, p) * (1 - ramp(c.duskWarmFadeStart, 1, p)) }
    : { light: cfg.nightLight + span * ramp(c.dawnRiseStart, 1, p), warm: ramp(c.dawnWarmStart, c.dawnWarmPeak, p) * (1 - ramp(c.dawnWarmFadeStart, 1, p)) };
}

/** The night is shown only up to `maxSpeed`; faster, the map holds daylight (a night would last seconds and flicker). */
export const nightShownAt = (cfg: TimeOfDayMapConfig, speed: number): boolean => speed <= cfg.maxSpeed;

/** Speeds offered on /game: the configured list, capped by the engine's max multiplier. */
export const offeredSpeeds = (speeds: readonly number[], maxSpeedMultiplier: number): number[] => speeds.filter((s) => s <= maxSpeedMultiplier);
