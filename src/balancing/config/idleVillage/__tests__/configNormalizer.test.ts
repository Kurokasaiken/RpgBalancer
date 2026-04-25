import { describe, it, expect } from 'vitest';
import { applyIdleVillageConfigDefaults } from '../configNormalizer';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../defaultConfig';
import type { IdleVillageConfig } from '../types';

const cloneConfig = (): IdleVillageConfig => structuredClone(DEFAULT_IDLE_VILLAGE_CONFIG);

describe('applyIdleVillageConfigDefaults', () => {
  it('fills missing activity profiles and boolean flags for legacy snapshots', () => {
    const legacyConfig = cloneConfig();
    const activity = legacyConfig.activities.job_city_rats;
    delete activity.supportsPartialResolution;
    delete activity.continuousJob;
    delete activity.supportsAutoRepeat;
    delete activity.dailyRewardProfile;
    delete activity.perTickCostProfile;

    const normalized = applyIdleVillageConfigDefaults(legacyConfig);
    const normalizedActivity = normalized.activities.job_city_rats;

    expect(normalizedActivity.supportsPartialResolution).toBe(false);
    expect(normalizedActivity.continuousJob).toBe(false);
    expect(normalizedActivity.supportsAutoRepeat).toBe(false);
    expect(normalizedActivity.dailyRewardProfile).toEqual([]);
    expect(normalizedActivity.perTickCostProfile).toEqual([]);
  });

  it('derives nightly fatigue recovery when tick metadata is absent', () => {
    const legacyConfig = cloneConfig();
    legacyConfig.globalRules = {
      ...legacyConfig.globalRules,
      dayLengthInTimeUnits: 20,
      dayNightCycle: {
        dayTimeUnits: 12,
        nightTimeUnits: 5,
      },
      fatigueRecoveryPerDay: 200,
    };
    delete legacyConfig.globalRules.ticksPerDay;
    delete legacyConfig.globalRules.ticksPerNight;
    delete legacyConfig.globalRules.fatigueRecoveryPerNightTick;
    delete legacyConfig.globalRules.productionHaltFatigueThreshold;

    const normalized = applyIdleVillageConfigDefaults(legacyConfig);

    expect(normalized.globalRules.ticksPerDay).toBe(20);
    expect(normalized.globalRules.ticksPerNight).toBe(5);
    expect(normalized.globalRules.fatigueRecoveryPerNightTick).toBeCloseTo(40);
    expect(normalized.globalRules.productionHaltFatigueThreshold).toBe(1);
  });
});
