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

/**
 * The whole-map multiply wash. When the baked night plates exist they own the darkening —
 * the wash then carries ONLY the dawn/dusk amber (`warm`); without plates it carries night+warm
 * (R-339: on /game `warm` was dead code — the plates' presence used to hide the wash entirely).
 * Returns the packed tint and whether the wash shows at all (receives the already-eased values).
 */
export function washGradeFor(ambient: Ambient, hasPlates: boolean): { tint: number; visible: boolean } {
  const night = hasPlates ? 0 : 1 - ambient.light;
  // Gentle: the night keeps most of the brightness so the eyes do not strain; the cool tint carries the mood.
  const r = (1 - 0.16 * night) * (1 - 0.02 * ambient.warm);
  const g = (1 - 0.14 * night) * (1 - 0.08 * ambient.warm);
  const b = (1 - 0.06 * night) * (1 - 0.22 * ambient.warm);
  const visible = hasPlates ? ambient.warm >= 0.005 : !(ambient.light > 0.995 && ambient.warm < 0.005);
  return { tint: (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255), visible };
}

/** Speeds offered on /game: the configured list, capped by the engine's max multiplier. */
export const offeredSpeeds = (speeds: readonly number[], maxSpeedMultiplier: number): number[] => speeds.filter((s) => s <= maxSpeedMultiplier);
