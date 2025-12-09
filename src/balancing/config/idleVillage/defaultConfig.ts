// src/balancing/config/idleVillage/defaultConfig.ts
// Minimal default IdleVillageConfig. Intentionally almost empty so that
// all domain content is authored via config/UI rather than hardcoded here.

import type { IdleVillageConfig } from './types';

export const DEFAULT_IDLE_VILLAGE_CONFIG: IdleVillageConfig = {
  version: '1.0.0',
  resources: {},
  activities: {},
  mapSlots: {},
  buildings: {},
  founders: {},
  variance: {
    difficultyCategories: {},
    rewardCategories: {},
  },
  globalRules: {
    // These numbers are safe placeholders and should be tuned via config/UI.
    maxFatigueBeforeExhausted: 100,
    fatigueRecoveryPerDay: 50,
    dayLengthInTimeUnits: 100,
    fatigueYellowThreshold: 33,
    fatigueRedThreshold: 66,
    baseLightInjuryChanceAtMaxFatigue: 0.3,
    dangerInjuryMultiplierPerPoint: 0.1,
    // Simple base formula, expected to be overridden from the config UI.
    questXpFormula: 'level * 10',
    maxActiveQuests: 5,
  },
};
