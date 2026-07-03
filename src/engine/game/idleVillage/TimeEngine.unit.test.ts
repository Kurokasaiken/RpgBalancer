import { describe, it, expect } from 'vitest';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '../../../balancing/config/idleVillage/defaultConfig';
import type { IdleVillageConfig } from '../../../balancing/config/idleVillage/types';
import {
  advanceTime,
  createInitialVillageState,
  resolveActivityOutcome,
  scheduleActivity,
  type ResidentState,
  type ScheduledActivity,
  type TimeEngineDeps,
  type VillageState,
} from './TimeEngine';

const cloneConfig = (): IdleVillageConfig => JSON.parse(JSON.stringify(DEFAULT_IDLE_VILLAGE_CONFIG));

const createResident = (overrides: Partial<ResidentState> = {}): ResidentState => ({
  id: 'resident-1',
  status: 'available',
  fatigue: 0,
  statProfileId: 'test-profile',
  statTags: ['edge'],
  currentHp: 100,
  maxHp: 100,
  isHero: false,
  isInjured: false,
  survivalCount: 0,
  survivalScore: 0,
  ...overrides,
});

const createScheduledActivity = (overrides: Partial<ScheduledActivity> = {}): ScheduledActivity => ({
  id: 'scheduled-1',
  activityId: 'quest_city_rats',
  characterIds: ['resident-1'],
  slotId: 'village_square',
  startTime: 0,
  endTime: 1,
  status: 'completed',
  isAuto: false,
  isCompleted: true,
  snapshotDeathRisk: 0,
  ...overrides,
});

const stateWith = (resident: ResidentState, scheduled: ScheduledActivity): VillageState => {
  const state = createInitialVillageState();
  return {
    ...state,
    residents: { [resident.id]: resident },
    activities: { [scheduled.id]: scheduled },
    eventLog: [],
  };
};

describe('TimeEngine.resolveActivityOutcome', () => {
  it('removes residents that face a 100% death risk', () => {
    const config = cloneConfig();
    const deps: TimeEngineDeps = {
      config,
      rng: () => 0,
    };

    const resident = createResident({ id: 'resident-risky' });
    const scheduled = createScheduledActivity({
      id: 'act-risky',
      characterIds: [resident.id],
      snapshotDeathRisk: 1,
    });
    const state = stateWith(resident, scheduled);

    const { state: nextState, outcome } = resolveActivityOutcome(deps, state, scheduled.id);

    expect(nextState.residents[resident.id]).toBeUndefined();
    expect(outcome.fallen).toHaveLength(1);
    expect(outcome.fallen[0]).toMatchObject({ characterId: resident.id, risk: 1 });
  });

  it('applies stat bonuses when a hero survives a high-risk quest', () => {
    const config = cloneConfig();
    const deps: TimeEngineDeps = {
      config,
      rng: () => 0.99,
    };

    const highRisk = 0.5;
    const baseStat = 10;
    const resident = createResident({
      id: 'resident-hero',
      statSnapshot: { damage: baseStat },
      currentHp: 90,
    });
    const scheduled = createScheduledActivity({
      id: 'act-hero',
      characterIds: [resident.id],
      snapshotDeathRisk: highRisk,
    });
    const state = stateWith(resident, scheduled);

    const { state: nextState, outcome } = resolveActivityOutcome(deps, state, scheduled.id);

    const updatedResident = nextState.residents[resident.id];
    expect(updatedResident).toBeDefined();
    expect(outcome.survivors).toHaveLength(1);
    expect(outcome.survivors[0]).toMatchObject({
      characterId: resident.id,
      bonusApplied: true,
      heroized: true,
    });

    const multiplier = 1 + highRisk * (config.globalRules.trialOfFire?.statBonusMultiplier ?? 0);
    expect(updatedResident?.statSnapshot?.damage).toBeCloseTo(baseStat * multiplier, 3);
    expect(updatedResident?.isHero).toBe(true);
    expect(outcome.heroizedIds).toContain(resident.id);
  });

  it('does not auto-repeat when survivors are exhausted from max fatigue', () => {
    const config = cloneConfig();
    const deps: TimeEngineDeps = {
      config,
      rng: () => 0.9,
    };

    const maxFatigue = config.globalRules.maxFatigueBeforeExhausted;
    const resident = createResident({
      id: 'resident-tired',
      status: 'exhausted',
      fatigue: maxFatigue,
    });
    const scheduled = createScheduledActivity({
      id: 'act-auto',
      characterIds: [resident.id],
      snapshotDeathRisk: 0.1,
      isAuto: true,
    });
    const state = stateWith(resident, scheduled);

    const { state: nextState, outcome } = resolveActivityOutcome(deps, state, scheduled.id);

    expect(outcome.autoRescheduledId).toBeNull();
    expect(Object.keys(nextState.activities)).toHaveLength(0);
    expect(nextState.residents[resident.id]?.status).toBe('exhausted');
  });
});

describe('TimeEngine.advanceTime - TDZ regression', () => {
  it('does not throw ReferenceError when advancing time with a running activity (TDZ bug fix)', () => {
    // Regression test for TDZ bug: applyActivityFatigueProgress and applyContinuousJobTick
    // were const-arrow functions defined after the while-loop that calls them, causing
    // ReferenceError: Cannot access 'applyActivityFatigueProgress' before initialization.
    // This test ensures the fix (hoisted function declarations) prevents the crash.
    const config = cloneConfig();
    const deps: TimeEngineDeps = {
      config,
      rng: () => 0.5,
    };

    const resident = createResident({ id: 'resident-worker' });
    const state = createInitialVillageState();
    state.residents = { [resident.id]: resident };

    // Schedule a job activity that will be running during advanceTime
    const scheduleResult = scheduleActivity(deps, state, {
      activityId: 'job_chop_wood',
      characterIds: [resident.id],
      slotId: 'village_gate',
    });

    expect(scheduleResult.error).toBeUndefined();
    expect(scheduleResult.scheduledActivity).toBeDefined();

    // Advance time while the activity is running
    // Before the fix, this would throw: ReferenceError: Cannot access 'applyActivityFatigueProgress' before initialization
    const advanceResult = advanceTime(deps, scheduleResult.state, 1);

    // Verify it didn't crash (the main regression check)
    expect(advanceResult.state).toBeDefined();
    expect(advanceResult.completedActivityIds).toBeDefined();
  });
});
