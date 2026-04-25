import type { IdleVillageConfig } from '@/balancing/config/idleVillage/types';

const DEFAULT_SECONDS_PER_TIME_UNIT = 1;
const DEFAULT_DAY_LENGTH = 5;

export interface CycleConfigSnapshot {
  secondsPerTimeUnit: number;
  dayTimeUnits: number;
  nightTimeUnits: number;
  totalCycleUnits: number;
  totalCycleSeconds: number;
}

export interface CycleStateSnapshot {
  isDayPhase: boolean;
  phaseLabel: string;
  phaseIcon: string;
  progressFraction: number;
  elapsedSeconds: number;
}

/**
 * Resolves the cycle configuration from IdleVillageConfig, ensuring sane defaults with no magic numbers.
 */
export function deriveCycleConfig(config: IdleVillageConfig): CycleConfigSnapshot {
  const secondsPerTimeUnit = config.globalRules.secondsPerTimeUnit ?? DEFAULT_SECONDS_PER_TIME_UNIT;
  const dayLengthSetting = config.globalRules.dayLengthInTimeUnits ?? DEFAULT_DAY_LENGTH;
  const dayNight = config.globalRules.dayNightCycle ?? {
    dayTimeUnits: dayLengthSetting,
    nightTimeUnits: dayLengthSetting,
  };

  const dayTimeUnits = Math.max(1, dayNight.dayTimeUnits ?? dayLengthSetting);
  const nightTimeUnits = Math.max(1, dayNight.nightTimeUnits ?? dayLengthSetting);
  const totalCycleUnits = Math.max(1, dayTimeUnits + nightTimeUnits);
  const totalCycleSeconds = totalCycleUnits * secondsPerTimeUnit;

  return {
    secondsPerTimeUnit,
    dayTimeUnits,
    nightTimeUnits,
    totalCycleUnits,
    totalCycleSeconds,
  };
}

/**
 * Computes derivations (phase/halo/progress) for the given time cursor.
 */
export function deriveCycleState(
  configSnapshot: CycleConfigSnapshot,
  currentTimeUnits: number,
): CycleStateSnapshot {
  const normalizedTimeUnits = Math.max(0, currentTimeUnits);
  const cycleUnit = normalizedTimeUnits % configSnapshot.totalCycleUnits;
  const isDayPhase = cycleUnit < configSnapshot.dayTimeUnits;
  const phaseLabel = isDayPhase ? 'Fase giorno' : 'Fase notte';
  const phaseIcon = isDayPhase ? '☀️' : '🌙';
  const progressFraction =
    configSnapshot.totalCycleUnits > 0 ? cycleUnit / configSnapshot.totalCycleUnits : 0;
  const elapsedSeconds = progressFraction * configSnapshot.totalCycleSeconds;

  return {
    isDayPhase,
    phaseLabel,
    phaseIcon,
    progressFraction,
    elapsedSeconds,
  };
}
