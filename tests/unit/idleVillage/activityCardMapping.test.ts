import { describe, it, expect } from 'vitest';
import type { IdleVillageConfig, MapSlotDefinition } from '../../../src/balancing/config/idleVillage/types';
import type { ResidentState, ScheduledActivity } from '../../../src/engine/game/idleVillage/TimeEngine';
import { resolveActionCardProps } from '../../../src/ui/idleVillage/utils/activityCardMapping';

const baseMapSlots: Record<string, MapSlotDefinition> = {
  forest_slot: {
    id: 'forest_slot',
    label: 'Forest',
    icon: '🌲',
    slotTags: ['forest'],
    isInitiallyUnlocked: true,
    x: 0.1,
    y: 0.2,
  },
  woods_slot: {
    id: 'woods_slot',
    label: 'Woods',
    icon: '🐺',
    slotTags: ['woods'],
    isInitiallyUnlocked: true,
    x: 0.4,
    y: 0.6,
  },
};

const config: IdleVillageConfig = {
  version: 'test',
  resources: {},
  activities: {
    job_gathering: {
      id: 'job_gathering',
      label: 'Gather Materials',
      description: 'Gather materials for the village',
      tags: ['job'],
      cardKind: 'job',
      slotTags: ['forest'],
      resolutionEngineId: 'job',
      durationFormula: '2',
      rewards: [{ resourceId: 'materials', amountFormula: '4' }],
      metadata: { mapSlotId: 'forest_slot' },
    },
    quest_hunt: {
      id: 'quest_hunt',
      label: 'Hunt the Beast',
      description: 'Hunt the dangerous beast in the woods',
      tags: ['quest', 'danger'],
      cardKind: 'quest',
      slotTags: ['woods'],
      resolutionEngineId: 'quest',
      durationFormula: '4',
      metadata: { mapSlotId: 'woods_slot', injuryChanceDisplay: 40, deathChanceDisplay: 10 },
      rewards: [{ resourceId: 'xp', amountFormula: '8' }],
    },
    training_focus: {
      id: 'training_focus',
      label: 'Discipline Drills',
      description: 'Focus and discipline exercises',
      tags: ['job', 'training'],
      slotTags: ['hall'],
      resolutionEngineId: 'job',
      durationFormula: '3',
    },
  },
  questTypes: {},
  mapSlots: baseMapSlots,
  passiveEffects: {},
  buildings: {},
  variance: {
    difficultyCategories: {},
    rewardCategories: {},
  },
  globalRules: {
    secondsPerTimeUnit: 60,
    startingResources: {},
    maxFatigueBeforeExhausted: 100,
    defaultActivityFatigueGain: 10,
    fatigueRecoveryPerDay: 50,
    dayLengthInTimeUnits: 5,
    dayNightCycle: { dayTimeUnits: 5, nightTimeUnits: 5 },
    fatigueYellowThreshold: 33,
    fatigueRedThreshold: 66,
    baseLightInjuryChanceAtMaxFatigue: 0.3,
    dangerInjuryMultiplierPerPoint: 0.1,
    injuryTiers: {
      light: { id: 'light', label: 'Light', recoveryTimeInDays: 1, jobEfficiencyMultiplier: 1, fatigueGainMultiplier: 1 },
      moderate: { id: 'moderate', label: 'Moderate', recoveryTimeInDays: 2, jobEfficiencyMultiplier: 1, fatigueGainMultiplier: 1 },
      severe: { id: 'severe', label: 'Severe', recoveryTimeInDays: 3, jobEfficiencyMultiplier: 1, fatigueGainMultiplier: 1 },
    },
    deathRules: {
      baseDeathChanceAtMaxDanger: 0.01,
      dangerDeathMultiplierPerPoint: 0.01,
      injuryTierMultipliers: { light: 0.5, moderate: 1, severe: 1.5 },
      questOutcomeAdjustments: { perfect: -0.02, success: -0.01, partial: 0, fail: 0.02, deadly: 0.08 },
      starvationDeathChancePerDay: 0.01,
    },
    fatigueYellowWarningCopy: 'Tired',
    fatigueRedWarningCopy: 'Exhausted',
    foodConsumptionPerResidentPerDay: 1,
    baseFoodPriceInGold: 10,
    questXpFormula: 'level * 10',
    maxActiveQuests: 3,
    questSpawnEveryNDays: 1,
    maxGlobalQuestOffers: 4,
    maxQuestOffersPerSlot: 2,
    verbToneColors: {
      neutral: '#94A3B8',
      job: '#3B82F6',
      quest: '#34D399',
      danger: '#F87171',
      system: '#38BDF8',
    },
    trialOfFire: { highRiskThreshold: 0.4, statBonusMultiplier: 0.15, heroSurvivalThreshold: 3, hpRecoveryPercent: 0.25 },
    productionScaling: {
      diminishingReturnsFactor: 0.9,
      statMultiplierPerPoint: 0.1,
      applyDiminishingToFirstWorker: false,
      maxStatMultiplier: 2,
    },
    warningThresholds: {
      fatigue: { yellowThreshold: 33, redThreshold: 66, criticalThreshold: 90 },
      food: { lowThreshold: 2, criticalThreshold: 1, starvingThreshold: 0 },
      injury: { lightThreshold: 1, moderateThreshold: 1, severeThreshold: 1, deathThreshold: 1 },
      resources: { goldLowThreshold: 5, goldCriticalThreshold: 2, materialsLowThreshold: 5 },
    },
  },
  overlaySettings: {
    enabled: true,
    defaultPosition: 'top-right',
    defaultSize: 'medium',
    defaultZoom: 1,
    alwaysOnTop: true,
    transparency: false,
    enabledWidgets: [],
    autoHideTimeoutSeconds: 0,
    showSystemTrayIcon: true,
  },
};

describe('activityCardMapping', () => {
  it('resolves job card props from config defaults', () => {
    const { cardKind, props } = resolveActionCardProps({
      activity: config.activities.job_gathering,
      config,
      currentTime: 120,
      secondsPerTimeUnit: 60,
    });

    expect(cardKind).toBe('job');
    expect(props.label).toBe('Gather Materials');
    expect(props.helperText).toBe('materials');
    expect(props.progressFraction).toBe(0);
    expect(props.variant).toBe('jade');
    expect(props.dataTestId).toBe('forest_slot-job_gathering-card');
    expect(props.injuryPercentage).toBe(0);
    expect(props.deathPercentage).toBe(0);
  });

  it('derives quest status, risk, and collect CTA metadata', () => {
    const scheduled: ScheduledActivity = {
      id: 'scheduled-1',
      activityId: 'quest_hunt',
      characterIds: ['resident-1'],
      slotId: 'woods_slot',
      startTime: 0,
      endTime: 4,
      status: 'completed',
      isAuto: false,
      isCompleted: true,
      snapshotDeathRisk: 0.2,
    };

    const { cardKind, props } = resolveActionCardProps({
      activity: config.activities.quest_hunt,
      scheduled,
      config,
      currentTime: 4,
      secondsPerTimeUnit: 60,
      onCollect: () => {},
      collectLabel: 'Riscatta',
    });

    expect(cardKind).toBe('quest');
    expect(props.status).toBe('completed');
    expect(props.onCollect).toBeDefined();
    expect(props.collectLabel).toBe('Riscatta');
    expect(props.injuryPercentage).toBe(40);
    expect(props.deathPercentage).toBe(10);
    expect(props.progressFraction).toBeCloseTo(1);
  });

  it('builds assignees list from resident records', () => {
    const residents: Record<string, ResidentState> = {
      'resident-1': {
        id: 'resident-1',
        displayName: 'Ari',
        status: 'away',
        fatigue: 10,
        currentHp: 100,
        maxHp: 100,
        statTags: ['lantern', 'moth'],
        isHero: false,
        isInjured: false,
        survivalCount: 0,
        survivalScore: 0,
      },
    };

    const scheduled: ScheduledActivity = {
      id: 'scheduled-2',
      activityId: 'job_gathering',
      characterIds: ['resident-1'],
      slotId: 'forest_slot',
      startTime: 0,
      endTime: 2,
      status: 'running',
      isAuto: false,
      isCompleted: false,
      snapshotDeathRisk: 0,
    };

    const { props } = resolveActionCardProps({
      activity: config.activities.job_gathering,
      scheduled,
      config,
      residents,
      currentTime: 1,
      secondsPerTimeUnit: 60,
    });

    expect(props.assignees).toBeDefined();
    expect(props.assignees?.[0].name).toBe('Ari');
    expect(props.assignees?.[0].statusLabel).toBe('away');
    expect(props.progressFraction).toBeCloseTo(0.5);
    expect(props.elapsedSeconds).toBe(60);
    expect(props.totalDurationSeconds).toBe(120);
  });

  it('falls back to tag inference when cardKind missing', () => {
    const { cardKind } = resolveActionCardProps({
      activity: { ...config.activities.training_focus, cardKind: undefined },
      config,
    });

    expect(cardKind).toBe('training');
  });
});
